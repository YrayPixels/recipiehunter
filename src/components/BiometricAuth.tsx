import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Key, Lock } from 'react-native-feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  authenticate,
  getAuthTypeName,
  getSupportedAuthTypes,
  isBiometricAvailable,
} from '../lib/biometrics';

interface BiometricAuthProps {
  onAuthenticated: () => void;
  onSkip?: () => void;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onAuthenticated,
  onSkip,
}) => {
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authTypeName, setAuthTypeName] = useState<string>('Biometric');
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const handleAuthenticate = useCallback(async () => {
    setAuthenticating(true);
    setError(null);

    const result = await authenticate();

    if (result.success) {
      onAuthenticated();
    } else {
      setError(result.error || 'Authentication failed');
      setAuthenticating(false);
    }
  }, [onAuthenticated]);

  useEffect(() => {
    if (available && !authenticating) {
      // Auto-trigger authentication when available
      handleAuthenticate();
    }
  }, [available, authenticating, handleAuthenticate]);

  const checkAvailability = async () => {
    try {
      const isAvailable = await isBiometricAvailable();
      setAvailable(isAvailable);

      if (isAvailable) {
        const types = await getSupportedAuthTypes();
        const name = getAuthTypeName(types);
        setAuthTypeName(name);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking biometric availability:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color="#5a7a5a" />
          <Text className="text-muted-foreground dark:text-gray-400 mt-4">
            Checking authentication...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!available) {
    // If biometrics not available, allow skip or proceed
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-6">
            <Lock width={64} height={64} color="#5a7a5a" />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-gray-100 mb-2 text-center">
            Biometric Authentication
          </Text>
          <Text className="text-muted-foreground dark:text-gray-400 text-center mb-8">
            Biometric authentication is not available on this device. You can enable it later in settings.
          </Text>
          {onSkip && (
            <TouchableOpacity
              className="px-6 py-3 rounded-lg"
              style={{ backgroundColor: '#5a7a5a' }}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text className="text-white font-medium">
                Continue
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top', 'bottom']}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="items-center mb-8">
          <View className="mb-6">
            <Key width={80} height={80} color="#5a7a5a" />
          </View>
          <Text className="text-2xl font-bold text-foreground dark:text-gray-100 mb-2 text-center">
            Unlock Break Free
          </Text>
          <Text className="text-muted-foreground dark:text-gray-400 text-center mb-2">
            Use {authTypeName} to access your private data
          </Text>
        </View>

        {error && (
          <View className="mb-6 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <Text className="text-red-600 dark:text-red-400 text-sm text-center">
              {error}
            </Text>
          </View>
        )}

        {authenticating ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#5a7a5a" />
            <Text className="text-muted-foreground dark:text-gray-400 mt-4">
              Authenticating...
            </Text>
          </View>
        ) : (
          <View className="w-full max-w-xs">
            <TouchableOpacity
              className="px-6 py-4 rounded-lg items-center mb-4"
              style={{ backgroundColor: '#5a7a5a' }}
              onPress={handleAuthenticate}
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold text-base">
                Authenticate with {authTypeName}
              </Text>
            </TouchableOpacity>
            {onSkip && (
              <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
                <Text className="text-muted-foreground dark:text-gray-400 text-center text-sm">
                  Skip for now
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

