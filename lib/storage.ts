import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './ai-client';

const KEYS = {
  REPLY_STYLE: 'lycheetah_reply_style',
  ANTHROPIC_KEY: 'lycheetah_anthropic_key',
  GEMINI_KEY: 'lycheetah_gemini_key',
  OPENAI_KEY: 'lycheetah_openai_key',
  DEEPSEEK_KEY: 'lycheetah_deepseek_key',
  KIMI_KEY: 'lycheetah_kimi_key',
  MODEL: 'lycheetah_model',
  VARIANT: 'lycheetah_variant',
  CONVERSATION: 'lycheetah_conversation',
  ONBOARDED: 'lycheetah_onboarded',
  PERSONA: 'lycheetah_persona',
  USER_NAME: 'lycheetah_user_name',
  BG_COLOR: 'lycheetah_bg_color',
  FONT_SIZE: 'lycheetah_font_size',
  HAPTICS: 'lycheetah_haptics',
  STREAM_SPEED: 'lycheetah_stream_speed',
  RESPONSE_LENGTH: 'lycheetah_response_length',
  PENDING_SUBJECT: 'lycheetah_pending_subject',
  ACCENT_COLOR: 'lycheetah_accent_color',
  COMPANION_ENABLED: 'lycheetah_companion_enabled',
  COMPANION_GLYPH: 'lycheetah_companion_glyph',
  SHOW_TIMESTAMPS: 'lycheetah_show_timestamps',
  PINNED_MESSAGES: 'lycheetah_pinned_messages',
  DAILY_INTENTION: 'lycheetah_daily_intention',
  DAILY_INTENTION_DATE: 'lycheetah_daily_intention_date',
  SHARE_APP_CLICKS: 'lycheetah_share_clicks',
  CONTEXT_MEMORY: 'lycheetah_context_memory',
  DAILY_QUESTION: 'lycheetah_daily_question',
  DAILY_QUESTION_DATE: 'lycheetah_daily_question_date',
  PROJECT_CONTEXT: 'lycheetah_project_context',
  BUBBLE_RADIUS: 'lycheetah_bubble_radius',
  COMPANION_ANIM: 'lycheetah_companion_anim',
  TOKEN_BUDGET: 'lycheetah_token_budget',
  TEMPERATURE: 'lycheetah_temperature',
  BRAVE_KEY: 'lycheetah_brave_key',
  FONT_FAMILY: 'lycheetah_font_family',
  BUBBLE_GLOW: 'lycheetah_bubble_glow',
  SHOW_SIGNATURES: 'lycheetah_show_signatures',
  SHOW_TOKEN_BADGE: 'lycheetah_show_token_badge',
  SHOW_METABOLISM: 'lycheetah_show_metabolism',
  SHOW_LAMAGUE_GLOSS: 'lycheetah_show_lamague_gloss',
  SYMBOL_RAIN_ENABLED: 'lycheetah_symbol_rain',
};

// Per-provider key storage
const PROVIDER_KEY_MAP: Record<string, string> = {
  gemini: KEYS.GEMINI_KEY,
  anthropic: KEYS.ANTHROPIC_KEY,
  openai: KEYS.OPENAI_KEY,
  deepseek: KEYS.DEEPSEEK_KEY,
  kimi: KEYS.KIMI_KEY,
};

export async function saveProviderKey(provider: string, key: string) {
  const storageKey = PROVIDER_KEY_MAP[provider];
  if (storageKey) await AsyncStorage.setItem(storageKey, key);
}

export async function getProviderKey(provider: string): Promise<string | null> {
  const storageKey = PROVIDER_KEY_MAP[provider];
  if (!storageKey) return null;
  return AsyncStorage.getItem(storageKey);
}

// Legacy helpers (kept for backward compat)
export async function saveAnthropicKey(key: string) { await saveProviderKey('anthropic', key); }
export async function getAnthropicKey(): Promise<string | null> { return getProviderKey('anthropic'); }
export async function saveGeminiKey(key: string) { await saveProviderKey('gemini', key); }
export async function getGeminiKey(): Promise<string | null> { return getProviderKey('gemini'); }

// Model
export async function saveModel(model: string) { await AsyncStorage.setItem(KEYS.MODEL, model); }
export async function getModel(): Promise<string> {
  const stored = await AsyncStorage.getItem(KEYS.MODEL);
  if (!stored || !stored.trim()) return 'gemini-2.5-flash';
  return stored.trim();
}

// Variant
export async function saveVariant(variant: 'private' | 'public') { await AsyncStorage.setItem(KEYS.VARIANT, variant); }
export async function getVariant(): Promise<'private' | 'public'> {
  return ((await AsyncStorage.getItem(KEYS.VARIANT)) as 'private' | 'public') || 'private';
}

// Conversation
export async function saveConversation(messages: Message[]) {
  await AsyncStorage.setItem(KEYS.CONVERSATION, JSON.stringify(messages));
}
export async function getConversation(): Promise<Message[]> {
  const raw = await AsyncStorage.getItem(KEYS.CONVERSATION);
  return raw ? JSON.parse(raw) : [];
}
export async function clearConversation() { await AsyncStorage.removeItem(KEYS.CONVERSATION); }

// Persona
export async function savePersona(persona: 'sol' | 'veyra' | 'aura-prime' | 'headmaster') { await AsyncStorage.setItem(KEYS.PERSONA, persona); }
export async function getPersona(): Promise<'sol' | 'veyra' | 'aura-prime' | 'headmaster'> {
  return ((await AsyncStorage.getItem(KEYS.PERSONA)) as 'sol' | 'veyra' | 'aura-prime' | 'headmaster') || 'sol';
}

// User name
export async function saveUserName(name: string) { await AsyncStorage.setItem(KEYS.USER_NAME, name); }
export async function getUserName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.USER_NAME)) || '';
}

// Reply style
export async function saveReplyStyle(style: string) { await AsyncStorage.setItem(KEYS.REPLY_STYLE, style); }
export async function getReplyStyle(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.REPLY_STYLE)) || 'alchemical';
}

// Background color
export async function saveBgColor(color: string) { await AsyncStorage.setItem(KEYS.BG_COLOR, color); }
export async function getBgColor(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.BG_COLOR)) || '#0A0A0A';
}

// Font size
export async function saveFontSize(size: 'small' | 'medium' | 'large') { await AsyncStorage.setItem(KEYS.FONT_SIZE, size); }
export async function getFontSize(): Promise<'small' | 'medium' | 'large'> {
  return ((await AsyncStorage.getItem(KEYS.FONT_SIZE)) as 'small' | 'medium' | 'large') || 'medium';
}

// Haptics
export async function saveHaptics(enabled: boolean) { await AsyncStorage.setItem(KEYS.HAPTICS, enabled ? '1' : '0'); }
export async function getHaptics(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.HAPTICS);
  return val === null ? true : val === '1';
}

// Stream speed
export async function saveStreamSpeed(speed: 'fast' | 'normal' | 'slow') { await AsyncStorage.setItem(KEYS.STREAM_SPEED, speed); }
export async function getStreamSpeed(): Promise<'fast' | 'normal' | 'slow'> {
  return ((await AsyncStorage.getItem(KEYS.STREAM_SPEED)) as 'fast' | 'normal' | 'slow') || 'normal';
}

// Response length
export async function saveResponseLength(length: 'short' | 'balanced' | 'detailed') { await AsyncStorage.setItem(KEYS.RESPONSE_LENGTH, length); }
export async function getResponseLength(): Promise<'short' | 'balanced' | 'detailed'> {
  return ((await AsyncStorage.getItem(KEYS.RESPONSE_LENGTH)) as 'short' | 'balanced' | 'detailed') || 'balanced';
}

// Accent color
export async function saveAccentColor(color: string) { await AsyncStorage.setItem(KEYS.ACCENT_COLOR, color); }
export async function getAccentColor(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.ACCENT_COLOR)) || '#F5A623';
}

// Companion
export async function saveCompanionEnabled(enabled: boolean) { await AsyncStorage.setItem(KEYS.COMPANION_ENABLED, enabled ? '1' : '0'); }
export async function getCompanionEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.COMPANION_ENABLED);
  return val === null ? true : val === '1';
}
export async function saveCompanionGlyph(glyph: string) { await AsyncStorage.setItem(KEYS.COMPANION_GLYPH, glyph); }
export async function getCompanionGlyph(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.COMPANION_GLYPH)) || '✦';
}

// Timestamps
export async function saveShowTimestamps(val: boolean) { await AsyncStorage.setItem(KEYS.SHOW_TIMESTAMPS, val ? '1' : '0'); }
export async function getShowTimestamps(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.SHOW_TIMESTAMPS);
  return val === null ? false : val === '1';
}

// Pinned messages
export async function savePinnedMessages(ids: string[]) { await AsyncStorage.setItem(KEYS.PINNED_MESSAGES, JSON.stringify(ids)); }
export async function getPinnedMessages(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.PINNED_MESSAGES);
  return raw ? JSON.parse(raw) : [];
}

// Daily intention
export async function saveDailyIntention(text: string) {
  const today = new Date().toDateString();
  await AsyncStorage.setItem(KEYS.DAILY_INTENTION, text);
  await AsyncStorage.setItem(KEYS.DAILY_INTENTION_DATE, today);
}
export async function getDailyIntention(): Promise<string | null> {
  const today = new Date().toDateString();
  const date = await AsyncStorage.getItem(KEYS.DAILY_INTENTION_DATE);
  if (date !== today) return null;
  return AsyncStorage.getItem(KEYS.DAILY_INTENTION);
}

// Context memory — facts injected into every system prompt
export async function saveContextMemory(items: string[]) { await AsyncStorage.setItem(KEYS.CONTEXT_MEMORY, JSON.stringify(items)); }
export async function getContextMemory(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.CONTEXT_MEMORY);
  return raw ? JSON.parse(raw) : [];
}

// Daily question (Headmaster)
export async function saveDailyQuestion(q: string) {
  const today = new Date().toDateString();
  await AsyncStorage.setItem(KEYS.DAILY_QUESTION, q);
  await AsyncStorage.setItem(KEYS.DAILY_QUESTION_DATE, today);
}
export async function getDailyQuestion(): Promise<string | null> {
  const today = new Date().toDateString();
  const date = await AsyncStorage.getItem(KEYS.DAILY_QUESTION_DATE);
  if (date !== today) return null;
  return AsyncStorage.getItem(KEYS.DAILY_QUESTION);
}

// Project context
export async function saveProjectContext(text: string) { await AsyncStorage.setItem(KEYS.PROJECT_CONTEXT, text); }
export async function getProjectContext(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.PROJECT_CONTEXT)) || '';
}

// Bubble radius
export async function saveBubbleRadius(radius: 'sharp' | 'rounded' | 'pill') { await AsyncStorage.setItem(KEYS.BUBBLE_RADIUS, radius); }
export async function getBubbleRadius(): Promise<'sharp' | 'rounded' | 'pill'> {
  return ((await AsyncStorage.getItem(KEYS.BUBBLE_RADIUS)) as 'sharp' | 'rounded' | 'pill') || 'rounded';
}

// Companion animation style
export async function saveCompanionAnim(style: 'pulse' | 'bounce' | 'spin' | 'breathe') { await AsyncStorage.setItem(KEYS.COMPANION_ANIM, style); }
export async function getCompanionAnim(): Promise<'pulse' | 'bounce' | 'spin' | 'breathe'> {
  return ((await AsyncStorage.getItem(KEYS.COMPANION_ANIM)) as 'pulse' | 'bounce' | 'spin' | 'breathe') || 'pulse';
}

// Pending subject (Mystery School → Chat handoff)
export async function savePendingSubject(subject: string) { await AsyncStorage.setItem(KEYS.PENDING_SUBJECT, subject); }
export async function getPendingSubject(): Promise<string | null> { return AsyncStorage.getItem(KEYS.PENDING_SUBJECT); }
export async function clearPendingSubject() { await AsyncStorage.removeItem(KEYS.PENDING_SUBJECT); }

// Mystery School — studied subjects
const STUDIED_KEY = 'school_studied_v1';
export async function markSubjectStudied(subject: string): Promise<void> {
  const raw = await AsyncStorage.getItem(STUDIED_KEY);
  const set: string[] = raw ? JSON.parse(raw) : [];
  if (!set.includes(subject)) {
    set.push(subject);
    await AsyncStorage.setItem(STUDIED_KEY, JSON.stringify(set));
  }
}
export async function getStudiedSubjects(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STUDIED_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Token budget (max output tokens per response)
export async function saveTokenBudget(budget: number) { await AsyncStorage.setItem(KEYS.TOKEN_BUDGET, String(budget)); }
export async function getTokenBudget(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.TOKEN_BUDGET);
  const parsed = val ? parseInt(val, 10) : 4096;
  return isNaN(parsed) || parsed < 1 ? 4096 : parsed;
}

// Temperature (0.0 = precise, 1.0 = creative)
export async function saveTemperature(temp: number) { await AsyncStorage.setItem(KEYS.TEMPERATURE, String(temp)); }
export async function getTemperature(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.TEMPERATURE);
  return val ? parseFloat(val) : 0.9;
}

// Brave Search API key (for web search tool)
export async function saveBraveKey(key: string) { await AsyncStorage.setItem(KEYS.BRAVE_KEY, key); }
export async function getBraveKey(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.BRAVE_KEY)) || '';
}

// Language-Agnostic Mode
export async function saveLanguage(lang: string) { await AsyncStorage.setItem('sol_language', lang); }
export async function getLanguage(): Promise<string> {
  return (await AsyncStorage.getItem('sol_language')) || 'English';
}

// Font family
export async function saveFontFamily(f: string) { await AsyncStorage.setItem(KEYS.FONT_FAMILY, f); }
export async function getFontFamily(): Promise<'system' | 'mono' | 'serif'> {
  const v = await AsyncStorage.getItem(KEYS.FONT_FAMILY);
  return (v as 'system' | 'mono' | 'serif') || 'system';
}

// Bubble glow
export async function saveBubbleGlow(v: boolean) { await AsyncStorage.setItem(KEYS.BUBBLE_GLOW, JSON.stringify(v)); }
export async function getBubbleGlow(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.BUBBLE_GLOW);
  return v !== null ? JSON.parse(v) : false;
}

// Show/hide signatures (⊚ Sol ∴ P∧H∧B)
export async function saveShowSignatures(v: boolean) { await AsyncStorage.setItem(KEYS.SHOW_SIGNATURES, JSON.stringify(v)); }
export async function getShowSignatures(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.SHOW_SIGNATURES);
  return v !== null ? JSON.parse(v) : true;
}

// Show/hide token badge
export async function saveShowTokenBadge(v: boolean) { await AsyncStorage.setItem(KEYS.SHOW_TOKEN_BADGE, JSON.stringify(v)); }
export async function getShowTokenBadge(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.SHOW_TOKEN_BADGE);
  return v !== null ? JSON.parse(v) : true;
}

// Show/hide conversation metabolism dividers
export async function saveShowMetabolism(v: boolean) { await AsyncStorage.setItem(KEYS.SHOW_METABOLISM, JSON.stringify(v)); }
export async function getShowMetabolism(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.SHOW_METABOLISM);
  return v !== null ? JSON.parse(v) : true;
}

// Show/hide LAMAGUE glossary chips in chat
export async function saveShowLamagueGloss(v: boolean) { await AsyncStorage.setItem(KEYS.SHOW_LAMAGUE_GLOSS, JSON.stringify(v)); }
export async function getShowLamagueGloss(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.SHOW_LAMAGUE_GLOSS);
  return v !== null ? JSON.parse(v) : false; // off by default — power-user opt-in
}

// Symbol Rain toggle
export async function saveSymbolRainEnabled(v: boolean) { await AsyncStorage.setItem(KEYS.SYMBOL_RAIN_ENABLED, JSON.stringify(v)); }
export async function getSymbolRainEnabled(): Promise<boolean> {
  const v = await AsyncStorage.getItem(KEYS.SYMBOL_RAIN_ENABLED);
  return v !== null ? JSON.parse(v) : true; // on by default for existing users
}

// Active API key — returns key matching the current model's provider
export async function getActiveKey(): Promise<string | null> {
  const model = await getModel();
  const { getProviderFromModel } = await import('./ai-client');
  const provider = getProviderFromModel(model as any);
  return getProviderKey(provider);
}
