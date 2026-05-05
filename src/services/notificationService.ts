/**
 * ─── PUSH NOTIFICATIONS SETUP (Firebase Cloud Messaging) ─────────────────────
 *
 * STEP 1 — Create Firebase project
 *   a) Go to https://console.firebase.google.com → Add project (name it "thingy")
 *   b) Add Android app:  package = com.thingy
 *      Download google-services.json → android/app/google-services.json
 *   c) Add iOS app:  bundle = com.thingy
 *      Download GoogleService-Info.plist → ios/thingy/GoogleService-Info.plist
 *
 * STEP 2 — Install packages
 *   npm install @react-native-firebase/app @react-native-firebase/messaging
 *
 * STEP 3 — Android setup
 *   android/build.gradle → in dependencies add:
 *     classpath('com.google.gms:google-services:4.4.2')
 *     classpath('com.google.firebase:firebase-bom:32.7.0')
 *
 *   android/app/build.gradle → at very bottom add:
 *     apply plugin: 'com.google.gms.google-services'
 *
 * STEP 4 — iOS setup
 *   In Xcode: Signing & Capabilities → + Capability → Push Notifications
 *                                     → + Capability → Background Modes → Remote notifications ✓
 *   cd ios && pod install
 *   Upload APNs key in Firebase Console → Project Settings → Cloud Messaging → iOS app
 *
 * STEP 5 — Uncomment the firebase import below and the function bodies
 *
 * STEP 6 — Backend: set FIREBASE_SERVICE_ACCOUNT env var
 * ─────────────────────────────────────────────────────────────────────────────
 */

// UNCOMMENT after setup:
// import messaging from '@react-native-firebase/messaging';

const BACKEND_URL: string | null = null; // e.g. 'http://10.0.2.2:3001' for Android emulator

async function registerTokenWithBackend(fcmToken: string, userId: string): Promise<void> {
  // Backend removed - tokens can be stored in Supabase if needed
  return;
}

/**
 * Call this once after the user signs in.
 * Returns the FCM token (or null if not set up yet).
 */
export async function initNotifications(userId: string): Promise<string | null> {
  try {
    // ── PRODUCTION (uncomment after setup) ──────────────────────────────────
    // const authStatus = await messaging().requestPermission();
    // const granted =
    //   authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    //   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    // if (!granted) return null;
    //
    // const token = await messaging().getToken();
    // console.log('[FCM] token:', token);
    // await registerTokenWithBackend(token, userId);
    //
    // // Refresh token listener
    // messaging().onTokenRefresh(newToken => registerTokenWithBackend(newToken, userId));
    //
    // return token;
    // ────────────────────────────────────────────────────────────────────────

    return null; // remove this line once you uncomment above
  } catch (err) {
    console.error('[Notifications] init error:', err);
    return null;
  }
}

/**
 * Listen for notifications while the app is in the foreground.
 * Call in App.tsx or your root component.
 * Returns an unsubscribe function.
 */
export function onForegroundNotification(
  callback: (title: string, body: string, data?: Record<string, string>) => void,
): () => void {
  // ── PRODUCTION (uncomment after setup) ────────────────────────────────────
  // return messaging().onMessage(async remoteMessage => {
  //   const title = remoteMessage.notification?.title ?? '';
  //   const body  = remoteMessage.notification?.body  ?? '';
  //   callback(title, body, remoteMessage.data as Record<string, string>);
  // });
  // ──────────────────────────────────────────────────────────────────────────
  return () => {};
}

/**
 * Handle notification tap (app in background or quit state).
 * Call once in App.tsx.
 */
export function setupBackgroundNotificationHandler(
  onOpen: (data: Record<string, string>) => void,
): void {
  // ── PRODUCTION (uncomment after setup) ────────────────────────────────────
  // // App opened from background
  // messaging().onNotificationOpenedApp(msg => {
  //   if (msg?.data) onOpen(msg.data as Record<string, string>);
  // });
  //
  // // App opened from quit state
  // messaging().getInitialNotification().then(msg => {
  //   if (msg?.data) onOpen(msg.data as Record<string, string>);
  // });
  //
  // // Required for background message handling on Android
  // messaging().setBackgroundMessageHandler(async () => {});
  // ──────────────────────────────────────────────────────────────────────────
}
