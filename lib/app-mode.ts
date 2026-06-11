import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMode = 'seeker' | 'adept';

const APP_MODE_KEY = 'sol_app_mode';

export async function saveAppMode(mode: AppMode): Promise<void> {
  await AsyncStorage.setItem(APP_MODE_KEY, mode);
}

export async function getAppMode(): Promise<AppMode> {
  const v = await AsyncStorage.getItem(APP_MODE_KEY);
  if (v === 'adept') return 'adept';
  return 'seeker';
}

export function translateLabel(_mode: AppMode, label: string): string {
  return label;
}

// Context
interface AppModeCtx {
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  t: (label: string) => string;
  isAdept: boolean;
}

const AppModeContext = createContext<AppModeCtx>({
  mode: 'seeker',
  setMode: async () => {},
  t: l => l,
  isAdept: false,
});

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('seeker');

  useEffect(() => {
    getAppMode().then(setModeState);
  }, []);

  const setMode = async (m: AppMode) => {
    await saveAppMode(m);
    setModeState(m);
  };

  const t = (label: string) => translateLabel(mode, label);
  const isAdept = mode === 'adept';

  return React.createElement(
    AppModeContext.Provider,
    { value: { mode, setMode, t, isAdept } },
    children
  );
}

export function useAppMode(): AppModeCtx {
  return useContext(AppModeContext);
}
