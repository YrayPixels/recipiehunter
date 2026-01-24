import { useRouter, usePathname } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Home, Coffee, Heart, User, BookOpen } from 'react-native-feather';
import { Text } from './Text';

const navigationItems = [
  {
    name: 'home',
    label: 'home',
    icon: Home,
    route: '/',
  },
  {
    name: 'recipes',
    label: 'recipes',
    icon: Coffee,
    route: '/guides',
  },
  {
    name: 'Shopping Lists',
    label: 'Shopping Lists',
    icon: BookOpen,
    route: '/shopping', // TODO: Create a favorites page
  },
  {
    name: 'profile',
    label: 'profile',
    icon: User,
    route: '/profile',
  },
];

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/') {
      return pathname === '/' || pathname === '/index';
    }
    return pathname?.startsWith(route);
  };

  return (
    <View className=" px-4 pt-3 pb-2">
          <View className="bg-[#313131] rounded-full w-full p-3 flex-row items-center justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.route);
          const iconColor = active ? '#FFFFFF' : '#9CA3AF';
          const textColor = active ? '#FFFFFF' : '#9CA3AF';

          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => router.push(item.route as any)}
              className="items-center flex-1 py-2"
              activeOpacity={0.7}
            >
              <Icon
                width={24}
                height={24}
                color={iconColor}
                strokeWidth={active ? 2.5 : 2}
              />
              <Text
                className={`text-xs mt-1 space-regular ${active ? 'text-white' : 'text-gray-400'}`}
                style={{ color: textColor }}
              >
                {item.label}
              </Text>
              {active && (
                <View className="absolute -bottom-1 left-1/2 w-1 h-1 bg-white rounded-full" style={{ marginLeft: -2 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
