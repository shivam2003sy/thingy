import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingNavigator } from './OnboardingNavigator';
import { DashboardScreen } from '../screens/DashboardScreen';

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<'Splash' | 'Onboarding' | 'Dashboard'>('Splash');
  const [showSplash, setShowSplash] = useState(true);
  
  const handleSplashFinish = (hasCompletedOnboarding: boolean) => {
    setShowSplash(false);
    setInitialRoute(hasCompletedOnboarding ? 'Dashboard' : 'Onboarding');
  };
  
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
