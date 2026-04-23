import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  Animated, RefreshControl, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../socket/socketService';
import { T } from '../config/theme';

interface BallRushMatch {
  matchId: string;
  matchName: string;
  team1: { shortName: string; score: string };
  team2: { shortName: string; score: string };
  windowOpen: boolean;
  windowClosesAt: number;
}

type Props = { navigation: NativeStackNavigationProp<any> };

interface LiveMatch {
  id: string; name: string; status: string;
  team1: { shortName: string; score: string; overs: string };
  team2: { shortName: string; score: string; overs: string };
  requiredRR?: number;
}

interface Contest {
  id: string; matchName: string; title: string; entryFee: number;
  prizePool: number; maxParticipants: number; participants: number;
  endsAt: number; status: string;
  options: Array<{ id: string; label: string; icon: string }>;
  type: string; description: string; matchId: string;
}

const MOCK_MATCHES: LiveMatch[] = [
  { id: '1', name: 'CSK vs MI', status: 'LIVE',
    team1: { shortName: 'CSK', score: '142/3', overs: '16.2' },
    team2: { shortName: 'MI',  score: '−',     overs: '0.0'  }, requiredRR: 9.4 },
  { id: '2', name: 'RCB vs KKR', status: 'LIVE',
    team1: { shortName: 'RCB', score: '87/2',  overs: '10.0' },
    team2: { shortName: 'KKR', score: '−',     overs: '0.0'  } },
];

const MOCK_CONTESTS: Contest[] = [
  { id: 'c1', matchId: '1', matchName: 'CSK vs MI', type: 'match_winner',
    title: 'Who wins today?', description: 'Predict the match winner',
    entryFee: 50, prizePool: 5000, maxParticipants: 200, participants: 142,
    endsAt: Date.now() + 1800000, status: 'open',
    options: [{ id: 'csk', label: 'CSK Wins', icon: '🦁' }, { id: 'mi', label: 'MI Wins', icon: '🔵' }] },
  { id: 'c2', matchId: '1', matchName: 'CSK vs MI', type: 'over_runs',
    title: 'Next over: 8+ runs?', description: 'Predict runs in the next over',
    entryFee: 25, prizePool: 1200, maxParticipants: 100, participants: 61,
    endsAt: Date.now() + 600000, status: 'open',
    options: [{ id: 'yes', label: 'Yes, 8+ runs', icon: '🔥' }, { id: 'no', label: 'Under 8', icon: '🛡️' }] },
];

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [matches,    setMatches]    = useState<LiveMatch[]>(MOCK_MATCHES);
  const [contests,   setContests]   = useState<Contest[]>(MOCK_CONTESTS);
  const [ballRushMatches, setBallRushMatches] = useState<BallRushMatch[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const liveDot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDot, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(liveDot, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();
    socketService.on('liveMatches',      (d: LiveMatch[])      => setMatches(d));
    socketService.on('contests',         (d: Contest[])        => setContests(d));
    socketService.on('matchesUpdated',   (d: LiveMatch[])      => setMatches(d));
    socketService.on('contestsUpdated',  (d: Contest[])        => setContests(d));
    socketService.on('ballRushMatchList',(d: BallRushMatch[])  => setBallRushMatches(d));

    // Request Ball Rush matches on mount
    socketService.getBallRushMatches();

    return () => {
      socketService.off('liveMatches'); socketService.off('contests');
      socketService.off('matchesUpdated'); socketService.off('contestsUpdated');
      socketService.off('ballRushMatchList');
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: T.border,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: T.textSec, fontSize: 12 }}>Welcome back 👋</Text>
          <Text style={{ color: T.text, fontSize: 17, fontWeight: '800' }}>{user?.username ?? 'Player'}</Text>
        </View>
        <TouchableOpacity
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            backgroundColor: T.goldLight, borderRadius: 99,
            paddingHorizontal: 14, paddingVertical: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>🪙</Text>
          <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 14 }}>
            {user?.tokens?.toLocaleString() ?? '0'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1000); }} tintColor={T.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Play banner */}
        <View style={{ margin: 16 }}>
          <LinearGradient
            colors={[T.primary, T.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 22 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
              READY TO PLAY?
            </Text>
            <Text style={{ color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 16 }}>
              Start a 1v1 Battle
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Battle')}
              style={{
                backgroundColor: '#FFF', borderRadius: 12,
                paddingVertical: 11, paddingHorizontal: 20,
                alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
              }}
            >
              <Text style={{ color: T.primary, fontWeight: '800', fontSize: 14 }}>Find Opponent</Text>
              <Text style={{ fontSize: 14 }}>⚡</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Ball Rush Live */}
        {ballRushMatches.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>⚡</Text>
              <Text style={{ color: T.text, fontWeight: '800', fontSize: 16 }}>Ball Rush</Text>
              <View style={{ marginLeft: 8, backgroundColor: T.live, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>LIVE</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}>
              {ballRushMatches.map(m => (
                <TouchableOpacity
                  key={m.matchId}
                  onPress={() => navigation.navigate('BallRush', { matchId: m.matchId, matchName: m.matchName })}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#1E1B4B', '#312E81']}
                    style={{ width: 210, borderRadius: 18, padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.live, marginRight: 6, opacity: liveDot }} />
                      <Text style={{ color: T.live, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>PREDICT EVERY BALL</Text>
                    </View>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 15, marginBottom: 10 }}>{m.matchName}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{m.team1.shortName}</Text>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>{m.team1.score}</Text>
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, alignSelf: 'center' }}>vs</Text>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{m.team2.shortName}</Text>
                        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>{m.team2.score}</Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: m.windowOpen ? T.live : 'rgba(255,255,255,0.15)',
                      borderRadius: 10, paddingVertical: 8, alignItems: 'center',
                    }}>
                      <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 12 }}>
                        {m.windowOpen ? '🔥 PREDICT NOW!' : '⏳ Next ball soon...'}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Live Matches */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: T.live, marginRight: 8, opacity: liveDot }} />
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 16 }}>Live Matches</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}>
          {matches.map(m => (
            <View key={m.id} style={{ width: 190, backgroundColor: '#FFF', borderRadius: 16, padding: 16, ...T.shadow }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.live, marginRight: 6, opacity: liveDot }} />
                <Text style={{ color: T.live, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>LIVE</Text>
              </View>
              <Text style={{ color: T.text, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>{m.name}</Text>
              {[m.team1, m.team2].map((t, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ color: i === 0 ? T.text : T.textSec, fontWeight: i === 0 ? '700' : '500', fontSize: 12 }}>{t.shortName}</Text>
                  <Text style={{ color: i === 0 ? T.text : T.textSec, fontSize: 12 }}>{t.score}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Contests */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
          <Text style={{ color: T.text, fontWeight: '800', fontSize: 16 }}>Open Contests</Text>
          <Text style={{ color: T.textSec, fontSize: 12, marginTop: 2 }}>Win big with your predictions</Text>
        </View>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {contests.map(c => {
            const fill = Math.min((c.participants / c.maxParticipants) * 100, 100);
            const mins = Math.max(0, Math.floor((c.endsAt - Date.now()) / 60000));
            return (
              <TouchableOpacity
                key={c.id}
                onPress={() => navigation.navigate('ContestDetail', { contest: c })}
                style={{ backgroundColor: '#FFF', borderRadius: 18, padding: 18, ...T.shadow }}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.textSec, fontSize: 11, fontWeight: '600', marginBottom: 3 }}>{c.matchName}</Text>
                    <Text style={{ color: T.text, fontWeight: '800', fontSize: 15 }}>{c.title}</Text>
                  </View>
                  <View style={{ backgroundColor: T.goldLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 13 }}>🏆 {c.prizePool.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={{ height: 5, backgroundColor: T.border, borderRadius: 99, marginBottom: 10 }}>
                  <View style={{ height: '100%', width: `${fill}%`, backgroundColor: fill > 80 ? T.live : T.primary, borderRadius: 99 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: T.textSec, fontSize: 12 }}>{c.maxParticipants - c.participants} spots · ⏱ {mins}m</Text>
                  <View style={{ backgroundColor: T.primaryLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 }}>
                    <Text style={{ color: T.primaryDark, fontWeight: '700', fontSize: 12 }}>🪙 {c.entryFee} · Join</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
