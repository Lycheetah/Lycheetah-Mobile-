import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HC_KEY = 'sol_high_contrast';

type AccessibilityCtx = {
  highContrast: boolean;
  setHighContrast: (v: boolean) => Promise<void>;
};

const AccessibilityContext = createContext<AccessibilityCtx>({
  highContrast: false,
  setHighContrast: async () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHC] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(HC_KEY).then(v => { if (v === 'true') setHC(true); });
  }, []);

  const setHighContrast = async (v: boolean) => {
    setHC(v);
    await AsyncStorage.setItem(HC_KEY, v ? 'true' : 'false');
  };

  return (
    <AccessibilityContext.Provider value={{ highContrast, setHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}

// Call this in any screen that has muted/small text
export function useHCTheme() {
  const { highContrast: hc } = useAccessibility();
  return {
    hc,
    // Text colours
    text:       hc ? '#FFFFFF'  : '#F0EDE8',
    muted:      hc ? '#CCCCDD' : '#888888',
    mutedMid:   hc ? '#AAAABC' : '#666677',
    mutedDeep:  hc ? '#9999AA' : '#555566',
    dim:        hc ? '#8888AA' : '#444455',
    // Size floor — bumps anything below 13 up to 13 when HC on
    sz: (n: number) => hc ? Math.max(n, 13) : n,
    // Line height multiplier
    lh: (n: number) => hc ? Math.round(n * 1.15) : n,
  };
}
