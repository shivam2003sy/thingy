import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, SafeAreaView,
  Animated, RefreshControl, StatusBar, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useCricketStore } from '../store/cricketStore';
import { socketService } from '../socket/socketService';
import { T } from '../config/theme';
import type { CricMatchSummary } from '../services/cricketService';

interface BallRushMatch {
  matchId: string;
  matchName: string;
  team1: { shortName: string; score: string };
  team2: { shortName: string; score: string };
  windowOpen: boolean;
  windowClosesAt: number;
  upcoming?: boolean;
  startsAt?: number | null;
}

interface Contest {
  id: string; matchName: string; title: string; entryFee: number;
  prizePool: number; maxParticipants: number; participants: number;
  endsAt: number; status: string;
  options: Array<{ id: string; label: string; icon: string }>;
  type: string; description: string; matchId: string;
}

type Tab = 'live' | 'fixtures';
type Props = { navigation: NativeStackNavigationProp<any> };

function useCountdown(startsAt: number | null | undefined): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!startsAt) return;
    const tick = () => {
      const diff = startsAt - Date.now();
      if (diff <= 0) { setLabel('Starting!'); return; }
      const h   = Math.floor(diff / 3_600_000);
      const min = Math.floor((diff % 3_600_000) / 60_000);
      const sec = Math.floor((diff % 60_000) / 1_000);
      setLabel(h > 0 ? `${h}h ${min}m` : `${min}:${sec.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [startsAt]);
  return label;
}

function BallRushCard({ m, liveDot, onPress }: { m: BallRushMatch; liveDot: Animated.Value; onPress: () => void }) {
  const countdown = useCountdown(m.upcoming ? m.startsAt : null);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={m.upcoming ? ['#1C1C3A', '#252550'] : ['#1E1B4B', '#312E81']}
        style={{ width: 210, borderRadius: 18, padding: 16 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {m.upcoming ? (
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>UPCOMING MATCH</Text>
          ) : (
            <>
              <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.live, marginRight: 6, opacity: liveDot }} />
              <Text style={{ color: T.live, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>PREDICT EVERY BALL</Text>
            </>
          )}
        </View>
        <Text style={{ color: m.upcoming ? 'rgba(255,255,255,0.5)' : '#FFF', fontWeight: '800', fontSize: 15, marginBottom: 10 }} numberOfLines={2}>
          {m.matchName}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, opacity: m.upcoming ? 0.4 : 1 }}>
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
          backgroundColor: m.upcoming ? 'rgba(255,255,255,0.08)' : m.windowOpen ? T.live : 'rgba(255,255,255,0.15)',
          borderRadius: 10, paddingVertical: 8, alignItems: 'center',
        }}>
          <Text style={{ color: m.upcoming ? 'rgba(255,255,255,0.5)' : '#FFF', fontWeight: '800', fontSize: 12 }}>
            {m.upcoming ? `🔒 Starts in ${countdown}` : m.windowOpen ? '🔥 PREDICT NOW!' : '⏳ Next ball soon...'}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function MatchCard({ m, liveDot }: { m: CricMatchSummary; liveDot: Animated.Value }) {
  const isLive = m.ms === 'live';
  const team1 = m.teamInfo?.[0];
  const team2 = m.teamInfo?.[1];
  const name1 = team1?.shortname ?? m.t1?.replace(/\s*\[.*?\]/, '') ?? m.teams?.[0] ?? '−';
  const name2 = team2?.shortname ?? m.t2?.replace(/\s*\[.*?\]/, '') ?? m.teams?.[1] ?? '−';
  const score1 = m.t1s || (m.score?.[0] ? `${m.score[0].r}/${m.score[0].w}` : '−');
  const score2 = m.t2s || (m.score?.[1] ? `${m.score[1].r}/${m.score[1].w}` : '−');

  return (
    <View style={{ width: 190, backgroundColor: '#FFF', borderRadius: 16, padding: 16, ...T.shadow }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        {isLive ? (
          <>
            <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.live, marginRight: 6, opacity: liveDot }} />
            <Text style={{ color: T.live, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>LIVE</Text>
          </>
        ) : (
          <Text style={{ color: T.textSec, fontSize: 10, fontWeight: '600' }}>
            {m.dateTimeGMT ? new Date(m.dateTimeGMT).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'UPCOMING'}
          </Text>
        )}
      </View>
      <Text style={{ color: T.text, fontWeight: '700', fontSize: 12, marginBottom: 8 }} numberOfLines={2}>{m.name}</Text>
      {[{ name: name1, score: score1 }, { name: name2, score: score2 }].map((t, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
          <Text style={{ color: i === 0 ? T.text : T.textSec, fontWeight: i === 0 ? '700' : '500', fontSize: 12 }}>{t.name}</Text>
          <Text style={{ color: i === 0 ? T.text : T.textSec, fontSize: 12 }}>{t.score}</Text>
        </View>
      ))}
      {isLive && m.status ? (
        <Text style={{ color: T.textMuted, fontSize: 10, marginTop: 6 }} numberOfLines={1}>{m.status}</Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { liveMatches, fixtures, loadingMatches, loadingFixtures, loadLiveMatches, loadFixtures } = useCricketStore();
  const [contests,        setContests]        = useState<Contest[]>([]);
  const [ballRushMatches, setBallRushMatches] = useState<BallRushMatch[]>([]);
  const [activeTab,       setActiveTab]       = useState<Tab>('live');
  const [refreshing,      setRefreshing]      = useState(false);
  const liveDot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDot, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(liveDot, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    ).start();

    // Load real data from CricAPI (via backend)
    loadLiveMatches();
    loadFixtures();

    socketService.on('contests',        (d: Contest[])       => setContests(d));
    socketService.on('contestsUpdated', (d: Contest[])       => setContests(d));
    socketService.on('ballRushMatchList',(d: BallRushMatch[]) => setBallRushMatches(d));
    socketService.getBallRushMatches();

    return () => {
      socketService.off('contests');
      socketService.off('contestsUpdated');
      socketService.off('ballRushMatchList');
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLiveMatches(), loadFixtures()]);
    setRefreshing(false);
  };

  const displayedMatches = activeTab === 'live' ? liveMatches : fixtures;
  const isLoading = activeTab === 'live' ? loadingMatches : loadingFixtures;

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.primary} />}
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
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Battle')}
                style={{
                  backgroundColor: '#FFF', borderRadius: 12,
                  paddingVertical: 11, paddingHorizontal: 20,
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                }}
              >
                <Text style={{ color: T.primary, fontWeight: '800', fontSize: 14 }}>Find Opponent</Text>
                <Text style={{ fontSize: 14 }}>⚡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('PlayerSearch')}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
                  paddingVertical: 11, paddingHorizontal: 16,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Players</Text>
                <Text style={{ fontSize: 14 }}>🔍</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Ball Rush */}
        {ballRushMatches.length > 0 && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
              <Text style={{ fontSize: 18, marginRight: 6 }}>⚡</Text>
              <Text style={{ color: T.text, fontWeight: '800', fontSize: 16 }}>Ball Rush</Text>
              {ballRushMatches.some(m => !m.upcoming) && (
                <View style={{ marginLeft: 8, backgroundColor: T.live, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>LIVE</Text>
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4 }}>
              {ballRushMatches.map(m => (
                <BallRushCard key={m.matchId} m={m} liveDot={liveDot} onPress={() =>
                  navigation.navigate('BallRush', {
                    matchId: m.matchId, matchName: m.matchName,
                    upcoming: m.upcoming ?? false, startsAt: m.startsAt ?? null,
                  })
                } />
              ))}
            </ScrollView>
          </>
        )}

        {/* Matches section with Live / Fixtures tabs */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['live', 'fixtures'] as Tab[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: activeTab === tab ? T.primary : T.border,
                }}
              >
                <Text style={{ color: activeTab === tab ? '#FFF' : T.textSec, fontWeight: '700', fontSize: 13 }}>
                  {tab === 'live' ? '🔴 Live' : '📅 Fixtures'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Series')}>
            <Text style={{ color: T.primary, fontWeight: '700', fontSize: 13 }}>Series →</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={T.primary} style={{ marginVertical: 24 }} />
        ) : displayedMatches.length === 0 ? (
          <Text style={{ color: T.textSec, textAlign: 'center', marginVertical: 24, fontSize: 13 }}>
            {activeTab === 'live' ? 'No live matches right now' : 'No upcoming fixtures'}
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 4, paddingTop: 8 }}>
            {displayedMatches.map(m => (
              <MatchCard key={m.id} m={m} liveDot={liveDot} />
            ))}
          </ScrollView>
        )}

        {/* Contests */}
        {contests.length > 0 && (
          <>
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
