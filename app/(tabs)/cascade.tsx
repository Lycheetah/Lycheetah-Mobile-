// CASCADE Knowledge Builder — the screen.
// Build, score, and pressure-test your own knowledge network across the 9 onion layers.
// v1: sovereign-only (you write + score your own layers). href:null — launched from School later.

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../../constants/theme';
import { makeSeedBlocks, CASCADE_SEED_FLAG } from '../../lib/intelligence/cascade-seed';
import {
  ONION_LAYERS,
  computeBlockScore,
  computePi,
  computePyramidPi,
  computePyramidScore,
  getScoreBand,
  detectTensions,
  type ScoreMode,
} from '../../lib/intelligence/cascade-onion';
import {
  createEmptyBlock,
  loadNetwork,
  saveNetwork,
  upsertBlock,
  deleteBlock,
  type CascadeBlock,
} from '../../lib/intelligence/cascade-store';
import { auditCascadeBlock, applyVerdict, type CascadeVerdict } from '../../lib/intelligence/cascade-judge';

// Editor display track: the engine's verdict (framework) blended with the human's override
// (sovereign) when both exist. 'composite' returns whichever is present if only one is.
const DISPLAY_MODE = 'composite' as const;

const STEP = 5; // sovereign-score increment per tap

// TUNING (Mac's call): a block is "under pressure" when a strong claim's coherence is being
// eaten — restructuring imminent. These two thresholds decide when the ⚡ glow fires. Surfaced
// as named constants so they're easy to tune deliberately rather than buried as magic numbers.
const PRESSURE_AXIOM_MIN = 50;     // claim must be at least this strong to count as "load-bearing"
const PRESSURE_COHERENCE_MAX = 40; // …and its coherence this low to count as "under pressure"

// The truth-pressure made visible. Single source of truth for both the list glow and editor flag.
// Prefers the engine's verdict (framework_score); falls back to the human's score if unscored.
function layerVal(l: CascadeBlock['layers'][number] | undefined): number {
  return l?.framework_score || l?.sovereign_score || 0;
}
function blockUnderPressure(b: CascadeBlock): boolean {
  const axiom = layerVal(b.layers[0]);
  const coherence = layerVal(b.layers[3]);
  return axiom > PRESSURE_AXIOM_MIN && coherence < PRESSURE_COHERENCE_MAX;
}

// Effective aggregate / mode for a block: prefer the engine's verdict (framework); fall back to
// the human's score for blocks not yet auto-scored (e.g. the seed pyramid).
function effAgg(b: CascadeBlock): number {
  return b.score_aggregate || b.sovereign_score_aggregate || 0;
}
function effMode(b: CascadeBlock): ScoreMode {
  return b.layers.some(l => (l.framework_score || 0) > 0) ? 'composite' : 'sovereign';
}

// TUNING (Mac's call): raw Π is unbounded and runs OPPOSITE the score, which misreads as a number.
// Band it into a pressure STATE so high-pressure reads as a warning, not an achievement. Raw Π is
// kept in the editor audit. Thresholds are tunable.
function piBand(pi: number): { label: string; color: string } {
  if (pi < 100) return { label: 'LOW',      color: '#4ade80' };
  if (pi < 200) return { label: 'MODERATE', color: '#facc15' };
  if (pi < 350) return { label: 'HIGH',     color: '#fb923c' };
  return { label: 'EXTREME', color: '#f87171' };
}

export default function CascadeBuilderScreen() {
  const [blocks, setBlocks] = useState<CascadeBlock[]>([]);
  const [editing, setEditing] = useState<CascadeBlock | null>(null);
  const [scoring, setScoring] = useState(false);                 // auto-score / depth-audit in flight
  const [audit, setAudit] = useState<{ weakest?: string; objection?: string } | null>(null);
  const [scoreErr, setScoreErr] = useState<string | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);          // engine's per-layer reason (transient)

  // First open: seed the example AI-knowledge pyramid once (then it's the user's to edit/delete).
  useEffect(() => {
    (async () => {
      const net = await loadNetwork();
      if (net.length > 0) { setBlocks(net); return; }
      const seeded = await AsyncStorage.getItem(CASCADE_SEED_FLAG);
      if (seeded) { setBlocks([]); return; } // user cleared it — respect that
      const seed = makeSeedBlocks();
      await saveNetwork(seed);
      await AsyncStorage.setItem(CASCADE_SEED_FLAG, 'true');
      setBlocks(seed);
    })();
  }, []);

  // ── Live computed readouts for the block being edited (engine verdict + human override) ──
  const live = useMemo(() => {
    if (!editing) return null;
    const score = computeBlockScore(editing.layers, DISPLAY_MODE);
    const pi = computePi(editing.layers, DISPLAY_MODE);
    const band = getScoreBand(score);
    const underPressure = blockUnderPressure(editing); // single source of truth
    const scored = editing.layers.some(l => (l.framework_score || 0) > 0);
    return { score, pi, band, underPressure, scored };
  }, [editing]);

  const setLayer = (i: number, patch: Partial<CascadeBlock['layers'][number]>) => {
    if (!editing) return;
    const layers = editing.layers.map((l, idx) => (idx === i ? { ...l, ...patch } : l));
    setEditing({ ...editing, layers });
  };

  // KEYSTONE — Truth Pressure, live. The engine reads the claim + each layer's content and
  // scores all 9 in one pass (framework_score), leaving the human's sovereign override intact.
  const runScore = async (mode: 'score' | 'audit') => {
    if (!editing || scoring) return;
    setScoring(true); setScoreErr(null); setAudit(null);
    try {
      const verdict: CascadeVerdict | null = await auditCascadeBlock(editing.claim, editing.layers, mode);
      if (!verdict) { setScoreErr('Could not reach the engine — your scores are untouched.'); return; }
      setEditing(prev => (prev ? { ...prev, layers: applyVerdict(prev.layers, verdict) } : prev));
      setReasons(verdict.layers.map(l => l.reason));
      if (mode === 'audit') setAudit({ weakest: verdict.weakestLayer, objection: verdict.objection });
    } finally {
      setScoring(false);
    }
  };

  // Switching to a different block clears the last audit's adversarial note + reasons.
  useEffect(() => { setAudit(null); setScoreErr(null); setReasons([]); }, [editing?.id]);

  const onSave = async () => {
    if (!editing) return;
    const net = await upsertBlock(editing);
    setBlocks(net);
    setEditing(null);
  };

  const onDelete = async () => {
    if (!editing) return;
    const net = await deleteBlock(editing.id);
    setBlocks(net);
    setEditing(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // EDITOR VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>CASCADE · BLOCK</Text>

        <TextInput
          style={styles.claimInput}
          placeholder="The claim — your core statement…"
          placeholderTextColor={SOL_THEME.textMuted}
          value={editing.claim}
          onChangeText={t => setEditing({ ...editing, claim: t })}
          multiline
        />

        {/* Live readout */}
        <View style={[styles.readout, { borderColor: live!.band.textColor + '55', backgroundColor: live!.band.color }]}>
          <Text style={[styles.readoutScore, { color: live!.band.textColor }]}>{live!.score || '—'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.readoutBand, { color: live!.band.textColor }]}>{live!.band.label}</Text>
            <Text style={[styles.readoutPi, { color: piBand(live!.pi).color }]}>{piBand(live!.pi).label} PRESSURE · Π {live!.pi}</Text>
          </View>
          {live!.underPressure && <Text style={styles.pressureFlag}>⚡ PRESSURE</Text>}
        </View>

        {/* KEYSTONE — auto-score the layers with the engine. Truth Pressure, live. */}
        <View style={styles.scoreRow}>
          <TouchableOpacity
            style={[styles.scoreBtn, scoring && styles.scoreBtnBusy]}
            onPress={() => runScore('score')}
            disabled={scoring}
          >
            <Text style={styles.scoreBtnText}>{scoring ? '⊚ measuring…' : live!.scored ? '⊚ Re-score' : '⊚ Auto-score'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.auditBtn, scoring && styles.scoreBtnBusy]}
            onPress={() => runScore('audit')}
            disabled={scoring}
          >
            <Text style={styles.auditBtnText}>⚔ Depth Audit</Text>
          </TouchableOpacity>
        </View>

        {/* Reflexive Π — the register. The score is measured, not gospel; the human overrides. */}
        <Text style={styles.registerLine}>
          Scored by the engine (Π = E·P/(S+S₀)) — measured, not gospel. Your call overrides any layer.
        </Text>
        {scoreErr && <Text style={styles.scoreErr}>{scoreErr}</Text>}

        {/* Depth Audit — the Nigredo verdict: weakest layer + the single sharpest objection. */}
        {audit && (audit.weakest || audit.objection) && (
          <View style={styles.auditCard}>
            <Text style={styles.auditCardTitle}>⚔ DEPTH AUDIT</Text>
            {audit.weakest ? <Text style={styles.auditWeak}>Weakest layer: <Text style={{ color: '#f87171' }}>{audit.weakest}</Text></Text> : null}
            {audit.objection ? <Text style={styles.auditObjection}>“{audit.objection}”</Text> : null}
          </View>
        )}

        {/* 9 onion layers */}
        {ONION_LAYERS.map((layer, i) => {
          const ld = editing.layers[i];
          const verdict = ld?.framework_score || 0;      // the engine's measured score
          const override = ld?.sovereign_score || 0;      // the human's call
          const reason = reasons[i];
          return (
            <View key={layer.name} style={styles.layerCard}>
              <View style={styles.layerHead}>
                <Text style={styles.layerName}>{i}. {layer.name}</Text>
                {verdict > 0
                  ? <Text style={[styles.layerVal, { color: getScoreBand(verdict).textColor }]}>{verdict}</Text>
                  : <Text style={[styles.layerVal, { color: SOL_THEME.textMuted }]}>—</Text>}
              </View>
              <Text style={styles.layerDesc}>{layer.description}</Text>
              <TextInput
                style={styles.layerInput}
                placeholder="What lives in this layer…"
                placeholderTextColor={SOL_THEME.textMuted}
                value={ld?.content || ''}
                onChangeText={t => setLayer(i, { content: t })}
                multiline
              />
              {/* Engine's reason for its score, when audited */}
              {reason ? <Text style={styles.layerReason}>⊚ {reason}</Text> : null}

              {/* The human's override — disagree with the engine. Optional. */}
              <View style={styles.overrideHead}>
                <Text style={styles.overrideLabel}>YOUR CALL</Text>
                <Text style={styles.overrideVal}>{override > 0 ? override : '—'}</Text>
              </View>
              <View style={styles.stepRow}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setLayer(i, { sovereign_score: Math.max(0, override - STEP) })}>
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.stepTrack}>
                  <View style={[styles.stepFill, { width: `${override}%`, backgroundColor: getScoreBand(override).textColor }]} />
                </View>
                <TouchableOpacity style={styles.stepBtn} onPress={() => setLayer(i, { sovereign_score: Math.min(100, override + STEP) })}>
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              {/* AXIOM falsifiability gate — the engine sets this; the human can still flip it. */}
              {i === 0 && (
                <TouchableOpacity
                  style={styles.falsifiableRow}
                  onPress={() => setLayer(0, { falsifiable: ld?.falsifiable === false })}
                >
                  <Text style={[styles.falsifiableText, { color: ld?.falsifiable === false ? SOL_THEME.textMuted : '#4ade80' }]}>
                    {ld?.falsifiable === false ? '○ unfalsifiable (capped at 70)' : '◉ falsifiable'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={onSave}>
            <Text style={styles.saveBtnText}>⊚ Save block</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setEditing(null)}>
            <Text style={styles.cancelBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
        {blocks.some(b => b.id === editing.id) && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteBtnText}>Delete block</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NETWORK LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const effFiles = blocks.map(b => ({ id: b.id, score_aggregate: effAgg(b) }));
  const pyramidPi = computePyramidPi(effFiles);
  const pyramidScore = computePyramidScore(effFiles);
  const pyramidBand = getScoreBand(pyramidScore);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CASCADE</Text>
      <Text style={styles.subtitle}>Your living knowledge pyramid</Text>

      {blocks.length >= 2 && (
        <View style={[styles.pyramidBar, { borderColor: pyramidBand.textColor + '55' }]}>
          <Text style={[styles.pyramidLabel, { color: pyramidBand.textColor }]}>PYRAMID</Text>
          <Text style={styles.pyramidStat}>{pyramidScore} · {pyramidBand.label}</Text>
          <Text style={styles.pyramidStat}>Π {pyramidPi}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.newBtn} onPress={() => setEditing(createEmptyBlock())}>
        <Text style={styles.newBtnText}>+ New knowledge block</Text>
      </TouchableOpacity>

      {blocks.length === 0 && (
        <Text style={styles.empty}>
          No blocks yet. Build your first claim — set its axiom, lay its foundation, mark where it meets
          tension. The pyramid grows from here.
        </Text>
      )}

      {blocks.map(b => {
        const score = effAgg(b);
        const band = getScoreBand(score);
        const pressure = blockUnderPressure(b);
        const bPi = computePi(b.layers, effMode(b));
        return (
          <TouchableOpacity
            key={b.id}
            style={[
              styles.blockRow,
              { borderLeftColor: band.textColor },
              pressure && styles.blockPressure,
            ]}
            onPress={() => setEditing(b)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.blockClaim} numberOfLines={2}>{b.claim || '(untitled claim)'}</Text>
              <Text style={[styles.blockBand, { color: band.textColor }]}>
                {band.label} · <Text style={{ color: piBand(bPi).color }}>{piBand(bPi).label} pressure</Text>{pressure ? '  ⚡' : ''}
              </Text>
            </View>
            <Text style={[styles.blockScore, { color: band.textColor }]}>{score || '—'}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Tensions — blocks whose scores diverge > 25. The pyramid arguing with itself. */}
      {(() => {
        const shadow = blocks.map(b => ({ ...b, score_aggregate: effAgg(b) }));
        const tensions = detectTensions(shadow);
        if (tensions.length === 0) return null;
        const claimOf = (blk: { id: string }) => blocks.find(x => x.id === blk.id)?.claim || 'untitled';
        return (
          <View style={styles.tensionSection}>
            <Text style={styles.tensionTitle}>⚡ TENSIONS</Text>
            {tensions.map((t, i) => (
              <Text key={i} style={styles.tensionLine}>
                {claimOf(t.stronger).slice(0, 22) || 'untitled'} ⟷ {claimOf(t.weaker).slice(0, 22) || 'untitled'} · {t.delta} apart
              </Text>
            ))}
          </View>
        );
      })()}
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 18, paddingTop: 28 },
  title: { color: SOL_THEME.text, fontSize: 28, fontWeight: '800', letterSpacing: 2 },
  subtitle: { color: SOL_THEME.textMuted, fontSize: 13, marginBottom: 18 },
  kicker: { color: SOL_THEME.textMuted, fontSize: 11, letterSpacing: 2, marginBottom: 10 },

  pyramidBar: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  pyramidLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  pyramidStat: { color: SOL_THEME.text, fontSize: 13, fontWeight: '600' },

  newBtn: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 16, alignItems: 'center' },
  newBtnText: { color: SOL_THEME.text, fontSize: 14, fontWeight: '700' },

  empty: { color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20, marginTop: 8 },

  blockRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderLeftWidth: 3, backgroundColor: SOL_THEME.surface, marginBottom: 10 },
  blockClaim: { color: SOL_THEME.text, fontSize: 14, fontWeight: '600' },
  blockBand: { fontSize: 11, marginTop: 3, letterSpacing: 0.5 },
  blockScore: { fontSize: 22, fontWeight: '800', marginLeft: 12 },
  blockPressure: { borderWidth: 1, borderColor: '#fb923c66', backgroundColor: '#2a180022' },

  tensionSection: { marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fb923c33' },
  tensionTitle: { color: '#fb923c', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  tensionLine: { color: SOL_THEME.textMuted, fontSize: 12, marginTop: 3 },

  claimInput: { color: SOL_THEME.text, fontSize: 16, fontWeight: '600', borderWidth: 1, borderColor: SOL_THEME.border, borderRadius: 10, padding: 12, backgroundColor: SOL_THEME.surface, marginBottom: 14, minHeight: 56 },

  readout: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 18 },
  readoutScore: { fontSize: 34, fontWeight: '800', minWidth: 56 },
  readoutBand: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  readoutPi: { color: SOL_THEME.text, fontSize: 12, marginTop: 2 },
  pressureFlag: { color: '#fb923c', fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  layerCard: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 10 },
  layerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  layerName: { color: SOL_THEME.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  layerVal: { color: SOL_THEME.text, fontSize: 15, fontWeight: '700' },
  layerDesc: { color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2, marginBottom: 8, lineHeight: 15 },
  layerInput: { color: SOL_THEME.text, fontSize: 13, borderWidth: 1, borderColor: SOL_THEME.border, borderRadius: 8, padding: 10, minHeight: 40, marginBottom: 10 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 38, height: 32, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: SOL_THEME.text, fontSize: 20, fontWeight: '700' },
  stepTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: SOL_THEME.border, overflow: 'hidden' },
  stepFill: { height: 8, borderRadius: 4 },

  falsifiableRow: { marginTop: 10 },
  falsifiableText: { fontSize: 12, fontWeight: '600' },

  // Auto-score / Depth Audit
  scoreRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  scoreBtn: { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center', backgroundColor: '#2a1800', borderWidth: 1, borderColor: '#fb923c88' },
  scoreBtnBusy: { opacity: 0.5 },
  scoreBtnText: { color: '#fb923c', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  auditBtn: { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f8717188', backgroundColor: '#2a0a0a' },
  auditBtnText: { color: '#f87171', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  registerLine: { color: SOL_THEME.textMuted, fontSize: 10.5, lineHeight: 15, fontStyle: 'italic', marginBottom: 14 },
  scoreErr: { color: '#f87171', fontSize: 12, marginBottom: 12 },
  auditCard: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#f8717155', backgroundColor: '#f871710A', marginBottom: 14 },
  auditCardTitle: { color: '#f87171', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  auditWeak: { color: SOL_THEME.text, fontSize: 13, marginBottom: 4 },
  auditObjection: { color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 19, fontStyle: 'italic' },

  // Per-layer engine reason + human override
  layerReason: { color: '#fb923c', fontSize: 11, lineHeight: 15, fontStyle: 'italic', marginBottom: 8 },
  overrideHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  overrideLabel: { color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  overrideVal: { color: SOL_THEME.textMuted, fontSize: 13, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtn: { backgroundColor: '#2a1800', borderWidth: 1, borderColor: '#fb923c88' },
  saveBtnText: { color: '#fb923c', fontSize: 14, fontWeight: '800' },
  cancelBtn: { borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface },
  cancelBtnText: { color: SOL_THEME.textMuted, fontSize: 14, fontWeight: '600' },

  deleteBtn: { marginTop: 12, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: SOL_THEME.error, fontSize: 13, fontWeight: '600' },
});
