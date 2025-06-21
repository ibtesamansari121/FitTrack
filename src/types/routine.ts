// Workout routine types for FitTrack app
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Can be "30 sec" for time-based exercises
  weight?: number;
  restTime?: number; // in seconds
  instructions?: string;
  gifUrl?: string; // Exercise demonstration GIF URL
}

export interface Routine {
  id: string;
  title: string;
  description?: string;
  exerciseCount: number;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  imageUrl: string;
  exercises: Exercise[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // For user-created routines
  isDefault?: boolean; // For app-provided routines
}

export interface RoutineStats {
  timesCompleted: number;
  lastCompleted?: Date;
  averageDuration: number;
  totalTimeSpent: number; // in minutes
}

// Workout tracking types
export interface WorkoutExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  completedAt: Date;
}

export interface WorkoutSet {
  reps: number;
  weight?: number;
  completed: boolean;
  restTime?: number; // actual rest time taken
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in minutes
  exercises: WorkoutExerciseLog[];
  notes?: string;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  userId: string;
  sessions: {
    date: Date;
    sets: WorkoutSet[];
  }[];
}
