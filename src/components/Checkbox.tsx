import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Check } from 'react-native-feather';
import { cn } from '../lib/utils';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onCheckedChange, className }) => {
  return (
    <TouchableOpacity
      onPress={() => onCheckedChange(!checked)}
      className={cn(
        'h-5 w-5 border-2 rounded items-center justify-center',
        checked ? 'bg-primary border-primary' : 'border-border',
        className
      )}
      activeOpacity={0.7}
    >
      {checked && <Check width={14} height={14} color="#f5f3f0" />}
    </TouchableOpacity>
  );
};

