import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const RestDayIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        {/* Sun */}
        <View style={styles.sun}>
          <Ionicons name="sunny" size={40} color="#FFD700" />
        </View>
        
        {/* Person relaxing */}
        <View style={styles.person}>
          <View style={styles.head} />
          <View style={styles.body}>
            <View style={styles.arms}>
              <View style={styles.arm} />
              <View style={styles.arm} />
            </View>
            <View style={styles.torso} />
            <View style={styles.legs}>
              <View style={styles.leg} />
              <View style={styles.leg} />
            </View>
          </View>
        </View>
        
        {/* Ground/mat */}
        <View style={styles.mat} />
        
        {/* Decorative elements */}
        <View style={styles.cloud1}>
          <Ionicons name="cloud" size={24} color="#E8F4FD" />
        </View>
        <View style={styles.cloud2}>
          <Ionicons name="cloud" size={20} color="#E8F4FD" />
        </View>
      </View>
      
      <Text style={styles.title}>Today is a Rest Day!</Text>
      <Text style={styles.subtitle}>
        Take time to recover and prepare for your next workout
      </Text>
      
      <View style={styles.tips}>
        <View style={styles.tip}>
          <Ionicons name="water" size={16} color="#2196F3" />
          <Text style={styles.tipText}>Stay hydrated</Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="bed" size={16} color="#2196F3" />
          <Text style={styles.tipText}>Get quality sleep</Text>
        </View>
        <View style={styles.tip}>
          <Ionicons name="walk" size={16} color="#2196F3" />
          <Text style={styles.tipText}>Light stretching</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  illustration: {
    width: 200,
    height: 150,
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sun: {
    position: 'absolute',
    top: 10,
    right: 20,
  },
  person: {
    alignItems: 'center',
    marginTop: 20,
  },
  head: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F4C2A1',
    marginBottom: 5,
  },
  body: {
    alignItems: 'center',
  },
  arms: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
    position: 'absolute',
    top: 5,
  },
  arm: {
    width: 15,
    height: 25,
    backgroundColor: '#F4C2A1',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  torso: {
    width: 40,
    height: 30,
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    marginBottom: 5,
  },
  legs: {
    flexDirection: 'row',
    width: 40,
    justifyContent: 'space-between',
  },
  leg: {
    width: 15,
    height: 30,
    backgroundColor: '#1976D2',
    borderRadius: 8,
  },
  mat: {
    width: 120,
    height: 8,
    backgroundColor: '#81C784',
    borderRadius: 4,
    position: 'absolute',
    bottom: 0,
  },
  cloud1: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  cloud2: {
    position: 'absolute',
    top: 40,
    left: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B9CB5',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  tips: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 300,
  },
  tip: {
    alignItems: 'center',
    flex: 1,
  },
  tipText: {
    fontSize: 12,
    color: '#8B9CB5',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default RestDayIllustration;
