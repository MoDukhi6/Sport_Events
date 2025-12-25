// app/booking/seat-map.tsx
import { API_BASE_URL } from '@/constants/api';
import { saveBooking } from '@/utils/bookingStorage';
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

type SeatStatus = 'available' | 'taken' | 'selected' | 'aiPick';

type Seat = {
  section: string;
  row: number;
  number: number;
  status: SeatStatus;
  price: number;
  classification?: {
    noiseLevel: string;
    viewType: string;
    energyLevel: string;
  };
};

type Section = {
  name: string;
  color: string;
  position: 'north' | 'south' | 'east' | 'west' | 'corner-ne' | 'corner-nw' | 'corner-se' | 'corner-sw';
  seats: Seat[];
};

export default function SeatMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    matchId?: string; 
    matchName?: string;
    matchDate?: string;
    aiRecommendedSection?: string;
  }>();
  
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Decode match name from URL
  const matchName = params.matchName ? decodeURIComponent(params.matchName) : 'Match';

  useEffect(() => {
    loadStadiumSeats();
  }, []);

  const loadStadiumSeats = async () => {
    try {
      setLoading(true);
      
      // Generate mock stadium layout with corner sections
      const mockSections = generateStadiumLayout();
      setSections(mockSections);
      
    } catch (err) {
      console.error('Error loading seats:', err);
      Alert.alert('Error', 'Failed to load stadium seats');
    } finally {
      setLoading(false);
    }
  };

  const handleSeatPress = (seat: Seat) => {
    if (seat.status === 'taken') {
      Alert.alert('Unavailable', 'This seat is already taken');
      return;
    }
    
    setSelectedSeat(seat);
  };

  const handleBookSeat = async () => {
    if (!selectedSeat) return;
    
    Alert.alert(
      'Confirm Booking',
      `Section ${selectedSeat.section}, Row ${selectedSeat.row}, Seat ${selectedSeat.number}\n\nPrice: £${selectedSeat.price}`,
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

              // Save to backend database
              const response = await fetch(
                `${API_BASE_URL}/api/booking/create/${userId}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    matchId: params.matchId || 'mock-match',
                    matchName: matchName,
                    matchDate: params.matchDate || new Date().toISOString(),
                    section: selectedSeat.section,
                    row: selectedSeat.row,
                    seatNumber: selectedSeat.number,
                    price: selectedSeat.price,
                    matchScore: 0,
                  }),
                }
              );

              const data = await response.json();

              if (response.ok) {
                // Also save to AsyncStorage for quick access
                const userId = await AsyncStorage.getItem('@userId');
                if (userId) {
                  await saveBooking({
                    matchId: params.matchId || 'mock-match',
                    matchName: matchName,
                    matchDate: params.matchDate || new Date().toISOString(),
                    seatSection: selectedSeat.section,
                    seatNumber: selectedSeat.number.toString(),
                    price: `£${selectedSeat.price}`,
                    bookedAt: new Date().toISOString(),
                  }, userId);
                }

                Alert.alert(
                  'Booking Confirmed! 🎉',
                  'Your seat has been booked successfully.',
                  [
                    {
                      text: 'View Bookings',
                      onPress: () => router.push('/booking/my-bookings' as any),
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading stadium map...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Stadium Seating Map</Text>
          <Text style={styles.subtitle}>{matchName}</Text>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
              🗺️ Map View
            </Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              📋 List View
            </Text>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {viewMode === 'map' ? (
            <View style={styles.mapContainer}>
              {/* Stadium Map */}
              <Text style={styles.mapTitle}>⚽ Stadium Seating Map</Text>
              
              <View style={styles.stadiumMap}>
                {/* Top Row: NW Corner - North - NE Corner */}
                <View style={styles.topRow}>
                  <View style={styles.cornerSection}>
                    {renderSection(sections.find(s => s.position === 'corner-nw'))}
                  </View>
                  <View style={styles.mainSection}>
                    {renderSection(sections.find(s => s.position === 'north'))}
                  </View>
                  <View style={styles.cornerSection}>
                    {renderSection(sections.find(s => s.position === 'corner-ne'))}
                  </View>
                </View>
                
                {/* Middle Row: West - Field - East */}
                <View style={styles.middleRow}>
                  <View style={styles.sideSection}>
                    {renderSection(sections.find(s => s.position === 'west'))}
                  </View>
                  
                  <View style={styles.field}>
                    <Text style={styles.fieldText}>FIELD</Text>
                  </View>
                  
                  <View style={styles.sideSection}>
                    {renderSection(sections.find(s => s.position === 'east'))}
                  </View>
                </View>
                
                {/* Bottom Row: SW Corner - South - SE Corner */}
                <View style={styles.bottomRow}>
                  <View style={styles.cornerSection}>
                    {renderSection(sections.find(s => s.position === 'corner-sw'))}
                  </View>
                  <View style={styles.mainSection}>
                    {renderSection(sections.find(s => s.position === 'south'))}
                  </View>
                  <View style={styles.cornerSection}>
                    {renderSection(sections.find(s => s.position === 'corner-se'))}
                  </View>
                </View>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendRow}>
                  <View style={[styles.legendBox, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>Taken</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendBox, { backgroundColor: '#3b82f6' }]} />
                  <Text style={styles.legendText}>AI Pick</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {sections.map((section) => (
                <View key={section.name} style={styles.sectionList}>
                  <Text style={styles.sectionListTitle}>{section.name} Section</Text>
                  <View style={styles.seatsGrid}>
                    {section.seats.slice(0, 20).map((seat, index) => (
                      <Pressable
                        key={`${seat.section}-${seat.row}-${seat.number}`}
                        style={[
                          styles.seatListItem,
                          seat.status === 'taken' && styles.seatTaken,
                          seat.status === 'aiPick' && styles.seatAIPick,
                          selectedSeat?.section === seat.section &&
                          selectedSeat?.row === seat.row &&
                          selectedSeat?.number === seat.number &&
                          styles.seatSelected,
                        ]}
                        onPress={() => handleSeatPress(seat)}
                        disabled={seat.status === 'taken'}
                      >
                        <Text style={styles.seatListText}>
                          R{seat.row} S{seat.number}
                        </Text>
                        <Text style={styles.seatListPrice}>£{seat.price}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Selected Seat Info - Fixed at bottom */}
        {selectedSeat && (
          <View style={styles.selectedSeatBar}>
            <View style={styles.selectedSeatInfo}>
              <Text style={styles.selectedSeatTitle}>
                Section {selectedSeat.section} • Row {selectedSeat.row} • Seat {selectedSeat.number}
              </Text>
              {selectedSeat.classification && (
                <Text style={styles.selectedSeatTags}>
                  {selectedSeat.classification.noiseLevel} • {selectedSeat.classification.viewType} View
                </Text>
              )}
            </View>
            <Pressable style={styles.bookButton} onPress={handleBookSeat}>
              <Text style={styles.bookButtonText}>Book - £{selectedSeat.price}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  function renderSection(section: Section | undefined) {
    if (!section) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{section.name}</Text>
        <View style={styles.seatGrid}>
          {section.seats.slice(0, 12).map((seat, index) => (
            <Pressable
              key={`${seat.section}-${seat.row}-${seat.number}`}
              style={[
                styles.seatBox,
                seat.status === 'available' && styles.seatAvailable,
                seat.status === 'taken' && styles.seatBoxTaken,
                seat.status === 'aiPick' && styles.seatAIPickBox,
                selectedSeat?.section === seat.section &&
                selectedSeat?.row === seat.row &&
                selectedSeat?.number === seat.number &&
                styles.seatSelectedBox,
              ]}
              onPress={() => handleSeatPress(seat)}
              disabled={seat.status === 'taken'}
            />
          ))}
        </View>
      </View>
    );
  }
}

// Generate mock stadium layout with corners
function generateStadiumLayout(): Section[] {
  const generateSeatsForSection = (sectionName: string, count: number = 50): Seat[] => {
    const seats: Seat[] = [];
    for (let i = 1; i <= count; i++) {
      const row = Math.ceil(i / 10);
      const number = ((i - 1) % 10) + 1;
      const isAIPick = Math.random() > 0.9; // 10% AI picks
      const isTaken = Math.random() > 0.7 && !isAIPick; // 30% taken
      
      seats.push({
        section: sectionName,
        row,
        number,
        status: isAIPick ? 'aiPick' : isTaken ? 'taken' : 'available',
        price: Math.round(60 + Math.random() * 120),
        classification: {
          noiseLevel: ['Quiet', 'Moderate', 'Loud'][Math.floor(Math.random() * 3)],
          viewType: ['Central', 'Side', 'Corner'][Math.floor(Math.random() * 3)],
          energyLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        },
      });
    }
    return seats;
  };

  return [
    {
      name: 'North',
      color: '#22c55e',
      position: 'north',
      seats: generateSeatsForSection('North', 50),
    },
    {
      name: 'South',
      color: '#ef4444',
      position: 'south',
      seats: generateSeatsForSection('South', 50),
    },
    {
      name: 'East',
      color: '#3b82f6',
      position: 'east',
      seats: generateSeatsForSection('East', 50),
    },
    {
      name: 'West',
      color: '#f59e0b',
      position: 'west',
      seats: generateSeatsForSection('West', 50),
    },
    {
      name: 'NE Corner',
      color: '#8b5cf6',
      position: 'corner-ne',
      seats: generateSeatsForSection('NE Corner', 30),
    },
    {
      name: 'NW Corner',
      color: '#ec4899',
      position: 'corner-nw',
      seats: generateSeatsForSection('NW Corner', 30),
    },
    {
      name: 'SE Corner',
      color: '#14b8a6',
      position: 'corner-se',
      seats: generateSeatsForSection('SE Corner', 30),
    },
    {
      name: 'SW Corner',
      color: '#f97316',
      position: 'corner-sw',
      seats: generateSeatsForSection('SW Corner', 30),
    },
  ];
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 4,
    borderRadius: 10,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  mapContainer: {
    padding: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#111827',
  },
  stadiumMap: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  cornerSection: {
    flex: 1,
    alignItems: 'center',
  },
  mainSection: {
    flex: 2,
    alignItems: 'center',
  },
  sideSection: {
    flex: 1,
    alignItems: 'center',
  },
  section: {
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    maxWidth: 100,
  },
  seatBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  seatAvailable: {
    backgroundColor: '#22c55e',
  },
  seatBoxTaken: {
    backgroundColor: '#ef4444',
  },
  seatAIPickBox: {
    backgroundColor: '#3b82f6',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  seatSelectedBox: {
    borderWidth: 2,
    borderColor: '#000',
  },
  field: {
    flex: 2,
    backgroundColor: '#22c55e',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  fieldText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  legend: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  sectionList: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seatListItem: {
    width: 70,
    padding: 8,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    alignItems: 'center',
  },
  seatListText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  seatListPrice: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },
  seatTaken: {
    backgroundColor: '#ef4444',
  },
  seatAIPick: {
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  seatSelected: {
    borderWidth: 2,
    borderColor: '#000',
  },
  selectedSeatBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectedSeatInfo: {
    marginBottom: 12,
  },
  selectedSeatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  selectedSeatTags: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});