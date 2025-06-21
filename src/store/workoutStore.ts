import { create } from 'zustand';
import { WorkoutService } from '../services/workoutService';
import { WorkoutSession, ExerciseProgress } from '../types/routine';

interface WorkoutStore {
  currentWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  exerciseProgress: Record<string, ExerciseProgress>;
  isLoading: boolean;
  error: string | null;

  // Actions
  startWorkout: (routineId: string, routineName: string, userId: string, exercises: any[]) => Promise<string>;
  completeWorkout: (workoutId: string, duration: number) => Promise<void>;
  loadWorkoutHistory: (userId: string) => Promise<void>;
  loadExerciseProgress: (userId: string, exerciseId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  currentWorkout: null,
  workoutHistory: [],
  exerciseProgress: {},
  isLoading: false,
  error: null,
};

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  ...initialState,

  startWorkout: async (routineId: string, routineName: string, userId: string, exercises: any[]) => {
    set({ isLoading: true, error: null });
    try {
      const workoutId = await WorkoutService.startWorkout(routineId, routineName, userId, exercises);
      return workoutId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start workout';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  completeWorkout: async (workoutId: string, duration: number) => {
    set({ isLoading: true, error: null });
    try {
      await WorkoutService.completeWorkout(workoutId, duration);
      // Optionally update local state
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete workout';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadWorkoutHistory: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const workouts = await WorkoutService.getUserWorkouts(userId);
      set({ workoutHistory: workouts });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workout history';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  loadExerciseProgress: async (userId: string, exerciseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const progress = await WorkoutService.getExerciseProgress(userId, exerciseId);
      if (progress) {
        set(state => ({
          exerciseProgress: {
            ...state.exerciseProgress,
            [exerciseId]: progress,
          },
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load exercise progress';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
