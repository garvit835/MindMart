import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export default function SellerDashboard() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState('');
  
  // For new product
  const [productTitle, setProductTitle] = useState('');
  const [productPrice, setProductPrice] = useState('50');
  const [productStock, setProductStock] = useState('10');

  useEffect(() => {
    if (user) fetchSeller();
  }, [user]);

  const fetchSeller = async () => {
    const { data } = await supabase.from('sellers').select('*').eq('id', user?.id).single();
    if (data) setSellerProfile(data);
    setLoading(false);
  };

  const createSellerProfile = async () => {
    if (!shopName) return;
    const { data, error } = await supabase.from('sellers').insert([{ id: user?.id, shop_name: shopName }]).select().single();
    if (error) Alert.alert('Error', error.message);
    else setSellerProfile(data);
  };

  const addProduct = async () => {
    if (!productTitle) return Alert.alert('Enter title');
    const { error } = await supabase.from('products').insert([{
      seller_id: user?.id,
      title: productTitle,
      price_in_mindcoins: parseInt(productPrice),
      stock: parseInt(productStock),
      category: 'eco-friendly',
      is_active: true
    }]);

    if (error) Alert.alert('Error', error.message);
    else {
      Alert.alert('Success', 'Product listed!');
      setProductTitle('');
    }
  };

  if (loading) return <ScreenWrapper><View className="flex-1 items-center justify-center"><Text>Loading...</Text></View></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-light dark:text-text-dark">Seller Hub</Text>
        </View>

        {!sellerProfile ? (
          <View className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mt-10">
            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-2">Become a Seller</Text>
            <Text className="text-gray-500 mb-6">List your sustainable products and earn MindCoins.</Text>
            <Input placeholder="Shop Name" value={shopName} onChangeText={setShopName} />
            <Button title="Create Shop" onPress={createSellerProfile} />
          </View>
        ) : (
          <View>
            <View className="bg-primary/10 p-6 rounded-3xl mb-8 border border-primary/20">
              <Text className="text-gray-600 dark:text-gray-400 mb-1">Welcome back,</Text>
              <Text className="text-2xl font-bold text-primary-dark">{sellerProfile.shop_name}</Text>
            </View>

            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Add New Product</Text>
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

              <Button title="List Product" onPress={addProduct} />
            </View>

            <Text className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Recent Orders</Text>
            <View className="bg-white dark:bg-surface-dark p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm items-center justify-center h-32">
               <Text className="text-gray-500">No recent orders.</Text>
            </View>
          </View>
        )}

      </ScrollView>
    </ScreenWrapper>
  );
}
