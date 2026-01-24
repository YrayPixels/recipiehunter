import React, { useEffect, useState, useMemo } from 'react';
import { TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Calendar, Check, AlertCircle } from 'react-native-feather';
import { Text } from '../Text';
import { BottomSheet as BottomSheetComponent } from '../BottomSheet';

interface IngredientComparison {
  name: string;
  needed: string;
  available?: string;
  difference: 'none' | 'partial' | 'full';
  displayNeed: string;
}

interface CreateFromMealPlanSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onCreateFromMealPlan: (comparedIngredients: IngredientComparison[]) => void;
  mealPlanIngredients: { name: string; quantity?: string }[];
  userIngredients?: { name: string; quantity?: string }[];
  loading?: boolean;
}

export const CreateFromMealPlanSheet: React.FC<CreateFromMealPlanSheetProps> = ({
  bottomSheetRef,
  onCreateFromMealPlan,
  mealPlanIngredients,
  userIngredients = [],
  loading = false,
}) => {
  const [showComparison, setShowComparison] = useState(false);

  // Parse quantity from string (basic implementation)
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

  // Compare ingredients and calculate what's needed
  const comparedIngredients: IngredientComparison[] = useMemo(() => {
    if (!mealPlanIngredients || mealPlanIngredients.length === 0) {
      return [];
    }

    // Create a map of user ingredients for quick lookup
    const userIngredientsMap = new Map<string, { name: string; quantity?: string }>();
    (userIngredients || []).forEach(ing => {
      userIngredientsMap.set(ing.name.toLowerCase().trim(), ing);
    });

    return mealPlanIngredients.map(mealIng => {
      const key = mealIng.name.toLowerCase().trim();
      const userIng = userIngredientsMap.get(key);
      
      if (!userIng) {
        // User doesn't have this ingredient at all
        return {
          name: mealIng.name,
          needed: mealIng.quantity || 'as needed',
          available: undefined,
          difference: 'none' as const,
          displayNeed: mealIng.quantity || 'as needed',
        };
      }

      // User has this ingredient - try to compare quantities
      const neededQty = parseQuantity(mealIng.quantity);
      const availableQty = parseQuantity(userIng.quantity);

      if (neededQty && availableQty && neededQty.unit === availableQty.unit) {
        // Same units - can compare
        if (availableQty.amount >= neededQty.amount) {
          return {
            name: mealIng.name,
            needed: mealIng.quantity || 'as needed',
            available: userIng.quantity,
            difference: 'full' as const,
            displayNeed: 'Already have enough',
          };
        } else {
          const diff = neededQty.amount - availableQty.amount;
          return {
            name: mealIng.name,
            needed: mealIng.quantity || 'as needed',
            available: userIng.quantity,
            difference: 'partial' as const,
            displayNeed: `Need ${diff.toFixed(1)} ${neededQty.unit} more`,
          };
        }
      }

      // Can't compare quantities (different units or no units)
      return {
        name: mealIng.name,
        needed: mealIng.quantity || 'as needed',
        available: userIng.quantity || 'some available',
        difference: 'partial' as const,
        displayNeed: `Check: need ${mealIng.quantity || 'some'}, have ${userIng.quantity || 'some'}`,
      };
    });
  }, [mealPlanIngredients, userIngredients]);

  const stats = useMemo(() => {
    const total = comparedIngredients.length;
    const needToBuy = comparedIngredients.filter(ing => ing.difference !== 'full').length;
    const haveEnough = comparedIngredients.filter(ing => ing.difference === 'full').length;
    
    return { total, needToBuy, haveEnough };
  }, [comparedIngredients]);

  useEffect(() => {
    // Reset comparison view when sheet opens
    setShowComparison(false);
  }, [mealPlanIngredients]);

  const handleAnalyze = () => {
    setShowComparison(true);
  };

  const handleCreate = () => {
    onCreateFromMealPlan(comparedIngredients);
  };

  if (loading) {
    return (
      <BottomSheetComponent
        bottomSheetRef={bottomSheetRef}
        snapPoints={['45%']}
        backgroundStyle={{ backgroundColor: '#F6FBDE' }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4E95A" />
          <Text className="mt-4 text-sm space-regular" style={{ color: '#666' }}>
            Loading ingredients...
          </Text>
        </View>
      </BottomSheetComponent>
    );
  }

  if (!showComparison) {
    // Show empty state if no ingredients
    if (stats.total === 0) {
      return (
        <BottomSheetComponent
          bottomSheetRef={bottomSheetRef}
          snapPoints={['45%']}
          backgroundStyle={{ backgroundColor: '#F6FBDE' }}
        >
          <View className="px-4 pt-2 flex-1 items-center justify-center">
            <AlertCircle width={48} height={48} color="#F59E0B" />
            <Text className="text-xl space-bold mt-4 mb-2 text-center" style={{ color: '#313131' }}>
              No Ingredients Found
            </Text>
            <Text className="text-sm space-regular text-center mb-4" style={{ color: '#666' }}>
              Your meal plan doesn't have any ingredients yet. Add some recipes to your meal plan first!
            </Text>
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.close()}
              className="rounded-3xl py-3 px-6 bg-gray-200"
              activeOpacity={0.8}
            >
              <Text className="text-base space-semibold" style={{ color: '#313131' }}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheetComponent>
      );
    }
    
    return (
      <BottomSheetComponent
        bottomSheetRef={bottomSheetRef}
        snapPoints={['50%']}
        backgroundStyle={{ backgroundColor: '#F6FBDE' }}
      >
        <View className="px-4 pt-2 flex-1">
          <Text className="text-2xl space-bold mb-2" style={{ color: '#313131' }}>
            Create from Meal Plan
          </Text>
          <Text className="text-sm space-regular mb-6" style={{ color: '#666' }}>
            Generate a shopping list from your meal plan and compare with your ingredient box
          </Text>
          
          <View className="bg-white rounded-3xl p-4 mb-4 border border-brand-green">
            <View className="flex-row items-center mb-2">
              <Calendar width={20} height={20} color="#313131" />
              <Text className="ml-2 text-sm space-medium" style={{ color: '#313131' }}>
                This Week's Meal Plan
              </Text>
            </View>
            <Text className="text-xs space-regular mb-2" style={{ color: '#666' }}>
              {stats.total} ingredients found in your planned meals
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1 bg-gray-100 rounded-xl p-2">
                <Text className="text-xs space-regular" style={{ color: '#666' }}>
                  Your Ingredient Box
                </Text>
                <Text className="text-lg font-bold space-bold" style={{ color: '#313131' }}>
                  {(userIngredients || []).length}
                </Text>
              </View>
              <View className="flex-1 bg-gray-100 rounded-xl p-2">
                <Text className="text-xs space-regular" style={{ color: '#666' }}>
                  Meal Plan Needs
                </Text>
                <Text className="text-lg font-bold space-bold" style={{ color: '#313131' }}>
                  {stats.total}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAnalyze}
            className="rounded-3xl py-4 items-center border border-brand-green mb-3"
            style={{ backgroundColor: '#D4E95A' }}
            activeOpacity={0.8}
          >
            <Text className="text-base space-semibold" style={{ color: '#313131' }}>
              Compare & Analyze
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreate}
            className="rounded-3xl py-4 items-center bg-white border border-gray-300"
            activeOpacity={0.8}
          >
            <Text className="text-base space-semibold" style={{ color: '#313131' }}>
              Create Without Comparing
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetComponent>
    );
  }

  return (
    <BottomSheetComponent
      bottomSheetRef={bottomSheetRef}
      snapPoints={['85%']}
      backgroundStyle={{ backgroundColor: '#F6FBDE' }}
    >
      <View className="px-4 pt-2 flex-1">
        <Text className="text-2xl space-bold mb-2" style={{ color: '#313131' }}>
          Ingredient Comparison
        </Text>
        
        {/* Summary Stats */}
        <View className="flex-row gap-2 mb-4">
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-200">
            <Text className="text-xs space-regular mb-1" style={{ color: '#666' }}>
              Need to Buy
            </Text>
            <Text className="text-2xl font-bold space-bold" style={{ color: '#EF4444' }}>
              {stats.needToBuy}
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-200">
            <Text className="text-xs space-regular mb-1" style={{ color: '#666' }}>
              Already Have
            </Text>
            <Text className="text-2xl font-bold space-bold" style={{ color: '#10B981' }}>
              {stats.haveEnough}
            </Text>
          </View>
          <View className="flex-1 bg-white rounded-3xl p-3 border border-gray-200">
            <Text className="text-xs space-regular mb-1" style={{ color: '#666' }}>
              Total Items
            </Text>
            <Text className="text-2xl font-bold space-bold" style={{ color: '#313131' }}>
              {stats.total}
            </Text>
          </View>
        </View>

        {/* Ingredients List */}
        <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
          {comparedIngredients.map((ing, index) => (
            <View
              key={index}
              className="bg-white rounded-3xl p-3 mb-2 border"
              style={{
                borderColor: ing.difference === 'full' ? '#10B981' : ing.difference === 'partial' ? '#F59E0B' : '#EF4444',
              }}
            >
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold space-semibold" style={{ color: '#313131' }}>
                    {ing.name}
                  </Text>
                </View>
                <View
                  className="rounded-full px-2 py-1"
                  style={{
                    backgroundColor: ing.difference === 'full' ? '#D1FAE5' : ing.difference === 'partial' ? '#FEF3C7' : '#FEE2E2',
                  }}
                >
                  {ing.difference === 'full' ? (
                    <Check width={14} height={14} color="#10B981" />
                  ) : (
                    <AlertCircle width={14} height={14} color={ing.difference === 'partial' ? '#F59E0B' : '#EF4444'} />
                  )}
                </View>
              </View>

              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs space-regular" style={{ color: '#666' }}>
                    Needed:
                  </Text>
                  <Text className="text-xs font-medium space-medium" style={{ color: '#313131' }}>
                    {ing.needed}
                  </Text>
                </View>
                
                {ing.available && (
                  <View className="flex-row justify-between">
                    <Text className="text-xs space-regular" style={{ color: '#666' }}>
                      Available:
                    </Text>
                    <Text className="text-xs font-medium space-medium" style={{ color: '#10B981' }}>
                      {ing.available}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between mt-1 pt-1 border-t border-gray-200">
                  <Text className="text-xs font-semibold space-semibold" style={{ color: '#666' }}>
                    Action:
                  </Text>
                  <Text
                    className="text-xs font-semibold space-semibold"
                    style={{
                      color: ing.difference === 'full' ? '#10B981' : ing.difference === 'partial' ? '#F59E0B' : '#EF4444',
                    }}
                  >
                    {ing.displayNeed}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View className="gap-2 pb-2">
          <TouchableOpacity
            onPress={handleCreate}
            className="rounded-3xl py-4 items-center border border-brand-green"
            style={{ backgroundColor: '#D4E95A' }}
            activeOpacity={0.8}
          >
            <Text className="text-base space-semibold" style={{ color: '#313131' }}>
              Create Shopping List ({stats.needToBuy} items)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowComparison(false)}
            className="rounded-3xl py-3 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-sm space-medium" style={{ color: '#666' }}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetComponent>
  );
};
