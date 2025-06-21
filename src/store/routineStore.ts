import { create } from 'zustand';
import { Routine } from '../types/routine';
import { RoutineService } from '../services/routineService';

interface RoutineState {
  // State
  userRoutines: Routine[];
  defaultRoutines: Routine[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadUserRoutines: (userId: string) => Promise<void>;
  loadDefaultRoutines: () => Promise<void>;
  createRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateRoutine: (routineId: string, updates: Partial<Routine>) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  // Initial state
  userRoutines: [],
  defaultRoutines: [],
  isLoading: false,
  error: null,

  // Load user routines
  loadUserRoutines: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const routines = await RoutineService.getUserRoutines(userId);
      set({ userRoutines: routines, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load user routines',
        isLoading: false 
      });
    }
  },

  // Load default routines
  loadDefaultRoutines: async () => {
    set({ isLoading: true, error: null });
    try {
      const routines = await RoutineService.getDefaultRoutines();
      set({ defaultRoutines: routines, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load default routines',
        isLoading: false 
      });
    }
  },

  // Create a new routine
  createRoutine: async (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => {
    set({ isLoading: true, error: null });
    try {
      const routineId = await RoutineService.createRoutine(routine);
      
      // Reload user routines if it's a user routine
      if (routine.userId) {
        await get().loadUserRoutines(routine.userId);
      } else {
        // Reload default routines if it's a default routine
        await get().loadDefaultRoutines();
      }
      
      set({ isLoading: false });
      return routineId;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create routine',
        isLoading: false 
      });
      throw error;
    }
  },

  // Update an existing routine
  updateRoutine: async (routineId: string, updates: Partial<Routine>) => {
    set({ isLoading: true, error: null });
    try {
      await RoutineService.updateRoutine(routineId, updates);
      
      // Update local state
      const currentUserRoutines = get().userRoutines;
      const currentDefaultRoutines = get().defaultRoutines;
      
      // Check if it's in user routines
      const userIndex = currentUserRoutines.findIndex(r => r.id === routineId);
      if (userIndex !== -1) {
        const updatedUserRoutines = [...currentUserRoutines];
        updatedUserRoutines[userIndex] = { ...updatedUserRoutines[userIndex], ...updates };
        set({ userRoutines: updatedUserRoutines });
      }
      
      // Check if it's in default routines
      const defaultIndex = currentDefaultRoutines.findIndex(r => r.id === routineId);
      if (defaultIndex !== -1) {
        const updatedDefaultRoutines = [...currentDefaultRoutines];
        updatedDefaultRoutines[defaultIndex] = { ...updatedDefaultRoutines[defaultIndex], ...updates };
        set({ defaultRoutines: updatedDefaultRoutines });
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update routine',
        isLoading: false 
      });
      throw error;
    }
  },

  // Delete a routine
  deleteRoutine: async (routineId: string) => {
    set({ isLoading: true, error: null });
    try {
      await RoutineService.deleteRoutine(routineId);
      
      // Remove from local state
      const currentUserRoutines = get().userRoutines;
      const currentDefaultRoutines = get().defaultRoutines;
      
      set({ 
        userRoutines: currentUserRoutines.filter(r => r.id !== routineId),
        defaultRoutines: currentDefaultRoutines.filter(r => r.id !== routineId),
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete routine',
        isLoading: false 
      });
      throw error;
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
