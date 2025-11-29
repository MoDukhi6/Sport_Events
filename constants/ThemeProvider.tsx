// ThemeProvider.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Colors } from './theme';

type ThemeMode = 'light' | 'dark';

type AppTheme = {
  mode: ThemeMode;
  colors: (typeof Colors)['light'];
};

type ThemeContextValue = {
  theme: AppTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

const THEME_KEY = '@appTheme'; // 'light' | 'dark'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [mode, setMode] = useState<ThemeMode>('light');

  // load saved theme
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === 'dark' || stored === 'light') {
          setMode(stored);
        }
      } catch (e) {
        console.log('Error loading theme', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      setMode((current) => {
        const next: ThemeMode = current === 'light' ? 'dark' : 'light';
        AsyncStorage.setItem(THEME_KEY, next); // fire & forget
        return next;
      });
    } catch (e) {
      console.log('Error saving theme', e);
    }
  };

  const value: ThemeContextValue = {
    theme: {
      mode,
      colors: mode === 'light' ? Colors.light : Colors.dark,
    },
    isDark: mode === 'dark',
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useAppTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used inside ThemeProvider');
  }
  return ctx;
};