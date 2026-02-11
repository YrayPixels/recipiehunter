import { getUserId } from "@/src/lib/userid";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus, Platform, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { AuthGuard } from "../src/components/AuthGuard";
import { AuthCheck } from "../src/components/AuthCheck";
import { BottomNavigation } from "../src/components/BottomNavigation";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { scheduleAllReminders } from "../src/lib/notifications";
import { getSettings } from "../src/lib/storage";
import { diagnosePackages, getCustomerInfo, initializePurchases, logPackagesDetails, syncSubscriptionStatus } from "../src/lib/subscription";
import { ThemeProvider } from "../src/lib/theme";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Break Free Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5a7a5a',
        sound: 'default',
      });
    }

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
    });

    // Request permissions and schedule notifications on app start
    const initNotifications = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
            },
          });
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          // Schedule all reminders
          const settings = await getSettings();
          await scheduleAllReminders(settings.notifications);
        }
      } catch (error) {
        console.warn('Error initializing notifications:', error);
      }
    };

    initNotifications();

    // Handle app state changes to re-schedule notifications
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground, re-schedule notifications
        try {
          const settings = await getSettings();
          await scheduleAllReminders(settings.notifications);
        } catch (error) {
          console.warn('Error re-scheduling notifications:', error);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    // Initialize RevenueCat on app startup
    const initRevenueCat = async () => {
      try {
        const userId = await getUserId();
        if (!userId) {
          // User not authenticated yet - skip RevenueCat initialization
          return;
        }

        await initializePurchases(userId);

        try {
          const customerInfo = await getCustomerInfo();
          if (customerInfo) {
            console.log("Customer info:", customerInfo);
            await syncSubscriptionStatus(customerInfo);

            await logPackagesDetails();
            // Run diagnosis to check for missing packages
            await diagnosePackages();
          } else {
            console.warn("No customer info available, skipping subscription sync");
          }
        } catch (syncError) {
          // If sync fails, continue - local storage will be used as fallback
          console.warn("Failed to sync subscription status:", syncError);
        }
      } catch (error) {
        // Log error but don't block app startup
        // RevenueCat will be initialized on-demand when needed
        console.warn("RevenueCat initialization deferred:", error);
      }
    };

    // Initial check
    initRevenueCat();

    // Listen for app state changes to re-initialize when app comes to foreground
    // This handles cases where user logs in while app is in background
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, check if user is logged in and initialize RevenueCat
        const userId = await getUserId();
        if (userId) {
          try {
            await initializePurchases(userId);
          } catch (error) {
            console.warn("RevenueCat initialization on app active failed:", error);
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once the fonts are loaded (even if there was an error)
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Error hiding splash screen:', error);
      });
    }
  }, [fontsLoaded, fontError]);

  // Show loading state while fonts are loading, but continue even if fonts fail
  // Fonts are not critical for app functionality
  if (!fontsLoaded && !fontError) {
    return null; // Splash screen will be shown
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthCheck>
              <AuthGuard>
                <LayoutWithBottomNav>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                    }}
                  />
                </LayoutWithBottomNav>
              </AuthGuard>
            </AuthCheck>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function LayoutWithBottomNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide bottom navigation on onboarding and signup screens
  const hideBottomNav = pathname?.startsWith('/onboarding') || pathname?.startsWith('/signup');

  return (
    <View className="flex-1">
      <StatusBar style="dark" />
      <View className="flex-1" >
        {children}
      </View>
      {!hideBottomNav && (
        <SafeAreaView style={{ backgroundColor: pathname?.startsWith('/settings') ? '#fddffd' : '#F6FBDE' }}
          className="bg-transparent" edges={['bottom']}>
          <BottomNavigation />
        </SafeAreaView>
      )}
    </View>
  );
}
