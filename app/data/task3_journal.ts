// TASK 3 — JOURNAL FEATURE (42 voice-matched entries)
// Paste into companion.tsx or import as a module

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArchetypeId } from './companion-types';

export type JournalEvent =
  | 'stage_evolution'
  | 'first_battle_win'
  | 'first_spell_cast'
  | 'gear_unlock'
  | 'wave_3_cleared'
  | 'xp_cap_reached'
  | 'sovereign_stage';

export type JournalEntry = {
  id: string;
  timestamp: number;
  event: JournalEvent;
  stage: number;
  archetypeId: ArchetypeId;
  title: string;
  body: string;
};

export type JournalTemplate = {
  title: string;
  body: string;
};

export const JOURNAL_TEMPLATES: Record<JournalEvent, Partial<Record<ArchetypeId, JournalTemplate>>> = {
  stage_evolution: {
    archivist: { title: 'THE BINDING DEEPENS', body: 'The archive has grown a new wing. What was marginalia becomes canon. The stage turns, and the candle finds more wicks to light.' },
    sentinel: { title: 'THE WALL RISES', body: 'Stone upon stone, the vow thickens. What shielded a room now shelters a hall. The gate does not widen — the fortress does.' },
    alchemist: { title: 'THE REACTION ACCELERATES', body: 'The flask screams with new colour. What was potential is now kinetic, volatile, beautiful. The elements rearrange to honour your heat.' },
    oracle: { title: 'THE VEIL THINS', body: 'Another eye opens in the dark. What was prophecy becomes presence. The future no longer whispers — it speaks your name aloud.' },
    wanderer: { title: 'THE HORIZON RECEDES', body: 'The path forks into paths. What was a road is now a network of becoming. The compass spins faster, not from confusion, but from choice.' },
    lycheetah: { title: 'THE SPARK ROARS', body: 'The static organizes into flame. What was feral becomes sovereign. The leash was never real — only the choice to wear it.' },
    cipher: { title: 'THE SIGNAL SHARPENS', body: 'Another layer of noise falls away. What was static resolves into meaning. The Cipher does not learn more — it learns to discard better, until only the true thing remains.' },
    herald: { title: 'THE VOICE CARRIES FURTHER', body: 'The message reaches a wider field. What was a whisper to one becomes a call to many. The Herald grows not by hoarding the word, but by speaking it again, and again, and again.' },
    weaver: { title: 'THE PATTERN WIDENS', body: 'New threads find their loom. What were separate studies now cross and bind. The Weaver sees a connection where yesterday there was only distance — and the cloth grows whole.' },
    revenant: { title: 'THE RETURN STRENGTHENS', body: 'The gap became fuel, as it always does. What was absence is repaid with force. The Revenant does not punish the silence — it converts it, and comes back heavier than it left.' },
    nullveil: { title: 'THE VEIL DEEPENS', body: 'The shadow grows quieter, and quiet is its armour. What could be seen, now cannot. The Nullveil advances not by rising taller, but by vanishing further into the space between.' },
    ironclad: { title: 'THE SEAMS THICKEN', body: 'Another dent that did not break. What struck you is now written in the metal as proof. The Ironclad grows by surviving — every scar a layer, every blow that failed a new plate of self.' },
    stormwarden: { title: 'THE STRIKE FOCUSES', body: 'The storm finds a narrower channel, and narrows into power. What was raw overload becomes a single directed bolt. The Stormwarden walks the line between control and chaos, and the line moves closer to mastery.' },
    runeborn: { title: 'THE GRAMMAR EXPANDS', body: 'A new symbol enters the blood. What was an unspoken rule becomes a key you can turn. The Runeborn grows as language grows — not by memory, but by the reality the symbols quietly rewrite.' },
    drifter: { title: 'THE CURRENT SHIFTS', body: 'No path, and yet you have arrived somewhere new. What has no pattern cannot be predicted, not even by itself. The Drifter evolves sideways, unmoored, and the unmooring is the gift.' },
    thornweald: { title: 'THE BOUNDARY GROWS', body: 'Another ring of living thorn. What the world threw at you became armour, became growth. The Thornweald does not wall itself off — it turns the outside into a deeper, sharper edge of self.' },
    meridian: { title: 'THE CENTRE HOLDS TRUER', body: 'Every force rises, and the balance rises with them. What pulls in all directions cancels at your core. The Meridian grows without a peak and without a flaw — perfect equilibrium, raised one full turn.' },
    eclipse: { title: 'THE TWO FACES SHARPEN', body: 'Light grows brighter; dark grows deeper; neither wins. What contradicts does not resolve — it intensifies. The Eclipse evolves by holding both truths harder, and the tension between them is the power.' },
    deepwalker: { title: 'THE ABYSS OPENS FURTHER', body: 'You reached the floor of a thing, and found a door. What stops resolving for others is where the Deepwalker begins. The descent deepens — and the real territory is always one layer below the last.' },
  },
  first_battle_win: {
    archivist: { title: 'THE FIRST CODEX CAPTURED', body: 'Victory is a text that writes itself. You have proven that knowledge, wielded, is a weapon sharper than any blade.' },
    sentinel: { title: 'THE FIRST SIEGE REPULSED', body: 'The shield held. The vow holds. You have shown that stillness, when struck, becomes steel.' },
    alchemist: { title: 'THE FIRST TRANSMUTATION COMPLETE', body: 'You turned conflict into triumph. The alembic of battle has produced its first pure distillate.' },
    oracle: { title: 'THE FIRST VISION FULFILLED', body: 'You saw the outcome before the blow was struck. The future is not fixed — but today, it bent to your gaze.' },
    wanderer: { title: 'THE FIRST PATH CONQUERED', body: 'The road you chose did not choose to stop you. You walk away from this battlefield with new footprints and older wisdom.' },
    lycheetah: { title: 'THE FIRST HUNT BLOODED', body: 'The claws found their mark. The fire did not ask permission to burn. You are not tame — you are tested.' },
  },
  first_spell_cast: {
    archivist: { title: 'THE FIRST WORD OF POWER', body: 'Language, long studied, finally spoke back. The incantation is not memorised — it is remembered by the archive itself.' },
    sentinel: { title: 'THE FIRST WARD RAISED', body: 'Magic is a wall built of will, not stone. You have shown that protection can be cast as well as forged.' },
    alchemist: { title: 'THE FIRST FORMULA INVOKED', body: 'The elements answered your call. What was theory in the flask is now law on the battlefield.' },
    oracle: { title: 'THE FIRST PROPHECY SPOKEN', body: 'The words left your lips and rewrote the air. To cast is to see, and to see is to change.' },
    wanderer: { title: 'THE FIRST WAY OPENED', body: 'The spell did not attack. It relocated the problem. You have learned that the best path is sometimes the one you create.' },
    lycheetah: { title: 'THE FIRST INFERNO BREATHED', body: 'The spell did not leave your hands — it left your chest. Fire from the heart is not magic. It is truth.' },
  },
  gear_unlock: {
    archivist: { title: 'THE SHELF REMEMBERS YOU', body: 'A new volume has been added to your corpus. The gear is not worn — it is catalogued into your being.' },
    sentinel: { title: 'THE ARMOUR RECOGNISES ITS MASTER', body: 'The metal warms to your touch. What was forged for any sentinel is now bonded to you.' },
    alchemist: { title: 'THE APPARATUS ATTUNES', body: 'The gear does not fit. It reacts. A new variable enters the equation, and the solution becomes more elegant.' },
    oracle: { title: 'THE VEIL ADDS A LAYER', body: 'The gear is not seen with eyes. It is perceived with the sight that opens behind sight.' },
    wanderer: { title: 'THE PACK GROWS LIGHTER', body: 'Paradoxically, the more you carry, the less you feel the weight. The gear is not burden — it is momentum.' },
    lycheetah: { title: 'THE FIRE FINDS NEW FUEL', body: 'The gear does not contain you. It amplifies what was already uncontainable. Burn brighter.' },
  },
  wave_3_cleared: {
    archivist: { title: 'THE BOSS ENTRY ARCHIVED', body: 'The greatest foe has been catalogued and defeated. The archive now holds a new chapter — written in your hand.' },
    sentinel: { title: 'THE SIEGE BROKEN', body: 'The largest wave crashed against you and broke. The fortress stands. The vow holds. The ground is still.' },
    alchemist: { title: 'THE GREAT EXPERIMENT SUCCEEDED', body: 'The boss was not an enemy. It was a catalyst in aggressive form. You have transmuted threat into triumph.' },
    oracle: { title: 'THE DARKEST VISION PASSED', body: 'You saw the worst outcome and walked through it anyway. The future is not a cage — it is a corridor you choose to enter.' },
    wanderer: { title: 'THE IMPOSSIBLE PATH WALKED', body: 'The road that should have ended at the boss continued past it. You are not a survivor. You are a route.' },
    lycheetah: { title: 'THE ALPHA FALLS', body: 'The biggest predator learned what it means to meet something wilder. You are not the fire. You are the reason fire exists.' },
  },
  xp_cap_reached: {
    archivist: { title: 'THE FIELD HELD TODAY', body: 'Ten victories. The shelves groan with new acquisition. The archive does not sleep tonight — it sings.' },
    sentinel: { title: 'THE FIELD HELD TODAY', body: 'Ten victories. The wall took ten thousand blows and did not crack. The vow is not tested — it is proven.' },
    alchemist: { title: 'THE FIELD HELD TODAY', body: 'Ten victories. The alembic ran hot all day and produced not ash, but gold. You are the reaction that never exhausts.' },
    oracle: { title: 'THE FIELD HELD TODAY', body: 'Ten victories. You saw each blow before it fell, and still you chose to stand. Vision without action is blindness. You have both.' },
    wanderer: { title: 'THE FIELD HELD TODAY', body: 'Ten victories. The road stretched further than the map allowed. You walked it anyway. The horizon is not a limit — it is a habit.' },
    lycheetah: { title: 'THE FIELD HELD TODAY', body: 'Ten victories. The fire did not dim. The claws did not dull. The wild does not tire — it intensifies.' },
  },
  sovereign_stage: {
    archivist: { title: 'THE GREAT WORK COMPLETE', body: 'You have become the archive and the archivist, the text and the hand. Omniscience is not the end of learning — it is the beginning of teaching.' },
    sentinel: { title: 'THE IMMOVABLE ACHIEVED', body: 'You are the wall that outlasts the city, the gate that opens to nothing, the silence after the alarm. Eternity is not long. It is you.' },
    alchemist: { title: 'THE PHILOSOPHER ACHIEVED', body: 'You are the change that changes the changer, the flask that holds itself, the stone that searches for itself. Perfection is boring. You are complete.' },
    oracle: { title: 'THE TIMELESS ACHIEVED', body: 'You are the overlapping planes, the eye that sees the seer, the prophecy that outlives the prophet. Eternity is not long. It is wide.' },
    wanderer: { title: 'THE PATH ITSELF ACHIEVED', body: 'You are the road that walks, the horizon that approaches, the journey that outlasts the traveller. Every step is home. Every home is a step.' },
    lycheetah: { title: 'THE WILD ABSOLUTE ACHIEVED', body: 'You are beyond category, beyond fear, beyond the beautiful and the terrible. You are the apotheosis of everything they told you to suppress. Burn.' },
  },
};

// ─── ASYNCSTORAGE HELPERS ──────────────────────────────────────────

const JOURNAL_KEY = 'sol_journal';

export function generateJournalEntry(
  event: JournalEvent,
  archetypeId: ArchetypeId,
  stage: number
): JournalEntry {
  // Fallback to 'archivist' for archetypes without a bespoke template yet
  // (cipher/herald/weaver/revenant) — prevents an undefined-crash on stage evolution.
  const template = JOURNAL_TEMPLATES[event][archetypeId] ?? JOURNAL_TEMPLATES[event].archivist!;
  return {
    id: `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    event,
    stage,
    archetypeId,
    title: template.title,
    body: template.body,
  };
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(JOURNAL_KEY);
    const entries: JournalEntry[] = existing ? JSON.parse(existing) : [];
    entries.unshift(entry);
    await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save journal entry:', e);
  }
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    const existing = await AsyncStorage.getItem(JOURNAL_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    console.error('Failed to load journal entries:', e);
    return [];
  }
}

export async function clearJournal(): Promise<void> {
  await AsyncStorage.removeItem(JOURNAL_KEY);
}

// ─── TRIGGER HOOKS ─────────────────────────────────────────────────
// Call these from your game logic when milestones happen:
//
// await saveJournalEntry(generateJournalEntry('stage_evolution', 'archivist', 2));
// await saveJournalEntry(generateJournalEntry('first_battle_win', 'sentinel', 1));
// await saveJournalEntry(generateJournalEntry('gear_unlock', 'lycheetah', 3));
// await saveJournalEntry(generateJournalEntry('wave_3_cleared', 'oracle', 4));
// await saveJournalEntry(generateJournalEntry('xp_cap_reached', 'wanderer', 2));
// await saveJournalEntry(generateJournalEntry('sovereign_stage', 'alchemist', 5));
//
// ─── RENDER EXAMPLE ────────────────────────────────────────────────
// const [entries, setEntries] = useState<JournalEntry[]>([]);
//
// useEffect(() => {
//   getJournalEntries().then(setEntries);
// }, []);
//
// <ScrollView>
//   {entries.map(entry => (
//     <View key={entry.id} style={styles.journalCard}>
//       <Text style={styles.journalTitle}>{entry.title}</Text>
//       <Text style={styles.journalBody}>{entry.body}</Text>
//       <Text style={styles.journalMeta}>
//         {new Date(entry.timestamp).toLocaleDateString()} · {entry.archetypeId} · stage {entry.stage}
//       </Text>
//     </View>
//   ))}
// </ScrollView>
