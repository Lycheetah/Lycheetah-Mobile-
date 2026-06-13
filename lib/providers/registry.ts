import { AIProvider } from './types';
import { GeminiProvider } from './gemini';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { DeepSeekProvider } from './deepseek';
import { KimiProvider } from './kimi';
import { NvidiaProvider } from './nvidia';

export const PROVIDERS: AIProvider[] = [
  NvidiaProvider,  // Free — 13 models, no cost
  GeminiProvider,
  AnthropicProvider,
  OpenAIProvider,
  DeepSeekProvider,
  KimiProvider,
];

export const PROVIDER_MAP: Record<string, AIProvider> = Object.fromEntries(
  PROVIDERS.map(p => [p.id, p])
);

export function getProviderForModel(modelId: string): AIProvider {
  for (const provider of PROVIDERS) {
    if (provider.models.some(m => m.id === modelId)) return provider;
  }
  // Fallback: detect by prefix
  if (modelId.startsWith('gemini')) return GeminiProvider;
  if (modelId.startsWith('claude')) return AnthropicProvider;
  if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) return OpenAIProvider;
  if (modelId.startsWith('deepseek') || modelId.startsWith('moonshot')) return DeepSeekProvider;
  if (modelId.startsWith('meta/') || modelId.startsWith('nvidia/') || modelId.startsWith('mistralai/') || modelId.startsWith('microsoft/')) return NvidiaProvider;
  return GeminiProvider;
}
