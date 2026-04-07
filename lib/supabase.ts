// Supabase REST API — no client library needed, avoids React Native bundler issues

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

export type SharedEntry = {
  id?: string;
  title: string;
  dominant_layer: string;
  truth_pressure: number;
  coherence: number;
  axiom_score: number;
  foundation_score: number;
  theory_score: number;
  edge_score: number;
  chaos_score: number;
  word_count: number;
  summary: string;
  created_at?: string;
};

export async function shareEntry(entry: SharedEntry): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/shared_entries`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: text };
    }
    return { error: null };
  } catch (e: any) {
    return { error: e?.message ?? 'Network error' };
  }
}

export type CementExpression = {
  id?: string;
  name: string;
  english: string;
  expression: string;
  reads_as: string;
  created_at?: string;
};

export async function shareCementBlock(block: CementExpression): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cement_expressions`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(block),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: text };
    }
    return { error: null };
  } catch (e: any) {
    return { error: e?.message ?? 'Network error' };
  }
}

export async function fetchSharedFeed(limit = 50): Promise<{ data: SharedEntry[]; error: string | null }> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/shared_entries?order=created_at.desc&limit=${limit}`,
      { headers: { ...HEADERS, 'Prefer': 'return=representation' } },
    );
    if (!res.ok) {
      const text = await res.text();
      return { data: [], error: text };
    }
    const data = await res.json();
    return { data: data as SharedEntry[], error: null };
  } catch (e: any) {
    return { data: [], error: e?.message ?? 'Network error' };
  }
}
