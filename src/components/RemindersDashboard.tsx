import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Bell, ChevronRight } from 'react-native-feather';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { getSettings } from '../lib/storage';

export const RemindersDashboard: React.FC = () => {
  const router = useRouter();
  const [reminderCount, setReminderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminderCount();
  }, []);

  const loadReminderCount = async () => {
    try {
      const settings = await getSettings();
      const customCount = settings.notifications.customNotifications?.length || 0;
      const defaultCount = [
        settings.notifications.morningReminder,
        settings.notifications.middayReminder,
        settings.notifications.eveningReminder,
        settings.notifications.motivationalQuotes,
        settings.notifications.milestoneNotifications,
        settings.notifications.goalReminders,
      ].filter(Boolean).length;
      setReminderCount(defaultCount + customCount);
      setLoading(false);
    } catch (error) {
      console.error('Error loading reminder count:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <CardTitle className="flex-row items-center gap-2">
            <Bell width={18} height={18} color="#5a7a5a" />
            <Text className="text-card-foreground dark:text-gray-100">Reminders</Text>
          </CardTitle>
          <TouchableOpacity
            onPress={() => router.push('/reminders')}
            className="flex-row items-center gap-1"
            activeOpacity={0.7}
          >
            <Text className="text-sm text-primary">Manage</Text>
            <ChevronRight width={16} height={16} color="#5a7a5a" />
          </TouchableOpacity>
        </View>
      </CardHeader>
      <CardContent className="pt-4">
        <View className="gap-2">
          <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
            {reminderCount} active reminder{reminderCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/reminders')}
            className="mt-2"
            activeOpacity={0.7}
          >
            <Text className="text-sm text-primary font-medium">
              Tap to manage your reminders and notifications
            </Text>
          </TouchableOpacity>
        </View>
      </CardContent>
    </Card>
  );
};

