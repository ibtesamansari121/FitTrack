import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useAuthStore } from '../store/authStore';
import { WorkoutService } from '../services/workoutService';
import GlobalStyles from '../styles/GlobalStyles';

const { width } = Dimensions.get('window');

interface ExerciseStat {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  change: number;
  chartData: number[];
}

interface RoutineSummary {
  thisWeek: number;
  thisMonth: number;
  streak: number;
}

export default function StatsScreen() {
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'custom'>('week');
  const [exerciseStats, setExerciseStats] = useState<ExerciseStat[]>([]);
  const [routineSummary, setRoutineSummary] = useState<RoutineSummary>({ thisWeek: 0, thisMonth: 0, streak: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadStatsData();
    }
  }, [user]);

  const loadStatsData = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Load exercise progress
      const exerciseData = await WorkoutService.getExerciseStats(user.uid);
      setExerciseStats(exerciseData);

      // Load routine summary
      const summaryData = await WorkoutService.getRoutineSummary(user.uid);
      setRoutineSummary(summaryData);
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatsData();
    setRefreshing(false);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#4CAF50' : '#F44336';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <Text style={styles.title}>Stats</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'custom'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Exercise Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Progress</Text>
          
          {exerciseStats.length > 0 ? (
            exerciseStats.map((exercise) => (
              <View key={exercise.exerciseId} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <View style={styles.exerciseStats}>
                    <Text style={styles.currentWeight}>{exercise.currentWeight} lbs</Text>
                    <Text style={[
                      styles.changeText,
                      { color: getChangeColor(exercise.change) }
                    ]}>
                      Last 7 days {formatChange(exercise.change)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.chartContainer}>
                  {exercise.chartData.length >= 2 ? (
                    <LineChart
                      data={{
                        labels: ['', '', '', '', '', '', ''], // 7 days
                        datasets: [{
                          data: exercise.chartData.length >= 7 
                            ? exercise.chartData.slice(-7)
                            : [...Array(7 - exercise.chartData.length).fill(0), ...exercise.chartData]
                        }]
                      }}
                      width={width - 88} // Container width - padding
                      height={60}
                      chartConfig={{
                        backgroundColor: 'transparent',
                        backgroundGradientFrom: 'transparent',
                        backgroundGradientTo: 'transparent',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                        style: {
                          borderRadius: 0,
                        },
                        propsForDots: {
                          r: "2",
                          strokeWidth: "1",
                          stroke: "#2196F3"
                        },
                        propsForBackgroundLines: {
                          strokeWidth: 0,
                        },
                        propsForLabels: {
                          fontSize: 0, // Hide labels
                        },
                      }}
                      bezier
                      withHorizontalLabels={false}
                      withVerticalLabels={false}
                      withInnerLines={false}
                      withOuterLines={false}
                      style={styles.chart}
                    />
                  ) : (
                    <View style={styles.noDataChart}>
                      <Text style={styles.noDataText}>Not enough data</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.daysLabels}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <Text key={day} style={styles.dayLabel}>{day}</Text>
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noDataCard}>
              <Ionicons name="barbell-outline" size={48} color="#8B9CB5" />
              <Text style={styles.noDataText}>No exercise data yet</Text>
              <Text style={styles.noDataSubtext}>Complete workouts to see your progress</Text>
            </View>
          )}
        </View>

        {/* Routine Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routine Summary</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>This Week</Text>
                <Text style={styles.summaryValue}>Completed {routineSummary.thisWeek} routines</Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={20} color="#2196F3" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>This Month</Text>
                <Text style={styles.summaryValue}>Completed {routineSummary.thisMonth} routines</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Consistency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consistency</Text>
          
          <View style={styles.consistencyCard}>
            <Text style={styles.consistencyLabel}>Weekly Streak</Text>
            <Text style={styles.streakValue}>{routineSummary.streak} Weeks</Text>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B9CB5',
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: GlobalStyles.layout.topPadding,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 32,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  periodButtonActive: {
    backgroundColor: '#2196F3',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B9CB5',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentWeight: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 12,
    height: 60,
  },
  chart: {
    borderRadius: 0,
  },
  noDataChart: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  daysLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 12,
    color: '#8B9CB5',
    fontWeight: '500',
  },
  noDataCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 12,
    color: '#8B9CB5',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#8B9CB5',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: '#8B9CB5',
  },
  consistencyCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  consistencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B9CB5',
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bottomSpacing: {
    height: 20,
  },
});
