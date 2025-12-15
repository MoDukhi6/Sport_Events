// app/(tabs)/profile.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [totalBookings, setTotalBookings] = useState(0);
  const [satisfactionScore, setSatisfactionScore] = useState(0);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  // Refresh profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const storedUsername = await AsyncStorage.getItem('@username');
      const userId = await AsyncStorage.getItem('@userId');
      
      if (storedUsername) {
        setUsername(storedUsername);
      }

      if (userId) {
        // Fetch user's bookings
        const response = await fetch(`${API_BASE_URL}/api/booking/history/${userId}`);
        const data = await response.json();
        
        if (response.ok) {
          setBookings(data.bookings);
          setTotalBookings(data.totalBookings);
          
          // Calculate satisfaction score based on match scores
          if (data.bookings.length > 0) {
            const avgScore = Math.round(
              data.bookings.reduce((sum: number, b: any) => sum + (b.matchScore || 0), 0) / 
              data.bookings.length
            );
            setSatisfactionScore(avgScore || 50);
          } else {
            setSatisfactionScore(50);
          }
        }
      }
      
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('@userId');
            await AsyncStorage.removeItem('@username');
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.username}>{username}</Text>
        </View>

        {/* Booking Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Booking Statistics</Text>
          
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#16a34a' }]}>
                {satisfactionScore}%
              </Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
          </View>
        </View>

        {/* Booking History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 Booking History</Text>
          
          {totalBookings === 0 ? (
            <View style={styles.emptyHistoryCard}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyHistoryTitle}>No bookings yet</Text>
              <Text style={styles.emptyHistorySubtext}>
                Your booking history will appear here
              </Text>
            </View>
          ) : (
            bookings.map((booking) => (
              <View key={booking._id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingMatch}>{booking.matchName}</Text>
                  <Text style={styles.bookingPrice}>£{booking.price}</Text>
                </View>

                {booking.matchDate && (
                  <View style={styles.matchDateContainer}>
                    <Text style={styles.matchDateIcon}>📅</Text>
                    <Text style={styles.matchDateText}>
                      {new Date(booking.matchDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} at {new Date(booking.matchDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                )}
                
                <View style={styles.bookingDetails}>
                  <Text style={styles.bookingDetailText}>
                    Section {booking.section} • Row {booking.row} • Seat {booking.seatNumber}
                  </Text>
                  {booking.matchScore > 0 && (
                    <Text style={styles.bookingMatchScore}>
                      {booking.matchScore}% Match
                    </Text>
                  )}
                </View>
                
                <Text style={styles.bookingDate}>
                  Booked: {new Date(booking.bookingDate).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* AI Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤖 AI Preferences</Text>
          
          <Pressable
            style={styles.preferenceCard}
            onPress={() => router.push('/booking/preferences')}
          >
            <View style={styles.preferenceContent}>
              <Text style={styles.preferenceIcon}>⚙️</Text>
              <View style={styles.preferenceText}>
                <Text style={styles.preferenceTitle}>Seating Preferences</Text>
                <Text style={styles.preferenceSubtext}>
                  Customize your AI recommendations
                </Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Account</Text>
          
          <Pressable style={styles.actionCard} onPress={handleLogout}>
            <Text style={styles.actionIcon}>🚪</Text>
            <Text style={styles.actionText}>Logout</Text>
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
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  emptyHistoryCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyHistoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  historyPlaceholder: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingMatch: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  matchDateContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
  backgroundColor: '#eff6ff',
  padding: 8,
  borderRadius: 8,
},
matchDateIcon: {
  fontSize: 16,
  marginRight: 6,
},
matchDateText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#1e40af',
},
  bookingPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  bookingMatchScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bookingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  preferenceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  preferenceIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  preferenceSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});