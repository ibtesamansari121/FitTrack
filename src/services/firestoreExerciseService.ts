import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ExerciseAPIResponse {
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  id: string;
  name: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility';
}

export class FirestoreExerciseService {
  private static readonly COLLECTION_NAME = 'exercises';

  // Convert Firestore document to ExerciseAPIResponse
  private static convertFirestoreDoc(doc: any): ExerciseAPIResponse {
    const data = doc.data();
    return {
      id: doc.id,
      bodyPart: data.bodyPart || '',
      equipment: data.equipment || '',
      gifUrl: data.gifUrl || '',
      name: data.name || '',
      target: data.target || '',
      secondaryMuscles: data.secondaryMuscles || [],
      instructions: data.instructions || [],
      description: data.description || `${data.name} is a ${data.bodyPart} exercise using ${data.equipment}.`,
      difficulty: data.difficulty || this.inferDifficulty(data),
      category: data.category || this.inferCategory(data),
    };
  }

  static async getExercisesByBodyPart(bodyPart: string, limit: number = 50, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    try {
      const exercisesRef = collection(db, this.COLLECTION_NAME);
      let exerciseQuery = query(
        exercisesRef,
        where('bodyPart', '==', bodyPart),
        orderBy('name'),
        firestoreLimit(limit)
      );

      // Handle pagination with offset (simplified approach)
      if (offset > 0) {
        // For better pagination, you might want to use cursor-based pagination
        // This is a simplified approach that might not be efficient for large offsets
        const allDocsQuery = query(
          exercisesRef,
          where('bodyPart', '==', bodyPart),
          orderBy('name'),
          firestoreLimit(offset + limit)
        );
        const allSnapshot = await getDocs(allDocsQuery);
        const allDocs = allSnapshot.docs.slice(offset, offset + limit);
        
        return allDocs.map(doc => this.convertFirestoreDoc(doc));
      }

      const querySnapshot = await getDocs(exerciseQuery);
      return querySnapshot.docs.map(doc => this.convertFirestoreDoc(doc));
    } catch (error) {
      throw new Error(`Failed to fetch exercises from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAllExercises(limit: number = 100, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    try {
      const exercisesRef = collection(db, this.COLLECTION_NAME);
      let exerciseQuery = query(
        exercisesRef,
        orderBy('name'),
        firestoreLimit(limit)
      );

      // Handle pagination with offset
      if (offset > 0) {
        const allDocsQuery = query(
          exercisesRef,
          orderBy('name'),
          firestoreLimit(offset + limit)
        );
        const allSnapshot = await getDocs(allDocsQuery);
        const allDocs = allSnapshot.docs.slice(offset, offset + limit);
        
        return allDocs.map(doc => this.convertFirestoreDoc(doc));
      }

      const querySnapshot = await getDocs(exerciseQuery);
      return querySnapshot.docs.map(doc => this.convertFirestoreDoc(doc));
    } catch (error) {
      throw new Error(`Failed to fetch exercises from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getExerciseById(id: string): Promise<ExerciseAPIResponse | null> {
    try {
      const exerciseRef = doc(db, this.COLLECTION_NAME, id);
      const exerciseDoc = await getDoc(exerciseRef);

      if (!exerciseDoc.exists()) {
        return null;
      }

      return this.convertFirestoreDoc(exerciseDoc as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      throw new Error(`Failed to fetch exercise from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchExercises(searchTerm: string, limit: number = 50): Promise<ExerciseAPIResponse[]> {
    try {
      // Firestore doesn't support full-text search natively, so we'll need to implement
      // a simple search by getting all exercises and filtering client-side
      // For better search performance, consider using Algolia or similar search service
      
      const exercisesRef = collection(db, this.COLLECTION_NAME);
      const exerciseQuery = query(exercisesRef, orderBy('name'), firestoreLimit(1000)); // Get more docs for searching
      
      const querySnapshot = await getDocs(exerciseQuery);
      const allExercises = querySnapshot.docs.map(doc => this.convertFirestoreDoc(doc));
      
      // Client-side filtering
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filteredExercises = allExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(lowerSearchTerm) ||
        exercise.bodyPart.toLowerCase().includes(lowerSearchTerm) ||
        exercise.target.toLowerCase().includes(lowerSearchTerm) ||
        exercise.equipment.toLowerCase().includes(lowerSearchTerm)
      ).slice(0, limit);
      
      return filteredExercises;
    } catch (error) {
      throw new Error(`Failed to search exercises in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Infinite scroll pagination method
  static async getExercisesByBodyPartPaginated(
    bodyPart: string, 
    limit: number = 10, 
    lastDocId?: string
  ): Promise<{ exercises: ExerciseAPIResponse[], hasMore: boolean, lastDocId?: string }> {
    try {
      const exercisesRef = collection(db, this.COLLECTION_NAME);
      let exerciseQuery = query(
        exercisesRef,
        where('bodyPart', '==', bodyPart),
        orderBy('name'),
        firestoreLimit(limit + 1) // Fetch one extra to check if there are more
      );

      // If we have a lastDocId, start after that document
      if (lastDocId) {
        const lastDocRef = doc(db, this.COLLECTION_NAME, lastDocId);
        const lastDocSnap = await getDoc(lastDocRef);
        if (lastDocSnap.exists()) {
          exerciseQuery = query(
            exercisesRef,
            where('bodyPart', '==', bodyPart),
            orderBy('name'),
            startAfter(lastDocSnap),
            firestoreLimit(limit + 1)
          );
        }
      }

      const querySnapshot = await getDocs(exerciseQuery);
      const docs = querySnapshot.docs;
      
      // Check if there are more documents
      const hasMore = docs.length > limit;
      const exerciseDocs = hasMore ? docs.slice(0, limit) : docs;
      
      const exercises = exerciseDocs.map(doc => this.convertFirestoreDoc(doc));
      const newLastDocId = exerciseDocs.length > 0 ? exerciseDocs[exerciseDocs.length - 1].id : undefined;
      
      return {
        exercises,
        hasMore,
        lastDocId: newLastDocId
      };
    } catch (error) {
      throw new Error(`Failed to fetch exercises from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Paginated search method for infinite scroll
  static async searchExercisesPaginated(
    searchTerm: string, 
    limit: number = 10, 
    lastDocId?: string
  ): Promise<{ exercises: ExerciseAPIResponse[], hasMore: boolean, lastDocId?: string }> {
    try {
      // For search, we need to get more documents initially to filter them
      const searchLimit = Math.max(limit * 10, 500); // Get more docs for better filtering
      const exercisesRef = collection(db, this.COLLECTION_NAME);
      let exerciseQuery = query(exercisesRef, orderBy('name'), firestoreLimit(searchLimit));

      // If we have a lastDocId, start after that document
      if (lastDocId) {
        const lastDocRef = doc(db, this.COLLECTION_NAME, lastDocId);
        const lastDocSnap = await getDoc(lastDocRef);
        if (lastDocSnap.exists()) {
          exerciseQuery = query(
            exercisesRef,
            orderBy('name'),
            startAfter(lastDocSnap),
            firestoreLimit(searchLimit)
          );
        }
      }

      const querySnapshot = await getDocs(exerciseQuery);
      const allExercises = querySnapshot.docs.map(doc => this.convertFirestoreDoc(doc));
      
      // Client-side filtering
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filteredExercises = allExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(lowerSearchTerm) ||
        exercise.bodyPart.toLowerCase().includes(lowerSearchTerm) ||
        exercise.target.toLowerCase().includes(lowerSearchTerm) ||
        exercise.equipment.toLowerCase().includes(lowerSearchTerm)
      );

      // Apply pagination to filtered results
      const hasMore = filteredExercises.length > limit;
      const paginatedExercises = filteredExercises.slice(0, limit);
      const newLastDocId = querySnapshot.docs.length > 0 ? 
        querySnapshot.docs[querySnapshot.docs.length - 1].id : undefined;

      return {
        exercises: paginatedExercises,
        hasMore: hasMore && querySnapshot.docs.length === searchLimit, // Has more if we got full batch
        lastDocId: newLastDocId
      };
    } catch (error) {
      throw new Error(`Failed to search exercises in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to infer difficulty based on equipment and exercise type
  private static inferDifficulty(exercise: any): 'beginner' | 'intermediate' | 'advanced' {
    const name = exercise.name?.toLowerCase() || '';
    const equipment = exercise.equipment?.toLowerCase() || '';
    
    // Advanced exercises
    if (name.includes('olympic') || name.includes('snatch') || name.includes('clean') || 
        name.includes('weighted') || equipment.includes('barbell')) {
      return 'advanced';
    }
    
    // Intermediate exercises
    if (equipment.includes('dumbbell') || equipment.includes('cable') || 
        equipment.includes('machine') || name.includes('incline') || name.includes('decline')) {
      return 'intermediate';
    }
    
    // Beginner exercises (bodyweight, assisted, etc.)
    return 'beginner';
  }

  // Helper method to infer category based on body part and equipment
  private static inferCategory(exercise: any): 'strength' | 'cardio' | 'flexibility' {
    const bodyPart = exercise.bodyPart?.toLowerCase() || '';
    const equipment = exercise.equipment?.toLowerCase() || '';
    const name = exercise.name?.toLowerCase() || '';
    
    // Cardio exercises
    if (bodyPart === 'cardio' || name.includes('running') || name.includes('cycling') || 
        name.includes('jumping') || equipment.includes('treadmill') || equipment.includes('bike')) {
      return 'cardio';
    }
    
    // Flexibility exercises
    if (name.includes('stretch') || name.includes('yoga') || equipment.includes('rope')) {
      return 'flexibility';
    }
    
    // Default to strength
    return 'strength';
  }

  // Get available body parts from Firestore
  static async getBodyParts(): Promise<string[]> {
    try {
      const exercisesRef = collection(db, this.COLLECTION_NAME);
      const querySnapshot = await getDocs(exercisesRef);
      
      const bodyPartsSet = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.bodyPart) {
          bodyPartsSet.add(data.bodyPart);
        }
      });
      
      return Array.from(bodyPartsSet).sort();
    } catch (error) {
      // Return default body parts if Firestore fails
      return [
        'back',
        'cardio',
        'chest',
        'lower arms',
        'lower legs',
        'neck',
        'shoulders',
        'upper arms',
        'upper legs',
        'waist'
      ];
    }
  }
}
