// SOL v4.0.0 — Premium Entitlements
// Local-first. Premium is cosmetic-only (skins, glyph sets, app icons, signature packs).
// Zero feature walls. The framework is free forever. This is a patron badge.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SkinId } from '@/constants/theme';

const KEY_PREMIUM = 'sol.premium.v1';
const KEY_ACTIVE_SKIN = 'sol.skin.active.v1';
const KEY_ACTIVE_GLYPH_SET = 'sol.glyphSet.active.v1';
const KEY_ACTIVE_ICON = 'sol.icon.active.v1';
const KEY_ACTIVE_SIGNATURE = 'sol.signature.active.v1';

export type GlyphSetId = 'constitutional' | 'alchemical';
export type AppIconId = 'default' | 'gold' | 'obsidian' | 'violet' | 'parchment' | 'ember' | 'ivory';
export type SignatureId = 'sol' | 'sigil' | 'crown' | 'trine' | 'azoth';

export type Entitlement = {
  premium: boolean;
  purchasedAt: string | null;
  // Dev-only local unlock for testing. Removed before Play Store.
  devUnlock: boolean;
};

export type Cosmetics = {
  skin: SkinId;
  glyphSet: GlyphSetId;
  appIcon: AppIconId;
  signature: SignatureId;
};

const PRODUCT_ID_PREMIUM = 'sol.premium.patron' as const;
export const PREMIUM_PRODUCT_ID = PRODUCT_ID_PREMIUM;
export const PREMIUM_PRICE_USD = 4.99;

export async function getEntitlement(): Promise<Entitlement> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREMIUM);
    if (!raw) return { premium: false, purchasedAt: null, devUnlock: false };
    const parsed = JSON.parse(raw) as Entitlement;
    return {
      premium: Boolean(parsed.premium),
      purchasedAt: parsed.purchasedAt ?? null,
      devUnlock: Boolean(parsed.devUnlock),
    };
  } catch {
    return { premium: false, purchasedAt: null, devUnlock: false };
  }
}

export async function setPremium(purchased: boolean): Promise<void> {
  const ent: Entitlement = {
    premium: purchased,
    purchasedAt: purchased ? new Date().toISOString() : null,
    devUnlock: false,
  };
  await AsyncStorage.setItem(KEY_PREMIUM, JSON.stringify(ent));
}

// Dev-only toggle for testing premium UI without purchasing.
// Must be gated behind __DEV__ in the UI. Never ship a user-facing switch.
export async function setDevUnlock(unlock: boolean): Promise<void> {
  const current = await getEntitlement();
  const ent: Entitlement = {
    premium: current.premium,
    purchasedAt: current.purchasedAt,
    devUnlock: unlock,
  };
  await AsyncStorage.setItem(KEY_PREMIUM, JSON.stringify(ent));
}

export function isUnlocked(ent: Entitlement): boolean {
  return ent.premium || (__DEV__ && ent.devUnlock);
}

export async function getCosmetics(): Promise<Cosmetics> {
  const [skin, glyphSet, appIcon, signature] = await Promise.all([
    AsyncStorage.getItem(KEY_ACTIVE_SKIN),
    AsyncStorage.getItem(KEY_ACTIVE_GLYPH_SET),
    AsyncStorage.getItem(KEY_ACTIVE_ICON),
    AsyncStorage.getItem(KEY_ACTIVE_SIGNATURE),
  ]);
  return {
    skin: (skin as SkinId) || 'obsidian',
    glyphSet: (glyphSet as GlyphSetId) || 'constitutional',
    appIcon: (appIcon as AppIconId) || 'default',
    signature: (signature as SignatureId) || 'sol',
  };
}

export async function setActiveSkin(skin: SkinId): Promise<void> {
  await AsyncStorage.setItem(KEY_ACTIVE_SKIN, skin);
}

export async function setActiveGlyphSet(set: GlyphSetId): Promise<void> {
  await AsyncStorage.setItem(KEY_ACTIVE_GLYPH_SET, set);
}

export async function setActiveAppIcon(icon: AppIconId): Promise<void> {
  await AsyncStorage.setItem(KEY_ACTIVE_ICON, icon);
}

export async function setActiveSignature(sig: SignatureId): Promise<void> {
  await AsyncStorage.setItem(KEY_ACTIVE_SIGNATURE, sig);
}

// What premium unlocks — pure cosmetics.
// Any addition to this list must pass the sovereignty check:
// "Does this item affect framework behavior, AI access, or the constitutional engine?"
// If yes → it belongs in free tier, not here.
export const PREMIUM_UNLOCKS = [
  {
    title: 'Two additional skins',
    detail: 'Aureate (warm gold) and Nocturne (deep violet)',
  },
  {
    title: 'Alchemical glyph set',
    detail: 'Alternate sigils for all 4 personas',
  },
  {
    title: 'Six custom app icons',
    detail: 'Change how Sol looks on your home screen',
  },
  {
    title: 'Five signature packs',
    detail: "Choose Sol's signoff glyph",
  },
  {
    title: 'Patron mark',
    detail: 'A small gold dot in Settings. Thank you for keeping the framework free.',
  },
] as const;

// What premium does NOT unlock — the sovereignty line.
// This is read from the PremiumSheet to make the bargain explicit.
export const PREMIUM_DOES_NOT_UNLOCK = [
  'Personas, modes, or providers — all free',
  'The 8 tools or Mystery School — all free',
  'AURA scoring or the framework — all free',
  'Additional free-tier messages — ads do that',
  'Any feature that affects sovereignty',
] as const;
