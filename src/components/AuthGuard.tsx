import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BiometricAuth } from './BiometricAuth';
import {
  isAuthenticated,
  isBiometricEnabled,
} from '../lib/biometrics';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const enabled = await isBiometricEnabled();
      
      if (!enabled) {
        // Biometrics not enabled, allow access
        setIsChecking(false);
        setNeedsAuth(false);
        return;
      }

      // Check if user is already authenticated (within timeout window)
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        setIsChecking(false);
        setNeedsAuth(false);
      } else {
        setIsChecking(false);
        setNeedsAuth(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, allow access (fail open)
      setIsChecking(false);
      setNeedsAuth(false);
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground, check if re-authentication is needed
      const enabled = await isBiometricEnabled();
      if (enabled) {
        const authenticated = await isAuthenticated();
        if (!authenticated) {
          setNeedsAuth(true);
        }
      }
    }
    // Note: We don't clear auth when going to background
    // The timeout check in isAuthenticated() will handle expired sessions
  };

  const handleAuthenticated = () => {
    setNeedsAuth(false);
  };

  const handleSkip = async () => {
    // Allow skip if biometrics not available, but still require it if enabled
    const enabled = await isBiometricEnabled();
    if (!enabled) {
      setNeedsAuth(false);
    }
  };

  if (isChecking) {
    // Show a minimal loading state instead of null to prevent blank screen
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (needsAuth) {
    return (
      <BiometricAuth
        onAuthenticated={handleAuthenticated}
        onSkip={handleSkip}
      />
    );
  }

  return <>{children}</>;
};

