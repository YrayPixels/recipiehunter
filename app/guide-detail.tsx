import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { guidesAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';

interface Guide {
  id: string;
  title: string;
  summary?: string;
  ingredients?: string[];
  steps?: string[];
  duration?: string;
  servings?: string;
  difficulty?: string;
  tips?: string[];
  type: string;
  category: string;
  created_at: string;
  image_url?: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

export default function GuideDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadGuide();
    }
  }, [id]);

  const loadGuide = async () => {
    try {
      setLoading(true);
      const data = await guidesAPI.getById(id);
      setGuide(data);
    } catch (error) {
      console.error('Error loading guide:', error);
      Alert.alert('Error', 'Failed to load guide');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    Alert.alert(
      'Delete Guide',
      'Are you sure you want to delete this guide?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await guidesAPI.delete(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete guide');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4E95A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!guide) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: '#313131' }}>Recipe not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
      <View className="flex-1">
        {/* Header with Back and Heart */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text className="text-2xl" style={{ color: '#313131' }}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Text className="text-2xl" style={{ color: '#313131' }}>♡</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Recipe Title with Calories */}
          <View className="px-4 mb-4">
            <Text className="text-3xl font-bold mb-1" style={{ color: '#313131' }}>
              {guide.title}
              {guide.calories && `, ${guide.calories} Kcal`}
            </Text>
          </View>

          {/* Hero Image */}
          <View className="w-full h-64 mb-4">
            {guide.image_url ? (
              <Image
                source={{ uri: guide.image_url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center" style={{ backgroundColor: '#F6FBDE' }}>
                <Text className="text-8xl">🍜</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {guide.summary && (
            <View className="px-4 mb-6">
              <Text className="text-base leading-6" style={{ color: '#313131' }}>
                {guide.summary}
              </Text>
            </View>
          )}

          {/* Nutritional Information Table */}
          {(guide.protein || guide.fat || guide.carbs) && (
            <View className="px-4 mb-6">
              <View className="bg-white rounded-lg p-4">
                <View className="flex-row justify-between items-center border-b pb-3 mb-3" style={{ borderColor: '#F6FBDE' }}>
                  <Text className="text-sm font-semibold" style={{ color: '#313131' }}>protein</Text>
                  <Text className="text-sm font-medium" style={{ color: '#313131' }}>
                    {guide.protein || 0} g
                  </Text>
                </View>
                <View className="flex-row justify-between items-center border-b pb-3 mb-3" style={{ borderColor: '#F6FBDE' }}>
                  <Text className="text-sm font-semibold" style={{ color: '#313131' }}>fat</Text>
                  <Text className="text-sm font-medium" style={{ color: '#313131' }}>
                    {guide.fat || 0} g
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-semibold" style={{ color: '#313131' }}>carbs</Text>
                  <Text className="text-sm font-medium" style={{ color: '#313131' }}>
                    {guide.carbs || 0} g
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Instructions */}
          {guide.steps && guide.steps.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-xl font-bold mb-4" style={{ color: '#313131' }}>Instructions</Text>
              {guide.steps.map((step, index) => (
                <View key={index} className="mb-4 flex-row">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-1" style={{ backgroundColor: '#D4E95A' }}>
                    <Text className="font-bold text-sm" style={{ color: '#313131' }}>{index + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base leading-6" style={{ color: '#313131' }}>{step}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients */}
          {guide.ingredients && guide.ingredients.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-xl font-bold mb-4" style={{ color: '#313131' }}>Ingredients</Text>
              {guide.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  className="bg-white rounded-lg p-3 mb-2"
                >
                  <Text style={{ color: '#313131' }}>{ingredient}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tips */}
          {guide.tips && guide.tips.length > 0 && (
            <View className="px-4 mb-8">
              <Text className="text-xl font-bold mb-4" style={{ color: '#313131' }}>Tips</Text>
              {guide.tips.map((tip, index) => (
                <View
                  key={index}
                  className="rounded-lg p-3 mb-2"
                  style={{ backgroundColor: '#F6FBDE' }}
                >
                  <Text style={{ color: '#313131' }}>💡 {tip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Delete Button */}
          <View className="px-4 mb-8">
            <TouchableOpacity
              onPress={handleDelete}
              className="rounded-lg py-3 items-center"
              style={{ backgroundColor: '#fddffd' }}
              activeOpacity={0.8}
            >
              <Text className="font-semibold" style={{ color: '#313131' }}>Delete Recipe</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
