import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const MOODS = [
  { label: 'Stressed', emoji: '😫', score: 2, color: ['#EF4444', '#F43F5E'] },
  { label: 'Anxious', emoji: '😰', score: 3, color: ['#F59E0B', '#D97706'] },
  { label: 'Tired', emoji: '🥱', score: 4, color: ['#6366F1', '#4F46E5'] },
  { label: 'Calm', emoji: '😌', score: 7, color: ['#0EA5E9', '#0284C7'] },
  { label: 'Focused', emoji: '🧐', score: 8, color: ['#8B5CF6', '#7C3AED'] },
  { label: 'Motivated', emoji: '🚀', score: 9, color: ['#10B981', '#059669'] },
];

export default function Wellness() {
  const user = useAuthStore(state => state.user);
  const session = useAuthStore(state => state.session);
  const showToast = useToastStore(state => state.showToast);
  const router = useRouter();
  
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [aiTasks, setAiTasks] = useState<any[]>([]);
  const [aiMessage, setAiMessage] = useState('');
  const [completedTasks, setCompletedTasks] = useState<any[]>([]);

  // Fetch recent tasks on load
  useEffect(() => {
    if (user) {
      fetchRecommendations();
      fetchCompletedTasks();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setAiTasks(data[0].tasks || []);
      setAiMessage(data[0].message || '');
    }
  };

  const fetchCompletedTasks = async () => {
    if (user) {
      const { data } = await supabase
        .from('task_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setCompletedTasks(data);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRecommendations(),
      fetchCompletedTasks()
    ]);
    setRefreshing(false);
    showToast('Wellness Hub refreshed 🌿', 'success');
  };

  const logMood = async () => {
    if (!selectedMood) {
      showToast('Please select a mood', 'info');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Save Mood
      const { data: moodData, error: moodError } = await supabase
        .from('mood_logs')
        .insert([{
          user_id: user?.id,
          mood_score: selectedMood.score,
          note: notes
        }]).select().single();

      if (moodError) throw moodError;

      // 2. Fetch AI Recommendations
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/wellness/recommend`, {
        currentMood: selectedMood.label,
        notes: notes
      }, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.data?.recommendation) {
        setAiTasks(response.data.recommendation.tasks);
        setAiMessage(response.data.recommendation.message);
        showToast('Mood logged successfully! Recommendations updated ✨', 'success');
        setNotes('');
        setSelectedMood(null);
      }
      
    } catch (error: any) {
      showToast(error.message || 'Error logging mood', 'error');
    }
    setLoading(false);
  };

  const completeTask = async (taskTitle: string) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/wellness/complete`, {
        taskId: null,
        taskTitle: taskTitle
      }, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.data?.success) {
        const { xpAwarded, coinsAwarded, levelUp } = response.data;
        let msg = `Completed! +${xpAwarded} XP & +${coinsAwarded} MindCoins`;
        if (levelUp) {
          msg += ` • Level Up! 🎉`;
        }
        showToast(msg, 'success');
        // Remove from active list
        setAiTasks(prev => prev.filter(t => t.title !== taskTitle));
        // Refresh completed tasks history list
        fetchCompletedTasks();
      }
    } catch (error: any) {
      showToast(error.message || 'Error completing task', 'error');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 60, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2DD4BF"]} tintColor="#2DD4BF" />
        }
      >
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-extrabold text-text-light dark:text-text-dark mb-2">Wellness Hub</Text>
          <Text className="text-gray-400 text-sm font-medium">Check in, get custom AI recommendations, and chat.</Text>
        </View>

        {/* AI Chat Companion Banner */}
        <TouchableOpacity 
          onPress={() => router.push('/ai-chat')}
          className="rounded-[28px] overflow-hidden mb-8 shadow-sm"
        >
          <LinearGradient
            colors={['#2DD4BF', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1 pr-4">
              <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-4">
                <Feather name="message-circle" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-extrabold text-lg">Chat with Mindy</Text>
                <Text className="text-white/80 text-xs mt-0.5 font-medium">Your personalized, supportive companion is here.</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">How are you feeling today?</Text>

        {/* Mood Selector */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {MOODS.map((mood, idx) => {
            const isSelected = selectedMood?.label === mood.label;
            return (
              <TouchableOpacity 
                key={idx}
                onPress={() => setSelectedMood(mood)}
                className="w-[30%] aspect-square rounded-[24px] mb-4 overflow-hidden shadow-sm"
                style={isSelected ? styles.moodSelectedShadow : styles.moodDefaultShadow}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={mood.color as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-full h-full items-center justify-center"
                  >
                    <Text className="text-3xl mb-1">{mood.emoji}</Text>
                    <Text className="text-xs text-white font-extrabold">{mood.label}</Text>
                  </LinearGradient>
                ) : (
                  <View className="w-full h-full bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 items-center justify-center">
                    <Text className="text-3xl mb-1">{mood.emoji}</Text>
                    <Text className="text-xs text-text-light dark:text-text-dark font-semibold">{mood.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          placeholder="Add notes about your state..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          className="h-24 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800 px-4 py-3"
        />

        <Button 
          title="Log Mood & Get Advice" 
          onPress={logMood} 
          isLoading={loading}
          className="mb-8 rounded-2xl"
        />

        {/* AI Recommendations */}
        {aiMessage ? (
          <View className="mb-8">
            <View className="bg-secondary/10 p-5 rounded-[24px] mb-6 border border-secondary/20 shadow-sm">
              <Text className="text-secondary-dark font-semibold text-base italic leading-relaxed">
                "{aiMessage}"
              </Text>
            </View>

            <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">Recommended for You</Text>
            {aiTasks.map((task, idx) => (
              <View 
                key={idx} 
                className="bg-white/70 dark:bg-surface-dark/70 p-5 rounded-[24px] mb-3 shadow-sm flex-row justify-between items-center border border-white/20 dark:border-gray-800"
              >
                <View className="flex-1 pr-4">
                  <Text className="font-extrabold text-text-light dark:text-text-dark text-base">{task.title}</Text>
                  <Text className="text-gray-400 text-xs font-semibold mt-1 leading-relaxed">{task.description}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => completeTask(task.title)}
                  className="bg-primary/10 h-10 w-10 rounded-2xl items-center justify-center border border-primary/20"
                >
                  <Text className="text-primary-dark font-extrabold text-lg">✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {/* Completed Task History */}
        <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">Recently Completed Tasks</Text>
        <View className="bg-white/70 dark:bg-surface-dark/70 p-5 rounded-[32px] border border-white/20 dark:border-gray-800 shadow-sm mb-4">
          {completedTasks.length === 0 ? (
            <Text className="text-gray-450 text-center py-6 font-medium text-sm">No completed tasks yet. Log your mood to get recommendations!</Text>
          ) : (
            completedTasks.map((task, idx) => (
              <View 
                key={task.id} 
                className={`flex-row justify-between items-center py-3.5 ${idx < completedTasks.length - 1 ? 'border-b border-gray-100 dark:border-gray-850' : ''}`}
              >
                <View className="flex-row items-center flex-1 pr-4">
                  <View 
                    className="w-8 h-8 rounded-2xl items-center justify-center mr-3 bg-green-500/10"
                  >
                    <Feather name="check-circle" size={16} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-text-light dark:text-text-dark text-sm" numberOfLines={1}>{task.task_title}</Text>
                    <Text className="text-gray-400 text-[10px] font-bold mt-0.5">{new Date(task.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-secondary font-black text-xs">+{task.xp_awarded} XP</Text>
                  <Text className="text-amber-500 font-extrabold text-[10px]">+{task.coins_awarded} M</Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  moodDefaultShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  moodSelectedShadow: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  }
});