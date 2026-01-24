import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { guidesAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';
import { Text } from '../src/components/Text';
import { BottomSheet as BottomSheetComponent } from '../src/components/BottomSheet';
import { AddGuide } from './add-guide';

interface Guide {
  id: string;
  title: string;
  type: string;
  category: string;
  summary?: string;
  created_at: string;
  pinned?: boolean;
  image_url?: string;
  rating?: number;
  duration?: string;
  difficulty?: string;
  tag?: string;
  calories?: number;
}

const categories = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳', image: require('../assets/images/icons/breakfast.png') },
  { id: 'lunch', label: 'Lunch', icon: '🍲', image: require('../assets/images/icons/lunch.png') },
  { id: 'drinks', label: 'Drinks', icon: '🥤', image: require('../assets/images/icons/drink.png') },
  { id: 'desserts', label: 'Desserts', icon: '🍰', image: require('../assets/images/icons/desert.png') },
];

export default function GuidesScreen() {
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('lunch');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      loadGuides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedCategory]);

  const loadUserId = async () => {
    const id = await getUserId();
    setUserId(id);
  };

  const loadGuides = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const filters: any = {};
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      const data = await guidesAPI.getAll(userId, filters, null, 0);
      setGuides(data.guides || []);
    } catch {
      // Silently handle - backend may be unavailable
      setGuides([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGuides();
    setRefreshing(false);
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return guides.length;
    return guides.filter(g => g.category === category).length;
  };

  const renderGuide = ({ item }: { item: Guide }) => {
    const tagColor = item.tag === 'Classic' ? '#A855F7' : item.tag === 'Popular' ? '#fddffd' : '#3B82F6';
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/guide-detail?id=${item.id}`)}
        className="bg-white rounded-3xl mb-4 overflow-hidden shadow-md"
        activeOpacity={0.8}
      >
        {/* Recipe Image */}
        <View className="w-full h-48 bg-gray-200 relative">
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center" style={{ backgroundColor: '#F6FBDE' }}>
              <Text className="text-6xl">🍽️</Text>
            </View>
          )}
          
          {/* Tag Badge */}
          {item.tag && (
            <View
              className="absolute top-3 left-3 px-3 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: tagColor }}
            >
              <Text className="text-white text-xs font-semibold">
                {item.tag === 'Classic' && '🍴 '}
                {item.tag === 'Popular' && '🔥 '}
                {item.tag}
              </Text>
            </View>
          )}
        </View>

        {/* Recipe Info */}
        <View className="p-4">
          <Text className="text-xl font-bold mb-1" style={{ color: '#313131' }} numberOfLines={1}>
            {item.title}
          </Text>
          {item.summary && (
            <Text className="text-sm mb-3" style={{ color: '#313131' }} numberOfLines={2}>
              {item.summary}
            </Text>
          )}
          
          {/* Stats Row */}
          <View className="flex-row items-center justify-between">
            {item.rating && (
              <View className="flex-row items-center">
                <Text className="mr-1" style={{ color: '#D4E95A' }}>★</Text>
                <Text className="text-sm font-medium" style={{ color: '#313131' }}>{item.rating}</Text>
              </View>
            )}
            {item.duration && (
              <View className="flex-row items-center">
                <Text className="text-sm" style={{ color: '#313131' }}>{item.duration}</Text>
              </View>
            )}
            {item.difficulty && (
              <View className="px-2 py-1 rounded-full" style={{ backgroundColor: '#F6FBDE' }}>
                <Text className="text-xs capitalize" style={{ color: '#313131' }}>{item.difficulty}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && guides.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4E95A" />
        </View>
      </SafeAreaView>
    );
  }

  const categoryCount = getCategoryCount(selectedCategory);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top', 'bottom']}>
      <View className="flex-1">
        {/* Category Navigation */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row flex-1">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className="items-center flex-1"
                  activeOpacity={0.7}
                >
                  <View
                    className="w-24 h-24 overflow-hidden rounded-full items-center justify-center mb-1"
                    style={{
                      backgroundColor: selectedCategory === cat.id ? '#D4E95A' : '#FFFFFF',
                    }}
                  >
                    <Image source={cat.image} className="w-24 h-24" resizeMode="contain" />
                  </View>
                  <Text
                    className="text-base font-medium"
                    style={{
                      color: selectedCategory === cat.id ? '#313131' : '#313131',
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recipe Count and View Toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold" style={{ color: '#313131' }}>
              {categoryCount} {selectedCategory === 'lunch' ? 'lunches' : selectedCategory === 'breakfast' ? 'breakfasts' : selectedCategory === 'drinks' ? 'drinks' : 'desserts'}
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => bottomSheetRef.current?.expand()}
                className="px-4 py-2 rounded-full mr-2"
                style={{ backgroundColor: '#D4E95A' }}
              >
                <Text className="font-semibold" style={{ color: '#313131' }}>+ Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 mr-2"
              >
                <Text style={{ color: '#313131' }}>{viewMode === 'grid' ? '☰' : '⊞'}</Text>
              </TouchableOpacity>
              <Text style={{ color: '#313131' }}>3</Text>
            </View>
          </View>
        </View>

        {/* Recipe List */}
        <FlatList
          data={guides}
          renderItem={renderGuide}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-center mb-4 text-lg" style={{ color: '#313131' }}>
                No recipes yet
              </Text>
              <TouchableOpacity
                onPress={() => bottomSheetRef.current?.expand()}
                className="px-6 py-3 rounded-full"
                style={{ backgroundColor: '#D4E95A' }}
              >
                <Text className="font-semibold" style={{ color: '#313131' }}>Create Your First Recipe</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Add Guide Bottom Sheet */}
      <BottomSheetComponent
        bottomSheetRef={bottomSheetRef}
        snapPoints={['90%']}
        onClose={() => bottomSheetRef.current?.close()}
      >
        <AddGuide
          onClose={() => bottomSheetRef.current?.close()}
          onSuccess={() => {
            loadGuides();
          }}
        />
      </BottomSheetComponent>
    </SafeAreaView>
  );
}
