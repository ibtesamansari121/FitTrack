import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { WorkoutSession, ExerciseProgress } from '../types/routine';

const WORKOUTS_COLLECTION = 'workouts';
const EXERCISE_PROGRESS_COLLECTION = 'exerciseProgress';

export class WorkoutService {
  // Start a new workout session
  static async startWorkout(
    routineId: string,
    routineName: string,
    userId: string,
    exercises: any[]
  ): Promise<string> {
    const workoutSession = {
      routineId,
      routineName,
      userId,
      startedAt: Timestamp.now(),
      exercises: exercises.map(exercise => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: Array.from({ length: exercise.sets }, () => ({
          reps: 0,
          weight: 0,
          completed: false,
        })),
        completedAt: null,
      })),
    };

    const docRef = await addDoc(collection(db, WORKOUTS_COLLECTION), workoutSession);
    return docRef.id;
  }

  // Update workout progress
  static async updateWorkoutProgress(
    workoutId: string,
    exerciseId: string,
    setIndex: number,
    reps: number,
    weight?: number
  ): Promise<void> {
    const docRef = doc(db, WORKOUTS_COLLECTION, workoutId);
    
    // This is a simplified update - in practice, you'd need to read the document first,
    // update the specific exercise set, and then save it back
    await updateDoc(docRef, {
      [`exercises.${exerciseId}.sets.${setIndex}`]: {
        reps,
        weight: weight || 0,
        completed: true,
      },
      updatedAt: Timestamp.now(),
    });
  }

  // Complete workout session
  static async completeWorkout(workoutId: string, duration: number): Promise<void> {
    const docRef = doc(db, WORKOUTS_COLLECTION, workoutId);
    await updateDoc(docRef, {
      completedAt: Timestamp.now(),
      duration,
    });
  }

  // Get user's workout history
  static async getUserWorkouts(userId: string): Promise<WorkoutSession[]> {
    const q = query(
      collection(db, WORKOUTS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || null,
    })) as WorkoutSession[];
  }

  // Get workout consistency for the current week
  static async getWeeklyConsistency(userId: string): Promise<{ completed: number; total: number }> {
    try {
      const workouts = await this.getUserWorkouts(userId);
      
      // Get the start of this week (Monday)
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      // Filter workouts from this week that are completed
      const thisWeekWorkouts = workouts.filter(workout => 
        workout.completedAt && 
        workout.completedAt >= startOfWeek
      );

      // Get unique days (in case user did multiple workouts in one day)
      const uniqueDays = new Set(
        thisWeekWorkouts.map(workout => 
          workout.completedAt ? workout.completedAt.toDateString() : ''
        ).filter(Boolean)
      );

      return {
        completed: uniqueDays.size,
        total: 7 // target: workout every day of the week
      };
    } catch (error) {
      return { completed: 0, total: 7 };
    }
  }

  // Get exercise progress with weight tracking
  static async getExerciseStats(userId: string): Promise<{ exerciseId: string; exerciseName: string; currentWeight: number; change: number; chartData: number[] }[]> {
    try {
      const workouts = await this.getUserWorkouts(userId);
      const exerciseMap = new Map<string, { name: string; weights: { date: Date; weight: number }[] }>();

      // Process all workouts to extract exercise weights
      workouts.forEach(workout => {
        if (workout.completedAt && workout.exercises) {
          workout.exercises.forEach(exercise => {
            if (!exerciseMap.has(exercise.exerciseId)) {
              exerciseMap.set(exercise.exerciseId, {
                name: exercise.exerciseName,
                weights: []
              });
            }

            // Add weight data if available
            exercise.sets.forEach(set => {
              if (set.weight && set.completed) {
                exerciseMap.get(exercise.exerciseId)!.weights.push({
                  date: workout.completedAt!,
                  weight: set.weight
                });
              }
            });
          });
        }
      });

      // Process exercise data to create stats
      const exerciseStats: { exerciseId: string; exerciseName: string; currentWeight: number; change: number; chartData: number[] }[] = [];

      exerciseMap.forEach((data, exerciseId) => {
        if (data.weights.length > 0) {
          // Sort by date
          data.weights.sort((a, b) => a.date.getTime() - b.date.getTime());
          
          // Get last 7 data points for chart
          const recentWeights = data.weights.slice(-7);
          const chartData = recentWeights.map(w => w.weight);
          
          // Calculate change percentage
          const currentWeight = recentWeights[recentWeights.length - 1].weight;
          const previousWeight = recentWeights.length > 1 ? recentWeights[0].weight : currentWeight;
          const change = previousWeight > 0 ? ((currentWeight - previousWeight) / previousWeight) * 100 : 0;

          exerciseStats.push({
            exerciseId,
            exerciseName: data.name,
            currentWeight,
            change: Math.round(change),
            chartData
          });
        }
      });

      return exerciseStats;
    } catch (error) {
      return [];
    }
  }

  // Get routine summary statistics
  static async getRoutineSummary(userId: string): Promise<{ thisWeek: number; thisMonth: number; streak: number }> {
    try {
      const workouts = await this.getUserWorkouts(userId);
      const completedWorkouts = workouts.filter(w => w.completedAt);

      // This week count
      const now = new Date();
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const thisWeekCount = completedWorkouts.filter(w => 
        w.completedAt! >= startOfWeek
      ).length;

      // This month count
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthCount = completedWorkouts.filter(w => 
        w.completedAt! >= startOfMonth
      ).length;

      // Calculate streak (consecutive weeks with at least one workout)
      let streak = 0;
      const weeklyWorkouts = new Map<string, boolean>();
      
      completedWorkouts.forEach(workout => {
        const date = workout.completedAt!;
        const weekStart = new Date(date);
        const dayOfWeek = date.getDay();
        const diffToMonday = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        weekStart.setDate(diffToMonday);
        const weekKey = weekStart.toISOString().split('T')[0];
        weeklyWorkouts.set(weekKey, true);
      });

      // Count consecutive weeks from current week backwards
      let currentWeekStart = new Date(startOfWeek);
      while (true) {
        const weekKey = currentWeekStart.toISOString().split('T')[0];
        if (weeklyWorkouts.has(weekKey)) {
          streak++;
          currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        } else {
          break;
        }
      }

      return {
        thisWeek: thisWeekCount,
        thisMonth: thisMonthCount,
        streak
      };
    } catch (error) {
      return { thisWeek: 0, thisMonth: 0, streak: 0 };
    }
  }

  // Get exercise progress for a specific exercise
  static async getExerciseProgress(userId: string, exerciseId: string): Promise<ExerciseProgress | null> {
    const q = query(
      collection(db, EXERCISE_PROGRESS_COLLECTION),
      where('userId', '==', userId),
      where('exerciseId', '==', exerciseId)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      sessions: doc.data().sessions?.map((session: any) => ({
        ...session,
        date: session.date?.toDate() || new Date(),
      })) || [],
    } as ExerciseProgress;
  }

  // Save exercise progress
  static async saveExerciseProgress(
    userId: string,
    exerciseId: string,
    exerciseName: string,
    sets: any[]
  ): Promise<void> {
    const progressData = {
      exerciseId,
      exerciseName,
      userId,
      lastUpdated: Timestamp.now(),
      sessions: [{
        date: Timestamp.now(),
        sets,
      }],
    };

    // In a real implementation, you'd want to append to existing sessions
    // rather than replace them
    await addDoc(collection(db, EXERCISE_PROGRESS_COLLECTION), progressData);
  }
}
