// app/booking/preferences.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type NoiseLevel = 'quiet' | 'moderate' | 'loud';
type FieldProximity = 'close' | 'medium' | 'far';
type ViewType = 'central' | 'side' | 'corner';
type PriceRange = 'budget' | 'medium' | 'premium';

export default function SeatPreferencesScreen() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel>('moderate');
  const [fieldProximity, setFieldProximity] = useState<FieldProximity>('medium');
  const [viewType, setViewType] = useState<ViewType>('central');
  const [priceRange, setPriceRange] = useState<PriceRange>('medium');
  const [familyFriendly, setFamilyFriendly] = useState(false);
  const [accessibility, setAccessibility] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const id = await AsyncStorage.getItem('@userId');
      
      if (!id) {
        Alert.alert('Error', 'Please login first');
        router.back();
        return;
      }
      
      setUserId(id);
      
      const response = await fetch(`${API_BASE_URL}/api/booking/preferences/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setNoiseLevel(data.noiseLevel);
        setFieldProximity(data.fieldProximity);
        setViewType(data.viewType);
        setPriceRange(data.priceRange);
        setFamilyFriendly(data.familyFriendly);
        setAccessibility(data.accessibility);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!userId) return;
    
    try {
      setSaving(true);
      
      const response = await fetch(`${API_BASE_URL}/api/booking/preferences/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noiseLevel,
          fieldProximity,
          viewType,
          priceRange,
          familyFriendly,
          accessibility,
        }),
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Preferences saved successfully!');
        router.back();
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Seat Preferences</Text>
      </View>

      {/* Noise Level Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔊 Noise Level Preference</Text>
        <View style={styles.optionsGroup}>
          <Pressable
            style={[styles.option, noiseLevel === 'quiet' && styles.optionActive]}
            onPress={() => setNoiseLevel('quiet')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionEmoji}>😌</Text>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, noiseLevel === 'quiet' && styles.optionTitleActive]}>
                  Quiet
                </Text>
                <Text style={styles.optionDescription}>Calm atmosphere, family-friendly</Text>
              </View>
            </View>
            <View style={[styles.radio, noiseLevel === 'quiet' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, noiseLevel === 'moderate' && styles.optionActive]}
            onPress={() => setNoiseLevel('moderate')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionEmoji}>🙂</Text>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, noiseLevel === 'moderate' && styles.optionTitleActive]}>
                  Moderate
                </Text>
                <Text style={styles.optionDescription}>Balanced energy and excitement</Text>
              </View>
            </View>
            <View style={[styles.radio, noiseLevel === 'moderate' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, noiseLevel === 'loud' && styles.optionActive]}
            onPress={() => setNoiseLevel('loud')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionEmoji}>🔥</Text>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, noiseLevel === 'loud' && styles.optionTitleActive]}>
                  Loud
                </Text>
                <Text style={styles.optionDescription}>High energy, passionate fans</Text>
              </View>
            </View>
            <View style={[styles.radio, noiseLevel === 'loud' && styles.radioActive]} />
          </Pressable>
        </View>
      </View>

      {/* Field Proximity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Field Proximity</Text>
        <View style={styles.optionsGroup}>
          <Pressable
            style={[styles.option, fieldProximity === 'close' && styles.optionActive]}
            onPress={() => setFieldProximity('close')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, fieldProximity === 'close' && styles.optionTitleActive]}>
                  Close to Field
                </Text>
                <Text style={styles.optionDescription}>Premium view, higher energy</Text>
              </View>
            </View>
            <View style={[styles.radio, fieldProximity === 'close' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, fieldProximity === 'medium' && styles.optionActive]}
            onPress={() => setFieldProximity('medium')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, fieldProximity === 'medium' && styles.optionTitleActive]}>
                  Medium Distance
                </Text>
                <Text style={styles.optionDescription}>Good balance of view and price</Text>
              </View>
            </View>
            <View style={[styles.radio, fieldProximity === 'medium' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, fieldProximity === 'far' && styles.optionActive]}
            onPress={() => setFieldProximity('far')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, fieldProximity === 'far' && styles.optionTitleActive]}>
                  Far from Field
                </Text>
                <Text style={styles.optionDescription}>Better overview, quieter</Text>
              </View>
            </View>
            <View style={[styles.radio, fieldProximity === 'far' && styles.radioActive]} />
          </Pressable>
        </View>
      </View>

      {/* View Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👁️ View Type</Text>
        <View style={styles.optionsGroup}>
          <Pressable
            style={[styles.option, viewType === 'central' && styles.optionActive]}
            onPress={() => setViewType('central')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, viewType === 'central' && styles.optionTitleActive]}>
                  Central View
                </Text>
                <Text style={styles.optionDescription}>Behind goals, straight view</Text>
              </View>
            </View>
            <View style={[styles.radio, viewType === 'central' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, viewType === 'side' && styles.optionActive]}
            onPress={() => setViewType('side')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, viewType === 'side' && styles.optionTitleActive]}>
                  Side View
                </Text>
                <Text style={styles.optionDescription}>Along the sideline</Text>
              </View>
            </View>
            <View style={[styles.radio, viewType === 'side' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, viewType === 'corner' && styles.optionActive]}
            onPress={() => setViewType('corner')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, viewType === 'corner' && styles.optionTitleActive]}>
                  Corner View
                </Text>
                <Text style={styles.optionDescription}>Diagonal perspective</Text>
              </View>
            </View>
            <View style={[styles.radio, viewType === 'corner' && styles.radioActive]} />
          </Pressable>
        </View>
      </View>

      {/* Price Range */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Price Range</Text>
        <View style={styles.optionsGroup}>
          <Pressable
            style={[styles.option, priceRange === 'budget' && styles.optionActive]}
            onPress={() => setPriceRange('budget')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, priceRange === 'budget' && styles.optionTitleActive]}>
                  Budget (£30-60)
                </Text>
                <Text style={styles.optionDescription}>Upper tiers, good value</Text>
              </View>
            </View>
            <View style={[styles.radio, priceRange === 'budget' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, priceRange === 'medium' && styles.optionActive]}
            onPress={() => setPriceRange('medium')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, priceRange === 'medium' && styles.optionTitleActive]}>
                  Medium (£60-120)
                </Text>
                <Text style={styles.optionDescription}>Good seats, balanced price</Text>
              </View>
            </View>
            <View style={[styles.radio, priceRange === 'medium' && styles.radioActive]} />
          </Pressable>

          <Pressable
            style={[styles.option, priceRange === 'premium' && styles.optionActive]}
            onPress={() => setPriceRange('premium')}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, priceRange === 'premium' && styles.optionTitleActive]}>
                  Premium (£120+)
                </Text>
                <Text style={styles.optionDescription}>Best seats, premium experience</Text>
              </View>
            </View>
            <View style={[styles.radio, priceRange === 'premium' && styles.radioActive]} />
          </Pressable>
        </View>
      </View>

      {/* Additional Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Options</Text>
        <View style={styles.optionsGroup}>
          <Pressable
            style={styles.checkboxOption}
            onPress={() => setFamilyFriendly(!familyFriendly)}
          >
            <View style={[styles.checkbox, familyFriendly && styles.checkboxActive]}>
              {familyFriendly && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Family-friendly seating</Text>
          </Pressable>

          <Pressable
            style={styles.checkboxOption}
            onPress={() => setAccessibility(!accessibility)}
          >
            <View style={[styles.checkbox, accessibility && styles.checkboxActive]}>
              {accessibility && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Accessibility requirements</Text>
          </Pressable>
        </View>
      </View>

      {/* Save Button */}
      <Pressable
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={savePreferences}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.saveButtonIcon}>💾</Text>
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          </>
        )}
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
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
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  optionsGroup: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  optionActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  optionTitleActive: {
    color: '#2563eb',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginLeft: 8,
  },
  radioActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});