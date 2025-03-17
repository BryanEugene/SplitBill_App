import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0066CC',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="analytics" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="createBill"
        options={{
          title: 'Create Bill',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          href: null, // Hide this tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          href: null, // Hide this tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="specialBills"
        options={{
          href: null, // Hide this tab from the tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButtonContainer: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
    width: '100%',
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0066CC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
