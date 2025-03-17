import React, { useEffect } from 'react';
import { router } from 'expo-router';

// This is a helper file that redirects to the transaction history
export default function TransactionsIndex() {
  useEffect(() => {
    router.replace('/(tabs)/history');
  }, []);
  
  return null;
}
