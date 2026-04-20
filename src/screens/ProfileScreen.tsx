import React, { useState } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/authStore';

const D = {
  bg: '#0F1923', card: '#1A2332', primary: '#00D09C',
  gold: '#FFD700', live: '#FF4B55', text: '#FFFFFF',
  textSec: '#8B9CB3', border: '#253047',
};

const LEVEL_NAMES = ['Rookie', 'Amateur', 'Pro', 'Expert', 'Elite', 'Legend'];

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, signOut } = useAuthStore();
  const [notifs, setNotifs] = useState(true);

  const levelName = LEVEL_NAMES[Math.min((user?.level ?? 1) - 1, LEVEL_NAMES.length - 1)];
  const xpProgress = ((user?.xp ?? 0) % 500) / 500;
  const xpToNext = 500 - ((user?.xp ?? 0) % 500);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await signOut(); },
      },
    ]);
  };

  const STATS = [
    { label: 'Games', value: user?.gamesPlayed ?? 0, color: D.primary },
    { label: 'Wins', value: user?.totalWins ?? 0, color: '#22C55E' },
    { label: 'Streak', value: user?.winStreak ?? 0, color: '#F59E0B' },
    { label: 'Level', value: user?.level ?? 1, color: '#7C3AED' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <LinearGradient
          colors={['#1A2332', '#0F1923']}
          style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ color: D.text, fontWeight: '800', fontSize: 18, flex: 1 }}>Profile</Text>
            {user?.isGuest && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Auth')}
                style={{
                  backgroundColor: D.primary, borderRadius: 99,
                  paddingHorizontal: 14, paddingVertical: 6,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Avatar + name */}
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: D.primary + '30',
              borderWidth: 2, borderColor: D.primary,
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Text style={{ fontSize: 36 }}>🏏</Text>
            </View>
            <Text style={{ color: D.text, fontSize: 20, fontWeight: '800' }}>
              {user?.username ?? 'Guest'}
            </Text>
            {user?.email && (
              <Text style={{ color: D.textSec, fontSize: 12, marginTop: 2 }}>{user.email}</Text>
            )}
            <View style={{
              flexDirection: 'row', alignItems: 'center', marginTop: 8,
              backgroundColor: '#7C3AED20', borderRadius: 99,
              paddingHorizontal: 14, paddingVertical: 4,
              borderWidth: 1, borderColor: '#7C3AED40',
            }}>
              <Text style={{ color: '#7C3AED', fontWeight: '700', fontSize: 13 }}>
                Lv.{user?.level ?? 1} {levelName}
              </Text>
            </View>
          </View>

          {/* XP bar */}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: D.textSec, fontSize: 11 }}>XP Progress</Text>
              <Text style={{ color: D.textSec, fontSize: 11 }}>{xpToNext} XP to next level</Text>
            </View>
            <View style={{ height: 6, backgroundColor: D.border, borderRadius: 99 }}>
              <View style={{
                height: '100%', width: `${xpProgress * 100}%`,
                backgroundColor: '#7C3AED', borderRadius: 99,
              }} />
            </View>
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <View style={{
          flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16,
          gap: 10, marginTop: 16, marginBottom: 20,
        }}>
          {STATS.map(s => (
            <View key={s.label} style={{
              width: '47%', backgroundColor: D.card, borderRadius: 14,
              padding: 16, alignItems: 'center',
              borderWidth: 1, borderColor: D.border,
            }}>
              <Text style={{ color: s.color, fontSize: 26, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: D.textSec, fontSize: 11, marginTop: 3 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Token balance */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
            <LinearGradient
              colors={['#00D09C', '#00897B']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16, padding: 18,
                flexDirection: 'row', alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                  TOKEN BALANCE
                </Text>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 2 }}>
                  🪙 {user?.tokens?.toLocaleString() ?? '0'}
                </Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 22 }}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: D.text, fontWeight: '800', fontSize: 16, marginBottom: 12 }}>Settings</Text>

          <View style={{
            backgroundColor: D.card, borderRadius: 16,
            borderWidth: 1, borderColor: D.border, overflow: 'hidden',
          }}>
            <SettingRow
              icon="🔔"
              label="Push Notifications"
              right={
                <Switch
                  value={notifs}
                  onValueChange={setNotifs}
                  trackColor={{ false: D.border, true: D.primary + '80' }}
                  thumbColor={notifs ? D.primary : D.textSec}
                />
              }
            />
            <View style={{ height: 1, backgroundColor: D.border }} />
            <SettingRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
            <View style={{ height: 1, backgroundColor: D.border }} />
            <SettingRow icon="📋" label="Terms of Service" onPress={() => {}} />
            <View style={{ height: 1, backgroundColor: D.border }} />
            <SettingRow icon="⭐" label="Rate App" onPress={() => {}} />
          </View>

          {/* Guest upgrade prompt */}
          {user?.isGuest && (
            <View style={{
              marginTop: 20, backgroundColor: D.primary + '15',
              borderRadius: 16, padding: 18,
              borderWidth: 1, borderColor: D.primary + '30',
            }}>
              <Text style={{ color: D.primary, fontWeight: '700', fontSize: 14, marginBottom: 4 }}>
                Save Your Progress
              </Text>
              <Text style={{ color: D.textSec, fontSize: 12, marginBottom: 14 }}>
                Sign in with Google to keep your tokens & stats forever
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Auth')}
                style={{
                  backgroundColor: D.primary, borderRadius: 12,
                  paddingVertical: 12, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Sign In with Google</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign out */}
          {!user?.isGuest && (
            <TouchableOpacity
              onPress={handleSignOut}
              style={{
                marginTop: 20, borderRadius: 14, padding: 16,
                alignItems: 'center', borderWidth: 1, borderColor: D.live + '40',
                backgroundColor: D.live + '10',
              }}
            >
              <Text style={{ color: D.live, fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
            </TouchableOpacity>
          )}

          <Text style={{ color: '#2A3A4A', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
            Thingy v1.0.0 · Made with ❤️ for cricket fans
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  icon, label, right, onPress,
}: {
  icon: string; label: string; right?: React.ReactNode; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
      }}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={{ fontSize: 18, marginRight: 14 }}>{icon}</Text>
      <Text style={{ flex: 1, color: '#FFFFFF', fontSize: 14 }}>{label}</Text>
      {right ?? <Text style={{ color: '#253047', fontSize: 16 }}>›</Text>}
    </TouchableOpacity>
  );
}
