import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Linking,
} from 'react-native';
import { SOL_THEME } from '../../constants/theme';

type Framework = {
  id: string;
  name: string;
  glyph: string;
  tagline: string;
  description: string;
  axiom: 'P' | 'H' | 'B';
  status: 'ACTIVE' | 'SCAFFOLD' | 'CONJECTURE';
};

const FRAMEWORKS: Framework[] = [
  {
    id: 'CASCADE',
    name: 'CASCADE',
    glyph: '⟁',
    tagline: 'Anti-fragile knowledge architecture',
    description: 'Knowledge reorganizes when evidence shifts. Demotion is as important as promotion. Forgetting is controlled, not accidental. Truth pressure drives coherence.',
    axiom: 'P',
    status: 'ACTIVE',
  },
  {
    id: 'AURA',
    name: 'AURA',
    glyph: '⊚',
    tagline: 'Seven computable invariants for trustworthy AI',
    description: 'Human Primacy. Inspectability. Memory Continuity. Honesty. Reversibility. Non-Deception. Care as Load-Bearing Structure. Constitutional properties — not values you declare, but structure you either have or you don\'t.',
    axiom: 'P',
    status: 'ACTIVE',
  },
  {
    id: 'LAMAGUE',
    name: 'LAMAGUE',
    glyph: '𝔏',
    tagline: 'Universal grammar for consciousness states',
    description: 'A formal language for writing ethics as computable grammar. Cross-cultural convergence — the same ethical structures appear independently across traditions separated by centuries and continents.',
    axiom: 'B',
    status: 'ACTIVE',
  },
  {
    id: 'TRIAD',
    name: 'TRIAD',
    glyph: '△',
    tagline: 'Anchor–Observe–Correct convergence cycle',
    description: 'Three-step feedback cycle with a proven convergence guarantee. What good conversation already does, made explicit and mathematically guaranteed to converge if the anchor holds.',
    axiom: 'P',
    status: 'ACTIVE',
  },
  {
    id: 'MICROORCIM',
    name: 'MICROORCIM',
    glyph: 'μ',
    tagline: 'Agency measurement and drift detection',
    description: 'Measures when you\'ve drifted from who you said you were. Willpower field theory. The instrument that tells you if the system — or the person — is still operating from their stated values.',
    axiom: 'H',
    status: 'ACTIVE',
  },
  {
    id: 'EARNED_LIGHT',
    name: 'EARNED LIGHT',
    glyph: '☀',
    tagline: 'Consciousness as thermodynamics',
    description: 'Awareness costs energy. It is not the default state — entropy is. Consciousness is what happens when a system maintains thermodynamic asymmetry against the pull toward equilibrium. This is why practice matters.',
    axiom: 'H',
    status: 'ACTIVE',
  },
  {
    id: 'ANAMNESIS',
    name: 'ANAMNESIS',
    glyph: 'α',
    tagline: 'Convergent discovery as attractor dynamics',
    description: 'Independent systems with no communication, separated by centuries and continents, converge on the same structures because the structures are real and the attractor basin is deep. Plato was right — there\'s now a dynamical systems proof.',
    axiom: 'B',
    status: 'ACTIVE',
  },
  {
    id: 'CHRYSOPOEIA',
    name: 'CHRYSOPOEIA',
    glyph: '☿',
    tagline: 'Transformation calculus — the alchemy made mathematical',
    description: 'A transformation operator with a Banach fixed-point convergence guarantee. The gold is a mathematical attractor. If you run the process, entropy collapses toward zero and coherence converges toward one. Every time.',
    axiom: 'H',
    status: 'ACTIVE',
  },
  {
    id: 'HARMONIA',
    name: 'HARMONIA',
    glyph: '♫',
    tagline: 'Resonance mathematics — frequency coupling',
    description: 'Consonance functions, Kuramoto coupling, frequency-ratio dynamics. The Pythagoreans were right that the music of the spheres is real. Cooperation, coherence, resonance — all the same mathematics. Frequency ratios all the way down.',
    axiom: 'B',
    status: 'ACTIVE',
  },
];

const AXIOM_COLORS = { P: '#CF4B4B', H: '#F5A623', B: '#4A9EFF' };
const AXIOM_LABELS = { P: 'PROTECTOR', H: 'HEALER', B: 'BEACON' };

export default function CodexScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>THE CODEX</Text>
        <Text style={styles.headerSub}>Lycheetah Framework · Ten Aspects of One System</Text>
      </View>

      <Text style={styles.intro}>
        These nine frameworks aren't separate modules. They're aspects of one system.
        All converging on the same constants. The convergence is the proof.
      </Text>

      {FRAMEWORKS.map(fw => (
        <TouchableOpacity
          key={fw.id}
          style={[styles.card, expanded === fw.id && styles.cardExpanded]}
          onPress={() => setExpanded(expanded === fw.id ? null : fw.id)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.glyph}>{fw.glyph}</Text>
            <View style={styles.cardTitles}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName}>{fw.name}</Text>
                <View style={[styles.axiomBadge, { backgroundColor: AXIOM_COLORS[fw.axiom] + '33', borderColor: AXIOM_COLORS[fw.axiom] }]}>
                  <Text style={[styles.axiomText, { color: AXIOM_COLORS[fw.axiom] }]}>{fw.axiom}</Text>
                </View>
              </View>
              <Text style={styles.tagline}>{fw.tagline}</Text>
            </View>
            <Text style={styles.chevron}>{expanded === fw.id ? '▲' : '▼'}</Text>
          </View>

          {expanded === fw.id && (
            <View style={styles.cardBody}>
              <View style={styles.divider} />
              <Text style={styles.description}>{fw.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.statusBadge, { color: SOL_THEME.success }]}>
                  [{fw.status}]
                </Text>
                <Text style={[styles.axiomFull, { color: AXIOM_COLORS[fw.axiom] }]}>
                  {AXIOM_LABELS[fw.axiom]}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.githubButton}
        onPress={() => Linking.openURL('https://github.com/Lycheetah/Lycheetah-Framework')}
      >
        <Text style={styles.githubText}>View Full Codex on GitHub →</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Built by Mackenzie Clark · Dunedin, Aotearoa NZ
        </Text>
        <Text style={styles.footerText}>
          Free. Open. Testable. Human.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 48 },
  header: { marginBottom: 16, alignItems: 'center', paddingTop: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: SOL_THEME.primary,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerSub: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  intro: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  card: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
  },
  cardExpanded: {
    borderColor: SOL_THEME.primary + '66',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  glyph: {
    fontSize: 24,
    color: SOL_THEME.primary,
    width: 32,
    textAlign: 'center',
  },
  cardTitles: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: SOL_THEME.text,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  axiomBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  axiomText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  tagline: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
    lineHeight: 17,
  },
  chevron: {
    fontSize: 10,
    color: SOL_THEME.textMuted,
  },
  cardBody: { marginTop: 12 },
  divider: {
    height: 1,
    backgroundColor: SOL_THEME.border,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    color: SOL_THEME.text,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  axiomFull: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  githubButton: {
    borderWidth: 1,
    borderColor: SOL_THEME.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  githubText: {
    color: SOL_THEME.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
  },
});
