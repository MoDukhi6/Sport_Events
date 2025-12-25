// app/booking/my-bookings.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

type Booking = {
  _id?: string;
  matchId: string;
  matchName: string;
  matchDate: string;
  section?: string;
  seatSection?: string;
  row?: number;
  seatNumber: string | number;
  price?: string | number;
  bookedAt?: string;
  createdAt?: string;
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      const userId = await AsyncStorage.getItem('@userId');
      
      if (!userId) {
        console.log('No userId found');
        setBookings([]);
        setLoading(false);
        return;
      }

      // Try to load from backend first
      try {
        const response = await fetch(`${API_BASE_URL}/api/booking/user/${userId}`);
        
        if (response.ok) {
          const backendBookings = await response.json();
          console.log('✅ Loaded bookings from backend:', backendBookings);
          
          // Transform backend bookings to match our format
          const transformedBookings = backendBookings.map((b: any) => ({
            _id: b._id,
            matchId: b.matchId,
            matchName: b.matchName || b.title || 'Match',
            matchDate: b.matchDate || b.date,
            seatSection: b.section,
            seatNumber: b.seatNumber,
            price: b.price ? `£${b.price}` : undefined,
            bookedAt: b.createdAt,
          }));
          
          setBookings(transformedBookings);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch (backendErr) {
        console.log('Backend fetch failed, trying AsyncStorage...', backendErr);
      }

      // Fallback to AsyncStorage (user-specific)
      const storageKey = `userBookings_${userId}`;
      const bookingsStr = await AsyncStorage.getItem(storageKey);
      console.log('📦 Raw bookings from AsyncStorage:', bookingsStr);
      
      if (bookingsStr) {
        const parsedBookings = JSON.parse(bookingsStr);
        console.log('✅ Parsed bookings from AsyncStorage:', parsedBookings);
        setBookings(parsedBookings);
      } else {
        console.log('📭 No bookings found');
        setBookings([]);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleDeleteBooking = (booking: Booking, index: number) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('@userId');
              
              if (!userId) {
                Alert.alert('Error', 'User not found');
                return;
              }

              // If has _id, delete from backend
              if (booking._id) {
                await fetch(`${API_BASE_URL}/api/booking/delete/${userId}/${booking._id}`, {
                  method: 'DELETE',
                });
              }

              // Delete from AsyncStorage (user-specific)
              const storageKey = `userBookings_${userId}`;
              const bookingsStr = await AsyncStorage.getItem(storageKey);
              if (bookingsStr) {
                const allBookings = JSON.parse(bookingsStr);
                const updatedBookings = allBookings.filter((_: any, i: number) => i !== index);
                await AsyncStorage.setItem(storageKey, JSON.stringify(updatedBookings));
              }

              // Update local state
              const updatedBookings = bookings.filter((_, i) => i !== index);
              setBookings(updatedBookings);
              
              Alert.alert('Success', 'Booking cancelled');
            } catch (err) {
              console.error('Error deleting booking:', err);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBooking = (booking: Booking, index: number) => {
    const section = booking.seatSection || booking.section || 'N/A';
    const seatNum = booking.seatNumber || 'N/A';
    const price = typeof booking.price === 'number' ? `£${booking.price}` : booking.price || 'N/A';

    return (
      <View key={booking._id || index} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.matchName} numberOfLines={2}>{booking.matchName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Confirmed</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{formatDate(booking.matchDate)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💺</Text>
            <Text style={styles.detailText}>
              Section {section} • Seat {seatNum}
            </Text>
          </View>

          {booking.price && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>💰</Text>
              <Text style={styles.detailText}>{price}</Text>
            </View>
          )}
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.bookingDate}>
            Booked: {formatDate(booking.bookedAt || booking.createdAt || new Date().toISOString())}
          </Text>
          <Pressable
            style={styles.cancelButton}
            onPress={() => handleDeleteBooking(booking, index)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
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
          <Text style={styles.title}>My Bookings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Quick Actions Banner */}
        <View style={styles.actionsBanner}>
          <Pressable
            style={styles.bannerButton}
            onPress={() => router.push('/booking/preferences' as any)}
          >
            <Text style={styles.bannerButtonIcon}>⚙️</Text>
            <Text style={styles.bannerButtonText}>Customize AI Preferences</Text>
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
          ) : bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎫</Text>
              <Text style={styles.emptyText}>No bookings yet</Text>
              <Text style={styles.emptySubtext}>
                Book seats for upcoming matches to see them here!
              </Text>
              <Pressable
                style={styles.browseButton}
                onPress={() => router.push('/football/leagues' as any)}
              >
                <Text style={styles.browseButtonText}>Browse Matches</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.bookingsHeader}>
                <Text style={styles.bookingsCount}>
                  {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
                </Text>
              </View>
              {bookings.map(renderBooking)}
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
  actionsBanner: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    gap: 8,
  },
  bannerButtonIcon: {
    fontSize: 18,
  },
  bannerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
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
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  bookingsHeader: {
    marginBottom: 12,
  },
  bookingsCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  matchName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  bookingDetails: {
    gap: 10,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  bookingDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
});