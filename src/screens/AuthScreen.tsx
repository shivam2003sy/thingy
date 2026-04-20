import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView, Animated, ActivityIndicator, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuthStore } from '../store/authStore';

// Google Sign-In: install @react-native-google-signin/google-signin
// then uncomment:
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// GoogleSignin.configure({ webClientId: 'YOUR_WEB_CLIENT_ID_FROM_GOOGLE_CLOUD' });

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'> };

const D = {
  bg: '#0F1923', card: '#1A2332', primary: '#00D09C',
  gold: '#FFD700', text: '#FFFFFF', textSec: '#8B9CB3', border: '#253047',
};

export default function AuthScreen({ navigation }: Props) {
  const { signInWithGoogle, isLoading } = useAuthStore();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const ballAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ballAnim, { toValue: -12, duration: 900, useNativeDriver: true }),
        Animated.timing(ballAnim, { toValue: 0,   duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleGoogle = async () => {
    try {
      /**
       * PRODUCTION — uncomment after setting up @react-native-google-signin:
       *
       * await GoogleSignin.hasPlayServices();
       * const userInfo = await GoogleSignin.signIn();
       * await signInWithGoogle(userInfo.data?.idToken ?? '');
       */

      // Demo mode: use Supabase anonymous auth to simulate Google login
      // Remove this block and uncomment above for real Google Sign-In
      const { createClient } = require('@supabase/supabase-js');
      await continueAsGuest(); // placeholder until Google is configured
    } catch (err: any) {
      console.error('Google sign in error:', err);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }}>
      <LinearGradient
        colors={['#0F1923', '#0F2618', '#0F1923']}
        locations={[0, 0.5, 1]}
        style={{ flex: 1 }}
      >
        {/* Floating cricket ball */}
        <Animated.View
          style={{
            position: 'absolute', top: 60, right: 30,
            transform: [{ translateY: ballAnim }],
            opacity: 0.15,
          }}
        >
          <Text style={{ fontSize: 90 }}>🏏</Text>
        </Animated.View>

        <Animated.View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            justifyContent: 'space-between',
            paddingBottom: 40,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Top — Branding */}
          <View style={{ paddingTop: 80, alignItems: 'center' }}>
            <View
              style={{
                width: 80, height: 80, borderRadius: 24,
                backgroundColor: D.primary + '25',
                borderWidth: 1.5, borderColor: D.primary + '50',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 40 }}>🏏</Text>
            </View>

            <Text style={{ color: D.text, fontSize: 34, fontWeight: '900', letterSpacing: 1 }}>
              THINGY
            </Text>
            <Text style={{ color: D.primary, fontSize: 14, fontWeight: '600', letterSpacing: 3, marginTop: 4 }}>
              PREDICT · BATTLE · WIN
            </Text>

            <View style={{ marginTop: 40, alignItems: 'center', gap: 8 }}>
              <StatPill label="1v1 Battles" value="Real-time" />
              <StatPill label="Live IPL Matches" value="Predict now" />
              <StatPill label="New User Bonus" value="🪙 1,000 FREE" highlight />
            </View>
          </View>

          {/* Bottom — Auth buttons */}
          <View style={{ gap: 14 }}>
            <TouchableOpacity
              onPress={handleGoogle}
              disabled={isLoading}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={D.bg} />
              ) : (
                <>
                  <Text style={{ fontSize: 22 }}>🅖</Text>
                  <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '700' }}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={{ color: '#3A4D5C', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
              By continuing you agree to our Terms & Privacy Policy
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: highlight ? '#00D09C18' : '#1A2332',
        borderRadius: 99,
        paddingHorizontal: 18,
        paddingVertical: 8,
        gap: 8,
        borderWidth: highlight ? 1 : 0,
        borderColor: highlight ? '#00D09C40' : 'transparent',
      }}
    >
      <Text style={{ color: '#8B9CB3', fontSize: 13 }}>{label}</Text>
      <View style={{ width: 1, height: 12, backgroundColor: '#253047' }} />
      <Text style={{ color: highlight ? '#00D09C' : '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
        {value}
      </Text>
    </View>
  );
}
