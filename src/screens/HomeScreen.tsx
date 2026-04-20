import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  Animated, RefreshControl, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../socket/socketService';

type Props = { navigation: NativeStackNavigationProp<any> };

const D = {
  bg: '#0F1923', card: '#1A2332', cardAlt: '#1E2D3D',
  primary: '#00D09C', gold: '#FFD700',
  live: '#FF4B55', text: '#FFFFFF', textSec: '#8B9CB3',
  border: '#253047', green: '#27AE60',
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface LiveMatch {
  id: string; name: string; matchType: string; status: string;
  team1: { shortName: string; score: string; overs: string };
  team2: { shortName: string; score: string; overs: string };
  currentBatsmen: string[]; currentBowler: string; requiredRR?: number;
}

interface Contest {
  id: string; matchId: string; matchName: string; type: string;
  title: string; description: string; entryFee: number; prizePool: number;
  maxParticipants: number; participants: number; endsAt: number;
  status: string;
  options: Array<{ id: string; label: string; icon: string }>;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [matches,   setMatches]   = useState<LiveMatch[]>([]);
  const [contests,  setContests]  = useState<Contest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const liveDot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDot, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(liveDot, { toValue: 1,   duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Fetch initial data
    socketService.on('liveMatches' as any, setMatches);
    socketService.on('contests' as any,    setContests);
    socketService.on('matchesUpdated' as any, setMatches);
    socketService.on('contestsUpdated' as any, setContests);
    (socketService as any).emit?.('getLiveMatches');
    (socketService as any).emit?.('getContests');

    // Mock data for when running without backend
    setTimeout(() => {
      if (matches.length === 0) setMatches(MOCK_MATCHES);
      if (contests.length === 0) setContests(MOCK_CONTESTS);
    }, 800);

    return () => {
      socketService.off('liveMatches' as any);
      socketService.off('contests' as any);
      socketService.off('matchesUpdated' as any);
      socketService.off('contestsUpdated' as any);
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    (socketService as any).emit?.('getLiveMatches');
    (socketService as any).emit?.('getContests');
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const liveMatches   = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.border,
      }}>
        <View>
          <Text style={{ color: D.textSec, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
            THINGY 🏏
          </Text>
          <Text style={{ color: D.text, fontSize: 18, fontWeight: '800', marginTop: 1 }}>
            Hey, {user?.username?.split('_')[0] ?? 'Player'} 👋
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Wallet' as any)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: D.card, borderRadius: 99,
            paddingHorizontal: 14, paddingVertical: 8,
            borderWidth: 1, borderColor: D.border,
          }}
        >
          <Text style={{ fontSize: 16 }}>🪙</Text>
          <Text style={{ color: D.gold, fontWeight: '800', fontSize: 15 }}>
            {user?.tokens?.toLocaleString() ?? '0'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Live Matches Strip */}
        {liveMatches.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 12 }}>
              <Animated.View style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: D.live, marginRight: 8, opacity: liveDot,
              }} />
              <Text style={{ color: D.text, fontWeight: '700', fontSize: 14 }}>LIVE</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
              {liveMatches.map(m => (
                <LiveMatchCard key={m.id} match={m} onPress={() => {}} liveDot={liveDot} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 20, gap: 10 }}>
          <QuickAction icon="⚡" label="1v1 Battle" color="#7C3AED" onPress={() => navigation.navigate('Battle' as any)} />
          <QuickAction icon="🏆" label="Contests" color="#D97706" onPress={() => navigation.navigate('Contests' as any)} />
          <QuickAction icon="📊" label="Leaderboard" color="#0369A1" onPress={() => {}} />
          <QuickAction icon="🎯" label="My Picks" color="#059669" onPress={() => {}} />
        </View>

        {/* Featured Contest Banner */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Contests' as any)}
            activeOpacity={0.9}
            style={{ borderRadius: 18, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#00D09C', '#00897B']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>
                  IPL 2025 SPECIAL
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 2 }}>
                  Predict & Win
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
                  🏆 Prize pool up to 50,000 tokens
                </Text>
              </View>
              <Text style={{ fontSize: 56 }}>🏏</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Contests List */}
        <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ color: D.text, fontWeight: '800', fontSize: 18 }}>Open Contests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Contests' as any)}>
              <Text style={{ color: D.primary, fontSize: 13, fontWeight: '600' }}>See All →</Text>
            </TouchableOpacity>
          </View>
          {contests.slice(0, 6).map(c => (
            <ContestCard key={c.id} contest={c} onPress={() => navigation.navigate('ContestDetail' as any, { contest: c })} />
          ))}
          {contests.length === 0 && (
            <View style={{ backgroundColor: D.card, borderRadius: 14, padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏏</Text>
              <Text style={{ color: D.textSec, fontSize: 14 }}>Contests load when matches go live</Text>
            </View>
          )}
        </View>

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <View style={{ marginTop: 22, paddingHorizontal: 16 }}>
            <Text style={{ color: D.text, fontWeight: '800', fontSize: 18, marginBottom: 14 }}>
              Upcoming
            </Text>
            {upcomingMatches.map(m => (
              <UpcomingMatchCard key={m.id} match={m} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function LiveMatchCard({ match, onPress, liveDot }: { match: LiveMatch; onPress: () => void; liveDot: Animated.Value }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: 280, backgroundColor: D.card, borderRadius: 18,
        padding: 16, borderWidth: 1, borderColor: D.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: D.live, opacity: liveDot }} />
          <Text style={{ color: D.live, fontSize: 11, fontWeight: '700' }}>LIVE</Text>
        </View>
        <Text style={{ color: D.textSec, fontSize: 11 }}>{match.matchType}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TeamScore team={match.team1} />
        <Text style={{ color: D.textSec, fontSize: 13, fontWeight: '700' }}>VS</Text>
        <TeamScore team={match.team2} right />
      </View>

      {match.requiredRR != null && (
        <View style={{ marginTop: 12, backgroundColor: D.cardAlt, borderRadius: 8, padding: 8 }}>
          <Text style={{ color: D.textSec, fontSize: 11, textAlign: 'center' }}>
            Required: <Text style={{ color: D.primary, fontWeight: '700' }}>{match.requiredRR.toFixed(1)} RPO</Text>
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function TeamScore({ team, right }: { team: { shortName: string; score: string; overs: string }; right?: boolean }) {
  return (
    <View style={{ alignItems: right ? 'flex-end' : 'flex-start', flex: 1 }}>
      <Text style={{ color: D.textSec, fontSize: 11, fontWeight: '600', marginBottom: 2 }}>{team.shortName}</Text>
      <Text style={{ color: D.text, fontSize: 22, fontWeight: '900' }}>{team.score}</Text>
      <Text style={{ color: D.textSec, fontSize: 11, marginTop: 1 }}>{team.overs} ov</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <View style={{
        width: 54, height: 54, borderRadius: 16,
        backgroundColor: color + '20', borderWidth: 1, borderColor: color + '40',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 22 }}>{icon}</Text>
      </View>
      <Text style={{ color: D.textSec, fontSize: 11, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );
}

function ContestCard({ contest, onPress }: { contest: Contest; onPress: () => void }) {
  const fillPct = Math.min((contest.participants / contest.maxParticipants) * 100, 100);
  const spotsLeft = contest.maxParticipants - contest.participants;
  const typeColors: Record<string, string> = {
    match_winner: '#7C3AED', over_runs: '#0369A1',
    last_over_total: '#D97706', player_milestone: '#059669',
    next_wicket_over: '#DC2626',
  };
  const accentColor = typeColors[contest.type] ?? D.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: D.card, borderRadius: 16, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: D.border,
      }}
      activeOpacity={0.85}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <View style={{ backgroundColor: accentColor + '25', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: accentColor, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                {contest.type.replace(/_/g, ' ').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={{ color: D.text, fontWeight: '700', fontSize: 15 }}>{contest.title}</Text>
          <Text style={{ color: D.textSec, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{contest.description}</Text>
        </View>
        <TouchableOpacity
          onPress={onPress}
          style={{
            borderRadius: 10, overflow: 'hidden', minWidth: 70, alignItems: 'center',
          }}
        >
          <LinearGradient
            colors={[D.primary, '#00897B']}
            style={{ paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>JOIN</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1 }}>
              🪙 {contest.entryFee}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: D.gold, fontWeight: '800', fontSize: 14 }}>
          🏆 {contest.prizePool.toLocaleString()} tokens
        </Text>
        <Text style={{ color: D.textSec, fontSize: 12 }}>
          {spotsLeft.toLocaleString()} spots left
        </Text>
      </View>

      {/* Fill bar */}
      <View style={{ height: 4, backgroundColor: '#253047', borderRadius: 99 }}>
        <View style={{
          height: '100%', width: `${fillPct}%`,
          backgroundColor: fillPct > 80 ? D.live : D.primary,
          borderRadius: 99,
        }} />
      </View>
    </TouchableOpacity>
  );
}

function UpcomingMatchCard({ match }: { match: LiveMatch }) {
  return (
    <View style={{
      backgroundColor: D.card, borderRadius: 14, padding: 16,
      marginBottom: 10, borderWidth: 1, borderColor: D.border,
      flexDirection: 'row', alignItems: 'center',
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: D.text, fontWeight: '700', fontSize: 14 }}>
          {match.team1.shortName} vs {match.team2.shortName}
        </Text>
        <Text style={{ color: D.textSec, fontSize: 12, marginTop: 2 }}>{match.name}</Text>
      </View>
      <View style={{
        backgroundColor: D.cardAlt, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
      }}>
        <Text style={{ color: D.textSec, fontSize: 11, fontWeight: '600' }}>UPCOMING</Text>
      </View>
    </View>
  );
}

// ─── Mock data (shown when backend not connected) ─────────────────────────────
const MOCK_MATCHES: LiveMatch[] = [
  {
    id: 'mock_1', name: 'CSK vs MI, Match 32', matchType: 'T20', status: 'live',
    team1: { shortName: 'MI',  score: '189/4', overs: '20.0' },
    team2: { shortName: 'CSK', score: '142/3', overs: '15.2' },
    currentBatsmen: ['MS Dhoni', 'R Jadeja'], currentBowler: 'J Bumrah',
    requiredRR: 12.4,
  },
  {
    id: 'mock_2', name: 'RCB vs KKR, Match 33', matchType: 'T20', status: 'live',
    team1: { shortName: 'KKR', score: '176/6', overs: '20.0' },
    team2: { shortName: 'RCB', score: '98/2',  overs: '12.0' },
    currentBatsmen: ['V Kohli', 'G Maxwell'], currentBowler: 'S Narine',
    requiredRR: 9.8,
  },
  {
    id: 'mock_3', name: 'SRH vs DC, Match 34', matchType: 'T20', status: 'upcoming',
    team1: { shortName: 'SRH', score: '--', overs: '0.0' },
    team2: { shortName: 'DC',  score: '--', overs: '0.0' },
    currentBatsmen: [], currentBowler: '',
  },
];

const MOCK_CONTESTS: Contest[] = [
  {
    id: 'c1', matchId: 'mock_1', matchName: 'CSK vs MI', type: 'last_over_total',
    title: '🔥 Last Over — CSK Chase?', description: 'Will CSK win from here? Needs 12.4 RPO.',
    entryFee: 100, prizePool: 3000, maxParticipants: 20000, participants: 14200,
    endsAt: Date.now() + 12 * 60000, status: 'open',
    options: [{ id: 'yes', label: 'CSK Wins', icon: '🏆' }, { id: 'no', label: 'MI Wins', icon: '🛡️' }],
  },
  {
    id: 'c2', matchId: 'mock_1', matchName: 'CSK vs MI', type: 'player_milestone',
    title: '🎯 Dhoni hits 50?', description: 'Will MS Dhoni reach a half-century today?',
    entryFee: 40, prizePool: 800, maxParticipants: 8000, participants: 3200,
    endsAt: Date.now() + 2 * 3600000, status: 'open',
    options: [{ id: 'yes', label: 'Yes, 50+', icon: '✅' }, { id: 'no', label: 'No', icon: '❌' }],
  },
  {
    id: 'c3', matchId: 'mock_2', matchName: 'RCB vs KKR', type: 'match_winner',
    title: '🏆 Who wins RCB vs KKR?', description: 'Predict the match winner. Pays at match end.',
    entryFee: 50, prizePool: 1000, maxParticipants: 10000, participants: 6800,
    endsAt: Date.now() + 3 * 3600000, status: 'open',
    options: [{ id: 'rcb', label: 'RCB', icon: '🏏' }, { id: 'kkr', label: 'KKR', icon: '🎯' }],
  },
  {
    id: 'c4', matchId: 'mock_2', matchName: 'RCB vs KKR', type: 'over_runs',
    title: '💨 Over 13 Runs — 0–5 or 15+?', description: 'How many runs will RCB score in Over 13?',
    entryFee: 30, prizePool: 500, maxParticipants: 5000, participants: 1100,
    endsAt: Date.now() + 8 * 60000, status: 'open',
    options: [
      { id: '0_5', label: '0–5',   icon: '⚫' },
      { id: '6_9', label: '6–9',   icon: '🏃' },
      { id: '10_14', label: '10–14', icon: '🏏' },
      { id: '15p', label: '15+',   icon: '🔥' },
    ],
  },
];
