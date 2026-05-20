import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

const MOODS = [
  { label: 'Stressed', emoji: '😫', score: 2 },
  { label: 'Anxious', emoji: '😰', score: 3 },
  { label: 'Tired', emoji: '🥱', score: 4 },
  { label: 'Calm', emoji: '😌', score: 7 },
  { label: 'Focused', emoji: '🧐', score: 8 },
  { label: 'Motivated', emoji: '🚀', score: 9 },
];

export default function Wellness() {
  const user = useAuthStore(state => state.user);
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<any[]>([]);
  const [aiMessage, setAiMessage] = useState('');

  // Fetch recent tasks on load
  useEffect(() => {
    if (user) {
      supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setAiTasks(data[0].tasks);
            setAiMessage(data[0].message);
          }
        });
    }
  }, [user]);

  const logMood = async () => {
    if (!selectedMood) {
      Alert.alert('Please select a mood');
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
      // In a real app, use full backend URL from process.env, mocking local for now
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/wellness/recommend`, {
        userId: user?.id,
        currentMood: selectedMood.label,
        notes: notes
      });

      if (response.data?.recommendation) {
        setAiTasks(response.data.recommendation.tasks);
        setAiMessage(response.data.recommendation.message);
        Alert.alert('Mood Logged!', 'We have generated some personalized wellness tasks for you.');
        setNotes('');
        setSelectedMood(null);
      }
      
    } catch (error: any) {
      Alert.alert('Error logging mood', error.message);
    }
    setLoading(false);
  };

  const completeTask = async (taskTitle: string) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/wellness/complete`, {
        userId: user?.id,
        taskId: null, // AI tasks don't have UUIDs yet
        taskTitle: taskTitle
      });

      if (response.data?.success) {
        const { xpAwarded, coinsAwarded, levelUp } = response.data;
        let msg = `You earned ${xpAwarded} XP and ${coinsAwarded} MindCoins!`;
        if (levelUp) {
          msg += `\n\n🎉 You leveled up!`;
        }
        Alert.alert('Task Completed!', msg);
        // Remove from list
        setAiTasks(prev => prev.filter(t => t.title !== taskTitle));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        
        <Text className="text-3xl font-bold text-text-light dark:text-text-dark mb-6">How are you feeling?</Text>

        {/* Mood Selector */}
        <View className="flex-row flex-wrap justify-between mb-6">
          {MOODS.map((mood, idx) => (
            <TouchableOpacity 
              key={idx}
              onPress={() => setSelectedMood(mood)}
              className={`w-[30%] aspect-square items-center justify-center rounded-2xl mb-4 border ${selectedMood?.label === mood.label ? 'border-primary bg-primary/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark'}`}
            >
              <Text className="text-3xl mb-1">{mood.emoji}</Text>
              <Text className="text-xs text-text-light dark:text-text-dark font-medium">{mood.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          placeholder="Add a note (optional)..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          className="h-24"
        />

        <Button 
          title="Log Mood & Get Advice" 
          onPress={logMood} 
          isLoading={loading}
          className="mb-8"
        />

        {/* AI Recommendations */}
        {aiMessage ? (
          <View className="mb-8">
            <View className="bg-secondary/10 p-4 rounded-xl mb-4 border border-secondary/20">
              <Text className="text-secondary-dark font-medium text-base italic">{aiMessage}</Text>
            </View>

            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Recommended for You</Text>
            {aiTasks.map((task, idx) => (
              <View key={idx} className="bg-white dark:bg-surface-dark p-4 rounded-2xl mb-3 shadow-sm flex-row justify-between items-center border border-gray-100 dark:border-gray-800">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-text-light dark:text-text-dark text-base">{task.title}</Text>
                  <Text className="text-gray-500 text-sm mt-1">{task.description}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => completeTask(task.title)}
                  className="bg-primary/10 h-10 w-10 rounded-full items-center justify-center"
                >
                  <Text className="text-primary-dark font-bold">✓</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

      </ScrollView>
    </ScreenWrapper>
  );
}