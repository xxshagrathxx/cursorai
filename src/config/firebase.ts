import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: "AIzaSyA-ArIwmJG4_Qlh4wGw-AZkbPt0omfRU4Y",
  authDomain: "followups-a83a7.firebaseapp.com",
  projectId: "followups-a83a7",
  storageBucket: "followups-a83a7.firebasestorage.app",
  messagingSenderId: "622370701795",
  appId: "1:622370701795:web:017cbdcd0d0753612e60d6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const requestNotificationPermission = async () => {
  const platform = Capacitor.getPlatform();
  try {
    if (platform === 'web') {
      // For web, use Firebase Messaging (if configured) or skip if not needed
      console.warn('Push notifications not fully supported on web. Skipping FCM token retrieval.');
      return null; // Web push requires additional setup (VAPID key, service worker)
    }

    // For Android and iOS, use Capacitor PushNotifications
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      throw new Error('Notification permission denied');
    }

    await PushNotifications.register();
    return new Promise<string>((resolve, reject) => {
      PushNotifications.addListener('registration', (token) => {
        console.log('FCM token registered:', token.value);
        resolve(token.value);
      });
      PushNotifications.addListener('registrationError', (error) => {
        console.error('FCM registration error:', error);
        reject(new Error(`FCM registration error: ${error.error}`));
      });
    });
  } catch (error) {
    console.error('Notification permission error:', error);
    throw error;
  }
};