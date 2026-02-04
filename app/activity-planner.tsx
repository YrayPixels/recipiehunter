import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activityPlansAPI } from '../src/lib/api';
import { getUserId } from '../src/lib/userid';

export default function ActivityPlannerScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      loadActivities();
    }
  }, [userId]);

  const loadUserId = async () => {
    const id = await getUserId();
    setUserId(id);
  };

  const loadActivities = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const today = new Date();
      const startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
      const endDate = new Date(today.setDate(today.getDate() + 14)).toISOString().split('T')[0];

      const data = await activityPlansAPI.getActivityPlans(userId, startDate, endDate);
      setActivities(data.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#5a7a5a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="flex-1 px-4 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl  text-gray-900 dark:text-white">Activity Planner</Text>
          <TouchableOpacity
            onPress={() => router.push('/add-guide')}
            className="bg-green-600 dark:bg-green-700 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-semibold">+ Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={activities}
          keyExtractor={(item, index) => `${item.date}-${index}`}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(item.date).toLocaleDateString()}
              </Text>
              {item.time && (
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {item.time}
                </Text>
              )}
              <Text className="text-base text-gray-900 dark:text-white mt-2">
                {item.guideTitle}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
                No activities planned yet
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/guides')}
                className="bg-green-600 dark:bg-green-700 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Browse Guides</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
