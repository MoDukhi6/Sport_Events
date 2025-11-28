// app/news-details.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

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

  return (
    <>
      <Stack.Screen options={{ title: 'Article' }} />
      <ScrollView contentContainerStyle={styles.container}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : null}

        <Text style={styles.title}>{title}</Text>

        {source ? <Text style={styles.source}>Source: {source}</Text> : null}
        {publishedAt ? <Text style={styles.date}>{publishedAt}</Text> : null}

        {description ? (
          <Text style={styles.body}>{description}</Text>
        ) : (
          <Text style={styles.body}>No description provided.</Text>
        )}

        {url ? (
          <Pressable style={styles.button} onPress={() => Linking.openURL(url)}>
            <Text style={styles.buttonText}>Open full article</Text>
          </Pressable>
        ) : null}
        
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#2563eb" />
        </Pressable>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  image: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  source: { fontSize: 14, color: '#666', marginBottom: 4 },
  date: { fontSize: 12, color: '#999', marginBottom: 16 },
  body: { fontSize: 16, lineHeight: 22, color: '#333' },
  button: {
    marginTop: 20,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
});
