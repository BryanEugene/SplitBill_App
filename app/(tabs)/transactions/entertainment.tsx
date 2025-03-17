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
};

type EntertainmentType = {
  icon: string;
  name: string;
  backgroundImage: any;
  gradient: string[];
};

// Add ticket categories
type TicketCategory = {
  name: string;
  price: string;
  quantity: string;
};

export default function EntertainmentExpenseScreen() {
  const { user, addTransaction, getFriends } = useAuth();
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [friends, setFriends] = useState<SelectedFriend[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Add ticket categories state
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([
    { name: 'Regular', price: '', quantity: '1' }
  ]);
  const [additionalExpenses, setAdditionalExpenses] = useState<{name: string, amount: string}[]>([
    { name: 'Food & Drinks', amount: '' },
    { name: 'Parking', amount: '' }
  ]);

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

  const calculateEqualSplit = () => {
    const selectedCount = friends.filter(f => f.isSelected).length + 1; // +1 for the user
    if (selectedCount <= 1 || !amount) return '0.00';
    return (parseFloat(amount) / selectedCount).toFixed(2);
  };

  // Function to add a new ticket category
  const addTicketCategory = () => {
    setTicketCategories([
      ...ticketCategories,
      { name: '', price: '', quantity: '1' }
    ]);
  };

  // Function to remove a ticket category
  const removeTicketCategory = (index: number) => {
    if (ticketCategories.length <= 1) {
      Alert.alert('Error', 'You need at least one ticket category');
      return;
    }
    const newCategories = [...ticketCategories];
    newCategories.splice(index, 1);
    setTicketCategories(newCategories);
  };

  // Function to update a ticket category
  const updateTicketCategory = (index: number, field: keyof TicketCategory, value: string) => {
    const newCategories = [...ticketCategories];
    newCategories[index] = {
      ...newCategories[index],
      [field]: value
    };
    setTicketCategories(newCategories);
  };

  // Function to update additional expense
  const updateAdditionalExpense = (index: number, value: string) => {
    const newExpenses = [...additionalExpenses];
    newExpenses[index] = {
      ...newExpenses[index],
      amount: value
    };
    setAdditionalExpenses(newExpenses);
  };

  // Calculate total from ticket categories and additional expenses
  const calculateTicketsTotal = () => {
    let total = 0;
    
    // Add ticket costs
    ticketCategories.forEach(category => {
      const price = parseFloat(category.price || '0');
      const quantity = parseInt(category.quantity || '0');
      if (!isNaN(price) && !isNaN(quantity)) {
        total += price * quantity;
      }
    });
    
    // Add additional expenses
    additionalExpenses.forEach(expense => {
      const amount = parseFloat(expense.amount || '0');
      if (!isNaN(amount)) {
        total += amount;
      }
    });
    
    return total;
  };

  // Update amount when ticket categories or additional expenses change
  useEffect(() => {
    const total = calculateTicketsTotal();
    setAmount(total.toFixed(2));
  }, [ticketCategories, additionalExpenses]);

  const handleSaveTransaction = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    if (!eventType) {
      Alert.alert('Error', 'Please select an entertainment type');
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const selectedFriends = friends.filter(friend => friend.isSelected);
    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend');
      return;
    }

    // If not split equally, validate individual amounts
    if (!splitEqually) {
      let totalSpecified = 0;
      for (const friend of selectedFriends) {
        if (!friend.amount || isNaN(parseFloat(friend.amount))) {
          Alert.alert('Error', `Please specify amount for ${friend.name}`);
          return;
        }
        totalSpecified += parseFloat(friend.amount);
      }

      const userAmount = parseFloat(amount) - totalSpecified;
      if (userAmount < 0) {
        Alert.alert('Error', 'The sum of individual amounts exceeds the total');
        return;
      }
    }

    // Validate ticket categories
    for (const category of ticketCategories) {
      if (!category.name.trim()) {
        Alert.alert('Error', 'Please enter a name for all ticket categories');
        return;
      }
      if (!category.price || isNaN(parseFloat(category.price)) || parseFloat(category.price) <= 0) {
        Alert.alert('Error', 'Please enter a valid price for all ticket categories');
        return;
      }
      if (!category.quantity || isNaN(parseInt(category.quantity)) || parseInt(category.quantity) <= 0) {
        Alert.alert('Error', 'Please enter a valid quantity for all ticket categories');
        return;
      }
    }

    setIsLoading(true);

    // Create participants array for saving as JSON
    const participants = [
      { 
        id: user?.id, 
        name: user?.name, 
        amount: splitEqually ? calculateEqualSplit() : (parseFloat(amount) - selectedFriends.reduce((sum, f) => sum + (parseFloat(f.amount || '0') || 0), 0)).toFixed(2) 
      },
      ...selectedFriends.map(friend => ({ 
        id: friend.id, 
        name: friend.name,
        amount: splitEqually ? calculateEqualSplit() : friend.amount 
      })),
    ];

    try {
      // Include ticket details in the transaction
      const success = await addTransaction({
        description: `${eventType} - ${eventName}`,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        participants: JSON.stringify({
          type: 'entertainment',
          entertainmentType: eventType,
          ticketDetails: {
            categories: ticketCategories,
            additionalExpenses: additionalExpenses.filter(exp => exp.amount && parseFloat(exp.amount) > 0)
          },
          participants,
          splitEqually
        }),
        createdBy: user?.id || 0,
      });

      if (success) {
        Alert.alert('Success', 'Entertainment expense saved successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save entertainment expense');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the entertainment expense');
    } finally {
      setIsLoading(false);
    }
  };

  const entertainmentTypes: EntertainmentType[] = [
    { 
      icon: 'film', 
      name: 'Movies', 
      backgroundImage: require('../../../assets/images/movies.jpg'),
      gradient: ['#FF9500', '#FF5E3A']
    },
    { 
      icon: 'musical-notes', 
      name: 'Concert', 
      backgroundImage: require('../../../assets/images/concert.jpg'),
      gradient: ['#AF52DE', '#5E5CE6']
    },
    { 
      icon: 'ticket', 
      name: 'Theater', 
      backgroundImage: require('../../../assets/images/theater.jpg'),
      gradient: ['#FF2D55', '#FF3B30']
    },
    { 
      icon: 'game-controller', 
      name: 'Gaming', 
      backgroundImage: require('../../../assets/images/gaming.jpg'),
      gradient: ['#34C759', '#30B0C7']
    },
    { 
      icon: 'wine', 
      name: 'Nightlife', 
      backgroundImage: require('../../../assets/images/nightlife.jpg'),
      gradient: ['#007AFF', '#5856D6']
    },
  ];

  // Add this to your render method inside the Event Details section
  const renderTicketCategories = () => (
    <View style={styles.ticketCategoriesSection}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionSubtitle}>Ticket Categories</Text>
        <TouchableOpacity 
          style={styles.addCategoryButton}
          onPress={addTicketCategory}
        >
          <Ionicons name="add-circle" size={20} color="#0066CC" />
          <Text style={styles.addCategoryText}>Add Category</Text>
        </TouchableOpacity>
      </View>
      
      {ticketCategories.map((category, index) => (
        <View key={index} style={styles.ticketCategoryRow}>
          <View style={styles.categoryNameContainer}>
            <TextInput
              style={styles.categoryNameInput}
              value={category.name}
              onChangeText={(value) => updateTicketCategory(index, 'name', value)}
              placeholder="Category name"
              placeholderTextColor="#999"
            />
          </View>
          
          <View style={styles.ticketDetailsContainer}>
            <View style={styles.priceContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={category.price}
                onChangeText={(value) => updateTicketCategory(index, 'price', value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
            
            <Text style={styles.multiplySymbol}>×</Text>
            
            <View style={styles.quantityContainer}>
              <TextInput
                style={styles.quantityInput}
                value={category.quantity}
                onChangeText={(value) => updateTicketCategory(index, 'quantity', value)}
                placeholder="1"
                keyboardType="number-pad"
                placeholderTextColor="#999"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.removeCategoryButton}
              onPress={() => removeTicketCategory(index)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          
          {category.price && category.quantity && !isNaN(parseFloat(category.price)) && !isNaN(parseInt(category.quantity)) && (
            <Text style={styles.categoryTotal}>
              Total: ${(parseFloat(category.price) * parseInt(category.quantity)).toFixed(2)}
            </Text>
          )}
        </View>
      ))}
      
      <View style={styles.additionalExpensesSection}>
        <Text style={styles.sectionSubtitle}>Additional Expenses</Text>
        
        {additionalExpenses.map((expense, index) => (
          <View key={index} style={styles.additionalExpenseRow}>
            <Text style={styles.expenseName}>{expense.name}</Text>
            <View style={styles.expenseAmountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.expenseAmountInput}
                value={expense.amount}
                onChangeText={(value) => updateAdditionalExpense(index, value)}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalAmount}>${amount}</Text>
      </View>
    </View>
  );

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
          <Text style={styles.title}>Entertainment Expense</Text>
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
          {/* Entertainment Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Entertainment Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.entertainmentTypesContainer}
            >
              {entertainmentTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.entertainmentTypeItem,
                    eventType === type.name && styles.entertainmentTypeItemSelected
                  ]}
                  onPress={() => setEventType(type.name)}
                >
                  <ImageBackground
                    source={type.backgroundImage}
                    style={styles.entertainmentTypeBackground}
                    imageStyle={{ borderRadius: 12 }}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                      style={styles.entertainmentTypeGradient}
                    >
                      <View style={[
                        styles.iconContainer,
                        {backgroundColor: type.gradient[0]}
                      ]}>
                        <Ionicons name={type.icon as any} size={24} color="white" />
                      </View>
                      <Text style={styles.entertainmentTypeName}>{type.name}</Text>
                    </LinearGradient>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Event Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Event Name</Text>
              <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="e.g., Avengers Movie, Taylor Swift Concert"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Total Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.datePickerButton}>
                <Text style={styles.dateText}>{date}</Text>
                <Ionicons name="calendar-outline" size={20} color="#0066CC" />
              </TouchableOpacity>
            </View>

            {renderTicketCategories()}
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
              <Text style={styles.createButtonText}>Save Entertainment Expense</Text>
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
  entertainmentTypesContainer: {
    paddingBottom: 8,
  },
  entertainmentTypeItem: {
    width: 140,
    height: 180,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  entertainmentTypeItemSelected: {
    borderColor: '#0066CC',
  },
  entertainmentTypeBackground: {
    width: '100%',
    height: '100%',
  },
  entertainmentTypeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  entertainmentTypeName: {
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
  ticketCategoriesSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  addCategoryText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#0066CC',
    fontFamily: 'Poppins',
  },
  ticketCategoryRow: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  categoryNameContainer: {
    marginBottom: 8,
  },
  categoryNameInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: 'white',
    fontFamily: 'Poppins',
  },
  ticketDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  multiplySymbol: {
    fontSize: 18,
    marginHorizontal: 8,
    color: '#666',
  },
  quantityContainer: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    marginRight: 8,
  },
  quantityInput: {
    width: '100%',
    height: '100%',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  removeCategoryButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTotal: {
    marginTop: 8,
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  additionalExpensesSection: {
    marginTop: 16,
    marginBottom: 12,
  },
  additionalExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  expenseName: {
    fontSize: 16,
    fontFamily: 'Poppins',
    color: '#333',
  },
  expenseAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  expenseAmountInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: '#0066CC',
  },
});
