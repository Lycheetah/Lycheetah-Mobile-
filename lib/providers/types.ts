import { Message } from '../ai-client';
import type { ToolDefinition, ToolCall, ToolResult } from '../tools/definitions';

export type ProviderTier = 'free' | 'paid' | 'freemium';

export type ModelOption = {
  id: string;
  label: string;
  tier: ProviderTier;
  note: string;
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

export interface AIProvider {
  id: string;
  label: string;
  color: string;
  keyPlaceholder: string;
  keyHint: string;
  models: ModelOption[];
  send(
    messages: Message[],
    systemPrompt: string,
    apiKey: string,
    model: string,
    onChunk?: (text: string) => void,
    streamSpeed?: 'fast' | 'normal' | 'slow',
    onUsage?: (usage: TokenUsage, timings: ResponseTimings) => void,
    tokenBudget?: number,
    temperature?: number,
  ): Promise<string>;
  // Native tool calling — Anthropic + OpenAI only
  sendWithTools?(
    messages: Message[],
    systemPrompt: string,
    apiKey: string,
    model: string,
    tools: ToolDefinition[],
    executeTools: (calls: ToolCall[]) => Promise<ToolResult[]>,
    onToolStart?: (toolName: string) => void,
    onUsage?: (usage: TokenUsage, timings: ResponseTimings) => void,
    tokenBudget?: number,
    temperature?: number,
  ): Promise<string>;
}
