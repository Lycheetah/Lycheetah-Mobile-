import { Message } from '../ai-client';
import { AIProvider, TokenUsage, ResponseTimings } from './types';

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
  async send(messages, systemPrompt, apiKey, model, onChunk, _streamSpeed = 'normal', onUsage, tokenBudget = 8192, temperature = 0.9) {
    const startTime = Date.now();
    let firstTokenTime: number | null = null;
    const maxTokens = Math.min(tokenBudget, 8192);

    const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
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
      let inputTokens = 0;
      let outputTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            const chunk = data.choices?.[0]?.delta?.content;
            if (chunk) {
              if (firstTokenTime === null) firstTokenTime = Date.now();
              full += chunk;
              onChunk(chunk);
            }
            if (data.usage) {
              inputTokens = data.usage.prompt_tokens || 0;
              outputTokens = data.usage.completion_tokens || 0;
            }
          } catch {}
        }
      }

      if (onUsage && (inputTokens || outputTokens)) {
        const totalTime = Date.now() - startTime;
        const ttft = firstTokenTime ? firstTokenTime - startTime : totalTime;
        onUsage(
          { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
          { timeToFirstToken: ttft, totalTime },
        );
      }
      return full;
    }

    const json = await res.json();
    if (onUsage && json.usage) {
      const totalTime = Date.now() - startTime;
      onUsage(
        {
          inputTokens: json.usage.prompt_tokens || 0,
          outputTokens: json.usage.completion_tokens || 0,
          totalTokens: json.usage.total_tokens || 0,
        },
        { timeToFirstToken: totalTime, totalTime },
      );
    }
    return json.choices[0].message.content;
  },
};
