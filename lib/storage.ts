import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './ai-client';

const KEYS = {
  ANTHROPIC_KEY: 'lycheetah_anthropic_key',
  GEMINI_KEY: 'lycheetah_gemini_key',
  MODEL: 'lycheetah_model',
  VARIANT: 'lycheetah_variant',
  CONVERSATION: 'lycheetah_conversation',
  ONBOARDED: 'lycheetah_onboarded',
  PERSONA: 'lycheetah_persona',
  USER_NAME: 'lycheetah_user_name',
};

// Anthropic
export async function saveAnthropicKey(key: string) { await AsyncStorage.setItem(KEYS.ANTHROPIC_KEY, key); }
export async function getAnthropicKey(): Promise<string | null> { return AsyncStorage.getItem(KEYS.ANTHROPIC_KEY); }

// Gemini
export async function saveGeminiKey(key: string) { await AsyncStorage.setItem(KEYS.GEMINI_KEY, key); }
export async function getGeminiKey(): Promise<string | null> { return AsyncStorage.getItem(KEYS.GEMINI_KEY); }

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

// Active API key — returns whichever key matches the current model
export async function getActiveKey(): Promise<string | null> {
  const model = await getModel();
  if (model.startsWith('gemini')) return getGeminiKey();
  return getAnthropicKey();
}
