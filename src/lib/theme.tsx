import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { getSettings, saveSettings, UserSettings } from './storage';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const loadTheme = async () => {
      const settings = await getSettings();
      const savedTheme = (settings as any).theme || 'auto';
      setThemeState(savedTheme);
    };
    loadTheme();
  }, []);

  useEffect(() => {
    let newEffectiveTheme: 'light' | 'dark';
    if (theme === 'auto') {
      newEffectiveTheme = systemTheme === 'dark' ? 'dark' : 'light';
    } else {
      newEffectiveTheme = theme;
    }
    setEffectiveTheme(newEffectiveTheme);
    // Set the color scheme so NativeWind can respond to theme changes
    Appearance.setColorScheme(newEffectiveTheme);
  }, [theme, systemTheme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    const settings = await getSettings();
    const updatedSettings: UserSettings & { theme?: Theme } = {
      ...settings,
      theme: newTheme,
    };
    await saveSettings(updatedSettings as UserSettings);
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

