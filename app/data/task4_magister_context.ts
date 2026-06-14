// TASK 4 — MAGISTER CONTEXT INJECTION
// Paste into app/(tabs)/index.tsx or import as a module

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArchetypeId } from './task1_companion_specs';

// ─── ASYNCSTORAGE KEYS ─────────────────────────────────────────────

const KEYS = {
  archetype: 'sol_companion_archetype',
  stage: 'sol_companion_stage',
  skin: 'sol_active_skin',
  gearCrown: 'sol_gear_crown',
  gearSigil: 'sol_gear_sigil',
  gearMantle: 'sol_gear_mantle',
  lastBattle: 'sol_last_battle',
} as const;

// ─── TYPES ─────────────────────────────────────────────────────────

export type CompanionState = {
  archetypeId: ArchetypeId;
  archetypeName: string;
  stage: number;
  stageName: string;
  skinName: string;
  gear: string[];
  lastBattle: { result: 'win' | 'loss'; enemyName?: string } | null;
};

const STAGE_NAMES = ['SEED', 'SPARK', 'EMBER', 'LANTERN', 'CITRINITAS', 'GREAT WORK'];

// ─── STATE FETCHER ─────────────────────────────────────────────────

export async function getCompanionState(): Promise<CompanionState> {
  const pairs = await AsyncStorage.multiGet([
    KEYS.archetype,
    KEYS.stage,
    KEYS.skin,
    KEYS.gearCrown,
    KEYS.gearSigil,
    KEYS.gearMantle,
    KEYS.lastBattle,
  ]);
  const [archetypeId, stageStr, skinName, crown, sigil, mantle, lastBattleStr] = pairs.map(p => p[1]);

  const stage = stageStr ? parseInt(stageStr, 10) : 0;
  const gear: string[] = [];
  if (crown === 'true') gear.push('crown');
  if (sigil === 'true') gear.push('sigil');
  if (mantle === 'true') gear.push('mantle');

  let lastBattle = null;
  if (lastBattleStr) {
    try {
      lastBattle = JSON.parse(lastBattleStr);
    } catch {
      lastBattle = null;
    }
  }

  const safeArchetype = (archetypeId || 'archivist') as ArchetypeId;

  return {
    archetypeId: safeArchetype,
    archetypeName: safeArchetype.toUpperCase(),
    stage,
    stageName: STAGE_NAMES[stage] || 'SEED',
    skinName: skinName || 'default',
    gear,
    lastBattle,
  };
}

// ─── CONTEXT BUILDER ───────────────────────────────────────────────

export function buildMagisterContext(state: CompanionState): string {
  const gearStr = state.gear.length > 0 ? state.gear.join(' | ') : 'none';
  const battleStr = state.lastBattle
    ? `${state.lastBattle.result.toUpperCase()} against ${state.lastBattle.enemyName || 'an unknown foe'}`
    : 'no recent battle';

  return `COMPANION CONTEXT:
Archetype: ${state.archetypeId} — ${state.archetypeName}
Stage: ${state.stageName} (${state.stage}/5)
Active skin: ${state.skinName}
Gear unlocked: ${gearStr}
Recent battle: ${battleStr}

The Magister knows this companion intimately. Reference it naturally — not every response, but when the user asks about their path, their growth, or their challenges. The companion is a mirror of the user's actual learning history.`;
}

// ─── FULL SYSTEM PROMPT BUILDER ──────────────────────────────────

export async function buildMagisterSystemPrompt(basePrompt: string): Promise<string> {
  const state = await getCompanionState();
  const contextBlock = buildMagisterContext(state);
  return `${basePrompt}

${contextBlock}`;
}

// ─── USAGE IN index.tsx ──────────────────────────────────────────
//
// import { buildMagisterSystemPrompt } from './task4_magister_context';
//
// // When persona === 'magister':
// const basePrompt = 'You are the Magister, a wise and cryptic D&D master...';
// const systemPrompt = await buildMagisterSystemPrompt(basePrompt);
//
// // Pass systemPrompt to your LLM call
//
// ─── SETTING ASYNCSTORAGE VALUES ─────────────────────────────────
//
// // When companion is chosen:
// await AsyncStorage.setItem('sol_companion_archetype', 'archivist');
// await AsyncStorage.setItem('sol_companion_stage', '3');
// await AsyncStorage.setItem('sol_active_skin', 'lantern_glow');
//
// // When gear unlocks:
// await AsyncStorage.setItem('sol_gear_crown', 'true');
//
// // When battle ends:
// await AsyncStorage.setItem('sol_last_battle', JSON.stringify({ result: 'win', enemyName: 'Shadow Wraith' }));
