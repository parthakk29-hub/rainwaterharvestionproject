import React from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Button, Card, Title, Paragraph, ActivityIndicator, FAB } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiRequest } from '../lib/apiClient';

interface UserProfile {
  id: string;
  name?: string;
  location?: string;
  city?: string;
  rooftopArea?: string;
}

interface WaterCalculation {
  id: string;
  monthlyRainfall?: string;
  monthlyCollection?: string;
  annualCollection?: string;
  monthlySavings?: string;
  annualSavings?: string;
}

export default function DashboardScreen() {
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    retry: false,
  });

  // Fetch weather data
  const { data: weather, isLoading: weatherLoading } = useQuery<any>({
    queryKey: ['/api/weather', profile?.city],
    enabled: !!profile?.city,
    retry: false,
  });

  // Fetch calculations
  const { data: calculations, isLoading: calculationsLoading } = useQuery<WaterCalculation>({
    queryKey: ['/api/calculations'],
    retry: false,
  });

  // Create calculations mutation
  const createCalculationsMutation = useMutation({
    mutationFn: async (calculationData: any) => {
      const response = await apiRequest('POST', '/api/calculations', calculationData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calculations'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create calculations');
    },
  });

  // Export to Excel
  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/export/excel');
      return response.blob();
    },
    onSuccess: async (blob) => {
      try {
        // Convert blob to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const fileUri = FileSystem.documentDirectory + 'boondh-report.xlsx';
          
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          await Sharing.shareAsync(fileUri);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        Alert.alert('Error', 'Failed to export Excel file');
      }
    },
    onError: () => {
      Alert.alert('Error', 'Failed to export data');
    },
  });

  // Create calculations when weather data is available
  React.useEffect(() => {
    if (weather && profile && !calculations && !calculationsLoading && !createCalculationsMutation.isPending) {
      const rooftopArea = parseFloat(profile.rooftopArea || '0');
      const monthlyRainfall = parseFloat(weather?.monthlyRainfall || '0');
      
      if (rooftopArea > 0 && monthlyRainfall > 0) {
        const runoffCoefficient = 0.85;
        const monthlyCollection = monthlyRainfall * rooftopArea * runoffCoefficient * 0.623;
        const annualCollection = monthlyCollection * 12;
        const monthlySavings = monthlyCollection * 0.12;
        const annualSavings = monthlySavings * 12;

        createCalculationsMutation.mutate({
          userProfileId: profile.id,
          monthlyRainfall: monthlyRainfall.toString(),
          runoffCoefficient: runoffCoefficient.toString(),
          monthlyCollection: Math.round(monthlyCollection).toString(),
          annualCollection: Math.round(annualCollection).toString(),
          monthlySavings: monthlySavings.toFixed(2),
          annualSavings: annualSavings.toFixed(2),
        });
      }
    }
  }, [weather, profile, calculations, calculationsLoading, createCalculationsMutation.isPending]);

  const handleExport = () => {
    exportMutation.mutate();
  };

  if (profileLoading || weatherLoading || calculationsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <StatusBar style="light" />
        
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Water Collection Dashboard</Title>
          <Text style={styles.headerSubtitle}>
            {profile?.name || 'Your'} Rainwater Harvesting Report
          </Text>
        </View>

        <View style={styles.content}>
          {/* Location Info */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>📍 Location</Title>
              <Paragraph>{profile?.location || 'Not specified'}</Paragraph>
              <Paragraph>Rooftop Area: {profile?.rooftopArea || 'Not specified'} sq ft</Paragraph>
            </Card.Content>
          </Card>

          {/* Weather Info */}
          {weather && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>🌧️ Weather Data</Title>
                <Paragraph>Monthly Rainfall: {weather?.monthlyRainfall || 'N/A'} inches</Paragraph>
                <Paragraph>Annual Rainfall: {weather?.annualRainfall || 'N/A'} inches</Paragraph>
                <Paragraph>Climate Zone: {weather?.climateZone || 'N/A'}</Paragraph>
              </Card.Content>
            </Card>
          )}

          {/* Water Collection */}
          {calculations && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>💧 Water Collection</Title>
                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{calculations.monthlyCollection || '0'}</Text>
                    <Text style={styles.statLabel}>Liters/Month</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{calculations.annualCollection || '0'}</Text>
                    <Text style={styles.statLabel}>Liters/Year</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Cost Savings */}
          {calculations && (
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>💰 Cost Savings</Title>
                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>₹{calculations.monthlySavings || '0'}</Text>
                    <Text style={styles.statLabel}>Per Month</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>₹{calculations.annualSavings || '0'}</Text>
                    <Text style={styles.statLabel}>Per Year</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      <FAB
        icon="download"
        label="Export Excel"
        onPress={handleExport}
        loading={exportMutation.isPending}
        style={styles.fab}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});