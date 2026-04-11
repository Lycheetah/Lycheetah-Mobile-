import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, Linking, Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getCognitiveWeatherEnabled, setCognitiveWeatherEnabled, getCognitiveWeatherHour, setCognitiveWeatherHour } from '../../lib/cognitive-weather';
import { getWeirdQEnabled, setWeirdQEnabled, getWeirdQHour, setWeirdQHour } from '../../lib/weird-questions';
import { SOL_THEME } from '../../constants/theme';
import { useAppMode } from '../../lib/app-mode';
import { AIModel } from '../../lib/ai-client';
import { PROVIDERS } from '../../lib/providers/registry';
import {
  saveProviderKey, getProviderKey,
  saveModel, getModel,
  saveVariant, getVariant,
  saveUserName, getUserName,
  clearConversation,
  saveContextMemory, getContextMemory,
  saveProjectContext, getProjectContext,
  getAccentColor,
  getTokenBudget, saveTokenBudget,
  getTemperature, saveTemperature,
  getBraveKey, saveBraveKey,
  getLanguage, saveLanguage,
  getShowLamagueGloss, saveShowLamagueGloss,
  getSymbolRainEnabled, saveSymbolRainEnabled,
  getPremium, savePremium,
  getStudiedSubjects,
} from '../../lib/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, setMode } = useAppMode();
  const [providerKeys, setProviderKeys] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, string>>({});
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [isPrivate, setIsPrivate] = useState(true);
  const [userName, setUserName] = useState('');
  const [expandedProvider, setExpandedProvider] = useState<string | null>('gemini');
  const [accentColor, setAccentColor] = useState('#F5A623');
  const [contextMemory, setContextMemory] = useState<string[]>([]);
  const [newMemoryItem, setNewMemoryItem] = useState('');
  const [projectContext, setProjectContext] = useState('');
  const [tokenBudget, setTokenBudgetState] = useState(4096);
  const [temperature, setTemperatureState] = useState(0.9);
  const [braveKey, setBraveKeyState] = useState('');
  const [braveKeySaved, setBraveKeySaved] = useState(false);
  const [solMemory, setSolMemory] = useState<{ id: string; text: string; date: string }[]>([]);
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weatherHour, setWeatherHour] = useState(8);
  const [chaosMode, setChaosMode] = useState(false);
  const [weirdQEnabled, setWeirdQEnabled_] = useState(false);
  const [weirdQHour, setWeirdQHour_] = useState(9);
  const [language, setLanguage_] = useState('English');
  const [lamagueGloss, setLamagueGloss] = useState(false);
  const [symbolRainOn, setSymbolRainOn] = useState(true);
  const [premiumOn, setPremiumOn] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [studiedCount, setStudiedCount] = useState(0);

  useEffect(() => {
    getModel().then(m => {
      const resolved = m || 'gemini-2.5-flash';
      setModel(resolved);
      if (!m) saveModel(resolved);
    });
    getVariant().then(v => setIsPrivate(v === 'private'));
    getUserName().then(n => setUserName(n));
    getAccentColor().then(c => setAccentColor(c));
    getContextMemory().then(m => setContextMemory(m));
    getProjectContext().then(p => setProjectContext(p));
    getTokenBudget().then(t => setTokenBudgetState(t));
    getTemperature().then(t => setTemperatureState(t));
    getBraveKey().then(k => { if (k) { setBraveKeyState(k); setBraveKeySaved(true); } });
    AsyncStorage.getItem('sol_memory_v1').then(raw => { if (raw) setSolMemory(JSON.parse(raw)); });
    getCognitiveWeatherEnabled().then(setWeatherEnabled);
    getCognitiveWeatherHour().then(setWeatherHour);
    AsyncStorage.getItem('sol_chaos_mode').then(v => setChaosMode(v === 'true'));
    getWeirdQEnabled().then(setWeirdQEnabled_);
    getWeirdQHour().then(setWeirdQHour_);
    getLanguage().then(setLanguage_);
    getShowLamagueGloss().then(setLamagueGloss);
    getSymbolRainEnabled().then(setSymbolRainOn);
    getPremium().then(setPremiumOn);
    getStudiedSubjects().then(s => setStudiedCount(s.length));
    Promise.all(PROVIDERS.map(p => getProviderKey(p.id).then(k => ({ id: p.id, key: k || '' }))))
      .then(results => {
        const keys: Record<string, string> = {};
        results.forEach(r => { keys[r.id] = r.key; });
        setProviderKeys(keys);
        setSavedKeys({ ...keys });
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

      {/* PERSONALIZATION — formerly Customize tab */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/customize')}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.primary + '44', backgroundColor: SOL_THEME.primary + '08', marginBottom: 20 }}
        activeOpacity={0.75}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ color: SOL_THEME.primary, fontSize: 18 }}>◈</Text>
          <View>
            <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>Personalization</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 1 }}>Themes, persona auras, field experience</Text>
          </View>
        </View>
        <Text style={{ color: SOL_THEME.primary + '88', fontSize: 16 }}>→</Text>
      </TouchableOpacity>

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
      {Object.values(savedKeys).every(k => !k) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0704055', backgroundColor: '#E0704010', marginBottom: 12 }}>
          <Text style={{ fontSize: 18 }}>⚠</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#E07040', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>No API key — Sol cannot respond</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Add a free Gemini key below to get started.</Text>
          </View>
        </View>
      )}
      <Text style={styles.sectionTitle}>API KEYS & MODELS</Text>

      {PROVIDERS.map(provider => {
        const isExpanded = expandedProvider === provider.id;
        const savedKey = savedKeys[provider.id];
        const hasKey = !!savedKey;
        const providerModels = provider.models;
        const activeModel = providerModels.find(m => m.id === model);

        return (
          <View key={provider.id} style={styles.providerCard}>
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

      {/* CONTEXT MEMORY */}
      <Text style={styles.sectionTitle}>CONTEXT MEMORY</Text>
      <Text style={styles.sectionNote}>Facts injected silently into every conversation. Sol always knows.</Text>
      {contextMemory.map((item, i) => (
        <View key={i} style={styles.memoryItem}>
          <Text style={styles.memoryText} numberOfLines={1}>{item}</Text>
          <TouchableOpacity onPress={async () => {
            const updated = contextMemory.filter((_, j) => j !== i);
            setContextMemory(updated);
            await saveContextMemory(updated);
          }}>
            <Text style={styles.memoryRemove}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {contextMemory.length < 12 && (
        <View style={styles.keyRow}>
          <TextInput
            style={styles.keyInput}
            value={newMemoryItem}
            onChangeText={setNewMemoryItem}
            placeholder="e.g. I'm building a mobile app in React Native"
            placeholderTextColor={SOL_THEME.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accentColor }]}
            onPress={async () => {
              if (!newMemoryItem.trim()) return;
              const updated = [...contextMemory, newMemoryItem.trim()];
              setContextMemory(updated);
              setNewMemoryItem('');
              await saveContextMemory(updated);
            }}
          >
            <Text style={styles.saveButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CHAOS MODE */}
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={async () => {
          const next = !chaosMode;
          setChaosMode(next);
          await AsyncStorage.setItem('sol_chaos_mode', next ? 'true' : 'false');
          Alert.alert(
            next ? '↯ CHAOS MODE UNLOCKED' : '↯ CHAOS MODE DEACTIVATED',
            next ? 'Sol will become more playful, symbolic, and unpredictable. Not harmful — just spicy.' : 'Sol returns to constitutional operation.',
            [{ text: next ? 'Enter the Chaos' : 'Return to Order', style: 'default' }]
          );
        }}
        delayLongPress={3000}
      >
        <Text style={[styles.sectionTitle, chaosMode && { color: '#E74C3C' }]}>
          {chaosMode ? '↯ CHAOS MODE — ACTIVE' : '↯ CHAOS MODE'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.sectionNote}>{chaosMode ? 'Sol is operating in chaotic register. Hold section title 3s to deactivate.' : 'Hold this title for 3 seconds to unlock. Sol becomes playful, symbolic, unpredictable.'}</Text>
      {chaosMode && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E74C3C44', backgroundColor: '#E74C3C11', marginBottom: 16 }}>
          <Text style={{ color: '#E74C3C', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>↯ ACTIVE — Sol is in chaos mode</Text>
        </View>
      )}

      {/* COGNITIVE WEATHER */}
      <Text style={styles.sectionTitle}>⛅ COGNITIVE WEATHER</Text>
      <Text style={styles.sectionNote}>Daily field report notification — LQ, phase, and AURA alignment delivered at your chosen hour.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: SOL_THEME.text, fontSize: 14 }}>Daily notification</Text>
        <TouchableOpacity
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: weatherEnabled ? accentColor + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: weatherEnabled ? accentColor : SOL_THEME.border }}
          onPress={async () => {
            const next = !weatherEnabled;
            setWeatherEnabled(next);
            await setCognitiveWeatherEnabled(next);
            if (next) Alert.alert('⛅ Cognitive Weather', 'Daily field report enabled. Open Sol each day to refresh your weather forecast.');
          }}
        >
          <Text style={{ color: weatherEnabled ? accentColor : SOL_THEME.textMuted, fontSize: 13, fontWeight: '700' }}>{weatherEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>
      {weatherEnabled && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionNote, { marginBottom: 8 }]}>Delivery hour (24h): {weatherHour}:00</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[6, 7, 8, 9, 10, 18, 19, 20, 21].map(h => (
              <TouchableOpacity
                key={h}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: weatherHour === h ? accentColor + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: weatherHour === h ? accentColor : SOL_THEME.border }}
                onPress={async () => { setWeatherHour(h); await setCognitiveWeatherHour(h); }}
              >
                <Text style={{ color: weatherHour === h ? accentColor : SOL_THEME.textMuted, fontSize: 12 }}>{h}:00</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* DAILY WEIRD QUESTION */}
      <Text style={styles.sectionTitle}>⊛ DAILY WEIRD QUESTION</Text>
      <Text style={styles.sectionNote}>A daily introspective prompt from Sol. Designed to surface what you're not yet asking.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: SOL_THEME.text, fontSize: 14 }}>Daily prompt</Text>
        <TouchableOpacity
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: weirdQEnabled ? accentColor + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: weirdQEnabled ? accentColor : SOL_THEME.border }}
          onPress={async () => {
            const next = !weirdQEnabled;
            setWeirdQEnabled_(next);
            await setWeirdQEnabled(next);
            if (next) Alert.alert('⊛ Daily Weird Question', 'A new question will arrive each morning. Open Sol to engage it.');
          }}
        >
          <Text style={{ color: weirdQEnabled ? accentColor : SOL_THEME.textMuted, fontSize: 13, fontWeight: '700' }}>{weirdQEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>
      {weirdQEnabled && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionNote, { marginBottom: 8 }]}>Delivery hour (24h): {weirdQHour}:00</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[6, 7, 8, 9, 10, 18, 19, 20, 21].map(h => (
              <TouchableOpacity
                key={h}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: weirdQHour === h ? accentColor + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: weirdQHour === h ? accentColor : SOL_THEME.border }}
                onPress={async () => { setWeirdQHour_(h); await setWeirdQHour(h); }}
              >
                <Text style={{ color: weirdQHour === h ? accentColor : SOL_THEME.textMuted, fontSize: 12 }}>{h}:00</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* LANGUAGE */}
      {/* EXPERIENCE MODE */}
      <Text style={styles.sectionTitle}>◌ EXPERIENCE MODE</Text>
      <Text style={styles.sectionNote}>Three doors into the same building. The AI voice changes with each.</Text>
      <View style={{ gap: 8, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => setMode('wayfarer')}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: mode === 'wayfarer' ? '#4A9EFF' : SOL_THEME.border, backgroundColor: mode === 'wayfarer' ? '#4A9EFF11' : SOL_THEME.surface }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: mode === 'wayfarer' ? 6 : 0 }}>
            <Text style={{ fontSize: 20, color: '#4A9EFF' }}>◦</Text>
            <Text style={{ color: mode === 'wayfarer' ? '#4A9EFF' : SOL_THEME.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', flex: 1 }}>WAYFARER</Text>
            {mode === 'wayfarer' && <Text style={{ color: '#4A9EFF', fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>}
          </View>
          {mode === 'wayfarer' && <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>Plain language, warm framing. Sol speaks as a friendly thinking partner. No jargon required.</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('seeker')}
          style={{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: mode === 'seeker' ? SOL_THEME.primary : SOL_THEME.border, backgroundColor: mode === 'seeker' ? SOL_THEME.primary + '11' : SOL_THEME.surface }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: mode === 'seeker' ? 6 : 0 }}>
            <Text style={{ fontSize: 20, color: SOL_THEME.primary }}>⊚</Text>
            <Text style={{ color: mode === 'seeker' ? SOL_THEME.primary : SOL_THEME.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', flex: 1 }}>SEEKER</Text>
            {mode === 'seeker' && <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>}
          </View>
          {mode === 'seeker' && <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>Mystical language, full framework visible. Sol speaks in the field. The Mystery School opens.</Text>}
        </TouchableOpacity>
        {studiedCount < 25 ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Alert.alert('✦ ADEPT — LOCKED', `Study ${25 - studiedCount} more subject${25 - studiedCount === 1 ? '' : 's'} in the Mystery School to unlock Adept mode.\n\nAdept mode activates the full Sol Protocol — CASCADE layers, AURA invariants, field signatures.`, [{ text: 'Continue Studying', style: 'default' }])}
            style={{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, opacity: 0.6 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Text style={{ fontSize: 20, color: SOL_THEME.textMuted }}>✦</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', flex: 1 }}>ADEPT</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700' }}>LOCKED</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, height: 3, backgroundColor: SOL_THEME.border, borderRadius: 2 }}>
                <View style={{ width: `${Math.min((studiedCount / 25) * 100, 100)}%`, height: 3, backgroundColor: '#9B59B6', borderRadius: 2 }} />
              </View>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>{studiedCount}/25</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setMode('adept')}
            style={{ padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: mode === 'adept' ? '#9B59B6' : SOL_THEME.border, backgroundColor: mode === 'adept' ? '#9B59B611' : SOL_THEME.surface }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: mode === 'adept' ? 6 : 0 }}>
              <Text style={{ fontSize: 20, color: '#9B59B6' }}>✦</Text>
              <Text style={{ color: mode === 'adept' ? '#9B59B6' : SOL_THEME.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', flex: 1 }}>ADEPT</Text>
              {mode === 'adept' && <Text style={{ color: '#9B59B6', fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>}
            </View>
            {mode === 'adept' && <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>Full protocol active. Sol references CASCADE layers, names AURA invariants, signs outputs. For practitioners who know the framework.</Text>}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>🌐 LANGUAGE</Text>
      <Text style={styles.sectionNote}>Sol replies in your chosen language. No extra API needed — injected into every prompt.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {['English', 'Spanish', 'French', 'Portuguese', 'German', 'Japanese', 'Mandarin', 'Arabic', 'Hindi'].map(lang => (
          <TouchableOpacity
            key={lang}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: language === lang ? accentColor + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: language === lang ? accentColor : SOL_THEME.border }}
            onPress={async () => { setLanguage_(lang); await saveLanguage(lang); }}
          >
            <Text style={{ color: language === lang ? accentColor : SOL_THEME.textMuted, fontSize: 12 }}>{lang}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FIELD EXPERIENCE */}
      <Text style={styles.sectionTitle}>⊚ FIELD EXPERIENCE</Text>
      <Text style={styles.sectionNote}>Control ambient effects and power-user overlays.</Text>
      <View style={{ gap: 12, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '600' }}>Symbol Rain</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>Glyph cascade on ×10 coherence streak. Disable if distracting.</Text>
          </View>
          <TouchableOpacity
            onPress={async () => { const next = !symbolRainOn; setSymbolRainOn(next); await saveSymbolRainEnabled(next); }}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: symbolRainOn ? accentColor : SOL_THEME.border, justifyContent: 'center', paddingHorizontal: 3 }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: symbolRainOn ? 'flex-end' : 'flex-start' }} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '600' }}>LAMAGUE Glossary</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>Show tappable symbol chips when Sol uses LAMAGUE notation. Power-user overlay.</Text>
          </View>
          <TouchableOpacity
            onPress={async () => { const next = !lamagueGloss; setLamagueGloss(next); await saveShowLamagueGloss(next); }}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: lamagueGloss ? accentColor : SOL_THEME.border, justifyContent: 'center', paddingHorizontal: 3 }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: lamagueGloss ? 'flex-end' : 'flex-start' }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SOL MEMORY */}
      <Text style={styles.sectionTitle}>⊙ SOL MEMORY</Text>
      <Text style={styles.sectionNote}>Saved from long-pressing any message. Injected into every future conversation.</Text>
      {solMemory.length === 0 && (
        <Text style={[styles.sectionNote, { fontStyle: 'italic', marginBottom: 10 }]}>No memories saved yet. Long-press any chat message to save it.</Text>
      )}
      {solMemory.map((item) => (
        <View key={item.id} style={styles.memoryItem}>
          <Text style={[styles.memoryText, { flex: 1 }]} numberOfLines={2}>{item.text}</Text>
          <TouchableOpacity onPress={async () => {
            const updated = solMemory.filter(m => m.id !== item.id);
            setSolMemory(updated);
            await AsyncStorage.setItem('sol_memory_v1', JSON.stringify(updated));
          }}>
            <Text style={styles.memoryRemove}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {solMemory.length > 0 && (
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: 'transparent', borderWidth: 1, borderColor: SOL_THEME.border, marginBottom: 12 }]}
          onPress={() => Alert.alert('Clear all memories?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: async () => { setSolMemory([]); await AsyncStorage.removeItem('sol_memory_v1'); } },
          ])}
        >
          <Text style={[styles.saveButtonText, { color: SOL_THEME.textMuted }]}>Clear All ({solMemory.length})</Text>
        </TouchableOpacity>
      )}

      {/* PROJECT CONTEXT */}
      <Text style={styles.sectionTitle}>PROJECT CONTEXT</Text>
      <Text style={styles.sectionNote}>Paste notes, code, or context. Sol draws from this in every response.</Text>
      <TextInput
        style={styles.projectContextInput}
        value={projectContext}
        onChangeText={setProjectContext}
        onBlur={() => saveProjectContext(projectContext)}
        placeholder="Paste your project notes, architecture, goals, anything Sol should know..."
        placeholderTextColor={SOL_THEME.textMuted}
        multiline
        numberOfLines={5}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {projectContext.length > 0 && (
        <Text style={styles.contextCount}>{projectContext.length} chars · auto-saved on exit</Text>
      )}

      {/* ADVANCED — collapsible */}
      <TouchableOpacity
        onPress={() => setAdvancedOpen(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 16 }}
        activeOpacity={0.75}
      >
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>⚙ ADVANCED</Text>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>{advancedOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {advancedOpen && <>

      {/* TOKEN BUDGET */}
      <Text style={styles.sectionTitle}>TOKEN BUDGET</Text>
      <Text style={styles.sectionNote}>Max tokens per response. Higher = longer answers, more API cost.</Text>
      <View style={styles.segmentRow}>
        {[1024, 2048, 4096, 8192, 16384].map(val => (
          <TouchableOpacity
            key={val}
            style={[styles.segmentBtn, tokenBudget === val && [styles.segmentBtnActive, { borderColor: accentColor }]]}
            onPress={async () => { setTokenBudgetState(val); await saveTokenBudget(val); }}
          >
            <Text style={[styles.segmentLabel, tokenBudget === val && { color: accentColor }]}>
              {val >= 1024 ? `${val / 1024}k` : val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TEMPERATURE */}
      <Text style={styles.sectionTitle}>TEMPERATURE</Text>
      <Text style={styles.sectionNote}>Controls creativity. Lower = precise and focused. Higher = creative and varied.</Text>
      <View style={styles.segmentRow}>
        {[0.3, 0.6, 0.9, 1.2, 1.5].map(val => (
          <TouchableOpacity
            key={val}
            style={[styles.segmentBtn, temperature === val && [styles.segmentBtnActive, { borderColor: accentColor }]]}
            onPress={async () => { setTemperatureState(val); await saveTemperature(val); }}
          >
            <Text style={[styles.segmentLabel, temperature === val && { color: accentColor }]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.tempHint}>
        {temperature <= 0.3 ? 'Precise · factual · deterministic' :
         temperature <= 0.6 ? 'Focused · reliable · coherent' :
         temperature <= 0.9 ? 'Balanced · natural · recommended' :
         temperature <= 1.2 ? 'Creative · varied · expressive' :
         'Wild · experimental · unpredictable'}
      </Text>

      {/* TOOL KEYS */}
      <Text style={styles.sectionTitle}>TOOL KEYS</Text>
      <Text style={styles.sectionNote}>Power the web search tool. Brave Search gives 2000 free queries/month.</Text>
      <View style={styles.keyRow}>
        <TextInput
          style={styles.keyInput}
          value={braveKey}
          onChangeText={setBraveKeyState}
          placeholder="Brave Search API key (BSA...)"
          placeholderTextColor={SOL_THEME.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: accentColor }]}
          onPress={async () => {
            await saveBraveKey(braveKey.trim());
            setBraveKeySaved(true);
            Alert.alert('Saved', 'Brave Search key saved. Use /search in chat.');
          }}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      {braveKeySaved && <Text style={[styles.keyStatus, { color: accentColor }]}>✓ Web search active · /search query in chat</Text>}
      <Text style={styles.sectionNote}>Calculator: built-in · no key needed. URL Reader: built-in · no key needed.</Text>

      {/* VARIANT */}
      <Text style={styles.sectionTitle}>VARIANT</Text>
      <TouchableOpacity
        style={styles.variantRow}
        onPress={() => handleVariantToggle(!isPrivate)}
        activeOpacity={0.8}
      >
        <View style={styles.variantText}>
          <Text style={styles.variantLabel}>{isPrivate ? 'Sol (Private)' : 'Lycheetah (Public)'}</Text>
          <Text style={styles.variantNote}>
            {isPrivate ? 'Full Sol Protocol — your personal build' : 'Public Lycheetah variant — shareable'}
          </Text>
        </View>
        <Text style={[styles.variantToggle, { color: accentColor }]}>{isPrivate ? '◉' : '○'}</Text>
      </TouchableOpacity>

      </>}

      {/* HISTORY */}
      <Text style={styles.sectionTitle}>HISTORY</Text>
      <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
        <Text style={styles.dangerText}>Clear Conversation History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shareAppButton}
        onPress={() => Share.share({
          message: 'Lycheetah Mobile — free AI chat with Gemini, Claude, DeepSeek and more. Built different.\nhttps://github.com/Lycheetah/Lycheetah-Mobile-',
          title: 'Lycheetah Mobile',
        })}
      >
        <Text style={styles.shareAppText}>Share This App</Text>
      </TouchableOpacity>

      {/* SOVEREIGN SUPPORT — Premium */}
      <View style={{ marginBottom: 20, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: premiumOn ? '#F5A623AA' : '#F5A62344', backgroundColor: premiumOn ? '#F5A62310' : '#F5A62308' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={{ color: '#F5A623', fontSize: 14, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>⊚ SOVEREIGN SUPPORT</Text>
              {premiumOn && <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F5A62333', borderWidth: 1, borderColor: '#F5A62388' }}><Text style={{ color: '#F5A623', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>ACTIVE</Text></View>}
            </View>
            <Text style={{ color: '#F5A62399', fontSize: 12, lineHeight: 17 }}>Enhanced field atmosphere, persona symbol rain, and the warm knowledge that you're supporting the Work.</Text>
            <Text style={{ color: '#F5A62366', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>Cosmetic only. Zero functionality is gated. Sovereignty is free.</Text>
          </View>
          <TouchableOpacity
            onPress={async () => { const next = !premiumOn; setPremiumOn(next); await savePremium(next); }}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: premiumOn ? '#F5A623' : '#F5A62333', justifyContent: 'center', paddingHorizontal: 3, marginLeft: 12 }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: premiumOn ? 'flex-end' : 'flex-start' }} />
          </TouchableOpacity>
        </View>
        {premiumOn && (
          <View style={{ gap: 4 }}>
            <Text style={{ color: '#F5A62399', fontSize: 11 }}>✦ Enhanced atmosphere overlay active</Text>
            <Text style={{ color: '#F5A62399', fontSize: 11 }}>✦ Persona-specific symbol rain unlocked</Text>
            <Text style={{ color: '#F5A62399', fontSize: 11 }}>✦ The field remembers your support</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Lycheetah Framework — Open Source</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/Lycheetah/Lycheetah-Mobile-')}>
          <Text style={styles.footerLink}>github.com/Lycheetah/Lycheetah-Mobile-</Text>
        </TouchableOpacity>
        <Text style={styles.footerSub}>Built by Mackenzie Clark · Dunedin, Aotearoa NZ</Text>
        <Text style={styles.footerVersion}>v3.10.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 48 },
  freeBanner: {
    backgroundColor: '#4A9EFF18', borderWidth: 1, borderColor: '#4A9EFF55',
    borderRadius: 10, padding: 14, marginBottom: 8, marginTop: 8,
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
    flex: 1, backgroundColor: SOL_THEME.background, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, color: SOL_THEME.text,
    fontSize: 14, borderWidth: 1, borderColor: SOL_THEME.border,
  },
  saveButton: { borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  saveButtonText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 14 },
  keyStatus: { fontSize: 12, marginBottom: 4 },
  providerCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10, marginBottom: 8,
    borderWidth: 1, borderColor: SOL_THEME.border, overflow: 'hidden',
  },
  providerHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
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
    flexDirection: 'row', backgroundColor: SOL_THEME.background, borderRadius: 8,
    padding: 12, marginBottom: 6, alignItems: 'center',
    borderWidth: 1, borderColor: SOL_THEME.border,
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
  variantToggle: { fontSize: 22 },
  dangerButton: {
    backgroundColor: SOL_THEME.surface, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: SOL_THEME.error, alignItems: 'center',
  },
  dangerText: { color: SOL_THEME.error, fontSize: 14, fontWeight: '600' },
  shareAppButton: {
    marginTop: 24, backgroundColor: SOL_THEME.surface, borderRadius: 8, padding: 14,
    borderWidth: 1, borderColor: SOL_THEME.primary, alignItems: 'center',
  },
  shareAppText: { color: SOL_THEME.primary, fontSize: 14, fontWeight: '700' },
  footer: { marginTop: 20, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 14, color: SOL_THEME.primary, fontWeight: '600' },
  footerLink: { fontSize: 12, color: '#4A9EFF' },
  footerSub: { fontSize: 11, color: SOL_THEME.textMuted, textAlign: 'center' },
  footerVersion: { fontSize: 10, color: SOL_THEME.textMuted, marginTop: 2 },
  memoryItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: SOL_THEME.surface,
    borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 6, gap: 8,
  },
  memoryText: { flex: 1, fontSize: 13, color: SOL_THEME.text },
  memoryRemove: { fontSize: 12, color: SOL_THEME.textMuted },
  projectContextInput: {
    backgroundColor: SOL_THEME.surface, borderRadius: 8,
    borderWidth: 1, borderColor: SOL_THEME.border,
    padding: 12, color: SOL_THEME.text, fontSize: 13,
    minHeight: 100, textAlignVertical: 'top', marginBottom: 4,
  },
  contextCount: { fontSize: 11, color: SOL_THEME.textMuted, marginBottom: 8 },
  segmentRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  segmentBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border,
  },
  segmentBtnActive: { borderWidth: 1.5 },
  segmentLabel: { fontSize: 13, fontWeight: '600', color: SOL_THEME.textMuted },
  tempHint: { fontSize: 12, color: SOL_THEME.textMuted, marginBottom: 4, marginTop: 2 },
});
