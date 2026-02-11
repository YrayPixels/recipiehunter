import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ingredientsAPI } from '../api';

export interface Ingredient {
  id: string;
  name: string;
  quantity?: string;
  expirationDate?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

interface IngredientsState {
  ingredients: Ingredient[];
  isLoading: boolean;
  loadIngredients: (userId?: string) => Promise<void>;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>, userId?: string) => Promise<void>;
  updateIngredient: (id: string, updates: Partial<Omit<Ingredient, 'id' | 'createdAt'>>, userId?: string) => Promise<void>;
  removeIngredient: (id: string, userId?: string) => Promise<void>;
  clearAllIngredients: () => Promise<void>;
}

const STORAGE_KEY = 'ingredients-box';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useIngredientsStore = create<IngredientsState>((set, get) => ({
  ingredients: [],
  isLoading: false,

  loadIngredients: async (userId?: string) => {
    try {
      set({ isLoading: true });

      // Try to load from backend first if userId is provided
      if (userId) {
        try {
          const response = await ingredientsAPI.getAll(userId);
          if (response.success && response.ingredients) {
            // Transform backend ingredients to local format
            const transformedIngredients: Ingredient[] = response.ingredients.map((ing: any) => ({
              id: ing.id,
              name: ing.name,
              quantity: ing.quantity,
              expirationDate: ing.expirationDate,
              category: ing.category,
              createdAt: ing.createdAt,
              updatedAt: ing.updatedAt,
            }));

            // Save to local storage for offline access
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transformedIngredients));
            set({ ingredients: transformedIngredients, isLoading: false });
            return;
          }
        } catch (error) {
          console.log('Backend unavailable, loading from local storage');
        }
      }

      // Fallback to local storage
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const ingredients = data ? JSON.parse(data) : [];
      set({ ingredients, isLoading: false });
    } catch (error) {
      console.error('Error loading ingredients:', error);
      set({ ingredients: [], isLoading: false });
    }
  },

  addIngredient: async (ingredientData, userId?: string) => {
    try {
      // Try to save to backend first if userId is provided
      if (userId) {
        try {
          const response = await ingredientsAPI.addIngredient(
            userId,
            ingredientData.name,
            ingredientData.quantity,
            undefined, // unit
            ingredientData.category,
            ingredientData.expirationDate,
            undefined, // location
            undefined // notes
          );

          if (response.success && response.ingredient) {
            // Transform backend ingredient to local format
            const newIngredient: Ingredient = {
              id: response.ingredient.id,
              name: response.ingredient.name,
              quantity: response.ingredient.quantity,
              expirationDate: response.ingredient.expirationDate,
              category: response.ingredient.category,
              createdAt: response.ingredient.createdAt,
              updatedAt: response.ingredient.updatedAt,
            };

            const currentIngredients = get().ingredients;
            // Check if ingredient already exists (case-insensitive)
            const existingIndex = currentIngredients.findIndex(
              (i) => i.name.toLowerCase() === ingredientData.name.toLowerCase()
            );

            let updatedIngredients: Ingredient[];
            if (existingIndex >= 0) {
              updatedIngredients = [...currentIngredients];
              updatedIngredients[existingIndex] = newIngredient;
            } else {
              updatedIngredients = [...currentIngredients, newIngredient];
            }

            // Save to local storage
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIngredients));
            set({ ingredients: updatedIngredients });
            return;
          }
        } catch (error) {
          console.log('Backend unavailable, saving locally only');
        }
      }

      // Fallback to local storage only
      const now = new Date().toISOString();
      const newIngredient: Ingredient = {
        ...ingredientData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const currentIngredients = get().ingredients;
      // Check if ingredient already exists (case-insensitive)
      const existingIndex = currentIngredients.findIndex(
        (i) => i.name.toLowerCase() === ingredientData.name.toLowerCase()
      );

      let updatedIngredients: Ingredient[];
      if (existingIndex >= 0) {
        // Update existing ingredient
        updatedIngredients = [...currentIngredients];
        updatedIngredients[existingIndex] = {
          ...updatedIngredients[existingIndex],
          ...ingredientData,
          updatedAt: now,
        };
      } else {
        // Add new ingredient
        updatedIngredients = [...currentIngredients, newIngredient];
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIngredients));
      set({ ingredients: updatedIngredients });
    } catch (error) {
      console.error('Error adding ingredient:', error);
      throw error;
    }
  },

  updateIngredient: async (id, updates, userId?: string) => {
    try {
      // Try to update in backend first if userId is provided
      if (userId) {
        try {
          await ingredientsAPI.updateIngredient(id, updates, userId);
        } catch (error) {
          console.log('Backend unavailable, updating locally only');
        }
      }

      // Update local storage
      const currentIngredients = get().ingredients;
      const updatedIngredients = currentIngredients.map((ingredient) =>
        ingredient.id === id
          ? { ...ingredient, ...updates, updatedAt: new Date().toISOString() }
          : ingredient
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIngredients));
      set({ ingredients: updatedIngredients });
    } catch (error) {
      console.error('Error updating ingredient:', error);
      throw error;
    }
  },

  removeIngredient: async (id: string, userId?: string) => {
    try {
      // Try to delete from backend first if userId is provided
      if (userId) {
        try {
          await ingredientsAPI.deleteIngredient(id, userId);
        } catch (error) {
          console.log('Backend unavailable, removing locally only');
        }
      }

      // Remove from local storage
      const currentIngredients = get().ingredients;
      const updatedIngredients = currentIngredients.filter((i) => i.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIngredients));
      set({ ingredients: updatedIngredients });
    } catch (error) {
      console.error('Error removing ingredient:', error);
      throw error;
    }
  },

  clearAllIngredients: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      set({ ingredients: [] });
    } catch (error) {
      console.error('Error clearing ingredients:', error);
      throw error;
    }
  },
}));
