import React from 'react';
import { View, Text, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuthStore } from '../store/authStore';
import { T } from '../config/theme';

const HOW_TO_EARN = [
  { icon: '⚡', title: '1v1 Win',      desc: 'Beat an opponent in battle',     reward: '+100 tokens' },
  { icon: '🏆', title: 'Contest Win',  desc: 'Correct community prediction',   reward: 'Prize pool' },
  { icon: '🔥', title: '3-Win Streak', desc: 'Win 3 battles in a row',         reward: '+50 bonus' },
  { icon: '📲', title: 'Refer Friend', desc: 'Friend joins with your code',    reward: '+200 tokens' },
  { icon: '🎁', title: 'Daily Bonus',  desc: 'Log in every day',               reward: '+25 tokens' },
];

export default function WalletScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 14, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: T.border,
      }}>
        <Text style={{ color: T.text, fontWeight: '800', fontSize: 18 }}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={{ margin: 16 }}>
          <LinearGradient
            colors={[T.primary, T.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 28, alignItems: 'center' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', letterSpacing: 1.5 }}>
              TOKEN BALANCE
            </Text>
            <Text style={{ color: '#FFF', fontSize: 52, fontWeight: '900', marginTop: 8 }}>
              {user?.tokens?.toLocaleString() ?? '0'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 }}>🪙 Tokens</Text>
          </LinearGradient>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Won', value: user?.totalWins ?? 0, color: T.primary },
            { label: 'Streak', value: user?.winStreak ?? 0, color: T.gold },
            { label: 'Level', value: user?.level ?? 1, color: T.purple },
          ].map(s => (
            <View key={s.label} style={{
              flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 16,
              alignItems: 'center', ...T.shadowSm,
            }}>
              <Text style={{ color: s.color, fontSize: 24, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* How to Earn */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 16, marginBottom: 14 }}>How to Earn</Text>
          <View style={{ backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden', ...T.shadow }}>
            {HOW_TO_EARN.map((item, idx) => (
              <View key={item.title}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: T.border }} />}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                  <View style={{
                    width: 44, height: 44, borderRadius: 12,
                    backgroundColor: T.primaryLight,
                    alignItems: 'center', justifyContent: 'center', marginRight: 14,
                  }}>
                    <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontWeight: '700', fontSize: 14 }}>{item.title}</Text>
                    <Text style={{ color: T.textSec, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
                  </View>
                  <View style={{ backgroundColor: T.primaryLight, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: T.primaryDark, fontWeight: '700', fontSize: 12 }}>{item.reward}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
