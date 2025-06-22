import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
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
        reps: 0,
        weight: 0,
        completed: false,
      })),
    };

    const docRef = await addDoc(collection(db, WORKOUTS_COLLECTION), workoutSession);
    return docRef.id;
  }

  // Update workout progress - log exercise completion
  static async logExercise(
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ): Promise<void> {
    try {
      const workoutDocRef = doc(db, WORKOUTS_COLLECTION, workoutId);
      const workoutDoc = await getDoc(workoutDocRef);
      
      if (!workoutDoc.exists()) {
        throw new Error('Workout not found');
      }
      
      const workoutData = workoutDoc.data();
      const exercises = workoutData.exercises || [];
      
      // Find and update the specific exercise
      const updatedExercises = exercises.map((exercise: any) => {
        if (exercise.exerciseId === exerciseId) {
          return {
            ...exercise,
            reps,
            weight,
            completed: true,
            completedAt: Timestamp.now(),
          };
        }
        return exercise;
      });

      // Update the workout document
      await updateDoc(workoutDocRef, {
        exercises: updatedExercises,
        updatedAt: Timestamp.now(),
      });

      // Also save to exercise progress collection for analytics
      await this.saveExerciseProgress(
        workoutData.userId,
        exerciseId,
        exercises.find((ex: any) => ex.exerciseId === exerciseId)?.exerciseName || '',
        reps,
        weight
      );
    } catch (error) {
      throw new Error(`Failed to log exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  // Get exercise progress with weight tracking for specific period
  static async getExerciseStats(userId: string, period: 'week' | 'month' = 'week', selectedMonth?: string): Promise<{ exerciseId: string; exerciseName: string; currentWeight: number; change: number; chartData: number[] }[]> {
    try {
      const workouts = await this.getUserWorkouts(userId);
      const exerciseMap = new Map<string, { name: string; weights: { date: Date; weight: number }[] }>();

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
        endDate = now;
      } else if (period === 'month') {
        if (selectedMonth) {
          const [year, month] = selectedMonth.split('-').map(Number);
          startDate = new Date(year, month - 1, 1);
          endDate = new Date(year, month, 0); // Last day of the month
        } else {
          startDate.setDate(now.getDate() - 30);
          endDate = now;
        }
      }

      // Filter workouts within the period
      const filteredWorkouts = workouts.filter(workout => 
        workout.completedAt && 
        workout.completedAt >= startDate && 
        workout.completedAt <= endDate
      );

      // Process filtered workouts to extract exercise weights
      filteredWorkouts.forEach(workout => {
        if (workout.completedAt && workout.exercises) {
          workout.exercises.forEach(exercise => {
            if (!exerciseMap.has(exercise.exerciseId)) {
              exerciseMap.set(exercise.exerciseId, {
                name: exercise.exerciseName,
                weights: []
              });
            }

            // Add weight data if exercise is completed
            if (exercise.weight && exercise.completed) {
              exerciseMap.get(exercise.exerciseId)!.weights.push({
                date: workout.completedAt!,
                weight: exercise.weight
              });
            }
          });
        }
      });

      // Process exercise data to create stats
      const exerciseStats: { exerciseId: string; exerciseName: string; currentWeight: number; change: number; chartData: number[] }[] = [];

      exerciseMap.forEach((data, exerciseId) => {
        if (data.weights.length > 0) {
          // Sort by date
          data.weights.sort((a, b) => a.date.getTime() - b.date.getTime());
          
          // Filter out zero values and create chart data
          const validWeights = data.weights.filter(w => w.weight > 0);
          const chartData = validWeights.map(w => w.weight);
          
          // Only include if we have valid data
          if (chartData.length > 0) {
            // Calculate change percentage
            const currentWeight = chartData[chartData.length - 1];
            const previousWeight = chartData.length > 1 ? chartData[0] : currentWeight;
            const change = previousWeight > 0 ? ((currentWeight - previousWeight) / previousWeight) * 100 : 0;

            exerciseStats.push({
              exerciseId,
              exerciseName: data.name,
              currentWeight,
              change: Math.round(change),
              chartData
            });
          }
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
      
      // Group workouts by week (using Monday as start of week)
      completedWorkouts.forEach(workout => {
        const date = new Date(workout.completedAt!);
        const mondayOfWeek = new Date(date);
        const dayOfWeek = date.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
        mondayOfWeek.setDate(date.getDate() + daysToMonday);
        mondayOfWeek.setHours(0, 0, 0, 0);
        const weekKey = mondayOfWeek.toISOString().split('T')[0];
        weeklyWorkouts.set(weekKey, true);
      });

      // Count consecutive weeks from current week backwards
      let currentMondayStart = new Date(startOfWeek);
      currentMondayStart.setHours(0, 0, 0, 0);
      
      while (true) {
        const weekKey = currentMondayStart.toISOString().split('T')[0];
        if (weeklyWorkouts.has(weekKey)) {
          streak++;
          // Go to previous week
          currentMondayStart.setDate(currentMondayStart.getDate() - 7);
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
    reps: number,
    weight: number
  ): Promise<void> {
    try {
      // Check if progress document already exists for this user and exercise
      const q = query(
        collection(db, EXERCISE_PROGRESS_COLLECTION),
        where('userId', '==', userId),
        where('exerciseId', '==', exerciseId)
      );
      
      const snapshot = await getDocs(q);
      
      const newSession = {
        date: Timestamp.now(),
        reps,
        weight,
      };

      if (snapshot.empty) {
        // Create new progress document
        const progressData = {
          exerciseId,
          exerciseName,
          userId,
          lastUpdated: Timestamp.now(),
          sessions: [newSession],
        };
        await addDoc(collection(db, EXERCISE_PROGRESS_COLLECTION), progressData);
      } else {
        // Update existing progress document
        const docRef = doc(db, EXERCISE_PROGRESS_COLLECTION, snapshot.docs[0].id);
        await updateDoc(docRef, {
          lastUpdated: Timestamp.now(),
          sessions: arrayUnion(newSession),
        });
      }
    } catch (error) {
      // Silently fail to avoid breaking workout flow
      // In production, you might want to log this to a monitoring service
    }
  }
}
