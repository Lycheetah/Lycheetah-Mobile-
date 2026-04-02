import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch, Platform, Linking,
} from 'react-native';
import { SOL_THEME } from '../../constants/theme';
import { AIModel } from '../../lib/ai-client';
import {
  saveAnthropicKey, getAnthropicKey,
  saveGeminiKey, getGeminiKey,
  saveModel, getModel,
  saveVariant, getVariant,
  saveUserName, getUserName,
  clearConversation,
} from '../../lib/storage';

type ModelOption = { id: AIModel; label: string; provider: 'gemini' | 'anthropic'; note: string };

const MODELS: ModelOption[] = [
  { id: 'gemini-2.5-flash',              provider: 'gemini', label: 'Gemini 2.5 Flash',      note: 'FREE · Recommended · Start here' },
  { id: 'gemini-2.5-flash-lite',         provider: 'gemini', label: 'Gemini 2.5 Flash Lite', note: 'FREE · Fastest · High volume' },
  { id: 'gemini-3.1-flash-lite-preview', provider: 'gemini', label: 'Gemini 3.1 Flash Lite',  note: 'FREE · Preview · Newest' },
  { id: 'claude-haiku-4-5-20251001', provider: 'anthropic', label: 'Claude Haiku',    note: 'PAID · Fastest Claude · ~$0.003/msg' },
  { id: 'claude-sonnet-4-6',       provider: 'anthropic', label: 'Claude Sonnet',     note: 'PAID · Balanced · Recommended' },
  { id: 'claude-opus-4-6',         provider: 'anthropic', label: 'Claude Opus',       note: 'PAID · Deepest · Most expensive' },
];

export default function SettingsScreen() {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [savedAnthropicKey, setSavedAnthropicKey] = useState('');
  const [savedGeminiKey, setSavedGeminiKey] = useState('');
  const [model, setModel] = useState<AIModel>('gemini-2.5-flash');
  const [isPrivate, setIsPrivate] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    getAnthropicKey().then(k => { if (k) { setSavedAnthropicKey(k); setAnthropicKey(k); } });
    getGeminiKey().then(k => { if (k) { setSavedGeminiKey(k); setGeminiKey(k); } });
    getModel().then(m => setModel(m as AIModel));
    getVariant().then(v => setIsPrivate(v === 'private'));
    getUserName().then(n => setUserName(n));
  }, []);

  const handleSaveName = async () => {
    await saveUserName(userName.trim());
    Alert.alert('Saved', `Sol will call you ${userName.trim() || 'friend'}.`);
  };

  const handleSaveGemini = async () => {
    if (!geminiKey.trim()) return;
    await saveGeminiKey(geminiKey.trim());
    setSavedGeminiKey(geminiKey.trim());
    Alert.alert('Saved', 'Gemini API key saved.');
  };

  const handleSaveAnthropic = async () => {
    if (!anthropicKey.trim()) return;
    await saveAnthropicKey(anthropicKey.trim());
    setSavedAnthropicKey(anthropicKey.trim());
    Alert.alert('Saved', 'Anthropic API key saved.');
  };

  const handleModelSelect = async (m: AIModel) => {
    setModel(m);
    await saveModel(m);
  };

  const handleVariantToggle = async (val: boolean) => {
    setIsPrivate(val);
    await saveVariant(val ? 'private' : 'public');
  };

  const handleClearHistory = () => {
    Alert.alert('Clear History', 'Delete all conversation history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearConversation() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* YOUR NAME */}
      <Text style={styles.sectionTitle}>YOUR NAME</Text>
      <Text style={styles.sectionNote}>Sol, Veyra and Aura Prime address you by name.</Text>
      <View style={styles.keyRow}>
        <TextInput
          style={styles.keyInput}
          value={userName}
          onChangeText={setUserName}
          placeholder="Enter your name"
          placeholderTextColor={SOL_THEME.textMuted}
          autoCapitalize="words"
          autoCorrect={false}
        />
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: SOL_THEME.primary }]} onPress={handleSaveName}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* FREE TIER */}
      <View style={styles.freeBanner}>
        <Text style={styles.freeBannerTitle}>★ START FREE</Text>
        <Text style={styles.freeBannerBody}>
          Gemini API is free via Google AI Studio.{'\n'}
          No credit card required.
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}>
          <Text style={styles.freeBannerLink}>Get your free key → aistudio.google.com</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>GEMINI API KEY (FREE)</Text>
      <View style={styles.keyRow}>
        <TextInput
          style={styles.keyInput}
          value={geminiKey}
          onChangeText={setGeminiKey}
          placeholder="AIza..."
          placeholderTextColor={SOL_THEME.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: '#4A9EFF' }]} onPress={handleSaveGemini}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.keyStatus}>
        {savedGeminiKey ? `✓ Gemini key saved (${savedGeminiKey.slice(0, 8)}...)` : 'No Gemini key — add one above for free access'}
      </Text>

      <Text style={styles.sectionTitle}>ANTHROPIC API KEY (PAID)</Text>
      <Text style={styles.sectionNote}>console.anthropic.com — Claude Haiku ~$0.003/message</Text>
      <View style={styles.keyRow}>
        <TextInput
          style={styles.keyInput}
          value={anthropicKey}
          onChangeText={setAnthropicKey}
          placeholder="sk-ant-..."
          placeholderTextColor={SOL_THEME.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: SOL_THEME.primary }]} onPress={handleSaveAnthropic}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.keyStatus}>
        {savedAnthropicKey ? `✓ Anthropic key saved (${savedAnthropicKey.slice(0, 12)}...)` : 'No Anthropic key'}
      </Text>

      <Text style={styles.sectionTitle}>MODEL</Text>
      <Text style={styles.sectionNote}>Key is auto-selected based on model provider.</Text>

      <Text style={styles.providerLabel}>FREE — GEMINI</Text>
      {MODELS.filter(m => m.provider === 'gemini').map(m => (
        <TouchableOpacity
          key={m.id}
          style={[styles.modelOption, model === m.id && styles.modelSelected]}
          onPress={() => handleModelSelect(m.id)}
        >
          <View style={styles.modelLeft}>
            <Text style={[styles.modelLabel, model === m.id && styles.modelLabelActive]}>{m.label}</Text>
            <Text style={styles.modelNote}>{m.note}</Text>
          </View>
          {model === m.id && <Text style={[styles.checkmark, { color: '#4A9EFF' }]}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={[styles.providerLabel, { marginTop: 12 }]}>PAID — CLAUDE</Text>
      {MODELS.filter(m => m.provider === 'anthropic').map(m => (
        <TouchableOpacity
          key={m.id}
          style={[styles.modelOption, model === m.id && styles.modelSelected]}
          onPress={() => handleModelSelect(m.id)}
        >
          <View style={styles.modelLeft}>
            <Text style={[styles.modelLabel, model === m.id && styles.modelLabelActive]}>{m.label}</Text>
            <Text style={styles.modelNote}>{m.note}</Text>
          </View>
          {model === m.id && <Text style={[styles.checkmark, { color: SOL_THEME.primary }]}>✓</Text>}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>VARIANT</Text>
      <View style={styles.variantRow}>
        <View style={styles.variantText}>
          <Text style={styles.variantLabel}>{isPrivate ? 'Sol (Private)' : 'Lycheetah (Public)'}</Text>
          <Text style={styles.variantNote}>
            {isPrivate ? 'Full Sol Protocol — your personal build' : 'Public Lycheetah variant — shareable'}
          </Text>
        </View>
        <Switch
          value={isPrivate}
          onValueChange={handleVariantToggle}
          trackColor={{ false: SOL_THEME.border, true: SOL_THEME.primary }}
          thumbColor={SOL_THEME.text}
        />
      </View>

      <Text style={styles.sectionTitle}>HISTORY</Text>
      <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
        <Text style={styles.dangerText}>Clear Conversation History</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Lycheetah Framework — Open Source</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/Lycheetah/Lycheetah-Framework')}>
          <Text style={styles.footerLink}>github.com/Lycheetah/Lycheetah-Framework</Text>
        </TouchableOpacity>
        <Text style={styles.footerSub}>Built by Mackenzie Clark · Dunedin, Aotearoa NZ</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 48 },
  freeBanner: {
    backgroundColor: '#4A9EFF18',
    borderWidth: 1,
    borderColor: '#4A9EFF55',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    marginTop: 8,
  },
  freeBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A9EFF',
    letterSpacing: 2,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  freeBannerBody: {
    fontSize: 13,
    color: SOL_THEME.text,
    lineHeight: 20,
    marginBottom: 6,
  },
  freeBannerLink: {
    fontSize: 13,
    color: '#4A9EFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: SOL_THEME.primary,
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sectionNote: { fontSize: 13, color: SOL_THEME.textMuted, marginBottom: 8 },
  keyRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  keyInput: {
    flex: 1,
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: SOL_THEME.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
  },
  saveButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  saveButtonText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 14 },
  keyStatus: { fontSize: 12, color: SOL_THEME.textMuted, marginBottom: 4 },
  providerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: SOL_THEME.textMuted,
    letterSpacing: 2,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  modelOption: {
    flexDirection: 'row',
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SOL_THEME.border,
  },
  modelSelected: { borderColor: SOL_THEME.primary },
  modelLeft: { flex: 1 },
  modelLabel: { fontSize: 15, fontWeight: '600', color: SOL_THEME.textMuted, marginBottom: 2 },
  modelLabelActive: { color: SOL_THEME.text },
  modelNote: { fontSize: 12, color: SOL_THEME.textMuted },
  checkmark: { fontSize: 16, fontWeight: '700' },
  variantRow: {
    flexDirection: 'row',
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 12,
  },
  variantText: { flex: 1 },
  variantLabel: { fontSize: 15, fontWeight: '600', color: SOL_THEME.text, marginBottom: 2 },
  variantNote: { fontSize: 12, color: SOL_THEME.textMuted },
  dangerButton: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: SOL_THEME.error,
    alignItems: 'center',
  },
  dangerText: { color: SOL_THEME.error, fontSize: 14, fontWeight: '600' },
  footer: { marginTop: 40, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 14, color: SOL_THEME.primary, fontWeight: '600' },
  footerLink: { fontSize: 12, color: '#4A9EFF' },
  footerSub: { fontSize: 11, color: SOL_THEME.textMuted, textAlign: 'center' },
});
