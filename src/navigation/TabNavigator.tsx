import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MatchmakingScreen from '../screens/MatchmakingScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type TabParamList = {
  Home: undefined;
  Battle: undefined;
  Wallet: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TABS = [
  { name: 'Home',    icon: '🏠', activeIcon: '🏠' },
  { name: 'Battle',  icon: '⚔️',  activeIcon: '⚔️'  },
  { name: 'Wallet',  icon: '🪙',  activeIcon: '🪙'  },
  { name: 'Profile', icon: '👤', activeIcon: '👤' },
] as const;

interface TabBarProps {
  state: { routes: Array<{ key: string; name: string }>; index: number };
  descriptors: Record<string, { options: any }>;
  navigation: any;
}

function TabBar({ state, descriptors, navigation }: TabBarProps) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#1A2332',
      borderTopWidth: 1,
      borderTopColor: '#253047',
      paddingBottom: Platform.OS === 'ios' ? 20 : 8,
      paddingTop: 10,
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const tab = TABS[index];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{ flex: 1, alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 22 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 10,
              marginTop: 3,
              fontWeight: focused ? '700' : '400',
              color: focused ? '#00D09C' : '#8B9CB3',
            }}>
              {route.name}
            </Text>
            {focused && (
              <View style={{
                position: 'absolute', bottom: -10,
                width: 4, height: 4, borderRadius: 2,
                backgroundColor: '#00D09C',
              }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Battle" component={MatchmakingScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
