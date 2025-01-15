import { Stack } from 'expo-router';
import { View } from 'react-native';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent'
        }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login-email" />
      <Stack.Screen name="login-phone" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify" />
    </Stack>
  );
} 