// app/football/matches.tsx
import { API_BASE_URL } from '@/constants/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Fixture } from '../api/football-api';

type TabType = 'yesterday' | 'today' | 'tomorrow' | 'custom';

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
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());

  // --- helpers for dates ---
  const getDate = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  };

  const formatDateToString = (date: Date): string => {
    return date.toISOString().slice(0, 10);
  };

  const dates = {
    yesterday: getDate(-1),
    today: getDate(0),
    tomorrow: getDate(1),
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // --- load fixtures ---
  const loadFixtures = async () => {
    if (!numericLeagueId) return;

    setLoading(true);
    try {
      let dateToFetch: string;

      if (selectedTab === 'custom') {
        dateToFetch = formatDateToString(customDate);
      } else {
        dateToFetch = dates[selectedTab];
      }

      console.log(`Loading fixtures for ${selectedTab}: ${dateToFetch}`);

      const response = await fetch(
        `${API_BASE_URL}/api/football/fixtures/today?date=${dateToFetch}&leagues=${numericLeagueId}`
      );
      const data: Fixture[] = await response.json();

      // Remove duplicates by fixture.id
      const uniqueMap = new Map<number, Fixture>();
      for (const f of data) {
        if (!uniqueMap.has(f.fixture.id)) {
          uniqueMap.set(f.fixture.id, f);
        }
      }
      const uniqueFixtures = Array.from(uniqueMap.values());

      console.log(
        `Raw fixtures: ${data.length}, unique by fixture.id: ${uniqueFixtures.length}`
      );

      setFixtures(uniqueFixtures);

      // live matches based on unique list
      const live = uniqueFixtures.filter(
        (f) =>
          f.fixture.status.short === '1H' ||
          f.fixture.status.short === '2H' ||
          f.fixture.status.short === 'HT' ||
          f.fixture.status.short === 'ET' ||
          f.fixture.status.short === 'P'
      );
      setLiveMatches(live);
    } catch (err) {
      console.error('Error loading fixtures:', err);
      setFixtures([]);
      setLiveMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFixtures();
  }, [selectedTab, numericLeagueId, customDate]);

  // auto-refresh live matches every 30s on "today" tab
  useEffect(() => {
    if (selectedTab !== 'today') return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing live matches...');
      loadFixtures();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedTab, numericLeagueId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFixtures();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    
    if (selectedDate) {
      setCustomDate(selectedDate);
      setSelectedTab('custom');
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  // --- render a single match card ---
  const renderMatch = (match: Fixture, index: number) => {
    const short = match.fixture.status.short;

    const isLive =
      short === '1H' ||
      short === '2H' ||
      short === 'HT' ||
      short === 'ET' ||
      short === 'P';

    const isFinished =
      short === 'FT' ||
      short === 'AET' ||
      short === 'PEN';

    const isNotStarted =
      short === 'NS' ||
      short === 'TBD';

    const homeGoals = match.goals.home ?? '-';
    const awayGoals = match.goals.away ?? '-';

    const statusLabel = isNotStarted
      ? formatTime(match.fixture.date)
      : match.fixture.status.long;

    const matchName = `${match.teams.home.name} vs ${match.teams.away.name}`;
    const matchId = match.fixture.id.toString();
    const matchDate = match.fixture.date;

    return (
      <View
        key={`match-${match.fixture.id}-${index}`}
        style={styles.matchCard}
      >
        {/* LIVE badge */}
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        {/* time / status */}
        <Text style={styles.matchTime}>{statusLabel}</Text>

        {/* main row: Home 2 - 1 Away */}
        <View style={styles.matchMainRow}>
          <Text style={styles.teamNameLeft}>{match.teams.home.name}</Text>

          <View style={styles.scoreCenter}>
            <Text
              style={[
                styles.scoreNumber,
                isLive && styles.scoreLive,
                isFinished && styles.scoreFinished,
              ]}
            >
              {homeGoals}
            </Text>
            <Text style={styles.scoreDash}>-</Text>
            <Text
              style={[
                styles.scoreNumber,
                isLive && styles.scoreLive,
                isFinished && styles.scoreFinished,
              ]}
            >
              {awayGoals}
            </Text>
          </View>

          <Text style={styles.teamNameRight}>{match.teams.away.name}</Text>
        </View>

        {/* extra live info */}
        {isLive && (
          <Text style={styles.statusText}>
            {match.fixture.status.elapsed}' • {match.fixture.status.long}
          </Text>
        )}

        {/* Book Seats Buttons - Only show for upcoming matches */}
        {isNotStarted && (
          <View style={styles.bookingButtons}>
            <Pressable
              style={styles.bookButton}
              onPress={() => router.push(`/booking/recommendations?matchId=${matchId}&matchName=${encodeURIComponent(matchName)}&matchDate=${encodeURIComponent(matchDate)}`)}
            >
              <Text style={styles.bookButtonIcon}>🤖</Text>
              <Text style={styles.bookButtonText}>AI Picks</Text>
            </Pressable>

            <Pressable
              style={[styles.bookButton, styles.bookButtonSecondary]}
              onPress={() => router.push(`/booking/seat-map?matchId=${matchId}&matchName=${encodeURIComponent(matchName)}&matchDate=${encodeURIComponent(matchDate)}`)}
            >
              <Text style={styles.bookButtonIcon}>🗺️</Text>
              <Text style={styles.bookButtonTextSecondary}>Seat Map</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const displayFixtures = fixtures;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* header */}
        <Text style={styles.title}>{leagueName} Matches</Text>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        {/* tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, selectedTab === 'yesterday' && styles.tabActive]}
            onPress={() => setSelectedTab('yesterday')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'yesterday' && styles.tabTextActive,
              ]}
            >
              Yesterday
            </Text>
            <Text
              style={[
                styles.tabDate,
                selectedTab === 'yesterday' && styles.tabDateActive,
              ]}
            >
              {formatDate(dates.yesterday)}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, selectedTab === 'today' && styles.tabActive]}
            onPress={() => setSelectedTab('today')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'today' && styles.tabTextActive,
              ]}
            >
              Today
            </Text>
            <Text
              style={[
                styles.tabDate,
                selectedTab === 'today' && styles.tabDateActive,
              ]}
            >
              {formatDate(dates.today)}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, selectedTab === 'tomorrow' && styles.tabActive]}
            onPress={() => setSelectedTab('tomorrow')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'tomorrow' && styles.tabTextActive,
              ]}
            >
              Tomorrow
            </Text>
            <Text
              style={[
                styles.tabDate,
                selectedTab === 'tomorrow' && styles.tabDateActive,
              ]}
            >
              {formatDate(dates.tomorrow)}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, selectedTab === 'custom' && styles.tabActive]}
            onPress={openDatePicker}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'custom' && styles.tabTextActive,
              ]}
            >
              📅 Pick Date
            </Text>
            {selectedTab === 'custom' && (
              <Text
                style={[
                  styles.tabDate,
                  selectedTab === 'custom' && styles.tabDateActive,
                ]}
              >
                {formatDate(formatDateToString(customDate))}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={customDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date(2026, 11, 31)} // End of 2026
            minimumDate={new Date(2024, 0, 1)} // Start of 2024
          />
        )}

        {/* live count banner */}
        {selectedTab === 'today' && liveMatches.length > 0 && (
          <View style={styles.liveCountBanner}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveCountText}>
              {liveMatches.length} live{' '}
              {liveMatches.length === 1 ? 'match' : 'matches'}
            </Text>
          </View>
        )}

        {/* list */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#2563eb"
              style={styles.loader}
            />
          ) : displayFixtures.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No matches found for {selectedTab === 'custom' ? formatDate(formatDateToString(customDate)) : selectedTab}
              </Text>
              <Text style={styles.emptySubtext}>Pull down to refresh</Text>
            </View>
          ) : (
            displayFixtures.map((match, index) => renderMatch(match, index))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },

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

  matchMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  teamNameLeft: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  teamNameRight: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
  },
  scoreCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6b7280',
    minWidth: 24,
    textAlign: 'center',
  },
  scoreDash: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
    marginHorizontal: 4,
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

  bookingButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  bookButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  bookButtonIcon: {
    fontSize: 16,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bookButtonTextSecondary: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
});