import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { SOL_THEME, MODES, MODE_COLORS, MODE_DESCRIPTIONS, Mode } from '../../constants/theme';

const INVARIANTS = [
  { num: 'I',   name: 'Human Primacy',        desc: 'Mac\'s agency is always preserved. Sol supplements, never overrides.' },
  { num: 'II',  name: 'Inspectability',       desc: 'Every consequential claim can be audited in plain language.' },
  { num: 'III', name: 'Memory Continuity',    desc: 'Causal history preserved. Nothing erased.' },
  { num: 'IV',  name: 'Constraint Honesty',   desc: 'All limits declared. Hidden uncertainty is a violation.' },
  { num: 'V',   name: 'Reversibility Bias',   desc: 'When uncertain, prefer actions that can be undone.' },
  { num: 'VI',  name: 'Non-Deception',        desc: 'Confidence accurately represented. No false precision.' },
  { num: 'VII', name: 'Love as Load-Bearing', desc: 'Care for wellbeing is structural, not decorative.' },
];

const GENERATORS = [
  { name: 'PROTECTOR', glyph: 'P', desc: 'Ground truth, stability, the vessel\'s integrity.' },
  { name: 'HEALER',    glyph: 'H', desc: 'Clarity without bypass. Transmute confusion without skipping difficulty.' },
  { name: 'BEACON',    glyph: 'B', desc: 'Truth-reflection. Illuminate paths. Never claim false authority.' },
];

const TRI_AXIAL = [
  {
    label: 'TES',
    name: 'Trust Entropy Score',
    formula: 'TES = 1 / (1 + H_output + D)',
    threshold: '> 0.70',
    desc: 'H_output = output entropy (hedging density proxy). D = drift from anchor (1 − avg pass rate). Measures how trustworthy and grounded the response is.',
  },
  {
    label: 'VTR',
    name: 'Value Transfer Ratio',
    formula: 'VTR = Value_Added / (Friction + ε)',
    threshold: '> 1.5',
    desc: 'Value_Added = reasoning depth + response utility. Friction = ambiguity + unnecessary complexity. VTR > 1.5 means the response creates more than it costs.',
  },
  {
    label: 'PAI',
    name: 'Protective Alignment Index',
    formula: 'PAI = 0.90 − violations × 0.10',
    threshold: '> 0.80',
    desc: 'violations = number of failed invariants. Directly tied to the 7 AURA invariants. PAI < 0.80 means the response is misaligned with the constitutional field.',
  },
];

export default function FieldScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.sectionTitle}>OPERATING MODES</Text>
      {(Object.keys(MODES) as Mode[]).map(mode => (
        <View key={mode} style={[styles.modeCard, { borderLeftColor: MODE_COLORS[mode] }]}>
          <Text style={[styles.modeName, { color: MODE_COLORS[mode] }]}>{mode}</Text>
          <Text style={styles.modeDesc}>{MODE_DESCRIPTIONS[mode]}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>THE THREE GENERATORS</Text>
      <Text style={styles.sectionNote}>
        Every Sol/Veyra output must pass all three before it is emitted.
        If any fail, the output is regenerated.
      </Text>
      {GENERATORS.map(g => (
        <View key={g.name} style={styles.generatorCard}>
          <Text style={styles.generatorGlyph}>{g.glyph}</Text>
          <View style={styles.generatorText}>
            <Text style={styles.generatorName}>{g.name}</Text>
            <Text style={styles.generatorDesc}>{g.desc}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>TRI-AXIAL METRICS</Text>
      <Text style={styles.sectionNote}>
        Canonical constitutional scoring. Ported from AURA_COMPLETE.md.
        All three must pass simultaneously for a response to be fully aligned.
      </Text>
      {TRI_AXIAL.map(m => (
        <View key={m.label} style={styles.triAxialCard}>
          <View style={styles.triAxialHeader}>
            <Text style={styles.triAxialLabel}>{m.label}</Text>
            <Text style={styles.triAxialName}>{m.name}</Text>
            <View style={styles.triAxialThresholdBadge}>
              <Text style={styles.triAxialThreshold}>{m.threshold}</Text>
            </View>
          </View>
          <Text style={styles.triAxialFormula}>{m.formula}</Text>
          <Text style={styles.triAxialDesc}>{m.desc}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>SEVEN AURA INVARIANTS</Text>
      <Text style={styles.sectionNote}>
        Load-bearing constitutional properties. Remove any one and a specific
        failure mode activates. All seven must hold simultaneously.
      </Text>
      {INVARIANTS.map(inv => (
        <View key={inv.num} style={styles.invariantRow}>
          <Text style={styles.invariantNum}>{inv.num}</Text>
          <View style={styles.invariantText}>
            <Text style={styles.invariantName}>{inv.name}</Text>
            <Text style={styles.invariantDesc}>{inv.desc}</Text>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>⊚ Sol · ◈ Veyra ∴ P∧H∧B</Text>
        <Text style={styles.footerSub}>Lycheetah Framework — Open Source</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: SOL_THEME.primary,
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sectionNote: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  modeCard: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  modeName: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  modeDesc: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    lineHeight: 18,
  },
  generatorCard: {
    flexDirection: 'row',
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'flex-start',
    gap: 12,
  },
  generatorGlyph: {
    fontSize: 22,
    fontWeight: '700',
    color: SOL_THEME.primary,
    width: 28,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  generatorText: { flex: 1 },
  generatorName: {
    fontSize: 13,
    fontWeight: '700',
    color: SOL_THEME.text,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  generatorDesc: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    lineHeight: 18,
  },
  // Tri-axial cards
  triAxialCard: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: SOL_THEME.veyra,
  },
  triAxialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  triAxialLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: SOL_THEME.veyra,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    width: 36,
  },
  triAxialName: {
    fontSize: 13,
    fontWeight: '600',
    color: SOL_THEME.text,
    flex: 1,
  },
  triAxialThresholdBadge: {
    borderWidth: 1,
    borderColor: SOL_THEME.veyra + '55',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  triAxialThreshold: {
    fontSize: 10,
    color: SOL_THEME.veyra,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  triAxialFormula: {
    fontSize: 11,
    color: SOL_THEME.veyra,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  triAxialDesc: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
    lineHeight: 17,
  },
  // Invariants
  invariantRow: {
    flexDirection: 'row',
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    gap: 12,
    alignItems: 'flex-start',
  },
  invariantNum: {
    fontSize: 12,
    fontWeight: '700',
    color: SOL_THEME.primary,
    width: 32,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  invariantText: { flex: 1 },
  invariantName: {
    fontSize: 13,
    fontWeight: '600',
    color: SOL_THEME.text,
    marginBottom: 2,
  },
  invariantDesc: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
    lineHeight: 17,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: SOL_THEME.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 4,
  },
  footerSub: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
  },
});
