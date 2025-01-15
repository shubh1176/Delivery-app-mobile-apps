import { Stack } from 'expo-router';

export default function AddressesLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{
          title: 'My Addresses',
        }}
      />
      <Stack.Screen 
        name="new"
        options={{
          title: 'Add New Address',
        }}
      />
      <Stack.Screen 
        name="[id]"
        options={{
          title: 'Edit Address',
        }}
      />
    </Stack>
  );
} 