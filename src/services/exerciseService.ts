// Fetch is available globally in React Native
declare const fetch: typeof globalThis.fetch;

const RAPID_API_KEY = 'ee94e4170emsh3c07b39892d6b2dp1690bejsn9d0ac546e0ae';
const RAPID_API_HOST = 'exercisedb.p.rapidapi.com';
const BASE_URL = 'https://exercisedb.p.rapidapi.com';

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

export class ExerciseService {
  static async getExercisesByBodyPart(bodyPart: string, limit: number = 50, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/exercises/bodyPart/${bodyPart}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': RAPID_API_HOST,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add missing properties with defaults if they don't exist
      return data.map((exercise: any) => ({
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAllExercises(limit: number = 100, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/exercises?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': RAPID_API_HOST,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((exercise: any) => ({
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getExerciseById(id: string): Promise<ExerciseAPIResponse | null> {
    try {
      const response = await fetch(
        `${BASE_URL}/exercises/exercise/${id}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': RAPID_API_HOST,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const exercise = await response.json();
      
      return {
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      };
    } catch (error) {
      throw new Error(`Failed to fetch exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchExercises(query: string, limit: number = 50): Promise<ExerciseAPIResponse[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/exercises/name/${encodeURIComponent(query)}?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'X-RapidAPI-Key': RAPID_API_KEY,
            'X-RapidAPI-Host': RAPID_API_HOST,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((exercise: any) => ({
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      }));
    } catch (error) {
      throw new Error(`Failed to search exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to infer difficulty based on equipment and exercise type
  private static inferDifficulty(exercise: any): 'beginner' | 'intermediate' | 'advanced' {
    const name = exercise.name.toLowerCase();
    const equipment = exercise.equipment.toLowerCase();
    
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
    const bodyPart = exercise.bodyPart.toLowerCase();
    const equipment = exercise.equipment.toLowerCase();
    const name = exercise.name.toLowerCase();
    
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

  // Get available body parts
  static getBodyParts(): string[] {
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
