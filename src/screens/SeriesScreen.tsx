import React, { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  SafeAreaView, StatusBar, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCricketStore } from '../store/cricketStore';
import { T } from '../config/theme';
import type { CricSeries } from '../services/cricketService';

type Props = { navigation: NativeStackNavigationProp<any> };

function SeriesRow({ item, onPress }: { item: CricSeries; onPress: () => void }) {
  const formats: string[] = [];
  if (item.test > 0) formats.push(`${item.test} Test`);
  if (item.odi > 0)  formats.push(`${item.odi} ODI`);
  if (item.t20 > 0)  formats.push(`${item.t20} T20`);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: '#FFF', marginHorizontal: 16, marginBottom: 10,
        borderRadius: 16, padding: 16, ...T.shadow,
      }}
    >
      <Text style={{ color: T.text, fontWeight: '800', fontSize: 14, marginBottom: 4 }} numberOfLines={2}>
        {item.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: T.textSec, fontSize: 12 }}>
          {item.startDate} – {item.endDate}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {formats.map(f => (
            <View key={f} style={{ backgroundColor: T.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: T.primaryDark, fontSize: 11, fontWeight: '700' }}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SeriesScreen({ navigation }: Props) {
  const { series, loadingSeries, errorSeries, loadSeriesList } = useCricketStore();

  useEffect(() => { loadSeriesList(); }, []);

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
        <Text style={{ color: T.text, fontWeight: '800', fontSize: 17 }}>Series</Text>
      </View>

      {loadingSeries && series.length === 0 ? (
        <ActivityIndicator color={T.primary} style={{ marginTop: 40 }} />
      ) : errorSeries ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: T.live, fontSize: 14 }}>Failed to load series</Text>
          <TouchableOpacity onPress={loadSeriesList} style={{ marginTop: 12 }}>
            <Text style={{ color: T.primary, fontWeight: '700' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={series}
          keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <SeriesRow
              item={item}
              onPress={() => navigation.navigate('SeriesDetail', { seriesId: item.id, seriesName: item.name })}
            />
          )}
          refreshControl={<RefreshControl refreshing={loadingSeries} onRefresh={loadSeriesList} tintColor={T.primary} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: T.textSec, textAlign: 'center', marginTop: 40 }}>No series found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
