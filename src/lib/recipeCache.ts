// Recipe caching utility using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'mealdb_cache_';
const CACHE_KEYS = {
  POPULAR_RECIPES: `${CACHE_PREFIX}popular_recipes`,
  RECIPE_DETAIL: (id: string) => `${CACHE_PREFIX}recipe_${id}`,
  RANDOM_MEALS: (count: number) => `${CACHE_PREFIX}random_${count}`,
};

// Cache TTL in milliseconds
const CACHE_TTL = {
  POPULAR_RECIPES: 60 * 60 * 1000, // 1 hour - popular recipes change frequently
  RECIPE_DETAIL: 24 * 60 * 60 * 1000, // 24 hours - recipe details don't change
  RANDOM_MEALS: 60 * 60 * 1000, // 1 hour - random meals
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
