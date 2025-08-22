/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Home, Users, Bell, Settings, Plus } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './components/Toast';
import OneSignal from 'onesignal-cordova-plugin';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { App as CapacitorApp } from '@capacitor/app';
import { isSameDay, setHours, setMinutes, setSeconds, addDays } from 'date-fns';
import { followUpService } from './services/firestoreService';
import { Http } from '@capacitor-community/http';

// Pages
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import FollowUps from './pages/FollowUps';
import AddPatient from './pages/AddPatient';
import EditPatient from './pages/EditPatient';
import AddFollowUp from './pages/AddFollowUp';
import SettingsPage from './pages/Settings';
import AddTreatment from './components/AddTreatment';
import Login from './pages/Login';

// Components
import BottomNavigation from './components/BottomNavigation';
import TopBar from './components/TopBar';

// Circular Splash
import CircularReveal from './components/CircularReveal';

interface NavigationItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  isAction?: boolean;
}

interface AddMenuItem {
  label: string;
  path: string;
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Login />;
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isNative = !!(window as any).Capacitor?.isNativePlatform;
    if (!isNative) return;

    const initPushNotifications = async () => {
      try {
        // Initialize OneSignal
        await OneSignal.init('9c47d65f-8aaf-469b-92d2-9adeb619f287');

        // Request notification permissions
        const permission = await OneSignal.Notifications.requestPermission(true);
        console.log('User accepted notifications:', permission);

        // Set FCM token as a tag
        const fcmResult = await FirebaseMessaging.getToken();
        if (fcmResult?.token) {
          console.log('FCM Token:', fcmResult.token);
          await OneSignal.User.addTag('FCM_Token', fcmResult.token);
        }

        // Set external user ID
        if (currentUser?.uid) {
          await OneSignal.login(currentUser.uid);
          console.log('External User ID set:', currentUser.uid);
        }

        // Handle foreground notifications
        OneSignal.Notifications.addForegroundWillDisplayListener((event) => {
          const notification = event.getNotification();
          console.log('Foreground notification received:', notification);
          event.preventDefault(); // Allow customization if needed
          event.getNotification().display(); // Display the notification
        });

        // Handle notification clicks
        OneSignal.Notifications.addNotificationOpenedListener((event) => {
          const additionalData = event.notification?.additionalData || {};
          const route = additionalData.route;
          if (route) navigate(route);
          console.log('Notification clicked:', event);
        });

        // Schedule daily notification check
        const scheduleDailyNotification = async () => {
          console.log('DEBUG: Starting scheduleDailyNotification');
          if (!currentUser?.uid) {
            console.log('DEBUG: No currentUser.uid, skipping scheduling');
            return;
          }

          const now = new Date();
          console.log('DEBUG: Current time:', now.toISOString());

          // Schedule for 11:30 AM (user's local time)
          let scheduledTime = setHours(setMinutes(setSeconds(now, 0), 5), 13);
          if (now > scheduledTime) {
            scheduledTime = addDays(scheduledTime, 1); // Next day if time has passed
          }
          console.log('DEBUG: Scheduled time:', scheduledTime.toISOString());

          const { followUps, error } = await followUpService.getAll(currentUser.uid);
          if (error) {
            console.error('DEBUG: Error fetching follow-ups:', error);
            return;
          }
          console.log('DEBUG: Fetched followUps count:', followUps.length);

          const todayFollowUps = followUps.filter((followUp) =>
            isSameDay(new Date(followUp.scheduledDate), now)
          );
          console.log('DEBUG: Today follow-ups count:', todayFollowUps.length);

          if (todayFollowUps.length === 0) {
            console.log('DEBUG: No follow-ups today, no notification scheduled');
            return;
          }

          // OneSignal API endpoint
          const apiUrl = 'https://onesignal.com/api/v1/notifications';
          const headers = {
            Authorization: `Basic ${process.env.REACT_APP_ONESIGNAL_API_KEY || 'os_v2_app_trd5mx4kv5djxewstlplmgpsq7tzor2lmjtesvvfuv37bz7ztmytpbmqkramlyytrg3tg4rnxj2t7mhvnb53fzrnk475kv7y6pcghhq'}`,
            'Content-Type': 'application/json',
          };

          // Cancel existing scheduled notifications to avoid duplicates
          try {
            const cancelResponse = await Http.request({
              method: 'GET',
              url: `${apiUrl}?app_id=9c47d65f-8aaf-469b-92d2-9adeb619f287&limit=1`,
              headers,
            });
            console.log('DEBUG: Cancel response:', cancelResponse.data);
            const notifications = JSON.parse(cancelResponse.data).notifications || [];
            if (notifications.length > 0) {
              const deleteResponse = await Http.request({
                method: 'DELETE',
                url: `${apiUrl}/${notifications[0].id}?app_id=9c47d65f-8aaf-469b-92d2-9adeb619f287`,
                headers,
              });
              console.log('DEBUG: Deleted existing notification:', deleteResponse.data);
            } else {
              console.log('DEBUG: No existing notifications to delete');
            }
          } catch (cancelError) {
            console.error('DEBUG: Error in cancel logic:', cancelError);
          }

          // Schedule notification for the current user
          const notificationContent = {
            app_id: '9c47d65f-8aaf-469b-92d2-9adeb619f287',
            contents: {
              en: `You have ${todayFollowUps.length} follow-up${todayFollowUps.length > 1 ? 's' : ''} today!`,
            },
            headings: { en: 'Daily Follow-up Reminder' },
            include_aliases: { external_id: [currentUser.uid] }, // Target only this user
            delayed_option: 'timezone', // Deliver in user's local timezone
            delivery_time_of_day: '11:30', // 11:30 AM local time
            android_accent_color: '#FF5722',
            android_sound: 'dentaldrill', // Ensure file exists in res/raw
            android_vibrate: true,
            data: { route: '/followups' }, // For click handling
          };
          console.log('DEBUG: Notification content prepared:', notificationContent);

          try {
            const response = await Http.request({
              method: 'POST',
              url: apiUrl,
              headers,
              data: notificationContent,
            });
            console.log('DEBUG: Notification scheduled:', response.data);
          } catch (postError) {
            console.error('DEBUG: Error scheduling notification:', postError);
          }
        };

        // Initial scheduling
        scheduleDailyNotification();

        // Reschedule on app resume
        const handleAppStateChange = (state: { isActive: boolean }) => {
          if (state.isActive) {
            console.log('DEBUG: App resumed, checking notification schedule');
            scheduleDailyNotification();
          }
        };
        CapacitorApp.addListener('appStateChange', handleAppStateChange);

        // Cleanup listener on unmount
        return () => {
          CapacitorApp.removeAllListeners();
        };
      } catch (err) {
        console.error('Push notification initialization error:', err);
      }
    };

    initPushNotifications();
  }, [navigate, currentUser]);

  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/' },
    { id: 'patients', icon: Users, label: 'Patients', path: '/patients' },
    { id: 'add', icon: Plus, label: 'Add', isAction: true },
    { id: 'followups', icon: Bell, label: 'Follow-ups', path: '/followups' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const addMenuItems: AddMenuItem[] = [
    { label: 'Add Patient', path: '/add-patient' },
    { label: 'Add Follow-up', path: '/add-followup' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
      <TopBar />
      <main className="px-4 py-6 max-w-md mx-auto">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
          <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
          <Route path="/followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
          <Route path="/add-patient" element={<ProtectedRoute><AddPatient /></ProtectedRoute>} />
          <Route path="/patients/:id/edit" element={<ProtectedRoute><EditPatient /></ProtectedRoute>} />
          <Route path="/add-followup" element={<ProtectedRoute><AddFollowUp /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route
            path="/patients/:patientId/treatments/new"
            element={<ProtectedRoute><AddTreatment /></ProtectedRoute>}
          />
        </Routes>
      </main>
      {currentUser && (
        <BottomNavigation
          items={navigationItems}
          showAddMenu={showAddMenu}
          setShowAddMenu={setShowAddMenu}
          addMenuItems={addMenuItems}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <AppContent />
              <CircularReveal centerX="50vw" centerY="40vh" color="#ffffff" durationMs={900} />
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;