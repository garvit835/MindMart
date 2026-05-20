import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function AdminDashboard() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  const [flags, setFlags] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // In a real app, verify admin role via RLS. Assuming allowed for demo.
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    const { data: abuseData } = await supabase.from('abuse_flags').select('*, profiles(email)').order('created_at', { ascending: false }).limit(10);
    const { data: logData } = await supabase.from('ai_activity_logs').select('*, profiles(email)').order('created_at', { ascending: false }).limit(10);
    
    if (abuseData) setFlags(abuseData);
    if (logData) setLogs(logData);
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-light dark:text-text-dark">Admin AI Monitor</Text>
        </View>

        <View className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl mb-8 border border-red-100 dark:border-red-900/30">
          <View className="flex-row items-center mb-4">
            <Feather name="alert-triangle" size={24} color="#EF4444" />
            <Text className="ml-2 font-bold text-red-600 dark:text-red-400 text-lg">Abuse Flags</Text>
          </View>
          {flags.map((flag, idx) => (
            <View key={idx} className="bg-white dark:bg-surface-dark p-4 rounded-xl mb-2 flex-row justify-between items-center shadow-sm">
              <View>
                <Text className="font-bold text-text-light dark:text-text-dark">{flag.profiles?.email}</Text>
                <Text className="text-gray-500 text-sm mt-1">{flag.reason}</Text>
              </View>
              <View className="bg-red-100 px-2 py-1 rounded">
                <Text className="text-red-600 font-bold text-xs">-{flag.trust_penalty} Trust</Text>
              </View>
            </View>
          ))}
          {flags.length === 0 && <Text className="text-gray-500">No recent abuse flags.</Text>}
        </View>

        <View className="bg-primary/10 p-6 rounded-3xl mb-8 border border-primary/20">
          <View className="flex-row items-center mb-4">
            <Feather name="activity" size={24} color="#2DD4BF" />
            <Text className="ml-2 font-bold text-primary-dark text-lg">AI Activity Logs</Text>
          </View>
          {logs.map((log, idx) => (
            <View key={idx} className="bg-white dark:bg-surface-dark p-4 rounded-xl mb-2 shadow-sm">
              <View className="flex-row justify-between mb-1">
                <Text className="font-bold text-text-light dark:text-text-dark">{log.action_type}</Text>
                <Text className="text-gray-400 text-xs">{new Date(log.created_at).toLocaleTimeString()}</Text>
              </View>
              <Text className="text-gray-500 text-sm">{log.profiles?.email} • {log.details}</Text>
            </View>
          ))}
          {logs.length === 0 && <Text className="text-gray-500">No recent AI activity.</Text>}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}
