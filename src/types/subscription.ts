// Subscription types and interfaces

export type SubscriptionTier = "free" | "premium" | "pro" | "family";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "expired"
  | "trial"
  | "grace_period";

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  trialEndDate?: string; // ISO date string
  autoRenew: boolean;
  platform: "ios" | "android" | "web";
  productId: string; // Store product ID
  originalTransactionId?: string;
  purchaseToken?: string; // Android purchase token
  receipt?: string; // iOS receipt
}

/**
 * IMPORTANT:
 * - Prices MUST come from StoreKit / RevenueCat
 * - Do NOT hardcode prices for display
 */
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;

  /** Store product identifiers */
  monthlyProductId?: string;
  yearlyProductId?: string;

  features: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    tier: "free",
    name: "Free",
    description: "Basic tracking and essential features",
    features: [
      "Basic daily routine tracking",
      "Limited journal entries (3 per week)",
      "Emergency urge protocol",
      "Basic streak tracking (last 30 days)",
      "Basic statistics (last 7 days)",
      "1 habit tracking",
      "Basic notifications",
    ],
  },
  {
    id: "premium",
    tier: "premium",
    name: "Premium",
    description: "Complete recovery toolkit",
    monthlyProductId: "break_monthly",
    yearlyProductId: "break_yearly",
    popular: true,
    features: [
      "Everything in Free",
      "Full daily journal (unlimited entries)",
      "Unlimited streak history",
      "Advanced statistics (all time periods)",
      "Multiple habits tracking",
      "Goal setting & planning",
      "Data export (JSON + formatted reports)",
      "Cloud sync & backup",
      "1 Accountability partner",
      "Content library access",
      "Progress visualizations",
      "Priority support",
    ],
  },
];

export const PRODUCT_IDS = {
  // iOS StoreKit product IDs
  PREMIUM_MONTHLY_IOS: "break_monthly",
  PREMIUM_YEARLY_IOS: "break_yearly",

  // Android Play Store product IDs
  PREMIUM_MONTHLY_ANDROID: "break_monthly:default",
  PREMIUM_YEARLY_ANDROID: "break_yearly:default",

  // RevenueCat package identifiers (IMPORTANT)
  PREMIUM_MONTHLY_PACKAGE: "$rc_monthly",
  PREMIUM_YEARLY_PACKAGE: "$rc_annual",
} as const;
