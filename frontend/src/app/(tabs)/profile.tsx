import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function Profile() {
  const { user, signOut } = useAuthStore();
  const router = useRouter();
  
  const [profile, setProfile] = useState<{ xp: number, level: number } | null>(null);
  const [moodLogs, setMoodLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfileData = async () => {
    if (!user) return;
    
    // Fetch XP & Level
    const { data: pData } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
    if (pData) setProfile(pData);

    // Fetch Mood History for basic analytics
    const { data: mData } = await supabase.from('mood_logs').select('mood_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(7);
    if (mData) setMoodLogs(mData);
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut();
    router.replace('/(auth)/login');
  };

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;

  // Basic Badge Logic based on Level
  const badges = [];
  if (level >= 1) badges.push({ id: 1, name: 'Seed of Hope', icon: 'smile', color: '#2DD4BF' });
  if (level >= 2) badges.push({ id: 2, name: 'Sprouting Mind', icon: 'sun', color: '#F59E0B' });
  if (level >= 5) badges.push({ id: 3, name: 'Rooted Wellness', icon: 'shield', color: '#6366F1' });

  return (
    <ScreenWrapper>
      <ScrollView 
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-4">
            <Feather name="user" size={40} color="#2DD4BF" />
          </View>
          <Text className="text-2xl font-bold text-text-light dark:text-text-dark">{user?.email?.split('@')[0]}</Text>
          <Text className="text-gray-500">{user?.email}</Text>
        </View>

        {/* Gamification Stats */}
        <View className="flex-row justify-between mb-8">
          <View className="flex-1 bg-white dark:bg-surface-dark p-4 rounded-2xl mr-2 items-center border border-gray-100 dark:border-gray-800">
            <Text className="text-gray-500 mb-1">Level</Text>
            <Text className="text-3xl font-bold text-amber-500">{level}</Text>
          </View>
          <View className="flex-1 bg-white dark:bg-surface-dark p-4 rounded-2xl ml-2 items-center border border-gray-100 dark:border-gray-800">
            <Text className="text-gray-500 mb-1">Total XP</Text>
            <Text className="text-3xl font-bold text-primary-dark">{xp}</Text>
          </View>
        </View>

        {/* Badges */}
        <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Your Badges</Text>
        <View className="flex-row flex-wrap mb-8">
          {badges.map(badge => (
            <View key={badge.id} className="items-center mr-6 mb-4">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-2" style={{ backgroundColor: badge.color + '20' }}>
                <Feather name={badge.icon as any} size={28} color={badge.color} />
              </View>
              <Text className="text-xs font-medium text-text-light dark:text-text-dark">{badge.name}</Text>
            </View>
          ))}
        </View>

        {/* Analytics Summary */}
        <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Recent Moods</Text>
        <View className="bg-white dark:bg-surface-dark p-4 rounded-2xl mb-8 border border-gray-100 dark:border-gray-800">
          {moodLogs.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">No moods logged yet. Check in on the Wellness tab!</Text>
          ) : (
            <View className="flex-row items-end justify-between h-32 pt-4">
              {moodLogs.slice().reverse().map((log, idx) => (
                <View key={idx} className="items-center">
                  <View 
                    className="w-8 bg-secondary/80 rounded-t-lg" 
                    style={{ height: `${log.mood_score * 10}%`, minHeight: 4 }} 
                  />
                  <Text className="text-[10px] text-gray-400 mt-2">D{idx+1}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Button 
          title="Sign Out" 
          variant="outline" 
          onPress={handleSignOut} 
          className="mt-auto"
        />

      </ScrollView>
    </ScreenWrapper>
  );
}