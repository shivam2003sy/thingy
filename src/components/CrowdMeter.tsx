import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { T } from '../config/theme';

interface Props {
  percentages: Record<string, number>;
  total: number;
}

const OPTION_LABELS: Record<string, string> = {
  dot: '●', single: '1', double: '2', triple: '3',
  four: '4', six: '6', wicket: 'W', wide: 'WD', no_ball: 'NB',
};

const OPTION_COLORS: Record<string, string> = {
  dot:     '#64748B',
  single:  '#3B82F6',
  double:  '#06B6D4',
  triple:  '#8B5CF6',
  four:    '#F59E0B',
  six:     '#EF4444',
  wicket:  '#7C3AED',
  wide:    '#10B981',
  no_ball: '#F97316',
};

export function CrowdMeter({ percentages, total }: Props) {
  const entries = Object.entries(percentages).filter(([, pct]) => pct > 0);
  entries.sort(([, a], [, b]) => b - a);

  return (
    <View style={{ paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: T.textSec, fontSize: 11, fontWeight: '600', flex: 1 }}>
          CROWD IS PREDICTING
        </Text>
        <Text style={{ color: T.textSec, fontSize: 11 }}>{total} players</Text>
      </View>

      {entries.length === 0 ? (
        <Text style={{ color: T.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 8 }}>
          Be the first to predict!
        </Text>
      ) : (
        entries.map(([key, pct]) => (
          <CrowdBar key={key} label={OPTION_LABELS[key] ?? key} pct={pct} color={OPTION_COLORS[key] ?? T.primary} />
        ))
      )}
    </View>
  );
}

function CrowdBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct / 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ marginBottom: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
        <Text style={{ color: T.text, fontWeight: '700', fontSize: 13, width: 28 }}>{label}</Text>
        <View style={{ flex: 1, height: 10, backgroundColor: T.border, borderRadius: 99, overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', width, backgroundColor: color, borderRadius: 99 }} />
        </View>
        <Text style={{ color: T.text, fontWeight: '700', fontSize: 12, width: 34, textAlign: 'right' }}>
          {pct}%
        </Text>
      </View>
    </View>
  );
}
