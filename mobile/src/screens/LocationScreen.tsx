import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Title, TextInput, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useMutation } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { apiRequest, isUnauthorizedError } from '../lib/apiClient';

export default function LocationScreen({ navigation }: any) {
  const [location, setLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: { location: string; city?: string; latitude?: number; longitude?: number }) => {
      const response = await apiRequest('POST', '/api/profile', locationData);
      return response.json();
    },
    onSuccess: () => {
      Alert.alert('Success', 'Location saved successfully!');
      navigation.navigate('Rooftop');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        Alert.alert('Unauthorized', 'Please sign in again');
        navigation.navigate('Registration');
        return;
      }
      Alert.alert('Error', 'Failed to save location. Please try again.');
    },
  });

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        const address = addresses[0];
        const locationString = `${address.city}, ${address.region}, ${address.country}`;
        setLocation(locationString);
        
        updateLocationMutation.mutate({
          location: locationString,
          city: address.city || '',
          latitude,
          longitude,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please enter manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleManualContinue = () => {
    if (!location.trim()) {
      Alert.alert('Location required', 'Please enter your location to continue.');
      return;
    }

    const parts = location.split(',');
    const city = parts[0]?.trim() || location.trim();

    updateLocationMutation.mutate({
      location: location.trim(),
      city,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📍</Text>
        </View>
        
        <Title style={styles.title}>Location Information</Title>
        <Text style={styles.subtitle}>
          Help us calculate accurate rainfall data for your area
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Button 
              mode="outlined"
              onPress={getCurrentLocation}
              disabled={isGettingLocation}
              style={styles.locationButton}
              contentStyle={styles.locationButtonContent}
              icon="crosshairs-gps"
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" />
              ) : (
                'Use Current Location'
              )}
            </Button>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>OR</Text>
            </View>

            <TextInput
              label="Enter your location manually"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              placeholder="City, State, Country"
              style={styles.input}
            />

            <Button 
              mode="contained"
              onPress={handleManualContinue}
              disabled={updateLocationMutation.isPending}
              style={styles.continueButton}
              contentStyle={styles.continueButtonContent}
            >
              {updateLocationMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                'Continue'
              )}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 60,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    width: 80,
    height: 80,
    textAlign: 'center',
    lineHeight: 80,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  card: {
    padding: 20,
  },
  locationButton: {
    marginBottom: 20,
  },
  locationButtonContent: {
    paddingVertical: 8,
  },
  divider: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerText: {
    color: '#666',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
  },
  input: {
    marginBottom: 20,
  },
  continueButton: {
    marginTop: 10,
  },
  continueButtonContent: {
    paddingVertical: 8,
  },
});