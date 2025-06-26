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
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CustomInput } from '../components/CustomInput';
import ExerciseCard from '../components/ExerciseCard';
import AnimatedGif from '../components/AnimatedGif';
import { ExerciseService } from '../services/exerciseService';
import { useRoutineStore } from '../store/routineStore';
import { useAuthStore } from '../store/authStore';
import { Exercise } from '../types/routine';
import { RootStackParamList } from '../navigation/AppNavigator';
import GlobalStyles from '../styles/GlobalStyles';

type CreateRoutineScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateRoutine'>;
type CreateRoutineScreenRouteProp = RouteProp<RootStackParamList, 'CreateRoutine'>;

interface Props {
  navigation: CreateRoutineScreenNavigationProp;
  route: CreateRoutineScreenRouteProp;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const { width } = Dimensions.get('window');

const CreateRoutineScreen = ({ navigation, route }: Props) => {
  const [routineName, setRoutineName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreExercises, setHasMoreExercises] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<any>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  const { user } = useAuthStore();
  const { createRoutine, updateRoutine } = useRoutineStore();

  // Get routine data for editing
  const editingRoutine = route.params?.routine;
  const isEditing = !!editingRoutine;

  // Initialize form data for editing
  useEffect(() => {
    if (isEditing && editingRoutine) {
      setRoutineName(editingRoutine.title || '');

      // Convert scheduledDays numbers back to day strings
      if (editingRoutine.scheduledDays) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayStrings = editingRoutine.scheduledDays.map((dayNum: number) => dayNames[dayNum]).filter(Boolean);
        setSelectedDays(dayStrings);
      }

      setSelectedExercises(editingRoutine.exercises || []);
    }
  }, [isEditing, editingRoutine]);

  // Load body parts from API
  useEffect(() => {
    const loadBodyParts = async () => {
      try {
        const parts = await ExerciseService.getBodyParts();
        setBodyParts(parts);
        // Set first body part as default if not set
        if (parts.length > 0 && !selectedBodyPart) {
          setSelectedBodyPart(parts[0]);
        }
      } catch (error) {
        console.error('Error loading body parts:', error);
        // Use fallback body parts
        const fallbackParts = [
          'back', 'cardio', 'chest', 'lower arms', 'lower legs',
          'neck', 'shoulders', 'upper arms', 'upper legs', 'waist'
        ];
        setBodyParts(fallbackParts);
        if (!selectedBodyPart) {
          setSelectedBodyPart(fallbackParts[0]);
        }
      }
    };

    loadBodyParts();
  }, []);

  useEffect(() => {
    console.log('selectedBodyPart effect triggered:', selectedBodyPart);
    if (selectedBodyPart) {
      loadExercises(true);
    }
  }, [selectedBodyPart]);

  // Handle search with debouncing
  useEffect(() => {
    console.log('search effect triggered:', { searchQuery, selectedBodyPart, isSearchMode });
    // Don't run on initial mount when selectedBodyPart is not set yet
    if (!selectedBodyPart) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        console.log('Switching to search mode');
        setIsSearchMode(true);
        loadSearchResults(true);
      } else if (searchQuery.trim().length === 0 && isSearchMode) {
        // Only reset to body part view if we were previously in search mode
        console.log('Switching back to body part mode');
        setIsSearchMode(false);
        loadExercises(true);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedBodyPart, isSearchMode]);

  const loadSearchResults = async (reset: boolean = false) => {
    if (reset) {
      setExercises([]);
      setCurrentOffset(0);
      setHasMoreExercises(true);
    }

    setIsLoadingExercises(true);

    try {
      const offset = reset ? 0 : currentOffset;
      const results = await ExerciseService.searchExercises(searchQuery.trim(), 20, offset);

      if (reset) {
        setExercises(results);
      } else {
        setExercises(prev => [...prev, ...results]);
      }

      setHasMoreExercises(results.length === 20);
      setCurrentOffset(offset + results.length);
    } catch (error) {
      console.error('Error searching exercises:', error);
      Alert.alert('Error', 'Failed to search exercises. Please try again.');
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const loadExercises = async (reset: boolean = false) => {
    console.log('loadExercises called with reset:', reset, 'selectedBodyPart:', selectedBodyPart);
    
    if (reset) {
      setExercises([]);
      setCurrentOffset(0);
      setHasMoreExercises(true);
    }

    if (!selectedBodyPart) {
      console.log('No selectedBodyPart, returning early');
      return;
    }

    setIsLoadingExercises(true);

    try {
      // Use new ExerciseService with body part filtering
      console.log('Loading exercises for body part:', selectedBodyPart);
      const offset = reset ? 0 : currentOffset;
      const results = await ExerciseService.getExercisesByBodyPart(selectedBodyPart, 20, offset);
      console.log('Loaded exercises:', results.length);

      if (reset) {
        setExercises(results);
      } else {
        setExercises(prev => [...prev, ...results]);
      }

      setHasMoreExercises(results.length === 20);
      setCurrentOffset(offset + results.length);
    } catch (error) {
      console.error('Error loading exercises:', error);
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const loadMoreExercises = async () => {
    if (!hasMoreExercises || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      if (isSearchMode && searchQuery.trim().length >= 2) {
        // Load more search results
        const results = await ExerciseService.searchExercises(searchQuery.trim(), 20, currentOffset);
        setExercises(prev => [...prev, ...results]);
        setHasMoreExercises(results.length === 20);
        setCurrentOffset(prev => prev + results.length);
      } else {
        // Load more exercises by body part
        const results = await ExerciseService.getExercisesByBodyPart(selectedBodyPart, 20, currentOffset);
        setExercises(prev => [...prev, ...results]);
        setHasMoreExercises(results.length === 20);
        setCurrentOffset(prev => prev + results.length);
      }
    } catch (error) {
      console.error('Error loading more exercises:', error);
      Alert.alert('Error', 'Failed to load more exercises. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const toggleExercise = (exercise: any) => {
    // Use exerciseId as primary identifier, fallback to id for compatibility
    const exerciseIdentifier = exercise.exerciseId || exercise.id;
    const isSelected = selectedExercises.some(e => e.id === exerciseIdentifier);

    if (isSelected) {
      setSelectedExercises(prev => prev.filter(e => e.id !== exerciseIdentifier));
    } else {
      const newExercise: Exercise = {
        id: exerciseIdentifier,
        name: exercise.name,
        sets: 3,
        reps: 12,
        restTime: 60,
        instructions: Array.isArray(exercise.instructions)
          ? exercise.instructions.join(' ')
          : exercise.instructions || '',
        gifUrl: exercise.gifUrl || '',
      };
      setSelectedExercises(prev => [...prev, newExercise]);
    }
  };

  const handleBodyPartChange = (bodyPart: string) => {
    setSelectedBodyPart(bodyPart);
    // Clear search when changing body part
    if (searchQuery.trim().length > 0) {
      setSearchQuery('');
      setIsSearchMode(false);
    }
  };

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name.');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please select at least one exercise.');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day for the routine.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to create a routine.');
      return;
    }

    setIsCreating(true);
    try {
      // Calculate estimated duration (2 minutes per set + rest time)
      const estimatedDuration = selectedExercises.reduce((total, exercise) => {
        const exerciseTime = exercise.sets * 2; // 2 minutes per set
        const restTime = exercise.sets * (exercise.restTime || 60) / 60; // rest time in minutes
        return total + exerciseTime + restTime;
      }, 0);

      // Convert selected days to numbers (0=Sunday, 1=Monday, etc.)
      const dayMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
      const scheduledDays = selectedDays.map(day => dayMap[day as keyof typeof dayMap]).filter(day => day !== undefined);

      const routineData = {
        title: routineName.trim(),
        description: `Custom routine with ${selectedExercises.length} exercises`,
        exerciseCount: selectedExercises.length,
        duration: Math.ceil(estimatedDuration),
        difficulty: (selectedExercises.length <= 3 ? 'beginner' :
          selectedExercises.length <= 6 ? 'intermediate' : 'advanced') as 'beginner' | 'intermediate' | 'advanced',
        category: 'mixed' as const,
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        exercises: selectedExercises,
        userId: user.uid,
        isDefault: false,
        scheduledDays: scheduledDays,
      };

      if (isEditing && editingRoutine) {
        // Update existing routine
        await updateRoutine(editingRoutine.id, routineData);
        Alert.alert(
          'Success!',
          'Your routine has been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            }
          ]
        );
      } else {
        // Create new routine
        await createRoutine(routineData);
        Alert.alert(
          'Success!',
          'Your routine has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} routine. Please try again.`);
    } finally {
      setIsCreating(false);
    }
  };

  const showExerciseInfo = (exercise: any) => {
    setSelectedExerciseInfo(exercise);
    setShowExerciseModal(true);
  };

  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setSelectedExerciseInfo(null);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: GlobalStyles.layout.topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Routine' : 'Create Routine'}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;

          if (isCloseToBottom && hasMoreExercises && !isLoadingMore && !isLoadingExercises) {
            loadMoreExercises();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Routine Name */}
        <View style={styles.section}>
          <CustomInput
            placeholder="Routine name"
            value={routineName}
            onChangeText={setRoutineName}
            style={styles.routineNameInput}
          />
        </View>

        {/* Days Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Days</Text>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day) && styles.dayButtonSelected
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDays.includes(day) && styles.dayButtonTextSelected
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#8B9CB5" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8B9CB5"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setIsSearchMode(false);
                }}
                style={styles.clearSearchButton}
              >
                <Ionicons name="close" size={20} color="#8B9CB5" />
              </TouchableOpacity>
            )}
          </View>

          {/* Body Parts Filter */}
          {!isSearchMode && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bodyPartsContainer}
            >
              {bodyParts.map((bodyPart) => (
                <TouchableOpacity
                  key={bodyPart}
                  style={[
                    styles.bodyPartButton,
                    selectedBodyPart === bodyPart && styles.bodyPartButtonSelected
                  ]}
                  onPress={() => handleBodyPartChange(bodyPart)}
                >
                  <Text style={[
                    styles.bodyPartButtonText,
                    selectedBodyPart === bodyPart && styles.bodyPartButtonTextSelected
                  ]}>
                    {bodyPart.charAt(0).toUpperCase() + bodyPart.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Search Results Header */}
          {isSearchMode && searchQuery.length >= 2 && (
            <View style={styles.searchHeaderContainer}>
              <Text style={styles.searchHeaderText}>
                Search results for "{searchQuery}"
              </Text>
              <Text style={styles.searchResultsCount}>
                {exercises.length} exercises found
              </Text>
            </View>
          )}

          {/* Exercises List */}
          <View style={styles.exercisesContainer}>
            {isLoadingExercises ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>
                  {isSearchMode ? 'Searching exercises...' : 'Loading exercises...'}
                </Text>
              </View>
            ) : (
              <>
                {exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.exerciseId || exercise.id}
                    exercise={exercise}
                    isSelected={selectedExercises.some(e => e.id === (exercise.exerciseId || exercise.id))}
                    onToggle={() => toggleExercise(exercise)}
                    onShowInfo={() => showExerciseInfo(exercise)}
                  />
                ))}
                {hasMoreExercises && exercises.length > 0 && (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMoreExercises}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <ActivityIndicator size="small" color="#2196F3" />
                    ) : (
                      <Text style={styles.loadMoreButtonText}>Load More Exercises</Text>
                    )}
                  </TouchableOpacity>
                )}
                {!hasMoreExercises && exercises.length > 0 && (
                  <View style={styles.endOfListContainer}>
                    <Text style={styles.endOfListText}>No more exercises to load</Text>
                  </View>
                )}
                {exercises.length === 0 && !isLoadingExercises && (
                  <View style={styles.emptyStateContainer}>
                    <Text style={styles.emptyStateText}>
                      {isSearchMode
                        ? `No exercises found for "${searchQuery}"`
                        : `No exercises found for ${selectedBodyPart}`
                      }
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Selected Exercises Summary */}
        {selectedExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Selected Exercises ({selectedExercises.length})
            </Text>
            {selectedExercises.map((exercise) => (
              <View key={exercise.id} style={styles.selectedExerciseItem}>
                <Text style={styles.selectedExerciseName}>{exercise.name}</Text>
                <Text style={styles.selectedExerciseDetails}>
                  {exercise.sets} sets • {exercise.reps} reps
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!routineName.trim() || selectedExercises.length === 0 || selectedDays.length === 0) && styles.createButtonDisabled
          ]}
          onPress={handleCreateRoutine}
          disabled={isCreating || !routineName.trim() || selectedExercises.length === 0 || selectedDays.length === 0}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[
              styles.createButtonText,
              (!routineName.trim() || selectedExercises.length === 0 || selectedDays.length === 0) && styles.createButtonTextDisabled
            ]}>
              {isEditing ? 'Update Routine' : 'Create Routine'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Exercise Info Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeExerciseModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeExerciseModal}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Exercise Info</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedExerciseInfo && (
            <ScrollView style={styles.modalContent}>
              <AnimatedGif
                source={{ uri: selectedExerciseInfo.gifUrl || 'https://via.placeholder.com/400x300?text=Exercise' }}
                style={styles.exerciseGif}
                resizeMode="contain"
              />

              <View style={styles.modalDetails}>
                <Text style={styles.exerciseName}>{selectedExerciseInfo.name}</Text>

                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedExerciseInfo.bodyPart}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedExerciseInfo.target}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedExerciseInfo.equipment}</Text>
                  </View>
                </View>

                {selectedExerciseInfo.instructions && selectedExerciseInfo.instructions.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Instructions</Text>
                    {selectedExerciseInfo.instructions.map((instruction: string, index: number) => (
                      <Text key={index} style={styles.instructionText}>
                        {index + 1}. {instruction}
                      </Text>
                    ))}
                  </>
                )}

                {selectedExerciseInfo.secondaryMuscles && selectedExerciseInfo.secondaryMuscles.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Secondary Muscles</Text>
                    <Text style={styles.detailText}>
                      {selectedExerciseInfo.secondaryMuscles.join(', ')}
                    </Text>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // left align
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
    textAlign: 'left',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'left',
  },
  routineNameInput: {
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 60,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#2196F3',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B9CB5',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  bodyPartsContainer: {
    marginBottom: 16,
  },
  bodyPartButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  bodyPartButtonSelected: {
    backgroundColor: '#2196F3',
  },
  bodyPartButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8B9CB5',
  },
  bodyPartButtonTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B9CB5',
    marginTop: 12,
  },
  selectedExerciseItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  selectedExerciseDetails: {
    fontSize: 14,
    color: '#8B9CB5',
  },
  bottomSpacing: {
    height: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
  },
  exerciseGif: {
    width: width,
    height: 250,
    backgroundColor: '#F5F5F5',
  },
  modalDetails: {
    padding: 24,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
    marginTop: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  createButtonContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  createButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  createButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  createButtonTextDisabled: {
    color: '#8B9CB5',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: 14,
    color: '#8B9CB5',
    fontStyle: 'italic',
  },
  exercisesContainer: {
    flex: 1,
  },
  loadMoreButton: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  clearSearchButton: {
    padding: 4,
  },
  searchHeaderContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  searchResultsCount: {
    fontSize: 14,
    color: '#8B9CB5',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8B9CB5',
    textAlign: 'center',
  },
});

export default CreateRoutineScreen;
