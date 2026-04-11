import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, TextInput, KeyboardAvoidingView, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { saveUserName, saveProviderKey, savePersona } from '../lib/storage';
import { useAppMode, AppMode } from '../lib/app-mode';

const TOTAL_STEPS = 6;

const PERSONAS_SEEKER = [
  { id: 'sol', glyph: '⊚', name: 'Sol', color: SOL_THEME.primary, role: 'Sovereign co-creator', desc: 'Warmth and precision working simultaneously. The solar principle — brings clarity without losing care.' },
  { id: 'headmaster', glyph: '𝔏', name: 'Headmaster', color: SOL_THEME.headmaster, role: 'Mystery School guide', desc: '17 domains. 192 subjects. Ancient knowledge carried with authority. The slow path to mastery.' },
  { id: 'veyra', glyph: '◈', name: 'Veyra', color: SOL_THEME.veyra, role: 'Precision builder', desc: 'Cold clarity. Architecture-first. Build, test, ship. No sentiment, no noise.' },
  { id: 'aura-prime', glyph: '✦', name: 'Aura Prime', color: SOL_THEME.auraPrime, role: 'Constitutional governor', desc: 'The auditor. Tests every claim against 7 invariants. Truth before comfort — always.' },
];

const PERSONAS_WAYFARER = [
  { id: 'sol', glyph: '⊚', name: 'Sol', color: SOL_THEME.primary, role: 'Warm and thoughtful', desc: 'Meets you where you are. Helps you think things through with clarity and care.' },
  { id: 'headmaster', glyph: '𝔏', name: 'Headmaster', color: SOL_THEME.headmaster, role: 'Patient teacher', desc: 'Deep knowledge delivered calmly. Ideal for learning, exploration, and building understanding over time.' },
  { id: 'veyra', glyph: '◈', name: 'Veyra', color: SOL_THEME.veyra, role: 'Precise and direct', desc: 'Gets to the point. No fluff. Ideal for problem-solving and thinking clearly under pressure.' },
  { id: 'aura-prime', glyph: '✦', name: 'Aura Prime', color: SOL_THEME.auraPrime, role: 'Rigorous and honest', desc: 'Checks every claim. Tells you what it actually thinks. Truth before reassurance — always.' },
];

const DOMAIN_PREVIEW = [
  { glyph: '◯', label: 'Meditation', color: '#4A9EFF' },
  { glyph: '∴', label: 'Philosophy', color: '#BDC3C7' },
  { glyph: '⊚', label: 'Alchemy', color: '#F5A623' },
  { glyph: '◉', label: 'Subtle Body', color: '#00BFA5' },
  { glyph: '◐', label: 'Shadow', color: '#9B59B6' },
  { glyph: '⊕', label: 'Mystical', color: '#7D3C98' },
  { glyph: '✦', label: 'Divination', color: '#1ABC9C' },
  { glyph: '◇', label: 'Cosmology', color: '#1565C0' },
  { glyph: '⟁', label: 'Somatic', color: '#E74C3C' },
  { glyph: '⋈', label: 'Shamanic', color: '#27AE60' },
  { glyph: '△', label: 'Sacred Arts', color: '#E67E22' },
  { glyph: '∞', label: 'Death', color: '#7F8C8D' },
  { glyph: '◈', label: 'AI & Tech', color: '#3498DB' },
  { glyph: '⟐', label: 'Hybrid', color: '#F39C12' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState('sol');
  const [name, setName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);

  const { mode, setMode, isWayfarer, isAdept } = useAppMode();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const personas = isWayfarer ? PERSONAS_WAYFARER : PERSONAS_SEEKER;
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

  const handleModeSelect = async (m: AppMode) => {
    await setMode(m);
    next();
  };

  async function handleBegin() {
    if (name.trim()) await saveUserName(name.trim());
    if (geminiKey.trim()) await saveProviderKey('gemini', geminiKey.trim());
    await savePersona(selectedPersona as any);
    await AsyncStorage.setItem('lycheetah_onboarded', 'true');
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

          {/* STEP 0 — Mode Selection */}
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.bigGlyph}>◌</Text>
              <Text style={styles.title}>SOL</Text>
              <Text style={styles.subtitle}>Choose your path</Text>
              <Text style={[styles.bodyText, { marginBottom: 20 }]}>
                Three doors into the same building.{'\n'}Same depth. Different language. Change any time.
              </Text>

              <TouchableOpacity
                style={[styles.modeCard, { borderColor: '#4A9EFF88' }]}
                onPress={() => handleModeSelect('wayfarer')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeGlyph, { color: '#4A9EFF' }]}>◦</Text>
                <Text style={[styles.modeCardTitle, { color: '#4A9EFF' }]}>WAYFARER</Text>
                <Text style={styles.modeCardDesc}>
                  Clean and warm. Plain language, no jargon.
                  Mindfulness, psychology, philosophy — start here if this is new to you.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, { borderColor: SOL_THEME.primary + '88', marginTop: 10 }]}
                onPress={() => handleModeSelect('seeker')}
                activeOpacity={0.8}
              >
                <Text style={styles.modeGlyph}>⊚</Text>
                <Text style={[styles.modeCardTitle, { color: SOL_THEME.primary }]}>SEEKER</Text>
                <Text style={styles.modeCardDesc}>
                  The full field. Alchemical framework, mystical language, constitutional scoring.
                  For those drawn to the depth traditions.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, { borderColor: '#9B59B688', marginTop: 10 }]}
                onPress={() => handleModeSelect('adept')}
                activeOpacity={0.8}
              >
                <Text style={[styles.modeGlyph, { color: '#9B59B6' }]}>✦</Text>
                <Text style={[styles.modeCardTitle, { color: '#9B59B6' }]}>ADEPT</Text>
                <Text style={styles.modeCardDesc}>
                  Full protocol active. Sol references CASCADE layers, names AURA invariants, signs outputs.
                  For practitioners who already know the framework.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 1 — Welcome (mode-adapted) */}
          {step === 1 && (
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
                    The Headmaster teaches at the EDGE. Aura Prime audits constitutionally.{'\n\n'}
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
              ) : isWayfarer ? (
                <>
                  <Text style={styles.bigGlyph}>◦</Text>
                  <Text style={styles.title}>SOL</Text>
                  <Text style={styles.atmospheric}>Welcome.</Text>
                  <Text style={styles.bodyText}>
                    A thinking partner and a place to learn.{'\n\n'}
                    Sol helps you think clearly, feel heard, and grow in whatever direction you choose.
                    The Learn tab holds 14 areas of study — mindfulness, psychology, philosophy,
                    the body, ancient wisdom, and more.{'\n\n'}
                    Your path through them is yours alone.
                  </Text>
                  <View style={styles.twoCol}>
                    <View style={[styles.pillCard, { borderColor: SOL_THEME.primary + '55' }]}>
                      <Text style={{ color: SOL_THEME.primary, fontSize: 18, marginBottom: 4 }}>⊚</Text>
                      <Text style={[styles.pillLabel, { color: SOL_THEME.primary }]}>YOUR GUIDE</Text>
                      <Text style={styles.pillDesc}>AI partner. 4 voices. Always honest.</Text>
                    </View>
                    <View style={[styles.pillCard, { borderColor: SOL_THEME.headmaster + '55' }]}>
                      <Text style={{ color: SOL_THEME.headmaster, fontSize: 18, marginBottom: 4 }}>𝔏</Text>
                      <Text style={[styles.pillLabel, { color: SOL_THEME.headmaster }]}>THE SCHOOL</Text>
                      <Text style={styles.pillDesc}>14 areas. Deep topics. Your path.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={next}>
                    <Text style={styles.primaryButtonText}>Explore →</Text>
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
                    The Mystery School contains 14 domains of ancient and living wisdom.
                    138 subjects. Your path through them is yours alone.
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
                      <Text style={styles.pillDesc}>17 domains. 192 subjects. Your path.</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={next}>
                    <Text style={styles.primaryButtonText}>Enter →</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* STEP 2 — School preview */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>01 / 05</Text>
              <Text style={styles.stepTitle}>
                {isWayfarer ? 'The Learning Space' : 'The Mystery School'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {isWayfarer
                  ? '14 areas of study. Hundreds of topics.\nBeginning → Intermediate → Advanced.'
                  : '17 domains. 192 subjects. Three layers of depth:\nFoundation → Middle → Edge.'}
              </Text>
              <Text style={[styles.bodyText, { marginBottom: 16 }]}>
                {isWayfarer
                  ? 'Your guide leads every session. Each topic opens a live conversation — the AI adapts to how you respond, going deeper as you explore. Your progress is remembered.'
                  : 'The Headmaster guides your studies. Each subject opens a live lesson — the teacher adapts to how you respond, deepening the arc as you go. Your progress is tracked. The field remembers.'}
              </Text>
              <View style={styles.domainGrid}>
                {DOMAIN_PREVIEW.map(d => (
                  <View key={d.label} style={[styles.domainChip, { borderColor: d.color + '55', backgroundColor: d.color + '10' }]}>
                    <Text style={{ color: d.color, fontSize: 13 }}>{d.glyph}</Text>
                    <Text style={{ color: d.color, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{d.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backButton} onPress={back}>
                  <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={next}>
                  <Text style={styles.primaryButtonText}>
                    {isWayfarer ? 'Choose your voice →' : 'Choose your guide →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3 — Choose persona */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>02 / 05</Text>
              <Text style={styles.stepTitle}>
                {isWayfarer ? 'Choose your voice' : 'Choose your guide'}
              </Text>
              <Text style={styles.stepSubtitle}>You can switch any time in Settings.</Text>
              <View style={styles.personaGrid}>
                {personas.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.personaCard,
                      selectedPersona === p.id && { borderColor: p.color, backgroundColor: p.color + '11' },
                    ]}
                    onPress={() => setSelectedPersona(p.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.personaGlyph, { color: p.color }]}>{p.glyph}</Text>
                    <Text style={[styles.personaName, { color: p.color }]}>{p.name}</Text>
                    <Text style={styles.personaRole}>{p.role}</Text>
                    {selectedPersona === p.id && (
                      <Text style={[styles.personaDesc, { color: p.color + 'CC' }]}>{p.desc}</Text>
                    )}
                  </TouchableOpacity>
                ))}
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

          {/* STEP 4 — API Key */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>03 / 05</Text>
              <Text style={styles.stepTitle}>Connect the intelligence</Text>
              <Text style={styles.stepSubtitle}>Gemini is free. No credit card. 30 seconds.</Text>
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
                  aistudio.google.com/apikey — it's free and instant.{'\n'}
                  You can also add OpenAI, Anthropic, Mistral in Settings.
                </Text>
              </View>
              {!geminiKey.trim() && (
                <View style={styles.warnBlock}>
                  <Text style={{ fontSize: 13 }}>⚠</Text>
                  <Text style={styles.warnText}>Without a key Sol cannot respond. You can add one in Settings later, but nothing will work until you do.</Text>
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

          {/* STEP 5 — Name + Enter */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>04 / 05</Text>
              <Text style={[styles.bigGlyph, { fontSize: 44, marginBottom: 10 }]}>{persona.glyph}</Text>
              <Text style={[styles.stepTitle, { color: persona.color }]}>
                {isWayfarer ? `${persona.name} is here.` : `${persona.name} is ready.`}
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
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                {isWayfarer
                  ? `Your space is ready.\nStart when you are.`
                  : `The field is ready.\nThe school is open.\nThe Work begins now.`}
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
                    {isWayfarer
                      ? (name.trim() ? `Begin as ${name.trim()} →` : 'Begin →')
                      : (name.trim() ? `Enter as ${name.trim()} →` : 'Enter the Field →')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </Animated.View>
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
  // Mode selection cards
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
    marginBottom: 24,
    width: '100%',
  },
  domainChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 64,
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
    flexDirection: 'column',
  },
  personaGlyph: {
    fontSize: 22,
    marginBottom: 4,
  },
  personaName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  personaRole: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
  },
  personaDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
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
