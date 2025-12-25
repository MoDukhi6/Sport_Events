// app/game/leaderboard.tsx
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

type LeaderboardEntry = {
  rank: number;
  name: string;
  points: number;
  level: number;
  badge: {
    name: string;
    icon: string;
    color: string;
  };
  predictions: number;
  successRate: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user._id);
      }
    } catch (err) {
      console.error('Error loading current user:', err);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/user-predictions/leaderboard`);
      const data = await response.json();

      setLeaderboard(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#fbbf24'; // Gold
      case 2:
        return '#9ca3af'; // Silver
      case 3:
        return '#d97706'; // Bronze
      default:
        return '#6b7280';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getBadgeStyle = (color: string) => {
    return {
      backgroundColor: color + '20',
      borderColor: color,
    };
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    const isCurrentUser = currentUserId === entry.name; // Note: This would need user ID comparison in real implementation

    return (
      <View
        key={index}
        style={[
          styles.entryCard,
          entry.rank <= 3 && styles.topThreeCard,
          isCurrentUser && styles.currentUserCard,
        ]}
      >
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: getRankColor(entry.rank) + '20' }]}>
          <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
            {getRankIcon(entry.rank)}
          </Text>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{entry.name || 'Unknown'}</Text>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youText}>YOU</Text>
              </View>
            )}
          </View>

          {/* Badge */}
          <View style={[styles.badge, getBadgeStyle(entry.badge.color)]}>
            <Text style={styles.badgeIcon}>{entry.badge.icon}</Text>
            <Text style={[styles.badgeText, { color: entry.badge.color }]}>
              Level {entry.level}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{entry.predictions}</Text>
              <Text style={styles.statLabel}>Predictions</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{entry.successRate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
          </View>
        </View>

        {/* Points */}
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{entry.points}</Text>
          <Text style={styles.pointsLabel}>XP</Text>
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
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerIcon}>⭐</Text>
          <Text style={styles.infoBannerText}>
            Top predictors of the season! Make accurate predictions to climb the ranks.
          </Text>
        </View>

        {/* Leaderboard List */}
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>No rankings yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to make predictions and claim the top spot!
              </Text>
            </View>
          ) : (
            <>
              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <View style={styles.podium}>
                  {/* 2nd Place */}
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumRank, { backgroundColor: '#e5e7eb' }]}>
                      <Text style={styles.podiumRankText}>🥈</Text>
                    </View>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>
                        {(leaderboard[1]?.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.podiumName}>{leaderboard[1]?.name || 'Unknown'}</Text>
                    <Text style={styles.podiumPoints}>{leaderboard[1]?.points || 0} XP</Text>
                  </View>

                  {/* 1st Place */}
                  <View style={[styles.podiumItem, styles.podiumFirst]}>
                    <View style={[styles.podiumRank, { backgroundColor: '#fef3c7' }]}>
                      <Text style={styles.podiumRankText}>🥇</Text>
                    </View>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                      <Text style={styles.podiumAvatarText}>
                        {(leaderboard[0]?.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.podiumName}>{leaderboard[0]?.name || 'Unknown'}</Text>
                    <Text style={styles.podiumPoints}>{leaderboard[0]?.points || 0} XP</Text>
                  </View>

                  {/* 3rd Place */}
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumRank, { backgroundColor: '#fed7aa' }]}>
                      <Text style={styles.podiumRankText}>🥉</Text>
                    </View>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>
                        {(leaderboard[2]?.name || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.podiumName}>{leaderboard[2]?.name || 'Unknown'}</Text>
                    <Text style={styles.podiumPoints}>{leaderboard[2]?.points || 0} XP</Text>
                  </View>
                </View>
              )}

              {/* Full List */}
              <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Full Rankings</Text>
                {leaderboard.map(renderLeaderboardEntry)}
              </View>
            </>
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoBannerIcon: {
    fontSize: 20,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
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
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 24,
    gap: 12,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  podiumFirst: {
    marginBottom: 20,
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  podiumRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  podiumRankText: {
    fontSize: 20,
  },
  podiumAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatarFirst: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f59e0b',
  },
  listContainer: {
    padding: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  topThreeCard: {
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  currentUserCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  youBadge: {
    backgroundColor: '#2563eb',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  youText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
});