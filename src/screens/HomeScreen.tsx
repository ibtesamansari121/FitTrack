// src/screens/HomeScreen.tsx
import React from "react";
import { 
  Text, 
  SafeAreaView, 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from "react-native";
import { useAuthStore } from "../store/authStore";
import { Ionicons } from '@expo/vector-icons';
import { WorkoutCard } from "../components/WorkoutCard";
import { ProgressBar } from "../components/ProgressBar";

export default function HomeScreen() {
  const { user } = useAuthStore();

  const handleStartWorkout = () => {
    Alert.alert('Start Workout', 'Workout feature coming soon!');
  };

  const handleSettings = () => {
    Alert.alert('Settings', 'Settings feature coming soon!');
  };

  const userName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>FitTrack</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Hi, {userName}, Ready to crush today?
          </Text>
        </View>

        {/* Workout Card */}
        <View style={styles.cardContainer}>
          <WorkoutCard
            title="Chest + Triceps"
            exerciseCount={6}
            imageSource={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop' }}
            onStartWorkout={handleStartWorkout}
          />
        </View>

        {/* Weekly Consistency */}
        <View style={styles.consistencySection}>
          <ProgressBar
            title="Weekly Consistency"
            progress={0.6}
            currentValue={3}
            maxValue={5}
            unit="Days"
          />
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  settingsButton: {
    padding: 8,
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
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  consistencySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  bottomSpacing: {
    height: 20,
  },
});
