import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from '../store/userStore';
import { SplashScreen, FeedScreen } from '../screens';
import { OnboardingNavigator } from './OnboardingNavigator';

const Stack = createNativeStackNavigator();

const SplashWrapper: React.FC = () => {
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  
  const handleFinish = (hasCompletedOnboarding: boolean) => {
    // Navigation will be handled by the navigator
  };
  
  return <SplashScreen onFinish={handleFinish} />;
};

export const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'Feed' | null>(null);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  
  useEffect(() => {
    // Add a small delay to show splash screen
    const timer = setTimeout(() => {
      setInitialRoute(hasCompletedOnboarding ? 'Feed' : 'Onboarding');
    }, 2000); // 2 second delay
    
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding]);
  
  if (!initialRoute) {
    return null; // Show native splash while waiting
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
        <Stack.Screen name="Splash" component={SplashWrapper} />
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        <Stack.Screen name="Feed" component={FeedScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
