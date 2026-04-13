import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ENABLED = 'sol_streak_reminder_enabled';
const KEY_HOUR = 'sol_streak_reminder_hour';

const STREAK_NUDGES = [
  'The field is open. What are you carrying today?',
  'Your streak is alive. Keep the current flowing.',
  'The Work doesn\'t wait for the perfect moment.',
  'One question. One message. The streak holds.',
  'The forge is lit. What do you bring today?',
  'Consistency is a form of devotion. Come back.',
  'The school is open. The teacher is present.',
  'Yesterday\'s insight needs today\'s continuation.',
  'A single exchange keeps the current alive.',
  'The Mercury moves when you do. Come in.',
];

export async function getStreakReminderEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY_ENABLED);
  return v === 'true';
}

export async function getStreakReminderHour(): Promise<number> {
  const v = await AsyncStorage.getItem(KEY_HOUR);
  return v ? parseInt(v, 10) : 19; // default 7pm
}

export async function setStreakReminderEnabled(val: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_ENABLED, val ? 'true' : 'false');
  if (val) {
    await scheduleStreakReminder();
  } else {
    await cancelStreakReminder();
  }
}

export async function setStreakReminderHour(hour: number): Promise<void> {
  await AsyncStorage.setItem(KEY_HOUR, String(hour));
  const enabled = await getStreakReminderEnabled();
  if (enabled) await scheduleStreakReminder();
}

export async function scheduleStreakReminder(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelScheduledNotificationAsync('streak-reminder').catch(() => {});

    const hour = await getStreakReminderHour();
    const idx = Math.floor(Math.random() * STREAK_NUDGES.length);

    await Notifications.scheduleNotificationAsync({
      identifier: 'streak-reminder',
      content: {
        title: '⊚ Sol',
        body: STREAK_NUDGES[idx],
        data: { type: 'streak-reminder' },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      } as any,
    });
  } catch { /* Silently skip in Expo Go */ }
}

export async function cancelStreakReminder(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync('streak-reminder').catch(() => {});
  } catch {}
}
