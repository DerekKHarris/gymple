import {
  AndroidImportance,
  SchedulableTriggerInputTypes,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

const CHECK_IN_ID = 'gymple-weekly-check-in';

/** Weekly local notification reminding the user to check in. `weekday` is 0 = Sunday. */
export async function scheduleCheckInReminder(weekday: number, hour = 9): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const current = await getPermissionsAsync();
    const granted = current.granted || (await requestPermissionsAsync()).granted;
    if (!granted) return false;
    if (Platform.OS === 'android') {
      await setNotificationChannelAsync('check-ins', { name: 'Weekly check-ins', importance: AndroidImportance.DEFAULT });
    }
    await cancelScheduledNotificationAsync(CHECK_IN_ID).catch(() => {});
    await scheduleNotificationAsync({
      identifier: CHECK_IN_ID,
      content: {
        title: 'Weekly check-in',
        body: 'Two minutes: log your weight and how the week went, and get next week’s plan.',
        data: { url: '/checkin' },
      },
      trigger: { type: SchedulableTriggerInputTypes.WEEKLY, weekday: weekday + 1, hour, minute: 0, channelId: 'check-ins' },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelCheckInReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  await cancelScheduledNotificationAsync(CHECK_IN_ID).catch(() => {});
}
