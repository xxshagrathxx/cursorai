# 🔥 Firebase Setup Guide for DentalCare App

This guide will walk you through setting up Firebase Authentication, Firestore Database, and Push Notifications for your dental patient follow-up app.

## 📋 Prerequisites

- A Google account
- Node.js and npm installed
- The DentalCare app code (already set up)

## 🚀 Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project"
   - Enter project name: `dental-care-app` (or your preferred name)
   - Enable Google Analytics (recommended)
   - Choose your Analytics account
   - Click "Create project"

3. **Wait for Project Creation**
   - Firebase will set up your project (takes ~1-2 minutes)

## 🔧 Step 2: Configure Firebase Services

### 2.1 Enable Authentication

1. **Navigate to Authentication**
   - In Firebase Console, click "Authentication" in left sidebar
   - Click "Get started"

2. **Set Up Sign-in Methods**
   - Go to "Sign-in method" tab
   - Enable **Email/Password**:
     - Click on "Email/Password"
     - Toggle "Enable"
     - Click "Save"
   
   - Enable **Google Sign-In**:
     - Click on "Google"
     - Toggle "Enable"
     - Enter your project support email
     - Click "Save"

3. **Configure Authorized Domains**
   - In "Sign-in method" tab, scroll to "Authorized domains"
   - Add your domains:
     - `localhost` (for development)
     - Your production domain (when you deploy)

### 2.2 Set Up Firestore Database

1. **Navigate to Firestore**
   - Click "Firestore Database" in left sidebar
   - Click "Create database"

2. **Choose Security Rules**
   - Select "Start in test mode" (for development)
   - **Important**: We'll secure this later
   - Click "Next"

3. **Select Location**
   - Choose a location close to your users
   - Click "Done"

4. **Set Up Security Rules** (Important!)
   - Go to "Rules" tab in Firestore
   - Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Patients - users can only access their own patients
    match /patients/{patientId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Follow-ups - users can only access their own follow-ups
    match /followups/{followupId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Treatments - users can only access their own treatments
    match /treatments/{treatmentId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

   - Click "Publish"

### 2.3 Enable Cloud Messaging (Push Notifications)

1. **Navigate to Cloud Messaging**
   - Click "Cloud Messaging" in left sidebar
   - If prompted, click "Get started"

2. **Generate VAPID Key**
   - Go to "Cloud Messaging" tab
   - Scroll to "Web configuration"
   - Click "Generate key pair"
   - Copy the VAPID key (you'll need this later)

## 🔑 Step 3: Get Firebase Configuration

1. **Add Web App**
   - In Firebase Console overview, click the web icon `</>`
   - Enter app nickname: "DentalCare Web App"
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

2. **Copy Configuration**
   - Copy the Firebase configuration object
   - It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
```

## 📝 Step 4: Update Your App Configuration

### 4.1 Update Firebase Config

1. **Edit `src/config/firebase.js`**
   - Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id",
  measurementId: "your-actual-measurement-id"
};
```

2. **Update VAPID Key**
   - In the same file, replace `'your-vapid-key-here'` with your actual VAPID key

### 4.2 Update Service Worker

1. **Edit `public/firebase-messaging-sw.js`**
   - Replace the placeholder config with your Firebase config (same as above)

## 🧪 Step 5: Test Your Setup

### 5.1 Test Authentication

1. **Start Your App**
   ```bash
   npm run dev
   ```

2. **Test Google Sign-In**
   - Open your app in browser
   - Click "Continue with Google"
   - Sign in with your Google account
   - You should be redirected to the dashboard

3. **Test Email Sign-Up**
   - Click "Sign Up"
   - Enter email, password, and name
   - Create account
   - You should be signed in automatically

### 5.2 Test Firestore

1. **Add a Patient**
   - Go to "Add Patient" in your app
   - Fill out the form and submit
   - Check Firebase Console > Firestore Database
   - You should see a new document in the `patients` collection

2. **Add a Follow-up**
   - Go to "Schedule Follow-up"
   - Create a follow-up for your patient
   - Check Firestore for the new `followups` document

### 5.3 Test Push Notifications

1. **Grant Permission**
   - When prompted, allow notifications in your browser

2. **Check FCM Token**
   - Open browser console
   - Look for "FCM Token: ..." in the logs
   - This confirms push notifications are working

## 🚀 Step 6: Deploy to Production

### 6.1 Firebase Hosting (Recommended)

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Hosting**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

### 6.2 Update Authorized Domains

1. **Add Production Domain**
   - Go to Firebase Console > Authentication > Sign-in method
   - Add your production domain to "Authorized domains"

## 📱 Step 7: Set Up Push Notifications Backend

### 7.1 Create Cloud Function (Optional)

Create a Cloud Function to send automated notifications:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendFollowUpReminder = functions.firestore
  .document('followups/{followupId}')
  .onCreate(async (snap, context) => {
    const followUp = snap.data();
    const scheduledDate = followUp.scheduledDate.toDate();
    const now = new Date();
    
    // Send notification 1 day before scheduled date
    const reminderDate = new Date(scheduledDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    
    if (now >= reminderDate) {
      // Get user's FCM token
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(followUp.userId)
        .get();
      
      const fcmToken = userDoc.data()?.fcmToken;
      
      if (fcmToken) {
        const message = {
          notification: {
            title: 'Follow-up Reminder',
            body: `Don't forget to follow up with ${followUp.patientName}`,
          },
          data: {
            followupId: context.params.followupId,
            url: `/followups`
          },
          token: fcmToken
        };
        
        await admin.messaging().send(message);
      }
    }
  });
```

## 🔒 Step 8: Security Best Practices

### 8.1 Environment Variables

For production, use environment variables:

1. **Create `.env` file** (don't commit to git):
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   VITE_FIREBASE_VAPID_KEY=your-vapid-key
   ```

2. **Update `firebase.js`** to use environment variables:
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     // ... etc
   };
   ```

### 8.2 Additional Security

1. **Enable App Check** (recommended for production)
2. **Set up proper CORS** if using custom domains
3. **Monitor usage** in Firebase Console
4. **Set up billing alerts**

## 🎉 You're Done!

Your DentalCare app now has:
- ✅ Google Authentication
- ✅ Email/Password Authentication  
- ✅ Firestore Database with security rules
- ✅ Push Notifications
- ✅ Real-time data sync
- ✅ Mobile-responsive design
- ✅ Dark mode and custom themes

## 🆘 Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add your domain to Authorized domains in Firebase Console

2. **"Missing or insufficient permissions"**
   - Check your Firestore security rules
   - Ensure user is authenticated

3. **Push notifications not working**
   - Check VAPID key is correct
   - Ensure HTTPS (required for notifications)
   - Check browser permissions

4. **App not loading after authentication**
   - Check browser console for errors
   - Verify Firebase config is correct

### Getting Help:

- Firebase Documentation: [https://firebase.google.com/docs](https://firebase.google.com/docs)
- Firebase Support: [https://firebase.google.com/support](https://firebase.google.com/support)
- Stack Overflow: Tag your questions with `firebase`

---

**Happy coding! 🦷✨**