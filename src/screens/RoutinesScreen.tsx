import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from '../components/SearchBar';
import { RoutineCard } from '../components/RoutineCard';
import { SwipeableRoutineCard } from '../components/SwipeableRoutineCard';
import { Routine } from '../types/routine';
import { useRoutineStore } from '../store/routineStore';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import GlobalStyles from '../styles/GlobalStyles';

type RoutinesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RoutinesScreen() {
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  
  const navigation = useNavigation<RoutinesScreenNavigationProp>();
  const { user } = useAuthStore();
  const {
    userRoutines,
    defaultRoutines,
    isLoading,
    error,
    loadUserRoutines,
    loadDefaultRoutines,
    deleteRoutine,
    clearError,
  } = useRoutineStore();

  // Combine user and default routines
  const allRoutines = [...userRoutines, ...defaultRoutines];

  const filteredRoutines = allRoutines.filter(routine =>
    routine.title.toLowerCase().includes(searchText.toLowerCase()) ||
    routine.category.toLowerCase().includes(searchText.toLowerCase()) ||
    routine.difficulty.toLowerCase().includes(searchText.toLowerCase())
  );

  // Load routines on component mount
  useEffect(() => {
    const loadRoutines = async () => {
      try {
        // Load default routines (will be empty now)
        await loadDefaultRoutines();
        
        // Load user routines if user is logged in
        if (user?.uid) {
          await loadUserRoutines(user.uid);
        }
      } catch (err) {
        // Error is handled by the store
      }
    };

    loadRoutines();
  }, [user, loadDefaultRoutines, loadUserRoutines]);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDefaultRoutines();
      if (user?.uid) {
        await loadUserRoutines(user.uid);
      }
    } catch (err) {
      // Error is handled by the store
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoutinePress = (routine: Routine) => {
    setSelectedRoutine(routine);
    setShowWorkoutModal(true);
  };

  const handleStartWorkout = () => {
    if (selectedRoutine) {
      setShowWorkoutModal(false);
      navigation.navigate('StartWorkout', { routine: selectedRoutine });
    }
  };

  const handleCloseModal = () => {
    setShowWorkoutModal(false);
    setSelectedRoutine(null);
  };

  const handleEditRoutine = (routine: Routine) => {
    navigation.navigate('CreateRoutine', { routine });
  };

  const handleDeleteRoutine = (routine: Routine) => {
    setRoutineToDelete(routine);
    setShowDeleteModal(true);
  };

  const confirmDeleteRoutine = async () => {
    if (routineToDelete) {
      try {
        await deleteRoutine(routineToDelete.id);
        setShowDeleteModal(false);
        setRoutineToDelete(null);
      } catch (error) {
        Alert.alert('Error', 'Failed to delete routine. Please try again.');
      }
    }
  };

  const cancelDeleteRoutine = () => {
    setShowDeleteModal(false);
    setRoutineToDelete(null);
  };

  const handleNewRoutine = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to create custom routines.');
      return;
    }
    navigation.navigate('CreateRoutine');
  };

  const handleError = () => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  };

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      handleError();
    }
  }, [error]);

  // Show loading state
  if (isLoading && allRoutines.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading routines...</Text>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Routines</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search routines"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Routines Section */}
        <View style={styles.routinesSection}>
          {user && userRoutines.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>My Routines</Text>
              {userRoutines
                .filter(routine =>
                  routine.title.toLowerCase().includes(searchText.toLowerCase()) ||
                  routine.category.toLowerCase().includes(searchText.toLowerCase()) ||
                  routine.difficulty.toLowerCase().includes(searchText.toLowerCase())
                )
                .map((routine) => (
                  <SwipeableRoutineCard
                    key={routine.id}
                    routine={routine}
                    imageSource={{ uri: routine.imageUrl }}
                    onPress={() => handleRoutinePress(routine)}
                    onEdit={() => handleEditRoutine(routine)}
                    onDelete={() => handleDeleteRoutine(routine)}
                    isUserRoutine={true}
                  />
                ))}
            </>
          )}
          
          <Text style={styles.sectionTitle}>
            {user && userRoutines.length > 0 ? 'Recommended Routines' : 'Workout Routines'}
          </Text>
          
          {defaultRoutines
            .filter(routine =>
              routine.title.toLowerCase().includes(searchText.toLowerCase()) ||
              routine.category.toLowerCase().includes(searchText.toLowerCase()) ||
              routine.difficulty.toLowerCase().includes(searchText.toLowerCase())
            )
            .map((routine) => (
              <RoutineCard
                key={routine.id}
                id={routine.id}
                title={routine.title}
                exerciseCount={routine.exerciseCount}
                duration={routine.duration}
                difficulty={routine.difficulty}
                category={routine.category}
                imageSource={{ uri: routine.imageUrl }}
                onPress={() => handleRoutinePress(routine)}
              />
            ))}
          
          {filteredRoutines.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#8B9CB5" />
              <Text style={styles.emptyStateText}>
                {searchText ? 'No routines found' : allRoutines.length === 0 ? 'No routines yet' : 'No matching routines'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {searchText 
                  ? 'Try a different search term or browse all routines' 
                  : allRoutines.length === 0 
                    ? 'Create your first routine to get started'
                    : 'Try adjusting your search filters'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for floating button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleNewRoutine}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>New Routine</Text>
      </TouchableOpacity>

      {/* Custom Workout Modal */}
      <Modal
        visible={showWorkoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedRoutine && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedRoutine.category === 'strength' ? '💪' : 
                     selectedRoutine.category === 'cardio' ? '❤️' : 
                     selectedRoutine.category === 'flexibility' ? '🧘' : '🏃'} {selectedRoutine.title}
                  </Text>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#8B9CB5" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalDescription}>
                  {selectedRoutine.description || 'Get ready for an amazing workout!'}
                </Text>
                
                <View style={styles.modalStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{selectedRoutine.exerciseCount}</Text>
                    <Text style={styles.statLabel}>exercises</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{selectedRoutine.duration}</Text>
                    <Text style={styles.statLabel}>minutes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, {
                      color: selectedRoutine.difficulty === 'beginner' ? '#4CAF50' : 
                             selectedRoutine.difficulty === 'intermediate' ? '#FF9800' : '#F44336'
                    }]}>
                      {selectedRoutine.difficulty === 'beginner' ? '🟢' : 
                       selectedRoutine.difficulty === 'intermediate' ? '🟡' : '🔴'}
                    </Text>
                    <Text style={styles.statLabel}>
                      {selectedRoutine.difficulty.charAt(0).toUpperCase() + selectedRoutine.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.modalSubtext}>💡 Ready to start your workout?</Text>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCloseModal}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
                    <Text style={styles.startButtonText}>Start Workout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeleteRoutine}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelDeleteRoutine}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Routine</Text>
              <TouchableOpacity onPress={cancelDeleteRoutine} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#8B9CB5" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Are you sure you want to delete "{routineToDelete?.title}"? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelDeleteRoutine}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmDeleteRoutine}>
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B9CB5',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // left align
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
  searchContainer: {
    paddingHorizontal: 24,
  },
  routinesSection: {
    paddingHorizontal: 24,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'left',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8B9CB5',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomSpacing: {
    height: 100, // Space for floating action button
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#8B9CB5',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B9CB5',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  modalSubtext: {
    fontSize: 16,
    color: '#8B9CB5',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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
  startButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
