import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppMode = 'seeker' | 'wayfarer' | 'adept';

const APP_MODE_KEY = 'sol_app_mode';

export async function saveAppMode(mode: AppMode): Promise<void> {
  await AsyncStorage.setItem(APP_MODE_KEY, mode);
}

export async function getAppMode(): Promise<AppMode> {
  const v = await AsyncStorage.getItem(APP_MODE_KEY);
  return v === 'wayfarer' ? 'wayfarer' : 'seeker';
}

// Wayfarer language map — plain equivalents for every Seeker term
const WAYFARER: Record<string, string> = {
  // Navigation
  'MYSTERY SCHOOL': 'LEARN',
  'THE MYSTERY SCHOOL': 'LEARN',
  'Mystery School': 'Learn',
  'School': 'Learn',
  'THE SANCTUM': 'JOURNAL',
  'The Sanctum': 'Journal',
  'Sanctum': 'Journal',
  // Domain names
  'Meditation & Contemplative': 'Mindfulness Practice',
  'Somatic & Body': 'Body & Nervous System',
  'Shadow & Depth Psychology': 'Inner Life',
  'Alchemical & Hermetic Arts': 'Transformation',
  'Divination Arts': 'Pattern & Intuition',
  'Shamanic Arts': 'Ancient Wisdom',
  'AI & Technology Consciousness': 'Mind & Technology',
  'Sacred Arts & Ritual': 'Ritual & Practice',
  'Death & Impermanence': 'Life & Impermanence',
  'Hybrid Subjects': 'Crossroads',
  'Energy & Subtle Body': 'Energy & Vitality',
  'Mystical Traditions': 'Spiritual Traditions',
  'Cosmology & Sacred Science': 'Universe & Meaning',
  'Philosophy & Wisdom Traditions': 'Philosophy & Wisdom',
  'Mathematics & the Infinite': 'Maths & Infinity',
  'Entheogenic Studies': 'Plant Medicine & Mind',
  'Ecology & Earth Intelligence': 'Nature & Earth Wisdom',
  // Field terms
  'Field State': 'Inner State',
  'The Field': 'Your Space',
  'AURA Score': 'Depth Score',
  'Coherence': 'Focus',
  'The Work': 'Your Practice',
  'EDGE': 'Advanced',
  'FOUNDATION': 'Beginning',
  'MIDDLE': 'Intermediate',
  'Edge': 'Advanced',
  'Foundation': 'Beginning',
  'Middle': 'Intermediate',
};

export function translateLabel(mode: AppMode, label: string): string {
  if (mode === 'wayfarer') return WAYFARER[label] ?? label;
  return label; // seeker and adept use raw labels
}

// Context
interface AppModeCtx {
  mode: AppMode;
  setMode: (mode: AppMode) => Promise<void>;
  t: (label: string) => string;
  isWayfarer: boolean;
  isAdept: boolean;
}

const AppModeContext = createContext<AppModeCtx>({
  mode: 'seeker',
  setMode: async () => {},
  t: l => l,
  isWayfarer: false,
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
  const isWayfarer = mode === 'wayfarer';
  const isAdept = mode === 'adept';

  return React.createElement(
    AppModeContext.Provider,
    { value: { mode, setMode, t, isWayfarer, isAdept } },
    children
  );
}

export function useAppMode(): AppModeCtx {
  return useContext(AppModeContext);
}
