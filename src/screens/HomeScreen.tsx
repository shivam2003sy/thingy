import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import {
  View, Text, TouchableOpacity,
  Animated, StatusBar, SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { T } from '../config/theme';
import {
  formatMatchDate, formatMatchTime,
} from '../data/ipl2026Schedule';
import { supabase } from '../config/supabase';

type Props = { navigation: NativeStackNavigationProp<any> };

interface Match {
  id: string;
  match_name: string;
  match_date: string;
  venue: string;
  team1_name: string;
  team1_short: string;
  team2_name: string;
  team2_short: string;
  team1_score: number;
  team1_wickets: number;
  team1_overs: number;
  team2_score: number;
  team2_wickets: number;
  team2_overs: number;
  is_live: boolean;
  is_completed: boolean;
  current_over: number;
}

type CardStatus = 'live' | 'upcoming' | 'past';

function formatOvers(overs: number | string | null): string {
  if (overs == null) return '0.0';
  const n = typeof overs === 'string' ? parseFloat(overs) : overs;
  if (isNaN(n)) return '0.0';
  return n.toFixed(1);
}

function formatCountdown(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  if (diff <= 0) return '';
  const h   = Math.floor(diff / 3_600_000);
  const min = Math.floor((diff % 3_600_000) / 60_000);
  const sec = Math.floor((diff % 60_000) / 1_000);
  return h > 0 ? `${h}h ${min}m` : `${min}:${sec.toString().padStart(2, '0')}`;
}

function buildSections(
  now: number,
  matches: Match[],
) {
  const live: Match[] = [];
  const byDate = new Map<string, Match[]>();

  for (const match of matches) {
    // Live matches
    if (match.is_live) {
      live.push(match);
      continue;
    }

    // Skip completed matches
    if (match.is_completed) continue;

    // Skip past matches (more than 4 hours after match date)
    const matchDate = new Date(match.match_date);
    const startMs = matchDate.getTime();
    const isPast = now > startMs + 4 * 3_600_000;
    if (isPast) continue;

    // Group upcoming matches by date
    const dateLabel = formatMatchDate(match.match_date);
    if (!byDate.has(dateLabel)) byDate.set(dateLabel, []);
    byDate.get(dateLabel)!.push(match);
  }

  const sections: Array<{ title: string; data: Match[] }> = [];

  if (live.length > 0) {
    sections.push({
      title: '🔴 LIVE NOW',
      data: live,
    });
  }

  // Sort dates chronologically
  const sortedDates = Array.from(byDate.entries()).sort((a, b) => {
    const dateA = new Date(a[1][0].match_date).getTime();
    const dateB = new Date(b[1][0].match_date).getTime();
    return dateA - dateB;
  });

  for (const [title, data] of sortedDates) {
    sections.push({ title, data });
  }

  return sections;
}

// ─── Match card ───────────────────────────────────────────────────────────────

const MatchCard = memo(function MatchCard({
  match, now, liveDot, onPress,
}: {
  match:   Match;
  now:     number;
  liveDot: Animated.Value;
  onPress: () => void;
}) {
  const isLive   = match.is_live;
  const startMs  = new Date(match.match_date).getTime();
  const countdown = !isLive ? formatCountdown(startMs, now) : '';

  return (
    <TouchableOpacity
      onPress={isLive ? onPress : undefined}
      activeOpacity={isLive ? 0.75 : 1}
      style={{ marginBottom: 10 }}
    >
      <View style={{
        backgroundColor: isLive ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isLive ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.07)',
        padding: 16,
      }}>
        {/* Top row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isLive ? (
              <>
                <Animated.View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: T.live, opacity: liveDot }} />
                <Text style={{ color: T.live, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }}>LIVE</Text>
                {match.current_over > 0 && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>· Over {match.current_over}</Text>}
              </>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600' }}>{match.match_name}</Text>
            )}
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            {formatMatchTime(match.match_date)}
          </Text>
        </View>

        {/* Teams + score */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Team 1 */}
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 22, letterSpacing: -0.5 }}>
              {match.team1_short}
            </Text>
            {isLive ? (
              <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                {match.team1_score}/{match.team1_wickets}
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: 11 }}>
                  {' '}({formatOvers(match.team1_overs)})
                </Text>
              </Text>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {match.team1_name}
              </Text>
            )}
          </View>

          {/* Middle */}
          <View style={{ alignItems: 'center', paddingHorizontal: 12 }}>
            {isLive ? (
              <LinearGradient
                colors={['#4ADE80', '#22C55E']}
                style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}
              >
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 11 }}>PREDICT</Text>
              </LinearGradient>
            ) : (
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: '700' }}>vs</Text>
                <Text style={{ fontSize: 13 }}>🔒</Text>
              </View>
            )}
          </View>

          {/* Team 2 */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 22, letterSpacing: -0.5 }}>
              {match.team2_short}
            </Text>
            {isLive ? (
              <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                {match.team2_score}/{match.team2_wickets}
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: 11 }}>
                  {' '}({formatOvers(match.team2_overs)})
                </Text>
              </Text>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {match.team2_name}
              </Text>
            )}
          </View>
        </View>

        {/* Bottom row */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 12, paddingTop: 10,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11 }}>📍 {match.venue}</Text>
          {countdown ? (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8,
              paddingHorizontal: 10, paddingVertical: 4,
              flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              <Text style={{ fontSize: 10 }}>⏱</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontWeight: '700', fontSize: 12 }}>{countdown}</Text>
            </View>
          ) : isLive ? (
            <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 12 }}>Tap to predict →</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [now, setNow] = useState(() => Date.now());
  const [matches, setMatches] = useState<Match[]>([]);
  const liveDot = useRef(new Animated.Value(1)).current;

  // Fetch all matches from database
  const fetchMatches = useCallback(async () => {
    const { data } = await supabase
      .from('ipl_matches')
      .select('*')
      .order('match_date', { ascending: true });
    
    if (data) setMatches(data as Match[]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Realtime subscription — updates scores and live status instantly
  useEffect(() => {
    const channel = supabase
      .channel('home-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ipl_matches' }, () => {
        fetchMatches();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMatches]);

  // Countdown tick every 5s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  // Live dot pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(liveDot, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(liveDot, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const sections = useMemo(() => buildSections(now, matches), [now, matches]);
  const liveCount = useMemo(() => matches.filter(m => m.is_live).length, [matches]);

  const handleMatchPress = useCallback((match: Match) => {
    navigation.navigate('OverPrediction', {
      matchId: match.id,
      matchName: `${match.team1_short} vs ${match.team2_short} · IPL 2026`,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#080D18' }}>
      <StatusBar barStyle="light-content" backgroundColor="#080D18" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Welcome back 👋</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>{user?.username ?? 'Player'}</Text>
            {liveCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Animated.View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: T.live, opacity: liveDot }} />
                <Text style={{ color: T.live, fontSize: 10, fontWeight: '800' }}>{liveCount} LIVE</Text>
              </View>
            )}
          </View>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 99,
          paddingHorizontal: 14, paddingVertical: 8,
        }}>
          <Text style={{ fontSize: 15 }}>🪙</Text>
          <Text style={{ color: T.gold, fontWeight: '800', fontSize: 15 }}>
            {user?.tokens?.toLocaleString() ?? '0'}
          </Text>
        </View>
      </View>

      {/* Subtitle */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6,
      }}>
        <View>
          <Text style={{ color: '#FFF', fontWeight: '900', fontSize: 17 }}>IPL 2026 Schedule</Text>
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
            70 matches · tap live to predict
          </Text>
        </View>
        <View style={{
          backgroundColor: 'rgba(74,222,128,0.1)', borderRadius: 10,
          paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)',
        }}>
          <Text style={{ color: '#4ADE80', fontWeight: '800', fontSize: 11 }}>BALL RUSH</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 20, paddingBottom: 10 }}>
        {[
          { color: '#4ADE80',               label: 'Live — tap to predict' },
          { color: 'rgba(255,255,255,0.25)', label: 'Upcoming — locked' },
        ].map(item => (
          <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.color }} />
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        stickySectionHeadersEnabled={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ paddingTop: title === sections[0]?.title ? 2 : 16, paddingBottom: 8 }}>
            <Text style={{
              color: title === '🔴 LIVE NOW' ? T.live : 'rgba(255,255,255,0.35)',
              fontSize: 11, fontWeight: '800', letterSpacing: 1,
            }}>
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            now={now}
            liveDot={liveDot}
            onPress={() => handleMatchPress(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}
