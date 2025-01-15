import { Stack } from 'expo-router';

export default function AddressesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Addresses',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Add New Address',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Edit Address',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 