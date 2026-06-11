// AdMob rewarded ads — free-tier bonus channel
// Requires: npx expo install react-native-google-mobile-ads
// app.json plugin: ["react-native-google-mobile-ads", { "androidAppId": "ca-app-pub-REPLACE_ME~REPLACE_ME" }]

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROD_AD_UNIT_ID = 'ca-app-pub-REPLACE_ME/REPLACE_ME';
const MAX_ADS_PER_DAY = 2;
const AD_COUNT_KEY = 'sol_ad_count';

async function getAdMob() {
  try {
    const mod: any = await import('react-native-google-mobile-ads');
    if (!mod?.RewardedAd) return null;
    return mod;
  } catch {
    return null;
  }
}

async function getTodayAdCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(AD_COUNT_KEY);
  if (!raw) return 0;
  const { date, count } = JSON.parse(raw);
  const today = new Date().toISOString().split('T')[0];
  return date === today ? count : 0;
}

async function incrementAdCount(): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const current = await getTodayAdCount();
  const next = current + 1;
  await AsyncStorage.setItem(AD_COUNT_KEY, JSON.stringify({ date: today, count: next }));
  return next;
}

export async function canWatchAd(): Promise<boolean> {
  const count = await getTodayAdCount();
  return count < MAX_ADS_PER_DAY;
}

export async function getAdsWatchedToday(): Promise<number> {
  return getTodayAdCount();
}

export type AdResult =
  | { rewarded: true }
  | { rewarded: false; reason: 'limit_reached' | 'not_loaded' | 'dismissed' | 'error' | 'unavailable'; error?: string };

export async function showRewardedAd(): Promise<AdResult> {
  const count = await getTodayAdCount();
  if (count >= MAX_ADS_PER_DAY) return { rewarded: false, reason: 'limit_reached' };

  const AdMob = await getAdMob();
  if (!AdMob) return { rewarded: false, reason: 'unavailable', error: 'AdMob not installed in this build.' };

  const { RewardedAd, RewardedAdEventType, TestIds } = AdMob;
  const adUnitId = __DEV__ ? TestIds.REWARDED : PROD_AD_UNIT_ID;

  return new Promise(resolve => {
    const ad = RewardedAd.createForAdRequest(adUnitId, { requestNonPersonalizedAdsOnly: true });

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      ad.show();
    });

    const unsubEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      unsubLoaded();
      unsubEarned();
      incrementAdCount().then(() => resolve({ rewarded: true }));
    });

    ad.addAdEventListener('adClosed' as any, () => {
      resolve({ rewarded: false, reason: 'dismissed' });
    });

    ad.addAdEventListener('adFailedToLoad' as any, (error: Error) => {
      unsubLoaded();
      resolve({ rewarded: false, reason: 'not_loaded', error: error?.message });
    });

    ad.load();
  });
}
