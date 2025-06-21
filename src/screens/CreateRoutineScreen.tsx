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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import ExerciseCard from '../components/ExerciseCard';
import { ExerciseService } from '../services/exerciseService';
import { useRoutineStore } from '../store/routineStore';
import { useAuthStore } from '../store/authStore';
import { Exercise } from '../types/routine';
import { RootStackParamList } from '../navigation/AppNavigator';

type CreateRoutineScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateRoutine'>;

interface Props {
  navigation: CreateRoutineScreenNavigationProp;
}

const BODY_PARTS = [
  'back',
  'cardio', 
  'chest',
  'lower arms',
  'lower legs',
  'neck',
  'shoulders',
  'upper arms',
  'upper legs',
  'waist'
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CreateRoutineScreen({ navigation }: Props) {
  const [routineName, setRoutineName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('chest');
  const [searchQuery, setSearchQuery] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { user } = useAuthStore();
  const { createRoutine } = useRoutineStore();

  // Load exercises when body part changes
  useEffect(() => {
    loadExercises();
  }, [selectedBodyPart]);

  const loadExercises = async () => {
    setIsLoadingExercises(true);
    try {
      const data = await ExerciseService.getExercisesByBodyPart(selectedBodyPart);
      setExercises(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
    } finally {
      setIsLoadingExercises(false);
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
    const isSelected = selectedExercises.some(e => e.id === exercise.id);
    
    if (isSelected) {
      setSelectedExercises(prev => prev.filter(e => e.id !== exercise.id));
    } else {
      const newExercise: Exercise = {
        id: exercise.id,
        name: exercise.name,
        sets: 3,
        reps: 12,
        restTime: 60,
        instructions: exercise.instructions?.join(' ') || '',
        gifUrl: exercise.gifUrl || '',
      };
      setSelectedExercises(prev => [...prev, newExercise]);
    }
  };

  const updateExercise = (exerciseId: string, field: keyof Exercise, value: any) => {
    setSelectedExercises(prev => 
      prev.map(exercise => 
        exercise.id === exerciseId 
          ? { ...exercise, [field]: value }
          : exercise
      )
    );
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Please enter a routine name.');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please select at least one exercise.');
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

      const routine = {
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
      };

      await createRoutine(routine);
      
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
    } catch (error) {
      Alert.alert('Error', 'Failed to create routine. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Routine</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              placeholder="Search exercise"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8B9CB5"
            />
          </View>

          {/* Body Parts Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.bodyPartsContainer}
          >
            {BODY_PARTS.map((bodyPart) => (
              <TouchableOpacity
                key={bodyPart}
                style={[
                  styles.bodyPartButton,
                  selectedBodyPart === bodyPart && styles.bodyPartButtonSelected
                ]}
                onPress={() => setSelectedBodyPart(bodyPart)}
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

          {/* Exercises List */}
          {isLoadingExercises ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading exercises...</Text>
            </View>
          ) : (
            filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedExercises.some(e => e.id === exercise.id)}
                onToggle={() => toggleExercise(exercise)}
                selectedExercise={selectedExercises.find(e => e.id === exercise.id)}
                onUpdateExercise={updateExercise}
              />
            ))
          )}
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

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <CustomButton
          title="Save"
          onPress={handleCreateRoutine}
          loading={isCreating}
          disabled={!routineName.trim() || selectedExercises.length === 0}
        />
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
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
  saveButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
});
