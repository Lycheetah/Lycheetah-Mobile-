// TarotViewer — browse all tarot decks card by card.
// Decks: Veil & Vein (custom Lycheetah art) | Lycheetah Arcana (87 AI-rendered cards)
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, Image, Platform, FlatList } from 'react-native';
import { MAJOR_ARCANA, MINOR_ARCANA, TAROT_ART, leadColor, VEIL_COLOR, VEIN_COLOR } from '../lib/tarot/veil-and-vein';
import { DECK_ART } from '../lib/tarot/deck-art';
import { ARCANA_IMAGE } from '../lib/divination/arcana-images';

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

type ActiveDeck = 'vv' | 'arcana';

// Build a flat ordered array of Arcana entries from the image map.
// Insertion order is preserved: Majors first, then Minors by suit.
const ARCANA_ENTRIES = Object.entries(ARCANA_IMAGE) as [string, ReturnType<typeof require>][];

export default function TarotViewer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [activeDeck, setActiveDeck] = useState<ActiveDeck>('vv');
  const [grid, setGrid] = useState(false);

  // Veil & Vein state
  const [vvView, setVvView] = useState<'art' | 'data'>('art');
  const [arcana, setArcana] = useState<'major' | 'minor'>('major');
  const [dataIdx, setDataIdx] = useState(0);
  const [artIdx, setArtIdx] = useState(0);

  // Lycheetah Arcana state
  const [arcanaIdx, setArcanaIdx] = useState(0);

  const DECK = arcana === 'major' ? MAJOR_ARCANA : MINOR_ARCANA;
  const safeDataIdx = Math.min(dataIdx, DECK.length - 1);
  const card = DECK[safeDataIdx];
  const col = leadColor(card.lead);
  const art = TAROT_ART[card.id];

  const safeArcanaIdx = Math.min(arcanaIdx, ARCANA_ENTRIES.length - 1);
  const [arcanaName, arcanaSource] = ARCANA_ENTRIES[safeArcanaIdx];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#04060AF7', justifyContent: 'flex-start', padding: 18, paddingTop: 28 }}>
        {/* ── HEADER ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          {/* Deck selector tabs */}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {([['vv', '✦ VEIL & VEIN'], ['arcana', '⊚ LYCHEETAH ARCANA']] as [ActiveDeck, string][]).map(([d, label]) => {
              const on = activeDeck === d;
              return (
                <TouchableOpacity key={d} onPress={() => { setActiveDeck(d); setGrid(false); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
                    borderColor: on ? '#9945FFAA' : '#33384A', backgroundColor: on ? '#9945FF1A' : 'transparent' }}>
                  <Text style={{ color: on ? '#CBB6FF' : '#66708A', fontSize: 8, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
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

        {/* ── VEIL & VEIN ── */}
        {activeDeck === 'vv' && (
          <>
            {/* Sub-tabs */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
              {([['art', `✦ DECK (${DECK_ART.length})`], ['major', '22 MAJOR'], ['minor', '56 MINOR']] as const).map(([a, label]) => {
                const on = (a === 'art' && vvView === 'art') || (a !== 'art' && vvView === 'data' && arcana === a);
                return (
                  <TouchableOpacity key={a} onPress={() => { if (a === 'art') { setVvView('art'); } else { setVvView('data'); setArcana(a as any); setDataIdx(0); } }}
                    style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
                      borderColor: on ? '#9945FFAA' : '#33384A', backgroundColor: on ? '#9945FF1A' : 'transparent' }}>
                    <Text style={{ color: on ? '#CBB6FF' : '#66708A', fontSize: 8, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {vvView === 'art' ? (
              grid ? (
                <FlatList
                  data={DECK_ART}
                  keyExtractor={(_, i) => 'art' + i}
                  numColumns={3}
                  style={{ maxHeight: '82%' }}
                  showsVerticalScrollIndicator={false}
                  columnWrapperStyle={{ gap: 6, marginBottom: 6, justifyContent: 'center' }}
                  initialNumToRender={9} maxToRenderPerBatch={9} windowSize={5} removeClippedSubviews
                  renderItem={({ item: src, index: i }) => (
                    <TouchableOpacity onPress={() => { setArtIdx(i); setGrid(false); }} activeOpacity={0.85}
                      style={{ width: '31%', aspectRatio: 0.62, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#9945FF44' }}>
                      <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                    </TouchableOpacity>
                  )}
                />
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
              <FlatList
                data={DECK}
                keyExtractor={c => c.id}
                numColumns={3}
                style={{ maxHeight: '82%' }}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={{ gap: 8, marginBottom: 8, justifyContent: 'center' }}
                initialNumToRender={9} maxToRenderPerBatch={9} windowSize={5} removeClippedSubviews
                renderItem={({ item: c, index: i }) => {
                  const cc = leadColor(c.lead);
                  return (
                    <TouchableOpacity onPress={() => { setDataIdx(i); setGrid(false); }} activeOpacity={0.8}
                      style={{ width: '30%', aspectRatio: 0.66, borderRadius: 10, borderWidth: 1, borderColor: cc + '55', backgroundColor: '#0A0610', alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                      {TAROT_ART[c.id]
                        ? <Image source={TAROT_ART[c.id]} style={{ width: '100%', height: '100%', borderRadius: 9 }} resizeMode="contain" />
                        : <><Text style={{ color: cc, fontSize: 26 }}>{c.glyph}</Text>
                            <Text style={{ color: cc + 'AA', fontSize: 7, fontFamily: mono, marginTop: 4 }}>{c.numeral}</Text>
                            <Text style={{ color: '#9AA4BC', fontSize: 6.5, fontFamily: mono, textAlign: 'center', marginTop: 2 }} numberOfLines={2}>{c.name}</Text></>}
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: '72%', aspectRatio: 0.62, borderRadius: 16, borderWidth: 1.5, borderColor: col + '88',
                  backgroundColor: '#070310', overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
                  shadowColor: col, shadowOpacity: 0.5, shadowRadius: 18, elevation: 8 }}>
                  {art ? (
                    <Image source={art} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  ) : (
                    <>
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
                <Text style={{ color: '#F0ECFA', fontSize: 19, fontWeight: '800', letterSpacing: 1, marginTop: 16 }}>{card.name}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 5, alignItems: 'center' }}>
                  <Text style={{ color: '#7A84A0', fontSize: 10, fontFamily: mono }}>{card.numeral} · {card.root}</Text>
                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: col + '66', backgroundColor: col + '12' }}>
                    <Text style={{ color: col, fontSize: 8, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>{card.lead === 'Both' ? 'VEIL ✕ VEIN' : card.lead.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={{ color: '#BDC2D4', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 14, paddingHorizontal: 10, fontStyle: 'italic' }}>{card.upright}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 22 }}>
                  <TouchableOpacity onPress={() => setDataIdx(i => (i - 1 + DECK.length) % DECK.length)}
                    style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#33384A' }}>
                    <Text style={{ color: '#9AA4BC', fontSize: 14 }}>←</Text>
                  </TouchableOpacity>
                  <Text style={{ color: '#66708A', fontSize: 10, fontFamily: mono }}>{safeDataIdx + 1} / {DECK.length}</Text>
                  <TouchableOpacity onPress={() => setDataIdx(i => (i + 1) % DECK.length)}
                    style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: col + '66', backgroundColor: col + '12' }}>
                    <Text style={{ color: col, fontSize: 14 }}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* ── LYCHEETAH ARCANA ── */}
        {activeDeck === 'arcana' && (
          grid ? (
            <FlatList
              data={ARCANA_ENTRIES}
              keyExtractor={([name]) => name}
              numColumns={3}
              style={{ maxHeight: '86%' }}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={{ gap: 6, marginBottom: 6, justifyContent: 'center' }}
              initialNumToRender={9} maxToRenderPerBatch={9} windowSize={5} removeClippedSubviews
              renderItem={({ item: [name, src], index: i }) => (
                <TouchableOpacity onPress={() => { setArcanaIdx(i); setGrid(false); }} activeOpacity={0.85}
                  style={{ width: '31%', borderRadius: 8, borderWidth: 1, borderColor: '#C8A96E44', backgroundColor: '#07050F' }}>
                  <View style={{ aspectRatio: 0.62, borderRadius: 8, overflow: 'hidden' }}>
                    <Image source={src} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  </View>
                  <Text style={{ color: '#C8A96ECC', fontSize: 6.5, fontFamily: mono, fontWeight: '700', textAlign: 'center', padding: 4, lineHeight: 9 }} numberOfLines={2}>{name}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: '78%', aspectRatio: 0.62, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#C8A96E88',
                backgroundColor: '#07050F', shadowColor: '#C8A96E', shadowOpacity: 0.5, shadowRadius: 20, elevation: 8 }}>
                <Image source={arcanaSource} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
              <Text style={{ color: '#F0ECFA', fontSize: 17, fontWeight: '800', letterSpacing: 1, marginTop: 16, textAlign: 'center', paddingHorizontal: 16 }}>{arcanaName}</Text>
              <Text style={{ color: '#66708A', fontSize: 9, fontFamily: mono, marginTop: 4 }}>{safeArcanaIdx + 1} / {ARCANA_ENTRIES.length}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 }}>
                <TouchableOpacity onPress={() => setArcanaIdx(i => (i - 1 + ARCANA_ENTRIES.length) % ARCANA_ENTRIES.length)}
                  style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#33384A' }}>
                  <Text style={{ color: '#9AA4BC', fontSize: 14 }}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setGrid(true)}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#C8A96E44', backgroundColor: '#C8A96E0D' }}>
                  <Text style={{ color: '#C8A96E', fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 1 }}>▦ ALL {ARCANA_ENTRIES.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setArcanaIdx(i => (i + 1) % ARCANA_ENTRIES.length)}
                  style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#C8A96E66', backgroundColor: '#C8A96E12' }}>
                  <Text style={{ color: '#C8A96ECC', fontSize: 14 }}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        )}
      </View>
    </Modal>
  );
}
