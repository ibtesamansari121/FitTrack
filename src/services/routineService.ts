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
    const q = query(
      collection(db, ROUTINES_COLLECTION),
      where('isDefault', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const routines = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Routine[];
    
    // Sort by title in JavaScript instead of Firestore
    return routines.sort((a, b) => a.title.localeCompare(b.title));
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
    const q = query(
      collection(db, ROUTINES_COLLECTION),
      where('isDefault', '==', true),
      orderBy('title', 'asc')
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

  // Initialize default routines (for app setup)
  static async initializeDefaultRoutines(): Promise<void> {
    // Check if default routines already exist
    const existingDefaults = await this.getDefaultRoutines();
    if (existingDefaults.length > 0) {
      return; // Default routines already initialized
    }

    const defaultRoutines = await this.getDefaultRoutinesData();
    
    // Add each default routine to Firestore
    for (const routine of defaultRoutines) {
      await this.createRoutine(routine);
    }
  }

  // Get default routines data (dummy data for initialization)
  private static async getDefaultRoutinesData(): Promise<Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>[]> {
    return [
      {
        title: 'Full Body Strength',
        description: 'A comprehensive strength training routine targeting all major muscle groups',
        exerciseCount: 6,
        duration: 45,
        difficulty: 'intermediate',
        category: 'strength',
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
        isDefault: true,
        exercises: [
          {
            id: '1',
            name: 'Squats',
            sets: 3,
            reps: 12,
            weight: 0,
            restTime: 60,
            instructions: 'Keep your chest up and weight on your heels'
          },
          {
            id: '2',
            name: 'Push-ups',
            sets: 3,
            reps: 10,
            restTime: 45,
            instructions: 'Keep your body in a straight line'
          },
          {
            id: '3',
            name: 'Deadlifts',
            sets: 3,
            reps: 8,
            weight: 0,
            restTime: 90,
            instructions: 'Keep the bar close to your body'
          },
          {
            id: '4',
            name: 'Pull-ups',
            sets: 3,
            reps: 6,
            restTime: 60,
            instructions: 'Use full range of motion'
          },
          {
            id: '5',
            name: 'Plank',
            sets: 3,
            reps: '30 sec',
            restTime: 30,
            instructions: 'Keep your core tight and body straight'
          },
          {
            id: '6',
            name: 'Lunges',
            sets: 3,
            reps: 10,
            restTime: 45,
            instructions: 'Step forward with control'
          }
        ]
      },
      {
        title: 'Quick Cardio Blast',
        description: 'High-intensity cardio workout for maximum calorie burn',
        exerciseCount: 4,
        duration: 20,
        difficulty: 'beginner',
        category: 'cardio',
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
        isDefault: true,
        exercises: [
          {
            id: '1',
            name: 'Jumping Jacks',
            sets: 4,
            reps: '30 sec',
            restTime: 15,
            instructions: 'Keep a steady rhythm'
          },
          {
            id: '2',
            name: 'High Knees',
            sets: 4,
            reps: '30 sec',
            restTime: 15,
            instructions: 'Lift knees to hip height'
          },
          {
            id: '3',
            name: 'Burpees',
            sets: 3,
            reps: 8,
            restTime: 30,
            instructions: 'Full body movement, pace yourself'
          },
          {
            id: '4',
            name: 'Mountain Climbers',
            sets: 3,
            reps: '20 sec',
            restTime: 20,
            instructions: 'Keep hips level'
          }
        ]
      },
      {
        title: 'Leg Day Power',
        description: 'Intensive lower body workout for strength and muscle building',
        exerciseCount: 5,
        duration: 50,
        difficulty: 'advanced',
        category: 'strength',
        imageUrl: 'https://images.unsplash.com/photo-1434596922112-19c563067271?w=400&h=400&fit=crop',
        isDefault: true,
        exercises: [
          {
            id: '1',
            name: 'Barbell Squats',
            sets: 4,
            reps: 8,
            weight: 0,
            restTime: 120,
            instructions: 'Go deep, maintain form'
          },
          {
            id: '2',
            name: 'Romanian Deadlifts',
            sets: 4,
            reps: 10,
            weight: 0,
            restTime: 90,
            instructions: 'Feel the stretch in hamstrings'
          },
          {
            id: '3',
            name: 'Bulgarian Split Squats',
            sets: 3,
            reps: 12,
            restTime: 60,
            instructions: 'Each leg, focus on control'
          },
          {
            id: '4',
            name: 'Calf Raises',
            sets: 4,
            reps: 15,
            restTime: 45,
            instructions: 'Full range of motion'
          },
          {
            id: '5',
            name: 'Wall Sit',
            sets: 3,
            reps: '45 sec',
            restTime: 60,
            instructions: 'Thighs parallel to ground'
          }
        ]
      },
      {
        title: 'Upper Body Pump',
        description: 'Focused upper body workout for chest, back, shoulders, and arms',
        exerciseCount: 6,
        duration: 40,
        difficulty: 'intermediate',
        category: 'strength',
        imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=400&fit=crop',
        isDefault: true,
        exercises: [
          {
            id: '1',
            name: 'Bench Press',
            sets: 4,
            reps: 10,
            weight: 0,
            restTime: 90,
            instructions: 'Control the weight on the way down'
          },
          {
            id: '2',
            name: 'Bent-over Rows',
            sets: 4,
            reps: 10,
            weight: 0,
            restTime: 75,
            instructions: 'Squeeze shoulder blades together'
          },
          {
            id: '3',
            name: 'Shoulder Press',
            sets: 3,
            reps: 12,
            weight: 0,
            restTime: 60,
            instructions: 'Press straight up'
          },
          {
            id: '4',
            name: 'Bicep Curls',
            sets: 3,
            reps: 12,
            weight: 0,
            restTime: 45,
            instructions: 'Control the negative'
          },
          {
            id: '5',
            name: 'Tricep Dips',
            sets: 3,
            reps: 10,
            restTime: 45,
            instructions: 'Keep elbows close to body'
          },
          {
            id: '6',
            name: 'Pike Push-ups',
            sets: 3,
            reps: 8,
            restTime: 60,
            instructions: 'Target shoulders and upper chest'
          }
        ]
      },
      {
        title: 'Core Crusher',
        description: 'Intense core workout for abs, obliques, and overall stability',
        exerciseCount: 5,
        duration: 25,
        difficulty: 'intermediate',
        category: 'strength',
        imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
        isDefault: true,
        exercises: [
          {
            id: '1',
            name: 'Crunches',
            sets: 4,
            reps: 20,
            restTime: 30,
            instructions: 'Focus on quality over quantity'
          },
          {
            id: '2',
            name: 'Russian Twists',
            sets: 3,
            reps: 20,
            restTime: 30,
            instructions: 'Keep feet off the ground'
          },
          {
            id: '3',
            name: 'Leg Raises',
            sets: 3,
            reps: 15,
            restTime: 45,
            instructions: 'Control the movement'
          },
          {
            id: '4',
            name: 'Dead Bug',
            sets: 3,
            reps: 10,
            restTime: 30,
            instructions: 'Each side, keep core stable'
          },
          {
            id: '5',
            name: 'Plank to Push-up',
            sets: 3,
            reps: 8,
            restTime: 60,
            instructions: 'Smooth transition between positions'
          }
        ]
      },
      {
        title: 'Yoga Flow',
        description: 'Relaxing yoga sequence for flexibility and mindfulness',
        exerciseCount: 6,
        duration: 30,
        difficulty: 'beginner',
        category: 'flexibility',
        imageUrl: 'https://images.unsplash.com/photo-1506629905607-e9e3119b6ae0?w=400&h=400&fit=crop',
        isDefault: true,
        exercises: [
          {
            id: '1',
            name: 'Sun Salutation',
            sets: 3,
            reps: '1 flow',
            restTime: 30,
            instructions: 'Flow with your breath'
          },
          {
            id: '2',
            name: 'Warrior II',
            sets: 2,
            reps: '30 sec',
            restTime: 15,
            instructions: 'Each side, strong and steady'
          },
          {
            id: '3',
            name: 'Downward Dog',
            sets: 3,
            reps: '45 sec',
            restTime: 15,
            instructions: 'Spread fingers wide'
          },
          {
            id: '4',
            name: 'Triangle Pose',
            sets: 2,
            reps: '30 sec',
            restTime: 15,
            instructions: 'Each side, reach and breathe'
          },
          {
            id: '5',
            name: 'Child\'s Pose',
            sets: 2,
            reps: '45 sec',
            restTime: 0,
            instructions: 'Rest and restore'
          },
          {
            id: '6',
            name: 'Cobra Pose',
            sets: 3,
            reps: '20 sec',
            restTime: 20,
            instructions: 'Gentle backbend'
          }
        ]
      }
    ];
  }
}
