import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // 👇 Start app at the login screen
  initialRouteName: 'auth/login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 👇 Login screen route */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />

        {/* 👇 Main tab navigation (Home, News, Booking, Profile) */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      </Stack>

      {/* 👇 Auto StatusBar theme */}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}