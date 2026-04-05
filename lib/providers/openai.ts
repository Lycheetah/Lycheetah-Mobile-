import { Message } from '../ai-client';
import { AIProvider, TokenUsage, ResponseTimings } from './types';

export const OpenAIProvider: AIProvider = {
  id: 'openai',
  label: 'OpenAI',
  color: '#10A37F',
  keyPlaceholder: 'sk-...',
  keyHint: 'platform.openai.com/api-keys',
  models: [
    { id: 'gpt-4o',       label: 'GPT-4o',       tier: 'paid', note: 'PAID · Flagship · Best reasoning' },
    { id: 'gpt-4o-mini',  label: 'GPT-4o Mini',  tier: 'paid', note: 'PAID · Fast · Great value' },
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', tier: 'paid', note: 'PAID · Latest mini · Recommended' },
    { id: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', tier: 'paid', note: 'PAID · Lightest · High speed' },
  ],
  async send(messages, systemPrompt, apiKey, model, onChunk, _streamSpeed = 'normal', onUsage, tokenBudget = 8192, temperature = 0.9) {
    const startTime = Date.now();
    let firstTokenTime: number | null = null;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: tokenBudget,
        temperature,
        stream: !!onChunk,
        stream_options: onChunk ? { include_usage: true } : undefined,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role,
            content: m.image
              ? [
                  { type: 'image_url', image_url: { url: `data:${m.image.mimeType};base64,${m.image.base64}` } },
                  { type: 'text', text: m.content },
                ]
              : m.content,
          })),
        ],
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error((json as any)?.error?.message || `OpenAI error ${res.status}`);
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
            // Usage comes in the final chunk with stream_options
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
