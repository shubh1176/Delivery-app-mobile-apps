import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount))
  });
}

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a device
 */
export const sendPushNotification = async (deviceToken: string, notification: PushNotificationData) => {
  if (!admin.apps.length) {
    console.warn('Firebase not initialized');
    return;
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data,
      token: deviceToken
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}; 