import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="text-text-light dark:text-text-dark font-medium mb-2">{label}</Text>}
      <View className={`h-14 bg-white dark:bg-surface-dark border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-xl px-4 flex-row items-center`}>
        <TextInput
          className={`flex-1 text-base text-text-light dark:text-text-dark ${className}`}
          placeholderTextColor="#94A3B8"
          {...props}
        />
      </View>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
