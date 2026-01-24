import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { canAccessFeature } from '../lib/features';
import { Paywall, PaywallRef } from './Paywall';

interface FeatureGuardProps {
  feature: 'cloud_sync' | 'multiple_habits' | 'accountability' | 'content_library' | 'advanced_analytics' | 'community';
  featureName?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPaywall?: boolean;
  onAccessDenied?: () => void;
}

/**
 * FeatureGuard component that wraps premium features and shows paywall if user doesn't have access
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  featureName,
  children,
  fallback,
  showPaywall = true,
  onAccessDenied,
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const paywallRef = useRef<PaywallRef>(null);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    try {
      const access = await canAccessFeature(feature);
      setHasAccess(access);
      
      if (!access && onAccessDenied) {
        onAccessDenied();
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePaywallClose = () => {
    setShowPaywallModal(false);
    paywallRef.current?.close();
    // Re-check access after paywall is closed (in case user upgraded)
    checkAccess();
  };

  const handleFeatureClick = () => {
    if (!hasAccess && showPaywall) {
      setShowPaywallModal(true);
      paywallRef.current?.open();
    }
  };

  if (loading) {
    return <View>{fallback || null}</View>;
  }

  if (!hasAccess) {
    return (
      <>
        <View onTouchEnd={handleFeatureClick}>
          {fallback || (
            <View className="opacity-50 pointer-events-none">
              {children}
            </View>
          )}
        </View>
        {showPaywall && (
          <Paywall
            ref={paywallRef}
            visible={showPaywallModal}
            onClose={handlePaywallClose}
            feature={feature}
            featureName={featureName}
          />
        )}
      </>
    );
  }

  return <>{children}</>;
};

/**
 * Hook to check if a feature is accessible
 * Returns: { hasAccess, loading, showPaywall }
 */
export const useFeatureAccess = (
  feature: 'cloud_sync' | 'multiple_habits' | 'accountability' | 'content_library' | 'advanced_analytics' | 'community'
) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    try {
      const access = await canAccessFeature(feature);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const requestAccess = () => {
    if (!hasAccess) {
      setShowPaywall(true);
    }
  };

  return {
    hasAccess: hasAccess === true,
    loading,
    showPaywall,
    setShowPaywall,
    refresh: checkAccess,
  };
};


