// app/leagues/leaguesPage.tsx
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

const leagues = [
  { id: '1251', name: 'Premier League' },
  { id: '1404', name: 'La Liga' },
  // add whatever league ids you want (use the real SportMonks league IDs)
];

export default function LeaguesPage() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Select a League</Text>

      <FlatList
        data={leagues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/leagues/${item.id}`)}
            style={{
              padding: 12,
              marginBottom: 10,
              borderRadius: 8,
              backgroundColor: '#f2f2f2',
            }}
          >
            <Text style={{ fontSize: 18 }}>{item.name}</Text>
            <Text style={{ color: '#666' }}>ID: {item.id}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}