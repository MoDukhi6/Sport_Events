// app/(tabs)/booking.tsx
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>🎟️ Booking</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📍 How to Book Seats</Text>
          <Text style={styles.infoText}>
            1. Go to the <Text style={styles.bold}>Sport</Text> tab{'\n'}
            2. Select a league and view matches{'\n'}
            3. Click <Text style={styles.bold}>🤖 AI Picks</Text> or <Text style={styles.bold}>🗺️ Seat Map</Text> on any upcoming match{'\n'}
            4. Set your preferences below to get better recommendations
          </Text>
        </View>

        {/* Preferences Button */}
        <Pressable
          style={styles.optionCard}
          onPress={() => router.push('/booking/preferences')}
        >
          <Text style={styles.optionIcon}>⚙️</Text>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Seating Preferences</Text>
            <Text style={styles.optionDescription}>
              Set your noise level, view type, and budget preferences
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
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
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 10,
    color: '#111827',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  arrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
});