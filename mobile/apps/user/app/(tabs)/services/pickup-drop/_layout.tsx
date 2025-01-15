import React from 'react';
import { Stack } from 'expo-router';
import { OrderCreationProvider } from '../../../../contexts/OrderCreationContext';

export default function PickupDropLayout() {
  return (
    <OrderCreationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Pickup & Drop' }}
        />
        <Stack.Screen
          name="location"
          options={{ title: 'Select Locations' }}
        />
        <Stack.Screen
          name="package"
          options={{ title: 'Package Details' }}
        />
        <Stack.Screen
          name="schedule"
          options={{ title: 'Schedule Pickup' }}
        />
        <Stack.Screen
          name="payment"
          options={{ title: 'Review & Pay' }}
        />
      </Stack>
    </OrderCreationProvider>
  );
} 