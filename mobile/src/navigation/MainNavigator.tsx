import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import LandingScreen from '../screens/LandingScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import LocationScreen from '../screens/LocationScreen';
import RooftopScreen from '../screens/RooftopScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();

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