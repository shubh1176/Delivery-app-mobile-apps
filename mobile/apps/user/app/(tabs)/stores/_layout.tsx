import { Stack } from 'expo-router';

export default function StoresLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{
          title: 'All Stores',
        }}
      />
      <Stack.Screen 
        name="[id]"
        options={{
          title: 'Store Details',
        }}
      />
    </Stack>
  );
} 