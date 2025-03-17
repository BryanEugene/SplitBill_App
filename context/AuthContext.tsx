import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
};

type Transaction = {
  id: number;
  description: string;
  amount: number;
  date: string;
  participants: string; // Stored as JSON string
  createdBy: number;
};

type Friend = {
  id: number;
  userId: number;
  friendId: number;
  name: string;
  email: string;
  phone: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  // Transaction methods
  getTransactionHistory: () => Promise<Transaction[]>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<boolean>;
  // Friend methods
  getFriends: () => Promise<Friend[]>;
  addFriend: (email: string) => Promise<boolean>;
  removeFriend: (friendId: number) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userJSON = await AsyncStorage.getItem('user');
        if (userJSON) {
          setUser(JSON.parse(userJSON));
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // Simulating an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock login - in a real app, this would validate credentials with your backend
      if (email === 'user@example.com' && password === 'password') {
        const userData = {
          id: 1,
          name: 'John Doe',
          email: 'user@example.com',
        };

        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Simulating an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock registration - in a real app, this would create a user in your backend
      const userData = {
        id: Date.now(), // Generate a unique ID based on timestamp
        name,
        email,
        phone, // Add phone to userData
      };
      
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock function to add a transaction
  const addTransaction = async (transactionData: any): Promise<boolean> => {
    try {
      // Get existing transactions
      const transactionsJSON = await AsyncStorage.getItem('transactions');
      let transactions = transactionsJSON ? JSON.parse(transactionsJSON) : [];
      
      // Add the new transaction
      const newTransaction = {
        id: Date.now(),
        ...transactionData,
        date: transactionData.date || new Date().toISOString(),
      };
      
      transactions.push(newTransaction);
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };
  
  // Mock function to get transaction history
  const getTransactionHistory = async (): Promise<any[]> => {
    try {
      const transactionsJSON = await AsyncStorage.getItem('transactions');
      return transactionsJSON ? JSON.parse(transactionsJSON) : [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  };
  
  // Mock function to get friends
  const getFriends = async (): Promise<any[]> => {
    try {
      const friendsJSON = await AsyncStorage.getItem('friends');
      if (friendsJSON) {
        return JSON.parse(friendsJSON);
      } else {
        // Default friends for testing
        const defaultFriends = [
          { id: 2, name: 'Alice Johnson' },
          { id: 3, name: 'Bob Smith' },
          { id: 4, name: 'Cindy Brown' },
        ];
        await AsyncStorage.setItem('friends', JSON.stringify(defaultFriends));
        return defaultFriends;
      }
    } catch (error) {
      console.error('Error getting friends:', error);
      return [];
    }
  };
  
  // Mock function to add a friend
  const addFriend = async (email: string): Promise<boolean> => {
    try {
      const friendsJSON = await AsyncStorage.getItem('friends');
      let friends = friendsJSON ? JSON.parse(friendsJSON) : [];
      
      // Add new friend with a unique ID
      const newFriend = {
        id: Date.now(),
        name: email.split('@')[0], // Just using the part before @ as name for the mock
        email,
      };
      
      friends.push(newFriend);
      await AsyncStorage.setItem('friends', JSON.stringify(friends));
      return true;
    } catch (error) {
      console.error('Error adding friend:', error);
      return false;
    }
  };

  // Mock function to remove a friend
  const removeFriend = async (friendId: number): Promise<boolean> => {
    try {
      const friendsJSON = await AsyncStorage.getItem('friends');
      if (!friendsJSON) return false;
      
      let friends = JSON.parse(friendsJSON);
      friends = friends.filter((friend: any) => friend.id !== friendId);
      
      await AsyncStorage.setItem('friends', JSON.stringify(friends));
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        addTransaction,
        getTransactionHistory,
        getFriends,
        addFriend,
        removeFriend
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

