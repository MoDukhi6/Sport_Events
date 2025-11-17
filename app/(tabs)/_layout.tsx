import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* ⚽ Sport */}
      <Tabs.Screen
        name="sport"
        options={{
          title: 'Sport',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="sportscourt.fill" color={color} />
          ),
        }}
      />

      {/* 📰 News */}
      <Tabs.Screen
        name="news"
        options={{
          title: 'News',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="newspaper.fill" color={color} />
          ),
        }}
      />

      {/* 📅 Booking */}
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="calendar" color={color} />
          ),
        }}
      />

      {/* 👤 Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.crop.circle" color={color} />
          ),
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // 🚫 hides from the tab bar
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // 🚫 hides from the tab bar
        }}
      />
    </Tabs>
  );
}