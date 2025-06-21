import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RoutineCardProps {
  id: string;
  title: string;
  exerciseCount: number;
  duration: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  imageSource: ImageSourcePropType | { uri: string };
  onPress: () => void;
}

export const RoutineCard: React.FC<RoutineCardProps> = ({
  title,
  exerciseCount,
  duration,
  difficulty,
  category,
  imageSource,
  onPress,
}) => {
  const getDifficultyColor = (level?: string) => {
    switch (level) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#8B9CB5';
    }
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'strength':
        return 'barbell-outline';
      case 'cardio':
        return 'heart-outline';
      case 'flexibility':
        return 'body-outline';
      case 'mixed':
        return 'fitness-outline';
      default:
        return 'fitness-outline';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        <Image source={imageSource} style={styles.image} resizeMode="cover" />
        {category && (
          <View style={styles.categoryBadge}>
            <Ionicons 
              name={getCategoryIcon(category) as any} 
              size={12} 
              color="#FFFFFF" 
            />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {difficulty && (
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(difficulty) }]}>
              <Text style={styles.difficultyText}>{difficulty}</Text>
            </View>
          )}
        </View>
        <Text style={styles.details}>
          {exerciseCount} exercises • {duration} min
        </Text>
      </View>
      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={20} color="#8B9CB5" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  details: {
    fontSize: 14,
    color: '#8B9CB5',
  },
  arrow: {
    paddingRight: 16,
  },
});
