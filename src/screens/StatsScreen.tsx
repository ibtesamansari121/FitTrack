import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StatsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Stats</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.comingSoonContainer}>
            <Ionicons name="stats-chart" size={64} color="#2196F3" />
            <Text style={styles.comingSoonTitle}>Statistics Coming Soon</Text>
            <Text style={styles.comingSoonDescription}>
              Track your workout progress, view detailed analytics, and monitor your fitness journey.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#8B9CB5',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});
