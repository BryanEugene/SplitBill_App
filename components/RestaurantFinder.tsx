import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Restaurant {
  id: string;
  name: string;
  category?: string;
  address?: string;
}

interface RestaurantFinderProps {
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onClose: () => void;
}

// This component normally would use a real API like Google Places
// For demo purposes, we're using mock data
const RestaurantFinder: React.FC<RestaurantFinderProps> = ({ onSelectRestaurant, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Restaurant[]>([]);

  // Mock restaurant data
  const mockRestaurants: Restaurant[] = [
    { id: '1', name: 'Burger King', category: 'Fast Food', address: '123 Main St' },
    { id: '2', name: 'Pizza Hut', category: 'Pizza', address: '456 Elm St' },
    { id: '3', name: 'Olive Garden', category: 'Italian', address: '789 Oak Ave' },
    { id: '4', name: 'Chipotle', category: 'Mexican', address: '321 Pine Rd' },
    { id: '5', name: 'Subway', category: 'Sandwiches', address: '654 Maple Dr' },
    { id: '6', name: 'McDonald\'s', category: 'Fast Food', address: '987 Cedar Ln' },
    { id: '7', name: 'Starbucks', category: 'Coffee', address: '246 Birch Blvd' },
    { id: '8', name: 'Panera Bread', category: 'Bakery', address: '135 Willow Way' },
    { id: '9', name: 'Taco Bell', category: 'Mexican', address: '864 Spruce St' },
    { id: '10', name: 'KFC', category: 'Fast Food', address: '975 Fir Ave' },
  ];

  // Simulate an API call
  const searchRestaurants = (query: string) => {
    setIsLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      if (!query) {
        setResults([]);
      } else {
        const filtered = mockRestaurants.filter(
          restaurant => restaurant.name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      }
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchRestaurants(searchQuery);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    onSelectRestaurant(restaurant);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#0066CC" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Restaurant</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search restaurants..."
          placeholderTextColor="#999"
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => handleSelectRestaurant(item)}
            >
              <View>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.restaurantDetails}>
                  {item.category} • {item.address}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No restaurants found</Text>
                <TouchableOpacity
                  style={styles.addManuallyButton}
                  onPress={() => handleSelectRestaurant({ id: 'custom', name: searchQuery })}
                >
                  <Text style={styles.addManuallyText}>
                    Add "{searchQuery}" manually
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  restaurantName: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 4,
  },
  restaurantDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 16,
  },
  addManuallyButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addManuallyText: {
    color: 'white',
    fontFamily: 'Poppins',
    fontSize: 14,
  },
});

export default RestaurantFinder;
