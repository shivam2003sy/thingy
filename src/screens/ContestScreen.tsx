import React, { useState, useEffect } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../socket/socketService';
import { T } from '../config/theme';

interface ContestOption { id: string; label: string; icon: string }
interface Contest {
  id: string; matchId: string; matchName: string; type: string;
  title: string; description: string; entryFee: number; prizePool: number;
  maxParticipants: number; participants: number; endsAt: number; status: string;
  options: ContestOption[];
}

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function ContestScreen({ navigation, route }: Props) {
  const contest = route.params?.contest as Contest | undefined;
  const { user, updateTokens } = useAuthStore();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [joined,  setJoined]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!contest) return;
    const tick = () => {
      const diff = contest.endsAt - Date.now();
      if (diff <= 0) { setTimeLeft('Closed'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [contest]);

  if (!contest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: T.textSec }}>Contest not found</Text>
      </SafeAreaView>
    );
  }

  const fillPct  = Math.min((contest.participants / contest.maxParticipants) * 100, 100);
  const hasEnough = (user?.tokens ?? 0) >= contest.entryFee;

  const handleJoin = async () => {
    if (!selectedOption) { Alert.alert('Pick an option first!'); return; }
    if (!hasEnough) { Alert.alert('Not enough tokens!', `You need ${contest.entryFee} tokens.`); return; }
    if (joined) return;
    setLoading(true);
    try {
      (socketService as any).emit?.('joinContest', { contestId: contest.id, userId: user?.id, optionId: selectedOption });
      updateTokens(-contest.entryFee);
      setJoined(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 14, backgroundColor: '#FFF',
        borderBottomWidth: 1, borderBottomColor: T.border,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 14, padding: 4 }}>
          <Text style={{ color: T.text, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: T.textSec, fontSize: 11 }}>{contest.matchName}</Text>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{contest.title}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: T.textSec, fontSize: 10 }}>CLOSES IN</Text>
          <Text style={{ color: timeLeft === 'Closed' ? T.live : T.primary, fontWeight: '700', fontSize: 13 }}>
            {timeLeft}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Prize Card */}
        <View style={{ margin: 16 }}>
          <LinearGradient
            colors={[T.primary, T.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18, padding: 20 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>PRIZE POOL</Text>
            <Text style={{ color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 4 }}>
              🏆 {contest.prizePool.toLocaleString()} tokens
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>{contest.description}</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              {[
                { label: 'Entry', value: `🪙 ${contest.entryFee}` },
                { label: 'Spots Left', value: String(contest.maxParticipants - contest.participants) },
                { label: 'Joined', value: String(contest.participants) },
              ].map(s => (
                <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>{s.value}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 5, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 99, marginTop: 14 }}>
              <View style={{ height: '100%', width: `${fillPct}%`, backgroundColor: '#FFF', borderRadius: 99, opacity: 0.8 }} />
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4, textAlign: 'right' }}>
              {fillPct.toFixed(0)}% full
            </Text>
          </LinearGradient>
        </View>

        {/* Options */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 16, marginBottom: 14 }}>
            {joined ? '✅ Your Prediction' : 'Make Your Prediction'}
          </Text>
          <View style={{ gap: 12 }}>
            {contest.options.map(opt => {
              const isSelected = selectedOption === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => !joined && setSelectedOption(opt.id)}
                  disabled={joined}
                  style={{
                    backgroundColor: isSelected ? T.primaryLight : '#FFF',
                    borderRadius: 16, padding: 20,
                    flexDirection: 'row', alignItems: 'center',
                    borderWidth: 2, borderColor: isSelected ? T.primary : T.border,
                    ...T.shadowSm,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28, marginRight: 16 }}>{opt.icon}</Text>
                  <Text style={{ flex: 1, color: isSelected ? T.primaryDark : T.text, fontWeight: '700', fontSize: 16 }}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 14 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      {!joined ? (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: T.border, padding: 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: T.textSec, fontSize: 13 }}>Your balance</Text>
            <Text style={{ color: T.gold, fontWeight: '700', fontSize: 14 }}>🪙 {user?.tokens?.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            onPress={handleJoin}
            disabled={!selectedOption || loading || !hasEnough}
            style={{ borderRadius: 16, overflow: 'hidden', opacity: (!selectedOption || !hasEnough) ? 0.45 : 1 }}
          >
            <LinearGradient
              colors={[T.primary, T.primaryDark]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17 }}>
                {loading ? 'Joining...' : !hasEnough ? 'Not Enough Tokens' : `Confirm · 🪙 ${contest.entryFee}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: T.primaryLight, borderTopWidth: 1, borderTopColor: T.primary + '40',
          padding: 20, alignItems: 'center',
        }}>
          <Text style={{ color: T.primaryDark, fontWeight: '800', fontSize: 17 }}>🎯 Prediction Locked In!</Text>
          <Text style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>You'll be notified when results are out</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
