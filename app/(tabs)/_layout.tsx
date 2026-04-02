import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { SOL_THEME } from '../../constants/theme';

type IconProps = { color: string; focused: boolean };

const TabIcon = ({ glyph, color }: { glyph: string; color: string }) => (
  <Text style={{ fontSize: 20, color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
    {glyph}
  </Text>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: SOL_THEME.surface,
          borderTopColor: SOL_THEME.border,
          height: Platform.OS === 'ios' ? 82 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarActiveTintColor: SOL_THEME.primary,
        tabBarInactiveTintColor: SOL_THEME.textMuted,
        headerStyle: { backgroundColor: SOL_THEME.background },
        headerTintColor: SOL_THEME.primary,
        headerTitleStyle: {
          color: SOL_THEME.text,
          fontWeight: '700',
          letterSpacing: 2,
          fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOL',
          tabBarLabel: 'Sol',
          tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="⊚" color={color} />,
        }}
      />
      <Tabs.Screen
        name="codex"
        options={{
          title: 'CODEX',
          tabBarLabel: 'Codex',
          tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="𝔏" color={color} />,
        }}
      />
      <Tabs.Screen
        name="modes"
        options={{
          title: 'FIELD',
          tabBarLabel: 'Field',
          tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="△" color={color} />,
        }}
      />
      <Tabs.Screen
        name="school"
        options={{
          title: 'MYSTERY SCHOOL',
          tabBarLabel: 'School',
          tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="𝔏" color={color} />,
        }}
      />
      <Tabs.Screen
        name="customize"
        options={{
          title: 'CUSTOMIZE',
          tabBarLabel: 'Style',
          tabBarIcon: ({ color }: IconProps) => <TabIcon glyph="◈" color={color} />,
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
    </Tabs>
  );
}
