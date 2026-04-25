import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  SafeAreaView, StatusBar, TextInput, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useCricketStore } from '../store/cricketStore';
import { T } from '../config/theme';
import type { CricPlayerStat } from '../services/cricketService';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ PlayerSearch: { playerId?: string } }, 'PlayerSearch'>;
};

function StatTable({ stats, matchtype }: { stats: CricPlayerStat[]; matchtype: string }) {
  const filtered = stats.filter(s => s.matchtype === matchtype);
  if (filtered.length === 0) return null;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: T.text, fontWeight: '800', fontSize: 13, marginBottom: 8 }}>
        {matchtype.toUpperCase()}
      </Text>
      {filtered.map((s, i) => (
        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: T.borderLight }}>
          <Text style={{ color: T.textSec, fontSize: 13 }}>{s.stat}</Text>
          <Text style={{ color: T.text, fontWeight: '600', fontSize: 13 }}>{s.value || '−'}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PlayerSearchScreen({ navigation, route }: Props) {
  const { searchResults, selectedPlayer, loadingSearch, loadingDetail, errorSearch, errorDetail, doSearchPlayers, loadPlayerInfo, clearSearchResults, clearSelectedPlayer } = useCricketStore();
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If launched with a playerId directly, load that player
  useEffect(() => {
    if (route.params?.playerId) {
      loadPlayerInfo(route.params.playerId);
    }
    return () => {
      clearSearchResults();
      clearSelectedPlayer();
    };
  }, []);

  const onChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearchPlayers(text);
    }, 400);
  };

  const onSelectPlayer = (id: string) => {
    clearSearchResults();
    loadPlayerInfo(id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: T.border,
      }}>
        <TouchableOpacity onPress={() => { clearSelectedPlayer(); clearSearchResults(); navigation.goBack(); }} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 20 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: T.text, fontWeight: '800', fontSize: 17 }}>Player Search</Text>
      </View>

      {/* Search bar */}
      <View style={{ margin: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14,
          borderWidth: 1, borderColor: T.border, ...T.shadowSm,
        }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={onChangeText}
            placeholder="Search players by name..."
            placeholderTextColor={T.textMuted}
            style={{ flex: 1, paddingVertical: 12, color: T.text, fontSize: 14 }}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {loadingSearch && <ActivityIndicator color={T.primary} size="small" />}
          {query.length > 0 && !loadingSearch && (
            <TouchableOpacity onPress={() => { setQuery(''); clearSearchResults(); clearSelectedPlayer(); }}>
              <Text style={{ color: T.textMuted, fontSize: 18, paddingLeft: 6 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search results */}
      {searchResults.length > 0 && (
        <View style={{
          marginHorizontal: 16, backgroundColor: '#FFF',
          borderRadius: 14, borderWidth: 1, borderColor: T.border, overflow: 'hidden', ...T.shadow,
          position: 'absolute', top: 140, left: 0, right: 0, zIndex: 10, maxHeight: 280,
        }}>
          <FlatList
            data={searchResults}
            keyExtractor={p => p.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onSelectPlayer(item.id)}
                style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.borderLight }}
              >
                <Text style={{ color: T.text, fontWeight: '700', fontSize: 14 }}>{item.name}</Text>
                <Text style={{ color: T.textSec, fontSize: 12 }}>{item.country}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Player detail */}
      {errorSearch && (
        <Text style={{ color: T.live, textAlign: 'center', marginTop: 16 }}>Search failed. Try again.</Text>
      )}

      {loadingDetail ? (
        <ActivityIndicator color={T.primary} style={{ marginTop: 60 }} />
      ) : selectedPlayer ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
          {/* Player card */}
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, ...T.shadow }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Text style={{ fontSize: 26 }}>🏏</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.text, fontWeight: '800', fontSize: 18 }}>{selectedPlayer.name}</Text>
                <Text style={{ color: T.textSec, fontSize: 13 }}>{selectedPlayer.country}</Text>
                {selectedPlayer.role ? (
                  <View style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: T.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ color: T.primaryDark, fontSize: 12, fontWeight: '700' }}>{selectedPlayer.role}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ gap: 6 }}>
              {selectedPlayer.battingStyle ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ color: T.textSec, fontSize: 13, width: 110 }}>Batting:</Text>
                  <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{selectedPlayer.battingStyle}</Text>
                </View>
              ) : null}
              {selectedPlayer.bowlingStyle ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ color: T.textSec, fontSize: 13, width: 110 }}>Bowling:</Text>
                  <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{selectedPlayer.bowlingStyle}</Text>
                </View>
              ) : null}
              {selectedPlayer.placeOfBirth && selectedPlayer.placeOfBirth !== '--' ? (
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ color: T.textSec, fontSize: 13, width: 110 }}>Born:</Text>
                  <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>{selectedPlayer.placeOfBirth}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Stats by format */}
          {selectedPlayer.stats.length > 0 ? (
            <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 20, ...T.shadow }}>
              <Text style={{ color: T.text, fontWeight: '800', fontSize: 15, marginBottom: 14 }}>Career Stats</Text>
              {(['batting', 'bowling'] as const).map(fn => (
                <View key={fn}>
                  <Text style={{ color: T.primary, fontWeight: '800', fontSize: 12, letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>
                    {fn.toUpperCase()}
                  </Text>
                  {(['test', 'odi', 't20'] as const).map(mt => (
                    <StatTable
                      key={mt}
                      stats={selectedPlayer.stats.filter(s => s.fn === fn)}
                      matchtype={mt}
                    />
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: T.textSec, textAlign: 'center', marginTop: 8 }}>No stats available</Text>
          )}

          {errorDetail && (
            <Text style={{ color: T.live, textAlign: 'center', marginTop: 8 }}>Failed to load player info.</Text>
          )}
        </ScrollView>
      ) : (
        !loadingSearch && query.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 48 }}>🏏</Text>
            <Text style={{ color: T.textSec, fontSize: 14, marginTop: 12 }}>Search for any cricket player</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
}
