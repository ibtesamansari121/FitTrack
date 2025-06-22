// src/navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "../store/authStore";
import TabNavigator from "./TabNavigator";
import LoginScreen from "../screens/LoginScreen";
import SignUpScreen from "../screens/SignUpScreen";
import CreateRoutineScreen from "../screens/CreateRoutineScreen";
import StartWorkoutScreen from "../screens/StartWorkoutScreen";

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  SignUp: undefined;
  CreateRoutine: { routine?: any } | undefined; // Optional routine for editing
  StartWorkout: { routine: any }; // We'll type this properly later
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is signed in
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="CreateRoutine" 
              component={CreateRoutineScreen}
              options={{ 
                presentation: 'modal',
                gestureEnabled: true 
              }}
            />
            <Stack.Screen 
              name="StartWorkout" 
              component={StartWorkoutScreen}
              options={{ 
                presentation: 'modal',
                gestureEnabled: false 
              }}
            />
          </>
        ) : (
          // User is signed out
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ 
                gestureEnabled: false,
                animationTypeForReplace: 'pop'
              }}
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen}
              options={{ 
                gestureEnabled: false,
                animationTypeForReplace: 'push'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
