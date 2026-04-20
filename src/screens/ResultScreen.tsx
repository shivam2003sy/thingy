import React, { useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/gameStore';
import { useUserStore } from '../store/userStore';
import { PREDICTION_OPTIONS } from '../utils/mockData';
import { resultEmoji, resultLabel, coinsForResult, xpForResult } from '../services/gameService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { APP_CONFIG } from '../config/constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Result'>;
};

export default function ResultScreen({ navigation }: Props) {
  const { winner, myTotalScore, opponentTotalScore, rounds, opponentName, resetGame } =
    useGameStore();
  const { winStreak } = useUserStore();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(trophyAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    navigation.replace('Matchmaking');
  };

  const handleHome = () => {
    resetGame();
    navigation.replace('Home');
  };

  const trophyEmoji = winner === 'me' ? '🏆' : winner === 'opponent' ? '💔' : '🤝';
  const titleText =
    winner === 'me' ? 'You Won!' : winner === 'opponent' ? 'You Lost' : "It's a Draw!";
  const subtitleText =
    winner === 'me'
      ? 'Amazing predictions!'
      : winner === 'opponent'
      ? 'Better luck next time!'
      : 'Evenly matched!';

  const bannerColors: [string, string] =
    winner === 'me'
      ? ['#4c1d95', '#2e1065']
      : winner === 'opponent'
      ? ['#1c1917', '#0c0a09']
      : ['#1e3a8a', '#0f172a'];

  const earnedCoins = coinsForResult(winner ?? 'draw');
  const earnedXP = xpForResult(winner ?? 'draw');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {/* Banner */}
        <LinearGradient colors={bannerColors} style={{ paddingTop: 48, paddingBottom: 36, alignItems: 'center' }}>
          <Animated.Text style={{ fontSize: 72, transform: [{ scale: trophyAnim }] }}>
            {trophyEmoji}
          </Animated.Text>
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text
              style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: 12 }}
            >
              {titleText}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 4 }}>
              {subtitleText}
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Final Score */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: '#18181B',
            borderRadius: 18,
            padding: 20,
          }}
        >
          <Text
            style={{
              color: '#52525B',
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1.2,
              marginBottom: 16,
            }}
          >
            FINAL SCORE
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#A855F7', fontSize: 36, fontWeight: '800' }}>
                {myTotalScore}
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                You
              </Text>
            </View>
            <Text style={{ color: '#3F3F46', fontSize: 16, fontWeight: '600' }}>VS</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#71717A', fontSize: 36, fontWeight: '800' }}>
                {opponentTotalScore}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                {opponentName.length > 12 ? opponentName.slice(0, 12) + '…' : opponentName}
              </Text>
            </View>
          </View>
        </View>

        {/* Rewards */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: '#18181B',
              borderRadius: 14,
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FBBF24', fontWeight: '800', fontSize: 18 }}>
              +{earnedCoins}
            </Text>
            <Text style={{ color: '#71717A', fontSize: 11, marginTop: 3 }}>Coins earned</Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: '#18181B',
              borderRadius: 14,
              padding: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#4ADE80', fontWeight: '800', fontSize: 18 }}>+{earnedXP}</Text>
            <Text style={{ color: '#71717A', fontSize: 11, marginTop: 3 }}>XP earned</Text>
          </View>
          {winStreak > 1 && (
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(249,115,22,0.15)',
                borderRadius: 14,
                padding: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#FB923C', fontWeight: '800', fontSize: 18 }}>
                🔥{winStreak}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 11, marginTop: 3 }}>Win streak</Text>
            </View>
          )}
        </View>

        {/* Ball-by-ball breakdown */}
        <View style={{ marginHorizontal: 16, marginTop: 20 }}>
          <Text
            style={{
              color: '#52525B',
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1.2,
              marginBottom: 12,
            }}
          >
            BALL BY BALL
          </Text>
          <View
            style={{ backgroundColor: '#18181B', borderRadius: 16, overflow: 'hidden' }}
          >
            {rounds.map((round, i) => {
              const myOption = PREDICTION_OPTIONS.find(o => o.id === round.myPredictionId);
              const oppOption = PREDICTION_OPTIONS.find(o => o.id === round.opponentPredictionId);
              const isLast = i === rounds.length - 1;
              return (
                <View
                  key={round.ball}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: '#27272A',
                  }}
                >
                  {/* Ball number */}
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: '#27272A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700' }}>
                      {round.ball}
                    </Text>
                  </View>

                  {/* Result info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>
                      {resultEmoji(round.ballResult.outcome)} {resultLabel(round.ballResult)}
                    </Text>
                    <Text
                      style={{ color: '#52525B', fontSize: 11, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {round.ballResult.commentary}
                    </Text>
                  </View>

                  {/* Points */}
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor:
                          round.myPoints > 0 ? 'rgba(34,197,94,0.15)' : '#27272A',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: round.myPoints > 0 ? '#4ADE80' : '#52525B',
                        }}
                      >
                        {String(myOption?.icon)} {round.myPoints > 0 ? `+${round.myPoints}` : '0'}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor:
                          round.opponentPoints > 0 ? 'rgba(239,68,68,0.15)' : '#27272A',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: round.opponentPoints > 0 ? '#F87171' : '#52525B',
                        }}
                      >
                        {String(oppOption?.icon)}{' '}
                        {round.opponentPoints > 0 ? `+${round.opponentPoints}` : '0'}
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
          <TouchableOpacity
            onPress={handlePlayAgain}
            style={{ borderRadius: 18, overflow: 'hidden' }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 18, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 17 }}>
                ⚡ Play Again
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleHome}
            style={{
              backgroundColor: '#18181B',
              borderRadius: 18,
              paddingVertical: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#A1A1AA', fontWeight: '600', fontSize: 16 }}>🏠 Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
