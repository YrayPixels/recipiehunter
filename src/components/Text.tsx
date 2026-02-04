import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { cn } from '../lib/utils';

// Font family mappings
const FONT_MAP: Record<string, string> = {
  'space-regular': 'SpaceGrotesk_400Regular',
  'space-medium': 'SpaceGrotesk_500Medium',
  'space-semibold': 'SpaceGrotesk_600SemiBold',
  'space-bold': 'SpaceGrotesk_700Bold',
};

export interface TextProps extends RNTextProps {
  className?: string;
}

export const Text = React.forwardRef<RNText, TextProps>(
  ({ className, style, ...props }, ref) => {
    // Parse className to extract font classes
    const fontFamily = React.useMemo(() => {
      if (!className) return undefined;

      const classes = className.split(' ').filter(Boolean);

      // Check for space font classes (in order of specificity)
      for (const cls of classes) {
        if (FONT_MAP[cls]) {
          return FONT_MAP[cls];
        }
      }

      return undefined;
    }, [className]);

    // Remove font classes from className to avoid conflicts with NativeWind
    const cleanedClassName = React.useMemo(() => {
      if (!className) return className;

      const classes = className.split(' ').filter(Boolean);
      const filtered = classes.filter(cls => !FONT_MAP[cls]);

      return filtered.length > 0 ? cn(...filtered) : undefined;
    }, [className]);

    // Combine styles
    const combinedStyle = React.useMemo(() => {
      const styles = [];

      if (fontFamily) {
        styles.push({ fontFamily });
      }

      if (style) {
        styles.push(style);
      }

      return styles.length > 0 ? (styles.length === 1 ? styles[0] : styles) : undefined;
    }, [fontFamily, style]);

    return (
      <RNText
        ref={ref}
        className={cleanedClassName}
        style={combinedStyle}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';
