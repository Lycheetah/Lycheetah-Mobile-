// URL Reader tool — fetches a URL and extracts readable text content

export type URLResult =
  | { ok: true; url: string; title: string; content: string; wordCount: number }
  | { ok: false; url: string; error: string };

// Strip HTML tags and clean up whitespace
function extractText(html: string): { title: string; content: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  // Remove script, style, nav, footer, header, aside blocks entirely
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  // Replace block elements with newlines
  cleaned = cleaned
    .replace(/<\/?(p|div|h[1-6]|li|br|tr|blockquote)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')  // strip remaining tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, ' ');

  // Collapse whitespace
  const content = cleaned
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0)
    .join('\n')
    .slice(0, 8000); // cap at 8k chars

  return { title, content };
}

export async function readURL(url: string): Promise<URLResult> {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LycheetahReader/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!res.ok) {
      return { ok: false, url, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return { ok: false, url, error: `Cannot read content type: ${contentType}` };
    }

    const html = await res.text();
    const { title, content } = extractText(html);
    const wordCount = content.split(/\s+/).length;

    return { ok: true, url, title, content, wordCount };
  } catch (e: any) {
    return { ok: false, url, error: e?.message || 'Network error' };
  }
}

// Detect URL in message
export function detectURLIntent(message: string): string | null {
  // Explicit /read prefix
  const explicit = message.match(/^\/read\s+(https?:\/\/[^\s]+)/i);
  if (explicit) return explicit[1];

  // "read [url]" / "summarise [url]" / "what does [url] say"
  const readMatch = message.match(/(?:read|fetch|summarize|summarise|what(?:'s| is) (?:at|on))\s+(https?:\/\/[^\s]+)/i);
  if (readMatch) return readMatch[1];

  return null;
}
