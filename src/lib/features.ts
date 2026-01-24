// Feature gating utilities
import { getCurrentSubscriptionTier, isFeatureAvailable } from './subscription';
import { SubscriptionTier } from '../types/subscription';

export type FeatureName = 
  | 'cloud_sync' 
  | 'multiple_habits' 
  | 'accountability' 
  | 'content_library' 
  | 'advanced_analytics' 
  | 'community'
  | 'journal_unlimited'
  | 'goal_setting'
  | 'data_export'
  | 'unlimited_streak_history'
  | 'advanced_statistics';

/**
 * Check if a feature is available for the current subscription tier
 */
export const canAccessFeature = async (feature: FeatureName): Promise<boolean> => {
  // For new features not in subscription.ts, check tier directly
  if (['journal_unlimited', 'goal_setting', 'data_export', 'unlimited_streak_history', 'advanced_statistics'].includes(feature)) {
    const currentTier = await getCurrentSubscriptionTier();
    const requiredTier = getRequiredTier(feature);
    return hasMinimumTierSync(currentTier, requiredTier);
  }
  
  return await isFeatureAvailable(feature);
};

/**
 * Get the minimum tier required for a feature
 */
export const getRequiredTier = (feature: FeatureName): SubscriptionTier => {
  const featureTiers: Record<string, SubscriptionTier> = {
    cloud_sync: 'premium',
    multiple_habits: 'premium',
    accountability: 'premium',
    content_library: 'premium',
    advanced_analytics: 'pro',
    community: 'pro',
    journal_unlimited: 'premium',
    goal_setting: 'premium',
    data_export: 'premium',
    unlimited_streak_history: 'premium',
    advanced_statistics: 'premium',
  };
  
  return featureTiers[feature] || 'free';
};

/**
 * Synchronous version of hasMinimumTier for use in non-async contexts
 */
const hasMinimumTierSync = (currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean => {
  const tierHierarchy: SubscriptionTier[] = ['free', 'premium', 'pro', 'family'];
  const currentIndex = tierHierarchy.indexOf(currentTier);
  const requiredIndex = tierHierarchy.indexOf(requiredTier);
  
  return currentIndex >= requiredIndex;
};

/**
 * Check if user has at least the required tier
 */
export const hasMinimumTier = async (requiredTier: SubscriptionTier): Promise<boolean> => {
  const currentTier = await getCurrentSubscriptionTier();
  
  const tierHierarchy: SubscriptionTier[] = ['free', 'premium', 'pro', 'family'];
  const currentIndex = tierHierarchy.indexOf(currentTier);
  const requiredIndex = tierHierarchy.indexOf(requiredTier);
  
  return currentIndex >= requiredIndex;
};

/**
 * Get upgrade message for a feature
 */
export const getUpgradeMessage = (feature: string, requiredTier: SubscriptionTier): string => {
  const tierName = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
  return `This feature requires a ${tierName} subscription. Upgrade to unlock ${feature}.`;
};

/**
 * Check if user can create a new journal entry (free users limited to 3 per week)
 */
export const canCreateJournalEntry = async (date: string): Promise<{ allowed: boolean; reason?: string; countThisWeek?: number }> => {
  const hasUnlimited = await canAccessFeature('journal_unlimited');
  
  if (hasUnlimited) {
    return { allowed: true };
  }
  
  // For free users, check if they've used their 3 entries this week
  const { getJournalEntries } = await import('./storage');
  const entries = await getJournalEntries();
  
  // Get current week (Monday to Sunday)
  const entryDate = new Date(date);
  const dayOfWeek = entryDate.getDay();
  const diff = entryDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(entryDate.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  // Count entries in this week
  const entriesThisWeek = Object.keys(entries).filter(entryDate => {
    const date = new Date(entryDate);
    return date >= monday && date <= sunday;
  });
  
  const countThisWeek = entriesThisWeek.length;
  
  // Check if this date already has an entry (editing is allowed)
  // Date should already be in YYYY-MM-DD format from format() function
  const hasExistingEntry = entries[date] !== undefined;
  
  if (hasExistingEntry) {
    // Editing existing entry is allowed
    return { allowed: true };
  }
  
  if (countThisWeek >= 3) {
    return {
      allowed: false,
      reason: 'Free users are limited to 3 journal entries per week. Upgrade to Premium for unlimited entries.',
      countThisWeek: 3,
    };
  }
  
  return { allowed: true, countThisWeek };
};

