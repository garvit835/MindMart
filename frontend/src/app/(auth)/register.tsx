import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

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
      const { error: profileError } = await supabase.from('profiles').insert([
        { id: data.user.id, username }
      ]);

      if (profileError) {
        console.error('Profile creation error:', profileError.message);
      }

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
    <View style={styles.container}>
      <LinearGradient
        colors={['#CCFBF1', '#F8FAFC', '#E0E7FF']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 32 }}>
          <View className="mb-12">
            <Text className="text-5xl font-bold text-text-light mb-3 tracking-tight font-bold">Join MindMart</Text>
            <Text className="text-lg text-text-muted font-medium">Start your mental wellness journey</Text>
          </View>

          <View className="bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50">
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
              className="mt-6 mb-4 rounded-2xl h-14"
            />

            <View className="flex-row justify-center mt-4">
              <Text className="text-text-muted font-medium">Already have an account? </Text>
              <Text 
                className="text-primary-dark font-bold" 
                onPress={() => router.push('/(auth)/login')}
              >
                Sign In
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});