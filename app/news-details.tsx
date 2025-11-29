// app/news-details.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '../constants/ThemeProvider';

type Params = {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  source?: string;
  publishedAt?: string;
};

export default function NewsDetailsScreen() {
  const router = useRouter();
  const { title, description, url, imageUrl, source, publishedAt } =
    useLocalSearchParams<Params>();

  const { theme, isDark } = useAppTheme();
  const colors = theme.colors;

  return (
    <>
      <Stack.Screen options={{ title: 'Article' }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : null}

          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          {source ? (
            <Text style={[styles.source, { color: colors.icon ?? colors.text }]}>
              Source: {source}
            </Text>
          ) : null}

          {publishedAt ? (
            <Text style={[styles.date, { color: colors.icon ?? colors.text }]}>
              {publishedAt}
            </Text>
          ) : null}

          <Text
            style={[
              styles.body,
              { color: colors.text },
            ]}
          >
            {description || 'No description provided.'}
          </Text>

          {url ? (
            <Pressable
              style={[
                styles.button,
                { backgroundColor: colors.tint },
              ]}
              onPress={() => Linking.openURL(url)}
            >
              <Text style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}>
                Open full article
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.backWrapper}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.tint} />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  source: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  backWrapper: {
    marginTop: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
});
