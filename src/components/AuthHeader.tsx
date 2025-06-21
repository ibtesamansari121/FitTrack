import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { FitnessIcon } from './FitnessIcon';

interface AuthHeaderProps {
  title: string;
  iconType: 'login' | 'signup';
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, iconType }) => {
  return (
    <View style={styles.container}>
      <FitnessIcon type={iconType} size={200} />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 20,
  },
});
