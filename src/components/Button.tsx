import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { cn } from '../lib/utils';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  className,
  disabled = false,
  loading = false,
}) => {
  const baseStyles = 'rounded-lg items-center justify-center';
  const variantStyles = {
    default: 'bg-primary',
    outline: 'border border-border dark:border-gray-700 bg-transparent',
    ghost: 'bg-transparent',
    link: 'bg-transparent',
  };
  const sizeStyles = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        className
      )}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'default' ? '#f5f3f0' : '#5a7a5a'} />
      ) : (
        <Text
          className={cn(
            'font-medium',
            size === 'sm' && 'text-sm',
            size === 'md' && 'text-base',
            size === 'lg' && 'text-lg',
            variant === 'default' && 'text-primary-foreground',
            variant === 'outline' && 'text-foreground dark:text-gray-100',
            variant === 'ghost' && 'text-foreground dark:text-gray-100',
            variant === 'link' && 'text-hope underline'
          )}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

