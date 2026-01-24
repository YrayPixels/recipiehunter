import BottomSheetLib from '@gorhom/bottom-sheet';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { X } from 'react-native-feather';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Input } from './Input';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';

export interface TimePickerRef {
  open: () => void;
  close: () => void;
}

interface TimePickerProps {
  bottomSheetRef: React.RefObject<BottomSheetLib | null>;
  currentTime: string; // HH:mm format
  onConfirm: (time: string) => void;
  onClose?: () => void;
  title?: string;
}

export const TimePicker = React.forwardRef<TimePickerRef, TimePickerProps>(({
  bottomSheetRef,
  currentTime,
  onConfirm,
  onClose,
  title = 'Select Time',
}, ref) => {
  const { effectiveTheme } = useTheme();
  const [hours, setHours] = useState(() => {
    const [h] = currentTime.split(':');
    return h || '08';
  });
  const [minutes, setMinutes] = useState(() => {
    const [, m] = currentTime.split(':');
    return m || '00';
  });

  // Update time when currentTime prop changes
  useEffect(() => {
    const [h, m] = currentTime.split(':');
    setHours(h || '08');
    setMinutes(m || '00');
  }, [currentTime]);

  useImperativeHandle(ref, () => ({
    open: () => {
      bottomSheetRef.current?.expand();
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  const handleConfirm = () => {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    if (isNaN(h) || h < 0 || h > 23) {
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      return;
    }
    
    const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onConfirm(timeString);
    bottomSheetRef.current?.close();
  };

  const handleClose = () => {
    bottomSheetRef.current?.close();
    if (onClose) {
      onClose();
    }
  };

  const incrementHours = () => {
    const h = parseInt(hours, 10);
    if (h >= 23) {
      setHours('0');
    } else {
      setHours(String(h + 1).padStart(2, '0'));
    }
  };

  const decrementHours = () => {
    const h = parseInt(hours, 10);
    if (h <= 0) {
      setHours('23');
    } else {
      setHours(String(h - 1).padStart(2, '0'));
    }
  };

  const incrementMinutes = () => {
    const m = parseInt(minutes, 10);
    if (m >= 59) {
      setMinutes('0');
    } else {
      setMinutes(String(m + 1).padStart(2, '0'));
    }
  };

  const decrementMinutes = () => {
    const m = parseInt(minutes, 10);
    if (m <= 0) {
      setMinutes('59');
    } else {
      setMinutes(String(m - 1).padStart(2, '0'));
    }
  };

  return (
    <BottomSheet bottomSheetRef={bottomSheetRef} snapPoints={['50%']} onClose={() => {
      handleClose();
    }}>
      <View className="px-4 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">{title}</Text>
          <TouchableOpacity onPress={handleClose} className="p-1">
            <X 
              width={20} 
              height={20} 
              color={effectiveTheme === 'dark' ? '#9ca3af' : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>

        <View className="gap-4">
            <View className="items-center mb-6">
              <View className="flex-row items-center gap-4">
                {/* Hours */}
                <View className="items-center">
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mb-2">Hours</Text>
                  <TouchableOpacity
                    onPress={incrementHours}
                    className="w-12 h-12 border border-border dark:border-border-dark rounded-lg items-center justify-center bg-card dark:bg-card-dark mb-2"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">↑</Text>
                  </TouchableOpacity>
                  <View className={cn(
                    "w-16 h-16 border-2 border-primary dark:border-primary-dark rounded-lg items-center justify-center mb-2",
                    effectiveTheme === 'dark' ? 'bg-primary/20' : 'bg-sage-light'
                  )}>
                    <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">{hours}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={decrementHours}
                    className="w-12 h-12 border border-border dark:border-border-dark rounded-lg items-center justify-center bg-card dark:bg-card-dark"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">↓</Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark mb-8">:</Text>

                {/* Minutes */}
                <View className="items-center">
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mb-2">Minutes</Text>
                  <TouchableOpacity
                    onPress={incrementMinutes}
                    className="w-12 h-12 border border-border dark:border-border-dark rounded-lg items-center justify-center bg-card dark:bg-card-dark mb-2"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">↑</Text>
                  </TouchableOpacity>
                  <View className={cn(
                    "w-16 h-16 border-2 border-primary dark:border-primary-dark rounded-lg items-center justify-center mb-2",
                    effectiveTheme === 'dark' ? 'bg-primary/20' : 'bg-sage-light'
                  )}>
                    <Text className="text-3xl font-bold text-foreground dark:text-foreground-dark">{minutes}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={decrementMinutes}
                    className="w-12 h-12 border border-border dark:border-border-dark rounded-lg items-center justify-center bg-card dark:bg-card-dark"
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg font-bold text-foreground dark:text-foreground-dark">↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Manual Input */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mb-2">Or enter manually (HH:mm)</Text>
              <View className="flex-row gap-2">
                <Input
                  value={hours}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num >= 0 && num <= 23) {
                      setHours(String(num).padStart(2, '0'));
                    } else if (text === '') {
                      setHours('0');
                    }
                  }}
                  placeholder="08"
                  keyboardType="numeric"
                  maxLength={2}
                  className="flex-1 rounded-lg"
                />
                <Text className="text-xl font-bold text-foreground dark:text-foreground-dark self-center">:</Text>
                <Input
                  value={minutes}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num >= 0 && num <= 59) {
                      setMinutes(String(num).padStart(2, '0'));
                    } else if (text === '') {
                      setMinutes('0');
                    }
                  }}
                  placeholder="00"
                  keyboardType="numeric"
                  maxLength={2}
                  className="flex-1 rounded-lg"
                />
              </View>
            </View>

          <View className="flex-row gap-2">
            <Button onPress={handleConfirm} className="flex-1">
              Confirm
            </Button>
            <Button onPress={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
});

TimePicker.displayName = 'TimePicker';

