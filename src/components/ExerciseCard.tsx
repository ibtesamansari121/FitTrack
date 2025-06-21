import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseAPIResponse } from '../services/exerciseService';

interface ExerciseCardProps {
  exercise: ExerciseAPIResponse;
  isSelected: boolean;
  onToggle: () => void;
  onShowInfo?: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isSelected,
  onToggle,
  onShowInfo,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.selectedCard]} 
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: exercise.gifUrl }} 
            style={styles.exerciseImage}
            resizeMode="cover"
          />
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
            <Text style={styles.difficultyText}>{exercise.difficulty}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {exercise.name}
            </Text>
          </View>
          
          <Text style={styles.bodyPart}>
            {exercise.bodyPart} • {exercise.target}
          </Text>
          
          <Text style={styles.equipment}>
            {exercise.equipment}
          </Text>
        </View>
        
        <View style={styles.cardActions}>
          {onShowInfo && (
            <TouchableOpacity style={styles.infoButton} onPress={onShowInfo}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
            </TouchableOpacity>
          )}
          <View style={styles.checkbox}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? "#2196F3" : "#D0D0D0"} 
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Exercise Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{exercise.name}</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Image 
              source={{ uri: exercise.gifUrl }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
            
            <View style={styles.modalDetails}>
              <View style={styles.modalBadgeRow}>
                <View style={[styles.modalBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
                  <Text style={styles.modalBadgeText}>{exercise.difficulty}</Text>
                </View>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>{exercise.category}</Text>
                </View>
              </View>
              
              <Text style={styles.modalSectionTitle}>Target Muscles</Text>
              <Text style={styles.modalText}>
                Primary: {exercise.target}
              </Text>
              {exercise.secondaryMuscles.length > 0 && (
                <Text style={styles.modalText}>
                  Secondary: {exercise.secondaryMuscles.join(', ')}
                </Text>
              )}
              
              <Text style={styles.modalSectionTitle}>Equipment</Text>
              <Text style={styles.modalText}>{exercise.equipment}</Text>
              
              <Text style={styles.modalSectionTitle}>Instructions</Text>
              {exercise.instructions.map((instruction, index) => (
                <Text key={index} style={styles.instructionText}>
                  {index + 1}. {instruction}
                </Text>
              ))}
              
              {exercise.description && (
                <>
                  <Text style={styles.modalSectionTitle}>Description</Text>
                  <Text style={styles.modalText}>{exercise.description}</Text>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedCard: {
    borderColor: '#2196F3',
    backgroundColor: '#F8F9FF',
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  difficultyBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  bodyPart: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  equipment: {
    fontSize: 12,
    color: '#8B9CB5',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  exerciseControls: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  controlLabel: {
    fontSize: 12,
    color: '#8B9CB5',
    marginBottom: 4,
    textAlign: 'center',
  },
  controlInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  infoButton: {
    padding: 4,
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  modalDetails: {
    padding: 16,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default ExerciseCard;
