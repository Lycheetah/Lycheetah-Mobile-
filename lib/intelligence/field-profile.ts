import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'sol_field_profile';

export type FieldProfile = {
  preferredDepth: 'deep' | 'quick' | 'balanced';
  dominantPersona: string;
  topDomains: string[];
  studySessions: number;
  avgAURA: number;
  totalMessages: number;
  lastUpdated: string;
};

const DEFAULT_PROFILE: FieldProfile = {
  preferredDepth: 'balanced',
  dominantPersona: 'sol',
  topDomains: [],
  studySessions: 0,
  avgAURA: 0,
  totalMessages: 0,
  lastUpdated: new Date().toISOString(),
};

export async function getFieldProfile(): Promise<FieldProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Update field profile incrementally after a response.
 * auraScore: 0-7 (passed invariants count)
 * persona: active persona
 * responseLength: length of user's message (proxy for depth preference)
 * studiedDomain: if this was a school study session
 */
export async function updateFieldProfile(opts: {
  auraScore?: number;
  persona?: string;
  userMessageLength?: number;
  studiedDomain?: string;
  isStudySession?: boolean;
}): Promise<void> {
  try {
    const profile = await getFieldProfile();

    // Update AURA rolling average
    if (opts.auraScore != null) {
      const n = profile.totalMessages;
      profile.avgAURA = n === 0
        ? opts.auraScore
        : (profile.avgAURA * n + opts.auraScore) / (n + 1);
      profile.totalMessages++;
    }

    // Update persona usage (dominant = most used)
    if (opts.persona) {
      profile.dominantPersona = opts.persona;
    }

    // Update depth preference from message length
    if (opts.userMessageLength != null) {
      if (opts.userMessageLength > 200) {
        // Long message → prefers deep
        profile.preferredDepth = 'deep';
      } else if (opts.userMessageLength < 50 && profile.totalMessages > 10) {
        // Consistently short → prefers quick
        profile.preferredDepth = profile.preferredDepth === 'deep' ? 'balanced' : 'quick';
      }
    }

    // Update top domains from study sessions
    if (opts.studiedDomain) {
      if (!profile.topDomains.includes(opts.studiedDomain)) {
        profile.topDomains.push(opts.studiedDomain);
        if (profile.topDomains.length > 5) profile.topDomains.shift();
      }
    }

    if (opts.isStudySession) {
      profile.studySessions++;
    }

    profile.lastUpdated = new Date().toISOString();
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // silent fail — non-critical
  }
}

/**
 * Format field profile as a compact context line for system prompt injection.
 */
export function formatProfileForContext(profile: FieldProfile): string {
  if (profile.totalMessages === 0) return '';

  const depthLabel = {
    deep: 'deep reflection',
    quick: 'concise responses',
    balanced: 'balanced depth',
  }[profile.preferredDepth];

  const auraStr = profile.avgAURA > 0 ? ` · avg AURA ${profile.avgAURA.toFixed(1)}/7` : '';
  const domainsStr = profile.topDomains.length > 0
    ? ` · strongest in ${profile.topDomains.slice(-2).join(' & ')}`
    : '';
  const studyStr = profile.studySessions > 0 ? ` · ${profile.studySessions} study sessions` : '';

  return `[Field Profile] Prefers ${depthLabel}${auraStr}${domainsStr}${studyStr}`;
}
