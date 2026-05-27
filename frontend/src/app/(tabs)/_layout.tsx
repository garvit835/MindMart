import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColorScheme, Platform, View } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2DD4BF', // Mint/Teal
        tabBarInactiveTintColor: isDark ? '#94A3B8' : '#64748B',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0.1,
          shadowRadius: 20,
          shadowColor: '#000',
          shadowOffset: { height: 10, width: 0 },
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 20,
          right: 20,
          height: 64,
          borderRadius: 32,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-primary/10 rounded-full px-4 py-2' : ''}`}>
              <Feather name="home" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Wellness',
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-primary/10 rounded-full px-4 py-2' : ''}`}>
              <Feather name="heart" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-primary/10 rounded-full px-4 py-2' : ''}`}>
              <Feather name="shopping-bag" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-primary/10 rounded-full px-4 py-2' : ''}`}>
              <Feather name="users" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-primary/10 rounded-full px-4 py-2' : ''}`}>
              <Feather name="bar-chart-2" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'bg-primary/10 rounded-full px-4 py-2' : ''}`}>
              <Feather name="user" size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}