import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import RestaurantFinder from '@/components/RestaurantFinder';

const { width } = Dimensions.get('window');

type ReceiptItem = {
  id: string;
  name: string;
  price: string;
  participants: string[];
};

type SelectedFriend = {
  id: number;
  name: string;
};

type ScannedItem = {
  id: string;
  name: string;
  price: string;
  selected: boolean;
};

export default function ManualReceiptScreen() {
  const { user, addTransaction, getFriends } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([
    { id: '1', name: '', price: '', participants: [] },
  ]);
  const [friends, setFriends] = useState<SelectedFriend[]>([]);
  const [includeYourself, setIncludeYourself] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [showRestaurantFinder, setShowRestaurantFinder] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Add these new state variables for enhanced receipt scanning
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [showScannedItemsModal, setShowScannedItemsModal] = useState(false);

  // Animation value for scanned items modal
  const modalAnimation = useRef(new Animated.Value(0)).current;

  // Add tax and tip state variables
  const [taxPercent, setTaxPercent] = useState('8.25');
  const [tipPercent, setTipPercent] = useState('15');
  const [showTaxTipModal, setShowTaxTipModal] = useState(false);
  const tipTaxModalAnim = useRef(new Animated.Value(0)).current;
  
  // Add state for suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Common food items for suggestions
  const commonFoodItems = [
    { name: 'Hamburger', price: '12.99' },
    { name: 'Steak', price: '15.99' },
    { name: 'Pasta', price: '14.50' },
    { name: 'Salad', price: '8.99' },
    { name: 'French Fries', price: '4.99' },
    { name: 'Chicken Wings', price: '10.99' },
    { name: 'Steak', price: '22.99' },
    { name: 'Fish & Chips', price: '16.99' },
    { name: 'Beer', price: '5.99' },
    { name: 'Soda', price: '2.99' },
    { name: 'Coffee', price: '5.99' },
    { name: 'Wine (Glass)', price: '7.99' },
    { name: 'Dessert', price: '7.50' },
  ];
  
  // Filter suggestions based on search query
  const filteredSuggestions = searchQuery 
    ? commonFoodItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
    
  // Handle item focus for showing suggestions
  const handleItemFocus = (itemId: string) => {
    setFocusedItemId(itemId);
    setShowSuggestions(true);
  };
  
  // Handle item blur to hide suggestions
  const handleItemBlur = () => {
    // Use timeout to allow item selection before hiding
    setTimeout(() => {
      setShowSuggestions(false);
      setFocusedItemId(null);
    }, 200);
  };
  
  // Apply food item suggestion
  const applyFoodItemSuggestion = (suggestion: { name: string, price: string }) => {
    if (focusedItemId) {
      updateItem(focusedItemId, 'name', suggestion.name);
      updateItem(focusedItemId, 'price', suggestion.price);
      setShowSuggestions(false);
    }
  };

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
    setFriends(friendsList.map(friend => ({
      id: friend.id,
      name: friend.name,
    })));
  };

  const addItem = () => {
    const newItem = {
      id: (receiptItems.length + 1).toString(),
      name: '',
      price: '',
      participants: [],
    };
    setReceiptItems([...receiptItems, newItem]);
  };

  const removeItem = (id: string) => {
    if (receiptItems.length === 1) {
      Alert.alert('Error', 'You need at least one item');
      return;
    }
    setReceiptItems(receiptItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: 'name' | 'price', value: string) => {
    setReceiptItems(
      receiptItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const toggleParticipant = (itemId: string, participantId: number) => {
    const item = receiptItems.find(item => item.id === itemId);
    if (!item) return;

    const currentParticipants = item.participants || [];
    const participantIdStr = participantId.toString();

    if (currentParticipants.includes(participantIdStr)) {
      updateItemParticipants(
        itemId,
        currentParticipants.filter(id => id !== participantIdStr)
      );
    } else {
      updateItemParticipants(
        itemId,
        [...currentParticipants, participantIdStr]
      );
    }
  };

  const updateItemParticipants = (itemId: string, participantIds: string[]) => {
    setReceiptItems(
      receiptItems.map(item =>
        item.id === itemId ? { ...item, participants: participantIds } : item
      )
    );
  };

  const calculateSubtotal = () => {
    return receiptItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(taxPercent) / 100 || 0;
    return subtotal * taxRate;
  };

  const calculateTip = () => {
    const subtotal = calculateSubtotal();
    const tipRate = parseFloat(tipPercent) / 100 || 0;
    return subtotal * tipRate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateTip();
  };

  const calculateItemCostPerPerson = (item: ReceiptItem) => {
    const participantCount = item.participants.length;
    if (participantCount === 0) return "0.00";
    
    const itemPrice = parseFloat(item.price) || 0;
    return (itemPrice / participantCount).toFixed(2);
  };

  const calculatePersonTaxAndTipContribution = (personId: string) => {
    const allParticipantIds = new Set<string>();
    let personSubtotal = 0;
    
    receiptItems.forEach(item => {
      item.participants.forEach(id => allParticipantIds.add(id));
      
      if (item.participants.includes(personId)) {
        const itemPrice = parseFloat(item.price) || 0;
        personSubtotal += itemPrice / item.participants.length;
      }
    });
    
    if (allParticipantIds.size === 0 || calculateSubtotal() === 0) return 0;
    
    const personProportion = personSubtotal / calculateSubtotal();
    return (calculateTax() + calculateTip()) * personProportion;
  };

  const calculatePersonTotal = (personId: string) => {
    let personSubtotal = 0;
    
    receiptItems.forEach(item => {
      if (item.participants.includes(personId)) {
        const itemPrice = parseFloat(item.price) || 0;
        personSubtotal += itemPrice / item.participants.length;
      }
    });
    
    const taxAndTipShare = calculatePersonTaxAndTipContribution(personId);
    
    return (personSubtotal + taxAndTipShare).toFixed(2);
  };

  const handleSaveReceipt = async () => {
    if (!storeName.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }

    for (const item of receiptItems) {
      if (!item.name.trim()) {
        Alert.alert('Error', 'Please enter a name for all items');
        return;
      }
      if (!item.price.trim() || isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0) {
        Alert.alert('Error', 'Please enter a valid price for all items');
        return;
      }
      if (item.participants.length === 0) {
        Alert.alert('Error', 'Please select at least one participant for each item');
        return;
      }
    }
    
    setIsLoading(true);

    try {
      const uniqueParticipants = new Set<string>();
      receiptItems.forEach(item => {
        item.participants.forEach(pid => uniqueParticipants.add(pid));
      });

      const personTotals = Array.from(uniqueParticipants).map(pid => ({
        id: parseInt(pid),
        name: pid === user?.id?.toString() ? user.name : friends.find(f => f.id.toString() === pid)?.name || "Unknown",
        itemsTotal: receiptItems.reduce((sum, item) => {
          if (item.participants.includes(pid)) {
            const price = parseFloat(item.price) || 0;
            return sum + (price / item.participants.length);
          }
          return sum;
        }, 0),
        taxAndTipShare: calculatePersonTaxAndTipContribution(pid),
        total: parseFloat(calculatePersonTotal(pid))
      }));

      const receiptData = {
        description: `Receipt from ${storeName}`,
        amount: calculateTotal(),
        date: new Date().toISOString(),
        participants: JSON.stringify({
          type: 'manual-receipt',
          items: receiptItems.map(item => ({
            name: item.name,
            price: item.price,
            participants: item.participants.map(pid => ({
              id: parseInt(pid),
              name: pid === user?.id?.toString() ? user.name : friends.find(f => f.id.toString() === pid)?.name || "Unknown",
              share: calculateItemCostPerPerson(item),
            })),
          })),
          tax: {
            percent: parseFloat(taxPercent),
            amount: calculateTax()
          },
          tip: {
            percent: parseFloat(tipPercent),
            amount: calculateTip()
          },
          subtotal: calculateSubtotal(),
          total: calculateTotal(),
          receiptImage: receiptImage,
          personTotals: personTotals,
          includeYourself: includeYourself,
          date: date,
        }),
        createdBy: user?.id || 0,
      };
      const success = await addTransaction(receiptData);
      
      if (success) {
        Alert.alert('Success', 'Receipt saved successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save receipt');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the receipt');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderParticipantSelector = (itemId: string) => {
    const item = receiptItems.find(i => i.id === itemId);
    if (!item) return null;

    return (
      <View style={styles.participantSelector}>
        <View style={styles.participantHeaderRow}>
          <Text style={styles.participantLabel}>Who's paying for this item?</Text>
          {item.participants.length > 0 && (
            <Text style={styles.perPersonCost}>
              ${calculateItemCostPerPerson(item)}/person
            </Text>
          )}
        </View>
        <View style={styles.participantChipsContainer}>
          {includeYourself && (
            <TouchableOpacity
              style={[
                styles.participantChip,
                item.participants.includes(user?.id?.toString() || '') && styles.participantChipSelected,
              ]}
              onPress={() => toggleParticipant(itemId, user?.id || 0)}
            >
              <Text
                style={[
                  styles.participantChipText,
                  item.participants.includes(user?.id?.toString() || '') && styles.participantChipTextSelected,
                ]}
              >
                You
              </Text>
            </TouchableOpacity>
          )}
          {friends.map(friend => (
            <TouchableOpacity
              key={friend.id}
              style={[
                styles.participantChip,
                item.participants.includes(friend.id.toString()) && styles.participantChipSelected,
              ]}
              onPress={() => toggleParticipant(itemId, friend.id)}
            >
              <Text
                style={[
                  styles.participantChipText,
                  item.participants.includes(friend.id.toString()) && styles.participantChipTextSelected,
                ]}
              >
                {friend.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
      setIsAddingImage(false);
      processReceiptImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Camera access is required to take pictures");
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
      setIsAddingImage(false);
      processReceiptImage(result.assets[0].uri);
    }
  };

  const processReceiptImage = (imageUri: string) => {
    setIsScanning(true);
    setTimeout(() => {
      if (!storeName) {
        const storeOptions = ["Coffee Shop", "Local Restaurant", "Grocery Store", "Corner Deli", "Cafe"];
        setStoreName(storeOptions[Math.floor(Math.random() * storeOptions.length)]);
      }
      
      const potentialItems = [
        { name: "Burger", price: "12.99" },
        { name: "French Fries", price: "4.50" },
        { name: "Coffee", price: "3.99" },
        { name: "Caesar Salad", price: "8.75" },
        { name: "Soft Drink", price: "2.50" },
        { name: "Sandwich", price: "9.25" },
        { name: "Pizza Slice", price: "5.75" },
        { name: "Soup of the Day", price: "6.50" },
      ];
      
      const itemCount = 4 + Math.floor(Math.random() * 4);
      const shuffledItems = [...potentialItems].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, itemCount);
      
      const scannedItems: ScannedItem[] = selectedItems.map((item, index) => ({
        id: (index + 1).toString(),
        name: item.name,
        price: item.price,
        selected: true
      }));
      
      setScannedItems(scannedItems);
      setIsScanning(false);
      showScannedItemsModalWithAnimation();
    }, 2000);
  };

  const showScannedItemsModalWithAnimation = () => {
    setShowScannedItemsModal(true);
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideScannedItemsModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowScannedItemsModal(false);
    });
  };

  const toggleScannedItemSelection = (id: string) => {
    setScannedItems(
      scannedItems.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleAddScannedItems = () => {
    const selectedItems = scannedItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      Alert.alert("No Items Selected", "Please select at least one item from the receipt.");
      return;
    }
    
    const newItems = selectedItems.map((item, idx) => ({
      id: (receiptItems.length + idx + 1).toString(),
      name: item.name,
      price: item.price,
      participants: [],
    }));
    
    if (receiptItems.length === 1 && !receiptItems[0].name && !receiptItems[0].price) {
      setReceiptItems(newItems);
    } else {
      setReceiptItems([...receiptItems, ...newItems]);
    }
    
    hideScannedItemsModal();
    
    setTimeout(() => {
      Alert.alert(
        "Items Added",
        "Now assign each item to the people who should pay for it by selecting participants for each item."
      );
    }, 500);
  };

  const showTaxAndTipModal = () => {
    setShowTaxTipModal(true);
    Animated.timing(tipTaxModalAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTaxAndTipModal = () => {
    Animated.timing(tipTaxModalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowTaxTipModal(false);
    });
  };

  const handleSelectRestaurant = (restaurant: { id: string; name: string }) => {
    setStoreName(restaurant.name);
    setShowRestaurantFinder(false);
  };

  const renderRestaurantInput = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Restaurant Name</Text>
      <View style={styles.restaurantInputContainer}>
        <TextInput
          style={styles.restaurantInput}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="Enter restaurant name"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.findRestaurantButton}
          onPress={() => setShowRestaurantFinder(true)}
        >
          <Ionicons name="search" size={20} color="#0066CC" />
          <Text style={styles.findRestaurantText}>Find</Text>
        </TouchableOpacity>
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
          <Text style={styles.title}>Manual Receipt</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt Details</Text>
            
            {renderRestaurantInput()}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={styles.datePickerButton}>
                <Text style={styles.dateText}>{date}</Text>
                <Ionicons name="calendar-outline" size={20} color="#0066CC" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.photoSection}>
              <View style={styles.photoHeaderRow}>
                <Text style={styles.label}>Receipt Photo</Text>
                {receiptImage && (
                  <TouchableOpacity onPress={() => setReceiptImage(null)} style={styles.removePhotoButton}>
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {receiptImage ? (
                <View style={styles.receiptImageContainer}>
                  <Image source={{ uri: receiptImage }} style={styles.receiptImage} />
                  <TouchableOpacity 
                    style={styles.rescanButton}
                    onPress={() => processReceiptImage(receiptImage)}
                  >
                    <Ionicons name="scan" size={16} color="white" />
                    <Text style={styles.rescanButtonText}>Scan Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.photoButton}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera-outline" size={24} color="#0066CC" />
                    <Text style={styles.photoButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.photoButton}
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={24} color="#0066CC" />
                    <Text style={styles.photoButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            {receiptItems.map((item, index) => (
              <View key={item.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumberText}>Item {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                <View style={styles.itemRow}>
                  <View style={[styles.inputContainer, { flex: 2, marginRight: 10 }]}>
                    <Text style={styles.label}>Item Name</Text>
                    <TextInput
                      style={styles.input}
                      value={item.name}
                      onChangeText={(value) => {
                        updateItem(item.id, 'name', value);
                        setSearchQuery(value);
                      }}
                      placeholder="Item name"
                      placeholderTextColor="#999"
                      onFocus={() => handleItemFocus(item.id)}
                      onBlur={handleItemBlur} 
                    />
                  </View>
                  <View style={[styles.inputContainer, { flex: 1 }]}>
                    <Text style={styles.label}>Price</Text>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.currencySymbol}>$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={item.price}
                        onChangeText={(value) => updateItem(item.id, 'price', value)}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>
                </View>

                {renderParticipantSelector(item.id)}
              </View>
            ))}

            <TouchableOpacity 
              style={styles.addItemButton} 
              onPress={addItem}
            >
              <Ionicons name="add-circle-outline" size={24} color="#0066CC" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Amount:</Text>
              <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
            </View>

            <TouchableOpacity 
              style={styles.taxAndTipButton} 
              onPress={showTaxAndTipModal}
            >
              <Ionicons name="calculator-outline" size={20} color="#0066CC" />
              <Text style={styles.taxAndTipButtonText}>
                Tax ({taxPercent}%) and Tip ({tipPercent}%)
              </Text>  
              <Ionicons name="chevron-forward" size={20} color="#0066CC" />
            </TouchableOpacity>
          </View>

          {receiptItems.some(item => item.participants.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              
              {includeYourself && receiptItems.some(item => 
                item.participants.includes(user?.id?.toString() || '')
              ) && (
                <View style={styles.personSummary}>
                  <View style={styles.personSummaryHeader}>
                    <View style={styles.personAvatar}>
                      <Text style={styles.personAvatarText}>
                        {user?.name?.charAt(0).toUpperCase() || 'Y'}
                      </Text>
                    </View>
                    <View style={styles.personDetails}>
                      <Text style={styles.personName}>You</Text>
                      <Text style={styles.personItemsCount}>
                        {receiptItems.filter(item => 
                          item.participants.includes(user?.id?.toString() || '')
                        ).length} items
                      </Text>
                    </View>
                    <Text style={styles.personTotal}>
                      ${calculatePersonTotal(user?.id?.toString() || "")}
                    </Text>
                  </View>
                </View>
              )}
              
              {friends.map(friend => {
                if (receiptItems.some(item => item.participants.includes(friend.id.toString()))) {
                  return (
                    <View key={friend.id} style={styles.personSummary}>
                      <View style={styles.personSummaryHeader}>
                        <View style={styles.personAvatar}>
                          <Text style={styles.personAvatarText}>
                            {friend.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.personDetails}>
                          <Text style={styles.personName}>{friend.name}</Text>
                          <Text style={styles.personItemsCount}>
                            {receiptItems.filter(item => 
                              item.participants.includes(friend.id.toString())
                            ).length} items
                          </Text>
                        </View>
                        <Text style={styles.personTotal}>
                          ${calculatePersonTotal(friend.id.toString())}
                        </Text>
                      </View>
                    </View>
                  );
                }
                return null;
              })}
            </View>
          )}

          <View style={styles.includeYourselfContainer}>
            <Text style={styles.label}>Include yourself as a participant</Text>
            <Switch
              value={includeYourself}
              onValueChange={setIncludeYourself}
              trackColor={{ false: '#ccc', true: '#0066CC' }}
              thumbColor="white"
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleSaveReceipt}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.createButtonText}>Save Receipt</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {isScanning && (
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningContent}>
            <ActivityIndicator size="large" color="#0066CC" />
            <Text style={styles.scanningText}>Scanning Receipt...</Text>
            <Text style={styles.scanningSubtext}>Detecting items and prices</Text>
          </View>
        </View>
      )}

      <Modal
        transparent={true}
        visible={showScannedItemsModal}
        animationType="none"
        onRequestClose={hideScannedItemsModal}
      >
        <View style={styles.scannedItemsModalOverlay}>
          <Animated.View 
            style={[
              styles.scannedItemsModalContainer,
              {
                transform: [
                  { translateY: modalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  }) }
                ],
                opacity: modalAnimation
              }
            ]}
          >
            <View style={styles.scannedItemsModalHeader}>
              <Text style={styles.scannedItemsModalTitle}>Detected Items</Text>
              <TouchableOpacity onPress={hideScannedItemsModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.scannedItemsModalSubtitle}>
              We detected the following items. Select the ones you want to add to your bill.
            </Text>
            
            <ScrollView style={styles.scannedItemsList}>
              {scannedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.scannedItem, item.selected && styles.scannedItemSelected]}
                  onPress={() => toggleScannedItemSelection(item.id)}
                >
                  <View style={styles.scannedItemCheckbox}>
                    {item.selected && <Ionicons name="checkmark" size={18} color="white" />}
                  </View>
                  <View style={styles.scannedItemInfo}>
                    <Text style={styles.scannedItemName}>{item.name}</Text>
                    <Text style={styles.scannedItemPrice}>${item.price}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.scannedItemsControls}>
              <TouchableOpacity 
                style={styles.selectAllButton}
                onPress={() => setScannedItems(scannedItems.map(item => ({ ...item, selected: true })))}
              >
                <Text style={styles.selectAllButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addScannedItemsButton}
                onPress={handleAddScannedItems}
              >
                <Text style={styles.addScannedItemsButtonText}>
                  Add Selected ({scannedItems.filter(item => item.selected).length})
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={showTaxTipModal}
        animationType="none"
        onRequestClose={hideTaxAndTipModal}
      >
        <BlurView intensity={80} style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              {
                opacity: tipTaxModalAnim,
                transform: [{ scale: tipTaxModalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                }) }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tax & Tip</Text>
              <TouchableOpacity onPress={hideTaxAndTipModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tax Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={taxPercent}
                  onChangeText={setTaxPercent}
                  placeholder="Enter tax percentage"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tip Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={tipPercent}
                  onChangeText={setTipPercent}
                  placeholder="Enter tip percentage"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.tipButtonsRow}>
                <TouchableOpacity 
                  style={[styles.tipButton, tipPercent === '15' && styles.tipButtonSelected]} 
                  onPress={() => setTipPercent('15')}
                >
                  <Text style={[styles.tipButtonText, tipPercent === '15' && styles.tipButtonTextSelected]}>15%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tipButton, tipPercent === '18' && styles.tipButtonSelected]} 
                  onPress={() => setTipPercent('18')}
                >
                  <Text style={[styles.tipButtonText, tipPercent === '18' && styles.tipButtonTextSelected]}>18%</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tipButton, tipPercent === '20' && styles.tipButtonSelected]} 
                  onPress={() => setTipPercent('20')}
                >
                  <Text style={[styles.tipButtonText, tipPercent === '20' && styles.tipButtonTextSelected]}>20%</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.calculationPreview}>
                <Text style={styles.calculationTitle}>Calculation Preview</Text>
                
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Subtotal:</Text>
                  <Text style={styles.calculationValue}>${calculateSubtotal().toFixed(2)}</Text>
                </View>
                
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Tax ({taxPercent}%):</Text>
                  <Text style={styles.calculationValue}>${calculateTax().toFixed(2)}</Text>
                </View>
                
                <View style={styles.calculationRow}>
                  <Text style={styles.calculationLabel}>Tip ({tipPercent}%):</Text>
                  <Text style={styles.calculationValue}>${calculateTip().toFixed(2)}</Text>
                </View>
                
                <View style={styles.calculationTotalRow}>
                  <Text style={styles.calculationTotalLabel}>Total:</Text>
                  <Text style={styles.calculationTotalValue}>${calculateTotal().toFixed(2)}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={hideTaxAndTipModal}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {showRestaurantFinder && (
        <Modal
          visible={showRestaurantFinder}
          animationType="slide"
          onRequestClose={() => setShowRestaurantFinder(false)}
        >
          <RestaurantFinder
            onSelectRestaurant={handleSelectRestaurant}
            onClose={() => setShowRestaurantFinder(false)}
          />
        </Modal>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
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
  photoSection: {
    marginBottom: 16,
  },
  photoButton: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#0066CC',
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addItemText: {
    fontSize: 16,
    color: '#0066CC',
    marginLeft: 4,
    fontFamily: 'Poppins',
  },
  itemContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumberText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  itemRow: {
    flexDirection: 'row',
  },
  priceInputContainer: {
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
    fontFamily: 'Poppins',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  participantSelector: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  participantLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
    width: '100%',
    fontFamily: 'Poppins',
  },
  participantChip: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  participantChipSelected: {
    backgroundColor: '#0066CC',
  },
  participantChipText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins',
  },
  participantChipTextSelected: {
    color: 'white',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
    fontFamily: 'PoppinsBold',
  },
  includeYourselfContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  removePhotoButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removePhotoText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButtonSplit: {
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    flex: 0.48,
  },
  receiptImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rescanButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Poppins',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f0f7ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  scanItemsText: {
    color: '#0066CC',
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Poppins',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  scanningText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    fontFamily: 'PoppinsSemiBold',
  },
  scanningSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  scannedItemsModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannedItemsModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  scannedItemsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scannedItemsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
  },
  scannedItemsModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  scannedItemsList: {
    maxHeight: 300,
  },
  scannedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  scannedItemSelected: {
    backgroundColor: '#e6f2ff',
  },
  scannedItemCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0066CC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0066CC',
  },
  scannedItemInfo: {
    flex: 1,
  },
  scannedItemName: {
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  scannedItemPrice: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  scannedItemsControls: {
    flexDirection: 'row',
    marginTop: 16,
  },
  selectAllButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectAllButtonText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  addScannedItemsButton: {
    flex: 2,
    backgroundColor: '#0066CC',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addScannedItemsButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'PoppinsSemiBold',
  },
  participantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  perPersonCost: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  participantChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  taxAndTipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  taxAndTipButtonText: {
    flex: 1,
    color: '#0066CC',
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Poppins',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
    fontFamily: 'PoppinsSemiBold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    marginBottom: 20,
  },
  tipButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tipButton: {
    flex: 0.3,
    backgroundColor: '#f8f8f8',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tipButtonSelected: {
    backgroundColor: '#0066CC',
  },
  tipButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins',
  },
  tipButtonTextSelected: {
    color: 'white',
  },
  calculationPreview: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'PoppinsSemiBold',
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins',
  },
  calculationValue: {
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  calculationTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  calculationTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  calculationTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0066CC',
    fontFamily: 'PoppinsSemiBold',
  },
  applyButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0066CC',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
  },
  personSummary: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  personSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'PoppinsSemiBold',
  },
  personDetails: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'PoppinsSemiBold',
  },
  personItemsCount: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins',
  },
  personTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066CC',
    fontFamily: 'PoppinsSemiBold',
  },
  restaurantInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  restaurantInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  findRestaurantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    height: '100%',
    paddingHorizontal: 15,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  findRestaurantText: {
    color: '#0066CC',
    marginLeft: 5,
    fontFamily: 'Poppins',
    fontSize: 14,
  },
});
