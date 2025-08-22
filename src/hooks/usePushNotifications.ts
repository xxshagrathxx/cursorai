// src/hooks/usePushNotifications.ts
import { useEffect } from 'react';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
  PermissionStatus
} from '@capacitor/push-notifications';
import { useAuth } from '../contexts/AuthContext';

export function usePushNotifications() {
  const { currentUser, updateUserProfile } = useAuth();

  useEffect(() => {
    if (!currentUser) return; // only register when user is signed in

    let registered = false;

    const init = async () => {
      try {
        // 1) Check / request permission (Android 13+ and iOS)
        const perm: PermissionStatus = await PushNotifications.checkPermissions();
        let receive = perm.receive;
        if (receive === 'prompt') {
          const req = await PushNotifications.requestPermissions();
          receive = req.receive;
        }
        if (receive !== 'granted') {
          console.warn('Push permission not granted:', receive);
          return;
        }

        // 2) Register with FCM (this triggers 'registration' event)
        await PushNotifications.register();

        // 3) Listeners
        PushNotifications.addListener('registration', async (token: Token) => {
          console.log('FCM registration token:', token.value);
          registered = true;

          // Save token to Firestore for this user
          try {
            if (currentUser?.uid) {
              await updateUserProfile(currentUser.uid, { fcmToken: token.value });
            }
          } catch (e) {
            console.error('Failed to save FCM token:', e);
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error:', err);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push received (in-app):', notification);
          // TODO: show in-app UI, open modal, or create a LocalNotification here
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          console.log('Push action performed (tapped):', action);
          // Usually contains `action.notification.data` – navigate accordingly
        });
      } catch (e) {
        console.error('initPush error', e);
      }
    };

    init();

    return () => {
      // cleanup listeners and unregister if needed
      // Note: removeAllListeners is also available
      try {
        PushNotifications.removeAllListeners();
        if (registered) {
          // unregister removes the token on Android & APNs on iOS
          PushNotifications.unregister().catch(() => {});
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);
}
