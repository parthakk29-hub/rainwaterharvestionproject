import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Button, Card, Title, Paragraph } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

export default function LandingScreen() {
  const handleSignIn = () => {
    // For mobile, we'll need to handle authentication differently
    // This would typically open a web browser for OAuth
    const loginUrl = 'http://localhost:5000/api/login';
    Linking.openURL(loginUrl);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Title style={styles.heroTitle}>Boondh</Title>
          <Text style={styles.heroSubtitle}>Rainwater Harvesting Calculator</Text>
          <Paragraph style={styles.heroDescription}>
            Calculate your rainwater collection potential and savings with our smart calculator
          </Paragraph>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.features}>
          <Card style={styles.featureCard}>
            <Card.Content>
              <Title>🌧️ Smart Calculations</Title>
              <Paragraph>Get accurate rainwater collection estimates based on your location and rooftop area</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content>
              <Title>💰 Cost Savings</Title>
              <Paragraph>See how much money you can save on your water bills with rainwater harvesting</Paragraph>
            </Card.Content>
          </Card>

          <Card style={styles.featureCard}>
            <Card.Content>
              <Title>📊 Detailed Reports</Title>
              <Paragraph>Export your calculations and projections to Excel for detailed analysis</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.cta}>
          <Button 
            mode="contained" 
            onPress={handleSignIn}
            style={styles.ctaButton}
            contentStyle={styles.ctaButtonContent}
          >
            Get Started
          </Button>
          <Text style={styles.ctaText}>
            Sign in to start calculating your rainwater harvesting potential
          </Text>
        </View>
      </View>
    </ScrollView>
  );
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
  },
  heroContent: {
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
  content: {
    padding: 20,
  },
  features: {
    marginBottom: 40,
  },
  featureCard: {
    marginBottom: 16,
  },
  cta: {
    alignItems: 'center',
  },
  ctaButton: {
    marginBottom: 16,
    width: '100%',
  },
  ctaButtonContent: {
    paddingVertical: 8,
  },
  ctaText: {
    textAlign: 'center',
    color: '#666',
  },
});