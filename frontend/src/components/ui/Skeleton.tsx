import React from 'react';
import { View, Animated, DimensionValue, ViewStyle } from 'react-native';
import { useEffect, useRef } from 'react';

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style = {} }: { width?: DimensionValue, height?: number, borderRadius?: number, style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { backgroundColor: '#E5E7EB', opacity, width, height, borderRadius },
        style,
      ]}
    />
  );
}
