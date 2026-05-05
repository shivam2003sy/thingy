import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  Easing 
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);
  const logoRotate = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    logoRotate.value = withSequence(
      withTiming(360, { duration: 800, easing: Easing.out(Easing.cubic) }),
      withTiming(360, { duration: 0 })
    );
    
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 500 });
    }, 400);

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 });
      
      let attempts = 0;
      const maxAttempts = 30;
      
      const checkAuthAndNavigate = () => {
        const { user, isInitialized } = require('../store/authStore').useAuthStore.getState();
        console.log('[Splash] Check auth - isInitialized:', isInitialized, 'user:', !!user, 'attempts:', attempts);
        
        if (isInitialized || attempts >= maxAttempts) {
          console.log('[Splash] Navigating to:', user ? 'Tabs' : 'Auth');
          setTimeout(() => navigation.replace(user ? 'Tabs' : 'Auth'), 500);
        } else {
          attempts++;
          setTimeout(checkAuthAndNavigate, 100);
        }
      };
      checkAuthAndNavigate();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${logoRotate.value}deg` }
    ]
  }));

  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View style={[styles.content, containerStyle]}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>✨</Text>
            </View>
          </Animated.View>
          
          <Animated.View style={textStyle}>
            <Text style={styles.appName}>Thingy</Text>
            <Text style={styles.tagline}>Your Creative Companion</Text>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 2,
  },
});
