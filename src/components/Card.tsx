import React from 'react';
import { Text, View } from 'react-native';
import { cn } from '../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <View className={cn('bg-card dark:bg-gray-800 rounded-lg p-6', className)}>
      {children}
    </View>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return <View className={cn('pb-3', className)}>{children}</View>;
};

interface CardTitleProps {
  children: React.ReactNode | string;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  if (typeof children === 'string') {
    return <Text className={cn('text-card-foreground dark:text-gray-100 font-semibold', className)}>{children}</Text>;
  } else {
    return <View className={cn('', className)}>{children}</View>;
  }
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return <View className={cn('space-y-4', className)}>{children}</View>;
};

