// lib/analytics.ts
// ── SOL ANALYTICS ────────────────────────────────────────────────────────────
// Privacy-first, anonymous usage analytics. COVENANT-SAFE by design:
//   • NO personal data, NO persistent device identifier. Aptabase counts unique
//     users server-side with a daily-rotating, privacy-preserving hash — there is
//     no cross-session tracking of any individual. We send only an ephemeral
//     sessionId that rotates after inactivity.
//   • Opt-out is respected app-wide (sol_analytics_optout). Transparent, reversible.
//   • Fire-and-forget: a network failure NEVER touches the user experience.
//   • Pure JS (no native module) — runs in Expo Go AND production builds.
//
// Backend: Aptabase HTTP ingest API (open-source, privacy-first, free tier).
//   MAC: create a free app at https://aptabase.dev → copy the App Key →
//   paste it into APTABASE_APP_KEY below. Until then this no-ops (fully off).
//
// What you get: DAU / MAU / retention / per-event counts on the Aptabase dashboard.
// That turns "I don't measure retention yet" into a real number.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── CONFIG ───────────────────────────────────────────────────────────────────
// Empty key = analytics fully disabled (every call is a no-op). Safe default.
// Key format: "A-US-0000000000" / "A-EU-..." / "A-DEV-..." — the region segment
// selects the ingest host automatically.
const APTABASE_APP_KEY = '';

const OPTOUT_KEY = 'sol_analytics_optout';
const SESSION_TIMEOUT_MS = 1000 * 60 * 60; // 1h of inactivity starts a new session

const HOSTS: Record<string, string> = {
  US: 'https://us.aptabase.com',
  EU: 'https://eu.aptabase.com',
  DEV: 'http://localhost:3000',
};

let _optedOut = false;
let _ready = false;
let _sessionId = '';
let _lastTouch = 0;

function rand8(): string {
  return Math.random().toString(16).slice(2, 10);
}

function host(): string {
  const region = (APTABASE_APP_KEY.split('-')[1] || 'US').toUpperCase();
  return HOSTS[region] || HOSTS.US;
}

function sessionId(): string {
  const now = Date.now();
  if (!_sessionId || now - _lastTouch > SESSION_TIMEOUT_MS) {
    _sessionId = `${now}-${rand8()}`;
  }
  _lastTouch = now;
  return _sessionId;
}

/** Call once at app start. Loads the opt-out preference. Never throws. */
export async function initAnalytics(): Promise<void> {
  try {
    const optout = await AsyncStorage.getItem(OPTOUT_KEY);
    _optedOut = optout === 'true';
    _ready = true;
  } catch {
    _ready = false; // analytics must never break boot
  }
}

/** User-facing privacy control. Wire this to a toggle in Settings. */
export async function setAnalyticsOptOut(optOut: boolean): Promise<void> {
  _optedOut = optOut;
  try {
    await AsyncStorage.setItem(OPTOUT_KEY, optOut ? 'true' : 'false');
  } catch {
    /* best-effort */
  }
}

export function isAnalyticsOptedOut(): boolean {
  return _optedOut;
}

/**
 * Record an anonymous event. Fire-and-forget — safe to call from anywhere.
 * No-ops if there's no key, the user opted out, or init hasn't run.
 *   track('app_open')
 *   track('dive_completed', { domain: 'quantum' })
 */
export function track(eventName: string, props?: Record<string, string | number | boolean>): void {
  if (!APTABASE_APP_KEY || _optedOut || !_ready) return;

  const body = {
    timestamp: new Date().toISOString(),
    sessionId: sessionId(),
    eventName,
    systemProps: {
      isDebug: __DEV__,
      osName: Platform.OS,
      osVersion: String(Platform.Version),
      locale: 'en',
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      appBuildNumber: '',
      sdkVersion: 'sol-analytics@1.0.0',
    },
    props: props ?? {},
  };

  // Never await, never throw — analytics is best-effort and invisible to the user.
  fetch(`${host()}/api/v0/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'App-Key': APTABASE_APP_KEY,
    },
    body: JSON.stringify(body),
  }).catch(() => {
    /* swallow — a failed beacon must never affect the experience */
  });
}
