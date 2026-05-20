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
      
      Alert.alert('Success', 'Check your email to verify your account!');
      router.replace('/(auth)/login');
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