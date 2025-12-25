// app/game/my-predictions.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Prediction = {
  _id: string;
  matchId: string;
  homeTeam: {
    name: string;
    id: number;
  };
  awayTeam: {
    name: string;
    id: number;
  };
  predictedHomeGoals: number;
  predictedAwayGoals: number;
  actualHomeGoals: number | null;
  actualAwayGoals: number | null;
  pointsEarned: number;
  status: 'pending' | 'correct_score' | 'correct_winner' | 'wrong';
  matchDate: string;
  createdAt: string;
};

export default function MyPredictionsScreen() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'scored'>('all');

  useEffect(() => {
    loadPredictions();
  }, [filter]);

  const loadPredictions = async () => {
    try {
      setLoading(true);

      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);

      const url = filter === 'all'
        ? `${API_BASE_URL}/api/user-predictions/user/${user._id}`
        : `${API_BASE_URL}/api/user-predictions/user/${user._id}?status=${filter === 'pending' ? 'pending' : 'correct_score,correct_winner,wrong'}`;

      const response = await fetch(url);
      const data = await response.json();

      setPredictions(data);
    } catch (err) {
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPredictions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct_score':
        return '#10b981';
      case 'correct_winner':
        return '#3b82f6';
      case 'wrong':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'correct_score':
        return 'Perfect! +3';
      case 'correct_winner':
        return 'Correct Winner +1';
      case 'wrong':
        return 'Wrong';
      default:
        return 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPrediction = (pred: Prediction) => {
    const isPending = pred.status === 'pending';

    return (
      <View key={pred._id} style={styles.predictionCard}>
        {/* Date */}
        <Text style={styles.matchDate}>{formatDate(pred.matchDate)}</Text>

        {/* Teams */}
        <View style={styles.teamsRow}>
          <Text style={styles.teamName}>{pred.homeTeam.name}</Text>
          <Text style={styles.vs}>vs</Text>
          <Text style={styles.teamName}>{pred.awayTeam.name}</Text>
        </View>

        {/* Prediction */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>Your Prediction</Text>
            <Text style={styles.scoreText}>
              {pred.predictedHomeGoals} - {pred.predictedAwayGoals}
            </Text>
          </View>

          {!isPending && (
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Actual Score</Text>
              <Text style={styles.scoreText}>
                {pred.actualHomeGoals} - {pred.actualAwayGoals}
              </Text>
            </View>
          )}
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pred.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(pred.status) }]}>
            {getStatusText(pred.status)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>My Predictions</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <Pressable
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>
              Pending
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterTab, filter === 'scored' && styles.filterTabActive]}
            onPress={() => setFilter('scored')}
          >
            <Text style={[styles.filterText, filter === 'scored' && styles.filterTextActive]}>
              Scored
            </Text>
          </Pressable>
        </View>

        {/* List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
          ) : predictions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎮</Text>
              <Text style={styles.emptyText}>No predictions yet</Text>
              <Text style={styles.emptySubtext}>
                Start predicting match scores to earn points!
              </Text>
            </View>
          ) : (
            predictions.map(renderPrediction)
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  filterTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  predictionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  matchDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  vs: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
});