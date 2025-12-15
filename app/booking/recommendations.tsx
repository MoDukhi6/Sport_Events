// app/booking/recommendations.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

type Classification = {
  noiseLevel: string;
  fieldProximity: string;
  viewType: string;
  priceRange: string;
  price: number;
  distance: number;
  energyLevel: string;
};

type Recommendation = {
  section: string;
  row: number;
  number: number;
  price: number;
  matchScore: number;
  classification: Classification;
  isTopPick: boolean;
};

type UserPreferences = {
  noiseLevel: string;
  fieldProximity: string;
  viewType: string;
  priceRange: string;
  satisfactionScore: number;
  totalBookings: number;
};

export default function RecommendationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ matchId?: string; matchName?: string; matchDate?: string }>();
  
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Decode match name from URL
  const matchName = params.matchName ? decodeURIComponent(params.matchName) : 'Match';

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('@userId');
      
      if (!userId) {
        Alert.alert('Error', 'Please login first');
        router.back();
        return;
      }

      // For now, we'll use mock stadium seats
      // In a real app, you'd fetch actual available seats for the match
      const mockStadiumSeats = generateMockSeats();

      const response = await fetch(
        `${API_BASE_URL}/api/booking/recommendations/${userId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: params.matchId || 'mock-match',
            stadiumSeats: mockStadiumSeats,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPreferences(data.preferences);
        setRecommendations(data.recommendations);
      } else {
        throw new Error(data.error || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
      Alert.alert('Error', 'Failed to load AI recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeat = async (seat: Recommendation) => {
    Alert.alert(
      'Confirm Booking',
      `Section ${seat.section}, Row ${seat.row}, Seat ${seat.number}\nPrice: £${seat.price}\nMatch Score: ${seat.matchScore}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('@userId');
              
              if (!userId) {
                Alert.alert('Error', 'Please login first');
                return;
              }

              // Save booking
              const response = await fetch(
                `${API_BASE_URL}/api/booking/create/${userId}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    matchId: params.matchId || 'mock-match',
                    matchName: matchName,
                    matchDate: params.matchDate || new Date().toISOString(),
                    section: seat.section,
                    row: seat.row,
                    seatNumber: seat.number,
                    price: seat.price,
                    matchScore: seat.matchScore,
                  }),
                }
              );

              const data = await response.json();

              if (response.ok) {
                Alert.alert(
                  'Booking Confirmed! 🎉',
                  'Your seat has been booked successfully.',
                  [
                    {
                      text: 'View in Profile',
                      onPress: () => router.push('/(tabs)/profile'),
                    },
                    { text: 'OK', style: 'default' },
                  ]
                );
              } else {
                throw new Error(data.error || 'Booking failed');
              }
            } catch (err) {
              console.error('Error creating booking:', err);
              Alert.alert('Error', 'Failed to create booking. Please try again.');
            }
          }
        },
      ]
    );
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return '#16a34a'; // Green
    if (score >= 70) return '#2563eb'; // Blue
    if (score >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 70) return 'Good Match';
    if (score >= 50) return 'Fair Match';
    return 'Poor Match';
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Analyzing seats...</Text>
        <Text style={styles.loadingSubtext}>
          Finding the best matches for your preferences
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>AI Recommendations</Text>
          <Text style={styles.subtitle}>{matchName}</Text>
        </View>

        {/* User Profile Card */}
        {preferences && (
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileIcon}>🤖</Text>
              <Text style={styles.profileTitle}>Your AI Profile</Text>
            </View>
            
            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Learning from:</Text>
                <Text style={styles.statValue}>{preferences.totalBookings} bookings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Satisfaction Score:</Text>
                <Text style={[styles.statValue, { color: '#16a34a' }]}>
                  {preferences.satisfactionScore}%
                </Text>
              </View>
            </View>

            <View style={styles.preferencesRow}>
              <View style={styles.preferenceTag}>
                <Text style={styles.preferenceTagText}>
                  {capitalizeFirst(preferences.noiseLevel)} Noise
                </Text>
              </View>
              <View style={styles.preferenceTag}>
                <Text style={styles.preferenceTagText}>
                  {capitalizeFirst(preferences.fieldProximity)} Proximity
                </Text>
              </View>
              <View style={styles.preferenceTag}>
                <Text style={styles.preferenceTagText}>
                  {capitalizeFirst(preferences.viewType)} View
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* AI Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 AI-Powered Matches</Text>
          
          {recommendations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recommendations available</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your preferences or check back later
              </Text>
            </View>
          ) : (
            recommendations.map((seat, index) => (
              <Pressable
                key={`${seat.section}-${seat.row}-${seat.number}`}
                style={[
                  styles.seatCard,
                  seat.isTopPick && styles.topPickCard,
                ]}
                onPress={() => handleSelectSeat(seat)}
              >
                {seat.isTopPick && (
                  <View style={styles.topPickBadge}>
                    <Text style={styles.topPickIcon}>⭐</Text>
                    <Text style={styles.topPickText}>AI Top Pick</Text>
                  </View>
                )}

                {/* Match Score */}
                <View style={styles.matchScoreContainer}>
                  <View style={[
                    styles.matchScoreBadge,
                    { backgroundColor: getMatchScoreColor(seat.matchScore) }
                  ]}>
                    <Text style={styles.matchScoreText}>{seat.matchScore}% Match</Text>
                  </View>
                  <Text style={styles.matchScoreLabel}>
                    {getMatchScoreLabel(seat.matchScore)}
                  </Text>
                </View>

                {/* Seat Info */}
                <View style={styles.seatInfo}>
                  <View style={styles.seatLocation}>
                    <Text style={styles.seatSection}>Section {seat.section}</Text>
                    <Text style={styles.seatDetails}>
                      Row {seat.row} • Seat {seat.number}
                    </Text>
                  </View>
                  <View style={styles.seatPrice}>
                    <Text style={styles.priceAmount}>£{seat.price}</Text>
                  </View>
                </View>

                {/* Preference Match Info */}
                <View style={styles.preferenceMatchContainer}>
                  <Text style={styles.preferenceMatchTitle}>Your Preferences vs This Seat:</Text>
                  
                  <View style={styles.preferenceMatchRow}>
                    <View style={styles.preferenceMatchItem}>
                      <Text style={styles.preferenceMatchLabel}>Noise Level:</Text>
                      <Text style={[
                        styles.preferenceMatchValue,
                        seat.classification.noiseLevel.toLowerCase() === preferences?.noiseLevel && styles.preferenceMatchGood
                      ]}>
                        {capitalizeFirst(seat.classification.noiseLevel)}
                        {seat.classification.noiseLevel.toLowerCase() === preferences?.noiseLevel && ' ✓'}
                      </Text>
                    </View>
                    
                    <View style={styles.preferenceMatchItem}>
                      <Text style={styles.preferenceMatchLabel}>Proximity:</Text>
                      <Text style={[
                        styles.preferenceMatchValue,
                        seat.classification.fieldProximity.toLowerCase() === preferences?.fieldProximity && styles.preferenceMatchGood
                      ]}>
                        {capitalizeFirst(seat.classification.fieldProximity)}
                        {seat.classification.fieldProximity.toLowerCase() === preferences?.fieldProximity && ' ✓'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.preferenceMatchRow}>
                    <View style={styles.preferenceMatchItem}>
                      <Text style={styles.preferenceMatchLabel}>View Type:</Text>
                      <Text style={[
                        styles.preferenceMatchValue,
                        seat.classification.viewType.toLowerCase() === preferences?.viewType && styles.preferenceMatchGood
                      ]}>
                        {capitalizeFirst(seat.classification.viewType)}
                        {seat.classification.viewType.toLowerCase() === preferences?.viewType && ' ✓'}
                      </Text>
                    </View>
                    
                    <View style={styles.preferenceMatchItem}>
                      <Text style={styles.preferenceMatchLabel}>Price Range:</Text>
                      <Text style={[
                        styles.preferenceMatchValue,
                        seat.classification.priceRange.toLowerCase() === preferences?.priceRange && styles.preferenceMatchGood
                      ]}>
                        {capitalizeFirst(seat.classification.priceRange)}
                        {seat.classification.priceRange.toLowerCase() === preferences?.priceRange && ' ✓'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recommendation Text */}
                <Text style={styles.recommendationText}>
                  {seat.isTopPick
                    ? '🎯 Perfect match for your preferences! This seat offers the ideal combination of noise level, view, and price.'
                    : `✨ Great alternative with ${seat.matchScore}% match score. ${
                        seat.classification.fieldProximity === 'close'
                          ? 'Close to the action'
                          : seat.classification.fieldProximity === 'medium'
                          ? 'Good balance of view and atmosphere'
                          : 'Excellent overview of the field'
                      }.`}
                </Text>

                {/* Select Button */}
                <Pressable
                  style={[styles.selectButton, seat.isTopPick && styles.selectButtonTop]}
                  onPress={() => handleSelectSeat(seat)}
                >
                  <Text style={styles.selectButtonText}>
                    Select AI-Recommended Seat
                  </Text>
                </Pressable>
              </Pressable>
            ))
          )}
        </View>

        {/* Customize Preferences Button */}
        <Pressable
          style={styles.customizeButton}
          onPress={() => router.push('/booking/preferences')}
        >
          <Text style={styles.customizeButtonText}>⚙️ Customize AI Preferences</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper function to generate mock seats
type MockSeat = {
  section: string;
  row: number;
  number: number;
  x: number;
  y: number;
  available: boolean;
};

function generateMockSeats(): MockSeat[] {
  const seats: MockSeat[] = [];
  const sections = ['North', 'South', 'East', 'West'];
  
  sections.forEach((section) => {
    for (let row = 1; row <= 20; row++) {
      for (let number = 1; number <= 15; number++) {
        let x = 0;
        let y = 0;
        
        switch(section) {
          case 'North':
            x = (number - 7.5) * 5;
            y = 50 - row * 2;
            break;
          case 'South':
            x = (number - 7.5) * 5;
            y = -50 + row * 2;
            break;
          case 'East':
            x = 50 - row * 2;
            y = (number - 7.5) * 5;
            break;
          case 'West':
            x = -50 + row * 2;
            y = (number - 7.5) * 5;
            break;
        }
        
        seats.push({
          section,
          row,
          number,
          x: Math.round(x),
          y: Math.round(y),
          available: Math.random() > 0.3,
        });
      }
    }
  });
  
  return seats;
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    marginBottom: 8,
  },
  backText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
  preferencesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  preferenceTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  preferenceTagText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  seatCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  topPickCard: {
    borderColor: '#fbbf24',
    backgroundColor: '#fffbeb',
  },
  topPickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  topPickIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  topPickText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  matchScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  matchScoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  matchScoreLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  seatInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seatLocation: {
    flex: 1,
  },
  seatSection: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seatDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  seatPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
  },
  preferenceMatchContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  preferenceMatchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  preferenceMatchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  preferenceMatchItem: {
    flex: 1,
  },
  preferenceMatchLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  preferenceMatchValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  preferenceMatchGood: {
    color: '#16a34a',
  },
  recommendationText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 12,
  },
  selectButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonTop: {
    backgroundColor: '#f59e0b',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  customizeButton: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  customizeButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
});