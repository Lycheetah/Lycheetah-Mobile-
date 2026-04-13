// Tool executor — runs tool calls, returns results for the model

import { ToolCall, ToolResult } from './definitions';
import { calculate } from './calculator';
import { webSearch, formatSearchResults } from './web-search';
import { readURL } from './url-reader';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple in-session cache — avoids repeat API hits for same query
const SESSION_CACHE = new Map<string, string>();

async function cachedFetch(cacheKey: string, fetcher: () => Promise<string>): Promise<string> {
  if (SESSION_CACHE.has(cacheKey)) return SESSION_CACHE.get(cacheKey)!;
  const result = await fetcher();
  SESSION_CACHE.set(cacheKey, result);
  return result;
}

export type ExecutorContext = {
  braveKey?: string;
  userName?: string;
  appMode?: string;
  persona?: string;
  streak?: number;
  fieldStage?: string;
};

async function logToolCall(name: string, query: string, displayText: string) {
  try {
    const key = 'sol_tool_history';
    const existing = await AsyncStorage.getItem(key);
    const history: Array<{ tool: string; query: string; result: string; timestamp: string }> = existing ? JSON.parse(existing) : [];
    history.unshift({ tool: name, query, result: displayText, timestamp: new Date().toISOString() });
    await AsyncStorage.setItem(key, JSON.stringify(history.slice(0, 100)));
  } catch {}
}

export async function executeTool(call: ToolCall, ctx: ExecutorContext): Promise<ToolResult> {
  const { id, name, input } = call;

  switch (name) {

    case 'calculate': {
      const r = calculate(input.expression || '');
      if (r.ok) {
        return { id, result: `${input.expression} = ${r.result}`, displayText: `${input.expression} = ${r.result}` };
      }
      return { id, result: `Calculation error: ${r.error}`, displayText: `Calculation error` };
    }

    case 'web_search': {
      const r = await webSearch(input.query || '', ctx.braveKey || '');
      return { id, result: formatSearchResults(r), displayText: `"${input.query}"` };
    }

    case 'read_url': {
      const r = await readURL(input.url || '');
      if (r.ok) {
        return {
          id,
          result: `[${r.title || input.url}]\n${r.content.slice(0, 4000)}`,
          displayText: r.title || input.url,
        };
      }
      return { id, result: `Failed to read URL: ${r.error}`, displayText: `URL read failed` };
    }

    case 'save_insight': {
      try {
        const key = 'sanctum_vault';
        const existing = await AsyncStorage.getItem(key);
        const vault: Array<{ id: string; text: string; date: string }> = existing ? JSON.parse(existing) : [];
        const entry = {
          id: Date.now().toString(),
          text: `${input.title}: ${input.content}`,
          date: new Date().toLocaleDateString('en-NZ'),
        };
        const updated = [entry, ...vault].slice(0, 50);
        await AsyncStorage.setItem(key, JSON.stringify(updated));
        return { id, result: `Insight saved to Sanctum Vault: "${input.title}"`, displayText: `"${input.title}"` };
      } catch (e: any) {
        return { id, result: `Failed to save: ${e?.message}`, displayText: `Save failed` };
      }
    }

    case 'get_datetime': {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const lines = [
        `Date: ${now.toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        `Time: ${now.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}`,
        `Day: ${days[now.getDay()]}`,
      ];
      if (ctx.userName) lines.push(`User: ${ctx.userName}`);
      if (ctx.appMode) lines.push(`App mode: ${ctx.appMode}`);
      if (ctx.persona) lines.push(`Persona: ${ctx.persona}`);
      if (ctx.streak) lines.push(`Study streak: ${ctx.streak} days`);
      if (ctx.fieldStage) lines.push(`Field stage: ${ctx.fieldStage}`);
      return { id, result: lines.join('\n'), displayText: days[now.getDay()] };
    }

    case 'search_subjects': {
      try {
        const { MYSTERY_SCHOOL_DOMAINS } = await import('../mystery-school/subjects');
        const kw = (input.keyword || '').toLowerCase();
        const matches: string[] = [];
        for (const domain of MYSTERY_SCHOOL_DOMAINS) {
          for (const subject of domain.subjects) {
            const inName = subject.name.toLowerCase().includes(kw);
            const inDesc = subject.description.toLowerCase().includes(kw);
            if (inName || inDesc) {
              matches.push(`[${domain.label} · ${subject.layer}] ${subject.name}: ${subject.description.slice(0, 120)}`);
            }
          }
        }
        if (matches.length === 0) {
          return { id, result: `No subjects found for "${input.keyword}"`, displayText: `No results for "${input.keyword}"` };
        }
        return {
          id,
          result: `Found ${matches.length} subject(s) for "${input.keyword}":\n${matches.slice(0, 10).join('\n')}`,
          displayText: `${matches.length} subject${matches.length !== 1 ? 's' : ''} found`,
        };
      } catch (e: any) {
        return { id, result: `Subject search error: ${e?.message}`, displayText: `Search error` };
      }
    }

    case 'wikipedia_search': {
      try {
        const cacheKey = `wiki:${(input.query || '').toLowerCase().trim()}`;
        const result = await cachedFetch(cacheKey, async () => {
          const query = encodeURIComponent(input.query || '');
          const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=true&explaintext=true&redirects=1&titles=${query}&origin=*`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (!res.ok) return `__ERROR__Wikipedia error ${res.status}`;
          const data = await res.json();
          const pages = data?.query?.pages ?? {};
          const page = Object.values(pages)[0] as any;
          if (!page || page.missing === '' || page.pageid === undefined) return `__EMPTY__`;
          const title: string = page.title || input.query;
          const extract: string = (page.extract || '').trim();
          if (!extract) return `__EMPTY__`;
          const summary = extract.length > 1500 ? extract.slice(0, 1500) + '…' : extract;
          return `[Wikipedia: ${title}]\n${summary}`;
        });
        if (result.startsWith('__ERROR__')) return { id, result: result.slice(9), displayText: 'Wikipedia error' };
        if (result.startsWith('__EMPTY__')) return { id, result: `No Wikipedia article found for "${input.query}"`, displayText: 'No article found' };
        const title = result.split('\n')[0].replace('[Wikipedia: ', '').replace(']', '');
        logToolCall('wikipedia_search', input.query, title);
        return { id, result, displayText: title };
      } catch (e: any) {
        return { id, result: `Wikipedia lookup failed: ${e?.message}`, displayText: 'Wikipedia error' };
      }
    }

    case 'duckduckgo_instant': {
      try {
        const cacheKey = `ddg:${(input.query || '').toLowerCase().trim()}`;
        const result = await cachedFetch(cacheKey, async () => {
          const query = encodeURIComponent(input.query || '');
          const url = `https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1&skip_disambig=0`;
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (!res.ok) return `__ERROR__DDG error ${res.status}`;
          const data = await res.json();
          const lines: string[] = [];
          if (data.Heading) lines.push(`Topic: ${data.Heading}`);
          if (data.AbstractText) lines.push(data.AbstractText);
          if (data.Answer) lines.push(`Answer: ${data.Answer}`);
          if (data.Definition) lines.push(`Definition: ${data.Definition}`);
          if (!data.AbstractText && data.RelatedTopics?.length > 0) {
            const topics = (data.RelatedTopics as any[])
              .filter(t => t.Text).slice(0, 4).map(t => `• ${t.Text}`);
            if (topics.length > 0) lines.push(`Related:\n${topics.join('\n')}`);
          }
          if (lines.length === 0) return `__EMPTY__`;
          return `[DuckDuckGo: ${input.query}]\n${lines.join('\n')}`;
        });
        if (result.startsWith('__ERROR__')) return { id, result: result.slice(9), displayText: 'DDG error' };
        if (result.startsWith('__EMPTY__')) return { id, result: `No instant answer for "${input.query}"`, displayText: 'No instant answer' };
        const heading = result.split('\n').find(l => l.startsWith('Topic:'))?.replace('Topic: ', '') || input.query;
        logToolCall('duckduckgo_instant', input.query, heading);
        return { id, result, displayText: heading };
      } catch (e: any) {
        return { id, result: `DuckDuckGo lookup failed: ${e?.message}`, displayText: 'DDG error' };
      }
    }

    default:
      return { id, result: `Unknown tool: ${name}`, displayText: `Unknown tool` };
  }
}
