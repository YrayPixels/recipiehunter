import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';

interface ThemeContextType {
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Always set light mode
    Appearance.setColorScheme('light');
  }, []);

  return (
    <ThemeContext.Provider value={{ effectiveTheme: 'light' }}>
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

