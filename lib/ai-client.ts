// Multi-provider AI client
// Free tier: Google Gemini (AI Studio)
// Paid tier: Anthropic Claude

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type Provider = 'gemini' | 'anthropic';
export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-3.1-flash-lite-preview';
export type AnthropicModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' | 'claude-opus-4-6';
export type AIModel = GeminiModel | AnthropicModel;

export function getProviderFromModel(model: AIModel): Provider {
  return model.startsWith('gemini') ? 'gemini' : 'anthropic';
}

// ─── GEMINI ───────────────────────────────────────────────────────────────────

async function sendGemini(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: GeminiModel,
  onChunk?: (text: string) => void,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Convert messages — Gemini uses 'model' not 'assistant'
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.9 },
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    const msg = json?.error?.message || `Gemini error ${res.status}`;
    throw new Error(msg);
  }

  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini returned empty response');

  // Simulate streaming word by word
  if (onChunk) {
    const words = text.split(' ');
    for (const word of words) {
      onChunk(word + ' ');
      await new Promise(r => setTimeout(r, 18));
    }
  }

  return text;
}

// ─── ANTHROPIC ────────────────────────────────────────────────────────────────

async function sendAnthropic(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: AnthropicModel,
  onChunk?: (text: string) => void,
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: !!onChunk,
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
}

// ─── UNIFIED ─────────────────────────────────────────────────────────────────

export async function sendMessage(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: AIModel,
  onChunk?: (text: string) => void,
): Promise<string> {
  if (!apiKey || !apiKey.trim()) throw new Error('No API key provided');
  if (!model) throw new Error('No model selected');

  if (model.startsWith('gemini')) {
    return sendGemini(messages, systemPrompt, apiKey.trim(), model as GeminiModel, onChunk);
  }
  return sendAnthropic(messages, systemPrompt, apiKey.trim(), model as AnthropicModel, onChunk);
}
