import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { Check, Star, ChevronLeft } from 'react-native-feather';
import { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../src/components/Text';
import { useAlert } from '../src/hooks/useAlert';
import {
  getAllPackages,
  getCurrentSubscriptionTier,
  getPackages,
  initializePurchases,
  presentCustomerCenter,
  purchasePackage,
  restorePurchases,
  restorePurchasesWithCustomerId,
} from '../src/lib/subscription';
import { useTheme } from '../src/lib/theme';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../src/types/subscription';

const SubscriptionPage: React.FC = () => {
  const router = useRouter();
  const { alert, AlertComponent } = useAlert();
  const { effectiveTheme } = useTheme();
  const alertRef = useRef(alert);

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<'free' | 'premium' | 'pro' | 'family'>('free');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [restoringWithId, setRestoringWithId] = useState(false);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      await initializePurchases();
      setCurrentTier(await getCurrentSubscriptionTier());
      // Use getAllPackages to get packages from all offerings, not just current
      const allPackages = await getAllPackages();
      // Fallback to getPackages if getAllPackages returns empty (for backward compatibility)
      setPackages(allPackages.length > 0 ? allPackages : await getPackages());
    } catch (error) {
      console.error(error);
      alertRef.current('Error', 'Failed to load subscription data.', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const getPackageForPeriod = (period: 'monthly' | 'yearly') => {
    return packages.find(pkg => {
      const packageType = pkg.packageType?.toUpperCase();
      if (period === 'monthly') {
        return packageType === 'MONTHLY' ||
          packageType === 'MONTH' ||
          pkg.identifier.toLowerCase().includes('monthly') ||
          pkg.identifier.toLowerCase().includes('month');
      } else {
        return packageType === 'ANNUAL' ||
          packageType === 'YEARLY' ||
          packageType === 'YEAR' ||
          pkg.identifier.toLowerCase().includes('yearly') ||
          pkg.identifier.toLowerCase().includes('year') ||
          pkg.identifier.toLowerCase().includes('annual');
      }
    });
  };

  const handlePurchase = async (plan: SubscriptionPlan, period: 'monthly' | 'yearly') => {
    try {
      setPurchasing(`${plan.tier}_${period}`);

      const targetPackage = getPackageForPeriod(period);
      if (!targetPackage) {
        alertRef.current(
          'Unavailable',
          'Subscription option is not available right now.',
          undefined,
          'error'
        );
        return;
      }

      await purchasePackage(targetPackage);
      await loadSubscriptionData();

      alertRef.current(
        'Success!',
        `You've successfully subscribed to ${plan.name}.`,
        [{ text: 'OK', onPress: () => router.back() }],
        'success'
      );
    } catch (error: any) {
      if (error?.userCancelled) return;

      alertRef.current(
        'Purchase Failed',
        error?.message ?? 'An error occurred during purchase.',
        undefined,
        'error'
      );
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      await restorePurchases();
      await loadSubscriptionData();
      alert('Success', 'Purchases restored successfully.', undefined, 'success');
    } catch {
      alert('Error', 'Failed to restore purchases.', undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreWithCustomerId = async () => {
    if (!customerIdInput.trim()) return;

    try {
      setRestoringWithId(true);
      await restorePurchasesWithCustomerId(customerIdInput.trim());
      await loadSubscriptionData();
      setCustomerIdInput('');
      alert('Success', 'Purchases restored successfully.', undefined, 'success');
    } catch (error: any) {
      alert('Error', error?.message ?? 'Restore failed.', undefined, 'error');
    } finally {
      setRestoringWithId(false);
    }
  };

  const handleCustomerCenter = async () => {
    const presented = await presentCustomerCenter();
    if (!presented) {
      alert('No Active Subscription', 'You have no active subscription.', undefined, 'info');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#313131" />
          <Text className="mt-4 space-regular" style={{ color: '#313131' }}>
            Loading subscriptions…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const premiumPlan = SUBSCRIPTION_PLANS.find(p => p.tier === 'premium');
  const selectedPackage = getPackageForPeriod(selectedPeriod);
  const monthlyPackage = getPackageForPeriod('monthly');

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 80 }}>
        <View className="px-4 pt-10 pb-8">
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
              activeOpacity={0.7}
            >
              <ChevronLeft width={20} height={20} color="#313131" />
            </TouchableOpacity>
            <Text className="text-3xl space-bold flex-1" style={{ color: '#313131' }}>
              Subscription
            </Text>
          </View>

          {/* Period Selector */}
          <View className="flex-row mb-6 bg-white rounded-3xl p-1">
            {(['monthly', 'yearly'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                className={`flex-1 py-2 rounded-3xl ${
                  selectedPeriod === period ? 'bg-brand-green' : 'bg-transparent'
                }`}
                activeOpacity={0.7}
              >
                <Text className="text-center space-medium" style={{ color: '#313131' }}>
                  {period === 'monthly' ? 'Monthly' : 'Yearly (Save 25%)'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Premium Plan */}
          {premiumPlan && (
            <View className="mb-6">
              <View className="bg-white rounded-3xl p-4 border-2 border-brand-pink">
                <View className="flex-row items-center gap-2 mb-3">
                  <Star width={18} height={18} color="#313131" fill="#313131" />
                  <Text className="text-lg space-semibold" style={{ color: '#313131' }}>
                    {premiumPlan.name}
                  </Text>
                </View>

                <View className="flex-row items-baseline gap-2 mb-1">
                  <Text className="text-3xl space-bold" style={{ color: '#313131' }}>
                    {selectedPackage?.product.priceString ?? '—'}
                  </Text>
                  <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                    /{selectedPeriod === 'monthly' ? 'month' : 'year'}
                  </Text>
                </View>

                {selectedPeriod === 'yearly' && monthlyPackage && (
                  <Text className="text-xs space-regular mb-3" style={{ color: '#313131' }}>
                    {monthlyPackage.product.priceString}/month billed annually
                  </Text>
                )}

                {premiumPlan.features.map((feature, i) => (
                  <View key={i} className="flex-row gap-2 mb-2">
                    <Check width={16} height={16} color="#313131" />
                    <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                      {feature}
                    </Text>
                  </View>
                ))}

                <TouchableOpacity
                  className="mt-4 py-3 px-4 rounded-3xl bg-brand-green items-center"
                  onPress={() => handlePurchase(premiumPlan, selectedPeriod)}
                  activeOpacity={0.7}
                  disabled={currentTier === 'premium' || purchasing !== null}
                >
                  <Text className="space-semibold" style={{ color: '#313131' }}>
                    {currentTier === 'premium' ? 'Current Plan' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Restore / Manage */}
          <View className="mb-6">
            <View className="bg-white rounded-3xl p-4">
              <TouchableOpacity
                onPress={handleRestore}
                className="w-full py-3 px-4 rounded-3xl bg-brand-cream items-center"
                activeOpacity={0.7}
              >
                <Text className="space-medium" style={{ color: '#313131' }}>
                  Restore Purchases
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCustomerCenter}
                className="w-full mt-3 py-3 px-4 rounded-3xl bg-brand-cream items-center"
                activeOpacity={0.7}
              >
                <Text className="space-medium" style={{ color: '#313131' }}>
                  Manage Subscription
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Legal */}
          <Text className="text-xs text-center space-regular" style={{ color: '#313131' }}>
            Subscriptions renew automatically unless cancelled at least 24 hours before the end
            of the current period.
          </Text>
        </View>
      </ScrollView>

      {AlertComponent}
    </SafeAreaView>
  );
};

export default SubscriptionPage;
