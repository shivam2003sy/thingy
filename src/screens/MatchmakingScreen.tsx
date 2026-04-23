import React, { useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, Animated, TouchableOpacity, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { socketService } from '../socket/socketService';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MatchScenario } from '../types/game';
import { T } from '../config/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Matchmaking'> };

export default function MatchmakingScreen({ navigation }: Props) {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { startMatchmaking, setMatchFound } = useGameStore();
  const { user } = useAuthStore();

  useEffect(() => {
    startMatchmaking();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1.35, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]));

    const a1 = pulse(ring1, 0); const a2 = pulse(ring2, 300); const a3 = pulse(ring3, 600);
    a1.start(); a2.start(); a3.start();

    socketService.connect();
    socketService.on('matchFound', ({ matchId, scenario, opponentName }: {
      matchId: string; scenario: MatchScenario; opponentName: string;
    }) => {
      setMatchFound(matchId, scenario, opponentName);
      setTimeout(() => navigation.replace('Battle'), 300);
    });

    socketService.findMatch(user?.id ?? 'guest', user?.username ?? 'Player');

    return () => { a1.stop(); a2.stop(); a3.stop(); socketService.off('matchFound'); };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, opacity: fadeAnim }}>

        {/* Pulsing rings */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 44 }}>
          <Animated.View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: T.primary + '10', transform: [{ scale: ring3 }] }} />
          <Animated.View style={{ position: 'absolute', width: 136, height: 136, borderRadius: 68, backgroundColor: T.primary + '18', transform: [{ scale: ring2 }] }} />
          <Animated.View style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: T.primary + '28', transform: [{ scale: ring1 }] }} />
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', ...T.shadow }}>
            <Text style={{ fontSize: 32 }}>🏏</Text>
          </View>
        </View>

        <Text style={{ color: T.text, fontSize: 22, fontWeight: '800', marginBottom: 8 }}>Finding Opponent</Text>
        <Text style={{ color: T.textSec, fontSize: 14, textAlign: 'center', marginBottom: 40 }}>Matching you with a worthy challenger</Text>

        {/* VS Card */}
        <View style={{ width: '100%', backgroundColor: T.card, borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: T.border, ...T.shadow }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>🎮</Text>
            </View>
            <Text style={{ color: T.text, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
              {(user?.username ?? 'Player').slice(0, 12)}
            </Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>You</Text>
          </View>

          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: T.primary, fontWeight: '900', fontSize: 13 }}>VS</Text>
          </View>

          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: T.borderLight, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 24 }}>❓</Text>
            </View>
            <Text style={{ color: T.textMuted, fontSize: 13 }}>Searching…</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }}>Opponent</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => { socketService.cleanup(); navigation.goBack(); }} style={{ marginTop: 32 }}>
          <Text style={{ color: T.textMuted, fontSize: 13 }}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
