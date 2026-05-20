import React, { useRef } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Animated, TouchableOpacityProps, AccessibilityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps, AccessibilityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
}

export function Button({
  title,
  variant = 'primary',
  isLoading,
  className = '',
  disabled,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  // Animated scale for press feedback
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  // Determine styling based on variant
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
    default:
      break;
  }

  const isDisabled = disabled || isLoading;

  return (
    <Animated.View style={{ transform: [{ scale }] }} accessibilityRole="button" accessible={true} accessibilityLabel={accessibilityLabel || title}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`h-14 rounded-2xl flex-row items-center justify-center px-6 ${bgClass} ${isDisabled ? 'opacity-70' : 'opacity-100'} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#2DD4BF' : '#FFF'} />
        ) : (
          <Text className={`font-semibold text-lg ${textClass}`}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}
