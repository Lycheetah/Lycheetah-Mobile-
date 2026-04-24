// SOL v4.0.0 — Rewarded ad adapter.
// Stub interface today; AdMob wiring lands when the EAS build picks up native config.
// The UI calls showRewardedAd() and awaits a RewardResult. If AdMob is not yet wired,
// the stub returns a dev-friendly success in __DEV__ so the flow can be tested.
//
// The real implementation (next build) will use react-native-google-mobile-ads:
//   const { RewardedAd, AdEventType, RewardedAdEventType, TestIds } = require('react-native-google-mobile-ads');
//   const ad = RewardedAd.createForAdRequest(__DEV__ ? TestIds.REWARDED : PROD_UNIT_ID);
//   ... load, show, resolve on EARNED_REWARD ...
//
// Until that lands: this module gives the UI a clean interface to code against.

export type RewardResult =
  | { success: true; reward: { amount: number; type: string } }
  | { success: false; reason: 'not-ready' | 'cancelled' | 'no-fill' | 'error'; detail?: string };

let provider: RewardedAdProvider | null = null;

export interface RewardedAdProvider {
  isReady(): boolean;
  preload(): Promise<void>;
  show(): Promise<RewardResult>;
}

// Host app registers the real provider once AdMob is installed.
// Call this once at app start AFTER initialising AdMob.
export function registerProvider(p: RewardedAdProvider): void {
  provider = p;
  // Kick off a preload so first show is instant.
  void p.preload().catch(() => {});
}

export function isRewardedAdAvailable(): boolean {
  if (provider) return provider.isReady();
  return __DEV__; // in dev, the stub is always "available"
}

export async function showRewardedAd(): Promise<RewardResult> {
  if (provider) {
    return provider.show();
  }
  if (__DEV__) {
    // Dev stub — simulate a 1.5s ad so the UI can show loading states.
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true, reward: { amount: 1, type: 'bonus' } };
  }
  return { success: false, reason: 'not-ready', detail: 'AdMob not configured in this build' };
}
