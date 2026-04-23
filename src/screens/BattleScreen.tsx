import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Animated, ScrollView, Pressable, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { socketService } from '../socket/socketService';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { resultEmoji, resultLabel, coinsForResult, xpForResult, determineWinner } from '../services/gameService';
import { PREDICTION_OPTIONS } from '../utils/mockData';
import { APP_CONFIG } from '../config/constants';
import { RootStackParamList } from '../navigation/AppNavigator';
import { T } from '../config/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Battle'> };

export default function BattleScreen({ navigation }: Props) {
  const {
    scenario, currentBall, totalBalls, myPrediction, opponentPredictionId,
    timeLeft, myTotalScore, opponentTotalScore, currentBallResult, status,
    opponentName, runsScored, setMyPrediction, setOpponentPredictionId,
    setBallResult, nextBall, decrementTimer, finishGame,
  } = useGameStore();

  const { updateTokens, updateStats } = useAuthStore();

  const timerProgress = useRef(new Animated.Value(1)).current;
  const timerAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultScale = useRef(new Animated.Value(0)).current;

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [pointsFlash, setPointsFlash] = useState<{ me: number; opp: number } | null>(null);

  const stopTimer = useCallback(() => {
    if (timerAnimation.current) timerAnimation.current.stop();
    if (timerInterval.current) clearInterval(timerInterval.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerProgress.setValue(1);
    timerAnimation.current = Animated.timing(timerProgress, {
      toValue: 0, duration: APP_CONFIG.PREDICTION_TIME * 1000, useNativeDriver: false,
    });
    timerAnimation.current.start();
    timerInterval.current = setInterval(() => { useGameStore.getState().decrementTimer(); }, 1000);
  }, [stopTimer]);

  const lockPrediction = useCallback((optionId: string) => {
    if (useGameStore.getState().status !== 'predicting') return;
    if (useGameStore.getState().myPrediction) return;
    stopTimer();
    const option = PREDICTION_OPTIONS.find(o => o.id === optionId);
    if (!option) return;
    setSelectedOptionId(optionId);
    setMyPrediction({ optionId, label: option.label, icon: String(option.icon), lockedAt: Date.now() });
    socketService.submitPrediction(optionId);
  }, [stopTimer, setMyPrediction]);

  useEffect(() => {
    if (timeLeft === 0 && status === 'predicting' && !myPrediction) {
      lockPrediction(PREDICTION_OPTIONS[Math.floor(Math.random() * PREDICTION_OPTIONS.length)].id);
    }
  }, [timeLeft]);

  useEffect(() => {
    socketService.on('ballResult', (result: {
      ball: number; outcome: string; runs: number; isWicket: boolean; commentary: string;
      myPoints: number; opponentPoints: number; opponentPredictionId: string;
    }) => {
      setOpponentPredictionId(result.opponentPredictionId);
      setBallResult(
        { ball: result.ball, outcome: result.outcome as any, runs: result.runs, isWicket: result.isWicket, commentary: result.commentary },
        result.myPoints, result.opponentPoints,
      );
      setPointsFlash({ me: result.myPoints, opp: result.opponentPoints });
      resultScale.setValue(0);
      Animated.spring(resultScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
    });
    socketService.on('opponentDisconnected', () => { navigation.replace('Tabs'); });
    return () => { socketService.off('ballResult'); socketService.off('opponentDisconnected'); };
  }, []);

  useEffect(() => {
    if (status === 'predicting') {
      setSelectedOptionId(null); setPointsFlash(null);
      resultScale.setValue(0); startTimer();
    }
    return stopTimer;
  }, [status, currentBall]);

  const handleContinue = useCallback(() => {
    const { currentBall: ball, totalBalls: total, myTotalScore: myS, opponentTotalScore: oppS } = useGameStore.getState();
    if (ball >= total) {
      stopTimer();
      const winner = determineWinner(myS, oppS);
      finishGame(winner);
      const { user: u } = useAuthStore.getState();
      if (winner === 'me') {
        updateStats({ totalWins: (u?.totalWins ?? 0) + 1, winStreak: (u?.winStreak ?? 0) + 1, gamesPlayed: (u?.gamesPlayed ?? 0) + 1, xp: (u?.xp ?? 0) + xpForResult('me') });
        updateTokens(coinsForResult('me'));
      } else if (winner === 'opponent') {
        updateStats({ winStreak: 0, gamesPlayed: (u?.gamesPlayed ?? 0) + 1, xp: (u?.xp ?? 0) + xpForResult('opponent') });
        updateTokens(coinsForResult('opponent'));
      } else {
        updateStats({ gamesPlayed: (u?.gamesPlayed ?? 0) + 1, xp: (u?.xp ?? 0) + xpForResult('draw') });
        updateTokens(coinsForResult('draw'));
      }
      navigation.replace('Result');
    } else {
      nextBall();
    }
  }, [stopTimer]);

  if (!scenario) return null;

  const timerWidth = timerProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const isRevealing = status === 'revealing' && currentBallResult !== null;
  const isWaiting = status === 'waiting_opponent';
  const isPredicting = status === 'predicting';
  const runsLeft = scenario.runsNeeded - runsScored;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Score Bar */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.border }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: T.textMuted, fontSize: 10, marginBottom: 2, fontWeight: '600' }}>YOU</Text>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 22 }}>{myTotalScore}</Text>
        </View>
        <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ color: T.textSec, fontSize: 10, fontWeight: '600' }}>BALL {currentBall}/{totalBalls}</Text>
          <View style={{ width: 2, height: 16, backgroundColor: T.border, marginTop: 4 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: T.textMuted, fontSize: 10, marginBottom: 2, fontWeight: '600' }} numberOfLines={1}>
            {opponentName.toUpperCase().slice(0, 10)}
          </Text>
          <Text style={{ color: T.textSec, fontWeight: '800', fontSize: 22 }}>{opponentTotalScore}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Scenario Context */}
        <View style={{ margin: 16, backgroundColor: T.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, ...T.shadowSm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: scenario.battingTeamColor, marginRight: 6 }} />
              <Text style={{ color: T.text, fontWeight: '700', fontSize: 15 }}>{scenario.battingTeam}</Text>
            </View>
            <Text style={{ color: T.textMuted, fontSize: 11 }}>Over {scenario.overNumber}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: T.text, fontWeight: '700', fontSize: 15 }}>{scenario.bowlingTeam}</Text>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: scenario.bowlingTeamColor, marginLeft: 6 }} />
            </View>
          </View>

          <View style={{ backgroundColor: T.primaryLight, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10 }}>
            <Text style={{ color: T.primaryDark, fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
              {scenario.runsNeeded > 0
                ? `Needs ${runsLeft > 0 ? runsLeft : 0} off ${scenario.ballsRemaining - currentBall + 1} balls`
                : scenario.context}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <Text style={{ color: T.textSec, fontSize: 12 }}>🏏 {scenario.strikerName}</Text>
            <Text style={{ color: T.textSec, fontSize: 12 }}>🎳 {scenario.bowlerName}</Text>
          </View>
        </View>

        {/* Ball Tracker */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 16 }}>
          {Array.from({ length: totalBalls }).map((_, i) => {
            const n = i + 1;
            const isCurrent = n === currentBall;
            const isPast = n < currentBall;
            return (
              <View key={i} style={{
                width: 36, height: 36, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isCurrent ? T.primary : isPast ? T.primaryLight : T.card,
                borderWidth: 1,
                borderColor: isCurrent ? T.primary : isPast ? T.primary + '40' : T.border,
              }}>
                <Text style={{ color: isCurrent ? '#FFFFFF' : isPast ? T.primary : T.textMuted, fontWeight: '700', fontSize: 13 }}>{n}</Text>
              </View>
            );
          })}
        </View>

        {/* Timer Bar */}
        {isPredicting && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: T.textSec, fontSize: 12, fontWeight: '600' }}>Predict this ball</Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: timeLeft <= 3 ? T.live : timeLeft <= 6 ? T.gold : T.primary }}>
                {timeLeft}s
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: T.borderLight, borderRadius: 99, overflow: 'hidden' }}>
              <Animated.View style={{ height: '100%', width: timerWidth, backgroundColor: timeLeft <= 3 ? T.live : timeLeft <= 6 ? T.gold : T.primary, borderRadius: 99 }} />
            </View>
          </View>
        )}

        {/* Prediction Options */}
        {(isPredicting || isWaiting) && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              {isPredicting ? 'TAP TO PREDICT' : 'PREDICTION LOCKED ✓'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {PREDICTION_OPTIONS.map(option => {
                const isSelected = selectedOptionId === option.id;
                const isLocked = !!myPrediction;
                return (
                  <Pressable key={option.id} onPress={() => !isLocked && lockPrediction(option.id)}
                    style={{
                      width: '30%', backgroundColor: isSelected ? T.primaryLight : T.card,
                      borderRadius: 14, padding: 14, alignItems: 'center',
                      borderWidth: 1.5, borderColor: isSelected ? T.primary : T.border,
                      opacity: isLocked && !isSelected ? 0.45 : 1,
                      ...T.shadowSm,
                    }}
                  >
                    <Text style={{ fontSize: 26, marginBottom: 6 }}>{String(option.icon)}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', textAlign: 'center', color: isSelected ? T.primary : T.textSec }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!myPrediction && (
              <Text style={{ color: T.textMuted, fontSize: 11, textAlign: 'center', marginTop: 10 }}>
                Auto-locks in {timeLeft}s
              </Text>
            )}
          </View>
        )}

        {/* Waiting */}
        {isWaiting && (
          <View style={{ marginHorizontal: 16, backgroundColor: T.primaryLight, borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: T.primary + '30' }}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🎯</Text>
            <Text style={{ color: T.primaryDark, fontWeight: '700', fontSize: 15 }}>Prediction locked!</Text>
            <Text style={{ color: T.primary, fontSize: 13, marginTop: 4 }}>Waiting for {opponentName}…</Text>
          </View>
        )}

        {/* Ball Result Reveal */}
        {isRevealing && currentBallResult && (
          <>
            <Animated.View style={{ marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', transform: [{ scale: resultScale }], marginBottom: 12 }}>
              <LinearGradient
                colors={currentBallResult.isWicket ? ['#FEE2E2', '#FECACA'] : currentBallResult.runs >= 6 ? ['#EDE9FE', '#DDD6FE'] : currentBallResult.runs >= 4 ? ['#DBEAFE', '#BFDBFE'] : [T.card, T.bg]}
                style={{ padding: 24, alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: T.border }}
              >
                <Text style={{ fontSize: 56, marginBottom: 8 }}>{resultEmoji(currentBallResult.outcome)}</Text>
                <Text style={{ color: T.text, fontSize: 26, fontWeight: '800', marginBottom: 4 }}>{resultLabel(currentBallResult)}</Text>
                <Text style={{ color: T.textSec, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{currentBallResult.commentary}</Text>

                {pointsFlash && (
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: pointsFlash.me > 0 ? '#DCFCE7' : T.borderLight }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: pointsFlash.me > 0 ? '#16A34A' : T.textMuted }}>
                        You +{pointsFlash.me}pts
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: pointsFlash.opp > 0 ? '#FEE2E2' : T.borderLight }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: pointsFlash.opp > 0 ? T.live : T.textMuted }}>
                        Opp +{pointsFlash.opp}pts
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity onPress={handleContinue} style={{ backgroundColor: T.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 99 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    {currentBall >= totalBalls ? '🏆 See Results' : '▶ Next Ball'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* Prediction Comparison */}
            {opponentPredictionId && myPrediction && (
              <View style={{ marginHorizontal: 16, backgroundColor: T.card, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-around', borderWidth: 1, borderColor: T.border }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginBottom: 4 }}>Your pick</Text>
                  <Text style={{ fontSize: 22 }}>{String(PREDICTION_OPTIONS.find(o => o.id === myPrediction.optionId)?.icon ?? '')}</Text>
                  <Text style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>{PREDICTION_OPTIONS.find(o => o.id === myPrediction.optionId)?.label}</Text>
                </View>
                <View style={{ width: 1, backgroundColor: T.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: T.textMuted, fontSize: 11, marginBottom: 4 }}>Opp's pick</Text>
                  <Text style={{ fontSize: 22 }}>{String(PREDICTION_OPTIONS.find(o => o.id === opponentPredictionId)?.icon ?? '')}</Text>
                  <Text style={{ color: T.textSec, fontSize: 11, marginTop: 2 }}>{PREDICTION_OPTIONS.find(o => o.id === opponentPredictionId)?.label}</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
