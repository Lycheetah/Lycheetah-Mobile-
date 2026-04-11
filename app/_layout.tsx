import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { AppModeProvider } from '../lib/app-mode';

const ONBOARDING_KEY = 'lycheetah_onboarded';

export default function RootLayout() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboarded(val === 'true');
      if (val !== 'true') {
        AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      }
    });
  }, []);

  if (onboarded === null) return null; // splash still showing

  return (
    <AppModeProvider>
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
    </AppModeProvider>
  );
}
