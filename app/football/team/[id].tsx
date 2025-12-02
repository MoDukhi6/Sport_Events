// app/football/team/[id].tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { getTeamById } from '../../api/football-api';

export default function TeamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await getTeamById(Number(id));
        setTeam(data);
      } catch (e) {
        console.warn('Error loading team', e);
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

  if (!team) {
    return (
      <View style={styles.center}>
        <Text>Team not found.</Text>
      </View>
    );
  }

  const t = team.team || team; // depending on how backend returns it

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.name}>{t.name}</Text>
      <Text style={styles.meta}>{t.country}</Text>
      {t.founded && <Text style={styles.meta}>Founded: {t.founded}</Text>}
      {t.venue && <Text style={styles.meta}>Stadium: {t.venue.name}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginBottom: 8 },
  backText: { color: '#2563eb' },

  name: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  meta: { fontSize: 14, color: '#555', marginBottom: 4 },
});
