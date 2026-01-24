import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfWeek, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'react-native-feather';
import { guidesAPI, mealDBAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';
import { Text } from '../src/components/Text';
import BottomSheet from '@gorhom/bottom-sheet';
import { useMealPlannerStore } from '../src/lib/stores/mealPlannerStore';
import { GuideSelectionSheet } from '../src/components/GuideSelectionSheet';
import { RecipeDetailsSheet } from '../src/components/RecipeDetailsSheet';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '☀️', color: '#FFE5B4' },
  { id: 'lunch', label: 'Lunch', icon: '☀️', color: '#FFD4B3' },
  { id: 'dinner', label: 'Dinner', icon: '🌙', color: '#E8D5C4' },
  { id: 'snack', label: 'Snack', icon: '🥨', color: '#D4E95A' },
];

export default function MealPlannerScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; mealType: string } | null>(null);
  const [myGuides, setMyGuides] = useState<any[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [viewDays, setViewDays] = useState(3); // 3, 7, or 14 days
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const recipeDetailsSheetRef = React.useRef<BottomSheet>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  const { meals, loadMeals, getMealForSlot, addMeal } = useMealPlannerStore();

  useEffect(() => {
    loadUserId();
    loadMeals();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMyGuides();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentWeek, viewDays]);

  const loadUserId = async () => {
    const id = await getUserId();
    setUserId(id);
    setLoading(false);
  };

  const loadMyGuides = async () => {
    if (!userId) return;
    
    try {
      setLoadingGuides(true);
      const data = await guidesAPI.getAll(userId, {}, null, 0);
      setMyGuides(data.guides || []);
    } catch {
      // Silently handle - backend may be unavailable
      setMyGuides([]);
    } finally {
      setLoadingGuides(false);
    }
  };

  const handleSlotPress = async (date: Date, mealType: string) => {
    const meal = getMealForSlot(date, mealType);
    
    if (meal && meal.guideId) {
      // Check if we have complete recipe data stored
      let recipeDetails = {
        id: meal.guideId,
        title: meal.guideTitle,
        imageUrl: meal.imageUrl || '',
        category: meal.category || '',
        area: meal.type || '',
        ingredients: meal.ingredients || [],
        instructions: meal.steps || [],
        youtube: meal.youtube || undefined,
        tags: meal.tips || undefined,
      };
      
      // If stored data is incomplete, try to get from cache or API
      if (!recipeDetails.ingredients.length || !recipeDetails.instructions.length) {
        try {
          // Try to get complete recipe details from cache/API
          const completeDetails = await mealDBAPI.getCompleteRecipeDetails(meal.guideId);
          if (completeDetails) {
            recipeDetails = {
              id: completeDetails.id,
              title: completeDetails.title,
              imageUrl: completeDetails.imageUrl,
              category: completeDetails.category,
              area: completeDetails.area,
              ingredients: completeDetails.ingredients,
              instructions: completeDetails.instructions,
              youtube: completeDetails.youtube || undefined,
              tags: completeDetails.tags || undefined,
            };
            
            // Update the stored meal with complete data for future use
            if (meal.ingredients?.length === 0 || meal.steps?.length === 0) {
              await addMeal({
                date: meal.date,
                mealType: meal.mealType,
                guideId: meal.guideId,
                guideTitle: meal.guideTitle,
                imageUrl: completeDetails.imageUrl,
                duration: meal.duration,
                difficulty: meal.difficulty,
                ingredients: completeDetails.ingredients,
                steps: completeDetails.instructions,
                category: completeDetails.category,
                type: completeDetails.area,
                youtube: completeDetails.youtube || undefined,
                tips: completeDetails.tags || undefined,
                summary: meal.summary,
              });
            }
          }
        } catch (error) {
          console.error('Error loading complete recipe details:', error);
          // Continue with stored data even if incomplete
        }
      }
      
      setSelectedRecipe(recipeDetails);
      recipeDetailsSheetRef.current?.expand();
    } else {
      // If no meal, show guide selection sheet
      setSelectedSlot({ date, mealType });
      loadMyGuides();
      bottomSheetRef.current?.expand();
    }
  };

  const handleSelectGuide = async (guide: any) => {
    if (!selectedSlot) return;

    try {
      const dateStr = format(selectedSlot.date, 'yyyy-MM-dd');
      // Store full recipe data locally (no server request needed)
      await addMeal({
        date: dateStr,
        mealType: selectedSlot.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        guideId: guide.id,
        guideTitle: guide.title,
        imageUrl: guide.image_url || guide.thumbnail_url,
        duration: guide.duration,
        difficulty: guide.difficulty,
        // Store full recipe data
        ingredients: guide.ingredients || [],
        steps: guide.steps || [],
        category: guide.category || '',
        type: guide.type || '',
        youtube: guide.youtube || undefined,
        tips: guide.tips || undefined,
        summary: guide.summary || undefined,
      });
      bottomSheetRef.current?.close();
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  // Calculate nutrition totals for the displayed days
  const nutritionSummary = useMemo(() => {
    // Note: Nutrition data is not stored in the local meal planner store
    // This is a placeholder for future enhancement
    return {
      calories: 0,
      carbs: 0,
      fat: 0,
      protein: 0,
    };
  }, [meals, currentWeek, viewDays]);

  // Only snap to week start when viewing 7 days, otherwise use currentWeek directly
  const weekStart = viewDays === 7 ? startOfWeek(currentWeek, { weekStartsOn: 1 }) : currentWeek;
  const displayedDays = Array.from({ length: viewDays }, (_, i) => addDays(weekStart, i));

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek((prev) => {
      // Calculate the current weekStart (first displayed day) to use as reference
      const currentStart = viewDays === 7 ? startOfWeek(prev, { weekStartsOn: 1 }) : prev;
      // Move by exactly viewDays from the first displayed day
      const daysToMove = direction === 'prev' ? -viewDays : viewDays;
      const newDate = addDays(currentStart, daysToMove);
      return newDate;
    });
  };

  if (loading && meals.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4E95A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top', 'bottom']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-start mb-4">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft width={24} height={24} color="#313131" />
            </TouchableOpacity>
            <Text className="text-xl font-bold space-bold" style={{ color: '#313131' }}>
              Meal plan
            </Text>
          </View>

          {/* Nutritional Summary */}
          <View className="bg-brand-pink rounded-3xl p-4 mb-4 flex-row gap-x-3 items-center">
            <View className="w-12 h-12 rounded-full items-center justify-center " style={{ backgroundColor: '#E8F4F8' }}>
              <View className="w-8 h-8 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
              <View className="absolute w-4 h-4 rounded-full top-0 right-0" style={{ backgroundColor: '#F97316' }} />
              <View className="absolute w-3 h-3 rounded-full bottom-0 left-0" style={{ backgroundColor: '#A855F7' }} />
            </View>
            <View className="flex-1">
              <Text className="text-3xl text-white font-bold space-bold mb-1">
                {nutritionSummary.calories} Calories
              </Text>
              <Text className="text-sm space-regular" style={{ color: '#666' }}>
                {nutritionSummary.carbs}g Carbs, {nutritionSummary.fat}g Fat, {nutritionSummary.protein}g Protein
              </Text>
            </View>
            <TouchableOpacity>
              <ChevronRight width={20} height={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Date Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              className="px-3 py-2 rounded-lg bg-brand-pink flex-row items-center"
              onPress={() => setViewDays(viewDays === 3 ? 7 : viewDays === 7 ? 3 : 7)}
            >
              <Text className="text-sm font-medium space-medium mr-1" style={{ color: '#313131' }}>
                {viewDays} days
              </Text>
              <ChevronRight width={16} height={16} color="#313131" style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
            <View className="flex-row items-center flex-1 justify-center">
              <TouchableOpacity
                onPress={() => navigateWeek('prev')}
                className="p-2"
                activeOpacity={0.7}
              >
                <ChevronLeft width={20} height={20} color="#313131" />
              </TouchableOpacity>
              <Text className="text-base font-semibold space-semibold mx-4" style={{ color: '#313131' }}>
                {format(displayedDays[0], 'MMM d')} - {format(displayedDays[displayedDays.length - 1], 'MMM d')}
              </Text>
              <TouchableOpacity
                onPress={() => navigateWeek('next')}
                className="p-2"
                activeOpacity={0.7}
              >
                <ChevronRight width={20} height={20} color="#313131" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Meal Planning Grid */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="px-4">
            {/* Day Headers Row */}
            <View className="flex-row mb-2">
              <View className="w-24" /> {/* Spacer for meal type labels */}
              {displayedDays.map((day) => (
                <View key={day.toISOString()} className="flex-1 items-center">
                  <Text
                    className="text-xs font-medium space-medium mb-1"
                    style={{ color: '#313131' }}
                  >
                    {format(day, 'EEE')}
                  </Text>
                  <Text
                    className="text-xs font-medium space-medium"
                    style={{ color: '#666' }}
                  >
                    {format(day, 'd')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Meal Type Rows */}
            {MEAL_TYPES.map((mealType) => (
              <View key={mealType.id} className="mb-3">
                <View className="flex-row items-center">
                  {/* Meal Type Label */}
                  <View className="w-24 pr-2">
                    <View className="flex-row items-center">
                      <Text className="text-base mr-1">{mealType.icon}</Text>
                      <Text className="text-sm font-semibold space-semibold" style={{ color: '#313131' }}>
                        {mealType.label}
                      </Text>
                    </View>
                  </View>

                  {/* Meal Slots for Each Day */}
                  <View className="flex-1 flex-row">
                    {displayedDays.map((day) => {
                      const meal = getMealForSlot(day, mealType.id);
                      return (
                        <View key={`${mealType.id}-${day.toISOString()}`} className="flex-1 px-1">
                          <TouchableOpacity
                            onPress={() => handleSlotPress(day, mealType.id)}
                            className="bg-gray-50 rounded-3xl overflow-hidden"
                            style={{
                              borderWidth: meal ? 2 : 1,
                              borderColor: meal ? '#D4E95A' : '#E5E5E5',
                              aspectRatio: 1,
                            }}
                            activeOpacity={0.8}
                          >
                            {meal ? (
                              <View className="w-full h-full">
                                {meal.imageUrl ? (
                                  <Image
                                    source={{ uri: meal.imageUrl }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View
                                    className="w-full h-full items-center justify-center"
                                    style={{ backgroundColor: mealType.color }}
                                  >
                                    <Text className="text-2xl">{mealType.icon}</Text>
                                  </View>
                                )}
                                <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                                  <Text
                                    className="text-xs font-medium text-white text-center"
                                    numberOfLines={1}
                                  >
                                    {meal.guideTitle}
                                  </Text>
                                </View>
                              </View>
                            ) : (
                              <View className="w-full h-full items-center justify-center bg-gray-100">
                                <Plus width={20} height={20} color="#999" />
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* View Ingredient Box Button */}
        
      </View>
      <View className="absolute bottom-2 left-0 right-0 px-4">
        <TouchableOpacity
          onPress={() => router.push('/ingredients')}
          className="bg-brand-green rounded-3xl py-4 items-center"
          activeOpacity={0.8}
        >
          <Text className="text-base font-semibold space-semibold" style={{ color: '#313131' }}>
            View my ingredient box
          </Text>
        </TouchableOpacity>
      </View>
      {/* Guide Selection Bottom Sheet */}
      <GuideSelectionSheet
        bottomSheetRef={bottomSheetRef}
        selectedSlot={selectedSlot}
        loadingGuides={loadingGuides}
        myGuides={myGuides}
        onSelectGuide={handleSelectGuide}
        onClose={() => {
          setSelectedSlot(null);
          bottomSheetRef.current?.close();
        }}
      />

      {/* Recipe Details Bottom Sheet */}
      <RecipeDetailsSheet
        bottomSheetRef={recipeDetailsSheetRef}
        selectedRecipe={selectedRecipe}
        loadingRecipeDetails={false}
        onClose={() => {
          setSelectedRecipe(null);
          recipeDetailsSheetRef.current?.close();
        }}
      />
    </SafeAreaView>
  );
}
