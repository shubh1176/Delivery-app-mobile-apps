import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '../store/hooks';
import { getOrders } from '../store/slices/order.slice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data;
      
      // Handle different notification types
      switch (data.type) {
        case 'new_order':
          dispatch(getOrders());
          break;
        case 'order_status':
          dispatch(getOrders());
          break;
        case 'account_status':
          // Handle account status changes (e.g., blocked, deleted)
          break;
      }
    });

    // Listen for notification responses (user tapping notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification type
      switch (data.type) {
        case 'new_order':
        case 'order_status':
          router.push('/orders');
          break;
        case 'account_status':
          router.push('/profile');
          break;
        case 'earnings':
          router.push('/earnings');
          break;
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
}

async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Configure notification channels for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2f95dc',
      });

      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Orders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2f95dc',
        sound: 'notification.wav',
      });

      await Notifications.setNotificationChannelAsync('earnings', {
        name: 'Earnings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#28a745',
      });

      await Notifications.setNotificationChannelAsync('account', {
        name: 'Account',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#dc3545',
      });
    }

    // Get the token
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Push token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
} 