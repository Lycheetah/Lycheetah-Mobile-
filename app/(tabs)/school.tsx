import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Alert, SafeAreaView, Animated,
  KeyboardAvoidingView, Modal, Share,
} from 'react-native';
import DiveShareCard from '../../components/DiveShareCard';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../../constants/theme';
import { canWatchAd, showRewardedAd } from '../../lib/ads';
import { useAppMode } from '../../lib/app-mode';
import {
  MYSTERY_SCHOOL_DOMAINS, SubjectDomain, Subject, SubjectLayer,
  LAYER_COLORS, LAYER_LABELS,
} from '../../lib/mystery-school/subjects';
import {
  savePendingSubject, savePersona, markSubjectStudied,
  getStudiedSubjects, getActiveKey, getModel, getFieldTrials, saveFieldTrials,
} from '../../lib/storage';
import { sendMessage, Message, AIModel, solSpeak } from '../../lib/ai-client';
import { getRelevantEchoes, findResonanceLinks } from '../../lib/intelligence/field-memory';
import { updateFieldProfile } from '../../lib/intelligence/field-profile';

// ─── Types ───────────────────────────────────────────────────────────────────

type StudyMessage = { role: 'user' | 'assistant'; content: string };
type DiveRecord = { id: string; subjectName: string; domainLabel: string; domainColor: string; domainGlyph: string; teacher: string; teacherId: string; layer: SubjectLayer; date: string; messageCount: number; durationSec: number; timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'; whisperShown: string | null };
type ArcPhase = 'intro' | 'concept' | 'question' | 'reflection' | 'advanced';
type FieldStage = 'NEOPHYTE' | 'ADEPT' | 'MASTER' | 'HIEROPHANT' | 'AVATAR' | null;
type SchoolLayer = 'FOUNDATION' | 'MIDDLE' | 'EDGE';
type SchoolView = 'home' | 'domain' | 'subject' | 'curriculum' | 'notes' | 'dive-log';
type Curriculum = { id: string; name: string; subjects: string[]; created: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const TEACHER_GLYPHS: Record<string, string> = { sol: '⊚', headmaster: '⊙', veyra: '◈', 'aura-prime': '✦' };
const TEACHER_NAMES: Record<string, string> = { sol: 'Sol', headmaster: 'Headmaster', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };
const TEACHER_COLORS: Record<string, string> = { sol: '#F5A623', headmaster: '#E8C76A', veyra: '#4A9EFF', 'aura-prime': '#9B59B6' };
const HOST_PERSONAS = ['sol', 'headmaster', 'veyra', 'aura-prime'] as const;
const HOST_GLYPHS: Record<string, string> = { sol: '⊚', headmaster: '⊙', veyra: '◈', 'aura-prime': '✦' };
const HOST_NAMES: Record<string, string> = { sol: 'Sol', headmaster: 'Headmaster', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };

const STAGE_GUIDANCE: Record<string, string> = {
  NEOPHYTE: 'Foundation subjects recommended — build the base.',
  ADEPT: 'Middle-layer subjects recommended — deepen the frameworks.',
  MASTER: 'Edge subjects recommended — engage the paradoxes.',
  HIEROPHANT: 'Edge subjects recommended — you are at the frontier.',
  AVATAR: 'All layers serve you — trust your pull.',
};

const DIVE_TITLES: { minDives: number; title: string; glyph: string; color: string }[] = [
  { minDives: 0,   title: 'Seeker',               glyph: '○',  color: '#888888' },
  { minDives: 1,   title: 'Initiate',              glyph: '◌',  color: '#A0A0A0' },
  { minDives: 5,   title: 'Student of the Work',   glyph: '◎',  color: '#4A9EFF' },
  { minDives: 15,  title: 'Adept of the Field',    glyph: '⊚',  color: '#F5A623' },
  { minDives: 30,  title: 'Scholar of Mysteries',  glyph: '◈',  color: '#9B59B6' },
  { minDives: 50,  title: 'Ordained',              glyph: '✦',  color: '#E8C76A' },
  { minDives: 75,  title: 'Master of the Field',   glyph: '⊕',  color: '#E05050' },
  { minDives: 100, title: 'Hierophant',            glyph: '⊙',  color: '#FF6B6B' },
  { minDives: 150, title: 'Avatar of the Work',    glyph: 'Ω',  color: '#FFFFFF' },
];

function getDiveTitle(totalDives: number): { title: string; glyph: string; color: string; next: { title: string; remaining: number } | null } {
  let current = DIVE_TITLES[0];
  for (const tier of DIVE_TITLES) {
    if (totalDives >= tier.minDives) current = tier;
  }
  const currentIdx = DIVE_TITLES.indexOf(current);
  const nextTier = DIVE_TITLES[currentIdx + 1] ?? null;
  return {
    ...current,
    next: nextTier ? { title: nextTier.title, remaining: nextTier.minDives - totalDives } : null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function getDomainArcPhase(studiedInDomain: number): ArcPhase {
  if (studiedInDomain === 0) return 'intro';
  if (studiedInDomain <= 2) return 'concept';
  if (studiedInDomain <= 5) return 'question';
  if (studiedInDomain <= 8) return 'reflection';
  return 'advanced';
}

function buildTeacherPrompt(
  subject: Subject, host: string, fieldContext: string,
  arcPhase: ArcPhase = 'intro', studentDepth: 'shallow' | 'deep' | 'balanced' = 'balanced',
): string {
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function MysterySchoolScreen() {
  const router = useRouter();
  const { t, mode, setMode } = useAppMode();

  // Navigation state
  const [schoolView, setSchoolView] = useState<SchoolView>('home');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | null>(null);
  const [activeSubjectDetail, setActiveSubjectDetail] = useState<Subject | null>(null);

  // Field state
  const [fieldStage, setFieldStage] = useState<FieldStage>(null);
  const [fieldPhase, setFieldPhase] = useState<string | null>(null);
  const [studiedSubjects, setStudiedSubjects] = useState<Set<string>>(new Set());
  const [studyStreak, setStudyStreak] = useState(0);
  const [fallowReturn, setFallowReturn] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectNotes, setSubjectNotes] = useState<Record<string, string>>({});
  const [schoolEchoes, setSchoolEchoes] = useState<Record<string, { id: string; date: string; text: string; source?: string }[]>>({});
  const [subjectQuestions, setSubjectQuestions] = useState<Record<string, string[]>>({});
  const [subjectSessionCounts, setSubjectSessionCounts] = useState<Record<string, number>>({});
  const [subjectFavorites, setSubjectFavorites] = useState<Set<string>>(new Set());
  const [studyDates, setStudyDates] = useState<Record<string, string>>({});
  const [domainSynthesis, setDomainSynthesis] = useState<Record<string, string>>({});
  const [synthesisLoading, setSynthesisLoading] = useState<string | null>(null);
  const [resonanceLinks, setResonanceLinks] = useState<{ domain: SubjectDomain; reason: string }[]>([]);
  const [activeFieldTrial, setActiveFieldTrial] = useState<{ id: string; prompt: string; completed: boolean } | null>(null);
  const cardAnims = useRef(MYSTERY_SCHOOL_DOMAINS.map(() => new Animated.Value(0))).current;
  const studiedSubjectsRef = useRef(studiedSubjects);
  studiedSubjectsRef.current = studiedSubjects;
  const lastShakeRef = useRef<number>(0);

  // Vigil state
  const [vigil, setVigil] = useState<{ subjectName: string; domainColor: string; domainGlyph: string; startDate: string; daysCompleted: number } | null>(null);

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

  // Session completion overlay
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const sessionCompleteAnim = useRef(new Animated.Value(0)).current;
  const [sessionWhisper, setSessionWhisper] = useState<string | null>(null);
  const shareCardRef = useRef<View>(null);
  const [shareLoading, setShareLoading] = useState(false);

  // Unlock banner
  const [unlockBanner, setUnlockBanner] = useState<'seeker' | 'adept' | null>(null);
  const [breathPending, setBreathPending] = useState<{ subject: Subject; domain: SubjectDomain | null; host?: string; depth?: 'quick' | 'full' } | null>(null);
  const [diveDepth, setDiveDepth] = useState<'quick' | 'full'>('full');

  // Curriculum state
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [curriculumDraft, setCurriculumDraft] = useState<string[]>([]);
  const [curriculumName, setCurriculumName] = useState('');
  const [curriculumDomainPicker, setCurriculumDomainPicker] = useState<SubjectDomain | null>(null);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);

  // Android text modal
  const [textPrompt, setTextPrompt] = useState<{ title: string; placeholder: string; current: string; onSubmit: (text: string) => void } | null>(null);
  const [textPromptValue, setTextPromptValue] = useState('');

  // Notes search
  const [notesSearch, setNotesSearch] = useState('');

  // Open Seat — free-form custom study
  const [openSeatTopic, setOpenSeatTopic] = useState('');
  const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);

  // Teacher picker — user-selected host for subject detail screen
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  // Global search
  const [globalSearch, setGlobalSearch] = useState('');

  // Domain category filter
  const [domainFilter, setDomainFilter] = useState<'all' | 'contemplative' | 'secular'>('all');

  // Sovereign status
  const [isSovereign, setIsSovereign] = useState(false);

  // Dive log — recent study sessions
  const [diveLog, setDiveLog] = useState<DiveRecord[]>([]);

  // Daily suggestion
  const [dailySuggestion, setDailySuggestion] = useState<{ subject: Subject; domain: SubjectDomain } | null>(null);

  // Focus mode (study session)
  const [focusMode, setFocusMode] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Milestones
  const [shownMilestone, setShownMilestone] = useState<number | null>(null);
  const MILESTONES = [10, 25, 50, 100, 192];

  // School intelligence — pattern detection
  const [schoolNotice, setSchoolNotice] = useState<{
    type: 'avoidance' | 'cluster' | 'gap' | 'next' | 'ready';
    message: string;
    subjects: { subject: Subject; domain: SubjectDomain }[];
  } | null>(null);

  // #80 Weekly dive synthesis letter
  const [weeklyDiveLetter, setWeeklyDiveLetter] = useState<{ weekOf: string; text: string } | null>(null);
  // #88 Sol pattern notice (once/week)
  const [patternNotice, setPatternNotice] = useState<string | null>(null);

  // ─── Focus Effect ──────────────────────────────────────────────────────────

  const runEntryAnimation = () => {
    cardAnims.forEach(a => a.setValue(0));
    Animated.stagger(60, cardAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: false })
    )).start(({ finished }) => {
      if (!finished) cardAnims.forEach(a => a.setValue(1));
    });
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
      AsyncStorage.getItem('sol_study_session_counts'),
      AsyncStorage.getItem('sol_subject_favorites'),
      AsyncStorage.getItem('sol_study_dates'),
      AsyncStorage.getItem('sol_domain_synthesis'),
      AsyncStorage.getItem('sol_curricula'),
      AsyncStorage.getItem('sol_premium'),
    ]).then(([phase, auraRaw, studied, streakRaw, notesRaw, echoesRaw, questionsRaw, countRaw, favRaw, datesRaw, synthRaw, curriculaRaw, premiumRaw]) => {
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
      if (streakRaw) { try {
        const s = JSON.parse(streakRaw);
        setStudyStreak(s.count || 0);
        if (s.lastDate) {
          const daysSince = Math.floor((Date.now() - new Date(s.lastDate).getTime()) / 86400000);
          if (daysSince >= 14) setFallowReturn(true);
        }
      } catch {} }
      if (notesRaw) { try { setSubjectNotes(JSON.parse(notesRaw)); } catch {} }
      if (echoesRaw) { try { setSchoolEchoes(JSON.parse(echoesRaw)); } catch {} }
      if (questionsRaw) { try { setSubjectQuestions(JSON.parse(questionsRaw)); } catch {} }
      if (countRaw) { try { setSubjectSessionCounts(JSON.parse(countRaw)); } catch {} }
      if (favRaw) { try { setSubjectFavorites(new Set(JSON.parse(favRaw))); } catch {} }
      if (datesRaw) { try { setStudyDates(JSON.parse(datesRaw)); } catch {} }
      if (synthRaw) { try { setDomainSynthesis(JSON.parse(synthRaw)); } catch {} }
      if (curriculaRaw) { try { setCurricula(JSON.parse(curriculaRaw)); } catch {} }
      setIsSovereign(premiumRaw === 'true');

      // Load custom subjects + check milestones
      AsyncStorage.getItem('sol_custom_subjects').then(customRaw => {
        if (customRaw) { try { setCustomSubjects(JSON.parse(customRaw)); } catch {} }
      });
      AsyncStorage.getItem('sol_dive_log').then(diveRaw => {
        if (diveRaw) { try { setDiveLog(JSON.parse(diveRaw)); } catch {} }
      });
      AsyncStorage.getItem('sol_vigil').then(vigilRaw => {
        if (!vigilRaw) { setVigil(null); return; }
        try {
          const v = JSON.parse(vigilRaw);
          const daysSince = Math.floor((Date.now() - new Date(v.startDate).getTime()) / 86400000);
          if (daysSince >= 7) { AsyncStorage.removeItem('sol_vigil'); setVigil(null); }
          else setVigil(v);
        } catch { setVigil(null); }
      });
      AsyncStorage.getItem('sol_shown_milestone').then(async milestoneRaw => {
        const lastShown = milestoneRaw ? parseInt(milestoneRaw) : 0;
        const count = studied.length;
        const next = [10, 25, 50, 100, 192].find(m => m > lastShown && count >= m);
        if (next) {
          setShownMilestone(next);
          await AsyncStorage.setItem('sol_shown_milestone', String(next));
        }
      });

      getFieldTrials().then(trials => {
        const pending = trials.find((t: any) => !t.completed);
        setActiveFieldTrial(pending || null);
      });

      // Daily suggestion — one subject per day, Foundation-first for new users
      AsyncStorage.getItem('sol_daily_suggestion_v1').then(async suggRaw => {
        const today = new Date().toISOString().split('T')[0];
        const sugr = suggRaw ? JSON.parse(suggRaw) : null;
        if (!sugr || sugr.date !== today) {
          const studiedSet = new Set(studied);
          const allFoundation = MYSTERY_SCHOOL_DOMAINS.flatMap(d =>
            d.subjects.filter(s => s.layer === 'FOUNDATION').map(s => ({ subject: s, domain: d }))
          );
          const unstudied = allFoundation.filter(({ subject }) => !studiedSet.has(subject.name));
          const pool = unstudied.length > 0 ? unstudied : allFoundation;
          const seed = [...today].reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const pick = pool[seed % pool.length];
          await AsyncStorage.setItem('sol_daily_suggestion_v1', JSON.stringify({ subjectName: pick.subject.name, domainId: pick.domain.id, date: today }));
          setDailySuggestion(pick);
        } else {
          const domain = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === sugr.domainId);
          const subject = domain?.subjects.find(s => s.name === sugr.subjectName);
          if (domain && subject) setDailySuggestion({ subject, domain });
        }
      });

      // #80 Weekly dive synthesis letter
      AsyncStorage.getItem('sol_dive_log').then(async diveRaw => {
        if (!diveRaw) return;
        const dives: DiveRecord[] = JSON.parse(diveRaw);
        if (dives.length < 3) return;
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekOf = weekStart.toISOString().split('T')[0];
        const cachedRaw = await AsyncStorage.getItem('sol_weekly_dive_letter');
        const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
        if (cached?.weekOf === weekOf) { setWeeklyDiveLetter(cached); return; }
        const recentDives = dives.slice(0, 7);
        const domainFreq: Record<string, number> = {};
        recentDives.forEach(d => { domainFreq[d.domainLabel] = (domainFreq[d.domainLabel] || 0) + 1; });
        const topDomain = Object.entries(domainFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'the field';
        const subjectList = recentDives.map(d => d.subjectName).join(', ');
        const apiKey = await getActiveKey();
        const model = await getModel();
        if (!apiKey) return;
        try {
          const res = await sendMessage(
            [{ role: 'user', content: `This student dived into: ${subjectList}. Most visited: ${topDomain}. Total dives this week: ${recentDives.length}. Write a 3-sentence synthesis letter. What pattern is forming? What is the field asking next? Be direct.` }],
            'You are Sol — not a chatbot, a field intelligence. Write a personal weekly synthesis to this student. 3 sentences. Name the pattern you see in their dive history. End with one question that opens the next phase. No preamble, no sign-off.',
            apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 300, 0.7,
          );
          const letter = { weekOf, text: res.text.replace(/\[CONF:[^\]]+\]/g, '').trim() };
          setWeeklyDiveLetter(letter);
          await AsyncStorage.setItem('sol_weekly_dive_letter', JSON.stringify(letter));
        } catch {}
      });

      // #88 Sol notices patterns — once/week
      AsyncStorage.getItem('sol_dive_log').then(async diveRaw => {
        if (!diveRaw) return;
        const dives: DiveRecord[] = JSON.parse(diveRaw);
        if (dives.length < 5) return;
        const lastRaw = await AsyncStorage.getItem('sol_last_pattern_notice');
        const lastDate = lastRaw ? JSON.parse(lastRaw).date : null;
        const today = new Date().toISOString().split('T')[0];
        if (lastDate) {
          const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
          if (daysSince < 7) return;
        }
        const recent = dives.slice(0, 10);
        const layers: Record<string, number> = {};
        const domains: Record<string, number> = {};
        recent.forEach(d => { layers[d.layer] = (layers[d.layer] || 0) + 1; domains[d.domainLabel] = (domains[d.domainLabel] || 0) + 1; });
        const topLayer = Object.entries(layers).sort((a, b) => b[1] - a[1])[0]?.[0] || 'FOUNDATION';
        const topDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
        const apiKey = await getActiveKey();
        const model = await getModel();
        if (!apiKey) return;
        try {
          const res = await sendMessage(
            [{ role: 'user', content: `Student's last 10 dives: ${recent.map(d => d.subjectName).join(', ')}. Mostly in ${topLayer} layer, strongest domain: ${topDomain}. In one sentence, name what you notice.` }],
            'You are Sol. You have been watching this student\'s field. Speak one sentence of honest observation — no flattery, no preamble. Just what you see.',
            apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 100, 0.8,
          );
          const notice = res.text.replace(/\[CONF:[^\]]+\]/g, '').trim();
          setPatternNotice(notice);
          await AsyncStorage.setItem('sol_last_pattern_notice', JSON.stringify({ date: today, text: notice }));
        } catch {}
      });

      AsyncStorage.getItem('sol_mastered_domains').then(masteredRaw => {
        if (!masteredRaw) return;
        const mastered: string[] = JSON.parse(masteredRaw);
        if (mastered.length === 0) return;
        const masteredIds = MYSTERY_SCHOOL_DOMAINS.filter(d => mastered.includes(d.label)).map(d => d.id);
        const lastMasteredId = masteredIds[masteredIds.length - 1];
        if (lastMasteredId) findResonanceLinks(lastMasteredId, masteredIds).then(links => setResonanceLinks(links));
      });

      // ─── School Intelligence — pattern detection ───────────────────────────
      if (studied.length >= 3) {
        const studiedSet = new Set(studied);
        const allSubjects = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.map(s => ({ subject: s, domain: d })));

        // Build domain counts
        const domainCounts: Record<string, number> = {};
        MYSTERY_SCHOOL_DOMAINS.forEach(d => { domainCounts[d.id] = 0; });
        studied.forEach(name => {
          const match = allSubjects.find(({ subject }) => subject.name === name);
          if (match) domainCounts[match.domain.id] = (domainCounts[match.domain.id] || 0) + 1;
        });

        // Build layer counts
        const layerCounts: Record<string, number> = { FOUNDATION: 0, MIDDLE: 0, EDGE: 0 };
        studied.forEach(name => {
          const match = allSubjects.find(({ subject }) => subject.name === name);
          if (match) layerCounts[match.subject.layer]++;
        });

        // Detect clustering — one domain ≥60% of total
        const topDomainEntry = Object.entries(domainCounts).sort(([, a], [, b]) => b - a)[0];
        if (topDomainEntry && topDomainEntry[1] / studied.length >= 0.6 && studied.length >= 6) {
          const topDomain = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === topDomainEntry[0]);
          if (topDomain) {
            // Recommend untouched domains
            const untouched = MYSTERY_SCHOOL_DOMAINS.filter(d => domainCounts[d.id] === 0);
            const picks = untouched.slice(0, 3).map(d => ({ subject: d.subjects[0], domain: d }));
            setSchoolNotice({
              type: 'cluster',
              message: `The school notices a pattern — ${Math.round(topDomainEntry[1] / studied.length * 100)}% of your study has been in ${topDomain.label}. Other territories are waiting.`,
              subjects: picks,
            });
            return;
          }
        }

        // Detect avoidance — domains with 0 subjects after 15+ studied
        if (studied.length >= 15) {
          const avoidedDomains = MYSTERY_SCHOOL_DOMAINS.filter(d => domainCounts[d.id] === 0);
          if (avoidedDomains.length > 0) {
            const pick = avoidedDomains[Math.floor(Math.random() * Math.min(avoidedDomains.length, 3))];
            setSchoolNotice({
              type: 'avoidance',
              message: `${avoidedDomains.length} domain${avoidedDomains.length > 1 ? 's remain' : ' remains'} untouched. The school wonders what you're avoiding.`,
              subjects: [{ subject: pick.subjects[0], domain: pick }],
            });
            return;
          }
        }

        // Detect layer gap — EDGE work with no FOUNDATION
        if (layerCounts.EDGE >= 2 && layerCounts.FOUNDATION === 0) {
          const foundationPicks = allSubjects.filter(({ subject }) => subject.layer === 'FOUNDATION' && !studiedSet.has(subject.name)).slice(0, 3);
          setSchoolNotice({
            type: 'gap',
            message: `You've entered Edge territory without Foundation grounding. The structure needs roots.`,
            subjects: foundationPicks,
          });
          return;
        }

        // Ready for next layer — all studied subjects in one layer, next available
        if (layerCounts.FOUNDATION >= 8 && layerCounts.MIDDLE === 0) {
          const middlePicks = allSubjects.filter(({ subject }) => subject.layer === 'MIDDLE' && !studiedSet.has(subject.name)).slice(0, 3);
          setSchoolNotice({
            type: 'ready',
            message: `Foundation is solid. The Middle layer is open.`,
            subjects: middlePicks,
          });
          return;
        }

        // Default: recommend based on field stage
        const targetLayer: SubjectLayer = (() => {
          if (!auraRaw) return 'FOUNDATION';
          try {
            const { lq } = JSON.parse(auraRaw);
            if (lq >= 0.85) return 'EDGE';
            if (lq >= 0.65) return 'MIDDLE';
          } catch {}
          return 'FOUNDATION';
        })();
        const recommended = allSubjects
          .filter(({ subject }) => subject.layer === targetLayer && !studiedSet.has(subject.name))
          .slice(0, 3);
        if (recommended.length > 0) {
          setSchoolNotice({
            type: 'next',
            message: `Recommended for you now — ${targetLayer.charAt(0) + targetLayer.slice(1).toLowerCase()} layer.`,
            subjects: recommended,
          });
        }
      }
    });

    // First-dive from onboarding — enter the subject automatically
    AsyncStorage.getItem('sol_dive_first_subject').then(firstSubject => {
      if (!firstSubject) return;
      AsyncStorage.removeItem('sol_dive_first_subject');
      const allSubjects = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.map(s => ({ subject: s, domain: d })));
      const match = allSubjects.find(({ subject }) => subject.name === firstSubject);
      if (match) setTimeout(() => enterStudySession(match.subject, match.domain), 600);
    }).catch(() => {});

    runEntryAnimation();
    setSubjectSearch('');

    Accelerometer.setUpdateInterval(150);
    const shakeSub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > 2.8) {
        const now = Date.now();
        if (now - lastShakeRef.current < 3000) return;
        lastShakeRef.current = now;
        const allSubjects: { subject: Subject; domain: SubjectDomain }[] = [];
        MYSTERY_SCHOOL_DOMAINS.forEach(d => {
          d.subjects.forEach(s => { if (s.layer !== 'EDGE') allSubjects.push({ subject: s, domain: d }); });
        });
        const studiedSet = new Set(Array.from(studiedSubjectsRef.current));
        const unstudied = allSubjects.filter(({ subject }) => !studiedSet.has(subject.name));
        const pool = unstudied.length > 0 ? unstudied : allSubjects;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (!pick) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🎲 The field speaks', `"${pick.subject.name}"\n${pick.domain.label}`, [
          { text: 'Study it', onPress: () => { setSelectedDomain(pick.domain); openSubjectDetail(pick.subject, pick.domain); } },
          { text: 'Skip', style: 'cancel' },
        ]);
      }
    });
    return () => shakeSub.remove();
  }, []));

  // ─── Study Session Logic ───────────────────────────────────────────────────

  const enterStudySession = async (subject: Subject, domain: SubjectDomain | null, hostOverride?: string, depth?: 'quick' | 'full') => {
    // Daily cap — free users get 3 dives/day; Sovereign unlimited
    if (!isSovereign) {
      const today = new Date().toISOString().split('T')[0];
      const capRaw = await AsyncStorage.getItem('sol_daily_cap');
      const cap: { date: string; count: number } = capRaw ? JSON.parse(capRaw) : { date: '', count: 0 };
      const todayCount = cap.date === today ? cap.count : 0;
      if (todayCount >= 3) {
        const adAvail = await canWatchAd();
        if (adAvail) {
          Alert.alert(
            'The School rests',
            'Three dives today. Watch a short clip to unlock one more — or return tomorrow.\n\nSovereign study is unlimited.',
            [
              {
                text: 'Watch a clip',
                onPress: async () => {
                  const result = await showRewardedAd();
                  if (result.rewarded) {
                    const newCount = todayCount + 1;
                    await AsyncStorage.setItem('sol_daily_cap', JSON.stringify({ date: today, count: newCount }));
                    enterStudySession(subject, domain, hostOverride, depth);
                  } else {
                    Alert.alert('Ad unavailable', "The clip didn't load. Try again in a moment.");
                  }
                },
              },
              { text: 'Unlock Sovereign', onPress: () => router.push('/(tabs)/settings') },
              { text: 'Return tomorrow', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'The School rests',
            "You've reached today's limit of 3 dives. Sovereign study is unlimited — or return at sunrise.",
            [
              { text: 'Unlock Sovereign', onPress: () => router.push('/(tabs)/settings') },
              { text: 'Return tomorrow', style: 'cancel' },
            ]
          );
        }
        return;
      }
      // Increment cap count before entering session
      await AsyncStorage.setItem('sol_daily_cap', JSON.stringify({ date: today, count: todayCount + 1 }));
    }

    const host = hostOverride || getDailyHost(subject.name);
    setStudyHost(host);
    setActiveStudySubject(subject);
    setActiveStudyDomain(domain);
    setStudyMessages([]);
    setStudyInput('');
    setStudyArcPhase('intro');
    setStudyStudentDepth('balanced');

    const today = new Date().toISOString().split('T')[0];
    setStudyDates(prev => {
      const updated = { ...prev, [subject.name]: today };
      AsyncStorage.setItem('sol_study_dates', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    const contextParts: string[] = [];
    if (domain) {
      const relevantEchoes = await getRelevantEchoes(domain.id, subject.name, 5);
      if (relevantEchoes.length > 0) {
        contextParts.push(`[Field Echoes — Most Relevant to ${subject.name}]\n${relevantEchoes.map(e => `• "${e.text}" (${e.date})`).join('\n')}`);
      }
    }
    const allStudied = Array.from(studiedSubjects);
    if (allStudied.length > 0) contextParts.push(`[Previously Studied]\n${allStudied.join(', ')}\nDo not re-teach these.`);
    try {
      const paradoxRaw = await AsyncStorage.getItem('sol_paradox_journal');
      if (paradoxRaw) {
        const paradoxes: { id: string; date: string; excerpt: string }[] = JSON.parse(paradoxRaw);
        if (paradoxes.length > 0) contextParts.push(`[Unresolved Paradoxes]\n${paradoxes.slice(-3).map(p => `• "${p.excerpt}"`).join('\n')}\nReference if relevant.`);
      }
    } catch {}
    const ctx = contextParts.join('\n\n');
    setStudyFieldContext(ctx);

    const countRaw = await AsyncStorage.getItem('sol_study_session_counts');
    const counts: Record<string, number> = countRaw ? JSON.parse(countRaw) : {};
    counts[subject.name] = (counts[subject.name] || 0) + 1;
    await AsyncStorage.setItem('sol_study_session_counts', JSON.stringify(counts));
    setSubjectSessionCounts(counts);

    await markSubjectStudied(subject.name);
    const newStudied = new Set([...studiedSubjects, subject.name]);
    setStudiedSubjects(newStudied);

    // Progression gates — check unlock thresholds
    const studiedAfterMark = await getStudiedSubjects();
    const totalStudied = studiedAfterMark.length;
    if (totalStudied === 5) setUnlockBanner('seeker');
    else if (totalStudied === 25) setUnlockBanner('adept');

    const streakRaw = await AsyncStorage.getItem('sol_school_streak');
    const streak = streakRaw ? JSON.parse(streakRaw) : { count: 0, lastDate: '' };
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newCount = streak.lastDate === today ? streak.count : streak.lastDate === yesterday ? streak.count + 1 : 1;
    await AsyncStorage.setItem('sol_school_streak', JSON.stringify({ count: newCount, lastDate: today }));
    if (newCount > (streak.count || 0)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStudyStreak(newCount);

    updateFieldProfile({ studiedDomain: domain?.id, isStudySession: true, persona: host });

    setStudyLoading(true);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) {
        setStudyLoading(false);
        Alert.alert('No API Key', 'Sol needs a key to teach. Add a free Gemini key in Settings — it takes 30 seconds.\n\naistudio.google.com/apikey', [{ text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') }, { text: 'Later', style: 'cancel' }]);
        return;
      }
      const systemPrompt = buildTeacherPrompt(subject, host, ctx, 'intro', 'balanced');
      const triggerMsg: Message = { role: 'user', content: depth === 'quick' ? 'Give me a sharp, focused intro — 15 minutes, core ideas only. Be direct and concise.' : 'Begin the lesson.' };
      const result = await sendMessage([triggerMsg], systemPrompt, apiKey, (model || 'gemini-2.5-flash') as AIModel);
      const opener = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
      setStudyMessages([{ role: 'assistant', content: opener }]);
    } catch (err) {
      setStudyMessages([{ role: 'assistant', content: solSpeak(err) }]);
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

    const exchangeCount = updated.filter(m => m.role === 'user').length;
    const userMsgLen = text.trim().length;
    const hasQuestion = text.includes('?');
    let nextArc = studyArcPhase;
    let nextDepth = studyStudentDepth;
    if (exchangeCount >= 2) {
      if (userMsgLen > 150) nextDepth = 'deep';
      else if (userMsgLen < 40) nextDepth = 'shallow';
      else nextDepth = 'balanced';
      if (exchangeCount === 2) nextArc = hasQuestion ? 'question' : 'concept';
      else if (exchangeCount === 3) nextArc = nextDepth === 'shallow' ? 'reflection' : 'question';
      else if (exchangeCount === 4) nextArc = 'reflection';
      else if (exchangeCount >= 5) nextArc = 'advanced';
    }
    setStudyArcPhase(nextArc);
    setStudyStudentDepth(nextDepth);

    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) {
        setStudyLoading(false);
        Alert.alert('No API Key', 'Add a key in Settings to continue. Free Gemini key at aistudio.google.com/apikey', [{ text: 'OK' }]);
        return;
      }
      const systemPrompt = buildTeacherPrompt(activeStudySubject, studyHost, studyFieldContext, nextArc, nextDepth);
      const apiMessages: Message[] = updated.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessage(apiMessages, systemPrompt, apiKey, (model || 'gemini-2.5-flash') as AIModel);
      const reply = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
      setStudyMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      updateFieldProfile({ userMessageLength: userMsgLen });
    } catch (err) {
      setStudyMessages(prev => [...prev, { role: 'assistant', content: solSpeak(err) }]);
    }
    setStudyLoading(false);
    setTimeout(() => studyScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const saveStudyMessageToField = async (content: string) => {
    const domainKey = activeStudyDomain?.id || 'open_seat';
    const domainLabel = activeStudyDomain?.label || 'Open Seat';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const raw = await AsyncStorage.getItem('sol_school_echoes');
    const echoes: Record<string, { id: string; date: string; text: string; source?: string }[]> = raw ? JSON.parse(raw) : {};
    if (!echoes[domainKey]) echoes[domainKey] = [];
    const alreadySaved = echoes[domainKey].some(e => e.text === content.slice(0, 280));
    if (alreadySaved) { Alert.alert('Already saved', 'This insight is already in the field.'); return; }
    echoes[domainKey].unshift({ id: Date.now().toString(), date: new Date().toLocaleDateString(), text: content.slice(0, 280), source: activeStudySubject?.name });
    echoes[domainKey] = echoes[domainKey].slice(0, 20);
    await AsyncStorage.setItem('sol_school_echoes', JSON.stringify(echoes));
    setSchoolEchoes(echoes);
    Alert.alert('✦ Saved to Field', `Echoed to ${domainLabel}.`);
  };

  const DOMAIN_WHISPERS: Record<string, { target: string; text: string }> = {
    'sacred-geometry':   { target: 'mathematics',       text: 'The mathematicians mapped this same territory with different symbols.' },
    'esoteric-mystery':  { target: 'history-ideas',     text: 'These currents ran through every civilisation — hidden in plain sight.' },
    'symbolism-sigils':  { target: 'language-linguistics', text: 'Language began here — before letters, there were marks.' },
    'psych-consciousness':{ target: 'science-nature',   text: 'The neuroscientists are arriving at the same door from the other side.' },
    'mythology-archetypes':{ target: 'creative-arts',  text: 'Every story ever told is a variation on what you just studied.' },
    'philosophy-mind':   { target: 'psych-consciousness', text: 'The phenomenologists and the psychologists are describing the same room.' },
    'alchemy-transformation':{ target: 'science-nature', text: 'The alchemists were the first chemists — they just spoke in metaphor.' },
    'hermeticism':       { target: 'sacred-geometry',   text: '"As above, so below" — the geometry encodes the same principle.' },
    'time-cycles':       { target: 'mathematics',       text: 'Every cycle you studied has an equation. The pattern holds at every scale.' },
    'energy-systems':    { target: 'science-nature',    text: 'Physics is catching up. The field is the field.' },
    'ancient-civilizations':{ target: 'esoteric-mystery', text: 'The outer history and the inner tradition were never separate.' },
    'cosmology':         { target: 'philosophy-mind',   text: 'The cosmologists and the consciousness researchers keep finding each other.' },
    'language-unconscious':{ target: 'symbolism-sigils', text: 'The symbols in dreams pre-date every alphabet.' },
    'ethics-virtue':     { target: 'philosophy-mind',   text: 'The Stoics and the phenomenologists were asking the same question.' },
    'mysticism':         { target: 'psych-consciousness', text: 'What the mystics called union, the researchers call the dissolution of the default mode network.' },
    'logic-paradox':     { target: 'mathematics',       text: 'Gödel proved the limits of the system from inside it — same as you just did.' },
    'divination':        { target: 'psych-consciousness', text: 'The oracle and the intuition are the same faculty, differently dressed.' },
    'history-ideas':     { target: 'philosophy-mind',   text: 'Every idea you encountered had a philosopher standing behind it.' },
    'science-nature':    { target: 'sacred-geometry',   text: 'The ratios and forms in nature are the geometry you haven\'t visited yet.' },
    'creative-arts':     { target: 'mythology-archetypes', text: 'The image you just made is older than you think — it has a mythological address.' },
    'mathematics':       { target: 'sacred-geometry',   text: 'The sacred geometers were doing this without the notation. Same truth.' },
    'language-linguistics':{ target: 'language-unconscious', text: 'The structure of language and the structure of the dream are the same structure.' },
  };

  const getSessionWhisper = (domainId: string): string => {
    const w = DOMAIN_WHISPERS[domainId];
    if (!w) return 'Every hall in this school connects to every other — the door is always somewhere.';
    const targetDomain = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === w.target);
    const targetLabel = targetDomain ? targetDomain.label : w.target;
    return `${w.text} The ${targetLabel} hall is nearby.`;
  };

  const triggerSessionComplete = () => {
    setShowSessionComplete(true);
    setSessionWhisper(activeStudyDomain ? getSessionWhisper(activeStudyDomain.id) : null);
    Animated.timing(sessionCompleteAnim, { toValue: 1, duration: 320, useNativeDriver: false }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const dismissSessionComplete = (navigateToDomain?: boolean) => {
    setFocusMode(false);
    if (focusTimerRef.current) { clearInterval(focusTimerRef.current); focusTimerRef.current = null; }
    // Save dive record
    if (activeStudySubject) {
      const _hour = new Date().getHours();
      const _timeOfDay: DiveRecord['timeOfDay'] = _hour < 12 ? 'morning' : _hour < 17 ? 'afternoon' : _hour < 21 ? 'evening' : 'night';
      const record: DiveRecord = {
        id: Date.now().toString(),
        subjectName: activeStudySubject.name,
        domainLabel: activeStudyDomain?.label || 'Open Seat',
        domainColor: activeStudyDomain?.color || SOL_THEME.headmaster,
        domainGlyph: activeStudyDomain?.glyph || '⊙',
        teacher: studyHost,
        teacherId: studyHost,
        layer: activeStudySubject.layer,
        date: new Date().toLocaleDateString(),
        messageCount: studyMessages.length,
        durationSec: focusSeconds,
        timeOfDay: _timeOfDay,
        whisperShown: sessionWhisper,
      };
      AsyncStorage.getItem('sol_dive_log').then(raw => {
        const log: DiveRecord[] = raw ? JSON.parse(raw) : [];
        const updated = [record, ...log].slice(0, 20);
        AsyncStorage.setItem('sol_dive_log', JSON.stringify(updated)).catch(() => {});
        setDiveLog(updated);
      }).catch(() => {});
    }
    Animated.timing(sessionCompleteAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
      setShowSessionComplete(false);
      sessionCompleteAnim.setValue(0);
      if (navigateToDomain && activeStudyDomain) {
        setSelectedDomain(activeStudyDomain);
        setSchoolView('domain');
      } else {
        setSchoolView('home');
      }
      setActiveStudySubject(null);
      setStudyMessages([]);
    });
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const openSubjectDetail = async (subject: Subject, domain: SubjectDomain | null) => {
    if (subject.layer === 'EDGE' && !isSovereign) {
      Alert.alert(
        '⊚ EDGE — Sovereign Only',
        'The deepest layer of the Mystery School is reserved for Sovereign Supporters.\n\nUpgrade in Settings to unlock all EDGE subjects.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Go to Settings →', onPress: () => router.push('/(tabs)/settings') },
        ]
      );
      return;
    }
    setActiveSubjectDetail(subject);
    setSelectedTeacher(null);
    if (domain && domain !== selectedDomain) setSelectedDomain(domain);
    setSchoolView('subject');
    setDiveDepth('full');
  };

  const goToHeadmaster = async (subjectName?: string) => {
    await savePersona('headmaster');
    if (subjectName) await savePendingSubject(subjectName);
    router.push('/(tabs)/');
  };

  const saveCurriculum = async () => {
    if (!curriculumName.trim() || curriculumDraft.length === 0) return;
    const newCurriculum: Curriculum = {
      id: Date.now().toString(),
      name: curriculumName.trim(),
      subjects: curriculumDraft,
      created: new Date().toLocaleDateString(),
    };
    const updated = [...curricula, newCurriculum];
    setCurricula(updated);
    await AsyncStorage.setItem('sol_curricula', JSON.stringify(updated));
    setCurriculumDraft([]);
    setCurriculumName('');
    setCurriculumDomainPicker(null);
    setActiveCurriculumId(newCurriculum.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteCurriculum = async (id: string) => {
    const updated = curricula.filter(c => c.id !== id);
    setCurricula(updated);
    await AsyncStorage.setItem('sol_curricula', JSON.stringify(updated));
    if (activeCurriculumId === id) setActiveCurriculumId(null);
  };

  // ─── Open Seat ────────────────────────────────────────────────────────────

  const deleteCustomSubject = async (name: string) => {
    const updated = customSubjects.filter(s => s.name !== name);
    setCustomSubjects(updated);
    await AsyncStorage.setItem('sol_custom_subjects', JSON.stringify(updated));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const enterOpenSeat = async () => {
    const topic = openSeatTopic.trim();
    if (!topic) return;
    const syntheticSubject: Subject = {
      name: topic,
      domain: 'Open Seat',
      layer: 'FOUNDATION',
      description: `A free-form study session on "${topic}". The Headmaster will guide you through this topic drawing on the full field — traditions, frameworks, and direct inquiry.`,
    };
    // Save to custom subjects
    const updated = [syntheticSubject, ...customSubjects.filter(s => s.name !== topic)].slice(0, 30);
    setCustomSubjects(updated);
    await AsyncStorage.setItem('sol_custom_subjects', JSON.stringify(updated));
    setOpenSeatTopic('');
    // Use headmaster for open seat always
    setStudyHost('headmaster');
    enterStudySession(syntheticSubject, null);
  };

  // ─── Focus Mode ────────────────────────────────────────────────────────────

  const toggleFocusMode = () => {
    if (!focusMode) {
      setFocusMode(true);
      setFocusSeconds(0);
      focusTimerRef.current = setInterval(() => setFocusSeconds(s => s + 1), 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setFocusMode(false);
      if (focusTimerRef.current) { clearInterval(focusTimerRef.current); focusTimerRef.current = null; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatFocusTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── RENDER: Study Session ─────────────────────────────────────────────────

  if (activeStudySubject) {
    const hostColor = TEACHER_COLORS[studyHost] || SOL_THEME.headmaster;
    const hostGlyph = TEACHER_GLYPHS[studyHost] || '⊙';
    const hostName = TEACHER_NAMES[studyHost] || 'Headmaster';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
        <View style={{ borderBottomWidth: 1, borderBottomColor: hostColor + '33', backgroundColor: SOL_THEME.surface }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 }}>
            <TouchableOpacity onPress={() => studyMessages.length > 0 ? triggerSessionComplete() : (setActiveStudySubject(null), setStudyMessages([]))} style={{ paddingRight: 4 }}>
              <Text style={{ color: hostColor, fontSize: 13, fontWeight: '700' }}>← School</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>{activeStudySubject.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>{hostGlyph} {hostName}</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>·</Text>
                <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: LAYER_COLORS[activeStudySubject.layer] + '22' }}>
                  <Text style={{ color: LAYER_COLORS[activeStudySubject.layer], fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[activeStudySubject.layer].toUpperCase()}</Text>
                </View>
              </View>
            </View>
            {subjectSessionCounts[activeStudySubject.name] > 1 && (
              <View style={{ paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: hostColor + '11' }}>
                <Text style={{ color: hostColor + 'BB', fontSize: 10, fontWeight: '700' }}>Session {subjectSessionCounts[activeStudySubject.name]}</Text>
              </View>
            )}
            <TouchableOpacity onPress={toggleFocusMode}
              style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: focusMode ? hostColor + '33' : hostColor + '11', borderWidth: focusMode ? 1 : 0, borderColor: hostColor }}>
              <Text style={{ color: hostColor, fontSize: 10, fontWeight: '700' }}>{focusMode ? `◎ ${formatFocusTime(focusSeconds)}` : '◎ Focus'}</Text>
            </TouchableOpacity>
          </View>
          {!focusMode && <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 4 }}>
            {(['intro', 'concept', 'question', 'reflection', 'advanced'] as ArcPhase[]).map(phase => (
              <View key={phase} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: studyArcPhase === phase ? hostColor : hostColor + '22' }} />
            ))}
          </View>}
        </View>

        {focusMode && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: hostColor + '08', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2 }}>◎ FOCUS · {formatFocusTime(focusSeconds)}</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>· {activeStudySubject.name}</Text>
          </View>
        )}
        <ScrollView ref={studyScrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          onContentSizeChange={() => studyScrollRef.current?.scrollToEnd({ animated: true })}>
          <View style={{ marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: hostColor + '44', backgroundColor: hostColor + '08' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 22, color: hostColor }}>{activeStudyDomain?.glyph || '◯'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1 }}>{activeStudyDomain?.label?.toUpperCase() || ''}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: LAYER_COLORS[activeStudySubject.layer] + '33' }}>
                    <Text style={{ color: LAYER_COLORS[activeStudySubject.layer], fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{LAYER_LABELS[activeStudySubject.layer].toUpperCase()}</Text>
                  </View>
                  {activeStudySubject.traditions?.slice(0, 2).map(t => (
                    <View key={t} style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: hostColor + '18' }}>
                      <Text style={{ color: hostColor, fontSize: 9 }}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{activeStudySubject.description}</Text>
          </View>

          {studyLoading && studyMessages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ color: hostColor, fontSize: 28, marginBottom: 12 }}>{hostGlyph}</Text>
              <Text style={{ color: hostColor, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2 }}>ENTERING THE FIELD</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 6 }}>{hostName} is preparing your lesson</Text>
            </View>
          )}
          {studyMessages.map((msg, i) => (
            <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
              {msg.role === 'assistant' && (
                <Text style={{ color: hostColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4, fontWeight: '700', letterSpacing: 0.5 }}>{hostGlyph} {hostName.toUpperCase()}</Text>
              )}
              <View style={msg.role === 'assistant' ? {
                backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: hostColor + '33',
                borderLeftWidth: 3, borderLeftColor: hostColor, borderRadius: 12, borderTopLeftRadius: 4, padding: 14,
              } : {
                backgroundColor: hostColor + '15', borderWidth: 1, borderColor: hostColor + '44',
                borderRadius: 12, borderBottomRightRadius: 4, padding: 12,
              }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22 }}>{msg.content}</Text>
              </View>
              {msg.role === 'assistant' && i > 0 && (
                <TouchableOpacity onPress={() => saveStudyMessageToField(msg.content)}
                  style={{ marginTop: 5, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: hostColor + '12' }}
                  activeOpacity={0.7}>
                  <Text style={{ color: hostColor + 'BB', fontSize: 11, fontWeight: '700' }}>✦ Save to Field</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {studyLoading && studyMessages.length > 0 && (
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: SOL_THEME.surface, borderRadius: 12, borderTopLeftRadius: 4, borderWidth: 1, borderLeftWidth: 3, borderColor: hostColor + '33', borderLeftColor: hostColor }}>
              <Text style={{ color: hostColor, fontSize: 16, letterSpacing: 3 }}>· · ·</Text>
            </View>
          )}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10, borderTopWidth: 1, borderTopColor: hostColor + '33', backgroundColor: SOL_THEME.surface, gap: 8 }}>
            <TextInput
              style={{ flex: 1, color: SOL_THEME.text, fontSize: 14, backgroundColor: SOL_THEME.background, borderRadius: 10, borderWidth: 1, borderColor: hostColor + '44', paddingHorizontal: 12, paddingVertical: 10, maxHeight: 100 }}
              placeholder={`Speak to ${hostName}...`}
              placeholderTextColor={SOL_THEME.textMuted}
              value={studyInput}
              onChangeText={setStudyInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => sendStudyMessage(studyInput)}
            />
            <TouchableOpacity onPress={() => sendStudyMessage(studyInput)} disabled={studyLoading || !studyInput.trim()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: studyLoading || !studyInput.trim() ? hostColor + '33' : hostColor, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: studyLoading || !studyInput.trim() ? SOL_THEME.textMuted : '#000', fontSize: 16, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {unlockBanner && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: SOL_THEME.background + 'F0', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ width: '100%', borderRadius: 20, borderWidth: 1.5, borderColor: unlockBanner === 'adept' ? '#9B59B6' : SOL_THEME.primary, backgroundColor: SOL_THEME.surface, padding: 28, alignItems: 'center' }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>{unlockBanner === 'adept' ? '✦' : '⊚'}</Text>
              <Text style={{ color: unlockBanner === 'adept' ? '#9B59B6' : SOL_THEME.primary, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>
                {unlockBanner === 'adept' ? 'ADEPT MODE UNLOCKED' : 'SEEKER MODE UNLOCKED'}
              </Text>
              <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
                {unlockBanner === 'adept' ? 'The Full Protocol Opens' : 'The Mystery School Opens'}
              </Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                {unlockBanner === 'adept'
                  ? 'You have studied 25 subjects. Adept mode is now available — Sol speaks in full protocol, naming CASCADE layers and AURA invariants.'
                  : 'You have studied 5 subjects. Seeker mode is now available — Sol speaks in the full mystical register of the framework.'}
              </Text>
              <TouchableOpacity
                onPress={async () => { await setMode(unlockBanner); setUnlockBanner(null); }}
                style={{ width: '100%', paddingVertical: 13, borderRadius: 12, backgroundColor: unlockBanner === 'adept' ? '#9B59B6' : SOL_THEME.primary, alignItems: 'center', marginBottom: 10 }}
              >
                <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
                  {unlockBanner === 'adept' ? 'Enter Adept Mode' : 'Enter Seeker Mode'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUnlockBanner(null)}
                style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, fontWeight: '600' }}>Stay in Current Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showSessionComplete && (() => {
          const domainColor = activeStudyDomain?.color || hostColor;
          const domainGlyph = activeStudyDomain?.glyph || hostGlyph;
          const closingLines: Record<string, string> = {
            sol: 'The forge stays lit. Return when the heat rises.',
            veyra: 'Session logged. The architecture holds.',
            'aura-prime': 'Truth was touched. The invariant stands.',
            headmaster: 'The lesson ends here. The knowledge does not.',
          };
          const closingLine = closingLines[studyHost] || closingLines['sol'];
          const remaining = activeStudyDomain
            ? activeStudyDomain.subjects.filter(s => !studiedSubjects.has(s.name) && s.name !== activeStudySubject?.name).length
            : 0;
          return (
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: domainColor + '18', justifyContent: 'center', alignItems: 'center', padding: 24, opacity: sessionCompleteAnim }}>
              <View style={{ width: '100%', borderRadius: 20, borderWidth: 1, borderColor: domainColor + '55', backgroundColor: SOL_THEME.surface, padding: 28, alignItems: 'center' }}>
                {/* Domain glyph — large */}
                <Text style={{ color: domainColor, fontSize: 64, marginBottom: 8, lineHeight: 72 }}>{domainGlyph}</Text>
                <Text style={{ color: domainColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>SESSION RECORDED</Text>

                {/* Subject name */}
                <Text style={{ color: SOL_THEME.text, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4, letterSpacing: 0.3 }}>{activeStudySubject?.name}</Text>

                {/* Meta row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Text style={{ color: domainColor, fontSize: 12, fontWeight: '700' }}>{hostName}</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>·</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: LAYER_COLORS[activeStudySubject?.layer || 'FOUNDATION'] + '22' }}>
                    <Text style={{ color: LAYER_COLORS[activeStudySubject?.layer || 'FOUNDATION'], fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[activeStudySubject?.layer || 'FOUNDATION']}</Text>
                  </View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>·</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>{subjectSessionCounts[activeStudySubject?.name || ''] || 1}× studied</Text>
                </View>

                {/* Teacher closing line */}
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginBottom: 8, lineHeight: 19, paddingHorizontal: 8 }}>{closingLine}</Text>

                {/* Cross-domain whisper */}
                {sessionWhisper && (
                  <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: domainColor + '22', paddingTop: 12, marginTop: 4, marginBottom: 8 }}>
                    <Text style={{ color: domainColor + 'AA', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 4 }}>◦ SOL WHISPERS</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 4 }}>{sessionWhisper}</Text>
                  </View>
                )}

                {/* Domain remaining note */}
                {activeStudyDomain && (
                  <Text style={{ color: domainColor + 'AA', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
                    {activeStudyDomain.label} · {remaining > 0 ? `${remaining} subjects remaining` : 'all subjects studied'}
                  </Text>
                )}

                <View style={{ width: '100%', height: 1, backgroundColor: domainColor + '22', marginVertical: 20 }} />

                {/* Buttons */}
                <TouchableOpacity onPress={() => dismissSessionComplete(true)}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, backgroundColor: domainColor, alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>Explore {activeStudyDomain?.label || 'Domain'} →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={shareLoading}
                  onPress={async () => {
                    setShareLoading(true);
                    try {
                      const ViewShot = await import('react-native-view-shot').then(m => m.default).catch(() => null);
                      const Sharing = await import('expo-sharing').catch(() => null);
                      if (ViewShot && shareCardRef.current && Sharing) {
                        const uri = await ViewShot.captureRef(shareCardRef.current, { format: 'png', quality: 1, result: 'tmpfile' });
                        const canShare = await Sharing.isAvailableAsync();
                        if (canShare) { await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your dive' }); setShareLoading(false); return; }
                      }
                    } catch {}
                    // Text fallback
                    const lastAI = [...studyMessages].reverse().find(m => m.role === 'assistant');
                    const excerpt = lastAI ? lastAI.content.slice(0, 140).trim() + (lastAI.content.length > 140 ? '…' : '') : '';
                    const text = [
                      `${domainGlyph} ${activeStudySubject?.name}`,
                      `${hostName} · ${LAYER_LABELS[activeStudySubject?.layer || 'FOUNDATION']} · Session ${subjectSessionCounts[activeStudySubject?.name || ''] || 1}`,
                      sessionWhisper ? `\n◦ ${sessionWhisper}` : '',
                      excerpt ? `\n"${excerpt}"` : '',
                      `\nSol Mystery School ⊚`,
                    ].filter(Boolean).join('\n');
                    Share.share({ message: text });
                    setShareLoading(false);
                  }}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '44', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: domainColor, fontSize: 14, fontWeight: '600' }}>{shareLoading ? '…' : '✦ Share this Session'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const subject = activeStudySubject;
                    const domain = activeStudyDomain;
                    dismissSessionComplete(false);
                    if (subject) setTimeout(() => enterStudySession(subject, domain), 350);
                  }}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '66', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: domainColor, fontSize: 14, fontWeight: '600' }}>↺ Study Again</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => dismissSessionComplete(false)}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, fontWeight: '600' }}>Return to School</Text>
                </TouchableOpacity>
              </View>

              {/* Off-screen share card for ViewShot capture */}
              <View style={{ position: 'absolute', top: -2000, left: 0, opacity: 0 }} pointerEvents="none">
                <DiveShareCard
                  ref={shareCardRef}
                  glyph={domainGlyph}
                  domainColor={domainColor}
                  domainLabel={activeStudyDomain?.label || ''}
                  subjectName={activeStudySubject?.name || ''}
                  teacherName={hostName}
                  layerLabel={LAYER_LABELS[activeStudySubject?.layer || 'FOUNDATION']}
                  sessionCount={subjectSessionCounts[activeStudySubject?.name || ''] || 1}
                  durationSec={focusSeconds}
                  whisper={sessionWhisper}
                />
              </View>
            </Animated.View>
          );
        })()}
      </SafeAreaView>
    );
  }

  // ─── RENDER: Subject Detail ────────────────────────────────────────────────

  if (schoolView === 'subject' && activeSubjectDetail) {
    const subjectDomain = selectedDomain || MYSTERY_SCHOOL_DOMAINS.find(d => d.subjects.some(s => s.name === activeSubjectDetail.name)) || null;
    const domainColor = subjectDomain?.color || SOL_THEME.primary;
    const host = getDailyHost(activeSubjectDetail.name);
    const sessionCount = subjectSessionCounts[activeSubjectDetail.name] || 0;
    const lastStudied = studyDates[activeSubjectDetail.name];
    const daysAgo = lastStudied ? Math.floor((Date.now() - new Date(lastStudied).getTime()) / 86400000) : null;
    const note = subjectNotes[activeSubjectDetail.name] || '';
    const related = subjectDomain
      ? subjectDomain.subjects.filter(s => s.name !== activeSubjectDetail.name && s.layer === activeSubjectDetail.layer && !studiedSubjects.has(s.name)).slice(0, 3)
      : [];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
        {/* Header */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: domainColor + '33', backgroundColor: SOL_THEME.surface, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => setSchoolView('domain')} style={{ marginBottom: 10 }}>
            <Text style={{ color: domainColor, fontSize: 13, fontWeight: '700' }}>← {subjectDomain?.label || 'Domain'}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <Text style={{ color: domainColor, fontSize: 32 }}>{subjectDomain?.glyph || '◯'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 20, fontWeight: '700', lineHeight: 26, letterSpacing: 0.2 }}>{activeSubjectDetail.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: LAYER_COLORS[activeSubjectDetail.layer] + '33' }}>
                  <Text style={{ color: LAYER_COLORS[activeSubjectDetail.layer], fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{LAYER_LABELS[activeSubjectDetail.layer].toUpperCase()}</Text>
                </View>
                {activeSubjectDetail.traditions?.map(t => (
                  <View key={t} style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: domainColor + '18', borderWidth: 1, borderColor: domainColor + '44' }}>
                    <Text style={{ color: domainColor, fontSize: 10 }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
          {/* Description */}
          <View style={{ padding: 16, borderRadius: 12, backgroundColor: domainColor + '0A', borderWidth: 1, borderColor: domainColor + '33' }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22 }}>{activeSubjectDetail.description}</Text>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
              <Text style={{ color: domainColor, fontSize: 22, fontWeight: '700' }}>{sessionCount}</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>sessions</Text>
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
              <Text style={{ color: studiedSubjects.has(activeSubjectDetail.name) ? '#4CAF50' : SOL_THEME.textMuted, fontSize: 22, fontWeight: '700' }}>
                {studiedSubjects.has(activeSubjectDetail.name) ? '✓' : '—'}
              </Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>{daysAgo !== null ? daysAgo === 0 ? 'today' : `${daysAgo}d ago` : 'not yet'}</Text>
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
              <Text style={{ color: domainColor, fontSize: 22 }}>{HOST_GLYPHS[host]}</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>{HOST_NAMES[host]}</Text>
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>✎ YOUR NOTE</Text>
            <TouchableOpacity
              onPress={() => {
                if (Alert.prompt) {
                  Alert.prompt('Subject Note', `Note for "${activeSubjectDetail.name}"`, async (text) => {
                    if (text === null) return;
                    const updated = { ...subjectNotes, [activeSubjectDetail.name]: text };
                    setSubjectNotes(updated);
                    await AsyncStorage.setItem('sol_subject_notes', JSON.stringify(updated));
                  }, 'plain-text', note);
                } else {
                  setTextPromptValue(note);
                  setTextPrompt({
                    title: `Note — ${activeSubjectDetail.name}`,
                    placeholder: 'Your note...',
                    current: note,
                    onSubmit: async (text) => {
                      const updated = { ...subjectNotes, [activeSubjectDetail.name]: text };
                      setSubjectNotes(updated);
                      await AsyncStorage.setItem('sol_subject_notes', JSON.stringify(updated));
                    },
                  });
                }
              }}
              style={{ padding: 14, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: note ? domainColor + '44' : SOL_THEME.border, minHeight: 64 }}
              activeOpacity={0.7}
            >
              {note
                ? <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{note}</Text>
                : <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>Tap to add a note…</Text>
              }
              <Text style={{ color: domainColor, fontSize: 10, marginTop: 8, fontWeight: '700' }}>{note ? '✎ Edit' : '✎ Add note'}</Text>
            </TouchableOpacity>
          </View>

          {/* Related subjects */}
          {related.length > 0 && (
            <View>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>◌ EXPLORE NEXT</Text>
              {related.map(s => (
                <TouchableOpacity key={s.name} onPress={() => { setActiveSubjectDetail(s); }}
                  style={{ padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{s.name}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{s.description}</Text>
                  </View>
                  <Text style={{ color: domainColor, fontSize: 14 }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action bar */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: domainColor + '33', backgroundColor: SOL_THEME.surface, gap: 10 }}>
          {/* Teacher picker */}
          <View>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>CHOOSE TEACHER</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {HOST_PERSONAS.map(p => {
                const effectiveHost = selectedTeacher || host;
                const isSelected = p === effectiveHost;
                const isDaily = p === host && !selectedTeacher;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setSelectedTeacher(p === host ? null : p)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 2,
                      backgroundColor: isSelected ? TEACHER_COLORS[p] + '22' : SOL_THEME.background,
                      borderWidth: 1, borderColor: isSelected ? TEACHER_COLORS[p] : SOL_THEME.border }}
                    activeOpacity={0.7}>
                    <Text style={{ fontSize: 16, color: TEACHER_COLORS[p] }}>{HOST_GLYPHS[p]}</Text>
                    <Text style={{ color: isSelected ? TEACHER_COLORS[p] : SOL_THEME.textMuted, fontSize: 9, fontWeight: '700' }}>{HOST_NAMES[p].toUpperCase()}</Text>
                    {isDaily && <Text style={{ color: TEACHER_COLORS[p] + '99', fontSize: 8 }}>today</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {/* Dive depth toggle */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['quick', 'full'] as const).map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => setDiveDepth(d)}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1.5,
                  borderColor: diveDepth === d ? domainColor : SOL_THEME.border,
                  backgroundColor: diveDepth === d ? domainColor + '18' : 'transparent' }}
                activeOpacity={0.7}>
                <Text style={{ color: diveDepth === d ? domainColor : SOL_THEME.textMuted, fontSize: 12, fontWeight: '700' }}>
                  {d === 'quick' ? '⚡ Quick · 15 min' : '⊚ Full Session'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => {
              if (subjectDomain) setBreathPending({ subject: activeSubjectDetail, domain: subjectDomain, host: selectedTeacher || host, depth: diveDepth });
            }}
            style={{ paddingVertical: 14, borderRadius: 12, backgroundColor: domainColor, alignItems: 'center' }}
            activeOpacity={0.8}>
            <Text style={{ color: '#000', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>{HOST_GLYPHS[selectedTeacher || host]} Study with {HOST_NAMES[selectedTeacher || host]}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              await savePersona('headmaster');
              await savePendingSubject(`PARADOX DETECTED: What is the deepest truth about ${activeSubjectDetail.name}? Go beyond the surface — what do the traditions reveal that isn't spoken directly?`);
              router.push('/(tabs)/');
            }}
            style={{ paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '44', alignItems: 'center' }}
            activeOpacity={0.7}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontWeight: '600' }}>⬇ Deepen in Sol</Text>
          </TouchableOpacity>

          {/* Vigil button */}
          {vigil?.subjectName === activeSubjectDetail.name ? (
            <View style={{ paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '66', alignItems: 'center', backgroundColor: domainColor + '0C' }}>
              <Text style={{ color: domainColor, fontSize: 13, fontWeight: '700' }}>
                ◎ Vigil active · {7 - Math.floor((Date.now() - new Date(vigil.startDate).getTime()) / 86400000)} days remaining
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={async () => {
                const v = { subjectName: activeSubjectDetail.name, domainColor, domainGlyph: subjectDomain?.glyph || '⊚', startDate: new Date().toISOString().split('T')[0], daysCompleted: 0 };
                await AsyncStorage.setItem('sol_vigil', JSON.stringify(v));
                setVigil(v);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={{ paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '33', alignItems: 'center' }}
              activeOpacity={0.7}>
              <Text style={{ color: domainColor + 'AA', fontSize: 13, fontWeight: '600' }}>◎ Hold Vigil — 7 days with this subject</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── RENDER: Shared shell (home / domain / curriculum / notes) ─────────────

  const totalSubjects = MYSTERY_SCHOOL_DOMAINS.reduce((acc, d) => acc + d.subjects.length, 0);
  const totalStudied = MYSTERY_SCHOOL_DOMAINS.reduce((acc, d) => acc + d.subjects.filter(s => studiedSubjects.has(s.name)).length, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>

        {/* ── HOME ─────────────────────────────────────────────────────────── */}
        {schoolView === 'home' && (
          <>
            {/* Header */}
            <View style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 8 }}>
              <Text style={{ fontSize: 36, color: SOL_THEME.headmaster, marginBottom: 8 }}>𝔏</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: SOL_THEME.headmaster, letterSpacing: 3, marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{t('MYSTERY SCHOOL')}</Text>
              {/* Progress arc */}
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 4 }}>{totalStudied}/{totalSubjects} subjects explored</Text>
              <View style={{ width: 200, height: 4, backgroundColor: SOL_THEME.border, borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                <View style={{ height: 4, width: `${Math.round((totalStudied / totalSubjects) * 100)}%`, backgroundColor: SOL_THEME.headmaster, borderRadius: 2 }} />
              </View>
              {studyStreak >= 1 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#E0704015', borderWidth: 1, borderColor: '#E0704033' }}>
                  <Text style={{ fontSize: 14 }}>🔥</Text>
                  <Text style={{ color: '#E07040', fontSize: 12, fontWeight: '700' }}>{studyStreak} day{studyStreak !== 1 ? 's' : ''} in a row</Text>
                </View>
              )}
              {fallowReturn && (
                <View style={{ marginTop: 14, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.headmaster + '33', backgroundColor: SOL_THEME.headmaster + '0A', maxWidth: 280 }}>
                  <Text style={{ color: SOL_THEME.headmaster, fontSize: 12, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' }}>
                    The School kept your place. Fields rest; so do minds.
                  </Text>
                  <TouchableOpacity onPress={() => setFallowReturn(false)} style={{ marginTop: 6, alignItems: 'center' }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>✕ dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quick nav */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setSchoolView('curriculum')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.primary + '55', backgroundColor: SOL_THEME.primary + '0E', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 16 }}>📋</Text>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontWeight: '700' }}>Curriculum</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSchoolView('notes')}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.primary + '55', backgroundColor: SOL_THEME.primary + '0E', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 16 }}>✎</Text>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontWeight: '700' }}>Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const allSubjects = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.map(s => ({ subject: s, domain: d })));
                  const unstudied = allSubjects.filter(({ subject }) => !studiedSubjects.has(subject.name));
                  const pool = unstudied.length > 0 ? unstudied : allSubjects;
                  const pick = pool[Math.floor(Math.random() * pool.length)];
                  if (pick) { setSelectedDomain(pick.domain); await openSubjectDetail(pick.subject, pick.domain); }
                }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '0E', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 16 }}>🎲</Text>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 11, fontWeight: '700' }}>Random</Text>
              </TouchableOpacity>
            </View>

            {/* Night Ledger ambient banner — midnight to 4am */}
            {(() => {
              const h = new Date().getHours();
              if (h < 0 || h >= 4) return null;
              return (
                <View style={{ marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFFFFF11', backgroundColor: '#07070D' }}>
                  <Text style={{ color: '#FFFFFF44', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2.5, fontWeight: '700', marginBottom: 6 }}>◎ NIGHT LEDGER</Text>
                  <Text style={{ color: '#FFFFFF55', fontSize: 12, fontStyle: 'italic', lineHeight: 18 }}>
                    The school is quietest now. What you study here is recorded in the Night Ledger — a separate thread in your Chronicle.
                  </Text>
                </View>
              );
            })()}

            {/* Vigil banner */}
            {vigil && (() => {
              const daysLeft = 7 - Math.floor((Date.now() - new Date(vigil.startDate).getTime()) / 86400000);
              const progress = (7 - daysLeft) / 7;
              return (
                <TouchableOpacity
                  onPress={async () => {
                    const domain = MYSTERY_SCHOOL_DOMAINS.find(d => d.subjects.some(s => s.name === vigil.subjectName)) || null;
                    const subject = domain?.subjects.find(s => s.name === vigil.subjectName) || null;
                    if (subject && domain) { setSelectedDomain(domain); openSubjectDetail(subject, domain); }
                  }}
                  style={{ marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: vigil.domainColor + '55', backgroundColor: vigil.domainColor + '0C' }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Text style={{ color: vigil.domainColor, fontSize: 22 }}>{vigil.domainGlyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: vigil.domainColor, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 2 }}>◎ VIGIL</Text>
                      <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{vigil.subjectName}</Text>
                    </View>
                    <Text style={{ color: vigil.domainColor, fontSize: 12, fontWeight: '700' }}>{daysLeft}d left</Text>
                  </View>
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: vigil.domainColor + '22', overflow: 'hidden' }}>
                    <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: vigil.domainColor + 'BB', borderRadius: 2 }} />
                  </View>
                </TouchableOpacity>
              );
            })()}

            {/* Recent Dives */}
            {diveLog.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <TouchableOpacity onPress={() => setSchoolView('dive-log')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700' }}>⊚ RECENT DIVES</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, opacity: 0.6 }}>See all {diveLog.length} →</Text>
                </TouchableOpacity>
                <View style={{ gap: 6 }}>
                  {diveLog.slice(0, 3).map(d => (
                    <TouchableOpacity key={d.id}
                      onPress={async () => {
                        const domain = MYSTERY_SCHOOL_DOMAINS.find(dom => dom.label === d.domainLabel) || null;
                        const subject = domain?.subjects.find(s => s.name === d.subjectName)
                          || customSubjects.find(s => s.name === d.subjectName)
                          || (d.domainLabel === 'Open Seat' ? { name: d.subjectName, domain: 'Open Seat', layer: d.layer, description: `A free-form study session on "${d.subjectName}".` } as Subject : null);
                        if (!subject) return;
                        if (domain) setSelectedDomain(domain);
                        if (d.domainLabel !== 'Open Seat') await openSubjectDetail(subject, domain);
                        else enterStudySession(subject, null);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, backgroundColor: d.domainColor + '0D', borderWidth: 1, borderColor: d.domainColor + '33' }}
                      activeOpacity={0.7}>
                      <Text style={{ color: d.domainColor, fontSize: 20 }}>{d.domainGlyph}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{d.subjectName}</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 1 }}>{d.domainLabel} · {TEACHER_NAMES[d.teacher] || d.teacher} · {d.date}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: LAYER_COLORS[d.layer] + '22' }}>
                        <Text style={{ color: LAYER_COLORS[d.layer], fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[d.layer]}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Title + Field stage banner */}
            {diveLog.length > 0 && (() => {
              const titleData = getDiveTitle(diveLog.length);
              return (
                <View style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: titleData.color + '44', backgroundColor: titleData.color + '0C' }}>
                  <Text style={{ color: titleData.color, fontSize: 28, lineHeight: 34 }}>{titleData.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: titleData.color, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>{titleData.title}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>
                      {diveLog.length} {diveLog.length === 1 ? 'dive' : 'dives'}{titleData.next ? ` · ${titleData.next.remaining} until ${titleData.next.title}` : ' · You are at the frontier.'}
                    </Text>
                  </View>
                  {fieldStage && (
                    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: SOL_THEME.primary + '18', borderWidth: 1, borderColor: SOL_THEME.primary + '33' }}>
                      <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.8 }}>{fieldStage}</Text>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* Empty state — brand new user */}
            {totalStudied === 0 && (
              <View style={{ marginBottom: 14, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '08', alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 28, marginBottom: 8 }}>𝔏</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 15, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>
                  {'The school is open.'}
                </Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: dailySuggestion ? 14 : 0 }}>
                  {'Choose a domain and the Headmaster guides you through it. Begin with Foundation — or let the field choose.'}
                </Text>
                {dailySuggestion && (
                  <TouchableOpacity
                    onPress={async () => { setSelectedDomain(dailySuggestion.domain); await openSubjectDetail(dailySuggestion.subject, dailySuggestion.domain); }}
                    style={{ width: '100%', padding: 12, borderRadius: 10, backgroundColor: dailySuggestion.domain.color + '18', borderWidth: 1, borderColor: dailySuggestion.domain.color + '44', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: dailySuggestion.domain.color, fontSize: 22 }}>{dailySuggestion.domain.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 }}>START HERE TODAY</Text>
                      <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{dailySuggestion.subject.name}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{t(dailySuggestion.domain.label)}</Text>
                    </View>
                    <Text style={{ color: dailySuggestion.domain.color, fontSize: 14 }}>→</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Daily suggestion — returning user */}
            {totalStudied > 0 && dailySuggestion && (
              <TouchableOpacity
                onPress={async () => { setSelectedDomain(dailySuggestion.domain); await openSubjectDetail(dailySuggestion.subject, dailySuggestion.domain); }}
                style={{ marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: dailySuggestion.domain.color + '44', backgroundColor: dailySuggestion.domain.color + '0D', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                activeOpacity={0.8}
              >
                <Text style={{ color: dailySuggestion.domain.color, fontSize: 20 }}>{dailySuggestion.domain.glyph}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 }}>
                    {"⊙ TODAY'S SUBJECT"}
                  </Text>
                  <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{dailySuggestion.subject.name}</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{t(dailySuggestion.domain.label)} · {t(LAYER_LABELS[dailySuggestion.subject.layer])}</Text>
                </View>
                <Text style={{ color: dailySuggestion.domain.color + '99', fontSize: 14 }}>→</Text>
              </TouchableOpacity>
            )}

            {/* School Intelligence — "The school watches you" */}
            {schoolNotice && schoolNotice.subjects.length > 0 && (
              <View style={{ marginBottom: 14, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44', backgroundColor: SOL_THEME.headmaster + '08' }}>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>
                  {schoolNotice.type === 'avoidance' ? '⊙ THE SCHOOL NOTICES' :
                   schoolNotice.type === 'cluster' ? '⊙ THE SCHOOL NOTICES' :
                   schoolNotice.type === 'gap' ? '⊙ STRUCTURAL GAP DETECTED' :
                   schoolNotice.type === 'ready' ? '⊙ YOU ARE READY' :
                   '⊙ RECOMMENDED FOR YOU NOW'}
                </Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>{schoolNotice.message}</Text>
                <View style={{ gap: 8 }}>
                  {schoolNotice.subjects.map(({ subject, domain }) => (
                    <TouchableOpacity
                      key={subject.name}
                      onPress={async () => { setSelectedDomain(domain); await openSubjectDetail(subject, domain); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, backgroundColor: domain.color + '12', borderWidth: 1, borderColor: domain.color + '33' }}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: domain.color, fontSize: 18 }}>{domain.glyph}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '600' }}>{subject.name}</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{domain.label} · {LAYER_LABELS[subject.layer]}</Text>
                      </View>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Active field trial */}
            {activeFieldTrial && !activeFieldTrial.completed && (
              <TouchableOpacity
                style={{ marginBottom: 14, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: SOL_THEME.primary + '88', backgroundColor: SOL_THEME.primary + '0E' }}
                onPress={() => Alert.alert('⚡ FIELD TRIAL', activeFieldTrial.prompt, [
                  { text: 'Not Now', style: 'cancel' },
                  { text: '⊚ Take It to Sol', onPress: async () => {
                    await savePersona('sol');
                    await savePendingSubject(`FIELD TRIAL: ${activeFieldTrial.prompt}`);
                    const trials = await getFieldTrials();
                    const updated = trials.map((t: any) => t.id === activeFieldTrial.id ? { ...t, completed: true } : t);
                    await saveFieldTrials(updated);
                    setActiveFieldTrial(null);
                    router.push('/(tabs)/');
                  }},
                ])}
                activeOpacity={0.8}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>⚡ FIELD TRIAL UNLOCKED</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }} numberOfLines={3}>{activeFieldTrial.prompt}</Text>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, marginTop: 8, fontWeight: '700' }}>Tap to engage →</Text>
              </TouchableOpacity>
            )}

            {/* Milestone moment */}
            {shownMilestone && (
              <TouchableOpacity onPress={() => setShownMilestone(null)}
                style={{ marginBottom: 14, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: SOL_THEME.headmaster, backgroundColor: SOL_THEME.headmaster + '12', alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 28, marginBottom: 6 }}>✦</Text>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, marginBottom: 4 }}>
                  {shownMilestone} SUBJECTS EXPLORED
                </Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  {shownMilestone === 10 ? 'The field has taken root.' :
                   shownMilestone === 25 ? 'A quarter of the school is yours.' :
                   shownMilestone === 50 ? 'The halfway mark. The field knows you.' :
                   shownMilestone === 100 ? 'One hundred subjects. The school bows.' :
                   'All 192 subjects. You are the school now.'}
                </Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 8 }}>Tap to dismiss</Text>
              </TouchableOpacity>
            )}

            {/* Open Seat */}
            <View style={{ marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '08' }}>
              <Text style={{ color: SOL_THEME.headmaster, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>⊙ OPEN SEAT — STUDY ANYTHING</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44', paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 }}
                  placeholder="Any topic, tradition, question..."
                  placeholderTextColor={SOL_THEME.textMuted}
                  value={openSeatTopic}
                  onChangeText={setOpenSeatTopic}
                  onSubmitEditing={enterOpenSeat}
                  returnKeyType="go"
                />
                <TouchableOpacity onPress={enterOpenSeat} disabled={!openSeatTopic.trim()}
                  style={{ paddingHorizontal: 14, borderRadius: 10, backgroundColor: openSeatTopic.trim() ? SOL_THEME.headmaster : SOL_THEME.headmaster + '33', justifyContent: 'center' }}>
                  <Text style={{ color: openSeatTopic.trim() ? '#000' : SOL_THEME.textMuted, fontSize: 14, fontWeight: '700' }}>⊙</Text>
                </TouchableOpacity>
              </View>
              {customSubjects.length === 0 && (
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18, fontStyle: 'italic' }}>
                  The seat is open. Name anything you're curious about — the school has no walls here.
                </Text>
              )}
              {customSubjects.length > 0 && (
                <View style={{ marginTop: 12, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700' }}>PREVIOUS OPEN SEATS</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 9 }}>{customSubjects.length} saved</Text>
                  </View>
                  {customSubjects.slice(0, 8).map(s => {
                    const count = subjectSessionCounts[s.name] || 0;
                    const lastDate = studyDates[s.name];
                    const daysAgo = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : null;
                    return (
                      <TouchableOpacity key={s.name} onPress={() => enterStudySession(s, null)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 9, backgroundColor: SOL_THEME.background, borderWidth: 1, borderColor: SOL_THEME.headmaster + '33' }}
                        activeOpacity={0.7}>
                        <Text style={{ color: SOL_THEME.headmaster, fontSize: 16 }}>⊙</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{s.name}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 1 }}>
                            {count > 0 ? `${count} session${count !== 1 ? 's' : ''}` : 'not yet studied'}
                            {daysAgo !== null ? ` · ${daysAgo === 0 ? 'today' : `${daysAgo}d ago`}` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={(e) => { e.stopPropagation?.(); deleteCustomSubject(s.name); }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={{ padding: 4 }}>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Pattern notice — Sol-voiced pattern banner, dismissible, max once/week */}
            {patternNotice && (
              <View style={{ marginBottom: 14, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.primary + '55', backgroundColor: SOL_THEME.primary + '08' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 18 }}>◑</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 4 }}>SOL NOTICES A PATTERN</Text>
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{patternNotice}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      setPatternNotice(null);
                      await AsyncStorage.setItem('sol_pattern_dismissed', new Date().toISOString().split('T')[0]);
                    }}
                    style={{ padding: 4 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Weekly Synthesis letter — collapsible */}
            {weeklyDiveLetter && (() => {
              const [expanded, setExpanded] = React.useState(false);
              return (
                <TouchableOpacity
                  onPress={() => setExpanded(e => !e)}
                  style={{ marginBottom: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '08', overflow: 'hidden' }}
                  activeOpacity={0.85}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                    <Text style={{ color: SOL_THEME.headmaster, fontSize: 18 }}>✉</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: SOL_THEME.headmaster, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 2 }}>WEEKLY SYNTHESIS</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>Week of {weeklyDiveLetter.weekOf}</Text>
                    </View>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>{expanded ? '▲' : '▼'}</Text>
                  </View>
                  {expanded && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: SOL_THEME.headmaster + '22' }}>
                      <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 22, marginTop: 12, fontStyle: 'italic' }}>{weeklyDiveLetter.text}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })()}

            {/* Global search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, paddingHorizontal: 12, marginBottom: 14, gap: 8 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>⌕</Text>
              <TextInput
                style={{ flex: 1, color: SOL_THEME.text, fontSize: 13, paddingVertical: 9 }}
                placeholder={`Search all ${MYSTERY_SCHOOL_DOMAINS.reduce((n, d) => n + d.subjects.length, 0)} subjects...`}
                placeholderTextColor={SOL_THEME.textMuted}
                value={globalSearch}
                onChangeText={setGlobalSearch}
                autoCapitalize="none"
              />
              {globalSearch.length > 0 && <TouchableOpacity onPress={() => setGlobalSearch('')}><Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text></TouchableOpacity>}
            </View>
            {globalSearch.length > 0 && (() => {
              const q = globalSearch.toLowerCase();
              const results: { subject: Subject; domain: SubjectDomain }[] = [];
              MYSTERY_SCHOOL_DOMAINS.forEach(d => d.subjects.forEach(s => {
                if (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.traditions?.some(t => t.toLowerCase().includes(q))) {
                  results.push({ subject: s, domain: d });
                }
              }));
              if (results.length === 0) return (
                <View style={{ marginBottom: 14, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>"{globalSearch}" isn't in the school yet — but the school can grow.</Text>
                  <TouchableOpacity onPress={() => { setOpenSeatTopic(globalSearch); setGlobalSearch(''); }} style={{ marginTop: 8 }}>
                    <Text style={{ color: SOL_THEME.headmaster, fontSize: 12, fontWeight: '700' }}>⊙ Study this with Open Seat →</Text>
                  </TouchableOpacity>
                </View>
              );
              return (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, fontWeight: '700', marginBottom: 8 }}>{results.length} RESULTS</Text>
                  {results.slice(0, 12).map(({ subject, domain }) => (
                    <TouchableOpacity key={subject.name} onPress={() => { setSelectedDomain(domain); openSubjectDetail(subject, domain); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: domain.color + '44', marginBottom: 6 }}
                      activeOpacity={0.75}>
                      <Text style={{ color: domain.color, fontSize: 20 }}>{domain.glyph}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{subject.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={{ color: domain.color, fontSize: 10 }}>{t(domain.label)}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                          <Text style={{ color: LAYER_COLORS[subject.layer], fontSize: 10 }}>{t(LAYER_LABELS[subject.layer])}</Text>
                          {studiedSubjects.has(subject.name) && <Text style={{ color: '#4CAF50', fontSize: 10 }}>· ✓</Text>}
                        </View>
                      </View>
                      <Text style={{ color: domain.color + '99', fontSize: 13 }}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}

            {/* Resonance links — always visible in Adept mode */}
            {(resonanceLinks.length > 0 || mode === 'adept') && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 8, fontWeight: '700' }}>
                  {mode === 'adept' ? '⟁ AURA RESONANCE LINKS' : '⟁ RESONANCE LINKS'}
                </Text>
                {resonanceLinks.length === 0 && mode === 'adept' && (
                  <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }}>Study more subjects to activate cross-domain resonance detection. The AURA engine maps connections as your field grows.</Text>
                  </View>
                )}
                {resonanceLinks.map(({ domain, reason }) => (
                  <TouchableOpacity key={domain.id}
                    style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '55', backgroundColor: domain.color + '0D', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    onPress={() => { setSelectedDomain(domain); setSchoolView('domain'); }} activeOpacity={0.75}>
                    <Text style={{ color: domain.color, fontSize: 18 }}>{domain.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: domain.color, fontSize: 11, fontWeight: '700', marginBottom: 2 }}>{t(domain.label)}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}>{reason}</Text>
                    </View>
                    <Text style={{ color: domain.color + '99', fontSize: 14 }}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Domain grid */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700' }}>◬ DOMAINS</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['all', 'contemplative', 'secular'] as const).map(f => (
                  <TouchableOpacity key={f} onPress={() => setDomainFilter(f)}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: domainFilter === f ? SOL_THEME.primary : SOL_THEME.surface, borderWidth: 1, borderColor: domainFilter === f ? SOL_THEME.primary : SOL_THEME.border }}>
                    <Text style={{ color: domainFilter === f ? '#000' : SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                      {f === 'all' ? 'ALL' : f === 'contemplative' ? 'INNER' : 'OUTER'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {MYSTERY_SCHOOL_DOMAINS.filter(d =>
                domainFilter === 'all' ? true :
                domainFilter === 'secular' ? d.category === 'secular' :
                d.category !== 'secular'
              ).map((domain) => {
                const idx = MYSTERY_SCHOOL_DOMAINS.indexOf(domain);
                const studiedCount = domain.subjects.filter(s => studiedSubjects.has(s.name)).length;
                const total = domain.subjects.length;
                const pct = total > 0 ? studiedCount / total : 0;
                const mastered = studiedCount === total && total > 0;
                const bloomBadge = mastered ? '✦' : pct >= 0.6 ? '●' : pct >= 0.4 ? '◌' : pct >= 0.2 ? '◦' : '';
                return (
                  <Animated.View key={domain.id} style={{ width: '48%', opacity: cardAnims[idx], transform: [{ translateY: cardAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
                    <TouchableOpacity
                      style={{ backgroundColor: SOL_THEME.surface, borderRadius: 12, borderWidth: 1, borderColor: mastered ? domain.color : domain.color + '55', padding: 12, minHeight: 110 }}
                      onPress={() => { setSelectedDomain(domain); setSchoolView('domain'); }}
                      activeOpacity={0.7}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: domain.color, fontSize: 26 }}>{domain.glyph}</Text>
                        {bloomBadge ? <Text style={{ color: mastered ? domain.color : domain.color + 'AA', fontSize: 11 }}>{bloomBadge}</Text> : null}
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: domain.color, marginBottom: 2 }} numberOfLines={2}>{t(domain.label)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontSize: 10, color: SOL_THEME.textMuted }}>
                          {studiedCount > 0 ? `${studiedCount}/${total} explored` : `${total} subjects`}
                        </Text>
                        {studiedCount > 0 && <Text style={{ fontSize: 10, color: domain.color + 'AA', fontWeight: '700' }}>{Math.round(pct * 100)}%</Text>}
                      </View>
                      <View style={{ height: 3, backgroundColor: SOL_THEME.border, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ height: 3, width: `${Math.round(pct * 100)}%`, backgroundColor: domain.color, borderRadius: 2, opacity: mastered ? 1 : 0.75 }} />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            <View style={{ marginTop: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: SOL_THEME.border, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: SOL_THEME.textMuted, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' }}>
                {`The Mystery School is not a place you graduate from.\nIt is a way of seeing that, once learned, cannot be unlearned.`}
              </Text>
            </View>
          </>
        )}

        {/* ── DOMAIN ───────────────────────────────────────────────────────── */}
        {schoolView === 'domain' && selectedDomain && (() => {
          const domain = selectedDomain;
          const studiedInDomain = domain.subjects.filter(s => studiedSubjects.has(s.name)).length;
          const recommendedLayer = stageToLayer(fieldStage);
          const layerOrder: SchoolLayer[] = fieldStage
            ? [recommendedLayer, ...(['FOUNDATION', 'MIDDLE', 'EDGE'] as SchoolLayer[]).filter(l => l !== recommendedLayer)]
            : ['FOUNDATION', 'MIDDLE', 'EDGE'];
          return (
            <>
              <TouchableOpacity onPress={() => { setSelectedDomain(null); setSchoolView('home'); setSubjectSearch(''); }} style={{ paddingVertical: 10, marginBottom: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: domain.color }}>← All Domains</Text>
              </TouchableOpacity>

              {/* Domain header */}
              <View style={{ padding: 16, borderRadius: 14, backgroundColor: domain.color + '0D', borderWidth: 1, borderColor: domain.color + '44', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <Text style={{ color: domain.color, fontSize: 40 }}>{domain.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: domain.color, fontSize: 18, fontWeight: '700' }}>{t(domain.label)}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>{domain.subjects.length} subjects · {studiedInDomain} studied</Text>
                  </View>
                </View>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{domain.description}</Text>
                <View style={{ marginTop: 12, height: 5, backgroundColor: SOL_THEME.border, borderRadius: 3, overflow: 'hidden' }}>
                  <View style={{ height: 5, width: `${Math.round((studiedInDomain / domain.subjects.length) * 100)}%`, backgroundColor: domain.color, borderRadius: 3 }} />
                </View>
              </View>

              {/* Search */}
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

              {/* Layer sections */}
              {layerOrder.map(layer => {
                const q = subjectSearch.toLowerCase();
                const layerSubjectsRaw = domain.subjects.filter(s => s.layer === layer && (q === '' || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)));
                const layerSubjects = [...layerSubjectsRaw.filter(s => subjectFavorites.has(s.name)), ...layerSubjectsRaw.filter(s => !subjectFavorites.has(s.name))];
                if (layerSubjects.length === 0) return null;
                const isRecommended = fieldStage && layer === stageToLayer(fieldStage);
                const totalInLayer = domain.subjects.filter(s => s.layer === layer).length;
                const studiedInLayer = domain.subjects.filter(s => s.layer === layer && studiedSubjects.has(s.name)).length;
                return (
                  <View key={layer} style={{ marginBottom: 16 }}>
                    <View style={[{
                      alignSelf: 'stretch', borderWidth: isRecommended ? 1.5 : 1, borderRadius: 6,
                      paddingHorizontal: 14, paddingVertical: isRecommended ? 10 : 7, marginBottom: 8,
                      backgroundColor: isRecommended ? LAYER_COLORS[layer] + '30' : LAYER_COLORS[layer] + '14',
                      borderColor: isRecommended ? LAYER_COLORS[layer] + 'AA' : LAYER_COLORS[layer] + '44',
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: isRecommended ? 13 : 11, fontWeight: '700', letterSpacing: 1.5, color: LAYER_COLORS[layer], fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                          {mode === 'adept' ? `CASCADE · ${LAYER_LABELS[layer].toUpperCase()}` : LAYER_LABELS[layer].toUpperCase()}
                        </Text>
                        {isRecommended && (
                          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: LAYER_COLORS[layer] + '33' }}>
                            <Text style={{ color: LAYER_COLORS[layer], fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>⊚ YOUR STAGE</Text>
                          </View>
                        )}
                        {layer === 'EDGE' && !isSovereign && (
                          <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: '#F5A62322', borderWidth: 1, borderColor: '#F5A62355' }}>
                            <Text style={{ color: '#F5A623', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>⊚ SOVEREIGN</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: studiedInLayer === totalInLayer ? LAYER_COLORS[layer] : SOL_THEME.textMuted, fontSize: 11, fontWeight: studiedInLayer === totalInLayer ? '700' : '400' }}>
                        {studiedInLayer}/{totalInLayer}{studiedInLayer === totalInLayer ? ' ✦' : ''}
                      </Text>
                    </View>
                    {layerSubjects.map(subject => (
                      <TouchableOpacity
                        key={subject.name}
                        style={[{ backgroundColor: SOL_THEME.surface, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, borderLeftWidth: 3, borderLeftColor: domain.color, padding: 12, marginBottom: 8, gap: 4 }, studiedSubjects.has(subject.name) && { opacity: 0.75 }, subject.layer === 'EDGE' && !isSovereign && { opacity: 0.55 }]}
                        onPress={() => openSubjectDetail(subject, domain)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: SOL_THEME.text }}>{subject.name}</Text>
                          {studyDates[subject.name] && (() => {
                            const days = Math.floor((Date.now() - new Date(studyDates[subject.name]).getTime()) / 86400000);
                            return days > 0 ? <Text style={{ fontSize: 9, color: days > 7 ? '#E07040' : SOL_THEME.textMuted, marginTop: 3, marginRight: 4 }}>{days}d ago</Text> : null;
                          })()}
                          {studiedSubjects.has(subject.name) && <Text style={{ fontSize: 10, color: '#4CAF50', marginTop: 3, marginRight: 2 }}>✓</Text>}
                          {subjectNotes[subject.name] && <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, marginTop: 3, marginRight: 2 }}>✎</Text>}
                          <TouchableOpacity
                            onPress={async (e) => {
                              e.stopPropagation?.();
                              const updated = new Set(subjectFavorites);
                              if (updated.has(subject.name)) updated.delete(subject.name);
                              else updated.add(subject.name);
                              setSubjectFavorites(updated);
                              await AsyncStorage.setItem('sol_subject_favorites', JSON.stringify(Array.from(updated)));
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Text style={{ fontSize: 12, color: subjectFavorites.has(subject.name) ? '#F5A623' : SOL_THEME.border, marginTop: 2 }}>
                              {subjectFavorites.has(subject.name) ? '★' : '☆'}
                            </Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 10, color: LAYER_COLORS[subject.layer], marginTop: 3 }}>●</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18 }} numberOfLines={2}>{subject.description}</Text>
                        {subject.traditions && (
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {subject.traditions.map(t => (
                              <View key={t} style={{ borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderColor: domain.color + '55' }}>
                                <Text style={{ fontSize: 10, fontWeight: '600', color: domain.color }}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: subject.layer === 'EDGE' && !isSovereign ? '#F5A62318' : domain.color + '18', borderWidth: 1, borderColor: subject.layer === 'EDGE' && !isSovereign ? '#F5A62355' : domain.color + '55' }}>
                            <Text style={{ color: subject.layer === 'EDGE' && !isSovereign ? '#F5A623' : domain.color, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>{subject.layer === 'EDGE' && !isSovereign ? '⊚ Sovereign Only' : 'Open Subject →'}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, backgroundColor: domain.color + '15', borderWidth: 1, borderColor: domain.color + '44' }}>
                            <Text style={{ fontSize: 10, color: domain.color }}>{HOST_GLYPHS[getDailyHost(subject.name)]}</Text>
                            <Text style={{ fontSize: 9, color: domain.color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>{HOST_NAMES[getDailyHost(subject.name)]} hosting</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}

              {/* Knowledge synthesis */}
              {(() => {
                const studied = domain.subjects.filter(s => studiedSubjects.has(s.name));
                if (studied.length < 5) return null;
                const synth = domainSynthesis[domain.id];
                const isLoading = synthesisLoading === domain.id;
                return (
                  <View style={{ marginTop: 8, marginBottom: 4, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '44', backgroundColor: domain.color + '08' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: synth ? 10 : 0 }}>
                      <Text style={{ color: domain.color, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5 }}>🔮 WHAT HAVE I LEARNED?</Text>
                      {!synth && !isLoading && (
                        <TouchableOpacity onPress={async () => {
                          setSynthesisLoading(domain.id);
                          try {
                            const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
                            if (!apiKey) { setSynthesisLoading(null); Alert.alert('No API Key', 'Add a key in Settings to generate your synthesis.', [{ text: 'OK' }]); return; }
                            const res = await sendMessage(
                              [{ role: 'user', content: `The student has studied: ${studied.map(s => s.name).join(', ')} in ${domain.label}. Write a 3-4 sentence synthesis of what they now understand. Be honest about gaps. No preamble.` }],
                              'You are the Headmaster. Synthesize the student\'s learning with precision and honesty. 3-4 sentences. No flattery.',
                              apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 200, 0.65,
                            );
                            const text = res.text.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim();
                            const updated = { ...domainSynthesis, [domain.id]: text };
                            setDomainSynthesis(updated);
                            await AsyncStorage.setItem('sol_domain_synthesis', JSON.stringify(updated));
                          } catch {}
                          setSynthesisLoading(null);
                        }} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: domain.color + '22' }}>
                          <Text style={{ color: domain.color, fontSize: 10, fontWeight: '700' }}>Synthesize</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {isLoading && <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>The Headmaster is reading your path…</Text>}
                    {synth && <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{synth}</Text>}
                    {!synth && !isLoading && <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 4 }}>{studied.length} subjects studied — tap Synthesize for your field report.</Text>}
                  </View>
                );
              })()}

              {/* Question drop */}
              <View style={{ marginTop: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '44', backgroundColor: domain.color + '0D' }}
                  onPress={() => {
                    if (Alert.prompt) {
                      Alert.prompt('Drop a Question', `Leave a question for "${domain.label}":`, async (text) => {
                        if (!text?.trim()) return;
                        const updated = { ...subjectQuestions, [domain.id]: [text.trim(), ...(subjectQuestions[domain.id] || [])].slice(0, 20) };
                        setSubjectQuestions(updated);
                        await AsyncStorage.setItem('sol_subject_questions', JSON.stringify(updated));
                      }, 'plain-text');
                    } else {
                      setTextPromptValue('');
                      setTextPrompt({
                        title: `Question — ${domain.label}`,
                        placeholder: 'What are you wondering about?',
                        current: '',
                        onSubmit: async (text) => {
                          if (!text.trim()) return;
                          const updated = { ...subjectQuestions, [domain.id]: [text.trim(), ...(subjectQuestions[domain.id] || [])].slice(0, 20) };
                          setSubjectQuestions(updated);
                          await AsyncStorage.setItem('sol_subject_questions', JSON.stringify(updated));
                        },
                      });
                    }
                  }}
                  activeOpacity={0.75}>
                  <Text style={{ fontSize: 16, color: domain.color }}>❓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: domain.color, fontSize: 12, fontWeight: '700' }}>Drop a Question</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 1 }}>Leave a question for this domain.</Text>
                  </View>
                </TouchableOpacity>
                {(subjectQuestions[domain.id] || []).map((q, qi) => (
                  <View key={qi} style={{ marginTop: 6, padding: 10, borderRadius: 8, backgroundColor: domain.color + '0A', borderWidth: 1, borderColor: domain.color + '33', flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: domain.color, fontSize: 12 }}>❓</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, flex: 1, lineHeight: 17 }}>{q}</Text>
                  </View>
                ))}
              </View>

              {/* Field echoes */}
              {(schoolEchoes[domain.id] || []).length > 0 && (
                <View style={{ marginTop: 4, marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 8, fontWeight: '700' }}>✦ FIELD ECHOES</Text>
                  {(schoolEchoes[domain.id] || []).map(echo => (
                    <View key={echo.id} style={{ padding: 10, borderRadius: 8, backgroundColor: '#9B59B60A', borderWidth: 1, borderColor: '#9B59B633', marginBottom: 6 }}>
                      <Text style={{ color: '#9B59B6', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4 }}>✦ {echo.source ? `${echo.source} · ` : ''}{echo.date}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>{echo.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          );
        })()}

        {/* ── CURRICULUM ───────────────────────────────────────────────────── */}
        {schoolView === 'curriculum' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 }}>
              <TouchableOpacity onPress={() => { setSchoolView('home'); setCurriculumDraft([]); setCurriculumName(''); setCurriculumDomainPicker(null); }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>← School</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700' }}>Curriculum Maker</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>Build a personal study path</Text>
              </View>
            </View>

            {/* Saved curricula */}
            {curricula.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>📋 YOUR PATHS</Text>
                {curricula.map(c => {
                  const completedCount = c.subjects.filter(s => studiedSubjects.has(s)).length;
                  const isActive = activeCurriculumId === c.id;
                  return (
                    <View key={c.id} style={{ padding: 14, borderRadius: 12, borderWidth: isActive ? 2 : 1, borderColor: isActive ? SOL_THEME.primary : SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 15, fontWeight: '700' }}>{c.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          {isActive ? (
                            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: SOL_THEME.primary + '22' }}>
                              <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={() => setActiveCurriculumId(c.id)}
                              style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border }}>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700' }}>Activate</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => Alert.alert('Delete Curriculum', `Remove "${c.name}"?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteCurriculum(c.id) },
                          ])}>
                            <Text style={{ color: SOL_THEME.textMuted, fontSize: 16 }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={{ height: 3, backgroundColor: SOL_THEME.border, borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                        <View style={{ height: 3, width: `${Math.round((completedCount / c.subjects.length) * 100)}%`, backgroundColor: SOL_THEME.primary, borderRadius: 2 }} />
                      </View>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginBottom: 8 }}>{completedCount}/{c.subjects.length} completed · Created {c.created}</Text>
                      {c.subjects.slice(0, 5).map((subjectName, si) => {
                        const done = studiedSubjects.has(subjectName);
                        const domain = MYSTERY_SCHOOL_DOMAINS.find(d => d.subjects.some(s => s.name === subjectName));
                        const subject = domain?.subjects.find(s => s.name === subjectName);
                        return (
                          <TouchableOpacity key={si}
                            onPress={() => { if (subject && domain) { setSelectedDomain(domain); openSubjectDetail(subject, domain); } }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: si < Math.min(c.subjects.length, 5) - 1 ? 1 : 0, borderBottomColor: SOL_THEME.border }}>
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: done ? '#4CAF50' : SOL_THEME.border, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ color: done ? '#fff' : SOL_THEME.textMuted, fontSize: 11, fontWeight: '700' }}>{done ? '✓' : si + 1}</Text>
                            </View>
                            <Text style={{ flex: 1, color: done ? SOL_THEME.textMuted : SOL_THEME.text, fontSize: 13, textDecorationLine: done ? 'line-through' : 'none' }}>{subjectName}</Text>
                            {domain && <Text style={{ color: domain.color, fontSize: 12 }}>{domain.glyph}</Text>}
                          </TouchableOpacity>
                        );
                      })}
                      {c.subjects.length > 5 && (
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 6 }}>+{c.subjects.length - 5} more subjects</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Build new curriculum */}
            <View style={{ padding: 16, borderRadius: 14, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, marginBottom: 16 }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>✦ Build New Path</Text>

              {/* Name */}
              <TextInput
                style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 13, marginBottom: 12 }}
                placeholder="Path name..."
                placeholderTextColor={SOL_THEME.textMuted}
                value={curriculumName}
                onChangeText={setCurriculumName}
              />

              {/* Preset templates */}
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, fontWeight: '700', marginBottom: 8 }}>QUICK TEMPLATES</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Foundation Path', fn: () => {
                    const picks = MYSTERY_SCHOOL_DOMAINS.map(d => d.subjects.find(s => s.layer === 'FOUNDATION')).filter(Boolean) as Subject[];
                    setCurriculumDraft(picks.map(s => s.name));
                    if (!curriculumName) setCurriculumName('Foundation Path');
                  }},
                  { label: 'My Stage', fn: () => {
                    const layer = stageToLayer(fieldStage);
                    const picks = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.filter(s => s.layer === layer && !studiedSubjects.has(s.name))).slice(0, 10);
                    setCurriculumDraft(picks.map(s => s.name));
                    if (!curriculumName) setCurriculumName(`${layer.charAt(0) + layer.slice(1).toLowerCase()} Stage`);
                  }},
                  { label: 'Unstudied', fn: () => {
                    const all = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.filter(s => !studiedSubjects.has(s.name))).slice(0, 12);
                    setCurriculumDraft(all.map(s => s.name));
                    if (!curriculumName) setCurriculumName('Fresh Territory');
                  }},
                ].map(t => (
                  <TouchableOpacity key={t.label} onPress={t.fn}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.primary + '55', backgroundColor: SOL_THEME.primary + '0E' }}>
                    <Text style={{ color: SOL_THEME.primary, fontSize: 12, fontWeight: '600' }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Domain browser */}
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, fontWeight: '700', marginBottom: 8 }}>ADD FROM DOMAIN</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {MYSTERY_SCHOOL_DOMAINS.map(d => (
                    <TouchableOpacity key={d.id} onPress={() => setCurriculumDomainPicker(curriculumDomainPicker?.id === d.id ? null : d)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: curriculumDomainPicker?.id === d.id ? d.color : d.color + '55', backgroundColor: curriculumDomainPicker?.id === d.id ? d.color + '22' : d.color + '0A' }}>
                      <Text style={{ color: d.color, fontSize: 16 }}>{d.glyph}</Text>
                      <Text style={{ color: d.color, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{t(d.label).split(' ')[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {curriculumDomainPicker && (
                <View style={{ marginBottom: 14 }}>
                  {curriculumDomainPicker.subjects.map(s => {
                    const inDraft = curriculumDraft.includes(s.name);
                    return (
                      <TouchableOpacity key={s.name} onPress={() => {
                        if (inDraft) setCurriculumDraft(prev => prev.filter(n => n !== s.name));
                        else setCurriculumDraft(prev => [...prev, s.name]);
                      }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border }}>
                        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: inDraft ? curriculumDomainPicker.color : SOL_THEME.border, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: inDraft ? '#000' : SOL_THEME.textMuted, fontSize: 13, fontWeight: '700' }}>{inDraft ? '✓' : '+'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '600' }}>{s.name}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{LAYER_LABELS[s.layer]}</Text>
                        </View>
                        {studiedSubjects.has(s.name) && <Text style={{ color: '#4CAF50', fontSize: 12 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Draft preview */}
              {curriculumDraft.length > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>Your path ({curriculumDraft.length} subjects)</Text>
                    <TouchableOpacity onPress={() => setCurriculumDraft([])}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  {curriculumDraft.map((name, i) => (
                    <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: i < curriculumDraft.length - 1 ? 1 : 0, borderBottomColor: SOL_THEME.border }}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, width: 20 }}>{i + 1}.</Text>
                      <Text style={{ flex: 1, color: SOL_THEME.text, fontSize: 13 }}>{name}</Text>
                      <TouchableOpacity onPress={() => setCurriculumDraft(prev => prev.filter(n => n !== name))}>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={saveCurriculum}
                    disabled={!curriculumName.trim()}
                    style={{ marginTop: 14, paddingVertical: 13, borderRadius: 12, backgroundColor: curriculumName.trim() ? SOL_THEME.primary : SOL_THEME.border, alignItems: 'center' }}>
                    <Text style={{ color: curriculumName.trim() ? '#000' : SOL_THEME.textMuted, fontSize: 14, fontWeight: '700' }}>Save Path</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* ── NOTES ────────────────────────────────────────────────────────── */}
        {schoolView === 'notes' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
              <TouchableOpacity onPress={() => { setSchoolView('home'); setNotesSearch(''); }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>← School</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700' }}>My Notes</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>{Object.keys(subjectNotes).length} notes across {Object.keys(subjectNotes).length} subjects</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, paddingHorizontal: 12, marginBottom: 16, gap: 8 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>⌕</Text>
              <TextInput
                style={{ flex: 1, color: SOL_THEME.text, fontSize: 13, paddingVertical: 9 }}
                placeholder="Search notes..."
                placeholderTextColor={SOL_THEME.textMuted}
                value={notesSearch}
                onChangeText={setNotesSearch}
                autoCapitalize="none"
              />
              {notesSearch.length > 0 && <TouchableOpacity onPress={() => setNotesSearch('')}><Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text></TouchableOpacity>}
            </View>

            {Object.keys(subjectNotes).length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 32, marginBottom: 12 }}>✎</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>No notes yet.{'\n'}Open a subject and tap the note field to begin.</Text>
              </View>
            ) : (
              MYSTERY_SCHOOL_DOMAINS.map(domain => {
                const domainNotes = domain.subjects.filter(s => subjectNotes[s.name] && (
                  notesSearch === '' || s.name.toLowerCase().includes(notesSearch.toLowerCase()) || subjectNotes[s.name].toLowerCase().includes(notesSearch.toLowerCase())
                ));
                if (domainNotes.length === 0) return null;
                return (
                  <View key={domain.id} style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Text style={{ color: domain.color, fontSize: 16 }}>{domain.glyph}</Text>
                      <Text style={{ color: domain.color, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>{t(domain.label)}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>({domainNotes.length})</Text>
                    </View>
                    {domainNotes.map(subject => (
                      <TouchableOpacity key={subject.name}
                        onPress={() => { setSelectedDomain(domain); openSubjectDetail(subject, domain); }}
                        style={{ padding: 14, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: domain.color + '33', borderLeftWidth: 3, borderLeftColor: domain.color, marginBottom: 8 }}
                        activeOpacity={0.7}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{subject.name}</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }} numberOfLines={3}>{subjectNotes[subject.name]}</Text>
                        <Text style={{ color: domain.color, fontSize: 10, marginTop: 6, fontWeight: '700' }}>Open subject →</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── DIVE LOG ─────────────────────────────────────────────────────── */}
        {schoolView === 'dive-log' && (() => {
          const totalDives = diveLog.length;
          const totalMinutes = Math.round(diveLog.reduce((acc, d) => acc + (d.durationSec || 0), 0) / 60);
          const uniqueDomains = new Set(diveLog.map(d => d.domainLabel)).size;
          const uniqueSubjects = new Set(diveLog.map(d => d.subjectName)).size;
          const titleData = getDiveTitle(totalDives);

          // Group by date
          const grouped: Record<string, DiveRecord[]> = {};
          diveLog.forEach(d => {
            const key = d.date || 'Unknown date';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(d);
          });
          const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

          return (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
                <TouchableOpacity onPress={() => setSchoolView('home')}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>← School</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700' }}>Dive Chronicle</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>{totalDives} dives · {uniqueSubjects} subjects · {uniqueDomains} domains</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: titleData.color + '55', backgroundColor: titleData.color + '10' }}>
                  <Text style={{ color: titleData.color, fontSize: 14 }}>{titleData.glyph}</Text>
                  <Text style={{ color: titleData.color, fontSize: 11, fontWeight: '700' }}>{titleData.title}</Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'TOTAL DIVES', value: String(totalDives) },
                  { label: 'MINUTES STUDIED', value: String(totalMinutes) },
                  { label: 'DOMAINS', value: String(uniqueDomains) },
                ].map(stat => (
                  <View key={stat.label} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                    <Text style={{ color: SOL_THEME.primary, fontSize: 20, fontWeight: '700' }}>{stat.value}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.2, marginTop: 3, textAlign: 'center' }}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Grouped dive list */}
              {sortedDates.map(dateKey => (
                <View key={dateKey} style={{ marginBottom: 20 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>
                    {dateKey.toUpperCase()}
                  </Text>
                  <View style={{ gap: 6 }}>
                    {grouped[dateKey].map(d => {
                      const mins = d.durationSec ? Math.round(d.durationSec / 60) : null;
                      return (
                        <TouchableOpacity key={d.id}
                          onPress={async () => {
                            const domain = MYSTERY_SCHOOL_DOMAINS.find(dom => dom.label === d.domainLabel) || null;
                            const subject = domain?.subjects.find(s => s.name === d.subjectName)
                              || customSubjects.find(s => s.name === d.subjectName)
                              || (d.domainLabel === 'Open Seat' ? { name: d.subjectName, domain: 'Open Seat', layer: d.layer, description: `A free-form study session on "${d.subjectName}".` } as Subject : null);
                            if (!subject) return;
                            if (domain) setSelectedDomain(domain);
                            if (d.domainLabel !== 'Open Seat') { setSchoolView('subject'); await openSubjectDetail(subject, domain); }
                            else enterStudySession(subject, null);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: d.domainColor + '0D', borderWidth: 1, borderColor: d.domainColor + '33', borderLeftWidth: 3, borderLeftColor: d.domainColor }}
                          activeOpacity={0.7}>
                          <Text style={{ color: d.domainColor, fontSize: 22 }}>{d.domainGlyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{d.subjectName}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                              <Text style={{ color: d.domainColor, fontSize: 10, fontWeight: '700' }}>{d.domainLabel}</Text>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>{TEACHER_NAMES[d.teacher] || d.teacher}</Text>
                              {mins !== null && mins > 0 && (
                                <>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>{mins}m</Text>
                                </>
                              )}
                              {d.timeOfDay && (
                                <>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textTransform: 'capitalize' }}>{d.timeOfDay}</Text>
                                </>
                              )}
                            </View>
                          </View>
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: LAYER_COLORS[d.layer] + '22' }}>
                            <Text style={{ color: LAYER_COLORS[d.layer], fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[d.layer]}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Night Ledger */}
              {(() => {
                const nightDives = diveLog.filter(d => {
                  const ts = parseInt(d.id, 10);
                  if (isNaN(ts)) return false;
                  const h = new Date(ts).getHours();
                  return h >= 0 && h < 4;
                });
                if (nightDives.length === 0) return null;
                return (
                  <View style={{ marginBottom: 20, marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF11', backgroundColor: '#08080E' }}>
                    <Text style={{ color: '#FFFFFF44', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2.5, fontWeight: '700', marginBottom: 10 }}>
                      ◎ NIGHT LEDGER · {nightDives.length} {nightDives.length === 1 ? 'ENTRY' : 'ENTRIES'}
                    </Text>
                    <Text style={{ color: '#FFFFFF33', fontSize: 11, fontStyle: 'italic', marginBottom: 12, lineHeight: 16 }}>
                      Dives taken between midnight and 4am — when the school is quietest.
                    </Text>
                    <View style={{ gap: 6 }}>
                      {nightDives.slice(0, 10).map(d => (
                        <View key={d.id + '-nl'} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                          <Text style={{ color: d.domainColor + 'AA', fontSize: 18 }}>{d.domainGlyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#FFFFFF77', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{d.subjectName}</Text>
                            <Text style={{ color: '#FFFFFF33', fontSize: 10 }}>{d.domainLabel} · {d.date}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}

              {diveLog.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 40, marginBottom: 14 }}>⊚</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
                    Your dives will be recorded here.{'\n'}Begin a session and the Chronicle opens.
                  </Text>
                </View>
              )}
            </>
          );
        })()}
      </ScrollView>

      {/* Sticky bottom bar — context-sensitive */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: SOL_THEME.surface, borderTopWidth: 1, borderTopColor: SOL_THEME.headmaster + '33', paddingHorizontal: 16, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SOL_THEME.headmaster + '18', borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44' }}
          onPress={() => goToHeadmaster(schoolView === 'domain' && selectedDomain ? undefined : undefined)}
          activeOpacity={0.75}>
          <Text style={{ fontSize: 16, color: SOL_THEME.headmaster }}>⊙</Text>
          <Text style={{ color: SOL_THEME.headmaster, fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>
            {schoolView === 'domain' && selectedDomain ? `Study ${selectedDomain.label} with Headmaster` : 'Open Headmaster Session'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Android text input modal */}
      <Modal visible={!!textPrompt} transparent animationType="fade" onRequestClose={() => setTextPrompt(null)}>
        <View style={{ flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: SOL_THEME.surface, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: SOL_THEME.border }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>{textPrompt?.title}</Text>
            <TextInput
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' }}
              placeholder={textPrompt?.placeholder}
              placeholderTextColor={SOL_THEME.textMuted}
              value={textPromptValue}
              onChangeText={setTextPromptValue}
              multiline
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => { setTextPrompt(null); setTextPromptValue(''); }} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { textPrompt?.onSubmit(textPromptValue); setTextPrompt(null); setTextPromptValue(''); }}
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: SOL_THEME.primary + '22', borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.primary + '55' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* One Breath Before the Dive — intention gate */}
      <Modal visible={!!breathPending} transparent animationType="fade" onRequestClose={() => setBreathPending(null)}>
        {breathPending && (() => {
          const bc = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === breathPending.domain?.id)?.color || SOL_THEME.primary;
          const bg = breathPending.domain?.glyph || '⊚';
          const teacherId = breathPending.host || getDailyHost(breathPending.subject.name);
          return (
            <View style={{ flex: 1, backgroundColor: '#000000EE', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <View style={{ width: '100%', borderRadius: 24, borderWidth: 1, borderColor: bc + '44', backgroundColor: '#0A0A0A', padding: 32, alignItems: 'center' }}>
                <Text style={{ color: bc, fontSize: 56, lineHeight: 64, marginBottom: 12 }}>{bg}</Text>
                <Text style={{ color: bc, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 3, fontWeight: '700', marginBottom: 16 }}>ONE BREATH</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6, lineHeight: 24 }}>
                  {breathPending.subject.name}
                </Text>
                <Text style={{ color: bc + 'AA', fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
                  {breathPending.domain?.label || 'Open Seat'} · {HOST_NAMES[teacherId] || teacherId}
                </Text>
                <Text style={{ color: '#FFFFFF44', fontSize: 11, fontStyle: 'italic', marginBottom: 28, textAlign: 'center', lineHeight: 17 }}>
                  Arrive here. Set aside what you were doing.{'\n'}The subject is waiting.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const { subject, domain, host, depth } = breathPending;
                    setBreathPending(null);
                    enterStudySession(subject, domain, host, depth);
                  }}
                  style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: bc, alignItems: 'center', marginBottom: 10 }}
                  activeOpacity={0.85}>
                  <Text style={{ color: '#000', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>I'm ready →</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBreathPending(null)} style={{ paddingVertical: 10 }}>
                  <Text style={{ color: '#FFFFFF33', fontSize: 12 }}>Not now</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
});
