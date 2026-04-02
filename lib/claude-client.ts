const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type ClaudeModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' | 'claude-opus-4-6';

export async function sendMessage(
  messages: Message[],
  systemPrompt: string,
  apiKey: string,
  model: ClaudeModel = 'claude-haiku-4-5-20251001',
  onChunk?: (text: string) => void
): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as any)?.error?.message || `API error ${response.status}`);
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta' && data.delta?.text) {
            fullText += data.delta.text;
            onChunk(data.delta.text);
          }
        } catch {}
      }
    }
    return fullText;
  }

  const data = await response.json();
  return data.content[0].text;
}
