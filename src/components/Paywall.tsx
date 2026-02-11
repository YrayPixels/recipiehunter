import BottomSheetLib from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Check, Lock, X } from 'react-native-feather';
import { PurchasesPackage } from 'react-native-purchases';

import { getRequiredTier, getUpgradeMessage } from '../lib/features';
import { getAllPackages, getPackages, initializePurchases } from '../lib/subscription';
import { SUBSCRIPTION_PLANS } from '../types/subscription';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

export interface PaywallRef {
  open: () => void;
  close: () => void;
}

interface PaywallProps {
  visible?: boolean;
  onClose?: () => void;
  feature:
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
  featureName?: string;
  bottomSheetRef?: React.RefObject<BottomSheetLib | null>;
}

export const Paywall = React.forwardRef<PaywallRef, PaywallProps>(
  (
    {
      visible,
      onClose,
      feature,
      featureName,
      bottomSheetRef: externalBottomSheetRef,
    },
    ref
  ) => {
    const router = useRouter();

    const internalBottomSheetRef = useRef<BottomSheetLib | null>(null);
    const bottomSheetRef = externalBottomSheetRef || internalBottomSheetRef;

    const [packages, setPackages] = useState<PurchasesPackage[]>([]);
    const [loading, setLoading] = useState(false);

    const requiredTier = getRequiredTier(feature);
    const upgradeMessage = getUpgradeMessage(
      featureName || feature,
      requiredTier
    );

    const premiumPlan = SUBSCRIPTION_PLANS.find(
      plan => plan.tier === 'premium'
    );

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.expand();
        loadPackages();
      },
      close: () => {
        bottomSheetRef.current?.close();
      },
    }));

    useEffect(() => {
      if (visible) {
        bottomSheetRef.current?.expand();
        loadPackages();
      } else if (visible === false) {
        bottomSheetRef.current?.close();
      }
    }, [visible]);

    const loadPackages = async () => {
      try {
        setLoading(true);
        await initializePurchases();
        // Use getAllPackages to get packages from all offerings, not just current
        const allPackages = await getAllPackages();
        // Fallback to getPackages if getAllPackages returns empty (for backward compatibility)
        setPackages(allPackages.length > 0 ? allPackages : await getPackages());
      } catch (error) {
        console.error('Paywall package load error:', error);
      } finally {
        setLoading(false);
      }
    };

    const getMonthlyPackage = () =>
      packages.find(pkg => {
        const packageType = pkg.packageType?.toUpperCase();
        return packageType === 'MONTHLY' ||
          packageType === 'MONTH' ||
          pkg.identifier.toLowerCase().includes('monthly') ||
          pkg.identifier.toLowerCase().includes('month');
      });

    const getAnnualPackage = () =>
      packages.find(pkg => {
        const packageType = pkg.packageType?.toUpperCase();
        return packageType === 'ANNUAL' ||
          packageType === 'YEARLY' ||
          packageType === 'YEAR' ||
          pkg.identifier.toLowerCase().includes('yearly') ||
          pkg.identifier.toLowerCase().includes('year') ||
          pkg.identifier.toLowerCase().includes('annual');
      });

    const handleUpgrade = () => {
      bottomSheetRef.current?.close();
      onClose?.();
      router.push('/subscription');
    };

    const handleClose = () => {
      bottomSheetRef.current?.close();
      onClose?.();
    };

    const getFeatureDescription = () => {
      const descriptions: Record<string, string> = {
        cloud_sync:
          'Sync your data across all devices and never lose your progress',
        multiple_habits:
          'Track multiple habits simultaneously and manage your recovery journey',
        accountability:
          'Connect with accountability partners for support and motivation',
        content_library:
          'Access exclusive recovery content, guides, and resources',
        advanced_analytics:
          'Get deep insights into your patterns with advanced analytics',
        community:
          'Join a supportive community of people on the same journey',
        journal_unlimited:
          'Create unlimited journal entries to track your recovery journey',
        goal_setting:
          'Set and track goals to stay motivated and measure progress',
        data_export:
          'Export your data in JSON and formatted reports',
        unlimited_streak_history:
          'View your complete streak history over time',
        advanced_statistics:
          'Access detailed statistics for all time periods',
      };

      return descriptions[feature] || 'Unlock this premium feature';
    };

    const monthlyPackage = getMonthlyPackage();
    const annualPackage = getAnnualPackage();
    const primaryColor = '#5a7a5a';

    return (
      <BottomSheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={['85%', '95%']}
        onClose={handleClose}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 16,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-2">
              <Lock width={24} height={24} color={primaryColor} />
              <Text className="text-2xl  text-foreground dark:text-foreground-dark">Premium Feature</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              className="w-9 h-9 rounded-lg items-center justify-center border border-border dark:border-gray-700"
            >
              <X
                width={18}
                height={18}
                color="#5a7a5a"
              />
            </TouchableOpacity>
          </View>

          {/* Locked Feature */}
          <Card className="border-2 border-primary dark:border-primary-dark mb-6">
            <CardContent className="pt-4">
              <View className="items-center mb-4">
                <View className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary-dark/20 items-center justify-center mb-4">
                  <Lock width={32} height={32} color={primaryColor} />
                </View>
                <Text className="text-xl  text-center mb-2 text-foreground dark:text-foreground-dark">
                  {featureName ||
                    feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark text-center">
                  {getFeatureDescription()}
                </Text>
              </View>

              <View className="bg-sage-light dark:bg-sage-light/20 rounded-lg p-4">
                <Text className="text-sm font-medium text-center text-foreground dark:text-foreground-dark">
                  {upgradeMessage}
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Plan Preview */}
          {premiumPlan && requiredTier === 'premium' && (
            <Card className="mb-6 border-2 border-primary dark:border-primary-dark">
              <CardHeader>
                <CardTitle className="text-xl">
                  {premiumPlan.name}
                </CardTitle>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark mb-3">
                  {premiumPlan.description}
                </Text>

                <View className="flex-row items-center gap-2">
                  <Text className="text-3xl  text-foreground dark:text-foreground-dark">
                    {monthlyPackage?.product.priceString ?? '—'}
                  </Text>
                  <Text className="text-muted-foreground dark:text-muted-foreground-dark">/month</Text>
                </View>

                {annualPackage && monthlyPackage && (
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mt-1">
                    {monthlyPackage.product.priceString}/month billed annually
                  </Text>
                )}
              </CardHeader>

              <CardContent>
                <View className="gap-3 mb-6">
                  {premiumPlan.features.slice(0, 5).map((feat, i) => (
                    <View key={i} className="flex-row gap-2">
                      <Check width={18} height={18} color={primaryColor} />
                      <Text className="text-foreground dark:text-foreground-dark">{feat}</Text>
                    </View>
                  ))}
                </View>

                <Button onPress={handleUpgrade} className="w-full">
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}

          <Button
            variant="outline"
            onPress={() => {
              handleClose();
              router.push('/subscription');
            }}
          >
            View All Plans & Pricing
          </Button>
        </ScrollView>
      </BottomSheet>
    );
  }
);

Paywall.displayName = 'Paywall';
