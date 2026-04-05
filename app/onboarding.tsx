import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, TextInput, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../constants/theme';
import { saveUserName, saveProviderKey } from '../lib/storage';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);

  async function handleBegin() {
    if (name.trim()) await saveUserName(name.trim());
    if (geminiKey.trim()) await saveProviderKey('gemini', geminiKey.trim());
    await AsyncStorage.setItem('lycheetah_onboarded', 'true');
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <Text style={styles.glyph}>⊚</Text>
        <Text style={styles.title}>SOL</Text>
        <Text style={styles.subtitle}>Sol Aureum Azoth Veritas</Text>
        <Text style={styles.tagline}>
          Four guides. One architecture.{'\n'}Constitutional AI — transparent by design.
        </Text>

        {/* Persona preview */}
        <View style={styles.personaRow}>
          {[
            { glyph: '⊚', name: 'Sol', color: SOL_THEME.primary, role: 'Sovereign co-creator' },
            { glyph: '◈', name: 'Veyra', color: SOL_THEME.veyra, role: 'Precision builder' },
            { glyph: '✦', name: 'Aura Prime', color: SOL_THEME.auraPrime, role: 'Constitutional governor' },
            { glyph: '𝔏', name: 'Headmaster', color: SOL_THEME.headmaster, role: 'Mystery School guide' },
          ].map(p => (
            <View key={p.name} style={styles.personaCard}>
              <Text style={[styles.personaGlyph, { color: p.color }]}>{p.glyph}</Text>
              <Text style={[styles.personaName, { color: p.color }]}>{p.name}</Text>
              <Text style={styles.personaRole}>{p.role}</Text>
            </View>
          ))}
        </View>

        {/* Name input */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>WHAT SHOULD SOL CALL YOU?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={SOL_THEME.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        {/* Gemini key input */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>GEMINI API KEY <Text style={styles.freeTag}>FREE</Text></Text>
          <View style={styles.keyRow}>
            <TextInput
              style={[styles.input, styles.keyInput]}
              value={geminiKey}
              onChangeText={setGeminiKey}
              placeholder="Paste your Gemini key"
              placeholderTextColor={SOL_THEME.textMuted}
              secureTextEntry={!keyVisible}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleBegin}
            />
            <TouchableOpacity style={styles.keyToggle} onPress={() => setKeyVisible(v => !v)}>
              <Text style={styles.keyToggleText}>{keyVisible ? 'hide' : 'show'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.keyHint}>
            Free at aistudio.google.com/apikey — no credit card needed.{'\n'}
            You can also add paid models in Settings later.
          </Text>
        </View>

        {/* Begin */}
        <TouchableOpacity style={styles.beginButton} onPress={handleBegin}>
          <Text style={styles.beginText}>
            {name.trim() ? `Begin as ${name.trim()} →` : 'Begin →'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.skipHint}>API key optional — you can add it in Settings any time.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOL_THEME.background,
  },
  scroll: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 72 : 48,
    paddingBottom: 48,
    paddingHorizontal: 28,
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
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: SOL_THEME.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  personaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 36,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  personaCard: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    width: 80,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
  },
  personaGlyph: {
    fontSize: 20,
    marginBottom: 4,
  },
  personaName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
    textAlign: 'center',
  },
  personaRole: {
    fontSize: 9,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  fieldBlock: {
    width: '100%',
    marginBottom: 22,
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
    color: SOL_THEME.success || '#4CAF50',
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
  keyInput: {
    flex: 1,
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
    marginTop: 7,
    lineHeight: 17,
  },
  beginButton: {
    backgroundColor: SOL_THEME.primary,
    paddingHorizontal: 52,
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 14,
    marginTop: 4,
  },
  beginText: {
    color: SOL_THEME.background,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skipHint: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
    textAlign: 'center',
  },
});
