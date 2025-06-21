import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/authService';
import { WorkoutService } from '../services/workoutService';
import GlobalStyles from '../styles/GlobalStyles';

interface ProfileStats {
  totalWorkouts: number;
  friends: number;
  achievements: number;
}

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ProfileStats>({ totalWorkouts: 0, friends: 0, achievements: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadProfileStats();
    }
  }, [user]);

  const loadProfileStats = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Get total workouts completed
      const workouts = await WorkoutService.getUserWorkouts(user.uid);
      const completedWorkouts = workouts.filter(w => w.completedAt).length;
      
      // For now, friends and achievements are static
      // In a real app, these would come from additional services
      setStats({
        totalWorkouts: completedWorkouts,
        friends: 200, // Static for demo
        achievements: 50, // Static for demo
      });
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'Choose an option',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: handleLogout, 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            await AuthService.signOut();
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const userName = user?.displayName || 'Sophia Carter';
  const userEmail = user?.email || 'sophioe@gmail.com';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSettings}>
            <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={80} color="#2196F3" />
            </View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#2196F3" />
              <Text style={styles.loadingText}>Loading stats...</Text>
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="barbell-outline" size={24} color="#2196F3" />
                <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{stats.friends}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trophy-outline" size={24} color="#FFC107" />
                <Text style={styles.statNumber}>{stats.achievements}</Text>
                <Text style={styles.statLabel}>Achievements</Text>
              </View>
            </View>
          )}
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          
          <View style={styles.activityCard}>
            <TouchableOpacity style={styles.activityItem}>
              <View style={styles.activityLeft}>
                <Ionicons name="time-outline" size={20} color="#2196F3" />
                <Text style={styles.activityText}>Workout History</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B9CB5" />
            </TouchableOpacity>
            
            <View style={styles.activityDivider} />
            
            <TouchableOpacity style={styles.activityItem}>
              <View style={styles.activityLeft}>
                <Ionicons name="trophy-outline" size={20} color="#FFC107" />
                <Text style={styles.activityText}>Achievements</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B9CB5" />
            </TouchableOpacity>
            
            <View style={styles.activityDivider} />
            
            <TouchableOpacity style={styles.activityItem}>
              <View style={styles.activityLeft}>
                <Ionicons name="person-outline" size={20} color="#4CAF50" />
                <Text style={styles.activityText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B9CB5" />
            </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  settingsButton: {
    padding: 8,
  },
  profileSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  profileCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#8B9CB5',
    textAlign: 'center',
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
  loadingCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8B9CB5',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#8B9CB5',
    fontWeight: '500',
  },
  activityCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
    marginLeft: 12,
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});
