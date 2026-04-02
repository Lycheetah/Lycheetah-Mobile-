import { Message } from '../ai-client';
import { AIProvider } from './types';

export const AnthropicProvider: AIProvider = {
  id: 'anthropic',
  label: 'Anthropic',
  color: '#F5A623',
  keyPlaceholder: 'sk-ant-...',
  keyHint: 'console.anthropic.com',
  models: [
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku',  tier: 'paid', note: 'PAID · Fastest Claude · ~$0.003/msg' },
    { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet', tier: 'paid', note: 'PAID · Balanced · Recommended' },
    { id: 'claude-opus-4-6',           label: 'Claude Opus',   tier: 'paid', note: 'PAID · Deepest · Most capable' },
  ],
  async send(messages, systemPrompt, apiKey, model, onChunk, _streamSpeed = 'normal') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model, max_tokens: 2048, system: systemPrompt, stream: !!onChunk,
        messages: messages.map(m => ({
          role: m.role,
          content: m.image
            ? [
                { type: 'image', source: { type: 'base64', media_type: m.image.mimeType, data: m.image.base64 } },
                { type: 'text', text: m.content },
              ]
            : m.content,
        })),
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as any)?.error?.message || `Anthropic error ${res.status}`);
    }

    if (onChunk && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              full += data.delta.text;
              onChunk(data.delta.text);
            }
          } catch {}
        }
      }
      return full;
    }

    const json = await res.json();
    return json.content[0].text;
  },
};
