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

type SportEvent = {
  icon: string;
  name: string;
  backgroundImage: any;
};

// Add expense categories functionality
type ExpenseCategory = {
  name: string;
  icon: string;
  amount: string;
};

export default function SportsExpenseScreen() {
  const { user, addTransaction, getFriends } = useAuth();
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [friends, setFriends] = useState<SelectedFriend[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Add these new state variables
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([
    { name: 'Field/Court Rental', icon: 'basketball-outline', amount: '' },
    { name: 'Equipment Rental', icon: 'football-outline', amount: '' },
    { name: 'Tickets', icon: 'ticket-outline', amount: '' },
    { name: 'Transportation', icon: 'car-outline', amount: '' },
    { name: 'Refreshments', icon: 'water-outline', amount: '' }
  ]);
  const [numberOfParticipants, setNumberOfParticipants] = useState('');
  const [participantInputMode, setParticipantInputMode] = useState<'manual' | 'auto'>('manual');

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

  // Add function to update expense category amounts
  const updateExpenseCategoryAmount = (index: number, amount: string) => {
    const updatedCategories = [...expenseCategories];
    updatedCategories[index] = {
      ...updatedCategories[index],
      amount
    };
    setExpenseCategories(updatedCategories);
  };

  // Calculate total from expense categories
  const calculateExpensesTotal = () => {
    return expenseCategories.reduce((total, category) => {
      const categoryAmount = parseFloat(category.amount || '0');
      return total + (isNaN(categoryAmount) ? 0 : categoryAmount);
    }, 0);
  };

  // Update the amount whenever expense categories change
  useEffect(() => {
    const total = calculateExpensesTotal();
    setAmount(total.toFixed(2));
  }, [expenseCategories]);

  const handleSaveTransaction = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    if (!eventType) {
      Alert.alert('Error', 'Please select a sport type');
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

    // Add validation for expense categories
    const validExpenses = expenseCategories.filter(
      cat => cat.amount && !isNaN(parseFloat(cat.amount)) && parseFloat(cat.amount) > 0
    );
    
    if (validExpenses.length === 0) {
      Alert.alert('Error', 'Please enter at least one expense amount');
      return;
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
      // Create transaction with expense breakdown
      const success = await addTransaction({
        description: `${eventType} - ${eventName}`,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        participants: JSON.stringify({
          type: 'sports',
          sportType: eventType,
          expenses: expenseCategories.filter(cat => parseFloat(cat.amount || '0') > 0),
          totalParticipants: participantInputMode === 'auto' ? parseInt(numberOfParticipants) : undefined,
          participants,
          splitEqually
        }),
        createdBy: user?.id || 0,
      });

      if (success) {
        Alert.alert('Success', 'Sports expense saved successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save sports expense');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the sports expense');
    } finally {
      setIsLoading(false);
    }
  };

  const sportTypes: SportEvent[] = [
    { icon: 'football', name: 'Football', backgroundImage: require('../../../assets/images/football.jpg') },
    { icon: 'basketball', name: 'Basketball', backgroundImage: require('../../../assets/images/basketball.jpg') },
    { icon: 'baseball', name: 'Baseball', backgroundImage: require('../../../assets/images/baseball.jpg') },
    { icon: 'tennisball', name: 'Tennis', backgroundImage: require('../../../assets/images/tennis.jpg') },
    { icon: 'golf', name: 'Golf', backgroundImage: require('../../../assets/images/golf.jpg') },
  ];

  // Add this to your render method before the Split Options section
  const renderExpenseCategories = () => (
    <View style={styles.expenseCategoriesSection}>
      <Text style={styles.sectionSubtitle}>Expense Breakdown</Text>
      
      {expenseCategories.map((category, index) => (
        <View key={index} style={styles.expenseCategoryRow}>
          <View style={styles.expenseCategoryInfo}>
            <Ionicons name={category.icon as any} size={24} color="#0066CC" />
            <Text style={styles.expenseCategoryName}>{category.name}</Text>
          </View>
          
          <View style={styles.expenseCategoryAmountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.expenseCategoryAmountInput}
              value={category.amount}
              onChangeText={(value) => updateExpenseCategoryAmount(index, value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      ))}
      
      <View style={styles.expensesTotalRow}>
        <Text style={styles.expensesTotalLabel}>Total Expenses:</Text>
        <Text style={styles.expensesTotalAmount}>${amount}</Text>
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
          <Text style={styles.title}>Sports Expense</Text>
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
          {/* Sports Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport Type</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sportTypesContainer}
            >
              {sportTypes.map((sport, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sportTypeItem,
                    eventType === sport.name && styles.sportTypeItemSelected
                  ]}
                  onPress={() => setEventType(sport.name)}
                >
                  <ImageBackground
                    source={sport.backgroundImage}
                    style={styles.sportTypeBackground}
                    imageStyle={{ borderRadius: 12 }}
                  >
                    <LinearGradient
                      colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                      style={styles.sportTypeGradient}
                    >
                      <Ionicons name={sport.icon as any} size={28} color="white" />
                      <Text style={styles.sportTypeName}>{sport.name}</Text>
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
                placeholder="e.g., NFL Game, Lakers vs. Celtics"
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

            {renderExpenseCategories()}
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
                    ${(parseFloat(amount) - friends.filter(f => f.isSelected).reduce((sum, f) => sum + (parseFloat(f.amount || '0') || 0), 0)).toFixed(2)}
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
              <Text style={styles.createButtonText}>Save Sports Expense</Text>
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
  sportTypesContainer: {
    paddingBottom: 8,
  },
  sportTypeItem: {
    width: 120,
    height: 150,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sportTypeItemSelected: {
    borderColor: '#0066CC',
  },
  sportTypeBackground: {
    width: '100%',
    height: '100%',
  },
  sportTypeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  sportTypeName: {
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
  expenseCategoriesSection: {
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
  expenseCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseCategoryName: {
    fontSize: 16,
    fontFamily: 'Poppins',
    marginLeft: 12,
    color: '#333',
  },
  expenseCategoryAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    width: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  expenseCategoryAmountInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  expensesTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 4,
  },
  expensesTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  expensesTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: '#0066CC',
  },
});
