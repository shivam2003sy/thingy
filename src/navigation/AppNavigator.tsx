import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import BattleScreen from '../screens/BattleScreen';
import ResultScreen from '../screens/ResultScreen';
import ContestScreen from '../screens/ContestScreen';
import TabNavigator from './TabNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Tabs: undefined;
  Matchmaking: undefined;
  Battle: undefined;
  Result: undefined;
  ContestDetail: { contest: any };
  Wallet: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user } = useAuthStore();

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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
