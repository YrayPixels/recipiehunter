import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Text } from '../Text';
import { Input } from '../Input';
import { BottomSheet as BottomSheetComponent } from '../BottomSheet';

interface ShoppingList {
  id: string;
  name: string;
  items: any[];
  created_at: string;
}

interface AddItemSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  selectedList: ShoppingList | null;
  newItemName: string;
  setNewItemName: (name: string) => void;
  newItemQuantity: string;
  setNewItemQuantity: (quantity: string) => void;
  onAddItem: () => void;
  onClose: () => void;
}

export const AddItemSheet: React.FC<AddItemSheetProps> = ({
  bottomSheetRef,
  selectedList,
  newItemName,
  setNewItemName,
  newItemQuantity,
  setNewItemQuantity,
  onAddItem,
  onClose,
}) => {
  return (
    <BottomSheetComponent
      bottomSheetRef={bottomSheetRef}
      snapPoints={['55%']}
      backgroundStyle={{ backgroundColor: '#F6FBDE' }}
      onClose={onClose}
    >
      <View className="px-4 pt-2">
        <Text className="text-2xl space-bold mb-2" style={{ color: '#313131' }}>
          Add Item
        </Text>
        <Text className="text-sm space-regular mb-6" style={{ color: '#666' }}>
          Adding to <Text className="space-semibold">{selectedList?.name}</Text>
        </Text>
        
        <View className="bg-white rounded-3xl p-4 mb-4 border border-brand-green">
          <Text className="text-xs space-medium mb-2" style={{ color: '#313131' }}>
            ITEM NAME
          </Text>
          <Input
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="e.g., Tomatoes"
            containerClassName="mb-0"
            variant="outlined"
          />
        </View>

        <View className="bg-white rounded-3xl p-4 mb-6 border border-brand-green">
          <Text className="text-xs space-medium mb-2" style={{ color: '#313131' }}>
            QUANTITY (OPTIONAL)
          </Text>
          <Input
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
            placeholder="e.g., 2 lbs"
            containerClassName="mb-0"
            variant="outlined"
          />
        </View>

        <TouchableOpacity
          onPress={onAddItem}
          disabled={!newItemName.trim()}
          className="rounded-3xl py-4 items-center border border-brand-green"
          style={{
            backgroundColor: newItemName.trim() ? '#D4E95A' : '#E5E5E5',
          }}
          activeOpacity={0.8}
        >
          <Text
            className="text-base space-semibold"
            style={{ color: '#313131' }}
          >
            Add Item
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetComponent>
  );
};
