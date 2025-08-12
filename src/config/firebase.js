import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyA-ArIwmJG4_Qlh4wGw-AZkbPt0omfRU4Y",
  authDomain: "followups-a83a7.firebaseapp.com",
  projectId: "followups-a83a7",
  storageBucket: "followups-a83a7.firebasestorage.app",
  messagingSenderId: "622370701795",
  appId: "1:622370701795:web:017cbdcd0d0753612e60d6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };

// Initialize Messaging for push notifications
let messaging;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Firebase messaging not supported:', error);
  }
}
export { messaging };

// Development mode: Connect to emulators
if (process.env.NODE_ENV === 'development') {
  // Uncomment these lines if you want to use Firebase emulators in development
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// Notification permission and token management
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.log('Messaging not supported');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'r1GJLvmXEioFq1dLBXZ3QCylOd4GrvgOdY0GlJbyNME' // Replace with your VAPID key
      });
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.reject('Messaging not supported');
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      resolve(payload);
    });
  });
};

export default app;