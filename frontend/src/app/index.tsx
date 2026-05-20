import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        
        {/* Navigation Bar */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center">
            <Feather name="activity" size={28} color="#2DD4BF" />
            <Text className="ml-2 text-xl font-extrabold text-text-light dark:text-text-dark tracking-tight">MindMart</Text>
          </View>
        </View>

        {/* Hero Section */}
        <View className="px-6 py-20 items-center justify-center flex-1 bg-gradient-to-b from-primary/5 to-transparent">
          
          <Text className="text-5xl md:text-6xl font-extrabold text-text-light dark:text-text-dark text-center leading-tight mb-6 max-w-3xl">
            Rewarding Your <Text className="text-primary">Mental Wellness</Text> Journey.
          </Text>
          
          <Text className="text-lg md:text-xl text-gray-500 text-center mb-10 max-w-2xl leading-relaxed">
            Choose your path. Build healthy habits and earn rewards as a User, or list sustainable eco-friendly products as a Seller.
          </Text>
          
          <View className="flex-row items-center space-x-6">
            <TouchableOpacity 
              onPress={() => {
                if (user) router.push('/(tabs)');
                else router.push('/(auth)/login');
              }}
              className="bg-primary px-8 py-4 rounded-full shadow-lg"
            >
              <Text className="text-white font-bold text-lg">Enter as User</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                if (user) router.push('/seller-app/(tabs)/dashboard');
                else router.push('/seller-app/(auth)/login');
              }}
              className="bg-gray-800 dark:bg-white px-8 py-4 rounded-full shadow-lg"
            >
              <Text className="text-white dark:text-gray-900 font-bold text-lg">Enter as Seller</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
