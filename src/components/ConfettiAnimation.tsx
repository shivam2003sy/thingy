import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F', '#A8E6CF', '#FF8B94'];
const CONFETTI_SHAPES = ['●', '■', '▲', '★'];

interface ConfettiAnimationProps {
  count?: number;
  duration?: number;
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  count = 50,
  duration = 3000,
}) => {
  return (
    <View className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }).map((_, index) => (
        <ConfettiPiece key={index} index={index} duration={duration} />
      ))}
    </View>
  );
};

const ConfettiPiece: React.FC<{ index: number; duration: number }> = ({ index, duration }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
  
  useEffect(() => {
    const startX = Math.random() * width;
    const endX = startX + (Math.random() - 0.5) * 200;
    const endY = height + 50;
    const delay = Math.random() * 300;
    
    translateX.value = startX;
    
    translateX.value = withDelay(
      delay,
      withTiming(endX, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(endY, {
        duration,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    
    rotate.value = withDelay(
      delay,
      withTiming(Math.random() * 720 - 360, {
        duration,
        easing: Easing.linear,
      })
    );
    
    opacity.value = withDelay(
      delay + duration - 500,
      withTiming(0, { duration: 500 })
    );
    
    scale.value = withDelay(
      delay,
      withTiming(0.5 + Math.random() * 0.5, { duration: duration / 2 })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.Text
      style={[animatedStyle, { color, fontSize: 24, position: 'absolute' }]}
    >
      {shape}
    </Animated.Text>
  );
};
