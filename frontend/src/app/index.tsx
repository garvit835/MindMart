import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // If already logged in, redirect directly to dashboard
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View className="flex-1 bg-[#F8FAFC] dark:bg-[#0F172A]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        
        {/* Navigation Bar */}
        <View className="px-6 py-4 flex-row justify-between items-center bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center">
            <Feather name="activity" size={28} color="#2DD4BF" />
            <Text className="ml-2 text-xl font-extrabold text-text-light dark:text-text-dark tracking-tight">MindMart</Text>
          </View>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-gray-600 dark:text-gray-300 font-medium px-4">Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/register')}
              className="bg-primary px-5 py-2 rounded-full shadow-sm"
            >
              <Text className="text-white font-bold">Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View className="px-6 py-20 items-center justify-center flex-1 bg-gradient-to-b from-primary/5 to-transparent">
          <View className="bg-primary/10 px-4 py-1.5 rounded-full mb-6 border border-primary/20">
            <Text className="text-primary-dark font-medium text-sm">✨ Version 1.0 is now live</Text>
          </View>
          
          <Text className="text-5xl md:text-6xl font-extrabold text-text-light dark:text-text-dark text-center leading-tight mb-6 max-w-3xl">
            Rewarding Your <Text className="text-primary">Mental Wellness</Text> Journey.
          </Text>
          
          <Text className="text-lg md:text-xl text-gray-500 text-center mb-10 max-w-2xl leading-relaxed">
            MindMart is a revolutionary ecosystem that combines AI-driven behavioral therapy with a sustainable marketplace. Build healthy habits, earn MindCoins, and redeem real eco-friendly rewards.
          </Text>
          
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/register')}
            className="bg-text-light dark:bg-white px-8 py-4 rounded-full flex-row items-center shadow-lg"
          >
            <Text className="text-white dark:text-text-light font-bold text-lg mr-2">Start Your Journey</Text>
            <Feather name="arrow-right" size={20} color="white" className="dark:text-text-light" />
          </TouchableOpacity>
        </View>

        {/* Features Showcase */}
        <View className="px-6 py-20 bg-white dark:bg-surface-dark">
          <View className="max-w-5xl mx-auto">
            <View className="items-center mb-16">
              <Text className="text-3xl font-bold text-text-light dark:text-text-dark text-center mb-4">An Ecosystem of Growth</Text>
              <Text className="text-gray-500 text-center max-w-xl text-base">We've built a holistic platform designed to track, support, and tangibly reward your emotional consistency.</Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              
              {/* Feature 1 */}
              <View className="w-full md:w-[30%] bg-[#F8FAFC] dark:bg-[#0F172A] p-8 rounded-3xl mb-6 border border-gray-100 dark:border-gray-800">
                <View className="w-12 h-12 bg-primary/20 rounded-2xl items-center justify-center mb-6">
                  <Feather name="cpu" size={24} color="#2DD4BF" />
                </View>
                <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-3">AI Personalization</Text>
                <Text className="text-gray-500 leading-relaxed">Our advanced Groq-powered AI analyzes your moods and generates highly adaptive wellness routines tailored to your current emotional state.</Text>
              </View>

              {/* Feature 2 */}
              <View className="w-full md:w-[30%] bg-[#F8FAFC] dark:bg-[#0F172A] p-8 rounded-3xl mb-6 border border-gray-100 dark:border-gray-800">
                <View className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl items-center justify-center mb-6">
                  <Feather name="shopping-bag" size={24} color="#F59E0B" />
                </View>
                <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Sustainable Rewards</Text>
                <Text className="text-gray-500 leading-relaxed">Consistency pays off. Complete your daily tasks to earn MindCoins, and spend them in our virtual marketplace on eco-friendly products.</Text>
              </View>

              {/* Feature 3 */}
              <View className="w-full md:w-[30%] bg-[#F8FAFC] dark:bg-[#0F172A] p-8 rounded-3xl mb-6 border border-gray-100 dark:border-gray-800">
                <View className="w-12 h-12 bg-secondary/20 rounded-2xl items-center justify-center mb-6">
                  <Feather name="heart" size={24} color="#818CF8" />
                </View>
                <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-3">Safe Community</Text>
                <Text className="text-gray-500 leading-relaxed">Join wellness groups and participate in shared challenges. Our AI-moderated social feed guarantees a toxic-free, supportive environment.</Text>
              </View>

            </View>
          </View>
        </View>

        {/* Footer CTA */}
        <View className="px-6 py-20 items-center bg-primary-dark">
          <Text className="text-3xl font-bold text-white text-center mb-6">Ready to prioritize yourself?</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/register')}
            className="bg-white px-8 py-4 rounded-full shadow-lg"
          >
            <Text className="text-primary-dark font-bold text-lg">Join MindMart Free</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
