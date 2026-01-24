import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { articleAPI, guidesAPI, videoAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';

type Mode = 'url' | 'upload' | 'ai-recipe' | 'ingredients';

interface AddGuideProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddGuide({ onClose, onSuccess }: AddGuideProps) {
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // AI Recipe Generator states
  const [mealType, setMealType] = useState('dinner');
  const [servings, setServings] = useState('4-6');
  const [vibe, setVibe] = useState('quick');
  const [cuisine, setCuisine] = useState('italian-trattoria');
  const [spiceLevel, setSpiceLevel] = useState('medium');

  // Ingredients states
  const [ingredients, setIngredients] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFile(result.assets[0].uri);
        setError(null);
      }
    } catch (err) {
      console.error('Error picking file:', err);
      setError('Failed to pick file');
    }
  };

  const handleVideoPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
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
          Alert.alert('Success', 'Guide created successfully!', [
            { text: 'OK', onPress: () => router.back() },
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
        const result = await videoAPI.processUrl(url, userId);

        if (result.success) {
          if (result.guide) {
            // Immediate result
            setProcessing(false);
            setProgress(100);
            setCurrentStep('Done!');
            Alert.alert('Success', 'Guide created successfully!', [
              { text: 'OK', onPress: () => {
                onClose();
                onSuccess?.();
              } },
            ]);
          } else if (result.jobId) {
            setJobId(result.jobId);
            setCurrentStep('Processing in background...');
            startPolling(result.jobId);
          }
        } else {
          throw new Error(result.error || 'Failed to process URL');
        }
      } else if (mode === 'upload') {
        if (!file) {
          setError('Please select a video file');
          setProcessing(false);
          return;
        }

        setCurrentStep('Uploading...');
        const result = await videoAPI.processUpload(file, userId);

        if (result.success) {
          if (result.guide) {
            // Immediate result
            setProcessing(false);
            setProgress(100);
            setCurrentStep('Done!');
            Alert.alert('Success', 'Guide created successfully!', [
              { text: 'OK', onPress: () => {
                onClose();
                onSuccess?.();
              } },
            ]);
          } else if (result.jobId) {
            setJobId(result.jobId);
            setCurrentStep('Processing in background...');
            startPolling(result.jobId);
          }
        } else {
          throw new Error(result.error || 'Failed to upload video');
        }
      } else if (mode === 'ai-recipe') {
        setCurrentStep('Generating recipe...');
        const result = await guidesAPI.create({
          userId,
          type: 'recipe',
          category: mealType,
          title: 'AI Generated Recipe',
          // The API will handle the AI generation
          metadata: {
            generatedBy: 'quick-recipe',
            preferences: {
              mealType,
              servings,
              vibe,
              cuisine,
              spiceLevel,
            },
          },
        });

        setProcessing(false);
        setProgress(100);
        setCurrentStep('Done!');
        Alert.alert('Success', 'Recipe generated successfully!', [
          { text: 'OK', onPress: () => {
            onClose();
            onSuccess?.();
          } },
        ]);
      } else if (mode === 'ingredients') {
        if (!ingredients.trim()) {
          setError('Please enter ingredients');
          setProcessing(false);
          return;
        }

        setCurrentStep('Generating recipes from ingredients...');
        // Similar to AI recipe, but with ingredients
        const result = await guidesAPI.create({
          userId,
          type: 'recipe',
          category: mealType,
          title: 'AI Generated Recipe',
          metadata: {
            generatedBy: 'from-ingredients',
            userIngredients: ingredients.split(',').map(i => i.trim()),
            dietary,
          },
        });

        setProcessing(false);
        setProgress(100);
        setCurrentStep('Done!');
        Alert.alert('Success', 'Recipes generated successfully!', [
          { text: 'OK', onPress: () => {
            onClose();
            onSuccess?.();
          } },
        ]);
      }
    } catch (err: any) {
      console.error('Error submitting:', err);
      setError(err.message || 'An error occurred');
      setProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">Add Guide</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Mode Selector */}
        <View className="flex-row mb-4 bg-white dark:bg-gray-800 rounded-lg p-1">
          <TouchableOpacity
            onPress={() => setMode('url')}
            className={`flex-1 py-2 px-3 rounded ${mode === 'url' ? 'bg-green-600' : ''}`}
          >
            <Text className={`text-center ${mode === 'url' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              URL
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('upload')}
            className={`flex-1 py-2 px-3 rounded ${mode === 'upload' ? 'bg-green-600' : ''}`}
          >
            <Text className={`text-center ${mode === 'upload' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              Upload
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('ai-recipe')}
            className={`flex-1 py-2 px-3 rounded ${mode === 'ai-recipe' ? 'bg-green-600' : ''}`}
          >
            <Text className={`text-center ${mode === 'ai-recipe' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              AI Recipe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('ingredients')}
            className={`flex-1 py-2 px-3 rounded ${mode === 'ingredients' ? 'bg-green-600' : ''}`}
          >
            <Text className={`text-center ${mode === 'ingredients' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              Ingredients
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {mode === 'url' && (
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Paste a YouTube, TikTok, or Instagram video URL
              </Text>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://..."
                className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 text-gray-900 dark:text-white"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {mode === 'upload' && (
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Select a video file from your device
              </Text>
              <TouchableOpacity
                onPress={handleVideoPick}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600"
              >
                <Text className="text-center text-gray-700 dark:text-gray-300">
                  {file ? 'Video Selected' : 'Tap to Select Video'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'ai-recipe' && (
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Generate a recipe based on your preferences
              </Text>
              {/* Add recipe generator form fields here */}
              <Text className="text-gray-700 dark:text-gray-300 mb-2">Meal Type</Text>
              <TextInput
                value={mealType}
                onChangeText={setMealType}
                placeholder="dinner"
                className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 text-gray-900 dark:text-white"
              />
              {/* Add more fields as needed */}
            </View>
          )}

          {mode === 'ingredients' && (
            <View>
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Enter ingredients you have (comma-separated)
              </Text>
              <TextInput
                value={ingredients}
                onChangeText={setIngredients}
                placeholder="chicken, tomatoes, onions, garlic"
                className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-4 text-gray-900 dark:text-white"
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          {error && (
            <View className="bg-red-100 dark:bg-red-900 rounded-lg p-3 mb-4">
              <Text className="text-red-800 dark:text-red-200">{error}</Text>
            </View>
          )}

          {processing && (
            <View className="bg-blue-100 dark:bg-blue-900 rounded-lg p-4 mb-4">
              <Text className="text-blue-800 dark:text-blue-200 mb-2">{currentStep}</Text>
              <View className="bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <View
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={processing}
            className={`bg-green-600 dark:bg-green-700 rounded-lg p-4 mb-4 ${processing ? 'opacity-50' : ''}`}
          >
            {processing ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" />
                <Text className="text-white font-semibold ml-2">Processing...</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-center">Submit</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

// Keep default export for backward compatibility (if still used as a route)
import { useRouter as useRouterHook } from 'expo-router';
export default function AddGuideScreen() {
  const router = useRouterHook();
  return <AddGuide onClose={() => router.back()} />;
}
