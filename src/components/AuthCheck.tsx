import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isAuthenticated } from '../lib/userid';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

interface AuthCheckProps {
  children: React.ReactNode;
}

export const AuthCheck: React.FC<AuthCheckProps> = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Get current route
      const currentRoute = segments[0] || '';

      // First, check onboarding status
      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      
      // If onboarding not completed and not already on onboarding, redirect to onboarding
      if (!hasCompletedOnboarding && currentRoute !== 'onboarding') {
        router.replace('/onboarding');
        setIsChecking(false);
        return;
      }

      // If onboarding is completed, check authentication
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);

      // If not authenticated and not already on signup, redirect to signup
      if (!authenticated && currentRoute !== 'signup' && currentRoute !== 'onboarding') {
        router.replace('/signup');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // On error, allow access (fail open)
      setIsAuth(false);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F6FBDE' }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#D4E95A" />
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
};
