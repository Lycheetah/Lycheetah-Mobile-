// TarotViewer — browse the Lycheetah Tarot (Veil & Vein) deck card by card.
// Card art auto-loads from TAROT_ART when PNGs exist; until then shows the glyph.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image, Platform } from 'react-native';
import { MAJOR_ARCANA, MINOR_ARCANA, TAROT_ART, leadColor, VEIL_COLOR, VEIN_COLOR } from '../lib/tarot/veil-and-vein';
import { DECK_ART } from '../lib/tarot/deck-art';

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export default function TarotViewer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [grid, setGrid] = useState(false);
  const [arcana, setArcana] = useState<'major' | 'minor'>('major');
  const [view, setView] = useState<'art' | 'data'>('art');   // default to Mac's real art
  const [artIdx, setArtIdx] = useState(0);   // gallery index into the real deck art
  const DECK = arcana === 'major' ? MAJOR_ARCANA : MINOR_ARCANA;
  const safeIdx = Math.min(idx, DECK.length - 1);
  const card = DECK[safeIdx];
  const col = leadColor(card.lead);
  const art = TAROT_ART[card.id];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#04060AF7', justifyContent: 'center', padding: 18 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View>
            <Text style={{ color: '#CBB6FF', fontSize: 11, fontFamily: mono, letterSpacing: 3, fontWeight: '700' }}>🜍 VEIL &amp; VEIN</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {([['art', `✦ DECK (${DECK_ART.length})`], ['major', '22 MAJOR'], ['minor', '56 MINOR']] as const).map(([a, label]) => {
                const on = (a === 'art' && view === 'art') || (a !== 'art' && view === 'data' && arcana === a);
                return (
                  <TouchableOpacity key={a} onPress={() => { if (a === 'art') { setView('art'); } else { setView('data'); setArcana(a as any); setIdx(0); } }}
                    style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
                      borderColor: on ? '#9945FFAA' : '#33384A', backgroundColor: on ? '#9945FF1A' : 'transparent' }}>
                    <Text style={{ color: on ? '#CBB6FF' : '#66708A', fontSize: 8, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setGrid(g => !g)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: '#88AACC', fontSize: 13 }}>{grid ? '🃏' : '▦'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: '#88AACC', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {view === 'art' ? (
          /* ── REAL DECK ART GALLERY (Mac's Veil & Vein art) ── */
          grid ? (
            <ScrollView style={{ maxHeight: '86%' }} showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {DECK_ART.map((src, i) => (
                  <TouchableOpacity key={i} onPress={() => { setArtIdx(i); setGrid(false); }} activeOpacity={0.85}
                    style={{ width: '31%', aspectRatio: 0.62, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#9945FF44' }}>
                    <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: '80%', aspectRatio: 0.62, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#9945FF88',
                shadowColor: '#9945FF', shadowOpacity: 0.5, shadowRadius: 20, elevation: 8 }}>
                <Image source={DECK_ART[artIdx]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 20 }}>
                <TouchableOpacity onPress={() => setArtIdx(i => (i - 1 + DECK_ART.length) % DECK_ART.length)}
                  style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#33384A' }}>
                  <Text style={{ color: '#9AA4BC', fontSize: 14 }}>←</Text>
                </TouchableOpacity>
                <Text style={{ color: '#66708A', fontSize: 10, fontFamily: mono }}>{artIdx + 1} / {DECK_ART.length}</Text>
                <TouchableOpacity onPress={() => setArtIdx(i => (i + 1) % DECK_ART.length)}
                  style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#9945FF66', backgroundColor: '#9945FF12' }}>
                  <Text style={{ color: '#CBB6FF', fontSize: 14 }}>→</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: '#66708A', fontSize: 9, fontFamily: mono, marginTop: 10 }}>tap ▦ for the full deck grid</Text>
            </View>
          )
        ) : grid ? (
          /* ── GRID — all 22 ── */
          <ScrollView style={{ maxHeight: '82%' }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {DECK.map((c, i) => {
                const cc = leadColor(c.lead);
                return (
                  <TouchableOpacity key={c.id} onPress={() => { setIdx(i); setGrid(false); }} activeOpacity={0.8}
                    style={{ width: '30%', aspectRatio: 0.66, borderRadius: 10, borderWidth: 1, borderColor: cc + '55', backgroundColor: '#0A0610', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                    {TAROT_ART[c.id]
                      ? <Image source={TAROT_ART[c.id]} style={{ width: '100%', height: '100%', borderRadius: 9 }} resizeMode="cover" />
                      : <><Text style={{ color: cc, fontSize: 26 }}>{c.glyph}</Text>
                          <Text style={{ color: cc + 'AA', fontSize: 7, fontFamily: mono, marginTop: 4 }}>{c.numeral}</Text>
                          <Text style={{ color: '#9AA4BC', fontSize: 6.5, fontFamily: mono, textAlign: 'center', marginTop: 2 }} numberOfLines={2}>{c.name}</Text></>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          /* ── SINGLE CARD ── */
          <View style={{ alignItems: 'center' }}>
            {/* The card */}
            <View style={{ width: '72%', aspectRatio: 0.62, borderRadius: 16, borderWidth: 1.5, borderColor: col + '88',
              backgroundColor: '#070310', overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
              shadowColor: col, shadowOpacity: 0.5, shadowRadius: 18, elevation: 8 }}>
              {art ? (
                <Image source={art} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <>
                  {/* braided spirit hint */}
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: VEIL_COLOR + '08' }} />
                  <Text style={{ color: col, fontSize: 12, fontFamily: mono, position: 'absolute', top: 12, letterSpacing: 2 }}>{card.numeral}</Text>
                  <Text style={{ fontSize: 72, color: col }}>{card.glyph}</Text>
                  <View style={{ flexDirection: 'row', gap: 4, position: 'absolute', bottom: 36 }}>
                    <View style={{ width: 20, height: 2, backgroundColor: VEIL_COLOR }} />
                    <View style={{ width: 20, height: 2, backgroundColor: VEIN_COLOR }} />
                  </View>
                  <Text style={{ color: '#E8E4F4', fontSize: 11, fontFamily: mono, fontWeight: '700', position: 'absolute', bottom: 14, letterSpacing: 1 }}>{card.name}</Text>
                </>
              )}
            </View>

            {/* Name + meta */}
            <Text style={{ color: '#F0ECFA', fontSize: 19, fontWeight: '800', letterSpacing: 1, marginTop: 16 }}>{card.name}</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 5, alignItems: 'center' }}>
              <Text style={{ color: '#7A84A0', fontSize: 10, fontFamily: mono }}>{card.numeral} · {card.root}</Text>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: col + '66', backgroundColor: col + '12' }}>
                <Text style={{ color: col, fontSize: 8, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>{card.lead === 'Both' ? 'VEIL ✕ VEIN' : card.lead.toUpperCase()}</Text>
              </View>
            </View>

            {/* Meaning */}
            <Text style={{ color: '#BDC2D4', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 14, paddingHorizontal: 10, fontStyle: 'italic' }}>{card.upright}</Text>

            {/* Nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 22 }}>
              <TouchableOpacity onPress={() => setIdx(i => (i - 1 + DECK.length) % DECK.length)}
                style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#33384A' }}>
                <Text style={{ color: '#9AA4BC', fontSize: 14 }}>←</Text>
              </TouchableOpacity>
              <Text style={{ color: '#66708A', fontSize: 10, fontFamily: mono }}>{safeIdx + 1} / {DECK.length}</Text>
              <TouchableOpacity onPress={() => setIdx(i => (i + 1) % DECK.length)}
                style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: col + '66', backgroundColor: col + '12' }}>
                <Text style={{ color: col, fontSize: 14 }}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
