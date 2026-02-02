import BottomSheetLib from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Bell, ChevronLeft, Edit3, Plus, Trash2, X } from 'react-native-feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheet } from '../src/components/BottomSheet';
import { Button } from '../src/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/Card';
import { Input } from '../src/components/Input';
import { TimePicker, TimePickerRef } from '../src/components/TimePicker';
import { Toggle } from '../src/components/Toggle';
import { useAlert } from '../src/hooks/useAlert';
import { cancelCustomNotification, requestNotificationPermissions, scheduleAllReminders } from '../src/lib/notifications';
import { CustomNotification, generateId, getSettings, saveSettings, UserSettings } from '../src/lib/storage';
import { useTheme } from '../src/lib/theme';
import { cn } from '../src/lib/utils';

const RemindersPage: React.FC = () => {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const { alert, AlertComponent } = useAlert();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTime, setEditingTime] = useState<{ type: string; time: string } | null>(null);
  const [editingCustomNotification, setEditingCustomNotification] = useState<CustomNotification | null>(null);
  const [customNotificationTitle, setCustomNotificationTitle] = useState('');
  const [customNotificationBody, setCustomNotificationBody] = useState('');
  const [customNotificationTime, setCustomNotificationTime] = useState('09:00');

  // Bottom sheet refs
  const timePickerRef = useRef<BottomSheetLib | null>(null);
  const timePickerControlRef = useRef<TimePickerRef>(null);
  const customNotificationSheetRef = useRef<BottomSheetLib | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loaded = await getSettings();
    setSettings(loaded);
    setLoading(false);
  };

  if (loading || !settings) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-gray-900" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-foreground dark:text-foreground-dark">Loading...</Text>
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
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="p-2 -ml-2"
                activeOpacity={0.7}
              >
                <ChevronLeft width={24} height={24} color={effectiveTheme === 'dark' ? '#e5e7eb' : '#1f2937'} />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">Reminders</Text>
                <Text className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  Manage your notification reminders
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          bounces={true}
        >
          <View className="container max-w-lg mx-auto px-4 pb-12 pt-4 gap-y-4">
            {/* Default Reminders */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                  <Bell width={18} height={18} color="#5a7a5a" />
                  <Text className="text-card-foreground dark:text-gray-100 font-semibold">Default Reminders</Text>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <View className="gap-4">
                  {/* Morning Reminder */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-1">
                        Morning Reminder
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingTime({ type: 'morning', time: settings.notifications.morningTime });
                          timePickerControlRef.current?.open();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text className="text-xs text-primary dark:text-primary-dark font-medium">
                          {settings.notifications.morningTime} (tap to edit)
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Toggle
                      value={settings.notifications.morningReminder}
                      onValueChange={async (value) => {
                        const updated = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            morningReminder: value,
                          },
                        };
                        await saveSettings(updated);
                        setSettings(updated);
                        await scheduleAllReminders(updated.notifications);
                      }}
                    />
                  </View>

                  {/* Midday Check-in */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-1">
                        Midday Check-in
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingTime({ type: 'midday', time: settings.notifications.middayTime });
                          timePickerControlRef.current?.open();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text className="text-xs text-primary dark:text-primary-dark font-medium">
                          {settings.notifications.middayTime} (tap to edit)
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Toggle
                      value={settings.notifications.middayReminder}
                      onValueChange={async (value) => {
                        const updated = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            middayReminder: value,
                          },
                        };
                        await saveSettings(updated);
                        setSettings(updated);
                        await scheduleAllReminders(updated.notifications);
                      }}
                    />
                  </View>

                  {/* Evening Journal */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-1">
                        Evening Journal
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingTime({ type: 'evening', time: settings.notifications.eveningTime });
                          timePickerControlRef.current?.open();
                        }}
                        activeOpacity={0.7}
                      >
                        <Text className="text-xs text-primary dark:text-primary-dark font-medium">
                          {settings.notifications.eveningTime} (tap to edit)
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Toggle
                      value={settings.notifications.eveningReminder}
                      onValueChange={async (value) => {
                        const updated = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            eveningReminder: value,
                          },
                        };
                        await saveSettings(updated);
                        setSettings(updated);
                        await scheduleAllReminders(updated.notifications);
                      }}
                    />
                  </View>

                  {/* Milestone Notifications */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-1">
                        Milestone Notifications
                      </Text>
                      <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                        Get notified when you reach milestones
                      </Text>
                    </View>
                    <Toggle
                      value={settings.notifications.milestoneNotifications}
                      onValueChange={async (value) => {
                        const updated = {
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            milestoneNotifications: value,
                          },
                        };
                        await saveSettings(updated);
                        setSettings(updated);
                      }}
                    />
                  </View>

                </View>
              </CardContent>
            </Card>

            {/* Custom Notifications */}
            <Card className="mb-4">
              <CardHeader>
                <View className="flex-row items-center justify-between">
                  <CardTitle className="flex-row items-center gap-2">
                    <Bell width={18} height={18} color="#5a7a5a" />
                    <Text className="text-card-foreground dark:text-gray-100 font-semibold">Custom Notifications</Text>
                  </CardTitle>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingCustomNotification(null);
                      setCustomNotificationTitle('');
                      setCustomNotificationBody('');
                      setCustomNotificationTime('09:00');
                      customNotificationSheetRef.current?.expand();
                    }}
                    className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-primary"
                    activeOpacity={0.7}
                  >
                    <Plus width={14} height={14} color="#ffffff" />
                    <Text className="text-xs font-medium text-primary-foreground">Add</Text>
                  </TouchableOpacity>
                </View>
              </CardHeader>
              <CardContent className="pt-4">
                {settings.notifications.customNotifications && settings.notifications.customNotifications.length > 0 ? (
                  <View className="gap-2">
                    {settings.notifications.customNotifications.map((notif) => (
                      <View
                        key={notif.id}
                        className="p-3 border border-border dark:border-border-dark rounded-lg bg-card dark:bg-card-dark"
                      >
                        <View className="flex-row items-start justify-between mb-2">
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-foreground dark:text-foreground-dark">
                              {notif.title}
                            </Text>
                            <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark mt-0.5">
                              {notif.body}
                            </Text>
                            <Text className="text-xs text-primary dark:text-primary-dark mt-1">{notif.time}</Text>
                          </View>
                          <View className="flex-row items-center gap-2">
                            <Toggle
                              value={notif.enabled}
                              onValueChange={async (value) => {
                                const updated = {
                                  ...settings,
                                  notifications: {
                                    ...settings.notifications,
                                    customNotifications: settings.notifications.customNotifications?.map(n =>
                                      n.id === notif.id ? { ...n, enabled: value } : n
                                    ) || [],
                                  },
                                };
                                await saveSettings(updated);
                                setSettings(updated);
                                await scheduleAllReminders(updated.notifications);
                              }}
                            />
                            <TouchableOpacity
                              onPress={() => {
                                setEditingCustomNotification(notif);
                                setCustomNotificationTitle(notif.title);
                                setCustomNotificationBody(notif.body);
                                setCustomNotificationTime(notif.time);
                                customNotificationSheetRef.current?.expand();
                              }}
                              className="p-1"
                              activeOpacity={0.7}
                            >
                              <Edit3
                                width={14}
                                height={14}
                                color={effectiveTheme === 'dark' ? '#7a9a7a' : '#5a7a5a'}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={async () => {
                                await cancelCustomNotification(notif.id);

                                const updated = {
                                  ...settings,
                                  notifications: {
                                    ...settings.notifications,
                                    customNotifications: settings.notifications.customNotifications?.filter(
                                      n => n.id !== notif.id
                                    ) || [],
                                  },
                                };
                                await saveSettings(updated);
                                setSettings(updated);
                                await scheduleAllReminders(updated.notifications);
                              }}
                              className="p-1"
                              activeOpacity={0.7}
                            >
                              <Trash2 width={14} height={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-xs text-muted-foreground dark:text-muted-foreground-dark text-center py-2">
                    No custom notifications yet. Tap "Add" to create one.
                  </Text>
                )}
              </CardContent>
            </Card>

            {/* Update Schedule Button */}
            <Button
              onPress={async () => {
                const hasPermission = await requestNotificationPermissions();
                if (hasPermission) {
                  await scheduleAllReminders(settings.notifications);
                  alert('Success', 'Notifications scheduled successfully!', undefined, 'success');
                } else {
                  alert(
                    'Permission Required',
                    'Please enable notifications in your device settings.',
                    undefined,
                    'warning'
                  );
                }
              }}
              variant="outline"
              className="w-full"
            >
              Update Notification Schedule
            </Button>
          </View>
        </ScrollView>

        {/* Custom Notification Form Bottom Sheet */}
        <BottomSheet
          bottomSheetRef={customNotificationSheetRef}
          snapPoints={['75%']}
          onClose={() => {
            setEditingCustomNotification(null);
            setCustomNotificationTitle('');
            setCustomNotificationBody('');
            setCustomNotificationTime('09:00');
          }}
        >
          <View className="px-4 pt-2 bg-background dark:bg-background-dark">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-foreground dark:text-foreground-dark">
                {editingCustomNotification ? 'Edit Notification' : 'New Custom Notification'}
              </Text>
              <TouchableOpacity
                onPress={() => customNotificationSheetRef.current?.close()}
                className="p-1"
              >
                <X width={20} height={20} color="hsl(220 9% 46%)" />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                  Title
                </Text>
                <Input
                  value={customNotificationTitle}
                  onChangeText={setCustomNotificationTitle}
                  placeholder="e.g., Afternoon Check-in"
                  className="rounded-lg"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                  Message
                </Text>
                <Input
                  value={customNotificationBody}
                  onChangeText={setCustomNotificationBody}
                  placeholder="e.g., How are you feeling right now?"
                  multiline
                  numberOfLines={3}
                  className="rounded-lg"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-foreground dark:text-foreground-dark mb-2">
                  Time
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditingTime({ type: 'custom', time: customNotificationTime });
                    timePickerControlRef.current?.open();
                  }}
                  className="p-3 border border-border dark:border-border-dark rounded-lg bg-card dark:bg-card-dark"
                  activeOpacity={0.7}
                >
                  <Text className="text-sm text-foreground dark:text-foreground-dark">
                    {customNotificationTime} (tap to edit)
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2">
                <Button
                  onPress={async () => {
                    if (!customNotificationTitle.trim() || !customNotificationBody.trim()) {
                      alert('Error', 'Please fill in all fields', undefined, 'error');
                      return;
                    }

                    const customNotifications = settings.notifications.customNotifications || [];
                    let updatedNotifications: CustomNotification[];

                    if (editingCustomNotification) {
                      updatedNotifications = customNotifications.map(n =>
                        n.id === editingCustomNotification.id
                          ? {
                              ...n,
                              title: customNotificationTitle.trim(),
                              body: customNotificationBody.trim(),
                              time: customNotificationTime,
                            }
                          : n
                      );
                    } else {
                      updatedNotifications = [
                        ...customNotifications,
                        {
                          id: generateId(),
                          title: customNotificationTitle.trim(),
                          body: customNotificationBody.trim(),
                          time: customNotificationTime,
                          enabled: true,
                          createdAt: new Date().toISOString(),
                        },
                      ];
                    }

                    const updated = {
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        customNotifications: updatedNotifications,
                      },
                    };

                    await saveSettings(updated);
                    setSettings(updated);
                    await scheduleAllReminders(updated.notifications);

                    customNotificationSheetRef.current?.close();
                    setEditingCustomNotification(null);
                    setCustomNotificationTitle('');
                    setCustomNotificationBody('');
                    setCustomNotificationTime('09:00');
                  }}
                  className="flex-1"
                  disabled={!customNotificationTitle.trim() || !customNotificationBody.trim()}
                >
                  {editingCustomNotification ? 'Save' : 'Add'}
                </Button>
                <Button
                  onPress={() => {
                    customNotificationSheetRef.current?.close();
                    setEditingCustomNotification(null);
                    setCustomNotificationTitle('');
                    setCustomNotificationBody('');
                    setCustomNotificationTime('09:00');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </View>
            </View>
          </View>
        </BottomSheet>

        {/* Time Picker Bottom Sheet */}
        <TimePicker
          ref={timePickerControlRef}
          bottomSheetRef={timePickerRef}
          currentTime={editingTime?.time || '08:00'}
          onConfirm={async (newTime) => {
            if (!editingTime || !settings) return;

            const updated = {
              ...settings,
              notifications: {
                ...settings.notifications,
                ...(editingTime.type === 'morning' && { morningTime: newTime }),
                ...(editingTime.type === 'midday' && { middayTime: newTime }),
                ...(editingTime.type === 'evening' && { eveningTime: newTime }),
                ...(editingTime.type === 'custom' && { customNotificationTime: newTime }),
              },
            };

            if (editingTime.type === 'custom') {
              setCustomNotificationTime(newTime);
            } else {
              await saveSettings(updated);
              setSettings(updated);
              await scheduleAllReminders(updated.notifications);
            }

            setEditingTime(null);
          }}
          onClose={() => {
            setEditingTime(null);
          }}
          title={editingTime ? `Edit ${editingTime.type === 'morning' ? 'Morning' : editingTime.type === 'midday' ? 'Midday' : editingTime.type === 'evening' ? 'Evening' : 'Custom'} Time` : 'Select Time'}
        />

        {AlertComponent}
      </View>
    </SafeAreaView>
  );
};

export default RemindersPage;

