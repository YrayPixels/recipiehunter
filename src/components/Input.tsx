import React, { useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { cn } from '../lib/utils';
import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'style' | 'className'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  inputClassName?: string;
  label?: string;
  helperText?: string;
  error?: string;
  variant?: 'default' | 'outlined' | 'filled' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  multiline?: boolean;
  numberOfLines?: number;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  className,
  containerClassName,
  inputClassName,
  label,
  helperText,
  error,
  variant = 'default',
  size = 'md',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  secureTextEntry: initialSecureTextEntry = false,
  disabled = false,
  required = false,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(initialSecureTextEntry);
  const hasError = !!error;

  // Size styles
  const sizeStyles = {
    sm: {
      container: 'px-3 py-2',
      text: 'text-sm',
      icon: 'w-4 h-4',
    },
    md: {
      container: 'px-4 py-3',
      text: 'text-base',
      icon: 'w-5 h-5',
    },
    lg: {
      container: 'px-5 py-4',
      text: 'text-lg',
      icon: 'w-6 h-6',
    },
  };

  // Variant styles
  const variantStyles = {
    default: cn(
      'bg-white border',
      hasError
        ? 'border-red-500 dark:border-red-500'
        : isFocused
        ? 'border-primary dark:border-primary'
        : 'border-input dark:border-gray-700'
    ),
    outlined: cn(
      'bg-transparent border-2',
      hasError
        ? 'border-red-500 dark:border-red-500'
        : isFocused
        ? 'border-primary dark:border-primary'
        : 'border-input dark:border-gray-700'
    ),
    filled: cn(
      'bg-gray-100 dark:bg-gray-800 border-0',
      hasError && 'bg-red-50 dark:bg-red-900/20'
    ),
    ghost: cn(
      'bg-transparent border-0',
      hasError && 'border-b-2 border-red-500 dark:border-red-500'
    ),
  };

  const currentSize = sizeStyles[size];

  return (
    <View className={cn('w-full border-0', className)}>
      {/* Label */}
      {label && (
        <Text
          className={cn(
            'mb-2 space-medium',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-lg',
            hasError ? 'text-red-500' : 'text-foreground dark:text-gray-100'
          )}
        >
          {label}
          {required && <Text className="text-red-500"> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View
        className={cn(
          'flex-row items-center rounded-xl',
          variantStyles[variant],
          currentSize.container,
          disabled && 'opacity-50',
          multiline && 'items-start',
          multiline && size === 'sm' && 'min-h-[60px]',
          multiline && size === 'md' && 'min-h-[80px]',
          multiline && size === 'lg' && 'min-h-[100px]',
          containerClassName
        )}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View className="mr-3">
            {typeof leftIcon === 'string' ? (
              <Text className={cn('text-foreground/60', currentSize.text)}>{leftIcon}</Text>
            ) : (
              leftIcon
            )}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'flex-1 space-regular',
            currentSize.text,
            'text-foreground dark:text-gray-100',
            'text-left',
            inputClassName
          )}
          style={{
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          {...textInputProps}
        />

        {/* Right Icon / Password Toggle */}
        {(rightIcon || initialSecureTextEntry) && (
          <View className="ml-3">
            {initialSecureTextEntry ? (
              <TouchableOpacity
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                activeOpacity={0.7}
              >
                <Text className={cn('text-foreground/60', currentSize.text)}>
                  {secureTextEntry ? '👁️' : '👁️‍🗨️'}
                </Text>
              </TouchableOpacity>
            ) : typeof rightIcon === 'string' ? (
              <Text className={cn('text-foreground/60', currentSize.text)}>{rightIcon}</Text>
            ) : (
              rightIcon
            )}
          </View>
        )}
      </View>

      {/* Helper Text / Error Message */}
      {(helperText || error) && (
        <Text
          className={cn(
            'mt-1.5 space-regular',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            hasError ? 'text-red-500' : 'text-foreground/60 dark:text-gray-400'
          )}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

