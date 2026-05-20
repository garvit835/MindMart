import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';

export default function SellerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else if (data?.user) {
      // Ensure they actually have a seller profile
      const { data: sellerData } = await supabase.from('sellers').select('*').eq('id', data.user.id).single();
      if (!sellerData) {
        Alert.alert('Not a Seller', 'This account does not have a registered seller profile.');
        await supabase.auth.signOut();
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
          
          <TouchableOpacity onPress={() => router.replace('/')} className="mb-6 w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center">
            <Feather name="arrow-left" size={20} color="#64748B" />
          </TouchableOpacity>

          <View className="mb-10 mt-6">
            <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Seller Hub</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400">Sign in to manage your MindMart store</Text>
          </View>

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
            title="Sign In as Seller" 
            onPress={signInWithEmail} 
            isLoading={loading} 
            className="mb-4 mt-6 bg-gray-900 dark:bg-white"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 dark:text-gray-400">Want to sell on MindMart? </Text>
            <Text 
              className="text-gray-900 dark:text-white font-bold" 
              onPress={() => router.push('/seller-app/(auth)/register')}
            >
              Open a Shop
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
