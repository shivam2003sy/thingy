import React, { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import {
  Animated, Pressable, ScrollView,
  StatusBar, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useOverPredictionStore } from '../store/useOverPredictionStore';
import { T } from '../config/theme';
import { OverPredictionResult } from '../components/OverPredictionResult';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any, 'OverPrediction'>;
};

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface PredictionOption {
  id: string;
  label: string;
  desc: string;
  mult: number;
  difficulty: Difficulty;
}

interface WindowPayload {
  matchId: string;
  matchName: string;
  forOver: number;
  closesAt: number;
  currentOver: number;
  team1: { name: string; shortName: string; score: string; overs: string };
  team2: { name: string; shortName: string; score: string; overs: string };
  striker: string;
  bowler: string;
  participantCount: number;
}

interface LiveStats {
  matchId: string;
  over: number;
  balls: string[];  // outcomes in delivery order e.g. ['dot','four','six']
  sixes: number; fours: number; wickets: number;
  wides: number; noBalls: number; dots: number;
  totalRuns: number; ballsPlayed: number;
}

interface OverResult {
  over: number;
  balls: string[];  // full over ball sequence
  results: Array<{ predictionId: string; won: boolean; tokensWon: number; mult: number }>;
  totalWon: number;
  anyWon: boolean;
  stats: { sixes: number; fours: number; wickets: number; wides: number; noBalls: number; dots: number; totalRuns: number };
}

// ─── Prediction catalogue ─────────────────────────────────────────────────────

const CATEGORIES: Record<Difficulty, { label: string; color: string; mult: number }> = {
  easy:   { label: 'EASY',   color: '#22C55E', mult: 2  },
  medium: { label: 'MEDIUM', color: '#F59E0B', mult: 5  },
  hard:   { label: 'HARD',   color: '#3B82F6', mult: 10 },
  expert: { label: 'EXPERT', color: '#EF4444', mult: 20 },
};

const ALL_OPTIONS: PredictionOption[] = [
  // Easy
  { id: 'sixes_0',       label: '0 Sixes',        desc: 'No six hit this over',        mult: 2,  difficulty: 'easy'   },
  { id: 'sixes_1plus',   label: '1+ Sixes',        desc: 'At least one six',            mult: 2,  difficulty: 'easy'   },
  { id: 'fours_0to2',    label: '0-2 Fours',       desc: 'Fewer than 3 fours',          mult: 2,  difficulty: 'easy'   },
  { id: 'fours_3plus',   label: '3+ Fours',        desc: 'Three or more fours',         mult: 2,  difficulty: 'easy'   },
  { id: 'dots_4plus',    label: '4+ Dots',         desc: 'Four or more dot balls',      mult: 2,  difficulty: 'easy'   },
  // Medium
  { id: 'wickets_0',     label: 'No Wicket',       desc: 'No wickets fall',             mult: 5,  difficulty: 'medium' },
  { id: 'wickets_1plus', label: '1+ Wickets',      desc: 'At least one wicket',         mult: 5,  difficulty: 'medium' },
  { id: 'extras_0',      label: 'No Extras',       desc: 'Zero wides or no-balls',      mult: 5,  difficulty: 'medium' },
  { id: 'extras_1plus',  label: '1+ Extras',       desc: 'At least one extra',          mult: 5,  difficulty: 'medium' },
  // Hard
  { id: 'runs_0to5',     label: '0-5 Runs',        desc: 'Total runs 0 to 5',           mult: 10, difficulty: 'hard'   },
  { id: 'runs_6to10',    label: '6-10 Runs',       desc: 'Total runs 6 to 10',          mult: 10, difficulty: 'hard'   },
  { id: 'runs_11to15',   label: '11-15 Runs',      desc: 'Total runs 11 to 15',         mult: 10, difficulty: 'hard'   },
  { id: 'runs_16to20',   label: '16-20 Runs',      desc: 'Total runs 16 to 20',         mult: 10, difficulty: 'hard'   },
  { id: 'runs_21plus',   label: '21+ Runs',        desc: 'Total runs 21 or more',       mult: 10, difficulty: 'hard'   },
  { id: 'first_dot',     label: 'First Dot',       desc: 'First ball is a dot',         mult: 10, difficulty: 'hard'   },
  { id: 'first_boundary',label: 'First Boundary',  desc: 'First ball is a 4 or 6',      mult: 10, difficulty: 'hard'   },
  // Expert
  { id: 'wicket_and_six',label: 'Wicket & Six',    desc: 'Over has both wicket & six',  mult: 20, difficulty: 'expert' },
  { id: 'maiden',        label: 'Maiden Over',     desc: 'Zero runs, no extras',        mult: 20, difficulty: 'expert' },
  { id: 'clean',         label: 'Clean Over',      desc: 'No wickets, no extras',       mult: 20, difficulty: 'expert' },
];

const TOKEN_STEPS = [5, 10, 20, 50];
const MAX_PICKS   = 5;

// ─── Ball colour map ──────────────────────────────────────────────────────────
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
};

const BallBubble = memo(function BallBubble({ outcome, size = 36 }: { outcome: string; size?: number }) {
  const cfg = BALL_COLOR[outcome] ?? { bg: '#475569', label: '?' };
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: cfg.bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: size * 0.33 }}>{cfg.label}</Text>
    </View>
  );
});

// Empty slot placeholders (grey circles for balls not yet bowled)
const EmptyBubble = memo(function EmptyBubble({ size = 36 }: { size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    }} />
  );
});

function useCountdown(closesAt: number): number {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const tick = () => setSec(Math.max(0, Math.ceil((closesAt - Date.now()) / 1000)));
    tick();
    // Reduced from 500ms to 1000ms for better performance
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closesAt]);
  return sec;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OverPredictionScreen({ navigation, route }: Props) {
  const { user, updateTokens } = useAuthStore();
  const matchId: string   = route.params?.matchId   ?? '';
  const matchName: string = route.params?.matchName  ?? 'Live Match';

  const {
    currentMatch,
    predictionWindow,
    liveStats,
    overResult,
    userResults,
    totalWon,
    isWindowOpen,
    isLocked,
    selectedPredictions,
    tokensBet,
    subscribeToMatch,
    unsubscribe,
    selectPrediction,
    deselectPrediction,
    setTokensBet: setTokensBetStore,
    submitPredictions,
    clearResults,
  } = useOverPredictionStore();

  const [activeDiff, setActiveDiff]     = useState<Difficulty>('easy');
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
    if (matchId) {
      subscribeToMatch(matchId);
    }

    return () => {
      unsubscribe();
    };
  }, [matchId]);

  useEffect(() => {
    if (overResult) {
      setResultVisible(true);
    }
  }, [overResult]);

  const countdown = useCountdown(predictionWindow?.ends_at ? new Date(predictionWindow.ends_at).getTime() : 0);
  const windowOpen = isWindowOpen && !isLocked;

  const togglePrediction = useCallback((id: string) => {
    if (!windowOpen) return;
    if (selectedPredictions.has(id)) {
      deselectPrediction(id);
    } else if (selectedPredictions.size < MAX_PICKS) {
      selectPrediction(id);
    }
  }, [windowOpen, selectedPredictions, deselectPrediction, selectPrediction]);

  const handleLockIn = useCallback(async () => {
    if (!windowOpen || selectedPredictions.size === 0 || !user) return;
    await submitPredictions(user.id, user.username ?? 'player');
  }, [windowOpen, selectedPredictions, user, submitPredictions]);

  // Memoize filtered options
  const visibleOptions = useMemo(() => 
    ALL_OPTIONS.filter(o => o.difficulty === activeDiff),
    [activeDiff]
  );
  // Memoize team data to prevent recalculation
  const team1 = useMemo(() => predictionWindow?.team1 || currentMatch ? {
    name: currentMatch?.team1_name || '',
    shortName: currentMatch?.team1_short || '',
    score: `${currentMatch?.team1_score || 0}/${currentMatch?.team1_wickets || 0}`,
    overs: String(currentMatch?.team1_overs || 0),
  } : null, [predictionWindow, currentMatch]);
  
  const team2 = useMemo(() => predictionWindow?.team2 || currentMatch ? {
    name: currentMatch?.team2_name || '',
    shortName: currentMatch?.team2_short || '',
    score: `${currentMatch?.team2_score || 0}/${currentMatch?.team2_wickets || 0}`,
    overs: String(currentMatch?.team2_overs || 0),
  } : null, [predictionWindow, currentMatch]);

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
              width: 7, height: 7, borderRadius: 4, backgroundColor: T.live, opacity: liveDot,
            }} />
            <Text style={{ color: T.live, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>OVER PREDICT</Text>
          </View>
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15 }}>{matchName}</Text>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 99,
          paddingHorizontal: 12, paddingVertical: 6,
        }}>
          <Text style={{ fontSize: 14 }}>🪙</Text>
          <Text style={{ color: T.gold, fontWeight: '800', fontSize: 14 }}>
            {user?.tokens?.toLocaleString() ?? '0'}
          </Text>
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
            {(predictionWindow || currentMatch) && (
              <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>🏏 {predictionWindow?.striker || currentMatch?.striker}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>⚡ {predictionWindow?.bowler || currentMatch?.bowler}</Text>
              </View>
            )}
          </LinearGradient>
        )}

        {/* Live over — ball-by-ball ticker */}
        {liveStats && (
          <View style={{
            marginHorizontal: 12, marginBottom: 12,
            backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
            padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              LIVE OVER · {liveStats.balls.length}/6 BALLS · {liveStats.runs} RUNS
            </Text>

            {/* Ball bubbles row — 6 slots */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => {
                const outcome = liveStats.balls?.[i];
                return outcome
                  ? <BallBubble key={i} outcome={outcome} size={38} />
                  : <EmptyBubble key={i} size={38} />;
              })}
            </View>

            {/* Mini stats */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {[
                { label: 'Fours', value: liveStats.fours,  color: T.gold   },
                { label: 'Sixes', value: liveStats.sixes,  color: T.live   },
                { label: 'Wkts',  value: liveStats.wickets, color: '#A78BFA'},
                { label: 'Extra', value: liveStats.extras, color: '#60A5FA' },
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
        <View style={{
          margin: 12, marginTop: 0,
          backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 16,
          borderWidth: 1, borderColor: windowOpen ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)',
        }}>
          {/* Countdown & Status */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            {predictionWindow && countdown > 0 ? (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                  {isLocked ? `LOCKED IN — OVER ${predictionWindow?.over_number}` : `PREDICT OVER ${predictionWindow?.over_number}`}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                  <Text style={{
                    color: countdown <= 10 ? T.live : '#FFF',
                    fontSize: 42, fontWeight: '900', lineHeight: 48,
                  }}>{countdown}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginLeft: 4 }}>sec</Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
                  Prediction window open
                </Text>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '600' }}>
                  ⏳ Waiting for next over...
                </Text>
              </View>
            )}
          </View>

          {/* Difficulty tabs */}
          {!isLocked && (
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {(Object.keys(CATEGORIES) as Difficulty[]).map(d => {
                const cat = CATEGORIES[d];
                const active = activeDiff === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setActiveDiff(d)}
                    style={{
                      flex: 1, paddingVertical: 7, borderRadius: 10, alignItems: 'center',
                      backgroundColor: active ? `${cat.color}25` : 'rgba(255,255,255,0.05)',
                      borderWidth: 1, borderColor: active ? cat.color : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Text style={{ color: active ? cat.color : 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 10, letterSpacing: 0.5 }}>
                      {cat.label}
                    </Text>
                    <Text style={{ color: active ? cat.color : 'rgba(255,255,255,0.3)', fontSize: 9, marginTop: 1 }}>
                      {cat.mult}×
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Prediction options */}
          {!isLocked && (
            <View style={{ gap: 8, marginBottom: 14 }}>
              {visibleOptions.map(opt => {
                const selected  = selectedPredictions.has(opt.id);
                const catColor  = CATEGORIES[opt.difficulty].color;
                const disabled  = !windowOpen || (!selected && selectedPredictions.size >= MAX_PICKS);
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => togglePrediction(opt.id)}
                    disabled={disabled}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14,
                      backgroundColor: selected ? `${catColor}20` : 'rgba(255,255,255,0.04)',
                      borderWidth: 1.5,
                      borderColor: selected ? catColor : 'rgba(255,255,255,0.08)',
                      opacity: disabled && !selected ? 0.4 : 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: selected ? catColor : '#FFF', fontWeight: '700', fontSize: 15 }}>
                        {opt.label}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                        {opt.desc}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: selected ? catColor : 'rgba(255,255,255,0.08)',
                      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
                    }}>
                      <Text style={{ color: selected ? '#000' : catColor, fontWeight: '800', fontSize: 13 }}>
                        {opt.mult}×
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Submitted picks summary */}
          {isLocked && (
            <View style={{ gap: 8 }}>
              {Array.from(selectedPredictions).map(id => {
                const opt = ALL_OPTIONS.find(o => o.id === id);
                if (!opt) return null;
                const catColor = CATEGORIES[opt.difficulty].color;
                return (
                  <View key={id} style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: `${catColor}15`, borderRadius: 12,
                    paddingVertical: 10, paddingHorizontal: 14,
                    borderWidth: 1, borderColor: `${catColor}35`,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16 }}>🔒</Text>
                      <Text style={{ color: catColor, fontWeight: '700', fontSize: 14 }}>{opt.label}</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      🪙{tokensBet} → win 🪙{Math.floor(tokensBet * opt.mult * 0.9)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Token selector */}
          {!isLocked && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', marginBottom: 8, letterSpacing: 1 }}>
                BET PER PREDICTION 🪙
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {TOKEN_STEPS.map(v => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setTokensBetStore(v)}
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

          {/* Lock In button */}
          {!isLocked && selectedPredictions.size > 0 && windowOpen && (
            <TouchableOpacity
              onPress={handleLockIn}
              style={{
                backgroundColor: '#4ADE80', borderRadius: 14,
                paddingVertical: 14, alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>
                LOCK IN {selectedPredictions.size} PREDICTION{selectedPredictions.size > 1 ? 'S' : ''} · 🪙{selectedPredictions.size * tokensBet}
              </Text>
            </TouchableOpacity>
          )}

          {/* Pick reminder */}
          {!isLocked && windowOpen && selectedPredictions.size === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                Pick up to {MAX_PICKS} predictions above
              </Text>
            </View>
          )}
        </View>


        {/* Empty state */}
        {!predictionWindow && !isLocked && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 52 }}>🏏</Text>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 12 }}>
              Waiting for next over...
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>
              Prediction window opens before each over begins
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Result overlay */}
      {overResult && (
        <OverPredictionResult
          visible={resultVisible}
          over={overResult.over_number}
          balls={overResult.balls ?? []}
          results={userResults}
          totalWon={totalWon}
          anyWon={totalWon > 0}
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
