import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

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
            <Text className="text-5xl font-bold text-text-light mb-3 tracking-tight font-bold">MindMart</Text>
            <Text className="text-lg text-text-muted font-medium">Your personal emotional wellness journey begins here.</Text>
          </View>

          <View className="bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50">
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

            <View className="items-end mb-8 mt-2">
              <Text 
                className="text-primary-dark font-semibold"
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                Forgot Password?
              </Text>
            </View>

            <Button 
              title="Sign In" 
              onPress={signInWithEmail} 
              isLoading={loading} 
              className="mb-4 rounded-2xl h-14"
            />

            <View className="flex-row justify-center mt-6">
              <Text className="text-text-muted font-medium">Don't have an account? </Text>
              <Text 
                className="text-primary-dark font-bold" 
                onPress={() => router.push('/(auth)/register')}
              >
                Sign Up
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