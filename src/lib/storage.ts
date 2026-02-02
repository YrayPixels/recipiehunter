// AsyncStorage utilities for Freedom Planner (React Native)

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyEntry {
  id: string;
  date: string;
  madeBed: boolean;
  focusTask: string;
  focusTaskCompleted: boolean;
  energyLevel: 'low' | 'medium' | 'high' | null;
  didWell: string;
  movementType: ('walk' | 'workout' | 'stretch')[];
  phoneAway: boolean;
  preparedTomorrow: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  todaySentence: string;
  urgeExperienced: boolean;
  urgeTime: string;
  urgeFeelings: string[];
  responseActions: string[];
  lessonLearned: string;
  dailyWin: string;
  tomorrowIntention: string;
}

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
  customNotifications: CustomNotification[]; // Array of custom notifications
}

export interface UserSettings {
  affirmationText: string;
  createdAt: string;
  notifications: NotificationSettings;
  // Subscription data
  subscriptionTier?: "free" | "premium" | "pro" | "family";
  subscriptionStatus?:
  | "active"
  | "canceled"
  | "expired"
  | "trial"
  | "grace_period";
  subscriptionEndDate?: string; // ISO date string
  subscriptionAutoRenew?: boolean;
}

const STORAGE_KEYS = {
  dailyEntries: "freedom-planner-daily",
  journalEntries: "freedom-planner-journal",
  settings: "freedom-planner-settings",
};

// Get today's date as YYYY-MM-DD
export const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Daily Entries
export const getDailyEntries = async (): Promise<
  Record<string, DailyEntry>
> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.dailyEntries);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error getting daily entries:", error);
    return {};
  }
};

export const getDailyEntry = async (
  date: string
): Promise<DailyEntry | null> => {
  const entries = await getDailyEntries();
  return entries[date] || null;
};

export const saveDailyEntry = async (entry: DailyEntry): Promise<void> => {
  try {
    const entries = await getDailyEntries();
    entries[entry.date] = entry;
    await AsyncStorage.setItem(
      STORAGE_KEYS.dailyEntries,
      JSON.stringify(entries)
    );
  } catch (error) {
    console.error("Error saving daily entry:", error);
  }
};

export const createDefaultDailyEntry = (date: string): DailyEntry => ({
  id: generateId(),
  date,
  madeBed: false,
  focusTask: "",
  focusTaskCompleted: false,
  energyLevel: null,
  didWell: "",
  movementType: [],
  phoneAway: false,
  preparedTomorrow: false,
});

// Journal Entries
export const getJournalEntries = async (): Promise<
  Record<string, JournalEntry>
> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.journalEntries);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error getting journal entries:", error);
    return {};
  }
};

export const getJournalEntry = async (
  date: string
): Promise<JournalEntry | null> => {
  const entries = await getJournalEntries();
  return entries[date] || null;
};

export const saveJournalEntry = async (entry: JournalEntry): Promise<void> => {
  try {
    const entries = await getJournalEntries();
    entries[entry.date] = entry;
    await AsyncStorage.setItem(
      STORAGE_KEYS.journalEntries,
      JSON.stringify(entries)
    );
  } catch (error) {
    console.error("Error saving journal entry:", error);
  }
};

export const createDefaultJournalEntry = (date: string): JournalEntry => ({
  id: generateId(),
  date,
  todaySentence: "",
  urgeExperienced: false,
  urgeTime: "",
  urgeFeelings: [],
  responseActions: [],
  lessonLearned: "",
  dailyWin: "",
  tomorrowIntention: "",
});

// Default notification settings
const getDefaultNotificationSettings = (): NotificationSettings => ({
  morningReminder: false,
  morningTime: "08:00",
  middayReminder: false,
  middayTime: "13:00",
  eveningReminder: false,
  eveningTime: "20:00",
  milestoneNotifications: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  customNotifications: [],
});

// Settings
export const getSettings = async (): Promise<UserSettings> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.settings);
    const defaultNotificationSettings = getDefaultNotificationSettings();

    const defaultSettings: UserSettings = {
      affirmationText: "I am building the life I want, one day at a time.",
      createdAt: new Date().toISOString(),
      notifications: defaultNotificationSettings,
      subscriptionTier: "free",
      subscriptionStatus: "expired",
      subscriptionAutoRenew: false,
    };
    if (data) {
      const parsed = JSON.parse(data);
      return {
        ...defaultSettings,
        ...parsed,
        notifications: {
          ...defaultNotificationSettings,
          ...parsed.notifications,
          customNotifications: parsed.notifications?.customNotifications ?? [],
        },
      };
    }
    return defaultSettings;
  } catch (error) {
    console.error("Error getting settings:", error);
    return {
      affirmationText: "I am building the life I want, one day at a time.",
      createdAt: new Date().toISOString(),
      notifications: getDefaultNotificationSettings(),
      subscriptionTier: "free",
      subscriptionStatus: "expired",
      subscriptionAutoRenew: false,
    };
  }
};

export const saveSettings = async (settings: UserSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};


