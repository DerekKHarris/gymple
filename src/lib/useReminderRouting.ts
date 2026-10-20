import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
  setNotificationHandler,
  type Notification,
} from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Shows reminders while the app is open and opens the screen a tapped reminder points to. */
export function useReminderRouting(enabled: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    setNotificationHandler({
      handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
    });
    const open = (notification: Notification) => {
      const url = notification.request.content.data?.url;
      if (url === '/checkin') {
        router.push('/checkin');
        clearLastNotificationResponse();
      }
    };
    const last = getLastNotificationResponse();
    if (last?.notification) open(last.notification);
    const subscription = addNotificationResponseReceivedListener((response) => open(response.notification));
    return () => subscription.remove();
  }, [enabled, router]);
}
