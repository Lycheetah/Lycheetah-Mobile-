// RevenueCat integration — Sovereign Supporter billing
// Requires: npx expo install react-native-purchases
// Dashboard: app.revenuecat.com — set REVENUECAT_ANDROID_KEY before EAS build

import { Platform } from 'react-native';

const REVENUECAT_ANDROID_KEY = 'goog_REPLACE_ME';
const REVENUECAT_IOS_KEY = 'appl_REPLACE_ME';

export const SOVEREIGN_ENTITLEMENT = 'sovereign_supporter';
export const PRODUCT_MONTHLY = 'sol_sovereign_monthly';   // $7.99/mo
export const PRODUCT_ANNUAL = 'sol_sovereign_annual';     // $59/yr

let _initialized = false;

async function getPurchases() {
  try {
    const mod = await import('react-native-purchases');
    return mod.default as typeof import('react-native-purchases').default;
  } catch {
    return null;
  }
}

export async function initPurchases(): Promise<void> {
  if (_initialized) return;
  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  if (key.includes('REPLACE_ME')) return;
  const Purchases = await getPurchases();
  if (!Purchases) return;
  if (__DEV__) {
    const { LOG_LEVEL } = await import('react-native-purchases');
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  await Purchases.configure({ apiKey: key });
  _initialized = true;
}

export async function checkSovereignEntitlement(): Promise<boolean> {
  try {
    const Purchases = await getPurchases();
    if (!Purchases) return false;
    const info = await Purchases.getCustomerInfo();
    return !!info.entitlements.active[SOVEREIGN_ENTITLEMENT];
  } catch {
    return false;
  }
}

export type PurchaseResult =
  | { success: true }
  | { success: false; cancelled: boolean; error: string };

export async function purchaseSovereign(productId: string): Promise<PurchaseResult> {
  try {
    const Purchases = await getPurchases();
    if (!Purchases) return { success: false, cancelled: false, error: 'Billing not available in this build.' };
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find((p: any) => p.product.identifier === productId);
    if (!pkg) return { success: false, cancelled: false, error: 'Product not found. Check RevenueCat offerings.' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = !!customerInfo.entitlements.active[SOVEREIGN_ENTITLEMENT];
    if (active) return { success: true };
    return { success: false, cancelled: false, error: 'Purchase completed but entitlement not found.' };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true, error: '' };
    return { success: false, cancelled: false, error: e?.message ?? 'Purchase failed.' };
  }
}

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const Purchases = await getPurchases();
    if (!Purchases) return { success: false, cancelled: false, error: 'Billing not available in this build.' };
    const info = await Purchases.restorePurchases();
    const active = !!info.entitlements.active[SOVEREIGN_ENTITLEMENT];
    if (active) return { success: true };
    return { success: false, cancelled: false, error: 'No active Sovereign subscription found on this account.' };
  } catch (e: any) {
    return { success: false, cancelled: false, error: e?.message ?? 'Restore failed.' };
  }
}
