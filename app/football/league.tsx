// app/football/league.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function LeagueHubScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    leagueId?: string;
    name?: string;
  }>();

  const leagueId = params.leagueId ?? '39';
  const leagueName = params.name ?? 'Premier League';

  const goToStandings = () => {
    router.push({
      pathname: '/football/standings',
      params: { league: leagueId, name: leagueName },
    });
  };

  const goToMatches = () => {
    router.push({
      pathname: '/football/matches',
      params: { league: leagueId, name: leagueName },
    });
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back to Leagues</Text>
      </Pressable>

      <Text style={styles.title}>{leagueName}</Text>

      <View style={styles.row}>
        <Pressable style={styles.card} onPress={goToStandings}>
          <Text style={styles.cardTitle}>Standings</Text>
          <Text style={styles.cardSubtitle}>Current & past seasons</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={goToMatches}>
          <Text style={styles.cardTitle}>Matches</Text>
          <Text style={styles.cardSubtitle}>Live & fixtures</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 60, backgroundColor: '#fff' },
  
  backBtn: { 
    alignSelf: 'flex-start', 
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: { 
    color: '#2563eb', 
    fontSize: 16,
    fontWeight: '600',
  },
  
  title: { fontSize: 26, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cardSubtitle: { color: '#d1d5db', fontSize: 13 },
});