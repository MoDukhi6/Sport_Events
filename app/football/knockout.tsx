// app/football/knockout.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../constants/api';

// Knockout round names for Champions League
const KNOCKOUT_ROUNDS = [
  { name: 'Round of 16', key: 'Round of 16' },
  { name: 'Quarter-finals', key: 'Quarter-finals' },
  { name: 'Semi-finals', key: 'Semi-finals' },
  { name: 'Final', key: 'Final' },
];

type Match = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
};

export default function KnockoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ league?: string; name?: string; season?: string }>();

  const league = params.league ? Number(params.league) : 2;
  const leagueName = params.name ?? 'Champions League';
  const season = params.season ? Number(params.season) : 2023;

  const [selectedRound, setSelectedRound] = useState<string>('Round of 16');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      setErrorText(null);
      try {
        console.log(`Loading ${selectedRound} matches for Champions League ${season}`);
        
        const url = `${API_BASE_URL}/api/football/fixtures/round?league=${league}&season=${season}&round=${encodeURIComponent(selectedRound)}`;
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Failed to load matches');
        }
        
        const data = await res.json();
        console.log(`✅ Found ${data.length} matches for ${selectedRound}`);
        
        setMatches(data);
        
        if (data.length === 0) {
          setErrorText(`No matches found for ${selectedRound}`);
        }
      } catch (err) {
        console.error('Knockout matches error:', err);
        setMatches([]);
        setErrorText('Failed to load knockout matches.');
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, [league, season, selectedRound]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const renderMatch = (match: Match, index: number) => {
    const isFinished = match.fixture.status.short === 'FT';
    const homeGoals = match.goals.home ?? '-';
    const awayGoals = match.goals.away ?? '-';

    return (
      <View key={match.fixture.id} style={styles.matchCard}>
        <Text style={styles.matchDate}>{formatDate(match.fixture.date)}</Text>
        
        <View style={styles.matchContent}>
          {/* Home Team */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{match.teams.home.name}</Text>
          </View>
          
          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={[styles.score, isFinished && styles.scoreFinished]}>
              {homeGoals} - {awayGoals}
            </Text>
            <Text style={styles.status}>{match.fixture.status.long}</Text>
          </View>
          
          {/* Away Team */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{match.teams.away.name}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>{leagueName} Knockout Stage</Text>
      <Text style={styles.subtitle}>{season}/{String(season + 1).slice(-2)} Season</Text>

      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹ Back to Groups</Text>
      </Pressable>

      {/* Round selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.roundScroll}
        contentContainerStyle={styles.roundScrollContent}
      >
        {KNOCKOUT_ROUNDS.map((round) => (
          <Pressable
            key={round.key}
            onPress={() => setSelectedRound(round.key)}
            style={[
              styles.roundChip,
              selectedRound === round.key && styles.roundChipActive,
            ]}
          >
            <Text
              style={[
                styles.roundChipText,
                selectedRound === round.key && styles.roundChipTextActive,
              ]}
            >
              {round.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Matches */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
      ) : errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          {matches.map((match, index) => renderMatch(match, index))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 12 },

  backBtn: { alignSelf: 'flex-start', marginBottom: 12 },
  backText: { color: '#2563eb', fontSize: 16 },

  roundScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  roundScrollContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  roundChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  roundChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roundChipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  roundChipTextActive: { color: '#fff' },

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

  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  matchDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },

  matchContent: {
    flexDirection: 'column',
    gap: 8,
  },

  teamContainer: {
    alignItems: 'center',
  },

  teamName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },

  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },

  score: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6b7280',
  },

  scoreFinished: {
    color: '#059669',
  },

  status: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
});