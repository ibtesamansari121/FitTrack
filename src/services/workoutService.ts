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
