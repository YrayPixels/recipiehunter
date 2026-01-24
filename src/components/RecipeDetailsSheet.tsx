import React, { useRef } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { X, ExternalLink, Calendar } from 'react-native-feather';
import { useRouter } from 'expo-router';
import { Text } from './Text';
import { BottomSheet } from './BottomSheet';
import BottomSheetLib from '@gorhom/bottom-sheet';
import { AddToMealPlannerSheet } from './AddToMealPlannerSheet';
import { useMealPlannerStore } from '../lib/stores/mealPlannerStore';
import { format } from 'date-fns';

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

interface RecipeDetailsSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  selectedRecipe: RecipeDetails | null;
  loadingRecipeDetails: boolean;
  onClose: () => void;
}

export const RecipeDetailsSheet: React.FC<RecipeDetailsSheetProps> = ({
  bottomSheetRef,
  selectedRecipe,
  loadingRecipeDetails,
  onClose,
}) => {
  const router = useRouter();
  const mealPlannerSheetRef = useRef<BottomSheetLib>(null);
  const addMeal = useMealPlannerStore((state) => state.addMeal);

  const openYouTube = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Error opening YouTube:', err));
  };

  const handleAddToMealPlanner = async (date: Date, mealType: string) => {
    if (!selectedRecipe) return;

    try {
      // Store complete recipe data for meal planner
      await addMeal({
        date: format(date, 'yyyy-MM-dd'),
        mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        guideId: selectedRecipe.id,
        guideTitle: selectedRecipe.title,
        imageUrl: selectedRecipe.imageUrl,
        // Store all recipe details for offline access
        ingredients: selectedRecipe.ingredients || [],
        steps: selectedRecipe.instructions || [],
        category: selectedRecipe.category || '',
        type: selectedRecipe.area || '',
        youtube: selectedRecipe.youtube || undefined,
        tips: selectedRecipe.tags || undefined,
      });
      
      // Close both sheets and navigate to meal planner
      mealPlannerSheetRef.current?.close();
      bottomSheetRef.current?.close();
      onClose();
      
      // Navigate to meal planner after a short delay to allow sheets to close
      setTimeout(() => {
        router.push('/meal-planner');
      }, 300);
    } catch (error) {
      console.error('Error adding to meal planner:', error);
    }
  };

  return (
    <>
      <BottomSheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={['85%', '95%']}
        onClose={onClose}
        backgroundStyle={{ backgroundColor: '#F6FBDE' }}
      >
        <View className="flex-1">

          {loadingRecipeDetails ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#313131" />
              <Text className="mt-4 space-regular" style={{ color: '#313131' }}>
                Loading recipe details...
              </Text>
            </View>
          ) : selectedRecipe ? (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="px-4 pt-2">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-2xl font-bold space-bold" style={{ color: '#313131' }}>
                    Recipe Details
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    className="w-10 h-10 rounded-full items-center justify-center bg-white"
                  >
                    <X width={20} height={20} color="#313131" />
                  </TouchableOpacity>
                </View>

                {/* Recipe Image */}
                <Image
                  source={{ uri: selectedRecipe.imageUrl }}
                  className="w-full h-48 rounded-3xl mb-4"
                  resizeMode="cover"
                />

                {/* Title and Meta */}
                <View className="mb-4">
                  <Text className="text-3xl font-bold mb-2 space-bold" style={{ color: '#313131' }}>
                    {selectedRecipe.title}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    {selectedRecipe.category && (
                      <View className="bg-white px-3 py-1 rounded-full">
                        <Text className="text-sm space-semibold" style={{ color: '#313131' }}>
                          {selectedRecipe.category}
                        </Text>
                      </View>
                    )}
                    {selectedRecipe.area && (
                      <View className="bg-white px-3 py-1 rounded-full">
                        <Text className="text-sm space-semibold" style={{ color: '#313131' }}>
                          {selectedRecipe.area}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Add to Meal Planner Button */}
                <TouchableOpacity
                  onPress={() => mealPlannerSheetRef.current?.expand()}
                  className="bg-brand-green rounded-3xl p-4 mb-4 flex-row items-center justify-center"
                  activeOpacity={0.8}
                >
                  <Calendar width={20} height={20} color="#313131" />
                  <Text className="ml-2 text-base font-semibold space-semibold" style={{ color: '#313131' }}>
                    Add to Meal Planner
                  </Text>
                </TouchableOpacity>

                {/* Tags */}
                {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    {selectedRecipe.tags.map((tag, index) => (
                      <View key={index} className="bg-white px-3 py-1 rounded-full">
                        <Text className="text-xs space-regular" style={{ color: '#313131' }}>
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* YouTube Link */}
                {selectedRecipe.youtube && (
                  <TouchableOpacity
                    onPress={() => openYouTube(selectedRecipe.youtube!)}
                    className="bg-white rounded-3xl p-4 mb-4 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center">
                        <Text className="text-white font-bold">▶</Text>
                      </View>
                      <Text className="text-base space-semibold" style={{ color: '#313131' }}>
                        Watch on YouTube
                      </Text>
                    </View>
                    <ExternalLink width={20} height={20} color="#313131" />
                  </TouchableOpacity>
                )}

                {/* Ingredients */}
                <View className="mb-4">
                  <Text className="text-xl font-bold mb-3 space-bold" style={{ color: '#313131' }}>
                    Ingredients
                  </Text>
                  <View className="bg-white rounded-3xl p-4">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <View key={index} className="flex-row items-start mb-2">
                        <View className="w-2 h-2 rounded-full bg-brand-green mt-2 mr-3" />
                        <Text className="flex-1 text-base space-regular" style={{ color: '#313131' }}>
                          {ingredient}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Instructions */}
                <View className="mb-4">
                  <Text className="text-xl font-bold mb-3 space-bold" style={{ color: '#313131' }}>
                    Instructions
                  </Text>
                  <View className="bg-white rounded-3xl p-4">
                    {selectedRecipe.instructions.map((step, index) => (
                      <View key={index} className="flex-row items-start mb-4">
                        <View className="w-6 h-6 rounded-full bg-brand-green items-center justify-center mr-3 mt-1">
                          <Text className="text-white text-sm font-bold">{index + 1}</Text>
                        </View>
                        <Text className="flex-1 text-base space-regular leading-6" style={{ color: '#313131' }}>
                          {step}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

              </View>

            </ScrollView>
          ) : null}
        </View>
      </BottomSheet>
      
      {/* Render AddToMealPlannerSheet outside the parent BottomSheet to avoid nested backdrop issues */}
      {selectedRecipe && (
        <AddToMealPlannerSheet
          bottomSheetRef={mealPlannerSheetRef}
          recipeId={selectedRecipe.id}
          recipeTitle={selectedRecipe.title}
          recipeImageUrl={selectedRecipe.imageUrl}
          onClose={() => mealPlannerSheetRef.current?.close()}
          onAdd={handleAddToMealPlanner}
        />
      )}
    </>
  );
};
