import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BREATH_PHASES = [
  { label: 'Breathe in',  duration: 4000, scale: 1.3 },
  { label: 'Hold',        duration: 4000, scale: 1.3 },
  { label: 'Breathe out', duration: 4000, scale: 0.7 },
  { label: 'Hold',        duration: 4000, scale: 0.7 },
] as const;

const GROUNDING_STEPS = [
  'Feel your feet on the floor.',
  'Name 3 things you can see right now.',
  'You are here. The session is complete.',
];

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function ReturnToBody({ visible, onDismiss }: Props) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [step, setStep] = useState(0);
  const circleAnim = useRef(new Animated.Value(0.7)).current;
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      clearTimeout(phaseTimer.current ?? undefined);
      setPhaseIdx(0);
      setStep(0);
      Animated.timing(circleAnim, { toValue: 0.7, duration: 300, useNativeDriver: true }).start();
      return;
    }
    const runPhase = (i: number) => {
      const phase = BREATH_PHASES[i];
      Animated.timing(circleAnim, { toValue: phase.scale, duration: phase.duration * 0.85, useNativeDriver: true }).start();
      setPhaseIdx(i);
      phaseTimer.current = setTimeout(() => runPhase((i + 1) % BREATH_PHASES.length), phase.duration);
    };
    runPhase(0);
    return () => clearTimeout(phaseTimer.current ?? undefined);
  }, [visible]);

  const phase = BREATH_PHASES[phaseIdx];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <View style={s.overlay}>
        <View style={s.card}>
          <Text style={s.eyebrow}>GROUNDING</Text>
          <Text style={s.title}>That was a deep one.</Text>
          <Text style={s.subtitle}>30 seconds to land.</Text>

          <View style={s.breathOuter}>
            <Animated.View style={[s.breathCircle, { transform: [{ scale: circleAnim }] }]} />
          </View>
          <Text style={s.phaseLabel}>{phase.label}</Text>
          <Text style={s.breathSub}>4 · 4 · 4 · 4</Text>

          <View style={s.groundBlock}>
            {GROUNDING_STEPS.map((text, i) => (
              <Text key={i} style={[s.groundText, i < step ? s.groundDone : i === step ? s.groundActive : s.groundPending]}>
                {i < step ? '✓ ' : '· '}{text}
              </Text>
            ))}
          </View>

          {step < GROUNDING_STEPS.length ? (
            <TouchableOpacity style={s.stepBtn} onPress={() => setStep(s => Math.min(s + 1, GROUNDING_STEPS.length))} activeOpacity={0.7}>
              <Text style={s.stepBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.dismissBtn} onPress={onDismiss} activeOpacity={0.8}>
              <Text style={s.dismissText}>I'm grounded ⊚</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onDismiss} style={s.skipLink}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000E8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#080810',
    borderWidth: 1,
    borderColor: '#1A1A2E',
    padding: 28,
    alignItems: 'center',
  },
  eyebrow: {
    color: '#3D3050',
    fontSize: 9,
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 10,
  },
  title: {
    color: '#F5E6C8',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6B5E7A',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  breathOuter: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  breathCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED18',
    borderWidth: 1.5,
    borderColor: '#A855F766',
  },
  phaseLabel: {
    color: '#C084FC',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breathSub: {
    color: '#3D3050',
    fontSize: 11,
    letterSpacing: 3,
    marginBottom: 24,
  },
  groundBlock: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  groundText: {
    fontSize: 13,
    lineHeight: 20,
  },
  groundActive: {
    color: '#F5E6C8',
  },
  groundDone: {
    color: '#4CAF50',
  },
  groundPending: {
    color: '#333344',
  },
  stepBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1A0E2A',
    borderWidth: 1,
    borderColor: '#A855F744',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepBtnText: {
    color: '#C084FC',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A0E2A',
    borderWidth: 1.5,
    borderColor: '#A855F7',
    alignItems: 'center',
    marginBottom: 8,
  },
  dismissText: {
    color: '#E8C76A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  skipLink: {
    paddingVertical: 6,
  },
  skipText: {
    color: '#2A2A3A',
    fontSize: 11,
  },
});
