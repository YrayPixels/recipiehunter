import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, parseISO } from 'date-fns';
import { cacheRecipe } from './recipeCache';

// Get API URL from environment or use default
// For production, update this to your recipehunter server URL
const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  async (config) => {
    // You can add auth token here if needed
    // const token = await getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Video API
export const videoAPI = {
  /**
   * Submit video URL for background processing
   */
  processUrl: async (url: string, userId: string) => {
    const response = await api.post('/api/video/process-url', { url, userId }, {
      timeout: 30000,
    });
    // Handle both 'recipe' and 'guide' in response for backward compatibility
    const data = response.data;
    if (data.recipe && !data.guide) {
      data.guide = data.recipe;
    }
    return data;
  },

  /**
   * Upload video file for background processing
   */
  processUpload: async (uri: string, userId: string, fileName?: string) => {
    const formData = new FormData();
    
    // For React Native, we need to create a file object
    formData.append('video', {
      uri,
      type: 'video/mp4',
      name: fileName || 'video.mp4',
    } as any);
    formData.append('userId', userId);

    const response = await api.post('/api/video/process-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
    return response.data;
  },

  /**
   * Get status of a processing job
   */
  getJobStatus: async (jobId: string, userId: string) => {
    const response = await api.get(`/api/video/job/${jobId}?userId=${userId}`, {
      timeout: 10000,
    });
    const data = response.data;
    // Ensure top-level fields for mobile app compatibility
    if (data.job) {
      return {
        ...data,
        status: data.status || data.job.status,
        progress: data.progress || data.job.progress,
        step: data.step || data.job.currentStep,
        error: data.error || data.job.errorMessage,
      };
    }
    return data;
  },

  /**
   * Get all jobs for a user
   */
  getUserJobs: async (userId: string, limit = 20, offset = 0) => {
    const response = await api.get(`/api/video/jobs?userId=${userId}&limit=${limit}&offset=${offset}`, {
      timeout: 10000,
    });
    const data = response.data;
    // Ensure backward compatibility - add 'guide' field if 'recipe' exists
    if (data.jobs && Array.isArray(data.jobs)) {
      data.jobs = data.jobs.map((job: any) => ({
        ...job,
        guide: job.recipe || job.guide, // Backward compatibility
      }));
    }
    return data;
  },
};

// Article API
export const articleAPI = {
  /**
   * Process article URL and extract guide
   */
  processUrl: async (url: string, userId: string) => {
    const response = await api.post('/api/article/process', { url, userId }, {
      timeout: 60000,
    });
    // Handle both 'recipe' and 'guide' in response for backward compatibility
    const data = response.data;
    if (data.recipe && !data.guide) {
      data.guide = data.recipe;
    }
    return data;
  },
};

// Guides API
export const guidesAPI = {
  /**
   * Get all guides/recipes for a user with optional pagination
   */
  getAll: async (
    userId: string,
    filters: {
      search?: string;
      type?: string;
      category?: string;
    } = {},
    limit: number | null = null,
    offset = 0
  ) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (limit) params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`/api/guides/${userId}?${params.toString()}`);
    // Handle both 'recipes' and 'guides' in response for backward compatibility
    const data = response.data;
    if (data.recipes && !data.guides) {
      data.guides = data.recipes;
    }
    return data;
  },

  /**
   * Get single guide/recipe by ID
   */
  getById: async (guideId: string) => {
    const response = await api.get(`/api/guides/detail/${guideId}`);
    // Handle both 'recipe' and 'guide' in response
    const data = response.data;
    if (data.recipe && !data.guide) {
      data.guide = data.recipe;
    }
    return data;
  },

  /**
   * Create new guide/recipe
   */
  create: async (guideData: any) => {
    // Increase timeout for AI generation requests (can take 60+ seconds)
    const isAIGeneration = guideData.metadata?.generatedBy === 'quick-recipe' || 
                          guideData.metadata?.generatedBy === 'from-ingredients';
    const timeout = isAIGeneration ? 120000 : 30000; // 2 minutes for AI, 30s for regular
    
    const response = await api.post('/api/guides', guideData, {
      timeout,
    });
    // Handle both 'recipe' and 'guide' in response
    const data = response.data;
    const guide = data.recipe || data.guide || data;
    
    // Cache recipe if it's a recipe type
    if (guide && (guide.type === 'recipe' || guideData.type === 'recipe')) {
      try {
        await cacheRecipe(guide);
      } catch (error) {
        console.error('Failed to cache recipe:', error);
      }
    }
    
    // Ensure backward compatibility
    if (data.recipe && !data.guide) {
      data.guide = data.recipe;
    }
    
    return data;
  },

  /**
   * Update guide/recipe
   */
  update: async (guideId: string, updates: any) => {
    const response = await api.patch(`/api/guides/${guideId}`, updates);
    const data = response.data;
    // Ensure backward compatibility
    if (data.recipe && !data.guide) {
      data.guide = data.recipe;
    }
    return data;
  },

  /**
   * Delete guide
   */
  delete: async (guideId: string) => {
    const response = await api.delete(`/api/guides/${guideId}`);
    return response.data;
  },

  /**
   * Toggle pin status for a guide/recipe
   */
  togglePin: async (guideId: string, userId: string, pinned: boolean) => {
    const response = await api.patch(`/api/guides/${guideId}/pin`, { userId, pinned });
    const data = response.data;
    // Ensure backward compatibility
    if (data.recipe && !data.guide) {
      data.guide = data.recipe;
    }
    return data;
  },

  /**
   * Get user statistics
   */
  getStats: async (userId: string) => {
    const response = await api.get(`/api/guides/stats/${userId}`);
    return response.data;
  },

  /**
   * Get user statistics (safe version that never throws or logs errors)
   * Returns null on error instead of throwing
   */
  getStatsSafe: async (userId: string) => {
    try {
      const response = await api.get(`/api/guides/stats/${userId}`);
      return response.data;
    } catch (error) {
      // Silently return null on any error
      return null;
    }
  },
};

// Shopping API
type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
  quantity?: string;
  category?: string;
};

type ShoppingList = {
  id: string;
  userId: string;
  name: string;
  items: ShoppingItem[];
  created_at: string;
  guideIds?: string[];
};

const SHOPPING_STORAGE_KEY = 'local_shopping_lists_v1';

async function loadLocalShoppingLists(): Promise<ShoppingList[]> {
  try {
    const raw = await AsyncStorage.getItem(SHOPPING_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load local shopping lists', e);
    return [];
  }
}

async function saveLocalShoppingLists(lists: ShoppingList[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(lists));
  } catch (e) {
    console.warn('Failed to save local shopping lists', e);
  }
}

// Toggle this flag to switch between local-only and server-backed behaviour.
const USE_LOCAL_SHOPPING = true;

export const shoppingAPI = {
  /**
   * Get all shopping lists for a user
   */
  getAll: async (userId: string) => {
    if (USE_LOCAL_SHOPPING) {
      const allLists = await loadLocalShoppingLists();
      const lists = allLists.filter((l) => l.userId === userId);
      return { lists };
    }

    const response = await api.get(`/api/shopping/${userId}`);
    return response.data;
  },

  /**
   * Create new shopping list
   */
  create: async (userId: string, name: string, items: any[] = [], guideIds: string[] = []) => {
    if (USE_LOCAL_SHOPPING) {
      const allLists = await loadLocalShoppingLists();
      const newList: ShoppingList = {
        id: Date.now().toString(),
        userId,
        name,
        items,
        guideIds,
        created_at: new Date().toISOString(),
      };
      const updated = [newList, ...allLists];
      await saveLocalShoppingLists(updated);
      return { list: newList };
    }

    const response = await api.post('/api/shopping', { userId, name, items, guideIds });
    return response.data;
  },

  /**
   * Create shopping list from a guide's ingredients
   */
  createFromGuide: async (userId: string, guideId: string, listName: string | null = null) => {
    if (USE_LOCAL_SHOPPING) {
      // Fetch the guide/recipe to get its ingredients
      let items: ShoppingItem[] = [];
      let recipeTitle = 'Recipe';
      
      try {
        const guideData = await guidesAPI.getById(guideId);
        if (guideData && guideData.ingredients && Array.isArray(guideData.ingredients)) {
          recipeTitle = guideData.title || 'Recipe';
          // Convert ingredients array to shopping items
          items = guideData.ingredients.map((ingredient: string, index: number) => {
            // Try to parse quantity and name from ingredient string
            // Format might be "2 cups flour" or just "flour"
            const trimmed = ingredient.trim();
            if (!trimmed) {
              return {
                id: `${guideId}-${index}-${Date.now()}`,
                name: ingredient,
                checked: false,
              };
            }
            
            // Pattern to match quantities at the start (e.g., "2 cups", "1/2 tsp", "500g")
            const quantityPattern = /^([\d\/\.]+\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|pcs|pkg|pack|can|cans|bunch|bunches|clove|cloves|head|heads|stalk|stalks|slice|slices)?\s*)/i;
            const match = trimmed.match(quantityPattern);
            
            let quantity: string | undefined;
            let name: string;
            
            if (match) {
              quantity = match[1].trim();
              name = trimmed.substring(match[0].length).trim() || trimmed;
            } else {
              name = trimmed;
            }
            
            return {
              id: `${guideId}-${index}-${Date.now()}`,
              name: name || ingredient,
              checked: false,
              quantity: quantity || undefined,
            };
          });
        }
      } catch (error) {
        console.warn('Failed to fetch guide ingredients, creating empty list:', error);
      }
      
      const allLists = await loadLocalShoppingLists();
      const newList: ShoppingList = {
        id: Date.now().toString(),
        userId,
        name: listName || `${recipeTitle} Shopping List`,
        items,
        guideIds: [guideId],
        created_at: new Date().toISOString(),
      };
      const updated = [newList, ...allLists];
      await saveLocalShoppingLists(updated);
      return { list: newList };
    }

    const response = await api.post('/api/shopping/from-guide', { userId, guideId, listName });
    return response.data;
  },

  /**
   * Create shopping list from a week's meal plan
   */
  createFromMealPlanWeek: async (userId: string, startDate: string, listName: string | null = null) => {
    if (USE_LOCAL_SHOPPING) {
      // Load meals from local storage
      const MEAL_STORAGE_KEY = 'meal-planner-meals';
      let items: ShoppingItem[] = [];
      const guideIds: string[] = [];
      
      try {
        const mealsData = await AsyncStorage.getItem(MEAL_STORAGE_KEY);
        const allMeals = mealsData ? JSON.parse(mealsData) : [];
        
        // Calculate end date (7 days from start)
        const start = parseISO(startDate);
        const end = addDays(start, 6);
        
        // Filter meals for the specified week
        const weekMeals = allMeals.filter((meal: any) => {
          try {
            const mealDate = parseISO(meal.date);
            return mealDate >= start && mealDate <= end;
          } catch {
            return false;
          }
        });
        
        if (weekMeals.length === 0) {
          console.log('No meals found for this week');
        }
        
        // Map to track unique ingredients (deduplicate by name)
        const ingredientMap = new Map<string, { name: string; quantity?: string; recipes: Set<string> }>();
        
        // Extract ingredients from each meal
        weekMeals.forEach((meal: any) => {
          if (meal.guideId) {
            guideIds.push(meal.guideId);
          }
          
          if (meal.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach((ingredient: string) => {
              const trimmed = ingredient.trim();
              if (!trimmed) return;
              
              // Try to parse quantity and name from ingredient string
              const quantityPattern = /^([\d\/\.]+\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|pcs|pkg|pack|can|cans|bunch|bunches|clove|cloves|head|heads|stalk|stalks|slice|slices)?\s*)/i;
              const match = trimmed.match(quantityPattern);
              
              let quantity: string | undefined;
              let name: string;
              
              if (match) {
                quantity = match[1].trim();
                name = trimmed.substring(match[0].length).trim() || trimmed;
              } else {
                name = trimmed;
              }
              
              // Use lowercase name as key for deduplication
              const key = name.toLowerCase();
              
              if (ingredientMap.has(key)) {
                // Ingredient already exists, add recipe to set
                const existing = ingredientMap.get(key)!;
                if (meal.guideTitle) {
                  existing.recipes.add(meal.guideTitle);
                }
                // If quantities are the same, keep the existing one, otherwise append
                if (quantity && existing.quantity && quantity !== existing.quantity) {
                  existing.quantity = `${existing.quantity}, ${quantity}`;
                }
              } else {
                // New ingredient
                ingredientMap.set(key, {
                  name,
                  quantity,
                  recipes: new Set(meal.guideTitle ? [meal.guideTitle] : []),
                });
              }
            });
          }
        });
        
        // Convert map to shopping items array
        items = Array.from(ingredientMap.values()).map((info, index) => {
          let displayQuantity = info.quantity;
          
          // If ingredient appears in multiple recipes, add that info
          if (info.recipes.size > 1) {
            displayQuantity = displayQuantity 
              ? `${displayQuantity} (${info.recipes.size} recipes)` 
              : `Used in ${info.recipes.size} recipes`;
          }
          
          return {
            id: `${Date.now()}-${index}`,
            name: info.name,
            checked: false,
            quantity: displayQuantity,
            category: 'Meal Plan',
          };
        });
        
        console.log(`Created shopping list with ${items.length} items from ${weekMeals.length} meals`);
      } catch (error) {
        console.error('Error loading meal plan ingredients:', error);
      }
      
      const allLists = await loadLocalShoppingLists();
      const newList: ShoppingList = {
        id: Date.now().toString(),
        userId,
        name: listName || `Week of ${startDate}`,
        items,
        guideIds: Array.from(new Set(guideIds)),
        created_at: new Date().toISOString(),
      };
      const updated = [newList, ...allLists];
      await saveLocalShoppingLists(updated);
      return { list: newList };
    }

    const response = await api.post('/api/shopping/from-meal-plan-week', { userId, startDate, listName });
    return response.data;
  },

  /**
   * Update shopping list
   */
  update: async (listId: string, updates: any) => {
    if (USE_LOCAL_SHOPPING) {
      const allLists = await loadLocalShoppingLists();
      const updatedLists = allLists.map((list) =>
        list.id === listId ? { ...list, ...updates } : list
      );
      await saveLocalShoppingLists(updatedLists);
      const updated = updatedLists.find((l) => l.id === listId) || null;
      return { list: updated };
    }

    const response = await api.patch(`/api/shopping/${listId}`, updates);
    return response.data;
  },

  /**
   * Delete shopping list
   */
  delete: async (listId: string) => {
    if (USE_LOCAL_SHOPPING) {
      const allLists = await loadLocalShoppingLists();
      const filtered = allLists.filter((list) => list.id !== listId);
      await saveLocalShoppingLists(filtered);
      return { success: true };
    }

    const response = await api.delete(`/api/shopping/${listId}`);
    return response.data;
  },

  /**
   * Add a guide's ingredients to existing shopping list
   */
  addGuideToList: async (listId: string, guideId: string) => {
    if (USE_LOCAL_SHOPPING) {
      const allLists = await loadLocalShoppingLists();
      const updatedLists = allLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              guideIds: Array.from(new Set([...(list.guideIds || []), guideId])),
            }
          : list
      );
      await saveLocalShoppingLists(updatedLists);
      const updated = updatedLists.find((l) => l.id === listId) || null;
      return { list: updated };
    }

    const response = await api.post(`/api/shopping/${listId}/guides/${guideId}`);
    return response.data;
  },
};

// Reminders API
export const remindersAPI = {
  /**
   * Get all reminders for a user
   */
  getAll: async (userId: string) => {
    const response = await api.get(`/api/reminders/${userId}`);
    return response.data;
  },

  /**
   * Create a new reminder
   */
  create: async (
    userId: string,
    guideId: string,
    reminderType: string,
    scheduledFor: string,
    title: string,
    message: string | null = null
  ) => {
    const response = await api.post('/api/reminders', {
      userId,
      guideId,
      reminderType,
      scheduledFor,
      title,
      message,
    });
    return response.data;
  },

  /**
   * Delete a reminder
   */
  delete: async (reminderId: string) => {
    const response = await api.delete(`/api/reminders/${reminderId}`);
    return response.data;
  },
};

// TheMealDB API - Direct API calls (no auth needed)
import {
  getCachedPopularRecipes,
  setCachedPopularRecipes,
  getCachedRecipeDetail,
  setCachedRecipeDetail,
  getCachedRandomMeals,
  setCachedRandomMeals,
} from './recipeCache';

const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export const mealDBAPI = {
  /**
   * Get a single random meal
   */
  getRandomMeal: async () => {
    const response = await axios.get(`${MEALDB_BASE_URL}/random.php`, {
      timeout: 10000,
    });
    return response.data.meals?.[0] || null;
  },

  /**
   * Get multiple random meals (with caching)
   */
  getRandomMeals: async (count: number = 3) => {
    // Check cache first
    const cached = await getCachedRandomMeals(count);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const promises = Array.from({ length: count }, () =>
      axios.get(`${MEALDB_BASE_URL}/random.php`, { timeout: 10000 })
    );
    const responses = await Promise.all(promises);
    const meals = responses
      .map((res) => res.data.meals?.[0])
      .filter((meal) => meal !== null && meal !== undefined);

    // Cache the results
    if (meals.length > 0) {
      await setCachedRandomMeals(count, meals);
    }

    return meals;
  },

  /**
   * Search meals by name
   */
  searchByName: async (name: string) => {
    const response = await axios.get(`${MEALDB_BASE_URL}/search.php?s=${encodeURIComponent(name)}`, {
      timeout: 10000,
    });
    return response.data.meals || [];
  },

  /**
   * List all meals by first letter
   */
  searchByFirstLetter: async (letter: string) => {
    const response = await axios.get(`${MEALDB_BASE_URL}/search.php?f=${letter}`, {
      timeout: 10000,
    });
    return response.data.meals || [];
  },

  /**
   * Lookup full meal details by ID (with caching)
   */
  getMealById: async (id: string) => {
    // Check cache first
    const cached = await getCachedRecipeDetail(id);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await axios.get(`${MEALDB_BASE_URL}/lookup.php?i=${id}`, {
      timeout: 10000,
    });
    const meal = response.data.meals?.[0] || null;

    // Cache the result
    if (meal) {
      await setCachedRecipeDetail(id, meal);
    }

    return meal;
  },

  /**
   * Transform TheMealDB meal to app format
   */
  transformMeal: (meal: any) => {
    if (!meal) return null;

    // Extract ingredients and measurements
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(measure ? `${measure} ${ingredient}` : ingredient);
      }
    }

    // Extract instructions (split by newlines, carriage returns, or periods)
    const instructions = meal.strInstructions
      ? meal.strInstructions
          .split(/\r\n|\n|\. /)
          .map((step: string) => step.trim())
          .filter((step: string) => step.length > 0)
          .map((step: string) => {
            // Ensure each step ends with a period if it doesn't already
            if (step && !step.endsWith('.') && !step.endsWith('!') && !step.endsWith('?')) {
              return step + '.';
            }
            return step;
          })
      : [];

    // Estimate cooking time (TheMealDB doesn't provide this, so we'll use a default)
    const estimatedTime = '30 MIN';

    // Estimate difficulty (TheMealDB doesn't provide this)
    const estimatedDifficulty = 'EASY';

    // Generate a rating (TheMealDB doesn't provide ratings, so we'll use a random one between 4.5-5.0)
    const rating = (4.5 + Math.random() * 0.5).toFixed(1);

    return {
      id: meal.idMeal,
      title: meal.strMeal || 'Untitled Recipe',
      time: estimatedTime,
      difficulty: estimatedDifficulty,
      rating: parseFloat(rating),
      imageUrl: meal.strMealThumb || meal.strMealThumb,
      category: meal.strCategory || 'General',
      area: meal.strArea || '',
      instructions,
      ingredients,
      source: meal.strSource || null,
      youtube: meal.strYoutube || null,
      tags: meal.strTags ? meal.strTags.split(',').map((tag: string) => tag.trim()) : [],
    };
  },

  /**
   * Get complete recipe details in transformed format (from cache or API)
   * This ensures all recipe data is available for meal planner and recipe details
   */
  getCompleteRecipeDetails: async (id: string) => {
    // Get raw meal data from cache or API
    const meal = await mealDBAPI.getMealById(id);
    if (!meal) return null;
    
    // Transform to app format
    return mealDBAPI.transformMeal(meal);
  },
};

// Recipe API
export const recipeAPI = {
  /**
   * Generate quick recipe based on preferences (Premium only)
   */
  generateQuick: async (
    mealType: string,
    servings: string,
    vibe: string,
    cuisine: string,
    spiceLevel: string,
    userId: string
  ) => {
    const response = await api.post('/api/recipes/quick-generate', {
      mealType,
      servings,
      vibe,
      cuisine,
      spiceLevel,
      userId,
    }, {
      timeout: 60000,
    });
    
    // Cache generated recipes
    if (response.data.recipes && Array.isArray(response.data.recipes)) {
      for (const recipe of response.data.recipes) {
        try {
          await cacheRecipe(recipe);
        } catch (error) {
          console.error('Failed to cache generated recipe:', error);
        }
      }
    }
    
    return response.data;
  },

  /**
   * Generate recipes from ingredients (Premium only)
   */
  generateFromIngredients: async (
    ingredients: string,
    dietary: string[],
    mealType: string,
    servings: string,
    cookingTime: string,
    skillLevel: string,
    userId: string
  ) => {
    const response = await api.post('/api/recipes/from-ingredients', {
      ingredients,
      dietary,
      mealType,
      servings,
      cookingTime,
      skillLevel,
      userId,
    }, {
      timeout: 60000,
    });
    
    // Cache generated recipes
    if (response.data.recipes && Array.isArray(response.data.recipes)) {
      for (const recipe of response.data.recipes) {
        try {
          await cacheRecipe(recipe);
        } catch (error) {
          console.error('Failed to cache generated recipe:', error);
        }
      }
    }
    
    return response.data;
  },

  /**
   * Save user's selected recipe to database (Premium only)
   */
  saveSelected: async (recipe: any, userId: string, metadata: any) => {
    const response = await api.post('/api/recipes/save-selected', {
      recipe,
      userId,
      metadata,
    }, {
      timeout: 10000,
    });
    
    // Cache saved recipe
    const savedRecipe = response.data.recipe || response.data.guide || response.data;
    if (savedRecipe) {
      try {
        await cacheRecipe(savedRecipe);
      } catch (error) {
        console.error('Failed to cache saved recipe:', error);
      }
    }
    
    // Ensure backward compatibility
    const data = response.data;
    if (data.recipe && !data.guide) {
      data.guide = data.recipe;
    }
    
    return data;
  },
};

// Activity API
export const activityAPI = {
  /**
   * Generate activities from materials (Premium only)
   */
  generateFromMaterials: async (
    materials: string[],
    activityType: string,
    timeAvailable: string,
    skillLevel: string,
    userId: string
  ) => {
    const response = await api.post('/api/activities/from-materials', {
      materials,
      activityType,
      timeAvailable,
      skillLevel,
      userId,
    }, {
      timeout: 60000,
    });
    return response.data;
  },

  /**
   * Save user's selected activity to database (Premium only)
   */
  saveSelected: async (activity: any, userId: string, metadata: any) => {
    const response = await api.post('/api/activities/save-selected', {
      activity,
      userId,
      metadata,
    }, {
      timeout: 10000,
    });
    return response.data;
  },
};

// Meal Planner API (if exists)
export const mealPlannerAPI = {
  /**
   * Get meal plan for a date range
   */
  getMealPlan: async (userId: string, startDate: string, endDate: string) => {
    const response = await api.get(`/api/meal-planner/${userId}?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  /**
   * Add guide to meal plan
   */
  addToMealPlan: async (userId: string, guideId: string, date: string, mealType: string) => {
    const response = await api.post('/api/meal-planner', {
      userId,
      guideId,
      date,
      mealType,
    });
    return response.data;
  },

  /**
   * Remove guide from meal plan
   */
  removeFromMealPlan: async (userId: string, guideId: string, date: string, mealType: string) => {
    const response = await api.delete(`/api/meal-planner/${userId}`, {
      data: { guideId, date, mealType },
    });
    return response.data;
  },
};

// Activity Plans API
export const activityPlansAPI = {
  /**
   * Get activity plans for a date range
   */
  getActivityPlans: async (userId: string, startDate: string, endDate: string) => {
    const response = await api.get(`/api/activity-plans/${userId}?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  /**
   * Add activity to plan
   */
  addToActivityPlan: async (userId: string, guideId: string, date: string, time: string) => {
    const response = await api.post('/api/activity-plans', {
      userId,
      guideId,
      date,
      time,
    });
    return response.data;
  },

  /**
   * Remove activity from plan
   */
  removeFromActivityPlan: async (userId: string, guideId: string, date: string) => {
    const response = await api.delete(`/api/activity-plans/${userId}`, {
      data: { guideId, date },
    });
    return response.data;
  },
};

export default api;
