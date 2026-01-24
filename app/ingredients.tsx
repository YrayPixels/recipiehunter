import { useRouter } from 'expo-router';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FlatList, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { ChevronLeft, Search, X, Plus, Edit2, Trash2, Zap } from 'react-native-feather';
import { useIngredientsStore, Ingredient } from '../src/lib/stores/ingredientsStore';
import { Text } from '../src/components/Text';
import { Input } from '../src/components/Input';
import { useMealPlannerStore } from '../src/lib/stores/mealPlannerStore';
import { AddIngredientSheet } from '../src/components/AddIngredientSheet';

export default function IngredientsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '' });
  const [showExtractModal, setShowExtractModal] = useState(false);
  const addIngredientSheetRef = useRef<BottomSheet>(null);

  const {
    ingredients,
    isLoading,
    loadIngredients,
    addIngredient,
    updateIngredient,
    removeIngredient,
  } = useIngredientsStore();

  const { meals } = useMealPlannerStore();

  useEffect(() => {
    loadIngredients();
  }, []);

  // Filter ingredients based on search
  const filteredIngredients = useMemo(() => {
    if (!searchQuery.trim()) return ingredients;
    const query = searchQuery.toLowerCase();
    return ingredients.filter(
      (ing) =>
        ing.name.toLowerCase().includes(query) ||
        ing.quantity?.toLowerCase().includes(query) ||
        ing.category?.toLowerCase().includes(query)
    );
  }, [ingredients, searchQuery]);

  // Extract unique ingredients from meal planner
  const extractFromMealPlanner = () => {
    const allIngredients = new Set<string>();
    meals.forEach((meal) => {
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach((ing) => {
          if (typeof ing === 'string' && ing.trim()) {
            allIngredients.add(ing.trim());
          }
        });
      }
    });

    return Array.from(allIngredients);
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.name.trim()) return;

    try {
      await addIngredient({
        name: newIngredient.name.trim(),
        quantity: newIngredient.quantity.trim() || undefined,
      });
      setNewIngredient({ name: '', quantity: '' });
      addIngredientSheetRef.current?.close();
    } catch (error) {
      console.error('Error adding ingredient:', error);
    }
  };

  const handleUpdateIngredient = async () => {
    if (!editingIngredient || !newIngredient.name.trim()) return;

    try {
      await updateIngredient(editingIngredient.id, {
        name: newIngredient.name.trim(),
        quantity: newIngredient.quantity.trim() || undefined,
      });
      setEditingIngredient(null);
      setNewIngredient({ name: '', quantity: '' });
      addIngredientSheetRef.current?.close();
    } catch (error) {
      console.error('Error updating ingredient:', error);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setNewIngredient({
      name: ingredient.name,
      quantity: ingredient.quantity || '',
    });
    addIngredientSheetRef.current?.expand();
  };

  const handleExtractFromMeals = async () => {
    const extracted = extractFromMealPlanner();
    if (extracted.length === 0) {
      setShowExtractModal(false);
      return;
    }

    try {
      for (const ingName of extracted) {
        await addIngredient({ name: ingName });
      }
      setShowExtractModal(false);
    } catch (error) {
      console.error('Error extracting ingredients:', error);
    }
  };

  const generateRecipe = async () => {
    if (filteredIngredients.length === 0) return;

    const ingredientList = filteredIngredients.map((i) => i.name).join(', ');

    router.push({
      pathname: '/add-guide',
      params: {
        mode: 'ingredients',
        ingredients: ingredientList,
      },
    });
  };

  if (isLoading && ingredients.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4E95A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top', 'bottom']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-start mb-4">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft width={24} height={24} color="#313131" />
            </TouchableOpacity>
            <Text className="text-xl font-bold space-bold" style={{ color: '#313131' }}>
              Ingredient Box
            </Text>
          </View>

          {/* Search Bar */}
          <View className="mb-4">
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search ingredients..."
              leftIcon={<Search width={20} height={20} color="#9CA3AF" />}
              rightIcon={
                searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X width={20} height={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ) : undefined
              }
              variant="filled"
            />
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => {
                setEditingIngredient(null);
                setNewIngredient({ name: '', quantity: '' });
                addIngredientSheetRef.current?.expand();
              }}
              className="flex-1 bg-brand-green rounded-3xl py-3 items-center"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <Plus width={20} height={20} color="#313131" />
                <Text className="ml-2 text-base font-semibold space-semibold" style={{ color: '#313131' }}>
                  Add Ingredient
                </Text>
              </View>
            </TouchableOpacity>

            {meals.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowExtractModal(true)}
                className="bg-brand-pink rounded-3xl py-3 px-4 items-center"
                activeOpacity={0.8}
              >
                <Zap width={20} height={20} color="#313131" />
              </TouchableOpacity>
            )}
          </View>

          {/* Generate Recipe Button */}
          {filteredIngredients.length > 0 && (
            <TouchableOpacity
              onPress={generateRecipe}
              className="bg-brand-pink rounded-3xl py-4 mb-4 items-center"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center">
                <Zap width={20} height={20} color="#313131" />
                <Text className="ml-2 text-base font-semibold space-semibold" style={{ color: '#313131' }}>
                  Generate Recipe ({filteredIngredients.length} ingredients)
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Ingredients List */}
        <FlatList
          data={filteredIngredients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View
              className="bg-white rounded-3xl p-4 mb-3 flex-row items-center justify-between"
              style={{ borderWidth: 1, borderColor: '#E5E5E5' }}
            >
              <View className="flex-1">
                <Text className="text-base font-semibold space-semibold mb-1" style={{ color: '#313131' }}>
                  {item.name}
                </Text>
                {item.quantity && (
                  <Text className="text-sm space-regular" style={{ color: '#666' }}>
                    {item.quantity}
                  </Text>
                )}
              </View>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
                  className="bg-gray-100 rounded-xl p-2"
                  activeOpacity={0.7}
                >
                  <Edit2 width={18} height={18} color="#313131" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeIngredient(item.id)}
                  className="bg-red-100 rounded-xl p-2"
                  activeOpacity={0.7}
                >
                  <Trash2 width={18} height={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-lg space-medium mb-2" style={{ color: '#666' }}>
                {searchQuery ? 'No ingredients found' : 'No ingredients yet'}
              </Text>
              <Text className="text-sm space-regular text-center" style={{ color: '#999' }}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add ingredients to your box to generate recipes'}
              </Text>
            </View>
          }
        />
      </View>

      {/* Add/Edit Bottom Sheet */}
      <AddIngredientSheet
        bottomSheetRef={addIngredientSheetRef}
        editingIngredient={editingIngredient}
        newIngredient={newIngredient}
        onIngredientChange={setNewIngredient}
        onSave={editingIngredient ? handleUpdateIngredient : handleAddIngredient}
        onClose={() => {
          setEditingIngredient(null);
          setNewIngredient({ name: '', quantity: '' });
        }}
      />

      {/* Extract from Meal Planner Modal */}
      <Modal
        visible={showExtractModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExtractModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm" style={{ backgroundColor: '#F6FBDE' }}>
            <Text className="text-xl font-bold space-bold mb-2" style={{ color: '#313131' }}>
              Extract from Meal Planner
            </Text>
            <Text className="text-sm space-regular mb-6" style={{ color: '#666' }}>
              Add all ingredients from your planned meals to your ingredient box?
            </Text>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleExtractFromMeals}
                className="bg-brand-green rounded-3xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold space-semibold" style={{ color: '#313131' }}>
                  Extract All ({extractFromMealPlanner().length} ingredients)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowExtractModal(false)}
                className="bg-gray-200 rounded-3xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-base font-semibold space-semibold" style={{ color: '#313131' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
