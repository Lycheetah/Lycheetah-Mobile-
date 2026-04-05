import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import { getAccentColor } from '../../lib/storage';

const KEYS = {
  INTENTION: 'sanctum_intention',
  REFLECTION: 'sanctum_reflection',
  JOURNAL: 'sanctum_journal',
  VAULT: 'sanctum_vault',
};

type JournalEntry = { id: string; date: string; text: string };
type VaultEntry = { id: string; text: string; date: string };

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
  const [section, setSection] = useState<'today' | 'journal' | 'vault'>('today');

  const load = useCallback(async () => {
    setAccentColor(await getAccentColor());
    const [int, ref, jRaw, vRaw] = await Promise.all([
      AsyncStorage.getItem(`${KEYS.INTENTION}_${todayKey()}`),
      AsyncStorage.getItem(`${KEYS.REFLECTION}_${todayKey()}`),
      AsyncStorage.getItem(KEYS.JOURNAL),
      AsyncStorage.getItem(KEYS.VAULT),
    ]);
    if (int) { setIntention(int); setSavedIntention(int); }
    if (ref) { setReflection(ref); setSavedReflection(ref); }
    setJournal(jRaw ? JSON.parse(jRaw) : []);
    setVault(vRaw ? JSON.parse(vRaw) : []);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <View style={[styles.header, { borderBottomColor: accentColor + '33' }]}>
        <Text style={[styles.headerGlyph, { color: accentColor }]}>⊼</Text>
        <Text style={[styles.headerTitle, { color: accentColor }]}>THE SANCTUM</Text>
        <Text style={styles.headerDate}>{todayStr()}</Text>
      </View>

      {/* Section tabs */}
      <View style={styles.sectionTabs}>
        {(['today', 'journal', 'vault'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.sectionTab, section === s && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
            onPress={() => setSection(s)}
          >
            <Text style={[styles.sectionTabText, section === s && { color: accentColor }]}>
              {s === 'today' ? 'TODAY' : s === 'journal' ? 'JOURNAL' : 'VAULT'}
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
                <Text style={styles.entryText}>{entry.text}</Text>
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

    </ScrollView>
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
});
