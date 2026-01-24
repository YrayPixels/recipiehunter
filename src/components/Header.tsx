import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AlertTriangle, BarChart, Settings, Target, Zap } from 'react-native-feather';
import { calculateStreak } from '../lib/storage';

interface HeaderProps {
  onEmergency: () => void;
  completionCount?: number;
  totalItems?: number;
}

export const Header: React.FC<HeaderProps> = ({ onEmergency, completionCount = 0, totalItems = 7 }) => {
  const router = useRouter();
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d');
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const loadStreak = async () => {
      const streakData = await calculateStreak();
      setCurrentStreak(streakData.currentStreak);
    };
    loadStreak();
  }, []);

  return (
    <View className="py-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground dark:text-gray-100">Break Free</Text>
          <Text className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">{formattedDate}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push('/stats')}
            className="px-3 py-2 rounded-lg bg-card dark:bg-gray-800 border border-border dark:border-gray-700"
            activeOpacity={0.7}
          >
            <BarChart width={16} height={16} color="#5a7a5a" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/goals')}
            className="px-3 py-2 rounded-lg bg-card dark:bg-gray-800 border border-border dark:border-gray-700"
            activeOpacity={0.7}
          >
            <Target width={16} height={16} color="#5a7a5a" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="px-3 py-2 rounded-lg bg-card dark:bg-gray-800 border border-border dark:border-gray-700"
            activeOpacity={0.7}
          >
            <Settings width={16} height={16} color="#5a7a5a" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onEmergency}
            className="px-3 py-2 rounded-lg bg-accent"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-2">
              <AlertTriangle width={16} height={16} color="#d97706" />
              <Text className="text-accent-foreground text-sm font-medium">Urge Help</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Streak Display */}
      <View className="flex-row items-center gap-2 mb-3">
        <TouchableOpacity
          onPress={() => router.push('/stats')}
          activeOpacity={0.7}
          className="flex-row items-center gap-2 px-3 py-2 rounded-lg bg-sage-light dark:bg-gray-800"
        >
          <Zap width={18} height={18} color="#d97706" />
          <Text className="text-sm font-semibold text-foreground dark:text-gray-100">
            {currentStreak} day{currentStreak !== 1 ? 's' : ''} streak
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Progress indicator */}
      <View className="flex-row items-center gap-3 pb-2">
        <View className="flex-1 h-2 bg-secondary dark:bg-gray-700 rounded-full overflow-hidden">
          <View 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(completionCount / totalItems) * 100}%` }}
          />
        </View>
        <Text className="text-sm text-muted-foreground dark:text-gray-400 font-semibold min-w-[32px] text-right">
          {completionCount}/{totalItems}
        </Text>
      </View>
    </View>
  );
};

