import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, Linking } from 'react-native';
import { X, ExternalLink } from 'react-native-feather';
import { OptimizedImage } from './OptimizedImage';
import { recipeAPI } from '../lib/api';
import { getUserId } from '../lib/userid';
import { useAlert } from '../hooks/useAlert';

interface GeneratedRecipeSheetProps {
  recipe: any;
  onClose: () => void;
  onSave: () => void;
  mode?: 'ai-recipe' | 'ingredients';
  preferences?: any;
}

export const GeneratedRecipeSheet: React.FC<GeneratedRecipeSheetProps> = ({
  recipe,
  onClose,
  onSave,
  mode = 'ai-recipe',
  preferences = {},
}) => {
  const { alert, AlertComponent } = useAlert();

  const handleSave = async () => {
    try {
      const userId = await getUserId();
      await recipeAPI.saveSelected(
        recipe,
        userId,
        {
          generatedBy: mode === 'ingredients' ? 'from-ingredients' : 'quick-recipe',
          preferences,
        }
      );
      alert('Success', 'Recipe saved successfully!', [
        {
          text: 'OK',
          onPress: () => {
            onSave();
          }
        }
      ], 'success');
    } catch (error: any) {
      alert('Error', error.message || 'Failed to save recipe', undefined, 'error');
    }
  };

  return (
    <>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-2xl " style={{ color: '#313131' }}>
              Generated Recipe
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center bg-white"
            >
              <X width={20} height={20} color="#313131" />
            </TouchableOpacity>
          </View>

          {/* Recipe Image */}
          {recipe.thumbnailUrl && (
            <OptimizedImage
              source={recipe.thumbnailUrl}
              containerClassName="w-full h-48 rounded-3xl mb-4 overflow-hidden"
              style={{ width: '100%', height: 192 }}
              contentFit="cover"
            />
          )}

          {/* Title */}
          <View className="mb-4">
            <Text className="text-3xl  mb-2" style={{ color: '#313131' }}>
              {recipe.title}
            </Text>
            {recipe.summary && (
              <Text className="text-base" style={{ color: '#666' }}>
                {recipe.summary}
              </Text>
            )}
          </View>

          {/* Meta Info */}
          <View className="flex-row items-center gap-3 mb-4">
            {recipe.duration && (
              <View className="bg-white px-3 py-1 rounded-full">
                <Text className="text-sm font-semibold" style={{ color: '#313131' }}>
                  ⏱️ {recipe.duration}
                </Text>
              </View>
            )}
            {recipe.servings && (
              <View className="bg-white px-3 py-1 rounded-full">
                <Text className="text-sm font-semibold" style={{ color: '#313131' }}>
                  👥 {recipe.servings}
                </Text>
              </View>
            )}
            {recipe.difficulty && (
              <View className="bg-white px-3 py-1 rounded-full">
                <Text className="text-sm font-semibold" style={{ color: '#313131' }}>
                  {recipe.difficulty}
                </Text>
              </View>
            )}
          </View>

          {/* YouTube Link */}
          {recipe.youtube && (
            <TouchableOpacity
              onPress={() => Linking.openURL(recipe.youtube)}
              className="bg-white rounded-3xl p-4 mb-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-red-500 items-center justify-center">
                  <Text className="text-white ">▶</Text>
                </View>
                <Text className="text-base font-semibold" style={{ color: '#313131' }}>
                  Watch on YouTube
                </Text>
              </View>
              <ExternalLink width={20} height={20} color="#313131" />
            </TouchableOpacity>
          )}

          {/* Ingredients */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <View className="mb-4">
              <Text className="text-xl  mb-3" style={{ color: '#313131' }}>
                Ingredients
              </Text>
              <View className="bg-white rounded-3xl p-4">
                {recipe.ingredients.map((ingredient: string, index: number) => (
                  <View key={index} className="flex-row items-start mb-2">
                    <View className="w-2 h-2 rounded-full bg-brand-green mt-2 mr-3" />
                    <Text className="flex-1 text-base" style={{ color: '#313131' }}>
                      {ingredient}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Instructions */}
          {recipe.steps && recipe.steps.length > 0 && (
            <View className="mb-4">
              <Text className="text-xl  mb-3" style={{ color: '#313131' }}>
                Instructions
              </Text>
              <View className="bg-white rounded-3xl p-4">
                {recipe.steps.map((step: string, index: number) => (
                  <View key={index} className="flex-row items-start mb-4">
                    <View className="w-6 h-6 rounded-full bg-brand-green items-center justify-center mr-3 mt-1">
                      <Text className="text-white text-sm ">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-base leading-6" style={{ color: '#313131' }}>
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <View className="mb-4">
              <Text className="text-xl  mb-3" style={{ color: '#313131' }}>
                Tips
              </Text>
              <View className="bg-white rounded-3xl p-4">
                {recipe.tips.map((tip: string, index: number) => (
                  <View key={index} className="flex-row items-start mb-2">
                    <Text className="text-2xl mr-2">💡</Text>
                    <Text className="flex-1 text-base" style={{ color: '#313131' }}>
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            className="bg-brand-green rounded-3xl p-4 mb-6 items-center"
          >
            <Text className="text-lg " style={{ color: '#313131' }}>
              Save Recipe
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {AlertComponent}
    </>
  );
};
