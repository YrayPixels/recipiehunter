import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import {
  ChevronLeft,
  Trash2,
} from 'react-native-feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../src/components/Text';
import { guidesAPI } from '../src/lib/api';
import { getSettings, saveSettings, UserSettings } from '../src/lib/storage';
import { getUserId } from '../src/lib/userid';
import { Theme, useTheme } from '../src/lib/theme';

const CUISINES = [
  { value: 'nigerian', label: 'Nigerian 🇳🇬' },
  { value: 'american', label: 'American 🇺🇸' },
  { value: 'mexican', label: 'Mexican 🇲🇽' },
  { value: 'british', label: 'British 🇬🇧' },
  { value: 'indian-spice', label: 'Indian 🇮🇳' },
  { value: 'japanese-izakaya', label: 'Japanese 🇯🇵' },
  { value: 'chinese-wok', label: 'Chinese 🇨🇳' },
  { value: 'italian-trattoria', label: 'Italian 🇮🇹' },
  { value: 'french-bistro', label: 'French 🇫🇷' },
  { value: 'thai-street', label: 'Thai 🇹🇭' },
  { value: 'korean-comfort', label: 'Korean 🇰🇷' },
  { value: 'ethiopian', label: 'Ethiopian 🇪🇹' },
  { value: 'moroccan-souk', label: 'Moroccan 🇲🇦' },
  { value: 'caribbean-spice', label: 'Caribbean 🏝️' },
  { value: 'middle-eastern', label: 'Middle Eastern 🧆' },
  { value: 'any', label: 'No Preference 🌍' },
];

const TIME_PREFS = [
  { value: 'quick', label: 'Quick (<30 min)' },
  { value: 'flexible', label: 'Flexible (30-60 min)' },
  { value: 'extended', label: 'Extended (60+ min)' },
];

const SPICE_LEVELS = [
  { value: 'mild', label: 'Mild 😌' },
  { value: 'medium', label: 'Medium 🌶️' },
  { value: 'fiery', label: 'Fiery 🔥' },
];

const GOALS = [
  { value: 'meal_planning', label: 'Meal Planning & Organization', emoji: '📅' },
  { value: 'weight_loss', label: 'Weight Loss Journey', emoji: '🎯' },
  { value: 'bulking', label: 'Muscle Gain & Bulking', emoji: '💪' },
  { value: 'learning', label: 'Learning New Cuisines', emoji: '📚' },
  { value: 'time_saving', label: 'Saving Time on Cooking', emoji: '⚡' },
  { value: 'meal_prep', label: 'Meal Prep for the Week', emoji: '🥡' },
];

interface FoodPreferences {
  primaryCuisine: string;
  timePreference: string;
  spicePreference: string;
  userGoals: string[];
}

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ guides: 0, lists: 0, reminders: 0 });
  const [preferences, setPreferences] = useState<FoodPreferences>({
    primaryCuisine: '',
    timePreference: 'flexible',
    spicePreference: 'medium',
    userGoals: [],
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const id = await getUserId();
      setUserId(id);

      const loadedSettings = await getSettings();
      setSettings(loadedSettings);

      // Load stats (using safe version that never throws or logs errors)
      if (id) {
        const statsData = await guidesAPI.getStatsSafe(id);
        setStats({
          guides: statsData?.total || 0,
          lists: 0, // TODO: Add shopping lists API
          reminders: 0, // TODO: Add reminders API
        });
      }

      // Load preferences from settings (stored locally for now)
      if (loadedSettings) {
        setPreferences({
          primaryCuisine: (loadedSettings as any).primaryCuisine || '',
          timePreference: (loadedSettings as any).timePreference || 'flexible',
          spicePreference: (loadedSettings as any).spicePreference || 'medium',
          userGoals: (loadedSettings as any).userGoals || [],
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!settings) return;

    const updated = {
      ...settings,
      primaryCuisine: preferences.primaryCuisine,
      timePreference: preferences.timePreference,
      spicePreference: preferences.spicePreference,
      userGoals: preferences.userGoals,
    } as any;

    await saveSettings(updated);
    setSettings(updated);
    Alert.alert('Success', 'Preferences saved!');
  };

  const toggleGoal = (goalValue: string) => {
    const currentGoals = preferences.userGoals || [];
    const newGoals = currentGoals.includes(goalValue)
      ? currentGoals.filter(g => g !== goalValue)
      : [...currentGoals, goalValue];
    
    setPreferences({ ...preferences, userGoals: newGoals });
  };

  if (loading || !settings) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#F6FBDE' }} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#313131" />
          <Text className="mt-4 space-regular" style={{ color: '#313131' }}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-pink" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-10 pb-4">
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
              activeOpacity={0.7}
            >
              <ChevronLeft width={20} height={20} color="#313131" />
            </TouchableOpacity>
            <Text className="text-3xl space-bold flex-1" style={{ color: '#313131' }}>
              Settings
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
          <View className="px-4 pb-8">
            {/* Subscription */}
            <View className="mb-6">
              <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
                Subscription
              </Text>
              <View className="bg-white rounded-3xl p-4">
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm space-medium mb-1" style={{ color: '#313131' }}>
                        Current Plan
                      </Text>
                      <Text className="text-xs space-regular capitalize" style={{ color: '#313131' }}>
                        {settings.subscriptionTier || 'Free'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push('/subscription')}
                      className="px-4 py-2 rounded-3xl bg-brand-green"
                      activeOpacity={0.7}
                    >
                      <Text className="text-sm space-semibold" style={{ color: '#313131' }}>
                        {settings.subscriptionTier === 'free' ? 'Upgrade' : 'Manage'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {settings.subscriptionTier !== 'free' && settings.subscriptionEndDate && (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                        Renews on
                      </Text>
                      <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                        {new Date(settings.subscriptionEndDate).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Food Preferences */}
            <View className="mb-6">
              <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
                Food Preferences
              </Text>
              <View className="bg-white rounded-3xl p-4">
                <View className="gap-4">
                  {/* Primary Cuisine */}
                  <View>
                    <Text className="text-sm space-medium mb-2" style={{ color: '#313131' }}>
                      Primary Cuisine
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                      {CUISINES.map((cuisine) => (
                        <TouchableOpacity
                          key={cuisine.value}
                          onPress={() => setPreferences({ ...preferences, primaryCuisine: cuisine.value })}
                          className={`px-4 py-2 rounded-3xl border ${
                            preferences.primaryCuisine === cuisine.value
                              ? 'bg-brand-green border-brand-green'
                              : 'bg-brand-cream border-brand-green'
                          }`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-sm space-regular ${
                              preferences.primaryCuisine === cuisine.value
                                ? 'text-[#313131]'
                                : 'text-[#313131]'
                            }`}
                          >
                            {cuisine.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Time Preference */}
                  <View>
                    <Text className="text-sm space-medium mb-2" style={{ color: '#313131' }}>
                      Cooking Time Preference
                    </Text>
                    <View className="flex-row gap-2">
                      {TIME_PREFS.map((pref) => (
                        <TouchableOpacity
                          key={pref.value}
                          onPress={() => setPreferences({ ...preferences, timePreference: pref.value })}
                          className={`flex-1 px-4 py-2 rounded-3xl border ${
                            preferences.timePreference === pref.value
                              ? 'bg-brand-green border-brand-green'
                              : 'bg-brand-cream border-brand-green'
                          }`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-sm text-center space-regular ${
                              preferences.timePreference === pref.value
                                ? 'text-[#313131]'
                                : 'text-[#313131]'
                            }`}
                          >
                            {pref.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Spice Level */}
                  <View>
                    <Text className="text-sm space-medium mb-2" style={{ color: '#313131' }}>
                      Spice Preference
                    </Text>
                    <View className="flex-row gap-2">
                      {SPICE_LEVELS.map((level) => (
                        <TouchableOpacity
                          key={level.value}
                          onPress={() => setPreferences({ ...preferences, spicePreference: level.value })}
                          className={`flex-1 px-4 py-2 rounded-3xl border ${
                            preferences.spicePreference === level.value
                              ? 'bg-brand-green border-brand-green'
                              : 'bg-brand-cream border-brand-green'
                          }`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-sm text-center space-regular ${
                              preferences.spicePreference === level.value
                                ? 'text-[#313131]'
                                : 'text-[#313131]'
                            }`}
                          >
                            {level.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Goals */}
                  <View>
                    <Text className="text-sm space-medium mb-2" style={{ color: '#313131' }}>
                      Your Goals
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {GOALS.map((goal) => {
                        const isSelected = preferences.userGoals.includes(goal.value);
                        return (
                          <TouchableOpacity
                            key={goal.value}
                            onPress={() => toggleGoal(goal.value)}
                            className={`px-3 py-2 rounded-3xl border ${
                              isSelected
                                ? 'bg-brand-green border-brand-green'
                                : 'bg-brand-cream border-brand-green'
                            }`}
                            activeOpacity={0.7}
                          >
                            <Text
                              className={`text-sm space-regular ${
                                isSelected
                                  ? 'text-[#313131]'
                                  : 'text-[#313131]'
                              }`}
                            >
                              {goal.emoji} {goal.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={savePreferences}
                    className="w-full mt-2 py-3 px-4 rounded-3xl bg-brand-green items-center"
                    activeOpacity={0.7}
                  >
                    <Text className="space-semibold" style={{ color: '#313131' }}>
                      Save Preferences
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Appearance */}
            <View className="mb-6">
              <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
                Appearance
              </Text>
              <View className="bg-white rounded-3xl p-4">
                <View className="gap-3">
                  <Text className="text-sm space-regular mb-2" style={{ color: '#313131' }}>
                    Choose your preferred theme
                  </Text>
                  <View className="flex-row gap-2">
                    {(['light', 'dark', 'auto'] as Theme[]).map((themeOption) => (
                      <TouchableOpacity
                        key={themeOption}
                        onPress={() => setTheme(themeOption)}
                        className={`flex-1 px-4 py-3 rounded-3xl border ${
                          theme === themeOption
                            ? 'bg-brand-green border-brand-green'
                            : 'bg-brand-cream border-brand-green'
                        }`}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`text-sm text-center space-medium capitalize ${
                            theme === themeOption
                              ? 'text-[#313131]'
                              : 'text-[#313131]'
                          }`}
                        >
                          {themeOption}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Account */}
            <View className="mb-6">
              <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
                Account
              </Text>
              <View className="bg-white rounded-3xl p-4">
                <View className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm space-regular" style={{ color: '#313131' }}>User ID</Text>
                    <Text className="text-sm space-regular font-mono" numberOfLines={1} style={{ color: '#313131' }}>
                      {userId?.substring(0, 20)}...
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* App Info */}
            <View className="mb-6">
              <View className="bg-white rounded-3xl p-4">
                <View className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm space-regular" style={{ color: '#313131' }}>Version</Text>
                    <Text className="text-sm space-regular" style={{ color: '#313131' }}>
                      {Constants.expoConfig?.version ?? '1.0.0'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm space-regular" style={{ color: '#313131' }}>App Name</Text>
                    <Text className="text-sm space-regular" style={{ color: '#313131' }}>Garde</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Danger Zone */}
            <View className="mb-6">
              <Text className="text-xl space-semibold mb-4" style={{ color: '#313131' }}>
                Danger Zone
              </Text>
              <View className="bg-white rounded-3xl p-4 border-2 border-brand-pink">
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Delete Account',
                      'This will permanently delete your account and all data. This cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            Alert.alert('Info', 'Account deletion is not yet implemented. Please contact support.');
                          },
                        },
                      ]
                    );
                  }}
                  className="w-full py-3 px-4 rounded-3xl bg-brand-pink items-center"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-2">
                    <Trash2 width={16} height={16} color="#313131" />
                    <Text className="space-semibold" style={{ color: '#313131' }}>
                      Delete Account
                    </Text>
                  </View>
                </TouchableOpacity>
                <Text className="text-xs space-regular mt-2" style={{ color: '#313131' }}>
                  Permanently delete your account and all data. This cannot be undone.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
