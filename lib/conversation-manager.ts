import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './ai-client';

const CONV_INDEX_KEY = 'lycheetah_conv_index';
const CONV_PREFIX = 'lycheetah_conv_';

export type ConversationMeta = {
  id: string;
  title: string;
  persona: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  auraComposite?: number;
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
  // Update index
  const index = await listConversations();
  const meta: ConversationMeta = {
    id: conv.id, title: conv.title, persona: conv.persona,
    model: conv.model, createdAt: conv.createdAt,
    updatedAt: conv.updatedAt, messageCount: conv.messages.length,
    auraComposite: conv.auraComposite,
  };
  const updated = [meta, ...index.filter(c => c.id !== conv.id)].slice(0, 50); // max 50
  await AsyncStorage.setItem(CONV_INDEX_KEY, JSON.stringify(updated));
}

export async function loadConversation(id: string): Promise<Conversation | null> {
  const raw = await AsyncStorage.getItem(CONV_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export async function listConversations(): Promise<ConversationMeta[]> {
  const raw = await AsyncStorage.getItem(CONV_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function deleteConversation(id: string): Promise<void> {
  await AsyncStorage.removeItem(CONV_PREFIX + id);
  const index = await listConversations();
  await AsyncStorage.setItem(CONV_INDEX_KEY, JSON.stringify(index.filter(c => c.id !== id)));
}

export function createNewConversation(persona: string, model: string): Conversation {
  const id = genId();
  return {
    id, title: 'New conversation', persona, model,
    createdAt: Date.now(), updatedAt: Date.now(),
    messageCount: 0, messages: [],
  };
}
