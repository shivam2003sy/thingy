import React, { useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Animated, ScrollView, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { PREDICTION_OPTIONS } from '../utils/mockData';
import { resultEmoji, resultLabel, coinsForResult, xpForResult } from '../services/gameService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { T } from '../config/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Result'> };

export default function ResultScreen({ navigation }: Props) {
  const { winner, myTotalScore, opponentTotalScore, rounds, opponentName, resetGame } = useGameStore();
  const { user } = useAuthStore();
  const winStreak = user?.winStreak ?? 0;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(trophyAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const trophyEmoji = winner === 'me' ? '🏆' : winner === 'opponent' ? '💔' : '🤝';
  const titleText   = winner === 'me' ? 'You Won!' : winner === 'opponent' ? 'You Lost' : "It's a Draw!";
  const subtitleText = winner === 'me' ? 'Amazing predictions!' : winner === 'opponent' ? 'Better luck next time!' : 'Evenly matched!';
  const earnedCoins = coinsForResult(winner ?? 'draw');
  const earnedXP    = xpForResult(winner ?? 'draw');

  const bannerColors: [string, string] = winner === 'me'
    ? [T.primary, T.primaryDark]
    : winner === 'opponent'
    ? ['#F87171', T.live]
    : [T.blue, '#2563EB'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Banner */}
        <LinearGradient colors={bannerColors} style={{ paddingTop: 48, paddingBottom: 40, alignItems: 'center' }}>
          <Animated.Text style={{ fontSize: 72, transform: [{ scale: trophyAnim }] }}>{trophyEmoji}</Animated.Text>
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 12 }}>{titleText}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 }}>{subtitleText}</Text>
          </Animated.View>
        </LinearGradient>

        {/* Final Score */}
        <View style={{ marginHorizontal: 16, marginTop: 16, backgroundColor: T.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: T.border, ...T.shadow }}>
          <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 16 }}>FINAL SCORE</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: T.primary, fontSize: 36, fontWeight: '800' }}>{myTotalScore}</Text>
              <Text style={{ color: T.text, fontSize: 13, fontWeight: '600', marginTop: 4 }}>You</Text>
            </View>
            <Text style={{ color: T.border, fontSize: 18, fontWeight: '700' }}>VS</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: T.textSec, fontSize: 36, fontWeight: '800' }}>{opponentTotalScore}</Text>
              <Text style={{ color: T.textSec, fontSize: 13, marginTop: 4 }}>{opponentName.slice(0, 12)}</Text>
            </View>
          </View>
        </View>

        {/* Rewards */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: T.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border }}>
            <Text style={{ color: T.gold, fontWeight: '800', fontSize: 18 }}>+{earnedCoins}</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>Tokens earned</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: T.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: T.border }}>
            <Text style={{ color: T.primary, fontWeight: '800', fontSize: 18 }}>+{earnedXP}</Text>
            <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>XP earned</Text>
          </View>
          {winStreak > 1 && (
            <View style={{ flex: 1, backgroundColor: '#FEF3C7', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' }}>
              <Text style={{ color: T.gold, fontWeight: '800', fontSize: 18 }}>🔥{winStreak}</Text>
              <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 3 }}>Win streak</Text>
            </View>
          )}
        </View>

        {/* Ball by ball */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <Text style={{ color: T.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>BALL BY BALL</Text>
          <View style={{ backgroundColor: T.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.border }}>
            {rounds.map((round, i) => {
              const myOption  = PREDICTION_OPTIONS.find(o => o.id === round.myPredictionId);
              const oppOption = PREDICTION_OPTIONS.find(o => o.id === round.opponentPredictionId);
              const isLast = i === rounds.length - 1;
              return (
                <View key={round.ball} style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 16, paddingVertical: 12,
                  borderBottomWidth: isLast ? 0 : 1, borderBottomColor: T.borderLight,
                }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ color: T.primary, fontSize: 12, fontWeight: '700' }}>{round.ball}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: T.text, fontSize: 13, fontWeight: '600' }}>
                      {resultEmoji(round.ballResult.outcome)} {resultLabel(round.ballResult)}
                    </Text>
                    <Text style={{ color: T.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{round.ballResult.commentary}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: round.myPoints > 0 ? '#DCFCE7' : T.borderLight }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: round.myPoints > 0 ? '#16A34A' : T.textMuted }}>
                        {String(myOption?.icon)} {round.myPoints > 0 ? `+${round.myPoints}` : '0'}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: round.opponentPoints > 0 ? '#FEE2E2' : T.borderLight }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: round.opponentPoints > 0 ? T.live : T.textMuted }}>
                        {String(oppOption?.icon)} {round.opponentPoints > 0 ? `+${round.opponentPoints}` : '0'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View style={{ marginHorizontal: 16, marginTop: 24, gap: 12 }}>
          <TouchableOpacity onPress={() => { resetGame(); navigation.replace('Matchmaking'); }} style={{ backgroundColor: T.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', ...T.shadow }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17 }}>⚡ Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { resetGame(); navigation.replace('Tabs'); }} style={{ backgroundColor: T.card, borderRadius: 16, paddingVertical: 18, alignItems: 'center', borderWidth: 1, borderColor: T.border }}>
            <Text style={{ color: T.textSec, fontWeight: '600', fontSize: 16 }}>🏠 Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
