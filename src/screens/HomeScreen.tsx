import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserStore } from '../store/userStore';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const BATTLE_MODES = [
  {
    id: '1',
    icon: '🔥',
    title: 'Last Over Thriller',
    description: 'Predict each ball of the death over',
    hot: true,
  },
  {
    id: '2',
    icon: '⚡',
    title: 'Super Over',
    description: 'The most intense 6 balls in cricket',
    hot: true,
  },
  {
    id: '3',
    icon: '💨',
    title: 'Powerplay Special',
    description: 'How many runs in the first 6 overs?',
    hot: false,
  },
  {
    id: '4',
    icon: '🎯',
    title: 'Chase Control',
    description: 'Will the team chase it down?',
    hot: false,
  },
];

export default function HomeScreen({ navigation }: Props) {
  const { username, coins, level, xp, totalWins, winStreak, gamesPlayed } = useUserStore();
  const xpForNextLevel = level * 500;
  const xpProgress = Math.min((xp % 500) / 500, 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ color: '#A855F7', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
            THINGY 🏏
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800', marginTop: 4 }}>
            {username}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 }}>
          <StatCard label="Coins" value={`🪙 ${coins}`} color="#FBBF24" />
          <StatCard label="Level" value={`⚡ ${level}`} color="#A855F7" />
          <StatCard label="Wins" value={`🏆 ${totalWins}`} color="#22C55E" />
        </View>

        {/* XP Bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ color: '#71717A', fontSize: 11 }}>Level {level} Progress</Text>
            <Text style={{ color: '#71717A', fontSize: 11 }}>{xp % 500}/{500} XP</Text>
          </View>
          <View style={{ height: 6, backgroundColor: '#27272A', borderRadius: 99 }}>
            <View
              style={{
                height: '100%',
                width: `${xpProgress * 100}%`,
                backgroundColor: '#A855F7',
                borderRadius: 99,
              }}
            />
          </View>
        </View>

        {/* Win Streak */}
        {winStreak > 1 && (
          <View
            style={{
              marginHorizontal: 20,
              marginBottom: 16,
              backgroundColor: 'rgba(249,115,22,0.15)',
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 28, marginRight: 12 }}>🔥</Text>
            <View>
              <Text style={{ color: '#FB923C', fontWeight: '700', fontSize: 15 }}>
                {winStreak} Win Streak!
              </Text>
              <Text style={{ color: 'rgba(253,186,116,0.7)', fontSize: 12, marginTop: 2 }}>
                Keep going, you're unstoppable!
              </Text>
            </View>
          </View>
        )}

        {/* CTA Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 6 }}>
            1v1 Cricket Prediction
          </Text>
          <Text style={{ color: '#71717A', fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
            Predict ball-by-ball outcomes. Battle a real opponent live. Best predictor wins.
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Matchmaking')}
            style={{ borderRadius: 18, overflow: 'hidden' }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '800' }}>
                ⚡ Start Battle
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {gamesPlayed > 0 && (
            <Text style={{ color: '#3F3F46', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
              {gamesPlayed} games played · {totalWins} wins
            </Text>
          )}
        </View>

        {/* Battle Modes */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              color: '#52525B',
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1.5,
              marginBottom: 12,
            }}
          >
            BATTLE MODES
          </Text>
          {BATTLE_MODES.map(mode => (
            <View
              key={mode.id}
              style={{
                backgroundColor: '#18181B',
                borderRadius: 16,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 28, marginRight: 14 }}>{mode.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>
                  {mode.title}
                </Text>
                <Text style={{ color: '#71717A', fontSize: 12, marginTop: 2 }}>
                  {mode.description}
                </Text>
              </View>
              {mode.hot && (
                <View
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.2)',
                    borderRadius: 99,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: '#F87171', fontSize: 11, fontWeight: '700' }}>HOT</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#18181B',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
      }}
    >
      <Text style={{ color, fontSize: 17, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: '#71717A', fontSize: 11, marginTop: 3 }}>{label}</Text>
    </View>
  );
}
