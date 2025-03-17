import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

type Friend = {
  id: number;
  userId: number;
  friendId: number;
  name: string;
  email: string;
  phone: string;
};

export default function FriendsScreen() {
  const { getFriends, addFriend, removeFriend } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    const friendsList = await getFriends();
    setFriends(friendsList);
    setLoading(false);
  };

  const handleAddFriend = async () => {
    // Validate email
    if (!newFriendEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newFriendEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setAddingFriend(true);
    const success = await addFriend(newFriendEmail);
    setAddingFriend(false);

    if (success) {
      setNewFriendEmail('');
      setAddModalVisible(false);
      loadFriends();
      Alert.alert('Success', 'Friend added successfully');
    } else {
      Alert.alert('Error', 'User not found or already in your friends list');
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.name} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const success = await removeFriend(friend.id);
            if (success) {
              loadFriends();
              Alert.alert('Success', 'Friend removed successfully');
            } else {
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.name}</Text>
          <Text style={styles.friendEmail}>{item.email}</Text>
          <Text style={styles.friendPhone}>{item.phone}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFriend(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="person-add" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0066CC" style={styles.loader} />
      ) : friends.length > 0 ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.friendsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No friends added yet</Text>
          <Text style={styles.emptySubtext}>
            Add friends to easily split bills with them
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.emptyAddButtonText}>Add a Friend</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Friend Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a Friend</Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              Enter your friend's email address
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newFriendEmail}
              onChangeText={setNewFriendEmail}
              placeholder="friend@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleAddFriend}
              disabled={addingFriend}
            >
              {addingFriend ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.modalButtonText}>Add Friend</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addButton: {
    padding: 8,
  },
  loader: {
    flex: 1,
    alignSelf: 'center',
  },
  friendsList: {
    paddingBottom: 20,
  },
  friendItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  friendPhone: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#0066CC',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
