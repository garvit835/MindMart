import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

export default function SocialFeed() {
  const user = useAuthStore(state => state.user);
  const session = useAuthStore(state => state.session);
  const showToast = useToastStore(state => state.showToast);
  
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'challenges'>('feed');

  // Feed State
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Groups & Challenges State
  const [groups, setGroups] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts();
    fetchGroupsAndChallenges();

    const subscription = supabase
      .channel('public:social_posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_posts' }, payload => {
        // Only show posts that are already active (skip pending_review)
        if (payload.new.status === 'active') {
          setPosts(prev => [payload.new, ...prev]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'social_posts' }, payload => {
        // Handle moderation status changes (pending_review -> active/rejected)
        if (payload.new.status === 'active') {
          setPosts(prev => {
            const exists = prev.some(p => p.id === payload.new.id);
            if (exists) {
              // Update existing post
              return prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p);
            } else {
              // Post was just approved — add to feed
              return [payload.new, ...prev];
            }
          });
        } else if (payload.new.status === 'rejected') {
          // Remove rejected posts from feed
          setPosts(prev => prev.filter(p => p.id !== payload.new.id));
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
    if (!user || !session) return;
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const [gRes, cRes] = await Promise.all([
        axios.get(`${backendUrl}/api/social/groups`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }),
        axios.get(`${backendUrl}/api/social/challenges`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
      ]);
      if (gRes.data?.success) setGroups(gRes.data.groups);
      if (cRes.data?.success) setChallenges(cRes.data.challenges);
    } catch (err) {
      console.error("Error fetching social data:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPosts(),
      fetchGroupsAndChallenges()
    ]);
    setRefreshing(false);
    showToast('Feed refreshed ✨', 'success');
  };

  const submitPost = async () => {
    if (!newPostContent.trim() || !session) return;
    setPosting(true);

    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/social/post`, {
        content: newPostContent,
        isAnonymous: isAnonymous
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.data.success) {
        showToast('Reflection submitted for safety review!', 'success');
        setNewPostContent('');
      }
    } catch (error: any) {
      showToast(error.message || 'Error submitting post', 'error');
    }
    setPosting(false);
  };

  const handleReaction = async (postId: string, reaction: string) => {
    if (!session) return;
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/social/posts/react`, {
        postId,
        reactionType: reaction
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (response.data.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, reactions_count: response.data.count };
          }
          return p;
        }));
        showToast(response.data.action === 'added' ? 'Reaction added!' : 'Reaction removed.', 'success');
      }
    } catch (error: any) {
      console.error("Reaction error:", error);
    }
  };

  const toggleGroupMembership = async (groupId: string, isJoined: boolean) => {
    if (!session) return;
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const endpoint = isJoined ? 'leave' : 'join';
      const response = await axios.post(`${backendUrl}/api/social/groups/${endpoint}`, {
        groupId
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (response.data.success) {
        showToast(isJoined ? "Left group successfully." : "Joined group successfully! 🎉", 'success');
        fetchGroupsAndChallenges();
      }
    } catch (error: any) {
      showToast(error.message || "Membership Error", 'error');
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!session) return;
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/social/challenges/join`, {
        challengeId
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (response.data.success) {
        showToast("Joined challenge successfully! 🚀", 'success');
        fetchGroupsAndChallenges();
      }
    } catch (error: any) {
      showToast(error.message || "Challenge Error", 'error');
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2DD4BF"]} tintColor="#2DD4BF" />
        }
      >
        
        <View className="mb-6">
          <Text className="text-3xl font-extrabold text-text-light dark:text-text-dark mb-2">Community</Text>
          <Text className="text-gray-400 text-sm font-medium">A shared growth space to connect and inspire.</Text>
        </View>

        {/* Custom Tabs */}
        <View className="flex-row bg-gray-100/80 dark:bg-gray-800 p-1.5 rounded-2xl mb-8 border border-gray-200/30">
          {['feed', 'groups', 'challenges'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 rounded-xl items-center ${activeTab === tab ? 'bg-white dark:bg-surface-dark shadow-sm' : ''}`}
            >
              <Text className={`font-extrabold text-xs tracking-wide uppercase ${activeTab === tab ? 'text-primary' : 'text-gray-400'}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <View>
            {/* Post Creation */}
            <View className="bg-white/70 dark:bg-surface-dark/70 p-6 rounded-[28px] mb-8 border border-white/20 dark:border-gray-800 shadow-sm">
              <TextInput 
                placeholder="Share a wellness reflection or gratitude..."
                placeholderTextColor="#94A3B8"
                className="text-text-light dark:text-text-dark text-base mb-4 font-medium"
                multiline
                numberOfLines={3}
                value={newPostContent}
                onChangeText={setNewPostContent}
              />
              <View className="flex-row items-center justify-between mt-2 border-t border-gray-50 dark:border-gray-800 pt-4">
                <TouchableOpacity className="flex-row items-center" onPress={() => setIsAnonymous(!isAnonymous)}>
                  <View className={`w-5 h-5 rounded-[6px] border ${isAnonymous ? 'bg-primary border-primary' : 'border-gray-300'} items-center justify-center mr-2`}>
                    {isAnonymous && <Feather name="check" size={14} color="white" />}
                  </View>
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Post Anonymously</Text>
                </TouchableOpacity>
                <Button title="Share" onPress={submitPost} isLoading={posting} className="px-6 py-2.5 rounded-xl" />
              </View>
            </View>

            <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">Recent Reflections</Text>
            {posts.map(post => (
              <View key={post.id} className="bg-white/70 dark:bg-surface-dark/70 p-6 rounded-[28px] mb-4 border border-white/20 dark:border-gray-800 shadow-sm">
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 bg-primary/10 rounded-2xl items-center justify-center mr-3 border border-primary/20">
                    <Feather name={post.is_anonymous ? 'eye-off' : 'user'} size={18} color="#2DD4BF" />
                  </View>
                  <View>
                    <Text className="font-extrabold text-text-light dark:text-text-dark text-sm">
                      {post.is_anonymous ? 'Anonymous Member' : (post.profiles?.email?.split('@')[0] || 'Member')}
                    </Text>
                    <Text className="text-[10px] text-gray-400 font-bold tracking-wider mt-0.5">{new Date(post.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <Text className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4 font-medium text-sm">{post.content}</Text>
                <View className="flex-row items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => handleReaction(post.id, 'support')} className="bg-secondary/15 px-3 py-1.5 rounded-xl mr-2">
                      <Text className="text-secondary-dark font-extrabold text-xs">🙏 Support</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleReaction(post.id, 'inspired')} className="bg-amber-100/60 dark:bg-amber-900/15 px-3 py-1.5 rounded-xl mr-2">
                      <Text className="text-amber-600 dark:text-amber-400 font-extrabold text-xs">✨ Inspired</Text>
                    </TouchableOpacity>
                  </View>
                  {post.reactions_count > 0 && (
                    <Text className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{post.reactions_count} reactions</Text>
                  )}
                </View>
              </View>
            ))}
            {posts.length === 0 && <Text className="text-gray-450 text-center py-10 font-bold text-sm">No reflections yet.</Text>}
          </View>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <View>
            <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">Find Your Tribe</Text>
            {groups.map(g => (
              <View key={g.id} className="bg-white/70 dark:bg-surface-dark/70 p-6 rounded-[28px] mb-4 border border-white/20 dark:border-gray-800 shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 pr-4">
                  <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center mr-4 border border-primary/20">
                    <Feather name="users" size={22} color="#2DD4BF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-extrabold text-text-light dark:text-text-dark text-base" numberOfLines={1}>{g.name}</Text>
                    <Text className="text-gray-450 text-xs font-semibold mt-0.5">{g.members} members</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => toggleGroupMembership(g.id, g.isJoined)}
                  className={`px-5 py-2.5 rounded-2xl shadow-sm ${g.isJoined ? 'bg-gray-100 dark:bg-gray-800 border border-gray-250/20' : 'bg-primary'}`}
                >
                  <Text className={`font-extrabold text-xs ${g.isJoined ? 'text-gray-500' : 'text-white'}`}>
                    {g.isJoined ? 'Leave' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
            {groups.length === 0 && <Text className="text-gray-450 text-center py-10 font-bold text-sm">No groups available.</Text>}
          </View>
        )}

        {/* CHALLENGES TAB */}
        {activeTab === 'challenges' && (
          <View>
            <Text className="text-lg font-extrabold text-text-light dark:text-text-dark mb-4">Shared Growth</Text>
            {challenges.map(c => (
              <View key={c.id} className="rounded-[32px] overflow-hidden mb-4 shadow-sm">
                <LinearGradient
                  colors={['#2DD4BF', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-6"
                >
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="font-black text-white text-lg flex-1 pr-4" numberOfLines={1}>{c.title}</Text>
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                      <Text className="text-white font-bold text-[10px] uppercase tracking-wider">Active</Text>
                    </View>
                  </View>
                  <Text className="text-white/90 mb-2 font-bold text-xs">Challenge Progress: {c.progress}%</Text>
                  <View className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden">
                    <View className="h-full bg-white rounded-full" style={{ width: `${c.progress}%` }} />
                  </View>
                  <TouchableOpacity 
                    onPress={() => !c.isJoined && joinChallenge(c.id)}
                    disabled={c.isJoined}
                    className={`mt-5 py-3 rounded-2xl items-center ${c.isJoined ? 'bg-white/30' : 'bg-white'}`}
                  >
                    <Text className="font-extrabold text-primary-dark text-xs uppercase tracking-wider">
                      {c.isJoined ? 'Joined ✔' : 'Participate'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))}
            {challenges.length === 0 && <Text className="text-gray-450 text-center py-10 font-bold text-sm">No challenges available.</Text>}
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}