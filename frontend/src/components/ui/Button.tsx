import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export function Button({ title, variant = 'primary', isLoading, className = '', disabled, ...props }: ButtonProps) {
  let bgClass = 'bg-primary';
  let textClass = 'text-white';

  switch (variant) {
    case 'secondary':
      bgClass = 'bg-secondary';
      break;
    case 'outline':
      bgClass = 'bg-transparent border-2 border-primary';
      textClass = 'text-primary';
      break;
    case 'ghost':
      bgClass = 'bg-transparent';
      textClass = 'text-primary';
      break;
  }

  return (
    <TouchableOpacity
      className={`h-14 rounded-2xl flex-row items-center justify-center px-6 ${bgClass} ${(disabled || isLoading) ? 'opacity-70' : 'opacity-100'} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#2DD4BF' : '#FFF'} />
      ) : (
        <Text className={`font-semibold text-lg ${textClass}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
