import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Text } from '../Text';
import { Input } from '../Input';
import { BottomSheet as BottomSheetComponent } from '../BottomSheet';

interface CreateListSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  newListName: string;
  setNewListName: (name: string) => void;
  onCreateList: () => void;
  onClose: () => void;
}

export const CreateListSheet: React.FC<CreateListSheetProps> = ({
  bottomSheetRef,
  newListName,
  setNewListName,
  onCreateList,
  onClose,
}) => {
  return (
    <BottomSheetComponent
      bottomSheetRef={bottomSheetRef}
      snapPoints={['45%']}
      backgroundStyle={{ backgroundColor: '#F6FBDE' }}
      onClose={onClose}
    >
      <View className="px-4 pt-2">
        <Text className="text-2xl space-bold mb-2" style={{ color: '#313131' }}>
          Create New List
        </Text>
        <Text className="text-sm space-regular mb-6" style={{ color: '#666' }}>
          Give your shopping list a memorable name
        </Text>
        
        <View className="bg-white rounded-3xl p-4 mb-6 border border-brand-green">
          <Text className="text-xs space-medium mb-2" style={{ color: '#313131' }}>
            LIST NAME
          </Text>
          <Input
            value={newListName}
            onChangeText={setNewListName}
            placeholder="e.g., Weekly Groceries"
            containerClassName="mb-0"
            variant="outlined"
          />
        </View>

        <TouchableOpacity
          onPress={onCreateList}
          disabled={!newListName.trim()}
          className="rounded-3xl py-4 items-center border border-brand-green"
          style={{
            backgroundColor: newListName.trim() ? '#D4E95A' : '#E5E5E5',
          }}
          activeOpacity={0.8}
        >
          <Text
            className="text-base space-semibold"
            style={{ color: '#313131' }}
          >
            Create List
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetComponent>
  );
};
