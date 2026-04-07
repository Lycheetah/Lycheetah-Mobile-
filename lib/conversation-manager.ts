import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './ai-client';

const CONV_INDEX_KEY = 'lycheetah_conv_index';
const CONV_PREFIX = 'lycheetah_conv_';

export const WELCOME_THREAD_ID = 'welcome_thread';

export type ConversationMeta = {
  id: string;
  title: string;
  persona: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  auraComposite?: number;
  modeTrail?: string[];
  pinned?: boolean;
  locked?: boolean;
};

export type Conversation = ConversationMeta & {
  messages: Message[];
};

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function autoTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'New conversation';
  return first.content.slice(0, 42) + (first.content.length > 42 ? '…' : '');
}

export async function saveConversation(conv: Conversation): Promise<void> {
  await AsyncStorage.setItem(CONV_PREFIX + conv.id, JSON.stringify(conv));
  const index = await listConversations();
  const modeTrail = conv.messages
    .filter(m => m.role === 'assistant' && (m as any).mode)
    .map(m => (m as any).mode as string)
    .slice(-24);
  const meta: ConversationMeta = {
    id: conv.id, title: conv.title, persona: conv.persona,
    model: conv.model, createdAt: conv.createdAt,
    updatedAt: conv.updatedAt, messageCount: conv.messages.length,
    auraComposite: conv.auraComposite,
    modeTrail: modeTrail.length > 0 ? modeTrail : undefined,
    pinned: conv.pinned, locked: conv.locked,
  };
  const rest = index.filter(c => c.id !== conv.id);
  const updated = [meta, ...rest].slice(0, 51); // 50 + welcome thread
  await AsyncStorage.setItem(CONV_INDEX_KEY, JSON.stringify(updated));
}

export async function loadConversation(id: string): Promise<Conversation | null> {
  const raw = await AsyncStorage.getItem(CONV_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export async function listConversations(): Promise<ConversationMeta[]> {
  const raw = await AsyncStorage.getItem(CONV_INDEX_KEY);
  if (!raw) return [];
  const all: ConversationMeta[] = JSON.parse(raw);
  // Pinned always first
  return [
    ...all.filter(c => c.pinned),
    ...all.filter(c => !c.pinned),
  ];
}

export async function deleteConversation(id: string): Promise<void> {
  const index = await listConversations();
  await AsyncStorage.removeItem(CONV_PREFIX + id);
  await AsyncStorage.setItem(CONV_INDEX_KEY, JSON.stringify(index.filter(c => c.id !== id)));
}

export async function renameConversation(id: string, newTitle: string): Promise<void> {
  if (id === WELCOME_THREAD_ID) return; // welcome thread title is fixed
  const index = await listConversations();
  const updated = index.map(c => c.id === id ? { ...c, title: newTitle.trim() || c.title } : c);
  await AsyncStorage.setItem(CONV_INDEX_KEY, JSON.stringify(updated));
  // Also update the stored conversation
  const conv = await loadConversation(id);
  if (conv) {
    conv.title = newTitle.trim() || conv.title;
    await AsyncStorage.setItem(CONV_PREFIX + id, JSON.stringify(conv));
  }
}

export function createNewConversation(persona: string, model: string): Conversation {
  const id = genId();
  return {
    id, title: 'New conversation', persona, model,
    createdAt: Date.now(), updatedAt: Date.now(),
    messageCount: 0, messages: [],
  };
}

export function createWelcomeConversation(): Conversation {
  return {
    id: WELCOME_THREAD_ID,
    title: '⊚ Welcome — Meet Your Guides',
    persona: 'sol',
    model: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messageCount: 0,
    messages: [],
    pinned: true,
    locked: true,
  };
}
