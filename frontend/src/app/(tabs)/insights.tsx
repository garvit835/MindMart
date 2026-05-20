import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

export default function InsightsDashboard() {
  const user = useAuthStore(state => state.user);
  
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [crisisMode, setCrisisMode] = useState(false);
  const [moodLogs, setMoodLogs] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;
      await Promise.all([
        fetchOrGenerateInsight(),
        fetchMoodLogs()
      ]);
    };
    init();
  }, [user?.id]);

  const fetchMoodLogs = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(7);
      if (data) setMoodLogs(data);
    }
  };

  const fetchOrGenerateInsight = async () => {
    setLoading(true);
    // Try fetch existing recent insight first
    const { data } = await supabase
      .from('behavioral_insights')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0 && new Date(data[0].created_at).getTime() > Date.now() - 24*60*60*1000) {
      setInsight(data[0]);
      
      // check crisis mode
      const { data: profile } = await supabase.from('profiles').select('crisis_mode').eq('id', user?.id).single();
      setCrisisMode(profile?.crisis_mode || false);
      setLoading(false);
    } else {
      // Trigger AI Analysis
      try {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.post(`${backendUrl}/api/ai/analyze-behavior`, { userId: user?.id });
        if (response.data.success) {
          setInsight(response.data.insight);
          setCrisisMode(response.data.crisis_mode);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  const recalculateInsight = async () => {
    setRecalculating(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/ai/analyze-behavior`, { userId: user?.id });
      if (response.data.success) {
        setInsight(response.data.insight);
        setCrisisMode(response.data.crisis_mode);
        Alert.alert("Success", "AI Insights recalculated successfully!");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Failed to update", err.message);
    }
    setRecalculating(false);
  };

  // Helpers for chart
  const averageMood = moodLogs.length > 0
    ? (moodLogs.reduce((acc, log) => acc + log.mood_score, 0) / moodLogs.length).toFixed(1)
    : 'N/A';

  const getMoodEmoji = (score: number) => {
    if (score <= 3) return '😢';
    if (score <= 5) return '🥱';
    if (score <= 7) return '😌';
    return '🚀';
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center p-6">
           <ActivityIndicator size="large" color="#2DD4BF" />
           <Text className="text-gray-500 mt-4 text-center">Our AI is analyzing your behavioral patterns and building a personalized plan...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        <View className="mb-8 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">AI Insights</Text>
            <Text className="text-gray-500 text-base">Your personalized emotional growth journey.</Text>
          </View>
          <TouchableOpacity 
            onPress={recalculateInsight}
            disabled={recalculating}
            className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center"
          >
            {recalculating ? (
              <ActivityIndicator size="small" color="#2DD4BF" />
            ) : (
              <Feather name="refresh-cw" size={20} color="#2DD4BF" />
            )}
          </TouchableOpacity>
        </View>

        {crisisMode && (
          <View className="bg-red-50 dark:bg-red-900/20 p-6 rounded-3xl mb-8 border border-red-200 dark:border-red-800">
            <View className="flex-row items-center mb-4">
              <Feather name="heart" size={24} color="#EF4444" />
              <Text className="ml-2 font-bold text-red-600 dark:text-red-400 text-lg">We are here for you.</Text>
            </View>
            <Text className="text-red-800 dark:text-red-300 leading-relaxed mb-4">
              Our system noticed that you've been going through a really difficult time lately. MindMart is a great tool, but sometimes we all need a little extra human support.
            </Text>
            <Button title="Connect with a Professional" onPress={() => {}} className="bg-red-500" />
          </View>
        )}

        {/* Dynamic Mood History Chart */}
        <View className="bg-white dark:bg-surface-dark p-6 rounded-3xl mb-8 border border-gray-100 dark:border-gray-800 shadow-sm">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-lg font-bold text-text-light dark:text-text-dark">Mood History (7 Logs)</Text>
            <View className="bg-primary/10 px-3 py-1 rounded-full">
              <Text className="text-primary-dark font-semibold text-xs">Avg: {averageMood}/10</Text>
            </View>
          </View>

          {moodLogs.length === 0 ? (
            <Text className="text-gray-500 text-center py-6">No moods logged yet. Visit Wellness to log your mood.</Text>
          ) : (
            <View>
              <View className="flex-row items-end justify-between h-40 pt-4 px-2">
                {moodLogs.slice().reverse().map((log, idx) => (
                  <View key={log.id || idx} className="items-center flex-1">
                    <Text className="text-base mb-1.5">{getMoodEmoji(log.mood_score)}</Text>
                    <View 
                      className="w-7 bg-primary rounded-t-lg relative" 
                      style={{ height: `${log.mood_score * 8}%`, minHeight: 6 }}
                    >
                      <View className="absolute -top-6 w-full items-center">
                        <Text className="text-[10px] font-bold text-gray-500">{log.mood_score}</Text>
                      </View>
                    </View>
                    <Text className="text-[8px] text-gray-400 mt-2 text-center" style={{ width: 45 }} numberOfLines={1}>
                      {new Date(log.logged_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {insight ? (
          <View>
            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Weekly Emotional Trend</Text>
            <View className="bg-primary/10 p-6 rounded-3xl mb-8 border border-primary/20">
              <Feather name="trending-up" size={24} color="#2DD4BF" className="mb-3" />
              <Text className="text-text-light dark:text-text-dark text-lg font-medium leading-relaxed">
                {insight.emotional_trend}
              </Text>
            </View>

            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Adaptive Action Plan</Text>
            {insight.personalized_plan?.map((step: string, idx: number) => (
              <View key={idx} className="bg-white dark:bg-surface-dark p-5 rounded-2xl mb-3 shadow-sm border border-gray-100 dark:border-gray-800 flex-row">
                <View className="w-8 h-8 rounded-full bg-secondary/20 items-center justify-center mr-4 mt-1">
                  <Text className="font-bold text-secondary-dark">{idx + 1}</Text>
                </View>
                <Text className="flex-1 text-text-light dark:text-text-dark text-base leading-relaxed">{step}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 items-center">
            <Text className="text-gray-500 text-center">Not enough data to generate insights yet. Keep logging your moods and completing tasks!</Text>
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}
