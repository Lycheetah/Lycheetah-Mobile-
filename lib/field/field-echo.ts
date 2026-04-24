// SOL v4.0.0 — Field Echo
// On app open, Sol surfaces a single sentence from the previous session:
// something the user wrote, a tool that ran, a paradox that was logged.
// It is continuity made visible. Not a summary — a remembered fragment.
//
// The echo is chosen locally from whatever persistence layers are already present
// (conversations, journal, tool log, paradox journal). No AI call. No round trip.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_ECHO = 'sol.field.lastEcho.v1';
const KEY_ECHO_SHOWN_AT = 'sol.field.echoShownAt.v1';

export type EchoKind = 'utterance' | 'paradox' | 'tool' | 'insight' | 'journal';

export type FieldEcho = {
  kind: EchoKind;
  text: string;      // the sentence or fragment to display
  source?: string;   // optional label (e.g. "Paradox Journal", "Tool: wikipedia_search")
  at: string;        // ISO timestamp of the source moment
};

export async function setEcho(echo: FieldEcho): Promise<void> {
  await AsyncStorage.setItem(KEY_LAST_ECHO, JSON.stringify(echo));
}

export async function getEcho(): Promise<FieldEcho | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_LAST_ECHO);
    if (!raw) return null;
    return JSON.parse(raw) as FieldEcho;
  } catch {
    return null;
  }
}

// Sol only surfaces one echo per day, so re-opens within the same day do not
// repeat the ceremony. Returns null if already shown today.
export async function consumeEchoIfDue(): Promise<FieldEcho | null> {
  const echo = await getEcho();
  if (!echo) return null;
  const lastShown = await AsyncStorage.getItem(KEY_ECHO_SHOWN_AT);
  const today = new Date().toISOString().slice(0, 10);
  if (lastShown === today) return null;
  await AsyncStorage.setItem(KEY_ECHO_SHOWN_AT, today);
  return echo;
}

// Convenience: call this whenever a meaningful moment happens so the next open
// can echo it. Upstream code chooses what counts as meaningful.
export async function captureMoment(
  kind: EchoKind,
  text: string,
  source?: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  // Keep only the first sentence or up to 180 chars — an echo is a fragment, not a paragraph.
  const firstSentence = trimmed.split(/(?<=[.!?])\s/)[0] || trimmed;
  const clipped = firstSentence.length > 180 ? firstSentence.slice(0, 177) + '…' : firstSentence;
  await setEcho({ kind, text: clipped, source, at: new Date().toISOString() });
}
