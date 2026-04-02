import { Message } from '../ai-client';
import { AIProvider } from './types';

export const DeepSeekProvider: AIProvider = {
  id: 'deepseek',
  label: 'DeepSeek',
  color: '#7B68EE',
  keyPlaceholder: 'sk-...',
  keyHint: 'Free credits on signup · platform.deepseek.com',
  models: [
    { id: 'deepseek-chat',     label: 'DeepSeek Chat',     tier: 'freemium', note: 'FREE CREDITS · Fast · Best value' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', tier: 'freemium', note: 'FREE CREDITS · R1 · Deep reasoning' },
  ],
  async send(messages, systemPrompt, apiKey, model, onChunk, _streamSpeed = 'normal') {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
      throw new Error((json as any)?.error?.message || `DeepSeek error ${res.status}`);
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
