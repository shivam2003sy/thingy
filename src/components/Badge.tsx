import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Badge as BadgeType } from '../types';

interface BadgeProps {
  badge: BadgeType;
  unlocked?: boolean;
  animate?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  badge,
  unlocked = false,
  animate = false,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(unlocked ? 1 : 0.3);
  
  React.useEffect(() => {
    if (animate && unlocked) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [animate, unlocked]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View
      style={animatedStyle}
      className={`bg-gray-900 rounded-2xl p-4 border-2 ${
        unlocked ? 'border-yellow-500' : 'border-gray-800'
      }`}
    >
      <Text className="text-4xl text-center mb-2">{badge.emoji}</Text>
      <Text className={`text-center font-bold text-sm ${unlocked ? 'text-white' : 'text-gray-600'}`}>
        {badge.name}
      </Text>
      <Text className={`text-center text-xs mt-1 ${unlocked ? 'text-gray-400' : 'text-gray-700'}`}>
        {badge.description}
      </Text>
    </Animated.View>
  );
};
