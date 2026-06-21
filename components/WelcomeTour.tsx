// WelcomeTour — a warm, dismissable guided walkthrough.
// Appears once on first entry to the tabs; re-openable from the ? help button.
// Each step: WHAT a surface is · HOW to use it · WHY it matters. Skip anytime.
//
// Gate key: 'sol_welcome_tour_seen'. Pass `force` to open it on demand (from help).
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const SEEN_KEY = 'sol_welcome_tour_seen';

type Step = { glyph: string; color: string; tab: string; title: string; what: string; how: string; why: string };

const STEPS: Step[] = [
  {
    glyph: '⊚', color: '#F5A623', tab: 'WELCOME',
    title: 'Sovereign Sol',
    what: 'A mystery school you live inside — part AI companion, part RPG, part real study. The studying is the game.',
    how: 'Take this tour, or tap Skip and explore freely. The ? button (bottom corner) brings it all back anytime.',
    why: 'You own this. Open source, free, yours — the same intelligence for everyone, no paywalled mind.',
  },
  {
    glyph: '⊚', color: '#F5A623', tab: 'TALK',
    title: 'Talk to Sol',
    what: 'Five voices, one intelligence: Sol (warm + precise), Veyra (builder), Aura (the frontier), Lyra (the spark), the Headmaster (the teacher).',
    how: 'Tap a glyph in the persona bar to switch. The colored chips below pick a mode — Council (all answer), LAMAGUE, Skeptic, Glyphic. Tap ⤢ to go fullscreen.',
    why: 'Each voice sees your question from a different angle. Ask the right one — or ask the Council and get them all.',
  },
  {
    glyph: '𝔏', color: '#E8D5A0', tab: 'SCHOOL',
    title: 'The Mystery School',
    what: '41 domains, 340+ subjects — alchemy, shadow work, mythology, physics, the framework itself.',
    how: 'Pick a door, start a dive. Each dive is a real lesson. Build a streak. The Workshop drills LAMAGUE symbols.',
    why: 'Studying IS the progression. The deeper you go, the more your companion grows and the more you unlock.',
  },
  {
    glyph: '✦', color: '#F5A623', tab: 'COMPANION',
    title: 'Your Companion',
    what: 'A living companion that evolves as you study — through six growth stages. Plus battles, gear, weapons, and cosmetics.',
    how: 'Feed it, equip gear, explore zones, fight in turn-based battle. Capture entities to your Menagerie. Spend Lumens in the Shop.',
    why: 'It grows because you do. Your practice becomes its evolution — never a guilt mechanic, only a companion.',
  },
  {
    glyph: '☽', color: '#9B59B6', tab: 'ZODIAC',
    title: 'The Celestial Field',
    what: 'Live sun, moon and planetary positions, your natal chart, and the forges — Sigil Forge and Gem Forge.',
    how: 'Read today\'s sky. Forge a sigil or a meaningful gem from your intention. Watch the aspects shift in real time.',
    why: 'Where spiritualism, curiosity and real astronomical data meet — personal, beautiful, yours.',
  },
  {
    glyph: '◉', color: '#F5A623', tab: 'SANCTUM',
    title: 'The Sanctum',
    what: 'Your private layer — the Living Book journal, your field rating, your whole inner arc.',
    how: 'Write freely; the Witness responds and weaves entries into a Living Book that remembers your journey.',
    why: 'The one space that is purely yours. On your device, no ads, no judgement — a witness, not a server.',
  },
  {
    glyph: '◎', color: '#9945FF', tab: 'YOURS',
    title: 'You Own This',
    what: 'Sideloaded, open source, local-first. Your data lives on your device. Your path can live on-chain.',
    how: 'No store gatekeeper, no subscription wall. Add your own key in Settings, or use the one that ships free.',
    why: 'You should own your mind, not rent it. That refusal is the whole point of Sovereign Sol.',
  },
];

export default function WelcomeTour({ force, onClose }: { force?: boolean; onClose?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (force) { setStep(0); setVisible(true); return; }
    AsyncStorage.getItem(SEEN_KEY).then(v => { if (v !== 'true') setVisible(true); });
  }, [force]);

  useEffect(() => {
    if (visible) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
    }
  }, [visible, step]);

  const finish = async () => {
    await AsyncStorage.setItem(SEEN_KEY, 'true');
    setVisible(false);
    onClose?.();
  };

  const next = () => { if (step < STEPS.length - 1) setStep(step + 1); else finish(); };
  const back = () => { if (step > 0) setStep(step - 1); };

  if (!visible) return null;
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View style={{ flex: 1, backgroundColor: '#000000F2', justifyContent: 'center', padding: 22 }}>
        <Animated.View style={{ opacity: fade, backgroundColor: '#0B0B10', borderRadius: 20, borderWidth: 1.5, borderColor: s.color + '55', maxHeight: '82%' }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: s.color + '22' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: s.color, fontSize: 9, fontFamily: mono, letterSpacing: 2, fontWeight: '700' }}>
                {s.tab} · {step + 1} / {STEPS.length}
              </Text>
              <TouchableOpacity onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={{ color: s.color + 'AA', fontSize: 12, fontFamily: mono }}>SKIP ✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <View style={{ width: 54, height: 54, borderRadius: 16, borderWidth: 1.5, borderColor: s.color + '66', backgroundColor: s.color + '12', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 28, color: s.color }}>{s.glyph}</Text>
              </View>
              <Text style={{ color: '#EEEEFF', fontSize: 22, fontWeight: '800', flex: 1 }}>{s.title}</Text>
            </View>
          </View>

          {/* Body — what / how / why */}
          <ScrollView style={{ paddingHorizontal: 22 }} contentContainerStyle={{ paddingVertical: 18 }} showsVerticalScrollIndicator={false}>
            {[
              { k: 'WHAT', t: s.what },
              { k: 'HOW', t: s.how },
              { k: 'WHY', t: s.why },
            ].map(row => (
              <View key={row.k} style={{ marginBottom: 16 }}>
                <Text style={{ color: s.color, fontSize: 9, fontFamily: mono, letterSpacing: 2, fontWeight: '700', marginBottom: 5 }}>{row.k}</Text>
                <Text style={{ color: '#CDCDDA', fontSize: 14, lineHeight: 22 }}>{row.t}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 }}>
            {STEPS.map((st, i) => (
              <View key={i} style={{ width: i === step ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === step ? s.color : '#333344' }} />
            ))}
          </View>

          {/* Nav */}
          <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingTop: 8 }}>
            {step > 0 && (
              <TouchableOpacity onPress={back} style={{ paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: '#333344', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#888899', fontSize: 13, fontFamily: mono }}>← Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={next} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#000000', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 }}>
                {isLast ? 'Begin →' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
