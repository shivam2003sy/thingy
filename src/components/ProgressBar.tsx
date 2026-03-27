import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showPercentage = false,
  className = '',
}) => {
  const progress = useSharedValue(0);
  
  useEffect(() => {
    const percentage = Math.min((current / max) * 100, 100);
    progress.value = withSpring(percentage, {
      damping: 15,
      stiffness: 100,
    });
  }, [current, max]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));
  
  const percentage = Math.round((current / max) * 100);
  
  return (
    <View className={className}>
      {label && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-white font-semibold text-sm">{label}</Text>
          {showPercentage && (
            <Text className="text-gray-400 text-sm">{percentage}%</Text>
          )}
        </View>
      )}
      <View className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <Animated.View
          style={animatedStyle}
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
        />
      </View>
    </View>
  );
};
