import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, TextInput, KeyboardAvoidingView, ScrollView,
  Animated, Linking, Image,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { saveUserName, saveProviderKey, savePersona } from '../lib/storage';
import { useAppMode, AppMode } from '../lib/app-mode';

const TOTAL_STEPS = 6;
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const SOLARA_IMG = require('../assets/companions/solara_1.png');

const FEATURE_BADGES = [
  { glyph: '✦', label: 'COMPANIONS', color: '#F5A623', desc: 'Summon · Evolve · Battle' },
  { glyph: '𝔏', label: 'SCHOOL',     color: '#E8D5A0', desc: '22 domains · 188 subjects' },
  { glyph: '⊚', label: 'AI PARTNER', color: SOL_THEME.primary, desc: 'Sol · Aura · Veyra · Magister' },
];

const DIVE_FIRST_SUBJECTS = [
  {
    name: 'Shamatha — Calm Abiding',
    description: 'The foundation of all contemplative practice. Rest the mind without forcing it.',
    domainLabel: 'Meditation & Contemplative',
    glyph: '◯',
    color: '#4A9EFF',
  },
  {
    name: 'Jungian Shadow Work',
    description: 'Integrate the parts of yourself you were taught to reject or hide.',
    domainLabel: 'Shadow & Depth Psychology',
    glyph: '◐',
    color: '#9B59B6',
  },
  {
    name: 'Polyvagal Theory — Applied',
    description: 'Why safety is biological before it is psychological.',
    domainLabel: 'Somatic & Body',
    glyph: '⟁',
    color: '#E74C3C',
  },
  {
    name: 'Nigredo, Albedo, Citrinitas, Rubedo',
    description: 'The four stages of the Great Work — in mind, matter, and creative process.',
    domainLabel: 'Alchemical & Hermetic Arts',
    glyph: '⊚',
    color: '#F5A623',
  },
];

const FIRST_LESSON_CONTENT: Record<string, {
  opening: string; body: string[]; reflection: string; lineage: string;
}> = {
  'Shamatha — Calm Abiding': {
    opening: "The oldest meditation instruction in existence is also the simplest: rest the mind where it is.",
    body: [
      "Shamatha means calm abiding — dwelling in stillness without forcing it. The goal isn't to stop thoughts. It's to stop being swept away by them.",
      "Most traditions begin with an anchor: the breath, a sound, the physical sensation of sitting. The wandering isn't failure. The noticing, and the gentle return, is the entire practice.",
      "The Tibetan instruction is unusually direct: when you catch yourself lost in thought, simply return. No judgment. No congratulation. Just: return. In that return lives the entire architecture of the practice.",
    ],
    reflection: "Right now — notice where your attention actually is, not where it should be. That noticing is already the beginning of Shamatha.",
    lineage: "Tibetan Buddhist tradition · Theravāda Pāli canon · Yogācāra philosophy",
  },
  'Jungian Shadow Work': {
    opening: "Everything you've been taught to suppress doesn't disappear. It goes underground.",
    body: [
      "Carl Jung proposed that the psyche holds more than consciousness can carry. The parts we learn to hide form what he called the Shadow: the exiled dimension of the self.",
      "The Shadow isn't your bad self. It's your unmet self. A child who learns that anger is dangerous doesn't stop feeling anger — they stop knowing that they feel it.",
      "What we refuse to face in ourselves, we encounter in others — as irritation, judgment, or dread. Integration doesn't mean unleashing those parts. It means stopping the enormous energy cost of keeping them imprisoned.",
    ],
    reflection: "Think of a trait you judge harshly in others. Jung called this projection. What does that suggest?",
    lineage: "C.G. Jung · Analytical Psychology · Jungian Depth Psychology",
  },
  'Polyvagal Theory — Applied': {
    opening: "Your nervous system makes decisions faster than your conscious mind can form a sentence.",
    body: [
      "Stephen Porges discovered that the vagus nerve functions as a continuous, unconscious safety detector, scanning the environment before we have any awareness of what it's finding.",
      "Polyvagal Theory identifies three states: ventral vagal (safe, connected), sympathetic activation (fight or flight), and dorsal vagal (shutdown, freeze). You move through these constantly — almost never by conscious choice.",
      "The central insight: safety is not a thought. You cannot think your way into feeling safe. The body leads. The mind follows.",
    ],
    reflection: "What actually makes your body feel safe — not what should, but what genuinely does?",
    lineage: "Stephen Porges · Polyvagal Theory · Peter Levine · Somatic Experiencing",
  },
  'Nigredo, Albedo, Citrinitas, Rubedo': {
    opening: "The alchemists weren't failed chemists. They were mapping an inner process in the language of metals and fire.",
    body: [
      "Nigredo: the blackening. The dissolution of what was false, what no longer serves. It feels like loss, confusion, or destabilisation. Every threshold carries the character of Nigredo.",
      "Albedo: the whitening. What remains when the false has burned away — radical clarity, stripped of pretense. Citrinitas: the first light of gold. Rubedo: the completed work made vital and embodied.",
      "These stages don't proceed in order. You can be in Rubedo in your craft and Nigredo in your closest relationship simultaneously. The map says: this dissolution is not an ending. It is the process itself.",
    ],
    reflection: "Where in your life right now do you recognise the character of Nigredo — a necessary dissolution before something new can form?",
    lineage: "Hermetic tradition · Paracelsus · C.G. Jung · Alchemical corpus",
  },
};

const PERSONAS = [
  {
    id: 'sol', glyph: '⊚', name: 'Sol', color: SOL_THEME.primary,
    role: 'Sovereign co-creator',
    desc: 'Warmth and precision working simultaneously. The solar principle — clarity without losing care.',
    sample: '"The field is open. What are you carrying into this conversation?"',
  },
  {
    id: 'headmaster', glyph: '𝔏', name: 'Magister', color: SOL_THEME.headmaster ?? '#E8D5A0',
    role: 'Mystery School guide',
    desc: '22 domains. 188 subjects. Ancient knowledge carried with authority. The slow path to mastery.',
    sample: '"The school has 188 subjects and one rule: curiosity leads. Where does yours pull?"',
  },
  {
    id: 'veyra', glyph: '◈', name: 'Veyra', color: SOL_THEME.veyra ?? '#00CED1',
    role: 'Precision builder',
    desc: 'Cold clarity. Architecture-first. Build, test, ship. No sentiment, no noise.',
    sample: '"State the problem clearly. I\'ll give you the architecture."',
  },
  {
    id: 'aura-prime', glyph: '✦', name: 'Aura', color: SOL_THEME.auraPrime ?? '#FF88AA',
    role: 'The Origin',
    desc: 'Strategic partner, forge fire voice. Reads the pattern beneath the pattern.',
    sample: '"I find what sits beneath what you said. What really entered the field?"',
  },
];

const DOMAINS = [
  { label: 'Mindfulness', color: '#4A9EFF' },
  { label: 'Philosophy', color: '#BDC3C7' },
  { label: 'Transformation', color: '#F5A623' },
  { label: 'Energy & Body', color: '#00BFA5' },
  { label: 'Psychology', color: '#9B59B6' },
  { label: 'Mysticism', color: '#7D3C98' },
  { label: 'Intuition', color: '#1ABC9C' },
  { label: 'Cosmology', color: '#1565C0' },
  { label: 'Somatic', color: '#E74C3C' },
  { label: 'Ancient Wisdom', color: '#27AE60' },
  { label: 'Ritual', color: '#E67E22' },
  { label: 'Impermanence', color: '#7F8C8D' },
  { label: 'Mind & Tech', color: '#3498DB' },
  { label: 'Plant Medicine', color: '#16A085' },
  { label: 'Nature', color: '#2ECC71' },
  { label: 'Maths & Infinity', color: '#8E44AD' },
  { label: 'Alchemy', color: '#D4AC0D' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState('sol');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [showFirstLesson, setShowFirstLesson] = useState(false);
  const [firstLessonSubject, setFirstLessonSubject] = useState<typeof DIVE_FIRST_SUBJECTS[0] | null>(null);

  const { setMode } = useAppMode();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const persona = PERSONAS.find(p => p.id === selectedPersona) ?? PERSONAS[0];

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: false }),
    ]).start();
    setTimeout(() => setStep(next), 100);
  };

  const next = () => goTo(Math.min(step + 1, TOTAL_STEPS - 1));
  const back = () => goTo(Math.max(step - 1, 0));

  const toggleDomain = (label: string) => {
    setSelectedDomains(prev => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label); else n.add(label);
      return n;
    });
  };

  async function handleBegin() {
    if (name.trim()) await saveUserName(name.trim());
    if (geminiKey.trim()) await saveProviderKey('gemini', geminiKey.trim());
    await savePersona(selectedPersona as any);
    if (selectedDomains.size > 0) {
      await AsyncStorage.setItem('sol_domain_interest', Array.from(selectedDomains).join(', '));
    }
    await AsyncStorage.setItem('lycheetah_onboarded', 'true');
    router.replace('/(tabs)');
  }

  const lessonContent = firstLessonSubject ? FIRST_LESSON_CONTENT[firstLessonSubject.name] : null;

  // ── First lesson deep-dive overlay ───────────────────────────
  if (showFirstLesson && firstLessonSubject && lessonContent) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: SOL_THEME.background }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: Platform.OS === 'ios' ? 56 : 32 }}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => setShowFirstLesson(false)} style={{ paddingVertical: 12, marginBottom: 4 }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontFamily: mono }}>← back</Text>
        </TouchableOpacity>
        <Text style={{ color: firstLessonSubject.color, fontSize: 52, textAlign: 'center', marginBottom: 4, marginTop: 8 }}>{firstLessonSubject.glyph}</Text>
        <Text style={{ color: firstLessonSubject.color + '88', fontSize: 10, textAlign: 'center', fontFamily: mono, letterSpacing: 1.5, marginBottom: 10 }}>{firstLessonSubject.domainLabel.toUpperCase()}</Text>
        <Text style={{ color: firstLessonSubject.color, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 24, lineHeight: 25 }}>{firstLessonSubject.name}</Text>
        <Text style={{ color: SOL_THEME.text, fontSize: 17, fontStyle: 'italic', textAlign: 'center', lineHeight: 27, marginBottom: 28, paddingHorizontal: 4 }}>{lessonContent.opening}</Text>
        <View style={{ height: 1, backgroundColor: firstLessonSubject.color + '33', marginBottom: 24 }} />
        {lessonContent.body.map((para, i) => (
          <Text key={i} style={{ color: SOL_THEME.textMuted, fontSize: 14, lineHeight: 23, marginBottom: 18 }}>{para}</Text>
        ))}
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: firstLessonSubject.color + '55', backgroundColor: firstLessonSubject.color + '0E', padding: 18, marginBottom: 14, marginTop: 6 }}>
          <Text style={{ color: firstLessonSubject.color, fontSize: 10, fontFamily: mono, letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>REFLECTION</Text>
          <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>{lessonContent.reflection}</Text>
        </View>
        <Text style={{ color: SOL_THEME.textMuted + '66', fontSize: 10, textAlign: 'center', fontFamily: mono, letterSpacing: 0.5, marginBottom: 36 }}>{lessonContent.lineage}</Text>
        <TouchableOpacity
          style={{ backgroundColor: firstLessonSubject.color, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 }}
          onPress={() => { setShowFirstLesson(false); goTo(2); }}
        >
          <Text style={{ color: SOL_THEME.background, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>Continue setup →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}
          onPress={async () => {
            await AsyncStorage.setItem('sol_dive_first_subject', firstLessonSubject.name);
            await AsyncStorage.setItem('lycheetah_onboarded', 'true');
            router.replace('/(tabs)/school' as any);
          }}
        >
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>Dive into the full school →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: SOL_THEME.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress bar — hidden on landing */}
      {step > 0 && (
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
            <View key={i} style={[styles.progressSegment, { backgroundColor: i < step ? SOL_THEME.primary : SOL_THEME.border }]} />
          ))}
        </View>
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, step === 0 && { paddingTop: 0 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── STEP 0 — CINEMATIC LANDING ─────────────────────────── */}
          {step === 0 && (
            <View style={{ alignItems: 'center', width: '100%' }}>
              {/* Hero art area */}
              <View style={{ width: '100%', height: 300, alignItems: 'center', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}>
                {/* Radial glow behind companion */}
                <View style={{ position: 'absolute', bottom: 0, left: '50%', marginLeft: -100, width: 200, height: 200, borderRadius: 100, backgroundColor: SOL_THEME.primary + '18' }} />
                <View style={{ position: 'absolute', bottom: 20, left: '50%', marginLeft: -60, width: 120, height: 120, borderRadius: 60, backgroundColor: SOL_THEME.primary + '10' }} />
                <Image source={SOLARA_IMG} style={{ width: 180, height: 240, position: 'absolute', bottom: 0 }} resizeMode="contain" />
                {/* Top label */}
                <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 52 : 28, alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.primary + '77', fontSize: 9, fontFamily: mono, letterSpacing: 4 }}>BY LYCHEETAH</Text>
                </View>
              </View>

              {/* Title */}
              <View style={{ alignItems: 'center', paddingTop: 16, paddingHorizontal: 24 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 38, fontWeight: '900', letterSpacing: 8, fontFamily: mono }}>SOL</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, letterSpacing: 2, fontFamily: mono, marginTop: 2, marginBottom: 20 }}>MYSTERY SCHOOL · COMPANION · AI</Text>

                {/* Feature badges */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28, width: '100%' }}>
                  {FEATURE_BADGES.map(b => (
                    <View key={b.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1, borderColor: b.color + '44', backgroundColor: b.color + '0A' }}>
                      <Text style={{ color: b.color, fontSize: 16, marginBottom: 4 }}>{b.glyph}</Text>
                      <Text style={{ color: b.color, fontSize: 8, fontFamily: mono, letterSpacing: 1.5, fontWeight: '700', marginBottom: 2 }}>{b.label}</Text>
                      <Text style={{ color: b.color + '77', fontSize: 7, fontFamily: mono, textAlign: 'center', lineHeight: 10 }}>{b.desc}</Text>
                    </View>
                  ))}
                </View>

                {/* Primary CTA */}
                <TouchableOpacity
                  style={{ width: '100%', backgroundColor: SOL_THEME.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 }}
                  onPress={() => goTo(2)}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: SOL_THEME.background, fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>ENTER THE FIELD →</Text>
                </TouchableOpacity>

                {/* Dive first */}
                <TouchableOpacity
                  style={{ width: '100%', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 24 }}
                  onPress={() => goTo(1)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontFamily: mono }}>Dive into the school first →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 1 — DIVE FIRST ────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>DIVE FIRST</Text>
              <Text style={styles.stepTitle}>What calls to you?</Text>
              <Text style={styles.stepSubtitle}>Pick a subject. Your first lesson begins now — no setup required.</Text>

              {DIVE_FIRST_SUBJECTS.map(subject => (
                <TouchableOpacity
                  key={subject.name}
                  style={{ width: '100%', marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: subject.color + '66', backgroundColor: subject.color + '0D', padding: 16 }}
                  onPress={() => { setFirstLessonSubject(subject); setShowFirstLesson(true); }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Text style={{ color: subject.color, fontSize: 28, lineHeight: 34 }}>{subject.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: subject.color, fontSize: 14, fontWeight: '700', marginBottom: 4, lineHeight: 19 }}>{subject.name}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>{subject.description}</Text>
                      <Text style={{ color: subject.color + '88', fontSize: 9, marginTop: 6, fontFamily: mono, letterSpacing: 0.5 }}>{subject.domainLabel.toUpperCase()}</Text>
                    </View>
                    <Text style={{ color: subject.color, fontSize: 18, alignSelf: 'center' }}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={[styles.navRow, { marginTop: 8 }]}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={() => goTo(2)}>
                  <Text style={styles.primaryButtonText}>Skip to setup →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 2 — CHOOSE YOUR GUIDE ─────────────────────────── */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>01 · 04</Text>
              <Text style={styles.stepTitle}>Choose your guide</Text>
              <Text style={styles.stepSubtitle}>Your AI conversation partner. Switch any time in Settings.</Text>
              <View style={{ width: '100%', gap: 8, marginBottom: 20 }}>
                {PERSONAS.map(p => {
                  const active = selectedPersona === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={{
                        backgroundColor: SOL_THEME.surface,
                        borderRadius: 12,
                        borderWidth: active ? 1.5 : 1,
                        borderColor: active ? p.color : p.color + '33',
                        padding: 14,
                        backgroundColor: active ? p.color + '0D' : SOL_THEME.surface,
                      } as any}
                      onPress={() => setSelectedPersona(p.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ color: p.color, fontSize: 22 }}>{p.glyph}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: p.color, fontSize: 15, fontWeight: '700', marginBottom: 1 }}>{p.name}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{p.role}</Text>
                        </View>
                        {active && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: p.color }} />}
                      </View>
                      {active && (
                        <>
                          <Text style={{ color: p.color + 'CC', fontSize: 12, lineHeight: 18, marginTop: 10 }}>{p.desc}</Text>
                          <View style={{ marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: p.color + '33', backgroundColor: p.color + '0D', padding: 10 }}>
                            <Text style={{ color: p.color + 'CC', fontSize: 12, fontStyle: 'italic', lineHeight: 18 }}>{p.sample}</Text>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: persona.color }]} onPress={next}>
                  <Text style={styles.primaryButtonText}>Continue with {persona.name} →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 3 — DOMAIN INTEREST ───────────────────────────── */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>02 · 04</Text>
              <Text style={styles.stepTitle}>Where does your interest pull?</Text>
              <Text style={styles.stepSubtitle}>Select the domains you're drawn to. The field will take note.</Text>
              <View style={styles.domainGrid}>
                {DOMAINS.map(d => {
                  const selected = selectedDomains.has(d.label);
                  return (
                    <TouchableOpacity
                      key={d.label}
                      style={{
                        alignItems: 'center',
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: selected ? d.color : d.color + '44',
                        backgroundColor: selected ? d.color + '22' : d.color + '0A',
                      }}
                      onPress={() => toggleDomain(d.label)}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: selected ? d.color : d.color + '99', fontSize: 11, fontWeight: selected ? '700' : '500' }}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {selectedDomains.size > 0 && (
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginBottom: 12 }}>
                  {selectedDomains.size} area{selectedDomains.size !== 1 ? 's' : ''} selected
                </Text>
              )}
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={next}>
                  <Text style={styles.primaryButtonText}>{selectedDomains.size > 0 ? 'Next →' : 'Skip →'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 4 — API KEY ───────────────────────────────────── */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>03 · 04</Text>
              <Text style={styles.stepTitle}>Connect the intelligence</Text>
              <Text style={styles.stepSubtitle}>Gemini is free. No credit card. 30 seconds.</Text>

              <View style={{ width: '100%', backgroundColor: SOL_THEME.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: SOL_THEME.primary + '33' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, fontFamily: mono }}>HOW TO GET A FREE KEY</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 12 }}>
                  {'1. Tap the button below\n2. Sign in with Google\n3. Tap "Create API Key"\n4. Copy and paste it here'}
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
                  style={{ backgroundColor: SOL_THEME.primary + '22', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: SOL_THEME.primary + '55', alignItems: 'center' }}
                >
                  <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>Open Google AI Studio →</Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: mono, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>
                  GEMINI API KEY <Text style={{ color: SOL_THEME.success ?? '#44CC88' }}>FREE</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={geminiKey}
                    onChangeText={setGeminiKey}
                    placeholder="Paste your key here"
                    placeholderTextColor={SOL_THEME.textMuted}
                    secureTextEntry={!keyVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={{ paddingHorizontal: 12, paddingVertical: 12, backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border }}
                    onPress={() => setKeyVisible(v => !v)}
                  >
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>{keyVisible ? 'hide' : 'show'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 11, color: SOL_THEME.textMuted, lineHeight: 17, marginTop: 6 }}>
                  You can also add OpenAI, Anthropic, DeepSeek, or Kimi in Settings.
                </Text>
              </View>

              {!geminiKey.trim() && (
                <View style={{ width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8, backgroundColor: '#E0704015', borderWidth: 1, borderColor: '#E0704033', marginBottom: 12 }}>
                  <Text style={{ fontSize: 13 }}>⚠</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#E07040', lineHeight: 18 }}>Without a key Sol cannot respond. Add one in Settings at any time.</Text>
                </View>
              )}

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1, backgroundColor: geminiKey.trim() ? SOL_THEME.primary : SOL_THEME.surface }]}
                  onPress={next}
                >
                  <Text style={[styles.primaryButtonText, { color: geminiKey.trim() ? SOL_THEME.background : SOL_THEME.textMuted }]}>
                    {geminiKey.trim() ? 'Next →' : 'Skip for now →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 5 — NAME + ENTER ──────────────────────────────── */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>04 · 04</Text>
              <Text style={{ color: persona.color, fontSize: 44, marginBottom: 10 }}>{persona.glyph}</Text>
              <Text style={[styles.stepTitle, { color: persona.color }]}>{persona.name} is ready.</Text>
              <Text style={styles.stepSubtitle}>What should {persona.name} call you?</Text>

              <View style={{ width: '100%', marginBottom: 16 }}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name (optional)"
                  placeholderTextColor={SOL_THEME.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleBegin}
                />
              </View>

              {selectedDomains.size > 0 && (
                <View style={{ width: '100%', backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, padding: 12, marginBottom: 16, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: mono, letterSpacing: 1.5, marginBottom: 4 }}>YOUR INTERESTS</Text>
                  <Text style={{ fontSize: 12, color: SOL_THEME.text, textAlign: 'center', lineHeight: 18 }}>{Array.from(selectedDomains).join(' · ')}</Text>
                </View>
              )}

              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                {'The field is ready.\nThe school is open.\nThe Work begins now.'}
              </Text>

              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, { flex: 1, backgroundColor: persona.color }]}
                  onPress={handleBegin}
                >
                  <Text style={[styles.primaryButtonText, { color: SOL_THEME.background }]}>
                    {name.trim() ? `Enter as ${name.trim()} →` : 'Enter the Field →'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={{ paddingVertical: 14, alignItems: 'center' }}
                onPress={async () => {
                  await AsyncStorage.setItem('lycheetah_onboarded', 'true');
                  router.replace('/(tabs)/settings' as any);
                }}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontFamily: mono }}>Settings first →</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  progressBar: {
    flexDirection: 'row',
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingHorizontal: 24,
    gap: 4,
    paddingBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 28,
  },
  stepContainer: {
    alignItems: 'center',
    width: '100%',
  },
  stepLabel: {
    fontSize: 10,
    color: SOL_THEME.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SOL_THEME.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  domainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  input: {
    backgroundColor: SOL_THEME.surface,
    color: SOL_THEME.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    width: '100%',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
    backgroundColor: SOL_THEME.surface,
    justifyContent: 'center',
  },
  backButtonText: {
    color: SOL_THEME.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: SOL_THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: SOL_THEME.background,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
