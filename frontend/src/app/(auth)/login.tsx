import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View className="mb-10">
            <Text className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">Welcome Back</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400">Sign in to your MindMart account</Text>
          </View>

          <Input
            label="Email"
            placeholder="you@example.com"
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

          <View className="items-end mb-8">
            <Text 
              className="text-primary-dark font-medium"
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              Forgot Password?
            </Text>
          </View>

          <Button 
            title="Sign In" 
            onPress={signInWithEmail} 
            isLoading={loading} 
            className="mb-4"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 dark:text-gray-400">Don't have an account? </Text>
            <Text 
              className="text-primary font-bold" 
              onPress={() => router.push('/(auth)/register')}
            >
              Sign Up
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}