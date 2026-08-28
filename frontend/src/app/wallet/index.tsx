import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LinearGradient } from 'expo-linear-gradient';

export default function WalletDashboard() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    const { data } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data);
      let calcBalance = 0;
      data.forEach(tx => {
        if (tx.transaction_type === 'earned') calcBalance += tx.amount;
        if (tx.transaction_type === 'spent') calcBalance -= tx.amount;
      });
      setBalance(calcBalance);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-light dark:text-text-dark">Wallet</Text>
        </View>

        {/* Balance Card */}
        <View className="rounded-3xl overflow-hidden mb-8 shadow-sm">
          <LinearGradient
            colors={['#2DD4BF', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-8"
          >
            <Text className="text-white/80 font-medium mb-2">Available MindCoins</Text>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-amber-400 mr-3 items-center justify-center border-2 border-white/20">
                <Text className="text-sm font-bold text-white">M</Text>
              </View>
              <Text className="text-5xl font-bold text-white">{balance}</Text>
            </View>
          </LinearGradient>
        </View>

        <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Transaction History</Text>
        
        {transactions.map((tx) => (
          <View key={tx.id} className="bg-white dark:bg-surface-dark p-4 rounded-2xl mb-3 flex-row items-center justify-between border border-gray-100 dark:border-gray-800">
            <View className="flex-row items-center flex-1 pr-4">
              <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${tx.transaction_type === 'earned' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <Feather name={tx.transaction_type === 'earned' ? 'arrow-down-left' : 'arrow-up-right'} size={20} color={tx.transaction_type === 'earned' ? '#10B981' : '#EF4444'} />
              </View>
              <View>
                <Text className="font-bold text-text-light dark:text-text-dark">{tx.description || (tx.transaction_type === 'earned' ? 'Reward' : 'Purchase')}</Text>
                <Text className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
            <Text className={`font-bold text-lg ${tx.transaction_type === 'earned' ? 'text-green-500' : 'text-red-500'}`}>
              {tx.transaction_type === 'earned' ? '+' : '-'}{tx.amount}
            </Text>
          </View>
        ))}

        {transactions.length === 0 && (
          <Text className="text-gray-500 text-center mt-10">No transactions yet. Complete wellness tasks to earn MindCoins!</Text>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}
