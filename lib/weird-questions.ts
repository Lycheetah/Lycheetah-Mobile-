import AsyncStorage from '@react-native-async-storage/async-storage';

export const WEIRD_QUESTIONS = [
  'If your current self sent a letter to the version of you from 5 years ago, what would it say?',
  'What belief are you holding onto that you\'d be embarrassed to defend out loud?',
  'When did you last feel genuinely surprised by yourself?',
  'What would you do differently if no one could ever know about it?',
  'What emotion are you currently mistaking for a fact?',
  'If your body was a building, which room needs the most renovation right now?',
  'What are you pretending not to want?',
  'Which of your habits would your future self thank you for? Which would they apologise for?',
  'What truth are you holding in the body that the mind hasn\'t accepted yet?',
  'If your shadow could speak, what would it say first?',
  'What does rest feel like to you, and when did you last experience it?',
  'What would you do if you knew failure was impossible — and why aren\'t you doing it?',
  'Which version of yourself are you still grieving?',
  'What do you keep almost saying but don\'t?',
  'If your current decision-making process had a name, what would it be?',
  'What are you proving, and to whom?',
  'What would change if you stopped explaining yourself to people?',
  'What does your most honest inner voice sound like, and when do you ignore it?',
  'If the thing you\'re avoiding was actually the answer, what would the question be?',
  'What are you practicing being, even if you haven\'t named it yet?',
  'What\'s the difference between the life you\'re living and the life you\'re performing?',
  'What would you do if you genuinely believed you deserved it?',
  'Which of your certainties is actually just unexamined fear?',
  'What does your relationship with time say about your relationship with yourself?',
  'If you could delete one pattern from your operating system, which one would go first?',
  'What are you waiting for permission to begin?',
  'What would a fully resourced version of you do differently today?',
  'What do you keep returning to, and what does that say about what you haven\'t resolved?',
  'If your current chapter had a title, what would it be?',
  'What would it mean to act as if you already were who you\'re trying to become?',
];

const KEY_ENABLED = 'sol_weird_q_enabled';
const KEY_HOUR = 'sol_weird_q_hour';

export async function getWeirdQEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEY_ENABLED);
  return v === 'true';
}

export async function getWeirdQHour(): Promise<number> {
  const v = await AsyncStorage.getItem(KEY_HOUR);
  return v ? parseInt(v, 10) : 9;
}

export async function setWeirdQEnabled(val: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_ENABLED, val ? 'true' : 'false');
  if (val) {
    await scheduleWeirdQuestion();
  } else {
    await cancelWeirdQuestion();
  }
}

export async function setWeirdQHour(hour: number): Promise<void> {
  await AsyncStorage.setItem(KEY_HOUR, String(hour));
  const enabled = await getWeirdQEnabled();
  if (enabled) await scheduleWeirdQuestion();
}

export async function scheduleWeirdQuestion(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelScheduledNotificationAsync('weird-question').catch(() => {});

    const hour = await getWeirdQHour();
    const idx = Math.floor(Math.random() * WEIRD_QUESTIONS.length);

    await Notifications.scheduleNotificationAsync({
      identifier: 'weird-question',
      content: {
        title: '⊚ Sol asks:',
        body: WEIRD_QUESTIONS[idx],
        data: { type: 'weird-question' },
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

export async function cancelWeirdQuestion(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync('weird-question').catch(() => {});
  } catch {}
}
