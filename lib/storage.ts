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
  return (await AsyncStorage.getItem(KEYS.MODEL)) || 'gemini-2.5-flash';
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
export async function savePersona(persona: 'sol' | 'veyra' | 'aura-prime') { await AsyncStorage.setItem(KEYS.PERSONA, persona); }
export async function getPersona(): Promise<'sol' | 'veyra' | 'aura-prime'> {
  return ((await AsyncStorage.getItem(KEYS.PERSONA)) as 'sol' | 'veyra' | 'aura-prime') || 'sol';
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

// Active API key — returns key matching the current model's provider
export async function getActiveKey(): Promise<string | null> {
  const model = await getModel();
  const { getProviderFromModel } = await import('./ai-client');
  const provider = getProviderFromModel(model as any);
  return getProviderKey(provider);
}
