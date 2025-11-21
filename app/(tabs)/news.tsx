import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchSportsNews, type Article } from '../api/news-api';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'football', label: 'Football' }, // Soccer
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'baseball', label: 'Baseball' },
  { id: 'formula1', label: 'Formula 1' },
  { id: 'hockey', label: 'Hockey' },
];

export default function NewsScreen() {
  const router = useRouter();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load first page whenever the category changes
  useEffect(() => {
    let cancelled = false;

    const loadFirstPage = async () => {
      setLoading(true);
      setPage(1);
      setHasMore(true);

      try {
        const data = await fetchSportsNews(selectedCategory, 1);
        if (!cancelled) {
          setArticles(data);
          // If fewer than pageSize returned, assume no more
          setHasMore(data.length > 0);
        }
      } catch (e) {
        console.error('Error loading news', e);
        if (!cancelled) {
          setArticles([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const more = await fetchSportsNews(selectedCategory, nextPage);

      if (more.length === 0) {
        setHasMore(false);
      } else {
        setArticles((prev) => [...prev, ...more]);
        setPage(nextPage);
      }
    } catch (e) {
      console.error('Error loading more news', e);
      // If it fails, we keep hasMore = true so user can try again by scrolling
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, selectedCategory]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sports News</Text>

      {/* Category buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setSelectedCategory(cat.id)}
            style={[
              styles.chip,
              selectedCategory === cat.id && styles.chipActive,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === cat.id && styles.chipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/news-details',
                  params: {
                    title: item.title,
                    description: item.description ?? '',
                    url: item.url,
                    imageUrl: item.urlToImage ?? '',
                    source: item.source ?? '',
                    publishedAt: item.publishedAt ?? '',
                  },
                } as never)
              }
            >

              {item.urlToImage && (
                <Image source={{ uri: item.urlToImage }} style={styles.image} />
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text numberOfLines={3} style={styles.cardDescription}>
                  {item.description}
                </Text>
                {/* source is now a string */}
                {item.source && (
                  <Text style={styles.source}>{item.source}</Text>
                )}
              </View>
            </Pressable>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: '#f5f5f5' },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  chips: { marginBottom: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: { color: '#111' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  image: { width: 90, height: 90, borderRadius: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDescription: { fontSize: 14, color: '#555' },
  source: { fontSize: 12, color: '#999', marginTop: 4 },
});
