import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { ImageBackground, ScrollView, TouchableOpacity, View, ActivityIndicator, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { guidesAPI, mealDBAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';
import { Text } from '../src/components/Text';
import { Input } from '@/src/components/Input';
import { Search } from 'react-native-feather';
import { RecipeDetailsSheet } from '../src/components/RecipeDetailsSheet';
import BottomSheetLib from '@gorhom/bottom-sheet';


interface QuickStats {
  totalRecipes: number;
  recentGuides: number;
}

interface PopularRecipe {
  id: string;
  title: string;
  time: string;
  difficulty: string;
  rating: number;
  imageUrl: string;
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

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export default function DashboardScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<QuickStats>({ totalRecipes: 0, recentGuides: 0 });
  const [popularRecipes, setPopularRecipes] = useState<PopularRecipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);
  const bottomSheetRef = useRef<BottomSheetLib>(null);
  const [searchResults, setSearchResults] = useState<PopularRecipe[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      if (!hasCompletedOnboarding) {
        // First launch - redirect to onboarding
        router.replace('/onboarding');
        return;
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Count cached recipes (offline-friendly)
      const { countCachedRecipes } = await import('../src/lib/recipeCache');
      const totalRecipes = await countCachedRecipes();

      // Try to get recent guides count from API (optional) - using safe version that never throws
      const userId = await getUserId();
      const data = await guidesAPI.getStatsSafe(userId);
      // Get the count of recipes from database (stats.recent or stats.totalRecipes)
      const recentGuides = data?.stats?.recent || data?.stats?.totalRecipes || 0;

      setStats({
        totalRecipes: totalRecipes || 0,
        recentGuides: recentGuides,
      });
    } catch {
      // Set default values if everything fails
      setStats({
        totalRecipes: 0,
        recentGuides: 0,
      });
    }
  };

  const loadPopularRecipes = async () => {
    try {
      setLoadingRecipes(true);

      // Always fetch new random recipes on each load (don't use cache for popular recipes list)
      const { setCachedPopularRecipes, setCachedRecipeDetail, countCachedRecipes } = await import('../src/lib/recipeCache');

      // Fetch 6 random meals from TheMealDB (will use its own cache)
      const meals = await mealDBAPI.getRandomMeals(6);

      // Ensure meals is an array
      if (!Array.isArray(meals) || meals.length === 0) {
        setPopularRecipes([]);
        setLoadingRecipes(false);
        return;
      }

      // Transform meals to our format and cache FULL details for each recipe
      const transformedRecipes: PopularRecipe[] = [];

      for (const meal of meals) {
        const transformed = mealDBAPI.transformMeal(meal);
        if (!transformed) continue;

        // Cache the FULL recipe detail for this recipe
        // This ensures all recipe data is available when viewing in meal planner
        await setCachedRecipeDetail(transformed.id, meal);

        // Format title to fit on two lines (split at ~20 chars)
        const title = transformed.title;
        const titleWords = title.split(' ');
        let line1 = '';
        let line2 = '';

        for (const word of titleWords) {
          if ((line1 + ' ' + word).length <= 20 && !line2) {
            line1 = line1 ? line1 + ' ' + word : word;
          } else {
            line2 = line2 ? line2 + ' ' + word : word;
          }
        }

        transformedRecipes.push({
          id: transformed.id,
          title: line2 ? `${line1}\n${line2}` : line1,
          time: transformed.time,
          difficulty: transformed.difficulty,
          rating: transformed.rating,
          imageUrl: transformed.imageUrl,
        });
      }

      // Cache the transformed recipes summary
      if (transformedRecipes.length > 0) {
        await setCachedPopularRecipes(transformedRecipes);
      }

      setPopularRecipes(transformedRecipes);

      // Update stats after caching recipes
      const totalRecipes = await countCachedRecipes();
      setStats(prev => ({ ...prev, totalRecipes }));
    } catch (error) {
      console.error('Error loading popular recipes:', error);
      // Fallback to empty array or show error state
      setPopularRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const handleRecipePress = async (recipeId: string) => {
    try {
      setLoadingRecipeDetails(true);
      const meal = await mealDBAPI.getMealById(recipeId);

      if (meal) {
        const transformed = mealDBAPI.transformMeal(meal);
        if (transformed) {
          setSelectedRecipe({
            id: transformed.id,
            title: transformed.title,
            imageUrl: transformed.imageUrl,
            category: transformed.category,
            area: transformed.area,
            ingredients: transformed.ingredients,
            instructions: transformed.instructions,
            youtube: transformed.youtube || undefined,
            tags: transformed.tags || undefined,
          });
          bottomSheetRef.current?.expand();
        }
      }
    } catch (error) {
      console.error('Error loading recipe details:', error);
    } finally {
      setLoadingRecipeDetails(false);
    }
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
    setSelectedRecipe(null);
  };

  const handleSearch = async (query: string) => {
    setSearch(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is empty, clear results
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Debounce search by 500ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        setHasSearched(true);

        // Check cache first
        const { getCachedSearchResults, setCachedSearchResults } = await import('../src/lib/recipeCache');
        const cached = await getCachedSearchResults(query);

        if (cached && Array.isArray(cached) && cached.length > 0) {
          // Transform cached results to our format
          const transformedResults = cached
            .map((meal) => mealDBAPI.transformMeal(meal))
            .filter((meal) => meal !== null)
            .map((transformed) => {
              if (!transformed) return null;

              const title = transformed.title;
              const titleWords = title.split(' ');
              let line1 = '';
              let line2 = '';

              for (const word of titleWords) {
                if ((line1 + ' ' + word).length <= 20 && !line2) {
                  line1 = line1 ? line1 + ' ' + word : word;
                } else {
                  line2 = line2 ? line2 + ' ' + word : word;
                }
              }

              return {
                id: transformed.id,
                title: line2 ? `${line1}\n${line2}` : line1,
                time: transformed.time,
                difficulty: transformed.difficulty,
                rating: transformed.rating,
                imageUrl: transformed.imageUrl,
              };
            })
            .filter((result): result is PopularRecipe => result !== null);

          setSearchResults(transformedResults);
          setLoadingSearch(false);
          return;
        }

        // Search TheMealDB API
        const meals = await mealDBAPI.searchByName(query);

        if (!Array.isArray(meals) || meals.length === 0) {
          setSearchResults([]);
          setLoadingSearch(false);
          return;
        }

        // Cache the raw search results
        await setCachedSearchResults(query, meals);

        // Transform to our format
        const transformedResults: PopularRecipe[] = meals
          .map((meal) => mealDBAPI.transformMeal(meal))
          .filter((meal) => meal !== null)
          .map((transformed) => {
            if (!transformed) return null;

            const title = transformed.title;
            const titleWords = title.split(' ');
            let line1 = '';
            let line2 = '';

            for (const word of titleWords) {
              if ((line1 + ' ' + word).length <= 20 && !line2) {
                line1 = line1 ? line1 + ' ' + word : word;
              } else {
                line2 = line2 ? line2 + ' ' + word : word;
              }
            }

            return {
              id: transformed.id,
              title: line2 ? `${line1}\n${line2}` : line1,
              time: transformed.time,
              difficulty: transformed.difficulty,
              rating: transformed.rating,
              imageUrl: transformed.imageUrl,
            };
          })
          .filter((result): result is PopularRecipe => result !== null);

        setSearchResults(transformedResults);

        // Update stats with new cached recipe count
        const { countCachedRecipes } = await import('../src/lib/recipeCache');
        const totalRecipes = await countCachedRecipes();
        setStats(prev => ({ ...prev, totalRecipes }));
      } catch (error) {
        console.error('Error searching recipes:', error);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 500);
  };

  useEffect(() => {
    checkOnboardingStatus();
    loadStats();
    loadPopularRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menuItems = [
    {
      title: 'My Recipes',
      description: 'View all your recipes and guides',
      icon: '📚',
      image: require('@assets/bar/recipes.jpg'),
      route: '/guides',
      color: 'bg-blue-500',
    },
    {
      title: 'Meal Planner',
      description: 'Plan your weekly meals',
      icon: '📅',
      image: require('@assets/bar/meal-planner.png'),
      route: '/meal-planner',
      color: 'bg-purple-500',
    },
    {
      title: 'Shopping Lists',
      description: 'Auto-generated shopping lists',
      icon: '🛒',
      image: require('@assets/bar/shoppinglist.webp'),
      route: '/shopping',
      color: 'bg-orange-500',
    },
    {
      title: 'My Ingredients',
      description: 'Track pantry items',
      icon: '🥘',
      image: require('@assets/bar/ingredients.jpg'),
      route: '/ingredients',
      color: 'bg-pink-500',
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="px-4 pt-10 pb-8">
          <View className='w-2/3'>
            <Text className="text-3xl font-bold mb-2 space-bold" style={{ color: '#313131' }}>
              What would you like to cook?
            </Text>
            <Text className="mb-6 space-regular" style={{ color: '#313131' }}>
              Your personal recipe and guide keeper
            </Text>
          </View>


          {/* Quick Stats */}

          <View className="flex-row mb-6">
            <Input
              containerClassName='rounded-3xl border border-brand-green p-4 bg-white'
              variant="filled"
              value={search}
              leftIcon={<Search color="#313131" />}
              onChangeText={handleSearch}
              placeholder="Search for a recipe"
            />
          </View>

          <View className="flex-row mb-6">
            <TouchableOpacity
              className="flex-1 bg-brand-pink rounded-3xl p-4 shadow mr-2"
              activeOpacity={0.7}
              onPress={() => router.push('/guides?category=all')}
            >
              <Text className="text-2xl space-bold">
                {stats.totalRecipes}
              </Text>
              <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                Total Recipes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-brand-pink rounded-3xl p-4 shadow"
              activeOpacity={0.7}
              onPress={() => router.push('/guides?category=all')}
            >
              <Text className="text-2xl space-bold" style={{ color: '#313131' }}>
                {stats.recentGuides}
              </Text>
              <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                Recent
              </Text>
            </TouchableOpacity>
          </View>

          {/* Menu Grid */}
          <ScrollView className='py-2' horizontal showsHorizontalScrollIndicator={false}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(item.route as any)}
                className=" px-2 mb-4"
                activeOpacity={0.8}
              >
                <View className="bg-brand-green h-[100px] w-[250px] rounded-3xl p-2 shadow overflow-hidden">
                  <RNImage source={item.image} className="absolute top-[-20px] left-[-30px] w-[150px] h-[150px] rounded-full mb-3" resizeMode="cover" />
                  <View className="absolute flex-column justify-between items-end right-0 top-1 rounded-3xl p-4">
                    <Text className="text-lg  font-semibold mb-1 space-semibold text-dark" >
                      {item.title}
                    </Text>
                    <View className="flex-row items-center bg-black/50 rounded-lg p-2 w-[150px]">
                      <Text className=" space-regular text-right text-white " >
                        {item.description}
                      </Text>
                    </View>

                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search Results Section */}
          {hasSearched && (
            <>
              <View className='px-2 mb-4'>
                <Text className="text-2xl font-semibold mb-1 space-semibold" style={{ color: '#313131' }}>
                  Search Results {search ? `for "${search}"` : ''}
                </Text>
              </View>
              {loadingSearch ? (
                <View className="py-8 items-center justify-center">
                  <ActivityIndicator size="large" color="#313131" />
                  <Text className="mt-4 space-regular" style={{ color: '#313131' }}>
                    Searching recipes...
                  </Text>
                </View>
              ) : searchResults.length > 0 ? (
                <ScrollView className='py-2 mb-6' horizontal showsHorizontalScrollIndicator={false}>
                  {searchResults.map((recipe) => (
                    <TouchableOpacity
                      key={recipe.id}
                      onPress={() => handleRecipePress(recipe.id)}
                      className="px-2 mb-4"
                      activeOpacity={0.8}
                    >
                      <ImageBackground
                        source={{ uri: recipe.imageUrl }}
                        className="w-56 h-72 rounded-3xl overflow-hidden shadow"
                        imageStyle={{ borderRadius: 24 }}
                      >
                        {/* Top glass panel */}
                        <View className="absolute top-4 left-4 right-4 rounded-3xl px-4 py-3 bg-black/50 backdrop-blur-lg">
                          <Text className="text-white text-lg space-bold leading-tight">
                            {recipe.title}
                          </Text>

                          <View className="flex-row items-center mt-3">
                            <Text className="text-white/90 text-sm space-semibold">{recipe.time}</Text>
                            <View className="mx-3 h-4 w-0.5 bg-brand-green" />
                            <Text className="text-white/90 text-sm space-semibold">{recipe.difficulty}</Text>
                          </View>
                        </View>

                        {/* Rating pill */}
                        <View className="absolute bottom-4 right-4 rounded-full px-3 py-2 bg-black/35 flex-row items-center">
                          <Text className="text-brand-green text-base mr-2">★</Text>
                          <Text className="text-white text-base space-semibold">{recipe.rating}</Text>
                        </View>
                      </ImageBackground>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View className="py-8 items-center justify-center mb-6">
                  <Text className="space-regular" style={{ color: '#313131' }}>
                    No recipes found for &quot;{search}&quot;
                  </Text>
                  <Text className="mt-2 text-sm space-regular" style={{ color: '#666' }}>
                    Try a different search term
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Popular Recipes Section */}
          <View className=' px-2 mb-4'>
            <Text className="text-2xl font-semibold mb-1 space-semibold" style={{ color: '#313131' }}>
              Popular Recipes
            </Text>
          </View>
          {loadingRecipes ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#313131" />
              <Text className="mt-4 space-regular" style={{ color: '#313131' }}>
                Loading recipes...
              </Text>
            </View>
          ) : popularRecipes.length > 0 ? (
            <ScrollView className='py-2' horizontal showsHorizontalScrollIndicator={false}>
              {popularRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  onPress={() => handleRecipePress(recipe.id)}
                  className="px-2 mb-4"
                  activeOpacity={0.8}
                >
                  <ImageBackground
                    source={{ uri: recipe.imageUrl }}
                    className="w-56 h-72 rounded-3xl overflow-hidden shadow"
                    imageStyle={{ borderRadius: 24 }}
                  >
                    {/* Top glass panel */}
                    <View className="absolute top-4 left-4 right-4 rounded-3xl px-4 py-3 bg-black/50 backdrop-blur-lg">
                      <Text className="text-white text-lg space-bold leading-tight">
                        {recipe.title}
                      </Text>

                      <View className="flex-row items-center mt-3">
                        <Text className="text-white/90 text-sm space-semibold">{recipe.time}</Text>
                        <View className="mx-3 h-4 w-0.5 bg-brand-green" />
                        <Text className="text-white/90 text-sm space-semibold">{recipe.difficulty}</Text>
                      </View>
                    </View>

                    {/* Rating pill */}
                    <View className="absolute bottom-4 right-4 rounded-full px-3 py-2 bg-black/35 flex-row items-center">
                      <Text className="text-brand-green text-base mr-2">★</Text>
                      <Text className="text-white text-base space-semibold">{recipe.rating}</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View className="py-8 items-center justify-center">
              <Text className="space-regular" style={{ color: '#313131' }}>
                No recipes available at the moment
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Recipe Details Bottom Sheet */}
      <RecipeDetailsSheet
        bottomSheetRef={bottomSheetRef}
        selectedRecipe={selectedRecipe}
        loadingRecipeDetails={loadingRecipeDetails}
        onClose={handleCloseBottomSheet}
      />
    </SafeAreaView>
  );
}
