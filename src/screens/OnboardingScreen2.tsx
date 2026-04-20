import React from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingScreen2Props {
  onNext: () => void;
}

export const OnboardingScreen2: React.FC<OnboardingScreen2Props> = ({ onNext }) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View className="flex-1 bg-gradient-to-br from-purple-600 via-blue-500 to-pink-500 items-center justify-center relative">
      {/* Background Elements */}
      <View className="absolute inset-0">
        {[...Array(20)].map((_, index) => (
          <View
            key={`bg-${index}`}
            className={`absolute w-16 h-16 ${
              index % 4 === 0 ? 'bg-lime-400/20' : 
              index % 4 === 1 ? 'bg-yellow-300/20' : 
              index % 4 === 2 ? 'bg-pink-400/20' : 'bg-blue-400/20'
            } ${
              index % 3 === 0 ? 'rounded-full' : 
              index % 3 === 1 ? 'rounded-3xl' : 'rounded-lg'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: [{ rotate: `${Math.random() * 360}deg` }],
            }}
          />
        ))}
      </View>

      {/* Floating Objects */}
      <View className="absolute inset-0">
        {[
          { emoji: '📦', left: '10%', top: '20%' },
          { emoji: '🚚', left: '80%', top: '15%' },
          { emoji: '❌', left: '15%', top: '70%' },
          { emoji: '🤷', left: '85%', top: '75%' },
          { emoji: '📭', left: '50%', top: '10%' },
          { emoji: '🕳️', left: '45%', top: '80%' },
        ].map((item, index) => (
          <View
            key={`float-${index}`}
            className="absolute"
            style={{ left: item.left, top: item.top }}
          >
            <Text className="text-4xl opacity-70">{item.emoji}</Text>
          </View>
        ))}
      </View>

      {/* UI Elements */}
      <View className="absolute top-20 left-6">
        <View className="bg-yellow-400 rounded-full w-12 h-12 items-center justify-center border-2 border-black/30">
          <Text className="text-black font-bold text-lg">⭐</Text>
        </View>
      </View>
      
      <View className="absolute top-20 right-6">
        <View className="bg-lime-400 rounded-full w-12 h-12 items-center justify-center border-2 border-black/30">
          <Text className="text-black font-bold text-lg">🔥</Text>
        </View>
      </View>

      <View className="absolute top-32 left-12">
        <View className="bg-pink-400 rounded-lg px-3 py-1 border-2 border-black/30">
          <Text className="text-black font-bold text-xs">😂</Text>
        </View>
      </View>

      <View className="absolute top-32 right-12">
        <View className="bg-blue-400 rounded-lg px-3 py-1 border-2 border-black/30">
          <Text className="text-black font-bold text-xs">💀</Text>
        </View>
      </View>

      {/* Main Content */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="items-center px-8"
      >
        {/* Delivery Illustration */}
        <View className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 mb-8 shadow-2xl border-4 border-black/20">
          <View className="w-48 h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl items-center justify-center mb-4">
            <Text className="text-6xl mb-2">📦</Text>
            <Text className="text-2xl">🚫</Text>
            <Text className="text-2xl">🏠</Text>
          </View>
          <Text className="text-center text-gray-700 font-medium">
            Nothing gets delivered. Ever.
          </Text>
        </View>

        {/* Headline */}
        <Text className="text-white text-5xl font-black text-center mb-4 tracking-wide">
          Nothing gets delivered
        </Text>

        {/* Subheading */}
        <Text className="text-white text-xl text-center mb-12 opacity-90">
          Buy stuff that never arrives. That's the point.
        </Text>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={onNext}
          className="bg-gradient-to-r from-lime-400 to-yellow-400 rounded-full px-12 py-4 shadow-lg border-4 border-black/30"
        >
          <Text className="text-black text-xl font-bold">
            Continue →
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Progress Indicator */}
      <View className="absolute bottom-8 flex-row space-x-2">
        <View className="w-2 h-2 bg-white/30 rounded-full" />
        <View className="w-8 h-2 bg-white rounded-full" />
        <View className="w-2 h-2 bg-white/30 rounded-full" />
      </View>
    </View>
  );
};
