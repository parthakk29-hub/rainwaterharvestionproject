import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

// Import screens directly without type checking issues
const LandingScreen = require('../screens/LandingScreen').default;
const RegistrationScreen = require('../screens/RegistrationScreen').default;
const LocationScreen = require('../screens/LocationScreen').default;
const RooftopScreen = require('../screens/RooftopScreen').default;
const DashboardScreen = require('../screens/DashboardScreen').default;

const Stack = createStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

export default function MainNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: isAuthenticated,
    retry: false,
  });

  if (isLoading || (isAuthenticated && profileLoading)) {
    return <LoadingScreen />;
  }

  // Determine which screen to show based on auth and profile status
  let initialRouteName = 'Landing';
  
  if (isAuthenticated) {
    if (!profile) {
      initialRouteName = 'Registration';
    } else if (!(profile as any)?.city || !(profile as any)?.location) {
      initialRouteName = 'Location';
    } else if (!(profile as any)?.rooftopArea) {
      initialRouteName = 'Rooftop';
    } else {
      initialRouteName = 'Dashboard';
    }
  }

  return (
    <Stack.Navigator 
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="Location" component={LocationScreen} />
      <Stack.Screen name="Rooftop" component={RooftopScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});