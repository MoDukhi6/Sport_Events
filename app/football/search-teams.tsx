// app/football/search-teams.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { searchTeams } from '../api/football-api';

type TeamResult = {
  team: { id: number; name: string; country: string; logo: string };
};

export default function SearchTeamsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TeamResult[]>([]);
  const [loading, setLoading] = useState(false);

  const onSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const data = await searchTeams(query.trim());
      setResults(data || []);
    } catch (e) {
      console.warn('Error searching teams', e);
    } finally {
      setLoading(false);
    }
  };

  const openTeam = (id: number) => {
    router.push({
      pathname: '/football/team/[id]',
      params: { id: String(id) } as any,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Teams</Text>

      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search for a club…"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchBtn} onPress={onSearch}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Go</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.team.id)}
          renderItem={({ item }) => (
            <Pressable
              style={styles.teamRow}
              onPress={() => openTeam(item.team.id)}
            >
              <Text style={styles.teamName}>{item.team.name}</Text>
              <Text style={styles.teamCountry}>{item.team.country}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: '#2563eb' },

  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchBtn: {
    marginLeft: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: '#111827',
  },

  teamRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  teamName: { fontSize: 16, fontWeight: '600' },
  teamCountry: { fontSize: 12, color: '#666' },
});
