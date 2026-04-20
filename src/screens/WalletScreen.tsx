import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';

const D = {
  bg: '#0F1923', card: '#1A2332', primary: '#00D09C',
  gold: '#FFD700', text: '#FFFFFF', textSec: '#8B9CB3', border: '#253047',
};

const HOW_TO_EARN = [
  { icon: '⚡', title: '1v1 Win',      desc: 'Beat an opponent in battle',       reward: '+100 tokens' },
  { icon: '🏆', title: 'Contest Win',  desc: 'Correct community prediction',     reward: 'Prize pool' },
  { icon: '🔥', title: '3-Win Streak', desc: 'Win 3 battles in a row',           reward: '+50 bonus' },
  { icon: '📲', title: 'Refer Friend', desc: 'Friend joins with your code',      reward: '+200 tokens' },
  { icon: '🎁', title: 'Daily Bonus',  desc: 'Log in every day',                 reward: '+25 tokens' },
];

export default function WalletScreen({ navigation }: { navigation: any }) {
  const { user } = useAuthStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 14, padding: 4 }}>
          <Text style={{ color: D.text, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: D.text, fontWeight: '800', fontSize: 18 }}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Balance Card */}
        <View style={{ margin: 16 }}>
          <LinearGradient
            colors={['#00D09C', '#00897B']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 28, alignItems: 'center' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', letterSpacing: 1 }}>
              TOKEN BALANCE
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 52, fontWeight: '900', marginTop: 8 }}>
              {user?.tokens?.toLocaleString() ?? '0'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>🪙 Tokens</Text>
            {user?.isGuest && (
              <View style={{
                backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 99,
                paddingHorizontal: 14, paddingVertical: 6, marginTop: 16,
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                  Sign in with Google to save your balance
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Won', value: user?.totalWins ?? 0, color: D.primary },
            { label: 'Streak', value: user?.winStreak ?? 0, color: '#F59E0B' },
            { label: 'Level', value: user?.level ?? 1, color: '#7C3AED' },
          ].map(s => (
            <View key={s.label} style={{
              flex: 1, backgroundColor: D.card, borderRadius: 14, padding: 14, alignItems: 'center',
              borderWidth: 1, borderColor: D.border,
            }}>
              <Text style={{ color: s.color, fontSize: 22, fontWeight: '800' }}>{s.value}</Text>
              <Text style={{ color: D.textSec, fontSize: 11, marginTop: 3 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Signup Bonus Banner */}
        {!user?.isGuest && (user?.tokens ?? 0) >= 1000 && (
          <View style={{
            marginHorizontal: 16, marginBottom: 20,
            backgroundColor: '#FFD70015', borderRadius: 16, padding: 16,
            flexDirection: 'row', alignItems: 'center',
            borderWidth: 1, borderColor: '#FFD70030',
          }}>
            <Text style={{ fontSize: 28, marginRight: 14 }}>🎁</Text>
            <View>
              <Text style={{ color: D.gold, fontWeight: '700', fontSize: 14 }}>Welcome Bonus Claimed!</Text>
              <Text style={{ color: D.textSec, fontSize: 12, marginTop: 2 }}>1,000 free tokens credited</Text>
            </View>
          </View>
        )}

        {/* How to Earn */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: D.text, fontWeight: '800', fontSize: 18, marginBottom: 14 }}>
            How to Earn
          </Text>
          {HOW_TO_EARN.map(item => (
            <View key={item.title} style={{
              backgroundColor: D.card, borderRadius: 14, padding: 16,
              flexDirection: 'row', alignItems: 'center',
              marginBottom: 10, borderWidth: 1, borderColor: D.border,
            }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: '#00D09C15', alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: D.text, fontWeight: '700', fontSize: 14 }}>{item.title}</Text>
                <Text style={{ color: D.textSec, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
              </View>
              <View style={{
                backgroundColor: '#00D09C20', borderRadius: 99,
                paddingHorizontal: 10, paddingVertical: 4,
              }}>
                <Text style={{ color: D.primary, fontWeight: '700', fontSize: 12 }}>{item.reward}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
