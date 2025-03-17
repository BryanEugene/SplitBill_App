import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Enhanced PieChart with touch interaction
interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  onSlicePress: (item: PieChartData) => void;
  totalSpent: number;
}

const PieChart = ({ data, onSlicePress, totalSpent }: PieChartProps) => {
  if (!data || data.length === 0) return null;
  
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  
  return (
    <View style={styles.pieChartContainer}>
      <View style={styles.pieChart}>
        {data.map((item, index) => {
          const angle = (item.value / totalValue) * 360;
          const endAngle = startAngle + angle;
          
          // Calculate coordinates for the slice
          const chartSlice: ViewStyle = {
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ rotate: `${startAngle}deg` }],
            overflow: 'hidden',
          } as const;
          
          const sliceFill: ViewStyle = {
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: [{ rotate: `${angle}deg` }],
            backgroundColor: item.color,
            left: '50%',
          } as const;
          
          // Update start angle for next slice
          startAngle = endAngle;
          
          return (
            <TouchableOpacity 
              key={index} 
              style={chartSlice}
              onPress={() => onSlicePress(item)}
              activeOpacity={0.8}
            >
              <View style={sliceFill} />
            </TouchableOpacity>
          );
        })}
        <View style={styles.pieChartCenter}>
          <Text style={styles.pieChartTotal}>${totalSpent.toFixed(0)}</Text>
          <Text style={styles.pieChartTotalLabel}>Total</Text>
        </View>
      </View>
      
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.name}</Text>
            <Text style={styles.legendValue}>${item.value.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function AnalyticsScreen() {
  const { user, getTransactionHistory } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ name: string; value: number; color: string; }[]>([]);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [totalSpent, setTotalSpent] = useState(0);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Add selected category state
  const [selectedCategory, setSelectedCategory] = useState<PieChartData | null>(null);
  
  // Add monthly trend data
  const [monthlyTrends, setMonthlyTrends] = useState<{ month: string; total: number; }[]>([]);
  
  useEffect(() => {
    loadTransactions();
    
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
  }, [timeFilter]);
  
  // Enhanced loading function to include trends data
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactionHistory();
      
      // Filter transactions based on time
      const filteredData = filterTransactionsByTime(data, timeFilter);
      setTransactions(filteredData);
      
      // Process data for categories
      processTransactionData(filteredData);
      
      // Calculate monthly trends
      calculateMonthlyTrends(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  interface Transaction {
    date: string;
    amount: string;
    participants: string;
    description: string;
  }
  
  const filterTransactionsByTime = (data: any[], filter: 'week' | 'month' | 'year') => {
    const now = new Date();
    let startDate;
    
    switch (filter) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    
    return data.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= now;
    });
  };
  
  const processTransactionData = (transactions: Transaction[]) => {
    const categoryColors: { [key in 'accommodation' | 'sports' | 'entertainment' | 'manual-receipt' | 'default']: string } = {
      'accommodation': '#FF9500',
      'sports': '#34C759',
      'entertainment': '#AF52DE',
      'manual-receipt': '#FF3B30',
      'default': '#007AFF',
    };
    
    const categoryMap: { [key: string]: number } = {};
    let total = 0;
    
    transactions.forEach(transaction => {
      let category = 'default';
      try {
        const parsedParticipants = JSON.parse(transaction.participants);
        if (parsedParticipants && parsedParticipants.type) {
          category = parsedParticipants.type;
        }
      } catch (e) {
        console.error('Error parsing transaction participants:', e);
      }
      
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += parseFloat(transaction.amount);
      total += parseFloat(transaction.amount);
    });
    
    const categoryData = Object.keys(categoryMap).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
      value: categoryMap[key],
      color: (key in categoryColors ? categoryColors[key as keyof typeof categoryColors] : categoryColors['default'])
    }));
    
    setCategories(categoryData);
    setTotalSpent(total);
  };
  
  // Add function to calculate monthly trends
  const calculateMonthlyTrends = (data: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth();
    const trendsData = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      const year = now.getFullYear() - (currentMonth < i ? 1 : 0);
      
      // Filter transactions for this month and year
      const monthTransactions = data.filter(transaction => {
        const date = new Date(transaction.date);
        return date.getMonth() === monthIndex && date.getFullYear() === year;
      });
      
      // Calculate total for this month
      const total = monthTransactions.reduce((sum, transaction) => {
        return sum + parseFloat(transaction.amount);
      }, 0);
      
      trendsData.push({
        month: monthName,
        total
      });
    }
    
    setMonthlyTrends(trendsData);
  };
  
  const renderTimeFilterOptions = () => (
    <View style={styles.timeFilterContainer}>
      <TouchableOpacity
        style={[
          styles.timeFilterOption,
          timeFilter === 'week' && styles.timeFilterSelected
        ]}
        onPress={() => setTimeFilter('week')}
      >
        <Text style={[
          styles.timeFilterText,
          timeFilter === 'week' && styles.timeFilterTextSelected
        ]}>Week</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.timeFilterOption,
          timeFilter === 'month' && styles.timeFilterSelected
        ]}
        onPress={() => setTimeFilter('month')}
      >
        <Text style={[
          styles.timeFilterText,
          timeFilter === 'month' && styles.timeFilterTextSelected
        ]}>Month</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.timeFilterOption,
          timeFilter === 'year' && styles.timeFilterSelected
        ]}
        onPress={() => setTimeFilter('year')}
      >
        <Text style={[
          styles.timeFilterText,
          timeFilter === 'year' && styles.timeFilterTextSelected
        ]}>Year</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Handle pie chart slice press
  const handleSlicePress = (category: PieChartData) => {
    setSelectedCategory(selectedCategory?.name === category.name ? null : category);
  };
  
  // Add category detail view
  const renderCategoryDetail = () => {
    if (!selectedCategory) return null;
    
    // Filter transactions for selected category
    const categoryTransactions = transactions.filter(transaction => {
      try {
        const parsedParticipants = JSON.parse(transaction.participants);
        return parsedParticipants.type === selectedCategory.name.toLowerCase().replace(' ', '-');
      } catch {
        return false;
      }
    });
    
    return (
      <View style={styles.categoryDetailCard}>
        <View style={styles.categoryDetailHeader}>
          <View style={[styles.categoryColorIndicator, { backgroundColor: selectedCategory.color }]} />
          <Text style={styles.categoryDetailTitle}>{selectedCategory.name}</Text>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.categoryDetailAmount}>${selectedCategory.value.toFixed(2)}</Text>
        <Text style={styles.categoryDetailCount}>{categoryTransactions.length} transactions</Text>
        
        <View style={styles.categoryDetailDivider} />
        
        <Text style={styles.recentTransactionsTitle}>Recent Transactions</Text>
        
        {categoryTransactions.slice(0, 3).map((transaction, index) => (
          <View key={index} style={styles.miniTransactionItem}>
            <Text style={styles.miniTransactionName} numberOfLines={1}>
              {transaction.description}
            </Text>
            <Text style={styles.miniTransactionAmount}>
              ${parseFloat(transaction.amount).toFixed(2)}
            </Text>
          </View>
        ))}
        
        {categoryTransactions.length > 3 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/history')}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  // Render monthly trend chart
  const renderMonthlyTrend = () => (
    <View style={styles.monthlyTrendCard}>
      <Text style={styles.monthlyTrendTitle}>Monthly Spending Trend</Text>
      
      <View style={styles.barChartContainer}>
        {monthlyTrends.map((item, index) => {
          const maxValue = Math.max(...monthlyTrends.map(trend => trend.total));
          const barHeight = maxValue > 0 ? (item.total / maxValue) * 120 : 0;
          
          return (
            <View key={index} style={styles.barChartColumn}>
              <Text style={styles.barChartValue}>
                ${item.total > 0 ? item.total.toFixed(0) : '0'}
              </Text>
              <View style={styles.barChartBarContainer}>
                <View 
                  style={[
                    styles.barChartBar, 
                    { height: Math.max(barHeight, 4) },
                    index === monthlyTrends.length - 1 && styles.barChartBarCurrent
                  ]} 
                />
              </View>
              <Text style={styles.barChartLabel}>{item.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
  
  // Modify renderCategoryInsights to include the new components
  const renderCategoryInsights = () => {
    if (categories.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateText}>No spending data available</Text>
        </View>
      );
    }
    
    // Find highest spending category
    let highestCategory = categories[0];
    categories.forEach(cat => {
      if (cat.value > highestCategory.value) {
        highestCategory = cat;
      }
    });
    
    return (
      <>
        <PieChart 
          data={categories} 
          onSlicePress={handleSlicePress}
          totalSpent={totalSpent}
        />
        
        {selectedCategory ? renderCategoryDetail() : (
          <>
            <View style={styles.insightCard}>
              <LinearGradient
                colors={['#0066CC', '#007AFF']}
                style={styles.insightGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.insightIconContainer}>
                  <Ionicons name="trending-up" size={24} color="white" />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Highest Spending</Text>
                  <Text style={styles.insightCategory}>{highestCategory.name}</Text>
                  <Text style={styles.insightValue}>${highestCategory.value.toFixed(2)}</Text>
                </View>
              </LinearGradient>
            </View>
            
            <View style={styles.transactionSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>{transactions.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Categories</Text>
                <Text style={styles.summaryValue}>{categories.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
              </View>
            </View>
            
            {renderMonthlyTrend()}
          </>
        )}
      </>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Spending Overview</Text>
            {renderTimeFilterOptions()}
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0066CC" />
              <Text style={styles.loadingText}>Loading analytics...</Text>
            </View>
          ) : (
            renderCategoryInsights()
          )}
          
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Tips to Save Money</Text>
            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="bulb-outline" size={28} color="#FF9500" />
              </View>
              <Text style={styles.tipText}>Split accommodation costs with more friends to reduce per-person expenses.</Text>
            </View>
            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="receipt-outline" size={28} color="#FF3B30" />
              </View>
              <Text style={styles.tipText}>Use scan receipt to accurately split items and avoid overpaying.</Text>
            </View>
          </View>
        </Animated.View>
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
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    padding: 20,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 16,
  },
  timeFilterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    padding: 4,
  },
  timeFilterOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 21,
  },
  timeFilterSelected: {
    backgroundColor: '#0066CC',
  },
  timeFilterText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#666',
  },
  timeFilterTextSelected: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Poppins',
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontFamily: 'Poppins',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  pieChartContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  pieChart: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f0f0f0',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
  },
  pieChartCenter: {
    position: 'absolute',
    top: '30%',
    left: '30%',
    width: '40%',
    height: '40%',
    borderRadius: 100,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: '#333',
  },
  pieChartTotalLabel: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#666',
  },
  legendContainer: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    flex: 1,
    color: '#333',
  },
  legendValue: {
    fontFamily: 'PoppinsSemiBold',
    fontSize: 14,
    color: '#0066CC',
  },
  insightCard: {
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  insightIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  insightCategory: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 4,
  },
  insightValue: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'PoppinsBold',
  },
  transactionSummary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  tipsContainer: {
    marginTop: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  monthlyTrendCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyTrendTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 16,
    color: '#333',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  barChartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barChartValue: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#666',
    marginBottom: 4,
  },
  barChartBarContainer: {
    height: 120,
    justifyContent: 'flex-end',
  },
  barChartBar: {
    width: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  barChartBarCurrent: {
    backgroundColor: '#0066CC',
  },
  barChartLabel: {
    fontSize: 12,
    fontFamily: 'Poppins',
    color: '#666',
    marginTop: 8,
  },
  categoryDetailCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryDetailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    color: '#333',
  },
  categoryDetailAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'PoppinsBold',
    color: '#0066CC',
    marginBottom: 4,
  },
  categoryDetailCount: {
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#666',
  },
  categoryDetailDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  recentTransactionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    marginBottom: 12,
    color: '#333',
  },
  miniTransactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  miniTransactionName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins',
    color: '#333',
  },
  miniTransactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
    color: '#0066CC',
  },
  viewAllButton: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
    color: '#0066CC',
  },
});
