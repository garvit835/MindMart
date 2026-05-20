import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleResetPassword() {
    if (!email) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      Alert.alert('Request Failed', error.message);
    } else {
      Alert.alert('Success', 'Password reset instructions sent to your email.');
      router.push('/(auth)/login');
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
            <Text className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">Reset Password</Text>
            <Text className="text-base text-gray-500 dark:text-gray-400">Enter your email to receive reset instructions.</Text>
          </View>

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Button 
            title="Send Instructions" 
            onPress={handleResetPassword} 
            isLoading={loading} 
            className="mt-4 mb-6"
          />

          <Button 
            title="Back to Login" 
            onPress={() => router.push('/(auth)/login')} 
            variant="ghost"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}