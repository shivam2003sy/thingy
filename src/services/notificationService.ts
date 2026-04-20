/**
 * Push notification service using Firebase Cloud Messaging.
 *
 * SETUP (one-time):
 * 1. npm install @react-native-firebase/app @react-native-firebase/messaging
 * 2. iOS:  add GoogleService-Info.plist to ios/ folder, run `pod install`
 * 3. Android: add google-services.json to android/app/ folder
 * 4. Add Firebase config to android/build.gradle and android/app/build.gradle
 *
 * Then uncomment the firebase imports below.
 */

// import messaging from '@react-native-firebase/messaging';

const BACKEND_URL = null; // set to your backend URL e.g. 'http://localhost:3001'

async function sendTokenToBackend(fcmToken: string, userId: string) {
  if (!BACKEND_URL) return;
  try {
    await fetch(`${BACKEND_URL}/api/register-push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, fcmToken }),
    });
  } catch {
    // non-critical
  }
}

export async function initNotifications(userId: string): Promise<string | null> {
  try {
    /**
     * PRODUCTION — uncomment after installing @react-native-firebase/messaging:
     *
     * const authStatus = await messaging().requestPermission();
     * const enabled =
     *   authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
     *   authStatus === messaging.AuthorizationStatus.PROVISIONAL;
     * if (!enabled) return null;
     *
     * const token = await messaging().getToken();
     * await sendTokenToBackend(token, userId);
     * return token;
     */

    // STUB: return null until Firebase is configured
    console.log('[Notifications] Firebase not configured yet');
    return null;
  } catch (err) {
    console.error('[Notifications] init error:', err);
    return null;
  }
}

export function onForegroundNotification(
  callback: (title: string, body: string, data?: Record<string, string>) => void,
): () => void {
  /**
   * PRODUCTION — uncomment after installing @react-native-firebase/messaging:
   *
   * const unsubscribe = messaging().onMessage(async remoteMessage => {
   *   const title = remoteMessage.notification?.title ?? '';
   *   const body  = remoteMessage.notification?.body  ?? '';
   *   callback(title, body, remoteMessage.data as any);
   * });
   * return unsubscribe;
   */
  return () => {};
}

export function onBackgroundNotificationOpen(
  callback: (data: Record<string, string>) => void,
): void {
  /**
   * PRODUCTION — uncomment after installing @react-native-firebase/messaging:
   *
   * messaging().onNotificationOpenedApp(remoteMessage => {
   *   if (remoteMessage?.data) callback(remoteMessage.data as any);
   * });
   *
   * // Check notification that launched app from quit state
   * messaging()
   *   .getInitialNotification()
   *   .then(remoteMessage => {
   *     if (remoteMessage?.data) callback(remoteMessage.data as any);
   *   });
   */
}
