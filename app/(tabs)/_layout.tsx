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
    body: 'Your thinking partner. Type anything — Sol, Aura, Veyra, or Magister responds. Switch guides in Settings → Persona.',
  },
  {
    glyph: '𝔏',
    title: 'MYSTERY SCHOOL',
    color: SOL_THEME.headmaster ?? '#E8D5A0',
    body: '22 domains. 188 subjects. Tap any subject to begin a deep dive. The school does not graduate.',
  },
  {
    glyph: '✦',
    title: 'COMPANION TAB',
    color: '#F5A623',
    body: 'Your companion lives here. Navigate zones with ← → arrows. In COMPANION sub-tab: tap a card → EQUIP ✦ to place it on your scene. Filter by rarity with the pills. In BATTLE sub-tab: fight enemies. Weaken them then CAPTURE (◈) to add to your menagerie.',
  },
  {
    glyph: '☽',
    title: 'ZODIAC',
    color: '#9B59B6',
    body: 'Celestial readings. Coming soon: natal chart from your birthdate — sun, moon, rising, and all planetary positions.',
  },
  {
    glyph: '⊼',
    title: 'SANCTUM',
    color: '#1ABC9C',
    body: 'Your personal data layer. Dive history, LQ sparkline, field journal entries over time.',
  },
  {
    glyph: '🔑',
    title: 'GETTING AN API KEY',
    color: '#E67E22',
    body: 'Sol needs a free Gemini key to respond. Visit aistudio.google.com/apikey → sign in with Google → Create API Key → paste it in Settings → Provider Keys.',
  },
  {
    glyph: '◈',
    title: 'CAPTURE SYSTEM',
    color: '#DD44FF',
    body: 'In battle, weaken an enemy (lower their HP) then tap CAPTURE. Higher catch chance when the enemy is near defeat. One attempt per encounter. Captured entities saved to your Menagerie.',
  },
  {
    glyph: '⚙',
    title: 'SETTINGS',
    color: '#778899',
    body: 'Change AI persona, provider keys (Gemini/OpenAI/Anthropic/DeepSeek/Kimi), display name, and app mode (Seeker / Adept).',
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

      {/* Floating help button */}
      <TouchableOpacity
        onPress={() => setHelpOpen(true)}
        activeOpacity={0.8}
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 96 : 68,
          right: 14,
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: '#07070E',
          borderWidth: 1,
          borderColor: SOL_THEME.primary + '66',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <Text style={{ color: SOL_THEME.primary, fontSize: 15, fontFamily: mono, fontWeight: '700', lineHeight: 18 }}>?</Text>
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
