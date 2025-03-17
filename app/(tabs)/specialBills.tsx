import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

interface CategoryCardProps {
  title: string;
  description: string;
  icon: string;
  image: any;
  route: string;
  index: number;
}

function CategoryCard({ title, description, icon, image, route, index }: CategoryCardProps) {
  const translateX = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.categoryCard,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(route)}
      >
        <View style={styles.cardImageContainer}>
          <Image source={image} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardIconContainer}>
            <Ionicons name={icon as any} size={24} color="white" />
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SpecialBillsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const categories = [
    {
      title: 'Sports Events',
      description: 'Split tickets, gear, and other sports expenses',
      icon: 'football-outline',
      image: require('../../assets/images/sports.jpg'),
      route: '/(tabs)/transactions/sports',
    },
    {
      title: 'Entertainment',
      description: 'Movies, concerts, theater tickets, and more',
      icon: 'film-outline',
      image: require('../../assets/images/entertainment.jpg'),
      route: '/(tabs)/transactions/entertainment',
    },
    {
      title: 'Accommodation',
      description: 'Hotels, Airbnb, vacation rentals',
      icon: 'bed-outline',
      image: require('../../assets/images/accommodation.jpg'),
      route: '/(tabs)/transactions/accommodation',
    },
    {
      title: 'Food & Dining',
      description: 'Restaurants, takeout, and food delivery',
      icon: 'restaurant-outline',
      image: require('../../assets/images/food.jpg'),
      route: '/(tabs)/transactions/food',
    },
    {
      title: 'Travel',
      description: 'Transportation, car rental, and flights',
      icon: 'airplane-outline',
      image: require('../../assets/images/travel.jpg'),
      route: '/(tabs)/transactions/travel',
    },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>
          Specialized bill splitting options for different occasions
        </Text>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categories.map((category, index) => (
          <CategoryCard
            key={index}
            {...category}
            index={index}
          />
        ))}

        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionTitle}>
            Missing a category?
          </Text>
          <Text style={styles.suggestionText}>
            Let us know what other categories you'd like to see.
          </Text>
          <TouchableOpacity style={styles.suggestionButton}>
            <Text style={styles.suggestionButtonText}>
              Suggest a Category
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'PoppinsBold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#666',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center',
  },
  categoryCard: {
    width: CARD_WIDTH,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 180,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardIconContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#666',
    lineHeight: 20,
  },
  suggestionContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  suggestionTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  suggestionButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  suggestionButtonText: {
    color: 'white',
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
  },
});
