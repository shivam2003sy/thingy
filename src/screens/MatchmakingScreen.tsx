import React, { useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, Animated, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { socketService } from '../socket/socketService';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MatchScenario } from '../types/game';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Matchmaking'>;
};

export default function MatchmakingScreen({ navigation }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;

  const { startMatchmaking, setMatchFound } = useGameStore();
  const { user } = useAuthStore();
  const username = user?.username ?? 'Player';

  useEffect(() => {
    startMatchmaking();

    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();

    socketService.connect();

    socketService.on(
      'matchFound',
      ({
        matchId,
        scenario,
        opponentName,
      }: {
        matchId: string;
        scenario: MatchScenario;
        opponentName: string;
      }) => {
        setMatchFound(matchId, scenario, opponentName);
        setTimeout(() => navigation.replace('Battle'), 300);
      },
    );

    const { user: u } = useAuthStore.getState();
    socketService.findMatch(u?.id ?? 'guest', u?.username ?? 'Player');

    return () => {
      pulse.stop();
      socketService.off('matchFound');
    };
  }, []);

  const handleCancel = () => {
    socketService.cleanup();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          opacity: fadeAnim,
        }}
      >
        {/* Pulsing Ball */}
        <View style={{ marginBottom: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(168,85,247,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: 'rgba(168,85,247,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 40 }}>🏏</Text>
            </Animated.View>
          </Animated.View>
        </View>

        <Text
          style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginBottom: 8 }}
        >
          Finding Opponent...
        </Text>
        <Text
          style={{ color: '#71717A', fontSize: 14, textAlign: 'center', marginBottom: 44 }}
        >
          Matching you with a worthy challenger
        </Text>

        {/* VS Card */}
        <View
          style={{
            width: '100%',
            backgroundColor: '#18181B',
            borderRadius: 24,
            padding: 24,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* You */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(168,85,247,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 24 }}>🎮</Text>
            </View>
            <Text
              style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}
              numberOfLines={1}
            >
              {username.length > 12 ? username.slice(0, 12) + '…' : username}
            </Text>
            <Text style={{ color: '#52525B', fontSize: 11, marginTop: 2 }}>You</Text>
          </View>

          <Text style={{ color: '#A855F7', fontWeight: '800', fontSize: 20 }}>VS</Text>

          {/* Opponent */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#27272A',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 24 }}>❓</Text>
            </View>
            <Text style={{ color: '#52525B', fontWeight: '500', fontSize: 13 }}>
              Searching
            </Text>
            <Text style={{ color: '#3F3F46', fontSize: 11, marginTop: 2 }}>Opponent</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleCancel} style={{ marginTop: 32 }}>
          <Text style={{ color: '#3F3F46', fontSize: 13 }}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
