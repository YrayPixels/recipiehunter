import React, { useState } from 'react';
import { Image, ImageProps, ImageSource } from 'expo-image';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: string | ImageSource;
  placeholder?: string;
  showSkeleton?: boolean;
  containerClassName?: string;
  imageClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  placeholder,
  showSkeleton = true,
  containerClassName = '',
  imageClassName = '',
  style,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUri = typeof source === 'string' ? source : (source as any)?.uri || '';

  // Extract borderRadius from style if present
  const borderRadius = (style as any)?.borderRadius || 0;

  return (
    <View className={containerClassName} style={{ position: 'relative' }}>
      {isLoading && showSkeleton && (
        <View style={StyleSheet.absoluteFill} className="overflow-hidden">
          <SkeletonLoader
            width="100%"
            height="100%"
            borderRadius={borderRadius}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      <Image
        source={imageUri}
        className={imageClassName}
        style={[
          style,
          isLoading && { opacity: 0 },
        ]}
        contentFit={props.contentFit || 'cover'}
        transition={200}
        placeholder={placeholder}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        cachePolicy="memory-disk"
        {...props}
      />
      {hasError && (
        <View
          style={StyleSheet.absoluteFill}
          className="items-center justify-center bg-gray-100"
        >
          <View className="items-center justify-center">
            <View className="text-4xl mb-2">🍽️</View>
          </View>
        </View>
      )}
    </View>
  );
};

interface OptimizedImageBackgroundProps extends Omit<ImageProps, 'source'> {
  source: string | ImageSource;
  children: React.ReactNode;
  placeholder?: string;
  showSkeleton?: boolean;
  containerClassName?: string;
  imageClassName?: string;
  imageStyle?: any;
}

export const OptimizedImageBackground: React.FC<OptimizedImageBackgroundProps> = ({
  source,
  children,
  placeholder,
  showSkeleton = true,
  containerClassName = '',
  imageClassName = '',
  style,
  imageStyle,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const imageUri = typeof source === 'string' ? source : (source as any)?.uri || '';

  return (
    <View className={containerClassName} style={[{ position: 'relative' }, style]}>
      {isLoading && showSkeleton && (
        <View style={StyleSheet.absoluteFill} className="overflow-hidden">
          <SkeletonLoader
            width="100%"
            height="100%"
            borderRadius={imageStyle?.borderRadius || 0}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      <Image
        source={imageUri}
        className={imageClassName}
        style={[
          StyleSheet.absoluteFill,
          imageStyle,
          isLoading && { opacity: 0 },
        ]}
        contentFit={props.contentFit || 'cover'}
        transition={200}
        placeholder={placeholder}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        cachePolicy="memory-disk"
        {...props}
      />
      {hasError && (
        <View
          style={StyleSheet.absoluteFill}
          className="items-center justify-center bg-gray-200"
        >
          <View className="text-4xl">🍽️</View>
        </View>
      )}
      <View style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
};
