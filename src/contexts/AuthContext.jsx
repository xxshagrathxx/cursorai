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
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, requestNotificationPermission } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Google Sign-In with fallback to redirect
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      let result;
      let user;
      
      try {
        // Try popup first (better UX on desktop)
        result = await signInWithPopup(auth, provider);
        user = result.user;
      } catch (popupError) {
        console.log('Popup failed, trying redirect:', popupError.code);
        
        // If popup fails (especially on mobile), try redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          // Use redirect instead
          await signInWithRedirect(auth, provider);
          // The redirect will handle the rest, so we return a pending state
          return { user: null, error: null, pending: true };
        } else {
          // Re-throw other errors to be handled below
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
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases
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
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (error) {
      console.error('Email sign-in error:', error);
      
      // Handle specific error cases
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
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Update display name
      await updateProfile(user, { displayName });

      // Create user profile in Firestore
      await createUserProfile(user, { displayName });

      return { user, error: null };
    } catch (error) {
      console.error('Email sign-up error:', error);
      
      // Handle specific error cases
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
    } catch (error) {
      console.error('Sign-out error:', error);
      return { error: error.message };
    }
  };

  // Create or update user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      
      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.displayName || '',
          email,
          photoURL: photoURL || '',
          role: 'dentist', // Default role
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            theme: 'light',
            notifications: true,
            language: 'en'
          },
          ...additionalData
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    } else {
      // Update last login
      try {
        await setDoc(userRef, {
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    }
  };

  // Update FCM token for push notifications
  const updateUserFCMToken = async (userId, fcmToken) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        fcmToken,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating FCM token:', error);
    }
  };

  // Get user profile from Firestore
  const getUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, updates) => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
      
      return { error: null };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { error: error.message };
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Load user profile from Firestore
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
          // Create or update user profile in Firestore
          await createUserProfile(user);
          
          // Request notification permission
          const fcmToken = await requestNotificationPermission();
          if (fcmToken) {
            await updateUserFCMToken(user.uid, fcmToken);
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
        // Handle redirect errors silently or show a toast notification
      }
    };

    handleRedirectResult();

    return unsubscribe;
  }, []);

  const value = {
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