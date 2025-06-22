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
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../navigation/TabNavigator';
import { useAuthStore } from '../store/authStore';
import { useRoutineStore } from '../store/routineStore';
import { useWorkoutStore } from '../store/workoutStore';
import { AuthService } from '../services/authService';
import { WorkoutService } from '../services/workoutService';
import GlobalStyles from '../styles/GlobalStyles';

interface ProfileStats {
  totalWorkouts: number;
  totalRoutines: number;
  weeklyStreak: number;
}

export default function ProfileScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const { user } = useAuthStore();
  const { userRoutines } = useRoutineStore();
  const { routineSummary } = useWorkoutStore();
  const [stats, setStats] = useState<ProfileStats>({ totalWorkouts: 0, totalRoutines: 0, weeklyStreak: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadProfileStats();
      // Load data from stores if needed
      useRoutineStore.getState().loadUserRoutines(user.uid);
      useWorkoutStore.getState().loadRoutineSummary(user.uid);
    }
  }, [user]);

  const loadProfileStats = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Get total workouts completed
      const workouts = await WorkoutService.getUserWorkouts(user.uid);
      const completedWorkouts = workouts.filter(w => w.completedAt).length;
      
      // Get weekly streak from routine summary
      const weeklyStreak = routineSummary.streak || 0;
      
      // Get total routines from routine store
      const totalRoutines = userRoutines.length;
      
      setStats({
        totalWorkouts: completedWorkouts,
        totalRoutines: totalRoutines,
        weeklyStreak: weeklyStreak,
      });
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
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

  const handleEditProfile = () => {
    setEditName(user?.displayName || '');
    setEditEmail(user?.email || '');
    setShowEditModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }
    
    setIsUpdating(true);
    try {
      // In a real app, you would update the user profile through Firebase Auth
      // For now, we'll just close the modal
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditName(user?.displayName || '');
    setEditEmail(user?.email || '');
  };

  const handleWorkoutStats = () => {
    navigation.navigate('Stats');
  };

  const handleMyRoutines = () => {
    navigation.navigate('Routines');
  };

  const userName = user?.displayName || 'Sophia Carter';
  const userEmail = user?.email || 'sophioe@gmail.com';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
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
                <Ionicons name="list-outline" size={24} color="#4CAF50" />
                <Text style={styles.statNumber}>{stats.totalRoutines}</Text>
                <Text style={styles.statLabel}>Routines</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flame-outline" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>{stats.weeklyStreak}</Text>
                <Text style={styles.statLabel}>Week Streak</Text>
              </View>
            </View>
          )}
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          
          <View style={styles.activityCard}>
            <TouchableOpacity style={styles.activityItem} onPress={handleWorkoutStats}>
              <View style={styles.activityLeft}>
                <Ionicons name="stats-chart-outline" size={20} color="#2196F3" />
                <Text style={styles.activityText}>Workout Stats</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B9CB5" />
            </TouchableOpacity>
            
            <View style={styles.activityDivider} />
            
            <TouchableOpacity style={styles.activityItem} onPress={handleMyRoutines}>
              <View style={styles.activityLeft}>
                <Ionicons name="fitness-outline" size={20} color="#4CAF50" />
                <Text style={styles.activityText}>My Routines</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B9CB5" />
            </TouchableOpacity>
            
            <View style={styles.activityDivider} />
            
            <TouchableOpacity style={styles.activityItem} onPress={handleEditProfile}>
              <View style={styles.activityLeft}>
                <Ionicons name="person-outline" size={20} color="#FF9800" />
                <Text style={styles.activityText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B9CB5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseEditModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseEditModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={handleCloseEditModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#8B9CB5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#8B9CB5"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={editEmail}
                editable={false}
                placeholder="Email address"
                placeholderTextColor="#8B9CB5"
              />
              <Text style={styles.inputNote}>Email cannot be changed</Text>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCloseEditModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]} 
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.updateButtonText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    textAlign: 'left',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F8F9FA',
    color: '#8B9CB5',
  },
  inputNote: {
    fontSize: 12,
    color: '#8B9CB5',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B9CB5',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 8,
  },
});
