import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import {
  saveBgColor, getBgColor,
  saveFontSize, getFontSize,
  saveHaptics, getHaptics,
  saveStreamSpeed, getStreamSpeed,
  saveResponseLength, getResponseLength,
  saveAccentColor, getAccentColor,
  saveCompanionEnabled, getCompanionEnabled,
  saveCompanionGlyph, getCompanionGlyph,
  saveShowTimestamps, getShowTimestamps,
  saveBubbleRadius, getBubbleRadius,
  saveCompanionAnim, getCompanionAnim,
} from '../../lib/storage';

const BG_COLORS = [
  '#0A0A0A', '#0D1117', '#0F0E17', '#0A0F1E',
  '#0E0A0A', '#0A0E0A', '#1A1A2E', '#1C1C1C',
  '#12100E', '#0D0D1A', '#0A1410', '#100A14',
  '#1A1200', '#0A1218', '#141014', '#0E1418',
];

const ACCENT_COLORS = [
  '#F5A623', '#4A9EFF', '#9B59B6', '#27AE60',
  '#E74C3C', '#1ABC9C', '#E67E22', '#E8C76A',
  '#FF6B9D', '#00D4FF', '#A8FF78', '#FFD700',
];

const GLYPHS = ['✦', '⊚', '◈', '⟐', '☽', '⋆', '❋', '⌘', '⟁', '∞', '◯', '△', '✺', '⌬', '❂', '✧'];

export default function CustomizeScreen() {
  const [bgColor, setBgColor] = useState('#0A0A0A');
  const [accentColor, setAccentColor] = useState('#F5A623');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [responseLength, setResponseLength] = useState<'short' | 'balanced' | 'detailed'>('balanced');
  const [companionEnabled, setCompanionEnabled] = useState(true);
  const [companionGlyph, setCompanionGlyph] = useState('✦');
  const [companionAnimStyle, setCompanionAnimStyle] = useState<'pulse' | 'bounce' | 'spin' | 'breathe'>('pulse');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [bubbleRadius, setBubbleRadius] = useState<'sharp' | 'rounded' | 'pill'>('rounded');

  const load = () => {
    getBgColor().then(c => setBgColor(c));
    getAccentColor().then(c => setAccentColor(c));
    getFontSize().then(s => setFontSize(s));
    getHaptics().then(h => setHapticsEnabled(h));
    getStreamSpeed().then(s => setStreamSpeed(s));
    getResponseLength().then(l => setResponseLength(l));
    getCompanionEnabled().then(e => setCompanionEnabled(e));
    getCompanionGlyph().then(g => setCompanionGlyph(g));
    getCompanionAnim().then(a => setCompanionAnimStyle(a));
    getShowTimestamps().then(t => setShowTimestamps(t));
    getBubbleRadius().then(r => setBubbleRadius(r));
  };

  useEffect(load, []);
  useFocusEffect(React.useCallback(() => { load(); }, []));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* BACKGROUND COLOR */}
      <Text style={styles.sectionTitle}>BACKGROUND</Text>
      <Text style={styles.sectionNote}>Chat background — dark tones recommended.</Text>
      <View style={styles.colorRow}>
        {BG_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.colorSwatch, { backgroundColor: c }, bgColor === c && styles.swatchSelected]}
            onPress={() => { setBgColor(c); saveBgColor(c); }}
          />
        ))}
      </View>

      {/* ACCENT COLOR */}
      <Text style={styles.sectionTitle}>ACCENT COLOR</Text>
      <Text style={styles.sectionNote}>Drives headers, borders, highlights, and the companion.</Text>
      <View style={styles.colorRow}>
        {ACCENT_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.accentSwatch, { backgroundColor: c }, accentColor === c && styles.swatchSelected]}
            onPress={() => { setAccentColor(c); saveAccentColor(c); }}
          />
        ))}
      </View>

      {/* LIVE PREVIEW */}
      <View style={[styles.previewCard, { backgroundColor: bgColor, borderColor: accentColor + '55' }]}>
        <Text style={[styles.previewLabel, { color: accentColor }]}>PREVIEW</Text>
        <View style={[styles.previewBubble, {
          backgroundColor: accentColor + '22',
          borderColor: accentColor + '44',
          borderRadius: bubbleRadius === 'sharp' ? 4 : bubbleRadius === 'pill' ? 20 : 12,
        }]}>
          <Text style={[styles.previewText, { color: SOL_THEME.text, fontSize: fontSize === 'small' ? 13 : fontSize === 'large' ? 17 : 15 }]}>
            Sol · {accentColor}
          </Text>
        </View>
        <Text style={[styles.previewCompanion, { color: accentColor }]}>{companionGlyph}</Text>
      </View>

      {/* FONT SIZE */}
      <Text style={styles.sectionTitle}>FONT SIZE</Text>
      <View style={styles.segmentRow}>
        {(['small', 'medium', 'large'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.segmentOption, fontSize === s && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => { setFontSize(s); saveFontSize(s); }}
          >
            <Text style={[styles.segmentLabel, fontSize === s && { color: SOL_THEME.background }]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BUBBLE STYLE */}
      <Text style={styles.sectionTitle}>BUBBLE STYLE</Text>
      <Text style={styles.sectionNote}>Corner radius on message bubbles.</Text>
      <View style={styles.segmentRow}>
        {(['sharp', 'rounded', 'pill'] as const).map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.segmentOption, bubbleRadius === r && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => { setBubbleRadius(r); saveBubbleRadius(r); }}
          >
            <Text style={[styles.segmentLabel, bubbleRadius === r && { color: SOL_THEME.background }]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* COMPANION */}
      <Text style={styles.sectionTitle}>COMPANION</Text>
      <Text style={styles.sectionNote}>Animated spirit in your chat.</Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>{companionEnabled ? 'Visible' : 'Hidden'}</Text>
          <Text style={styles.toggleNote}>Toggles the animated companion glyph.</Text>
        </View>
        <Switch
          value={companionEnabled}
          onValueChange={val => { setCompanionEnabled(val); saveCompanionEnabled(val); }}
          trackColor={{ false: SOL_THEME.border, true: accentColor }}
          thumbColor={SOL_THEME.text}
        />
      </View>

      {companionEnabled && (
        <>
          <Text style={styles.subLabel}>GLYPH</Text>
          <View style={styles.glyphRow}>
            {GLYPHS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.glyphOption, companionGlyph === g && { borderColor: accentColor, backgroundColor: accentColor + '22' }]}
                onPress={() => { setCompanionGlyph(g); saveCompanionGlyph(g); }}
              >
                <Text style={[styles.glyphText, { color: companionGlyph === g ? accentColor : SOL_THEME.textMuted }]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.subLabel, { marginTop: 10 }]}>ANIMATION</Text>
          <View style={styles.segmentRow}>
            {(['pulse', 'bounce', 'breathe', 'spin'] as const).map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.segmentOption, companionAnimStyle === s && { backgroundColor: accentColor, borderColor: accentColor }]}
                onPress={() => { setCompanionAnimStyle(s); saveCompanionAnim(s); }}
              >
                <Text style={[styles.segmentLabel, companionAnimStyle === s && { color: SOL_THEME.background }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* HAPTICS */}
      <Text style={styles.sectionTitle}>HAPTICS</Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>{hapticsEnabled ? 'Enabled' : 'Disabled'}</Text>
          <Text style={styles.toggleNote}>Vibration on send and response.</Text>
        </View>
        <Switch
          value={hapticsEnabled}
          onValueChange={val => { setHapticsEnabled(val); saveHaptics(val); }}
          trackColor={{ false: SOL_THEME.border, true: accentColor }}
          thumbColor={SOL_THEME.text}
        />
      </View>

      {/* STREAM SPEED */}
      <Text style={styles.sectionTitle}>STREAM SPEED</Text>
      <Text style={styles.sectionNote}>How fast responses appear word by word.</Text>
      <View style={styles.segmentRow}>
        {(['fast', 'normal', 'slow'] as const).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.segmentOption, streamSpeed === s && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => { setStreamSpeed(s); saveStreamSpeed(s); }}
          >
            <Text style={[styles.segmentLabel, streamSpeed === s && { color: SOL_THEME.background }]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* RESPONSE LENGTH */}
      <Text style={styles.sectionTitle}>RESPONSE LENGTH</Text>
      <Text style={styles.sectionNote}>Controls how long Sol's responses are.</Text>
      <View style={styles.segmentRow}>
        {(['short', 'balanced', 'detailed'] as const).map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.segmentOption, responseLength === l && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => { setResponseLength(l); saveResponseLength(l); }}
          >
            <Text style={[styles.segmentLabel, responseLength === l && { color: SOL_THEME.background }]}>
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TIMESTAMPS */}
      <Text style={styles.sectionTitle}>TIMESTAMPS</Text>
      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>Message Timestamps</Text>
          <Text style={styles.toggleNote}>Show time sent on each message.</Text>
        </View>
        <Switch
          value={showTimestamps}
          onValueChange={val => { setShowTimestamps(val); saveShowTimestamps(val); }}
          trackColor={{ false: SOL_THEME.border, true: accentColor }}
          thumbColor={SOL_THEME.text}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerGlyph, { color: accentColor }]}>⊚</Text>
        <Text style={styles.footerNote}>Changes apply immediately</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: SOL_THEME.primary,
    letterSpacing: 2, marginTop: 24, marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  sectionNote: { fontSize: 13, color: SOL_THEME.textMuted, marginBottom: 8 },
  subLabel: {
    fontSize: 10, fontWeight: '700', color: SOL_THEME.textMuted,
    letterSpacing: 1.5, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: SOL_THEME.border },
  accentSwatch: { width: 36, height: 36, borderRadius: 8, borderWidth: 2, borderColor: SOL_THEME.border },
  swatchSelected: { borderColor: SOL_THEME.text, borderWidth: 3 },
  previewCard: {
    borderRadius: 12, borderWidth: 1, padding: 16,
    marginVertical: 12, alignItems: 'flex-start', gap: 8,
  },
  previewLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  previewBubble: {
    borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8,
  },
  previewText: { fontWeight: '500' },
  previewCompanion: { fontSize: 22, alignSelf: 'flex-end' },
  segmentRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  segmentOption: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: SOL_THEME.border,
    alignItems: 'center', backgroundColor: SOL_THEME.surface,
  },
  segmentLabel: { fontSize: 13, fontWeight: '600', color: SOL_THEME.textMuted },
  toggleRow: {
    flexDirection: 'row', backgroundColor: SOL_THEME.surface,
    borderRadius: 8, padding: 12, alignItems: 'center', gap: 12, marginBottom: 4,
  },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: SOL_THEME.text, marginBottom: 2 },
  toggleNote: { fontSize: 12, color: SOL_THEME.textMuted },
  glyphRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  glyphOption: {
    width: 44, height: 44, borderRadius: 8, borderWidth: 1,
    borderColor: SOL_THEME.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: SOL_THEME.surface,
  },
  glyphText: { fontSize: 20 },
  footer: { marginTop: 32, alignItems: 'center', gap: 4 },
  footerGlyph: { fontSize: 20 },
  footerNote: { fontSize: 12, color: SOL_THEME.textMuted },
});
