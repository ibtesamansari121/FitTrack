import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { Exercise } from '../types/routine';
import AnimatedGif from '../components/AnimatedGif';
import { RootStackParamList } from '../navigation/AppNavigator';
import GlobalStyles from '../styles/GlobalStyles';

type StartWorkoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StartWorkout'>;
type StartWorkoutScreenRouteProp = RouteProp<RootStackParamList, 'StartWorkout'>;

interface Props {
  navigation: StartWorkoutScreenNavigationProp;
  route: StartWorkoutScreenRouteProp;
}

interface ExerciseState {
  exercise: Exercise;
  reps: number;
  weight: number;
  completed: boolean;
}

const { width } = Dimensions.get('window');

export default function StartWorkoutScreen({ navigation, route }: Props) {
  const { routine } = route.params;
  const { user } = useAuthStore();
  const { startWorkout: startWorkoutSession, logExercise, completeWorkout: completeWorkoutSession } = useWorkoutStore();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([]);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [startTime] = useState(new Date());
  const [showSetModal, setShowSetModal] = useState(false);
  const [tempReps, setTempReps] = useState('');
  const [tempWeight, setTempWeight] = useState('');

  useEffect(() => {
    initializeWorkout();
  }, []);

  const initializeWorkout = async () => {
    if (!user?.uid) return;

    try {
      // Initialize exercise states
      const states: ExerciseState[] = routine.exercises.map((exercise: Exercise) => ({
        exercise,
        reps: 0,
        weight: 0,
        completed: false,
      }));
      setExerciseStates(states);

      // Start workout session using the store
      const id = await startWorkoutSession(
        routine.id,
        routine.title,
        user.uid,
        routine.exercises
      );
      setWorkoutId(id);
    } catch (error) {
      Alert.alert('Error', 'Failed to start workout. Please try again.');
    }
  };

  const currentExercise = exerciseStates[currentExerciseIndex];
  const totalExercises = exerciseStates.length;
  const progress = totalExercises > 0 ? (currentExerciseIndex + 1) / totalExercises : 0;

  const openSetModal = () => {
    if (currentExercise) {
      setTempReps(currentExercise.reps.toString());
      setTempWeight(currentExercise.weight.toString());
      setShowSetModal(true);
    }
  };

  const saveSet = async () => {
    if (!currentExercise || !workoutId) return;

    const reps = parseInt(tempReps) || 0;
    const weight = parseFloat(tempWeight) || 0;

    try {
      // Log exercise to Firestore
      await logExercise(workoutId, currentExercise.exercise.id, reps, weight);

      // Update local state
      setExerciseStates(prev => 
        prev.map((state, index) => {
          if (index === currentExerciseIndex) {
            return {
              ...state,
              reps,
              weight,
              completed: true,
            };
          }
          return state;
        })
      );

      setShowSetModal(false);
      setTempReps('');
      setTempWeight('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save exercise. Please try again.');
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      completeWorkout();
    }
  };

  const previousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  const completeWorkout = async () => {
    if (!workoutId || !user?.uid) return;

    try {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
      
      await completeWorkoutSession(workoutId, duration, user.uid);
      
      Alert.alert(
        'Workout Complete!',
        `Great job! You completed your workout in ${duration} minutes.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const exitWorkout = () => {
    Alert.alert(
      'Exit Workout',
      'Are you sure you want to exit? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  if (!currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={exitWorkout}>
          <Ionicons name="close" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentExerciseIndex + 1}/{totalExercises}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Image */}
        <View style={styles.imageContainer}>
          <AnimatedGif 
            source={{ uri: currentExercise.exercise.gifUrl || 'https://via.placeholder.com/400x300?text=Exercise' }}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        </View>

        {/* Exercise Name */}
        <Text style={styles.exerciseName}>{currentExercise.exercise.name}</Text>

        {/* Current Exercise Info */}
        <View style={styles.setInfoContainer}>
          <Text style={styles.setInfoText}>
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>

        {/* Current Exercise State */}
        <View style={styles.setsContainer}>
          <View style={[
            styles.setItem,
            !currentExercise.completed && styles.currentSetItem,
            currentExercise.completed && styles.completedSetItem,
          ]}>
            <Text style={styles.setNumber}>1</Text>
            <View style={styles.setDetails}>
              <Text style={styles.setLabel}>Reps</Text>
              <Text style={styles.setValue}>{currentExercise.reps || '—'}</Text>
            </View>
            <View style={styles.setDetails}>
              <Text style={styles.setLabel}>Weight</Text>
              <Text style={styles.setValue}>{currentExercise.weight ? `${currentExercise.weight}kg` : '—'}</Text>
            </View>
            <View style={styles.setStatus}>
              {currentExercise.completed ? (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              ) : (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={openSetModal}
                >
                  <Ionicons name="add" size={20} color="#2196F3" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          style={[styles.navButton, currentExerciseIndex === 0 && styles.disabledButton]}
          onPress={previousExercise}
          disabled={currentExerciseIndex === 0}
        >
          <Text style={[styles.navButtonText, currentExerciseIndex === 0 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={currentExercise.completed ? nextExercise : openSetModal}
        >
          <Text style={styles.navButtonText}>
            {currentExerciseIndex === totalExercises - 1 && currentExercise.completed 
              ? 'Finish' 
              : currentExercise.completed 
                ? 'Next' 
                : 'Log Exercise'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Set Input Modal */}
      <Modal
        visible={showSetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Set</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reps</Text>
              <TextInput
                style={styles.input}
                value={tempReps}
                onChangeText={setTempReps}
                keyboardType="numeric"
                placeholder="0"
                selectTextOnFocus
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Weight (kg) - Optional</Text>
              <TextInput
                style={styles.input}
                value={tempWeight}
                onChangeText={setTempWeight}
                keyboardType="numeric"
                placeholder="0"
                selectTextOnFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveSet}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // left align
    paddingHorizontal: 24,
    paddingTop: GlobalStyles.layout.topPadding,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'left',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'left',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#2D5441',
  },
  exerciseImage: {
    width: width - 32,
    height: 250,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  setInfoContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  setInfoText: {
    fontSize: 16,
    color: '#8B9CB5',
  },
  setsContainer: {
    paddingHorizontal: 16,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currentSetItem: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  completedSetItem: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  setNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    width: 30,
  },
  setDetails: {
    flex: 1,
    alignItems: 'center',
  },
  setLabel: {
    fontSize: 12,
    color: '#8B9CB5',
    marginBottom: 4,
  },
  setValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  setStatus: {
    width: 40,
    alignItems: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStatus: {
    width: 24,
    height: 24,
  },
  bottomNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    marginHorizontal: 8,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#F5F5F5',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#8B9CB5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B9CB5',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
