import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface BillTypeCardProps {
  title: string;
  description: string;
  icon: string;
  colors: string[];
  route: string;
  delay: number;
}

function BillTypeCard({ title, description, icon, colors, route, delay }: BillTypeCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ])
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.cardContainer,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(route)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={colors}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon as any} size={32} color="white" />
            </View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CreateBillScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const billTypes: BillTypeCardProps[] = [
    {
      title: 'Regular Split',
      description: 'Split a bill equally among friends',
      icon: 'cash-outline',
      colors: ['#0066CC', '#0099FF'],
      route: '/(tabs)/transactions/create',
      delay: 100
    },
    {
      title: 'Manual Receipt',
      description: 'Split items from a receipt',
      icon: 'receipt-outline',
      colors: ['#FF9500', '#FFCC00'],
      route: '/(tabs)/transactions/manual-receipt',
      delay: 200
    },
    {
      title: 'Sports',
      description: 'Split sports-related expenses',
      icon: 'football-outline',
      colors: ['#34C759', '#30D158'],
      route: '/(tabs)/transactions/sports',
      delay: 300
    },
    {
      title: 'Entertainment',
      description: 'Movies, concerts, and other events',
      icon: 'film-outline',
      colors: ['#AF52DE', '#BF5AF2'],
      route: '/(tabs)/transactions/entertainment',
      delay: 400
    },
    {
      title: 'Accommodation',
      description: 'Hotels, Airbnb, and vacation rentals',
      icon: 'bed-outline',
      colors: ['#FF375F', '#FF2D55'],
      route: '/(tabs)/transactions/accommodation',
      delay: 500
    }
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
        <Text style={styles.headerTitle}>Create a Bill</Text>
        <Text style={styles.headerSubtitle}>Choose how you want to split your expenses</Text>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {billTypes.map((billType, index) => (
          <BillTypeCard key={index} {...billType} />
        ))}
      </ScrollView>

      <TouchableOpacity
        style={styles.friendsButton}
        onPress={() => router.push('/(tabs)/friends')}
      >
        <Ionicons name="people" size={20} color="#0066CC" />
        <Text style={styles.friendsButtonText}>Manage Friends</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'PoppinsBold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
  },
  cardContent: {
    minHeight: 150,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    color: 'white',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  friendsButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendsButtonText: {
    marginLeft: 8,
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#0066CC',
  }
});
