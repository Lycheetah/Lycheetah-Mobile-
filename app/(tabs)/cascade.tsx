// CASCADE Knowledge Builder — the screen.
// Build, score, and pressure-test your own knowledge network across the 9 onion layers.
// Pyramid view: 15 blocks sorted by strength, apex = most established, base = frontier.

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

const DISPLAY_MODE = 'composite' as const;
const STEP = 5;

const PRESSURE_AXIOM_MIN = 50;
const PRESSURE_COHERENCE_MAX = 40;

// Pyramid row layout: 1+2+3+4+5 = 15 blocks
const PYRAMID_ROWS = [1, 2, 3, 4, 5];

// Tier labels shown beside each pyramid row (apex → base)
const ROW_TIERS = ['BEDROCK', 'STRONG', 'MIDDLE', 'CONTESTED', 'FRONTIER'];

function layerVal(l: CascadeBlock['layers'][number] | undefined): number {
  return l?.framework_score || l?.sovereign_score || 0;
}
function blockUnderPressure(b: CascadeBlock): boolean {
  const axiom = layerVal(b.layers[0]);
  const coherence = layerVal(b.layers[3]);
  return axiom > PRESSURE_AXIOM_MIN && coherence < PRESSURE_COHERENCE_MAX;
}
function effAgg(b: CascadeBlock): number {
  return b.score_aggregate || b.sovereign_score_aggregate || 0;
}
function effMode(b: CascadeBlock): ScoreMode {
  return b.layers.some(l => (l.framework_score || 0) > 0) ? 'composite' : 'sovereign';
}
function piBand(pi: number): { label: string; color: string } {
  if (pi < 100) return { label: 'LOW',      color: '#4ade80' };
  if (pi < 200) return { label: 'MODERATE', color: '#facc15' };
  if (pi < 350) return { label: 'HIGH',     color: '#fb923c' };
  return { label: 'EXTREME', color: '#f87171' };
}

// Layer group labels for the editor
const LAYER_GROUP: Record<number, string> = {
  0: 'CORE',
  1: 'CORE',
  2: 'CORE',
  3: 'MIDDLE',
  4: 'MIDDLE',
  5: 'MIDDLE',
  6: 'EDGE',
  7: 'EDGE',
  8: 'EDGE',
};
const GROUP_COLOR: Record<string, string> = {
  CORE:   '#fb923c',
  MIDDLE: '#facc15',
  EDGE:   '#c084fc',
};

export default function CascadeBuilderScreen() {
  const [blocks, setBlocks]   = useState<CascadeBlock[]>([]);
  const [editing, setEditing] = useState<CascadeBlock | null>(null);
  const [scoring, setScoring] = useState(false);
  const [audit, setAudit]     = useState<{ weakest?: string; objection?: string } | null>(null);
  const [scoreErr, setScoreErr] = useState<string | null>(null);
  const [reasons, setReasons]   = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const net = await loadNetwork();
      if (net.length > 0) { setBlocks(net); return; }
      const seeded = await AsyncStorage.getItem(CASCADE_SEED_FLAG);
      if (seeded) { setBlocks([]); return; }
      const seed = makeSeedBlocks();
      await saveNetwork(seed);
      await AsyncStorage.setItem(CASCADE_SEED_FLAG, 'true');
      setBlocks(seed);
    })();
  }, []);

  const live = useMemo(() => {
    if (!editing) return null;
    const score = computeBlockScore(editing.layers, DISPLAY_MODE);
    const pi    = computePi(editing.layers, DISPLAY_MODE);
    const band  = getScoreBand(score);
    const underPressure = blockUnderPressure(editing);
    const scored = editing.layers.some(l => (l.framework_score || 0) > 0);
    const filled = editing.layers.filter(l => (l.content || '').trim().length > 0).length;
    return { score, pi, band, underPressure, scored, filled };
  }, [editing]);

  const setLayer = (i: number, patch: Partial<CascadeBlock['layers'][number]>) => {
    if (!editing) return;
    const layers = editing.layers.map((l, idx) => idx === i ? { ...l, ...patch } : l);
    setEditing({ ...editing, layers });
  };

  const runScore = async (mode: 'score' | 'audit') => {
    if (!editing || scoring) return;
    setScoring(true); setScoreErr(null); setAudit(null);
    try {
      const verdict: CascadeVerdict | null = await auditCascadeBlock(editing.claim, editing.layers, mode);
      if (!verdict) { setScoreErr('Engine unreachable — your scores are untouched.'); return; }
      setEditing(prev => prev ? { ...prev, layers: applyVerdict(prev.layers, verdict) } : prev);
      setReasons(verdict.layers.map(l => l.reason));
      if (mode === 'audit') setAudit({ weakest: verdict.weakestLayer, objection: verdict.objection });
    } finally {
      setScoring(false);
    }
  };

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
    const bandColor = live!.band.textColor;
    return (
      <ScrollView style={s.screen} contentContainerStyle={s.content}>

        {/* Header bar */}
        <View style={s.editorHeader}>
          <TouchableOpacity onPress={() => setEditing(null)} style={s.backBtn}>
            <Text style={s.backBtnText}>← PYRAMID</Text>
          </TouchableOpacity>
          <Text style={s.editorKicker}>CASCADE · BLOCK</Text>
        </View>

        {/* Claim input */}
        <TextInput
          style={[s.claimInput, { borderColor: bandColor + '44' }]}
          placeholder="The claim — your core statement…"
          placeholderTextColor={SOL_THEME.textMuted}
          value={editing.claim}
          onChangeText={t => setEditing({ ...editing, claim: t })}
          multiline
        />

        {/* Fill progress */}
        <View style={s.fillRow}>
          <Text style={s.fillLabel}>{live!.filled}/9 LAYERS FILLED</Text>
          <View style={s.fillTrack}>
            <View style={[s.fillBar, { width: `${(live!.filled / 9) * 100}%`, backgroundColor: bandColor }]} />
          </View>
        </View>

        {/* Live score readout */}
        <View style={[s.readout, { borderColor: bandColor + '55', backgroundColor: live!.band.color }]}>
          <View style={s.readoutLeft}>
            <Text style={[s.readoutScore, { color: bandColor }]}>{live!.score || '—'}</Text>
            <Text style={[s.readoutBand, { color: bandColor }]}>{live!.band.label}</Text>
          </View>
          <View style={s.readoutRight}>
            <Text style={[s.readoutPi, { color: piBand(live!.pi).color }]}>
              Π {live!.pi} · {piBand(live!.pi).label} PRESSURE
            </Text>
            <Text style={s.readoutHint}>ENGINE: MEASURED · SOVEREIGN: YOUR CALL</Text>
          </View>
          {live!.underPressure && <Text style={s.pressureFlag}>⚡</Text>}
        </View>

        {/* Score / Audit buttons */}
        <View style={s.scoreRow}>
          <TouchableOpacity style={[s.scoreBtn, scoring && s.btnBusy]} onPress={() => runScore('score')} disabled={scoring}>
            <Text style={s.scoreBtnText}>{scoring ? '⊚ measuring…' : live!.scored ? '⊚ Re-score' : '⊚ Auto-score'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.auditBtn, scoring && s.btnBusy]} onPress={() => runScore('audit')} disabled={scoring}>
            <Text style={s.auditBtnText}>⚔ Depth Audit</Text>
          </TouchableOpacity>
        </View>

        {scoreErr && <Text style={s.scoreErr}>{scoreErr}</Text>}

        {/* Depth Audit card */}
        {audit && (audit.weakest || audit.objection) && (
          <View style={s.auditCard}>
            <Text style={s.auditCardTitle}>⚔ DEPTH AUDIT — NIGREDO MODE</Text>
            {audit.weakest ? (
              <Text style={s.auditWeak}>Weakest layer: <Text style={{ color: '#f87171' }}>{audit.weakest}</Text></Text>
            ) : null}
            {audit.objection ? (
              <Text style={s.auditObjection}>"{audit.objection}"</Text>
            ) : null}
          </View>
        )}

        {/* 9 onion layers — grouped into CORE / MIDDLE / EDGE */}
        {ONION_LAYERS.map((layer, i) => {
          const ld       = editing.layers[i];
          const verdict  = ld?.framework_score || 0;
          const override = ld?.sovereign_score || 0;
          const reason   = reasons[i];
          const group    = LAYER_GROUP[i];
          const gColor   = GROUP_COLOR[group];
          const showGroupHeader = i === 0 || LAYER_GROUP[i] !== LAYER_GROUP[i - 1];
          return (
            <View key={layer.name}>
              {showGroupHeader && (
                <Text style={[s.layerGroupLabel, { color: gColor }]}>{group}</Text>
              )}
              <View style={[s.layerCard, { borderColor: gColor + '22' }]}>
                <View style={s.layerHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.layerIndex, { color: gColor }]}>{i}.</Text>
                    <Text style={s.layerName}>{layer.name}</Text>
                  </View>
                  {verdict > 0 ? (
                    <Text style={[s.layerVal, { color: getScoreBand(verdict).textColor }]}>{verdict}</Text>
                  ) : (
                    <Text style={[s.layerVal, { color: SOL_THEME.textMuted }]}>—</Text>
                  )}
                </View>
                <Text style={s.layerDesc}>{layer.description}</Text>
                <TextInput
                  style={s.layerInput}
                  placeholder="What lives in this layer…"
                  placeholderTextColor={SOL_THEME.textMuted}
                  value={ld?.content || ''}
                  onChangeText={t => setLayer(i, { content: t })}
                  multiline
                />
                {reason ? <Text style={s.layerReason}>⊚ {reason}</Text> : null}

                {/* Human override */}
                <View style={s.overrideRow}>
                  <Text style={s.overrideLabel}>YOUR CALL</Text>
                  <View style={s.stepRow}>
                    <TouchableOpacity style={s.stepBtn} onPress={() => setLayer(i, { sovereign_score: Math.max(0, override - STEP) })}>
                      <Text style={s.stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={s.stepTrack}>
                      <View style={[s.stepFill, { width: `${override}%`, backgroundColor: getScoreBand(override).textColor }]} />
                    </View>
                    <Text style={[s.overrideVal, { color: override > 0 ? SOL_THEME.text : SOL_THEME.textMuted }]}>
                      {override > 0 ? override : '—'}
                    </Text>
                    <TouchableOpacity style={s.stepBtn} onPress={() => setLayer(i, { sovereign_score: Math.min(100, override + STEP) })}>
                      <Text style={s.stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {i === 0 && (
                  <TouchableOpacity
                    style={s.falsifiableRow}
                    onPress={() => setLayer(0, { falsifiable: ld?.falsifiable === false })}
                  >
                    <Text style={[s.falsifiableText, { color: ld?.falsifiable === false ? '#f87171' : '#4ade80' }]}>
                      {ld?.falsifiable === false ? '○ unfalsifiable — axiom capped at 70' : '◉ falsifiable'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Actions */}
        <View style={s.actionRow}>
          <TouchableOpacity style={[s.actionBtn, s.saveBtn]} onPress={onSave}>
            <Text style={s.saveBtnText}>⊚ Save to pyramid</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.cancelBtn]} onPress={() => setEditing(null)}>
            <Text style={s.cancelBtnText}>Discard</Text>
          </TouchableOpacity>
        </View>
        {blocks.some(b => b.id === editing.id) && (
          <TouchableOpacity style={s.deleteBtn} onPress={onDelete}>
            <Text style={s.deleteBtnText}>Remove from pyramid</Text>
          </TouchableOpacity>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PYRAMID VIEW
  // ─────────────────────────────────────────────────────────────────────────
  const effFiles     = blocks.map(b => ({ id: b.id, score_aggregate: effAgg(b) }));
  const pyramidPi    = computePyramidPi(effFiles);
  const pyramidScore = computePyramidScore(effFiles);
  const pyramidBand  = getScoreBand(pyramidScore);

  // Sort strongest → weakest, split into rows 1/2/3/4/5
  const sorted = [...blocks].sort((a, b) => effAgg(b) - effAgg(a));
  const pyramidRows: CascadeBlock[][] = [];
  let cursor = 0;
  for (const size of PYRAMID_ROWS) {
    if (cursor >= sorted.length) break;
    const chunk = sorted.slice(cursor, cursor + size);
    if (chunk.length > 0) pyramidRows.push(chunk);
    cursor += size;
  }
  const overflow = cursor < sorted.length ? sorted.slice(cursor) : [];

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>

      {/* Header */}
      <Text style={s.title}>CASCADE</Text>
      <Text style={s.subtitle}>Knowledge pyramid · {blocks.length} block{blocks.length !== 1 ? 's' : ''}</Text>

      {/* Pyramid score bar */}
      {blocks.length >= 2 && (
        <View style={[s.pyramidBar, { borderColor: pyramidBand.textColor + '44', backgroundColor: pyramidBand.color }]}>
          <View>
            <Text style={[s.pyramidScore, { color: pyramidBand.textColor }]}>{pyramidScore}</Text>
            <Text style={[s.pyramidBandLabel, { color: pyramidBand.textColor }]}>{pyramidBand.label}</Text>
          </View>
          <View style={s.pyramidBarDivider} />
          <View style={{ flex: 1 }}>
            <Text style={s.pyramidBarTitle}>PYRAMID COHERENCE</Text>
            <Text style={[s.pyramidPi, { color: piBand(pyramidPi).color }]}>
              Π {pyramidPi} · {piBand(pyramidPi).label} PRESSURE
            </Text>
          </View>
        </View>
      )}

      {/* PYRAMID — strongest at apex, most speculative at base */}
      {pyramidRows.length > 0 && (
        <View style={s.pyramidWrap}>
          <Text style={s.pyramidTopLabel}>STRENGTH ↑</Text>
          {pyramidRows.map((row, ri) => {
            const tier = ROW_TIERS[ri] ?? '';
            return (
              <View key={ri} style={s.pyramidRowWrap}>
                <Text style={[s.rowTierLabel, { color: ri === 0 ? '#fb923c88' : SOL_THEME.textMuted + '66' }]}>
                  {tier}
                </Text>
                <View style={s.pyramidRow}>
                  {row.map(b => {
                    const score    = effAgg(b);
                    const band     = getScoreBand(score);
                    const pressure = blockUnderPressure(b);
                    const isApex   = ri === 0;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        activeOpacity={0.72}
                        onPress={() => setEditing(b)}
                        style={[
                          s.pBlock,
                          ri === 0 && s.pBlockApex,
                          ri === 1 && s.pBlockRow1,
                          ri === 2 && s.pBlockRow2,
                          ri === 3 && s.pBlockRow3,
                          ri >= 4  && s.pBlockRow4,
                          {
                            borderColor: pressure ? '#fb923c88' : band.textColor + '44',
                            backgroundColor: band.textColor + (ri <= 1 ? '18' : '11'),
                          },
                        ]}
                      >
                        <Text style={[
                          s.pScore,
                          { color: band.textColor },
                          isApex && { fontSize: 28 },
                          ri === 1 && { fontSize: 22 },
                          ri === 2 && { fontSize: 17 },
                          ri === 3 && { fontSize: 14 },
                          ri >= 4  && { fontSize: 11 },
                        ]}>
                          {score || '—'}
                        </Text>
                        {ri <= 1 && (
                          <Text style={[s.pClaim, ri === 0 && { fontSize: 9 }]} numberOfLines={ri === 0 ? 2 : 1}>
                            {b.claim}
                          </Text>
                        )}
                        {ri === 2 && (
                          <Text style={s.pClaimXs} numberOfLines={1}>
                            {b.claim?.slice(0, 18)}
                          </Text>
                        )}
                        {pressure && <Text style={s.pPressure}>⚡</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
          <Text style={s.pyramidBottomLabel}>FRONTIER ↓</Text>
        </View>
      )}

      {/* Overflow blocks beyond 15 */}
      {overflow.map(b => {
        const score    = effAgg(b);
        const band     = getScoreBand(score);
        const pressure = blockUnderPressure(b);
        const bPi      = computePi(b.layers, effMode(b));
        return (
          <TouchableOpacity
            key={b.id}
            style={[s.blockRow, { borderLeftColor: band.textColor }, pressure && s.blockPressure]}
            onPress={() => setEditing(b)}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.blockClaim} numberOfLines={2}>{b.claim || '(untitled claim)'}</Text>
              <Text style={[s.blockMeta, { color: band.textColor }]}>
                {band.label}  ·  <Text style={{ color: piBand(bPi).color }}>{piBand(bPi).label} pressure</Text>
                {pressure ? '  ⚡' : ''}
              </Text>
            </View>
            <Text style={[s.blockScore, { color: band.textColor }]}>{score || '—'}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Tensions */}
      {(() => {
        const shadow = blocks.map(b => ({ ...b, score_aggregate: effAgg(b) }));
        const tensions = detectTensions(shadow);
        if (tensions.length === 0) return null;
        const claimOf = (blk: { id: string }) =>
          blocks.find(x => x.id === blk.id)?.claim?.slice(0, 24) || 'untitled';
        return (
          <View style={s.tensionSection}>
            <Text style={s.tensionTitle}>⚡ {tensions.length} TENSION{tensions.length !== 1 ? 'S' : ''} DETECTED</Text>
            <Text style={s.tensionHint}>Claims whose scores diverge — contradictions in the pyramid.</Text>
            {tensions.map((t, i) => (
              <View key={i} style={s.tensionRow}>
                <Text style={s.tensionClaim}>{claimOf(t.stronger)}</Text>
                <Text style={s.tensionArrow}>⟷</Text>
                <Text style={s.tensionClaim}>{claimOf(t.weaker)}</Text>
                <Text style={s.tensionDelta}>{t.delta} apart</Text>
              </View>
            ))}
          </View>
        );
      })()}

      {/* New block */}
      <TouchableOpacity style={s.newBtn} onPress={() => setEditing(createEmptyBlock())}>
        <Text style={s.newBtnText}>+ Add knowledge block</Text>
      </TouchableOpacity>

      {blocks.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyGlyph}>⊚</Text>
          <Text style={s.emptyTitle}>Build your pyramid</Text>
          <Text style={s.emptyBody}>
            Each block is a claim — a single statement you want to test. Fill the 9 layers, tap
            ⊚ to auto-score with Truth Pressure, and watch your pyramid form. Strongest claims
            rise to the apex. Most speculative settle at the base.
          </Text>
        </View>
      )}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 18, paddingTop: 28 },

  // ── Home header ─────────────────────────────────────────────────────────
  title:    { color: SOL_THEME.text, fontSize: 30, fontWeight: '800', letterSpacing: 2 },
  subtitle: { color: SOL_THEME.textMuted, fontSize: 12, marginBottom: 16, letterSpacing: 0.5 },

  // ── Pyramid score bar ───────────────────────────────────────────────────
  pyramidBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 20,
  },
  pyramidScore:     { fontSize: 30, fontWeight: '800' },
  pyramidBandLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 1 },
  pyramidBarDivider: { width: 1, height: 36, backgroundColor: '#ffffff11' },
  pyramidBarTitle:  { color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  pyramidPi:        { fontSize: 12, fontWeight: '700', marginTop: 3 },

  // ── Pyramid visual ──────────────────────────────────────────────────────
  pyramidWrap:      { marginBottom: 20 },
  pyramidTopLabel:  { color: '#fb923c55', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textAlign: 'right', marginBottom: 6 },
  pyramidBottomLabel:{ color: '#c084fc55', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textAlign: 'right', marginTop: 6 },
  pyramidRowWrap:   { marginBottom: 5 },
  rowTierLabel:     { fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3, textAlign: 'right' },
  pyramidRow:       { flexDirection: 'row', justifyContent: 'center', gap: 5 },

  // Pyramid block base
  pBlock: {
    borderRadius: 9, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    flex: 1,
  },
  pBlockApex: { maxWidth: '68%', minHeight: 92, padding: 14 },
  pBlockRow1: { minHeight: 76, padding: 9 },
  pBlockRow2: { minHeight: 64, padding: 7 },
  pBlockRow3: { minHeight: 54, padding: 5 },
  pBlockRow4: { minHeight: 46, padding: 4 },

  pScore:    { fontWeight: '800', fontSize: 20, textAlign: 'center' },
  pClaim:    { color: '#88889a', fontSize: 8, textAlign: 'center', marginTop: 4, lineHeight: 12 },
  pClaimXs:  { color: '#66667a', fontSize: 7, textAlign: 'center', marginTop: 3 },
  pPressure: { color: '#fb923c', fontSize: 7, marginTop: 2 },

  // ── Overflow / flat list ────────────────────────────────────────────────
  blockRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderLeftWidth: 3, backgroundColor: SOL_THEME.surface, marginBottom: 8 },
  blockPressure: { borderWidth: 1, borderColor: '#fb923c44' },
  blockClaim:    { color: SOL_THEME.text, fontSize: 14, fontWeight: '600' },
  blockMeta:     { fontSize: 11, marginTop: 3, letterSpacing: 0.5 },
  blockScore:    { fontSize: 22, fontWeight: '800', marginLeft: 12 },

  // ── Tensions ────────────────────────────────────────────────────────────
  tensionSection: { marginBottom: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fb923c33', backgroundColor: '#fb923c08' },
  tensionTitle:   { color: '#fb923c', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  tensionHint:    { color: SOL_THEME.textMuted, fontSize: 11, marginBottom: 10 },
  tensionRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tensionClaim:   { color: SOL_THEME.textMuted, fontSize: 11, flex: 1 },
  tensionArrow:   { color: '#fb923c88', fontSize: 13 },
  tensionDelta:   { color: '#fb923c', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ── New block / empty state ─────────────────────────────────────────────
  newBtn:     { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, alignItems: 'center', marginTop: 6 },
  newBtnText: { color: SOL_THEME.text, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyGlyph: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { color: SOL_THEME.text, fontSize: 18, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  emptyBody:  { color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 300 },

  // ── EDITOR ──────────────────────────────────────────────────────────────
  editorHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn:       { paddingVertical: 6, paddingRight: 14 },
  backBtnText:   { color: SOL_THEME.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  editorKicker:  { color: SOL_THEME.textMuted, fontSize: 10, letterSpacing: 2, fontWeight: '700' },

  claimInput: {
    color: SOL_THEME.text, fontSize: 16, fontWeight: '600',
    borderWidth: 1, borderRadius: 12, padding: 14,
    backgroundColor: SOL_THEME.surface, marginBottom: 12, minHeight: 60,
  },

  fillRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  fillLabel: { color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, width: 100 },
  fillTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: SOL_THEME.border, overflow: 'hidden' },
  fillBar:   { height: 3, borderRadius: 2 },

  readout: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14,
  },
  readoutLeft:  { alignItems: 'center', minWidth: 60 },
  readoutRight: { flex: 1 },
  readoutScore: { fontSize: 36, fontWeight: '800' },
  readoutBand:  { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 1 },
  readoutPi:    { fontSize: 12, fontWeight: '700' },
  readoutHint:  { color: '#55556a', fontSize: 9, letterSpacing: 0.5, marginTop: 4 },
  pressureFlag: { color: '#fb923c', fontSize: 18, fontWeight: '800' },

  scoreRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scoreBtn:    { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center', backgroundColor: '#2a1800', borderWidth: 1, borderColor: '#fb923c66' },
  auditBtn:    { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f8717166', backgroundColor: '#2a0a0a' },
  btnBusy:     { opacity: 0.45 },
  scoreBtnText:{ color: '#fb923c', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  auditBtnText:{ color: '#f87171', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  scoreErr:    { color: '#f87171', fontSize: 12, marginBottom: 10 },

  auditCard:      { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#f8717144', backgroundColor: '#f871710A', marginBottom: 14 },
  auditCardTitle: { color: '#f87171', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  auditWeak:      { color: SOL_THEME.text, fontSize: 13, marginBottom: 6 },
  auditObjection: { color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  // Layer group label
  layerGroupLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 16, marginBottom: 6 },

  layerCard:  { padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: SOL_THEME.surface, marginBottom: 8 },
  layerHead:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  layerIndex: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  layerName:  { color: SOL_THEME.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  layerVal:   { fontSize: 18, fontWeight: '800', marginTop: 2 },
  layerDesc:  { color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  layerInput: { color: SOL_THEME.text, fontSize: 13, borderWidth: 1, borderColor: SOL_THEME.border, borderRadius: 8, padding: 10, minHeight: 40, marginBottom: 8 },
  layerReason:{ color: '#fb923c', fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginBottom: 8 },

  overrideRow:  { marginTop: 4 },
  overrideLabel:{ color: SOL_THEME.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  overrideVal:  { fontSize: 14, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  stepRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn:      { width: 34, height: 30, borderRadius: 7, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:  { color: SOL_THEME.text, fontSize: 18, fontWeight: '700' },
  stepTrack:    { flex: 1, height: 6, borderRadius: 3, backgroundColor: SOL_THEME.border, overflow: 'hidden' },
  stepFill:     { height: 6, borderRadius: 3 },

  falsifiableRow:  { marginTop: 10 },
  falsifiableText: { fontSize: 12, fontWeight: '600' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtn:   { backgroundColor: '#2a1800', borderWidth: 1, borderColor: '#fb923c66' },
  saveBtnText:{ color: '#fb923c', fontSize: 14, fontWeight: '800' },
  cancelBtn: { borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface },
  cancelBtnText: { color: SOL_THEME.textMuted, fontSize: 14, fontWeight: '600' },

  deleteBtn:     { marginTop: 14, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: SOL_THEME.error, fontSize: 13 },
});
