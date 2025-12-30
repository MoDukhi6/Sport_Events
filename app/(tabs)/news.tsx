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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchSportsNews, type Article } from '../api/news-api';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'football', label: 'Football' },
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
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFirstPage = async () => {
      setLoading(true);
      setPage(1);
      setHasMore(true);

      try {
        const data = await fetchSportsNews(
          selectedCategory, 
          1, 
          searchQuery.trim() || undefined
        );
        if (!cancelled) {
          setArticles(data);
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
  }, [selectedCategory, searchActive]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      setSearchActive(prev => !prev);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchActive(prev => !prev);
  };

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || loading || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const more = await fetchSportsNews(
        selectedCategory, 
        nextPage, 
        searchQuery.trim() || undefined
      );

      if (more.length === 0) {
        setHasMore(false);
      } else {
        setArticles((prev) => [...prev, ...more]);
        setPage(nextPage);
      }
    } catch (e) {
      console.error('Error loading more news', e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, loading, hasMore, page, selectedCategory, searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Sports News</Text>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search news..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleClearSearch} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>
              {searchQuery ? 'Searching...' : 'Loading news...'}
            </Text>
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📰</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No results found' : 'No news available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? `Try searching for something else` 
                : 'Try selecting a different category'}
            </Text>
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  
  searchContainer: {
    marginBottom: 6,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 2,
    marginLeft: 4,
  },
  clearButtonText: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '600',
  },
  
  chips: { 
    marginBottom: 10,
    flexGrow: 0,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#666',
    marginRight: 8,
    backgroundColor: '#fff',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: { 
    color: '#111',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  chipTextActive: { 
    color: '#fff', 
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  image: { 
    width: 90, 
    height: 90, 
    borderRadius: 8,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '600',
  },
  cardDescription: { 
    fontSize: 14, 
    color: '#555',
  },
  source: { 
    fontSize: 12, 
    color: '#999', 
    marginTop: 4,
  },
});