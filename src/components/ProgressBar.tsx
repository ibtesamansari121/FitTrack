import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  title: string;
  progress: number; // 0-1 (percentage as decimal)
  currentValue: number;
  maxValue: number;
  unit?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  title,
  progress,
  currentValue,
  maxValue,
  unit = '',
}) => {
  const progressPercentage = Math.min(Math.max(progress * 100, 0), 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>
      <Text style={styles.progressText}>
        {currentValue}/{maxValue} {unit}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8F0FE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#8B9CB5',
  },
});
