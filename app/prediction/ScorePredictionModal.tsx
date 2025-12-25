// app/prediction/ScorePredictionModal.tsx
import { API_BASE_URL } from '@/constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScorePredictionModalProps = {
  visible: boolean;
  matchId: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  matchDate: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function ScorePredictionModal({
  visible,
  matchId,
  homeTeam,
  awayTeam,
  matchDate,
  onClose,
  onSuccess,
}: ScorePredictionModalProps) {
  const [homeGoals, setHomeGoals] = useState('');
  const [awayGoals, setAwayGoals] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate input
    if (homeGoals === '' || awayGoals === '') {
      Alert.alert('Invalid Input', 'Please enter scores for both teams');
      return;
    }

    const homeScore = parseInt(homeGoals);
    const awayScore = parseInt(awayGoals);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      Alert.alert('Invalid Input', 'Please enter valid scores (0 or higher)');
      return;
    }

    if (homeScore > 20 || awayScore > 20) {
      Alert.alert('Invalid Input', 'Please enter realistic scores (0-20)');
      return;
    }

    try {
      setLoading(true);

      // Get user from AsyncStorage
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        Alert.alert('Error', 'Please login to make predictions');
        return;
      }

      const user = JSON.parse(userStr);

      const response = await fetch(`${API_BASE_URL}/api/user-predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id,
          matchId,
          homeTeam,
          awayTeam,
          predictedHomeGoals: homeScore,
          predictedAwayGoals: awayScore,
          matchDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit prediction');
      }

      Alert.alert(
        'Prediction Submitted! 🎉',
        `You predicted: ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}\n\nEarn points when the match finishes!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setHomeGoals('');
              setAwayGoals('');
              onClose();
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>🎮 Predict the Score</Text>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>How to Earn Points:</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🎯</Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>Exact Score:</Text> 3 points
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>⚽</Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>Correct Winner:</Text> 1 point
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>❌</Text>
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>Wrong:</Text> 0 points
                </Text>
              </View>
            </View>

            {/* Teams */}
            <View style={styles.teamsContainer}>
              <View style={styles.teamBox}>
                <View style={[styles.teamCircle, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.teamInitial}>{homeTeam.name.charAt(0)}</Text>
                </View>
                <Text style={styles.teamName}>{homeTeam.name}</Text>
              </View>

              <Text style={styles.vsText}>VS</Text>

              <View style={styles.teamBox}>
                <View style={[styles.teamCircle, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.teamInitial}>{awayTeam.name.charAt(0)}</Text>
                </View>
                <Text style={styles.teamName}>{awayTeam.name}</Text>
              </View>
            </View>

            {/* Score Input */}
            <View style={styles.scoreContainer}>
              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreLabel}>{homeTeam.name}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={homeGoals}
                  onChangeText={setHomeGoals}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <Text style={styles.scoreDash}>-</Text>

              <View style={styles.scoreInputBox}>
                <Text style={styles.scoreLabel}>{awayTeam.name}</Text>
                <TextInput
                  style={styles.scoreInput}
                  value={awayGoals}
                  onChangeText={setAwayGoals}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitIcon}>🎯</Text>
                  <Text style={styles.submitText}>Submit Prediction</Text>
                </>
              )}
            </Pressable>

            {/* Cancel Button */}
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalContainer: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#166534',
  },
  infoBold: {
    fontWeight: '700',
  },
  teamsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 32,
  },
  teamBox: {
    alignItems: 'center',
    flex: 1,
  },
  teamCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  teamName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
    marginHorizontal: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 24,
  },
  scoreInputBox: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  scoreInput: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scoreDash: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6b7280',
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitIcon: {
    fontSize: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
});