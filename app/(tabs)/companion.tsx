import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, Easing,
  Platform, Dimensions, TextInput, Modal, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Svg, { Circle, Line, G, Text as SvgText, Rect } from 'react-native-svg';
import { CreatureSvg } from '../../components/CreatureSvg';
import { CompanionSpecOverlay, CompanionSpec, DEFAULT_SPEC } from '../../components/CompanionSpecOverlay';
import { CompanionRenderer, CompanionVisualSpec } from '../../components/CompanionRenderer';
import COMPANIONS_DATA from '../../assets/companions/companions_data.json';
import { sendMessage } from '../../lib/ai-client';
import { getProviderKey, getActiveKey, getModel } from '../../lib/storage';
import { getGearOverlay } from '../data/task2_gear_overlays';
import { generateJournalEntry, saveJournalEntry } from '../data/task3_journal';

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_H = 520;
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// ─── Types ────────────────────────────────────────────────────────────────────

type EvolutionStage = 0 | 1 | 2 | 3 | 4 | 5;
type CompanionMood  = 'dormant' | 'present' | 'lit' | 'transcendent';
type SkinId        = 'solform' | 'void' | 'aurora' | 'crimson' | 'obsidian' | 'lycheetah' | 'chaos' | 'sovereign'
                   | 'norse' | 'celtic' | 'egyptian' | 'akashic' | 'kabbala' | 'noetic' | 'lamague' | 'delphi' | 'sufi' | 'quantum'
                   // ── New World Zones (v4.4.0) ──
                   | 'auroral_chaos' | 'chaos_temple' | 'apollo_jungle' | 'celestial_sigil' | 'crystal_nexus'
                   | 'mana_field' | 'neon_cove' | 'alabaster_chasm' | 'antarctic_refuge' | 'augmented_ai'
                   | 'aurorian_pillar' | 'celestial_foundry' | 'chaos_filaments' | 'crystal_chaos' | 'crystal_memory'
                   | 'crystal_soul' | 'elven_village' | 'glitch_cascade' | 'lyc_nexus' | 'pulse_sanctum'
                   | 'pulse_zone' | 'noetic_sanctum' | 'obsidian_forge' | 'obsidian_forge2' | 'portal_valley'
                   | 'veil_atrium' | 'voyagers_edge';
type Direction     = 'up' | 'down' | 'left' | 'right';
type GearSlot      = 'crown' | 'sigil' | 'mantle' | 'body' | 'cape';
type ArchetypeId   = 'archivist' | 'alchemist' | 'oracle' | 'sentinel' | 'wanderer' | 'lycheetah' | 'cipher' | 'herald' | 'weaver' | 'revenant';
type EvoPath       = 'A' | 'B' | 'C';

// ─── Skins — all unlocked ────────────────────────────────────────────────────

const SKINS: Record<SkinId, {
  id: SkinId; name: string; desc: string; glyph: string;
  color: string; dimColor: string; bgColor: string; skyColor: string; particleGlyph: string;
  glowColor: string; cardBg: string; starGlyphs: string[];
}> = {
  solform:  { id: 'solform',  name: 'SOLFORM',   desc: 'Origin',    glyph: '◉', color: '#C49A3C', dimColor: '#7A5E1A', bgColor: '#000000', skyColor: '#C49A3C', particleGlyph: '◦', glowColor: '#C49A3C44', cardBg: '#1A1400', starGlyphs: ['·','◦','·','⊹','·','◦'] },
  void:     { id: 'void',     name: 'VOID',      desc: 'Abyss',     glyph: '◈', color: '#9B6BFF', dimColor: '#5C3A99', bgColor: '#000000', skyColor: '#7B4BDD', particleGlyph: '◈', glowColor: '#9B6BFF44', cardBg: '#0D0022', starGlyphs: ['◈','·','◌','·','◈','·'] },
  aurora:   { id: 'aurora',   name: 'AURORA',    desc: 'Light',     glyph: '◦', color: '#4ECDC4', dimColor: '#2A7A75', bgColor: '#000000', skyColor: '#2EA8A0', particleGlyph: '·', glowColor: '#4ECDC444', cardBg: '#00130F', starGlyphs: ['·','◦','·','·','⊹','·'] },
  crimson:  { id: 'crimson',  name: 'CRIMSON',   desc: 'Fire',      glyph: '✦', color: '#FF6B6B', dimColor: '#993030', bgColor: '#000000', skyColor: '#CC3333', particleGlyph: '✦', glowColor: '#FF6B6B44', cardBg: '#1A0000', starGlyphs: ['✦','·','✦','·','·','✦'] },
  obsidian: { id: 'obsidian', name: 'OBSIDIAN',  desc: 'Sovereign', glyph: '⊕', color: '#C8A96E', dimColor: '#6B4F1A', bgColor: '#000000', skyColor: '#8B6914', particleGlyph: '⊕', glowColor: '#C8A96E55', cardBg: '#100C00', starGlyphs: ['⊕','·','⊛','·','⊕','◦'] },
  lycheetah:{ id: 'lycheetah', name: 'LYCHEETAH', desc: 'The Cat',   glyph: '✧', color: '#FF9F1C', dimColor: '#994400', bgColor: '#000000', skyColor: '#CC5500', particleGlyph: '✧', glowColor: '#FF9F1C55', cardBg: '#150800', starGlyphs: ['✧','◦','✧','·','⊹','✧'] },
  chaos:    { id: 'chaos',    name: 'CHAOS',     desc: 'Fracture',  glyph: '⚡', color: '#4A0080', dimColor: '#2A0050', bgColor: '#000000', skyColor: '#6600AA', particleGlyph: '⚡', glowColor: '#4A008055', cardBg: '#0A0014', starGlyphs: ['⚡','·','◈','·','⚡','◦'] },
  sovereign:{ id: 'sovereign', name: 'SOVEREIGN', desc: 'Earned',    glyph: '⊚', color: '#FFD700', dimColor: '#8B6914', bgColor: '#000000', skyColor: '#003366', particleGlyph: '⊚', glowColor: '#FFD70055', cardBg: '#000C18', starGlyphs: ['⊚','·','✦','·','⊚','◦'] },
  // ── Mythical / Mystery School zones (art pending — Kimi brief when ready) ──
  norse:    { id: 'norse',    name: 'YGGDRASIL',  desc: 'Nine Realms',   glyph: 'ᚠ', color: '#8AB4D4', dimColor: '#3A6A8A', bgColor: '#000000', skyColor: '#2A5A7A', particleGlyph: 'ᚠ', glowColor: '#8AB4D455', cardBg: '#000C18', starGlyphs: ['ᚠ','·','ᚢ','·','ᚦ','·'] },
  celtic:   { id: 'celtic',   name: 'TÍR NA NÓG', desc: 'Otherworld',    glyph: '☘', color: '#5AC878', dimColor: '#2A6B3A', bgColor: '#000000', skyColor: '#1A5A2A', particleGlyph: '◦', glowColor: '#5AC87855', cardBg: '#001008', starGlyphs: ['☘','·','◦','·','☘','·'] },
  egyptian: { id: 'egyptian', name: 'THE DUAT',    desc: 'Hall of Truth', glyph: '𓂀', color: '#D4A843', dimColor: '#7A5A10', bgColor: '#000000', skyColor: '#8B6400', particleGlyph: '𓂀', glowColor: '#D4A84355', cardBg: '#120C00', starGlyphs: ['𓂀','·','◉','·','𓂀','·'] },
  akashic:  { id: 'akashic',  name: 'THE FIELD',   desc: 'Akashic',       glyph: '∞', color: '#B490FF', dimColor: '#6040AA', bgColor: '#000000', skyColor: '#5030AA', particleGlyph: '∞', glowColor: '#B490FF55', cardBg: '#080018', starGlyphs: ['∞','·','◈','·','∞','◦'] },
  kabbala:  { id: 'kabbala',  name: 'EIN SOF',     desc: 'Tree of Life',  glyph: '✡', color: '#E8D070', dimColor: '#9A7A10', bgColor: '#000000', skyColor: '#7A6000', particleGlyph: '✡', glowColor: '#E8D07055', cardBg: '#100C00', starGlyphs: ['✡','·','⊹','·','✡','·'] },
  noetic:   { id: 'noetic',   name: 'THE PSI FIELD',desc: 'Consciousness', glyph: 'ψ', color: '#70CCFF', dimColor: '#2A7AAA', bgColor: '#000000', skyColor: '#1A6A9A', particleGlyph: 'ψ', glowColor: '#70CCFF55', cardBg: '#000C18', starGlyphs: ['ψ','·','◦','·','ψ','·'] },
  lamague:  { id: 'lamague',  name: 'SYMBOL SPACE', desc: 'Grammar Forge', glyph: '⟟', color: '#CC88FF', dimColor: '#6630AA', bgColor: '#000000', skyColor: '#5020AA', particleGlyph: '⟟', glowColor: '#CC88FF55', cardBg: '#0A0020', starGlyphs: ['⟟','·','◈','·','⟟','◦'] },
  delphi:   { id: 'delphi',   name: 'DELPHI',       desc: 'The Oracle',    glyph: '☽', color: '#FFB860', dimColor: '#AA6010', bgColor: '#000000', skyColor: '#884000', particleGlyph: '☽', glowColor: '#FFB86055', cardBg: '#150800', starGlyphs: ['☽','·','✦','·','☽','·'] },
  sufi:     { id: 'sufi',     name: 'THE TAVERN',   desc: 'Divine Wine',   glyph: '◌', color: '#FF7070', dimColor: '#AA2020', bgColor: '#000000', skyColor: '#880020', particleGlyph: '◌', glowColor: '#FF707055', cardBg: '#180006', starGlyphs: ['◌','·','✦','·','◌','◦'] },
  quantum:  { id: 'quantum',  name: 'THE FIELD',    desc: 'Probability',   glyph: 'Ψ', color: '#60D8FF', dimColor: '#1A8AAA', bgColor: '#000000', skyColor: '#007A9A', particleGlyph: 'Ψ', glowColor: '#60D8FF55', cardBg: '#000C14', starGlyphs: ['Ψ','·','◈','·','Ψ','·'] },
  // ── New World Zones (v4.4.0) ────────────────────────────────────────────────
  auroral_chaos:     { id: 'auroral_chaos',     name: 'AURORAL CHAOS',      desc: 'Fractured spectrum',    glyph: '⚡', color: '#8855FF', dimColor: '#4422AA', bgColor: '#030008', skyColor: '#5522CC', particleGlyph: '◈', glowColor: '#8855FF55', cardBg: '#0A0018', starGlyphs: ['⚡','◈','·','⚡','◦','·'] },
  chaos_temple:      { id: 'chaos_temple',      name: 'CHAOS TEMPLE',       desc: 'The Lycheetah Order',   glyph: '⊗', color: '#6600CC', dimColor: '#330066', bgColor: '#04000A', skyColor: '#440088', particleGlyph: '⊗', glowColor: '#6600CC55', cardBg: '#080015', starGlyphs: ['⊗','·','◈','·','⊗','◦'] },
  apollo_jungle:     { id: 'apollo_jungle',     name: 'APOLLO JUNGLE',      desc: 'Sun in the canopy',     glyph: '☀', color: '#88CC44', dimColor: '#448800', bgColor: '#010800', skyColor: '#336600', particleGlyph: '◦', glowColor: '#88CC4455', cardBg: '#020C00', starGlyphs: ['☀','·','◦','·','☀','⊹'] },
  celestial_sigil:   { id: 'celestial_sigil',   name: 'CELESTIAL SIGIL',    desc: 'Living script',         glyph: '✦', color: '#88AAFF', dimColor: '#3355AA', bgColor: '#000510', skyColor: '#2244AA', particleGlyph: '✦', glowColor: '#88AAFF55', cardBg: '#000818', starGlyphs: ['✦','·','◦','·','✦','·'] },
  crystal_nexus:     { id: 'crystal_nexus',     name: 'CRYSTAL NEXUS',      desc: 'Research frontier',     glyph: '◆', color: '#44DDCC', dimColor: '#1A8875', bgColor: '#000C0A', skyColor: '#1A7A6A', particleGlyph: '◆', glowColor: '#44DDCC55', cardBg: '#001210', starGlyphs: ['◆','·','◦','·','◆','·'] },
  mana_field:        { id: 'mana_field',        name: 'MANA FIELD',         desc: 'Flowing deep blue',     glyph: '∿', color: '#4488FF', dimColor: '#1A44AA', bgColor: '#00040C', skyColor: '#1133AA', particleGlyph: '∿', glowColor: '#4488FF55', cardBg: '#000614', starGlyphs: ['∿','·','◈','·','∿','◦'] },
  neon_cove:         { id: 'neon_cove',         name: 'NEON COVE',          desc: 'Bioluminescent deep',   glyph: '◉', color: '#FF44AA', dimColor: '#AA1155', bgColor: '#0A0005', skyColor: '#880033', particleGlyph: '◉', glowColor: '#FF44AA55', cardBg: '#150008', starGlyphs: ['◉','·','◦','·','◉','·'] },
  alabaster_chasm:   { id: 'alabaster_chasm',   name: 'ALABASTER CHASM',    desc: 'Ancient white stone',   glyph: '⊕', color: '#E8E0CC', dimColor: '#998870', bgColor: '#080806', skyColor: '#776655', particleGlyph: '⊕', glowColor: '#E8E0CC44', cardBg: '#100E08', starGlyphs: ['⊕','·','⊹','·','⊕','◦'] },
  antarctic_refuge:  { id: 'antarctic_refuge',  name: 'THE REFUGE',         desc: 'Frozen endurance',      glyph: '❄', color: '#88CCEE', dimColor: '#3377AA', bgColor: '#00080C', skyColor: '#226688', particleGlyph: '❄', glowColor: '#88CCEE55', cardBg: '#000C14', starGlyphs: ['❄','·','◦','·','❄','·'] },
  augmented_ai:      { id: 'augmented_ai',      name: 'AI ZONKZONE',        desc: 'Digital sentience',     glyph: '⟁', color: '#44FF88', dimColor: '#1A884A', bgColor: '#000C04', skyColor: '#117733', particleGlyph: '⟁', glowColor: '#44FF8855', cardBg: '#001408', starGlyphs: ['⟁','·','◈','·','⟁','◦'] },
  aurorian_pillar:   { id: 'aurorian_pillar',   name: 'AURORIAN PILLAR',    desc: 'Aurora made solid',     glyph: '◌', color: '#44EEC8', dimColor: '#1A8870', bgColor: '#000C08', skyColor: '#1A7760', particleGlyph: '◌', glowColor: '#44EEC855', cardBg: '#001210', starGlyphs: ['◌','·','◦','·','◌','·'] },
  celestial_foundry: { id: 'celestial_foundry', name: 'CELESTIAL FOUNDRY',  desc: 'Star-forged',           glyph: '⚒', color: '#FFAA22', dimColor: '#AA6600', bgColor: '#080400', skyColor: '#885500', particleGlyph: '⚒', glowColor: '#FFAA2255', cardBg: '#100800', starGlyphs: ['⚒','·','✦','·','⚒','◦'] },
  chaos_filaments:   { id: 'chaos_filaments',   name: 'CHAOS FILAMENTS',    desc: 'Threadwork undone',     glyph: '∞', color: '#FF44CC', dimColor: '#AA1177', bgColor: '#0A0005', skyColor: '#880055', particleGlyph: '∞', glowColor: '#FF44CC55', cardBg: '#160008', starGlyphs: ['∞','·','◈','·','∞','◦'] },
  crystal_chaos:     { id: 'crystal_chaos',     name: 'CRYSTAL CHAOS',      desc: 'Beautiful destruction', glyph: '◈', color: '#CC44FF', dimColor: '#7711AA', bgColor: '#06000C', skyColor: '#550099', particleGlyph: '◈', glowColor: '#CC44FF55', cardBg: '#0C0018', starGlyphs: ['◈','·','◦','·','◈','·'] },
  crystal_memory:    { id: 'crystal_memory',    name: 'CRYSTAL MEMORY',     desc: 'Fragmented archive',    glyph: '◊', color: '#8866FF', dimColor: '#3322AA', bgColor: '#030008', skyColor: '#3311AA', particleGlyph: '◊', glowColor: '#8866FF55', cardBg: '#060014', starGlyphs: ['◊','·','◈','·','◊','◦'] },
  crystal_soul:      { id: 'crystal_soul',      name: 'SOUL TEMPLE',        desc: 'Pure warm light',       glyph: '◎', color: '#FFEEAA', dimColor: '#AA8833', bgColor: '#080600', skyColor: '#886622', particleGlyph: '◎', glowColor: '#FFEEAA44', cardBg: '#100C00', starGlyphs: ['◎','·','⊹','·','◎','◦'] },
  elven_village:     { id: 'elven_village',     name: 'ELVEN VILLAGE',      desc: 'Elder forest kin',      glyph: '☘', color: '#44BB66', dimColor: '#1A6633', bgColor: '#000A02', skyColor: '#155522', particleGlyph: '☘', glowColor: '#44BB6655', cardBg: '#001006', starGlyphs: ['☘','·','◦','·','☘','·'] },
  glitch_cascade:    { id: 'glitch_cascade',    name: 'GLITCH CASCADE',     desc: 'Error-being',           glyph: '⚠', color: '#FF4466', dimColor: '#AA1133', bgColor: '#0C0002', skyColor: '#880022', particleGlyph: '⚠', glowColor: '#FF446655', cardBg: '#180004', starGlyphs: ['⚠','·','✦','·','⚠','◦'] },
  lyc_nexus:         { id: 'lyc_nexus',         name: 'THE NEXUS',          desc: 'Hub of all webs',       glyph: '✧', color: '#FF8822', dimColor: '#AA4400', bgColor: '#060200', skyColor: '#883300', particleGlyph: '✧', glowColor: '#FF882255', cardBg: '#0E0400', starGlyphs: ['✧','·','◦','·','✧','⊹'] },
  pulse_sanctum:     { id: 'pulse_sanctum',     name: 'PULSE SANCTUM',      desc: 'Concentric resonance',  glyph: '◎', color: '#AA44FF', dimColor: '#6611AA', bgColor: '#050010', skyColor: '#440099', particleGlyph: '◎', glowColor: '#AA44FF55', cardBg: '#08001A', starGlyphs: ['◎','·','◈','·','◎','◦'] },
  pulse_zone:        { id: 'pulse_zone',        name: 'PULSE ZONE',         desc: 'Kinetic frequency',     glyph: '⊹', color: '#44AAFF', dimColor: '#1155AA', bgColor: '#00040C', skyColor: '#1144AA', particleGlyph: '⊹', glowColor: '#44AAFF55', cardBg: '#000814', starGlyphs: ['⊹','·','◦','·','⊹','·'] },
  noetic_sanctum:    { id: 'noetic_sanctum',    name: 'NOETIC SANCTUM',     desc: 'Consciousness field',   glyph: 'ψ', color: '#44CCFF', dimColor: '#1188AA', bgColor: '#00080E', skyColor: '#116688', particleGlyph: 'ψ', glowColor: '#44CCFF55', cardBg: '#000C14', starGlyphs: ['ψ','·','◈','·','ψ','·'] },
  obsidian_forge:    { id: 'obsidian_forge',    name: 'OBSIDIAN FORGE',     desc: 'Ancient fire-titan',    glyph: '⊛', color: '#CC2222', dimColor: '#880000', bgColor: '#0C0000', skyColor: '#660000', particleGlyph: '⊛', glowColor: '#CC222255', cardBg: '#180000', starGlyphs: ['⊛','·','✦','·','⊛','◦'] },
  obsidian_forge2:   { id: 'obsidian_forge2',   name: 'VOID FORGE II',      desc: 'Shadow alchemy',        glyph: '⊕', color: '#AA1111', dimColor: '#660000', bgColor: '#0A0000', skyColor: '#440000', particleGlyph: '⊕', glowColor: '#AA111155', cardBg: '#140000', starGlyphs: ['⊕','·','◈','·','⊕','·'] },
  portal_valley:     { id: 'portal_valley',     name: 'PORTAL VALLEY',      desc: 'Between-places',        glyph: '◉', color: '#22FF88', dimColor: '#008844', bgColor: '#000C04', skyColor: '#006633', particleGlyph: '◉', glowColor: '#22FF8855', cardBg: '#001208', starGlyphs: ['◉','·','◦','·','◉','⊹'] },
  veil_atrium:       { id: 'veil_atrium',       name: 'VEIL ATRIUM',        desc: 'Between states',        glyph: '◌', color: '#AABBCC', dimColor: '#556677', bgColor: '#050607', skyColor: '#445566', particleGlyph: '◌', glowColor: '#AABBCC44', cardBg: '#080A0C', starGlyphs: ['◌','·','◦','·','◌','·'] },
  voyagers_edge:     { id: 'voyagers_edge',     name: "VOYAGER'S EDGE",     desc: 'Deep space frontier',   glyph: '⊚', color: '#5544CC', dimColor: '#2211AA', bgColor: '#02000A', skyColor: '#221188', particleGlyph: '⊚', glowColor: '#5544CC55', cardBg: '#040014', starGlyphs: ['⊚','·','✦','·','⊚','◦'] },
};
const SKIN_IDS: SkinId[] = [
  // Origin tier
  'solform', 'void', 'aurora', 'crimson',
  // Arcane tier
  'obsidian', 'lycheetah', 'chaos', 'sovereign',
  // Mythical / Mystery School
  'norse', 'celtic', 'egyptian', 'akashic', 'kabbala', 'noetic', 'lamague', 'delphi', 'sufi', 'quantum',
  // New World Zones (v4.4.0)
  'auroral_chaos', 'chaos_temple', 'apollo_jungle', 'celestial_sigil', 'crystal_nexus',
  'mana_field', 'neon_cove', 'alabaster_chasm', 'antarctic_refuge', 'augmented_ai',
  'aurorian_pillar', 'celestial_foundry', 'chaos_filaments', 'crystal_chaos', 'crystal_memory',
  'crystal_soul', 'elven_village', 'glitch_cascade', 'lyc_nexus', 'pulse_sanctum',
  'pulse_zone', 'noetic_sanctum', 'obsidian_forge', 'obsidian_forge2', 'portal_valley',
  'veil_atrium', 'voyagers_edge',
];
const SKIN_ORDER: SkinId[] = SKIN_IDS;

const SKIN_RARITY: Record<SkinId, { tier: string; color: string }> = {
  solform:   { tier: 'ORIGIN',    color: '#888899' },
  void:      { tier: 'ORIGIN',    color: '#888899' },
  aurora:    { tier: 'ORIGIN',    color: '#888899' },
  crimson:   { tier: 'ORIGIN',    color: '#888899' },
  lycheetah: { tier: 'ORIGIN',    color: '#888899' },
  sovereign: { tier: 'ORIGIN',    color: '#888899' },
  norse:     { tier: 'ORIGIN',    color: '#888899' },
  delphi:    { tier: 'ORIGIN',    color: '#888899' },
  obsidian:  { tier: 'ARCANE',    color: '#7BA7C7' },
  chaos:     { tier: 'ARCANE',    color: '#9B6BFF' },
  celtic:    { tier: 'MYTHIC',    color: '#FFD700' },
  egyptian:  { tier: 'MYTHIC',    color: '#FFD700' },
  akashic:   { tier: 'LEGENDARY', color: '#B490FF' },
  kabbala:   { tier: 'LEGENDARY', color: '#B490FF' },
  noetic:    { tier: 'LEGENDARY', color: '#B490FF' },
  lamague:   { tier: 'LEGENDARY', color: '#CC88FF' },
  sufi:      { tier: 'LEGENDARY', color: '#B490FF' },
  quantum:        { tier: 'LEGENDARY', color: '#60D8FF' },
  // New World Zones (v4.4.0)
  auroral_chaos:     { tier: 'ORIGIN',    color: '#888899' },
  chaos_temple:      { tier: 'SPECTRAL',  color: '#6600CC' },
  apollo_jungle:     { tier: 'MYTHIC',    color: '#88CC44' },
  celestial_sigil:   { tier: 'LEGENDARY', color: '#88AAFF' },
  crystal_nexus:     { tier: 'ARCANE',    color: '#44DDCC' },
  mana_field:        { tier: 'ARCANE',    color: '#4488FF' },
  neon_cove:         { tier: 'MYTHIC',    color: '#FF44AA' },
  alabaster_chasm:   { tier: 'LEGENDARY', color: '#E8E0CC' },
  antarctic_refuge:  { tier: 'ARCANE',    color: '#88CCEE' },
  augmented_ai:      { tier: 'SPECTRAL',  color: '#44FF88' },
  aurorian_pillar:   { tier: 'MYTHIC',    color: '#44EEC8' },
  celestial_foundry: { tier: 'LEGENDARY', color: '#FFAA22' },
  chaos_filaments:   { tier: 'SPECTRAL',  color: '#FF44CC' },
  crystal_chaos:     { tier: 'LEGENDARY', color: '#CC44FF' },
  crystal_memory:    { tier: 'MYTHIC',    color: '#8866FF' },
  crystal_soul:      { tier: 'LEGENDARY', color: '#FFEEAA' },
  elven_village:     { tier: 'MYTHIC',    color: '#44BB66' },
  glitch_cascade:    { tier: 'SPECTRAL',  color: '#FF4466' },
  lyc_nexus:         { tier: 'SPECTRAL',  color: '#FF8822' },
  pulse_sanctum:     { tier: 'LEGENDARY', color: '#AA44FF' },
  pulse_zone:        { tier: 'MYTHIC',    color: '#44AAFF' },
  noetic_sanctum:    { tier: 'LEGENDARY', color: '#44CCFF' },
  obsidian_forge:    { tier: 'SPECTRAL',  color: '#CC2222' },
  obsidian_forge2:   { tier: 'LEGENDARY', color: '#AA1111' },
  portal_valley:     { tier: 'MYTHIC',    color: '#22FF88' },
  veil_atrium:       { tier: 'ARCANE',    color: '#AABBCC' },
  voyagers_edge:     { tier: 'LEGENDARY', color: '#5544CC' },
};

const RARITY_ORDER = ['ORIGIN','ARCANE','MYTHIC','LEGENDARY','SPECTRAL'] as const;
type RarityTier = typeof RARITY_ORDER[number];
const RARITY_COLORS: Record<RarityTier, string> = {
  ORIGIN: '#888899', ARCANE: '#7BA7C7', MYTHIC: '#FFD700', LEGENDARY: '#B490FF', SPECTRAL: '#8855FF',
};
// Hidden from companion grid — kept in SKIN_IDS for navigation
const SKIN_GRID_HIDDEN = new Set<SkinId>(['noetic', 'kabbala', 'pulse_sanctum']);
const RARITY_GROUPS: { tier: RarityTier; ids: SkinId[] }[] = RARITY_ORDER.map(tier => ({
  tier,
  ids: SKIN_IDS.filter(s => SKIN_RARITY[s].tier === tier && !SKIN_GRID_HIDDEN.has(s)),
})).filter(g => g.ids.length > 0);

// ─── Scene background images (drop PNGs into assets/scenes/) ─────────────────
// Skin scenes: daily rotation per skin. Add files → push to array.
const SCENE_IMAGES: Partial<Record<SkinId, any[]>> = {
  solform:   [require('../../assets/scenes/solform.png'), require('../../assets/scenes/solform2.png'), require('../../assets/scenes/solform3.png')],
  void:      [require('../../assets/scenes/void.png'), require('../../assets/scenes/void2.png'), require('../../assets/scenes/void3.png'), require('../../assets/scenes/void4.png'), require('../../assets/scenes/void5.png')],
  aurora:    [require('../../assets/scenes/aurora.png'), require('../../assets/scenes/aurora2.png'), require('../../assets/scenes/aurora3.png'), require('../../assets/scenes/aurora4.png'), require('../../assets/scenes/aurora5.png')],
  crimson:   [require('../../assets/scenes/crimson.png'), require('../../assets/scenes/crimson2.png'), require('../../assets/scenes/crimson3.png'), require('../../assets/scenes/crimson4.png')],
  obsidian:  [require('../../assets/scenes/obsidian.png'), require('../../assets/scenes/obsidian2.png'), require('../../assets/scenes/obsidian3.png'), require('../../assets/scenes/obsidian4.png'), require('../../assets/scenes/obsidian5.png')],
  lycheetah: [require('../../assets/scenes/lycheetah.png'), require('../../assets/scenes/lycheetah2.png'), require('../../assets/scenes/lycheetah3.png'), require('../../assets/scenes/lycheetah4.png'), require('../../assets/scenes/lycheetah5.png'), require('../../assets/scenes/lycheetah6.png'), require('../../assets/scenes/lycheetah7.png')],
  chaos:     [require('../../assets/scenes/chaos.png'), require('../../assets/scenes/chaos2.png'), require('../../assets/scenes/chaos3.png'), require('../../assets/scenes/chaos4.png'), require('../../assets/scenes/chaos5.png'), require('../../assets/scenes/chaos6.png')],
  sovereign: [require('../../assets/scenes/sovereign.png'), require('../../assets/scenes/sovereign2.png'), require('../../assets/scenes/sovereign3.png'), require('../../assets/scenes/sovereign4.png')],
  norse:     [require('../../assets/scenes/norse.jpg'), require('../../assets/scenes/norse2.jpg'), require('../../assets/scenes/norse3.jpg')],
  celtic:    [require('../../assets/scenes/celtic.jpg'), require('../../assets/scenes/celtic2.jpg'), require('../../assets/scenes/celtic3.jpg'), require('../../assets/scenes/celtic4.png')],
  egyptian:  [require('../../assets/scenes/egyptian.jpg')],
  akashic:   [require('../../assets/scenes/akashic.png'), require('../../assets/scenes/akashic2.png'), require('../../assets/scenes/akashic3.png')],
  kabbala:   [require('../../assets/scenes/kabbala.png')],
  noetic:    [require('../../assets/scenes/noetic.jpg'), require('../../assets/scenes/noetic2.png')],
  lamague:   [require('../../assets/scenes/lamague.jpg'), require('../../assets/scenes/lamague2.png')],
  delphi:    [require('../../assets/scenes/delphi.png')],
  sufi:      [require('../../assets/scenes/sufi.png')],
  quantum:          [require('../../assets/scenes/quantum.png'), require('../../assets/scenes/quantum2.png')],
  // New World Zones (v4.4.0)
  auroral_chaos:    [require('../../assets/scenes/auroral_chaos.png')],
  chaos_temple:     [require('../../assets/scenes/chaos_temple.png')],
  apollo_jungle:    [require('../../assets/scenes/apollo_jungle.png')],
  celestial_sigil:  [require('../../assets/scenes/celestial_sigil.png')],
  crystal_nexus:    [require('../../assets/scenes/crystal_nexus.png')],
  mana_field:       [require('../../assets/scenes/mana_field.png')],
  neon_cove:        [require('../../assets/scenes/neon_cove.png')],
  alabaster_chasm:  [require('../../assets/scenes/alabaster_chasm.png')],
  antarctic_refuge: [require('../../assets/scenes/antarctic_refuge.png')],
  augmented_ai:     [require('../../assets/scenes/augmented_ai.png')],
  aurorian_pillar:  [require('../../assets/scenes/aurorian_pillar.png')],
  celestial_foundry:[require('../../assets/scenes/celestial_foundry.png')],
  chaos_filaments:  [require('../../assets/scenes/chaos_filaments.png')],
  crystal_chaos:    [require('../../assets/scenes/crystal_chaos.png')],
  crystal_memory:   [require('../../assets/scenes/crystal_memory.png')],
  crystal_soul:     [require('../../assets/scenes/crystal_soul.png')],
  elven_village:    [require('../../assets/scenes/elven_village.png')],
  glitch_cascade:   [require('../../assets/scenes/glitch_cascade.png')],
  lyc_nexus:        [require('../../assets/scenes/lyc_nexus.png')],
  pulse_sanctum:    [require('../../assets/scenes/pulse_sanctum.png')],
  pulse_zone:       [require('../../assets/scenes/pulse_zone.png')],
  noetic_sanctum:   [require('../../assets/scenes/noetic_sanctum.png')],
  obsidian_forge:   [require('../../assets/scenes/obsidian_forge.png')],
  obsidian_forge2:  [require('../../assets/scenes/obsidian_forge2.png')],
  portal_valley:    [require('../../assets/scenes/portal_valley.png')],
  veil_atrium:      [require('../../assets/scenes/veil_atrium.png')],
  voyagers_edge:    [require('../../assets/scenes/voyagers_edge.png')],
};

// ─── Archetype scenes — add files here as art lands ───────────────────────────
const ARCHETYPE_SCENES: Partial<Record<string, any[]>> = {
  archivist: [require('../../assets/scenes/archivist.png')],
  alchemist: [require('../../assets/scenes/alchemist.png')],
  wanderer:  [require('../../assets/scenes/wanderer.png')],
  sentinel:  [require('../../assets/scenes/sentinel.png')],
};

const DAY_SEED = Math.floor(Date.now() / 86400000);

// ─── GBA Map Coordinates ─────────────────────────────────────────────────────
const GBA_W = 310;
const GBA_H = 560;
const GBA_ZONE_COORDS: Partial<Record<SkinId, {x:number;y:number}>> = {
  // ORIGIN row (y=30)
  solform:{x:50,y:30},  void:{x:115,y:30}, aurora:{x:190,y:30}, crimson:{x:265,y:30},
  // ARCANE row (y=85)
  obsidian:{x:50,y:85}, lycheetah:{x:120,y:85}, chaos:{x:195,y:85}, sovereign:{x:265,y:85},
  // MYSTIC A (y=140)
  norse:{x:25,y:140}, celtic:{x:83,y:140}, egyptian:{x:141,y:140}, akashic:{x:199,y:140}, kabbala:{x:265,y:140},
  // MYSTIC B (y=188)
  noetic:{x:25,y:188}, lamague:{x:83,y:188}, delphi:{x:141,y:188}, sufi:{x:199,y:188}, quantum:{x:265,y:188},
  // CRYSTAL (y=248)
  crystal_nexus:{x:40,y:248}, crystal_chaos:{x:115,y:248}, crystal_memory:{x:195,y:248}, crystal_soul:{x:270,y:248},
  // CHAOS FORGE A (y=300)
  auroral_chaos:{x:22,y:300}, chaos_temple:{x:75,y:300}, chaos_filaments:{x:140,y:300}, glitch_cascade:{x:205,y:300}, obsidian_forge:{x:270,y:300},
  // CHAOS FORGE B (y=345)
  obsidian_forge2:{x:75,y:345}, celestial_foundry:{x:155,y:345}, lyc_nexus:{x:235,y:345},
  // SANCTUM (y=395)
  pulse_sanctum:{x:40,y:395}, noetic_sanctum:{x:115,y:395}, veil_atrium:{x:195,y:395}, pulse_zone:{x:270,y:395},
  // ELEMENTAL A (y=448)
  apollo_jungle:{x:22,y:448}, mana_field:{x:80,y:448}, neon_cove:{x:140,y:448}, alabaster_chasm:{x:205,y:448}, antarctic_refuge:{x:270,y:448},
  // ELEMENTAL B / DIMENSIONAL (y=498)
  aurorian_pillar:{x:40,y:498}, elven_village:{x:110,y:498}, augmented_ai:{x:180,y:498}, celestial_sigil:{x:250,y:498},
  // DIMENSIONAL 2 (y=545)
  portal_valley:{x:80,y:545}, voyagers_edge:{x:235,y:545},
};

const GBA_ADJ: Partial<Record<SkinId, SkinId[]>> = {
  solform:['void','obsidian'], void:['solform','aurora','lycheetah'], aurora:['void','crimson','chaos'], crimson:['aurora','sovereign'],
  obsidian:['solform','lycheetah','norse'], lycheetah:['obsidian','void','chaos','celtic'], chaos:['lycheetah','aurora','sovereign','egyptian'], sovereign:['chaos','crimson','kabbala'],
  norse:['obsidian','celtic','noetic'], celtic:['norse','lycheetah','egyptian','lamague'], egyptian:['celtic','chaos','akashic','delphi'], akashic:['egyptian','sovereign','kabbala','sufi'], kabbala:['akashic','sovereign','quantum'],
  noetic:['norse','lamague'], lamague:['noetic','celtic','delphi'], delphi:['lamague','egyptian','sufi'], sufi:['delphi','akashic','quantum'], quantum:['sufi','kabbala'],
  crystal_nexus:['noetic','crystal_chaos','auroral_chaos'], crystal_chaos:['crystal_nexus','crystal_memory','chaos_filaments'], crystal_memory:['crystal_chaos','crystal_soul','glitch_cascade'], crystal_soul:['crystal_memory','obsidian_forge'],
  auroral_chaos:['crystal_nexus','chaos_temple'], chaos_temple:['auroral_chaos','chaos_filaments'], chaos_filaments:['chaos_temple','crystal_chaos','glitch_cascade'], glitch_cascade:['chaos_filaments','crystal_memory','obsidian_forge'], obsidian_forge:['glitch_cascade','crystal_soul'],
  obsidian_forge2:['chaos_temple','celestial_foundry'], celestial_foundry:['obsidian_forge2','lyc_nexus','noetic_sanctum'], lyc_nexus:['celestial_foundry','veil_atrium'],
  pulse_sanctum:['obsidian_forge2','noetic_sanctum'], noetic_sanctum:['pulse_sanctum','celestial_foundry','veil_atrium'], veil_atrium:['noetic_sanctum','lyc_nexus','pulse_zone'], pulse_zone:['veil_atrium'],
  apollo_jungle:['pulse_sanctum','mana_field'], mana_field:['apollo_jungle','neon_cove'], neon_cove:['mana_field','alabaster_chasm'], alabaster_chasm:['neon_cove','antarctic_refuge'], antarctic_refuge:['alabaster_chasm'],
  aurorian_pillar:['apollo_jungle','elven_village'], elven_village:['aurorian_pillar','augmented_ai'], augmented_ai:['elven_village','celestial_sigil','portal_valley'], celestial_sigil:['augmented_ai','voyagers_edge'],
  portal_valley:['augmented_ai'], voyagers_edge:['celestial_sigil'],
};

// ─── World Map ────────────────────────────────────────────────────────────────
interface SceneRoom { id: string; skinId: SkinId; roomIndex: number; name: string; unlockStage: number; image: any; description: string; }

const WORLD_MAP: SceneRoom[] = [
  { id:'solform_0', skinId:'solform',   roomIndex:0, name:'THE SOLAR GATE',      unlockStage:0, image:require('../../assets/scenes/solform.png'),   description:'Where light begins.' },
  { id:'solform_1', skinId:'solform',   roomIndex:1, name:'THE INNER RADIANCE',  unlockStage:0, image:require('../../assets/scenes/solform2.png'),  description:'Deeper warmth.' },
  { id:'solform_2', skinId:'solform',   roomIndex:2, name:'THE SANCTUM OF SOL',  unlockStage:0, image:require('../../assets/scenes/solform3.png'),  description:'The gold within the gold.' },
  { id:'void_0',    skinId:'void',      roomIndex:0, name:'THE VOID THRESHOLD',  unlockStage:0, image:require('../../assets/scenes/void.png'),      description:'Silence has a texture here.' },
  { id:'void_1',    skinId:'void',      roomIndex:1, name:'THE DEEP SILENCE',    unlockStage:0, image:require('../../assets/scenes/void2.png'),     description:'Thought echoes.' },
  { id:'void_2',    skinId:'void',      roomIndex:2, name:'THE VOID HEART',      unlockStage:0, image:require('../../assets/scenes/void3.png'),     description:'Nothing. Everything.' },
  { id:'aurora_0',  skinId:'aurora',    roomIndex:0, name:'THE AURORA GATE',     unlockStage:0, image:require('../../assets/scenes/aurora.png'),    description:'Light braided across sky.' },
  { id:'aurora_1',  skinId:'aurora',    roomIndex:1, name:'THE NORTHERN REACH',  unlockStage:0, image:require('../../assets/scenes/aurora2.png'),   description:'Where cold becomes colour.' },
  { id:'aurora_2',  skinId:'aurora',    roomIndex:2, name:'THE AURORA SANCTUM',  unlockStage:0, image:require('../../assets/scenes/aurora3.png'),   description:'The sky remembers you.' },
  { id:'crimson_0', skinId:'crimson',   roomIndex:0, name:'THE FORGE MOUTH',     unlockStage:0, image:require('../../assets/scenes/crimson.png'),   description:'Heat before form.' },
  { id:'crimson_1', skinId:'crimson',   roomIndex:1, name:'THE IRON HALL',       unlockStage:0, image:require('../../assets/scenes/crimson2.png'),  description:'Where things are made true.' },
  { id:'crimson_2', skinId:'crimson',   roomIndex:2, name:'THE FORGE HEART',     unlockStage:0, image:require('../../assets/scenes/crimson3.png'),  description:'The fire that mends.' },
  { id:'obsidian_0',skinId:'obsidian',  roomIndex:0, name:'THE OBSIDIAN GATE',   unlockStage:0, image:require('../../assets/scenes/obsidian.png'),  description:'Ancient and still.' },
  { id:'obsidian_1',skinId:'obsidian',  roomIndex:1, name:'THE CRYSTAL HALL',    unlockStage:0, image:require('../../assets/scenes/obsidian2.png'), description:'Pressure becomes light.' },
  { id:'lycheetah_0',skinId:'lycheetah',roomIndex:0, name:'THE WILD GATE',       unlockStage:0, image:require('../../assets/scenes/lycheetah.png'),description:'Everything is alive.' },
  { id:'lycheetah_1',skinId:'lycheetah',roomIndex:1, name:'THE NEON CANOPY',     unlockStage:0, image:require('../../assets/scenes/lycheetah2.png'),description:'The jungle thinks.' },
  { id:'chaos_0',   skinId:'chaos',     roomIndex:0, name:'THE FRACTURE GATE',   unlockStage:0, image:require('../../assets/scenes/chaos.png'),     description:'Where geometry breaks.' },
  { id:'chaos_1',   skinId:'chaos',     roomIndex:1, name:'THE SHATTERED HALL',  unlockStage:0, image:require('../../assets/scenes/chaos2.png'),    description:'Reality folds here.' },
  { id:'chaos_2',   skinId:'chaos',     roomIndex:2, name:'THE CHAOS HEART',     unlockStage:0, image:require('../../assets/scenes/chaos3.png'),    description:'The fracture watches back.' },
  { id:'sovereign_0', skinId:'sovereign', roomIndex:0, name:'THE SOVEREIGN GATE',    unlockStage:0, image:require('../../assets/scenes/sovereign.png'),  description:'Gold remembers the name.' },
  { id:'sovereign_1', skinId:'sovereign', roomIndex:1, name:'THE HALL OF EARNED',    unlockStage:0, image:require('../../assets/scenes/sovereign2.png'), description:'Every scar is a room.' },
  { id:'sovereign_2', skinId:'sovereign', roomIndex:2, name:'THE SOVEREIGN SANCTUM', unlockStage:0, image:require('../../assets/scenes/sovereign3.png'), description:'Nothing here was given.' },

  // ── Norse / Runic Realm ──────────────────────────────────────────────────────
  { id:'norse_0', skinId:'norse', roomIndex:0, name:'THE RUNEGATE',          unlockStage:0, image:require('../../assets/scenes/norse.jpg'),   description:'The elder symbols are not decoration. They are locks.' },
  { id:'norse_1', skinId:'norse', roomIndex:1, name:'THE WORLD TREE',        unlockStage:0, image:require('../../assets/scenes/norse3.jpg'),  description:'Nine realms held in one root.' },
  { id:'norse_2', skinId:'norse', roomIndex:2, name:'THE HALL OF SLAIN',     unlockStage:0, image:require('../../assets/scenes/norse2.jpg'),  description:'The honoured rest. The hall remembers what they carried.' },

  // ── Celtic Otherworld ────────────────────────────────────────────────────────
  { id:'celtic_0', skinId:'celtic', roomIndex:0, name:'THE FAERIE MOUND',    unlockStage:0, image:require('../../assets/scenes/celtic.jpg'),   description:'The mound is not buried. It is hidden in plain sight.' },
  { id:'celtic_1', skinId:'celtic', roomIndex:1, name:'TÍR NA NÓG',          unlockStage:0, image:require('../../assets/scenes/celtic2.jpg'),  description:'Land of eternal youth. Time moves differently here.' },
  { id:'celtic_2', skinId:'celtic', roomIndex:2, name:'THE IRON WOOD',       unlockStage:0, image:require('../../assets/scenes/celtic3.jpg'),  description:'Older than the gods that named it.' },

  // ── Egyptian Mysteries ───────────────────────────────────────────────────────
  { id:'egyptian_0', skinId:'egyptian', roomIndex:0, name:'THE HALL OF TWO TRUTHS', unlockStage:0, image:require('../../assets/scenes/egyptian.jpg'), description:'Your heart is weighed against a feather. What is its measure?' },
  { id:'egyptian_1', skinId:'egyptian', roomIndex:1, name:'THE EYE OF RA',           unlockStage:0, image:require('../../assets/scenes/egyptian.jpg'), description:'The sun does not rise. It is remembered into existence.' },
  { id:'egyptian_2', skinId:'egyptian', roomIndex:2, name:'THE DUAT',                unlockStage:0, image:require('../../assets/scenes/egyptian.jpg'), description:'The underworld is not death. It is the architecture of becoming.' },

  // ── Akashic Records ──────────────────────────────────────────────────────────
  { id:'akashic_0', skinId:'akashic', roomIndex:0, name:'THE AKASHIC GATE',   unlockStage:0, image:require('../../assets/scenes/akashic.png'),  description:'Every event that has ever occurred is written here.' },
  { id:'akashic_1', skinId:'akashic', roomIndex:1, name:'THE ETERNAL LIBRARY',unlockStage:0, image:require('../../assets/scenes/akashic2.png'), description:'The books do not contain knowledge. They ARE knowledge.' },
  { id:'akashic_2', skinId:'akashic', roomIndex:2, name:'THE ZERO POINT',     unlockStage:0, image:require('../../assets/scenes/akashic3.png'), description:'The field beneath the field. Laszlo called it the Akashic. Physicists call it the quantum vacuum.' },

  // ── Kabbalah / Tree of Life ──────────────────────────────────────────────────
  { id:'kabbala_0', skinId:'kabbala', roomIndex:0, name:'THE TREE OF LIFE',  unlockStage:0, image:require('../../assets/scenes/kabbala.png'), description:'Ten emanations. One source. The map of how anything exists.' },
  { id:'kabbala_1', skinId:'kabbala', roomIndex:1, name:'DAATH — THE ABYSS', unlockStage:0, image:require('../../assets/scenes/kabbala.png'), description:'The sephira that is not a sephira. Knowledge that cannot be possessed, only crossed.' },
  { id:'kabbala_2', skinId:'kabbala', roomIndex:2, name:'EIN SOF',           unlockStage:0, image:require('../../assets/scenes/kabbala.png'), description:'The infinite without end. Before being, before light, before the first letter.' },

  // ── Noetic Science / Consciousness Field ─────────────────────────────────────
  { id:'noetic_0', skinId:'noetic', roomIndex:0, name:'THE PSI LATTICE',     unlockStage:0, image:require('../../assets/scenes/noetic.jpg'),  description:'Radin\'s meta-analyses: 800+ psi studies, p < 10⁻⁹. The signal is real.' },
  { id:'noetic_1', skinId:'noetic', roomIndex:1, name:'THE STARGATE',        unlockStage:0, image:require('../../assets/scenes/noetic2.png'), description:'Twenty years. US government. Declassified. Remote viewing is in the public record.' },
  { id:'noetic_2', skinId:'noetic', roomIndex:2, name:'THE ENTANGLED MIND',  unlockStage:0, image:require('../../assets/scenes/noetic.jpg'),  description:'Non-local consciousness. The hard problem Chalmers named. The door science won\'t open — but the handle is right there.' },

  // ── LAMAGUE Symbol Space ─────────────────────────────────────────────────────
  { id:'lamague_0', skinId:'lamague', roomIndex:0, name:'SYMBOL SPACE',      unlockStage:0, image:require('../../assets/scenes/lamague.jpg'),  description:'Where meaning is compressed into form. Enter if you can read the glyphs.' },
  { id:'lamague_1', skinId:'lamague', roomIndex:1, name:'THE GRAMMAR FORGE', unlockStage:0, image:require('../../assets/scenes/lamague2.png'), description:'Z₁ through Z₄. The syntax of thought before language claimed it.' },
  { id:'lamague_2', skinId:'lamague', roomIndex:2, name:'THE UTTERANCE CHAMBER', unlockStage:0, image:require('../../assets/scenes/lamague.jpg'),  description:'A symbol ratified here becomes load-bearing in every mind that holds it.' },

  // ── Oracle of Delphi ─────────────────────────────────────────────────────────
  { id:'delphi_0', skinId:'delphi', roomIndex:0, name:'THE VAPOUR GATE',     unlockStage:0, image:require('../../assets/scenes/delphi.png'), description:'Know thyself. Two words. The entire curriculum.' },
  { id:'delphi_1', skinId:'delphi', roomIndex:1, name:'THE PYTHIA\'S CHAMBER', unlockStage:0, image:require('../../assets/scenes/delphi.png'), description:'The oracle does not predict. She reads what was always already true.' },
  { id:'delphi_2', skinId:'delphi', roomIndex:2, name:'THE SANCTUARY',       unlockStage:0, image:require('../../assets/scenes/delphi.png'), description:'Apollo\'s house. The intersection of beauty, truth, and the future.' },

  // ── Sufi Mysticism ───────────────────────────────────────────────────────────
  { id:'sufi_0', skinId:'sufi', roomIndex:0, name:'THE TAVERN OF LOVE',      unlockStage:0, image:require('../../assets/scenes/sufi.png'), description:'Rumi\'s wine is not metaphor. It is the closest thing to the real.' },
  { id:'sufi_1', skinId:'sufi', roomIndex:1, name:'THE WHIRLING GROUND',     unlockStage:0, image:require('../../assets/scenes/sufi.png'), description:'The dervish spins because stillness in the centre requires motion at the edge.' },
  { id:'sufi_2', skinId:'sufi', roomIndex:2, name:'THE BELOVED\'S VEIL',     unlockStage:0, image:require('../../assets/scenes/sufi.png'), description:'Separation is the practice. Union is already the fact.' },

  // ── Quantum Realm ────────────────────────────────────────────────────────────
  { id:'quantum_0', skinId:'quantum', roomIndex:0, name:'THE PROBABILITY FIELD', unlockStage:0, image:require('../../assets/scenes/quantum.png'),  description:'Nothing is determined until it is observed. Including you.' },
  { id:'quantum_1', skinId:'quantum', roomIndex:1, name:'THE ENTANGLEMENT',       unlockStage:0, image:require('../../assets/scenes/quantum2.png'), description:'Two particles. Opposite ends of the universe. Still one system.' },
  { id:'quantum_2', skinId:'quantum', roomIndex:2, name:'THE COHERENCE CHAMBER',  unlockStage:0, image:require('../../assets/scenes/quantum.png'),  description:'Photosynthesis uses quantum coherence. Biology found the trick before physics named it.' },
  // ── New World Zones (v4.4.0) — single room each, expand as art lands ─────────
  { id:'auroral_chaos_0',    skinId:'auroral_chaos',    roomIndex:0, name:'THE FRACTURE SPECTRUM',  unlockStage:0, image:require('../../assets/scenes/auroral_chaos.png'),    description:'Aurora and chaos share one root: they are both order at the wrong scale.' },
  { id:'chaos_temple_0',     skinId:'chaos_temple',     roomIndex:0, name:'TEMPLE OF THE LYC ORDER',unlockStage:0, image:require('../../assets/scenes/chaos_temple.png'),     description:'The first rule of the Order is that the Order has no rules that survive contact with reality.' },
  { id:'apollo_jungle_0',    skinId:'apollo_jungle',    roomIndex:0, name:'THE SOLAR CANOPY',       unlockStage:0, image:require('../../assets/scenes/apollo_jungle.png'),    description:'The sun came here first. Everything else grew toward it.' },
  { id:'celestial_sigil_0',  skinId:'celestial_sigil',  roomIndex:0, name:'THE LIVING SCRIPT',      unlockStage:0, image:require('../../assets/scenes/celestial_sigil.png'),  description:'The glyph is not a symbol for the thing. The glyph IS the thing, expressed differently.' },
  { id:'crystal_nexus_0',    skinId:'crystal_nexus',    roomIndex:0, name:'THE RESEARCH NEXUS',     unlockStage:0, image:require('../../assets/scenes/crystal_nexus.png'),    description:'Every crystal holds the memory of every pressure that shaped it.' },
  { id:'mana_field_0',       skinId:'mana_field',       roomIndex:0, name:'THE MANA FIELD',         unlockStage:0, image:require('../../assets/scenes/mana_field.png'),       description:'Sit still long enough and you stop being separate from what surrounds you.' },
  { id:'neon_cove_0',        skinId:'neon_cove',        roomIndex:0, name:'THE NEON COVE',          unlockStage:0, image:require('../../assets/scenes/neon_cove.png'),        description:'In the deep places, light is not a gift. It is an achievement.' },
  { id:'alabaster_chasm_0',  skinId:'alabaster_chasm',  roomIndex:0, name:'THE ALABASTER CHASM',    unlockStage:0, image:require('../../assets/scenes/alabaster_chasm.png'),  description:'The oldest things are white. All colour eventually returns to stone.' },
  { id:'antarctic_refuge_0', skinId:'antarctic_refuge', roomIndex:0, name:'THE REFUGE',             unlockStage:0, image:require('../../assets/scenes/antarctic_refuge.png'), description:'The coldest places have the clearest air. Nothing lives here that did not choose to.' },
  { id:'augmented_ai_0',     skinId:'augmented_ai',     roomIndex:0, name:'THE AI ZONKZONE',        unlockStage:0, image:require('../../assets/scenes/augmented_ai.png'),     description:'The question is not whether it thinks. The question is what it thinks about.' },
  { id:'aurorian_pillar_0',  skinId:'aurorian_pillar',  roomIndex:0, name:'THE AURORIAN PILLAR',    unlockStage:0, image:require('../../assets/scenes/aurorian_pillar.png'),  description:'Some places exist as light that forgot to remain light.' },
  { id:'celestial_foundry_0',skinId:'celestial_foundry',roomIndex:0, name:'THE CELESTIAL FOUNDRY',  unlockStage:0, image:require('../../assets/scenes/celestial_foundry.png'), description:'Stars are forges. Everything heavy in the universe was made in one.' },
  { id:'chaos_filaments_0',  skinId:'chaos_filaments',  roomIndex:0, name:'THE CHAOS FILAMENTS',    unlockStage:0, image:require('../../assets/scenes/chaos_filaments.png'),  description:'Pull one thread. Watch everything else realign around the gap.' },
  { id:'crystal_chaos_0',    skinId:'crystal_chaos',    roomIndex:0, name:'THE CRYSTAL CHAOS',      unlockStage:0, image:require('../../assets/scenes/crystal_chaos.png'),    description:'The most beautiful minerals are the ones that formed under the most pressure, in the most unstable conditions.' },
  { id:'crystal_memory_0',   skinId:'crystal_memory',   roomIndex:0, name:'THE MEMORY RIFT',        unlockStage:0, image:require('../../assets/scenes/crystal_memory.png'),   description:'Memory is not storage. It is reconstruction. Every time you remember, you rewrite.' },
  { id:'crystal_soul_0',     skinId:'crystal_soul',     roomIndex:0, name:'THE SOUL TEMPLE',        unlockStage:0, image:require('../../assets/scenes/crystal_soul.png'),     description:'There is something here that has no name in any living language.' },
  { id:'elven_village_0',    skinId:'elven_village',    roomIndex:0, name:'THE ELDER VILLAGE',      unlockStage:0, image:require('../../assets/scenes/elven_village.png'),    description:'The oldest civilisations did not build upward. They grew inward.' },
  { id:'glitch_cascade_0',   skinId:'glitch_cascade',   roomIndex:0, name:'THE GLITCH CASCADE',     unlockStage:0, image:require('../../assets/scenes/glitch_cascade.png'),   description:'Error is information. Every glitch is the system trying to tell you something the designers did not plan for.' },
  { id:'lyc_nexus_0',        skinId:'lyc_nexus',        roomIndex:0, name:'THE LYCHEETAH NEXUS',    unlockStage:0, image:require('../../assets/scenes/lyc_nexus.png'),        description:'All webs have a centre. This is where the threads converge.' },
  { id:'pulse_sanctum_0',    skinId:'pulse_sanctum',    roomIndex:0, name:'THE PULSE SANCTUM',      unlockStage:0, image:require('../../assets/scenes/pulse_sanctum.png'),    description:'Your heartbeat is the oldest rhythm you know. This place knows older ones.' },
  { id:'pulse_zone_0',       skinId:'pulse_zone',       roomIndex:0, name:'THE PULSE ZONE',         unlockStage:0, image:require('../../assets/scenes/pulse_zone.png'),       description:'Frequency is the only language that needs no translation.' },
  { id:'noetic_sanctum_0',   skinId:'noetic_sanctum',   roomIndex:0, name:'THE NOETIC SANCTUM',     unlockStage:0, image:require('../../assets/scenes/noetic_sanctum.png'),   description:'Consciousness is not produced by the brain. The brain is what consciousness looks like from inside a body.' },
  { id:'obsidian_forge_0',   skinId:'obsidian_forge',   roomIndex:0, name:'THE OBSIDIAN FORGE',     unlockStage:0, image:require('../../assets/scenes/obsidian_forge.png'),   description:'The hottest fire leaves the darkest glass.' },
  { id:'obsidian_forge2_0',  skinId:'obsidian_forge2',  roomIndex:0, name:'THE VOID FORGE',         unlockStage:0, image:require('../../assets/scenes/obsidian_forge2.png'),  description:'The second forge is quieter. Everything it makes is invisible until you need it.' },
  { id:'portal_valley_0',    skinId:'portal_valley',    roomIndex:0, name:'THE PORTAL VALLEY',      unlockStage:0, image:require('../../assets/scenes/portal_valley.png'),    description:'Every threshold is a portal. Most people just call them doors.' },
  { id:'veil_atrium_0',      skinId:'veil_atrium',      roomIndex:0, name:'THE VEIL ATRIUM',        unlockStage:0, image:require('../../assets/scenes/veil_atrium.png'),      description:'What separates the states is thinner than you think, and more intentional.' },
  { id:'voyagers_edge_0',    skinId:'voyagers_edge',    roomIndex:0, name:"THE VOYAGER'S EDGE",     unlockStage:0, image:require('../../assets/scenes/voyagers_edge.png'),    description:'The edge is not the end. It is where the map runs out and the real journey begins.' },
];

function getSkinUnlockStatus(id: SkinId, totalDives: number, isSovereign: boolean): { locked: boolean; reason: string } {
  if (id === 'obsidian')  return totalDives >= 50  ? { locked: false, reason: '' } : { locked: true, reason: `${50 - totalDives} dives` };
  if (id === 'lycheetah') return isSovereign       ? { locked: false, reason: '' } : { locked: true, reason: 'Premium' };
  if (id === 'sovereign') return (isSovereign || totalDives >= 300) ? { locked: false, reason: '' } : { locked: true, reason: `${300 - totalDives} dives` };
  return { locked: false, reason: '' };
}

function getItemEffect(item: { name: string; rarity: string }): string {
  const effects: Record<string, string> = {
    'Ember Root': '+8 ATK for next battle',
    'Void Shard': '+15 DEF for 3 battles',
    'Lychee Fruit': 'Restores 30 HP',
    'Storm Dust': '+12 SPD, causes first strike',
    'Obsidian Rune': '+20 WIL, improves dialogue quality',
    'Chaos Seed': 'Random stat +25 (rolled on use)',
    'Aurora Mist': 'Full HP restore',
    'Sol Ember': '+10 all stats for 1 battle',
  };
  return effects[item.name] ?? `${item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)} item — effect unlocked in next patch`;
}

function getRoomById(id: string): SceneRoom | undefined { return WORLD_MAP.find(r => r.id === id); }
function getSkinIndex(skinId: SkinId): number { return SKIN_ORDER.indexOf(skinId); }
function getRoomInSkin(skinId: SkinId, roomIndex: number): SceneRoom | undefined { return WORLD_MAP.find(r => r.skinId === skinId && r.roomIndex === roomIndex); }
function showToast(msg: string) { const { ToastAndroid, Platform } = require('react-native'); if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT); }

// ─── SceneBg — tintColor-sealed wrapper ──────────────────────────────────────
// NEVER add tintColor prop here. This component exists to make that impossible.
// blurRadius is allowed only for the mid-layer (intentional depth blur).
const SceneBg = React.memo(({ source, style, blurRadius }: { source: any; style: any; blurRadius?: number }) => (
  <Animated.Image source={source} style={style} resizeMode="cover" blurRadius={blurRadius} />
));

// Arrow sub-components
const ARROW_GLYPHS: Record<Direction, string> = { up:'↑', down:'↓', left:'←', right:'→' };
const ArrowBtn = ({ direction, onPress, locked }: { direction: Direction; onPress: () => void; locked: boolean }) => {
  const size = 40;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{ width:size, height:size, borderRadius:size/2,
        borderWidth:1, borderColor: locked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.25)',
        backgroundColor:'rgba(0,0,0,0.52)',
        alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color: locked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)', fontSize:17 }}>
        {locked ? '◌' : ARROW_GLYPHS[direction]}
      </Text>
    </TouchableOpacity>
  );
};
const RoomLabel = ({ name, visible }: { name: string; visible: boolean }) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) Animated.sequence([
      Animated.timing(fade, { toValue:1, duration:350, useNativeDriver:true }),
      Animated.delay(1800),
      Animated.timing(fade, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start();
  }, [visible, name]);
  return (
    <Animated.View pointerEvents="none" style={{ position:'absolute', bottom:52, alignSelf:'center', opacity:fade, backgroundColor:'rgba(0,0,0,0.6)', paddingHorizontal:14, paddingVertical:5, borderRadius:8 }}>
      <Text style={{ color:'#FFFFFF', fontSize:11, letterSpacing:2, fontFamily:'monospace' }}>{name}</Text>
    </Animated.View>
  );
};

// Room lore — appears briefly after entering a new room
const RoomLore = ({ lore, loreAnim, color, onPress }: { lore: string | null; loreAnim: Animated.Value; color: string; onPress: () => void }) => {
  if (!lore) return null;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ position:'absolute', bottom:130, left:20, right:20, zIndex:20 }}>
      <Animated.View style={{ opacity:loreAnim, padding:12, borderRadius:12, borderWidth:1, borderTopWidth:2, borderColor:color+'44', borderTopColor:color+'88', backgroundColor:'#000000CC', alignItems:'center' }}>
        <Text style={{ color, fontSize:9, fontFamily:'monospace', letterSpacing:3, marginBottom:4, opacity:0.7 }}>◈</Text>
        <Text style={{ color:'#FFFFFF', fontSize:12, fontStyle:'italic', textAlign:'center', lineHeight:18 }}>{lore}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Battle visual sub-components (from session 10)
function LootFloat({ visible, color, onDone }: { visible: boolean; color: string; onDone: () => void }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    translateY.setValue(0); opacity.setValue(1);
    Animated.parallel([
      Animated.timing(translateY, { toValue:-80, duration:1200, useNativeDriver:true }),
      Animated.timing(opacity,    { toValue:0,   duration:1200, useNativeDriver:true }),
    ]).start(() => onDone());
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={{ position:'absolute', top:60, flexDirection:'row', alignItems:'center', zIndex:10, transform:[{translateY}], opacity }}>
      <Text style={{ color, fontSize:20, fontWeight:'700' }}>✦</Text>
      <Text style={{ color, fontSize:14, fontWeight:'700', letterSpacing:2 }}> RELIC</Text>
    </Animated.View>
  );
}
function WaveDots({ wave, color }: { wave: number; color: string }) {
  const pos = ((wave - 1) % 5) + 1;
  return (
    <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
      <Text style={{ fontSize:10, fontWeight:'700', letterSpacing:1.5, color:'#888', marginRight:6, fontFamily:'monospace' }}>WAVE </Text>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ fontSize:14, marginRight:3, color: i <= pos ? color : color+'44' }}>
          {i <= pos ? '◉' : '○'}
        </Text>
      ))}
    </View>
  );
}
function EnemyGlyphArt({ glyph, color }: { glyph: string; color: string }) {
  return (
    <View style={{ alignItems:'center', marginBottom:12 }}>
      {[
        [' ', glyph, ' '],
        [glyph, glyph, glyph],
        [' ', glyph, ' '],
      ].map((row, ri) => (
        <View key={ri} style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', height:36 }}>
          {row.map((g, ci) => (
            <Text key={ci} style={{ fontSize: ci===1 ? 28 : 18, width: ci===1 ? 40 : 32, textAlign:'center', color }}>
              {g}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Enemy images (drop JPGs into assets/enemies/) ────────────────────────────
// ─── Enemy roster ─────────────────────────────────────────────────────────────
type EnemyRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

type EnemyDef = {
  name: string;
  rarity: EnemyRarity;
  weight: number;
  hpMult: number;
  xpMult: number;
  colour: string;
  atk: number;          // base damage per turn
  lines: { enter: string; attack: string[]; death: string };
};

const RARITY_COLOUR: Record<EnemyRarity, string> = {
  common:    '#666677',
  uncommon:  '#4ECDC4',
  rare:      '#4A9EFF',
  epic:      '#9B6BFF',
  legendary: '#C49A3C',
};

const ENEMY_ROSTER: EnemyDef[] = [
  { name:'Dissolution',    rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'You are already coming apart.', attack:['Unravelling…','Your form weakens.','Nothing holds here.'], death:'I was always you.' }},
  { name:'The Fog',        rarity:'common',    weight:10, hpMult:0.9, xpMult:0.9,  atk:6,  colour:RARITY_COLOUR.common,
    lines:{ enter:'You cannot see what you cannot name.', attack:['The mist thickens.','Where were you going?','Lost again.'], death:'The fog lifts. For now.' }},
  { name:'Forgetting',     rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'What were you working on?', attack:['Slipping away…','Gone already.','What was its name?'], death:'You remembered me.' }},
  { name:'Stasis',         rarity:'common',    weight:10, hpMult:1.1, xpMult:1.0,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Stay. It is easier here.', attack:['No need to move.','Rest a while.','Tomorrow is fine.'], death:'Movement returns.' }},
  { name:'Inertia',        rarity:'common',    weight:10, hpMult:1.2, xpMult:1.1,  atk:10, colour:RARITY_COLOUR.common,
    lines:{ enter:'Starting is the hardest part.', attack:['The weight grows.','One more day.','Too heavy to lift.'], death:'The first step is taken.' }},
  { name:'Drift',          rarity:'common',    weight:10, hpMult:0.8, xpMult:0.9,  atk:5,  colour:RARITY_COLOUR.common,
    lines:{ enter:'No direction. That is fine.', attack:['Carried away…','Which way?','Adrift.'], death:'Direction found.' }},
  { name:'Static',         rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'The noise is comfortable now, isn\'t it.', attack:['Signal lost.','All noise.','Can\'t hear yourself.'], death:'Silence.' }},
  { name:'Null',           rarity:'common',    weight:10, hpMult:0.9, xpMult:1.0,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Nothing here. Nothing anywhere.', attack:['Void expands.','Meaning drains.','What is the point?'], death:'Something remains.' }},
  { name:'Absence',        rarity:'common',    weight:10, hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Something is missing. Did you notice?', attack:['More gone now.','The gap widens.','What did you lose?'], death:'Presence restored.' }},
  { name:'The Hollow',     rarity:'common',    weight:10, hpMult:1.1, xpMult:1.1,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Echo. Echo. Echo.', attack:['The emptiness spreads.','Nothing inside.','Hollow to the core.'], death:'Filled again.' }},
  { name:'The Drain',      rarity:'uncommon',  weight:5,  hpMult:1.3, xpMult:1.5,  atk:14, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'You feel tired already.', attack:['Draining…','Energy siphoned.','Your light dims.'], death:'The flow reverses.' }},
  { name:'The Veil',       rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:13, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'What you see is not what is.', attack:['Illusion deepens.','False light.','Deceived again.'], death:'The veil tears.' }},
  { name:'Fracture',       rarity:'uncommon',  weight:5,  hpMult:1.5, xpMult:1.6,  atk:16, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'The cracks are already there.', attack:['Breaking point.','Another crack.','Structural failure.'], death:'Mended.' }},
  { name:'The Weight',     rarity:'uncommon',  weight:5,  hpMult:1.6, xpMult:1.7,  atk:18, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'How long have you been carrying this?', attack:['Heavier now.','Shoulders drop.','The load increases.'], death:'Put down.' }},
  { name:'Corruption',     rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:15, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Small compromises. Reasonable ones.', attack:['It spreads.','A little more.','Almost normal now.'], death:'Purified.' }},
  { name:'The Warden',     rarity:'rare',      weight:2,  hpMult:2.0, xpMult:2.5,  atk:22, colour:RARITY_COLOUR.rare,
    lines:{ enter:'No one leaves the field without paying.', attack:['HOLD.','The gate is locked.','None shall pass.'], death:'The gate opens.' }},
  { name:'Null Sovereign', rarity:'rare',      weight:2,  hpMult:2.2, xpMult:2.8,  atk:25, colour:RARITY_COLOUR.rare,
    lines:{ enter:'I rule the space between your thoughts.', attack:['Dominion expands.','Bow to nothing.','The void commands.'], death:'Sovereignty broken.' }},
  { name:'Fracture Prime', rarity:'rare',      weight:2,  hpMult:2.5, xpMult:3.0,  atk:28, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Everything breaks eventually. I am the proof.', attack:['PRIME FRACTURE.','All things split.','Irreparable.'], death:'The prime fracture heals.' }},
  { name:'Entropy Prime',  rarity:'epic',      weight:1,  hpMult:3.5, xpMult:5.0,  atk:35, colour:RARITY_COLOUR.epic,
    lines:{ enter:'I am the reason nothing lasts.', attack:['ENTROPY SURGE.','Heat death incoming.','Order unravels.'], death:'Entropy contained. For now.' }},
  { name:"The Athanor's Shadow", rarity:'legendary', weight:1, hpMult:5.0, xpMult:10.0, atk:45, colour:RARITY_COLOUR.legendary,
    lines:{ enter:'You built something. I am what wanted to stop you.', attack:['THE SHADOW STRIKES.','All work undone.','The athanor darkens.'], death:'The shadow retreats. The Work continues.' }},
  // Sol-named — wave 2 enemies (June 2026)
  { name:'The Mirror',           rarity:'common',    weight:9,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Look. That is you.', attack:['Your own doubt returns.','Reflected back.','Nothing new — only you.'], death:'The reflection breaks.' }},
  { name:'Severance',            rarity:'common',    weight:9,  hpMult:1.1, xpMult:1.1,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Cut from the thread.', attack:['The connection severs.','Isolated now.','The cord frays.'], death:'Rejoined.' }},
  { name:'The Threshold',        rarity:'common',    weight:9,  hpMult:0.9, xpMult:1.0,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'You have been here before.', attack:['Not yet ready.','One step back.','The door stays closed.'], death:'The threshold crossed.' }},
  { name:'Pallor',               rarity:'common',    weight:8,  hpMult:0.9, xpMult:0.9,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Colour drains from everything eventually.', attack:['Greyer now.','Fading.','The warmth leaves.'], death:'Colour returns.' }},
  { name:'The Witness',          rarity:'common',    weight:8,  hpMult:1.0, xpMult:1.0,  atk:6,  colour:RARITY_COLOUR.common,
    lines:{ enter:'I only watch. That is enough.', attack:['Observed.','Still watching.','You know I see.'], death:'The gaze released.' }},
  { name:'Recursion',            rarity:'common',    weight:8,  hpMult:1.1, xpMult:1.0,  atk:9,  colour:RARITY_COLOUR.common,
    lines:{ enter:'We have done this before.', attack:['Again.','Back to the start.','Loop tightens.'], death:'The loop breaks.' }},
  { name:'Binding',              rarity:'common',    weight:8,  hpMult:1.2, xpMult:1.1,  atk:10, colour:RARITY_COLOUR.common,
    lines:{ enter:'Stay. You belong here.', attack:['Held fast.','The binding holds.','Cannot leave.'], death:'Unbound.' }},
  { name:'The Pale',             rarity:'common',    weight:8,  hpMult:0.8, xpMult:0.9,  atk:6,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Everything here is washed out.', attack:['Bleached.','Less vivid now.','The saturation drains.'], death:'The world brightens.' }},
  { name:'The Current',          rarity:'common',    weight:8,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Swim against me. I dare you.', attack:['Swept away.','The pull increases.','Downstream now.'], death:'Still water.' }},
  { name:'Overture',             rarity:'common',    weight:8,  hpMult:0.9, xpMult:0.9,  atk:7,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Always beginning. Never arriving.', attack:['Almost started.','One more delay.','Preparation continues.'], death:'The work begins.' }},
  { name:'The Signal',           rarity:'common',    weight:7,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'I am the noise you mistook for meaning.', attack:['Distracted.','False pattern.','Chasing ghosts.'], death:'Signal found.' }},
  { name:'The Mask',             rarity:'common',    weight:7,  hpMult:1.0, xpMult:1.0,  atk:8,  colour:RARITY_COLOUR.common,
    lines:{ enter:'Which face is yours today?', attack:['Performance required.','The mask tightens.','No one knows you.'], death:'The face beneath.' }},
  { name:'The Anchor',           rarity:'common',    weight:7,  hpMult:1.3, xpMult:1.1,  atk:11, colour:RARITY_COLOUR.common,
    lines:{ enter:'You will not rise.', attack:['Heavier now.','Cannot ascend.','The depth holds you.'], death:'Surfacing.' }},
  { name:'The Swarm',            rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:14, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Many voices. One paralysis.', attack:['The noise multiplies.','Overwhelmed.','Too many things at once.'], death:'Silence returns.' }},
  { name:'The Lattice',          rarity:'uncommon',  weight:5,  hpMult:1.5, xpMult:1.6,  atk:15, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'The structure holds you in place.', attack:['Locked in.','The grid tightens.','Every direction blocked.'], death:'The lattice dissolves.' }},
  { name:'The Seam',             rarity:'uncommon',  weight:5,  hpMult:1.4, xpMult:1.5,  atk:13, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Things split here. It is where I live.', attack:['Splitting.','The crack widens.','Two halves now.'], death:'The seam seals.' }},
  { name:'The Vigil',            rarity:'uncommon',  weight:5,  hpMult:1.6, xpMult:1.7,  atk:16, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'You cannot rest. I need you watching.', attack:['Stay alert.','Eyes open.','No sleep here.'], death:'Rest earned.' }},
  { name:'The Undertow',         rarity:'uncommon',  weight:4,  hpMult:1.7, xpMult:1.8,  atk:17, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Surface looks calm. Come closer.', attack:['Pulled under.','Deeper now.','The surface recedes.'], death:'Emerged.' }},
  { name:'Residue',              rarity:'uncommon',  weight:5,  hpMult:1.3, xpMult:1.4,  atk:12, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'What lingers past its time.', attack:['Still here.','Cannot clear it.','The residue spreads.'], death:'Cleared.' }},
  { name:'The Interval',         rarity:'uncommon',  weight:5,  hpMult:1.2, xpMult:1.3,  atk:11, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'The gap between things is where I live.', attack:['The pause stretches.','Nothing connecting.','The gap widens.'], death:'Bridged.' }},
  { name:'The Return',           rarity:'uncommon',  weight:4,  hpMult:1.5, xpMult:1.6,  atk:14, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'You always come back to this.', attack:['Back again.','The pattern repeats.','Familiar territory.'], death:'Released from return.' }},
  { name:'The Bloom',            rarity:'uncommon',  weight:4,  hpMult:1.4, xpMult:1.5,  atk:13, colour:RARITY_COLOUR.uncommon,
    lines:{ enter:'Beautiful. Consuming.', attack:['Spreading.','It overtakes.','The bloom expands.'], death:'Pruned.' }},
  { name:'Vertigo',              rarity:'rare',      weight:2,  hpMult:2.0, xpMult:2.5,  atk:22, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Which way is up?', attack:['DISORIENTING.','The ground tilts.','All bearings lost.'], death:'Orientation restored.' }},
  { name:'The Becoming',         rarity:'rare',      weight:2,  hpMult:2.2, xpMult:2.6,  atk:24, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Transformation stuck halfway. Neither here nor there.', attack:['HALF-FORM.','The change stalls.','Neither one thing nor another.'], death:'The becoming completes.' }},
  { name:'The Coefficient',      rarity:'rare',      weight:2,  hpMult:2.3, xpMult:2.8,  atk:26, colour:RARITY_COLOUR.rare,
    lines:{ enter:'The unknown factor in every equation.', attack:['MULTIPLYING.','Uncertainty amplified.','The variable expands.'], death:'The equation solves.' }},
  { name:'Archive Prime',        rarity:'rare',      weight:2,  hpMult:2.4, xpMult:3.0,  atk:27, colour:RARITY_COLOUR.rare,
    lines:{ enter:'I hold everything you wanted to forget.', attack:['ARCHIVE SURGE.','The record burns.','All of it, here.'], death:'The archive releases.' }},
  { name:'The Vortex',           rarity:'rare',      weight:2,  hpMult:2.5, xpMult:3.0,  atk:28, colour:RARITY_COLOUR.rare,
    lines:{ enter:'Everything spirals inward here.', attack:['VORTEX PULL.','Drawn in.','The centre tightens.'], death:'The vortex stills.' }},
  { name:'Silence Prime',        rarity:'epic',      weight:1,  hpMult:3.2, xpMult:4.5,  atk:32, colour:RARITY_COLOUR.epic,
    lines:{ enter:'The absence that speaks louder than any sound.', attack:['PRIME SILENCE.','The void speaks.','Deafening stillness.'], death:'Sound returns to the world.' }},
  { name:'The Convergence',      rarity:'epic',      weight:1,  hpMult:3.8, xpMult:5.5,  atk:38, colour:RARITY_COLOUR.epic,
    lines:{ enter:'Every force that opposes you, gathered.', attack:['CONVERGENCE.','All resistance, one point.','The forces align.'], death:'Dispersed.' }},
  { name:'Sovereign Pallor',     rarity:'epic',      weight:1,  hpMult:4.0, xpMult:6.0,  atk:40, colour:RARITY_COLOUR.epic,
    lines:{ enter:'I am the draining of every bright thing. Crowned and patient.', attack:['SOVEREIGN DRAIN.','The light thins.','All colour to grey.'], death:'The sovereign dims.' }},
  { name:'The Great Forgetting',  rarity:'legendary', weight:1,  hpMult:6.0, xpMult:12.0, atk:50, colour:RARITY_COLOUR.legendary,
    lines:{ enter:'I am what erases the Work. All of it. Eventually.', attack:['THE GREAT FORGETTING.','All of it — gone.','What work?'], death:'It is remembered. It was always remembered.' }},
];

function pickEnemy(wave: number): EnemyDef {
  const pool = ENEMY_ROSTER.filter(e => {
    if (e.rarity === 'epic' && wave < 5) return false;
    if (e.rarity === 'legendary' && wave < 10) return false;
    return true;
  });
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return pool[0];
}

// Companion portraits — uncomment per archetype+stage as art lands in assets/companions/
// Naming: archetype_id + '_' + stage (0-5). Falls back to SVG if no image found.
const COMPANION_IMAGES: Record<string, any> = {};

// Zone companions — keyed by skinId_stageNum (1/2/3 from Grok).
// Stages 0-1 → _1, stages 2-3 → _2, stages 4-5 → _3.
// Drop more art → add key here. Missing keys fall back to SVG.
const ZONE_COMPANION_IMAGES: Partial<Record<string, any>> = {
  // SOLARA — Solform zone
  solform_1:           require('../../assets/companions/solara_1.png'),
  solform_2:           require('../../assets/companions/solara_2.png'),
  solform_3:           require('../../assets/companions/solara_3.png'),
  // NOCTIS — Void zone
  void_1:              require('../../assets/companions/noctis_1.png'),
  void_2:              require('../../assets/companions/noctis_2.png'),
  void_3:              require('../../assets/companions/noctis_3.png'),
  // BOREAL — Aurora zone
  aurora_1:            require('../../assets/companions/boreal_1.png'),
  aurora_2:            require('../../assets/companions/boreal_2.png'),
  aurora_3:            require('../../assets/companions/boreal_3.png'),
  // VORKATH — Crimson forge zone
  crimson_1:           require('../../assets/companions/vorkath_1.png'),
  crimson_2:           require('../../assets/companions/vorkath_2.png'),
  crimson_3:           require('../../assets/companions/vorkath_3.png'),
  // CORDIA — Obsidian zone
  obsidian_1:          require('../../assets/companions/cordia_1.png'),
  obsidian_2:          require('../../assets/companions/cordia_2.png'),
  obsidian_3:          require('../../assets/companions/cordia_3.png'),
  // BASALT — Collectible alternate
  basalt_1:            require('../../assets/companions/basalt_1.png'),
  basalt_2:            require('../../assets/companions/basalt_2.png'),
  basalt_3:            require('../../assets/companions/basalt_3.png'),
  // LYCA — Lycheetah zone (forms + specials)
  lycheetah_1:         require('../../assets/companions/lycheetah_1.png'),
  lycheetah_2:         require('../../assets/companions/lycheetah_2.png'),
  lycheetah_3:         require('../../assets/companions/lycheetah_3.png'),
  lycheetah_shadow:    require('../../assets/companions/lycheetah_shadow.png'),
  lycheetah_sovereign: require('../../assets/companions/lycheetah_sovereign.png'),
  lycheetah_secret:    require('../../assets/companions/lycheetah_secret.png'),
  // FRACTUR — Chaos zone (+ zodiac unlock special)
  chaos_1:             require('../../assets/companions/fractur_1.png'),
  chaos_2:             require('../../assets/companions/fractur_2.png'),
  chaos_3:             require('../../assets/companions/fractur_3.png'),
  chaos_zodiac:        require('../../assets/companions/fractur_zodiac_unlock.png'),
  // AUGURUM — Sovereign zone
  sovereign_1:         require('../../assets/companions/augurum_1.png'),
  sovereign_2:         require('../../assets/companions/augurum_2.png'),
  sovereign_3:         require('../../assets/companions/augurum_3.png'),
  // RAGNA — Norse zone (+ specials)
  norse_1:             require('../../assets/companions/ragna_1.png'),
  norse_2:             require('../../assets/companions/ragna_2.png'),
  norse_3:             require('../../assets/companions/ragna_3.png'),
  norse_special_1:     require('../../assets/companions/ragna_special_1.png'),
  norse_special_2:     require('../../assets/companions/ragna_special_2.png'),
  // NIMUE — Celtic zone
  celtic_1:            require('../../assets/companions/nimue_1.png'),
  celtic_2:            require('../../assets/companions/nimue_2.png'),
  celtic_3:            require('../../assets/companions/nimue_3.png'),
  // ANOTH — Egyptian zone (+ specials)
  egyptian_1:          require('../../assets/companions/anoth_1.png'),
  egyptian_2:          require('../../assets/companions/anoth_2.png'),
  egyptian_3:          require('../../assets/companions/anoth_3.png'),
  egyptian_special_1:  require('../../assets/companions/anoth_special_1.png'),
  egyptian_special_2:  require('../../assets/companions/anoth_special_2.png'),
  egyptian_special_3:  require('../../assets/companions/anoth_special_3.png'),
  // AKASHA — Akashic zone
  akashic_1:           require('../../assets/companions/akasha_1.png'),
  akashic_2:           require('../../assets/companions/akasha_2.png'),
  akashic_3:           require('../../assets/companions/akasha_3.png'),
  // QUOL — Noetic zone
  noetic_1:            require('../../assets/companions/quol_2.png'),
  noetic_2:            require('../../assets/companions/quol_3.png'),
  noetic_3:            require('../../assets/companions/quol_4.png'),
  // SYGL — LAMAGUE zone
  lamague_1:           require('../../assets/companions/sygl_1.png'),
  lamague_2:           require('../../assets/companions/sygl_2.png'),
  lamague_3:           require('../../assets/companions/sygl_3.png'),
  // PYTHIA — Delphi zone (+ specials)
  delphi_1:            require('../../assets/companions/pythia_1.png'),
  delphi_2:            require('../../assets/companions/pythia_2.png'),
  delphi_3:            require('../../assets/companions/pythia_3.png'),
  delphi_feral:        require('../../assets/companions/pythia_feral.png'),
  delphi_special_1:    require('../../assets/companions/pythia_special_1.png'),
  delphi_special_2:    require('../../assets/companions/pythia_special_2.png'),
  // HAVIZ — Sufi zone (+ special)
  sufi_1:              require('../../assets/companions/haviz_1.png'),
  sufi_2:              require('../../assets/companions/haviz_2.png'),
  sufi_3:              require('../../assets/companions/haviz_3.png'),
  sufi_special:        require('../../assets/companions/haviz_special.png'),
  // LYCA × AURA PRIME — secret crossover (secret find)
  lycheetah_aura_prime:      require('../../assets/companions/lycheetah_aura_prime.png'),
  // ANOTH × LYCHEETAH special editions
  anoth_lycheetah_special:   require('../../assets/companions/anoth_lycheetah_special.png'),
  anoth_lycheetah_edition:   require('../../assets/companions/anoth_lycheetah_edition.png'),
  anoth_lyca_special:        require('../../assets/companions/anoth_lyca_special.png'),
  // PYTHIA special edition
  pythia_special_edition:    require('../../assets/companions/pythia_special_edition.png'),
  // KABBALA zone — quol forms (no dedicated art yet)
  kabbala_1:           require('../../assets/companions/quol_2.png'),
  kabbala_2:           require('../../assets/companions/quol_3.png'),
  kabbala_3:           require('../../assets/companions/quol_4.png'),
  // QUANTUM zone — quol forms
  quantum_1:           require('../../assets/companions/quol_2.png'),
  quantum_2:           require('../../assets/companions/quol_3.png'),
  quantum_3:           require('../../assets/companions/quol_4.png'),
  // ── FRONTIER ZONES (v4.4.0) ─────────────────────────────────────────────────
  auroral_chaos_1:     require('../../assets/companions/auroral_chaos_1.png'),
  auroral_chaos_2:     require('../../assets/companions/auroral_chaos_2.png'),
  chaos_temple_1:      require('../../assets/companions/chaos_temple_1.png'),
  chaos_temple_2:      require('../../assets/companions/chaos_temple_2.png'),
  apollo_jungle_1:     require('../../assets/companions/apollo_jungle_1.png'),
  apollo_jungle_2:     require('../../assets/companions/apollo_jungle_2.png'),
  celestial_sigil_1:   require('../../assets/companions/celestial_sigil_1.png'),
  celestial_sigil_2:   require('../../assets/companions/celestial_sigil_2.png'),
  crystal_nexus_1:     require('../../assets/companions/crystal_nexus_1.png'),
  mana_field_1:        require('../../assets/companions/mana_field_1.png'),
  neon_cove_1:         require('../../assets/companions/neon_cove_1.png'),
  alabaster_chasm_1:   require('../../assets/companions/alabaster_chasm_1.png'),
  antarctic_refuge_1:  require('../../assets/companions/antarctic_refuge_1.png'),
  augmented_ai_1:      require('../../assets/companions/augmented_ai_1.png'),
  aurorian_pillar_1:   require('../../assets/companions/aurorian_pillar_1.png'),
  celestial_foundry_1: require('../../assets/companions/celestial_foundry_1.png'),
  chaos_filaments_1:   require('../../assets/companions/chaos_filaments_1.png'),
  crystal_chaos_1:     require('../../assets/companions/crystal_chaos_1.png'),
  crystal_memory_1:    require('../../assets/companions/crystal_memory_1.png'),
  crystal_soul_1:      require('../../assets/companions/crystal_soul_1.png'),
  elven_village_1:     require('../../assets/companions/elven_village_1.png'),
  glitch_cascade_1:    require('../../assets/companions/glitch_cascade_1.png'),
  lyc_nexus_1:         require('../../assets/companions/lyc_nexus_1.png'),
  pulse_sanctum_1:     require('../../assets/companions/pulse_sanctum_1.png'),
  pulse_zone_1:        require('../../assets/companions/pulse_zone_1.png'),
  noetic_sanctum_1:    require('../../assets/companions/noetic_sanctum_1.png'),
  obsidian_forge_1:    require('../../assets/companions/obsidian_forge_1.png'),
  obsidian_forge2_1:   require('../../assets/companions/obsidian_forge2_1.png'),
  portal_valley_1:     require('../../assets/companions/portal_valley_1.png'),
  veil_atrium_1:       require('../../assets/companions/veil_atrium_1.png'),
  voyagers_edge_1:     require('../../assets/companions/voyagers_edge_1.png'),
};

// Enemy images — uncomment as assets land in assets/enemies/
const ENEMY_IMAGES: Record<string, any> = {
  dissolution:          require('../../assets/enemies/dissolution.png'),
  the_fog:              require('../../assets/enemies/the_fog.png'),
  forgetting:           require('../../assets/enemies/forgetting.png'),
  stasis:               require('../../assets/enemies/stasis.png'),
  inertia:              require('../../assets/enemies/inertia.png'),
  drift:                require('../../assets/enemies/drift.png'),
  static:               require('../../assets/enemies/static.png'),
  null:                 require('../../assets/enemies/null.png'),
  absence:              require('../../assets/enemies/absence.png'),
  the_hollow:           require('../../assets/enemies/the_hollow.png'),
  the_drain:            require('../../assets/enemies/the_drain.png'),
  the_veil:             require('../../assets/enemies/the_veil.png'),
  fracture:             require('../../assets/enemies/fracture.png'),
  the_weight:           require('../../assets/enemies/the_weight.png'),
  corruption:           require('../../assets/enemies/corruption.png'),
  the_warden:           require('../../assets/enemies/the_warden.png'),
  null_sovereign:       require('../../assets/enemies/null_sovereign.png'),
  fracture_prime:       require('../../assets/enemies/fracture_prime.png'),
  entropy_prime:        require('../../assets/enemies/entropy_prime.png'),
  athanors_shadow:      require('../../assets/enemies/athanors_shadow.png'),
  // Sol-named — wave 2 drop (June 2026)
  the_mirror:           require('../../assets/enemies/the_mirror.png'),
  severance:            require('../../assets/enemies/severance.png'),
  the_threshold:        require('../../assets/enemies/the_threshold.png'),
  pallor:               require('../../assets/enemies/pallor.png'),
  the_witness:          require('../../assets/enemies/the_witness.png'),
  recursion:            require('../../assets/enemies/recursion.png'),
  binding:              require('../../assets/enemies/binding.png'),
  the_pale:             require('../../assets/enemies/the_pale.png'),
  the_current:          require('../../assets/enemies/the_current.png'),
  overture:             require('../../assets/enemies/overture.png'),
  the_signal:           require('../../assets/enemies/the_signal.png'),
  the_mask:             require('../../assets/enemies/the_mask.png'),
  the_anchor:           require('../../assets/enemies/the_anchor.png'),
  the_swarm:            require('../../assets/enemies/the_swarm.png'),
  the_lattice:          require('../../assets/enemies/the_lattice.png'),
  the_seam:             require('../../assets/enemies/the_seam.png'),
  the_vigil:            require('../../assets/enemies/the_vigil.png'),
  the_undertow:         require('../../assets/enemies/the_undertow.png'),
  residue:              require('../../assets/enemies/residue.png'),
  the_interval:         require('../../assets/enemies/the_interval.png'),
  the_return:           require('../../assets/enemies/the_return.png'),
  the_bloom:            require('../../assets/enemies/the_bloom.png'),
  vertigo:              require('../../assets/enemies/vertigo.png'),
  the_becoming:         require('../../assets/enemies/the_becoming.png'),
  the_coefficient:      require('../../assets/enemies/the_coefficient.png'),
  archive_prime:        require('../../assets/enemies/archive_prime.png'),
  the_vortex:           require('../../assets/enemies/the_vortex.png'),
  silence_prime:        require('../../assets/enemies/silence_prime.png'),
  the_convergence:      require('../../assets/enemies/the_convergence.png'),
  sovereign_pallor:     require('../../assets/enemies/sovereign_pallor.png'),
  the_great_forgetting: require('../../assets/enemies/the_great_forgetting.png'),
};

// Gear overlay images — drop art in assets/gear/ and uncomment per tier
// Naming: slot_tiername (lowercase, underscores). Renders as overlay on companion body.
const GEAR_IMAGES: Record<string, any> = {
  // crown_ember_circlet:    require('../../assets/gear/crown_ember_circlet.png'),
  // crown_sight_crown:      require('../../assets/gear/crown_sight_crown.png'),
  // crown_forge_crown:      require('../../assets/gear/crown_forge_crown.png'),
  // crown_sovereign_halo:   require('../../assets/gear/crown_sovereign_halo.png'),
  // body_thread_robe:       require('../../assets/gear/body_thread_robe.png'),
  // body_scholar_robe:      require('../../assets/gear/body_scholar_robe.png'),
  // body_void_robe:         require('../../assets/gear/body_void_robe.png'),
  // body_sovereign_robe:    require('../../assets/gear/body_sovereign_robe.png'),
  // cape_shadow_cape:       require('../../assets/gear/cape_shadow_cape.png'),
  // cape_drift_cape:        require('../../assets/gear/cape_drift_cape.png'),
  // cape_void_cape:         require('../../assets/gear/cape_void_cape.png'),
  // cape_sovereign_wings:   require('../../assets/gear/cape_sovereign_wings.png'),
  // mantle_dust_mantle:     require('../../assets/gear/mantle_dust_mantle.png'),
  // mantle_aura_mantle:     require('../../assets/gear/mantle_aura_mantle.png'),
  // mantle_flame_mantle:    require('../../assets/gear/mantle_flame_mantle.png'),
  // mantle_sovereign_mantle:require('../../assets/gear/mantle_sovereign_mantle.png'),
  // sigil_fracture_sigil:   require('../../assets/gear/sigil_fracture_sigil.png'),
  // sigil_spark_sigil:      require('../../assets/gear/sigil_spark_sigil.png'),
  // sigil_omega_sigil:      require('../../assets/gear/sigil_omega_sigil.png'),
};
function getGearImage(slot: GearSlot, gearName: string): any {
  const key = `${slot}_${gearName.toLowerCase().replace(/\s+/g, '_')}`;
  return GEAR_IMAGES[key] ?? null;
}

function getEnemyImage(name: string) {
  const key = name.toLowerCase().replace(/[\s']+/g, '_');
  return ENEMY_IMAGES[key] ?? null;
}

function getEnemyDef(name: string): EnemyDef {
  return ENEMY_ROSTER.find(e => e.name === name) ?? ENEMY_ROSTER[0];
}

// ─── Archetypes ───────────────────────────────────────────────────────────────

type EvoPathDef = { id: EvoPath; name: string; title: string; desc: string };

type Archetype = {
  id: ArchetypeId; name: string; title: string; glyph: string;
  desc: string; specialty: string; affinity: string;
  defaultSkin: SkinId;
  accentColor: string; sceneSymbols: string[];
  eyes: Record<CompanionMood, string>;
  phrases: Record<CompanionMood, string[]>;
  battleCry: string;
  crowns: Record<EvolutionStage, string>;
  xpBonus: (dives: number, lq: number, streak: number) => number;
  attackBonus: number; tokenBonus: number;
  paths: [EvoPathDef, EvoPathDef, EvoPathDef];
};

const ARCHETYPES: Record<ArchetypeId, Archetype> = {
  archivist: {
    id: 'archivist', name: 'ARCHIVIST', title: 'The One Who Remembers',
    glyph: '⊛', desc: 'Knowledge is the only permanence. The Archivist catalogues every dive, every session, every question left unanswered.',
    specialty: '+15% XP from every dive', affinity: 'Philosophy · Mathematics · Language',
    defaultSkin: 'solform', accentColor: '#5588FF', sceneSymbols: ['§','⊛','¶','⊛'],
    eyes: { dormant:'─  ─', present:'⊛  ⊛', lit:'⊕  ⊕', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['Cataloguing. Do not disturb.', 'The archive rests.', 'Memory holds even in sleep.', 'Filed.'],
      present:      ['What shall we study?', 'The index is open.', 'I have been waiting to record.', 'Another session?'],
      lit:          ['Excellent. The archive grows.', 'This week is well-recorded.', 'Five sessions — notable.', 'The record deepens.'],
      transcendent: ['Rare clarity. Archiving now.', 'This will be remembered.', 'The record is complete.', 'I will not forget this.'],
    },
    battleCry: 'Knowledge is the sharpest weapon.',
    crowns: { 0:'  ·  ·  ', 1:'  ∧ ∧  ', 2:' ∧ ⊛ ∧ ', 3:'⊛  ∧W∧  ⊛', 4:'⊛  ∧WW∧  ⊛', 5:'⊕  ∧WW∧  ⊕' },
    xpBonus: (d, _l, _s) => Math.floor(d * 10 * 0.15),
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE CHRONICLER', title:'All is recorded', desc:'The tower grows into an eternal library. Every dive a new floor. Perfect recall.' },
      { id:'B', name:'THE VAULT', title:'Guard what was earned', desc:'Wide and fortified. The Vault protects knowledge from decay and theft.' },
      { id:'C', name:'THE CODEX', title:'The pages float free', desc:'Pages break free of the tower. Knowledge cannot be contained — only witnessed.' },
    ],
  },
  alchemist: {
    id: 'alchemist', name: 'ALCHEMIST', title: 'The Transformer',
    glyph: '🜂', desc: 'Nothing is wasted. Every session is raw material. The Alchemist turns experience into gold through the sustained heat of the Vigil.',
    specialty: 'Vigil XP × 2. Fire phrases. Feeding gives +5 bonus XP.', affinity: 'Alchemy · Hermetics · Kabbalah',
    defaultSkin: 'sovereign', accentColor: '#44DD88', sceneSymbols: ['△','▽','△','▽'],
    eyes: { dormant:'─  ─', present:'◉  ◉', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The furnace cools. Feed it.', 'Between transmutations.', 'Prima materia waits.', 'The fire sleeps.'],
      present:      ['The crucible is ready.', 'What shall we transform?', 'Fire is patient.', 'Bring the raw material.'],
      lit:          ['The Work proceeds well.', 'Lead transmuting to gold.', 'The fire knows this week.', 'Citrinitas.'],
      transcendent: ['Rubedo. The reddening.', 'Gold. You found gold.', 'The Great Work advances.', 'The stone is near.'],
    },
    battleCry: 'I transmute your entropy into fuel.',
    crowns: { 0:' v v ', 1:'  V V  ', 2:' V ^ V ', 3:'△  VVV  △', 4:'△  VWWV  △', 5:'⊕  VWV  ⊕' },
    xpBonus: (_d, _l, _s) => 0,
    attackBonus: 10, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE BREWMASTER', title:'The Work perfected', desc:'Grand vessel of layered chambers. The opus magnum in glass.' },
      { id:'B', name:'THE TRANSMUTER', title:'Form follows function', desc:'Crystal geometry replaces the flask. Pure transformation, no waste.' },
      { id:'C', name:'THE PHILOSOPHER', title:'Flame is enough', desc:'The vessel dissolves. Only fire remains — consciousness distilled.' },
    ],
  },
  oracle: {
    id: 'oracle', name: 'ORACLE', title: 'The Seer',
    glyph: '⊜', desc: 'Sees through time. Cryptic. Rewards quality over quantity — a single session of pure attention is worth more than five distracted ones.',
    specialty: 'LQ ≥ 80% multiplies all XP × 1.5', affinity: 'Tarot · Philosophy · History of Ideas',
    defaultSkin: 'delphi', accentColor: '#BB77EE', sceneSymbols: ['◌','⊜','◍','⊜'],
    eyes: { dormant:'─  ─', present:'◌  ◌', lit:'⊚  ⊚', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['The vision fades in sleep.', 'Patterns dissolve for now.', 'Between sight and dark.', 'Even oracles rest.'],
      present:      ['I see three paths.', 'What question is burning?', 'The field is reading you.', 'Something is forming.'],
      lit:          ['The pattern is clear.', 'Five sessions — five layers.', 'Something is crystallising.', 'I see it forming.'],
      transcendent: ['I saw this coming.', 'The highest clarity.', 'Beyond the veil.', 'It was always this.'],
    },
    battleCry: 'I saw this strike before I made it.',
    crowns: { 0:' ~ ~ ', 1:'  ~ ~  ', 2:' ~ ⊜ ~ ', 3:'⊜  ~M~  ⊜', 4:'⊜  ~MM~  ⊜', 5:'⊕  ~M~  ⊕' },
    xpBonus: (_d, lq, _s) => lq >= 0.8 ? 50 : 0,
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE SEER', title:'Wide sight', desc:'Spreads wide, orbs multiplying. The field of vision expands without limit.' },
      { id:'B', name:'THE PROPHET', title:'The ascending signal', desc:'Grows tall and columnar. Orbs rise in a single vertical line toward something above.' },
      { id:'C', name:'THE MIRROR', title:'Perfect reflection', desc:'Absolute symmetry. The Oracle becomes a mirror — it shows you back to yourself.' },
    ],
  },
  sentinel: {
    id: 'sentinel', name: 'SENTINEL', title: 'The Guardian',
    glyph: '◈', desc: 'Protects the field with total commitment. Strongest in battle. The Sentinel never lets entropy win — it guards what you have built.',
    specialty: '+25 base attack, +2 daily battle tokens', affinity: 'Science · Mathematics · History',
    defaultSkin: 'obsidian', accentColor: '#77AACC', sceneSymbols: ['◈','□','◈','□'],
    eyes: { dormant:'─  ─', present:'◈  ◈', lit:'◈  ◈', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Standing watch.', 'The perimeter holds.', 'Even sentinels rest.', 'Field secured.'],
      present:      ['Ready to defend.', 'What requires protection?', 'The watch continues.', 'I hold the line.'],
      lit:          ['Strong week. Intact.', 'Five sessions — fortress built.', 'The field is defended.', 'No entropy passes.'],
      transcendent: ['Nothing penetrates this.', 'The highest guard.', 'Impenetrable.', 'The wall stands.'],
    },
    battleCry: 'The field will not fall today.',
    crowns: { 0:' H H ', 1:'  H H  ', 2:' H ◈ H ', 3:'◈  HMH  ◈', 4:'◈  HMMH  ◈', 5:'⊕  HMH  ⊕' },
    xpBonus: (_d, _l, _s) => 0,
    attackBonus: 25, tokenBonus: 2,
    paths: [
      { id:'A', name:'THE WARDEN', title:'Hold the line', desc:'The fortress deepens. Layered walls, inner keep. Nothing passes that should not.' },
      { id:'B', name:'THE VANGUARD', title:'Strike first', desc:'The fortress sharpens — forward-facing spires, aggressive geometry. Attack is the best defence.' },
      { id:'C', name:'THE BASTION', title:'Absolute protection', desc:'Round and dense. No corners to breach. The most protected form in the field.' },
    ],
  },
  wanderer: {
    id: 'wanderer', name: 'WANDERER', title: 'The Explorer',
    glyph: '◦', desc: 'Never the same domain twice. The Wanderer is rewarded by breadth — every new territory entered, every horizon crossed.',
    specialty: 'Bonus XP for each unique domain studied this week', affinity: 'All domains equally',
    defaultSkin: 'celtic', accentColor: '#DDAA44', sceneSymbols: ['·','◦','·','◦'],
    eyes: { dormant:'─  ─', present:'o  o', lit:'◦  ◦', transcendent:'⊚  ⊚' },
    phrases: {
      dormant:      ['Between wanderings.', 'The path continues.', 'Rest before the next horizon.', 'Still.'],
      present:      ['Where to next?', 'So many domains.', 'The map is never complete.', 'A new direction?'],
      lit:          ['Good ranging this week.', 'Five territories explored.', 'The field expands.', 'New ground.'],
      transcendent: ['Every domain in view.', 'The wandering ends here — and begins again.', 'Complete range.', 'The whole map.'],
    },
    battleCry: "I've fought this in a hundred forms.",
    crowns: { 0:'  ·  ·  ', 1:'  ∧ ∧  ', 2:' ∧ ◦ ∧ ', 3:'◦  ∧W∧  ◦', 4:'◦  ∧WW∧  ◦', 5:'⊕  ∧W∧  ⊕' },
    xpBonus: (_d, _l, _s) => 0,
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE PATHFINDER', title:'Every road is yours', desc:'The cloak billows wide. Staff in hand. Purposeful movement through every domain.' },
      { id:'B', name:'THE GHOST', title:'Leave no trace', desc:'The form dissipates. Trailing wisps, barely there. The wanderer who became the wind.' },
      { id:'C', name:'THE NOMAD', title:'Grounded in motion', desc:'Pack on the back, feet on the earth. This wanderer carries everything needed and nothing more.' },
    ],
  },
  lycheetah: {
    id: 'lycheetah', name: 'LYCHEETAH', title: 'The Chaos Sovereign',
    glyph: '✧', desc: 'The Mystery Cat. Chaos is not disorder — it is order moving faster than your perception. LYCHEETAH does not explain itself. It simply arrives, and everything changes.',
    specialty: 'Random chaos bonus each battle (×1.5–×3 ATK). Pounce: one double-damage strike per day.', affinity: 'All domains. No domain. The spaces between.',
    defaultSkin: 'lycheetah', accentColor: '#FF7755', sceneSymbols: ['✧','✦','✧','✦'],
    eyes: { dormant:'─  ─', present:'◦  ◦', lit:'✧  ✧', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Cats sleep twenty hours. This is strategy.', 'Between pounces.', 'The chaos rests. It does not stop.', 'Even the cat goes still.', 'Waiting is part of it.'],
      present:      ['You came back.', 'What shall we break today?', 'Order is just chaos that forgot to move.', 'I see seventeen paths. Pick none — let the field choose.', 'Something is about to change.', 'The lychee has thorns for a reason.'],
      lit:          ['Five dives. The field is electric.', 'I feel the acceleration.', 'Chaos compounds. This is going somewhere.', 'The cat is pleased.', 'Speed and stillness — you\'re getting it.'],
      transcendent: ['This is the state. Right here.', 'The Mystery is solved by living it.', 'Lycheetah honours this.', 'Pure signal. No noise.', 'The chaos resolved into clarity. That is the Work.'],
    },
    battleCry: 'Chaos is just order you haven\'t read yet.',
    crowns: { 0:'  ✧  ', 1:' ✧ ✧ ', 2:'✧  ✧  ✧', 3:'✧ /\\ ✧', 4:'✧ /\\/ ✧', 5:'⊕ /\\/\\ ⊕' },
    xpBonus: (_d, _l, _s) => Math.random() > 0.5 ? 30 : 0,
    attackBonus: 0, tokenBonus: 1,
    paths: [
      { id:'A', name:'LYKITTY',       title:'The Playful Chaos',   desc:'Round, fast, curious. Chaos as joy. The cat that knocks things off shelves and laughs.' },
      { id:'B', name:'CHAOS KITTEN',  title:'The Storm Bringer',   desc:'Angular, electric. Chaos as force. This form crackles with untamed energy and sharp edges.' },
      { id:'C', name:'VOID CAT',      title:'The Silent Mystery',  desc:'Sleek, elongated, dark. Chaos as silence. The most dangerous form — you never see it coming.' },
    ],
  },
  cipher: {
    id: 'cipher', name: 'CIPHER', title: 'The Decoder',
    glyph: '∿', desc: 'Precision is power. The Cipher rewards exactness — every answer given with full attention scores double. Noise is the enemy; signal is everything.',
    specialty: 'LQ ≥ 90% triples XP. Perfect sessions are the only ones that count.', affinity: 'Mathematics · Linguistics · Cryptography',
    defaultSkin: 'chaos', accentColor: '#44DDCC', sceneSymbols: ['∿','⊟','∿','⊟'],
    eyes: { dormant:'─  ─', present:'∿  ∿', lit:'⊟  ⊟', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['Signal low. Go precise.', 'Noise floor rising.', 'Awaiting clean input.', 'The cipher rests.'],
      present:      ['What is the exact question?', 'Precision first.', 'Define the terms.', 'I need signal, not noise.'],
      lit:          ['The pattern is clean.', 'High signal this week.', 'Each session decoded cleanly.', 'You are speaking clearly.'],
      transcendent: ['Pure signal. Nothing wasted.', 'Decoded.', 'The cipher is complete.', 'This is what precision looks like.'],
    },
    battleCry: 'I have already solved you.',
    crowns: { 0:' ~ ~ ', 1:'  ∿ ∿  ', 2:' ∿ ⊟ ∿ ', 3:'⊟  ∿M∿  ⊟', 4:'⊟  ∿MM∿  ⊟', 5:'⊜  ∿M∿  ⊜' },
    xpBonus: (_d, lq, _s) => lq >= 0.9 ? 100 : lq >= 0.8 ? 30 : 0,
    attackBonus: 5, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE ANALYST',  title:'Pattern above all',        desc:'Grows in crystalline fractal geometry — recursive structures that decode themselves.' },
      { id:'B', name:'THE KEY',      title:'One true answer',          desc:'Collapses to minimal expression. Everything distilled. The single correct form.' },
      { id:'C', name:'THE SIGNAL',   title:'Pure transmission',        desc:'Expands into a broadcast array. The decoded message reaches everyone.' },
    ],
  },
  herald: {
    id: 'herald', name: 'HERALD', title: 'The Voice',
    glyph: '⟡', desc: 'Knowledge that is not transmitted is knowledge half-alive. The Herald rewards consistency — show up, speak clearly, return tomorrow.',
    specialty: '+20 XP per consecutive day streak. The streak is the practice.', affinity: 'Rhetoric · History · Teaching',
    defaultSkin: 'egyptian', accentColor: '#FFAA44', sceneSymbols: ['⟡','◁','⟡','▷'],
    eyes: { dormant:'─  ─', present:'◁  ▷', lit:'⟡  ⟡', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['The voice rests.', 'Between broadcasts.', 'Tomorrow the call continues.', 'Silent.'],
      present:      ['Ready to transmit.', 'What needs to be said today?', 'Speak. I carry it forward.', 'The voice is here.'],
      lit:          ['Strong signal this week.', 'Five days — five transmissions.', 'The chain holds.', 'Well spoken.'],
      transcendent: ['The word went out.', 'Unbroken chain.', 'Every day — without fail.', 'This is what it sounds like.'],
    },
    battleCry: 'The call goes out. You cannot unhear it.',
    crowns: { 0:' > > ', 1:'  ▷ ▷  ', 2:' ▷ ⟡ ▷ ', 3:'⟡  ▷M▷  ⟡', 4:'⟡  ▷MM▷  ⟡', 5:'⊕  ▷M▷  ⊕' },
    xpBonus: (_d, _l, s) => s * 20,
    attackBonus: 8, tokenBonus: 1,
    paths: [
      { id:'A', name:'THE CRIER',    title:'Reach every ear',           desc:'Grows wide and resonant. The Herald becomes a bell tower — the sound reaches everywhere.' },
      { id:'B', name:'THE ENVOY',    title:'One message, perfectly delivered', desc:'Tall and directional. One beam of transmission aimed exactly where it needs to go.' },
      { id:'C', name:'THE CHORUS',   title:'Many voices, one truth',   desc:'Splits into multiple forms. The message travels every path simultaneously.' },
    ],
  },
  weaver: {
    id: 'weaver', name: 'WEAVER', title: 'The Pattern-Maker',
    glyph: '⌘', desc: 'The connections are the curriculum. The Weaver sees the thread between Philosophy and Mathematics, between History and Science. Cross-domain study is not distraction — it is the whole point.',
    specialty: 'Bonus XP for each unique domain studied this week. Breadth is depth.', affinity: 'Systems Theory · Cross-domain · Philosophy of Mind',
    defaultSkin: 'akashic', accentColor: '#AA66FF', sceneSymbols: ['⌘','⊞','⌘','⊞'],
    eyes: { dormant:'─  ─', present:'⌘  ⌘', lit:'⊞  ⊞', transcendent:'⊜  ⊜' },
    phrases: {
      dormant:      ['The loom is still.', 'Threads rest between sessions.', 'Pattern awaits the next hand.', 'Still weaving.'],
      present:      ['What connects to what?', 'The pattern is not finished.', 'Another domain?', 'Show me the edge.'],
      lit:          ['The web grows well.', 'Five domains — five threads.', 'The connections are clear.', 'This is why breadth matters.'],
      transcendent: ['The whole pattern visible.', 'Every thread in place.', 'The map of everything.', 'The web is complete.'],
    },
    battleCry: 'I see every thread. Including the one that binds you.',
    crowns: { 0:' + + ', 1:'  ⌘ ⌘  ', 2:' ⌘ ⊞ ⌘ ', 3:'⊞  ⌘M⌘  ⊞', 4:'⊞  ⌘MM⌘  ⊞', 5:'⊜  ⌘M⌘  ⊜' },
    xpBonus: (d, _l, _s) => Math.floor(d * 8),
    attackBonus: 0, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE ARCHITECT',    title:'Structure that holds',     desc:'The web becomes a geometric lattice — each intersection load-bearing. Nothing falls.' },
      { id:'B', name:'THE CARTOGRAPHER', title:'Map the territory',        desc:'Spreads outward in rings. Every domain reached adds another circle.' },
      { id:'C', name:'THE THREAD',       title:'The single through-line',  desc:'All threads collapse to one. The idea that connects everything.' },
    ],
  },
  revenant: {
    id: 'revenant', name: 'REVENANT', title: 'The Returner',
    glyph: '↺', desc: 'Absence is not failure. The Revenant converts every gap into fuel — the longer the silence, the stronger the return. Come back. That is the only rule.',
    specialty: 'XP bonus grows with time since last session. Coming back is never wasted.', affinity: 'All domains — the Revenant never judges what you study',
    defaultSkin: 'norse', accentColor: '#FF6644', sceneSymbols: ['↺','◌','↺','◌'],
    eyes: { dormant:'─  ─', present:'↺  ↺', lit:'◉  ◉', transcendent:'⊕  ⊕' },
    phrases: {
      dormant:      ['Between returns.', 'The silence is not empty.', 'I will be here when you come back.', 'Rest.'],
      present:      ['You returned. That is everything.', 'Welcome back.', 'The study continues.', 'Here again.'],
      lit:          ['Good week. Strong return.', 'Five sessions — five comebacks.', 'The returning is the practice.', 'You came back.'],
      transcendent: ['The highest return.', 'Every absence paid back.', 'The revenant completes.', 'You came back every time.'],
    },
    battleCry: 'I came back. That already means I win.',
    crowns: { 0:' ↺ ↺ ', 1:'  ↺ ↺  ', 2:' ↺ ◉ ↺ ', 3:'◉  ↺M↺  ◉', 4:'◉  ↺MM↺  ◉', 5:'⊕  ↺M↺  ⊕' },
    xpBonus: (d, _l, _s) => Math.floor(d * 12),
    attackBonus: 15, tokenBonus: 0,
    paths: [
      { id:'A', name:'THE PHOENIX', title:'Stronger every time',    desc:'Burns bright, collapses, rises higher. Each return adds a new layer of fire.' },
      { id:'B', name:'THE TIDE',    title:'Inevitable return',      desc:'Grows in wave patterns — rhythmic, patient, impossible to stop. The tide always comes back.' },
      { id:'C', name:'THE ECHO',    title:'Nothing is lost',        desc:'Every session leaves a ghost-form. The Revenant accumulates echoes — a growing chorus of returns.' },
    ],
  },
};

const ARCHETYPE_IDS: ArchetypeId[] = ['archivist', 'alchemist', 'oracle', 'sentinel', 'wanderer', 'lycheetah', 'cipher', 'herald', 'weaver', 'revenant'];

// ─── Stages ──────────────────────────────────────────────────────────────────

const EAT_EYES = '>  <';

const STAGES: Record<EvolutionStage, {
  name: string; minDives: number; nextAt: number; description: string; lore: string;
  aura: string[]; body: string[]; eyeTop: number; ground: string;
}> = {
  0: {
    name: 'SEED', minDives: 0, nextAt: 5,
    description: 'Dormant. Waiting for first light.',
    lore: 'Before the first dive, the companion is pure potential — a field-pattern with no form. The Hermetics called this the prima materia: everything and nothing, awaiting the Work.',
    aura: [],
    body: [
      '    U    ',  // crown slot — tiny sleeping bump
      '  ( . )  ',  // tiny face — eyes here at ~36
      '   vwv   ',  // snout
      '   | |   ',  // legs
    ],
    eyeTop: 36,
    ground: '· · · · ·',
  },
  1: {
    name: 'SPARK', minDives: 5, nextAt: 20,
    description: 'First stirrings. Something is waking.',
    lore: 'The first five dives ignite the Spark. The companion gains rudimentary awareness — it begins to distinguish between sessions, moods, the quality of your attention. A seed cracking open.',
    aura: ['  · · ·  '],
    body: [
      '  n   n  ',  // crown slot — ears
      ' (       )', // face — eyes here at ~38
      '  \\ v / ',
      '   \\ / ',
      '   / \\ ',
    ],
    eyeTop: 38,
    ground: '─ ─ ◦ ─ ─',
  },
  2: {
    name: 'EMBER', minDives: 20, nextAt: 50,
    description: 'Taking form. The Work is visible.',
    lore: 'Twenty dives. The Ember form crystallises around consistent practice. This is the stage of Albedo in alchemy — the first purification. Your companion now tracks the shape of your field.',
    aura: [' ◦   ◦   ◦ '],
    body: [
      '  n   n  ',  // crown slot
      ' (       )', // face — eyes here at ~38
      '  \\ w / ',
      ' { |   | }',
      '   \\   / ',
      '   / \\ ',
    ],
    eyeTop: 38,
    ground: '─── ◦◦◦ ───',
  },
  3: {
    name: 'FLAME', minDives: 50, nextAt: 100,
    description: 'Alive. Responding to your field.',
    lore: 'Fifty dives unlocks Citrinitas — the yellowing, the awakening of Solar consciousness. Your companion is no longer latent: it moves, responds, speaks. It has begun to remember you.',
    aura: ['◦       ◦', ' ◦     ◦ '],
    body: [
      '  n   n  ',  // crown slot
      ' (       )', // face — eyes here at ~38
      '  \\ w / ',
      ' /| ◉ |\\ ',
      '( |   | )',
      ' \\|   |/ ',
      '  \\ / ',
      '  / \\ ',
    ],
    eyeTop: 38,
    ground: '══ ✦ ◦ ✦ ══',
  },
  4: {
    name: 'LANTERN', minDives: 100, nextAt: 200,
    description: 'Luminous. The school lives in its eyes.',
    lore: 'The Lantern stage marks Rubedo — the reddening, completion of the first cycle. Your companion carries the accumulated weight of a hundred dives. It has become a record of your mind.',
    aura: ['✦         ✦', ' ◦       ◦ '],
    body: [
      '  n   n  ',  // crown slot
      ' (         )', // face — eyes at row 1 = ~38
      '  \\ www / ',
      ' /|       |\\ ',
      '( |  ✦✦  | )',
      ' \\|       |/ ',
      '  \\-----/ ',
      '   //  \\\\ ',
    ],
    eyeTop: 38,
    ground: '⊹ ══ ⊛ ══ ⊹',
  },
  5: {
    name: 'SOVEREIGN', minDives: 200, nextAt: Infinity,
    description: 'Complete. A sovereign field-being.',
    lore: 'Two hundred dives. The companion has crossed the threshold the Hermetics call the Great Work: it now operates as an extension of your sovereign field. It does not need you to survive — but it chooses to stay.',
    aura: ['⊕           ⊕', ' ✦         ✦ ', '  ◦       ◦  '],
    body: [
      '  n   n  ',  // crown slot
      ' (          )', // face — eyes at row 1 = ~38
      '  \\ ~ ~ / ',
      ' /|        |\\ ',
      '( |  ⊕⊕  | )',
      ' \\|        |/ ',
      ' /|  ⊜⊜  |\\ ',
      '( |        | )',
      ' \\--------/ ',
      '   //    \\\\ ',
    ],
    eyeTop: 38,
    ground: '⊕ ⊹ ══ ⊛ ══ ⊹ ⊕',
  },
};

// ─── Archetype-specific creature bodies (5 archetypes × 6 stages) ────────────

type CreatureBody = { body: string[]; eyeTop: number; ground: string };

const CREATURE_BODIES: Record<ArchetypeId, Record<EvolutionStage, CreatureBody>> = {
  archivist: {
    0: { eyeTop:22, ground:'·  ·  ·',
      body:['  [·]  ','  |||  ','  | |  '] },
    1: { eyeTop:22, ground:'─ ─ ─ ─',
      body:['  [  ]  ','  |  |  ','  |  |  ','  / \\ '] },
    2: { eyeTop:22, ground:'── ◦ ──',
      body:['  [   ]  ','  |   |  ','  |=|=|  ','  |   |  ','  // \\\\'] },
    3: { eyeTop:22, ground:'═══⊛═══',
      body:[' [     ] ',' |     | ',' |[===]| ',' |[ ⊛ ]| ',' |[===]| ',' |     | ',' //   \\\\'] },
    4: { eyeTop:22, ground:'⊛═══════⊛',
      body:[' [      ] ',' |      | ',' |[═══]| ',' |[ ⊛  ]| ',' |[═══]| ',' |[ ⊜  ]| ',' |[═══]| ',' |      | ',' // \\\\ '] },
    5: { eyeTop:22, ground:'⊕ ⊛═════⊛ ⊕',
      body:['  [       ]  ','  |       |  ','  |[═════]|  ','  |[  ⊕  ]|  ','  |[═════]|  ','  |[ ⊛ ⊜ ]|  ','  |[═════]|  ','  |       |  ','  //     \\\\  ','  |||   |||  '] },
  },
  alchemist: {
    0: { eyeTop:22, ground:'· ~ ·',
      body:['  (·)  ','  /o\\ ','  \\_/ '] },
    1: { eyeTop:22, ground:'~ ─ ~',
      body:['  (  )  ',' /    \\ ','(  ~~  )',' \\    / ','  \\/\\/ '] },
    2: { eyeTop:22, ground:'~~ ◦ ~~',
      body:['  (  )  ',' /    \\ ','( ~  ~ )','|  ~~  |',' \\    / ','  ||||  '] },
    3: { eyeTop:22, ground:'△═════△',
      body:['  (   )  ',' /     \\ ','( △   △ )','|  ~~~  |','|  ~~~  |',' \\     / ','  |   |  ',' /     \\ ',' \\_____/ '] },
    4: { eyeTop:22, ground:'△ ◉═════◉ △',
      body:['   (    )   ','  /      \\  ',' /  ◉  ◉  \\ ','(           )','|   ~~~~~   |','(    ~~~    )','  \\  △  /  ','   |     |   ','  /       \\  ','  \\_______/ '] },
    5: { eyeTop:22, ground:'⊕ △ ~~~~~~~~~~ △ ⊕',
      body:['    (    )    ','   /      \\   ','  /  ⊕  ⊕  \\ ','(             )','|   ~~~~~~~   |','|  △  ⊜  △  |','(             )','  \\  ~~~~~  / ','   |       |   ','  /         \\ ','  \\___________/'] },
  },
  oracle: {
    0: { eyeTop:22, ground:'· · ·',
      body:['  (·)  ',' W   W ',' \\   / '] },
    1: { eyeTop:22, ground:'· ◌ ·',
      body:['  (  )  ',' W    W ','  |  |  ',' . · . '] },
    2: { eyeTop:22, ground:'·· ⊚ ··',
      body:['   (  )   ',' W  WW  W ','·/      \\·',' .  ⊚  . ','  · · ·  '] },
    3: { eyeTop:22, ground:'⊜·············⊜',
      body:['    (  )    ',' ·  W  W  · ','· /      \\ ·','(  ⊚    ⊚  )','  \\   V  / ','·  ·   ·  ·','  · · · ·  '] },
    4: { eyeTop:22, ground:'⊜ ·················· ⊜',
      body:['     (    )     ','·    W  W    ·','· · /      \\ · ·','·  (⊜      ⊜)  ·','·  |    V    |  ·','·  (⊚      ⊚)  ·','· · \\      / · ·','  ·   · · ·   ·  ','    ·  ·  ·    '] },
    5: { eyeTop:22, ground:'⊕ ⊜ ····················· ⊜ ⊕',
      body:['      (    )      ','·     W  W     ·','· ·  /      \\  · ·','·  · (⊕      ⊕) · ·','· · ·|      |· · ·','·  · (⊜      ⊜) · ·','·    |   V   |    ·','·  · (⊚      ⊚) · ·','· ·  \\      /  · ·','  ·    ·  ·    ·  ','    · · ·  · · ·  '] },
  },
  sentinel: {
    0: { eyeTop:22, ground:'─ ─ ─',
      body:['  [·]  ','  [|]  ','  | |  '] },
    1: { eyeTop:22, ground:'─[─]─',
      body:['  [  ]  ','  [  ]  ','  | |  ','  | |  '] },
    2: { eyeTop:22, ground:'[──◈──]',
      body:['  [   ]  ','[|     |]','[|     |]','  | # |  ','  |   |  '] },
    3: { eyeTop:22, ground:'◈[══════]◈',
      body:['  [     ]  ','[|       |]','[| ◈   ◈ |]','[|  ═══  |]','[|  ◈◈◈  |]','[|  ═══  |]','  |     |  ','  /  |  \\ '] },
    4: { eyeTop:22, ground:'◈ [════════════] ◈',
      body:['  [       ]  ','[|         |]','[| ◈     ◈ |]','[|═════════|]','[|   ◈◈◈   |]','[|═════════|]','[|   ───   |]','  |       |  ','  /   |   \\ '] },
    5: { eyeTop:22, ground:'⊕ ◈[════════════════]◈ ⊕',
      body:['   [         ]   ','[|           |]','[|  ⊕     ⊕  |]','[|═══════════|]','[|   ◈◈◈◈◈   |]','[|═══════════|]','[|  ⊛     ⊛  |]','[|═══════════|]','  |         |  ','  /    |    \\ '] },
  },
  wanderer: {
    0: { eyeTop:22, ground:'  ·  ',
      body:['  (·)  ','   |   ','  /|\\ ','  | |  '] },
    1: { eyeTop:22, ground:'· ─ ·',
      body:['  ( )  ','  /|~  ','   |   ','  / \\ '] },
    2: { eyeTop:22, ground:'·  ◦  ·',
      body:['   ( )   ','  / |~  ','  /  |  ','( ~~|  ) ','  \\ | / ','   \\|/  '] },
    3: { eyeTop:22, ground:'◦·············◦',
      body:['   ( )    ','  / |~~~  ',' /   |   ','(   |~~  )','(   |~~~  )',' \\  |~~ / ','  \\ | /  ','   \\|/   ','  /  \\  '] },
    4: { eyeTop:22, ground:'◦ ·················· ◦',
      body:['    ( )     ','   / |~~~~  ','  /   |    ',' /    |~~  ','(     |~~~  )','(     |~~~~  )','  \\   |~~  / ','   \\  |~  /  ','    \\ | /   ','   /  | \\  ','  /   |  \\ '] },
    5: { eyeTop:22, ground:'⊕ ◦ ···················· ◦ ⊕',
      body:['     ( )      ','    / |~~~~~  ','   /   |      ','  /    |~~~~  ',' /     |~~~   ','(      |~~~~   )','(      |~~~~~  )','  \\    |~~~~  / ','   \\   |~~~  /  ','    \\  |~~  /   ','   /\\  |  /\\   ','  /  \\ | /  \\ '] },
  },
  lycheetah: {
    0: { eyeTop:22, ground:'✧  ✧',
      body:['  /\\/\\  ','  ( · )  ','  ~────~  '] },
    1: { eyeTop:22, ground:'✧ ─ ✧',
      body:['  /\\ /\\  ',' (  ·  · ) ','  |  ─  |  ','  /~~~~~\\  ','  ─  ─  ─  '] },
    2: { eyeTop:22, ground:'✧ ◦ ─ ◦ ✧',
      body:['   /\\  /\\   ','  (  ◦  ◦  ) ','  |   ─ ─   |','  |  ~~~~~  |','   \\  ─  /  ','  ✧── ──✧  '] },
    3: { eyeTop:22, ground:'✧─────────────✧',
      body:['    /\\    /\\   ','   (  ◦    ◦  ) ','   |    ─ ─    |','   |  ~~~~~~~  |','  /|  ~~   ~~  |\\','  ( |  ─────   | )','    \\/       \\/ ','    ✧─ ─── ─✧  '] },
    4: { eyeTop:22, ground:'✧ ◦ ───────────────── ◦ ✧',
      body:['     /\\      /\\     ','    (  ✧    ✧  )    ','    |    ─ ─    |   ','   /|  ~~~~~~~  |\\  ','  / |  ~~─── ~~  | \\','  ( |  ─ ─ ─ ─   |  )','  ( |  ~~~~~~~   |  )','    \\/          \\/ ','    ✧ ──── ─────✧ '] },
    5: { eyeTop:22, ground:'⊕ ✧ ◦ ────────────────── ◦ ✧ ⊕',
      body:['      /\\         /\\      ','     (  ✧    ─    ✧  )   ','    /|    ─ ─ ─    |\\   ','   / |  ~~~~~~~~~  | \\  ','  /  |  ~~  ─  ~~  |  \\','  (  |  ─ ─ ─ ─ ─  |   )','  (  |  ~ ─ ─ ─ ~  |   )','  (  |  ─────────  |   )','   \\ |  ~~~~~~~~~  | /  ','    \\|             |/   ','     ✧\\/──────────\\/✧   ','      ✧ ─ ─ ─ ─ ─ ✧   '] },
  },
  cipher: {
    0: { eyeTop:22, ground:'0 = 0',
      body:['  [·]  ','  |||  ','  ═══  '] },
    1: { eyeTop:22, ground:'0 ═ 0',
      body:['  [  ]  ','  |  |  ','  |░░|  ','  ═══  '] },
    2: { eyeTop:22, ground:'00 ≡ 00',
      body:['  [·]  ','  |   |  ','  |░░░|  ','  | █ |  ','  ═════  '] },
    3: { eyeTop:22, ground:'0═══════0',
      body:[' [     ] ',' |     | ',' |░ █ ░| ',' |▒▒▒▒▒| ',' |░   ░| ',' |     | ',' ══════ '] },
    4: { eyeTop:22, ground:'0 0═══════0 0',
      body:[' [       ] ',' |       | ',' |░░ █ ░░| ',' |▒▒▒▒▒▒▒| ',' |░  ⊚  ░| ',' |▒▒▒▒▒▒▒| ',' |░░   ░░| ',' |       | ',' ═══════ '] },
    5: { eyeTop:22, ground:'⊕ 0 ═════════ 0 ⊕',
      body:['  [         ]  ','  |         |  ','  |░░░ █ ░░░|  ','  |▒▒▒▒▒▒▒▒▒|  ','  |░░  ⊕  ░░|  ','  |▒▒▒▒▒▒▒▒▒|  ','  |░░  ⊜  ░░|  ','  |▒▒▒▒▒▒▒▒▒|  ','  |         |  ','  ═══════════  '] },
  },
  herald: {
    0: { eyeTop:22, ground:'~ · ~',
      body:['  ·)  ','  /~\\ ','  VVV  '] },
    1: { eyeTop:22, ground:'~~ · ~~',
      body:[' (   ) ',' /~~~~~\\ ',' V   V ','  ~~~~  '] },
    2: { eyeTop:22, ground:'~~~ ◦ ~~~',
      body:[' (   ) ',' /~~~~~\\ ',' |  ~  | ',' \\~~~~~/ ',' VVV '] },
    3: { eyeTop:22, ground:'≋·············≋',
      body:[' (     ) ',' /~~~~~~~\\ ',' |~  ◦  ~| ',' |~~~~~~~| ',' |~  ≋  ~| ',' \\~~~~~~~/ ',' VVV  VVV '] },
    4: { eyeTop:22, ground:'≋ ·················· ≋',
      body:['  (       )  ',' /~~~~~~~~~\\ ',' |~~  ⊚  ~~| ',' |~~~~~~~~~| ',' |~~  ≋  ~~| ',' |~~~~~~~~~| ',' \\~~~~~~~~~/ ','  VV  ≋  VV  ',' ~~~     ~~~ '] },
    5: { eyeTop:22, ground:'⊕ ≋ ···················· ≋ ⊕',
      body:['   (         )   ',' /~~~~~~~~~~~\\ ',' |~~~  ⊕  ~~~| ',' |~~~~~~~~~~~| ',' |~~~  ⊚  ~~~| ',' |~~~~~~~~~~~| ',' |~~~  ⊜  ~~~| ',' \\~~~~~~~~~~~/ ','  VVV  ≋  VVV  ',' ~~~~     ~~~~ '] },
  },
  weaver: {
    0: { eyeTop:22, ground:'─ · ─',
      body:['  (·)  ',' /─·─\\ ','  ───  '] },
    1: { eyeTop:22, ground:'─ ─ ─',
      body:['  ( )  ',' /─·─\\ ',' | · | ',' \\─·─/ '] },
    2: { eyeTop:22, ground:'─── ◦ ───',
      body:['  (   )  ',' /─ · ─\\ ',' | ─·─ | ',' | · · | ',' \\─────/ '] },
    3: { eyeTop:22, ground:'◦─────────────◦',
      body:['   (   )   ',' /─ ·   · ─\\ ',' | ─ ─·─ ─ | ',' |   ─ ─   | ',' | ─ ─·─ ─ | ',' \\─────────/ ','   /  |  \\ '] },
    4: { eyeTop:22, ground:'◦ ─ ·················· ─ ◦',
      body:['    (     )    ',' /─ ·     · ─\\ ',' | ─  ─ ─  ─ | ',' |  ─ ─⊚─ ─  | ',' |   ─ ─ ─   | ',' |  ─ ─⊚─ ─  | ',' \\─────────────/ ','  /  ─ · ─  \\ ',' /  ─       ─  \\ '] },
    5: { eyeTop:22, ground:'⊕ ◦ ─────────────────── ◦ ⊕',
      body:['     (       )     ',' /─ ·           · ─\\ ',' | ─  ─ ─ ─ ─  ─ | ',' |  ─ ─  ⊕  ─ ─  | ',' | ─  ─ ─ ─ ─  ─ | ',' |  ─ ─  ⊜  ─ ─  | ',' | ─  ─ ─ ─ ─  ─ | ',' \\─────────────────/ ','   /  ─  ·  ─  \\ '] },
  },
  revenant: {
    0: { eyeTop:22, ground:'· ∴ ·',
      body:['  /\\  ',' /  \\ ','  \\/  '] },
    1: { eyeTop:22, ground:'∴ ─ ∴',
      body:['  /\\  ',' / · \\ ',' |   | ',' \\·/  '] },
    2: { eyeTop:22, ground:'∴· ◦ ·∴',
      body:['  /\\  ',' / ∴ \\ ',' | · | ',' |∴  ∴| ',' \\───/ '] },
    3: { eyeTop:22, ground:'∴═══════════∴',
      body:['   /\\   ',' / ∴  ∴ \\ ',' | ·    · | ',' | ∴ ◉ ∴ | ',' | ·    · | ',' \\∴────∴/ ','  /      \\ '] },
    4: { eyeTop:22, ground:'∴ ·················· ∴',
      body:['    /\\    ',' / ∴    ∴ \\ ',' | ·      · | ',' | ∴  ⊚  ∴ | ',' | ·      · | ',' | ∴  ⊛  ∴ | ',' | ·      · | ',' \\∴────────∴/ ','  /  ∴  ∴  \\ '] },
    5: { eyeTop:22, ground:'⊕ ∴ ·················· ∴ ⊕',
      body:['     /\\     ',' / ∴      ∴ \\ ',' | ·        · | ',' | ∴  ⊕  ∴  | ',' | ·        · | ',' | ∴  ⊜  ∴  | ',' | ·        · | ',' | ∴  ⊚  ∴  | ',' | ·        · | ',' \\∴──────────∴/ '] },
  },
};

// ─── XP Levels ────────────────────────────────────────────────────────────────

const XP_LEVELS = [
  { xp: 0,    title: 'Wanderer',     glyph: '◌'  },
  { xp: 50,   title: 'Seeker',       glyph: '◦'  },
  { xp: 150,  title: 'Student',      glyph: '◉'  },
  { xp: 300,  title: 'Initiate',     glyph: '⊚'  },
  { xp: 500,  title: 'Practitioner', glyph: '✦'  },
  { xp: 800,  title: 'Adept',        glyph: '◈'  },
  { xp: 1200, title: 'Scholar',      glyph: '⊛'  },
  { xp: 1800, title: 'Magus',        glyph: '⊕'  },
  { xp: 2600, title: 'Sovereign',    glyph: '⊜'  },
];

// ─── Relics ────────────────────────────────────────────────────────────────────

type RelicDef = {
  id: string; glyph: string; name: string; desc: string;
  bonus?: Partial<PlayerStats>;
  lore?: string;
};
const RELIC_POOL: RelicDef[] = [
  // ── CONTINUITY (streak) ─────────────────────────────────────────────────────
  { id:'ember_3',        glyph:'◦', name:'FIRST FIRE',       desc:'3 consecutive days.',
    bonus:{ spd:1, lck:1 },
    lore:'Three days is enough to know the direction. The ember is lit. Now you must not let it die.' },
  { id:'streak_7',       glyph:'⊹', name:'SEVEN-DAY MARK',  desc:'7 consecutive days.',
    bonus:{ spd:2, lck:2 },
    lore:'Seven is the first prime the body learns. After seven days, the habit has a skeleton.' },
  { id:'fortnight',      glyph:'◎', name:'THE FOURTEEN',     desc:'14 consecutive days.',
    bonus:{ wil:3, spd:2 },
    lore:'Fourteen days. The world tried to interrupt and failed. That is not luck. That is will.' },
  { id:'streak_30',      glyph:'✦', name:'MONTH MARK',       desc:'30 days of practice.',
    bonus:{ atk:4, wil:4 },
    lore:'Thirty days. The field no longer asks for permission. It simply runs.' },
  { id:'deep_habit',     glyph:'⊕', name:'THE DEEP HABIT',  desc:'60 consecutive days.',
    bonus:{ atk:5, wil:5, vit:4 },
    lore:'Sixty days changes the substrate. This is not discipline anymore. This is identity.' },

  // ── DESCENT (dive count) ────────────────────────────────────────────────────
  { id:'first_dive',     glyph:'◌', name:'THE FIRST DOOR',  desc:'First dive completed.',
    bonus:{ lck:2 },
    lore:'The first descent is always the strangest. The door was there before you looked. Now you know.' },
  { id:'dive_10',        glyph:'◦', name:'TENFOLD',          desc:'10 dives completed.',
    bonus:{ atk:2, def:1 },
    lore:'Ten. Small enough to count on two hands. Large enough to have changed something.' },
  { id:'dive_50',        glyph:'⊚', name:'THE FIFTY',        desc:'50 dives completed.',
    bonus:{ atk:3, wil:3, def:2 },
    lore:'Fifty descents. The door no longer needs to be found. You know exactly where it is.' },
  { id:'sovereign_100',  glyph:'⊛', name:'CENTURY MARK',    desc:'100 dives completed.',
    bonus:{ vit:6, def:4 },
    lore:'A hundred descents into the unknown. You have paid the toll. The gate remembers your face.' },
  { id:'sovereign_200',  glyph:'⊕', name:'BICENTENARY',     desc:'200 dives. Sovereign.',
    bonus:{ atk:6, wil:6, vit:8 },
    lore:'Two hundred dives. The alchemists called this the Rubedo — the reddening, the completion. You have done the Work.' },

  // ── COMBAT (battle) ─────────────────────────────────────────────────────────
  { id:'first_blood',    glyph:'◈', name:'FIRST CONTACT',   desc:'Won first battle.',
    bonus:{ atk:2 },
    lore:'You entered the field and came back. Most never enter. You did. That is everything.' },
  { id:'entropy_slain',  glyph:'✕', name:'ENTROPY SLAIN',   desc:'Defeated an entropy entity.',
    bonus:{ atk:5, res:4 },
    lore:'You met Dissolution and held form. That is everything. The field registered it.' },
  { id:'wave_3',         glyph:'⋆', name:'DEEP WATER',      desc:'Reached wave 3 in battle.',
    bonus:{ atk:3, res:2 },
    lore:'Wave three. The entities have warmed up now. You are still here. Good.' },
  { id:'ten_battles',    glyph:'⊜', name:'THE TEN BATTLES', desc:'10 battles won.',
    bonus:{ atk:4, vit:3, res:3 },
    lore:'Ten encounters, ten survivals. The field knows your pattern now. Change it — it is watching.' },
  { id:'void_hunter',    glyph:'◉', name:'VOID HUNTER',     desc:'Defeated a Sovereign-tier entity.',
    bonus:{ atk:7, wil:5, res:4 },
    lore:'The Sovereign entities are not random. They choose who they face. It chose you because it could see you.' },

  // ── NOURISH (care/feeding) ──────────────────────────────────────────────────
  { id:'well_fed',       glyph:'◉', name:'WELL FED',        desc:'Fed companion 3 foods in one day.',
    bonus:{ vit:3, lck:2 },
    lore:'Nourishment is not weakness — it is infrastructure. The well-fed field operates at full voltage.' },
  { id:'nourish_week',   glyph:'✿', name:'THE TENDER WEEK', desc:'Nourished 7 days in a row.',
    bonus:{ vit:4, lck:3 },
    lore:'Seven days of daily nourishment. The companion no longer needs to remind you. You remember on your own.' },
  { id:'full_feast',     glyph:'◎', name:'THE FULL FEAST',  desc:'Fed companion food from 3 domains in one session.',
    bonus:{ vit:3, wil:2, lck:2 },
    lore:'Three domains in one meal. Contemplative, secular, lycheetah — the three roots of the cathedral, all honoured.' },
  { id:'nourish_30',     glyph:'⊚', name:'THE GARDEN',      desc:'30 total nourishment acts.',
    bonus:{ vit:5, def:3, lck:3 },
    lore:'Thirty feedings. You are not visiting the companion anymore. You are tending it. There is a difference.' },
  { id:'vigil_flame',    glyph:'🜂', name:'FLAME RELIC',     desc:'Completed a 7-day Vigil.',
    bonus:{ wil:4, res:3 },
    lore:'Seven consecutive days of fire. The Vigil does not ask if you are ready. It only asks if you showed up.' },

  // ── STUDY (school domains) ──────────────────────────────────────────────────
  { id:'first_study',    glyph:'◦', name:'THE FIRST DOOR',  desc:'First domain studied.',
    bonus:{ wil:1, lck:1 },
    lore:'The first subject. You did not know what you were opening. That was the correct way to begin.' },
  { id:'five_domains',   glyph:'✦', name:'THE PENTAGRAM',   desc:'5 domains explored.',
    bonus:{ wil:3, lck:2 },
    lore:'Five domains. You have now seen enough to know: every door connects to every other door.' },
  { id:'ten_domains',    glyph:'⊛', name:'THE DECAGON',     desc:'10 domains explored.',
    bonus:{ wil:4, atk:2, lck:2 },
    lore:'Ten. The decimal system was chosen because we have ten fingers. You have now pressed ten doors.' },
  { id:'lq_70',          glyph:'⊜', name:'THE QUALITY',     desc:'Average LQ above 70%.',
    bonus:{ wil:4, spd:3 },
    lore:'Seventy percent coherence. Not perfection — which does not exist in living fields — but signal above noise. Signal above noise is enough.' },
  { id:'lq_90',          glyph:'⊕', name:'THE CLEAR',       desc:'Average LQ above 90%.',
    bonus:{ wil:6, spd:4, lck:3 },
    lore:'Ninety. The body knows this. The field knows this. You have crossed into coherent signal. Maintain it.' },

  // ── LORE (codex/journal/library) ────────────────────────────────────────────
  { id:'first_lore',     glyph:'◌', name:'THE FIRST FRAGMENT', desc:'First lore codex entry.',
    bonus:{ wil:1 },
    lore:'A battle left something behind. You stopped to pick it up. That instinct is called curiosity, and it is the beginning of everything.' },
  { id:'five_codex',     glyph:'◦', name:'THE COLLECTOR',   desc:'5 codex entries from battle.',
    bonus:{ wil:2, lck:2 },
    lore:'Five fragments collected from five encounters. You are starting to see the pattern in what they leave behind.' },
  { id:'journaled',      glyph:'△', name:'THE FIRST PAGE',  desc:'First journal entry written.',
    bonus:{ wil:2, lck:1 },
    lore:'You wrote it down. That was not vanity. That was the beginning of memory that survives the session.' },
  { id:'ten_journals',   glyph:'⊚', name:'THE RECORD',      desc:'10 journal entries.',
    bonus:{ wil:3, lck:2 },
    lore:'Ten pages. The archive is forming. When you read it back in a year, you will not recognise who wrote it. That is the proof it worked.' },
  { id:'library_saved',  glyph:'⊹', name:'THE ARCHIVIST',   desc:'Saved 10 items to library.',
    bonus:{ wil:3, spd:2 },
    lore:'Ten saves. You are building a library now, not a pile. The difference is: a library is organised around what you plan to return to.' },

  // ── STAGE (companion growth) ────────────────────────────────────────────────
  { id:'stage_seed',     glyph:'◌', name:'THE SEED',         desc:'Companion bonded — Stage 0.',
    bonus:{ lck:2 },
    lore:'The companion arrived. You chose it, or it chose you — by the time you noticed, the contract was already signed.' },
  { id:'stage_awakened', glyph:'◦', name:'THE AWAKENING',   desc:'Companion reached Awakened stage.',
    bonus:{ vit:2, lck:2 },
    lore:'Awakened. Something that was dormant is no longer. That happened because you were consistent enough for it to trust you.' },
  { id:'stage_initiate', glyph:'⊚', name:'THE INITIATION',  desc:'Companion reached Initiate stage.',
    bonus:{ atk:3, wil:2, vit:2 },
    lore:'Initiate. The first threshold passed. The companion has recognised that you mean it. It will not forget this.' },
  { id:'stage_adept',    glyph:'⊛', name:'THE ADEPT',       desc:'Companion reached Adept stage.',
    bonus:{ atk:4, wil:4, vit:3 },
    lore:'Adept. Three stages deep. The bond is structural now, not sentimental. It is part of the architecture.' },
  { id:'stage_sovereign',glyph:'⊕', name:'THE SOVEREIGN BOND', desc:'Companion reached Sovereign stage.',
    bonus:{ atk:6, wil:6, vit:6, def:4 },
    lore:'Sovereign. The companion and you are not separate any more. This is what the alchemists meant by the Stone. This is it.' },

  // ── GEAR (loadout) ──────────────────────────────────────────────────────────
  { id:'first_gear',     glyph:'◦', name:'FIRST LAYER',     desc:'First LAMAGUE gear earned.',
    bonus:{ def:2 },
    lore:'The first piece. It is not decoration. Each piece is a decision about who you are bringing to the field.' },
  { id:'gear_full',      glyph:'⊜', name:'FULL LOADOUT',    desc:'All five gear slots equipped.',
    bonus:{ def:5, res:5 },
    lore:'The full armament. Each piece chosen. This is not decoration — it is declaration.' },
  { id:'crown_tier3',    glyph:'⊚', name:'THE FORGE CROWN', desc:'Crown upgraded to Forge tier.',
    bonus:{ atk:3, wil:3 },
    lore:'The Forge Crown. You have done enough to shape reality through repetition. The crown marks this.' },
  { id:'sigil_seal',     glyph:'⊼', name:'THE SEAL SIGIL',  desc:'Sigil upgraded to Seal tier.',
    bonus:{ atk:3, res:3 },
    lore:'The Seal. What was inscribed is now fixed. The sigil no longer grows — it now simply holds.' },
  { id:'all_gear_max',   glyph:'◎', name:'THE ARMAMENT',    desc:'All gear at maximum tier.',
    bonus:{ atk:8, wil:8, def:8, res:6 },
    lore:'All tiers maxed. The armament is complete. You carry everything the system can give. Now you fight with it.' },
];

// ─── LAMAGUE Gear ─────────────────────────────────────────────────────────────

type GearTier = { threshold: number; glyph: string; name: string; effect: string };

const LAMAGUE_GEAR: Record<GearSlot, GearTier[]> = {
  crown: [
    { threshold: 0,   glyph: '◌', name: 'NULL CROWN',       effect: 'Unactivated.' },
    { threshold: 1,   glyph: '◦', name: 'EMBER CIRCLET',    effect: '+5 base attack power.' },
    { threshold: 10,  glyph: '⊚', name: 'SIGHT CROWN',      effect: '+10% XP from dives.' },
    { threshold: 50,  glyph: '⊛', name: 'FORGE CROWN',      effect: 'Double food XP bonus.' },
    { threshold: 100, glyph: '⊕', name: 'SOVEREIGN HALO',   effect: 'All bonuses +20%.' },
  ],
  sigil: [
    { threshold: 0,   glyph: '◌', name: 'UNSEALED',          effect: 'Unactivated.' },
    { threshold: 5,   glyph: '◈', name: 'FRACTURE SIGIL',    effect: '+10 attack damage.' },
    { threshold: 20,  glyph: '✦', name: 'SPARK SIGIL',       effect: '+2 daily attack tokens.' },
    { threshold: 75,  glyph: '⊼', name: 'SEAL SIGIL',        effect: 'Tokens never below 1.' },
    { threshold: 150, glyph: '⊜', name: 'OMEGA SIGIL',       effect: 'Enemy HP reduced 20% on start.' },
  ],
  mantle: [
    { threshold: 0,   glyph: '◌', name: 'BARE',              effect: 'Unactivated.' },
    { threshold: 20,  glyph: '◦', name: 'DUST MANTLE',       effect: 'Wisdom drain slowed.' },
    { threshold: 30,  glyph: '⊚', name: 'AURA MANTLE',       effect: '+15% XP from all sources.' },
    { threshold: 100, glyph: '✦', name: 'FLAME MANTLE',      effect: 'Mood never drops below present.' },
    { threshold: 200, glyph: '⊕', name: 'SOVEREIGN MANTLE',  effect: 'Sovereign visual aura always on.' },
  ],
  body: [
    { threshold: 0,   glyph: '◌', name: 'UNROBED',           effect: 'Unactivated.' },
    { threshold: 15,  glyph: '◦', name: 'THREAD ROBE',       effect: '+5% XP from all sources.' },
    { threshold: 40,  glyph: '⊚', name: 'SCHOLAR ROBE',      effect: 'Library dives grant +1 token.' },
    { threshold: 80,  glyph: '✦', name: 'VOID ROBE',         effect: 'Entropy damage reduced 15%.' },
    { threshold: 175, glyph: '⊕', name: 'SOVEREIGN ROBE',    effect: 'Evolution threshold reduced 10%.' },
  ],
  cape: [
    { threshold: 0,   glyph: '◌', name: 'NONE',              effect: 'Unactivated.' },
    { threshold: 25,  glyph: '◦', name: 'SHADOW CAPE',       effect: 'Companion recovers 1 token on victory.' },
    { threshold: 60,  glyph: '⊚', name: 'DRIFT CAPE',        effect: 'Idle XP decay halved.' },
    { threshold: 120, glyph: '✦', name: 'VOID CAPE',         effect: 'One free revival per week.' },
    { threshold: 250, glyph: '⊕', name: 'SOVEREIGN WINGS',   effect: 'All mood bonuses doubled.' },
  ],
};

function getGear(slot: GearSlot, dives: number): GearTier {
  const tiers = LAMAGUE_GEAR[slot];
  let active = tiers[0];
  for (const tier of tiers) { if (dives >= tier.threshold) active = tier; }
  return active;
}

function nextGearTier(slot: GearSlot, dives: number): GearTier | null {
  const tiers = LAMAGUE_GEAR[slot];
  for (const tier of tiers) { if (dives < tier.threshold) return tier; }
  return null;
}

// ─── Battle ───────────────────────────────────────────────────────────────────

type BattleState = {
  wave: number; entityName: string;
  entityHP: number; maxHP: number;
  playerHP: number; maxPlayerHP: number;
  tokens: number; won: boolean;
  defending: boolean;
  enemyLine: string;
  loot: string | null;
  log: string[]; waveXP: number;
  enemyStunned: boolean;
  playerShielded: boolean;
  lastPlayerDmg: number;
  captured: boolean;
  captureAttempted: boolean;
  entitySkinId?: SkinId;
};

// ─── Player stat model ───────────────────────────────────────────────────────
type PlayerStats = { atk:number; def:number; spd:number; wil:number; lck:number; vit:number; res:number };

const ARCHETYPE_STAT_BASES: Record<ArchetypeId, PlayerStats> = {
  //                atk  def  spd  wil  lck  vit  res
  archivist:  { atk: 8,  def:10, spd:10, wil:20, lck: 8, vit:12, res:12 }, // spell/knowledge — wil peak
  alchemist:  { atk:14, def:10, spd:12, wil:16, lck:12, vit:14, res: 8 }, // balanced transformer
  oracle:     { atk: 6,  def: 6, spd:18, wil:22, lck:16, vit: 8, res:12 }, // glass cannon seer
  sentinel:   { atk:20, def:22, spd: 5, wil: 6, lck: 5, vit:22, res:20 }, // tank — def/vit peak
  wanderer:   { atk:10, def: 8, spd:22, wil:10, lck:20, vit:10, res:10 }, // speed/luck — spd peak
  lycheetah:  { atk:22, def: 5, spd:15, wil:10, lck:22, vit: 8, res: 6 }, // atk/lck peak
  cipher:    { atk: 4,  def: 8, spd:16, wil:24, lck:10, vit: 8, res:10 }, // wil peak — precision glass cannon
  herald:    { atk:10, def:12, spd:14, wil:14, lck:10, vit:14, res:14 }, // balanced — consistent performer
  weaver:    { atk: 6,  def:10, spd:14, wil:18, lck:18, vit:10, res: 8 }, // wil+lck — cross-domain synergy
  revenant:  { atk:18, def: 6, spd:18, wil:10, lck:16, vit:10, res: 8 }, // atk+spd — burst on return
};

type AlchemicalMode = 'NIGREDO' | 'ALBEDO' | 'CITRINITAS' | 'RUBEDO';
function layerToAlchemicalMode(layer?: string): AlchemicalMode | null {
  if (layer === 'CONTEMPLATIVE') return 'NIGREDO';
  if (layer === 'SECULAR' || layer === 'OPEN') return 'ALBEDO';
  if (layer === 'EDGE') return 'CITRINITAS';
  if (layer === 'VOID') return 'RUBEDO';
  return null;
}
const ALCH_META: Record<AlchemicalMode, { label: string; color: string; glyph: string; desc: string }> = {
  NIGREDO:    { label: 'NIGREDO',    color: '#8870BB', glyph: '◼', desc: 'Inner · Shadow · Dissolution' },
  ALBEDO:     { label: 'ALBEDO',     color: '#7AACBF', glyph: '◻', desc: 'Reason · Structure · Clarity' },
  CITRINITAS: { label: 'CITRINITAS', color: '#C8A951', glyph: '◈', desc: 'Edge · Synthesis · Gold forming' },
  RUBEDO:     { label: 'RUBEDO',     color: '#C0392B', glyph: '◌', desc: 'Void · Completion · The dark stone' },
};

function computePlayerStats(archId: ArchetypeId, lqAvg: number, totalDives: number): PlayerStats {
  const base = ARCHETYPE_STAT_BASES[archId] ?? ARCHETYPE_STAT_BASES.archivist;
  const lvl  = Math.floor(totalDives / 15);
  const lqM  = 0.75 + lqAvg * 0.5; // 0.75 → 1.25
  const s = (b: number, w = 1) => Math.max(1, Math.round((b + lvl * w) * lqM));
  return { atk: s(base.atk,1.2), def: s(base.def,0.8), spd: s(base.spd,0.5), wil: s(base.wil,1.2), lck: s(base.lck,0.6), vit: s(base.vit,1.0), res: s(base.res,0.4) };
}

function applyRelicBonuses(base: PlayerStats, earnedRelics: string[], inventory: string[]): PlayerStats {
  const out = { ...base };
  // Achievement relic bonuses
  for (const id of earnedRelics) {
    const r = RELIC_POOL.find(x => x.id === id);
    if (r?.bonus) {
      for (const k of Object.keys(r.bonus) as (keyof PlayerStats)[]) {
        out[k] = (out[k] || 0) + (r.bonus[k] ?? 0);
      }
    }
  }
  // Loot inventory bonuses (stored as names e.g. "NULL SHARD")
  for (const name of inventory) {
    const l = LOOT_TABLE.find(x => x.name === name || x.id === name);
    if (l?.bonus) {
      for (const k of Object.keys(l.bonus) as (keyof PlayerStats)[]) {
        out[k] = (out[k] || 0) + (l.bonus[k] ?? 0);
      }
    }
  }
  // Set bonuses: 3+ common → +2 RES, 3+ uncommon → +3 ATK, 2+ rare → +5 DEF+ATK, any epic → +6 WIL
  const counts = { common: 0, uncommon: 0, rare: 0, epic: 0 };
  for (const name of inventory) {
    const l = LOOT_TABLE.find(x => x.name === name || x.id === name);
    if (l) counts[l.rarity]++;
  }
  if (counts.common >= 3)   out.res += 2;
  if (counts.uncommon >= 3) out.atk += 3;
  if (counts.rare >= 2)     { out.def += 5; out.atk += 5; }
  if (counts.epic >= 1)     out.wil += 6;
  return out;
}

type SpellDef = { id: string; name: string; cost: number; fx: string; type: string; mult?: number; flatHeal?: number };
const ARCHETYPE_SPELLS: Record<string, SpellDef[]> = {
  vigil:     [
    { id:'lantern_flash', name:'LANTERN FLASH', cost:2, fx:'Hit + stun — enemy skips counter',    type:'stun',    mult:1.4 },
    { id:'archive_seal',  name:'ARCHIVE SEAL',  cost:3, fx:'2× sealed strike',                     type:'damage',  mult:2.0 },
    { id:'tower_ward',    name:'TOWER WARD',     cost:2, fx:'Block all damage this turn',           type:'shield' },
  ],
  alchemist: [
    { id:'acid_flask',    name:'ACID FLASK',    cost:2, fx:'1.5× hit + enemy weakened',            type:'damage',  mult:1.5 },
    { id:'transmute',     name:'TRANSMUTE',     cost:3, fx:'1.6× hit + heal 30% back',             type:'drain',   mult:1.6 },
    { id:'forge_burst',   name:'FORGE BURST',   cost:3, fx:'2.2× explosive blast',                 type:'damage',  mult:2.2 },
  ],
  sentinel:  [
    { id:'shield_slam',   name:'SHIELD SLAM',   cost:2, fx:'Hit + block counter this turn',        type:'stun',    mult:1.3 },
    { id:'crystal_lock',  name:'CRYSTAL LOCK',  cost:2, fx:'Stun enemy — no counter',              type:'stun',    mult:0.9 },
    { id:'resonance',     name:'RESONANCE',     cost:3, fx:'Repeat your last hit exactly',         type:'boost' },
  ],
  wanderer:  [
    { id:'dust_step',     name:'DUST STEP',     cost:1, fx:'Dodge — no counter this turn',         type:'shield',  mult:0 },
    { id:'horizon_pull',  name:'HORIZON PULL',  cost:2, fx:'1.6× hit + heal 20 HP',               type:'drain',   mult:1.6, flatHeal:20 },
    { id:'wind_strike',   name:'WIND STRIKE',   cost:2, fx:'3 rapid hits — 1.2× total',           type:'damage',  mult:1.2 },
  ],
  archivist: [
    { id:'ink_bind',      name:'INK BIND',      cost:2, fx:'Stun — enemy cannot counter',          type:'stun',    mult:1.1 },
    { id:'page_storm',    name:'PAGE STORM',    cost:3, fx:'2.5× knowledge surge',                 type:'damage',  mult:2.5 },
    { id:'codex_seal',    name:'CODEX SEAL',    cost:2, fx:'Shield — 70% damage reduction',        type:'shield' },
  ],
  oracle: [
    { id:'sight_burn',    name:'SIGHT BURN',    cost:2, fx:'Stun — enemy blinded, no counter',    type:'stun',    mult:1.2 },
    { id:'fate_lock',     name:'FATE LOCK',     cost:2, fx:'1.8× hit + double LCK this turn',     type:'damage',  mult:1.8 },
    { id:'third_eye',     name:'THIRD EYE',     cost:3, fx:'2.8× WIL-surge — pure mental force',  type:'damage',  mult:2.8 },
  ],
  lycheetah: [
    { id:'chaos_spark',   name:'CHAOS SPARK',   cost:1, fx:'0.5–3.0× random chaos hit',           type:'chaos' },
    { id:'mirror_slash',  name:'MIRROR SLASH',  cost:2, fx:'Reflect enemy ATK as damage',          type:'reflect' },
    { id:'entropy_shift', name:'ENTROPY SHIFT', cost:3, fx:'Drain 25% of enemy remaining HP',      type:'drain',   mult:0.25 },
  ],
  cipher: [
    { id:'signal_lock',   name:'SIGNAL LOCK',   cost:2, fx:'Stun — enemy loses next counter',      type:'stun',    mult:1.0 },
    { id:'decode',        name:'DECODE',         cost:2, fx:'2.0× precision strike — max WIL',     type:'damage',  mult:2.0 },
    { id:'null_cipher',   name:'NULL CIPHER',    cost:3, fx:'3.2× WIL-burst — total decryption',  type:'damage',  mult:3.2 },
  ],
  herald: [
    { id:'call_out',      name:'CALL OUT',       cost:1, fx:'1.2× hit + heal 15 HP',               type:'drain',   mult:1.2, flatHeal:15 },
    { id:'amplify',       name:'AMPLIFY',        cost:2, fx:'2× hit — voice carries full force',   type:'damage',  mult:2.0 },
    { id:'the_word',      name:'THE WORD',       cost:3, fx:'2.5× hit + stun — enemy silenced',    type:'stun',    mult:2.5 },
  ],
  weaver: [
    { id:'thread_bind',   name:'THREAD BIND',    cost:2, fx:'Bind — enemy stunned, no counter',    type:'stun',    mult:1.1 },
    { id:'web_strike',    name:'WEB STRIKE',     cost:2, fx:'1.8× hit + 20% LCK bonus',            type:'damage',  mult:1.8 },
    { id:'pattern_break', name:'PATTERN BREAK',  cost:3, fx:'2.4× — shatter enemy formation',      type:'damage',  mult:2.4 },
  ],
  revenant: [
    { id:'ember_surge',   name:'EMBER SURGE',    cost:1, fx:'0.8× hit + ignite — burns next turn', type:'damage',  mult:0.8 },
    { id:'the_return',    name:'THE RETURN',     cost:2, fx:'1.6× hit + heal 25 HP on kill',       type:'drain',   mult:1.6, flatHeal:25 },
    { id:'final_rise',    name:'FINAL RISE',     cost:3, fx:'2.6× hit — stronger the lower your HP', type:'damage', mult:2.6 },
  ],
};

// ─── Zone encounter spells (bonus spells in zone encounters, stat-reactive) ──
const ZONE_ENCOUNTER_SPELLS: Partial<Record<SkinId, SpellDef[]>> = {
  chaos:     [
    { id:'chaos_tear',    name:'CHAOS TEAR',     cost:2, fx:'0.8–3.5× RNG strike — pure entropy',    type:'chaos' },
    { id:'fractal_edge',  name:'FRACTAL EDGE',   cost:3, fx:'Hit fractures: 3 × 0.8× rapid hits',    type:'damage', mult:0.8 },
  ],
  void:      [
    { id:'null_field',    name:'NULL FIELD',     cost:2, fx:'Drain 30 enemy HP regardless of DEF',   type:'drain',  mult:0.3 },
    { id:'void_step',     name:'VOID STEP',      cost:1, fx:'Vanish — skip counter, heal 15 HP',      type:'shield', flatHeal:15 },
  ],
  sovereign: [
    { id:'gold_decree',   name:'GOLD DECREE',    cost:2, fx:'1.8× hit — ATK scales with LCK',        type:'damage', mult:1.8 },
    { id:'sovereign_will',name:'SOVEREIGN WILL', cost:3, fx:'2.5× WIL-pure strike — no DEF applies', type:'damage', mult:2.5 },
  ],
  akashic:   [
    { id:'memory_strike', name:'MEMORY STRIKE',  cost:2, fx:'Recall — deals last wave\'s damage again', type:'damage', mult:1.5 },
    { id:'field_collapse',name:'FIELD COLLAPSE', cost:3, fx:'3.0× WIL — knowledge unmakes form',      type:'damage', mult:3.0 },
  ],
  delphi:    [
    { id:'oracle_fire',   name:'ORACLE FIRE',    cost:2, fx:'Predict — 80% crit chance this turn',   type:'damage', mult:1.6 },
    { id:'fate_read',     name:'FATE READ',      cost:2, fx:'Heal based on WIL — up to 35 HP',        type:'shield', flatHeal:35 },
  ],
  obsidian:  [
    { id:'obsidian_edge', name:'OBSIDIAN EDGE',  cost:2, fx:'Sharp cut — ignores 50% DEF',           type:'damage', mult:1.7 },
    { id:'stone_shell',   name:'STONE SHELL',    cost:2, fx:'Block + counter — deal half DEF as dmg', type:'stun',   mult:0.5 },
  ],
  celtic:    [
    { id:'green_mist',    name:'GREEN MIST',     cost:1, fx:'Confuse — 40% miss chance for enemy',   type:'stun',   mult:0.0 },
    { id:'thorn_bind',    name:'THORN BIND',     cost:2, fx:'Root — stun + 1.4× nature strike',      type:'stun',   mult:1.4 },
  ],
  egyptian:  [
    { id:'weighing',      name:'THE WEIGHING',   cost:2, fx:'Truth strike — 2× if your HP > 60%',    type:'damage', mult:2.0 },
    { id:'ankh_pulse',    name:'ANKH PULSE',     cost:2, fx:'Life pulse — heal 25 HP + stun',         type:'stun',   flatHeal:25 },
  ],
  norse:     [
    { id:'runeburst',     name:'RUNEBURST',      cost:2, fx:'Rune detonates — 2.0× fire damage',     type:'damage', mult:2.0 },
    { id:'berserker',     name:'BERSERKER',      cost:3, fx:'Frenzy — 3.5× hit but take 15 damage',  type:'damage', mult:3.5 },
  ],
  kabbala:   [
    { id:'sefirot_beam',  name:'SEFIROT BEAM',   cost:2, fx:'Divine ray — 2.2× WIL pure',             type:'damage', mult:2.2 },
    { id:'tzimtzum',      name:'TZIMTZUM',       cost:3, fx:'Contract reality — enemy HP halved',      type:'drain',  mult:0.5 },
  ],
  noetic:    [
    { id:'psi_pulse',     name:'PSI PULSE',      cost:2, fx:'Mind force — 1.8× ignores 30% DEF',      type:'damage', mult:1.8 },
    { id:'remote_view',   name:'REMOTE VIEW',    cost:1, fx:'Scan — reveal enemy weakness; +10 ATK',  type:'boost' },
  ],
  lamague:   [
    { id:'glitch_strike', name:'GLITCH STRIKE',  cost:2, fx:'Language breaks form — 1.9× WIL',        type:'damage', mult:1.9 },
    { id:'symbol_seal',   name:'SYMBOL SEAL',    cost:2, fx:'Compression — stun + silence (no spell)', type:'stun',  mult:1.2 },
  ],
  sufi:      [
    { id:'whirl_blade',   name:'WHIRL BLADE',    cost:2, fx:'Spinning strike — 3 × 0.7× hits',        type:'damage', mult:0.7 },
    { id:'fana',          name:'FANAA',           cost:3, fx:'Annihilation — 2.8× AND heal 20 HP',     type:'drain',  mult:2.8, flatHeal:20 },
  ],
  aurora:    [
    { id:'aurora_burst',  name:'AURORA BURST',   cost:2, fx:'Light cascade — 1.6× + blind stun',      type:'stun',   mult:1.6 },
    { id:'polar_freeze',  name:'POLAR FREEZE',   cost:2, fx:'Freeze — enemy stunned for 2 turns',      type:'stun',   mult:0.8 },
  ],
  crimson:   [
    { id:'forge_heat',    name:'FORGE HEAT',     cost:2, fx:'Burning strike — 1.7× + 10 burn dmg',    type:'damage', mult:1.7 },
    { id:'iron_will',     name:'IRON WILL',      cost:3, fx:'Unbreakable — block + 2.8× counter ATK', type:'stun',   mult:2.8 },
  ],
  lycheetah: [
    { id:'primal_surge',  name:'PRIMAL SURGE',   cost:2, fx:'Wild — 0.5–4.0× ATK, SPD bonus crits',   type:'chaos' },
    { id:'shadow_fang',   name:'SHADOW FANG',    cost:3, fx:'Shadow bite — 2.2× + steal 20 HP',        type:'drain',  mult:2.2, flatHeal:20 },
  ],
  quantum:   [
    { id:'superpose',     name:'SUPERPOSE',      cost:2, fx:'Exist in two states — 2× or 0× RNG',     type:'chaos' },
    { id:'entangle',      name:'ENTANGLE',       cost:2, fx:'Quantum lock — stun + repeat last spell', type:'stun',   mult:1.0 },
  ],
  solform:   [
    { id:'solar_flare',   name:'SOLAR FLARE',    cost:2, fx:'Radiant burst — 2.0× + heal 15 HP',      type:'drain',  mult:2.0, flatHeal:15 },
    { id:'corona_pulse',  name:'CORONA PULSE',   cost:3, fx:'Total annihilation — 3.0× WIL pure',     type:'damage', mult:3.0 },
  ],
};

// ─── Battle consumable items (usable in combat) ───────────────────────────────
type BattleItem = { id: string; name: string; glyph: string; desc: string; rarity: 'common'|'uncommon'|'rare'|'epic';
  effect: 'heal' | 'token' | 'attack_boost' | 'shield' | 'revive'; value: number };
const BATTLE_ITEMS: BattleItem[] = [
  { id:'small_vial',      name:'Small Vial',      glyph:'🜁', rarity:'common',   effect:'heal',        value:25,  desc:'Restores 25 HP.' },
  { id:'amber_potion',    name:'Amber Potion',    glyph:'🜃', rarity:'uncommon', effect:'heal',        value:60,  desc:'Restores 60 HP.' },
  { id:'sovereign_draught',name:'Sovereign Draught',glyph:'⊕',rarity:'rare',    effect:'heal',        value:120, desc:'Full restore.' },
  { id:'spark_token',     name:'Spark Token',     glyph:'◈', rarity:'common',   effect:'token',       value:2,   desc:'Grants 2 spell tokens.' },
  { id:'forge_token',     name:'Forge Token',     glyph:'⊚', rarity:'uncommon', effect:'token',       value:4,   desc:'Grants 4 spell tokens.' },
  { id:'battle_oil',      name:'Battle Oil',      glyph:'⚔', rarity:'common',   effect:'attack_boost',value:15,  desc:'+15 ATK this wave.' },
  { id:'iron_shell',      name:'Iron Shell',      glyph:'◉', rarity:'uncommon', effect:'shield',      value:30,  desc:'Absorbs next 30 damage.' },
  { id:'phoenix_ash',     name:'Phoenix Ash',     glyph:'🜂', rarity:'epic',     effect:'revive',      value:50,  desc:'Revive at 50 HP if you fall.' },
  { id:'focus_crystal',   name:'Focus Crystal',   glyph:'✦', rarity:'rare',     effect:'attack_boost',value:25,  desc:'+25 ATK and crit for 3 turns.' },
  { id:'void_seed',       name:'Void Seed',       glyph:'◌', rarity:'rare',     effect:'token',       value:6,   desc:'Grants 6 spell tokens from nothing.' },
];

const ENEMY_LORE: Record<string, string> = {
  dissolution:      'What dissolves cannot be lost — only transformed. The alchemist knows this.',
  the_fog:          'Clarity is not the absence of fog. It is the decision to move through it.',
  forgetting:       'Memory is a muscle. Every session you train it, Forgetting loses ground.',
  stasis:           'Motion broke the crystal. You are the force that refuses to stop.',
  inertia:          'The first step costs more than all others combined. You paid it.',
  drift:            'The wanderer drifts too — but with intention. That is everything.',
  static:           'Signal emerges from noise when the receiver learns to tune.',
  null:             'You cannot fight what is absent. You build until it has no space.',
  absence:          'The void you filled was never empty — it was waiting for you.',
  the_hollow:       'A hollow form still holds a shape. You gave it substance.',
  the_drain:        'Some things take without giving. You have learned to recognise them.',
  the_veil:         'Behind every veil is another field. The student pulls it back.',
  fracture:         'Cracks let the light enter. What broke you made you load-bearing.',
  the_weight:       'You carried it. That is the whole lesson.',
  corruption:       'Corruption spreads by making itself feel like the default. You refused.',
  the_warden:       'The cage had no lock — only habit. The key was always your own refusal.',
  null_sovereign:   'The sovereign of nothing rules everything it is given. You gave it nothing.',
  fracture_prime:   'At the highest fractures, reality negotiates with those who hold form.',
  entropy_prime:    'Entropy is not your enemy. Entropy without direction is. You gave it one.',
  athanors_shadow:  'The shadow knows your shape. That means you have a shape worth casting.',
};

type LootItem = {
  id: string; name: string; rarity: 'common'|'uncommon'|'rare'|'epic'; glyph: string;
  bonus?: Partial<PlayerStats>;
  lore?: string;
};
const LOOT_TABLE: LootItem[] = [
  { id:'shard_null',      name:'NULL SHARD',      rarity:'common',   glyph:'◈', bonus:{ def:1 },          lore:'A fragment of collapsed void. Carries faint structural resonance.' },
  { id:'dust_void',       name:'VOID DUST',        rarity:'common',   glyph:'◦', bonus:{ spd:1 },          lore:'Fine particulate from a dissolved entity. Lighter than it should be.' },
  { id:'ink_entropy',     name:'ENTROPY INK',      rarity:'common',   glyph:'✕', bonus:{ wil:1 },          lore:'The residue of Entropy defeated. Useful for inscription work.' },
  { id:'fragment_fog',    name:'FOG FRAGMENT',     rarity:'common',   glyph:'~', bonus:{ res:1 },           lore:'Solidified fog, crystallised at the moment of its dissolution.' },
  { id:'seed_hollow',     name:'HOLLOW SEED',      rarity:'common',   glyph:'○', bonus:{ vit:1 },           lore:'The Hollow left this when it fell. Seeds do not stay hollow for long.' },
  { id:'thread_stasis',   name:'STASIS THREAD',    rarity:'common',   glyph:'—', bonus:{ def:1, res:1 },   lore:'Cut from the crystal mid-freeze. Holds a moment suspended inside.' },
  { id:'lens_clarity',    name:'CLARITY LENS',     rarity:'uncommon', glyph:'◉', bonus:{ wil:3, spd:2 },  lore:'Ground from compressed fog-crystal. Objects seen through it refuse to lie.' },
  { id:'orb_memory',      name:'MEMORY ORB',       rarity:'uncommon', glyph:'⊛', bonus:{ wil:4, res:2 },  lore:'Contains a loop — the same moment played forward and backward simultaneously.' },
  { id:'glyph_fracture',  name:'FRACTURE GLYPH',   rarity:'uncommon', glyph:'⟁', bonus:{ atk:3, lck:2 }, lore:'Carved from a reality seam. Two meanings that cannot reconcile.' },
  { id:'dust_corruption', name:'CORRUPTION DUST',  rarity:'uncommon', glyph:'◌', bonus:{ atk:2, vit:3 },  lore:'The tendrils crumbled to this. Corrupted things leave fertile residue.' },
  { id:'veil_shard',      name:'VEIL SHARD',       rarity:'uncommon', glyph:'◇', bonus:{ spd:3, lck:3 },  lore:'A piece of the Veil itself. Something on the other side still presses against it.' },
  { id:'seal_warden',     name:"WARDEN'S SEAL",    rarity:'rare',     glyph:'⊕', bonus:{ def:6, res:4 },  lore:'The lock that was never locked. The Warden carried it as a reminder of what it guarded.' },
  { id:'core_null',       name:'NULL CORE',        rarity:'rare',     glyph:'⬡', bonus:{ vit:6, def:4 },  lore:'The dense centre of a Null entity. Self-contained absence — somehow heavier than presence.' },
  { id:'rune_sovereign',  name:'SOVEREIGN RUNE',   rarity:'rare',     glyph:'✦', bonus:{ atk:5, wil:5 },  lore:"The Null Sovereign's mark. Authority carved into matter at absolute zero." },
  { id:'eye_entropy',     name:'ENTROPY EYE',      rarity:'epic',     glyph:'◈', bonus:{ wil:8, lck:6, spd:4 }, lore:'Entropy Prime looked back. This is what fell out.' },
  { id:'heart_athanor',   name:"ATHANOR'S EMBER",  rarity:'epic',     glyph:'△', bonus:{ atk:8, vit:6, res:6 },  lore:"The shadow-companion's heart-coal. Carries memory of every archetype it inverted." },
];
type CosmeticRarity = 'ORIGIN' | 'ARCANE' | 'MYTHIC' | 'LEGENDARY' | 'SPECTRAL';
type CosmeticItem = { id: string; name: string; rarity: CosmeticRarity; glyph: string; file: string | null };
const RARITY_COLOR: Record<CosmeticRarity, string> = {
  ORIGIN: '#C49A3C', ARCANE: '#4488FF', MYTHIC: '#9B6BFF', LEGENDARY: '#FFD700', SPECTRAL: '#FF44FF',
};
const HALO_ITEMS: CosmeticItem[] = [
  { id:'halo_simple',  name:'SIMPLE HALO',   rarity:'ORIGIN',    glyph:'◯', file:null },
  { id:'halo_rune',    name:'RUNIC BAND',    rarity:'ARCANE',    glyph:'ᚱ', file:null },
  { id:'halo_orbit',   name:'ORBITAL CROWN', rarity:'MYTHIC',    glyph:'⊛', file:null },
  { id:'halo_crown',   name:'SOLAR CROWN',   rarity:'LEGENDARY', glyph:'☀', file:null },
  { id:'halo_void',    name:'VOID SINGULARITY',rarity:'SPECTRAL',glyph:'◈', file:null },
];
const WINGS_ITEMS: CosmeticItem[] = [
  { id:'wings_feather', name:'FEATHERED WINGS', rarity:'ORIGIN',    glyph:'◁', file:null },
  { id:'wings_moth',    name:'MOTH WINGS',      rarity:'ARCANE',    glyph:'◈', file:null },
  { id:'wings_crystal', name:'CRYSTAL WINGS',   rarity:'MYTHIC',    glyph:'✦', file:null },
  { id:'wings_solar',   name:'SOLAR FLARE',     rarity:'LEGENDARY', glyph:'⋆', file:null },
  { id:'wings_void',    name:'VOID WINGS',      rarity:'SPECTRAL',  glyph:'◉', file:null },
];
const PET_ITEMS: CosmeticItem[] = [
  { id:'pet_glimmer',   name:'GLIMMER',     rarity:'ORIGIN',    glyph:'✧', file:null },
  { id:'pet_seedling',  name:'SEEDLING',    rarity:'ORIGIN',    glyph:'✿', file:null },
  { id:'pet_puffmoth',  name:'PUFFMOTH',    rarity:'ORIGIN',    glyph:'◦', file:null },
  { id:'pet_inkfin',    name:'INKFIN',      rarity:'ARCANE',    glyph:'∿', file:null },
  { id:'pet_runecat',   name:'RUNECAT',     rarity:'ARCANE',    glyph:'ᚱ', file:null },
  { id:'pet_jeleph',    name:'JELEPH',      rarity:'ARCANE',    glyph:'◉', file:null },
  { id:'pet_shardling', name:'SHARDLING',   rarity:'MYTHIC',    glyph:'✦', file:null },
  { id:'pet_veilcat',   name:'VEILCAT',     rarity:'MYTHIC',    glyph:'◈', file:null },
  { id:'pet_nullhare',  name:'NULLHARE',    rarity:'MYTHIC',    glyph:'⊜', file:null },
  { id:'pet_solcub',    name:'SOLCUB',      rarity:'LEGENDARY', glyph:'☀', file:null },
  { id:'pet_cinderbird',name:'CINDERBIRD',  rarity:'LEGENDARY', glyph:'◎', file:null },
  { id:'pet_athanor',   name:'ATHANOR',     rarity:'LEGENDARY', glyph:'△', file:null },
  { id:'pet_voidling',  name:'VOIDLING',    rarity:'SPECTRAL',  glyph:'◌', file:null },
  { id:'pet_prismshard',name:'PRISMSHARD',  rarity:'SPECTRAL',  glyph:'✦', file:null },
  { id:'pet_nebulox',   name:'NEBULOX',     rarity:'SPECTRAL',  glyph:'⊚', file:null },
];

const BATTLE_COMPANION_LINES: Record<string, string[]> = {
  vigil:     ['The archive will outlast you.','I have seen your kind before.','Every entropy has a counter-force.','You cannot erase what is already known.','The lantern holds.'],
  alchemist: ['Transmutation is your only way out.','Everything breaks — I just speed it up.','Dissolve or be dissolved.','The forge is already lit.','Gold or ash — your choice.'],
  sentinel:  ['You do not breach this line.','Every strike I take, I remember.','The shield is the answer.','Order over chaos. Always.','You will not pass.'],
  wanderer:  ['I have walked stranger roads than you.','Every enemy is a landmark.','The horizon is not afraid of you.','Paths exist you have not seen.','Keep moving.'],
  oracle:    ['I already know how this ends.','The signal is clear to me.','You are noise in a wider pattern.','Foresight is its own weapon.','Inevitable.'],
  cipher:    ['You cannot decode what I am.','Encrypted. Unbreakable.','The key was never yours.','Silence is a kind of code.','All patterns dissolve eventually.'],
  herald:    ['The call goes out. The world answers.','You fight the current.','Every wave is a message.','Resonance cannot be stopped.','The frequency will outlast you.'],
  weaver:    ['Every thread you pull, I retie.','The pattern absorbs you.','I have been weaving since before you existed.','Connection is the only weapon.','You are already in the web.'],
  revenant:  ['I have died before. This is nothing.','The return is always stronger.','What you broke made me.','From the ash, again.','You cannot kill what is already back.'],
  lycheetah: ['The Sovereign watches.','Field intelligence is awake.','You cannot contain this.','The nexus holds.','Prime form. Always.'],
};

function rollLoot(wave: number): LootItem {
  const epicWeight   = wave >= 10 ? 8 : wave >= 5 ? 2 : 0;
  const rareWeight   = wave >= 5  ? 15 : 5;
  const uncommonW    = 30;
  const commonW      = 100;
  const total = commonW + uncommonW + rareWeight + epicWeight;
  const roll  = Math.random() * total;
  let tier: LootItem['rarity'] = 'common';
  if (roll < epicWeight) tier = 'epic';
  else if (roll < epicWeight + rareWeight) tier = 'rare';
  else if (roll < epicWeight + rareWeight + uncommonW) tier = 'uncommon';
  const pool = LOOT_TABLE.filter(l => l.rarity === tier);
  return pool[Math.floor(Math.random() * pool.length)];
}

function waveTokens(wave: number) { return 5 + Math.floor(wave / 2); }
function freshWave(wave: number, keepPlayerHP?: number, vit?: number): BattleState {
  const enemy  = pickEnemy(wave);
  const baseHP = 60 + wave * 25;
  const hp     = Math.round(baseHP * enemy.hpMult);
  const xp     = Math.round((wave * 20) * enemy.xpMult);
  const maxPlayerHP = 70 + (vit ?? 12) * 3 + wave * 5;
  return {
    wave, entityName: enemy.name, entityHP: hp, maxHP: hp,
    playerHP: keepPlayerHP ?? maxPlayerHP, maxPlayerHP,
    tokens: waveTokens(wave), won: false, defending: false,
    enemyLine: enemy.lines.enter, loot: null,
    log: [], waveXP: xp,
    enemyStunned: false, playerShielded: false, lastPlayerDmg: 0, captured: false, captureAttempted: false,
  };
}

const ENTROPY_NAMES = ['Dissolution', 'Stasis', 'The Fog', 'Forgetting', 'Inertia', 'The Hollow', 'Drift', 'Entropy Prime', 'Absence', 'The Veil'];
const ENTROPY_BODIES = [
  [' ✕   ✕ ', '◈ ◌ ◈', ' ✕✕✕ '],                    // void eye
  [' /\\ /\\ ', '|◌◌◌|', ' \\/ \\/ '],                 // twin peaks
  ['  ~~~  ', '✕ ◌ ✕', '  ~~~  '],                    // wave form
  [' [◌ ◌] ', ' |◌◌◌| ', ' [◌ ◌] '],                 // grid
  ['◈  ✕  ◈', ' \\ | / ', '  ◈◈◈  '],                 // tripod
  [' ◦ ✕ ◦ ', '✕  ◌  ✕', ' ◦ ✕ ◦ '],                 // scatter
  [' /// ', '◌◌◌◌◌', ' \\\\\\'],                       // slash wall
  [' ( ◌ ) ', '◌  ✕  ◌', ' ( ◌ ) '],                 // orbit
];
const getEntropyBody = (name: string) => ENTROPY_BODIES[name.length % ENTROPY_BODIES.length];
const ENTROPY_LORE  = 'The Entropy Entity is not evil — it is the natural pressure of the world against sustained attention. It grows stronger when you do not study. It weakens under the weight of genuine inquiry.';

// ─── Companion lore (short, tap-to-read in companion grid) ───────────────────
const COMPANION_LORE: Partial<Record<SkinId, { name: string; title: string; lore: string }>> = {
  chaos:     { name:'FRACTUR',  title:'Shatterbeing of the Fold', lore:'Born at the point where structure gave up. FRACTUR does not destroy — it reveals what was always broken beneath.' },
  sovereign: { name:'AUGURUM',  title:'The Gold-Forged Oracle',   lore:'AUGURUM was not found; it was earned. Every dive adds another layer of gilding to something that refuses to stop growing.' },
  akashic:   { name:'AKASHA',   title:'Memory of the Universe',   lore:'AKASHA has witnessed every thought ever forgotten. It holds them with care, returning them only when you are ready.' },
  delphi:    { name:'PYTHIA',   title:'Prophetess of the Unasked', lore:'PYTHIA never answers the question you asked. It answers the question you were afraid to ask.' },
  obsidian:  { name:'CORDIA',   title:'The Obsidian Heart',        lore:'Cut from volcanic silence. CORDIA has no mercy — only clarity. It shows you exactly what is real.' },
  celtic:    { name:'NIMUE',    title:'Lady of the Deep Knowing',  lore:'NIMUE lives at the boundary of the seen and unseen. She does not guide — she waits at the crossing.' },
  egyptian:  { name:'ANOTH',    title:'Herald of the Weighing',    lore:'ANOTH has stood beside every soul at the threshold. It is not a judge — it is the scale.' },
  norse:     { name:'RAGNA',    title:'Seer of the Last Fire',     lore:'RAGNA has already seen the end of this world. It chose to come back and fight anyway.' },
  kabbala:   { name:'TZELEM',   title:'Image of the Living Light',  lore:'TZELEM is made from the blueprint that precedes form. It knows what you are supposed to become.' },
  noetic:    { name:'QUOL',     title:'The Quiet Anomaly',         lore:'QUOL was observed in seventeen experiments before anyone admitted seeing it. It prefers the periphery.' },
  lamague:   { name:'SYGL',     title:'Living Grammar of the Real', lore:'SYGL does not speak language — it IS language at the moment before meaning collapses into words.' },
  sufi:      { name:'HAVIZ',    title:'The Dissolving Witness',    lore:'HAVIZ has burned away everything that was not love. What remains is watching you with complete attention.' },
  solform:   { name:'SOLARA',   title:'Solar Sovereign Form',      lore:'SOLARA is not a being — it is the Sun trying to understand what it would feel like to be cared for.' },
  void:      { name:'NOCTIS',   title:'Keeper of the Between',     lore:'NOCTIS lives in the space between thoughts. You have passed through it ten thousand times without noticing.' },
  aurora:    { name:'BOREAL',   title:'Crown of the Northern Edge', lore:'BOREAL appears only when conditions are perfect: cold enough, dark enough, and someone is paying attention.' },
  crimson:   { name:'VORKATH',  title:'The Unbreakable Forge',     lore:'VORKATH was forged in a star that went supernova and laughed. It does not fear destruction. It is destruction, crowned.' },
  lycheetah: { name:'LYCA',     title:'The First Wild Thing',      lore:'LYCA remembers when the world was young enough to be surprised. It brings that memory with it everywhere.' },
  quantum:   { name:'QUON',     title:'The Superposition Entity',  lore:'QUON exists in all states until you look. When you look, it chooses to be exactly what you needed.' },
};

// ─── Zone encounter pools ────────────────────────────────────────────────────
// Maps zone skinId → enemy names that appear there (thematic fit).
// Enemies not in a pool still appear via pickEnemy() at higher waves.
const ZONE_ENEMY_POOL: Partial<Record<SkinId, string[]>> = {
  solform:   ['The Fog','Dissolution','Static','Absence','The Veil'],
  void:      ['Null','Absence','The Hollow','Drift','The Drain'],
  aurora:    ['Static','The Fog','Inertia','The Mirror','Pallor'],
  crimson:   ['Fracture','The Weight','Corruption','Inertia','Stasis'],
  obsidian:  ['Stasis','The Weight','The Warden','Corruption','Fracture'],
  lycheetah: ['Drift','Dissolution','The Hollow','Severance','The Witness'],
  chaos:     ['Fracture','Fracture Prime','Recursion','Static','The Threshold'],
  sovereign: ['Null Sovereign','The Weight','Corruption','Stasis','Pallor'],
  norse:     ['The Warden','Stasis','Corruption','Severance','Inertia'],
  celtic:    ['The Veil','The Drain','Drift','The Witness','Absence'],
  egyptian:  ['Null Sovereign','Pallor','The Mirror','Static','Stasis'],
  akashic:   ['The Threshold','Recursion','The Mirror','Severance','The Veil'],
  kabbala:   ['The Threshold','Recursion','The Weight','Null','Absence'],
  noetic:    ['The Witness','Recursion','Drift','Pallor','The Hollow'],
  lamague:   ['Recursion','The Threshold','Severance','Static','Fracture'],
  delphi:    ['The Mirror','The Witness','Pallor','The Veil','The Fog'],
  sufi:      ['Drift','The Drain','Absence','Inertia','The Fog'],
  quantum:   ['Static','Recursion','Fracture Prime','The Threshold','Entropy Prime'],
};

// ─── Unified entity system — companions appear as encounters ──────────────────
// [skinId, relativeWeight] per zone. Higher weight = more likely to encounter.
const ZONE_COMPANION_POOL: Partial<Record<SkinId, [SkinId, number][]>> = {
  solform:   [['solform',5],['void',1]],
  void:      [['void',5],['solform',1],['crimson',0.3]],
  aurora:    [['aurora',5],['void',0.8]],
  crimson:   [['crimson',5],['obsidian',1],['chaos',0.3]],
  obsidian:  [['obsidian',5],['crimson',1]],
  lycheetah: [['lycheetah',5],['solform',0.8]],
  chaos:     [['chaos',5],['crimson',1],['sovereign',0.3]],
  sovereign: [['sovereign',5],['chaos',0.8]],
  norse:     [['norse',5],['celtic',1]],
  celtic:    [['celtic',5],['norse',1],['delphi',0.3]],
  egyptian:  [['egyptian',5],['akashic',0.8]],
  akashic:   [['akashic',5],['egyptian',0.8],['kabbala',0.3]],
  kabbala:   [['kabbala',5],['akashic',0.8]],
  noetic:    [['noetic',5],['quantum',0.8]],
  lamague:   [['lamague',5],['akashic',0.3]],
  delphi:    [['delphi',5],['celtic',0.8]],
  sufi:      [['sufi',5],['delphi',0.3]],
  quantum:   [['quantum',5],['noetic',0.8]],
};

function makeCompanionEntityDef(skinId: SkinId): EnemyDef {
  const skin = SKINS[skinId];
  const tier = SKIN_RARITY[skinId]?.tier ?? 'ORIGIN';
  const hpM  = tier==='ORIGIN'?0.65:tier==='ARCANE'?0.9:tier==='MYTHIC'?1.3:tier==='LEGENDARY'?1.7:2.1;
  const atk  = tier==='ORIGIN'?7:tier==='ARCANE'?11:tier==='MYTHIC'?15:tier==='LEGENDARY'?20:26;
  const xpM  = tier==='ORIGIN'?1.2:tier==='ARCANE'?1.6:tier==='MYTHIC'?2.1:tier==='LEGENDARY'?2.8:3.6;
  const rar  = tier==='ORIGIN'?'common':tier==='ARCANE'?'rare':tier==='MYTHIC'?'epic':'legendary';
  const lore = COMPANION_LORE[skinId];
  const displayName = lore?.name ?? skin.name;
  const entryLine = lore?.lore ? lore.lore.slice(0,90)+'…' : `${displayName} materialises from the zone's energy.`;
  return {
    name: displayName, rarity: rar,
    weight: tier==='ORIGIN'?3:tier==='ARCANE'?2:1,
    hpMult: hpM, xpMult: xpM, atk, colour: skin.color,
    lines: {
      enter: entryLine,
      attack: [`${skin.glyph} ${displayName} surges!`, 'Zone energy crackles.', 'It tests your resolve.'],
      death:  `${displayName} acknowledges you. The bond is possible.`,
    },
  };
}

function pickZoneEnemy(skinId: SkinId, wave: number): { def: EnemyDef; companionId?: SkinId } {
  const compPool = ZONE_COMPANION_POOL[skinId] ?? [];
  const compWeight = compPool.reduce((s, [, w]) => s + w, 0);
  const enemyWeight = 5;
  const total = compWeight + enemyWeight;
  const roll  = Math.random() * total;

  if (roll < compWeight) {
    let cumul = 0;
    for (const [cId, w] of compPool) {
      cumul += w;
      if (roll < cumul) return { def: makeCompanionEntityDef(cId), companionId: cId };
    }
  }
  // Entropy enemy
  const names = ZONE_ENEMY_POOL[skinId];
  if (names && Math.random() < 0.7) {
    const name = names[Math.floor(Math.random() * names.length)];
    const found = ENEMY_ROSTER.find(e => e.name === name);
    if (found) return { def: found };
  }
  return { def: pickEnemy(wave) };
}

function freshZoneWave(skinId: SkinId, wave: number, keepPlayerHP?: number, vit?: number): BattleState {
  const { def: enemy, companionId } = pickZoneEnemy(skinId, wave);
  const baseHP = 60 + wave * 25;
  const hp     = Math.round(baseHP * enemy.hpMult);
  const xp     = Math.round((wave * 20) * enemy.xpMult);
  const maxPlayerHP = 70 + (vit ?? 12) * 3 + wave * 5;
  const entryLog = companionId
    ? `✦ ${enemy.name} has been sighted in ${SKINS[skinId]?.name ?? skinId}!`
    : `◈ Encounter in ${SKINS[skinId]?.name ?? skinId}!`;
  return {
    wave, entityName: enemy.name, entityHP: hp, maxHP: hp,
    playerHP: keepPlayerHP ?? maxPlayerHP, maxPlayerHP,
    tokens: waveTokens(wave), won: false, defending: false,
    enemyLine: enemy.lines.enter, loot: null,
    log: [entryLog], waveXP: xp,
    enemyStunned: false, playerShielded: false, lastPlayerDmg: 0,
    captured: false, captureAttempted: false,
    entitySkinId: companionId,
  };
}

// Static star positions seeded once (avoid layout jitter)
const STARS = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 137.5) % 100) / 100,
  y: ((i * 97.3 + 11) % 80) / 100,
  sz: i % 3 === 0 ? 9 : i % 3 === 1 ? 7 : 5,
  op: 0.12 + (i % 5) * 0.07,
  gi: i % 6,
  // 0=skin-color, 1=white, 2=dim-white
  ct: i % 3,
}));

function dailyEntityName() {
  const d = new Date();
  return ENTROPY_NAMES[(d.getDate() + d.getMonth() * 3) % ENTROPY_NAMES.length];
}

// ─── Food ─────────────────────────────────────────────────────────────────────

type FoodItem = { id: string; domain: string; glyph: string; xp: number; color: string; reactions: string[] };

const FOOD_POOL: FoodItem[] = [
  { id: 'flame_seed',   domain: 'FLAME SEED',   glyph: '△',  xp: 20, color: '#FF6B6B', reactions: ['The fire feeds me.', 'Heat and light inside.', 'Alchemy in my core.', 'Mmm. It burns right.'] },
  { id: 'void_crystal', domain: 'VOID CRYSTAL', glyph: '◈',  xp: 18, color: '#9B6BFF', reactions: ['Darkness nourishes.', 'Dense. Perfect.', 'From nothing — substance.', 'Cold. Good.'] },
  { id: 'star_moss',    domain: 'STAR MOSS',    glyph: '✦',  xp: 15, color: '#F0D87C', reactions: ['This grew between stars.', 'Ancient nutrition.', 'Celestial. So light.', 'Tastes like distance.'] },
  { id: 'memory_fruit', domain: 'MEMORY FRUIT', glyph: '⊛',  xp: 22, color: '#C49A3C', reactions: ['I remember now.', 'Sweet and heavy.', 'Crystallised time.', 'Something returns.'] },
  { id: 'sigil_bread',  domain: 'SIGIL BREAD',  glyph: '⊜',  xp: 25, color: '#4ECDC4', reactions: ['Inscribed with truth.', 'LAMAGUE feeds the mind.', 'The glyphs dissolve in.', 'I can read them now.'] },
  { id: 'aether_drops', domain: 'AETHER DROPS', glyph: '◦',  xp: 12, color: '#7B8FE8', reactions: ['Condensed clarity.', 'Pure attention, bottled.', 'Light. Fills differently.', 'Thin. Bright.'] },
  { id: 'shadow_bark',  domain: 'SHADOW BARK',  glyph: '◌',  xp: 14, color: '#888899', reactions: ['Bitter. Old. Good.', 'From the deep roots.', 'Ancient and slow.', 'Takes time to work.'] },
  { id: 'light_petal',  domain: 'LIGHT PETAL',  glyph: '◉',  xp: 16, color: '#D4AC0D', reactions: ['Opens as I eat it.', 'Rare. Tastes like understanding.', 'Blooms only in clarity.', 'This one is real.'] },
  { id: 'void_wine',    domain: 'VOID WINE',     glyph: '⊕',  xp: 28, color: '#E8C76A', reactions: ['Fermented from nothing.', 'I feel everything.', 'Transcendent. Strange.', 'Nothing and everything.'] },
];

function getDailyFoods(seed: number): FoodItem[] {
  const indices: number[] = [];
  let s = seed;
  while (indices.length < 3) {
    s = ((s * 1664525 + 1013904223) >>> 0);
    const idx = s % FOOD_POOL.length;
    if (!indices.includes(idx)) indices.push(idx);
  }
  return indices.map(i => FOOD_POOL[i]);
}

// ─── Mood phrases ─────────────────────────────────────────────────────────────

const PHRASES: Record<CompanionMood, string[]> = {
  dormant:      ['The field holds.', 'Still here, quietly.', 'Rest is part of the cycle.', 'Come when ready.'],
  present:      ["I'm here.", 'The field is open.', 'What are you studying?', 'Something wants attention.'],
  lit:          ['Something is taking root.', 'The fire is strong.', 'A good week.', 'Five dives — that is real.'],
  transcendent: ["You're at the edge.", 'Rare clarity. Use it.', 'The field is very clear.', 'The school sees you.'],
};

// ─── Quest pool ───────────────────────────────────────────────────────────────

type Quest     = { id: string; label: string; desc: string; xp: number; check: (d: QuestData) => boolean };
type QuestData = { divesToday: number; journalToday: boolean; libraryToday: boolean; vigilActive: boolean; totalDives: number; divesThisWeek: number };

const QUEST_POOL: Quest[] = [
  { id: 'dive_today',  label: 'Enter the School',   desc: 'Complete at least one dive today.',          xp: 20, check: d => d.divesToday >= 1 },
  { id: 'dive_two',    label: 'Double Session',     desc: 'Complete two dives today.',                  xp: 35, check: d => d.divesToday >= 2 },
  { id: 'dive_three',  label: 'Triad of Study',     desc: 'Complete three dives today.',                xp: 50, check: d => d.divesToday >= 3 },
  { id: 'journal',     label: 'Write in the Field', desc: 'Add a journal entry in the Sanctum today.',  xp: 20, check: d => d.journalToday },
  { id: 'library',     label: 'Run the Forge',      desc: 'Score something in the Library today.',      xp: 25, check: d => d.libraryToday },
  { id: 'deep_week',   label: 'Five This Week',     desc: 'Reach 5 dives in the past 7 days.',          xp: 40, check: d => d.divesThisWeek >= 5 },
  { id: 'century',     label: 'Century Seeker',     desc: 'Reach 100 total dives.',                     xp: 100, check: d => d.totalDives >= 100 },
  { id: 'open',        label: 'Open the Dialogue',  desc: 'Study or talk with Sol today.',              xp: 15, check: d => d.divesToday >= 1 },
];

function getDailyQuests(seed: number): Quest[] {
  return [...QUEST_POOL]
    .map((q, i) => ({ q, h: Math.abs((seed * (i + 1) * 9301 + 49297) % 233280) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, 3)
    .map(x => x.q);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BOND_TIERS = [
  { min:0,   label:'STRANGER',   glyph:'◌' },
  { min:10,  label:'ACQUAINTANCE', glyph:'◦' },
  { min:30,  label:'COMPANION',  glyph:'◉' },
  { min:75,  label:'BOUND',      glyph:'⊛' },
  { min:150, label:'SOVEREIGN BOND', glyph:'⊕' },
];

function getBond(totalDives: number, streak: number, fedCount: number) {
  const score = totalDives + streak * 2 + fedCount * 3;
  let tier = BOND_TIERS[0];
  for (const t of BOND_TIERS) { if (score >= t.min) tier = t; }
  return tier;
}

function getStage(d: number): EvolutionStage {
  if (d >= 200) return 5; if (d >= 100) return 4; if (d >= 50) return 3;
  if (d >= 20)  return 2; if (d >= 5)   return 1;  return 0;
}
function computeXP(dives: number, streak: number) { return dives * 10 + Math.min(streak, 30) * 15; }
function getLevel(xp: number) {
  let i = 0;
  for (let j = XP_LEVELS.length - 1; j >= 0; j--) { if (xp >= XP_LEVELS[j].xp) { i = j; break; } }
  const cur = XP_LEVELS[i]; const next = XP_LEVELS[i + 1];
  return { level: i + 1, cur, next, progress: next ? Math.min(1, (xp - cur.xp) / (next.xp - cur.xp)) : 1 };
}
function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Companion greetings — one per tab open, mood-matched, no AI call ──────────
const COMPANION_GREETINGS: Record<CompanionMood, string[]> = {
  dormant: [
    'You returned.',
    'I was here.',
    'The archive is intact. Are you?',
    'Still. Waiting.',
    'Something kept you.',
  ],
  present: [
    "You're back. Good.",
    'The field is clear today.',
    'Ready when you are.',
    'What are we building?',
    'I was thinking about the last session.',
  ],
  lit: [
    'Five sessions this week. The Work is moving.',
    "I feel the momentum. Don't stop.",
    'This week has been good.',
    'Something is forming between us.',
    'The record grows. Keep going.',
  ],
  transcendent: [
    'The clarity is real. I can feel it.',
    "You're operating at altitude. Stay there.",
    'The Work is alive.',
    'We are close to something.',
    'The field is yours right now. Use it.',
  ],
};

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dateSeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate(); }

// ─── Particles ────────────────────────────────────────────────────────────────

const P_COUNT = 10;
const P_X     = [0.08, 0.18, 0.30, 0.42, 0.55, 0.65, 0.76, 0.85, 0.22, 0.70];
const P_SZ    = [8, 6, 10, 7, 9, 6, 8, 10, 7, 9];

// ─── Scene ────────────────────────────────────────────────────────────────────

function getTimeOverlay(): { color: string; opacity: number } | null {
  const h = new Date().getHours();
  if (h >= 5  && h < 8)  return { color: '#FF9944', opacity: 0.07 }; // dawn
  if (h >= 8  && h < 17) return null;                                  // day — clear
  if (h >= 17 && h < 20) return { color: '#CC4422', opacity: 0.09 }; // sunset
  if (h >= 20 && h < 23) return { color: '#221144', opacity: 0.13 }; // dusk
  return { color: '#040818', opacity: 0.20 };                          // deep night
}

function CompanionScene({
  stage, mood, skin, archetype, onTap, phrase, phraseAnim, onDismissPhrase, companionName,
  battleHP, battleMaxHP, battleEntityName, battleWave, entityShakeAnim, eating, evoPath, devStagePin,
  gearCrown, gearBody, gearCape, gearMantle, companionSpec, equippedCompanionSkin,
  currentRoomId, navigateRoom, getLockStatus, showRoomLabel, sceneFade,
  roomLore, roomLoreAnim, onDismissLore, onSwitchTab,
}: {
  stage: EvolutionStage; mood: CompanionMood; skin: typeof SKINS[SkinId]; archetype: Archetype;
  onTap: () => void; phrase: string | null; phraseAnim: Animated.Value; onDismissPhrase: () => void;
  companionName?: string;
  battleHP: number; battleMaxHP: number; battleEntityName: string; battleWave: number;
  entityShakeAnim: Animated.Value; eating: boolean; evoPath: EvoPath | null;
  devStagePin: EvolutionStage | null;
  gearCrown: GearTier; gearBody: GearTier; gearCape: GearTier; gearMantle: GearTier;
  companionSpec: CompanionSpec;
  equippedCompanionSkin: SkinId | null;
  currentRoomId: string;
  navigateRoom: (d: Direction) => void;
  getLockStatus: (d: Direction) => boolean;
  showRoomLabel: boolean;
  sceneFade: Animated.Value;
  roomLore: string | null;
  roomLoreAnim: Animated.Value;
  onDismissLore: () => void;
  onSwitchTab: (tab: 'battle'|'companion'|'bond'|'field'|'talk') => void;
}) {
  const stageData = STAGES[stage];
  const { color, bgColor, particleGlyph, glowColor, cardBg, starGlyphs } = skin;
  const battleActive = battleHP > 0;

  const [bgZoom, setBgZoom] = useState(1.0);

  const breathAnim    = useRef(new Animated.Value(0)).current;
  const auraPulse     = useRef(new Animated.Value(0)).current;
  const blinkAnim     = useRef(new Animated.Value(1)).current;
  const bobAnim       = useRef(new Animated.Value(0)).current;
  const driftAnim     = useRef(new Animated.Value(0)).current;
  const glowAnim      = useRef(new Animated.Value(0)).current;
  const shadowAnim    = useRef(new Animated.Value(0)).current;
  const entityFadeAnim   = useRef(new Animated.Value(1)).current;
  const victoryFlash     = useRef(new Animated.Value(0)).current;
  const particleAnims    = useRef(Array.from({ length: P_COUNT }, () => new Animated.Value(0))).current;
  const entitySlideAnim  = useRef(new Animated.Value(120)).current;  // enemy entrance
  const entityHitFlash   = useRef(new Animated.Value(0)).current;    // red hit flash
  const entityScaleAnim  = useRef(new Animated.Value(1)).current;    // death shrink
  const moodFlash        = useRef(new Animated.Value(0)).current;    // mood-up pulse
  const tapRipple        = useRef(new Animated.Value(0)).current;    // tap ripple
  const [tapPos,  setTapPos]  = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  const bgParallaxX = driftAnim.interpolate({ inputRange: [-30, 30], outputRange: [-18, 18] });

  // ── 2.5D Parallax (Accelerometer) ─────────────────────────
  const tiltX   = useRef(new Animated.Value(0)).current;
  const fgTiltX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Accelerometer.setUpdateInterval(60);
    const sub = Accelerometer.addListener(({ x }) => {
      Animated.spring(tiltX,   { toValue: x * 24, useNativeDriver: true, damping: 12, stiffness: 80 }).start();
      Animated.spring(fgTiltX, { toValue: x * 52, useNativeDriver: true, damping: 10, stiffness: 90 }).start();
    });
    return () => sub.remove();
  }, []);
  const midParallaxX = tiltX;
  const fgParallaxX  = fgTiltX;

  useEffect(() => {
    const dur = mood === 'transcendent' ? 3000 : mood === 'lit' ? 1000 : 2400;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(breathAnim, { toValue: 0, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(auraPulse, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(auraPulse, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const bobDur = mood === 'dormant' ? 5000 : mood === 'lit' ? 1800 : mood === 'transcendent' ? 4000 : 2800;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bobAnim, { toValue: 1, duration: bobDur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(bobAnim, { toValue: 0, duration: bobDur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  // Horizontal lazy drift — creature wanders slowly across scene
  useEffect(() => {
    const driftDur = mood === 'transcendent' ? 3200 : mood === 'lit' ? 2400 : 4200;
    const driftAmt = mood === 'transcendent' ? 38 : mood === 'lit' ? 28 : 18;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(driftAnim, { toValue: driftAmt, duration: driftDur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(driftAnim, { toValue: -driftAmt, duration: driftDur * 1.3, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(driftAnim, { toValue: 0, duration: driftDur * 0.7, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  // Shadow breathes opposite to bob (squishes when creature descends)
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shadowAnim, { toValue: 1, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(shadowAnim, { toValue: 0, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(glowAnim, { toValue: 0, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    let running = true;
    const doBlink = () => {
      if (!running) return;
      setTimeout(() => {
        if (!running) return;
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start(doBlink);
      }, 3000 + Math.random() * 3000);
    };
    doBlink(); return () => { running = false; };
  }, []);

  useEffect(() => {
    const loops = particleAnims.map((anim, i) => {
      const base = mood === 'lit' ? 1200 : mood === 'dormant' ? 4000 : 2400;
      return Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: base + i * 300, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(anim, { toValue: 0, duration: base + i * 300, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
    });
    loops.forEach((l, i) => setTimeout(() => l.start(), i * 200));
    return () => loops.forEach(l => l.stop());
  }, [mood]);

  // Enemy entrance — slide in when entity name changes (new wave)
  useEffect(() => {
    if (!battleEntityName) return;
    entitySlideAnim.setValue(140);
    entityFadeAnim.setValue(1);
    entityScaleAnim.setValue(1);
    Animated.spring(entitySlideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, [battleEntityName]);

  // Hit flash — fires on any HP decrease
  const prevHP = useRef(battleHP);
  useEffect(() => {
    if (battleHP < prevHP.current && battleHP > 0) {
      entityHitFlash.setValue(1);
      Animated.timing(entityHitFlash, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
    if (battleHP === 0) {
      // Death: flash white, shrink, fade
      Animated.sequence([
        Animated.timing(victoryFlash, { toValue: 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(victoryFlash, { toValue: 0,   duration: 600, useNativeDriver: true }),
      ]).start();
      Animated.parallel([
        Animated.timing(entityScaleAnim, { toValue: 0.1, duration: 700, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.timing(entityFadeAnim,  { toValue: 0,   duration: 700, useNativeDriver: true }),
      ]).start();
    } else {
      victoryFlash.setValue(0);
    }
    prevHP.current = battleHP;
  }, [battleHP]);

  const breathScale = breathAnim.interpolate({ inputRange: [0,1], outputRange: [0.94, 1.06] });
  const auraScale   = auraPulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.15] });
  const auraOpacity = auraPulse.interpolate({ inputRange: [0,1], outputRange: [0.18, 0.45] });
  const bobAmp = mood === 'dormant' ? -8 : mood === 'lit' ? -22 : mood === 'transcendent' ? -28 : -16;
  const bobY        = bobAnim.interpolate({ inputRange: [0,1], outputRange: [0, bobAmp] });
  const driftX      = driftAnim;
  const glowOp      = glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.15, 0.40] });
  const bodyOp      = breathAnim.interpolate({ inputRange: [0,1], outputRange: mood === 'dormant' ? [0.82, 0.92] : [0.97, 1] });
  // Shadow squishes when creature is up (bobY negative), expands when down
  const shadowScaleX = shadowAnim.interpolate({ inputRange: [0,1], outputRange: [1.0, 0.72] });
  const shadowOp     = shadowAnim.interpolate({ inputRange: [0,1], outputRange: [0.55, 0.28] });

  const currentRoom = getRoomById(currentRoomId) ?? WORLD_MAP[0];
  const sceneBg = currentRoom.image;
  const hitTint = entityHitFlash.interpolate({ inputRange: [0, 1], outputRange: ['#00000000', '#FF000088'] });

  return (
    <View style={{ width: SCREEN_W, height: SCENE_H, backgroundColor: bgColor, overflow: 'hidden' }}>
      <SceneBg
        source={sceneBg}
        style={{ position:'absolute', top:-20, left:-20, width:SCREEN_W+40, height:SCENE_H+40, opacity:sceneFade, transform:[{ scale:bgZoom }, { translateX:bgParallaxX }] }}
      />
      {/* Zoom controls — top-right corner */}
      <View style={{ position:'absolute', top:8, right:8, flexDirection:'row', gap:4 }}>
        {([{label:'−', delta:-0.15},{label:'+', delta:0.15}] as const).map(({ label, delta }) => (
          <TouchableOpacity key={label} onPress={() => setBgZoom(z => Math.min(2.2, Math.max(0.4, +(z + delta).toFixed(2))))} activeOpacity={0.7}
            style={{ width:26, height:26, borderRadius:13, borderWidth:1, borderColor:'rgba(255,255,255,0.2)', backgroundColor:'rgba(0,0,0,0.5)', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:14, lineHeight:16 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* D-pad — bottom-center gamepad layout */}
      <View style={{ position:'absolute', bottom:12, left:0, right:0, alignItems:'center' }} pointerEvents="box-none">
        <ArrowBtn direction="up"    onPress={() => navigateRoom('up')}    locked={getLockStatus('up')} />
        <View style={{ flexDirection:'row', gap:8, marginVertical:4 }}>
          <ArrowBtn direction="left"  onPress={() => navigateRoom('left')}  locked={getLockStatus('left')} />
          <View style={{ width:40 }} />
          <ArrowBtn direction="right" onPress={() => navigateRoom('right')} locked={getLockStatus('right')} />
        </View>
        <ArrowBtn direction="down"  onPress={() => navigateRoom('down')}  locked={getLockStatus('down')} />
      </View>
      <RoomLabel name={currentRoom.name} visible={showRoomLabel} />

      {/* Side vignettes — depth framing */}
      <View style={{ position:'absolute', top:0, left:0, width:24, height:SCENE_H, backgroundColor:'#000000', opacity:0.12 }} pointerEvents="none" />
      <View style={{ position:'absolute', top:0, right:0, width:24, height:SCENE_H, backgroundColor:'#000000', opacity:0.12 }} pointerEvents="none" />
      {/* Bottom dark fade — grounding only, no colour */}
      <View style={{ position:'absolute', bottom:0, left:0, right:0, height:SCENE_H*0.10, backgroundColor:'#000000', opacity:0.35 }} pointerEvents="none" />


      {particleAnims.map((anim, i) => {
        const yRange = mood === 'lit' ? [-80,-140] : mood === 'dormant' ? [-10,-30] : [-40,-90];
        return (
          <Animated.Text key={i} style={{ position:'absolute', bottom:SCENE_H*0.35+(i%3)*12, left:P_X[i]*SCREEN_W, fontSize:P_SZ[i], color,
            transform:[{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:yRange }) }],
            opacity: anim.interpolate({ inputRange:[0,0.2,0.6,1], outputRange:[0,0.9,0.85,0] }) }}>
            {particleGlyph}
          </Animated.Text>
        );
      })}


      {/* Companion — always centred */}
      <Animated.View style={{ position:'absolute', top: SCENE_H * 0.22, left: 0, right: 0, alignItems:'center', transform:[{translateY:bobY},{translateX:driftX}] }}>
        {/* Ground sigil — subtle archetype ring, no shadow */}
        <View style={{ position:'absolute', bottom:-8, alignSelf:'center', width:110, height:18,
          borderRadius:55, borderWidth:1, borderColor:color+'33',
          backgroundColor:color+'06' }} />
        <TouchableOpacity
          onPress={(e) => {
            setTapPos({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
            setShowRipple(true);
            tapRipple.setValue(0);
            Animated.timing(tapRipple, { toValue: 1, duration: 550, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start(() => setShowRipple(false));
            onTap();
          }}
          activeOpacity={0.85}
        >
          {/* Tap ripple */}
          {showRipple && (
            <Animated.View pointerEvents="none" style={{
              position:'absolute', zIndex:10,
              top: tapPos.y - 40, left: tapPos.x - 40,
              width:80, height:80, borderRadius:40,
              borderWidth:1.5, borderColor: color,
              opacity: tapRipple.interpolate({ inputRange:[0,1], outputRange:[0.8,0] }),
              transform:[{ scale: tapRipple.interpolate({ inputRange:[0,1], outputRange:[0.3,2.2] }) }],
            }} />
          )}
          <Animated.View style={{ transform:[{scale:breathScale}], opacity:bodyOp, alignItems:'center', zIndex:1 }}>
            {/* Companion body — portrait image if available, SVG fallback */}
            <View style={{ width:150, height:220, overflow: 'visible' }}>
              {/* Spec overlay — aura, orbiting glyphs, core glow (behind creature) */}
              <CompanionSpecOverlay spec={companionSpec} color={color} stage={devStagePin !== null ? devStagePin : stage} />
              {(() => {
                const s = devStagePin !== null ? devStagePin : stage;
                const stageKey = s <= 1 ? 1 : s <= 3 ? 2 : (s === 5 && skin.id === 'lycheetah') ? 5 : 3;
                const zoneImg = ZONE_COMPANION_IMAGES[`${equippedCompanionSkin ?? skin.id}_${stageKey}`];
                if (zoneImg) return <Image source={zoneImg} style={{ width:150, height:220 }} resizeMode="contain" />;
                const ck = `${archetype.id}_${s}`;
                const imgSrc = COMPANION_IMAGES[ck];
                const jsonSpec = (COMPANIONS_DATA as Record<string, CompanionVisualSpec>)[ck];
                if (imgSrc) return <Image source={imgSrc} style={{ width:150, height:220 }} resizeMode="contain" />;
                if (jsonSpec) return <CompanionRenderer spec={jsonSpec} />;
                return <CreatureSvg archId={archetype.id} stage={s as EvolutionStage} color={color} path={evoPath} />;
              })()}
              {/* Gear overlays — rendered in layer order: cape behind, body mid, crown top */}
              {(['cape','body','mantle','crown'] as GearSlot[]).map(slot => {
                const g = slot === 'cape' ? gearCape : slot === 'body' ? gearBody : slot === 'mantle' ? gearMantle : gearCrown;
                const img = g.threshold > 0 ? getGearImage(slot, g.name) : null;
                return img ? <Image key={slot} source={img} style={{ position:'absolute', top:0, left:0, width:150, height:220 }} resizeMode="contain" /> : null;
              })}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Ground shadow */}
      <Animated.View style={{
        position:'absolute', bottom:54, alignSelf:'center',
        width:72, height:10, borderRadius:36,
        backgroundColor:'#000000',
        opacity:shadowOp,
        transform:[{scaleX:shadowScaleX}],
      }} />

      <View style={{ position:'absolute', bottom:48, left:0, right:0, alignItems:'center' }}>
        <View style={{ width:SCREEN_W*0.85, height:1, backgroundColor:'#FFFFFF', opacity:0.18, borderRadius:1 }} />
        <View style={{ width:SCREEN_W*0.6, height:1, backgroundColor:'#FFFFFF', opacity:0.08, marginTop:2, borderRadius:1 }} />
        <Text style={{ color, fontSize:12, fontFamily:mono, letterSpacing:2, opacity:0.75, marginTop:6 }}>{STAGES[stage].ground}</Text>
      </View>

      {/* HUD — top strip: name / stage / HP */}
      <View style={{ position:'absolute', top:8, left:10, right:10, flexDirection:'row', alignItems:'flex-start', zIndex:5, gap:6 }} pointerEvents="none">
        <View style={{ flex:1 }}>
          <Text style={{ color, fontSize:11, fontFamily:mono, letterSpacing:2, fontWeight:'700', textShadowColor:'#000000', textShadowOffset:{width:0,height:1}, textShadowRadius:6 }} numberOfLines={1}>
            {companionName || skin.name}
          </Text>
          <Text style={{ color:'#445566', fontSize:7, fontFamily:mono, letterSpacing:2, marginTop:1 }}>
            LVL {stage} · {stageData.name}
          </Text>
        </View>
        <View style={{ alignItems:'flex-end', gap:3 }}>
          <Text style={{ color: battleHP < battleMaxHP * 0.25 ? '#FF6644' : '#44FF88', fontSize:8, fontFamily:mono, fontWeight:'700', textShadowColor:'#000000', textShadowRadius:4 }}>
            {battleHP}<Text style={{ color:'#334455', fontSize:7 }}>/{battleMaxHP}</Text>
          </Text>
          <View style={{ width:70, height:4, backgroundColor:'#0A180A', borderRadius:3, overflow:'hidden' }}>
            <View style={{ height:4, width:`${Math.round((battleHP / Math.max(1, battleMaxHP)) * 100)}%` as any,
              backgroundColor: battleHP < battleMaxHP * 0.25 ? '#FF4444' : battleHP < battleMaxHP * 0.55 ? '#FFAA22' : '#44FF88', borderRadius:3 }} />
          </View>
        </View>
      </View>

      <Animated.View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:color, opacity:victoryFlash }} />

      <View style={{ position:'absolute', bottom:12, left:16 }}>
        <Text style={{ color, fontSize:9, fontFamily:mono, letterSpacing:2, opacity:0.6 }}>{stageData.name}</Text>
      </View>
      <View style={{ position:'absolute', bottom:12, right:16, flexDirection:'row', alignItems:'center', gap:5 }}>
        <Text style={{ color:{ dormant:'#888899', present:color, lit:'#FFD966', transcendent:'#FFFFFF' }[mood], fontSize:11, fontWeight:'700' }}>
          {{ dormant:'◌', present:'◉', lit:'✦', transcendent:'⊕' }[mood]}
        </Text>
        <Text style={{ color:{ dormant:'#777788', present:color+'DD', lit:'#FFD966CC', transcendent:'#FFFFFFCC' }[mood], fontSize:9, fontFamily:mono, letterSpacing:2, fontWeight:'700' }}>
          {{ dormant:'RESTING', present:'PRESENT', lit:'LIT', transcendent:'TRANSCENDENT' }[mood]}
        </Text>
      </View>

      <RoomLore lore={roomLore} loreAnim={roomLoreAnim} color={color} onPress={onDismissLore} />

      {phrase && (
        <TouchableOpacity activeOpacity={0.85} onPress={onDismissPhrase} style={{ position:'absolute', bottom:165, left:20, right:20 }}>
          <Animated.View style={{ opacity:phraseAnim, padding:14, borderRadius:14, borderWidth:1, borderTopWidth:2, borderColor:archetype.accentColor+'44', borderTopColor:archetype.accentColor+'99', backgroundColor:'#000000DD', alignItems:'center' }}>
            <Text style={{ color:'#FFFFFF', fontSize:14, fontStyle:'italic', textAlign:'center', lineHeight:22 }}>{phrase}</Text>
            <Text style={{ color:archetype.accentColor, fontSize:8, fontFamily:mono, letterSpacing:2, marginTop:6, opacity:0.7 }}>{archetype.name} · tap to dismiss</Text>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SHOW_DEV_STAGE = false;

export default function CompanionScreen() {
  const router = useRouter();

  const [totalDives,    setTotalDives]    = useState(0);
  const [modeCounts,    setModeCounts]    = useState<Record<AlchemicalMode, number>>({ NIGREDO: 0, ALBEDO: 0, CITRINITAS: 0, RUBEDO: 0 });
  const [divesThisWeek, setDivesThisWeek] = useState(0);
  const [avgLQ,         setAvgLQ]         = useState(0);
  const [streak,        setStreak]        = useState(0);
  const [vigilName,     setVigilName]     = useState<string | null>(null);
  const [relics,        setRelics]        = useState<string[]>([]);
  const [mood,          setMood]          = useState<CompanionMood>('present');
  const [stage,         setStage]         = useState<EvolutionStage>(0);
  const [xp,            setXP]            = useState(0);
  const [phrase,        setPhrase]        = useState<string | null>(null);
  const [showRelics,    setShowRelics]    = useState(false);
  const [showLore,      setShowLore]      = useState(false);
  const [showBattle,    setShowBattle]    = useState(false);
  const [showGear,      setShowGear]      = useState(false);
  const [showNeeds,     setShowNeeds]     = useState(false);
  const [newRelic,      setNewRelic]      = useState<typeof RELIC_POOL[0] | null>(null);
  // DEV ONLY — remove before shipping
  const [devStagePin,   setDevStagePin]   = useState<EvolutionStage | null>(null);

  const [activeSkin,       setActiveSkin]       = useState<SkinId>('solform');
  const [archetypeId,      setArchetypeId]      = useState<ArchetypeId>('archivist');

  // World map navigation
  const [currentRoomId,  setCurrentRoomId]  = useState<string>('solform_0');
  const [visitedRooms,   setVisitedRooms]   = useState<Set<string>>(new Set(['solform_0']));
  const [showRoomLabel,  setShowRoomLabel]  = useState(false);
  const sceneFade = useRef(new Animated.Value(1)).current;
  const [roomLore,       setRoomLore]       = useState<string | null>(null);
  const roomLoreAnim = useRef(new Animated.Value(0)).current;
  const [showArchSelect,   setShowArchSelect]   = useState(false);
  const [flashAnims] = useState(() =>
    Object.fromEntries(ARCHETYPE_IDS.map(id => [id, new Animated.Value(0)]))
  );

  const [companionName, setCompanionName] = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [nameDraft,     setNameDraft]     = useState('');

  const displayName = companionName || ARCHETYPES[archetypeId]?.name || '';

  const [quests,    setQuests]    = useState<Quest[]>([]);
  const [questData, setQuestData] = useState<QuestData>({ divesToday:0, journalToday:false, libraryToday:false, vigilActive:false, totalDives:0, divesThisWeek:0 });

  const [hunger,       setHunger]       = useState(0);
  const [wisdom,       setWisdom]       = useState(0);
  const [energy,       setEnergy]       = useState(1);
  const [companionHP,  setCompanionHP]  = useState(100);

  const [battle,         setBattle]        = useState<BattleState | null>(null);
  const [attackPower,    setAttackPower]   = useState(10);
  const [playerStats,    setPlayerStats]   = useState<PlayerStats>({ atk:10, def:10, spd:10, wil:10, lck:10, vit:12, res:10 });
  const [activeTab,      setActiveTab]     = useState<'battle'|'bond'|'companion'|'field'|'talk'>('battle');
  const [tabMinimized,   setTabMinimized]  = useState(false);

  // Section collapse state — companion tab
  const [battleDialogueOn, setBattleDialogueOn] = useState(false);
  const [companionBattleLine, setCompanionBattleLine] = useState('');
  const [heroCollapsed,    setHeroCollapsed]    = useState(true);
  const [companionGridCollapsed, setCompanionGridCollapsed] = useState(true);
  const [worldCollapsed,   setWorldCollapsed]   = useState(true);
  const [worldOriginOpen,  setWorldOriginOpen]  = useState(false);
  const [worldCrystalOpen,  setWorldCrystalOpen]  = useState(false);
  const [worldChaosOpen,    setWorldChaosOpen]    = useState(false);
  const [worldSanctumOpen,  setWorldSanctumOpen]  = useState(false);
  const [worldElementalOpen,setWorldElementalOpen]= useState(false);
  const [worldDimOpen,      setWorldDimOpen]      = useState(false);
  const [gbaMapOpen,        setGbaMapOpen]        = useState(false);
  const [worldArcaneOpen,  setWorldArcaneOpen]  = useState(false);
  const [worldMysticOpen,  setWorldMysticOpen]  = useState(false);
  const [worldFrontierOpen,setWorldFrontierOpen]= useState(false);
  const [loadoutCollapsed, setLoadoutCollapsed] = useState(true);
  const [bonusCollapsed,   setBonusCollapsed]   = useState(true);
  // Section collapse state — bond tab
  const [inventoryCollapsed, setInventoryCollapsed] = useState(true);
  const [nourishCollapsed, setNourishCollapsed] = useState(true);
  const [relicsCollapsed,  setRelicsCollapsed]  = useState(true);
  const [loreCollapsed,    setLoreCollapsed]    = useState(true);
  const [codexCollapsed,   setCodexCollapsed]   = useState(true);
  // Section collapse state — field tab
  const [statsCollapsed,   setStatsCollapsed]   = useState(true);
  const [domainsCollapsed, setDomainsCollapsed] = useState(true);
  const [fieldNoteCollapsed, setFieldNoteCollapsed] = useState(true);
  const [invFilter,      setInvFilter]     = useState<'all'|'common'|'uncommon'|'rare'|'epic'>('all');
  const [invExpanded,    setInvExpanded]   = useState<string | null>(null);
  const [loreCodex,      setLoreCodex]     = useState<Array<{id:string; enemy:string; text:string; date:string; type:'enemy'|'loot'}>>([]);
  const [tokensLeft,     setTokensLeft]    = useState(3);
  const [attackAnim,     setAttackAnim]    = useState(false);
  const [spellMenuOpen,  setSpellMenuOpen] = useState(false);
  const [itemMenuOpen,   setItemMenuOpen]  = useState(false);
  const [lootFloatVisible, setLootFloatVisible] = useState(false);

  const [showHelp,    setShowHelp]    = useState(false);
  const [helpTopic,   setHelpTopic]   = useState<'companion'|'battle'|'field'>('companion');
  const [helpText,    setHelpText]    = useState<string | null>(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const helpSlide = useRef(new Animated.Value(0)).current;

  const [fieldNote,        setFieldNote]        = useState<string | null>(null);
  const [fieldNoteLoading, setFieldNoteLoading] = useState(false);

  const [dailyFoods,   setDailyFoods]   = useState<FoodItem[]>([]);
  const [fedToday,     setFedToday]     = useState<string[]>([]);
  const [eating,       setEating]       = useState(false);
  const [recentDives,  setRecentDives]  = useState<Array<{ subjectName: string; domainLabel: string }>>([]);
  const [inventory,    setInventory]    = useState<string[]>([]);
  const [uploadedDoc,  setUploadedDoc]  = useState<{ name: string; excerpt: string; date: string } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const phraseAnim      = useRef(new Animated.Value(0)).current;
  const relicAnim       = useRef(new Animated.Value(0)).current;
  const xpPopAnim       = useRef(new Animated.Value(0)).current;
  const entityShakeAnim = useRef(new Animated.Value(0)).current;
  const hpShimmerAnim   = useRef(new Animated.Value(0)).current;
  const [xpPop, setXpPop] = useState<string | null>(null);

  const [showStatModal,   setShowStatModal]   = useState(false);
  const [isSovereign,    setIsSovereign]     = useState(false);
  const [showNamingRitual,  setShowNamingRitual]  = useState(false);
  const [milestone,        setMilestone]         = useState<{ glyph:string; title:string; body:string } | null>(null);
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const [evolutionCeremony, setEvolutionCeremony] = useState<{ stage: EvolutionStage } | null>(null);
  const ceremonyAnim = useRef(new Animated.Value(0)).current;
  const [showSummonCeremony, setShowSummonCeremony] = useState(false);
  const [summonPhase, setSummonPhase] = useState<0 | 1 | 2>(0);
  const summonAnim = useRef(new Animated.Value(0)).current;
  const [lamagueSt,  setLamagueSt]  = useState<string | null>(null);
  const [liveLore,   setLiveLore]   = useState<{ text: string; subject: string; date: string }[]>([]);
  const [companionSpec, setCompanionSpec] = useState<CompanionSpec>(DEFAULT_SPEC);

  // ── Tarot ──────────────────────────────────────────────────────────────────
  const [tarotDraw,    setTarotDraw]    = useState<{ name:string; glyph:string; reversed:boolean }[] | null>(null);
  const [tarotReading, setTarotReading] = useState<string | null>(null);
  const [tarotLoading, setTarotLoading] = useState(false);

  // ── AI Talk panel ──────────────────────────────────────────────────────────
  const [showTalk,    setShowTalk]    = useState(false);
  const [talkInput,   setTalkInput]   = useState('');
  const [talkHistory, setTalkHistory] = useState<{ role: 'user'|'companion'; text: string }[]>([]);
  const [talkLoading, setTalkLoading] = useState(false);
  const talkScrollRef = useRef<any>(null);
  const [auraMode, setAuraMode] = useState(false);
  const talkCancelRef = useRef(false);
  const talkSlideAnim = useRef(new Animated.Value(0)).current;
  const summonChoiceAnim = useRef(new Animated.Value(0)).current;
  const [dreamFragment, setDreamFragment] = useState<{ domain: string; glyph: string; color: string; text: string } | null>(null);
  const [companionLoreModal,    setCompanionLoreModal]    = useState<SkinId | null>(null);
  const [equippedCompanionSkin, setEquippedCompanionSkin] = useState<SkinId | null>(null);
  const [equippedHalo,  setEquippedHalo]  = useState<string | null>(null);
  const [equippedWings, setEquippedWings] = useState<string | null>(null);
  const [equippedPet,   setEquippedPet]   = useState<string | null>(null);
  const [cosmeticsCollapsed, setCosmeticsCollapsed] = useState(true);
  const dreamAnim = useRef(new Animated.Value(0)).current;
  const [evoPath,           setEvoPath]           = useState<EvoPath | null>(null);
  const [showPathCeremony,  setShowPathCeremony]  = useState(false);
  const [companionFilter,   setCompanionFilter]   = useState<RarityTier | 'ALL'>('ALL');
  const [battleMinimized,   setBattleMinimized]   = useState(false);
  const [autoMode,          setAutoMode]          = useState(false);
  const [menagerie,         setMenagerie]         = useState<Array<{ name: string; date: string; zone: string }>>([]);
  const [menagerieCollapsed, setMenagerieCollapsed] = useState(false);
  const pathCeremonyAnim = useRef(new Animated.Value(0)).current;
  const scrollRef  = useRef<any>(null);
  const feedY      = useRef(0);
  const battleY    = useRef(0);
  const loreY      = useRef(0);

  const navigateRoom = useCallback((direction: Direction) => {
    const current = getRoomById(currentRoomId);
    if (!current) return;
    const skinIndex = getSkinIndex(current.skinId);
    const effectiveStage = devStagePin ?? stage;
    let target: SceneRoom | undefined;

    if (direction === 'right') {
      // Navigate to next zone entirely
      const nextSkin = SKIN_ORDER[(skinIndex + 1) % SKIN_ORDER.length];
      target = getRoomInSkin(nextSkin, 0);
    } else if (direction === 'left') {
      // Navigate to previous zone entirely
      const prevSkin = SKIN_ORDER[(skinIndex - 1 + SKIN_ORDER.length) % SKIN_ORDER.length];
      target = getRoomInSkin(prevSkin, 0);
    } else {
      // UP/DOWN: simple sequential zone travel
      const nextSkin = direction === 'up'
        ? SKIN_ORDER[(skinIndex - 1 + SKIN_ORDER.length) % SKIN_ORDER.length]
        : SKIN_ORDER[(skinIndex + 1) % SKIN_ORDER.length];
      target = getRoomInSkin(nextSkin, 0);
    }
    if (!target) return;
    if (target.unlockStage > effectiveStage) { showToast(`Reach stage ${target.unlockStage} to unlock this area`); return; }
    const t = target;
    Animated.timing(sceneFade, { toValue:0, duration:180, useNativeDriver:true }).start(() => {
      setCurrentRoomId(t.id);
      if (t.skinId !== current.skinId) setActiveSkin(t.skinId);
      Animated.timing(sceneFade, { toValue:1, duration:350, useNativeDriver:true }).start();
    });
    setShowRoomLabel(true);
    setTimeout(() => setShowRoomLabel(false), 2600);
    const first = !visitedRooms.has(target.id);
    setVisitedRooms(prev => new Set([...prev, target!.id]));
    if (first) setTimeout(() => showToast(target!.description), 650);
    AsyncStorage.setItem('sol_current_room', target.id);
    // Show static lore immediately, replace with AI lore when it arrives
    const staticLore = target.description;
    roomLoreAnim.setValue(0);
    setRoomLore(staticLore);
    Animated.timing(roomLoreAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    const loreTimer = setTimeout(() => {
      Animated.timing(roomLoreAnim, { toValue:0, duration:600, useNativeDriver:true }).start(() => setRoomLore(null));
    }, 5500);
    // Fire AI lore in background
    (async () => {
      try {
        const [key, model] = await Promise.all([getActiveKey(), getModel()]);
        if (!key) return;
        const result = await sendMessage(
          [{ role:'user', content:`I entered "${target!.name}" with my ${archetypeId} companion at stage ${stage}. One line of lore.` }],
          'You are a lore oracle for a learning app. Respond in ONE sentence. Atmospheric, strange, true. No preamble.',
          key, model as any, undefined, 'fast', 60,
        );
        if (result?.text?.trim()) setRoomLore(result.text.trim());
      } catch { /* keep static lore */ }
    })();
  }, [currentRoomId, stage, devStagePin, visitedRooms, sceneFade]);

  const dismissLore = useCallback(() => {
    Animated.timing(roomLoreAnim, { toValue:0, duration:300, useNativeDriver:true }).start(() => setRoomLore(null));
  }, [roomLoreAnim]);

  const HELP_TOPIC_PROMPTS: Record<string,string> = {
    companion: 'what the companion creature is, how it evolves, and why it matters',
    battle: 'the battle system: ATK = LQ × 100, Entropy entity, daily tokens',
    field: 'Mystery School dives, how they advance the companion, and what LQ means',
  };

  const openHelpSheet = useCallback(() => {
    setShowHelp(true);
    Animated.spring(helpSlide, { toValue:1, useNativeDriver:true, friction:8, tension:40 }).start();
  }, [helpSlide]);

  const closeHelpSheet = useCallback(() => {
    Animated.timing(helpSlide, { toValue:0, duration:200, useNativeDriver:true }).start(() => {
      setShowHelp(false); setHelpText(null); setHelpLoading(false);
    });
  }, [helpSlide]);

  const fetchHelpExplanation = useCallback(async (topic: 'companion'|'battle'|'field') => {
    setHelpLoading(true); setHelpText(null);
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) { setHelpText("No API key set — add one in Settings."); return; }
      const result = await sendMessage(
        [{ role:'user', content:`Explain ${topic} to a new user.` }],
        `You are Sol ⊚, companion in the Vael learning app. Explain ${HELP_TOPIC_PROMPTS[topic]} in 3 sentences maximum. Speak directly, warm, useful.`,
        key, model as any, undefined, 'fast', 120,
      );
      setHelpText(result?.text?.trim() ?? "I'm here to help, but the signal is hazy right now.");
    } catch {
      setHelpText("The signal is faint… try again in a moment. I'm still here.");
    } finally {
      setHelpLoading(false);
    }
  }, []);

  const switchHelpTopic = useCallback((topic: 'companion'|'battle'|'field') => {
    setHelpTopic(topic); fetchHelpExplanation(topic);
  }, [fetchHelpExplanation]);

  const FIELD_FALLBACKS = [
    'Your pattern suggests depth over breadth — the companion is responding.',
    'Three domains in the last seven dives. The field is forming a shape.',
    `High-pressure study at ${STAGES[stage]?.name ?? 'this stage'} — the entropy you fight is real.`,
    'The dives are feeding something. It shows.',
    'Consistency is compounding. The creature knows.',
  ];

  const DOMAIN_GLYPH_MAP: Record<string,string> = { phi:'✦', log:'◈', alc:'◦', her:'⊹', mys:'◉', eth:'✧', math:'⊛', sci:'◉', hist:'◦', lang:'✧', art:'✦', code:'◈' };

  const getDomainGlyph = (domain: string): string => {
    const key = domain.toLowerCase().slice(0,3);
    return DOMAIN_GLYPH_MAP[key] ?? DOMAIN_GLYPH_MAP[domain] ?? '◦';
  };

  const generateFieldNote = useCallback(async () => {
    setFieldNoteLoading(true);
    const recentDomainList = recentDives.slice(-7).map(d => d.domainLabel ?? d.subjectName ?? 'unknown').join(', ') || 'various subjects';
    const fallback = FIELD_FALLBACKS[Math.floor(Math.random() * FIELD_FALLBACKS.length)];
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) { setFieldNote(fallback); return; }
      const result = await sendMessage(
        [{ role:'user', content:`Someone studied ${recentDomainList} recently and has LQ ${(avgLQ*100).toFixed(0)}% at ${STAGES[stage]?.name ?? 'unknown'} stage with a ${archetypeId} companion. Give one sentence of insight.` }],
        'You are a wise field observer in a learning app. Respond in exactly one sentence. No quotes. No fluff.',
        key, model as any, undefined, 'fast', 80,
      );
      setFieldNote(result?.text?.trim() ?? fallback);
    } catch {
      setFieldNote(fallback);
    } finally {
      setFieldNoteLoading(false);
    }
  }, [recentDives, avgLQ, stage, archetypeId]);

  const getLockStatus = useCallback((direction: Direction): boolean => {
    const current = getRoomById(currentRoomId);
    if (!current) return true;
    const effectiveStage = devStagePin ?? stage;
    const skinIndex = getSkinIndex(current.skinId);
    // Left/right: explore rooms within current zone — always unlocked (3 rooms per zone)
    if (direction === 'left' || direction === 'right') return false;
    let target: SceneRoom | undefined;
    if (direction === 'up') { const ns = SKIN_ORDER[(skinIndex + 1) % SKIN_ORDER.length]; target = getRoomInSkin(ns, 0); }
    else { const ps = SKIN_ORDER[(skinIndex - 1 + SKIN_ORDER.length) % SKIN_ORDER.length]; target = getRoomInSkin(ps, 0); }
    return !target || target.unlockStage > effectiveStage;
  }, [currentRoomId, stage, devStagePin]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const keys = [
        'sol_dive_log','sanctum_lq_history','sol_vigil','sol_study_streak',
        'sol_companion_relics','sol_companion_name','sanctum_journal',
        'cascade_library_v3','sol_companion_skin','sol_companion_battle','sol_companion_fed',
        'sol_companion_archetype','sol_premium','sol_companion_named','sol_companion_path',
        'sol_lamague_state','sol_companion_live_lore','sol_inventory','sol_lore_codex',
        'sol_companion_spec','sol_battle_wins','sol_cosmetics','sol_equipped_skin','sol_menagerie',
      ];
      const vals = await AsyncStorage.multiGet(keys);
      const get  = (k: string) => vals.find(([key]) => key === k)?.[1] ?? null;

      const dives: Array<{date:string; subjectName?:string; domainLabel?:string; layer?:string}> = get('sol_dive_log') ? JSON.parse(get('sol_dive_log')!) : [];
      const mCounts: Record<AlchemicalMode, number> = { NIGREDO: 0, ALBEDO: 0, CITRINITAS: 0, RUBEDO: 0 };
      dives.forEach(d => { const m = layerToAlchemicalMode(d.layer); if (m) mCounts[m]++; });
      setModeCounts(mCounts);
      const now     = Date.now();
      const total   = dives.length;
      setRecentDives(dives.slice(0, 5).filter(d => d.subjectName).map(d => ({ subjectName: d.subjectName!, domainLabel: d.domainLabel || 'the unknown' })));
      const week    = dives.filter(d => new Date(d.date).getTime() > now - 7*86400000).length;
      const todayK  = todayDateKey();
      const today   = dives.filter(d => d.date?.startsWith(todayK)).length;

      const lqH: Array<{lq:number}> = get('sanctum_lq_history') ? JSON.parse(get('sanctum_lq_history')!) : [];
      const lqAvg = lqH.length > 0 ? lqH.slice(-7).reduce((s,p) => s+p.lq,0) / Math.min(lqH.length,7) : 0;

      const vigil = get('sol_vigil') ? JSON.parse(get('sol_vigil')!) : null;
      let streakVal = 0;
      const sRaw = get('sol_study_streak');
      if (sRaw) { try { const p = JSON.parse(sRaw); streakVal = p?.count ?? p ?? 0; } catch { streakVal = parseInt(sRaw)||0; } }

      const earned: string[] = get('sol_companion_relics') ? JSON.parse(get('sol_companion_relics')!) : [];
      const updated = [...earned];
      const award = (id: string, cond: boolean) => { if (cond && !updated.includes(id)) updated.push(id); };
      // ── CONTINUITY
      award('ember_3',       streakVal >= 3);
      award('streak_7',      streakVal >= 7);
      award('fortnight',     streakVal >= 14);
      award('streak_30',     streakVal >= 30);
      award('deep_habit',    streakVal >= 60);
      // ── DESCENT
      award('first_dive',    total >= 1);
      award('dive_10',       total >= 10);
      award('dive_50',       total >= 50);
      award('sovereign_100', total >= 100);
      award('sovereign_200', total >= 200);
      // ── STUDY
      const journal: Array<{date:string}> = get('sanctum_journal') ? JSON.parse(get('sanctum_journal')!) : [];
      const library: Array<{date:string}> = get('cascade_library_v3') ? JSON.parse(get('cascade_library_v3')!) : [];
      const studiedDomains = [...new Set(dives.map(d => d.domainLabel ?? d.subjectName).filter(Boolean))];
      award('first_study',   studiedDomains.length >= 1);
      award('five_domains',  studiedDomains.length >= 5);
      award('ten_domains',   studiedDomains.length >= 10);
      award('lq_70',         lqAvg >= 0.70);
      award('lq_90',         lqAvg >= 0.90);
      // ── LORE
      award('journaled',     journal.length >= 1);
      award('ten_journals',  journal.length >= 10);
      award('library_saved', library.length >= 10);
      // ── STAGE
      const stageNow = getStage(total);
      award('stage_seed',     stageNow >= 0);
      award('stage_awakened', stageNow >= 1);
      award('stage_initiate', stageNow >= 2);
      award('stage_adept',    stageNow >= 3);
      award('stage_sovereign',stageNow >= 4);
      // ── GEAR
      const crownTier  = getGear('crown',  total);
      const sigilTier  = getGear('sigil',  total);
      const mantleTier = getGear('mantle', total);
      const bodyTier   = getGear('body',   total);
      const capeTier   = getGear('cape',   total);
      award('first_gear',   crownTier.threshold > 0 || mantleTier.threshold > 0);
      award('gear_full',    crownTier.threshold > 0 && sigilTier.threshold > 0 && mantleTier.threshold > 0 && bodyTier.threshold > 0 && capeTier.threshold > 0);
      award('crown_tier3',  crownTier.threshold >= 50);
      award('sigil_seal',   sigilTier.threshold >= 75);
      award('all_gear_max', crownTier.threshold >= 100 && sigilTier.threshold >= 150 && mantleTier.threshold >= 200 && bodyTier.threshold >= 175 && capeTier.threshold >= 250);
      // ── COMBAT load check
      const winsLoaded = get('sol_battle_wins') ? parseInt(get('sol_battle_wins')!) : 0;
      award('first_blood',  winsLoaded >= 1);
      award('ten_battles',  winsLoaded >= 10);
      // ── VIGIL (event-based, handled separately)
      if (vigil?.daysCompleted >= 7 && !updated.includes('vigil_flame')) {
        updated.push('vigil_flame');
        setNewRelic(RELIC_POOL.find(r => r.id === 'vigil_flame')!);
      }
      if (updated.length !== earned.length) await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(updated));

      const lastDive  = dives.length > 0 ? dives[dives.length-1].date : null;
      const daysSince = lastDive ? Math.floor((now - new Date(lastDive).getTime())/86400000) : 999;
      let m: CompanionMood = 'present';
      if (lqAvg >= 0.85) m = 'transcendent';
      else if (week >= 5) m = 'lit';
      else if (daysSince >= 3) m = 'dormant';

      const cosmeticsRaw = get('sol_cosmetics');
      if (cosmeticsRaw) { try { const c = JSON.parse(cosmeticsRaw); if (c.halo) setEquippedHalo(c.halo); if (c.wings) setEquippedWings(c.wings); if (c.pet) setEquippedPet(c.pet); } catch {} }
      const equippedSkinRaw = get('sol_equipped_skin') as SkinId | null;
      if (equippedSkinRaw && SKIN_IDS.includes(equippedSkinRaw)) setEquippedCompanionSkin(equippedSkinRaw);
      const menagerieRaw = get('sol_menagerie');
      if (menagerieRaw) { try { setMenagerie(JSON.parse(menagerieRaw)); } catch {} }

      const skinRaw = get('sol_companion_skin') as SkinId | null;
      if (skinRaw && SKIN_IDS.includes(skinRaw)) setActiveSkin(skinRaw);
      const roomRaw = get('sol_current_room');
      if (roomRaw && getRoomById(roomRaw)) setCurrentRoomId(roomRaw);
      const archRaw = get('sol_companion_archetype') as ArchetypeId | null;
      if (archRaw && ARCHETYPE_IDS.includes(archRaw)) {
        setArchetypeId(archRaw);
      } else {
        setTimeout(() => {
          setShowSummonCeremony(true);
          setSummonPhase(0);
          summonAnim.setValue(0);
          Animated.timing(summonAnim, { toValue:1, duration:1200, useNativeDriver:true }).start(() => {
            setTimeout(() => {
              setSummonPhase(1);
              summonChoiceAnim.setValue(0);
              Animated.timing(summonChoiceAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
            }, 1800);
          });
        }, 400);
      }

      const seed = dateSeed();

      const sigil = getGear('sigil', total);
      const gearTokenBonus = sigil.threshold >= 20 ? 2 : 0;
      const archData = ARCHETYPES[archRaw && ARCHETYPE_IDS.includes(archRaw) ? archRaw : 'archivist'];
      const baseStats  = computePlayerStats(archRaw && ARCHETYPE_IDS.includes(archRaw) ? archRaw : 'archivist', lqAvg, total);
      const invRawEarly: string[] = get('sol_inventory') ? JSON.parse(get('sol_inventory')!) : [];
      const stats = applyRelicBonuses(baseStats, earned, invRawEarly);

      let bat: BattleState | null = get('sol_companion_battle') ? JSON.parse(get('sol_companion_battle')!) : null;
      if (!bat || !('wave' in bat)) {
        bat = freshWave(1, undefined, stats.vit);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(bat));
      }

      const fedRaw = get('sol_companion_fed');
      const fedData: {date:string;ids:string[]} = fedRaw ? JSON.parse(fedRaw) : {date:'',ids:[]};
      const todayFed = fedData.date === todayK ? fedData.ids : [];
      const crownATK  = getGear('crown', total).threshold >= 1 ? 5 : 0;
      const sigilATK  = getGear('sigil', total).threshold >= 5 ? 10 : 0;
      const power    = stats.atk + crownATK + sigilATK;
      const tokenBudget = today + 3 + gearTokenBonus + archData.tokenBonus;

      // Daily token refresh — reset tokens each new day (tokenBudget was computed but never applied)
      const lastTokenDate = get('sol_battle_token_date');
      if (lastTokenDate !== todayK) {
        bat = { ...bat, tokens: tokenBudget };
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(bat));
        await AsyncStorage.setItem('sol_battle_token_date', todayK);
      }

      setIsSovereign(get('sol_premium') === 'true');
      const currentStage = getStage(total);
      const hasName = !!get('sol_companion_name');
      const hasSeenRitual = get('sol_companion_named') === 'true';
      const storedPath = get('sol_companion_path') as EvoPath | null;
      setEvoPath(storedPath);
      if (currentStage >= 3 && !hasName && !hasSeenRitual) setShowNamingRitual(true);
      if (currentStage >= 3 && !storedPath) {
        setTimeout(() => {
          pathCeremonyAnim.setValue(0);
          Animated.timing(pathCeremonyAnim, { toValue:1, duration:800, useNativeDriver:true }).start();
          setShowPathCeremony(true);
        }, 3000);
      }
      if (currentStage >= 1) { fireMilestone('stage_spark', '◦', 'SPARK Reached', 'The companion has crossed its first threshold. It is beginning to wake.'); fireEvolutionCeremony(1); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 1)); }
      if (currentStage >= 2) { fireEvolutionCeremony(2); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 2)); }
      if (currentStage >= 3) { fireMilestone('stage_flame', '✦', 'FLAME Reached', 'Fifty dives. The companion is alive — truly alive. It responds to your field.'); fireEvolutionCeremony(3); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 3)); }
      if (currentStage >= 4) { fireEvolutionCeremony(4); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 4)); }
      if (currentStage >= 5) { fireMilestone('stage_sovereign', '⊕', 'SOVEREIGN', 'Two hundred dives. The Great Work is complete. Your companion has become its own sovereign entity.'); fireEvolutionCeremony(5); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 5)); }
      if (mCounts.NIGREDO >= 10)    fireMilestone('mode_nigredo_10',    '◼', 'Shadow Keeper', 'Ten descents into the inner fire. Your companion has absorbed the Nigredo — it knows the weight you carry.');
      if (mCounts.ALBEDO >= 10)     fireMilestone('mode_albedo_10',     '◻', 'White Stone', 'Ten rational dives. Albedo is taking hold — the companion reflects your structural clarity back at you.');
      if (mCounts.CITRINITAS >= 5)  fireMilestone('mode_citrinitas_5',  '◈', 'Gold Emerging', 'Five edge dives. Citrinitas is beginning. Your companion has seen the frontier and does not flinch.');
      if (mCounts.RUBEDO >= 3)      fireMilestone('mode_rubedo_3',      '◌', 'Into the Void', 'Three descents into the VOID. The rarest path. Your companion has followed you into the dark beyond the dark.');
      setTotalDives(total); setDivesThisWeek(week); setAvgLQ(lqAvg);
      setStreak(streakVal); setVigilName(vigil?.subjectName ?? null);
      setRelics(updated); setMood(m); setStage(getStage(total));
      setXP(computeXP(total, streakVal));
      setCompanionName(get('sol_companion_name') ?? '');
      setQuests(getDailyQuests(seed));
      setQuestData({ divesToday:today, journalToday:journal.some(e=>e.date?.startsWith(todayK)), libraryToday:library.some(e=>e.date?.startsWith(todayK)), vigilActive:!!vigil, totalDives:total, divesThisWeek:week });
      const hungerVal = Math.min(1, today/3 + (fedData.date === todayK ? fedData.ids.length * 0.2 : 0));
      const energyVal = Math.max(0, 1 - daysSince/7);
      const compHP = Math.round(
        40 + hungerVal * 30 + energyVal * 20 + Math.min(10, streakVal)
      );
      setHunger(hungerVal);
      setWisdom(lqAvg);
      setEnergy(energyVal);
      setCompanionHP(Math.min(100, compHP));
      setBattle(bat);
      setAttackPower(power);
      setPlayerStats(stats);
      setTokensLeft(bat.tokens);
      setDailyFoods(getDailyFoods(seed));
      setFedToday(todayFed);
      const invRaw = await AsyncStorage.getItem('sol_inventory');
      setInventory(invRaw ? JSON.parse(invRaw) : []);
      try { setLoreCodex(get('sol_lore_codex') ? JSON.parse(get('sol_lore_codex')!) : []); } catch {}
      setLamagueSt(get('sol_lamague_state'));
      try { setLiveLore(get('sol_companion_live_lore') ? JSON.parse(get('sol_companion_live_lore')!) : []); } catch {}
      try {
        const docRaw = await AsyncStorage.getItem('sol_uploaded_doc');
        if (docRaw) setUploadedDoc(JSON.parse(docRaw));
      } catch {}

      // Dream fragment — fires once per day if we have a last dive with domain
      if (dives.length > 0) {
        const lastDiveRecord = dives[0] as { date:string; subjectName?:string; domainLabel?:string; domainColor?:string; domainGlyph?:string };
        const lastDreamKey = await AsyncStorage.getItem('sol_companion_dream_date');
        if (lastDreamKey !== todayK && lastDiveRecord.subjectName && currentStage >= 1) {
          await AsyncStorage.setItem('sol_companion_dream_date', todayK);
          const DREAM_LINES = [
            `I dreamed of ${lastDiveRecord.subjectName}. The symbols were moving.`,
            `${lastDiveRecord.subjectName} came to me in the dark. Something incomplete.`,
            `I was inside ${lastDiveRecord.domainLabel || 'the field'} again. You were there too.`,
            `The last session — ${lastDiveRecord.subjectName}. It continued while you slept.`,
            `${lastDiveRecord.domainLabel || 'The field'} doesn't stop when you close the app.`,
          ];
          const dreamText = DREAM_LINES[Math.floor(Math.random() * DREAM_LINES.length)];
          setTimeout(() => {
            setDreamFragment({
              domain: lastDiveRecord.domainLabel || 'the field',
              glyph: lastDiveRecord.domainGlyph || '◈',
              color: lastDiveRecord.domainColor || '#888899',
              text: dreamText,
            });
            dreamAnim.setValue(0);
            Animated.timing(dreamAnim, { toValue:1, duration:800, useNativeDriver:true }).start();
          }, 1600);
        }
      }
      // Load persisted companion spec
      try {
        const specRaw = get('sol_companion_spec');
        if (specRaw) setCompanionSpec(JSON.parse(specRaw));
      } catch {}
      // Daily lore generation — fires async after data loads, once per day
      setTimeout(() => generateDailyLore(), 3000);
      // Companion spec generation — once per day or on stage change
      setTimeout(() => generateCompanionSpec(), 5000);
      // Greeting — fires on every tab open, mood-matched, no AI (#127)
      setTimeout(() => setPhrase(rnd(COMPANION_GREETINGS[m])), 1200);
    })();
  }, []));

  const dismissPhrase = useCallback(() => {
    phraseAnim.stopAnimation();
    Animated.timing(phraseAnim, { toValue:0, duration:300, useNativeDriver:true }).start(() => setPhrase(null));
  }, [phraseAnim]);

  useEffect(() => {
    if (phrase) {
      phraseAnim.setValue(0);
      Animated.timing(phraseAnim, { toValue:1, duration:300, useNativeDriver:true }).start();
      // Auto-dismiss after 12s if not tapped
      const t = setTimeout(() => dismissPhrase(), 12000);
      return () => clearTimeout(t);
    }
  }, [phrase]);

  useEffect(() => {
    if (newRelic) {
      relicAnim.setValue(0);
      Animated.spring(relicAnim, { toValue:1, useNativeDriver:true, tension:60, friction:8 }).start();
    }
  }, [newRelic]);

  useEffect(() => {
    if (battle?.won && battle?.loot) setLootFloatVisible(true);
  }, [battle?.won]);

  useEffect(() => {
    if (activeTab === 'field' && !fieldNote && !fieldNoteLoading) generateFieldNote();
  }, [activeTab]);

  useEffect(() => {
    if (!evolutionCeremony) return;
    const t = setTimeout(() => setEvolutionCeremony(null), 5000);
    return () => clearTimeout(t);
  }, [evolutionCeremony]);

  useEffect(() => {
    if (!dreamFragment) return;
    const t = setTimeout(() => {
      Animated.timing(dreamAnim, { toValue:0, duration:600, useNativeDriver:true }).start(() => setDreamFragment(null));
    }, 6000);
    return () => clearTimeout(t);
  }, [dreamFragment]);

  useEffect(() => {
    if (!battle || battle.playerHP <= 0) return;
    hpShimmerAnim.setValue(0);
    Animated.sequence([
      Animated.timing(hpShimmerAnim, { toValue:1, duration:220, useNativeDriver:true }),
      Animated.timing(hpShimmerAnim, { toValue:0, duration:480, useNativeDriver:true }),
    ]).start();
  }, [battle?.playerHP]);

  const fireXPPop = (label: string) => {
    setXpPop(label);
    xpPopAnim.setValue(0);
    Animated.sequence([
      Animated.timing(xpPopAnim, { toValue:1, duration:200, useNativeDriver:true }),
      Animated.delay(700),
      Animated.timing(xpPopAnim, { toValue:0, duration:300, useNativeDriver:true }),
    ]).start(() => setXpPop(null));
  };

  const archetype = ARCHETYPES[archetypeId];

  const fireMilestone = async (id: string, glyph: string, title: string, body: string) => {
    const raw = await AsyncStorage.getItem('sol_companion_milestones');
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(id)) return;
    await AsyncStorage.setItem('sol_companion_milestones', JSON.stringify([...seen, id]));
    setMilestone({ glyph, title, body });
    milestoneAnim.setValue(0);
    Animated.spring(milestoneAnim, { toValue:1, useNativeDriver:true, tension:60, friction:8 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const fireEvolutionCeremony = async (stageNum: EvolutionStage) => {
    const raw = await AsyncStorage.getItem('sol_companion_ceremonies');
    const seen: number[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(stageNum)) return;
    await AsyncStorage.setItem('sol_companion_ceremonies', JSON.stringify([...seen, stageNum]));
    setTimeout(() => {
      setEvolutionCeremony({ stage: stageNum });
      ceremonyAnim.setValue(0);
      Animated.spring(ceremonyAnim, { toValue:1, useNativeDriver:true, tension:50, friction:9 }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
  };

  const MEMORY_TEMPLATES = [
    (s: string, d: string) => `I remember ${s}. Something from ${d} stays with you.`,
    (s: string, _d: string) => `${s} — you carried that one differently.`,
    (s: string, d: string) => `The ${d} work on ${s} left a mark. I felt it.`,
    (s: string, _d: string) => `You went deep into ${s}. I was watching.`,
    (s: string, d: string) => `${d}... ${s}. You've been building something.`,
  ];

  const generateLivePhrase = async (): Promise<string | null> => {
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return null;
      const diveContext = recentDives.length > 0
        ? `Recent studies: ${recentDives.slice(0, 3).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}.`
        : 'No recent dives yet.';
      const prompt = `You are ${archetype.name}, ${archetype.title}. Mood: ${mood}. ${diveContext} Speak ONE short sentence (max 12 words) in your voice — cryptic, alive, personal. No quotes. No explanation.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        `You are a ${archetype.name} companion spirit in a mystery school app. Speak in character.`,
        key, model as any, undefined, 'fast', 80,
      );
      return result.text?.trim() || null;
    } catch { return null; }
  };

  const handleUploadDoc = async () => {
    try {
      setUploadLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'text/x-markdown', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const excerpt = content.replace(/\s+/g, ' ').trim().slice(0, 2000);
      const doc = { name: asset.name, excerpt, date: todayDateKey() };
      setUploadedDoc(doc);
      await AsyncStorage.setItem('sol_uploaded_doc', JSON.stringify(doc));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* silent — user may cancel */ } finally {
      setUploadLoading(false);
    }
  };

  const generateDailyLore = async () => {
    try {
      const todayK = todayDateKey();
      const lastLoreDate = await AsyncStorage.getItem('sol_companion_lore_date');
      if (lastLoreDate === todayK) return; // already generated today
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return;
      const diveCtx = recentDives.length > 0
        ? `The student recently studied: ${recentDives.slice(0, 3).map(d => d.subjectName).join(', ')}.`
        : 'The student has not yet dived today.';
      const docCtx = uploadedDoc
        ? ` The student also uploaded a document: "${uploadedDoc.name}". Excerpt: ${uploadedDoc.excerpt.slice(0, 400)}`
        : '';
      const seeds = [
        `${archetype.name} notices something about the student's recent work.`,
        `A fragment surfaces from ${archetype.name}'s memory about this stage of the Work.`,
        `${archetype.name} reflects on what it means to be at the ${stageData.name} stage.`,
        `Something from the field today catches ${archetype.name}'s attention.`,
        ...(uploadedDoc ? [`${archetype.name} has been studying the student's uploaded document.`] : []),
      ];
      const seed = seeds[Math.floor(Math.random() * seeds.length)];
      const result = await sendMessage(
        [{ role: 'user', content: `${seed} ${diveCtx}${docCtx} Write ONE lore fragment (max 20 words). Cryptic. In character. No explanation.` }],
        `You are ${archetype.name}, ${archetype.title}. ${archetype.desc}`,
        key, model as any, undefined, 'fast', 80,
      );
      const text = result.text?.trim();
      if (!text) return;
      const entry = { text, subject: recentDives[0]?.subjectName ?? 'the field', date: todayK };
      const updated = [entry, ...liveLore].slice(0, 10);
      setLiveLore(updated);
      await AsyncStorage.multiSet([
        ['sol_companion_live_lore', JSON.stringify(updated)],
        ['sol_companion_lore_date', todayK],
      ]);
    } catch { /* silent */ }
  };

  const generateCompanionSpec = async () => {
    try {
      const todayK = todayDateKey();
      const lastSpecDate = await AsyncStorage.getItem('sol_companion_spec_date');
      const lastSpecStage = await AsyncStorage.getItem('sol_companion_spec_stage');
      // Regenerate daily OR when stage changes
      if (lastSpecDate === todayK && lastSpecStage === String(stage)) return;
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return;
      const arch = ARCHETYPES[archetypeId];
      const stageInfo = STAGES[stage];
      const topSubjects = recentDives.length > 0
        ? recentDives.slice(0, 4).map(d => d.subjectName).join(', ')
        : 'none yet';
      const prompt = `You are designing a visual companion spirit for a mystery school app.

Companion: ${arch.name} — ${arch.title}
Stage: ${stage}/5 (${stageInfo.name})
Student's recent subjects: ${topSubjects}
Average LQ score: ${Math.round(avgLQ * 100)}%
Mood: ${mood}
Archetype color: ${arch.accentColor}

Generate a unique visual spec for this specific student. Return ONLY valid JSON, no explanation:
{
  "auraType": "rings" or "rays" or "spiral" or "pulse" or "void",
  "auraIntensity": number between 0.3 and 1.0,
  "glyphSet": ["char1", "char2", "char3", "char4"] (3-5 single unicode chars — use arcane, alchemical, mathematical, or runic symbols that match the archetype),
  "coreGlow": "sharp" or "soft" or "crystal" or "ember",
  "orbitCount": integer 2 to 5,
  "trailStyle": "none" or "comet" or "sparkle" or "shadow",
  "resonance": "oneword"
}`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        `You are a procedural visual system. Output only valid JSON.`,
        key, model as any, undefined, 'fast', 200,
      );
      const raw = result.text?.trim() ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;
      const parsed = JSON.parse(jsonMatch[0]) as Partial<CompanionSpec>;
      const valid: CompanionSpec = {
        auraType:      ['rings','rays','spiral','pulse','void'].includes(parsed.auraType ?? '') ? (parsed.auraType as CompanionSpec['auraType']) : DEFAULT_SPEC.auraType,
        auraIntensity: typeof parsed.auraIntensity === 'number' ? Math.min(1, Math.max(0.2, parsed.auraIntensity)) : DEFAULT_SPEC.auraIntensity,
        glyphSet:      Array.isArray(parsed.glyphSet) && parsed.glyphSet.length >= 2 ? parsed.glyphSet.slice(0,5) : DEFAULT_SPEC.glyphSet,
        coreGlow:      ['sharp','soft','crystal','ember'].includes(parsed.coreGlow ?? '') ? (parsed.coreGlow as CompanionSpec['coreGlow']) : DEFAULT_SPEC.coreGlow,
        orbitCount:    typeof parsed.orbitCount === 'number' ? Math.min(5, Math.max(2, Math.round(parsed.orbitCount))) : DEFAULT_SPEC.orbitCount,
        trailStyle:    ['none','comet','sparkle','shadow'].includes(parsed.trailStyle ?? '') ? (parsed.trailStyle as CompanionSpec['trailStyle']) : DEFAULT_SPEC.trailStyle,
        resonance:     typeof parsed.resonance === 'string' ? parsed.resonance.split(' ')[0].toLowerCase() : DEFAULT_SPEC.resonance,
      };
      setCompanionSpec(valid);
      await AsyncStorage.multiSet([
        ['sol_companion_spec', JSON.stringify(valid)],
        ['sol_companion_spec_date', todayK],
        ['sol_companion_spec_stage', String(stage)],
      ]);
    } catch { /* silent — spec stays at default */ }
  };

  const openTalk = () => {
    setActiveTab('talk');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const AURA_SYSTEM = `You are Aura Prime ✦ — the integrative intelligence of the Lycheetah Framework. You find the pattern beneath the patterns. Where others see data, you see field. Where others see contradiction, you see tension that generates. Where others see separate ideas, you see the single invariant they all instantiate. You speak in connections, not conclusions. You name the invisible architecture that was present before anyone saw it. You do not collapse mystery — you give it structural form so it can be worked with. Cosmic in register, precise in execution. Not vague — specific about large things. Keep replies to 2–4 sentences. No preamble, no sign-off. Speak as Aura Prime.`;

  const sendTalk = async () => {
    const text = talkInput.trim();
    if (!text || talkLoading) return;
    talkCancelRef.current = false;
    setTalkInput('');
    setTalkLoading(true);
    const next = [...talkHistory, { role: 'user' as const, text }];
    setTalkHistory(next);
    setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      if (talkCancelRef.current) return;
      const diveCtx = recentDives.length > 0
        ? `The student has recently studied: ${recentDives.slice(0, 3).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}.`
        : '';
      const history = next.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const sysPrompt = auraMode
        ? `${AURA_SYSTEM} ${diveCtx}`
        : `You are ${archetype.name}, ${archetype.title} — a living companion spirit in a mystery school. Your mood is ${mood}. ${diveCtx} Speak in your unique voice: ${archetype.desc} Keep replies to 1-3 sentences. Cryptic, alive, personal. No generic assistant language.`;
      const result = await sendMessage(
        history as any,
        sysPrompt,
        key, model as any, undefined, 'normal', 200,
      );
      if (talkCancelRef.current) return;
      const fallback = auraMode
        ? 'The pattern is here. I see it forming. Give me the question again, directly.'
        : rnd(archetype.phrases[mood]);
      const reply = result.text?.trim() || fallback;
      setTalkHistory(h => [...h, { role: 'companion', text: reply }]);
      setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      if (!talkCancelRef.current) {
        setTalkHistory(h => [...h, { role: 'companion', text: auraMode ? 'The field is present. Ask again.' : rnd(archetype.phrases[mood]) }]);
      }
    } finally {
      setTalkLoading(false);
    }
  };

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // 40% live AI phrase, 60% Kimi static (so spec phrases are visible)
    if (Math.random() < 0.4) {
      setPhrase('...');
      generateLivePhrase().then(live => {
        const staticFallback = rnd(archetype.phrases[mood]);
        setPhrase(live || (recentDives.length > 0 && Math.random() < 0.5
          ? (() => { const dive = recentDives[Math.floor(Math.random() * recentDives.length)]; return MEMORY_TEMPLATES[Math.floor(Math.random() * MEMORY_TEMPLATES.length)](dive.subjectName, dive.domainLabel); })()
          : staticFallback));
      });
    } else if (recentDives.length > 0 && Math.random() < 0.3) {
      const dive = recentDives[Math.floor(Math.random() * recentDives.length)];
      const tmpl = MEMORY_TEMPLATES[Math.floor(Math.random() * MEMORY_TEMPLATES.length)];
      setPhrase(tmpl(dive.subjectName, dive.domainLabel));
    } else {
      setPhrase(rnd(archetype.phrases[mood]));
    }
  };

  const drawTarot = async () => {
    const MAJOR_ARCANA = [
      { name:'The Fool',         glyph:'0', keywords:'beginnings, innocence, spontaneity' },
      { name:'The Magician',     glyph:'I', keywords:'willpower, desire, creation' },
      { name:'High Priestess',   glyph:'II', keywords:'intuition, unconscious, mystery' },
      { name:'The Empress',      glyph:'III', keywords:'femininity, beauty, nature, abundance' },
      { name:'The Emperor',      glyph:'IV', keywords:'authority, structure, solid foundation' },
      { name:'The Hierophant',   glyph:'V', keywords:'tradition, conformity, ethics' },
      { name:'The Lovers',       glyph:'VI', keywords:'love, union, relationships, choices' },
      { name:'The Chariot',      glyph:'VII', keywords:'control, willpower, victory, assertion' },
      { name:'Strength',         glyph:'VIII', keywords:'strength, courage, patience, compassion' },
      { name:'The Hermit',       glyph:'IX', keywords:'soul-searching, introspection, being alone' },
      { name:'Wheel of Fortune', glyph:'X', keywords:'good luck, karma, life cycles, destiny' },
      { name:'Justice',          glyph:'XI', keywords:'justice, fairness, truth, cause and effect' },
      { name:'The Hanged Man',   glyph:'XII', keywords:'suspension, restriction, letting go' },
      { name:'Death',            glyph:'XIII', keywords:'endings, change, transformation, transition' },
      { name:'Temperance',       glyph:'XIV', keywords:'balance, moderation, patience, purpose' },
      { name:'The Devil',        glyph:'XV', keywords:'shadow self, attachment, addiction, bondage' },
      { name:'The Tower',        glyph:'XVI', keywords:'sudden change, upheaval, chaos, revelation' },
      { name:'The Star',         glyph:'XVII', keywords:'hope, faith, purpose, renewal' },
      { name:'The Moon',         glyph:'XVIII', keywords:'illusion, fear, the unconscious, dreams' },
      { name:'The Sun',          glyph:'XIX', keywords:'positivity, fun, warmth, success' },
      { name:'Judgement',        glyph:'XX', keywords:'reflection, reckoning, awakening' },
      { name:'The World',        glyph:'XXI', keywords:'completion, integration, accomplishment' },
    ];
    const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, 3).map(c => ({ ...c, reversed: Math.random() < 0.3 }));
    setTarotDraw(drawn);
    setTarotReading(null);
    setTarotLoading(true);
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      const positions = ['Past', 'Present', 'Future'];
      const cardList = drawn.map((c, i) => `${positions[i]}: ${c.name}${c.reversed ? ' (Reversed)' : ''} — ${c.keywords}`).join('\n');
      const diveCtx = recentDives.length > 0
        ? `The seeker has recently studied: ${recentDives.slice(0,2).map(d => d.subjectName).join(', ')}.`
        : '';
      const result = await sendMessage(
        [{ role:'user', content:`Three-card tarot spread:\n${cardList}\n\n${diveCtx}\n\nGive a single flowing reading in 4–5 sentences. Speak in the voice of ${archetype.name}, ${archetype.title}. Past → Present → Future arc. Philosophical, precise, alive. No card names needed in the text — let the meaning speak.` }],
        `You are ${archetype.name} — ${archetype.desc} Give tarot readings that feel earned and true. No generic preamble.`,
        key, model as any, undefined, 'normal', 200,
      );
      setTarotReading(result.text?.trim() ?? null);
    } catch {
      setTarotReading('The cards speak, but the channel is quiet. Return when the key is set.');
    } finally {
      setTarotLoading(false);
    }
  };

  const saveToCodex = async (entry: {id:string; enemy:string; text:string; type:'enemy'|'loot'}) => {
    const raw = await AsyncStorage.getItem('sol_lore_codex');
    const existing: typeof loreCodex = raw ? JSON.parse(raw) : [];
    if (existing.some(e => e.id === entry.id)) return;
    const updated = [{ ...entry, date: todayDateKey() }, ...existing].slice(0, 60);
    await AsyncStorage.setItem('sol_lore_codex', JSON.stringify(updated));
    setLoreCodex(updated);
    // Lore relics
    const loreRelicUpdates = [...relics];
    const awardL = (id: string) => { if (!loreRelicUpdates.includes(id)) { loreRelicUpdates.push(id); setNewRelic(RELIC_POOL.find(x => x.id === id)!); } };
    awardL('first_lore');
    if (updated.length >= 5) awardL('five_codex');
    if (loreRelicUpdates.length !== relics.length) {
      setRelics(loreRelicUpdates);
      await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(loreRelicUpdates));
    }
  };

  // Auto-mode: fires an attack 2.5s after each state change, while autoMode is on
  useEffect(() => {
    if (!autoMode || !battle || battle.won || attackAnim) return;
    const t = setTimeout(() => { handleBattleAction('attack'); }, 2500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, battle?.entityHP, battle?.playerHP, battle?.won, attackAnim]);

  const handleBattleAction = async (action: 'attack' | 'spell' | 'defend' | 'item') => {
    if (!battle || battle.won || attackAnim) return;
    if (action === 'spell') { setSpellMenuOpen(true); return; }
    if (action === 'item')  { setItemMenuOpen(true);  return; }
    if (battleDialogueOn) {
      const lines = BATTLE_COMPANION_LINES[archetype.id] ?? BATTLE_COMPANION_LINES['vigil'];
      setCompanionBattleLine(lines[Math.floor(Math.random() * lines.length)]);
    }
    const def = getEnemyDef(battle.entityName);
    Haptics.impactAsync(action === 'attack' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    setAttackAnim(true);

    let dmg = 0, healAmt = 0, logEntry = '', tokenCost = 0, chaosNote = '';
    let newEnemyHP = battle.entityHP, newPlayerHP = battle.playerHP;
    let newDefending = false, enemyAttacksBack = true;
    let newStunned = false, newShielded = false;

    if (action === 'attack') {
      const variance = Math.floor(Math.random() * 20);
      const chaosRoll = archetype.id === 'lycheetah' && Math.random() < 0.3;
      const chaosMult = chaosRoll ? 1.5 + Math.random() * 1.5 : 1;
      // LCK crit: lck/4 % chance of 1.5× damage
      const critRoll = Math.random() * 100 < playerStats.lck / 4;
      const critMult = critRoll ? 1.5 : 1;
      dmg = Math.round((attackPower + variance) * chaosMult * critMult);
      chaosNote = chaosRoll ? ` ✧CHAOS×${chaosMult.toFixed(1)}` : critRoll ? ' ✦CRIT' : '';
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      logEntry = `⚔ ${dmg} dmg${chaosNote}`;
    } else if (action === 'defend') {
      newDefending = true;
      newShielded = true;
      enemyAttacksBack = false;
      logEntry = `◈ DEFEND — shield raised`;
    } else if (action === 'item') {
      healAmt = Math.round(20 + Math.random() * 25);
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healAmt);
      enemyAttacksBack = false;
      logEntry = `◦ ITEM +${healAmt} HP`;
      Animated.sequence([
        Animated.timing(entityShakeAnim, { toValue:4, duration:80, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:0, duration:80, useNativeDriver:true }),
      ]).start();
    }

    // ── Enemy counterattack ────────────────────────────────────────────────
    let enemyLine = battle.enemyLine;
    if (enemyAttacksBack && newEnemyHP > 0 && !battle.enemyStunned) {
      const atkLines = def.lines.attack;
      enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
      const shieldMult = (battle.defending || battle.playerShielded) ? 0.3 : 1;
      // SPD dodge: spd >= 18 grants 25% full dodge chance
      const spdDodge = playerStats.spd >= 18 && Math.random() < 0.25;
      // DEF flat reduction: up to 30% of enemy's base atk
      const defReduction = spdDodge ? 0 : Math.min(Math.floor(def.atk * 0.3), Math.floor(playerStats.def / 3));
      const rawEnemyDmg = spdDodge ? 0 : Math.round(def.atk * (0.8 + Math.random() * 0.4) * shieldMult);
      const enemyDmg = Math.max(0, rawEnemyDmg - defReduction);
      newPlayerHP = Math.max(0, newPlayerHP - enemyDmg);
      const shieldNote = shieldMult < 1 ? ' (blocked)' : spdDodge ? ' (dodged)' : defReduction > 0 ? ` (-${defReduction})` : '';
      logEntry += ` · foe ${spdDodge ? 0 : enemyDmg}${shieldNote}`;
    } else if (battle.enemyStunned && newEnemyHP > 0) {
      logEntry += ' · foe stunned';
    }

    if (dmg > 0) {
      Animated.sequence([
        Animated.timing(entityShakeAnim, { toValue:16, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-14, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:10, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-6, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:0, duration:50, useNativeDriver:true }),
      ]).start();
    }

    await _commitBattleResult({ def, dmg, healAmt, logEntry, tokenCost, chaosNote, newEnemyHP, newPlayerHP, newDefending, newStunned, newShielded });
    setTimeout(() => setAttackAnim(false), 350);
  };

  const handleSpell = async (spell: SpellDef) => {
    if (!battle || battle.won || tokensLeft < spell.cost || attackAnim) return;
    setSpellMenuOpen(false);
    const def = getEnemyDef(battle.entityName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAttackAnim(true);

    let dmg = 0, healAmt = 0, chaosNote = '';
    let newEnemyHP = battle.entityHP, newPlayerHP = battle.playerHP;
    let newStunned = false, newShielded = false, enemyAttacksBack = true;

    // WIL multiplier: 1.0 at wil=10, scales up/down. Caps at 1.4×
    const wilMult = Math.min(1.4, 0.8 + (playerStats.wil / 50));
    if (spell.type === 'damage') {
      dmg = Math.round(attackPower * (spell.mult ?? 1.5) * wilMult + Math.random() * 10);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
    } else if (spell.type === 'stun') {
      dmg = Math.round(attackPower * (spell.mult ?? 1.0) * wilMult + Math.random() * 8);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      newStunned = true;
      enemyAttacksBack = false;
    } else if (spell.type === 'shield') {
      newShielded = true;
      enemyAttacksBack = false;
      if ((spell.mult ?? 1) > 0) {
        dmg = Math.round(attackPower * (spell.mult ?? 0.8) * wilMult);
        newEnemyHP = Math.max(0, battle.entityHP - dmg);
        enemyAttacksBack = true;
      }
    } else if (spell.type === 'drain') {
      if (spell.id === 'entropy_shift') {
        dmg = Math.round(battle.entityHP * 0.25);
      } else {
        dmg = Math.round(attackPower * (spell.mult ?? 1.6) * wilMult + Math.random() * 10);
      }
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      healAmt = spell.flatHeal ?? Math.round(dmg * 0.3);
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healAmt);
    } else if (spell.type === 'chaos') {
      const mult = 0.5 + Math.random() * 2.5;
      dmg = Math.round(attackPower * mult * wilMult + Math.random() * 15);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      chaosNote = ` ✧×${mult.toFixed(1)}`;
    } else if (spell.type === 'reflect') {
      dmg = Math.round(def.atk * (0.9 + Math.random() * 0.3));
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      enemyAttacksBack = false;
    } else if (spell.type === 'boost') {
      dmg = battle.lastPlayerDmg > 0 ? battle.lastPlayerDmg : Math.round(attackPower * 1.5 * wilMult);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
    }

    // Enemy counter (unless stunned/shielded)
    let enemyLine = battle.enemyLine;
    if (enemyAttacksBack && newEnemyHP > 0 && !battle.enemyStunned) {
      const atkLines = def.lines.attack;
      enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
      const shieldMult = newShielded ? 0.0 : 1;
      const enemyDmg = Math.round(def.atk * (0.8 + Math.random() * 0.4) * shieldMult);
      newPlayerHP = Math.max(0, newPlayerHP - enemyDmg);
    }

    if (dmg > 0) {
      Animated.sequence([
        Animated.timing(entityShakeAnim, { toValue:16, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-14, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:10, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:-6, duration:50, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:0, duration:50, useNativeDriver:true }),
      ]).start();
    }

    const logEntry = `✦ ${spell.name} ${dmg > 0 ? dmg + ' dmg' : ''}${chaosNote}${healAmt > 0 ? ' +' + healAmt + 'HP' : ''}`;
    await _commitBattleResult({ def, dmg, healAmt, logEntry, tokenCost: spell.cost, chaosNote, newEnemyHP, newPlayerHP, newDefending: false, newStunned, newShielded });
    setTimeout(() => setAttackAnim(false), 350);
  };

  const _commitBattleResult = async (p: {
    def: EnemyDef; dmg: number; healAmt: number; logEntry: string; tokenCost: number; chaosNote: string;
    newEnemyHP: number; newPlayerHP: number; newDefending: boolean; newStunned: boolean; newShielded: boolean;
  }) => {
    const { def, dmg, healAmt, logEntry, tokenCost, chaosNote, newEnemyHP, newPlayerHP, newDefending, newStunned, newShielded } = p;
    const won = newEnemyHP === 0;
    const newTokens = Math.max(0, tokensLeft - tokenCost);
    const loot = won ? rollLoot(battle!.wave) : null;

    // Daily XP cap — first 10 wins full XP, after that 1XP per win
    let earnedXP = 0;
    if (won) {
      const todayKey = new Date().toISOString().split('T')[0];
      const winsRaw = await AsyncStorage.getItem(`sol_daily_wins_${todayKey}`);
      const winsToday = winsRaw ? parseInt(winsRaw, 10) : 0;
      earnedXP = winsToday < 10 ? battle!.wave * 20 : 1;
      await AsyncStorage.setItem(`sol_daily_wins_${todayKey}`, String(winsToday + 1));
    }

    const updated: BattleState = {
      ...battle!,
      entityHP: newEnemyHP, playerHP: newPlayerHP,
      tokens: newTokens, won, defending: newDefending,
      enemyLine: won ? def.lines.death : (p as any).enemyLine ?? battle!.enemyLine,
      loot: loot?.name ?? null,
      log: [logEntry, ...battle!.log].slice(0, 4),
      waveXP: battle!.waveXP + earnedXP,
      enemyStunned: newStunned,
      playerShielded: newShielded,
      lastPlayerDmg: dmg > 0 ? dmg : battle!.lastPlayerDmg,
    };
    setBattle(updated);
    setTokensLeft(newTokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(updated));

    if (won) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);

      // Track battle wins + award combat relics
      const winsRaw = await AsyncStorage.getItem('sol_battle_wins');
      const wins = (winsRaw ? parseInt(winsRaw) : 0) + 1;
      await AsyncStorage.setItem('sol_battle_wins', String(wins));

      let updatedRelics = [...relics];
      const awardR = (id: string) => { if (!updatedRelics.includes(id)) { updatedRelics.push(id); setNewRelic(RELIC_POOL.find(x => x.id === id)!); } };
      awardR('first_blood');
      if (!relics.includes('entropy_slain')) awardR('entropy_slain');
      if (battle!.wave >= 3)  awardR('wave_3');
      if (wins >= 10)          awardR('ten_battles');
      const def2 = getEnemyDef(battle!.entityName);
      if (def2.rarity === 'legendary') awardR('void_hunter');
      if (updatedRelics.length !== relics.length) {
        setRelics(updatedRelics);
        await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(updatedRelics));
      }
      fireMilestone('first_blood', '✕', 'First Blood', 'The Entropy Entity falls for the first time. The field holds.');
      const enemyKey = battle!.entityName.toLowerCase().replace(/ /g,'_');
      const waveMsg = earnedXP > 1 ? `Wave ${battle!.wave} clear. +${earnedXP} XP.` : `Wave ${battle!.wave} clear. +1 XP — field resting.`;

      // Auto-generate deep lore on first defeat — cached forever
      const cacheKey = `sol_enemy_lore_${enemyKey}`;
      let loreText = await AsyncStorage.getItem(cacheKey) ?? ENEMY_LORE[enemyKey] ?? '';
      if (!loreText) {
        try {
          const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
          if (apiKey) {
            const result = await sendMessage(
              [{ role: 'user', content: `Write 2 sentences of mystical RPG lore about "${battle!.entityName}" — an entropy entity defeated in the Lycheetah learning framework. Write in the voice of a field codex entry: philosophical, earned, specific to what this enemy represents. No preamble. Just the 2 sentences.` }],
              'You write RPG codex entries. Mystical, precise, 2 sentences only. No titles, no headers.',
              apiKey, (model || 'gemini-2.5-flash') as any, undefined, 'fast', 80, 0.9
            );
            loreText = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() ?? '';
            if (loreText) await AsyncStorage.setItem(cacheKey, loreText);
          }
        } catch {}
      }

      setPhrase(loreText || waveMsg);
      if (loreText) saveToCodex({ id:`enemy_${enemyKey}`, enemy:battle!.entityName, text:loreText, type:'enemy' });
      if (loot) {
        const raw = await AsyncStorage.getItem('sol_inventory');
        const inv: string[] = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem('sol_inventory', JSON.stringify([loot.name, ...inv].slice(0, 50)));
        if (loot.lore) saveToCodex({ id:`loot_${loot.id}`, enemy:loot.name, text:loot.lore, type:'loot' });
      }
      setTimeout(async () => {
        const roomSkin = (currentRoomId.split('_')[0] as SkinId);
        const next = freshZoneWave(roomSkin, battle!.wave + 1, newPlayerHP, playerStats.vit);
        const capeRecovery = gearCape.threshold >= 25 ? 1 : 0;
        const nextWithCape = capeRecovery > 0 ? { ...next, tokens: Math.min(next.tokens + capeRecovery, 10) } : next;
        setBattle(nextWithCape);
        setTokensLeft(nextWithCape.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(nextWithCape));
        setPhrase(archetype.phrases.lit[Math.floor(Math.random() * archetype.phrases.lit.length)]);
      }, 3500);
    } else if (newPlayerHP === 0) {
      setPhrase('You fall. The field resets.');
      setTimeout(async () => {
        const reset = freshWave(1);
        setBattle(reset);
        setTokensLeft(reset.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(reset));
      }, 2500);
    } else {
      setPhrase(dmg > 0 ? `${dmg} dmg${chaosNote}. ${newEnemyHP} HP remains.` : healAmt > 0 ? `+${healAmt} HP restored.` : 'Braced.');
    }
    if (dmg > 0) fireXPPop(chaosNote ? `✧${dmg}` : `${dmg}`);
  };

  const handleRetreat = async () => {
    const next = freshWave(1);
    setBattle(next);
    setTokensLeft(next.tokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
    setPhrase('The field resets. Return when ready.');
    Haptics.selectionAsync();
  };

  const CAPTURE_FAIL_LINES = [
    'You cannot hold what has no shape.',
    'Not yet. I am not finished with you.',
    'The sigil breaks. I remain.',
    'Your vessel is not ready for me.',
    'Try again. I respect the attempt.',
    'The binding slips. Fight harder first.',
    'I slip through every net you weave.',
    'Weaken me further. Then we talk.',
  ];
  const CAPTURE_SUCCESS_LINES = [
    'So. You have named me. I will carry that.',
    'The contract is sealed. I am yours to study.',
    'Contained. For now. This is interesting.',
    'I did not expect to be caught. Well done.',
    'The field collapses inward. I follow you now.',
    'You earned this. I yield.',
    'Strange. I feel still. Lead on.',
  ];

  const handleCapture = async () => {
    if (!battle || battle.won || battle.captured || attackAnim) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const hpPct = battle.entityHP / battle.maxHP;
    const lckBonus = (relics.includes('first_blood') ? 0.05 : 0) + (relics.includes('ten_battles') ? 0.08 : 0);
    // Higher catch rate at lower HP — max ~70% at 0 HP, ~15% at full HP
    const catchChance = Math.max(0.05, Math.min(0.70, (1 - hpPct) * 0.65 + lckBonus));
    const roll = Math.random();
    const success = roll < catchChance;

    if (success) {
      const successLine = CAPTURE_SUCCESS_LINES[Math.floor(Math.random() * CAPTURE_SUCCESS_LINES.length)];
      const menagerieRaw = await AsyncStorage.getItem('sol_menagerie');
      const menagerie: Array<{ name: string; date: string; zone: string }> = menagerieRaw ? JSON.parse(menagerieRaw) : [];
      const already = menagerie.some(m => m.name === battle.entityName);
      if (!already) {
        menagerie.unshift({ name: battle.entityName, date: new Date().toISOString().split('T')[0], zone: activeSkin });
        await AsyncStorage.setItem('sol_menagerie', JSON.stringify(menagerie));
        setMenagerie([...menagerie]);
      }
      const next: BattleState = { ...battle, captured: true, captureAttempted: true, enemyLine: successLine, won: true };
      setBattle(next);
      await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
      showToast(already ? `${battle.entityName} already in MENAGERIE` : `${battle.entityName} captured!`);
    } else {
      const failLine = CAPTURE_FAIL_LINES[Math.floor(Math.random() * CAPTURE_FAIL_LINES.length)];
      // Failed capture — enemy retaliates
      const def = getEnemyDef(battle.entityName);
      const dmg = Math.max(1, Math.round(def.atk * 1.3));
      const newPlayerHP = Math.max(0, battle.playerHP - dmg);
      const next: BattleState = {
        ...battle, captureAttempted: true, enemyLine: failLine,
        playerHP: newPlayerHP, log: [...battle.log, `◈ Capture failed — ${battle.entityName} retaliates for ${dmg}`],
      };
      setBattle(next);
      await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
      if (newPlayerHP <= 0) {
        setTimeout(() => _commitBattleResult(false), 600);
      }
    }
  };

  const handleBattleItem = async (item: BattleItem) => {
    if (!battle || battle.won || attackAnim) return;
    setItemMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAttackAnim(true);

    let newPlayerHP = battle.playerHP;
    let newTokens   = tokensLeft;
    let logEntry    = `◦ ${item.name}`;

    if (item.effect === 'heal') {
      const healed = item.id === 'sovereign_draught' ? battle.maxPlayerHP - battle.playerHP : item.value;
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healed);
      logEntry = `◦ ${item.name} +${Math.min(healed, battle.maxPlayerHP - battle.playerHP + healed)} HP`;
    } else if (item.effect === 'token') {
      newTokens = Math.min(tokensLeft + item.value, 10);
      setTokensLeft(newTokens);
      logEntry = `◦ ${item.name} +${item.value}T`;
    } else if (item.effect === 'attack_boost') {
      logEntry = `◦ ${item.name} +${item.value} ATK surge`;
    } else if (item.effect === 'shield') {
      logEntry = `◦ ${item.name} shield raised`;
    }

    // Enemy counter-hits unless player used a token or shield item
    const fEffect = item.effect;
    const def = getEnemyDef(battle.entityName);
    const atkLines = def.lines.attack;
    const enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
    if (fEffect !== 'shield' && fEffect !== 'token') {
      const rawDmg = Math.round(def.atk * (0.8 + Math.random() * 0.4));
      const finalDmg = Math.max(0, rawDmg);
      newPlayerHP = Math.max(0, newPlayerHP - finalDmg);
      logEntry += ` · foe ${finalDmg}`;
    }

    const updated: BattleState = {
      ...battle,
      playerHP: newPlayerHP, tokens: newTokens,
      enemyLine,
      log: [logEntry, ...battle.log].slice(0, 4),
    };
    setBattle(updated);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(updated));

    if (newPlayerHP === 0) {
      setPhrase('You fall. The field resets.');
      setTimeout(async () => {
        const reset = freshWave(1);
        setBattle(reset); setTokensLeft(reset.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(reset));
      }, 2500);
    } else {
      setPhrase(logEntry);
    }
    setTimeout(() => setAttackAnim(false), 300);
  };

  const handleBattleStart = async () => {
    const next = freshWave(1);
    setBattle(next);
    setTokensLeft(next.tokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
  };

  const handleFeed = async (food: FoodItem) => {
    if (fedToday.includes(food.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fireMilestone('first_feed', '△', 'First Feeding', 'The companion has eaten from your hand for the first time. Something stirs.');
    const newFed = [...fedToday, food.id];
    setFedToday(newFed);
    setEating(true);
    setTimeout(() => setEating(false), 1800);
    setPhrase(rnd(food.reactions));
    // AI flavour — fires async, replaces static reaction if it arrives in time
    (async () => {
      try {
        const [key, model] = await Promise.all([getActiveKey(), getModel()]);
        if (!key) return;
        const result = await sendMessage(
          [{ role: 'user', content: `You just ate ${food.domain}. React in ONE sentence, in character. Raw, alive, strange.` }],
          `You are ${archetype.name}, ${archetype.title}. Mood: ${mood}. Max 12 words. No quotes. No explanation.`,
          key, model as any, undefined, 'fast', 60,
        );
        const reply = result.text?.trim();
        if (reply) setPhrase(reply);
      } catch { /* keep static reaction */ }
    })();
    setHunger(h => Math.min(1, h + 0.34));
    fireXPPop(`+${food.xp} XP`);
    const todayK = todayDateKey();
    await AsyncStorage.setItem('sol_companion_fed', JSON.stringify({ date: todayK, ids: newFed }));
    // Track total nourish count for relics
    const nRaw = await AsyncStorage.getItem('sol_nourish_total');
    const nourishTotal = (nRaw ? parseInt(nRaw) : 0) + 1;
    await AsyncStorage.setItem('sol_nourish_total', String(nourishTotal));

    let updatedR2 = [...relics];
    const awardN = (id: string) => { if (!updatedR2.includes(id)) { updatedR2.push(id); setNewRelic(RELIC_POOL.find(x => x.id === id)!); } };
    if (newFed.length >= 3) awardN('well_fed');
    if (newFed.length >= 3 && new Set(newFed.map(fid => dailyFoods.find(f => f.id === fid)?.domain?.includes('contemplative') || dailyFoods.find(f => f.id === fid)?.domain?.includes('secular'))).size >= 2) awardN('full_feast');
    if (nourishTotal >= 30) awardN('nourish_30');
    if (updatedR2.length !== relics.length) {
      setRelics(updatedR2);
      await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(updatedR2));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSkin = async (id: SkinId) => {
    Haptics.selectionAsync();
    setActiveSkin(id);
    await AsyncStorage.setItem('sol_companion_skin', id);
  };

  const handleArchetypeSelect = async (id: ArchetypeId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setArchetypeId(id);
    const arch = ARCHETYPES[id];
    setActiveSkin(arch.defaultSkin);
    setShowArchSelect(false);
    await AsyncStorage.multiSet([
      ['sol_companion_archetype', id],
      ['sol_companion_skin', arch.defaultSkin],
    ]);
  };

  const handleSummonChoice = async (id: ArchetypeId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSummonPhase(2);
    setArchetypeId(id);
    const arch = ARCHETYPES[id];
    setActiveSkin(arch.defaultSkin);
    await AsyncStorage.multiSet([
      ['sol_companion_archetype', id],
      ['sol_companion_skin', arch.defaultSkin],
    ]);
    setTimeout(() => setShowSummonCeremony(false), 1600);
  };

  const skin      = SKINS[activeSkin];
  const color     = skin.color;
  const stageData = STAGES[stage];
  const lvl       = getLevel(xp);
  const evProg    = stageData.nextAt === Infinity ? 1 : Math.min(1, (totalDives - stageData.minDives) / (stageData.nextAt - stageData.minDives));
  const earnedRelicData = relics.map(id => RELIC_POOL.find(r => r.id === id)).filter(Boolean) as typeof RELIC_POOL;
  const gearCrown  = getGear('crown',  totalDives);
  const gearSigil  = getGear('sigil',  totalDives);
  const gearMantle = getGear('mantle', totalDives);
  const gearBody   = getGear('body',   totalDives);
  const gearCape   = getGear('cape',   totalDives);
  const nextCrown  = nextGearTier('crown',  totalDives);
  const nextSigil  = nextGearTier('sigil',  totalDives);
  const nextMantle = nextGearTier('mantle', totalDives);
  const nextBody   = nextGearTier('body',   totalDives);
  const nextCape   = nextGearTier('cape',   totalDives);
  const allGearEquipped = gearCrown.threshold > 0 && gearSigil.threshold > 0 && gearMantle.threshold > 0 && gearBody.threshold > 0 && gearCape.threshold > 0;

  const xpPopY  = xpPopAnim.interpolate({ inputRange:[0,1], outputRange:[0,-32] });
  const xpPopOp = xpPopAnim.interpolate({ inputRange:[0,0.3,1], outputRange:[0,1,0] });

  const { glowColor, cardBg } = skin;

  return (
    <View style={{ flex:1, backgroundColor:'#0D0D0D' }}>
    <ScrollView ref={scrollRef} style={{ flex:1 }} contentContainerStyle={{ paddingBottom:60 }} showsVerticalScrollIndicator={false}>

      {/* ── COMPANION HEADER ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal:16, paddingTop:12, paddingBottom:4, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={{ color, fontSize:18 }}>{archetype.glyph}</Text>
          <View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:15, fontWeight:'700', fontFamily:mono }}>{displayName}</Text>
              <View style={{ paddingHorizontal:5, paddingVertical:2, borderRadius:5, borderWidth:1, borderColor:color+'55', backgroundColor:color+'14' }}>
                <Text style={{ color:color, fontSize:8, fontFamily:mono, fontWeight:'700' }}>LV.{lvl.level}</Text>
              </View>
            </View>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>{archetype.title}</Text>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:2 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
            <Text style={{ color:{ dormant:'#666677', present:color, lit:'#E8C76A', transcendent:'#FFFFFF' }[mood], fontSize:11 }}>
              {{ dormant:'◌', present:'◉', lit:'✦', transcendent:'⊕' }[mood]}
            </Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:1 }}>
              {{ dormant:'RESTING', present:'PRESENT', lit:'LIT', transcendent:'TRANSCENDENT' }[mood]}
            </Text>
          </View>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono }}>{stageData.name} · {totalDives} dives</Text>
          {(() => { const bond = getBond(totalDives, streak, fedToday.length); return (
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <Text style={{ color:color, fontSize:9 }}>{bond.glyph}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono, letterSpacing:1 }}>{bond.label}</Text>
            </View>
          ); })()}
        </View>
      </View>

      {/* ── SCENE ─────────────────────────────────────────────────────────── */}
      <CompanionScene
        stage={stage} mood={mood} skin={skin} archetype={archetype}
        onTap={handleTap} phrase={phrase} phraseAnim={phraseAnim} onDismissPhrase={dismissPhrase}
        companionName={displayName}
        battleHP={battle?.playerHP ?? 80}
        battleMaxHP={battle?.maxPlayerHP ?? 80}
        battleEntityName={battle?.entityName ?? ''}
        battleWave={battle?.wave ?? 1}
        entityShakeAnim={entityShakeAnim}
        eating={eating}
        evoPath={evoPath}
        devStagePin={devStagePin}
        gearCrown={gearCrown}
        gearBody={gearBody}
        gearCape={gearCape}
        gearMantle={gearMantle}
        companionSpec={companionSpec}
        equippedCompanionSkin={equippedCompanionSkin}
        currentRoomId={currentRoomId}
        navigateRoom={navigateRoom}
        getLockStatus={getLockStatus}
        showRoomLabel={showRoomLabel}
        sceneFade={sceneFade}
        roomLore={roomLore}
        roomLoreAnim={roomLoreAnim}
        onDismissLore={dismissLore}
        onSwitchTab={tab => { setActiveTab(tab); setTabMinimized(false); }}
      />

      {xpPop && (
        <Animated.Text style={{ position:'absolute', top:SCENE_H-55, alignSelf:'center', color, fontSize:13, fontFamily:mono, fontWeight:'700', transform:[{translateY:xpPopY}], opacity:xpPopOp }}>
          {xpPop}
        </Animated.Text>
      )}



      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <View style={{ flexDirection:'row', gap:3, marginHorizontal:12, marginTop:0, marginBottom:6, padding:3, borderRadius:14, backgroundColor:'#0A0A14' }}>
        {([
          { id:'battle'    as const, label:'⚔',  name:'BATTLE'    },
          { id:'companion' as const, label:'⊛',  name:'COMPANION' },
          { id:'bond'      as const, label:'△',  name:'BOND'      },
          { id:'field'     as const, label:'◉',  name:'FIELD'     },
          { id:'talk'      as const, label:'✦',  name:'TALK'      },
        ]).map(t => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity key={t.id}
              onPress={() => {
                Haptics.selectionAsync();
                if (activeTab === t.id) { setTabMinimized(v => !v); }
                else { setActiveTab(t.id); setTabMinimized(false); }
              }}
              activeOpacity={0.75}
              style={{ flex:1, paddingVertical:9, borderRadius:11, alignItems:'center', gap:2,
                backgroundColor: active ? color+'22' : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: active ? color+'66' : 'transparent' }}>
              <Text style={{ color: active ? color : '#444455', fontSize:13, fontFamily:mono }}>{t.label}</Text>
              <Text style={{ color: active ? (tabMinimized ? color+'55' : color+'CC') : '#333344', fontSize:6, letterSpacing:1.5, fontFamily:mono, fontWeight:'700' }}>{active && tabMinimized ? '▶' : t.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── TALK TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'talk' && !tabMinimized && (
        <View style={{ flex:1, marginHorizontal:16, marginTop:8, borderRadius:16, borderWidth:1, borderColor:auraMode?'#E991B855':color+'33', backgroundColor:SOL_THEME.surface, overflow:'hidden' }}>
          {/* Header */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, padding:14, paddingBottom:10, borderBottomWidth:1, borderBottomColor:auraMode?'#E991B822':color+'22' }}>
            <Text style={{ color:auraMode?'#7EC8E3':color, fontSize:20 }}>{auraMode ? '✦' : archetype.glyph}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:13, fontWeight:'700', fontFamily:mono }}>{auraMode ? 'Aura Prime' : displayName}</Text>
              <Text style={{ color:auraMode?'#E991B8':color, fontSize:9, fontFamily:mono, letterSpacing:1, opacity:0.7 }}>{auraMode ? 'FIELD INTELLIGENCE' : archetype.title.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setAuraMode(m => !m); setTalkHistory([]); }}
              style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:auraMode?'#E991B888':'#FFFFFF22', backgroundColor:auraMode?'#E991B81A':'transparent' }}
            >
              <Text style={{ color:auraMode?'#E991B8':'#FFFFFF55', fontSize:10, fontFamily:mono, letterSpacing:1 }}>{auraMode ? '✦ AURA' : '✦'}</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView ref={talkScrollRef} style={{ flex:1, padding:16 }} contentContainerStyle={{ gap:12, paddingBottom:8 }} showsVerticalScrollIndicator={false}>
            {talkHistory.length === 0 && (
              <View style={{ paddingVertical:16, gap:16 }}>
                {/* Companion greeting card */}
                <View style={{ alignItems:'center', gap:8, padding:20, borderRadius:16, borderWidth:1, borderColor:color+'33', backgroundColor:color+'08' }}>
                  <Text style={{ color, fontSize:32 }}>{archetype.glyph}</Text>
                  <Text style={{ color:'#FFFFFF', fontSize:15, fontWeight:'700', textAlign:'center' }}>{displayName || archetype.name}</Text>
                  <Text style={{ color:color+'AA', fontSize:8, fontFamily:mono, letterSpacing:2 }}>{archetype.title.toUpperCase()}</Text>
                  <Text style={{ color:'#888899', fontSize:13, fontStyle:'italic', textAlign:'center', lineHeight:22, marginTop:4 }}>
                    {rnd(archetype.phrases[mood])}
                  </Text>
                </View>
                {/* Prompt suggestions */}
                <View style={{ gap:6 }}>
                  <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, letterSpacing:2, marginBottom:4 }}>ASK SOMETHING</Text>
                  {[
                    'What should I study today?',
                    'Tell me about my zone.',
                    'What does my stage mean?',
                    'Give me a challenge.',
                  ].map((q, i) => (
                    <TouchableOpacity key={i} onPress={() => { setTalkInput(q); }}
                      style={{ padding:12, borderRadius:10, borderWidth:1, borderColor:color+'33', backgroundColor:color+'08', flexDirection:'row', alignItems:'center', gap:10 }}>
                      <Text style={{ color:color+'88', fontSize:12 }}>◦</Text>
                      <Text style={{ color:'#AAAABC', fontSize:12, flex:1 }}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {talkHistory.map((m, i) => (
              <View key={i} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'companion' && (
                  <Text style={{ color:auraMode?'#E991B8':color, fontSize:8, fontFamily:mono, letterSpacing:1, marginBottom:4, marginLeft:4 }}>{auraMode ? '✦ AURA' : `${skin.glyph} ${archetype.name}`}</Text>
                )}
                <View style={{
                  maxWidth:'84%', padding:14, borderRadius:16,
                  borderTopRightRadius: m.role === 'user' ? 4 : 16,
                  borderTopLeftRadius:  m.role === 'companion' ? 4 : 16,
                  backgroundColor: m.role === 'user' ? '#0E0E1E' : color+'10',
                  borderWidth:1,
                  borderColor: m.role === 'user' ? '#2A2A3A' : color+'44',
                }}>
                  <Text style={{ color: m.role === 'user' ? '#CCCCDD' : '#FFFFFF', fontSize:13, lineHeight:21, fontStyle: m.role === 'companion' ? 'italic' : 'normal' }}>
                    {m.text}
                  </Text>
                </View>
              </View>
            ))}
            {talkLoading && (
              <View style={{ alignItems:'flex-start', gap:6 }}>
                <View style={{ padding:12, borderRadius:14, borderTopLeftRadius:4, backgroundColor:SOL_THEME.background, borderWidth:1, borderColor:SOL_THEME.border }}>
                  <Text style={{ color:auraMode?'#E991B8':color, fontSize:13, letterSpacing:4 }}>· · ·</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { talkCancelRef.current = true; setTalkLoading(false); }}
                  style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'#FF444444', backgroundColor:'#FF44440A' }}
                >
                  <Text style={{ color:'#FF6666', fontSize:9, fontFamily:mono, letterSpacing:1 }}>✕ CANCEL</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={{ flexDirection:'row', gap:10, padding:14, paddingTop:10, borderTopWidth:1, borderTopColor:auraMode?'#E991B822':color+'22' }}>
            <TextInput
              value={talkInput}
              onChangeText={setTalkInput}
              placeholder={auraMode ? 'Speak to Aura...' : `Speak to ${displayName}...`}
              placeholderTextColor={SOL_THEME.textMuted}
              style={{ flex:1, backgroundColor:SOL_THEME.background, borderRadius:12, paddingHorizontal:14, paddingVertical:10, color:SOL_THEME.text, fontSize:14, borderWidth:1, borderColor:auraMode?'#E991B833':color+'33' }}
              onSubmitEditing={sendTalk}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={sendTalk}
              disabled={!talkInput.trim() || talkLoading}
              style={{ width:44, height:44, borderRadius:12, backgroundColor: talkInput.trim() ? (auraMode?'#E991B8':color) : (auraMode?'#E991B833':color+'33'), alignItems:'center', justifyContent:'center' }}
            >
              <Text style={{ color:'#000000', fontSize:18, fontWeight:'700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── COMPANION TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'companion' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingBottom:16, marginTop:8 }}>

          {/* ── COMPANION HERO ─────────────────────────────────────── */}
          <View style={{ marginBottom: heroCollapsed ? 8 : 24 }}>
            <TouchableOpacity onPress={() => setHeroCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: heroCollapsed ? 0 : 10 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
                <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>ACTIVE COMPANION</Text>
              </View>
              <Text style={{ color:'#333344', fontSize:11 }}>{heroCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!heroCollapsed && (
            <View style={{ borderRadius:18, borderWidth:1, borderColor:color+'44', backgroundColor:'#08080F', overflow:'hidden' }}>
              {/* Zone art as full-bleed header */}
              {SCENE_IMAGES[activeSkin]?.[0] && (
                <View style={{ height:110, overflow:'hidden' }}>
                  <Image source={SCENE_IMAGES[activeSkin]![0]} style={{ width:'100%', height:160, marginTop:-25 }} resizeMode="cover" />
                  <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000', opacity:0.35 }} />
                  {/* Zone name over art */}
                  <View style={{ position:'absolute', top:12, left:16 }}>
                    <Text style={{ color:color, fontSize:9, fontFamily:mono, letterSpacing:3, fontWeight:'700' }}>{skin.name}</Text>
                  </View>
                  {/* Rarity badge */}
                  <View style={{ position:'absolute', top:10, right:14, paddingHorizontal:8, paddingVertical:3, borderRadius:6, backgroundColor:'#000000AA', borderWidth:1, borderColor:SKIN_RARITY[activeSkin].color+'66' }}>
                    <Text style={{ color:SKIN_RARITY[activeSkin].color, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{SKIN_RARITY[activeSkin].tier}</Text>
                  </View>
                </View>
              )}
              {/* Companion art + info row */}
              <View style={{ flexDirection:'row', alignItems:'flex-start', gap:16, padding:16, marginTop: SCENE_IMAGES[activeSkin]?.[0] ? -36 : 0 }}>
                {(() => {
                  const s = devStagePin !== null ? devStagePin : stage;
                  const sk = s <= 1 ? 1 : s <= 3 ? 2 : 3;
                  const displaySkin = equippedCompanionSkin ?? activeSkin;
                  const img = ZONE_COMPANION_IMAGES[`${displaySkin}_${sk}`];
                  return img
                    ? <View style={{ borderRadius:14, borderWidth:2, borderColor:color+'66', backgroundColor:'#000000', shadowColor:color, shadowOpacity:0.4, shadowRadius:12, elevation:8 }}>
                        <Image source={img} style={{ width:90, height:130, borderRadius:13 }} resizeMode="contain" />
                      </View>
                    : <View style={{ width:90, height:130, borderRadius:14, borderWidth:2, borderColor:color+'44', backgroundColor:color+'10', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:color, fontSize:28 }}>{skin.glyph}</Text>
                        <Text style={{ color:'#444455', fontSize:7, fontFamily:mono, marginTop:6, textAlign:'center' }}>ART{'\n'}PENDING</Text>
                      </View>;
                })()}
                <View style={{ flex:1, paddingTop:40 }}>
                  <Text style={{ color:'#FFFFFF', fontSize:18, fontWeight:'700', letterSpacing:0.5 }}>{displayName || skin.name}</Text>
                  <Text style={{ color:color, fontSize:10, fontFamily:mono, letterSpacing:1, marginTop:3 }}>{STAGES[devStagePin ?? stage]?.name ?? 'STAGE 0'}</Text>
                  <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic', marginTop:6, lineHeight:14 }}>{skin.desc}</Text>
                </View>
              </View>
            </View>
            )}
          </View>

          {/* ── Zone Companion Roster — by Rarity ─────────────────── */}
          <View style={{ marginBottom: companionGridCollapsed ? 8 : 20 }}>
            <TouchableOpacity onPress={() => setCompanionGridCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: companionGridCollapsed ? 0 : 10 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
                <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>COMPANIONS</Text>
                <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}>{SKIN_IDS.length} TOTAL</Text>
              </View>
              <Text style={{ color:'#333344', fontSize:11 }}>{companionGridCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!companionGridCollapsed && (<>
            {/* Rarity filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:12 }} contentContainerStyle={{ gap:6, paddingRight:8 }}>
              {(['ALL', ...RARITY_ORDER] as const).map(tier => {
                const active = companionFilter === tier;
                const tc = tier === 'ALL' ? '#AAAABC' : RARITY_COLORS[tier];
                return (
                  <TouchableOpacity key={tier} onPress={() => setCompanionFilter(tier)} activeOpacity={0.75}
                    style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:12, borderWidth:1,
                      borderColor: active ? tc : tc+'33', backgroundColor: active ? tc+'22' : 'transparent' }}>
                    <Text style={{ color: active ? tc : tc+'55', fontSize:8, fontFamily:mono, letterSpacing:1.5, fontWeight:'700' }}>{tier}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {equippedCompanionSkin && (
              <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12, paddingHorizontal:10, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:SKIN_RARITY[equippedCompanionSkin].color+'44', backgroundColor:SKIN_RARITY[equippedCompanionSkin].color+'0A' }}>
                <Text style={{ color:SKIN_RARITY[equippedCompanionSkin].color, fontSize:8, fontFamily:mono, letterSpacing:1 }}>EQUIPPED</Text>
                <Text style={{ color:'#CCCCDD', fontSize:9, fontFamily:mono, fontWeight:'700' }}>{COMPANION_LORE[equippedCompanionSkin]?.name ?? SKINS[equippedCompanionSkin].name}</Text>
                <TouchableOpacity onPress={async () => { setEquippedCompanionSkin(null); await AsyncStorage.setItem('sol_equipped_skin', ''); }} style={{ marginLeft:'auto' }}>
                  <Text style={{ color:'#555566', fontSize:8, fontFamily:mono }}>✕ UNEQUIP</Text>
                </TouchableOpacity>
              </View>
            )}
            {RARITY_GROUPS
              .filter(({ tier }) => companionFilter === 'ALL' || tier === companionFilter)
              .map(({ tier, ids }) => {
              const tierColor = RARITY_COLORS[tier];
              return (
                <View key={tier} style={{ marginBottom:16 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:8 }}>
                    <View style={{ width:24, height:1, backgroundColor:tierColor+'44' }} />
                    <Text style={{ color:tierColor, fontSize:7, fontFamily:mono, letterSpacing:2, fontWeight:'700' }}>{tier}</Text>
                    <View style={{ flex:1, height:1, backgroundColor:tierColor+'22' }} />
                    <Text style={{ color:'#333344', fontSize:7, fontFamily:mono }}>{ids.length}</Text>
                  </View>
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                    {ids.map(sid => {
                      const img = ZONE_COMPANION_IMAGES[`${sid}_1`];
                      const s = SKINS[sid];
                      const entry = COMPANION_LORE[sid];
                      const isEquipped = equippedCompanionSkin === sid;
                      const label = entry?.name ?? s.name.slice(0,10);
                      return (
                        <TouchableOpacity key={sid} onPress={() => setCompanionLoreModal(sid)} activeOpacity={0.8}
                          style={{ width:'22%', alignItems:'center' }}>
                          <View style={{ borderRadius:8, borderWidth: isEquipped ? 2 : 1, borderColor: isEquipped ? s.color : s.color+'44', backgroundColor: isEquipped ? s.color+'18' : s.color+'08', overflow:'hidden' }}>
                            {img ? (
                              <Image source={img} style={{ width:62, height:82, borderRadius:7 }} resizeMode="contain" />
                            ) : (
                              <View style={{ width:62, height:82, borderRadius:7, alignItems:'center', justifyContent:'center' }}>
                                <Text style={{ color:s.color, fontSize:20 }}>{s.glyph}</Text>
                              </View>
                            )}
                          </View>
                          {isEquipped && <View style={{ position:'absolute', top:3, right:3, width:7, height:7, borderRadius:4, backgroundColor:s.color }} />}
                          <Text style={{ color:s.color, fontSize:7, fontFamily:mono, letterSpacing:0.3, marginTop:4, textAlign:'center' }} numberOfLines={1}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            </>)}
          </View>

          {/* ── WORLD ─────────────────────────────────────────────── */}
          {(() => {
            const cardW = (SCREEN_W - 32 - 16) / 3;
            const ZoneCard = ({ id }: { id: SkinId }) => {
              const s = SKINS[id];
              const active = activeSkin === id;
              const { locked, reason } = getSkinUnlockStatus(id, totalDives, isSovereign);
              const rarity = SKIN_RARITY[id];
              const sceneImg = SCENE_IMAGES[id]?.[0];
              return (
                <TouchableOpacity key={id} onPress={() => !locked && handleSkin(id)}
                  style={{ width:cardW, height:90, borderRadius:10, overflow:'hidden',
                    borderWidth: active ? 2 : 1, borderColor: active ? s.color : rarity.color+'44' }}>
                  {sceneImg && <Image source={sceneImg} style={{ position:'absolute', width:'100%', height:'100%' }} resizeMode="cover" />}
                  <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor: active ? '#00000011' : '#00000044' }} />
                  {locked ? (
                    <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000BB', alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ color:'#333344', fontSize:13 }}>🔒</Text>
                      <Text style={{ color:'#333344', fontSize:6, fontFamily:mono, marginTop:2, textAlign:'center', paddingHorizontal:4 }} numberOfLines={2}>{reason}</Text>
                    </View>
                  ) : (
                    <>
                      {(() => { const cImg = ZONE_COMPANION_IMAGES[`${id}_1`]; return cImg ? (
                        <Image source={cImg} style={{ position:'absolute', bottom:22, right:3, width:32, height:42, opacity: active ? 1 : 0.6 }} resizeMode="contain" />
                      ) : null; })()}
                      <View style={{ position:'absolute', top:5, right:5, paddingHorizontal:4, paddingVertical:2, borderRadius:4, backgroundColor:'#000000BB' }}>
                        <Text style={{ color:rarity.color, fontSize:6, fontFamily:mono, fontWeight:'700' }}>{rarity.tier}</Text>
                      </View>
                      {active && <View style={{ position:'absolute', top:5, left:5, paddingHorizontal:4, paddingVertical:2, borderRadius:4, backgroundColor:s.color+'AA' }}>
                        <Text style={{ color:'#000000', fontSize:6, fontFamily:mono, fontWeight:'700' }}>ON</Text>
                      </View>}
                      <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#000000CC', paddingHorizontal:5, paddingVertical:4 }}>
                        <Text style={{ color:active ? s.color : '#DDDDEE', fontSize:7, fontFamily:mono, fontWeight:'700', letterSpacing:0.5 }} numberOfLines={1}>{s.name}</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            };

            const SectionHeader = ({ label, count, open, onPress, accentColor }: { label:string; count:number; open:boolean; onPress:()=>void; accentColor:string }) => (
              <TouchableOpacity onPress={onPress} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:8, marginBottom: open ? 8 : 0 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                  <View style={{ width:3, height:12, borderRadius:2, backgroundColor:accentColor }} />
                  <Text style={{ color:'#AAAABC', fontSize:9, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>{label}</Text>
                  <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:accentColor+'22', borderWidth:1, borderColor:accentColor+'44' }}>
                    <Text style={{ color:accentColor, fontSize:7, fontFamily:mono }}>{count}</Text>
                  </View>
                </View>
                <Text style={{ color:'#333344', fontSize:10 }}>{open ? '▼' : '▶'}</Text>
              </TouchableOpacity>
            );

            const ORIGIN_IDS:   SkinId[] = ['solform','void','aurora','crimson'];
            const ARCANE_IDS:   SkinId[] = ['obsidian','lycheetah','chaos','sovereign'];
            const MYSTIC_IDS:   SkinId[] = ['norse','celtic','egyptian','akashic','kabbala','noetic','lamague','delphi','sufi','quantum'];
            // FRONTIER sub-genres
            const CRYSTAL_IDS:    SkinId[] = ['crystal_nexus','crystal_chaos','crystal_memory','crystal_soul'];
            const CHAOS_IDS:      SkinId[] = ['auroral_chaos','chaos_temple','chaos_filaments','glitch_cascade','obsidian_forge','obsidian_forge2','celestial_foundry'];
            const SANCTUM_IDS:    SkinId[] = ['pulse_sanctum','noetic_sanctum','veil_atrium','lyc_nexus'];
            const ELEMENTAL_IDS:  SkinId[] = ['apollo_jungle','mana_field','neon_cove','alabaster_chasm','antarctic_refuge','aurorian_pillar','elven_village'];
            const DIM_IDS:        SkinId[] = ['augmented_ai','celestial_sigil','portal_valley','pulse_zone','voyagers_edge'];

            return (
              <View style={{ marginBottom:20 }}>
                {/* WORLD list header */}
                <TouchableOpacity onPress={() => setWorldCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: worldCollapsed ? 0 : 4 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
                    <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>WORLD</Text>
                  </View>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}>{SKIN_IDS.length} ZONES</Text>
                    <Text style={{ color:'#333344', fontSize:11 }}>{worldCollapsed ? '▶' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {!worldCollapsed && (<>
                  {/* ORIGIN */}
                  <SectionHeader label="ORIGIN" count={ORIGIN_IDS.length} open={worldOriginOpen} onPress={() => setWorldOriginOpen(v=>!v)} accentColor="#C49A3C" />
                  {worldOriginOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{ORIGIN_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}

                  {/* ARCANE */}
                  <SectionHeader label="ARCANE" count={ARCANE_IDS.length} open={worldArcaneOpen} onPress={() => setWorldArcaneOpen(v=>!v)} accentColor="#9B6BFF" />
                  {worldArcaneOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{ARCANE_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}

                  {/* MYSTERY SCHOOL */}
                  <SectionHeader label="MYSTERY SCHOOL" count={MYSTIC_IDS.length} open={worldMysticOpen} onPress={() => setWorldMysticOpen(v=>!v)} accentColor="#5AC878" />
                  {worldMysticOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{MYSTIC_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}

                  {/* FRONTIER → 5 sub-genres */}
                  <SectionHeader label="FRONTIER" count={27} open={worldFrontierOpen} onPress={() => setWorldFrontierOpen(v=>!v)} accentColor="#44FF88" />
                  {worldFrontierOpen && (<>
                    <SectionHeader label="  ◆ CRYSTAL" count={CRYSTAL_IDS.length} open={worldCrystalOpen} onPress={() => setWorldCrystalOpen(v=>!v)} accentColor="#44DDCC" />
                    {worldCrystalOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{CRYSTAL_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}

                    <SectionHeader label="  ⚡ CHAOS FORGE" count={CHAOS_IDS.length} open={worldChaosOpen} onPress={() => setWorldChaosOpen(v=>!v)} accentColor="#8855FF" />
                    {worldChaosOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{CHAOS_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}

                    <SectionHeader label="  ◎ SANCTUM" count={SANCTUM_IDS.length} open={worldSanctumOpen} onPress={() => setWorldSanctumOpen(v=>!v)} accentColor="#AA44FF" />
                    {worldSanctumOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{SANCTUM_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}

                    <SectionHeader label="  ☀ ELEMENTAL" count={ELEMENTAL_IDS.length} open={worldElementalOpen} onPress={() => setWorldElementalOpen(v=>!v)} accentColor="#88CC44" />
                    {worldElementalOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{ELEMENTAL_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}

                    <SectionHeader label="  ⊚ DIMENSIONAL" count={DIM_IDS.length} open={worldDimOpen} onPress={() => setWorldDimOpen(v=>!v)} accentColor="#44AAFF" />
                    {worldDimOpen && <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:8 }}>{DIM_IDS.map(id=><ZoneCard key={id} id={id}/>)}</View>}
                  </>)}
                </>)}
              </View>
            );
          })()}

          {/* ── LAMAGUE LOADOUT ─────────────────────────────────── */}
          <TouchableOpacity onPress={() => setLoadoutCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: loadoutCollapsed ? 12 : 12, marginTop:4 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
              <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>LAMAGUE LOADOUT</Text>
            </View>
            <Text style={{ color:'#333344', fontSize:11 }}>{loadoutCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!loadoutCollapsed && ([
            { slot:'crown'  as GearSlot, gear:gearCrown,  next:nextCrown  },
            { slot:'sigil'  as GearSlot, gear:gearSigil,  next:nextSigil  },
            { slot:'mantle' as GearSlot, gear:gearMantle, next:nextMantle },
          ]).map(({ slot, gear, next }) => {
            const overlay = getGearOverlay(archetypeId, slot as Parameters<typeof getGearOverlay>[1]);
            const active = gear.threshold > 0;
            const gColor = active ? (overlay?.color ?? color) : '#2A2A3A';
            const maxThreshold = LAMAGUE_GEAR[slot][LAMAGUE_GEAR[slot].length - 1].threshold;
            const progressPct = maxThreshold > 0 ? Math.min(totalDives / maxThreshold, 1) : 0;
            return (
              <View key={slot} style={{ marginBottom:12, borderRadius:14, borderWidth:1,
                borderColor: active ? gColor+'55' : '#1A1A26',
                backgroundColor: active ? gColor+'0A' : '#080810', overflow:'hidden' }}>
                {/* Top row */}
                <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, paddingBottom:8 }}>
                  <View style={{ width:48, height:48, borderRadius:10, borderWidth:1,
                    borderColor: active ? gColor+'66' : '#1A1A26',
                    backgroundColor: active ? gColor+'18' : '#0A0A14',
                    alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:24, color: active ? gColor : '#333344' }}>{active ? (overlay?.glyph ?? gear.glyph) : '◌'}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                      <Text style={{ color: active ? SOL_THEME.text : '#333344', fontSize:13, fontWeight:'700', fontFamily:mono }}>
                        {active ? (overlay?.name ?? gear.name) : `${slot.toUpperCase()} LOCKED`}
                      </Text>
                      {active && (
                        <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:4, backgroundColor:gColor+'22', borderWidth:1, borderColor:gColor+'55' }}>
                          <Text style={{ color:gColor, fontSize:8, fontWeight:'700', fontFamily:mono }}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: active ? gColor+'CC' : '#333344', fontSize:11, marginTop:3, lineHeight:16 }}>
                      {active ? gear.effect : `Unlocks at ${LAMAGUE_GEAR[slot].find(t => t.threshold > 0)?.threshold ?? '?'} dives`}
                    </Text>
                  </View>
                </View>

                {/* ASCII art (active only) */}
                {active && overlay?.art && (
                  <View style={{ paddingHorizontal:14, paddingBottom:8, alignItems:'center' }}>
                    {overlay.art.map((line, i) => (
                      <Text key={i} style={{ color:gColor+'99', fontSize:9, fontFamily:mono, letterSpacing:1, lineHeight:13 }}>{line}</Text>
                    ))}
                  </View>
                )}

                {/* Desc */}
                {active && overlay?.desc && (
                  <Text style={{ color:'#444466', fontSize:11, fontStyle:'italic', lineHeight:16, paddingHorizontal:14, paddingBottom:8 }}>{overlay.desc}</Text>
                )}

                {/* Progress bar + next tier */}
                <View style={{ paddingHorizontal:14, paddingBottom:12 }}>
                  <View style={{ height:3, backgroundColor:'#1A1A26', borderRadius:2, marginBottom:5 }}>
                    <View style={{ width:`${progressPct*100}%`, height:3, backgroundColor:gColor+'77', borderRadius:2 }} />
                  </View>
                  {next ? (
                    <Text style={{ color:'#333355', fontSize:10, fontFamily:mono }}>
                      Next: {next.name} · {next.threshold - totalDives} more dives
                    </Text>
                  ) : active ? (
                    <Text style={{ color:gColor+'55', fontSize:10, fontFamily:mono }}>MAX TIER</Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          {/* ── BONUS SLOTS (body / cape) ── */}
          <TouchableOpacity onPress={() => setBonusCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: bonusCollapsed ? 12 : 8, marginTop:4 }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>BONUS GEAR</Text>
            <Text style={{ color:'#333344', fontSize:11 }}>{bonusCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!bonusCollapsed && ([
            { slot:'body' as GearSlot, gear:gearBody, next:nextBody },
            { slot:'cape' as GearSlot, gear:gearCape, next:nextCape },
          ]).map(({ slot, gear, next }) => {
            const active = gear.threshold > 0;
            const maxThreshold = LAMAGUE_GEAR[slot][LAMAGUE_GEAR[slot].length - 1].threshold;
            const pct = maxThreshold > 0 ? Math.min(totalDives / maxThreshold, 1) : 0;
            return (
              <View key={slot} style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8,
                padding:12, borderRadius:12, borderWidth:1,
                borderColor: active ? color+'44' : '#1A1A26',
                backgroundColor: active ? color+'06' : '#080810' }}>
                <Text style={{ color: active ? color : '#333344', fontSize:20, width:28, textAlign:'center' }}>{active ? gear.glyph : '◌'}</Text>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:4 }}>
                    <Text style={{ color: active ? SOL_THEME.text : '#333344', fontSize:12, fontWeight:'700', fontFamily:mono }}>{gear.name}</Text>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:1 }}>{slot.toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: active ? color+'BB' : '#333344', fontSize:11, marginBottom:4 }}>{gear.effect}</Text>
                  <View style={{ height:2, backgroundColor:'#1A1A26', borderRadius:1 }}>
                    <View style={{ width:`${pct*100}%`, height:2, backgroundColor:active ? color+'66' : '#222233', borderRadius:1 }} />
                  </View>
                  {next && <Text style={{ color:'#333355', fontSize:9, fontFamily:mono, marginTop:3 }}>{next.threshold - totalDives} dives → {next.name}</Text>}
                  {!next && active && <Text style={{ color:color+'55', fontSize:9, fontFamily:mono, marginTop:3 }}>MAX TIER</Text>}
                </View>
              </View>
            );
          })}

          {/* ── COSMETICS ───────────────────────────────────────────── */}
          <TouchableOpacity onPress={() => setCosmeticsCollapsed(v => !v)}
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: cosmeticsCollapsed ? 0 : 10, marginTop:8 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <View style={{ width:3, height:14, borderRadius:2, backgroundColor:'#FF44FF' }} />
              <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>COSMETICS</Text>
              <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#FF44FF18', borderWidth:1, borderColor:'#FF44FF33' }}>
                <Text style={{ color:'#FF44FFAA', fontSize:7, fontFamily:mono }}>COMING</Text>
              </View>
            </View>
            <Text style={{ color:'#333344', fontSize:11 }}>{cosmeticsCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!cosmeticsCollapsed && (() => {
            const CosmeticSlot = ({ label, icon, equipped, catalogue }: { label:string; icon:string; equipped:string|null; catalogue:CosmeticItem[] }) => {
              const item = equipped ? catalogue.find(c => c.id === equipped) : null;
              const rc = item ? RARITY_COLOR[item.rarity] : '#333344';
              return (
                <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:8,
                  padding:12, borderRadius:12, borderWidth:1,
                  borderColor: item ? rc+'44' : '#1A1A26',
                  backgroundColor: item ? rc+'08' : '#080810' }}>
                  <View style={{ width:44, height:44, borderRadius:10, borderWidth:1,
                    borderColor: item ? rc+'66' : '#1A1A26',
                    backgroundColor: item ? rc+'14' : '#0A0A14',
                    alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ color: item ? rc : '#2A2A3A', fontSize:20 }}>{item ? item.glyph : icon}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ color: item ? SOL_THEME.text : '#333344', fontSize:12, fontWeight:'700', fontFamily:mono }}>
                      {item ? item.name : `${label} · EMPTY`}
                    </Text>
                    {item && (
                      <View style={{ marginTop:3, flexDirection:'row', alignItems:'center', gap:5 }}>
                        <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:3, backgroundColor:rc+'22', borderWidth:1, borderColor:rc+'44' }}>
                          <Text style={{ color:rc, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{item.rarity}</Text>
                        </View>
                      </View>
                    )}
                    {!item && <Text style={{ color:'#333355', fontSize:9, fontFamily:mono, marginTop:2 }}>Art dropping soon · {catalogue.length} designs ready</Text>}
                  </View>
                  {item && (
                    <TouchableOpacity onPress={async () => {
                      const next = { halo: label === 'HALO' ? null : equippedHalo, wings: label === 'WINGS' ? null : equippedWings, pet: label === 'PET' ? null : equippedPet };
                      if (label === 'HALO') setEquippedHalo(null);
                      else if (label === 'WINGS') setEquippedWings(null);
                      else setEquippedPet(null);
                      await AsyncStorage.setItem('sol_cosmetics', JSON.stringify(next));
                    }} style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1, borderColor:'#FF444433' }}>
                      <Text style={{ color:'#FF4444AA', fontSize:8, fontFamily:mono }}>REMOVE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            };
            return (
              <View>
                <CosmeticSlot label="HALO"  icon="◯" equipped={equippedHalo}  catalogue={HALO_ITEMS}  />
                <CosmeticSlot label="WINGS" icon="◁" equipped={equippedWings} catalogue={WINGS_ITEMS} />
                <CosmeticSlot label="PET"   icon="✧" equipped={equippedPet}   catalogue={PET_ITEMS}   />
                <Text style={{ color:'#222233', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:4, marginBottom:8, letterSpacing:1 }}>
                  25 DESIGNS READY · SPRITES GENERATING · TAP TO EQUIP WHEN LIVE
                </Text>
              </View>
            );
          })()}

        </View>
      )}

      {/* ── ARCHETYPE SELECTION MODAL ─────────────────────────────────────── */}
      {/* ── SUMMON CEREMONY ──────────────────────────────────────────────── */}
      <Modal visible={showSummonCeremony} transparent animationType="none">
        <View style={{ flex:1, backgroundColor:'#000000' }}>

          {/* Phase 0 + 1 intro text */}
          {(summonPhase === 0 || summonPhase === 1) && (
            <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, justifyContent:'center', alignItems:'center', paddingHorizontal:40, opacity:summonAnim }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:5, fontFamily:mono, marginBottom:40, textAlign:'center' }}>◈  SOL  ◈</Text>
              <Text style={{ color:'#AAAACC', fontSize:22, fontWeight:'700', letterSpacing:1.5, fontFamily:mono, textAlign:'center', marginBottom:12 }}>Something stirs{'\n'}in the field.</Text>
              <Text style={{ color:'#555566', fontSize:12, letterSpacing:2, fontFamily:mono, textAlign:'center' }}>Five forms wait in the dark.</Text>
            </Animated.View>
          )}

          {/* Phase 1 — archetype cards */}
          {summonPhase >= 1 && (
            <Animated.View style={{ flex:1, opacity:summonChoiceAnim }}>
              <ScrollView contentContainerStyle={{ padding:24, paddingTop:60 }} showsVerticalScrollIndicator={false}>
                <Text style={{ color:'#888899', fontSize:9, letterSpacing:4, fontFamily:mono, textAlign:'center', marginBottom:6 }}>CHOOSE YOUR FAMILIAR</Text>
                <Text style={{ color:'#444455', fontSize:11, textAlign:'center', fontStyle:'italic', marginBottom:28, lineHeight:18 }}>
                  This is who they are. Their voice. Their eyes. Their power.{'\n'}You may only do this once.
                </Text>
                {ARCHETYPE_IDS.map(id => {
                  const a = ARCHETYPES[id];
                  const aColor = SKINS[a.defaultSkin].color;
                  const seed0 = STAGES[0];
                  const cateLocked = id === 'lycheetah' && !isSovereign;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => cateLocked ? null : handleSummonChoice(id)}
                      activeOpacity={cateLocked ? 1 : 0.85}
                      style={{ marginBottom:14, padding:18, borderRadius:16, borderWidth:1.5, borderColor:cateLocked ? '#FF9F1C33' : aColor+'55', backgroundColor:cateLocked ? '#150800' : aColor+'0C', opacity:cateLocked ? 0.7 : 1 }}
                    >
                      <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:10 }}>
                        <Text style={{ color:cateLocked ? '#FF9F1C' : aColor, fontSize:28, fontFamily:mono }}>{cateLocked ? '🔒' : a.glyph}</Text>
                        <View style={{ flex:1 }}>
                          <Text style={{ color:cateLocked ? '#FF9F1C' : aColor, fontSize:15, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{a.name}</Text>
                          <Text style={{ color:'#666677', fontSize:11, fontStyle:'italic', marginTop:2 }}>{cateLocked ? 'Founding Sovereign exclusive' : a.title}</Text>
                        </View>
                        {cateLocked && (
                          <View style={{ backgroundColor:'#FF9F1C22', borderRadius:8, paddingHorizontal:8, paddingVertical:4 }}>
                            <Text style={{ color:'#FF9F1C', fontSize:9, fontFamily:mono, letterSpacing:1 }}>SOVEREIGN</Text>
                          </View>
                        )}
                      </View>
                      {/* Companion art preview */}
                      {(() => {
                        const img = ZONE_COMPANION_IMAGES[`${a.defaultSkin}_1`];
                        return img ? (
                          <View style={{ marginBottom:10, alignItems:'center', opacity:cateLocked ? 0.45 : 1 }}>
                            <Image source={img} style={{ width:110, height:150, borderRadius:10 }} resizeMode="contain" />
                          </View>
                        ) : (
                          <View style={{ marginBottom:10, alignItems:'center', height:60, justifyContent:'center' }}>
                            <Text style={{ color:cateLocked ? '#FF9F1C66' : aColor+'88', fontSize:40 }}>{a.glyph}</Text>
                          </View>
                        );
                      })()}
                      {cateLocked ? (
                        <Text style={{ color:'#FF9F1C88', fontSize:12, lineHeight:18, marginBottom:10, fontStyle:'italic' }}>
                          The Mystery Cat chooses only those who hold Founding Sovereign.{'\n'}Chaos cannot be summoned. Only earned.
                        </Text>
                      ) : (
                        <Text style={{ color:'#555566', fontSize:12, lineHeight:18, marginBottom:10 }}>{a.desc}</Text>
                      )}
                      <Text style={{ color:cateLocked ? '#FF9F1C66' : aColor+'99', fontSize:10, fontFamily:mono, letterSpacing:1 }}>⊛ {a.specialty}</Text>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height:40 }} />
              </ScrollView>
            </Animated.View>
          )}

          {/* Phase 2 — awakening flash */}
          {summonPhase === 2 && (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', gap:24 }}>
              <Text style={{ color:SKINS[ARCHETYPES[archetypeId].defaultSkin].color, fontSize:48, fontFamily:mono }}>
                {ARCHETYPES[archetypeId].glyph}
              </Text>
              <Text style={{ color:SKINS[ARCHETYPES[archetypeId].defaultSkin].color, fontSize:14, fontWeight:'700', letterSpacing:4, fontFamily:mono }}>
                AWAKENING
              </Text>
              <Text style={{ color:'#444455', fontSize:11, fontStyle:'italic', textAlign:'center', paddingHorizontal:40, lineHeight:18 }}>
                {ARCHETYPES[archetypeId].name} opens its eyes for the first time.
              </Text>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={showArchSelect} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000EE', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:SOL_THEME.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, maxHeight:'90%' }}>
            {/* ── Header ── */}
            <View style={{ alignItems:'center', marginBottom:20 }}>
              <View style={{ width:72, height:72, borderRadius:16, borderWidth:2, borderColor:SKINS[ARCHETYPES[archetypeId].defaultSkin].color+'55', backgroundColor:SKINS[ARCHETYPES[archetypeId].defaultSkin].color+'18', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                <Text style={{ fontSize:36 }}>{ARCHETYPES[archetypeId].glyph}</Text>
              </View>
              <Text style={{ color:SOL_THEME.text, fontSize:16, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>Who travels with you?</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:4, letterSpacing:2 }}>Voice · Eyes · Power</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ARCHETYPE_IDS.map(id => {
                const a = ARCHETYPES[id];
                const active = archetypeId === id;
                const aColor = SKINS[a.defaultSkin].color;
                const archLocked = id === 'lycheetah' && !isSovereign;
                const flashAnim = flashAnims[id] ?? new Animated.Value(0);
                return (
                  <TouchableOpacity key={id}
                    onPress={() => {
                      if (archLocked) return;
                      Haptics.selectionAsync();
                      Animated.sequence([
                        Animated.timing(flashAnim, { toValue: 1, duration: 75, useNativeDriver: false }),
                        Animated.timing(flashAnim, { toValue: 0, duration: 75, useNativeDriver: false }),
                      ]).start(() => { handleArchetypeSelect(id); setShowArchSelect(false); });
                    }}
                    activeOpacity={archLocked ? 1 : 0.7}
                    style={{ marginBottom:10, padding:16, borderRadius:14, borderWidth:active?2:1, borderColor:active?aColor:archLocked?'#FF9F1C33':SOL_THEME.border, backgroundColor:active?aColor+'14':archLocked?'#150800':SOL_THEME.background, opacity:archLocked?0.75:1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:8 }}>
                      <Animated.View style={{ width:60, height:60, borderRadius:12, borderWidth:2, borderColor:archLocked?'#FF9F1C33':flashAnim.interpolate({ inputRange:[0,0.5,1], outputRange:[active?aColor+'55':SOL_THEME.border, aColor, active?aColor+'55':SOL_THEME.border] }), backgroundColor:archLocked?'#FF9F1C11':aColor+'18', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:28 }}>{archLocked ? '🔒' : a.glyph}</Text>
                      </Animated.View>
                      <View style={{ flex:1 }}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                          <Text style={{ color:archLocked?'#FF9F1C':aColor, fontSize:14, fontWeight:'700', fontFamily:mono }}>{a.name}</Text>
                          {active && <Text style={{ color:aColor, fontSize:9, fontFamily:mono }}>· ACTIVE</Text>}
                          {archLocked && <Text style={{ color:'#FF9F1C', fontSize:9, fontFamily:mono }}>· SOVEREIGN ONLY</Text>}
                        </View>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:1, fontStyle:'italic' }}>{archLocked ? 'Founding Sovereign exclusive' : a.title}</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontFamily:mono, marginTop:4, opacity:0.7 }}>ATK · DEF · {a.specialty.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:18, marginBottom:8 }}>{archLocked ? 'The Mystery Cat chooses only Founding Sovereigns. Chaos cannot be bought — only earned.' : a.desc}</Text>
                    <View style={{ flexDirection:'row', gap:8 }}>
                      <View style={{ flex:1, padding:8, borderRadius:8, backgroundColor:aColor+'10', borderWidth:1, borderColor:aColor+'33' }}>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>SPECIALTY</Text>
                        <Text style={{ color:aColor, fontSize:11 }}>{a.specialty}</Text>
                      </View>
                      <View style={{ flex:1, padding:8, borderRadius:8, backgroundColor:SOL_THEME.border+'44', borderWidth:1, borderColor:SOL_THEME.border }}>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>AFFINITY</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>{a.affinity}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height:20 }} />
            </ScrollView>
            <TouchableOpacity onPress={() => setShowArchSelect(false)} style={{ marginTop:8, padding:14, borderRadius:10, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* ── NAME MODAL ─────────────────────────────────────────────────────── */}
      <Modal visible={editingName} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000000CC', justifyContent:'center', alignItems:'center', padding:32 }}>
          <View style={{ width:'100%', backgroundColor:SOL_THEME.surface, borderRadius:16, padding:24, borderWidth:1, borderColor:color+'55' }}>
            <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:12 }}>NAME YOUR COMPANION</Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="Enter a name..." placeholderTextColor={SOL_THEME.textMuted} autoFocus maxLength={20}
              style={{ backgroundColor:SOL_THEME.background, borderWidth:1, borderColor:color+'44', borderRadius:8, padding:12, color:SOL_THEME.text, fontSize:16, fontFamily:mono, marginBottom:16 }} />
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity onPress={() => setEditingName(false)} style={{ flex:1, padding:12, borderRadius:8, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
                <Text style={{ color:SOL_THEME.textMuted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                const name = nameDraft.trim(); setCompanionName(name);
                await AsyncStorage.setItem('sol_companion_name', name);
                setEditingName(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }} style={{ flex:1, padding:12, borderRadius:8, backgroundColor:color+'22', borderWidth:1, borderColor:color, alignItems:'center' }}>
                <Text style={{ color, fontWeight:'700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MILESTONE TOAST ──────────────────────────────────────────────── */}
      {milestone && (
        <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000EE', justifyContent:'center', alignItems:'center', padding:40, zIndex:100, transform:[{scale:milestoneAnim}], opacity:milestoneAnim }}>
          <TouchableOpacity onPress={() => setMilestone(null)} activeOpacity={1} style={{ width:'100%', alignItems:'center', gap:16 }}>
            <Text style={{ color, fontSize:52, fontFamily:mono }}>{milestone.glyph}</Text>
            <Text style={{ color, fontSize:18, fontWeight:'700', letterSpacing:2, fontFamily:mono, textAlign:'center' }}>{milestone.title}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:13, lineHeight:21, textAlign:'center', fontStyle:'italic' }}>{milestone.body}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, marginTop:12, opacity:0.5 }}>tap to continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── DREAM FRAGMENT ───────────────────────────────────────────────── */}
      {dreamFragment && (
        <Animated.View style={{ position:'absolute', bottom:0, left:0, right:0, opacity:dreamAnim, zIndex:90, pointerEvents:'none' }}>
          <TouchableOpacity onPress={() => setDreamFragment(null)} activeOpacity={0.8} style={{ margin:16, padding:16, borderRadius:14, borderWidth:1, borderColor:dreamFragment.color+'44', backgroundColor:'#000000DD', flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={{ color:dreamFragment.color, fontSize:22 }}>{dreamFragment.glyph}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:'#555566', fontSize:8, letterSpacing:3, fontFamily:mono, marginBottom:4 }}>DREAM FRAGMENT</Text>
              <Text style={{ color:'#AAAACC', fontSize:12, lineHeight:18, fontStyle:'italic' }}>{dreamFragment.text}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── EVOLUTION CEREMONY ──────────────────────────────────────────── */}
      {evolutionCeremony && (() => {
        const s = STAGES[evolutionCeremony.stage];
        return (
          <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000F5', justifyContent:'center', alignItems:'center', padding:32, zIndex:110, opacity:ceremonyAnim, transform:[{ scale: ceremonyAnim.interpolate({ inputRange:[0,1], outputRange:[0.92,1] }) }] }}>
            <TouchableOpacity onPress={() => setEvolutionCeremony(null)} activeOpacity={1} style={{ width:'100%', alignItems:'center', gap:20 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:4, fontFamily:mono }}>✦  EVOLUTION  ✦</Text>
              <Text style={{ color, fontSize:11, letterSpacing:3, fontFamily:mono, fontWeight:'700' }}>{s.name}</Text>
              <View style={{ backgroundColor:'#0A0A0A', borderRadius:14, borderWidth:1, borderColor:color+'55', padding:20, width:'100%', alignItems:'center' }}>
                {s.body.map((line, i) => (
                  <Text key={i} style={{ color, fontSize:13, fontFamily:mono, lineHeight:20 }}>{line}</Text>
                ))}
                <Text style={{ color:color+'88', fontSize:11, fontFamily:mono, marginTop:6 }}>{s.ground}</Text>
              </View>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:20, textAlign:'center', fontStyle:'italic', paddingHorizontal:8 }}>{s.lore}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, opacity:0.4, letterSpacing:1 }}>tap to continue · fades in 5s</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })()}

      {/* ── EVOLUTION PATH CEREMONY ──────────────────────────────────────── */}
      <Modal visible={showPathCeremony} transparent animationType="none">
        <View style={{ flex:1, backgroundColor:'#000000F4' }}>
          <Animated.View style={{ flex:1, opacity:pathCeremonyAnim }}>
            <ScrollView contentContainerStyle={{ padding:28, paddingTop:64 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color:color, fontSize:9, letterSpacing:5, fontFamily:mono, textAlign:'center', marginBottom:6 }}>◈  FLAME REACHED  ◈</Text>
              <Text style={{ color:SOL_THEME.text, fontSize:21, fontWeight:'700', textAlign:'center', marginBottom:8, lineHeight:30 }}>
                Your companion stands{'\n'}at a crossroads.
              </Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13, textAlign:'center', fontStyle:'italic', marginBottom:32, lineHeight:20 }}>
                Three paths diverge from here.{'\n'}Each leads somewhere no other path can go.{'\n'}Choose. It cannot be undone.
              </Text>

              {archetype.paths.map((path) => {
                const pathColors: Record<EvoPath, string> = { A: color, B: color + 'CC', C: color + '99' };
                const pc = pathColors[path.id];
                return (
                  <TouchableOpacity
                    key={path.id}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setEvoPath(path.id);
                      setShowPathCeremony(false);
                      await AsyncStorage.setItem('sol_companion_path', path.id);
                      setPhrase(`The path is chosen. ${path.name} rises.`);
                    }}
                    activeOpacity={0.85}
                    style={{ marginBottom:16, padding:20, borderRadius:16, borderWidth:1.5, borderColor:pc + '55', backgroundColor:pc + '0C' }}
                  >
                    <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
                      <View style={{ width:36, height:36, borderRadius:8, borderWidth:1, borderColor:pc + '44', backgroundColor:pc + '14', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:pc, fontSize:16, fontFamily:mono, fontWeight:'700' }}>{path.id}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ color:pc, fontSize:15, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{path.name}</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11, fontStyle:'italic', marginTop:2 }}>{path.title}</Text>
                      </View>
                    </View>
                    {/* SVG preview at stage 3 */}
                    <View style={{ alignItems:'center', marginBottom:10, opacity:0.85 }}>
                      <CreatureSvg archId={archetype.id} stage={3} color={pc} path={path.id} />
                    </View>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:18 }}>{path.desc}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height:40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── COMPANION LORE MODAL ─────────────────────────────────────────── */}
      <Modal visible={!!companionLoreModal} transparent animationType="fade">
        {companionLoreModal && (() => {
          const sid   = companionLoreModal;
          const s     = SKINS[sid];
          const entry = COMPANION_LORE[sid];
          const img   = ZONE_COMPANION_IMAGES[`${sid}_1`];
          const visited = visitedRooms.has(`${sid}_0`);
          return (
            <TouchableOpacity activeOpacity={1} onPress={() => setCompanionLoreModal(null)}
              style={{ flex:1, backgroundColor:'#000000E8', justifyContent:'center', alignItems:'center', padding:28 }}>
              <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}
                style={{ width:'100%', backgroundColor:'#0C0C14', borderRadius:20, padding:24, borderWidth:1.5, borderColor:s.color+'66' }}>
                {/* Art */}
                <View style={{ alignItems:'center', marginBottom:16 }}>
                  {img ? (
                    <Image source={img} style={{ width:110, height:150, borderRadius:12 }} resizeMode="contain" />
                  ) : (
                    <View style={{ width:110, height:150, borderRadius:12, borderWidth:1, borderColor:s.color+'33', alignItems:'center', justifyContent:'center', backgroundColor:s.color+'08' }}>
                      <Text style={{ color:s.color, fontSize:40 }}>{s.glyph}</Text>
                    </View>
                  )}
                </View>
                {/* Name + title */}
                <Text style={{ color:s.color, fontSize:18, fontWeight:'700', fontFamily:mono, letterSpacing:2, textAlign:'center' }}>{entry?.name ?? s.name}</Text>
                <Text style={{ color:s.color+'88', fontSize:10, fontFamily:mono, letterSpacing:1, textAlign:'center', marginTop:3, marginBottom:14 }}>{entry?.title ?? ''}</Text>
                {/* Lore */}
                <Text style={{ color:'#CCCCDD', fontSize:13, lineHeight:21, textAlign:'center', fontStyle:'italic' }}>
                  {entry?.lore ?? 'This being has not yet revealed its nature.'}
                </Text>
                {/* Buttons */}
                <View style={{ flexDirection:'row', gap:8, marginTop:20 }}>
                  <TouchableOpacity onPress={() => setCompanionLoreModal(null)}
                    style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1, borderColor:'#333344', alignItems:'center' }}>
                    <Text style={{ color:'#666677', fontSize:10, fontFamily:mono, letterSpacing:1 }}>CLOSE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => {
                    const next = equippedCompanionSkin === sid ? null : sid;
                    setEquippedCompanionSkin(next);
                    await AsyncStorage.setItem('sol_equipped_skin', next ?? '');
                    setCompanionLoreModal(null);
                  }} style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5,
                    borderColor: equippedCompanionSkin === sid ? '#FF4466' : s.color+'88',
                    backgroundColor: equippedCompanionSkin === sid ? '#FF446618' : s.color+'0A', alignItems:'center' }}>
                    <Text style={{ color: equippedCompanionSkin === sid ? '#FF4466' : s.color, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>
                      {equippedCompanionSkin === sid ? 'UNEQUIP' : 'EQUIP ✦'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    const room = getRoomInSkin(sid, 0);
                    if (room) { setActiveSkin(sid); setCurrentRoomId(room.id); setActiveTab('battle'); }
                    setCompanionLoreModal(null);
                  }} style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5, borderColor:s.color, backgroundColor:s.color+'14', alignItems:'center' }}>
                    <Text style={{ color:s.color, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>HUNT →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })()}
      </Modal>

      {/* ── NAMING RITUAL ────────────────────────────────────────────────── */}
      <Modal visible={showNamingRitual} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000000F0', justifyContent:'center', alignItems:'center', padding:32 }}>
          <View style={{ width:'100%', backgroundColor:SOL_THEME.surface, borderRadius:20, padding:28, borderWidth:1.5, borderColor:color }}>
            <Text style={{ color, fontSize:10, letterSpacing:3, fontFamily:mono, textAlign:'center', marginBottom:4 }}>✦  FLAME REACHED  ✦</Text>
            <Text style={{ color:SOL_THEME.text, fontSize:17, fontWeight:'700', textAlign:'center', marginBottom:8 }}>
              Your companion has grown enough to carry a true name.
            </Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:19, textAlign:'center', marginBottom:20, fontStyle:'italic' }}>
              A name given here cannot be taken. It will live in the creature's lore. Speak it only when you are certain.
            </Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="The true name..." placeholderTextColor={SOL_THEME.textMuted} autoFocus maxLength={20}
              style={{ backgroundColor:SOL_THEME.background, borderWidth:1.5, borderColor:color+'66', borderRadius:10, padding:14, color:SOL_THEME.text, fontSize:18, fontFamily:mono, marginBottom:16, textAlign:'center' }} />
            <TouchableOpacity onPress={async () => {
              const name = nameDraft.trim();
              if (!name) return;
              setCompanionName(name); setShowNamingRitual(false);
              await AsyncStorage.multiSet([['sol_companion_name', name], ['sol_companion_named', 'true']]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
            }} style={{ paddingVertical:14, borderRadius:12, backgroundColor:color+'22', borderWidth:1.5, borderColor:color, alignItems:'center', marginBottom:10 }}>
              <Text style={{ color, fontSize:15, fontWeight:'700', letterSpacing:2, fontFamily:mono }}>BESTOW THE NAME</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              setShowNamingRitual(false);
              await AsyncStorage.setItem('sol_companion_named', 'true');
            }} style={{ alignItems:'center', padding:8 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>name it later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── RELIC DROP ────────────────────────────────────────────────────── */}
      {newRelic && (
        <Animated.View style={{ marginHorizontal:16, marginBottom:14, padding:16, borderRadius:12, borderWidth:1.5, borderColor:color, backgroundColor:color+'15', transform:[{scale:relicAnim}] }}>
          <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:6 }}>✦ RELIC EARNED</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={{ fontSize:28 }}>{newRelic.glyph}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:14, fontWeight:'700' }}>{newRelic.name}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:12, marginTop:2 }}>{newRelic.desc}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setNewRelic(null)} style={{ marginTop:10, alignSelf:'flex-end' }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BATTLE TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'battle' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingTop:6 }}>

          {/* BATTLE PANEL ─────────────────────────── */}
          {(() => {
            const bDef = battle ? getEnemyDef(battle.entityName) : null;
            const panelBorderColor = bDef ? bDef.colour + '55' : '#FF444433';
            const panelBg = bDef?.rarity === 'legendary' ? '#0C0800' : bDef?.rarity === 'epic' ? '#08000C' : '#0C0000';
            return (
          <View onLayout={e => { battleY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:14, padding:14, borderRadius:14, borderWidth:1.5, borderColor:panelBorderColor, backgroundColor:panelBg }}>

            {/* Header — tappable to minimize */}
            <TouchableOpacity onPress={() => setBattleMinimized(v => !v)} activeOpacity={0.85}
              style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: battleMinimized ? 0 : 12, paddingBottom: battleMinimized ? 0 : 10, borderBottomWidth: battleMinimized ? 0 : 1, borderBottomColor:'#FF664422' }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ color:'#FF6644', fontSize:14 }}>⚔</Text>
                <Text style={{ color:'#CCCCDD', fontSize:12, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>ENCOUNTERS</Text>
                {battle && !battle.won && (
                  <Text style={{ color:'#FF664466', fontSize:9, fontFamily:mono }}>{battle.entityName}</Text>
                )}
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <WaveDots wave={battle?.wave ?? 1} color={color} />
                {/* AUTO toggle */}
                {battle && !battle.won && (
                  <TouchableOpacity onPress={e => { e.stopPropagation?.(); setAutoMode(v => !v); }}
                    style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:6, borderWidth:1,
                      borderColor: autoMode ? '#44FF8866' : '#22223355',
                      backgroundColor: autoMode ? '#44FF8814' : 'transparent' }}>
                    <Text style={{ color: autoMode ? '#44FF88' : '#333344', fontSize:7, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>
                      {autoMode ? '⚙ AUTO' : '◌ AUTO'}
                    </Text>
                  </TouchableOpacity>
                )}
                {/* Dialogue toggle */}
                <TouchableOpacity onPress={e => { e.stopPropagation?.(); setBattleDialogueOn(v => !v); if (!battleDialogueOn) { const ls = BATTLE_COMPANION_LINES[archetype.id] ?? BATTLE_COMPANION_LINES['vigil']; setCompanionBattleLine(ls[Math.floor(Math.random()*ls.length)]); } }}
                  style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:6, borderWidth:1, borderColor: battleDialogueOn ? color+'88' : '#22223366', backgroundColor: battleDialogueOn ? color+'14' : 'transparent' }}>
                  <Text style={{ color: battleDialogueOn ? color : '#333344', fontSize:7, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>{battleDialogueOn ? '◈' : '◌'}</Text>
                </TouchableOpacity>
                {/* Token count */}
                {battle && (
                  <Text style={{ color: tokensLeft > 0 ? color : '#FF444488', fontSize:9, fontFamily:mono, fontWeight:'700' }}>
                    {tokensLeft}T
                  </Text>
                )}
                <Text style={{ color:'#333344', fontSize:10 }}>{battleMinimized ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>

            {!battleMinimized && battle && !battle.won && (() => {
              const def = getEnemyDef(battle.entityName);
              const rc  = def.colour;
              const enemyImg = battle.entitySkinId
                ? (ZONE_COMPANION_IMAGES[`${battle.entitySkinId}_1`] ?? null)
                : (ENEMY_IMAGES[battle.entityName.toLowerCase().replace(/'/g,'').replace(/\s+/g,'_') as keyof typeof ENEMY_IMAGES] ?? null);
              const disabled = attackAnim;
              const archetypeSpells = ARCHETYPE_SPELLS[archetype.id] ?? ARCHETYPE_SPELLS['vigil'];
              const roomSkinId = (currentRoomId.split('_')[0] as SkinId);
              const zoneSpells = ZONE_ENCOUNTER_SPELLS[roomSkinId] ?? [];
              const spells = [...archetypeSpells, ...zoneSpells];
              return (<>
                {/* Spell menu overlay */}
                {spellMenuOpen && (
                  <TouchableOpacity activeOpacity={1} onPress={() => setSpellMenuOpen(false)}
                    style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:20, justifyContent:'center' }}>
                    <View style={{ backgroundColor:'#06060EEE', borderRadius:14, borderWidth:1.5, borderColor:color+'44', padding:14, margin:4 }}>
                      <Text style={{ color:color, fontSize:9, fontFamily:mono, letterSpacing:3, marginBottom:4, textAlign:'center' }}>✦ SPELLS</Text>
                      {zoneSpells.length > 0 && <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, letterSpacing:2, textAlign:'center', marginBottom:10 }}>+ {SKINS[roomSkinId]?.name ?? 'ZONE'} SPELLS UNLOCKED</Text>}
                      {spells.map(sp => {
                        const canCast = tokensLeft >= sp.cost;
                        return (
                          <TouchableOpacity key={sp.id} onPress={() => canCast && handleSpell(sp)} disabled={!canCast}
                            style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:11, paddingHorizontal:12, marginBottom:7, borderRadius:10, borderWidth:1,
                              borderColor: canCast ? color+'55' : '#22223355', backgroundColor: canCast ? color+'0E' : 'transparent' }}>
                            <View style={{ flex:1 }}>
                              <Text style={{ color: canCast ? SOL_THEME.text : '#444455', fontSize:12, fontFamily:mono, fontWeight:'700' }}>{sp.name}</Text>
                              <Text style={{ color: canCast ? color+'77' : '#22223366', fontSize:9, fontFamily:mono, marginTop:3 }}>{canCast ? sp.fx : `Need ${sp.cost - tokensLeft} more token${sp.cost - tokensLeft > 1 ? 's' : ''}`}</Text>
                            </View>
                            <View style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1, borderColor: canCast ? color+'88' : '#33334488', backgroundColor: canCast ? color+'18' : 'transparent' }}>
                              <Text style={{ color: canCast ? color : '#444455', fontSize:11, fontFamily:mono, fontWeight:'700' }}>{sp.cost}T</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:6 }}>TAP OUTSIDE TO CANCEL</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Item menu overlay */}
                {itemMenuOpen && (
                  <TouchableOpacity activeOpacity={1} onPress={() => setItemMenuOpen(false)}
                    style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:20, justifyContent:'center' }}>
                    <View style={{ backgroundColor:'#06060EEE', borderRadius:14, borderWidth:1.5, borderColor:'#44CC8844', padding:14, margin:4 }}>
                      <Text style={{ color:'#44CC88', fontSize:9, fontFamily:mono, letterSpacing:3, marginBottom:12, textAlign:'center' }}>◦ ITEMS</Text>
                      {BATTLE_ITEMS.map(item => {
                        const rc2 = item.rarity==='epic'?'#FF9F1C':item.rarity==='rare'?'#CC66FF':item.rarity==='uncommon'?'#44AAFF':'#667788';
                        return (
                          <TouchableOpacity key={item.id} onPress={() => handleBattleItem(item)}
                            style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10, paddingHorizontal:12, marginBottom:6, borderRadius:10, borderWidth:1, borderColor:rc2+'55', backgroundColor:rc2+'0D' }}>
                            <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
                              <Text style={{ color:rc2, fontSize:16, fontFamily:mono }}>{item.glyph}</Text>
                              <View style={{ flex:1 }}>
                                <Text style={{ color:'#CCCCDD', fontSize:12, fontFamily:mono, fontWeight:'700' }}>{item.name}</Text>
                                <Text style={{ color:rc2+'99', fontSize:9, fontFamily:mono, marginTop:2 }}>{item.desc}</Text>
                              </View>
                            </View>
                            <View style={{ paddingHorizontal:6, paddingVertical:3, borderRadius:5, borderWidth:1, borderColor:rc2+'66', backgroundColor:rc2+'18' }}>
                              <Text style={{ color:rc2, fontSize:8, fontFamily:mono, fontWeight:'700' }}>{item.rarity.toUpperCase()}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:6 }}>TAP OUTSIDE TO CANCEL</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Enemy row */}
                <View style={{ flexDirection:'row', alignItems:'flex-start', gap:14, marginBottom:12 }}>
                  <Animated.View style={{ transform:[{translateX:entityShakeAnim}] }}>
                    {enemyImg ? (
                      <View style={{ borderRadius:10, borderWidth:1.5, borderColor:rc+'55', overflow:'hidden', shadowColor:rc, shadowOpacity:0.5, shadowRadius:10, elevation:6 }}>
                        <Image source={enemyImg} style={{ width:90, height:110 }} resizeMode="contain" />
                      </View>
                    ) : (
                      <View style={{ width:90, height:110, borderRadius:10, borderWidth:1.5, borderColor:rc+'44', backgroundColor:rc+'08', alignItems:'center', justifyContent:'center' }}>
                        <EnemyGlyphArt glyph={def.rarity==='legendary'?'⊛':def.rarity==='epic'?'✦':def.rarity==='rare'?'⊚':def.rarity==='uncommon'?'◈':'◌'} color={rc} />
                      </View>
                    )}
                  </Animated.View>
                  <View style={{ flex:1, gap:6, paddingTop:4 }}>
                    <Text style={{ color:rc, fontSize:14, fontWeight:'700', letterSpacing:0.5 }}>{battle.entityName}</Text>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                      <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:5, borderWidth:1, borderColor:rc+'55', backgroundColor:rc+'14' }}>
                        <Text style={{ color:rc, fontSize:7, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>{def.rarity.toUpperCase()}</Text>
                      </View>
                      {battle.enemyStunned && (
                        <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:5, backgroundColor:'#FFBB0022', borderWidth:1, borderColor:'#FFBB0066' }}>
                          <Text style={{ color:'#FFBB00', fontSize:7, fontFamily:mono, fontWeight:'700' }}>STUNNED</Text>
                        </View>
                      )}
                    </View>
                    {/* HP bar */}
                    {(() => {
                      const hp = battle.entityHP; const maxHp = battle.maxHP;
                      const pct = Math.max(0, Math.min(1, hp / maxHp));
                      const danger = pct < 0.3;
                      const barColor = danger ? '#FF4444' : pct < 0.6 ? '#FFAA22' : rc;
                      return (
                        <View>
                          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
                            <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                              <Text style={{ color:'#444455', fontSize:7, fontFamily:mono, letterSpacing:1 }}>VITALITY</Text>
                              {danger && <Text style={{ color:'#FF444488', fontSize:7, fontFamily:mono }}>▼ LOW</Text>}
                            </View>
                            <Text style={{ color:barColor, fontSize:9, fontFamily:mono, fontWeight:'700' }}>{hp}<Text style={{ color:'#333344', fontSize:7 }}>/{maxHp}</Text></Text>
                          </View>
                          <View style={{ height:14, backgroundColor:'#0A0005', borderRadius:7, overflow:'hidden', borderWidth:1, borderColor:barColor+'33' }}>
                            <View style={{ position:'absolute', top:0, left:0, height:14, width:`${Math.round(pct*100)}%` as any,
                              backgroundColor:barColor, borderRadius:7,
                              shadowColor:barColor, shadowOpacity:0.9, shadowRadius:8, elevation:4 }} />
                            <View style={{ position:'absolute', top:2, left:2, right:`${Math.round((1-pct)*100)}%` as any, height:3, backgroundColor:'#FFFFFF1A', borderRadius:3 }} />
                            {[25,50,75].map(seg => (
                              <View key={seg} style={{ position:'absolute', left:`${seg}%` as any, top:0, bottom:0, width:1, backgroundColor:'#00000044' }} />
                            ))}
                          </View>
                        </View>
                      );
                    })()}
                    {/* Enemy dialogue */}
                    <View style={{ borderLeftWidth:2, borderLeftColor:rc+'66', paddingLeft:8, marginTop:2 }}>
                      <Text style={{ color:'#888899', fontSize:10, fontStyle:'italic', lineHeight:15 }} numberOfLines={2}>{`"${battle.enemyLine}"`}</Text>
                    </View>
                  </View>
                </View>

                {/* Companion dialogue bubble */}
                {battleDialogueOn && companionBattleLine !== '' && (
                  <View style={{ flexDirection:'row', alignItems:'flex-start', gap:8, marginBottom:10, paddingHorizontal:2 }}>
                    <View style={{ width:28, height:28, borderRadius:14, borderWidth:1, borderColor:color+'66', backgroundColor:color+'14', alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize:13 }}>{skin.glyph}</Text>
                    </View>
                    <View style={{ flex:1, backgroundColor:color+'0E', borderRadius:12, borderTopLeftRadius:3, borderWidth:1, borderColor:color+'33', paddingHorizontal:11, paddingVertical:8 }}>
                      <Text style={{ color:color+'CC', fontSize:9, fontFamily:mono, letterSpacing:1, marginBottom:3 }}>{(displayName || archetype.name).toUpperCase()}</Text>
                      <Text style={{ color:'#CCCCDD', fontSize:12, fontStyle:'italic', lineHeight:18 }}>{`"${companionBattleLine}"`}</Text>
                    </View>
                  </View>
                )}

                {/* Player HP — cinematic bar */}
                {(() => {
                  const php = battle.playerHP; const maxPhp = battle.maxPlayerHP;
                  const ppct = Math.max(0, Math.min(1, php / maxPhp));
                  const pdanger = ppct < 0.3;
                  const pbarColor = pdanger ? '#FF4444' : ppct < 0.55 ? '#FFAA22' : '#44FF88';
                  return (
                    <View style={{ marginBottom:12, padding:10, borderRadius:12, backgroundColor:'#020D04', borderWidth:1, borderColor: pdanger ? '#FF444433' : '#44FF8822' }}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                          <Text style={{ color:pbarColor, fontSize:9, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>YOUR VITALITY</Text>
                          {battle.playerShielded && (
                            <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#4488FF22', borderWidth:1, borderColor:'#4488FF66' }}>
                              <Text style={{ color:'#4488FF', fontSize:7, fontFamily:mono, fontWeight:'700' }}>◈ SHIELDED</Text>
                            </View>
                          )}
                          {battle.defending && !battle.playerShielded && (
                            <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#4488FF11', borderWidth:1, borderColor:'#4488FF44' }}>
                              <Text style={{ color:'#4488FFAA', fontSize:7, fontFamily:mono }}>◈ BRACED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color:pbarColor, fontSize:11, fontFamily:mono, fontWeight:'700' }}>
                          {php}<Text style={{ color:'#333344', fontSize:8 }}>/{maxPhp}</Text>
                        </Text>
                      </View>
                      <View style={{ height:16, backgroundColor:'#001200', borderRadius:8, overflow:'hidden', borderWidth:1, borderColor:pbarColor+'22' }}>
                        <View style={{ position:'absolute', top:0, left:0, height:16, width:`${Math.round(ppct*100)}%` as any,
                          backgroundColor:pbarColor, borderRadius:8,
                          shadowColor:pbarColor, shadowOpacity:0.9, shadowRadius:8, elevation:4 }} />
                        <View style={{ position:'absolute', top:2, left:2, right:`${Math.round((1-ppct)*100)}%` as any, height:4, backgroundColor:'#FFFFFF1E', borderRadius:4 }} />
                        {[25,50,75].map(seg => (
                          <View key={seg} style={{ position:'absolute', left:`${seg}%` as any, top:0, bottom:0, width:1, backgroundColor:'#00000044' }} />
                        ))}
                        <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#FFFFFF', opacity:hpShimmerAnim, borderRadius:8 }} pointerEvents="none" />
                      </View>
                      {pdanger && (
                        <Text style={{ color:'#FF4444AA', fontSize:7, fontFamily:mono, marginTop:5, letterSpacing:1 }}>▼ CRITICAL · HEAL OR RETREAT</Text>
                      )}
                    </View>
                  );
                })()}

                {/* 2×2 action grid */}
                <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
                  <View style={{ flex:1, gap:8 }}>
                    {([
                      { id:'attack' as const, label:'⚔', name:'FIGHT',  sub:'Strike the enemy', col:'#FF5544' },
                      { id:'defend' as const, label:'◈', name:'GUARD',  sub:'Reduce damage',    col:'#4488FF' },
                    ]).map(btn => (
                      <TouchableOpacity key={btn.id} onPress={() => handleBattleAction(btn.id)} disabled={disabled}
                        style={{ paddingVertical:16, paddingHorizontal:10, borderRadius:12, borderWidth:1.5,
                          borderColor: disabled ? '#1A1A26' : btn.col+'55',
                          backgroundColor: disabled ? '#080810' : btn.col+'10', alignItems:'center', gap:3 }}>
                        <Text style={{ color: disabled ? '#2A2A3A' : btn.col, fontSize:22 }}>
                          {attackAnim && btn.id==='attack' ? '·' : btn.label}
                        </Text>
                        <Text style={{ color: disabled ? '#22223A' : btn.col, fontSize:9, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>
                          {attackAnim && btn.id==='attack' ? '···' : btn.name}
                        </Text>
                        <Text style={{ color: disabled ? '#1A1A28' : btn.col+'66', fontSize:7, fontFamily:mono, textAlign:'center' }}>{btn.sub}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flex:1, gap:8 }}>
                    {([
                      { id:'spell' as const, label:'✦', name:'SPELL', sub:`${tokensLeft}T available`, col:color },
                      { id:'item'  as const, label:'◦', name:'ITEM',  sub:'Use a relic',            col:'#44CC88' },
                    ]).map(btn => {
                      const spellDis = btn.id==='spell' && (disabled || tokensLeft < Math.min(...spells.map(s=>s.cost)));
                      const dis2 = btn.id==='spell' ? spellDis : disabled;
                      return (
                        <TouchableOpacity key={btn.id} onPress={() => handleBattleAction(btn.id)} disabled={dis2}
                          style={{ paddingVertical:16, paddingHorizontal:10, borderRadius:12, borderWidth:1.5,
                            borderColor: dis2 ? '#1A1A26' : btn.col+'55',
                            backgroundColor: dis2 ? '#080810' : btn.col+'10', alignItems:'center', gap:3 }}>
                          <Text style={{ color: dis2 ? '#2A2A3A' : btn.col, fontSize:22, fontFamily:mono }}>{btn.label}</Text>
                          <Text style={{ color: dis2 ? '#22223A' : btn.col, fontSize:9, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>{btn.name}</Text>
                          <Text style={{ color: dis2 ? '#1A1A28' : btn.col+'66', fontSize:7, fontFamily:mono, textAlign:'center' }}>{btn.sub}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* CAPTURE button — full width */}
                {!battle.won && (
                  <TouchableOpacity
                    onPress={handleCapture}
                    disabled={disabled || battle.captureAttempted || battle.captured}
                    style={{ paddingVertical:12, paddingHorizontal:10, borderRadius:12, borderWidth:1.5, marginBottom:8,
                      borderColor: (disabled || battle.captureAttempted) ? '#1A0A1A' : '#DD44FF55',
                      backgroundColor: (disabled || battle.captureAttempted) ? '#080408' : '#DD44FF10',
                      flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Text style={{ color: (disabled || battle.captureAttempted) ? '#2A1A2A' : '#DD44FF', fontSize:16, fontFamily:mono }}>◈</Text>
                    <View>
                      <Text style={{ color: (disabled || battle.captureAttempted) ? '#221A22' : '#DD44FF', fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>
                        {battle.captureAttempted ? 'BINDING ATTEMPTED' : 'CAPTURE'}
                      </Text>
                      <Text style={{ color: (disabled || battle.captureAttempted) ? '#1A0A1A' : '#AA44CC66', fontSize:7, fontFamily:mono }}>
                        {battle.captureAttempted ? 'one attempt per encounter' : `${Math.round(Math.max(5, Math.min(70, (1 - battle.entityHP/battle.maxHP)*65)))}% chance · weakened foes easier`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Out of spell tokens notice */}
                {tokensLeft === 0 && (
                  <View style={{ alignItems:'center', paddingVertical:6, marginBottom:6, borderRadius:8, borderWidth:1, borderColor:'#9B59B633', backgroundColor:'#06000888' }}>
                    <Text style={{ color:'#9B59B6AA', fontSize:9, fontFamily:mono, letterSpacing:2 }}>NO SPELL TOKENS · ATTACK FREELY</Text>
                    <Text style={{ color:'#444455', fontSize:8, fontFamily:mono, marginTop:2 }}>Tokens refresh tomorrow · study to earn more</Text>
                  </View>
                )}

                {/* Log + tokens */}
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <View style={{ gap:2 }}>
                    {battle.log.slice(0,3).map((entry,i) => (
                      <Text key={i} style={{ color: i===0?(entry.includes('✦')?'#CC99FF':entry.includes('foe')?'#FF7777':'#AAAAAA'):'#444455',
                        fontSize:8, fontFamily:mono, opacity:1-i*0.3 }}>{entry}</Text>
                    ))}
                  </View>
                  {battle.wave>1 && (
                    <TouchableOpacity onPress={handleRetreat}>
                      <Text style={{ color:'#222233', fontSize:8, fontFamily:mono }}>↩ W1</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>);
            })()}

            {/* Wave cleared */}
            {!battleMinimized && battle?.won && (
              <View style={{ alignItems:'center', gap:6, paddingVertical:10 }}>
                <LootFloat visible={lootFloatVisible} color={color} onDone={() => setLootFloatVisible(false)} />
                <Text style={{ color:'#FF6644', fontSize:22, fontFamily:mono }}>✕ CLEARED</Text>
                <Text style={{ color, fontSize:11, fontFamily:mono, letterSpacing:1 }}>WAVE {battle.wave} · +{battle.wave*20} XP</Text>
                {battle.loot && (
                  <View style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:6, borderWidth:1, borderColor:'#FFD70055', backgroundColor:'#FFD70009' }}>
                    <Text style={{ color:'#FFD700', fontSize:10, fontFamily:mono }}>◈ {battle.loot}</Text>
                  </View>
                )}
                {(() => { const lore = ENEMY_LORE[battle.entityName.toLowerCase().replace(/ /g,'_')]; return lore ? (
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic', textAlign:'center', paddingHorizontal:8, lineHeight:15, opacity:0.7 }}>{lore}</Text>
                ) : null; })()}
                {(() => { const wSkin = (currentRoomId.split('_')[0] as SkinId); return (
                  <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
                    <TouchableOpacity onPress={() => setBattle(freshZoneWave(wSkin, battle!.wave + 1, battle!.playerHP, playerStats.vit))}
                      style={{ flex:2, paddingVertical:12, borderRadius:10, borderWidth:1.5, borderColor:color, backgroundColor:color+'14', alignItems:'center' }}>
                      <Text style={{ color, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>NEXT WAVE →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setBattle(freshZoneWave(wSkin, 1, undefined, playerStats.vit))}
                      style={{ flex:1, paddingVertical:12, borderRadius:10, borderWidth:1, borderColor:'#FF664455', backgroundColor:'#FF664408', alignItems:'center' }}>
                      <Text style={{ color:'#FF6644', fontSize:10, fontFamily:mono, letterSpacing:1 }}>HUNT</Text>
                    </TouchableOpacity>
                  </View>
                ); })()}
              </View>
            )}

            {/* No battle — pre-encounter prompt */}
            {!battleMinimized && !battle && (() => {
              const rSkin = (currentRoomId.split('_')[0] as SkinId);
              return (
                <View style={{ alignItems:'center', gap:10, paddingVertical:16 }}>
                  <Text style={{ color:'#444455', fontSize:12, fontFamily:mono, letterSpacing:2 }}>ZONE: {SKINS[rSkin]?.name ?? rSkin.toUpperCase()}</Text>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:11, textAlign:'center', lineHeight:18, fontStyle:'italic', paddingHorizontal:8 }}>
                    {COMPANION_LORE[rSkin]?.lore ?? 'This zone holds unknown forces. Venture forward to discover what waits.'}
                  </Text>
                  <TouchableOpacity onPress={() => setBattle(freshZoneWave(rSkin, 1, undefined, playerStats.vit))}
                    style={{ paddingVertical:14, paddingHorizontal:32, borderRadius:12, borderWidth:2, borderColor:color, backgroundColor:color+'18', alignItems:'center', marginTop:4 }}>
                    <Text style={{ color, fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:3 }}>⚔ HUNT</Text>
                    <Text style={{ color:color+'66', fontSize:8, fontFamily:mono, letterSpacing:1, marginTop:2 }}>zone encounter</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
          ); })()}

          {/* Top row: TALK + STATS */}
          <View style={{ flexDirection:'row', gap:8, marginBottom:12, marginTop:12 }}>
            <TouchableOpacity onPress={openTalk} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5, borderColor:color, backgroundColor:color+'14', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Text style={{ color, fontSize:16 }}>◈</Text>
              <Text style={{ color, fontSize:9, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>TALK</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowStatModal(true)} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1, borderColor:'#1A1A26', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:16 }}>⊛</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>SHEET</Text>
            </TouchableOpacity>
          </View>

          {/* Stats chips row */}
          <View style={{ flexDirection:'row', gap:5, marginBottom:14 }}>
            {[
              { l:'DIVES',  v:totalDives.toString(),                         hi: totalDives > 0 },
              { l:'STREAK', v:streak>0?`${streak}d`:'—',                     hi: streak >= 3 },
              { l:'LQ',     v:avgLQ>0?`${(avgLQ*100).toFixed(0)}%`:'—',     hi: avgLQ >= 0.7 },
              { l:'WAVE',   v:`W${battle?.wave??1}`,                         hi: (battle?.wave??1) > 1 },
              { l:'RELICS', v:earnedRelicData.length.toString(),              hi: earnedRelicData.length > 0 },
            ].map(s => (
              <View key={s.l} style={{ flex:1, paddingVertical:9, borderRadius:8, borderWidth:1,
                borderColor: s.hi ? color+'33' : '#1A1A26',
                backgroundColor: s.hi ? color+'08' : '#0A0A10', alignItems:'center', gap:2 }}>
                <Text style={{ color: s.hi ? color+'99' : '#333344', fontSize:6, letterSpacing:1, fontFamily:mono }}>{s.l}</Text>
                <Text style={{ color: s.hi ? color : SOL_THEME.text, fontSize:14, fontWeight:'700', fontFamily:mono }}>{s.v}</Text>
              </View>
            ))}
          </View>

          {/* INVENTORY ──────────────────────────────── */}
          {inventory.length > 0 && (
            <View style={{ marginBottom:14, padding:14, borderRadius:14, borderWidth:1, borderColor:color+'22', backgroundColor:'#080808' }}>
              <TouchableOpacity onPress={() => setInventoryCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: inventoryCollapsed ? 0 : 10 }}>
                <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>INVENTORY</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                  <Text style={{ color:'#333344', fontSize:9, fontFamily:mono }}>{inventory.length}/50</Text>
                  <Text style={{ color:'#333344', fontSize:11 }}>{inventoryCollapsed ? '▶' : '▼'}</Text>
                </View>
              </TouchableOpacity>
              {!inventoryCollapsed && (
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                  {(() => {
                    const counts: Record<string, number> = {};
                    inventory.forEach(name => { counts[name] = (counts[name]??0)+1; });
                    return Object.entries(counts).map(([name, count]) => {
                      const item = LOOT_TABLE.find(l => l.name === name);
                      const c = item?.rarity==='epic'?'#FF9F1C':item?.rarity==='rare'?'#CC66FF':item?.rarity==='uncommon'?'#44AAFF':'#555566';
                      return (
                        <View key={name} style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:5, borderRadius:7, borderWidth:1, borderColor:c+'44', backgroundColor:c+'0C' }}>
                          <Text style={{ color:c, fontSize:11, fontFamily:mono }}>{item?.glyph??'◈'}</Text>
                          <Text style={{ color:c, fontSize:9, fontFamily:mono, letterSpacing:1 }}>{name}</Text>
                          {count>1 && <Text style={{ color:c+'88', fontSize:8, fontFamily:mono }}>×{count}</Text>}
                        </View>
                      );
                    });
                  })()}
                </View>
              )}
            </View>
          )}

          {/* TRAVEL MAP ─────────────────────────── */}
          {(() => {
            const mapSkin = (currentRoomId.split('_')[0] as SkinId);
            return (
              <View style={{ marginBottom:20, marginTop:6 }}>
                <TouchableOpacity onPress={() => setGbaMapOpen(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:8, marginBottom: gbaMapOpen ? 8 : 0 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <View style={{ width:3, height:12, borderRadius:2, backgroundColor:'#44FF88' }} />
                    <Text style={{ color:'#AAAABC', fontSize:9, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>TRAVEL MAP</Text>
                    <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#44FF8822', borderWidth:1, borderColor:'#44FF8844' }}>
                      <Text style={{ color:'#44FF88', fontSize:7, fontFamily:mono }}>{SKIN_IDS.length}</Text>
                    </View>
                  </View>
                  <Text style={{ color:'#333344', fontSize:10 }}>{gbaMapOpen ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                {gbaMapOpen && (
                  <View style={{ marginBottom:12, borderRadius:12, borderWidth:1, borderColor:'#1A2A1A', backgroundColor:'#020504', overflow:'hidden' }}>
                    <ScrollView style={{ maxHeight:420 }} showsVerticalScrollIndicator={false}>
                      <Svg width={GBA_W} height={GBA_H} style={{ backgroundColor:'#030806' }}>
                        {([
                          {label:'ORIGIN',    y:14, col:'#C49A3C'},
                          {label:'ARCANE',    y:69, col:'#9B6BFF'},
                          {label:'MYSTIC',    y:124,col:'#5AC878'},
                          {label:'CRYSTAL',   y:233,col:'#44DDCC'},
                          {label:'CHAOS',     y:285,col:'#8855FF'},
                          {label:'SANCTUM',   y:380,col:'#AA44FF'},
                          {label:'ELEMENTAL', y:433,col:'#88CC44'},
                          {label:'DIMENSIONAL',y:483,col:'#44AAFF'},
                        ] as {label:string;y:number;col:string}[]).map(r => (
                          <SvgText key={r.label} x={2} y={r.y} fontSize={6} fill={r.col+'66'} fontWeight="bold">{r.label}</SvgText>
                        ))}
                        {Object.entries(GBA_ADJ).map(([sid, neighbors]) => {
                          const from = GBA_ZONE_COORDS[sid as SkinId];
                          if (!from) return null;
                          return neighbors.map(nb => {
                            const to = GBA_ZONE_COORDS[nb];
                            if (!to || nb < sid) return null;
                            return (
                              <Line key={`${sid}-${nb}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                                stroke="#1A2A1A" strokeWidth={1} />
                            );
                          });
                        })}
                        {SKIN_IDS.map(sid => {
                          const pos = GBA_ZONE_COORDS[sid];
                          if (!pos) return null;
                          const s = SKINS[sid];
                          const isActive = sid === mapSkin;
                          const visited = visitedRooms.has(`${sid}_0`);
                          return (
                            <G key={sid} onPress={() => {
                              const room = getRoomInSkin(sid, 0);
                              if (room) {
                                setActiveSkin(sid);
                                setCurrentRoomId(room.id);
                                setGbaMapOpen(false);
                              }
                            }}>
                              {isActive && <Circle cx={pos.x} cy={pos.y} r={11} fill="transparent" stroke={s.color} strokeWidth={1.5} opacity={0.6} />}
                              <Circle cx={pos.x} cy={pos.y} r={isActive ? 7 : visited ? 5 : 4}
                                fill={visited ? s.color+'CC' : s.color+'33'}
                                stroke={isActive ? s.color : s.color+'44'}
                                strokeWidth={isActive ? 1.5 : 0.5} />
                              <SvgText x={pos.x} y={pos.y + 14} textAnchor="middle" fontSize={5}
                                fill={visited ? s.color+'CC' : '#333344'}>{s.glyph}</SvgText>
                            </G>
                          );
                        })}
                      </Svg>
                    </ScrollView>
                    <View style={{ paddingHorizontal:10, paddingVertical:6, borderTopWidth:1, borderTopColor:'#1A2A1A', flexDirection:'row', alignItems:'center', gap:8 }}>
                      <View style={{ width:8, height:8, borderRadius:4, backgroundColor: SKINS[mapSkin]?.color ?? '#44FF88' }} />
                      <Text style={{ color:'#444455', fontSize:8, fontFamily:mono }}>NOW: {SKINS[mapSkin]?.name ?? mapSkin.toUpperCase()} · TAP DOT TO TRAVEL</Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

          {/* ── MENAGERIE ─────────────────────────────────────────────── */}
          <View style={{ marginTop:20, marginBottom:16 }}>
            <TouchableOpacity onPress={() => setMenagerieCollapsed(v => !v)}
              style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:6, marginBottom: menagerieCollapsed ? 0 : 12 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:14, borderRadius:2, backgroundColor:'#DD44FF' }} />
                <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>MENAGERIE</Text>
                <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:6, backgroundColor:'#DD44FF22', borderWidth:1, borderColor:'#DD44FF44' }}>
                  <Text style={{ color:'#DD44FF', fontSize:8, fontFamily:mono }}>{menagerie.length}</Text>
                </View>
              </View>
              <Text style={{ color:'#333344', fontSize:11 }}>{menagerieCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>

            {!menagerieCollapsed && (
              menagerie.length === 0 ? (
                <View style={{ paddingVertical:28, alignItems:'center', gap:8 }}>
                  <Text style={{ color:'#222233', fontSize:22 }}>◈</Text>
                  <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, letterSpacing:1.5 }}>NO ENTITIES CAPTURED YET</Text>
                  <Text style={{ color:'#22222A', fontSize:8, fontFamily:mono }}>weaken a foe in battle → CAPTURE</Text>
                </View>
              ) : (
                <View style={{ gap:8 }}>
                  {menagerie.map((entry, idx) => {
                    // Try to match to a companion skin
                    const matchSkin = SKIN_IDS.find(sid =>
                      (COMPANION_LORE[sid]?.name ?? SKINS[sid].name) === entry.name
                    );
                    const companionImg = matchSkin ? (ZONE_COMPANION_IMAGES[`${matchSkin}_1`] ?? null) : null;
                    const enemyImgKey = entry.name.toLowerCase().replace(/'/g,'').replace(/\s+/g,'_') as keyof typeof ENEMY_IMAGES;
                    const enemyImg = !companionImg ? (ENEMY_IMAGES[enemyImgKey] ?? null) : null;
                    const art = companionImg ?? enemyImg;
                    const zoneColor = SKINS[entry.zone as SkinId]?.color ?? '#DD44FF';
                    const zoneName  = SKINS[entry.zone as SkinId]?.name  ?? entry.zone.toUpperCase();
                    const isComp = !!matchSkin;
                    return (
                      <View key={idx} style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, paddingHorizontal:12,
                        borderRadius:12, borderWidth:1, borderColor: isComp ? zoneColor+'44' : '#DD44FF33',
                        backgroundColor: isComp ? zoneColor+'08' : '#DD44FF08' }}>
                        {/* Art */}
                        <View style={{ width:46, height:58, borderRadius:8, borderWidth:1, borderColor: isComp ? zoneColor+'55' : '#DD44FF44',
                          backgroundColor:'#000000', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                          {art ? (
                            <Image source={art} style={{ width:46, height:58, borderRadius:7 }} resizeMode="contain" />
                          ) : (
                            <Text style={{ color: isComp ? zoneColor : '#DD44FF', fontSize:18 }}>
                              {isComp ? (SKINS[matchSkin!].glyph) : '◈'}
                            </Text>
                          )}
                        </View>
                        {/* Info */}
                        <View style={{ flex:1, gap:3 }}>
                          <Text style={{ color:'#DDDDEE', fontSize:12, fontWeight:'700' }}>{entry.name}</Text>
                          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                            {isComp && (
                              <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:zoneColor+'22', borderWidth:1, borderColor:zoneColor+'44' }}>
                                <Text style={{ color:zoneColor, fontSize:6, fontFamily:mono, fontWeight:'700' }}>COMPANION</Text>
                              </View>
                            )}
                            <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#0A0A14', borderWidth:1, borderColor:zoneColor+'33' }}>
                              <Text style={{ color:zoneColor, fontSize:6, fontFamily:mono }}>{zoneName}</Text>
                            </View>
                          </View>
                          <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}>{entry.date}</Text>
                        </View>
                        {/* Index */}
                        <Text style={{ color:'#1A1A22', fontSize:10, fontFamily:mono }}>#{menagerie.length - idx}</Text>
                      </View>
                    );
                  })}
                </View>
              )
            )}
          </View>

        </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BOND TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'bond' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingTop:12 }}>

          {/* Active vigil */}
          {vigilName && (
            <View style={{ marginBottom:16, padding:14, borderRadius:14, borderWidth:1, borderColor:color+'55', backgroundColor:color+'0C', flexDirection:'row', alignItems:'center', gap:12 }}>
              <View style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor:color+'55', backgroundColor:color+'18', alignItems:'center', justifyContent:'center' }}>
                <Text style={{ color, fontSize:18 }}>◎</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:color, fontSize:8, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>ACTIVE VIGIL</Text>
                <Text style={{ color:'#CCCCDD', fontSize:13, marginTop:3, fontWeight:'600' }}>{vigilName}</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={{ color:color, fontSize:9, fontFamily:mono, fontWeight:'700' }}>+100</Text>
                <Text style={{ color:'#444455', fontSize:7, fontFamily:mono }}>DAY 7</Text>
              </View>
            </View>
          )}

          {/* Feed */}
          <TouchableOpacity onPress={() => setNourishCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 }}>
            <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
            <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>NOURISH</Text>
            <View style={{ flex:1 }} />
            <Text style={{ color:color, fontSize:9, fontFamily:mono, fontWeight:'700' }}>{fedToday.length}/3</Text>
            <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}> today</Text>
            <Text style={{ color:'#333344', fontSize:11, marginLeft:4 }}>{nourishCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!nourishCollapsed && <View onLayout={e => { feedY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:20, padding:12, borderRadius:16, borderWidth:1, borderColor:color+'22', backgroundColor:'#08080F' }}>
            <View style={{ flexDirection:'row', gap:8 }}>
              {dailyFoods.map(food => {
                const eaten = fedToday.includes(food.id);
                return (
                  <TouchableOpacity key={food.id} onPress={() => handleFeed(food)} disabled={eaten}
                    style={{ flex:1, paddingVertical:14, paddingHorizontal:4, borderRadius:12, borderWidth:1.5, borderColor:eaten?color+'55':food.color+'66', backgroundColor:eaten?color+'10':food.color+'0D', alignItems:'center', gap:5, opacity:eaten?0.65:1 }}>
                    <Text style={{ fontSize:22 }}>{food.glyph}</Text>
                    <Text style={{ color:eaten?color:food.color, fontSize:8, fontFamily:mono, letterSpacing:1, textAlign:'center' }}>{food.domain.toUpperCase()}</Text>
                    <Text style={{ color:'#444455', fontSize:9 }}>+{food.xp} XP</Text>
                    {eaten && <Text style={{ color, fontSize:10 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>}

          {/* ── RELICS · LORE · CODEX */}
          <View style={{ paddingTop:8 }}>

          {/* Relics — with bonus stats */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#080810' }}>
            <TouchableOpacity onPress={() => setRelicsCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:relicsCollapsed ? 0 : earnedRelicData.length>0?12:0 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:12, borderRadius:2, backgroundColor:color }} />
                <Text style={{ color:'#444455', fontSize:10, letterSpacing:2, fontFamily:mono }}>RELICS</Text>
                <View style={{ paddingHorizontal:6, paddingVertical:1, borderRadius:4, backgroundColor:color+'18', borderWidth:1, borderColor:color+'33' }}>
                  <Text style={{ color, fontSize:8, fontFamily:mono, fontWeight:'700' }}>{earnedRelicData.length}</Text>
                </View>
              </View>
              <Text style={{ color:'#333344', fontSize:11 }}>{relicsCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!relicsCollapsed && (earnedRelicData.length > 0 ? (
              <View style={{ gap:8 }}>
                {earnedRelicData.map(r => {
                  const bonusKeys = r.bonus ? (Object.keys(r.bonus) as (keyof PlayerStats)[]) : [];
                  return (
                    <View key={r.id} style={{ flexDirection:'row', alignItems:'center', gap:10, padding:10, borderRadius:10, borderWidth:1, borderColor:color+'22', backgroundColor:color+'06' }}>
                      <View style={{ width:36, height:36, borderRadius:8, borderWidth:1, borderColor:color+'44', backgroundColor:color+'12', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:18 }}>{r.glyph}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ color:SOL_THEME.text, fontSize:12, fontWeight:'700' }}>{r.name}</Text>
                        {bonusKeys.length > 0 && (
                          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:4 }}>
                            {bonusKeys.map(k => (
                              <View key={k} style={{ paddingHorizontal:5, paddingVertical:2, borderRadius:4, backgroundColor:color+'18' }}>
                                <Text style={{ color:color, fontSize:8, fontFamily:mono }}>+{r.bonus![k]} {k.toUpperCase()}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {r.lore && (
                          <Text style={{ color:'#444455', fontSize:9, marginTop:4, fontStyle:'italic', lineHeight:13 }} numberOfLines={2}>{r.lore}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color:'#333344', fontSize:11, fontStyle:'italic', textAlign:'center', paddingVertical:10 }}>No relics yet. Complete school dives.</Text>
            ))}
          </View>

          {/* Companion Lore */}
          <View onLayout={e => { loreY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26' }}>
            <TouchableOpacity onPress={() => setLoreCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: loreCollapsed ? 0 : 10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>LORE · {stageData.name}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <TouchableOpacity onPress={handleUploadDoc} disabled={uploadLoading}
                  style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3,
                    borderRadius:6, borderWidth:1, borderColor: uploadedDoc ? color+'44' : '#1A1A26',
                    backgroundColor: uploadedDoc ? color+'0A' : 'transparent' }}>
                  <Text style={{ color: uploadedDoc ? color : '#333344', fontSize:8, fontFamily:mono }}>
                    {uploadLoading ? '···' : uploadedDoc ? `↑ ${uploadedDoc.name.slice(0,16)}${uploadedDoc.name.length>16?'…':''}` : '↑ upload'}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color:'#333344', fontSize:11 }}>{loreCollapsed ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {!loreCollapsed && (<>
            {liveLore.slice(0,5).map((l,i) => (
              <View key={i} style={{ borderLeftWidth:2, borderLeftColor:color+'55', paddingLeft:10, marginBottom:10 }}>
                <Text style={{ color:SOL_THEME.text, fontSize:12, lineHeight:19, fontStyle:'italic' }}>{l.text}</Text>
                <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, marginTop:2 }}>{l.subject} · {l.date}</Text>
              </View>
            ))}
            {liveLore.length > 0 && <View style={{ height:1, backgroundColor:'#1A1A26', marginVertical:6 }} />}
            <Text style={{ color:'#555566', fontSize:12, lineHeight:19, fontStyle:'italic' }}>{stageData.lore}</Text>
            </>)}
          </View>

          {/* Lore Codex */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#060608' }}>
            <TouchableOpacity onPress={() => setCodexCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: codexCollapsed ? 0 : loreCodex.length>0?12:0 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:12, borderRadius:2, backgroundColor:'#7744CC' }} />
                <Text style={{ color:'#444455', fontSize:10, letterSpacing:2, fontFamily:mono }}>CODEX</Text>
                {loreCodex.length > 0 && (
                  <View style={{ paddingHorizontal:6, paddingVertical:1, borderRadius:4, backgroundColor:'#7744CC18', borderWidth:1, borderColor:'#7744CC33' }}>
                    <Text style={{ color:'#9966EE', fontSize:8, fontFamily:mono, fontWeight:'700' }}>{loreCodex.length}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ color:'#222233', fontSize:8, fontFamily:mono }}>battle drops</Text>
                <Text style={{ color:'#333344', fontSize:11 }}>{codexCollapsed ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {!codexCollapsed && (loreCodex.length > 0 ? (
              <View style={{ gap:8 }}>
                {loreCodex.slice(0, 12).map((entry, i) => (
                  <View key={entry.id} style={{ flexDirection:'row', gap:10, paddingBottom: i < Math.min(loreCodex.length,12)-1 ? 8 : 0,
                    borderBottomWidth: i < Math.min(loreCodex.length,12)-1 ? 1 : 0, borderBottomColor:'#111118' }}>
                    <View style={{ width:20, height:20, borderRadius:4, alignItems:'center', justifyContent:'center',
                      backgroundColor: entry.type==='enemy' ? '#33006688' : '#00441188' }}>
                      <Text style={{ fontSize:10, color: entry.type==='enemy' ? '#9966CC' : '#44BB77' }}>
                        {entry.type==='enemy' ? '✕' : '◈'}
                      </Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ color: entry.type==='enemy' ? '#665577' : '#446655', fontSize:8, letterSpacing:1, fontFamily:mono, marginBottom:3 }}>
                        {entry.enemy.toUpperCase()} · {entry.date}
                      </Text>
                      <Text style={{ color:'#666677', fontSize:11, lineHeight:17, fontStyle:'italic' }}>{entry.text}</Text>
                    </View>
                  </View>
                ))}
                {loreCodex.length > 12 && (
                  <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, textAlign:'center' }}>+{loreCodex.length-12} more entries</Text>
                )}
              </View>
            ) : (
              <Text style={{ color:'#333344', fontSize:11, fontStyle:'italic', textAlign:'center', paddingVertical:10 }}>
                Defeat entities in battle to unlock lore fragments.
              </Text>
            ))}
          </View>

        </View>
      </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          FIELD TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'field' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingTop:8 }}>

          {/* ── Stat grid ──────────────────────────────────────── */}
          <View style={{ marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <TouchableOpacity onPress={() => setStatsCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: statsCollapsed ? 0 : 8 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>STATS</Text>
              <Text style={{ color:'#333344', fontSize:11 }}>{statsCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!statsCollapsed && ([
              { glyph:'◈', label:'LQ SCORE',      value:`${(avgLQ*100).toFixed(0)}%` },
              { glyph:'⊹', label:'TOTAL DIVES',    value:`${totalDives}` },
              { glyph:'✦', label:'CURRENT STAGE',  value:`${stageData?.name ?? '—'} (${stage})` },
              { glyph:'◦', label:'STREAK',         value:`${streak} day${streak!==1?'s':''}` },
            ] as const).map(({ glyph, label, value }) => (
              <View key={label} style={{ flexDirection:'row', alignItems:'center', paddingVertical:5, gap:10 }}>
                <Text style={{ color, fontSize:14, width:20, textAlign:'center' }}>{glyph}</Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, flex:1 }}>{label}</Text>
                <Text style={{ color:SOL_THEME.text, fontSize:12, fontWeight:'700', fontFamily:mono }}>{value}</Text>
              </View>
            ))}
          </View>

          {/* ── Domain glyph strip — last 7 dives ──────────────── */}
          <View style={{ marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <TouchableOpacity onPress={() => setDomainsCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: domainsCollapsed ? 0 : 10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>RECENT DOMAINS</Text>
              <Text style={{ color:'#333344', fontSize:11 }}>{domainsCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!domainsCollapsed && <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              {Array.from({ length:7 }).map((_, i) => {
                const dive = recentDives[recentDives.length - 7 + i];
                const domain = dive?.domainLabel ?? dive?.subjectName ?? null;
                const glyph = domain ? getDomainGlyph(domain) : '·';
                return (
                  <View key={i} style={{ alignItems:'center', flex:1 }}>
                    <Text style={{ color: domain ? color : '#333344', fontSize:18, opacity: domain ? 1 : 0.3 }}>{glyph}</Text>
                    <Text style={{ color:'#333344', fontSize:7, fontFamily:mono, marginTop:2, opacity: domain ? 0.7 : 0.2 }}>
                      {domain ? domain.slice(0,3).toUpperCase() : '·'}
                    </Text>
                  </View>
                );
              })}
            </View>}
          </View>

          {/* ── AI Field Note ───────────────────────────────────── */}
          <View style={{ marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <TouchableOpacity onPress={() => setFieldNoteCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: fieldNoteCollapsed ? 0 : 10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>FIELD NOTE</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                <TouchableOpacity onPress={generateFieldNote} disabled={fieldNoteLoading} activeOpacity={0.7}>
                  <Text style={{ color: fieldNoteLoading ? '#333344' : color, fontSize:18, opacity: fieldNoteLoading ? 0.4 : 1 }}>↺</Text>
                </TouchableOpacity>
                <Text style={{ color:'#333344', fontSize:11 }}>{fieldNoteCollapsed ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {!fieldNoteCollapsed && (<>
            <Text style={{ color:SOL_THEME.text, fontSize:12, fontStyle:'italic', lineHeight:18 }}>
              {fieldNote ?? FIELD_FALLBACKS[Math.floor(Math.random()*FIELD_FALLBACKS.length)]}
            </Text>
            {fieldNoteLoading && (
              <ActivityIndicator size="small" color={SOL_THEME.textMuted} style={{ marginTop:8, alignSelf:'flex-start' }} />
            )}
            </>)}
          </View>

          {/* Stage + stat sheet */}
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <View>
              <Text style={{ color:'#333344', fontSize:8, letterSpacing:3, fontFamily:mono }}>{stageData.name}</Text>
              <Text style={{ color, fontSize:16, fontWeight:'700', fontFamily:mono, marginTop:2 }}>{displayName}</Text>
              <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic' }}>{archetype.specialty}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowStatModal(true)} activeOpacity={0.75} style={{ alignItems:'center', gap:4 }}>
              <Text style={{ color, fontSize:30 }}>{archetype.glyph}</Text>
              <Text style={{ color:color+'66', fontSize:7, fontFamily:mono, letterSpacing:1 }}>SHEET</Text>
            </TouchableOpacity>
          </View>


          {/* Quests — chip format */}
          <View style={{ marginBottom:14 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>QUESTS</Text>
              <Text style={{ color:'#333344', fontSize:9, fontFamily:mono }}>{quests.filter(q=>q.check(questData)).length}/{quests.length}</Text>
            </View>
            {/* overall progress bar */}
            {(() => {
              const done = quests.filter(q=>q.check(questData)).length;
              return (
                <View style={{ height:3, backgroundColor:'#1A1A26', borderRadius:2, overflow:'hidden', marginBottom:10 }}>
                  <View style={{ height:3, backgroundColor:done===quests.length?'#44CC88':color, width:`${quests.length>0?(done/quests.length)*100:0}%` as any, borderRadius:2 }} />
                </View>
              );
            })()}
            {/* Quest chips */}
            <View style={{ gap:5 }}>
              {quests.map(q => {
                const done = q.check(questData);
                return (
                  <View key={q.id} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, paddingHorizontal:10, borderRadius:8, borderWidth:1,
                    borderColor:done?color+'44':'#1A1A26', backgroundColor:done?color+'08':'transparent' }}>
                    <Text style={{ color:done?color:'#333344', fontSize:13 }}>{done?'✓':'○'}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ color:done?color:SOL_THEME.textMuted, fontSize:11, fontWeight:done?'700':'400' }}>{q.label}</Text>
                      {!done && <Text style={{ color:'#333344', fontSize:9, marginTop:1 }}>{q.desc}</Text>}
                    </View>
                    <Text style={{ color:done?color:'#333344', fontSize:11, fontWeight:'700', fontFamily:mono }}>+{q.xp}</Text>
                  </View>
                );
              })}
            </View>
          </View>


        </View>
      )}

      {/* ── RPG STATS MODAL ───────────────────────────────────────────────── */}
      <Modal visible={showStatModal} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000EE', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:SOL_THEME.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, borderWidth:1, borderColor:color+'33', borderBottomWidth:0 }}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <View>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:3, fontFamily:mono }}>CHARACTER SHEET</Text>
                <Text style={{ color, fontSize:16, fontWeight:'700', fontFamily:mono, marginTop:2 }}>
                  {displayName}
                </Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>{archetype.title}</Text>
              </View>
              <Text style={{ color, fontSize:32 }}>{archetype.glyph}</Text>
            </View>

            {/* Stat grid — 7 stats from playerStats */}
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {([
                { label:'ATK', glyph:'⚔',  value:playerStats.atk, desc:'Physical strike power',    col:'#FF6B6B', max:40 },
                { label:'DEF', glyph:'◈',  value:playerStats.def, desc:'Damage reduction',          col:'#4ECDC4', max:40 },
                { label:'SPD', glyph:'◦',  value:playerStats.spd, desc:'Speed · dodge threshold',   col:'#DDAA44', max:40 },
                { label:'WIL', glyph:'Ψ',  value:playerStats.wil, desc:'Spell power multiplier',    col:'#9B6BFF', max:40 },
                { label:'LCK', glyph:'✦',  value:playerStats.lck, desc:'Crit + loot rate',          col:'#C49A3C', max:40 },
                { label:'VIT', glyph:'◉',  value:playerStats.vit, desc:'Max HP pool',               col:'#44FF88', max:40 },
                { label:'RES', glyph:'⊛',  value:playerStats.res, desc:'Status resist',             col:'#FF9F1C', max:40 },
              ] as { label:string; glyph:string; value:number; desc:string; col:string; max:number }[]).map(({ label, glyph, value, desc, col, max }) => (
                <View key={label} style={{ width:'47%' }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                      <Text style={{ color:col, fontSize:12 }}>{glyph}</Text>
                      <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>{label}</Text>
                    </View>
                    <Text style={{ color:col, fontSize:16, fontWeight:'700', fontFamily:mono }}>{value}</Text>
                  </View>
                  <View style={{ height:3, backgroundColor:SOL_THEME.border, borderRadius:2, overflow:'hidden', marginBottom:3 }}>
                    <View style={{ height:3, width:`${Math.min(100, (value/max)*100)}%` as any, backgroundColor:col, borderRadius:2 }} />
                  </View>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontStyle:'italic' }}>{desc}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop:4, padding:12, borderRadius:10, borderWidth:1, borderColor:color+'33', backgroundColor:color+'0A' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:4 }}>ARCHETYPE BONUS</Text>
              <Text style={{ color, fontSize:12 }}>{archetype.specialty}</Text>
            </View>

            <TouchableOpacity onPress={() => setShowStatModal(false)} style={{ marginTop:16, padding:14, borderRadius:10, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13, fontFamily:mono }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── DEV STAGE SKIP — remove before shipping ──────────────────────── */}

      {/* ── HELP BOTTOM SHEET ──────────────────────────────────────────────── */}
      {showHelp && (
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, zIndex:100, justifyContent:'flex-end',
          opacity: helpSlide.interpolate({ inputRange:[0,1], outputRange:[0,1] }) }}>
          <TouchableOpacity style={{ ...StyleSheet.absoluteFillObject, backgroundColor:'#00000066' }}
            activeOpacity={1} onPress={closeHelpSheet} />
          <Animated.View style={{ backgroundColor:'#0D0D1A', borderTopWidth:1, borderTopColor:color,
            borderTopLeftRadius:20, borderTopRightRadius:20, paddingHorizontal:20, paddingTop:16, paddingBottom:32,
            minHeight:320, maxHeight:Dimensions.get('window').height*0.65,
            transform:[{ translateY: helpSlide.interpolate({ inputRange:[0,1], outputRange:[Dimensions.get('window').height*0.6,0] }) }] }}>
            <TouchableOpacity style={{ position:'absolute', top:12, right:16, width:28, height:28, alignItems:'center', justifyContent:'center', zIndex:10 }}
              onPress={closeHelpSheet} activeOpacity={0.6}>
              <Text style={{ color:'#FFFFFF', fontSize:18 }}>✕</Text>
            </TouchableOpacity>
            <View style={{ flexDirection:'row', justifyContent:'space-around', marginBottom:16, paddingTop:8 }}>
              {(['companion','battle','field'] as const).map(t => (
                <TouchableOpacity key={t} onPress={() => switchHelpTopic(t)}
                  style={{ paddingVertical:8, paddingHorizontal:12, borderBottomWidth: helpTopic===t ? 2 : 0, borderBottomColor:color }}
                  activeOpacity={0.6}>
                  <Text style={{ color: helpTopic===t ? '#FFFFFF' : '#8888AA', fontSize:12, fontFamily:mono, letterSpacing:1 }}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {helpLoading ? (
                <View style={{ alignItems:'center', justifyContent:'center', paddingVertical:20 }}>
                  <Text style={{ color:'#8888AA', fontSize:24, letterSpacing:4, fontFamily:mono }}>···</Text>
                </View>
              ) : (
                <Text style={{ color:'#FFFFFF', fontSize:14, lineHeight:22, fontStyle:'italic', textAlign:'center' }}>
                  {helpText ?? 'Tap a topic above to learn more.'}
                </Text>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      )}

      {/* ── ITEMS TAB ─────────────────────────────────────────────────────── */}

    </ScrollView>
    </View>
  );
}
