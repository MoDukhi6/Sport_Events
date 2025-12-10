import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { API_BASE_URL } from '../../constants/api';

type Prediction = {
  _id: string;
  match: string;
  predictedResult: string;
  isCorrect?: boolean;
};

type Booking = {
  _id: string;
  title: string;
  date: string;
};

type UserProfile = {
  _id: string;
  username: string;
  points: number;
  predictions: Prediction[];
  bookings: Booking[];
};

export default function ProfileScreen() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔴 LOG OUT HANDLER
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@userId');
      await AsyncStorage.removeItem('@username');
      router.replace('/auth/login'); // go back to login screen
    } catch (e) {
      console.log('Logout error:', e);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = await AsyncStorage.getItem('@userId');
        if (!userId) {
          setError('Not logged in');
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load profile');
        }

        setUser(data);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (error || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'No user data'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>👤</Text>
            <Text style={styles.username}>{user.username}</Text>
            {/* changed Points -> Exp */}
            <Text style={styles.points}>Exp: {user.points}</Text>
          </View>

          {/* History Title */}
          <Text style={styles.historyTitle}>History</Text>

          {/* Predictions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Predictions</Text>
            {user.predictions.length === 0 ? (
              <Text style={styles.emptyText}>No predictions yet.</Text>
            ) : (
              <FlatList
                data={user.predictions}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{item.match}</Text>
                    <Text>Prediction: {item.predictedResult}</Text>
                    {item.isCorrect !== undefined && (
                      <Text
                        style={[
                          styles.badge,
                          item.isCorrect ? styles.badgeCorrect : styles.badgeWrong,
                        ]}
                      >
                        {item.isCorrect ? 'Correct ✅' : 'Wrong ❌'}
                      </Text>
                    )}
                  </View>
                )}
              />
            )}
          </View>

          {/* Bookings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bookings</Text>
            {user.bookings.length === 0 ? (
              <Text style={styles.emptyText}>No bookings yet.</Text>
            ) : (
              <FlatList
                data={user.bookings}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text>Date: {new Date(item.date).toLocaleString()}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>

        {/* 🔴 LOG OUT BUTTON AT BOTTOM */}
        <View style={styles.footer}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  page: {
    flex: 1,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 20, // move content down from notch
    backgroundColor: '#ffffff',
  },
  header: { alignItems: 'center', marginBottom: 24 },
  emoji: { fontSize: 48 },
  username: { fontSize: 24, fontWeight: '600', marginTop: 8 },
  points: { fontSize: 18, marginTop: 4 },

  historyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },

  // 🔴 LOG OUT STYLES
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  emptyText: { fontStyle: 'italic', color: '#666' },
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  cardTitle: { fontWeight: '600', marginBottom: 4 },
  badge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    color: 'white',
    fontSize: 12,
  },
  badgeCorrect: { backgroundColor: 'green' },
  badgeWrong: { backgroundColor: 'red' },
  errorText: { color: 'red' },
});