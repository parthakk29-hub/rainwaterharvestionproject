import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Title, TextInput, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, isUnauthorizedError } from '../lib/apiClient';

export default function RooftopScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [rooftopType, setRooftopType] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [totalArea, setTotalArea] = useState('');

  // Calculate total area when length and width change
  useEffect(() => {
    if (length && width && !isNaN(Number(length)) && !isNaN(Number(width))) {
      const calculated = Number(length) * Number(width);
      setTotalArea(calculated.toString());
    }
  }, [length, width]);

  const updateRooftopMutation = useMutation({
    mutationFn: async (rooftopData: { 
      name?: string; 
      rooftopType?: string; 
      rooftopArea: string; 
      rooftopLength?: string; 
      rooftopWidth?: string 
    }) => {
      const response = await apiRequest('POST', '/api/profile', rooftopData);
      return response.json();
    },
    onSuccess: () => {
      Alert.alert('Success', 'Rooftop area saved successfully!');
      navigation.navigate('Dashboard');
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        Alert.alert('Unauthorized', 'Please sign in again');
        navigation.navigate('Registration');
        return;
      }
      Alert.alert('Error', 'Failed to save rooftop area. Please try again.');
    },
  });

  const handleSubmit = () => {
    const area = totalArea || (length && width ? (Number(length) * Number(width)).toString() : '');
    
    if (!area || isNaN(Number(area)) || Number(area) <= 0) {
      Alert.alert('Invalid area', 'Please enter a valid rooftop area or dimensions.');
      return;
    }

    const rooftopData: any = { rooftopArea: area };
    
    if (name.trim()) {
      rooftopData.name = name.trim();
    }
    
    if (rooftopType) {
      rooftopData.rooftopType = rooftopType;
    }
    
    if (length && width) {
      rooftopData.rooftopLength = length;
      rooftopData.rooftopWidth = width;
    }

    updateRooftopMutation.mutate(rooftopData);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🏠</Text>
        </View>
        
        <Title style={styles.title}>Rooftop Details</Title>
        <Text style={styles.subtitle}>
          Enter your rooftop specifications for accurate water collection calculations
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Property name (optional)"
              value={name}
              onChangeText={setName}
              mode="outlined"
              placeholder="My Home"
              style={styles.input}
            />

            <View style={styles.sectionTitle}>
              <Text style={styles.sectionText}>Rooftop Dimensions</Text>
            </View>

            <View style={styles.row}>
              <TextInput
                label="Length (ft)"
                value={length}
                onChangeText={setLength}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Width (ft)"
                value={width}
                onChangeText={setWidth}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <View style={styles.divider}>
              <Text style={styles.dividerText}>OR</Text>
            </View>

            <TextInput
              label="Total area (sq ft)"
              value={totalArea}
              onChangeText={setTotalArea}
              mode="outlined"
              keyboardType="numeric"
              placeholder="Enter total rooftop area"
              style={styles.input}
            />

            <TextInput
              label="Rooftop type (optional)"
              value={rooftopType}
              onChangeText={setRooftopType}
              mode="outlined"
              placeholder="e.g., Tile, Metal, Concrete"
              style={styles.input}
            />

            <Button 
              mode="contained"
              onPress={handleSubmit}
              disabled={updateRooftopMutation.isPending}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {updateRooftopMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                'Calculate Water Collection'
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
    backgroundColor: '#FF9800',
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
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginVertical: 16,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
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
  submitButton: {
    marginTop: 20,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});