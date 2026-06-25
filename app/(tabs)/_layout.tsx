import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Tabs } from 'expo-router';
import {
  View, Text, Platform, TouchableOpacity, Modal, ScrollView,
  TextInput, KeyboardAvoidingView, Linking, Animated, AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../../constants/theme';
import { useAppMode } from '../../lib/app-mode';
import { getActiveKey, getModel } from '../../lib/storage';
import { sendMessage, AIModel } from '../../lib/ai-client';
import WelcomeTour from '../../components/WelcomeTour';
import { trackTabEnter, trackTabLeave } from '../../lib/analytics';

type IconProps = { color: string; focused: boolean };

// Hot-mysterious Lycheetah tab glow — the active glyph burns in its own hot color
// against obsidian black. Each tab a distinct heat; the cat in the dark.
const TabIcon = ({ glyph, color, focused, hot }: { glyph: string; color: string; focused?: boolean; hot?: string }) => (
  <Text style={{
    fontSize: focused ? 22 : 20,
    color: focused && hot ? hot : color,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: focused && hot ? hot : 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: focused ? 12 : 0,
  }}>
    {glyph}
  </Text>
);

// Per-tab hot signature colors — all in the hot/mysterious family, each distinct.
const HOT = {
  zodiac:    '#A45CFF',  // electric violet — the celestial
  school:    '#C44BFF',  // hot amethyst — the mystic
  sol:       '#FFB000',  // hot solar gold — the warm anchor
  companion: '#FF2D78',  // HOT PINK — the Lycheetah signature, the mythic cat
  sanctum:   '#FF3D6E',  // crimson-rose — the intimate, the blood
  settings:  '#8B7BFF',  // cool periwinkle — the quiet edge
};

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const ACCENT = '#8855FF';

// Global help sections — shown in the help modal
const HELP_SECTIONS = [
  // ── Core ─────────────────────────────────────────────────────────────────────
  { glyph: '⊚', title: 'SOL — AI PARTNER', color: SOL_THEME.primary,
    body: 'Your thinking partner. Type anything — Sol, Aura, Veyra, or Magister responds. Switch personas in Settings. Each has a different voice and domain focus. Conversation persists between sessions. Use the mode chips (WAYFARER / COUNCIL / LAMAGUE / SKEPTIC) to change how Sol responds.' },
  // ── Mystery School cluster ────────────────────────────────────────────────────
  { glyph: '𝔏', title: 'MYSTERY SCHOOL', color: SOL_THEME.headmaster ?? '#E8D5A0',
    body: '41 domains, 340+ subjects — Mythology, Alchemy, Shadow Work, Quantum, Noetic Science, LAMAGUE, Celtic Old Gods, Crystal Lore and more.\n\nDIVE: tap a domain → tap a subject → a live lesson begins. The teacher builds one idea at a time and ends each lesson on an open door (the next mystery) — so you always want the next dive.\n\nKEEP IT: every lesson has ✦ Save to Field · 🔊 Listen · ⧉ Copy/Save. Knowledge doesn\'t evaporate.\n\nDives EARN: XP (evolves your companion) + ✦ dive-currency (spend on companions) + your streak.\n\nSubjects carry primary-source reading lists — tap 📚 to open them.' },
  { glyph: '◈', title: 'LAMAGUE LANGUAGE', color: '#8855FF',
    body: 'Sol\'s compressed epistemic language. Each glyph is a seed-thought encoding a whole class of relation or force. Study in the School tab (LAMAGUE domain). Use the ◈ WORKSHOP (from LAMAGUE header) for PROBE / CEMENT / GLOSSARY. Your companion earns LAMAGUE gear as you level up.' },
  { glyph: '◌', title: 'WORKSHOP', color: '#AA77FF',
    body: 'Access from School → LAMAGUE domain → ◈ WORKSHOP button. Three modes: PROBE (Sol stress-tests your ideas and finds the cracks), CEMENT (flashcard drill until a concept is embodied), GLOSSARY (full 50+ symbol library, searchable by class). The forge for your thinking.' },
  { glyph: '⬡', title: 'CRYSTAL & GEM FORGE', color: '#7ED6DF',
    body: 'Open the Crystal & Gem Lore domain in the School → expand the classroom → find ⬡ GEM FORGE at the bottom. Name your gem, describe it, and Sol generates a photorealistic image using FLUX AI. Six subjects including Crystallography, Piezoelectricity, and gem traditions across cultures.' },
  { glyph: '📚', title: 'PRIMARY SOURCES', color: '#1ABC9C',
    body: 'Many subjects carry a reading list — tap the 📚 PRIMARY SOURCES row inside any subject detail to expand it. Primary sources have a gold dot; secondary have a grey dot. Celtic Old Gods, Irish Mythology, Irish Literature, and Crystal Lore are fully sourced.' },
  // ── Companion & Battle cluster ────────────────────────────────────────────────
  { glyph: '✦', title: 'COMPANION', color: '#F5A623',
    body: 'Your living companion grows as you study — its aura, glyphs and glow intensify across 6 stages (SEED → SPARK → FLAME → FORGE → SOVEREIGN → ASCENDANT).\n\nTAP IT for voice lines (it reacts to what you\'ve actually studied). FEED it daily. EQUIP gear + cosmetics (halos/wings/pets).\n\nTRAVEL: tap 🗺 MAP (top-left) for the world map — every zone has a code (A1, B2…) and is one tap. Or use the mini-map (top-center) to hop to a neighbour. ⚔ ENCOUNTER (bottom) starts a battle in your zone.\n\nEARN COMPANIONS: most are unlocked with ✦ DIVES (your study currency — earn by studying, spend in the companion grid). Some are CAPTURE-only (catch in battle), some shop. A starter set is free. Filter the grid by rarity.\n\nBATTLE: your companion fights with you; weaken an enemy then CAPTURE to your Menagerie.' },
  { glyph: '⚔', title: 'BATTLE, PARTY & VOID BOSSES', color: '#FF6644',
    body: 'In the Companion tab: ⚔ ENCOUNTER spins up a battle in your zone. STRIKE / DEFEND / SPELL / ITEM; weaken a foe then CAPTURE (◈) to add it to your MENAGERIE.\n\nPARTY: field up to 3 captured creatures (⚔ FIELD in the menagerie) — they add bonus damage to every strike.\n\nVOID BOSSES (BATTLE tab → ◈ VOID ENTITIES): 3 special bosses you can ONLY beat by learning. Their aggression zone grows; force can\'t finish them. Dive the bound School subject → earn a cryptic incantation → SPEAK THE SPELL → repel it and claim a special companion.\n\nGROWTH tab (△): each companion levels independently and earns stat points you allocate yourself. The Chronicle there records your whole journey.' },
  { glyph: '⟡', title: 'SHOP + ARSENAL', color: '#C49A3C',
    body: 'Spend ⟡ Lumens earned from battle wins and study. STARTER PACK gives +200⟡ free. Buy halos, wings, and pets in the SHOP. Weapons only drop in battle — not purchasable. ✧ Veras knowledge-dust accumulates from journaling and dives.' },
  // ── Sanctum ───────────────────────────────────────────────────────────────────
  { glyph: '◉', title: 'SANCTUM', color: '#F5A623',
    body: 'Your private layer — sanctuary, not dashboard.\n\nArrive to quiet. Two folds keep it calm by default:\n\n⌄ TODAY\'S FIELD — tap to open your daily stats: vigil, dive log, LQ sparkline, archetype badge, transit, field state. Above the fold, the engine speaks in one sentence (an AURA trend).\n\n⌄ YOUR FIELD DATA — tap to open your deeper data: sparklines, heatmap, journey timeline, weekly journal, trajectory charts, paradox journal, and export. Always visible: AWARENESS PHASE and your AURA self-rating (the interactive core).\n\nJOURNAL: write freely — The Witness AI responds and weaves your entries into a Living Book. VAULT: seal insights you want to keep. SCROLL: your full milestone Chronicle with a daily AI narrative.' },
  { glyph: '△', title: 'CASCADE — KNOWLEDGE PYRAMID', color: '#fb923c',
    body: 'The Truth Pressure engine — test any claim against 9 layers of epistemic pressure and watch your knowledge pyramid form.\n\nHOW IT WORKS: tap a block to open it. Write your claim — the core statement you want to test. Fill the 9 layers:\n\nCORE: Axiom (the load-bearing claim) · Foundation (actual evidence) · Structure (the logical architecture)\nMIDDLE: Coherence (internal consistency) · Resonance (connections to known truths) · Tension (honest friction)\nEDGE: Contested (active dispute) · Speculative (beyond the proof) · Frontier (the unknown edge)\n\n⊚ AUTO-SCORE: tap to have the Truth Pressure engine score all 9 layers in one pass using Π = E·P/(S+S₀). Each layer gets a score + reason from the engine.\n\nYOUR CALL: use the +/− controls to override any layer the engine scored. Your sovereign judgment always wins.\n\n⚔ DEPTH AUDIT: Nigredo mode — the engine identifies your weakest layer and names the single sharpest objection.\n\nPYRAMID: your blocks are sorted by strength and displayed as a pyramid. BEDROCK (strongest) at the apex; FRONTIER (most speculative) at the base. Tap any block to open and edit it.\n\nTENSIONS: when two blocks\' scores diverge by more than 25 points, a TENSIONS panel flags the contradiction.\n\nThe seed pyramid contains 15 AI-knowledge claims — from rock-solid (next-token prediction) to deeply contested (consciousness, AGI timelines). Explore, edit, delete, and build your own.' },
  // ── Zodiac cluster ────────────────────────────────────────────────────────────
  { glyph: '☽', title: 'ZODIAC — THE CELESTIAL FIELD', color: '#9B59B6',
    body: 'The live sky, calculated from astronomical constants (no API needed).\n\nTHE SKY: header shows the current sun sign, moon sign, moon phase and ruling planet — live, ticking. Tap THE SKY tile for full transit detail + planetary aspects (☌ ✶ □ △ ☍).\n\nNATAL: enter your birth details for a personal chart reading in Sol\'s voice, woven against your dive history.\n\n⟟ SIGIL FORGE: turn an intention into a living symbol — TYPE it or DRAW it (FLUX generates the glyph), then save to your lexicon.\n\n◆ GEM FORGE: forge a meaningful artificial gem from your intention/feeling/element — Sol writes its invocation + care ritual and generates a photoreal image.\n\nEach tile expands for a full reading.' },
  { glyph: '⟟', title: 'SIGIL & GEM FORGE', color: '#CC88FF',
    body: 'Zodiac → ⟟ SIGIL FORGE turns an intention into a living symbol (type it or draw it; FLUX renders the glyph). ◆ GEM FORGE turns a feeling/element into a personal talisman — Sol writes its invocation + care ritual and generates a photoreal gem. Both are yours to keep in your lexicon.' },
  { glyph: '🜍', title: 'THE LYCHEETAH TAROT', color: '#9945FF',
    body: 'The Veil & Vein deck — 79 hand-made cards. Zodiac → 🜍 TAROT: browse the real art card-by-card or as a grid, plus the 22 Major + 56 Minor Arcana meanings. The Lycheetah is a mythic cat-spirit, not a fruit — the deck is its mythology. Two intertwining spirits: Veil (curiosity, blue-green) and Vein (want, blood-red).' },
  { glyph: 'ψ', title: 'PSI LOG', color: '#B06BE0',
    body: 'Zodiac → ψ PSI LOG. A space to record psi experiences — precognition, remote viewing, synchronicities, intuitive hits. Log what you sensed and what actually happened; over time you build your own evidence record. Tied to the Noetic Science lineage (Institute of Noetic Sciences / Dean Radin). Edge science, taken seriously, never overclaimed.' },
  { glyph: '◬', title: 'ZONK ZONE', color: '#E8C76A',
    body: 'Zodiac → ◬ ZONK ZONE. The speculative field — wild ideas, fringe theories, "what if" territory held loosely. A play space for thoughts that don\'t fit anywhere else yet. Marked clearly as speculation, never presented as fact. Where curiosity gets to be reckless.' },
  // ── Economy & Chain ───────────────────────────────────────────────────────────
  { glyph: '✧', title: 'VERAS — THE KNOWLEDGE ECONOMY', color: '#C9A84A',
    body: 'Veras (✧) is the smallest indivisible unit of knowledge — proof that knowledge is flowing and valuable. You earn it by learning (journaling, dives). Today it accumulates alongside ⟡ Lumens.\n\nThe vision (coming): when you ADD a new subject to the School, the system silently watches real engagement. If people genuinely study what you brought, Veras fills your subject\'s value bucket — and at a proven-benefit threshold, you\'re rewarded at full parity with established subjects. No hype payouts, no gatekeepers — just demonstrated value.\n\nIts purpose: unveil hidden teachers. The minds who carry real insight but stay silent out of "who am I to teach this?" If people study what you bring, the School itself notices and rewards you. A fair % of every cycle is ring-fenced for giveback, so even free contributors can earn. Payment never buys a better mind — only rooms and standing.' },
  { glyph: '◎', title: 'SOVEREIGN CHAIN', color: '#9945FF',
    body: 'The on-chain layer of your knowledge path — deploying on Solana.\n\nSBTs (Soulbound Tokens): non-transferable NFTs marking milestones: SEEKER (10 dives) · ADEPT (25) · SOVEREIGN (75 + LAMAGUE) · ASCENDANT (150 + mastery). Earned by walking the path. Cannot be purchased.\n\nVERAS ON-CHAIN: Veras (✧) is the knowledge token you accumulate now. When Sovereign Chain launches, Veras converts. If people genuinely study what YOU contributed to the School, your subject\'s Veras bucket fills — and at a proven threshold, you earn at full parity. Hidden teachers get found and rewarded.\n\nLYCHEETAH DAO: SBT holders govern the School. Vote on new domains and protocols. The knowledge architecture becomes collectively sovereign.\n\nAll tracked now. No action needed — your Chronicle and milestones are already being recorded.' },
  // ── Setup & Safety ────────────────────────────────────────────────────────────
  { glyph: '🔑', title: 'API KEY', color: '#E67E22',
    body: 'The School, Gem Forge, Zodiac, and companion work without any key. A key unlocks AI conversation. Gemini is free: aistudio.google.com/apikey → Create API Key → paste in Settings → Provider Keys. Also supports OpenAI, Anthropic, DeepSeek, Kimi.' },
  { glyph: '⚙', title: 'SETTINGS', color: '#778899',
    body: 'Persona (Sol/Aura/Veyra/Magister), provider keys, display name, app mode (Seeker/Adept). Seeker mode uses warmer language; Adept mode uses more precise epistemic register. All preferences stored locally — nothing sent to servers.' },
  { glyph: '💚', title: 'SAFETY', color: '#44FF88',
    body: 'Sol never blocks conversation. Heavy school subjects (intensity 8+) trigger a gentle check-in before diving. The crisis support link at the bottom of this panel connects to Beyond Blue. All care features are always on, for every user.' },
];

export default function TabLayout() {
  const { t } = useAppMode();
  const [helpVisible, setHelpVisible] = useState(false);
  const [tourForced, setTourForced] = useState(false);
  const [openHelpSection, setOpenHelpSection] = useState<string | null>(null);  // collapsible per-tab help zones
  const [askInput, setAskInput] = useState('');
  const [askAnswer, setAskAnswer] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askDone, setAskDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [coins, setCoins] = useState(0);
  const [veras, setVeras] = useState(0);

  const loadCurrencies = useCallback(async () => {
    const [c, v] = await Promise.all([
      AsyncStorage.getItem('sol_coins'),
      AsyncStorage.getItem('sol_veras'),
    ]);
    setCoins(c ? parseInt(c) : 0);
    setVeras(v ? parseInt(v) : 0);
  }, []);

  useEffect(() => {
    loadCurrencies();
    const interval = setInterval(loadCurrencies, 5000);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') loadCurrencies();
      if (state === 'background' || state === 'inactive') trackTabLeave();
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, [loadCurrencies]);

  const askHelp = async () => {
    const q = askInput.trim();
    if (!q) return;
    setAskLoading(true);
    setAskAnswer('');
    setAskDone(false);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) {
        setAskAnswer("No API key set yet — go to Settings → Provider Keys and add a free Gemini key from aistudio.google.com/apikey. Takes 30 seconds.");
        setAskLoading(false);
        setAskDone(true);
        return;
      }
      const context = HELP_SECTIONS.map(s => `${s.title}: ${s.body}`).join('\n\n');
      const result = await sendMessage(
        [{ role: 'user', content: q }],
        `You are Sol's help agent inside the Sol app by Lycheetah. Answer the user's question about how to use the app. Be direct and specific. Under 120 words. Use the following app guide:\n\n${context}`,
        apiKey, (model || 'gemini-2.5-flash') as AIModel,
        undefined, 'normal', 180, 0.7,
      );
      setAskAnswer(result?.text?.trim() || "Couldn't get a response — try again.");
      setAskDone(true);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } catch {
      setAskAnswer('Something went wrong. Check your key in Settings and try again.');
      setAskDone(true);
    }
    setAskLoading(false);
  };

  const closeHelp = () => {
    setHelpVisible(false);
    setAskInput('');
    setAskAnswer('');
    setAskDone(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#070509',          // obsidian — so the hot colors glow against black
            borderTopColor: '#FF2D7822',          // hot-pink hairline
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 82 : 60,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          },

          tabBarActiveTintColor: HOT.companion,   // default hot pink (per-screen overrides below)
          tabBarInactiveTintColor: '#55505E',     // dim violet-grey — recedes into the dark
          headerStyle: { backgroundColor: SOL_THEME.background },
          headerTintColor: SOL_THEME.primary,
          headerTitleStyle: {
            color: SOL_THEME.text,
            fontWeight: '700',
            letterSpacing: 2,
            fontFamily: mono,
          },
          headerLeft: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#C49A3C33', backgroundColor: '#C49A3C0A' }}>
                <Text style={{ color: '#C49A3C', fontSize: 11, fontFamily: mono, fontWeight: '700' }}>⟡</Text>
                <Text style={{ color: '#C49A3C', fontSize: 11, fontFamily: mono, fontWeight: '700' }}>{coins}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#AA77FF33', backgroundColor: '#AA77FF0A' }}>
                <Text style={{ color: '#AA77FF', fontSize: 11, fontFamily: mono, fontWeight: '700' }}>✧</Text>
                <Text style={{ color: '#AA77FF', fontSize: 11, fontFamily: mono, fontWeight: '700' }}>{veras}</Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setHelpVisible(true)}
              style={{
                width: 32, height: 32, borderRadius: 16,
                borderWidth: 1, borderColor: ACCENT + '55',
                backgroundColor: ACCENT + '14',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '700', fontFamily: mono }}>?</Text>
            </TouchableOpacity>
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen name="zodiac"    options={{ title: 'THE STARS',      tabBarLabel: 'Zodiac',    tabBarActiveTintColor: HOT.zodiac,    tabBarIcon: ({ color, focused }: IconProps) => <TabIcon glyph="☽" color={color} focused={focused} hot={HOT.zodiac} />,    listeners: { focus: () => trackTabEnter('zodiac'),    blur: () => trackTabLeave('zodiac')    } }} />
        <Tabs.Screen name="school"    options={{ title: t('MYSTERY SCHOOL'), tabBarLabel: t('School'), tabBarActiveTintColor: HOT.school,   tabBarIcon: ({ color, focused }: IconProps) => <TabIcon glyph="𝔏" color={color} focused={focused} hot={HOT.school} />,   listeners: { focus: () => trackTabEnter('school'),    blur: () => trackTabLeave('school')    } }} />
        <Tabs.Screen name="index"     options={{ title: 'SOL',             tabBarLabel: 'Sol',       tabBarActiveTintColor: HOT.sol,       tabBarIcon: ({ color, focused }: IconProps) => <TabIcon glyph="⊚" color={color} focused={focused} hot={HOT.sol} />,       listeners: { focus: () => trackTabEnter('sol'),       blur: () => trackTabLeave('sol')       } }} />
        <Tabs.Screen name="library"   options={{ href: null, title: 'LIBRARY' }} />
        <Tabs.Screen name="companion" options={{ title: 'COMPANION',       tabBarLabel: 'Companion', tabBarActiveTintColor: HOT.companion, tabBarIcon: ({ color, focused }: IconProps) => <TabIcon glyph="✦" color={color} focused={focused} hot={HOT.companion} />, listeners: { focus: () => trackTabEnter('companion'), blur: () => trackTabLeave('companion') } }} />
        <Tabs.Screen name="sanctum"   options={{ title: t('THE SANCTUM'),  tabBarLabel: t('Sanctum'),tabBarActiveTintColor: HOT.sanctum,  tabBarIcon: ({ color, focused }: IconProps) => <TabIcon glyph="⊼" color={color} focused={focused} hot={HOT.sanctum} />,  listeners: { focus: () => trackTabEnter('sanctum'),   blur: () => trackTabLeave('sanctum')   } }} />
        <Tabs.Screen name="settings"  options={{ title: 'SETTINGS',        tabBarLabel: 'Settings',  tabBarActiveTintColor: HOT.settings, tabBarIcon: ({ color, focused }: IconProps) => <TabIcon glyph="⚙" color={color} focused={focused} hot={HOT.settings} />,  listeners: { focus: () => trackTabEnter('settings'),  blur: () => trackTabLeave('settings')  } }} />
        <Tabs.Screen name="codex" options={{ href: null, title: 'CODEX' }} />
        <Tabs.Screen name="customize" options={{ href: null, title: 'CUSTOMIZE' }} />
        <Tabs.Screen name="modes" options={{ href: null, title: 'FIELD' }} />
        <Tabs.Screen name="workshop" options={{ href: null, title: 'WORKSHOP' }} />
        <Tabs.Screen name="cascade" options={{ href: null, title: 'CASCADE' }} />
      </Tabs>

      {/* ── WELCOME TOUR — first-open guided walkthrough (re-openable via ? help) ── */}
      <WelcomeTour force={tourForced} onClose={() => setTourForced(false)} />

      {/* ── GLOBAL HELP MODAL ── */}
      <Modal visible={helpVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeHelp}>
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: SOL_THEME.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: ACCENT + '22' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 3, fontFamily: mono }}>◈ HOW CAN I HELP?</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>Ask anything. Browse the guide below.</Text>
            </View>
            <TouchableOpacity onPress={closeHelp} style={{ padding: 6 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

            {/* Take the guided tour */}
            <TouchableOpacity
              onPress={() => { setHelpVisible(false); setTimeout(() => setTourForced(true), 250); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: ACCENT + '55', backgroundColor: ACCENT + '0E', marginBottom: 18 }}>
              <Text style={{ fontSize: 22, color: ACCENT }}>⊚</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700' }}>Take the guided tour</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>A 7-step walkthrough — what each part is, how to use it, why it matters.</Text>
              </View>
              <Text style={{ color: ACCENT, fontSize: 16 }}>→</Text>
            </TouchableOpacity>

            {/* AI ask bar */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: askDone ? 10 : 0 }}>
                <TextInput
                  value={askInput}
                  onChangeText={setAskInput}
                  placeholder="Ask about any feature..."
                  placeholderTextColor={SOL_THEME.textMuted + '66'}
                  style={{ flex: 1, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: ACCENT + '44',
                    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: SOL_THEME.text, fontSize: 13 }}
                  onSubmitEditing={askHelp}
                  returnKeyType="send"
                />
                <TouchableOpacity onPress={askHelp} disabled={!askInput.trim() || askLoading}
                  style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: askInput.trim() && !askLoading ? ACCENT : ACCENT + '33' }}>
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>{askLoading ? '…' : '↑'}</Text>
                </TouchableOpacity>
              </View>

              {/* AI answer */}
              {(askAnswer || askLoading) ? (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: ACCENT + '44',
                  backgroundColor: ACCENT + '09', padding: 14 }}>
                  <Text style={{ color: ACCENT, fontSize: 8, fontFamily: mono, letterSpacing: 2, marginBottom: 8 }}>◈ SOL</Text>
                  <Text style={{ color: askLoading ? SOL_THEME.textMuted : SOL_THEME.text, fontSize: 13, lineHeight: 20, fontStyle: askLoading ? 'italic' : 'normal' }}>
                    {askLoading ? 'reading the guide...' : askAnswer}
                  </Text>
                  {askDone && (
                    <TouchableOpacity onPress={() => { setAskAnswer(''); setAskInput(''); setAskDone(false); }} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: mono }}>ASK ANOTHER</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: ACCENT + '22' }} />
              <Text style={{ color: ACCENT + '55', fontSize: 8, fontFamily: mono, letterSpacing: 2 }}>APP GUIDE</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: ACCENT + '22' }} />
            </View>

            {/* Guide cards — collapsible per-tab how-to zones. Tap a title to expand. */}
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: mono, letterSpacing: 1.5, marginTop: 8, marginBottom: 4 }}>TAP A SECTION FOR HOW TO USE IT</Text>
            {HELP_SECTIONS.map(s => {
              const open = openHelpSection === s.title;
              return (
                <View key={s.title} style={{ borderBottomWidth: 1, borderBottomColor: SOL_THEME.border + '44' }}>
                  <TouchableOpacity
                    onPress={() => setOpenHelpSection(open ? null : s.title)}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: s.color + '18', borderWidth: 1, borderColor: s.color + (open ? '88' : '44') }}>
                      <Text style={{ fontSize: 14, color: s.color }}>{s.glyph}</Text>
                    </View>
                    <Text style={{ flex: 1, color: s.color, fontSize: 11, fontWeight: '700', fontFamily: mono, letterSpacing: 1 }}>{s.title}</Text>
                    <Text style={{ color: s.color + 'AA', fontSize: 12 }}>{open ? '▾' : '▸'}</Text>
                  </TouchableOpacity>
                  {open && (
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20, paddingLeft: 44, paddingBottom: 14 }}>{s.body}</Text>
                  )}
                </View>
              );
            })}

            {/* Footer links */}
            <View style={{ marginTop: 24, gap: 10 }}>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:lycheetahsol@gmail.com?subject=BUG%20REPORT')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10,
                  borderWidth: 1, borderColor: '#FF444433', backgroundColor: '#FF44440A' }}>
                <Text style={{ fontSize: 18 }}>🐛</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FF6666', fontSize: 11, fontWeight: '700', fontFamily: mono }}>REPORT A BUG</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>lycheetahsol@gmail.com</Text>
                </View>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Linking.openURL('https://www.beyondblue.org.au/get-support/get-immediate-support')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10,
                  borderWidth: 1, borderColor: '#44FF8833', backgroundColor: '#44FF880A' }}>
                <Text style={{ fontSize: 18 }}>💚</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#44FF88', fontSize: 11, fontWeight: '700', fontFamily: mono }}>CRISIS SUPPORT</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>If you need to talk to someone right now</Text>
                </View>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>→</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
