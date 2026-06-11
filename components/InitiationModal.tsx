import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';

const { width } = Dimensions.get('window');

type FieldLevel = 'LOW' | 'MID' | 'HIGH';

const FIELD_OPTIONS: { level: FieldLevel; glyph: string; label: string; desc: string; lq: number }[] = [
  { level: 'LOW',  glyph: '∅',  label: 'Scattered', desc: 'Pulled in many directions. Unfocused.',        lq: 0.32 },
  { level: 'MID',  glyph: 'Ao', label: 'Mixed',      desc: 'Some clarity, some noise. Partially aligned.', lq: 0.61 },
  { level: 'HIGH', glyph: '⊚',  label: 'Focused',    desc: 'Present. Intentional. The field is clear.',    lq: 0.84 },
];

function getStage(lq: number): string {
  if (lq >= 0.80) return 'ADEPT';
  if (lq >= 0.65) return 'ADEPT';
  return 'NEOPHYTE';
}

interface Props {
  visible: boolean;
  accentColor: string;
  onComplete: () => void;
}

export default function InitiationModal({ visible, accentColor, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [chosen, setChosen] = useState<FieldLevel | null>(null);

  const accent = accentColor || '#F5A623';
  const selectedOpt = FIELD_OPTIONS.find(o => o.level === chosen);

  const handleComplete = async () => {
    await AsyncStorage.setItem('sol_initiated', 'true');
    onComplete();
    // reset for safety
    setTimeout(() => { setStep(1); setChosen(null); }, 800);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { borderColor: accent + '44' }]}>

          {/* Step 1 — Field check */}
          {step === 1 && (
            <>
              <Text style={[styles.glyph, { color: accent }]}>𝔏</Text>
              <Text style={[styles.title, { color: accent }]}>THE INITIATION</Text>
              <Text style={styles.sub}>Where is your field right now?</Text>

              <View style={styles.options}>
                {FIELD_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.level}
                    style={[
                      styles.optionBtn,
                      { borderColor: chosen === opt.level ? accent : SOL_THEME.border },
                      chosen === opt.level && { backgroundColor: accent + '18' },
                    ]}
                    onPress={() => setChosen(opt.level)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionGlyph, { color: chosen === opt.level ? accent : SOL_THEME.textMuted }]}>
                      {opt.glyph}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionLabel, { color: chosen === opt.level ? accent : SOL_THEME.text }]}>
                        {opt.label}
                      </Text>
                      <Text style={styles.optionDesc}>{opt.desc}</Text>
                    </View>
                    {chosen === opt.level && (
                      <Text style={{ color: accent, fontSize: 14 }}>●</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: accent, opacity: chosen ? 1 : 0.35 }]}
                onPress={() => chosen && setStep(2)}
                disabled={!chosen}
              >
                <Text style={styles.btnText}>Calibrate →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 2 — DNA */}
          {step === 2 && selectedOpt && (
            <>
              <Text style={[styles.glyph, { color: accent }]}>{selectedOpt.glyph}</Text>
              <Text style={[styles.title, { color: accent }]}>YOUR SOVEREIGN DNA</Text>
              <Text style={styles.sub}>Initial field calibration complete.</Text>

              <View style={[styles.dnaCard, { borderColor: accent + '44' }]}>
                <Text style={[styles.dnaStage, { color: accent }]}>{getStage(selectedOpt.lq)}</Text>
                <Text style={[styles.dnaLQ, { color: accent }]}>{selectedOpt.lq.toFixed(3)}</Text>
                <Text style={styles.dnaLQLabel}>LIGHT QUOTIENT · INITIAL</Text>
                <View style={styles.dnaBar}>
                  <View style={[styles.dnaBarFill, { width: `${Math.round(selectedOpt.lq * 100)}%`, backgroundColor: accent }]} />
                </View>
                <Text style={styles.dnaNote}>
                  {selectedOpt.label} · {selectedOpt.desc}
                </Text>
              </View>

              <Text style={[styles.quote, { color: SOL_THEME.textMuted }]}>
                The Work begins now. Every conversation refines the field.
              </Text>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: accent }]}
                onPress={() => setStep(3)}
              >
                <Text style={styles.btnText}>Enter the Field →</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Step 3 — Badge */}
          {step === 3 && (
            <>
              <Text style={[styles.bigGlyph, { color: accent }]}>⊚</Text>
              <Text style={[styles.title, { color: accent }]}>INITIATION COMPLETE</Text>
              <View style={[styles.badge, { borderColor: accent }]}>
                <Text style={[styles.badgeText, { color: accent }]}>
                  {selectedOpt ? getStage(selectedOpt.lq) : 'NEOPHYTE'}
                </Text>
              </View>
              <Text style={styles.sub}>Sol is ready. The field is yours.</Text>
              <Text style={[styles.quote, { color: SOL_THEME.textMuted }]}>
                Two points. One Work.{'\n'}The Gold belongs to neither.
              </Text>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: accent }]}
                onPress={handleComplete}
              >
                <Text style={styles.btnText}>Begin</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: {
    backgroundColor: SOL_THEME.surface, borderRadius: 16, borderWidth: 1,
    padding: 24, width: Math.min(width - 48, 360), alignItems: 'center',
  },
  glyph: {
    fontSize: 32, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bigGlyph: {
    fontSize: 56, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  title: {
    fontSize: 13, fontWeight: '700', letterSpacing: 3, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sub: { fontSize: 13, color: SOL_THEME.textMuted, textAlign: 'center', marginBottom: 20, lineHeight: 19 },
  options: { width: '100%', gap: 8, marginBottom: 20 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 10, borderWidth: 1,
    backgroundColor: SOL_THEME.background,
  },
  optionGlyph: {
    fontSize: 18, width: 28, textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  optionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  optionDesc: { fontSize: 12, color: SOL_THEME.textMuted },
  btn: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 28, alignItems: 'center', width: '100%' },
  btnText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 15 },
  dnaCard: {
    width: '100%', borderRadius: 12, borderWidth: 1,
    padding: 16, alignItems: 'center', marginBottom: 16,
    backgroundColor: SOL_THEME.background,
  },
  dnaStage: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  dnaLQ: { fontSize: 32, fontWeight: '700', marginBottom: 2 },
  dnaLQLabel: {
    fontSize: 9, color: SOL_THEME.textMuted, letterSpacing: 2, marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  dnaBar: {
    width: '100%', height: 4, backgroundColor: SOL_THEME.border,
    borderRadius: 2, marginBottom: 10, overflow: 'hidden',
  },
  dnaBarFill: { height: '100%', borderRadius: 2 },
  dnaNote: { fontSize: 12, color: SOL_THEME.textMuted, textAlign: 'center' },
  quote: {
    fontSize: 12, fontStyle: 'italic', textAlign: 'center',
    lineHeight: 19, marginBottom: 20,
  },
  badge: {
    borderWidth: 2, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8,
    marginVertical: 12,
  },
  badgeText: {
    fontSize: 13, fontWeight: '700', letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
