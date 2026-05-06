import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import {
  Animated, ActivityIndicator, Pressable, ScrollView,
  StatusBar, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useOverPredictionStore, PredictionOption } from '../store/useOverPredictionStore';
import { T } from '../config/theme';
import { OverPredictionResult } from '../components/OverPredictionResult';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'OverPrediction'>;
};

type Difficulty = 'runs' | 'action' | 'combo';

const TOKEN_STEPS = [10, 25, 50, 100];
const MAX_PICKS   = 3;

const DIFF_COLORS: Record<Difficulty, string> = {
  runs:   '#3B82F6',
  action: '#F59E0B',
  combo:  '#A855F7',
};

const DIFF_LABELS: Record<string, string> = {
  runs: '🔢 Runs', action: '🏏 Action', combo: '⚡ Combo',
};

// ─── Ball display ─────────────────────────────────────────────────────────────

const BALL_COLOR: Record<string, { bg: string; label: string }> = {
  dot:     { bg: '#334155', label: '•'  },
  single:  { bg: '#3B82F6', label: '1'  },
  double:  { bg: '#06B6D4', label: '2'  },
  triple:  { bg: '#0EA5E9', label: '3'  },
  four:    { bg: '#F59E0B', label: '4'  },
  six:     { bg: '#EF4444', label: '6'  },
  wicket:  { bg: '#7C3AED', label: 'W'  },
  wide:    { bg: '#10B981', label: 'Wd' },
  no_ball: { bg: '#F97316', label: 'NB' },
  bye:     { bg: '#10B981', label: 'B'  },
  leg_bye: { bg: '#10B981', label: 'LB' },
};

const BallBubble = memo(function BallBubble({ outcome, size = 36 }: { outcome: string; size?: number }) {
  const cfg = BALL_COLOR[outcome] ?? { bg: '#475569', label: '?' };
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: size * 0.3 }}>{cfg.label}</Text>
    </View>
  );
});

const EmptyBubble = memo(function EmptyBubble({ size = 36 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)' }} />
  );
});

function useCountdown(closesAt: number): number {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const tick = () => setSec(Math.max(0, Math.ceil((closesAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt]);
  return sec;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OverPredictionScreen({ navigation, route }: Props) {
  const { user } = useAuthStore();
  const matchId: string   = route.params?.matchId   ?? '';
  const matchName: string = route.params?.matchName  ?? 'Live Match';

  const {
    predictionOptions,
    optionsLoading,
    currentMatch,
    predictionWindow,
    liveStats,
    overResult,
    userResults,
    totalWon,
    isLocked,
    selectedPredictions,
    tokensBet,
    hotPicks,
    hotPicksTotal,
    pendingWindow,
    overHistory,
    subscribeToMatch,
    unsubscribe,
    selectPrediction,
    deselectPrediction,
    setTokensBet: setTokensBetStore,
    submitPredictions,
    clearResults,
  } = useOverPredictionStore();

  const [activeDiff, setActiveDiff] = useState<Difficulty>('runs');
  const [resultVisible, setResultVisible] = useState(false);
  const liveDot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDot, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(liveDot, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (matchId) subscribeToMatch(matchId);
    return () => unsubscribe();
  }, [matchId]);

  useEffect(() => {
    if (overResult) setResultVisible(true);
  }, [overResult]);

  const countdown = useCountdown(predictionWindow?.ends_at ? new Date(predictionWindow.ends_at).getTime() : 0);
  const windowOpen = !!predictionWindow && countdown > 0 && !isLocked;

  const availableDiffs = useMemo(() => {
    const order: Difficulty[] = ['runs', 'action', 'combo'];
    const present = new Set(predictionOptions.map(o => o.difficulty));
    return order.filter(d => present.has(d));
  }, [predictionOptions]);

  // Auto-select first available difficulty if current tab disappears
  useEffect(() => {
    if (availableDiffs.length > 0 && !availableDiffs.includes(activeDiff)) {
      setActiveDiff(availableDiffs[0]);
    }
  }, [availableDiffs]);

  const visibleOptions = useMemo(
    () => predictionOptions.filter(o => o.difficulty === activeDiff),
    [predictionOptions, activeDiff]
  );

  const togglePrediction = useCallback((id: string) => {
    if (!windowOpen) return;
    if (selectedPredictions.has(id)) deselectPrediction(id);
    else if (selectedPredictions.size < MAX_PICKS) selectPrediction(id);
  }, [windowOpen, selectedPredictions, deselectPrediction, selectPrediction]);

  const handleLockIn = useCallback(async () => {
    if (!windowOpen || selectedPredictions.size === 0 || !user) return;
    await submitPredictions(user.id, user.username ?? 'player');
  }, [windowOpen, selectedPredictions, user, submitPredictions]);

  const team1 = currentMatch ? {
    shortName: currentMatch.team1_short,
    score: `${currentMatch.team1_score}/${currentMatch.team1_wickets}`,
    overs: String(currentMatch.team1_overs),
  } : null;

  const team2 = currentMatch ? {
    shortName: currentMatch.team2_short,
    score: `${currentMatch.team2_score}/${currentMatch.team2_wickets}`,
    overs: String(currentMatch.team2_overs),
  } : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
          <Text style={{ color: '#FFF', fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.live, opacity: liveDot }} />
            <Text style={{ color: T.live, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>OVER PREDICT</Text>
          </View>
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>{matchName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontSize: 14 }}>🪙</Text>
          <Text style={{ color: T.gold, fontWeight: '800', fontSize: 14 }}>{user?.tokens?.toLocaleString() ?? '0'}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Score Bar */}
        {team1 && team2 && (
          <LinearGradient colors={['#1E3A5F', '#0F172A']} style={{ margin: 12, borderRadius: 16, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>{team1.shortName}</Text>
                <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 }}>{team1.score}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>({team1.overs})</Text>
              </View>
              <View style={{ alignItems: 'center', paddingHorizontal: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>vs</Text>
                {predictionWindow && (
                  <View style={{ marginTop: 4, backgroundColor: 'rgba(74,222,128,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '700' }}>Over {predictionWindow.over_number}</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' }}>{team2.shortName}</Text>
                <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 2 }}>{team2.score}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>({team2.overs})</Text>
              </View>
            </View>
            {currentMatch && (
              <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>🏏 {predictionWindow?.striker || currentMatch.striker}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>⚡ {predictionWindow?.bowler || currentMatch.bowler}</Text>
              </View>
            )}
          </LinearGradient>
        )}

        {/* Live over ball ticker */}
        {liveStats && (
          <View style={{ marginHorizontal: 12, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              LIVE OVER · {liveStats.legal_balls}/6 BALLS · {liveStats.runs} RUNS
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {liveStats.balls.map((outcome, i) => <BallBubble key={i} outcome={outcome} size={38} />)}
              {Array.from({ length: Math.max(0, 6 - liveStats.legal_balls) }).map((_, i) => <EmptyBubble key={`e-${i}`} size={38} />)}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {[
                { label: 'Fours',  value: liveStats.fours,   color: T.gold    },
                { label: 'Sixes',  value: liveStats.sixes,   color: T.live    },
                { label: 'Wkts',   value: liveStats.wickets, color: '#A78BFA' },
                { label: 'Extras', value: liveStats.extras,  color: '#60A5FA' },
              ].map(item => (
                <View key={item.label} style={{ alignItems: 'center' }}>
                  <Text style={{ color: item.color, fontWeight: '900', fontSize: 16 }}>{item.value}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600' }}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Prediction Zone */}
        <View style={{ margin: 12, marginTop: 0, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: windowOpen ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)' }}>

          {/* Countdown */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {predictionWindow && countdown > 0 ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                  {isLocked ? `LOCKED — OVER ${predictionWindow.over_number}` : `PREDICT OVER ${predictionWindow.over_number}`}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={{ color: countdown <= 10 ? T.live : '#FFF', fontSize: 42, fontWeight: '900', lineHeight: 48 }}>{countdown}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginLeft: 4 }}>sec</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>Prediction window open</Text>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' }}>⏳ Waiting for next over...</Text>
              </View>
            )}
          </View>

          {/* Loading state */}
          {optionsLoading && (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <ActivityIndicator color="#4ADE80" />
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Loading options...</Text>
            </View>
          )}

          {!optionsLoading && !isLocked && (
            <>
              {/* Difficulty tabs — only show tabs that exist in DB */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                {availableDiffs.map(d => {
                  const color = DIFF_COLORS[d as Difficulty] ?? '#888';
                  const active = activeDiff === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setActiveDiff(d as Difficulty)}
                      style={{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: active ? `${color}22` : 'rgba(255,255,255,0.05)', borderWidth: 1.5, borderColor: active ? color : 'rgba(255,255,255,0.1)' }}
                    >
                      <Text style={{ color: active ? color : 'rgba(255,255,255,0.45)', fontWeight: '800', fontSize: 12 }}>{DIFF_LABELS[d] ?? d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Prediction options — from DB */}
              <View style={{ gap: 8, marginBottom: 14 }}>
                {visibleOptions.map(opt => {
                  const selected = selectedPredictions.has(opt.id);
                  const color    = DIFF_COLORS[opt.difficulty as Difficulty] ?? '#888';
                  const disabled = !windowOpen || (!selected && selectedPredictions.size >= MAX_PICKS);
                  const payout   = tokensBet * opt.multiplier;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => togglePrediction(opt.id)}
                      disabled={disabled}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: selected ? `${color}20` : 'rgba(255,255,255,0.04)', borderWidth: 1.5, borderColor: selected ? color : 'rgba(255,255,255,0.08)', opacity: disabled && !selected ? 0.4 : 1 }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: selected ? color : '#FFF', fontWeight: '700', fontSize: 15 }}>{opt.label}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>{opt.description}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                        <View style={{ backgroundColor: selected ? color : 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ color: selected ? '#000' : color, fontWeight: '800', fontSize: 13 }}>{opt.multiplier}×</Text>
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 3 }}>
                          🪙{tokensBet} → win 🪙{payout}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Token selector */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', marginBottom: 8, letterSpacing: 1 }}>BET PER PREDICTION 🪙</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {TOKEN_STEPS.map(v => (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setTokensBetStore(v)}
                      style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: tokensBet === v ? T.gold : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: tokensBet === v ? T.gold : 'rgba(255,255,255,0.12)' }}
                    >
                      <Text style={{ color: tokensBet === v ? '#000' : '#FFF', fontWeight: '700', fontSize: 13 }}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Lock In */}
              {selectedPredictions.size > 0 && windowOpen && (
                <TouchableOpacity
                  onPress={handleLockIn}
                  style={{ backgroundColor: '#4ADE80', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>
                    LOCK IN {selectedPredictions.size} PREDICTION{selectedPredictions.size > 1 ? 'S' : ''} · 🪙{selectedPredictions.size * tokensBet}
                  </Text>
                </TouchableOpacity>
              )}

              {windowOpen && selectedPredictions.size === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Pick up to {MAX_PICKS} · switch tabs to see all options</Text>
                </View>
              )}
            </>
          )}

          {/* Locked — show submitted picks + hot picks % */}
          {isLocked && (
            <View style={{ gap: 8 }}>
              {Array.from(selectedPredictions).map(id => {
                const opt = predictionOptions.find(o => o.id === id);
                if (!opt) return null;
                const color = DIFF_COLORS[opt.difficulty as Difficulty] ?? '#888';
                const pickCount = hotPicks.get(id) ?? 0;
                const pickPct = hotPicksTotal > 0 ? Math.round((pickCount / hotPicksTotal) * 100) : null;
                return (
                  <View key={id} style={{ backgroundColor: `${color}15`, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: `${color}35` }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: pickPct !== null ? 8 : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16 }}>🔒</Text>
                        <View>
                          <Text style={{ color, fontWeight: '800', fontSize: 14 }}>{opt.label}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 1 }}>{opt.description}</Text>
                        </View>
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                        🪙{tokensBet} → 🪙{tokensBet * opt.multiplier}
                      </Text>
                    </View>
                    {pickPct !== null && (
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600' }}>
                            🔥 {pickPct}% of players picked this
                          </Text>
                          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>{pickCount} picks</Text>
                        </View>
                        <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                          <View style={{ height: 3, width: `${pickPct}%`, backgroundColor: color, borderRadius: 2 }} />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {!predictionWindow && !isLocked && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 48 }}>🏏</Text>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 12 }}>Waiting for next over...</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>
              Prediction window opens before each over begins
            </Text>
          </View>
        )}

        {/* Past overs history */}
        {overHistory.length > 0 && (
          <View style={{ marginHorizontal: 12, marginTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 }}>
              PAST OVERS THIS MATCH
            </Text>
            <View style={{ gap: 8 }}>
              {overHistory.map(entry => {
                const won = entry.userResults.filter(r => r.won).length;
                const total = entry.userResults.length;
                const hasResult = total > 0;
                return (
                  <View key={entry.over_number} style={{
                    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14,
                    padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
                  }}>
                    {/* Header row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' }}>
                        Over {entry.over_number}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 15 }}>{entry.stats.runs} runs</Text>
                        {hasResult && (
                          <View style={{
                            backgroundColor: won > 0 ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.1)',
                            borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                          }}>
                            <Text style={{ color: won > 0 ? '#4ADE80' : '#F87171', fontWeight: '800', fontSize: 11 }}>
                              {won > 0 ? `+${entry.totalWon}🪙` : 'No win'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Ball bubbles */}
                    <View style={{ flexDirection: 'row', gap: 5, marginBottom: hasResult ? 10 : 0 }}>
                      {entry.balls.map((b, i) => {
                        const cfg = (BALL_COLOR[b] ?? { bg: '#475569', label: '?' });
                        return (
                          <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: cfg.bg, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 10 }}>{cfg.label}</Text>
                          </View>
                        );
                      })}
                    </View>

                    {/* User predictions */}
                    {hasResult && (
                      <View style={{ gap: 4 }}>
                        {entry.userResults.map(r => (
                          <View key={r.predictionId} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 12 }}>{r.won ? '✅' : '❌'}</Text>
                              <Text style={{ color: r.won ? '#4ADE80' : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>
                                {predictionOptions.find(o => o.id === r.predictionId)?.label ?? r.predictionId}
                              </Text>
                            </View>
                            {r.won && <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 12 }}>+{r.tokensWon}🪙</Text>}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {overResult && (
        <OverPredictionResult
          visible={resultVisible}
          over={overResult.over_number}
          balls={overResult.balls ?? []}
          results={userResults}
          totalWon={totalWon}
          anyWon={totalWon > 0}
          nextOverReady={!!pendingWindow}
          stats={{
            sixes: overResult.stats.sixes,
            fours: overResult.stats.fours,
            wickets: overResult.stats.wickets,
            wides: overResult.stats.extras,
            noBalls: 0,
            dots: overResult.stats.dots,
            totalRuns: overResult.stats.runs,
          }}
          onDismiss={() => { setResultVisible(false); clearResults(); }}
        />
      )}
    </SafeAreaView>
  );
}
