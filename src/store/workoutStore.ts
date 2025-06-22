import { create } from 'zustand';
import { WorkoutService } from '../services/workoutService';
import { WorkoutSession, ExerciseProgress } from '../types/routine';

interface WorkoutStore {
  currentWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  exerciseProgress: Record<string, ExerciseProgress>;
  weeklyConsistency: { completed: number; total: number };
  routineSummary: { thisWeek: number; thisMonth: number; streak: number };
  isLoading: boolean;
  error: string | null;

  // Actions
  startWorkout: (routineId: string, routineName: string, userId: string, exercises: any[]) => Promise<string>;
  logExercise: (workoutId: string, exerciseId: string, reps: number, weight: number) => Promise<void>;
  completeWorkout: (workoutId: string, duration: number, userId: string) => Promise<void>;
  loadWorkoutHistory: (userId: string) => Promise<void>;
  loadWeeklyConsistency: (userId: string) => Promise<void>;
  loadRoutineSummary: (userId: string) => Promise<void>;
  loadExerciseProgress: (userId: string, exerciseId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  currentWorkout: null,
  workoutHistory: [],
  exerciseProgress: {},
  weeklyConsistency: { completed: 0, total: 7 },
  routineSummary: { thisWeek: 0, thisMonth: 0, streak: 0 },
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

  logExercise: async (workoutId: string, exerciseId: string, reps: number, weight: number) => {
    set({ isLoading: true, error: null });
    try {
      await WorkoutService.logExercise(workoutId, exerciseId, reps, weight);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log exercise';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  completeWorkout: async (workoutId: string, duration: number, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      await WorkoutService.completeWorkout(workoutId, duration);
      
      // Update weekly consistency and routine summary after completing workout
      const [consistency, summary] = await Promise.all([
        WorkoutService.getWeeklyConsistency(userId),
        WorkoutService.getRoutineSummary(userId)
      ]);
      
      set({ 
        weeklyConsistency: consistency,
        routineSummary: summary 
      });
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

  loadWeeklyConsistency: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const consistency = await WorkoutService.getWeeklyConsistency(userId);
      set({ weeklyConsistency: consistency });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load weekly consistency';
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

  loadRoutineSummary: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await WorkoutService.getRoutineSummary(userId);
      set({ routineSummary: summary });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load routine summary';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
