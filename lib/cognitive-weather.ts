import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_ENABLED = 'cognitive_weather_enabled';
const KEY_HOUR = 'cognitive_weather_hour';
const CHANNEL_ID = 'cognitive-weather';

export async function getCognitiveWeatherEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY_ENABLED);
  return raw === 'true';
}

export async function getCognitiveWeatherHour(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY_HOUR);
  return raw ? parseInt(raw, 10) : 8;
}

export async function setCognitiveWeatherEnabled(val: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY_ENABLED, val ? 'true' : 'false');
  if (!val) {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync('cognitive-weather').catch(() => {});
    } catch { /* not available in Expo Go */ }
  }
}

export async function setCognitiveWeatherHour(hour: number): Promise<void> {
  await AsyncStorage.setItem(KEY_HOUR, String(hour));
}

function buildWeatherContent(lq: number | null, phase: string | null, auraAvg: number | null): { title: string; body: string } {
  const lqVal = lq ?? 0;
  const phaseLabel = phase ?? 'Unknown';

  let weatherLabel: string;
  let tone: string;
  if (lqVal >= 0.8) {
    weatherLabel = 'CITRINITAS';
    tone = 'High coherence. The field is clear — go deep today.';
  } else if (lqVal >= 0.65) {
    weatherLabel = 'ALBEDO';
    tone = 'Steady field. Good day for structure and synthesis.';
  } else if (lqVal >= 0.5) {
    weatherLabel = 'NIGREDO';
    tone = 'Friction present. Investigate before building.';
  } else {
    weatherLabel = 'DESCENT';
    tone = 'Low coherence. Rest, ground, restore the vessel.';
  }

  const auraLine = auraAvg !== null ? ` · AURA ${Math.round(auraAvg * 100)}%` : '';
  const lqLine = lq !== null ? ` · LQ ${lqVal.toFixed(2)}` : '';

  return {
    title: `⊚ Field Weather — ${weatherLabel}`,
    body: `${phaseLabel}${lqLine}${auraLine}\n${tone}`,
  };
}

export async function scheduleCognitiveWeather(
  lq: number | null,
  phase: string | null,
  auraAvg: number | null,
): Promise<void> {
  const enabled = await getCognitiveWeatherEnabled();
  if (!enabled) return;

  try {
    // Dynamic import — only loads in production builds, not Expo Go
    const Notifications = await import('expo-notifications');

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Cognitive Weather',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });

    await Notifications.cancelScheduledNotificationAsync('cognitive-weather').catch(() => {});

    const hour = await getCognitiveWeatherHour();
    const { title, body } = buildWeatherContent(lq, phase, auraAvg);

    await Notifications.scheduleNotificationAsync({
      identifier: 'cognitive-weather',
      content: { title, body, data: { type: 'cognitive-weather' }, sound: false },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      } as any,
    });
  } catch {
    // Silently skip in Expo Go — works in production build
  }
}
