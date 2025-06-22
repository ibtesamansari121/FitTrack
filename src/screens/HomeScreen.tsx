// src/screens/HomeScreen.tsx
import React, { useState, useEffect } from "react";
import { 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { useWorkoutStore } from "../store/workoutStore";
import { RoutineService } from "../services/routineService";
import { WorkoutCard } from "../components/WorkoutCard";
import { ProgressBar } from "../components/ProgressBar";
import { RestDayIllustration } from "../components/RestDayIllustration";
import { Routine } from "../types/routine";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { TabParamList } from '../navigation/TabNavigator';
import { RootStackParamList } from '../navigation/AppNavigator';
import GlobalStyles from '../styles/GlobalStyles';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { weeklyConsistency, loadWeeklyConsistency, loadRoutineSummary } = useWorkoutStore();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  const [todaysRoutines, setTodaysRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadHomeData();
    }
  }, [user]);

  // Refresh data when screen comes into focus (e.g., after completing a workout)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid) {
        loadWeeklyConsistency(user.uid);
      }
    }, [user?.uid, loadWeeklyConsistency])
  );

  const loadHomeData = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Load today's routines
      const routines = await RoutineService.getTodaysRoutines(user.uid);
      setTodaysRoutines(routines);

      // Load weekly consistency and routine summary
      await Promise.all([
        loadWeeklyConsistency(user.uid),
        loadRoutineSummary(user.uid)
      ]);
    } catch (error) {
      // Handle error silently or show toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    setRefreshing(false);
  };

  const handleStartWorkout = (routine: Routine) => {
    navigation.navigate('StartWorkout', { routine });
  };

  const getUserGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading your workout...</Text>
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
          <View>
            <Text style={styles.appTitle}>FitTrack</Text>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText} allowFontScaling={false}>
            {getUserGreeting()}, {userName}!
          </Text>
          <Text style={styles.subWelcomeText} allowFontScaling={false}>
            {todaysRoutines.length > 0 
              ? `Ready for ${getDayName()}'s workout?` 
              : `${getDayName()} looks like a perfect rest day`}
          </Text>
        </View>

        {/* Today's Workouts or Rest Day */}
        {todaysRoutines.length > 0 ? (
          <View style={styles.cardContainer}>
            <Text style={styles.sectionTitle}>
              {getDayName()}'s Workouts ({todaysRoutines.length})
            </Text>
            {todaysRoutines.map((routine, index) => (
              <View key={routine.id} style={index > 0 ? styles.routineSpacing : undefined}>
                <WorkoutCard
                  title={routine.title}
                  exerciseCount={routine.exerciseCount}
                  imageSource={{ uri: routine.imageUrl }}
                  onStartWorkout={() => handleStartWorkout(routine)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.cardContainer}>
            <RestDayIllustration />
            <TouchableOpacity 
              style={styles.createRoutineButton}
              onPress={() => navigation.navigate('Routines')} // Navigate to routines tab
            >
              <Text style={styles.createRoutineButtonText}>Browse Routines</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weekly Consistency */}
        <View style={styles.consistencySection}>
          <Text style={styles.sectionTitle}>This Week's Progress</Text>
          <ProgressBar
            title="Workout Consistency"
            progress={weeklyConsistency.completed / weeklyConsistency.total}
            currentValue={weeklyConsistency.completed}
            maxValue={weeklyConsistency.total}
            unit="Days"
          />
          
          {/* Consistency Message */}
          <View style={styles.consistencyMessage}>
            {weeklyConsistency.completed === 0 ? (
              <Text style={styles.encouragementText}>
                💪 Start your first workout this week!
              </Text>
            ) : weeklyConsistency.completed >= 5 ? (
              <Text style={styles.congratsText}>
                🔥 Amazing! You're crushing your fitness goals!
              </Text>
            ) : (
              <Text style={styles.encouragementText}>
                ⚡ Keep going! You're {weeklyConsistency.total - weeklyConsistency.completed} workout{weeklyConsistency.total - weeklyConsistency.completed !== 1 ? 's' : ''} away from a perfect week!
              </Text>
            )}
          </View>
        </View>

        {/* Additional spacing for bottom tab bar */}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: GlobalStyles.layout.topPadding,
    paddingBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'left',
  },
  welcomeSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 36,
    marginBottom: 8,
    textAlign: 'left',
  },
  subWelcomeText: {
    fontSize: 16,
    color: '#8B9CB5',
    lineHeight: 22,
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'left',
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  routineSpacing: {
    marginTop: 16,
  },
  noWorkoutCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  noWorkoutText: {
    fontSize: 16,
    color: '#8B9CB5',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  createRoutineButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  createRoutineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  consistencySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  consistencyMessage: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  encouragementText: {
    fontSize: 14,
    color: '#8B9CB5',
    textAlign: 'center',
    lineHeight: 20,
  },
  congratsText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});
