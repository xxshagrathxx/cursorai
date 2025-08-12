import React, { createContext, useContext, useEffect, useState } from 'react';
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
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, requestNotificationPermission } from '../config/firebase';

// Define the shape of the user profile stored in Firestore
interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  role: string;
  createdAt: any; // Firestore Timestamp (use 'any' to avoid Timestamp type issues in client code)
  updatedAt: any;
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
  fcmToken?: string;
  lastLoginAt?: any;
}

// Define the shape of the AuthContext value
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ user: User | null; error: string | null; pending?: boolean }>;
  signInWithEmail: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ user: User | null; error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => Promise<{ error: string | null }>;
  createUserProfile: (user: User, additionalData?: Partial<UserProfile>) => Promise<void>;
}

// Create the context with TypeScript type
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => ({ user: null, error: 'Not implemented' }),
  signInWithEmail: async () => ({ user: null, error: 'Not implemented' }),
  signUpWithEmail: async () => ({ user: null, error: 'Not implemented' }),
  logout: async () => ({ error: 'Not implemented' }),
  updateUserProfile: async () => ({ error: 'Not implemented' }),
  createUserProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Google Sign-In with fallback to redirect
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      let result;
      let user;

      try {
        // Try popup first (better UX on desktop)
        result = await signInWithPopup(auth, provider);
        user = result.user;
      } catch (popupError: any) {
        console.log('Popup failed, trying redirect:', popupError.code);

        // If popup fails (especially on mobile), try redirect
        if (
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/popup-closed-by-user' ||
          popupError.code === 'auth/cancelled-popup-request'
        ) {
          await signInWithRedirect(auth, provider);
          return { user: null, error: null, pending: true };
        } else {
          throw popupError;
        }
      }

      // Create or update user profile in Firestore
      await createUserProfile(user);

      // Request notification permission
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        await updateUserFCMToken(user.uid, fcmToken);
      }

      return { user, error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      let errorMessage = error.message;

      switch (error.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'Sign-in was cancelled. Please try again or use email/password.';
          break;
        case 'auth/popup-blocked':
          errorMessage = 'Pop-up was blocked. Trying alternative sign-in method...';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Sign-in was cancelled. Please try again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'An account already exists with this email. Please sign in with your original method.';
          break;
        default:
          errorMessage = 'Sign-in failed. Please try again or use email/password.';
      }

      return { user: null, error: errorMessage };
    }
  };

  // Email/Password Sign-In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error: any) {
      console.error('Email sign-in error:', error);

      let errorMessage = error.message;

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = 'Sign-in failed. Please check your credentials and try again.';
      }

      return { user: null, error: errorMessage };
    }
  };

  // Email/Password Sign-Up
  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      await createUserProfile(user, { displayName });

      return { user, error: null };
    } catch (error: any) {
      console.error('Email sign-up error:', error);

      let errorMessage = error.message;

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Try signing in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled. Please contact support.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        default:
          errorMessage = 'Account creation failed. Please try again.';
      }

      return { user: null, error: errorMessage };
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      return { error: null };
    } catch (error: any) {
      console.error('Sign-out error:', error);
      return { error: error.message };
    }
  };

  // Create or update user profile in Firestore
  const createUserProfile = async (user: User, additionalData: Partial<UserProfile> = {}) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;

      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.displayName || '',
          email: email || '',
          photoURL: photoURL || '',
          role: 'dentist',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en',
          },
          ...additionalData,
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    } else {
      try {
        await setDoc(
          userRef,
          {
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }
  };

  // Update FCM token for push notifications
  const updateUserFCMToken = async (userId: string, fcmToken: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          fcmToken,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  };

  // Get user profile from Firestore
  const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Update local state
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));

      return { error: null };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { error: error.message };
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    // Handle redirect result for Google Sign-In
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          await createUserProfile(user);

          const fcmToken = await requestNotificationPermission();
          if (fcmToken) {
            await updateUserFCMToken(user.uid, fcmToken);
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    updateUserProfile,
    createUserProfile,
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