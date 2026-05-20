import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

export default function SellerProducts() {
  const { user } = useAuthStore();
  
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('50');
  const [productStock, setProductStock] = useState('10');
  const [loading, setLoading] = useState(false);

  const addProduct = async () => {
    if (!productTitle) return Alert.alert('Error', 'Please enter a product title');
    setLoading(true);

    const { error } = await supabase.from('products').insert([{
      seller_id: user?.id,
      title: productTitle,
      price: 0,
      price_in_mindcoins: parseInt(productPrice) || 0,
      stock: parseInt(productStock) || 0,
      category: 'eco-friendly',
      is_active: true
    }]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Product listed successfully!');
      setProductTitle('');
      setProductPrice('50');
      setProductStock('10');
    }
    setLoading(false);
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Products</Text>

        <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">List New Product</Text>
        <View className="bg-white dark:bg-surface-dark p-6 rounded-3xl mb-8 border border-gray-100 dark:border-gray-800 shadow-sm">
          <Input placeholder="Product Title" value={productTitle} onChangeText={setProductTitle} />
          
          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <Text className="text-xs text-gray-500 mb-1 ml-1">Price (MindCoins)</Text>
              <Input placeholder="50" value={productPrice} onChangeText={setProductPrice} keyboardType="numeric" />
            </View>
            <View className="w-[48%]">
              <Text className="text-xs text-gray-500 mb-1 ml-1">Stock Amount</Text>
              <Input placeholder="10" value={productStock} onChangeText={setProductStock} keyboardType="numeric" />
            </View>
          </View>
          
          <TouchableOpacity className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 items-center justify-center mb-6 h-32 bg-gray-50 dark:bg-gray-800/50">
            <Feather name="upload-cloud" size={24} color="#94A3B8" />
            <Text className="text-gray-400 mt-2 font-medium">Tap to upload image</Text>
            <Text className="text-xs text-gray-400 mt-1">(Requires Supabase Storage)</Text>
          </TouchableOpacity>

          <Button title="List Product" onPress={addProduct} isLoading={loading} />
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}
