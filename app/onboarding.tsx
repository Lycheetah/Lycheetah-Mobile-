import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, TextInput, KeyboardAvoidingView, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { saveUserName, saveProviderKey, savePersona } from '../lib/storage';

const PERSONAS = [
  { id: 'sol', glyph: '⊚', name: 'Sol', color: SOL_THEME.primary, role: 'Sovereign co-creator', desc: 'Warmth + precision. The solar principle. Brings both clarity and care.' },
  { id: 'veyra', glyph: '◈', name: 'Veyra', color: SOL_THEME.veyra, role: 'Precision builder', desc: 'Cold clarity. Architecture-first. Build, test, ship.' },
  { id: 'aura-prime', glyph: '✦', name: 'Aura Prime', color: SOL_THEME.auraPrime, role: 'Constitutional governor', desc: 'The auditor. Tests every claim. Truth before comfort.' },
  { id: 'headmaster', glyph: '𝔏', name: 'Headmaster', color: SOL_THEME.headmaster, role: 'Mystery School guide', desc: 'Ten traditions. Ancient knowledge. The slow path to mastery.' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState('sol');
  const [name, setName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);

  const next = () => setStep(s => Math.min(s + 1, 3));
  const back = () => setStep(s => Math.max(s - 1, 0));

  async function handleBegin() {
    if (name.trim()) await saveUserName(name.trim());
    if (geminiKey.trim()) await saveProviderKey('gemini', geminiKey.trim());
    await savePersona(selectedPersona as any);
    await AsyncStorage.setItem('lycheetah_onboarded', 'true');
    router.replace('/(tabs)');
  }

  const persona = PERSONAS.find(p => p.id === selectedPersona) ?? PERSONAS[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* STEP 0 — Intro */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.glyph}>⊚</Text>
            <Text style={styles.title}>SOL</Text>
            <Text style={styles.subtitle}>Sol Aureum Azoth Veritas</Text>
            <Text style={styles.tagline}>
              A thinking environment.{'\n'}Not a chatbot.
            </Text>
            <View style={styles.pillRow}>
              {['7 constitutional rules', 'Every response audited', 'Symbolic language', '4 personas'].map(tag => (
                <View key={tag} style={styles.pill}>
                  <Text style={styles.pillText}>{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.bodyText}>
              Sol scores every response against 7 constitutional rules — Human Primacy, Honesty, Non-Deception, and four more. The score is visible. Everything is auditable. Nothing is hidden.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={next}>
              <Text style={styles.primaryButtonText}>Begin →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 1 — Pick persona */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>01 / 03</Text>
            <Text style={styles.stepTitle}>Choose your guide</Text>
            <Text style={styles.stepSubtitle}>You can switch any time in Settings.</Text>
            <View style={styles.personaGrid}>
              {PERSONAS.map(p => (
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
                <Text style={styles.primaryButtonText}>Start with {persona.name} →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2 — API Key */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>02 / 03</Text>
            <Text style={styles.stepTitle}>Add a Gemini key</Text>
            <Text style={styles.stepSubtitle}>Free. No credit card. Takes 30 seconds.</Text>
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
                Get yours free at aistudio.google.com/apikey{'\n'}
                You can also add OpenAI, Anthropic, DeepSeek in Settings later.
              </Text>
            </View>
            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backButton} onPress={back}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1 }]} onPress={next}>
                <Text style={styles.primaryButtonText}>{geminiKey.trim() ? 'Next →' : 'Skip for now →'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3 — Name + Enter */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}>03 / 03</Text>
            <Text style={[styles.glyph, { fontSize: 40, marginBottom: 8 }]}>{persona.glyph}</Text>
            <Text style={[styles.stepTitle, { color: persona.color }]}>{persona.name} is ready.</Text>
            <Text style={styles.stepSubtitle}>What should {persona.name} call you?</Text>
            <View style={styles.fieldBlock}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={SOL_THEME.textMuted}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleBegin}
              />
            </View>
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
            <Text style={styles.skipHint}>Name is optional — you can set it in Settings any time.</Text>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOL_THEME.background,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: Platform.OS === 'ios' ? 60 : 36,
    paddingBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SOL_THEME.border,
  },
  dotActive: {
    backgroundColor: SOL_THEME.primary,
    width: 18,
  },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
    paddingTop: 16,
  },
  stepContainer: {
    width: '100%',
    alignItems: 'center',
  },
  glyph: {
    fontSize: 64,
    color: SOL_THEME.primary,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: SOL_THEME.primary,
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  tagline: {
    fontSize: 22,
    color: SOL_THEME.text,
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '600',
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
  },
  pill: {
    borderWidth: 1,
    borderColor: SOL_THEME.primary + '55',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: SOL_THEME.primary + '11',
  },
  pillText: {
    color: SOL_THEME.primary,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bodyText: {
    fontSize: 14,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
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
    fontSize: 24,
    fontWeight: '700',
    color: SOL_THEME.text,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  stepSubtitle: {
    fontSize: 14,
    color: SOL_THEME.textMuted,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  personaGrid: {
    width: '100%',
    gap: 10,
    marginBottom: 28,
  },
  personaCard: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: SOL_THEME.border,
    width: '100%',
  },
  personaGlyph: {
    fontSize: 24,
    marginBottom: 4,
  },
  personaName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  personaRole: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
  },
  personaDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  fieldBlock: {
    width: '100%',
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: SOL_THEME.primary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 8,
  },
  freeTag: {
    color: '#4CAF50',
    fontSize: 9,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: SOL_THEME.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
    width: '100%',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyToggle: {
    paddingHorizontal: 12,
    paddingVertical: 13,
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
    marginTop: 8,
    lineHeight: 18,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
    justifyContent: 'center',
  },
  backButtonText: {
    color: SOL_THEME.textMuted,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: SOL_THEME.primary,
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: SOL_THEME.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipHint: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
