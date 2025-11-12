import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';



type Score = { id: string; home: string; away: string; hs: number; as: number; status: 'LIVE'|'NS'|'FT'; minute?: number };
type NewsItem = { id: string; title: string; excerpt: string; image: string; timeAgo: string };
type EventItem = { id: string; title: string; time: string; day: 'Today'|'Tomorrow' };

const mockScores: Score[] = [
  { id: '1', home: 'MAN UTD', away: 'CHE', hs: 2, as: 1, status: 'LIVE', minute: 85 },
  { id: '2', home: 'ARS', away: 'LIV', hs: 0, as: 0, status: 'NS' },
];

const mockNews: NewsItem[] = [
  { id: 'n1', title: 'Manchester United Wins Champions League', excerpt: 'Historic victory after penalty shootout…', image: 'https://picsum.photos/seed/football/140/100', timeAgo: '2h' },
  { id: 'n2', title: 'NBA Finals: Lakers vs Warriors', excerpt: 'Game 7 tonight at Staples Center…', image: 'https://picsum.photos/seed/basketball/140/100', timeAgo: '4h' },
];

const mockEvents: EventItem[] = [
  { id: 'e1', title: 'Arsenal vs Chelsea', time: '15:30', day: 'Today' },
  { id: 'e2', title: 'Barcelona vs Real Madrid', time: '20:00', day: 'Tomorrow' },
];

export default function Home() {
  const [scores, setScores] = useState<Score[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    // simulate loading
    const t = setTimeout(() => {
      setScores(mockScores);
      setNews(mockNews);
      setEvents(mockEvents);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.appBar}>
        <Text style={styles.brand}> </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={styles.appBarIcon}> </Text>
          <Text style={styles.appBarIcon}> </Text>
        </View>
      </View>

      {/* Counters */}
      <View style={styles.countersRow}>
        <View style={styles.counterCard}>
          <Text style={[styles.counterNumber, { color: '#2563eb' }]}>12</Text>
          <Text style={styles.counterLabel}>Live Games</Text>
        </View>
        <View style={styles.counterCard}>
          <Text style={[styles.counterNumber, { color: '#16a34a' }]}>24</Text>
          <Text style={styles.counterLabel}>Upcoming Events</Text>
        </View>
      </View>

      {/* Live Scores */}
      <SectionHeader title="Live Scores" onViewAll={() => {}} />
      <FlatList
        data={scores}
        keyExtractor={(i) => i.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <ScoreCard item={item} />}
      />

      {/* Latest News */}
      <SectionHeader title="Latest News" onViewAll={() => router.push('/(tabs)/news')} />
      {news.map((n) => <NewsRow key={n.id} item={n} />)}

      {/* Upcoming Events */}
      <SectionHeader title="Upcoming Events" onViewAll={() => {}} />
      {events.map((e) => <EventRow key={e.id} item={e} />)}
    </ScrollView>
  );
}

function SectionHeader({ title, onViewAll }: { title: string; onViewAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.h2}>{title}</Text>
      <Pressable onPress={onViewAll}><Text style={styles.viewAll}>View All</Text></Pressable>
    </View>
  );
}

function ScoreCard({ item }: { item: Score }) {
  const live = item.status === 'LIVE';
  return (
    <View style={styles.scoreCard}>
      <View style={styles.scoreRow}>
        <Text style={styles.team}>{item.home}</Text>
        <Text style={styles.score}>{item.hs}</Text>
        <Text style={styles.dash}>-</Text>
        <Text style={styles.score}>{item.as}</Text>
        <Text style={styles.team}>{item.away}</Text>
      </View>
      <Text style={[styles.status, { color: live ? '#16a34a' : '#6b7280' }]}>
        {live ? `LIVE ${item.minute ?? ''}` : item.status}
      </Text>
    </View>
  );
}

function NewsRow({ item }: { item: NewsItem }) {
  return (
    <Pressable style={styles.newsRow}>
      <Image source={{ uri: item.image }} style={styles.newsImg} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.newsTitle}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.newsExcerpt}>{item.excerpt}</Text>
        <Text style={styles.newsTime}>{item.timeAgo}</Text>
      </View>
    </Pressable>
  );
}

function EventRow({ item }: { item: EventItem }) {
  return (
    <View style={styles.eventRow}>
      <View>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventSub}>{item.day}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.eventTime}>{item.time}</Text>
        <Pressable style={styles.bookBtn}><Text style={styles.bookTxt}>Book</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brand: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  appBarIcon: { fontSize: 20 },

  countersRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  counterCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  counterNumber: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  counterLabel: { textAlign: 'center', color: '#6b7280', marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  h2: { fontSize: 18, fontWeight: '800' },
  viewAll: { color: '#2563eb', fontWeight: '700' },

  scoreCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  team: { fontWeight: '700', color: '#111827' },
  score: { fontSize: 16, fontWeight: '800' },
  dash: { color: '#6b7280', marginHorizontal: 4 },
  status: { marginTop: 6, fontWeight: '700' },

  newsRow: { flexDirection: 'row', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  newsImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#e5e7eb' },
  newsTitle: { fontSize: 16, fontWeight: '800' },
  newsExcerpt: { color: '#6b7280', marginTop: 2 },
  newsTime: { color: '#6b7280', marginTop: 6 },

  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  eventTitle: { fontSize: 16, fontWeight: '800' },
  eventSub: { color: '#6b7280', marginTop: 2 },
  eventTime: { color: '#2563eb', fontWeight: '800', marginBottom: 6 },
  bookBtn: { backgroundColor: '#1f2937', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  bookTxt: { color: 'white', fontWeight: '800' },
});
