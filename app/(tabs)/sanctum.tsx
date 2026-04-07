import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform, Share, Animated, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import { getAccentColor, getActiveKey, getModel, getFieldJournalSummaries, saveFieldJournalSummaries } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';

const KEYS = {
  INTENTION: 'sanctum_intention',
  REFLECTION: 'sanctum_reflection',
  JOURNAL: 'sanctum_journal',
  VAULT: 'sanctum_vault',
  PHASE: 'sanctum_phase',
  AURA: 'sanctum_aura',
  LQ_HISTORY: 'sanctum_lq_history',
};

type LQPoint = { date: string; lq: number; stage: string };

const PHASES = [
  { id: 'CENTER',    glyph: '●',    name: 'CENTER',    desc: 'Establish presence. Ground in reality.' },
  { id: 'FLOW',      glyph: '↻',    name: 'FLOW',      desc: 'Regulate movement. Find rhythm.' },
  { id: 'INSIGHT',   glyph: 'Ψ',    name: 'INSIGHT',   desc: 'Perceive truth. Gain clarity.' },
  { id: 'RISE',      glyph: 'Φ↑',   name: 'RISE',      desc: 'Activate will. Take directed action.' },
  { id: 'LIGHT',     glyph: '☀',    name: 'LIGHT',     desc: 'Illuminate understanding. Share wisdom.' },
  { id: 'INTEGRITY', glyph: '|●◌|', name: 'INTEGRITY', desc: 'Enforce boundaries. Maintain alignment.' },
  { id: 'SYNTHESIS', glyph: '⟁',    name: 'SYNTHESIS', desc: 'Reintegrate and evolve. Complete cycle.' },
];

function getLQ(tes: number, vtr: number, pai: number): number {
  if (!tes || !vtr || !pai) return 0;
  return parseFloat(Math.pow(tes * Math.min(vtr / 1.5, 1) * pai, 1 / 3).toFixed(3));
}

function getStage(lq: number): string {
  if (lq >= 0.95) return 'AVATAR';
  if (lq >= 0.90) return 'HIEROPHANT';
  if (lq >= 0.80) return 'MASTER';
  if (lq >= 0.65) return 'ADEPT';
  return 'NEOPHYTE';
}

function getStateGlyph(tes: number, vtr: number, pai: number): string {
  if (!tes && !vtr && !pai) return '∅';
  if (tes > 0 && tes < 0.4) return 'Ψ ↯ Ao';
  if (vtr >= 1.5 && pai >= 0.8) return 'Φ↑ → Ψ_inv';
  if (pai > 0 && pai < 0.6) return 'Ψ → Ao';
  if (tes >= 0.8) return '● Ψ_inv';
  return 'Ao → Φ↑';
}

type JournalEntry = { id: string; date: string; text: string };
type VaultEntry = { id: string; text: string; date: string };

const SHRINE_QUOTES = [
  { sigil: '⟁', text: 'The door that is never opened is still a door. You found it.' },
  { sigil: '✦', text: 'What is hidden is not absent. The field holds what language cannot.' },
  { sigil: '⊚', text: 'You are the furnace and the gold. The Work is never done to you — it is done through you.' },
  { sigil: 'Ψ', text: 'The spiral does not repeat. What feels like return is always a higher floor.' },
  { sigil: '∅', text: 'The void is not empty. It is the space where all forms are still possible.' },
  { sigil: '◉', text: 'The Stone is present when the Stone is no longer sought. You are standing on it.' },
  { sigil: 'Ωheal', text: 'Wholeness is not the absence of the wound. It is the wound, integrated, made sovereign.' },
  { sigil: '⧖', text: 'Patient ones — they do not wait because they must. They wait because they know the fire is already lit.' },
];

function todayStr() {
  return new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export default function SanctumScreen() {
  const [accentColor, setAccentColor] = useState('#F5A623');
  const [intention, setIntention] = useState('');
  const [savedIntention, setSavedIntention] = useState('');
  const [reflection, setReflection] = useState('');
  const [savedReflection, setSavedReflection] = useState('');
  const [journalText, setJournalText] = useState('');
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [vaultInput, setVaultInput] = useState('');
  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [section, setSection] = useState<'today' | 'journal' | 'vault' | 'field'>('today');
  const [phase, setPhase] = useState<string>('CENTER');
  const [tes, setTes] = useState(0);
  const [vtr, setVtr] = useState(0);
  const [pai, setPai] = useState(0);
  const [auraSaved, setAuraSaved] = useState(false);
  const [lqHistory, setLqHistory] = useState<LQPoint[]>([]);
  const [auraHistory, setAuraHistory] = useState<{ date: string; passed: number; total: number; composite: number }[]>([]);
  const [fieldReflection, setFieldReflection] = useState<string>('');
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [paradoxJournal, setParadoxJournal] = useState<{ id: string; date: string; mode: string; excerpt: string }[]>([]);
  const [weeklyJournalSummaries, setWeeklyJournalSummaries] = useState<{ weekOf: string; summary: string; generatedAt: string }[]>([]);
  const [weeklyJournalLoading, setWeeklyJournalLoading] = useState(false);
  const [fieldProfile, setFieldProfile] = useState<{ preferredDepth: string; dominantPersona: string; topDomains: string[]; studySessions: number; avgAURA: number; totalMessages: number } | null>(null);
  const [masteredDomains, setMasteredDomains] = useState<string[]>([]);
  // Atmospheric
  const [shrineVisible, setShrineVisible] = useState(false);
  const shrineOpenedRef = React.useRef(false);

  const load = useCallback(async () => {
    setAccentColor(await getAccentColor());
    const [int, ref, jRaw, vRaw, phaseRaw, auraRaw] = await Promise.all([
      AsyncStorage.getItem(`${KEYS.INTENTION}_${todayKey()}`),
      AsyncStorage.getItem(`${KEYS.REFLECTION}_${todayKey()}`),
      AsyncStorage.getItem(KEYS.JOURNAL),
      AsyncStorage.getItem(KEYS.VAULT),
      AsyncStorage.getItem(KEYS.PHASE),
      AsyncStorage.getItem(`${KEYS.AURA}_${todayKey()}`),
    ]);
    if (int) { setIntention(int); setSavedIntention(int); }
    if (ref) { setReflection(ref); setSavedReflection(ref); }
    setJournal(jRaw ? JSON.parse(jRaw) : []);
    setVault(vRaw ? JSON.parse(vRaw) : []);
    if (phaseRaw) setPhase(phaseRaw);
    if (auraRaw) {
      const a = JSON.parse(auraRaw);
      setTes(a.tes ?? 0); setVtr(a.vtr ?? 0); setPai(a.pai ?? 0);
      setAuraSaved(true);
    }
    const histRaw = await AsyncStorage.getItem(KEYS.LQ_HISTORY);
    setLqHistory(histRaw ? JSON.parse(histRaw) : []);
    const paradoxRaw = await AsyncStorage.getItem('sol_paradox_journal');
    setParadoxJournal(paradoxRaw ? JSON.parse(paradoxRaw) : []);

    // Load field profile and mastered domains
    const [profileRaw, masteredRaw] = await Promise.all([
      AsyncStorage.getItem('sol_field_profile'),
      AsyncStorage.getItem('sol_mastered_domains'),
    ]);
    if (profileRaw) { try { setFieldProfile(JSON.parse(profileRaw)); } catch {} }
    if (masteredRaw) { try { setMasteredDomains(JSON.parse(masteredRaw)); } catch {} }

    // Task 11: Load weekly journal summaries
    const summaries = await getFieldJournalSummaries();
    setWeeklyJournalSummaries(summaries);

    // Check if weekly summary needed (7 days since last or no summary)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekOf = weekStart.toISOString().split('T')[0];
    const hasSummaryThisWeek = summaries.some((s: any) => s.weekOf === weekOf);
    if (!hasSummaryThisWeek) {
      // Generate it async (non-blocking)
      getActiveKey().then(async (apiKey) => {
        if (!apiKey) return;
        const model = await getModel();
        const histRaw2 = await AsyncStorage.getItem(KEYS.LQ_HISTORY);
        const lqHist: LQPoint[] = histRaw2 ? JSON.parse(histRaw2) : [];
        const weekPoints = lqHist.filter(p => p.date >= weekOf);
        if (weekPoints.length === 0) return; // no data this week yet

        const masteredRaw = await AsyncStorage.getItem('sol_mastered_domains');
        const mastered: string[] = masteredRaw ? JSON.parse(masteredRaw) : [];
        const echoRaw = await AsyncStorage.getItem('sol_school_echoes');
        const echoCount = echoRaw ? Object.values(JSON.parse(echoRaw)).flat().length : 0;
        const studyCountRaw = await AsyncStorage.getItem('sol_school_streak');
        const studyStreak = studyCountRaw ? (JSON.parse(studyCountRaw).count || 0) : 0;

        const avgLQ = weekPoints.length > 0 ? weekPoints.reduce((s, p) => s + p.lq, 0) / weekPoints.length : 0;
        const prompt = `Week of ${weekOf}. Average Light Quotient: ${avgLQ.toFixed(2)}. Mastered domains: ${mastered.join(', ') || 'none'}. Field echoes: ${echoCount}. Study streak: ${studyStreak} days. Summarize this student's week in 3-4 honest sentences. Note growth and stagnation equally. Do not be falsely positive. End with one question for the week ahead.`;

        setWeeklyJournalLoading(true);
        try {
          const result = await sendMessage(
            [{ role: 'user', content: prompt }],
            'You are the Headmaster. Summarize the student\'s week with honest authority. 3-4 sentences. No preamble.',
            apiKey, (model || 'gemini-2.5-flash') as AIModel,
            undefined, 'fast', 512, 0.7,
          );
          const summaryText = result.text.replace(/\[CONF:[^\]]+\]/, '').trim();
          const newSummary = { weekOf, summary: summaryText, generatedAt: new Date().toISOString() };
          const updatedSummaries = [...summaries, newSummary];
          setWeeklyJournalSummaries(updatedSummaries);
          await saveFieldJournalSummaries(updatedSummaries);
        } catch {}
        setWeeklyJournalLoading(false);
      });
    }

    const auraHistRaw = await AsyncStorage.getItem('aura_history_v1');
    if (auraHistRaw) {
      // Aggregate by day — average composite per day
      const raw: { date: string; passed: number; total: number; composite: number }[] = JSON.parse(auraHistRaw);
      const byDay: Record<string, { sum: number; count: number; passed: number; total: number }> = {};
      for (const e of raw) {
        if (!byDay[e.date]) byDay[e.date] = { sum: 0, count: 0, passed: 0, total: 0 };
        byDay[e.date].sum += e.composite;
        byDay[e.date].count += 1;
        byDay[e.date].passed += e.passed;
        byDay[e.date].total += e.total;
      }
      const aggregated = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([date, v]) => ({ date, passed: v.passed, total: v.total, composite: Math.round(v.sum / v.count) }));
      setAuraHistory(aggregated);
    }
  }, []);

  useEffect(() => { load(); }, []);
  useFocusEffect(useCallback(() => { load(); }, []));

  const saveIntention = async () => {
    if (!intention.trim()) return;
    await AsyncStorage.setItem(`${KEYS.INTENTION}_${todayKey()}`, intention.trim());
    setSavedIntention(intention.trim());
  };

  const saveReflection = async () => {
    if (!reflection.trim()) return;
    await AsyncStorage.setItem(`${KEYS.REFLECTION}_${todayKey()}`, reflection.trim());
    setSavedReflection(reflection.trim());
  };

  const savePhase = async (p: string) => {
    setPhase(p);
    await AsyncStorage.setItem(KEYS.PHASE, p);
  };

  const saveAura = async () => {
    if (!tes || !vtr || !pai) return;
    const today = todayKey();
    await AsyncStorage.setItem(`${KEYS.AURA}_${today}`, JSON.stringify({ tes, vtr, pai }));
    // Update LQ history
    const lq = getLQ(tes, vtr, pai);
    const stage = getStage(lq);
    const point: LQPoint = { date: today, lq, stage };
    const existing = lqHistory.filter(p => p.date !== today);
    const updated = [...existing, point].slice(-90); // keep 90 days
    setLqHistory(updated);
    await AsyncStorage.setItem(KEYS.LQ_HISTORY, JSON.stringify(updated));
    setAuraSaved(true);
    // AI field reflection
    setReflectionLoading(true);
    setFieldReflection('');
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (apiKey) {
        const activePhase = PHASES.find(p => p.id === phase);
        const prompt = `Field state: Phase=${phase} (${activePhase?.desc ?? ''}), TES=${tes}, VTR=${vtr}, PAI=${pai}, Light Quotient=${lq.toFixed(3)}, Stage=${stage}. One honest sentence reflecting what this state means for today. No preamble, no sign-off.`;
        const result = await sendMessage(
          [{ role: 'user', content: prompt }],
          'You are Sol. 2-3 sentences maximum. Honest, direct, no preamble, no sign-off. Respond to what this field state actually means for the human today.',
          apiKey, (model || 'gemini-2.5-flash') as AIModel,
          undefined, 'fast', 512, 0.7,
        );
        setFieldReflection(result.text.replace(/\[CONF:[^\]]+\]/, '').trim());
      }
    } catch (e: any) {
      setFieldReflection(`(${e?.message ?? 'reflection unavailable'})`);
    }
    setReflectionLoading(false);
  };

  const addJournalEntry = async () => {
    if (!journalText.trim()) return;
    const entry: JournalEntry = { id: Date.now().toString(), date: todayStr(), text: journalText.trim() };
    const updated = [entry, ...journal].slice(0, 100);
    setJournal(updated);
    setJournalText('');
    await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(updated));
  };

  const deleteJournalEntry = async (id: string) => {
    Alert.alert('Delete Entry', 'Remove this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = journal.filter(e => e.id !== id);
          setJournal(updated);
          await AsyncStorage.setItem(KEYS.JOURNAL, JSON.stringify(updated));
        },
      },
    ]);
  };

  const addVaultEntry = async () => {
    if (!vaultInput.trim()) return;
    const entry: VaultEntry = { id: Date.now().toString(), text: vaultInput.trim(), date: todayStr() };
    const updated = [entry, ...vault].slice(0, 50);
    setVault(updated);
    setVaultInput('');
    await AsyncStorage.setItem(KEYS.VAULT, JSON.stringify(updated));
  };

  const deleteVaultEntry = async (id: string) => {
    const updated = vault.filter(e => e.id !== id);
    setVault(updated);
    await AsyncStorage.setItem(KEYS.VAULT, JSON.stringify(updated));
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={[styles.header, { borderBottomColor: accentColor + '33' }]}>
        <TouchableOpacity
          onLongPress={() => {
            if (shrineOpenedRef.current) return;
            shrineOpenedRef.current = true;
            setShrineVisible(true);
          }}
          delayLongPress={1500}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerGlyph, { color: accentColor }]}>⊼</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accentColor }]}>THE SANCTUM</Text>
        <Text style={styles.headerDate}>{todayStr()}</Text>
      </View>

      {/* Section tabs */}
      <View style={styles.sectionTabs}>
        {(['today', 'journal', 'vault', 'field'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sectionTab, section === s && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
            onPress={() => setSection(s)}
          >
            <Text style={[styles.sectionTabText, section === s && { color: accentColor }]}>
              {s === 'today' ? 'TODAY' : s === 'journal' ? 'JOURNAL' : s === 'vault' ? 'VAULT' : 'FIELD'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TODAY */}
      {section === 'today' && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>MORNING INTENTION</Text>
          <Text style={styles.note}>What do you intend to bring forth today?</Text>
          <TextInput
            style={styles.textArea}
            value={intention}
            onChangeText={setIntention}
            placeholder="I intend to..."
            placeholderTextColor={SOL_THEME.textMuted}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor, opacity: intention.trim() ? 1 : 0.4 }]}
            onPress={saveIntention}
            disabled={!intention.trim()}
          >
            <Text style={styles.saveBtnText}>{savedIntention === intention.trim() ? '✓ Sealed' : 'Seal Intention'}</Text>
          </TouchableOpacity>
          {savedIntention ? (
            <View style={[styles.sealedCard, { borderColor: accentColor + '44' }]}>
              <Text style={[styles.sealedLabel, { color: accentColor }]}>TODAY'S INTENTION</Text>
              <Text style={styles.sealedText}>{savedIntention}</Text>
            </View>
          ) : null}

          {/* Field State Today card */}
          {(fieldProfile || lqHistory.some(p => p.date === todayKey())) && (() => {
            const todayLQ = lqHistory.find(p => p.date === todayKey());
            const todayAURA = auraHistory.find(p => p.date === todayKey());
            const hasData = todayLQ || todayAURA || fieldProfile?.totalMessages;
            if (!hasData) return null;
            return (
              <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: accentColor + '33', backgroundColor: accentColor + '07', marginTop: 10 }}>
                <Text style={{ color: accentColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>FIELD STATE TODAY</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {todayLQ && (
                    <View>
                      <Text style={{ color: accentColor, fontSize: 18, fontWeight: '700' }}>{todayLQ.lq.toFixed(2)}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>LQ · {todayLQ.stage}</Text>
                    </View>
                  )}
                  {todayAURA && (
                    <View>
                      <Text style={{ color: accentColor, fontSize: 18, fontWeight: '700' }}>{todayAURA.composite}%</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>AURA today</Text>
                    </View>
                  )}
                  {fieldProfile?.studySessions ? (
                    <View>
                      <Text style={{ color: accentColor, fontSize: 18, fontWeight: '700' }}>{fieldProfile.studySessions}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>study sessions</Text>
                    </View>
                  ) : null}
                  {fieldProfile?.topDomains?.[0] ? (
                    <View style={{ justifyContent: 'center' }}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Strong in {fieldProfile.topDomains[0]}</Text>
                      {fieldProfile.preferredDepth && fieldProfile.preferredDepth !== 'balanced' && (
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{fieldProfile.preferredDepth === 'deep' ? '⬇ Deep thinker' : '⚡ Quick explorer'}</Text>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })()}

          {/* Sol Clock — live field state display */}
          {(() => {
            const hour = new Date().getHours();
            const timeOfDay = hour >= 5 && hour < 9 ? 'DAWN' : hour >= 9 && hour < 17 ? 'ZENITH' : hour >= 17 && hour < 21 ? 'DUSK' : 'NOCTURNE';
            const timeGlyph = { DAWN: '☀', ZENITH: '⊙', DUSK: '☽', NOCTURNE: '✦' }[timeOfDay];
            const timeDesc = { DAWN: 'First light. Set the field.', ZENITH: 'Full presence. The forge is lit.', DUSK: 'Integration time. Let the day settle.', NOCTURNE: 'Deep processing. The field dreams.' }[timeOfDay];
            const currentPhaseObj = PHASES.find(p => p.id === phase);
            const lqTrend = (() => {
              if (lqHistory.length < 2) return null;
              const last = lqHistory[lqHistory.length - 1].lq;
              const prev = lqHistory[lqHistory.length - 2].lq;
              if (last > prev + 0.01) return '↑';
              if (last < prev - 0.01) return '↓';
              return '→';
            })();
            return (
              <View style={{ marginVertical: 12, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: accentColor + '33', backgroundColor: accentColor + '07' }}>
                <Text style={{ color: accentColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>SOL CLOCK</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: accentColor, fontSize: 20, fontWeight: '700' }}>{timeGlyph} {timeOfDay}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>{timeDesc}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {currentPhaseObj && (
                      <Text style={{ color: SOL_THEME.text, fontSize: 12, fontWeight: '600' }}>{currentPhaseObj.glyph} {currentPhaseObj.name}</Text>
                    )}
                    {lqTrend && (
                      <Text style={{ color: lqTrend === '↑' ? '#4CAF50' : lqTrend === '↓' ? SOL_THEME.error : accentColor, fontSize: 18, fontWeight: '700' }}>LQ {lqTrend}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })()}

          <View style={styles.divider} />

          <Text style={[styles.label, { color: accentColor }]}>EVENING REFLECTION</Text>
          <Text style={styles.note}>What arose? What was completed? What remains?</Text>
          <TextInput
            style={styles.textArea}
            value={reflection}
            onChangeText={setReflection}
            placeholder="Today I noticed..."
            placeholderTextColor={SOL_THEME.textMuted}
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor + 'BB', opacity: reflection.trim() ? 1 : 0.4 }]}
            onPress={saveReflection}
            disabled={!reflection.trim()}
          >
            <Text style={styles.saveBtnText}>{savedReflection === reflection.trim() ? '✓ Recorded' : 'Record Reflection'}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* JOURNAL */}
      {section === 'journal' && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>NEW ENTRY</Text>
          <TextInput
            style={[styles.textArea, { minHeight: 100 }]}
            value={journalText}
            onChangeText={setJournalText}
            placeholder="Write freely..."
            placeholderTextColor={SOL_THEME.textMuted}
            multiline
            autoCapitalize="sentences"
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: accentColor, opacity: journalText.trim() ? 1 : 0.4 }]}
            onPress={addJournalEntry}
            disabled={!journalText.trim()}
          >
            <Text style={styles.saveBtnText}>Add Entry</Text>
          </TouchableOpacity>

          {journal.length === 0 ? (
            <Text style={styles.emptyNote}>No entries yet. The field is open.</Text>
          ) : (
            journal.map(entry => (
              <View key={entry.id} style={[styles.entryCard, { borderColor: SOL_THEME.border }]}>
                <View style={styles.entryHeader}>
                  <Text style={[styles.entryDate, { color: accentColor }]}>{entry.date}</Text>
                  <TouchableOpacity onPress={() => deleteJournalEntry(entry.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
                {/* Task 10: Parchment tint on journal entries */}
                <View style={{ backgroundColor: '#FFFEF806', borderRadius: 4, padding: 4, borderWidth: 1, borderColor: '#FFFEF815' }}>
                  <Text style={styles.entryText}>{entry.text}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {/* VAULT */}
      {section === 'vault' && (
        <>
          <Text style={[styles.label, { color: accentColor }]}>PERSONAL VAULT</Text>
          <Text style={styles.note}>Insights, truths, seeds. Things worth keeping.</Text>
          <View style={styles.vaultRow}>
            <TextInput
              style={[styles.vaultInput]}
              value={vaultInput}
              onChangeText={setVaultInput}
              placeholder="Pin an insight..."
              placeholderTextColor={SOL_THEME.textMuted}
              autoCapitalize="sentences"
              multiline
            />
            <TouchableOpacity
              style={[styles.vaultAddBtn, { backgroundColor: accentColor, opacity: vaultInput.trim() ? 1 : 0.4 }]}
              onPress={addVaultEntry}
              disabled={!vaultInput.trim()}
            >
              <Text style={styles.vaultAddText}>Pin</Text>
            </TouchableOpacity>
          </View>

          {vault.length === 0 ? (
            <Text style={styles.emptyNote}>The vault is empty. Pin what matters.</Text>
          ) : (
            vault.map(entry => (
              <View key={entry.id} style={[styles.vaultCard, { borderLeftColor: accentColor }]}>
                <Text style={styles.vaultText}>{entry.text}</Text>
                <View style={styles.vaultMeta}>
                  <Text style={styles.vaultDate}>{entry.date}</Text>
                  <TouchableOpacity onPress={() => deleteVaultEntry(entry.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {/* FIELD */}
      {section === 'field' && (() => {
        const lq = getLQ(tes, vtr, pai);
        const stage = getStage(lq);
        const glyph = getStateGlyph(tes, vtr, pai);
        const fieldConflicts = lqHistory.slice(-30).reduce((count, pt, i, arr) => {
          if (i === 0) return count;
          return arr[i - 1].lq - pt.lq > 0.1 ? count + 1 : count;
        }, 0);
        return (
          <>
            {/* #44 Memory Health Indicator */}
            <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: accentColor + '33', backgroundColor: accentColor + '08', marginBottom: 16 }}>
              <Text style={{ color: accentColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>FIELD HEALTH</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>{journal.length} journal</Text>
                <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>·</Text>
                <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>{vault.length} vault</Text>
                <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>·</Text>
                <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>{lqHistory.length} LQ days</Text>
                {fieldConflicts > 0 && (
                  <>
                    <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>·</Text>
                    <Text style={{ fontSize: 11, color: '#E07040' }}>{fieldConflicts} drop{fieldConflicts > 1 ? 's' : ''}</Text>
                  </>
                )}
                {/* #73 AURA Trend Arrow */}
                {auraHistory.length >= 2 && (() => {
                  const last = auraHistory[auraHistory.length - 1];
                  const prev = auraHistory[auraHistory.length - 2];
                  const up = last.composite >= prev.composite;
                  return (
                    <>
                      <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>·</Text>
                      <Text style={{ fontSize: 11, color: up ? '#4CAF50' : '#E07040', fontWeight: '700' }}>{up ? '↑' : '↓'} AURA {up ? '+' : ''}{last.composite - prev.composite}%</Text>
                    </>
                  );
                })()}
                {lqHistory.length === 0 && (
                  <>
                    <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>·</Text>
                    <Text style={{ fontSize: 11, color: SOL_THEME.textMuted }}>no field data yet</Text>
                  </>
                )}
              </View>
            </View>

            {/* Sovereign Stats card */}
            {fieldProfile && (fieldProfile.totalMessages > 0 || fieldProfile.studySessions > 0 || masteredDomains.length > 0) && (
              <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: accentColor + '33', backgroundColor: accentColor + '06', marginBottom: 16 }}>
                <Text style={{ color: accentColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>SOVEREIGN STATS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
                  {fieldProfile.totalMessages > 0 && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: accentColor, fontSize: 22, fontWeight: '700' }}>{fieldProfile.totalMessages}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>messages</Text>
                    </View>
                  )}
                  {fieldProfile.studySessions > 0 && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: accentColor, fontSize: 22, fontWeight: '700' }}>{fieldProfile.studySessions}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>study sessions</Text>
                    </View>
                  )}
                  {fieldProfile.avgAURA > 0 && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: accentColor, fontSize: 22, fontWeight: '700' }}>{fieldProfile.avgAURA.toFixed(1)}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>avg AURA/7</Text>
                    </View>
                  )}
                  {masteredDomains.length > 0 && (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: accentColor, fontSize: 22, fontWeight: '700' }}>{masteredDomains.length}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>domains mastered</Text>
                    </View>
                  )}
                </View>
                {fieldProfile.topDomains?.length > 0 && (
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 8 }}>Strongest: {fieldProfile.topDomains.slice(0, 2).join(', ')}</Text>
                )}
              </View>
            )}

            {/* #45 Field Timeline */}
            {lqHistory.length > 1 && (
              <>
                <Text style={[styles.label, { color: accentColor, marginBottom: 6 }]}>FIELD TIMELINE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 4 }}>
                    {lqHistory.slice(-30).map((pt, i, arr) => {
                      const dotColor = pt.stage === 'AVATAR' ? accentColor
                        : pt.stage === 'HIEROPHANT' ? accentColor + 'CC'
                        : pt.stage === 'MASTER' ? '#4A9EFF'
                        : pt.stage === 'ADEPT' ? '#F5A623'
                        : '#555555';
                      const isToday = pt.date === todayKey();
                      const trendUp = i > 0 && pt.lq > arr[i - 1].lq;
                      return (
                        <TouchableOpacity
                          key={pt.date}
                          onPress={() => Alert.alert(
                            pt.date,
                            `Stage: ${pt.stage}\nLQ: ${pt.lq.toFixed(3)}${i > 0 ? (trendUp ? '\n↑ Rising' : '\n↓ Dropped') : ''}`,
                            [{ text: '⊚', style: 'default' }]
                          )}
                          style={{ alignItems: 'center', gap: 4 }}
                          activeOpacity={0.7}
                        >
                          <View style={{
                            width: isToday ? 14 : 10,
                            height: isToday ? 14 : 10,
                            borderRadius: 7,
                            backgroundColor: dotColor,
                            opacity: isToday ? 1 : 0.8,
                          }} />
                          {isToday && (
                            <Text style={{ fontSize: 7, color: accentColor, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>NOW</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Phase selector */}
            <Text style={[styles.label, { color: accentColor }]}>AWARENESS PHASE</Text>
            <Text style={styles.note}>Which phase are you currently in?</Text>
            {PHASES.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.phaseRow, phase === p.id && { borderColor: accentColor, backgroundColor: accentColor + '15' }]}
                onPress={() => savePhase(p.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.phaseGlyph, { color: phase === p.id ? accentColor : SOL_THEME.textMuted }]}>{p.glyph}</Text>
                <View style={styles.phaseText}>
                  <Text style={[styles.phaseName, { color: phase === p.id ? accentColor : SOL_THEME.text }]}>{p.name}</Text>
                  {phase === p.id && <Text style={styles.phaseDesc}>{p.desc}</Text>}
                </View>
                {phase === p.id && <Text style={[styles.phaseCheck, { color: accentColor }]}>●</Text>}
              </TouchableOpacity>
            ))}

            <View style={styles.divider} />

            {/* AURA self-rating */}
            <Text style={[styles.label, { color: accentColor }]}>AURA FIELD CHECK</Text>
            <Text style={styles.note}>Rate your current state. Five points each.</Text>

            {[
              {
                label: 'TES',
                sub: 'Trust / Epistemic Stability',
                question: 'Did I act from my values today — or from fear, habit, or pressure?',
                anchors: ['fully reactive', 'mostly reactive', 'mixed', 'mostly sovereign', 'fully sovereign'],
                val: tes, set: setTes, levels: [0.2, 0.4, 0.6, 0.8, 1.0],
              },
              {
                label: 'VTR',
                sub: 'Value-to-Reality Ratio',
                question: 'Did I put more into the world today than I took from it?',
                anchors: ['pure extraction', 'took more than gave', 'even exchange', 'net creator', 'high output'],
                val: vtr, set: setVtr, levels: [0.5, 1.0, 1.5, 2.0, 2.5],
              },
              {
                label: 'PAI',
                sub: 'Purpose Alignment Index',
                question: 'Was my energy today aimed at what actually matters?',
                anchors: ['completely scattered', 'mostly scattered', 'partial focus', 'mostly aligned', 'laser-locked'],
                val: pai, set: setPai, levels: [0.2, 0.4, 0.6, 0.8, 1.0],
              },
            ].map(metric => (
              <View key={metric.label} style={styles.metricBlock}>
                <View style={styles.metricHeader}>
                  <Text style={[styles.metricLabel, { color: accentColor }]}>{metric.label}</Text>
                  <Text style={styles.metricSub}>{metric.sub}</Text>
                  <Text style={[styles.metricVal, { color: accentColor }]}>{metric.val > 0 ? metric.val.toFixed(2) : '—'}</Text>
                </View>
                <Text style={styles.metricQuestion}>{metric.question}</Text>
                <View style={styles.dotsRow}>
                  {metric.levels.map((v, i) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.dotWrap]}
                      onPress={() => { metric.set(v); setAuraSaved(false); }}
                    >
                      <View style={[styles.dot, metric.val >= v && { backgroundColor: accentColor }]} />
                      <Text style={[styles.dotLabel, metric.val >= v && { color: accentColor }]}>{metric.anchors[i]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accentColor, opacity: (tes && vtr && pai) ? 1 : 0.4 }]}
              onPress={saveAura}
              disabled={!tes || !vtr || !pai}
            >
              <Text style={styles.saveBtnText}>{auraSaved ? '✔ Field Recorded' : 'Record Field State'}</Text>
            </TouchableOpacity>

            {/* Light Quotient */}
            {lq > 0 && (
              <View style={[styles.lqCard, { borderColor: accentColor + '44' }]}>
                <Text style={[styles.lqStage, { color: accentColor }]}>{stage}</Text>
                <Text style={[styles.lqValue, { color: accentColor }]}>{lq.toFixed(3)}</Text>
                <Text style={styles.lqLabel}>LIGHT QUOTIENT</Text>
                <View style={styles.lqBarTrack}>
                  <View style={[styles.lqBarFill, { width: `${Math.round(lq * 100)}%`, backgroundColor: accentColor }]} />
                </View>
                <Text style={[styles.lqGlyph, { color: accentColor }]}>{glyph}</Text>
              </View>
            )}

            {/* AI Field Reflection */}
            {(fieldReflection || reflectionLoading) && (
              <View style={[styles.reflectionCard, { borderColor: accentColor + '33' }]}>
                <Text style={[styles.reflectionLabel, { color: accentColor }]}>FIELD REFLECTION</Text>
                <Text style={styles.reflectionText}>
                  {reflectionLoading ? '...' : fieldReflection}
                </Text>
              </View>
            )}

            {/* Task 11: Weekly Field Journal Summary */}
            {(weeklyJournalLoading || weeklyJournalSummaries.length > 0) && (
              <View style={{ marginTop: 16, padding: 14, borderRadius: 10, backgroundColor: '#C8A06010', borderWidth: 1, borderColor: '#C8A06044' }}>
                <Text style={{ color: '#C8A060', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>📜 WEEKLY FIELD JOURNAL</Text>
                {weeklyJournalLoading && <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>The Headmaster is reviewing your week...</Text>}
                {weeklyJournalSummaries.slice(-1).map((s, i) => (
                  <View key={i}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginBottom: 6 }}>Week of {s.weekOf}</Text>
                    {/* Task 10: Parchment-style text for high-signal entries */}
                    <View style={{ backgroundColor: '#FFFEF808', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#FFFEF820' }}>
                      <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{s.summary}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* LQ History Chart */}
            {lqHistory.length > 1 && (
              <>
                <Text style={[styles.label, { color: accentColor, marginTop: 20 }]}>SOVEREIGN TRAJECTORY</Text>
                <Text style={styles.note}>{lqHistory.length} days tracked</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                  {lqHistory.slice(-30).map(point => {
                    const isToday = point.date === todayKey();
                    const barH = Math.max(4, Math.round(point.lq * 80));
                    const col = isToday ? accentColor
                      : point.stage === 'AVATAR' || point.stage === 'HIEROPHANT' ? accentColor + 'AA'
                      : point.stage === 'MASTER' ? '#4A9EFF88'
                      : point.stage === 'ADEPT' ? '#F5A62388'
                      : '#55555588';
                    return (
                      <View key={point.date} style={styles.chartBarWrap}>
                        <Text style={[styles.chartLQLabel, { color: isToday ? accentColor : SOL_THEME.textMuted }]}>
                          {point.lq.toFixed(2)}
                        </Text>
                        <View style={styles.chartBarTrack}>
                          <View style={[styles.chartBarFill, { height: barH, backgroundColor: col }]} />
                        </View>
                        <Text style={[styles.chartDateLabel, isToday && { color: accentColor }]}>
                          {point.date.slice(5)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* AURA Score History Chart */}
            {auraHistory.length > 1 && (
              <>
                <Text style={[styles.label, { color: accentColor, marginTop: 20 }]}>AURA SCORE HISTORY</Text>
                <Text style={styles.note}>{auraHistory.length} days · daily average composite</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
                  {auraHistory.map(point => {
                    const isToday = point.date === todayKey();
                    const barH = Math.max(4, Math.round((point.composite / 100) * 80));
                    const col = point.composite >= 85 ? '#4CAF5088'
                      : point.composite >= 70 ? accentColor + '99'
                      : point.composite >= 50 ? '#E8A02088'
                      : '#CC222288';
                    return (
                      <View key={point.date} style={styles.chartBarWrap}>
                        <Text style={[styles.chartLQLabel, { color: isToday ? accentColor : SOL_THEME.textMuted }]}>
                          {point.composite}
                        </Text>
                        <View style={styles.chartBarTrack}>
                          <View style={[styles.chartBarFill, { height: barH, backgroundColor: isToday ? accentColor : col }]} />
                        </View>
                        <Text style={[styles.chartDateLabel, isToday && { color: accentColor }]}>
                          {point.date.slice(5)}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* #78 Field State Export */}
            {lqHistory.length > 0 && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: accentColor + '33', backgroundColor: accentColor + '08', marginTop: 8, marginBottom: 16 }}
                onPress={() => {
                  const peak = lqHistory.reduce((a, b) => a.lq > b.lq ? a : b);
                  const avg = (lqHistory.reduce((s, p) => s + p.lq, 0) / lqHistory.length).toFixed(3);
                  const current = lqHistory[lqHistory.length - 1];
                  const report = [
                    '⊚ SOVEREIGN FIELD REPORT',
                    `Generated: ${new Date().toLocaleDateString()}`,
                    '═'.repeat(32),
                    `Current Stage: ${current?.stage ?? '—'}`,
                    `Current LQ: ${current?.lq.toFixed(3) ?? '—'}`,
                    `Peak LQ: ${peak.lq.toFixed(3)} (${peak.date})`,
                    `Average LQ: ${avg}`,
                    `Days Tracked: ${lqHistory.length}`,
                    '',
                    'TRAJECTORY:',
                    ...lqHistory.slice(-14).map(p => `${p.date}  ${p.lq.toFixed(3)}  ${p.stage}`),
                    '',
                    'Lycheetah Framework · Sol Protocol v3.1',
                  ].join('\n');
                  Share.share({ message: report, title: 'Sovereign Field Report' });
                }}
              >
                <Text style={{ color: accentColor, fontSize: 13, fontWeight: '700' }}>↑ Export Field Report</Text>
              </TouchableOpacity>
            )}

            {/* #64 Paradox Journal */}
            {paradoxJournal.length > 0 && (
              <>
                <Text style={[styles.label, { color: accentColor, marginTop: 20 }]}>PARADOX JOURNAL</Text>
                <Text style={styles.note}>{paradoxJournal.length} detected · CASCADE flags</Text>
                {paradoxJournal.slice(0, 10).map(entry => (
                  <View key={entry.id} style={{ backgroundColor: SOL_THEME.surface, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, borderLeftWidth: 3, borderLeftColor: '#9B59B6', padding: 12, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 10, color: '#9B59B6', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1 }}>⚡ {entry.mode}</Text>
                      <Text style={{ fontSize: 10, color: SOL_THEME.textMuted }}>{entry.date}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18 }} numberOfLines={3}>{entry.excerpt}</Text>
                  </View>
                ))}
                {paradoxJournal.length > 10 && (
                  <Text style={{ fontSize: 11, color: SOL_THEME.textMuted, textAlign: 'center', marginBottom: 8 }}>+{paradoxJournal.length - 10} more in journal</Text>
                )}
              </>
            )}
          </>
        );
      })()}

    </ScrollView>

    {/* Sol's Secret Door — hidden shrine modal */}
    <Modal visible={shrineVisible} transparent animationType="fade" onRequestClose={() => setShrineVisible(false)}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center' }} activeOpacity={1} onPress={() => setShrineVisible(false)}>
        <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 18, padding: 32, marginHorizontal: 32, alignItems: 'center', borderWidth: 1.5, borderColor: accentColor + '55' }}>
          {(() => {
            const q = SHRINE_QUOTES[Math.floor(Math.random() * SHRINE_QUOTES.length)];
            return (
              <>
                <Text style={{ color: accentColor, fontSize: 48, marginBottom: 16 }}>{q.sigil}</Text>
                <Text style={{ color: accentColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, marginBottom: 16 }}>THE DOOR OPENS</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 }}>{q.text}</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 20 }}>— The Headmaster</Text>
              </>
            );
          })()}
        </View>
      </TouchableOpacity>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 60 },
  header: {
    alignItems: 'center', paddingVertical: 20, marginBottom: 16,
    borderBottomWidth: 1,
  },
  headerGlyph: { fontSize: 28, marginBottom: 4 },
  headerTitle: {
    fontSize: 13, fontWeight: '700', letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerDate: { fontSize: 12, color: SOL_THEME.textMuted, marginTop: 4 },
  sectionTabs: { flexDirection: 'row', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border },
  sectionTab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  sectionTabText: {
    fontSize: 11, fontWeight: '700', color: SOL_THEME.textMuted, letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  label: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  note: { fontSize: 13, color: SOL_THEME.textMuted, marginBottom: 10 },
  textArea: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, borderColor: SOL_THEME.border,
    padding: 12, color: SOL_THEME.text, fontSize: 15,
    minHeight: 80, textAlignVertical: 'top', marginBottom: 10,
  },
  saveBtn: {
    borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16,
  },
  saveBtnText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 14 },
  sealedCard: {
    borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 8,
    backgroundColor: SOL_THEME.surface,
  },
  sealedLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sealedText: { fontSize: 15, color: SOL_THEME.text, lineHeight: 22 },
  divider: { height: 1, backgroundColor: SOL_THEME.border, marginVertical: 20 },
  entryCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1,
    padding: 14, marginBottom: 10,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  entryText: { fontSize: 14, color: SOL_THEME.text, lineHeight: 21 },
  deleteBtn: { fontSize: 13, color: SOL_THEME.textMuted, padding: 2 },
  emptyNote: { fontSize: 13, color: SOL_THEME.textMuted, textAlign: 'center', marginTop: 40 },
  vaultRow: { flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'flex-start' },
  vaultInput: {
    flex: 1, backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, borderColor: SOL_THEME.border,
    padding: 12, color: SOL_THEME.text, fontSize: 14,
    minHeight: 48, textAlignVertical: 'top',
  },
  vaultAddBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' },
  vaultAddText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 14 },
  vaultCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1,
    borderColor: SOL_THEME.border, borderLeftWidth: 3,
    padding: 14, marginBottom: 8,
  },
  vaultText: { fontSize: 15, color: SOL_THEME.text, lineHeight: 22, marginBottom: 8 },
  vaultMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vaultDate: { fontSize: 11, color: SOL_THEME.textMuted },
  // FIELD
  phaseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border,
    marginBottom: 6,
  },
  phaseGlyph: {
    fontSize: 18, width: 32, textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  phaseText: { flex: 1 },
  phaseName: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  phaseDesc: { fontSize: 12, color: SOL_THEME.textMuted, marginTop: 2 },
  phaseCheck: { fontSize: 10 },
  metricBlock: { marginBottom: 14 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  metricLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.5, width: 36,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  metricSub: { flex: 1, fontSize: 12, color: SOL_THEME.textMuted },
  metricVal: { fontSize: 14, fontWeight: '700' },
  metricQuestion: {
    fontSize: 13, color: SOL_THEME.text, lineHeight: 19,
    marginBottom: 10, fontStyle: 'italic',
  },
  dotsRow: { flexDirection: 'row', gap: 6 },
  dotWrap: { flex: 1, alignItems: 'center', gap: 5 },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: SOL_THEME.border,
    backgroundColor: SOL_THEME.surface,
  },
  dotLabel: {
    fontSize: 9, color: SOL_THEME.textMuted, textAlign: 'center', lineHeight: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  lqCard: {
    borderWidth: 1, borderRadius: 12, padding: 20,
    alignItems: 'center', backgroundColor: SOL_THEME.surface, marginTop: 8,
  },
  lqStage: {
    fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  lqValue: { fontSize: 42, fontWeight: '700', marginBottom: 4 },
  lqLabel: {
    fontSize: 10, color: SOL_THEME.textMuted, letterSpacing: 2, marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  lqBarTrack: {
    width: '100%', height: 4, backgroundColor: SOL_THEME.border,
    borderRadius: 2, overflow: 'hidden', marginBottom: 14,
  },
  lqBarFill: { height: 4, borderRadius: 2 },
  lqGlyph: {
    fontSize: 15, fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  reflectionCard: {
    borderWidth: 1, borderRadius: 10, padding: 14, marginTop: 10,
    backgroundColor: SOL_THEME.surface,
  },
  reflectionLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  reflectionText: {
    fontSize: 14, color: SOL_THEME.text, lineHeight: 22, fontStyle: 'italic',
  },
  chartScroll: { marginTop: 8 },
  chartBarWrap: { alignItems: 'center', marginRight: 8, width: 36 },
  chartLQLabel: { fontSize: 8, marginBottom: 4 },
  chartBarTrack: {
    width: 28, height: 80, justifyContent: 'flex-end',
    backgroundColor: SOL_THEME.border, borderRadius: 4, overflow: 'hidden',
  },
  chartBarFill: { width: '100%', borderRadius: 4 },
  chartDateLabel: {
    fontSize: 8, color: SOL_THEME.textMuted, marginTop: 4, textAlign: 'center',
  },
});
