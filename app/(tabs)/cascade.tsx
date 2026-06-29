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
import { auditCascadeBlock, applyVerdict, quickBuildBlock, type CascadeVerdict } from '../../lib/intelligence/cascade-judge';

const DISPLAY_MODE = 'composite' as const;
const STEP = 5;
const PRESSURE_AXIOM_MIN = 50;
const PRESSURE_COHERENCE_MAX = 40;
const PYRAMID_ROWS = [1, 2, 3, 4, 5];
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
const LAYER_GROUP: Record<number, string> = {
  0: 'CORE', 1: 'CORE', 2: 'CORE',
  3: 'MIDDLE', 4: 'MIDDLE', 5: 'MIDDLE',
  6: 'EDGE', 7: 'EDGE', 8: 'EDGE',
};
const GROUP_COLOR: Record<string, string> = {
  CORE: '#fb923c', MIDDLE: '#facc15', EDGE: '#c084fc',
};

export default function CascadeBuilderScreen() {
  const [blocks, setBlocks]     = useState<CascadeBlock[]>([]);
  const [editing, setEditing]   = useState<CascadeBlock | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scoring, setScoring]   = useState(false);
  const [audit, setAudit]       = useState<{ weakest?: string; objection?: string } | null>(null);
  const [scoreErr, setScoreErr] = useState<string | null>(null);
  const [reasons, setReasons]   = useState<string[]>([]);
  const [building, setBuilding] = useState(false);
  const [viewMode, setViewMode] = useState<'pyramid' | 'list'>('pyramid');

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

  const runQuickBuild = async () => {
    if (!editing || building || !editing.claim.trim()) return;
    setBuilding(true); setScoreErr(null); setAudit(null); setReasons([]);
    try {
      const result = await quickBuildBlock(editing.claim);
      if (!result) { setScoreErr('Quick Build unreachable — add content manually and hit Score.'); return; }
      setEditing(prev => {
        if (!prev) return prev;
        const layers = prev.layers.map((l, i) => ({
          ...l,
          content: result.layers[i]?.content || l.content,
          framework_score: result.layers[i]?.score ?? 0,
          ...(i === 0 ? { falsifiable: result.falsifiable } : {}),
        }));
        return { ...prev, layers };
      });
    } finally {
      setBuilding(false);
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

        <View style={s.editorHeader}>
          <TouchableOpacity onPress={() => setEditing(null)} style={s.backBtn}>
            <Text style={s.backBtnText}>← PYRAMID</Text>
          </TouchableOpacity>
          <Text style={s.editorKicker}>CASCADE · BLOCK</Text>
        </View>

        <TextInput
          style={[s.claimInput, { borderColor: bandColor + '44' }]}
          placeholder="The claim — your core statement…"
          placeholderTextColor={SOL_THEME.textMuted}
          value={editing.claim}
          onChangeText={t => setEditing({ ...editing, claim: t })}
          multiline
        />

        <View style={s.fillRow}>
          <Text style={s.fillLabel}>{live!.filled}/9 LAYERS FILLED</Text>
          <View style={s.fillTrack}>
            <View style={[s.fillBar, { width: `${(live!.filled / 9) * 100}%`, backgroundColor: bandColor }]} />
          </View>
        </View>

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

        <TouchableOpacity
          style={[s.quickBuildBtn, (building || scoring || !editing.claim.trim()) && s.btnBusy]}
          onPress={runQuickBuild}
          disabled={building || scoring || !editing.claim.trim()}
          activeOpacity={0.75}
        >
          <Text style={s.quickBuildBtnText}>
            {building ? '⚡ building all 9 layers…' : '⚡ Quick Build — Sol writes all layers from your claim'}
          </Text>
        </TouchableOpacity>

        <View style={s.scoreRow}>
          <TouchableOpacity style={[s.scoreBtn, (scoring || building) && s.btnBusy]} onPress={() => runScore('score')} disabled={scoring || building}>
            <Text style={s.scoreBtnText}>{scoring ? '⊚ scoring…' : live!.scored ? '⊚ Re-score' : '⊚ Score'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.auditBtn, (scoring || building) && s.btnBusy]} onPress={() => runScore('audit')} disabled={scoring || building}>
            <Text style={s.auditBtnText}>⚔ Audit</Text>
          </TouchableOpacity>
        </View>

        {scoreErr && <Text style={s.scoreErr}>{scoreErr}</Text>}

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

  const shadow       = blocks.map(b => ({ ...b, score_aggregate: effAgg(b) }));
  const tensions     = detectTensions(shadow);
  const worstTension = tensions.length > 0
    ? tensions.reduce((a, b) => a.delta > b.delta ? a : b)
    : null;

  const expandedBlock = expanded ? (blocks.find(b => b.id === expanded) ?? null) : null;
  const expScore = expandedBlock ? effAgg(expandedBlock) : 0;
  const expBand  = getScoreBand(expScore);
  const expPi    = expandedBlock ? computePi(expandedBlock.layers, effMode(expandedBlock)) : 0;

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>

      {/* Header with inline Add button */}
      <View style={s.headerRow}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
            <Text style={s.title}>CASCADE</Text>
            <Text style={{ color: '#fb923c88', fontSize: 18, fontWeight: '800' }}>△</Text>
          </View>
          <Text style={s.subtitle}>
            {blocks.length === 0
              ? 'truth pressure engine · add your first block'
              : `truth pressure engine · ${blocks.length} block${blocks.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {blocks.length > 0 && (
            <View style={s.viewToggle}>
              <TouchableOpacity
                onPress={() => setViewMode('pyramid')}
                style={[s.viewToggleBtn, viewMode === 'pyramid' && s.viewToggleBtnActive]}
              >
                <Text style={[s.viewToggleText, viewMode === 'pyramid' && s.viewToggleTextActive]}>△</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={[s.viewToggleBtn, viewMode === 'list' && s.viewToggleBtnActive]}
              >
                <Text style={[s.viewToggleText, viewMode === 'list' && s.viewToggleTextActive]}>≡</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={s.addBtnInline} onPress={() => setEditing(createEmptyBlock())}>
            <Text style={s.addBtnInlineText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

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

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' && blocks.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          {sorted.map(b => {
            const score    = effAgg(b);
            const band     = getScoreBand(score);
            const pressure = blockUnderPressure(b);
            const bPi      = computePi(b.layers, effMode(b));
            return (
              <TouchableOpacity
                key={b.id}
                style={[s.listRow, { borderLeftColor: band.textColor }, pressure && s.blockPressure]}
                onPress={() => { setEditing(b); }}
                activeOpacity={0.75}
              >
                <View style={[s.listScoreBadge, { backgroundColor: band.textColor + '22', borderColor: band.textColor + '55' }]}>
                  <Text style={[s.listScore, { color: band.textColor }]}>{score || '—'}</Text>
                  <Text style={[s.listBand, { color: band.textColor + '99' }]}>{band.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listClaim} numberOfLines={3}>{b.claim || '(no claim — tap to edit)'}</Text>
                  <Text style={[s.listMeta, { color: piBand(bPi).color }]}>
                    Π {bPi} · {piBand(bPi).label} PRESSURE{pressure ? '  ⚡' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── PYRAMID VIEW ──────────────────────────────────────────────────── */}

      {/* HERO TENSION — biggest contradiction at the top */}
      {viewMode === 'pyramid' && worstTension !== null && (
        <View style={s.heroTension}>
          <View style={s.heroTensionHeader}>
            <Text style={s.heroTensionKicker}>⚡ BIGGEST CONTRADICTION</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.heroTensionDelta}>{worstTension.delta} pts apart</Text>
              {tensions.length > 1 && (
                <Text style={{ color: '#fb923c66', fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 }}>
                  +{tensions.length - 1} more
                </Text>
              )}
            </View>
          </View>
          <Text style={s.heroTensionClaim} numberOfLines={2}>
            {blocks.find(x => x.id === worstTension.stronger.id)?.claim ?? 'untitled'}
          </Text>
          <View style={s.heroTensionArrowRow}>
            <View style={s.heroTensionLine} />
            <Text style={s.heroTensionArrow}>⟷</Text>
            <View style={s.heroTensionLine} />
          </View>
          <Text style={s.heroTensionClaim} numberOfLines={2}>
            {blocks.find(x => x.id === worstTension.weaker.id)?.claim ?? 'untitled'}
          </Text>
          <Text style={s.heroTensionSub}>This is where your pyramid is weakest.</Text>
        </View>
      )}

      {/* PYRAMID visual */}
      {viewMode === 'pyramid' && pyramidRows.length > 0 && (
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
                    const score      = effAgg(b);
                    const band       = getScoreBand(score);
                    const pressure   = blockUnderPressure(b);
                    const isApex     = ri === 0;
                    const isExpanded = expanded === b.id;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        activeOpacity={0.72}
                        onPress={() => setExpanded(isExpanded ? null : b.id)}
                        style={[
                          s.pBlock,
                          ri === 0 && s.pBlockApex,
                          ri === 1 && s.pBlockRow1,
                          ri === 2 && s.pBlockRow2,
                          ri === 3 && s.pBlockRow3,
                          ri >= 4  && s.pBlockRow4,
                          {
                            borderColor: isExpanded
                              ? band.textColor + 'bb'
                              : pressure ? '#fb923c88' : band.textColor + '44',
                            backgroundColor: isExpanded
                              ? band.textColor + '28'
                              : band.textColor + (ri <= 1 ? '18' : '11'),
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
                          <Text style={s.pClaimXs} numberOfLines={1}>{b.claim}</Text>
                        )}
                        {ri === 3 && (
                          <Text style={s.pClaimTiny} numberOfLines={1}>{b.claim}</Text>
                        )}
                        {ri >= 4 && (
                          <Text style={s.pClaimTiny} numberOfLines={1}>{b.claim}</Text>
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

      {/* EXPANDED BLOCK DETAIL — tap any block to see full claim + 9-layer breakdown */}
      {viewMode === 'pyramid' && expandedBlock !== null && (
        <View style={[s.expandedCard, { borderColor: expBand.textColor + '55' }]}>
          <View style={s.expandedHeader}>
            <View>
              <Text style={[s.expandedBandLabel, { color: expBand.textColor }]}>
                {expBand.label} · {expScore}
              </Text>
              <Text style={[s.expandedPiLabel, { color: piBand(expPi).color }]}>
                Π {expPi} · {piBand(expPi).label} PRESSURE
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity
                style={s.expandedDeleteBtn}
                onPress={async () => {
                  const next = await deleteBlock(expandedBlock.id);
                  setBlocks(next);
                  setExpanded(null);
                }}
              >
                <Text style={s.expandedDeleteBtnText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.expandedEditBtn}
                onPress={() => { setEditing(expandedBlock); setExpanded(null); }}
              >
                <Text style={s.expandedEditBtnText}>Edit →</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={s.expandedClaim}>{expandedBlock.claim || '(no claim set — tap Edit to add one)'}</Text>
          <Text style={s.expandedLayersLabel}>9-LAYER BREAKDOWN</Text>
          {expandedBlock.layers.map((l, i) => {
            const lScore = l.framework_score || l.sovereign_score || 0;
            const lBand  = getScoreBand(lScore);
            const gColor = GROUP_COLOR[LAYER_GROUP[i]];
            return (
              <View key={i} style={s.expandedLayerRow}>
                <Text style={[s.expandedLayerName, { color: gColor }]} numberOfLines={1}>
                  {ONION_LAYERS[i].name.slice(0, 16)}
                </Text>
                <View style={s.expandedLayerTrack}>
                  {lScore > 0 && (
                    <View style={[s.expandedLayerFill, { width: `${lScore}%`, backgroundColor: lBand.textColor + '99' }]} />
                  )}
                </View>
                <Text style={[s.expandedLayerVal, { color: lScore > 0 ? lBand.textColor : SOL_THEME.textMuted }]}>
                  {lScore > 0 ? lScore : '—'}
                </Text>
              </View>
            );
          })}
          {blockUnderPressure(expandedBlock) && (
            <Text style={s.expandedPressureNote}>⚡ Under truth pressure — axiom strong, coherence low</Text>
          )}
        </View>
      )}

      {/* Overflow blocks beyond 15 — pyramid mode only */}
      {viewMode === 'pyramid' && overflow.map(b => {
        const score      = effAgg(b);
        const band       = getScoreBand(score);
        const pressure   = blockUnderPressure(b);
        const bPi        = computePi(b.layers, effMode(b));
        const isExpanded = expanded === b.id;
        return (
          <TouchableOpacity
            key={b.id}
            style={[
              s.blockRow,
              { borderLeftColor: band.textColor },
              pressure && s.blockPressure,
              isExpanded && { borderLeftWidth: 4 },
            ]}
            onPress={() => setExpanded(isExpanded ? null : b.id)}
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

      {/* Clear all — shown when blocks exist so user can wipe the seed pyramid */}
      {blocks.length > 0 && (
        <TouchableOpacity
          style={s.clearAllBtn}
          onPress={async () => {
            for (const b of blocks) await deleteBlock(b.id);
            setBlocks([]);
            setExpanded(null);
          }}
        >
          <Text style={s.clearAllText}>Clear all blocks</Text>
        </TouchableOpacity>
      )}

      {/* Empty state */}
      {blocks.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyGlyph}>△</Text>
          <Text style={s.emptyTitle}>Your pyramid is empty</Text>
          <Text style={s.emptyBody}>
            Add your first knowledge block — a claim you believe to be true.
            Sol scores it across 9 layers. Your pyramid builds itself.
          </Text>
          <TouchableOpacity style={s.emptyAddBtn} onPress={() => setEditing(createEmptyBlock())}>
            <Text style={s.emptyAddBtnText}>+ Add first block</Text>
          </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  title:    { color: SOL_THEME.text, fontSize: 30, fontWeight: '800', letterSpacing: 2 },
  subtitle: { color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2, letterSpacing: 0.5 },

  addBtnInline: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    borderColor: '#fb923c55', backgroundColor: '#1a0e00',
  },
  addBtnInlineText: { color: '#fb923c', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  // ── Pyramid score bar ───────────────────────────────────────────────────
  pyramidBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16,
  },
  pyramidScore:      { fontSize: 30, fontWeight: '800' },
  pyramidBandLabel:  { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: 1 },
  pyramidBarDivider: { width: 1, height: 36, backgroundColor: '#ffffff11' },
  pyramidBarTitle:   { color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  pyramidPi:         { fontSize: 12, fontWeight: '700', marginTop: 3 },

  // ── Hero tension card ───────────────────────────────────────────────────
  heroTension: {
    marginBottom: 16, padding: 16,
    borderRadius: 14, borderWidth: 1,
    borderColor: '#fb923c99', backgroundColor: '#0D0500',
    borderTopWidth: 2, borderTopColor: '#fb923c',
  },
  heroTensionHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 14,
  },
  heroTensionKicker: {
    color: '#fb923c', fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
  },
  heroTensionDelta: {
    color: '#fb923c', fontSize: 15, fontWeight: '800',
  },
  heroTensionClaim: {
    color: SOL_THEME.text, fontSize: 14, fontWeight: '600',
    lineHeight: 20, marginBottom: 6,
  },
  heroTensionArrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8,
  },
  heroTensionLine: {
    flex: 1, height: 1, backgroundColor: '#fb923c33',
  },
  heroTensionArrow: {
    color: '#fb923c88', fontSize: 16,
  },
  heroTensionSub: {
    color: SOL_THEME.textMuted, fontSize: 11,
    marginTop: 10, lineHeight: 16, fontStyle: 'italic',
  },

  // ── Pyramid visual ──────────────────────────────────────────────────────
  pyramidWrap:       { marginBottom: 16 },
  pyramidTopLabel:   { color: '#fb923c55', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textAlign: 'right', marginBottom: 6 },
  pyramidBottomLabel:{ color: '#c084fc55', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textAlign: 'right', marginTop: 6 },
  pyramidRowWrap:    { marginBottom: 5 },
  rowTierLabel:      { fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3, textAlign: 'right' },
  pyramidRow:        { flexDirection: 'row', justifyContent: 'center', gap: 5 },

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

  pScore:     { fontWeight: '800', fontSize: 20, textAlign: 'center' },
  pClaim:     { color: '#C4B8AE99', fontSize: 8, textAlign: 'center', marginTop: 4, lineHeight: 12 },
  pClaimXs:   { color: '#9890A099', fontSize: 7, textAlign: 'center', marginTop: 3 },
  pClaimTiny: { color: '#887E9088', fontSize: 6, textAlign: 'center', marginTop: 2 },
  pPressure:  { color: '#fb923c', fontSize: 7, marginTop: 2 },

  // ── Expanded block detail ───────────────────────────────────────────────
  expandedCard: {
    marginBottom: 16, padding: 16,
    borderRadius: 14, borderWidth: 1,
    backgroundColor: SOL_THEME.surface,
  },
  expandedHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  expandedBandLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  expandedPiLabel:   { fontSize: 11, fontWeight: '700', marginTop: 3 },
  expandedEditBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1,
    borderColor: '#fb923c55', backgroundColor: '#1a0e00',
  },
  expandedEditBtnText: { color: '#fb923c', fontSize: 12, fontWeight: '700' },
  expandedDeleteBtn: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1,
    borderColor: '#f8717144', backgroundColor: '#1a0505',
    alignItems: 'center', justifyContent: 'center',
  },
  expandedDeleteBtnText: { color: '#f87171', fontSize: 13, fontWeight: '700' },
  expandedClaim: {
    color: SOL_THEME.text, fontSize: 14, fontWeight: '600',
    lineHeight: 21, marginBottom: 14,
  },
  expandedLayersLabel: {
    color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '800',
    letterSpacing: 1.5, marginBottom: 8,
  },
  expandedLayerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 5,
  },
  expandedLayerName:  { fontSize: 10, fontWeight: '700', width: 90 },
  expandedLayerTrack: {
    flex: 1, height: 5, borderRadius: 3,
    backgroundColor: SOL_THEME.border, overflow: 'hidden',
  },
  expandedLayerFill:  { height: 5, borderRadius: 3 },
  expandedLayerVal:   { fontSize: 11, fontWeight: '700', minWidth: 22, textAlign: 'right' },
  expandedPressureNote: {
    color: '#fb923c', fontSize: 11, marginTop: 10, fontStyle: 'italic',
  },

  // ── Overflow / flat list ────────────────────────────────────────────────
  blockRow:      { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, borderLeftWidth: 3, backgroundColor: SOL_THEME.surface, marginBottom: 8 },
  blockPressure: { borderWidth: 1, borderColor: '#fb923c44' },
  blockClaim:    { color: SOL_THEME.text, fontSize: 14, fontWeight: '600' },
  blockMeta:     { fontSize: 11, marginTop: 3, letterSpacing: 0.5 },
  blockScore:    { fontSize: 22, fontWeight: '800', marginLeft: 12 },

  // ── Empty state ─────────────────────────────────────────────────────────
  emptyState:    { alignItems: 'center', paddingVertical: 48 },
  emptyGlyph:    { fontSize: 42, marginBottom: 14, color: '#fb923c44' },
  emptyTitle:    { color: SOL_THEME.text, fontSize: 18, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  emptyBody:     { color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 300, marginBottom: 24 },
  emptyAddBtn:   { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: '#fb923c66', backgroundColor: '#1a0e00' },
  emptyAddBtnText: { color: '#fb923c', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

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
  readoutHint:  { color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 0.5, marginTop: 4, opacity: 0.6 },
  pressureFlag: { color: '#fb923c', fontSize: 18, fontWeight: '800' },

  scoreRow:     { flexDirection: 'row', gap: 8, marginBottom: 8 },
  scoreBtn:     { flex: 1, padding: 13, borderRadius: 10, alignItems: 'center', backgroundColor: '#2a1800', borderWidth: 1, borderColor: '#fb923c66' },
  auditBtn:     { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#f8717166', backgroundColor: '#2a0a0a' },
  btnBusy:      { opacity: 0.45 },
  scoreBtnText: { color: '#fb923c', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  auditBtnText: { color: '#f87171', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  scoreErr:     { color: '#f87171', fontSize: 12, marginBottom: 10 },

  auditCard:      { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#f8717144', backgroundColor: '#f871710A', marginBottom: 14 },
  auditCardTitle: { color: '#f87171', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  auditWeak:      { color: SOL_THEME.text, fontSize: 13, marginBottom: 6 },
  auditObjection: { color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20, fontStyle: 'italic' },

  layerGroupLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 16, marginBottom: 6 },
  layerCard:  { padding: 12, borderRadius: 10, borderWidth: 1, backgroundColor: SOL_THEME.surface, marginBottom: 8 },
  layerHead:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  layerIndex: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  layerName:  { color: SOL_THEME.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  layerVal:   { fontSize: 18, fontWeight: '800', marginTop: 2 },
  layerDesc:  { color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  layerInput: { color: SOL_THEME.text, fontSize: 13, borderWidth: 1, borderColor: SOL_THEME.border, borderRadius: 8, padding: 10, minHeight: 40, marginBottom: 8 },
  layerReason:{ color: '#fb923c', fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginBottom: 8 },

  overrideRow:   { marginTop: 4 },
  overrideLabel: { color: SOL_THEME.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  overrideVal:   { fontSize: 14, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  stepRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn:       { width: 34, height: 30, borderRadius: 7, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText:   { color: SOL_THEME.text, fontSize: 18, fontWeight: '700' },
  stepTrack:     { flex: 1, height: 6, borderRadius: 3, backgroundColor: SOL_THEME.border, overflow: 'hidden' },
  stepFill:      { height: 6, borderRadius: 3 },

  falsifiableRow:  { marginTop: 10 },
  falsifiableText: { fontSize: 12, fontWeight: '600' },

  actionRow:    { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn:    { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtn:      { backgroundColor: '#2a1800', borderWidth: 1, borderColor: '#fb923c66' },
  saveBtnText:  { color: '#fb923c', fontSize: 14, fontWeight: '800' },
  cancelBtn:    { borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface },
  cancelBtnText:{ color: SOL_THEME.textMuted, fontSize: 14, fontWeight: '600' },

  deleteBtn:     { marginTop: 14, padding: 12, alignItems: 'center' },
  deleteBtnText: { color: SOL_THEME.error, fontSize: 13 },

  clearAllBtn:  { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  clearAllText: { color: SOL_THEME.textMuted, fontSize: 11, opacity: 0.5 },

  // ── View toggle ──────────────────────────────────────────────────────────
  viewToggle: {
    flexDirection: 'row', borderRadius: 8, borderWidth: 1,
    borderColor: '#fb923c33', overflow: 'hidden',
  },
  viewToggleBtn:        { paddingHorizontal: 12, paddingVertical: 6 },
  viewToggleBtnActive:  { backgroundColor: '#fb923c22' },
  viewToggleText:       { color: '#fb923c55', fontSize: 15, fontWeight: '800' },
  viewToggleTextActive: { color: '#fb923c' },

  // ── List view ────────────────────────────────────────────────────────────
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderLeftWidth: 3,
    backgroundColor: SOL_THEME.surface, marginBottom: 8,
  },
  listScoreBadge: {
    alignItems: 'center', justifyContent: 'center',
    width: 52, height: 52, borderRadius: 10, borderWidth: 1,
  },
  listScore:  { fontSize: 20, fontWeight: '800' },
  listBand:   { fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 1 },
  listClaim:  { color: SOL_THEME.text, fontSize: 13, fontWeight: '600', lineHeight: 19, marginBottom: 3 },
  listMeta:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ── Quick Build button ───────────────────────────────────────────────────
  quickBuildBtn: {
    paddingVertical: 14, alignItems: 'center', borderRadius: 10,
    backgroundColor: '#1a0800', borderWidth: 1,
    borderColor: '#fb923c88', marginBottom: 8,
  },
  quickBuildBtnText: {
    color: '#fb923c', fontSize: 12, fontWeight: '800', letterSpacing: 0.5,
  },
});
