import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { useLocalSearchParams } from 'expo-router';
import { guidesAPI, mealDBAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';
import { Text } from '../src/components/Text';
import { BottomSheet as BottomSheetComponent } from '../src/components/BottomSheet';
import { Input } from '../src/components/Input';
import { AddGuide } from './add-guide';
import { getAllCachedRecipes } from '../src/lib/recipeCache';
import { RecipeDetailsSheet } from '../src/components/RecipeDetailsSheet';

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

interface RecipeDetails {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  area: string;
  ingredients: string[];
  instructions: string[];
  youtube?: string;
  tags?: string[];
}

const categories = [
  { id: 'all', label: 'All', icon: '📚' },
  { id: 'breakfast', label: 'Breakfast', icon: '🍳', image: require('../assets/images/icons/breakfast.png') },
  { id: 'lunch', label: 'Lunch', icon: '🍲', image: require('../assets/images/icons/lunch.png') },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', image: require('../assets/images/icons/lunch.png') },
  { id: 'drinks', label: 'Drinks', icon: '🥤', image: require('../assets/images/icons/drink.png') },
  { id: 'dessert', label: 'Dessert', icon: '🍰', image: require('../assets/images/icons/desert.png') },
  { id: 'snack', label: 'Snack', icon: '🍿', image: require('../assets/images/icons/breakfast.png') },
];


export default function GuidesScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'lunch');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const bottomSheetRef = useRef<BottomSheet>(null);
  const recipeDetailsSheetRef = useRef<BottomSheet>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadUserId();
  }, []);

  // Update selected category when route params change
  useEffect(() => {
    if (params.category) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  const applySearch = () => {
    if (!searchQuery.trim()) {
      setFilteredGuides(guides);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = guides.filter(guide => {
      const titleMatch = guide.title?.toLowerCase().includes(query);
      const summaryMatch = guide.summary?.toLowerCase().includes(query);
      const categoryMatch = guide.category?.toLowerCase().includes(query);
      return titleMatch || summaryMatch || categoryMatch;
    });

    setFilteredGuides(filtered);
  };

  useEffect(() => {
    if (userId) {
      loadGuides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedCategory]);

  useEffect(() => {
    applySearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guides, searchQuery]);

  const loadUserId = async () => {
    const id = await getUserId();
    setUserId(id);
  };

  const loadGuides = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load from both backend and cache
      let backendGuides: Guide[] = [];
      let cachedRecipes: Guide[] = [];

      // Try to load from backend
      try {
        const filters: any = {};
        if (selectedCategory && selectedCategory !== 'all') {
          filters.category = selectedCategory;
        }
        const data = await guidesAPI.getAll(userId, filters, null, 0);
        backendGuides = data.guides || [];
      } catch {
        console.log('Backend unavailable, loading from cache only');
      }

      // Load cached recipes
      try {
        const cached = await getAllCachedRecipes();
        // Transform cached recipes to match Guide interface
        cachedRecipes = cached.map((recipe: any) => ({
          id: recipe.id || recipe.idMeal || `cached_${Date.now()}_${Math.random()}`,
          title: recipe.title || recipe.strMeal || 'Untitled Recipe',
          type: 'recipe',
          category: recipe.category || selectedCategory,
          summary: recipe.summary || recipe.strInstructions?.substring(0, 100),
          created_at: recipe.created_at || new Date().toISOString(),
          image_url: recipe.image_url || recipe.strMealThumb || recipe.thumbnailUrl,
          rating: recipe.rating,
          duration: recipe.duration,
          difficulty: recipe.difficulty,
          tag: recipe.tag,
          calories: recipe.calories,
        }));

        // Filter cached recipes by category if needed
        if (selectedCategory && selectedCategory !== 'all') {
          cachedRecipes = cachedRecipes.filter(r => r.category === selectedCategory);
        }
      } catch (error) {
        console.error('Error loading cached recipes:', error);
      }

      // Merge backend and cached recipes, avoiding duplicates
      const allGuides = [...backendGuides];
      const backendIds = new Set(backendGuides.map(g => g.id));

      // Add cached recipes that aren't already in backend
      for (const cached of cachedRecipes) {
        if (!backendIds.has(cached.id)) {
          allGuides.push(cached);
        }
      }

      console.log(`📚 Loaded ${backendGuides.length} backend + ${cachedRecipes.length} cached = ${allGuides.length} total recipes`);
      setGuides(allGuides);
    } catch (error) {
      console.error('Error loading guides:', error);
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

  const handleRecipePress = async (guide: Guide) => {
    try {
      setLoadingRecipeDetails(true);

      // Check if this is a cached recipe from TheMealDB (has idMeal format or cached_ prefix)
      const isMealDBRecipe = guide.id.startsWith('cached_') || !isNaN(Number(guide.id));

      let recipeDetails: RecipeDetails | null = null;

      if (isMealDBRecipe) {
        // For MealDB recipes, fetch from MealDB API
        const meal = await mealDBAPI.getMealById(guide.id);
        if (meal) {
          const transformed = mealDBAPI.transformMeal(meal);
          if (transformed) {
            recipeDetails = {
              id: transformed.id,
              title: transformed.title,
              imageUrl: transformed.imageUrl,
              category: transformed.category,
              area: transformed.area,
              ingredients: transformed.ingredients,
              instructions: transformed.instructions,
              youtube: transformed.youtube || undefined,
              tags: transformed.tags || undefined,
            };
          }
        }
      } else {
        // For backend guides, fetch from guidesAPI
        const response = await guidesAPI.getById(guide.id);
        // The API returns { guide: recipe, recipe: recipe } - extract the actual recipe data
        const guideData = response?.guide || response?.recipe || response;
        if (guideData && guideData.id) {
          recipeDetails = {
            id: guideData.id,
            title: guideData.title,
            imageUrl: guideData.image_url || guideData.thumbnailUrl || guide.image_url || '',
            category: guideData.category || guide.category,
            area: guideData.cuisine || guideData.type || '',
            ingredients: guideData.ingredients || [],
            instructions: guideData.steps || [],
            youtube: guideData.youtube || guideData.youtubeUrl,
            tags: guideData.tips || [],
          };
        }
      }

      if (recipeDetails) {
        setSelectedRecipe(recipeDetails);
        recipeDetailsSheetRef.current?.expand();
      }
    } catch (error) {
      console.error('Error loading recipe details:', error);
    } finally {
      setLoadingRecipeDetails(false);
    }
  };

  const handleCloseRecipeDetailsSheet = () => {
    recipeDetailsSheetRef.current?.close();
    setSelectedRecipe(null);
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return filteredGuides.length;
    return filteredGuides.filter(g => g.category === category).length;
  };

  const renderGuide = ({ item }: { item: Guide }) => {
    return (
      <TouchableOpacity
        onPress={() => handleRecipePress(item)}
        className="mb-4 bg-brand-pink  rounded-3xl shadow p-2"
        activeOpacity={0.7}
      >
        <View className="overflow-hidden">
          {/* Recipe Image - Left Side (60%) */}
          <View style={{ position: 'relative' }} className='rounded-[20px]  h-[150px] overflow-hidden '>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="w-full h-full items-center justify-center"
                style={{ backgroundColor: '#FEF7E6' }}
              >
                <Text style={{ fontSize: 72 }}>🍽️</Text>
              </View>
            )}
          </View>

          <View style={{ padding: 16, justifyContent: 'space-between' }}>
            <View style={{ flex: 1, justifyContent: 'center', marginVertical: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }} numberOfLines={2}>
                {item.title}
              </Text>
              {item.summary && (
                <Text style={{ fontSize: 13, color: '#4B5563', lineHeight: 18 }} numberOfLines={2}>
                  {item.summary}
                </Text>
              )}
            </View>

            {/* Stats badges at bottom */}
            <View style={{ gap: 6 }} className="flex-row items-center justify-start">

              <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>⭐ 4.9</Text>
              </View>

              <View style={{ backgroundColor: '#E0E7FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937' }}>🕐 30min</Text>
              </View>


              <View style={{ backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1F2937', textTransform: 'capitalize' }}>📊 Easy</Text>
              </View>

            </View>
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
      <View className="flex-1">
        {/* Category Navigation - Horizontal Scroll */}
        <View className="pt-4 pb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className="items-center mr-4"
                activeOpacity={0.7}
              >
                <View
                  className="w-16 h-16 overflow-hidden rounded-full items-center justify-center mb-1"
                  style={{
                    backgroundColor: selectedCategory === cat.id ? '#D4E95A' : '#FFFFFF',
                  }}
                >
                  {cat.image ? (
                    <Image source={cat.image} className="w-16 h-16" resizeMode="contain" />
                  ) : (
                    <Text className="text-2xl">{cat.icon}</Text>
                  )}
                </View>
                <Text
                  className="text-sm font-medium"
                  style={{
                    color: selectedCategory === cat.id ? '#313131' : '#6B7280',
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Input */}
          <View className="px-4 mt-3">
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search recipes..."
              leftIcon="🔍"
              variant="filled"
              size="md"
              containerClassName="bg-white rounded-2xl"
            />
          </View>

          {/* Recipe Count and Action Buttons */}
          <View className="flex-row items-center justify-between px-4 mt-3">
            <Text className="text-2xl font-bold" style={{ color: '#1F2937' }}>
              {categoryCount} {selectedCategory === 'all' ? 'recipes' : selectedCategory}
            </Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={() => bottomSheetRef.current?.expand()}
                className="px-4 py-2.5 rounded-3xl"
                style={{ backgroundColor: '#D4E95A' }}
              >
                <Text className="font-bold" style={{ color: '#1F2937' }}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recipe List */}
        <View className='flex-1'>
          <FlatList
            data={filteredGuides}
            showsVerticalScrollIndicator={false}
            renderItem={renderGuide}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View className="items-center justify-center">
                <Text className="text-6xl mb-4">{searchQuery.trim() ? '🔍' : '🍽️'}</Text>
                <Text className="text-center mb-2 text-xl font-bold" style={{ color: '#1F2937' }}>
                  {searchQuery.trim() ? 'No matching recipes' : 'No recipes yet'}
                </Text>
                <Text className="text-center mb-6 text-sm px-8" style={{ color: '#6B7280' }}>
                  {searchQuery.trim()
                    ? 'Try a different search term'
                    : 'Start building your recipe collection'}
                </Text>
                {!searchQuery.trim() && (
                  <TouchableOpacity
                    onPress={() => bottomSheetRef.current?.expand()}
                    className="px-6 py-3 rounded-3xl"
                    style={{ backgroundColor: '#D4E95A', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                  >
                    <Text className="font-bold text-base" style={{ color: '#1F2937' }}>+ Create Your First Recipe</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </View>
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

      {/* Recipe Details Bottom Sheet */}
      <RecipeDetailsSheet
        bottomSheetRef={recipeDetailsSheetRef}
        selectedRecipe={selectedRecipe}
        loadingRecipeDetails={loadingRecipeDetails}
        onClose={handleCloseRecipeDetailsSheet}
      />

    </SafeAreaView>
  );
}
