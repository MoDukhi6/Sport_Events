import useFetchEvents from '@/hooks/useFetchEvents';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';

export default function LeagueEventsPage() {
  const { id } = useLocalSearchParams<{ id: string }>(); // read the league ID from the URL
  const { events, loading, error } = useFetchEvents(id);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (error) return <Text>Error: {error}</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>
        League {id} – Upcoming Fixtures
      </Text>
      {events.length === 0 ? (
        <Text>No upcoming matches found.</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 10, borderBottomWidth: 1 }}>
              <Text style={{ fontWeight: 'bold' }}>
                {item.name || `${item.home_team?.name} vs ${item.away_team?.name}`}
              </Text>
              <Text>{new Date(item.starting_at).toLocaleString()}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}