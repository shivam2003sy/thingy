declare module '@react-navigation/bottom-tabs' {
  import React from 'react';
  import { ParamListBase } from '@react-navigation/native';

  export type BottomTabNavigationOptions = {
    tabBarLabel?: string;
    tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
    headerShown?: boolean;
    [key: string]: any;
  };

  export function createBottomTabNavigator<T extends ParamListBase = ParamListBase>(): {
    Navigator: React.FC<{
      screenOptions?: BottomTabNavigationOptions | ((props: any) => BottomTabNavigationOptions);
      tabBar?: (props: any) => React.ReactNode;
      initialRouteName?: string;
      children?: React.ReactNode;
    }>;
    Screen: React.FC<{
      name: keyof T & string;
      component: React.ComponentType<any>;
      options?: BottomTabNavigationOptions | ((props: any) => BottomTabNavigationOptions);
    }>;
    Group: React.FC<any>;
  };
}
