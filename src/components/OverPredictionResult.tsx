import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { T } from '../config/theme';

interface PredictionResult {
  predictionId: string;
  won: boolean;
  tokensWon: number;
  mult?: number;
}

interface Props {
  visible: boolean;
  over: number;
  balls: string[];
  results: PredictionResult[];
  totalWon: number;
  anyWon: boolean;
  nextOverReady?: boolean;
  stats: {
    sixes: number; fours: number; wickets: number;
    wides: number; noBalls: number; dots: number; totalRuns: number;
  };
  onDismiss: () => void;
}

const PREDICTION_LABELS: Record<string, string> = {
  sixes_0: '0 Sixes', sixes_1plus: '1+ Sixes',
  fours_0to2: '0-2 Fours', fours_3plus: '3+ Fours', dots_4plus: '4+ Dots',
  wickets_0: 'No Wicket', wickets_1plus: '1+ Wickets',
  extras_0: 'No Extras', extras_1plus: '1+ Extras',
  runs_0to5: '0-5 Runs', runs_6to10: '6-10 Runs', runs_11to15: '11-15 Runs',
  runs_16to20: '16-20 Runs', runs_21plus: '21+ Runs',
  first_dot: 'First Dot', first_boundary: 'First Boundary',
  wicket_and_six: 'Wicket & Six', maiden: 'Maiden Over', clean: 'Clean Over',
};

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

function BallBubble({ outcome }: { outcome: string }) {
  const cfg = BALL_COLOR[outcome] ?? { bg: '#475569', label: '?' };
  return (
    <View style={{
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: cfg.bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 13 }}>{cfg.label}</Text>
    </View>
  );
}

export function OverPredictionResult({ visible, over, balls, results, totalWon, anyWon, nextOverReady, stats, onDismiss }: Props) {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 90, friction: 7 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const wins = results.filter(r => r.won).length;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
        justifyContent: 'flex-end',
      }}>
        <Animated.View style={{
          transform: [{ scale: scaleAnim }], opacity: opacityAnim,
          backgroundColor: '#0F172A',
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingTop: 24, paddingBottom: 40, paddingHorizontal: 20,
          borderTopWidth: 1,
          borderColor: anyWon ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)',
          maxHeight: '85%',
        }}>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 42, marginBottom: 8 }}>
                {wins === results.length ? '🎉' : wins > 0 ? '✨' : '😤'}
              </Text>
              <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '900', textAlign: 'center' }}>
                {wins === results.length
                  ? 'CLEAN SWEEP!'
                  : wins > 0 ? `${wins} of ${results.length} CORRECT`
                  : 'BETTER LUCK NEXT OVER'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
                Over {over} complete
              </Text>
            </View>

            {/* Ball sequence */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
              padding: 16, marginBottom: 16,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
                OVER {over} BALL BY BALL
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {balls.map((b, i) => <BallBubble key={i} outcome={b} />)}
              </View>
            </View>

            {/* Over stats */}
            <View style={{
              flexDirection: 'row', justifyContent: 'space-around',
              backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
              paddingVertical: 14, marginBottom: 16,
            }}>
              {[
                { label: 'Runs',  value: stats.totalRuns, color: '#FFF'    },
                { label: 'Fours', value: stats.fours,     color: T.gold    },
                { label: 'Sixes', value: stats.sixes,     color: T.live    },
                { label: 'Wkts',  value: stats.wickets,   color: '#A78BFA' },
                { label: 'Extra', value: stats.wides + stats.noBalls, color: '#60A5FA' },
              ].map(item => (
                <View key={item.label} style={{ alignItems: 'center' }}>
                  <Text style={{ color: item.color, fontWeight: '900', fontSize: 20 }}>{item.value}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' }}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Prediction results */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              {results.map(r => (
                <View key={r.predictionId} style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: r.won ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.07)',
                  borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
                  borderWidth: 1, borderColor: r.won ? 'rgba(74,222,128,0.22)' : 'rgba(239,68,68,0.12)',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 18 }}>{r.won ? '✅' : '❌'}</Text>
                    <View>
                      <Text style={{ color: r.won ? '#4ADE80' : 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 14 }}>
                        {PREDICTION_LABELS[r.predictionId] ?? r.predictionId}
                      </Text>
                      {r.mult && (
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{r.mult}× multiplier</Text>
                      )}
                    </View>
                  </View>
                  {r.won
                    ? <Text style={{ color: '#4ADE80', fontWeight: '900', fontSize: 16 }}>+{r.tokensWon}🪙</Text>
                    : <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>–</Text>
                  }
                </View>
              ))}
            </View>

            {/* Total payout */}
            {totalWon > 0 && (
              <View style={{
                backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 14,
                padding: 16, alignItems: 'center', marginBottom: 16,
                borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
              }}>
                <Text style={{ color: T.gold, fontSize: 28, fontWeight: '900' }}>+{totalWon} 🪙</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3 }}>tokens earned this over</Text>
              </View>
            )}

            {nextOverReady ? (
              <TouchableOpacity
                onPress={onDismiss}
                style={{
                  backgroundColor: '#4ADE80', borderRadius: 14,
                  paddingVertical: 16, alignItems: 'center', marginBottom: 8,
                }}
              >
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 16 }}>
                  ⚡ Over {over + 1} is LIVE — Predict Now!
                </Text>
                <Text style={{ color: 'rgba(0,0,0,0.55)', fontSize: 12, marginTop: 3 }}>
                  Tap to go to prediction window
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={{
                  backgroundColor: 'rgba(74,222,128,0.08)', borderRadius: 14, padding: 14,
                  alignItems: 'center', marginBottom: 8,
                }}>
                  <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 14 }}>
                    🎯 Waiting for Over {over + 1} to start…
                  </Text>
                </View>
                <TouchableOpacity onPress={onDismiss} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>tap to dismiss</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
