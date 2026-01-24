import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

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
  loadMeals: () => Promise<void>;
  addMeal: (meal: Omit<Meal, 'id' | 'createdAt'>) => Promise<void>;
  removeMeal: (mealId: string) => Promise<void>;
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

  loadMeals: async () => {
    try {
      set({ isLoading: true });
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const meals = data ? JSON.parse(data) : [];
      set({ meals, isLoading: false });
    } catch (error) {
      console.error('Error loading meals:', error);
      set({ meals: [], isLoading: false });
    }
  },

  addMeal: async (mealData) => {
    try {
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

  removeMeal: async (mealId: string) => {
    try {
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
