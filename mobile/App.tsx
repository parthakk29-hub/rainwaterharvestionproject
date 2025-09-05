import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Simple demo screens without complex dependencies
const screens = {
  landing: 'landing',
  location: 'location', 
  rooftop: 'rooftop',
  dashboard: 'dashboard'
};

export default function App() {
  const [currentScreen, setCurrentScreen] = React.useState(screens.landing);
  const [userData, setUserData] = React.useState({
    location: '',
    rooftopArea: '',
    calculations: null
  });

  const LandingScreen = () => (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Boondh</Text>
        <Text style={styles.heroSubtitle}>Rainwater Harvesting Calculator</Text>
        <Text style={styles.heroDescription}>
          Calculate your rainwater collection potential and savings
        </Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌧️ Smart Calculations</Text>
          <Text style={styles.cardText}>Get accurate rainwater collection estimates</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Cost Savings</Text>
          <Text style={styles.cardText}>See how much you can save on water bills</Text>
        </View>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setCurrentScreen(screens.location)}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const LocationScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Location</Text>
        <Text style={styles.headerSubtitle}>Enter your location for rainfall data</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.input}>
            <Text style={styles.inputPlaceholder}>Enter your city, state</Text>
          </View>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              setUserData({...userData, location: 'Demo City, State'});
              setCurrentScreen(screens.rooftop);
            }}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const RooftopScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Rooftop Details</Text>
        <Text style={styles.headerSubtitle}>Enter your rooftop area</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Rooftop Area (sq ft)</Text>
          <View style={styles.input}>
            <Text style={styles.inputPlaceholder}>e.g., 1200</Text>
          </View>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              const area = 1200;
              const monthlyCollection = area * 2.5 * 0.85 * 0.623;
              const annualCollection = monthlyCollection * 12;
              const monthlySavings = monthlyCollection * 0.12;
              const annualSavings = monthlySavings * 12;
              
              setUserData({
                ...userData, 
                rooftopArea: '1200',
                calculations: {
                  monthlyCollection: Math.round(monthlyCollection),
                  annualCollection: Math.round(annualCollection),
                  monthlySavings: monthlySavings.toFixed(2),
                  annualSavings: annualSavings.toFixed(2)
                }
              });
              setCurrentScreen(screens.dashboard);
            }}
          >
            <Text style={styles.buttonText}>Calculate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const DashboardScreen = () => (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Dashboard</Text>
        <Text style={styles.heroSubtitle}>Your Water Collection Report</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Location</Text>
          <Text style={styles.cardText}>{userData.location}</Text>
          <Text style={styles.cardText}>Rooftop: {userData.rooftopArea} sq ft</Text>
        </View>
        
        {userData.calculations && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💧 Water Collection</Text>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{userData.calculations.monthlyCollection}</Text>
                  <Text style={styles.statLabel}>Liters/Month</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{userData.calculations.annualCollection}</Text>
                  <Text style={styles.statLabel}>Liters/Year</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>💰 Cost Savings</Text>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>₹{userData.calculations.monthlySavings}</Text>
                  <Text style={styles.statLabel}>Per Month</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>₹{userData.calculations.annualSavings}</Text>
                  <Text style={styles.statLabel}>Per Year</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.exportButton}
          onPress={() => Alert.alert('Export', 'Excel export would work here with proper backend connection')}
        >
          <Text style={styles.buttonText}>📊 Export to Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setCurrentScreen(screens.landing)}
        >
          <Text style={styles.secondaryButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderScreen = () => {
    switch(currentScreen) {
      case screens.location: return <LocationScreen />;
      case screens.rooftop: return <RooftopScreen />;
      case screens.dashboard: return <DashboardScreen />;
      default: return <LandingScreen />;
    }
  };

  return renderScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  hero: {
    backgroundColor: '#2196F3',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroTitle: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 16,
  },
  heroDescription: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.9,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  inputPlaceholder: {
    color: '#999',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
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
});