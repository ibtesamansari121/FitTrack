import { create } from 'zustand';
import Fuse from 'fuse.js';
import { exercises as initialExercises, Exercise } from '../data/exercises';

// Re-export Exercise type for convenience
export type { Exercise };

interface ExerciseStore {
  exercises: Exercise[];
  fuseInstance: Fuse<Exercise> | null;
  
  // Initialize fuzzy search
  initializeFuzzySearch: () => void;
  
  // Get all exercises
  getAllExercises: () => Exercise[];
  
  // Get exercises by body part
  getExercisesByBodyPart: (bodyPart: string) => Exercise[];
  
  // Search exercises with fuzzy search
  searchExercises: (query: string) => Exercise[];
  
  // Legacy exact search (for other fields)
  searchExercisesExact: (query: string) => Exercise[];
  
  // Get exercise by ID
  getExerciseById: (id: string) => Exercise | undefined;
  
  // Get exercises by equipment
  getExercisesByEquipment: (equipment: string) => Exercise[];
  
  // Get exercises by target muscle
  getExercisesByTarget: (target: string) => Exercise[];
  
  // Get exercises by difficulty
  getExercisesByDifficulty: (difficulty: string) => Exercise[];
  
  // Get paginated exercises
  getPaginatedExercises: (exercises: Exercise[], limit: number, offset: number) => Exercise[];
  
  // Get all available body parts
  getBodyParts: () => string[];
  
  // Get all available equipment types
  getEquipmentTypes: () => string[];
  
  // Get all available target muscles
  getTargetMuscles: () => string[];
  
  // Get all available difficulty levels
  getDifficultyLevels: () => string[];
}

export const useExerciseStore = create<ExerciseStore>((set, get) => ({
  exercises: initialExercises,
  fuseInstance: null,
  
  initializeFuzzySearch: () => {
    const fuseOptions = {
      keys: [
        {
          name: 'name',
          weight: 0.7, // Higher weight for name matching
        },
        {
          name: 'bodyPart',
          weight: 0.1,
        },
        {
          name: 'target',
          weight: 0.1,
        },
        {
          name: 'equipment',
          weight: 0.05,
        },
        {
          name: 'secondaryMuscles',
          weight: 0.05,
        }
      ],
      threshold: 0.3, // Lower threshold = more strict matching (0 = exact, 1 = match anything)
      distance: 100, // How far from the start of the text to search
      minMatchCharLength: 2, // Minimum character length to start matching
      includeScore: true,
      shouldSort: true,
    };
    
    const fuse = new Fuse(get().exercises, fuseOptions);
    set({ fuseInstance: fuse });
  },
  
  getAllExercises: () => {
    return get().exercises;
  },
  
  getExercisesByBodyPart: (bodyPart: string) => {
    return get().exercises.filter(exercise => exercise.bodyPart === bodyPart);
  },
  
  searchExercises: (query: string) => {
    const { fuseInstance } = get();
    
    // Initialize fuse if not already done
    if (!fuseInstance) {
      get().initializeFuzzySearch();
      return get().searchExercises(query); // Retry after initialization
    }
    
    if (!query.trim()) {
      return [];
    }
    
    // Use fuzzy search primarily for name matching
    const fuseResults = fuseInstance.search(query);
    
    // Extract the items from fuse results and sort by score (lower score = better match)
    const fuzzyMatches = fuseResults
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .map(result => result.item);
    
    // For very short queries (1-2 chars), also include exact prefix matches
    if (query.length <= 2) {
      const exactPrefixMatches = get().exercises.filter(exercise => 
        exercise.name.toLowerCase().startsWith(query.toLowerCase()) &&
        !fuzzyMatches.some(fuzzy => fuzzy.id === exercise.id)
      );
      
      return [...exactPrefixMatches, ...fuzzyMatches];
    }
    
    return fuzzyMatches;
  },
  
  searchExercisesExact: (query: string) => {
    const searchTerm = query.toLowerCase();
    return get().exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm) ||
      exercise.bodyPart.toLowerCase().includes(searchTerm) ||
      exercise.target.toLowerCase().includes(searchTerm) ||
      exercise.equipment.toLowerCase().includes(searchTerm) ||
      exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchTerm)) ||
      exercise.instructions.some(instruction => instruction.toLowerCase().includes(searchTerm))
    );
  },
  
  getExerciseById: (id: string) => {
    return get().exercises.find(exercise => exercise.id === id);
  },
  
  getExercisesByEquipment: (equipment: string) => {
    return get().exercises.filter(exercise => exercise.equipment === equipment);
  },
  
  getExercisesByTarget: (target: string) => {
    return get().exercises.filter(exercise => exercise.target === target);
  },
  
  getExercisesByDifficulty: (difficulty: string) => {
    return get().exercises.filter(exercise => exercise.difficulty === difficulty);
  },
  
  getPaginatedExercises: (exercises: Exercise[], limit: number, offset: number) => {
    return exercises.slice(offset, offset + limit);
  },
  
  getBodyParts: () => {
    const bodyParts = [...new Set(get().exercises.map(exercise => exercise.bodyPart))];
    return bodyParts.sort();
  },
  
  getEquipmentTypes: () => {
    const equipment = [...new Set(get().exercises.map(exercise => exercise.equipment))];
    return equipment.sort();
  },
  
  getTargetMuscles: () => {
    const targets = [...new Set(get().exercises.map(exercise => exercise.target))];
    return targets.sort();
  },
  
  getDifficultyLevels: () => {
    const difficulties = [...new Set(get().exercises.map(exercise => exercise.difficulty))];
    return difficulties.sort();
  },
}));
