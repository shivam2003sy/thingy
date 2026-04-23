import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Modal, TouchableOpacity } from 'react-native';
import { T } from '../config/theme';

interface Props {
  visible: boolean;
  correct: boolean;
  nearMiss: boolean;
  tokensWon: number;
  outcome: string;
  streakCount: number;
  onDismiss: () => void;
}

const OUTCOME_LABELS: Record<string, string> = {
  dot: '● DOT', single: '1 RUN', double: '2 RUNS', triple: '3 RUNS',
  four: '4️⃣ FOUR', six: '6️⃣ SIX', wicket: '🔴 WICKET', wide: 'WIDE', no_ball: 'NO BALL',
};

export function BallRushResult({ visible, correct, nearMiss, tokensWon, outcome, streakCount, onDismiss }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    if (correct) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (nearMiss) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      // Shake animation for wrong
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]),
      ]).start();
    }

    const timer = setTimeout(() => {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      shakeAnim.setValue(0);
      onDismiss();
    }, 2_800);
    return () => clearTimeout(timer);
  }, [visible]);

  const bgColor   = correct ? '#16A34A' : nearMiss ? '#D97706' : '#DC2626';
  const emoji     = correct ? '🎉' : nearMiss ? '🔥' : '😅';
  const headline  = correct
    ? streakCount >= 3 ? `🔥 x${streakCount} STREAK!` : 'YOU CALLED IT!'
    : nearMiss ? 'SO CLOSE!' : 'NEXT BALL!';
  const subtext = correct
    ? `+${tokensWon} tokens earned`
    : nearMiss ? `+${tokensWon} tokens (near miss)`
    : 'Better luck next ball';

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Animated.View style={{
          transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
          opacity: opacityAnim,
          backgroundColor: bgColor,
          borderRadius: 28, paddingVertical: 40, paddingHorizontal: 48,
          alignItems: 'center', minWidth: 260,
        }}>
          <Text style={{ fontSize: 56, marginBottom: 8 }}>{emoji}</Text>
          <Text style={{ color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
            {headline}
          </Text>
          <View style={{
            backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12,
            paddingHorizontal: 18, paddingVertical: 8, marginTop: 12, marginBottom: 6,
          }}>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center' }}>
              {OUTCOME_LABELS[outcome] ?? outcome.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 8, fontWeight: '600' }}>
            {subtext}
          </Text>
          <TouchableOpacity onPress={onDismiss} style={{ marginTop: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>tap to dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
