import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  
  const { register } = useAuth();

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    // Basic validation
    if (!name || !email || !password || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    const success = await register(name, email, password, phone);
    setIsLoading(false);
    
    if (!success) {
      Alert.alert('Registration Failed', 'Email may already be in use');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.headerSection}>
            <Image
              source={require('../../assets/images/split-bill-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register to start splitting bills</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              >
                <Ionicons 
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#555" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={secureConfirmTextEntry}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
              >
                <Ionicons 
                  name={secureConfirmTextEntry ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#555" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <Animated.View style={styles.loadingContainer}>
                  <Ionicons name="sync" size={24} color="white" />
                </Animated.View>
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PoppinsBold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: '#0066CC',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#84B7E8',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#666',
  },
  link: {
    color: '#0066CC',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
  },
});
