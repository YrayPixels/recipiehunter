import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { ChevronLeft, Plus, Trash2, ShoppingCart, X } from 'react-native-feather';
import { shoppingAPI, guidesAPI, mealDBAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';
import { Text } from '../src/components/Text';
import { Alert } from '../src/components/Alert';
import { CreateListSheet } from '../src/components/shopping/CreateListSheet';
import { AddItemSheet } from '../src/components/shopping/AddItemSheet';
import { CreateFromRecipeSheet } from '../src/components/shopping/CreateFromRecipeSheet';
import { CreateFromMealPlanSheet } from '../src/components/shopping/CreateFromMealPlanSheet';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { useIngredientsStore } from '../src/lib/stores/ingredientsStore';
import { useMealPlannerStore } from '../src/lib/stores/mealPlannerStore';
import { getAllCachedRecipes } from '../src/lib/recipeCache';

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingItem[];
  created_at: string;
}

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  quantity?: string;
  category?: string;
}

export default function ShoppingScreen() {
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<ShoppingList | null>(null);
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [mealPlanIngredients, setMealPlanIngredients] = useState<{ name: string; quantity?: string }[]>([]);
  const [loadingMealPlan, setLoadingMealPlan] = useState(false);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  // Get user's ingredients from store
  const { ingredients: userIngredients, loadIngredients } = useIngredientsStore();
  const { meals } = useMealPlannerStore();

  // Bottom sheets
  const createListSheetRef = useRef<BottomSheet>(null);
  const addItemSheetRef = useRef<BottomSheet>(null);
  const createFromGuideSheetRef = useRef<BottomSheet>(null);
  const createFromMealPlanSheetRef = useRef<BottomSheet>(null);

  // Form states
  const [newListName, setNewListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');

  // Helper function to show alert
  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[]
  ) => {
    setAlertConfig({ title, message, type, buttons });
    setAlertVisible(true);
  };

  const loadUserId = async () => {
    const id = await getUserId();
    setUserId(id);
    setLoading(false);
  };

  const loadShoppingLists = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await shoppingAPI.getAll(userId);
      setLists(data.lists || []);
      // Auto-expand all lists
      const allListIds = new Set<string>((data.lists || []).map((l: ShoppingList) => l.id));
      setExpandedLists(allListIds);
    } catch (error) {
      console.error('Error loading shopping lists:', error);
      showAlert('Error', 'Failed to load shopping lists', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserId();
    loadIngredients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userId) {
      loadShoppingLists();
    }
  }, [userId, loadShoppingLists]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShoppingLists();
    setRefreshing(false);
  };

  const loadMyRecipes = async () => {
    if (!userId) return;

    try {
      setLoadingRecipes(true);

      // Load from both backend and cache
      let backendRecipes: any[] = [];
      let cachedRecipes: any[] = [];

      // Try to load from backend
      try {
        const data = await guidesAPI.getAll(userId, { type: 'recipe' }, null, 0);
        backendRecipes = data.guides || [];
      } catch {
        console.log('Backend unavailable, loading from cache only');
      }

      // Load cached recipes
      try {
        const cached = await getAllCachedRecipes();
        // Transform cached recipes to match expected format
        cachedRecipes = cached.map((recipe: any) => ({
          id: recipe.id || recipe.idMeal || `cached_${Date.now()}_${Math.random()}`,
          title: recipe.title || recipe.strMeal || 'Untitled Recipe',
          type: 'recipe',
          category: recipe.category,
          summary: recipe.summary || recipe.strInstructions?.substring(0, 100),
          image_url: recipe.image_url || recipe.strMealThumb || recipe.thumbnailUrl,
        }));
      } catch (error) {
        console.error('Error loading cached recipes:', error);
      }

      // Merge backend and cached recipes, avoiding duplicates
      const allRecipes = [...backendRecipes];
      const backendIds = new Set(backendRecipes.map((r: any) => r.id));

      // Add cached recipes that aren't already in backend
      for (const cached of cachedRecipes) {
        if (!backendIds.has(cached.id)) {
          allRecipes.push(cached);
        }
      }

      console.log(`📚 Loaded ${backendRecipes.length} backend + ${cachedRecipes.length} cached = ${allRecipes.length} total recipes for shopping`);
      setMyRecipes(allRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
      setMyRecipes([]);
    } finally {
      setLoadingRecipes(false);
    }
  };

  const toggleListExpanded = (listId: string) => {
    setExpandedLists(prev => {
      const newSet = new Set(prev);
      if (newSet.has(listId)) {
        newSet.delete(listId);
      } else {
        newSet.add(listId);
      }
      return newSet;
    });
  };

  const toggleItem = async (listId: string, itemId: string, checked: boolean) => {
    if (!userId) return;

    try {
      const list = lists.find(l => l.id === listId);
      if (!list) return;

      const updatedItems = list.items.map(item =>
        item.id === itemId ? { ...item, checked: !checked } : item
      );

      await shoppingAPI.update(listId, { items: updatedItems });
      await loadShoppingLists();
    } catch (error) {
      console.error('Error updating item:', error);
      showAlert('Error', 'Failed to update item', 'error');
    }
  };

  const handleCreateList = async () => {
    if (!userId || !newListName.trim()) return;

    try {
      await shoppingAPI.create(userId, newListName.trim(), [], []);
      setNewListName('');
      createListSheetRef.current?.close();
      await loadShoppingLists();
    } catch (error) {
      console.error('Error creating list:', error);
      showAlert('Error', 'Failed to create shopping list', 'error');
    }
  };

  const handleAddItem = async () => {
    if (!selectedList || !newItemName.trim()) return;

    try {
      const newItem: ShoppingItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        checked: false,
        quantity: newItemQuantity.trim() || undefined,
      };

      const updatedItems = [...selectedList.items, newItem];
      await shoppingAPI.update(selectedList.id, { items: updatedItems });

      setNewItemName('');
      setNewItemQuantity('');
      addItemSheetRef.current?.close();
      setSelectedList(null);
      await loadShoppingLists();
    } catch (error) {
      console.error('Error adding item:', error);
      showAlert('Error', 'Failed to add item', 'error');
    }
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    try {
      const list = lists.find(l => l.id === listId);
      if (!list) return;

      const updatedItems = list.items.filter(item => item.id !== itemId);
      await shoppingAPI.update(listId, { items: updatedItems });
      await loadShoppingLists();
    } catch (error) {
      console.error('Error deleting item:', error);
      showAlert('Error', 'Failed to delete item', 'error');
    }
  };

  const handleDeleteList = async (listId: string) => {
    showAlert(
      'Delete List',
      'Are you sure you want to delete this shopping list?',
      'warning',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await shoppingAPI.delete(listId);
              await loadShoppingLists();
            } catch (error) {
              console.error('Error deleting list:', error);
              showAlert('Error', 'Failed to delete shopping list', 'error');
            }
          },
        },
      ]
    );
  };

  const handleCreateFromRecipe = async (recipeId: string) => {
    if (!userId) return;

    try {
      // Check if this is a cached recipe from TheMealDB (has numeric ID or cached_ prefix)
      const isMealDBRecipe = recipeId.startsWith('cached_') || !isNaN(Number(recipeId));

      if (isMealDBRecipe) {
        // For cached MealDB recipes, we need to fetch full details and create shopping list locally
        const meal = await mealDBAPI.getMealById(recipeId);
        if (meal) {
          const transformed = mealDBAPI.transformMeal(meal);
          if (transformed && transformed.ingredients) {
            // Parse ingredients and compare with user's ingredient box
            const ingredientsList = transformed.ingredients.map((ingredient: string, index: number) => {
              const trimmed = ingredient.trim();
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
                name: name || ingredient,
                quantity: quantity || undefined,
              };
            });

            // Compare with user's ingredient box
            const userIngredientsMap = new Map<string, { name: string; quantity?: string }>();
            (userIngredients || []).forEach(ing => {
              userIngredientsMap.set(ing.name.toLowerCase().trim(), ing);
            });

            // Filter out ingredients the user already has (in sufficient quantity)
            const itemsNeeded = ingredientsList.filter((ing, index) => {
              const key = ing.name.toLowerCase().trim();
              const userIng = userIngredientsMap.get(key);

              if (!userIng) {
                // User doesn't have this ingredient - need to buy
                return true;
              }

              // User has this ingredient - try to compare quantities
              const neededQty = parseQuantity(ing.quantity);
              const availableQty = parseQuantity(userIng.quantity);

              if (neededQty && availableQty && neededQty.unit === availableQty.unit) {
                // Same units - can compare
                if (availableQty.amount >= neededQty.amount) {
                  // User has enough - don't add to shopping list
                  return false;
                } else {
                  // User has some but not enough - add to shopping list
                  return true;
                }
              }

              // Can't compare quantities or different units - add to shopping list to be safe
              return true;
            }).map((ing, index) => ({
              id: `${recipeId}-${index}-${Date.now()}`,
              name: ing.name,
              checked: false,
              quantity: ing.quantity,
            }));

            if (itemsNeeded.length === 0) {
              showAlert(
                'All Ingredients Available!',
                'You already have all the ingredients for this recipe in your ingredient box.',
                'success'
              );
              createFromGuideSheetRef.current?.close();
              return;
            }

            // Create the shopping list with only needed items
            await shoppingAPI.create(
              userId,
              `${transformed.title} Ingredients`,
              itemsNeeded,
              [recipeId]
            );

            // Show success message with count
            const totalIngredients = ingredientsList.length;
            const alreadyHave = totalIngredients - itemsNeeded.length;
            if (alreadyHave > 0) {
              showAlert(
                'Shopping List Created',
                `Added ${itemsNeeded.length} items. You already have ${alreadyHave} ingredient${alreadyHave > 1 ? 's' : ''} in your box!`,
                'success'
              );
            }
          }
        }
      } else {
        // For backend recipes, use the standard API call
        await shoppingAPI.createFromGuide(userId, recipeId);
      }

      createFromGuideSheetRef.current?.close();
      await loadShoppingLists();
    } catch (error) {
      console.error('Error creating list from recipe:', error);
      showAlert('Error', 'Failed to create shopping list from recipe', 'error');
    }
  };

  // Helper function to parse quantity (same logic as CreateFromMealPlanSheet)
  const parseQuantity = (quantityStr?: string): { amount: number; unit: string } | null => {
    if (!quantityStr) return null;

    // Try to extract number and unit
    const match = quantityStr.match(/^([\d\/\.]+)\s*(.*)$/);
    if (match) {
      let amount = 0;
      const numStr = match[1];

      // Handle fractions like 1/2
      if (numStr.includes('/')) {
        const parts = numStr.split('/');
        amount = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else {
        amount = parseFloat(numStr);
      }

      const unit = match[2].trim().toLowerCase();
      return { amount, unit };
    }

    return null;
  };

  // Extract ingredients from meal plan
  const extractMealPlanIngredients = async () => {
    try {
      setLoadingMealPlan(true);

      // Calculate current week range
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);

      // Filter meals for current week
      const weekMeals = meals.filter((meal) => {
        try {
          const mealDate = parseISO(meal.date);
          return mealDate >= weekStart && mealDate <= weekEnd;
        } catch {
          return false;
        }
      });

      console.log('📅 Week meals found:', weekMeals.length);

      if (weekMeals.length === 0) {
        showAlert('No Meals', 'No meals found in your meal plan for this week. Please add some meals first.', 'info');
        setMealPlanIngredients([]);
        return [];
      }

      // Extract all ingredients with deduplication
      const ingredientMap = new Map<string, { name: string; quantity?: string; count: number }>();
      let totalIngredientsFound = 0;

      // Process each meal and try to get ingredients
      for (const meal of weekMeals) {
        console.log(`🍽️ Processing meal: ${meal.guideTitle}`);

        let ingredientsList: string[] = [];

        // First, try to get ingredients from the meal object itself
        if (meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
          ingredientsList = meal.ingredients;
          console.log(`  ✅ Found ${ingredientsList.length} ingredients stored in meal`);
        } else if (meal.guideId) {
          // If no ingredients stored, try to fetch from the guide/recipe
          console.log(`  ⚠️ No ingredients in meal, fetching from guide: ${meal.guideId}`);
          try {
            const guideData = await guidesAPI.getById(meal.guideId);
            if (guideData && guideData.ingredients && Array.isArray(guideData.ingredients)) {
              ingredientsList = guideData.ingredients;
              console.log(`  ✅ Fetched ${ingredientsList.length} ingredients from guide`);
            } else {
              console.log(`  ❌ Guide has no ingredients`);
            }
          } catch (error) {
            console.error(`  ❌ Error fetching guide ${meal.guideId}:`, error);
          }
        }

        // Process the ingredients
        ingredientsList.forEach((ingredient: string) => {
          const trimmed = ingredient.trim();
          if (!trimmed) return;

          totalIngredientsFound++;

          // Parse quantity and name
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

          const key = name.toLowerCase();

          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.count += 1;
            // Aggregate quantities if present
            if (quantity && existing.quantity && quantity !== existing.quantity) {
              existing.quantity = `${existing.quantity}, ${quantity}`;
            }
          } else {
            ingredientMap.set(key, {
              name,
              quantity,
              count: 1,
            });
          }
        });
      }

      console.log(`📊 Total ingredients found: ${totalIngredientsFound}`);
      console.log(`📊 Unique ingredients: ${ingredientMap.size}`);

      // Convert to array
      const ingredients = Array.from(ingredientMap.values()).map(info => ({
        name: info.name,
        quantity: info.quantity,
      }));

      if (ingredients.length === 0) {
        showAlert(
          'No Ingredients Found',
          'The meals in your plan don\'t have ingredient information. Try adding meals from your recipes that include ingredients.',
          'info'
        );
      }

      setMealPlanIngredients(ingredients);
      return ingredients;
    } catch (error) {
      console.error('Error extracting meal plan ingredients:', error);
      showAlert('Error', 'Failed to extract ingredients from meal plan', 'error');
      setMealPlanIngredients([]);
      return [];
    } finally {
      setLoadingMealPlan(false);
    }
  };

  const handleOpenMealPlanSheet = async () => {
    await extractMealPlanIngredients();
    createFromMealPlanSheetRef.current?.expand();
  };

  const handleCreateFromMealPlan = async (comparedIngredients?: { name: string; needed: string; available?: string; difference: string; displayNeed: string }[]) => {
    if (!userId) return;

    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const startDate = format(weekStart, 'yyyy-MM-dd');

      // If we have comparison data, create shopping list with only needed items
      if (comparedIngredients && comparedIngredients.length > 0) {
        // Filter to only items we need to buy (difference !== 'full')
        const itemsToBuy = comparedIngredients
          .filter(ing => ing.difference !== 'full')
          .map((ing, index) => ({
            id: `${Date.now()}-${index}`,
            name: ing.name,
            checked: false,
            quantity: ing.displayNeed !== 'as needed' ? ing.displayNeed : ing.needed,
            category: 'Meal Plan',
          }));

        // Create the list directly with filtered items
        const listName = `Shopping for ${format(weekStart, 'MMM d')}`;
        await shoppingAPI.create(userId, listName, itemsToBuy, []);
      } else {
        // Fallback to original method
        await shoppingAPI.createFromMealPlanWeek(userId, startDate);
      }

      createFromMealPlanSheetRef.current?.close();
      await loadShoppingLists();
    } catch (error) {
      console.error('Error creating list from meal plan:', error);
      showAlert('Error', 'Failed to create shopping list from meal plan', 'error');
    }
  };

  const openAddItemSheet = (list: ShoppingList) => {
    setSelectedList(list);
    addItemSheetRef.current?.expand();
  };

  const getCheckedCount = (items: ShoppingItem[]) => {
    return items.filter(item => item.checked).length;
  };

  const renderList = ({ item: list }: { item: ShoppingList }) => {
    const isExpanded = expandedLists.has(list.id);
    const checkedCount = getCheckedCount(list.items);
    const totalCount = list.items.length;
    const progress = totalCount > 0 ? checkedCount / totalCount : 0;

    return (
      <View className="bg-white rounded-3xl mb-4 overflow-hidden shadow-sm">
        {/* List Header */}
        <TouchableOpacity
          onPress={() => toggleListExpanded(list.id)}
          className="p-4 flex-row items-center justify-between"
          activeOpacity={0.7}
        >
          <View className="flex-1">
            <Text className="text-lg  space-bold mb-1" style={{ color: '#313131' }}>
              {list.name}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm space-regular mr-2" style={{ color: '#666' }}>
                {checkedCount} / {totalCount} items
              </Text>
              {totalCount > 0 && (
                <View className="flex-1 h-2 bg-gray-200 rounded-full mr-2 overflow-hidden">
                  <View
                    className="h-full bg-brand-green rounded-full"
                    style={{ width: `${progress * 100}%` }}
                  />
                </View>
              )}
            </View>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => openAddItemSheet(list)}
              className="p-2 mr-2"
              activeOpacity={0.7}
            >
              <Plus width={20} height={20} color="#313131" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteList(list.id)}
              className="p-2"
              activeOpacity={0.7}
            >
              <Trash2 width={20} height={20} color="#fddffd" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* List Items */}
        {isExpanded && (
          <View className="px-4 pb-4">
            {list.items.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-sm space-regular mb-3" style={{ color: '#666' }}>
                  No items yet
                </Text>
                <TouchableOpacity
                  onPress={() => openAddItemSheet(list)}
                  className="px-4 py-2 rounded-full"
                  style={{ backgroundColor: '#D4E95A' }}
                >
                  <Text className="text-sm font-semibold space-semibold" style={{ color: '#313131' }}>
                    Add Item
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              list.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleItem(list.id, item.id, item.checked)}
                  className="flex-row items-center py-3 border-b border-gray-100"
                  activeOpacity={0.7}
                >
                  <View
                    className={`w-6 h-6 rounded-full mr-3 items-center justify-center ${item.checked
                      ? 'bg-brand-green'
                      : 'border-2 border-gray-300'
                      }`}
                  >
                    {item.checked && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base space-regular ${item.checked
                        ? 'line-through text-gray-400'
                        : 'text-gray-900'
                        }`}
                    >
                      {item.name}
                    </Text>
                    {item.quantity && (
                      <Text className="text-sm space-regular mt-0.5" style={{ color: '#666' }}>
                        {item.quantity}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteItem(list.id, item.id)}
                    className="p-1 ml-2"
                    activeOpacity={0.7}
                  >
                    <X width={16} height={16} color="#fddffd" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading && lists.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4E95A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
                <ChevronLeft width={24} height={24} color="#313131" />
              </TouchableOpacity>
              <Text className="text-xl  space-bold" style={{ color: '#313131' }}>
                Shopping Lists
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => createListSheetRef.current?.expand()}
              className="px-4 py-2 rounded-full flex-row items-center"
              style={{ backgroundColor: '#D4E95A' }}
              activeOpacity={0.8}
            >
              <Plus width={20} height={20} color="#313131" />
              <Text className="ml-1 font-semibold space-semibold" style={{ color: '#313131' }}>
                New
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => {
                loadMyRecipes();
                createFromGuideSheetRef.current?.expand();
              }}
              className="flex-1 px-4 py-3 rounded-3xl bg-white flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <ShoppingCart width={18} height={18} color="#313131" />
              <Text className="ml-2 text-sm font-medium space-medium" style={{ color: '#313131' }}>
                From Recipe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOpenMealPlanSheet}
              className="flex-1 px-4 py-3 rounded-3xl bg-white flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <ShoppingCart width={18} height={18} color="#313131" />
              <Text className="ml-2 text-sm font-medium space-medium" style={{ color: '#313131' }}>
                From Meal Plan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lists */}
        <FlatList
          data={lists}
          renderItem={renderList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4E95A" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <ShoppingCart width={64} height={64} color="#D4E95A" />
              <Text className="text-center mb-4 text-lg mt-4 space-medium" style={{ color: '#313131' }}>
                No shopping lists yet
              </Text>
              <Text className="text-center mb-6 text-sm space-regular px-8" style={{ color: '#666' }}>
                Create a shopping list to track your ingredients
              </Text>
              <TouchableOpacity
                onPress={() => createListSheetRef.current?.expand()}
                className="px-6 py-3 rounded-full"
                style={{ backgroundColor: '#D4E95A' }}
                activeOpacity={0.8}
              >
                <Text className="font-semibold space-semibold" style={{ color: '#313131' }}>
                  Create Your First List
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Create List Bottom Sheet */}
      <CreateListSheet
        bottomSheetRef={createListSheetRef}
        newListName={newListName}
        setNewListName={setNewListName}
        onCreateList={handleCreateList}
        onClose={() => setNewListName('')}
      />

      {/* Add Item Bottom Sheet */}
      <AddItemSheet
        bottomSheetRef={addItemSheetRef}
        selectedList={selectedList}
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        newItemQuantity={newItemQuantity}
        setNewItemQuantity={setNewItemQuantity}
        onAddItem={handleAddItem}
        onClose={() => {
          setNewItemName('');
          setNewItemQuantity('');
          setSelectedList(null);
        }}
      />

      {/* Create From Recipe Bottom Sheet */}
      <CreateFromRecipeSheet
        bottomSheetRef={createFromGuideSheetRef}
        myRecipes={myRecipes}
        loadingRecipes={loadingRecipes}
        onCreateFromRecipe={handleCreateFromRecipe}
        onClose={() => setMyRecipes([])}
      />

      {/* Create From Meal Plan Bottom Sheet */}
      <CreateFromMealPlanSheet
        bottomSheetRef={createFromMealPlanSheetRef}
        onCreateFromMealPlan={handleCreateFromMealPlan}
        mealPlanIngredients={mealPlanIngredients}
        userIngredients={userIngredients}
        loading={loadingMealPlan}
      />

      {/* Custom Alert Modal */}
      <Alert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}
