import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { T } from '../config/theme';

const LEVEL_NAMES = ['Rookie', 'Amateur', 'Pro', 'Expert', 'Elite', 'Legend'];

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [notifs, setNotifs] = useState(true);

  const levelName = LEVEL_NAMES[Math.min((user?.level ?? 1) - 1, LEVEL_NAMES.length - 1)];
  const xpProgress = ((user?.xp ?? 0) % 500) / 500;
  const xpToNext = 500 - ((user?.xp ?? 0) % 500);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); } },
    ]);
  };

  const STATS = [
    { label: 'Games', value: user?.gamesPlayed ?? 0, color: T.blue },
    { label: 'Wins',  value: user?.totalWins ?? 0,   color: T.primary },
    { label: 'Streak', value: user?.winStreak ?? 0,  color: T.gold },
    { label: 'Level', value: user?.level ?? 1,       color: T.purple },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: T.border, paddingHorizontal: 20, paddingVertical: 14 }}>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 18 }}>Profile</Text>
        </View>

        {/* Avatar card */}
        <View style={{ backgroundColor: '#FFF', padding: 24, alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 84, height: 84, borderRadius: 42,
            backgroundColor: T.primaryLight,
            borderWidth: 3, borderColor: T.primary,
            alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          }}>
            <Text style={{ fontSize: 38 }}>🏏</Text>
          </View>
          <Text style={{ color: T.text, fontSize: 20, fontWeight: '800' }}>{user?.username ?? 'Player'}</Text>
          {user?.email && <Text style={{ color: T.textSec, fontSize: 13, marginTop: 3 }}>{user.email}</Text>}
          <View style={{
            flexDirection: 'row', alignItems: 'center', marginTop: 10,
            backgroundColor: T.purpleLight, borderRadius: 99,
            paddingHorizontal: 14, paddingVertical: 5,
          }}>
            <Text style={{ color: T.purple, fontWeight: '700', fontSize: 13 }}>
              Lv.{user?.level ?? 1} {levelName}
            </Text>
          </View>

          {/* XP bar */}
          <View style={{ width: '100%', marginTop: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: T.textSec, fontSize: 11 }}>XP Progress</Text>
              <Text style={{ color: T.textSec, fontSize: 11 }}>{xpToNext} XP to next level</Text>
            </View>
            <View style={{ height: 7, backgroundColor: T.border, borderRadius: 99 }}>
              <View style={{ height: '100%', width: `${xpProgress * 100}%`, backgroundColor: T.purple, borderRadius: 99 }} />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 12 }}>
          {STATS.map(s => (
            <View key={s.label} style={{
              width: '47%', backgroundColor: '#FFF', borderRadius: 14,
              padding: 16, alignItems: 'center', ...T.shadowSm,
            }}>
              <Text style={{ color: s.color, fontSize: 26, fontWeight: '900' }}>{s.value}</Text>
              <Text style={{ color: T.textSec, fontSize: 11, marginTop: 3 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Token balance */}
        <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFF', borderRadius: 16, padding: 18, ...T.shadowSm }}>
          <Text style={{ color: T.textSec, fontSize: 11, fontWeight: '600', marginBottom: 6 }}>TOKEN BALANCE</Text>
          <Text style={{ color: T.text, fontSize: 28, fontWeight: '900' }}>🪙 {user?.tokens?.toLocaleString() ?? '0'}</Text>
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 12 }}>Settings</Text>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', ...T.shadowSm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ fontSize: 18, marginRight: 14 }}>🔔</Text>
              <Text style={{ flex: 1, color: T.text, fontSize: 14 }}>Push Notifications</Text>
              <Switch
                value={notifs} onValueChange={setNotifs}
                trackColor={{ false: T.border, true: T.primary + '80' }}
                thumbColor={notifs ? T.primary : T.textMuted}
              />
            </View>
            {[
              { icon: '🔒', label: 'Privacy Policy' },
              { icon: '📋', label: 'Terms of Service' },
              { icon: '⭐', label: 'Rate App' },
            ].map(item => (
              <View key={item.label}>
                <View style={{ height: 1, backgroundColor: T.border }} />
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text style={{ fontSize: 18, marginRight: 14 }}>{item.icon}</Text>
                  <Text style={{ flex: 1, color: T.text, fontSize: 14 }}>{item.label}</Text>
                  <Text style={{ color: T.textMuted, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              marginTop: 20, borderRadius: 14, padding: 16, alignItems: 'center',
              backgroundColor: '#FFF', borderWidth: 1.5, borderColor: T.live + '40',
            }}
          >
            <Text style={{ color: T.live, fontWeight: '700', fontSize: 15 }}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={{ color: T.textMuted, fontSize: 11, textAlign: 'center', marginTop: 24 }}>
            Thingy v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
