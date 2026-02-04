import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { format, isToday, isPast, startOfDay } from 'date-fns';
import { X, Calendar } from 'react-native-feather';
import { Text } from './Text';
import { BottomSheet } from './BottomSheet';
import BottomSheetLib from '@gorhom/bottom-sheet';
import { CalendarPicker } from './CalendarPicker';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳', color: '#FFE5B4' },
  { id: 'lunch', label: 'Lunch', icon: '🍲', color: '#FFD4B3' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', color: '#E8D5C4' },
  { id: 'snack', label: 'Snack', icon: '🍎', color: '#D4E95A' },
] as const;

interface AddToMealPlannerSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  recipeId: string;
  recipeTitle: string;
  recipeImageUrl?: string;
  onClose: () => void;
  onAdd: (date: Date, mealType: string) => Promise<void>;
}

export const AddToMealPlannerSheet: React.FC<AddToMealPlannerSheetProps> = ({
  bottomSheetRef,
  recipeId,
  recipeTitle,
  recipeImageUrl,
  onClose,
  onAdd,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleAdd = async () => {
    if (!selectedMealType) return;

    try {
      setIsAdding(true);
      await onAdd(selectedDate, selectedMealType);
      bottomSheetRef.current?.close();
      setSelectedDate(new Date());
      setSelectedMealType(null);
    } catch (error) {
      console.error('Error adding to meal planner:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const quickDates = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  ];

  return (
    <BottomSheet
      bottomSheetRef={bottomSheetRef}
      snapPoints={['70%', '90%']}
      onClose={() => {
        setSelectedDate(new Date());
        setSelectedMealType(null);
        setShowCalendar(false);
        onClose();
      }}
      backgroundStyle={{ backgroundColor: '#F6FBDE' }}
    >
      <View className="flex-1 px-4 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl  space-bold" style={{ color: '#313131' }}>
            Add to Meal Planner
          </Text>
          <TouchableOpacity
            onPress={() => {
              bottomSheetRef.current?.close();
            }}
            className="w-10 h-10 rounded-full items-center justify-center bg-white"
          >
            <X width={20} height={20} color="#313131" />
          </TouchableOpacity>
        </View>

        {/* Recipe Info */}
        <View className="bg-white rounded-3xl p-4 mb-4">
          <Text className="text-lg font-semibold mb-1 space-semibold" style={{ color: '#313131' }}>
            {recipeTitle}
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Date Selection */}
          <View className="mb-4">
            <Text className="text-lg font-semibold mb-3 space-semibold" style={{ color: '#313131' }}>
              Select Date
            </Text>

            {/* Quick Date Options */}
            <View className="flex-row gap-2 mb-3">
              {quickDates.map((quickDate) => {
                const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(quickDate.date, 'yyyy-MM-dd');
                const isPastDate = isPast(startOfDay(quickDate.date)) && !isToday(quickDate.date);

                return (
                  <TouchableOpacity
                    key={quickDate.label}
                    onPress={() => !isPastDate && setSelectedDate(quickDate.date)}
                    disabled={isPastDate}
                    className={`px-4 py-2 rounded-full ${isSelected ? 'bg-brand-green' : 'bg-white'
                      } ${isPastDate ? 'opacity-50' : ''}`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={`font-semibold space-semibold ${isSelected ? 'text-white' : 'text-[#313131]'
                        }`}
                    >
                      {quickDate.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Calendar Toggle */}
            <TouchableOpacity
              onPress={() => setShowCalendar(!showCalendar)}
              className="bg-white rounded-3xl p-4 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                <Calendar width={20} height={20} color="#313131" />
                <Text className="text-base space-semibold" style={{ color: '#313131' }}>
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
              <Text className="text-sm space-regular" style={{ color: '#666' }}>
                {showCalendar ? 'Hide' : 'Show'} Calendar
              </Text>
            </TouchableOpacity>

            {/* Calendar Picker */}
            {showCalendar && (
              <View className="mt-3">
                <CalendarPicker
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setShowCalendar(false);
                  }}
                  onClose={() => setShowCalendar(false)}
                />
              </View>
            )}
          </View>

          {/* Meal Type Selection */}
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3 space-semibold" style={{ color: '#313131' }}>
              Select Meal
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {MEAL_TYPES.map((mealType) => {
                const isSelected = selectedMealType === mealType.id;
                return (
                  <TouchableOpacity
                    key={mealType.id}
                    onPress={() => setSelectedMealType(mealType.id)}
                    className={`flex-1 min-w-[45%] rounded-3xl p-4 ${isSelected ? 'bg-brand-green' : 'bg-white'
                      }`}
                    activeOpacity={0.7}
                  >
                    <View className="items-center">
                      <Text className="text-3xl mb-2">{mealType.icon}</Text>
                      <Text
                        className={`font-semibold space-semibold ${isSelected ? 'text-white' : 'text-[#313131]'
                          }`}
                      >
                        {mealType.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Add Button */}
        <View className="pb-4 pt-2">
          <TouchableOpacity
            onPress={handleAdd}
            disabled={!selectedMealType || isAdding}
            className={`rounded-full py-4 items-center ${selectedMealType && !isAdding
                ? 'bg-brand-green'
                : 'bg-gray-300'
              }`}
            activeOpacity={0.8}
          >
            <Text
              className={`font-semibold space-semibold ${selectedMealType && !isAdding ? 'text-white' : 'text-gray-500'
                }`}
            >
              {isAdding ? 'Adding...' : 'Add to Meal Planner'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};
