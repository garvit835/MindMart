import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

export default function SellerRegister() {
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    if (!shopName) {
      return Alert.alert('Missing Field', 'Please enter a shop name.');
    }
    
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (data?.user) {
      // Create user profile
      const { error: profileError } = await supabase.from('profiles').insert([{ 
        id: data.user.id, 
        username: `seller_${Math.floor(Math.random() * 10000)}`,
        full_name: shopName
      }]);

      if (profileError) {
        console.error('Profile Error', profileError);
      }

      // Create seller profile
      const { error: sellerError } = await supabase.from('sellers').insert([{ 
        id: data.user.id, 
        shop_name: shopName,
        is_verified: false
      }]);

      if (sellerError) {
        Alert.alert('Shop Creation Failed', sellerError.message);
      } else {
        router.replace('/seller-app/(tabs)/dashboard');
      }
    }
    setLoading(false);
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
          
          <TouchableOpacity onPress={() => router.back()} className="mb-6 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center">
            <Feather name="arrow-left" size={20} color="#64748B" />
          </TouchableOpacity>

          <View className="mb-8 mt-4">
            <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Open a Shop</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400">Join MindMart and list eco-friendly goods.</Text>
          </View>

          <Input
            label="Shop Name"
            placeholder="Green Goods Co."
            value={shopName}
            onChangeText={setShopName}
          />

          <Input
            label="Email"
            placeholder="shop@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button 
            title="Create Seller Account" 
            onPress={signUpWithEmail} 
            isLoading={loading} 
            className="mb-4 mt-6 bg-gray-900 dark:bg-white"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
