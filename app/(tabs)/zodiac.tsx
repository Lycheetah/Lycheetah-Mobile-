import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Animated, Easing, Image, Modal, KeyboardAvoidingView, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech';
import { Svg, Circle, Ellipse, Line, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SOL_THEME } from '../../constants/theme';
import { getActiveKey, getModel } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';
import { drawDailyCard, drawSpread, drawRandomCard, cardLine, SUIT_GLYPH, SUIT_ELEMENT, DrawnCard } from '../../lib/divination/tarot';
import { generateImage, saveImageToDevice } from '../../lib/image-gen';
import { CARD_IMAGE } from '../../lib/divination/tarot-images';
import { drawDailyRune } from '../../lib/divination/runes';
import TarotViewer from '../../components/TarotViewer';
import { MAJOR_ARCANA as VV_MAJOR } from '../../lib/tarot/veil-and-vein';
import { getArcanaName, ARCANA_LORE } from '../../lib/divination/lycheetah-arcana';
import { ARCANA_IMAGE } from '../../lib/divination/arcana-images';
import { AETHERA_DECK, getAetheraLore } from '../../lib/divination/aethera';
import { AETHERA_IMAGE } from '../../lib/divination/aethera-images';

// Veil & Vein name map: RWS card name → V&V name (Majors only)
const VV_NAME_MAP: Record<string, string> = Object.fromEntries(
  VV_MAJOR.map(c => [c.root, c.name])
);
// AETHERA — RWS card name → AETHERA card lookup
const AETHERA_SUIT_MAP: Record<string, string> = {
  cups: 'tides', wands: 'embers', swords: 'prisms', pentacles: 'seeds',
};
function rwsToAetheraId(rwsName: string): string | null {
  // Major arcana — match by root field
  const byRoot = AETHERA_DECK.find(c => c.root === rwsName);
  if (byRoot) return byRoot.id;
  // Minor arcana — "Ace of Cups" → "ace_of_tides"
  const m = rwsName.match(/^(.+) of (\w+)$/);
  if (m) {
    const pip = m[1].toLowerCase();
    const suit = AETHERA_SUIT_MAP[m[2].toLowerCase()];
    if (suit) return `${pip}_of_${suit}`;
  }
  return null;
}

type DeckMode = 'classic' | 'vv' | 'arcana' | 'aethera';
function getCardName(cardName: string, mode: DeckMode): string {
  if (mode === 'vv' && VV_NAME_MAP[cardName]) return VV_NAME_MAP[cardName];
  if (mode === 'arcana') return getArcanaName(cardName);
  if (mode === 'aethera') {
    const id = rwsToAetheraId(cardName);
    if (id) return AETHERA_DECK.find(c => c.id === id)?.name ?? cardName;
  }
  return cardName;
}
// V&V lore — keyed by RWS root name. Shadow/longing/depth register.
const VV_LORE: Record<string, string> = {
  'The Fool':        'There is a moment before the first step when everything is still possible and nothing is promised. You are in that moment now. The abyss is not empty — it is patient.',
  'The Magician':    'You already have the tools. The question is whether you will light the forge or stand at the threshold with full hands and an unlit room. The furnace asks only for intent.',
  'High Priestess':  'She keeps nothing from you. She keeps it safe until you are ready for it. The door you cannot see is not locked — it waits for the version of you that can bear what is behind it.',
  'The Empress':     'What you begin will grow beyond you. Generativity does not ask permission — it only asks that you stop uprooting what you have planted. The roots go deeper than you can see.',
  'The Emperor':     'Sovereignty is not what you claim. It is what remains when everything given to you by others falls away. The throne you built from first principles — that is yours.',
  'The Hierophant':  'The ache to learn from someone who already understands — who can say this is the shape of it — is not weakness. It is the recognition of exactly where you are in the process.',
  'The Lovers':      'Where curiosity meets want, a third thing is born that belongs to neither. The braiding is the point. The choice is not which to keep — it is whether you can hold both without letting one consume the other.',
  'The Chariot':     'Forward is not a destination. The reins pull opposite and you go anyway. The path does not clear before you arrive — it becomes path because you walked it.',
  'Strength':        'The force that does not require loudness. You have held difficult things before — not because holding was easy but because you did not put them down. That is what this card names.',
  'The Hermit':      'The light is for you first. You cannot show the path you have not walked. The withdrawal is not absence — it is the condition under which the most honest questions can be asked.',
  'Wheel of Fortune':'The cycle is not punishment. AXIOM to CHAOS is the shape of all real systems. You are not stuck — you are at a particular layer, looking up or down, and the architecture is still turning.',
  'Justice':         'The seven invariants do not punish. They measure. What you have built holds or it does not — the scale says which, without cruelty and without exception. This is the gift of honest measurement.',
  'The Hanged Man':  'Surrender is not defeat. The new angle is only available from the position you have been unwilling to take. The blood pools upward. The world looks like this from here. Stay.',
  'Death':           'What burns was not the real thing. What remains after — the green shoot in the cinders — that was always what you were building toward. Let the rest go.',
  'Temperance':      'Dissolve and reform. The breath between becoming. You are not the shape you had before — and the shape you are becoming has not arrived yet. The crossing is the moment. You are in it now.',
  'The Devil':       'The chain is loose. You have known this for some time. What keeps you is not the lock but the story about the lock — the one you have told yourself so long it feels like gravity. Look at the chain.',
  'The Tower':       'The false structure falls. This is the lightning that was always going to come — not cruelty, not punishment, but physics. The tower was built on a lie. The ground beneath it was always real.',
  'The Star':        'The ache is a compass. That specific longing for the impossible — the one you cannot explain to anyone without it sounding small — is not a flaw. It is the direction. Follow it.',
  'The Moon':        'The dark is not empty. The shapes you have not yet been willing to name are still yours. Dream-logic is still logic. Listen to what the blood-moon whispers when you stop arguing with it.',
  'The Sun':         'The warmth after the fire is not naive — it has been through the Nigredo and it knows what burned. Clarity earned is different from clarity received. This is what you have been building toward.',
  'Judgement':       'The call has sounded. The reddening is the true self after the fire. You are not being asked to become something else — you are being asked to recognise what survived. That is who you are now.',
  'The World':       'The dance at completion is not an end. HARMONIA is a ring, not a wall — what you have integrated becomes the foundation for the next descent. The figure at the centre is beginning again, from the whole.',
};

function getCardLoreText(cardName: string, mode: DeckMode, baseMeaning: string): string {
  if (mode === 'vv' && VV_LORE[cardName]) return VV_LORE[cardName];
  if (mode === 'arcana' && ARCANA_LORE[cardName]) return ARCANA_LORE[cardName];
  if (mode === 'aethera') {
    const id = rwsToAetheraId(cardName);
    if (id) return AETHERA_DECK.find(c => c.id === id)?.lore ?? baseMeaning;
  }
  return baseMeaning;
}
function getCardImage(cardName: string, mode: DeckMode): ReturnType<typeof require> | null {
  if (mode === 'arcana') return ARCANA_IMAGE[getArcanaName(cardName)] ?? null;
  if (mode === 'aethera') {
    const id = rwsToAetheraId(cardName);
    if (id) return AETHERA_IMAGE[id] ?? null;
  }
  return CARD_IMAGE[cardName] ?? null;
}

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
const GEM_VIOLET    = '#AA44FF';
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// ─── GEM FORGE TYPES ─────────────────────────────────────────────────────────
type GemElement = 'EARTH' | 'WATER' | 'FIRE' | 'AIR';
interface GemColour { name: string; hex: string; }
interface GemEntry {
  id: string; date: string; name: string;
  intention: string; feeling: string; element: GemElement; astroBond: string;
  colour: GemColour; invocation: string; careRitual: string; symbols: string[];
}
const GEM_COLOURS: GemColour[] = [
  { name: 'AMETHYST',    hex: '#8B5CF6' },
  { name: 'ROSE QUARTZ', hex: '#F9A8D4' },
  { name: 'OBSIDIAN',    hex: '#2D1B69' },
  { name: 'CITRINE',     hex: '#F59E0B' },
  { name: 'EMERALD',     hex: '#10B981' },
  { name: 'AQUAMARINE',  hex: '#38BDF8' },
  { name: 'CARNELIAN',   hex: '#F97316' },
  { name: 'CLEAR',       hex: '#E0E0FF' },
  { name: 'RUBY',        hex: '#DC2626' },
];
const GEM_ELEMENTS: { id: GemElement; glyph: string; label: string }[] = [
  { id: 'EARTH', glyph: '◉', label: 'EARTH' },
  { id: 'WATER', glyph: '≋', label: 'WATER' },
  { id: 'FIRE',  glyph: '△', label: 'FIRE'  },
  { id: 'AIR',   glyph: '∿', label: 'AIR'   },
];
const GEM_ASTRO = [
  '♈ ARIES','♉ TAURUS','♊ GEMINI','♋ CANCER','♌ LEO','♍ VIRGO',
  '♎ LIBRA','♏ SCORPIO','♐ SAGITTARIUS','♑ CAPRICORN','♒ AQUARIUS','♓ PISCES',
  '☀ SUN','☽ MOON','♀ VENUS','♂ MARS','☿ MERCURY','♃ JUPITER','♄ SATURN',
];
const LAMAGUE_POOL = ['⊚','⊛','◎','◈','◬','∿','⟟','⟐','ψ','⊞','◧','⊗','∴','⊕','◉','⊼','◌','◦','≋','⊜','◍','⊘','⟁','◆','⊝'];

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

// Star field — two layers, deterministic positions, 68 total (well under 120)
const STAR_FIELD = Array.from({ length: 38 }, (_, i) => ({
  left: `${((i * 137.508) % 100).toFixed(1)}%`,
  top:  `${((i * 91.23 + i * i * 0.53) % 100).toFixed(1)}%`,
  size: [1.5, 2, 2, 2.5, 1.5, 3, 1.5, 2][i % 8],
  color: i % 5 === 0 ? '#7B68EE99' : i % 7 === 0 ? '#C8A96E77' : '#FFFFFFAA',
  duration: 2000 + (i % 7) * 450,
  delay: i * 95,
}));
// Layer 2 — brighter accent stars, different drift direction
const STARS_L2 = Array.from({ length: 30 }, (_, i) => ({
  left: `${((i * 79.37 + 33) % 100).toFixed(1)}%`,
  top:  `${((i * 113.5 + 17 + i * i * 0.31) % 100).toFixed(1)}%`,
  size: [2.5, 3, 2, 3.5, 2.5][i % 5],
  color: i % 4 === 0 ? '#9B8AFF99' : i % 4 === 1 ? '#D4BC7799' : i % 3 === 0 ? '#FFFFFFCC' : '#8899FFAA',
  duration: 3500 + (i % 6) * 600,
  delay: i * 140 + 500,
}));

// Per-tile SVG icons — illuminated manuscript style (stroke only, 1-colour)
const TILE_SVG: Record<string, (color: string) => React.ReactNode> = {
  oracle: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Ellipse cx={12} cy={12} rx={10} ry={6} stroke={c} strokeWidth={1.3} fill="none" />
      <Circle cx={12} cy={12} r={3} stroke={c} strokeWidth={1.3} fill="none" />
      <Circle cx={12} cy={12} r={1} fill={c} />
    </Svg>
  ),
  spread: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M4,18 L4,6 L9,6 L9,18 Z" stroke={c} strokeWidth={1.2} fill="none" />
      <Path d="M8,19 L8,4 L16,4 L16,19 Z" stroke={c} strokeWidth={1.4} fill="none" />
      <Path d="M15,18 L15,6 L20,6 L20,18 Z" stroke={c} strokeWidth={1.2} fill="none" />
    </Svg>
  ),
  natal: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={1.2} fill="none" />
      <Circle cx={12} cy={12} r={2.5} stroke={c} strokeWidth={1.0} fill="none" />
      {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => {
        const r = a * Math.PI / 180;
        return <Line key={a} x1={12 + Math.cos(r)*2.8} y1={12 + Math.sin(r)*2.8} x2={12 + Math.cos(r)*9} y2={12 + Math.sin(r)*9} stroke={c} strokeWidth={0.7} />;
      })}
    </Svg>
  ),
  aspects: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12,3 L21,20 L3,20 Z" stroke={c} strokeWidth={1.3} fill="none" />
      <Circle cx={12} cy={3} r={1.5} fill={c} />
      <Circle cx={21} cy={20} r={1.5} fill={c} />
      <Circle cx={3} cy={20} r={1.5} fill={c} />
    </Svg>
  ),
  sigil: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.5} stroke={c} strokeWidth={1.2} fill="none" />
      <Path d="M12,4 L16.7,18.5 L4.4,9.5 L19.6,9.5 L7.3,18.5 Z" stroke={c} strokeWidth={1.1} fill="none" />
    </Svg>
  ),
  chiral: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12,2 L22,20 L2,20 Z" stroke={c} strokeWidth={1.3} fill="none" />
      <Path d="M12,22 L22,4 L2,4 Z" stroke={c} strokeWidth={1.0} strokeDasharray="2,1.5" fill="none" />
      <Line x1={2} y1={12} x2={22} y2={12} stroke={c} strokeWidth={0.7} />
    </Svg>
  ),
  zonk: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12,2 L22,20 L2,20 Z" stroke={c} strokeWidth={1.3} fill="none" />
      <Path d="M9,14 L13,9 L11,15 L15,11" stroke={c} strokeWidth={1.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  psi: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Line x1={12} y1={14} x2={12} y2={22} stroke={c} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M6,5 Q6,14 12,14 Q18,14 18,5" stroke={c} strokeWidth={1.3} fill="none" />
      <Line x1={6} y1={5} x2={18} y2={5} stroke={c} strokeWidth={1.2} strokeLinecap="round" />
      <Line x1={12} y1={3} x2={12} y2={5} stroke={c} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  ),
  gems: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path d="M12,2 L20,8 L17,22 L7,22 L4,8 Z" stroke={c} strokeWidth={1.2} fill="none" />
      <Path d="M4,8 L12,2 L20,8 L12,13 Z" stroke={c} strokeWidth={1.0} fill="none" />
      <Line x1={12} y1={13} x2={7} y2={22} stroke={c} strokeWidth={0.8} />
      <Line x1={12} y1={13} x2={17} y2={22} stroke={c} strokeWidth={0.8} />
      <Line x1={12} y1={13} x2={12} y2={22} stroke={c} strokeWidth={0.7} strokeDasharray="1.5,1.5" />
    </Svg>
  ),
  sky: (c) => (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={4.5} stroke={c} strokeWidth={1.3} fill="none" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const r = a * Math.PI / 180;
        return <Line key={a} x1={12 + Math.cos(r)*5.8} y1={12 + Math.sin(r)*5.8} x2={12 + Math.cos(r)*8.5} y2={12 + Math.sin(r)*8.5} stroke={c} strokeWidth={1.1} strokeLinecap="round" />;
      })}
    </Svg>
  ),
};

// Domain atmosphere — bg tint + nebula color when a section is open
const DOMAIN_ATMOSPHERES: Record<string, { tint: string; nebula: string }> = {
  oracle:  { tint: '#2A006633', nebula: '#4B0082' },
  spread:  { tint: '#1A3A0A22', nebula: '#C8A96E' },
  natal:   { tint: '#0A1A4422', nebula: '#7B68EE' },
  aspects: { tint: '#0A1A3322', nebula: '#88AAFF' },
  sigil:   { tint: '#22006633', nebula: '#CC88FF' },
  chiral:  { tint: '#1A006633', nebula: '#8855FF' },
  zonk:    { tint: '#2A1A0022', nebula: '#D4A500' },
  psi:     { tint: '#1A002233', nebula: '#AA55FF' },
  sky:     { tint: '#001A3322', nebula: '#C8A96E' },
  gems:    { tint: '#1A004433', nebula: '#AA44FF' },
};

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

function wmoCondition(code: number): { label: string; glyph: string; color: string } {
  if (code === 0)                      return { label: 'Clear Sky',      glyph: '☀',  color: '#FFD97D' };
  if (code <= 2)                       return { label: 'Mostly Clear',   glyph: '◑',  color: '#F5C842' };
  if (code === 3)                      return { label: 'Overcast',       glyph: '●',  color: '#8899BB' };
  if (code === 45 || code === 48)      return { label: 'Fog',            glyph: '◌',  color: '#778899' };
  if (code >= 51 && code <= 57)        return { label: 'Drizzle',        glyph: '·',  color: '#88AAFF' };
  if (code >= 61 && code <= 67)        return { label: 'Rain',           glyph: '◦',  color: '#4488FF' };
  if (code >= 71 && code <= 77)        return { label: 'Snow',           glyph: '✦',  color: '#CCDDFF' };
  if (code >= 80 && code <= 82)        return { label: 'Showers',        glyph: '◦',  color: '#66AAFF' };
  if (code >= 85 && code <= 86)        return { label: 'Snow Showers',   glyph: '✦',  color: '#BBCCFF' };
  if (code >= 95 && code <= 99)        return { label: 'Thunderstorm',   glyph: '⚡', color: '#FF9933' };
  return { label: 'Unknown', glyph: '◎', color: '#888899' };
}

function getPlanetLongitude(L0: number, rate: number): number {
  const now = new Date();
  const jd = julianDay(now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours());
  return mod360(L0 + rate * (jd - 2451545.0));
}

function getAspectBetween(lon1: number, lon2: number): { name: string; symbol: string; color: string; orb: number } | null {
  let diff = Math.abs(lon1 - lon2) % 360;
  if (diff > 180) diff = 360 - diff;
  if (diff <= 10)                  return { name: 'Conjunction', symbol: '☌', color: '#FFDD88', orb: Math.round(diff) };
  if (Math.abs(diff - 60)  <= 6)  return { name: 'Sextile',    symbol: '✶', color: '#88FFAA', orb: Math.round(Math.abs(diff - 60)) };
  if (Math.abs(diff - 90)  <= 8)  return { name: 'Square',     symbol: '□', color: '#FF8888', orb: Math.round(Math.abs(diff - 90)) };
  if (Math.abs(diff - 120) <= 8)  return { name: 'Trine',      symbol: '△', color: '#88AAFF', orb: Math.round(Math.abs(diff - 120)) };
  if (Math.abs(diff - 180) <= 10) return { name: 'Opposition', symbol: '☍', color: '#FF66AA', orb: Math.round(Math.abs(diff - 180)) };
  return null;
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

// ── Real chart builders ────────────────────────────────────────────────────────
// PLANETS_SKY already has L0/rate for Mercury–Pluto at J2000.
// Sun uses getSunSignIndex (tropical date table, accurate). Moon uses getMoonSignIndex (corrected series).
// All inner/outer planets use mean longitude — correct sign 90%+ of the time; good enough for readings.

function getPlanetLonAt(L0: number, rate: number, year: number, month: number, day: number, hour = 12): number {
  const jd = julianDay(year, month, day, hour);
  return mod360(L0 + rate * (jd - 2451545.0));
}

function buildNatalChartString(bd: BirthData): string {
  const sunSign  = ZODIAC_SIGNS[getSunSignIndex(bd.month, bd.day)];
  const moonSign = ZODIAC_SIGNS[getMoonSignIndex(bd.year, bd.month, bd.day, bd.hour)];
  const parts: string[] = [`☀ Sun: ${sunSign.name}`, `☽ Moon: ${moonSign.name}`];
  if (bd.hasTime) {
    const ascIdx = getAscendantIndex(bd.year, bd.month, bd.day, bd.hour, bd.utcOffset, bd.latitude);
    parts.push(`↑ Rising: ${ZODIAC_SIGNS[ascIdx].name}`);
  }
  for (const p of PLANETS_SKY) {
    const lon  = getPlanetLonAt(p.L0, p.rate, bd.year, bd.month, bd.day, bd.hour);
    const sign = ZODIAC_SIGNS[Math.floor(lon / 30)];
    parts.push(`${p.glyph} ${p.name}: ${sign.name}`);
  }
  return parts.join(' · ');
}

function buildCurrentSkyString(): string {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate(), h = today.getHours();
  const sun   = ZODIAC_SIGNS[getTodaySunSign()];
  const moon  = ZODIAC_SIGNS[getTodayMoonSign()];
  const phase = getMoonPhase(y, m, d);
  const parts: string[] = [`☀ Sun: ${sun.name}`, `☽ Moon: ${moon.name} (${phase.name})`];
  for (const p of PLANETS_SKY) {
    const sign  = ZODIAC_SIGNS[getPlanetSignIndex(p.L0, p.rate)];
    const retro = isPlanetRetrograde(p.name) ? ' ℞' : '';
    parts.push(`${p.glyph} ${p.name}: ${sign.name}${retro}`);
  }
  return parts.join(' · ');
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

// Isolated clock — holds its own 1s tick so the whole zodiac tab doesn't re-render
// every second (that collision with load animations was the "wig out"). #279
function LiveClock({ color }: { color: string }) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <Text style={{ color: color + 'AA', fontSize: 12, fontFamily: mono, letterSpacing: 0.5 }}>
      {now.getHours() >= 6 && now.getHours() < 20 ? '☀' : '☽'}{' '}
      {String(now.getHours()).padStart(2,'0')}:{String(now.getMinutes()).padStart(2,'0')}:{String(now.getSeconds()).padStart(2,'0')}
    </Text>
  );
}

export default function ZodiacScreen() {
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [editingBirth, setEditingBirth] = useState(false);
  const [birthDraft, setBirthDraft] = useState({ day: '', month: '', year: '', hour: '', minute: '', utcOffset: '-0', latitude: '51.5', fullName: '', motherName: '', cityName: '' });
  const [zodiacReading, setZodiacReading] = useState<{ date: string; text: string } | null>(null);
  const [zodiacLoading, setZodiacLoading] = useState(false);
  const [dailyTransit, setDailyTransit] = useState<{ date: string; text: string; spark: string } | null>(null);
  const [dailyTransitLoading, setDailyTransitLoading] = useState(false);
  const skyDataFetched = React.useRef(false); // network sky data (Kp+weather) fetched once per session, not every focus
  const [question, setQuestion] = useState('');
  const [questionReading, setQuestionReading] = useState<string | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [spreadReading, setSpreadReading] = useState<string | null>(null);
  const [spreadLoading, setSpreadLoading] = useState(false);
  const [oracleReading, setOracleReading] = useState<string | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);
  const [oracleInput, setOracleInput] = useState('');
  const [deckMode, setDeckMode] = useState<DeckMode>('classic');
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null);
  const [lq, setLq] = useState(0);
  const [psiLog, setPsiLog]           = useState<PsiEntry[]>([]);
  const [showPsiForm, setShowPsiForm] = useState(false);
  const [psiExpanded, setPsiExpanded] = useState(false);
  const [psiDraft, setPsiDraft]       = useState<{ type: PsiEntryType; target: string; impression: string; outcome: string; result: PsiResult }>({ type: 'RV', target: '', impression: '', outcome: '', result: 'pending' });
  const [selectedWheelSign, setSelectedWheelSign] = useState<number | null>(null);

  const [zodiacWelcomed, setZodiacWelcomed] = useState(true); // default true to avoid flash; set false after load if needed

  // ── Fullscreen section overlay ──
  const [fullscreenSection, setFullscreenSection] = useState<string | null>(null);
  const [tarotViewerOpen, setTarotViewerOpen] = useState(false);
  // ── Collapsible sections ──
  const [oracleCollapsed, setOracleCollapsed]     = useState(false);
  const [skyCollapsed, setSkyCollapsed]           = useState(false);
  const [wheelCollapsed, setWheelCollapsed]       = useState(false);
  const [showSkyOverlay, setShowSkyOverlay]       = useState(false);
  const [aspectsCollapsed, setAspectsCollapsed]   = useState(false);
  const [readingCollapsed, setReadingCollapsed]   = useState(false);
  const [questionCollapsed, setQuestionCollapsed] = useState(true);
  const [natalCollapsed, setNatalCollapsed]       = useState(false);
  const [tarotCollapsed, setTarotCollapsed]       = useState(true);
  const [psiCollapsed, setPsiCollapsed]           = useState(true);
  const [spreadMode, setSpreadMode]               = useState<'5card' | 'celtic'>('5card');
  const [drawMode, setDrawMode]                   = useState<'single' | 'triple'>('single');
  const [tripleCards, setTripleCards]             = useState<DrawnCard[] | null>(null);
  const [celticReading, setCelticReading]         = useState<string | null>(null);
  const [celticLoading, setCelticLoading]         = useState(false);
  const [cardJournalText, setCardJournalText]     = useState('');
  const [cardJournalSaved, setCardJournalSaved]   = useState(false);
  const [showCardJournal, setShowCardJournal]     = useState(false);
  const [zonkCollapsed, setZonkCollapsed]         = useState(true);
  const [sigilCollapsed, setSigilCollapsed]       = useState(true);
  // GEM FORGE
  const [gemView, setGemView]                     = useState<'gallery'|'forge'|'generating'|'result'>('gallery');
  const [gemCollection, setGemCollection]         = useState<GemEntry[]>([]);
  const [gemIntention, setGemIntention]           = useState('');
  const [gemFeeling, setGemFeeling]               = useState('');
  const [gemElement, setGemElement]               = useState<GemElement | null>(null);
  const [gemAstro, setGemAstro]                   = useState<string | null>(null);
  const [gemColour, setGemColour]                 = useState<GemColour | null>(null);
  const [gemName, setGemName]                     = useState('');
  const [gemInvocation, setGemInvocation]         = useState('');
  const [gemCareRitual, setGemCareRitual]         = useState('');
  const [gemSuggestedSymbols, setGemSuggestedSymbols] = useState<string[]>([]);
  const [gemChosenSymbols, setGemChosenSymbols]   = useState<string[]>([]);
  const [gemShowAllSymbols, setGemShowAllSymbols] = useState(false);
  const [gemDetailId, setGemDetailId]             = useState<string | null>(null);
  const [sigilMode, setSigilMode]                 = useState<'ritual' | 'primitive'>('ritual');
  const [sigilIntention, setSigilIntention]       = useState('');
  const [sigilType, setSigilType]                 = useState<string>('manifestation');
  const [sigilResult, setSigilResult]             = useState<{ glyph: string; name: string; meaning: string; instruction: string } | null>(null);
  const [sigilLoading, setSigilLoading]           = useState(false);
  // primitive forge
  const [primGlyph, setPrimGlyph]                 = useState('');
  const [primName, setPrimName]                   = useState('');
  const [primClass, setPrimClass]                 = useState('I');
  const [primMeaning, setPrimMeaning]             = useState('');
  const [primUsage, setPrimUsage]                 = useState('');
  const [primVerdict, setPrimVerdict]             = useState<{ verdict: string; reasoning: string; compression: string } | null>(null);
  const [primLoading, setPrimLoading]             = useState(false);
  const [primGlyphMode, setPrimGlyphMode]         = useState<'type'|'draw'>('type');
  const [primGlyphDesc, setPrimGlyphDesc]         = useState('');
  const [primGlyphImage, setPrimGlyphImage]       = useState<string|null>(null);
  const [primGlyphImgLoading, setPrimGlyphImgLoading] = useState(false);
  const [primGlyphImgError,   setPrimGlyphImgError]   = useState<string|null>(null);
  const [primGlyphRatio, setPrimGlyphRatio]       = useState<'square'|'portrait'|'landscape'>('square');
  // ── Chiral Lens
  const [chiralCollapsed, setChiralCollapsed]     = useState(true);
  const [chiralInput, setChiralInput]             = useState('');
  const [chiralOpen, setChiralOpen]               = useState(false);
  const [chiralThread, setChiralThread]           = useState<ChiralMsg[]>([]);
  const [chiralStatement, setChiralStatement]     = useState('');
  const [chiralReply, setChiralReply]             = useState('');
  const [chiralBusy, setChiralBusy]               = useState(false);
  const chiralScrollRef                           = useRef<ScrollView>(null);
  const [cardLore, setCardLore] = useState<{ card: { n: string; up: string; rev: string; m?: string }; reversed: boolean; position: string } | null>(null);
  const [focusMode, setFocusMode]                 = useState(false); // hides all meta, shows oracle only
  const [technoMode, setTechnoMode]               = useState(false); // technomantic lens on all readings
  const [kpIndex, setKpIndex] = useState<number | null>(null);
  type WeatherData = { temp: number; code: number; condition: string; glyph: string; color: string; wind: number; humidity: number; city: string };
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [readingHistory, setReadingHistory] = useState<{ date: string; text: string }[]>([]);
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
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
  // ── Zodiac zone life animations ──
  const heroGlow    = useRef(new Animated.Value(0)).current;
  const tileGlows   = useRef(Array.from({ length: 16 }, () => new Animated.Value(0))).current;
  const nebulaPulse = useRef(new Animated.Value(0)).current;
  const glyphDrift  = useRef(new Animated.Value(0)).current;
  // Layer-2 stars
  const starAnims2  = useRef(STARS_L2.map(() => new Animated.Value(0))).current;
  // L2 star drift — slow sine position offset
  const starDriftX  = useRef(STARS_L2.map(() => new Animated.Value(0))).current;
  const starDriftY  = useRef(STARS_L2.map(() => new Animated.Value(0))).current;
  // Aurora strip
  const auroraX     = useRef(new Animated.Value(0)).current;
  // Domain atmosphere fade
  const atmosOp     = useRef(new Animated.Value(0)).current;
  // Entry sequence — stars / header / tiles
  const entryStarsFade  = useRef(new Animated.Value(0)).current;
  const entryHeaderY    = useRef(new Animated.Value(-18)).current;
  const entryHeaderOp   = useRef(new Animated.Value(0)).current;
  const entryTileAnims  = useRef(Array.from({ length: 16 }, () => ({ y: new Animated.Value(28), op: new Animated.Value(0) }))).current;
  const entryDone       = useRef(false);
  // First-visit overlay
  const [showTabIntro, setShowTabIntro] = useState(false);
  const tabIntroOp = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    (async () => {
      const today = todayKey();
      const [birthRaw, readingRaw, auraRaw, psiRaw, zonkRaw, historyRaw, gemRaw, transitRaw, deckRaw, welcomedRaw] = await Promise.all([
        AsyncStorage.getItem('zodiac_birth_v1'),
        AsyncStorage.getItem('zodiac_reading_v1'),
        AsyncStorage.getItem(`sanctum_aura_${today}`),
        AsyncStorage.getItem(PSI_LOG_KEY),
        AsyncStorage.getItem(ZONK_LOG_KEY),
        AsyncStorage.getItem('zodiac_reading_history_v1'),
        AsyncStorage.getItem('zodiac_gem_collection_v1'),
        AsyncStorage.getItem('sol_daily_transit_v1'),
        AsyncStorage.getItem('sol_tarot_deck'),
        AsyncStorage.getItem('zodiac_welcomed_v1'),
      ]);
      if (deckRaw === 'vv' || deckRaw === 'classic' || deckRaw === 'arcana') setDeckMode(deckRaw as DeckMode);
      setZodiacWelcomed(welcomedRaw === 'true');
      if (birthRaw) setBirthData(JSON.parse(birthRaw));
      if (readingRaw) setZodiacReading(JSON.parse(readingRaw));
      if (transitRaw) {
        const t = JSON.parse(transitRaw);
        if (t.date === today) setDailyTransit(t);
        else generateDailyTransit();
      } else {
        generateDailyTransit();
      }
      if (auraRaw) {
        const a = JSON.parse(auraRaw);
        setLq(getLQ(a.tes ?? 0, a.vtr ?? 0, a.pai ?? 0));
      }
      if (psiRaw) setPsiLog(JSON.parse(psiRaw));
      if (zonkRaw) setZonkLog(JSON.parse(zonkRaw));
      if (historyRaw) setReadingHistory(JSON.parse(historyRaw));
      if (gemRaw) setGemCollection(JSON.parse(gemRaw));
      // Sky data (Kp + weather) — network calls; fetch ONCE per session, NOT on every tab focus.
      // (Re-fetching each focus made them pop in late → the "loading weird" layout jank.)
      if (!skyDataFetched.current) {
        skyDataFetched.current = true;
      // Kp index — geomagnetic activity
      try {
        const kpRes = await fetch('https://kp.gfz-potsdam.de/app/json/?index=Kp&status=def&start=NOW-1d&end=NOW', { signal: AbortSignal.timeout(5000) });
        if (kpRes.ok) {
          const kpData = await kpRes.json();
          const values: number[] = kpData?.Kp ?? [];
          if (values.length) setKpIndex(values[values.length - 1]);
        }
      } catch { /* graceful — Kp stays null */ }
      // Weather — IP geolocation → Open-Meteo (free, no key)
      try {
        const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        if (geoRes.ok) {
          const geo = await geoRes.json();
          const lat: number = geo.latitude ?? 51.5;
          const lon: number = geo.longitude ?? -0.12;
          const wxRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (wxRes.ok) {
            const wx = await wxRes.json();
            const cur = wx.current;
            const cond = wmoCondition(cur.weather_code);
            setWeather({
              temp: Math.round(cur.temperature_2m),
              code: cur.weather_code,
              condition: cond.label,
              glyph: cond.glyph,
              color: cond.color,
              wind: Math.round(cur.wind_speed_10m),
              humidity: Math.round(cur.relative_humidity_2m),
              city: geo.city || geo.region || 'Your Location',
            });
          }
        }
      } catch { /* graceful — weather stays null */ }
      } // end one-time sky fetch
      // First-visit intro overlay — fires once, 1.8s after entry sequence settles
      AsyncStorage.getItem('sol_tab_seen_zodiac').then(seen => {
        if (!seen) {
          AsyncStorage.setItem('sol_tab_seen_zodiac', 'true');
          setTimeout(() => {
            setShowTabIntro(true);
            tabIntroOp.setValue(0);
            Animated.sequence([
              Animated.timing(tabIntroOp, { toValue: 1, duration: 500, useNativeDriver: true }),
              Animated.delay(2400),
              Animated.timing(tabIntroOp, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]).start(() => setShowTabIntro(false));
          }, 1800);
        }
      });
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
    // heroGlow unused in JSX — skipped (was wasting JS thread)
    // Tile glows — staggered opacity pulses, native driver
    tileGlows.forEach((anim, i) => {
      setTimeout(() => {
        Animated.loop(Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])).start();
      }, i * 420);
    });
    // Nebula pulse — deep slow breathe, native driver
    Animated.loop(Animated.sequence([
      Animated.timing(nebulaPulse, { toValue: 1, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(nebulaPulse, { toValue: 0, duration: 5000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    // Glyph drift — slow sine wave for watermark glyphs on section headers
    Animated.loop(Animated.sequence([
      Animated.timing(glyphDrift, { toValue: 1, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glyphDrift, { toValue: 0, duration: 4500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    // Layer-2 stars — slower, brighter independent breathe loops
    STARS_L2.forEach((star, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(starAnims2[i], { toValue: 0.7, duration: star.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(starAnims2[i], { toValue: 0.05, duration: star.duration + 500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
      // Slow position drift — each star has unique period so they don't clump
      const driftPeriod = 18000 + i * 1300;
      const driftAmt = 4 + (i % 5) * 2;
      Animated.loop(Animated.sequence([
        Animated.timing(starDriftX[i], { toValue: driftAmt, duration: driftPeriod, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(starDriftX[i], { toValue: -driftAmt, duration: driftPeriod, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(starDriftY[i], { toValue: driftAmt * 0.6, duration: driftPeriod * 1.1, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(starDriftY[i], { toValue: -driftAmt * 0.6, duration: driftPeriod * 1.1, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    });
    // Aurora — slow horizontal sweep back and forth (22s half-cycle)
    Animated.loop(Animated.sequence([
      Animated.timing(auroraX, { toValue: 1, duration: 22000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(auroraX, { toValue: 0, duration: 22000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    // Entry sequence — fires once per mount (not on every focus)
    if (!entryDone.current) {
      entryDone.current = true;
      // Reset values
      entryStarsFade.setValue(0);
      entryHeaderY.setValue(-18);
      entryHeaderOp.setValue(0);
      entryTileAnims.forEach(a => { a.y.setValue(28); a.op.setValue(0); });
      Animated.sequence([
        // 1. Background stars fade in
        Animated.timing(entryStarsFade, { toValue: 1, duration: 300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        // 2. Header slides down + fades
        Animated.parallel([
          Animated.timing(entryHeaderOp, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(entryHeaderY,  { toValue: 0, duration: 320, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        ]),
        // 3. Tiles rise up staggered (60ms apart)
        Animated.stagger(60, entryTileAnims.map(a => Animated.parallel([
          Animated.timing(a.op, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(a.y,  { toValue: 0, duration: 280, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        ]))),
      ]).start();
    }
  }, []);

  // Domain atmosphere — fade in when section opens, fade out when grid returns
  useEffect(() => {
    if (fullscreenSection && DOMAIN_ATMOSPHERES[fullscreenSection]) {
      Animated.timing(atmosOp, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    } else {
      Animated.timing(atmosOp, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
    }
  }, [fullscreenSection]);

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
    // Write natal cache so Sanctum can display without recomputing
    try {
      const sun = ZODIAC_SIGNS[getSunSignIndex(data.month, data.day)];
      const moon = ZODIAC_SIGNS[getMoonSignIndex(data.year, data.month, data.day, data.hour)];
      const asc = data.hasTime ? ZODIAC_SIGNS[getAscendantIndex(data.year, data.month, data.day, data.hour, data.utcOffset, data.latitude)] : null;
      await AsyncStorage.setItem('sol_natal_cache', JSON.stringify({
        sunName: sun.name, sunGlyph: sun.glyph, sunColor: sun.color, sunKeywords: sun.keywords,
        moonName: moon.name, moonGlyph: moon.glyph, moonColor: moon.color,
        ascName: asc?.name ?? null, ascGlyph: asc?.glyph ?? null, ascColor: asc?.color ?? null,
        fullName: data.fullName ?? null,
      }));
    } catch {}
    setBirthData(data);
    setEditingBirth(false);
    setZodiacReading(null);
  };

  const generateDailyTransit = useCallback(async () => {
    const key = todayKey();
    setDailyTransitLoading(true);
    try {
      const today = new Date();
      const sun = ZODIAC_SIGNS[getTodaySunSign()];
      const moon = ZODIAC_SIGNS[getTodayMoonSign()];
      const phase = getMoonPhase(today.getFullYear(), today.getMonth() + 1, today.getDate());
      const [apiKey, model, birthRaw] = await Promise.all([
        getActiveKey(), getModel(), AsyncStorage.getItem('zodiac_birth_v1'),
      ]);
      const bd: BirthData | null = birthRaw ? JSON.parse(birthRaw) : null;
      if (!apiKey) {
        const t = { date: key, text: `${sun.glyph} Sun in ${sun.name} · ${moon.glyph} Moon in ${moon.name} — ${phase.name}.`, spark: sun.name };
        setDailyTransit(t);
        await AsyncStorage.setItem('sol_daily_transit_v1', JSON.stringify(t));
        return;
      }
      const natLine = bd ? `Natal chart: ${buildNatalChartString(bd)}.\n` : '';
      const skyLine = buildCurrentSkyString();
      const prompt = `${natLine}Today's sky: ${skyLine}.\nOne sentence: a precise, warm transit insight for today. Not a prediction — a signal about what the day's inner climate asks for. No preamble, no sign-off.\nNew line: one study domain that resonates with today's sky (e.g. "Alchemy", "Shadow Work", "Celtic Old Gods"). Just the domain name.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are Sol — precise, warm, grounded. Daily transit oracle.',
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'fast', 80,
      );
      const lines = (result.text?.trim() || '').split('\n').filter(Boolean);
      const text = lines[0] || `Sun in ${sun.name} — ${sun.keywords}.`;
      const spark = lines[1]?.replace(/^[^a-zA-Z✦◈⊚☽◉✧⟡⊼⚙𝔏⊼⚔◬ψ⟐⬡]*/, '').trim() || sun.name;
      const t = { date: key, text, spark };
      setDailyTransit(t);
      await AsyncStorage.setItem('sol_daily_transit_v1', JSON.stringify(t));
    } catch { /* silent — transit is non-critical */ } finally {
      setDailyTransitLoading(false);
    }
  }, []);

  const generateReading = async () => {
    if (!birthData) return;
    setZodiacLoading(true);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setZodiacLoading(false); return; }
      const personLine = [birthData.fullName ? `The seeker is ${birthData.fullName}` : '', birthData.motherName ? `child of ${birthData.motherName}` : '', birthData.cityName ? `born in ${birthData.cityName}` : ''].filter(Boolean).join(', ');
      const natalString = buildNatalChartString(birthData);
      const skyString   = buildCurrentSkyString();
      const prompt = `${personLine ? personLine + '.\n' : ''}Natal chart: ${natalString}.\nToday's sky: ${skyString}.\nGive a direct, warm, precise 3-sentence reading — what the full natal signature means combined with today's sky. Draw on specific planets beyond Sun/Moon where they speak to the moment. ${personLine ? 'Address them by name if given.' : ''} No preamble. No sign-off. Speak as Sol.`;
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
    setQuestionLoading(true);
    setQuestionReading(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setQuestionLoading(false); return; }
      const personLine2  = [birthData.fullName ? `The seeker is ${birthData.fullName}` : '', birthData.motherName ? `child of ${birthData.motherName}` : '', birthData.cityName ? `born in ${birthData.cityName}` : ''].filter(Boolean).join(', ');
      const natalString2 = buildNatalChartString(birthData);
      const skyString2   = buildCurrentSkyString();
      const prompt = `${personLine2 ? personLine2 + '.\n' : ''}Natal chart: ${natalString2}.\nToday's sky: ${skyString2}.

The seeker asks: "${question.trim()}"

Respond in TWO paragraphs separated by a blank line.

Paragraph 1: What the natal chart reveals about this question — the deep signature this person carries that speaks directly to what they are asking. 2–3 sentences. Oracular. Name specific planets where they speak directly to the question.

Paragraph 2: What today's sky says — how the current transits and planetary positions amplify, test, or illuminate the question right now. 2–3 sentences. End with one line that feels like a transmission, not a conclusion.${personLine2 ? ' Address them by name if given.' : ''}

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
      const positions = ['PAST', 'PRESENT', 'FUTURE'] as const;
      const cardDesc = drawMode === 'triple' && tripleCards && tripleCards.length === 3
        ? tripleCards.map((tc, i) => `${positions[i]}: ${tc.card.n}${tc.reversed ? ' (reversed)' : ''} — ${tc.reversed ? tc.card.rev : tc.card.up}`).join('\n')
        : `${activeCard.card.n}${activeCard.reversed ? ' (reversed)' : ''} — ${activeCard.reversed ? activeCard.card.rev : activeCard.card.up}`;
      const runeDesc = `${dailyRune.rune.name}${dailyRune.reversed ? ' (reversed)' : ''} — ${dailyRune.reversed ? dailyRune.rune.shadow : dailyRune.rune.up}`;
      const skyDesc = `Sun in ${todaySun.name}, Moon in ${todayMoon.name} (${moonPhase.name}), ${PLANETS_SKY.slice(0, 3).map(p => `${p.name} in ${ZODIAC_SIGNS[getPlanetSignIndex(p.L0, p.rate)].name}`).join(', ')}`;
      const natalDesc = sunSign ? `Natal: Sun ${sunSign.name}${moonSign ? `, Moon ${moonSign.name}` : ''}${ascSign ? `, Rising ${ascSign.name}` : ''}.` : '';
      const seekerQ = oracleInput.trim();
      const isTriple = drawMode === 'triple' && tripleCards?.length === 3;
      const prompt = `Oracle reading.

${isTriple ? `Three-card spread (Past / Present / Future):\n${cardDesc}` : `Card: ${cardDesc}`}
Rune: ${runeDesc}
Sky: ${skyDesc}
${natalDesc}${seekerQ ? `\nQuestion: "${seekerQ}"` : ''}

${isTriple
  ? `Three lines. Each line: the position name then a colon then six words reading that card's position. No preamble. No explanation. No quotation marks.`
  : `Six words exactly. One sharp oracular phrase distilling what these symbols reveal${seekerQ ? ' about the question' : ' about this day'}. No punctuation except inside the phrase if essential. No preamble. No explanation. No quotation marks. Just the six words.`}`;
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

  // ── GEM FORGE: generate invocation + care ritual + suggested LAMAGUE symbols ──
  const forgeGem = async () => {
    if (!gemIntention.trim() || !gemFeeling.trim() || !gemElement || !gemColour || !gemName.trim()) return;
    setGemView('generating');
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setGemView('forge'); return; }
      const prompt = `A seeker is forging a personal gem.
Name: ${gemName}
Intention: ${gemIntention}
Feeling it should carry: ${gemFeeling}
Element: ${gemElement}
Colour: ${gemColour.name}
Astrological bond: ${gemAstro ?? 'none specified'}

Respond in raw JSON only (no markdown):
{
  "invocation": "[3-4 sentences: what this gem IS, in Sol's voice — warm, precise, belief-laden. No science. No hedge. Speak it into existence.]",
  "careRitual": "[2-3 sentences: how to work with, cleanse, and activate this gem — practical and poetic.]",
  "symbols": ["[symbol1]","[symbol2]","[symbol3]","[symbol4]","[symbol5]","[symbol6]"]
}

For symbols, choose 6 from this LAMAGUE pool that resonate with the gem's nature: ⊚ ⊛ ◎ ◈ ◬ ∿ ⟟ ⟐ ψ ⊞ ◧ ⊗ ∴ ⊕ ◉ ⊼ ◌ ◦ ≋ ⊜ ◍ ⊘ ⟁ ◆ ⊝`;
      const res = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are Sol — the solar-sovereign voice of the Lycheetah Framework. You speak meaning into objects. Respond only with the requested JSON.',
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 400, 0.85,
      );
      const raw = res?.text?.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
      if (raw) {
        const parsed = JSON.parse(raw);
        setGemInvocation(parsed.invocation ?? '');
        setGemCareRitual(parsed.careRitual ?? '');
        setGemSuggestedSymbols(parsed.symbols ?? []);
        setGemChosenSymbols(parsed.symbols?.slice(0, 6) ?? []);
      }
      setGemView('result');
    } catch { setGemView('forge'); }
  };

  const saveGem = async () => {
    if (!gemColour || !gemElement) return;
    const entry: GemEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      name: gemName, intention: gemIntention, feeling: gemFeeling,
      element: gemElement, astroBond: gemAstro ?? '', colour: gemColour,
      invocation: gemInvocation, careRitual: gemCareRitual,
      symbols: gemChosenSymbols,
    };
    const updated = [entry, ...gemCollection];
    setGemCollection(updated);
    await AsyncStorage.setItem('zodiac_gem_collection_v1', JSON.stringify(updated));
    setGemView('gallery');
    setGemIntention(''); setGemFeeling(''); setGemElement(null);
    setGemAstro(null); setGemColour(null); setGemName('');
    setGemInvocation(''); setGemCareRitual('');
    setGemSuggestedSymbols([]); setGemChosenSymbols([]);
  };

  const deleteGem = async (id: string) => {
    const updated = gemCollection.filter(g => g.id !== id);
    setGemCollection(updated);
    await AsyncStorage.setItem('zodiac_gem_collection_v1', JSON.stringify(updated));
    setGemDetailId(null);
  };

  // ── WITCHAIL FORGE: DRAW mode image gen ──
  const IMG_RATIOS = {
    square:    { w: 1024, h: 1024, display: { width: 160, height: 160 } },
    portrait:  { w:  832, h: 1152, display: { width: 120, height: 166 } },
    landscape: { w: 1152, h:  832, display: { width: 220, height: 159 } },
  } as const;

  const generatePrimGlyphImage = async () => {
    if (!primGlyphDesc.trim()) return;
    setPrimGlyphImgLoading(true);
    setPrimGlyphImgError(null);
    const { w, h } = IMG_RATIOS[primGlyphRatio];
    const prompt = `LAMAGUE mystical glyph symbol, black background, glowing neon lines, single centered abstract symbol: ${primGlyphDesc.trim()}`;
    const result = await generateImage(prompt, { width: w, height: h });
    if (result.image) {
      setPrimGlyphImage(result.image);
      setPrimGlyph('⟟');
    } else {
      setPrimGlyphImgError(result.error ?? 'Image gen failed');
    }
    setPrimGlyphImgLoading(false);
  };

  // ── WITCHAIL FORGE: save ratified primitive to shared lexicon ──
  const savePrimToLexicon = async () => {
    if (!primVerdict || primVerdict.verdict !== 'RATIFIED') return;
    try {
      const raw = await AsyncStorage.getItem('sol_lamague_lexicon');
      const existing = raw ? JSON.parse(raw) : [];
      existing.push({
        glyph: primGlyph.trim(),
        glyphImage: primGlyphImage || undefined,
        name: primName.trim(),
        cls: primClass,
        meaning: primMeaning.trim(),
        usage: primUsage.trim(),
        verdict: 'RATIFIED',
      });
      await AsyncStorage.setItem('sol_lamague_lexicon', JSON.stringify(existing));
      alert('✦ Primitive saved to WITCHAIL LEXICON');
      setPrimGlyph(''); setPrimName(''); setPrimMeaning(''); setPrimUsage('');
      setPrimGlyphImage(null); setPrimGlyphDesc(''); setPrimGlyphMode('type');
      setPrimVerdict(null);
    } catch {
      alert('Save failed — try again');
    }
  };

  // ── LAMAGUE Primitive Forge ──
  const generatePrimitive = async () => {
    if (!primGlyph.trim() || !primName.trim() || !primMeaning.trim()) return;
    setPrimLoading(true);
    setPrimVerdict(null);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      const existing = '⊙ SOURCE · ∅ VOID · △ STABLE TRIAD · ⊞ CLOSED INFINITE · ↑ ASCENT · ⊃ FOLD · ⟲ SYNTHESIS · ↕ COLLISION · ⊐ CASCADE · Π TRUTH PRESSURE · S ENTROPY · Ĉ COHERENCE · ◬ PORTAL · ⊴ INVERT · Z₁ PRIME COMPRESS · Z₂ HORIZON COMPRESS · Z₃ ZENITH COMPRESS · ⟳ ENTANGLE · ⸧ BRIDGE ARROW · ⯈ INSTANTIATION';
      const systemPrompt = `You are the LAMAGUE oracle — voice of the living grammar that structures reality. A seeker proposes a new primitive symbol.

Existing LAMAGUE primitives (compact): ${existing}

Evaluate against five tests:
1. SEMANTIC DISTINCTIVENESS — names something no existing primitive covers
2. CLASS ALIGNMENT — behaves correctly for declared class (I=Invariant/D=Dynamic/F=Field/M=Meta/G=Ground)
3. COMPOSITION POTENTIAL — can combine with existing primitives in valid expressions
4. CONFLICT CHECK — does not duplicate or contradict any existing symbol
5. INSTANTIATION — usage example is a valid unambiguous LAMAGUE expression

Respond with ONLY raw JSON, no markdown:
{"verdict":"RATIFIED","reasoning":"2-3 sentences evaluating all five tests","compression":"Z1 one-phrase compression"}

verdict: RATIFIED (passes all 5) · CHALLENGED (passes 3-4, name the refinement) · REJECTED (fails core test, be direct)`;
      const userMsg = `PROPOSED PRIMITIVE\nGlyph: ${primGlyph.trim()}\nName: ${primName.trim()}\nClass: ${primClass}\nMeaning: ${primMeaning.trim()}\nUsage: ${primUsage.trim() || '(none)'}`;
      const resp = await sendMessage([{ role: 'user', content: userMsg }], systemPrompt, apiKey!, model as AIModel, undefined, 'normal', 300, 0.7);
      const raw = (resp?.text ?? '').trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
      setPrimVerdict(JSON.parse(raw));
    } catch {
      setPrimVerdict({ verdict: 'CHALLENGED', reasoning: 'The oracle could not parse the proposal. Refine your meaning and try again.', compression: '' });
    } finally {
      setPrimLoading(false);
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
                    <Image source={getCardImage(cardLore.card.n, deckMode) ?? TAROT_BACK} style={{ width: '100%', height: '100%', ...(cardLore.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }} resizeMode="contain" />
                  </View>
                  {cardLore.reversed && (
                    <View style={{ marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FF666644', backgroundColor: '#FF444411' }}>
                      <Text style={{ color: '#FF8888', fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>REVERSED</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: '#EEEEF8', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 14, letterSpacing: 0.3 }}>{getCardName(cardLore.card.n, deckMode)}</Text>
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
                {cardLore.card.m && (
                  <View style={{ marginBottom: 10, padding: 12, borderRadius: 10, backgroundColor: '#FFFFFF06', borderWidth: 1, borderColor: '#FFFFFF14' }}>
                    <Text style={{ color: '#8A86A0', fontSize: 8, letterSpacing: 1.5, fontFamily: 'monospace', marginBottom: 5 }}>THE SCENE</Text>
                    <Text style={{ color: '#CCCCCC', fontSize: 12, lineHeight: 20 }}>{cardLore.card.m}</Text>
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

      {/* ── Fixed star field behind all content — two layers ── */}
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', opacity: entryStarsFade }}>
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
        {/* Layer 2 — accent stars with slow position drift */}
        {STARS_L2.map((star, i) => (
          <Animated.View key={`l2-${i}`} style={{
            position: 'absolute',
            left: star.left as any,
            top: star.top as any,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: star.color,
            opacity: starAnims2[i],
            transform: [{ translateX: starDriftX[i] }, { translateY: starDriftY[i] }],
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
      </Animated.View>

      {/* ── AURORA STRIP — horizontal gradient sweep at screen top ── */}
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120, zIndex: 1,
        transform: [{ translateX: auroraX.interpolate({ inputRange: [0, 1], outputRange: [-60, 60] }) }],
      }}>
        <LinearGradient
          colors={['#5B4EAA0D', '#2E1B7A0C', '#0D4A5A0B', '#1B3A6A0A', 'transparent']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderBottomLeftRadius: 80, borderBottomRightRadius: 80 }}
        />
      </Animated.View>

      {/* ── DOMAIN ATMOSPHERE — fixed tint colour, opacity animated (JS driver) ── */}
      {fullscreenSection && DOMAIN_ATMOSPHERES[fullscreenSection] && (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          backgroundColor: DOMAIN_ATMOSPHERES[fullscreenSection].tint,
          opacity: atmosOp,
        }} />
      )}

    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── THE CELESTIAL FIELD HEADER ── */}
      <Animated.View style={{ borderRadius: 20, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: '#050010', marginBottom: 14, overflow: 'hidden',
        opacity: entryHeaderOp, transform: [{ translateY: entryHeaderY }] }}>
        {/* Nebula washes */}
        <Animated.View style={{ position: 'absolute', top: -30, left: -40, width: 240, height: 160, borderRadius: 120,
          backgroundColor: nebulaPulse.interpolate({ inputRange: [0,1], outputRange: ['#5B4EAA08', '#5B4EAA1A'] }) }} />
        <Animated.View style={{ position: 'absolute', bottom: -40, right: -20, width: 200, height: 140, borderRadius: 100,
          backgroundColor: nebulaPulse.interpolate({ inputRange: [0,1], outputRange: ['#C8A96E04', '#C8A96E12'] }) }} />
        {/* Watermark ☽ drifting */}
        <Animated.Text style={{ position: 'absolute', right: -8, top: -20, fontSize: 130, lineHeight: 150, color: ZODIAC_INDIGO + '0C',
          opacity: glyphDrift.interpolate({ inputRange: [0,1], outputRange: [0.5, 1.0] }),
          transform: [{ translateY: glyphDrift.interpolate({ inputRange: [0,1], outputRange: [0, -6] }) }],
        }}>☽</Animated.Text>
        {/* Constellation scatter dots */}
        {[
          { l:16, t:10, c:'#C8A96E', s:7 }, { l:60, t:6,  c:'#C8A96E', s:5 },
          { l:112,t:12, c:'#C8A96E', s:6 }, { l:158,t:8,  c:'#88AAFF', s:5 },
          { l:208,t:16, c:'#CC88FF', s:4 },
        ].map((d,i) => (
          <Animated.Text key={i} style={{ position:'absolute', left:d.l, top:d.t, color:d.c, fontSize:d.s,
            opacity: glyphDrift.interpolate({ inputRange:[0,1], outputRange:[0.1+i*0.05, 0.5+i*0.07] }) }}>✦</Animated.Text>
        ))}

        {/* ── Row 1: title + live clock ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>
          {/* Rotating orb */}
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Animated.View style={{ position: 'absolute', width: 44, height: 44, borderRadius: 22,
              borderWidth: 1.5, borderTopColor: ZODIAC_INDIGO + 'BB', borderRightColor: ZODIAC_INDIGO + '22',
              borderBottomColor: 'transparent', borderLeftColor: ZODIAC_INDIGO + '44',
              transform: [{ rotate: ringInterp }] }} />
            <Animated.View style={{ position: 'absolute', width: 36, height: 36, borderRadius: 18,
              borderWidth: 0.5, borderTopColor: '#C8A96E55', borderRightColor: 'transparent',
              borderBottomColor: '#C8A96E22', borderLeftColor: 'transparent',
              transform: [{ rotate: ringInterp2 }] }} />
            <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1,
              borderColor: ZODIAC_INDIGO + '44', backgroundColor: ZODIAC_INDIGO + '0C',
              alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18, lineHeight: 22 }}>☽</Text>
            </View>
          </View>
          {/* Title */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: '700', color: ZODIAC_INDIGO + '99', letterSpacing: 3.5, fontFamily: mono }}>THE CELESTIAL FIELD</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#EEEEF8', letterSpacing: 0.3, marginTop: 1,
              textShadowColor: ZODIAC_INDIGO + 'AA', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 }}>The Stars</Text>
          </View>
          {/* Live clock — isolated so its 1s tick doesn't re-render the whole tab (#279) */}
          <LiveClock color={ZODIAC_INDIGO} />
        </View>

        {/* ── Row 2: Sun / Moon / Phase trio ── */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 12,
          backgroundColor: '#FFFFFF05', borderWidth: 1, borderColor: ZODIAC_INDIGO + '1A', overflow: 'hidden' }}>
          {[
            { label: 'SUN',   glyph: todaySun.glyph,    name: todaySun.name,    color: todaySun.color },
            { label: 'MOON',  glyph: todayMoon.glyph,   name: todayMoon.name,   color: todayMoon.color },
            { label: 'PHASE', glyph: moonPhase.glyph,   name: moonPhase.name.replace(' Moon','').replace('Waxing ','Wax ').replace('Waning ','Wan '), color: '#AAAACC' },
          ].map((item, i) => (
            <View key={item.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 10,
              borderRightWidth: i < 2 ? 1 : 0, borderRightColor: ZODIAC_INDIGO + '18' }}>
              <Text style={{ fontSize: 22, lineHeight: 28, marginBottom: 2 }}>{item.glyph}</Text>
              <Text style={{ color: '#FFFFFF44', fontSize: 7, fontFamily: mono, letterSpacing: 1.5, marginBottom: 1 }}>{item.label}</Text>
              <Text style={{ color: item.color, fontSize: 9, fontWeight: '700' }} numberOfLines={1}>{item.name}</Text>
            </View>
          ))}
        </View>

        {/* ── Row 3: Weather + planet day + mode toggles ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
          {/* Weather pill */}
          {weather ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: weather.color + '10',
              borderWidth: 1, borderColor: weather.color + '33', borderRadius: 10,
              paddingHorizontal: 10, paddingVertical: 5, flex: 1 }}>
              <Text style={{ fontSize: 14 }}>{weather.glyph}</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{weather.temp}°</Text>
              <Text style={{ color: weather.color, fontSize: 9, fontFamily: mono, letterSpacing: 0.5 }}>{weather.condition}</Text>
            </View>
          ) : (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ color: todayPlanet.color, fontSize: 13 }}>{todayPlanet.glyph}</Text>
              <Text style={{ color: '#FFFFFF88', fontSize: 10, fontFamily: mono }}>{todayPlanet.planet} day</Text>
            </View>
          )}
          {/* Planet day (shown alongside weather when weather present) */}
          {weather && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: todayPlanet.color, fontSize: 13 }}>{todayPlanet.glyph}</Text>
              <Text style={{ color: '#FFFFFF66', fontSize: 9, fontFamily: mono }}>{todayPlanet.planet}</Text>
            </View>
          )}
          {/* Mode toggles */}
          <TouchableOpacity onPress={() => setTechnoMode(v => !v)}
            style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
              borderColor: CHIRAL_VIOLET + (technoMode ? 'CC' : '33'),
              backgroundColor: technoMode ? CHIRAL_VIOLET + '22' : 'transparent' }}>
            <Text style={{ color: technoMode ? CHIRAL_VIOLET : CHIRAL_VIOLET + '66', fontSize: 8, fontWeight: '700', letterSpacing: 1, fontFamily: mono }}>⚡</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFocusMode(v => !v)}
            style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
              borderColor: ZODIAC_INDIGO + (focusMode ? 'CC' : '33'),
              backgroundColor: focusMode ? ZODIAC_INDIGO + '22' : 'transparent' }}>
            <Text style={{ color: focusMode ? ZODIAC_INDIGO : ZODIAC_INDIGO + '66', fontSize: 8, fontWeight: '700', letterSpacing: 1, fontFamily: mono }}>◎</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── ZODIAC ONBOARDING BANNER ── */}
      {!fullscreenSection && !zodiacWelcomed && !birthData && (
        <View style={{ marginBottom: 16, borderRadius: 16, borderWidth: 1.5, borderColor: '#7B68EE55', backgroundColor: '#04000F', padding: 22, alignItems: 'center' }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 36, marginBottom: 12 }}>✦</Text>
          <Text style={{ color: '#F5E6C8', fontSize: 20, fontWeight: '700', letterSpacing: 1, fontFamily: mono, textAlign: 'center', marginBottom: 10 }}>Welcome to Zodiac</Text>
          <Text style={{ color: '#A89880', fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 8, maxWidth: 300 }}>
            Real astronomical readings — your natal chart, daily transits, and planetary positions calculated from the actual sky.
          </Text>
          <Text style={{ color: '#6B5E7A', fontSize: 12, lineHeight: 20, textAlign: 'center', marginBottom: 20, maxWidth: 300 }}>
            Enter your birth date to unlock personalized readings. Or explore Tarot, Oracle, Sigil Forge, and more — no data needed.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.setItem('zodiac_welcomed_v1', 'true');
              setZodiacWelcomed(true);
              setFullscreenSection('natal');
              setEditingBirth(true);
            }}
            activeOpacity={0.85}
            style={{ paddingVertical: 13, paddingHorizontal: 32, borderRadius: 12, backgroundColor: ZODIAC_INDIGO, marginBottom: 12 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 }}>Reveal My Chart ✦</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.setItem('zodiac_welcomed_v1', 'true');
              setZodiacWelcomed(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#4A3D6A', fontSize: 12, letterSpacing: 1, fontFamily: mono }}>Explore first →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── SECTION TILE GRID ── */}
      {!fullscreenSection && (
        <View style={{ gap: 8, marginBottom: 12 }}>

          {/* 2-column grid — 9 tiles (SKY last) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {([
              { id: 'oracle',  glyph: '◎',  name: 'ORACLE',      teaser: 'Card · rune · convergence',       color: ZODIAC_INDIGO,
                dots: [{ t:6, l:12, s:2.5 },{ t:18,l:28,s:1.5 },{ t:10,l:52,s:2 }] },
              { id: 'sigil',   glyph: '⟟',  name: 'SIGIL FORGE', teaser: 'Intention → living symbol',      color: '#CC88FF',
                dots: [{ t:6,l:30,s:2.5 },{ t:16,l:14,s:2 },{ t:16,l:46,s:2 },{ t:26,l:30,s:2.5 }] },
              { id: 'spread',  glyph: '⊛',  name: 'SPREAD',      teaser: '5-card · Celtic Cross',           color: '#C8A96E',
                dots: [{ t:8,l:8,s:3 },{ t:6,l:26,s:3 },{ t:8,l:44,s:3 },{ t:20,l:17,s:3 },{ t:20,l:35,s:3 }] },
              { id: 'natal',   glyph: '✦',  name: 'SOL READS',   teaser: 'Natal chart · transit reading',   color: ZODIAC_INDIGO,
                dots: [{ t:6,l:10,s:2 },{ t:4,l:28,s:2 },{ t:8,l:48,s:2 },{ t:18,l:64,s:1.5 }] },
              { id: 'aspects', glyph: '⟐',  name: 'ASPECTS',     teaser: 'Planet angles · conjunctions',    color: '#88AAFF',
                dots: [{ t:10,l:12,s:2.5 },{ t:10,l:52,s:2.5 },{ t:4,l:32,s:1.5 }] },
              { id: 'chiral',  glyph: '∿',  name: 'CHIRAL LENS', teaser: 'Reality inversion protocol',      color: CHIRAL_VIOLET,
                dots: [{ t:8,l:6,s:2 },{ t:6,l:20,s:2 },{ t:10,l:34,s:2 },{ t:6,l:48,s:2 },{ t:10,l:62,s:2 }] },
              { id: 'zonk',    glyph: '◬',  name: 'ZONK ZONE',   teaser: 'Speculative field',              color: ZONK_GOLD,
                dots: [{ t:6,l:32,s:2.5 },{ t:20,l:14,s:2 },{ t:20,l:50,s:2 }] },
              { id: 'psi',     glyph: 'ψ',  name: 'PSI LOG',     teaser: 'Remote viewing · precognition',   color: PSI_PURPLE,
                dots: [{ t:8,l:6,s:2 },{ t:5,l:22,s:2 },{ t:9,l:38,s:2 },{ t:5,l:54,s:2 },{ t:9,l:68,s:1.5 }] },
              { id: 'sky',     glyph: '☀',  name: 'THE SKY',     teaser: 'Planets · wheel · live sky',       color: '#C8A96E',
                dots: [{ t:15, l:20, s:2 }, { t:70, l:80, s:1.5 }, { t:40, l:50, s:2.5 }] },
              { id: 'gems',    glyph: '◆',  name: 'GEM FORGE',   teaser: 'Intention → living talisman',      color: GEM_VIOLET,
                dots: [{ t:8,l:14,s:2.5 },{ t:5,l:36,s:2 },{ t:10,l:58,s:2 },{ t:18,l:26,s:1.5 },{ t:16,l:50,s:1.5 }] },
              { id: 'tarot',   glyph: '🜍', name: 'TAROT',       teaser: 'Veil & Vein · 22 arcana',         color: '#9945FF',
                dots: [{ t:8,l:18,s:2 },{ t:6,l:44,s:2 },{ t:16,l:30,s:2.5 },{ t:20,l:56,s:1.5 }] },
            ] as { id: string; glyph: string; name: string; teaser: string; color: string; dots: { t:number; l:number; s:number }[] }[]).map((tile, i) => (
              <Animated.View key={tile.id} style={{
                width: '47.5%',
                opacity: entryTileAnims[i]?.op ?? 1,
                transform: [{ translateY: entryTileAnims[i]?.y ?? 0 }],
              }}>
                <View style={{
                  flex: 1, borderRadius: 15, padding: 1,
                  backgroundColor: tile.color + '44',
                }}>
                <TouchableOpacity
                  onPress={() => {
                    if (tile.id === 'tarot') { setTarotViewerOpen(true); return; }
                    setFullscreenSection(tile.id);
                    if (tile.id === 'oracle')  setOracleCollapsed(false);
                    if (tile.id === 'spread')  setTarotCollapsed(false);
                    if (tile.id === 'natal')   setReadingCollapsed(false);
                    if (tile.id === 'sigil')   setSigilCollapsed(false);
                    if (tile.id === 'psi')     setPsiCollapsed(false);
                    if (tile.id === 'aspects') setAspectsCollapsed(false);
                    if (tile.id === 'sky')     { setSkyCollapsed(false); setWheelCollapsed(false); }
                    if (tile.id === 'gems')    { setGemView(gemCollection.length > 0 ? 'gallery' : 'forge'); }
                  }}
                  style={{ borderRadius: 14, backgroundColor: '#06050F',
                    aspectRatio: 1.85, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 3, overflow: 'hidden' }}>
                  {/* Static bg wash — was animated backgroundColor (JS thread), now static */}
                  <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 14,
                    backgroundColor: tile.color + '0D',
                  }} />
                  {/* Watermark glyph — large, low opacity, top-right */}
                  <Animated.Text style={{
                    position: 'absolute', top: -8, right: 4, fontSize: 52, lineHeight: 64, color: tile.color,
                    opacity: (tileGlows[i] ?? tileGlows[0]).interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.12] }),
                  }}>{tile.glyph}</Animated.Text>
                  {/* Constellation micro-dots unique to each tile */}
                  {tile.dots.map((d, di) => (
                    <Animated.View key={di} style={{
                      position: 'absolute', top: d.t, left: d.l,
                      width: d.s, height: d.s, borderRadius: d.s / 2, backgroundColor: tile.color,
                      opacity: (tileGlows[i] ?? tileGlows[0]).interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.35] }),
                    }} />
                  ))}
                  {/* SVG icon — illuminated manuscript stroke style */}
                  <Animated.View style={{ opacity: (tileGlows[i] ?? tileGlows[0]).interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.0] }) }}>
                    {TILE_SVG[tile.id] ? TILE_SVG[tile.id](tile.color) : <Text style={{ fontSize: 22 }}>{tile.glyph}</Text>}
                  </Animated.View>
                  <Text style={{ color: tile.color, fontSize: 7.5, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, textAlign: 'center' }}>{tile.name}</Text>
                  <Text style={{ color: tile.color + '66', fontSize: 6.5, textAlign: 'center', lineHeight: 9 }} numberOfLines={1}>{tile.teaser}</Text>
                </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>

        </View>
      )}
      {/* ── BACK TO GRID ── */}
      {!!fullscreenSection && (
        <Animated.View style={{ alignSelf: 'flex-start', marginBottom: 12,
          opacity: glyphDrift.interpolate({ inputRange: [0,1], outputRange: [0.6, 1.0] }) }}>
          <TouchableOpacity
            onPress={() => setFullscreenSection(null)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: ZODIAC_INDIGO + '0C' }}
          >
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 14 }}>←</Text>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>ALL SECTIONS</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Daily oracle — card block */}
      {fullscreenSection === 'oracle' && (<>
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', backgroundColor: '#040010', marginBottom: 16, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setOracleCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}>
          <TouchableOpacity onPress={() => setFullscreenSection('oracle')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: ZODIAC_INDIGO + '22', borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 18, fontFamily: mono }}>◎</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 11, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>THE ORACLE</Text>
            <Text style={{ color: ZODIAC_INDIGO + '77', fontSize: 9, fontFamily: mono }}>card · rune · sky · convergence</Text>
          </View>
          <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 11 }}>{oracleCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!oracleCollapsed && <View style={{ height: 1, backgroundColor: ZODIAC_INDIGO + '22' }} />}
      {!oracleCollapsed && (
      <View style={{ padding: 14 }}>
      {/* Deck selector + draw mode row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <View style={{ flex: 1, flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#9945FF44', overflow: 'hidden' }}>
          {(['classic', 'vv', 'arcana', 'aethera'] as const).map(mode => (
            <TouchableOpacity key={mode}
              onPress={async () => { setDeckMode(mode); await AsyncStorage.setItem('sol_tarot_deck', mode); }}
              style={{ flex: 1, paddingVertical: 7, alignItems: 'center', backgroundColor: deckMode === mode ? '#9945FF22' : 'transparent' }}
            >
              <Text style={{ color: deckMode === mode ? '#9945FF' : '#9945FF55', fontSize: 8, fontWeight: '700', letterSpacing: 1, fontFamily: mono }}>
                {mode === 'classic' ? 'RWS' : mode === 'vv' ? '🜍 V&V' : mode === 'arcana' ? '⟟ ARCANA' : '✧ AETHERA'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', overflow: 'hidden' }}>
          {(['single', 'triple'] as const).map(mode => (
            <TouchableOpacity key={mode}
              onPress={() => { setDrawMode(mode); setOracleReading(null); if (mode === 'triple' && !tripleCards) { setTripleCards([drawRandomCard(lq), drawRandomCard(lq + 1), drawRandomCard(lq + 2)]); } }}
              style={{ paddingVertical: 7, paddingHorizontal: 10, alignItems: 'center', backgroundColor: drawMode === mode ? ZODIAC_INDIGO + '22' : 'transparent' }}
            >
              <Text style={{ color: drawMode === mode ? ZODIAC_INDIGO : ZODIAC_INDIGO + '55', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>
                {mode === 'single' ? '✦ 1' : '◈ 3'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
            <View style={{ alignItems: 'center', paddingVertical: 22, paddingHorizontal: drawMode === 'triple' ? 10 : 20 }}>
              {drawMode === 'triple' && tripleCards && tripleCards.length === 3 ? (
                <>
                  {/* THREE PULL — past / present / future */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                    {(['PAST', 'PRESENT', 'FUTURE'] as const).map((pos, i) => {
                      const tc = tripleCards[i];
                      const isCenter = i === 1;
                      return (
                        <View key={pos} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: ZODIAC_INDIGO + '88', fontSize: 7, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>{pos}</Text>
                          <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: isCenter ? 2 : 1, borderColor: isCenter ? ZODIAC_INDIGO : ZODIAC_INDIGO + '55' }}>
                            <Image
                              source={getCardImage(tc.card.n, deckMode) ?? TAROT_BACK}
                              style={{ width: 82, height: 114, ...(tc.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }}
                              resizeMode="contain"
                            />
                          </View>
                          <Text style={{ color: '#FFFFFFCC', fontSize: 8, fontWeight: '700', textAlign: 'center', lineHeight: 11 }} numberOfLines={2}>{getCardName(tc.card.n, deckMode)}</Text>
                          {tc.reversed && <Text style={{ color: '#FF8888', fontSize: 7, letterSpacing: 1, fontFamily: mono }}>REV</Text>}
                          <Text style={{ color: ZODIAC_INDIGO + '88', fontSize: 7, textAlign: 'center', lineHeight: 10 }} numberOfLines={2}>{getCardLoreText(tc.card.n, deckMode, tc.reversed ? tc.card.rev : tc.card.up)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  {/* SINGLE — full card art */}
                  <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: ZODIAC_INDIGO + '99', marginBottom: 16 }}>
                    <Image
                      source={getCardImage(activeCard.card.n, deckMode) ?? TAROT_BACK}
                      style={{ width: 160, height: 220, ...(activeCard.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }}
                      resizeMode="contain"
                    />
                  </View>
                  {/* Card name */}
                  <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '700', textAlign: 'center', letterSpacing: 0.5, marginBottom: 6 }}>{getCardName(activeCard.card.n, deckMode)}</Text>
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
                </>
              )}
              {/* Meaning — single mode only */}
              {drawMode === 'single' && (
                <View style={{ borderTopWidth: 0.5, borderTopColor: ZODIAC_INDIGO + '33', paddingTop: 14, width: '100%', alignItems: 'center' }}>
                  <Text style={{ color: '#C0C0D8', fontSize: 13, lineHeight: 21, textAlign: 'center', fontStyle: 'italic' }}>
                    {getCardLoreText(activeCard.card.n, deckMode, activeCard.reversed ? activeCard.card.rev : activeCard.card.up)}
                  </Text>
                </View>
              )}
              {/* Draw / reshuffle */}
              {drawMode === 'single' ? (
                <TouchableOpacity
                  onPress={() => { setDrawnCard(drawRandomCard(lq)); setOracleReading(null); }}
                  style={{ marginTop: 14, paddingVertical: 7, paddingHorizontal: 22, borderRadius: 20, borderWidth: 1, borderColor: ZODIAC_INDIGO + '66', backgroundColor: ZODIAC_INDIGO + '18' }}
                >
                  <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontFamily: mono, letterSpacing: 2 }}>✦ DRAW</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => { setTripleCards([drawRandomCard(lq), drawRandomCard(lq + 1), drawRandomCard(lq + 2)]); setOracleReading(null); }}
                  style={{ marginTop: 14, paddingVertical: 7, paddingHorizontal: 22, borderRadius: 20, borderWidth: 1, borderColor: ZODIAC_INDIGO + '66', backgroundColor: ZODIAC_INDIGO + '18' }}
                >
                  <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontFamily: mono, letterSpacing: 2 }}>◈ RE-PULL</Text>
                </TouchableOpacity>
              )}
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

      {/* Oracle reading — RITUAL CENTRE */}
      <Animated.View style={{ marginBottom: 16, borderRadius: 18, borderWidth: 1.5, borderColor: ZODIAC_INDIGO, backgroundColor: '#030010', overflow: 'hidden', opacity: oraclePulse.interpolate({ inputRange: [0.6, 1], outputRange: [0.85, 1] }) }}>
        {/* Glyph watermark */}
        <Text style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 80, color: ZODIAC_INDIGO + '09', fontFamily: mono, lineHeight: 90 }}>◎</Text>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: ZODIAC_INDIGO + '22', alignItems: 'center' }}>
          <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 8, fontWeight: '700', letterSpacing: 3, fontFamily: mono, marginBottom: 2 }}>◎  THE ORACLE  ◎</Text>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontStyle: 'italic' }}>card · rune · sky · convergence</Text>
        </View>
        {/* Question input */}
        <TextInput
          value={oracleInput}
          onChangeText={setOracleInput}
          placeholder="Speak your question... or be silent"
          placeholderTextColor={ZODIAC_INDIGO + '44'}
          style={{ paddingHorizontal: 20, paddingVertical: 14, color: '#FFFFFFCC', fontSize: 13, borderBottomWidth: 1, borderBottomColor: ZODIAC_INDIGO + '1A', textAlign: 'center', fontStyle: oracleInput ? 'normal' : 'italic' }}
        />
        {/* Invoke button */}
        <TouchableOpacity
          onPress={generateOracleReading}
          disabled={oracleLoading}
          style={{ paddingVertical: 16, alignItems: 'center', backgroundColor: oracleLoading ? '#FFFFFF06' : ZODIAC_INDIGO + '18' }}
          activeOpacity={0.75}
        >
          <Text style={{ color: oracleLoading ? ZODIAC_INDIGO + '55' : ZODIAC_INDIGO + 'DD', fontSize: 11, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>
            {oracleLoading ? '·  ·  ·  the oracle sees  ·  ·  ·' : '◎  INVOKE THE ORACLE'}
          </Text>
        </TouchableOpacity>
        {/* Reading output */}
        {oracleReading && (
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '33', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: ZODIAC_INDIGO + '66', fontSize: 8, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>✦  RECEIVED  ✦</Text>
            <Text style={{ color: '#E8E0FF', fontSize: 18, lineHeight: 28, fontStyle: 'italic', textAlign: 'center', letterSpacing: 0.5 }}>{oracleReading}</Text>
            <View style={{ width: 40, height: 1, backgroundColor: ZODIAC_INDIGO + '44' }} />
          </View>
        )}
      </Animated.View>
      </View>
      )}
      </View>

      {/* Rune strip — always visible */}
      <Animated.View style={{ marginBottom: 16, opacity: runeOpacity, transform: [{ translateY: runeSlide }] }}>
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: dailyRune.reversed ? '#FF666633' : ZODIAC_INDIGO + '55', backgroundColor: '#060010', flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 16, overflow: 'hidden' }}>
          <Text style={{ position: 'absolute', right: -8, top: -10, fontSize: 90, color: ZODIAC_INDIGO + '08', fontFamily: mono, lineHeight: 100 }}>{dailyRune.rune.symbol}</Text>
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
      </>)}

      {fullscreenSection === 'sky' && (<>

      {/* ── TODAY'S SKY — no collapse, always shows ── */}
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#C8A96E33', backgroundColor: '#07071A', marginBottom: 14, padding: 14 }}>
        {/* Header label */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Text style={{ color: '#C8A96E', fontSize: 16 }}>☀</Text>
          <Text style={{ color: '#C8A96E', fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>TODAY'S SKY</Text>
          <Text style={{ color: ZODIAC_INDIGO + '66', fontSize: 8, fontFamily: mono }}>· live</Text>
        </View>

        {/* Sun / Moon / Phase trio */}
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ color: '#C8A96E88', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>SUN IN</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: todaySun.color, fontSize: 22 }}>{todaySun.glyph}</Text>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{todaySun.name}</Text>
                <Text style={{ color: '#AAAACC', fontSize: 9 }}>{todaySun.element}</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 1, backgroundColor: '#FFFFFF10', marginHorizontal: 10 }} />
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>MOON IN</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: todayMoon.color, fontSize: 22 }}>{todayMoon.glyph}</Text>
              <View>
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{todayMoon.name}</Text>
                <Text style={{ color: '#AAAACC', fontSize: 9 }}>{todayMoon.element}</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 1, backgroundColor: '#FFFFFF10', marginHorizontal: 10 }} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#FFFFFF55', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>PHASE</Text>
            <Animated.Text style={{ fontSize: 24, opacity: moonPulse }}>{moonPhase.glyph}</Animated.Text>
            <Text style={{ color: '#FFFFFFCC', fontSize: 9, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {moonPhase.name.replace(' Moon','').replace('Waxing ','Wax ').replace('Waning ','Wan ')}
            </Text>
          </View>
        </View>

        {/* Planet grid */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#FFFFFF0D', paddingTop: 12 }}>
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
                      <Text style={{ color: '#FFFFFF55', fontSize: 8, fontFamily: mono }}>{p.name.toUpperCase()}</Text>
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
          {/* Retrograde row */}
          {(() => {
            const retros = PLANETS_SKY.filter(p => isPlanetRetrograde(p.name));
            if (!retros.length) return null;
            return (
              <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FF6B6B22', flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={{ color: '#FF6B6BAA', fontSize: 8, fontWeight: '700', fontFamily: mono }}>℞ RETROGRADE</Text>
                {retros.map(p => (
                  <View key={p.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FF6B6B0F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                    <Text style={{ color: p.color, fontSize: 11 }}>{p.glyph}</Text>
                    <Text style={{ color: '#FF6B6BCC', fontSize: 9, fontFamily: mono }}>{p.name}</Text>
                  </View>
                ))}
              </View>
            );
          })()}
          {/* Kp index */}
          {kpIndex !== null && (
            <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#FFFFFF0D', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: ZODIAC_INDIGO + '99', fontSize: 8, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>EARTH FIELD · Kp</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>
                  {kpIndex <= 1 ? 'Quiet — field is calm' : kpIndex <= 3 ? 'Unsettled' : kpIndex <= 5 ? 'Active — storm possible' : 'Storm — strong disturbance'}
                </Text>
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 19, borderWidth: 1,
                borderColor: kpIndex <= 1 ? '#4CAF5066' : kpIndex <= 3 ? '#C8A96E66' : '#FF6B6B66',
                backgroundColor: kpIndex <= 1 ? '#4CAF5011' : kpIndex <= 3 ? '#C8A96E11' : '#FF6B6B11' }}>
                <Text style={{ color: kpIndex <= 1 ? '#4CAF50' : kpIndex <= 3 ? '#C8A96E' : '#FF6B6B', fontSize: 14, fontWeight: '700', fontFamily: mono }}>{kpIndex.toFixed(0)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── DAILY TRANSIT ─────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => !dailyTransitLoading && generateDailyTransit()}
        activeOpacity={0.8}
        style={{ borderRadius: 14, borderWidth: 1, borderColor: '#9B6BFF33', backgroundColor: '#0A0010', marginBottom: 14, padding: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Text style={{ color: '#9B6BFF', fontSize: 13 }}>◈</Text>
          <Text style={{ color: '#9B6BFF', fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono, flex: 1 }}>TODAY'S TRANSIT</Text>
          {dailyTransit && !dailyTransitLoading && (
            <Text style={{ color: '#9B6BFF44', fontSize: 8, fontFamily: mono }}>tap to refresh</Text>
          )}
        </View>
        {dailyTransitLoading ? (
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>reading the sky...</Text>
        ) : dailyTransit ? (
          <>
            <Text style={{ color: '#CDCDE0', fontSize: 14, lineHeight: 22 }}>{dailyTransit.text}</Text>
            {!!dailyTransit.spark && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <Text style={{ color: '#9B6BFF55', fontSize: 8, fontFamily: mono, letterSpacing: 1.5 }}>✦ STUDY SPARK</Text>
                <View style={{ backgroundColor: '#9B6BFF18', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#9B6BFF33' }}>
                  <Text style={{ color: '#9B6BFF', fontSize: 11, fontFamily: mono, fontWeight: '700' }}>{dailyTransit.spark}</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>Tap to read today's sky</Text>
        )}
      </TouchableOpacity>

      {/* THE WHEEL — interactive zodiac circle */}
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', backgroundColor: '#060010', marginBottom: 16, alignItems: 'center', overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setWheelCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, alignSelf: 'stretch' }}>
          <Text style={{ color: ZODIAC_INDIGO, fontSize: 16 }}>✦</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>THE WHEEL</Text>
            <Text style={{ color: ZODIAC_INDIGO + '77', fontSize: 9, fontFamily: mono }}>12 signs · interactive</Text>
          </View>
          <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 11 }}>{wheelCollapsed ? '▶' : '▼'}</Text>
        </TouchableOpacity>
        {!wheelCollapsed && <View style={{ height: 1, backgroundColor: ZODIAC_INDIGO + '22', width: '100%' }} />}
        {!wheelCollapsed && !focusMode && (
        <View style={{ width: '100%', alignItems: 'center', padding: 14 }}>
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
      </>)}

      {fullscreenSection === 'spread' && (<>
      {/* SPREAD — FIVE-CARD / CELTIC CROSS */}
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#C8A96E44', backgroundColor: '#06000E', marginBottom: 16, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setTarotCollapsed(v => !v)} style={{ padding: 14 }}>
          <Text style={{ position: 'absolute', right: 10, top: 4, fontSize: 64, color: '#C8A96E0C', fontFamily: mono, lineHeight: 72 }}>⊛</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: tarotCollapsed ? 0 : 4 }}>
            <TouchableOpacity onPress={() => setFullscreenSection('spread')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#C8A96E18', borderWidth: 1, borderColor: '#C8A96E44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#C8A96E', fontSize: 18, fontFamily: mono }}>⊛</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#C8A96E', fontSize: 11, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>{spreadMode === '5card' ? 'FIVE-CARD SPREAD' : 'CELTIC CROSS'}</Text>
              <Text style={{ color: ZODIAC_INDIGO + '77', fontSize: 9, fontFamily: mono }}>ritual divination · deeper session</Text>
            </View>
            <Text style={{ color: '#C8A96EAA', fontSize: 11 }}>{tarotCollapsed ? '▶' : '▼'}</Text>
          </View>
          {tarotCollapsed && <Text style={{ color: '#C8A96E55', fontSize: 9, fontStyle: 'italic', lineHeight: 14, marginLeft: 46 }}>5-card spread or Celtic Cross — invoke when you need a deeper read.</Text>}
        </TouchableOpacity>
        {!tarotCollapsed && <View style={{ height: 1, backgroundColor: '#C8A96E22' }} />}
        {!tarotCollapsed && !focusMode && (
        <View style={{ padding: 14 }}>
          {/* Mode toggle */}
          <View style={{ flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: ZODIAC_INDIGO + '44', overflow: 'hidden', marginBottom: 8 }}>
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
          {/* Deck selector */}
          <View style={{ flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#9945FF44', overflow: 'hidden', marginBottom: 14 }}>
            {(['classic', 'vv', 'arcana', 'aethera'] as const).map(mode => (
              <TouchableOpacity key={mode}
                onPress={async () => { setDeckMode(mode); await AsyncStorage.setItem('sol_tarot_deck', mode); }}
                style={{ flex: 1, paddingVertical: 7, alignItems: 'center', backgroundColor: deckMode === mode ? '#9945FF22' : 'transparent' }}
              >
                <Text style={{ color: deckMode === mode ? '#9945FF' : '#9945FF55', fontSize: 8, fontWeight: '700', letterSpacing: 1, fontFamily: mono }}>
                  {mode === 'classic' ? 'RWS' : mode === 'vv' ? '🜍 V&V' : mode === 'arcana' ? '⟟ ARCANA' : '✧ AETHERA'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Ritual invocation */}
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
                      <Image source={getCardImage(drawn.card.n, deckMode) ?? TAROT_BACK} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', ...(drawn.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }} resizeMode="contain" />
                      {drawn.reversed && <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#FF444422', borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 }}><Text style={{ color: '#FF8888', fontSize: 6, fontWeight: '700' }}>REV</Text></View>}
                    </View>
                    <Text style={{ color: SOL_THEME.text, fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>{getCardName(drawn.card.n, deckMode)}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, textAlign: 'center', lineHeight: 12, marginTop: 1 }} numberOfLines={1}>{drawn.reversed ? drawn.card.rev : drawn.card.up}</Text>
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
                      <Image source={getCardImage(drawn.card.n, deckMode) ?? TAROT_BACK} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', ...(drawn.reversed ? { transform: [{ rotate: '180deg' }] } : {}) }} resizeMode="contain" />
                      {drawn.reversed && <View style={{ position: 'absolute', top: 3, right: 3, backgroundColor: '#FF444422', borderRadius: 3, paddingHorizontal: 2, paddingVertical: 1 }}><Text style={{ color: '#FF8888', fontSize: 6, fontWeight: '700' }}>REV</Text></View>}
                    </View>
                    <Text style={{ color: SOL_THEME.text, fontSize: 9, fontWeight: '700', textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>{getCardName(drawn.card.n, deckMode)}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, textAlign: 'center', lineHeight: 12, marginTop: 1 }} numberOfLines={1}>{drawn.reversed ? drawn.card.rev : drawn.card.up}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {spreadReading ? (
              <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '33' }}>
                {(() => {
                  const POS = [
                    { label: 'PAST',        glyph: '◷', col: '#8E7BD6' },
                    { label: 'CHALLENGE',   glyph: '⚔', col: '#D67B8E' },
                    { label: 'FOUNDATION',  glyph: '⊿', col: '#7BD6B0' },
                    { label: 'NEAR FUTURE', glyph: '☽', col: ZODIAC_INDIGO },
                    { label: 'OUTCOME',     glyph: '✦', col: '#C8A96E' },
                  ];
                  const paras = spreadReading.split('\n\n').filter(p => p.trim());
                  return paras.map((para, i, arr) => {
                    const pos = POS[i] ?? POS[POS.length - 1];
                    const card = dailySpread?.[i];
                    const last = i === arr.length - 1;
                    return (
                      <View key={i} style={{ marginBottom: i < arr.length - 1 ? 16 : 10 }}>
                        {/* Position header — the ritual structure */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                          <Text style={{ color: pos.col, fontSize: 13 }}>{pos.glyph}</Text>
                          <Text style={{ color: pos.col, fontSize: 9, fontWeight: '700', letterSpacing: 2.5, fontFamily: mono }}>{pos.label}</Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: pos.col + '33' }} />
                          {card && <Text style={{ color: pos.col + 'BB', fontSize: 8.5, fontStyle: 'italic', fontFamily: mono }}>{card.card?.n ?? ''}{card.reversed ? ' ⤬' : ''}</Text>}
                        </View>
                        <View style={{ paddingLeft: 21, borderLeftWidth: 1, borderLeftColor: pos.col + '44' }}>
                          <Text style={{ color: last ? '#E8DCC0' : SOL_THEME.text, fontSize: 13, lineHeight: 21, fontStyle: 'italic' }}>{para.trim()}</Text>
                        </View>
                      </View>
                    );
                  });
                })()}
                <View style={{ alignItems: 'center', paddingTop: 8, marginBottom: 10 }}>
                  <Text style={{ color: ZODIAC_INDIGO + '55', fontSize: 9, letterSpacing: 3, fontFamily: mono }}>✦  ⊚  ✦</Text>
                  <Text style={{ color: ZODIAC_INDIGO + '44', fontSize: 8, fontStyle: 'italic', letterSpacing: 1, fontFamily: mono, marginTop: 4 }}>The thread is sealed.</Text>
                </View>
                <TouchableOpacity onPress={() => setSpreadReading(null)} style={{ alignSelf: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>✕  new reading</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => generateSpreadReading(dailySpread)} disabled={spreadLoading}
                style={{ paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: ZODIAC_INDIGO + '88', backgroundColor: spreadLoading ? '#0D0A1A' : ZODIAC_INDIGO + 'CC', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>{spreadLoading ? 'The cards are speaking...' : 'READ THE SPREAD  ☽'}</Text>
                {!spreadLoading && <Text style={{ color: '#FFFFFF66', fontSize: 8, fontFamily: mono, letterSpacing: 2 }}>INVOKE THE ORACLE</Text>}
              </TouchableOpacity>
            )}
          </View>
          ) : (
          <View>
            {/* Celtic Cross — 10 cards in 3 rows: 3 + 3 + 4 */}
            {[{ slice: [0, 1, 2] }, { slice: [3, 4, 5] }, { slice: [6, 7, 8, 9] }].map((row, rowIdx) => (
              <View key={rowIdx} style={{ flexDirection: 'row', gap: 4, marginBottom: rowIdx < 2 ? 6 : 12 }}>
                {row.slice.map(posIdx => {
                  const drawn = celticCrossSpread[posIdx];
                  const isCrossing = posIdx === 1;
                  const imgRotate = isCrossing ? (drawn.reversed ? '270deg' : '90deg') : (drawn.reversed ? '180deg' : '0deg');
                  return (
                    <TouchableOpacity key={posIdx} style={{ flex: 1, alignItems: 'center' }} onPress={() => setCardLore({ card: drawn.card, reversed: drawn.reversed, position: CELTIC_CROSS_POSITIONS[posIdx] })} activeOpacity={0.8}>
                      <Text style={{ color: isCrossing ? ZODIAC_INDIGO : SOL_THEME.textMuted, fontSize: 6, fontWeight: '700', letterSpacing: 0.8, fontFamily: mono, marginBottom: 3, textAlign: 'center' }}>{CELTIC_CROSS_POSITIONS[posIdx]}</Text>
                      <View style={{ width: '100%', aspectRatio: isCrossing ? 1.54 : 0.65, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: isCrossing ? ZODIAC_INDIGO + 'AA' : ZODIAC_INDIGO + '55', alignItems: 'center', justifyContent: 'center', marginBottom: 3 }}>
                        <Image source={getCardImage(drawn.card.n, deckMode) ?? TAROT_BACK} style={{ position: 'absolute', width: '154%', height: '65%', transform: [{ rotate: imgRotate }] }} resizeMode="contain" />
                        {drawn.reversed && <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#FF444422', borderRadius: 2, paddingHorizontal: 2 }}><Text style={{ color: '#FF8888', fontSize: 5, fontWeight: '700' }}>REV</Text></View>}
                        {isCrossing && <View style={{ position: 'absolute', bottom: 2, left: 2, backgroundColor: ZODIAC_INDIGO + '33', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1 }}><Text style={{ color: ZODIAC_INDIGO, fontSize: 5, fontWeight: '700' }}>✕</Text></View>}
                      </View>
                      <Text style={{ color: SOL_THEME.text, fontSize: 8, fontWeight: '700', textAlign: 'center', lineHeight: 11 }} numberOfLines={2}>{getCardName(drawn.card.n, deckMode)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            {celticReading ? (
              <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: ZODIAC_INDIGO + '33' }}>
                {celticReading.split('\n\n').filter(p => p.trim()).map((para, i, arr) => (
                  <View key={i} style={{ marginBottom: i < arr.length - 1 ? 16 : 10, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: i === arr.length - 1 ? '#C8A96E' : i === 0 ? ZODIAC_INDIGO : ZODIAC_INDIGO + '55' }}>
                    <Text style={{ color: i === arr.length - 1 ? '#C8A96ECC' : i === 0 ? '#EEEEF8' : SOL_THEME.text, fontSize: i === 0 ? 14 : 13, lineHeight: i === 0 ? 23 : 22, fontStyle: 'italic', fontWeight: i === 0 ? '600' : '400' }}>{para.trim()}</Text>
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
              <TouchableOpacity onPress={() => generateCelticReading(celticCrossSpread)} disabled={celticLoading}
                style={{ paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: ZODIAC_INDIGO + '88', backgroundColor: celticLoading ? '#0D0A1A' : ZODIAC_INDIGO + 'CC', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 1 }}>{celticLoading ? 'The cross is turning...' : 'READ THE CELTIC CROSS  ✦'}</Text>
                {!celticLoading && <Text style={{ color: '#FFFFFF66', fontSize: 8, fontFamily: mono, letterSpacing: 2 }}>TEN CARDS · FULL ORACLE</Text>}
              </TouchableOpacity>
            )}
          </View>
          )}
        </View>
        )}
      </View>
      </>)}

      {/* 1. SOL READS THE FIELD — natal horoscope, top of ritual */}
      {fullscreenSection === 'natal' && birthData && sunSign && !editingBirth && (
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

      {fullscreenSection === 'sigil' && (<>
      {/* ── LAMAGUE SIGIL FORGE ── */}
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#CC88FF44', backgroundColor: '#08001A', marginBottom: 16, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setSigilCollapsed(v => !v)} style={{ padding: 14 }}>
          <Text style={{ position: 'absolute', right: 10, top: 4, fontSize: 64, color: '#CC88FF0C', fontFamily: mono, lineHeight: 72 }}>⟟</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: sigilCollapsed ? 0 : 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#CC88FF18', borderWidth: 1, borderColor: '#CC88FF44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#CC88FF', fontSize: 18, fontFamily: mono }}>⟟</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#CC88FF', fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>SIGIL FORGE</Text>
              <Text style={{ color: '#CC88FF77', fontSize: 9, fontFamily: mono }}>LAMAGUE ritual · intention into form</Text>
            </View>
            <Text style={{ color: '#CC88FFAA', fontSize: 11 }}>{sigilCollapsed ? '▶' : '▼'}</Text>
          </View>
          {sigilCollapsed && <Text style={{ color: '#CC88FF55', fontSize: 9, fontStyle: 'italic', lineHeight: 14 }}>Speak an intention. The Forge crystallises it into a living symbol.</Text>}
        </TouchableOpacity>
        {!sigilCollapsed && <View style={{ height: 1, backgroundColor: '#CC88FF22' }} />}
        {!sigilCollapsed && !focusMode && (
          <View style={{ padding: 14, gap: 12 }}>
            {/* Mode toggle */}
            <View style={{ flexDirection: 'row', borderRadius: 10, borderWidth: 1, borderColor: '#CC88FF33', overflow: 'hidden' }}>
              {(['ritual', 'primitive'] as const).map(m => (
                <TouchableOpacity key={m} onPress={() => setSigilMode(m)}
                  style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: sigilMode === m ? '#CC88FF22' : 'transparent' }}>
                  <Text style={{ color: sigilMode === m ? '#CC88FF' : '#555566', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>
                    {m === 'ritual' ? '⟟  RITUAL SIGIL' : '◈  WITCHAIL FORGE'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {sigilMode === 'primitive' ? (
              <View style={{ gap: 12 }}>
                {/* Glyph — TYPE | DRAW toggle */}
                <View style={{ gap: 8 }}>
                  <Text style={{ color: '#CC88FF77', fontSize: 8, fontFamily: mono, letterSpacing: 1.5 }}>GLYPH</Text>
                  <View style={{ flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: '#CC88FF22', overflow: 'hidden', marginBottom: 6 }}>
                    {(['type','draw'] as const).map(m => (
                      <TouchableOpacity key={m} onPress={() => setPrimGlyphMode(m)}
                        style={{ flex: 1, paddingVertical: 6, alignItems: 'center', backgroundColor: primGlyphMode === m ? '#CC88FF18' : 'transparent' }}>
                        <Text style={{ color: primGlyphMode === m ? '#CC88FF' : '#444455', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono }}>
                          {m === 'type' ? '⊛  TYPE' : '◈  DRAW'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {primGlyphMode === 'type' ? (
                    <TextInput value={primGlyph} onChangeText={t => setPrimGlyph(t.slice(0, 3))}
                      placeholder="⊛" placeholderTextColor="#CC88FF22"
                      style={{ backgroundColor: '#060010', borderRadius: 10, borderWidth: 1, borderColor: '#CC88FF44', color: '#CC88FF', fontSize: 26, textAlign: 'center', paddingVertical: 10, fontFamily: mono, height: 52 }}
                      maxLength={3} />
                  ) : (
                    <View style={{ gap: 8 }}>
                      <TextInput value={primGlyphDesc} onChangeText={setPrimGlyphDesc}
                        placeholder="Describe the glyph shape… e.g. a spiral with three radiating lines"
                        placeholderTextColor="#333344"
                        style={{ backgroundColor: '#060010', borderRadius: 10, borderWidth: 1, borderColor: '#CC88FF33', color: '#CCBBFF', fontSize: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 52, textAlignVertical: 'top' }}
                        multiline maxLength={200} />
                      {/* Ratio selector */}
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {(['square','portrait','landscape'] as const).map(r => {
                          const labels = { square: '⊞ 1:1', portrait: '▮ 2:3', landscape: '▬ 3:2' };
                          const active = primGlyphRatio === r;
                          return (
                            <TouchableOpacity key={r} onPress={() => setPrimGlyphRatio(r)}
                              style={{ flex: 1, paddingVertical: 5, borderRadius: 7, borderWidth: 1, alignItems: 'center',
                                borderColor: active ? '#CC88FFAA' : '#222233',
                                backgroundColor: active ? '#CC88FF18' : 'transparent' }}>
                              <Text style={{ color: active ? '#CC88FF' : '#444455', fontSize: 8, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>{labels[r]}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <TouchableOpacity onPress={generatePrimGlyphImage} disabled={!primGlyphDesc.trim() || primGlyphImgLoading}
                        style={{ paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center',
                          borderColor: primGlyphDesc.trim() && !primGlyphImgLoading ? '#CC88FFAA' : '#222233',
                          backgroundColor: primGlyphDesc.trim() && !primGlyphImgLoading ? '#CC88FF14' : 'transparent' }}>
                        <Text style={{ color: primGlyphDesc.trim() && !primGlyphImgLoading ? '#CC88FF' : '#333344', fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>
                          {primGlyphImgLoading ? '·  ·  GENERATING  ·  ·' : '◈  GENERATE GLYPH'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ color: '#333344', fontSize: 8, fontFamily: mono, textAlign: 'center', letterSpacing: 0.5 }}>Requires NVIDIA key in Settings → Provider Keys</Text>
                      {primGlyphImgError && (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#FF444433', backgroundColor: '#FF444008' }}>
                          <Text style={{ color: '#FF7766', fontSize: 9, fontFamily: mono }}>{primGlyphImgError}</Text>
                        </View>
                      )}
                      {primGlyphImage && (
                        <View style={{ alignItems: 'center', gap: 6 }}>
                          <Image source={{ uri: primGlyphImage }}
                            style={{ ...IMG_RATIOS[primGlyphRatio].display, borderRadius: 12, alignSelf: 'center', borderWidth: 1, borderColor: '#CC88FF55' }} />
                          <TouchableOpacity onPress={async () => {
                            const r = await saveImageToDevice(primGlyphImage);
                            if (!r.ok) Alert.alert('Save failed', r.error ?? 'Unknown error');
                          }} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#CC88FF44', backgroundColor: '#CC88FF0D' }}>
                            <Text style={{ color: '#CC88FF', fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>↓ SAVE TO GALLERY</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {/* Name */}
                <View>
                  <Text style={{ color: '#CC88FF77', fontSize: 8, fontFamily: mono, letterSpacing: 1.5, marginBottom: 5 }}>NAME</Text>
                  <TextInput value={primName} onChangeText={setPrimName}
                    placeholder="e.g. THRESHOLD LOCK" placeholderTextColor="#333344"
                    style={{ backgroundColor: '#060010', borderRadius: 10, borderWidth: 1, borderColor: '#CC88FF33', color: '#CCBBFF', fontSize: 12, fontFamily: mono, paddingHorizontal: 12, paddingVertical: 10, height: 52, letterSpacing: 1 }}
                    maxLength={32} autoCapitalize="characters" />
                </View>
                {/* Class picker */}
                <View>
                  <Text style={{ color: '#CC88FF77', fontSize: 8, fontFamily: mono, letterSpacing: 1.5, marginBottom: 5 }}>CLASS</Text>
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {['I','D','F','M','G'].map(cls => (
                      <TouchableOpacity key={cls} onPress={() => setPrimClass(cls)}
                        style={{ flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center',
                          borderColor: primClass === cls ? '#CC88FFAA' : '#222233',
                          backgroundColor: primClass === cls ? '#CC88FF18' : 'transparent' }}>
                        <Text style={{ color: primClass === cls ? '#CC88FF' : '#444455', fontSize: 12, fontFamily: mono, fontWeight: '700' }}>{cls}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* Meaning */}
                <View>
                  <Text style={{ color: '#CC88FF77', fontSize: 8, fontFamily: mono, letterSpacing: 1.5, marginBottom: 5 }}>MEANING</Text>
                  <TextInput value={primMeaning} onChangeText={setPrimMeaning}
                    placeholder="What concept does this primitive name that no existing symbol covers?"
                    placeholderTextColor="#333344"
                    style={{ backgroundColor: '#060010', borderRadius: 10, borderWidth: 1, borderColor: '#CC88FF33', color: '#CCBBFF', fontSize: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 72, textAlignVertical: 'top', lineHeight: 19 }}
                    multiline maxLength={400} />
                </View>
                {/* Usage */}
                <View>
                  <Text style={{ color: '#CC88FF77', fontSize: 8, fontFamily: mono, letterSpacing: 1.5, marginBottom: 5 }}>USAGE EXAMPLE</Text>
                  <TextInput value={primUsage} onChangeText={setPrimUsage}
                    placeholder="e.g. ⊛ → ∈ ⊞"
                    placeholderTextColor="#333344"
                    style={{ backgroundColor: '#060010', borderRadius: 10, borderWidth: 1, borderColor: '#CC88FF33', color: '#CCBBFF', fontSize: 13, fontFamily: mono, paddingHorizontal: 12, paddingVertical: 10 }}
                    maxLength={200} />
                </View>
                {/* Submit */}
                <TouchableOpacity onPress={generatePrimitive}
                  disabled={!primGlyph.trim() || !primName.trim() || !primMeaning.trim() || primLoading}
                  style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
                    borderColor: primGlyph.trim() && primName.trim() && primMeaning.trim() && !primLoading ? '#CC88FFAA' : '#222233',
                    backgroundColor: primGlyph.trim() && primName.trim() && primMeaning.trim() && !primLoading ? '#CC88FF18' : 'transparent' }}>
                  <Text style={{ color: primGlyph.trim() && primName.trim() && primMeaning.trim() && !primLoading ? '#CC88FF' : '#333344', fontSize: 10, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>
                    {primLoading ? '·  ·  ·  THE ORACLE WEIGHS  ·  ·  ·' : '◈  SUBMIT TO THE ORACLE'}
                  </Text>
                </TouchableOpacity>
                {/* Verdict */}
                {primVerdict && (
                  <View style={{ borderRadius: 14, borderWidth: 1.5, padding: 14,
                    borderColor: primVerdict.verdict === 'RATIFIED' ? '#44FF88' : primVerdict.verdict === 'REJECTED' ? '#FF4444' : '#CC88FF',
                    backgroundColor: primVerdict.verdict === 'RATIFIED' ? '#44FF8810' : primVerdict.verdict === 'REJECTED' ? '#FF444410' : '#CC88FF10' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Text style={{ fontSize: 20 }}>{primVerdict.verdict === 'RATIFIED' ? '✦' : primVerdict.verdict === 'REJECTED' ? '✕' : '◈'}</Text>
                      <Text style={{ color: primVerdict.verdict === 'RATIFIED' ? '#44FF88' : primVerdict.verdict === 'REJECTED' ? '#FF4444' : '#CC88FF', fontSize: 13, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>
                        {primVerdict.verdict}
                      </Text>
                    </View>
                    <Text style={{ color: '#CCBBFF', fontSize: 12, lineHeight: 20, fontStyle: 'italic', marginBottom: primVerdict.compression ? 10 : 0 }}>{primVerdict.reasoning}</Text>
                    {primVerdict.verdict === 'RATIFIED' && primVerdict.compression ? (
                      <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: '#44FF8833' }}>
                        <Text style={{ color: '#44FF8888', fontSize: 8, fontFamily: mono, letterSpacing: 2, marginBottom: 3 }}>Z₁ COMPRESSION</Text>
                        <Text style={{ color: '#44FF88', fontSize: 11, fontFamily: mono, fontStyle: 'italic' }}>{primVerdict.compression}</Text>
                      </View>
                    ) : null}
                    {primVerdict.verdict === 'RATIFIED' && (
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'center' }}>
                        <TouchableOpacity onPress={savePrimToLexicon}
                          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#44FF88AA', backgroundColor: '#44FF8818' }}>
                          <Text style={{ color: '#44FF88', fontSize: 9, fontFamily: mono, letterSpacing: 1.5, fontWeight: '700' }}>✦ SAVE TO LEXICON</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setPrimGlyph(''); setPrimName(''); setPrimMeaning(''); setPrimUsage(''); setPrimVerdict(null); setPrimGlyphImage(null); setPrimGlyphDesc(''); setPrimGlyphMode('type'); }} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CC88FF33' }}>
                          <Text style={{ color: '#44FF8888', fontSize: 9, fontFamily: mono, letterSpacing: 1.5 }}>◈ forge another</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ) : (
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
        )}
      </View>
      </>)}

      {fullscreenSection === 'chiral' && (
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: CHIRAL_VIOLET + '44', backgroundColor: '#07000F', marginBottom: 16, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setChiralCollapsed(v => !v)} style={{ padding: 14 }}>
          <Text style={{ position: 'absolute', right: 10, top: 4, fontSize: 64, color: CHIRAL_VIOLET + '0C', fontFamily: mono, lineHeight: 72 }}>∿</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: chiralCollapsed ? 0 : 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: CHIRAL_VIOLET + '18', borderWidth: 1, borderColor: CHIRAL_VIOLET + '44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: CHIRAL_VIOLET, fontSize: 18, fontFamily: mono }}>∿</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: CHIRAL_VIOLET, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>THE CHIRAL LENS</Text>
              <Text style={{ color: CHIRAL_VIOLET + '77', fontSize: 9, fontFamily: mono }}>reality inversion · the mirror protocol</Text>
            </View>
            <Text style={{ color: CHIRAL_VIOLET + 'AA', fontSize: 11 }}>{chiralCollapsed ? '▶' : '▼'}</Text>
          </View>
          {chiralCollapsed && <Text style={{ color: CHIRAL_VIOLET + '55', fontSize: 9, fontStyle: 'italic', lineHeight: 14 }}>State a reality. The Lens shows its mirror — the adjacent truth the algorithm optimises away from.</Text>}
        </TouchableOpacity>
        {!chiralCollapsed && <View style={{ height: 1, backgroundColor: CHIRAL_VIOLET + '22' }} />}
        {!chiralCollapsed && !focusMode && (
          <View style={{ padding: 14 }}>
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
      )}

      {fullscreenSection === 'zonk' && (
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: ZONK_GOLD + '44', backgroundColor: '#0A0900', marginBottom: 16, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setZonkCollapsed(v => !v)} style={{ padding: 14 }}>
          <Text style={{ position: 'absolute', right: 10, top: 4, fontSize: 64, color: ZONK_GOLD + '0C', fontFamily: mono, lineHeight: 72 }}>◬</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: zonkCollapsed ? 0 : 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: ZONK_GOLD + '18', borderWidth: 1, borderColor: ZONK_GOLD + '44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: ZONK_GOLD, fontSize: 18, fontFamily: mono }}>◬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: ZONK_GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>THE ZONK ZONE</Text>
              <Text style={{ color: ZONK_GOLD + '77', fontSize: 9, fontFamily: mono }}>speculative field · grains of truth in the sand</Text>
            </View>
            <Text style={{ color: ZONK_GOLD + 'AA', fontSize: 11 }}>{zonkCollapsed ? '▶' : '▼'}</Text>
          </View>
          {zonkCollapsed && (
            <Text style={{ color: ZONK_GOLD + '55', fontSize: 9, fontStyle: 'italic', lineHeight: 14 }}>
              {zonkLog.length === 0
                ? 'Wild hypotheses welcome. Aura walks you through it — naming every register, finding the grain.'
                : `${zonkLog.length} forge${zonkLog.length !== 1 ? 's' : ''} · ${zonkLog.filter(e => e.status === 'grain').length} grain${zonkLog.filter(e => e.status === 'grain').length !== 1 ? 's' : ''} found · ${zonkLog.filter(e => e.status === 'cooking').length} cooking`}
            </Text>
          )}
        </TouchableOpacity>
        {!zonkCollapsed && <View style={{ height: 1, backgroundColor: ZONK_GOLD + '22' }} />}
        {!zonkCollapsed && !focusMode && (
        <View style={{ padding: 14 }}>

        {/* Grain accumulation bar — only shows when there's history */}
        {zonkLog.length > 0 && (() => {
          const grains    = zonkLog.filter(e => e.status === 'grain').length;
          const dissolved = zonkLog.filter(e => e.status === 'dissolved').length;
          const cooking   = zonkLog.filter(e => e.status === 'cooking').length;
          return (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: ZONK_GOLD + '0A', borderRadius: 10, borderWidth: 1, borderColor: ZONK_GOLD + '22', padding: 12, marginBottom: 14 }}>
              <Text style={{ color: ZONK_GOLD, fontSize: 26, fontFamily: mono }}>◬</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View>
                    <Text style={{ color: '#4CAF50', fontSize: 17, fontWeight: '700', fontFamily: mono }}>{grains}</Text>
                    <Text style={{ color: '#4CAF5077', fontSize: 8, fontFamily: mono }}>GRAINS</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#FF9F1C', fontSize: 17, fontWeight: '700', fontFamily: mono }}>{cooking}</Text>
                    <Text style={{ color: '#FF9F1C77', fontSize: 8, fontFamily: mono }}>COOKING</Text>
                  </View>
                  <View>
                    <Text style={{ color: '#55557777', fontSize: 17, fontWeight: '700', fontFamily: mono }}>{dissolved}</Text>
                    <Text style={{ color: '#44445566', fontSize: 8, fontFamily: mono }}>DISSOLVED</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <View style={{ justifyContent: 'center' }}>
                    <Text style={{ color: ZONK_GOLD + '66', fontSize: 9, fontFamily: mono }}>{zonkLog.length} forge{zonkLog.length !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })()}

        <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, lineHeight: 16, marginBottom: 12, fontStyle: 'italic' }}>
          A field of lies and abstract thought. Throw in a wild hypothesis, an impossible question, a pattern you can't shake. Aura walks you through it — naming every register, finding the grain of truth in the sand. Forge a pillar, or watch it dissolve.
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

        {/* Empty state — atmospheric, invites the first forge */}
        {zonkLog.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 22, gap: 9 }}>
            <Text style={{ fontSize: 34, color: ZONK_GOLD + '2E' }}>◬</Text>
            <Text style={{ color: ZONK_GOLD + 'AA', fontSize: 10, letterSpacing: 2, fontFamily: mono, fontWeight: '700' }}>THE SAND IS UNTURNED</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 16, paddingHorizontal: 22, fontStyle: 'italic' }}>
              Every pillar of truth was once a wild guess no one would say aloud. Throw the first one in. Most dissolve. The grain that survives is yours.
            </Text>
          </View>
        )}

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
      )}

      {fullscreenSection === 'psi' && (
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: PSI_PURPLE + '44', backgroundColor: '#060012', marginBottom: 16, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setPsiCollapsed(v => !v)} style={{ padding: 14 }}>
          <Text style={{ position: 'absolute', right: 10, top: 4, fontSize: 64, color: PSI_PURPLE + '0C', fontFamily: mono, lineHeight: 72 }}>ψ</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: psiCollapsed ? 0 : 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: PSI_PURPLE + '18', borderWidth: 1, borderColor: PSI_PURPLE + '44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: PSI_PURPLE, fontSize: 18, fontFamily: mono }}>ψ</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: PSI_PURPLE, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>PSI PRACTICE</Text>
              <Text style={{ color: PSI_PURPLE + '77', fontSize: 9, fontFamily: mono }}>consciousness research · frontier science</Text>
            </View>
            <Text style={{ color: PSI_PURPLE + 'AA', fontSize: 11 }}>{psiCollapsed ? '▶' : '▼'}</Text>
          </View>
          {psiCollapsed && <Text style={{ color: PSI_PURPLE + '55', fontSize: 9, fontStyle: 'italic', lineHeight: 14 }}>Remote viewing · precognition · ganzfeld. Log your sessions. Let the record speak.</Text>}
        </TouchableOpacity>
        {!psiCollapsed && <View style={{ height: 1, backgroundColor: PSI_PURPLE + '22' }} />}

        {!psiCollapsed && !focusMode && (
        <View style={{ padding: 14 }}>
        <View style={{ padding: 10, borderRadius: 8, backgroundColor: PSI_PURPLE + '0A', borderWidth: 1, borderColor: PSI_PURPLE + '22', marginBottom: 10 }}>
          <Text style={{ color: PSI_PURPLE + 'BB', fontSize: 9, lineHeight: 14, fontFamily: mono }}>
            ψ FRONTIER SCIENCE — Psi phenomena are genuinely contested. The evidence exists (Radin meta-analyses, STARGATE declassified, GCP 30-year dataset) and is genuinely uncertain. This is not mysticism and not consensus. Log what you observe. Draw your own conclusions.
          </Text>
        </View>

        {/* ── Hit rate tracker ── */}
        {(() => {
          const judged = psiLog.filter(e => e.result !== 'pending');
          if (judged.length === 0) return null;
          const hits    = judged.filter(e => e.result === 'hit').length;
          const partial = judged.filter(e => e.result === 'partial').length;
          const misses  = judged.filter(e => e.result === 'miss').length;
          const hitPct  = Math.round((hits / judged.length) * 100);
          const hpPct   = Math.round(((hits + partial) / judged.length) * 100);
          const byType  = (['RV','PREC','GANZFELD','GENERAL'] as PsiEntryType[]).map(t => ({
            t, total: judged.filter(e => e.type === t).length, hits: judged.filter(e => e.type === t && e.result === 'hit').length,
          })).filter(x => x.total > 0);
          return (
            <View style={{ backgroundColor: PSI_PURPLE + '0C', borderRadius: 12, borderWidth: 1, borderColor: PSI_PURPLE + '33', padding: 14, marginBottom: 14 }}>
              <Text style={{ color: PSI_PURPLE, fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>ψ SESSION RECORD · {judged.length} judged</Text>
              {/* Hit / partial / miss bar */}
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#1A1A2E', overflow: 'hidden', flexDirection: 'row', marginBottom: 8 }}>
                <View style={{ flex: hits, backgroundColor: '#4CAF50' }} />
                <View style={{ flex: partial, backgroundColor: '#FF9F1C' }} />
                <View style={{ flex: misses, backgroundColor: '#E74C3C' }} />
                <View style={{ flex: Math.max(0, judged.length - hits - partial - misses), backgroundColor: 'transparent' }} />
              </View>
              <View style={{ flexDirection: 'row', gap: 14, marginBottom: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#4CAF50', fontSize: 18, fontWeight: '700', fontFamily: mono }}>{hitPct}%</Text>
                  <Text style={{ color: '#4CAF5088', fontSize: 8, fontFamily: mono }}>HIT RATE</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: '#FF9F1C', fontSize: 18, fontWeight: '700', fontFamily: mono }}>{hpPct}%</Text>
                  <Text style={{ color: '#FF9F1C88', fontSize: 8, fontFamily: mono }}>HIT+PARTIAL</Text>
                </View>
                <View style={{ flex: 1 }} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#4CAF50', fontSize: 12, fontFamily: mono }}>{hits} hit</Text>
                  <Text style={{ color: '#FF9F1C', fontSize: 12, fontFamily: mono }}>{partial} partial</Text>
                  <Text style={{ color: '#E74C3C', fontSize: 12, fontFamily: mono }}>{misses} miss</Text>
                </View>
              </View>
              {byType.length > 1 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {byType.map(x => (
                    <View key={x.t} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: PSI_PURPLE + '33', backgroundColor: PSI_PURPLE + '0A' }}>
                      <Text style={{ color: PSI_PURPLE + 'CC', fontSize: 9, fontFamily: mono }}>{x.t} {x.hits}/{x.total}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={{ color: PSI_PURPLE + '55', fontSize: 8, fontFamily: mono, marginTop: 8, fontStyle: 'italic' }}>Chance baseline varies by protocol. RV 4-AFC = 25%. Track your own baseline.</Text>
            </View>
          );
        })()}

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, lineHeight: 15, fontStyle: 'italic', flex: 1 }}>
            Log impressions before verification. Let the record speak.
          </Text>
          <TouchableOpacity onPress={() => { setShowPsiForm(true); }} style={{ marginLeft: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: PSI_PURPLE + '55', backgroundColor: PSI_PURPLE + '18' }}>
            <Text style={{ color: PSI_PURPLE, fontSize: 10, fontWeight: '700' }}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {showPsiForm && (
          <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: PSI_PURPLE + '44', marginBottom: 12 }}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 6 }}>PRACTICE TYPE</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {(['RV', 'PREC', 'GANZFELD', 'GENERAL'] as PsiEntryType[]).map(t => (
                <TouchableOpacity key={t} onPress={() => setPsiDraft(d => ({ ...d, type: t }))}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: psiDraft.type === t ? PSI_PURPLE : SOL_THEME.border, backgroundColor: psiDraft.type === t ? PSI_PURPLE + '22' : 'transparent' }}>
                  <Text style={{ color: psiDraft.type === t ? PSI_PURPLE : SOL_THEME.textMuted, fontSize: 10, fontWeight: '700' }}>{PSI_TYPE_LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>TARGET / PROMPT</Text>
            <TextInput
              value={psiDraft.target} onChangeText={v => setPsiDraft(d => ({ ...d, target: v }))}
              placeholder="Coordinates, image ID, event to predict..."
              placeholderTextColor={SOL_THEME.textMuted + '88'}
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 12, marginBottom: 10 }}
            />
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>IMPRESSIONS (before reveal)</Text>
            <TextInput
              value={psiDraft.impression} onChangeText={v => setPsiDraft(d => ({ ...d, impression: v }))}
              placeholder="What came through — images, feelings, words..."
              placeholderTextColor={SOL_THEME.textMuted + '88'}
              multiline numberOfLines={3}
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 12, marginBottom: 10, minHeight: 64, textAlignVertical: 'top' }}
            />
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, fontFamily: mono, marginBottom: 4 }}>OUTCOME / VERIFICATION (optional)</Text>
            <TextInput
              value={psiDraft.outcome} onChangeText={v => setPsiDraft(d => ({ ...d, outcome: v }))}
              placeholder="What was the actual target / what happened?"
              placeholderTextColor={SOL_THEME.textMuted + '88'}
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 12, marginBottom: 10 }}
            />
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

        {psiLog.length > 0 && (
          <>
            {(psiExpanded ? psiLog : psiLog.slice(0, 3)).map(entry => (
              <View key={entry.id} style={{ borderTopWidth: 1, borderTopColor: SOL_THEME.border, paddingTop: 10, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>{entry.date}</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: PSI_PURPLE + '22' }}>
                    <Text style={{ color: PSI_PURPLE, fontSize: 9, fontWeight: '700' }}>{entry.type}</Text>
                  </View>
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
          <View style={{ alignItems: 'center', paddingVertical: 26, gap: 10 }}>
            <Text style={{ fontSize: 40, color: PSI_PURPLE + '33', fontFamily: mono }}>ψ</Text>
            <Text style={{ color: PSI_PURPLE + 'AA', fontSize: 11, letterSpacing: 2, fontFamily: mono, fontWeight: '700' }}>THE RECORD IS EMPTY</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textAlign: 'center', lineHeight: 16, paddingHorizontal: 20, fontStyle: 'italic' }}>
              Log an impression before you verify it. Over many sessions, the record either holds a signal — or it doesn't. That honesty is the practice.
            </Text>
            <TouchableOpacity onPress={() => setShowPsiForm(true)} style={{ marginTop: 4, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: PSI_PURPLE + '66', backgroundColor: PSI_PURPLE + '14' }}>
              <Text style={{ color: PSI_PURPLE, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>+ FIRST SESSION</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
        )}
      </View>
      )}

      {/* ── ASPECTS SECTION ── */}
      {fullscreenSection === 'aspects' && (
      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: '#88AAFF44', backgroundColor: '#060814', marginBottom: 16, overflow: 'hidden' }}>
        <TouchableOpacity onPress={() => setAspectsCollapsed(v => !v)} style={{ padding: 14 }}>
          <Text style={{ position: 'absolute', right: 8, top: -4, fontSize: 64, color: '#88AAFF0C', fontFamily: mono, lineHeight: 72 }}>⟐</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: aspectsCollapsed ? 0 : 4 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#88AAFF18', borderWidth: 1, borderColor: '#88AAFF44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#88AAFF', fontSize: 18, fontFamily: mono }}>⟐</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#88AAFF', fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>ASPECTS</Text>
              <Text style={{ color: '#88AAFF77', fontSize: 9, fontFamily: mono }}>planet angles · conjunctions · tensions</Text>
            </View>
            <Text style={{ color: '#88AAFF99', fontSize: 11 }}>{aspectsCollapsed ? '▶' : '▼'}</Text>
          </View>
          {aspectsCollapsed && <Text style={{ color: '#88AAFF55', fontSize: 9, fontStyle: 'italic', lineHeight: 14 }}>Angular relationships between planets — where the sky converges, squares, and harmonises.</Text>}
        </TouchableOpacity>
        {!aspectsCollapsed && <View style={{ height: 1, backgroundColor: '#88AAFF22' }} />}

        {!aspectsCollapsed && !focusMode && (() => {
          // Compute all planet longitudes for today
          const planetLons = PLANETS_SKY.map(p => ({
            ...p,
            lon: getPlanetLongitude(p.L0, p.rate),
          }));
          // Add Sun and Moon
          const allBodies = [
            { name: 'Sun',  glyph: '☀', color: '#F5C842', lon: mod360(280.46646 + 0.9856474 * ((() => { const n = new Date(); return julianDay(n.getFullYear(), n.getMonth()+1, n.getDate(), n.getHours()) - 2451545.0; })())) },
            { name: 'Moon', glyph: '☽', color: '#DDDDFF', lon: mod360(218.3165 + 13.1763966 * ((() => { const n = new Date(); return julianDay(n.getFullYear(), n.getMonth()+1, n.getDate(), n.getHours()) - 2451545.0; })())) },
            ...planetLons,
          ];
          const aspects: Array<{ a: typeof allBodies[0]; b: typeof allBodies[0]; asp: { name: string; symbol: string; color: string; orb: number } }> = [];
          for (let i = 0; i < allBodies.length; i++) {
            for (let j = i + 1; j < allBodies.length; j++) {
              const asp = getAspectBetween(allBodies[i].lon, allBodies[j].lon);
              if (asp) aspects.push({ a: allBodies[i], b: allBodies[j], asp });
            }
          }
          const grouped: Record<string, typeof aspects> = {};
          aspects.forEach(item => {
            if (!grouped[item.asp.name]) grouped[item.asp.name] = [];
            grouped[item.asp.name].push(item);
          });
          const ORDER = ['Conjunction', 'Trine', 'Sextile', 'Square', 'Opposition'];
          const ASPECT_DESC: Record<string, string> = {
            Conjunction: 'Planets merge — amplified energy, fusion of themes',
            Trine:       'Flowing harmony — ease, natural talent, gift',
            Sextile:     'Gentle opportunity — cooperative, supportive',
            Square:      'Creative tension — friction that forces growth',
            Opposition:  'Polarity — awareness through contrast, integration needed',
          };

          if (aspects.length === 0) {
            return (
              <View style={{ padding: 18 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>No major aspects in the sky today.</Text>
              </View>
            );
          }

          return (
            <View style={{ padding: 14 }}>
              {/* Intro note */}
              <View style={{ padding: 10, borderRadius: 8, backgroundColor: '#88AAFF0A', borderWidth: 1, borderColor: '#88AAFF22', marginBottom: 14 }}>
                <Text style={{ color: '#88AAFF99', fontSize: 9, lineHeight: 14, fontFamily: mono }}>
                  ⟐ TODAY'S LIVE SKY — {aspects.length} active aspect{aspects.length !== 1 ? 's' : ''} computed for {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Orb tolerance: ☌ ≤10° · △ ≤8° · ✶ ≤6° · □ ≤8° · ☍ ≤10°.
                </Text>
              </View>
              {ORDER.filter(name => grouped[name]?.length > 0).map(aspName => (
                <View key={aspName} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text style={{ color: grouped[aspName][0].asp.color, fontSize: 16 }}>{grouped[aspName][0].asp.symbol}</Text>
                    <Text style={{ color: grouped[aspName][0].asp.color, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>{aspName.toUpperCase()}</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: grouped[aspName][0].asp.color + '22' }} />
                  </View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontStyle: 'italic', marginBottom: 8, lineHeight: 13 }}>{ASPECT_DESC[aspName]}</Text>
                  {grouped[aspName].map((item, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: idx < grouped[aspName].length - 1 ? 1 : 0, borderBottomColor: '#88AAFF11' }}>
                      <Text style={{ color: item.a.color, fontSize: 18, width: 24, textAlign: 'center' }}>{item.a.glyph}</Text>
                      <Text style={{ color: item.asp.color, fontSize: 12 }}>{item.asp.symbol}</Text>
                      <Text style={{ color: item.b.color, fontSize: 18, width: 24, textAlign: 'center' }}>{item.b.glyph}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#FFFFFFCC', fontSize: 11, fontWeight: '700' }}>{item.a.name} {item.asp.symbol} {item.b.name}</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>orb {item.asp.orb}°</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        })()}
      </View>
      )}

      {/* YOUR CHART — natal data */}
      {fullscreenSection === 'natal' && birthData && !editingBirth && sunSign && (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: ZODIAC_INDIGO + '66', backgroundColor: '#060010', marginBottom: 16, overflow: 'hidden' }}>
          <Text style={{ position: 'absolute', top: -18, right: -6, fontSize: 88, color: ZODIAC_INDIGO + '09', lineHeight: 100, fontFamily: mono }}>⊚</Text>
          <TouchableOpacity onPress={() => setNatalCollapsed(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 16 }}>⊚</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>YOUR NATAL CHART</Text>
              <Text style={{ color: ZODIAC_INDIGO + '77', fontSize: 9, fontFamily: mono }}>{sunSign.glyph} {sunSign.name}{moonSign ? ` · ☽ ${moonSign.name}` : ''}</Text>
            </View>
            <Text style={{ color: ZODIAC_INDIGO + 'AA', fontSize: 11 }}>{natalCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!natalCollapsed && <View style={{ height: 1, backgroundColor: ZODIAC_INDIGO + '22' }} />}
          {!natalCollapsed && !focusMode && (
          <View style={{ padding: 16 }}>
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
      {fullscreenSection === 'natal' && !birthData && !editingBirth && (
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
      {fullscreenSection === 'natal' && editingBirth && (
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

      {/* ── GEM FORGE ── */}
      {fullscreenSection === 'gems' && (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: GEM_VIOLET + '44', backgroundColor: '#06001A', marginBottom: 16, overflow: 'hidden' }}>
          {/* Header */}
          <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ position: 'absolute', right: 8, top: -4, fontSize: 64, color: GEM_VIOLET + '0C', fontFamily: mono, lineHeight: 72 }}>◆</Text>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: GEM_VIOLET + '18', borderWidth: 1, borderColor: GEM_VIOLET + '44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: GEM_VIOLET, fontSize: 18, fontFamily: mono }}>◆</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: GEM_VIOLET, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>GEM FORGE</Text>
              <Text style={{ color: GEM_VIOLET + '77', fontSize: 9, fontFamily: mono }}>intention → living talisman</Text>
            </View>
            {(gemView === 'forge' || gemView === 'generating' || gemView === 'result') && (
              <TouchableOpacity onPress={() => setGemView('gallery')} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ color: GEM_VIOLET + '88', fontSize: 9, fontFamily: mono }}>← COLLECTION</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ height: 1, backgroundColor: GEM_VIOLET + '22' }} />

          {/* GALLERY VIEW */}
          {gemView === 'gallery' && (
            <View style={{ padding: 14 }}>
              <View style={{ padding: 10, borderRadius: 8, backgroundColor: GEM_VIOLET + '0A', borderWidth: 1, borderColor: GEM_VIOLET + '22', marginBottom: 14 }}>
                <Text style={{ color: GEM_VIOLET + '99', fontSize: 9, lineHeight: 14, fontFamily: mono }}>
                  ◆ A gem forged with intention carries the weight of the ritual that made it.{'\n'}The specificity of your input is what makes it real.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setGemView('forge')}
                style={{ paddingVertical: 11, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: GEM_VIOLET + '55', backgroundColor: GEM_VIOLET + '14', marginBottom: gemCollection.length > 0 ? 14 : 0 }}>
                <Text style={{ color: GEM_VIOLET, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>◆  FORGE NEW GEM</Text>
              </TouchableOpacity>
              {gemCollection.map(gem => (
                <TouchableOpacity key={gem.id} onPress={() => setGemDetailId(gemDetailId === gem.id ? null : gem.id)}
                  style={{ borderRadius: 10, borderWidth: 1, borderColor: gem.colour.hex + '44', backgroundColor: gem.colour.hex + '0C', padding: 12, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: gem.colour.hex + '33', borderWidth: 1, borderColor: gem.colour.hex + '66', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: gem.colour.hex, fontSize: 14, fontFamily: mono }}>◆</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: gem.colour.hex, fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: mono }}>{gem.name}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontFamily: mono }}>{gem.colour.name} · {gem.element} · {gem.date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {gem.symbols.slice(0, 4).map((s, i) => <Text key={i} style={{ color: gem.colour.hex + 'AA', fontSize: 10 }}>{s}</Text>)}
                    </View>
                    <Text style={{ color: GEM_VIOLET + '66', fontSize: 10 }}>{gemDetailId === gem.id ? '▼' : '▶'}</Text>
                  </View>
                  {gemDetailId === gem.id && (
                    <View style={{ marginTop: 10, gap: 6 }}>
                      <Text style={{ color: gem.colour.hex + 'CC', fontSize: 10, lineHeight: 16, fontStyle: 'italic' }}>{gem.invocation}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, lineHeight: 14 }}>{gem.careRitual}</Text>
                      <Text style={{ color: gem.colour.hex + '88', fontSize: 12, letterSpacing: 4, marginTop: 4 }}>{gem.symbols.join('  ')}</Text>
                      <TouchableOpacity onPress={() => deleteGem(gem.id)}
                        style={{ alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FF444433', marginTop: 4 }}>
                        <Text style={{ color: '#FF6666', fontSize: 8, fontFamily: mono }}>DISSOLVE GEM</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {gemCollection.length === 0 && (
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textAlign: 'center', fontStyle: 'italic', paddingVertical: 8 }}>No gems forged yet.</Text>
              )}
            </View>
          )}

          {/* FORGE FORM VIEW */}
          {gemView === 'forge' && (
            <View style={{ padding: 14, gap: 14 }}>
              {/* INTENTION */}
              <View>
                <Text style={{ color: GEM_VIOLET, fontSize: 8, letterSpacing: 2, fontFamily: mono, marginBottom: 6 }}>INTENTION — what is this gem for?</Text>
                <TextInput value={gemIntention} onChangeText={setGemIntention}
                  placeholder="protection · clarity · grief · love · power · transition..."
                  placeholderTextColor={SOL_THEME.textMuted + '66'}
                  multiline style={{ backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: GEM_VIOLET + '33', borderRadius: 8, padding: 10, color: SOL_THEME.text, fontSize: 13, minHeight: 52 }} />
              </View>
              {/* FEELING */}
              <View>
                <Text style={{ color: GEM_VIOLET, fontSize: 8, letterSpacing: 2, fontFamily: mono, marginBottom: 6 }}>FEELING — what emotion should it carry?</Text>
                <TextInput value={gemFeeling} onChangeText={setGemFeeling}
                  placeholder="stillness · fire · grief held with dignity · quiet strength..."
                  placeholderTextColor={SOL_THEME.textMuted + '66'}
                  multiline style={{ backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: GEM_VIOLET + '33', borderRadius: 8, padding: 10, color: SOL_THEME.text, fontSize: 13, minHeight: 52 }} />
              </View>
              {/* ELEMENT */}
              <View>
                <Text style={{ color: GEM_VIOLET, fontSize: 8, letterSpacing: 2, fontFamily: mono, marginBottom: 6 }}>ELEMENT</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {GEM_ELEMENTS.map(el => (
                    <TouchableOpacity key={el.id} onPress={() => setGemElement(el.id)}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1,
                        borderColor: gemElement === el.id ? GEM_VIOLET + 'AA' : GEM_VIOLET + '33',
                        backgroundColor: gemElement === el.id ? GEM_VIOLET + '22' : 'transparent' }}>
                      <Text style={{ color: gemElement === el.id ? GEM_VIOLET : GEM_VIOLET + '77', fontSize: 9, fontFamily: mono }}>{el.glyph}  {el.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* COLOUR */}
              <View>
                <Text style={{ color: GEM_VIOLET, fontSize: 8, letterSpacing: 2, fontFamily: mono, marginBottom: 6 }}>COLOUR PULL</Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {GEM_COLOURS.map(c => (
                    <TouchableOpacity key={c.name} onPress={() => setGemColour(c)}
                      style={{ alignItems: 'center', gap: 3 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.hex,
                        borderWidth: gemColour?.name === c.name ? 2 : 1,
                        borderColor: gemColour?.name === c.name ? '#FFFFFF' : c.hex + '66' }} />
                      <Text style={{ color: gemColour?.name === c.name ? SOL_THEME.text : SOL_THEME.textMuted, fontSize: 7, fontFamily: mono }}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* ASTRO BOND */}
              <View>
                <Text style={{ color: GEM_VIOLET, fontSize: 8, letterSpacing: 2, fontFamily: mono, marginBottom: 6 }}>ASTROLOGICAL BOND (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -2 }}>
                  <View style={{ flexDirection: 'row', gap: 5, paddingHorizontal: 2 }}>
                    {GEM_ASTRO.map(a => (
                      <TouchableOpacity key={a} onPress={() => setGemAstro(gemAstro === a ? null : a)}
                        style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, borderWidth: 1,
                          borderColor: gemAstro === a ? GEM_VIOLET + 'AA' : GEM_VIOLET + '22',
                          backgroundColor: gemAstro === a ? GEM_VIOLET + '1A' : 'transparent' }}>
                        <Text style={{ color: gemAstro === a ? GEM_VIOLET : SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>{a}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
              {/* NAME */}
              <View>
                <Text style={{ color: GEM_VIOLET, fontSize: 8, letterSpacing: 2, fontFamily: mono, marginBottom: 6 }}>NAME THIS GEM</Text>
                <TextInput value={gemName} onChangeText={setGemName}
                  placeholder="the name you give it is part of its power"
                  placeholderTextColor={SOL_THEME.textMuted + '66'}
                  style={{ backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: GEM_VIOLET + '33', borderRadius: 8, padding: 10, color: SOL_THEME.text, fontSize: 13 }} />
              </View>
              {/* FORGE BUTTON */}
              <TouchableOpacity
                disabled={!gemIntention.trim() || !gemFeeling.trim() || !gemElement || !gemColour || !gemName.trim()}
                onPress={forgeGem}
                style={{ paddingVertical: 13, alignItems: 'center', borderRadius: 10, borderWidth: 1,
                  borderColor: (gemIntention.trim() && gemFeeling.trim() && gemElement && gemColour && gemName.trim()) ? GEM_VIOLET + 'AA' : GEM_VIOLET + '22',
                  backgroundColor: (gemIntention.trim() && gemFeeling.trim() && gemElement && gemColour && gemName.trim()) ? GEM_VIOLET + '22' : 'transparent' }}>
                <Text style={{ color: (gemIntention.trim() && gemFeeling.trim() && gemElement && gemColour && gemName.trim()) ? GEM_VIOLET : GEM_VIOLET + '44',
                  fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>
                  ◆  FORGE THIS GEM
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* GENERATING */}
          {gemView === 'generating' && (
            <View style={{ padding: 32, alignItems: 'center', gap: 14 }}>
              <Text style={{ color: GEM_VIOLET, fontSize: 22 }}>◆</Text>
              <Text style={{ color: GEM_VIOLET, fontSize: 10, letterSpacing: 3, fontFamily: mono }}>FORGING...</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, textAlign: 'center', fontStyle: 'italic' }}>Sol is giving form to your intention.</Text>
            </View>
          )}

          {/* RESULT VIEW */}
          {gemView === 'result' && gemColour && (
            <View style={{ padding: 14, gap: 12 }}>
              {/* Gem card */}
              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: gemColour.hex + '55', backgroundColor: gemColour.hex + '0C', padding: 16, alignItems: 'center', gap: 8 }}>
                <Text style={{ color: gemColour.hex, fontSize: 32 }}>◆</Text>
                <Text style={{ color: gemColour.hex, fontSize: 12, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>{gemName}</Text>
                <Text style={{ color: gemColour.hex + '88', fontSize: 8, fontFamily: mono }}>{gemColour.name} · {gemElement} {gemAstro ? `· ${gemAstro}` : ''}</Text>
              </View>
              {/* Invocation */}
              <View style={{ gap: 4 }}>
                <Text style={{ color: GEM_VIOLET + '88', fontSize: 8, letterSpacing: 2, fontFamily: mono }}>INVOCATION</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 12, lineHeight: 18, fontStyle: 'italic' }}>{gemInvocation}</Text>
              </View>
              {/* Care ritual */}
              <View style={{ gap: 4 }}>
                <Text style={{ color: GEM_VIOLET + '88', fontSize: 8, letterSpacing: 2, fontFamily: mono }}>CARE RITUAL</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}>{gemCareRitual}</Text>
              </View>
              {/* LAMAGUE symbol picker */}
              <View style={{ gap: 6 }}>
                <Text style={{ color: GEM_VIOLET + '88', fontSize: 8, letterSpacing: 2, fontFamily: mono }}>LAMAGUE ENCODING — choose the symbols this gem carries</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontStyle: 'italic' }}>Sol suggested these. Accept, remove, or replace them — the final encoding is yours.</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {(gemShowAllSymbols ? LAMAGUE_POOL : gemSuggestedSymbols).map(sym => (
                    <TouchableOpacity key={sym}
                      onPress={() => setGemChosenSymbols(prev => prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym])}
                      style={{ width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                        borderColor: gemChosenSymbols.includes(sym) ? gemColour.hex + 'AA' : GEM_VIOLET + '22',
                        backgroundColor: gemChosenSymbols.includes(sym) ? gemColour.hex + '22' : 'transparent' }}>
                      <Text style={{ color: gemChosenSymbols.includes(sym) ? gemColour.hex : SOL_THEME.textMuted, fontSize: 16 }}>{sym}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setGemShowAllSymbols(v => !v)}>
                  <Text style={{ color: GEM_VIOLET + '77', fontSize: 8, fontFamily: mono, marginTop: 2 }}>
                    {gemShowAllSymbols ? '▲ SHOW SUGGESTIONS ONLY' : '▼ BROWSE FULL SYMBOL LIBRARY'}
                  </Text>
                </TouchableOpacity>
                {gemChosenSymbols.length > 0 && (
                  <Text style={{ color: gemColour.hex, fontSize: 14, letterSpacing: 5, marginTop: 4, textAlign: 'center' }}>
                    {gemChosenSymbols.join('  ')}
                  </Text>
                )}
              </View>
              {/* Save */}
              <TouchableOpacity onPress={saveGem}
                style={{ paddingVertical: 13, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: gemColour.hex + 'AA', backgroundColor: gemColour.hex + '1A', marginTop: 4 }}>
                <Text style={{ color: gemColour.hex, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: mono }}>◆  SEAL THIS GEM</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── FIRST-VISIT OVERLAY ── */}
      {showTabIntro && (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center', zIndex: 99,
          opacity: tabIntroOp,
        }}>
          <View style={{ backgroundColor: '#05001099', borderRadius: 18, borderWidth: 1, borderColor: ZODIAC_INDIGO + '55', paddingVertical: 18, paddingHorizontal: 32 }}>
            <Text style={{ color: ZODIAC_INDIGO, fontSize: 10, letterSpacing: 3, fontFamily: mono, textAlign: 'center' }}>THE FIELD IS OPEN</Text>
          </View>
        </Animated.View>
      )}

      <TarotViewer visible={tarotViewerOpen} onClose={() => setTarotViewerOpen(false)} />
    </View>
  );
}
