import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_EMAIL_KEY = 'user_email';
const USER_ID_KEY = 'breakfree_user_id';

/**
 * Get the current user's email
 */
export const getUserEmail = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(USER_EMAIL_KEY);
};

/**
 * Get the current user's ID
 * Returns null if user is not signed up (no email stored)
 */
export const getUserId = async (): Promise<string | null> => {
  // Check if user has signed up (has email)
  const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
  if (!email) {
    // User not signed up - return null
    return null;
  }

  // User is signed up - return stored userId
  const userId = await AsyncStorage.getItem(USER_ID_KEY);
  return userId;
};

/**
 * Set user authentication data
 */
export const setUserAuth = async (email: string, userId: string): Promise<void> => {
  await AsyncStorage.setItem(USER_EMAIL_KEY, email);
  await AsyncStorage.setItem(USER_ID_KEY, userId);
};

/**
 * Clear user authentication data (logout)
 */
export const clearUserAuth = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_EMAIL_KEY);
  await AsyncStorage.removeItem(USER_ID_KEY);
};

/**
 * Check if user is authenticated (has email)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const email = await AsyncStorage.getItem(USER_EMAIL_KEY);
  return !!email;
};