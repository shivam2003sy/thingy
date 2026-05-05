import React, { useEffect, useRef } from 'react';
import { Linking, AppState, AppStateStatus, BackHandler } from 'react-native';
import { supabase } from '../config/supabase';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import OverPredictionScreen from '../screens/OverPredictionScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Tabs: undefined;
  OverPrediction: { matchId: string; matchName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, handleOAuthCallback, initialize } = useAuthStore();
  const appState = useRef(AppState.currentState);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url?.startsWith('thingy://auth/callback')) handleOAuthCallback(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('thingy://auth/callback')) handleOAuthCallback(url);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      if (next === 'active' && appState.current !== 'active') {
        const url = await Linking.getInitialURL();
        if (url?.startsWith('thingy://auth/callback')) {
          handleOAuthCallback(url);
          appState.current = next;
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !useAuthStore.getState().user) {
          handleOAuthCallback(
            `thingy://auth/callback#access_token=${session.access_token}&refresh_token=${session.refresh_token ?? ''}`
          );
        } else if (useAuthStore.getState().isLoading && !session?.user) {
          useAuthStore.setState({ isLoading: false });
        }
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Tabs"           component={TabNavigator}         options={{ animation: 'fade' }} />
            <Stack.Screen name="OverPrediction" component={OverPredictionScreen} options={{ animation: 'slide_from_bottom' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
