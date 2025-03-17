import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

type SelectedFriend = {
  id: number;
  name: string;
  isSelected: boolean;
  amount?: string;
  nights?: string;
  sharing?: boolean; // New property to track room sharing
  roomType?: string; // New property to track room type
};

type AccommodationType = {
  icon: string;
  name: string;
  backgroundImage: any;
};

// New interface for room types
type RoomType = {
  name: string;
  capacity: number;
  icon: string;
};

export default function AccommodationExpenseScreen() {
  const { user, addTransaction, getFriends } = useAuth();
  const [placeName, setPlaceName] = useState('');
  const [accommodationType, setAccommodationType] = useState('');
  const [amount, setAmount] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [totalNights, setTotalNights] = useState('1');
  const [friends, setFriends] = useState<SelectedFriend[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // New state variables
  const [roomTypes, setRoomTypes] = useState<{[key: string]: number}>({
    'Standard Room': 0,
    'Deluxe Room': 0,
    'Suite': 0,
    'Shared Dorm': 0
  });
  const [perRoomCosts, setPerRoomCosts] = useState<{[key: string]: string}>({
    'Standard Room': '',
    'Deluxe Room': '',
    'Suite': '',
    'Shared Dorm': ''
  });
  const [additionalCosts, setAdditionalCosts] = useState('');
  const [includeAdditionalCosts, setIncludeAdditionalCosts] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadFriends();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadFriends = async () => {
    const friendsList = await getFriends();
    setFriends(
      friendsList.map(friend => ({
        id: friend.id,
        name: friend.name,
        isSelected: false,
        amount: '',
        nights: totalNights,
      }))
    );
  };

  const toggleFriendSelection = (id: number) => {
    setFriends(
      friends.map(friend =>
        friend.id === id
          ? { ...friend, isSelected: !friend.isSelected }
          : friend
      )
    );
  };

  const updateFriendAmount = (id: number, newAmount: string) => {
    setFriends(
      friends.map(friend =>
        friend.id === id
          ? { ...friend, amount: newAmount }
          : friend
      )
    );
  };

  const updateFriendNights = (id: number, nights: string) => {
    setFriends(
      friends.map(friend =>
        friend.id === id
          ? { ...friend, nights }
          : friend
      )
    );
  };

  const calculateEqualSplit = () => {
    const selectedCount = friends.filter(f => f.isSelected).length + 1; // +1 for the user
    if (selectedCount <= 1 || !amount) return '0.00';
    return (parseFloat(amount) / selectedCount).toFixed(2);
  };

  // Add this function for updating room counts
  const updateRoomCount = (roomType: string, count: number) => {
    if (count < 0) return;
    setRoomTypes({
      ...roomTypes,
      [roomType]: count
    });
  };

  // Add this function for updating room costs
  const updateRoomCost = (roomType: string, cost: string) => {
    setPerRoomCosts({
      ...perRoomCosts,
      [roomType]: cost
    });
  };

  // Updated calculateTotal to include room costs
  const calculateTotalAmount = () => {
    let total = 0;
    
    // Add up all room costs
    Object.keys(roomTypes).forEach(roomType => {
      const count = roomTypes[roomType];
      const cost = parseFloat(perRoomCosts[roomType] || '0');
      if (!isNaN(cost)) {
        total += count * cost;
      }
    });
    
    // Add additional costs if enabled
    if (includeAdditionalCosts && additionalCosts) {
      const additionalAmount = parseFloat(additionalCosts);
      if (!isNaN(additionalAmount)) {
        total += additionalAmount;
      }
    }
    
    return total;
  };

  // This effect updates the amount whenever room costs change
  useEffect(() => {
    const total = calculateTotalAmount();
    setAmount(total.toFixed(2));
  }, [roomTypes, perRoomCosts, additionalCosts, includeAdditionalCosts]);

  // Enhanced split calculation - assign people to specific rooms
  const assignFriendsToRooms = () => {
    // Implement room assignment logic
    const updatedFriends = [...friends];
    // Logic to assign friends to room types based on your data
    // This would be customized based on your UI for assigning people to rooms
    return updatedFriends;
  };

  // Enhanced handleSaveTransaction to include room details
  const handleSaveTransaction = async () => {
    if (!placeName.trim()) {
      Alert.alert('Error', 'Please enter a place name');
      return;
    }

    if (!accommodationType) {
      Alert.alert('Error', 'Please select an accommodation type');
      return;
    }

    // Validate room details
    let hasRooms = false;
    Object.keys(roomTypes).forEach(roomType => {
      if (roomTypes[roomType] > 0) {
        hasRooms = true;
        if (!perRoomCosts[roomType] || isNaN(parseFloat(perRoomCosts[roomType]))) {
          Alert.alert('Error', `Please enter a valid cost for ${roomType}`);
          return;
        }
      }
    });

    if (!hasRooms) {
      Alert.alert('Error', 'Please add at least one room');
      return;
    }

    // Rest of validation as before
    const selectedFriends = friends.filter(friend => friend.isSelected);
    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend');
      return;
    }

    setIsLoading(true);

    try {
      // Create enhanced participants array with room details
      const participants = [
        { 
          id: user?.id, 
          name: user?.name, 
          amount: splitEqually ? calculateEqualSplit() : calculateUserShare(),
          nights: totalNights,
          roomType: 'User assigned room type' // Would come from your UI
        },
        ...selectedFriends.map(friend => ({ 
          id: friend.id, 
          name: friend.name,
          amount: splitEqually ? calculateEqualSplit() : friend.amount,
          nights: friend.nights || totalNights,
          roomType: friend.roomType || 'Standard Room' // Would come from your UI
        })),
      ];

      const success = await addTransaction({
        description: `${accommodationType} - ${placeName}`,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        participants: JSON.stringify({
          type: 'accommodation',
          accommodationType,
          checkInDate,
          checkOutDate,
          totalNights: parseInt(totalNights),
          roomDetails: {
            types: roomTypes,
            costs: perRoomCosts
          },
          additionalCosts: includeAdditionalCosts ? parseFloat(additionalCosts || '0') : 0,
          participants,
          splitEqually
        }),
        createdBy: user?.id || 0,
      });

      if (success) {
        Alert.alert('Success', 'Accommodation expense saved successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save accommodation expense');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the accommodation expense');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate user's share when not split equally
  const calculateUserShare = () => {
    const selectedFriends = friends.filter(f => f.isSelected);
    const friendsTotal = selectedFriends.reduce((sum, f) => sum + (parseFloat(f.amount || '0') || 0), 0);
    const totalAmount = parseFloat(amount);
    return (totalAmount - friendsTotal).toFixed(2);
  };

  // Add UI for room configuration
  const renderRoomConfiguration = () => (
    <View style={styles.roomConfigSection}>
      <Text style={styles.sectionSubtitle}>Room Configuration</Text>
      
      {Object.keys(roomTypes).map(roomType => (
        <View key={roomType} style={styles.roomTypeRow}>
          <View style={styles.roomTypeInfo}>
            <Text style={styles.roomTypeName}>{roomType}</Text>
            
            <View style={styles.roomCountContainer}>
              <TouchableOpacity 
                style={styles.roomCountButton}
                onPress={() => updateRoomCount(roomType, roomTypes[roomType] - 1)}
              >
                <Ionicons name="remove" size={18} color="#0066CC" />
              </TouchableOpacity>
              
              <Text style={styles.roomCount}>{roomTypes[roomType]}</Text>
              
              <TouchableOpacity 
                style={styles.roomCountButton}
                onPress={() => updateRoomCount(roomType, roomTypes[roomType] + 1)}
              >
                <Ionicons name="add" size={18} color="#0066CC" />
              </TouchableOpacity>
            </View>
          </View>
          
          {roomTypes[roomType] > 0 && (
            <View style={styles.roomCostContainer}>
              <Text style={styles.roomCostLabel}>Cost per room per night:</Text>
              <View style={styles.roomCostInput}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={perRoomCosts[roomType]}
                  onChangeText={(value) => updateRoomCost(roomType, value)}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          )}
        </View>
      ))}
      
      <View style={styles.additionalCostsSection}>
        <View style={styles.additionalCostsHeader}>
          <Text style={styles.additionalCostsLabel}>Additional Costs (e.g., cleaning fee)</Text>
          <Switch
            value={includeAdditionalCosts}
            onValueChange={setIncludeAdditionalCosts}
            trackColor={{ false: '#ccc', true: '#0066CC' }}
            thumbColor="white"
          />
        </View>
        
        {includeAdditionalCosts && (
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={additionalCosts}
              onChangeText={setAdditionalCosts}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>
        )}
      </View>
    </View>
  );

  const accommodationTypes: AccommodationType[] = [
    { icon: 'bed', name: 'Hotel', backgroundImage: require('../../../assets/images/hotel.jpg') },
    { icon: 'home', name: 'Airbnb', backgroundImage: require('../../../assets/images/airbnb.jpg') },
    { icon: 'business', name: 'Resort', backgroundImage: require('../../../assets/images/resort.jpg') },
    { icon: 'leaf', name: 'Cabin', backgroundImage: require('../../../assets/images/cabin.jpg') },
    { icon: 'car', name: 'Hostel', backgroundImage: require('../../../assets/images/hostel.jpg') },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0066CC" />
          </TouchableOpacity>
          <Text style={styles.title}>Accommodation Expense</Text>
          <View style={{ width: 24 }} />
        </View>

        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Accommodation Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accommodation Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accommodationTypesContainer}
            >
              {accommodationTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.accommodationTypeItem,
                    accommodationType === type.name && styles.accommodationTypeItemSelected
                  ]}
                  onPress={() => setAccommodationType(type.name)}
                >
                  <ImageBackground
                    source={type.backgroundImage}
                    style={styles.accommodationTypeBackground}
                    imageStyle={{ borderRadius: 12 }}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                      style={styles.accommodationTypeGradient}
                    >
                      <View style={styles.typeIconContainer}>
                        <Ionicons name={type.icon as any} size={28} color="white" />
                      </View>
                      <Text style={styles.accommodationTypeName}>{type.name}</Text>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Accommodation Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accommodation Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Place Name</Text>
              <TextInput
                style={styles.input}
                value={placeName}
                onChangeText={setPlaceName}
                placeholder="e.g., Hilton Hotel, Mountain Cabin"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.dateRangeContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Check-in</Text>
                <TouchableOpacity style={styles.datePickerButton}>
                  <Text style={styles.dateText}>{checkInDate}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#0066CC" />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Check-out</Text>
                <TouchableOpacity style={styles.datePickerButton}>
                  <Text style={styles.dateText}>{checkOutDate}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#0066CC" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Number of Nights</Text>
              <TextInput
                style={styles.input}
                value={totalNights}
                onChangeText={setTotalNights}
                placeholder="1"
                keyboardType="number-pad"
                placeholderTextColor="#999"
              />
            </View>

            {/* Add the room configuration UI */}
            {renderRoomConfiguration()}

            <View style={styles.totalCostContainer}>
              <Text style={styles.totalCostLabel}>Total Cost:</Text>
              <Text style={styles.totalCostValue}>${amount}</Text>
            </View>
          </View>

          {/* Split Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Split with</Text>

            <View style={styles.splitOptions}>
              <Text style={styles.label}>Split equally</Text>
              <Switch
                value={splitEqually}
                onValueChange={setSplitEqually}
                trackColor={{ false: '#ccc', true: '#0066CC' }}
                thumbColor="white"
              />
            </View>

            <Text style={styles.friendsHeader}>Select friends</Text>
            {friends.length > 0 ? (
              <View style={styles.friendsList}>
                {friends.map(friend => (
                  <View key={friend.id} style={styles.friendItemContainer}>
                    <TouchableOpacity
                      style={[
                        styles.friendItem,
                        friend.isSelected && styles.friendItemSelected,
                      ]}
                      onPress={() => toggleFriendSelection(friend.id)}
                    >
                      <View style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>
                          {friend.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      {friend.isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color="#0066CC" />
                      )}
                    </TouchableOpacity>
                    
                    {!splitEqually && friend.isSelected && (
                      <View style={styles.individualAmountContainer}>
                        <Text style={styles.individualAmountLabel}>Amount for {friend.name}:</Text>
                        <View style={styles.individualAmountInput}>
                          <Text style={styles.currencySymbol}>$</Text>
                          <TextInput
                            style={styles.amountInput}
                            value={friend.amount}
                            onChangeText={(value) => updateFriendAmount(friend.id, value)}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            placeholderTextColor="#999"
                          />
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyFriends}>
                <Text style={styles.emptyText}>
                  You don't have any friends yet.{' '}
                  <Text
                    style={styles.addFriendsLink}
                    onPress={() => router.push('/(tabs)/friends')}
                  >
                    Add friends
                  </Text>{' '}
                  to split bills with them.
                </Text>
              </View>
            )}

            {splitEqually && friends.some(f => f.isSelected) && (
              <View style={styles.splitSummary}>
                <Text style={styles.splitSummaryText}>
                  Each person will pay: <Text style={styles.splitAmount}>${calculateEqualSplit()}</Text>
                </Text>
              </View>
            )}
            
            {!splitEqually && friends.some(f => f.isSelected) && (
              <View style={styles.splitSummary}>
                <Text style={styles.splitSummaryText}>
                  Your share: <Text style={styles.splitAmount}>
                    ${(parseFloat(amount || '0') - friends.filter(f => f.isSelected).reduce((sum, f) => sum + (parseFloat(f.amount || '0') || 0), 0)).toFixed(2)}
                  </Text>
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleSaveTransaction}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.createButtonText}>Save Accommodation Expense</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 16,
  },
  accommodationTypesContainer: {
    paddingBottom: 8,
  },
  accommodationTypeItem: {
    width: 120,
    height: 150,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accommodationTypeItemSelected: {
    borderColor: '#0066CC',
  },
  accommodationTypeBackground: {
    width: '100%',
    height: '100%',
  },
  accommodationTypeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  typeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  accommodationTypeName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontFamily: 'Poppins',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    fontFamily: 'Poppins',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  currencySymbol: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
    fontFamily: 'Poppins',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  datePickerButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  splitOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 16,
  },
  friendsHeader: {
    fontSize: 16,
    fontFamily: 'Poppins',
    marginBottom: 12,
    color: '#555',
  },
  friendsList: {
    marginBottom: 8,
  },
  friendItemContainer: {
    marginBottom: 12,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  friendItemSelected: {
    backgroundColor: '#e6f2ff',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
  },
  friendName: {
    fontSize: 16,
    flex: 1,
    fontFamily: 'Poppins',
  },
  individualAmountContainer: {
    marginTop: 8,
    marginLeft: 52,
    marginBottom: 8,
  },
  individualAmountLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontFamily: 'Poppins',
  },
  individualAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  emptyFriends: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  addFriendsLink: {
    color: '#0066CC',
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  splitSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  splitSummaryText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  splitAmount: {
    fontWeight: 'bold',
    color: '#0066CC',
    fontFamily: 'PoppinsSemiBold',
  },
  createButton: {
    backgroundColor: '#0066CC',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  createButtonDisabled: {
    backgroundColor: '#84B7E8',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
  },
  // Add new styles for room configuration
  roomConfigSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 12,
    color: '#333',
  },
  roomTypeRow: {
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  roomTypeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomTypeName: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#333',
  },
  roomCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCountButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCount: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    marginHorizontal: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  roomCostContainer: {
    marginTop: 12,
  },
  roomCostLabel: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Poppins',
    marginBottom: 6,
  },
  roomCostInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  additionalCostsSection: {
    marginTop: 16,
  },
  additionalCostsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  additionalCostsLabel: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#555',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  totalCostValue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: '#0066CC',
  },
  // Additional styles for room assignments
  roomAssignmentSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  roomAssignmentHeader: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 12,
  },
  roomCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roomTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  roomCostBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#0066CC',
    borderRadius: 12,
  },
  roomCostText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  roomDropZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomOccupantsList: {
    marginTop: 8,
  },
  roomOccupantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  roomOccupantText: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#0066CC',
    marginRight: 4,
  },
  nightsPerPersonContainer: {
    marginTop: 8,
  },
  nightsPerPersonLabel: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#555',
    marginBottom: 6,
  },
  nightsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nightsInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'white',
  },
  roomTypeDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  roomTypeText: {
    fontSize: 16,
    fontFamily: 'Poppins',
  },
});
