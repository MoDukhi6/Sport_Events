// app/prediction/[matchId].tsx
import { API_BASE_URL } from '@/constants/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

type Prediction = {
  matchId: string;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  predictions: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  confidence: 'low' | 'medium' | 'high';
  factors: {
    recentForm: {
      home: string[];
      away: string[];
    };
    headToHead: {
      homeWins: number;
      draws: number;
      awayWins: number;
      totalMatches: number;
      lastResult: string;
    };
    homeAdvantage: {
      homeWinRate: number;
      awayWinRate: number;
    };
    goalsAverage: {
      homeScored: number;
      homeConceded: number;
      awayScored: number;
      awayConceded: number;
    };
  };
};

export default function PredictionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ matchId?: string; matchName?: string }>();
  
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const matchName = params.matchName ? decodeURIComponent(params.matchName) : 'Match';

  useEffect(() => {
    loadPrediction();
  }, []);

  const loadPrediction = async () => {
    try {
      setLoading(true);
      
      if (!params.matchId) {
        throw new Error('Match ID is required');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/prediction/match/${params.matchId}`
      );

      if (!response.ok) {
        throw new Error('Failed to load prediction');
      }

      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      console.error('Error loading prediction:', err);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#16a34a';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getFormColor = (result: string) => {
    switch (result) {
      case 'W': return '#16a34a';
      case 'D': return '#6b7280';
      case 'L': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  // Simple Donut Chart Component
  const DonutChart = ({ homeWin, draw, awayWin }: { homeWin: number; draw: number; awayWin: number }) => {
    const size = 200;
    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate angles
    const homeAngle = (homeWin / 100) * 360;
    const drawAngle = (draw / 100) * 360;
    const awayAngle = (awayWin / 100) * 360;

    const createArc = (startAngle: number, endAngle: number, color: string) => {
      const start = polarToCartesian(size / 2, size / 2, radius, endAngle);
      const end = polarToCartesian(size / 2, size / 2, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

      return (
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
      );
    };

    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
      };
    };

    return (
      <View style={styles.chartWrapper}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {createArc(0, homeAngle, '#ef4444')}
          {createArc(homeAngle, homeAngle + drawAngle, '#6b7280')}
          {createArc(homeAngle + drawAngle, 360, '#3b82f6')}
          
          {/* Center circle for donut effect */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth / 2}
            fill="#fff"
          />
        </svg>
        
        <View style={styles.chartCenter}>
          <Text style={styles.chartCenterTitle}>Win</Text>
          <Text style={styles.chartCenterSubtitle}>Probability</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Analyzing match data...</Text>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load prediction</Text>
        <Pressable style={styles.retryButton} onPress={loadPrediction}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Match Prediction</Text>
        </View>

        {/* Match Teams */}
        <View style={styles.matchCard}>
          <View style={styles.teamContainer}>
            <View style={styles.teamCircle}>
              <Text style={styles.teamInitial}>
                {prediction.homeTeam.name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.teamName}>{prediction.homeTeam.name}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.teamContainer}>
            <View style={[styles.teamCircle, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.teamInitial}>
                {prediction.awayTeam.name.charAt(0)}
              </Text>
            </View>
            <Text style={styles.teamName}>{prediction.awayTeam.name}</Text>
          </View>
        </View>

        {/* Win Probability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Win Probability</Text>
          
          <View style={styles.chartContainer}>
            <DonutChart
              homeWin={prediction.predictions.homeWin}
              draw={prediction.predictions.draw}
              awayWin={prediction.predictions.awayWin}
            />
          </View>

          {/* Probability Breakdown */}
          <View style={styles.probabilities}>
            <View style={styles.probItem}>
              <View style={[styles.probIndicator, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.probLabel}>{prediction.homeTeam.name}</Text>
              <Text style={styles.probValue}>{prediction.predictions.homeWin}%</Text>
            </View>
            <View style={styles.probItem}>
              <View style={[styles.probIndicator, { backgroundColor: '#6b7280' }]} />
              <Text style={styles.probLabel}>Draw</Text>
              <Text style={styles.probValue}>{prediction.predictions.draw}%</Text>
            </View>
            <View style={styles.probItem}>
              <View style={[styles.probIndicator, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.probLabel}>{prediction.awayTeam.name}</Text>
              <Text style={styles.probValue}>{prediction.predictions.awayWin}%</Text>
            </View>
          </View>

          {/* Confidence Badge */}
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Prediction Confidence:</Text>
            <View style={[
              styles.confidenceBadge,
              { backgroundColor: getConfidenceColor(prediction.confidence) }
            ]}>
              <Text style={styles.confidenceText}>
                {prediction.confidence.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Match Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Key Match Stats</Text>

          {/* Recent Form */}
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Recent Form (Last 5)</Text>
            
            <View style={styles.formRow}>
              <Text style={styles.formTeam}>{prediction.homeTeam.name}</Text>
              <View style={styles.formResults}>
                {prediction.factors.recentForm.home.map((result, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.formBadge,
                      { backgroundColor: getFormColor(result) }
                    ]}
                  >
                    <Text style={styles.formText}>{result}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formTeam}>{prediction.awayTeam.name}</Text>
              <View style={styles.formResults}>
                {prediction.factors.recentForm.away.map((result, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.formBadge,
                      { backgroundColor: getFormColor(result) }
                    ]}
                  >
                    <Text style={styles.formText}>{result}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Head-to-Head */}
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Head-to-Head (Last 5 Matches)</Text>
            
            {prediction.factors.headToHead.totalMatches > 0 ? (
              <>
                <View style={styles.h2hHeader}>
                  <Text style={styles.h2hTeamLabel}>{prediction.homeTeam.name}</Text>
                  <Text style={styles.h2hVs}>vs</Text>
                  <Text style={styles.h2hTeamLabel}>{prediction.awayTeam.name}</Text>
                </View>

                <View style={styles.h2hStats}>
                  <View style={styles.h2hStatItem}>
                    <Text style={[styles.h2hValue, { color: '#ef4444' }]}>
                      {prediction.factors.headToHead.homeWins}
                    </Text>
                    <Text style={styles.h2hLabel}>Wins</Text>
                  </View>
                  
                  <View style={styles.h2hStatItem}>
                    <Text style={[styles.h2hValue, { color: '#6b7280' }]}>
                      {prediction.factors.headToHead.draws}
                    </Text>
                    <Text style={styles.h2hLabel}>Draws</Text>
                  </View>
                  
                  <View style={styles.h2hStatItem}>
                    <Text style={[styles.h2hValue, { color: '#3b82f6' }]}>
                      {prediction.factors.headToHead.awayWins}
                    </Text>
                    <Text style={styles.h2hLabel}>Wins</Text>
                  </View>
                </View>

                {prediction.factors.headToHead.lastResult !== 'N/A' && (
                  <View style={styles.lastResultContainer}>
                    <Text style={styles.lastResultLabel}>Last Result:</Text>
                    <Text style={styles.lastResultValue}>
                      {prediction.homeTeam.name.split(' ')[0]} {prediction.factors.headToHead.lastResult}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.noDataText}>No recent head-to-head history available</Text>
            )}
          </View>

          {/* Home vs Away Record */}
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Home vs Away Performance</Text>
            
            <View style={styles.recordContainer}>
              <View style={styles.recordColumn}>
                <Text style={styles.recordTeamName}>{prediction.homeTeam.name}</Text>
                <Text style={styles.recordLabel}>🏠 Playing at Home</Text>
                <Text style={[styles.recordPercentage, { color: '#16a34a' }]}>
                  {prediction.factors.homeAdvantage.homeWinRate}%
                </Text>
                <Text style={styles.recordSubtext}>Win Rate</Text>
              </View>

              <View style={styles.recordDivider} />

              <View style={styles.recordColumn}>
                <Text style={styles.recordTeamName}>{prediction.awayTeam.name}</Text>
                <Text style={styles.recordLabel}>✈️ Playing Away</Text>
                <Text style={[styles.recordPercentage, { color: '#3b82f6' }]}>
                  {prediction.factors.homeAdvantage.awayWinRate}%
                </Text>
                <Text style={styles.recordSubtext}>Win Rate</Text>
              </View>
            </View>
          </View>

          {/* Goals Average */}
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>Goals Average (Last 5 Games)</Text>
            
            <View style={styles.goalsGrid}>
              <View style={styles.goalsItem}>
                <Text style={styles.goalsLabel}>{prediction.homeTeam.name}</Text>
                <View style={styles.goalsRow}>
                  <View style={styles.goalsCell}>
                    <Text style={styles.goalsCellLabel}>Scored</Text>
                    <Text style={[styles.goalsCellValue, { color: '#16a34a' }]}>
                      {prediction.factors.goalsAverage.homeScored}
                    </Text>
                  </View>
                  <View style={styles.goalsCell}>
                    <Text style={styles.goalsCellLabel}>Conceded</Text>
                    <Text style={[styles.goalsCellValue, { color: '#ef4444' }]}>
                      {prediction.factors.goalsAverage.homeConceded}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.goalsItem}>
                <Text style={styles.goalsLabel}>{prediction.awayTeam.name}</Text>
                <View style={styles.goalsRow}>
                  <View style={styles.goalsCell}>
                    <Text style={styles.goalsCellLabel}>Scored</Text>
                    <Text style={[styles.goalsCellValue, { color: '#16a34a' }]}>
                      {prediction.factors.goalsAverage.awayScored}
                    </Text>
                  </View>
                  <View style={styles.goalsCell}>
                    <Text style={styles.goalsCellLabel}>Conceded</Text>
                    <Text style={[styles.goalsCellValue, { color: '#ef4444' }]}>
                      {prediction.factors.goalsAverage.awayConceded}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerIcon}>ℹ️</Text>
          <Text style={styles.disclaimerText}>
            Predictions are based on historical data and statistical analysis. 
            Actual match outcomes may vary.
          </Text>
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
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
  matchCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ef4444',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6b7280',
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
  chartContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  chartCenterSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  probabilities: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  probItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  probIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  probLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6b7280',
  },
  probValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTeam: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  formResults: {
    flexDirection: 'row',
    gap: 6,
  },
  formBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  h2hHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  h2hTeamLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  h2hVs: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginHorizontal: 8,
  },
  h2hStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  h2hStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  h2hValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  h2hLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  lastResultContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  lastResultLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  lastResultValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  recordContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recordColumn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
  },
  recordTeamName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  recordLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  recordPercentage: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  recordSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  recordDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  goalsGrid: {
    gap: 12,
  },
  goalsItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
  },
  goalsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  goalsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  goalsCell: {
    flex: 1,
    alignItems: 'center',
  },
  goalsCellLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  goalsCellValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  disclaimerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
});