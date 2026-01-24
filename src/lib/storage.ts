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
  motivationalQuotes: boolean;
  motivationalQuotesTime: string; // HH:mm format
  goalReminders: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
  customNotifications: CustomNotification[]; // Array of custom notifications
}

export interface MilestoneReward {
  milestone: number;
  unlockedAt: string; // YYYY-MM-DD
  rewardType: "badge" | "title" | "theme" | "feature";
  rewardName: string;
  description: string;
}

export interface UserSettings {
  affirmationText: string;
  createdAt: string;
  currentStreak: number;
  longestStreak: number;
  lastStreakUpdate: string; // YYYY-MM-DD
  selectedHabits: string[]; // Array of habit IDs
  primaryHabit: string | null; // ID of primary habit
  achievedMilestones: number[]; // Array of milestone days that have been achieved
  lastMilestoneCheck: string; // YYYY-MM-DD of last milestone check
  unlockedRewards: MilestoneReward[]; // Array of unlocked rewards
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

export const HABIT_OPTIONS = [
  { id: "porn", label: "Pornography", icon: "👁️" },
  { id: "masturbation", label: "Masturbation", icon: "🚫" },
  { id: "smoking", label: "Smoking", icon: "🚬" },
  { id: "alcohol", label: "Alcohol", icon: "🍷" },
  { id: "gambling", label: "Gambling", icon: "🎲" },
  { id: "social-media", label: "Social Media", icon: "📱" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "shopping", label: "Shopping", icon: "🛒" },
  { id: "other", label: "Other", icon: "📝" },
] as const;

export type HabitId = (typeof HABIT_OPTIONS)[number]["id"];

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCleanDate: string | null; // YYYY-MM-DD of last day without urges
}

export interface Goal {
  id: string;
  title: string;
  targetDays: number;
  startDate: string; // YYYY-MM-DD
  targetDate?: string; // YYYY-MM-DD (optional end date)
  completed: boolean;
  completedDate?: string; // YYYY-MM-DD
  createdAt: string;
}

const STORAGE_KEYS = {
  dailyEntries: "freedom-planner-daily",
  journalEntries: "freedom-planner-journal",
  settings: "freedom-planner-settings",
  goals: "freedom-planner-goals",
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
  morningReminder: true,
  morningTime: "08:00",
  middayReminder: true,
  middayTime: "13:00",
  eveningReminder: true,
  eveningTime: "20:00",
  milestoneNotifications: true,
  motivationalQuotes: true,
  motivationalQuotesTime: "10:00",
  goalReminders: true,
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
      currentStreak: 0,
      longestStreak: 0,
      lastStreakUpdate: getTodayDate(),
      selectedHabits: [],
      primaryHabit: null,
      achievedMilestones: [],
      lastMilestoneCheck: getTodayDate(),
      unlockedRewards: [],
      notifications: defaultNotificationSettings,
      subscriptionTier: "free",
      subscriptionStatus: "expired",
      subscriptionAutoRenew: false,
    };
    if (data) {
      const parsed = JSON.parse(data);
      // Migrate old settings to include streak data and habits
      return {
        ...defaultSettings,
        ...parsed,
        currentStreak: parsed.currentStreak ?? 0,
        longestStreak: parsed.longestStreak ?? 0,
        lastStreakUpdate: parsed.lastStreakUpdate ?? getTodayDate(),
        selectedHabits: parsed.selectedHabits ?? [],
        primaryHabit: parsed.primaryHabit ?? null,
        achievedMilestones: parsed.achievedMilestones ?? [],
        lastMilestoneCheck: parsed.lastMilestoneCheck ?? getTodayDate(),
        unlockedRewards: parsed.unlockedRewards ?? [],
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
      currentStreak: 0,
      longestStreak: 0,
      lastStreakUpdate: getTodayDate(),
      selectedHabits: [],
      primaryHabit: null,
      achievedMilestones: [],
      lastMilestoneCheck: getTodayDate(),
      unlockedRewards: [],
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

// Streak Calculation Utilities
export const calculateStreak = async (): Promise<StreakData> => {
  const journalEntries = await getJournalEntries();
  const today = getTodayDate();

  // Sort dates in descending order (newest first)
  const dates = Object.keys(journalEntries)
    .filter((date) => {
      const entry = journalEntries[date];
      // Only count entries where urgeExperienced is explicitly false
      return entry && entry.urgeExperienced === false;
    })
    .sort((a, b) => b.localeCompare(a)); // Descending order

  if (dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCleanDate: null,
    };
  }

  // Calculate current streak (consecutive days from today backwards)
  let currentStreak = 0;
  let checkDate = new Date(today);

  // Check if today is clean
  const todayEntry = journalEntries[today];
  const todayIsClean = todayEntry && todayEntry.urgeExperienced === false;

  if (!todayIsClean) {
    // If today is not clean, check yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive clean days backwards from today (or yesterday if today isn't clean)
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    const entry = journalEntries[dateStr];

    if (entry && entry.urgeExperienced === false) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak (find longest consecutive sequence)
  let longestStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  // Sort all dates in ascending order for longest streak calculation
  const allDates = Object.keys(journalEntries)
    .filter((date) => {
      const entry = journalEntries[date];
      return entry && entry.urgeExperienced === false;
    })
    .map((date) => new Date(date + "T00:00:00"))
    .sort((a, b) => a.getTime() - b.getTime());

  for (const date of allDates) {
    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff === 1) {
        // Consecutive day
        tempStreak++;
      } else {
        // Gap found, reset streak
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    lastDate = date;
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Find last clean date
  const lastCleanDate = dates.length > 0 ? dates[0] : null;

  return {
    currentStreak,
    longestStreak,
    lastCleanDate,
  };
};

// Update streak in settings
export const updateStreak = async (): Promise<StreakData> => {
  const streakData = await calculateStreak();
  const settings = await getSettings();

  const updatedSettings: UserSettings = {
    ...settings,
    currentStreak: streakData.currentStreak,
    longestStreak: Math.max(settings.longestStreak, streakData.longestStreak),
    lastStreakUpdate: getTodayDate(),
  };

  await saveSettings(updatedSettings);
  return streakData;
};

// Get streak milestones (7, 30, 90, 180, 365 days)
export const getStreakMilestones = (): number[] => {
  return [7, 30, 90, 180, 365];
};

// Check if a milestone was reached
export const checkMilestoneReached = (
  currentStreak: number,
  previousStreak: number
): number | null => {
  const milestones = getStreakMilestones();
  for (const milestone of milestones) {
    if (currentStreak >= milestone && previousStreak < milestone) {
      return milestone;
    }
  }
  return null;
};

// Check for new milestones and return any that were just achieved
export const checkForNewMilestones = async (): Promise<number | null> => {
  const settings = await getSettings();
  const streakData = await calculateStreak();
  const currentStreak = streakData.currentStreak;

  // Only check if streak has changed since last check
  const today = getTodayDate();
  if (
    settings.lastMilestoneCheck === today &&
    settings.currentStreak === currentStreak
  ) {
    return null; // Already checked today
  }

  const milestones = getStreakMilestones();
  for (const milestone of milestones) {
    // Check if milestone is reached and not yet achieved
    if (
      currentStreak >= milestone &&
      !settings.achievedMilestones.includes(milestone)
    ) {
      // Mark milestone as achieved and unlock rewards
      const rewards = await unlockMilestoneRewards(milestone);
      const updatedSettings: UserSettings = {
        ...settings,
        achievedMilestones: [...settings.achievedMilestones, milestone],
        lastMilestoneCheck: today,
      };
      await saveSettings(updatedSettings);
      return milestone;
    }
  }

  // Update last check date even if no milestone
  if (settings.lastMilestoneCheck !== today) {
    const updatedSettings: UserSettings = {
      ...settings,
      lastMilestoneCheck: today,
    };
    await saveSettings(updatedSettings);
  }

  return null;
};

// Get milestone message
export const getMilestoneMessage = (milestone: number): string => {
  const messages: Record<number, string> = {
    7: "One week strong! You're building momentum.",
    30: "30 days! You've proven you can do this.",
    90: "90 days! You're transforming your life.",
    180: "6 months! This is incredible progress.",
    365: "One year! You've completely transformed.",
  };
  return messages[milestone] || `Congratulations on ${milestone} days!`;
};

// Get milestone rewards
export const getMilestoneRewards = (milestone: number): MilestoneReward[] => {
  const rewards: Record<number, MilestoneReward[]> = {
    7: [{
      milestone: 7,
      unlockedAt: getTodayDate(),
      rewardType: 'badge',
      rewardName: 'Week Warrior',
      description: 'Completed your first week!',
    }],
    30: [{
      milestone: 30,
      unlockedAt: getTodayDate(),
      rewardType: 'badge',
      rewardName: 'Month Master',
      description: '30 days of strength and commitment!',
    }, {
      milestone: 30,
      unlockedAt: getTodayDate(),
      rewardType: 'title',
      rewardName: 'Resilient',
      description: 'Unlock the "Resilient" title',
    }],
    90: [{
      milestone: 90,
      unlockedAt: getTodayDate(),
      rewardType: 'badge',
      rewardName: 'Quarter Champion',
      description: '90 days of transformation!',
    }, {
      milestone: 90,
      unlockedAt: getTodayDate(),
      rewardType: 'title',
      rewardName: 'Unstoppable',
      description: 'Unlock the "Unstoppable" title',
    }],
    180: [{
      milestone: 180,
      unlockedAt: getTodayDate(),
      rewardType: 'badge',
      rewardName: 'Half-Year Hero',
      description: '6 months of incredible progress!',
    }, {
      milestone: 180,
      unlockedAt: getTodayDate(),
      rewardType: 'title',
      rewardName: 'Legend',
      description: 'Unlock the "Legend" title',
    }],
    365: [{
      milestone: 365,
      unlockedAt: getTodayDate(),
      rewardType: 'badge',
      rewardName: 'Year Warrior',
      description: 'A full year of freedom!',
    }, {
      milestone: 365,
      unlockedAt: getTodayDate(),
      rewardType: 'title',
      rewardName: 'Phoenix',
      description: 'Unlock the "Phoenix" title - reborn and free!',
    }],
  };
  return rewards[milestone] || [];
};

// Unlock milestone rewards
export const unlockMilestoneRewards = async (milestone: number): Promise<MilestoneReward[]> => {
  const settings = await getSettings();
  const rewards = getMilestoneRewards(milestone);
  
  // Filter out rewards that are already unlocked
  const newRewards = rewards.filter(
    reward => !settings.unlockedRewards.some(
      ur => ur.milestone === reward.milestone && ur.rewardName === reward.rewardName
    )
  );

  if (newRewards.length > 0) {
    const updatedSettings: UserSettings = {
      ...settings,
      unlockedRewards: [...settings.unlockedRewards, ...newRewards],
    };
    await saveSettings(updatedSettings);
  }

  return newRewards;
};

// Habit Management
export const getHabitLabel = (habitId: HabitId | string): string => {
  const habit = HABIT_OPTIONS.find((h) => h.id === habitId);
  return habit?.label || "Unknown Habit";
};

export const getHabitIcon = (habitId: HabitId | string): string => {
  const habit = HABIT_OPTIONS.find((h) => h.id === habitId);
  return habit?.icon || "📝";
};

// Get habit-specific text
export const getHabitText = (
  habitId: HabitId | string | null,
  defaultText: string
): string => {
  if (!habitId) return defaultText;
  const habit = HABIT_OPTIONS.find((h) => h.id === habitId);
  if (!habit) return defaultText;

  // Customize text based on habit
  const customizations: Record<string, string> = {
    porn: "pornography",
    masturbation: "masturbation",
    smoking: "smoking",
    alcohol: "alcohol",
    gambling: "gambling",
    "social-media": "social media",
    gaming: "gaming",
    shopping: "shopping",
  };

  return customizations[habitId] || defaultText;
};

// Goal Management
export const getGoals = async (): Promise<Goal[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.goals);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting goals:", error);
    return [];
  }
};

export const saveGoal = async (goal: Goal): Promise<void> => {
  try {
    const goals = await getGoals();
    const existingIndex = goals.findIndex((g) => g.id === goal.id);
    if (existingIndex >= 0) {
      goals[existingIndex] = goal;
    } else {
      goals.push(goal);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(goals));
  } catch (error) {
    console.error("Error saving goal:", error);
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    const goals = await getGoals();
    const filtered = goals.filter((g) => g.id !== goalId);
    await AsyncStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting goal:", error);
  }
};

export const createGoal = (
  title: string,
  targetDays: number,
  targetDate?: string
): Goal => {
  return {
    id: generateId(),
    title,
    targetDays,
    startDate: getTodayDate(),
    targetDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };
};

// Calculate goal progress
export const calculateGoalProgress = async (
  goal: Goal
): Promise<{
  currentDays: number;
  progress: number; // 0-100
  daysRemaining: number;
  isCompleted: boolean;
}> => {
  const streakData = await calculateStreak();
  const currentDays = streakData.currentStreak;

  // If goal is based on streak from start date, calculate from start
  const startDate = new Date(goal.startDate + "T00:00:00");
  const today = new Date(getTodayDate() + "T00:00:00");
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Use current streak if it's higher than days since start
  const progressDays = Math.max(currentDays, daysSinceStart);
  const progress = Math.min((progressDays / goal.targetDays) * 100, 100);
  const daysRemaining = Math.max(0, goal.targetDays - progressDays);
  const isCompleted = progressDays >= goal.targetDays;

  // Mark as completed if not already
  if (isCompleted && !goal.completed) {
    const updatedGoal: Goal = {
      ...goal,
      completed: true,
      completedDate: getTodayDate(),
    };
    await saveGoal(updatedGoal);
  }

  return {
    currentDays: progressDays,
    progress,
    daysRemaining,
    isCompleted,
  };
};

// Check for goal completions and send reminders
export const checkGoalProgress = async (): Promise<{
  completedGoals: Goal[];
  goalsNeedingReminder: Goal[];
}> => {
  const goals = await getGoals();
  const completedGoals: Goal[] = [];
  const goalsNeedingReminder: Goal[] = [];

  for (const goal of goals) {
    if (goal.completed) continue;

    const progress = await calculateGoalProgress(goal);
    
    // Check if goal was just completed
    if (progress.isCompleted && !goal.completed) {
      completedGoals.push(goal);
    }
    
    // Check if goal needs a reminder (25%, 50%, 75% milestones or 5 days remaining)
    const milestones = [25, 50, 75];
    const isAtMilestone = milestones.some(
      (milestone) => progress.progress >= milestone && progress.progress < milestone + 5
    );
    const isNearCompletion = progress.daysRemaining <= 5 && progress.daysRemaining > 0;
    
    if (isAtMilestone || isNearCompletion) {
      goalsNeedingReminder.push(goal);
    }
  }

  return { completedGoals, goalsNeedingReminder };
};

