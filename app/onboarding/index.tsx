import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import { TouchableOpacity, View, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { Text } from '@/src/components/Text';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

const onboardingScreens = [
  {
    id: 1,
    title: 'Cook',
    subtitle: [{ text: 'Cook', color: '#b3daff' }, { text: 'Smarter', color: '#3B82F6' }, { text: 'Faster', color: '#A855F7' }, { text: 'Easier', color: '#F97316' }],
    description: 'Quick & easy lunch recipes, ready in under 30 minutes',
    image: require("../../assets/images/icons/chefbg.png")
  },
  {
    id: 2,
    title: 'Plan',
    subtitle: [{ text: 'Plan', color: '#A855F7' }, { text: 'Your', color: '#3B82F6' }, { text: 'Meals', color: '#F97316' }],
    description: 'Organize your weekly meal plan and never wonder what to cook',
    image: require("../../assets/images/icons/tasting.png")
  },
  {
    id: 3,
    title: 'Discover',
    subtitle: [{ text: 'Discover', color: '#F97316' }, { text: 'New', color: '#3B82F6' }, { text: 'Recipes', color: '#A855F7' }],
    description: 'Explore thousands of recipes and save your favorites',
    image: require("../../assets/images/icons/recipe.png")
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = async () => {
    if (currentScreen < onboardingScreens.length - 1) {
      const nextScreen = currentScreen + 1;
      setCurrentScreen(nextScreen);
      scrollViewRef.current?.scrollTo({
        x: nextScreen * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      // Mark onboarding as completed
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      // Navigate to main app
      router.replace('/');
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentScreen && index >= 0 && index < onboardingScreens.length) {
      setCurrentScreen(index);
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]} style={{ backgroundColor: '#F6FBDE' }}>
      <View className="flex-1">
        {/* Scrollable Screens */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          className="flex-1"
        >
          {onboardingScreens.map((screen) => (
            <View key={screen.id} style={{ width: SCREEN_WIDTH }} className="flex-1">
              {/* Kitchen Illustration Area */}
              <View className="flex-1 items-center justify-center">
                <View className="flex-1 w-full mb-8 items-center justify-center">
                  <Image
                    source={screen.image}
                    contentFit="cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                </View>

                {/* Colorful Text Blocks */}
                <View className="flex-row justify-center items-center mb-4 left-5">
                  {screen.subtitle.map((subtitle, index) => (
                    <View
                      key={index}
                      className="border-2 border-[#F6FBDE] rounded-full px-6 py-3 z-10"
                      style={{
                        backgroundColor: subtitle.color,
                        position: 'relative',
                        left: index === 0 ? 0 : index * -10,
                        transform: index % 2 === 0 ? `rotate(${index * 2}deg)` : `rotate(${index * -2}deg)`,
                        zIndex: screen.subtitle.length - index, // Higher index on top
                      }}
                    >
                      <Text className="text-2xl font-medium space-medium">{subtitle.text}</Text>
                    </View>
                  ))}
                </View>

                {/* Description */}
                <Text className="text-center text-lg px-8 mb-8 space-regular" style={{ color: '#313131' }}>
                  {screen.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Navigation */}
        <View className="px-6 pb-8 flex-row items-center justify-between">
          {/* Carousel Dots */}
          <View className="flex-row items-center">
            {onboardingScreens.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full mx-1 ${index === currentScreen ? 'w-8' : 'w-2'}`}
                style={{
                  backgroundColor: index === currentScreen ? '#313131' : '#31313180',
                }}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="rounded-full py-3 px-6 items-center"
            style={{ backgroundColor: '#313131' }}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold space-semibold" style={{ color: '#FFFFFF' }}>
              {currentScreen === onboardingScreens.length - 1 ? "Let's go!" : "next →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
