import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

type Participant = {
  id: number;
  name: string;
};

export default function TransactionDetailsScreen() {
  const { getTransactionHistory, user } = useAuth();
  const params = useLocalSearchParams();
  const transactionId = parseInt(params.id as string);
  
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    loadTransactionDetails();
  }, [transactionId]);

  const loadTransactionDetails = async () => {
    setLoading(true);
    try {
      // Get all transactions and find the one with matching ID
      const transactions = await getTransactionHistory();
      const found = transactions.find(t => t.id === transactionId);
      
      if (found) {
        setTransaction(found);
        try {
          const parsedParticipants = JSON.parse(found.participants);
          setParticipants(parsedParticipants);
        } catch (e) {
          console.error('Error parsing participants:', e);
          setParticipants([]);
        }
      }
    } catch (error) {
      console.error('Error loading transaction details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const calculateAmountPerPerson = () => {
    if (!transaction || participants.length === 0) return '0.00';
    return (transaction.amount / participants.length).toFixed(2);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading transaction details...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Transaction not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isCreator = transaction.createdBy === user?.id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
          <Ionicons name="arrow-back" size={24} color="#0066CC" />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.amount}>${parseFloat(transaction.amount).toFixed(2)}</Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Created by:</Text>
          <Text style={styles.infoValue}>
            {isCreator ? 'You' : participants.find(p => p.id === transaction.createdBy)?.name || 'Unknown'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Split type:</Text>
          <Text style={styles.infoValue}>Equal split</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Amount per person:</Text>
          <Text style={styles.infoValue}>${calculateAmountPerPerson()}</Text>
        </View>
      </View>

      <View style={styles.participantsCard}>
        <Text style={styles.cardTitle}>Participants ({participants.length})</Text>
        
        {participants.map((participant, index) => (
          <View key={index} style={styles.participantItem}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantAvatarText}>
                {participant.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {participant.id === user?.id ? 'You' : participant.name}
              </Text>
              <Text style={styles.participantAmount}>
                ${calculateAmountPerPerson()}
              </Text>
            </View>
            <Text style={[
              styles.participantStatus,
              participant.id === user?.id ? styles.participantStatusYou : {}
            ]}>
              {participant.id === user?.id ? 'Your share' : 'Not paid'}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#0066CC" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        {isCreator && (
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]}>
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Transaction</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButtonHeader: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  description: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  participantAmount: {
    fontSize: 14,
    color: '#666',
  },
  participantStatus: {
    fontSize: 14,
    color: '#FF9500',
  },
  participantStatusYou: {
    color: '#34C759',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#0066CC',
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
});
