// Recipe caching utility using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'mealdb_cache_';
const CACHE_KEYS = {
  POPULAR_RECIPES: `${CACHE_PREFIX}popular_recipes`,
  RECIPE_DETAIL: (id: string) => `${CACHE_PREFIX}recipe_${id}`,
  RANDOM_MEALS: (count: number) => `${CACHE_PREFIX}random_${count}`,
  SEARCH_RESULTS: (query: string) => `${CACHE_PREFIX}search_${query.toLowerCase().replace(/\s+/g, '_')}`,
};

// Cache TTL in milliseconds
const CACHE_TTL = {
  POPULAR_RECIPES: 60 * 60 * 1000, // 1 hour - popular recipes change frequently
  RECIPE_DETAIL: 24 * 60 * 60 * 1000, // 24 hours - recipe details don't change
  RANDOM_MEALS: 60 * 60 * 1000, // 1 hour - random meals
  SEARCH_RESULTS: 60 * 60 * 1000, // 1 hour - search results
};

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid<T>(cached: CachedData<T> | null): cached is CachedData<T> {
  if (!cached) return false;
  const age = Date.now() - cached.timestamp;
  return age < cached.ttl;
}

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cachedString = await AsyncStorage.getItem(key);
    if (!cachedString) return null;

    const cached: CachedData<T> = JSON.parse(cachedString);
    
    if (isCacheValid(cached)) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached.data;
    } else {
      console.log(`⏰ Cache EXPIRED: ${key}`);
      // Remove expired cache
      await AsyncStorage.removeItem(key);
      return null;
    }
  } catch (error) {
    console.error(`Error reading cache for ${key}:`, error);
    // Clear corrupted cache
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Set cached data
 */
export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cached));
    console.log(`💾 Cache SET: ${key}`);
  } catch (error) {
    console.error(`Error setting cache for ${key}:`, error);
  }
}

/**
 * Clear all recipe caches
 */
export async function clearRecipeCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`🗑️ Cleared ${cacheKeys.length} cache entries`);
  } catch (error) {
    console.error('Error clearing recipe cache:', error);
  }
}

/**
 * Get cached popular recipes
 */
export async function getCachedPopularRecipes() {
  return getCached(CACHE_KEYS.POPULAR_RECIPES);
}

/**
 * Set cached popular recipes
 */
export async function setCachedPopularRecipes(data: any[]) {
  return setCached(CACHE_KEYS.POPULAR_RECIPES, data, CACHE_TTL.POPULAR_RECIPES);
}

/**
 * Get cached recipe detail
 */
export async function getCachedRecipeDetail(id: string) {
  return getCached(CACHE_KEYS.RECIPE_DETAIL(id));
}

/**
 * Set cached recipe detail
 */
export async function setCachedRecipeDetail(id: string, data: any) {
  return setCached(CACHE_KEYS.RECIPE_DETAIL(id), data, CACHE_TTL.RECIPE_DETAIL);
}

/**
 * Get cached random meals
 */
export async function getCachedRandomMeals(count: number) {
  return getCached(CACHE_KEYS.RANDOM_MEALS(count));
}

/**
 * Set cached random meals
 */
export async function setCachedRandomMeals(count: number, data: any[]) {
  return setCached(CACHE_KEYS.RANDOM_MEALS(count), data, CACHE_TTL.RANDOM_MEALS);
}

/**
 * Get all cached recipes (not expired)
 */
export async function getAllCachedRecipes(): Promise<any[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    // Filter for recipe detail keys (mealdb_cache_recipe_*)
    const recipeDetailPrefix = `${CACHE_PREFIX}recipe_`;
    const recipeKeys = keys.filter(key => 
      key.startsWith(recipeDetailPrefix) && 
      key !== CACHE_KEYS.POPULAR_RECIPES &&
      !key.includes('random_')
    );
    
    // Get all valid (non-expired) cached recipes
    const recipes: any[] = [];
    for (const key of recipeKeys) {
      const cached = await getCached(key);
      if (cached) {
        recipes.push(cached);
      }
    }
    
    console.log(`📦 Retrieved ${recipes.length} cached recipes`);
    return recipes;
  } catch (error) {
    console.error('Error getting all cached recipes:', error);
    return [];
  }
}

/**
 * Count all cached recipe details
 */
export async function countCachedRecipes(): Promise<number> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    // Filter for recipe detail keys (mealdb_cache_recipe_*)
    // Recipe detail keys follow the pattern: mealdb_cache_recipe_{id}
    const recipeDetailPrefix = `${CACHE_PREFIX}recipe_`;
    const recipeKeys = keys.filter(key => 
      key.startsWith(recipeDetailPrefix) && 
      key !== CACHE_KEYS.POPULAR_RECIPES &&
      !key.includes('random_')
    );
    
    // Count only valid (non-expired) cached recipes
    let count = 0;
    for (const key of recipeKeys) {
      const cached = await getCached(key);
      if (cached) {
        count++;
      }
    }
    
    return count;
  } catch (error) {
    console.error('Error counting cached recipes:', error);
    return 0;
  }
}

/**
 * Cache a recipe (for generated/added recipes)
 */
export async function cacheRecipe(recipe: any): Promise<void> {
  try {
    if (!recipe.id) {
      console.warn('Cannot cache recipe without id');
      return;
    }
    
    // Store the recipe with a long TTL since it's user-generated
    await setCached(
      CACHE_KEYS.RECIPE_DETAIL(recipe.id), 
      recipe, 
      365 * 24 * 60 * 60 * 1000 // 1 year TTL for user recipes
    );
    console.log(`💾 Cached recipe: ${recipe.title || recipe.id}`);
  } catch (error) {
    console.error('Error caching recipe:', error);
  }
}

/**
 * Get cached search results
 */
export async function getCachedSearchResults(query: string) {
  if (!query || query.trim().length === 0) return null;
  return getCached(CACHE_KEYS.SEARCH_RESULTS(query));
}

/**
 * Set cached search results
 */
export async function setCachedSearchResults(query: string, results: any[]) {
  if (!query || query.trim().length === 0) return;
  
  // Also cache individual recipe details
  for (const result of results) {
    if (result.idMeal) {
      await setCachedRecipeDetail(result.idMeal, result);
    }
  }
  
  return setCached(CACHE_KEYS.SEARCH_RESULTS(query), results, CACHE_TTL.SEARCH_RESULTS);
}
