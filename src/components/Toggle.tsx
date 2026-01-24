import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { cn } from '../lib/utils';

interface ToggleProps {
  // Switch-style toggle (for settings)
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  // Button-style toggle (legacy)
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  children?: React.ReactNode;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  value,
  onValueChange,
  pressed,
  onPressedChange,
  children,
  className,
}) => {
  // If value/onValueChange are provided, render as switch-style toggle
  if (value !== undefined && onValueChange !== undefined) {
    return (
      <TouchableOpacity
        onPress={() => onValueChange(!value)}
        className={cn(
          'h-7 w-12 rounded-full relative',
          value ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
          className
        )}
        activeOpacity={0.7}
      >
        <View
          className={cn(
            'absolute h-5 w-5 rounded-full bg-white top-1',
            value ? 'right-1' : 'left-1'
          )}
        />
      </TouchableOpacity>
    );
  }

  // Legacy button-style toggle
  const isPressed = pressed ?? false;
  const handlePress = () => {
    if (onPressedChange) {
      onPressedChange(!isPressed);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={cn(
        'border border-border rounded-lg items-center justify-center',
        isPressed ? 'bg-sage' : 'bg-transparent',
        className
      )}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
};

