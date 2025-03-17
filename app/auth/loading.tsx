import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function LoadingScreen() {
  const rotation = new Animated.Value(0);
  const fadeInOut = new Animated.Value(0.3);

  useEffect(() => {
    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeInOut, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeInOut, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.loadingCard}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ rotate: spin }],
              opacity: fadeInOut,
            },
          ]}
        >
          <Ionicons name="sync" size={40} color="#0066CC" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading your account</Text>
        <Text style={styles.subText}>Please wait a moment...</Text>
        <ActivityIndicator 
          style={styles.progressIndicator} 
          size="small" 
          color="#0066CC" 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 20,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 8,
    color: '#333',
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#666',
    marginBottom: 20,
  },
  progressIndicator: {
    marginTop: 10,
  },
});
