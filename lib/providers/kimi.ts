import { Message } from '../ai-client';
import { AIProvider } from './types';

export const KimiProvider: AIProvider = {
  id: 'kimi',
  label: 'Kimi',
  color: '#00C9A7',
  keyPlaceholder: 'sk-...',
  keyHint: 'platform.moonshot.cn',
  models: [
    { id: 'moonshot-v1-8k',  label: 'Kimi 8K',  tier: 'paid', note: 'PAID · Fast · Short context' },
    { id: 'moonshot-v1-32k', label: 'Kimi 32K', tier: 'paid', note: 'PAID · Long context · Recommended' },
  ],
  async send(messages, systemPrompt, apiKey, model, onChunk, _streamSpeed = 'normal') {
    const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        stream: !!onChunk,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as any)?.error?.message || `Kimi error ${res.status}`);
    }

    if (onChunk && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            const chunk = data.choices?.[0]?.delta?.content;
            if (chunk) { full += chunk; onChunk(chunk); }
          } catch {}
        }
      }
      return full;
    }

    const json = await res.json();
    return json.choices[0].message.content;
  },
};
