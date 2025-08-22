import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, requestNotificationPermission } from '../config/firebase';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../components/Toast';
import { FirebaseAuthentication, SignInResult } from '@capacitor-firebase/authentication';

/* -------------------------
   Types
   ------------------------- */
interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
  createdAt: any;
  updatedAt: any;
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
  fcmToken?: string;
  lastLoginAt?: any;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ user: User | null; error: string | null; pending?: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ user: User | null; error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  createUserProfile: (user: User, additionalData?: Partial<UserProfile>) => Promise<{ error: string | null }>;
}

/* -------------------------
   Context setup
   ------------------------- */
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => ({ user: null, error: 'Not implemented' }),
  signInWithEmail: async () => ({ user: null, error: 'Not implemented' }),
  signUpWithEmail: async () => ({ user: null, error: 'Not implemented' }),
  logout: async () => ({ error: 'Not implemented' }),
  updateUserProfile: async () => ({ error: 'Not implemented' }),
  createUserProfile: async () => ({ error: 'Not implemented' }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

/* -------------------------
   Provider
   ------------------------- */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { showError } = useToast();

  const isNative = Capacitor.getPlatform() !== 'web';

  const requestNotificationWithRetry = async (retries = 3, delay = 1000): Promise<string | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken && typeof fcmToken === 'string' && fcmToken.length > 10) {
          console.log(`FCM token retrieved on attempt ${attempt}: ${fcmToken}`);
          return fcmToken;
        }
        console.warn(`Invalid or empty FCM token on attempt ${attempt}: ${fcmToken}`);
      } catch (error) {
        console.error(`FCM permission error on attempt ${attempt}:`, error);
      }
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    showError('Failed to retrieve valid FCM token after retries. Notifications may not work.');
    return null;
  };

  const signInWithGoogle = async (): Promise<{ user: User | null; error: string | null; pending?: boolean }> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email profile');

    const errorMessages = new Map<string, string>([
      ['auth/popup-closed-by-user', 'Sign-in cancelled.'],
      ['auth/popup-blocked', 'Pop-up blocked. Trying redirect...'],
      ['auth/cancelled-popup-request', 'Sign-in cancelled.'],
      ['auth/network-request-failed', 'Network error. Check your connection.'],
      ['auth/too-many-requests', 'Too many attempts. Try again later.'],
      ['auth/user-disabled', 'Account disabled. Contact support.'],
      ['auth/account-exists-with-different-credential', 'Account exists with different credentials.'],
    ]);

    try {
      if (isNative) {
        try {
          const nativeResult: SignInResult = await FirebaseAuthentication.signInWithGoogle();
          const idToken = nativeResult.credential?.idToken ?? null;
          const accessToken = nativeResult.credential?.accessToken ?? null;

          if (!idToken) throw new Error('No valid Google ID token from native sign-in');

          const credential = GoogleAuthProvider.credential(idToken, accessToken);
          const userCred = await signInWithCredential(auth, credential);
          const user = userCred.user;

          const profileResult = await createUserProfile(user);
          if (profileResult.error) throw new Error(profileResult.error);

          const fcmToken = await requestNotificationWithRetry();
          if (fcmToken) {
            const fcmResult = await updateUserFCMToken(user.uid, fcmToken);
            if (fcmResult.error) throw new Error(fcmResult.error);
          }

          return { user, error: null };
        } catch (nativeErr: any) {
          console.warn('Native Google sign-in failed:', nativeErr);
          throw new Error('Native sign-in failed. Please try email/password.');
        }
      }

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const profileResult = await createUserProfile(user);
        if (profileResult.error) throw new Error(profileResult.error);

        const fcmToken = await requestNotificationWithRetry();
        if (fcmToken) {
          const fcmResult = await updateUserFCMToken(user.uid, fcmToken);
          if (fcmResult.error) throw new Error(fcmResult.error);
        }

        return { user, error: null };
      } catch (popupError: any) {
        if (
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request'
        ) {
          await signInWithRedirect(auth, provider);
          return { user: null, error: null, pending: true };
        }
        throw popupError;
      }
    } catch (error: any) {
      const errorMessage = errorMessages.get(error.code) || error.message || 'Sign-in failed.';
      showError(errorMessage);
      return { user: null, error: errorMessage };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const errorMessages = new Map<string, string>([
      ['auth/user-not-found', 'No account found.'],
      ['auth/wrong-password', 'Incorrect password.'],
      ['auth/invalid-email', 'Invalid email address.'],
      ['auth/user-disabled', 'Account disabled.'],
      ['auth/too-many-requests', 'Too many attempts.'],
      ['auth/network-request-failed', 'Network error.'],
    ]);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const profileResult = await createUserProfile(user);
      if (profileResult.error) throw new Error(profileResult.error);

      const fcmToken = await requestNotificationWithRetry();
      if (fcmToken) {
        const fcmResult = await updateUserFCMToken(user.uid, fcmToken);
        if (fcmResult.error) throw new Error(fcmResult.error);
      }

      return { user, error: null };
    } catch (error: any) {
      const errorMessage = errorMessages.get(error.code) || 'Sign-in failed.';
      showError(errorMessage);
      return { user: null, error: errorMessage };
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const errorMessages = new Map<string, string>([
      ['auth/email-already-in-use', 'Email already in use.'],
      ['auth/invalid-email', 'Invalid email address.'],
      ['auth/weak-password', 'Password too weak.'],
      ['auth/operation-not-allowed', 'Email/password not enabled.'],
      ['auth/network-request-failed', 'Network error.'],
    ]);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await updateProfile(user, { displayName });

      const profileResult = await createUserProfile(user, { displayName });
      if (profileResult.error) throw new Error(profileResult.error);

      const fcmToken = await requestNotificationWithRetry();
      if (fcmToken) {
        const fcmResult = await updateUserFCMToken(user.uid, fcmToken);
        if (fcmResult.error) throw new Error(fcmResult.error);
      }

      return { user, error: null };
    } catch (error: any) {
      const errorMessage = errorMessages.get(error.code) || 'Account creation failed.';
      showError(errorMessage);
      return { user: null, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Sign-out failed.';
      showError(errorMessage);
      return { error: errorMessage };
    }
  };

  const createUserProfile = async (user: User, additionalData: Partial<UserProfile> = {}): Promise<{ error: string | null }> => {
    if (!user) return { error: 'No user provided' };
    const userRef = doc(db, 'users', user.uid);
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || additionalData.displayName || 'User',
          email: user.email || '',
          photoURL: user.photoURL || '',
          role: 'dentist',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          },
          ...additionalData
        });
        console.log(`User profile created for ${user.uid}`);
      } else {
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log(`User profile updated for ${user.uid}`);
      }
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create/update user profile';
      console.error('Error creating/updating user profile:', error);
      return { error: errorMessage };
    }
  };

  const updateUserFCMToken = async (userId: string, fcmToken: string): Promise<{ error: string | null }> => {
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 10) {
      const errorMessage = 'Invalid FCM token provided';
      console.error(errorMessage, fcmToken);
      return { error: errorMessage };
    }
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { error: 'User profile not found' };
      }
      await setDoc(userRef, {
        fcmToken,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`FCM token updated for ${userId}: ${fcmToken}`);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update FCM token';
      console.error('Error updating FCM token:', error);
      return { error: errorMessage };
    }
  };

  const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      console.warn(`No user profile found for ${userId}`);
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
      console.log(`User profile updated for ${userId}`);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Update failed';
      showError(errorMessage);
      return { error: errorMessage };
    }
  };

  const handleAuthStateChange = useCallback(async (user: User | null) => {
    if (user) {
      setCurrentUser(user);
      const profile = await getUserProfile(user.uid);
      if (!profile) {
        const profileResult = await createUserProfile(user);
        if (profileResult.error) {
          showError(profileResult.error);
          setLoading(false);
          return;
        }
      }
      setUserProfile(profile);
      const fcmToken = await requestNotificationWithRetry();
      if (fcmToken) {
        const fcmResult = await updateUserFCMToken(user.uid, fcmToken);
        if (fcmResult.error) {
          showError(fcmResult.error);
        }
      }
      setLoading(false);
    } else {
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    if (Capacitor.getPlatform() === 'web') {
      getRedirectResult(auth)
        .then(async (result) => {
          if (result) {
            await handleAuthStateChange(result.user);
          }
        })
        .catch((error) => {
          console.error('Redirect result error:', error);
          showError(error.message || 'Redirect sign-in failed.');
          setLoading(false);
        });
    }

    return () => unsubscribe();
  }, [handleAuthStateChange]);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateUserProfile,
    createUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">DentalCare</h2>
            <p className="text-gray-600 dark:text-gray-400">Loading your dental practice...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};