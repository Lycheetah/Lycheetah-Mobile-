import { Message } from '../ai-client';
import { AIProvider, TokenUsage, ResponseTimings } from './types';

export const GeminiProvider: AIProvider = {
  id: 'gemini',
  label: 'Gemini',
  color: '#4A9EFF',
  keyPlaceholder: 'AIza...',
  keyHint: 'Free at aistudio.google.com/apikey',
  models: [
    { id: 'gemini-2.5-flash',              label: 'Gemini 2.5 Flash',      tier: 'free', note: 'FREE · Recommended · Start here' },
    { id: 'gemini-2.5-flash-lite',         label: 'Gemini 2.5 Flash Lite', tier: 'free', note: 'FREE · Fastest · High volume' },
    { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite', tier: 'free', note: 'FREE · Preview · Newest' },
  ],
  async send(messages, systemPrompt, apiKey, model, onChunk, streamSpeed = 'normal', onUsage, tokenBudget = 8192, temperature = 0.9) {
    const startTime = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const contents = messages.map(m => {
      const parts: any[] = [];
      if (m.image) {
        parts.push({ inlineData: { mimeType: m.image.mimeType, data: m.image.base64 } });
      }
      parts.push({ text: m.content });
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: tokenBudget, temperature },
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || `Gemini error ${res.status}`);

    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!text) throw new Error('Gemini returned empty response');

    // Capture token usage from usageMetadata
    if (onUsage && json.usageMetadata) {
      const inputTokens = json.usageMetadata.promptTokenCount || 0;
      const outputTokens = json.usageMetadata.candidatesTokenCount || 0;
      const totalTime = Date.now() - startTime;
      onUsage(
        { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
        { timeToFirstToken: totalTime, totalTime },
      );
    }

    if (onChunk) {
      const delay = streamSpeed === 'fast' ? 6 : streamSpeed === 'slow' ? 40 : 18;
      const words = text.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(r => setTimeout(r, delay));
      }
    }
    return text;
  },
};
