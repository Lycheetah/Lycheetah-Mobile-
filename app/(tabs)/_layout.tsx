import { useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { SOL_THEME } from '../../constants/theme';
import { useAppMode } from '../../lib/app-mode';

type IconProps = { color: string; focused: boolean };

const TabIcon = ({ glyph, color }: { glyph: string; color: string }) => (
  <Text style={{ fontSize: 20, color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
    {glyph}
  </Text>
);

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const HELP_SECTIONS = [
  {
    glyph: '⊚',
    title: 'SOL — AI PARTNER',
    color: SOL_THEME.primary,
    body: 'Your thinking partner. Type anything — Sol, Aura, Veyra, or Magister responds. Switch personas in Settings. Each has a different voice and domain focus. Conversation persists between sessions.',
  },
  {
    glyph: '𝔏',
    title: 'MYSTERY SCHOOL',
    color: SOL_THEME.headmaster ?? '#E8D5A0',
    body: '24 domains. 188+ subjects. Tap any subject to begin a deep dive — your guide leads the session. Dives earn XP and unlock companion evolution. Heavy subjects (shadow work, crisis-adjacent) trigger safety checks. The school never closes.',
  },
  {
    glyph: '✦',
    title: 'COMPANION',
    color: '#F5A623',
    body: 'Your entity evolves through 6 stages: SEED → SPARK → FLAME → FORGE → SOVEREIGN → ASCENDANT. Feed it to keep energy up. Tap the scene to interact. In the COMPANION sub-tab: tap a card → EQUIP ✦ to place it on scene. Filter by rarity tier with the pills at the top.',
  },
  {
    glyph: '⚔',
    title: 'BATTLE',
    color: '#CC4444',
    body: 'Every D-pad arrow navigates to a random zone. 15% chance of encounter on arrival — battle opens instantly. 0.5% chance of a UNIQUE (wave 5 boss). In battle: ATTACK, DEFEND, cast SPELLS (cost tokens), use ITEMS. CAPTURE weakens enemy first then tap the ◈ button. Win to earn ⟡ coins + weapon drops (35% rate).',
  },
  {
    glyph: '◈',
    title: 'LAMAGUE',
    color: '#8855FF',
    body: 'The compressed language of Sol. Symbols carry layered meaning — each glyph is a seed-thought. Drill in the School or FIELD tab. Gear and spells are named in LAMAGUE. The council of 4 agents invents and ratifies new symbols continuously.',
  },
  {
    glyph: '⚔',
    title: 'WEAPONS',
    color: '#EC4899',
    body: '40 weapons across 7 types: BLADE, STAFF, BOW, ORB, RELIC, TOME, FANG. Drop from battle wins at 35% rate. 5 rarity tiers: COMMON → ARCANE → MYTHIC → LEGENDARY → SPECTRAL. Each adds ATK/SPD/WIL bonus. Equip one at a time in SHOP → ARSENAL.',
  },
  {
    glyph: '◉',
    title: 'FIELD',
    color: '#44AAFF',
    body: 'Zone navigator. 45 zones across 5 rarity tiers. Activate VIGIL to track your active session. View your full LAMAGUE loadout, equipped gear, and zone lore. Arrow buttons always randomise to a new zone.',
  },
  {
    glyph: '⟡',
    title: 'SHOP',
    color: '#C49A3C',
    body: 'Spend ⟡ coins earned from battle wins. STARTER PACK gives +200⟡ free — claim it once. Buy halos, wings, pets to equip on your companion scene. Weapons drop in battle only — not purchasable. New items added each build.',
  },
  {
    glyph: '◎',
    title: 'SANCTUM',
    color: '#1ABC9C',
    body: 'Your private layer. Dive history, LQ score sparkline, field journal, streak tracking. Zodiac natal chart coming — sun/moon/rising from your birthdate. Nothing here is visible to battle or school.',
  },
  {
    glyph: '☽',
    title: 'ZODIAC',
    color: '#9B59B6',
    body: 'Celestial readings tab. Natal chart from your birthdate (coming): sun, moon, rising, all 12 houses and planetary positions. Readings generated through Sol\'s voice and tied to your dive history.',
  },
  {
    glyph: '◎',
    title: 'MENAGERIE',
    color: '#DD44FF',
    body: 'Captured enemies live here. Weaken an enemy in battle below 40% HP then tap CAPTURE (◈). One attempt per encounter. Captured entities stored permanently. Party mode coming — bring them into battle.',
  },
  {
    glyph: '⊚',
    title: 'SAFETY',
    color: '#44FF88',
    body: 'Long-press the ⊚ orb (bottom-right of any screen) for the crisis line. Sol never blocks conversation. Sanctum is always open. Heavy school subjects trigger a gentle check-in. All care features are on by default and cannot be turned off.',
  },
  {
    glyph: '🔑',
    title: 'API KEY',
    color: '#E67E22',
    body: 'Sol needs an AI key to respond. Gemini is free: aistudio.google.com/apikey → sign in → Create API Key → paste in Settings → Provider Keys. Also supports OpenAI, Anthropic, DeepSeek, Kimi.',
  },
  {
    glyph: '⚙',
    title: 'SETTINGS',
    color: '#778899',
    body: 'Persona (Sol/Aura/Veyra/Magister), provider keys, display name, app mode (Seeker/Adept), Skeptic Mode (reframes mystical language as psychological utility). All preferences persist locally — nothing sent to servers.',
  },
  {
    glyph: '✦',
    title: 'TALK',
    color: '#C084FC',
    body: 'Direct companion conversation tab. Switch modes: WAYFARER (open) / COUNCIL (multi-voice) / LAMAGUE (symbol-first) / SKEPTIC (psychological framing). Mode persists between sessions. Wayfarer is the default.',
  },
  {
    glyph: '◌',
    title: 'SKILL',
    color: '#555577',
    body: 'Tracks your bond score — total dives, streak, sessions. Skill tree coming: earn points from dives and battle wins, spend on permanent stat upgrades and passive abilities.',
  },
];

export default function TabLayout() {
  const { t } = useAppMode();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: SOL_THEME.surface,
            borderTopColor: SOL_THEME.border,
            height: Platform.OS === 'ios' ? 82 : 60,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          },
          tabBarScrollEnabled: true,
          tabBarActiveTintColor: SOL_THEME.primary,
          tabBarInactiveTintColor: SOL_THEME.textMuted,
          headerStyle: { backgroundColor: SOL_THEME.background },
          headerTintColor: SOL_THEME.primary,
          headerTitleStyle: {
            color: SOL_THEME.text,
            fontWeight: '700',
            letterSpacing: 2,
            fontFamily: mono,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.5,
          },
        }}
      >
        <Tabs.Screen
          name="zodiac"
          options={{
            title: 'THE STARS',
            tabBarLabel: 'Zodiac',
            tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="☽" color={color} />,
          }}
        />
        <Tabs.Screen
          name="school"
          options={{
            title: t('MYSTERY SCHOOL'),
            tabBarLabel: t('School'),
            tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="𝔏" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'SOL',
            tabBarLabel: 'Sol',
            tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="⊚" color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            href: null,
            title: 'LIBRARY',
          }}
        />
        <Tabs.Screen
          name="companion"
          options={{
            title: 'COMPANION',
            tabBarLabel: 'Companion',
            tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="✦" color={color} />,
          }}
        />
        <Tabs.Screen
          name="sanctum"
          options={{
            title: t('THE SANCTUM'),
            tabBarLabel: t('Sanctum'),
            tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="⊼" color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'SETTINGS',
            tabBarLabel: 'Settings',
            tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="⚙" color={color} />,
          }}
        />
        <Tabs.Screen
          name="codex"
          options={{
            href: null,
            title: 'CODEX',
          }}
        />
        <Tabs.Screen
          name="customize"
          options={{
            href: null,
            title: 'CUSTOMIZE',
          }}
        />
        <Tabs.Screen
          name="modes"
          options={{
            href: null,
            title: 'FIELD',
          }}
        />
      </Tabs>

      {/* Floating help button — top-right, header level */}
      <TouchableOpacity
        onPress={() => setHelpOpen(true)}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 56 : 36,
          right: 54,
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: '#07070E',
          borderWidth: 1,
          borderColor: SOL_THEME.primary + '66',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontFamily: mono, fontWeight: '700', lineHeight: 16 }}>?</Text>
      </TouchableOpacity>

      {/* Help sheet */}
      <Modal visible={helpOpen} transparent animationType="slide" onRequestClose={() => setHelpOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000099' }}>
          <SafeAreaView style={{ backgroundColor: '#08080F', borderTopLeftRadius: 18, borderTopRightRadius: 18, borderTopWidth: 1, borderColor: SOL_THEME.primary + '33', maxHeight: '82%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#10101A' }}>
              <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontFamily: mono, letterSpacing: 2.5, fontWeight: '700', flex: 1 }}>HELP</Text>
              <Text style={{ color: '#444455', fontSize: 9, fontFamily: mono, letterSpacing: 1 }}>SOL · BY LYCHEETAH</Text>
              <TouchableOpacity onPress={() => setHelpOpen(false)} style={{ marginLeft: 16, padding: 4 }}>
                <Text style={{ color: '#445566', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ paddingHorizontal: 20 }}
              contentContainerStyle={{ paddingTop: 18, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {HELP_SECTIONS.map((s, i) => (
                <View key={s.title} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Text style={{ color: s.color, fontSize: 16 }}>{s.glyph}</Text>
                    <Text style={{ color: s.color, fontSize: 10, fontFamily: mono, letterSpacing: 2, fontWeight: '700' }}>{s.title}</Text>
                  </View>
                  <Text style={{ color: '#6677AA', fontSize: 13, lineHeight: 20 }}>{s.body}</Text>
                  {i < HELP_SECTIONS.length - 1 && (
                    <View style={{ height: 1, backgroundColor: '#10101A', marginTop: 18 }} />
                  )}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
