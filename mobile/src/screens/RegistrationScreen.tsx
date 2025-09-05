import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Text, Button, Card, Title, Paragraph } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

export default function RegistrationScreen() {
  const handleSignIn = () => {
    const loginUrl = 'http://localhost:5000/api/login';
    Linking.openURL(loginUrl);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>👤</Text>
        </View>
        
        <Title style={styles.title}>Welcome to Boondh</Title>
        <Paragraph style={styles.subtitle}>
          Sign in to start calculating your rainwater harvesting potential
        </Paragraph>

        <Card style={styles.card}>
          <Card.Content>
            <Button 
              mode="contained"
              onPress={handleSignIn}
              style={styles.signInButton}
              contentStyle={styles.signInButtonContent}
              icon="google"
            >
              Sign in with Google
            </Button>
            
            <Text style={styles.privacyText}>
              Your information will be securely collected from your Google account
            </Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 60,
    backgroundColor: '#2196F3',
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
  signInButton: {
    marginBottom: 16,
  },
  signInButtonContent: {
    paddingVertical: 8,
  },
  privacyText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
});