import React from 'react';
import { ActivityIndicator, FlatList, TouchableOpacity, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { ShoppingCart } from 'react-native-feather';
import { Text } from '../Text';
import { BottomSheet as BottomSheetComponent } from '../BottomSheet';

interface Recipe {
  id: string;
  title: string;
  summary?: string;
}

interface CreateFromRecipeSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  myRecipes: Recipe[];
  loadingRecipes: boolean;
  onCreateFromRecipe: (recipeId: string) => void;
  onClose: () => void;
}

export const CreateFromRecipeSheet: React.FC<CreateFromRecipeSheetProps> = ({
  bottomSheetRef,
  myRecipes,
  loadingRecipes,
  onCreateFromRecipe,
  onClose,
}) => {
  return (
    <BottomSheetComponent
      bottomSheetRef={bottomSheetRef}
      snapPoints={['75%']}
      backgroundStyle={{ backgroundColor: '#F6FBDE' }}
      onClose={onClose}
    >
      <View className="px-4 pt-2">
        <Text className="text-2xl space-bold mb-2" style={{ color: '#313131' }}>
          Create from Recipe
        </Text>
        <Text className="text-sm space-regular mb-6" style={{ color: '#666' }}>
          Select a recipe to generate a shopping list
        </Text>
        
        {loadingRecipes ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#D4E95A" />
            <Text className="mt-4 text-sm space-regular" style={{ color: '#666' }}>
              Loading your recipes...
            </Text>
          </View>
        ) : myRecipes.length === 0 ? (
          <View className="items-center justify-center py-10 bg-white rounded-3xl border border-brand-green">
            <ShoppingCart width={48} height={48} color="#D4E95A" />
            <Text className="text-center space-medium mt-4 mb-2" style={{ color: '#313131' }}>
              No recipes found
            </Text>
            <Text className="text-center text-sm space-regular px-8" style={{ color: '#666' }}>
              Create some recipes first to generate shopping lists from them
            </Text>
          </View>
        ) : (
          <FlatList
            data={myRecipes}
            keyExtractor={(item) => item.id}
            renderItem={({ item: recipe }) => (
              <TouchableOpacity
                onPress={() => onCreateFromRecipe(recipe.id)}
                className="bg-white rounded-3xl p-4 mb-3 border border-brand-green"
                activeOpacity={0.8}
              >
                <Text className="text-base space-semibold mb-1" style={{ color: '#313131' }}>
                  {recipe.title}
                </Text>
                {recipe.summary && (
                  <Text className="text-sm space-regular" style={{ color: '#666' }} numberOfLines={2}>
                    {recipe.summary}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </BottomSheetComponent>
  );
};
