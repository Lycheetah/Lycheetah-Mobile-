import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Alert, SafeAreaView, Animated, Share,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../../constants/theme';
import {
  MYSTERY_SCHOOL_DOMAINS, SubjectDomain, Subject,
  LAYER_COLORS, LAYER_LABELS,
} from '../../lib/mystery-school/subjects';
import { savePendingSubject, savePersona, markSubjectStudied, getStudiedSubjects } from '../../lib/storage';

type FieldStage = 'NEOPHYTE' | 'ADEPT' | 'MASTER' | 'HIEROPHANT' | 'AVATAR' | null;
type SchoolLayer = 'FOUNDATION' | 'MIDDLE' | 'EDGE';

const HOST_PERSONAS = ['sol', 'headmaster', 'veyra', 'aura-prime'] as const;
const HOST_GLYPHS: Record<string, string> = { sol: '⊚', headmaster: '⊙', veyra: '◈', 'aura-prime': '✦' };
const HOST_NAMES: Record<string, string> = { sol: 'Sol', headmaster: 'Headmaster', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };

function getDailyHost(subjectName: string): string {
  const day = new Date().toISOString().split('T')[0];
  const seed = [...(subjectName + day)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return HOST_PERSONAS[seed % HOST_PERSONAS.length];
}

function stageToLayer(stage: FieldStage): SchoolLayer {
  if (!stage || stage === 'NEOPHYTE') return 'FOUNDATION';
  if (stage === 'ADEPT') return 'MIDDLE';
  return 'EDGE';
}

const STAGE_GUIDANCE: Record<string, string> = {
  NEOPHYTE: 'Foundation subjects recommended — build the base.',
  ADEPT: 'Middle-layer subjects recommended — deepen the frameworks.',
  MASTER: 'Edge subjects recommended — engage the paradoxes.',
  HIEROPHANT: 'Edge subjects recommended — you are at the frontier.',
  AVATAR: 'All layers serve you — trust your pull.',
};

export default function MysterySchoolScreen() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | null>(null);
  const [fieldStage, setFieldStage] = useState<FieldStage>(null);
  const [fieldPhase, setFieldPhase] = useState<string | null>(null);
  const [studiedSubjects, setStudiedSubjects] = useState<Set<string>>(new Set());
  const [subjectSearch, setSubjectSearch] = useState('');
  const [studyStreak, setStudyStreak] = useState(0);
  const [subjectNotes, setSubjectNotes] = useState<Record<string, string>>({});
  const [schoolEchoes, setSchoolEchoes] = useState<Record<string, { id: string; date: string; text: string }[]>>({});
  const [subjectQuestions, setSubjectQuestions] = useState<Record<string, string[]>>({});
  const cardAnims = useRef(MYSTERY_SCHOOL_DOMAINS.map(() => new Animated.Value(0))).current;

  const runEntryAnimation = () => {
    cardAnims.forEach(a => a.setValue(0));
    Animated.stagger(60, cardAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: true })
    )).start();
  };

  useFocusEffect(useCallback(() => {
    Promise.all([
      AsyncStorage.getItem('sanctum_phase'),
      AsyncStorage.getItem(`sanctum_aura_${new Date().toISOString().split('T')[0]}`),
      getStudiedSubjects(),
      AsyncStorage.getItem('sol_school_streak'),
      AsyncStorage.getItem('sol_subject_notes'),
      AsyncStorage.getItem('sol_school_echoes'),
      AsyncStorage.getItem('sol_subject_questions'),
    ]).then(([phase, auraRaw, studied, streakRaw, notesRaw, echoesRaw, questionsRaw]) => {
      if (phase) setFieldPhase(phase);
      if (auraRaw) {
        try {
          const { lq } = JSON.parse(auraRaw);
          if (typeof lq === 'number') {
            if (lq >= 0.90) setFieldStage('AVATAR');
            else if (lq >= 0.85) setFieldStage('HIEROPHANT');
            else if (lq >= 0.80) setFieldStage('MASTER');
            else if (lq >= 0.65) setFieldStage('ADEPT');
            else setFieldStage('NEOPHYTE');
          }
        } catch {}
      }
      setStudiedSubjects(new Set(studied));
      if (streakRaw) { try { setStudyStreak(JSON.parse(streakRaw).count || 0); } catch {} }
      if (notesRaw) { try { setSubjectNotes(JSON.parse(notesRaw)); } catch {} }
      if (echoesRaw) { try { setSchoolEchoes(JSON.parse(echoesRaw)); } catch {} }
      if (questionsRaw) { try { setSubjectQuestions(JSON.parse(questionsRaw)); } catch {} }
    });
    runEntryAnimation();
    setSubjectSearch('');
  }, []));

  const handleSubjectPress = async (subject: Subject) => {
    // EDGE subjects require biometric authentication as ritual gate
    if (subject.layer === 'EDGE') {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: `⊚ EDGE RITE — ${subject.name}`,
          cancelLabel: 'Retreat',
          disableDeviceFallback: false,
        });
        if (!auth.success) return; // silently close — no error, just the gate holds
      }
    }

    Alert.alert(
      subject.name,
      `${subject.description}\n\nLayer: ${LAYER_LABELS[subject.layer]}${subject.traditions ? `\n\nTraditions: ${subject.traditions.join(', ')}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '⬇ Deepen This',
          onPress: async () => {
            await savePersona('headmaster');
            await savePendingSubject(`PARADOX DETECTED: What is the deepest truth about ${subject.name}? Go beyond the surface — what do the traditions reveal that isn't spoken directly?`);
            router.push('/(tabs)/');
          },
        },
        {
          text: `Study with ${HOST_NAMES[getDailyHost(subject.name)]}`,
          onPress: async () => {
            await savePersona(getDailyHost(subject.name) as any);
            await savePendingSubject(subject.name);
            await markSubjectStudied(subject.name);
            const newStudied = new Set([...studiedSubjects, subject.name]);
            setStudiedSubjects(newStudied);
            // #68 Update study streak
            const today = new Date().toISOString().split('T')[0];
            const streakRaw = await AsyncStorage.getItem('sol_school_streak');
            const streak = streakRaw ? JSON.parse(streakRaw) : { count: 0, lastDate: '' };
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const newCount = streak.lastDate === today ? streak.count : streak.lastDate === yesterday ? streak.count + 1 : 1;
            await AsyncStorage.setItem('sol_school_streak', JSON.stringify({ count: newCount, lastDate: today }));
            setStudyStreak(newCount);
            // #72 Domain Mastery Badge check
            if (selectedDomain) {
              const allStudied = selectedDomain.subjects.every(s => newStudied.has(s.name));
              const prevAllStudied = selectedDomain.subjects.filter(s => s.name !== subject.name).every(s => studiedSubjects.has(s.name));
              if (allStudied && !prevAllStudied) {
                setTimeout(() => Alert.alert(`✦ DOMAIN MASTERED`, `${selectedDomain.label} field is yours.\nAll ${selectedDomain.subjects.length} subjects studied.`, [{ text: '✦', style: 'default' }]), 800);
              }
            }
            router.push('/(tabs)/');
          },
        },
      ]
    );
  };

  const goToHeadmaster = async (subjectName?: string) => {
    await savePersona('headmaster');
    if (subjectName) {
      await savePendingSubject(subjectName);
    }
    router.push('/(tabs)/');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 80 }]}>
      <View style={styles.header}>
        <Text style={styles.headerGlyph}>𝔏</Text>
        <Text style={styles.headerTitle}>MYSTERY SCHOOL</Text>
        <Text style={styles.headerSub}>
          {selectedDomain ? selectedDomain.label : 'Select a domain to begin'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <TouchableOpacity
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '11' }}
            onPress={async () => {
              const allSubjects = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects);
              const random = allSubjects[Math.floor(Math.random() * allSubjects.length)];
              await handleSubjectPress(random);
            }}
          >
            <Text style={{ color: SOL_THEME.headmaster, fontSize: 13, fontWeight: '700' }}>🎲 Random Subject</Text>
          </TouchableOpacity>
          {studyStreak >= 2 && (
            <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E07040' + '55', backgroundColor: '#E07040' + '11' }}>
              <Text style={{ color: '#E07040', fontSize: 13, fontWeight: '700' }}>🔥 {studyStreak} day streak</Text>
            </View>
          )}
        </View>
      </View>

      {/* Headmaster presence banner */}
      <TouchableOpacity
        style={{ marginHorizontal: 0, marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '0E', flexDirection: 'row', alignItems: 'center', gap: 10 }}
        onPress={() => goToHeadmaster()}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 20, color: SOL_THEME.headmaster }}>⊙</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: SOL_THEME.headmaster, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1 }}>HEADMASTER IS PRESENT</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>Tap to open a free session — or select a subject below.</Text>
        </View>
        <Text style={{ color: SOL_THEME.headmaster + '99', fontSize: 16 }}>→</Text>
      </TouchableOpacity>

      {/* Field-aware banner */}
      {fieldStage && (
        <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.primary + '44', backgroundColor: SOL_THEME.primary + '0D' }}>
          <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 3 }}>
            ⊚ YOUR FIELD · {fieldStage}{fieldPhase ? ` · ${fieldPhase}` : ''}
          </Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>
            {STAGE_GUIDANCE[fieldStage]}
          </Text>
        </View>
      )}

      {!selectedDomain ? (
        // #77 Animated domain grid
        <View style={styles.domainGrid}>
          {MYSTERY_SCHOOL_DOMAINS.map((domain, idx) => {
            const studiedCount = domain.subjects.filter(s => studiedSubjects.has(s.name)).length;
            const total = domain.subjects.length;
            const pct = total > 0 ? studiedCount / total : 0;
            const mastered = studiedCount === total && total > 0;
            return (
              <Animated.View key={domain.id} style={{ opacity: cardAnims[idx], transform: [{ translateY: cardAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
                <TouchableOpacity
                  style={[styles.domainCard, { borderColor: mastered ? domain.color : domain.color + '66' }]}
                  onPress={() => setSelectedDomain(domain)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.domainGlyph, { color: domain.color }]}>{domain.glyph}</Text>
                    {mastered && <Text style={{ fontSize: 11, color: domain.color, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>✦ MASTERED</Text>}
                  </View>
                  <Text style={[styles.domainLabel, { color: domain.color }]}>{domain.label}</Text>
                  <Text style={styles.domainDesc} numberOfLines={2}>{domain.description}</Text>
                  {/* #66 Progress ring */}
                  <View style={{ marginTop: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={styles.domainCount}>{total} subjects{studiedCount > 0 ? ` · ${studiedCount} studied` : ''}</Text>
                      {pct > 0 && <Text style={{ fontSize: 10, color: domain.color }}>{Math.round(pct * 100)}%</Text>}
                    </View>
                    <View style={{ height: 3, backgroundColor: SOL_THEME.border, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{ height: 3, width: `${Math.round(pct * 100)}%`, backgroundColor: domain.color, borderRadius: 2 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        // Subject list for selected domain
        <View>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setSelectedDomain(null); setSubjectSearch(''); }}>
            <Text style={[styles.backText, { color: selectedDomain.color }]}>← All Domains</Text>
          </TouchableOpacity>

          <Text style={styles.domainBanner}>{selectedDomain.glyph} {selectedDomain.label}</Text>
          <Text style={styles.domainBannerDesc}>{selectedDomain.description}</Text>

          {/* #70 Subject Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, paddingHorizontal: 12, marginBottom: 12, gap: 8 }}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>⌕</Text>
            <TextInput
              style={{ flex: 1, color: SOL_THEME.text, fontSize: 13, paddingVertical: 9 }}
              placeholder="Search subjects..."
              placeholderTextColor={SOL_THEME.textMuted}
              value={subjectSearch}
              onChangeText={setSubjectSearch}
              autoCapitalize="none"
            />
            {subjectSearch.length > 0 && (
              <TouchableOpacity onPress={() => setSubjectSearch('')}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {(() => {
            const recommendedLayer = stageToLayer(fieldStage);
            const layerOrder: SchoolLayer[] = fieldStage
              ? [recommendedLayer, ...(['FOUNDATION', 'MIDDLE', 'EDGE'] as SchoolLayer[]).filter(l => l !== recommendedLayer)]
              : ['FOUNDATION', 'MIDDLE', 'EDGE'];
            return layerOrder;
          })().map(layer => {
            const q = subjectSearch.toLowerCase();
            const layerSubjects = selectedDomain.subjects.filter(s => s.layer === layer && (q === '' || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)));
            if (layerSubjects.length === 0) return null;
            const isRecommended = fieldStage && layer === stageToLayer(fieldStage);
            return (
              <View key={layer} style={styles.layerSection}>
                <View style={[styles.layerBadge, { backgroundColor: LAYER_COLORS[layer] + '22', borderColor: LAYER_COLORS[layer] + '66' }]}>
                  <Text style={[styles.layerLabel, { color: LAYER_COLORS[layer] }]}>
                    {LAYER_LABELS[layer].toUpperCase()}
                    {isRecommended ? '  ⊚ FOR YOUR STAGE' : ''}
                  </Text>
                </View>
                {layerSubjects.map(subject => (
                  <TouchableOpacity
                    key={subject.name}
                    style={[styles.subjectCard, { borderLeftColor: selectedDomain.color }, studiedSubjects.has(subject.name) && { opacity: 0.75 }]}
                    onPress={() => handleSubjectPress(subject)}
                    onLongPress={() => {
                      const existing = subjectNotes[subject.name] || '';
                      Alert.prompt
                        ? Alert.prompt('Subject Note', `Add a personal note for "${subject.name}"`, async (text) => {
                            if (text === null) return;
                            const updated = { ...subjectNotes, [subject.name]: text };
                            setSubjectNotes(updated);
                            await AsyncStorage.setItem('sol_subject_notes', JSON.stringify(updated));
                          }, 'plain-text', existing)
                        : Alert.alert(subject.name, existing ? `Your note: "${existing}"` : 'No note yet. iOS only for note editing.', [{ text: 'OK' }]);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.subjectTop}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      {studiedSubjects.has(subject.name) && (
                        <Text style={{ fontSize: 10, color: '#4CAF50', marginTop: 3, marginRight: 2 }}>✓</Text>
                      )}
                      {subjectNotes[subject.name] && (
                        <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, marginTop: 3, marginRight: 2 }}>✎</Text>
                      )}
                      <Text style={[styles.subjectLayerDot, { color: LAYER_COLORS[subject.layer] }]}>●</Text>
                    </View>
                    <Text style={styles.subjectDesc} numberOfLines={2}>{subject.description}</Text>
                    {subject.traditions && (
                      <View style={styles.traditionsRow}>
                        {subject.traditions.map(t => (
                          <View key={t} style={[styles.traditionChip, { borderColor: selectedDomain.color + '55' }]}>
                            <Text style={[styles.traditionText, { color: selectedDomain.color }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={[styles.studyBtn, { color: selectedDomain.color, marginTop: 0 }]}>
                        Study →
                      </Text>
                      {(() => {
                        const host = getDailyHost(subject.name);
                        return (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: selectedDomain.color + '15', borderWidth: 1, borderColor: selectedDomain.color + '44' }}>
                            <Text style={{ fontSize: 10, color: selectedDomain.color }}>{HOST_GLYPHS[host]}</Text>
                            <Text style={{ fontSize: 9, color: selectedDomain.color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>{HOST_NAMES[host]} hosting</Text>
                          </View>
                        );
                      })()}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>
      )}

      {/* #71 Anonymous Question Drop — visible when inside a domain */}
      {selectedDomain && (
        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: selectedDomain.color + '44', backgroundColor: selectedDomain.color + '0D' }}
            onPress={() => {
              Alert.prompt
                ? Alert.prompt('Drop a Question', `Leave an anonymous question for "${selectedDomain.label}":`, async (text) => {
                    if (!text || !text.trim()) return;
                    const key = selectedDomain.id;
                    const updated = { ...subjectQuestions, [key]: [text.trim(), ...(subjectQuestions[key] || [])].slice(0, 20) };
                    setSubjectQuestions(updated);
                    await AsyncStorage.setItem('sol_subject_questions', JSON.stringify(updated));
                  }, 'plain-text')
                : Alert.alert('Drop a Question', 'iOS only for question input.', [{ text: 'OK' }]);
            }}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 16, color: selectedDomain.color }}>❓</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: selectedDomain.color, fontSize: 12, fontWeight: '700' }}>Drop a Question</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 1 }}>Leave a question for this domain — anonymously.</Text>
            </View>
          </TouchableOpacity>
          {(subjectQuestions[selectedDomain.id] || []).length > 0 && (
            <View style={{ marginTop: 8, gap: 6 }}>
              {(subjectQuestions[selectedDomain.id] || []).map((q, qi) => (
                <View key={qi} style={{ padding: 10, borderRadius: 8, backgroundColor: selectedDomain.color + '0A', borderWidth: 1, borderColor: selectedDomain.color + '33', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Text style={{ color: selectedDomain.color, fontSize: 12 }}>❓</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, flex: 1, lineHeight: 17 }}>{q}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* #63 Insight Echoes — high-AURA chat moments echoed to this domain */}
      {selectedDomain && (schoolEchoes[selectedDomain.id] || []).length > 0 && (
        <View style={{ marginTop: 4, marginBottom: 16 }}>
          <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 8, fontWeight: '700' }}>✦ FIELD ECHOES</Text>
          {(schoolEchoes[selectedDomain.id] || []).map(echo => (
            <View key={echo.id} style={{ padding: 10, borderRadius: 8, backgroundColor: '#9B59B60A', borderWidth: 1, borderColor: '#9B59B633', marginBottom: 6 }}>
              <Text style={{ color: '#9B59B6', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4 }}>✦ ECHOED · {echo.date}</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>{echo.text}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          The Mystery School is not a place you graduate from.{'\n'}
          It is a way of seeing that, once learned, cannot be unlearned.
        </Text>
      </View>
    </ScrollView>

    {/* Sticky Headmaster bar */}
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: SOL_THEME.surface, borderTopWidth: 1, borderTopColor: SOL_THEME.headmaster + '33', paddingHorizontal: 16, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10 }}>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SOL_THEME.headmaster + '18', borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44' }}
        onPress={() => goToHeadmaster(selectedDomain ? undefined : undefined)}
        activeOpacity={0.75}
      >
        <Text style={{ fontSize: 16, color: SOL_THEME.headmaster }}>⊙</Text>
        <Text style={{ color: SOL_THEME.headmaster, fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>
          {selectedDomain ? `Study ${selectedDomain.label} with Headmaster` : 'Open Headmaster Session'}
        </Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 48 },
  header: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  headerGlyph: { fontSize: 36, color: SOL_THEME.headmaster || '#C0A060', marginBottom: 8 },
  headerTitle: {
    fontSize: 13, fontWeight: '700', color: SOL_THEME.headmaster || '#C0A060',
    letterSpacing: 3, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerSub: { fontSize: 13, color: SOL_THEME.textMuted, textAlign: 'center' },
  domainGrid: { gap: 10 },
  domainCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, padding: 14, gap: 4,
  },
  domainGlyph: { fontSize: 22, marginBottom: 2 },
  domainLabel: { fontSize: 14, fontWeight: '700' },
  domainDesc: { fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18 },
  domainCount: { fontSize: 11, color: SOL_THEME.textMuted, marginTop: 4 },
  backBtn: { paddingVertical: 10, marginBottom: 4 },
  backText: { fontSize: 14, fontWeight: '600' },
  domainBanner: { fontSize: 18, fontWeight: '700', color: SOL_THEME.text, marginBottom: 4 },
  domainBannerDesc: { fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 20, marginBottom: 16 },
  layerSection: { marginBottom: 16 },
  layerBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  layerLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  subjectCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 8,
    borderWidth: 1, borderColor: SOL_THEME.border,
    borderLeftWidth: 3, padding: 12, marginBottom: 8, gap: 4,
  },
  subjectTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  subjectName: { flex: 1, fontSize: 14, fontWeight: '700', color: SOL_THEME.text },
  subjectLayerDot: { fontSize: 10, marginTop: 3 },
  subjectDesc: { fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18 },
  traditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  traditionChip: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  traditionText: { fontSize: 10, fontWeight: '600' },
  studyBtn: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  footer: {
    marginTop: 32, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: SOL_THEME.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12, color: SOL_THEME.textMuted,
    textAlign: 'center', lineHeight: 20, fontStyle: 'italic',
  },
});
