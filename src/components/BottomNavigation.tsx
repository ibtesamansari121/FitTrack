import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavigationProps {
  activeTab: 'home' | 'stats' | 'routines' | 'profile';
  onTabPress: (tab: 'home' | 'stats' | 'routines' | 'profile') => void;
}

// This component is kept for potential custom navigation needs
// Currently using React Navigation Bottom Tabs instead
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
}) => {
  const tabs = [
    { id: 'home' as const, icon: 'home', label: 'Home' },
    { id: 'stats' as const, icon: 'stats-chart', label: 'Stats' },
    { id: 'routines' as const, icon: 'list', label: 'Routines' },
    { id: 'profile' as const, icon: 'person', label: 'Profile' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.navItem}
          onPress={() => onTabPress(tab.id)}
        >
          <Ionicons
            name={activeTab === tab.id ? tab.icon : `${tab.icon}-outline` as any}
            size={24}
            color={activeTab === tab.id ? '#2196F3' : '#8B9CB5'}
          />
          <Text
            style={[
              styles.navText,
              activeTab === tab.id && styles.activeNavText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#8B9CB5',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#2196F3',
  },
});
