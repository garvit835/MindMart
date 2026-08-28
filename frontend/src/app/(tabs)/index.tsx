import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const INSPIRATIONAL_QUOTES = [
  "Your mind is a garden, your thoughts are the seeds. You can grow flowers, or you can grow weeds.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Feelings are just visitors, let them come and go.",
  "Give yourself the same grace you so freely give to others.",
  "Peace is a day-to-day journey, one small step at a time.",
  "Believe you can and you're halfway there.",
  "Quiet the mind and the soul will speak."
];

export default function HomeDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  
  const [profile, setProfile] = useState<{ xp: number, level: number } | null>(null);
  const [balance, setBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');

  const fetchProfile = useCallback(async () => {
    if (user?.id) {
      try {
        // 1. Fetch Profile
        const { data, error: profileErr } = await supabase.from('profiles').select('xp, level').eq('id', user.id).single();
        if (profileErr) throw profileErr;
        if (data) setProfile(data);

        // 2. Fetch Wallet Balance
        const { data: txsSummary, error: txsErr } = await supabase.from('reward_transactions').select('amount, transaction_type').eq('user_id', user.id);
        if (txsErr) throw txsErr;
        if (txsSummary) {
          let calcBalance = 0;
          txsSummary.forEach(tx => {
            if (tx.transaction_type === 'earned') calcBalance += tx.amount;
            if (tx.transaction_type === 'spent') calcBalance -= tx.amount;
          });
          setBalance(calcBalance);
        }

        // 3. Fetch Recent Activities
        const [completionsRes, recentTxsRes] = await Promise.all([
          supabase.from('task_completions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('reward_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
        ]);

        const combined: any[] = [];
        if (completionsRes.data) {
          completionsRes.data.forEach(c => combined.push({ ...c, type: 'completion' }));
        }
        if (recentTxsRes.data) {
          recentTxsRes.data.forEach(tx => combined.push({ ...tx, type: 'transaction' }));
        }
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentActivity(combined.slice(0, 4));
      } catch (err: any) {
        showToast(err.message || 'Error updating dashboard details', 'error');
      }
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    fetchProfile();
    const day = new Date().getDate();
    setDailyQuote(INSPIRATIONAL_QUOTES[day % INSPIRATIONAL_QUOTES.length]);
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
    showToast('Dashboard up to date ✨', 'success');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2DD4BF"]} tintColor="#2DD4BF" />
        }
      >
        
        {/* Header Section */}
        <View className="mb-8 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-400 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{getGreeting()}</Text>
            <Text className="text-3xl font-extrabold text-text-light dark:text-text-dark capitalize">
              {displayName}
            </Text>
          </View>
          <TouchableOpacity 
            className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center border border-primary/20"
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Feather name="user" size={22} color="#2DD4BF" />
          </TouchableOpacity>
        </View>

        {/* Wellness Stats Row */}
        <View className="flex-row justify-between mb-8">
          {/* Level & XP Progress Card */}
          <View className="flex-1 bg-white/70 dark:bg-surface-dark/70 p-5 rounded-3xl mr-2 border border-white/20 dark:border-gray-800 shadow-sm justify-between">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center bg-amber-500/10 px-2.5 py-1 rounded-xl">
                <Feather name="star" size={14} color="#F59E0B" />
                <Text className="ml-1 font-extrabold text-xs text-amber-600 dark:text-amber-400">Level {level}</Text>
              </View>
            </View>
            <Text className="text-gray-400 text-[10px] font-bold tracking-wide uppercase mb-1.5">{xp} / {xpForNextLevel} XP</Text>
            <View className="h-2 w-full bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden">
              <View 
                className="h-full bg-amber-400 rounded-full" 
                style={{ width: `${progressPercent}%` }} 
              />
            </View>
          </View>

          {/* Wallet Coins Card */}
          <TouchableOpacity 
            className="flex-1 bg-white/70 dark:bg-surface-dark/70 p-5 rounded-3xl ml-2 border border-white/20 dark:border-gray-800 shadow-sm justify-between"
            onPress={() => router.push('/wallet')}
          >
            <View className="flex-row items-center">
              <View className="w-7 h-7 rounded-2xl bg-primary/15 items-center justify-center mr-2">
                <Text className="text-xs font-black text-primary">M</Text>
              </View>
              <Text className="font-bold text-sm text-text-light dark:text-text-dark">MindCoins</Text>
            </View>
            <Text className="text-3xl font-black text-primary-dark mt-2 tracking-tight">{balance}</Text>
          </TouchableOpacity>
        </View>

        {/* Daily Quote / Mood Card */}
        <View className="rounded-[32px] overflow-hidden border border-white/20 shadow-sm mb-8">
          <LinearGradient
            colors={['rgba(45, 212, 191, 0.08)', 'rgba(99, 102, 241, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-6"
          >
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 rounded-xl bg-primary/20 items-center justify-center mr-3">
                <Feather name="sun" size={18} color="#2DD4BF" />
              </View>
              <Text className="font-bold text-sm text-primary-dark tracking-wide uppercase">Daily Inspiration</Text>
            </View>
            <Text className="text-text-light dark:text-text-dark text-base font-semibold leading-relaxed italic">
              "{dailyQuote}"
            </Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">Quick Actions</Text>
        <View className="flex-row justify-between flex-wrap mb-8">
          
          <TouchableOpacity 
            className="w-[48%] bg-white/70 dark:bg-surface-dark/70 p-5 rounded-[24px] mb-4 shadow-sm border border-white/25 dark:border-gray-800"
            onPress={() => router.push('/(tabs)/wellness')}
            style={styles.cardShadow}
          >
            <View className="w-10 h-10 bg-secondary/15 rounded-2xl items-center justify-center mb-4">
              <Feather name="activity" size={20} color="#6366F1" />
            </View>
            <Text className="font-bold text-text-light dark:text-text-dark text-base">Log Mood</Text>
            <Text className="text-gray-400 text-[11px] font-medium mt-1">Track wellness logs</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="w-[48%] bg-white/70 dark:bg-surface-dark/70 p-5 rounded-[24px] mb-4 shadow-sm border border-white/25 dark:border-gray-800"
            onPress={() => router.push('/(tabs)/marketplace')}
            style={styles.cardShadow}
          >
            <View className="w-10 h-10 bg-primary/15 rounded-2xl items-center justify-center mb-4">
              <Feather name="shopping-bag" size={20} color="#2DD4BF" />
            </View>
            <Text className="font-bold text-text-light dark:text-text-dark text-base">Shop Rewards</Text>
            <Text className="text-gray-400 text-[11px] font-medium mt-1">Redeem wellness gear</Text>
          </TouchableOpacity>

        </View>

        {/* Recent Activity */}
        <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">Recent Activity</Text>
        <View className="bg-white/70 dark:bg-surface-dark/70 p-5 rounded-[32px] border border-white/20 dark:border-gray-800 shadow-sm mb-4">
          {recentActivity.length === 0 ? (
            <Text className="text-gray-400 text-center py-6 font-medium">No recent activity. Start logging your mood to earn XP!</Text>
          ) : (
            recentActivity.map((activity, idx) => (
              <View 
                key={activity.id} 
                className={`flex-row justify-between items-center py-3.5 ${idx < recentActivity.length - 1 ? 'border-b border-gray-100 dark:border-gray-850' : ''}`}
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View 
                    className="w-9 h-9 rounded-2xl items-center justify-center mr-3"
                    style={{ backgroundColor: activity.type === 'completion' ? '#6366F115' : activity.transaction_type === 'earned' ? '#10B98115' : '#EF444415' }}
                  >
                    <Feather 
                      name={activity.type === 'completion' ? 'check' : activity.transaction_type === 'earned' ? 'arrow-down-left' : 'arrow-up-right'} 
                      size={16} 
                      color={activity.type === 'completion' ? '#6366F1' : activity.transaction_type === 'earned' ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-text-light dark:text-text-dark text-sm" numberOfLines={1}>
                      {activity.type === 'completion' ? activity.task_title : activity.description}
                    </Text>
                    <Text className="text-gray-400 text-[10px] mt-0.5 font-medium">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text className={`font-extrabold text-sm ${activity.type === 'completion' ? 'text-secondary-dark' : activity.transaction_type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
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

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  }
});