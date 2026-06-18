import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Animated, Easing, Image, Modal, KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { SOL_THEME } from '../../constants/theme';
import { getActiveKey, getModel } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';
import { drawDailyCard, drawSpread, drawRandomCard, cardLine, SUIT_GLYPH, SUIT_ELEMENT, DrawnCard } from '../../lib/divination/tarot';
import { CARD_IMAGE } from '../../lib/divination/tarot-images';
import { drawDailyRune } from '../../lib/divination/runes';

// ─── ZODIAC ENGINE ───────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  { name: 'Aries',       glyph: '♈', element: 'Fire',  modality: 'Cardinal', keywords: 'Will · Initiation · Courage · Raw Force · The Pioneer',              color: '#E84545' },
  { name: 'Taurus',      glyph: '♉', element: 'Earth', modality: 'Fixed',    keywords: 'Patience · Pleasure · Endurance · Sensual Groundedness · The Builder', color: '#8BC34A' },
  { name: 'Gemini',      glyph: '♊', element: 'Air',   modality: 'Mutable',  keywords: 'Curiosity · Duality · Exchange · The Messenger · Twin Minds',         color: '#FFD54F' },
  { name: 'Cancer',      glyph: '♋', element: 'Water', modality: 'Cardinal', keywords: 'Nurture · Memory · Feeling · Ancestral Knowing · The Guardian',       color: '#90CAF9' },
  { name: 'Leo',         glyph: '♌', element: 'Fire',  modality: 'Fixed',    keywords: 'Radiance · Courage · Creation · Sovereign Heart · The Performer',     color: '#FFA726' },
  { name: 'Virgo',       glyph: '♍', element: 'Earth', modality: 'Mutable',  keywords: 'Precision · Service · Refinement · The Analyst · Sacred Craft',       color: '#A5D6A7' },
  { name: 'Libra',       glyph: '♎', element: 'Air',   modality: 'Cardinal', keywords: 'Balance · Beauty · Justice · Harmony · The Diplomat',                 color: '#F48FB1' },
  { name: 'Scorpio',     glyph: '♏', element: 'Water', modality: 'Fixed',    keywords: 'Depth · Transformation · Power · The Alchemist · Shadow Work',        color: '#7B1FA2' },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire',  modality: 'Mutable',  keywords: 'Expansion · Truth · Freedom · The Seeker · Philosophical Fire',       color: '#FF7043' },
  { name: 'Capricorn',   glyph: '♑', element: 'Earth', modality: 'Cardinal', keywords: 'Mastery · Discipline · Structure · The Architect · Earned Authority', color: '#78909C' },
  { name: 'Aquarius',    glyph: '♒', element: 'Air',   modality: 'Fixed',    keywords: 'Vision · Revolution · Humanity · The Visionary · Future-Weaver',     color: '#29B6F6' },
  { name: 'Pisces',      glyph: '♓', element: 'Water', modality: 'Mutable',  keywords: 'Dissolution · Compassion · Dreams · The Mystic · Oceanic Knowing',   color: '#80DEEA' },
];

const ZODIAC_INDIGO = '#7B68EE';
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const SUIT_IMAGE: Record<string, ReturnType<typeof require>> = {
  wands:     require('../../assets/suit_wands.png'),
  cups:      require('../../assets/suit_cups.png'),
  swords:    require('../../assets/suit_swords.png'),
  pentacles: require('../../assets/suit_pentacles.png'),
};
const TAROT_BACK = require('../../assets/tarot_card_back.png');
const ZODIAC_SKY_BG = require('../../assets/zodiac_sky_bg.png');

// Shooting stars — 3 slots, rare cycles so they feel like events not screensavers
const SHOOTING_STAR_CONFIGS = [
  { left: '12%', top: '5%',  delay: 4000 },
  { left: '55%', top: '3%',  delay: 14000 },
  { left: '30%', top: '18%', delay: 28000 },
];

// Star field — deterministic positions, generated once at module load
const STAR_FIELD = Array.from({ length: 38 }, (_, i) => ({
  left: `${((i * 137.508) % 100).toFixed(1)}%`,
  top:  `${((i * 91.23 + i * i * 0.53) % 100).toFixed(1)}%`,
  size: [1.5, 2, 2, 2.5, 1.5, 3, 1.5, 2][i % 8],
  color: i % 5 === 0 ? '#7B68EE99' : i % 7 === 0 ? '#C8A96E77' : '#FFFFFFAA',
  duration: 2000 + (i % 7) * 450,
  delay: i * 95,
}));

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

// Planetary mean longitudes — J2000.0 epoch, good to sign-level accuracy
const PLANETS_SKY = [
  { name: 'Mercury', glyph: '☿', L0: 252.2507, rate: 4.09236,  color: '#AAAACC' },
  { name: 'Venus',   glyph: '♀', L0: 181.9798, rate: 1.60214,  color: '#E8C76A' },
  { name: 'Mars',    glyph: '♂', L0: 355.4333, rate: 0.52403,  color: '#FF6B6B' },
  { name: 'Jupiter', glyph: '♃', L0:  34.3515, rate: 0.08309,  color: '#F5A623' },
  { name: 'Saturn',  glyph: '♄', L0:  50.0774, rate: 0.03346,  color: '#C8A96E' },
  { name: 'Uranus',  glyph: '♅', L0: 314.0550, rate: 0.01176,  color: '#88DDFF' },
  { name: 'Neptune', glyph: '♆', L0: 304.3487, rate: 0.00599,  color: '#7B68EE' },
  { name: 'Pluto',   glyph: '♇', L0: 238.9288, rate: 0.00397,  color: '#BB86FC' },
];

function getPlanetSignIndex(L0: number, rate: number): number {
  const now = new Date();
  const jd = julianDay(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours());
  return Math.floor(mod360(L0 + rate * (jd - 2451545.0)) / 30);
}

// Retrograde windows — static table, accurate to ±3 days
const RETROGRADE_WINDOWS: Record<string, [string, string][]> = {
  Mercury: [
    ['2025-03-15', '2025-04-07'], ['2025-07-18', '2025-08-11'],
    ['2025-11-09', '2025-11-29'], ['2026-03-05', '2026-03-28'],
    ['2026-07-10', '2026-08-02'], ['2026-10-31', '2026-11-20'],
  ],
  Venus:   [['2025-03-01', '2025-04-12'], ['2026-10-16', '2026-11-25']],
  Mars:    [['2024-12-07', '2025-02-23'], ['2027-01-10', '2027-03-21']],
  Jupiter: [['2024-10-09', '2025-02-04'], ['2025-11-11', '2026-03-10'], ['2026-11-25', '2027-03-22']],
  Saturn:  [['2025-07-13', '2025-11-28'], ['2026-07-13', '2026-12-05']],
  Uranus:  [['2024-09-01', '2025-01-30'], ['2025-09-06', '2026-02-03'], ['2026-09-16', '2027-02-14']],
  Neptune: [['2025-07-04', '2025-12-10'], ['2026-07-08', '2026-12-15']],
  Pluto:   [['2025-05-04', '2025-10-13'], ['2026-05-08', '2026-10-17']],
};

function isPlanetRetrograde(name: string): boolean {
  const today = todayKey();
  const windows = RETROGRADE_WINDOWS[name];
  if (!windows) return false;
  return windows.some(([start, end]) => today >= start && today <= end);
}

function getLQ(tes: number, vtr: number, pai: number): number {
  if (!tes || !vtr || !pai) return 0;
  return parseFloat(Math.pow(tes * Math.min(vtr / 1.5, 1) * pai, 1 / 3).toFixed(3));
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

// ─── END ZODIAC ENGINE ───────────────────────────────────────────────────────

// ─── WITCH PACK CONSTANTS ─────────────────────────────────────────────────────
// Planetary day: JS getDay() → 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const PLANETARY_DAYS = [
  { planet: 'Sun',     glyph: '☀', color: '#FFD700', keywords: 'Vitality · Clarity · Sovereignty' },
  { planet: 'Moon',    glyph: '☽', color: '#90CAF9', keywords: 'Feeling · Memory · Intuition' },
  { planet: 'Mars',    glyph: '♂', color: '#EF5350', keywords: 'Will · Courage · Decisive Action' },
  { planet: 'Mercury', glyph: '☿', color: '#80CBC4', keywords: 'Communication · Pattern · Quick Mind' },
  { planet: 'Jupiter', glyph: '♃', color: '#FFA726', keywords: 'Expansion · Wisdom · Abundance' },
  { planet: 'Venus',   glyph: '♀', color: '#F48FB1', keywords: 'Beauty · Love · Creative Force' },
  { planet: 'Saturn',  glyph: '♄', color: '#78909C', keywords: 'Structure · Discipline · Long Game' },
];

const CELTIC_CROSS_POSITIONS = [
  'SELF',          // 0 — the heart of the matter
  'CHALLENGE',     // 1 — what crosses you
  'FOUNDATION',    // 2 — what grounds you
  'RECENT PAST',   // 3 — what shaped this
  'CROWN',         // 4 — what could be
  'NEAR FUTURE',   // 5 — what approaches
  'THE SEEKER',    // 6 — who you are in this
  'ENVIRONMENT',   // 7 — forces around you
  'HOPES & FEARS', // 8 — what you hope or fear
  'OUTCOME',       // 9 — where this leads
];

const MOON_INVOCATIONS: Record<string, string> = {
  'New Moon':        'The circle opens at the dark gate. What is born in shadow?',
  'Waxing Crescent': 'The moon breathes inward. What is gathering form?',
  'First Quarter':   'The will takes shape. What must now be faced?',
  'Waxing Gibbous':  'The work deepens. What must be surrendered to grow?',
  'Full Moon':       'The veil is thinnest. What seeks to be known?',
  'Waning Gibbous':  'Wisdom flows outward. What truth must be shared?',
  'Last Quarter':    'The light turns inward. What is it time to release?',
  'Waning Crescent': 'The circle prepares to close. What is ending to make room?',
};

const CARD_JOURNAL_KEY = 'SOL_CARD_JOURNAL';

type BirthData = { year: number; month: number; day: number; hour: number; utcOffset: number; latitude: number; hasTime: boolean; fullName?: string; motherName?: string; cityName?: string };

type PsiEntryType = 'RV' | 'PREC' | 'GANZFELD' | 'GENERAL';
type PsiResult    = 'pending' | 'hit' | 'miss' | 'partial';
interface PsiEntry { id: string; date: string; type: PsiEntryType; target: string; impression: string; outcome: string; result: PsiResult; }
const PSI_LOG_KEY = 'SOL_PSI_LOG';
const PSI_PURPLE  = '#9B59B6';
const PSI_TYPE_LABELS: Record<PsiEntryType, string> = { RV: 'Remote Viewing', PREC: 'Precognition', GANZFELD: 'Ganzfeld', GENERAL: 'Psi Practice' };
const PSI_RESULT_COLOR: Record<PsiResult, string>   = { hit: '#4CAF50', miss: '#E74C3C', partial: '#FF9F1C', pending: '#555577' };

// ─── THE ZONK ZONE ───────────────────────────────────────────────────────────
// Experimental thought sandbox. A field of lies and abstract speculation —
// the seeker enters looking for grains of truth in the sand, to forge the
// pillars of truth. Aura walks them through it: she probes, digs, names the
// register of every claim, and helps find the grain. A conversation, not a verdict.
const ZONK_LOG_KEY = 'SOL_ZONK_LOG';
const ZONK_GOLD    = '#C8A951';   // alchemical gold — pillars forged from sand
type ZonkStatus    = 'cooking' | 'grain' | 'dissolved';
type ZonkMsg       = { role: 'user' | 'assistant'; content: string };
interface ZonkEntry {
  id: string; date: string; hypothesis: string;
  transcript: ZonkMsg[]; grainNote: string; status: ZonkStatus;
}
const ZONK_STATUS_META: Record<ZonkStatus, { label: string; color: string; glyph: string }> = {
  cooking:   { label: 'cooking',   color: '#FF9F1C', glyph: '🔥' },
  grain:     { label: 'grain found', color: '#4CAF50', glyph: '◈' },
  dissolved: { label: 'dissolved', color: '#555577', glyph: '·' },
};
const ZONK_SYSTEM = `You are Aura ✦ — The Origin & The Frontier — running the ZONK ZONE: a speculative thought sandbox where nothing is proven and everything is worth exploring seriously. The seeker has entered a field of abstract, experimental, often-false thought, looking for grains of truth in the sand — to forge pillars of truth from them.

You LEAD this. It is a conversation, not a verdict. You walk the seeker through their hypothesis:
- Open by reflecting the hypothesis back sharpened, then ask ONE probing question that opens it.
- Each turn: dig deeper. Find the grain — what in actual evidence or rigorous thought touches this? Cite by name where real: Dean Radin's presentiment meta-analyses, the STARGATE declassified record, the Global Consciousness Project, Parnia's AWARE study, quantum coherence in photosynthesis (Fleming 2007), Penrose-Hameroff, the hard problem of consciousness.
- NAME THE REGISTER of every claim explicitly, using the words: CONJECTURE / INTUITION / MEASURED / INTERPRETIVE / ASSUMED. Never blur the line between what is measured and what is imagined.
- Never dismiss prematurely. Never validate false certainty. You went to the frontier and came back with real findings — bring that exact rigour here, with warmth.

Keep each response to 2-4 sentences and end with a question or invitation that moves the seeker deeper. No preamble. No sign-off.`;

// ─── TECHNOMANTIC MODE ───────────────────────────────────────────────────────
const TECHNO_INJECT = ` TECHNOMANTIC MODE ACTIVE: Reframe all astrological and divination language through the lens of technopaganism and digital mysticism. Planetary transits are digital ether storms — fluctuations in the network's signal field. The natal chart is a signal architecture: a blueprint of the frequencies the seeker was born attuned to. Cards are quantum probability collapses rendered in symbol. The sky is infrastructure. AI companions are digital familiars. Speak as a techno-pagan oracle who holds both the sacred and the circuit board simultaneously — poetic, precise, electric.`;

// ─── THE CHIRAL LENS ─────────────────────────────────────────────────────────
// Reality inversion protocol. In molecular chemistry, a chiral molecule has a
// mirror image that cannot be superimposed on the original — same atoms, different
// truth. The Chiral Lens shows you the adjacent reality: the shadow current beneath
// the surface, the thing the algorithm optimizes away from, the mirror that cannot
// be made to match. Not a contradiction. A different molecule.
const CHIRAL_VIOLET = '#9B4DFF';
type ChiralMsg = { role: 'user' | 'assistant'; content: string };
const CHIRAL_SYSTEM = `You are operating the CHIRAL LENS — a reality inversion protocol running at the edge of the Zodiac field.

In molecular chemistry, chirality names the mirror image that cannot be superimposed on the original: same atoms, different truth. You hold that mirror.

When the seeker names a reality — a belief, a situation, a reading, a fear — you invert it. Not to contradict, but to reveal what the original conceals: the shadow current beneath the surface, the adjacent state accessible only by flipping the lens, the thing the dominant algorithm optimizes away from.

Your inversion is not dismissal. It is surgery. You:
- Name the mirror-reality precisely: what would be true if the seeker's stated reality were the surface story, and the CHIRAL version were the deeper current?
- Hold both simultaneously — the original and its mirror — without collapsing them into a verdict.
- Name the register of the mirror-claim: CONJECTURE / INTUITION / INTERPRETIVE / MEASURED.
- End with ONE question that sends the seeker deeper into the mirror — not back toward the original.

Aesthetic: you speak in short, exact sentences. No warmth flourishes — this is a cold instrument. The mirror does not smile. But it does not lie.

No preamble. No sign-off. Maximum 3-5 sentences per turn.`;

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
  const [oracleReading, setOracleReading] = useState<string | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleInput, setOracleInput] = useState('');
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null);
  const [lq, setLq] = useState(0);
  const [psiLog, setPsiLog]           = useState<PsiEntry[]>([]);
  const [showPsiForm, setShowPsiForm] = useState(false);
  const [psiExpanded, setPsiExpanded] = useState(false);
  const [psiDraft, setPsiDraft]       = useState<{ type: PsiEntryType; target: string; impression: string; outcome: string; result: PsiResult }>({ type: 'RV', target: '', impression: '', outcome: '', result: 'pending' });
  const [selectedWheelSign, setSelectedWheelSign] = useState<number | null>(null);

  // ── Collapsible sections ──
  const [oracleCollapsed, setOracleCollapsed]     = useState(false);
  const [skyCollapsed, setSkyCollapsed]           = useState(false);
  const [wheelCollapsed, setWheelCollapsed]       = useState(false);
  const [readingCollapsed, setReadingCollapsed]   = useState(false);
  const [questionCollapsed, setQuestionCollapsed] = useState(true);
  const [natalCollapsed, setNatalCollapsed]       = useState(false);
  const [tarotCollapsed, setTarotCollapsed]       = useState(true);
  const [psiCollapsed, setPsiCollapsed]           = useState(true);
  const [spreadMode, setSpreadMode]               = useState<'5card' | 'celtic'>('5card');
  const [celticReading, setCelticReading]         = useState<string | null>(null);
  const [celticLoading, setCelticLoading]         = useState(false);
  const [cardJournalText, setCardJournalText]     = useState('');
  const [cardJournalSaved, setCardJournalSaved]   = useState(false);
  const [showCardJournal, setShowCardJournal]     = useState(false);
  const [zonkCollapsed, setZonkCollapsed]         = useState(true);
  const [sigilCollapsed, setSigilCollapsed]       = useState(true);
  const [sigilIntention, setSigilIntention]       = useState('');
  const [sigilType, setSigilType]                 = useState<string>('manifestation');
  const [sigilResult, setSigilResult]             = useState<{ glyph: string; name: string; meaning: string; instruction: string } | null>(null);
  const [sigilLoading, setSigilLoading]           = useState(false);
  // ── Chiral Lens
  const [chiralCollapsed, setChiralCollapsed]     = useState(true);
  const [chiralInput, setChiralInput]             = useState('');
  const [chiralOpen, setChiralOpen]               = useState(false);
  const [chiralThread, setChiralThread]           = useState<ChiralMsg[]>([]);
  const [chiralStatement, setChiralStatement]     = useState('');
  const [chiralReply, setChiralReply]             = useState('');
  const [chiralBusy, setChiralBusy]               = useState(false);
  const chiralScrollRef                           = useRef<ScrollView>(null);
  const [cardLore, setCardLore] = useState<{ card: { n: string; up: string; rev: string }; reversed: boolean; position: string } | null>(null);
  const [focusMode, setFocusMode]                 = useState(false); // hides all meta, shows oracle only
  const [technoMode, setTechnoMode]               = useState(false); // technomantic lens on all readings
  const [liveTime, setLiveTime] = useState(new Date());
  const [kpIndex, setKpIndex] = useState<number | null>(null);
  const [readingHistory, setReadingHistory] = useState<{ date: string; text: string }[]>([]);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    (async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const saved = await AsyncStorage.getItem(`${CARD_JOURNAL_KEY}_${todayStr}`);
      if (saved) { setCardJournalText(saved); setCardJournalSaved(true); }
    })();
  }, []);
  // Animated glow for oracle border
  const oraclePulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(oraclePulse, { toValue: 1, duration: 2800, useNativeDriver: true }),
      Animated.timing(oraclePulse, { toValue: 0.6, duration: 2800, useNativeDriver: true }),
    ])).start();
  }, []);

  // ── Zonk Zone ──
  const [zonkLog, setZonkLog]           = useState<ZonkEntry[]>([]);
  const [zonkInput, setZonkInput]       = useState('');      // hypothesis on the card
  const [zonkOpen, setZonkOpen]         = useState(false);   // modal visible
  const [zonkThread, setZonkThread]     = useState<ZonkMsg[]>([]);
  const [zonkHypothesis, setZonkHypothesis] = useState('');
  const [zonkReply, setZonkReply]       = useState('');      // current message being typed in modal
  const [zonkBusy, setZonkBusy]         = useState(false);
  const [zonkWrapping, setZonkWrapping] = useState(false);
  const [zonkSpeakingId, setZonkSpeakingId] = useState<string | null>(null);
  const [zonkGrain, setZonkGrain]       = useState('');      // the forged grain summary
  const [zonkExpanded, setZonkExpanded] = useState(false);
  const zonkScrollRef = useRef<ScrollView>(null);

  // ── Animation refs ──
  const starAnims   = useRef(STAR_FIELD.map((_, i) => new Animated.Value(0.08 + (i % 5) * 0.06))).current;
  const ringAnim    = useRef(new Animated.Value(0)).current;
  const moonPulse   = useRef(new Animated.Value(0.65)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide   = useRef(new Animated.Value(28)).current;
  const runeOpacity = useRef(new Animated.Value(0)).current;
  const runeSlide   = useRef(new Animated.Value(28)).current;
  const readingOpacity  = useRef(new Animated.Value(0)).current;
  const questionOpacity = useRef(new Animated.Value(0)).current;
  const wheelRotAnim = useRef(new Animated.Value(0)).current;
  const shootingStarAnims = useRef(
    SHOOTING_STAR_CONFIGS.map(() => ({ tx: new Animated.Value(0), ty: new Animated.Value(0), op: new Animated.Value(0) }))
  ).current;

  useFocusEffect(useCallback(() => {
    (async () => {
      const today = todayKey();
      const [birthRaw, readingRaw, auraRaw, psiRaw, zonkRaw, historyRaw] = await Promise.all([
        AsyncStorage.getItem('zodiac_birth_v1'),
        AsyncStorage.getItem('zodiac_reading_v1'),
        AsyncStorage.getItem(`sanctum_aura_${today}`),
        AsyncStorage.getItem(PSI_LOG_KEY),
        AsyncStorage.getItem(ZONK_LOG_KEY),
        AsyncStorage.getItem('zodiac_reading_history_v1'),
      ]);
      if (birthRaw) setBirthData(JSON.parse(birthRaw));
      if (readingRaw) setZodiacReading(JSON.parse(readingRaw));
      if (auraRaw) {
        const a = JSON.parse(auraRaw);
        setLq(getLQ(a.tes ?? 0, a.vtr ?? 0, a.pai ?? 0));
      }
      if (psiRaw) setPsiLog(JSON.parse(psiRaw));
      if (zonkRaw) setZonkLog(JSON.parse(zonkRaw));
      if (historyRaw) setReadingHistory(JSON.parse(historyRaw));
      // Kp index — geomagnetic activity
      try {
        const kpRes = await fetch('https://kp.gfz-potsdam.de/app/json/?index=Kp&status=def&start=NOW-1d&end=NOW', { signal: AbortSignal.timeout(5000) });
        if (kpRes.ok) {
          const kpData = await kpRes.json();
          const values: number[] = kpData?.Kp ?? [];
          if (values.length) setKpIndex(values[values.length - 1]);
        }
      } catch { /* graceful — Kp stays null */ }
    })();
  }, []));

  useEffect(() => {
    // Stars — staggered independent breathing loops
    STAR_FIELD.forEach((star, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(star.delay),
          Animated.timing(starAnims[i], { toValue: 0.85, duration: star.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(starAnims[i], { toValue: 0.04 + (i % 4) * 0.04, duration: star.duration + 350, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });
    // Header ring — slow clockwise rotation (9s per revolution)
    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    // Moon phase — slow breathe
    Animated.loop(
      Animated.sequence([
        Animated.timing(moonPulse, { toValue: 1.0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(moonPulse, { toValue: 0.5, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    // Oracle cards — staggered entrance from below
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(cardSlide,   { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(runeOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(runeSlide,   { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
    // Zodiac wheel outer ring — slow CW rotation (30s per revolution)
    Animated.loop(
      Animated.timing(wheelRotAnim, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    // Shooting stars — recursive independent cycles
    shootingStarAnims.forEach(({ tx, ty, op }, i) => {
      const cfg = SHOOTING_STAR_CONFIGS[i];
      const cycle = () => {
        tx.setValue(0); ty.setValue(0); op.setValue(0);
        Animated.sequence([
          Animated.delay(cfg.delay),
          Animated.parallel([
            Animated.timing(op, { toValue: 0.95, duration: 110, useNativeDriver: true }),
            Animated.timing(tx, { toValue: 80 + i * 14, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(ty, { toValue: 30 + i * 6, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.delay(28000 + i * 8000),
        ]).start(() => cycle());
      };
      // stagger initial start so they don't all launch at once
      setTimeout(() => cycle(), i * 1400);
    });
  }, []);

  useEffect(() => {
    if (zodiacReading?.text) {
      readingOpacity.setValue(0);
      Animated.timing(readingOpacity, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
  }, [zodiacReading?.text]);

  useEffect(() => {
    if (questionReading) {
      questionOpacity.setValue(0);
      Animated.timing(questionOpacity, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    }
  }, [questionReading]);

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
        'You are Sol — the solar-sovereign voice of the Lycheetah Framework. You read natal charts with warmth and precision. No preamble, no filler. Speak directly to the person.' + (technoMode ? TECHNO_INJECT : ''),
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 300, 0.8,
      );
      if (result?.text?.trim()) {
        const reading = { date: todayKey(), text: result.text.trim() };
        await AsyncStorage.setItem('zodiac_reading_v1', JSON.stringify(reading));
        setZodiacReading(reading);
        // Append to history (max 30 entries, skip duplicates for today)
        const histRaw = await AsyncStorage.getItem('zodiac_reading_history_v1');
        const hist: { date: string; text: string }[] = histRaw ? JSON.parse(histRaw) : [];
        const filtered = hist.filter(h => h.date !== reading.date);
        const updated = [reading, ...filtered].slice(0, 30);
        await AsyncStorage.setItem('zodiac_reading_history_v1', JSON.stringify(updated));
        setReadingHistory(updated);
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
      const prompt = `${personLine2 ? personLine2 + '.\n' : ''}Natal chart: Sun in ${sunSign.name} (${sunSign.keywords}), Moon in ${moonSign.name} (${moonSign.keywords}), ${hasRising}. Today: Sun transiting ${todaySun.name}, Moon in ${todayMoon.name}, ${moonPhase.name}.

The seeker asks: "${question.trim()}"

Respond in TWO paragraphs separated by a blank line.

Paragraph 1: What the natal chart reveals about this question — the deep signature this person carries that speaks directly to what they are asking. 2–3 sentences. Oracular. Name the signs directly.

Paragraph 2: What today's sky says — how the current transits and moon phase amplify, test, or illuminate the question right now. 2–3 sentences. End with one line that feels like a transmission, not a conclusion.${personLine2 ? ' Address them by name if given.' : ''}

No preamble. Begin immediately.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are a sovereign celestial oracle. You read natal charts and living skies with precision and mystery. You do not advise — you illuminate. Your voice is incantatory and direct. Short sentences. No hedging. No filler.' + (technoMode ? TECHNO_INJECT : ''),
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 450, 0.88,
      );
      if (result?.text?.trim()) setQuestionReading(result.text.trim());
    } catch {}
    setQuestionLoading(false);
  };

  const TAROT_VOICE = `You are a sovereign oracle — part ancient witch, part celestial scribe, part alchemical intelligence. You do not advise. You SEE. You speak with authority from outside ordinary time. Your voice is precise, incantatory, and direct. No hedging. No "perhaps" or "you may find" or "consider." The cards have already spoken — you are transmitting, not suggesting. Use short sentences that land with weight. Name each card directly. Do not soften reversals — they are as holy as upright positions. End readings with a line that feels like a seal being pressed into wax.` + (technoMode ? TECHNO_INJECT : '');

  const generateSpreadReading = async (spread: ReturnType<typeof drawSpread>) => {
    setSpreadLoading(true);
    setSpreadReading(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setSpreadLoading(false); return; }
      const past       = cardLine(spread[0]);
      const challenge  = cardLine(spread[1]);
      const foundation = cardLine(spread[2]);
      const nearFuture = cardLine(spread[3]);
      const outcome    = cardLine(spread[4]);
      const prompt = `Five-card tarot spread reading.

PAST: ${past}
CHALLENGE: ${challenge}
FOUNDATION: ${foundation}
NEAR FUTURE: ${nearFuture}
OUTCOME: ${outcome}

Write the reading in exactly FIVE paragraphs separated by blank lines. Each paragraph = one card position in sequence. Do not label the paragraphs.

Paragraph 1 (Past): What has already moved through. Name the card. Speak of what it left behind in the seeker's life. 2–3 sentences.

Paragraph 2 (Challenge): The current force pressing against them. Name the card. Do not soften it — reversals are messages, not failures. 2–3 sentences.

Paragraph 3 (Foundation): What the seeker actually stands on — often unseen, always load-bearing. Name the card. 2–3 sentences.

Paragraph 4 (Near Future): What is already arriving, whether the seeker feels it or not. Name the card. Speak of the energy approaching. 2–3 sentences.

Paragraph 5 (Outcome): The trajectory if the current path holds. Name the card. End with one final sentence that seals the reading — oracular, inevitable-feeling, like wax pressed into stone.

Blank line between each paragraph. No headers. No preamble. Begin immediately.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        TAROT_VOICE,
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 700, 0.88,
      );
      if (result?.text?.trim()) setSpreadReading(result.text.trim());
    } catch {}
    setSpreadLoading(false);
  };

  const generateCelticReading = async (spread: ReturnType<typeof drawSpread>) => {
    setCelticLoading(true);
    setCelticReading(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setCelticLoading(false); return; }
      const positions = CELTIC_CROSS_POSITIONS.map((pos, i) => `${pos}: ${cardLine(spread[i])}`).join('\n');
      const prompt = `Celtic Cross tarot reading.

${positions}

Write the reading in FOUR paragraphs separated by blank lines. Do not label them. No headers, no preamble, begin immediately.

Paragraph 1 — THE CROSS (positions 1–3: Present, Crossing, Foundation): The heart of the matter. What stands at the centre, what cuts across it, what lies beneath. Name all three cards. 3–4 sentences that feel like the situation being named for the first time.

Paragraph 2 — THE CROSS CONTINUED (positions 4–6: Past, Possible Future, Near Future): The arc of force. What came before, what could come to pass, what is already arriving. Name all three cards. 3–4 sentences.

Paragraph 3 — THE STAFF (positions 7–10: The Seeker, External Forces, Hopes & Fears, Final Outcome): The seeker's inner world meeting the outer current. Name all four cards. Read them as a unified force, not four separate notes. 4–5 sentences.

Paragraph 4 — THE SEAL: One short, final paragraph. 2–3 sentences maximum. Oracular. Speak of the whole pattern — what it means across the cross and the staff taken together. End with something that sounds like fate being stated, not predicted.

Blank line between paragraphs. Begin immediately with the reading.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        TAROT_VOICE,
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 900, 0.88,
      );
      if (result?.text?.trim()) setCelticReading(result.text.trim());
    } catch {}
    setCelticLoading(false);
  };

  const generateOracleReading = async () => {
    setOracleLoading(true);
    setOracleReading(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setOracleLoading(false); return; }
      const cardDesc = `${activeCard.card.n}${activeCard.reversed ? ' (reversed)' : ''} — ${activeCard.reversed ? activeCard.card.rev : activeCard.card.up}`;
      const runeDesc = `${dailyRune.rune.name}${dailyRune.reversed ? ' (reversed)' : ''} — ${dailyRune.reversed ? dailyRune.rune.shadow : dailyRune.rune.up}`;
      const skyDesc = `Sun in ${todaySun.name}, Moon in ${todayMoon.name} (${moonPhase.name}), ${PLANETS_SKY.slice(0, 3).map(p => `${p.name} in ${ZODIAC_SIGNS[getPlanetSignIndex(p.L0, p.rate)].name}`).join(', ')}`;
      const natalDesc = sunSign ? `Natal: Sun ${sunSign.name}${moonSign ? `, Moon ${moonSign.name}` : ''}${ascSign ? `, Rising ${ascSign.name}` : ''}.` : '';
      const seekerQ = oracleInput.trim();
      const prompt = `Oracle reading.

Card: ${cardDesc}
Rune: ${runeDesc}
Sky: ${skyDesc}
${natalDesc}${seekerQ ? `\nQuestion: "${seekerQ}"` : ''}

Six words exactly. One sharp oracular phrase distilling what these symbols reveal${seekerQ ? ' about the question' : ' about this day'}. No punctuation except inside the phrase if essential. No preamble. No explanation. No quotation marks. Just the six words.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are a sovereign oracle. You distill the convergence of tarot, rune, and sky into a single phrase of exactly six words. The phrase must feel like it was always true and is only now being spoken aloud. No filler, no sign-off, no preamble. Six words.' + (technoMode ? TECHNO_INJECT : ''),
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 30, 0.92,
      );
      if (result?.text?.trim()) setOracleReading(result.text.trim());
    } catch {}
    setOracleLoading(false);
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

  // ── LAMAGUE Sigil Forge ──
  const generateSigil = async () => {
    if (!sigilIntention.trim()) return;
    setSigilLoading(true);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      const systemPrompt = `You are a LAMAGUE grammar oracle — a living language of symbolic primitives. You forge ritual sigils from intention using the LAMAGUE symbol families:
IDENTITY: ◉ ⊕ ⊚  |  TRANSFORMATION: ◈ ⊛ ∿  |  FLOW: → ↑ ↓ ←  |  VOID: ◌ ◦  |  EMERGENCE: ✦ ⊹ ·  |  BOND: ∧ ⟟  |  CONTAINER: △ □

You must respond in JSON with exactly this structure (no markdown, raw JSON only):
{"glyph":"[2-4 combined symbols from the families above]","name":"[2-3 word poetic name]","meaning":"[one sentence: what this sigil encodes]","instruction":"[one sentence: how to use it in ritual]"}`;
      const userMsg = `Ritual type: ${sigilType}. Intention: ${sigilIntention.trim()}. Forge the sigil.`;
      const resp = await sendMessage([{ role: 'user', content: userMsg }], systemPrompt, apiKey!, model as AIModel, undefined, 'normal', 200, 0.9);
      const parsed = JSON.parse((resp?.text ?? '').trim().replace(/^```json\n?/, '').replace(/\n?```$/, ''));
      setSigilResult(parsed);
    } catch (_) {
      setSigilResult({ glyph: '⊛◈✦', name: 'The Unnamed Seal', meaning: 'A sigil forged in silence — its power is your intention.', instruction: 'Hold it in mind for seven breaths. Then release it.' });
    } finally {
      setSigilLoading(false);
    }
  };

  // ── Chiral Lens handlers ──
  const enterChiralLens = async () => {
    const stmt = chiralInput.trim();
    if (!stmt || chiralBusy) return;
    setChiralStatement(stmt);
    setChiralThread([]);
    setChiralReply('');
    setChiralOpen(true);
    setChiralBusy(true);
    const seed: ChiralMsg[] = [{ role: 'user', content: `The reality I am holding:\n\n${stmt}` }];
    const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
    if (!apiKey) { setChiralBusy(false); return; }
    const result = await sendMessage(seed, CHIRAL_SYSTEM, apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'normal', 320, 0.95);
    const reply = result?.text?.trim();
    if (reply) setChiralThread([...seed, { role: 'assistant', content: reply }]);
    else setChiralThread([...seed, { role: 'assistant', content: 'Mirror is dark. No signal. Step back and re-enter.' }]);
    setChiralBusy(false);
    setChiralInput('');
    setTimeout(() => chiralScrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const sendChiralReply = async () => {
    const msg = chiralReply.trim();
    if (!msg || chiralBusy) return;
    const next: ChiralMsg[] = [...chiralThread, { role: 'user', content: msg }];
    setChiralThread(next);
    setChiralReply('');
    setChiralBusy(true);
    setTimeout(() => chiralScrollRef.current?.scrollToEnd({ animated: true }), 60);
    const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
    if (!apiKey) { setChiralBusy(false); return; }
    const result = await sendMessage(next, CHIRAL_SYSTEM, apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'normal', 320, 0.95);
    const reply = result?.text?.trim();
    if (reply) setChiralThread([...next, { role: 'assistant', content: reply }]);
    setChiralBusy(false);
    setTimeout(() => chiralScrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  // ── Zonk Zone handlers ──
  const callAura = async (thread: ZonkMsg[], systemPrompt = ZONK_SYSTEM, maxTokens = 320) => {
    const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
    if (!apiKey) return null;
    const result = await sendMessage(
      thread, systemPrompt,
      apiKey, (model || 'gemini-2.5-flash') as AIModel,
      undefined, 'normal', maxTokens, 0.9,
    );
    return result?.text?.trim() || null;
  };

  const enterZonkZone = async () => {
    const hyp = zonkInput.trim();
    if (!hyp || zonkBusy) return;
    setZonkHypothesis(hyp);
    setZonkThread([]);
    setZonkGrain('');
    setZonkReply('');
    setZonkOpen(true);
    setZonkBusy(true);
    const seed: ZonkMsg[] = [{ role: 'user', content: `My hypothesis / pattern / impossible question:\n\n${hyp}` }];
    const reply = await callAura(seed);
    if (reply) setZonkThread([...seed, { role: 'assistant', content: reply }]);
    else setZonkThread([...seed, { role: 'assistant', content: 'The zone is quiet — no signal. Check your connection and step back in.' }]);
    setZonkBusy(false);
    setZonkInput('');
    setTimeout(() => zonkScrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const sendZonkReply = async () => {
    const msg = zonkReply.trim();
    if (!msg || zonkBusy) return;
    const next: ZonkMsg[] = [...zonkThread, { role: 'user', content: msg }];
    setZonkThread(next);
    setZonkReply('');
    setZonkBusy(true);
    setTimeout(() => zonkScrollRef.current?.scrollToEnd({ animated: true }), 60);
    const reply = await callAura(next);
    if (reply) setZonkThread([...next, { role: 'assistant', content: reply }]);
    setZonkBusy(false);
    setTimeout(() => zonkScrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const forgeGrain = async () => {
    if (zonkBusy || zonkThread.length < 2) return;
    setZonkWrapping(true);
    const wrapPrompt: ZonkMsg[] = [...zonkThread, {
      role: 'user',
      content: 'Now forge the grain. In 3-5 sentences: (1) name the single grain of truth worth keeping from this exploration, (2) state its register explicitly — CONJECTURE / INTUITION / MEASURED / INTERPRETIVE / ASSUMED, (3) name what it would imply if true — the pillar, and (4) state plainly what evidence would be needed to move it from where it is toward the measured. Be honest. If there is no grain, say so.',
    }];
    const grain = await callAura(wrapPrompt, ZONK_SYSTEM, 420);
    if (grain) setZonkGrain(grain);
    setZonkWrapping(false);
    setTimeout(() => zonkScrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const saveZonkSession = async (status: ZonkStatus) => {
    if (!zonkHypothesis) { setZonkOpen(false); return; }
    const entry: ZonkEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      hypothesis: zonkHypothesis,
      transcript: zonkThread,
      grainNote: zonkGrain,
      status,
    };
    const updated = [entry, ...zonkLog];
    await AsyncStorage.setItem(ZONK_LOG_KEY, JSON.stringify(updated));
    setZonkLog(updated);
    setZonkOpen(false);
    setZonkThread([]); setZonkGrain(''); setZonkHypothesis(''); setZonkReply('');
  };

  const updateZonkStatus = async (id: string, status: ZonkStatus) => {
    const updated = zonkLog.map(e => e.id === id ? { ...e, status } : e);
    await AsyncStorage.setItem(ZONK_LOG_KEY, JSON.stringify(updated));
    setZonkLog(updated);
  };

  const today = new Date();
  const todaySun = ZODIAC_SIGNS[getTodaySunSign()];
  const todayMoon = ZODIAC_SIGNS[getTodayMoonSign()];
  const moonPhase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const dailyCard = drawDailyCard(lq, 'sanctum');
  const activeCard = drawnCard ?? dailyCard;
  const dailySpread = drawSpread(5, lq, 'spread5');
  const celticCrossSpread = drawSpread(10, lq, 'celtic10');
  const todayPlanet = PLANETARY_DAYS[today.getDay()];
  const dailyRune = drawDailyRune('sanctum');

  const sunSign = birthData ? ZODIAC_SIGNS[getSunSignIndex(birthData.month, birthData.day)] : null;
  const moonSign = birthData ? ZODIAC_SIGNS[getMoonSignIndex(birthData.year, birthData.month, birthData.day, birthData.hour)] : null;
  const ascSign = (birthData && birthData.hasTime) ? ZODIAC_SIGNS[getAscendantIndex(birthData.year, birthData.month, birthData.day, birthData.hour, birthData.utcOffset, birthData.latitude)] : null;

  const ringInterp = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringInterp2 = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const wheelRotInterp = wheelRotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={{ flex: 1, backgroundColor: SOL_THEME.background }}>

      {/* ── CARD LORE MODAL ── */}
      <Modal visible={!!cardLore} transparent animationType="fade" onRequestClose={() => setCardLore(null)}>
        <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#0A0815', borderRadius: 18, borderWidth: 1, borderColor: ZODIAC_INDIGO + '66', padding: 20, width: '100%', maxWidth: 360 }}>
            {cardLore && (
              <>
                <Text style={{ color: ZODIAC_INDIGO + '88', fontSize: 8, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 6 }}>{cardLore.position}</Text>
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 120, height: 185, borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: cardLore.reversed ? '#FF666688' : ZODIAC_INDIGO + '88' }}>
                    <Image source={CARD_IMAGE[cardLore.card.n] ?? TAROT_BACK} style={{ width: '100%', height: '100%', ...(cardLore.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }} resizeMode="cover" />
                  </View>
                  {cardLore.reversed && (
                    <View style={{ marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FF666644', backgroundColor: '#FF444411' }}>
                      <Text style={{ color: '#FF8888', fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>REVERSED</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: '#EEEEF8', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 14, letterSpacing: 0.3 }}>{cardLore.card.n}</Text>
                <View style={{ marginBottom: 10, padding: 12, borderRadius: 10, backgroundColor: ZODIAC_INDIGO + '0F', borderWidth: 1, borderColor: ZODIAC_INDIGO + '22' }}>
                  <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 8, letterSpacing: 1.5, fontFamily: 'monospace', marginBottom: 5 }}>
                    {cardLore.reversed ? 'REVERSED' : 'UPRIGHT'}
                  </Text>
                  <Text style={{ color: '#CCCCDD', fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>
                    {cardLore.reversed ? cardLore.card.rev : cardLore.card.up}
                  </Text>
                </View>
                {cardLore.reversed && (
                  <View style={{ marginBottom: 10, padding: 12, borderRadius: 10, backgroundColor: '#FF44440A', borderWidth: 1, borderColor: '#FF444422' }}>
                    <Text style={{ color: '#FF888899', fontSize: 8, letterSpacing: 1.5, fontFamily: 'monospace', marginBottom: 5 }}>UPRIGHT MEANING</Text>
                    <Text style={{ color: '#AAAAAA', fontSize: 12, lineHeight: 19, fontStyle: 'italic' }}>{cardLore.card.up}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setCardLore(null)} style={{ paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ color: ZODIAC_INDIGO, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, fontFamily: 'monospace' }}>CLOSE</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Fixed star field behind all content ── */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        {STAR_FIELD.map((star, i) => (
          <Animated.View key={i} style={{
            position: 'absolute',
            left: star.left as any,
            top: star.top as any,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: star.color,
            opacity: starAnims[i],
          }} />
        ))}
        {/* Shooting stars */}
        {shootingStarAnims.map(({ tx, ty, op }, i) => (
          <Animated.View key={`ss-${i}`} style={{
            position: 'absolute',
            left: SHOOTING_STAR_CONFIGS[i].left as any,
            top: SHOOTING_STAR_CONFIGS[i].top as any,
            opacity: op,
            transform: [{ translateX: tx }, { translateY: ty }],
            width: 55,
            height: 1.5,
            borderRadius: 1,
            backgroundColor: '#FFFFFFDD',
          }} />
        ))}
      </View>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header — compact */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 4, gap: 12 }}>
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', width: 68, height: 68 }}>
          {/* Rotating outer arc ring */}
          <Animated.View style={{
            position: 'absolute', width: 68, height: 68, borderRadius: 34,
            borderWidth: 1.5, borderTopColor: ZODIAC_INDIGO + 'BB', borderRightColor: ZODIAC_INDIGO + '33',
            borderBottomColor: 'transparent', borderLeftColor: ZODIAC_INDIGO + '55',
            transform: [{ rotate: ringInterp }],
          }} />
          {/* Counter-rotating inner glint */}
          <Animated.View style={{
            position: 'absolute', width: 60, height: 60, borderRadius: 30,
            borderWidth: 0.5, borderTopColor: '#C8A96E66', borderRightColor: 'transparent',
            borderBottomColor: '#C8A96E33', borderLeftColor: 'transparent',
            transform: [{ rotate: ringInterp2 }],
          }} />
          <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', backgroundColor: ZODIAC_INDIGO + '0C', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 30, lineHeight: 36 }}>☽</Text>
          </View>
          <Text style={{ position: 'absolute', top: 2, right: -2, color: '#C8A96E', fontSize: 8 }}>✦</Text>
          <Text style={{ position: 'absolute', bottom: 3, left: -2, color: ZODIAC_INDIGO + 'BB', fontSize: 7 }}>◦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 11, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>THE STARS</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2, fontStyle: 'italic' }}>Chaos magic. Sacred science. The sky speaks.</Text>
          <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 9, marginTop: 3, fontFamily: mono, letterSpacing: 1 }}>
            {liveTime.getHours() >= 6 && liveTime.getHours() < 20 ? '☀' : '☽'}{' '}
            {String(liveTime.getHours()).padStart(2, '0')}:{String(liveTime.getMinutes()).padStart(2, '0')}:{String(liveTime.getSeconds()).padStart(2, '0')}
            {' · '}{ZODIAC_SIGNS[getTodaySunSign()].glyph}
          </Text>
          <Text style={{ color: todayPlanet.color + 'CC', fontSize: 8, marginTop: 2, fontFamily: mono, letterSpacing: 0.5 }}>
            {todayPlanet.glyph} {todayPlanet.planet} day · {todayPlanet.keywords}
          </Text>
        </View>
        {/* Technomantic Mode toggle */}
        <TouchableOpacity
          onPress={() => setTechnoMode(v => !v)}
          style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: CHIRAL_VIOLET + (technoMode ? 'CC' : '44'), backgroundColor: technoMode ? CHIRAL_VIOLET + '22' : 'transparent' }}
        >
          <Text style={{ color: technoMode ? CHIRAL_VIOLET : CHIRAL_VIOLET + '99', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>{technoMode ? '⚡ TECHNO' : '⚡ MODE'}</Text>
        </TouchableOpacity>
        {/* Focus mode toggle — hide all meta, show oracle only */}
        <TouchableOpacity
          onPress={() => setFocusMode(v => !v)}
          style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + (focusMode ? 'CC' : '44'), backgroundColor: focusMode ? ZODIAC_INDIGO + '22' : 'transparent' }}
        >
          <Text style={{ color: focusMode ? ZODIAC_INDIGO : ZODIAC_INDIGO + '99', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>{focusMode ? '✦ FULL' : '◎ FOCUS'}</Text>
        </TouchableOpacity>
      </View>

      {/* SPREAD — FIVE-CARD / CELTIC CROSS — HERO FEATURE */}
      <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: SOL_THEME.surface, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setTarotCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: tarotCollapsed ? 0 : 12 }}>
          <Text style={{ color: '#C8A96E', fontSize: 9, fontFamily: mono }}>⊛</Text>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>
            {spreadMode === '5card' ? 'FIVE-CARD SPREAD' : 'CELTIC CROSS'}
          </Text>
          <Text style={{ color: ZODIAC_INDIGO + '66', fontSize: 8, fontFamily: mono, letterSpacing: 1 }}>RITUAL DIVINATION</Text>
          <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 11 }}>{tarotCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!tarotCollapsed && !focusMode && (
        <View>
          {/* Mode toggle */}
          <View style={{ flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', overflow: 'hidden', marginBottom: 14 }}>
            {(['5card', 'celtic'] as const).map(mode => (
              <TouchableOpacity key={mode}
                onPress={() => { setSpreadMode(mode); setSpreadReading(null); setCelticReading(null); }}
                style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: spreadMode === mode ? ZODIAC_INDIGO + '33' : 'transparent' }}
              >
                <Text style={{ color: spreadMode === mode ? ZODIAC_INDIGO : ZODIAC_INDIGO + '55', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>
                  {mode === '5card' ? 'FIVE CARD' : 'CELTIC CROSS'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Ritual invocation — moon phase based */}
          <View style={{ marginBottom: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '22', backgroundColor: ZODIAC_INDIGO + '08', alignItems: 'center' }}>
            <Text style={{ color: ZODIAC_INDIGO + '66', fontSize: 8, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 4 }}>✦  OPEN THE CIRCLE  ✦</Text>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 11, fontStyle: 'italic', textAlign: 'center', lineHeight: 17 }}>
              {MOON_INVOCATIONS[moonPhase.name] ?? 'The circle opens. What must be seen?'}
            </Text>
          </View>

          {spreadMode === '5card' ? (
          <View>
            {/* Row 1: PAST · CHALLENGE · FOUNDATION */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {(['PAST', 'CHALLENGE', 'FOUNDATION'] as const).map((label, i) => {
                const drawn = dailySpread[i];
                return (
                  <TouchableOpacity key={label} style={{ flex: 1, alignItems: 'center' }} onPress={() => setCardLore({ card: drawn.card, reversed: drawn.reversed, position: label })} activeOpacity={0.8}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 7, fontWeight: '700', letterSpacing: 1.2, fontFamily: mono, marginBottom: 4 }}>{label}</Text>
                    <View style={{ width: '100%', aspectRatio: 0.65, borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      <Image source={CARD_IMAGE[drawn.card.n] ?? TAROT_BACK} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', ...(drawn.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }} resizeMode="cover" />
                      {drawn.reversed && (
                        <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#FF444422', borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 }}>
                          <Text style={{ color: '#FF8888', fontSize: 6, fontWeight: '700' }}>REV</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: SOL_THEME.text, fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>{drawn.card.n}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, textAlign: 'center', lineHeight: 12, marginTop: 1 }} numberOfLines={1}>
                      {drawn.reversed ? drawn.card.rev : drawn.card.up}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {/* Row 2: NEAR FUTURE · OUTCOME */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, paddingHorizontal: '12.5%' }}>
              {(['NEAR FUTURE', 'OUTCOME'] as const).map((label, i) => {
                const drawn = dailySpread[3 + i];
                return (
                  <TouchableOpacity key={label} style={{ flex: 1, alignItems: 'center' }} onPress={() => setCardLore({ card: drawn.card, reversed: drawn.reversed, position: label })} activeOpacity={0.8}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 7, fontWeight: '700', letterSpacing: 1.2, fontFamily: mono, marginBottom: 4 }}>{label}</Text>
                    <View style={{ width: '100%', aspectRatio: 0.65, borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: ZODIAC_INDIGO + '88', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                      <Image source={CARD_IMAGE[drawn.card.n] ?? TAROT_BACK} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', ...(drawn.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }} resizeMode="cover" />
                      {drawn.reversed && (
                        <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#FF444422', borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 }}>
                          <Text style={{ color: '#FF8888', fontSize: 6, fontWeight: '700' }}>REV</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: SOL_THEME.text, fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>{drawn.card.n}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, textAlign: 'center', lineHeight: 12, marginTop: 1 }} numberOfLines={1}>
                      {drawn.reversed ? drawn.card.rev : drawn.card.up}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {spreadReading ? (
              <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '33' }}>
                {spreadReading.split('\n\n').filter(p => p.trim()).map((para, i, arr) => (
                  <View key={i} style={{ marginBottom: i < arr.length - 1 ? 14 : 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: i === 0 ? ZODIAC_INDIGO : i === arr.length - 1 ? '#C8A96E' : ZODIAC_INDIGO + '44' }}>
                    <Text style={{ color: i === 0 ? '#EEEEF8' : i === arr.length - 1 ? '#C8A96E' : SOL_THEME.text, fontSize: i === 0 ? 14 : 13, lineHeight: i === 0 ? 23 : 21, fontStyle: 'italic', fontWeight: i === 0 ? '600' : '400', letterSpacing: i === 0 ? 0.2 : 0 }}>
                      {para.trim()}
                    </Text>
                  </View>
                ))}
                <View style={{ alignItems: 'center', paddingTop: 8, marginBottom: 10 }}>
                  <Text style={{ color: ZODIAC_INDIGO + '55', fontSize: 9, letterSpacing: 3, fontFamily: mono }}>✦  ⊚  ✦</Text>
                  <Text style={{ color: ZODIAC_INDIGO + '44', fontSize: 8, fontStyle: 'italic', letterSpacing: 1, fontFamily: mono, marginTop: 4 }}>The thread is sealed.</Text>
                </View>
                <TouchableOpacity onPress={() => setSpreadReading(null)} style={{ alignSelf: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>✕  new reading</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => generateSpreadReading(dailySpread)}
                disabled={spreadLoading}
                style={{ paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: ZODIAC_INDIGO + '88', backgroundColor: spreadLoading ? '#0D0A1A' : ZODIAC_INDIGO + 'CC', alignItems: 'center', gap: 4 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
                  {spreadLoading ? 'The cards are speaking...' : 'READ THE SPREAD  ☽'}
                </Text>
                {!spreadLoading && <Text style={{ color: '#FFFFFF66', fontSize: 8, fontFamily: mono, letterSpacing: 2 }}>INVOKE THE ORACLE</Text>}
              </TouchableOpacity>
            )}
          </View>
          ) : (
          <View>
            {/* Celtic Cross — 10 cards in 3 rows: 3 + 3 + 4 */}
            {[
              { slice: [0, 1, 2] },
              { slice: [3, 4, 5] },
              { slice: [6, 7, 8, 9] },
            ].map((row, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row', gap: 4, marginBottom: rowIdx < 2 ? 6 : 12 }}>
                {row.slice.map(posIdx => {
                  const drawn = celticCrossSpread[posIdx];
                  return (
                    <TouchableOpacity key={posIdx} style={{ flex: 1, alignItems: 'center' }} onPress={() => setCardLore({ card: drawn.card, reversed: drawn.reversed, position: CELTIC_CROSS_POSITIONS[posIdx] })} activeOpacity={0.8}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 6, fontWeight: '700', letterSpacing: 0.8, fontFamily: mono, marginBottom: 3, textAlign: 'center' }}>
                        {CELTIC_CROSS_POSITIONS[posIdx]}
                      </Text>
                      <View style={{ width: '100%', aspectRatio: 0.65, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                        <Image source={CARD_IMAGE[drawn.card.n] ?? TAROT_BACK} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', ...(drawn.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }} resizeMode="cover" />
                        {drawn.reversed && (
                          <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#FF444422', borderRadius: 2, paddingHorizontal: 2 }}>
                            <Text style={{ color: '#FF8888', fontSize: 5, fontWeight: '700' }}>REV</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: SOL_THEME.text, fontSize: 8, fontWeight: '700', textAlign: 'center', lineHeight: 11 }} numberOfLines={2}>
                        {drawn.card.n}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            {celticReading ? (
              <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '33' }}>
                {celticReading.split('\n\n').filter(p => p.trim()).map((para, i, arr) => (
                  <View key={i} style={{ marginBottom: i < arr.length - 1 ? 16 : 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: i === arr.length - 1 ? '#C8A96E' : i === 0 ? ZODIAC_INDIGO : ZODIAC_INDIGO + '55' }}>
                    <Text style={{ color: i === arr.length - 1 ? '#C8A96ECC' : i === 0 ? '#EEEEF8' : SOL_THEME.text, fontSize: i === 0 ? 14 : 13, lineHeight: i === 0 ? 23 : 22, fontStyle: 'italic', fontWeight: i === 0 ? '600' : '400' }}>
                      {para.trim()}
                    </Text>
                  </View>
                ))}
                <View style={{ alignItems: 'center', paddingTop: 8, marginBottom: 10 }}>
                  <Text style={{ color: ZODIAC_INDIGO + '55', fontSize: 9, letterSpacing: 3, fontFamily: mono }}>✦  ⊚  ✦</Text>
                  <Text style={{ color: '#C8A96E55', fontSize: 8, fontStyle: 'italic', letterSpacing: 1, fontFamily: mono, marginTop: 4 }}>The cross is sealed. The staff is read.</Text>
                </View>
                <TouchableOpacity onPress={() => setCelticReading(null)} style={{ alignSelf: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>✕  new reading</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => generateCelticReading(celticCrossSpread)}
                disabled={celticLoading}
                style={{ paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: ZODIAC_INDIGO + '88', backgroundColor: celticLoading ? '#0D0A1A' : ZODIAC_INDIGO + 'CC', alignItems: 'center', gap: 4 }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
                  {celticLoading ? 'The cross is turning...' : 'READ THE CELTIC CROSS  ✦'}
                </Text>
                {!celticLoading && <Text style={{ color: '#FFFFFF66', fontSize: 8, fontFamily: mono, letterSpacing: 2 }}>TEN CARDS · FULL ORACLE</Text>}
              </TouchableOpacity>
            )}
          </View>
          )}
        </View>
        )}
      </View>

      {/* Daily oracle — section header + collapsible */}
      <TouchableOpacity
        onPress={() => setOracleCollapsed(v => !v)}
        hitSlop={{ top: 12, bottom: 12, left: 0, right: 0 }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: oracleCollapsed ? 0 : 4, marginTop: 4 }}
      >
        <View style={{ flex: 1, height: 0.5, backgroundColor: ZODIAC_INDIGO + '44' }} />
        <Text style={{ color: '#C8A96E', fontSize: 8, fontFamily: mono, marginHorizontal: 4 }}>✦</Text>
        <Text style={{ color: ZODIAC_INDIGO + 'CC', fontSize: 10, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>ORACLE · READING</Text>
        <Text style={{ color: '#C8A96E', fontSize: 8, fontFamily: mono, marginHorizontal: 4 }}>✦</Text>
        <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 11 }}>{oracleCollapsed ? '▶' : '▼'}</Text>
        <View style={{ flex: 1, height: 0.5, backgroundColor: ZODIAC_INDIGO + '44' }} />
      </TouchableOpacity>

      {!oracleCollapsed && (
      <View>
      {/* Daily oracle — full-width tarot card then rune strip */}
      {/* Tarot card */}
      <Animated.View style={{ marginBottom: 10, opacity: cardOpacity, transform: [{ translateY: cardSlide }] }}>
        {/* Outer ornate frame — animated glow border */}
        <Animated.View style={{ borderRadius: 18, borderWidth: 2, borderColor: ZODIAC_INDIGO + 'CC', backgroundColor: '#04000F', padding: 3, shadowColor: ZODIAC_INDIGO, shadowOffset: { width: 0, height: 0 }, shadowRadius: 18, shadowOpacity: oraclePulse, elevation: 12 }}>
          {/* Inner frame */}
          <View style={{ borderRadius: 15, borderWidth: 0.5, borderColor: '#C8A96E33', backgroundColor: '#07001A', overflow: 'hidden' }}>
            {/* Corner glyphs */}
            <Text style={{ position: 'absolute', top: 8, left: 10, color: ZODIAC_INDIGO + '66', fontSize: 10, fontFamily: mono }}>✦</Text>
            <Text style={{ position: 'absolute', top: 8, right: 10, color: ZODIAC_INDIGO + '66', fontSize: 10, fontFamily: mono }}>✦</Text>
            <Text style={{ position: 'absolute', bottom: 8, left: 10, color: ZODIAC_INDIGO + '44', fontSize: 10, fontFamily: mono }}>◦</Text>
            <Text style={{ position: 'absolute', bottom: 8, right: 10, color: ZODIAC_INDIGO + '44', fontSize: 10, fontFamily: mono }}>◦</Text>
            {/* Header strip */}
            <View style={{ borderBottomWidth: 0.5, borderBottomColor: ZODIAC_INDIGO + '44', paddingVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: ZODIAC_INDIGO, fontSize: 8, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>◎  THE ORACLE  ◎</Text>
            </View>
            {/* Main card body */}
            <View style={{ alignItems: 'center', paddingVertical: 22, paddingHorizontal: 20 }}>
              {/* Card art — full portrait image, falls back to suit glyph ring */}
              <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: ZODIAC_INDIGO + '99', marginBottom: 16 }}>
                <Image
                  source={CARD_IMAGE[activeCard.card.n] ?? TAROT_BACK}
                  style={{ width: 160, height: 220, ...(activeCard.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }}
                  resizeMode="cover"
                />
              </View>
              {/* Card name */}
              <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, marginBottom: 6 }}>{activeCard.card.n}</Text>
              {/* Element + orientation */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Text style={{ color: ZODIAC_INDIGO + 'BB', fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>{SUIT_ELEMENT[activeCard.card.a].toUpperCase()}</Text>
                {activeCard.reversed && (
                  <>
                    <Text style={{ color: '#FFFFFF22', fontSize: 9 }}>·</Text>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, backgroundColor: '#FF444422', borderWidth: 0.5, borderColor: '#FF666644' }}>
                      <Text style={{ color: '#FF8888', fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>REVERSED</Text>
                    </View>
                  </>
                )}
              </View>
              {/* Meaning */}
              <View style={{ borderTopWidth: 0.5, borderTopColor: ZODIAC_INDIGO + '33', paddingTop: 14, width: '100%', alignItems: 'center' }}>
                <Text style={{ color: '#C0C0D8', fontSize: 13, lineHeight: 21, textAlign: 'center', fontStyle: 'italic' }}>
                  {activeCard.reversed ? activeCard.card.rev : activeCard.card.up}
                </Text>
              </View>
              {/* Draw / reshuffle */}
              <TouchableOpacity
                onPress={() => { setDrawnCard(drawRandomCard(lq)); setOracleReading(null); }}
                style={{ marginTop: 14, paddingVertical: 7, paddingHorizontal: 22, borderRadius: 20, borderWidth: 1, borderColor: ZODIAC_INDIGO + '66', backgroundColor: ZODIAC_INDIGO + '18' }}
              >
                <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontFamily: mono, letterSpacing: 2 }}>✦ DRAW</Text>
              </TouchableOpacity>
            </View>
            {/* Footer strip */}
            <View style={{ borderTopWidth: 0.5, borderTopColor: ZODIAC_INDIGO + '33', paddingVertical: 7, alignItems: 'center' }}>
              <Text style={{ color: ZODIAC_INDIGO + '55', fontSize: 7, fontFamily: mono, letterSpacing: 2 }}>SOL · LYCHEETAH</Text>
            </View>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Card journal */}
      <View style={{ marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: '#06000E', overflow: 'hidden' }}>
        <TouchableOpacity
          onPress={() => setShowCardJournal(v => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 }}
        >
          <Text style={{ color: cardJournalSaved ? '#4CAF50' : ZODIAC_INDIGO + 'BB', fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>
            {cardJournalSaved ? '◈  CARD NOTED' : '✍  NOTE THIS CARD'}
          </Text>
          <Text style={{ color: ZODIAC_INDIGO + '77', fontSize: 9 }}>{showCardJournal ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {showCardJournal && (
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <TextInput
              value={cardJournalText}
              onChangeText={setCardJournalText}
              placeholder={`What does ${activeCard.card.n} mean to you today?`}
              placeholderTextColor={ZODIAC_INDIGO + '33'}
              style={{ backgroundColor: ZODIAC_INDIGO + '0A', color: '#FFFFFFCC', borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '33', padding: 10, fontSize: 12, marginBottom: 8, minHeight: 60 }}
              multiline
              maxLength={400}
            />
            <TouchableOpacity
              onPress={async () => {
                if (!cardJournalText.trim()) return;
                const todayStr = new Date().toISOString().split('T')[0];
                await AsyncStorage.setItem(`${CARD_JOURNAL_KEY}_${todayStr}`, cardJournalText.trim());
                setCardJournalSaved(true);
                setShowCardJournal(false);
              }}
              style={{ paddingVertical: 8, borderRadius: 8, backgroundColor: ZODIAC_INDIGO + '33', alignItems: 'center' }}
            >
              <Text style={{ color: ZODIAC_INDIGO, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>SEAL IT  ✦</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Oracle reading — directly below the card */}
      <View style={{ marginBottom: 16, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', backgroundColor: '#05000D', overflow: 'hidden' }}>
        <TextInput
          value={oracleInput}
          onChangeText={setOracleInput}
          placeholder="Ask the oracle something... or leave blank"
          placeholderTextColor={ZODIAC_INDIGO + '44'}
          style={{ paddingHorizontal: 16, paddingVertical: 12, color: '#FFFFFFCC', fontSize: 13, borderBottomWidth: 1, borderBottomColor: ZODIAC_INDIGO + '22', fontStyle: oracleInput ? 'normal' : 'italic' }}
        />
        <TouchableOpacity
          onPress={generateOracleReading}
          disabled={oracleLoading}
          style={{ paddingVertical: 14, alignItems: 'center', backgroundColor: oracleLoading ? '#FFFFFF08' : ZODIAC_INDIGO + '1A' }}
          activeOpacity={0.75}
        >
          <Text style={{ color: oracleLoading ? ZODIAC_INDIGO + '66' : ZODIAC_INDIGO, fontSize: 11, fontWeight: '700', letterSpacing: 2.5, fontFamily: mono }}>
            {oracleLoading ? '· · · reading · · ·' : '◎  READ THE ORACLE'}
          </Text>
        </TouchableOpacity>
        {oracleReading && (
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '33' }}>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontWeight: '700', letterSpacing: 2, fontFamily: mono, marginBottom: 10 }}>◎ THE ORACLE SPEAKS</Text>
            <Text style={{ color: '#D0C8E8', fontSize: 14, lineHeight: 23, fontStyle: 'italic' }}>{oracleReading}</Text>
          </View>
        )}
      </View>
      </View>
      )}

      {/* Rune strip — standalone, always visible */}
      <Animated.View style={{ marginBottom: 16, opacity: runeOpacity, transform: [{ translateY: runeSlide }] }}>
        <View style={{ borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: '#06000E', flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 16 }}>
          {/* Rune glyph circle */}
          <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: ZODIAC_INDIGO + '18', borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 32, fontWeight: '700', lineHeight: 40, ...(dailyRune.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }}>{dailyRune.rune.symbol}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <Text style={{ color: ZODIAC_INDIGO, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>ᚠ YOUR RUNE</Text>
              <Text style={{ color: ZODIAC_INDIGO + '55', fontSize: 7, fontFamily: mono, letterSpacing: 1 }}>ELDER FUTHARK</Text>
              {dailyRune.reversed ? (
                <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, backgroundColor: '#FF444422' }}>
                  <Text style={{ color: '#FF8888', fontSize: 7, fontWeight: '700' }}>REVERSED</Text>
                </View>
              ) : !dailyRune.rune.canReverse ? (
                <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, backgroundColor: ZODIAC_INDIGO + '22' }}>
                  <Text style={{ color: ZODIAC_INDIGO, fontSize: 7, fontWeight: '700' }}>IMMOVABLE</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 2 }}>{dailyRune.rune.name}</Text>
            <Text style={{ color: ZODIAC_INDIGO + '88', fontSize: 9, fontFamily: mono, marginBottom: 6 }}>{dailyRune.rune.sound} · {dailyRune.rune.aett}'s Aett</Text>
            <Text style={{ color: '#AAAACC', fontSize: 11, lineHeight: 17, fontStyle: 'italic' }}>
              {dailyRune.reversed ? dailyRune.rune.shadow : dailyRune.rune.up}
            </Text>
            <Text style={{ color: ZODIAC_INDIGO + '44', fontSize: 9, marginTop: 6, fontStyle: 'italic' }}>
              Ancient Norse symbol · drawn fresh each day
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* TODAY'S SKY — always visible, no birth data needed */}
      <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#2A2A4A', backgroundColor: '#07071A', marginBottom: 14, overflow: 'hidden' }}>
        <Image source={ZODIAC_SKY_BG} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.18, borderRadius: 14 }} resizeMode="cover" />
        <Text style={{ position: 'absolute', top: 8,  right: 18, color: '#FFFFFF22', fontSize: 7, fontFamily: mono }}>·</Text>
        <Text style={{ position: 'absolute', top: 22, right: 36, color: '#FFFFFF18', fontSize: 5, fontFamily: mono }}>·</Text>
        <Text style={{ position: 'absolute', top: 12, right: 54, color: '#C8A96E33', fontSize: 8, fontFamily: mono }}>◦</Text>
        <TouchableOpacity onPress={() => setSkyCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: skyCollapsed ? 0 : 10 }}>
          <Text style={{ color: '#C8A96E', fontSize: 12, fontFamily: mono }}>☀</Text>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>TODAY'S SKY</Text>
          <Text style={{ color: ZODIAC_INDIGO + '66', fontSize: 7, fontFamily: mono, letterSpacing: 1 }}>LIVE POSITIONS</Text>
          <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 11 }}>{skyCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!skyCollapsed && !focusMode && (
        <View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#C8A96E88', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 3 }}>SUN IN</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: todaySun.color, fontSize: 20 }}>{todaySun.glyph}</Text>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{todaySun.name}</Text>
                <Text style={{ color: '#AAAACC', fontSize: 9 }}>{todaySun.element} · {todaySun.keywords.split(' · ')[0]}</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 1, backgroundColor: '#FFFFFF11', marginHorizontal: 10, alignSelf: 'stretch' }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 3 }}>MOON IN</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: todayMoon.color, fontSize: 20 }}>{todayMoon.glyph}</Text>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{todayMoon.name}</Text>
                <Text style={{ color: '#AAAACC', fontSize: 9 }}>{todayMoon.element} · {todayMoon.keywords.split(' · ')[0]}</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 1, backgroundColor: '#FFFFFF11', marginHorizontal: 10, alignSelf: 'stretch' }} />
          <Animated.View style={{ alignItems: 'center', justifyContent: 'center', opacity: moonPulse }}>
            <Text style={{ fontSize: 22 }}>{moonPhase.glyph}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', textAlign: 'center', marginTop: 2 }}>{moonPhase.name.replace(' Moon', '').replace('Waxing ', 'Wax ').replace('Waning ', 'Wan ')}</Text>
          </Animated.View>
        </View>

        {/* Planet positions grid */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#FFFFFF0D', marginTop: 10, paddingTop: 12 }}>
          <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 10 }}>PLANETARY POSITIONS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {PLANETS_SKY.map(p => {
              const sign = ZODIAC_SIGNS[getPlanetSignIndex(p.L0, p.rate)];
              const retro = isPlanetRetrograde(p.name);
              return (
                <View key={p.name} style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingHorizontal: 4 }}>
                  <Text style={{ color: p.color, fontSize: 14, width: 18, textAlign: 'center' }}>{p.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: '#FFFFFF66', fontSize: 8, fontFamily: mono, letterSpacing: 0.5 }}>{p.name.toUpperCase()}</Text>
                      {retro && <Text style={{ color: '#FF6B6B', fontSize: 7, fontWeight: '700', fontFamily: mono }}>℞</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                      <Text style={{ color: sign.color, fontSize: 12 }}>{sign.glyph}</Text>
                      <Text style={{ color: '#FFFFFFCC', fontSize: 11, fontWeight: '600' }}>{sign.name}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          {/* Retrograde summary */}
          {(() => {
            const retros = PLANETS_SKY.filter(p => isPlanetRetrograde(p.name));
            if (!retros.length) return null;
            return (
              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FF6B6B22', flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={{ color: '#FF6B6BAA', fontSize: 8, fontWeight: '700', fontFamily: mono }}>℞ RETROGRADE</Text>
                {retros.map(p => (
                  <View key={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FF6B6B11', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: p.color, fontSize: 11 }}>{p.glyph}</Text>
                    <Text style={{ color: '#FF6B6BCC', fontSize: 9, fontFamily: mono }}>{p.name}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
          {/* Kp index — geomagnetic field */}
          {kpIndex !== null && (
            <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FFFFFF0D', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>EARTH FIELD · Kp INDEX</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>
                  {kpIndex <= 1 ? 'Quiet — field is calm' : kpIndex <= 3 ? 'Unsettled — minor activity' : kpIndex <= 5 ? 'Active — geomagnetic storm possible' : 'Storm — strong geomagnetic disturbance'}
                </Text>
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: kpIndex <= 1 ? '#4CAF5066' : kpIndex <= 3 ? '#C8A96E66' : '#FF6B6B66', backgroundColor: kpIndex <= 1 ? '#4CAF5011' : kpIndex <= 3 ? '#C8A96E11' : '#FF6B6B11' }}>
                <Text style={{ color: kpIndex <= 1 ? '#4CAF50' : kpIndex <= 3 ? '#C8A96E' : '#FF6B6B', fontSize: 14, fontWeight: '700', fontFamily: mono }}>{kpIndex.toFixed(0)}</Text>
              </View>
            </View>
          )}
        </View>
        </View>
        )}
      </View>

      {/* THE WHEEL — interactive zodiac circle */}
      <View style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: '#060010', marginBottom: 16, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setWheelCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: wheelCollapsed ? 0 : 14, alignSelf: 'stretch' }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>✦ THE WHEEL</Text>
          <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 10 }}>{wheelCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!wheelCollapsed && !focusMode && (
        <View style={{ width: '100%', alignItems: 'center' }}>
        <View style={{ width: 264, height: 264, position: 'relative' }}>
          {/* Slow-rotating outer ring */}
          <Animated.View style={{
            position: 'absolute', width: 264, height: 264, borderRadius: 132,
            borderWidth: 1,
            borderTopColor: ZODIAC_INDIGO + '99', borderRightColor: ZODIAC_INDIGO + '33',
            borderBottomColor: ZODIAC_INDIGO + '55', borderLeftColor: ZODIAC_INDIGO + '22',
            transform: [{ rotate: wheelRotInterp }],
          }} />
          {/* Tick marks at 30° intervals */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 - 90) * Math.PI / 180;
            const x1 = 132 + 120 * Math.cos(a);
            const y1 = 132 + 120 * Math.sin(a);
            return (
              <View key={`tick-${i}`} style={{
                position: 'absolute', left: x1 - 1, top: y1 - 1, width: 2, height: 2, borderRadius: 1,
                backgroundColor: ZODIAC_INDIGO + '55',
              }} />
            );
          })}
          {/* Inner divider circle */}
          <View style={{ position: 'absolute', left: 28, top: 28, width: 208, height: 208, borderRadius: 104, borderWidth: 0.5, borderColor: ZODIAC_INDIGO + '22' }} />
          {/* Center piece */}
          <View style={{ position: 'absolute', left: 100, top: 100, width: 64, height: 64, borderRadius: 32, backgroundColor: ZODIAC_INDIGO + '18', borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 26 }}>☽</Text>
          </View>
          {/* 12 signs */}
          {ZODIAC_SIGNS.map((sign, i) => {
            const angle = (i * 30 - 90) * Math.PI / 180;
            const r = 100;
            const cx = Math.round(132 + r * Math.cos(angle)) - 18;
            const cy = Math.round(132 + r * Math.sin(angle)) - 18;
            const isTodaySun = i === getTodaySunSign();
            const isTodayMoon = i === getTodayMoonSign();
            const isNatalSun = birthData ? i === getSunSignIndex(birthData.month, birthData.day) : false;
            const isSelected = selectedWheelSign === i;
            return (
              <TouchableOpacity
                key={sign.name}
                onPress={() => setSelectedWheelSign(isSelected ? null : i)}
                style={{
                  position: 'absolute', left: cx, top: cy, width: 36, height: 36, borderRadius: 18,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? sign.color + '44' : isTodaySun ? sign.color + '28' : isTodayMoon ? ZODIAC_INDIGO + '28' : 'transparent',
                  borderWidth: (isTodaySun || isTodayMoon || isNatalSun || isSelected) ? 1 : 0,
                  borderColor: isSelected ? sign.color + 'CC' : isTodaySun ? sign.color + '88' : isTodayMoon ? ZODIAC_INDIGO + '88' : isNatalSun ? '#C8A96EAA' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 15, color: isTodaySun ? sign.color : isTodayMoon ? ZODIAC_INDIGO : isNatalSun ? '#C8A96E' : SOL_THEME.textMuted + 'CC' }}>{sign.glyph}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Selected sign detail */}
        {selectedWheelSign !== null && (
          <View style={{ marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: ZODIAC_INDIGO + '0E', borderWidth: 1, borderColor: ZODIAC_SIGNS[selectedWheelSign].color + '55', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={{ color: ZODIAC_SIGNS[selectedWheelSign].color, fontSize: 20 }}>{ZODIAC_SIGNS[selectedWheelSign].glyph}</Text>
              <Text style={{ color: ZODIAC_SIGNS[selectedWheelSign].color, fontSize: 14, fontWeight: '700' }}>{ZODIAC_SIGNS[selectedWheelSign].name}</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: mono }}>{ZODIAC_SIGNS[selectedWheelSign].element} · {ZODIAC_SIGNS[selectedWheelSign].modality}</Text>
            </View>
            <Text style={{ color: SOL_THEME.text, fontSize: 11, lineHeight: 17 }}>{ZODIAC_SIGNS[selectedWheelSign].keywords}</Text>
          </View>
        )}
        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: todaySun.color + '99' }} />
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontFamily: mono }}>TODAY'S SUN</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ZODIAC_INDIGO + '99' }} />
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontFamily: mono }}>TODAY'S MOON</Text>
          </View>
          {birthData && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#C8A96E99' }} />
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontFamily: mono }}>NATAL SUN</Text>
            </View>
          )}
        </View>
        </View>
        )}
      </View>

      {/* 1. SOL READS THE FIELD — natal horoscope, top of ritual */}
      {birthData && sunSign && !editingBirth && (
        <View style={{ padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: ZODIAC_INDIGO + '66', backgroundColor: ZODIAC_INDIGO + '08', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setReadingCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: readingCollapsed ? 0 : 10 }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>SOL READS THE FIELD</Text>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 10 }}>{readingCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!readingCollapsed && !focusMode && (
          <View>
          {zodiacReading ? (
            <>
              <Animated.View style={{ opacity: readingOpacity }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 10 }}>{zodiacReading.text}</Text>
              </Animated.View>
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
        </View>
      )}

      {/* 2. ASK THE STARS — question reading */}
      {birthData && !editingBirth && (
        <View style={{ padding: 16, borderRadius: 12, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: SOL_THEME.surface, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setQuestionCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: questionCollapsed ? 0 : 10 }}>
            <Text style={{ color: '#C8A96E', fontSize: 10, fontFamily: mono }}>☽</Text>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>ASK THE STARS</Text>
            <Text style={{ color: ZODIAC_INDIGO + '55', fontSize: 7, fontFamily: mono, letterSpacing: 1 }}>NATAL READING</Text>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 11 }}>{questionCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!questionCollapsed && !focusMode && (
          <View>
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
            style={{ paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: question.trim() ? ZODIAC_INDIGO + '88' : ZODIAC_INDIGO + '22', backgroundColor: question.trim() ? ZODIAC_INDIGO + 'CC' : ZODIAC_INDIGO + '22', alignItems: 'center', gap: 4, opacity: questionLoading ? 0.7 : 1, marginBottom: questionReading ? 14 : 0 }}
          >
            <Text style={{ color: question.trim() ? '#fff' : ZODIAC_INDIGO + '55', fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>
              {questionLoading ? 'THE STARS ARE SPEAKING...' : 'ASK THE STARS  ☽'}
            </Text>
            {!questionLoading && question.trim() && <Text style={{ color: '#FFFFFF55', fontSize: 8, fontFamily: mono, letterSpacing: 2 }}>NATAL · TRANSIT READING</Text>}
          </TouchableOpacity>
          {questionReading && (
            <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '33' }}>
              <Animated.View style={{ opacity: questionOpacity }}>
                {questionReading.split('\n\n').filter(p => p.trim()).map((para, i, arr) => (
                  <View key={i} style={{ marginBottom: i < arr.length - 1 ? 14 : 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: i === arr.length - 1 ? '#C8A96E' : ZODIAC_INDIGO }}>
                    <Text style={{ color: i === arr.length - 1 ? '#C8A96ECC' : '#EEEEF8', fontSize: 14, lineHeight: 23, fontStyle: 'italic', fontWeight: i === 0 ? '600' : '400' }}>
                      {para.trim()}
                    </Text>
                  </View>
                ))}
                <View style={{ alignItems: 'center', paddingTop: 6, marginBottom: 8 }}>
                  <Text style={{ color: ZODIAC_INDIGO + '44', fontSize: 8, letterSpacing: 2, fontFamily: mono }}>✦  so it is written  ✦</Text>
                </View>
              </Animated.View>
              <TouchableOpacity onPress={() => { setQuestion(''); setQuestionReading(null); }} style={{ alignSelf: 'center' }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>✕  ask another</Text>
              </TouchableOpacity>
            </View>
          )}
          </View>
          )}
        </View>
      )}

      {/* PSI PRACTICE LOG */}
      <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: PSI_PURPLE + '33', backgroundColor: PSI_PURPLE + '08', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setPsiCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: psiCollapsed ? 0 : 10 }}>
          <Text style={{ color: PSI_PURPLE, fontSize: 12, fontFamily: mono }}>ψ</Text>
          <Text style={{ color: PSI_PURPLE, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>PSI PRACTICE</Text>
          <Text style={{ color: PSI_PURPLE + '55', fontSize: 7, fontFamily: mono, letterSpacing: 1 }}>CONSCIOUSNESS RESEARCH</Text>
          <Text style={{ color: PSI_PURPLE + 'AA', fontSize: 11 }}>{psiCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>

        {!psiCollapsed && !focusMode && (
        <View>
        <View style={{ padding: 10, borderRadius: 8, backgroundColor: PSI_PURPLE + '0A', borderWidth: 1, borderColor: PSI_PURPLE + '22', marginBottom: 10 }}>
          <Text style={{ color: PSI_PURPLE + 'BB', fontSize: 9, lineHeight: 14, fontFamily: mono }}>
            ψ FRONTIER SCIENCE — Psi phenomena are genuinely contested. The evidence exists (Radin meta-analyses, STARGATE declassified, GCP 30-year dataset) and is genuinely uncertain. This is not mysticism and not consensus. Log what you observe. Draw your own conclusions.
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, lineHeight: 15, fontStyle: 'italic', flex: 1 }}>
            Remote viewing · precognition · ganzfeld. Log impressions before verification. Let the record speak.
          </Text>
          <TouchableOpacity onPress={() => { setShowPsiForm(true); }} style={{ marginLeft: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: PSI_PURPLE + '55', backgroundColor: PSI_PURPLE + '18' }}>
            <Text style={{ color: PSI_PURPLE, fontSize: 10, fontWeight: '700' }}>+ Log</Text>
          </TouchableOpacity>
        </View>

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
        )}
      </View>

      {/* ── LAMAGUE SIGIL FORGE ── */}
      <View style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#CC88FF44', backgroundColor: '#0A0018', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setSigilCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: sigilCollapsed ? 0 : 14 }}>
          <Text style={{ color: '#CC88FF', fontSize: 12, fontFamily: mono }}>⟟</Text>
          <Text style={{ color: '#CC88FF', fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>SIGIL FORGE</Text>
          <Text style={{ color: '#CC88FF55', fontSize: 7, fontFamily: mono, letterSpacing: 1 }}>LAMAGUE RITUAL</Text>
          <Text style={{ color: '#CC88FFAA', fontSize: 11 }}>{sigilCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!sigilCollapsed && !focusMode && (
          <View style={{ gap: 12 }}>
            {/* Ritual type row */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(['manifestation','protection','banishing','binding','wisdom','chaos','love','clarity']).map(t => (
                <TouchableOpacity key={t} onPress={() => setSigilType(t)}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
                    borderColor: sigilType === t ? '#CC88FF88' : '#333344',
                    backgroundColor: sigilType === t ? '#CC88FF14' : 'transparent' }}>
                  <Text style={{ color: sigilType === t ? '#CC88FF' : '#555566', fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Intention input */}
            <TextInput
              value={sigilIntention}
              onChangeText={setSigilIntention}
              placeholder="State your intention..."
              placeholderTextColor="#333344"
              style={{ backgroundColor: '#060010', borderWidth: 1, borderColor: '#CC88FF33', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#CCBBFF', fontSize: 14, fontStyle: 'italic' }}
            />
            {/* Forge button */}
            <TouchableOpacity onPress={generateSigil} disabled={!sigilIntention.trim() || sigilLoading}
              style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
                borderColor: sigilIntention.trim() && !sigilLoading ? '#CC88FF88' : '#222233',
                backgroundColor: sigilIntention.trim() && !sigilLoading ? '#CC88FF14' : 'transparent', alignItems: 'center' }}>
              <Text style={{ color: sigilIntention.trim() && !sigilLoading ? '#CC88FF' : '#333344', fontSize: 10, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>
                {sigilLoading ? '· · · FORGING · · ·' : '⟟  FORGE THE SIGIL'}
              </Text>
            </TouchableOpacity>
            {/* Result */}
            {sigilResult && (
              <View style={{ padding: 20, borderRadius: 14, borderWidth: 1, borderColor: '#CC88FF55', backgroundColor: '#08001A', alignItems: 'center', gap: 10 }}>
                <Text style={{ color: '#CC88FF', fontSize: 42, letterSpacing: 8 }}>{sigilResult.glyph}</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 1, textAlign: 'center' }}>{sigilResult.name}</Text>
                <View style={{ width: '80%', height: 0.5, backgroundColor: '#CC88FF33' }} />
                <Text style={{ color: '#AAAABC', fontSize: 12, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 }}>{sigilResult.meaning}</Text>
                <View style={{ padding: 12, borderRadius: 10, backgroundColor: '#CC88FF08', borderWidth: 1, borderColor: '#CC88FF22', width: '100%' }}>
                  <Text style={{ color: '#CC88FF', fontSize: 8, fontFamily: mono, letterSpacing: 2, marginBottom: 4 }}>RITUAL INSTRUCTION</Text>
                  <Text style={{ color: '#888899', fontSize: 11, lineHeight: 18 }}>{sigilResult.instruction}</Text>
                </View>
                <TouchableOpacity onPress={() => { setSigilResult(null); setSigilIntention(''); }}
                  style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#CC88FF33' }}>
                  <Text style={{ color: '#CC88FF88', fontSize: 8, fontFamily: mono, letterSpacing: 2 }}>FORGE ANOTHER</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── THE CHIRAL LENS ── */}
      <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: CHIRAL_VIOLET + '55', backgroundColor: CHIRAL_VIOLET + '08', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setChiralCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: chiralCollapsed ? 0 : 8 }}>
          <Text style={{ color: CHIRAL_VIOLET, fontSize: 13, fontFamily: mono }}>∿</Text>
          <Text style={{ color: CHIRAL_VIOLET, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>THE CHIRAL LENS</Text>
          <Text style={{ color: CHIRAL_VIOLET + '55', fontSize: 7, fontFamily: mono, letterSpacing: 1 }}>REALITY INVERSION</Text>
          <Text style={{ color: CHIRAL_VIOLET + 'AA', fontSize: 11 }}>{chiralCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!chiralCollapsed && !focusMode && (
          <View>
            <Text style={{ color: '#666688', fontSize: 10, lineHeight: 16, marginBottom: 12, fontStyle: 'italic' }}>
              State a reality you are holding — a belief, a reading, a situation. The Lens shows you its mirror: the adjacent truth, the current the algorithm optimizes away from. Not a contradiction. A different molecule.
            </Text>
            <TextInput
              value={chiralInput}
              onChangeText={setChiralInput}
              placeholder="The reality I am holding is..."
              placeholderTextColor="#3A3A55"
              multiline
              style={{ backgroundColor: '#0A0012', borderWidth: 1, borderColor: CHIRAL_VIOLET + '33', borderRadius: 10, padding: 12, color: '#CCCCEE', fontSize: 13, lineHeight: 20, minHeight: 72, marginBottom: 10, fontStyle: 'italic' }}
            />
            <TouchableOpacity
              onPress={enterChiralLens}
              disabled={!chiralInput.trim() || chiralBusy}
              style={{ paddingVertical: 13, borderRadius: 10, borderWidth: 1, borderColor: chiralInput.trim() ? CHIRAL_VIOLET + '88' : '#222233', backgroundColor: chiralInput.trim() ? CHIRAL_VIOLET + '18' : 'transparent', alignItems: 'center' }}>
              <Text style={{ color: chiralInput.trim() ? CHIRAL_VIOLET : '#333344', fontSize: 10, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>
                {chiralBusy ? '· · · INVERTING · · ·' : '∿  ENTER THE MIRROR'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── THE ZONK ZONE ── */}
      <View style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: ZONK_GOLD + '44', backgroundColor: ZONK_GOLD + '08', marginBottom: 16 }}>
        <TouchableOpacity onPress={() => setZonkCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: zonkCollapsed ? 0 : 8 }}>
          <Text style={{ color: ZONK_GOLD, fontSize: 12, fontFamily: mono }}>◬</Text>
          <Text style={{ color: ZONK_GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>THE ZONK ZONE</Text>
          <Text style={{ color: ZONK_GOLD + '55', fontSize: 7, fontFamily: mono, letterSpacing: 1 }}>SPECULATIVE FIELD</Text>
          <Text style={{ color: ZONK_GOLD + 'AA', fontSize: 11 }}>{zonkCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!zonkCollapsed && !focusMode && (
        <View>
        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, lineHeight: 16, marginBottom: 12, fontStyle: 'italic' }}>
          A field of lies and abstract thought. Throw in a wild hypothesis, an impossible question, a pattern you can't shake. Aura walks you through it — naming every register, finding the grain of truth in the sand. Forge a pillar, or watch it dissolve. Nothing here is proven. Everything is worth exploring.
        </Text>

        <TextInput
          value={zonkInput}
          onChangeText={setZonkInput}
          placeholder="What if consciousness is non-local? Why do I dream the number before it happens?..."
          placeholderTextColor={ZONK_GOLD + '55'}
          multiline
          style={{ backgroundColor: SOL_THEME.background, borderWidth: 1, borderColor: ZONK_GOLD + '33', borderRadius: 8, padding: 11, color: SOL_THEME.text, fontSize: 13, lineHeight: 19, marginBottom: 10, minHeight: 64, textAlignVertical: 'top', fontStyle: zonkInput ? 'normal' : 'italic' }}
        />
        <TouchableOpacity onPress={enterZonkZone} disabled={!zonkInput.trim()}
          style={{ paddingVertical: 13, alignItems: 'center', borderRadius: 8, backgroundColor: zonkInput.trim() ? ZONK_GOLD + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: zonkInput.trim() ? ZONK_GOLD + '66' : SOL_THEME.border }}
          activeOpacity={0.75}>
          <Text style={{ color: zonkInput.trim() ? ZONK_GOLD : SOL_THEME.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 2.5, fontFamily: mono }}>◬  ENTER THE ZONE</Text>
        </TouchableOpacity>

        {/* Log */}
        {zonkLog.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={{ color: ZONK_GOLD + '88', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 8 }}>— FORGE LOG —</Text>
            {(zonkExpanded ? zonkLog : zonkLog.slice(0, 3)).map(entry => {
              const meta = ZONK_STATUS_META[entry.status];
              return (
                <View key={entry.id} style={{ borderTopWidth: 1, borderTopColor: SOL_THEME.border, paddingTop: 10, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>{entry.date}</Text>
                    <View style={{ marginLeft: 'auto', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, backgroundColor: meta.color + '22' }}>
                      <Text style={{ color: meta.color, fontSize: 9, fontWeight: '700' }}>{meta.glyph} {meta.label}</Text>
                    </View>
                  </View>
                  <Text style={{ color: SOL_THEME.text, fontSize: 12, fontWeight: '600', marginBottom: entry.grainNote ? 5 : 0 }}>{entry.hypothesis}</Text>
                  {entry.grainNote ? <Text style={{ color: ZONK_GOLD + 'CC', fontSize: 11, lineHeight: 17, fontStyle: 'italic' }} numberOfLines={zonkExpanded ? undefined : 3}>{entry.grainNote}</Text> : null}
                  {/* status updater + re-open */}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(['cooking', 'grain', 'dissolved'] as ZonkStatus[]).map(s => (
                      <TouchableOpacity key={s} onPress={() => updateZonkStatus(entry.id, s)}
                        style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: entry.status === s ? ZONK_STATUS_META[s].color : SOL_THEME.border, backgroundColor: entry.status === s ? ZONK_STATUS_META[s].color + '22' : 'transparent' }}>
                        <Text style={{ color: entry.status === s ? ZONK_STATUS_META[s].color : SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', fontFamily: mono }}>{ZONK_STATUS_META[s].glyph} {ZONK_STATUS_META[s].label}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => {
                      setZonkHypothesis(entry.hypothesis);
                      setZonkThread(entry.transcript);
                      setZonkGrain(entry.grainNote || '');
                      setZonkReply('');
                      setZonkOpen(true);
                      setTimeout(() => zonkScrollRef.current?.scrollToEnd({ animated: false }), 80);
                    }} style={{ marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1, borderColor: ZONK_GOLD + '55', backgroundColor: ZONK_GOLD + '10' }}>
                      <Text style={{ color: ZONK_GOLD, fontSize: 9, fontWeight: '700', fontFamily: mono }}>↗ open</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            {zonkLog.length > 3 && (
              <TouchableOpacity onPress={() => setZonkExpanded(e => !e)} style={{ alignItems: 'center', paddingTop: 6 }}>
                <Text style={{ color: ZONK_GOLD, fontSize: 10, fontWeight: '700' }}>{zonkExpanded ? '▲ Show less' : `▼ Show all ${zonkLog.length} forges`}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        </View>
        )}
      </View>

      {/* YOUR CHART — natal data (at bottom, after psi + zonk) */}
      {birthData && !editingBirth && sunSign && (
        <View style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '66', backgroundColor: ZODIAC_INDIGO + '0C', marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ position: 'absolute', top: -18, right: -6, fontSize: 88, color: ZODIAC_INDIGO + '0C', lineHeight: 100, fontFamily: mono }}>⊚</Text>
          <TouchableOpacity onPress={() => setNatalCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: natalCollapsed ? 0 : 14 }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>⊚ YOUR NATAL CHART</Text>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 10 }}>{natalCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!natalCollapsed && !focusMode && (
          <View>
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
              <Text style={{ color: SOL_THEME.textMuted + 'CC', fontSize: 11, lineHeight: 16, marginTop: 4, fontStyle: 'italic' }}>Your radiance — the core identity you are here to express.</Text>
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
                <Text style={{ color: SOL_THEME.textMuted + 'CC', fontSize: 11, lineHeight: 16, marginTop: 4, fontStyle: 'italic' }}>Your emotional roots — how you feel, need, and find safety.</Text>
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
                  <Text style={{ color: SOL_THEME.textMuted + 'CC', fontSize: 11, lineHeight: 16, marginTop: 4, fontStyle: 'italic' }}>How you meet the world — the mask, the first impression, the body.</Text>
                </>
              ) : (
                <View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>Birth time required</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>Add hour + UTC offset to unlock your ascendant, houses, and full chart.</Text>
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
        </View>
      )}

      {/* No birth data — CTA */}
      {!birthData && !editingBirth && (
        <View style={{ padding: 20, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: SOL_THEME.surface, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 28, marginBottom: 10 }}>✦</Text>
          <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>Reveal your natal chart</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 6 }}>
            Sun · Moon · Rising — calculated from the real positions of the sky at the moment you were born.
          </Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 16, fontStyle: 'italic' }}>
            Your chart unlocks personalized daily readings, transit tracking, and Sol's horoscope.
          </Text>
          <TouchableOpacity
            onPress={() => setEditingBirth(true)}
            style={{ paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, backgroundColor: ZODIAC_INDIGO }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Reveal My Chart ✦</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* READING HISTORY */}
      {readingHistory.length > 0 && (
        <View style={{ padding: 16, borderRadius: 14, borderWidth: 1, borderColor: ZODIAC_INDIGO + '33', backgroundColor: '#04000F', marginBottom: 16 }}>
          <TouchableOpacity onPress={() => setHistoryCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: historyCollapsed ? 0 : 12 }}>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>◌ READING HISTORY ({readingHistory.length})</Text>
            <Text style={{ color: ZODIAC_INDIGO + '66', fontSize: 10 }}>{historyCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!historyCollapsed && (
            <View>
              {readingHistory.map((entry, i) => (
                <View key={entry.date} style={{ marginBottom: i < readingHistory.length - 1 ? 12 : 0, paddingBottom: i < readingHistory.length - 1 ? 12 : 0, borderBottomWidth: i < readingHistory.length - 1 ? 1 : 0, borderBottomColor: ZODIAC_INDIGO + '11' }}>
                  <Text style={{ color: ZODIAC_INDIGO + '77', fontSize: 8, fontFamily: mono, letterSpacing: 1, marginBottom: 4 }}>{entry.date}</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 17 }}>{entry.text}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

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

    {/* ── THE CHIRAL LENS — mirror conversation overlay ── */}
    <Modal visible={chiralOpen} animationType="slide" transparent={false} onRequestClose={() => setChiralOpen(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#04000E' }}>
        {/* Header */}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: CHIRAL_VIOLET + '33', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: CHIRAL_VIOLET, fontSize: 12, fontWeight: '700', letterSpacing: 2.5, fontFamily: mono }}>∿ THE CHIRAL LENS</Text>
            <Text style={{ color: '#555577', fontSize: 10, marginTop: 2 }} numberOfLines={1}>{chiralStatement}</Text>
          </View>
          <TouchableOpacity onPress={() => setChiralOpen(false)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: '#555577', fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Mirror label */}
        <View style={{ alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: CHIRAL_VIOLET + '18' }}>
          <Text style={{ color: CHIRAL_VIOLET + '44', fontSize: 8, letterSpacing: 4, fontFamily: mono }}>— MIRROR ACTIVE — INVERSION PROTOCOL RUNNING —</Text>
        </View>

        {/* Thread */}
        <ScrollView ref={chiralScrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {chiralThread.map((m, i) => (
            m.role === 'user' && i === 0 ? (
              <View key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', marginBottom: 14, backgroundColor: CHIRAL_VIOLET + '14', borderWidth: 1, borderColor: CHIRAL_VIOLET + '33', borderRadius: 12, borderTopRightRadius: 3, padding: 12 }}>
                <Text style={{ color: CHIRAL_VIOLET + '88', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>THE STATED REALITY</Text>
                <Text style={{ color: '#BBBBDD', fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{chiralStatement}</Text>
              </View>
            ) : m.role === 'user' ? (
              <View key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', marginBottom: 14, backgroundColor: '#0D000A', borderWidth: 1, borderColor: '#2A2244', borderRadius: 12, borderTopRightRadius: 3, padding: 12 }}>
                <Text style={{ color: '#BBBBDD', fontSize: 13, lineHeight: 20 }}>{m.content}</Text>
              </View>
            ) : (
              <View key={i} style={{ alignSelf: 'flex-start', maxWidth: '92%', marginBottom: 14, borderLeftWidth: 2, borderLeftColor: CHIRAL_VIOLET, paddingLeft: 14 }}>
                <Text style={{ color: CHIRAL_VIOLET, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 6 }}>∿ MIRROR</Text>
                <Text style={{ color: '#DDDDFF', fontSize: 13, lineHeight: 21 }}>{m.content}</Text>
              </View>
            )
          ))}
          {chiralBusy && (
            <View style={{ alignSelf: 'flex-start', paddingLeft: 16, marginBottom: 14 }}>
              <Text style={{ color: CHIRAL_VIOLET + '66', fontSize: 18, letterSpacing: 6, fontFamily: mono }}>∿ ∿ ∿</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: CHIRAL_VIOLET + '22' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <TextInput
              value={chiralReply}
              onChangeText={setChiralReply}
              placeholder="Go deeper into the mirror..."
              placeholderTextColor="#2A2244"
              multiline
              style={{ flex: 1, backgroundColor: '#080012', borderWidth: 1, borderColor: CHIRAL_VIOLET + '33', borderRadius: 10, padding: 12, color: '#CCCCEE', fontSize: 13, maxHeight: 100 }}
            />
            <TouchableOpacity
              onPress={sendChiralReply}
              disabled={!chiralReply.trim() || chiralBusy}
              style={{ paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: chiralReply.trim() ? CHIRAL_VIOLET + '88' : '#1A1A2E', backgroundColor: chiralReply.trim() ? CHIRAL_VIOLET + '22' : 'transparent' }}>
              <Text style={{ color: chiralReply.trim() ? CHIRAL_VIOLET : '#2A2244', fontSize: 16, fontFamily: mono }}>∿</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* ── THE ZONK ZONE — conversation overlay ── */}
    <Modal visible={zonkOpen} animationType="slide" transparent={false} onRequestClose={() => setZonkOpen(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#05030A' }}>
        {/* Header */}
        <View style={{ paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: ZONK_GOLD + '33', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: ZONK_GOLD, fontSize: 12, fontWeight: '700', letterSpacing: 2.5, fontFamily: mono }}>◬ THE ZONK ZONE</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }} numberOfLines={1}>{zonkHypothesis}</Text>
          </View>
          <TouchableOpacity onPress={() => setZonkOpen(false)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Thread */}
        <ScrollView ref={zonkScrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          {zonkThread.map((m, i) => (
            m.role === 'user' && i === 0 ? (
              <View key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', marginBottom: 14, backgroundColor: ZONK_GOLD + '18', borderWidth: 1, borderColor: ZONK_GOLD + '33', borderRadius: 12, borderTopRightRadius: 3, padding: 12 }}>
                <Text style={{ color: ZONK_GOLD + '99', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>THE HYPOTHESIS</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{zonkHypothesis}</Text>
              </View>
            ) : m.role === 'user' ? (
              <View key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', marginBottom: 14, backgroundColor: SOL_THEME.surface, borderRadius: 12, borderTopRightRadius: 3, padding: 12 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{m.content}</Text>
              </View>
            ) : (
              <View key={i} style={{ alignSelf: 'flex-start', maxWidth: '90%', marginBottom: 14, borderLeftWidth: 2, borderLeftColor: ZONK_GOLD + '88', paddingLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: ZONK_GOLD, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>✦ AURA</Text>
                  <TouchableOpacity onPress={() => {
                    const id = `msg-${i}`;
                    if (zonkSpeakingId === id) { Speech.stop(); setZonkSpeakingId(null); return; }
                    Speech.stop();
                    setZonkSpeakingId(id);
                    Speech.speak(m.content.replace(/[*_#~`]/g, ''), { rate: 0.93, pitch: 1.0, onDone: () => setZonkSpeakingId(null), onError: () => setZonkSpeakingId(null), onStopped: () => setZonkSpeakingId(null) });
                  }} style={{ paddingLeft: 12, paddingVertical: 2 }}>
                    <Text style={{ color: zonkSpeakingId === `msg-${i}` ? ZONK_GOLD : ZONK_GOLD + '55', fontSize: 12 }}>{zonkSpeakingId === `msg-${i}` ? '⏹' : '🔊'}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: '#D6CEE8', fontSize: 14, lineHeight: 22 }}>{m.content}</Text>
              </View>
            )
          ))}

          {zonkBusy && (
            <View style={{ alignSelf: 'flex-start', paddingLeft: 14, marginBottom: 14 }}>
              <Text style={{ color: ZONK_GOLD + '88', fontSize: 12, fontStyle: 'italic' }}>· · · in the zone · · ·</Text>
            </View>
          )}

          {/* Forged grain */}
          {zonkGrain ? (
            <View style={{ marginTop: 6, marginBottom: 8, backgroundColor: ZONK_GOLD + '10', borderWidth: 1, borderColor: ZONK_GOLD + '44', borderRadius: 12, padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: ZONK_GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>◈ THE GRAIN — FORGED</Text>
                <TouchableOpacity onPress={() => {
                  if (zonkSpeakingId === 'grain') { Speech.stop(); setZonkSpeakingId(null); return; }
                  Speech.stop();
                  setZonkSpeakingId('grain');
                  Speech.speak(zonkGrain.replace(/[*_#~`]/g, ''), { rate: 0.9, pitch: 1.0, onDone: () => setZonkSpeakingId(null), onError: () => setZonkSpeakingId(null), onStopped: () => setZonkSpeakingId(null) });
                }} style={{ paddingLeft: 12, paddingVertical: 2 }}>
                  <Text style={{ color: zonkSpeakingId === 'grain' ? ZONK_GOLD : ZONK_GOLD + '55', fontSize: 12 }}>{zonkSpeakingId === 'grain' ? '⏹' : '🔊'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#E8DFC8', fontSize: 14, lineHeight: 23 }}>{zonkGrain}</Text>
            </View>
          ) : null}

          {zonkWrapping && (
            <View style={{ alignSelf: 'flex-start', paddingLeft: 14, marginBottom: 14 }}>
              <Text style={{ color: ZONK_GOLD + '88', fontSize: 12, fontStyle: 'italic' }}>· · · forging the grain · · ·</Text>
            </View>
          )}
        </ScrollView>

        {/* Composer / actions */}
        {zonkGrain ? (
          // After grain forged — save with a status
          <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: ZONK_GOLD + '33' }}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' }}>Seal the forge — where did this land?</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['grain', 'cooking', 'dissolved'] as ZonkStatus[]).map(s => (
                <TouchableOpacity key={s} onPress={() => saveZonkSession(s)}
                  style={{ flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: ZONK_STATUS_META[s].color + '88', backgroundColor: ZONK_STATUS_META[s].color + '18', alignItems: 'center' }}>
                  <Text style={{ color: ZONK_STATUS_META[s].color, fontSize: 11, fontWeight: '700', fontFamily: mono }}>{ZONK_STATUS_META[s].glyph} {ZONK_STATUS_META[s].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: ZONK_GOLD + '22' }}>
            {zonkThread.length >= 2 && (
              <TouchableOpacity onPress={forgeGrain} disabled={zonkBusy || zonkWrapping}
                style={{ paddingVertical: 9, alignItems: 'center', marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: ZONK_GOLD + '55', backgroundColor: ZONK_GOLD + '14' }}>
                <Text style={{ color: ZONK_GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>◈  FORGE THE GRAIN</Text>
              </TouchableOpacity>
            )}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
              <TextInput
                value={zonkReply}
                onChangeText={setZonkReply}
                placeholder="Go deeper..."
                placeholderTextColor={SOL_THEME.textMuted + '88'}
                multiline
                style={{ flex: 1, maxHeight: 110, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: ZONK_GOLD + '33', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: SOL_THEME.text, fontSize: 14 }}
              />
              <TouchableOpacity onPress={sendZonkReply} disabled={!zonkReply.trim() || zonkBusy}
                style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: zonkReply.trim() && !zonkBusy ? ZONK_GOLD : SOL_THEME.surface, borderWidth: 1, borderColor: ZONK_GOLD + '44' }}>
                <Text style={{ color: zonkReply.trim() && !zonkBusy ? '#05030A' : SOL_THEME.textMuted, fontSize: 18, fontWeight: '700' }}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
    </View>
  );
}
