import React, { useEffect } from 'react';
import { View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useUserStore } from '../store/userStore';

interface SplashScreenProps {
  onFinish: (hasCompletedOnboarding: boolean) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const opacity = useSharedValue(0);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 });
      setTimeout(() => {
        onFinish(hasCompletedOnboarding);
      }, 500);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Animated.View style={[animatedStyle, { width: '100%', height: '100%', backgroundColor: 'black' }]}>
        <Image
          source={require('../assets/images/splash.gif')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};
