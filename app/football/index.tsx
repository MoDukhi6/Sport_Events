// app/football/index.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    getLiveMatches,
    getTodayFixtures,
    type Fixture,
} from '../api/football-api';

export default function FootballDashboard() {
  const router = useRouter();

  const [live, setLive] = useState<Fixture[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [loadingFixtures, setLoadingFixtures] = useState(true);

  // Load live matches
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingLive(true);
        const data = await getLiveMatches();
        setLive(data || []);
      } catch (e) {
        console.warn('Error loading live matches', e);
      } finally {
        setLoadingLive(false);
      }
    };
    load();
  }, []);

  // Load today fixtures
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingFixtures(true);
        const data = await getTodayFixtures();
        setFixtures(data || []);
      } catch (e) {
        console.warn('Error loading fixtures', e);
      } finally {
        setLoadingFixtures(false);
      }
    };
    load();
  }, []);

  const openMatch = (fixtureId: number) => {
    router.push({
      pathname: '/football/match/[id]',
      params: { id: String(fixtureId) } as any,
    });
  };

  const openStandings = () => {
    router.push('/football/standings' as any);
  };

  const openTeamSearch = () => {
    router.push('/football/search-teams' as any);
  };

  const renderFixtureCard = (item: Fixture) => (
    <Pressable
      key={item.fixture.id}
      style={styles.matchCard}
      onPress={() => openMatch(item.fixture.id)}
    >
      <Text style={styles.leagueName}>
        {item.league.name} • {item.league.country}
      </Text>
      <View style={styles.teamsRow}>
        <Text style={styles.teamName}>{item.teams.home.name}</Text>
        <Text style={styles.scoreText}>
          {item.goals.home ?? '-'} : {item.goals.away ?? '-'}
        </Text>
        <Text style={styles.teamName}>{item.teams.away.name}</Text>
      </View>
      <Text style={styles.statusText}>{item.fixture.status.short}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Football</Text>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <Pressable style={styles.actionBtn} onPress={openStandings}>
          <Text style={styles.actionTitle}>League Standings</Text>
          <Text style={styles.actionSubtitle}>Premier League, La Liga…</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={openTeamSearch}>
          <Text style={styles.actionTitle}>Search Teams</Text>
          <Text style={styles.actionSubtitle}>Find club profiles</Text>
        </Pressable>
      </View>

      {/* Live matches */}
      <Text style={styles.sectionTitle}>Live Matches</Text>
      {loadingLive ? (
        <ActivityIndicator />
      ) : live.length === 0 ? (
        <Text style={styles.emptyText}>No live matches right now</Text>
      ) : (
        <FlatList
          data={live}
          horizontal
          keyExtractor={(item) => String(item.fixture.id)}
          renderItem={({ item }) => renderFixtureCard(item)}
          showsHorizontalScrollIndicator={false}
        />
      )}

      {/* Today fixtures */}
      <Text style={styles.sectionTitle}>Today&apos;s Fixtures</Text>
      {loadingFixtures ? (
        <ActivityIndicator />
      ) : fixtures.length === 0 ? (
        <Text style={styles.emptyText}>No fixtures found for today.</Text>
      ) : (
        <FlatList
          data={fixtures}
          keyExtractor={(item) => String(item.fixture.id)}
          renderItem={({ item }) => renderFixtureCard(item)}
          scrollEnabled={false} // let outer ScrollView handle scroll
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: { color: '#666', marginBottom: 8 },

  matchCard: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    marginBottom: 12,
  },
  leagueName: { fontSize: 12, color: '#666', marginBottom: 4 },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamName: { fontSize: 14, fontWeight: '600', flex: 1 },
  scoreText: { fontSize: 16, fontWeight: '700', marginHorizontal: 8 },
  statusText: { fontSize: 12, color: '#999', marginTop: 4 },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  actionTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  actionSubtitle: {
    color: '#d1d5db',
    fontSize: 12,
  },
});
