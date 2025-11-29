// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { ThemeProvider, useAppTheme } from '../constants/ThemeProvider';

export const unstable_settings = {
  // 👇 Start app at the login screen
  initialRouteName: 'auth/login',
};

function RootStack() {
  const { isDark } = useAppTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 👇 Login screen route */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />

        {/* 👇 Main tab navigation (Home, News, Booking, Profile) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* 👇 StatusBar controlled by our custom theme, NOT system theme */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}