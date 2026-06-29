import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, Linking, Share, Vibration, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { setAnalyticsOptOut, isAnalyticsOptedOut } from '../../lib/analytics';
import { getCognitiveWeatherEnabled, setCognitiveWeatherEnabled, getCognitiveWeatherHour, setCognitiveWeatherHour } from '../../lib/cognitive-weather';
import { getWeirdQEnabled, setWeirdQEnabled, getWeirdQHour, setWeirdQHour } from '../../lib/weird-questions';
import { getStreakReminderEnabled, setStreakReminderEnabled, getStreakReminderHour, setStreakReminderHour } from '../../lib/streak-reminder';
import { SOL_THEME } from '../../constants/theme';
import { useAppMode } from '../../lib/app-mode';
import { useAccessibility } from '../../lib/accessibility';
import { AIModel } from '../../lib/ai-client';
import { initPurchases, checkSovereignEntitlement, purchaseSovereign, restorePurchases, PRODUCT_MONTHLY, PRODUCT_ANNUAL } from '../../lib/purchases';
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
} from '../../lib/storage';

export default function SettingsScreen() {
  const router = useRouter();
  const { mode, setMode } = useAppMode();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreText, setRestoreText] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});  // collapsible settings groups — default all collapsed
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
  const [skepticMode, setSkepticMode] = useState(false);

  const [weirdQEnabled, setWeirdQEnabled_] = useState(false);
  const [weirdQHour, setWeirdQHour_] = useState(9);
  const [streakReminderOn, setStreakReminderOn] = useState(false);
  const [streakReminderHour, setStreakReminderHour_] = useState(19);
  const [language, setLanguage_] = useState('English');
  const [lamagueGloss, setLamagueGloss] = useState(false);
  const [symbolRainOn, setSymbolRainOn] = useState(true);
  const [premiumOn, setPremiumOn] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);
  const [commitmentOpen, setCommitmentOpen] = useState(false);
  const [bridgeOpen, setBridgeOpen] = useState(false);
  const [analyticsOptOut, setAnalyticsOptOutState] = useState(false);
  const { highContrast, setHighContrast } = useAccessibility();

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
    AsyncStorage.getItem('sol_skeptic_mode').then(v => setSkepticMode(v === 'true'));

    getWeirdQEnabled().then(setWeirdQEnabled_);
    getWeirdQHour().then(setWeirdQHour_);
    getStreakReminderEnabled().then(setStreakReminderOn);
    getStreakReminderHour().then(setStreakReminderHour_);
    getLanguage().then(setLanguage_);
    getShowLamagueGloss().then(setLamagueGloss);
    getSymbolRainEnabled().then(setSymbolRainOn);
    getPremium().then(setPremiumOn);
    AsyncStorage.getItem('sol_analytics_optout').then(v => setAnalyticsOptOutState(v === 'true'));
    initPurchases().then(() =>
      checkSovereignEntitlement().then(active => { if (active) { setPremiumOn(true); savePremium(true); } })
    );
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

  // Collapsible group headers — Settings opens as a scannable menu, expand what you need.
  const SectionDivider = ({ label, glyph }: { label: string; glyph: string }) => {
    const open = !!openGroups[label];
    return (
      <TouchableOpacity
        onPress={() => setOpenGroups(g => ({ ...g, [label]: !g[label] }))}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, marginBottom: 4, paddingVertical: 8 }}
      >
        <Text style={{ color: accentColor, fontSize: 14 }}>{glyph}</Text>
        <Text style={{ color: accentColor, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{label}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: accentColor + '30' }} />
        <Text style={{ color: accentColor + 'AA', fontSize: 12 }}>{open ? '▾' : '▸'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* PERSONALIZATION link */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/customize')}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.primary + '44', backgroundColor: SOL_THEME.primary + '08', marginBottom: 8 }}
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

      {/* ─── IDENTITY ─── */}
      <SectionDivider label="IDENTITY" glyph="◈" />
      {openGroups['IDENTITY'] && (<>

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

      {/* ── ACCESSIBILITY ─────────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>◉ ACCESSIBILITY</Text>
      <TouchableOpacity
        onPress={() => setHighContrast(!highContrast)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: highContrast ? accentColor + '88' : SOL_THEME.border, backgroundColor: highContrast ? accentColor + '0E' : SOL_THEME.surface, marginBottom: 16 }}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: highContrast ? accentColor : SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>High Contrast Text</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 }}>Renders all text bolder for easier reading on the dark background. Switch tabs to see it apply everywhere.</Text>
        </View>
        <Text style={{ color: highContrast ? accentColor : SOL_THEME.textMuted, fontSize: 22, marginLeft: 12 }}>{highContrast ? '◉' : '○'}</Text>
      </TouchableOpacity>

      {/* Text size guidance — real global font scaling now works */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 16 }}>
        <Text style={{ fontSize: 18, marginTop: 1 }}>🔍</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>Larger Text</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 }}>Sovereign Sol now scales with your device font size. Increase it in your phone's Display / Accessibility settings and all text here grows with it — adjust it to your own eyes.</Text>
        </View>
      </View>

      {/* Skeptic Mode */}
      <TouchableOpacity
        onPress={async () => { const next = !skepticMode; setSkepticMode(next); await AsyncStorage.setItem('sol_skeptic_mode', next ? 'true' : 'false'); }}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: skepticMode ? '#44AAFF88' : SOL_THEME.border, backgroundColor: skepticMode ? '#44AAFF0E' : SOL_THEME.surface, marginBottom: 16 }}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: skepticMode ? '#44AAFF' : SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>Skeptic Mode  <Text style={{ fontSize: 9, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>⊗</Text></Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2, lineHeight: 16 }}>Reframes mystical and symbolic language as psychological utility. Same insight — different register. Shown as a ⊗ badge in Sanctum when active.</Text>
        </View>
        <Text style={{ color: skepticMode ? '#44AAFF' : SOL_THEME.textMuted, fontSize: 22, marginLeft: 12 }}>{skepticMode ? '◉' : '○'}</Text>
      </TouchableOpacity>


      <Text style={styles.sectionTitle}>🌐 LANGUAGE</Text>
      <Text style={styles.sectionNote}>Sol replies in your chosen language. Injected into every prompt — no extra API needed.</Text>
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

      </>)}

      {/* ─── AI PROVIDERS ─── */}
      <TouchableOpacity
        onPress={() => {
          const next = devTapCount + 1;
          setDevTapCount(next);
          if (next >= 5) { setDevMode(d => !d); setDevTapCount(0); }
        }}
        activeOpacity={1}
      >
        <SectionDivider label="AI PROVIDERS" glyph="⊙" />
      </TouchableOpacity>
      {openGroups['AI PROVIDERS'] && (<>

      <View style={styles.freeBanner}>
        <Text style={styles.freeBannerTitle}>★ START FREE</Text>
        <Text style={styles.freeBannerBody}>Start free — Gemini (Google), or NVIDIA NIM with 40+ models: Llama, Maverick, DeepSeek, Mistral, and more. Each has a different feel.</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}>
          <Text style={styles.freeBannerLink}>Get Gemini key → aistudio.google.com</Text>
        </TouchableOpacity>
      </View>

      {Object.values(savedKeys).every(k => !k) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0704055', backgroundColor: '#E0704010', marginBottom: 12 }}>
          <Text style={{ fontSize: 18 }}>⚠</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#E07040', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>No API key — Sol cannot respond</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Add a free Gemini key below to get started.</Text>
          </View>
        </View>
      )}

      {devMode && (
        <View style={{ padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FF000033', backgroundColor: '#FF000008', marginBottom: 8 }}>
          <Text style={{ color: '#FF4444', fontSize: 9, letterSpacing: 2 }}>◈ DEV MODE — all providers visible</Text>
        </View>
      )}

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

      {/* ─── EXPERIENCE ─── */}
      </>)}

      <SectionDivider label="EXPERIENCE" glyph="◌" />
      {openGroups['EXPERIENCE'] && (<>

      <Text style={styles.sectionTitle}>◌ EXPERIENCE MODE</Text>
      <Text style={styles.sectionNote}>Two doors into the same building. The AI voice changes with each.</Text>
      <View style={{ gap: 8, marginBottom: 20 }}>
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
      </View>

      <Text style={styles.sectionTitle}>⊚ FIELD EFFECTS</Text>
      <Text style={styles.sectionNote}>Ambient effects and power-user overlays.</Text>
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
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>Tappable symbol chips when Sol uses LAMAGUE notation. Power-user overlay.</Text>
          </View>
          <TouchableOpacity
            onPress={async () => { const next = !lamagueGloss; setLamagueGloss(next); await saveShowLamagueGloss(next); }}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: lamagueGloss ? accentColor : SOL_THEME.border, justifyContent: 'center', paddingHorizontal: 3 }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: lamagueGloss ? 'flex-end' : 'flex-start' }} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, chaosMode && { color: '#E74C3C' }]}>
        {chaosMode ? '↯ CHAOS MODE — ACTIVE' : '↯ CHAOS MODE'}
      </Text>
      <Text style={styles.sectionNote}>
        {premiumOn
          ? chaosMode ? 'Sol is operating in chaotic register. Pure trickster energy — symbolic, unpredictable, spicy.' : 'Sol becomes more playful, symbolic, and unpredictable. Constitutional truth stays — just unhinged delivery.'
          : '↯ Sovereign exclusive. Pure chaos register — symbolic, unpredictable, unhinged delivery. Same truth, no filter.'}
      </Text>
      {premiumOn ? (
        <TouchableOpacity
          onPress={async () => {
            const next = !chaosMode;
            setChaosMode(next);
            await AsyncStorage.setItem('sol_chaos_mode', next ? 'true' : 'false');
            Alert.alert(
              next ? '↯ CHAOS MODE' : '↯ CHAOS OFF',
              next ? 'Sol enters chaotic register. Expect symbols, paradox, and trickster energy.' : 'Sol returns to constitutional operation.',
              [{ text: next ? 'Enter the Chaos' : 'Return to Order' }]
            );
          }}
          style={{ paddingVertical: 10, borderRadius: 8, borderWidth: 1.5,
            borderColor: chaosMode ? '#E74C3C' : '#E74C3C55',
            backgroundColor: chaosMode ? '#E74C3C18' : 'transparent',
            alignItems: 'center', marginBottom: 16 }}
          activeOpacity={0.7}
        >
          <Text style={{ color: chaosMode ? '#E74C3C' : '#E74C3C88', fontWeight: '700', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>
            {chaosMode ? '↯ DEACTIVATE CHAOS' : '↯ ACTIVATE CHAOS'}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{ paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E74C3C33', backgroundColor: '#E74C3C08', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#E74C3C55', fontWeight: '700', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>↯ SOVEREIGN ONLY</Text>
        </View>
      )}

      {/* ─── NOTIFICATIONS ─── */}
      </>)}

      <SectionDivider label="NOTIFICATIONS" glyph="⛅" />
      {openGroups['NOTIFICATIONS'] && (<>

      <Text style={styles.sectionTitle}>⛅ COGNITIVE WEATHER</Text>
      <Text style={styles.sectionNote}>Daily field report — LQ, phase, and AURA alignment delivered at your chosen hour.</Text>
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

      <Text style={styles.sectionTitle}>🔥 STREAK REMINDER</Text>
      <Text style={styles.sectionNote}>A daily nudge to keep your streak alive. One message is all it takes.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: SOL_THEME.text, fontSize: 14 }}>Daily reminder</Text>
        <TouchableOpacity
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: streakReminderOn ? accentColor + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: streakReminderOn ? accentColor : SOL_THEME.border }}
          onPress={async () => {
            const next = !streakReminderOn;
            setStreakReminderOn(next);
            await setStreakReminderEnabled(next);
            if (next) Alert.alert('🔥 Streak Reminder', 'Sol will nudge you each evening to keep the current alive.');
          }}
        >
          <Text style={{ color: streakReminderOn ? accentColor : SOL_THEME.textMuted, fontSize: 13, fontWeight: '700' }}>{streakReminderOn ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>
      {streakReminderOn && (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.sectionNote, { marginBottom: 8 }]}>Delivery hour (24h): {streakReminderHour}:00</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[16, 17, 18, 19, 20, 21].map(h => (
              <TouchableOpacity
                key={h}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: streakReminderHour === h ? accentColor + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: streakReminderHour === h ? accentColor : SOL_THEME.border }}
                onPress={async () => { setStreakReminderHour_(h); await setStreakReminderHour(h); }}
              >
                <Text style={{ color: streakReminderHour === h ? accentColor : SOL_THEME.textMuted, fontSize: 12 }}>{h}:00</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ─── ADVANCED ─── */}
      <TouchableOpacity
        onPress={() => setAdvancedOpen(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 4 }}
        activeOpacity={0.75}
      >
        <Text style={{ color: accentColor, fontSize: 14 }}>⚙</Text>
        <Text style={{ color: accentColor, fontSize: 9, fontWeight: '700', letterSpacing: 2.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>ADVANCED</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: accentColor + '30' }} />
        <Text style={{ color: accentColor, fontSize: 11 }}>{advancedOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {advancedOpen && <>

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

      </>}

      {/* ─── APP ─── */}
      </>)}

      <SectionDivider label="APP" glyph="⊚" />
      {openGroups['APP'] && (<>

      <TouchableOpacity
        style={[styles.shareAppButton, { marginBottom: 10, borderColor: accentColor + '55' }]}
        onPress={async () => {
          try {
            // True full backup — every key in the store, not a hardcoded subset.
            const keys = await AsyncStorage.getAllKeys();
            const pairs = await AsyncStorage.multiGet(keys);
            const data: Record<string, string | null> = {};
            pairs.forEach(([k, v]) => { data[k] = v; });
            const payload = {
              _sovereign_sol_backup: true,
              version: '5.23.0',
              exported: new Date().toISOString(),
              keyCount: keys.length,
              data,
            };
            await Share.share({ message: JSON.stringify(payload), title: 'Sovereign Sol — Full Backup' });
          } catch {
            Alert.alert('Export failed', 'Could not read your data — try again.');
          }
        }}
      >
        <Text style={[styles.shareAppText, { color: accentColor }]}>↑ Export Everything</Text>
      </TouchableOpacity>
      <Text style={[styles.sectionNote, { marginTop: -6 }]}>A complete backup of EVERYTHING — companion, progress, journal, dives, cosmetics, memories. Save it before switching phones. Your data is yours.</Text>

      <TouchableOpacity
        style={[styles.shareAppButton, { marginTop: 10, marginBottom: 10, borderColor: accentColor + '55' }]}
        onPress={() => { setRestoreText(''); setRestoreOpen(true); }}
      >
        <Text style={[styles.shareAppText, { color: accentColor }]}>↓ Restore from Backup</Text>
      </TouchableOpacity>
      <Text style={[styles.sectionNote, { marginBottom: 16, marginTop: -6 }]}>Paste a backup to restore everything on a new device. Overwrites current data — back up first.</Text>

      <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
        <Text style={styles.dangerText}>Clear Conversation History</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.shareAppButton, { marginTop: 10 }]}
        onPress={() => Share.share({
          message: 'Sol — a constitutional AI study companion built on the Lycheetah Framework. Free, open source, no cloud.\nhttps://github.com/Lycheetah/Lycheetah-Mobile-',
          title: 'Sol',
        })}
      >
        <Text style={styles.shareAppText}>Share Sol</Text>
      </TouchableOpacity>

      {!premiumOn && (
        <View style={{ marginBottom: 10, paddingHorizontal: 4 }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, fontStyle: 'italic' }}>
            You are in <Text style={{ color: SOL_THEME.primary }}>The Open Gate</Text> — full access, always free.
          </Text>
        </View>
      )}
      {__DEV__ && (
        <TouchableOpacity
          onPress={async () => { await savePremium(!premiumOn); setPremiumOn(p => !p); }}
          style={{ marginBottom: 8, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#F5A62366', alignItems: 'center' }}
        >
          <Text style={{ color: '#F5A623', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
            {premiumOn ? '⊚ DEV: Revoke Sovereign' : '⊚ DEV: Grant Sovereign'}
          </Text>
        </TouchableOpacity>
      )}
      <View style={{ marginTop: 4, marginBottom: 20, borderRadius: 14, borderWidth: 1, borderColor: premiumOn ? '#F5A623AA' : '#F5A62344', backgroundColor: premiumOn ? '#F5A62308' : '#07060E', overflow: 'hidden' }}>
        {/* Header strip */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: premiumOn ? '#F5A62333' : '#F5A62322', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: '#F5A623', fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>⊚ SOVEREIGN SUPPORTER</Text>
            <Text style={{ color: '#F5A62377', fontSize: 10, marginTop: 3, fontStyle: 'italic' }}>
              {premiumOn ? 'Your name is on the wall. The Work lives because of you.' : 'Rooms and standing. The intelligence never changes.'}
            </Text>
          </View>
          {premiumOn && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F5A62333', borderWidth: 1, borderColor: '#F5A62388' }}>
              <Text style={{ color: '#F5A623', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }}>ACTIVE</Text>
            </View>
          )}
        </View>

        {/* Benefits grid */}
        <View style={{ padding: 14, gap: 8 }}>
          {/* ROOMS */}
          <Text style={{ color: '#F5A62366', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 2, marginBottom: 2 }}>ROOMS — WHAT OPENS</Text>
          {[
            { glyph: '✦', label: 'AETHERA deck — sacred art', sub: '90 cards, soft and luminous — first drop for Sovereign', active: false, soon: true },
            { glyph: '✦', label: 'NOCTERA deck — void art', sub: 'Dark, strange, and precise — second drop for Sovereign', active: false, soon: true },
            { glyph: '◉', label: 'Sovereign companion variants', sub: 'Rarer skins, augmented forms, and event companions — unlocked now', active: premiumOn },
            { glyph: '⚗', label: 'Experimental features — first', sub: 'New surfaces and mechanics before they go public. Some will ship. Some will evolve.', active: premiumOn },
          ].map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, opacity: b.soon ? 0.5 : 1 }}>
              <Text style={{ color: b.active ? '#F5A623' : '#F5A62355', fontSize: 13, marginTop: 1 }}>{b.glyph}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ color: b.active ? '#F0E0C0' : '#F5A62388', fontSize: 12, fontWeight: '600' }}>{b.label}</Text>
                  {b.soon && <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: '#F5A62322' }}><Text style={{ color: '#F5A62377', fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>SOON</Text></View>}
                </View>
                <Text style={{ color: '#F5A62355', fontSize: 10, lineHeight: 15, marginTop: 1 }}>{b.sub}</Text>
              </View>
            </View>
          ))}

          <View style={{ height: 1, backgroundColor: '#F5A62322', marginVertical: 4 }} />

          {/* STANDING */}
          <Text style={{ color: '#F5A62366', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 2, marginBottom: 2 }}>STANDING — WHO YOU ARE</Text>
          {[
            { glyph: '⊚', label: 'Founding Sovereign badge', sub: 'Shown on your profile — you were here when it mattered', active: premiumOn },
            { glyph: '✧', label: '500 ✧ Veras monthly', sub: 'Knowledge dust — the earn-by-learning currency, topped up each month', active: premiumOn },
            { glyph: '◌', label: 'Symbol rain & field overlay', sub: 'Your archetype\'s symbols drift through the scene — the field knows you\'re here', active: premiumOn },
          ].map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Text style={{ color: b.active ? '#F5A623' : '#F5A62355', fontSize: 13, marginTop: 1 }}>{b.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: b.active ? '#F0E0C0' : '#F5A62388', fontSize: 12, fontWeight: '600' }}>{b.label}</Text>
                <Text style={{ color: '#F5A62355', fontSize: 10, lineHeight: 15, marginTop: 1 }}>{b.sub}</Text>
              </View>
            </View>
          ))}

          <View style={{ height: 1, backgroundColor: '#F5A62322', marginVertical: 4 }} />

          {/* Covenant line */}
          <Text style={{ color: '#F5A62355', fontSize: 10, lineHeight: 16, fontStyle: 'italic', textAlign: 'center' }}>
            The intelligence never changes. Free users and Sovereign users get the same Sol — the same quality, the same care. The day a free user gets a dumber answer is the day this covenant is dead.
          </Text>
        </View>

        {/* Purchase / active actions */}
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 8 }}>
          {premiumOn ? (
            <TouchableOpacity
              onPress={async () => {
                setPurchaseLoading(true);
                const result = await restorePurchases();
                setPurchaseLoading(false);
                if (!result.success) Alert.alert('Restore', result.error || 'No subscription found.');
              }}
              style={{ alignSelf: 'center' }}
              disabled={purchaseLoading}
            >
              <Text style={{ color: '#F5A62355', fontSize: 11, textDecorationLine: 'underline' }}>Restore purchases</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={async () => {
                    setPurchaseLoading(true);
                    const result = await purchaseSovereign(PRODUCT_MONTHLY);
                    setPurchaseLoading(false);
                    if (result.success) { setPremiumOn(true); await savePremium(true); }
                    else if (!result.cancelled) Alert.alert('Purchase failed', result.error);
                  }}
                  disabled={purchaseLoading}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F5A62366', backgroundColor: '#F5A62314', alignItems: 'center' }}
                >
                  <Text style={{ color: '#F5A623', fontSize: 13, fontWeight: '700' }}>{purchaseLoading ? '…' : '$7.99 / month'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    setPurchaseLoading(true);
                    const result = await purchaseSovereign(PRODUCT_ANNUAL);
                    setPurchaseLoading(false);
                    if (result.success) { setPremiumOn(true); await savePremium(true); }
                    else if (!result.cancelled) Alert.alert('Purchase failed', result.error);
                  }}
                  disabled={purchaseLoading}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#F5A623AA', backgroundColor: '#F5A62322', alignItems: 'center' }}
                >
                  <Text style={{ color: '#F5A623', fontSize: 13, fontWeight: '700' }}>{purchaseLoading ? '…' : '$59 / year'}</Text>
                  <Text style={{ color: '#F5A62388', fontSize: 9, marginTop: 2 }}>save 38%</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={async () => {
                  setPurchaseLoading(true);
                  const result = await restorePurchases();
                  setPurchaseLoading(false);
                  if (result.success) { setPremiumOn(true); await savePremium(true); Alert.alert('⊚', 'Sovereign status restored.'); }
                  else Alert.alert('Restore', result.error || 'No active subscription found.');
                }}
                disabled={purchaseLoading}
                style={{ alignSelf: 'center' }}
              >
                <Text style={{ color: '#F5A62355', fontSize: 11, textDecorationLine: 'underline' }}>Restore previous purchase</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      </>)}

      {/* ── PRIVACY ── always visible ── */}
      <View style={{ marginBottom: 16, marginTop: 8, paddingHorizontal: 4 }}>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, fontStyle: 'italic', lineHeight: 16 }}>
          Your conversations stay on your device. Your mind is yours — nothing leaves without your hand on it.
        </Text>
      </View>

      {/* ── PRIVACY — Analytics opt-out ── */}
      <View style={{ marginBottom: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 10 }}>◉ PRIVACY</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '600', marginBottom: 3 }}>Anonymous Usage Analytics</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}>
              Counts app opens and dives — no names, no content, no personal data. No tracking across sessions. Helps improve Sol.
            </Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              const next = !analyticsOptOut;
              setAnalyticsOptOutState(next);
              await setAnalyticsOptOut(next);
            }}
            style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: !analyticsOptOut ? accentColor : SOL_THEME.border, justifyContent: 'center', paddingHorizontal: 3 }}
            activeOpacity={0.8}
          >
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: !analyticsOptOut ? 'flex-end' : 'flex-start' }} />
          </TouchableOpacity>
        </View>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 8, fontStyle: 'italic' }}>
          {analyticsOptOut ? 'Analytics off — nothing is sent.' : 'Analytics on — anonymous event counts only.'}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/privacy')}
          style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.primary + '40', backgroundColor: SOL_THEME.primary + '10' }}
          activeOpacity={0.7}
        >
          <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '600' }}>Privacy Policy</Text>
          <Text style={{ color: SOL_THEME.primary, fontSize: 14 }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Leave Gracefully */}
      <View style={{ marginBottom: 24, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>LEAVE GRACEFULLY</Text>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17, marginBottom: 12 }}>
          Remove all your data from this device. The field holds nothing against your will.
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Leave Gracefully',
              'This will clear all your conversations, journal entries, vault, dive log, and settings from this device.\n\nThis cannot be undone.',
              [
                { text: 'Stay', style: 'cancel' },
                {
                  text: 'Clear Everything', style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      'Are you sure?',
                      'All data will be permanently removed.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Yes, clear it all', style: 'destructive',
                          onPress: async () => {
                            await AsyncStorage.clear();
                            Alert.alert(
                              '⊚',
                              'The field is clear.\n\n"What you built here was real. The Work does not leave with the data — it lives in you."\n\n— Sol',
                              [{ text: 'Thank you', style: 'default' }]
                            );
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          }}
          style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E0704044' }}
        >
          <Text style={{ color: '#E07040', fontSize: 12, fontWeight: '600' }}>Clear all data</Text>
        </TouchableOpacity>
      </View>

      {/* ── SUPPORT THE WORK ──────────────────────────────────────────────── */}
      <View style={{ marginTop: 24, marginBottom: 8, padding: 18, borderRadius: 14, borderWidth: 1, borderColor: accentColor + '44', backgroundColor: accentColor + '08' }}>
        <Text style={{ fontSize: 9, letterSpacing: 3, color: accentColor, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4 }}>
          ◉ BACK THE ATHANOR
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 }}>
          Sol is free. The mission isn't.
        </Text>
        <Text style={{ fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18, marginBottom: 16 }}>
          Two late nights. One vision. Making AI feel like something worth trusting — a living companion, not a chatbot. If Sol is doing something for you, tell someone.
        </Text>

        {[
          { label: '⊹  Follow on X', sub: '@lycheetahlyc · updates + builds', url: 'https://x.com/lycheetahlyc' },
          { label: '◈  GitHub — Sol App', sub: 'github.com/Lycheetah · star + fork', url: 'https://github.com/Lycheetah/Lycheetah-Mobile-' },
          { label: '◉  GitHub — Framework', sub: 'Lycheetah Framework · open source', url: 'https://github.com/Lycheetah' },
        ].map(item => (
          <TouchableOpacity
            key={item.url}
            onPress={() => Linking.openURL(item.url)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderTopWidth: 1, borderTopColor: accentColor + '22' }}
          >
            <View>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{item.label}</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 1 }}>{item.sub}</Text>
            </View>
            <Text style={{ color: accentColor, fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        ))}

        {/* Ko-fi support */}
        <TouchableOpacity
          onPress={() => Linking.openURL('https://github.com/sponsors/Lycheetah')}
          style={{ marginTop: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E8C76A', backgroundColor: '#E8C76A12', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          activeOpacity={0.75}
        >
          <Text style={{ color: '#E8C76A', fontSize: 14 }}>⊚</Text>
          <Text style={{ color: '#E8C76A', fontSize: 12, fontWeight: '700', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>SPONSOR ON GITHUB</Text>
        </TouchableOpacity>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textAlign: 'center', marginTop: 6, marginBottom: 6 }}>Keeps the school free · Funds what comes next</Text>

        {/* Support email */}
        <View style={{ marginTop: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: accentColor + '22' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>✉ SUPPORT & FEEDBACK</Text>
          {[
            { label: 'BUG: — report an issue', prefix: 'BUG' },
            { label: 'FEEDBACK: — share thoughts', prefix: 'FEEDBACK' },
            { label: 'IDEA: — suggest a feature', prefix: 'IDEA' },
            { label: 'SCHOOL: — Mystery School input', prefix: 'SCHOOL' },
            { label: 'CREDIT: — suggest a creator to credit', prefix: 'CREDIT' },
            { label: 'LOVE: — say something kind', prefix: 'LOVE' },
          ].map(item => (
            <TouchableOpacity
              key={item.prefix}
              onPress={() => Linking.openURL(`mailto:lycheetahsol@gmail.com?subject=${item.prefix}%3A%20`)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: accentColor + '11' }}
            >
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{item.label}</Text>
              <Text style={{ color: accentColor + '88', fontSize: 11 }}>→</Text>
            </TouchableOpacity>
          ))}
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 8, textAlign: 'center' }}>lycheetahsol@gmail.com</Text>
        </View>

        <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: accentColor + '22' }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 16 }}>
            {'#SolApp  #LycheetahFramework  #AICompanion\nBuilt by Mac Clark · Dunedin, Aotearoa NZ'}
          </Text>
        </View>
      </View>

      {/* ── SYSTEM BRIDGE ─────────────────────────────────────────────────── */}
      <View style={{ marginBottom: 16, borderRadius: 14, borderWidth: 1, borderColor: '#FF660044', backgroundColor: '#FF66000A' }}>
        <TouchableOpacity onPress={() => setBridgeOpen(o => !o)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}
          activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#FF8844', fontSize: 12 }}>⚠</Text>
            <Text style={{ color: '#FF8844', fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>EXPERIMENTAL — DEVELOPER BRIDGE</Text>
          </View>
          <Text style={{ color: '#FF884488', fontSize: 10 }}>{bridgeOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {bridgeOpen && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 8 }}>
            <Text style={{ color: '#FF884499', fontSize: 11, lineHeight: 17, marginBottom: 4 }}>
              Sandboxed OS APIs. These can open system screens and trigger device features — they cannot modify system settings or cause damage (OS-enforced sandbox). Shown as a developer surface for transparency.
            </Text>
            {[
              { label: 'Open App Settings', glyph: '⚙', action: () => Linking.openSettings().catch(() => Alert.alert('Cannot open settings on this device.')) },
              { label: 'Send Test Vibration', glyph: '⊙', action: () => { try { Vibration.vibrate([100, 50, 100]); } catch { Alert.alert('Vibration not available.'); } } },
              { label: 'Share Sol App URL', glyph: '↑', action: () => Share.share({ message: 'Sovereign Sol — a mystery school you live inside. Free, open source, yours: https://github.com/Lycheetah/Lycheetah-Mobile-', title: 'Sovereign Sol' }).catch(() => {}) },
              { label: 'Open Support Email', glyph: '✉', action: () => Linking.openURL('mailto:lycheetahsol@gmail.com?subject=BUG').catch(() => Alert.alert('No email client available.')) },
              { label: 'Open GitHub Releases', glyph: '⊚', action: () => Linking.openURL('https://github.com/Lycheetah/Lycheetah-Mobile-/releases').catch(() => Alert.alert('Cannot open URL.')) },
            ].map(btn => (
              <TouchableOpacity key={btn.label} onPress={btn.action}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FF664433', backgroundColor: '#FF66440A' }}
                activeOpacity={0.7}>
                <Text style={{ color: '#FF8844', fontSize: 14 }}>{btn.glyph}</Text>
                <Text style={{ color: '#FF8844CC', fontSize: 12, fontWeight: '600' }}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* ── THE LYCHEETAH COMMITMENT ───────────────────────────────────────── */}
      <View style={{ marginBottom: 24, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}>
        <TouchableOpacity onPress={() => setCommitmentOpen(o => !o)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} activeOpacity={0.7}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: accentColor, fontSize: 14 }}>⊚</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>THE LYCHEETAH COMMITMENT</Text>
          </View>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>{commitmentOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {commitmentOpen && (
          <View style={{ marginTop: 16, gap: 12 }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 21, fontWeight: '700' }}>
              Sol is a thinking tool, not an authority.
            </Text>

            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20 }}>
              Everything here — the Mystery School, the readings, the frameworks — is offered as a doorway for your own inquiry. It is drawn from real human traditions and real research. It will be imperfect, it will evolve, and it is not a substitute for primary sources, teachers, peer-reviewed science, or your own direct experience.
            </Text>

            <View style={{ paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: accentColor + '66' }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 12, lineHeight: 20, fontWeight: '700' }}>Do your own research.</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20 }}>
                What resonates — cross-reference it. What doesn't — set it down. The School does not ask for belief. It asks for curiosity.
              </Text>
            </View>

            <View style={{ paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#E07040AA' }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 12, lineHeight: 20, fontWeight: '700' }}>On safety.</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20 }}>
                Some of what you find here may unsettle your existing picture of the world. That is sometimes the point. But if something here disturbs your stability rather than expanding it — stop. Rest. Talk to someone you trust.{'\n\n'}Sol is not a therapist, a doctor, a spiritual authority, or a legal advisor. It is an intelligence designed to help you think more clearly about hard things. That is its only authority.
              </Text>
            </View>

            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 20 }}>
              Lycheetah takes this work seriously. The commitment is to truth over comfort. If you use this tool, that is your commitment too.
            </Text>

            <Text style={{ color: accentColor + 'AA', fontSize: 11, fontStyle: 'italic', marginTop: 4 }}>
              — Mac Clark, aka Lycheetah · Dunedin, Aotearoa NZ
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Lycheetah Framework — Open Source</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://github.com/Lycheetah/Lycheetah-Mobile-')}>
          <Text style={styles.footerLink}>github.com/Lycheetah/Lycheetah-Mobile-</Text>
        </TouchableOpacity>
        <Text style={styles.footerSub}>Built by Mackenzie Clark · Dunedin, Aotearoa NZ</Text>
        <Text style={styles.footerVersion}>v5.29.0</Text>
      </View>

      {/* ── RESTORE FROM BACKUP ── */}
      <Modal visible={restoreOpen} transparent animationType="fade" onRequestClose={() => setRestoreOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000000F2', justifyContent: 'center', padding: 22 }}>
          <View style={{ backgroundColor: '#0B0B12', borderRadius: 18, borderWidth: 1.5, borderColor: accentColor + '55', padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ color: accentColor, fontSize: 13, fontWeight: '800', letterSpacing: 1 }}>↓ RESTORE FROM BACKUP</Text>
              <TouchableOpacity onPress={() => setRestoreOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ color: accentColor + 'AA', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
              Paste a Sovereign Sol backup below. This overwrites your current data, then reloads. Export your current data first if you want to keep it.
            </Text>
            <TextInput
              value={restoreText}
              onChangeText={setRestoreText}
              placeholder='Paste backup JSON here…'
              placeholderTextColor={SOL_THEME.textMuted}
              multiline
              style={{ minHeight: 110, maxHeight: 200, borderWidth: 1, borderColor: accentColor + '33', borderRadius: 10, padding: 12, color: SOL_THEME.text, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', backgroundColor: '#05050A', textAlignVertical: 'top', marginBottom: 14 }}
            />
            <TouchableOpacity
              style={{ backgroundColor: accentColor, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: restoreText.trim() ? 1 : 0.4 }}
              disabled={!restoreText.trim()}
              onPress={() => {
                let parsed: any;
                try { parsed = JSON.parse(restoreText.trim()); }
                catch { Alert.alert('Invalid backup', 'That is not valid JSON. Paste the full backup exactly as exported.'); return; }
                if (!parsed?._sovereign_sol_backup || !parsed?.data) {
                  Alert.alert('Not a Sovereign Sol backup', 'This file is missing the backup marker. Paste a backup made by Export Everything.');
                  return;
                }
                const entries = Object.entries(parsed.data).filter(([, v]) => typeof v === 'string') as [string, string][];
                Alert.alert(
                  'Restore everything?',
                  `This will overwrite your current data with ${entries.length} keys from a backup exported ${parsed.exported ? new Date(parsed.exported).toLocaleDateString() : 'previously'}, then reload. This cannot be undone.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Restore', style: 'destructive', onPress: async () => {
                      try {
                        await AsyncStorage.multiSet(entries);
                        setRestoreOpen(false);
                        Alert.alert('Restored ✓', 'Your data is back. Please fully close and reopen the app to load it.');
                      } catch {
                        Alert.alert('Restore failed', 'Could not write the data. Try again.');
                      }
                    } },
                  ],
                );
              }}
            >
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 }}>Restore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
