import React from 'react';
import { View, Animated, Easing } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  className?: string;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      className={`bg-gray-200 ${className}`}
      style={[
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface RecipeCardSkeletonProps {
  width?: number;
  height?: number;
}

export const RecipeCardSkeleton: React.FC<RecipeCardSkeletonProps> = ({
  width = 224, // w-56 = 224px
  height = 288, // h-72 = 288px
}) => {
  return (
    <View className="px-2 mb-4">
      <View
        className="rounded-3xl overflow-hidden shadow"
        style={{ width, height, backgroundColor: '#E5E7EB' }}
      >
        {/* Image skeleton */}
        <SkeletonLoader
          width="100%"
          height="100%"
          borderRadius={24}
          style={{ position: 'absolute' }}
        />
        
        {/* Top glass panel skeleton */}
        <View className="absolute top-4 left-4 right-4 rounded-3xl px-4 py-3 bg-black/30">
          <SkeletonLoader width="80%" height={20} borderRadius={4} className="mb-3" />
          <View className="flex-row items-center mt-3">
            <SkeletonLoader width={60} height={14} borderRadius={4} />
            <View className="mx-3 h-4 w-0.5 bg-gray-400" />
            <SkeletonLoader width={50} height={14} borderRadius={4} />
          </View>
        </View>

        {/* Rating pill skeleton */}
        <View className="absolute bottom-4 right-4 rounded-full px-3 py-2 bg-black/20 flex-row items-center">
          <SkeletonLoader width={40} height={16} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

interface RecipeListItemSkeletonProps {
  height?: number;
}

export const RecipeListItemSkeleton: React.FC<RecipeListItemSkeletonProps> = ({
  height = 150,
}) => {
  return (
    <View className="mb-4 bg-brand-pink rounded-3xl shadow p-2">
      <View className="overflow-hidden">
        {/* Image skeleton */}
        <View className="rounded-[20px] h-[150px] overflow-hidden">
          <SkeletonLoader width="100%" height="100%" borderRadius={20} />
        </View>

        {/* Content skeleton */}
        <View className="p-4">
          <SkeletonLoader width="90%" height={24} borderRadius={4} className="mb-2" />
          <SkeletonLoader width="70%" height={16} borderRadius={4} className="mb-4" />
          
          {/* Stats badges skeleton */}
          <View className="flex-row items-center gap-2">
            <SkeletonLoader width={60} height={28} borderRadius={12} />
            <SkeletonLoader width={70} height={28} borderRadius={12} />
            <SkeletonLoader width={65} height={28} borderRadius={12} />
          </View>
        </View>
      </View>
    </View>
  );
};
