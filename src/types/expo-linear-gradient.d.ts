declare module 'expo-linear-gradient' {
  import React from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  interface LinearGradientProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }

  export const LinearGradient: React.FC<LinearGradientProps>;
}
