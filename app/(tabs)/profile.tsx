import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile data - in a full app, you would implement update functionality
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const handleSaveProfile = () => {
    // This would save the profile in a complete implementation
    Alert.alert(
      'Profile Update',
      'In a complete implementation, this would update your profile.',
      [{ text: 'OK', onPress: () => setIsEditing(false) }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          {!isEditing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false} // Email shouldn't be editable as it's the login ID
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setName(user?.name || '');
                  setEmail(user?.email || '');
                  setPhone(user?.phone || '');
                  setIsEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.nameText}>{user?.name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#666" />
              <Text style={styles.infoText}>{user?.phone}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="lock-closed-outline" size={20} color="#0066CC" />
          <Text style={styles.menuText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={20} color="#0066CC" />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-outline" size={20} color="#0066CC" />
          <Text style={styles.menuText}>Privacy Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={20} color="#0066CC" />
          <Text style={styles.menuText}>Help & FAQ</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="chatbubble-outline" size={20} color="#0066CC" />
          <Text style={styles.menuText}>Contact Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={20} color="#0066CC" />
          <Text style={styles.menuText}>About</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.logoutButton2}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.footer}>
        <Text style={styles.versionText}>Split Bill App v1.0.0</Text>
      </View>
    </ScrollView>
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
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0066CC',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  editForm: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    color: '#666',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#0066CC',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
    color: '#333',
  },
  logoutButton2: {
    margin: 16,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  versionText: {
    color: '#999',
    fontSize: 14,
  },
});
