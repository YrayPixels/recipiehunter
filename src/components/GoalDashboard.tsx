import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Target, ChevronRight } from 'react-native-feather';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { calculateGoalProgress, getGoals, Goal } from '../lib/storage';
import { cn } from '../lib/utils';

export const GoalDashboard: React.FC = () => {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const loadedGoals = await getGoals();
    const activeGoals = loadedGoals.filter(g => !g.completed).slice(0, 3); // Show max 3 active goals
    setGoals(activeGoals);
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  if (goals.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <View className="flex-row items-center justify-between">
            <CardTitle className="flex-row items-center gap-2">
              <Target width={18} height={18} color="#5a7a5a" />
              <Text>Goals</Text>
            </CardTitle>
            <TouchableOpacity
              onPress={() => router.push('/goals')}
              className="flex-row items-center gap-1"
              activeOpacity={0.7}
            >
              <Text className="text-sm text-primary">View All</Text>
              <ChevronRight width={16} height={16} color="#5a7a5a" />
            </TouchableOpacity>
          </View>
        </CardHeader>
        <CardContent className="pt-4">
          <View className="items-center py-4">
            <Text className="text-sm text-muted-foreground dark:text-gray-400 text-center mb-3">
              No active goals. Set a goal to track your progress!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/goals')}
              className="bg-primary px-4 py-2 rounded-lg"
              activeOpacity={0.7}
            >
              <Text className="text-primary-foreground font-medium">Create Goal</Text>
            </TouchableOpacity>
          </View>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <CardTitle className="flex-row items-center gap-2">
            <Target width={18} height={18} color="#5a7a5a" />
            <Text>Goals</Text>
          </CardTitle>
          <TouchableOpacity
            onPress={() => router.push('/goals')}
            className="flex-row items-center gap-1"
            activeOpacity={0.7}
          >
            <Text className="text-sm text-primary">View All</Text>
            <ChevronRight width={16} height={16} color="#5a7a5a" />
          </TouchableOpacity>
        </View>
      </CardHeader>
      <CardContent className="pt-4">
        <View className="gap-3">
          {goals.map((goal) => (
            <GoalProgressItem key={goal.id} goal={goal} />
          ))}
        </View>
      </CardContent>
    </Card>
  );
};

const GoalProgressItem: React.FC<{ goal: Goal }> = ({ goal }) => {
  const [progress, setProgress] = useState<{
    currentDays: number;
    progress: number;
    daysRemaining: number;
    isCompleted: boolean;
  } | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      const prog = await calculateGoalProgress(goal);
      setProgress(prog);
    };
    loadProgress();
  }, [goal]);

  if (!progress) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => {
        // Navigate to goals screen
      }}
      activeOpacity={0.7}
    >
      <View>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-medium text-foreground dark:text-gray-100 flex-1" numberOfLines={1}>
            {goal.title}
          </Text>
          <Text className="text-xs text-muted-foreground dark:text-gray-400 ml-2">
            {progress.currentDays} / {goal.targetDays} days
          </Text>
        </View>
        <View className="h-2 bg-secondary dark:bg-gray-700 rounded-full overflow-hidden">
          <View
            className={cn('h-full rounded-full', goal.completed ? 'bg-primary' : 'bg-sage')}
            style={{ width: `${Math.min(progress.progress, 100)}%` }}
          />
        </View>
        {!goal.completed && progress.daysRemaining > 0 && (
          <Text className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
            {progress.daysRemaining} days remaining
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

