// Multi-provider AI client — unified interface
// Backed by provider registry: Gemini, Anthropic, OpenAI, DeepSeek, Kimi
import type { ToolDefinition, ToolCall, ToolResult } from './tools/definitions';
export type { ToolDefinition, ToolCall, ToolResult } from './tools/definitions';

export type MessageImage = {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type ResponseTimings = {
  timeToFirstToken: number; // ms
  totalTime: number;        // ms
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: MessageImage;
  tokenUsage?: TokenUsage;
  timings?: ResponseTimings;
  model?: string; // which model produced this message
};

export type Provider = 'gemini' | 'anthropic' | 'openai' | 'deepseek' | 'kimi' | 'nvidia';
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro' | 'gemini-3.1-flash-lite-preview';
export type AnthropicModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' | 'claude-opus-4-6' | 'claude-opus-4-8' | 'claude-fable-5';
export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4.1-mini' | 'gpt-4.1-nano';
export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';
export type KimiModel = 'moonshot-v1-8k' | 'moonshot-v1-32k';
export type NvidiaModel =
  | 'meta/llama-3.1-8b-instruct' | 'openai/gpt-oss-20b' | 'stepfun-ai/step-3.7-flash'
  | 'google/gemma-3n-e2b-it' | 'moonshotai/kimi-k2.6'
  | 'meta/llama-3.3-70b-instruct' | 'google/gemma-4-31b-it' | 'nvidia/llama-3.3-nemotron-super-49b-v1'
  | 'minimaxai/minimax-m2.7' | 'bytedance/seed-oss-36b-instruct'
  | 'mistralai/mistral-medium-3.5-128b' | 'mistralai/mistral-small-4-119b-2603'
  | 'qwen/qwen3.5-122b-a10b' | 'openai/gpt-oss-120b' | 'deepseek-ai/deepseek-v4-flash'
  | 'meta/llama-4-maverick-17b-128e-instruct' | 'qwen/qwen3-next-80b-a3b-instruct'
  | 'meta/llama-3.2-90b-vision-instruct' | 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1' | 'qwen/qwen3.5-397b-a17b'
  | 'nvidia/nemotron-3-super-120b-a12b' | 'nvidia/nemotron-3-ultra-550b-a55b' | 'mistralai/mistral-large-3-675b-instruct-2512';
export type AIModel = GeminiModel | AnthropicModel | OpenAIModel | DeepSeekModel | KimiModel | NvidiaModel;

export function getProviderFromModel(model: AIModel): Provider {
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gpt') || model.startsWith('o1')) return 'openai';
  if (model.startsWith('deepseek-chat') || model.startsWith('deepseek-reasoner')) return 'deepseek';
  if (model.startsWith('moonshot')) return 'kimi';
  // All NVIDIA NIM models — identified by org/ prefix pattern
  if (model.includes('/')) return 'nvidia';
  return 'gemini';
}

export type SendResult = {
  text: string;
  tokenUsage?: TokenUsage;
  timings?: ResponseTimings;
};

export async function sendMessage(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: AIModel,
  onChunk?: (text: string) => void,
  streamSpeed: 'fast' | 'normal' | 'slow' = 'normal',
  tokenBudget: number = 4096,
  temperature: number = 0.9,
): Promise<SendResult> {
  if (!apiKey || !apiKey.trim()) throw new Error('No API key provided');
  if (!model) throw new Error('No model selected');

  const { getProviderForModel } = await import('./providers/registry');
  const provider = getProviderForModel(model);

  let capturedUsage: TokenUsage | undefined;
  let capturedTimings: ResponseTimings | undefined;

  const text = await provider.send(
    messages,
    systemPrompt,
    apiKey.trim(),
    model,
    onChunk,
    streamSpeed,
    (usage, timings) => {
      capturedUsage = usage;
      capturedTimings = timings;
    },
    tokenBudget,
    temperature,
  );

  return { text, tokenUsage: capturedUsage, timings: capturedTimings };
}

// Free tier proxy — routes through Cloudflare Worker when no API key is set
const FREE_TIER_PROXY = 'https://sol-main-proxy.banduabusiness.workers.dev/';

export async function sendViaFreeTier(
  messages: Message[],
  systemPrompt: string,
  deviceId: string,
): Promise<{ text: string; limitReached: boolean; remaining: number }> {
  const payload = {
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.9,
    max_tokens: 2000,
  };

  const response = await fetch(FREE_TIER_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-ID': deviceId,
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 429) {
    return { text: '', limitReached: true, remaining: 0 };
  }

  if (!response.ok) {
    throw new Error(`Proxy error ${response.status}`);
  }

  const remaining = parseInt(response.headers.get('X-Messages-Remaining') ?? '0');
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return { text, limitReached: false, remaining };
}

// sendWithTools — uses native tool calling for Anthropic/OpenAI, falls back to sendMessage for others
export async function sendWithTools(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: AIModel,
  tools: ToolDefinition[],
  executeTools: (calls: ToolCall[]) => Promise<ToolResult[]>,
  onToolStart?: (toolName: string) => void,
  tokenBudget: number = 4096,
  temperature: number = 0.9,
): Promise<SendResult> {
  if (!apiKey?.trim()) throw new Error('No API key provided');

  const { getProviderForModel } = await import('./providers/registry');
  const provider = getProviderForModel(model);

  if (!provider.sendWithTools) {
    // Provider doesn't support tool calling — fall back to regular send
    return sendMessage(messages, systemPrompt, apiKey, model, undefined, 'normal', tokenBudget, temperature);
  }

  let capturedUsage: TokenUsage | undefined;
  let capturedTimings: ResponseTimings | undefined;

  const text = await provider.sendWithTools(
    messages, systemPrompt, apiKey, model, tools, executeTools, onToolStart,
    (usage, timings) => { capturedUsage = usage; capturedTimings = timings; },
    tokenBudget, temperature,
  );

  return { text, tokenUsage: capturedUsage, timings: capturedTimings };
}

// solSpeak — maps any API/network error to a Sol-voiced string
// Use this everywhere instead of raw error messages
export function solSpeak(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  const low = msg.toLowerCase();

  if (low.includes('401') || low.includes('unauthorized') || low.includes('invalid api key') || low.includes('invalid_api_key') || low.includes('api key')) {
    return "My key to that door has expired. Check your API key in Settings.";
  }
  if (low.includes('429') || low.includes('rate limit') || low.includes('too many requests') || low.includes('quota')) {
    return "That mind is busy right now. Give it a breath, or try a different provider.";
  }
  if (low.includes('no api key') || low.includes('no key')) {
    return "I need a key to speak. Add one in Settings — Gemini is free to start.";
  }
  if (low.includes('json') || low.includes('parse') || low.includes('unexpected token') || low.includes('malformed')) {
    return "I lost the thread mid-sentence. Ask me again.";
  }
  if (low.includes('network') || low.includes('fetch') || low.includes('offline') || low.includes('connection') || low.includes('timeout') || low.includes('econnrefused')) {
    return "The path is dark right now — no connection. Come back when the signal returns.";
  }
  if (low.includes('proxy') || low.includes('workers.dev') || low.includes('502') || low.includes('503') || low.includes('504')) {
    return "The free gateway is resting. Try again in a moment, or add your own key in Settings.";
  }
  if (low.includes('context') || low.includes('token') || low.includes('max_tokens') || low.includes('too long')) {
    return "This thread has grown long. Start a new conversation and I'll carry what matters forward.";
  }
  if (low.includes('403') || low.includes('forbidden') || low.includes('access denied')) {
    return "That door is closed to this key. Check your account or try a different provider.";
  }
  return "Something went quiet between us. Try again — I'm here.";
}
