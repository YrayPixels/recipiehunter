import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, CheckCircle, ChevronLeft, Lock, Plus, Target, Trash2, XCircle } from 'react-native-feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { Paywall } from '../src/components/Paywall';
import { canAccessFeature } from '../src/lib/features';
import { sendGoalCompletionNotification, sendGoalReminder } from '../src/lib/notifications';
import {
  calculateGoalProgress,
  checkGoalProgress,
  createGoal,
  deleteGoal,
  getGoals,
  getSettings,
  getTodayDate,
  Goal,
  saveGoal,
} from '../src/lib/storage';
// Removed habit tracking stores - not relevant to Recipe Hunter
// import { useDailyStatusStore } from '../src/lib/stores/dailyStatusStore';
// import { useGoalDayStore } from '../src/lib/stores/goalDayStore';
import { cn } from '../src/lib/utils';

const GoalCard = ({
  goal,
  onDelete,
  onUpdate,
}: {
  goal: Goal;
  onDelete: (id: string) => void;
  onUpdate: (goal: Goal) => void;
}) => {
  const [progress, setProgress] = useState<{
    currentDays: number;
    progress: number;
    daysRemaining: number;
    isCompleted: boolean;
  } | null>(null);
  const [showDayStatus, setShowDayStatus] = useState(false);
  const { getDailyStatus, setDailyStatus } = useDailyStatusStore();
  const { getGoalDays, addGoalDay, removeGoalDay, isGoalDay } = useGoalDayStore();
  const today = getTodayDate();
  const goalDays = getGoalDays(goal.id);
  const todayStatus = getDailyStatus(today);
  const todayIsGoalDay = isGoalDay(goal.id, today);

  useEffect(() => {
    const loadProgress = async () => {
      // Calculate progress based on goal days tracked
      const trackedDays = getGoalDays(goal.id);
      const currentDays = trackedDays.length;
      const progressPercent = Math.min((currentDays / goal.targetDays) * 100, 100);
      const daysRemaining = Math.max(0, goal.targetDays - currentDays);
      const isCompleted = currentDays >= goal.targetDays;
      
      const prog = {
        currentDays,
        progress: progressPercent,
        daysRemaining,
        isCompleted,
      };
      
      setProgress(prog);
      if (prog.isCompleted && !goal.completed) {
        const updatedGoal = { ...goal, completed: true, completedDate: new Date().toISOString().split('T')[0] };
        onUpdate(updatedGoal);
        // Send completion notification
        const settings = await getSettings();
        if (settings.notifications.goalReminders) {
          await sendGoalCompletionNotification(goal.title);
        }
      }
    };
    loadProgress();
  }, [goal, goalDays]);

  if (!progress) {
    return null;
  }

  return (
    <Card className={cn(goal.completed && 'bg-sage-light')}>
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <CardTitle className="flex-row items-center gap-2">
              <Target width={18} height={18} color="#5a7a5a" />
              <Text className="text-lg font-semibold text-foreground dark:text-gray-100">{goal.title}</Text>
            </CardTitle>
            {goal.completed && (
              <Text className="text-sm text-primary font-medium mt-1">✓ Completed!</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() => onDelete(goal.id)}
            className="p-2"
            activeOpacity={0.7}
          >
            <Trash2 width={18} height={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </CardHeader>
      <CardContent>
        <View className="mb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm text-muted-foreground dark:text-gray-400">Progress</Text>
            <Text className="text-sm font-semibold text-foreground dark:text-gray-100">
              {progress.currentDays} / {goal.targetDays} days
            </Text>
          </View>
          <View className="h-2 bg-secondary rounded-full overflow-hidden">
            <View
              className={cn(
                'h-full rounded-full',
                goal.completed ? 'bg-primary' : 'bg-sage'
              )}
              style={{ width: `${Math.min(progress.progress, 100)}%` }}
            />
          </View>
        </View>
        {!goal.completed && (
          <Text className="text-xs text-muted-foreground dark:text-gray-400">
            {progress.daysRemaining} days remaining
          </Text>
        )}
        {goal.completed && goal.completedDate && (
          <Text className="text-xs text-muted-foreground dark:text-gray-400">
            Completed on {new Date(goal.completedDate).toLocaleDateString()}
          </Text>
        )}
        
        {/* Today's Status Button */}
        {!goal.completed && (
          <TouchableOpacity
            onPress={() => setShowDayStatus(!showDayStatus)}
            className="mt-3 py-2 px-3 border border-border dark:border-gray-700 rounded-lg flex-row items-center justify-center gap-2"
            activeOpacity={0.7}
          >
            <Calendar width={16} height={16} color="#5a7a5a" />
            <Text className="text-sm font-medium text-foreground dark:text-gray-100">
              {showDayStatus ? 'Hide' : 'Mark'} Today&apos;s Status
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Day Status Selection */}
        {showDayStatus && !goal.completed && (
          <View className="mt-3 pt-3 border-t border-border dark:border-gray-700">
            <Text className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
              Did you stay clean today?
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  if (todayStatus === 'clean') {
                    // Already clean, toggle off
                    removeGoalDay(goal.id, today);
                    setDailyStatus(today, null);
                  } else {
                    // Mark as clean and add to goal
                    setDailyStatus(today, 'clean');
                    addGoalDay(goal.id, today);
                  }
                }}
                className={cn(
                  'flex-1 py-3 px-3 rounded-lg items-center justify-center border',
                  todayIsGoalDay && todayStatus === 'clean'
                    ? 'bg-sage border-sage'
                    : 'bg-transparent border-border dark:border-gray-700'
                )}
                activeOpacity={0.7}
              >
                <CheckCircle 
                  width={20} 
                  height={20} 
                  color={todayIsGoalDay && todayStatus === 'clean' ? '#5a7a5a' : '#9ca3af'} 
                />
                <Text className={cn(
                  'text-xs font-medium mt-1',
                  todayIsGoalDay && todayStatus === 'clean'
                    ? 'text-primary-foreground'
                    : 'text-foreground dark:text-gray-100'
                )}>
                  Clean
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  // If gave in, remove from goal days
                  setDailyStatus(today, 'gave_in');
                  removeGoalDay(goal.id, today);
                }}
                className={cn(
                  'flex-1 py-3 px-3 rounded-lg items-center justify-center border',
                  todayStatus === 'gave_in'
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-transparent border-border dark:border-gray-700'
                )}
                activeOpacity={0.7}
              >
                <XCircle 
                  width={20} 
                  height={20} 
                  color={todayStatus === 'gave_in' ? '#ef4444' : '#9ca3af'} 
                />
                <Text className={cn(
                  'text-xs font-medium mt-1',
                  todayStatus === 'gave_in'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-foreground dark:text-gray-100'
                )}>
                  Gave In
                </Text>
              </TouchableOpacity>
            </View>
            {todayIsGoalDay && (
              <Text className="text-xs text-sage mt-2 text-center">
                ✓ Today counts toward this goal
              </Text>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
};

const GoalsPage: React.FC = () => {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDays, setNewGoalDays] = useState('');
  const [hasGoalAccess, setHasGoalAccess] = useState<boolean | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadGoals();
    checkGoalsForNotifications();
    checkGoalAccess();
  }, []);

  const checkGoalAccess = async () => {
    const access = await canAccessFeature('goal_setting');
    setHasGoalAccess(access);
  };

  const checkGoalsForNotifications = async () => {
    const { completedGoals, goalsNeedingReminder } = await checkGoalProgress();
    const settings = await getSettings();

    // Send completion notifications
    if (completedGoals.length > 0 && settings.notifications.goalReminders) {
      for (const goal of completedGoals) {
        await sendGoalCompletionNotification(goal.title);
      }
    }

    // Send reminder notifications
    if (goalsNeedingReminder.length > 0 && settings.notifications.goalReminders) {
      for (const goal of goalsNeedingReminder) {
        const progress = await calculateGoalProgress(goal);
        if (progress.daysRemaining > 0) {
          await sendGoalReminder(goal.title, progress.daysRemaining);
        }
      }
    }
  };

  const loadGoals = async () => {
    const loadedGoals = await getGoals();
    setGoals(loadedGoals);
    setLoading(false);
  };

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim() || !newGoalDays.trim()) {
      return;
    }

    // Check access before creating goal
    const access = await canAccessFeature('goal_setting');
    if (!access) {
      setShowPaywall(true);
      return;
    }

    const targetDays = parseInt(newGoalDays, 10);
    if (isNaN(targetDays) || targetDays <= 0) {
      return;
    }

    const goal = createGoal(newGoalTitle.trim(), targetDays);
    await saveGoal(goal);
    setNewGoalTitle('');
    setNewGoalDays('');
    setShowAddForm(false);
    await loadGoals();
  };

  const handleShowAddForm = () => {
    if (hasGoalAccess === false) {
      setShowPaywall(true);
      return;
    }
    setShowAddForm(true);
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    await loadGoals();
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    await saveGoal(updatedGoal);
    await loadGoals();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground dark:text-gray-400">Loading goals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View className="bg-background dark:bg-gray-900 border-b border-border/50 dark:border-gray-700/50">
          <View className="container max-w-lg mx-auto px-4 py-4">
            <View className="flex-row items-center gap-3 mb-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-9 h-9 border border-border dark:border-gray-700 rounded-lg items-center justify-center bg-card dark:bg-gray-800"
                activeOpacity={0.7}
              >
                <ChevronLeft width={18} height={18} color="#5a7a5a" />
              </TouchableOpacity>
              <View className="flex-row items-center gap-2 flex-1">
                <Target width={24} height={24} color="#5a7a5a" />
                <Text className="text-2xl font-bold text-foreground dark:text-gray-100">Goals</Text>
              </View>
              <TouchableOpacity
                onPress={handleShowAddForm}
                className="w-9 h-9 border border-border dark:border-gray-700 rounded-lg items-center justify-center bg-card dark:bg-gray-800"
                activeOpacity={0.7}
              >
                <Plus width={18} height={18} color="#5a7a5a" />
              </TouchableOpacity>
            </View>

            {showAddForm && (
              <Card className="mb-4">
                <CardContent className="pt-4">
                  {hasGoalAccess === false && (
                    <Card className="mb-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                      <CardContent className="pt-4">
                        <View className="flex-row items-start gap-3">
                          <Lock width={20} height={20} color="#ef4444" className="mt-0.5" />
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                              Goal Setting is a Premium Feature
                            </Text>
                            <Text className="text-xs text-red-600 dark:text-red-400 mb-3">
                              Upgrade to Premium to set and track goals for your recovery journey.
                            </Text>
                            <Button
                              onPress={() => {
                                setShowAddForm(false);
                                setShowPaywall(true);
                              }}
                              className="w-full"
                            >
                              Upgrade to Premium
                            </Button>
                          </View>
                        </View>
                      </CardContent>
                    </Card>
                  )}
                  <View className="gap-3">
                    <View>
                      <Text className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                        Goal Title
                      </Text>
                      <Input
                        value={newGoalTitle}
                        onChangeText={setNewGoalTitle}
                        placeholder="e.g., 30 days clean"
                        className="rounded-lg"
                        editable={hasGoalAccess !== false}
                      />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-foreground dark:text-gray-100 mb-2">
                        Target Days
                      </Text>
                      <Input
                        value={newGoalDays}
                        onChangeText={setNewGoalDays}
                        placeholder="e.g., 30"
                        className="rounded-lg"
                        editable={hasGoalAccess !== false}
                      />
                    </View>
                    <View className="flex-row gap-2">
                      <Button
                        onPress={handleAddGoal}
                        className="flex-1"
                        disabled={!newGoalTitle.trim() || !newGoalDays.trim() || hasGoalAccess === false}
                      >
                        Add Goal
                      </Button>
                      <Button
                        onPress={() => {
                          setShowAddForm(false);
                          setNewGoalTitle('');
                          setNewGoalDays('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </View>
                  </View>
                </CardContent>
              </Card>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          bounces={true}
        >
          <View className="container max-w-lg mx-auto px-4 pb-12 pt-4">
            {goals.length === 0 ? (
              <Card>
                <CardContent className="pt-4">
                  <View className="items-center py-8">
                    <Target width={48} height={48} color="#5a7a5a" className="opacity-50 mb-4" />
                    <Text className="text-lg font-semibold text-foreground dark:text-gray-100 mb-2">
                      No goals yet
                    </Text>
                    <Text className="text-sm text-muted-foreground dark:text-gray-400 text-center mb-4">
                      Set a recovery goal to track your progress and stay motivated.
                    </Text>
                    {hasGoalAccess === false ? (
                      <View className="w-full gap-2">
                        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
                          <CardContent className="pt-4">
                            <View className="flex-row items-start gap-3">
                              <Lock width={20} height={20} color="#ef4444" className="mt-0.5" />
                              <View className="flex-1">
                                <Text className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                                  Goal Setting is a Premium Feature
                                </Text>
                                <Text className="text-xs text-red-600 dark:text-red-400">
                                  Upgrade to Premium to set and track goals.
                                </Text>
                              </View>
                            </View>
                          </CardContent>
                        </Card>
                        <Button onPress={() => setShowPaywall(true)}>
                          Upgrade to Premium
                        </Button>
                      </View>
                    ) : (
                        <Button onPress={() => setShowAddForm(true)}>
                          Create Your First Goal
                        </Button>
                    )}
                  </View>
                </CardContent>
              </Card>
            ) : (
              <View className="gap-4">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onDelete={handleDeleteGoal}
                    onUpdate={handleUpdateGoal}
                  />
                ))}
              </View>
            )}
          </View>

        </ScrollView>
        <Paywall
          visible={showPaywall}
          onClose={() => {
            setShowPaywall(false);
            checkGoalAccess();
          }}
          feature="goal_setting"
          featureName="Goal Setting"
        />
      </View>
    </SafeAreaView>
  );
};

export default GoalsPage;

