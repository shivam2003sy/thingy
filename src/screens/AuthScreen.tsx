import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';
import { T } from '../config/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'> };

const FEATURES = [
  { icon: '🪙', label: '1,000 Free Tokens on Signup' },
  { icon: '📊', label: 'Live IPL Match Data' },
  { icon: '🎯', label: 'Predict Every Over & Win Tokens' },
];

export default function AuthScreen({ navigation }: Props) {
  const { signInWithGoogle, isLoading } = useAuthStore();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGoogle = async () => {
    try {
      // Opens Google sign-in in the device browser.
      // Supabase redirects back to thingy://auth/callback when done.
      // AppNavigator listens for that deep link and calls handleOAuthCallback.
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Animated.View style={{ flex: 1, paddingHorizontal: 28, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Logo */}
        <View style={{ paddingTop: 60, alignItems: 'center', marginBottom: 44 }}>
          <View style={{
            width: 88, height: 88, borderRadius: 28,
            backgroundColor: T.primaryLight,
            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <Text style={{ fontSize: 44 }}>🏏</Text>
          </View>
          <Text style={{ color: T.text, fontSize: 32, fontWeight: '800', letterSpacing: 0.5 }}>Thingy</Text>
          <Text style={{ color: T.primary, fontSize: 13, fontWeight: '700', letterSpacing: 2.5, marginTop: 6 }}>
            PREDICT · WIN
          </Text>
        </View>

        {/* Feature list */}
        <View style={{ gap: 10, marginBottom: 44 }}>
          {FEATURES.map(f => (
            <View key={f.label} style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: T.bg, borderRadius: 14,
              paddingHorizontal: 18, paddingVertical: 14,
              borderWidth: 1, borderColor: T.border,
            }}>
              <Text style={{ fontSize: 22, marginRight: 14 }}>{f.icon}</Text>
              <Text style={{ color: T.text, fontSize: 14, fontWeight: '600' }}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Google button */}
        <View style={{ gap: 14 }}>
          <TouchableOpacity
            onPress={handleGoogle}
            disabled={isLoading}
            style={{
              backgroundColor: T.text, borderRadius: 16, paddingVertical: 18,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 12, opacity: isLoading ? 0.7 : 1, ...T.shadow,
            }}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <View style={{
                  width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#4285F4' }}>G</Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={{ color: T.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
