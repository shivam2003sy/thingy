import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  ScrollView,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { socketService } from '../socket/socketService';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { calculatePoints, resultEmoji, resultLabel, coinsForResult, xpForResult } from '../services/gameService';
import { determineWinner } from '../services/gameService';
import { PREDICTION_OPTIONS } from '../utils/mockData';
import { APP_CONFIG } from '../config/constants';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Battle'>;
};

export default function BattleScreen({ navigation }: Props) {
  const {
    scenario,
    currentBall,
    totalBalls,
    myPrediction,
    opponentPredictionId,
    timeLeft,
    myTotalScore,
    opponentTotalScore,
    currentBallResult,
    status,
    opponentName,
    runsScored,
    setMyPrediction,
    setOpponentPredictionId,
    setBallResult,
    nextBall,
    decrementTimer,
    finishGame,
  } = useGameStore();

  const { addCoins, addXP, recordWin, recordLoss, recordDraw } = useUserStore();

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
      toValue: 0,
      duration: APP_CONFIG.PREDICTION_TIME * 1000,
      useNativeDriver: false,
    });
    timerAnimation.current.start();
    timerInterval.current = setInterval(() => {
      useGameStore.getState().decrementTimer();
    }, 1000);
  }, [stopTimer]);

  const lockPrediction = useCallback(
    (optionId: string) => {
      if (useGameStore.getState().status !== 'predicting') return;
      if (useGameStore.getState().myPrediction) return;

      stopTimer();

      const option = PREDICTION_OPTIONS.find(o => o.id === optionId);
      if (!option) return;

      setSelectedOptionId(optionId);
      setMyPrediction({
        optionId,
        label: option.label,
        icon: String(option.icon),
        lockedAt: Date.now(),
      });

      socketService.submitPrediction(optionId);
    },
    [stopTimer, setMyPrediction],
  );

  // Auto-lock when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && status === 'predicting' && !myPrediction) {
      const random = PREDICTION_OPTIONS[Math.floor(Math.random() * PREDICTION_OPTIONS.length)];
      lockPrediction(random.id);
    }
  }, [timeLeft]);

  // Socket listeners
  useEffect(() => {
    socketService.on('opponentPrediction', ({ optionId }: { optionId: string }) => {
      setOpponentPredictionId(optionId);
      const { scenario: sc, currentBall: ball, runsScored: scored } = useGameStore.getState();
      if (sc) {
        const runsLeft = sc.runsNeeded - scored;
        const ballsLeft = sc.ballsRemaining - (ball - 1);
        socketService.revealBall(ball, runsLeft, ballsLeft);
      }
    });

    socketService.on('ballResult', result => {
      const { myPrediction: mp, opponentPredictionId: oppId } = useGameStore.getState();
      const myPts = mp ? calculatePoints(mp.optionId, result) : 0;
      const oppPts = oppId ? calculatePoints(oppId, result) : 0;

      setBallResult(result, myPts, oppPts);
      setPointsFlash({ me: myPts, opp: oppPts });

      resultScale.setValue(0);
      Animated.spring(resultScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      socketService.off('opponentPrediction');
      socketService.off('ballResult');
    };
  }, []);

  // Reset per ball
  useEffect(() => {
    if (status === 'predicting') {
      setSelectedOptionId(null);
      setPointsFlash(null);
      resultScale.setValue(0);
      startTimer();
    }
    return stopTimer;
  }, [status, currentBall]);

  const handleContinue = useCallback(() => {
    const { currentBall: ball, totalBalls: total, myTotalScore: myS, opponentTotalScore: oppS } =
      useGameStore.getState();

    if (ball >= total) {
      stopTimer();
      const winner = determineWinner(myS, oppS);
      finishGame(winner);
      if (winner === 'me') {
        recordWin();
        addCoins(coinsForResult('me'));
        addXP(xpForResult('me'));
      } else if (winner === 'opponent') {
        recordLoss();
        addCoins(coinsForResult('opponent'));
        addXP(xpForResult('opponent'));
      } else {
        recordDraw();
        addCoins(coinsForResult('draw'));
        addXP(xpForResult('draw'));
      }
      navigation.replace('Result');
    } else {
      nextBall();
    }
  }, [stopTimer]);

  if (!scenario) return null;

  const timerWidth = timerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isRevealing = status === 'revealing' && currentBallResult !== null;
  const isWaiting = status === 'waiting_opponent';
  const isPredicting = status === 'predicting';

  const runsLeft = scenario.runsNeeded - runsScored;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Score Bar */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#18181B',
          borderBottomWidth: 1,
          borderBottomColor: '#27272A',
        }}
      >
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 2 }}>You</Text>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 20 }}>{myTotalScore}</Text>
        </View>
        <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ color: '#52525B', fontSize: 10 }}>SCORE</Text>
          <Text style={{ color: '#71717A', fontSize: 11, marginTop: 1 }}>
            Ball {currentBall}/{totalBalls}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 2 }}>
            {opponentName.length > 10 ? opponentName.slice(0, 10) + '…' : opponentName}
          </Text>
          <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 20 }}>
            {opponentTotalScore}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Scenario Context */}
        <View
          style={{
            margin: 16,
            backgroundColor: '#18181B',
            borderRadius: 18,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: scenario.battingTeamColor,
                  marginRight: 6,
                }}
              />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                {scenario.battingTeam}
              </Text>
            </View>
            <Text style={{ color: '#52525B', fontSize: 11 }}>Over {scenario.overNumber}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                {scenario.bowlingTeam}
              </Text>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: scenario.bowlingTeamColor,
                  marginLeft: 6,
                }}
              />
            </View>
          </View>

          <Text
            style={{
              color: '#A855F7',
              fontWeight: '700',
              fontSize: 15,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {scenario.runsNeeded > 0
              ? `Needs ${runsLeft > 0 ? runsLeft : 0} off ${scenario.ballsRemaining - currentBall + 1} balls`
              : scenario.context}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
            <Text style={{ color: '#71717A', fontSize: 12 }}>🏏 {scenario.strikerName}</Text>
            <Text style={{ color: '#71717A', fontSize: 12 }}>🎳 {scenario.bowlerName}</Text>
          </View>
        </View>

        {/* Ball Tracker */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
            paddingHorizontal: 16,
          }}
        >
          {Array.from({ length: totalBalls }).map((_, i) => {
            const n = i + 1;
            const isCurrent = n === currentBall;
            const isPast = n < currentBall;
            return (
              <View
                key={i}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCurrent ? '#A855F7' : isPast ? '#3B1D6E' : '#27272A',
                  borderWidth: isCurrent ? 0 : 1,
                  borderColor: isCurrent ? 'transparent' : isPast ? '#5B21B6' : '#3F3F46',
                }}
              >
                <Text
                  style={{
                    color: isCurrent ? '#FFFFFF' : isPast ? '#C4B5FD' : '#52525B',
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  {n}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Timer Bar */}
        {isPredicting && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <Text style={{ color: '#52525B', fontSize: 12 }}>Time to predict</Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: timeLeft <= 3 ? '#EF4444' : timeLeft <= 6 ? '#F59E0B' : '#A855F7',
                }}
              >
                {timeLeft}s
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: '#27272A',
                borderRadius: 99,
                overflow: 'hidden',
              }}
            >
              <Animated.View
                style={{
                  height: '100%',
                  width: timerWidth,
                  backgroundColor: timeLeft <= 3 ? '#EF4444' : timeLeft <= 6 ? '#F59E0B' : '#A855F7',
                  borderRadius: 99,
                }}
              />
            </View>
          </View>
        )}

        {/* Prediction Options */}
        {(isPredicting || isWaiting) && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text
              style={{
                color: '#52525B',
                fontSize: 11,
                fontWeight: '600',
                letterSpacing: 1.2,
                marginBottom: 12,
              }}
            >
              {isPredicting ? 'PREDICT THIS BALL' : 'YOUR PREDICTION LOCKED'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {PREDICTION_OPTIONS.map(option => {
                const isSelected = selectedOptionId === option.id;
                const isLocked = !!myPrediction;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => !isLocked && lockPrediction(option.id)}
                    style={{
                      width: '30%',
                      backgroundColor: isSelected ? 'rgba(168,85,247,0.2)' : '#18181B',
                      borderRadius: 14,
                      padding: 14,
                      alignItems: 'center',
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#A855F7' : '#27272A',
                      opacity: isLocked && !isSelected ? 0.4 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 26, marginBottom: 6 }}>
                      {String(option.icon)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        textAlign: 'center',
                        color: isSelected ? '#C4B5FD' : '#A1A1AA',
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!myPrediction && (
              <Text
                style={{
                  color: '#3F3F46',
                  fontSize: 11,
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                Tap to select · Auto-locks in {timeLeft}s
              </Text>
            )}
          </View>
        )}

        {/* Waiting Overlay */}
        {isWaiting && (
          <View
            style={{
              marginHorizontal: 16,
              backgroundColor: '#18181B',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🎯</Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
              Prediction locked!
            </Text>
            <Text style={{ color: '#71717A', fontSize: 13, marginTop: 4 }}>
              Waiting for {opponentName}…
            </Text>
          </View>
        )}

        {/* Ball Result Reveal */}
        {isRevealing && currentBallResult && (
          <>
            <Animated.View
              style={{
                marginHorizontal: 16,
                borderRadius: 20,
                overflow: 'hidden',
                transform: [{ scale: resultScale }],
                marginBottom: 12,
              }}
            >
              <LinearGradient
                colors={
                  currentBallResult.isWicket
                    ? ['#7f1d1d', '#3b0a0a']
                    : currentBallResult.runs >= 6
                    ? ['#4c1d95', '#2e1065']
                    : currentBallResult.runs >= 4
                    ? ['#1e3a8a', '#0f172a']
                    : ['#18181B', '#0c0a09']
                }
                style={{ padding: 24, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 56, marginBottom: 8 }}>
                  {resultEmoji(currentBallResult.outcome)}
                </Text>
                <Text
                  style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 4 }}
                >
                  {resultLabel(currentBallResult)}
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 13,
                    textAlign: 'center',
                    marginBottom: 16,
                  }}
                >
                  {currentBallResult.commentary}
                </Text>

                {pointsFlash && (
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 99,
                        backgroundColor:
                          pointsFlash.me > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(63,63,70,0.4)',
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '700',
                          fontSize: 13,
                          color: pointsFlash.me > 0 ? '#4ADE80' : '#52525B',
                        }}
                      >
                        You +{pointsFlash.me}pts
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 99,
                        backgroundColor:
                          pointsFlash.opp > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(63,63,70,0.4)',
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '700',
                          fontSize: 13,
                          color: pointsFlash.opp > 0 ? '#F87171' : '#52525B',
                        }}
                      >
                        Opp +{pointsFlash.opp}pts
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleContinue}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 32,
                    paddingVertical: 12,
                    borderRadius: 99,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    {currentBall >= totalBalls ? '🏆 See Results' : '▶ Next Ball'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>

            {/* Prediction Comparison */}
            {opponentPredictionId && myPrediction && (
              <View
                style={{
                  marginHorizontal: 16,
                  backgroundColor: '#18181B',
                  borderRadius: 14,
                  padding: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 4 }}>
                    Your pick
                  </Text>
                  <Text style={{ fontSize: 22 }}>
                    {String(PREDICTION_OPTIONS.find(o => o.id === myPrediction.optionId)?.icon ?? '')}
                  </Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 11, marginTop: 2 }}>
                    {PREDICTION_OPTIONS.find(o => o.id === myPrediction.optionId)?.label}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: '#27272A' }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#71717A', fontSize: 11, marginBottom: 4 }}>
                    Opp's pick
                  </Text>
                  <Text style={{ fontSize: 22 }}>
                    {String(PREDICTION_OPTIONS.find(o => o.id === opponentPredictionId)?.icon ?? '')}
                  </Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 11, marginTop: 2 }}>
                    {PREDICTION_OPTIONS.find(o => o.id === opponentPredictionId)?.label}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
