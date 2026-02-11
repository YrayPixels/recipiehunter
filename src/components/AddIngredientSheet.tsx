import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import BottomSheetLib from '@gorhom/bottom-sheet';
import { X } from 'react-native-feather';
import { Text } from './Text';
import { Input } from './Input';
import { Ingredient } from '../lib/stores/ingredientsStore';
import { BottomSheet } from './BottomSheet';

interface AddIngredientSheetProps {
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  editingIngredient: Ingredient | null;
  newIngredient: { name: string; quantity: string };
  onIngredientChange: (ingredient: { name: string; quantity: string }) => void;
  onSave: () => void;
  onClose: () => void;
}

export const AddIngredientSheet: React.FC<AddIngredientSheetProps> = ({
  bottomSheetRef,
  editingIngredient,
  newIngredient,
  onIngredientChange,
  onSave,
  onClose,
}) => {
  return (
    <BottomSheet
      bottomSheetRef={bottomSheetRef}
      snapPoints={['50%']}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: '#F6FBDE' }}
      handleIndicatorStyle={{ backgroundColor: '#313131' }}
    >
      <View className="flex-1 px-6 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-xl  space-bold" style={{ color: '#313131' }}>
            {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
          </Text>
          <TouchableOpacity onPress={onClose} className="p-2">
            <X width={24} height={24} color="#313131" />
          </TouchableOpacity>
        </View>

        <View className="gap-4">
          <Input
            value={newIngredient.name}
            onChangeText={(text) => onIngredientChange({ ...newIngredient, name: text })}
            placeholder="Ingredient name"
            label="Name"
            variant="filled"
            required
          />
          <Input
            value={newIngredient.quantity}
            onChangeText={(text) => onIngredientChange({ ...newIngredient, quantity: text })}
            placeholder="e.g., 2 cups, 500g (optional)"
            label="Quantity"
            variant="filled"
          />

          <TouchableOpacity
            onPress={onSave}
            className="bg-brand-green rounded-3xl py-4 items-center mt-2"
            activeOpacity={0.8}
            disabled={!newIngredient.name.trim()}
          >
            <Text className="text-base font-semibold space-semibold" style={{ color: '#313131' }}>
              {editingIngredient ? 'Update' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};
