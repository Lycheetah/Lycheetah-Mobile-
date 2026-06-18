import { AIProvider } from './types';
import { GeminiProvider } from './gemini';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { DeepSeekProvider } from './deepseek';
import { KimiProvider } from './kimi';
import { NvidiaProvider } from './nvidia';

export const PROVIDERS: AIProvider[] = [
  NvidiaProvider,  // Free — 43+ models, no cost
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
  if (modelId === 'deepseek-chat' || modelId === 'deepseek-reasoner') return DeepSeekProvider;
  if (modelId === 'moonshot-v1-8k' || modelId === 'moonshot-v1-32k') return KimiProvider;
  if (
    modelId.startsWith('meta/') ||
    modelId.startsWith('nvidia/') ||
    modelId.startsWith('mistralai/') ||
    modelId.startsWith('microsoft/') ||
    modelId.startsWith('google/') ||
    modelId.startsWith('minimaxai/') ||
    modelId.startsWith('bytedance/') ||
    modelId.startsWith('sarvamai/') ||
    modelId.startsWith('abacusai/') ||
    modelId.startsWith('stepfun-ai/') ||
    modelId.startsWith('qwen/') ||
    modelId.startsWith('openai/') ||
    modelId.startsWith('deepseek-ai/') ||
    modelId.startsWith('moonshotai/')
  ) return NvidiaProvider;
  return GeminiProvider;
}
