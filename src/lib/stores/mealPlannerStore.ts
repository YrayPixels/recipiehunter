import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { mealPlannerAPI, guidesAPI } from '../api';

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD format
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  guideId: string;
  guideTitle: string;
  imageUrl?: string;
  duration?: string;
  difficulty?: string;
  createdAt: string;
  // Full recipe data stored locally
  ingredients?: string[];
  steps?: string[];
  category?: string;
  type?: string;
  youtube?: string;
  tips?: string[];
  summary?: string;
}

interface MealPlannerState {
  meals: Meal[];
  isLoading: boolean;
  loadMeals: (userId?: string) => Promise<void>;
  addMeal: (meal: Omit<Meal, 'id' | 'createdAt'>, userId?: string) => Promise<void>;
  removeMeal: (mealId: string, userId?: string) => Promise<void>;
  getMealsForDate: (date: Date) => Meal[];
  getMealForSlot: (date: Date, mealType: string) => Meal | undefined;
  clearAllMeals: () => Promise<void>;
}

const STORAGE_KEY = 'meal-planner-meals';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useMealPlannerStore = create<MealPlannerState>((set, get) => ({
  meals: [],
  isLoading: false,

  loadMeals: async (userId?: string) => {
    try {
      set({ isLoading: true });
      
      // Always load from local storage first to have a baseline
      const localData = await AsyncStorage.getItem(STORAGE_KEY);
      let localMeals: Meal[] = localData ? JSON.parse(localData) : [];
      
      // Try to load from backend if userId is provided
      if (userId) {
        try {
          const response = await mealPlannerAPI.getMeals(userId);
          if (response.success && response.meals && Array.isArray(response.meals) && response.meals.length > 0) {
            // Transform backend meals to local format
            const backendMeals: Meal[] = response.meals.map((meal: any) => ({
              id: meal.id,
              date: meal.date,
              mealType: meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
              guideId: meal.recipeId,
              guideTitle: meal.recipe?.title || 'Untitled Recipe',
              imageUrl: meal.recipe?.thumbnailUrl,
              duration: meal.recipe?.duration,
              difficulty: meal.recipe?.difficulty,
              ingredients: Array.isArray(meal.recipe?.ingredients) ? meal.recipe.ingredients : [],
              steps: Array.isArray(meal.recipe?.steps) ? meal.recipe.steps : [],
              category: meal.recipe?.category,
              type: meal.recipe?.cuisine,
              youtube: meal.recipe?.youtubeUrl,
              tips: Array.isArray(meal.recipe?.tips) ? meal.recipe.tips : [],
              summary: meal.recipe?.summary,
              createdAt: meal.createdAt,
            }));
            
            // Merge backend meals with local meals
            // Backend meals take precedence for same date/mealType
            // But keep local meals that aren't in backend (in case of sync issues)
            const mergedMeals: Meal[] = [...localMeals];
            
            backendMeals.forEach((backendMeal) => {
              // Find if there's a local meal for the same date/mealType
              const existingIndex = mergedMeals.findIndex(
                (m) => m.date === backendMeal.date && m.mealType === backendMeal.mealType
              );
              
              if (existingIndex >= 0) {
                // Replace with backend meal (has authoritative ID and data)
                mergedMeals[existingIndex] = backendMeal;
              } else {
                // Add new backend meal
                mergedMeals.push(backendMeal);
              }
            });
            
            // Save merged meals to local storage
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mergedMeals));
            set({ meals: mergedMeals, isLoading: false });
            return;
          } else if (response.success && response.meals && Array.isArray(response.meals) && response.meals.length === 0) {
            // Backend returned empty array - keep local meals, don't overwrite
            console.log('Backend returned empty meals, keeping local meals');
            set({ meals: localMeals, isLoading: false });
            return;
          }
        } catch (error) {
          console.log('Backend unavailable, loading from local storage:', error);
        }
      }
      
      // Fallback to local storage (or use local meals if backend failed)
      set({ meals: localMeals, isLoading: false });
    } catch (error) {
      console.error('Error loading meals:', error);
      // Try to load from local storage even on error
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        const meals = data ? JSON.parse(data) : [];
        set({ meals, isLoading: false });
      } catch (storageError) {
        console.error('Error loading from storage:', storageError);
        set({ meals: [], isLoading: false });
      }
    }
  },

  addMeal: async (mealData, userId?: string) => {
    try {
      // Try to save to backend first if userId is provided
      if (userId) {
        try {
          const response = await mealPlannerAPI.addMeal(
            userId,
            mealData.guideId,
            mealData.date,
            mealData.mealType
          );
          
          // Check if response indicates failure
          if (response && !response.success) {
            console.warn('Backend rejected meal save:', response.error || 'Unknown error');
            // Continue to save locally
          } else if (response && response.success && response.meal) {
            // Transform backend meal to local format
            const newMeal: Meal = {
              id: response.meal.id,
              date: response.meal.date,
              mealType: response.meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
              guideId: response.meal.recipeId,
              guideTitle: response.meal.recipe?.title || mealData.guideTitle,
              imageUrl: response.meal.recipe?.thumbnailUrl || mealData.imageUrl,
              duration: response.meal.recipe?.duration || mealData.duration,
              difficulty: response.meal.recipe?.difficulty || mealData.difficulty,
              ingredients: Array.isArray(response.meal.recipe?.ingredients) 
                ? response.meal.recipe.ingredients 
                : mealData.ingredients || [],
              steps: Array.isArray(response.meal.recipe?.steps) 
                ? response.meal.recipe.steps 
                : mealData.steps || [],
              category: response.meal.recipe?.category || mealData.category,
              type: response.meal.recipe?.cuisine || mealData.type,
              youtube: response.meal.recipe?.youtubeUrl || mealData.youtube,
              tips: Array.isArray(response.meal.recipe?.tips) 
                ? response.meal.recipe.tips 
                : mealData.tips || [],
              summary: response.meal.recipe?.summary || mealData.summary,
              createdAt: response.meal.createdAt,
            };

            const currentMeals = get().meals;
            // Remove any existing meal for the same date and mealType
            const filteredMeals = currentMeals.filter(
              (m) => !(m.date === newMeal.date && m.mealType === newMeal.mealType)
            );
            const updatedMeals = [...filteredMeals, newMeal];

            // Save to local storage
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
            set({ meals: updatedMeals });
            return;
          }
        } catch (error: any) {
          // Check if it's a 404 (recipe not found) or other error
          const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
          const statusCode = error?.response?.status;
          
          if (statusCode === 404) {
            // Recipe not found - create it in the backend first
            console.log('Recipe not found in backend, creating recipe first...');
            try {
              // Construct recipe data from meal data
              const recipeData = {
                userId: userId!,
                title: mealData.guideTitle || 'Untitled Recipe',
                type: mealData.type || 'recipe',
                category: mealData.category || null,
                cuisine: mealData.type || null,
                ingredients: mealData.ingredients || [],
                steps: mealData.steps || [],
                duration: mealData.duration || null,
                difficulty: mealData.difficulty || null,
                summary: mealData.summary || null,
                thumbnailUrl: mealData.imageUrl || null,
                youtubeUrl: mealData.youtube || null,
                tips: mealData.tips || [],
                metadata: {
                  createdFromMealPlanner: true,
                  originalGuideId: mealData.guideId,
                },
              };

              // Create the recipe in the backend
              const createResponse = await guidesAPI.create(recipeData);
              const createdRecipe = createResponse.guide || createResponse.recipe || createResponse;
              
              if (createdRecipe && createdRecipe.id) {
                console.log('✅ Recipe created successfully, retrying meal save with new recipe ID:', createdRecipe.id);
                
                // Retry adding the meal with the newly created recipe ID
                const retryResponse = await mealPlannerAPI.addMeal(
                  userId,
                  createdRecipe.id,
                  mealData.date,
                  mealData.mealType
                );
                
                if (retryResponse && retryResponse.success && retryResponse.meal) {
                  // Transform backend meal to local format
                  const newMeal: Meal = {
                    id: retryResponse.meal.id,
                    date: retryResponse.meal.date,
                    mealType: retryResponse.meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                    guideId: retryResponse.meal.recipeId,
                    guideTitle: retryResponse.meal.recipe?.title || mealData.guideTitle,
                    imageUrl: retryResponse.meal.recipe?.thumbnailUrl || mealData.imageUrl,
                    duration: retryResponse.meal.recipe?.duration || mealData.duration,
                    difficulty: retryResponse.meal.recipe?.difficulty || mealData.difficulty,
                    ingredients: Array.isArray(retryResponse.meal.recipe?.ingredients) 
                      ? retryResponse.meal.recipe.ingredients 
                      : mealData.ingredients || [],
                    steps: Array.isArray(retryResponse.meal.recipe?.steps) 
                      ? retryResponse.meal.recipe.steps 
                      : mealData.steps || [],
                    category: retryResponse.meal.recipe?.category || mealData.category,
                    type: retryResponse.meal.recipe?.cuisine || mealData.type,
                    youtube: retryResponse.meal.recipe?.youtubeUrl || mealData.youtube,
                    tips: Array.isArray(retryResponse.meal.recipe?.tips) 
                      ? retryResponse.meal.recipe.tips 
                      : mealData.tips || [],
                    summary: retryResponse.meal.recipe?.summary || mealData.summary,
                    createdAt: retryResponse.meal.createdAt,
                  };

                  const currentMeals = get().meals;
                  // Remove any existing meal for the same date and mealType
                  const filteredMeals = currentMeals.filter(
                    (m) => !(m.date === newMeal.date && m.mealType === newMeal.mealType)
                  );
                  const updatedMeals = [...filteredMeals, newMeal];

                  // Save to local storage
                  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
                  set({ meals: updatedMeals });
                  return;
                }
              }
              
              // If recipe creation succeeded but meal save failed, fall through to local save
              console.warn('Recipe created but meal save failed, saving locally');
            } catch (createError: any) {
              console.error('Failed to create recipe in backend:', createError);
              console.warn('Falling back to local save only');
            }
          } else {
            console.log('Backend unavailable, saving locally only:', errorMessage);
          }
          // Continue to save locally
        }
      }

      // Fallback to local storage only
      const newMeal: Meal = {
        ...mealData,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      const currentMeals = get().meals;
      // Remove any existing meal for the same date and mealType
      const filteredMeals = currentMeals.filter(
        (m) => !(m.date === newMeal.date && m.mealType === newMeal.mealType)
      );
      const updatedMeals = [...filteredMeals, newMeal];

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
      set({ meals: updatedMeals });
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  },

  removeMeal: async (mealId: string, userId?: string) => {
    try {
      // Try to delete from backend first if userId is provided
      if (userId) {
        try {
          await mealPlannerAPI.deleteMeal(mealId, userId);
        } catch (error) {
          console.log('Backend unavailable, removing locally only');
        }
      }

      // Remove from local storage
      const currentMeals = get().meals;
      const updatedMeals = currentMeals.filter((m) => m.id !== mealId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
      set({ meals: updatedMeals });
    } catch (error) {
      console.error('Error removing meal:', error);
      throw error;
    }
  },

  getMealsForDate: (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return get().meals.filter((m) => m.date === dateStr);
  },

  getMealForSlot: (date: Date, mealType: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return get().meals.find(
      (m) => m.date === dateStr && m.mealType.toLowerCase() === mealType.toLowerCase()
    );
  },

  clearAllMeals: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ meals: [] });
    } catch (error) {
      console.error('Error clearing meals:', error);
      throw error;
    }
  },
}));
