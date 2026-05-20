import React from 'react';
import { View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenWrapper({ children, className = '', ...props }: ViewProps) {
  return (
    <SafeAreaView className={`flex-1 bg-background-light dark:bg-background-dark ${className}`} {...props}>
      {children}
    </SafeAreaView>
  );
}
