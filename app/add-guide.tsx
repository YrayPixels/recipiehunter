import * as DocumentPicker from 'expo-document-picker';
import React, { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { guidesAPI, videoAPI, recipeAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';
import BottomSheetLib from '@gorhom/bottom-sheet';
import { BottomSheet } from '../src/components/BottomSheet';
import { X, ExternalLink } from 'react-native-feather';
import { OptimizedImage } from '../src/components/OptimizedImage';

type Mode = 'url' | 'upload' | 'ai-recipe' | 'ingredients';

interface AddGuideProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddGuide({ onClose, onSuccess }: AddGuideProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; ingredients?: string }>();
  const [mode, setMode] = useState<Mode>((params.mode as Mode) || 'url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Set ingredients from params if provided
  useEffect(() => {
    if (params.ingredients) {
      setIngredients(params.ingredients);
      if (params.mode === 'ingredients') {
        setMode('ingredients');
      }
    }
  }, [params.ingredients, params.mode]);

  // AI Recipe Generator states
  const [mealType, setMealType] = useState('dinner');
  const [servings, setServings] = useState('4-6');
  const [vibe, setVibe] = useState('quick');
  const [cuisine, setCuisine] = useState('italian');
  const [spiceLevel, setSpiceLevel] = useState('medium');

  // Ingredients states
  const [ingredients, setIngredients] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [cookingTime, setCookingTime] = useState('30-60');
  const [skillLevel, setSkillLevel] = useState('intermediate');

  // Generated recipe state
  const [generatedRecipe, setGeneratedRecipe] = useState<any>(null);
  const recipeSheetRef = useRef<BottomSheetLib>(null);

  const handleVideoPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFile(result.assets[0].uri);
        setError(null);
      }
    } catch (err) {
      console.error('Error picking video:', err);
      setError('Failed to pick video');
    }
  };

  const startPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const userId = await getUserId();
        const status = await videoAPI.getJobStatus(jobId, userId);

        if (status.status === 'completed') {
          clearInterval(interval);
          setProcessing(false);
          setProgress(100);
          setCurrentStep('Done!');
          
          // Check if recipe is available in the status
          const recipe = status.job?.recipe || status.recipe || status.guide;
          
          Alert.alert('Success', 'Recipe created successfully!', [
            {
              text: 'View Recipe',
              onPress: () => {
                onClose();
                // Navigate to guides screen - the recipe should be there
                // The user can also check the jobs screen to see all their processing jobs
                onSuccess?.();
              }
            },
            {
              text: 'View Jobs',
              onPress: () => {
                onClose();
                // Navigate to jobs screen to see the completed job
                router.push('/jobs');
              }
            },
            {
              text: 'OK',
              style: 'cancel',
              onPress: () => {
                onClose();
                onSuccess?.();
              }
            }
          ]);
        } else if (status.status === 'failed') {
          clearInterval(interval);
          setProcessing(false);
          setError(status.error || 'Processing failed');
        } else {
          setProgress(status.progress || 0);
          setCurrentStep(status.step || 'Processing...');
        }
      } catch (err) {
        console.error('Error checking job status:', err);
        clearInterval(interval);
        setProcessing(false);
        setError('Failed to check job status');
      }
    }, 2000);
  };

  const handleSubmit = async () => {
    setError(null);
    setProcessing(true);
    setProgress(0);
    setCurrentStep('Submitting...');

    try {
      const userId = await getUserId();

      if (mode === 'url') {
        if (!url) {
          setError('Please enter a URL');
          setProcessing(false);
          return;
        }

        setCurrentStep('Processing URL...');
        const urlResult = await videoAPI.processUrl(url, userId);

        if (urlResult.success) {
          if (urlResult.guide) {
            // Immediate result
            setProcessing(false);
            setProgress(100);
            setCurrentStep('Done!');
            Alert.alert('Success', 'Guide created successfully!', [
              {
                text: 'OK', onPress: () => {
                  onClose();
                  onSuccess?.();
                }
              },
            ]);
          } else if (urlResult.jobId) {
            setCurrentStep('Processing in background...');
            startPolling(urlResult.jobId);
          }
        } else {
          throw new Error(urlResult.error || 'Failed to process URL');
        }
      } else if (mode === 'upload') {
        if (!file) {
          setError('Please select a video file');
          setProcessing(false);
          return;
        }

        setCurrentStep('Uploading...');
        const uploadResult = await videoAPI.processUpload(file, userId);

        if (uploadResult.success) {
          if (uploadResult.guide) {
            // Immediate result
            setProcessing(false);
            setProgress(100);
            setCurrentStep('Done!');
            Alert.alert('Success', 'Guide created successfully!', [
              {
                text: 'OK', onPress: () => {
                  onClose();
                  onSuccess?.();
                }
              },
            ]);
          } else if (uploadResult.jobId) {
            setCurrentStep('Processing in background...');
            startPolling(uploadResult.jobId);
          }
        } else {
          throw new Error(uploadResult.error || 'Failed to upload video');
        }
      } else if (mode === 'ai-recipe') {
        setCurrentStep('Generating recipe...');
        const result = await recipeAPI.generateQuick(
          mealType,
          servings,
          vibe,
          cuisine,
          spiceLevel,
          userId
        );

        if (result.success && result.recipes && result.recipes.length > 0) {
          const recipe = result.recipes[0];
          setGeneratedRecipe(recipe);
          setProcessing(false);
          setProgress(100);
          setCurrentStep('Done!');

          // Show bottom sheet with generated recipe
          setTimeout(() => {
            recipeSheetRef.current?.expand();
          }, 300);
        } else {
          throw new Error(result.error || 'Failed to generate recipe');
        }
      } else if (mode === 'ingredients') {
        if (!ingredients.trim()) {
          setError('Please enter ingredients');
          setProcessing(false);
          return;
        }

        setCurrentStep('Generating recipes from ingredients...');
        setProgress(30);

        // Parse ingredients into array
        const ingredientsArray = ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0);

        if (ingredientsArray.length === 0) {
          setError('Please enter at least one ingredient');
          setProcessing(false);
          return;
        }

        // Call the generateFromIngredients API with array
        const result = await recipeAPI.generateFromIngredients(
          ingredientsArray, // Send as array
          dietary,
          mealType,
          servings,
          cookingTime,
          skillLevel,
          userId
        );

        setProgress(80);

        if (result.success && result.recipes && result.recipes.length > 0) {
          // Store the first generated recipe (or let user select from multiple)
          // For now, we'll show the first one
          const firstRecipe = result.recipes[0];
          setGeneratedRecipe(firstRecipe);
          setProcessing(false);
          setProgress(100);
          setCurrentStep('Done!');

          // Show bottom sheet with generated recipe
          setTimeout(() => {
            recipeSheetRef.current?.expand();
          }, 300);
        } else {
          throw new Error(result.error || 'Failed to generate recipes from ingredients');
        }
      }
    } catch (err: any) {
      console.error('Error submitting:', err);
      setError(err.message || 'An error occurred');
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
      <View className="flex-1 px-6 pt-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-3xl " style={{ color: '#313131' }}>Add Recipe</Text>
          <TouchableOpacity onPress={onClose} className="p-2 -mr-2">
            <Text className="text-2xl" style={{ color: '#313131' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Selector */}
        <View className="flex-row mb-6 gap-2">
          <TouchableOpacity
            onPress={() => setMode('url')}
            className="flex-1 py-3 px-3 rounded-3xl items-center"
            style={{
              backgroundColor: mode === 'url' ? '#D4E95A' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text className="text-3xl mb-1">🔗</Text>
            <Text
              className="text-xs font-semibold text-center"
              style={{ color: '#313131' }}
            >
              URL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('upload')}
            className="flex-1 py-3 px-3 rounded-3xl items-center"
            style={{
              backgroundColor: mode === 'upload' ? '#D4E95A' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text className="text-3xl mb-1">📤</Text>
            <Text
              className="text-xs font-semibold text-center"
              style={{ color: '#313131' }}
            >
              Upload
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('ai-recipe')}
            className="flex-1 py-3 px-3 rounded-3xl items-center"
            style={{
              backgroundColor: mode === 'ai-recipe' ? '#D4E95A' : '#FFFFFF',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text className="text-3xl mb-1">✨</Text>
            <Text
              className="text-xs font-semibold text-center"
              style={{ color: '#313131' }}
            >
              AI Recipe
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {mode === 'url' && (
            <View>
              <View className="bg-white rounded-3xl p-6 mb-4" style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <View className="flex-row items-center mb-4">
                  <Text className="text-4xl mr-3">🎥</Text>
                  <View className="flex-1">
                    <Text className="text-lg  mb-1" style={{ color: '#313131' }}>
                      From Video Link
                    </Text>
                    <Text className="text-sm" style={{ color: '#666' }}>
                      YouTube, TikTok, or Instagram
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://youtube.com/watch?v=..."
                  className="rounded-3xl p-4 text-base"
                  style={{
                    backgroundColor: '#F6FBDE',
                    color: '#313131',
                  }}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                />
              </View>

              {/* Tips Card */}
              <View className="bg-brand-pink rounded-3xl p-5 mb-4">
                <Text className="text-base font-semibold mb-2" style={{ color: '#313131' }}>
                  💡 Pro Tips
                </Text>
                <Text className="text-sm leading-5" style={{ color: '#313131' }}>
                  • Works with cooking videos and tutorials{'\n'}
                  • We&apos;ll extract the recipe automatically{'\n'}
                  • Includes ingredients & instructions
                </Text>
              </View>
            </View>
          )}

          {mode === 'upload' && (
            <View>
              <TouchableOpacity
                onPress={handleVideoPick}
                className="rounded-3xl p-8 mb-4 items-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderWidth: 3,
                  borderColor: file ? '#D4E95A' : '#E5E7EB',
                  borderStyle: file ? 'solid' : 'dashed',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {file ? (
                  <>
                    <Text className="text-6xl mb-4">✅</Text>
                    <Text className="text-lg  mb-2" style={{ color: '#313131' }}>
                      Video Selected!
                    </Text>
                    <Text className="text-sm text-center" style={{ color: '#666' }}>
                      Tap to choose a different video
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-6xl mb-4">📱</Text>
                    <Text className="text-lg  mb-2" style={{ color: '#313131' }}>
                      Choose Video File
                    </Text>
                    <Text className="text-sm text-center" style={{ color: '#666' }}>
                      Select a cooking video from your device
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Info Card */}
              <View className="bg-brand-pink rounded-3xl p-5 mb-4">
                <Text className="text-base font-semibold mb-2" style={{ color: '#313131' }}>
                  📹 What We Support
                </Text>
                <Text className="text-sm leading-5" style={{ color: '#313131' }}>
                  • MP4, MOV, and most video formats{'\n'}
                  • Recipe videos under 10 minutes work best{'\n'}
                  • Clear audio helps extract better recipes
                </Text>
              </View>
            </View>
          )}

          {mode === 'ai-recipe' && (
            <View>
              <View className="bg-white rounded-3xl p-6 mb-4" style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <View className="flex-row items-center mb-5">
                  <Text className="text-4xl mr-3">🤖</Text>
                  <View className="flex-1">
                    <Text className="text-lg  mb-1" style={{ color: '#313131' }}>
                      AI-Generated Recipe
                    </Text>
                    <Text className="text-sm" style={{ color: '#666' }}>
                      Tell us what you want to cook
                    </Text>
                  </View>
                </View>

                {/* Meal Type */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Meal Type
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['breakfast', 'lunch', 'dinner', 'dessert', 'drink'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setMealType(type)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: mealType === type ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold capitalize text-sm"
                          style={{ color: '#313131' }}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Servings */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Servings
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['1-2', '2-4', '4-6', '6-8'].map((serving) => (
                      <TouchableOpacity
                        key={serving}
                        onPress={() => setServings(serving)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: servings === serving ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {serving} people
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Vibe/Style */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Cooking Style
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: 'quick', label: '⚡ Quick & Easy' },
                      { id: 'fancy', label: '✨ Restaurant Style' },
                      { id: 'healthy', label: '🥗 Healthy' },
                      { id: 'comfort', label: '🍲 Comfort Food' },
                    ].map((vibeOption) => (
                      <TouchableOpacity
                        key={vibeOption.id}
                        onPress={() => setVibe(vibeOption.id)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: vibe === vibeOption.id ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {vibeOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Cuisine */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Cuisine
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: 'italian', label: '🇮🇹 Italian' },
                      { id: 'mexican', label: '🇲🇽 Mexican' },
                      { id: 'asian', label: '🥢 Asian' },
                      { id: 'american', label: '🇺🇸 American' },
                      { id: 'mediterranean', label: '🫒 Mediterranean' },
                      { id: 'any', label: '🌍 Any' },
                    ].map((cuisineOption) => (
                      <TouchableOpacity
                        key={cuisineOption.id}
                        onPress={() => setCuisine(cuisineOption.id)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: cuisine === cuisineOption.id ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {cuisineOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Spice Level */}
                <View className="mb-2">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Spice Level
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: 'mild', label: '😌 Mild' },
                      { id: 'medium', label: '🌶️ Medium' },
                      { id: 'hot', label: '🔥 Hot' },
                    ].map((spiceOption) => (
                      <TouchableOpacity
                        key={spiceOption.id}
                        onPress={() => setSpiceLevel(spiceOption.id)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: spiceLevel === spiceOption.id ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {spiceOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* AI Info Card */}
              <View className="bg-brand-pink rounded-3xl p-5 mb-4">
                <Text className="text-base font-semibold mb-2" style={{ color: '#313131' }}>
                  ✨ AI Magic
                </Text>
                <Text className="text-sm leading-5" style={{ color: '#313131' }}>
                  Our AI will create a custom recipe based on your preferences, complete with ingredients, instructions, and cooking tips!
                </Text>
              </View>
            </View>
          )}

          {mode === 'ingredients' && (
            <View>
              <View className="bg-white rounded-3xl p-6 mb-4" style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}>
                <View className="flex-row items-center mb-4">
                  <Text className="text-4xl mr-3">🥕</Text>
                  <View className="flex-1">
                    <Text className="text-lg  mb-1" style={{ color: '#313131' }}>
                      From Ingredients
                    </Text>
                    <Text className="text-sm" style={{ color: '#666' }}>
                      What do you have in your kitchen?
                    </Text>
                  </View>
                </View>

                <TextInput
                  value={ingredients}
                  onChangeText={setIngredients}
                  placeholder="e.g., chicken, tomatoes, onions, garlic, pasta..."
                  className="rounded-3xl p-4 text-base"
                  style={{
                    backgroundColor: '#F6FBDE',
                    color: '#313131',
                    minHeight: 120,
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={5}
                />

                {/* Meal Type */}
                <View className="mt-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Meal Type
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: 'breakfast', label: '🌅 Breakfast' },
                      { id: 'lunch', label: '☀️ Lunch' },
                      { id: 'dinner', label: '🌙 Dinner' },
                      { id: 'snack', label: '🥨 Snack' },
                      { id: 'any', label: '🍽️ Any' },
                    ].map((mealOption) => (
                      <TouchableOpacity
                        key={mealOption.id}
                        onPress={() => setMealType(mealOption.id)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: mealType === mealOption.id ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {mealOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Servings */}
                <View className="mt-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Servings
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: '1-2', label: '1-2' },
                      { id: '2-4', label: '2-4' },
                      { id: '4-6', label: '4-6' },
                      { id: '6+', label: '6+' },
                    ].map((servingOption) => (
                      <TouchableOpacity
                        key={servingOption.id}
                        onPress={() => setServings(servingOption.id)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: servings === servingOption.id ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {servingOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Cooking Time */}
                <View className="mt-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Cooking Time
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: '15-30', label: '⚡ 15-30 min' },
                      { id: '30-60', label: '⏱️ 30-60 min' },
                      { id: '60+', label: '🍳 60+ min' },
                    ].map((timeOption) => (
                      <TouchableOpacity
                        key={timeOption.id}
                        onPress={() => setCookingTime(timeOption.id)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: cookingTime === timeOption.id ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {timeOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Skill Level */}
                <View className="mt-4">
                  <Text className="text-sm font-semibold mb-2" style={{ color: '#313131' }}>
                    Skill Level
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { id: 'beginner', label: '👶 Beginner' },
                      { id: 'intermediate', label: '👨‍🍳 Intermediate' },
                      { id: 'advanced', label: '👨‍🍳‍ Advanced' },
                    ].map((skillOption) => (
                      <TouchableOpacity
                        key={skillOption.id}
                        onPress={() => setSkillLevel(skillOption.id)}
                        className="px-4 py-2.5 rounded-lg"
                        style={{
                          backgroundColor: skillLevel === skillOption.id ? '#D4E95A' : '#F6FBDE',
                        }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: '#313131' }}
                        >
                          {skillOption.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Tips Card */}
              <View className="bg-brand-pink rounded-3xl p-5 mb-4">
                <Text className="text-base font-semibold mb-2" style={{ color: '#313131' }}>
                  🔍 How It Works
                </Text>
                <Text className="text-sm leading-5" style={{ color: '#313131' }}>
                  • List ingredients separated by commas{'\n'}
                  • We&apos;ll suggest recipes you can make{'\n'}
                  • AI will match what you have
                </Text>
              </View>
            </View>
          )}

          {error && (
            <View className="rounded-3xl p-4 mb-4 flex-row items-center" style={{ backgroundColor: '#FEE2E2' }}>
              <Text className="text-2xl mr-3">⚠️</Text>
              <Text className="flex-1 text-sm font-medium" style={{ color: '#991B1B' }}>{error}</Text>
            </View>
          )}

          {processing && (
            <View className="rounded-3xl p-5 mb-4" style={{ backgroundColor: '#DBEAFE' }}>
              <View className="flex-row items-center mb-3">
                <ActivityIndicator color="#313131" size="small" />
                <Text className="ml-3 text-base font-semibold" style={{ color: '#313131' }}>
                  {currentStep}
                </Text>
              </View>
              <View className="rounded-full h-3 overflow-hidden" style={{ backgroundColor: '#BFDBFE' }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: '#D4E95A' }}
                />
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={processing}
            className="rounded-3xl py-4 mb-6 items-center"
            style={{
              backgroundColor: processing ? '#E5E7EB' : '#D4E95A',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: processing ? 0 : 0.15,
              shadowRadius: 6,
              elevation: processing ? 0 : 3,
            }}
          >
            {processing ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#313131" />
                <Text className="ml-3 text-base " style={{ color: '#313131' }}>
                  Processing...
                </Text>
              </View>
            ) : (
              <Text className="text-lg " style={{ color: '#313131' }}>
                {mode === 'ai-recipe' ? '✨ Generate Recipe' : '🚀 Create Recipe'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Generated Recipe Bottom Sheet */}
      {generatedRecipe && (
        <BottomSheet
          bottomSheetRef={recipeSheetRef}
          snapPoints={['85%', '95%']}
          onClose={() => {
            setGeneratedRecipe(null);
          }}
          backgroundStyle={{ backgroundColor: '#F6FBDE' }}
        >
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="px-4 pt-2">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-2xl " style={{ color: '#313131' }}>
                  Generated Recipe
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    recipeSheetRef.current?.close();
                    setGeneratedRecipe(null);
                  }}
                  className="w-10 h-10 rounded-full items-center justify-center bg-white"
                >
                  <X width={20} height={20} color="#313131" />
                </TouchableOpacity>
              </View>

              {/* Recipe Image */}
              {generatedRecipe.thumbnailUrl && (
                <OptimizedImage
                  source={generatedRecipe.thumbnailUrl}
                  containerClassName="w-full h-48 rounded-3xl mb-4 overflow-hidden"
                  style={{ width: '100%', height: 192 }}
                  contentFit="cover"
                />
              )}

              {/* Title */}
              <View className="mb-4">
                <Text className="text-3xl  mb-2" style={{ color: '#313131' }}>
                  {generatedRecipe.title}
                </Text>
                {generatedRecipe.summary && (
                  <Text className="text-base" style={{ color: '#666' }}>
                    {generatedRecipe.summary}
                  </Text>
                )}
              </View>

              {/* Meta Info */}
              <View className="flex-row items-center gap-3 mb-4">
                {generatedRecipe.duration && (
                  <View className="bg-white px-3 py-1 rounded-full">
                    <Text className="text-sm font-semibold" style={{ color: '#313131' }}>
                      ⏱️ {generatedRecipe.duration}
                    </Text>
                  </View>
                )}
                {generatedRecipe.servings && (
                  <View className="bg-white px-3 py-1 rounded-full">
                    <Text className="text-sm font-semibold" style={{ color: '#313131' }}>
                      👥 {generatedRecipe.servings}
                    </Text>
                  </View>
                )}
                {generatedRecipe.difficulty && (
                  <View className="bg-white px-3 py-1 rounded-full">
                    <Text className="text-sm font-semibold" style={{ color: '#313131' }}>
                      {generatedRecipe.difficulty}
                    </Text>
                  </View>
                )}
              </View>

              {/* YouTube Link */}
              {generatedRecipe.youtube && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(generatedRecipe.youtube)}
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
              {generatedRecipe.ingredients && generatedRecipe.ingredients.length > 0 && (
                <View className="mb-4">
                  <Text className="text-xl  mb-3" style={{ color: '#313131' }}>
                    Ingredients
                  </Text>
                  <View className="bg-white rounded-3xl p-4">
                    {generatedRecipe.ingredients.map((ingredient: string, index: number) => (
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
              {generatedRecipe.steps && generatedRecipe.steps.length > 0 && (
                <View className="mb-4">
                  <Text className="text-xl  mb-3" style={{ color: '#313131' }}>
                    Instructions
                  </Text>
                  <View className="bg-white rounded-3xl p-4">
                    {generatedRecipe.steps.map((step: string, index: number) => (
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
              {generatedRecipe.tips && generatedRecipe.tips.length > 0 && (
                <View className="mb-4">
                  <Text className="text-xl  mb-3" style={{ color: '#313131' }}>
                    Tips
                  </Text>
                  <View className="bg-white rounded-3xl p-4">
                    {generatedRecipe.tips.map((tip: string, index: number) => (
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
                onPress={async () => {
                  try {
                    const userId = await getUserId();
                    await recipeAPI.saveSelected(
                      generatedRecipe,
                      userId,
                      {
                        generatedBy: mode === 'ingredients' ? 'from-ingredients' : 'quick-recipe',
                        preferences: mode === 'ingredients' 
                          ? { mealType, servings, cookingTime, skillLevel, dietary, userIngredients: ingredients.split(',').map(i => i.trim()) }
                          : { mealType, servings, vibe, cuisine, spiceLevel }
                      }
                    );
                    Alert.alert('Success', 'Recipe saved successfully!', [
                      {
                        text: 'OK',
                        onPress: () => {
                          recipeSheetRef.current?.close();
                          setGeneratedRecipe(null);
                          onClose();
                          onSuccess?.();
                        }
                      }
                    ]);
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'Failed to save recipe');
                  }
                }}
                className="bg-brand-green rounded-3xl p-4 mb-6 items-center"
              >
                <Text className="text-lg " style={{ color: '#313131' }}>
                  Save Recipe
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </BottomSheet>
      )}
    </View>
  );
}
