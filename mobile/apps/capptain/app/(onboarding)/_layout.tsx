import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="documents"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="bank-details"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="training"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
} 