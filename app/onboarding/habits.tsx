import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Check, Lock } from 'react-native-feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Card, CardContent } from '../../src/components/Card';
import { Paywall } from '../../src/components/Paywall';
import { canAccessFeature } from '../../src/lib/features';
import { HABIT_OPTIONS, HabitId, UserSettings, getSettings, saveSettings } from '../../src/lib/storage';
import { cn } from '../../src/lib/utils';

const HabitSelectionPage: React.FC = () => {
  const router = useRouter();
  const [selectedHabits, setSelectedHabits] = useState<HabitId[]>([]);
  const [primaryHabit, setPrimaryHabit] = useState<HabitId | null>(null);
  const [canSelectMultiple, setCanSelectMultiple] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingSettings();
  }, []);

  const loadExistingSettings = async () => {
    try {
      // Load existing settings to show current selections
      const settings = await getSettings();
      if (settings.selectedHabits && settings.selectedHabits.length > 0) {
        setSelectedHabits(settings.selectedHabits as HabitId[]);
        if (settings.primaryHabit) {
          setPrimaryHabit(settings.primaryHabit as HabitId);
        }
      }
      
      // Check multiple habits access
      const hasAccess = await canAccessFeature('multiple_habits');
      setCanSelectMultiple(hasAccess);
    } catch (error) {
      console.error('Error loading settings:', error);
      setCanSelectMultiple(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: HabitId) => {
    if (selectedHabits.includes(habitId)) {
      const updated = selectedHabits.filter(id => id !== habitId);
      setSelectedHabits(updated);
      if (primaryHabit === habitId) {
        setPrimaryHabit(updated.length > 0 ? updated[0] : null);
      }
    } else {
      // Check if user is trying to select a second habit without premium
      if (selectedHabits.length >= 1 && !canSelectMultiple) {
        setShowPaywall(true);
        return;
      }
      
      const updated = [...selectedHabits, habitId];
      setSelectedHabits(updated);
      if (!primaryHabit) {
        setPrimaryHabit(habitId);
      }
    }
  };

  const setAsPrimary = (habitId: HabitId) => {
    if (selectedHabits.includes(habitId)) {
      setPrimaryHabit(habitId);
    }
  };

  const handleContinue = async () => {
    if (selectedHabits.length === 0) {
      // Can't continue without at least one habit
      return;
    }

    const settings = await getSettings();
    const updatedSettings: UserSettings = {
      ...settings,
      selectedHabits: selectedHabits,
      primaryHabit: primaryHabit || selectedHabits[0],
    };
    
    await saveSettings(updatedSettings);
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View className="container max-w-lg mx-auto px-4 py-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground dark:text-gray-100 mb-2">
              What would you like to break free from?
            </Text>
            <Text className="text-base text-muted-foreground dark:text-gray-400">
              {canSelectMultiple 
                ? 'Select one or more habits you want to overcome. You can change this later in settings.'
                : 'Select a habit you want to overcome. Upgrade to Premium to track multiple habits.'}
            </Text>
          </View>

          {!canSelectMultiple && selectedHabits.length >= 1 && (
            <Card className="mb-4 border-2 border-primary bg-sage-light dark:bg-gray-800">
              <CardContent className="pt-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Lock width={18} height={18} color="#5a7a5a" />
                  <Text className="text-sm font-semibold text-foreground dark:text-gray-100">
                    Premium Feature
                  </Text>
                </View>
                <Text className="text-xs text-muted-foreground dark:text-gray-400 mb-3">
                  Free users can track 1 habit. Upgrade to Premium to track multiple habits simultaneously.
                </Text>
                <Button
                  onPress={() => setShowPaywall(true)}
                  size="sm"
                  className="w-full"
                >
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          )}

          <View className="gap-3 mb-6">
            {HABIT_OPTIONS.map((habit) => {
              const isSelected = selectedHabits.includes(habit.id);
              const isPrimary = primaryHabit === habit.id;
              
              return (
                <TouchableOpacity
                  key={habit.id}
                  onPress={() => toggleHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <Card className={cn(
                    'border-2',
                    isSelected
                      ? 'border-primary bg-sage-light dark:bg-gray-800'
                      : 'border-border dark:border-gray-700'
                  )}>
                    <CardContent className="pt-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          <Text className="text-2xl">{habit.icon}</Text>
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-foreground dark:text-gray-100">
                              {habit.label}
                            </Text>
                            {isPrimary && (
                              <Text className="text-xs text-primary dark:text-primary mt-1 font-medium">
                                Primary habit
                              </Text>
                            )}
                          </View>
                        </View>
                        {isSelected && (
                          <View className="w-6 h-6 rounded-full bg-primary dark:bg-primary items-center justify-center">
                            <Check width={16} height={16} color="#f5f3f0" />
                          </View>
                        )}
                      </View>
                      {isSelected && !isPrimary && selectedHabits.length > 1 && (
                        <TouchableOpacity
                          onPress={() => setAsPrimary(habit.id)}
                          className="mt-3"
                        >
                          <Text className="text-sm text-primary dark:text-primary font-medium">
                            Set as primary
                          </Text>
                        </TouchableOpacity>
                      )}
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedHabits.length > 0 && (
            <View className="mb-6">
              <Text className="text-sm text-muted-foreground dark:text-gray-400 mb-2">
                Primary habit: {HABIT_OPTIONS.find(h => h.id === primaryHabit)?.label || 'Not set'}
              </Text>
              <Text className="text-xs text-muted-foreground dark:text-gray-400">
                Your primary habit will be used for streak tracking and personalized content.
              </Text>
            </View>
          )}

          <Button
            onPress={handleContinue}
            disabled={selectedHabits.length === 0}
            className={cn(
              'w-full',
              selectedHabits.length === 0 && 'opacity-50'
            )}
          >
            Continue
          </Button>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            className="mt-4"
          >
            <Text className="text-center text-sm text-muted-foreground dark:text-gray-400">
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>

        </ScrollView>
        <Paywall
          visible={showPaywall}
          onClose={() => {
            setShowPaywall(false);
            checkMultipleHabitsAccess();
          }}
          feature="multiple_habits"
          featureName="Multiple Habits Tracking"
        />
      </View>

    </SafeAreaView>
  );
};

export default HabitSelectionPage;

