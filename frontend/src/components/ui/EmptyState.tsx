import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface EmptyStateProps extends ViewProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = 'inbox', title, description, action, className = '', ...props }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center p-8 ${className}`} {...props}>
      <View className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full items-center justify-center mb-6">
        <Feather name={icon} size={32} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-bold text-text-light dark:text-text-dark text-center mb-2">
        {title}
      </Text>
      <Text className="text-gray-500 text-center mb-6 leading-relaxed">
        {description}
      </Text>
      {action}
    </View>
  );
}
