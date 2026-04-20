import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Dimensions, ActivityIndicator } from 'react-native';
import { useUserStore } from '../store/userStore';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: (hasCompletedOnboarding: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  
  const fadeAnim = new Animated.Value(1);
  const scaleAnim = new Animated.Value(1);
  const pulseAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  const wobbleAnim = new Animated.Value(0);
  
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  
  const loadingTips = [
    "Summoning the chaos...",
    "Cooking up memes...",
    "Loading random stuff...",
    "Connecting to the void...",
    "Preparing absolute nonsense...",
    "Charging the chaos battery...",
  ];

  useEffect(() => {
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + Math.random() * 12;
      });
    }, 350);

    // Change tips every 1.8 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 1800);

    // Wobble animation for logo
    const wobbleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(wobbleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(wobbleAnim, {
          toValue: -1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    wobbleAnimation.start();

    // Continuous animations
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    const slideAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    slideAnimation.start();

    // Exit after 3 seconds or when progress hits 100%
    const exitTimer = setTimeout(() => {
      setLoadingProgress(100);
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onFinish(hasCompletedOnboarding);
        });
      }, 300);
    }, 3000);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
      clearTimeout(exitTimer);
      wobbleAnimation.stop();
      pulseAnimation.stop();
      slideAnimation.stop();
    };
  }, [hasCompletedOnboarding]);

  const wobble = wobbleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const slideX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  return (
    <View className="flex-1 bg-gradient-to-br from-purple-600 via-blue-500 to-pink-500 items-center justify-center">
      {/* Animated Background Elements */}
      <View className="absolute inset-0">
        {/* Abstract shapes */}
        {[...Array(15)].map((_, index) => (
          <Animated.View
            key={`shape-${index}`}
            style={{
              position: 'absolute',
              opacity: 0.1,
              transform: [
                { translateX: new Animated.Value(Math.random() * width - width/2) },
                { translateY: new Animated.Value(Math.random() * height - height/2) },
                { scale: new Animated.Value(0.8 + Math.random() * 1.5) },
              ],
            }}
          >
            <View 
              className={`w-20 h-20 ${
                index % 4 === 0 ? 'bg-lime-400' : 
                index % 4 === 1 ? 'bg-yellow-300' : 
                index % 4 === 2 ? 'bg-pink-400' : 'bg-blue-400'
              } ${
                index % 3 === 0 ? 'rounded-full' : 
                index % 3 === 1 ? 'rounded-3xl' : 'rounded-lg'
              }`} 
            />
          </Animated.View>
        ))}
      </View>

      {/* Floating Objects */}
      <View className="absolute inset-0">
        {[
          { emoji: '🍌', delay: 0 },
          { emoji: '🐔', delay: 200 },
          { emoji: '🧱', delay: 400 },
          { emoji: '🎯', delay: 600 },
          { emoji: '🎪', delay: 800 },
          { emoji: '🌮', delay: 1000 },
        ].map((item, index) => (
          <Animated.View
            key={`float-${index}`}
            style={{
              position: 'absolute',
              opacity: 0.7,
              transform: [
                { 
                  translateX: Animated.multiply(
                    fadeAnim,
                    new Animated.Value(Math.sin(Date.now() / 1000 + index) * 60)
                  ) 
                },
                { 
                  translateY: Animated.multiply(
                    fadeAnim,
                    new Animated.Value(Math.cos(Date.now() / 1000 + index) * 60)
                  ) 
                },
                { scale: new Animated.Value(0.8 + Math.sin(Date.now() / 800 + index) * 0.2) },
              ],
            }}
            className={`${
              index % 2 === 0 ? 'left-' + (10 + index * 8) : 'right-' + (10 + index * 8)
            } top-${20 + index * 12}`}
          >
            <Text className="text-3xl">{item.emoji}</Text>
          </Animated.View>
        ))}
      </View>

      {/* Main Content */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { rotate: wobble }],
          opacity: fadeAnim,
        }}
        className="items-center"
      >
        {/* Logo Container with Pulse */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
          className="mb-8"
        >
          <View className="bg-white/90 backdrop-blur-sm rounded-3xl px-8 py-4 shadow-2xl border-4 border-black/20">
            <Text className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 tracking-wider" style={{ textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 2, height: 2 } }}>
              THINGY
            </Text>
          </View>
        </Animated.View>

        {/* Tagline */}
        <Text className="text-white text-xl font-bold text-center mb-8 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full">
          Random • Chaotic • Fun
        </Text>
      </Animated.View>

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

      {/* Loading Progress Bar */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          width: width * 0.85,
        }}
        className="absolute bottom-32"
      >
        <View className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur-sm border-2 border-white/30">
          <Animated.View
            style={{
              width: `${loadingProgress}%`,
              backgroundColor: '#FFFFFF',
              height: '100%',
              borderRadius: 999,
            }}
            className="justify-end items-center pr-3"
          >
            {loadingProgress > 10 && (
              <Text className="text-xs text-purple-600 font-bold">
                {Math.round(loadingProgress)}%
              </Text>
            )}
          </Animated.View>
        </View>
      </Animated.View>

      {/* Dynamic Loading Tips */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideX }],
        }}
        className="absolute bottom-20 px-8"
      >
        <View className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-white/30">
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#FFFFFF" className="mr-3" />
            <Text className="text-white text-center font-bold text-base">
              {loadingTips[currentTip]}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Floating Particles */}
      {[...Array(12)].map((_, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={{
            position: 'absolute',
            opacity: fadeAnim,
            transform: [
              { 
                translateX: Animated.multiply(
                  fadeAnim,
                  new Animated.Value(Math.sin(Date.now() / 1000 + index) * 40)
                ) 
              },
              { 
                translateY: Animated.multiply(
                  fadeAnim,
                  new Animated.Value(Math.cos(Date.now() / 1000 + index) * 40)
                ) 
              },
            ],
          }}
          className={`${
            index % 2 === 0 ? 'left-' + (5 + index * 3) : 'right-' + (5 + index * 3)
          } top-${10 + index * 6}`}
        >
          <View className={`w-2 h-2 ${
            index % 3 === 0 ? 'bg-yellow-300' : 
            index % 3 === 1 ? 'bg-pink-300' : 'bg-lime-300'
          } rounded-full opacity-80`} />
        </Animated.View>
      ))}
    </View>
  );
};
