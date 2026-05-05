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
  IPL2026, IplMatch,
  formatMatchDate, formatMatchTime,
} from '../data/ipl2026Schedule';
import { supabase } from '../config/supabase';

type Props = { navigation: NativeStackNavigationProp<any> };

interface DbMatch {
  id: string;
  team1_short: string;
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

function matchKey(a: string, b: string) {
  return [a.toUpperCase(), b.toUpperCase()].sort().join('|');
}

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
  dbMap: Map<string, DbMatch>,
) {
  const live: Array<{ match: IplMatch; db: DbMatch }> = [];
  const byDate = new Map<string, IplMatch[]>();
  const usedKeys = new Set<string>(); // prevent same DB match appearing twice

  for (const m of IPL2026) {
    const key = matchKey(m.homeShort, m.awayShort);
    const db  = dbMap.get(key);

    if (db?.is_live && !usedKeys.has(key)) {
      usedKeys.add(key);
      live.push({ match: m, db });
      continue;
    }
    if (db?.is_live && usedKeys.has(key)) continue; // skip duplicate

    // Past if completed in DB, or date has passed without a DB entry
    const startMs  = new Date(m.dateTimeIST).getTime();
    const isPast   = db?.is_completed || now > startMs + 4 * 3_600_000;
    if (isPast) continue; // hide finished matches

    const dateLabel = formatMatchDate(m.dateTimeIST);
    if (!byDate.has(dateLabel)) byDate.set(dateLabel, []);
    byDate.get(dateLabel)!.push(m);
  }

  const sections: Array<{ title: string; data: IplMatch[]; dbMap?: Map<string, DbMatch> }> = [];

  if (live.length > 0) {
    sections.push({
      title: '🔴 LIVE NOW',
      data:  live.map(l => l.match),
      dbMap,
    });
  }

  for (const [title, data] of byDate) {
    sections.push({ title, data });
  }

  return sections;
}

// ─── Match card ───────────────────────────────────────────────────────────────

const MatchCard = memo(function MatchCard({
  match, db, now, liveDot, onPress,
}: {
  match:   IplMatch;
  db?:     DbMatch;
  now:     number;
  liveDot: Animated.Value;
  onPress: () => void;
}) {
  const isLive   = !!db?.is_live;
  const startMs  = new Date(match.dateTimeIST).getTime();
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
                {db && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>· Over {db.current_over}</Text>}
              </>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '600' }}>Match {match.matchNo}</Text>
            )}
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            {formatMatchTime(match.dateTimeIST)}
          </Text>
        </View>

        {/* Teams + score */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Team 1 */}
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 22, letterSpacing: -0.5 }}>
              {match.homeShort}
            </Text>
            {isLive && db ? (
              <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                {db.team1_score}/{db.team1_wickets}
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: 11 }}>
                  {' '}({formatOvers(db.team1_overs)})
                </Text>
              </Text>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {match.home}
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
              {match.awayShort}
            </Text>
            {isLive && db ? (
              <Text style={{ color: '#4ADE80', fontWeight: '700', fontSize: 14, marginTop: 2 }}>
                {db.team2_score}/{db.team2_wickets}
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '500', fontSize: 11 }}>
                  {' '}({formatOvers(db.team2_overs)})
                </Text>
              </Text>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {match.away}
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
  const [now, setNow]     = useState(() => Date.now());
  const [dbMap, setDbMap] = useState<Map<string, DbMatch>>(new Map());
  const liveDot = useRef(new Animated.Value(1)).current;

  // Build lookup map from Supabase rows
  const updateDbMap = useCallback((rows: DbMatch[]) => {
    const map = new Map<string, DbMatch>();
    for (const r of rows) {
      map.set(matchKey(r.team1_short, r.team2_short), r);
    }
    setDbMap(map);
  }, []);

  // Initial fetch
  useEffect(() => {
    supabase
      .from('ipl_matches')
      .select('id,team1_short,team2_short,team1_score,team1_wickets,team1_overs,team2_score,team2_wickets,team2_overs,is_live,is_completed,current_over')
      .then(({ data }) => { if (data) updateDbMap(data as DbMatch[]); });
  }, []);

  // Realtime subscription — updates scores and live status instantly
  useEffect(() => {
    const channel = supabase
      .channel('home-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ipl_matches' }, () => {
        supabase
          .from('ipl_matches')
          .select('id,team1_short,team2_short,team1_score,team1_wickets,team1_overs,team2_score,team2_wickets,team2_overs,is_live,is_completed,current_over')
          .then(({ data }) => { if (data) updateDbMap(data as DbMatch[]); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [updateDbMap]);

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

  const sections = useMemo(() => buildSections(now, dbMap), [now, dbMap]);
  const liveCount = useMemo(() => Array.from(dbMap.values()).filter(m => m.is_live).length, [dbMap]);

  const handleMatchPress = useCallback((item: IplMatch, db?: DbMatch) => {
    navigation.navigate('OverPrediction', {
      matchId:   db?.id ?? item.id,
      matchName: `${item.homeShort} vs ${item.awayShort} · IPL 2026`,
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
        renderItem={({ item }) => {
          const key = matchKey(item.homeShort, item.awayShort);
          const db  = dbMap.get(key);
          return (
            <MatchCard
              match={item}
              db={db}
              now={now}
              liveDot={liveDot}
              onPress={() => handleMatchPress(item, db)}
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
