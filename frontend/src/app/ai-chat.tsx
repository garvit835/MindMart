import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'mindmart_chat_history';

export default function AiChat() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const session = useAuthStore(state => state.session);
  const showToast = useToastStore(state => state.showToast);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Mindy, your AI wellness companion. I'm here to support you, listen when you need an ear, or help you find quiet moments. How are you feeling today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);

        if (storedData) {
          const parsed = JSON.parse(storedData);
          const formatted = parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(formatted);
        }
      } catch (e) {
        console.error('Error loading chat history:', e);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const persistMessages = async (updatedMessages: Message[]) => {
    try {
      const serialized = JSON.stringify(updatedMessages);
      await AsyncStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.error('Error saving chat history:', e);
    }
  };

  const clearChat = async () => {
    const initialWelcome: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Mindy, your AI wellness companion. I'm here to support you, listen when you need an ear, or help you find quiet moments. How are you feeling today?",
      timestamp: new Date()
    };
    setMessages([initialWelcome]);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      showToast('Chat history cleared 💬', 'info');
    } catch (e) {
      console.error('Error clearing chat history:', e);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending || !user || !session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    persistMessages(newMessages);
    setInputText('');
    setSending(true);

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      const chatHistory = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await axios.post(`${backendUrl}/api/ai/chat`, {
        messages: chatHistory
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.data?.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        };
        const finalMessages = [...newMessages, botMessage];
        setMessages(finalMessages);
        persistMessages(finalMessages);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      showToast('Failed to connect to companion server.', 'error');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! I encountered an error connecting to my wellness server. Please try again in a moment.",
        timestamp: new Date()
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      persistMessages(finalMessages);
    }
    setSending(false);
  };

  if (loadingHistory) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#2DD4BF" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View className="px-6 py-4 flex-row items-center border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Feather name="arrow-left" size={24} color="#64748B" />
            </TouchableOpacity>
            
            <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
              <Feather name="message-circle" size={22} color="#2DD4BF" />
            </View>
            
            <View className="flex-1">
              <Text className="text-lg font-bold text-text-light dark:text-text-dark">Mindy</Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                <Text className="text-gray-400 text-xs font-medium">Companion AI</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity onPress={clearChat} className="p-2">
            <Feather name="trash-2" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 bg-gray-50/50 dark:bg-background-dark/20 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2 self-end">
                    <Feather name="smile" size={16} color="#2DD4BF" />
                  </View>
                )}
                
                <View
                  className={`max-w-[75%] p-4 rounded-3xl ${
                    isUser
                      ? 'bg-primary rounded-tr-none'
                      : 'bg-white dark:bg-surface-dark rounded-tl-none border border-gray-100 dark:border-gray-800'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Text
                    className={`text-base leading-relaxed ${
                      isUser ? 'text-white' : 'text-text-light dark:text-text-dark'
                    }`}
                  >
                    {msg.content}
                  </Text>
                  
                  <Text
                    className={`text-[9px] mt-1.5 text-right ${
                      isUser ? 'text-white/60' : 'text-gray-400'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })}
          
          {sending && (
            <View className="flex-row mb-4 justify-start">
              <View className="w-8 h-8 bg-primary/20 rounded-full items-center justify-center mr-2 self-end">
                <Feather name="smile" size={16} color="#2DD4BF" />
              </View>
              <View className="bg-white dark:bg-surface-dark p-4 rounded-3xl rounded-tl-none border border-gray-100 dark:border-gray-800 flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#2DD4BF" className="mr-2" />
                <Text className="text-gray-400 text-sm">Mindy is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View className="px-6 py-4 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 flex-row items-center">
          <TextInput
            placeholder="Type a supportive chat..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            multiline
            style={{ maxHeight: 100 }}
            className="flex-1 bg-gray-50 dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 text-text-light dark:text-text-dark text-base mr-3"
          />
          
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            className={`w-12 h-12 rounded-2xl items-center justify-center ${
              inputText.trim() && !sending ? 'bg-primary' : 'bg-gray-100 dark:bg-surface-dark'
            }`}
          >
            <Feather
              name="send"
              size={20}
              color={inputText.trim() && !sending ? 'white' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
