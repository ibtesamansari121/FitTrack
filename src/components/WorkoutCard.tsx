import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType } from 'react-native';
import { CustomButton } from './CustomButton';

interface WorkoutCardProps {
  title: string;
  exerciseCount: number;
  imageSource: ImageSourcePropType | { uri: string };
  onStartWorkout: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  title,
  exerciseCount,
  imageSource,
  onStartWorkout,
}) => {
  return (
    <View style={styles.workoutCard}>
      <View style={styles.workoutImageContainer}>
        <Image 
          source={imageSource}
          style={styles.workoutImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutTitle}>{title}</Text>
        <Text style={styles.workoutSubtitle}>{exerciseCount} Exercises</Text>
      </View>
      <CustomButton
        title="Start Workout"
        style={styles.startWorkoutButton}
        onPress={onStartWorkout}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  workoutImageContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    height: 200,
  },
  workoutImage: {
    width: '100%',
    height: '100%',
  },
  workoutInfo: {
    padding: 20,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  workoutSubtitle: {
    fontSize: 14,
    color: '#8B9CB5',
    marginBottom: 20,
  },
  startWorkoutButton: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
});
