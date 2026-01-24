import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  loadIngredients: () => Promise<void>;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIngredient: (id: string, updates: Partial<Omit<Ingredient, 'id' | 'createdAt'>>) => Promise<void>;
  removeIngredient: (id: string) => Promise<void>;
  clearAllIngredients: () => Promise<void>;
}

const STORAGE_KEY = 'ingredients-box';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useIngredientsStore = create<IngredientsState>((set, get) => ({
  ingredients: [],
  isLoading: false,

  loadIngredients: async () => {
    try {
      set({ isLoading: true });
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const ingredients = data ? JSON.parse(data) : [];
      set({ ingredients, isLoading: false });
    } catch (error) {
      console.error('Error loading ingredients:', error);
      set({ ingredients: [], isLoading: false });
    }
  },

  addIngredient: async (ingredientData) => {
    try {
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

  updateIngredient: async (id, updates) => {
    try {
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

  removeIngredient: async (id: string) => {
    try {
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
