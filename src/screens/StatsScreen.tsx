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
import { useWorkoutStore } from '../store/workoutStore';
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

interface MonthOption {
  value: string;
  label: string;
}

export default function StatsScreen() {
  const { user } = useAuthStore();
  const { routineSummary, loadRoutineSummary } = useWorkoutStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [availableMonths, setAvailableMonths] = useState<MonthOption[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadAvailableMonths();
      loadStatsData();
    }
  }, [user, selectedPeriod, selectedMonth]);

  const loadAvailableMonths = async () => {
    if (!user?.uid) return;
    
    try {
      const workouts = await WorkoutService.getUserWorkouts(user.uid);
      const months = new Set<string>();
      
      workouts.forEach(workout => {
        if (workout.completedAt) {
          const monthKey = `${workout.completedAt.getFullYear()}-${String(workout.completedAt.getMonth() + 1).padStart(2, '0')}`;
          months.add(monthKey);
        }
      });

      const monthOptions = Array.from(months)
        .sort()
        .map(monthKey => {
          const [year, month] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return {
            value: monthKey,
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          };
        });

      setAvailableMonths(monthOptions);
      
      // Set current month as default if available
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      if (monthOptions.some(m => m.value === currentMonth)) {
        setSelectedMonth(currentMonth);
      } else if (monthOptions.length > 0) {
        setSelectedMonth(monthOptions[monthOptions.length - 1].value);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const loadStatsData = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Load exercise progress and routine summary in parallel
      const [exerciseData] = await Promise.all([
        WorkoutService.getExerciseStats(user.uid, selectedPeriod, selectedMonth),
        loadRoutineSummary(user.uid)
      ]);
      setExerciseStats(exerciseData);
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
          {(['week', 'month'] as const).map((period) => (
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

        {/* Month Selector (shown when month is selected) */}
        {selectedPeriod === 'month' && availableMonths.length > 0 && (
          <View style={styles.monthSelector}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthScrollContainer}
            >
              {availableMonths.map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={[
                    styles.monthButton,
                    selectedMonth === month.value && styles.monthButtonActive
                  ]}
                  onPress={() => setSelectedMonth(month.value)}
                >
                  <Text style={[
                    styles.monthButtonText,
                    selectedMonth === month.value && styles.monthButtonTextActive
                  ]}>
                    {month.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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
                      {selectedPeriod === 'week' ? 'Last 7 days' : 'This month'} {formatChange(exercise.change)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.chartContainer}>
                  {exercise.chartData.length >= 2 ? (
                    <View style={styles.chartWrapper}>
                      <LineChart
                        data={{
                          labels: exercise.chartData.map(() => ''),
                          datasets: [{
                            data: exercise.chartData.length > 0 ? exercise.chartData : [0],
                            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                            strokeWidth: 3,
                          }]
                        }}
                        width={width - 130}
                        height={84}
                        chartConfig={{
                          backgroundColor: '#FFFFFF',
                          backgroundGradientFrom: '#FFFFFF',
                          backgroundGradientTo: '#FFFFFF',
                          decimalPlaces: 0,
                          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                          strokeWidth: 3,
                          propsForDots: {
                            r: "3",
                            strokeWidth: "2",
                            stroke: "#2196F3",
                            fill: "#FFFFFF",
                          },
                          propsForBackgroundLines: {
                            strokeWidth: 0,
                          },
                          propsForLabels: {
                            fontSize: 0,
                          },
                        }}
                        bezier
                        withHorizontalLabels={false}
                        withVerticalLabels={false}
                        withInnerLines={false}
                        withOuterLines={false}
                        withShadow={false}
                        style={styles.chart}
                      />
                    </View>
                  ) : (
                    <View style={styles.noDataChart}>
                      <Ionicons name="trending-up-outline" size={24} color="#8B9CB5" />
                      <Text style={styles.noDataText}>Not enough data</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.daysLabels}>
                  {selectedPeriod === 'week' ? (
                    <Text style={styles.periodLabel}>Last 7 days progress</Text>
                  ) : (
                    <Text style={styles.periodLabel}>
                      {selectedMonth ? availableMonths.find(m => m.value === selectedMonth)?.label : 'Monthly'} progress
                    </Text>
                  )}
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
          <Text style={styles.sectionTitle}>Consistency Tracking</Text>
          
          <View style={styles.consistencyCard}>
            <View style={styles.consistencyHeader}>
              <Ionicons name="flame" size={32} color="#FF6B35" />
              <Text style={styles.streakValue}>{routineSummary.streak}</Text>
              <Text style={styles.consistencyLabel}>Week Streak</Text>
            </View>
            <Text style={styles.consistencyDescription}>
              Consecutive weeks with at least one completed workout
            </Text>
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
    justifyContent: 'flex-start',
    paddingTop: GlobalStyles.layout.topPadding,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'left',
    flex: 1,
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
  monthSelector: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  monthScrollContainer: {
    paddingRight: 24,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 120,
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: '#2196F3',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B9CB5',
  },
  monthButtonTextActive: {
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
    textAlign: 'left',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  exerciseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentWeight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    marginBottom: 12,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  chart: {
    borderRadius: 8,
    paddingRight: 0,
    backgroundColor: '#FFFFFF',
  },
  noDataChart: {
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  daysLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  periodLabel: {
    fontSize: 11,
    color: '#8B9CB5',
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
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
    padding: 24,
    alignItems: 'center',
  },
  consistencyHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  consistencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B9CB5',
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  consistencyDescription: {
    fontSize: 12,
    color: '#8B9CB5',
    textAlign: 'center',
    lineHeight: 16,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
