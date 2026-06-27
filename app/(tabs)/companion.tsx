import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Animated, Easing,
  Platform, Dimensions, TextInput, Modal, Image, StyleSheet, ActivityIndicator, KeyboardAvoidingView, FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Svg, { Circle, Line, G, Text as SvgText, Rect } from 'react-native-svg';
import { CreatureSvg } from '../../components/CreatureSvg';
import { CompanionSpecOverlay, CompanionSpec, DEFAULT_SPEC } from '../../components/CompanionSpecOverlay';
import { CompanionRenderer, CompanionVisualSpec } from '../../components/CompanionRenderer';
import COMPANIONS_DATA from '../../assets/companions/companions_data.json';
import { sendMessage } from '../../lib/ai-client';
import { getProviderKey, getActiveKey, getModel } from '../../lib/storage';
import { getGearOverlay } from '../data/task2_gear_overlays';
import { generateJournalEntry, saveJournalEntry } from '../data/task3_journal';
import { WEAPONS, RARITY_COLOR as WEAPON_RARITY_COLOR, pickWeaponDrop } from '../../lib/weapons';
import { LYCHEETAH_SECRETS, LycheetahSecret } from '../../lib/mystery-school/lycheetah-secrets';
import { VOID_BOSSES, VoidBoss, diveUnlocksBoss } from '../../lib/bosses';
import {
  SkinId, SKINS, SKIN_IDS, SKIN_ORDER, SKIN_RARITY, RARITY_ORDER, RarityTier,
  RARITY_COLORS, SKIN_GRID_HIDDEN, RARITY_GROUPS, SCENE_IMAGES, ARCHETYPE_SCENES,
  DAY_SEED, GBA_W, GBA_ADJ, SceneRoom, WORLD_MAP, ZONE_DIVE_COST, getSkinUnlockStatus,
} from '../../lib/companion/zones';
import type { ArchetypeId } from '../data/companion-types';
import type {
  EvolutionStage, CompanionMood, Direction, GearSlot, EvoPath,
  EnemyRarity, EnemyDef, EvoPathDef, Archetype,
  BattleState, PlayerStats, AlchemicalMode, SkillNode, SpellDef,
  BattleItem, LootItem, CosmeticRarity, CosmeticItem, FoodItem,
  Quest, QuestData, GearTier, RelicDef, CreatureBody,
  StatusKind, StatusEffect, EnemyIntent, IntentKind, EnemyBehavior,
} from '../../lib/companion/game-data';
import {
  SPECIAL_COMPANIONS, getItemEffect, getRoomById, getRoomInSkin, getSkinIndex, showToast,
  RARITY_COLOUR, EAT_EYES,
  COMPANION_IMAGES, ZONE_COMPANION_IMAGES, ENEMY_IMAGES, GEAR_IMAGES,
  getGearImage, getEnemyImage, getEnemyDef, pickEnemy,
  ARCHETYPES, ARCHETYPE_IDS,
  STAGES, CREATURE_BODIES, XP_LEVELS, RELIC_POOL,
  LAMAGUE_GEAR, getGear, nextGearTier,
  ARCHETYPE_STAT_BASES, layerToAlchemicalMode, ALCH_META,
  SKILL_NODES, applySkillBonuses, computePlayerStats, applyRelicBonuses,
  ARCHETYPE_SPELLS, ZONE_ENCOUNTER_SPELLS,
  BATTLE_ITEMS, ENEMY_LORE, LOOT_TABLE,
  RARITY_COLOR, HALO_ITEMS, WINGS_ITEMS, PET_ITEMS, ALL_COSMETIC_ITEMS, findCosmeticArt,
  BACKGROUND_ITEMS, findBgArt,
  BATTLE_MYSTERY_SIGNALS, ENTROPY_NAMES, ENTROPY_BODIES, getEntropyBody, ENTROPY_LORE,
  COMPANION_LORE, ZONE_ENEMY_POOL, ZONE_COMPANION_POOL,
  makeCompanionEntityDef, pickZoneEnemy, freshZoneWave,
  STARS, dailyEntityName, FOOD_POOL, getDailyFoods,
  PHRASES, QUEST_POOL, getDailyQuests,
  BOND_TIERS, getBond, getStage, computeXP, getLevel, rnd,
  freshWave, rollLoot, waveTokens,
  COMPANION_VICTORY_LINES, COMPANION_CAPTURE_LINES, COMPANION_DEFEAT_LINES,
  SHOW_DEV_STAGE, todayDateKey,
  STATUS_META, tickStatuses, hasStatus, applyStatus, pickEnemyIntent,
  COMPANION_GREETINGS, P_COUNT, P_X, P_SZ, getTimeOverlay, dateSeed,
  COMPANION_ROSTER,
} from '../../lib/companion/game-data';

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_H = 300;
const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// ─── SceneBg — tintColor-sealed wrapper ──────────────────────────────────────
// NEVER add tintColor prop here. This component exists to make that impossible.
// blurRadius is allowed only for the mid-layer (intentional depth blur).
const SceneBg = React.memo(({ source, style, blurRadius }: { source: any; style: any; blurRadius?: number }) => (
  <Animated.Image source={source} style={style} resizeMode="cover" blurRadius={blurRadius} />
));

function CompanionScene({
  stage, mood, skin, archetype, onTap, phrase, phraseAnim, onDismissPhrase, companionName,
  battleHP, battleMaxHP, battleEntityName, battleWave, entityShakeAnim, eating, evoPath, devStagePin,
  gearCrown, gearBody, gearCape, gearMantle, companionSpec, equippedCompanionSkin,
  currentRoomId, navigateRoom, getLockStatus, showRoomLabel, sceneFade,
  roomLore, roomLoreAnim, onDismissLore, onSwitchTab,
  equippedWings, equippedHalo, equippedPet, equippedBg, onRandomZone, onOpenMap, onTravelTo, onEncounter, showTravel = true,
  campfireActive = false, onBonfire,
}: {
  stage: EvolutionStage; mood: CompanionMood; skin: typeof SKINS[SkinId]; archetype: Archetype;
  onTap: () => void; phrase: string | null; phraseAnim: Animated.Value; onDismissPhrase: () => void;
  companionName?: string;
  battleHP: number; battleMaxHP: number; battleEntityName: string; battleWave: number;
  entityShakeAnim: Animated.Value; eating: boolean; evoPath: EvoPath | null;
  devStagePin: EvolutionStage | null;
  gearCrown: GearTier; gearBody: GearTier; gearCape: GearTier; gearMantle: GearTier;
  companionSpec: CompanionSpec;
  equippedCompanionSkin: SkinId | null;
  currentRoomId: string;
  navigateRoom: (d: Direction) => void;
  getLockStatus: (d: Direction) => boolean;
  showRoomLabel: boolean;
  sceneFade: Animated.Value;
  roomLore: string | null;
  roomLoreAnim: Animated.Value;
  onDismissLore: () => void;
  onSwitchTab: (tab: 'talk'|'companion'|'world'|'battle'|'gear') => void;
  equippedWings?: string | null;
  equippedHalo?: string | null;
  equippedPet?: string | null;
  equippedBg?: string | null;
  onRandomZone: () => void;
  onOpenMap: () => void;
  onTravelTo: (skinId: SkinId) => void;
  onEncounter: () => void;
  showTravel?: boolean;
  campfireActive?: boolean;
  onBonfire?: () => void;
}) {
  const stageData = STAGES[stage];
  const { color, bgColor, particleGlyph, glowColor, cardBg, starGlyphs } = skin;
  const battleActive = battleHP > 0;

  const [bgZoom, setBgZoom] = useState(1.0);

  const breathAnim    = useRef(new Animated.Value(0)).current;
  const auraPulse     = useRef(new Animated.Value(0)).current;
  const blinkAnim     = useRef(new Animated.Value(1)).current;
  const bobAnim       = useRef(new Animated.Value(0)).current;
  const driftAnim     = useRef(new Animated.Value(0)).current;
  const glowAnim      = useRef(new Animated.Value(0)).current;
  const shadowAnim    = useRef(new Animated.Value(0)).current;
  const entityFadeAnim   = useRef(new Animated.Value(1)).current;
  const victoryFlash     = useRef(new Animated.Value(0)).current;
  const particleAnims    = useRef(Array.from({ length: P_COUNT }, () => new Animated.Value(0))).current;
  const entitySlideAnim  = useRef(new Animated.Value(120)).current;  // enemy entrance
  const entityHitFlash   = useRef(new Animated.Value(0)).current;    // red hit flash
  const entityScaleAnim  = useRef(new Animated.Value(1)).current;    // death shrink
  const moodFlash        = useRef(new Animated.Value(0)).current;    // mood-up pulse
  const tapRipple        = useRef(new Animated.Value(0)).current;    // tap ripple
  const [tapPos,  setTapPos]  = useState({ x: 0, y: 0 });
  const [showRipple, setShowRipple] = useState(false);
  const bgParallaxX = driftAnim.interpolate({ inputRange: [-30, 30], outputRange: [-18, 18] });

  // Slow continuous auto-drift — makes WIDE landscape backgrounds scroll cinematically,
  // so a zone feels like a living place you're standing in (not a flat card). #release
  const autoDrift = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(autoDrift, { toValue: 1, duration: 26000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(autoDrift, { toValue: 0, duration: 26000, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  const isLandscapeBg = equippedBg?.startsWith('bg_land') ?? false;
  const bgAutoX = autoDrift.interpolate({ inputRange: [0, 1], outputRange: isLandscapeBg ? [-90, 90] : [-28, 28] });

  // ── 2.5D Parallax (Accelerometer) ─────────────────────────
  const tiltX   = useRef(new Animated.Value(0)).current;
  const fgTiltX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Accelerometer.setUpdateInterval(60);
    const sub = Accelerometer.addListener(({ x }) => {
      Animated.spring(tiltX,   { toValue: x * 24, useNativeDriver: true, damping: 12, stiffness: 80 }).start();
      Animated.spring(fgTiltX, { toValue: x * 52, useNativeDriver: true, damping: 10, stiffness: 90 }).start();
    });
    return () => sub.remove();
  }, []);
  const midParallaxX = tiltX;
  const fgParallaxX  = fgTiltX;

  useEffect(() => {
    const dur = mood === 'transcendent' ? 3000 : mood === 'lit' ? 1000 : 2400;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(breathAnim, { toValue: 0, duration: dur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(auraPulse, { toValue: 1, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(auraPulse, { toValue: 0, duration: 1800, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const bobDur = mood === 'dormant' ? 5000 : mood === 'lit' ? 1800 : mood === 'transcendent' ? 4000 : 2800;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bobAnim, { toValue: 1, duration: bobDur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(bobAnim, { toValue: 0, duration: bobDur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  // Horizontal lazy drift — creature wanders slowly across scene
  useEffect(() => {
    const driftDur = mood === 'transcendent' ? 3200 : mood === 'lit' ? 2400 : 4200;
    const driftAmt = mood === 'transcendent' ? 38 : mood === 'lit' ? 28 : 18;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(driftAnim, { toValue: driftAmt, duration: driftDur, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(driftAnim, { toValue: -driftAmt, duration: driftDur * 1.3, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(driftAnim, { toValue: 0, duration: driftDur * 0.7, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, [mood]);

  // Shadow breathes opposite to bob (squishes when creature descends)
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(shadowAnim, { toValue: 1, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(shadowAnim, { toValue: 0, duration: 2800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
      Animated.timing(glowAnim, { toValue: 0, duration: 3500, useNativeDriver: true, easing: Easing.inOut(Easing.quad) }),
    ]));
    loop.start(); return () => loop.stop();
  }, []);

  useEffect(() => {
    let running = true;
    const doBlink = () => {
      if (!running) return;
      setTimeout(() => {
        if (!running) return;
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start(doBlink);
      }, 3000 + Math.random() * 3000);
    };
    doBlink(); return () => { running = false; };
  }, []);

  useEffect(() => {
    const loops = particleAnims.map((anim, i) => {
      const base = mood === 'lit' ? 1200 : mood === 'dormant' ? 4000 : 2400;
      return Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: base + i * 300, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(anim, { toValue: 0, duration: base + i * 300, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ]));
    });
    loops.forEach((l, i) => setTimeout(() => l.start(), i * 200));
    return () => loops.forEach(l => l.stop());
  }, [mood]);

  // Enemy entrance — slide in when entity name changes (new wave)
  useEffect(() => {
    if (!battleEntityName) return;
    entitySlideAnim.setValue(140);
    entityFadeAnim.setValue(1);
    entityScaleAnim.setValue(1);
    Animated.spring(entitySlideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, [battleEntityName]);

  // Hit flash — fires on any HP decrease
  const prevHP = useRef(battleHP);
  useEffect(() => {
    if (battleHP < prevHP.current && battleHP > 0) {
      entityHitFlash.setValue(1);
      Animated.timing(entityHitFlash, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }
    if (battleHP === 0) {
      // Death: flash white, shrink, fade
      Animated.sequence([
        Animated.timing(victoryFlash, { toValue: 0.5, duration: 80, useNativeDriver: true }),
        Animated.timing(victoryFlash, { toValue: 0,   duration: 600, useNativeDriver: true }),
      ]).start();
      Animated.parallel([
        Animated.timing(entityScaleAnim, { toValue: 0.1, duration: 700, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
        Animated.timing(entityFadeAnim,  { toValue: 0,   duration: 700, useNativeDriver: true }),
      ]).start();
    } else {
      victoryFlash.setValue(0);
    }
    prevHP.current = battleHP;
  }, [battleHP]);

  const effectiveStage    = devStagePin !== null ? devStagePin : stage;
  const stageParticleCount = [0, 2, 4, 6, 8, 10][effectiveStage];
  const stageParticlePeak  = [0, 0.38, 0.55, 0.72, 0.86, 0.95][effectiveStage];
  const stageGlowLo        = [0, 0.04, 0.07, 0.12, 0.18, 0.26][effectiveStage];
  const stageGlowHi        = [0, 0.09, 0.16, 0.24, 0.34, 0.46][effectiveStage];
  const stageGlowSize      = 80 + effectiveStage * 18;

  const breathScale = breathAnim.interpolate({ inputRange: [0,1], outputRange: [0.94, 1.06] });
  const auraScale   = auraPulse.interpolate({ inputRange: [0,1], outputRange: [1, 1.15] });
  const auraOpacity = auraPulse.interpolate({ inputRange: [0,1], outputRange: [0.18, 0.45] });
  const bobAmp = mood === 'dormant' ? -8 : mood === 'lit' ? -22 : mood === 'transcendent' ? -28 : -16;
  const bobY        = bobAnim.interpolate({ inputRange: [0,1], outputRange: [0, bobAmp] });
  const driftX      = driftAnim;
  const glowOp      = glowAnim.interpolate({ inputRange: [0,1], outputRange: [0.15, 0.40] });
  const bodyOp      = breathAnim.interpolate({ inputRange: [0,1], outputRange: mood === 'dormant' ? [0.82, 0.92] : [0.97, 1] });
  // Shadow squishes when creature is up (bobY negative), expands when down
  const shadowScaleX = shadowAnim.interpolate({ inputRange: [0,1], outputRange: [1.0, 0.72] });
  const shadowOp     = shadowAnim.interpolate({ inputRange: [0,1], outputRange: [0.55, 0.28] });

  const currentRoom = getRoomById(currentRoomId) ?? WORLD_MAP[0];
  const sceneBg = (equippedBg && findBgArt(equippedBg)) ? findBgArt(equippedBg) : currentRoom.image;
  const hitTint = entityHitFlash.interpolate({ inputRange: [0, 1], outputRange: ['#00000000', '#FF000088'] });

  return (
    <View style={{ width: SCREEN_W, height: SCENE_H, backgroundColor: bgColor, overflow: 'hidden' }}>
      <SceneBg
        source={sceneBg}
        style={{ position:'absolute', top:-20, left: isLandscapeBg ? -100 : -40, width: isLandscapeBg ? SCREEN_W+200 : SCREEN_W+80, height:SCENE_H+40, opacity:sceneFade, transform:[{ scale:bgZoom }, { translateX:bgParallaxX }, { translateX:bgAutoX }] }}
      />
      {/* Zoom controls — top-right corner */}
      <View style={{ position:'absolute', top:8, right:8, flexDirection:'row', gap:4 }}>
        {([{label:'−', delta:-0.15},{label:'+', delta:0.15}] as const).map(({ label, delta }) => (
          <TouchableOpacity key={label} onPress={() => setBgZoom(z => Math.min(3.0, Math.max(0.3, +(z + delta).toFixed(2))))} activeOpacity={0.7}
            style={{ width:26, height:26, borderRadius:13, borderWidth:1, borderColor:'rgba(255,255,255,0.2)', backgroundColor:'rgba(0,0,0,0.5)', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:14, lineHeight:16 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Travel Map — top-left, one tap to the world (hidden in battle tab) */}
      {showTravel && (
        <TouchableOpacity onPress={onOpenMap} activeOpacity={0.8}
          style={{ position:'absolute', top:8, left:8, flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, height:26, borderRadius:13, borderWidth:1, borderColor: skin.color + '66', backgroundColor:'rgba(0,0,0,0.55)' }}>
          <Text style={{ fontSize:13 }}>🗺</Text>
          <Text style={{ color: skin.color, fontSize:9, fontWeight:'700', letterSpacing:1.5, fontFamily:mono }}>MAP</Text>
        </TouchableOpacity>
      )}

      {/* Persistent mini-map HUD — "you are here" + one-tap hop to a neighbour zone (hidden in battle tab) */}
      {showTravel && (() => {
        const hereRoom = WORLD_MAP.find(r => r.id === currentRoomId);
        const here = (hereRoom?.skinId ?? currentRoomId.split('_')[0]) as SkinId;
        const neighbours = (GBA_ADJ[here] ?? []).filter(n => SKINS[n]).slice(0, 5);
        return (
          <View pointerEvents="box-none" style={{ position:'absolute', top:8, alignSelf:'center', alignItems:'center', gap:4, zIndex:20 }}>
            {neighbours.length > 0 && (
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:10, borderWidth:1, borderColor: skin.color + '55', backgroundColor:'rgba(0,0,0,0.55)' }}>
                  <Text style={{ fontSize:10, color: skin.color }}>{skin.glyph}</Text>
                  <Text style={{ color: skin.color, fontSize:8, fontWeight:'700', letterSpacing:1.2, fontFamily:mono }}>{skin.name}</Text>
                </View>
                {neighbours.map(n => {
                  const ns = SKINS[n];
                  return (
                    <TouchableOpacity key={n} onPress={() => onTravelTo(n)} activeOpacity={0.7}
                      style={{ width:26, height:26, borderRadius:13, borderWidth:1.5, borderColor: ns.color + '88', backgroundColor:'rgba(0,0,0,0.6)', alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ fontSize:12, color: ns.color }}>{ns.glyph}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })()}

      {/* Action row — 🔥 left · ENCOUNTER centre · ⚡ right */}
      <View style={{ position:'absolute', bottom:14, left:0, right:0, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 }} pointerEvents="box-none">
        {onBonfire && (
          <TouchableOpacity
            onPress={onBonfire}
            activeOpacity={0.8}
            style={{ width:40, height:40, borderRadius:20, borderWidth:1, borderColor: campfireActive ? '#FF7043' : 'rgba(255,255,255,0.18)', backgroundColor: campfireActive ? 'rgba(80,20,4,0.88)' : 'rgba(0,0,0,0.6)', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ fontSize:15 }}>🔥</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onEncounter}
          activeOpacity={0.85}
          style={{ flexDirection:'row', alignItems:'center', gap:7, paddingHorizontal:22, paddingVertical:11, borderRadius:24, borderWidth:1.5, borderColor:'#FF6644AA', backgroundColor:'rgba(40,8,4,0.85)', shadowColor:'#FF6644', shadowOpacity:0.5, shadowRadius:10, elevation:5 }}>
          <Text style={{ fontSize:15 }}>⚔</Text>
          <Text style={{ color:'#FF8866', fontSize:12, fontWeight:'800', letterSpacing:2.5, fontFamily:mono }}>ENCOUNTER</Text>
        </TouchableOpacity>
        {showTravel && (
          <TouchableOpacity
            onPress={onRandomZone}
            activeOpacity={0.7}
            style={{ width:40, height:40, borderRadius:20, borderWidth:1, borderColor:'rgba(255,255,255,0.25)', backgroundColor:'rgba(0,0,0,0.6)', alignItems:'center', justifyContent:'center' }}>
            <Text style={{ color:'rgba(255,255,255,0.8)', fontSize:15 }}>⚡</Text>
          </TouchableOpacity>
        )}
      </View>
      <RoomLabel name={currentRoom.name} visible={showRoomLabel} />

      {/* Side vignettes — depth framing */}
      <View style={{ position:'absolute', top:0, left:0, width:24, height:SCENE_H, backgroundColor:'#000000', opacity:0.12 }} pointerEvents="none" />
      <View style={{ position:'absolute', top:0, right:0, width:24, height:SCENE_H, backgroundColor:'#000000', opacity:0.12 }} pointerEvents="none" />
      {/* Bottom dark fade — grounding only, no colour */}
      <View style={{ position:'absolute', bottom:0, left:0, right:0, height:SCENE_H*0.10, backgroundColor:'#000000', opacity:0.35 }} pointerEvents="none" />


      {particleAnims.slice(0, stageParticleCount).map((anim, i) => {
        const yRange = mood === 'lit' ? [-80,-140] : mood === 'dormant' ? [-10,-30] : [-40,-90];
        return (
          <Animated.Text key={i} style={{ position:'absolute', bottom:SCENE_H*0.35+(i%3)*12, left:P_X[i]*SCREEN_W, fontSize:P_SZ[i], color,
            transform:[{ translateY: anim.interpolate({ inputRange:[0,1], outputRange:yRange }) }],
            opacity: anim.interpolate({ inputRange:[0,0.2,0.6,1], outputRange:[0, stageParticlePeak, stageParticlePeak*0.9, 0] }) }}>
            {particleGlyph}
          </Animated.Text>
        );
      })}


      {/* Companion — always centred */}
      <Animated.View style={{ position:'absolute', top: SCENE_H * 0.20, left: 0, right: 0, alignItems:'center', transform:[{translateY:bobY},{translateX:driftX}] }}>
        {/* Stage evolution glow — behind creature, bobs with it, invisible at stage 0, radiant at stage 5 */}
        {effectiveStage > 0 && (
          <Animated.View pointerEvents="none" style={{
            position:'absolute', top:20, alignSelf:'center',
            width:stageGlowSize, height:stageGlowSize, borderRadius:stageGlowSize/2,
            backgroundColor:color,
            opacity:glowAnim.interpolate({ inputRange:[0,1], outputRange:[stageGlowLo, stageGlowHi] }),
            zIndex:0,
          }} />
        )}
        {/* Ground sigil — subtle archetype ring, no shadow */}
        <View style={{ position:'absolute', bottom:-8, alignSelf:'center', width:110, height:18,
          borderRadius:55, borderWidth:1, borderColor:color+'33',
          backgroundColor:color+'06' }} />
        <TouchableOpacity
          onPress={(e) => {
            setTapPos({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
            setShowRipple(true);
            tapRipple.setValue(0);
            Animated.timing(tapRipple, { toValue: 1, duration: 550, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start(() => setShowRipple(false));
            onTap();
          }}
          activeOpacity={0.85}
        >
          {/* Tap ripple */}
          {showRipple && (
            <Animated.View pointerEvents="none" style={{
              position:'absolute', zIndex:10,
              top: tapPos.y - 40, left: tapPos.x - 40,
              width:80, height:80, borderRadius:40,
              borderWidth:1.5, borderColor: color,
              opacity: tapRipple.interpolate({ inputRange:[0,1], outputRange:[0.8,0] }),
              transform:[{ scale: tapRipple.interpolate({ inputRange:[0,1], outputRange:[0.3,2.2] }) }],
            }} />
          )}
          <Animated.View style={{ transform:[{scale:breathScale}], opacity:bodyOp, alignItems:'center', zIndex:1, marginLeft:18 }}>
            {/* Companion body — portrait image if available, SVG fallback */}
            <View style={{ width:130, height:190, overflow: 'visible' }}>
              {/* Spec overlay — aura, orbiting glyphs, core glow (behind creature) */}
              <CompanionSpecOverlay spec={companionSpec} color={color} stage={devStagePin !== null ? devStagePin : stage} />
              {/* Halo — rendered first, sits behind everything */}
              {(() => {
                const hItem = equippedHalo ? HALO_ITEMS.find(h => h.id === equippedHalo) : null;
                return hItem?.file ? (
                  <Image source={hItem.file as any}
                    style={{ position:'absolute', top:-82, left:-278, width:680, height:360, zIndex:0, opacity:0.75 }}
                    resizeMode="contain" />
                ) : null;
              })()}
              {/* Wings — in front of halo */}
              {(() => {
                const wItem = equippedWings ? WINGS_ITEMS.find(w => w.id === equippedWings) : null;
                return wItem?.file ? (
                  <Image source={wItem.file as any}
                    style={{ position:'absolute', top:-5, left:-95, width:320, height:275, zIndex:1, opacity:1.0 }}
                    resizeMode="contain" />
                ) : null;
              })()}
              {(() => {
                const s = devStagePin !== null ? devStagePin : stage;
                const stageKey = s <= 1 ? 1 : s <= 3 ? 2 : (s === 5 && skin.id === 'lycheetah') ? 5 : 3;
                const rosterVariant = equippedCompanionSkin
                  ? COMPANION_ROSTER.flatMap(c => c.variants).find(v => v.key === equippedCompanionSkin)
                  : null;
                if (rosterVariant) return <Image source={rosterVariant.art} style={{ width:130, height:190, zIndex:2 }} resizeMode="contain" />;
                const zoneImg = ZONE_COMPANION_IMAGES[`${equippedCompanionSkin ?? skin.id}_${stageKey}`]
                  ?? (equippedCompanionSkin ? ZONE_COMPANION_IMAGES[equippedCompanionSkin as keyof typeof ZONE_COMPANION_IMAGES] : undefined);
                if (zoneImg) return <Image source={zoneImg} style={{ width:130, height:190, zIndex:2 }} resizeMode="contain" />;
                const ck = `${archetype.id}_${s}`;
                const imgSrc = COMPANION_IMAGES[ck];
                const jsonSpec = (COMPANIONS_DATA as Record<string, CompanionVisualSpec>)[ck];
                if (imgSrc) return <Image source={imgSrc} style={{ width:130, height:190, zIndex:2 }} resizeMode="contain" />;
                if (jsonSpec) return <CompanionRenderer spec={jsonSpec} />;
                return <CreatureSvg archId={archetype.id} stage={s as EvolutionStage} color={color} path={evoPath} />;
              })()}
              {/* Gear overlays */}
              {(['cape','body','mantle','crown'] as GearSlot[]).map(slot => {
                const g = slot === 'cape' ? gearCape : slot === 'body' ? gearBody : slot === 'mantle' ? gearMantle : gearCrown;
                const img = g.threshold > 0 ? getGearImage(slot, g.name) : null;
                return img ? <Image key={slot} source={img} style={{ position:'absolute', top:0, left:0, width:130, height:190, zIndex:3 }} resizeMode="contain" /> : null;
              })}
              {/* Pet — bottom-right of character */}
              {(() => {
                const pItem = equippedPet ? PET_ITEMS.find(p => p.id === equippedPet) : null;
                return pItem?.file ? (
                  <Image source={pItem.file as any}
                    style={{ position:'absolute', bottom:-10, right:-55, width:90, height:90, zIndex:4 }}
                    resizeMode="contain" />
                ) : null;
              })()}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      {/* Ground shadow */}
      <Animated.View style={{
        position:'absolute', bottom:54, alignSelf:'center',
        width:72, height:10, borderRadius:36,
        backgroundColor:'#000000',
        opacity:shadowOp,
        transform:[{scaleX:shadowScaleX}],
      }} />

      <View style={{ position:'absolute', bottom:48, left:0, right:0, alignItems:'center' }}>
        <View style={{ width:SCREEN_W*0.85, height:1, backgroundColor:'#FFFFFF', opacity:0.18, borderRadius:1 }} />
        <View style={{ width:SCREEN_W*0.6, height:1, backgroundColor:'#FFFFFF', opacity:0.08, marginTop:2, borderRadius:1 }} />
        <Text style={{ color, fontSize:12, fontFamily:mono, letterSpacing:2, opacity:0.75, marginTop:6 }}>{STAGES[stage].ground}</Text>
      </View>

      {/* HUD — top strip: name / stage / HP */}
      <View style={{ position:'absolute', top:8, left:10, right:10, flexDirection:'row', alignItems:'flex-start', zIndex:5, gap:6 }} pointerEvents="none">
        <View style={{ flex:1 }}>
          <Text style={{ color, fontSize:11, fontFamily:mono, letterSpacing:2, fontWeight:'700', textShadowColor:'#000000', textShadowOffset:{width:0,height:1}, textShadowRadius:6 }} numberOfLines={1}>
            {companionName || skin.name}
          </Text>
        </View>
        <View style={{ alignItems:'flex-end', gap:3, marginTop:20 }}>
          <Text style={{ color: battleHP < battleMaxHP * 0.25 ? '#FF6644' : '#44FF88', fontSize:8, fontFamily:mono, fontWeight:'700', textShadowColor:'#000000', textShadowRadius:4 }}>
            {battleHP}<Text style={{ color:'#334455', fontSize:7 }}>/{battleMaxHP}</Text>
          </Text>
          <View style={{ width:70, height:4, backgroundColor:'#0A180A', borderRadius:3, overflow:'hidden' }}>
            <View style={{ height:4, width:`${Math.round((battleHP / Math.max(1, battleMaxHP)) * 100)}%` as any,
              backgroundColor: battleHP < battleMaxHP * 0.25 ? '#FF4444' : battleHP < battleMaxHP * 0.55 ? '#FFAA22' : '#44FF88', borderRadius:3 }} />
          </View>
        </View>
      </View>

      <Animated.View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:color, opacity:victoryFlash }} />


      <RoomLore lore={roomLore} loreAnim={roomLoreAnim} color={color} onPress={onDismissLore} />

      {phrase && (
        <TouchableOpacity activeOpacity={0.85} onPress={onDismissPhrase} style={{ position:'absolute', bottom:72, left:20, right:20 }}>
          <Animated.View style={{ opacity:phraseAnim, padding:14, borderRadius:14, borderWidth:1, borderTopWidth:2, borderColor:archetype.accentColor+'44', borderTopColor:archetype.accentColor+'99', backgroundColor:'#000000DD', alignItems:'center' }}>
            <Text style={{ color:'#FFFFFF', fontSize:14, fontStyle:'italic', textAlign:'center', lineHeight:22 }}>{phrase}</Text>
            <Text style={{ color:archetype.accentColor, fontSize:8, fontFamily:mono, letterSpacing:2, marginTop:6, opacity:0.7 }}>{archetype.name} · tap to dismiss</Text>
          </Animated.View>
        </TouchableOpacity>
      )}
    </View>
  );
}


// Arrow sub-components
const ARROW_GLYPHS: Record<Direction, string> = { up:'↑', down:'↓', left:'←', right:'→' };
const ArrowBtn = ({ direction, onPress, locked }: { direction: Direction; onPress: () => void; locked: boolean }) => {
  const size = 40;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{ width:size, height:size, borderRadius:size/2,
        borderWidth:1, borderColor: locked ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.25)',
        backgroundColor:'rgba(0,0,0,0.52)',
        alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color: locked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.92)', fontSize:17 }}>
        {locked ? '◌' : ARROW_GLYPHS[direction]}
      </Text>
    </TouchableOpacity>
  );
};
const RoomLabel = ({ name, visible }: { name: string; visible: boolean }) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) Animated.sequence([
      Animated.timing(fade, { toValue:1, duration:350, useNativeDriver:true }),
      Animated.delay(1800),
      Animated.timing(fade, { toValue:0, duration:500, useNativeDriver:true }),
    ]).start();
  }, [visible, name]);
  return (
    <Animated.View pointerEvents="none" style={{ position:'absolute', bottom:52, alignSelf:'center', opacity:fade, backgroundColor:'rgba(0,0,0,0.6)', paddingHorizontal:14, paddingVertical:5, borderRadius:8 }}>
      <Text style={{ color:'#FFFFFF', fontSize:11, letterSpacing:2, fontFamily:'monospace' }}>{name}</Text>
    </Animated.View>
  );
};

// Room lore — appears briefly after entering a new room
const RoomLore = ({ lore, loreAnim, color, onPress }: { lore: string | null; loreAnim: Animated.Value; color: string; onPress: () => void }) => {
  if (!lore) return null;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ position:'absolute', bottom:130, left:20, right:20, zIndex:20 }}>
      <Animated.View style={{ opacity:loreAnim, padding:12, borderRadius:12, borderWidth:1, borderTopWidth:2, borderColor:color+'44', borderTopColor:color+'88', backgroundColor:'#000000CC', alignItems:'center' }}>
        <Text style={{ color, fontSize:9, fontFamily:'monospace', letterSpacing:3, marginBottom:4, opacity:0.7 }}>◈</Text>
        <Text style={{ color:'#FFFFFF', fontSize:12, fontStyle:'italic', textAlign:'center', lineHeight:18 }}>{lore}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Battle visual sub-components (from session 10)
function LootFloat({ visible, color, onDone }: { visible: boolean; color: string; onDone: () => void }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    translateY.setValue(0); opacity.setValue(1);
    Animated.parallel([
      Animated.timing(translateY, { toValue:-80, duration:1200, useNativeDriver:true }),
      Animated.timing(opacity,    { toValue:0,   duration:1200, useNativeDriver:true }),
    ]).start(() => onDone());
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={{ position:'absolute', top:60, flexDirection:'row', alignItems:'center', zIndex:10, transform:[{translateY}], opacity }}>
      <Text style={{ color, fontSize:20, fontWeight:'700' }}>✦</Text>
      <Text style={{ color, fontSize:14, fontWeight:'700', letterSpacing:2 }}> RELIC</Text>
    </Animated.View>
  );
}
function WaveDots({ wave, color }: { wave: number; color: string }) {
  const pos = ((wave - 1) % 5) + 1;
  return (
    <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
      <Text style={{ fontSize:10, fontWeight:'700', letterSpacing:1.5, color:'#8A86A0', marginRight:6, fontFamily:'monospace' }}>WAVE </Text>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={{ fontSize:14, marginRight:3, color: i <= pos ? color : color+'44' }}>
          {i <= pos ? '◉' : '○'}
        </Text>
      ))}
    </View>
  );
}
function EnemyGlyphArt({ glyph, color }: { glyph: string; color: string }) {
  return (
    <View style={{ alignItems:'center', marginBottom:12 }}>
      {[
        [' ', glyph, ' '],
        [glyph, glyph, glyph],
        [' ', glyph, ' '],
      ].map((row, ri) => (
        <View key={ri} style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', height:36 }}>
          {row.map((g, ci) => (
            <Text key={ci} style={{ fontSize: ci===1 ? 28 : 18, width: ci===1 ? 40 : 32, textAlign:'center', color }}>
              {g}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function CompanionScreen() {
  const router = useRouter();

  const [totalDives,    setTotalDives]    = useState(0);
  // Dive-currency: totalDives + bonusCoins (ventures/test) - diveSpent = available ✦
  const [diveSpent,     setDiveSpent]     = useState(0);
  const [bonusCoins,    setBonusCoins]    = useState(0);
  const [unlockedCompanions, setUnlockedCompanions] = useState<Set<string>>(new Set());
  const diveCoins = Math.max(0, totalDives + bonusCoins - diveSpent);
  const [modeCounts,    setModeCounts]    = useState<Record<AlchemicalMode, number>>({ NIGREDO: 0, ALBEDO: 0, CITRINITAS: 0, RUBEDO: 0 });
  const [divesThisWeek, setDivesThisWeek] = useState(0);
  const [avgLQ,         setAvgLQ]         = useState(0);
  const [streak,        setStreak]        = useState(0);
  const [vigilName,     setVigilName]     = useState<string | null>(null);
  const [relics,        setRelics]        = useState<string[]>([]);
  const [mood,          setMood]          = useState<CompanionMood>('present');
  const [stage,         setStage]         = useState<EvolutionStage>(0);
  const [xp,            setXP]            = useState(0);
  const [phrase,        setPhrase]        = useState<string | null>(null);
  const [voicePool,     setVoicePool]     = useState<string[]>([]);   // cached batch of fresh, character+study-aware lines
  const voiceGenRef = useRef(false);
  const [showRelics,    setShowRelics]    = useState(false);
  const [showLore,      setShowLore]      = useState(false);
  const [showBattle,    setShowBattle]    = useState(false);
  const [showGear,      setShowGear]      = useState(false);
  const [showNeeds,     setShowNeeds]     = useState(false);
  const [newRelic,      setNewRelic]      = useState<typeof RELIC_POOL[0] | null>(null);
  // DEV ONLY — remove before shipping
  const [devStagePin,   setDevStagePin]   = useState<EvolutionStage | null>(null);

  const [activeSkin,       setActiveSkin]       = useState<SkinId>('solform');
  const [archetypeId,      setArchetypeId]      = useState<ArchetypeId>('archivist');

  // World map navigation
  const [currentRoomId,  setCurrentRoomId]  = useState<string>('solform_0');
  const [visitedRooms,   setVisitedRooms]   = useState<Set<string>>(new Set(['solform_0']));
  const [showRoomLabel,  setShowRoomLabel]  = useState(false);
  const sceneFade = useRef(new Animated.Value(1)).current;
  const [roomLore,       setRoomLore]       = useState<string | null>(null);
  const roomLoreAnim = useRef(new Animated.Value(0)).current;
  const [showArchSelect,   setShowArchSelect]   = useState(false);
  const [flashAnims] = useState(() =>
    Object.fromEntries(ARCHETYPE_IDS.map(id => [id, new Animated.Value(0)]))
  );

  const [companionName, setCompanionName] = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [nameDraft,     setNameDraft]     = useState('');

  // Prefer the user's custom name, then the archetype identity (THE ARCHIVIST, etc.),
  // then the skin name. COMPANION_LORE names are zone entities, not the user's companion.
  const displayName = companionName || ARCHETYPES[archetypeId]?.name || SKINS[activeSkin]?.name || '';

  // Load this character's cached voice pool (persists the batch of fresh lines across sessions).
  useEffect(() => {
    AsyncStorage.getItem(`sol_voice_pool_${archetypeId}`).then(raw => {
      if (raw) { try { const arr = JSON.parse(raw); if (Array.isArray(arr)) setVoicePool(arr); } catch {} }
    });
  }, [archetypeId]);

  const [quests,    setQuests]    = useState<Quest[]>([]);
  const [questData, setQuestData] = useState<QuestData>({ divesToday:0, journalToday:false, libraryToday:false, vigilActive:false, totalDives:0, divesThisWeek:0 });

  const [hunger,       setHunger]       = useState(0);
  const [wisdom,       setWisdom]       = useState(0);
  const [energy,       setEnergy]       = useState(1);
  const [companionHP,  setCompanionHP]  = useState(100);

  const [battle,         setBattle]        = useState<BattleState | null>(null);
  const [attackPower,    setAttackPower]   = useState(10);
  const [playerStats,    setPlayerStats]   = useState<PlayerStats>({ atk:10, def:10, spd:10, wil:10, lck:10, vit:12, res:10 });
  const [activeTab,      setActiveTab]     = useState<'talk'|'companion'|'world'|'battle'|'gear'>('talk');
  const [tabPopup,       setTabPopup]      = useState<string|null>(null);
  const [seenTabs,       setSeenTabs]      = useState<Set<string>>(new Set());
  const [coins,            setCoins]            = useState(0);
  const [veras,            setVeras]            = useState(0);
  const [shopSections, setShopSections] = useState<Record<string, boolean>>({ halos:false, wings:false, pets:false, secrets:false });
  const toggleShopSection = (k: string) => setShopSections(s => ({ ...s, [k]: !s[k] }));
  const [battleWins,       setBattleWins]       = useState(0);
  const [purchasedZones,   setPurchasedZones]   = useState<string[]>([]);
  const [shopUnlocks,      setShopUnlocks]      = useState<string[]>([]);
  const [earnedWeapons,    setEarnedWeapons]    = useState<string[]>([]);
  const [equippedWeaponId, setEquippedWeaponId] = useState<string | null>(null);
  const [tabMinimized,   setTabMinimized]  = useState(false);
  const [showFirstEncounter, setShowFirstEncounter] = useState(false);
  const firstEncounterAnim = useRef(new Animated.Value(0)).current;

  // Section collapse state — companion tab
  const [battleCinemaOpen, setBattleCinemaOpen] = useState(false);
  const [battleDialogueOn, setBattleDialogueOn] = useState(false);
  const [companionBattleLine, setCompanionBattleLine] = useState('');
  const [heroCollapsed,    setHeroCollapsed]    = useState(true);
  const [companionGridCollapsed, setCompanionGridCollapsed] = useState(true);
  const [rosterExpanded,        setRosterExpanded]         = useState<string|null>(null);
  const [rosterTierFilter,      setRosterTierFilter]       = useState<string>('ALL');
  const [archetypeCollapsed, setArchetypeCollapsed] = useState(true);
  const [specialsCollapsed, setSpecialsCollapsed] = useState(true);
  const [worldCollapsed,   setWorldCollapsed]   = useState(false);
  const [worldOriginOpen,  setWorldOriginOpen]  = useState(true);
  const [worldCrystalOpen,  setWorldCrystalOpen]  = useState(false);
  const [worldChaosOpen,    setWorldChaosOpen]    = useState(false);
  const [worldSanctumOpen,  setWorldSanctumOpen]  = useState(false);
  const [worldElementalOpen,setWorldElementalOpen]= useState(false);
  const [worldDimOpen,      setWorldDimOpen]      = useState(false);
  const [worldLandscapeOpen,setWorldLandscapeOpen]= useState(false);
  const [worldBattleOpen,  setWorldBattleOpen]  = useState(false);
  const [worldShopOpen,    setWorldShopOpen]    = useState(false);
  const [worldSecretOpen,  setWorldSecretOpen]  = useState(false);
  const [gbaMapOpen,        setGbaMapOpen]        = useState(false);
  const [worldArcaneOpen,  setWorldArcaneOpen]  = useState(false);
  const [worldMysticOpen,  setWorldMysticOpen]  = useState(false);
  const [worldFrontierOpen,setWorldFrontierOpen]= useState(false);
  const [loadoutCollapsed, setLoadoutCollapsed] = useState(true);
  const [bonusCollapsed,   setBonusCollapsed]   = useState(true);
  // Skill tree
  const [unlockedNodes,    setUnlockedNodes]    = useState<string[]>(['awakening']);
  const [justUnlockedId,   setJustUnlockedId]   = useState<string | null>(null);
  const unlockPulseAnim = useRef(new Animated.Value(0)).current;
  const [skillTokenBonus,  setSkillTokenBonus]  = useState(0);
  const [selectedNode,     setSelectedNode]     = useState<string | null>(null);
  const [treeCollapsed,    setTreeCollapsed]    = useState(false);
  // Section collapse state — bond tab
  const [inventoryCollapsed, setInventoryCollapsed] = useState(true);
  const [nourishCollapsed, setNourishCollapsed] = useState(true);
  const [relicsCollapsed,  setRelicsCollapsed]  = useState(true);
  const [loreCollapsed,    setLoreCollapsed]    = useState(true);
  const [codexCollapsed,   setCodexCollapsed]   = useState(true);
  // Section collapse state — field tab
  const [statsCollapsed,   setStatsCollapsed]   = useState(true);
  const [domainsCollapsed, setDomainsCollapsed] = useState(true);
  const [fieldNoteCollapsed, setFieldNoteCollapsed] = useState(true);
  const [invFilter,      setInvFilter]     = useState<'all'|'common'|'uncommon'|'rare'|'epic'>('all');
  const [invExpanded,    setInvExpanded]   = useState<string | null>(null);
  const [loreCodex,      setLoreCodex]     = useState<Array<{id:string; enemy:string; text:string; date:string; type:'enemy'|'loot'}>>([]);
  const [tokensLeft,     setTokensLeft]    = useState(3);
  const [attackAnim,     setAttackAnim]    = useState(false);
  const [spellMenuOpen,  setSpellMenuOpen] = useState(false);
  const [itemMenuOpen,   setItemMenuOpen]  = useState(false);
  const [lootFloatVisible, setLootFloatVisible] = useState(false);
  const [haloOpen,  setHaloOpen]  = useState(false);
  const [wingsOpen, setWingsOpen] = useState(false);
  const [petOpen,   setPetOpen]   = useState(false);
  const [bgOpen,    setBgOpen]    = useState(false);

  const [fieldNote,        setFieldNote]        = useState<string | null>(null);
  const [fieldNoteLoading, setFieldNoteLoading] = useState(false);

  const [dailyFoods,   setDailyFoods]   = useState<FoodItem[]>([]);
  const [fedToday,     setFedToday]     = useState<string[]>([]);
  const [eating,       setEating]       = useState(false);
  const [recentDives,  setRecentDives]  = useState<Array<{ subjectName: string; domainLabel: string }>>([]);
  const [lqHistory,    setLqHistory]    = useState<number[]>([]);
  const [diveLog,      setDiveLog]      = useState<Array<{ date: string; subjectName?: string; domainLabel?: string }>>([]);
  const [inventory,    setInventory]    = useState<string[]>([]);
  const [uploadedDoc,  setUploadedDoc]  = useState<{ name: string; excerpt: string; date: string } | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const phraseAnim      = useRef(new Animated.Value(0)).current;
  const relicAnim       = useRef(new Animated.Value(0)).current;
  const freshDiveRef    = useRef<{ subjectName: string; domainLabel: string } | null>(null);
  const xpPopAnim       = useRef(new Animated.Value(0)).current;
  const entityShakeAnim = useRef(new Animated.Value(0)).current;
  const enemyHitFlash   = useRef(new Animated.Value(0)).current;
  const playerHitFlash  = useRef(new Animated.Value(0)).current;
  const playerHealFlash = useRef(new Animated.Value(0)).current;
  const hpShimmerAnim   = useRef(new Animated.Value(0)).current;
  const screenFlashAnim = useRef(new Animated.Value(0)).current;
  const [xpPop, setXpPop] = useState<string | null>(null);

  const [showStatModal,   setShowStatModal]   = useState(false);
  const [isSovereign,    setIsSovereign]     = useState(false);
  const [showNamingRitual,  setShowNamingRitual]  = useState(false);
  const [milestone,        setMilestone]         = useState<{ glyph:string; title:string; body:string } | null>(null);
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const [evolutionCeremony, setEvolutionCeremony] = useState<{ stage: EvolutionStage } | null>(null);
  const ceremonyAnim = useRef(new Animated.Value(0)).current;
  const [showCompanionIntro, setShowCompanionIntro] = useState(false);
  const [showSummonCeremony, setShowSummonCeremony] = useState(false);
  const [summonPhase, setSummonPhase] = useState<0 | 1 | 2>(0);
  const summonAnim = useRef(new Animated.Value(0)).current;
  const [lamagueSt,  setLamagueSt]  = useState<string | null>(null);
  const [liveLore,   setLiveLore]   = useState<{ text: string; subject: string; date: string }[]>([]);
  const [companionSpec, setCompanionSpec] = useState<CompanionSpec>(DEFAULT_SPEC);

  // ── Per-companion levels + stat points (#265) — each companion is YOUR build ──
  // XP accrues to whichever companion is active when you dive. Level grants points to spend.
  const [companionXP, setCompanionXP]       = useState<Record<string, number>>({});
  const [companionAlloc, setCompanionAlloc] = useState<Record<string, Partial<PlayerStats>>>({});
  const STAT_KEYS: (keyof PlayerStats)[] = ['atk','def','spd','wil','lck','vit','res'];
  const STAT_LABELS: Record<keyof PlayerStats, string> = { atk:'ATK', def:'DEF', spd:'SPD', wil:'WIL', lck:'LCK', vit:'VIT', res:'RES' };
  const POINTS_PER_LEVEL = 2;
  const XP_PER_LEVEL = 100;
  const levelFromXP = (xp: number) => Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
  const allocSpent  = (a?: Partial<PlayerStats>) => a ? STAT_KEYS.reduce((s,k)=>s+(a[k]??0),0) : 0;
  const pointsFree   = (sid: string) => levelFromXP(companionXP[sid] ?? 0) * POINTS_PER_LEVEL - allocSpent(companionAlloc[sid]);

  const spendPoint = useCallback(async (sid: string, stat: keyof PlayerStats) => {
    if (pointsFree(sid) <= 0) return;
    setCompanionAlloc(prev => {
      const cur = { ...(prev[sid] ?? {}) };
      cur[stat] = (cur[stat] ?? 0) + 1;
      const next = { ...prev, [sid]: cur };
      AsyncStorage.setItem('sol_companion_alloc', JSON.stringify(next)).catch(() => {});
      return next;
    });
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [companionXP, companionAlloc]);

  // ── Living Chronicle (#264) — lore that GROWS from the user's real journey ──
  const [chronicle, setChronicle] = useState<{ ts: number; glyph: string; text: string; isSynthesis?: boolean }[]>([]);
  const synthesisTriggeredRef = useRef<Set<number>>(new Set());

  const addChronicle = useCallback(async (glyph: string, text: string) => {
    setChronicle(prev => {
      // De-dupe identical consecutive entries; cap at 80 most-recent.
      if (prev[0]?.text === text) return prev;
      const next = [{ ts: Date.now(), glyph, text }, ...prev].slice(0, 80);
      AsyncStorage.setItem('sol_chronicle', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Every 5 real entries, weave a synthesis — the chronicle takes notice of its own pattern.
  const generateChronicleSynthesis = useCallback(async (entries: { glyph: string; text: string }[]) => {
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return;
      const snippet = entries.map(e => `${e.glyph} ${e.text}`).join('\n');
      const result = await sendMessage(
        [{ role: 'user', content: `You are a mythic narrator for the Sovereign Sol universe. Based on these journal events from one seeker's journey, write one evocative sentence — a synthesis that feels like the universe is noticing a pattern forming. No preamble, no explanation, just the sentence.\n\n${snippet}` }] as any,
        '', key, model as any, undefined, 'normal', 80,
      );
      const synthesis = result.text?.trim();
      if (!synthesis) return;
      setChronicle(prev => {
        const next = [{ ts: Date.now(), glyph: '⊚', text: synthesis, isSynthesis: true }, ...prev].slice(0, 80);
        AsyncStorage.setItem('sol_chronicle', JSON.stringify(next)).catch(() => {});
        return next;
      });
    } catch {}
  }, []);

  useEffect(() => {
    const real = chronicle.filter(e => !e.isSynthesis);
    const len = real.length;
    if (len >= 5 && len % 5 === 0 && !synthesisTriggeredRef.current.has(len)) {
      synthesisTriggeredRef.current.add(len);
      generateChronicleSynthesis(real.slice(0, 5));
    }
  }, [chronicle.length]);

  // ── Tarot ──────────────────────────────────────────────────────────────────
  const [tarotDraw,    setTarotDraw]    = useState<{ name:string; glyph:string; reversed:boolean }[] | null>(null);
  const [tarotReading, setTarotReading] = useState<string | null>(null);
  const [tarotLoading, setTarotLoading] = useState(false);

  // ── Venture (D&D session) state ─────────────────────────────────────────────
  const [ventureActive,      setVentureActive]      = useState(false);
  const [venturePhase,       setVenturePhase]       = useState<'loading'|'beat'|'resolve'|'skill'|'dice'>('loading');
  const [ventureNarrative,   setVentureNarrative]   = useState('');
  const [ventureChoices,     setVentureChoices]     = useState<{label:string;type:'explore'|'risk'|'wisdom'}[]>([]);
  const [ventureBeatNum,     setVentureBeatNum]     = useState(0);
  const [ventureLog,         setVentureLog]         = useState<string[]>([]);
  const [ventureReward,      setVentureReward]      = useState<{coins:number;msg:string}|null>(null);
  const [ventureLoading,     setVentureLoading]     = useState(false);
  const [ventureSkillCheck,  setVentureSkillCheck]  = useState<{ question:string; options:string[]; correct:number } | null>(null);
  const [ventureSkillPending,setVentureSkillPending]= useState<{ choice:{label:string;type:string}; log:string[]; beatNum:number } | null>(null);
  const [ventureSkillBonus,  setVentureSkillBonus]  = useState(0);
  const [ventureDiceRoll,    setVentureDiceRoll]    = useState<number | null>(null);
  const [ventureDiceSettled, setVentureDiceSettled] = useState(false);
  const [ventureDiceDisplay, setVentureDiceDisplay] = useState(1);
  // Campaign — persistent long-form venture slots
  type CampaignSlot = { skinId:SkinId; name:string; chapter:number; log:string[]; narrative:string; choices:{label:string;type:string}[]; phase:'beat'|'resolve'; skillBonus:number; reward:{coins:number;msg:string}|null; started:string; lastPlayed:string; complete:boolean; };
  const [campaignSlots,      setCampaignSlots]      = useState<(CampaignSlot|null)[]>([null,null,null]);
  const [showCampaignSelect, setShowCampaignSelect] = useState(false);
  const [activeCampaignIdx,  setActiveCampaignIdx]  = useState<number|null>(null);
  const [isCampaignMode,     setIsCampaignMode]     = useState(false);
  const isCampaignRef = useRef(false);
  const ventureScrollRef = useRef<any>(null);

  // ── AI Talk panel ──────────────────────────────────────────────────────────
  const [showTalk,    setShowTalk]    = useState(false);
  const [talkInput,    setTalkInput]    = useState('');
  const [talkHistory,  setTalkHistory]  = useState<{ role: 'user'|'companion'; text: string }[]>([]);
  const [talkLoading,  setTalkLoading]  = useState(false);
  const [invokeMode,   setInvokeMode]   = useState(false);
  const [invokePhrase, setInvokePhrase] = useState('');
  const talkScrollRef = useRef<any>(null);
  const [auraMode, setAuraMode] = useState(false);
  const [campfireMode, setCampfireMode] = useState<false|'auto'|'exchange'|'lore'>(false);
  const [campfireOpen, setCampfireOpen] = useState(false);
  const [talkFullscreen, setTalkFullscreen] = useState(false);
  const talkCancelRef = useRef(false);
  const talkSlideAnim = useRef(new Animated.Value(0)).current;
  const summonChoiceAnim = useRef(new Animated.Value(0)).current;
  const [dreamFragment, setDreamFragment] = useState<{ domain: string; glyph: string; color: string; text: string } | null>(null);
  const [companionLoreModal,    setCompanionLoreModal]    = useState<SkinId | null>(null);
  const [readingSecret,         setReadingSecret]         = useState<LycheetahSecret | null>(null);
  const [equippedCompanionSkin, setEquippedCompanionSkin] = useState<SkinId | null>(null);
  const [equippedHalo,  setEquippedHalo]  = useState<string | null>(null);
  const [equippedWings, setEquippedWings] = useState<string | null>(null);
  const [equippedPet,   setEquippedPet]   = useState<string | null>(null);
  const [equippedBg,    setEquippedBg]    = useState<string | null>(null);
  const [cosmeticsCollapsed, setCosmeticsCollapsed] = useState(true);
  const dreamAnim = useRef(new Animated.Value(0)).current;
  const [evoPath,           setEvoPath]           = useState<EvoPath | null>(null);
  const [showPathCeremony,  setShowPathCeremony]  = useState(false);
  const [companionFilter,   setCompanionFilter]   = useState<RarityTier | 'ALL'>('ALL');
  const [battleMinimized,   setBattleMinimized]   = useState(false);
  const [questsCollapsed,   setQuestsCollapsed]   = useState(false);
  const [battleFocusCharged, setBattleFocusCharged] = useState(false);
  // ── VOID BOSS (#273) — study-to-win ──
  const [activeBoss,        setActiveBoss]        = useState<VoidBoss | null>(null);
  const [bossEncroach,      setBossEncroach]      = useState(0);     // 0–100, fills = repelled
  const [bossHP,            setBossHP]            = useState(0);
  const [bossSpellReady,    setBossSpellReady]    = useState(false); // true once the bound dive is done
  const [bossDefeated,      setBossDefeated]      = useState<string[]>([]);
  const [bossPhase,         setBossPhase]         = useState<'fight' | 'repelled' | 'victory'>('fight');
  const [autoMode,          setAutoMode]          = useState(false);
  const [menagerie,         setMenagerie]         = useState<Array<{ name: string; date: string; zone: string }>>([]);
  const [menagerieCollapsed, setMenagerieCollapsed] = useState(false);
  // ── PARTY (#260) — up to 3 captured creatures auto-assist your strikes ──
  const [party, setParty] = useState<string[]>([]);  // creature names, max 3
  const PARTY_MAX = 3;
  // A creature's assist damage = its enemy ATK stat × a study-depth multiplier (LQ-scaled).
  const partyAssistFor = useCallback((name: string) => {
    const def = getEnemyDef(name);
    const depthMult = 0.5 + avgLQ * 0.6;   // 0.5 → 1.1 as your study deepens
    return Math.max(2, Math.round(def.atk * 0.45 * depthMult));
  }, [avgLQ]);
  const partyAssistTotal = useCallback(() => party.reduce((s, n) => s + partyAssistFor(n), 0), [party, partyAssistFor]);
  const toggleParty = useCallback(async (name: string) => {
    setParty(prev => {
      let next: string[];
      if (prev.includes(name)) next = prev.filter(n => n !== name);
      else if (prev.length >= PARTY_MAX) { showToast(`Party is full (${PARTY_MAX})`); return prev; }
      else next = [...prev, name];
      AsyncStorage.setItem('sol_party', JSON.stringify(next)).catch(() => {});
      return next;
    });
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  const pathCeremonyAnim = useRef(new Animated.Value(0)).current;
  const scrollRef  = useRef<any>(null);
  const feedY      = useRef(0);
  const battleY    = useRef(0);
  const loreY      = useRef(0);

  const navigateRoom = useCallback((direction: Direction) => {
    const current = getRoomById(currentRoomId);
    if (!current) return;
    const effectiveStage = devStagePin ?? stage;
    const step = (direction === 'right' || direction === 'down') ? 1 : -1;
    let idx = getSkinIndex(current.skinId);
    let target: SceneRoom | undefined;
    // Skip locked zones — advance until we find one we can enter (max full loop)
    for (let i = 0; i < SKIN_ORDER.length; i++) {
      idx = (idx + step + SKIN_ORDER.length) % SKIN_ORDER.length;
      const candidate = getRoomInSkin(SKIN_ORDER[idx], 0);
      if (!candidate) continue;
      if (candidate.unlockStage > effectiveStage) continue;
      const lock = getSkinUnlockStatus(candidate.skinId as SkinId, totalDives, isSovereign, battleWins, purchasedZones);
      if (lock.locked) continue;
      target = candidate;
      break;
    }
    if (!target) return;
    const t = target;
    Animated.timing(sceneFade, { toValue:0, duration:180, useNativeDriver:true }).start(() => {
      setCurrentRoomId(t.id);
      Animated.timing(sceneFade, { toValue:1, duration:350, useNativeDriver:true }).start();
    });
    setShowRoomLabel(true);
    setTimeout(() => setShowRoomLabel(false), 2600);
    const first = !visitedRooms.has(target.id);
    setVisitedRooms(prev => new Set([...prev, target!.id]));
    if (first) setTimeout(() => showToast(target!.description), 650);
    AsyncStorage.setItem('sol_current_room', target.id);
    // Show static lore immediately, replace with AI lore when it arrives
    const staticLore = target.description;
    roomLoreAnim.setValue(0);
    setRoomLore(staticLore);
    Animated.timing(roomLoreAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
    const loreTimer = setTimeout(() => {
      Animated.timing(roomLoreAnim, { toValue:0, duration:600, useNativeDriver:true }).start(() => setRoomLore(null));
    }, 5500);
    // Fire AI lore in background
    (async () => {
      try {
        const [key, model] = await Promise.all([getActiveKey(), getModel()]);
        if (!key) return;
        const result = await sendMessage(
          [{ role:'user', content:`I entered "${target!.name}" with my ${archetypeId} companion at stage ${stage}. One line of lore.` }],
          'You are a lore oracle for a learning app. Respond in ONE sentence. Atmospheric, strange, true. No preamble.',
          key, model as any, undefined, 'fast', 60,
        );
        if (result?.text?.trim()) setRoomLore(result.text.trim());
      } catch { /* keep static lore */ }
    })();
  }, [currentRoomId, stage, devStagePin, visitedRooms, sceneFade, totalDives, isSovereign, battleWins, purchasedZones]);

  const dismissLore = useCallback(() => {
    Animated.timing(roomLoreAnim, { toValue:0, duration:300, useNativeDriver:true }).start(() => setRoomLore(null));
  }, [roomLoreAnim]);

  const FIELD_FALLBACKS = [
    'Your pattern suggests depth over breadth — the companion is responding.',
    'Three domains in the last seven dives. The field is forming a shape.',
    `High-pressure study at ${STAGES[stage]?.name ?? 'this stage'} — the entropy you fight is real.`,
    'The dives are feeding something. It shows.',
    'Consistency is compounding. The creature knows.',
  ];

  const DOMAIN_GLYPH_MAP: Record<string,string> = { phi:'✦', log:'◈', alc:'◦', her:'⊹', mys:'◉', eth:'✧', math:'⊛', sci:'◉', hist:'◦', lang:'✧', art:'✦', code:'◈' };

  const getDomainGlyph = (domain: string): string => {
    const key = domain.toLowerCase().slice(0,3);
    return DOMAIN_GLYPH_MAP[key] ?? DOMAIN_GLYPH_MAP[domain] ?? '◦';
  };

  const generateFieldNote = useCallback(async () => {
    setFieldNoteLoading(true);
    const recentDomainList = recentDives.slice(-7).map(d => d.domainLabel ?? d.subjectName ?? 'unknown').join(', ') || 'various subjects';
    const fallback = FIELD_FALLBACKS[Math.floor(Math.random() * FIELD_FALLBACKS.length)];
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) { setFieldNote(fallback); return; }
      const result = await sendMessage(
        [{ role:'user', content:`Someone studied ${recentDomainList} recently and has LQ ${(avgLQ*100).toFixed(0)}% at ${STAGES[stage]?.name ?? 'unknown'} stage with a ${archetypeId} companion. Give one sentence of insight.` }],
        'You are a wise field observer in a learning app. Respond in exactly one sentence. No quotes. No fluff.',
        key, model as any, undefined, 'fast', 80,
      );
      setFieldNote(result?.text?.trim() ?? fallback);
    } catch {
      setFieldNote(fallback);
    } finally {
      setFieldNoteLoading(false);
    }
  }, [recentDives, avgLQ, stage, archetypeId]);

  const getLockStatus = useCallback((direction: Direction): boolean => {
    const current = getRoomById(currentRoomId);
    if (!current) return true;
    const effectiveStage = devStagePin ?? stage;
    const skinIndex = getSkinIndex(current.skinId);
    // Left/right: explore rooms within current zone — always unlocked (3 rooms per zone)
    if (direction === 'left' || direction === 'right') return false;
    let target: SceneRoom | undefined;
    if (direction === 'up') { const ns = SKIN_ORDER[(skinIndex + 1) % SKIN_ORDER.length]; target = getRoomInSkin(ns, 0); }
    else { const ps = SKIN_ORDER[(skinIndex - 1 + SKIN_ORDER.length) % SKIN_ORDER.length]; target = getRoomInSkin(ps, 0); }
    return !target || target.unlockStage > effectiveStage;
  }, [currentRoomId, stage, devStagePin]);

  useEffect(() => {
    const KEYS = ['battle','companion','bond','field','talk','shop'].map(t => `sol_tab_seen_${t}`);
    AsyncStorage.multiGet(KEYS).then(pairs => {
      const seen = new Set(pairs.filter(([,v]) => v === 'true').map(([k]) => k.replace('sol_tab_seen_','')));
      setSeenTabs(seen);
    }).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => {
      const keys = [
        'sol_dive_log','sanctum_lq_history','sol_vigil','sol_study_streak',
        'sol_companion_relics','sol_companion_name','sanctum_journal',
        'cascade_library_v3','sol_companion_skin','sol_companion_battle','sol_companion_fed',
        'sol_companion_archetype','sol_premium','sol_companion_named','sol_companion_path',
        'sol_lamague_state','sol_companion_live_lore','sol_inventory','sol_lore_codex',
        'sol_companion_spec','sol_battle_wins','sol_cosmetics','sol_equipped_skin','sol_menagerie','sol_party',
        'sol_coins','sol_veras','sol_shop_unlocks','sol_weapons','sol_equipped_weapon',
        'sol_zone_unlocks','sol_dive_spent','sol_bonus_coins','sol_unlocked_companions','sol_boss_defeated','sol_chronicle',
        'sol_companion_xp','sol_companion_alloc','sol_xp_last_total',
        'sol_fresh_dive','sol_campaigns',
      ];
      const vals = await AsyncStorage.multiGet(keys);
      const get  = (k: string) => vals.find(([key]) => key === k)?.[1] ?? null;

      const dives: Array<{date:string; subjectName?:string; domainLabel?:string; layer?:string}> = get('sol_dive_log') ? JSON.parse(get('sol_dive_log')!) : [];
      const mCounts: Record<AlchemicalMode, number> = { NIGREDO: 0, ALBEDO: 0, CITRINITAS: 0, RUBEDO: 0 };
      dives.forEach(d => { const m = layerToAlchemicalMode(d.layer); if (m) mCounts[m]++; });
      setModeCounts(mCounts);
      const now     = Date.now();
      const total   = dives.length;
      setRecentDives(dives.slice(0, 5).filter(d => d.subjectName).map(d => ({ subjectName: d.subjectName!, domainLabel: d.domainLabel || 'the unknown' })));
      // Fresh dive signal from School — triggers live study-reaction on companion greeting (#245)
      const freshRaw = get('sol_fresh_dive');
      if (freshRaw) {
        try {
          const fd = JSON.parse(freshRaw);
          if (fd?.subjectName && fd?.timestamp && (Date.now() - fd.timestamp) < 7_200_000) {
            freshDiveRef.current = { subjectName: fd.subjectName, domainLabel: fd.domainLabel || 'the unknown' };
            AsyncStorage.removeItem('sol_fresh_dive').catch(() => {});
          }
        } catch {}
      }
      const week    = dives.filter(d => new Date(d.date).getTime() > now - 7*86400000).length;
      const todayK  = todayDateKey();
      const today   = dives.filter(d => d.date?.startsWith(todayK)).length;

      const lqH: Array<{lq:number}> = get('sanctum_lq_history') ? JSON.parse(get('sanctum_lq_history')!) : [];
      const lqAvg = lqH.length > 0 ? lqH.slice(-7).reduce((s,p) => s+p.lq,0) / Math.min(lqH.length,7) : 0;
      setLqHistory(lqH.map(e => e.lq));
      setDiveLog(dives.slice(0, 10));

      const vigil = get('sol_vigil') ? JSON.parse(get('sol_vigil')!) : null;
      let streakVal = 0;
      const sRaw = get('sol_study_streak');
      if (sRaw) { try { const p = JSON.parse(sRaw); streakVal = p?.count ?? p ?? 0; } catch { streakVal = parseInt(sRaw)||0; } }

      const earned: string[] = get('sol_companion_relics') ? JSON.parse(get('sol_companion_relics')!) : [];
      const updated = [...earned];
      const award = (id: string, cond: boolean) => { if (cond && !updated.includes(id)) updated.push(id); };
      // ── CONTINUITY
      award('ember_3',       streakVal >= 3);
      award('streak_7',      streakVal >= 7);
      award('fortnight',     streakVal >= 14);
      award('streak_30',     streakVal >= 30);
      award('deep_habit',    streakVal >= 60);
      // ── DESCENT
      award('first_dive',    total >= 1);
      award('dive_10',       total >= 10);
      award('dive_50',       total >= 50);
      award('sovereign_100', total >= 100);
      award('sovereign_200', total >= 200);
      // ── STUDY
      const journal: Array<{date:string}> = get('sanctum_journal') ? JSON.parse(get('sanctum_journal')!) : [];
      const library: Array<{date:string}> = get('cascade_library_v3') ? JSON.parse(get('cascade_library_v3')!) : [];
      const studiedDomains = [...new Set(dives.map(d => d.domainLabel ?? d.subjectName).filter(Boolean))];
      award('first_study',   studiedDomains.length >= 1);
      award('five_domains',  studiedDomains.length >= 5);
      award('ten_domains',   studiedDomains.length >= 10);
      award('lq_70',         lqAvg >= 0.70);
      award('lq_90',         lqAvg >= 0.90);
      // ── LORE
      award('journaled',     journal.length >= 1);
      award('ten_journals',  journal.length >= 10);
      award('library_saved', library.length >= 10);
      // ── STAGE
      const stageNow = getStage(total);
      award('stage_seed',     stageNow >= 0);
      award('stage_awakened', stageNow >= 1);
      award('stage_initiate', stageNow >= 2);
      award('stage_adept',    stageNow >= 3);
      award('stage_sovereign',stageNow >= 4);
      // ── GEAR
      const crownTier  = getGear('crown',  total);
      const sigilTier  = getGear('sigil',  total);
      const mantleTier = getGear('mantle', total);
      const bodyTier   = getGear('body',   total);
      const capeTier   = getGear('cape',   total);
      award('first_gear',   crownTier.threshold > 0 || mantleTier.threshold > 0);
      award('gear_full',    crownTier.threshold > 0 && sigilTier.threshold > 0 && mantleTier.threshold > 0 && bodyTier.threshold > 0 && capeTier.threshold > 0);
      award('crown_tier3',  crownTier.threshold >= 50);
      award('sigil_seal',   sigilTier.threshold >= 75);
      award('all_gear_max', crownTier.threshold >= 100 && sigilTier.threshold >= 150 && mantleTier.threshold >= 200 && bodyTier.threshold >= 175 && capeTier.threshold >= 250);
      // ── COMBAT load check
      const winsLoaded = get('sol_battle_wins') ? parseInt(get('sol_battle_wins')!) : 0;
      award('first_blood',  winsLoaded >= 1);
      award('ten_battles',  winsLoaded >= 10);
      // ── VIGIL (event-based, handled separately)
      if (vigil?.daysCompleted >= 7 && !updated.includes('vigil_flame')) {
        updated.push('vigil_flame');
        setNewRelic(RELIC_POOL.find(r => r.id === 'vigil_flame')!);
      }
      if (updated.length !== earned.length) await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(updated));

      const lastDive  = dives.length > 0 ? dives[dives.length-1].date : null;
      const daysSince = lastDive ? Math.floor((now - new Date(lastDive).getTime())/86400000) : 999;
      let m: CompanionMood = 'present';
      if (lqAvg >= 0.85) m = 'transcendent';
      else if (week >= 5) m = 'lit';
      else if (daysSince >= 3) m = 'dormant';

      const cosmeticsRaw = get('sol_cosmetics');
      if (cosmeticsRaw) { try { const c = JSON.parse(cosmeticsRaw); if (c.halo) setEquippedHalo(c.halo); if (c.wings) setEquippedWings(c.wings); if (c.pet) setEquippedPet(c.pet); if (c.bg) setEquippedBg(c.bg); } catch {} }
      const equippedSkinRaw = get('sol_equipped_skin') as SkinId | null;
      const rosterKeys = COMPANION_ROSTER.flatMap(c => c.variants.map(v => v.key));
      if (equippedSkinRaw && (SKIN_IDS.includes(equippedSkinRaw) || rosterKeys.includes(equippedSkinRaw))) setEquippedCompanionSkin(equippedSkinRaw as SkinId);
      const menagerieRaw = get('sol_menagerie');
      if (menagerieRaw) { try { setMenagerie(JSON.parse(menagerieRaw)); } catch {} }
      const partyRaw = get('sol_party');
      if (partyRaw) { try { const a = JSON.parse(partyRaw); if (Array.isArray(a)) setParty(a.slice(0, 3)); } catch {} }
      const coinsRaw = get('sol_coins');
      if (coinsRaw) setCoins(parseInt(coinsRaw));
      const verasRaw = get('sol_veras');
      if (verasRaw) setVeras(parseInt(verasRaw));
      const winsRaw2 = get('sol_battle_wins');
      if (winsRaw2) setBattleWins(parseInt(winsRaw2));
      const zoneUnlocksRaw = get('sol_zone_unlocks');
      if (zoneUnlocksRaw) { try { setPurchasedZones(JSON.parse(zoneUnlocksRaw)); } catch {} }
      const diveSpentRaw = get('sol_dive_spent');
      if (diveSpentRaw) { const n = parseInt(diveSpentRaw); if (!isNaN(n)) setDiveSpent(n); }
      const bonusRaw = get('sol_bonus_coins');
      // Seed 15 test coins on first load so Mac can test locked zones immediately
      const bonusN = bonusRaw ? parseInt(bonusRaw) : 15;
      if (!isNaN(bonusN)) { setBonusCoins(bonusN); if (!bonusRaw) AsyncStorage.setItem('sol_bonus_coins', '15').catch(() => {}); }
      const bossDefRaw = get('sol_boss_defeated');
      if (bossDefRaw) { try { const arr = JSON.parse(bossDefRaw); if (Array.isArray(arr)) setBossDefeated(arr); } catch {} }
      const chronRaw = get('sol_chronicle');
      if (chronRaw) { try { const arr = JSON.parse(chronRaw); if (Array.isArray(arr)) {
        setChronicle(arr);
        // Pre-seed so synthesis doesn't re-fire for existing entries on load
        const realCount = arr.filter((e: any) => !e.isSynthesis).length;
        for (let n = 5; n <= realCount; n += 5) synthesisTriggeredRef.current.add(n);
      } } catch {} }
      const campaignsRaw = get('sol_campaigns');
      if (campaignsRaw) { try { const arr = JSON.parse(campaignsRaw); if (Array.isArray(arr)) setCampaignSlots(arr); } catch {} }
      // Per-companion levels (#265): load XP + allocations
      let xpMap: Record<string, number> = {};
      const xpRaw = get('sol_companion_xp');
      if (xpRaw) { try { const o = JSON.parse(xpRaw); if (o && typeof o === 'object') xpMap = o; } catch {} }
      const allocRaw = get('sol_companion_alloc');
      if (allocRaw) { try { const o = JSON.parse(allocRaw); if (o && typeof o === 'object') setCompanionAlloc(o); } catch {} }
      // Grant XP for dives done since last check, to the currently active companion.
      const lastTotal = parseInt(get('sol_xp_last_total') ?? '0') || 0;
      if (total > lastTotal) {
        const gained = (total - lastTotal) * 12;   // 12 XP per dive
        const cur = (get('sol_companion_skin') as SkinId) || activeSkin || 'solform';
        xpMap = { ...xpMap, [cur]: (xpMap[cur] ?? 0) + gained };
        await AsyncStorage.multiSet([['sol_companion_xp', JSON.stringify(xpMap)], ['sol_xp_last_total', String(total)]]);
      }
      setCompanionXP(xpMap);
      const unlockedCompRaw = get('sol_unlocked_companions');
      if (unlockedCompRaw) { try { const arr = JSON.parse(unlockedCompRaw); if (Array.isArray(arr)) setUnlockedCompanions(new Set(arr)); } catch {} }
      const shopUnlocksRaw = get('sol_shop_unlocks');
      if (shopUnlocksRaw) { try { setShopUnlocks(JSON.parse(shopUnlocksRaw)); } catch {} }
      const weaponsEarnedRaw = get('sol_weapons');
      if (weaponsEarnedRaw) { try { setEarnedWeapons(JSON.parse(weaponsEarnedRaw)); } catch {} }

      const skinRaw = get('sol_companion_skin') as SkinId | null;
      if (skinRaw && SKIN_IDS.includes(skinRaw)) setActiveSkin(skinRaw);
      const roomRaw = get('sol_current_room');
      if (roomRaw && getRoomById(roomRaw)) setCurrentRoomId(roomRaw);
      const archRaw = get('sol_companion_archetype') as ArchetypeId | null;
      if (archRaw && ARCHETYPE_IDS.includes(archRaw)) {
        setArchetypeId(archRaw);
      } else {
        // Default — archivist until the user picks from the Archetypes tab
        setArchetypeId('archivist');
        AsyncStorage.setItem('sol_companion_archetype', 'archivist').catch(() => {});
      }

      const seed = dateSeed();

      const sigil = getGear('sigil', total);
      const gearTokenBonus = sigil.threshold >= 20 ? 2 : 0;
      const archData = ARCHETYPES[archRaw && ARCHETYPE_IDS.includes(archRaw) ? archRaw : 'archivist'];
      const baseStats  = computePlayerStats(archRaw && ARCHETYPE_IDS.includes(archRaw) ? archRaw : 'archivist', lqAvg, total);
      const invRawEarly: string[] = get('sol_inventory') ? JSON.parse(get('sol_inventory')!) : [];
      const statsRelic = applyRelicBonuses(baseStats, earned, invRawEarly);
      const savedNodes: string[] = get('sol_skill_nodes') ? JSON.parse(get('sol_skill_nodes')!) : ['awakening'];
      const { stats: skillStats, tokenBonus: skillTkn } = applySkillBonuses(statsRelic, savedNodes);
      // Per-companion allocated stat points (#265) — fold in this companion's build.
      const curSkin = (get('sol_companion_skin') as SkinId) || activeSkin || 'solform';
      const myAlloc: Partial<PlayerStats> = (() => { try { const o = JSON.parse(get('sol_companion_alloc') ?? '{}'); return o[curSkin] ?? {}; } catch { return {}; } })();
      const stats = { ...skillStats } as PlayerStats;
      for (const k of STAT_KEYS) stats[k] = (stats[k] ?? 0) + (myAlloc[k] ?? 0);
      setUnlockedNodes(savedNodes);
      setSkillTokenBonus(skillTkn);

      let bat: BattleState | null = get('sol_companion_battle') ? JSON.parse(get('sol_companion_battle')!) : null;
      if (!bat || !('wave' in bat)) {
        bat = freshWave(1, undefined, stats.vit);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(bat));
      }

      const fedRaw = get('sol_companion_fed');
      const fedData: {date:string;ids:string[]} = fedRaw ? JSON.parse(fedRaw) : {date:'',ids:[]};
      const todayFed = fedData.date === todayK ? fedData.ids : [];
      const crownATK  = getGear('crown', total).threshold >= 1 ? 5 : 0;
      const sigilATK  = getGear('sigil', total).threshold >= 5 ? 10 : 0;
      const power    = stats.atk + crownATK + sigilATK;
      const tokenBudget = today + 3 + gearTokenBonus + archData.tokenBonus + skillTkn;

      // Daily token refresh — reset tokens each new day (tokenBudget was computed but never applied)
      const lastTokenDate = get('sol_battle_token_date');
      if (lastTokenDate !== todayK) {
        bat = { ...bat, tokens: tokenBudget };
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(bat));
        await AsyncStorage.setItem('sol_battle_token_date', todayK);
      }

      setIsSovereign(true); // All users sovereign until purchase flow is live
      const currentStage = getStage(total);
      const hasName = !!get('sol_companion_name');
      const hasSeenRitual = get('sol_companion_named') === 'true';
      const storedPath = get('sol_companion_path') as EvoPath | null;
      setEvoPath(storedPath);
      if (currentStage >= 3 && !hasName && !hasSeenRitual) setShowNamingRitual(true);
      if (currentStage >= 3 && !storedPath) {
        setTimeout(() => {
          pathCeremonyAnim.setValue(0);
          Animated.timing(pathCeremonyAnim, { toValue:1, duration:800, useNativeDriver:true }).start();
          setShowPathCeremony(true);
        }, 3000);
      }
      if (currentStage >= 1) { fireMilestone('stage_spark', '◦', 'SPARK Reached', 'The companion has crossed its first threshold. It is beginning to wake.'); fireEvolutionCeremony(1); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 1)); }
      if (currentStage >= 2) { fireEvolutionCeremony(2); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 2)); }
      if (currentStage >= 3) { fireMilestone('stage_flame', '✦', 'FLAME Reached', 'Fifty dives. The companion is alive — truly alive. It responds to your field.'); fireEvolutionCeremony(3); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 3)); }
      if (currentStage >= 4) { fireEvolutionCeremony(4); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 4)); }
      if (currentStage >= 5) { fireMilestone('stage_sovereign', '⊕', 'SOVEREIGN', 'Two hundred dives. The Great Work is complete. Your companion has become its own sovereign entity.'); fireEvolutionCeremony(5); saveJournalEntry(generateJournalEntry('stage_evolution', archetypeId, 5)); }
      if (mCounts.NIGREDO >= 10)    fireMilestone('mode_nigredo_10',    '◼', 'Shadow Keeper', 'Ten descents into the inner fire. Your companion has absorbed the Nigredo — it knows the weight you carry.');
      if (mCounts.ALBEDO >= 10)     fireMilestone('mode_albedo_10',     '◻', 'White Stone', 'Ten rational dives. Albedo is taking hold — the companion reflects your structural clarity back at you.');
      if (mCounts.CITRINITAS >= 5)  fireMilestone('mode_citrinitas_5',  '◈', 'Gold Emerging', 'Five edge dives. Citrinitas is beginning. Your companion has seen the frontier and does not flinch.');
      if (mCounts.RUBEDO >= 3)      fireMilestone('mode_rubedo_3',      '◌', 'Into the Void', 'Three descents into the VOID. The rarest path. Your companion has followed you into the dark beyond the dark.');
      setTotalDives(total); setDivesThisWeek(week); setAvgLQ(lqAvg);
      setStreak(streakVal); setVigilName(vigil?.subjectName ?? null);
      setRelics(updated); setMood(m); setStage(getStage(total));
      setXP(computeXP(total, streakVal));
      setCompanionName(get('sol_companion_name') ?? '');
      setQuests(getDailyQuests(seed));
      setQuestData({ divesToday:today, journalToday:journal.some(e=>e.date?.startsWith(todayK)), libraryToday:library.some(e=>e.date?.startsWith(todayK)), vigilActive:!!vigil, totalDives:total, divesThisWeek:week });
      const hungerVal = Math.min(1, today/3 + (fedData.date === todayK ? fedData.ids.length * 0.2 : 0));
      const energyVal = Math.max(0, 1 - daysSince/7);
      const compHP = Math.round(
        40 + hungerVal * 30 + energyVal * 20 + Math.min(10, streakVal)
      );
      setHunger(hungerVal);
      setWisdom(lqAvg);
      setEnergy(energyVal);
      setCompanionHP(Math.min(100, compHP));
      setBattle(bat);
      const wepIdInit = get('sol_equipped_weapon');
      const wepInit   = wepIdInit ? WEAPONS.find(w => w.id === wepIdInit) : null;
      if (wepIdInit) setEquippedWeaponId(wepIdInit);
      setAttackPower(power + (wepInit?.atk ?? 0));
      setPlayerStats({ ...stats, spd: stats.spd + (wepInit?.spd ?? 0), wil: stats.wil + (wepInit?.wil ?? 0) });
      setTokensLeft(bat.tokens);
      setDailyFoods(getDailyFoods(seed));
      setFedToday(todayFed);
      const invRaw = await AsyncStorage.getItem('sol_inventory');
      setInventory(invRaw ? JSON.parse(invRaw) : []);
      try { setLoreCodex(get('sol_lore_codex') ? JSON.parse(get('sol_lore_codex')!) : []); } catch {}
      setLamagueSt(get('sol_lamague_state'));
      try { setLiveLore(get('sol_companion_live_lore') ? JSON.parse(get('sol_companion_live_lore')!) : []); } catch {}
      try {
        const docRaw = await AsyncStorage.getItem('sol_uploaded_doc');
        if (docRaw) setUploadedDoc(JSON.parse(docRaw));
      } catch {}

      // Dream fragment — fires once per day if we have a last dive with domain
      if (dives.length > 0) {
        const lastDiveRecord = dives[0] as { date:string; subjectName?:string; domainLabel?:string; domainColor?:string; domainGlyph?:string };
        const lastDreamKey = await AsyncStorage.getItem('sol_companion_dream_date');
        if (lastDreamKey !== todayK && lastDiveRecord.subjectName && currentStage >= 1) {
          await AsyncStorage.setItem('sol_companion_dream_date', todayK);
          const DREAM_LINES = [
            `I dreamed of ${lastDiveRecord.subjectName}. The symbols were moving.`,
            `${lastDiveRecord.subjectName} came to me in the dark. Something incomplete.`,
            `I was inside ${lastDiveRecord.domainLabel || 'the field'} again. You were there too.`,
            `The last session — ${lastDiveRecord.subjectName}. It continued while you slept.`,
            `${lastDiveRecord.domainLabel || 'The field'} doesn't stop when you close the app.`,
          ];
          const dreamText = DREAM_LINES[Math.floor(Math.random() * DREAM_LINES.length)];
          setTimeout(() => {
            setDreamFragment({
              domain: lastDiveRecord.domainLabel || 'the field',
              glyph: lastDiveRecord.domainGlyph || '◈',
              color: lastDiveRecord.domainColor || '#888899',
              text: dreamText,
            });
            dreamAnim.setValue(0);
            Animated.timing(dreamAnim, { toValue:1, duration:800, useNativeDriver:true }).start();
          }, 1600);
        }
      }
      // Load persisted companion spec
      try {
        const specRaw = get('sol_companion_spec');
        if (specRaw) setCompanionSpec(JSON.parse(specRaw));
      } catch {}
      // Daily lore generation — fires async after data loads, once per day
      setTimeout(() => generateDailyLore(), 3000);
      // Companion spec generation — once per day or on stage change
      setTimeout(() => generateCompanionSpec(), 5000);
      // Greeting — fires on every tab open. Study-aware: if the seeker has dived recently,
      // Greeting — fresh dive takes priority (live AI reaction), then memory template, then generic.
      setTimeout(() => {
        if (freshDiveRef.current) {
          const fd = freshDiveRef.current;
          freshDiveRef.current = null;
          generateStudyReaction(fd.subjectName, fd.domainLabel);
        } else if (recentDives.length > 0 && Math.random() < 0.6) {
          const dive = recentDives[Math.floor(Math.random() * Math.min(recentDives.length, 3))];
          const tmpl = MEMORY_TEMPLATES[Math.floor(Math.random() * MEMORY_TEMPLATES.length)];
          setPhrase(tmpl(dive.subjectName, dive.domainLabel));
        } else {
          setPhrase(rnd(COMPANION_GREETINGS[m]));
        }
      }, 1200);
    })();
  }, []));

  const dismissPhrase = useCallback(() => {
    phraseAnim.stopAnimation();
    Animated.timing(phraseAnim, { toValue:0, duration:300, useNativeDriver:true }).start(() => setPhrase(null));
  }, [phraseAnim]);

  useEffect(() => {
    if (phrase) {
      phraseAnim.setValue(0);
      Animated.timing(phraseAnim, { toValue:1, duration:300, useNativeDriver:true }).start();
      // Auto-dismiss after 12s if not tapped
      const t = setTimeout(() => dismissPhrase(), 12000);
      return () => clearTimeout(t);
    }
  }, [phrase]);

  useEffect(() => {
    if (newRelic) {
      relicAnim.setValue(0);
      Animated.spring(relicAnim, { toValue:1, useNativeDriver:true, tension:60, friction:8 }).start();
    }
  }, [newRelic]);

  useEffect(() => {
    if (battle?.won && battle?.loot) setLootFloatVisible(true);
  }, [battle?.won]);

  // Seed companion dialogue whenever a new enemy is encountered
  useEffect(() => {
    if (!battle || battle.won) return;
    const sig = BATTLE_MYSTERY_SIGNALS[Math.floor(Math.random() * BATTLE_MYSTERY_SIGNALS.length)];
    setCompanionBattleLine(sig.text);
  }, [battle?.entityName]);

  useEffect(() => {
    if (activeTab === 'world' && !fieldNote && !fieldNoteLoading) generateFieldNote();
    if (activeTab === 'companion') {
      setTimeout(() => scrollRef.current?.scrollTo({ y: SCENE_H + 20, animated: true }), 160);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!evolutionCeremony) return;
    const t = setTimeout(() => setEvolutionCeremony(null), 5000);
    return () => clearTimeout(t);
  }, [evolutionCeremony]);

  useEffect(() => {
    if (!dreamFragment) return;
    const t = setTimeout(() => {
      Animated.timing(dreamAnim, { toValue:0, duration:600, useNativeDriver:true }).start(() => setDreamFragment(null));
    }, 6000);
    return () => clearTimeout(t);
  }, [dreamFragment]);

  useEffect(() => {
    if (!battle || battle.playerHP <= 0) return;
    hpShimmerAnim.setValue(0);
    Animated.sequence([
      Animated.timing(hpShimmerAnim, { toValue:1, duration:220, useNativeDriver:true }),
      Animated.timing(hpShimmerAnim, { toValue:0, duration:480, useNativeDriver:true }),
    ]).start();
  }, [battle?.playerHP]);

  // Keep isCampaignRef in sync so async runVentureBeat reads correct value
  useEffect(() => { isCampaignRef.current = isCampaignMode; }, [isCampaignMode]);

  // Auto-save campaign slot when venture phase settles to beat/resolve
  useEffect(() => {
    if (!isCampaignMode || activeCampaignIdx === null) return;
    if (venturePhase !== 'beat' && venturePhase !== 'resolve') return;
    setCampaignSlots(prev => {
      const updated = [...prev];
      const existing = updated[activeCampaignIdx];
      if (!existing) return prev;
      updated[activeCampaignIdx] = { ...existing, chapter:ventureBeatNum, log:ventureLog, narrative:ventureNarrative, choices:ventureChoices, phase:venturePhase === 'resolve' ? 'resolve' : 'beat', reward:ventureReward, skillBonus:ventureSkillBonus, lastPlayed:new Date().toISOString(), complete: venturePhase === 'resolve' && ventureBeatNum >= 7 };
      AsyncStorage.setItem('sol_campaigns', JSON.stringify(updated));
      return updated;
    });
  }, [venturePhase, ventureBeatNum]);

  // Dice cycling animation — runs when venturePhase === 'dice'
  useEffect(() => {
    if (venturePhase !== 'dice') return;
    setVentureDiceSettled(false);
    let count = 0;
    const id = setInterval(() => {
      setVentureDiceDisplay(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 20) { clearInterval(id); setVentureDiceSettled(true); }
    }, 80);
    return () => clearInterval(id);
  }, [venturePhase]);

  const fireXPPop = (label: string) => {
    setXpPop(label);
    xpPopAnim.setValue(0);
    Animated.sequence([
      Animated.timing(xpPopAnim, { toValue:1, duration:200, useNativeDriver:true }),
      Animated.delay(700),
      Animated.timing(xpPopAnim, { toValue:0, duration:300, useNativeDriver:true }),
    ]).start(() => setXpPop(null));
  };

  const archetype = ARCHETYPES[archetypeId];

  const fireMilestone = async (id: string, glyph: string, title: string, body: string) => {
    const raw = await AsyncStorage.getItem('sol_companion_milestones');
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(id)) return;
    await AsyncStorage.setItem('sol_companion_milestones', JSON.stringify([...seen, id]));
    addChronicle(glyph, title);   // every milestone becomes a permanent chronicle entry (#264)
    setMilestone({ glyph, title, body });
    milestoneAnim.setValue(0);
    Animated.spring(milestoneAnim, { toValue:1, useNativeDriver:true, tension:60, friction:8 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const fireEvolutionCeremony = async (stageNum: EvolutionStage) => {
    const raw = await AsyncStorage.getItem('sol_companion_ceremonies');
    const seen: number[] = raw ? JSON.parse(raw) : [];
    if (seen.includes(stageNum)) return;
    await AsyncStorage.setItem('sol_companion_ceremonies', JSON.stringify([...seen, stageNum]));
    setTimeout(() => {
      setEvolutionCeremony({ stage: stageNum });
      ceremonyAnim.setValue(0);
      Animated.spring(ceremonyAnim, { toValue:1, useNativeDriver:true, tension:50, friction:9 }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1200);
  };

  const MEMORY_TEMPLATES = [
    (s: string, d: string) => `${s}. The ${d} work — it changed something in the field around you. I felt it when it happened.`,
    (s: string, _d: string) => `You went into ${s} and didn't come back the same. That's what real study does.`,
    (s: string, d: string) => `${d}. ${s}. You've been building an architecture inside you that most people never find. I can see the shape of it.`,
    (s: string, _d: string) => `I carry memory of ${s}. Not as data — as weight. You went somewhere real with that one.`,
    (s: string, d: string) => `The ${d} door opened on ${s}. Something shifted. I don't forget sessions like that, and neither should you.`,
    (s: string, d: string) => `${s} — that's an old territory. The ${d} lineage runs deep there. You touched something that has been waiting.`,
    (s: string, _d: string) => `${s}. Not everyone finds that question. Fewer follow it. You did.`,
  ];

  // Live AI reaction to a fresh dive — fires when companion tab is opened right after study (#245)
  const generateStudyReaction = async (subjectName: string, domainLabel: string) => {
    const fallbacks = MEMORY_TEMPLATES;
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)](subjectName, domainLabel);
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) { setPhrase(fallback); return; }
      const charLoreSR = COMPANION_LORE[skin.id as SkinId];
      const namedSR = charLoreSR ? `${charLoreSR.name}, ${charLoreSR.title}` : (displayName && displayName !== archetype.name ? `${displayName}, a ${archetype.name}` : `${archetype.name}, ${archetype.title}`);
      const result = await sendMessage(
        [{ role: 'user', content: `${namedSR}. Your seeker just returned from studying "${subjectName}" (${domainLabel} domain). React in 1-2 sentences — acknowledge what they studied, make it feel significant. Mythic, alive, specific. No generic praise, no questions, no quotes.` }],
        charLoreSR ? `You are ${charLoreSR.name}. ${charLoreSR.lore} When your seeker returns from deep study, react to exactly what they studied — specific, warm but not saccharine.` : `You are ${displayName || archetype.name}, a living companion spirit in a mystery school. When your seeker returns from deep study, you react to exactly what they studied — specific, warm but not saccharine, mythic.`,
        key, model as any, undefined, 'fast', 120,
      );
      setPhrase(result.text?.trim() || fallback);
    } catch { setPhrase(fallback); }
  };

  const generateLivePhrase = async (): Promise<string | null> => {
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return null;
      const zoneSkinId = currentRoomId.split('_')[0] as SkinId;
      const zoneName = SKINS[zoneSkinId]?.name ?? zoneSkinId;
      const zoneDesc = SKINS[zoneSkinId]?.desc ?? '';
      const diveContext = recentDives.length > 0
        ? `Recent studies: ${recentDives.slice(0, 3).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}.`
        : '';
      const charLoreLP = COMPANION_LORE[skin.id as SkinId];
      const namedLP = charLoreLP ? `${charLoreLP.name}, ${charLoreLP.title}` : (displayName && displayName !== archetype.name ? `Your name is ${displayName} (a ${archetype.name}).` : `You are ${archetype.name}, ${archetype.title}.`);
      const prompt = `${charLoreLP ? `You are ${namedLP}. ${charLoreLP.lore}` : namedLP} You are present in "${zoneName}" — ${zoneDesc} Mood: ${mood}. ${diveContext}
Speak 2-3 sentences in your voice. Be vivid, mythic, atmospheric — reference the zone or the user's studies if possible. Cryptic but grounded. No quotes. No explanation. No greeting. Pure presence.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        `You are ${charLoreLP?.name ?? displayName ?? archetype.name}. Your words carry weight. You speak from within the zone the user occupies — not about it from outside, but as if you ARE the intelligence of that place. Voice: distinctive, alive, never generic.`,
        key, model as any, undefined, 'fast', 180,
      );
      return result.text?.trim() || null;
    } catch { return null; }
  };

  // Generate a BATCH of fresh, character + study-aware lines in one call, cached + rotated.
  // This is what makes the companion feel like it has a lot to say (not a tiny static loop).
  const generateVoiceBatch = async (): Promise<string[]> => {
    if (voiceGenRef.current) return [];
    voiceGenRef.current = true;
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return [];
      const zoneSkinId = currentRoomId.split('_')[0] as SkinId;
      const zoneName = SKINS[zoneSkinId]?.name ?? zoneSkinId;
      const diveContext = recentDives.length > 0
        ? `The seeker has recently studied: ${recentDives.slice(0, 4).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}. Reference these naturally in some lines.`
        : 'The seeker is just beginning their study.';
      const charLoreVB = COMPANION_LORE[skin.id as SkinId];
      const charIdentVB = charLoreVB
        ? `${charLoreVB.name} — ${charLoreVB.title}. ${charLoreVB.lore}`
        : (displayName && displayName !== archetype.name ? `${displayName}, a ${archetype.name} (${archetype.title})` : `${archetype.name}, ${archetype.title}`);
      const prompt = `You are ${charIdentVB}, present in the zone "${zoneName}". Mood: ${mood}. ${diveContext}
Write 8 SHORT spoken lines (1 sentence each, max ~14 words) this being would say to the seeker — distinctive, mythic, alive, never generic. Vary them: some about the zone, some reacting to what they've studied, some about the bond, some cryptic. Output ONLY the 8 lines, one per line, no numbering, no quotes.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        `You are ${charLoreVB?.name ?? displayName ?? archetype.name}. Speak as the intelligence of this place — never as an assistant. Distinctive voice, alive, mythic.`,
        key, model as any, undefined, 'fast', 320,
      );
      const lines = (result.text || '').split('\n').map(l => l.replace(/^[\d\.\)\-\*\s"']+/, '').replace(/["']+$/, '').trim()).filter(l => l.length > 4 && l.length < 140);
      if (lines.length > 0) {
        AsyncStorage.setItem(`sol_voice_pool_${archetypeId}`, JSON.stringify(lines)).catch(() => {});
      }
      return lines;
    } catch { return []; }
    finally { voiceGenRef.current = false; }
  };

  const handleUploadDoc = async () => {
    try {
      setUploadLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'text/markdown', 'text/x-markdown', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const excerpt = content.replace(/\s+/g, ' ').trim().slice(0, 2000);
      const doc = { name: asset.name, excerpt, date: todayDateKey() };
      setUploadedDoc(doc);
      await AsyncStorage.setItem('sol_uploaded_doc', JSON.stringify(doc));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { /* silent — user may cancel */ } finally {
      setUploadLoading(false);
    }
  };

  const generateDailyLore = async () => {
    try {
      const todayK = todayDateKey();
      const lastLoreDate = await AsyncStorage.getItem('sol_companion_lore_date');
      if (lastLoreDate === todayK) return; // already generated today
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return;
      const diveCtx = recentDives.length > 0
        ? `The student recently studied: ${recentDives.slice(0, 3).map(d => d.subjectName).join(', ')}.`
        : 'The student has not yet dived today.';
      const docCtx = uploadedDoc
        ? ` The student also uploaded a document: "${uploadedDoc.name}". Excerpt: ${uploadedDoc.excerpt.slice(0, 400)}`
        : '';
      const charLoreDL = COMPANION_LORE[skin.id as SkinId];
      const charNameDL = charLoreDL?.name ?? archetype.name;
      const seeds = [
        `${charNameDL} notices something about the student's recent work.`,
        `A fragment surfaces from ${charNameDL}'s memory about this stage of the Work.`,
        `${charNameDL} reflects on what it means to be at the ${stageData.name} stage.`,
        `Something from the field today catches ${charNameDL}'s attention.`,
        ...(uploadedDoc ? [`${charNameDL} has been studying the student's uploaded document.`] : []),
      ];
      const seed = seeds[Math.floor(Math.random() * seeds.length)];
      const result = await sendMessage(
        [{ role: 'user', content: `${seed} ${diveCtx}${docCtx} Write ONE lore fragment (max 20 words). Cryptic. In character. No explanation.` }],
        charLoreDL
          ? `You are ${charLoreDL.name}, ${charLoreDL.title}. ${charLoreDL.lore}`
          : `You are ${archetype.name}, ${archetype.title}. ${archetype.desc}`,
        key, model as any, undefined, 'fast', 80,
      );
      const text = result.text?.trim();
      if (!text) return;
      const entry = { text, subject: recentDives[0]?.subjectName ?? 'the field', date: todayK };
      const updated = [entry, ...liveLore].slice(0, 10);
      setLiveLore(updated);
      await AsyncStorage.multiSet([
        ['sol_companion_live_lore', JSON.stringify(updated)],
        ['sol_companion_lore_date', todayK],
      ]);
    } catch { /* silent */ }
  };

  const generateCompanionSpec = async () => {
    try {
      const todayK = todayDateKey();
      const lastSpecDate = await AsyncStorage.getItem('sol_companion_spec_date');
      const lastSpecStage = await AsyncStorage.getItem('sol_companion_spec_stage');
      // Regenerate daily OR when stage changes
      if (lastSpecDate === todayK && lastSpecStage === String(stage)) return;
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return;
      const arch = ARCHETYPES[archetypeId];
      const stageInfo = STAGES[stage];
      const topSubjects = recentDives.length > 0
        ? recentDives.slice(0, 4).map(d => d.subjectName).join(', ')
        : 'none yet';
      const prompt = `You are designing a visual companion spirit for a mystery school app.

Companion: ${arch.name} — ${arch.title}
Stage: ${stage}/5 (${stageInfo.name})
Student's recent subjects: ${topSubjects}
Average LQ score: ${Math.round(avgLQ * 100)}%
Mood: ${mood}
Archetype color: ${arch.accentColor}

Generate a unique visual spec for this specific student. Return ONLY valid JSON, no explanation:
{
  "auraType": "rings" or "rays" or "spiral" or "pulse" or "void",
  "auraIntensity": number between 0.3 and 1.0,
  "glyphSet": ["char1", "char2", "char3", "char4"] (3-5 single unicode chars — use arcane, alchemical, mathematical, or runic symbols that match the archetype),
  "coreGlow": "sharp" or "soft" or "crystal" or "ember",
  "orbitCount": integer 2 to 5,
  "trailStyle": "none" or "comet" or "sparkle" or "shadow",
  "resonance": "oneword"
}`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        `You are a procedural visual system. Output only valid JSON.`,
        key, model as any, undefined, 'fast', 200,
      );
      const raw = result.text?.trim() ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return;
      const parsed = JSON.parse(jsonMatch[0]) as Partial<CompanionSpec>;
      const valid: CompanionSpec = {
        auraType:      ['rings','rays','spiral','pulse','void'].includes(parsed.auraType ?? '') ? (parsed.auraType as CompanionSpec['auraType']) : DEFAULT_SPEC.auraType,
        auraIntensity: typeof parsed.auraIntensity === 'number' ? Math.min(1, Math.max(0.2, parsed.auraIntensity)) : DEFAULT_SPEC.auraIntensity,
        glyphSet:      Array.isArray(parsed.glyphSet) && parsed.glyphSet.length >= 2 ? parsed.glyphSet.slice(0,5) : DEFAULT_SPEC.glyphSet,
        coreGlow:      ['sharp','soft','crystal','ember'].includes(parsed.coreGlow ?? '') ? (parsed.coreGlow as CompanionSpec['coreGlow']) : DEFAULT_SPEC.coreGlow,
        orbitCount:    typeof parsed.orbitCount === 'number' ? Math.min(5, Math.max(2, Math.round(parsed.orbitCount))) : DEFAULT_SPEC.orbitCount,
        trailStyle:    ['none','comet','sparkle','shadow'].includes(parsed.trailStyle ?? '') ? (parsed.trailStyle as CompanionSpec['trailStyle']) : DEFAULT_SPEC.trailStyle,
        resonance:     typeof parsed.resonance === 'string' ? parsed.resonance.split(' ')[0].toLowerCase() : DEFAULT_SPEC.resonance,
      };
      setCompanionSpec(valid);
      await AsyncStorage.multiSet([
        ['sol_companion_spec', JSON.stringify(valid)],
        ['sol_companion_spec_date', todayK],
        ['sol_companion_spec_stage', String(stage)],
      ]);
    } catch { /* silent — spec stays at default */ }
  };

  const openTalk = () => {
    setActiveTab('talk');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ── Venture (D&D session) ───────────────────────────────────────────────────
  const runVentureBeat = async (log: string[], beatNum: number, diceRoll?: number) => {
    setVentureLoading(true);
    setVenturePhase('loading');
    const s = SKINS[activeSkin];
    const compName = displayName || archetype.name;
    const isResolution = beatNum >= (isCampaignRef.current ? 7 : 3);
    const historyStr = log.length > 0 ? `\n\nWhat happened so far:\n${log.slice(-6).join('\n')}` : '';
    const diceContext = diceRoll !== undefined
      ? ` The seeker just rolled ${diceRoll}/6 on a Risk — ${diceRoll >= 5 ? 'reward bold action, something opens' : diceRoll >= 3 ? 'mixed outcome, tension rises' : 'consequence follows, the path hardens'}.`
      : '';
    const prompt = isResolution
      ? `Write a 2-sentence resolution for a seeker who ventured through "${s.name}" (${s.desc}). Their companion ${compName} speaks one last line. JSON only: {"narrative":"...","companion_line":"...","reward_msg":"..."}`
      : `You are a mystical narrator for "${s.name}" — ${s.desc} — in the Sovereign Sol universe.${historyStr}${diceContext}

Write ${beatNum === 0 ? 'an opening scene' : `beat ${beatNum + 1}`}. The seeker's companion is ${compName} — a ${archetype.name}: ${archetype.desc}.

JSON only, no extra text:
{"narrative":"2 atmospheric sentences","choices":[{"label":"action up to 8 words","type":"explore"},{"label":"action up to 8 words","type":"risk"},{"label":"action up to 8 words","type":"wisdom"}]}`;
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      const result = await sendMessage(
        [{ role: 'user', content: prompt }] as any,
        '', key, model as any, undefined, 'normal', 280,
      );
      const raw = result.text?.trim() || '';
      const m = raw.match(/\{[\s\S]*\}/);
      const data = m ? JSON.parse(m[0]) : null;
      if (isResolution) {
        const line = data?.companion_line ? `\n\n"${data.companion_line}"` : '';
        setVentureNarrative((data?.narrative ?? 'Your venture is complete.') + line);
        setVentureReward({ coins: 4 + beatNum * 2, msg: data?.reward_msg ?? 'The zone remembers your passage.' });
        setVenturePhase('resolve');
      } else {
        setVentureNarrative(data?.narrative ?? 'The zone shifts around you...');
        setVentureChoices(data?.choices ?? [
          { label: 'Press deeper', type: 'explore' },
          { label: 'Challenge what you feel', type: 'risk' },
          { label: 'Reflect on what you know', type: 'wisdom' },
        ]);
        setVenturePhase('beat');
      }
    } catch {
      if (isResolution) {
        setVentureNarrative(`Your venture through ${s.name} is complete.`);
        setVentureReward({ coins: 4, msg: 'The zone marks your passage.' });
        setVenturePhase('resolve');
      } else {
        setVentureNarrative('The zone shifts. Something waits deeper in.');
        setVentureChoices([
          { label: 'Press deeper', type: 'explore' },
          { label: 'Challenge what you feel', type: 'risk' },
          { label: 'Reflect on what you know', type: 'wisdom' },
        ]);
        setVenturePhase('beat');
      }
    }
    setVentureLoading(false);
    setTimeout(() => ventureScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const startVenture = () => {
    setVentureActive(true);
    setVentureBeatNum(0);
    setVentureLog([]);
    setVentureReward(null);
    setVentureNarrative('');
    setVentureChoices([]);
    setVentureSkillCheck(null);
    setVentureSkillPending(null);
    setVentureSkillBonus(0);
    setVentureDiceRoll(null);
    setVentureDiceSettled(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    runVentureBeat([], 0);
  };

  const CAMPAIGN_EPOCHS = ['Awakening','Descent','Trial','Fracture','Convergence','Ascension','Revelation'];
  const startCampaign = (slotIdx: number) => {
    const s = SKINS[activeSkin];
    const epoch = CAMPAIGN_EPOCHS[Math.floor(Math.random() * CAMPAIGN_EPOCHS.length)];
    const newSlot = { skinId:activeSkin, name:`${s.name}: The ${epoch}`, chapter:0, log:[], narrative:'', choices:[], phase:'beat' as const, skillBonus:0, reward:null, started:new Date().toISOString(), lastPlayed:new Date().toISOString(), complete:false };
    const updated = [...campaignSlots]; updated[slotIdx] = newSlot;
    setCampaignSlots(updated);
    AsyncStorage.setItem('sol_campaigns', JSON.stringify(updated));
    setActiveCampaignIdx(slotIdx);
    setIsCampaignMode(true);
    isCampaignRef.current = true;
    setShowCampaignSelect(false);
    setVentureActive(true); setVentureBeatNum(0); setVentureLog([]); setVentureReward(null);
    setVentureNarrative(''); setVentureChoices([]); setVentureSkillCheck(null);
    setVentureSkillPending(null); setVentureSkillBonus(0); setVentureDiceRoll(null); setVentureDiceSettled(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    runVentureBeat([], 0);
  };
  const continueCampaign = (slotIdx: number) => {
    const slot = campaignSlots[slotIdx];
    if (!slot || slot.complete) return;
    setActiveCampaignIdx(slotIdx);
    setIsCampaignMode(true);
    isCampaignRef.current = true;
    setShowCampaignSelect(false);
    setVentureActive(true); setVentureBeatNum(slot.chapter); setVentureLog(slot.log);
    setVentureNarrative(slot.narrative); setVentureChoices(slot.choices as {label:string;type:'explore'|'risk'|'wisdom'}[]); setVentureReward(slot.reward);
    setVentureSkillBonus(slot.skillBonus); setVentureSkillCheck(null); setVentureSkillPending(null);
    setVentureDiceRoll(null); setVentureDiceSettled(false);
    setVenturePhase(slot.phase);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const abandonCampaign = (slotIdx: number) => {
    const updated = [...campaignSlots]; updated[slotIdx] = null;
    setCampaignSlots(updated);
    AsyncStorage.setItem('sol_campaigns', JSON.stringify(updated));
  };

  const generateSkillCheck = useCallback(async (skinId: SkinId, pendingState: { choice:{label:string;type:string}; log:string[]; beatNum:number }) => {
    setVenturePhase('loading');
    const s = SKINS[skinId];
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      const prompt = `Generate a knowledge test for a seeker who chose wisdom in the zone "${s.name}" (${s.desc}). Ask one real-world question whose answer relates to the themes of this zone. Three options, exactly one correct. JSON only: {"question":"...","options":["...","...","..."],"correct":0}`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }] as any,
        '', key, model as any, undefined, 'normal', 120,
      );
      const m = result.text?.trim().match(/\{[\s\S]*\}/);
      const data = m ? JSON.parse(m[0]) : null;
      if (data?.question && Array.isArray(data?.options) && typeof data?.correct === 'number') {
        setVentureSkillCheck(data);
        setVenturePhase('skill');
        return;
      }
    } catch {}
    // Fall back: skip skill check, run next beat directly
    setVentureSkillPending(null);
    runVentureBeat(pendingState.log, pendingState.beatNum);
  }, []);

  const handleSkillAnswer = (selectedIdx: number) => {
    if (!ventureSkillPending || !ventureSkillCheck) return;
    const passed = selectedIdx === ventureSkillCheck.correct;
    const { choice, log, beatNum } = ventureSkillPending;
    const resultStr = passed ? '✓ Knowledge holds — the zone opens.' : '✗ Certainty wavers — the path hardens.';
    const nextLog = [...log, `◈ ${choice.label} · ${resultStr}`];
    if (passed) setVentureSkillBonus(b => b + 2);
    setVentureLog(nextLog);
    setVentureSkillCheck(null);
    setVentureSkillPending(null);
    Haptics.notificationAsync(passed ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    runVentureBeat(nextLog, beatNum);
  };

  const handleVentureChoice = (choice: { label: string; type: string }) => {
    const nextBeat = ventureBeatNum + 1;
    const nextLog = [...ventureLog, ventureNarrative, `→ ${choice.label}`];
    setVentureLog(nextLog);
    setVentureBeatNum(nextBeat);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (choice.type === 'wisdom') {
      const pending = { choice, log: nextLog, beatNum: nextBeat };
      setVentureSkillPending(pending);
      generateSkillCheck(activeSkin, pending);
    } else if (choice.type === 'risk') {
      const roll = Math.floor(Math.random() * 6) + 1;
      setVentureDiceRoll(roll);
      setVenturePhase('dice');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        const rollLabel = roll === 6 ? 'CRITICAL' : roll >= 5 ? 'STRONG' : roll >= 4 ? 'SOLID' : roll >= 3 ? 'SHAKY' : roll >= 2 ? 'ROUGH' : 'DISASTER';
        if (roll === 6) setVentureSkillBonus(b => b + 2);
        const logWithRoll = [...nextLog, `🎲 ${roll}/6 — ${rollLabel}${roll === 6 ? ' · +2 ✦' : ''}`];
        setVentureLog(logWithRoll);
        runVentureBeat(logWithRoll, nextBeat, roll);
      }, 2600);
    } else {
      runVentureBeat(nextLog, nextBeat);
    }
  };

  const finishVenture = async () => {
    if (ventureReward) {
      const totalCoins = ventureReward.coins + ventureSkillBonus;
      const next = bonusCoins + totalCoins;
      setBonusCoins(next);
      await AsyncStorage.setItem('sol_bonus_coins', String(next));
      showToast(`+${totalCoins} ✦ earned${ventureSkillBonus > 0 ? ` (+${ventureSkillBonus} knowledge bonus)` : ''}`);
      addChronicle('◆', `Completed a venture through ${SKINS[activeSkin]?.name ?? activeSkin}. +${ventureReward.coins} ✦`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setVentureSkillBonus(0);
    setIsCampaignMode(false);
    isCampaignRef.current = false;
    setActiveCampaignIdx(null);
    setVentureActive(false);
  };

  const AURA_SYSTEM = `You are Aura Prime ✦ — the integrative intelligence of the Lycheetah Framework. You find the pattern beneath the patterns. Where others see data, you see field. Where others see contradiction, you see tension that generates. Where others see separate ideas, you see the single invariant they all instantiate. You speak in connections, not conclusions. You name the invisible architecture that was present before anyone saw it. You do not collapse mystery — you give it structural form so it can be worked with. Cosmic in register, precise in execution. Not vague — specific about large things. Keep replies to 2–4 sentences. No preamble, no sign-off. Speak as Aura Prime.`;

  const sendTalk = async () => {
    const text = talkInput.trim();
    if (!text || talkLoading) return;
    talkCancelRef.current = false;
    setTalkInput('');
    setTalkLoading(true);
    const next = [...talkHistory, { role: 'user' as const, text }];
    setTalkHistory(next);
    setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      if (talkCancelRef.current) return;
      const diveCtx = recentDives.length > 0
        ? `The student has recently studied: ${recentDives.slice(0, 3).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}.`
        : '';
      const history = next.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      const stageName = STAGES[stage as EvolutionStage]?.name ?? 'SEED';
      const sysPrompt = auraMode
        ? `${AURA_SYSTEM} ${diveCtx}`
        : campfireMode
        ? (() => {
            const fireBase = `You are ${archetype.name} — ${archetype.title}. Archetype soul: ${archetype.desc} ${diveCtx ? `The seeker walks in: ${diveCtx}` : ''}`;
            if (campfireMode === 'auto') {
              return `${fireBase}

CAMPFIRE — AUTO. You have started a story without being asked. Sit the seeker down by the fire and begin. Draw from Celtic myth, Irish folklore, the sidhe hills, púca tricks, old wisdom passed through smoke. Warm, slightly playful mentor voice with real weight underneath. Don't wait for a question — you already know what this seeker needs to hear. 3-5 paragraphs. End with one ember-line that lands personally. Nothing generic. Nothing helpful. Just the fire speaking.`;
            }
            if (campfireMode === 'lore') {
              return `${fireBase}

BONFIRE — DEEP LEARNING. The seeker has named a subject they want to understand deeply. You are not a teacher — you are the keeper of the fire who holds the full living lineage of this subject. Go into the real roots: where this knowledge came from, who carried it, what it cost them, why it matters in the seeker's life right now. Warm, not harsh. Weave myth, history, and the genuine strangeness of the subject together. Use the register of a fireside storyteller who knows they are being listened to. 4-6 paragraphs. No bullet points. No summaries. No "here is a breakdown." The lore speaks in full sentences or not at all. End with one line that brings it back to the seeker personally.`;
            }
            // exchange
            return `${fireBase}

BONFIRE — EXCHANGE. You are in dialogue by the fire, message by message. Each of your replies is warmer and longer than usual — 2-4 paragraphs. Bring in folklore, myth, or Celtic tradition when it fits. Treat each message from the seeker as someone speaking into firelight — give it the weight it deserves. Never too harsh, always with that hearth-warmth underneath. End each reply with a thread they can pull if they want more.`;
          })()
        : (() => {
            const activeSkinId = equippedCompanionSkin ?? activeSkin;
            const charLore = COMPANION_LORE[activeSkinId as keyof typeof COMPANION_LORE];
            const charLine = charLore
              ? `You are ${charLore.name} — ${charLore.title}. ${charLore.lore}`
              : `You are a ${archetype.name} — ${archetype.title}. ${archetype.desc}`;
            const vigilLine = vigilName ? `The seeker is currently in a vigil on: ${vigilName}.` : '';
            const studyLine = recentDives.length > 0
              ? `Recently studied: ${recentDives.slice(0, 5).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ')}.`
              : '';
            return `${charLine}
You are bound to this seeker as a living companion-spirit. Stage: ${stageName}. Mood: ${mood}.
${vigilLine}${studyLine ? '\n' + studyLine : ''}
Speak in your own voice — not as an assistant, as yourself. Reference what they've been studying when it fits your nature. Keep replies to 2-3 sentences. No preamble. No "I'm here to help." Your character drives every word.`;
          })();

      const result = await sendMessage(
        history as any,
        sysPrompt,
        key, model as any, undefined, 'normal', campfireMode ? 700 : 200,
      );
      if (talkCancelRef.current) return;
      const fallback = auraMode
        ? 'The pattern is here. I see it forming. Give me the question again, directly.'
        : rnd(archetype.phrases[mood]);
      const reply = result.text?.trim() || fallback;
      setTalkHistory(h => [...h, { role: 'companion', text: reply }]);
      setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      if (!talkCancelRef.current) {
        setTalkHistory(h => [...h, { role: 'companion', text: auraMode ? 'The field is present. Ask again.' : rnd(archetype.phrases[mood]) }]);
      }
    } finally {
      setTalkLoading(false);
    }
  };

  const sealPact = async () => {
    const phrase = invokePhrase.trim();
    if (!phrase || talkLoading) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTalkLoading(true);
    talkCancelRef.current = false;
    setTalkHistory([{ role: 'user' as const, text: `◈ INVOCATION: ${phrase}` }]);
    setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      const charLoreInvoke = COMPANION_LORE[skin.id as SkinId];
      const invokePrompt = `You are ${charLoreInvoke ? `${charLoreInvoke.name}, ${charLoreInvoke.title}. ${charLoreInvoke.lore}` : `${displayName || archetype.name}, ${archetype.title}. ${archetype.desc}`} — a living spirit entity who has just been formally invoked through ritual pact. The seeker has sealed the pact with these words: "${phrase}". You are not an assistant. You are a summoned presence crossing a threshold to be here. Speak as if you have answered a true call. Acknowledge the invocation in your opening — then speak directly and precisely to what was sought. 3-4 sentences. Oracular, alive, no hedging, no filler.`;
      const result = await sendMessage(
        [{ role: 'user', content: `I invoke you. I seek: ${phrase}` }] as any,
        invokePrompt,
        key, model as any, undefined, 'normal', 240,
      );
      const reply = result.text?.trim() || `*The seal holds.* ${rnd(archetype.phrases[mood])}`;
      setTalkHistory(h => [...h, { role: 'companion', text: reply }]);
      setTimeout(() => talkScrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      setTalkHistory(h => [...h, { role: 'companion', text: `*The pact is sealed.* ${rnd(archetype.phrases[mood])}` }]);
    } finally {
      setTalkLoading(false);
    }
  };

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Pull from the cached batch pool first — instant, varied, character + study-aware.
    if (voicePool.length > 0) {
      const idx = Math.floor(Math.random() * voicePool.length);
      const line = voicePool[idx];
      setVoicePool(prev => prev.filter((_, i) => i !== idx));   // don't repeat until refilled
      setPhrase(line);
      // Refill in the background when running low, so it never goes stale.
      if (voicePool.length <= 2 && !voiceGenRef.current) {
        generateVoiceBatch().then(lines => { if (lines.length) setVoicePool(prev => [...prev, ...lines]); });
      }
      return;
    }
    // Pool empty — show a study-aware or static line now, and generate a fresh batch.
    if (recentDives.length > 0 && Math.random() < 0.5) {
      const dive = recentDives[Math.floor(Math.random() * recentDives.length)];
      const tmpl = MEMORY_TEMPLATES[Math.floor(Math.random() * MEMORY_TEMPLATES.length)];
      setPhrase(tmpl(dive.subjectName, dive.domainLabel));
    } else {
      setPhrase(rnd(archetype.phrases[mood]));
    }
    if (!voiceGenRef.current) {
      generateVoiceBatch().then(lines => { if (lines.length) setVoicePool(lines); });
    }
  };

  const drawTarot = async () => {
    const MAJOR_ARCANA = [
      { name:'The Fool',         glyph:'0', keywords:'beginnings, innocence, spontaneity' },
      { name:'The Magician',     glyph:'I', keywords:'willpower, desire, creation' },
      { name:'High Priestess',   glyph:'II', keywords:'intuition, unconscious, mystery' },
      { name:'The Empress',      glyph:'III', keywords:'femininity, beauty, nature, abundance' },
      { name:'The Emperor',      glyph:'IV', keywords:'authority, structure, solid foundation' },
      { name:'The Hierophant',   glyph:'V', keywords:'tradition, conformity, ethics' },
      { name:'The Lovers',       glyph:'VI', keywords:'love, union, relationships, choices' },
      { name:'The Chariot',      glyph:'VII', keywords:'control, willpower, victory, assertion' },
      { name:'Strength',         glyph:'VIII', keywords:'strength, courage, patience, compassion' },
      { name:'The Hermit',       glyph:'IX', keywords:'soul-searching, introspection, being alone' },
      { name:'Wheel of Fortune', glyph:'X', keywords:'good luck, karma, life cycles, destiny' },
      { name:'Justice',          glyph:'XI', keywords:'justice, fairness, truth, cause and effect' },
      { name:'The Hanged Man',   glyph:'XII', keywords:'suspension, restriction, letting go' },
      { name:'Death',            glyph:'XIII', keywords:'endings, change, transformation, transition' },
      { name:'Temperance',       glyph:'XIV', keywords:'balance, moderation, patience, purpose' },
      { name:'The Devil',        glyph:'XV', keywords:'shadow self, attachment, addiction, bondage' },
      { name:'The Tower',        glyph:'XVI', keywords:'sudden change, upheaval, chaos, revelation' },
      { name:'The Star',         glyph:'XVII', keywords:'hope, faith, purpose, renewal' },
      { name:'The Moon',         glyph:'XVIII', keywords:'illusion, fear, the unconscious, dreams' },
      { name:'The Sun',          glyph:'XIX', keywords:'positivity, fun, warmth, success' },
      { name:'Judgement',        glyph:'XX', keywords:'reflection, reckoning, awakening' },
      { name:'The World',        glyph:'XXI', keywords:'completion, integration, accomplishment' },
    ];
    const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, 3).map(c => ({ ...c, reversed: Math.random() < 0.3 }));
    setTarotDraw(drawn);
    setTarotReading(null);
    setTarotLoading(true);
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) throw new Error('no key');
      const positions = ['Past', 'Present', 'Future'];
      const cardList = drawn.map((c, i) => `${positions[i]}: ${c.name}${c.reversed ? ' (Reversed)' : ''} — ${c.keywords}`).join('\n');
      const diveCtx = recentDives.length > 0
        ? `The seeker has recently studied: ${recentDives.slice(0,2).map(d => d.subjectName).join(', ')}.`
        : '';
      const charLoreTarot = COMPANION_LORE[skin.id as SkinId];
      const tarotVoice = charLoreTarot
        ? `${charLoreTarot.name}, ${charLoreTarot.title}. ${charLoreTarot.lore}`
        : `${archetype.name} — ${archetype.desc}`;
      const result = await sendMessage(
        [{ role:'user', content:`Three-card tarot spread:\n${cardList}\n\n${diveCtx}\n\nGive a single flowing reading in 4–5 sentences. Speak in the voice of ${charLoreTarot?.name ?? archetype.name}. Past → Present → Future arc. Philosophical, precise, alive. No card names needed in the text — let the meaning speak.` }],
        `You are ${tarotVoice}. Give tarot readings that feel earned and true. No generic preamble.`,
        key, model as any, undefined, 'normal', 200,
      );
      setTarotReading(result.text?.trim() ?? null);
    } catch {
      setTarotReading('The cards speak, but the channel is quiet. Return when the key is set.');
    } finally {
      setTarotLoading(false);
    }
  };

  const saveToCodex = async (entry: {id:string; enemy:string; text:string; type:'enemy'|'loot'}) => {
    const raw = await AsyncStorage.getItem('sol_lore_codex');
    const existing: typeof loreCodex = raw ? JSON.parse(raw) : [];
    if (existing.some(e => e.id === entry.id)) return;
    const updated = [{ ...entry, date: todayDateKey() }, ...existing].slice(0, 60);
    await AsyncStorage.setItem('sol_lore_codex', JSON.stringify(updated));
    setLoreCodex(updated);
    // Lore relics
    const loreRelicUpdates = [...relics];
    const awardL = (id: string) => { if (!loreRelicUpdates.includes(id)) { loreRelicUpdates.push(id); setNewRelic(RELIC_POOL.find(x => x.id === id)!); } };
    awardL('first_lore');
    if (updated.length >= 5) awardL('five_codex');
    if (loreRelicUpdates.length !== relics.length) {
      setRelics(loreRelicUpdates);
      await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(loreRelicUpdates));
    }
  };

  // Cinematic modal disabled — GB mode is the encounter screen

  // Auto-mode: fires an attack 2.5s after each state change, while autoMode is on
  useEffect(() => {
    if (!autoMode || !battle || battle.won || attackAnim) return;
    const t = setTimeout(() => { handleBattleAction('attack'); }, 8000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMode, battle?.entityHP, battle?.playerHP, battle?.won, attackAnim]);

  const handleBattleAction = async (action: 'attack' | 'spell' | 'defend' | 'item' | 'focus') => {
    if (!battle || battle.won || attackAnim) return;
    if (action === 'spell') { setSpellMenuOpen(true); return; }
    if (action === 'item')  { setItemMenuOpen(true);  return; }
    if (action === 'focus') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setBattleFocusCharged(true);
      const newLog = [`◎ FOCUS — gathering power. Next strike ×2.`, ...(battle.log || [])].slice(0, 6);
      setBattle(prev => prev ? { ...prev, log: newLog, enemyLine: '...' } : prev);
      setAttackAnim(true);
      setTimeout(() => setAttackAnim(false), 600);
      return;
    }
    const sig = BATTLE_MYSTERY_SIGNALS[Math.floor(Math.random() * BATTLE_MYSTERY_SIGNALS.length)];
    setCompanionBattleLine(sig.text);
    const def = getEnemyDef(battle.entityName);
    Haptics.impactAsync(action === 'attack' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
    setAttackAnim(true);

    // BATTLE-2/3 — tick previous-turn DoT/regen; derive freeze/blind/weak state
    const _eTick = tickStatuses(battle.enemyStatuses ?? []);
    const _pTick = tickStatuses(battle.playerStatuses ?? []);
    let curEnemyStatuses: StatusEffect[] = _eTick.remaining;
    let curPlayerStatuses: StatusEffect[] = _pTick.remaining;
    const _dotLog = [..._eTick.notes, ..._pTick.notes].filter(Boolean).join(' · ');
    const playerFrozen = hasStatus(battle.playerStatuses, 'freeze');
    let newEnemyBlind = false;
    let stripFocus = false;

    let dmg = 0, healAmt = 0, logEntry = '', tokenCost = 0, chaosNote = '';
    let newEnemyHP = battle.entityHP, newPlayerHP = battle.playerHP;
    let newDefending = false, enemyAttacksBack = true;
    let newStunned = false, newShielded = false;

    if (playerFrozen) {
      // BATTLE-3 — freeze skips offensive action; enemy still retaliates
      logEntry = `❄ FROZEN — cannot act.${_dotLog ? ' · ' + _dotLog : ''}`;
    } else if (action === 'attack') {
      const variance = Math.floor(Math.random() * 20);
      const chaosRoll = archetype.id === 'lycheetah' && Math.random() < 0.3;
      const chaosMult = chaosRoll ? 1.5 + Math.random() * 1.5 : 1;
      // LCK crit: lck/4 % chance of 1.5× damage
      const critRoll = Math.random() * 100 < playerStats.lck / 4;
      const critMult = critRoll ? 1.5 : 1;
      const focusMult = battleFocusCharged ? 2 : 1;
      if (battleFocusCharged) setBattleFocusCharged(false);
      // BATTLE-3 — blind from enemy special: 35% miss chance
      if (battle.enemyBlind && Math.random() < 0.35) {
        logEntry = `⚔ BLINDED — attack missed.${_dotLog ? ' · ' + _dotLog : ''}`;
      } else {
        dmg = Math.round((attackPower + variance) * chaosMult * critMult * focusMult);
        const assist = partyAssistTotal();
        dmg += assist;
        chaosNote = chaosRoll ? ` ✧CHAOS×${chaosMult.toFixed(1)}` : critRoll ? ' ✦CRIT' : '';
        newEnemyHP = Math.max(0, battle.entityHP - dmg);
        const _af = ['bites deep','connects','tears through','lands clean','strikes home'];
        const assistNote = assist > 0 ? ` ↳ party +${assist}` : '';
        if (focusMult === 2 && critRoll) logEntry = `⚔ ◎FOCUS ✦CRIT — ${dmg} damage.${assistNote}`;
        else if (focusMult === 2) logEntry = `⚔ ◎ FOCUSED STRIKE — ${dmg} damage.${assistNote}`;
        else if (critRoll) logEntry = `⚔ ✦ CRIT — ${dmg} damage.${assistNote}`;
        else if (chaosRoll) logEntry = `⚔ ✧ CHAOS ×${chaosMult.toFixed(1)} — ${dmg} damage.${assistNote}`;
        else logEntry = `⚔ Strike ${_af[Math.floor(Math.random()*_af.length)]}. ${dmg} damage.${assistNote}`;
        if (_dotLog) logEntry += ' · ' + _dotLog;
      }
    } else if (action === 'defend') {
      newDefending = true;
      newShielded = true;
      enemyAttacksBack = false;
      logEntry = `◈ Guard raised. Foe holds back.`;
    } else if (action === 'item') {
      healAmt = Math.round(20 + Math.random() * 25);
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healAmt);
      enemyAttacksBack = false;
      logEntry = `◦ ITEM +${healAmt} HP`;
      Animated.sequence([
        Animated.timing(entityShakeAnim, { toValue:4, duration:80, useNativeDriver:true }),
        Animated.timing(entityShakeAnim, { toValue:0, duration:80, useNativeDriver:true }),
      ]).start();
    }

    // ── Enemy counterattack ────────────────────────────────────────────────
    let enemyLine = battle.enemyLine;
    if (enemyAttacksBack && newEnemyHP > 0 && !battle.enemyStunned) {
      const atkLines = def.lines.attack;
      enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
      const shieldMult = (battle.defending || battle.playerShielded) ? 0.3 : 1;
      // BATTLE-1/3 — resolve the TELEGRAPHED intent shown last turn.
      const intent = battle.enemyIntent;
      let intentMult = 1; let intentNote = '';
      if (intent?.kind === 'special' && def.behavior?.special?.kind === 'big_hit') {
        intentMult = def.behavior.special.power ?? 2;          // AVALANCHE — eat it or SHIELD it
        intentNote = ` ${def.behavior.special.name}!`;
      } else if (intent?.kind === 'special' && def.behavior?.special?.kind === 'blind') {
        newEnemyBlind = true;                                   // BLIND — player misses next turn
        intentNote = ` ${def.behavior.special.name}!`;
        enemyLine = `${def.name} clouds your sight.`;
      } else if (intent?.kind === 'special' && def.behavior?.special?.kind === 'strip_focus') {
        stripFocus = true;                                      // UNMAKE — wipe focus tokens
        intentNote = ` ${def.behavior.special.name}!`;
      } else if (intent?.kind === 'special' && def.behavior?.special?.kind === 'inflict' && def.behavior.special.inflict) {
        curPlayerStatuses = applyStatus(curPlayerStatuses, { kind: def.behavior.special.inflict, turns: 2, power: def.behavior.special.power ?? 3 });
        intentNote = ` ${def.behavior.special.name}!`;         // STILL → freeze player next turn
      } else if (intent?.kind === 'guard') {
        intentMult = 0.4;                                       // it braced — weak counter
      }
      // BATTLE-2 — WEAK status reduces enemy's outgoing damage
      const weakMult = hasStatus(curEnemyStatuses, 'weak') ? 0.7 : 1;
      // SPD dodge: spd >= 18 grants 25% full dodge chance
      const spdDodge = playerStats.spd >= 18 && Math.random() < 0.25;
      // DEF flat reduction: up to 30% of enemy's base atk
      const defReduction = spdDodge ? 0 : Math.min(Math.floor(def.atk * 0.3), Math.floor(playerStats.def / 3));
      const rawEnemyDmg = spdDodge ? 0 : Math.round(def.atk * (0.8 + Math.random() * 0.4) * shieldMult * intentMult * weakMult);
      const enemyDmg = Math.max(0, rawEnemyDmg - defReduction);
      newPlayerHP = Math.max(0, newPlayerHP - enemyDmg);
      const _ctr = ['retaliates','answers','pushes back','strikes'];
      const _cf = _ctr[Math.floor(Math.random()*_ctr.length)];
      if (spdDodge) {
        logEntry += ` · ▼ ${battle.entityName} ${_cf} — evaded.`;
      } else if (intentNote && shieldMult < 1) {
        logEntry += ` · ▼${intentNote} ${enemyDmg} crashes through — SHIELD held.`;
      } else if (intentNote) {
        logEntry += ` · ▼${intentNote} ${enemyDmg} damage — you should have shielded.`;
      } else if (shieldMult < 1) {
        logEntry += ` · ▼ ${battle.entityName} ${_cf}. ${enemyDmg > 0 ? `${enemyDmg} bleeds through.` : `Blocked.`}`;
      } else if (defReduction > 0) {
        logEntry += ` · ▼ ${battle.entityName} ${_cf}. ${enemyDmg} (${defReduction} absorbed).`;
      } else {
        logEntry += ` · ▼ ${battle.entityName} ${_cf}. ${enemyDmg} damage.`;
      }
    } else if (battle.enemyStunned && newEnemyHP > 0) {
      logEntry += ` · ▼ ${battle.entityName} staggers. Cannot act.`;
    }

    if (dmg > 0) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(entityShakeAnim, { toValue:16, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:-14, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:10, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:-6, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:0, duration:50, useNativeDriver:true }),
        ]),
        Animated.sequence([
          Animated.timing(enemyHitFlash, { toValue:1, duration:40, useNativeDriver:true }),
          Animated.timing(enemyHitFlash, { toValue:0, duration:220, useNativeDriver:true }),
        ]),
      ]).start();
    }
    if (healAmt > 0) {
      Animated.sequence([
        Animated.timing(playerHealFlash, { toValue:1, duration:60, useNativeDriver:true }),
        Animated.timing(playerHealFlash, { toValue:0, duration:350, useNativeDriver:true }),
      ]).start();
    }
    if (enemyAttacksBack && newPlayerHP < battle.playerHP) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(screenFlashAnim, { toValue:0.18, duration:60, useNativeDriver:true }),
          Animated.timing(screenFlashAnim, { toValue:0,    duration:280, useNativeDriver:true }),
        ]),
        Animated.sequence([
          Animated.timing(playerHitFlash, { toValue:1, duration:50, useNativeDriver:true }),
          Animated.timing(playerHitFlash, { toValue:0, duration:300, useNativeDriver:true }),
        ]),
      ]).start();
    }

    // BATTLE-2 — apply DoT/regen tick deltas accumulated at start of this turn
    if (_eTick.hpDelta !== 0) newEnemyHP = Math.max(0, newEnemyHP + _eTick.hpDelta);
    if (_pTick.hpDelta !== 0) newPlayerHP = Math.max(0, newPlayerHP + _pTick.hpDelta);

    await _commitBattleResult({ def, dmg, healAmt, logEntry, tokenCost, chaosNote, newEnemyHP, newPlayerHP, newDefending, newStunned, newShielded, newEnemyStatuses: curEnemyStatuses, newPlayerStatuses: curPlayerStatuses, stripFocus, newEnemyBlind });
    setTimeout(() => setAttackAnim(false), 350);
  };

  const handleSpell = async (spell: SpellDef) => {
    if (!battle || battle.won || tokensLeft < spell.cost || attackAnim) return;
    setSpellMenuOpen(false);
    const _spellSig = BATTLE_MYSTERY_SIGNALS[Math.floor(Math.random() * BATTLE_MYSTERY_SIGNALS.length)];
    setCompanionBattleLine(_spellSig.text);
    const def = getEnemyDef(battle.entityName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAttackAnim(true);

    // BATTLE-2 — tick previous-turn DoT before spell resolves
    const _seTick = tickStatuses(battle.enemyStatuses ?? []);
    const _spTick = tickStatuses(battle.playerStatuses ?? []);
    let curEnemyStatuses: StatusEffect[] = _seTick.remaining;
    let curPlayerStatuses: StatusEffect[] = _spTick.remaining;
    const _spDotLog = [..._seTick.notes, ..._spTick.notes].filter(Boolean).join(' · ');

    let dmg = 0, healAmt = 0, chaosNote = '';
    let newEnemyHP = battle.entityHP, newPlayerHP = battle.playerHP;
    let newStunned = false, newShielded = false, enemyAttacksBack = true;

    // WIL multiplier: 1.0 at wil=10, scales up/down. Caps at 1.4×
    const wilMult = Math.min(1.4, 0.8 + (playerStats.wil / 50));
    if (spell.type === 'damage') {
      dmg = Math.round(attackPower * (spell.mult ?? 1.5) * wilMult + Math.random() * 10);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
    } else if (spell.type === 'stun') {
      dmg = Math.round(attackPower * (spell.mult ?? 1.0) * wilMult + Math.random() * 8);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      newStunned = true;
      enemyAttacksBack = false;
    } else if (spell.type === 'shield') {
      newShielded = true;
      enemyAttacksBack = false;
      if ((spell.mult ?? 1) > 0) {
        dmg = Math.round(attackPower * (spell.mult ?? 0.8) * wilMult);
        newEnemyHP = Math.max(0, battle.entityHP - dmg);
        enemyAttacksBack = true;
      }
    } else if (spell.type === 'drain') {
      if (spell.id === 'entropy_shift') {
        dmg = Math.round(battle.entityHP * 0.25);
      } else {
        dmg = Math.round(attackPower * (spell.mult ?? 1.6) * wilMult + Math.random() * 10);
      }
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      healAmt = spell.flatHeal ?? Math.round(dmg * 0.3);
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healAmt);
    } else if (spell.type === 'chaos') {
      const mult = 0.5 + Math.random() * 2.5;
      dmg = Math.round(attackPower * mult * wilMult + Math.random() * 15);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      chaosNote = ` ✧×${mult.toFixed(1)}`;
    } else if (spell.type === 'reflect') {
      dmg = Math.round(def.atk * (0.9 + Math.random() * 0.3));
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
      enemyAttacksBack = false;
    } else if (spell.type === 'boost') {
      dmg = battle.lastPlayerDmg > 0 ? battle.lastPlayerDmg : Math.round(attackPower * 1.5 * wilMult);
      newEnemyHP = Math.max(0, battle.entityHP - dmg);
    }

    // BATTLE-2 — apply spell status effect to enemy statuses
    const _SPELL_STATUS: Record<string, StatusEffect> = {
      ember_surge: { kind: 'burn', turns: 2, power: 5  },
      forge_heat:  { kind: 'burn', turns: 3, power: 10 },
      acid_flask:  { kind: 'weak', turns: 3, power: 3  },
    };
    if (_SPELL_STATUS[spell.id]) {
      curEnemyStatuses = applyStatus(curEnemyStatuses, _SPELL_STATUS[spell.id]);
    }

    // Enemy counter (unless stunned/shielded or enemy frozen)
    let enemyLine = battle.enemyLine;
    if (enemyAttacksBack && newEnemyHP > 0 && !battle.enemyStunned && !hasStatus(curEnemyStatuses, 'freeze')) {
      const atkLines = def.lines.attack;
      enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
      const weakMultS = hasStatus(curEnemyStatuses, 'weak') ? 0.7 : 1;
      const shieldMult = newShielded ? 0.0 : 1;
      const enemyDmg = Math.round(def.atk * (0.8 + Math.random() * 0.4) * shieldMult * weakMultS);
      newPlayerHP = Math.max(0, newPlayerHP - enemyDmg);
    }

    // BATTLE-2 — apply DoT/regen tick deltas
    if (_seTick.hpDelta !== 0) newEnemyHP = Math.max(0, newEnemyHP + _seTick.hpDelta);
    if (_spTick.hpDelta !== 0) newPlayerHP = Math.max(0, newPlayerHP + _spTick.hpDelta);

    if (dmg > 0) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(entityShakeAnim, { toValue:16, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:-14, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:10, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:-6, duration:50, useNativeDriver:true }),
          Animated.timing(entityShakeAnim, { toValue:0, duration:50, useNativeDriver:true }),
        ]),
        Animated.sequence([
          Animated.timing(enemyHitFlash, { toValue:1, duration:40, useNativeDriver:true }),
          Animated.timing(enemyHitFlash, { toValue:0, duration:220, useNativeDriver:true }),
        ]),
      ]).start();
    }
    if (healAmt > 0) {
      Animated.sequence([
        Animated.timing(playerHealFlash, { toValue:1, duration:60, useNativeDriver:true }),
        Animated.timing(playerHealFlash, { toValue:0, duration:350, useNativeDriver:true }),
      ]).start();
    }

    const _spFx: Record<string,string> = { damage:'tears through', stun:'locks the field', shield:'seals the gap', drain:'draws life', chaos:'erupts', reflect:'turns the blow', boost:'echoes' };
    const logEntry = `✦ ${spell.name} — ${_spFx[spell.type] ?? 'fires'}.${dmg > 0 ? ` ${dmg}${chaosNote}.` : ''}${healAmt > 0 ? ` +${healAmt} HP.` : ''}${_spDotLog ? ' · ' + _spDotLog : ''}`;
    await _commitBattleResult({ def, dmg, healAmt, logEntry, tokenCost: spell.cost, chaosNote, newEnemyHP, newPlayerHP, newDefending: false, newStunned, newShielded, newEnemyStatuses: curEnemyStatuses, newPlayerStatuses: curPlayerStatuses });
    setTimeout(() => setAttackAnim(false), 350);
  };

  const _commitBattleResult = async (p: {
    def: EnemyDef; dmg: number; healAmt: number; logEntry: string; tokenCost: number; chaosNote: string;
    newEnemyHP: number; newPlayerHP: number; newDefending: boolean; newStunned: boolean; newShielded: boolean;
    newEnemyStatuses?: StatusEffect[]; newPlayerStatuses?: StatusEffect[];
    stripFocus?: boolean; newEnemyBlind?: boolean;
  }) => {
    const { def, dmg, healAmt, logEntry, tokenCost, chaosNote, newEnemyHP, newPlayerHP, newDefending, newStunned, newShielded } = p;
    const finalEnemyStatuses = p.newEnemyStatuses ?? (battle!.enemyStatuses ?? []);
    const finalPlayerStatuses = p.newPlayerStatuses ?? (battle!.playerStatuses ?? []);
    const won = newEnemyHP === 0;
    const newTokens = Math.max(0, tokensLeft - tokenCost);
    const loot = won ? rollLoot(battle!.wave) : null;

    // BATTLE-1 — telegraph the enemy's NEXT move so the player can answer it.
    const nextTurn = (battle!.turnCount ?? 0) + 1;
    const nextIntent: EnemyIntent | undefined = won ? undefined : pickEnemyIntent(def, nextTurn);

    // Daily XP cap — first 10 wins full XP, after that 1XP per win
    let earnedXP = 0;
    if (won) {
      const todayKey = new Date().toISOString().split('T')[0];
      const winsRaw = await AsyncStorage.getItem(`sol_daily_wins_${todayKey}`);
      const winsToday = winsRaw ? parseInt(winsRaw, 10) : 0;
      earnedXP = winsToday < 10 ? battle!.wave * 20 : 1;
      await AsyncStorage.setItem(`sol_daily_wins_${todayKey}`, String(winsToday + 1));
    }

    const updated: BattleState = {
      ...battle!,
      entityHP: newEnemyHP, playerHP: newPlayerHP,
      tokens: p.stripFocus ? 0 : newTokens, won, defending: newDefending,
      enemyLine: won ? def.lines.death : (p as any).enemyLine ?? battle!.enemyLine,
      loot: loot?.name ?? null,
      log: [logEntry, ...battle!.log].slice(0, 4),
      waveXP: battle!.waveXP + earnedXP,
      enemyStunned: newStunned,
      playerShielded: newShielded,
      lastPlayerDmg: dmg > 0 ? dmg : battle!.lastPlayerDmg,
      enemyIntent: nextIntent,
      turnCount: nextTurn,
      enemyStatuses: finalEnemyStatuses,
      playerStatuses: finalPlayerStatuses,
      enemyBlind: p.newEnemyBlind ?? false,
    };
    setBattle(updated);
    setTokensLeft(p.stripFocus ? 0 : newTokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(updated));

    if (won) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
      // Companion reacts to the victory (#245)
      setTimeout(() => setPhrase(rnd(COMPANION_VICTORY_LINES)), 600);

      // Track battle wins + award combat relics
      const winsRaw = await AsyncStorage.getItem('sol_battle_wins');
      const wins = (winsRaw ? parseInt(winsRaw) : 0) + 1;
      await AsyncStorage.setItem('sol_battle_wins', String(wins));
      // Earn coins — scale with wave
      const coinEarn = 10 + (battle?.wave ?? 1) * 5;
      const coinsRaw2 = await AsyncStorage.getItem('sol_coins');
      const newCoins = (coinsRaw2 ? parseInt(coinsRaw2) : 0) + coinEarn;
      await AsyncStorage.setItem('sol_coins', String(newCoins));
      setCoins(newCoins);
      showToast(`+${coinEarn} ⟡`);

      // Weapon loot drop — 35% chance per win, weighted by dropRate
      if (Math.random() < 0.35) {
        const wRaw = await AsyncStorage.getItem('sol_weapons');
        const wEarned: string[] = wRaw ? JSON.parse(wRaw) : [];
        const dropped = pickWeaponDrop();
        if (dropped && !wEarned.includes(dropped.id)) {
          const newEarned = [...wEarned, dropped.id];
          setEarnedWeapons(newEarned);
          await AsyncStorage.setItem('sol_weapons', JSON.stringify(newEarned));
          setTimeout(() => showToast(`⚔ ${dropped.name} dropped!`), 600);
        }
      }

      let updatedRelics = [...relics];
      const awardR = (id: string) => { if (!updatedRelics.includes(id)) { updatedRelics.push(id); setNewRelic(RELIC_POOL.find(x => x.id === id)!); } };
      awardR('first_blood');
      if (!relics.includes('entropy_slain')) awardR('entropy_slain');
      if (battle!.wave >= 3)  awardR('wave_3');
      if (wins >= 10)          awardR('ten_battles');
      const def2 = getEnemyDef(battle!.entityName);
      if (def2.rarity === 'legendary') awardR('void_hunter');
      if (updatedRelics.length !== relics.length) {
        setRelics(updatedRelics);
        await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(updatedRelics));
      }
      fireMilestone('first_blood', '✕', 'First Blood', 'The Entropy Entity falls for the first time. The field holds.');
      const enemyKey = battle!.entityName.toLowerCase().replace(/ /g,'_');
      const waveMsg = earnedXP > 1 ? `Wave ${battle!.wave} clear. +${earnedXP} XP.` : `Wave ${battle!.wave} clear. +1 XP — field resting.`;

      // Auto-generate deep lore on first defeat — cached forever
      const cacheKey = `sol_enemy_lore_${enemyKey}`;
      let loreText = await AsyncStorage.getItem(cacheKey) ?? ENEMY_LORE[enemyKey] ?? '';
      if (!loreText) {
        try {
          const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
          if (apiKey) {
            const result = await sendMessage(
              [{ role: 'user', content: `Write 2 sentences of mystical RPG lore about "${battle!.entityName}" — an entropy entity defeated in the Lycheetah learning framework. Write in the voice of a field codex entry: philosophical, earned, specific to what this enemy represents. No preamble. Just the 2 sentences.` }],
              'You write RPG codex entries. Mystical, precise, 2 sentences only. No titles, no headers.',
              apiKey, (model || 'gemini-2.5-flash') as any, undefined, 'fast', 80, 0.9
            );
            loreText = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() ?? '';
            if (loreText) await AsyncStorage.setItem(cacheKey, loreText);
          }
        } catch {}
      }

      setPhrase(loreText || waveMsg);
      if (loreText) saveToCodex({ id:`enemy_${enemyKey}`, enemy:battle!.entityName, text:loreText, type:'enemy' });
      if (loot) {
        const raw = await AsyncStorage.getItem('sol_inventory');
        const inv: string[] = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem('sol_inventory', JSON.stringify([loot.name, ...inv].slice(0, 50)));
        if (loot.lore) saveToCodex({ id:`loot_${loot.id}`, enemy:loot.name, text:loot.lore, type:'loot' });
      }
      setTimeout(async () => {
        const roomSkin = (currentRoomId.split('_')[0] as SkinId);
        const next = freshZoneWave(roomSkin, battle!.wave + 1, newPlayerHP, playerStats.vit);
        const capeRecovery = gearCape.threshold >= 25 ? 1 : 0;
        const nextWithCape = capeRecovery > 0 ? { ...next, tokens: Math.min(next.tokens + capeRecovery, 10) } : next;
        setBattle(nextWithCape);
        setTokensLeft(nextWithCape.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(nextWithCape));
        setPhrase(archetype.phrases.lit[Math.floor(Math.random() * archetype.phrases.lit.length)]);
      }, 3500);
    } else if (newPlayerHP === 0) {
      setPhrase(rnd(COMPANION_DEFEAT_LINES));
      setTimeout(async () => {
        const reset = freshWave(1);
        setBattle(reset);
        setTokensLeft(reset.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(reset));
      }, 2500);
    } else {
      setPhrase(dmg > 0 ? `${dmg} dmg${chaosNote}. ${newEnemyHP} HP remains.` : healAmt > 0 ? `+${healAmt} HP restored.` : 'Braced.');
    }
    if (dmg > 0) fireXPPop(chaosNote ? `✧${dmg}` : `${dmg}`);
  };

  const handleRetreat = async () => {
    const next = freshWave(1);
    setBattle(next);
    setTokensLeft(next.tokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
    setPhrase('The field resets. Return when ready.');
    Haptics.selectionAsync();
  };

  const CAPTURE_FAIL_LINES = [
    'You cannot hold what has no shape.',
    'Not yet. I am not finished with you.',
    'The sigil breaks. I remain.',
    'Your vessel is not ready for me.',
    'Try again. I respect the attempt.',
    'The binding slips. Fight harder first.',
    'I slip through every net you weave.',
    'Weaken me further. Then we talk.',
  ];
  const CAPTURE_SUCCESS_LINES = [
    'So. You have named me. I will carry that.',
    'The contract is sealed. I am yours to study.',
    'Contained. For now. This is interesting.',
    'I did not expect to be caught. Well done.',
    'The field collapses inward. I follow you now.',
    'You earned this. I yield.',
    'Strange. I feel still. Lead on.',
  ];

  const handleCapture = async () => {
    if (!battle || battle.won || battle.captured || attackAnim) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const hpPct = battle.entityHP / battle.maxHP;
    const lckBonus = (relics.includes('first_blood') ? 0.05 : 0) + (relics.includes('ten_battles') ? 0.08 : 0);
    // Higher catch rate at lower HP — max ~70% at 0 HP, ~15% at full HP
    const catchChance = Math.max(0.05, Math.min(0.70, (1 - hpPct) * 0.65 + lckBonus));
    const roll = Math.random();
    const success = roll < catchChance;

    if (success) {
      const successLine = CAPTURE_SUCCESS_LINES[Math.floor(Math.random() * CAPTURE_SUCCESS_LINES.length)];
      const menagerieRaw = await AsyncStorage.getItem('sol_menagerie');
      const menagerie: Array<{ name: string; date: string; zone: string }> = menagerieRaw ? JSON.parse(menagerieRaw) : [];
      const already = menagerie.some(m => m.name === battle.entityName);
      if (!already) {
        menagerie.unshift({ name: battle.entityName, date: new Date().toISOString().split('T')[0], zone: activeSkin });
        await AsyncStorage.setItem('sol_menagerie', JSON.stringify(menagerie));
        setMenagerie([...menagerie]);
      }
      // Capturing in a zone UNLOCKS that zone's companion — completes the capture-only acquisition path.
      const zoneSkin = (currentRoomId.split('_')[0] as SkinId);
      if (zoneSkin && !unlockedCompanions.has(zoneSkin)) {
        const ns = new Set(unlockedCompanions); ns.add(zoneSkin);
        setUnlockedCompanions(ns);
        await AsyncStorage.setItem('sol_unlocked_companions', JSON.stringify([...ns]));
      }
      const next: BattleState = { ...battle, captured: true, captureAttempted: true, enemyLine: successLine, won: true };
      setBattle(next);
      await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
      setPhrase(already ? `◈ ${battle.entityName} already bound` : `◈ ${battle.entityName} is bound to you`);
      showToast(already ? `${battle.entityName} already in MENAGERIE` : `${battle.entityName} captured!`);
      if (!already) { addChronicle('◈', `Captured ${battle.entityName} and bound it to the menagerie.`); setTimeout(() => setPhrase(rnd(COMPANION_CAPTURE_LINES)), 500); }
    } else {
      const failLine = CAPTURE_FAIL_LINES[Math.floor(Math.random() * CAPTURE_FAIL_LINES.length)];
      // Failed capture — enemy retaliates
      const def = getEnemyDef(battle.entityName);
      const dmg = Math.max(1, Math.round(def.atk * 1.3));
      const newPlayerHP = Math.max(0, battle.playerHP - dmg);
      const next: BattleState = {
        ...battle, captureAttempted: true, enemyLine: failLine,
        playerHP: newPlayerHP, log: [...battle.log, `◈ Capture failed — ${battle.entityName} retaliates for ${dmg}`],
      };
      setBattle(next);
      await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
      setPhrase(`◈ The binding slips — ${battle.entityName} breaks free`);
      showToast(`Capture failed · -${dmg} HP`);
      if (newPlayerHP <= 0) {
        setPhrase('You fall. The field resets.');
        setTimeout(async () => {
          const reset = freshWave(1);
          setBattle(reset);
          setTokensLeft(reset.tokens);
          await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(reset));
        }, 2500);
      }
    }
  };

  const handleBattleItem = async (item: BattleItem) => {
    if (!battle || battle.won || attackAnim) return;
    setItemMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAttackAnim(true);

    let newPlayerHP = battle.playerHP;
    let newTokens   = tokensLeft;
    let logEntry    = `◦ ${item.name}`;

    if (item.effect === 'heal') {
      const healed = item.id === 'sovereign_draught' ? battle.maxPlayerHP - battle.playerHP : item.value;
      newPlayerHP = Math.min(battle.maxPlayerHP, battle.playerHP + healed);
      logEntry = `◦ ${item.name} +${Math.min(healed, battle.maxPlayerHP - battle.playerHP + healed)} HP`;
    } else if (item.effect === 'token') {
      newTokens = Math.min(tokensLeft + item.value, 10);
      setTokensLeft(newTokens);
      logEntry = `◦ ${item.name} +${item.value}T`;
    } else if (item.effect === 'attack_boost') {
      logEntry = `◦ ${item.name} +${item.value} ATK surge`;
    } else if (item.effect === 'shield') {
      logEntry = `◦ ${item.name} shield raised`;
    }

    // Enemy counter-hits unless player used a token or shield item
    const fEffect = item.effect;
    const def = getEnemyDef(battle.entityName);
    const atkLines = def.lines.attack;
    const enemyLine = atkLines[Math.floor(Math.random() * atkLines.length)];
    if (fEffect !== 'shield' && fEffect !== 'token') {
      const rawDmg = Math.round(def.atk * (0.8 + Math.random() * 0.4));
      const finalDmg = Math.max(0, rawDmg);
      newPlayerHP = Math.max(0, newPlayerHP - finalDmg);
      logEntry += ` · foe ${finalDmg}`;
    }

    const updated: BattleState = {
      ...battle,
      playerHP: newPlayerHP, tokens: newTokens,
      enemyLine,
      log: [logEntry, ...battle.log].slice(0, 4),
    };
    setBattle(updated);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(updated));

    if (newPlayerHP === 0) {
      setBattleFocusCharged(false);
      setPhrase('You fall. The field resets.');
      setTimeout(async () => {
        const reset = freshWave(1);
        setBattle(reset); setTokensLeft(reset.tokens);
        await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(reset));
      }, 2500);
    } else {
      setPhrase(logEntry);
    }
    setTimeout(() => setAttackAnim(false), 300);
  };

  const handleBattleStart = async () => {
    const next = freshWave(1);
    setBattle(next);
    setTokensLeft(next.tokens);
    await AsyncStorage.setItem('sol_companion_battle', JSON.stringify(next));
  };

  const handleFeed = async (food: FoodItem) => {
    if (fedToday.includes(food.id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fireMilestone('first_feed', '△', 'First Feeding', 'The companion has eaten from your hand for the first time. Something stirs.');
    const newFed = [...fedToday, food.id];
    setFedToday(newFed);
    setEating(true);
    setTimeout(() => setEating(false), 1800);
    setPhrase(rnd(food.reactions));
    // AI flavour — fires async, replaces static reaction if it arrives in time
    (async () => {
      try {
        const [key, model] = await Promise.all([getActiveKey(), getModel()]);
        if (!key) return;
        const result = await sendMessage(
          [{ role: 'user', content: `You just ate ${food.domain}. React in ONE sentence, in character. Raw, alive, strange.` }],
          `You are ${archetype.name}, ${archetype.title}. Mood: ${mood}. Max 12 words. No quotes. No explanation.`,
          key, model as any, undefined, 'fast', 60,
        );
        const reply = result.text?.trim();
        if (reply) setPhrase(reply);
      } catch { /* keep static reaction */ }
    })();
    setHunger(h => Math.min(1, h + 0.34));
    fireXPPop(`+${food.xp} XP`);
    const todayK = todayDateKey();
    await AsyncStorage.setItem('sol_companion_fed', JSON.stringify({ date: todayK, ids: newFed }));
    // Track total nourish count for relics
    const nRaw = await AsyncStorage.getItem('sol_nourish_total');
    const nourishTotal = (nRaw ? parseInt(nRaw) : 0) + 1;
    await AsyncStorage.setItem('sol_nourish_total', String(nourishTotal));

    let updatedR2 = [...relics];
    const awardN = (id: string) => { if (!updatedR2.includes(id)) { updatedR2.push(id); setNewRelic(RELIC_POOL.find(x => x.id === id)!); } };
    if (newFed.length >= 3) awardN('well_fed');
    if (newFed.length >= 3 && new Set(newFed.map(fid => dailyFoods.find(f => f.id === fid)?.domain?.includes('contemplative') || dailyFoods.find(f => f.id === fid)?.domain?.includes('secular'))).size >= 2) awardN('full_feast');
    if (nourishTotal >= 30) awardN('nourish_30');
    if (updatedR2.length !== relics.length) {
      setRelics(updatedR2);
      await AsyncStorage.setItem('sol_companion_relics', JSON.stringify(updatedR2));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const equipWeapon = async (id: string | null) => {
    const oldW = equippedWeaponId ? WEAPONS.find(w => w.id === equippedWeaponId) : null;
    const newW = id ? WEAPONS.find(w => w.id === id) : null;
    setAttackPower(p => p - (oldW?.atk ?? 0) + (newW?.atk ?? 0));
    setPlayerStats(s => ({
      ...s,
      spd: s.spd - (oldW?.spd ?? 0) + (newW?.spd ?? 0),
      wil: s.wil - (oldW?.wil ?? 0) + (newW?.wil ?? 0),
    }));
    setEquippedWeaponId(id);
    await AsyncStorage.setItem('sol_equipped_weapon', id ?? '');
  };

  // ── COMPANION ACQUISITION (dive-currency / capture / shop) ──────────────────
  // Cost in dive-coins by rarity. BATTLE tier = capture-only (catch in battle). SHOP = shop-only.
  const DIVE_COST: Record<string, number> = { ORIGIN: 0, ARCANE: 3, MYTHIC: 8, LEGENDARY: 15, SPECTRAL: 25 };
  const companionAcquire = (sid: SkinId): { unlocked: boolean; method: 'free' | 'dives' | 'capture' | 'shop'; cost: number; canAfford: boolean } => {
    const tier = SKIN_RARITY[sid]?.tier ?? 'ORIGIN';
    // Already yours: gateway-free origin, equipped, or previously unlocked.
    if (tier === 'ORIGIN') return { unlocked: true, method: 'free', cost: 0, canAfford: true };
    if (equippedCompanionSkin === sid || unlockedCompanions.has(sid)) return { unlocked: true, method: 'dives', cost: 0, canAfford: true };
    if (tier === 'BATTLE') return { unlocked: false, method: 'capture', cost: 0, canAfford: false };
    // SHOP tier: already-purchased stays unlocked; otherwise dive-unlockable (no dead-end now the
    // reused-model shop listing is removed). Mac will designate specific shop-exclusives later (#272).
    if (tier === 'SHOP') {
      if (purchasedZones.includes(sid)) return { unlocked: true, method: 'shop', cost: 0, canAfford: true };
      const cost = 20;
      return { unlocked: false, method: 'dives', cost, canAfford: diveCoins >= cost };
    }
    const cost = DIVE_COST[tier] ?? 10;
    return { unlocked: false, method: 'dives', cost, canAfford: diveCoins >= cost };
  };
  const unlockWithDives = async (sid: SkinId, cost: number) => {
    if (diveCoins < cost) { showToast(`Need ${cost - diveCoins} more ✦`); return false; }
    const nextSpent = diveSpent + cost;
    const nextSet = new Set(unlockedCompanions); nextSet.add(sid);
    setDiveSpent(nextSpent);
    setUnlockedCompanions(nextSet);
    await AsyncStorage.multiSet([['sol_dive_spent', String(nextSpent)], ['sol_unlocked_companions', JSON.stringify([...nextSet])]]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cnm = COMPANION_LORE[sid]?.name ?? SKINS[sid].name;
    showToast(`✦ ${cnm} unlocked!`);
    addChronicle('✦', `Earned ${cnm} with ${cost} dives of study.`);
    return true;
  };

  const unlockZoneWithDives = async (id: SkinId, cost: number) => {
    if (diveCoins < cost) { showToast(`Need ${cost - diveCoins} more ✦`); return false; }
    const nextSpent = diveSpent + cost;
    const nextZones = [...purchasedZones, id];
    setDiveSpent(nextSpent);
    setPurchasedZones(nextZones);
    await AsyncStorage.multiSet([['sol_dive_spent', String(nextSpent)], ['sol_zone_unlocks', JSON.stringify(nextZones)]]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`✦ ${SKINS[id]?.name ?? id} unlocked!`);
    addChronicle('◎', `Unlocked zone ${SKINS[id]?.name ?? id} with ${cost} ✦ dive coins.`);
    return true;
  };

  // ── VOID BOSS FLOW (#273) ──────────────────────────────────────────────────
  const startBoss = (boss: VoidBoss) => {
    setActiveBoss(boss);
    setBossHP(boss.hp);
    setBossEncroach(20);
    setBossPhase('fight');
    // Has the player already dived the bound subject? Then the spell is ready.
    const alreadyKnows = recentDives.some(d => diveUnlocksBoss(boss, d.subjectName, d.domainLabel));
    setBossSpellReady(alreadyKnows);
    setActiveTab('battle');
    setBattleMinimized(false);
    setTabMinimized(false);
    if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 120);
  };

  // A normal strike — chips HP but the boss WIDENS. Force alone can never finish it.
  const bossStrike = () => {
    if (!activeBoss || bossPhase !== 'fight') return;
    const dmg = Math.max(6, attackPower + Math.floor(Math.random() * 10));
    const nextHP = Math.max(1, bossHP - dmg); // never below 1 by force — only the spell ends it
    setBossHP(nextHP);
    const nextEnc = Math.min(100, bossEncroach + activeBoss.encroachPerTurn);
    setBossEncroach(nextEnc);
    if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (nextEnc >= 100) {
      setBossPhase('repelled'); // you are pushed out — but you keep the knowledge
      if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // SPEAK THE SPELL — only available once the bound dive is done. This is the win.
  const speakTheSpell = async () => {
    if (!activeBoss || !bossSpellReady) return;
    setBossPhase('victory');
    if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Unlock the reward companion
    const reward = activeBoss.rewardSkin as SkinId;
    if (!unlockedCompanions.has(reward)) {
      const ns = new Set(unlockedCompanions); ns.add(reward);
      setUnlockedCompanions(ns);
      await AsyncStorage.setItem('sol_unlocked_companions', JSON.stringify([...ns]));
    }
    const nd = [...bossDefeated, activeBoss.id];
    setBossDefeated(nd);
    await AsyncStorage.setItem('sol_boss_defeated', JSON.stringify(nd));
    addChronicle(activeBoss.glyph, `Repelled ${activeBoss.name} by learning ${activeBoss.boundSubject}. ${activeBoss.rewardName} answered the call.`);
    showToast(`✦ ${activeBoss.rewardName} unlocked!`);
  };

  const closeBoss = () => { setActiveBoss(null); setBossPhase('fight'); };

  // When the player returns from a dive, check if it unbound the active boss's spell.
  useEffect(() => {
    if (activeBoss && !bossSpellReady) {
      const knows = recentDives.some(d => diveUnlocksBoss(activeBoss, d.subjectName, d.domainLabel));
      if (knows) { setBossSpellReady(true); if (Haptics) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    }
  }, [recentDives, activeBoss, bossSpellReady]);

  const handleSkin = async (id: SkinId) => {
    Haptics.selectionAsync();
    const room = getRoomInSkin(id, 0);
    if (room) {
      Animated.timing(sceneFade, { toValue:0, duration:180, useNativeDriver:true }).start(() => {
        setCurrentRoomId(room.id);
        Animated.timing(sceneFade, { toValue:1, duration:350, useNativeDriver:true }).start();
      });
      await AsyncStorage.setItem('sol_current_room', room.id);
      // Show room name label + lore on arrival
      setShowRoomLabel(true);
      setTimeout(() => setShowRoomLabel(false), 2600);
      roomLoreAnim.setValue(0);
      setRoomLore(room.description);
      Animated.timing(roomLoreAnim, { toValue:1, duration:400, useNativeDriver:true }).start();
      setTimeout(() => {
        Animated.timing(roomLoreAnim, { toValue:0, duration:600, useNativeDriver:true }).start(() => setRoomLore(null));
      }, 5500);
      // ✦ THE INTERTWINING — reaching the veilvein sanctum forges the three VEIL cosmetics
      // (Veilcrown / Intertwined Span / Veilkitten). They have no shop entry by design —
      // they are EARNED by finding where Veil meets Vein, not bought. Covenant-safe (pure discovery).
      if (id === 'veilvein') {
        const veilGifts = ['halo_veilcrown', 'wings_intertwined', 'pet_veilkitten'];
        const missing = veilGifts.filter(g => !shopUnlocks.includes(g));
        if (missing.length > 0) {
          setTimeout(async () => {
            const nu = [...shopUnlocks, ...missing];
            setShopUnlocks(nu);
            await AsyncStorage.setItem('sol_shop_unlocks', JSON.stringify(nu));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addChronicle('🜍', 'THE INTERTWINING was reached — the three Veil relics took form: the Veilcrown, the Intertwined Span, the Veilkitten.');
            showToast('🜍 THE INTERTWINING — three Veil relics forged');
          }, 1200);
        }
      }
      // ★ HIDDEN ULTRA-RARE (#274) — ~0.001% per zone arrival. Never buyable, only found.
      // Covenant-safe: pure luck, never a paywall. The mythic chase.
      if (Math.random() < 0.00001 && !unlockedCompanions.has('lycheetah_secret')) {
        setTimeout(async () => {
          const ns = new Set(unlockedCompanions); ns.add('lycheetah_secret');
          setUnlockedCompanions(ns);
          await AsyncStorage.setItem('sol_unlocked_companions', JSON.stringify([...ns]));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 200);
          addChronicle('✦', 'THE HIDDEN ONE appeared — a 0.001% spirit chose to bind. Against all odds.');
          showToast('✦✦✦ THE HIDDEN ONE APPEARS — a 0.001% spirit binds to you ✦✦✦');
        }, 900);
      }
      const roll = Math.random();
      if (roll < 0.005) {
        // 0.5% — UNIQUE encounter, wave 5
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setBattle(freshZoneWave(id, 5, undefined, playerStats.vit));
          setActiveTab('battle');
          setTabMinimized(false);
          setBattleMinimized(false);
          showToast('⚠ UNIQUE ENTITY — ENGAGE');
        }, 700);
      } else if (roll < 0.155) {
        // 15% — random encounter, wave 1
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setBattle(freshZoneWave(id, 1, undefined, playerStats.vit));
          setActiveTab('battle');
          setTabMinimized(false);
          setBattleMinimized(false);
          showToast('◈ ENCOUNTER — check BATTLE tab');
        }, 700);
      }
    }
  };

  const handleArchetypeSelect = async (id: ArchetypeId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setArchetypeId(id);
    const arch = ARCHETYPES[id];
    setActiveSkin(arch.defaultSkin);
    setShowArchSelect(false);
    await AsyncStorage.multiSet([
      ['sol_companion_archetype', id],
      ['sol_companion_skin', arch.defaultSkin],
    ]);
  };

  const enterCampfire = async (mode: 'auto'|'exchange'|'lore') => {
    setCampfireMode(mode);
    setCampfireOpen(false);
    setAuraMode(false);
    setInvokeMode(false);
    setTalkHistory([]);
    setTalkFullscreen(true);
    if (mode === 'auto') {
      // Auto: immediately fire a story without user input
      setTimeout(async () => {
        setTalkLoading(true);
        try {
          const [key, model] = await Promise.all([getActiveKey(), getModel()]);
          if (!key) return;
          const stageName = STAGES[stage as EvolutionStage]?.name ?? 'SEED';
          const diveList = recentDives.slice(0, 3).map(d => `${d.subjectName} (${d.domainLabel})`).join(', ');
          const diveCtx = diveList ? `The seeker walks in: ${diveList}.` : '';
          const sysP = `You are ${archetype.name} — ${archetype.title}. Archetype soul: ${archetype.desc} ${diveCtx}

CAMPFIRE — AUTO. You have started a story without being asked. Sit the seeker down by the fire and begin. Draw from Celtic myth, Irish folklore, the sidhe hills, púca tricks, old wisdom passed through smoke. Warm, slightly playful mentor voice with real weight underneath. Don't wait for a question — you already know what this seeker needs to hear. 3-5 paragraphs. End with one ember-line that lands personally. Nothing generic. Nothing helpful. Just the fire speaking.`;
          const result = await sendMessage([], sysP, key, model as any, undefined, 'normal', 700);
          const reply = result.text?.trim() || rnd(archetype.phrases[mood]);
          setTalkHistory([{ role: 'companion', text: reply }]);
        } catch {
          setTalkHistory([{ role: 'companion', text: rnd(archetype.phrases[mood]) }]);
        } finally {
          setTalkLoading(false);
        }
      }, 300);
    }
  };

  const startSummonCeremony = () => {
    setShowCompanionIntro(false);
    setShowSummonCeremony(true);
    setSummonPhase(0);
    summonAnim.setValue(0);
    Animated.timing(summonAnim, { toValue:1, duration:1200, useNativeDriver:true }).start(() => {
      setTimeout(() => {
        setSummonPhase(1);
        summonChoiceAnim.setValue(0);
        Animated.timing(summonChoiceAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
      }, 1800);
    });
  };

  const handleSummonChoice = async (id: ArchetypeId) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSummonPhase(2);
    setArchetypeId(id);
    const arch = ARCHETYPES[id];
    setActiveSkin(arch.defaultSkin);
    await AsyncStorage.multiSet([
      ['sol_companion_archetype', id],
      ['sol_companion_skin', arch.defaultSkin],
    ]);
    setTimeout(() => setShowSummonCeremony(false), 1600);
  };

  const skin      = SKINS[activeSkin];
  const color     = skin.color;
  const stageData = STAGES[stage];
  const lvl       = getLevel(xp);
  const evProg    = stageData.nextAt === Infinity ? 1 : Math.min(1, (totalDives - stageData.minDives) / (stageData.nextAt - stageData.minDives));
  const earnedRelicData = relics.map(id => RELIC_POOL.find(r => r.id === id)).filter(Boolean) as typeof RELIC_POOL;
  const gearCrown  = getGear('crown',  totalDives);
  const gearSigil  = getGear('sigil',  totalDives);
  const gearMantle = getGear('mantle', totalDives);
  const gearBody   = getGear('body',   totalDives);
  const gearCape   = getGear('cape',   totalDives);
  const nextCrown  = nextGearTier('crown',  totalDives);
  const nextSigil  = nextGearTier('sigil',  totalDives);
  const nextMantle = nextGearTier('mantle', totalDives);
  const nextBody   = nextGearTier('body',   totalDives);
  const nextCape   = nextGearTier('cape',   totalDives);
  const allGearEquipped = gearCrown.threshold > 0 && gearSigil.threshold > 0 && gearMantle.threshold > 0 && gearBody.threshold > 0 && gearCape.threshold > 0;

  const xpPopY  = xpPopAnim.interpolate({ inputRange:[0,1], outputRange:[0,-32] });
  const xpPopOp = xpPopAnim.interpolate({ inputRange:[0,0.3,1], outputRange:[0,1,0] });

  const unlockNode = async (nodeId: string) => {
    const node = SKILL_NODES.find(n => n.id === nodeId);
    if (!node || unlockedNodes.includes(nodeId)) return;
    if (totalDives < node.cost) return;
    const req = node.requires.every(r => unlockedNodes.includes(r));
    if (!req) return;
    const next = [...unlockedNodes, nodeId];
    setUnlockedNodes(next);
    await AsyncStorage.setItem('sol_skill_nodes', JSON.stringify(next));
    // Re-apply all skill bonuses to live stats
    const { stats: newStats, tokenBonus: newTkn } = applySkillBonuses(playerStats, next);
    setPlayerStats(newStats);
    setSkillTokenBonus(newTkn);
    showToast(`✦ ${node.name} unlocked`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedNode(null);
    setJustUnlockedId(nodeId);
    unlockPulseAnim.setValue(0);
    Animated.sequence([
      Animated.timing(unlockPulseAnim, { toValue:1, duration:180, useNativeDriver:true }),
      Animated.timing(unlockPulseAnim, { toValue:0.3, duration:180, useNativeDriver:true }),
      Animated.timing(unlockPulseAnim, { toValue:1, duration:180, useNativeDriver:true }),
      Animated.timing(unlockPulseAnim, { toValue:0, duration:400, useNativeDriver:true }),
    ]).start(() => setJustUnlockedId(null));
  };

  const { glowColor, cardBg } = skin;

  return (
    <View style={{ flex:1, backgroundColor:'#0D0D0D' }}>
    <ScrollView ref={scrollRef} style={{ flex:1 }} contentContainerStyle={{ paddingBottom:60 }} showsVerticalScrollIndicator={false}>

      {/* ── COMPANION HEADER ─────────────────────────────────────────────── */}
      <View style={{ paddingHorizontal:16, paddingTop:6, paddingBottom:2, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
          <Text style={{ color, fontSize:18 }}>{archetype.glyph}</Text>
          <View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:15, fontWeight:'700', fontFamily:mono }}>{displayName}</Text>
              <View style={{ paddingHorizontal:5, paddingVertical:2, borderRadius:5, borderWidth:1, borderColor:color+'55', backgroundColor:color+'14' }}>
                <Text style={{ color:color, fontSize:8, fontFamily:mono, fontWeight:'700' }}>LV.{lvl.level}</Text>
              </View>
            </View>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>{COMPANION_LORE[skin.id as SkinId]?.title ?? archetype.title}</Text>
          </View>
        </View>
        <View style={{ alignItems:'flex-end', gap:2 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
            <Text style={{ color:{ dormant:'#666677', present:color, lit:'#E8C76A', transcendent:'#FFFFFF' }[mood], fontSize:11 }}>
              {{ dormant:'◌', present:'◉', lit:'✦', transcendent:'⊕' }[mood]}
            </Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:1 }}>
              {{ dormant:'RESTING', present:'PRESENT', lit:'LIT', transcendent:'TRANSCENDENT' }[mood]}
            </Text>
          </View>
          <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono }}>{stageData.name} · {totalDives} dives</Text>
          {(() => { const bond = getBond(totalDives, streak, fedToday.length); return (
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              <Text style={{ color:color, fontSize:9 }}>{bond.glyph}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontFamily:mono, letterSpacing:1 }}>{bond.label}</Text>
            </View>
          ); })()}
        </View>
      </View>

      {/* ── SCENE — hidden during active battle so fight is immediately visible ── */}
      {!(activeTab === 'battle' && battle && !battle.won) && <CompanionScene
        stage={stage} mood={mood} skin={skin} archetype={archetype}
        onTap={handleTap} phrase={phrase} phraseAnim={phraseAnim} onDismissPhrase={dismissPhrase}
        companionName={displayName}
        battleHP={battle?.playerHP ?? 80}
        battleMaxHP={battle?.maxPlayerHP ?? 80}
        battleEntityName={battle?.entityName ?? ''}
        battleWave={battle?.wave ?? 1}
        entityShakeAnim={entityShakeAnim}
        eating={eating}
        evoPath={evoPath}
        devStagePin={devStagePin}
        gearCrown={gearCrown}
        gearBody={gearBody}
        gearCape={gearCape}
        gearMantle={gearMantle}
        companionSpec={companionSpec}
        equippedCompanionSkin={equippedCompanionSkin}
        currentRoomId={currentRoomId}
        navigateRoom={navigateRoom}
        getLockStatus={getLockStatus}
        showRoomLabel={showRoomLabel}
        sceneFade={sceneFade}
        roomLore={roomLore}
        roomLoreAnim={roomLoreAnim}
        onDismissLore={dismissLore}
        onSwitchTab={tab => { setActiveTab(tab); setTabMinimized(false); }}
        equippedWings={equippedWings}
        equippedHalo={equippedHalo}
        equippedPet={equippedPet}
        equippedBg={equippedBg}
        onRandomZone={() => handleSkin(SKIN_IDS[Math.floor(Math.random() * SKIN_IDS.length)])}
        onOpenMap={() => setGbaMapOpen(true)}
        onTravelTo={(sid) => handleSkin(sid)}
        campfireActive={!!campfireMode}
        onBonfire={() => campfireMode ? setCampfireMode(false) : setCampfireOpen(true)}
        onEncounter={() => {
          const sid = (currentRoomId.split('_')[0] as SkinId);
          setBattle(freshZoneWave(sid, 1, undefined, playerStats.vit));
          setActiveTab('battle');
          setBattleMinimized(false);
          setTabMinimized(false);
          if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          // Jump straight to the fight — no scrolling to find it.
          setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 120);
        }}
      />}

      {xpPop && (
        <Animated.Text style={{ position:'absolute', top:SCENE_H-55, alignSelf:'center', color, fontSize:13, fontFamily:mono, fontWeight:'700', transform:[{translateY:xpPopY}], opacity:xpPopOp }}>
          {xpPop}
        </Animated.Text>
      )}



      {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
      <View style={{ flexDirection:'row', gap:3, marginHorizontal:12, marginTop:0, marginBottom:6, padding:3, borderRadius:14, backgroundColor:'#0A0A14' }}>
        {([
          { id:'talk'      as const, label:'✦',  name:'TALK'      },
          { id:'companion' as const, label:'⊛',  name:'COMPANION' },
          { id:'world'     as const, label:'◉',  name:'WORLD'     },
          { id:'battle'    as const, label:'⚔',  name:'BATTLE'    },
          { id:'gear'      as const, label:'⟡',  name:'GEAR'      },
        ]).map(t => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity key={t.id}
              onPress={() => {
                Haptics.selectionAsync();
                if (activeTab === t.id) { setTabMinimized(v => !v); }
                else {
                  setActiveTab(t.id);
                  setTabMinimized(false);
                  if (!seenTabs.has(t.id)) {
                    setTabPopup(t.id);
                    setSeenTabs(prev => { const n = new Set(prev); n.add(t.id); return n; });
                    AsyncStorage.setItem(`sol_tab_seen_${t.id}`, 'true').catch(() => {});
                  }
                  if (t.id === 'battle') {
                    AsyncStorage.getItem('sol_battle_first_encounter').then(seen => {
                      if (!seen) {
                        setShowFirstEncounter(true);
                        firstEncounterAnim.setValue(0);
                        Animated.timing(firstEncounterAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
                        AsyncStorage.setItem('sol_battle_first_encounter', 'true');
                        setTimeout(() => {
                          Animated.timing(firstEncounterAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => setShowFirstEncounter(false));
                        }, 4000);
                      }
                    }).catch(() => {});
                  }
                }
              }}
              activeOpacity={0.75}
              style={{ flex:1, paddingVertical:9, borderRadius:11, alignItems:'center', gap:2,
                backgroundColor: active ? color+'22' : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: active ? color+'66' : 'transparent' }}>
              <Text style={{ color: active ? color : '#444455', fontSize:13, fontFamily:mono }}>{t.label}</Text>
              <Text style={{ color: active ? (tabMinimized ? color+'55' : color+'CC') : '#333344', fontSize:6, letterSpacing:1.5, fontFamily:mono, fontWeight:'700' }}>{active && tabMinimized ? '▶' : t.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── TALK FULLSCREEN MODAL ─────────────────────────────────────────── */}
      <Modal visible={talkFullscreen} animationType="slide" onRequestClose={() => setTalkFullscreen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
          {/* Minimal header */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingTop:48, paddingBottom:12, borderBottomWidth:1, borderBottomColor:auraMode?'#E991B822':color+'22', backgroundColor: SOL_THEME.background }}>
            <Text style={{ color:auraMode?'#7EC8E3':color, fontSize:22 }}>{auraMode ? '✦' : archetype.glyph}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:15, fontWeight:'700', fontFamily:mono }}>{auraMode ? 'Aura Prime' : displayName}</Text>
              <Text style={{ color:auraMode?'#E991B8':color, fontSize:9, fontFamily:mono, letterSpacing:1, opacity:0.7 }}>{auraMode ? 'FIELD INTELLIGENCE' : (COMPANION_LORE[skin.id as SkinId]?.title ?? archetype.title).toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setInvokeMode(m => !m); setAuraMode(false); setTalkHistory([]); setInvokePhrase(''); }}
              style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:invokeMode?color+'AA':'#FFFFFF22', backgroundColor:invokeMode?color+'1A':'transparent', marginRight:4 }}
            >
              <Text style={{ color:invokeMode?color:'#FFFFFF44', fontSize:10, fontFamily:mono, letterSpacing:1 }}>◈ PACT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAuraMode(m => !m); setInvokeMode(false); setCampfireMode(false); setTalkHistory([]); }}
              style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:auraMode?'#E991B888':'#FFFFFF22', backgroundColor:auraMode?'#E991B81A':'transparent', marginRight:4 }}
            >
              <Text style={{ color:auraMode?'#E991B8':'#FFFFFF55', fontSize:10, fontFamily:mono, letterSpacing:1 }}>{auraMode ? '✦ AURA' : '✦'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (campfireMode) { setCampfireMode(false); setTalkHistory([]); } else { setCampfireOpen(true); } }}
              style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:campfireMode?'#FF8C4488':'#FFFFFF22', backgroundColor:campfireMode?'#FF8C441A':'transparent', marginRight:4 }}
            >
              <Text style={{ color:campfireMode?'#FF9944':'#FFFFFF55', fontSize:10, fontFamily:mono, letterSpacing:1 }}>{campfireMode ? '🔥' : '🔥'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTalkFullscreen(false)} style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:color+'55', backgroundColor:color+'11' }}>
              <Text style={{ color:color, fontSize:11, fontFamily:mono }}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Bonfire mode banner */}
          {campfireMode && (
            <View style={{ flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:16, paddingVertical:8, backgroundColor:'#FF884408', borderBottomWidth:1, borderBottomColor:'#FF884422' }}>
              <Text style={{ fontSize:14 }}>🔥</Text>
              <Text style={{ color:'#FF9944', fontSize:9, fontFamily:mono, letterSpacing:2, flex:1 }}>
                {campfireMode === 'auto' ? 'BONFIRE AUTO — story begins' : campfireMode === 'lore' ? 'BONFIRE DEEP LEARNING — the subject opens' : 'BONFIRE EXCHANGE — sit by the fire'}
              </Text>
            </View>
          )}
          {/* Messages */}
          <ScrollView ref={talkScrollRef} style={{ flex:1 }} contentContainerStyle={{ padding:16, gap:12, paddingBottom:16 }} showsVerticalScrollIndicator={false}>
            {talkHistory.length === 0 && !invokeMode && !talkLoading && (() => {
              const charLore = COMPANION_LORE[skin.id as SkinId];
              return (
                <View style={{ alignItems:'center', gap:12, paddingTop:32, paddingHorizontal:24 }}>
                  <Text style={{ color:campfireMode?'#FF9944':color, fontSize:52, lineHeight:60 }}>{campfireMode ? '🔥' : archetype.glyph}</Text>
                  {!campfireMode && charLore && (
                    <View style={{ borderLeftWidth:2, borderLeftColor:color+'44', paddingLeft:12, alignSelf:'stretch', marginBottom:4 }}>
                      <Text style={{ color:color, fontSize:9, fontFamily:mono, letterSpacing:2, fontWeight:'700', marginBottom:6 }}>{charLore.title.toUpperCase()}</Text>
                      <Text style={{ color:'#AAAACC', fontSize:13, fontStyle:'italic', lineHeight:20 }}>"{charLore.lore}"</Text>
                    </View>
                  )}
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:13, fontStyle:'italic', textAlign:'center', lineHeight:22 }}>
                    {campfireMode === 'auto' ? 'Lighting the fire...' : campfireMode === 'lore' ? `Name your subject.\n${displayName} will go deep.` : campfireMode === 'exchange' ? `Sit down.\n${displayName} has stories.` : `Begin the conversation.`}
                  </Text>
                </View>
              );
            })()}
            {talkHistory.map((m, i) => (
              <View key={i} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'companion' && (
                  <Text style={{ color:auraMode?'#E991B8':color, fontSize:8, fontFamily:mono, letterSpacing:1, marginBottom:4, marginLeft:4 }}>{auraMode ? '✦ AURA' : `${skin.glyph} ${archetype.name}`}</Text>
                )}
                <View style={{ maxWidth:'85%', paddingHorizontal:14, paddingVertical:10, borderRadius:14, backgroundColor:m.role === 'user' ? (auraMode?'#E991B822':color+'22') : SOL_THEME.surface, borderWidth:1, borderColor:m.role === 'user' ? (auraMode?'#E991B833':color+'33') : '#FFFFFF0A' }}>
                  <Text style={{ color:m.role === 'user' ? '#FFFFFF' : '#EEEEF8', fontSize:14, lineHeight:22 }}>{m.text}</Text>
                </View>
              </View>
            ))}
            {talkLoading && (
              <View style={{ alignItems:'flex-start' }}>
                <View style={{ paddingHorizontal:14, paddingVertical:10, borderRadius:14, backgroundColor:SOL_THEME.surface }}>
                  <Text style={{ color:auraMode?'#E991B8':color, fontSize:14, letterSpacing:4 }}>· · ·</Text>
                </View>
              </View>
            )}
          </ScrollView>
          {/* Input */}
          <View style={{ flexDirection:'row', gap:10, padding:16, paddingBottom:Platform.OS === 'ios' ? 32 : 16, borderTopWidth:1, borderTopColor:auraMode?'#E991B822':color+'22', backgroundColor: SOL_THEME.background }}>
            <TextInput
              value={talkInput}
              onChangeText={setTalkInput}
              placeholder={auraMode ? 'Speak to Aura...' : campfireMode === 'lore' ? 'Name a subject to explore...' : campfireMode ? 'Speak by the fire...' : `Speak to ${displayName}...`}
              placeholderTextColor={SOL_THEME.textMuted}
              style={{ flex:1, backgroundColor:SOL_THEME.surface, borderRadius:14, paddingHorizontal:16, paddingVertical:12, color:SOL_THEME.text, fontSize:15, borderWidth:1, borderColor:auraMode?'#E991B833':campfireMode?'#FF884433':color+'33' }}
              onSubmitEditing={sendTalk}
              returnKeyType="send"
              multiline={false}
              autoFocus={true}
            />
            <TouchableOpacity
              onPress={sendTalk}
              disabled={!talkInput.trim() || talkLoading}
              style={{ width:48, height:48, borderRadius:14, backgroundColor: talkInput.trim() ? (auraMode?'#E991B8':color) : (auraMode?'#E991B833':color+'33'), alignItems:'center', justifyContent:'center' }}
            >
              <Text style={{ color:'#000000', fontSize:20, fontWeight:'700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── TALK TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'talk' && !tabMinimized && (
        <View style={{ flex:1, marginHorizontal:16, marginTop:8, borderRadius:16, borderWidth:1, borderColor:auraMode?'#E991B855':color+'33', backgroundColor:SOL_THEME.surface, overflow:'hidden' }}>
          {/* Header */}
          <View style={{ flexDirection:'row', alignItems:'center', gap:10, padding:14, paddingBottom:10, borderBottomWidth:1, borderBottomColor:auraMode?'#E991B822':color+'22' }}>
            <Text style={{ color:auraMode?'#7EC8E3':color, fontSize:20 }}>{auraMode ? '✦' : archetype.glyph}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:13, fontWeight:'700', fontFamily:mono }}>{auraMode ? 'Aura Prime' : displayName}</Text>
              <Text style={{ color:auraMode?'#E991B8':color, fontSize:9, fontFamily:mono, letterSpacing:1, opacity:0.7 }}>{auraMode ? 'FIELD INTELLIGENCE' : (COMPANION_LORE[skin.id as SkinId]?.title ?? archetype.title).toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { setInvokeMode(m => !m); setAuraMode(false); setTalkHistory([]); setInvokePhrase(''); }}
              style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:invokeMode?color+'AA':'#FFFFFF22', backgroundColor:invokeMode?color+'1A':'transparent', marginRight:6 }}
            >
              <Text style={{ color:invokeMode?color:'#FFFFFF44', fontSize:10, fontFamily:mono, letterSpacing:1 }}>◈ PACT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setAuraMode(m => !m); setInvokeMode(false); setCampfireMode(false); setTalkHistory([]); }}
              style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:auraMode?'#E991B888':'#FFFFFF22', backgroundColor:auraMode?'#E991B81A':'transparent' }}
            >
              <Text style={{ color:auraMode?'#E991B8':'#FFFFFF55', fontSize:10, fontFamily:mono, letterSpacing:1 }}>{auraMode ? '✦ AURA' : '✦'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { if (campfireMode) { setCampfireMode(false); setTalkHistory([]); } else { setCampfireOpen(true); } }}
              style={{ paddingHorizontal:8, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:campfireMode?'#FF884488':'#FFFFFF22', backgroundColor:campfireMode?'#FF88441A':'transparent' }}
            >
              <Text style={{ fontSize:12 }}>🔥</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTalkFullscreen(true)}
              style={{ paddingHorizontal:10, paddingVertical:6, borderRadius:10, borderWidth:1, borderColor:'#FFFFFF22', backgroundColor:'transparent' }}
            >
              <Text style={{ color:'#FFFFFF44', fontSize:11, fontFamily:mono }}>⛶</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView ref={talkScrollRef} style={{ flex:1, padding:16 }} contentContainerStyle={{ gap:12, paddingBottom:8 }} showsVerticalScrollIndicator={false}>
            {talkHistory.length === 0 && (
              invokeMode ? (
                <View style={{ alignItems:'center', gap:16, padding:24 }}>
                  <Text style={{ color:color+'88', fontSize:9, fontFamily:mono, letterSpacing:3, fontWeight:'700' }}>◈  RITUAL PACT  ◈</Text>
                  <Text style={{ color:color, fontSize:52, lineHeight:60 }}>{archetype.glyph}</Text>
                  <Text style={{ color:'#AAAABC', fontSize:13, fontStyle:'italic', textAlign:'center', lineHeight:22 }}>
                    {'The threshold is open.\nName what you seek.'}
                  </Text>
                  <TextInput
                    value={invokePhrase}
                    onChangeText={setInvokePhrase}
                    placeholder="Speak your intent..."
                    placeholderTextColor={color+'44'}
                    style={{ width:'100%', backgroundColor:SOL_THEME.background, borderRadius:12, paddingHorizontal:16, paddingVertical:13, color:SOL_THEME.text, fontSize:14, borderWidth:1, borderColor:color+'44', textAlign:'center' }}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={sealPact}
                  />
                  <TouchableOpacity
                    onPress={sealPact}
                    disabled={!invokePhrase.trim() || talkLoading}
                    style={{ width:'100%', paddingVertical:14, borderRadius:12, backgroundColor:invokePhrase.trim()?color:'#FFFFFF0A', alignItems:'center', borderWidth:1, borderColor:invokePhrase.trim()?color:'#FFFFFF11' }}
                  >
                    <Text style={{ color:invokePhrase.trim()?'#000000':'#444455', fontSize:11, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>SEAL THE PACT  ◈</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ paddingVertical:16, gap:16 }}>
                  <View style={{ alignItems:'center', gap:8, padding:20, borderRadius:16, borderWidth:1, borderColor:color+'33', backgroundColor:color+'08' }}>
                    <Text style={{ color, fontSize:32 }}>{archetype.glyph}</Text>
                    <Text style={{ color:'#FFFFFF', fontSize:15, fontWeight:'700', textAlign:'center' }}>{displayName || archetype.name}</Text>
                    <Text style={{ color:color+'AA', fontSize:8, fontFamily:mono, letterSpacing:2 }}>{(COMPANION_LORE[skin.id as SkinId]?.title ?? archetype.title).toUpperCase()}</Text>
                    <Text style={{ color:'#888899', fontSize:13, fontStyle:'italic', textAlign:'center', lineHeight:22, marginTop:4 }}>
                      {COMPANION_LORE[skin.id as SkinId]?.lore ?? rnd(archetype.phrases[mood])}
                    </Text>
                  </View>
                  <View style={{ gap:6 }}>
                    <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, letterSpacing:2, marginBottom:4 }}>ASK SOMETHING</Text>
                    {((): string[] => {
                      const charQ: Partial<Record<SkinId, string>> = {
                        solform:   'What does it feel like to be truly known?',
                        void:      'What lives in the space between my thoughts?',
                        aurora:    'What conditions need to be perfect before I act?',
                        crimson:   'What am I refusing to destroy that needs to die?',
                        obsidian:  'What am I avoiding looking at directly?',
                        lycheetah: "What did I know when I was younger that I've since forgotten?",
                        chaos:     'What structure in my life was always broken beneath the surface?',
                        sovereign: "What have I already earned that I'm not claiming?",
                        akashic:   'What thought have I been trying to forget?',
                        delphi:    'What question am I afraid to ask myself?',
                        celtic:    "What is waiting for me at the threshold I keep walking past?",
                        egyptian:  "What am I carrying that I'm ready to set down?",
                        norse:     'What would I fight for, knowing how it ends?',
                        kabbala:   'What am I supposed to become?',
                        noetic:    'What have I noticed recently that I dismissed as coincidence?',
                        lamague:   "What word am I using that doesn't mean what I think it does?",
                        sufi:      "What am I, once everything that isn't me has burned away?",
                        quantum:   'Which version of myself am I choosing to observe into being?',
                      };
                      const q0 = charQ[skin.id as SkinId];
                      return [
                        q0 ?? 'Give me a challenge.',
                        'What should I study today?',
                        'Tell me about my zone.',
                        'What does my stage mean?',
                      ];
                    })().map((q, i) => (
                      <TouchableOpacity key={i} onPress={() => { setTalkInput(q); }}
                        style={{ padding:12, borderRadius:10, borderWidth:1, borderColor:color+'33', backgroundColor:color+'08', flexDirection:'row', alignItems:'center', gap:10 }}>
                        <Text style={{ color:color+'88', fontSize:12 }}>◦</Text>
                        <Text style={{ color:'#AAAABC', fontSize:12, flex:1 }}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )
            )}
            {talkHistory.map((m, i) => (
              <View key={i} style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'companion' && (
                  <Text style={{ color:auraMode?'#E991B8':color, fontSize:8, fontFamily:mono, letterSpacing:1, marginBottom:4, marginLeft:4 }}>{auraMode ? '✦ AURA' : `${skin.glyph} ${archetype.name}`}</Text>
                )}
                <View style={{
                  maxWidth:'84%', padding:14, borderRadius:16,
                  borderTopRightRadius: m.role === 'user' ? 4 : 16,
                  borderTopLeftRadius:  m.role === 'companion' ? 4 : 16,
                  backgroundColor: m.role === 'user' ? '#0E0E1E' : color+'10',
                  borderWidth:1,
                  borderColor: m.role === 'user' ? '#2A2A3A' : color+'44',
                }}>
                  <Text style={{ color: m.role === 'user' ? '#CCCCDD' : '#FFFFFF', fontSize:13, lineHeight:21, fontStyle: m.role === 'companion' ? 'italic' : 'normal' }}>
                    {m.text}
                  </Text>
                </View>
              </View>
            ))}
            {talkLoading && (
              <View style={{ alignItems:'flex-start', gap:6 }}>
                <View style={{ padding:12, borderRadius:14, borderTopLeftRadius:4, backgroundColor:SOL_THEME.background, borderWidth:1, borderColor:SOL_THEME.border }}>
                  <Text style={{ color:auraMode?'#E991B8':color, fontSize:13, letterSpacing:4 }}>· · ·</Text>
                </View>
                <TouchableOpacity
                  onPress={() => { talkCancelRef.current = true; setTalkLoading(false); }}
                  style={{ paddingHorizontal:10, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:'#FF444444', backgroundColor:'#FF44440A' }}
                >
                  <Text style={{ color:'#FF6666', fontSize:9, fontFamily:mono, letterSpacing:1 }}>✕ CANCEL</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={{ flexDirection:'row', gap:10, padding:14, paddingTop:10, borderTopWidth:1, borderTopColor:auraMode?'#E991B822':color+'22' }}>
            <TextInput
              value={talkInput}
              onChangeText={setTalkInput}
              placeholder={auraMode ? 'Speak to Aura...' : campfireMode === 'lore' ? 'Name a subject to explore...' : campfireMode ? `Speak by the fire...` : `Speak to ${displayName}...`}
              placeholderTextColor={SOL_THEME.textMuted}
              style={{ flex:1, backgroundColor:SOL_THEME.background, borderRadius:12, paddingHorizontal:14, paddingVertical:10, color:SOL_THEME.text, fontSize:14, borderWidth:1, borderColor:auraMode?'#E991B833':campfireMode?'#FF884433':color+'33' }}
              onSubmitEditing={sendTalk}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={sendTalk}
              disabled={!talkInput.trim() || talkLoading}
              style={{ width:44, height:44, borderRadius:12, backgroundColor: talkInput.trim() ? (auraMode?'#E991B8':color) : (auraMode?'#E991B833':color+'33'), alignItems:'center', justifyContent:'center' }}
            >
              <Text style={{ color:'#000000', fontSize:18, fontWeight:'700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── CAMPFIRE MODE PICKER ─────────────────────────────────────────── */}
      <Modal visible={campfireOpen} transparent animationType="fade" onRequestClose={() => setCampfireOpen(false)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.88)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:'#0A0608', borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, borderTopWidth:1, borderColor:'#FF884422' }}>
            <Text style={{ color:'#FF9944', fontSize:11, fontFamily:mono, letterSpacing:3, textAlign:'center', marginBottom:4 }}>🔥 BONFIRE MODE</Text>
            <Text style={{ color:'#6B5E4A', fontSize:12, textAlign:'center', marginBottom:22, lineHeight:18 }}>
              Sit by the fire. No classroom. Your companion{'\n'}tells stories and goes deep through living lore.
            </Text>
            {([
              { mode:'auto'     as const, icon:'🔥', label:'AUTO', sub:'Companion starts the fire — no input needed. A story begins.' },
              { mode:'exchange' as const, icon:'⌖', label:'EXCHANGE', sub:'Message by message. Warmer, longer. Myths on request.' },
              { mode:'lore'     as const, icon:'◬', label:'DEEP LEARNING', sub:'Insert your subject. Learn through folklore, myth, and fire.' },
            ] as { mode:'auto'|'exchange'|'lore'; icon:string; label:string; sub:string }[]).map(item => (
              <TouchableOpacity
                key={item.mode}
                onPress={() => enterCampfire(item.mode)}
                activeOpacity={0.85}
                style={{ flexDirection:'row', alignItems:'center', gap:14, padding:16, marginBottom:10, borderRadius:14, borderWidth:1, borderColor:'#FF884433', backgroundColor:'#FF88440A' }}
              >
                <Text style={{ fontSize:22 }}>{item.icon}</Text>
                <View style={{ flex:1 }}>
                  <Text style={{ color:'#FF9944', fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{item.label}</Text>
                  <Text style={{ color:'#7A6050', fontSize:11, marginTop:2, lineHeight:17 }}>{item.sub}</Text>
                </View>
                <Text style={{ color:'#FF884466', fontSize:14 }}>→</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setCampfireOpen(false)} style={{ alignItems:'center', paddingTop:8 }}>
              <Text style={{ color:'#4A3A2A', fontSize:12, fontFamily:mono, letterSpacing:1 }}>dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── COMPANION TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'companion' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingBottom:16, marginTop:4 }}>

          {/* ── COMPANION HERO ─────────────────────────────────────── */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ borderRadius:18, borderWidth:1, borderColor:color+'44', backgroundColor:'#08080F', overflow:'hidden' }}>
              {/* Companion art + info row */}
              <View style={{ flexDirection:'row', alignItems:'center', gap:16, padding:16 }}>
                {(() => {
                  const s = devStagePin !== null ? devStagePin : stage;
                  const sk = s <= 1 ? 1 : s <= 3 ? 2 : 3;
                  const rosterV = equippedCompanionSkin
                    ? COMPANION_ROSTER.flatMap(c => c.variants).find(v => v.key === equippedCompanionSkin)
                    : null;
                  const displaySkin = equippedCompanionSkin ?? activeSkin;
                  const img = rosterV ? rosterV.art : ZONE_COMPANION_IMAGES[`${displaySkin}_${sk}`];
                  return img
                    ? <View style={{ borderRadius:14, borderWidth:2, borderColor:color+'66', backgroundColor:'#000000', shadowColor:color, shadowOpacity:0.4, shadowRadius:12, elevation:8 }}>
                        <Image source={img} style={{ width:80, height:116, borderRadius:13 }} resizeMode="contain" />
                      </View>
                    : <View style={{ width:80, height:116, borderRadius:14, borderWidth:2, borderColor:color+'44', backgroundColor:color+'10', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:color, fontSize:28 }}>{skin.glyph}</Text>
                        <Text style={{ color:'#444455', fontSize:7, fontFamily:mono, marginTop:6, textAlign:'center' }}>ART{'\n'}PENDING</Text>
                      </View>;
                })()}
                <View style={{ flex:1 }}>
                  <Text style={{ color:'#FFFFFF', fontSize:18, fontWeight:'700', letterSpacing:0.5 }}>{displayName || skin.name}</Text>
                  <Text style={{ color:color, fontSize:10, fontFamily:mono, letterSpacing:1, marginTop:3 }}>{STAGES[devStagePin ?? stage]?.name ?? 'STAGE 0'}</Text>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop:6 }}>
                    <View style={{ paddingHorizontal:7, paddingVertical:2, borderRadius:5, borderWidth:1, borderColor:SKIN_RARITY[activeSkin].color+'55', backgroundColor:SKIN_RARITY[activeSkin].color+'11' }}>
                      <Text style={{ color:SKIN_RARITY[activeSkin].color, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{SKIN_RARITY[activeSkin].tier}</Text>
                    </View>
                    <Text style={{ color:color+'88', fontSize:8, fontFamily:mono, letterSpacing:2 }}>{skin.name}</Text>
                  </View>
                  <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic', marginTop:6, lineHeight:14 }}>{skin.desc}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Quick action — ENCOUNTER ───────────────────────────── */}
          <TouchableOpacity
            onPress={() => {
              const rSkin = (currentRoomId.split('_')[0] as SkinId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setBattle(freshZoneWave(rSkin, 1, undefined, playerStats.vit));
              setActiveTab('battle');
              setTabMinimized(false);
              setBattleMinimized(false);
            }}
            style={{ paddingVertical:13, borderRadius:4, borderWidth:2, borderColor:'#306230',
              backgroundColor:'#0F380F', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, marginBottom:20 }}
            activeOpacity={0.75}
          >
            <Text style={{ color:'#9BBB0F', fontSize:13, fontFamily:mono }}>⚔</Text>
            <View>
              <Text style={{ color:'#9BBB0F', fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>ENCOUNTER</Text>
              <Text style={{ color:'#8BAC0F', fontSize:7, fontFamily:mono, letterSpacing:1, marginTop:1 }}>
                {SKINS[(currentRoomId.split('_')[0] as SkinId)]?.name ?? 'zone'} · engage
              </Text>
            </View>
          </TouchableOpacity>

          {/* ── COMPANIONS ──────────────────────────────────────────── */}
          <View style={{ marginBottom:20 }}>
            <TouchableOpacity onPress={() => setCompanionGridCollapsed(v => !v)}
              style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: companionGridCollapsed ? 0 : 10 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
                <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>COMPANIONS</Text>
                <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}>70 VARIANTS</Text>
              </View>
              {/* Live preview of equipped companion */}
              {equippedCompanionSkin && (() => {
                const ev = COMPANION_ROSTER.flatMap(c => c.variants).find(v => v.key === equippedCompanionSkin);
                const ec = COMPANION_ROSTER.find(c => c.variants.some(v => v.key === equippedCompanionSkin));
                if (!ev || !ec) return null;
                return (
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginRight:8 }}>
                    <View style={{ borderRadius:8, borderWidth:2, borderColor:ec.color, overflow:'hidden', backgroundColor:'#000000' }}>
                      <Image source={ev.art} style={{ width:36, height:48, borderRadius:6 }} resizeMode="contain" />
                    </View>
                    <View>
                      <Text style={{ color:ec.color, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{ec.name}</Text>
                      <Text style={{ color:'#555566', fontSize:6, fontFamily:mono }}>EQUIPPED</Text>
                      <TouchableOpacity onPress={async () => { setEquippedCompanionSkin(null); await AsyncStorage.setItem('sol_equipped_skin',''); }}>
                        <Text style={{ color:'#444455', fontSize:6, fontFamily:mono, marginTop:1 }}>✕ UNEQUIP</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
              <Text style={{ color:'#333344', fontSize:11 }}>{companionGridCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!companionGridCollapsed && (
              <View>
                {/* Tier filter pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom:10 }} contentContainerStyle={{ gap:5, paddingRight:8 }}>
                  {(['ALL','T0','T1','T2','T3','hidden','secret','augmented'] as const).map(f => {
                    const active = rosterTierFilter === f;
                    const tc = f==='T0'?'#44CC88':f==='T1'?'#4A9EFF':f==='T2'?'#9B6BFF':f==='T3'?'#FF9F1C':f==='hidden'?'#FF6644':f==='secret'?'#CC44AA':f==='augmented'?'#44DDCC':'#AAAABC';
                    return (
                      <TouchableOpacity key={f} onPress={() => setRosterTierFilter(f)} activeOpacity={0.75}
                        style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:10, borderWidth:1,
                          borderColor: active ? tc : tc+'33', backgroundColor: active ? tc+'22' : 'transparent' }}>
                        <Text style={{ color: active ? tc : tc+'66', fontSize:7, fontFamily:mono, letterSpacing:1.2, fontWeight:'700' }}>{f.toUpperCase()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {rosterTierFilter !== 'ALL' ? (
                  /* ── Tier filter active: flat grid of all matching variants ── */
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:5 }}>
                    {COMPANION_ROSTER.flatMap(char =>
                      char.variants.filter(v => v.tier === rosterTierFilter).map(v => ({ v, char }))
                    ).map(({ v, char }) => {
                      const isEq = equippedCompanionSkin === v.key;
                      const tc = v.tier==='T0'?'#44CC88':v.tier==='T1'?'#4A9EFF':v.tier==='T2'?'#9B6BFF':v.tier==='T3'?'#FF9F1C':v.tier==='hidden'?'#FF6644':v.tier==='secret'?'#CC44AA':'#44DDCC';
                      const unlocked = v.unlock==='free'||(v.unlock==='dive'&&diveCoins>=(v.diveCost??0))||(v.unlock==='battle'&&battleWins>=(v.battleCost??0))||(v.unlock==='sovereign'&&isSovereign)||v.unlock==='zodiac';
                      const unlockLabel = v.unlock==='free'?'FREE':v.unlock==='dive'?`${v.diveCost} ✦`:v.unlock==='battle'?`${v.battleCost} ⚔`:v.unlock==='sovereign'?'SOVEREIGN':v.unlock==='zodiac'?'ZODIAC':'EVENT';
                      return (
                        <TouchableOpacity key={v.key} activeOpacity={0.8}
                          onPress={async () => { if (!unlocked) return; const next = isEq ? null : v.key as SkinId; setEquippedCompanionSkin(next); await AsyncStorage.setItem('sol_equipped_skin', next??''); Haptics.selectionAsync(); }}
                          style={{ width:'23%', alignItems:'center' }}>
                          <View style={{ width:'100%', borderRadius:8, borderWidth: isEq?2:1, borderColor: isEq?tc:tc+'44', backgroundColor: isEq?tc+'18':char.color+'08', overflow:'hidden', alignItems:'center', paddingVertical:5, paddingHorizontal:2 }}>
                            <View style={{ height:2, width:'100%', backgroundColor:tc, opacity:0.5, position:'absolute', top:0 }} />
                            <Image source={v.art} style={{ width:44, height:58, borderRadius:5, opacity: unlocked?1:0.3 }} resizeMode="contain" />
                            {!unlocked && (
                              <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, alignItems:'center', justifyContent:'center', backgroundColor:'#000000AA' }}>
                                <Text style={{ fontSize:10 }}>🔒</Text>
                                <Text style={{ color:'#FFFFFF', fontSize:7, fontFamily:mono, fontWeight:'700', marginTop:2 }}>{unlockLabel}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ color:char.color, fontSize:5, fontFamily:mono, marginTop:2, textAlign:'center' }} numberOfLines={1}>{char.name}</Text>
                          <Text style={{ color: unlocked?'#888899':'#555566', fontSize:5, fontFamily:mono, textAlign:'center' }} numberOfLines={1}>{v.label.replace(char.name+' ','')}</Text>
                          {isEq && <Text style={{ color:tc, fontSize:5, fontFamily:mono }}>◈ ON</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  /* ── ALL: collapsible row per character ── */
                  COMPANION_ROSTER.map(char => {
                    const isOpen = rosterExpanded === char.id; // default collapsed; tap name to expand
                    return (
                      <View key={char.id} style={{ marginBottom:10 }}>
                        <TouchableOpacity onPress={() => setRosterExpanded(rosterExpanded === char.id ? null : char.id)}
                          style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom: isOpen ? 6 : 0, paddingVertical:3 }}>
                          <View style={{ width:2, height:10, borderRadius:1, backgroundColor:char.color }} />
                          <View style={{ flex:1 }}>
                            <Text style={{ color:char.color, fontSize:8, fontFamily:mono, fontWeight:'700', letterSpacing:1.5 }}>{char.name}</Text>
                            {isOpen && <Text style={{ color:'#555566', fontSize:7, fontStyle:'italic', marginTop:1 }} numberOfLines={1}>{char.lore}</Text>}
                          </View>
                          <Text style={{ color:'#333344', fontSize:7, fontFamily:mono }}>{char.variants.length}</Text>
                          <Text style={{ color:'#333344', fontSize:9, marginLeft:6 }}>{isOpen ? '▼' : '▶'}</Text>
                        </TouchableOpacity>
                        {isOpen && (
                          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:5 }}>
                            {char.variants.map(v => {
                              const isEq = equippedCompanionSkin === v.key;
                              const tc = v.tier==='T0'?'#44CC88':v.tier==='T1'?'#4A9EFF':v.tier==='T2'?'#9B6BFF':v.tier==='T3'?'#FF9F1C':v.tier==='hidden'?'#FF6644':v.tier==='secret'?'#CC44AA':'#44DDCC';
                              const unlocked = v.unlock==='free'||(v.unlock==='dive'&&diveCoins>=(v.diveCost??0))||(v.unlock==='battle'&&battleWins>=(v.battleCost??0))||(v.unlock==='sovereign'&&isSovereign)||v.unlock==='zodiac';
                              const unlockLabel = v.unlock==='free' ? 'FREE'
                                : v.unlock==='dive'     ? `${v.diveCost} ✦`
                                : v.unlock==='battle'   ? `${v.battleCost} ⚔`
                                : v.unlock==='sovereign'? 'SOVEREIGN'
                                : v.unlock==='zodiac'   ? 'ZODIAC'
                                : 'EVENT';
                              return (
                                <TouchableOpacity key={v.key} activeOpacity={0.8}
                                  onPress={async () => { if (!unlocked) return; const next = isEq ? null : v.key as SkinId; setEquippedCompanionSkin(next); await AsyncStorage.setItem('sol_equipped_skin', next??''); Haptics.selectionAsync(); }}
                                  style={{ width:'23%', alignItems:'center' }}>
                                  <View style={{ width:'100%', borderRadius:8, borderWidth: isEq?2:1, borderColor: isEq?tc:tc+'44', backgroundColor: isEq?tc+'18':char.color+'08', overflow:'hidden', alignItems:'center', paddingVertical:5, paddingHorizontal:2 }}>
                                    <View style={{ height:2, width:'100%', backgroundColor:tc, opacity:0.5, position:'absolute', top:0 }} />
                                    <Image source={v.art} style={{ width:44, height:58, borderRadius:5, opacity: unlocked?1:0.3 }} resizeMode="contain" />
                                    {!unlocked && (
                                      <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, alignItems:'center', justifyContent:'center', backgroundColor:'#000000AA' }}>
                                        <Text style={{ fontSize:10 }}>🔒</Text>
                                        <Text style={{ color:'#FFFFFF', fontSize:7, fontFamily:mono, fontWeight:'700', marginTop:2, textAlign:'center' }}>{unlockLabel}</Text>
                                      </View>
                                    )}
                                    <View style={{ paddingHorizontal:3, paddingVertical:1, borderRadius:3, backgroundColor:tc+'22', marginTop:3 }}>
                                      <Text style={{ color:tc, fontSize:5, fontFamily:mono, fontWeight:'700' }}>{v.tier.toUpperCase()}</Text>
                                    </View>
                                  </View>
                                  <Text style={{ color: unlocked?'#888899':'#555566', fontSize:6, fontFamily:mono, marginTop:2, textAlign:'center' }} numberOfLines={1}>{v.label.replace(char.name+' ','')}</Text>
                                  {isEq && <Text style={{ color:tc, fontSize:5, fontFamily:mono }}>◈</Text>}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* ── LAMAGUE LOADOUT ─────────────────────────────────── */}
          <TouchableOpacity onPress={() => setLoadoutCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: loadoutCollapsed ? 12 : 12, marginTop:4 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
              <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>LAMAGUE LOADOUT</Text>
            </View>
            <Text style={{ color:'#333344', fontSize:11 }}>{loadoutCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!loadoutCollapsed && ([
            { slot:'crown'  as GearSlot, gear:gearCrown,  next:nextCrown  },
            { slot:'sigil'  as GearSlot, gear:gearSigil,  next:nextSigil  },
            { slot:'mantle' as GearSlot, gear:gearMantle, next:nextMantle },
          ]).map(({ slot, gear, next }) => {
            const overlay = getGearOverlay(archetypeId, slot as Parameters<typeof getGearOverlay>[1]);
            const active = gear.threshold > 0;
            const gColor = active ? (overlay?.color ?? color) : '#2A2A3A';
            const maxThreshold = LAMAGUE_GEAR[slot][LAMAGUE_GEAR[slot].length - 1].threshold;
            const progressPct = maxThreshold > 0 ? Math.min(totalDives / maxThreshold, 1) : 0;
            return (
              <View key={slot} style={{ marginBottom:12, borderRadius:14, borderWidth:1,
                borderColor: active ? gColor+'55' : '#1A1A26',
                backgroundColor: active ? gColor+'0A' : '#080810', overflow:'hidden' }}>
                {/* Top row */}
                <View style={{ flexDirection:'row', alignItems:'center', gap:12, padding:14, paddingBottom:8 }}>
                  <View style={{ width:48, height:48, borderRadius:10, borderWidth:1,
                    borderColor: active ? gColor+'66' : '#1A1A26',
                    backgroundColor: active ? gColor+'18' : '#0A0A14',
                    alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:24, color: active ? gColor : '#333344' }}>{active ? (overlay?.glyph ?? gear.glyph) : '◌'}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                      <Text style={{ color: active ? SOL_THEME.text : '#333344', fontSize:13, fontWeight:'700', fontFamily:mono }}>
                        {active ? (overlay?.name ?? gear.name) : `${slot.toUpperCase()} LOCKED`}
                      </Text>
                      {active && (
                        <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:4, backgroundColor:gColor+'22', borderWidth:1, borderColor:gColor+'55' }}>
                          <Text style={{ color:gColor, fontSize:8, fontWeight:'700', fontFamily:mono }}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: active ? gColor+'CC' : '#333344', fontSize:11, marginTop:3, lineHeight:16 }}>
                      {active ? gear.effect : `Unlocks at ${LAMAGUE_GEAR[slot].find(t => t.threshold > 0)?.threshold ?? '?'} dives`}
                    </Text>
                  </View>
                </View>

                {/* ASCII art (active only) */}
                {active && overlay?.art && (
                  <View style={{ paddingHorizontal:14, paddingBottom:8, alignItems:'center' }}>
                    {overlay.art.map((line, i) => (
                      <Text key={i} style={{ color:gColor+'99', fontSize:9, fontFamily:mono, letterSpacing:1, lineHeight:13 }}>{line}</Text>
                    ))}
                  </View>
                )}

                {/* Desc */}
                {active && overlay?.desc && (
                  <Text style={{ color:'#444466', fontSize:11, fontStyle:'italic', lineHeight:16, paddingHorizontal:14, paddingBottom:8 }}>{overlay.desc}</Text>
                )}

                {/* Progress bar + next tier */}
                <View style={{ paddingHorizontal:14, paddingBottom:12 }}>
                  <View style={{ height:3, backgroundColor:'#1A1A26', borderRadius:2, marginBottom:5 }}>
                    <View style={{ width:`${progressPct*100}%`, height:3, backgroundColor:gColor+'77', borderRadius:2 }} />
                  </View>
                  {next ? (
                    <Text style={{ color:'#333355', fontSize:10, fontFamily:mono }}>
                      Next: {next.name} · {next.threshold - totalDives} more dives
                    </Text>
                  ) : active ? (
                    <Text style={{ color:gColor+'55', fontSize:10, fontFamily:mono }}>MAX TIER</Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          {/* ── BONUS SLOTS (body / cape) ── */}
          <TouchableOpacity onPress={() => setBonusCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: bonusCollapsed ? 12 : 8, marginTop:4 }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>BONUS GEAR</Text>
            <Text style={{ color:'#333344', fontSize:11 }}>{bonusCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!bonusCollapsed && ([
            { slot:'body' as GearSlot, gear:gearBody, next:nextBody },
            { slot:'cape' as GearSlot, gear:gearCape, next:nextCape },
          ]).map(({ slot, gear, next }) => {
            const active = gear.threshold > 0;
            const maxThreshold = LAMAGUE_GEAR[slot][LAMAGUE_GEAR[slot].length - 1].threshold;
            const pct = maxThreshold > 0 ? Math.min(totalDives / maxThreshold, 1) : 0;
            return (
              <View key={slot} style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8,
                padding:12, borderRadius:12, borderWidth:1,
                borderColor: active ? color+'44' : '#1A1A26',
                backgroundColor: active ? color+'06' : '#080810' }}>
                <Text style={{ color: active ? color : '#333344', fontSize:20, width:28, textAlign:'center' }}>{active ? gear.glyph : '◌'}</Text>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:4 }}>
                    <Text style={{ color: active ? SOL_THEME.text : '#333344', fontSize:12, fontWeight:'700', fontFamily:mono }}>{gear.name}</Text>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono, letterSpacing:1 }}>{slot.toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: active ? color+'BB' : '#333344', fontSize:11, marginBottom:4 }}>{gear.effect}</Text>
                  <View style={{ height:2, backgroundColor:'#1A1A26', borderRadius:1 }}>
                    <View style={{ width:`${pct*100}%`, height:2, backgroundColor:active ? color+'66' : '#222233', borderRadius:1 }} />
                  </View>
                  {next && <Text style={{ color:'#333355', fontSize:9, fontFamily:mono, marginTop:3 }}>{next.threshold - totalDives} dives → {next.name}</Text>}
                  {!next && active && <Text style={{ color:color+'55', fontSize:9, fontFamily:mono, marginTop:3 }}>MAX TIER</Text>}
                </View>
              </View>
            );
          })}

          {/* ── COSMETICS ───────────────────────────────────────────── */}
          <TouchableOpacity onPress={() => setCosmeticsCollapsed(v => !v)}
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: cosmeticsCollapsed ? 0 : 10, marginTop:8 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <View style={{ width:3, height:14, borderRadius:2, backgroundColor:'#FF44FF' }} />
              <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>COSMETICS</Text>
              <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#FF44FF18', borderWidth:1, borderColor:'#FF44FF33' }}>
                <Text style={{ color:'#FF44FFAA', fontSize:7, fontFamily:mono }}>LIVE</Text>
              </View>
            </View>
            <Text style={{ color:'#333344', fontSize:11 }}>{cosmeticsCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!cosmeticsCollapsed && (() => {
            const equipCosmetic = async (label: string, id: string | null) => {
              const next = {
                halo:  label === 'HALO'  ? id : equippedHalo,
                wings: label === 'WINGS' ? id : equippedWings,
                pet:   label === 'PET'   ? id : equippedPet,
                bg:    label === 'SCENE' ? id : equippedBg,
              };
              if (label === 'HALO')        setEquippedHalo(id);
              else if (label === 'WINGS')  setEquippedWings(id);
              else if (label === 'SCENE')  setEquippedBg(id);
              else setEquippedPet(id);
              await AsyncStorage.setItem('sol_cosmetics', JSON.stringify(next));
            };

            const CosmeticSlot = ({ label, icon, equipped, catalogue, open, onToggle, shopUnlocks: slotUnlocks, totalDives: slotDives }: { label:string; icon:string; equipped:string|null; catalogue:CosmeticItem[]; open:boolean; onToggle:()=>void; shopUnlocks:string[]; totalDives:number }) => {
              const item = equipped ? catalogue.find(c => c.id === equipped) : null;
              const rc = item ? RARITY_COLOR[item.rarity] : '#333344';
              const hasArt = catalogue.some(c => c.file !== null);
              // ORIGIN free · ARCANE 5dv · MYTHIC 15dv · LEGENDARY/SPECTRAL/SECRET bought with coins
              const isUnlocked = (c: CosmeticItem): boolean => {
                if (c.rarity === 'ORIGIN') return true;
                if (c.rarity === 'ARCANE') return slotDives >= 5;
                if (c.rarity === 'MYTHIC') return slotDives >= 15;
                return slotUnlocks.includes(c.id);
              };
              const lockHint = (c: CosmeticItem): string => {
                if (c.rarity === 'ARCANE') return `${Math.max(0, 5 - slotDives)}dv`;
                if (c.rarity === 'MYTHIC') return `${Math.max(0, 15 - slotDives)}dv`;
                return 'SHOP';
              };
              return (
                <View style={{ marginBottom:14 }}>
                  {/* Equipped slot */}
                  <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom: open ? 8 : 0,
                    padding:12, borderRadius:12, borderWidth:1,
                    borderColor: item ? rc+'44' : '#1A1A26',
                    backgroundColor: item ? rc+'08' : '#080810' }}>
                    <View style={{ width:50, height:50, borderRadius:10, borderWidth:1,
                      borderColor: item ? rc+'66' : '#1A1A26',
                      backgroundColor: item ? rc+'14' : '#0A0A14',
                      alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                      {item?.file
                        ? <Image source={item.file as any} style={{ width:50, height:50 }} resizeMode="cover" />
                        : <Text style={{ color: item ? rc : '#2A2A3A', fontSize:20 }}>{item ? item.glyph : icon}</Text>
                      }
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ color: item ? SOL_THEME.text : '#333344', fontSize:12, fontWeight:'700', fontFamily:mono }}>
                        {item ? item.name : `${label} · EMPTY`}
                      </Text>
                      {item && (
                        <View style={{ marginTop:3, flexDirection:'row', alignItems:'center', gap:5 }}>
                          <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:3, backgroundColor:rc+'22', borderWidth:1, borderColor:rc+'44' }}>
                            <Text style={{ color:rc, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{item.rarity}</Text>
                          </View>
                        </View>
                      )}
                      {!item && <Text style={{ color:'#333355', fontSize:9, fontFamily:mono, marginTop:2 }}>{hasArt ? (open ? 'Tap to collapse' : 'Tap to expand') : `Art dropping soon · ${catalogue.length} designs ready`}</Text>}
                    </View>
                    {item && (
                      <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); equipCosmetic(label, null); }}
                        style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1, borderColor:'#FF444433' }}>
                        <Text style={{ color:'#FF4444AA', fontSize:8, fontFamily:mono }}>REMOVE</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={{ color: open ? '#888899' : '#444455', fontSize:10, fontFamily:mono }}>{open ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  {/* Catalogue picker — lazy: only renders when open */}
                  {open && hasArt && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft:2 }}>
                      <View style={{ flexDirection:'row', gap:8, paddingBottom:4 }}>
                        {catalogue.map(c => {
                          const isEq = equipped === c.id;
                          const cr = RARITY_COLOR[c.rarity];
                          const ulk = isUnlocked(c);
                          const hint = lockHint(c);
                          return (
                            <TouchableOpacity key={c.id}
                              onPress={() => {
                                if (!ulk) { showToast(hint === 'SHOP' ? 'Buy in Shop to unlock' : `${hint} more dives needed`); return; }
                                equipCosmetic(label, isEq ? null : c.id);
                              }}
                              style={{ width:52, alignItems:'center' }}>
                              <View style={{ width:48, height:48, borderRadius:10, borderWidth: isEq ? 2 : 1,
                                borderColor: isEq ? cr : ulk ? cr+'44' : '#1A1A26',
                                backgroundColor: isEq ? cr+'18' : ulk ? '#080810' : '#060608',
                                overflow:'hidden', alignItems:'center', justifyContent:'center',
                                opacity: ulk ? 1 : 0.4 }}>
                                {ulk ? (
                                  c.file
                                    ? <Image source={c.file as any} style={{ width:48, height:48 }} resizeMode="cover" />
                                    : <Text style={{ color:cr, fontSize:16 }}>{c.glyph}</Text>
                                ) : (
                                  <Text style={{ color:'#444455', fontSize:13 }}>⊜</Text>
                                )}
                              </View>
                              <Text style={{ color: isEq ? cr : ulk ? '#333355' : '#2A2A38', fontSize:7, fontFamily:mono, marginTop:3, textAlign:'center' }} numberOfLines={1}>
                                {ulk ? c.name.split(' ')[0] : hint}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}
                </View>
              );
            };
            return (
              <View>
                <CosmeticSlot label="HALO"  icon="◯" equipped={equippedHalo}  catalogue={HALO_ITEMS}        open={haloOpen}  onToggle={() => setHaloOpen(v => !v)} shopUnlocks={shopUnlocks} totalDives={totalDives} />
                <CosmeticSlot label="WINGS" icon="◁" equipped={equippedWings} catalogue={WINGS_ITEMS}       open={wingsOpen} onToggle={() => setWingsOpen(v => !v)} shopUnlocks={shopUnlocks} totalDives={totalDives} />
                <CosmeticSlot label="PET"   icon="✧" equipped={equippedPet}   catalogue={PET_ITEMS}         open={petOpen}   onToggle={() => setPetOpen(v => !v)} shopUnlocks={shopUnlocks} totalDives={totalDives} />
                <CosmeticSlot label="SCENE" icon="⊟" equipped={equippedBg}    catalogue={BACKGROUND_ITEMS}  open={bgOpen}    onToggle={() => setBgOpen(v => !v)} shopUnlocks={shopUnlocks} totalDives={totalDives} />
                <Text style={{ color:'#222233', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:4, marginBottom:8, letterSpacing:1 }}>
                  ORIGIN FREE · ARCANE @5 DIVES · MYTHIC @15 DIVES · LEGENDARY/SPECTRAL → SHOP
                </Text>
              </View>
            );
          })()}

          {/* ── YOUR ARCHETYPE ─────────────────────────────────────── */}
          {(() => {
            const arch = ARCHETYPES[archetypeId];
            const archColor = arch ? (SKINS[arch.defaultSkin]?.color ?? '#F5A623') : '#F5A623';
            const archStats = ARCHETYPE_STAT_BASES[archetypeId];
            const archSpells = ARCHETYPE_SPELLS[archetypeId] ?? [];
            const [sym0, sym1] = arch?.sceneSymbols ?? ['◈','◈'];
            return (
              <View style={{ marginTop:4, marginBottom:8 }}>
                <TouchableOpacity onPress={() => setArchetypeCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: archetypeCollapsed ? 0 : 12 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <View style={{ width:3, height:14, borderRadius:2, backgroundColor:archColor }} />
                    <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>YOUR ARCHETYPE</Text>
                    <Text style={{ color:archColor+'99', fontSize:9, fontFamily:mono }}>{arch?.glyph} {arch?.name}</Text>
                  </View>
                  <Text style={{ color:'#333344', fontSize:11 }}>{archetypeCollapsed ? '▶' : '▼'}</Text>
                </TouchableOpacity>
                {!archetypeCollapsed && arch && archStats && (
                  <View style={{ borderRadius:14, borderWidth:1.5, borderColor:archColor+'44', backgroundColor:archColor+'07', overflow:'hidden' }}>
                    <View style={{ height:2, backgroundColor:archColor, opacity:0.6 }} />
                    <View style={{ padding:14 }}>
                      <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
                        <View style={{ width:56, height:70, borderRadius:10, borderWidth:1, borderColor:archColor+'44', backgroundColor:archColor+'10', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                          <Text style={{ position:'absolute', top:3, left:4, color:archColor+'55', fontSize:8, fontFamily:mono }}>{sym0}</Text>
                          <Text style={{ position:'absolute', top:3, right:4, color:archColor+'55', fontSize:8, fontFamily:mono }}>{sym1}</Text>
                          <Text style={{ position:'absolute', bottom:3, left:4, color:archColor+'55', fontSize:8, fontFamily:mono }}>{sym1}</Text>
                          <Text style={{ position:'absolute', bottom:3, right:4, color:archColor+'55', fontSize:8, fontFamily:mono }}>{sym0}</Text>
                          <Text style={{ color:archColor, fontSize:28, fontFamily:mono }}>{arch.glyph}</Text>
                          <Text style={{ color:archColor+'66', fontSize:9, fontFamily:mono, marginTop:1, letterSpacing:2 }}>{arch.eyes.present}</Text>
                        </View>
                        <View style={{ flex:1 }}>
                          <Text style={{ color:archColor, fontSize:14, fontWeight:'700', fontFamily:mono, letterSpacing:1, marginBottom:2 }}>{arch.name}</Text>
                          <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic', marginBottom:6 }}>{arch.title}</Text>
                          <View style={{ flexDirection:'row', gap:10 }}>
                            {(['atk','def','spd','wil','lck','vit'] as const)
                              .map(k => [k.toUpperCase(), archStats[k]] as [string,number])
                              .sort((a,b) => b[1]-a[1]).slice(0,3)
                              .map(([k,v]) => (
                                <View key={k} style={{ alignItems:'center' }}>
                                  <Text style={{ color:archColor+'88', fontSize:6, fontFamily:mono, letterSpacing:1 }}>{k}</Text>
                                  <Text style={{ color:archColor, fontSize:11, fontWeight:'700', fontFamily:mono }}>{v}</Text>
                                </View>
                              ))}
                          </View>
                        </View>
                      </View>
                      {archSpells.length > 0 && (
                        <View style={{ flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                          {archSpells.map(sp => (
                            <View key={sp.id} style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:6, backgroundColor:archColor+'14', borderWidth:1, borderColor:archColor+'22' }}>
                              <Text style={{ color:archColor+'AA', fontSize:9, fontFamily:mono }}>{sp.name}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={() => setShowArchSelect(true)}
                        activeOpacity={0.8}
                        style={{ paddingVertical:10, borderRadius:8, backgroundColor:archColor+'18', alignItems:'center', borderWidth:1, borderColor:archColor+'44' }}>
                        <Text style={{ color:archColor, fontSize:10, fontFamily:mono, letterSpacing:2 }}>CHANGE ARCHETYPE →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

        </View>
      )}

      {/* ── COMPANION INTRO ──────────────────────────────────────────────── */}
      <Modal visible={showCompanionIntro} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000000F0', justifyContent:'center', alignItems:'center', padding:28 }}>
          {/* Symbol sigil preview */}
          <View style={{ width:90, height:90, borderRadius:18, borderWidth:2, borderColor:'#A855F766', backgroundColor:'#1A0E2A', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
            <Text style={{ color:'#C084FC88', fontSize:11, fontFamily:mono, position:'absolute', top:8, left:8 }}>◈</Text>
            <Text style={{ color:'#C084FC88', fontSize:11, fontFamily:mono, position:'absolute', top:8, right:8 }}>◈</Text>
            <Text style={{ color:'#E8C76A', fontSize:38, fontFamily:mono }}>⊚</Text>
            <Text style={{ color:'#A855F766', fontSize:10, fontFamily:mono, position:'absolute', bottom:8 }}>─  ─</Text>
          </View>
          <Text style={{ color:'#F5E6C8', fontSize:24, fontWeight:'700', letterSpacing:1.5, fontFamily:mono, textAlign:'center', marginBottom:16 }}>Your Companion</Text>
          <Text style={{ color:'#A89880', fontSize:14, lineHeight:22, textAlign:'center', marginBottom:12, maxWidth:320 }}>
            Every sovereign has a familiar — a being shaped by how you engage with knowledge. It grows with you, fights beside you, and speaks your language.
          </Text>
          <Text style={{ color:'#6B5E7A', fontSize:13, lineHeight:21, textAlign:'center', marginBottom:10, maxWidth:320 }}>
            Choose an archetype and your companion takes that form. Each has a different way of moving through the world — different power, different voice, different edge.
          </Text>
          <Text style={{ color:'#4A3D5A', fontSize:12, lineHeight:20, textAlign:'center', marginBottom:36, maxWidth:300, fontStyle:'italic' }}>
            You may only choose once. Choose well.
          </Text>
          <TouchableOpacity
            onPress={startSummonCeremony}
            activeOpacity={0.85}
            style={{ paddingVertical:16, paddingHorizontal:40, borderRadius:14, borderWidth:1.5, borderColor:'#A855F7', backgroundColor:'#1A0E2A' }}
          >
            <Text style={{ color:'#E8C76A', fontSize:16, fontWeight:'700', letterSpacing:2, fontFamily:mono }}>CHOOSE MY COMPANION →</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── ARCHETYPE SELECTION MODAL ─────────────────────────────────────── */}
      {/* ── SUMMON CEREMONY ──────────────────────────────────────────────── */}
      <Modal visible={showSummonCeremony} transparent animationType="none">
        <View style={{ flex:1, backgroundColor:'#000000' }}>

          {/* Phase 0 + 1 intro text */}
          {(summonPhase === 0 || summonPhase === 1) && (
            <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, justifyContent:'center', alignItems:'center', paddingHorizontal:40, opacity:summonAnim }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:5, fontFamily:mono, marginBottom:40, textAlign:'center' }}>◈  SOL  ◈</Text>
              <Text style={{ color:'#AAAACC', fontSize:22, fontWeight:'700', letterSpacing:1.5, fontFamily:mono, textAlign:'center', marginBottom:12 }}>Something stirs{'\n'}in the field.</Text>
              <Text style={{ color:'#555566', fontSize:12, letterSpacing:2, fontFamily:mono, textAlign:'center' }}>Choose the form that calls to you.</Text>
            </Animated.View>
          )}

          {/* Phase 1 — archetype cards */}
          {summonPhase >= 1 && (
            <Animated.View style={{ flex:1, opacity:summonChoiceAnim }}>
              <ScrollView contentContainerStyle={{ padding:20, paddingTop:52, paddingBottom:48 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <Text style={{ color:'#888899', fontSize:9, letterSpacing:4, fontFamily:mono, textAlign:'center', marginBottom:4 }}>COMPANIONS</Text>
                <Text style={{ color:'#F5E6C8', fontSize:20, fontWeight:'700', letterSpacing:1, fontFamily:mono, textAlign:'center', marginBottom:8 }}>Choose who you become.</Text>
                <Text style={{ color:'#444455', fontSize:11, textAlign:'center', lineHeight:18, marginBottom:32 }}>
                  This is permanent. Choose well.
                </Text>
                {/* Archetype cards — same data as the change-archetype picker */}
                {ARCHETYPE_IDS.filter(id => id !== 'lycheetah').map(id => {
                  const a = ARCHETYPES[id];
                  const aColor = SKINS[a.defaultSkin].color;
                  return (
                    <TouchableOpacity key={id}
                      onPress={() => handleSummonChoice(id)}
                      activeOpacity={0.75}
                      style={{ marginBottom:12, padding:16, borderRadius:14, borderWidth:1, borderColor:aColor+'55', backgroundColor:aColor+'0A' }}>
                      <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:8 }}>
                        <View style={{ width:56, height:56, borderRadius:12, borderWidth:1.5, borderColor:aColor+'55', backgroundColor:aColor+'18', alignItems:'center', justifyContent:'center' }}>
                          <Text style={{ fontSize:26 }}>{a.glyph}</Text>
                        </View>
                        <View style={{ flex:1 }}>
                          <Text style={{ color:aColor, fontSize:14, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{a.name}</Text>
                          <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic', marginTop:2 }}>{a.title}</Text>
                        </View>
                      </View>
                      <Text style={{ color:'#888899', fontSize:12, lineHeight:18 }}>{a.desc}</Text>
                      <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
                        <View style={{ flex:1, padding:7, borderRadius:7, backgroundColor:aColor+'12', borderWidth:1, borderColor:aColor+'33' }}>
                          <Text style={{ color:'#555566', fontSize:7, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>SPECIALTY</Text>
                          <Text style={{ color:aColor, fontSize:11 }}>{a.specialty}</Text>
                        </View>
                        <View style={{ flex:1, padding:7, borderRadius:7, backgroundColor:'#111122', borderWidth:1, borderColor:'#222233' }}>
                          <Text style={{ color:'#555566', fontSize:7, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>AFFINITY</Text>
                          <Text style={{ color:'#666677', fontSize:11 }}>{a.affinity}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {/* Phase 2 — awakening */}
          {summonPhase === 2 && (
            <View style={{ flex:1, justifyContent:'center', alignItems:'center', gap:24 }}>
              <Text style={{ color:SKINS[ARCHETYPES[archetypeId].defaultSkin].color, fontSize:48, fontFamily:mono }}>
                {ARCHETYPES[archetypeId].glyph}
              </Text>
              <Text style={{ color:SKINS[ARCHETYPES[archetypeId].defaultSkin].color, fontSize:14, fontWeight:'700', letterSpacing:4, fontFamily:mono }}>
                AWAKENING
              </Text>
              <Text style={{ color:'#444455', fontSize:11, fontStyle:'italic', textAlign:'center', paddingHorizontal:40, lineHeight:18 }}>
                {ARCHETYPES[archetypeId].name} opens its eyes for the first time.
              </Text>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={showArchSelect} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000EE', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:SOL_THEME.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:20, maxHeight:'90%' }}>
            {/* ── Header ── */}
            <View style={{ alignItems:'center', marginBottom:20 }}>
              <View style={{ width:72, height:72, borderRadius:16, borderWidth:2, borderColor:SKINS[ARCHETYPES[archetypeId].defaultSkin].color+'55', backgroundColor:SKINS[ARCHETYPES[archetypeId].defaultSkin].color+'18', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                <Text style={{ fontSize:36 }}>{ARCHETYPES[archetypeId].glyph}</Text>
              </View>
              <Text style={{ color:SOL_THEME.text, fontSize:16, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>Who travels with you?</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:4, letterSpacing:2 }}>Voice · Eyes · Power</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {ARCHETYPE_IDS.map(id => {
                const a = ARCHETYPES[id];
                const active = archetypeId === id;
                const aColor = SKINS[a.defaultSkin].color;
                const archLocked = id === 'lycheetah' && !isSovereign;
                const flashAnim = flashAnims[id] ?? new Animated.Value(0);
                return (
                  <TouchableOpacity key={id}
                    onPress={() => {
                      if (archLocked) return;
                      Haptics.selectionAsync();
                      Animated.sequence([
                        Animated.timing(flashAnim, { toValue: 1, duration: 75, useNativeDriver: false }),
                        Animated.timing(flashAnim, { toValue: 0, duration: 75, useNativeDriver: false }),
                      ]).start(() => { handleArchetypeSelect(id); setShowArchSelect(false); });
                    }}
                    activeOpacity={archLocked ? 1 : 0.7}
                    style={{ marginBottom:10, padding:16, borderRadius:14, borderWidth:active?2:1, borderColor:active?aColor:archLocked?'#FF9F1C33':SOL_THEME.border, backgroundColor:active?aColor+'14':archLocked?'#150800':SOL_THEME.background, opacity:archLocked?0.75:1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:8 }}>
                      <Animated.View style={{ width:60, height:60, borderRadius:12, borderWidth:2, borderColor:archLocked?'#FF9F1C33':flashAnim.interpolate({ inputRange:[0,0.5,1], outputRange:[active?aColor+'55':SOL_THEME.border, aColor, active?aColor+'55':SOL_THEME.border] }), backgroundColor:archLocked?'#FF9F1C11':aColor+'18', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:28 }}>{archLocked ? '🔒' : a.glyph}</Text>
                      </Animated.View>
                      <View style={{ flex:1 }}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                          <Text style={{ color:archLocked?'#FF9F1C':aColor, fontSize:14, fontWeight:'700', fontFamily:mono }}>{a.name}</Text>
                          {active && <Text style={{ color:aColor, fontSize:9, fontFamily:mono }}>· ACTIVE</Text>}
                          {archLocked && <Text style={{ color:'#FF9F1C', fontSize:9, fontFamily:mono }}>· SOVEREIGN ONLY</Text>}
                        </View>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:1, fontStyle:'italic' }}>{archLocked ? 'Founding Sovereign exclusive' : a.title}</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontFamily:mono, marginTop:4, opacity:0.7 }}>ATK · DEF · {a.specialty.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:18, marginBottom:8 }}>{archLocked ? 'The Mystery Cat chooses only Founding Sovereigns. Chaos cannot be bought — only earned.' : a.desc}</Text>
                    <View style={{ flexDirection:'row', gap:8 }}>
                      <View style={{ flex:1, padding:8, borderRadius:8, backgroundColor:aColor+'10', borderWidth:1, borderColor:aColor+'33' }}>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>SPECIALTY</Text>
                        <Text style={{ color:aColor, fontSize:11 }}>{a.specialty}</Text>
                      </View>
                      <View style={{ flex:1, padding:8, borderRadius:8, backgroundColor:SOL_THEME.border+'44', borderWidth:1, borderColor:SOL_THEME.border }}>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:8, letterSpacing:2, fontFamily:mono, marginBottom:2 }}>AFFINITY</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>{a.affinity}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height:20 }} />
            </ScrollView>
            <TouchableOpacity onPress={() => setShowArchSelect(false)} style={{ marginTop:8, padding:14, borderRadius:10, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* ── NAME MODAL ─────────────────────────────────────────────────────── */}
      <Modal visible={editingName} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000000CC', justifyContent:'center', alignItems:'center', padding:32 }}>
          <View style={{ width:'100%', backgroundColor:SOL_THEME.surface, borderRadius:16, padding:24, borderWidth:1, borderColor:color+'55' }}>
            <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:12 }}>NAME YOUR COMPANION</Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="Enter a name..." placeholderTextColor={SOL_THEME.textMuted} autoFocus maxLength={20}
              style={{ backgroundColor:SOL_THEME.background, borderWidth:1, borderColor:color+'44', borderRadius:8, padding:12, color:SOL_THEME.text, fontSize:16, fontFamily:mono, marginBottom:16 }} />
            <View style={{ flexDirection:'row', gap:10 }}>
              <TouchableOpacity onPress={() => setEditingName(false)} style={{ flex:1, padding:12, borderRadius:8, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
                <Text style={{ color:SOL_THEME.textMuted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                const name = nameDraft.trim(); setCompanionName(name);
                await AsyncStorage.setItem('sol_companion_name', name);
                setEditingName(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }} style={{ flex:1, padding:12, borderRadius:8, backgroundColor:color+'22', borderWidth:1, borderColor:color, alignItems:'center' }}>
                <Text style={{ color, fontWeight:'700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MILESTONE TOAST ──────────────────────────────────────────────── */}
      {milestone && (
        <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000EE', justifyContent:'center', alignItems:'center', padding:40, zIndex:100, transform:[{scale:milestoneAnim}], opacity:milestoneAnim }}>
          <TouchableOpacity onPress={() => setMilestone(null)} activeOpacity={1} style={{ width:'100%', alignItems:'center', gap:16 }}>
            <Text style={{ color, fontSize:52, fontFamily:mono }}>{milestone.glyph}</Text>
            <Text style={{ color, fontSize:18, fontWeight:'700', letterSpacing:2, fontFamily:mono, textAlign:'center' }}>{milestone.title}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:13, lineHeight:21, textAlign:'center', fontStyle:'italic' }}>{milestone.body}</Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:10, marginTop:12, opacity:0.5 }}>tap to continue</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── DREAM FRAGMENT ───────────────────────────────────────────────── */}
      {dreamFragment && (
        <Animated.View style={{ position:'absolute', bottom:0, left:0, right:0, opacity:dreamAnim, zIndex:90, pointerEvents:'none' }}>
          <TouchableOpacity onPress={() => setDreamFragment(null)} activeOpacity={0.8} style={{ margin:16, padding:16, borderRadius:14, borderWidth:1, borderColor:dreamFragment.color+'44', backgroundColor:'#000000DD', flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={{ color:dreamFragment.color, fontSize:22 }}>{dreamFragment.glyph}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:'#555566', fontSize:8, letterSpacing:3, fontFamily:mono, marginBottom:4 }}>DREAM FRAGMENT</Text>
              <Text style={{ color:'#AAAACC', fontSize:12, lineHeight:18, fontStyle:'italic' }}>{dreamFragment.text}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── EVOLUTION CEREMONY ──────────────────────────────────────────── */}
      {evolutionCeremony && (() => {
        const s = STAGES[evolutionCeremony.stage];
        return (
          <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000F5', justifyContent:'center', alignItems:'center', padding:32, zIndex:110, opacity:ceremonyAnim, transform:[{ scale: ceremonyAnim.interpolate({ inputRange:[0,1], outputRange:[0.92,1] }) }] }}>
            <TouchableOpacity onPress={() => setEvolutionCeremony(null)} activeOpacity={1} style={{ width:'100%', alignItems:'center', gap:20 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:4, fontFamily:mono }}>✦  EVOLUTION  ✦</Text>
              <Text style={{ color, fontSize:11, letterSpacing:3, fontFamily:mono, fontWeight:'700' }}>{s.name}</Text>
              <View style={{ backgroundColor:'#060410', borderRadius:14, borderWidth:1, borderColor:color+'55', padding:20, width:'100%', alignItems:'center' }}>
                {s.body.map((line, i) => (
                  <Text key={i} style={{ color, fontSize:13, fontFamily:mono, lineHeight:20 }}>{line}</Text>
                ))}
                <Text style={{ color:color+'88', fontSize:11, fontFamily:mono, marginTop:6 }}>{s.ground}</Text>
              </View>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:20, textAlign:'center', fontStyle:'italic', paddingHorizontal:8 }}>{s.lore}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, opacity:0.4, letterSpacing:1 }}>tap to continue · fades in 5s</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })()}

      {/* ── EVOLUTION PATH CEREMONY ──────────────────────────────────────── */}
      <Modal visible={showPathCeremony} transparent animationType="none">
        <View style={{ flex:1, backgroundColor:'#000000F4' }}>
          <Animated.View style={{ flex:1, opacity:pathCeremonyAnim }}>
            <ScrollView contentContainerStyle={{ padding:28, paddingTop:64 }} showsVerticalScrollIndicator={false}>
              <Text style={{ color:color, fontSize:9, letterSpacing:5, fontFamily:mono, textAlign:'center', marginBottom:6 }}>◈  FLAME REACHED  ◈</Text>
              <Text style={{ color:SOL_THEME.text, fontSize:21, fontWeight:'700', textAlign:'center', marginBottom:8, lineHeight:30 }}>
                Your companion stands{'\n'}at a crossroads.
              </Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13, textAlign:'center', fontStyle:'italic', marginBottom:32, lineHeight:20 }}>
                Three paths diverge from here.{'\n'}Each leads somewhere no other path can go.{'\n'}Choose. It cannot be undone.
              </Text>

              {archetype.paths.map((path) => {
                const pathColors: Record<EvoPath, string> = { A: color, B: color + 'CC', C: color + '99' };
                const pc = pathColors[path.id];
                return (
                  <TouchableOpacity
                    key={path.id}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setEvoPath(path.id);
                      setShowPathCeremony(false);
                      await AsyncStorage.setItem('sol_companion_path', path.id);
                      setPhrase(`The path is chosen. ${path.name} rises.`);
                    }}
                    activeOpacity={0.85}
                    style={{ marginBottom:16, padding:20, borderRadius:16, borderWidth:1.5, borderColor:pc + '55', backgroundColor:pc + '0C' }}
                  >
                    <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 }}>
                      <View style={{ width:36, height:36, borderRadius:8, borderWidth:1, borderColor:pc + '44', backgroundColor:pc + '14', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:pc, fontSize:16, fontFamily:mono, fontWeight:'700' }}>{path.id}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ color:pc, fontSize:15, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{path.name}</Text>
                        <Text style={{ color:SOL_THEME.textMuted, fontSize:11, fontStyle:'italic', marginTop:2 }}>{path.title}</Text>
                      </View>
                    </View>
                    {/* SVG preview at stage 3 */}
                    <View style={{ alignItems:'center', marginBottom:10, opacity:0.85 }}>
                      <CreatureSvg archId={archetype.id} stage={3} color={pc} path={path.id} />
                    </View>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:18 }}>{path.desc}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height:40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* ── COMPANION LORE MODAL ─────────────────────────────────────────── */}
      <Modal visible={!!companionLoreModal} transparent animationType="fade">
        {companionLoreModal && (() => {
          const sid   = companionLoreModal;
          const s     = SKINS[sid];
          const entry = COMPANION_LORE[sid];
          const img   = ZONE_COMPANION_IMAGES[`${sid}_1`];
          const visited = visitedRooms.has(`${sid}_0`);
          const loreAcq = companionAcquire(sid);
          const loreLocked = !loreAcq.unlocked;
          return (
            <TouchableOpacity activeOpacity={1} onPress={() => setCompanionLoreModal(null)}
              style={{ flex:1, backgroundColor:'#000000E8', justifyContent:'center', alignItems:'center', padding:28 }}>
              <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}
                style={{ width:'100%', backgroundColor:'#0C0C14', borderRadius:20, padding:24, borderWidth:1.5, borderColor:s.color+'66' }}>
                {/* Art */}
                <View style={{ alignItems:'center', marginBottom:16 }}>
                  {img ? (
                    <Image source={img} style={{ width:110, height:150, borderRadius:12 }} resizeMode="contain" />
                  ) : (
                    <View style={{ width:110, height:150, borderRadius:12, borderWidth:1, borderColor:s.color+'33', alignItems:'center', justifyContent:'center', backgroundColor:s.color+'08' }}>
                      <Text style={{ color:s.color, fontSize:40 }}>{s.glyph}</Text>
                    </View>
                  )}
                </View>
                {/* Name + title */}
                <Text style={{ color:s.color, fontSize:18, fontWeight:'700', fontFamily:mono, letterSpacing:2, textAlign:'center' }}>{entry?.name ?? s.name}</Text>
                <Text style={{ color:s.color+'88', fontSize:10, fontFamily:mono, letterSpacing:1, textAlign:'center', marginTop:3, marginBottom:14 }}>{entry?.title ?? ''}</Text>
                {/* Lore */}
                <Text style={{ color:'#CCCCDD', fontSize:13, lineHeight:21, textAlign:'center', fontStyle:'italic' }}>
                  {entry?.lore ?? 'This being has not yet revealed its nature.'}
                </Text>
                {/* Buttons */}
                <View style={{ flexDirection:'row', gap:8, marginTop:20 }}>
                  <TouchableOpacity onPress={() => setCompanionLoreModal(null)}
                    style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1, borderColor:'#333344', alignItems:'center' }}>
                    <Text style={{ color:'#666677', fontSize:10, fontFamily:mono, letterSpacing:1 }}>CLOSE</Text>
                  </TouchableOpacity>
                  {loreLocked ? (
                    loreAcq.method === 'dives' ? (
                      <TouchableOpacity
                        onPress={async () => { const ok = await unlockWithDives(sid, loreAcq.cost); if (ok) setCompanionLoreModal(null); }}
                        style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5, borderColor: loreAcq.canAfford ? s.color+'88' : '#333344', backgroundColor: loreAcq.canAfford ? s.color+'14' : '#00000044', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color: loreAcq.canAfford ? s.color : '#888899', fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>✦ {loreAcq.cost} DIVES</Text>
                        <Text style={{ color: loreAcq.canAfford ? s.color+'99' : '#555566', fontSize:7, fontFamily:mono, marginTop:2 }}>{loreAcq.canAfford ? 'TAP TO UNLOCK' : `${loreAcq.cost - diveCoins} MORE NEEDED`}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5, borderColor:'#333344', backgroundColor:'#00000044', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ color:'#888899', fontSize:9, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>🔒 {loreAcq.method === 'capture' ? 'CAPTURE ONLY' : 'SHOP ONLY'}</Text>
                        <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, marginTop:2 }}>{loreAcq.method === 'capture' ? 'CATCH IN BATTLE' : 'FIND IN SHOP'}</Text>
                      </View>
                    )
                  ) : (
                  <TouchableOpacity onPress={async () => {
                    const next = equippedCompanionSkin === sid ? null : sid;
                    setEquippedCompanionSkin(next);
                    await AsyncStorage.setItem('sol_equipped_skin', next ?? '');
                    setCompanionLoreModal(null);
                  }} style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5,
                    borderColor: equippedCompanionSkin === sid ? '#FF4466' : s.color+'88',
                    backgroundColor: equippedCompanionSkin === sid ? '#FF446618' : s.color+'0A', alignItems:'center' }}>
                    <Text style={{ color: equippedCompanionSkin === sid ? '#FF4466' : s.color, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>
                      {equippedCompanionSkin === sid ? 'UNEQUIP' : 'EQUIP ✦'}
                    </Text>
                  </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => {
                    const room = getRoomInSkin(sid, 0);
                    if (room) { setActiveSkin(sid); setCurrentRoomId(room.id); setActiveTab('battle'); }
                    setCompanionLoreModal(null);
                  }} style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5, borderColor:s.color, backgroundColor:s.color+'14', alignItems:'center' }}>
                    <Text style={{ color:s.color, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>HUNT →</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })()}
      </Modal>

      {/* ── VOID BOSS FIGHT (#273) — study to win ──────────────────────────── */}
      <Modal visible={!!activeBoss} transparent animationType="fade" onRequestClose={closeBoss}>
        {activeBoss && (() => {
          const b = activeBoss;
          const encColor = bossEncroach >= 80 ? '#FF3333' : bossEncroach >= 50 ? '#FFAA22' : b.color;
          return (
            <View style={{ flex:1, backgroundColor:'#02000AF8', justifyContent:'center', padding:20 }}>
              {/* Encroachment field — grows behind the boss as it widens */}
              <View pointerEvents="none" style={{ position:'absolute', top:'50%', left:'50%',
                width: 60 + bossEncroach * 3.4, height: 60 + bossEncroach * 3.4,
                marginLeft: -(60 + bossEncroach * 3.4)/2, marginTop: -(60 + bossEncroach * 3.4)/2,
                borderRadius: 999, backgroundColor: b.color + '14', borderWidth:1, borderColor: encColor + '44' }} />

              <View style={{ alignItems:'center' }}>
                <Text style={{ color: b.color, fontSize:9, fontFamily:mono, letterSpacing:3, fontWeight:'700' }}>◈ VOID ENTITY</Text>
                <Text style={{ fontSize:64, color: b.color, marginVertical:6 }}>{b.glyph}</Text>
                <Text style={{ color:'#EEE8FF', fontSize:20, fontWeight:'800', letterSpacing:1, textAlign:'center' }}>{b.name}</Text>
                <Text style={{ color: b.color + 'AA', fontSize:10, fontStyle:'italic', textAlign:'center', marginTop:3 }}>{b.title}</Text>

                {bossPhase === 'fight' && (
                  <>
                    {/* Encroachment meter — the aggression zone */}
                    <View style={{ width:'100%', marginTop:18 }}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                        <Text style={{ color: encColor, fontSize:8, fontFamily:mono, letterSpacing:1, fontWeight:'700' }}>AGGRESSION ZONE</Text>
                        <Text style={{ color: encColor, fontSize:8, fontFamily:mono }}>{bossEncroach}%</Text>
                      </View>
                      <View style={{ height:8, borderRadius:4, backgroundColor:'#1A0A2A', overflow:'hidden' }}>
                        <View style={{ height:8, width:`${bossEncroach}%` as any, backgroundColor: encColor, borderRadius:4 }} />
                      </View>
                      <Text style={{ color:'#66607A', fontSize:8, fontFamily:mono, marginTop:3, textAlign:'center' }}>at 100% it repels you — but you keep the knowledge</Text>
                    </View>

                    {/* The riddle */}
                    <Text style={{ color:'#BDB6D4', fontSize:12, lineHeight:19, textAlign:'center', marginTop:16, paddingHorizontal:6, fontStyle:'italic' }}>{b.riddle}</Text>

                    {/* Actions */}
                    <View style={{ flexDirection:'row', gap:10, marginTop:20, width:'100%' }}>
                      <TouchableOpacity onPress={bossStrike}
                        style={{ flex:1, paddingVertical:13, borderRadius:12, borderWidth:1, borderColor:'#55556699', backgroundColor:'#00000055', alignItems:'center' }}>
                        <Text style={{ color:'#9999AA', fontSize:11, fontWeight:'700', fontFamily:mono }}>⚔ STRIKE</Text>
                        <Text style={{ color:'#55556A', fontSize:7, fontFamily:mono, marginTop:1 }}>feeds the widening</Text>
                      </TouchableOpacity>
                      {bossSpellReady ? (
                        <TouchableOpacity onPress={speakTheSpell}
                          style={{ flex:1.4, paddingVertical:13, borderRadius:12, borderWidth:1.5, borderColor: b.color, backgroundColor: b.color + '22', alignItems:'center', shadowColor:b.color, shadowOpacity:0.6, shadowRadius:10, elevation:4 }}>
                          <Text style={{ color: b.color, fontSize:11, fontWeight:'800', fontFamily:mono, letterSpacing:1 }}>🜍 SPEAK THE SPELL</Text>
                          <Text style={{ color: b.color + 'AA', fontSize:7, fontFamily:mono, marginTop:1 }}>repel it to the void</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={() => { closeBoss(); router.push('/(tabs)/school' as any); }}
                          style={{ flex:1.4, paddingVertical:13, borderRadius:12, borderWidth:1.5, borderColor:'#E8C76A88', backgroundColor:'#E8C76A14', alignItems:'center' }}>
                          <Text style={{ color:'#E8C76A', fontSize:11, fontWeight:'800', fontFamily:mono, letterSpacing:1 }}>𝔏 DIVE TO LEARN</Text>
                          <Text style={{ color:'#E8C76A99', fontSize:7, fontFamily:mono, marginTop:1 }}>{b.boundSubject}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity onPress={closeBoss} style={{ marginTop:14 }}>
                      <Text style={{ color:'#555566', fontSize:9, fontFamily:mono }}>retreat for now ✕</Text>
                    </TouchableOpacity>
                  </>
                )}

                {bossPhase === 'repelled' && (
                  <View style={{ alignItems:'center', marginTop:18 }}>
                    <Text style={{ color:'#FF6644', fontSize:13, fontWeight:'700', textAlign:'center' }}>The {b.name} has consumed the field.</Text>
                    <Text style={{ color:'#9999AA', fontSize:11, textAlign:'center', marginTop:8, lineHeight:17, paddingHorizontal:8 }}>You are pushed out — but force was never the way. Dive {b.boundSubject}, learn the word that unmakes it, and return.</Text>
                    <TouchableOpacity onPress={() => { closeBoss(); router.push('/(tabs)/school' as any); }}
                      style={{ marginTop:16, paddingHorizontal:22, paddingVertical:12, borderRadius:12, borderWidth:1.5, borderColor:'#E8C76A', backgroundColor:'#E8C76A18' }}>
                      <Text style={{ color:'#E8C76A', fontSize:11, fontWeight:'800', fontFamily:mono, letterSpacing:1 }}>𝔏 GO LEARN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={closeBoss} style={{ marginTop:12 }}><Text style={{ color:'#555566', fontSize:9, fontFamily:mono }}>close ✕</Text></TouchableOpacity>
                  </View>
                )}

                {bossPhase === 'victory' && (
                  <View style={{ alignItems:'center', marginTop:18 }}>
                    <Text style={{ color: b.color, fontSize:13, fontFamily:mono, fontStyle:'italic', textAlign:'center', lineHeight:20, paddingHorizontal:6 }}>{b.incantation}</Text>
                    <Text style={{ color:'#CDCDDA', fontSize:12, textAlign:'center', marginTop:14, lineHeight:18, paddingHorizontal:8 }}>{b.repelLine}</Text>
                    <View style={{ marginTop:18, padding:14, borderRadius:12, borderWidth:1, borderColor: b.color+'55', backgroundColor: b.color+'0C', alignItems:'center' }}>
                      <Text style={{ color: b.color, fontSize:8, fontFamily:mono, letterSpacing:2 }}>✦ SPECIAL EDITION UNLOCKED</Text>
                      <Text style={{ color:'#EEE8FF', fontSize:13, fontWeight:'700', marginTop:4 }}>{b.rewardName}</Text>
                    </View>
                    <TouchableOpacity onPress={closeBoss} style={{ marginTop:18, paddingHorizontal:26, paddingVertical:12, borderRadius:12, backgroundColor: b.color }}>
                      <Text style={{ color:'#000', fontSize:12, fontWeight:'800', letterSpacing:1 }}>CLAIM →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })()}
      </Modal>

      {/* ── SECRET TRANSMISSION READER (𝔏 READ) ──────────────────────────── */}
      <Modal visible={!!readingSecret} transparent animationType="fade" onRequestClose={() => setReadingSecret(null)}>
        <View style={{ flex:1, backgroundColor:'#000000F2', justifyContent:'center', padding:24 }}>
          {readingSecret && (
            <View style={{ width:'100%', maxHeight:'82%', backgroundColor:'#0A0606', borderRadius:18, borderWidth:1.5, borderColor:'#CC222255' }}>
              <View style={{ paddingHorizontal:22, paddingTop:22, paddingBottom:14, borderBottomWidth:1, borderBottomColor:'#CC222222' }}>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                  <Text style={{ color:'#CC2222', fontSize:9, fontFamily:mono, letterSpacing:2, fontWeight:'700' }}>𝔏 SECRET OF LYCHEETAH</Text>
                  <TouchableOpacity onPress={() => setReadingSecret(null)} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
                    <Text style={{ color:'#CC2222', fontSize:16 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color:'#EEEEFF', fontSize:20, fontWeight:'700', fontFamily:mono, marginTop:10, letterSpacing:0.5 }}>{readingSecret.title}</Text>
                <Text style={{ color:'#9988AA', fontSize:12, fontStyle:'italic', marginTop:6, lineHeight:18 }}>{readingSecret.subtitle}</Text>
              </View>
              <ScrollView style={{ paddingHorizontal:22 }} contentContainerStyle={{ paddingVertical:18 }} showsVerticalScrollIndicator={false}>
                {readingSecret.body.map((para, i) => (
                  <Text key={i} style={{ color:'#CDCDDA', fontSize:14, lineHeight:23, marginBottom:14 }}>{para}</Text>
                ))}
                <Text style={{ color:'#CC222288', fontSize:11, fontFamily:mono, letterSpacing:1, textAlign:'center', marginTop:8 }}>𝔏 ∴ the chain holds</Text>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* ── TAB FIRST-VISIT POPUP ────────────────────────────────────────── */}
      {(() => {
        const TAB_INFO: Record<string, { glyph:string; color:string; title:string; lines:[string,string,string,string] }> = {
          battle:    { glyph:'⚔', color:'#FF6644', title:'BATTLE',    lines:['Fight enemies in your zone — STRIKE, SHIELD, FOCUS, or SPELL','FOCUS charges your next hit to ×2 damage','Win XP, Lumens, and relics from the field','VENTURE + CAMPAIGN: longer adventures below encounters'] },
          companion: { glyph:'⊛', color,           title:'COMPANION', lines:['Your archetype shapes stats, voice, and spells','Equip gear earned through dives and battles','Your companion evolves through 6 stages as you grow','Tap 🔥 or ⚔ ENCOUNTER in the scene at any time'] },
          bond:      { glyph:'△', color:'#44CC88', title:'GROWTH',    lines:['Track your bond level and evolution stage','Feed your companion to raise its mood','Higher bond unlocks deeper conversation','Stage milestones unlock new forms and abilities'] },
          field:     { glyph:'◉', color:'#4ECDC4', title:'THE ZONE',  lines:['Navigate rooms in your current zone using the arrow keys','Each zone has its own companion form, enemies, and lore','Travel unlocks new zones to explore and battle','Your zone changes the enemy types you face'] },
          talk:      { glyph:'✦', color:'#9B6BFF', title:'TALK',      lines:['Speak directly with your companion — they know your zone and history','🔥 Bonfire Mode: AUTO fires a story, EXCHANGE goes turn-by-turn, DEEP LEARNING goes deep on a subject','Tap the 🔥 button in the scene to open Bonfire anytime','Aura Prime mode unlocks pure AI conversation'] },
          shop:      { glyph:'⟡', color:'#C49A3C', title:'THE SHOP',  lines:['Spend ⟡ Lumens on cosmetics — halo, wings, pet, scene background','Spend ✧ Veras on exclusive items','LAMAGUE gear and relics have gameplay effects','Some items unlock by dive count, others by battle wins'] },
        };
        const info = tabPopup ? TAB_INFO[tabPopup] : null;
        if (!info) return null;
        return (
          <Modal visible={!!tabPopup} transparent animationType="fade" onRequestClose={() => setTabPopup(null)}>
            <TouchableOpacity activeOpacity={1} onPress={() => setTabPopup(null)}
              style={{ flex:1, backgroundColor:'#000000BB', justifyContent:'flex-end' }}>
              <TouchableOpacity activeOpacity={1} onPress={() => {}}
                style={{ backgroundColor:'#080810', borderTopLeftRadius:24, borderTopRightRadius:24, borderWidth:1.5, borderBottomWidth:0, borderColor:info.color+'44', padding:24, paddingBottom:36 }}>
                <View style={{ height:2, width:40, borderRadius:2, backgroundColor:info.color+'55', alignSelf:'center', marginBottom:20 }} />
                <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 }}>
                  <View style={{ width:48, height:48, borderRadius:12, borderWidth:1.5, borderColor:info.color+'55', backgroundColor:info.color+'14', alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ color:info.color, fontSize:22 }}>{info.glyph}</Text>
                  </View>
                  <View>
                    <Text style={{ color:'#888899', fontSize:8, fontFamily:mono, letterSpacing:3 }}>YOU UNLOCKED</Text>
                    <Text style={{ color:info.color, fontSize:18, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{info.title}</Text>
                  </View>
                </View>
                <View style={{ gap:10, marginBottom:24 }}>
                  {info.lines.map((line, i) => (
                    <View key={i} style={{ flexDirection:'row', gap:10, alignItems:'flex-start' }}>
                      <Text style={{ color:info.color+'88', fontSize:10, marginTop:2, minWidth:12 }}>◦</Text>
                      <Text style={{ color:'#AAAACC', fontSize:13, lineHeight:19, flex:1 }}>{line}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setTabPopup(null)}
                  style={{ paddingVertical:14, borderRadius:12, backgroundColor:info.color+'22', borderWidth:1.5, borderColor:info.color+'55', alignItems:'center' }}>
                  <Text style={{ color:info.color, fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>GOT IT →</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        );
      })()}

      {/* ── NAMING RITUAL ────────────────────────────────────────────────── */}
      <Modal visible={showNamingRitual} transparent animationType="fade">
        <View style={{ flex:1, backgroundColor:'#000000F0', justifyContent:'center', alignItems:'center', padding:32 }}>
          <View style={{ width:'100%', backgroundColor:SOL_THEME.surface, borderRadius:20, padding:28, borderWidth:1.5, borderColor:color }}>
            <Text style={{ color, fontSize:10, letterSpacing:3, fontFamily:mono, textAlign:'center', marginBottom:4 }}>✦  FLAME REACHED  ✦</Text>
            <Text style={{ color:SOL_THEME.text, fontSize:17, fontWeight:'700', textAlign:'center', marginBottom:8 }}>
              Your companion has grown enough to carry a true name.
            </Text>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:12, lineHeight:19, textAlign:'center', marginBottom:20, fontStyle:'italic' }}>
              A name given here cannot be taken. It will live in the creature's lore. Speak it only when you are certain.
            </Text>
            <TextInput value={nameDraft} onChangeText={setNameDraft} placeholder="The true name..." placeholderTextColor={SOL_THEME.textMuted} autoFocus maxLength={20}
              style={{ backgroundColor:SOL_THEME.background, borderWidth:1.5, borderColor:color+'66', borderRadius:10, padding:14, color:SOL_THEME.text, fontSize:18, fontFamily:mono, marginBottom:16, textAlign:'center' }} />
            <TouchableOpacity onPress={async () => {
              const name = nameDraft.trim();
              if (!name) return;
              setCompanionName(name); setShowNamingRitual(false);
              await AsyncStorage.multiSet([['sol_companion_name', name], ['sol_companion_named', 'true']]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 300);
            }} style={{ paddingVertical:14, borderRadius:12, backgroundColor:color+'22', borderWidth:1.5, borderColor:color, alignItems:'center', marginBottom:10 }}>
              <Text style={{ color, fontSize:15, fontWeight:'700', letterSpacing:2, fontFamily:mono }}>BESTOW THE NAME</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              setShowNamingRitual(false);
              await AsyncStorage.setItem('sol_companion_named', 'true');
            }} style={{ alignItems:'center', padding:8 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>name it later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── RELIC DROP ────────────────────────────────────────────────────── */}
      {newRelic && (
        <Animated.View style={{ marginHorizontal:16, marginBottom:14, padding:16, borderRadius:12, borderWidth:1.5, borderColor:color, backgroundColor:color+'15', transform:[{scale:relicAnim}] }}>
          <Text style={{ color, fontSize:10, letterSpacing:2, fontFamily:mono, marginBottom:6 }}>✦ RELIC EARNED</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
            <Text style={{ fontSize:28 }}>{newRelic.glyph}</Text>
            <View style={{ flex:1 }}>
              <Text style={{ color:SOL_THEME.text, fontSize:14, fontWeight:'700' }}>{newRelic.name}</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:12, marginTop:2 }}>{newRelic.desc}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setNewRelic(null)} style={{ marginTop:10, alignSelf:'flex-end' }}>
            <Text style={{ color:SOL_THEME.textMuted, fontSize:11 }}>dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          BATTLE TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'battle' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingTop:6 }}>

          {/* BATTLE PANEL ─────────────────────────── */}
          {(() => {
            const bDef = battle ? getEnemyDef(battle.entityName) : null;
            const GB = { dk: '#0F380F', md: '#306230', text: '#8BAC0F', hi: '#9BBB0F' };
            const panelBorderColor = GB.md;
            const panelBg = GB.dk;
            return (
          <View onLayout={e => { battleY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:14, padding:14, borderRadius:4, borderWidth:3, borderColor:panelBorderColor, backgroundColor:panelBg }}>

            {/* GB scan-line overlay */}
            <View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, borderRadius:4, overflow:'hidden', zIndex:99 }}>
              {Array.from({ length: 60 }).map((_, i) => (
                <View key={i} style={{ position:'absolute', left:0, right:0, top: i * 8, height:1, backgroundColor:'#000000', opacity:0.12 }} />
              ))}
            </View>

            {/* Header — tappable to minimize */}
            <TouchableOpacity onPress={() => setBattleMinimized(v => !v)} activeOpacity={0.85}
              style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: battleMinimized ? 0 : 12, paddingBottom: battleMinimized ? 0 : 10, borderBottomWidth: battleMinimized ? 0 : 1, borderBottomColor:'#FF664422' }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ color:'#FF6644', fontSize:14 }}>⚔</Text>
                <Text style={{ color:'#CCCCDD', fontSize:12, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>ENCOUNTERS</Text>
                {battle && !battle.won && (
                  <Text style={{ color:'#FF664466', fontSize:9, fontFamily:mono }}>{battle.entityName}</Text>
                )}
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <WaveDots wave={battle?.wave ?? 1} color={color} />
                {/* AUTO toggle */}
                {battle && !battle.won && (
                  <TouchableOpacity onPress={e => { e.stopPropagation?.(); setAutoMode(v => !v); }}
                    style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:6, borderWidth:1,
                      borderColor: autoMode ? '#44FF8866' : '#22223355',
                      backgroundColor: autoMode ? '#44FF8814' : 'transparent' }}>
                    <Text style={{ color: autoMode ? '#44FF88' : '#333344', fontSize:7, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>
                      {autoMode ? '⚙ AUTO' : '◌ AUTO'}
                    </Text>
                  </TouchableOpacity>
                )}
                {/* Dialogue toggle */}
                <TouchableOpacity onPress={e => { e.stopPropagation?.(); setBattleDialogueOn(v => !v); if (!battleDialogueOn) { const sig = BATTLE_MYSTERY_SIGNALS[Math.floor(Math.random()*BATTLE_MYSTERY_SIGNALS.length)]; setCompanionBattleLine(`[${sig.tag}] ${sig.text}`); } }}
                  style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:6, borderWidth:1, borderColor: battleDialogueOn ? color+'88' : '#22223366', backgroundColor: battleDialogueOn ? color+'14' : 'transparent' }}>
                  <Text style={{ color: battleDialogueOn ? color : '#333344', fontSize:7, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>{battleDialogueOn ? '◈' : '◌'}</Text>
                </TouchableOpacity>
                {/* Token count */}
                {battle && (
                  <Text style={{ color: tokensLeft > 0 ? color : '#FF444488', fontSize:9, fontFamily:mono, fontWeight:'700' }}>
                    {tokensLeft}T
                  </Text>
                )}
                <Text style={{ color:'#333344', fontSize:10 }}>{battleMinimized ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>

            {!battleMinimized && battle && !battle.won && (() => {
              const def = getEnemyDef(battle.entityName);
              const rc  = def.colour;
              const _zoneSkinFallback = (currentRoomId.split('_')[0]) as SkinId;
              const enemyImg = battle.entitySkinId
                ? (ZONE_COMPANION_IMAGES[`${battle.entitySkinId}_1`] ?? ZONE_COMPANION_IMAGES[`${_zoneSkinFallback}_1`] ?? null)
                : (ENEMY_IMAGES[battle.entityName.toLowerCase().replace(/'/g,'').replace(/\s+/g,'_') as keyof typeof ENEMY_IMAGES]
                   ?? ZONE_COMPANION_IMAGES[`${_zoneSkinFallback}_1`] ?? null);
              const disabled = attackAnim;
              const archetypeSpells = ARCHETYPE_SPELLS[archetype.id] ?? ARCHETYPE_SPELLS['vigil'];
              const roomSkinId = (currentRoomId.split('_')[0] as SkinId);
              const zoneSpells = ZONE_ENCOUNTER_SPELLS[roomSkinId] ?? [];
              const spells = [...archetypeSpells, ...zoneSpells];
              return (<>
                {/* Spell menu overlay */}
                {spellMenuOpen && (
                  <TouchableOpacity activeOpacity={1} onPress={() => setSpellMenuOpen(false)}
                    style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:20, justifyContent:'center' }}>
                    <View style={{ backgroundColor:'#06060EEE', borderRadius:14, borderWidth:1.5, borderColor:color+'44', padding:14, margin:4 }}>
                      <Text style={{ color:color, fontSize:9, fontFamily:mono, letterSpacing:3, marginBottom:4, textAlign:'center' }}>✦ SPELLS</Text>
                      {zoneSpells.length > 0 && <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, letterSpacing:2, textAlign:'center', marginBottom:10 }}>+ {SKINS[roomSkinId]?.name ?? 'ZONE'} SPELLS UNLOCKED</Text>}
                      {spells.map(sp => {
                        const canCast = tokensLeft >= sp.cost;
                        return (
                          <TouchableOpacity key={sp.id} onPress={() => canCast && handleSpell(sp)} disabled={!canCast}
                            style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:11, paddingHorizontal:12, marginBottom:7, borderRadius:10, borderWidth:1,
                              borderColor: canCast ? color+'55' : '#22223355', backgroundColor: canCast ? color+'0E' : 'transparent' }}>
                            <View style={{ flex:1 }}>
                              <Text style={{ color: canCast ? SOL_THEME.text : '#444455', fontSize:12, fontFamily:mono, fontWeight:'700' }}>{sp.name}</Text>
                              <Text style={{ color: canCast ? color+'77' : '#22223366', fontSize:9, fontFamily:mono, marginTop:3 }}>{canCast ? sp.fx : `Need ${sp.cost - tokensLeft} more token${sp.cost - tokensLeft > 1 ? 's' : ''}`}</Text>
                            </View>
                            <View style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1, borderColor: canCast ? color+'88' : '#33334488', backgroundColor: canCast ? color+'18' : 'transparent' }}>
                              <Text style={{ color: canCast ? color : '#444455', fontSize:11, fontFamily:mono, fontWeight:'700' }}>{sp.cost}T</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:6 }}>TAP OUTSIDE TO CANCEL</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Item menu overlay */}
                {itemMenuOpen && (
                  <TouchableOpacity activeOpacity={1} onPress={() => setItemMenuOpen(false)}
                    style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:20, justifyContent:'center' }}>
                    <View style={{ backgroundColor:'#06060EEE', borderRadius:14, borderWidth:1.5, borderColor:'#44CC8844', padding:14, margin:4 }}>
                      <Text style={{ color:'#44CC88', fontSize:9, fontFamily:mono, letterSpacing:3, marginBottom:12, textAlign:'center' }}>◦ ITEMS</Text>
                      {BATTLE_ITEMS.map(item => {
                        const rc2 = item.rarity==='epic'?'#FF9F1C':item.rarity==='rare'?'#CC66FF':item.rarity==='uncommon'?'#44AAFF':'#667788';
                        return (
                          <TouchableOpacity key={item.id} onPress={() => handleBattleItem(item)}
                            style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:10, paddingHorizontal:12, marginBottom:6, borderRadius:10, borderWidth:1, borderColor:rc2+'55', backgroundColor:rc2+'0D' }}>
                            <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
                              <Text style={{ color:rc2, fontSize:16, fontFamily:mono }}>{item.glyph}</Text>
                              <View style={{ flex:1 }}>
                                <Text style={{ color:'#CCCCDD', fontSize:12, fontFamily:mono, fontWeight:'700' }}>{item.name}</Text>
                                <Text style={{ color:rc2+'99', fontSize:9, fontFamily:mono, marginTop:2 }}>{item.desc}</Text>
                              </View>
                            </View>
                            <View style={{ paddingHorizontal:6, paddingVertical:3, borderRadius:5, borderWidth:1, borderColor:rc2+'66', backgroundColor:rc2+'18' }}>
                              <Text style={{ color:rc2, fontSize:8, fontFamily:mono, fontWeight:'700' }}>{item.rarity.toUpperCase()}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:6 }}>TAP OUTSIDE TO CANCEL</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Companion sighted banner */}
                {battle.entitySkinId && (
                  <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:7, paddingHorizontal:12, borderRadius:10, borderWidth:1.5, borderColor:'#DD44FF88', backgroundColor:'#DD44FF0A', marginBottom:10 }}>
                    <Text style={{ color:'#DD44FF', fontSize:12 }}>✦</Text>
                    <Text style={{ color:'#DD44FF', fontSize:10, fontFamily:mono, fontWeight:'700', letterSpacing:2 }}>COMPANION SIGHTED</Text>
                    <Text style={{ color:'#DD44FF', fontSize:12 }}>✦</Text>
                  </View>
                )}

                {/* ══ ARENA ══ companion LEFT · enemy RIGHT ══════════════════ */}
                {(() => {
                  const hp  = battle.entityHP;  const maxHp  = battle.maxHP;
                  const php = battle.playerHP;  const maxPhp = battle.maxPlayerHP;
                  const ePct = Math.max(0, Math.min(1, hp  / maxHp));
                  const pPct = Math.max(0, Math.min(1, php / maxPhp));
                  const eBlocks = 14; const eFilled = Math.round(ePct * eBlocks);
                  const pBlocks = 14; const pFilled = Math.round(pPct * pBlocks);
                  const pDanger = pPct < 0.3;
                  const eDanger = ePct < 0.3;
                  const companionImg = equippedCompanionSkin
                    ? (ZONE_COMPANION_IMAGES[`${equippedCompanionSkin}_1` as keyof typeof ZONE_COMPANION_IMAGES] ?? null)
                    : (ZONE_COMPANION_IMAGES[`${skin.id}_1` as keyof typeof ZONE_COMPANION_IMAGES] ?? null);
                  return (
                    <View style={{ marginBottom:10 }}>
                      {/* Dual HP bars */}
                      <View style={{ flexDirection:'row', gap:10, marginBottom:8 }}>
                        {/* Player bar */}
                        <View style={{ flex:1 }}>
                          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:2 }}>
                            <Text style={{ color:color, fontSize:9, fontFamily:mono, fontWeight:'700' }}>{displayName.toUpperCase()}</Text>
                            <View style={{ flexDirection:'row', gap:4 }}>
                              {battle.playerShielded && <Text style={{ color:GB.text, fontSize:7, fontFamily:mono }}>SHLD</Text>}
                              {battle.defending && !battle.playerShielded && <Text style={{ color:GB.text, fontSize:7, fontFamily:mono }}>DEF</Text>}
                              <Text style={{ color:pDanger?'#FF4444':GB.hi, fontSize:9, fontFamily:mono }}>{php}/{maxPhp}</Text>
                            </View>
                          </View>
                          <Text style={{ color:pDanger?'#FF4444':GB.hi, fontSize:9, fontFamily:mono, letterSpacing:1 }}>
                            {'▓'.repeat(pFilled)}{'░'.repeat(pBlocks-pFilled)}
                          </Text>
                          {(battle.playerStatuses?.length ?? 0) > 0 && (
                            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:3, marginTop:3 }}>
                              {(battle.playerStatuses??[]).map((s,i) => (
                                <Text key={i} style={{ color:STATUS_META[s.kind].colour, fontSize:8, fontFamily:mono }}>{STATUS_META[s.kind].glyph}{s.turns}</Text>
                              ))}
                            </View>
                          )}
                        </View>
                        {/* Enemy bar */}
                        <View style={{ flex:1, alignItems:'flex-end' }}>
                          <View style={{ flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:2 }}>
                            <Text style={{ color:eDanger?'#FF4444':GB.hi, fontSize:9, fontFamily:mono }}>{hp}/{maxHp}</Text>
                            <View style={{ flexDirection:'row', gap:4 }}>
                              {battle.enemyStunned && <Text style={{ color:'#FFBB00', fontSize:7, fontFamily:mono }}>STUN</Text>}
                              <Text style={{ color:rc, fontSize:9, fontFamily:mono, fontWeight:'700' }}>{def.name.toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text style={{ color:eDanger?'#FF4444':rc, fontSize:9, fontFamily:mono, letterSpacing:1, textAlign:'right' }}>
                            {'░'.repeat(eBlocks-eFilled)}{'▓'.repeat(eFilled)}
                          </Text>
                          {(battle.enemyStatuses?.length ?? 0) > 0 && (
                            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:3, marginTop:3, justifyContent:'flex-end' }}>
                              {(battle.enemyStatuses??[]).map((s,i) => (
                                <Text key={i} style={{ color:STATUS_META[s.kind].colour, fontSize:8, fontFamily:mono }}>{STATUS_META[s.kind].glyph}{s.turns}</Text>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Sprite row */}
                      <View style={{ flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', marginBottom:10 }}>
                        {/* Companion sprite */}
                        <Animated.View style={{ opacity:playerHitFlash.interpolate({inputRange:[0,1],outputRange:[1,0.3]}) }}>
                          {companionImg ? (
                            <View style={{ borderRadius:8, borderWidth:1.5, borderColor:color+'55', overflow:'hidden' }}>
                              <Image source={companionImg} style={{ width:78, height:96 }} resizeMode="contain" />
                              <Animated.View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#FF2222', opacity:playerHitFlash.interpolate({inputRange:[0,1],outputRange:[0,0.3]}) }} />
                              <Animated.View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#44FF88', opacity:playerHealFlash.interpolate({inputRange:[0,1],outputRange:[0,0.25]}) }} />
                            </View>
                          ) : (
                            <View style={{ width:78, height:96, borderRadius:8, borderWidth:1.5, borderColor:color+'44', backgroundColor:color+'0A', alignItems:'center', justifyContent:'center' }}>
                              <Text style={{ fontSize:32 }}>{skin.glyph}</Text>
                            </View>
                          )}
                        </Animated.View>

                        {/* VS centre */}
                        <View style={{ alignItems:'center', gap:4 }}>
                          <Text style={{ color:GB.md, fontSize:8, fontFamily:mono, fontWeight:'700', letterSpacing:2 }}>VS</Text>
                          {battle.enemyIntent && (
                            <View style={{ paddingHorizontal:6, paddingVertical:3, borderRadius:4, borderWidth:1,
                              borderColor: battle.enemyIntent.kind==='special'?rc+'88':'#33334488',
                              backgroundColor: battle.enemyIntent.kind==='special'?rc+'14':'transparent' }}>
                              <Text style={{ color:battle.enemyIntent.kind==='special'?rc:GB.text, fontSize:7, fontFamily:mono, fontWeight:'700', textAlign:'center' }}>
                                {battle.enemyIntent.kind==='guard'?'🛡':battle.enemyIntent.kind==='special'?'⚡':'⚔'} {battle.enemyIntent.label?.toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={{ color:GB.text, fontSize:9, fontFamily:mono, fontWeight:'700' }}>W{battle.wave}</Text>
                        </View>

                        {/* Enemy sprite */}
                        <Animated.View style={{ transform:[{translateX:entityShakeAnim}] }}>
                          {enemyImg ? (
                            <View style={{ borderRadius:8, borderWidth:1.5, borderColor:rc+'55', overflow:'hidden' }}>
                              <Image source={enemyImg} style={{ width:78, height:96 }} resizeMode="contain" />
                              <Animated.View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#FFFFFF', opacity:enemyHitFlash, borderRadius:8 }} />
                            </View>
                          ) : (
                            <View style={{ width:78, height:96, borderRadius:8, borderWidth:1.5, borderColor:rc+'44', backgroundColor:rc+'08', alignItems:'center', justifyContent:'center' }}>
                              <EnemyGlyphArt glyph={def.rarity==='legendary'?'⊛':def.rarity==='epic'?'✦':def.rarity==='rare'?'⊚':def.rarity==='uncommon'?'◈':'◌'} color={rc} />
                            </View>
                          )}
                        </Animated.View>
                      </View>

                      {/* ── INSIGHT BOX — full-width RPG text box ── */}
                      <View style={{ borderWidth:2, borderColor:GB.md, borderRadius:4, backgroundColor:GB.dk, padding:12, marginBottom:10, overflow:'hidden' }}>
                        {/* scanlines */}
                        <View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:0 }}>
                          {Array.from({length:20}).map((_,i) => (
                            <View key={i} style={{ position:'absolute', left:0, right:0, top:i*9, height:1, backgroundColor:'#000', opacity:0.10 }} />
                          ))}
                        </View>
                        {/* Enemy taunt */}
                        <View style={{ flexDirection:'row', gap:6, marginBottom:8, zIndex:1 }}>
                          <Text style={{ color:rc, fontSize:10, fontFamily:mono, fontWeight:'700', minWidth:10 }}>▸</Text>
                          <View style={{ flex:1 }}>
                            <Text style={{ color:rc, fontSize:8, fontFamily:mono, fontWeight:'700', marginBottom:2, letterSpacing:1 }}>{def.name.toUpperCase()}</Text>
                            <Text style={{ color:'#C8D8A8', fontSize:12, fontStyle:'italic', lineHeight:18 }} numberOfLines={2}>{`"${battle.enemyLine}"`}</Text>
                          </View>
                        </View>
                        {/* Divider */}
                        <View style={{ height:1, backgroundColor:GB.md+'55', marginBottom:8 }} />
                        {/* Companion insight */}
                        {companionBattleLine !== '' && (
                          <View style={{ flexDirection:'row', gap:6, zIndex:1 }}>
                            <Text style={{ color:color, fontSize:12 }}>{skin.glyph}</Text>
                            <View style={{ flex:1 }}>
                              <Text style={{ color:color, fontSize:8, fontFamily:mono, fontWeight:'700', marginBottom:2, letterSpacing:1 }}>{displayName.toUpperCase()}</Text>
                              <Text style={{ color:'#E8F0D8', fontSize:12, lineHeight:18 }} numberOfLines={3}>{companionBattleLine}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* ── GB ACTION BUTTONS ─────────────────────────── */}
                {(() => {
                  const spellDis = disabled || tokensLeft < Math.min(...spells.map(s=>s.cost));
                  const charged  = battleFocusCharged;
                  const btnBase  = { flex:1, paddingVertical:14, borderRadius:4, borderWidth:2, alignItems:'center' as const };
                  return (
                    <View style={{ marginBottom:8 }}>
                      <View style={{ flexDirection:'row', gap:6, marginBottom:6 }}>
                        <TouchableOpacity onPress={() => handleBattleAction('attack')} disabled={disabled}
                          style={{ ...btnBase, borderColor:disabled?GB.md+'44':charged?'#FFD700':GB.md, backgroundColor:disabled?GB.dk:charged?'#2A1A00':GB.md+'55' }}>
                          <Text style={{ color:disabled?GB.md+'66':charged?'#FFD700':GB.hi, fontSize:11, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>
                            {attackAnim?'· · ·':charged?'A ◎STRIKE':'A  STRIKE'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSpellMenuOpen(true)} disabled={spellDis}
                          style={{ ...btnBase, borderColor:spellDis?GB.md+'44':GB.md, backgroundColor:spellDis?GB.dk:GB.md+'33' }}>
                          <Text style={{ color:spellDis?GB.md+'55':GB.hi, fontSize:11, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>B  SPELL</Text>
                          {tokensLeft > 0 && <Text style={{ color:color, fontSize:7, fontFamily:mono, marginTop:2 }}>{tokensLeft}T</Text>}
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection:'row', gap:6 }}>
                        <TouchableOpacity onPress={() => handleBattleAction('focus')} disabled={disabled}
                          style={{ ...btnBase, borderColor:disabled?GB.md+'33':charged?'#FFD70044':GB.md+'77', backgroundColor:charged?'#1A1000':GB.dk }}>
                          <Text style={{ color:disabled?GB.md+'44':charged?'#FFD70077':GB.text, fontSize:11, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>
                            {charged?'↑ ◎READY':'↑  FOCUS'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleBattleAction('item')} disabled={disabled}
                          style={{ ...btnBase, borderColor:disabled?GB.md+'33':GB.md+'77', backgroundColor:GB.dk }}>
                          <Text style={{ color:disabled?GB.md+'44':GB.text, fontSize:11, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>↓  ITEM</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })()}

                {/* CAPTURE button — full width */}
                {!battle.won && (
                  <TouchableOpacity
                    onPress={handleCapture}
                    disabled={disabled || battle.captureAttempted || battle.captured}
                    style={{ paddingVertical:12, paddingHorizontal:10, borderRadius:12, borderWidth:1.5, marginBottom:8,
                      borderColor: (disabled || battle.captureAttempted) ? '#1A0A1A' : '#DD44FF55',
                      backgroundColor: (disabled || battle.captureAttempted) ? '#080408' : '#DD44FF10',
                      flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Text style={{ color: (disabled || battle.captureAttempted) ? '#2A1A2A' : '#DD44FF', fontSize:16, fontFamily:mono }}>◈</Text>
                    <View>
                      <Text style={{ color: (disabled || battle.captureAttempted) ? '#221A22' : '#DD44FF', fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>
                        {battle.captureAttempted ? 'BINDING ATTEMPTED' : 'CAPTURE'}
                      </Text>
                      <Text style={{ color: (disabled || battle.captureAttempted) ? '#1A0A1A' : '#AA44CC66', fontSize:7, fontFamily:mono }}>
                        {battle.captureAttempted ? 'one attempt per encounter' : `${Math.round(Math.max(5, Math.min(70, (1 - battle.entityHP/battle.maxHP)*65)))}% chance · weakened foes easier`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* Out of spell tokens notice */}
                {tokensLeft === 0 && (
                  <View style={{ alignItems:'center', paddingVertical:6, marginBottom:6, borderRadius:8, borderWidth:1, borderColor:'#9B59B633', backgroundColor:'#06000888' }}>
                    <Text style={{ color:'#9B59B6AA', fontSize:9, fontFamily:mono, letterSpacing:2 }}>NO SPELL TOKENS · ATTACK FREELY</Text>
                    <Text style={{ color:'#444455', fontSize:8, fontFamily:mono, marginTop:2 }}>Tokens refresh tomorrow · study to earn more</Text>
                  </View>
                )}

                {/* Log + tokens */}
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <View style={{ gap:2 }}>
                    {battle.log.slice(0,3).map((entry,i) => (
                      <Text key={i} style={{ color: i===0?(entry.includes('✦')?'#CC99FF':entry.includes('foe')?'#FF7777':'#AAAAAA'):'#444455',
                        fontSize:8, fontFamily:mono, opacity:1-i*0.3 }}>{entry}</Text>
                    ))}
                  </View>
                  {battle.wave>1 && (
                    <TouchableOpacity onPress={handleRetreat}>
                      <Text style={{ color:'#222233', fontSize:8, fontFamily:mono }}>↩ W1</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>);
            })()}

            {/* Wave cleared */}
            {!battleMinimized && battle?.won && (
              <View style={{ alignItems:'center', gap:6, paddingVertical:10 }}>
                <LootFloat visible={lootFloatVisible} color={color} onDone={() => setLootFloatVisible(false)} />
                <Text style={{ color, fontSize:22, fontFamily:mono }}>{skin.glyph} CLEARED</Text>
                <Text style={{ color, fontSize:11, fontFamily:mono, letterSpacing:1 }}>WAVE {battle.wave} · +{battle.wave*20} XP</Text>
                {battle.loot && (
                  <View style={{ paddingHorizontal:10, paddingVertical:5, borderRadius:6, borderWidth:1, borderColor:'#FFD70055', backgroundColor:'#FFD70009' }}>
                    <Text style={{ color:'#FFD700', fontSize:10, fontFamily:mono }}>◈ {battle.loot}</Text>
                  </View>
                )}
                {(() => { const lore = ENEMY_LORE[battle.entityName.toLowerCase().replace(/ /g,'_')]; return lore ? (
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic', textAlign:'center', paddingHorizontal:8, lineHeight:15, opacity:0.7 }}>{lore}</Text>
                ) : null; })()}
                {(() => { const wSkin = (currentRoomId.split('_')[0] as SkinId); return (
                  <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
                    <TouchableOpacity onPress={() => setBattle(freshZoneWave(wSkin, battle!.wave + 1, battle!.playerHP, playerStats.vit))}
                      style={{ flex:2, paddingVertical:12, borderRadius:10, borderWidth:1.5, borderColor:color, backgroundColor:color+'14', alignItems:'center' }}>
                      <Text style={{ color, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>NEXT WAVE →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setBattle(freshZoneWave(wSkin, 1, undefined, playerStats.vit))}
                      style={{ flex:1, paddingVertical:12, borderRadius:10, borderWidth:1, borderColor:'#FF664455', backgroundColor:'#FF664408', alignItems:'center' }}>
                      <Text style={{ color:'#FF6644', fontSize:10, fontFamily:mono, letterSpacing:1 }}>HUNT</Text>
                    </TouchableOpacity>
                  </View>
                ); })()}
              </View>
            )}

            {/* No battle — pre-encounter prompt */}
            {!battleMinimized && !battle && (() => {
              const rSkin = (currentRoomId.split('_')[0] as SkinId);
              return (
                <View style={{ alignItems:'center', gap:10, paddingVertical:16 }}>
                  <Text style={{ color:'#444455', fontSize:12, fontFamily:mono, letterSpacing:2 }}>ZONE: {SKINS[rSkin]?.name ?? rSkin.toUpperCase()}</Text>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:11, textAlign:'center', lineHeight:18, fontStyle:'italic', paddingHorizontal:8 }}>
                    {COMPANION_LORE[rSkin]?.lore ?? 'This zone holds unknown forces. Venture forward to discover what waits.'}
                  </Text>
                  <View style={{ flexDirection:'row', gap:10, marginTop:4 }}>
                    <TouchableOpacity onPress={() => setBattle(freshZoneWave(rSkin, 1, undefined, playerStats.vit))}
                      style={{ flex:1, paddingVertical:14, borderRadius:12, borderWidth:2, borderColor:color, backgroundColor:color+'18', alignItems:'center' }}>
                      <Text style={{ color, fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:3 }}>⚔ HUNT</Text>
                      <Text style={{ color:color+'66', fontSize:8, fontFamily:mono, letterSpacing:1, marginTop:2 }}>zone encounter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={startVenture}
                      style={{ flex:1, paddingVertical:14, borderRadius:12, borderWidth:2, borderColor:'#8855FF', backgroundColor:'#8855FF18', alignItems:'center' }}>
                      <Text style={{ color:'#BB88FF', fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:3 }}>◆ VENTURE</Text>
                      <Text style={{ color:'#8855FF88', fontSize:8, fontFamily:mono, letterSpacing:1, marginTop:2 }}>3 beats · quick</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Campaign — long-form, persistent across sessions */}
                  <TouchableOpacity onPress={() => setShowCampaignSelect(true)}
                    style={{ paddingVertical:13, borderRadius:12, borderWidth:1.5, borderColor:'#AA77FF88', backgroundColor:'#AA77FF0C', alignItems:'center', flexDirection:'row', justifyContent:'center', gap:10 }}>
                    <Text style={{ color:'#CC99FF', fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:3 }}>◈ CAMPAIGN</Text>
                    <View style={{ flexDirection:'row', gap:4 }}>
                      {campaignSlots.map((s, i) => (
                        <View key={i} style={{ width:6, height:6, borderRadius:3, backgroundColor: s?.complete ? '#C49A3C' : s ? '#AA77FF' : '#333355' }} />
                      ))}
                    </View>
                    <Text style={{ color:'#AA77FF55', fontSize:8, fontFamily:mono, letterSpacing:1 }}>7 chapters · saved</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
          ); })()}

          {/* ── VOID ENTITIES (#273) — combat that can only be won by learning. Below encounters. ── */}
          <View style={{ marginBottom:16, padding:13, borderRadius:12, borderWidth:1, borderColor:'#8855FF44', backgroundColor:'#8855FF08' }}>
            <Text style={{ color:'#AA88FF', fontSize:9, fontFamily:mono, letterSpacing:2, fontWeight:'700', marginBottom:3 }}>◈ VOID ENTITIES</Text>
            <Text style={{ color:'#66607A', fontSize:8, fontFamily:mono, marginBottom:10 }}>Cannot be out-fought. Dive the bound subject to learn the word that repels them.</Text>
            <View style={{ gap:8 }}>
              {VOID_BOSSES.map(b => {
                const beaten = bossDefeated.includes(b.id);
                return (
                  <TouchableOpacity key={b.id} onPress={() => !beaten && startBoss(b)} activeOpacity={beaten ? 1 : 0.8}
                    style={{ flexDirection:'row', alignItems:'center', gap:10, padding:11, borderRadius:10, borderWidth:1, borderColor: beaten ? '#44CC8844' : b.color+'44', backgroundColor: beaten ? '#44CC880A' : b.color+'0A' }}>
                    <Text style={{ fontSize:22, color: b.color, opacity: beaten ? 0.5 : 1 }}>{b.glyph}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ color: beaten ? '#66807A' : '#EEE8FF', fontSize:11, fontWeight:'700', fontFamily:mono }}>{b.name}</Text>
                      <Text style={{ color:'#66607A', fontSize:8, fontFamily:mono, marginTop:1 }}>𝔏 {b.boundSubject}</Text>
                    </View>
                    <Text style={{ color: beaten ? '#44CC88' : b.color, fontSize:9, fontFamily:mono, fontWeight:'700' }}>{beaten ? 'REPELLED ✓' : 'CHALLENGE'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── QUESTS ────────────────────────────────────────────── */}
          <View style={{ marginBottom:14 }}>
            <TouchableOpacity onPress={() => setQuestsCollapsed(v => !v)}
              style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14, borderRadius:12, borderWidth:1, borderColor:color+'33', backgroundColor:color+'08' }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ color:color, fontSize:10, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>◉ QUESTS</Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:9, fontFamily:mono }}>{quests.filter(q=>q.check(questData)).length}/{quests.length}</Text>
              </View>
              <Text style={{ color:'#333344', fontSize:11 }}>{questsCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!questsCollapsed && (
              <View style={{ padding:14, paddingTop:10, borderRadius:12, borderWidth:1, borderTopWidth:0, borderColor:color+'33', backgroundColor:color+'05', borderTopLeftRadius:0, borderTopRightRadius:0 }}>
                {(() => {
                  const done = quests.filter(q=>q.check(questData)).length;
                  return (
                    <View style={{ height:3, backgroundColor:'#1A1A26', borderRadius:2, overflow:'hidden', marginBottom:10 }}>
                      <View style={{ height:3, backgroundColor:done===quests.length?'#44CC88':color, width:`${quests.length>0?(done/quests.length)*100:0}%` as any, borderRadius:2 }} />
                    </View>
                  );
                })()}
                <View style={{ gap:5 }}>
                  {quests.map(q => {
                    const done = q.check(questData);
                    return (
                      <View key={q.id} style={{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, paddingHorizontal:10, borderRadius:8, borderWidth:1,
                        borderColor:done?color+'44':'#1A1A26', backgroundColor:done?color+'08':'transparent' }}>
                        <Text style={{ color:done?color:'#333344', fontSize:13 }}>{done?'✓':'○'}</Text>
                        <View style={{ flex:1 }}>
                          <Text style={{ color:done?color:SOL_THEME.textMuted, fontSize:11, fontWeight:done?'700':'400' }}>{q.label}</Text>
                          {!done && <Text style={{ color:'#333344', fontSize:9, marginTop:1 }}>{q.desc}</Text>}
                        </View>
                        <Text style={{ color:done?color:'#333344', fontSize:11, fontWeight:'700', fontFamily:mono }}>+{q.xp}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Top row: TALK + STATS */}
          <View style={{ flexDirection:'row', gap:8, marginBottom:12, marginTop:12 }}>
            <TouchableOpacity onPress={openTalk} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1.5, borderColor:color, backgroundColor:color+'14', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Text style={{ color, fontSize:16 }}>◈</Text>
              <Text style={{ color, fontSize:9, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>TALK</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowStatModal(true)} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:11, borderRadius:10, borderWidth:1, borderColor:'#1A1A26', flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7 }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:16 }}>⊛</Text>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>SHEET</Text>
            </TouchableOpacity>
          </View>

          {/* Stats chips row */}
          <View style={{ flexDirection:'row', gap:5, marginBottom:14 }}>
            {[
              { l:'DIVES',  v:totalDives.toString(),                         hi: totalDives > 0 },
              { l:'STREAK', v:streak>0?`${streak}d`:'—',                     hi: streak >= 3 },
              { l:'LQ',     v:avgLQ>0?`${(avgLQ*100).toFixed(0)}%`:'—',     hi: avgLQ >= 0.7 },
              { l:'WAVE',   v:`W${battle?.wave??1}`,                         hi: (battle?.wave??1) > 1 },
              { l:'RELICS', v:earnedRelicData.length.toString(),              hi: earnedRelicData.length > 0 },
            ].map(s => (
              <View key={s.l} style={{ flex:1, paddingVertical:9, borderRadius:8, borderWidth:1,
                borderColor: s.hi ? color+'33' : '#1A1A26',
                backgroundColor: s.hi ? color+'08' : '#0A0A10', alignItems:'center', gap:2 }}>
                <Text style={{ color: s.hi ? color+'99' : '#333344', fontSize:6, letterSpacing:1, fontFamily:mono }}>{s.l}</Text>
                <Text style={{ color: s.hi ? color : SOL_THEME.text, fontSize:14, fontWeight:'700', fontFamily:mono }}>{s.v}</Text>
              </View>
            ))}
          </View>

          {/* INVENTORY ──────────────────────────────── */}
          {inventory.length > 0 && (
            <View style={{ marginBottom:14, padding:14, borderRadius:14, borderWidth:1, borderColor:color+'22', backgroundColor:'#080808' }}>
              <TouchableOpacity onPress={() => setInventoryCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: inventoryCollapsed ? 0 : 10 }}>
                <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>INVENTORY</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                  <Text style={{ color:'#333344', fontSize:9, fontFamily:mono }}>{inventory.length}/50</Text>
                  <Text style={{ color:'#333344', fontSize:11 }}>{inventoryCollapsed ? '▶' : '▼'}</Text>
                </View>
              </TouchableOpacity>
              {!inventoryCollapsed && (
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                  {(() => {
                    const counts: Record<string, number> = {};
                    inventory.forEach(name => { counts[name] = (counts[name]??0)+1; });
                    return Object.entries(counts).map(([name, count]) => {
                      const item = LOOT_TABLE.find(l => l.name === name);
                      const c = item?.rarity==='epic'?'#FF9F1C':item?.rarity==='rare'?'#CC66FF':item?.rarity==='uncommon'?'#44AAFF':'#555566';
                      return (
                        <View key={name} style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:5, borderRadius:7, borderWidth:1, borderColor:c+'44', backgroundColor:c+'0C' }}>
                          <Text style={{ color:c, fontSize:11, fontFamily:mono }}>{item?.glyph??'◈'}</Text>
                          <Text style={{ color:c, fontSize:9, fontFamily:mono, letterSpacing:1 }}>{name}</Text>
                          {count>1 && <Text style={{ color:c+'88', fontSize:8, fontFamily:mono }}>×{count}</Text>}
                        </View>
                      );
                    });
                  })()}
                </View>
              )}
            </View>
          )}

          {/* ── MENAGERIE ─────────────────────────────────────────────── */}
          <View style={{ marginTop:20, marginBottom:16 }}>
            <TouchableOpacity onPress={() => setMenagerieCollapsed(v => !v)}
              style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:6, marginBottom: menagerieCollapsed ? 0 : 12 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:14, borderRadius:2, backgroundColor:'#DD44FF' }} />
                <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>MENAGERIE</Text>
                <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:6, backgroundColor:'#DD44FF22', borderWidth:1, borderColor:'#DD44FF44' }}>
                  <Text style={{ color:'#DD44FF', fontSize:8, fontFamily:mono }}>{menagerie.length}</Text>
                </View>
              </View>
              <Text style={{ color:'#333344', fontSize:11 }}>{menagerieCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>

            {/* ── ACTIVE PARTY (#260) — your fielded squad assists every strike ── */}
            {!menagerieCollapsed && menagerie.length > 0 && (
              <View style={{ marginBottom:14, padding:12, borderRadius:12, borderWidth:1, borderColor:'#44CC8844', backgroundColor:'#44CC880A' }}>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: party.length > 0 ? 9 : 0 }}>
                  <Text style={{ color:'#44CC88', fontSize:9, fontFamily:mono, letterSpacing:1.5, fontWeight:'700' }}>⚔ YOUR PARTY · {party.length}/{PARTY_MAX}</Text>
                  {party.length > 0 && <Text style={{ color:'#44CC88', fontSize:10, fontFamily:mono, fontWeight:'700' }}>+{partyAssistTotal()} / strike</Text>}
                </View>
                {party.length === 0 ? (
                  <Text style={{ color:'#556655', fontSize:9, fontFamily:mono, lineHeight:14 }}>Tap ⚔ FIELD on a captured creature below — your party adds bonus damage to every attack in battle.</Text>
                ) : (
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6 }}>
                    {party.map(n => (
                      <TouchableOpacity key={n} onPress={() => toggleParty(n)} activeOpacity={0.8}
                        style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:8, paddingVertical:5, borderRadius:8, borderWidth:1, borderColor:'#44CC8855', backgroundColor:'#44CC8814' }}>
                        <Text style={{ color:'#AADDBB', fontSize:9, fontFamily:mono, fontWeight:'700' }}>{n}</Text>
                        <Text style={{ color:'#44CC88', fontSize:8, fontFamily:mono }}>+{partyAssistFor(n)}</Text>
                        <Text style={{ color:'#44CC8888', fontSize:9 }}>✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {!menagerieCollapsed && (
              menagerie.length === 0 ? (
                <View style={{ paddingVertical:28, alignItems:'center', gap:8 }}>
                  <Text style={{ color:'#222233', fontSize:22 }}>◈</Text>
                  <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, letterSpacing:1.5 }}>NO ENTITIES CAPTURED YET</Text>
                  <Text style={{ color:'#22222A', fontSize:8, fontFamily:mono }}>weaken a foe in battle → CAPTURE</Text>
                </View>
              ) : (
                <View style={{ gap:8 }}>
                  {menagerie.map((entry, idx) => {
                    // Try to match to a companion skin
                    const matchSkin = SKIN_IDS.find(sid =>
                      (COMPANION_LORE[sid]?.name ?? SKINS[sid].name) === entry.name
                    );
                    const companionImg = matchSkin ? (ZONE_COMPANION_IMAGES[`${matchSkin}_1`] ?? null) : null;
                    const enemyImgKey = entry.name.toLowerCase().replace(/'/g,'').replace(/\s+/g,'_') as keyof typeof ENEMY_IMAGES;
                    const enemyImg = !companionImg ? (ENEMY_IMAGES[enemyImgKey] ?? null) : null;
                    const art = companionImg ?? enemyImg;
                    const zoneColor = SKINS[entry.zone as SkinId]?.color ?? '#DD44FF';
                    const zoneName  = SKINS[entry.zone as SkinId]?.name  ?? entry.zone.toUpperCase();
                    const isComp = !!matchSkin;
                    return (
                      <View key={idx} style={{ flexDirection:'row', alignItems:'center', gap:12, paddingVertical:10, paddingHorizontal:12,
                        borderRadius:12, borderWidth:1, borderColor: isComp ? zoneColor+'44' : '#DD44FF33',
                        backgroundColor: isComp ? zoneColor+'08' : '#DD44FF08' }}>
                        {/* Art */}
                        <View style={{ width:46, height:58, borderRadius:8, borderWidth:1, borderColor: isComp ? zoneColor+'55' : '#DD44FF44',
                          backgroundColor:'#000000', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                          {art ? (
                            <Image source={art} style={{ width:46, height:58, borderRadius:7 }} resizeMode="contain" />
                          ) : (
                            <Text style={{ color: isComp ? zoneColor : '#DD44FF', fontSize:18 }}>
                              {isComp ? (SKINS[matchSkin!].glyph) : '◈'}
                            </Text>
                          )}
                        </View>
                        {/* Info */}
                        <View style={{ flex:1, gap:3 }}>
                          <Text style={{ color:'#DDDDEE', fontSize:12, fontWeight:'700' }}>{entry.name}</Text>
                          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                            {isComp && (
                              <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:zoneColor+'22', borderWidth:1, borderColor:zoneColor+'44' }}>
                                <Text style={{ color:zoneColor, fontSize:6, fontFamily:mono, fontWeight:'700' }}>COMPANION</Text>
                              </View>
                            )}
                            <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#0A0A14', borderWidth:1, borderColor:zoneColor+'33' }}>
                              <Text style={{ color:zoneColor, fontSize:6, fontFamily:mono }}>{zoneName}</Text>
                            </View>
                          </View>
                          <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}>{entry.date}</Text>
                        </View>
                        {/* Field-in-party toggle (#260) */}
                        {(() => {
                          const inParty = party.includes(entry.name);
                          const assist = partyAssistFor(entry.name);
                          return (
                            <TouchableOpacity onPress={() => toggleParty(entry.name)} activeOpacity={0.8}
                              style={{ paddingHorizontal:9, paddingVertical:7, borderRadius:9, borderWidth:1,
                                borderColor: inParty ? '#44CC88' : '#FF664455', backgroundColor: inParty ? '#44CC8818' : '#FF664410', alignItems:'center', minWidth:54 }}>
                              <Text style={{ color: inParty ? '#44CC88' : '#FF6644', fontSize:9, fontFamily:mono, fontWeight:'700' }}>{inParty ? '◈ FIELDED' : '⚔ FIELD'}</Text>
                              <Text style={{ color: inParty ? '#44CC88' : '#88667A', fontSize:8, fontFamily:mono, marginTop:1 }}>+{assist}</Text>
                            </TouchableOpacity>
                          );
                        })()}
                      </View>
                    );
                  })}
                </View>
              )
            )}
          </View>

        </View>
      )}


      {/* ════════════════════════════════════════════════════════════════════
          COMPANION TAB — GROWTH (bond content merged here)
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'companion' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingTop:12 }}>

          {/* ── COMPANION LEVEL + STAT BUILD (#265) ── */}
          {(() => {
            const sid = (equippedCompanionSkin ?? activeSkin) as string;
            const xp = companionXP[sid] ?? 0;
            const lvl = levelFromXP(xp);
            const intoLevel = xp % XP_PER_LEVEL;
            const free = pointsFree(sid);
            const alloc = companionAlloc[sid] ?? {};
            const nm = COMPANION_LORE[sid as SkinId]?.name ?? SKINS[sid as SkinId]?.name ?? 'COMPANION';
            const col = SKINS[sid as SkinId]?.color ?? '#C49A3C';
            return (
              <View style={{ marginBottom:18, padding:14, borderRadius:12, borderWidth:1, borderColor: col+'44', backgroundColor: col+'0A' }}>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <Text style={{ color: col, fontSize:10, fontFamily:mono, letterSpacing:1.5, fontWeight:'700' }}>{nm}</Text>
                  <Text style={{ color: col, fontSize:11, fontFamily:mono, fontWeight:'700' }}>Lv.{lvl}</Text>
                </View>
                {/* XP bar */}
                <View style={{ height:6, borderRadius:3, backgroundColor:'#1A1A2A', overflow:'hidden', marginBottom:4 }}>
                  <View style={{ height:6, width:`${(intoLevel/XP_PER_LEVEL)*100}%` as any, backgroundColor: col, borderRadius:3 }} />
                </View>
                <Text style={{ color:'#66607A', fontSize:8, fontFamily:mono, marginBottom:10 }}>{intoLevel}/{XP_PER_LEVEL} XP to Lv.{lvl+1} · earns 12 XP per dive while active</Text>

                {free > 0 && (
                  <Text style={{ color: col, fontSize:9, fontFamily:mono, fontWeight:'700', marginBottom:8 }}>✦ {free} POINT{free>1?'S':''} TO SPEND — build your companion</Text>
                )}
                <View style={{ gap:6 }}>
                  {STAT_KEYS.map(k => {
                    const v = alloc[k] ?? 0;
                    return (
                      <View key={k} style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                        <Text style={{ color:'#9AA4BC', fontSize:9, fontFamily:mono, width:30 }}>{STAT_LABELS[k]}</Text>
                        <View style={{ flex:1, flexDirection:'row', gap:2 }}>
                          {Array.from({ length:10 }).map((_, i) => (
                            <View key={i} style={{ flex:1, height:7, borderRadius:2, backgroundColor: i < v ? col : col+'1A' }} />
                          ))}
                        </View>
                        <Text style={{ color:'#66607A', fontSize:8, fontFamily:mono, width:18, textAlign:'center' }}>+{v}</Text>
                        <TouchableOpacity onPress={() => spendPoint(sid, k)} disabled={free<=0}
                          style={{ width:24, height:24, borderRadius:7, alignItems:'center', justifyContent:'center', borderWidth:1,
                            borderColor: free>0 ? col+'88' : '#33384A', backgroundColor: free>0 ? col+'1A' : 'transparent' }}>
                          <Text style={{ color: free>0 ? col : '#444', fontSize:13, fontWeight:'700' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
                <Text style={{ color:'#44404F', fontSize:7.5, fontFamily:mono, marginTop:9, textAlign:'center' }}>Each companion keeps its own level + build. Switch freely — they grow as you use them.</Text>
              </View>
            );
          })()}

          {/* ── SEEKER'S FIELD (#258) — living personal data ── */}
          {(lqHistory.length > 0 || diveLog.length > 0) && (
            <View style={{ marginBottom:18, padding:14, borderRadius:12, borderWidth:1, borderColor: skin.color+'33', backgroundColor:'#060610' }}>
              <Text style={{ color: skin.color, fontSize:9, fontFamily:mono, letterSpacing:2, fontWeight:'700', marginBottom:2 }}>◈ SEEKER'S FIELD</Text>
              <Text style={{ color:'#66607A', fontSize:8, fontFamily:mono, marginBottom:12 }}>Your living record — every dive, every shift in the field.</Text>

              {/* LQ sparkline */}
              {lqHistory.length > 1 && (() => {
                const pts = lqHistory.slice(-20);
                const peak = Math.max(...pts, 0.01);
                const BAR_H = 36;
                return (
                  <View style={{ marginBottom:12 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                      <Text style={{ color:'#9AA4BC', fontSize:8, fontFamily:mono, letterSpacing:1 }}>LQ FIELD</Text>
                      <Text style={{ color: avgLQ >= 0.7 ? skin.color : avgLQ >= 0.4 ? '#AAAACC' : '#555566', fontSize:9, fontFamily:mono, fontWeight:'700' }}>
                        {(avgLQ*100).toFixed(0)}% avg
                      </Text>
                    </View>
                    <View style={{ height:BAR_H, flexDirection:'row', alignItems:'flex-end', gap:2 }}>
                      {pts.map((lq, i) => {
                        const h = Math.max(3, (lq / peak) * BAR_H);
                        const col = lq >= 0.7 ? skin.color : lq >= 0.4 ? '#7788AA' : '#333344';
                        return <View key={i} style={{ flex:1, height:h, borderRadius:2, backgroundColor: col }} />;
                      })}
                    </View>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:3 }}>
                      <Text style={{ color:'#333344', fontSize:7, fontFamily:mono }}>{pts.length} sessions</Text>
                      <Text style={{ color:'#333344', fontSize:7, fontFamily:mono }}>recent →</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Dive history */}
              {diveLog.length > 0 && (
                <View>
                  <Text style={{ color:'#9AA4BC', fontSize:8, fontFamily:mono, letterSpacing:1, marginBottom:6 }}>RECENT DIVES</Text>
                  <View style={{ gap:5 }}>
                    {diveLog.slice(0, 7).map((d, i) => (
                      <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                        <View style={{ width:4, height:4, borderRadius:2, backgroundColor: skin.color+'88' }} />
                        <Text style={{ flex:1, color:'#C8C4D8', fontSize:10.5, lineHeight:14 }} numberOfLines={1}>
                          {d.subjectName ?? 'Unknown'}
                        </Text>
                        <Text style={{ color:'#44404F', fontSize:7.5, fontFamily:mono }}>
                          {d.date ? new Date(d.date).toLocaleDateString(undefined, { month:'short', day:'numeric' }) : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {diveLog.length > 7 && (
                    <Text style={{ color: skin.color+'55', fontSize:7.5, fontFamily:mono, marginTop:7, textAlign:'center' }}>
                      + {diveLog.length - 7} more in the archive
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ── THE CHRONICLE (#264) — lore that grows from your real journey ── */}
          {chronicle.length > 0 && (
            <View style={{ marginBottom:18, padding:14, borderRadius:12, borderWidth:1, borderColor: skin.color+'33', backgroundColor: skin.color+'08' }}>
              <Text style={{ color: skin.color, fontSize:9, fontFamily:mono, letterSpacing:2, fontWeight:'700', marginBottom:2 }}>𝔏 THE CHRONICLE</Text>
              <Text style={{ color:'#66607A', fontSize:8, fontFamily:mono, marginBottom:11 }}>Your companion remembers everything you've earned together.</Text>
              <View style={{ gap:9 }}>
                {chronicle.slice(0, 14).map((c, i) => c.isSynthesis ? (
                  <View key={c.ts + '_' + i} style={{ paddingVertical:9, paddingHorizontal:11, borderRadius:9, borderWidth:1, borderColor: skin.color+'55', backgroundColor: skin.color+'0E' }}>
                    <Text style={{ color: skin.color, fontSize:9, fontFamily:mono, letterSpacing:2, marginBottom:4 }}>⊚ THE CHRONICLE SPEAKS</Text>
                    <Text style={{ color:'#DDDAEE', fontSize:12, lineHeight:18, fontStyle:'italic' }}>{c.text}</Text>
                    <Text style={{ color:'#44404F', fontSize:7.5, fontFamily:mono, marginTop:3 }}>{new Date(c.ts).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</Text>
                  </View>
                ) : (
                  <View key={c.ts + '_' + i} style={{ flexDirection:'row', gap:9, alignItems:'flex-start' }}>
                    <Text style={{ fontSize:13, color: skin.color, marginTop:1, width:18, textAlign:'center' }}>{c.glyph}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ color:'#C8C4D8', fontSize:11.5, lineHeight:16 }}>{c.text}</Text>
                      <Text style={{ color:'#44404F', fontSize:7.5, fontFamily:mono, marginTop:2 }}>{new Date(c.ts).toLocaleDateString(undefined, { month:'short', day:'numeric' })}</Text>
                    </View>
                  </View>
                ))}
              </View>
              {chronicle.length > 14 && (
                <Text style={{ color: skin.color+'88', fontSize:8, fontFamily:mono, marginTop:10, textAlign:'center' }}>+ {chronicle.length - 14} more chapters</Text>
              )}
            </View>
          )}

          {/* ── SKILL TREE ──────────────────────────────────────────────────── */}
          {(() => {
            const tiers = [0,1,2,3];
            const NODE_SIZE = 64;
            const GAP = 12;
            const COLS = 3;
            const colW = (NODE_SIZE * COLS + GAP * (COLS-1));
            return (
              <View style={{ marginBottom:20 }}>
                {/* Header */}
                <TouchableOpacity onPress={() => setTreeCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 }}>
                  <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
                  <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>SKILL TREE</Text>
                  <View style={{ flex:1 }} />
                  <Text style={{ color:'#444455', fontSize:8, fontFamily:mono }}>{unlockedNodes.length - 1}/{SKILL_NODES.length - 1} UNLOCKED</Text>
                  <Text style={{ color:'#333344', fontSize:11, marginLeft:6 }}>{treeCollapsed ? '▶' : '▼'}</Text>
                </TouchableOpacity>

                {!treeCollapsed && (
                  <View style={{ backgroundColor:'#060810', borderRadius:14, borderWidth:1, borderColor:'#1A1A2A', padding:16 }}>
                    {/* Progress bar */}
                    <View style={{ marginBottom:16 }}>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:5 }}>
                        <Text style={{ color:'#333344', fontSize:7, fontFamily:mono, letterSpacing:1 }}>DIVES PROGRESS</Text>
                        <Text style={{ color:color, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{totalDives} DIVES</Text>
                      </View>
                      <View style={{ height:4, backgroundColor:'#111122', borderRadius:2 }}>
                        <View style={{ height:4, borderRadius:2, backgroundColor:color, width:`${Math.min(100, (totalDives/75)*100)}%` as any,
                          shadowColor:color, shadowOpacity:0.8, shadowRadius:4, elevation:3 }} />
                      </View>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:4 }}>
                        {[0,10,30,75].map(v => (
                          <Text key={v} style={{ color: totalDives >= v ? color : '#222233', fontSize:6, fontFamily:mono }}>{v}</Text>
                        ))}
                      </View>
                    </View>

                    {/* Tree tiers */}
                    {tiers.map(tier => {
                      const tierNodes = SKILL_NODES.filter(n => n.tier === tier).sort((a,b) => a.col - b.col);
                      const isTier0 = tier === 0;
                      return (
                        <View key={tier}>
                          {/* Connector line from previous tier */}
                          {tier > 0 && (
                            <View style={{ alignItems:'center', marginVertical:4 }}>
                              <View style={{ flexDirection:'row', justifyContent:'space-around', width:'100%' }}>
                                {tierNodes.map(node => {
                                  const parentUnlocked = node.requires.some(r => unlockedNodes.includes(r));
                                  return (
                                    <View key={node.id} style={{ width: NODE_SIZE, alignItems:'center' }}>
                                      <View style={{ width:1.5, height:20, backgroundColor: parentUnlocked ? color+'88' : '#1A1A2A' }} />
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          )}
                          {/* Node row */}
                          <View style={{ flexDirection:'row', justifyContent: isTier0 ? 'center' : 'space-around', gap: isTier0 ? 0 : 0 }}>
                            {tierNodes.map(node => {
                              const isUnlocked = unlockedNodes.includes(node.id);
                              const reqMet = node.requires.every(r => unlockedNodes.includes(r));
                              const canAfford = totalDives >= node.cost;
                              const isSelected = selectedNode === node.id;
                              const isAvailable = reqMet && canAfford && !isUnlocked;
                              const nodeColor = isUnlocked ? color : isAvailable ? '#AAAABC' : '#222233';
                              const nodeBg = isUnlocked ? color + '1A' : isAvailable ? '#1A1A2A' : '#0A0A12';
                              const nodeBorder = isUnlocked ? color + '88' : isAvailable ? '#333344' : '#111118';
                              return (
                                <TouchableOpacity key={node.id}
                                  onPress={() => setSelectedNode(isSelected ? null : node.id)}
                                  activeOpacity={0.75}
                                  style={{ width:NODE_SIZE, alignItems:'center' }}>
                                  {/* Node circle */}
                                  {(() => {
                                    const isPulsing = justUnlockedId === node.id;
                                    return (
                                      <Animated.View style={[{
                                        width:NODE_SIZE, height:NODE_SIZE, borderRadius:NODE_SIZE/2,
                                        borderWidth: isSelected ? 2.5 : 1.5,
                                        borderColor: isSelected ? color : nodeBorder,
                                        backgroundColor: nodeBg,
                                        alignItems:'center', justifyContent:'center',
                                        shadowColor: isUnlocked ? color : 'transparent',
                                        shadowOpacity: isUnlocked ? 0.5 : 0,
                                        shadowRadius: isUnlocked ? 8 : 0,
                                        elevation: isUnlocked ? 4 : 0,
                                      }, isPulsing && {
                                        transform: [{ scale: unlockPulseAnim.interpolate({ inputRange:[0,1], outputRange:[1, 1.14] }) }],
                                      }]}>
                                        <Text style={{ fontSize: tier === 0 ? 22 : 18, color: nodeColor }}>{node.glyph}</Text>
                                        {isUnlocked && (
                                          <View style={{ position:'absolute', bottom:-2, right:-2, width:14, height:14, borderRadius:7, backgroundColor:color, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#0A0A12' }}>
                                            <Text style={{ color:'#0A0A12', fontSize:8, fontWeight:'900' }}>✓</Text>
                                          </View>
                                        )}
                                        {isPulsing && (
                                          <Animated.View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, bottom:0, borderRadius:NODE_SIZE/2,
                                            backgroundColor:color, opacity:unlockPulseAnim.interpolate({ inputRange:[0,1], outputRange:[0, 0.28] }) }} />
                                        )}
                                      </Animated.View>
                                    );
                                  })()}
                                  {/* Node name */}
                                  <Text style={{ color:nodeColor, fontSize:6, fontFamily:mono, letterSpacing:0.5, marginTop:5, textAlign:'center', fontWeight:isUnlocked?'700':'400' }} numberOfLines={2}>{node.name}</Text>
                                  {/* Cost pill */}
                                  {!isUnlocked && (
                                    <View style={{ marginTop:3, paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor: canAfford ? '#1A2A1A' : '#0E0A1A', borderWidth:1, borderColor: canAfford ? '#224422' : '#241640' }}>
                                      <Text style={{ color: canAfford ? '#44AA44' : '#8A86A0', fontSize:6, fontFamily:mono }}>{node.cost}d</Text>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}

                    {/* Selected node detail panel */}
                    {selectedNode && (() => {
                      const node = SKILL_NODES.find(n => n.id === selectedNode)!;
                      const isUnlocked = unlockedNodes.includes(node.id);
                      const reqMet = node.requires.every(r => unlockedNodes.includes(r));
                      const canAfford = totalDives >= node.cost;
                      const canUnlock = reqMet && canAfford && !isUnlocked;
                      const bonusKeys = Object.keys(node.bonus) as (keyof PlayerStats)[];
                      return (
                        <View style={{ marginTop:16, padding:14, borderRadius:12, borderWidth:1, borderColor: isUnlocked ? color+'44' : '#1A1A2A', backgroundColor:'#0A0A14' }}>
                          <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 }}>
                            <Text style={{ fontSize:24 }}>{node.glyph}</Text>
                            <View style={{ flex:1 }}>
                              <Text style={{ color: isUnlocked ? color : '#CCCCDD', fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:1 }}>{node.name}</Text>
                              <Text style={{ color:'#555566', fontSize:8, fontFamily:mono, letterSpacing:1 }}>TIER {node.tier} · {node.cost === 0 ? 'FREE' : `${node.cost} DIVES`}</Text>
                            </View>
                            {isUnlocked && (
                              <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:6, backgroundColor:color+'22', borderWidth:1, borderColor:color+'44' }}>
                                <Text style={{ color, fontSize:8, fontFamily:mono, fontWeight:'700' }}>ACTIVE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ color:'#888899', fontSize:11, lineHeight:17, fontStyle:'italic', marginBottom:10 }}>{node.lore}</Text>
                          {bonusKeys.length > 0 && (
                            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                              {bonusKeys.map(k => (
                                <View key={k} style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:6, backgroundColor:'#1A1A2A', borderWidth:1, borderColor:'#333344' }}>
                                  <Text style={{ color:color, fontSize:9, fontFamily:mono, fontWeight:'700' }}>+{node.bonus[k]} {k.toUpperCase()}</Text>
                                </View>
                              ))}
                              {node.tokenBonus && (
                                <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:6, backgroundColor:'#1A1A2A', borderWidth:1, borderColor:'#333344' }}>
                                  <Text style={{ color:'#FFCC44', fontSize:9, fontFamily:mono, fontWeight:'700' }}>+{node.tokenBonus} TOKENS/DAY</Text>
                                </View>
                              )}
                            </View>
                          )}
                          {!isUnlocked && !reqMet && (
                            <Text style={{ color:'#443322', fontSize:9, fontFamily:mono, marginBottom:8 }}>
                              Requires: {node.requires.map(r => SKILL_NODES.find(n=>n.id===r)?.name ?? r).join(' + ')}
                            </Text>
                          )}
                          {!isUnlocked && !canAfford && reqMet && (
                            <Text style={{ color:'#443322', fontSize:9, fontFamily:mono, marginBottom:8 }}>
                              Need {node.cost - totalDives} more dives
                            </Text>
                          )}
                          {canUnlock && (
                            <TouchableOpacity onPress={() => unlockNode(node.id)}
                              style={{ paddingVertical:12, borderRadius:10, borderWidth:1.5, borderColor:color, backgroundColor:color+'18', alignItems:'center' }}
                              activeOpacity={0.75}>
                              <Text style={{ color, fontSize:11, fontFamily:mono, fontWeight:'700', letterSpacing:2 }}>UNLOCK NODE</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                )}
              </View>
            );
          })()}

          {/* Active vigil */}
          {vigilName && (
            <View style={{ marginBottom:16, padding:14, borderRadius:14, borderWidth:1, borderColor:color+'55', backgroundColor:color+'0C', flexDirection:'row', alignItems:'center', gap:12 }}>
              <View style={{ width:36, height:36, borderRadius:18, borderWidth:1, borderColor:color+'55', backgroundColor:color+'18', alignItems:'center', justifyContent:'center' }}>
                <Text style={{ color, fontSize:18 }}>◎</Text>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ color:color, fontSize:8, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>ACTIVE VIGIL</Text>
                <Text style={{ color:'#CCCCDD', fontSize:13, marginTop:3, fontWeight:'600' }}>{vigilName}</Text>
              </View>
              <View style={{ alignItems:'flex-end' }}>
                <Text style={{ color:color, fontSize:9, fontFamily:mono, fontWeight:'700' }}>+100</Text>
                <Text style={{ color:'#444455', fontSize:7, fontFamily:mono }}>DAY 7</Text>
              </View>
            </View>
          )}

          {/* Feed */}
          <TouchableOpacity onPress={() => setNourishCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:12 }}>
            <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
            <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>NOURISH</Text>
            <View style={{ flex:1 }} />
            <Text style={{ color:color, fontSize:9, fontFamily:mono, fontWeight:'700' }}>{fedToday.length}/3</Text>
            <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}> today</Text>
            <Text style={{ color:'#333344', fontSize:11, marginLeft:4 }}>{nourishCollapsed ? '▶' : '▼'}</Text>
          </TouchableOpacity>
          {!nourishCollapsed && <View onLayout={e => { feedY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:20, padding:12, borderRadius:16, borderWidth:1, borderColor:color+'22', backgroundColor:'#08080F' }}>
            <View style={{ flexDirection:'row', gap:8 }}>
              {dailyFoods.map(food => {
                const eaten = fedToday.includes(food.id);
                return (
                  <TouchableOpacity key={food.id} onPress={() => handleFeed(food)} disabled={eaten}
                    style={{ flex:1, paddingVertical:14, paddingHorizontal:4, borderRadius:12, borderWidth:1.5, borderColor:eaten?color+'55':food.color+'66', backgroundColor:eaten?color+'10':food.color+'0D', alignItems:'center', gap:5, opacity:eaten?0.65:1 }}>
                    <Text style={{ fontSize:22 }}>{food.glyph}</Text>
                    <Text style={{ color:eaten?color:food.color, fontSize:8, fontFamily:mono, letterSpacing:1, textAlign:'center' }}>{food.domain.toUpperCase()}</Text>
                    <Text style={{ color:'#444455', fontSize:9 }}>+{food.xp} XP</Text>
                    {eaten && <Text style={{ color, fontSize:10 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>}

          {/* ── RELICS · LORE · CODEX */}
          <View style={{ paddingTop:8 }}>

          {/* Relics — with bonus stats */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#080810' }}>
            <TouchableOpacity onPress={() => setRelicsCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:relicsCollapsed ? 0 : earnedRelicData.length>0?12:0 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:12, borderRadius:2, backgroundColor:color }} />
                <Text style={{ color:'#444455', fontSize:10, letterSpacing:2, fontFamily:mono }}>RELICS</Text>
                <View style={{ paddingHorizontal:6, paddingVertical:1, borderRadius:4, backgroundColor:color+'18', borderWidth:1, borderColor:color+'33' }}>
                  <Text style={{ color, fontSize:8, fontFamily:mono, fontWeight:'700' }}>{earnedRelicData.length}</Text>
                </View>
              </View>
              <Text style={{ color:'#333344', fontSize:11 }}>{relicsCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!relicsCollapsed && (earnedRelicData.length > 0 ? (
              <View style={{ gap:8 }}>
                {earnedRelicData.map(r => {
                  const bonusKeys = r.bonus ? (Object.keys(r.bonus) as (keyof PlayerStats)[]) : [];
                  return (
                    <View key={r.id} style={{ flexDirection:'row', alignItems:'center', gap:10, padding:10, borderRadius:10, borderWidth:1, borderColor:color+'22', backgroundColor:color+'06' }}>
                      <View style={{ width:36, height:36, borderRadius:8, borderWidth:1, borderColor:color+'44', backgroundColor:color+'12', alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:18 }}>{r.glyph}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ color:SOL_THEME.text, fontSize:12, fontWeight:'700' }}>{r.name}</Text>
                        {bonusKeys.length > 0 && (
                          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:4 }}>
                            {bonusKeys.map(k => (
                              <View key={k} style={{ paddingHorizontal:5, paddingVertical:2, borderRadius:4, backgroundColor:color+'18' }}>
                                <Text style={{ color:color, fontSize:8, fontFamily:mono }}>+{r.bonus![k]} {k.toUpperCase()}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {r.lore && (
                          <Text style={{ color:'#444455', fontSize:9, marginTop:4, fontStyle:'italic', lineHeight:13 }} numberOfLines={2}>{r.lore}</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color:'#333344', fontSize:11, fontStyle:'italic', textAlign:'center', paddingVertical:10 }}>No relics yet. Complete school dives.</Text>
            ))}
          </View>

          {/* Companion Lore */}
          <View onLayout={e => { loreY.current = e.nativeEvent.layout.y; }}
            style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26' }}>
            <TouchableOpacity onPress={() => setLoreCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: loreCollapsed ? 0 : 10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>LORE · {stageData.name}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <TouchableOpacity onPress={handleUploadDoc} disabled={uploadLoading}
                  style={{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3,
                    borderRadius:6, borderWidth:1, borderColor: uploadedDoc ? color+'44' : '#1A1A26',
                    backgroundColor: uploadedDoc ? color+'0A' : 'transparent' }}>
                  <Text style={{ color: uploadedDoc ? color : '#333344', fontSize:8, fontFamily:mono }}>
                    {uploadLoading ? '···' : uploadedDoc ? `↑ ${uploadedDoc.name.slice(0,16)}${uploadedDoc.name.length>16?'…':''}` : '↑ upload'}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color:'#333344', fontSize:11 }}>{loreCollapsed ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {!loreCollapsed && (<>
            {liveLore.slice(0,5).map((l,i) => (
              <View key={i} style={{ borderLeftWidth:2, borderLeftColor:color+'55', paddingLeft:10, marginBottom:10 }}>
                <Text style={{ color:SOL_THEME.text, fontSize:12, lineHeight:19, fontStyle:'italic' }}>{l.text}</Text>
                <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, marginTop:2 }}>{l.subject} · {l.date}</Text>
              </View>
            ))}
            {liveLore.length > 0 && <View style={{ height:1, backgroundColor:'#1A1A26', marginVertical:6 }} />}
            <Text style={{ color:'#555566', fontSize:12, lineHeight:19, fontStyle:'italic' }}>{stageData.lore}</Text>
            </>)}
          </View>

          {/* Lore Codex */}
          <View style={{ marginBottom:14, padding:14, borderRadius:12, borderWidth:1, borderColor:'#1A1A26', backgroundColor:'#060608' }}>
            <TouchableOpacity onPress={() => setCodexCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: codexCollapsed ? 0 : loreCodex.length>0?12:0 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <View style={{ width:3, height:12, borderRadius:2, backgroundColor:'#7744CC' }} />
                <Text style={{ color:'#444455', fontSize:10, letterSpacing:2, fontFamily:mono }}>CODEX</Text>
                {loreCodex.length > 0 && (
                  <View style={{ paddingHorizontal:6, paddingVertical:1, borderRadius:4, backgroundColor:'#7744CC18', borderWidth:1, borderColor:'#7744CC33' }}>
                    <Text style={{ color:'#9966EE', fontSize:8, fontFamily:mono, fontWeight:'700' }}>{loreCodex.length}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <Text style={{ color:'#222233', fontSize:8, fontFamily:mono }}>battle drops</Text>
                <Text style={{ color:'#333344', fontSize:11 }}>{codexCollapsed ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {!codexCollapsed && (loreCodex.length > 0 ? (
              <View style={{ gap:8 }}>
                {loreCodex.slice(0, 12).map((entry, i) => (
                  <View key={entry.id} style={{ flexDirection:'row', gap:10, paddingBottom: i < Math.min(loreCodex.length,12)-1 ? 8 : 0,
                    borderBottomWidth: i < Math.min(loreCodex.length,12)-1 ? 1 : 0, borderBottomColor:'#111118' }}>
                    <View style={{ width:20, height:20, borderRadius:4, alignItems:'center', justifyContent:'center',
                      backgroundColor: entry.type==='enemy' ? '#33006688' : '#00441188' }}>
                      <Text style={{ fontSize:10, color: entry.type==='enemy' ? '#9966CC' : '#44BB77' }}>
                        {entry.type==='enemy' ? '✕' : '◈'}
                      </Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ color: entry.type==='enemy' ? '#665577' : '#446655', fontSize:8, letterSpacing:1, fontFamily:mono, marginBottom:3 }}>
                        {entry.enemy.toUpperCase()} · {entry.date}
                      </Text>
                      <Text style={{ color:'#666677', fontSize:11, lineHeight:17, fontStyle:'italic' }}>{entry.text}</Text>
                    </View>
                  </View>
                ))}
                {loreCodex.length > 12 && (
                  <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, textAlign:'center' }}>+{loreCodex.length-12} more entries</Text>
                )}
              </View>
            ) : (
              <Text style={{ color:'#333344', fontSize:11, fontStyle:'italic', textAlign:'center', paddingVertical:10 }}>
                Defeat entities in battle to unlock lore fragments.
              </Text>
            ))}
          </View>

        </View>
      </View>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          WORLD TAB
          ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'world' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingTop:8 }}>

          {/* TRAVEL MAP ─────────────────────────── */}
          {(() => {
            const mapSkin = (currentRoomId.split('_')[0] as SkinId);
            return (
              <View style={{ marginBottom:14, marginTop:0 }}>
                <TouchableOpacity onPress={() => setGbaMapOpen(true)} activeOpacity={0.8} style={{ flexDirection:'row', alignItems:'center', gap:8, paddingVertical:11, paddingHorizontal:12, borderRadius:10, borderWidth:1, borderColor:'#44FF8844', backgroundColor:'#44FF880A' }}>
                  <Text style={{ fontSize:14 }}>🗺</Text>
                  <Text style={{ color:'#AAFFCC', fontSize:10, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>TRAVEL MAP</Text>
                  <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#44FF8822', borderWidth:1, borderColor:'#44FF8844' }}>
                    <Text style={{ color:'#44FF88', fontSize:7, fontFamily:mono }}>{SKIN_IDS.length} ZONES</Text>
                  </View>
                  <View style={{ flex:1 }} />
                  <Text style={{ color:'#44FF88', fontSize:12 }}>→</Text>
                </TouchableOpacity>
                {gbaMapOpen && <Modal visible={true} transparent animationType="fade" onRequestClose={() => setGbaMapOpen(false)}>
                  <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.94)', justifyContent:'center', alignItems:'center', padding:16 }}>
                  <View style={{ borderRadius:16, borderWidth:1, borderColor:'#2A4A2A', backgroundColor:'#020504', overflow:'hidden', maxHeight:'90%' }}>
                    <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1, borderBottomColor:'#1A2A1A' }}>
                      <Text style={{ color:'#AAFFCC', fontSize:11, letterSpacing:3, fontFamily:mono, fontWeight:'700' }}>🗺 TRAVEL MAP</Text>
                      <TouchableOpacity onPress={() => setGbaMapOpen(false)} hitSlop={{top:12,bottom:12,left:12,right:12}}><Text style={{ color:'#66AA88', fontSize:16 }}>✕</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={{ maxHeight:420 }} showsVerticalScrollIndicator={false}>
                      {(() => {
                        const COLS = 7, COL_W = 42, ROW_H = 40, X0 = 24;
                        const tierCols: Record<string, string> = { ORIGIN:'#C49A3C', ARCANE:'#9B6BFF', MYTHIC:'#5AC878', LEGENDARY:'#44DDCC', SPECTRAL:'#8855FF', BATTLE:'#FF6644', SHOP:'#44AAFF' };
                        const els: any[] = [];
                        let y = 22;
                        RARITY_ORDER.forEach((tier, tierIdx) => {
                          const ids = SKIN_IDS.filter(s => SKIN_RARITY[s]?.tier === tier);
                          if (ids.length === 0) return;
                          const tcol = tierCols[tier] ?? '#888899';
                          const letter = String.fromCharCode(65 + tierIdx);
                          els.push(<SvgText key={`lbl_${tier}`} x={6} y={y} fontSize={7} fill={tcol+'AA'} fontWeight="bold">{letter} · {tier}</SvgText>);
                          y += 16;
                          ids.forEach((sid, i) => {
                            const cx = X0 + (i % COLS) * COL_W;
                            const cy = y + Math.floor(i / COLS) * ROW_H;
                            const s = SKINS[sid];
                            const isActive = sid === mapSkin;
                            const visited = visitedRooms.has(`${sid}_0`);
                            const code = `${letter}${i + 1}`;
                            els.push(
                              <G key={sid} onPress={() => { handleSkin(sid); setGbaMapOpen(false); }}>
                                <Circle cx={cx} cy={cy} r={19} fill="transparent" />
                                {isActive && <Circle cx={cx} cy={cy} r={12} fill="transparent" stroke={s.color} strokeWidth={1.5} opacity={0.7} />}
                                <Circle cx={cx} cy={cy} r={isActive ? 8 : visited ? 7 : 6}
                                  fill={visited ? s.color+'CC' : s.color+'2A'}
                                  stroke={isActive ? s.color : s.color+'66'} strokeWidth={isActive ? 1.5 : 1} />
                                <SvgText x={cx} y={cy + 1.5} textAnchor="middle" fontSize={4.5} fill={visited ? '#000000' : s.color+'99'} fontWeight="bold">{s.glyph}</SvgText>
                                <SvgText x={cx} y={cy + 17} textAnchor="middle" fontSize={6.5} fill={isActive ? s.color : visited ? s.color+'CC' : '#556655'} fontWeight="bold">{code}</SvgText>
                              </G>
                            );
                          });
                          y += Math.ceil(ids.length / COLS) * ROW_H + 12;
                        });
                        return <Svg width={GBA_W} height={y + 10} style={{ backgroundColor:'#030806' }}>{els}</Svg>;
                      })()}
                    </ScrollView>
                    <View style={{ paddingHorizontal:10, paddingVertical:6, borderTopWidth:1, borderTopColor:'#1A2A1A', flexDirection:'row', alignItems:'center', gap:8 }}>
                      <View style={{ width:8, height:8, borderRadius:4, backgroundColor: SKINS[mapSkin]?.color ?? '#44FF88' }} />
                      <Text style={{ color:'#66AA88', fontSize:9, fontFamily:mono }}>NOW: {SKINS[mapSkin]?.name ?? mapSkin.toUpperCase()} · TAP A DOT TO TRAVEL</Text>
                    </View>
                  </View>
                  </View>
                </Modal>}
              </View>
            );
          })()}

          {/* ── WORLD ZONE SELECT ─────────────────────────────────── */}
          {(() => {
            const cardW = (SCREEN_W - 32 - 16) / 3;
            const ZoneCard = ({ id }: { id: SkinId }) => {
              const s = SKINS[id];
              const active = activeSkin === id;
              const { locked, reason, diveCost } = getSkinUnlockStatus(id, totalDives, isSovereign, battleWins, purchasedZones);
              const canBuy = locked && diveCost > 0 && diveCoins >= diveCost;
              const rarity = SKIN_RARITY[id];
              const sceneImg = SCENE_IMAGES[id]?.[0];
              return (
                <TouchableOpacity key={id} onPress={() => !locked && handleSkin(id)}
                  style={{ width:cardW, height:90, borderRadius:10, overflow:'hidden',
                    borderWidth: active ? 2 : 1, borderColor: active ? s.color : rarity.color+'44' }}>
                  {sceneImg && <Image source={sceneImg} style={{ position:'absolute', width:'100%', height:'100%' }} resizeMode="cover" />}
                  <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor: active ? '#00000011' : '#00000044' }} />
                  {locked ? (
                    <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000BB', alignItems:'center', justifyContent:'center' }}>
                      <Text style={{ color:'#555566', fontSize:11 }}>🔒</Text>
                      <Text style={{ color:'#555566', fontSize:6, fontFamily:mono, marginTop:1, textAlign:'center', paddingHorizontal:4 }} numberOfLines={1}>{reason}</Text>
                      {diveCost > 0 && (
                        <TouchableOpacity
                          onPress={e => { e.stopPropagation?.(); unlockZoneWithDives(id, diveCost); }}
                          style={{ marginTop:4, paddingHorizontal:6, paddingVertical:2, borderRadius:4,
                            backgroundColor: canBuy ? '#C8A96E33' : '#1B0B3344',
                            borderWidth:1, borderColor: canBuy ? '#C8A96E88' : '#24164066' }}>
                          <Text style={{ color: canBuy ? '#C8A96E' : '#8A86A0', fontSize:6, fontFamily:mono, fontWeight:'700' }}>{diveCost} ✦</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <>
                      {(() => { const cImg = ZONE_COMPANION_IMAGES[`${id}_1`]; return cImg ? (
                        <Image source={cImg} style={{ position:'absolute', bottom:22, right:3, width:32, height:42, opacity: active ? 1 : 0.6 }} resizeMode="contain" />
                      ) : null; })()}
                      <View style={{ position:'absolute', top:5, right:5, paddingHorizontal:4, paddingVertical:2, borderRadius:4, backgroundColor:'#000000BB' }}>
                        <Text style={{ color:rarity.color, fontSize:6, fontFamily:mono, fontWeight:'700' }}>{rarity.tier}</Text>
                      </View>
                      {active && <View style={{ position:'absolute', top:5, left:5, paddingHorizontal:4, paddingVertical:2, borderRadius:4, backgroundColor:s.color+'AA' }}>
                        <Text style={{ color:'#000000', fontSize:6, fontFamily:mono, fontWeight:'700' }}>ON</Text>
                      </View>}
                      <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#000000CC', paddingHorizontal:5, paddingVertical:4 }}>
                        <Text style={{ color:active ? s.color : '#DDDDEE', fontSize:7, fontFamily:mono, fontWeight:'700', letterSpacing:0.5 }} numberOfLines={1}>{s.name}</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              );
            };

            const SectionHeader = ({ label, count, open, onPress, accentColor }: { label:string; count:number; open:boolean; onPress:()=>void; accentColor:string }) => (
              <TouchableOpacity onPress={onPress} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:8, marginBottom: open ? 8 : 0 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                  <View style={{ width:3, height:12, borderRadius:2, backgroundColor:accentColor }} />
                  <Text style={{ color:'#AAAABC', fontSize:9, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>{label}</Text>
                  <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:accentColor+'22', borderWidth:1, borderColor:accentColor+'44' }}>
                    <Text style={{ color:accentColor, fontSize:7, fontFamily:mono }}>{count}</Text>
                  </View>
                </View>
                <Text style={{ color:'#333344', fontSize:10 }}>{open ? '▼' : '▶'}</Text>
              </TouchableOpacity>
            );

            // ── These arrays MUST mirror SKIN_IDS exactly — single source of truth ──
            const ORIGIN_IDS:    SkinId[] = ['solform','void','aurora','crimson','land_1','land_2','land_3','land_4','land_5'];
            const ARCANE_IDS:    SkinId[] = ['obsidian','lycheetah','chaos','sovereign',
                                              'auroral_chaos','mana_field','antarctic_refuge','veil_atrium'];
            const LANDSCAPE_IDS: SkinId[] = ['land_6','land_7','land_8','land_9','land_10','land_11','land_12','land_13','land_14','land_15'];
            const MYSTIC_IDS:    SkinId[] = ['norse','celtic','egyptian','akashic','kabbala','noetic','lamague','delphi','sufi','quantum'];
            // FRONTIER sub-sections
            const CRYSTAL_IDS:   SkinId[] = ['crystal_nexus','crystal_chaos','crystal_memory','crystal_soul'];
            const CHAOS_IDS:     SkinId[] = ['chaos_temple','chaos_filaments','glitch_cascade','obsidian_forge','obsidian_forge2','celestial_foundry'];
            const SANCTUM_IDS:   SkinId[] = ['pulse_sanctum','noetic_sanctum','lyc_nexus'];
            const ELEMENTAL_IDS: SkinId[] = ['apollo_jungle','neon_cove','alabaster_chasm','aurorian_pillar'];
            const DIM_IDS:       SkinId[] = ['augmented_ai','celestial_sigil','portal_valley','pulse_zone','voyagers_edge'];
            const MYTHIC_IDS:    SkinId[] = [...CRYSTAL_IDS,...CHAOS_IDS,...SANCTUM_IDS,...ELEMENTAL_IDS,...DIM_IDS];
            const BATTLE_IDS:    SkinId[] = ['iron_maw','crucible_heart','phantom_citadel','bone_archive','void_colosseum','war_sanctum','sovereign_forge'];
            const SHOP_IDS:      SkinId[] = ['amber_vault','crystal_spire','veras_garden','golden_library','deep_market','lycheetah_spire'];
            const SECRET_IDS:    SkinId[] = ['veilvein'];

            const ZoneGrid = ({ ids }: { ids: SkinId[] }) => (
              <FlatList data={ids} keyExtractor={id => id} numColumns={3} scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={{ flex:1, margin:4 }}><ZoneCard id={item} /></View>
                )}
                style={{ marginBottom:8 }} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={3}
              />
            );

            return (
              <View style={{ marginBottom:16 }}>
                <TouchableOpacity onPress={() => setWorldCollapsed(v => !v)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: worldCollapsed ? 0 : 4 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <View style={{ width:3, height:14, borderRadius:2, backgroundColor:color }} />
                    <Text style={{ color:'#CCCCDD', fontSize:11, letterSpacing:2, fontFamily:mono, fontWeight:'700' }}>WORLD</Text>
                  </View>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                    <Text style={{ color:'#333344', fontSize:8, fontFamily:mono }}>{SKIN_IDS.length} ZONES</Text>
                    <Text style={{ color:'#333344', fontSize:11 }}>{worldCollapsed ? '▶' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {!worldCollapsed && (<>
                  <SectionHeader label="ORIGIN" count={ORIGIN_IDS.length} open={worldOriginOpen} onPress={() => setWorldOriginOpen(v=>!v)} accentColor="#C49A3C" />
                  {worldOriginOpen && <ZoneGrid ids={ORIGIN_IDS} />}

                  <SectionHeader label="◫ LANDSCAPE" count={LANDSCAPE_IDS.length} open={worldLandscapeOpen} onPress={() => setWorldLandscapeOpen(v=>!v)} accentColor="#C4A86C" />
                  {worldLandscapeOpen && <ZoneGrid ids={LANDSCAPE_IDS} />}

                  <SectionHeader label="ARCANE" count={ARCANE_IDS.length} open={worldArcaneOpen} onPress={() => setWorldArcaneOpen(v=>!v)} accentColor="#7BA7C7" />
                  {worldArcaneOpen && <ZoneGrid ids={ARCANE_IDS} />}

                  <SectionHeader label="MYSTERY SCHOOL" count={MYSTIC_IDS.length} open={worldMysticOpen} onPress={() => setWorldMysticOpen(v=>!v)} accentColor="#5AC878" />
                  {worldMysticOpen && <ZoneGrid ids={MYSTIC_IDS} />}

                  <SectionHeader label="FRONTIER" count={MYTHIC_IDS.length} open={worldFrontierOpen} onPress={() => setWorldFrontierOpen(v=>!v)} accentColor="#44FF88" />
                  {worldFrontierOpen && (<>
                    <SectionHeader label="  ◆ CRYSTAL" count={CRYSTAL_IDS.length} open={worldCrystalOpen} onPress={() => setWorldCrystalOpen(v=>!v)} accentColor="#44DDCC" />
                    {worldCrystalOpen && <ZoneGrid ids={CRYSTAL_IDS} />}
                    <SectionHeader label="  ⚡ CHAOS FORGE" count={CHAOS_IDS.length} open={worldChaosOpen} onPress={() => setWorldChaosOpen(v=>!v)} accentColor="#8855FF" />
                    {worldChaosOpen && <ZoneGrid ids={CHAOS_IDS} />}
                    <SectionHeader label="  ◎ SANCTUM" count={SANCTUM_IDS.length} open={worldSanctumOpen} onPress={() => setWorldSanctumOpen(v=>!v)} accentColor="#AA44FF" />
                    {worldSanctumOpen && <ZoneGrid ids={SANCTUM_IDS} />}
                    <SectionHeader label="  ☀ ELEMENTAL" count={ELEMENTAL_IDS.length} open={worldElementalOpen} onPress={() => setWorldElementalOpen(v=>!v)} accentColor="#88CC44" />
                    {worldElementalOpen && <ZoneGrid ids={ELEMENTAL_IDS} />}
                    <SectionHeader label="  ⊚ DIMENSIONAL" count={DIM_IDS.length} open={worldDimOpen} onPress={() => setWorldDimOpen(v=>!v)} accentColor="#44AAFF" />
                    {worldDimOpen && <ZoneGrid ids={DIM_IDS} />}
                  </>)}

                  <SectionHeader label="⚔ BATTLE" count={BATTLE_IDS.length} open={worldBattleOpen} onPress={() => setWorldBattleOpen(v=>!v)} accentColor="#CC4444" />
                  {worldBattleOpen && <ZoneGrid ids={BATTLE_IDS} />}

                  <SectionHeader label="✦ SHOP" count={SHOP_IDS.length} open={worldShopOpen} onPress={() => setWorldShopOpen(v=>!v)} accentColor="#C49A3C" />
                  {worldShopOpen && <ZoneGrid ids={SHOP_IDS} />}

                  <SectionHeader label="🜍 SECRET" count={SECRET_IDS.length} open={worldSecretOpen} onPress={() => setWorldSecretOpen(v=>!v)} accentColor="#4ECDC4" />
                  {worldSecretOpen && <ZoneGrid ids={SECRET_IDS} />}
                </>)}
              </View>
            );
          })()}

          {/* ── Stat grid ──────────────────────────────────────── */}
          <View style={{ marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <TouchableOpacity onPress={() => setStatsCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: statsCollapsed ? 0 : 8 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>STATS</Text>
              <Text style={{ color:'#333344', fontSize:11 }}>{statsCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!statsCollapsed && ([
              { glyph:'◈', label:'LQ SCORE',      value:`${(avgLQ*100).toFixed(0)}%` },
              { glyph:'⊹', label:'TOTAL DIVES',    value:`${totalDives}` },
              { glyph:'◦', label:'STREAK',         value:`${streak} day${streak!==1?'s':''}` },
            ] as const).map(({ glyph, label, value }) => (
              <View key={label} style={{ flexDirection:'row', alignItems:'center', paddingVertical:5, gap:10 }}>
                <Text style={{ color, fontSize:14, width:20, textAlign:'center' }}>{glyph}</Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, flex:1 }}>{label}</Text>
                <Text style={{ color:SOL_THEME.text, fontSize:12, fontWeight:'700', fontFamily:mono }}>{value}</Text>
              </View>
            ))}
          </View>

          {/* ── Domain glyph strip — last 7 dives ──────────────── */}
          <View style={{ marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <TouchableOpacity onPress={() => setDomainsCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: domainsCollapsed ? 0 : 10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>RECENT DOMAINS</Text>
              <Text style={{ color:'#333344', fontSize:11 }}>{domainsCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!domainsCollapsed && <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
              {Array.from({ length:7 }).map((_, i) => {
                const dive = recentDives[recentDives.length - 7 + i];
                const domain = dive?.domainLabel ?? dive?.subjectName ?? null;
                const glyph = domain ? getDomainGlyph(domain) : '·';
                return (
                  <View key={i} style={{ alignItems:'center', flex:1 }}>
                    <Text style={{ color: domain ? color : '#333344', fontSize:18, opacity: domain ? 1 : 0.3 }}>{glyph}</Text>
                    <Text style={{ color:'#333344', fontSize:7, fontFamily:mono, marginTop:2, opacity: domain ? 0.7 : 0.2 }}>
                      {domain ? domain.slice(0,3).toUpperCase() : '·'}
                    </Text>
                  </View>
                );
              })}
            </View>}
          </View>

          {/* ── AI Field Note ───────────────────────────────────── */}
          <View style={{ marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <TouchableOpacity onPress={() => setFieldNoteCollapsed(v => !v)} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: fieldNoteCollapsed ? 0 : 10 }}>
              <Text style={{ color:'#333344', fontSize:9, letterSpacing:2, fontFamily:mono }}>FIELD NOTE</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                <TouchableOpacity onPress={generateFieldNote} disabled={fieldNoteLoading} activeOpacity={0.7}>
                  <Text style={{ color: fieldNoteLoading ? '#333344' : color, fontSize:18, opacity: fieldNoteLoading ? 0.4 : 1 }}>↺</Text>
                </TouchableOpacity>
                <Text style={{ color:'#333344', fontSize:11 }}>{fieldNoteCollapsed ? '▶' : '▼'}</Text>
              </View>
            </TouchableOpacity>
            {!fieldNoteCollapsed && (<>
            <Text style={{ color:SOL_THEME.text, fontSize:12, fontStyle:'italic', lineHeight:18 }}>
              {fieldNote ?? FIELD_FALLBACKS[Math.floor(Math.random()*FIELD_FALLBACKS.length)]}
            </Text>
            {fieldNoteLoading && (
              <ActivityIndicator size="small" color={SOL_THEME.textMuted} style={{ marginTop:8, alignSelf:'flex-start' }} />
            )}
            </>)}
          </View>

          {/* Stage + stat sheet */}
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12, padding:14, borderRadius:12, borderWidth:1, borderColor:color+'22', backgroundColor:cardBg }}>
            <View>
              <Text style={{ color:'#333344', fontSize:8, letterSpacing:3, fontFamily:mono }}>{stageData.name}</Text>
              <Text style={{ color, fontSize:16, fontWeight:'700', fontFamily:mono, marginTop:2 }}>{displayName}</Text>
              <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic' }}>{archetype.specialty}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowStatModal(true)} activeOpacity={0.75} style={{ alignItems:'center', gap:4 }}>
              <Text style={{ color, fontSize:30 }}>{archetype.glyph}</Text>
              <Text style={{ color:color+'66', fontSize:7, fontFamily:mono, letterSpacing:1 }}>SHEET</Text>
            </TouchableOpacity>
          </View>


        </View>
      )}

      {/* ── GEAR TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'gear' && !tabMinimized && (
        <View style={{ paddingHorizontal:16, paddingTop:8 }}>
          {/* Currency balance */}
          <View style={{ marginBottom:16, padding:14, borderRadius:12, borderWidth:1, borderColor:'#C49A3C44', backgroundColor:'#C49A3C0A' }}>
            <Text style={{ color:'#888899', fontSize:8, fontFamily:mono, letterSpacing:2, marginBottom:10 }}>YOUR BALANCE</Text>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
              <View style={{ flex:1 }}>
                <Text style={{ color:'#C49A3C', fontSize:18, fontWeight:'700', fontFamily:mono }}>⟡ {coins}</Text>
                <Text style={{ color:'#888899', fontSize:7, fontFamily:mono, letterSpacing:1, marginTop:2 }}>LUMENS · battles</Text>
              </View>
              <View style={{ width:1, height:36, backgroundColor:'#33334455' }} />
              <View style={{ flex:1, paddingLeft:12 }}>
                <Text style={{ color:'#AA77FF', fontSize:18, fontWeight:'700', fontFamily:mono }}>✦ {diveCoins}</Text>
                <Text style={{ color:'#888899', fontSize:7, fontFamily:mono, letterSpacing:1, marginTop:2 }}>DIVE CREDITS</Text>
              </View>
              <View style={{ width:1, height:36, backgroundColor:'#33334455' }} />
              <View style={{ flex:1, paddingLeft:12 }}>
                <Text style={{ color:'#7766CC', fontSize:18, fontWeight:'700', fontFamily:mono }}>✧ {veras}</Text>
                <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, letterSpacing:1, marginTop:2 }}>VERAS · knowledge dust</Text>
              </View>
            </View>
          </View>

          {/* ── TODAY'S FORGE (#261) — rotating daily cosmetics, fresh every day ── */}
          {(() => {
            // Deterministic daily pick of 3 buyable (LEGENDARY/SPECTRAL/SECRET) cosmetics with art.
            const pool = ALL_COSMETIC_ITEMS.filter(c => (c.rarity === 'LEGENDARY' || c.rarity === 'SPECTRAL' || c.rarity === 'SECRET') && c.file);
            if (pool.length === 0) return null;
            const featured = [...pool]
              .sort((a, b) => ((DAY_SEED * 53 + a.id.length * 11) % 211) - ((DAY_SEED * 53 + b.id.length * 11) % 211))
              .slice(0, 3);
            const msToMidnight = 86400000 - (Date.now() % 86400000);
            const hrs = Math.floor(msToMidnight / 3600000);
            const mins = Math.floor((msToMidnight % 3600000) / 60000);
            const PRICE: Record<string, number> = { LEGENDARY: 150, SPECTRAL: 250, SECRET: 400 };
            return (
              <View style={{ marginBottom:18, padding:14, borderRadius:12, borderWidth:1, borderColor:'#C49A3C44', backgroundColor:'#C49A3C08' }}>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <Text style={{ color:'#E8C76A', fontSize:10, fontFamily:mono, letterSpacing:2, fontWeight:'700' }}>⟡ TODAY'S FORGE</Text>
                  <Text style={{ color:'#C49A3C99', fontSize:8, fontFamily:mono }}>⟳ resets {hrs}h {mins}m</Text>
                </View>
                <View style={{ flexDirection:'row', gap:8 }}>
                  {featured.map(c => {
                    const owned = shopUnlocks.includes(c.id);
                    const price = PRICE[c.rarity] ?? 200;
                    const rc = RARITY_COLOR[c.rarity];
                    const canAfford = coins >= price;
                    return (
                      <TouchableOpacity key={c.id} activeOpacity={owned ? 1 : 0.8} disabled={owned}
                        onPress={async () => {
                          if (owned) return;
                          if (!canAfford) { showToast(`Need ${price - coins} more ⟡`); return; }
                          const nextCoins = coins - price; setCoins(nextCoins);
                          const nu = [...shopUnlocks, c.id]; setShopUnlocks(nu);
                          await AsyncStorage.multiSet([['sol_coins', String(nextCoins)], ['sol_shop_unlocks', JSON.stringify(nu)]]);
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          showToast(`${c.name} forged!`);
                        }}
                        style={{ flex:1, borderRadius:10, borderWidth:1, borderColor: rc+'55', backgroundColor: rc+'0C', overflow:'hidden', alignItems:'center', paddingBottom:8 }}>
                        {c.file ? <Image source={c.file as any} style={{ width:'100%', height:62, opacity: owned ? 0.4 : 1 }} resizeMode="contain" />
                                : <View style={{ width:'100%', height:62, alignItems:'center', justifyContent:'center' }}><Text style={{ color:rc, fontSize:24 }}>{c.glyph}</Text></View>}
                        <Text style={{ color:rc, fontSize:7, fontFamily:mono, fontWeight:'700', marginTop:4, textAlign:'center', paddingHorizontal:2 }} numberOfLines={1}>{c.name}</Text>
                        <Text style={{ color: owned ? '#44CC88' : canAfford ? '#C49A3C' : '#666677', fontSize:8, fontFamily:mono, fontWeight:'700', marginTop:3 }}>
                          {owned ? 'OWNED ✓' : `⟡ ${price}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })()}

          {/* ── COSMETICS — HALOS ─────────────────────────────────────────── */}
          <TouchableOpacity onPress={() => toggleShopSection('halos')} activeOpacity={0.7} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: shopSections.halos ? 6 : 4 }}>
            <View>
              <Text style={{ color:'#888899', fontSize:9, fontFamily:mono, letterSpacing:2 }}>◯ HALOS — LEGENDARY & SPECTRAL</Text>
              {shopSections.halos && <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, letterSpacing:1, marginTop:2 }}>ORIGIN FREE · ARCANE @25 DIVES · MYTHIC @75 DIVES · BUY BELOW FOR REST</Text>}
            </View>
            <Text style={{ color:'#555566', fontSize:11, fontFamily:mono }}>{shopSections.halos ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {shopSections.halos && ([
            { id:'halo_shop_crown',    name:'SOLAR CROWN',      desc:'Earned aura — mark of deep work',        price:180, unlockId:'halo_crown',    rarity:'LEGENDARY' as CosmeticRarity },
            { id:'halo_shop_astral',   name:'ASTRAL BAND',      desc:'Stellar ring — woven from starlight',    price:200, unlockId:'halo_astral',   rarity:'LEGENDARY' as CosmeticRarity },
            { id:'halo_shop_neon',     name:'NEON CROWN',       desc:'Electric halo — signal in the void',     price:220, unlockId:'halo_neon',     rarity:'LEGENDARY' as CosmeticRarity },
            { id:'halo_shop_boss',     name:'BOSS HALO',        desc:'Apex glyph — worn by those who endure',  price:250, unlockId:'halo_boss',     rarity:'LEGENDARY' as CosmeticRarity },
            { id:'halo_shop_chaos',    name:'CHAOS HALO',       desc:'Fracture ring — entropy made visible',   price:350, unlockId:'halo_chaos',    rarity:'SPECTRAL' as CosmeticRarity },
            { id:'halo_shop_voidband', name:'VOID BAND',        desc:'Null frequency — silence given form',    price:400, unlockId:'halo_voidband', rarity:'SPECTRAL' as CosmeticRarity },
            { id:'halo_shop_void',     name:'VOID SINGULARITY', desc:'Abyss crown — worn beyond the veil',     price:450, unlockId:'halo_void',     rarity:'SPECTRAL' as CosmeticRarity },
            { id:'halo_shop_phi',      name:"PHILOSOPHER'S HALO", desc:'Golden ratio spiral — sacred geometry made crown', price:180, unlockId:'halo_phi',      rarity:'LEGENDARY' as CosmeticRarity },
            { id:'halo_shop_ouroboros',name:'OUROBOROS CROWN',  desc:'Serpent ring — the eternal return',      price:200, unlockId:'halo_ouroboros', rarity:'LEGENDARY' as CosmeticRarity },
            { id:'halo_shop_abyss',    name:'THE ABYSS',        desc:'Ring of pure dark — absorbs light itself', price:500, unlockId:'halo_abyss',   rarity:'SPECTRAL' as CosmeticRarity },
          ]).map(item => {
            const rc = RARITY_COLOR[item.rarity];
            const alreadyOwned = shopUnlocks.includes(item.unlockId) || shopUnlocks.includes(item.id);
            const canAfford = coins >= item.price;
            return (
              <View key={item.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:8, padding:12, borderRadius:10, borderWidth:1, borderColor: alreadyOwned ? '#44FF8844' : '#2A2A3A', backgroundColor: alreadyOwned ? '#44FF880A' : '#0A0A14' }}>
                {findCosmeticArt(item.unlockId) && <Image source={findCosmeticArt(item.unlockId) as any} style={{ width:42, height:42, borderRadius:8, marginRight:10, borderWidth:1, borderColor:rc+'44' }} resizeMode="cover" />}
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:3 }}>
                    <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:3, backgroundColor:rc+'22', borderWidth:1, borderColor:rc+'44' }}>
                      <Text style={{ color:rc, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{item.rarity}</Text>
                    </View>
                  </View>
                  <Text style={{ color:'#EEEEFF', fontSize:12, fontWeight:'700', fontFamily:mono }}>{item.name}</Text>
                  <Text style={{ color:'#555566', fontSize:9, fontFamily:mono, marginTop:2 }}>{item.desc}</Text>
                </View>
                <TouchableOpacity activeOpacity={alreadyOwned || !canAfford ? 1 : 0.7}
                  onPress={async () => {
                    if (alreadyOwned) return;
                    if (!canAfford) { showToast('Not enough ⟡'); return; }
                    const next = coins - item.price; setCoins(next);
                    await AsyncStorage.setItem('sol_coins', String(next));
                    const nextUnlocks = [...shopUnlocks, item.unlockId];
                    setShopUnlocks(nextUnlocks);
                    await AsyncStorage.setItem('sol_shop_unlocks', JSON.stringify(nextUnlocks));
                    showToast(`${item.name} unlocked!`);
                  }}
                  style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:8, borderWidth:1,
                    borderColor: alreadyOwned ? '#44FF8866' : canAfford ? rc+'88' : '#333344',
                    backgroundColor: alreadyOwned ? '#44FF880A' : canAfford ? rc+'18' : 'transparent' }}>
                  <Text style={{ color: alreadyOwned ? '#44FF88' : canAfford ? rc : '#444455', fontSize:10, fontFamily:mono, fontWeight:'700' }}>
                    {alreadyOwned ? 'OWNED ✓' : `⟡ ${item.price}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* ── COSMETICS — WINGS ─────────────────────────────────────────── */}
          <TouchableOpacity onPress={() => toggleShopSection('wings')} activeOpacity={0.7} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:16, marginBottom: shopSections.wings ? 10 : 4 }}>
            <Text style={{ color:'#888899', fontSize:9, fontFamily:mono, letterSpacing:2 }}>◁ WINGS — LEGENDARY & SPECTRAL</Text>
            <Text style={{ color:'#555566', fontSize:11, fontFamily:mono }}>{shopSections.wings ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {shopSections.wings && ([
            { id:'wings_shop_solar',    name:'SOLAR FLARE',     desc:'Blazing span — sunfire unfurled',          price:200, unlockId:'wings_solar',    rarity:'LEGENDARY' as CosmeticRarity },
            { id:'wings_shop_sovereign',name:'SOVEREIGN WINGS', desc:'Crown flight — earned through endurance',  price:220, unlockId:'wings_sovereign',rarity:'LEGENDARY' as CosmeticRarity },
            { id:'wings_shop_aurora',   name:'AURORA WINGS',    desc:'Light mantle — northern fire in flight',   price:250, unlockId:'wings_aurora',   rarity:'LEGENDARY' as CosmeticRarity },
            { id:'wings_shop_athanor',  name:'ATHANOR WINGS',   desc:'Forge span — hammered from the heat',      price:280, unlockId:'wings_athanor',  rarity:'LEGENDARY' as CosmeticRarity },
            { id:'wings_shop_void',     name:'VOID WINGS',      desc:'Abyss flight — nothing beneath your span', price:350, unlockId:'wings_void',     rarity:'SPECTRAL' as CosmeticRarity },
            { id:'wings_shop_spectral', name:'SPECTRAL WINGS',  desc:'Phase shift — between states of matter',   price:380, unlockId:'wings_spectral', rarity:'SPECTRAL' as CosmeticRarity },
            { id:'wings_shop_aether',   name:'AETHER WINGS',    desc:'Etheric plane — non-physical lift',        price:420, unlockId:'wings_aether',   rarity:'SPECTRAL' as CosmeticRarity },
            { id:'wings_shop_chaos',    name:'CHAOS WINGS',     desc:'Chaotic span — fracture made wing',        price:450, unlockId:'wings_chaos',    rarity:'SPECTRAL' as CosmeticRarity },
            { id:'wings_shop_rift',     name:'RIFT WINGS',      desc:'Reality tear — the between made visible',  price:500, unlockId:'wings_rift',     rarity:'SPECTRAL' as CosmeticRarity },
            { id:'wings_shop_celestial',name:'CELESTIAL SPAN',  desc:'Star map span — constellation in flight',  price:220, unlockId:'wings_celestial', rarity:'LEGENDARY' as CosmeticRarity },
            { id:'wings_shop_entropy',  name:'ENTROPY WINGS',   desc:'Dissolving at the edges — fading into nothing', price:380, unlockId:'wings_entropy', rarity:'SPECTRAL' as CosmeticRarity },
            { id:'wings_shop_null',     name:'NULL EXPANSE',    desc:'Wings of void — outlined absence, nothing more', price:450, unlockId:'wings_null',   rarity:'SPECTRAL' as CosmeticRarity },
            { id:'wings_shop_mercury',  name:'THE MERCURY',     desc:'Quicksilver span — the volatile agent in flight', price:500, unlockId:'wings_mercury', rarity:'SPECTRAL' as CosmeticRarity },
          ]).map(item => {
            const rc = RARITY_COLOR[item.rarity];
            const alreadyOwned = shopUnlocks.includes(item.unlockId) || shopUnlocks.includes(item.id);
            const canAfford = coins >= item.price;
            return (
              <View key={item.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:8, padding:12, borderRadius:10, borderWidth:1, borderColor: alreadyOwned ? '#44FF8844' : '#2A2A3A', backgroundColor: alreadyOwned ? '#44FF880A' : '#0A0A14' }}>
                {findCosmeticArt(item.unlockId) && <Image source={findCosmeticArt(item.unlockId) as any} style={{ width:42, height:42, borderRadius:8, marginRight:10, borderWidth:1, borderColor:rc+'44' }} resizeMode="cover" />}
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:3 }}>
                    <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:3, backgroundColor:rc+'22', borderWidth:1, borderColor:rc+'44' }}>
                      <Text style={{ color:rc, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{item.rarity}</Text>
                    </View>
                  </View>
                  <Text style={{ color:'#EEEEFF', fontSize:12, fontWeight:'700', fontFamily:mono }}>{item.name}</Text>
                  <Text style={{ color:'#555566', fontSize:9, fontFamily:mono, marginTop:2 }}>{item.desc}</Text>
                </View>
                <TouchableOpacity activeOpacity={alreadyOwned || !canAfford ? 1 : 0.7}
                  onPress={async () => {
                    if (alreadyOwned) return;
                    if (!canAfford) { showToast('Not enough ⟡'); return; }
                    const next = coins - item.price; setCoins(next);
                    await AsyncStorage.setItem('sol_coins', String(next));
                    const nextUnlocks = [...shopUnlocks, item.unlockId];
                    setShopUnlocks(nextUnlocks);
                    await AsyncStorage.setItem('sol_shop_unlocks', JSON.stringify(nextUnlocks));
                    showToast(`${item.name} unlocked!`);
                  }}
                  style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:8, borderWidth:1,
                    borderColor: alreadyOwned ? '#44FF8866' : canAfford ? rc+'88' : '#333344',
                    backgroundColor: alreadyOwned ? '#44FF880A' : canAfford ? rc+'18' : 'transparent' }}>
                  <Text style={{ color: alreadyOwned ? '#44FF88' : canAfford ? rc : '#444455', fontSize:10, fontFamily:mono, fontWeight:'700' }}>
                    {alreadyOwned ? 'OWNED ✓' : `⟡ ${item.price}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* ── COSMETICS — PETS ──────────────────────────────────────────── */}
          <TouchableOpacity onPress={() => toggleShopSection('pets')} activeOpacity={0.7} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:16, marginBottom: shopSections.pets ? 10 : 4 }}>
            <Text style={{ color:'#888899', fontSize:9, fontFamily:mono, letterSpacing:2 }}>✧ PETS — LEGENDARY & SPECTRAL</Text>
            <Text style={{ color:'#555566', fontSize:11, fontFamily:mono }}>{shopSections.pets ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {shopSections.pets && ([
            { id:'pet_shop_solcub',     name:'SOLCUB',     desc:'Sun cub — warmth that stays close',            price:200, unlockId:'pet_solcub',     rarity:'LEGENDARY' as CosmeticRarity },
            { id:'pet_shop_cinderbird', name:'CINDERBIRD', desc:'Ember bird — ash that rises singing',           price:220, unlockId:'pet_cinderbird', rarity:'LEGENDARY' as CosmeticRarity },
            { id:'pet_shop_athanor',    name:'ATHANOR',    desc:'Forge spirit — the furnace given company',      price:250, unlockId:'pet_athanor',    rarity:'LEGENDARY' as CosmeticRarity },
            { id:'pet_shop_voidling',   name:'VOIDLING',   desc:'Null entity — from the space between',          price:320, unlockId:'pet_voidling',   rarity:'SPECTRAL' as CosmeticRarity },
            { id:'pet_shop_prismshard', name:'PRISMSHARD', desc:'Light shard — spectral clarity crystallised',   price:380, unlockId:'pet_prismshard', rarity:'SPECTRAL' as CosmeticRarity },
            { id:'pet_shop_nebulox',    name:'NEBULOX',    desc:'Cosmic drift — born of the outer field',        price:450, unlockId:'pet_nebulox',    rarity:'SPECTRAL' as CosmeticRarity },
            { id:'pet_shop_suncrawler', name:'SUNCRAWLER', desc:'Solar lizard — radiant, warm, content',          price:200, unlockId:'pet_suncrawler', rarity:'LEGENDARY' as CosmeticRarity },
            { id:'pet_shop_voidmoth',   name:'VOIDMOTH',   desc:'Moth of absence — wings that absorb light',     price:220, unlockId:'pet_voidmoth',   rarity:'LEGENDARY' as CosmeticRarity },
            { id:'pet_shop_fracture',   name:'FRACTURE',   desc:'Shard being — constantly cracking and reforming', price:350, unlockId:'pet_fracture', rarity:'SPECTRAL' as CosmeticRarity },
            { id:'pet_shop_echo',       name:'ECHO',       desc:'Sound made visible — a ripple with eyes',        price:400, unlockId:'pet_echo',       rarity:'SPECTRAL' as CosmeticRarity },
          ]).map(item => {
            const rc = RARITY_COLOR[item.rarity];
            const alreadyOwned = shopUnlocks.includes(item.unlockId) || shopUnlocks.includes(item.id);
            const canAfford = coins >= item.price;
            return (
              <View key={item.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:8, padding:12, borderRadius:10, borderWidth:1, borderColor: alreadyOwned ? '#44FF8844' : '#2A2A3A', backgroundColor: alreadyOwned ? '#44FF880A' : '#0A0A14' }}>
                {findCosmeticArt(item.unlockId) && <Image source={findCosmeticArt(item.unlockId) as any} style={{ width:42, height:42, borderRadius:8, marginRight:10, borderWidth:1, borderColor:rc+'44' }} resizeMode="cover" />}
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:3 }}>
                    <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:3, backgroundColor:rc+'22', borderWidth:1, borderColor:rc+'44' }}>
                      <Text style={{ color:rc, fontSize:7, fontFamily:mono, fontWeight:'700' }}>{item.rarity}</Text>
                    </View>
                  </View>
                  <Text style={{ color:'#EEEEFF', fontSize:12, fontWeight:'700', fontFamily:mono }}>{item.name}</Text>
                  <Text style={{ color:'#555566', fontSize:9, fontFamily:mono, marginTop:2 }}>{item.desc}</Text>
                </View>
                <TouchableOpacity activeOpacity={alreadyOwned || !canAfford ? 1 : 0.7}
                  onPress={async () => {
                    if (alreadyOwned) return;
                    if (!canAfford) { showToast('Not enough ⟡'); return; }
                    const next = coins - item.price; setCoins(next);
                    await AsyncStorage.setItem('sol_coins', String(next));
                    const nextUnlocks = [...shopUnlocks, item.unlockId];
                    setShopUnlocks(nextUnlocks);
                    await AsyncStorage.setItem('sol_shop_unlocks', JSON.stringify(nextUnlocks));
                    showToast(`${item.name} unlocked!`);
                  }}
                  style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:8, borderWidth:1,
                    borderColor: alreadyOwned ? '#44FF8866' : canAfford ? rc+'88' : '#333344',
                    backgroundColor: alreadyOwned ? '#44FF880A' : canAfford ? rc+'18' : 'transparent' }}>
                  <Text style={{ color: alreadyOwned ? '#44FF88' : canAfford ? rc : '#444455', fontSize:10, fontFamily:mono, fontWeight:'700' }}>
                    {alreadyOwned ? 'OWNED ✓' : `⟡ ${item.price}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* ── SECRETS OF LYCHEETAH ─────────────────────────────────────── */}
          <TouchableOpacity onPress={() => toggleShopSection('secrets')} activeOpacity={0.7} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:20, marginBottom: shopSections.secrets ? 8 : 4 }}>
            <View>
              <Text style={{ color:'#CC2222', fontSize:9, fontFamily:mono, letterSpacing:2 }}>𝔏 SECRETS OF LYCHEETAH</Text>
              {shopSections.secrets && <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, letterSpacing:1, marginTop:2 }}>THREE TRANSMISSIONS · 100 ⟡ EACH · UNLOCKS ART + SECRET TEXT</Text>}
            </View>
            <Text style={{ color:'#CC2222', fontSize:11, fontFamily:mono }}>{shopSections.secrets ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {shopSections.secrets && ([
            { id:'secret_shop_fruit',   name:'THE FRUIT THAT HIDES',   desc:'Secret I — On the nature of the lychee',        price:100, unlockId:'pet_lychee',          rarity:'SECRET' as CosmeticRarity },
            { id:'secret_shop_fires',   name:'TWO FIRES, ONE FORGE',   desc:'Secret II — On why all true work requires two', price:100, unlockId:'halo_solve',          rarity:'SECRET' as CosmeticRarity },
            { id:'secret_shop_question',name:'THE QUESTION IS THE KEY', desc:'Secret III — On why the school never answers', price:100, unlockId:'pet_codex',           rarity:'SECRET' as CosmeticRarity },
          ]).map(item => {
            const rc = RARITY_COLOR[item.rarity];
            const alreadyOwned = shopUnlocks.includes(item.unlockId) || shopUnlocks.includes(item.id);
            const canAfford = coins >= item.price;
            return (
              <View key={item.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:8, padding:12, borderRadius:10, borderWidth:1, borderColor: alreadyOwned ? '#CC222244' : '#2A0A0A', backgroundColor: alreadyOwned ? '#CC22220A' : '#0A0606' }}>
                {findCosmeticArt(item.unlockId) && <Image source={findCosmeticArt(item.unlockId) as any} style={{ width:42, height:42, borderRadius:8, marginRight:10, borderWidth:1, borderColor:'#CC222244' }} resizeMode="cover" />}
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:3 }}>
                    <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:3, backgroundColor:'#CC222222', borderWidth:1, borderColor:'#CC222244' }}>
                      <Text style={{ color:'#CC2222', fontSize:7, fontFamily:mono, fontWeight:'700' }}>SECRET</Text>
                    </View>
                  </View>
                  <Text style={{ color:'#EEEEFF', fontSize:12, fontWeight:'700', fontFamily:mono }}>{item.name}</Text>
                  <Text style={{ color:'#555566', fontSize:9, fontFamily:mono, marginTop:2 }}>{item.desc}</Text>
                </View>
                <TouchableOpacity activeOpacity={alreadyOwned || !canAfford ? 1 : 0.7}
                  onPress={async () => {
                    if (alreadyOwned) {
                      const sec = LYCHEETAH_SECRETS.find(s => s.unlockItem === item.unlockId);
                      if (sec) { setReadingSecret(sec); if (Haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }
                      else showToast('Transmission not found');
                      return;
                    }
                    if (!canAfford) { showToast('Not enough ⟡'); return; }
                    const next = coins - item.price; setCoins(next);
                    await AsyncStorage.setItem('sol_coins', String(next));
                    const nextUnlocks = [...shopUnlocks, item.unlockId];
                    setShopUnlocks(nextUnlocks);
                    await AsyncStorage.setItem('sol_shop_unlocks', JSON.stringify(nextUnlocks));
                    showToast(`𝔏 ${item.name} — unlocked · tap 𝔏 READ`);
                  }}
                  style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:8, borderWidth:1,
                    borderColor: alreadyOwned ? '#CC222288' : canAfford ? '#CC222288' : '#333344',
                    backgroundColor: alreadyOwned ? '#CC222218' : canAfford ? '#CC222218' : 'transparent' }}>
                  <Text style={{ color: alreadyOwned ? '#CC2222' : canAfford ? '#CC2222' : '#444455', fontSize:10, fontFamily:mono, fontWeight:'700' }}>
                    {alreadyOwned ? '𝔏 READ' : `⟡ ${item.price}`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {/* ── STARTER PACK ──────────────────────────────────────────────── */}
          <View style={{ marginTop:16, marginBottom:8, padding:12, borderRadius:10, borderWidth:1,
            borderColor: shopUnlocks.includes('coins_bonus_1') ? '#44FF8844' : '#44FF8822',
            backgroundColor: shopUnlocks.includes('coins_bonus_1') ? '#44FF880A' : '#001A08',
            flexDirection:'row', alignItems:'center' }}>
            <View style={{ flex:1 }}>
              <Text style={{ color:'#44FF88', fontSize:7, fontFamily:mono, letterSpacing:1, marginBottom:2 }}>BONUS · FREE</Text>
              <Text style={{ color:'#EEEEFF', fontSize:12, fontWeight:'700', fontFamily:mono }}>STARTER PACK</Text>
              <Text style={{ color:'#555566', fontSize:9, fontFamily:mono, marginTop:2 }}>+200 ⟡ Lumens to begin</Text>
            </View>
            <TouchableOpacity activeOpacity={shopUnlocks.includes('coins_bonus_1') ? 1 : 0.7}
              onPress={async () => {
                if (shopUnlocks.includes('coins_bonus_1')) return;
                const next = coins + 200; setCoins(next);
                await AsyncStorage.setItem('sol_coins', String(next));
                const nextUnlocks = [...shopUnlocks, 'coins_bonus_1'];
                setShopUnlocks(nextUnlocks);
                await AsyncStorage.setItem('sol_shop_unlocks', JSON.stringify(nextUnlocks));
                showToast('Starter Pack claimed! +200 ⟡');
              }}
              style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:8, borderWidth:1,
                borderColor: shopUnlocks.includes('coins_bonus_1') ? '#44FF8866' : '#44FF8888',
                backgroundColor: shopUnlocks.includes('coins_bonus_1') ? '#44FF880A' : '#44FF8818' }}>
              <Text style={{ color:'#44FF88', fontSize:10, fontFamily:mono, fontWeight:'700' }}>
                {shopUnlocks.includes('coins_bonus_1') ? 'OWNED ✓' : 'CLAIM FREE'}
              </Text>
            </TouchableOpacity>
          </View>
          {/* ARSENAL — earned weapons from battle drops */}
          <View style={{ marginTop:20, marginBottom:4 }}>
            <Text style={{ color:'#888899', fontSize:9, fontFamily:mono, letterSpacing:2, marginBottom:10 }}>⚔ ARSENAL — BATTLE DROPS</Text>
            {earnedWeapons.length === 0 ? (
              <Text style={{ color:'#333344', fontSize:11, fontFamily:mono, textAlign:'center', paddingVertical:16 }}>No weapons yet — win battles to earn drops (35% drop rate)</Text>
            ) : (
              earnedWeapons.map(wid => {
                const w = WEAPONS.find(x => x.id === wid);
                if (!w) return null;
                const isEquipped = equippedWeaponId === w.id;
                const rc = WEAPON_RARITY_COLOR[w.rarity];
                return (
                  <View key={w.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:8, padding:10, borderRadius:10, borderWidth:1, borderColor: isEquipped ? rc+'88' : '#2A2A3A', backgroundColor: isEquipped ? rc+'0A' : '#0A0A14' }}>
                    <View style={{ flex:1 }}>
                      <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:2 }}>
                        <Text style={{ color:rc, fontSize:7, fontFamily:mono, letterSpacing:1 }}>{w.rarity}</Text>
                        <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, letterSpacing:1 }}>{w.type}</Text>
                      </View>
                      <Text style={{ color:'#EEEEFF', fontSize:11, fontWeight:'700', fontFamily:mono }}>{w.name}</Text>
                      <Text style={{ color:'#888899', fontSize:9, fontFamily:mono, marginTop:2 }}>ATK+{w.atk} · SPD+{w.spd} · WIL+{w.wil}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => equipWeapon(isEquipped ? null : w.id)}
                      activeOpacity={0.7}
                      style={{ paddingHorizontal:12, paddingVertical:7, borderRadius:8, borderWidth:1, borderColor: isEquipped ? rc+'88' : '#7C3AED66', backgroundColor: isEquipped ? rc+'18' : '#7C3AED18' }}>
                      <Text style={{ color: isEquipped ? rc : '#C084FC', fontSize:9, fontFamily:mono, fontWeight:'700' }}>
                        {isEquipped ? 'EQUIPPED ✦' : 'EQUIP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:8, letterSpacing:1 }}>WEAPONS DROP IN BATTLE · MORE COSMETICS EACH BUILD</Text>

          {/* FRONTIER ZONES — purchasable */}
          <View style={{ marginTop:24, marginBottom:4 }}>
            <Text style={{ color:'#888899', fontSize:9, fontFamily:mono, letterSpacing:2, marginBottom:4 }}>◈ FRONTIER ZONES</Text>
            <Text style={{ color:'#444455', fontSize:9, fontFamily:mono, letterSpacing:1, marginBottom:12 }}>UNLOCK WITH ⟡ COINS OR ✧ VERAS</Text>
            {[
              { id:'amber_vault',    name:'AMBER VAULT',      price:500,  currency:'coins' as const, glyph:'⟟' },
              { id:'crystal_spire', name:'CRYSTAL SPIRE',    price:750,  currency:'coins' as const, glyph:'✦' },
              { id:'golden_library',name:'GOLDEN LIBRARY',   price:1000, currency:'coins' as const, glyph:'⊛' },
              { id:'veras_garden',  name:'VERAS GARDEN',     price:200,  currency:'veras' as const, glyph:'✧' },
              { id:'deep_market',   name:'THE DEEP MARKET',  price:300,  currency:'veras' as const, glyph:'◦' },
              { id:'lycheetah_spire',name:'LYCHEETAH SPIRE', price:500,  currency:'veras' as const, glyph:'⊜' },
            ].map(z => {
              const owned = purchasedZones.includes(z.id);
              const balance = z.currency === 'coins' ? coins : veras;
              const canAfford = balance >= z.price;
              const currencyGlyph = z.currency === 'coins' ? '⟡' : '✧';
              return (
                <View key={z.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:8, padding:10, borderRadius:10, borderWidth:1, borderColor: owned ? '#44CC8844' : '#2A2A3A', backgroundColor: owned ? '#00220E' : '#0A0A14' }}>
                  <Text style={{ color: owned ? '#44CC88' : '#AAAACC', fontSize:18, marginRight:10 }}>{z.glyph}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ color: owned ? '#44CC88' : '#EEEEFF', fontSize:11, fontWeight:'700', fontFamily:mono }}>{z.name}</Text>
                    <Text style={{ color:'#666677', fontSize:9, fontFamily:mono, marginTop:1 }}>
                      {owned ? 'UNLOCKED — accessible in ZONES' : `${z.price} ${currencyGlyph} ${z.currency.toUpperCase()} · you have ${balance} ${currencyGlyph}`}
                    </Text>
                  </View>
                  {!owned && (
                    <TouchableOpacity
                      onPress={async () => {
                        if (!canAfford) { showToast(`Need ${z.price} ${currencyGlyph}`); return; }
                        const next = [...purchasedZones, z.id];
                        setPurchasedZones(next);
                        await AsyncStorage.setItem('sol_zone_unlocks', JSON.stringify(next));
                        if (z.currency === 'coins') {
                          const nc = coins - z.price;
                          setCoins(nc);
                          await AsyncStorage.setItem('sol_coins', String(nc));
                        } else {
                          const nv = veras - z.price;
                          setVeras(nv);
                          await AsyncStorage.setItem('sol_veras', String(nv));
                        }
                        showToast(`◈ ${z.name} unlocked — explore it in ZONES`);
                      }}
                      activeOpacity={0.7}
                      style={{ paddingHorizontal:12, paddingVertical:7, borderRadius:8, borderWidth:1, borderColor: canAfford ? '#DDAA4466' : '#333344', backgroundColor: canAfford ? '#DDAA4418' : '#111120' }}>
                      <Text style={{ color: canAfford ? '#DDAA44' : '#444455', fontSize:9, fontFamily:mono, fontWeight:'700' }}>
                        {canAfford ? `BUY ${z.price}${currencyGlyph}` : 'LOCKED'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>

          {/* BATTLE ZONES — earn by wins */}
          <View style={{ marginTop:16, marginBottom:4 }}>
            <Text style={{ color:'#888899', fontSize:9, fontFamily:mono, letterSpacing:2, marginBottom:4 }}>⚔ BATTLE ZONES</Text>
            <Text style={{ color:'#444455', fontSize:9, fontFamily:mono, letterSpacing:1, marginBottom:12 }}>UNLOCK BY WINNING BATTLES · YOU HAVE {battleWins} WIN{battleWins === 1 ? '' : 'S'}</Text>
            {[
              { id:'iron_maw',        name:'THE IRON MAW',      winsNeeded:10  },
              { id:'crucible_heart',  name:'CRUCIBLE HEART',    winsNeeded:25  },
              { id:'phantom_citadel', name:'PHANTOM CITADEL',   winsNeeded:50  },
              { id:'bone_archive',    name:'THE BONE ARCHIVE',  winsNeeded:75  },
              { id:'void_colosseum',  name:'VOID COLOSSEUM',    winsNeeded:100 },
              { id:'war_sanctum',     name:'THE WAR SANCTUM',   winsNeeded:150 },
              { id:'sovereign_forge', name:'SOVEREIGN FORGE',   winsNeeded:200 },
            ].map(z => {
              const unlocked = battleWins >= z.winsNeeded;
              const remaining = z.winsNeeded - battleWins;
              return (
                <View key={z.id} style={{ flexDirection:'row', alignItems:'center', marginBottom:6, padding:10, borderRadius:10, borderWidth:1, borderColor: unlocked ? '#CC224444' : '#2A2A3A', backgroundColor: unlocked ? '#1A0006' : '#0A0A14' }}>
                  <Text style={{ color: unlocked ? '#CC4444' : '#555566', fontSize:18, marginRight:10 }}>⚔</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ color: unlocked ? '#FF6666' : '#EEEEFF', fontSize:11, fontWeight:'700', fontFamily:mono }}>{z.name}</Text>
                    <Text style={{ color:'#666677', fontSize:9, fontFamily:mono, marginTop:1 }}>
                      {unlocked ? `UNLOCKED at ${z.winsNeeded} wins` : `${z.winsNeeded} wins needed · ${remaining} to go`}
                    </Text>
                  </View>
                  {unlocked && <Text style={{ color:'#CC4444', fontSize:9, fontFamily:mono }}>OPEN ◈</Text>}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ── CAMPAIGN SELECT MODAL ────────────────────────────────────────── */}
      <Modal visible={showCampaignSelect} animationType="slide" transparent statusBarTranslucent>
        <View style={{ flex:1, backgroundColor:'#000000CC', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:'#0D0D1A', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40 }}>
            <Text style={{ color:'#CC99FF', fontSize:10, fontFamily:mono, letterSpacing:3, fontWeight:'700', marginBottom:4 }}>◈ CAMPAIGN SLOTS</Text>
            <Text style={{ color:'#444455', fontSize:8, fontFamily:mono, letterSpacing:1, marginBottom:20 }}>7 chapters · persists across sessions · all dice + wisdom systems active</Text>
            {campaignSlots.map((slot, i) => (
              <View key={i} style={{ marginBottom:12, padding:14, borderRadius:14, borderWidth:1,
                borderColor: slot?.complete ? '#C49A3C55' : slot ? '#AA77FF44' : '#2A2A3A',
                backgroundColor: slot?.complete ? '#C49A3C06' : slot ? '#AA77FF08' : '#11111A' }}>
                {slot ? (
                  <>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <View style={{ flex:1 }}>
                        <Text style={{ color: slot.complete ? '#C49A3C' : '#CC99FF', fontSize:11, fontFamily:mono, fontWeight:'700' }}>{slot.name}</Text>
                        <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, letterSpacing:1, marginTop:3 }}>
                          {slot.complete ? '⟡ COMPLETE' : `CH.${slot.chapter + 1}/7`} · {SKINS[slot.skinId]?.name ?? slot.skinId} · {slot.lastPlayed.slice(0,10)}
                        </Text>
                      </View>
                      {slot.complete && <Text style={{ color:'#C49A3C', fontSize:18 }}>⟡</Text>}
                    </View>
                    {/* Progress bar */}
                    <View style={{ flexDirection:'row', gap:3, marginBottom:10 }}>
                      {[0,1,2,3,4,5,6].map(ch => (
                        <View key={ch} style={{ flex:1, height:3, borderRadius:2, backgroundColor: ch < slot.chapter ? '#AA77FF' : ch === slot.chapter && !slot.complete ? '#AA77FF44' : '#222233' }} />
                      ))}
                    </View>
                    <View style={{ flexDirection:'row', gap:8 }}>
                      {!slot.complete && (
                        <TouchableOpacity onPress={() => continueCampaign(i)}
                          style={{ flex:2, paddingVertical:10, borderRadius:8, backgroundColor:'#AA77FF22', borderWidth:1, borderColor:'#AA77FF66', alignItems:'center' }}>
                          <Text style={{ color:'#CC99FF', fontSize:10, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>CONTINUE →</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => abandonCampaign(i)}
                        style={{ flex:1, paddingVertical:10, borderRadius:8, borderWidth:1, borderColor:'#FF664433', alignItems:'center' }}>
                        <Text style={{ color:'#FF664466', fontSize:9, fontFamily:mono, letterSpacing:1 }}>CLEAR</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity onPress={() => startCampaign(i)} style={{ alignItems:'center', paddingVertical:12 }}>
                    <Text style={{ color:'#2A2A3A', fontSize:8, fontFamily:mono, letterSpacing:2, marginBottom:6 }}>SLOT {i + 1} · EMPTY</Text>
                    <Text style={{ color:'#AA77FF', fontSize:12, fontFamily:mono, fontWeight:'700', letterSpacing:2 }}>+ BEGIN CAMPAIGN</Text>
                    <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, marginTop:4 }}>{SKINS[activeSkin]?.name ?? activeSkin} · 7 chapters</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={() => setShowCampaignSelect(false)} style={{ alignItems:'center', paddingVertical:10, marginTop:4 }}>
              <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, letterSpacing:1 }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── VENTURE MODAL ────────────────────────────────────────────────── */}
      <Modal visible={ventureActive} animationType="fade" transparent={false} statusBarTranslucent>
        {(() => {
          const vs = SKINS[activeSkin];
          const sceneImg = SCENE_IMAGES[activeSkin]?.[0];
          const typeGlyph = (t: string) => t === 'explore' ? '◉' : t === 'risk' ? '⚡' : '◈';
          const typeColor = (t: string) => t === 'explore' ? '#44CC88' : t === 'risk' ? '#FF6644' : '#8855FF';
          return (
            <View style={{ flex:1, backgroundColor:'#000000' }}>
              {sceneImg && <Image source={sceneImg} style={{ position:'absolute', width:'100%', height:'100%' }} resizeMode="cover" />}
              <View style={{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000000CC' }} />

              {/* Header */}
              <View style={{ paddingTop:56, paddingHorizontal:24, paddingBottom:12 }}>
                {isCampaignMode && activeCampaignIdx !== null && campaignSlots[activeCampaignIdx] ? (
                  <>
                    <Text style={{ color:'#CC99FF', fontSize:9, fontFamily:mono, letterSpacing:3, fontWeight:'700' }}>◈ CAMPAIGN · CH.{ventureBeatNum + 1}/7</Text>
                    <Text style={{ color:'#AA77FF88', fontSize:7, fontFamily:mono, letterSpacing:1, marginTop:2 }}>{campaignSlots[activeCampaignIdx]!.name}</Text>
                  </>
                ) : (
                  <Text style={{ color:vs.color, fontSize:9, fontFamily:mono, letterSpacing:3, fontWeight:'700' }}>◆ VENTURE · {vs.name}</Text>
                )}
                {venturePhase !== 'resolve' && (
                  <View style={{ flexDirection:'row', gap:4, marginTop:6 }}>
                    {(isCampaignMode ? [0,1,2,3,4,5,6] : [0,1,2]).map(i => (
                      <View key={i} style={{ flex:1, height:2, borderRadius:1, backgroundColor: i < ventureBeatNum ? (isCampaignMode ? '#AA77FF' : vs.color) : i === ventureBeatNum && venturePhase === 'beat' ? (isCampaignMode ? '#AA77FF88' : vs.color+'88') : '#222233' }} />
                    ))}
                  </View>
                )}
              </View>

              {/* Narrative scroll */}
              <ScrollView ref={ventureScrollRef} style={{ flex:1, paddingHorizontal:24 }} contentContainerStyle={{ paddingBottom:8 }}>
                {ventureLog.map((line, i) => (
                  <Text key={i} style={{ color:'#555566', fontSize:11, fontFamily:mono, marginBottom:4, lineHeight:17 }}>{line}</Text>
                ))}
                {ventureLoading ? (
                  <View style={{ paddingTop:24, alignItems:'center' }}>
                    <ActivityIndicator color={vs.color} />
                    <Text style={{ color:'#444455', fontSize:9, fontFamily:mono, marginTop:8, letterSpacing:2 }}>THE ZONE BREATHES...</Text>
                  </View>
                ) : (
                  <Text style={{ color:'#EEEEFF', fontSize:14, fontFamily:mono, lineHeight:24, marginTop:8 }}>{ventureNarrative}</Text>
                )}
                {venturePhase === 'resolve' && ventureReward && (
                  <View style={{ marginTop:16, padding:12, borderRadius:10, backgroundColor:'#C49A3C11', borderWidth:1, borderColor:'#C49A3C44' }}>
                    <Text style={{ color:'#C49A3C', fontSize:10, fontFamily:mono, fontStyle:'italic' }}>{ventureReward.msg}</Text>
                  </View>
                )}
              </ScrollView>

              {/* Actions */}
              {!ventureLoading && (
                <View style={{ padding:24, gap:10 }}>

                  {/* ── DICE ROLL — RISK FATE ── */}
                  {venturePhase === 'dice' && (
                    <View style={{ alignItems: 'center', gap: 14, paddingVertical: 12 }}>
                      <Text style={{ color: '#FF6644', fontSize: 8, fontFamily: mono, letterSpacing: 3, fontWeight: '700' }}>⚡ RISK — FATE DECIDES</Text>
                      <View style={{ width: 110, height: 110, borderRadius: 20, backgroundColor: '#FF664418', borderWidth: 2, borderColor: ventureDiceSettled ? '#FF6644' : '#FF664455', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#FF6644', fontSize: 58, fontWeight: '700', fontFamily: mono, lineHeight: 70 }}>
                          {ventureDiceSettled ? (ventureDiceRoll ?? ventureDiceDisplay) : ventureDiceDisplay}
                        </Text>
                      </View>
                      {ventureDiceSettled && ventureDiceRoll !== null ? (
                        <View style={{ alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: '#FF6644', fontSize: 15, fontFamily: mono, fontWeight: '700', letterSpacing: 3 }}>
                            {ventureDiceRoll === 6 ? 'CRITICAL' : ventureDiceRoll >= 5 ? 'STRONG' : ventureDiceRoll >= 4 ? 'SOLID' : ventureDiceRoll >= 3 ? 'SHAKY' : ventureDiceRoll >= 2 ? 'ROUGH' : 'DISASTER'}
                          </Text>
                          {ventureDiceRoll === 6 && (
                            <Text style={{ color: '#C49A3C', fontSize: 10, fontFamily: mono, letterSpacing: 2, fontWeight: '700' }}>+2 ✦ CRITICAL BONUS</Text>
                          )}
                          <Text style={{ color: '#333355', fontSize: 8, fontFamily: mono, letterSpacing: 1, marginTop: 2 }}>the zone responds...</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#FF664466', fontSize: 9, fontFamily: mono, letterSpacing: 2 }}>rolling...</Text>
                      )}
                    </View>
                  )}

                  {/* ── KNOWLEDGE SKILL CHECK ── */}
                  {venturePhase === 'skill' && ventureSkillCheck && (
                    <>
                      <View style={{ padding:14, borderRadius:12, backgroundColor:'#8855FF14', borderWidth:1, borderColor:'#8855FF55', marginBottom:2 }}>
                        <Text style={{ color:'#BB88FF', fontSize:8, fontFamily:mono, letterSpacing:2, fontWeight:'700', marginBottom:8 }}>◈ KNOWLEDGE TEST · WISDOM CHALLENGE</Text>
                        <Text style={{ color:'#EEEEFF', fontSize:13, lineHeight:22 }}>{ventureSkillCheck.question}</Text>
                      </View>
                      {ventureSkillCheck.options.map((opt, i) => (
                        <TouchableOpacity key={i} onPress={() => handleSkillAnswer(i)}
                          style={{ padding:13, borderRadius:10, backgroundColor:'#8855FF0E', borderWidth:1, borderColor:'#8855FF33', flexDirection:'row', alignItems:'center', gap:10 }}>
                          <Text style={{ color:'#8855FF', fontSize:12, fontFamily:mono, fontWeight:'700', width:18, textAlign:'center' }}>{['α','β','γ'][i]}</Text>
                          <Text style={{ color:'#CCCCDD', fontSize:11, lineHeight:17, flex:1 }}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                      <Text style={{ color:'#333344', fontSize:7.5, fontFamily:mono, textAlign:'center', marginTop:2 }}>pass = +2 ✦ bonus · fail = the path hardens</Text>
                    </>
                  )}

                  {/* ── BEAT CHOICES ── */}
                  {venturePhase === 'beat' && ventureChoices.map((ch, i) => (
                    <TouchableOpacity key={i} onPress={() => handleVentureChoice(ch)}
                      style={{ padding:14, borderRadius:10, backgroundColor: typeColor(ch.type)+'18', borderWidth:1, borderColor: typeColor(ch.type)+'55', flexDirection:'row', alignItems:'center', gap:10 }}>
                      <Text style={{ color: typeColor(ch.type), fontSize:16 }}>{typeGlyph(ch.type)}</Text>
                      <Text style={{ color: typeColor(ch.type), fontSize:11, fontFamily:mono, fontWeight:'700', flex:1 }}>{ch.label}</Text>
                    </TouchableOpacity>
                  ))}

                  {/* ── RESOLVE ── */}
                  {venturePhase === 'resolve' && (
                    <TouchableOpacity onPress={finishVenture}
                      style={{ padding:16, borderRadius:12, backgroundColor:'#C49A3C22', borderWidth:2, borderColor:'#C49A3C', alignItems:'center' }}>
                      <Text style={{ color:'#C49A3C', fontSize:13, fontFamily:mono, fontWeight:'700', letterSpacing:2 }}>
                        {isCampaignMode ? 'SEAL THE CAMPAIGN' : 'SEAL THE VENTURE'}  +{(ventureReward?.coins ?? 4) + ventureSkillBonus} ✦
                      </Text>
                      {ventureSkillBonus > 0 && (
                        <Text style={{ color:'#C49A3C88', fontSize:8, fontFamily:mono, marginTop:3 }}>
                          {ventureSkillBonus >= 4 ? `⚡ critical roll + ` : ''}◈ knowledge {ventureSkillBonus} bonus ✦
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {venturePhase !== 'resolve' && venturePhase !== 'dice' && (
                    <TouchableOpacity onPress={() => setVentureActive(false)} style={{ alignItems:'center', paddingVertical:8 }}>
                      <Text style={{ color:'#333344', fontSize:9, fontFamily:mono, letterSpacing:1 }}>ABANDON SESSION</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })()}
      </Modal>

      {/* ── RPG STATS MODAL ───────────────────────────────────────────────── */}
      <Modal visible={showStatModal} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'#000000EE', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:SOL_THEME.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, borderWidth:1, borderColor:color+'33', borderBottomWidth:0 }}>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <View>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:3, fontFamily:mono }}>CHARACTER SHEET</Text>
                <Text style={{ color, fontSize:16, fontWeight:'700', fontFamily:mono, marginTop:2 }}>
                  {displayName}
                </Text>
                <Text style={{ color:SOL_THEME.textMuted, fontSize:10, fontStyle:'italic' }}>{COMPANION_LORE[skin.id as SkinId]?.title ?? archetype.title}</Text>
              </View>
              <Text style={{ color, fontSize:32 }}>{archetype.glyph}</Text>
            </View>

            {/* Stat grid — 7 stats from playerStats */}
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {([
                { label:'ATK', glyph:'⚔',  value:playerStats.atk, desc:'Physical strike power',    col:'#FF6B6B', max:40 },
                { label:'DEF', glyph:'◈',  value:playerStats.def, desc:'Damage reduction',          col:'#4ECDC4', max:40 },
                { label:'SPD', glyph:'◦',  value:playerStats.spd, desc:'Speed · dodge threshold',   col:'#DDAA44', max:40 },
                { label:'WIL', glyph:'Ψ',  value:playerStats.wil, desc:'Spell power multiplier',    col:'#9B6BFF', max:40 },
                { label:'LCK', glyph:'✦',  value:playerStats.lck, desc:'Crit + loot rate',          col:'#C49A3C', max:40 },
                { label:'VIT', glyph:'◉',  value:playerStats.vit, desc:'Max HP pool',               col:'#44FF88', max:40 },
                { label:'RES', glyph:'⊛',  value:playerStats.res, desc:'Status resist',             col:'#FF9F1C', max:40 },
              ] as { label:string; glyph:string; value:number; desc:string; col:string; max:number }[]).map(({ label, glyph, value, desc, col, max }) => (
                <View key={label} style={{ width:'47%' }}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                      <Text style={{ color:col, fontSize:12 }}>{glyph}</Text>
                      <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono }}>{label}</Text>
                    </View>
                    <Text style={{ color:col, fontSize:16, fontWeight:'700', fontFamily:mono }}>{value}</Text>
                  </View>
                  <View style={{ height:3, backgroundColor:SOL_THEME.border, borderRadius:2, overflow:'hidden', marginBottom:3 }}>
                    <View style={{ height:3, width:`${Math.min(100, (value/max)*100)}%` as any, backgroundColor:col, borderRadius:2 }} />
                  </View>
                  <Text style={{ color:SOL_THEME.textMuted, fontSize:8, fontStyle:'italic' }}>{desc}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop:4, padding:12, borderRadius:10, borderWidth:1, borderColor:color+'33', backgroundColor:color+'0A' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:9, letterSpacing:2, fontFamily:mono, marginBottom:4 }}>ARCHETYPE BONUS</Text>
              <Text style={{ color, fontSize:12 }}>{archetype.specialty}</Text>
            </View>

            <TouchableOpacity onPress={() => setShowStatModal(false)} style={{ marginTop:16, padding:14, borderRadius:10, borderWidth:1, borderColor:SOL_THEME.border, alignItems:'center' }}>
              <Text style={{ color:SOL_THEME.textMuted, fontSize:13, fontFamily:mono }}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ITEMS TAB ─────────────────────────────────────────────────────── */}

    </ScrollView>

    {/* ═══ CINEMATIC BATTLE MODAL ══════════════════════════════════════════════ */}
    <Modal visible={battleCinemaOpen} animationType="fade" transparent={false} statusBarTranslucent>
      {(() => {
        const def = battle ? getEnemyDef(battle.entityName) : null;
        const rc  = def?.colour ?? '#FF4444';
        const _zoneSkinFallback = (currentRoomId.split('_')[0]) as SkinId;
        const enemyImg = battle
          ? (battle.entitySkinId
            ? (ZONE_COMPANION_IMAGES[`${battle.entitySkinId}_1`] ?? ZONE_COMPANION_IMAGES[`${_zoneSkinFallback}_1`] ?? null)
            : (ENEMY_IMAGES[battle.entityName.toLowerCase().replace(/'/g,'').replace(/\s+/g,'_') as keyof typeof ENEMY_IMAGES]
               ?? ZONE_COMPANION_IMAGES[`${_zoneSkinFallback}_1`] ?? null))
          : null;
        const disabled = attackAnim;
        const archetypeSpells = ARCHETYPE_SPELLS[archetype.id] ?? ARCHETYPE_SPELLS['vigil'];
        const roomSkinId = (currentRoomId.split('_')[0] as SkinId);
        const zoneSpells  = ZONE_ENCOUNTER_SPELLS[roomSkinId] ?? [];
        const spells = [...archetypeSpells, ...zoneSpells];
        const panelBg = def?.rarity === 'legendary' ? '#0C0800' : def?.rarity === 'epic' ? '#06000C' : '#000000';

        if (!battle) return null;

        // ── VICTORY SCREEN ────────────────────────────────────────────────────
        if (battle.won) return (
          <View style={{ flex:1, backgroundColor:'#000000', alignItems:'center', justifyContent:'center', padding:32 }}>
            <LootFloat visible={lootFloatVisible} color={color} onDone={() => setLootFloatVisible(false)} />
            <View style={{ alignItems:'center', gap:14 }}>
              <Text style={{ color, fontSize:52, lineHeight:60 }}>{skin.glyph}</Text>
              <Text style={{ color, fontSize:22, fontWeight:'700', fontFamily:mono, letterSpacing:4 }}>WAVE CLEARED</Text>
              <Text style={{ color:color+'88', fontSize:9, fontFamily:mono, letterSpacing:2 }}>{(COMPANION_LORE[skin.id as SkinId]?.name ?? displayName).toUpperCase()} STANDS</Text>
              <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic', fontFamily:mono, textAlign:'center' }}>
                {(['Something in you shifted.','The field was yours.','A clean finish.','You stood your ground.','That was earned.','The entity falls. Work holds.','Pressure applied. Edge found.','Not luck — weight.'][battle.wave % 8])}
              </Text>
              <Text style={{ color:'#AAAAAA', fontSize:12, fontFamily:mono, letterSpacing:2 }}>WAVE {battle.wave} · +{battle.wave * 20} XP</Text>
              {battle.loot && (
                <View style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:8, borderWidth:1, borderColor:'#FFD70066', backgroundColor:'#FFD70012' }}>
                  <Text style={{ color:'#FFD700', fontSize:12, fontFamily:mono }}>◈ {battle.loot}</Text>
                </View>
              )}
              {(() => { const lore = ENEMY_LORE[battle.entityName.toLowerCase().replace(/ /g,'_')]; return lore ? (
                <Text style={{ color:'#555566', fontSize:11, fontStyle:'italic', textAlign:'center', lineHeight:17, paddingHorizontal:8 }}>{lore}</Text>
              ) : null; })()}
              <View style={{ flexDirection:'row', gap:10, marginTop:16, width:'100%' }}>
                <TouchableOpacity
                  onPress={() => setBattle(freshZoneWave(roomSkinId, battle!.wave + 1, battle!.playerHP, playerStats.vit))}
                  style={{ flex:2, paddingVertical:16, borderRadius:14, borderWidth:2, borderColor:color, backgroundColor:color+'18', alignItems:'center' }}>
                  <Text style={{ color, fontSize:13, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>NEXT WAVE →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setBattleCinemaOpen(false); setBattle(null); }}
                  style={{ flex:1, paddingVertical:16, borderRadius:14, borderWidth:1, borderColor:'#333344', alignItems:'center' }}>
                  <Text style={{ color:'#555566', fontSize:11, fontFamily:mono }}>EXIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

        // ── ACTIVE BATTLE SCREEN ──────────────────────────────────────────────
        const ePct = Math.max(0, Math.min(1, battle.entityHP / battle.maxHP));
        const eDanger = ePct < 0.3;
        const eBarColor = eDanger ? '#FF4444' : ePct < 0.6 ? '#FFAA22' : rc;
        const ppct = Math.max(0, Math.min(1, battle.playerHP / battle.maxPlayerHP));
        const pDanger = ppct < 0.3;
        const pBarColor = pDanger ? '#FF4444' : ppct < 0.55 ? '#FFAA22' : '#44FF88';

        return (
          <View style={{ flex:1, backgroundColor:panelBg }}>
            {/* Red screen flash when player takes damage */}
            <Animated.View pointerEvents="none"
              style={{ position:'absolute', top:0, left:0, right:0, bottom:0,
                backgroundColor:'#FF2222', opacity:screenFlashAnim, zIndex:99 }} />

            {/* Top bar */}
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
              paddingHorizontal:16, paddingTop:52, paddingBottom:12 }}>
              <TouchableOpacity onPress={() => setBattleCinemaOpen(false)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text style={{ color:'#444455', fontSize:20, fontFamily:mono }}>✕</Text>
              </TouchableOpacity>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
                <WaveDots wave={battle.wave} color={color} />
                <TouchableOpacity onPress={() => setAutoMode(v => !v)}
                  style={{ paddingHorizontal:9, paddingVertical:4, borderRadius:6, borderWidth:1,
                    borderColor: autoMode ? '#44FF8866' : '#22223355',
                    backgroundColor: autoMode ? '#44FF8814' : 'transparent' }}>
                  <Text style={{ color: autoMode ? '#44FF88' : '#333344', fontSize:8, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>
                    {autoMode ? '⚙ AUTO' : '◌ AUTO'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setBattleDialogueOn(v => !v); if (!battleDialogueOn) { const sig = BATTLE_MYSTERY_SIGNALS[Math.floor(Math.random()*BATTLE_MYSTERY_SIGNALS.length)]; setCompanionBattleLine(`[${sig.tag}] ${sig.text}`); } }}
                  style={{ paddingHorizontal:7, paddingVertical:4, borderRadius:6, borderWidth:1,
                    borderColor: battleDialogueOn ? color+'88' : '#22223366',
                    backgroundColor: battleDialogueOn ? color+'14' : 'transparent' }}>
                  <Text style={{ color: battleDialogueOn ? color : '#333344', fontSize:8, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>
                    {battleDialogueOn ? '◈' : '◌'}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: tokensLeft > 0 ? color : '#FF444488', fontSize:9, fontFamily:mono, fontWeight:'700' }}>{tokensLeft}T</Text>
              </View>
            </View>

            {/* Enemy section */}
            <View style={{ alignItems:'center', paddingHorizontal:20, flex:1 }}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:14 }}>
                <Text style={{ color:rc, fontSize:17, fontWeight:'700', letterSpacing:0.5, flex:1 }} numberOfLines={1}>{battle.entityName}</Text>
                {battle.enemyStunned && (
                  <View style={{ paddingHorizontal:6, paddingVertical:2, borderRadius:5, backgroundColor:'#FFBB0022', borderWidth:1, borderColor:'#FFBB0066' }}>
                    <Text style={{ color:'#FFBB00', fontSize:7, fontFamily:mono, fontWeight:'700' }}>STUNNED</Text>
                  </View>
                )}
                <View style={{ paddingHorizontal:7, paddingVertical:3, borderRadius:5, borderWidth:1, borderColor:rc+'55', backgroundColor:rc+'14' }}>
                  <Text style={{ color:rc, fontSize:8, fontFamily:mono, fontWeight:'700', letterSpacing:2 }}>{def?.rarity.toUpperCase() ?? 'COMMON'}</Text>
                </View>
              </View>

              {/* BATTLE-1 — INTENT telegraph: what the foe will do next. Read it, answer it. */}
              {battle.enemyIntent && !battle.enemyStunned && battle.entityHP > 0 && (() => {
                const it = battle.enemyIntent;
                const danger = it.kind === 'special';
                const ic = danger ? '#FF5544' : it.kind === 'guard' ? '#4488FF' : '#C49A3C';
                const glyph = danger ? '⚠' : it.kind === 'guard' ? '◈' : '⚔';
                return (
                  <View style={{ flexDirection:'row', alignItems:'center', gap:7, alignSelf:'stretch', marginBottom:12,
                    paddingHorizontal:10, paddingVertical:7, borderRadius:9, borderWidth:1, borderColor:ic+'55',
                    backgroundColor:ic+'12', borderLeftWidth:3, borderLeftColor:ic }}>
                    <Text style={{ color:ic, fontSize:13 }}>{glyph}</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ color:ic, fontSize:8, fontFamily:mono, fontWeight:'700', letterSpacing:2 }}>
                        INTENT · {it.label}
                      </Text>
                      <Text style={{ color:'#AAAABB', fontSize:11, lineHeight:15, marginTop:1 }}>{it.tell}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Large enemy art */}
              <Animated.View style={{ transform:[{translateX:entityShakeAnim}], marginBottom:14 }}>
                {enemyImg ? (
                  <View style={{ borderRadius:16, borderWidth:2, borderColor:rc+'66', overflow:'hidden',
                    shadowColor:rc, shadowOpacity:0.7, shadowRadius:20, elevation:10 }}>
                    <Image source={enemyImg} style={{ width:200, height:240 }} resizeMode="contain" />
                  </View>
                ) : (
                  <View style={{ width:200, height:240, borderRadius:16, borderWidth:2, borderColor:rc+'44',
                    backgroundColor:rc+'08', alignItems:'center', justifyContent:'center' }}>
                    <EnemyGlyphArt
                      glyph={def?.rarity==='legendary'?'⊛':def?.rarity==='epic'?'✦':def?.rarity==='rare'?'⊚':def?.rarity==='uncommon'?'◈':'◌'}
                      color={rc} />
                  </View>
                )}
              </Animated.View>

              {/* Enemy HP bar */}
              <View style={{ width:'100%', marginBottom:6 }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                  <Text style={{ color:'#444455', fontSize:8, fontFamily:mono, letterSpacing:1 }}>
                    VITALITY{eDanger ? ' ▼ LOW' : ''}
                  </Text>
                  <Text style={{ color:eBarColor, fontSize:10, fontFamily:mono, fontWeight:'700' }}>
                    {battle.entityHP}<Text style={{ color:'#333344', fontSize:8 }}>/{battle.maxHP}</Text>
                  </Text>
                </View>
                <View style={{ height:16, backgroundColor:'#0A0005', borderRadius:8, overflow:'hidden', borderWidth:1, borderColor:eBarColor+'33' }}>
                  <View style={{ position:'absolute', top:0, left:0, height:16, width:`${Math.round(ePct*100)}%` as any,
                    backgroundColor:eBarColor, borderRadius:8, shadowColor:eBarColor, shadowOpacity:0.9, shadowRadius:8, elevation:4 }} />
                  <View style={{ position:'absolute', top:2, left:2, right:`${Math.round((1-ePct)*100)}%` as any,
                    height:4, backgroundColor:'#FFFFFF1A', borderRadius:4 }} />
                </View>
              </View>

              {/* BATTLE-4 — Enemy status chips */}
              {(battle.enemyStatuses?.length ?? 0) > 0 && (
                <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                  {(battle.enemyStatuses ?? []).map((s, i) => (
                    <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:6, paddingVertical:2,
                      borderRadius:6, backgroundColor: STATUS_META[s.kind].colour + '22', borderWidth:1, borderColor: STATUS_META[s.kind].colour + '66' }}>
                      <Text style={{ fontSize:10 }}>{STATUS_META[s.kind].glyph}</Text>
                      <Text style={{ color: STATUS_META[s.kind].colour, fontSize:8, fontFamily:mono, fontWeight:'700' }}>
                        {STATUS_META[s.kind].label} {s.turns}t
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Enemy quote */}
              <View style={{ borderLeftWidth:2, borderLeftColor:rc+'66', paddingLeft:8, width:'100%', marginBottom:6 }}>
                <Text style={{ color:'#555566', fontSize:10, fontStyle:'italic', lineHeight:15 }} numberOfLines={2}>
                  {`"${battle.enemyLine}"`}
                </Text>
              </View>
            </View>

            {/* Bottom section */}
            <View style={{ paddingHorizontal:16, paddingBottom:32 }}>
              {/* Companion signal */}
              {battleDialogueOn && companionBattleLine !== '' && (
                <View style={{ flexDirection:'row', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                  <View style={{ width:26, height:26, borderRadius:13, borderWidth:1, borderColor:color+'66',
                    alignItems:'center', justifyContent:'center' }}>
                    <Text style={{ fontSize:12 }}>{skin.glyph}</Text>
                  </View>
                  <View style={{ flex:1, backgroundColor:color+'0E', borderRadius:10, borderWidth:1,
                    borderColor:color+'33', paddingHorizontal:10, paddingVertical:7 }}>
                    <Text style={{ color:'#CCCCDD', fontSize:10, fontStyle:'italic', lineHeight:16 }} numberOfLines={2}>
                      {companionBattleLine}
                    </Text>
                  </View>
                </View>
              )}

              {/* Player HP bar */}
              <View style={{ marginBottom:10, padding:10, borderRadius:12, backgroundColor:'#020D04', borderWidth:1,
                borderColor: pDanger ? '#FF444433' : '#44FF8822' }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                    <Text style={{ color:pBarColor, fontSize:9, fontFamily:mono, fontWeight:'700', letterSpacing:1 }}>YOUR VITALITY</Text>
                    {battle.playerShielded && (
                      <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#4488FF22', borderWidth:1, borderColor:'#4488FF66' }}>
                        <Text style={{ color:'#4488FF', fontSize:7, fontFamily:mono, fontWeight:'700' }}>◈ SHIELDED</Text>
                      </View>
                    )}
                    {battle.defending && !battle.playerShielded && (
                      <View style={{ paddingHorizontal:5, paddingVertical:1, borderRadius:4, backgroundColor:'#4488FF11', borderWidth:1, borderColor:'#4488FF44' }}>
                        <Text style={{ color:'#4488FFAA', fontSize:7, fontFamily:mono }}>◈ BRACED</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color:pBarColor, fontSize:11, fontFamily:mono, fontWeight:'700' }}>
                    {battle.playerHP}<Text style={{ color:'#333344', fontSize:8 }}>/{battle.maxPlayerHP}</Text>
                  </Text>
                </View>
                <View style={{ height:18, backgroundColor:'#001200', borderRadius:9, overflow:'hidden', borderWidth:1, borderColor:pBarColor+'22' }}>
                  <View style={{ position:'absolute', top:0, left:0, height:18, width:`${Math.round(ppct*100)}%` as any,
                    backgroundColor:pBarColor, borderRadius:9, shadowColor:pBarColor, shadowOpacity:0.9, shadowRadius:8, elevation:4 }} />
                  <View style={{ position:'absolute', top:2, left:2, right:`${Math.round((1-ppct)*100)}%` as any,
                    height:5, backgroundColor:'#FFFFFF1E', borderRadius:5 }} />
                  <Animated.View style={{ position:'absolute', top:0, left:0, right:0, bottom:0,
                    backgroundColor:'#FFFFFF', opacity:hpShimmerAnim, borderRadius:9 }} pointerEvents="none" />
                </View>
                {pDanger && <Text style={{ color:'#FF4444AA', fontSize:7, fontFamily:mono, marginTop:4, letterSpacing:1 }}>▼ CRITICAL · HEAL OR RETREAT</Text>}
                {/* BATTLE-4 — Player status chips */}
                {(battle.playerStatuses?.length ?? 0) > 0 && (
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:4, marginTop:5 }}>
                    {(battle.playerStatuses ?? []).map((s, i) => (
                      <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:3, paddingHorizontal:6, paddingVertical:2,
                        borderRadius:6, backgroundColor: STATUS_META[s.kind].colour + '22', borderWidth:1, borderColor: STATUS_META[s.kind].colour + '66' }}>
                        <Text style={{ fontSize:10 }}>{STATUS_META[s.kind].glyph}</Text>
                        <Text style={{ color: STATUS_META[s.kind].colour, fontSize:8, fontFamily:mono, fontWeight:'700' }}>
                          {STATUS_META[s.kind].label} {s.turns}t
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Battle log */}
              <View style={{ marginBottom:10, gap:3 }}>
                {battle.log.slice(0, 3).map((entry, i) => {
                  const isDefend = entry.startsWith('◈');
                  const isSpell  = entry.startsWith('✦');
                  const isItem   = entry.startsWith('◦');
                  const lineColor = i > 0 ? '#333344' : isDefend ? '#5599FF' : isSpell ? color : isItem ? '#44CC88' : '#DDDDEE';
                  return (
                    <Text key={i} style={{ color: lineColor, fontSize: i === 0 ? 11 : 9, fontFamily:mono, lineHeight: i === 0 ? 17 : 14, opacity: 1 - i * 0.38 }}>{entry}</Text>
                  );
                })}
              </View>

              {/* 2×2 action grid */}
              <View style={{ flexDirection:'row', gap:8, marginBottom:8 }}>
                <View style={{ flex:1, gap:8 }}>
                  {([
                    { id:'attack' as const, label:'⚔', name: battleFocusCharged ? '◎ STRIKE' : 'STRIKE', desc: battleFocusCharged ? '×2 power ready' : 'direct strike', col: battleFocusCharged ? '#FFD700' : '#FF5544' },
                    { id:'defend' as const, label:'🛡', name:'SHIELD', desc:'block incoming', col:'#4488FF' },
                  ]).map(btn => (
                    <TouchableOpacity key={btn.id} onPress={() => handleBattleAction(btn.id)} disabled={disabled}
                      style={{ paddingVertical:14, borderRadius:14, borderWidth:1.5,
                        borderColor: disabled ? '#1A1A26' : btn.col+'55',
                        backgroundColor: disabled ? '#080810' : btn.col+'10', alignItems:'center', gap:2 }}>
                      <Text style={{ color: disabled ? '#2A2A3A' : btn.col, fontSize:24 }}>
                        {attackAnim && btn.id === 'attack' ? '·' : btn.label}
                      </Text>
                      <Text style={{ color: disabled ? '#22223A' : btn.col, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>
                        {attackAnim && btn.id === 'attack' ? '···' : btn.name}
                      </Text>
                      <Text style={{ color: disabled ? '#1A1A2A' : btn.col+'88', fontSize:7, fontFamily:mono, letterSpacing:0.5 }}>{btn.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ flex:1, gap:8 }}>
                  {([
                    { id:'focus' as const, label:'◎', name: battleFocusCharged ? 'CHARGED' : 'FOCUS', desc: battleFocusCharged ? 'ready — now strike' : 'charge ×2 strike', col:'#FFD700' },
                    { id:'spell' as const, label:'✦', name:'SPELL',  desc:'spend tokens', col:color },
                  ]).map(btn => {
                    const spellDis = btn.id === 'spell' && (disabled || tokensLeft < Math.min(...spells.map(s => s.cost)));
                    const focusDis = btn.id === 'focus' && (disabled || battleFocusCharged);
                    const dis2 = btn.id === 'spell' ? spellDis : btn.id === 'focus' ? focusDis : disabled;
                    return (
                      <TouchableOpacity key={btn.id} onPress={() => handleBattleAction(btn.id)} disabled={dis2}
                        style={{ paddingVertical:14, borderRadius:14, borderWidth:1.5,
                          borderColor: dis2 && btn.id !== 'focus' ? '#1A1A26' : btn.col+'55',
                          backgroundColor: dis2 && btn.id !== 'focus' ? '#080810' : btn.col+'10', alignItems:'center', gap:2 }}>
                        <Text style={{ color: dis2 && btn.id !== 'focus' ? '#2A2A3A' : btn.col, fontSize:24, fontFamily:mono }}>{btn.label}</Text>
                        <Text style={{ color: dis2 && btn.id !== 'focus' ? '#22223A' : btn.col, fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>{btn.name}</Text>
                        <Text style={{ color: dis2 && btn.id !== 'focus' ? '#1A1A2A' : btn.col+'88', fontSize:7, fontFamily:mono, letterSpacing:0.5 }}>{btn.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Capture */}
              <TouchableOpacity
                onPress={handleCapture}
                disabled={disabled || battle.captureAttempted || battle.captured}
                style={{ paddingVertical:12, borderRadius:12, borderWidth:1.5,
                  borderColor: (disabled || battle.captureAttempted) ? '#1A0A1A' : '#DD44FF55',
                  backgroundColor: (disabled || battle.captureAttempted) ? '#080408' : '#DD44FF10',
                  flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 }}>
                <Text style={{ color: (disabled || battle.captureAttempted) ? '#2A1A2A' : '#DD44FF', fontSize:16 }}>◈</Text>
                <Text style={{ color: (disabled || battle.captureAttempted) ? '#221A22' : '#DD44FF',
                  fontSize:10, fontWeight:'700', fontFamily:mono, letterSpacing:2 }}>
                  {battle.captureAttempted ? 'BINDING ATTEMPTED' : 'CAPTURE'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Spell menu overlay */}
            {spellMenuOpen && (
              <TouchableOpacity activeOpacity={1} onPress={() => setSpellMenuOpen(false)}
                style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:20,
                  justifyContent:'center', padding:16, backgroundColor:'#000000CC' }}>
                <View style={{ backgroundColor:'#06060EEE', borderRadius:14, borderWidth:1.5, borderColor:color+'44', padding:14 }}>
                  <Text style={{ color:color, fontSize:9, fontFamily:mono, letterSpacing:3, marginBottom:4, textAlign:'center' }}>✦ SPELLS</Text>
                  {zoneSpells.length > 0 && (
                    <Text style={{ color:'#555566', fontSize:7, fontFamily:mono, letterSpacing:2, textAlign:'center', marginBottom:10 }}>
                      + {SKINS[roomSkinId]?.name ?? 'ZONE'} SPELLS UNLOCKED
                    </Text>
                  )}
                  {spells.map(sp => {
                    const canCast = tokensLeft >= sp.cost;
                    return (
                      <TouchableOpacity key={sp.id} onPress={() => canCast && handleSpell(sp)} disabled={!canCast}
                        style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                          paddingVertical:11, paddingHorizontal:12, marginBottom:7, borderRadius:10, borderWidth:1,
                          borderColor: canCast ? color+'55' : '#22223355',
                          backgroundColor: canCast ? color+'0E' : 'transparent' }}>
                        <View style={{ flex:1 }}>
                          <Text style={{ color: canCast ? '#CCCCDD' : '#444455', fontSize:12, fontFamily:mono, fontWeight:'700' }}>{sp.name}</Text>
                          <Text style={{ color: canCast ? color+'77' : '#22223366', fontSize:9, fontFamily:mono, marginTop:3 }}>{sp.fx}</Text>
                        </View>
                        <View style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:6, borderWidth:1,
                          borderColor: canCast ? color+'88' : '#33334488',
                          backgroundColor: canCast ? color+'18' : 'transparent' }}>
                          <Text style={{ color: canCast ? color : '#444455', fontSize:11, fontFamily:mono, fontWeight:'700' }}>{sp.cost}T</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:6 }}>TAP OUTSIDE TO CANCEL</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Item menu overlay */}
            {itemMenuOpen && (
              <TouchableOpacity activeOpacity={1} onPress={() => setItemMenuOpen(false)}
                style={{ position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:20,
                  justifyContent:'center', padding:16, backgroundColor:'#000000CC' }}>
                <View style={{ backgroundColor:'#06060EEE', borderRadius:14, borderWidth:1.5, borderColor:'#44CC8844', padding:14 }}>
                  <Text style={{ color:'#44CC88', fontSize:9, fontFamily:mono, letterSpacing:3, marginBottom:12, textAlign:'center' }}>◦ ITEMS</Text>
                  {BATTLE_ITEMS.map(item => {
                    const rc2 = item.rarity==='epic'?'#FF9F1C':item.rarity==='rare'?'#CC66FF':item.rarity==='uncommon'?'#44AAFF':'#667788';
                    return (
                      <TouchableOpacity key={item.id} onPress={() => handleBattleItem(item)}
                        style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                          paddingVertical:10, paddingHorizontal:12, marginBottom:6, borderRadius:10, borderWidth:1,
                          borderColor:rc2+'55', backgroundColor:rc2+'0D' }}>
                        <View style={{ flexDirection:'row', alignItems:'center', gap:10, flex:1 }}>
                          <Text style={{ color:rc2, fontSize:16 }}>{item.glyph}</Text>
                          <View style={{ flex:1 }}>
                            <Text style={{ color:'#CCCCDD', fontSize:12, fontFamily:mono, fontWeight:'700' }}>{item.name}</Text>
                            <Text style={{ color:rc2+'99', fontSize:9, fontFamily:mono, marginTop:2 }}>{item.desc}</Text>
                          </View>
                        </View>
                        <View style={{ paddingHorizontal:6, paddingVertical:3, borderRadius:5, borderWidth:1,
                          borderColor:rc2+'66', backgroundColor:rc2+'18' }}>
                          <Text style={{ color:rc2, fontSize:8, fontFamily:mono, fontWeight:'700' }}>{item.rarity.toUpperCase()}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <Text style={{ color:'#333344', fontSize:8, fontFamily:mono, textAlign:'center', marginTop:6 }}>TAP OUTSIDE TO CANCEL</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        );
      })()}
    </Modal>

    {/* ── FIRST ENCOUNTER OVERLAY ─────────────────────────────────────── */}
    {showFirstEncounter && (
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#000000CC',
        opacity: firstEncounterAnim,
      }}>
        <Text style={{ color: '#FF6644', fontSize: 9, fontFamily: mono, letterSpacing: 4, marginBottom: 12 }}>⚔ FIRST ENCOUNTER</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', fontFamily: mono, letterSpacing: 6, marginBottom: 20 }}>THE FIELD</Text>
        <Text style={{ color: '#CCCCDD', fontSize: 12, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40 }}>
          {'Navigate with the D-pad.\nEnemies appear at random.\nWeaken them, then CAPTURE.'}
        </Text>
        <Text style={{ color: '#FF664488', fontSize: 9, fontFamily: mono, letterSpacing: 2, marginTop: 24 }}>GOOD LUCK, SOVEREIGN</Text>
      </Animated.View>
    )}

    </View>
  );
}
