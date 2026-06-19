import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  Animated,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { CareEvents } from '../lib/care-events';

type CareLevel = 'NEUTRAL' | 'HOLDING' | 'ELEVATED' | 'CRISIS';

const PHASES = [
  { key: 'in',       label: 'Breathe in...',  duration: 4000, scale: 1.35 },
  { key: 'hold-in',  label: 'Hold...',         duration: 4000, scale: 1.35 },
  { key: 'out',      label: 'Breathe out...',  duration: 4000, scale: 0.65 },
  { key: 'hold-out', label: 'Hold...',         duration: 4000, scale: 0.65 },
] as const;

const CRISIS_LINES = [
  { label: 'NZ — 1737 (text or call)', number: '1737' },
  { label: 'NZ Lifeline — 0800 543 354', number: '08005433354' },
  { label: 'AU — 13 11 14', number: '131114' },
  { label: 'USA — 988', number: '988' },
  { label: 'UK — 116 123', number: '116123' },
];

export function EmergencyBeacon() {
  const [visible, setVisible] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [alertLevel, setAlertLevel] = useState<CareLevel>('NEUTRAL');

  // Subscribe to care events from TALK tab — orb changes when ELEVATED/CRISIS fires
  useEffect(() => {
    return CareEvents.subscribe(level => {
      setAlertLevel(level);
      // Auto-clear back to NEUTRAL after 60s so it doesn't stay red permanently
      setTimeout(() => setAlertLevel('NEUTRAL'), 60000);
    });
  }, []);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const circleAnim = useRef(new Animated.Value(0.65)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const breathAnim = useRef<Animated.CompositeAnimation | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // orb subtle pulse when idle
  useEffect(() => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
    return () => pulseLoop.current?.stop();
  }, []);

  // breath cycle when modal open
  useEffect(() => {
    if (!visible) {
      clearTimeout(phaseTimer.current ?? undefined);
      breathAnim.current?.stop();
      setPhaseIdx(0);
      Animated.timing(circleAnim, { toValue: 0.65, duration: 300, useNativeDriver: true }).start();
      return;
    }

    let idx = 0;

    const runPhase = (i: number) => {
      const phase = PHASES[i];
      Animated.timing(circleAnim, {
        toValue: phase.scale,
        duration: phase.duration * 0.9,
        useNativeDriver: true,
      }).start();
      setPhaseIdx(i);
      phaseTimer.current = setTimeout(() => {
        const next = (i + 1) % PHASES.length;
        runPhase(next);
      }, phase.duration);
    };

    runPhase(0);
    return () => clearTimeout(phaseTimer.current ?? undefined);
  }, [visible]);

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => setVisible(true), 650);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const dismiss = () => setVisible(false);

  const phase = PHASES[phaseIdx];

  const orbBorderColor = alertLevel === 'CRISIS' ? '#EF444488'
    : alertLevel === 'ELEVATED' ? '#F9731688'
    : alertLevel === 'HOLDING' ? '#E8C76A55'
    : '#A855F744';
  const orbGlyphColor = alertLevel === 'CRISIS' ? '#EF4444'
    : alertLevel === 'ELEVATED' ? '#F97316'
    : alertLevel === 'HOLDING' ? '#E8C76A'
    : '#C084FC';

  return (
    <>
      {/* Always-on floating orb — color escalates with CARE level */}
      <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]} pointerEvents="box-none">
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.orbTouch, { borderColor: orbBorderColor }]}
          activeOpacity={0.6}
          accessibilityLabel="Emergency Beacon — hold for crisis support"
          accessibilityRole="button"
        >
          <Text style={[styles.orbGlyph, { color: orbGlyphColor }]}>⊚</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Crisis Modal */}
      <Modal
        visible={visible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <ScrollView
          style={styles.modalBg}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.headerGlyph}>⊚</Text>
          <Text style={styles.headerText}>You are not alone.</Text>
          <Text style={styles.subText}>
            Whatever is happening right now — you don't have to face it alone.
            Take a breath. Start here.
          </Text>

          {/* Breath */}
          <View style={styles.breathSection}>
            <View style={styles.breathOuter}>
              <Animated.View
                style={[styles.breathCircle, { transform: [{ scale: circleAnim }] }]}
              />
            </View>
            <Text style={styles.breathLabel}>{phase.label}</Text>
            <Text style={styles.breathSub}>4 in · 4 hold · 4 out · 4 hold</Text>
          </View>

          {/* Grounding */}
          <View style={styles.groundBlock}>
            <Text style={styles.groundTitle}>Ground yourself</Text>
            <Text style={styles.groundText}>Name 5 things you can see right now.</Text>
            <Text style={styles.groundText}>Feel your feet on the floor.</Text>
            <Text style={styles.groundText}>You are here. This is real. You are safe.</Text>
          </View>

          {/* Crisis lines */}
          <Text style={styles.helpTitle}>Crisis support — tap to call</Text>
          {CRISIS_LINES.map(line => (
            <TouchableOpacity
              key={line.label}
              style={styles.lineBtn}
              onPress={() => Linking.openURL(`tel:${line.number}`)}
              activeOpacity={0.7}
            >
              <Text style={styles.lineBtnText}>{line.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.lineBtn, styles.lineBtnWeb]}
            onPress={() => Linking.openURL('https://findahelpline.com')}
            activeOpacity={0.7}
          >
            <Text style={styles.lineBtnText}>International — findahelpline.com ↗</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity style={styles.dismissBtn} onPress={dismiss} activeOpacity={0.8}>
            <Text style={styles.dismissText}>I'm grounded ⊚</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            Sol is here when you're ready. No rush.
          </Text>
        </ScrollView>
      </Modal>
    </>
  );
}

const ORB_SIZE = 30;

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 38,
    right: 14,
    width: ORB_SIZE,
    height: ORB_SIZE,
    zIndex: 9999,
    elevation: 20,
  },
  orbTouch: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: '#1A0E2A',
    borderWidth: 1,
    borderColor: '#A855F744',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbGlyph: {
    color: '#C084FC',
    fontSize: 13,
    lineHeight: 16,
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#080810',
  },
  modalContent: {
    padding: 28,
    paddingTop: Platform.OS === 'ios' ? 72 : 56,
    paddingBottom: 48,
    alignItems: 'center',
  },
  headerGlyph: {
    color: '#C084FC',
    fontSize: 36,
    marginBottom: 12,
  },
  headerText: {
    color: '#F5E6C8',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  subText: {
    color: '#A89880',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 320,
  },
  breathSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  breathOuter: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  breathCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#7C3AED22',
    borderWidth: 2,
    borderColor: '#A855F788',
  },
  breathLabel: {
    color: '#C084FC',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  breathSub: {
    color: '#6B5E7A',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  groundBlock: {
    width: '100%',
    backgroundColor: '#0F0A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D1F4A',
    padding: 18,
    marginBottom: 28,
    gap: 6,
  },
  groundTitle: {
    color: '#E8C76A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  groundText: {
    color: '#C4B49A',
    fontSize: 15,
    lineHeight: 22,
  },
  helpTitle: {
    color: '#6B5E7A',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  lineBtn: {
    width: '100%',
    backgroundColor: '#0F0A1A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2D1F4A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  lineBtnWeb: {
    borderColor: '#3D2A5A',
    marginBottom: 28,
  },
  lineBtnText: {
    color: '#C084FC',
    fontSize: 14,
    fontWeight: '500',
  },
  dismissBtn: {
    backgroundColor: '#1A0E2A',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#A855F7',
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  dismissText: {
    color: '#E8C76A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    color: '#3D3050',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
