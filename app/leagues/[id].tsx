/*// app/league/[id].tsx
import React from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFetchEvents } from '../../hooks/useFetchEvents';

export default function LeagueEventsPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { events, loading, error } = useFetchEvents(id);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: 12 }}>
        <Text style={{ color: '#007AFF' }}>← Back</Text>
      </Pressable>

      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 12 }}>
        League {id} — Upcoming Fixtures
      </Text>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={{ color: 'red' }}>Error: {error}</Text>
      ) : events.length === 0 ? (
        <Text>No upcoming matches found for this league.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            // sportmonks fixture object may contain home/away team objects if included; guard for missing properties
            const home = item.home_team?.data?.name || item.home_team?.name || item.localteam?.data?.name || 'Home';
            const away = item.away_team?.data?.name || item.away_team?.name || item.visitorteam?.data?.name || 'Away';
            const dt = item.starting_at || item.time || item.date || null;
            return (
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontWeight: '600' }}>{home} vs {away}</Text>
                <Text style={{ color: '#555', marginTop: 4 }}>
                  {dt ? new Date(dt).toLocaleString() : 'Date unavailable'}
                </Text>
                {item.venue?.data?.name ? <Text style={{ color: '#666', marginTop: 4 }}>Venue: {item.venue.data.name}</Text> : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}


*/