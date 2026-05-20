import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';

export default function SocialFeed() {
  const user = useAuthStore(state => state.user);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'challenges'>('feed');

  // Feed State
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  // Groups & Challenges State
  const [groups, setGroups] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
    fetchGroupsAndChallenges();

    const subscription = supabase
      .channel('public:social_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_posts' }, payload => {
        if (payload.new.status === 'active') {
          setPosts(prev => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('social_posts')
      .select('*, profiles(email)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (data) setPosts(data);
  };

  const fetchGroupsAndChallenges = async () => {
    if (!user) return;
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const [gRes, cRes] = await Promise.all([
        axios.get(`${backendUrl}/api/social/groups?userId=${user.id}`),
        axios.get(`${backendUrl}/api/social/challenges?userId=${user.id}`)
      ]);
      if (gRes.data?.success) setGroups(gRes.data.groups);
      if (cRes.data?.success) setChallenges(cRes.data.challenges);
    } catch (err) {
      console.error("Error fetching social data:", err);
    }
  };

  const submitPost = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/social/post`, {
        userId: user?.id,
        content: newPostContent,
        isAnonymous: isAnonymous
      });

      if (response.data.success) {
        Alert.alert("Posted!", "Your reflection is being reviewed for safety and will appear shortly.");
        setNewPostContent('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setPosting(false);
  };

  const handleReaction = async (postId: string, reaction: string) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/social/posts/react`, {
        userId: user?.id,
        postId,
        reactionType: reaction
      });
      if (response.data.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, reactions_count: response.data.count };
          }
          return p;
        }));
      }
    } catch (error: any) {
      console.error("Reaction error:", error);
    }
  };

  const toggleGroupMembership = async (groupId: string, isJoined: boolean) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const endpoint = isJoined ? 'leave' : 'join';
      const response = await axios.post(`${backendUrl}/api/social/groups/${endpoint}`, {
        userId: user?.id,
        groupId
      });
      if (response.data.success) {
        Alert.alert("Success", isJoined ? "Left group successfully." : "Joined group successfully!");
        fetchGroupsAndChallenges();
      }
    } catch (error: any) {
      Alert.alert("Membership Error", error.message);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/social/challenges/join`, {
        userId: user?.id,
        challengeId
      });
      if (response.data.success) {
        Alert.alert("Success", "Joined challenge successfully!");
        fetchGroupsAndChallenges();
      }
    } catch (error: any) {
      Alert.alert("Challenge Error", error.message);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">Community</Text>
          <Text className="text-gray-500 text-base">A safe space for shared growth and support.</Text>
        </View>

        {/* Custom Tabs */}
        <View className="flex-row bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-8">
          {['feed', 'groups', 'challenges'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab ? 'bg-white dark:bg-surface-dark shadow-sm' : ''}`}
            >
              <Text className={`font-bold capitalize ${activeTab === tab ? 'text-primary-dark' : 'text-gray-500'}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <View>
            {/* Post Creation */}
            <View className="bg-white dark:bg-surface-dark p-6 rounded-3xl mb-8 border border-gray-100 dark:border-gray-800 shadow-sm">
              <TextInput 
                placeholder="Share a wellness reflection or gratitude..."
                placeholderTextColor="#94A3B8"
                className="text-text-light dark:text-text-dark text-base mb-4"
                multiline
                numberOfLines={3}
                value={newPostContent}
                onChangeText={setNewPostContent}
              />
              <View className="flex-row items-center justify-between mt-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                <TouchableOpacity className="flex-row items-center" onPress={() => setIsAnonymous(!isAnonymous)}>
                  <View className={`w-5 h-5 rounded border ${isAnonymous ? 'bg-primary border-primary' : 'border-gray-300'} items-center justify-center mr-2`}>
                    {isAnonymous && <Feather name="check" size={14} color="white" />}
                  </View>
                  <Text className="text-gray-500">Post Anonymously</Text>
                </TouchableOpacity>
                <Button title="Share" onPress={submitPost} isLoading={posting} className="px-6 py-2" />
              </View>
            </View>

            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Recent Reflections</Text>
            {posts.map(post => (
              <View key={post.id} className="bg-white dark:bg-surface-dark p-6 rounded-3xl mb-4 border border-gray-50 dark:border-gray-800 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center mr-3">
                    <Feather name={post.is_anonymous ? 'eye-off' : 'user'} size={20} color="#2DD4BF" />
                  </View>
                  <View>
                    <Text className="font-bold text-text-light dark:text-text-dark">
                      {post.is_anonymous ? 'Anonymous Member' : (post.profiles?.email?.split('@')[0] || 'Member')}
                    </Text>
                    <Text className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{post.content}</Text>
                <View className="flex-row items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-3">
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => handleReaction(post.id, 'support')} className="bg-secondary/10 px-3 py-1.5 rounded-full mr-2">
                      <Text className="text-secondary-dark font-medium">🙏 Support</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction(post.id, 'inspired')} className="bg-amber-100/60 dark:bg-amber-900/30 px-3 py-1.5 rounded-full mr-2">
                      <Text className="text-amber-600 font-medium">✨ Inspired</Text>
                    </TouchableOpacity>
                  </View>
                  {post.reactions_count > 0 && (
                    <Text className="text-xs text-gray-400 font-semibold">{post.reactions_count} reactions</Text>
                  )}
                </View>
              </View>
            ))}
            {posts.length === 0 && <Text className="text-gray-500 text-center py-10">No reflections yet.</Text>}
          </View>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <View>
            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Find Your Tribe</Text>
            {groups.map(g => (
              <View key={g.id} className="bg-white dark:bg-surface-dark p-6 rounded-3xl mb-4 border border-gray-50 dark:border-gray-800 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4">
                    <Feather name="users" size={24} color="#2DD4BF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-text-light dark:text-text-dark text-lg" numberOfLines={1}>{g.name}</Text>
                    <Text className="text-gray-500 text-sm mt-0.5">{g.members} members</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => toggleGroupMembership(g.id, g.isJoined)}
                  className={`px-4 py-2 rounded-full ${g.isJoined ? 'bg-gray-200 dark:bg-gray-700' : 'bg-primary'}`}
                >
                  <Text className={`font-bold ${g.isJoined ? 'text-gray-600 dark:text-gray-300' : 'text-white'}`}>
                    {g.isJoined ? 'Leave' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            {groups.length === 0 && <Text className="text-gray-500 text-center py-10">No groups available.</Text>}
          </View>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'challenges' && (
          <View>
            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Shared Growth</Text>
            {challenges.map(c => (
              <View key={c.id} className="bg-gradient-to-r from-primary to-secondary p-6 rounded-3xl mb-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="font-bold text-white text-xl flex-1 pr-4" numberOfLines={1}>{c.title}</Text>
                  <View className="bg-white/20 px-3 py-1 rounded-full">
                    <Text className="text-white font-medium text-xs">Active</Text>
                  </View>
                </View>
                <Text className="text-white/80 mb-2 font-medium">Challenge Progress: {c.progress}%</Text>
                <View className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                  <View className="h-full bg-white rounded-full" style={{ width: `${c.progress}%` }} />
                </View>
                <TouchableOpacity 
                  onPress={() => !c.isJoined && joinChallenge(c.id)}
                  disabled={c.isJoined}
                  className={`mt-4 py-3 rounded-xl items-center ${c.isJoined ? 'bg-white/40' : 'bg-white'}`}
                >
                  <Text className="font-bold text-primary-dark">
                    {c.isJoined ? 'Joined ✔' : 'Participate'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            {challenges.length === 0 && <Text className="text-gray-500 text-center py-10">No challenges available.</Text>}
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}