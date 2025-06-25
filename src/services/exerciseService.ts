// Fetch is available globally in React Native
declare const fetch: typeof globalThis.fetch;

import Constants from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read API key from Expo's app.config.js (populated from .env)
const { rapidApiKey } = Constants.expoConfig?.extra ?? {};
const RAPID_API_KEY = rapidApiKey;

if (!RAPID_API_KEY) {
  throw new Error('RAPID_API_KEY is not configured. Please check your .env file.');
}

const RAPID_API_HOST = 'exercisedb.p.rapidapi.com';
const BASE_URL = 'https://exercisedb.p.rapidapi.com';

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CACHE_PREFIX = 'exercises_cache_';

interface CachedData<T> {
  data: T;
  timestamp: number;
  bodyPart?: string;
  limit?: number;
  offset?: number;
}

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
  // Cache management methods
  private static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const parsedCache: CachedData<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - parsedCache.timestamp > CACHE_DURATION) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }
      
      return parsedCache.data;
    } catch (error) {
      console.warn('Error reading from cache:', error);
      return null;
    }
  }

  private static async setCachedData<T>(key: string, data: T, metadata?: any): Promise<void> {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        ...metadata
      };
      
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error writing to cache:', error);
    }
  }

  private static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  static async getExercisesByBodyPart(bodyPart: string, limit: number = 50, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    const cacheKey = `bodypart_${bodyPart}_${limit}_${offset}`;
    
    // Try to get from cache first
    const cachedData = await this.getCachedData<ExerciseAPIResponse[]>(cacheKey);
    if (cachedData) {
      console.log(`Loaded ${bodyPart} exercises from cache`);
      return cachedData;
    }

    try {
      console.log(`Fetching ${bodyPart} exercises from API`);
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
      const processedData = data.map((exercise: any) => ({
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      }));

      // Cache the processed data
      await this.setCachedData(cacheKey, processedData, { bodyPart, limit, offset });
      
      return processedData;
    } catch (error) {
      throw new Error(`Failed to fetch exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getAllExercises(limit: number = 100, offset: number = 0): Promise<ExerciseAPIResponse[]> {
    const cacheKey = `all_exercises_${limit}_${offset}`;
    
    // Try to get from cache first
    const cachedData = await this.getCachedData<ExerciseAPIResponse[]>(cacheKey);
    if (cachedData) {
      console.log('Loaded all exercises from cache');
      return cachedData;
    }

    try {
      console.log('Fetching all exercises from API');
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
      
      const processedData = data.map((exercise: any) => ({
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      }));

      // Cache the processed data
      await this.setCachedData(cacheKey, processedData, { limit, offset });
      
      return processedData;
    } catch (error) {
      throw new Error(`Failed to fetch exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getExerciseById(id: string): Promise<ExerciseAPIResponse | null> {
    const cacheKey = `exercise_${id}`;
    
    // Try to get from cache first
    const cachedData = await this.getCachedData<ExerciseAPIResponse>(cacheKey);
    if (cachedData) {
      console.log(`Loaded exercise ${id} from cache`);
      return cachedData;
    }

    try {
      console.log(`Fetching exercise ${id} from API`);
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
      
      const processedExercise = {
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      };

      // Cache the processed data
      await this.setCachedData(cacheKey, processedExercise, { id });
      
      return processedExercise;
    } catch (error) {
      throw new Error(`Failed to fetch exercise: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async searchExercises(query: string, limit: number = 50): Promise<ExerciseAPIResponse[]> {
    const cacheKey = `search_${encodeURIComponent(query.toLowerCase())}_${limit}`;
    
    // Try to get from cache first
    const cachedData = await this.getCachedData<ExerciseAPIResponse[]>(cacheKey);
    if (cachedData) {
      console.log(`Loaded search results for "${query}" from cache`);
      return cachedData;
    }

    try {
      console.log(`Searching exercises for "${query}" from API`);
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
      
      const processedData = data.map((exercise: any) => ({
        ...exercise,
        difficulty: exercise.difficulty || this.inferDifficulty(exercise),
        category: exercise.category || this.inferCategory(exercise),
        description: exercise.description || `${exercise.name} is a ${exercise.bodyPart} exercise using ${exercise.equipment}.`,
      }));

      // Cache the processed data
      await this.setCachedData(cacheKey, processedData, { query, limit });
      
      return processedData;
    } catch (error) {
      throw new Error(`Failed to search exercises: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Public method to clear all cached data
  static async clearAllCache(): Promise<void> {
    await this.clearCache();
    console.log('Exercise cache cleared');
  }

  // Public method to check cache status
  static async getCacheInfo(): Promise<{ totalCacheSize: number; cacheKeys: string[] }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
      
      return {
        totalCacheSize: totalSize,
        cacheKeys: cacheKeys.map(key => key.replace(CACHE_PREFIX, ''))
      };
    } catch (error) {
      console.warn('Error getting cache info:', error);
      return { totalCacheSize: 0, cacheKeys: [] };
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
