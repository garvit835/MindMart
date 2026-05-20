import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, title, price_in_mindcoins, image_url, category')
      .eq('is_active', true)
      .limit(10);
    
    if (data) setProducts(data);
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-light dark:text-text-dark mb-2">Marketplace</Text>
          <Text className="text-gray-500 text-base">Redeem your MindCoins for sustainable goods.</Text>
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
            {['All', 'Snacks', 'Books', 'Eco-friendly', 'Plants', 'Local'].map((cat, idx) => (
              <TouchableOpacity key={idx} className={`px-6 py-2 rounded-full mr-3 ${idx === 0 ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <Text className={`font-medium ${idx === 0 ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>{cat}</Text>
              </TouchableOpacity>
            ))}
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
            <Text className="text-gray-500 text-center w-full py-10">No products found.</Text>
          )}
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}