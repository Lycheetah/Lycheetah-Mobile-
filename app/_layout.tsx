import { useEffect, useState } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { AppModeProvider } from '../lib/app-mode';
import { AccessibilityProvider } from '../lib/accessibility';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { EmergencyBeacon } from '../components/EmergencyBeacon';
import { initAnalytics, track, setAnalyticsOptOut } from '../lib/analytics';

const ONBOARDING_KEY = 'lycheetah_onboarded';

// ── GLOBAL READABILITY (accessibility) ──────────────────────────────────────
// Let the device's font-size accessibility setting scale ALL text in the app, so
// users with glasses / low vision can size everything to their own eyes. Capped at
// 1.6× so layouts bend without breaking. Applies app-wide, no per-component changes.
// allowFontScaling / maxFontSizeMultiplier applied per-component in the app

const ANALYTICS_ASKED_KEY = 'sol_analytics_asked';

export default function RootLayout() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [showAnalyticsAsk, setShowAnalyticsAsk] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      setOnboarded(val === 'true');
    });
  }, []);

  // Anonymous, privacy-first usage analytics (opt-out respected, no PII).
  // Fires once per app launch → powers DAU / retention. No-ops until a key is set.
  // On first launch: shows a one-time honest ask before tracking anything.
  useEffect(() => {
    initAnalytics().then(async () => {
      const asked = await AsyncStorage.getItem(ANALYTICS_ASKED_KEY);
      if (!asked) {
        setShowAnalyticsAsk(true);
      } else {
        track('app_open');
      }
    });
  }, []);

  if (onboarded === null) return null; // splash still showing

  const handleAnalyticsAnswer = async (optIn: boolean) => {
    await AsyncStorage.setItem(ANALYTICS_ASKED_KEY, 'true');
    await setAnalyticsOptOut(!optIn);
    setShowAnalyticsAsk(false);
    track('app_open');
  };

  return (
    <ErrorBoundary>
    <AccessibilityProvider>
    <AppModeProvider>
      <View style={{ flex: 1 }}>

        {/* One-time analytics ask — shown on first launch only */}
        <Modal visible={showAnalyticsAsk} transparent animationType="fade">
          <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.88)', justifyContent:'center', alignItems:'center', padding:28 }}>
            <View style={{ backgroundColor:'#0B0B12', borderRadius:20, borderWidth:1.5, borderColor:'#F5A62355', padding:24, width:'100%', maxWidth:360 }}>
              <Text style={{ color:'#F5A623', fontSize:10, fontWeight:'700', letterSpacing:3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom:14 }}>⊚ ONE THING</Text>
              <Text style={{ color:'#FFFFFF', fontSize:18, fontWeight:'700', lineHeight:26, marginBottom:12 }}>
                I need one thing from you.
              </Text>
              <Text style={{ color:'#AAAABC', fontSize:14, lineHeight:22, marginBottom:8 }}>
                I built Sol alone, and I have no idea if anyone is actually using it.
              </Text>
              <Text style={{ color:'#AAAABC', fontSize:14, lineHeight:22, marginBottom:24 }}>
                Can I count anonymous app opens? No names, no content, nothing personal — just a number so I know the lights are on.
              </Text>
              <TouchableOpacity
                onPress={() => handleAnalyticsAnswer(true)}
                style={{ backgroundColor:'#F5A623', borderRadius:12, paddingVertical:14, alignItems:'center', marginBottom:10 }}
                activeOpacity={0.85}
              >
                <Text style={{ color:'#000', fontSize:14, fontWeight:'800', letterSpacing:0.5 }}>Yes — help you know</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAnalyticsAnswer(false)}
                style={{ borderRadius:12, paddingVertical:12, alignItems:'center' }}
                activeOpacity={0.7}
              >
                <Text style={{ color:'#666677', fontSize:13 }}>No thanks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
