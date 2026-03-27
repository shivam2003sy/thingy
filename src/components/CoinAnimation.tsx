import React, { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface CoinAnimationProps {
  count?: number;
  duration?: number;
}

export const CoinAnimation: React.FC<CoinAnimationProps> = ({
  count = 20,
  duration = 2000,
}) => {
  return (
    <View className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }).map((_, index) => (
        <Coin key={index} index={index} duration={duration} />
      ))}
    </View>
  );
};

const Coin: React.FC<{ index: number; duration: number }> = ({ index, duration }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  
  useEffect(() => {
    const startX = Math.random() * width;
    const endY = height + 50;
    const delay = Math.random() * 500;
    
    translateX.value = startX;
    
    translateY.value = withDelay(
      delay,
      withTiming(endY, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: duration - 500 }),
        withTiming(0, { duration: 400 })
      )
    );
    
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      )
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View style={animatedStyle} className="absolute">
      <Text className="text-4xl">💰</Text>
    </Animated.View>
  );
};
