import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import FastImage from '@d11/react-native-fast-image';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 });
      
      // Wait for auth to initialize before navigating
      let attempts = 0;
      const maxAttempts = 30; // 3 seconds max wait
      
      const checkAuthAndNavigate = () => {
        const { user, isInitialized } = require('../store/authStore').useAuthStore.getState();
        console.log('[Splash] Check auth - isInitialized:', isInitialized, 'user:', !!user, 'attempts:', attempts);
        
        if (isInitialized || attempts >= maxAttempts) {
          console.log('[Splash] Navigating to:', user ? 'Tabs' : 'Auth');
          setTimeout(() => navigation.replace(user ? 'Tabs' : 'Auth'), 500);
        } else {
          // Check again in 100ms if not initialized
          attempts++;
          setTimeout(checkAuthAndNavigate, 100);
        }
      };
      checkAuthAndNavigate();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <Animated.View style={[animatedStyle, { flex: 1 }]}>
        <FastImage
          source={require('../assets/images/splash.gif')}
          style={{ width: '100%', height: '100%' }}
          resizeMode={FastImage.resizeMode.contain}
        />
      </Animated.View>
    </View>
  );
}
