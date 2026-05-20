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
  const [balance, setBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    if (user?.id) {
      // 1. Fetch Profile
      const { data } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
      if (data) setProfile(data);

      // 2. Fetch Wallet Balance
      const { data: txs } = await supabase.from('reward_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (txs) {
        let calcBalance = 0;
        txs.forEach(tx => {
          if (tx.transaction_type === 'earned') calcBalance += tx.amount;
          if (tx.transaction_type === 'spent') calcBalance -= tx.amount;
        });
        setBalance(calcBalance);
      }

      // 3. Fetch Recent Activities (completions + transactions combined)
      const { data: completions } = await supabase.from('task_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3);
      const combined: any[] = [];
      if (completions) {
        completions.forEach(c => combined.push({ ...c, type: 'completion' }));
      }
      if (txs) {
        txs.slice(0, 3).forEach(tx => combined.push({ ...tx, type: 'transaction' }));
      }
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(combined.slice(0, 4));
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

        {/* Wellness Stats Row */}
        <View className="flex-row justify-between mb-8">
          {/* Level & XP Progress Card */}
          <View className="flex-1 bg-white dark:bg-surface-dark p-5 rounded-2xl mr-2 border border-gray-100 dark:border-gray-800 shadow-sm justify-between">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <Feather name="star" size={18} color="#F59E0B" />
                <Text className="ml-1.5 font-bold text-base text-text-light dark:text-text-dark">Level {level}</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xs mb-2">{xp} / {xpForNextLevel} XP</Text>
            <View className="h-2 w-full bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
              <View 
                className="h-full bg-amber-400 rounded-full" 
                style={{ width: `${progressPercent}%` }} 
              />
            </View>
          </View>

          {/* Wallet Coins Card */}
          <TouchableOpacity 
            className="flex-1 bg-white dark:bg-surface-dark p-5 rounded-2xl ml-2 border border-gray-100 dark:border-gray-800 shadow-sm justify-between"
            onPress={() => router.push('/wallet')}
          >
            <View className="flex-row items-center">
              <View className="w-6 h-6 rounded-full bg-amber-400 items-center justify-center mr-2">
                <Text className="text-[10px] font-bold text-white">M</Text>
              </View>
              <Text className="font-bold text-base text-text-light dark:text-text-dark">MindCoins</Text>
            </View>
            <Text className="text-3xl font-extrabold text-primary-dark mt-2">{balance}</Text>
          </TouchableOpacity>
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
        <View className="flex-row justify-between flex-wrap mb-8">
          
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

        {/* Recent Activity */}
        <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Recent Activity</Text>
        <View className="bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
          {recentActivity.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">No recent activity. Start logging your mood or redeem rewards!</Text>
          ) : (
            recentActivity.map((activity, idx) => (
              <View 
                key={activity.id} 
                className={`flex-row justify-between items-center py-3 ${idx < recentActivity.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: activity.type === 'completion' ? '#6366F120' : activity.transaction_type === 'earned' ? '#10B98120' : '#EF444420' }}
                  >
                    <Feather 
                      name={activity.type === 'completion' ? 'check' : activity.transaction_type === 'earned' ? 'arrow-down-left' : 'arrow-up-right'} 
                      size={14} 
                      color={activity.type === 'completion' ? '#6366F1' : activity.transaction_type === 'earned' ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-text-light dark:text-text-dark text-sm" numberOfLines={1}>
                      {activity.type === 'completion' ? activity.task_title : activity.description}
                    </Text>
                    <Text className="text-gray-400 text-[10px] mt-0.5">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text className={`font-bold text-sm ${activity.type === 'completion' ? 'text-secondary-dark' : activity.transaction_type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
                  {activity.type === 'completion' ? `+${activity.xp_awarded} XP` : activity.transaction_type === 'earned' ? `+${activity.amount} M` : `-${activity.amount} M`}
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}