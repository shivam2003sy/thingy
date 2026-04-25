import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useCricketStore } from '../store/cricketStore';
import { T } from '../config/theme';
import type { CricSeriesMatch } from '../services/cricketService';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ SeriesDetail: { seriesId: string; seriesName: string } }, 'SeriesDetail'>;
};

function statusColor(m: CricSeriesMatch): string {
  if (m.matchEnded) return T.textSec;
  if (m.matchStarted) return T.live;
  return T.primary;
}

function statusLabel(m: CricSeriesMatch): string {
  if (m.matchEnded) return 'Completed';
  if (m.matchStarted) return 'LIVE';
  return 'Upcoming';
}

function MatchRow({ item }: { item: CricSeriesMatch }) {
  const date = item.dateTimeGMT
    ? new Date(item.dateTimeGMT).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : item.date;

  return (
    <View style={{
      backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 10,
      borderRadius: 16, padding: 16, ...T.shadow,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: statusColor(item), fontSize: 11, fontWeight: '700' }}>{statusLabel(item)}</Text>
        <Text style={{ color: T.textMuted, fontSize: 11 }}>{date}</Text>
      </View>
      <Text style={{ color: T.text, fontWeight: '700', fontSize: 13, marginBottom: 4 }} numberOfLines={2}>
        {item.name}
      </Text>
      {item.venue ? (
        <Text style={{ color: T.textSec, fontSize: 12 }} numberOfLines={1}>📍 {item.venue}</Text>
      ) : null}
      {item.status && item.matchEnded ? (
        <Text style={{ color: T.textSec, fontSize: 12, marginTop: 4, fontWeight: '600' }}>{item.status}</Text>
      ) : null}
    </View>
  );
}

export default function SeriesDetailScreen({ navigation, route }: Props) {
  const { seriesId, seriesName } = route.params;
  const { selectedSeries, loadingDetail, errorDetail, loadSeriesInfo } = useCricketStore();

  useEffect(() => { loadSeriesInfo(seriesId); }, [seriesId]);

  const info = selectedSeries?.info;
  const matchList = selectedSeries?.matchList ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: T.border,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: T.text, fontWeight: '800', fontSize: 15, flex: 1 }} numberOfLines={1}>
          {seriesName}
        </Text>
      </View>

      {loadingDetail && !selectedSeries ? (
        <ActivityIndicator color={T.primary} style={{ marginTop: 40 }} />
      ) : errorDetail ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: T.live, fontSize: 14 }}>Failed to load series</Text>
          <TouchableOpacity onPress={() => loadSeriesInfo(seriesId)} style={{ marginTop: 12 }}>
            <Text style={{ color: T.primary, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={matchList}
          keyExtractor={m => m.id}
          renderItem={({ item }) => <MatchRow item={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
          ListHeaderComponent={info ? (
            <View style={{
              marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFF',
              borderRadius: 16, padding: 16, ...T.shadow,
            }}>
              <Text style={{ color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 8 }}>{info.name}</Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {info.test > 0 && <Chip label={`${info.test} Tests`} />}
                {info.odi > 0  && <Chip label={`${info.odi} ODIs`}  />}
                {info.t20 > 0  && <Chip label={`${info.t20} T20Is`} />}
                <Chip label={`${info.matches} matches`} color={T.gold} textColor="#92400E" />
              </View>
              <Text style={{ color: T.textSec, fontSize: 12, marginTop: 8 }}>
                {info.startDate} – {info.endDate}
              </Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <Text style={{ color: T.textSec, textAlign: 'center', marginTop: 24 }}>No matches found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function Chip({ label, color = T.primaryLight, textColor = T.primaryDark }: {
  label: string; color?: string; textColor?: string;
}) {
  return (
    <View style={{ backgroundColor: color, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: textColor, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
