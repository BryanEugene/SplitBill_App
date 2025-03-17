import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/context/AuthContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom animated splash screen
function AnimatedSplash({ onComplete }: { onComplete: () => void }) {
  const logoOpacity = new Animated.Value(0);
  const logoScale = new Animated.Value(0.3);
  const textOpacity = new Animated.Value(0);

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Delay a bit before transition
      setTimeout(onComplete, 500);
    });
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/split-bill-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text style={[styles.appTitle, { opacity: textOpacity }]}>
        Split Bill
      </Animated.Text>
      <Animated.Text style={[styles.appTagline, { opacity: textOpacity }]}>
        Split bills easily with friends
      </Animated.Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Manually load fonts to avoid using useFonts from expo-font
  useEffect(() => {
    async function loadFonts() {
      try {
        // Just set fonts as loaded for now, to bypass the expo-font issues
        setFontsLoaded(true);
        // Hide the splash screen
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('Error loading fonts:', e);
        setFontsLoaded(true);
      }
    }
    
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // Still loading
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
});
