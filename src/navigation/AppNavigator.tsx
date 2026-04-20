import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import BattleScreen from '../screens/BattleScreen';
import ResultScreen from '../screens/ResultScreen';

export type RootStackParamList = {
  Splash: undefined;
  Home: undefined;
  Matchmaking: undefined;
  Battle: undefined;
  Result: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Matchmaking" component={MatchmakingScreen} />
        <Stack.Screen name="Battle" component={BattleScreen} />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
