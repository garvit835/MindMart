import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

export default function HomeDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [profile, setProfile] = useState<{ xp: number, level: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    if (user?.id) {
      const { data } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
      if (data) setProfile(data);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const displayName = user?.email?.split('@')[0] || 'Friend';
  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const xpForNextLevel = level * 200;
  const progressPercent = Math.min((xp / xpForNextLevel) * 100, 100);

  return (
    <ScreenWrapper>
      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* Header Section */}
        <View className="mb-6 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-500 dark:text-gray-400 text-base mb-1">Good morning,</Text>
            <Text className="text-3xl font-bold text-text-light dark:text-text-dark capitalize">
              {displayName}
            </Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center"
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Feather name="user" size={24} color="#2DD4BF" />
          </TouchableOpacity>
        </View>

        {/* Level & XP Progress Card */}
        <View className="bg-white dark:bg-surface-dark p-5 rounded-2xl mb-8 border border-gray-100 dark:border-gray-800 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <Feather name="star" size={20} color="#F59E0B" />
              <Text className="ml-2 font-bold text-lg text-text-light dark:text-text-dark">Level {level}</Text>
            </View>
            <Text className="text-gray-500 text-sm font-medium">{xp} / {xpForNextLevel} XP</Text>
          </View>
          <View className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <View 
              className="h-full bg-amber-400 rounded-full" 
              style={{ width: `${progressPercent}%` }} 
            />
          </View>
        </View>

        {/* Daily Quote / Mood Card */}
        <View className="bg-primary/10 dark:bg-primary/5 rounded-3xl p-6 mb-8 border border-primary/20">
          <View className="flex-row items-center mb-4">
            <Feather name="sun" size={24} color="#2DD4BF" />
            <Text className="ml-2 font-semibold text-primary-dark">Daily Inspiration</Text>
          </View>
          <Text className="text-text-light dark:text-text-dark text-lg font-medium leading-relaxed">
            "Your mind is a garden, your thoughts are the seeds. You can grow flowers, or you can grow weeds."
          </Text>
        </View>

        {/* Quick Actions */}
        <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Quick Actions</Text>
        <View className="flex-row justify-between flex-wrap">
          
          <TouchableOpacity 
            className="w-[48%] bg-white dark:bg-surface-dark p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
            onPress={() => router.push('/(tabs)/wellness')}
          >
            <View className="w-10 h-10 bg-secondary/20 rounded-full items-center justify-center mb-3">
              <Feather name="activity" size={20} color="#6366F1" />
            </View>
            <Text className="font-semibold text-text-light dark:text-text-dark">Log Mood</Text>
            <Text className="text-gray-500 text-xs mt-1">Track how you feel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-[48%] bg-white dark:bg-surface-dark p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-gray-800"
            onPress={() => router.push('/(tabs)/marketplace')}
          >
            <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mb-3">
              <Feather name="shopping-bag" size={20} color="#2DD4BF" />
            </View>
            <Text className="font-semibold text-text-light dark:text-text-dark">Shop</Text>
            <Text className="text-gray-500 text-xs mt-1">Sustainable goods</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}