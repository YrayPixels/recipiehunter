import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric-enabled';
const LAST_AUTH_TIME_KEY = 'last-auth-time';
const AUTH_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Check if biometric authentication is available on the device
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Get available authentication types
 */
export const getSupportedAuthTypes = async (): Promise<LocalAuthentication.AuthenticationType[]> => {
  try {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  } catch (error) {
    console.error('Error getting supported auth types:', error);
    return [];
  }
};

/**
 * Get human-readable name for authentication type
 */
export const getAuthTypeName = (types: LocalAuthentication.AuthenticationType[]): string => {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }
  return 'Biometric';
};

/**
 * Check if biometric authentication is enabled in settings
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric enabled status:', error);
    return false;
  }
};

/**
 * Enable or disable biometric authentication
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting biometric enabled status:', error);
    throw error;
  }
};

/**
 * Check if user is still authenticated (within timeout window)
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const lastAuthTime = await SecureStore.getItemAsync(LAST_AUTH_TIME_KEY);
    if (!lastAuthTime) return false;
    
    const lastAuth = parseInt(lastAuthTime, 10);
    const now = Date.now();
    const timeSinceAuth = now - lastAuth;
    
    return timeSinceAuth < AUTH_TIMEOUT;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Authenticate using biometrics
 */
export const authenticate = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const available = await isBiometricAvailable();
    if (!available) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device',
      };
    }

    const enabled = await isBiometricEnabled();
    if (!enabled) {
      return {
        success: false,
        error: 'Biometric authentication is not enabled',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access Break Free',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      // Store the authentication time
      await SecureStore.setItemAsync(LAST_AUTH_TIME_KEY, Date.now().toString());
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    console.error('Error during authentication:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Clear authentication (logout)
 */
export const clearAuthentication = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(LAST_AUTH_TIME_KEY);
  } catch (error) {
    console.error('Error clearing authentication:', error);
  }
};

