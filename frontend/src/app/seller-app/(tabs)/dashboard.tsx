import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

export default function SellerDashboard() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  useEffect(() => {
    if (user) fetchSeller();
  }, [user]);

  const fetchSeller = async () => {
    const { data } = await supabase.from('sellers').select('*').eq('id', user?.id).single();
    if (data) setSellerProfile(data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut();
    router.replace('/');
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Seller Hub</Text>
          <TouchableOpacity onPress={handleSignOut} className="p-2">
            <Feather name="log-out" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {sellerProfile && (
          <View className="bg-primary/10 p-6 rounded-3xl mb-8 border border-primary/20">
            <Text className="text-gray-600 dark:text-gray-400 mb-1">Welcome back,</Text>
            <Text className="text-2xl font-bold text-primary-dark">{sellerProfile.shop_name}</Text>
          </View>
        )}

        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Orders</Text>
        <View className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm items-center justify-center h-48 mb-8">
           <Feather name="inbox" size={32} color="#CBD5E1" className="mb-3" />
           <Text className="text-gray-500">No recent orders yet.</Text>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}
