// app/football/standings.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getLeagueStandings, type LeagueStandings } from '../api/football-api';

const AVAILABLE_SEASONS = [2025, 2024, 2023, 2022];

export default function StandingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ league?: string; name?: string }>();

  const selectedLeague = params.league ? Number(params.league) : 39;
  const leagueName = params.name ?? 'Premier League';
  const isChampionsLeague = selectedLeague === 2;

  const [selectedSeason, setSelectedSeason] = useState<number>(2025);
  const [standings, setStandings] = useState<LeagueStandings | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorText(null);
      try {
        console.log(`Loading standings for league ${selectedLeague}, season ${selectedSeason}`);
        const data = await getLeagueStandings(selectedLeague, selectedSeason);

        if (!data || !data.standings || data.standings.length === 0) {
          setStandings(null);
          setErrorText(`No standings data for ${selectedSeason} season.`);
        } else {
          setStandings(data);
          console.log(`✅ Loaded ${data.standings.length} groups/tables`);
        }
      } catch (err) {
        console.error('standings load error', err);
        setStandings(null);
        setErrorText('Failed to load standings. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [selectedLeague, selectedSeason]);

  const renderStandingsTable = (table: any[], groupIndex: number) => {
    const groupLetter = String.fromCharCode(65 + groupIndex);

    return (
      <View key={groupIndex} style={styles.tableContainer}>
        {isChampionsLeague && (
          <Text style={styles.groupTitle}>Group {groupLetter}</Text>
        )}

        <View style={styles.tableWrapper}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, styles.colRank]}>#</Text>
            <Text style={[styles.cell, styles.colTeam]}>Team</Text>
            <Text style={[styles.cell, styles.colSmall]}>P</Text>
            <Text style={[styles.cell, styles.colSmall]}>W</Text>
            <Text style={[styles.cell, styles.colSmall]}>D</Text>
            <Text style={[styles.cell, styles.colSmall]}>L</Text>
            <Text style={[styles.cell, styles.colMedium]}>F/A</Text>
            <Text style={[styles.cell, styles.colSmall]}>Pts</Text>
          </View>

          {table.map((item) => (
            <View key={item.team.id} style={styles.row}>
              <Text style={[styles.cell, styles.colRank]}>{item.rank}</Text>
              <Text style={[styles.cell, styles.colTeam]}>
                {item.team.name}
              </Text>
              <Text style={[styles.cell, styles.colSmall]}>
                {item.all.played}
              </Text>
              <Text style={[styles.cell, styles.colSmall]}>
                {item.all.win}
              </Text>
              <Text style={[styles.cell, styles.colSmall]}>
                {item.all.draw}
              </Text>
              <Text style={[styles.cell, styles.colSmall]}>
                {item.all.lose}
              </Text>
              <Text style={[styles.cell, styles.colMedium]}>
                {item.all.goals.for}/{item.all.goals.against}
              </Text>
              <Text style={[styles.cell, styles.colSmall]}>
                {item.points}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const handleViewKnockoutRounds = () => {
    router.push({
      pathname: '/football/knockout',
      params: {
        league: selectedLeague,
        name: leagueName,
        season: selectedSeason,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{leagueName} Standings</Text>

        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.seasonRow}>
          {AVAILABLE_SEASONS.map((season) => (
            <Pressable
              key={season}
              onPress={() => setSelectedSeason(season)}
              style={[
                styles.seasonChip,
                selectedSeason === season && styles.seasonChipActive,
              ]}
            >
              <Text
                style={[
                  styles.seasonChipText,
                  selectedSeason === season && styles.seasonChipTextActive,
                ]}
              >
                {season}/{String(season + 1).slice(-2)}
              </Text>
            </Pressable>
          ))}
        </View>

        {isChampionsLeague && !loading && standings && (
          <Pressable
            style={styles.knockoutButton}
            onPress={handleViewKnockoutRounds}
          >
            <Text style={styles.knockoutButtonText}>🏆 View Knockout Rounds</Text>
            <Text style={styles.knockoutButtonSubtext}>
              Round of 16 • Quarter-Finals • Semi-Finals • Final
            </Text>
          </Pressable>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : errorText ? (
          <Text style={styles.errorText}>{errorText}</Text>
        ) : standings && standings.standings && standings.standings.length > 0 ? (
          <ScrollView style={styles.scrollView}>
            {standings.standings.map((table, index) =>
              table && table.length > 0 ? renderStandingsTable(table, index) : null
            )}
          </ScrollView>
        ) : (
          <Text style={styles.errorText}>No standings data available.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 8, // 👈 moves content below Dynamic Island
  },
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: '#2563eb', fontSize: 16 },
  seasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 8,
    justifyContent: 'center',
  },
  seasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  seasonChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  seasonChipText: { fontSize: 14, fontWeight: '600', color: '#333' },
  seasonChipTextActive: { color: '#fff' },
  knockoutButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  knockoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  knockoutButtonSubtext: {
    color: '#d1fae5',
    fontSize: 11,
    marginTop: 4,
  },
  loader: {
    marginTop: 40,
  },
  errorText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  tableContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerRow: {
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    backgroundColor: '#f9fafb',
  },
  cell: { fontSize: 12, textAlign: 'center' },
  colRank: { width: 28, fontWeight: '600' },
  colTeam: { flex: 1, textAlign: 'left', paddingLeft: 8 },
  colSmall: { width: 32 },
  colMedium: { width: 60 },
});
