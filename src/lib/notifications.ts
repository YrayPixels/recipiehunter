// Notification service for reminders

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface CustomNotification {
  id: string;
  title: string;
  body: string;
  time: string; // HH:mm format
  enabled: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  morningReminder: boolean;
  morningTime: string; // HH:mm format
  middayReminder: boolean;
  middayTime: string;
  eveningReminder: boolean;
  eveningTime: string;
  milestoneNotifications: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  customNotifications?: CustomNotification[]; // Array of custom notifications
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  morningReminder: false,
  morningTime: '08:00',
  middayReminder: false,
  middayTime: '13:00',
  eveningReminder: false,
  eveningTime: '20:00',
  milestoneNotifications: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  customNotifications: [],
};

// Request permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted:', finalStatus);
      return false;
    }

    // For Android, ensure notification channel exists
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Break Free Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#5a7a5a',
          sound: 'default',
        });
      } catch (error) {
        // Channel might already exist, that's okay
        console.log('Notification channel setup:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("Error canceling notifications:", error);
  }
};

// Cancel a specific custom notification
export const cancelCustomNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      `custom-${notificationId}`
    );
    console.log(`Custom notification ${notificationId} canceled`);
  } catch (error) {
    console.warn(
      `Error canceling custom notification ${notificationId}:`,
      error
    );
  }
};

// Schedule a daily notification
export const scheduleDailyNotification = async (
  identifier: string,
  title: string,
  body: string,
  time: string, // HH:mm format
  quietHoursStart?: string,
  quietHoursEnd?: string
): Promise<void> => {
  try {
    // Cancel existing notification with this identifier
    await Notifications.cancelScheduledNotificationAsync(identifier);

    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    // Check quiet hours
    if (quietHoursStart && quietHoursEnd) {
      const [startHours, startMinutes] = quietHoursStart.split(":").map(Number);
      const [endHours, endMinutes] = quietHoursEnd.split(":").map(Number);

      const quietStart = new Date(scheduledTime);
      quietStart.setHours(startHours, startMinutes);

      const quietEnd = new Date(scheduledTime);
      quietEnd.setHours(endHours, endMinutes);

      // If notification time is in quiet hours, schedule for after quiet hours end
      if (scheduledTime >= quietStart || scheduledTime <= quietEnd) {
        scheduledTime.setHours(endHours, endMinutes);
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: scheduledTime.getHours(),
        minute: scheduledTime.getMinutes(),
        repeats: true,
      },
    });
  } catch (error) {
    console.error(`Error scheduling notification ${identifier}:`, error);
  }
};

// Schedule all reminders based on settings
export const scheduleAllReminders = async (
  settings: NotificationSettings
): Promise<void> => {
  // Cancel all existing notifications
  await cancelAllNotifications();

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return;
  }

  // Morning reminder
  if (settings.morningReminder) {
    await scheduleDailyNotification(
      "morning-reminder",
      "Good Morning! 🌅",
      "Time to start your morning routine and set your intention for the day.",
      settings.morningTime,
      settings.quietHoursStart,
      settings.quietHoursEnd
    );
  }

  // Midday reminder
  if (settings.middayReminder) {
    await scheduleDailyNotification(
      "midday-reminder",
      "Midday Check-in ☕",
      "How are you feeling? Take a moment to check in with yourself.",
      settings.middayTime,
      settings.quietHoursStart,
      settings.quietHoursEnd
    );
  }

  // Evening reminder
  if (settings.eveningReminder) {
    await scheduleDailyNotification(
      "evening-reminder",
      "Evening Reflection 🌙",
      "Time to complete your evening shutdown and journal entry.",
      settings.eveningTime,
      settings.quietHoursStart,
      settings.quietHoursEnd
    );
  }

  // Custom notifications
  const customNotifications = settings.customNotifications || [];
  for (const customNotif of customNotifications) {
    if (customNotif.enabled) {
      await scheduleDailyNotification(
        `custom-${customNotif.id}`,
        customNotif.title,
        customNotif.body,
        customNotif.time,
        settings.quietHoursStart,
        settings.quietHoursEnd
      );
    }
  }
};

// Send milestone notification (one-time)
export const sendMilestoneNotification = async (
  milestone: number
): Promise<void> => {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ${milestone} Day Milestone!`,
        body: `Congratulations! You've reached ${milestone} days. Keep up the amazing work!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.warn('Error sending milestone notification:', error);
  }
};


