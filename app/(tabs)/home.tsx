// app/(tabs)/home.tsx
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { getLiveMatches, getTodayFixtures, type Fixture } from '../api/football-api';
import { fetchSportsNews, type Article } from '../api/news-api';

// UI helper types (derived from real data)
type Score = {
  id: string;
  home: string;
  away: string;
  hs: number | string;
  as: number | string;
  status: 'LIVE' | 'NS' | 'FT';
  minute?: number;
};

type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  image?: string | null;
  timeAgo: string;
};

type EventItem = {
  id: string;
  title: string;
  time: string;
  day: 'Today' | 'Tomorrow';
};

export default function Home() {
  const [liveMatches, setLiveMatches] = useState<Fixture[]>([]);
  const [todayFixtures, setTodayFixtures] = useState<Fixture[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [live, today, news] = await Promise.all([
          getLiveMatches(),         // all tracked leagues
          getTodayFixtures(),       // today for all tracked leagues
          fetchSportsNews('all', 1) // latest mixed sports news
        ]);

        if (cancelled) return;

        setLiveMatches(live ?? []);
        setTodayFixtures(today ?? []);
        setArticles(news ?? []);
      } catch (err) {
        console.error('🏠 Home load error:', err);
      }
    };

    load();

    // optional small refresh for scores every 60s
    const interval = setInterval(load, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // --------- DERIVED DATA FOR UI ----------

  // choose matches to display in "Live Scores"
  const scoreSource: Fixture[] =
    liveMatches.length > 0 ? liveMatches : todayFixtures;

  const topScoreMatches = scoreSource.slice(0, 2);

  const scores: Score[] = topScoreMatches.map((m, idx) => {
    const short = m.fixture.status.short;
    const isLive =
      short === '1H' ||
      short === '2H' ||
      short === 'ET' ||
      short === 'HT' ||
      short === 'P';

    const isNotStarted = short === 'NS' || short === 'TBD';

    const status: 'LIVE' | 'NS' | 'FT' = isLive
      ? 'LIVE'
      : isNotStarted
      ? 'NS'
      : 'FT';

    return {
      id: String(m.fixture.id ?? idx),
      home: m.teams.home.name,
      away: m.teams.away.name,
      hs:
        m.goals.home ??
        (isNotStarted ? '-' : 0),
      as:
        m.goals.away ??
        (isNotStarted ? '-' : 0),
      status,
      minute: m.fixture.status.elapsed,
    };
  });

  // pick 2 real articles
  const newsItems: NewsItem[] = (articles || []).slice(0, 2).map((a, idx) => ({
    id: a.url || String(idx),
    title: a.title,
    excerpt: a.description ?? '',
    image: a.urlToImage,
    timeAgo: getTimeAgo(a.publishedAt),
  }));

  // upcoming events = today's fixtures (not started), first 2
  const upcomingFixtures = todayFixtures.filter((m) => {
    const s = m.fixture.status.short;
    return s === 'NS' || s === 'TBD';
  });

  const events: EventItem[] = upcomingFixtures.slice(0, 2).map((m, idx) => ({
    id: String(m.fixture.id ?? idx),
    title: `${m.teams.home.name} vs ${m.teams.away.name}`,
    time: formatTime(m.fixture.date),
    day: 'Today',
  }));

  const liveCount = liveMatches.length;
  const upcomingCount = todayFixtures.length; // per requirement: number of today’s matches

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header (kept minimal) */}
      <View style={styles.appBar}>
        <Text style={styles.brand}></Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <Text style={styles.appBarIcon}></Text>
          <Text style={styles.appBarIcon}></Text>
        </View>
      </View>

      {/* Counters */}
      <View style={styles.countersRow}>
        <View style={styles.counterCard}>
          <Text style={[styles.counterNumber, { color: '#2563eb' }]}>
            {liveCount}
          </Text>
          <Text style={styles.counterLabel}>Live Games</Text>
        </View>
        <View style={styles.counterCard}>
          <Text style={[styles.counterNumber, { color: '#16a34a' }]}>
            {upcomingCount}
          </Text>
          <Text style={styles.counterLabel}>Upcoming Events</Text>
        </View>
      </View>

      {/* Live Scores – NO View All */}
      <SectionHeader title="Live Scores" />
      <FlatList
        data={scores}
        keyExtractor={(i) => i.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <ScoreCard item={item} />}
        ListEmptyComponent={
          <Text style={{ color: '#6b7280', marginBottom: 8 }}>
            No live scores at the moment.
          </Text>
        }
      />

      {/* Latest News – View All -> news.tsx */}
      <SectionHeader
        title="Latest News"
        onViewAll={() => router.push('/(tabs)/news')}
      />
      {newsItems.length === 0 ? (
        <Text style={{ color: '#6b7280', marginBottom: 12 }}>
          No news available.
        </Text>
      ) : (
        newsItems.map((n) => <NewsRow key={n.id} item={n} />)
      )}

      {/* Upcoming Events – View All -> sport.tsx */}
      <SectionHeader
        title="Upcoming Events"
        onViewAll={() => router.push('/(tabs)/sport')}
      />
      {events.length === 0 ? (
        <Text style={{ color: '#6b7280' }}>
          No upcoming events for today.
        </Text>
      ) : (
        events.map((e) => <EventRow key={e.id} item={e} />)
      )}
    </ScrollView>
  );
}

/* ---------- helpers ---------- */

function getTimeAgo(iso?: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ---------- small presentational components ---------- */

function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.h2}>{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      )}
    </View>
  );
}

function ScoreCard({ item }: { item: Score }) {
  const live = item.status === 'LIVE';
  return (
    <View style={styles.scoreCard}>
      <View style={styles.scoreRow}>
        <Text style={styles.team}>{item.home}</Text>
        <Text
          style={[
            styles.score,
            live && styles.scoreLive,
            item.status === 'FT' && styles.scoreFinished,
          ]}
        >
          {item.hs}
        </Text>
        <Text style={styles.dash}>-</Text>
        <Text
          style={[
            styles.score,
            live && styles.scoreLive,
            item.status === 'FT' && styles.scoreFinished,
          ]}
        >
          {item.as}
        </Text>
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
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.newsImg} />
      ) : (
        <View style={[styles.newsImg, { backgroundColor: '#e5e7eb' }]} />
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={styles.newsTitle}>
          {item.title}
        </Text>
        {!!item.excerpt && (
          <Text numberOfLines={1} style={styles.newsExcerpt}>
            {item.excerpt}
          </Text>
        )}
        {!!item.timeAgo && (
          <Text style={styles.newsTime}>{item.timeAgo}</Text>
        )}
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
        <Pressable style={styles.bookBtn}>
          <Text style={styles.bookTxt}>Book</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brand: { fontSize: 22, fontWeight: '800', color: '#2563eb' },
  appBarIcon: { fontSize: 20 },

  countersRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  counterCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  counterNumber: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  counterLabel: { textAlign: 'center', color: '#6b7280', marginTop: 4 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  h2: { fontSize: 18, fontWeight: '800' },
  viewAll: { color: '#2563eb', fontWeight: '700' },

  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  team: { fontWeight: '700', color: '#111827' },
  score: { fontSize: 16, fontWeight: '800', color: '#6b7280' },
  scoreLive: { color: '#16a34a' },
  scoreFinished: { color: '#111827' },
  dash: { color: '#6b7280', marginHorizontal: 4 },
  status: { marginTop: 6, fontWeight: '700' },

  newsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  newsImg: { width: 64, height: 64, borderRadius: 8 },
  newsTitle: { fontSize: 16, fontWeight: '800' },
  newsExcerpt: { color: '#6b7280', marginTop: 2 },
  newsTime: { color: '#6b7280', marginTop: 6 },

  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  eventTitle: { fontSize: 16, fontWeight: '800' },
  eventSub: { color: '#6b7280', marginTop: 2 },
  eventTime: { color: '#2563eb', fontWeight: '800', marginBottom: 6 },
  bookBtn: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookTxt: { color: 'white', fontWeight: '800' },
});
