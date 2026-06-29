// CASCADE Knowledge Builder — data model + persistence.
// Framework: Mackenzie Conor James Clark / Lycheetah Foundation
//
// Sits on top of the onion engine (cascade-onion.ts). Defines the builder-facing block
// shape (a claim + 9 layers, each with the user's written content AND a sovereign score),
// persists the user's knowledge network to AsyncStorage, and recomputes scores via the engine.
//
// v1 = sovereign-only: the user writes and scores their own 9 layers. framework_score (AI vs
// Codex) is left on each layer for v2 without changing this shape. Isolated module — wiring
// into the School comes later.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ONION_LAYERS,
  computeBlockScore,
  computePyramidPi,
  computePyramidScore,
  type Block,
  type LayerData,
  type ScoreMode,
} from './cascade-onion';

export const CASCADE_STORAGE_KEY   = 'sol_cascade_network'; // default pyramid (backward compat)
export const PYRAMIDS_INDEX_KEY    = 'sol_cascade_pyramids_index';
export const DEFAULT_PYRAMID_ID    = 'default';

export type PyramidMeta = {
  id: string;
  name: string;
  createdAt: number;
};

function pyramidKey(id: string): string {
  return id === DEFAULT_PYRAMID_ID ? CASCADE_STORAGE_KEY : `sol_cascade_${id}`;
}

export async function loadPyramids(): Promise<PyramidMeta[]> {
  try {
    const raw = await AsyncStorage.getItem(PYRAMIDS_INDEX_KEY);
    if (!raw) {
      const def: PyramidMeta = { id: DEFAULT_PYRAMID_ID, name: 'Main', createdAt: Date.now() };
      await savePyramids([def]);
      return [def];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [{ id: DEFAULT_PYRAMID_ID, name: 'Main', createdAt: Date.now() }];
  } catch {
    return [{ id: DEFAULT_PYRAMID_ID, name: 'Main', createdAt: Date.now() }];
  }
}

export async function savePyramids(list: PyramidMeta[]): Promise<void> {
  try { await AsyncStorage.setItem(PYRAMIDS_INDEX_KEY, JSON.stringify(list)); } catch {}
}

export async function createPyramid(name: string): Promise<PyramidMeta> {
  const meta: PyramidMeta = {
    id: `pyr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    createdAt: Date.now(),
  };
  const list = await loadPyramids();
  await savePyramids([...list, meta]);
  return meta;
}

export async function renamePyramid(id: string, name: string): Promise<void> {
  const list = await loadPyramids();
  await savePyramids(list.map(p => p.id === id ? { ...p, name } : p));
}

export async function deletePyramid(id: string): Promise<void> {
  if (id === DEFAULT_PYRAMID_ID) return; // Main pyramid is permanent
  const list = await loadPyramids();
  await savePyramids(list.filter(p => p.id !== id));
  try { await AsyncStorage.removeItem(pyramidKey(id)); } catch {}
}

// A layer the user is building: engine scoring fields + the written content for that layer.
export type BuilderLayer = LayerData & { content: string };

// A knowledge block: a claim, its 9 layers, cached aggregate scores, timestamps.
// Omit Block's `layers` so we can narrow it to BuilderLayer[] without a type conflict;
// BuilderLayer extends LayerData, so it stays compatible with the engine's scorers.
export type CascadeBlock = Omit<Block, 'layers'> & {
  claim: string;          // the core statement / title
  layers: BuilderLayer[]; // always length 9, indexed to ONION_LAYERS
  createdAt: number;
  updatedAt: number;
};

// Fresh empty block — 9 blank layers, ready to fill. AXIOM defaults to falsifiable=true.
export function createEmptyBlock(): CascadeBlock {
  const now = Date.now();
  return {
    id: `cb_${now}_${Math.random().toString(36).slice(2, 8)}`,
    claim: '',
    layers: ONION_LAYERS.map((_, i) => ({
      content: '',
      sovereign_score: 0,
      ...(i === 0 ? { falsifiable: true } : {}),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

// Recompute a block's cached aggregate scores from its layers (both tracks).
export function recomputeBlock(block: CascadeBlock): CascadeBlock {
  return {
    ...block,
    score_aggregate: computeBlockScore(block.layers, 'framework'),
    sovereign_score_aggregate: computeBlockScore(block.layers, 'sovereign'),
    updatedAt: Date.now(),
  };
}

// Pyramid-level readouts across the whole network.
export function networkPi(blocks: CascadeBlock[], mode: ScoreMode = 'sovereign'): number {
  const files = blocks.map(b => ({
    id: b.id,
    score_aggregate: mode === 'sovereign' ? b.sovereign_score_aggregate : b.score_aggregate,
  }));
  return computePyramidPi(files);
}

export function networkScore(blocks: CascadeBlock[], mode: ScoreMode = 'sovereign'): number {
  const files = blocks.map(b => ({
    id: b.id,
    score_aggregate: mode === 'sovereign' ? b.sovereign_score_aggregate : b.score_aggregate,
  }));
  return computePyramidScore(files);
}

// ─── Persistence ────────────────────────────────────────────────────────────

export async function loadNetwork(pyramidId: string = DEFAULT_PYRAMID_ID): Promise<CascadeBlock[]> {
  try {
    const raw = await AsyncStorage.getItem(pyramidKey(pyramidId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CascadeBlock[]) : [];
  } catch {
    return [];
  }
}

export async function saveNetwork(blocks: CascadeBlock[], pyramidId: string = DEFAULT_PYRAMID_ID): Promise<void> {
  try {
    await AsyncStorage.setItem(pyramidKey(pyramidId), JSON.stringify(blocks));
  } catch {}
}

export async function upsertBlock(block: CascadeBlock, pyramidId: string = DEFAULT_PYRAMID_ID): Promise<CascadeBlock[]> {
  const scored = recomputeBlock(block);
  const network = await loadNetwork(pyramidId);
  const idx = network.findIndex(b => b.id === scored.id);
  if (idx >= 0) network[idx] = scored;
  else network.push(scored);
  await saveNetwork(network, pyramidId);
  return network;
}

export async function deleteBlock(id: string, pyramidId: string = DEFAULT_PYRAMID_ID): Promise<CascadeBlock[]> {
  const network = (await loadNetwork(pyramidId)).filter(b => b.id !== id);
  await saveNetwork(network, pyramidId);
  return network;
}
