import { usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation } from './BottomNavigation';

interface LayoutWithBottomNavProps {
  children: React.ReactNode;
}

export function LayoutWithBottomNav({ children }: LayoutWithBottomNavProps) {
  const pathname = usePathname();
  
  // Hide bottom navigation on onboarding screens
  const hideBottomNav = pathname?.startsWith('/onboarding');

  return (
    <View className="flex-1">
      {children}
      {!hideBottomNav && (
        <SafeAreaView edges={['bottom']} className="bg-transparent">
          <BottomNavigation />
        </SafeAreaView>
      )}
    </View>
  );
}
