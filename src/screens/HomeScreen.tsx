// src/screens/HomeScreen.tsx
import React from "react";
import { Text, SafeAreaView, StyleSheet, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { CustomButton } from "../components/CustomButton";
import { AuthService } from "../services/authService";

export default function HomeScreen() {
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to FitTrack</Text>
        <Text style={styles.subtitle}>
          Hello, {user?.displayName || user?.email?.split('@')[0]}!
        </Text>
        <Text style={styles.email}>Logged in as: {user?.email}</Text>
        
        <View style={styles.buttonContainer}>
          <CustomButton
            title="Sign Out"
            onPress={handleLogout}
            variant="secondary"
            iconName="log-out-outline"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 14,
    color: '#8B9CB5',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
