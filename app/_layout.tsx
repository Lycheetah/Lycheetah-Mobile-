import { useEffect, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { AppModeProvider } from '../lib/app-mode';
import { AccessibilityProvider } from '../lib/accessibility';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { EmergencyBeacon } from '../components/EmergencyBeacon';

const ONBOARDING_KEY = 'lycheetah_onboarded';

// ── GLOBAL READABILITY (accessibility) ──────────────────────────────────────
// Let the device's font-size accessibility setting scale ALL text in the app, so
// users with glasses / low vision can size everything to their own eyes. Capped at
// 1.6× so layouts bend without breaking. Applies app-wide, no per-component changes.
;(Text as any).defaultProps = { ...(Text as any).defaultProps, allowFontScaling: true, maxFontSizeMultiplier: 1.6 };
;(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, allowFontScaling: true, maxFontSizeMultiplier: 1.6 };

export default function RootLayout() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboarded(val === 'true');
    });
  }, []);

  if (onboarded === null) return null; // splash still showing

  return (
    <ErrorBoundary>
    <AccessibilityProvider>
    <AppModeProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: SOL_THEME.background },
            headerTintColor: SOL_THEME.primary,
            headerTitleStyle: { color: SOL_THEME.text },
            contentStyle: { backgroundColor: SOL_THEME.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <EmergencyBeacon />
      </View>
    </AppModeProvider>
    </AccessibilityProvider>
    </ErrorBoundary>
  );
}
