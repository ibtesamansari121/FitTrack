import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Routine } from '../types/routine';

const ROUTINES_COLLECTION = 'routines';

export class RoutineService {
  // Get all routines for a user
  static async getUserRoutines(userId: string): Promise<Routine[]> {
    const q = query(
      collection(db, ROUTINES_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const routines = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Routine[];
    
    // Sort by updatedAt in JavaScript instead of Firestore
    return routines.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Get default/system routines
  static async getDefaultRoutines(): Promise<Routine[]> {
    // Return empty array - no default routines
    return [];
  }

  // Get a single routine by ID
  static async getRoutineById(routineId: string): Promise<Routine | null> {
    const docRef = doc(db, ROUTINES_COLLECTION, routineId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as Routine;
    }
    
    return null;
  }

  // Create a new routine
  static async createRoutine(routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, ROUTINES_COLLECTION), {
      ...routine,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  }

  // Update an existing routine
  static async updateRoutine(routineId: string, updates: Partial<Routine>): Promise<void> {
    const docRef = doc(db, ROUTINES_COLLECTION, routineId);
    const { id, createdAt, ...updateData } = updates;
    
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
  }

  // Delete a routine
  static async deleteRoutine(routineId: string): Promise<void> {
    const docRef = doc(db, ROUTINES_COLLECTION, routineId);
    await deleteDoc(docRef);
  }

  // Subscribe to user routines (real-time updates)
  static subscribeToUserRoutines(
    userId: string,
    callback: (routines: Routine[]) => void
  ): () => void {
    const q = query(
      collection(db, ROUTINES_COLLECTION),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const routines = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Routine[];
      
      callback(routines);
    });
  }

  // Subscribe to default routines (real-time updates)
  static subscribeToDefaultRoutines(
    callback: (routines: Routine[]) => void
  ): () => void {
    // Return empty array and empty unsubscribe function - no default routines
    callback([]);
    return () => {};
  }

  // Get routines for a specific day of the week
  static async getRoutinesForDay(userId: string, dayOfWeek: number): Promise<Routine[]> {
    const userRoutines = await this.getUserRoutines(userId);
    
    return userRoutines.filter(routine => 
      routine.scheduledDays && routine.scheduledDays.includes(dayOfWeek)
    );
  }

  // Get today's routines
  static async getTodaysRoutines(userId: string): Promise<Routine[]> {
    const today = new Date().getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    return this.getRoutinesForDay(userId, today);
  }

  // Get a suggested routine for today (first routine or default if none)
  static async getTodaysRoutine(userId: string): Promise<Routine | null> {
    const todaysRoutines = await this.getTodaysRoutines(userId);
    
    if (todaysRoutines.length > 0) {
      return todaysRoutines[0]; // Return the first routine for today
    }
    
    // If no routines for today, return null (rest day)
    return null;
  }

  // Update routine's scheduled days
  static async updateRoutineSchedule(routineId: string, scheduledDays: number[]): Promise<void> {
    const docRef = doc(db, ROUTINES_COLLECTION, routineId);
    await updateDoc(docRef, {
      scheduledDays,
      updatedAt: Timestamp.now(),
    });
  }
}
