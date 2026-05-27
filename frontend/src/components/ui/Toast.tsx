import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useToastStore } from '../../store/toastStore';

export function Toast() {
  const { visible, message, type, hideToast } = useToastStore();

  if (!visible) return null;

  // Colors & Icons based on ToastType
  const config = {
    success: {
      bg: 'bg-emerald-500/90 dark:bg-emerald-600/90',
      border: 'border-emerald-400/50',
      icon: 'check-circle' as const,
      color: '#10B981',
      title: 'Success'
    },
    error: {
      bg: 'bg-rose-500/90 dark:bg-rose-600/90',
      border: 'border-rose-400/50',
      icon: 'alert-triangle' as const,
      color: '#F43F5E',
      title: 'Error'
    },
    info: {
      bg: 'bg-sky-500/90 dark:bg-sky-600/90',
      border: 'border-sky-400/50',
      icon: 'info' as const,
      color: '#0EA5E9',
      title: 'Note'
    }
  }[type];

  return (
    <View 
      className="absolute top-12 left-6 right-6 z-50 rounded-2xl overflow-hidden border border-white/20 shadow-xl"
      style={styles.shadow}
    >
      {/* Glassmorphic card container */}
      <View className={`${config.bg} backdrop-blur-md px-5 py-4 flex-row items-center justify-between`}>
        <View className="flex-row items-center flex-1 pr-4">
          <View className="bg-white/20 p-2 rounded-xl mr-3.5">
            <Feather name={config.icon} size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{config.title}</Text>
            <Text className="text-white font-medium text-sm mt-0.5 leading-relaxed">{message}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={hideToast}
          className="w-7 h-7 bg-white/10 rounded-full items-center justify-center"
          activeOpacity={0.7}
        >
          <Feather name="x" size={14} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  }
});
