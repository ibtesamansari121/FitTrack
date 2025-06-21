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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from '../components/SearchBar';
import { RoutineCard } from '../components/RoutineCard';
import { Routine } from '../types/routine';
import { useRoutineStore } from '../store/routineStore';
import { useAuthStore } from '../store/authStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import GlobalStyles from '../styles/GlobalStyles';

type RoutinesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RoutinesScreen() {
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const navigation = useNavigation<RoutinesScreenNavigationProp>();
  const { user } = useAuthStore();
  const {
    userRoutines,
    defaultRoutines,
    isLoading,
    error,
    loadUserRoutines,
    loadDefaultRoutines,
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
    const difficultyEmoji = routine.difficulty === 'beginner' ? '🟢' : 
                           routine.difficulty === 'intermediate' ? '🟡' : '🔴';
    
    const categoryEmoji = routine.category === 'strength' ? '💪' : 
                         routine.category === 'cardio' ? '❤️' : 
                         routine.category === 'flexibility' ? '🧘' : '🏃';
    
    Alert.alert(
      `${categoryEmoji} ${routine.title}`,
      `${routine.description || 'Get ready for an amazing workout!'}\n\n` +
      `📊 ${routine.exerciseCount} exercises\n` +
      `⏱️ ${routine.duration} minutes\n` +
      `${difficultyEmoji} ${routine.difficulty.charAt(0).toUpperCase() + routine.difficulty.slice(1)}\n\n` +
      `💡 Ready to start your workout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Workout', 
          onPress: () => navigation.navigate('StartWorkout', { routine })
        }
      ]
    );
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
    paddingHorizontal: 24,
    paddingTop: GlobalStyles.layout.topPadding,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
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
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
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
});
