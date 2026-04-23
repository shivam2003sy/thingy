import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import BattleScreen from '../screens/BattleScreen';
import ResultScreen from '../screens/ResultScreen';
import ContestScreen from '../screens/ContestScreen';
import BallRushScreen from '../screens/BallRushScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Tabs: undefined;
  Matchmaking: undefined;
  Battle: undefined;
  Result: undefined;
  ContestDetail: { contest: any };
  BallRush: { matchId: string; matchName: string };
  Wallet: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, handleOAuthCallback, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  // ── Deep-link listener for Google OAuth callback ──────────────────────────
  // When the browser redirects to thingy://auth/callback, Supabase puts
  // access_token + refresh_token in the URL fragment.  We grab them here and
  // hand them to the store which completes sign-in.
  useEffect(() => {
    // Cold-start: app was launched via the deep link
    Linking.getInitialURL().then(url => {
      if (url?.startsWith('thingy://auth/callback')) {
        handleOAuthCallback(url);
      }
    });

    // Warm-start: app was already open, browser returned to foreground
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('thingy://auth/callback')) {
        handleOAuthCallback(url);
      }
    });

    return () => sub.remove();
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* Always show splash first */}
        <Stack.Screen name="Splash" component={SplashScreen} />

        {/* Auth gate: show Auth if no user, else Tabs */}
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} options={{ animation: 'fade' }} />
            <Stack.Screen name="Battle" component={BattleScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ContestDetail" component={ContestScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="BallRush" component={BallRushScreen} options={{ animation: 'slide_from_bottom' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
