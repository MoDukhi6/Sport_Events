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
        {/* 👇 Auth routes */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />

        {/* 👇 Main tab navigation (Home, News, Booking, Profile) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* 👇 Booking routes */}
        <Stack.Screen name="booking/preferences" options={{ headerShown: false }} />
        <Stack.Screen name="booking/recommendations" options={{ headerShown: false }} />
        <Stack.Screen name="booking/seat-map" options={{ headerShown: false }} />
        <Stack.Screen name="booking/my-bookings" options={{ headerShown: false }} />

        {/* 👇 Football routes */}
        <Stack.Screen name="football/index" options={{ headerShown: false }} />
        <Stack.Screen name="football/leagues" options={{ headerShown: false }} />
        <Stack.Screen name="football/matches" options={{ headerShown: false }} />
        <Stack.Screen name="football/standings" options={{ headerShown: false }} />
        <Stack.Screen name="football/knockout" options={{ headerShown: false }} />
        <Stack.Screen name="football/league" options={{ headerShown: false }} />
        <Stack.Screen name="football/search-teams" options={{ headerShown: false }} />
        <Stack.Screen name="football/match/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="football/team/[id]" options={{ headerShown: false }} />

        {/* 👇 Prediction route */}
        <Stack.Screen name="prediction/match" options={{ headerShown: false }} />

        {/* 👇 Game routes */}
        <Stack.Screen name="game/my-predictions" options={{ headerShown: false }} />
        <Stack.Screen name="game/leaderboard" options={{ headerShown: false }} />

        {/* 👇 API route (for documentation) */}
        <Stack.Screen name="api/football-api" options={{ headerShown: false }} />
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