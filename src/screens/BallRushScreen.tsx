import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  Animated, StatusBar, Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../socket/socketService';
import { T } from '../config/theme';
import { CrowdMeter } from '../components/CrowdMeter';
import { BallRushResult } from '../components/BallRushResult';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'BallRush'>;
};

type BallOutcome = 'dot' | 'single' | 'double' | 'triple' | 'four' | 'six' | 'wicket' | 'wide' | 'no_ball';

interface WindowPayload {
  matchId: string;
  matchName: string;
  over: number;
  ball: number;
  totalOver: string;
  closesAt: number;
  team1: { name: string; shortName: string; score: string; overs: string };
  team2: { name: string; shortName: string; score: string; overs: string };
  striker: string;
  bowler: string;
  crowdSnapshot: CrowdPayload;
}

interface CrowdPayload {
  matchId: string;
  counts: Record<string, number>;
  total: number;
  percentages: Record<string, number>;
}

interface ResultPayload {
  matchId: string;
  outcome: BallOutcome;
  correct: boolean;
  nearMiss: boolean;
  tokensWon: number;
}

const PREDICTION_OPTIONS: Array<{ id: BallOutcome; label: string; emoji: string; color: string }> = [
  { id: 'dot',     label: 'DOT',   emoji: '●',  color: '#64748B' },
  { id: 'single',  label: '1 RUN', emoji: '1',  color: '#3B82F6' },
  { id: 'double',  label: '2 RUNS',emoji: '2',  color: '#06B6D4' },
  { id: 'four',    label: 'FOUR',  emoji: '4️⃣', color: '#F59E0B' },
  { id: 'six',     label: 'SIX',   emoji: '6️⃣', color: '#EF4444' },
  { id: 'wicket',  label: 'OUT!',  emoji: '🔴', color: '#7C3AED' },
  { id: 'wide',    label: 'WIDE',  emoji: 'WD', color: '#10B981' },
  { id: 'no_ball', label: 'NO BALL',emoji: 'NB',color: '#F97316' },
];

const TOKEN_STEPS = [5, 10, 20, 50];

export default function BallRushScreen({ navigation, route }: Props) {
  const { user, updateTokens } = useAuthStore();
  const matchId: string = route.params?.matchId ?? 'mock_ipl_001';
  const matchName: string = route.params?.matchName ?? 'Live Match';

  const [window, setWindow] = useState<WindowPayload | null>(null);
  const [crowd, setCrowd] = useState<CrowdPayload | null>(null);
  const [selectedOption, setSelectedOption] = useState<BallOutcome | null>(null);
  const [tokensBet, setTokensBet] = useState(20);
  const [hasPredicted, setHasPredicted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaders, setLeaders] = useState<any[]>([]);

  const [resultVisible, setResultVisible] = useState(false);
  const [resultData, setResultData] = useState<ResultPayload | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const liveDot = useRef(new Animated.Value(1)).current;

  // Pulse animation for prediction buttons when window is open
  useEffect(() => {
    if (window && !hasPredicted) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [window, hasPredicted]);

  // Live dot blink
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDot, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(liveDot, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Countdown ticker
  const startCountdown = useCallback((closesAt: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((closesAt - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0 && countdownRef.current) clearInterval(countdownRef.current);
    };
    tick();
    countdownRef.current = setInterval(tick, 500);
  }, []);

  // Socket listeners
  useEffect(() => {
    socketService.subscribeBallRush(matchId);

    socketService.on('ballRushWindow', (data: WindowPayload) => {
      if (data.matchId !== matchId) return;
      setWindow(data);
      setCrowd(data.crowdSnapshot);
      setSelectedOption(null);
      setHasPredicted(false);
      startCountdown(data.closesAt);
    });

    socketService.on('ballRushCrowdUpdate', (data: CrowdPayload) => {
      if (data.matchId !== matchId) return;
      setCrowd(data);
    });

    socketService.on('ballRushResult', (data: any) => {
      if (data.matchId !== matchId) return;
      // Update scores on screen
      setWindow(prev => prev ? {
        ...prev,
        team1: data.team1 ?? prev.team1,
        team2: data.team2 ?? prev.team2,
      } : prev);
    });

    socketService.on('ballRushUserResult', (data: ResultPayload) => {
      if (data.matchId !== matchId) return;
      setResultData(data);
      setResultVisible(true);
      if (data.correct) setStreak(s => s + 1);
      else setStreak(0);
      if (data.tokensWon > 0) updateTokens(data.tokensWon - tokensBet);
      else updateTokens(-tokensBet);
    });

    socketService.on('ballRushWindowClosed', (data: any) => {
      if (data.matchId !== matchId) return;
      setWindow(prev => prev ? { ...prev } : prev);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(0);
    });

    socketService.on('ballRushLeaderboard', (data: any) => {
      if (data.matchId !== matchId) return;
      setLeaders(data.leaders ?? []);
    });

    return () => {
      socketService.unsubscribeBallRush(matchId);
      socketService.off('ballRushWindow');
      socketService.off('ballRushCrowdUpdate');
      socketService.off('ballRushResult');
      socketService.off('ballRushUserResult');
      socketService.off('ballRushWindowClosed');
      socketService.off('ballRushLeaderboard');
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [matchId]);

  const handlePredict = (optionId: BallOutcome) => {
    if (hasPredicted || !window || countdown === 0) return;
    setSelectedOption(optionId);
    setHasPredicted(true);
    socketService.submitBallRushPrediction(matchId, user!.id, user!.username, optionId, tokensBet);
  };

  const windowOpen = window !== null && countdown > 0 && !hasPredicted;
  const team1 = window?.team1;
  const team2 = window?.team2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
          <Text style={{ color: '#FFF', fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Animated.View style={{
              width: 7, height: 7, borderRadius: 4,
              backgroundColor: T.live, opacity: liveDot,
            }} />
            <Text style={{ color: T.live, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>BALL RUSH</Text>
          </View>
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>{matchName}</Text>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 99,
          paddingHorizontal: 12, paddingVertical: 6,
        }}>
          <Text style={{ fontSize: 14 }}>🪙</Text>
          <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: 14 }}>
            {user?.tokens?.toLocaleString() ?? '0'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Score Bar */}
        {team1 && team2 && (
          <LinearGradient
            colors={['#1E3A5F', '#0F172A']}
            style={{ margin: 12, borderRadius: 16, padding: 16 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>{team1.shortName}</Text>
                <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 }}>{team1.score}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>({team1.overs})</Text>
              </View>
              <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>vs</Text>
                {window && (
                  <View style={{ marginTop: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700' }}>Over {window.totalOver}</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>{team2.shortName}</Text>
                <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 }}>{team2.score}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>({team2.overs})</Text>
              </View>
            </View>
            {window && (
              <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  🏏 {window.striker}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  ⚡ {window.bowler}
                </Text>
              </View>
            )}
          </LinearGradient>
        )}

        {/* Streak indicator */}
        {streak >= 2 && (
          <View style={{
            marginHorizontal: 12, marginBottom: 8,
            backgroundColor: '#7C3AED', borderRadius: 12,
            paddingVertical: 8, paddingHorizontal: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>
              {streak} BALL STREAK — next win is 2×!
            </Text>
          </View>
        )}

        {/* Prediction zone */}
        <View style={{
          margin: 12, backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: 20, padding: 16,
          borderWidth: 1, borderColor: windowOpen ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)',
        }}>
          {/* Countdown */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {window && countdown > 0 ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                  {hasPredicted ? 'PREDICTION LOCKED IN' : 'PREDICT THE NEXT BALL'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={{
                    color: countdown <= 5 ? T.live : '#FFF',
                    fontSize: 42, fontWeight: '900', lineHeight: 48,
                  }}>{countdown}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginLeft: 4 }}>sec</Text>
                </View>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' }}>
                  ⏳ Waiting for next ball...
                </Text>
              </View>
            )}
          </View>

          {/* Token bet selector */}
          {!hasPredicted && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', marginBottom: 8, letterSpacing: 1 }}>
                BET AMOUNT 🪙
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TOKEN_STEPS.map(v => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setTokensBet(v)}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                      backgroundColor: tokensBet === v ? T.gold : 'rgba(255,255,255,0.08)',
                      borderWidth: 1, borderColor: tokensBet === v ? T.gold : 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <Text style={{ color: tokensBet === v ? '#000' : '#FFF', fontWeight: '700', fontSize: 13 }}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Prediction buttons */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {PREDICTION_OPTIONS.map(opt => {
              const isSelected  = selectedOption === opt.id;
              const isDisabled  = hasPredicted || countdown === 0;
              return (
                <Animated.View key={opt.id} style={{ transform: [{ scale: !isDisabled && !isSelected ? pulseAnim : new Animated.Value(1) }] }}>
                  <Pressable
                    onPress={() => handlePredict(opt.id)}
                    disabled={isDisabled}
                    style={{
                      width: 80, height: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isSelected
                        ? opt.color
                        : isDisabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                      borderWidth: 2,
                      borderColor: isSelected ? opt.color : isDisabled ? 'rgba(255,255,255,0.08)' : `${opt.color}60`,
                      opacity: isDisabled && !isSelected ? 0.4 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{opt.emoji}</Text>
                    <Text style={{
                      color: isSelected ? '#FFF' : 'rgba(255,255,255,0.7)',
                      fontSize: 10, fontWeight: '700', marginTop: 3,
                    }}>{opt.label}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {hasPredicted && selectedOption && (
            <View style={{
              marginTop: 14, padding: 12, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                Predicted <Text style={{ color: '#FFF', fontWeight: '800' }}>{selectedOption.toUpperCase()}</Text>
                {' '}· Bet <Text style={{ color: T.gold, fontWeight: '800' }}>🪙 {tokensBet}</Text>
                {' '}· Win up to <Text style={{ color: '#4ADE80', fontWeight: '800' }}>🪙 {tokensBet * 3}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Crowd Meter */}
        {crowd && (crowd.total > 0 || true) && (
          <View style={{
            margin: 12, marginTop: 0, backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}>
            <CrowdMeter percentages={crowd.percentages} total={crowd.total} />
          </View>
        )}

        {/* Match Leaderboard */}
        {leaders.length > 0 && (
          <View style={{ margin: 12, marginTop: 0 }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
              MATCH LEADERBOARD
            </Text>
            {leaders.slice(0, 5).map((l, i) => (
              <View key={l.username} style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
                padding: 12, marginBottom: 6,
              }}>
                <Text style={{ color: i === 0 ? T.gold : 'rgba(255,255,255,0.4)', fontWeight: '800', fontSize: 14, width: 28 }}>
                  {i === 0 ? '🥇' : `#${i + 1}`}
                </Text>
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14, flex: 1 }}>{l.username}</Text>
                <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 13 }}>+{l.tokens_earned}🪙</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 8 }}>{l.accuracy_pct}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* No window state */}
        {!window && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48 }}>🏏</Text>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 12 }}>
              Waiting for live action...
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>
              Ball Rush opens every time a new delivery is about to be bowled
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Result overlay */}
      <BallRushResult
        visible={resultVisible}
        correct={resultData?.correct ?? false}
        nearMiss={resultData?.nearMiss ?? false}
        tokensWon={resultData?.tokensWon ?? 0}
        outcome={resultData?.outcome ?? 'dot'}
        streakCount={streak}
        onDismiss={() => setResultVisible(false)}
      />
    </SafeAreaView>
  );
}
