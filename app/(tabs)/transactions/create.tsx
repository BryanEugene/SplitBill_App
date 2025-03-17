import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

type SelectedFriend = {
  id: number;
  name: string;
  isSelected: boolean;
};

export default function CreateTransactionScreen() {
  const { user, addTransaction, getFriends } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [friends, setFriends] = useState<SelectedFriend[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    const friendsList = await getFriends();
    setFriends(
      friendsList.map(friend => ({
        id: friend.id,
        name: friend.name,
        isSelected: false,
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

  const handleSaveTransaction = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
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

    setIsLoading(true);

    // Create participants array for saving as JSON
    const participants = [
      { id: user?.id, name: user?.name },
      ...selectedFriends.map(friend => ({ id: friend.id, name: friend.name })),
    ];

    try {
      const success = await addTransaction({
        description,
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        participants: JSON.stringify(participants),
        createdBy: user?.id || 0,
      });

      if (success) {
        Alert.alert('Success', 'Transaction created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to create transaction');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while creating the transaction');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={styles.title}>Create New Bill</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Bill Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What's this bill for?"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
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
        </View>

        <View style={styles.formSection}>
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
                <TouchableOpacity
                  key={friend.id}
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
        </View>

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleSaveTransaction}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.createButtonText}>Create Bill</Text>
          )}
        </TouchableOpacity>
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
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
    fontSize: 18,
    marginRight: 8,
    color: '#333',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
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
    marginBottom: 12,
    marginTop: 8,
    color: '#555',
  },
  friendsList: {
    marginBottom: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendItemSelected: {
    backgroundColor: '#f0f7ff',
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
  },
  friendName: {
    fontSize: 16,
    flex: 1,
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
  },
  addFriendsLink: {
    color: '#0066CC',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#0066CC',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    marginBottom: 30,
  },
  createButtonDisabled: {
    backgroundColor: '#999',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
