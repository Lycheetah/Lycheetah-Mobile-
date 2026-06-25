import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, TextInput, KeyboardAvoidingView, ScrollView,
  Animated, Linking, Image,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { saveUserName, saveProviderKey, savePersona } from '../lib/storage';
import { useAppMode } from '../lib/app-mode';

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const TOTAL_STEPS = 14;
// 0:landing  1-7:showcase  8:dive-first  9:voice  10:sovereignty  11:domains  12:key  13:enter
const SETUP_START = 9; // first numbered setup step

const SOLARA_IMG = require('../assets/companions/solara_1.png');

// ── PERSONAS ────────────────────────────────────────────────────────────────
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
    desc: '41 domains. 340+ subjects. Ancient knowledge carried with authority. The slow path to mastery.',
    sample: '"The school has 340 subjects and one rule: curiosity leads. Where does yours pull?"',
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

// ── SOVEREIGNTY BASELINE ─────────────────────────────────────────────────────
const SOVEREIGNTY_QUESTIONS = [
  {
    id: 'mystery',
    question: 'How do you hold mystery?',
    subtitle: 'When you encounter something you cannot explain, your instinct is to—',
    options: [
      { id: 'chase', glyph: '↗', label: 'Chase it', desc: 'Pull the thread until it makes sense' },
      { id: 'sit',   glyph: 'Ψ', label: 'Sit with it', desc: 'Let it reveal itself in its own time' },
      { id: 'map',   glyph: '⟁', label: 'Map it', desc: 'Find the structure beneath the surface' },
      { id: 'test',  glyph: '◈', label: 'Test it', desc: 'Apply pressure until something breaks or holds' },
    ],
  },
  {
    id: 'truth',
    question: 'What kind of truth moves you?',
    subtitle: 'The truth that lands hardest for you is—',
    options: [
      { id: 'empirical',    glyph: 'Π',  label: 'Evidence',    desc: 'What can be measured and replicated' },
      { id: 'experiential', glyph: '⊚',  label: 'Experience',  desc: 'What I have lived and felt myself' },
      { id: 'structural',   glyph: '△',  label: 'Structure',   desc: 'What holds together under scrutiny' },
      { id: 'narrative',    glyph: '⟲',  label: 'Story',       desc: 'What resonates with the deeper arc' },
    ],
  },
  {
    id: 'unknown',
    question: 'When you face the unknown—',
    subtitle: 'The edge of what you know is best approached with—',
    options: [
      { id: 'excitement', glyph: '✧', label: 'Excitement',  desc: 'This is where the real work begins' },
      { id: 'tools',      glyph: '⊛', label: 'Tools',       desc: 'Preparation makes the crossing possible' },
      { id: 'patience',   glyph: '⧖', label: 'Patience',    desc: 'The unknown teaches at its own speed' },
      { id: 'curiosity',  glyph: '∿', label: 'Curiosity',   desc: 'Walk in without a destination and see' },
    ],
  },
];

// ── ARCHETYPE SPARK ──────────────────────────────────────────────────────────
// Sovereignty answers → one of four archetypes → starter domain + companion rec
const ARCHETYPES = {
  SEEKER:  { glyph: '↗', color: '#1ABC9C', label: 'THE SEEKER',  desc: 'Curiosity before certainty. You follow the thread wherever it leads.', domain: 'Irish Mythology', companion: 'wanderer' },
  MYSTIC:  { glyph: 'Ψ', color: '#9B6BFF', label: 'THE MYSTIC',  desc: 'You sit with mystery. Depth before conclusion.', domain: 'Alchemy', companion: 'alchemist' },
  WARRIOR: { glyph: '◈', color: '#FF6B6B', label: 'THE WARRIOR', desc: 'You test everything. Truth survives pressure or it fails.', domain: 'Truth Pressure', companion: 'sentinel' },
  SCHOLAR: { glyph: '△', color: '#E8C76A', label: 'THE SCHOLAR', desc: 'You map what others call chaos. Structure reveals what intuition misses.', domain: 'LAMAGUE Language', companion: 'archivist' },
} as const;
type ArchetypeKey = keyof typeof ARCHETYPES;

function computeArchetype(answers: Record<string, string>): ArchetypeKey {
  const scores: Record<ArchetypeKey, number> = { SEEKER: 0, MYSTIC: 0, WARRIOR: 0, SCHOLAR: 0 };
  const { mystery, truth, unknown } = answers;
  if (mystery === 'chase') { scores.SEEKER += 2; scores.WARRIOR += 1; }
  if (mystery === 'sit')   { scores.MYSTIC  += 2; scores.SEEKER  += 1; }
  if (mystery === 'map')   { scores.SCHOLAR += 2; }
  if (mystery === 'test')  { scores.WARRIOR += 2; }
  if (truth === 'empirical')    { scores.WARRIOR += 2; scores.SCHOLAR += 1; }
  if (truth === 'experiential') { scores.SEEKER  += 2; scores.MYSTIC  += 1; }
  if (truth === 'structural')   { scores.SCHOLAR += 2; scores.WARRIOR += 1; }
  if (truth === 'narrative')    { scores.MYSTIC  += 2; scores.SEEKER  += 1; }
  if (unknown === 'excitement') { scores.SEEKER  += 2; }
  if (unknown === 'tools')      { scores.WARRIOR += 2; scores.SCHOLAR += 1; }
  if (unknown === 'patience')   { scores.MYSTIC  += 2; scores.SCHOLAR += 1; }
  if (unknown === 'curiosity')  { scores.SEEKER  += 2; scores.MYSTIC  += 1; }
  return (Object.keys(scores) as ArchetypeKey[]).reduce((a, b) => scores[a] >= scores[b] ? a : b);
}

// ── DOMAIN INTERESTS ────────────────────────────────────────────────────────
const DOMAINS = [
  { label: 'Mindfulness',        color: '#4A9EFF' },
  { label: 'Philosophy',         color: '#BDC3C7' },
  { label: 'Transformation',     color: '#F5A623' },
  { label: 'Energy & Body',      color: '#00BFA5' },
  { label: 'Psychology',         color: '#9B59B6' },
  { label: 'Mysticism',          color: '#7D3C98' },
  { label: 'Intuition',          color: '#1ABC9C' },
  { label: 'Cosmology',          color: '#1565C0' },
  { label: 'Somatic',            color: '#E74C3C' },
  { label: 'Ancient Wisdom',     color: '#27AE60' },
  { label: 'Ritual',             color: '#E67E22' },
  { label: 'Astrology',          color: '#8855FF' },
  { label: 'Mind & Tech',        color: '#3498DB' },
  { label: 'Noetic Science',     color: '#AA44FF' },
  { label: 'Nature',             color: '#2ECC71' },
  { label: 'Maths & Infinity',   color: '#8E44AD' },
  { label: 'Alchemy',            color: '#D4AC0D' },
  { label: 'Celtic / Old Gods',  color: '#2C8A5A' },
  { label: 'Irish Mythology',    color: '#1ABC9C' },
  { label: 'Irish Literature',   color: '#9B59B6' },
  { label: 'Crystal & Gem Lore', color: '#7ED6DF' },
  { label: 'Folklore & Place',   color: '#27AE60' },
];

// ── DIVE FIRST ───────────────────────────────────────────────────────────────
const DIVE_FIRST_SUBJECTS = [
  { name: 'Shamatha — Calm Abiding',         glyph: '◯', color: '#4A9EFF', domainLabel: 'Meditation & Contemplative',
    description: 'The foundation of all contemplative practice. Rest the mind without forcing it.',
    opening: 'The oldest meditation instruction in existence is also the simplest: rest the mind where it is.',
    body: [
      'Shamatha means calm abiding — dwelling in stillness without forcing it. The goal isn\'t to stop thoughts. It\'s to stop being swept away by them.',
      'Most traditions begin with an anchor: the breath, a sound, the physical sensation of sitting. The wandering isn\'t failure. The noticing, and the gentle return, is the entire practice.',
    ],
    reflection: 'Right now — notice where your attention actually is, not where it should be. That noticing is already the beginning.',
  },
  { name: 'Jungian Shadow Work',              glyph: '◐', color: '#9B59B6', domainLabel: 'Shadow & Depth Psychology',
    description: 'Integrate the parts of yourself you were taught to reject or hide.',
    opening: 'Everything you\'ve been taught to suppress doesn\'t disappear. It goes underground.',
    body: [
      'Carl Jung proposed that the psyche holds more than consciousness can carry. The parts we learn to hide form what he called the Shadow: the exiled dimension of the self.',
      'What we refuse to face in ourselves, we encounter in others — as irritation, judgment, or dread. Integration doesn\'t mean unleashing those parts. It means stopping the enormous energy cost of keeping them imprisoned.',
    ],
    reflection: 'Think of a trait you judge harshly in others. Jung called this projection. What does that suggest?',
  },
  { name: 'Polyvagal Theory — Applied',       glyph: '⟁', color: '#E74C3C', domainLabel: 'Somatic & Body',
    description: 'Why safety is biological before it is psychological.',
    opening: 'Your nervous system makes decisions faster than your conscious mind can form a sentence.',
    body: [
      'Stephen Porges discovered that the vagus nerve functions as a continuous, unconscious safety detector, scanning the environment before we have any awareness of what it\'s finding.',
      'The central insight: safety is not a thought. You cannot think your way into feeling safe. The body leads. The mind follows.',
    ],
    reflection: 'What actually makes your body feel safe — not what should, but what genuinely does?',
  },
  { name: 'Nigredo, Albedo, Citrinitas, Rubedo', glyph: '⊚', color: '#F5A623', domainLabel: 'Alchemical Arts',
    description: 'The four stages of the Great Work — in mind, matter, and creative process.',
    opening: 'The alchemists weren\'t failed chemists. They were mapping an inner process in the language of metals and fire.',
    body: [
      'Nigredo: the blackening. The dissolution of what was false. Every threshold carries the character of Nigredo.',
      'Albedo: the whitening. Citrinitas: the first light of gold. Rubedo: the completed work made vital. These stages don\'t proceed in order — you can be in Rubedo in your craft and Nigredo in a relationship simultaneously.',
    ],
    reflection: 'Where in your life right now do you recognise the character of Nigredo — a necessary dissolution before something new can form?',
  },
  { name: 'The Tuatha Dé Danann — Gods Before History', glyph: '⟁', color: '#1ABC9C', domainLabel: 'Celtic Gods & Irish Mythology',
    description: 'The pre-Christian cosmology of Ireland encoded in living form — each god a quality of intelligence the world requires.',
    opening: 'The Tuatha Dé Danann are not mythology in the diminishing sense. They are a cosmology — a structured account of what the world is made of.',
    body: [
      'Lugh is skill and solar mastery. The Dagda is abundance and the contract with the earth. Brigid is healing, forge-craft, and poetry — three capacities held by one figure because the Irish mind did not separate making, mending, and beauty. The Morrigan is sovereignty and fate — not death, as she is often misread, but the truth that fate sees what you have already decided before you admit it.',
      'When the Tuatha Dé Danann were defeated by the Milesians — the ancestors of modern Irish people — they did not die. By treaty they withdrew into the sídhe: the burial mounds, the hollow hills, the Otherworld that lies alongside this one. There they became the áes síde. The sacred never retreated to a distant heaven. It went underground, into the land itself.',
    ],
    reflection: 'Each Tuatha Dé Danann deity embodies a quality the world requires. Which quality — skill, sovereignty, healing, transformation, threshold navigation — feels most alive in your life right now?',
  },
];

const LUMEN_REWARD = 200;

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState('sol');
  const [sovereigntyAnswers, setSovereigntyAnswers] = useState<Record<string, string>>({});
  const [sovereigntyStep, setSovereigntyStep] = useState(0);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [showFirstLesson, setShowFirstLesson] = useState(false);
  const [firstLessonSubject, setFirstLessonSubject] = useState<typeof DIVE_FIRST_SUBJECTS[0] | null>(null);

  const { setMode } = useAppMode();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const companionGlow = useRef(new Animated.Value(0)).current;
  const companionScale = useRef(new Animated.Value(0.85)).current;

  // Animate companion in on landing
  useEffect(() => {
    if (step === 0) {
      Animated.parallel([
        Animated.timing(companionScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(companionGlow, { toValue: 1, duration: 1200, useNativeDriver: false }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(companionGlow, { toValue: 0.6, duration: 2000, useNativeDriver: false }),
            Animated.timing(companionGlow, { toValue: 1, duration: 2000, useNativeDriver: false }),
          ])
        ).start();
      });
    }
  }, [step]);

  const persona = PERSONAS.find(p => p.id === selectedPersona) ?? PERSONAS[0];

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: false }),
    ]).start();
    setTimeout(() => { setStep(next); if (next === 10) setSovereigntyStep(0); }, 100);
  };
  const next = () => goTo(Math.min(step + 1, TOTAL_STEPS - 1));
  const back = () => goTo(Math.max(step - 1, 0));

  const answerSovereignty = (questionId: string, optionId: string) => {
    const updated = { ...sovereigntyAnswers, [questionId]: optionId };
    setSovereigntyAnswers(updated);
    if (sovereigntyStep < SOVEREIGNTY_QUESTIONS.length - 1) {
      setTimeout(() => setSovereigntyStep(s => s + 1), 300);
    }
  };

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
    if (Object.keys(sovereigntyAnswers).length > 0) {
      await AsyncStorage.setItem('sol_sovereignty_profile', JSON.stringify(sovereigntyAnswers));
      if (Object.keys(sovereigntyAnswers).length >= SOVEREIGNTY_QUESTIONS.length) {
        const arcKey = computeArchetype(sovereigntyAnswers);
        await AsyncStorage.setItem('sol_archetype', arcKey);
      }
    }
    // Lumen + Veras founding reward
    const stored = await AsyncStorage.getItem('sol_coins');
    const current = stored ? parseInt(stored, 10) : 0;
    await AsyncStorage.setItem('sol_coins', String(current + LUMEN_REWARD));
    const verasStored = await AsyncStorage.getItem('sol_veras');
    await AsyncStorage.setItem('sol_veras', String((verasStored ? parseInt(verasStored) : 0) + 50));
    await AsyncStorage.setItem('lycheetah_onboarded', 'true');
    await AsyncStorage.setItem('sol_welcome_tour_seen', 'true');
    router.replace('/(tabs)');
  }

  // ── FIRST LESSON OVERLAY ─────────────────────────────────────────────────
  if (showFirstLesson && firstLessonSubject) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: SOL_THEME.background }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: Platform.OS === 'ios' ? 56 : 32 }}
        showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => setShowFirstLesson(false)} style={{ paddingVertical: 12, marginBottom: 4 }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontFamily: mono }}>← back</Text>
        </TouchableOpacity>
        <Text style={{ color: firstLessonSubject.color, fontSize: 48, textAlign: 'center', marginBottom: 4, marginTop: 8 }}>{firstLessonSubject.glyph}</Text>
        <Text style={{ color: firstLessonSubject.color + '88', fontSize: 10, textAlign: 'center', fontFamily: mono, letterSpacing: 1.5, marginBottom: 10 }}>{firstLessonSubject.domainLabel.toUpperCase()}</Text>
        <Text style={{ color: firstLessonSubject.color, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 24, lineHeight: 25 }}>{firstLessonSubject.name}</Text>
        <Text style={{ color: SOL_THEME.text, fontSize: 16, fontStyle: 'italic', textAlign: 'center', lineHeight: 26, marginBottom: 28 }}>{firstLessonSubject.opening}</Text>
        <View style={{ height: 1, backgroundColor: firstLessonSubject.color + '33', marginBottom: 24 }} />
        {firstLessonSubject.body.map((para, i) => (
          <Text key={i} style={{ color: SOL_THEME.textMuted, fontSize: 14, lineHeight: 23, marginBottom: 18 }}>{para}</Text>
        ))}
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: firstLessonSubject.color + '55', backgroundColor: firstLessonSubject.color + '0E', padding: 18, marginBottom: 14, marginTop: 6 }}>
          <Text style={{ color: firstLessonSubject.color, fontSize: 10, fontFamily: mono, letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>REFLECTION</Text>
          <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>{firstLessonSubject.reflection}</Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: firstLessonSubject.color, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 }}
          onPress={() => { setShowFirstLesson(false); goTo(SETUP_START); }}>
          <Text style={{ color: SOL_THEME.background, fontSize: 14, fontWeight: '700' }}>Continue setup →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: SOL_THEME.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Progress bar — only for setup steps 9-12 */}
      {step >= SETUP_START && step < TOTAL_STEPS - 1 && (
        <View style={styles.progressBar}>
          {Array.from({ length: 4 }).map((_, i) => {
            const setupIdx = step - SETUP_START;
            return (
              <View key={i} style={[styles.progressSegment,
                { backgroundColor: i < setupIdx ? SOL_THEME.primary : i === setupIdx ? SOL_THEME.primary + '88' : SOL_THEME.border }]} />
            );
          })}
        </View>
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, step === 0 && { paddingTop: 0, paddingHorizontal: 0 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* ── STEP 0 — CINEMATIC LANDING ─────────────────────────── */}
          {step === 0 && (
            <View style={{ alignItems: 'center', width: '100%' }}>
              {/* Hero */}
              <View style={{ width: '100%', height: 320, alignItems: 'center', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden', backgroundColor: '#050010' }}>
                {/* Animated glow rings */}
                <Animated.View style={{
                  position: 'absolute', bottom: -20, left: '50%', marginLeft: -120, width: 240, height: 240, borderRadius: 120,
                  backgroundColor: SOL_THEME.primary,
                  opacity: companionGlow.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.12] }),
                }} />
                <Animated.View style={{
                  position: 'absolute', bottom: 10, left: '50%', marginLeft: -70, width: 140, height: 140, borderRadius: 70,
                  backgroundColor: SOL_THEME.primary,
                  opacity: companionGlow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.18] }),
                }} />
                {/* Companion art */}
                <Animated.View style={{ transform: [{ scale: companionScale }], marginBottom: 0 }}>
                  <Image source={SOLARA_IMG} style={{ width: 190, height: 255 }} resizeMode="contain" />
                </Animated.View>
                {/* Brand label */}
                <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 52 : 28, alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.primary + '88', fontSize: 9, fontFamily: mono, letterSpacing: 5 }}>BY LYCHEETAH</Text>
                </View>
              </View>

              {/* Title */}
              <View style={{ alignItems: 'center', paddingTop: 18, paddingHorizontal: 24, width: '100%' }}>
                <Text style={{ color: SOL_THEME.primary + '99', fontSize: 11, fontWeight: '700', letterSpacing: 8, fontFamily: mono, marginBottom: 2 }}>SOVEREIGN</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 44, fontWeight: '900', letterSpacing: 12, fontFamily: mono, textShadowColor: SOL_THEME.primary + '66', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 }}>SOL</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, letterSpacing: 2.5, fontFamily: mono, marginTop: 4, marginBottom: 8 }}>
                  A MYSTERY SCHOOL YOU LIVE INSIDE
                </Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 14, paddingHorizontal: 6, fontStyle: 'italic' }}>
                  Welcome. You found the door — most people never look for it. The studying here is the game, and it's about to begin.
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[
                    { glyph: '𝔏', label: '41+ DOMAINS', color: SOL_THEME.headmaster ?? '#E8D5A0' },
                    { glyph: '⊚', label: '19 ARCHETYPES', color: '#F5A623' },
                    { glyph: '🔥', label: 'BONFIRE MODE', color: '#FF7043' },
                    { glyph: '✦', label: '4 VOICES', color: SOL_THEME.primary },
                  ].map(b => (
                    <View key={b.label} style={{ alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: b.color + '33', backgroundColor: b.color + '08' }}>
                      <Text style={{ color: b.color, fontSize: 14, marginBottom: 3 }}>{b.glyph}</Text>
                      <Text style={{ color: b.color + 'CC', fontSize: 7, fontFamily: mono, letterSpacing: 1, fontWeight: '700', textAlign: 'center' }}>{b.label}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={{ width: '100%', backgroundColor: SOL_THEME.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10, marginTop: 8 }}
                  onPress={() => goTo(SETUP_START)} activeOpacity={0.85}>
                  <Text style={{ color: SOL_THEME.background, fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>ENTER THE FIELD →</Text>
                </TouchableOpacity>
                {/* 7 feature cards — each jumps directly to that showcase step */}
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 3, fontFamily: mono, textAlign: 'center', marginBottom: 10, marginTop: 4 }}>WHAT'S INSIDE</Text>
                {[
                  { glyph:'𝔏', color: SOL_THEME.headmaster ?? '#E8D5A0', label:'The Mystery School',  sub:'41+ domains across 5 layers', step:1 },
                  { glyph:'⊚', color:'#F5A623',  label:'Your Companion',      sub:'19 archetypes · 6 stages',   step:2 },
                  { glyph:'🔥', color:'#FF7043',  label:'Bonfire Mode',        sub:'3 fireside learning modes',  step:3 },
                  { glyph:'⚔', color:'#FF6B6B',  label:'Battle & Growth',     sub:'Real RPG combat + relics',   step:4 },
                  { glyph:'◈', color:'#9B6BFF',  label:'LAMAGUE',             sub:'Living symbol language',     step:5 },
                  { glyph:'✦', color:'#4A9EFF',  label:'Zodiac',              sub:'Natal chart + daily transits',step:6 },
                  { glyph:'⧖', color:'#00BFA5',  label:'The Sanctum',         sub:'Your personal data layer',   step:7 },
                ].map(f => (
                  <TouchableOpacity key={f.step} onPress={() => goTo(f.step)} activeOpacity={0.8}
                    style={{ width:'100%', flexDirection:'row', alignItems:'center', gap:12, paddingVertical:11, paddingHorizontal:14, borderRadius:12, borderWidth:1, borderColor: f.color+'22', backgroundColor: f.color+'06', marginBottom:6 }}>
                    <Text style={{ color: f.color, fontSize:18, width:24, textAlign:'center' }}>{f.glyph}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ color: f.color, fontSize:12, fontWeight:'700', fontFamily:mono }}>{f.label}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize:10, marginTop:1 }}>{f.sub}</Text>
                    </View>
                    <Text style={{ color: f.color+'88', fontSize:12 }}>→</Text>
                  </TouchableOpacity>
                ))}
                <View style={{ height:20 }} />
              </View>
            </View>
          )}

          {/* ── STEPS 1–7 — SHOWCASE ────────────────────────────────── */}
          {step >= 1 && step <= 7 && (() => {
            const SHOWCASE = [
              {
                glyph: '𝔏', color: SOL_THEME.headmaster ?? '#E8D5A0', label: '01 · 07',
                title: 'The Mystery School',
                sub: '41+ domains. Five epistemic layers — Foundation, Middle, Edge, Open, Void.',
                bullets: [
                  'Philosophy, alchemy, Jungian depth, Celtic mythology, quantum theory',
                  'LAMAGUE — a living symbolic language built inside the school',
                  'Truth Pressure — an original framework for testing belief',
                  'You study what calls. Nothing is forced.',
                ],
              },
              {
                glyph: '⊚', color: '#F5A623', label: '02 · 07',
                title: 'Your Companion',
                sub: '19 archetypes — choose once. They grow with you through six stages.',
                bullets: [
                  'Each archetype has unique stats, spells, voice, and creature body',
                  'Feed, battle, talk, and evolve your companion',
                  'Gear, relics, and the Menagerie expand as you grow',
                  'Your choice is permanent — pick the one that calls to you',
                ],
              },
              {
                glyph: '🔥', color: '#FF7043', label: '03 · 07',
                title: 'Bonfire Mode',
                sub: 'Three ways to sit with your companion and learn by firelight.',
                bullets: [
                  'AUTO — your companion speaks first. Irish folklore, unprompted',
                  'EXCHANGE — message for message, warm and alive',
                  'DEEP LEARNING — name a subject, get a full oral tradition session',
                  'For people who learn better beside a fire than inside a classroom',
                ],
              },
              {
                glyph: '⚔', color: '#FF6B6B', label: '04 · 07',
                title: 'Battle & Growth',
                sub: 'Real RPG combat tied to your learning.',
                bullets: [
                  'STRIKE / SHIELD / FOCUS / SPELL — four moves, deep strategy',
                  'FOCUS charges your next strike to ×2 damage',
                  'Win XP, Lumens, and rare relics from the field',
                  'Six growth stages — your companion evolves as you do',
                ],
              },
              {
                glyph: '◈', color: '#9B6BFF', label: '05 · 07',
                title: 'LAMAGUE',
                sub: 'A living symbol language with its own grammar and library.',
                bullets: [
                  'Learn glyphs, earn gear, progress through ranks',
                  'The LAMAGUE Library holds every symbol class',
                  'Crafted by Sol and tested by a 4-agent AI council',
                  'It grows — new symbols ratified regularly',
                ],
              },
              {
                glyph: '✦', color: '#4A9EFF', label: '06 · 07',
                title: 'Zodiac',
                sub: 'Your natal chart computed from birthdate, time, and location.',
                bullets: [
                  'Sun, moon, rising + all 12 houses + planetary positions',
                  'Daily transit readings tied to your learning history',
                  'Sigil forge, oracle, and three-card tarot spread',
                  'Real astronomy, not sun-sign astrology',
                ],
              },
              {
                glyph: '⧖', color: '#00BFA5', label: '07 · 07',
                title: 'The Sanctum',
                sub: 'Your personal data layer — the bigger picture of you.',
                bullets: [
                  'LQ score tracking your learning depth over time',
                  'Dive history, living chronicle, weekly synthesis',
                  'Every 5 chronicle entries → Sol writes a golden reflection',
                  'The school remembers. You compound.',
                ],
              },
            ];
            const sc = SHOWCASE[step - 1];
            return (
              <View style={styles.stepContainer}>
                <Text style={styles.stepLabel}>{sc.label}</Text>
                <View style={{ width: 72, height: 72, borderRadius: 18, borderWidth: 1.5, borderColor: sc.color + '55', backgroundColor: sc.color + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 16, alignSelf: 'center' }}>
                  <Text style={{ color: sc.color, fontSize: 34 }}>{sc.glyph}</Text>
                </View>
                <Text style={styles.stepTitle}>{sc.title}</Text>
                <Text style={styles.stepSubtitle}>{sc.sub}</Text>
                <View style={{ width: '100%', gap: 10, marginBottom: 24 }}>
                  {sc.bullets.map((b, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Text style={{ color: sc.color, fontSize: 12, marginTop: 1, minWidth: 14 }}>◦</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 19, flex: 1 }}>{b}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.navRow}>
                  <TouchableOpacity style={styles.backButton} onPress={back}>
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                  {step < 7 ? (
                    <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={next}>
                      <Text style={styles.primaryButtonText}>Next →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={() => goTo(SETUP_START)}>
                      <Text style={styles.primaryButtonText}>Begin setup →</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {step < 7 && (
                  <TouchableOpacity onPress={() => goTo(SETUP_START)} style={{ marginTop: 12, alignItems: 'center' }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, fontFamily: mono }}>Skip to setup →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}

          {/* ── STEP 8 — DIVE FIRST ─────────────────────────────────── */}
          {step === 8 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>DIVE FIRST</Text>
              <Text style={styles.stepTitle}>What calls to you?</Text>
              <Text style={styles.stepSubtitle}>Pick a subject. Your first lesson begins now — no setup required.</Text>
              {DIVE_FIRST_SUBJECTS.map(subject => (
                <TouchableOpacity key={subject.name}
                  style={{ width: '100%', marginBottom: 10, borderRadius: 14, borderWidth: 1, borderColor: subject.color + '55', backgroundColor: subject.color + '0D', padding: 16 }}
                  onPress={() => { setFirstLessonSubject(subject); setShowFirstLesson(true); }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Text style={{ color: subject.color, fontSize: 28, lineHeight: 34 }}>{subject.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: subject.color, fontSize: 14, fontWeight: '700', marginBottom: 4, lineHeight: 19 }}>{subject.name}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>{subject.description}</Text>
                    </View>
                    <Text style={{ color: subject.color, fontSize: 18, alignSelf: 'center' }}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}
              <View style={[styles.navRow, { marginTop: 8 }]}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={() => goTo(SETUP_START)}>
                  <Text style={styles.primaryButtonText}>Skip to setup →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 9 — CHOOSE VOICE ────────────────────────────────── */}
          {step === 9 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>01 · 05</Text>
              <Text style={styles.stepTitle}>Choose your voice</Text>
              <Text style={styles.stepSubtitle}>4 distinct AI voices — each carries the school differently. Switch any time in Settings.</Text>
              <View style={{ width: '100%', gap: 8, marginBottom: 20 }}>
                {PERSONAS.map(p => {
                  const active = selectedPersona === p.id;
                  return (
                    <TouchableOpacity key={p.id}
                      style={{ backgroundColor: active ? p.color + '0D' : SOL_THEME.surface, borderRadius: 12, borderWidth: active ? 1.5 : 1, borderColor: active ? p.color : p.color + '33', padding: 14 }}
                      onPress={() => setSelectedPersona(p.id)}>
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

          {/* ── STEP 10 — SOVEREIGNTY BASELINE ─────────────────────── */}
          {step === 10 && (() => {
            const q = SOVEREIGNTY_QUESTIONS[Math.min(sovereigntyStep, SOVEREIGNTY_QUESTIONS.length - 1)];
            const allAnswered = Object.keys(sovereigntyAnswers).length >= SOVEREIGNTY_QUESTIONS.length;
            if (!q) return null;
            return (
              <View style={styles.stepContainer}>
                <Text style={styles.stepLabel}>02 · 05</Text>
                <Text style={styles.stepTitle}>Sovereignty baseline</Text>
                <Text style={styles.stepSubtitle}>Three questions. No wrong answers. Sol reads these to understand how you think.</Text>

                {!allAnswered ? (
                  <View style={{ width: '100%', marginBottom: 20 }}>
                    {/* Progress dots */}
                    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 20 }}>
                      {SOVEREIGNTY_QUESTIONS.map((sq, i) => (
                        <View key={sq.id} style={{ width: 6, height: 6, borderRadius: 3,
                          backgroundColor: i < sovereigntyStep ? SOL_THEME.primary : i === sovereigntyStep ? SOL_THEME.primary + '88' : SOL_THEME.border }} />
                      ))}
                    </View>
                    <Text style={{ color: SOL_THEME.text, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 6, lineHeight: 24 }}>{q.question}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>{q.subtitle}</Text>
                    <View style={{ gap: 8 }}>
                      {q.options.map(opt => {
                        const chosen = sovereigntyAnswers[q.id] === opt.id;
                        return (
                          <TouchableOpacity key={opt.id}
                            onPress={() => answerSovereignty(q.id, opt.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: chosen ? 1.5 : 1,
                              borderColor: chosen ? SOL_THEME.primary : SOL_THEME.border,
                              backgroundColor: chosen ? SOL_THEME.primary + '12' : SOL_THEME.surface,
                              padding: 14 }}>
                            <Text style={{ color: chosen ? SOL_THEME.primary : SOL_THEME.textMuted, fontSize: 20, fontFamily: mono, width: 32, textAlign: 'center' }}>{opt.glyph}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: chosen ? SOL_THEME.primary : SOL_THEME.text, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>{opt.label}</Text>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}>{opt.desc}</Text>
                            </View>
                            {chosen && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: SOL_THEME.primary }} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  // Summary card
                  <View style={{ width: '100%', marginBottom: 20 }}>
                    <View style={{ borderRadius: 14, borderWidth: 1, borderColor: SOL_THEME.primary + '55', backgroundColor: SOL_THEME.primary + '08', padding: 18, marginBottom: 20 }}>
                      <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontFamily: mono, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>YOUR SOVEREIGNTY PROFILE</Text>
                      {SOVEREIGNTY_QUESTIONS.map(sq => {
                        const chosen = sq.options.find(o => o.id === sovereigntyAnswers[sq.id]);
                        return chosen ? (
                          <View key={sq.id} style={{ flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                            <Text style={{ color: SOL_THEME.primary, fontSize: 14, fontFamily: mono }}>{chosen.glyph}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>{sq.question}</Text>
                              <Text style={{ color: SOL_THEME.text, fontSize: 12, fontWeight: '700', marginTop: 1 }}>{chosen.label}</Text>
                            </View>
                          </View>
                        ) : null;
                      })}
                      <View style={{ marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: SOL_THEME.primary + '22' }}>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, fontStyle: 'italic', lineHeight: 17 }}>
                          {persona.name} will hold this profile and use it to calibrate responses to how you actually think.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.navRow}>
                  <TouchableOpacity style={styles.backButton} onPress={() => {
                    if (sovereigntyStep > 0 && !Object.values(sovereigntyAnswers).length) setSovereigntyStep(s => s - 1);
                    else if (allAnswered) { setSovereigntyAnswers({}); setSovereigntyStep(0); }
                    else back();
                  }}>
                    <Text style={styles.backButtonText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1, opacity: allAnswered ? 1 : 0.5 }]}
                    disabled={!allAnswered}
                    onPress={next}>
                    <Text style={styles.primaryButtonText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}

          {/* ── STEP 11 — DOMAIN INTERESTS ──────────────────────────── */}
          {step === 11 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>03 · 05</Text>
              <Text style={styles.stepTitle}>Where does your interest pull?</Text>
              <Text style={styles.stepSubtitle}>Choose the domains you're drawn to. The field will take note.</Text>
              <View style={styles.domainGrid}>
                {DOMAINS.map(d => {
                  const selected = selectedDomains.has(d.label);
                  return (
                    <TouchableOpacity key={d.label}
                      style={{ alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5,
                        borderColor: selected ? d.color : d.color + '44', backgroundColor: selected ? d.color + '22' : d.color + '0A' }}
                      onPress={() => toggleDomain(d.label)}>
                      <Text style={{ color: selected ? d.color : d.color + '99', fontSize: 11, fontWeight: selected ? '700' : '500' }}>{d.label}</Text>
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

          {/* ── STEP 12 — API KEY ───────────────────────────────────── */}
          {step === 12 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>04 · 05</Text>
              <Text style={styles.stepTitle}>Connect the intelligence</Text>
              <Text style={styles.stepSubtitle}>Gemini is free. No credit card. 30 seconds.</Text>

              {/* Free mode notice — shown first */}
              <View style={{ width: '100%', backgroundColor: '#00BFA508', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#00BFA533' }}>
                <Text style={{ color: '#00BFA5', fontSize: 10, fontFamily: mono, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5 }}>◎ DON'T WORRY IF THIS ISN'T FOR YOU</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20 }}>
                  {'Sol already has a free mode built in — powered by Gemini, DeepSeek, and NVIDIA models. Use them at your leisure. You do not need your own key to get started. This step is completely optional.'}
                </Text>
              </View>

              {/* Developer / existing key holder note */}
              <View style={{ width: '100%', backgroundColor: SOL_THEME.primary + '08', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: SOL_THEME.primary + '1A' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontFamily: mono, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 }}>✦ ALREADY HAVE A GEMINI KEY?</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 19 }}>
                  Paste it below and you're done — skip the steps.
                </Text>
              </View>

              <View style={{ width: '100%', backgroundColor: SOL_THEME.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: SOL_THEME.primary + '33' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, fontFamily: mono }}>HOW TO GET A FREE KEY</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 12 }}>{'1. Tap the button below\n2. Sign in with Google\n3. Tap "Create API Key"\n4. Copy and paste it here'}</Text>
                <TouchableOpacity onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
                  style={{ backgroundColor: SOL_THEME.primary + '22', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: SOL_THEME.primary + '55', alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>Open Google AI Studio →</Text>
                </TouchableOpacity>
              </View>
              <View style={{ width: '100%', marginBottom: 16 }}>
                <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: mono, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>
                  GEMINI API KEY <Text style={{ color: SOL_THEME.success ?? '#44CC88' }}>FREE</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput style={[styles.input, { flex: 1 }]} value={geminiKey} onChangeText={setGeminiKey}
                    placeholder="Paste your key here" placeholderTextColor={SOL_THEME.textMuted}
                    secureTextEntry={!keyVisible} autoCapitalize="none" autoCorrect={false} />
                  <TouchableOpacity onPress={() => setKeyVisible(v => !v)}
                    style={{ paddingHorizontal: 12, paddingVertical: 12, backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>{keyVisible ? 'hide' : 'show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {!geminiKey.trim() && (
                <View style={{ width: '100%', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.primary + '33', backgroundColor: SOL_THEME.primary + '08', marginBottom: 12 }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontFamily: mono, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>◎ SCHOOL WORKS WITHOUT A KEY</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 19 }}>
                    {'The Mystery School, Gem Forge, LAMAGUE glyphs, Zodiac, and Sanctum all work immediately. A key unlocks AI conversation — add it in Settings whenever you\'re ready.'}
                  </Text>
                </View>
              )}
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: geminiKey.trim() ? SOL_THEME.primary : SOL_THEME.surface }]} onPress={next}>
                  <Text style={[styles.primaryButtonText, { color: geminiKey.trim() ? SOL_THEME.background : SOL_THEME.textMuted }]}>
                    {geminiKey.trim() ? 'Next →' : 'Skip for now →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── STEP 13 — ENTER ─────────────────────────────────────── */}
          {step === 13 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>05 · 05</Text>
              {/* Companion glyph */}
              <View style={{ width: 72, height: 72, borderRadius: 20, borderWidth: 1.5, borderColor: persona.color + '66', backgroundColor: persona.color + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 36, color: persona.color }}>{persona.glyph}</Text>
              </View>
              <Text style={[styles.stepTitle, { color: persona.color }]}>{persona.name} is ready.</Text>
              <Text style={styles.stepSubtitle}>What should {persona.name} call you?</Text>
              <View style={{ width: '100%', marginBottom: 16 }}>
                <TextInput style={styles.input} value={name} onChangeText={setName}
                  placeholder="Your name (optional)" placeholderTextColor={SOL_THEME.textMuted}
                  autoCapitalize="words" autoCorrect={false} returnKeyType="done" onSubmitEditing={handleBegin} />
              </View>
              {/* Lumen reward card */}
              <View style={{ width: '100%', borderRadius: 12, borderWidth: 1, borderColor: '#C49A3C55', backgroundColor: '#C49A3C0A', padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 24, color: '#C49A3C' }}>⟡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#C49A3C', fontSize: 11, fontWeight: '700', fontFamily: mono, letterSpacing: 1 }}>⟡ +{LUMEN_REWARD} LUMENS  <Text style={{ color: '#AA77FF' }}>✧ +50 VERAS</Text></Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 }}>Founding reward. Lumens spend in the shop. Veras — smallest unit of knowledge dust — earned from learning.</Text>
                </View>
              </View>
              {/* Archetype reveal — shown when sovereignty questions answered */}
              {Object.keys(sovereigntyAnswers).length >= SOVEREIGNTY_QUESTIONS.length && (() => {
                const arc = ARCHETYPES[computeArchetype(sovereigntyAnswers)];
                return (
                  <View style={{ width: '100%', borderRadius: 14, borderWidth: 1, borderColor: arc.color + '55', backgroundColor: arc.color + '0C', padding: 16, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Text style={{ fontSize: 28, color: arc.color }}>{arc.glyph}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: arc.color, fontSize: 11, fontWeight: '700', fontFamily: mono, letterSpacing: 2 }}>{arc.label}</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2, lineHeight: 17 }}>{arc.desc}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <View style={{ backgroundColor: arc.color + '18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: arc.color + '33' }}>
                        <Text style={{ color: arc.color, fontSize: 10, fontFamily: mono, fontWeight: '700' }}>✦ {arc.domain}</Text>
                      </View>
                      <View style={{ backgroundColor: arc.color + '18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: arc.color + '33' }}>
                        <Text style={{ color: arc.color, fontSize: 10, fontFamily: mono, fontWeight: '700' }}>⊚ {arc.companion}</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                {'The field is ready.\nThe school is open.\nThe Work begins now.'}
              </Text>
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1, backgroundColor: persona.color }]} onPress={handleBegin}>
                  <Text style={[styles.primaryButtonText, { color: SOL_THEME.background }]}>
                    {name.trim() ? `Enter as ${name.trim()} →` : 'Enter the Field →'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ paddingVertical: 14, alignItems: 'center' }}
                onPress={async () => { await AsyncStorage.setItem('lycheetah_onboarded', 'true'); router.replace('/(tabs)/settings' as any); }}>
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
  progressSegment: { flex: 1, height: 3, borderRadius: 2 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48, paddingTop: 28 },
  stepContainer: { alignItems: 'center', width: '100%' },
  stepLabel: {
    fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2, marginBottom: 12, alignSelf: 'flex-start',
  },
  stepTitle: { fontSize: 22, fontWeight: '700', color: SOL_THEME.text, marginBottom: 6, textAlign: 'center' },
  stepSubtitle: { fontSize: 13, color: SOL_THEME.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  domainGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16, width: '100%' },
  input: {
    backgroundColor: SOL_THEME.surface, color: SOL_THEME.text, borderRadius: 10,
    borderWidth: 1, borderColor: SOL_THEME.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, width: '100%',
  },
  navRow: { flexDirection: 'row', gap: 10, width: '100%' },
  backButton: { paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, justifyContent: 'center' },
  backButtonText: { color: SOL_THEME.textMuted, fontSize: 13, fontWeight: '600' },
  primaryButton: { backgroundColor: SOL_THEME.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: SOL_THEME.background, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
