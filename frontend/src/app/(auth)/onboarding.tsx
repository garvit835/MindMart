import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';

const ONBOARDING_STEPS = [
  {
    title: "Welcome to MindMart",
    description: "Your safe space for emotional growth. We use AI to understand your moods and build adaptive wellness routines tailored just for you.",
    icon: "activity",
    color: "#2DD4BF"
  },
  {
    title: "Earn Real Rewards",
    description: "Consistency pays off. Complete your daily wellness tasks to earn MindCoins, which you can spend in our eco-friendly marketplace.",
    icon: "shopping-bag",
    color: "#F59E0B"
  },
  {
    title: "Find Your Tribe",
    description: "Join wellness groups, participate in shared challenges, and share gratitude in our AI-moderated, toxic-free social community.",
    icon: "heart",
    color: "#818CF8"
  }
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const current = ONBOARDING_STEPS[step];

  return (
    <ScreenWrapper>
      <View className="flex-1 justify-between px-6 py-12">
        
        {/* Skip button */}
        <View className="items-end">
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Text className="text-gray-400 font-medium p-2">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="items-center justify-center flex-1">
          <View 
            className="w-32 h-32 rounded-full items-center justify-center mb-10 shadow-lg"
            style={{ backgroundColor: `${current.color}20` }}
          >
            <Feather name={current.icon as any} size={64} color={current.color} />
          </View>
          
          <Text className="text-3xl font-extrabold text-text-light dark:text-text-dark text-center mb-4">
            {current.title}
          </Text>
          
          <Text className="text-gray-500 text-center text-lg leading-relaxed px-4">
            {current.description}
          </Text>
        </View>

        {/* Footer Navigation */}
        <View className="items-center pb-8">
          {/* Pagination dots */}
          <View className="flex-row mb-10 space-x-2">
            {ONBOARDING_STEPS.map((_, idx) => (
              <View 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === step ? 'w-8 bg-primary' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} 
              />
            ))}
          </View>

          <Button 
            title={step === ONBOARDING_STEPS.length - 1 ? "Start My Journey" : "Continue"} 
            onPress={handleNext}
            className="w-full"
          />
        </View>

      </View>
    </ScreenWrapper>
  );
}
