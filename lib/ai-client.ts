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

export type Provider = 'gemini' | 'anthropic' | 'openai' | 'deepseek' | 'kimi';
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-3.1-flash-lite-preview';
export type AnthropicModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' | 'claude-opus-4-6';
export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4.1-mini' | 'gpt-4.1-nano';
export type DeepSeekModel = 'deepseek-chat' | 'deepseek-reasoner';
export type KimiModel = 'moonshot-v1-8k' | 'moonshot-v1-32k';
export type AIModel = GeminiModel | AnthropicModel | OpenAIModel | DeepSeekModel | KimiModel;

export function getProviderFromModel(model: AIModel): Provider {
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('claude')) return 'anthropic';
  if (model.startsWith('gpt') || model.startsWith('o1')) return 'openai';
  if (model.startsWith('deepseek')) return 'deepseek';
  if (model.startsWith('moonshot')) return 'kimi';
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
    return sendMessage(messages, systemPrompt, apiKey, model, undefined, 'normal', undefined, tokenBudget, temperature);
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
