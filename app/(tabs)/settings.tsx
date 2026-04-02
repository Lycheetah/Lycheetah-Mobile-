import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Switch, Platform, Linking,
} from 'react-native';
import { SOL_THEME } from '../../constants/theme';
import { AIModel } from '../../lib/ai-client';
import { PROVIDERS } from '../../lib/providers/registry';
import {
  saveProviderKey, getProviderKey,
  saveModel, getModel,
  saveVariant, getVariant,
  saveUserName, getUserName,
  clearConversation,
} from '../../lib/storage';

export default function SettingsScreen() {
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [isPrivate, setIsPrivate] = useState(true);
  const [userName, setUserName] = useState('');
  const [expandedProvider, setExpandedProvider] = useState<string | null>('gemini');

  useEffect(() => {
    getModel().then(m => setModel(m));
    getVariant().then(v => setIsPrivate(v === 'private'));
    getUserName().then(n => setUserName(n));
    // Load all provider keys
    Promise.all(PROVIDERS.map(p => getProviderKey(p.id).then(k => ({ id: p.id, key: k || '' }))))
      .then(results => {
        const keys: Record<string, string> = {};
        results.forEach(r => { keys[r.id] = r.key; });
        setProviderKeys(keys);
        setSavedKeys({ ...keys });
        // Auto-expand first provider with a saved key
        const first = results.find(r => r.key);
        if (first) setExpandedProvider(first.id);
      });
  }, []);

  const handleSaveName = async () => {
    await saveUserName(userName.trim());
    Alert.alert('Saved', `Sol will call you ${userName.trim() || 'friend'}.`);
  };

  const handleSaveKey = async (providerId: string) => {
    const key = providerKeys[providerId]?.trim();
    if (!key) return;
    await saveProviderKey(providerId, key);
    setSavedKeys(prev => ({ ...prev, [providerId]: key }));
    Alert.alert('Saved', `${PROVIDERS.find(p => p.id === providerId)?.label} key saved.`);
  };

  const handleModelSelect = async (modelId: string) => {
    setModel(modelId);
    await saveModel(modelId);
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

      {/* FREE TIER BANNER */}
      <View style={styles.freeBanner}>
        <Text style={styles.freeBannerTitle}>★ START FREE</Text>
        <Text style={styles.freeBannerBody}>Gemini is free via Google AI Studio. DeepSeek gives free credits on signup.</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}>
          <Text style={styles.freeBannerLink}>Get Gemini key → aistudio.google.com</Text>
        </TouchableOpacity>
      </View>

      {/* PROVIDERS */}
      <Text style={styles.sectionTitle}>API KEYS & MODELS</Text>

      {PROVIDERS.map(provider => {
        const isExpanded = expandedProvider === provider.id;
        const savedKey = savedKeys[provider.id];
        const hasKey = !!savedKey;
        const providerModels = provider.models;
        const activeModel = providerModels.find(m => m.id === model);

        return (
          <View key={provider.id} style={styles.providerCard}>
            {/* Provider header — tap to expand */}
            <TouchableOpacity
              style={styles.providerHeader}
              onPress={() => setExpandedProvider(isExpanded ? null : provider.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.providerDot, { backgroundColor: provider.color }]} />
              <View style={styles.providerHeaderText}>
                <Text style={[styles.providerName, { color: hasKey ? provider.color : SOL_THEME.textMuted }]}>
                  {provider.label}
                </Text>
                <Text style={styles.providerStatus}>
                  {hasKey
                    ? activeModel ? `● ${activeModel.label}` : `● ${savedKey.slice(0, 10)}...`
                    : provider.keyHint}
                </Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.providerBody}>
                {/* Key input */}
                <Text style={styles.keyLabel}>API KEY</Text>
                <View style={styles.keyRow}>
                  <TextInput
                    style={styles.keyInput}
                    value={providerKeys[provider.id] || ''}
                    onChangeText={val => setProviderKeys(prev => ({ ...prev, [provider.id]: val }))}
                    placeholder={provider.keyPlaceholder}
                    placeholderTextColor={SOL_THEME.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: provider.color }]}
                    onPress={() => handleSaveKey(provider.id)}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
                {hasKey && (
                  <Text style={[styles.keyStatus, { color: provider.color }]}>
                    ✓ Key saved ({savedKey.slice(0, 10)}...)
                  </Text>
                )}

                {/* Models */}
                <Text style={styles.keyLabel}>MODELS</Text>
                {providerModels.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modelOption, model === m.id && [styles.modelSelected, { borderColor: provider.color }]]}
                    onPress={() => handleModelSelect(m.id)}
                  >
                    <View style={styles.modelLeft}>
                      <Text style={[styles.modelLabel, model === m.id && { color: SOL_THEME.text }]}>{m.label}</Text>
                      <Text style={styles.modelNote}>{m.note}</Text>
                    </View>
                    {model === m.id && <Text style={[styles.checkmark, { color: provider.color }]}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/* VARIANT */}
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

      {/* HISTORY */}
      <Text style={styles.sectionTitle}>HISTORY</Text>
      <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
        <Text style={styles.dangerText}>Clear Conversation History</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Lycheetah Framework — Open Source</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/Lycheetah/Lycheetah-Mobile-')}>
          <Text style={styles.footerLink}>github.com/Lycheetah/Lycheetah-Mobile-</Text>
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
    fontSize: 11, fontWeight: '700', color: '#4A9EFF',
    letterSpacing: 2, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  freeBannerBody: { fontSize: 13, color: SOL_THEME.text, lineHeight: 20, marginBottom: 6 },
  freeBannerLink: { fontSize: 13, color: '#4A9EFF', fontWeight: '600' },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: SOL_THEME.primary,
    letterSpacing: 2, marginTop: 24, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sectionNote: { fontSize: 13, color: SOL_THEME.textMuted, marginBottom: 8 },
  keyRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  keyLabel: {
    fontSize: 10, fontWeight: '700', color: SOL_THEME.textMuted,
    letterSpacing: 1.5, marginBottom: 6, marginTop: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  keyInput: {
    flex: 1, backgroundColor: SOL_THEME.background,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    color: SOL_THEME.text, fontSize: 14,
    borderWidth: 1, borderColor: SOL_THEME.border,
  },
  saveButton: { borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  saveButtonText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 14 },
  keyStatus: { fontSize: 12, marginBottom: 4 },
  // Provider cards
  providerCard: {
    backgroundColor: SOL_THEME.surface,
    borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: SOL_THEME.border,
    overflow: 'hidden',
  },
  providerHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 10,
  },
  providerDot: { width: 10, height: 10, borderRadius: 5 },
  providerHeaderText: { flex: 1 },
  providerName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  providerStatus: { fontSize: 12, color: SOL_THEME.textMuted },
  expandIcon: { fontSize: 10, color: SOL_THEME.textMuted },
  providerBody: {
    paddingHorizontal: 14, paddingBottom: 14,
    borderTopWidth: 1, borderTopColor: SOL_THEME.border,
  },
  modelOption: {
    flexDirection: 'row', backgroundColor: SOL_THEME.background,
    borderRadius: 8, padding: 12, marginBottom: 6,
    alignItems: 'center', borderWidth: 1, borderColor: SOL_THEME.border,
  },
  modelSelected: { borderColor: SOL_THEME.primary },
  modelLeft: { flex: 1 },
  modelLabel: { fontSize: 14, fontWeight: '600', color: SOL_THEME.textMuted, marginBottom: 2 },
  modelNote: { fontSize: 12, color: SOL_THEME.textMuted },
  checkmark: { fontSize: 16, fontWeight: '700' },
  variantRow: {
    flexDirection: 'row', backgroundColor: SOL_THEME.surface,
    borderRadius: 8, padding: 12, alignItems: 'center', gap: 12,
  },
  variantText: { flex: 1 },
  variantLabel: { fontSize: 15, fontWeight: '600', color: SOL_THEME.text, marginBottom: 2 },
  variantNote: { fontSize: 12, color: SOL_THEME.textMuted },
  dangerButton: {
    backgroundColor: SOL_THEME.surface, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: SOL_THEME.error, alignItems: 'center',
  },
  dangerText: { color: SOL_THEME.error, fontSize: 14, fontWeight: '600' },
  footer: { marginTop: 40, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 14, color: SOL_THEME.primary, fontWeight: '600' },
  footerLink: { fontSize: 12, color: '#4A9EFF' },
  footerSub: { fontSize: 11, color: SOL_THEME.textMuted, textAlign: 'center' },
});
