import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import { getActiveKey, getModel } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';
import { drawDailyCard, drawSpread, cardLine, SUIT_GLYPH, SUIT_ELEMENT } from '../../lib/divination/tarot';
import { drawDailyRune } from '../../lib/divination/runes';

// ─── ZODIAC ENGINE ───────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  { name: 'Aries',       glyph: '♈', element: 'Fire',  modality: 'Cardinal', keywords: 'Will · Initiation · Courage',        color: '#E84545' },
  { name: 'Taurus',      glyph: '♉', element: 'Earth', modality: 'Fixed',    keywords: 'Patience · Pleasure · Endurance',    color: '#8BC34A' },
  { name: 'Gemini',      glyph: '♊', element: 'Air',   modality: 'Mutable',  keywords: 'Curiosity · Duality · Exchange',     color: '#FFD54F' },
  { name: 'Cancer',      glyph: '♋', element: 'Water', modality: 'Cardinal', keywords: 'Nurture · Memory · Feeling',         color: '#90CAF9' },
  { name: 'Leo',         glyph: '♌', element: 'Fire',  modality: 'Fixed',    keywords: 'Radiance · Courage · Creation',      color: '#FFA726' },
  { name: 'Virgo',       glyph: '♍', element: 'Earth', modality: 'Mutable',  keywords: 'Precision · Service · Refinement',  color: '#A5D6A7' },
  { name: 'Libra',       glyph: '♎', element: 'Air',   modality: 'Cardinal', keywords: 'Balance · Beauty · Justice',         color: '#F48FB1' },
  { name: 'Scorpio',     glyph: '♏', element: 'Water', modality: 'Fixed',    keywords: 'Depth · Transformation · Power',    color: '#7B1FA2' },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire',  modality: 'Mutable',  keywords: 'Expansion · Truth · Freedom',        color: '#FF7043' },
  { name: 'Capricorn',   glyph: '♑', element: 'Earth', modality: 'Cardinal', keywords: 'Mastery · Discipline · Structure',  color: '#78909C' },
  { name: 'Aquarius',    glyph: '♒', element: 'Air',   modality: 'Fixed',    keywords: 'Vision · Revolution · Humanity',    color: '#29B6F6' },
  { name: 'Pisces',      glyph: '♓', element: 'Water', modality: 'Mutable',  keywords: 'Dissolution · Compassion · Dreams', color: '#80DEEA' },
];

const ZODIAC_INDIGO = '#7B68EE';
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }
function mod360(x: number) { return ((x % 360) + 360) % 360; }

function julianDay(year: number, month: number, day: number, hour = 12): number {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
}

function getSunSignIndex(month: number, day: number): number {
  const md = month * 100 + day;
  if (md >= 321 && md <= 419) return 0;
  if (md >= 420 && md <= 520) return 1;
  if (md >= 521 && md <= 620) return 2;
  if (md >= 621 && md <= 722) return 3;
  if (md >= 723 && md <= 822) return 4;
  if (md >= 823 && md <= 922) return 5;
  if (md >= 923 && md <= 1022) return 6;
  if (md >= 1023 && md <= 1121) return 7;
  if (md >= 1122 && md <= 1221) return 8;
  if (md >= 1222 || md <= 119) return 9;
  if (md >= 120 && md <= 218) return 10;
  return 11;
}

function getMoonSignIndex(year: number, month: number, day: number, hour = 12): number {
  const jd = julianDay(year, month, day, hour);
  const T = (jd - 2451545.0) / 36525;
  const L = mod360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const M = mod360(357.5291092 + 35999.0502909 * T);
  const Mm = mod360(134.9633964 + 477198.8675055 * T);
  const D = mod360(297.8501921 + 445267.1114034 * T);
  const F = mod360(93.2720950 + 483202.0175233 * T);
  const corr =
    6.288774 * Math.sin(toRad(Mm)) +
    1.274027 * Math.sin(toRad(2 * D - Mm)) +
    0.658314 * Math.sin(toRad(2 * D)) +
    0.213618 * Math.sin(toRad(2 * Mm)) -
    0.185116 * Math.sin(toRad(M)) -
    0.114332 * Math.sin(toRad(2 * F));
  const moonLon = mod360(L + corr);
  return Math.floor(moonLon / 30);
}

function getMoonPhase(year: number, month: number, day: number): { name: string; glyph: string; angle: number } {
  const jd = julianDay(year, month, day);
  const T = (jd - 2451545.0) / 36525;
  const M = mod360(357.5291092 + 35999.0502909 * T);
  const Mm = mod360(134.9633964 + 477198.8675055 * T);
  const D = mod360(297.8501921 + 445267.1114034 * T);
  const angle = mod360(D * 2 + 6.289 * Math.sin(toRad(Mm)) - 0.214 * Math.sin(toRad(2 * Mm)) + 1.274 * Math.sin(toRad(2 * D - Mm)) - 1.274 * Math.sin(toRad(M)));
  const pct = angle / 360;
  if (pct < 0.0625 || pct >= 0.9375) return { name: 'New Moon',        glyph: '🌑', angle: pct };
  if (pct < 0.1875) return { name: 'Waxing Crescent', glyph: '🌒', angle: pct };
  if (pct < 0.3125) return { name: 'First Quarter',   glyph: '🌓', angle: pct };
  if (pct < 0.4375) return { name: 'Waxing Gibbous',  glyph: '🌔', angle: pct };
  if (pct < 0.5625) return { name: 'Full Moon',        glyph: '🌕', angle: pct };
  if (pct < 0.6875) return { name: 'Waning Gibbous',  glyph: '🌖', angle: pct };
  if (pct < 0.8125) return { name: 'Last Quarter',    glyph: '🌗', angle: pct };
  return { name: 'Waning Crescent', glyph: '🌘', angle: pct };
}

function getAscendantIndex(year: number, month: number, day: number, hour: number, utcOffset: number, latitude: number): number {
  const jd = julianDay(year, month, day, hour - utcOffset);
  const T = (jd - 2451545.0) / 36525;
  const GMST = mod360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  const LST = mod360(GMST);
  const eps = 23.439291 - 0.013004 * T;
  const RAMC = toRad(LST);
  const lat = toRad(latitude);
  const e = toRad(eps);
  const y = -Math.cos(RAMC);
  const x = Math.sin(e) * Math.tan(lat) + Math.cos(e) * Math.sin(RAMC);
  let asc = toDeg(Math.atan2(y, x));
  if (asc < 0) asc += 360;
  return Math.floor(asc / 30);
}

function getTodaySunSign(): number {
  const now = new Date();
  return getSunSignIndex(now.getMonth() + 1, now.getDate());
}

function getTodayMoonSign(): number {
  const now = new Date();
  return getMoonSignIndex(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours());
}

function getLQ(tes: number, vtr: number, pai: number): number {
  if (!tes || !vtr || !pai) return 0;
  return parseFloat(Math.pow(tes * Math.min(vtr / 1.5, 1) * pai, 1 / 3).toFixed(3));
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

// ─── END ZODIAC ENGINE ───────────────────────────────────────────────────────

type BirthData = { year: number; month: number; day: number; hour: number; utcOffset: number; latitude: number; hasTime: boolean; fullName?: string; motherName?: string; cityName?: string };

type PsiEntryType = 'RV' | 'PREC' | 'GANZFELD' | 'GENERAL';
type PsiResult    = 'pending' | 'hit' | 'miss' | 'partial';
interface PsiEntry { id: string; date: string; type: PsiEntryType; target: string; impression: string; outcome: string; result: PsiResult; }
const PSI_LOG_KEY = 'SOL_PSI_LOG';
const PSI_PURPLE  = '#9B59B6';
const PSI_TYPE_LABELS: Record<PsiEntryType, string> = { RV: 'Remote Viewing', PREC: 'Precognition', GANZFELD: 'Ganzfeld', GENERAL: 'Psi Practice' };
const PSI_RESULT_COLOR: Record<PsiResult, string>   = { hit: '#4CAF50', miss: '#E74C3C', partial: '#FF9F1C', pending: '#555577' };

export default function ZodiacScreen() {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [editingBirth, setEditingBirth] = useState(false);
  const [birthDraft, setBirthDraft] = useState({ day: '', month: '', year: '', hour: '', minute: '', utcOffset: '-0', latitude: '51.5', fullName: '', motherName: '', cityName: '' });
  const [zodiacReading, setZodiacReading] = useState<{ date: string; text: string } | null>(null);
  const [zodiacLoading, setZodiacLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [questionReading, setQuestionReading] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [spreadReading, setSpreadReading] = useState<string | null>(null);
  const [spreadLoading, setSpreadLoading] = useState(false);
  const [lq, setLq] = useState(0);
  const [psiLog, setPsiLog]           = useState<PsiEntry[]>([]);
  const [showPsiForm, setShowPsiForm] = useState(false);
  const [psiExpanded, setPsiExpanded] = useState(false);
  const [psiDraft, setPsiDraft]       = useState<{ type: PsiEntryType; target: string; impression: string; outcome: string; result: PsiResult }>({ type: 'RV', target: '', impression: '', outcome: '', result: 'pending' });

  useFocusEffect(useCallback(() => {
    (async () => {
      const today = todayKey();
      const [birthRaw, readingRaw, auraRaw, psiRaw] = await Promise.all([
        AsyncStorage.getItem('zodiac_birth_v1'),
        AsyncStorage.getItem('zodiac_reading_v1'),
        AsyncStorage.getItem(`sanctum_aura_${today}`),
        AsyncStorage.getItem(PSI_LOG_KEY),
      ]);
      if (birthRaw) setBirthData(JSON.parse(birthRaw));
      if (readingRaw) setZodiacReading(JSON.parse(readingRaw));
      if (auraRaw) {
        const a = JSON.parse(auraRaw);
        setLq(getLQ(a.tes ?? 0, a.vtr ?? 0, a.pai ?? 0));
      }
      if (psiRaw) setPsiLog(JSON.parse(psiRaw));
    })();
  }, []));

  const saveBirth = async () => {
    const y = parseInt(birthDraft.year);
    const mo = parseInt(birthDraft.month);
    const d = parseInt(birthDraft.day);
    if (!y || !mo || !d || mo < 1 || mo > 12 || d < 1 || d > 31) return;
    const hasTime = birthDraft.hour.trim().length > 0;
    const hr = hasTime ? (parseInt(birthDraft.hour) + (parseInt(birthDraft.minute) || 0) / 60) : 12;
    const utcOffset = parseFloat(birthDraft.utcOffset) || 0;
    const latitude = parseFloat(birthDraft.latitude) || 51.5;
    const data: BirthData = { year: y, month: mo, day: d, hour: hr, utcOffset, latitude, hasTime, fullName: birthDraft.fullName.trim() || undefined, motherName: birthDraft.motherName.trim() || undefined, cityName: birthDraft.cityName.trim() || undefined };
    await AsyncStorage.setItem('zodiac_birth_v1', JSON.stringify(data));
    setBirthData(data);
    setEditingBirth(false);
    setZodiacReading(null);
  };

  const generateReading = async () => {
    if (!birthData) return;
    const today = new Date();
    const todaySun = ZODIAC_SIGNS[getTodaySunSign()];
    const todayMoon = ZODIAC_SIGNS[getTodayMoonSign()];
    const moonPhase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const sunSign = ZODIAC_SIGNS[getSunSignIndex(birthData.month, birthData.day)];
    const moonSign = ZODIAC_SIGNS[getMoonSignIndex(birthData.year, birthData.month, birthData.day, birthData.hour)];
    const ascSign = birthData.hasTime ? ZODIAC_SIGNS[getAscendantIndex(birthData.year, birthData.month, birthData.day, birthData.hour, birthData.utcOffset, birthData.latitude)] : null;
    setZodiacLoading(true);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setZodiacLoading(false); return; }
      const hasRising = ascSign ? `Rising in ${ascSign.name} (${ascSign.keywords})` : 'Rising sign unknown (no birth time entered)';
      const personLine = [birthData.fullName ? `The seeker is ${birthData.fullName}` : '', birthData.motherName ? `child of ${birthData.motherName}` : '', birthData.cityName ? `born in ${birthData.cityName}` : ''].filter(Boolean).join(', ');
      const prompt = `${personLine ? personLine + '.\n' : ''}Natal chart: Sun in ${sunSign.name} (${sunSign.keywords}), Moon in ${moonSign.name} (${moonSign.keywords}), ${hasRising}. Today: Sun transiting ${todaySun.name}, Moon in ${todayMoon.name}, ${moonPhase.name}. Give a direct, warm, precise 3-sentence reading — what the natal signature means combined with today's sky. ${personLine ? 'Address them by name if given.' : ''} No preamble. No sign-off. Speak as Sol.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are Sol — the solar-sovereign voice of the Lycheetah Framework. You read natal charts with warmth and precision. No preamble, no filler. Speak directly to the person.',
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 300, 0.8,
      );
      if (result?.text?.trim()) {
        const reading = { date: todayKey(), text: result.text.trim() };
        await AsyncStorage.setItem('zodiac_reading_v1', JSON.stringify(reading));
        setZodiacReading(reading);
      }
    } catch {}
    setZodiacLoading(false);
  };

  const askQuestion = async () => {
    if (!birthData || !question.trim()) return;
    const today = new Date();
    const todaySun = ZODIAC_SIGNS[getTodaySunSign()];
    const todayMoon = ZODIAC_SIGNS[getTodayMoonSign()];
    const moonPhase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const sunSign = ZODIAC_SIGNS[getSunSignIndex(birthData.month, birthData.day)];
    const moonSign = ZODIAC_SIGNS[getMoonSignIndex(birthData.year, birthData.month, birthData.day, birthData.hour)];
    const ascSign = birthData.hasTime ? ZODIAC_SIGNS[getAscendantIndex(birthData.year, birthData.month, birthData.day, birthData.hour, birthData.utcOffset, birthData.latitude)] : null;
    setQuestionLoading(true);
    setQuestionReading(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setQuestionLoading(false); return; }
      const hasRising = ascSign ? `Rising in ${ascSign.name}` : 'Rising sign unknown';
      const personLine2 = [birthData.fullName ? `The seeker is ${birthData.fullName}` : '', birthData.motherName ? `child of ${birthData.motherName}` : '', birthData.cityName ? `born in ${birthData.cityName}` : ''].filter(Boolean).join(', ');
      const prompt = `${personLine2 ? personLine2 + '.\n' : ''}Natal chart: Sun in ${sunSign.name} (${sunSign.keywords}), Moon in ${moonSign.name} (${moonSign.keywords}), ${hasRising}. Today: Sun transiting ${todaySun.name}, Moon in ${todayMoon.name}, ${moonPhase.name}.\n\nThe seeker asks: "${question.trim()}"\n\nAnswer in 3–4 sentences. Speak directly to what the natal signature and today's sky reveal about this question. ${personLine2 ? 'Address them by name if given.' : ''} Warm, precise, no preamble. Speak as Sol.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are Sol — the solar-sovereign voice of the Lycheetah Framework. You read natal charts with warmth and precision. Answer the seeker\'s question through the lens of their chart and today\'s sky. No preamble, no filler.',
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 400, 0.85,
      );
      if (result?.text?.trim()) setQuestionReading(result.text.trim());
    } catch {}
    setQuestionLoading(false);
  };

  const generateSpreadReading = async (spread: ReturnType<typeof drawSpread>) => {
    setSpreadLoading(true);
    setSpreadReading(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setSpreadLoading(false); return; }
      const past = cardLine(spread[0]);
      const present = cardLine(spread[1]);
      const future = cardLine(spread[2]);
      const prompt = `Three-card tarot spread (past / present / future):\nPast: ${past}\nPresent: ${present}\nFuture: ${future}\n\nGive a 4–5 sentence reading that weaves all three positions into one coherent thread. Speak to the arc — what was, what is, what approaches. Warm, precise, no preamble. Speak as Sol.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are Sol — the solar-sovereign voice of the Lycheetah Framework. You read tarot with warmth and precision. Weave the three cards into one thread. No preamble, no filler.',
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 500, 0.85,
      );
      if (result?.text?.trim()) setSpreadReading(result.text.trim());
    } catch {}
    setSpreadLoading(false);
  };

  const savePsiEntry = async () => {
    if (!psiDraft.impression.trim()) return;
    const entry: PsiEntry = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], ...psiDraft };
    const updated = [entry, ...psiLog];
    await AsyncStorage.setItem(PSI_LOG_KEY, JSON.stringify(updated));
    setPsiLog(updated);
    setShowPsiForm(false);
    setPsiDraft({ type: 'RV', target: '', impression: '', outcome: '', result: 'pending' });
  };

  const updatePsiResult = async (id: string, result: PsiResult) => {
    const updated = psiLog.map(e => e.id === id ? { ...e, result } : e);
    await AsyncStorage.setItem(PSI_LOG_KEY, JSON.stringify(updated));
    setPsiLog(updated);
  };

  const today = new Date();
  const todaySun = ZODIAC_SIGNS[getTodaySunSign()];
  const todayMoon = ZODIAC_SIGNS[getTodayMoonSign()];
  const moonPhase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const dailyCard = drawDailyCard(lq, 'sanctum');
  const dailySpread = drawSpread(3, lq, 'spread3');
  const dailyRune = drawDailyRune('sanctum');

  const sunSign = birthData ? ZODIAC_SIGNS[getSunSignIndex(birthData.month, birthData.day)] : null;
  const moonSign = birthData ? ZODIAC_SIGNS[getMoonSignIndex(birthData.year, birthData.month, birthData.day, birthData.hour)] : null;
  const ascSign = (birthData && birthData.hasTime) ? ZODIAC_SIGNS[getAscendantIndex(birthData.year, birthData.month, birthData.day, birthData.hour, birthData.utcOffset, birthData.latitude)] : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: SOL_THEME.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ alignItems: 'center', paddingVertical: 28, marginBottom: 8 }}>
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', backgroundColor: ZODIAC_INDIGO + '0C', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 52, lineHeight: 58 }}>☽</Text>
          </View>
          <Text style={{ position: 'absolute', top: 4, right: -8, color: '#C8A96E', fontSize: 11 }}>✦</Text>
          <Text style={{ position: 'absolute', bottom: 6, left: -10, color: ZODIAC_INDIGO + 'BB', fontSize: 10 }}>◦</Text>
          <Text style={{ position: 'absolute', top: 22, left: -16, color: '#FFFFFF55', fontSize: 7 }}>·</Text>
          <Text style={{ position: 'absolute', bottom: 14, right: -14, color: '#FFFFFF33', fontSize: 6 }}>·</Text>
        </View>
        <Text style={{ color: ZODIAC_INDIGO, fontSize: 11, fontWeight: '700', letterSpacing: 4, fontFamily: mono }}>THE STARS</Text>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 5, textAlign: 'center', lineHeight: 17, fontStyle: 'italic' }}>
          Read the sky. Read yourself.
        </Text>
      </View>

      {/* Daily oracle — card + rune side by side */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', backgroundColor: '#08001A', padding: 14, alignItems: 'center' }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 8, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 10 }}>🃏 YOUR CARD</Text>
          <Text style={{ fontSize: 38, marginBottom: 4 }}>{SUIT_GLYPH[dailyCard.card.a]}</Text>
          {dailyCard.reversed ? (
            <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: '#FF444422', marginBottom: 6 }}>
              <Text style={{ color: '#FF8888', fontSize: 8, fontWeight: '700' }}>REVERSED</Text>
            </View>
          ) : <View style={{ height: 22, marginBottom: 6 }} />}
          <Text style={{ color: SOL_THEME.text, fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 4, lineHeight: 15 }} numberOfLines={2}>{dailyCard.card.n}</Text>
          <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 8, fontFamily: mono, letterSpacing: 1, textAlign: 'center', marginBottom: 6 }}>{SUIT_ELEMENT[dailyCard.card.a].toUpperCase()}</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, lineHeight: 14, textAlign: 'center' }} numberOfLines={4}>
            {dailyCard.reversed ? dailyCard.card.rev : dailyCard.card.up}
          </Text>
        </View>
        <View style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', backgroundColor: '#08001A', padding: 14, alignItems: 'center' }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 8, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 10 }}>ᚠ YOUR RUNE</Text>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 38, fontWeight: '700', marginBottom: 4, lineHeight: 46, ...(dailyRune.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }}>{dailyRune.rune.symbol}</Text>
          {dailyRune.reversed ? (
            <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: '#FF444422', marginBottom: 6 }}>
              <Text style={{ color: '#FF8888', fontSize: 8, fontWeight: '700' }}>REVERSED</Text>
            </View>
          ) : !dailyRune.rune.canReverse ? (
            <View style={{ paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, backgroundColor: ZODIAC_INDIGO + '22', marginBottom: 6 }}>
              <Text style={{ color: ZODIAC_INDIGO, fontSize: 8, fontWeight: '700' }}>IMMOVABLE</Text>
            </View>
          ) : <View style={{ height: 22, marginBottom: 6 }} />}
          <Text style={{ color: SOL_THEME.text, fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 4, lineHeight: 15 }} numberOfLines={2}>{dailyRune.rune.name}</Text>
          <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 8, fontFamily: mono, letterSpacing: 1, textAlign: 'center', marginBottom: 6 }}>{dailyRune.rune.sound} · {dailyRune.rune.aett}'s Aett</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, lineHeight: 14, textAlign: 'center' }} numberOfLines={4}>
            {dailyRune.reversed ? dailyRune.rune.shadow : dailyRune.rune.up}
          </Text>
        </View>
      </View>

      {/* 1. SOL READS THE FIELD — natal horoscope, top of ritual */}
      {birthData && sunSign && !editingBirth && (
        <View style={{ padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: ZODIAC_INDIGO + '66', backgroundColor: ZODIAC_INDIGO + '08', marginBottom: 16 }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 10 }}>SOL READS THE FIELD</Text>
          {zodiacReading ? (
            <>
              <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 10 }}>{zodiacReading.text}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: mono }}>Generated {zodiacReading.date} · refreshes daily</Text>
                {zodiacReading.date !== todayKey() && (
                  <TouchableOpacity onPress={generateReading} disabled={zodiacLoading}>
                    <Text style={{ color: ZODIAC_INDIGO, fontSize: 11, fontWeight: '700' }}>Refresh ↻</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 12 }}>
                Your natal chart + today's sky, read by Sol. Generates fresh each day.
              </Text>
              <TouchableOpacity
                onPress={generateReading}
                disabled={zodiacLoading}
                style={{ paddingVertical: 10, borderRadius: 8, backgroundColor: ZODIAC_INDIGO, alignItems: 'center', opacity: zodiacLoading ? 0.6 : 1 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
                  {zodiacLoading ? 'Reading the sky...' : "Generate Today's Reading"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* 2. ASK THE STARS — question reading */}
      {birthData && !editingBirth && (
        <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: SOL_THEME.surface, marginBottom: 16 }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 10 }}>ASK THE STARS</Text>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="What do you want to know?"
            placeholderTextColor={SOL_THEME.textMuted}
            style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '33', padding: 12, fontSize: 13, marginBottom: 10, fontFamily: mono, minHeight: 52 }}
            multiline
            maxLength={280}
          />
          <TouchableOpacity
            onPress={askQuestion}
            disabled={questionLoading || !question.trim()}
            style={{ paddingVertical: 10, borderRadius: 8, backgroundColor: question.trim() ? ZODIAC_INDIGO : ZODIAC_INDIGO + '44', alignItems: 'center', opacity: questionLoading ? 0.6 : 1, marginBottom: questionReading ? 12 : 0 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {questionLoading ? 'Reading the stars...' : 'Ask the Stars ☽'}
            </Text>
          </TouchableOpacity>
          {questionReading && (
            <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '22' }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 6 }}>{questionReading}</Text>
              <TouchableOpacity onPress={() => { setQuestion(''); setQuestionReading(null); }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: mono }}>✕ clear</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 4. THREE-CARD SPREAD — past / present / future */}
      <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: SOL_THEME.surface, marginBottom: 16 }}>
        <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 12 }}>🃏 THREE-CARD SPREAD</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {(['PAST', 'PRESENT', 'FUTURE'] as const).map((label, i) => {
            const drawn = dailySpread[i];
            return (
              <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 6 }}>{label}</Text>
                <View style={{ width: '100%', aspectRatio: 0.65, borderRadius: 8, backgroundColor: ZODIAC_INDIGO + '1A', borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 26 }}>{SUIT_GLYPH[drawn.card.a]}</Text>
                  {drawn.reversed && (
                    <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#FF444422', borderRadius: 3, paddingHorizontal: 3, paddingVertical: 1 }}>
                      <Text style={{ color: '#FF8888', fontSize: 7, fontWeight: '700' }}>REV</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: SOL_THEME.text, fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 }} numberOfLines={2}>{drawn.card.n}</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, textAlign: 'center', lineHeight: 13, marginTop: 2 }} numberOfLines={2}>
                  {drawn.reversed ? drawn.card.rev : drawn.card.up}
                </Text>
              </View>
            );
          })}
        </View>
        {spreadReading ? (
          <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '22' }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 21, fontStyle: 'italic', marginBottom: 8 }}>{spreadReading}</Text>
            <TouchableOpacity onPress={() => setSpreadReading(null)}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: mono }}>✕ clear reading</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => generateSpreadReading(dailySpread)}
            disabled={spreadLoading}
            style={{ paddingVertical: 10, borderRadius: 8, backgroundColor: ZODIAC_INDIGO + (spreadLoading ? '66' : 'CC'), alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {spreadLoading ? 'Weaving the thread...' : 'Read the Spread ☽'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 5. TODAY'S SKY — sun transit, moon sign, phase */}
      <View style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A4A', backgroundColor: '#07071A', marginBottom: 16, overflow: 'hidden' }}>
        {/* Atmospheric stars */}
        <Text style={{ position: 'absolute', top: 8,  right: 18, color: '#FFFFFF22', fontSize: 7, fontFamily: mono }}>·</Text>
        <Text style={{ position: 'absolute', top: 22, right: 36, color: '#FFFFFF18', fontSize: 5, fontFamily: mono }}>·</Text>
        <Text style={{ position: 'absolute', top: 12, right: 54, color: '#C8A96E33', fontSize: 8, fontFamily: mono }}>◦</Text>
        <Text style={{ position: 'absolute', bottom: 10, left: 20, color: '#FFFFFF11', fontSize: 6, fontFamily: mono }}>·</Text>
        <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 14 }}>☀ TODAY'S SKY</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#C8A96E88', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>SUN TRANSITING</Text>
            <Text style={{ color: todaySun.color, fontSize: 26, lineHeight: 30, marginBottom: 2 }}>{todaySun.glyph}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{todaySun.name}</Text>
            <Text style={{ color: '#AAAACC', fontSize: 10, marginTop: 1 }}>{todaySun.element} · {todaySun.keywords.split(' · ')[0]}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#FFFFFF11', marginHorizontal: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>MOON IN</Text>
            <Text style={{ color: todayMoon.color, fontSize: 26, lineHeight: 30, marginBottom: 2 }}>{todayMoon.glyph}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{todayMoon.name}</Text>
            <Text style={{ color: '#AAAACC', fontSize: 10, marginTop: 1 }}>{todayMoon.element} · {todayMoon.keywords.split(' · ')[0]}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#FFFFFF11' }}>
          <Text style={{ fontSize: 24 }}>{moonPhase.glyph}</Text>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{moonPhase.name}</Text>
            <Text style={{ color: '#AAAACC', fontSize: 10 }}>Tonight's phase</Text>
          </View>
        </View>
      </View>

      {/* 5. YOUR CHART — natal data */}
      {birthData && !editingBirth && sunSign && (
        <View style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '66', backgroundColor: ZODIAC_INDIGO + '0C', marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ position: 'absolute', top: -18, right: -6, fontSize: 88, color: ZODIAC_INDIGO + '0C', lineHeight: 100, fontFamily: mono }}>⊚</Text>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 14 }}>⊚ YOUR NATAL CHART</Text>

          {/* Sun */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: ZODIAC_INDIGO + '22' }}>
            <View style={{ width: 44, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>☀</Text>
              <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontFamily: mono, marginTop: 2, fontWeight: '700', letterSpacing: 0.5 }}>SUN</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700' }}>{sunSign.glyph} {sunSign.name}</Text>
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: sunSign.color + '22' }}>
                  <Text style={{ color: sunSign.color, fontSize: 9, fontWeight: '700' }}>{sunSign.element}</Text>
                </View>
              </View>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{sunSign.modality} · {sunSign.keywords}</Text>
            </View>
          </View>

          {/* Moon */}
          {moonSign && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: ZODIAC_INDIGO + '22' }}>
              <View style={{ width: 44, alignItems: 'center' }}>
                <Text style={{ fontSize: 28 }}>☽</Text>
                <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontFamily: mono, marginTop: 2, fontWeight: '700', letterSpacing: 0.5 }}>MOON</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700' }}>{moonSign.glyph} {moonSign.name}</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: moonSign.color + '22' }}>
                    <Text style={{ color: moonSign.color, fontSize: 9, fontWeight: '700' }}>{moonSign.element}</Text>
                  </View>
                </View>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{moonSign.modality} · {moonSign.keywords}</Text>
              </View>
            </View>
          )}

          {/* Rising */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ width: 44, alignItems: 'center' }}>
              <Text style={{ fontSize: 28 }}>↑</Text>
              <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontFamily: mono, marginTop: 2, fontWeight: '700', letterSpacing: 0.5 }}>RISING</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              {ascSign ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700' }}>{ascSign.glyph} {ascSign.name}</Text>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: ascSign.color + '22' }}>
                      <Text style={{ color: ascSign.color, fontSize: 9, fontWeight: '700' }}>{ascSign.element}</Text>
                    </View>
                  </View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{ascSign.modality} · {ascSign.keywords}</Text>
                </>
              ) : (
                <View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>Birth time required</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>Add hour + UTC offset to calculate your ascendant</Text>
                </View>
              )}
            </View>
          </View>

          {/* Edit birth data */}
          <TouchableOpacity
            onPress={() => { setBirthDraft({ day: String(birthData.day), month: String(birthData.month), year: String(birthData.year), hour: birthData.hasTime ? String(Math.floor(birthData.hour)) : '', minute: birthData.hasTime ? String(Math.round((birthData.hour % 1) * 60)) : '', utcOffset: String(birthData.utcOffset), latitude: String(birthData.latitude), fullName: birthData.fullName || '', motherName: birthData.motherName || '', cityName: birthData.cityName || '' }); setEditingBirth(true); }}
            style={{ alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: SOL_THEME.border }}
          >
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>Edit birth data · {birthData.day}/{birthData.month}/{birthData.year}{birthData.hasTime ? ` · ${Math.floor(birthData.hour)}:${String(Math.round((birthData.hour % 1) * 60)).padStart(2, '0')}` : ''}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No birth data — CTA */}
      {!birthData && !editingBirth && (
        <View style={{ padding: 20, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: SOL_THEME.surface, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 28, marginBottom: 10 }}>✦</Text>
          <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Reveal your natal chart</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 16 }}>
            Your sun, moon, and rising signs — calculated from the real positions of the sky at the moment you were born.
          </Text>
          <TouchableOpacity
            onPress={() => setEditingBirth(true)}
            style={{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, backgroundColor: ZODIAC_INDIGO }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Reveal My Chart</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PSI PRACTICE LOG */}
      <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: PSI_PURPLE + '33', backgroundColor: PSI_PURPLE + '08', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: PSI_PURPLE, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>ψ PSI PRACTICE</Text>
          <TouchableOpacity onPress={() => { setShowPsiForm(true); }} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: PSI_PURPLE + '55', backgroundColor: PSI_PURPLE + '18' }}>
            <Text style={{ color: PSI_PURPLE, fontSize: 10, fontWeight: '700' }}>+ Log Session</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, lineHeight: 15, marginBottom: showPsiForm || psiLog.length > 0 ? 12 : 0, fontStyle: 'italic' }}>
          Remote viewing · precognition · ganzfeld. Log impressions before verification. Let the record speak.
        </Text>

        {/* New session form */}
        {showPsiForm && (
          <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: PSI_PURPLE + '44', marginBottom: 12 }}>
            {/* Type picker */}
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 6 }}>PRACTICE TYPE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {(['RV', 'PREC', 'GANZFELD', 'GENERAL'] as PsiEntryType[]).map(t => (
                <TouchableOpacity key={t} onPress={() => setPsiDraft(d => ({ ...d, type: t }))}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: psiDraft.type === t ? PSI_PURPLE : SOL_THEME.border, backgroundColor: psiDraft.type === t ? PSI_PURPLE + '22' : 'transparent' }}>
                  <Text style={{ color: psiDraft.type === t ? PSI_PURPLE : SOL_THEME.textMuted, fontSize: 10, fontWeight: '700' }}>{PSI_TYPE_LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Target */}
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>TARGET / PROMPT</Text>
            <TextInput
              value={psiDraft.target} onChangeText={v => setPsiDraft(d => ({ ...d, target: v }))}
              placeholder="Coordinates, image ID, event to predict..."
              placeholderTextColor={SOL_THEME.textMuted + '88'}
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 12, marginBottom: 10 }}
            />

            {/* Impressions */}
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>IMPRESSIONS (before reveal)</Text>
            <TextInput
              value={psiDraft.impression} onChangeText={v => setPsiDraft(d => ({ ...d, impression: v }))}
              placeholder="What came through — images, feelings, words..."
              placeholderTextColor={SOL_THEME.textMuted + '88'}
              multiline numberOfLines={3}
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 12, marginBottom: 10, minHeight: 64, textAlignVertical: 'top' }}
            />

            {/* Outcome */}
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>OUTCOME / VERIFICATION (optional)</Text>
            <TextInput
              value={psiDraft.outcome} onChangeText={v => setPsiDraft(d => ({ ...d, outcome: v }))}
              placeholder="What was the actual target / what happened?"
              placeholderTextColor={SOL_THEME.textMuted + '88'}
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 12, marginBottom: 10 }}
            />

            {/* Result */}
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 6 }}>RESULT</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {(['pending', 'hit', 'partial', 'miss'] as PsiResult[]).map(r => (
                <TouchableOpacity key={r} onPress={() => setPsiDraft(d => ({ ...d, result: r }))}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: psiDraft.result === r ? PSI_RESULT_COLOR[r] : SOL_THEME.border, backgroundColor: psiDraft.result === r ? PSI_RESULT_COLOR[r] + '22' : 'transparent' }}>
                  <Text style={{ color: psiDraft.result === r ? PSI_RESULT_COLOR[r] : SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => { setShowPsiForm(false); setPsiDraft({ type: 'RV', target: '', impression: '', outcome: '', result: 'pending' }); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={savePsiEntry} disabled={!psiDraft.impression.trim()}
                style={{ flex: 2, paddingVertical: 10, borderRadius: 8, backgroundColor: psiDraft.impression.trim() ? PSI_PURPLE : SOL_THEME.border, alignItems: 'center' }}>
                <Text style={{ color: psiDraft.impression.trim() ? '#fff' : SOL_THEME.textMuted, fontSize: 12, fontWeight: '700' }}>Save Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Log entries */}
        {psiLog.length > 0 && (
          <>
            {(psiExpanded ? psiLog : psiLog.slice(0, 3)).map(entry => (
              <View key={entry.id} style={{ borderTopWidth: 1, borderTopColor: SOL_THEME.border, paddingTop: 10, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>{entry.date}</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: PSI_PURPLE + '22' }}>
                    <Text style={{ color: PSI_PURPLE, fontSize: 9, fontWeight: '700' }}>{entry.type}</Text>
                  </View>
                  {/* Inline result updater if pending */}
                  {entry.result === 'pending' && entry.outcome ? (
                    <View style={{ flexDirection: 'row', gap: 4, marginLeft: 'auto' }}>
                      {(['hit', 'partial', 'miss'] as PsiResult[]).map(r => (
                        <TouchableOpacity key={r} onPress={() => updatePsiResult(entry.id, r)}
                          style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: PSI_RESULT_COLOR[r] + '66' }}>
                          <Text style={{ color: PSI_RESULT_COLOR[r], fontSize: 9, fontWeight: '700' }}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={{ marginLeft: 'auto', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: PSI_RESULT_COLOR[entry.result] + '22' }}>
                      <Text style={{ color: PSI_RESULT_COLOR[entry.result], fontSize: 9, fontWeight: '700' }}>{entry.result.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                {entry.target ? <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginBottom: 3, fontStyle: 'italic' }}>Target: {entry.target}</Text> : null}
                <Text style={{ color: SOL_THEME.text, fontSize: 12, lineHeight: 17 }} numberOfLines={3}>{entry.impression}</Text>
                {entry.outcome ? <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 3, fontStyle: 'italic' }}>Outcome: {entry.outcome}</Text> : null}
              </View>
            ))}
            {psiLog.length > 3 && (
              <TouchableOpacity onPress={() => setPsiExpanded(e => !e)} style={{ alignItems: 'center', paddingTop: 10 }}>
                <Text style={{ color: PSI_PURPLE, fontSize: 10, fontWeight: '700' }}>{psiExpanded ? '▲ Show less' : `▼ Show all ${psiLog.length} sessions`}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {psiLog.length === 0 && !showPsiForm && (
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, textAlign: 'center', paddingVertical: 8 }}>No sessions logged yet.</Text>
        )}
      </View>

      {/* Birth data entry form */}
      {editingBirth && (
        <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', backgroundColor: SOL_THEME.surface, marginBottom: 16 }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 14 }}>BIRTH DATA</Text>

          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>DATE (required)</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {([['Day', 'day', '2'], ['Month', 'month', '2'], ['Year', 'year', '4']] as const).map(([label, key, maxLen]) => (
              <View key={key} style={{ flex: 1 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 1, marginBottom: 3, fontFamily: mono }}>{label}</Text>
                <TextInput
                  style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', padding: 10, color: SOL_THEME.text, fontSize: 15, textAlign: 'center', fontWeight: '700' }}
                  value={birthDraft[key]}
                  onChangeText={v => setBirthDraft(d => ({ ...d, [key]: v.replace(/[^0-9]/g, '') }))}
                  keyboardType="number-pad"
                  maxLength={parseInt(maxLen)}
                  placeholder={key === 'year' ? '1995' : key === 'month' ? '06' : '14'}
                  placeholderTextColor={SOL_THEME.textMuted + '66'}
                />
              </View>
            ))}
          </View>

          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>BIRTH TIME (optional — needed for rising sign)</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 1, marginBottom: 3, fontFamily: mono }}>Hour (24h)</Text>
              <TextInput
                style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', padding: 10, color: SOL_THEME.text, fontSize: 15, textAlign: 'center', fontWeight: '700' }}
                value={birthDraft.hour}
                onChangeText={v => setBirthDraft(d => ({ ...d, hour: v.replace(/[^0-9]/g, '') }))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="14"
                placeholderTextColor={SOL_THEME.textMuted + '66'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 1, marginBottom: 3, fontFamily: mono }}>Minute</Text>
              <TextInput
                style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', padding: 10, color: SOL_THEME.text, fontSize: 15, textAlign: 'center', fontWeight: '700' }}
                value={birthDraft.minute}
                onChangeText={v => setBirthDraft(d => ({ ...d, minute: v.replace(/[^0-9]/g, '') }))}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="30"
                placeholderTextColor={SOL_THEME.textMuted + '66'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 1, marginBottom: 3, fontFamily: mono }}>UTC Offset</Text>
              <TextInput
                style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', padding: 10, color: SOL_THEME.text, fontSize: 15, textAlign: 'center', fontWeight: '700' }}
                value={birthDraft.utcOffset}
                onChangeText={v => setBirthDraft(d => ({ ...d, utcOffset: v }))}
                keyboardType="numbers-and-punctuation"
                maxLength={4}
                placeholder="+1"
                placeholderTextColor={SOL_THEME.textMuted + '66'}
              />
            </View>
          </View>

          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>LATITUDE (optional — for rising sign)</Text>
          <TextInput
            style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', padding: 10, color: SOL_THEME.text, fontSize: 15, textAlign: 'center', fontWeight: '700', marginBottom: 16 }}
            value={birthDraft.latitude}
            onChangeText={v => setBirthDraft(d => ({ ...d, latitude: v }))}
            keyboardType="numbers-and-punctuation"
            maxLength={7}
            placeholder="51.5"
            placeholderTextColor={SOL_THEME.textMuted + '66'}
          />

          <View style={{ marginBottom: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '22' }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 10 }}>✦ FOR A PERSONAL READING (optional)</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, lineHeight: 14, marginBottom: 12, fontStyle: 'italic' }}>
              Sol addresses you by name and lineage. Stored only on your device.
            </Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>YOUR FULL NAME</Text>
            <TextInput
              style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '33', padding: 10, color: SOL_THEME.text, fontSize: 13, marginBottom: 10 }}
              value={birthDraft.fullName}
              onChangeText={v => setBirthDraft(d => ({ ...d, fullName: v }))}
              placeholder="Your full birth name"
              placeholderTextColor={SOL_THEME.textMuted + '66'}
              autoCapitalize="words"
            />
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>MOTHER'S FIRST NAME</Text>
            <TextInput
              style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '33', padding: 10, color: SOL_THEME.text, fontSize: 13, marginBottom: 10 }}
              value={birthDraft.motherName}
              onChangeText={v => setBirthDraft(d => ({ ...d, motherName: v }))}
              placeholder="Your mother's first name"
              placeholderTextColor={SOL_THEME.textMuted + '66'}
              autoCapitalize="words"
            />
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>BIRTHPLACE (city, country)</Text>
            <TextInput
              style={{ backgroundColor: SOL_THEME.background, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '33', padding: 10, color: SOL_THEME.text, fontSize: 13 }}
              value={birthDraft.cityName}
              onChangeText={v => setBirthDraft(d => ({ ...d, cityName: v }))}
              placeholder="e.g. Dunedin, New Zealand"
              placeholderTextColor={SOL_THEME.textMuted + '66'}
              autoCapitalize="words"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={saveBirth}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: ZODIAC_INDIGO, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Calculate Chart</Text>
            </TouchableOpacity>
            {birthData && (
              <TouchableOpacity
                onPress={() => setEditingBirth(false)}
                style={{ paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
