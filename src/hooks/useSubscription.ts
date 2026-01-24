// Hook for managing subscription state
import { useEffect, useState } from 'react';
import {
  getCurrentSubscriptionTier,
  hasActiveSubscription,
  initializePurchases,
  syncSubscriptionStatus,
} from '../lib/subscription';
import { SubscriptionTier } from '../types/subscription';

export const useSubscription = () => {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      
      // Initialize if not already done
      await initializePurchases();
      
      // Get current tier
      const currentTier = await getCurrentSubscriptionTier();
      setTier(currentTier);
      
      // Check if subscription is active
      const active = await hasActiveSubscription();
      setIsActive(active);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await loadSubscription();
  };

  return {
    tier,
    isActive,
    loading,
    refresh,
  };
};

