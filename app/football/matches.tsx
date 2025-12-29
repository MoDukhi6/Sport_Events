// app/football/matches.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import PredictionModal from '../prediction/PredictionModal';
import ScorePredictionModal from '../prediction/ScorePredictionModal';

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
  const [userPredictions, setUserPredictions] = useState<Set<string>>(new Set());
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // AI Prediction modal state
  const [showPrediction, setShowPrediction] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{id: string, name: string} | null>(null);

  // Score prediction modal state
  const [showScorePrediction, setShowScorePrediction] = useState(false);
  const [selectedMatchForPrediction, setSelectedMatchForPrediction] = useState<{
    id: string;
    homeTeam: { id: number; name: string };
    awayTeam: { id: number; name: string };
    date: string;
  } | null>(null);

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

  // Load user predictions
  const loadUserPredictions = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const response = await fetch(`${API_BASE_URL}/api/user-predictions/user/${user._id}`);
      
      if (response.ok) {
        const predictions = await response.json();
        const matchIds = new Set<string>(predictions.map((p: any) => String(p.matchId)));
        setUserPredictions(matchIds);
      }
    } catch (err) {
      console.error('Error loading user predictions:', err);
    }
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

  useEffect(() => {
    loadUserPredictions();
  }, []);

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

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (date && event.type !== 'dismissed') {
        setCustomDate(date);
        setSelectedTab('custom');
      }
    } else {
      // iOS - just update the selected date
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const handleDateConfirm = () => {
    setCustomDate(selectedDate);
    setSelectedTab('custom');
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    if (Platform.OS === 'web') {
      // On web, create a native HTML date input
      const input = document.createElement('input');
      input.type = 'date';
      input.value = formatDateToString(customDate);
      input.max = '2026-12-31';
      input.min = '2024-01-01';
      input.style.position = 'absolute';
      input.style.opacity = '0';
      document.body.appendChild(input);
      
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          const newDate = new Date(target.value);
          setCustomDate(newDate);
          setSelectedTab('custom');
        }
        document.body.removeChild(input);
      };
      
      input.onblur = () => {
        setTimeout(() => {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        }, 100);
      };
      
      input.click();
    } else {
      // Native (iOS/Android)
      setSelectedDate(customDate);
      setShowDatePicker(true);
    }
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
    const hasUserPredicted = userPredictions.has(matchId);

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

        {/* Book Seats & Prediction Buttons - Only show for upcoming matches */}
        {isNotStarted && (
          <View style={styles.bookingButtonsContainer}>
            {/* First Row: Booking Buttons */}
            <View style={styles.bookingRow}>
              <Pressable
                style={styles.bookButtonWide}
                onPress={() => router.push(`/booking/recommendations?matchId=${matchId}&matchName=${encodeURIComponent(matchName)}&matchDate=${encodeURIComponent(matchDate)}`)}
              >
                <Text style={styles.bookButtonIcon}>🤖</Text>
                <Text style={styles.bookButtonText}>AI Seat Picks</Text>
              </Pressable>

              <Pressable
                style={[styles.bookButtonWide, styles.bookButtonSecondaryWide]}
                onPress={() => router.push(`/booking/seat-map?matchId=${matchId}&matchName=${encodeURIComponent(matchName)}&matchDate=${encodeURIComponent(matchDate)}`)}
              >
                <Text style={styles.bookButtonIcon}>🗺️</Text>
                <Text style={styles.bookButtonTextSecondary}>Stadium Map</Text>
              </Pressable>
            </View>

            {/* Second Row: Prediction Buttons */}
            <View style={styles.predictionRow}>
              <Pressable
                style={[
                  styles.bookButtonWide,
                  styles.bookButtonGame,
                  hasUserPredicted && { opacity: 0.6 }
                ]}
                onPress={() => {
                  // Check if already predicted
                  if (hasUserPredicted) {
                    Alert.alert(
                      'Already Predicted',
                      'You have already made a prediction for this match. You cannot change your prediction.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }

                  setSelectedMatchForPrediction({
                    id: matchId,
                    homeTeam: { id: match.teams.home.id, name: match.teams.home.name },
                    awayTeam: { id: match.teams.away.id, name: match.teams.away.name },
                    date: matchDate,
                  });
                  setShowScorePrediction(true);
                }}
              >
                <Text style={styles.bookButtonIcon}>
                  {hasUserPredicted ? '✓' : '🎮'}
                </Text>
                <Text style={styles.bookButtonTextGame}>
                  {hasUserPredicted ? 'Predicted' : 'Predict Score'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.bookButtonWide, styles.bookButtonPrediction]}
                onPress={() => {
                  setSelectedMatch({ id: matchId, name: matchName });
                  setShowPrediction(true);
                }}
              >
                <Text style={styles.bookButtonIcon}>📊</Text>
                <Text style={styles.bookButtonTextPrediction}>ML Analysis</Text>
              </Pressable>
            </View>
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

        {/* Date Picker Modal for iOS */}
        {Platform.OS === 'ios' && (
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerModal}>
                <View style={styles.datePickerHeader}>
                  <Pressable onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </Pressable>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <Pressable onPress={handleDateConfirm}>
                    <Text style={styles.datePickerDone}>Done</Text>
                  </Pressable>
                </View>
                
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date(2026, 11, 31)}
                  minimumDate={new Date(2024, 0, 1)}
                  textColor="#000000"
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Date Picker for Android */}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={customDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date(2026, 11, 31)}
            minimumDate={new Date(2024, 0, 1)}
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

        {/* AI Prediction Modal */}
        {showPrediction && selectedMatch && (
          <PredictionModal
            visible={showPrediction}
            matchId={selectedMatch.id}
            matchName={selectedMatch.name}
            onClose={() => {
              setShowPrediction(false);
              setSelectedMatch(null);
            }}
          />
        )}

        {/* Score Prediction Modal */}
        {showScorePrediction && selectedMatchForPrediction && (
          <ScorePredictionModal
            visible={showScorePrediction}
            matchId={selectedMatchForPrediction.id}
            homeTeam={selectedMatchForPrediction.homeTeam}
            awayTeam={selectedMatchForPrediction.awayTeam}
            matchDate={selectedMatchForPrediction.date}
            onClose={() => {
              setShowScorePrediction(false);
              setSelectedMatchForPrediction(null);
            }}
            onSuccess={() => {
              console.log('🎉 Prediction submitted successfully!');
              loadUserPredictions(); // Reload predictions to update button
            }}
          />
        )}
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

  // iOS Date Picker Modal Styles
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  datePickerCancel: {
    fontSize: 17,
    color: '#ef4444',
  },
  datePickerDone: {
    fontSize: 17,
    color: '#2563eb',
    fontWeight: '600',
  },
  dateTimePicker: {
    height: 216,
    backgroundColor: '#fff',
    width: '100%',
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

  // NEW: 2-Row Button Layout
  bookingButtonsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  bookingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bookButtonWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  bookButtonSecondaryWide: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  bookButtonGame: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  bookButtonPrediction: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f59e0b',
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
  bookButtonTextGame: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  bookButtonTextPrediction: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '700',
  },
});