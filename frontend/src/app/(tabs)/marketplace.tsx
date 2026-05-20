import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [balance, setBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchProducts();
    fetchBalance();
  }, [selectedCategory, user]);

  const fetchProducts = async () => {
    let query = supabase
      .from('products')
      .select('id, title, price_in_mindcoins, image_url, category, seller_id')
      .eq('is_active', true);
    
    if (selectedCategory !== 'All') {
      // Lowercase category matches database records
      query = query.eq('category', selectedCategory.toLowerCase());
    }
    
    const { data } = await query.limit(12);
    if (data) setProducts(data);
  };

  const fetchBalance = async () => {
    if (user?.id) {
      const { data } = await supabase
        .from('reward_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id);
      if (data) {
        let calcBalance = 0;
        data.forEach(tx => {
          if (tx.transaction_type === 'earned') calcBalance += tx.amount;
          if (tx.transaction_type === 'spent') calcBalance -= tx.amount;
        });
        setBalance(calcBalance);
      }
    }
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        
        {/* Header */}
        <View className="mb-6 flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-text-light dark:text-text-dark mb-1">Marketplace</Text>
            <Text className="text-gray-500 text-sm">Redeem your MindCoins for sustainable goods.</Text>
          </View>
          <View className="bg-amber-100 dark:bg-amber-900/30 px-3.5 py-2 rounded-full flex-row items-center">
            <View className="w-5 h-5 rounded-full bg-amber-400 mr-1.5 items-center justify-center">
              <Text className="text-[10px] font-bold text-white">M</Text>
            </View>
            <Text className="font-bold text-amber-600 dark:text-amber-400 text-sm">{balance}</Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl px-4 h-14 mb-8 shadow-sm">
          <Feather name="search" size={20} color="#94A3B8" />
          <TextInput 
            placeholder="Search eco-friendly products..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-text-light dark:text-text-dark text-base"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories */}
        <View className="mb-8">
          <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['All', 'Snacks', 'Books', 'Eco-friendly', 'Plants', 'Local'].map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full mr-3 ${isSelected ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
                  <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View> 

        {/* Products Grid */}
        <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Trending</Text>
        <View className="flex-row flex-wrap justify-between">
          {filteredProducts.map(product => (
            <TouchableOpacity 
              key={product.id} 
              className="w-[48%] bg-white dark:bg-surface-dark rounded-2xl p-4 mb-4 shadow-sm border border-gray-50 dark:border-gray-800"
              onPress={() => router.push(`/marketplace/${product.id}`)}
            >
              <View className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-xl mb-3 overflow-hidden">
                {product.image_url ? (
                  <Image source={{ uri: product.image_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Feather name="image" size={32} color="#CBD5E1" />
                  </View>
                )}
              </View>
              <Text className="font-bold text-text-light dark:text-text-dark mb-1" numberOfLines={1}>{product.title}</Text>
              <View className="flex-row items-center">
                <View className="w-4 h-4 rounded-full bg-amber-400 mr-1 items-center justify-center">
                  <Text className="text-[8px] font-bold text-white">M</Text>
                </View>
                <Text className="font-bold text-primary-dark">{product.price_in_mindcoins}</Text>
              </View>
            </TouchableOpacity>
          ))}


          {filteredProducts.length === 0 && (
            <View className="w-full mt-10">
              <EmptyState 
                icon="shopping-bag"
                title="No Products Found"
                description={search ? `We couldn't find anything matching "${search}".` : "The marketplace is currently empty. Check back later for new eco-friendly items."}
              />
            </View>
          )}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}