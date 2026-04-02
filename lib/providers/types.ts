import { Message } from '../ai-client';

export type ProviderTier = 'free' | 'paid' | 'freemium';

export type ModelOption = {
  id: string;
  label: string;
  tier: ProviderTier;
  note: string;
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
  ): Promise<string>;
}
