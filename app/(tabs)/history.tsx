import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

type Transaction = {
  id: number;
  description: string;
  amount: number;
  date: string;
  participants: string; // JSON string
  createdBy: number;
};

export default function HistoryScreen() {
  const { getTransactionHistory, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const history = await getTransactionHistory();
    setTransactions(history);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const parseParticipants = (participantsJson: string) => {
    try {
      return JSON.parse(participantsJson);
    } catch (e) {
      return [];
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    router.push(`/(tabs)/transactions/details?id=${transaction.id}`);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const participants = parseParticipants(item.participants);
    const isCreator = item.createdBy === user?.id;
    
    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => handleTransactionPress(item)}
      >
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionAmount}>
            ${parseFloat(item.amount.toString()).toFixed(2)}
          </Text>
          <Text style={styles.transactionParticipants}>
            {participants.length} participants
          </Text>
        </View>
        
        <View style={styles.transactionFooter}>
          <Text style={styles.transactionStatus}>
            {isCreator ? 'You created this bill' : 'You were added to this bill'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity onPress={loadTransactions} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
      ) : transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.transactionList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>
            Your transaction history will appear here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  loader: {
    flex: 1,
    alignSelf: 'center',
  },
  transactionList: {
    paddingBottom: 20,
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  transactionParticipants: {
    fontSize: 14,
    color: '#666',
  },
  transactionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginTop: 4,
  },
  transactionStatus: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});
