// app/football/matches.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getLiveMatches, type Fixture } from '../api/football-api';

type TabType = 'yesterday' | 'today' | 'tomorrow';

export default function MatchesScreen() {
  const router = useRouter();
  const { league, name } = useLocalSearchParams<{
    league?: string;
    name?: string;
  }>();

  const numericLeagueId = league ? Number(league) : undefined;
  const leagueName = name ?? 'Matches';

  const [selectedTab, setSelectedTab] = useState<TabType>('today');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [liveMatches, setLiveMatches] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Get dates for yesterday, today, tomorrow
  const getDate = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const dates = {
    yesterday: getDate(-1),
    today: getDate(0),
    tomorrow: getDate(1),
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Load fixtures for selected tab
  const loadFixtures = async () => {
    if (!numericLeagueId) return;

    setLoading(true);
    try {
      const dateToFetch = dates[selectedTab];
      console.log(`Loading fixtures for ${selectedTab}: ${dateToFetch}`);

      // Fetch fixtures for the selected date
      const response = await fetch(
        `http://10.197.235.222:4000/api/football/fixtures/today?date=${dateToFetch}&leagues=${numericLeagueId}`
      );
      const data = await response.json();

      setFixtures(data);

      // If it's today, also fetch live matches
      if (selectedTab === 'today') {
        const liveData = await getLiveMatches(numericLeagueId);
        setLiveMatches(liveData);
      } else {
        setLiveMatches([]);
      }

      console.log(`✅ Found ${data.length} fixtures for ${selectedTab}`);
    } catch (err) {
      console.error('Error loading fixtures:', err);
      setFixtures([]);
      setLiveMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load fixtures when tab changes
  useEffect(() => {
    loadFixtures();
  }, [selectedTab, numericLeagueId]);

  // Auto-refresh live matches every 30 seconds when on "today" tab
  useEffect(() => {
    if (selectedTab !== 'today') return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing live matches...');
      loadFixtures();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedTab, numericLeagueId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFixtures();
  };

  // Render a single match card
  const renderMatch = (match: Fixture) => {
    const isLive = match.fixture.status.short === '1H' || 
                   match.fixture.status.short === '2H' ||
                   match.fixture.status.short === 'HT' ||
                   match.fixture.status.short === 'ET' ||
                   match.fixture.status.short === 'P';
    
    const isFinished = match.fixture.status.short === 'FT' ||
                       match.fixture.status.short === 'AET' ||
                       match.fixture.status.short === 'PEN';
    
    const isNotStarted = match.fixture.status.short === 'NS' ||
                         match.fixture.status.short === 'TBD';

    const homeGoals = match.goals.home ?? '-';
    const awayGoals = match.goals.away ?? '-';

    return (
      <View key={match.fixture.id} style={styles.matchCard}>
        {/* Live badge */}
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* Match time/status */}
        <Text style={styles.matchTime}>
          {isNotStarted ? formatTime(match.fixture.date) : match.fixture.status.long}
        </Text>

        {/* Teams and score */}
        <View style={styles.matchContent}>
          {/* Home Team */}
          <View style={styles.teamRow}>
            <Text style={styles.teamName}>{match.teams.home.name}</Text>
            <Text style={[
              styles.score,
              isLive && styles.scoreLive,
              isFinished && styles.scoreFinished,
            ]}>
              {homeGoals}
            </Text>
          </View>

          {/* Away Team */}
          <View style={styles.teamRow}>
            <Text style={styles.teamName}>{match.teams.away.name}</Text>
            <Text style={[
              styles.score,
              isLive && styles.scoreLive,
              isFinished && styles.scoreFinished,
            ]}>
              {awayGoals}
            </Text>
          </View>
        </View>

        {/* Match status details */}
        {isLive && (
          <Text style={styles.statusText}>
            {match.fixture.status.elapsed}' - {match.fixture.status.long}
          </Text>
        )}
      </View>
    );
  };

  // Merge live matches with fixtures for "today" tab
  const displayFixtures = selectedTab === 'today' 
    ? [...liveMatches, ...fixtures.filter(f => 
        !liveMatches.find(live => live.fixture.id === f.fixture.id)
      )]
    : fixtures;

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>{leagueName} Matches</Text>

      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, selectedTab === 'yesterday' && styles.tabActive]}
          onPress={() => setSelectedTab('yesterday')}
        >
          <Text style={[styles.tabText, selectedTab === 'yesterday' && styles.tabTextActive]}>
            Yesterday
          </Text>
          <Text style={[styles.tabDate, selectedTab === 'yesterday' && styles.tabDateActive]}>
            {formatDate(dates.yesterday)}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, selectedTab === 'today' && styles.tabActive]}
          onPress={() => setSelectedTab('today')}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.tabTextActive]}>
            Today
          </Text>
          <Text style={[styles.tabDate, selectedTab === 'today' && styles.tabDateActive]}>
            {formatDate(dates.today)}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, selectedTab === 'tomorrow' && styles.tabActive]}
          onPress={() => setSelectedTab('tomorrow')}
        >
          <Text style={[styles.tabText, selectedTab === 'tomorrow' && styles.tabTextActive]}>
            Tomorrow
          </Text>
          <Text style={[styles.tabDate, selectedTab === 'tomorrow' && styles.tabDateActive]}>
            {formatDate(dates.tomorrow)}
          </Text>
        </Pressable>
      </View>

      {/* Live matches count for today */}
      {selectedTab === 'today' && liveMatches.length > 0 && (
        <View style={styles.liveCountBanner}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveCountText}>
            {liveMatches.length} live {liveMatches.length === 1 ? 'match' : 'matches'}
          </Text>
        </View>
      )}

      {/* Fixtures list */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : displayFixtures.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No matches found for {selectedTab}
            </Text>
            <Text style={styles.emptySubtext}>
              Pull down to refresh
            </Text>
          </View>
        ) : (
          displayFixtures.map((match) => renderMatch(match))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },

  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#2563eb', fontSize: 16 },

  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  tabDateActive: {
    color: '#dbeafe',
  },

  liveCountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  liveCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803d',
  },

  scrollView: {
    flex: 1,
  },

  loader: {
    marginTop: 40,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
  },

  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 0.5,
  },

  matchTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },

  matchContent: {
    gap: 10,
  },

  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },

  score: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6b7280',
    minWidth: 30,
    textAlign: 'center',
  },
  scoreLive: {
    color: '#16a34a',
  },
  scoreFinished: {
    color: '#111827',
  },

  statusText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});