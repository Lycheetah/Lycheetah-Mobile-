// TASK 2 — GEAR VISUAL OVERLAYS (18 pieces)
// Paste into companion.tsx or import as a module

import { ArchetypeId } from './task1_companion_specs';

export type GearSlot = 'crown' | 'sigil' | 'mantle';

export type GearOverlay = {
  archetypeId: ArchetypeId;
  slot: GearSlot;
  art: string[];
  color: string;
  glyph: string;
  name: string;
  desc: string;
};

export const GEAR_OVERLAYS: GearOverlay[] = [
  // ─── ARCHIVIST — Amber Gold #C49A3C ───────────────────────────────
  {
    archetypeId: 'archivist',
    slot: 'crown',
    name: 'CROWN OF MEMORY',
    glyph: '⌘',
    color: '#C49A3C',
    desc: 'A circlet of bound parchment that remembers every page ever turned.',
    art: [
      '    ╭─────╮    ',
      '   ╱ ≋≋≋≋≋ ╲   ',
      '  │  ◈◈◈◈◈  │  ',
      '  ╰─────────╯  ',
    ],
  },
  {
    archetypeId: 'archivist',
    slot: 'sigil',
    name: 'SIGIL OF INDEXING',
    glyph: '≋',
    color: '#C49A3C',
    desc: "A chest-mark that catalogs the wearer's every experience into living taxonomy.",
    art: [
      '   ┌─────┐   ',
      '   │ ≋≋≋ │   ',
      '   │ ◈◈◈ │   ',
      '   │ ≋≋≋ │   ',
      '   └─────┘   ',
    ],
  },
  {
    archetypeId: 'archivist',
    slot: 'mantle',
    name: 'MANTLE OF THE GREAT SHELF',
    glyph: '📚',
    color: '#C49A3C',
    desc: 'A cloak of spectral spines that rustle with the turning of invisible pages.',
    art: [
      '  ╭─────────╮  ',
      ' ╱  ▓▓▓▓▓▓▓  ╲ ',
      '│   ▓▓▓▓▓▓▓   │',
      '│   ▓▓▓▓▓▓▓   │',
      ' ╲  ▓▓▓▓▓▓▓  ╱ ',
      '  ╰─────────╯  ',
    ],
  },
  // ─── SENTINEL — Ice Blue Stone #C8A96E ────────────────────────────
  {
    archetypeId: 'sentinel',
    slot: 'crown',
    name: 'CROWN OF THE UNBROKEN VOW',
    glyph: '⬡',
    color: '#C8A96E',
    desc: 'A helm of interlocking stone facets that hums with the weight of every oath kept.',
    art: [
      '    ╭─────╮    ',
      '   ╱ ⬡⬡⬡⬡⬡ ╲   ',
      '  │  ▓▓▓▓▓  │  ',
      '  ╰─────────╯  ',
    ],
  },
  {
    archetypeId: 'sentinel',
    slot: 'sigil',
    name: 'SIGIL OF THE THRESHOLD',
    glyph: '⊞',
    color: '#C8A96E',
    desc: 'A chest-plate mark that hardens the skin where the shield cannot reach.',
    art: [
      '   ┌─────┐   ',
      '   │ ⊞⊞⊞ │   ',
      '   │ ▓▓▓ │   ',
      '   │ ⊞⊞⊞ │   ',
      '   └─────┘   ',
    ],
  },
  {
    archetypeId: 'sentinel',
    slot: 'mantle',
    name: 'MANTLE OF THE CITADEL WALL',
    glyph: '🛡',
    color: '#C8A96E',
    desc: 'Shoulder plates of compressed granite that absorb impact into silence.',
    art: [
      '  ╭─────────╮  ',
      ' ╱  ███████  ╲ ',
      '│   ███████   │',
      '│   ███████   │',
      ' ╲  ███████  ╱ ',
      '  ╰─────────╯  ',
    ],
  },
  // ─── ALCHEMIST — Violet #9B6BFF ───────────────────────────────────
  {
    archetypeId: 'alchemist',
    slot: 'crown',
    name: 'CROWN OF VOLATILE BECOMING',
    glyph: '⚗',
    color: '#9B6BFF',
    desc: 'A circlet of glass tubes that bubble with reactions that have no names yet.',
    art: [
      '    ╭─────╮    ',
      '   ╱ ∞∞∞∞∞ ╲   ',
      '  │  ◈◈◈◈◈  │  ',
      '  ╰─────────╯  ',
    ],
  },
  {
    archetypeId: 'alchemist',
    slot: 'sigil',
    name: 'SIGIL OF CATALYTIC FIRE',
    glyph: '⊕',
    color: '#9B6BFF',
    desc: 'A chest-burn that ignites when transformation is near, warning and inviting.',
    art: [
      '   ┌─────┐   ',
      '   │ ⊕⊕⊕ │   ',
      '   │ ◈◈◈ │   ',
      '   │ ⊕⊕⊕ │   ',
      '   └─────┘   ',
    ],
  },
  {
    archetypeId: 'alchemist',
    slot: 'mantle',
    name: 'MANTLE OF THE UNFINISHED REACTION',
    glyph: '🜁',
    color: '#9B6BFF',
    desc: 'A cloak of smoke that solidifies into new compounds mid-swing.',
    art: [
      '  ╭─────────╮  ',
      ' ╱  ░░▓▓░░░  ╲ ',
      '│   ░▓▓▓░░   │',
      '│   ░░▓▓░░░   │',
      ' ╲  ░░░▓░░░  ╱ ',
      '  ╰─────────╯  ',
    ],
  },
  // ─── ORACLE — Cyan #4ECDC4 ────────────────────────────────────────
  {
    archetypeId: 'oracle',
    slot: 'crown',
    name: 'CROWN OF THE THIRD OPENING',
    glyph: '◉',
    color: '#4ECDC4',
    desc: 'A circlet that reveals the crown chakra as a vertical eye gazing into all futures.',
    art: [
      '    ╭─────╮    ',
      '   ╱ ◉◉◉◉◉ ╲   ',
      '  │  ∿∿∿∿∿  │  ',
      '  ╰─────────╯  ',
    ],
  },
  {
    archetypeId: 'oracle',
    slot: 'sigil',
    name: 'SIGIL OF TEMPORAL FLUENCY',
    glyph: '∿',
    color: '#4ECDC4',
    desc: 'A chest-mark that ripples like water when the wearer speaks prophecy.',
    art: [
      '   ┌─────┐   ',
      '   │ ∿∿∿ │   ',
      '   │ ◉◉◉ │   ',
      '   │ ∿∿∿ │   ',
      '   └─────┘   ',
    ],
  },
  {
    archetypeId: 'oracle',
    slot: 'mantle',
    name: 'MANTLE OF OVERLAPPING PLANES',
    glyph: '👁',
    color: '#4ECDC4',
    desc: 'A veil of translucent silk that shows the past and future as ghost-layers.',
    art: [
      '  ╭─────────╮  ',
      ' ╱  ▒░▒░▒░▒  ╲ ',
      '│   ░▒░▒░▒░   │',
      '│   ▒░▒░▒░▒   │',
      ' ╲  ░▒░▒░▒░  ╱ ',
      '  ╰─────────╯  ',
    ],
  },
  // ─── WANDERER — Horizon Orange #FF9F1C ────────────────────────────
  {
    archetypeId: 'wanderer',
    slot: 'crown',
    name: 'CROWN OF THE HORIZON LINE',
    glyph: '⟐',
    color: '#FF9F1C',
    desc: 'A circlet that always points toward the next unseen destination.',
    art: [
      '    ╭─────╮    ',
      '   ╱ ⟐⟐⟐⟐⟐ ╲   ',
      '  │  ⋱⋱⋱⋱⋱  │  ',
      '  ╰─────────╯  ',
    ],
  },
  {
    archetypeId: 'wanderer',
    slot: 'sigil',
    name: 'SIGIL OF THE UNWALKED PATH',
    glyph: '⋱',
    color: '#FF9F1C',
    desc: 'A chest-mark that glows brightest when the wearer chooses the unknown road.',
    art: [
      '   ┌─────┐   ',
      '   │ ⋱⋱⋱ │   ',
      '   │ ⟐⟐⟐ │   ',
      '   │ ⋱⋱⋱ │   ',
      '   └─────┘   ',
    ],
  },
  {
    archetypeId: 'wanderer',
    slot: 'mantle',
    name: 'MANTLE OF THE COMET TAIL',
    glyph: '🌠',
    color: '#FF9F1C',
    desc: 'A cloak that leaves trails of stardust marking every step as irreversible progress.',
    art: [
      '  ╭─────────╮  ',
      ' ╱  ✦✦✦✦✦✦✦  ╲ ',
      '│   ✦✦✦✦✦✦✦   │',
      '│   ✦✦✦✦✦✦✦   │',
      ' ╲  ✦✦✦✦✦✦✦  ╱ ',
      '  ╰─────────╯  ',
    ],
  },
  // ─── LYCHEETAH — Wild Flame #FF9F1C ───────────────────────────────
  {
    archetypeId: 'lycheetah',
    slot: 'crown',
    name: 'CROWN OF THE UNSHEATHEABLE CLAW',
    glyph: '✦',
    color: '#FF9F1C',
    desc: 'A circlet of orange static that crackles with the promise of controlled explosion.',
    art: [
      '    ╭─────╮    ',
      '   ╱ ✦✦✦✦✦ ╲   ',
      '  │  ⊗⊗⊗⊗⊗  │  ',
      '  ╰─────────╯  ',
    ],
  },
  {
    archetypeId: 'lycheetah',
    slot: 'sigil',
    name: 'SIGIL OF THE CONTAINED INFERNO',
    glyph: '⊗',
    color: '#FF9F1C',
    desc: "A chest-mark that burns without scarring, the fire that knows its master's name.",
    art: [
      '   ┌─────┐   ',
      '   │ ⊗⊗⊗ │   ',
      '   │ ✦✦✦ │   ',
      '   │ ⊗⊗⊗ │   ',
      '   └─────┘   ',
    ],
  },
  {
    archetypeId: 'lycheetah',
    slot: 'mantle',
    name: 'MANTLE OF THE WILD ABSOLUTE',
    glyph: '🔥',
    color: '#FF9F1C',
    desc: 'A cloak of living flame that respects no boundary and answers to no leash.',
    art: [
      '  ╭─────────╮  ',
      ' ╱  ▓▓▓▓▓▓▓  ╲ ',
      '│   ▓▓▓▓▓▓▓   │',
      '│   ▓▓▓▓▓▓▓   │',
      ' ╲  ▓▓▓▓▓▓▓  ╱ ',
      '  ╰─────────╯  ',
    ],
  },
];

export function getGearOverlay(archetypeId: ArchetypeId, slot: GearSlot): GearOverlay | undefined {
  return GEAR_OVERLAYS.find(g => g.archetypeId === archetypeId && g.slot === slot);
}

export function getUnlockedGear(archetypeId: ArchetypeId): GearOverlay[] {
  return GEAR_OVERLAYS.filter(g => g.archetypeId === archetypeId);
}

export function getGearForSlot(archetypeId: ArchetypeId, slot: GearSlot): GearOverlay | null {
  return getGearOverlay(archetypeId, slot) ?? null;
}

// ─── RENDER WIRING EXAMPLE ─────────────────────────────────────────
// In companion.tsx, render gear overlay on top of creature canvas:
//
// const gear = getGearOverlay(archetypeId, 'crown');
// if (gear && isUnlocked) {
//   return (
//     <View style={{ position: 'absolute', top: 10, alignSelf: 'center' }}>
//       {gear.art.map((line, i) => (
//         <Text key={i} style={{ color: gear.color, fontFamily: 'monospace', fontSize: 10 }}>
//           {line}
//         </Text>
//       ))}
//     </View>
//   );
// }
