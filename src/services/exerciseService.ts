// Fetch is available globally in React Native
declare const fetch: typeof globalThis.fetch;

const BASE_URL = 'https://exercisedb-api.vercel.app';

export interface ExerciseAPIResponse {
  exerciseId: string;
  name: string;
  gifUrl: string;
  instructions: string[];
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  // Legacy compatibility fields (mapped from new API)
  id: string;
  bodyPart: string;
  equipment: string;
  target: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility';
}

interface ExerciseDBAPIResponse {
  success: boolean;
  data: {
    previousPage: string | null;
    nextPage: string | null;
    totalPages: number;
    totalExercises: number;
    currentPage: number;
    exercises: {
      exerciseId: string;
      name: string;
      gifUrl: string;
      instructions: string[];
      targetMuscles: string[];
      bodyParts: string[];
      equipments: string[];
      secondaryMuscles: string[];
    }[];
  };
}

interface BodyPartAPIResponse {
  success: boolean;
  data: {
    name: string;
  }[];
}

export class ExerciseService {
  // Helper method to convert new API response to legacy format for compatibility
  private static convertToLegacyFormat(exercise: any): ExerciseAPIResponse {
    return {
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      gifUrl: exercise.gifUrl,
      instructions: exercise.instructions,
      targetMuscles: exercise.targetMuscles,
      bodyParts: exercise.bodyParts,
      equipments: exercise.equipments,
      secondaryMuscles: exercise.secondaryMuscles,
      // Legacy compatibility fields
      id: exercise.exerciseId,
      bodyPart: exercise.bodyParts?.[0] || '',
      equipment: exercise.equipments?.[0] || '',
      target: exercise.targetMuscles?.[0] || '',
      description: `${exercise.name} is a ${exercise.bodyParts?.[0] || 'full body'} exercise using ${exercise.equipments?.[0] || 'equipment'}.`,
      difficulty: this.inferDifficulty(exercise),
      category: this.inferCategory(exercise),
    };
  }

  static async getExercisesByBodyPart(bodyPart: string, limit: number = 50, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/bodyparts/${encodeURIComponent(bodyPart)}/exercises?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ExerciseDBAPIResponse = await response.json();
      
      if (!apiResponse.success) {
        throw new Error('API request failed');
      }

      return apiResponse.data.exercises.map(exercise => this.convertToLegacyFormat(exercise));
    } catch (error) {
      throw new Error(`Failed to fetch exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAllExercises(limit: number = 100, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/exercises?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ExerciseDBAPIResponse = await response.json();
      
      if (!apiResponse.success) {
        throw new Error('API request failed');
      }

      return apiResponse.data.exercises.map(exercise => this.convertToLegacyFormat(exercise));
    } catch (error) {
      throw new Error(`Failed to fetch exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getExerciseById(id: string): Promise<ExerciseAPIResponse | null> {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/exercises/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();
      
      if (!apiResponse.success) {
        return null;
      }

      return this.convertToLegacyFormat(apiResponse.data);
    } catch (error) {
      throw new Error(`Failed to fetch exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchExercises(query: string, limit: number = 50, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/exercises?limit=${limit}&offset=${offset}&search=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ExerciseDBAPIResponse = await response.json();
      
      if (!apiResponse.success) {
        throw new Error('API request failed');
      }

      return apiResponse.data.exercises.map(exercise => this.convertToLegacyFormat(exercise));
    } catch (error) {
      throw new Error(`Failed to search exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to infer difficulty based on equipment and exercise type
  private static inferDifficulty(exercise: any): 'beginner' | 'intermediate' | 'advanced' {
    const name = exercise.name?.toLowerCase() || '';
    const equipments = exercise.equipments || [];
    const equipment = equipments.join(' ').toLowerCase();
    
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
    const bodyParts = exercise.bodyParts || [];
    const bodyPart = bodyParts.join(' ').toLowerCase();
    const equipments = exercise.equipments || [];
    const equipment = equipments.join(' ').toLowerCase();
    const name = exercise.name?.toLowerCase() || '';
    
    // Cardio exercises
    if (bodyPart.includes('cardio') || name.includes('running') || name.includes('cycling') || 
        name.includes('jumping') || equipment.includes('treadmill') || equipment.includes('bike')) {
      return 'cardio';
    }
    
    // Flexibility exercises
    if (name.includes('stretch') || name.includes('yoga') || equipment.includes('roller')) {
      return 'flexibility';
    }
    
    // Default to strength
    return 'strength';
  }

  // Get available body parts from API
  static async getBodyParts(): Promise<string[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/api/v1/bodyparts`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: BodyPartAPIResponse = await response.json();
      
      if (!apiResponse.success) {
        throw new Error('API request failed');
      }

      return apiResponse.data.map(bodyPart => bodyPart.name).sort();
    } catch (error) {
      // Return default body parts if API fails
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

  // New method: Search exercises with body part filter
  static async searchExercisesWithBodyPart(query: string, bodyPart?: string, limit: number = 50): Promise<ExerciseAPIResponse[]> {
    try {
      let url = `${BASE_URL}/api/v1/exercises?limit=${limit}`;
      
      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: ExerciseDBAPIResponse = await response.json();
      
      if (!apiResponse.success) {
        throw new Error('API request failed');
      }

      let exercises = apiResponse.data.exercises;

      // Filter by body part if specified
      if (bodyPart) {
        exercises = exercises.filter(exercise =>
          exercise.bodyParts.some(part => 
            part.toLowerCase().includes(bodyPart.toLowerCase())
          )
        );
      }

      return exercises.map(exercise => this.convertToLegacyFormat(exercise));
    } catch (error) {
      throw new Error(`Failed to search exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
