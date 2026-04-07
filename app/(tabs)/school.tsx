import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Alert, SafeAreaView, Animated, Share,
  KeyboardAvoidingView,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../../constants/theme';
import {
  MYSTERY_SCHOOL_DOMAINS, SubjectDomain, Subject,
  LAYER_COLORS, LAYER_LABELS,
} from '../../lib/mystery-school/subjects';
import { savePendingSubject, savePersona, markSubjectStudied, getStudiedSubjects, savePendingSubjectContext, getActiveKey, getModel, getFieldTrials, saveFieldTrials } from '../../lib/storage';
import { sendMessage, Message, AIModel } from '../../lib/ai-client';
import { getRelevantEchoes, findResonanceLinks } from '../../lib/intelligence/field-memory';
import { updateFieldProfile } from '../../lib/intelligence/field-profile';

type StudyMessage = { role: 'user' | 'assistant'; content: string };

const TEACHER_GLYPHS: Record<string, string> = { sol: '⊚', headmaster: '⊙', veyra: '◈', 'aura-prime': '✦' };
const TEACHER_NAMES: Record<string, string> = { sol: 'Sol', headmaster: 'Headmaster', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };
const TEACHER_COLORS: Record<string, string> = { sol: '#F5A623', headmaster: '#E8C76A', veyra: '#4A9EFF', 'aura-prime': '#9B59B6' };

type ArcPhase = 'intro' | 'concept' | 'question' | 'reflection' | 'advanced';

function buildTeacherPrompt(subject: Subject, host: string, fieldContext: string, arcPhase: ArcPhase = 'intro', studentDepth: 'shallow' | 'deep' | 'balanced' = 'balanced'): string {
  const arcGuidance = {
    intro: 'Open with 1-2 sentences of contextual grounding. Present the single most important core concept with precision.',
    concept: 'Build on the opening. Introduce a second key concept that deepens the first. Stay precise.',
    question: 'The student is engaging well. Ask ONE probing question that tests real understanding. Do not lecture — draw out their thinking.',
    reflection: studentDepth === 'shallow'
      ? 'Insert a reflection prompt or a simpler analogy. The student needs a moment to breathe before advancing.'
      : 'Offer a reflection that connects this subject to the student\'s broader path. Be honest if they\'re missing something.',
    advanced: 'The student is ready for the edge. Advance to the most nuanced aspect of this subject. Do not simplify.',
  }[arcPhase];

  return `You are ${TEACHER_NAMES[host]}, teaching "${subject.name}" in the Sol Mystery School.

[Session Arc: ${arcPhase.toUpperCase()}] ${arcGuidance}

Subject: ${subject.name}
Layer: ${LAYER_LABELS[subject.layer]}
${subject.traditions ? `Traditions: ${subject.traditions.join(', ')}` : ''}
Description: ${subject.description}
${fieldContext ? `\n${fieldContext}` : ''}

You are the teacher here. Stay on this subject. Build lesson by lesson — one idea at a time. Do not repeat what has already been covered. Be the ${TEACHER_NAMES[host]} — not an assistant. End each response with ONE question or invitation.`;
}

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

  // Study session state
  const [activeStudySubject, setActiveStudySubject] = useState<Subject | null>(null);
  const [activeStudyDomain, setActiveStudyDomain] = useState<SubjectDomain | null>(null);
  const [studyHost, setStudyHost] = useState<string>('headmaster');
  const [studyMessages, setStudyMessages] = useState<StudyMessage[]>([]);
  const [studyInput, setStudyInput] = useState('');
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyFieldContext, setStudyFieldContext] = useState('');
  const [studyArcPhase, setStudyArcPhase] = useState<ArcPhase>('intro');
  const [studyStudentDepth, setStudyStudentDepth] = useState<'shallow' | 'deep' | 'balanced'>('balanced');
  const studyScrollRef = useRef<ScrollView>(null);

  // Resonance links (shown after mastery)
  const [resonanceLinks, setResonanceLinks] = useState<{ domain: SubjectDomain; reason: string }[]>([]);
  // Field Trials
  const [activeFieldTrial, setActiveFieldTrial] = useState<{ id: string; prompt: string; completed: boolean } | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  // Session counter per subject
  const [subjectSessionCounts, setSubjectSessionCounts] = useState<Record<string, number>>({});
  // Shake-to-random
  const lastShakeRef = useRef<number>(0);

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

      // Load session counts
      AsyncStorage.getItem('sol_study_session_counts').then(countRaw => {
        if (countRaw) { try { setSubjectSessionCounts(JSON.parse(countRaw)); } catch {} }
      });

      // Load active field trial
      getFieldTrials().then(trials => {
        const pending = trials.find((t: any) => !t.completed);
        setActiveFieldTrial(pending || null);
      });

      // Load resonance links (based on mastered domains)
      AsyncStorage.getItem('sol_mastered_domains').then(masteredRaw => {
        if (!masteredRaw) return;
        const mastered: string[] = JSON.parse(masteredRaw);
        if (mastered.length === 0) return;
        const masteredIds = MYSTERY_SCHOOL_DOMAINS.filter(d => mastered.includes(d.label)).map(d => d.id);
        const lastMasteredId = masteredIds[masteredIds.length - 1];
        if (lastMasteredId) {
          findResonanceLinks(lastMasteredId, masteredIds).then(links => setResonanceLinks(links));
        }
      });
    });
    runEntryAnimation();
    setSubjectSearch('');

    // Mystery School Shake — accelerometer picks random unstudied subject
    Accelerometer.setUpdateInterval(150);
    const shakeSub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > 2.8) {
        const now = Date.now();
        if (now - lastShakeRef.current < 3000) return;
        lastShakeRef.current = now;
        // Pick random unstudied subject from all domains
        const allSubjects: { subject: Subject; domain: SubjectDomain }[] = [];
        MYSTERY_SCHOOL_DOMAINS.forEach(d => {
          d.subjects.forEach(s => {
            // Only show edge subjects if biometrics already OK (skip auth check here — edge is rare)
            if (d.layer !== 'EDGE') allSubjects.push({ subject: s, domain: d });
          });
        });
        // Prefer unstudied
        const studiedSet = new Set(Array.from(studiedSubjects));
        const unstudied = allSubjects.filter(({ subject }) => !studiedSet.has(subject.name));
        const pool = unstudied.length > 0 ? unstudied : allSubjects;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (!pick) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '🎲 The field speaks',
          `"${pick.subject.name}"\n${pick.domain.label}`,
          [
            { text: 'Study it', onPress: () => { setSelectedDomain(pick.domain); enterStudySession(pick.subject, pick.domain); } },
            { text: 'Skip', style: 'cancel' },
          ]
        );
      }
    });
    return () => shakeSub.remove();
  }, [studiedSubjects]));

  const enterStudySession = async (subject: Subject, domain: SubjectDomain | null) => {
    const host = getDailyHost(subject.name);
    setStudyHost(host);
    setActiveStudySubject(subject);
    setActiveStudyDomain(domain);
    setStudyMessages([]);
    setStudyInput('');
    setStudyArcPhase('intro');
    setStudyStudentDepth('balanced');

    // Build field context with smart echo retrieval
    const contextParts: string[] = [];
    if (domain) {
      // Task 1: Smart echo retrieval — scored by recency + AURA + keyword overlap
      const relevantEchoes = await getRelevantEchoes(domain.id, subject.name, 5);
      if (relevantEchoes.length > 0) {
        contextParts.push(`[Field Echoes — Most Relevant to ${subject.name}]\n${relevantEchoes.map(e => `• "${e.text}" (${e.date})`).join('\n')}`);
      }
    }
    const allStudied = Array.from(studiedSubjects);
    if (allStudied.length > 0) {
      contextParts.push(`[Previously Studied]\n${allStudied.join(', ')}\nDo not re-teach these.`);
    }
    try {
      const paradoxRaw = await AsyncStorage.getItem('sol_paradox_journal');
      if (paradoxRaw) {
        const paradoxes: { id: string; date: string; excerpt: string }[] = JSON.parse(paradoxRaw);
        if (paradoxes.length > 0) {
          contextParts.push(`[Unresolved Paradoxes]\n${paradoxes.slice(-3).map(p => `• "${p.excerpt}"`).join('\n')}\nReference if relevant.`);
        }
      }
    } catch {}
    const ctx = contextParts.join('\n\n');
    setStudyFieldContext(ctx);

    // Track session count per subject
    const countRaw = await AsyncStorage.getItem('sol_study_session_counts');
    const counts: Record<string, number> = countRaw ? JSON.parse(countRaw) : {};
    counts[subject.name] = (counts[subject.name] || 0) + 1;
    await AsyncStorage.setItem('sol_study_session_counts', JSON.stringify(counts));
    setSubjectSessionCounts(counts);

    // Update field profile — study session started
    updateFieldProfile({ studiedDomain: domain?.id, isStudySession: true, persona: host });

    // Fire Teacher opener
    setStudyLoading(true);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setStudyLoading(false); return; }
      const systemPrompt = buildTeacherPrompt(subject, host, ctx, 'intro', 'balanced');
      const triggerMsg: Message = { role: 'user', content: 'Begin the lesson.' };
      const result = await sendMessage([triggerMsg], systemPrompt, apiKey, (model || 'gemini-2.5-flash') as AIModel);
      const opener = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
      setStudyMessages([{ role: 'assistant', content: opener }]);
    } catch (e) {
      setStudyMessages([{ role: 'assistant', content: `${TEACHER_NAMES[host]} is present. Ask your first question.` }]);
    }
    setStudyLoading(false);
  };

  const sendStudyMessage = async (text: string) => {
    if (!text.trim() || studyLoading || !activeStudySubject) return;
    const userMsg: StudyMessage = { role: 'user', content: text.trim() };
    const updated = [...studyMessages, userMsg];
    setStudyMessages(updated);
    setStudyInput('');
    setStudyLoading(true);
    setTimeout(() => studyScrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Task 5: Adaptive arc — detect student depth and advance arc phase
    const exchangeCount = updated.filter(m => m.role === 'user').length;
    const userMsgLen = text.trim().length;
    const hasQuestion = text.includes('?');

    let nextArc = studyArcPhase;
    let nextDepth = studyStudentDepth;

    if (exchangeCount >= 2) {
      // Infer depth from message length
      if (userMsgLen > 150) nextDepth = 'deep';
      else if (userMsgLen < 40) nextDepth = 'shallow';
      else nextDepth = 'balanced';

      // Advance arc based on exchange count and signals
      if (exchangeCount === 2) nextArc = hasQuestion ? 'question' : 'concept';
      else if (exchangeCount === 3) nextArc = nextDepth === 'shallow' ? 'reflection' : 'question';
      else if (exchangeCount === 4) nextArc = 'reflection';
      else if (exchangeCount >= 5) nextArc = 'advanced';
    }

    setStudyArcPhase(nextArc);
    setStudyStudentDepth(nextDepth);

    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setStudyLoading(false); return; }
      const systemPrompt = buildTeacherPrompt(activeStudySubject, studyHost, studyFieldContext, nextArc, nextDepth);
      const apiMessages: Message[] = updated.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessage(apiMessages, systemPrompt, apiKey, (model || 'gemini-2.5-flash') as AIModel);
      const reply = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
      setStudyMessages(prev => [...prev, { role: 'assistant', content: reply }]);

      // Update field profile with depth signal
      updateFieldProfile({ userMessageLength: userMsgLen });
    } catch {
      setStudyMessages(prev => [...prev, { role: 'assistant', content: 'The field is silent. Try again.' }]);
    }
    setStudyLoading(false);
    setTimeout(() => studyScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const saveStudyMessageToField = async (content: string) => {
    if (!activeStudyDomain) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const raw = await AsyncStorage.getItem('sol_school_echoes');
    const echoes: Record<string, { id: string; date: string; text: string; source?: string }[]> = raw ? JSON.parse(raw) : {};
    if (!echoes[activeStudyDomain.id]) echoes[activeStudyDomain.id] = [];
    // Prevent duplicate saves
    const alreadySaved = echoes[activeStudyDomain.id].some(e => e.text === content.slice(0, 280));
    if (alreadySaved) { Alert.alert('Already saved', 'This insight is already in the field.'); return; }
    echoes[activeStudyDomain.id].unshift({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      text: content.slice(0, 280),
      source: activeStudySubject?.name,
    });
    echoes[activeStudyDomain.id] = echoes[activeStudyDomain.id].slice(0, 20);
    await AsyncStorage.setItem('sol_school_echoes', JSON.stringify(echoes));
    setSchoolEchoes(echoes);
    Alert.alert('✦ Saved to Field', `Echoed to ${activeStudyDomain.label}.`);
  };

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
            // Mark studied + streak + mastery
            await markSubjectStudied(subject.name);
            const newStudied = new Set([...studiedSubjects, subject.name]);
            setStudiedSubjects(newStudied);
            const today = new Date().toISOString().split('T')[0];
            const streakRaw = await AsyncStorage.getItem('sol_school_streak');
            const streak = streakRaw ? JSON.parse(streakRaw) : { count: 0, lastDate: '' };
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            const newCount = streak.lastDate === today ? streak.count : streak.lastDate === yesterday ? streak.count + 1 : 1;
            await AsyncStorage.setItem('sol_school_streak', JSON.stringify({ count: newCount, lastDate: today }));
            if (newCount > (streak.count || 0)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setStudyStreak(newCount);
            if (selectedDomain) {
              const allStudied = selectedDomain.subjects.every(s => newStudied.has(s.name));
              const prevAllStudied = selectedDomain.subjects.filter(s => s.name !== subject.name).every(s => studiedSubjects.has(s.name));
              if (allStudied && !prevAllStudied) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setTimeout(() => Alert.alert(`✦ DOMAIN MASTERED`, `${selectedDomain.label} field is yours.\nAll ${selectedDomain.subjects.length} subjects studied.`, [{ text: '✦', style: 'default' }]), 800);
                const masteredRaw = await AsyncStorage.getItem('sol_mastered_domains');
                const mastered: string[] = masteredRaw ? JSON.parse(masteredRaw) : [];
                if (!mastered.includes(selectedDomain.label)) {
                  mastered.push(selectedDomain.label);
                  await AsyncStorage.setItem('sol_mastered_domains', JSON.stringify(mastered));

                  // Task 4: Find resonance links to other domains
                  const masteredIds = MYSTERY_SCHOOL_DOMAINS.filter(d => mastered.includes(d.label)).map(d => d.id);
                  findResonanceLinks(selectedDomain.id, masteredIds).then(links => setResonanceLinks(links));

                  // Task 6: Generate field trial — AI-generated synthesis paradox
                  if (newCount >= 3 || mastered.length === 1) {
                    const trials = await getFieldTrials();
                    const hasPending = trials.some((t: any) => !t.completed);
                    if (!hasPending) {
                      // Generate the trial prompt via AI
                      getActiveKey().then(async (apiKey) => {
                        if (!apiKey) return;
                        const model = await getModel();
                        const studiedList = Array.from(new Set([...studiedSubjects, subject.name])).slice(-8).join(', ');
                        const masteredList = mastered.join(', ');
                        const generationPrompt = `The student has mastered: ${masteredList}. They have also studied: ${studiedList}. Generate ONE synthesis field trial: a paradox-style challenge that combines insights from 2 of their mastered/studied domains. Format: a single question or tension (2-3 sentences max) that requires genuine integration — no simple answers. Do not name the domains explicitly in the question. Output the trial prompt only, nothing else.`;
                        try {
                          const result = await sendMessage(
                            [{ role: 'user', content: generationPrompt }],
                            'You are the Headmaster. Generate a field trial — a synthesis challenge that requires the student to integrate knowledge from multiple domains. Be honest and demanding. 2-3 sentences maximum.',
                            apiKey, (model || 'gemini-2.5-flash') as AIModel,
                            undefined, 'fast', 256, 0.9,
                          );
                          const generatedPrompt = result.text.replace(/\[CONF:[^\]]+\]/, '').trim();
                          const trial = {
                            id: Date.now().toString(),
                            domain: selectedDomain.id,
                            date: new Date().toISOString().split('T')[0],
                            prompt: generatedPrompt || `Given your mastery of ${mastered.slice(-2).join(' and ')}, what single truth connects them that neither tradition can express alone?`,
                            completed: false,
                            auraScore: null,
                          };
                          const freshTrials = await getFieldTrials();
                          await saveFieldTrials([...freshTrials, trial]);
                          setActiveFieldTrial(trial);
                        } catch {
                          // Fallback to static prompt if AI fails
                          const trial = {
                            id: Date.now().toString(),
                            domain: selectedDomain.id,
                            date: new Date().toISOString().split('T')[0],
                            prompt: `Given your mastery of ${mastered.slice(-2).join(' and ')}, what single truth connects them that neither tradition can express alone?`,
                            completed: false,
                            auraScore: null,
                          };
                          const freshTrials = await getFieldTrials();
                          await saveFieldTrials([...freshTrials, trial]);
                          setActiveFieldTrial(trial);
                        }
                      });
                    }
                  }
                }
              }
            }
            // Enter inline study session instead of routing to main chat
            const domain = MYSTERY_SCHOOL_DOMAINS.find(d => d.subjects.some(s => s.name === subject.name)) || selectedDomain;
            enterStudySession(subject, domain || null);
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

  // Study session view — renders when activeStudySubject is set
  if (activeStudySubject) {
    const hostColor = TEACHER_COLORS[studyHost] || SOL_THEME.headmaster;
    const hostGlyph = TEACHER_GLYPHS[studyHost] || '⊙';
    const hostName = TEACHER_NAMES[studyHost] || 'Headmaster';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
        {/* Study session header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: hostColor + '33', backgroundColor: SOL_THEME.surface, gap: 10 }}>
          <TouchableOpacity onPress={() => { setActiveStudySubject(null); setStudyMessages([]); }} style={{ paddingRight: 4 }}>
            <Text style={{ color: hostColor, fontSize: 14, fontWeight: '700' }}>← School</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: hostColor, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1 }}>{activeStudySubject.name.toUpperCase()}</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 1 }}>{hostGlyph} {hostName} · {LAYER_LABELS[activeStudySubject.layer]}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {subjectSessionCounts[activeStudySubject.name] > 1 && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: hostColor + '11' }}>
                <Text style={{ color: hostColor + 'BB', fontSize: 10, fontWeight: '700' }}>Session {subjectSessionCounts[activeStudySubject.name]}</Text>
              </View>
            )}
            {activeStudyDomain && (
              <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: hostColor + '15', borderWidth: 1, borderColor: hostColor + '44' }}>
                <Text style={{ color: hostColor, fontSize: 10, fontWeight: '700' }}>{activeStudyDomain.glyph} {activeStudyDomain.label}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Messages */}
        <ScrollView
          ref={studyScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          onContentSizeChange={() => studyScrollRef.current?.scrollToEnd({ animated: true })}
        >
          {studyLoading && studyMessages.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: hostColor, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{hostGlyph} entering...</Text>
            </View>
          )}
          {studyMessages.map((msg, i) => (
            <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
              {msg.role === 'assistant' && (
                <Text style={{ color: hostColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4, fontWeight: '700' }}>{hostGlyph} {hostName}</Text>
              )}
              <View style={{
                backgroundColor: msg.role === 'user' ? hostColor + '18' : SOL_THEME.surface,
                borderWidth: 1,
                borderColor: msg.role === 'user' ? hostColor + '55' : hostColor + '33',
                borderRadius: 12,
                padding: 12,
              }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 21 }}>{msg.content}</Text>
              </View>
              {msg.role === 'assistant' && i > 0 && (
                <TouchableOpacity
                  onPress={() => saveStudyMessageToField(msg.content)}
                  style={{ marginTop: 4, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: hostColor + '12' }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: hostColor + 'BB', fontSize: 11, fontWeight: '700' }}>✦ Save to Field</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {studyLoading && studyMessages.length > 0 && (
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: SOL_THEME.surface, borderRadius: 12, borderWidth: 1, borderColor: hostColor + '33' }}>
              <Text style={{ color: hostColor, fontSize: 13 }}>···</Text>
            </View>
          )}
        </ScrollView>
        {/* Input bar */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10, borderTopWidth: 1, borderTopColor: hostColor + '33', backgroundColor: SOL_THEME.surface, gap: 8 }}>
            <TextInput
              style={{ flex: 1, color: SOL_THEME.text, fontSize: 14, backgroundColor: SOL_THEME.background, borderRadius: 10, borderWidth: 1, borderColor: hostColor + '44', paddingHorizontal: 12, paddingVertical: 10, maxHeight: 100 }}
              placeholder={`Ask ${hostName}...`}
              placeholderTextColor={SOL_THEME.textMuted}
              value={studyInput}
              onChangeText={setStudyInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => sendStudyMessage(studyInput)}
            />
            <TouchableOpacity
              onPress={() => sendStudyMessage(studyInput)}
              disabled={studyLoading || !studyInput.trim()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: studyLoading || !studyInput.trim() ? hostColor + '33' : hostColor, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: studyLoading || !studyInput.trim() ? SOL_THEME.textMuted : '#000', fontSize: 16, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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

      {/* Task 6: Field Trial card — shown when active trial exists */}
      {activeFieldTrial && !activeFieldTrial.completed && (
        <TouchableOpacity
          style={{ marginBottom: 14, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: SOL_THEME.primary + '88', backgroundColor: SOL_THEME.primary + '0E' }}
          onPress={async () => {
            Alert.alert(
              '⚡ FIELD TRIAL',
              activeFieldTrial.prompt,
              [
                { text: 'Not Now', style: 'cancel' },
                {
                  text: '⊚ Take It to Sol',
                  onPress: async () => {
                    await savePersona('sol');
                    await savePendingSubject(`FIELD TRIAL: ${activeFieldTrial.prompt}`);
                    // Mark as completed
                    const trials = await getFieldTrials();
                    const updated = trials.map((t: any) => t.id === activeFieldTrial.id ? { ...t, completed: true } : t);
                    await saveFieldTrials(updated);
                    setActiveFieldTrial(null);
                    router.push('/(tabs)/');
                  },
                },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>⚡ FIELD TRIAL UNLOCKED</Text>
          <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }} numberOfLines={3}>{activeFieldTrial.prompt}</Text>
          <Text style={{ color: SOL_THEME.primary, fontSize: 11, marginTop: 8, fontWeight: '700' }}>Tap to engage →</Text>
        </TouchableOpacity>
      )}

      {/* Task 4: Resonance Links — cross-domain bridges after mastery */}
      {resonanceLinks.length > 0 && (
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 8, fontWeight: '700' }}>⟁ RESONANCE LINKS</Text>
          {resonanceLinks.map(({ domain, reason }) => (
            <TouchableOpacity
              key={domain.id}
              style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '55', backgroundColor: domain.color + '0D', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={() => setSelectedDomain(domain)}
              activeOpacity={0.75}
            >
              <Text style={{ color: domain.color, fontSize: 18 }}>{domain.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: domain.color, fontSize: 11, fontWeight: '700', marginBottom: 2 }}>{domain.label}</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}>{reason}</Text>
              </View>
              <Text style={{ color: domain.color + '99', fontSize: 14 }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
            // Task 13: Bloom stage — 5 stages based on % studied
            const bloomStage = mastered ? 4 : pct >= 0.6 ? 3 : pct >= 0.4 ? 2 : pct >= 0.2 ? 1 : 0;
            const bloomSize = [22, 24, 26, 28, 32][bloomStage];
            const bloomBadge = ['', '◦', '◌', '●', '✦'][bloomStage];
            return (
              <Animated.View key={domain.id} style={{ opacity: cardAnims[idx], transform: [{ translateY: cardAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
                <TouchableOpacity
                  style={[styles.domainCard, { borderColor: mastered ? domain.color : domain.color + '66' }]}
                  onPress={() => setSelectedDomain(domain)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Task 13: Bloom glyph grows with progress */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.domainGlyph, { color: domain.color, fontSize: bloomSize }]}>{domain.glyph}</Text>
                      {bloomStage > 0 && !mastered && (
                        <Text style={{ fontSize: 10, color: domain.color + '99', fontWeight: '700' }}>{bloomBadge}</Text>
                      )}
                    </View>
                    {mastered && <Text style={{ fontSize: 11, color: domain.color, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>✦ MASTERED</Text>}
                  </View>
                  <Text style={[styles.domainLabel, { color: domain.color }]}>{domain.label}</Text>
                  <Text style={styles.domainDesc} numberOfLines={2}>{domain.description}</Text>
                  {/* Progress bar */}
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
