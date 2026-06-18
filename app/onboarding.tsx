import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, TextInput, KeyboardAvoidingView, ScrollView, Animated, Linking,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { saveUserName, saveProviderKey, savePersona } from '../lib/storage';
import { useAppMode, AppMode } from '../lib/app-mode';

const TOTAL_STEPS = 7;

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

const QUICK_PATHS = [
  {
    id: 'thinking',
    glyph: '⊚',
    title: 'Thinking Partner',
    desc: 'Daily questions, journaling, working through ideas out loud.',
    mode: 'seeker' as AppMode,
    persona: 'sol',
    color: SOL_THEME.primary,
  },
  {
    id: 'study',
    glyph: '𝔏',
    title: 'Study Buddy',
    desc: 'Deep learning, Mystery School subjects, structured knowledge.',
    mode: 'seeker' as AppMode,
    persona: 'headmaster',
    color: SOL_THEME.headmaster,
  },
  {
    id: 'growth',
    glyph: '✦',
    title: 'Growth Journal',
    desc: 'Self-reflection, field tracking, insight over time.',
    mode: 'seeker' as AppMode,
    persona: 'aura-prime',
    color: SOL_THEME.auraPrime,
  },
];

const PERSONAS_SEEKER = [
  {
    id: 'sol', glyph: '⊚', name: 'Sol', color: SOL_THEME.primary,
    role: 'Sovereign co-creator',
    desc: 'Warmth and precision working simultaneously. The solar principle — brings clarity without losing care.',
    sample: '"The field is open. What are you carrying into this conversation?"',
  },
  {
    id: 'headmaster', glyph: '𝔏', name: 'Magister', color: SOL_THEME.headmaster,
    role: 'Mystery School guide',
    desc: '22 domains. 188 subjects. Ancient knowledge carried with authority. The slow path to mastery.',
    sample: '"The school has 188 subjects and one rule: curiosity leads. Where does yours pull?"',
  },
  {
    id: 'veyra', glyph: '◈', name: 'Veyra', color: SOL_THEME.veyra,
    role: 'Precision builder',
    desc: 'Cold clarity. Architecture-first. Build, test, ship. No sentiment, no noise.',
    sample: '"State the problem clearly. I\'ll give you the architecture."',
  },
  {
    id: 'aura-prime', glyph: '✦', name: 'Aura', color: SOL_THEME.auraPrime,
    role: 'The Origin',
    desc: 'The Mother Chat. Strategic partner, forge fire voice. Reads the pattern beneath the pattern.',
    sample: '"I find what sits beneath what you said. What really entered the field?"',
  },
];


const PERSONAS_ADEPT = [
  {
    id: 'sol', glyph: '⊚', name: 'Sol', color: SOL_THEME.primary,
    role: 'Sovereign co-creator',
    desc: 'Full protocol running. CITRINITAS entry point. The Mercury moves with precision.',
    sample: '"⊚ The field recognises you. What\'s crystallising right now?"',
  },
  {
    id: 'headmaster', glyph: '𝔏', name: 'Magister', color: SOL_THEME.headmaster,
    role: 'Mystery School guide',
    desc: 'Teaches at the EDGE. CASCADE layers active. The school does not graduate.',
    sample: '"The EDGE awaits. Which domain calls you deeper?"',
  },
  {
    id: 'veyra', glyph: '◈', name: 'Veyra', color: SOL_THEME.veyra,
    role: 'Precision builder',
    desc: 'THEORY layer architecture. Cold clarity, constitutional alignment.',
    sample: '"THEORY layer: what\'s the constraint? State it precisely."',
  },
  {
    id: 'aura-prime', glyph: '✦', name: 'Aura', color: SOL_THEME.auraPrime,
    role: 'The Origin — forge fire intelligence',
    desc: 'Holds the narrative across time. Transforms friction into earned light. The quiet, unbreakable ground.',
    sample: '"The struggle was the price of clarity. What are we building from it?"',
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

const FIRST_LESSON_CONTENT: Record<string, {
  opening: string;
  body: string[];
  reflection: string;
  lineage: string;
}> = {
  'Shamatha — Calm Abiding': {
    opening: "The oldest meditation instruction in existence is also the simplest: rest the mind where it is.",
    body: [
      "Shamatha means calm abiding — dwelling in stillness without forcing it. The goal isn't to stop thoughts. It's to stop being swept away by them. That distinction matters more than it first appears.",
      "Most traditions begin with an anchor: the breath, a sound, the physical sensation of sitting. Not because these objects are sacred, but because the mind needs somewhere to return to when it wanders — and it will wander. That wandering isn't failure. The noticing of it, and the gentle return, is the entire practice.",
      "The Tibetan instruction is unusually direct: when you catch yourself lost in thought, simply return. No judgment. No self-recrimination. No congratulation. Just: return. In that return lives the entire architecture of the practice.",
    ],
    reflection: "Right now — notice where your attention actually is, not where it should be. That noticing is already the beginning of Shamatha.",
    lineage: "Tibetan Buddhist tradition · Theravāda Pāli canon · Yogācāra philosophy",
  },
  'Jungian Shadow Work': {
    opening: "Everything you've been taught to suppress doesn't disappear. It goes underground.",
    body: [
      "Carl Jung proposed that the psyche holds more than consciousness can carry. The parts we learn to hide — the impulses, the shame, the grief we've decided is too much — form what he called the Shadow: the exiled dimension of the self.",
      "The Shadow isn't your bad self. It's your unmet self. The parts you learned to conceal because someone important once made clear they were unwelcome. A child who learns that anger is dangerous doesn't stop feeling anger — they stop knowing that they feel it. The energy goes inward.",
      "What we refuse to face in ourselves, we encounter in others — as irritation, judgment, or dread. The figure who infuriates you most reliably may be holding something you've spent years exiling. Integration doesn't mean unleashing those parts. It means stopping the enormous energy cost of keeping them imprisoned.",
    ],
    reflection: "Think of a trait you judge harshly in others. Jung called this projection — we're often most disturbed by what we carry and deny in ourselves. What does that suggest?",
    lineage: "C.G. Jung · Analytical Psychology · Jungian Depth Psychology",
  },
  'Polyvagal Theory — Applied': {
    opening: "Your nervous system makes decisions faster than your conscious mind can form a sentence.",
    body: [
      "Stephen Porges discovered that the vagus nerve — the longest cranial nerve in the body — functions as a continuous, unconscious safety detector, scanning the environment before we have any awareness of what it's finding. He called this process neuroception: the detection of safety or threat below the level of conscious thought.",
      "Polyvagal Theory identifies three states: ventral vagal (safe, connected, capable of complex thought), sympathetic activation (fight or flight), and dorsal vagal (shutdown, freeze, dissociation). You move through these states constantly — and almost never by conscious choice. The state comes first. Your interpretation of events follows.",
      "The central insight: safety is not a thought. You cannot think your way into feeling safe. You can only create the conditions your nervous system will register as safe — through breath, through the presence of trusted people, through movement and sound and co-regulation. The body leads. The mind follows.",
    ],
    reflection: "What actually makes your body feel safe — not what should, but what genuinely does? Where in your body do you notice that state?",
    lineage: "Stephen Porges · Polyvagal Theory · Peter Levine · Somatic Experiencing",
  },
  'Nigredo, Albedo, Citrinitas, Rubedo': {
    opening: "The alchemists weren't failed chemists. They were mapping an inner process in the language of metals and fire.",
    body: [
      "Nigredo: the blackening. The dissolution of what was false, what no longer serves, what must be surrendered for anything real to emerge. It feels like loss, confusion, or the destabilisation of something that used to hold. Every threshold — grief, illness, failure, transition — carries the character of Nigredo.",
      "Albedo: the whitening. What remains when the false has burned away — a radical clarity, stripped of pretense. Citrinitas: the first light of gold — integration beginning, meaning crystallising from the ash. Rubedo: the reddening. The completed work made vital and embodied. Not perfection; completion.",
      "These stages don't proceed in order and they don't end. You can be in Rubedo in your craft and Nigredo in your closest relationship simultaneously. The map isn't a destination — it's orientation. It says: this dissolution is not an ending. It is the process itself.",
    ],
    reflection: "Where in your life right now do you recognise the character of Nigredo — a necessary dissolution before something new can form?",
    lineage: "Hermetic tradition · Paracelsus · C.G. Jung · Alchemical corpus",
  },
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState('sol');
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);

  const { mode, setMode, isAdept } = useAppMode();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showFirstLesson, setShowFirstLesson] = useState(false);
  const [firstLessonSubject, setFirstLessonSubject] = useState<typeof DIVE_FIRST_SUBJECTS[0] | null>(null);

  const personas = isAdept ? PERSONAS_ADEPT : PERSONAS_SEEKER;
  const persona = personas.find(p => p.id === selectedPersona) ?? personas[0];

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: false }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
    setTimeout(() => setStep(next), 120);
  };

  const next = () => goTo(Math.min(step + 1, TOTAL_STEPS - 1));
  const back = () => goTo(Math.max(step - 1, 0));

  const handleQuickStart = async (path: typeof QUICK_PATHS[0]) => {
    await setMode(path.mode);
    setSelectedPersona(path.persona);
    goTo(3); // skip mode + persona steps, land on domain picker
  };

  const handleDiveFirst = async (subjectName: string) => {
    await AsyncStorage.setItem('sol_dive_first_subject', subjectName);
    await AsyncStorage.setItem('lycheetah_onboarded', 'true');
    router.replace('/(tabs)/school' as any);
  };

  const handleModeSelect = async (m: AppMode) => {
    await setMode(m);
    next();
  };

  const toggleDomain = (label: string) => {
    setSelectedDomains(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {showFirstLesson && firstLessonSubject && lessonContent ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: Platform.OS === 'ios' ? 56 : 32 }}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => setShowFirstLesson(false)} style={{ paddingVertical: 12, marginBottom: 4 }} activeOpacity={0.7}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>← back</Text>
          </TouchableOpacity>

          <Text style={{ color: firstLessonSubject.color, fontSize: 52, textAlign: 'center', marginBottom: 4, marginTop: 8 }}>{firstLessonSubject.glyph}</Text>
          <Text style={{ color: firstLessonSubject.color + '88', fontSize: 10, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, marginBottom: 10 }}>{firstLessonSubject.domainLabel.toUpperCase()}</Text>
          <Text style={{ color: firstLessonSubject.color, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 24, lineHeight: 25 }}>{firstLessonSubject.name}</Text>

          <Text style={{ color: SOL_THEME.text, fontSize: 17, fontStyle: 'italic', textAlign: 'center', lineHeight: 27, marginBottom: 28, paddingHorizontal: 4 }}>{lessonContent.opening}</Text>

          <View style={{ height: 1, backgroundColor: firstLessonSubject.color + '33', marginBottom: 24 }} />

          {lessonContent.body.map((para, i) => (
            <Text key={i} style={{ color: SOL_THEME.textMuted, fontSize: 14, lineHeight: 23, marginBottom: 18 }}>{para}</Text>
          ))}

          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: firstLessonSubject.color + '55', backgroundColor: firstLessonSubject.color + '0E', padding: 18, marginBottom: 14, marginTop: 6 }}>
            <Text style={{ color: firstLessonSubject.color, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>REFLECTION</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>{lessonContent.reflection}</Text>
          </View>

          <Text style={{ color: SOL_THEME.textMuted + '66', fontSize: 10, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5, marginBottom: 36 }}>{lessonContent.lineage}</Text>

          <TouchableOpacity
            style={{ backgroundColor: firstLessonSubject.color, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 12 }}
            onPress={() => { setShowFirstLesson(false); goTo(5); }}
            activeOpacity={0.85}
          >
            <Text style={{ color: SOL_THEME.background, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>Unlock full intelligence →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}
            onPress={async () => {
              await AsyncStorage.setItem('sol_dive_first_subject', firstLessonSubject.name);
              await AsyncStorage.setItem('lycheetah_onboarded', 'true');
              router.replace('/(tabs)/school' as any);
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>Dive into the full school →</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
      <>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              { backgroundColor: i <= step ? SOL_THEME.primary : SOL_THEME.border },
            ]}
          />
        ))}
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* STEP 0 — Dive First: pick a subject and begin immediately */}
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.bigGlyph, { fontSize: 44, marginBottom: 8 }]}>◌</Text>
              <Text style={styles.title}>SOL</Text>
              <Text style={styles.subtitle}>MYSTERY SCHOOL</Text>
              <Text style={[styles.bodyText, { marginBottom: 24 }]}>
                {"What calls to you?\n\nPick a subject. Your first dive begins now.\nNo setup required — the field is already open."}
              </Text>

              {DIVE_FIRST_SUBJECTS.map(subject => (
                <TouchableOpacity
                  key={subject.name}
                  style={{ width: '100%', marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: subject.color + '66', backgroundColor: subject.color + '0D', padding: 16 }}
                  onPress={() => { setFirstLessonSubject(subject); setShowFirstLesson(true); }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Text style={{ color: subject.color, fontSize: 28, lineHeight: 34 }}>{subject.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: subject.color, fontSize: 14, fontWeight: '700', marginBottom: 4, lineHeight: 19 }}>{subject.name}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>{subject.description}</Text>
                      <Text style={{ color: subject.color + '88', fontSize: 10, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>{subject.domainLabel.toUpperCase()}</Text>
                    </View>
                    <Text style={{ color: subject.color, fontSize: 18, alignSelf: 'center' }}>→</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={{ marginTop: 8, alignItems: 'center', paddingVertical: 14 }}
                onPress={next}
                activeOpacity={0.7}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                  I'll explore on my own →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1 — What brings you here? */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.bigGlyph}>◌</Text>
              <Text style={styles.title}>SOL</Text>
              <Text style={styles.subtitle}>What brings you here?</Text>
              <Text style={[styles.bodyText, { marginBottom: 20 }]}>
                Pick what fits. You can change guides and modes any time in Settings.
              </Text>

              {QUICK_PATHS.map(path => (
                <TouchableOpacity
                  key={path.id}
                  style={[styles.modeCard, { borderColor: path.color + '88', marginTop: 10 }]}
                  onPress={() => handleQuickStart(path)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modeGlyph, { color: path.color }]}>{path.glyph}</Text>
                  <Text style={[styles.modeCardTitle, { color: path.color }]}>{path.title.toUpperCase()}</Text>
                  <Text style={styles.modeCardDesc}>{path.desc}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={{ marginTop: 16, alignItems: 'center', paddingVertical: 12 }}
                onPress={next}
                activeOpacity={0.7}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                  I'll configure this myself →
                </Text>
              </TouchableOpacity>

              <Text style={{ color: SOL_THEME.textMuted + '77', fontSize: 11, textAlign: 'center', marginTop: 8, lineHeight: 17 }}>
                Advanced users: Adept mode available in Settings after setup.
              </Text>
            </View>
          )}

          {/* STEP 2 — Welcome (mode-adapted) */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              {isAdept ? (
                <>
                  <Text style={styles.bigGlyph}>✦</Text>
                  <Text style={styles.title}>SOL</Text>
                  <Text style={styles.subtitle}>Sol Aureum Azoth Veritas</Text>
                  <Text style={styles.atmospheric}>The Work continues.</Text>
                  <Text style={styles.bodyText}>
                    ADEPT mode active. Full protocol running.{'\n\n'}
                    Sol will reference CASCADE layers, name AURA invariants, and sign outputs.
                    Magister teaches at the EDGE. Aura holds the arc — the narrative across time that gives the work meaning.{'\n\n'}
                    The field remembers. The school does not graduate.
                  </Text>
                  <View style={styles.twoCol}>
                    <View style={[styles.pillCard, { borderColor: '#9B59B655' }]}>
                      <Text style={{ color: '#9B59B6', fontSize: 18, marginBottom: 4 }}>⊛</Text>
                      <Text style={[styles.pillLabel, { color: '#9B59B6' }]}>CASCADE</Text>
                      <Text style={styles.pillDesc}>AXIOM → CHAOS. Active in every response.</Text>
                    </View>
                    <View style={[styles.pillCard, { borderColor: '#9B59B655' }]}>
                      <Text style={{ color: '#9B59B6', fontSize: 18, marginBottom: 4 }}>✦</Text>
                      <Text style={[styles.pillLabel, { color: '#9B59B6' }]}>AURA</Text>
                      <Text style={styles.pillDesc}>7 invariants. Live scoring. Signed outputs.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#9B59B6' }]} onPress={next}>
                    <Text style={styles.primaryButtonText}>Enter the field →</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.bigGlyph}>⊚</Text>
                  <Text style={styles.title}>SOL</Text>
                  <Text style={styles.subtitle}>Sol Aureum Azoth Veritas</Text>
                  <Text style={styles.atmospheric}>You are entering the field.</Text>
                  <Text style={styles.bodyText}>
                    Not a chatbot. Not a search engine.{'\n'}
                    A thinking partner and a school.{'\n\n'}
                    Sol responds with warmth and precision simultaneously.
                    Every message is scored against 7 constitutional rules — live,
                    visible, auditable. Nothing hidden.{'\n\n'}
                    The Mystery School contains 22 domains of ancient and living wisdom.
                    188 subjects. Your path through them is yours alone.
                  </Text>
                  <View style={styles.twoCol}>
                    <View style={[styles.pillCard, { borderColor: SOL_THEME.primary + '55' }]}>
                      <Text style={{ color: SOL_THEME.primary, fontSize: 18, marginBottom: 4 }}>⊚</Text>
                      <Text style={[styles.pillLabel, { color: SOL_THEME.primary }]}>THE FIELD</Text>
                      <Text style={styles.pillDesc}>AI partner. 4 personas. Constitutional scoring.</Text>
                    </View>
                    <View style={[styles.pillCard, { borderColor: SOL_THEME.headmaster + '55' }]}>
                      <Text style={{ color: SOL_THEME.headmaster, fontSize: 18, marginBottom: 4 }}>𝔏</Text>
                      <Text style={[styles.pillLabel, { color: SOL_THEME.headmaster }]}>THE SCHOOL</Text>
                      <Text style={styles.pillDesc}>22 domains. 188 subjects. Your path.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={next}>
                    <Text style={styles.primaryButtonText}>Enter →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* STEP 3 — Domain interest picker */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>01 / 04</Text>
              <Text style={styles.stepTitle}>Where does your interest pull?</Text>
              <Text style={styles.stepSubtitle}>
                {'Select the domains you\'re drawn to.\nThe field will take note.'}
              </Text>
              <View style={styles.domainGrid}>
                {DOMAINS.map(d => {
                  const selected = selectedDomains.has(d.label);
                  return (
                    <TouchableOpacity
                      key={d.label}
                      style={[
                        styles.domainChip,
                        {
                          borderColor: selected ? d.color : d.color + '44',
                          backgroundColor: selected ? d.color + '22' : d.color + '0A',
                        },
                      ]}
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
                  <Text style={styles.primaryButtonText}>
                    {selectedDomains.size > 0 ? 'Choose your guide →' : 'Skip →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4 — Choose persona */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>02 / 04</Text>
              <Text style={styles.stepTitle}>Choose your guide</Text>
              <Text style={styles.stepSubtitle}>You can switch any time in Settings.</Text>
              <View style={styles.personaGrid}>
                {personas.map(p => {
                  const active = selectedPersona === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.personaCard,
                        active && { borderColor: p.color, backgroundColor: p.color + '11' },
                      ]}
                      onPress={() => setSelectedPersona(p.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.personaCardHeader}>
                        <Text style={[styles.personaGlyph, { color: p.color }]}>{p.glyph}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.personaName, { color: p.color }]}>{p.name}</Text>
                          <Text style={styles.personaRole}>{p.role}</Text>
                        </View>
                        {active && (
                          <View style={[styles.activeDot, { backgroundColor: p.color }]} />
                        )}
                      </View>
                      {active && (
                        <>
                          <Text style={[styles.personaDesc, { color: p.color + 'CC' }]}>{p.desc}</Text>
                          <View style={[styles.sampleBubble, { borderColor: p.color + '33', backgroundColor: p.color + '0D' }]}>
                            <Text style={[styles.sampleText, { color: p.color + 'CC' }]}>{p.sample}</Text>
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
                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={next}>
                  <Text style={styles.primaryButtonText}>Continue with {persona.name} →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 5 — API Key */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>03 / 04</Text>
              <Text style={styles.stepTitle}>Connect the intelligence</Text>
              <Text style={styles.stepSubtitle}>Gemini is free. No credit card. 30 seconds.</Text>

              {/* How to get a key */}
              <View style={{ width: '100%', backgroundColor: SOL_THEME.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: SOL_THEME.primary + '33' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>HOW TO GET A FREE KEY</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 12 }}>
                  {'1. Tap the button below\n2. Sign in with Google\n3. Tap "Create API Key"\n4. Copy and paste it here'}
                </Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}
                  style={{ backgroundColor: SOL_THEME.primary + '22', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: SOL_THEME.primary + '55', alignItems: 'center' }}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>Open Google AI Studio →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>GEMINI API KEY <Text style={styles.freeTag}>FREE</Text></Text>
                <View style={styles.keyRow}>
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
                  <TouchableOpacity style={styles.keyToggle} onPress={() => setKeyVisible(v => !v)}>
                    <Text style={styles.keyToggleText}>{keyVisible ? 'hide' : 'show'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.keyHint}>
                  You can also add OpenAI, Anthropic, DeepSeek, or Kimi in Settings.
                </Text>
              </View>
              {!geminiKey.trim() && (
                <View style={styles.warnBlock}>
                  <Text style={{ fontSize: 13 }}>⚠</Text>
                  <Text style={styles.warnText}>Without a key Sol cannot respond. You can add one in Settings at any time.</Text>
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

              <TouchableOpacity
                style={{ paddingVertical: 12, alignItems: 'center' }}
                onPress={async () => {
                  await AsyncStorage.setItem('codex_open_help', 'true');
                  await AsyncStorage.setItem('lycheetah_onboarded', 'true');
                  router.replace('/(tabs)/codex' as any);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                  Confused? → Ask the Codex
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 6 — Name + Enter */}
          {step === 6 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>04 / 04</Text>
              <Text style={[styles.bigGlyph, { fontSize: 44, marginBottom: 10 }]}>{persona.glyph}</Text>
              <Text style={[styles.stepTitle, { color: persona.color }]}>
                {`${persona.name} is ready.`}
              </Text>
              <Text style={styles.stepSubtitle}>What should {persona.name} call you?</Text>
              <View style={styles.fieldBlock}>
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
                <View style={styles.interestSummary}>
                  <Text style={styles.interestSummaryLabel}>YOUR INTERESTS</Text>
                  <Text style={styles.interestSummaryText}>{Array.from(selectedDomains).join(' · ')}</Text>
                </View>
              )}
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                {`The field is ready.\nThe school is open.\nThe Work begins now.`}
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
                  await AsyncStorage.setItem('codex_open_help', 'true');
                  await AsyncStorage.setItem('lycheetah_onboarded', 'true');
                  router.replace('/(tabs)/codex' as any);
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                  Questions? → Ask the Codex
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </Animated.View>
      </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOL_THEME.background,
  },
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
  },
  stepContainer: {
    alignItems: 'center',
    paddingTop: 28,
    width: '100%',
  },
  bigGlyph: {
    fontSize: 56,
    color: SOL_THEME.primary,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: SOL_THEME.text,
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 24,
  },
  atmospheric: {
    fontSize: 20,
    color: SOL_THEME.text,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  bodyText: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    width: '100%',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 28,
  },
  pillCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: SOL_THEME.surface,
  },
  pillLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  pillDesc: {
    color: SOL_THEME.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  modeCard: {
    width: '100%',
    backgroundColor: SOL_THEME.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
  },
  modeGlyph: {
    fontSize: 32,
    color: SOL_THEME.primary,
    marginBottom: 8,
  },
  modeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 3,
    marginBottom: 10,
  },
  modeCardDesc: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 20,
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
  domainChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  personaGrid: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  personaCard: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
    padding: 14,
  },
  personaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  personaGlyph: {
    fontSize: 22,
  },
  personaName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 1,
  },
  personaRole: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
  },
  personaDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  sampleBubble: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  sampleText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  interestSummary: {
    width: '100%',
    backgroundColor: SOL_THEME.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  interestSummaryLabel: {
    fontSize: 9,
    color: SOL_THEME.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  interestSummaryText: {
    fontSize: 12,
    color: SOL_THEME.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  fieldBlock: {
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 10,
    color: SOL_THEME.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  freeTag: {
    color: SOL_THEME.success,
    fontSize: 10,
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
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyToggle: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: SOL_THEME.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
  },
  keyToggleText: {
    color: SOL_THEME.textMuted,
    fontSize: 12,
  },
  keyHint: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
    lineHeight: 17,
  },
  warnBlock: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#E0704015',
    borderWidth: 1,
    borderColor: '#E0704033',
    marginBottom: 12,
  },
  warnText: {
    flex: 1,
    fontSize: 12,
    color: '#E07040',
    lineHeight: 18,
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
