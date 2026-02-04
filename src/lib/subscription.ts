// Subscription service using RevenueCat (react-native-purchases)
import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";
import PurchasesUI from "react-native-purchases-ui";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionTier,
} from "../types/subscription";
import { getSettings, saveSettings, UserSettings } from "./storage";

export const PREMIUM_ENTITLEMENT = "Premium";
export const BREAKFREE_PRO_ENTITLEMENT = "Breakfree Pro";

const REVENUECAT_API_KEY_IOS =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || "";
const REVENUECAT_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || "";

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Check if running in Expo Go (which doesn't support native store features)
 */
const isExpoGo = (): boolean => {
  try {
    return Constants.executionEnvironment === "storeClient";
  } catch {
    // Fallback check - if Constants is not available, assume not Expo Go
    return false;
  }
};

/**
 * Initialize RevenueCat SDK
 * @param userId - Optional user ID to identify the user in RevenueCat
 * @param enableDebugLogging - Enable debug logging in development
 */
export const initializePurchases = async (
  userId?: string,
  enableDebugLogging: boolean = __DEV__
): Promise<void> => {
  // If already initialized, return immediately
  if (isInitialized) {
    console.log("RevenueCat already initialized");
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Create a new initialization promise
  initializationPromise = (async () => {
    try {
      const apiKey =
        Platform.OS === "ios"
          ? REVENUECAT_API_KEY_IOS
          : REVENUECAT_API_KEY_ANDROID;

      // Check if running in Expo Go (iOS doesn't support native store in Expo Go)
      if (isExpoGo() && Platform.OS === "ios") {
        console.warn(
          "RevenueCat initialization skipped: iOS native store is not available in Expo Go. Use a development build or Test Store API key."
        );
        isInitialized = false;
        return;
      }

      // Check if API key is missing - don't initialize if it's empty
      if (!apiKey || apiKey.trim() === "") {
        console.warn(
          `RevenueCat API key is missing for ${Platform.OS}. Subscription features will be disabled.`
        );
        console.warn(
          `Environment check: EXPO_PUBLIC_REVENUECAT_API_KEY_${Platform.OS.toUpperCase()}=${Platform.OS === "ios"
            ? REVENUECAT_API_KEY_IOS
              ? "SET"
              : "NOT SET"
            : REVENUECAT_API_KEY_ANDROID
              ? "SET"
              : "NOT SET"
          }`
        );
        isInitialized = false;
        // Return early to prevent any RevenueCat SDK calls
        return; // Don't throw, just return gracefully
      }

      // Enable debug logging in development
      if (enableDebugLogging) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure RevenueCat - this must be called before any other RevenueCat methods
      try {
        await Purchases.configure({ apiKey, appUserID: userId });
      } catch (configureError: any) {
        // Check if this is an Expo Go error
        const errorMessage = configureError?.message || String(configureError);
        if (
          errorMessage.includes("Expo Go") ||
          errorMessage.includes("native store is not available")
        ) {
          console.warn(
            `RevenueCat initialization skipped: ${errorMessage}. Use a development build or Test Store API key.`
          );
          isInitialized = false;
          return;
        }

        // If configure fails, don't set isInitialized to true
        console.error("Failed to configure RevenueCat:", configureError);
        isInitialized = false;
        // In production, don't throw - just return
        if (__DEV__) {
          throw configureError;
        }
        return;
      }

      // Now that configure succeeded, we can invalidate cache if needed
      // Note: Only invalidate if we need to force refresh, otherwise let it use cache
      // await Purchases.invalidateCustomerInfoCache();

      // Set user ID if provided
      if (userId) {
        await Purchases.logIn(userId);
      }

      // Set up customer info update listener
      Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        console.log("Customer info updated:", customerInfo);
        syncSubscriptionStatus(customerInfo).catch(console.error);
      });

      isInitialized = true;
      console.log("RevenueCat initialized successfully");
    } catch (error) {
      console.error("Error initializing RevenueCat:", error);
      isInitialized = false;
      // Don't throw in production - allow app to continue without RevenueCat
      if (__DEV__) {
        throw error;
      }
    } finally {
      // Clear the initialization promise so we can retry if needed
      initializationPromise = null;
    }
  })();

  return initializationPromise;
};

// Get available offerings (subscription plans)
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      // If initialization failed (e.g., missing API key), return null
      if (!isInitialized) {
        console.warn("RevenueCat not initialized, cannot get offerings");
        return null;
      }
    }
    const offerings = await Purchases.getOfferings();

    // Log all offerings for debugging
    console.log("📦 RevenueCat Offerings Debug:");
    console.log(
      `  Current offering: ${offerings.current?.identifier || "None"}`
    );
    console.log(
      `  All offerings count: ${Object.keys(offerings.all || {}).length}`
    );
    if (offerings.all && Object.keys(offerings.all).length > 0) {
      Object.entries(offerings.all).forEach(([key, offering]) => {
        const isCurrent = offering.identifier === offerings.current?.identifier;
        console.log(
          `    - ${key}${isCurrent ? " (CURRENT)" : ""}: ${offering.availablePackages.length
          } package(s)`
        );
        offering.availablePackages.forEach((pkg) => {
          console.log(
            `      • ${pkg.identifier} (${pkg.packageType}) - Product: ${pkg.product?.identifier || "N/A"
            }`
          );
        });
        if (offering.availablePackages.length === 0) {
          console.log(`      ⚠️  No packages in this offering`);
        }
      });
    }

    // Check for expected products
    const allProducts = new Set<string>();
    if (offerings.all) {
      Object.values(offerings.all).forEach((offering) => {
        offering.availablePackages.forEach((pkg) => {
          if (pkg.product?.identifier) {
            allProducts.add(pkg.product.identifier);
          }
        });
      });
    }

    console.log(
      `  Products found in offerings: ${Array.from(allProducts).join(", ") || "None"
      }`
    );
    const expectedProducts = ["break_monthly", "break_yearly"];
    expectedProducts.forEach((productId) => {
      if (
        !allProducts.has(productId) &&
        !allProducts.has(`${productId}:default`)
      ) {
        console.warn(
          `  ⚠️  Expected product "${productId}" not found in any offering`
        );
      }
    });

    return offerings.current;
  } catch (error) {
    console.error("Error getting offerings:", error);
    return null;
  }
};

// Get available packages from current offering
// Note: This only returns packages from the current offering.
// If you have packages in multiple offerings, use getAllPackages() instead.
export const getPackages = async (): Promise<PurchasesPackage[]> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        console.warn("RevenueCat not initialized, cannot get packages");
        return [];
      }
    }

    const offerings = await Purchases.getOfferings();

    if (!offerings.current) {
      console.warn(
        "⚠️  No current offering available, returning empty packages array"
      );
      return [];
    }

    const packages = offerings.current.availablePackages;
    console.log(
      `Found ${packages.length} package(s) in current offering "${offerings.current.identifier}"`
    );
    packages.forEach((pkg, index) => {
      console.log(
        `  ${index + 1}. ${pkg.identifier} (${pkg.packageType}) - ${pkg.product?.title || pkg.product?.identifier || "Unknown"
        } (${pkg.product?.priceString || "No price"})`
      );
    });
    console.log("");

    // If we only have 1 package but there are products available, try getting all packages
    if (packages.length === 1 && offerings.all) {
      const allPackagesCount = Object.values(offerings.all).reduce(
        (sum, offering) => sum + offering.availablePackages.length,
        0
      );
      if (allPackagesCount > 1) {
        console.warn(
          `⚠️  Only 1 package in current offering, but ${allPackagesCount} packages exist across all offerings. Consider using getAllPackages() instead.`
        );
      }
    }

    return packages;
  } catch (error) {
    console.error("Error getting packages:", error);
    return [];
  }
};

/**
 * Get all available packages from all offerings
 * This is useful when packages are spread across multiple offerings
 */
export const getAllPackages = async (): Promise<PurchasesPackage[]> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        console.warn("RevenueCat not initialized, cannot get all packages");
        return [];
      }
    }

    const offerings = await Purchases.getOfferings();
    const allPackages: PurchasesPackage[] = [];

    // Get packages from current offering
    if (offerings.current) {
      allPackages.push(...offerings.current.availablePackages);
    }

    // Get packages from all other offerings
    if (offerings.all) {
      Object.values(offerings.all).forEach((offering) => {
        // Skip current offering as we already added it
        if (offering.identifier !== offerings.current?.identifier) {
          allPackages.push(...offering.availablePackages);
        }
      });
    }

    // Remove duplicates based on package identifier
    const uniquePackages = Array.from(
      new Map(allPackages.map((pkg) => [pkg.identifier, pkg])).values()
    );

    console.log(
      `Found ${uniquePackages.length} unique package(s) across all offerings`
    );
    uniquePackages.forEach((pkg, index) => {
      console.log(
        `  ${index + 1}. ${pkg.identifier} (${pkg.packageType}) - ${pkg.product?.title || pkg.product?.identifier || "Unknown"
        } (${pkg.product?.priceString || "No price"})`
      );
      console.log(`      Product ID: ${pkg.product?.identifier || "N/A"}`);
    });
    console.log("");

    // Check for expected packages
    const hasMonthly = uniquePackages.some(
      (pkg) =>
        pkg.identifier === "$rc_monthly" ||
        pkg.packageType === "MONTHLY" ||
        pkg.identifier.toLowerCase().includes("monthly")
    );
    const hasYearly = uniquePackages.some(
      (pkg) =>
        pkg.identifier === "$rc_annual" ||
        pkg.identifier === "$rc_yearly" ||
        pkg.identifier.toLowerCase().includes("yearly") ||
        pkg.identifier.toLowerCase().includes("annual")
    );

    if (!hasMonthly) {
      console.warn("⚠️  Monthly package not found. Expected: $rc_monthly");
    }
    if (!hasYearly) {
      console.warn(
        "⚠️  Yearly package not found. Expected: $rc_annual or $rc_yearly"
      );
      console.warn(
        "    Make sure the yearly product (break_yearly) is added to your offering in RevenueCat dashboard."
      );
    }

    return uniquePackages;
  } catch (error) {
    console.error("Error getting all packages:", error);
    return [];
  }
};

/**
 * Purchase a subscription package
 *
 * @param packageToPurchase - The RevenueCat package to purchase
 * @returns CustomerInfo after successful purchase
 * @throws Error if purchase fails or is cancelled
 */
export const purchasePackage = async (
  packageToPurchase: PurchasesPackage
): Promise<CustomerInfo> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        throw new Error(
          "RevenueCat is not initialized. Please check your API keys."
        );
      }
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    await syncSubscriptionStatus(customerInfo);
    console.log("Purchase successful:", packageToPurchase.identifier);
    return customerInfo;
  } catch (error: any) {
    // Handle user cancellation
    if (error.userCancelled) {
      console.log("Purchase cancelled by user");
      throw new Error("Purchase cancelled");
    }

    // Handle RevenueCat errors
    if (error && typeof error === "object" && "code" in error) {
      const rcError = error as { code: string; message?: string };
      console.error(
        "RevenueCat purchase error:",
        rcError.code,
        rcError.message
      );
      throw new Error(`Purchase failed: ${rcError.message || rcError.code}`);
    }

    console.error("Error purchasing package:", error);
    throw error;
  }
};

// Restore purchases
export const restorePurchases = async (): Promise<CustomerInfo> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        throw new Error(
          "RevenueCat is not initialized. Cannot restore purchases."
        );
      }
    }

    const customerInfo = await Purchases.restorePurchases();
    await syncSubscriptionStatus(customerInfo);
    return customerInfo;
  } catch (error) {
    console.error("Error restoring purchases:", error);
    throw error;
  }
};

/**
 * Restore purchases with a specific customer ID
 * This logs in with the provided customer ID and then restores purchases
 *
 * @param customerId - The customer ID to restore purchases for
 * @returns CustomerInfo after successful restore
 */
export const restorePurchasesWithCustomerId = async (
  customerId: string
): Promise<CustomerInfo> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        throw new Error(
          "RevenueCat is not initialized. Cannot restore purchases."
        );
      }
    }

    // Log in with the provided customer ID
    await Purchases.logIn(customerId);

    // Restore purchases for this customer
    const customerInfo = await Purchases.restorePurchases();
    await syncSubscriptionStatus(customerInfo);
    return customerInfo;
  } catch (error) {
    console.error("Error restoring purchases with customer ID:", error);
    throw error;
  }
};

// Get current customer info
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      // If initialization failed (e.g., missing API key), isInitialized will still be false
      if (!isInitialized) {
        console.warn("RevenueCat not initialized, cannot get customer info");
        return null;
      }
    }

    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error("Error getting customer info:", error);
    // In production, return null instead of throwing to prevent app crashes
    if (__DEV__) {
      throw error;
    }
    return null;
  }
};

/**
 * Get customer ID (originalAppUserId) from RevenueCat
 * This ID can be used to restore purchases
 *
 * @returns Customer ID string, or null if not available
 */
export const getCustomerId = async (): Promise<string | null> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      return null;
    }
    return customerInfo.originalAppUserId || null;
  } catch (error) {
    console.error("Error getting customer ID:", error);
    return null;
  }
};

/**
 * Sync subscription status from RevenueCat to local storage
 * Checks for "Premium" entitlement to determine subscription status
 */
export const syncSubscriptionStatus = async (
  customerInfo: CustomerInfo | null
): Promise<void> => {
  if (!customerInfo) {
    console.warn("No customer info provided, skipping subscription sync");
    return;
  }

  try {
    const settings = await getSettings();

    // Check for Premium entitlement (primary entitlement)
    const activeEntitlements = customerInfo.entitlements.active;
    const allEntitlements = customerInfo.entitlements.all;

    let tier: SubscriptionTier = "free";
    let status: SubscriptionStatus = "expired";
    let endDate: string | undefined;
    let autoRenew = false;

    // Check for Premium entitlement (case-insensitive)
    const premiumEntitlementKey = Object.keys(activeEntitlements).find(
      (key) => key.toLowerCase() === PREMIUM_ENTITLEMENT.toLowerCase()
    );
    const premiumEntitlement = premiumEntitlementKey
      ? activeEntitlements[premiumEntitlementKey]
      : undefined;

    if (premiumEntitlement) {
      // User has active Premium entitlement
      tier = "premium";
      status = premiumEntitlement.willRenew ? "active" : "canceled";
      endDate = premiumEntitlement.expirationDate || undefined;
      autoRenew = premiumEntitlement.willRenew;
    } else {
      // Check all entitlements for grace period or expired status
      const allPremiumKey = Object.keys(allEntitlements).find(
        (key) => key.toLowerCase() === PREMIUM_ENTITLEMENT.toLowerCase()
      );
      const allPremium = allPremiumKey
        ? allEntitlements[allPremiumKey]
        : undefined;

      if (allPremium) {
        tier = "premium";
        status = allPremium.isActive ? "grace_period" : "expired";
        endDate = allPremium.expirationDate || undefined;
      }

      // Check for Breakfree Pro entitlement (legacy)
      const breakfreeProEntitlement =
        activeEntitlements[BREAKFREE_PRO_ENTITLEMENT];

      if (breakfreeProEntitlement && tier === "free") {
        // User has active Breakfree Pro entitlement
        tier = "pro"; // All Breakfree Pro users get pro tier
        status = breakfreeProEntitlement.willRenew ? "active" : "canceled";
        endDate = breakfreeProEntitlement.expirationDate || undefined;
        autoRenew = breakfreeProEntitlement.willRenew;
      } else if (tier === "free") {
        // Check all entitlements for grace period or expired status
        const allBreakfreePro = allEntitlements[BREAKFREE_PRO_ENTITLEMENT];
        if (allBreakfreePro) {
          tier = "pro";
          status = allBreakfreePro.isActive ? "grace_period" : "expired";
          endDate = allBreakfreePro.expirationDate || undefined;
        }
      }

      // Fallback: Check for legacy entitlements (premium/pro) for backward compatibility
      if (tier === "free") {
        if (activeEntitlements["premium"] || activeEntitlements["pro"]) {
          const entitlement =
            activeEntitlements["pro"] || activeEntitlements["premium"];
          tier = activeEntitlements["pro"] ? "pro" : "premium";
          status = entitlement.willRenew ? "active" : "canceled";
          endDate = entitlement.expirationDate || undefined;
          autoRenew = entitlement.willRenew;
        } else if (allEntitlements["premium"] || allEntitlements["pro"]) {
          const entitlement =
            allEntitlements["pro"] || allEntitlements["premium"];
          tier = allEntitlements["pro"] ? "pro" : "premium";
          status = entitlement.isActive ? "grace_period" : "expired";
          endDate = entitlement.expirationDate || undefined;
        }
      }
    }

    // Update settings with subscription info
    const updatedSettings: UserSettings = {
      ...settings,
      subscriptionTier: tier,
      subscriptionStatus: status,
      subscriptionEndDate: endDate,
      subscriptionAutoRenew: autoRenew,
    };

    await saveSettings(updatedSettings);
    console.log("Subscription status synced:", {
      tier,
      status,
      endDate,
      autoRenew,
    });
  } catch (error) {
    console.error("Error syncing subscription status:", error);
  }
};

// Get current subscription tier from local storage
export const getCurrentSubscriptionTier =
  async (): Promise<SubscriptionTier> => {
    try {
      const settings = await getSettings();
      return settings.subscriptionTier || "free";
    } catch (error) {
      console.error("Error getting subscription tier:", error);
      return "free";
    }
  };

/**
 * Check if user has active subscription (Premium or Pro)
 */
export const hasActiveSubscription = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      // Fallback to local storage if RevenueCat is not available
      const settings = await getSettings();
      return settings.subscriptionStatus === "active";
    }

    // Check for Premium entitlement (case-insensitive)
    const hasPremium = Object.keys(customerInfo.entitlements.active).some(
      (key) => key.toLowerCase() === PREMIUM_ENTITLEMENT.toLowerCase()
    );

    // Check for Breakfree Pro entitlement (legacy)
    const hasBreakfreePro =
      customerInfo.entitlements.active[BREAKFREE_PRO_ENTITLEMENT] !== undefined;

    // Fallback: Check for any active entitlement (backward compatibility)
    const hasAnyActive =
      Object.keys(customerInfo.entitlements.active).length > 0;
    const hasActive = hasPremium || hasBreakfreePro || hasAnyActive;

    if (hasActive) {
      await syncSubscriptionStatus(customerInfo);
    }

    return hasActive;
  } catch (error) {
    console.error("Error checking active subscription:", error);
    // Fallback to local storage
    const settings = await getSettings();
    return settings.subscriptionStatus === "active";
  }
};

/**
 * Check if user has Premium entitlement
 */
export const hasPremium = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      return false;
    }
    return Object.keys(customerInfo.entitlements.active).some(
      (key) => key.toLowerCase() === PREMIUM_ENTITLEMENT.toLowerCase()
    );
  } catch (error) {
    console.error("Error checking Premium:", error);
    return false;
  }
};

/**
 * Check if user has Breakfree Pro entitlement (legacy)
 */
export const hasBreakfreePro = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      return false;
    }
    return (
      customerInfo.entitlements.active[BREAKFREE_PRO_ENTITLEMENT] !== undefined
    );
  } catch (error) {
    console.error("Error checking Breakfree Pro:", error);
    return false;
  }
};

// Check if feature is available for current tier
export const isFeatureAvailable = async (
  feature:
    | "cloud_sync"
    | "multiple_habits"
    | "accountability"
    | "content_library"
    | "advanced_analytics"
    | "community"
): Promise<boolean> => {
  const tier = await getCurrentSubscriptionTier();

  const featureTiers: Record<string, SubscriptionTier[]> = {
    cloud_sync: ["premium", "pro", "family"],
    multiple_habits: ["premium", "pro", "family"],
    accountability: ["premium", "pro", "family"],
    content_library: ["premium", "pro", "family"],
    advanced_analytics: ["pro", "family"],
    community: ["pro", "family"],
  };

  return featureTiers[feature]?.includes(tier) || false;
};

// Get subscription plan by tier
export const getPlanByTier = (
  tier: SubscriptionTier
): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.tier === tier);
};

/**
 * Format price for display
 */
export const formatPrice = (
  price: number,
  currency: string = "USD"
): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
};

/**
 * Present RevenueCat Paywall
 * Shows the native RevenueCat paywall UI
 *
 * @param offering - Optional offering to display. If not provided, uses current offering
 * @returns CustomerInfo if purchase is made, null if dismissed
 */
export const presentRevenueCatPaywall = async (
  offering?: PurchasesOffering
): Promise<CustomerInfo | null> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        console.warn("RevenueCat is not initialized. Cannot present paywall.");
        return null;
      }
    }

    let offeringToPresent = offering;
    if (!offeringToPresent) {
      const currentOffering = await getOfferings();
      if (!currentOffering) {
        throw new Error("No offering available to present");
      }
      offeringToPresent = currentOffering;
    }

    const result = await PurchasesUI.presentPaywall({
      offering: offeringToPresent,
    });

    // Check if purchase was made (result indicates purchase completed)
    // PAYWALL_RESULT.PURCHASED means a purchase was made
    // The result is an enum, check for PURCHASED value
    const PAYWALL_RESULT_PURCHASED = "PURCHASED";
    if (
      result === PAYWALL_RESULT_PURCHASED ||
      String(result).includes("PURCHASED")
    ) {
      // Get updated customer info after purchase
      const customerInfo = await getCustomerInfo();
      await syncSubscriptionStatus(customerInfo);
      return customerInfo;
    }

    // User dismissed or cancelled
    return null;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log("Paywall dismissed by user");
      return null;
    }
    console.error("Error presenting paywall:", error);
    throw error;
  }
};

/**
 * Present Customer Center
 * Allows users to manage their subscription
 *
 * @returns true if customer center was presented, false otherwise
 */
export const presentCustomerCenter = async (): Promise<boolean> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        console.warn(
          "RevenueCat is not initialized. Cannot present customer center."
        );
        return false;
      }
    }

    // Note: Customer Center is typically handled by the platform's native UI
    // For iOS: Direct users to Settings > [Your Name] > Subscriptions
    // For Android: Direct users to Google Play Store subscriptions
    // RevenueCat doesn't provide a built-in customer center UI component

    // You can use this function to check subscription status and guide users
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      console.log("No customer info available");
      return false;
    }

    const hasActive = await hasActiveSubscription();

    if (!hasActive) {
      console.log("No active subscription to manage");
      return false;
    }

    // Log customer info for debugging
    console.log("Customer info:", {
      activeSubscriptions: Object.keys(customerInfo.entitlements.active),
      allSubscriptions: Object.keys(customerInfo.entitlements.all),
    });

    return true;
  } catch (error) {
    console.error("Error presenting customer center:", error);
    return false;
  }
};

/**
 * Get package by identifier
 * Helper function to find a specific package from available packages
 *
 * @param identifier - Package identifier (e.g., 'monthly', 'yearly', 'lifetime')
 * @returns Package if found, null otherwise
 */
export const getPackageByIdentifier = async (
  identifier: string
): Promise<PurchasesPackage | null> => {
  try {
    const packages = await getPackages();
    return packages.find((pkg) => pkg.identifier === identifier) || null;
  } catch (error) {
    console.error("Error getting package by identifier:", error);
    return null;
  }
};

/**
 * Get package by product ID
 * Helper function to find a package by its store product ID
 *
 * @param productId - Store product ID
 * @returns Package if found, null otherwise
 */
export const getPackageByProductId = async (
  productId: string
): Promise<PurchasesPackage | null> => {
  try {
    const packages = await getPackages();
    return packages.find((pkg) => pkg.product.identifier === productId) || null;
  } catch (error) {
    console.error("Error getting package by product ID:", error);
    return null;
  }
};

/**
 * Check if a product is a lifetime purchase
 *
 * @param packageToCheck - Package to check
 * @returns true if the package is a lifetime purchase
 */
export const isLifetimePackage = (
  packageToCheck: PurchasesPackage
): boolean => {
  const identifier = packageToCheck.identifier.toLowerCase();
  return identifier.includes("lifetime") || identifier === "lifetime";
};

/**
 * Get customer info with detailed subscription information
 *
 * @returns Detailed customer info including active entitlements
 */
export const getDetailedCustomerInfo = async (): Promise<{
  customerInfo: CustomerInfo | null;
  hasPremium: boolean;
  hasBreakfreePro: boolean;
  activeEntitlements: string[];
  activeSubscriptions: string[];
}> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) {
      return {
        customerInfo: null,
        hasPremium: false,
        hasBreakfreePro: false,
        activeEntitlements: [],
        activeSubscriptions: [],
      };
    }

    const hasPrem = Object.keys(customerInfo.entitlements.active).some(
      (key) => key.toLowerCase() === PREMIUM_ENTITLEMENT.toLowerCase()
    );
    const hasPro =
      customerInfo.entitlements.active[BREAKFREE_PRO_ENTITLEMENT] !== undefined;
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    const activeSubscriptions = Object.keys(customerInfo.activeSubscriptions);

    return {
      customerInfo,
      hasPremium: hasPrem,
      hasBreakfreePro: hasPro,
      activeEntitlements,
      activeSubscriptions,
    };
  } catch (error) {
    console.error("Error getting detailed customer info:", error);
    return {
      customerInfo: null,
      hasPremium: false,
      hasBreakfreePro: false,
      activeEntitlements: [],
      activeSubscriptions: [],
    };
  }
};

/**
 * Diagnostic function to check package availability
 * Helps identify if products are missing from offerings
 */
export const diagnosePackages = async (): Promise<void> => {
  try {
    if (!isInitialized) {
      await initializePurchases();
      if (!isInitialized) {
        console.warn("RevenueCat not initialized, cannot diagnose packages");
        return;
      }
    }
    // const offerings = await Purchases.getOfferings();
    const allPackages = await getAllPackages();

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 RevenueCat Package Diagnosis");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Check expected packages
    const expectedPackages = [
      {
        identifier: "$rc_monthly",
        productId: "break_monthly",
        name: "Monthly",
      },
      { identifier: "$rc_annual", productId: "break_yearly", name: "Yearly" },
    ];

    expectedPackages.forEach((expected) => {
      const found = allPackages.find(
        (pkg) =>
          pkg.identifier === expected.identifier ||
          pkg.product?.identifier === expected.productId ||
          pkg.product?.identifier === `${expected.productId}:default`
      );

      if (found) {
        console.log(`✅ ${expected.name} package found:`);
        console.log(`   Identifier: ${found.identifier}`);
        console.log(`   Product ID: ${found.product?.identifier || "N/A"}`);
        console.log(`   Package Type: ${found.packageType}`);
        console.log(`   Price: ${found.product?.priceString || "N/A"}`);
      } else {
        console.log(`❌ ${expected.name} package NOT found`);
        console.log(`   Expected identifier: ${expected.identifier}`);
        console.log(`   Expected product ID: ${expected.productId}`);
        console.log(
          `   ⚠️  Action needed: Add "${expected.productId}" to your offering in RevenueCat dashboard`
        );
      }
      console.log("");
    });

    // Summary
    const foundCount = expectedPackages.filter((expected) =>
      allPackages.some(
        (pkg) =>
          pkg.identifier === expected.identifier ||
          pkg.product?.identifier === expected.productId ||
          pkg.product?.identifier === `${expected.productId}:default`
      )
    ).length;

    console.log(
      `Summary: ${foundCount}/${expectedPackages.length} expected packages found`
    );
    if (foundCount < expectedPackages.length) {
      console.log("\n💡 To fix missing packages:");
      console.log("   1. Go to RevenueCat Dashboard → Offerings");
      console.log("   2. Open your current offering");
      console.log("   3. Add the missing product(s) to the offering");
      console.log(
        "   4. RevenueCat will automatically create the package identifier"
      );
    }
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("Error diagnosing packages:", error);
  }
};

/**
 * Log detailed information about RevenueCat packages
 * Useful for debugging and understanding available packages
 *
 * @param packages - Array of packages to log (optional, will fetch if not provided)
 */
export const logPackagesDetails = async (
  packages?: PurchasesPackage[]
): Promise<void> => {
  try {
    const packagesToLog = packages || (await getPackages());

    if (packagesToLog.length === 0) {
      console.log("📦 No packages available to log");
      return;
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 RevenueCat Packages - Detailed Log");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    packagesToLog.forEach((pkg, index) => {
      console.log(`\n📋 Package ${index + 1}/${packagesToLog.length}:`);
      console.log("  ──────────────────────────────────────");
      console.log("  Identifier:", pkg.identifier);
      console.log("  Package Type:", pkg.packageType);

      if (pkg.product) {
        const product = pkg.product;
        console.log("\n  Product Details:");
        console.log("    Product ID:", product.identifier);
        console.log("    Title:", product.title || "N/A");
        console.log("    Description:", product.description || "N/A");
        console.log("    Price String:", product.priceString || "N/A");
        console.log("    Price (numeric):", product.price || "N/A");
        console.log("    Currency Code:", product.currencyCode || "N/A");
        console.log(
          "    Subscription Period:",
          product.subscriptionPeriod || "N/A"
        );
        console.log(
          "    Introductory Price:",
          product.introPrice?.priceString || "None"
        );
        console.log("    Discounts:", product.discounts?.length || 0);
        if (product.discounts && product.discounts.length > 0) {
          product.discounts.forEach((discount: any, i: number) => {
            console.log(
              `      Discount ${i + 1}:`,
              discount.priceString || "N/A"
            );
          });
        }
      } else {
        console.log("  ⚠️  No store product information available");
      }
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("Error logging package details:", error);
  }
};


