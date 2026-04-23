import React, { useEffect, useRef } from 'react';
import { Linking, AppState, AppStateStatus } from 'react-native';
import { supabase } from '../config/supabase';
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
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    initialize();
  }, []);

  // ── Deep-link listener (works when deep link fires properly) ─────────────
  useEffect(() => {
    // Cold-start: app was launched via the deep link
    Linking.getInitialURL().then(url => {
      console.log('[AppNav] getInitialURL:', url);
      if (url?.startsWith('thingy://auth/callback')) {
        console.log('[AppNav] Cold-start OAuth callback detected');
        handleOAuthCallback(url);
      }
    });

    // Warm-start: app was already open, browser returned to foreground
    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('[AppNav] Linking event received:', url);
      if (url.startsWith('thingy://auth/callback')) {
        console.log('[AppNav] Warm-start OAuth callback detected');
        handleOAuthCallback(url);
      }
    });

    return () => sub.remove();
  }, []);

  // ── AppState fallback: check session when app comes back to foreground ────
  // iOS sometimes drops thingy:// redirects from Safari. This catches that:
  // user finishes OAuth in browser, manually switches back → we detect the session.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      console.log('[AppNav] AppState change:', appState.current, '->', next);
      if (next === 'active' && appState.current !== 'active') {
        console.log('[AppNav] App became active, checking for session...');
        
        // First, check if there's a pending deep link URL (Android sometimes delays the event)
        const url = await Linking.getInitialURL();
        console.log('[AppNav] Current URL on active:', url);
        if (url?.startsWith('thingy://auth/callback')) {
          console.log('[AppNav] Found OAuth callback URL on app active!');
          handleOAuthCallback(url);
          return;
        }
        
        // Fallback: check if Supabase already has a session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AppNav] Session check - has session:', !!session?.user, 'has local user:', !!useAuthStore.getState().user);
        if (session?.user && !useAuthStore.getState().user) {
          console.log('[AppNav] Session found but no local user - triggering OAuth callback');
          handleOAuthCallback(
            `thingy://auth/callback#access_token=${session.access_token}&refresh_token=${session.refresh_token ?? ''}`
          );
        } else if (useAuthStore.getState().isLoading && !session?.user) {
          // Clear stuck loading state if we came back from browser but have no session
          console.log('[AppNav] No session found, clearing loading state');
          useAuthStore.setState({ isLoading: false });
        }
      }
      appState.current = next;
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
