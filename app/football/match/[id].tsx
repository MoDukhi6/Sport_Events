// app/football/match/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getMatchById } from '../../api/football-api';

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await getMatchById(Number(id));
        setMatch(data);
      } catch (e) {
        console.warn('Error loading match', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text>Match not found.</Text>
      </View>
    );
  }

  const { fixture, league, teams, goals } = match;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.leagueText}>
        {league.name} • {league.country}
      </Text>

      <Text style={styles.dateText}>{new Date(fixture.date).toLocaleString()}</Text>

      <View style={styles.scoreBox}>
        <Text style={styles.teamName}>{teams.home.name}</Text>
        <Text style={styles.scoreText}>
          {goals.home ?? '-'} : {goals.away ?? '-'}
        </Text>
        <Text style={styles.teamName}>{teams.away.name}</Text>
      </View>

      <Text style={styles.statusText}>Status: {fixture.status?.long}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginBottom: 8 },
  backText: { color: '#2563eb' },

  leagueText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  dateText: { textAlign: 'center', color: '#666', marginBottom: 16 },

  scoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 24,
  },
  teamName: { fontSize: 18, fontWeight: '600', flex: 1, textAlign: 'center' },
  scoreText: { fontSize: 26, fontWeight: '800' },
  statusText: { textAlign: 'center', color: '#555' },
});
