import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      setProduct(data);
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('reward_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id);
      if (data) {
        let calcBalance = 0;
        data.forEach(tx => {
          if (tx.transaction_type === 'earned') calcBalance += tx.amount;
          if (tx.transaction_type === 'spent') calcBalance -= tx.amount;
        });
        setBalance(calcBalance);
      }
    };
    fetchBalance();
  }, [user]);

  const handleCheckout = async () => {
    if (!user || !product) return;
    
    if (balance < product.price_in_mindcoins) {
      Alert.alert("Insufficient Balance", `You need ${product.price_in_mindcoins - balance} more MindCoins to redeem this.`);
      return;
    }

    setCheckingOut(true);

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/marketplace/checkout`, {
        userId: user.id,
        items: [{
          productId: product.id,
          sellerId: product.seller_id,
          quantity: 1,
          priceInMindCoins: product.price_in_mindcoins
        }]
      });

      if (response.data.success) {
        Alert.alert(
          "Redemption Successful! 🎉", 
          `Your order has been placed. New Balance: ${response.data.newBalance} MindCoins`,
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      Alert.alert("Checkout Failed", msg);
    }
    setCheckingOut(false);
  };

  if (loading) return <ScreenWrapper><ActivityIndicator className="mt-20" size="large" color="#2DD4BF" /></ScreenWrapper>;
  if (!product) return <ScreenWrapper><Text className="p-10 text-center">Product not found.</Text></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Header/Back */}
        <View className="px-6 py-4 flex-row justify-between items-center z-10">
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center">
            <Feather name="arrow-left" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View className="w-full aspect-square bg-gray-100 dark:bg-gray-800 -mt-16 pt-16 rounded-b-[40px] items-center justify-center overflow-hidden">
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Feather name="image" size={64} color="#CBD5E1" />
          )}
        </View>

        {/* Details */}
        <View className="p-6">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-3xl font-bold text-text-light dark:text-text-dark flex-1 mr-4">{product.title}</Text>
            <View className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1.5 rounded-full flex-row items-center">
              <View className="w-4 h-4 rounded-full bg-amber-400 mr-1.5 items-center justify-center">
                <Text className="text-[8px] font-bold text-white">M</Text>
              </View>
              <Text className="font-bold text-amber-600 dark:text-amber-400">{product.price_in_mindcoins}</Text>
            </View>
          </View>

          <Text className="text-gray-500 mb-6 font-medium">{product.category}</Text>

          <Text className="text-lg font-bold text-text-light dark:text-text-dark mb-2">Description</Text>
          <Text className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
            {product.description || 'This eco-friendly product supports a sustainable lifestyle.'}
          </Text>

          <View className="flex-row items-center mb-8 bg-gray-50 dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Feather name="package" size={20} color="#2DD4BF" />
            <Text className="ml-3 font-medium text-text-light dark:text-text-dark">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Floating Checkout Button */}
      <View className="absolute bottom-0 w-full p-6 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800">
        <Button 
          title={balance < product.price_in_mindcoins ? "Insufficient Coins" : "Redeem with MindCoins"} 
          onPress={handleCheckout} 
          isLoading={checkingOut}
          disabled={product.stock <= 0 || balance < product.price_in_mindcoins}
        />
      </View>
    </ScreenWrapper>
  );
}
