import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import {
  ChevronRight,
  Settings,
  BookOpen,
  ShoppingBag,
  Calendar,
  Star,
} from 'react-native-feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../src/components/Text';
import { guidesAPI } from '../src/lib/api';
import { getSettings, UserSettings } from '../src/lib/storage';
import { getUserId } from '../src/lib/userid';

interface ProfileStats {
  guides: number;
  recipes: number;
  mealPlans: number;
  reminders: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProfileStats>({
    guides: 0,
    recipes: 0,
    mealPlans: 0,
    reminders: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const id = await getUserId();
      setUserId(id);

      const loadedSettings = await getSettings();
      setSettings(loadedSettings);

      // Load stats
      if (id) {
        // Use safe version that never throws or logs errors
        const statsData = await guidesAPI.getStatsSafe(id);
        
        // Count cached recipes (also safe)
        let totalRecipes = 0;
        try {
          const { countCachedRecipes } = await import('../src/lib/recipeCache');
          totalRecipes = await countCachedRecipes();
        } catch {
          // Silently fail
        }
        
        setStats({
          guides: statsData?.total || 0,
          recipes: totalRecipes || 0,
          mealPlans: 0, // TODO: Add meal planner API
          reminders: 0, // TODO: Add reminders API
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (id: string | null): string => {
    if (!id) return 'U';
    // Use first character of user ID as initial
    return id.charAt(0).toUpperCase();
  };

  if (loading || !settings) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#313131" />
          <Text className="mt-4 space-regular" style={{ color: '#313131' }}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="px-4 pt-10 pb-8">
          {/* Header Section */}
          <View className="items-center mb-8">
            {/* Avatar */}
            <View className="w-24 h-24 rounded-full bg-brand-green items-center justify-center mb-4 ">
              <Text className="text-4xl space-bold" style={{ color: '#313131' }}>
                {getInitials(userId)} 
              </Text>
            </View>
            
            {/* User Info */}
            <Text className="text-2xl space-bold mb-2" style={{ color: '#313131' }}>
              Welcome Back!
            </Text>
            <Text className="text-sm space-regular mb-4" style={{ color: '#313131' }}>
              {userId?.substring(0, 12)}...
            </Text>

            {/* Subscription Badge */}
            {settings.subscriptionTier && settings.subscriptionTier !== 'free' && (
              <View className="px-4 py-2 rounded-full bg-brand-green">
                <View className="flex-row items-center gap-2">
                  <Star width={14} height={14} color="#313131" fill="#313131" />
                  <Text className="text-xs space-semibold capitalize" style={{ color: '#313131' }}>
                    {settings.subscriptionTier} Plan
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-3 mb-6">
            {/* <View className="flex-1 bg-white rounded-3xl p-4 ">
              <Text className="text-2xl space-bold mb-1" style={{ color: '#313131' }}>
                {stats.guides}
              </Text>
              <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                Guides
              </Text>
            </View> */}
            <View className="flex-1 bg-brand-pink rounded-3xl p-4 ">
              <Text className="text-2xl space-bold mb-1" style={{ color: '#313131' }}>
                {stats.recipes}
              </Text>
              <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                Recipes
              </Text>
            </View>
            <View className="flex-1 bg-brand-pink rounded-3xl p-4 ">
              <Text className="text-2xl space-bold mb-1" style={{ color: '#313131' }}>
                {stats.mealPlans}
              </Text>
              <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                Meal Plans
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
              Quick Actions
            </Text>
            <View className="bg-white rounded-3xl p-4 ">
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => router.push('/settings')}
                  className="flex-row items-center justify-between py-3 px-2 rounded-3xl bg-brand-cream"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <Settings width={20} height={20} color="#313131" />
                    <Text className="space-medium" style={{ color: '#313131' }}>
                      Settings
                    </Text>
                  </View>
                  <ChevronRight width={18} height={18} color="#313131" />
                </TouchableOpacity>


              </View>
            </View>
          </View>

    

          {/* Account Info */}
          <View className="mb-6">
            <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
              Account
            </Text>
            <View className="bg-white rounded-3xl p-4 ">
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm space-regular" style={{ color: '#313131' }}>User ID</Text>
                  <Text className="text-sm space-regular font-mono" numberOfLines={1} style={{ color: '#313131' }}>
                    {userId?.substring(0, 20)}...
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm space-regular" style={{ color: '#313131' }}>Member Since</Text>
                  <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                    {settings.createdAt
                      ? new Date(settings.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Navigation Links */}
          <View className="mb-6">
            <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
              Navigate
            </Text>
            <View className="bg-white rounded-3xl p-4 ">
              <View className="gap-2">
                <TouchableOpacity
                  onPress={() => router.push('/guides')}
                  className="flex-row items-center justify-between py-3 px-2 rounded-3xl bg-brand-cream"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <BookOpen width={20} height={20} color="#313131" />
                    <Text className="space-medium" style={{ color: '#313131' }}>
                      My Guides
                    </Text>
                  </View>
                  <ChevronRight width={18} height={18} color="#313131" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/meal-planner')}
                  className="flex-row items-center justify-between py-3 px-2 rounded-3xl bg-brand-cream"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <Calendar width={20} height={20} color="#313131" />
                    <Text className="space-medium" style={{ color: '#313131' }}>
                      Meal Planner
                    </Text>
                  </View>
                  <ChevronRight width={18} height={18} color="#313131" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/shopping')}
                  className="flex-row items-center justify-between py-3 px-2 rounded-3xl bg-brand-cream"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <ShoppingBag width={20} height={20} color="#313131" />
                    <Text className="space-medium" style={{ color: '#313131' }}>
                      Shopping Lists
                    </Text>
                  </View>
                  <ChevronRight width={18} height={18} color="#313131" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
