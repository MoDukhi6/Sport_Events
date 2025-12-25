// app/(tabs)/profile.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type User = {
  _id: string;
  username: string;
  email: string;
  gameStats?: {
    totalPoints: number;
    level: number;
    totalPredictions: number;
    perfectPredictions: number;
    correctWinners: number;
    currentStreak: number;
    longestStreak: number;
  };
  bookings?: Array<{ title: string; date: Date }>;
};

type GameStats = {
  totalPoints: number;
  level: number;
  totalPredictions: number;
  perfectPredictions: number;
  correctWinners: number;
  currentStreak: number;
  longestStreak: number;
  badge: {
    name: string;
    icon: string;
    color: string;
  };
  successRate: number;
  pointsToNextLevel: number;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        await loadGameStats(userData._id);
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadGameStats = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user-predictions/stats/${userId}`);
      if (response.ok) {
        const stats = await response.json();
        setGameStats(stats);
      }
    } catch (err) {
      console.error('Error loading game stats:', err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('user');
            router.replace('/auth/login' as any);
          },
        },
      ]
    );
  };

  const getBadgeStyle = (color: string) => {
    return {
      backgroundColor: color + '20',
      borderColor: color,
    };
  };

  const getBadgeTextStyle = (color: string) => {
    return { color };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please login to view profile</Text>
        <Pressable style={styles.loginButton} onPress={() => router.replace('/auth/login' as any)}>
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  const stats = gameStats || {
    totalPoints: 0,
    level: 1,
    totalPredictions: 0,
    perfectPredictions: 0,
    correctWinners: 0,
    currentStreak: 0,
    longestStreak: 0,
    badge: { name: 'Beginner', icon: '🎮', color: '#10b981' },
    successRate: 0,
    pointsToNextLevel: 20,
  };

  const progressPercentage = ((stats.totalPoints % 20) / 20) * 100;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
            {/* Badge */}
            <View style={[styles.badge, getBadgeStyle(stats.badge.color)]}>
              <Text style={styles.badgeIcon}>{stats.badge.icon}</Text>
              <Text style={[styles.badgeText, getBadgeTextStyle(stats.badge.color)]}>
                {stats.badge.name}
              </Text>
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        {/* Level & XP Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.levelTitle}>Level {stats.level}</Text>
              <Text style={styles.levelSubtitle}>{stats.totalPoints} XP</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>⭐ {stats.totalPoints}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {stats.pointsToNextLevel} XP to Level {stats.level + 1}
            </Text>
          </View>
        </View>

        {/* Streaks Card - Simplified */}
        <View style={styles.streaksCard}>
          <Text style={styles.sectionTitle}>🔥 Predictions Streaks</Text>
          
          <View style={styles.streaksRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakIcon}>⚡</Text>
              <View style={styles.streakInfo}>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakValue}>{stats.currentStreak}</Text>
              </View>
            </View>

            <View style={styles.streakDivider} />

            <View style={styles.streakItem}>
              <Text style={styles.streakIcon}>🏆</Text>
              <View style={styles.streakInfo}>
                <Text style={styles.streakLabel}>Longest Streak</Text>
                <Text style={styles.streakValue}>{stats.longestStreak}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/game/my-predictions' as any)}
          >
            <Text style={styles.actionIcon}>📜</Text>
            <Text style={styles.actionText}>My Predictions</Text>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/game/leaderboard' as any)}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionText}>Leaderboard</Text>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => router.push('/booking/my-bookings' as any)}
          >
            <Text style={styles.actionIcon}>🎫</Text>
            <Text style={styles.actionText}>My Bookings</Text>
            <Text style={styles.actionArrow}>›</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    gap: 6,
  },
  badgeIcon: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  userInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
  },
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  pointsBadge: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  pointsBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  streaksCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  streaksRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakIcon: {
    fontSize: 36,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
});