import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { videoAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';
import { Text } from '../src/components/Text';
import { RecipeDetailsSheet } from '../src/components/RecipeDetailsSheet';

interface ProcessingJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  step?: string;
  currentStep?: string;
  jobType: string;
  videoUrl?: string;
  createdAt: string;
  completedAt?: string;
  recipe?: any;
  guide?: any; // Backward compatibility
  error?: string;
  errorMessage?: string;
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

export default function JobsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const recipeDetailsSheetRef = useRef<BottomSheet>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null);
  const [loadingRecipeDetails, setLoadingRecipeDetails] = useState(false);

  useEffect(() => {
    loadUserId();
    return () => {
      // Cleanup polling intervals on unmount
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, []);

  useEffect(() => {
    if (userId) {
      loadJobs();
    }
  }, [userId]);

  const loadUserId = async () => {
    const id = await getUserId();
    if (id) {
      setUserId(id);
    }
  };

  const loadJobs = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await videoAPI.getUserJobs(userId, 50, 0);
      if (response.success && response.jobs) {
        setJobs(response.jobs);
        
        // Start polling for active jobs
        response.jobs.forEach((job: ProcessingJob) => {
          if (job.status === 'pending' || job.status === 'processing') {
            startPolling(job.id);
          }
        });
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load processing jobs');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (jobId: string) => {
    // Clear existing interval if any
    const existing = pollingIntervals.get(jobId);
    if (existing) {
      clearInterval(existing);
    }

    const interval = setInterval(async () => {
      try {
        if (!userId) return;
        const status = await videoAPI.getJobStatus(jobId, userId);

        // Update job in list
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, ...status, step: status.step || status.currentStep }
            : job
        ));

        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          pollingIntervals.delete(jobId);
          
          // Refresh jobs list to get updated data
          if (status.status === 'completed') {
            setTimeout(() => loadJobs(), 1000);
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
        clearInterval(interval);
        pollingIntervals.delete(jobId);
      }
    }, 3000); // Poll every 3 seconds

    pollingIntervals.set(jobId, interval);
    setPollingIntervals(new Map(pollingIntervals));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleJobPress = async (job: ProcessingJob) => {
    if (job.status === 'completed' && (job.recipe || job.guide)) {
      // Navigate to recipe details
      const recipe = job.recipe || job.guide;
      await viewRecipe(recipe);
    } else if (job.status === 'failed') {
      Alert.alert(
        'Processing Failed',
        job.error || job.errorMessage || 'An error occurred while processing this video.',
        [{ text: 'OK' }]
      );
    }
  };

  const viewRecipe = async (recipe: any) => {
    try {
      setLoadingRecipeDetails(true);
      
      // Transform recipe data to match RecipeDetails interface
      const recipeDetails: RecipeDetails = {
        id: recipe.id,
        title: recipe.title || 'Untitled Recipe',
        imageUrl: recipe.thumbnailUrl || recipe.image_url || '',
        category: recipe.category || 'General',
        area: recipe.cuisine || '',
        ingredients: Array.isArray(recipe.ingredients) 
          ? recipe.ingredients.map((ing: any) => 
              typeof ing === 'string' ? ing : `${ing.name || ing.ingredient} ${ing.amount || ing.quantity || ''}`.trim()
            )
          : [],
        instructions: Array.isArray(recipe.steps)
          ? recipe.steps.map((step: any) => 
              typeof step === 'string' ? step : step.instruction || step.step || ''
            )
          : [],
        youtube: recipe.youtubeUrl || recipe.youtube,
        tags: recipe.tags || [],
      };

      setSelectedRecipe(recipeDetails);
      recipeDetailsSheetRef.current?.expand();
    } catch (error) {
      console.error('Error loading recipe details:', error);
      Alert.alert('Error', 'Failed to load recipe details');
    } finally {
      setLoadingRecipeDetails(false);
    }
  };

  const handleCloseRecipeDetailsSheet = () => {
    recipeDetailsSheetRef.current?.close();
    setSelectedRecipe(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'processing':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      case 'processing':
        return '⟳';
      default:
        return '⏳';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderJob = ({ item }: { item: ProcessingJob }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const step = item.step || item.currentStep || 'Waiting...';
    const isClickable = item.status === 'completed' || item.status === 'failed';

    return (
      <TouchableOpacity
        onPress={() => handleJobPress(item)}
        disabled={!isClickable}
        className={`mb-4 bg-white rounded-3xl shadow p-4 ${!isClickable ? 'opacity-75' : ''}`}
        activeOpacity={0.7}
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg font-semibold" style={{ color: '#313131' }}>
                {item.jobType === 'video_url' && item.videoUrl 
                  ? `Video: ${item.videoUrl.substring(0, 40)}...`
                  : item.jobType === 'video_upload'
                  ? 'Uploaded Video'
                  : 'Processing Job'}
              </Text>
            </View>
            <View className="flex-row items-center mt-2">
              <View 
                className="px-3 py-1 rounded-full mr-2"
                style={{ backgroundColor: `${statusColor}20` }}
              >
                <Text className="text-sm font-medium" style={{ color: statusColor }}>
                  {statusIcon} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              <Text className="text-xs" style={{ color: '#9E9E9E' }}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {(item.status === 'processing' || item.status === 'pending') && (
          <View className="mt-3">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm" style={{ color: '#666' }}>
                {step}
              </Text>
              <Text className="text-sm font-medium" style={{ color: '#666' }}>
                {item.progress}%
              </Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View 
                className="h-full rounded-full"
                style={{ 
                  width: `${item.progress}%`,
                  backgroundColor: statusColor 
                }}
              />
            </View>
          </View>
        )}

        {item.status === 'completed' && (
          <View className="mt-2">
            <Text className="text-sm" style={{ color: '#4CAF50' }}>
              ✓ Recipe ready! Tap to view
            </Text>
          </View>
        )}

        {item.status === 'failed' && (
          <View className="mt-2">
            <Text className="text-sm" style={{ color: '#F44336' }}>
              {item.error || item.errorMessage || 'Processing failed'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && jobs.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4E95A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
      <View className="flex-1 px-6 pt-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-bold" style={{ color: '#313131' }}>
              Processing Jobs
            </Text>
            <Text className="text-sm mt-1" style={{ color: '#666' }}>
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} className="p-2 -mr-2">
            <Text className="text-2xl" style={{ color: '#313131' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {jobs.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg" style={{ color: '#666' }}>
              No processing jobs yet
            </Text>
            <Text className="text-sm mt-2" style={{ color: '#999' }}>
              Process a video to see it here
            </Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJob}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#D4E95A"
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Recipe Details Sheet */}
      <RecipeDetailsSheet
        bottomSheetRef={recipeDetailsSheetRef}
        selectedRecipe={selectedRecipe}
        loadingRecipeDetails={loadingRecipeDetails}
        onClose={handleCloseRecipeDetailsSheet}
      />
    </SafeAreaView>
  );
}
