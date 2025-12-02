// app/football/leagues.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const FOOTBALL_LEAGUES = [
  { id: 39,  name: 'Premier League' },
  { id: 140, name: 'La Liga' },
  { id: 135, name: 'Serie A' },
  { id: 78,  name: 'Bundesliga' },
  { id: 61,  name: 'Ligue 1' },
  { id: 2,   name: 'Champions League' },
];

export default function FootballLeaguesScreen() {
  const router = useRouter();

  const handlePressLeague = (leagueId: number, name: string) => {
    router.push({
      pathname: '/football/league',
      params: { leagueId: String(leagueId), name },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back to Sports</Text>
      </Pressable>

      <Text style={styles.title}>Select a League</Text>

      <FlatList
        data={FOOTBALL_LEAGUES}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => handlePressLeague(item.id, item.name)}
          >
            <Text style={styles.label}>{item.name}</Text>
          </Pressable>
        )}
      />
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
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    width: '48%',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  label: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
});