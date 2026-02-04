import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import BottomSheet from '@gorhom/bottom-sheet';
import { BottomSheet as BottomSheetComponent } from './BottomSheet';
import { Text } from './Text';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '☀️', color: '#FFE5B4' },
  { id: 'lunch', label: 'Lunch', icon: '☀️', color: '#FFD4B3' },
  { id: 'dinner', label: 'Dinner', icon: '🌙', color: '#E8D5C4' },
  { id: 'snack', label: 'Snack', icon: '🥨', color: '#D4E95A' },
];

interface GuideSelectionSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  selectedSlot: { date: Date; mealType: string } | null;
  loadingGuides: boolean;
  myGuides: any[];
  onSelectGuide: (guide: any) => void;
  onClose: () => void;
}

export const GuideSelectionSheet: React.FC<GuideSelectionSheetProps> = ({
  bottomSheetRef,
  selectedSlot,
  loadingGuides,
  myGuides,
  onSelectGuide,
  onClose,
}) => {
  const router = useRouter();

  return (
    <BottomSheetComponent
      bottomSheetRef={bottomSheetRef}
      snapPoints={['70%']}
      onClose={onClose}
    >
      <View className="flex-1 px-4">
        <Text className="text-2xl  mb-4 space-bold" style={{ color: '#313131' }}>
          Select Recipe
        </Text>
        {selectedSlot && (
          <Text className="text-base mb-4 space-regular" style={{ color: '#666' }}>
            {format(selectedSlot.date, 'EEEE, MMM d')} - {MEAL_TYPES.find(m => m.id === selectedSlot.mealType)?.label}
          </Text>
        )}

        {loadingGuides ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#D4E95A" />
          </View>
        ) : (
          <ScrollView>
            {myGuides.map((guide) => (
              <TouchableOpacity
                key={guide.id}
                onPress={() => onSelectGuide(guide)}
                className="bg-white rounded-3xl p-4 mb-3 flex-row items-center shadow-sm"
                activeOpacity={0.8}
              >
                {guide.image_url || guide.thumbnail_url ? (
                  <Image
                    source={{ uri: guide.image_url || guide.thumbnail_url }}
                    className="w-16 h-16 rounded-lg mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="w-16 h-16 rounded-lg mr-3 items-center justify-center"
                    style={{ backgroundColor: '#F6FBDE' }}
                  >
                    <Text className="text-2xl">🍽️</Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-base font-semibold mb-1 space-semibold" style={{ color: '#313131' }}>
                    {guide.title}
                  </Text>
                  {guide.summary && (
                    <Text className="text-sm space-regular" style={{ color: '#666' }} numberOfLines={2}>
                      {guide.summary}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
            {myGuides.length === 0 && (
              <View className="items-center justify-center py-10">
                <Text className="text-center mb-4 space-regular" style={{ color: '#666' }}>
                  No recipes yet
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    bottomSheetRef.current?.close();
                    router.push('/add-guide');
                  }}
                  className="px-6 py-3 rounded-full"
                  style={{ backgroundColor: '#D4E95A' }}
                >
                  <Text className="font-semibold space-semibold" style={{ color: '#313131' }}>
                    Create Recipe
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </BottomSheetComponent>
  );
};
