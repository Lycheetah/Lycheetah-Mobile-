// SOL v4.0.0 — Free-tier rate limit with rewarded ad bonuses.
// Client-side bookkeeping. The Cloudflare worker is the authoritative enforcer —
// this module mirrors the rules so the UI can show accurate counts without a round trip.
//
// RULES (v4.0):
//   - Baseline:     10 free messages per day for users without an API key.
//   - Rewarded ad:  +10 messages, up to 2 ads per day → cap 30/day.
//   - Cap reset:    midnight local time.
//
// Sovereignty rules:
//   - Ads are NEVER shown except via an explicit user tap ("Watch ad for +10 messages").
//   - No banner ads anywhere. No interstitials. No forced ads.
//   - Users with a key or premium skip this entire system.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_USAGE = 'sol.freetier.usage.v1';

export const FREE_BASELINE = 10;
export const AD_BONUS = 10;
export const AD_MAX_PER_DAY = 2;
export const DAILY_CAP_HARD = FREE_BASELINE + AD_BONUS * AD_MAX_PER_DAY; // 30

type UsageRecord = {
  date: string; // YYYY-MM-DD local
  messagesUsed: number;
  adsWatched: number;
};

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function read(): Promise<UsageRecord> {
  try {
    const raw = await AsyncStorage.getItem(KEY_USAGE);
    if (!raw) return { date: today(), messagesUsed: 0, adsWatched: 0 };
    const parsed = JSON.parse(raw) as UsageRecord;
    if (parsed.date !== today()) {
      return { date: today(), messagesUsed: 0, adsWatched: 0 };
    }
    return parsed;
  } catch {
    return { date: today(), messagesUsed: 0, adsWatched: 0 };
  }
}

async function write(rec: UsageRecord): Promise<void> {
  await AsyncStorage.setItem(KEY_USAGE, JSON.stringify(rec));
}

export type FreeTierStatus = {
  messagesUsed: number;
  capToday: number;
  remaining: number;
  adsWatched: number;
  adsAvailable: number;
  canSend: boolean;
  canWatchAd: boolean;
};

export async function getStatus(): Promise<FreeTierStatus> {
  const r = await read();
  const capToday = FREE_BASELINE + r.adsWatched * AD_BONUS;
  const remaining = Math.max(0, capToday - r.messagesUsed);
  const adsAvailable = Math.max(0, AD_MAX_PER_DAY - r.adsWatched);
  return {
    messagesUsed: r.messagesUsed,
    capToday,
    remaining,
    adsWatched: r.adsWatched,
    adsAvailable,
    canSend: remaining > 0,
    canWatchAd: adsAvailable > 0 && remaining === 0,
  };
}

export async function recordMessageSent(): Promise<FreeTierStatus> {
  const r = await read();
  r.messagesUsed += 1;
  await write(r);
  return getStatus();
}

export async function recordAdWatched(): Promise<FreeTierStatus> {
  const r = await read();
  if (r.adsWatched >= AD_MAX_PER_DAY) return getStatus();
  r.adsWatched += 1;
  await write(r);
  return getStatus();
}

// For testing and "reset today" dev affordance.
export async function resetToday(): Promise<void> {
  await write({ date: today(), messagesUsed: 0, adsWatched: 0 });
}
