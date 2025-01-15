import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CourierOrderProvider } from './context/CourierOrderContext';

export default function CourierLayout() {
  return (
    <CourierOrderProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen 
            name="index"
            options={{
              title: 'Courier Service',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen 
            name="package-details"
            options={{
              title: 'Package Details',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen 
            name="delivery-details"
            options={{
              title: 'Delivery Details',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen 
            name="insurance"
            options={{
              title: 'Insurance & Handling',
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen 
            name="payment"
            options={{
              title: 'Review & Payment',
              headerShadowVisible: false,
            }}
          />
        </Stack>
      </View>
    </CourierOrderProvider>
  );
} 