import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FitnessIconProps {
  type: 'login' | 'signup';
  size?: number;
}

export const FitnessIcon: React.FC<FitnessIconProps> = ({ type, size = 150 }) => {
  const isLogin = type === 'login';
  
  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isLogin ? '#FFF5E6' : '#FFE6E6',
      }
    ]}>
      <View style={[
        styles.iconContainer,
        { backgroundColor: isLogin ? '#FFB74D' : '#FF7043' }
      ]}>
        <MaterialCommunityIcons
          name={isLogin ? 'dumbbell' : 'run'}
          size={40}
          color="white"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
