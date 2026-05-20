import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signUpWithEmail() {
    if (!username || !email || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // In a full implementation, we'd wait for trigger or insert username into profiles here.
      // But since we have RLS on profiles to allow users to insert their own profile:
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: data.user.id, username }
      ]);

      if (profileError) {
        console.error('Profile creation error:', profileError.message);
      }

      // Add a dynamic 100 MindCoin welcome bonus transaction
      const { error: welcomeTxError } = await supabase.from('reward_transactions').insert([
        {
          user_id: data.user.id,
          amount: 100,
          transaction_type: 'earned',
          description: 'Welcome Bonus 🌿'
        }
      ]);

      if (welcomeTxError) {
        console.error('Welcome bonus creation error:', welcomeTxError.message);
      }
      
      Alert.alert('Success', 'Account created successfully! Welcome to MindMart.');
      router.replace('/(auth)/onboarding');
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
            <Text className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">Join MindMart</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400">Start your mental wellness journey</Text>
          </View>

          <Input
            label="Username"
            placeholder="wellness_guru"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

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

          <Button 
            title="Create Account" 
            onPress={signUpWithEmail} 
            isLoading={loading} 
            className="mt-4 mb-4"
          />

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-500 dark:text-gray-400">Already have an account? </Text>
            <Text 
              className="text-primary font-bold" 
              onPress={() => router.push('/(auth)/login')}
            >
              Sign In
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}