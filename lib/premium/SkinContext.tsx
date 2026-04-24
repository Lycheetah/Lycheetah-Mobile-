// SOL v4.0.0 — Skin Context
// App-wide reactive access to the user's active skin and cosmetics.
// Wrap the app in <SkinProvider>; read with useSkin() anywhere.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SKINS, type Skin, type SkinId } from '@/constants/theme';
import {
  getCosmetics,
  getEntitlement,
  isUnlocked,
  setActiveSkin as persistSkin,
  setActiveGlyphSet as persistGlyphSet,
  setActiveAppIcon as persistAppIcon,
  setActiveSignature as persistSignature,
  type Cosmetics,
  type Entitlement,
  type GlyphSetId,
  type AppIconId,
  type SignatureId,
} from './entitlements';

type SkinContextValue = {
  skin: Skin;
  skinId: SkinId;
  cosmetics: Cosmetics;
  entitlement: Entitlement;
  unlocked: boolean;
  setSkin: (id: SkinId) => Promise<void>;
  setGlyphSet: (id: GlyphSetId) => Promise<void>;
  setAppIcon: (id: AppIconId) => Promise<void>;
  setSignature: (id: SignatureId) => Promise<void>;
  refresh: () => Promise<void>;
};

const DEFAULT_COSMETICS: Cosmetics = {
  skin: 'obsidian',
  glyphSet: 'constitutional',
  appIcon: 'default',
  signature: 'sol',
};

const DEFAULT_ENTITLEMENT: Entitlement = {
  premium: false,
  purchasedAt: null,
  devUnlock: false,
};

const SkinContext = createContext<SkinContextValue | null>(null);

export function SkinProvider({ children }: { children: React.ReactNode }) {
  const [cosmetics, setCosmetics] = useState<Cosmetics>(DEFAULT_COSMETICS);
  const [entitlement, setEntitlement] = useState<Entitlement>(DEFAULT_ENTITLEMENT);

  const refresh = useCallback(async () => {
    const [cos, ent] = await Promise.all([getCosmetics(), getEntitlement()]);
    setCosmetics(cos);
    setEntitlement(ent);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unlocked = isUnlocked(entitlement);

  // Enforce sovereignty at the boundary: if a premium skin is active but the user
  // is no longer premium, fall back to obsidian. Prevents a paid cosmetic from
  // sticking after a refund or a re-install.
  const effectiveSkinId: SkinId = useMemo(() => {
    const wanted = cosmetics.skin;
    const skin = SKINS[wanted];
    if (!skin) return 'obsidian';
    if (skin.premium && !unlocked) return 'obsidian';
    return wanted;
  }, [cosmetics.skin, unlocked]);

  const skin = SKINS[effectiveSkinId];

  const setSkin = useCallback(async (id: SkinId) => {
    await persistSkin(id);
    setCosmetics((c) => ({ ...c, skin: id }));
  }, []);
  const setGlyphSet = useCallback(async (id: GlyphSetId) => {
    await persistGlyphSet(id);
    setCosmetics((c) => ({ ...c, glyphSet: id }));
  }, []);
  const setAppIcon = useCallback(async (id: AppIconId) => {
    await persistAppIcon(id);
    setCosmetics((c) => ({ ...c, appIcon: id }));
  }, []);
  const setSignature = useCallback(async (id: SignatureId) => {
    await persistSignature(id);
    setCosmetics((c) => ({ ...c, signature: id }));
  }, []);

  const value: SkinContextValue = useMemo(
    () => ({
      skin,
      skinId: effectiveSkinId,
      cosmetics,
      entitlement,
      unlocked,
      setSkin,
      setGlyphSet,
      setAppIcon,
      setSignature,
      refresh,
    }),
    [skin, effectiveSkinId, cosmetics, entitlement, unlocked, setSkin, setGlyphSet, setAppIcon, setSignature, refresh],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

export function useSkin(): SkinContextValue {
  const ctx = useContext(SkinContext);
  if (!ctx) {
    // Render-safe fallback so a component outside the provider still works with defaults.
    return {
      skin: SKINS.obsidian,
      skinId: 'obsidian',
      cosmetics: DEFAULT_COSMETICS,
      entitlement: DEFAULT_ENTITLEMENT,
      unlocked: false,
      setSkin: async () => {},
      setGlyphSet: async () => {},
      setAppIcon: async () => {},
      setSignature: async () => {},
      refresh: async () => {},
    };
  }
  return ctx;
}
