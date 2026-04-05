// Web Search tool — uses Brave Search API
// User provides API key in settings. Free tier: 2000 queries/month.

export type SearchResult = {
  title: string;
  url: string;
  description: string;
};

export type SearchResponse =
  | { ok: true; query: string; results: SearchResult[] }
  | { ok: false; query: string; error: string };

export async function webSearch(query: string, apiKey: string): Promise<SearchResponse> {
  if (!apiKey?.trim()) {
    return { ok: false, query, error: 'No Brave Search API key. Add it in Settings → Tool Keys.' };
  }

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&text_decorations=false&search_lang=en`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': apiKey.trim(),
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, query, error: `Brave API error ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = await res.json();
    const webResults: SearchResult[] = (data?.web?.results || []).slice(0, 5).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || r.extra_snippets?.[0] || '',
    }));

    return { ok: true, query, results: webResults };
  } catch (e: any) {
    return { ok: false, query, error: e?.message || 'Network error' };
  }
}

// Format search results as context block
export function formatSearchResults(response: SearchResponse): string {
  if (!response.ok) return `[Search error: ${response.error}]`;
  if (response.results.length === 0) return `[No results found for: "${response.query}"]`;

  const lines = [`[Web search: "${response.query}" — ${response.results.length} results]`];
  response.results.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.title}`);
    if (r.description) lines.push(`   ${r.description}`);
    lines.push(`   ${r.url}`);
  });
  return lines.join('\n');
}

// Detect search intent
export function detectSearchIntent(message: string): string | null {
  // Explicit /search prefix
  const explicit = message.match(/^\/search\s+(.+)/i);
  if (explicit) return explicit[1];

  // "search for X" / "look up X" / "google X" / "find X online"
  const searchMatch = message.match(/^(?:search (?:for|the web for)?|look up|google|find online|search online for)\s+(.+)/i);
  if (searchMatch) return searchMatch[1].trim();

  return null;
}
