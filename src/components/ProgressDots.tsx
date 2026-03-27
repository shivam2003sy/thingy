import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface ProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({
  total,
  current,
  className = '',
}) => {
  return (
    <View className={`flex-row justify-center items-center gap-2 ${className}`}>
      {Array.from({ length: total }).map((_, index) => (
        <Dot key={index} active={index === current} />
      ))}
    </View>
  );
};

const Dot: React.FC<{ active: boolean }> = ({ active }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(active ? 1.2 : 1) }],
    opacity: withSpring(active ? 1 : 0.4),
  }));
  
  return (
    <Animated.View
      style={animatedStyle}
      className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-gray-500'}`}
    />
  );
};
