import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/Input';
import { Text } from '../src/components/Text';
import { authAPI } from '../src/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializePurchases } from '../src/lib/subscription';

const USER_EMAIL_KEY = 'user_email';
const USER_ID_KEY = 'breakfree_user_id';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true); // Default to login mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userData;

      if (isLogin) {
        // Login
        const response = await authAPI.login(email);
        if (!response.success) {
          throw new Error(response.error || 'Login failed');
        }
        userData = response.user;
      } else {
        // Signup
        const response = await authAPI.signup(email, fullName || undefined);
        if (!response.success) {
          throw new Error(response.error || 'Signup failed');
        }
        userData = response.user;
      }

      // Store user data
      await AsyncStorage.setItem(USER_EMAIL_KEY, userData.email);
      await AsyncStorage.setItem(USER_ID_KEY, userData.id);

      // Initialize RevenueCat with the user ID
      // Wrap in try-catch to prevent crashes
      try {
        await initializePurchases(userData.id);
        console.log('RevenueCat initialized after login');
      } catch (error: any) {
        // Don't block navigation if RevenueCat initialization fails
        console.warn('RevenueCat initialization failed after login:', error);
        // Log more details in development
        if (__DEV__) {
          console.error('RevenueCat error details:', {
            message: error?.message,
            stack: error?.stack,
            error: error,
          });
        }
      }

      // Navigate to home - do this even if RevenueCat fails
      // Use setTimeout to ensure state updates complete before navigation
      setTimeout(() => {
        try {
          router.replace('/');
        } catch (navError) {
          console.error('Navigation error:', navError);
          // If navigation fails, try again after a short delay
          setTimeout(() => {
            try {
              router.replace('/');
            } catch (retryError) {
              console.error('Navigation retry failed:', retryError);
            }
          }, 200);
        }
      }, 100);
    } catch (err: any) {
      console.error('Auth error:', err);
      // Provide more helpful error messages
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (err.response?.status === 404) {
        if (err.response?.data?.error === 'No account found with this email') {
          errorMessage = 'No account found with this email. Please sign up first.';
        } else {
          errorMessage = `Cannot connect to server. Please make sure the backend server is running.`;
        }
      } else if (err.response?.status === 409) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error || 'Invalid email address.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-8">
            {/* Header */}
            <View className="mb-8 items-center">
              <Text className="text-4xl mb-2 space-bold" style={{ color: '#1F2937' }}>
                {isLogin ? 'Welcome Back!' : 'Get Started'}
              </Text>
              <Text className="text-base space-regular text-center" style={{ color: '#6B7280' }}>
                {isLogin
                  ? 'Sign in to access your recipes'
                  : 'Create an account to save and sync your recipes'}
              </Text>
            </View>

            {/* Form */}
            <View className="mb-6">
              <Input
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                variant="filled"
                size="lg"
                containerClassName="bg-white rounded-3xl mb-4"
                leftIcon="📧"
                required
                disabled={loading}
              />

              {isLogin && (
                <View className="mb-4 p-3 bg-blue-50 rounded-2xl">
                  <Text className="text-sm space-regular text-blue-700">
                    💡 For testing, use: moseserhinyodavwe2@gmail.com
                  </Text>
                </View>
              )}

              {!isLogin && (
                <Input
                  label="Full Name (Optional)"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setError('');
                  }}
                  placeholder="John Doe"
                  autoCapitalize="words"
                  variant="filled"
                  size="lg"
                  containerClassName="bg-white rounded-3xl mb-4"
                  leftIcon="👤"
                  disabled={loading}
                />
              )}

              {error ? (
                <View className="mb-4 p-3 bg-red-50 rounded-2xl">
                  <Text className="text-sm space-regular text-red-600">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !email}
                className="rounded-3xl p-4 mb-4"
                style={{
                  backgroundColor: loading || !email ? '#9CA3AF' : '#D4E95A',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {loading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#1F2937" />
                    <Text className="ml-2 text-base space-semibold" style={{ color: '#1F2937' }}>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-center text-base space-semibold" style={{ color: '#1F2937' }}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Toggle Login/Signup */}
            <View className="flex-row items-center justify-center">
              <Text className="text-sm space-regular" style={{ color: '#6B7280' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                disabled={loading}
              >
                <Text className="text-sm space-semibold" style={{ color: '#D4E95A' }}>
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
