import React from 'react';
import { SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' }
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="courier"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="pickup-drop"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaView>
  );
} 