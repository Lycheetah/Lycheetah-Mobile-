import AsyncStorage from '@react-native-async-storage/async-storage';

export type VaultKind =
  | 'memory'
  | 'insight'
  | 'scriptorium'
  | 'intention'
  | 'paradox'
  | 'subject'
  | 'chronicle';

export interface VaultEntry {
  id: string;
  kind: VaultKind;
  title?: string;
  body: string;
  meta?: Record<string, string>;
  createdAt: number;
}

const VAULT_KEY = 'sol_vault_v1';
const MIGRATED_KEY = 'sol_vault_migrated_v1';

export async function readVault(): Promise<VaultEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function writeVaultEntry(entry: VaultEntry): Promise<void> {
  try {
    const existing = await readVault();
    const without = existing.filter(e => e.id !== entry.id);
    await AsyncStorage.setItem(VAULT_KEY, JSON.stringify([entry, ...without].slice(0, 500)));
  } catch {}
}

export async function deleteVaultEntry(id: string): Promise<void> {
  try {
    const existing = await readVault();
    await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(existing.filter(e => e.id !== id)));
  } catch {}
}

export async function migrateToVault(): Promise<void> {
  try {
    const done = await AsyncStorage.getItem(MIGRATED_KEY);
    if (done) return;

    const entries: VaultEntry[] = [];

    // sol_memory_v1 → memory
    try {
      const raw = await AsyncStorage.getItem('sol_memory_v1');
      if (raw) {
        const mems: { id: string; text: string; date: string }[] = JSON.parse(raw);
        mems.forEach(m => entries.push({
          id: `mem_${m.id}`,
          kind: 'memory',
          body: m.text,
          createdAt: parseInt(m.id) || Date.now(),
        }));
      }
    } catch {}

    // sol_insights → insight
    try {
      const raw = await AsyncStorage.getItem('sol_insights');
      if (raw) {
        const ins: { id: string; text: string; date: string; persona: string }[] = JSON.parse(raw);
        ins.forEach(i => entries.push({
          id: `ins_${i.id}`,
          kind: 'insight',
          body: i.text,
          meta: { persona: i.persona, date: i.date },
          createdAt: parseInt(i.id) || Date.now(),
        }));
      }
    } catch {}

    // sol_scriptorium → scriptorium
    try {
      const raw = await AsyncStorage.getItem('sol_scriptorium');
      if (raw) {
        const sc: { id: string; title: string; body: string; createdAt: string }[] = JSON.parse(raw);
        sc.forEach(s => entries.push({
          id: `scr_${s.id}`,
          kind: 'scriptorium',
          title: s.title || 'Untitled',
          body: s.body,
          createdAt: new Date(s.createdAt).getTime() || Date.now(),
        }));
      }
    } catch {}

    // sol_school_intentions → intention
    try {
      const raw = await AsyncStorage.getItem('sol_school_intentions');
      if (raw) {
        const ints: { date: string; intention: string }[] = JSON.parse(raw);
        ints.forEach((i, idx) => entries.push({
          id: `int_${i.date}_${idx}`,
          kind: 'intention',
          body: i.intention,
          meta: { date: i.date },
          createdAt: new Date(i.date).getTime() || Date.now(),
        }));
      }
    } catch {}

    // sol_paradox_journal → paradox
    try {
      const raw = await AsyncStorage.getItem('sol_paradox_journal');
      if (raw) {
        const pars: { id: string; date: string; excerpt: string }[] = JSON.parse(raw);
        pars.forEach(p => entries.push({
          id: `par_${p.id}`,
          kind: 'paradox',
          body: p.excerpt,
          meta: { date: p.date },
          createdAt: new Date(p.date).getTime() || Date.now(),
        }));
      }
    } catch {}

    // sol_subject_notes → subject (Record<string, string>)
    try {
      const raw = await AsyncStorage.getItem('sol_subject_notes');
      if (raw) {
        const notes: Record<string, string> = JSON.parse(raw);
        Object.entries(notes).forEach(([name, text], idx) => {
          if (!text) return;
          entries.push({
            id: `sub_${name.replace(/\s+/g, '_')}_${idx}`,
            kind: 'subject',
            title: name,
            body: text,
            createdAt: Date.now() - idx * 1000,
          });
        });
      }
    } catch {}

    // sol_chronicle → chronicle
    try {
      const raw = await AsyncStorage.getItem('sol_chronicle');
      if (raw) {
        const ch: { ts: number; glyph: string; text: string; isSynthesis?: boolean }[] = JSON.parse(raw);
        ch.filter(c => !c.isSynthesis).forEach(c => entries.push({
          id: `chr_${c.ts}`,
          kind: 'chronicle',
          body: c.text,
          meta: { glyph: c.glyph },
          createdAt: c.ts,
        }));
      }
    } catch {}

    // Sort newest-first, write, mark done
    entries.sort((a, b) => b.createdAt - a.createdAt);
    await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(entries.slice(0, 500)));
    await AsyncStorage.setItem(MIGRATED_KEY, '1');
  } catch {}
}

export const VAULT_META: Record<VaultKind, { label: string; glyph: string; color: string }> = {
  memory:      { label: 'MEMORY',      glyph: '⊙', color: '#6FA8DC' },
  insight:     { label: 'INSIGHT',     glyph: '✦', color: '#F5A623' },
  scriptorium: { label: 'SCRIPTORIUM', glyph: '𝔏', color: '#A78BFA' },
  intention:   { label: 'INTENTION',   glyph: '◎', color: '#4ADE80' },
  paradox:     { label: 'PARADOX',     glyph: '⊘', color: '#FB923C' },
  subject:     { label: 'SUBJECT NOTE',glyph: '△', color: '#38BDF8' },
  chronicle:   { label: 'CHRONICLE',   glyph: '⊛', color: '#E879F9' },
};
