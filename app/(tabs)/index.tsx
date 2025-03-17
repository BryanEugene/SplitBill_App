import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Transaction {
  id: number;
  description: string;
  amount: number;
  date: string;
}

export default function HomeScreen() {
  const { user, getTransactionHistory } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const categoryEnter = useRef(new Animated.Value(100)).current;
  const categoryOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(categoryOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(categoryEnter, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTransactionHistory();
      
      // Sort transactions by date (newest first)
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Get only the 5 most recent transactions
      setTransactions(data.slice(0, 5));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatAmount = (amount: string | number) => {
    return parseFloat(amount.toString()).toFixed(2);
  };
  
  // Calculate total spent in the current month
  const calculateMonthlySpending = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return transactions.reduce((total, transaction) => {
      const txDate = new Date(transaction.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        return total + transaction.amount;
      }
      return total;
    }, 0);
  };
  
  // Split categories with their icons and gradient colors
  const splitCategories = [
    {
      title: 'Accommodation',
      description: 'Split hotel & lodging costs',
      icon: 'bed-outline' as const,
      route: '/(tabs)/transactions/accommodation',
      gradient: ['#FF9500', '#FF5E3A'],
      image: require('../../assets/images/accommodation.jpg'),
    },
    {
      title: 'Sports',
      description: 'Split sports & activities',
      icon: 'football-outline' as const,
      route: '/(tabs)/transactions/sports',
      gradient: ['#34C759', '#30D158'],
      image: require('../../assets/images/sports.jpg'),
    },
    {
      title: 'Entertainment',
      description: 'Split movies & events',
      icon: 'film-outline' as const,
      route: '/(tabs)/transactions/entertainment',
      gradient: ['#AF52DE', '#5E5CE6'],
      image: require('../../assets/images/entertainment.jpg'),
    },
    {
      title: 'Receipt',
      description: 'Split from receipt',
      icon: 'receipt-outline' as const,
      route: '/(tabs)/transactions/manual-receipt',
      gradient: ['#FF2D55', '#FF3B30'],
      image: require('../../assets/images/receipt.jpg'),
    },
  ];
  
  // Main screen render
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#0066CC"
        />
      }
    >
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY }]
          }
        ]}
      >
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>
              Hello, {user?.name?.split(' ')[0] || 'there'}!
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.monthlySpendingCard}>
          <LinearGradient
            colors={['#0066CC', '#007AFF']}
            style={styles.monthlySpendingGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          >
            <View style={styles.monthlySpendingContent}>
              <Text style={styles.monthlySpendingLabel}>
                Monthly Spending
              </Text>
              <Text style={styles.monthlySpendingAmount}>
                ${calculateMonthlySpending().toFixed(2)}
              </Text>
              <Text style={styles.monthlySpendingSubtext}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.monthlySpendingIconContainer}>
              <Ionicons name="wallet-outline" size={28} color="white" />
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Split Categories</Text>
        </View>
        
        <Animated.View style={[
          styles.categoriesContainer,
          {
            opacity: categoryOpacity,
            transform: [{ translateY: categoryEnter }]
          }
        ]}>
          {splitCategories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryCard}
              activeOpacity={0.9}
              onPress={() => router.push(category.route)}
            >
              <ImageBackground
                source={category.image}
                style={styles.categoryBackground}
                imageStyle={styles.categoryBackgroundImage}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.categoryGradient}
                >
                  <View style={styles.categoryContent}>
                    <Ionicons name={category.icon} size={24} color="white" />
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={28} color="#CCC" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactions.length > 0 ? (
          <View style={styles.transactionsContainer}>
            {transactions.map((transaction, index) => (
              <TouchableOpacity
                key={index}
                style={styles.transactionCard}
                onPress={() => router.push(`/(tabs)/transactions/details?id=${transaction.id}`)}
              >
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>
                  ${formatAmount(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={32} color="#CCC" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.addBillButton}
        onPress={() => router.push('/(tabs)/createBill')}
      >
        <LinearGradient
          colors={['#0066CC', '#007AFF']}
          style={styles.addBillGradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text style={styles.addBillText}>Add New Bill</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  contentContainer: {
    paddingBottom: 100,
  },
  headerContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: '#333',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  profileButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatar: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: 'white',
  },
  monthlySpendingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  monthlySpendingGradient: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlySpendingContent: {
    flex: 1,
  },
  monthlySpendingLabel: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins',
    opacity: 0.9,
  },
  monthlySpendingAmount: {
    color: 'white',
    fontSize: 28,
    fontFamily: 'PoppinsBold',
    marginVertical: 4,
  },
  monthlySpendingSubtext: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins',
    opacity: 0.8,
  },
  monthlySpendingIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#0066CC',
    fontFamily: 'PoppinsSemiBold',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryBackground: {
    width: '100%',
    height: '100%',
  },
  categoryBackgroundImage: {
    borderRadius: 16,
  },
  categoryGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  categoryContent: {
    padding: 16,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
    marginTop: 8,
    marginBottom: 4,
  },
  categoryDescription: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins',
    opacity: 0.9,
  },
  transactionsContainer: {
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 16,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'PoppinsSemiBold',
    color: '#0066CC',
  },
  loadingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  addBillButton: {
    marginHorizontal: 20,
    marginVertical: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addBillGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  addBillText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
    marginLeft: 8,
  },
});
