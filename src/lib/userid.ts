import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserId = async (): Promise<string> => {
  const userId = await AsyncStorage.getItem("breakfree_user_id");
  if (!userId) {

    const newUserId =`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;;
    await AsyncStorage.setItem("breakfree_user_id", newUserId);
    return newUserId;
  }
  return userId;
};