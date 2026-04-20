import React, { useState, useEffect } from 'react';
import {
  View, Text, SafeAreaView, ScrollView, TouchableOpacity, Animated, Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../socket/socketService';

const D = {
  bg: '#0F1923', card: '#1A2332', cardAlt: '#1E2D3D',
  primary: '#00D09C', gold: '#FFD700', live: '#FF4B55',
  text: '#FFFFFF', textSec: '#8B9CB3', border: '#253047',
};

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
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!contest) return;

    // Countdown timer
    const tick = () => {
      const diff = contest.endsAt - Date.now();
      if (diff <= 0) { setTimeLeft('Closed'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(timer);
  }, [contest]);

  if (!contest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: D.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: D.textSec }}>Contest not found</Text>
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
      // Emit to server
      (socketService as any).emit?.('joinContest', {
        contestId: contest.id,
        userId: user?.id,
        optionId: selectedOption,
      });

      // Optimistic update
      updateTokens(-contest.entryFee);
      setJoined(true);
    } finally {
      setLoading(false);
    }
  };

  const accentColors: Record<string, string> = {
    match_winner: '#7C3AED', over_runs: '#0369A1',
    last_over_total: '#D97706', player_milestone: '#059669',
  };
  const accent = accentColors[contest.type] ?? D.primary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 14, padding: 4 }}>
          <Text style={{ color: D.text, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: D.textSec, fontSize: 11 }}>{contest.matchName}</Text>
          <Text style={{ color: D.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{contest.title}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: D.textSec, fontSize: 10 }}>CLOSES IN</Text>
          <Text style={{ color: timeLeft === 'Closed' ? D.live : D.primary, fontWeight: '700', fontSize: 13 }}>
            {timeLeft}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Prize & Stats */}
        <View style={{ padding: 16 }}>
          <LinearGradient
            colors={[accent + '30', accent + '10']}
            style={{ borderRadius: 18, padding: 20, borderWidth: 1, borderColor: accent + '40' }}
          >
            <Text style={{ color: D.textSec, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>PRIZE POOL</Text>
            <Text style={{ color: D.gold, fontSize: 32, fontWeight: '900', marginTop: 4 }}>
              🏆 {contest.prizePool.toLocaleString()} tokens
            </Text>
            <Text style={{ color: D.textSec, fontSize: 12, marginTop: 4 }}>{contest.description}</Text>

            <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
              <StatBox label="Entry" value={`🪙 ${contest.entryFee}`} />
              <StatBox label="Spots Left" value={(contest.maxParticipants - contest.participants).toLocaleString()} />
              <StatBox label="Joined" value={contest.participants.toLocaleString()} />
            </View>

            {/* Fill bar */}
            <View style={{ height: 6, backgroundColor: '#253047', borderRadius: 99, marginTop: 14 }}>
              <View style={{ height: '100%', width: `${fillPct}%`, backgroundColor: fillPct > 80 ? D.live : D.primary, borderRadius: 99 }} />
            </View>
            <Text style={{ color: D.textSec, fontSize: 11, marginTop: 4, textAlign: 'right' }}>
              {fillPct.toFixed(0)}% full
            </Text>
          </LinearGradient>
        </View>

        {/* Prediction Options */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ color: D.text, fontWeight: '800', fontSize: 18, marginBottom: 14 }}>
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
                    backgroundColor: isSelected ? accent + '25' : D.card,
                    borderRadius: 16, padding: 20,
                    flexDirection: 'row', alignItems: 'center',
                    borderWidth: 2, borderColor: isSelected ? accent : D.border,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 28, marginRight: 16 }}>{opt.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isSelected ? D.text : D.textSec, fontWeight: '700', fontSize: 17 }}>
                      {opt.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>
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
          backgroundColor: D.bg, borderTopWidth: 1, borderTopColor: D.border,
          padding: 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: D.textSec, fontSize: 13 }}>Your balance</Text>
            <Text style={{ color: D.gold, fontWeight: '700', fontSize: 14 }}>🪙 {user?.tokens?.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            onPress={handleJoin}
            disabled={!selectedOption || loading || !hasEnough}
            style={{ borderRadius: 16, overflow: 'hidden', opacity: (!selectedOption || !hasEnough) ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={[D.primary, '#00897B']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>
                {loading ? '⏳ Joining...' : !hasEnough ? '❌ Not Enough Tokens' : `Confirm Prediction · 🪙 ${contest.entryFee}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#00D09C18', borderTopWidth: 1, borderTopColor: '#00D09C40', padding: 20,
          alignItems: 'center',
        }}>
          <Text style={{ color: D.primary, fontWeight: '800', fontSize: 17 }}>🎯 Prediction Locked In!</Text>
          <Text style={{ color: D.textSec, fontSize: 13, marginTop: 4 }}>You'll be notified when results are out</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
      <Text style={{ color: D.text, fontWeight: '700', fontSize: 14 }}>{value}</Text>
      <Text style={{ color: D.textSec, fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
