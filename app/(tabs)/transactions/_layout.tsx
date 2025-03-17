import { Stack } from 'expo-router';

export default function TransactionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="details" />
      <Stack.Screen name="manual-receipt" />
      <Stack.Screen name="sports" />
      <Stack.Screen name="entertainment" />
      <Stack.Screen name="accommodation" />
      <Stack.Screen name="food" />
      <Stack.Screen name="travel" />
    </Stack>
  );
}
