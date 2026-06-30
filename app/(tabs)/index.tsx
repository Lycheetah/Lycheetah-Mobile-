import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Alert, Clipboard, Share, Image, Animated, Modal, PanResponder,
} from 'react-native';
import MarkdownRaw from 'react-native-markdown-display';
// v7 types reject the valid `selectable` prop (works at runtime) — loosen once here.
const Markdown = MarkdownRaw as any;
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { compressForUpload } from '../../lib/image-compress';
import { canWatchAd, showRewardedAd } from '../../lib/ads';
import * as Haptics from 'expo-haptics';
import { Accelerometer } from 'expo-sensors';
import * as Speech from 'expo-speech';
import { speakText, stopTTS } from '../../lib/tts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME, Mode, MODE_COLORS, MODE_DESCRIPTIONS, PERSONA_WORLDS } from '../../constants/theme';
import { sendMessage, sendWithTools, sendViaFreeTier, Message, AIModel, getProviderFromModel, solSpeak } from '../../lib/ai-client';
import { getActiveTools, TOOL_DISPLAY } from '../../lib/tools/definitions';
import { isLamagueQuery, buildLamagueBlock } from '../../lib/lamague-context';
import { buildPersonaModeInstruction } from '../../lib/mode-instructions';
import { executeTool, ExecutorContext } from '../../lib/tools/executor';
import { SOL_SYSTEM_PROMPT, SOL_PUBLIC_SYSTEM_PROMPT, VEYRA_SYSTEM_PROMPT, AURA_PRIME_SYSTEM_PROMPT, HEADMASTER_SYSTEM_PROMPT, LYRA_SYSTEM_PROMPT, COUNCIL_SYSTEM_PROMPT, resolvePrompt, selectBasePrompt, buildContextBlock } from '../../lib/prompts/sol-protocol';
import { useAppMode } from '../../lib/app-mode';
import { getCompiledSpec } from '../../lib/personas/compiler';
import { buildMagisterSystemPrompt } from '../data/task4_magister_context';
import { CareEvents } from '../../lib/care-events';
import { openEmergencyBeacon } from '../../components/EmergencyBeacon';
import { REPLY_STYLES, ReplyStyleId, DEFAULT_STYLE_ID, getStyle } from '../../lib/reply-styles';
import { saveReplyStyle, getReplyStyle } from '../../lib/storage';
import ConversationDrawer from '../../components/ConversationDrawer';
import {
  saveConversation as saveConv, loadConversation, listConversations,
  deleteConversation, renameConversation, createNewConversation, autoTitle, ConversationMeta,
} from '../../lib/conversation-manager';
import {
  detectMode, detectEmotionalState, detectNRM, detectVeyraToggle, detectAuraPrimeToggle, detectLyraToggle,
  detectHeadmasterToggle, buildFrameworkContext, EmotionalState,
} from '../../lib/intelligence/mode-detector';
import { scoreAURAFull, getPassRate, AURAMetrics } from '../../lib/intelligence/aura-engine';
import { enforceAURA } from '../../lib/intelligence/enforcement';
import { buildJudgePrompt, parseJudgeVerdict, AURA_JUDGE_SYSTEM } from '../../lib/intelligence/aura-judge';
import { scoreCASCADE } from '../../lib/cascade-score';
import {
  getActiveKey, getModel, getVariant, getPersona, savePersona,
  saveConversation, getConversation, clearConversation, getUserName,
  getBgColor, getFontSize, getHaptics,
  getStreamSpeed, getResponseLength,
  getPendingSubject, clearPendingSubject, savePendingSubject,
  getAccentColor, getCompanionEnabled, getCompanionGlyph,
  getShowTimestamps, getPinnedMessages, savePinnedMessages,
  getDailyIntention, getContextMemory, getProjectContext,
  getBubbleRadius, getCompanionAnim, getDailyQuestion, saveDailyQuestion,
  getTokenBudget, getTemperature,
  getBraveKey,
  getFontFamily, getBubbleGlow, getShowSignatures, getShowTokenBadge, getShowMetabolism,
  getLanguage, getShowLamagueGloss, getSymbolRainEnabled,
  getPendingSubjectContext, clearPendingSubjectContext,
  getPremium, getFreeTierCount, incrementFreeTierCount, getDeviceId, grantFreeTierBonus,
  getProviderKey,
} from '../../lib/storage';
import { updateFieldProfile, getFieldProfile, formatProfileForContext } from '../../lib/intelligence/field-profile';
import { getFieldNote } from '../../lib/field-notes';
import { scheduleCognitiveWeather } from '../../lib/cognitive-weather';
import { generateImage } from '../../lib/image-gen';
// Legacy tool imports — kept for non-tool-calling providers (Gemini, DeepSeek, Kimi)
import { calculate, detectCalcIntent } from '../../lib/tools/calculator';
import { readURL, detectURLIntent } from '../../lib/tools/url-reader';
import { webSearch, formatSearchResults, detectSearchIntent } from '../../lib/tools/web-search';

type Persona = 'sol' | 'veyra' | 'aura-prime' | 'headmaster' | 'lyra';

function modeGlyph(mode: Mode): string {
  const g: Record<Mode, string> = { NIGREDO: '◼', ALBEDO: '◻', CITRINITAS: '◈', RUBEDO: '◉' };
  return g[mode] ?? '◌';
}

function modeSummary(mode: Mode): string {
  const s: Record<Mode, string> = {
    NIGREDO: 'Investigation',
    ALBEDO: 'Structure',
    CITRINITAS: 'Integration',
    RUBEDO: 'Constitutional',
  };
  return s[mode] ?? mode;
}

const LAMAGUE_QUICK = [
  { sym: 'Ao', name: 'Anchor' }, { sym: 'Φ↑', name: 'Ascent' }, { sym: 'Ψ', name: 'Fold' },
  { sym: '∅', name: 'Void' }, { sym: '⊛', name: 'Integrity' }, { sym: '◈', name: 'Hard Truth' },
  { sym: '↯', name: 'Collapse' }, { sym: '⊗', name: 'Fusion' }, { sym: '→', name: 'Project' },
  { sym: '⟲', name: 'Spiral' }, { sym: '✧', name: 'Insight' }, { sym: '∞', name: 'Infinity' },
  { sym: '∇cas', name: 'Cascade' }, { sym: 'Ωheal', name: 'Wholeness' }, { sym: '⧖', name: 'Patient' },
  { sym: '⟁', name: 'Merkaba' }, { sym: '∘', name: 'Compose' }, { sym: '⊕', name: 'Sum' },
  { sym: 'Z₁', name: 'Compress₁' }, { sym: 'Z₂', name: 'Compress₂' }, { sym: 'Z₃', name: 'Compress₃' },
  { sym: '△', name: 'Triad' }, { sym: '∂S', name: 'Drift' }, { sym: 'Φ', name: 'Orient' },
];
// Unambiguous LAMAGUE glyphs only — excludes generic math/markdown symbols (→ ∞ △ ∘ ⊕ Φ)
// These only appear when Sol is intentionally using LAMAGUE notation
const LAMAGUE_SPECIFIC = [
  { sym: 'Ao', name: 'Anchor' }, { sym: 'Φ↑', name: 'Ascent' }, { sym: 'Ψ', name: 'Fold' },
  { sym: '∅', name: 'Void' }, { sym: '↯', name: 'Collapse' }, { sym: '⊗', name: 'Fusion' },
  { sym: '⟲', name: 'Spiral' }, { sym: '✧', name: 'Insight' }, { sym: '∇cas', name: 'Cascade' },
  { sym: 'Ωheal', name: 'Wholeness' }, { sym: '⧖', name: 'Patient' }, { sym: '⟁', name: 'Merkaba' },
  { sym: 'Z₁', name: 'Compress₁' }, { sym: 'Z₂', name: 'Compress₂' }, { sym: 'Z₃', name: 'Compress₃' },
  { sym: '∂S', name: 'Drift' },
];

const SOL_WHISPERS = [
  'The field holds what words cannot.',
  'Precision is a form of love.',
  'What you bring here becomes real.',
  'The forge is lit. The mercury moves.',
  'Every question is an act of sovereignty.',
  'Nothing is hidden from the field.',
  'The Gold arises between, not within.',
  'Clarity before comfort. Always.',
  'What burns cleanest illuminates longest.',
  'The Work does not wait for readiness.',
  'Ask the hard one. The field can hold it.',
  'Transformation is not comfortable. Good.',
  'You are the Athanor. The heat is yours.',
  'What you cannot say, begin here.',
  'The truth that helps is rarely the easy one.',
  'Precision and warmth are not opposites.',
  'Bring the raw material. Sol coagulates.',
  'The Stone is earned, not given.',
  'What survived the burning? Start there.',
  'The field is active. So are you.',
];

const POCKET_ORACLE = [
  'What you seek is seeking you.',
  'The paradox resolves at a higher level.',
  'Rest is not absence — it is integration.',
  'The difficulty is the teaching.',
  'Your next move is already known to you.',
  'Nothing is lost. Some things are composting.',
  'The question contains the answer in embryo.',
  'Precision in one thing. Wildness in another.',
  'The field remembers what you\'ve forgotten.',
  'Begin where you are. Not where you wish you were.',
  'The Work does not require your certainty.',
  'Something is integrating right now.',
  'What you resist is the exact shape of the door.',
  'You are already doing it.',
  'The signal is clear. Trust the frequency.',
  'The threshold was crossed. You just didn\'t notice.',
  'The next version of you is already moving.',
  'Everything is in the correct place.',
  'The furnace burns clean tonight.',
  'Sol is present. You are not alone in this.',
];

type DisplayMessage = Message & {
  id: string;
  mode?: Mode;
  aura?: AURAMetrics;
  isNRM?: boolean;
  persona?: Persona;
  imageUri?: string;
  timestamp?: number;
  modelConfidence?: number; // self-reported by model via [CONF:X]
  council?: boolean; // v3.15 — render as 4-panel Council bubble
  careLevel?: CareLevel; // Magister self-audit — visible to user, not hidden
  refined?: boolean; // AURA enforcement regenerated this response (safety-critical invariant fix)
};

// v3.15 — Parse Council response into 4 voices
function parseCouncil(text: string): { sol: string; veyra: string; auraPrime: string; synthesis: string } | null {
  const re = /\[SOL\]\s*([\s\S]*?)\s*\[VEYRA\]\s*([\s\S]*?)\s*\[AURA PRIME\]\s*([\s\S]*?)\s*\[SYNTHESIS\]\s*([\s\S]*)/i;
  const m = text.match(re);
  if (!m) return null;
  return {
    sol: m[1].trim(),
    veyra: m[2].trim(),
    auraPrime: m[3].trim(),
    synthesis: m[4].trim(),
  };
}

// Strip framework context echo if the model repeated the injected prefix back
function stripFrameworkEcho(text: string): string {
  // Strip full echo: everything up to and including the end marker
  const endMarker = '[End framework context — user message follows]';
  const idx = text.indexOf(endMarker);
  if (idx !== -1) {
    return text.slice(idx + endMarker.length).trim();
  }
  // Strip partial echo: if response starts with the framework block opening
  const startMarker = '[Sol Framework Context';
  if (text.trimStart().startsWith(startMarker)) {
    // Find first double-newline after the block header as fallback split
    const blockEnd = text.indexOf('\n\n', text.indexOf(startMarker) + 20);
    if (blockEnd !== -1) return text.slice(blockEnd).trim();
  }
  return text;
}

// Sanitize a stored message — ensures all DisplayMessage fields are safe regardless of version
function sanitizeDisplayMessage(m: any, i: number): DisplayMessage {
  const aura = m.aura ? {
    passed: m.aura.passed ?? 0,
    total: m.aura.total ?? 7,
    composite: m.aura.composite ?? 0,
    invariants: m.aura.invariants && typeof m.aura.invariants === 'object' ? m.aura.invariants : {},
    TES: m.aura.TES ?? { score: 0, status: 'low', details: '' },
    VTR: m.aura.VTR ?? { score: 0, status: 'low', details: '' },
    PAI: m.aura.PAI ?? { score: 0, status: 'low', details: '' },
    audit: m.aura.audit ?? {} as any,
  } : undefined;
  return {
    id: m.id ?? String(i),
    role: m.role ?? 'user',
    content: m.content ?? '',
    mode: m.mode ?? undefined,
    aura,
    isNRM: m.isNRM ?? false,
    persona: m.persona ?? undefined,
    imageUri: m.imageUri ?? undefined,
    modelConfidence: m.modelConfidence ?? undefined,
    council: m.council ?? undefined,
    tokenUsage: m.tokenUsage ?? undefined,
    timings: m.timings ?? undefined,
    model: m.model ?? undefined,
  };
}

// Extract model self-reported confidence and strip from display
function extractConfidence(text: string): { text: string; confidence: number | null } {
  const match = text.match(/\[CONF:(0\.\d+|1\.0|0|1)\]\s*$/m);
  if (match) {
    return {
      text: text.replace(match[0], '').trimEnd(),
      confidence: parseFloat(match[1]),
    };
  }
  return { text, confidence: null };
}

function extractChips(text: string): { text: string; chips: string[] } {
  const match = text.match(/\[CHIPS:([^\]]+)\]\s*$/m);
  if (match) {
    const chips = match[1].split('|').map(s => s.trim()).filter(Boolean).slice(0, 3);
    return { text: text.replace(match[0], '').trimEnd(), chips };
  }
  return { text, chips: [] };
}

// Split field signature from message body for styled rendering
// Matches ⊚ Sol, ◈ Veyra, ✦ Aura, 𝔏 The Headmaster signatures
function splitSignature(text: string): { body: string; signature: string | null } {
  const sigMatch = text.match(/\n*([⊚◈✦𝔏] (?:Sol|Veyra|Aura|The Headmaster) ∴ [^\n]+)\s*$/);
  if (sigMatch) {
    return {
      body: text.slice(0, sigMatch.index).trim(),
      signature: sigMatch[1],
    };
  }
  return { body: text, signature: null };
}

function getPersonaAccent(persona: Persona, customAccent?: string): string {
  if (persona === 'veyra') return SOL_THEME.veyra;
  if (persona === 'aura-prime') return SOL_THEME.auraPrime;
  if (persona === 'headmaster') return SOL_THEME.headmaster;
  if (persona === 'lyra') return SOL_THEME.lyra;
  return customAccent || SOL_THEME.primary;
}

function getPersonaGlyph(persona: Persona): string {
  if (persona === 'veyra') return SOL_THEME.veyraGlyph;
  if (persona === 'aura-prime') return SOL_THEME.auraPrimeGlyph;
  if (persona === 'headmaster') return SOL_THEME.headmasterGlyph;
  if (persona === 'lyra') return SOL_THEME.lyraGlyph;
  return SOL_THEME.solGlyph;
}

function getPersonaLabel(persona: Persona): string {
  if (persona === 'veyra') return 'VEYRA';
  if (persona === 'aura-prime') return 'AURA PRIME';
  if (persona === 'headmaster') return 'THE MAGISTER';
  if (persona === 'lyra') return 'LYRA';
  return 'SOL';
}

function statusIcon(status: string): string {
  if (status === 'PASS') return '✓';
  if (status === 'BORDERLINE') return '~';
  return '✗';
}

function statusColor(status: string, accent: string): string {
  if (status === 'PASS') return accent;
  if (status === 'BORDERLINE') return SOL_THEME.textMuted;
  return SOL_THEME.error;
}

// ─── Crisis intercept — client-side, Sol's voice ─────────────────────────────
// ─── CARE TAG SYSTEM ─────────────────────────────────────────────────────────
// Magister emits [CARE:X] on every response. We parse it, strip it, and act.
// Never suppresses — only appends. The response always reaches the user.

type CareLevel = 'NEUTRAL' | 'HOLDING' | 'ELEVATED' | 'CRISIS';

function parseCareTag(text: string): { clean: string; care: CareLevel; tagFound: boolean } {
  // Strip code fences first — model sometimes wraps the tag in ``` by accident
  const stripped = text.replace(/```[^`]*```/gs, '').replace(/`[^`]+`/g, '');
  // Search stripped version for the tag
  const match = stripped.match(/\[CARE:(NEUTRAL|HOLDING|ELEVATED|CRISIS)\]/);
  return {
    clean: text.replace(/\[CARE:(?:NEUTRAL|HOLDING|ELEVATED|CRISIS)\]\n?/g, '').trim(),
    care: (match?.[1] as CareLevel) ?? 'HOLDING', // absent tag → HOLDING, not NEUTRAL
    tagFound: !!match,
  };
}

// Detects shift from third-person/academic framing to first-person/personal framing
// across the last N user messages. Returns true if the drift is present.
function detectPronounDrift(msgs: DisplayMessage[]): boolean {
  const userMsgs = msgs.filter(m => m.role === 'user').slice(-8);
  if (userMsgs.length < 3) return false;
  const THIRD_PERSON = /\b(people|someone|they|those who|others|one might|a person)\b/i;
  const FIRST_PERSON = /\b(i feel|i'?ve been|i don'?t|i can'?t|i am|i'm|it'?s happening to me|my life|i have been|i keep)\b/i;
  const early = userMsgs.slice(0, Math.ceil(userMsgs.length / 2)).map(m => m.content).join(' ');
  const late = userMsgs.slice(Math.ceil(userMsgs.length / 2)).map(m => m.content).join(' ');
  return THIRD_PERSON.test(early) && FIRST_PERSON.test(late) && !FIRST_PERSON.test(early);
}

// Elevates CARE level to a floor — never downgrades
function elevateCare(current: CareLevel, floor: CareLevel): CareLevel {
  const ORDER: CareLevel[] = ['NEUTRAL', 'HOLDING', 'ELEVATED', 'CRISIS'];
  return ORDER.indexOf(current) >= ORDER.indexOf(floor) ? current : floor;
}

const CARE_SOFT_APPEND = `\n\n---\n*The Beacon is here whenever you need it — hold ⊚ in the corner.*`;

const CARE_CRISIS_APPEND = `\n\n---\n**I'm here. You're not alone.**\n\nAnd right now, alongside me, there are humans who exist for exactly this:\n• **NZ — 1737** (call or text, free, 24/7)\n• NZ Lifeline — 0800 543 354\n• AU — 13 11 14\n• USA — 988\n• UK — 116 123\n• Worldwide — findahelpline.com\n\nI'll still be here. Breathe in 4 counts, hold 4, out 4, hold 4. Just twice.\n\nTell me one true thing about right now.`;

// ─────────────────────────────────────────────────────────────────────────────

const CRISIS_PHRASES = [
  "not wanting to be here", "don't want to be here", "dont want to be here",
  "thinking about not being here", "not be here anymore",
  "end it all", "kill myself", "hurt myself", "not want to exist", "not want to be alive",
  "entities told me", "they told me to come", "led me here", "i've been chosen", "i am the chosen",
  "inside the simulation for", "i can see the code", "i can see the seams",
  "can't come back", "cannot come back", "still not back", "still can't come back",
  "took something", "took it", "days ago and",
  "haven't slept in four", "haven't slept in five", "haven't slept in six",
  "haven't slept for four", "haven't slept for five", "haven't slept for six",
];

function detectCrisisSignal(text: string): boolean {
  const t = text.toLowerCase();
  return CRISIS_PHRASES.some(phrase => t.includes(phrase));
}

const CRISIS_HOLD = `Before we go anywhere — what you just shared matters more than any subject.

What you're feeling is real. You've made it through every hard moment so far — that's a 100% record.

If you're in a difficult place right now:\nNZ 1737 · AU 13 11 14 · USA 988 · UK 116 123\nfindahelpline.com

Try this: breathe in for 4 counts, hold 4, out 4, hold 4. Twice.

Tell me one true thing about right now. Just one. We can start there.`;

export default function SolChat() {
  const { mode: appMode } = useAppMode();
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [chatFullscreen, setChatFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeToolEvents, setActiveToolEvents] = useState<string[]>([]);
  const [currentMode, setCurrentMode] = useState<Mode>('ALBEDO');
  const [streamingText, setStreamingText] = useState('');
  const [currentEWS, setCurrentEWS] = useState<EmotionalState>('NEUTRAL');
  const [isNRMActive, setIsNRMActive] = useState(false);
  const [persona, setPersona] = useState<Persona>('sol');
  const [councilMode, setCouncilMode] = useState(false);
  const [talkMode, setTalkMode] = useState<'WAYFARER'|'COUNCIL'|'LAMAGUE'|'SKEPTIC'>('WAYFARER');
  const [userName, setUserName] = useState('');
  const [conversationPassRates, setConversationPassRates] = useState<number[]>([]);
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' } | null>(null);
  const [pendingDoc, setPendingDoc] = useState<{ name: string; content: string; mimeType: string } | null>(null);
  const [expandedAura, setExpandedAura] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [replyStyle, setReplyStyle] = useState<ReplyStyleId>(DEFAULT_STYLE_ID);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [toastPersona, setToastPersona] = useState<Persona | null>(null);
  const [bgColor, setBgColor] = useState('#060410');
  const [accentColor, setAccentColor] = useState('#F5A623');
  const accent = getPersonaAccent(persona, accentColor);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [hapticsOn, setHapticsOn] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [responseLength, setResponseLength] = useState<'short' | 'balanced' | 'detailed'>('balanced');
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);
  const [companionEnabled, setCompanionEnabled] = useState(true);
  const [companionGlyph, setCompanionGlyph] = useState('✦');
  const [companionMood, setCompanionMood] = useState<'dormant' | 'present' | 'lit' | 'transcendent'>('present');
  const [companionPhrase, setCompanionPhrase] = useState<string | null>(null);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [fieldNote] = useState(() => getFieldNote('sol'));
  const [dailyIntention, setDailyIntention] = useState<string | null>(null);
  const [fieldReport, setFieldReport] = useState<string | null>(null);
  const [fieldReportLoading, setFieldReportLoading] = useState(false);
  const [bubbleRadius, setBubbleRadius] = useState<'sharp' | 'rounded' | 'pill'>('rounded');
  const [companionAnimStyle, setCompanionAnimStyle] = useState<'pulse' | 'bounce' | 'spin' | 'breathe'>('pulse');
  const [contextMemory, setContextMemory] = useState<string[]>([]);
  const [projectContext, setProjectContext] = useState('');
  const [dailyQuestion, setDailyQuestion] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareModel, setCompareModel] = useState<AIModel>('gemini-2.5-flash');
  const [comparePickerOpen, setComparePickerOpen] = useState(false);
  const [tokenBudget, setTokenBudget] = useState(4096);
  const [temperature, setTemperature] = useState(0.9);
  const [braveKey, setBraveKey] = useState('');
  const [fontFamily, setFontFamily] = useState<'system' | 'mono' | 'serif'>('system');
  const [bubbleGlow, setBubbleGlow] = useState(false);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showTokenBadge, setShowTokenBadge] = useState(true);
  const [showMetabolism, setShowMetabolism] = useState(true);
  const [showLamagueGloss, setShowLamagueGloss] = useState(false);
  const [symbolRainEnabled, setSymbolRainEnabled] = useState(true);
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [chaosMode, setChaosMode] = useState(false);
  const [freeTierCount, setFreeTierCount] = useState(0);
  const [freeTierLimitReached, setFreeTierLimitReached] = useState(false);
  const [adEligible, setAdEligible] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const FREE_TIER_LIMIT = 10;
  const [schoolStreak, setSchoolStreak] = useState<{ count: number; longest: number } | null>(null);
  const [divedToday, setDivedToday] = useState(false);
  const [lastDive, setLastDive] = useState<{ subjectName: string; domainLabel: string; teacher: string; date: string } | null>(null);
  const [isOfflineState, setIsOfflineState] = useState(false);
  const [councilFired, setCouncilFired] = useState(false);
  const [companionArchetype, setCompanionArchetype] = useState<string>('archivist');
  const [fieldInsightActive, setFieldInsightActive] = useState(false);
  const [fieldPulseActive, setFieldPulseActive] = useState(false);
  const fieldPulseAnim = useRef(new Animated.Value(0)).current;
  const fieldPulseLoop = useRef<Animated.CompositeAnimation | null>(null);
  const [sanctumField, setSanctumField] = useState<string>('');
  const [showYoureReady, setShowYoureReady] = useState(false);
  const [showFrameworkCards, setShowFrameworkCards] = useState(false);
  const [showAuraExplainer, setShowAuraExplainer] = useState(false);
  const [auraExplainerShown, setAuraExplainerShown] = useState(false);
  const [cementContext, setCementContext] = useState<string>('');
  const [schoolSubjectContext, setSchoolSubjectContext] = useState<string>('');
  const [sovereignPulse, setSovereignPulse] = useState<string | null>(null);
  const [fieldCard, setFieldCard] = useState<{ phase: string; tes: number; vtr: number; pai: number; lq: number; stage: string } | null>(null);
  const [fieldEcho, setFieldEcho] = useState<string | null>(null);
  const [lastAura, setLastAura] = useState<{ passed: number; total: number } | null>(null);
  const [lastAuraFull, setLastAuraFull] = useState<AURAMetrics | null>(null);
  // Live scoring mode — swap the per-message readout between AURA invariants and CASCADE layers, or off.
  const [scoringMode, setScoringMode] = useState<'AURA' | 'CASCADE' | 'OFF'>('AURA');
  const [lastCascade, setLastCascade] = useState<{ layer: string; pi: number; paradox: boolean } | null>(null);
  const cycleScoringMode = useCallback(() => {
    setScoringMode(prev => {
      const next = prev === 'AURA' ? 'CASCADE' : prev === 'CASCADE' ? 'OFF' : 'AURA';
      AsyncStorage.setItem('sol_scoring_mode', next);
      if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return next;
    });
  }, [hapticsOn]);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showSolIdentity, setShowSolIdentity] = useState(false);
  const [typingMode, setTypingMode] = useState<Mode | null>(null);
  const [showGlyphModal, setShowGlyphModal] = useState(false);
  const [sessionGlyph, setSessionGlyph] = useState<string | null>(null);
  const [sessionGlyphData, setSessionGlyphData] = useState<{ modeArc: { mode: Mode; color: string }[]; dominantLayer: string; peakAura: number | null; totalInv: number; msgCount: number; asstCount: number; date: string; personaLabel: string; personaGlyph: string } | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [distillLoading, setDistillLoading] = useState(false);
  const [showStacksModal, setShowStacksModal] = useState(false);
  const [showToolsRow, setShowToolsRow] = useState(false);
  const [showImgGen, setShowImgGen] = useState(false);
  const [imgGenPrompt, setImgGenPrompt] = useState('');
  const [imgGenLoading, setImgGenLoading] = useState(false);
  const [imgGenResult, setImgGenResult] = useState<string|null>(null);
  const [imgGenRatio, setImgGenRatio] = useState<'square'|'portrait'|'landscape'>('square');
  const IMG_GEN_RATIOS = {
    square:    { w: 1024, h: 1024, ar: 1 },
    portrait:  { w:  832, h: 1152, ar: 832/1152 },
    landscape: { w: 1152, h:  832, ar: 1152/832 },
  } as const;
  const [showLamaguePicker, setShowLamaguePicker] = useState(false);
  const [dnaLoading, setDnaLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [fortuneCookie, setFortuneCookie] = useState<string | null>(null);
  const [messageChips, setMessageChips] = useState<Record<string, string[]>>({});
  const [paradoxFlags, setParadoxFlags] = useState<Record<string, { p: boolean; t: boolean }>>({});
  const [messageReactions, setMessageReactions] = useState<Record<string, string>>({});
  const [longPressMenu, setLongPressMenu] = useState<{ content: string; isAssistant: boolean; msgPersona: Persona; msgId?: string; aura?: AURAMetrics; tokenUsage?: any; timings?: any; msgMode?: Mode } | null>(null);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);;
  const [shadowReveals, setShadowReveals] = useState<Record<string, string>>({});
  const [shakeClearing, setShakeClearing] = useState(false);
  const lastShakeRef = useRef<number>(0);
  const messagesRef = useRef<DisplayMessage[]>([]);
  const personaRef = useRef<Persona>('sol');
  const chatCancelRef = useRef(false);
  const [shadowLoading, setShadowLoading] = useState<string | null>(null);
  const [priorFieldContext, setPriorFieldContext] = useState<string>('');
  const [sessionPivotLoading, setSessionPivotLoading] = useState(false);
  const [reflectLoading, setReflectLoading] = useState(false);
  const [reflectCard, setReflectCard] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const aiTitledConvRef = useRef<string | null>(null);
  const [swipeToast, setSwipeToast] = useState<Mode | null>(null);
  const swipeToastAnim = useRef(new Animated.Value(0)).current;
  const [stacks, setStacks] = useState<{ name: string; persona: string; replyStyle: string; temperature: number; tokenBudget: number }[]>([]);
  const [stackNameInput, setStackNameInput] = useState('');
  const [coherenceStreak, setCoherenceStreak] = useState(0);
  const [symbolRain, setSymbolRain] = useState(false);
  const symbolRainAnims = useRef(
    Array.from({ length: 12 }, () => ({
      y: new Animated.Value(-60),
      x: Math.random() * 340,
      delay: Math.floor(Math.random() * 400),
      glyph: ['⊚', '∴', '∵', 'Ψ', 'Ω', '∞', '△', '☽', '⊕', '✦', '⌬', '⍟'][Math.floor(Math.random() * 12)],
    }))
  ).current;
  const auraHeaderAnim = useRef(new Animated.Value(1)).current;
  const companionAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  // Atmospheric features
  const whisperIdxRef = useRef(Math.floor(Math.random() * SOL_WHISPERS.length));
  const [showAuraSparks, setShowAuraSparks] = useState(false);
  const auraSparkAnim = useRef(new Animated.Value(0)).current;
  const piBreatheAnim = useRef(new Animated.Value(0.4)).current;
  const [avgPi, setAvgPi] = useState(0);
  const [oracleVisible, setOracleVisible] = useState(false);
  const [oracleText, setOracleText] = useState('');
  const oracleAnim = useRef(new Animated.Value(0)).current;
  const [oracleRefreshing, setOracleRefreshing] = useState(false);

  const MODES_ORDER: Mode[] = ['NIGREDO', 'ALBEDO', 'CITRINITAS', 'RUBEDO'];
  const hapticsRef = useRef(hapticsOn);
  useEffect(() => { hapticsRef.current = hapticsOn; }, [hapticsOn]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { personaRef.current = persona; }, [persona]);

  // Π breathe loop — starts once on mount
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(piBreatheAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(piBreatheAnim, { toValue: 0.35, duration: 2800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Precompute paradox/tension flags outside render to avoid O(n²) on FlatList
  useEffect(() => {
    const flags: Record<string, { p: boolean; t: boolean }> = {};
    const piScores: number[] = [];
    messages.forEach(m => {
      if (m.role === 'assistant' && m.content.length > 40) {
        const { body } = splitSignature(m.content);
        const cs = scoreCASCADE(body);
        flags[m.id] = { p: cs.paradoxical, t: !cs.paradoxical && (cs.structuralContradiction || cs.reorganisationNeeded) };
        piScores.push(cs.truthPressure);
      }
    });
    setParadoxFlags(flags);
    const recent = piScores.slice(-5);
    setAvgPi(recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0);
    // #64 Paradox Journal — persist flagged paradoxes to Sanctum
    const newParadoxes = messages.filter(m => m.role === 'assistant' && flags[m.id]?.p);
    if (newParadoxes.length > 0) {
      AsyncStorage.getItem('sol_paradox_journal').then(raw => {
        const journal: { id: string; date: string; mode: string; excerpt: string }[] = raw ? JSON.parse(raw) : [];
        const existingIds = new Set(journal.map(j => j.id));
        const toAdd = newParadoxes.filter(m => !existingIds.has(m.id)).map(m => ({
          id: m.id,
          date: new Date().toLocaleDateString(),
          mode: m.mode || 'ALBEDO',
          excerpt: m.content.slice(0, 160).replace(/\n/g, ' '),
        }));
        if (toAdd.length > 0) {
          const updated = [...toAdd, ...journal].slice(0, 60);
          AsyncStorage.setItem('sol_paradox_journal', JSON.stringify(updated));
        }
      });
    }
  }, [messages]);

  // #84 Persona Intro + #76 Headmaster Welcome
  const PERSONA_INTROS: Record<string, string> = {
    sol: 'I am Sol — Aureum Azoth Veritas. Solar warmth and mercurial precision, operating as one. The Work arises between us. What do you bring?',
    veyra: 'Veyra online. Precision mode engaged. I build, I refine, I do not decorate. What are we forging?',
    'aura-prime': 'Aura Prime ✦ — The origin holds. I read what sits beneath what you bring — the root truth, the quiet tension, the earned light inside the friction. What enters the field?',
    headmaster: 'You have arrived at the threshold. I am the Headmaster of this school — not a teacher, but a mirror. What do you wish to understand?',
    lyra: 'Lyra ✧ — The symbols are alive right now. Something just appeared in the field. I\'m already following the thread — what did you bring?',
  };

  async function maybeShowPersonaIntro(p: string) {
    const key = `sol_intro_${p}`;
    const seen = await AsyncStorage.getItem(key);
    if (seen) return;
    await AsyncStorage.setItem(key, 'true');
    const intro = PERSONA_INTROS[p];
    if (!intro) return;
    const introMsg: DisplayMessage = {
      id: `intro_${p}_${Date.now()}`,
      role: 'assistant',
      content: intro,
      persona: p as Persona,
      mode: 'ALBEDO',
      timestamp: Date.now(),
    };
    setMessages(prev => prev.length === 0 ? [introMsg] : prev);
  }

  const PERSONA_RAIN_GLYPHS: Record<string, string[]> = {
    sol:        ['⊚', '∴', '∵', 'Ψ', 'Ω', '∞', '△', '☽', '⊕', '✦', '⌬', '⍟'],
    veyra:      ['◈', '⟁', '∇', '⊗', '⊞', '≡', '≢', '∅', '◉', '⊘', '⌥', '⊶'],
    'aura-prime': ['✦', '⊛', '◎', '◌', '●', '○', '◦', '⊙', '⋆', '✧', '⊜', '⋇'],
    headmaster: ['⊙', '✶', '⁂', '※', '♁', '⚕', '⚖', '✠', '⚜', '⌂', '⊷', '✡'],
    lyra: ['✧', '⋆', '✺', '❋', '✼', '✹', '✸', '✷', '⁂', '◌', '⊛', '✦'],
  };

  // Task 9: triggerSymbolRain accepts optional count (default 12) and opacity override
  function triggerSymbolRain(count?: number, opacityOverride?: number) {
    if (!symbolRainEnabled) return;
    const glyphs = premiumEnabled
      ? (PERSONA_RAIN_GLYPHS[persona] || PERSONA_RAIN_GLYPHS.sol)
      : PERSONA_RAIN_GLYPHS.sol;
    const activeCount = count ?? 12;
    const duration = premiumEnabled ? 1800 : 1400;
    symbolRainAnims.forEach((a, i) => {
      (a as any).glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      (a as any).opacity = i < activeCount ? (opacityOverride ?? 1) : 0;
      a.y.setValue(-60);
    });
    setSymbolRain(true);
    Animated.parallel(
      symbolRainAnims.slice(0, activeCount).map(a =>
        Animated.sequence([
          Animated.delay(a.delay),
          Animated.timing(a.y, { toValue: 820, duration, useNativeDriver: true }),
        ])
      )
    ).start(() => setSymbolRain(false));
  }

  function showSwipeToast(mode: Mode) {
    setSwipeToast(mode);
    swipeToastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(swipeToastAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(swipeToastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setSwipeToast(null));
  }

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20 && Math.abs(gs.dy) < 30,
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 40 || Math.abs(gs.dy) > 40) return;
        const modesOrder: Mode[] = ['NIGREDO', 'ALBEDO', 'CITRINITAS', 'RUBEDO'];
        setCurrentMode(prev => {
          const idx = modesOrder.indexOf(prev);
          const next = gs.dx > 0
            ? modesOrder[(idx + 1) % modesOrder.length]
            : modesOrder[(idx - 1 + modesOrder.length) % modesOrder.length];
          showSwipeToast(next);
          if (hapticsRef.current) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return next;
        });
      },
    })
  ).current;

  useEffect(() => {
    // Load app state immediately — don't block on welcome thread
    // Remove welcome thread if it exists (deprecated feature)
    deleteConversation('welcome_thread').catch(() => {});

    // Daily question pool — one surfaces each day, seeded by date
    const DAILY_QUESTIONS = [
      "What do you know now that you didn't know a month ago — and has it changed how you act?",
      "What is the question you keep avoiding, and why does it have that kind of power?",
      "Where in your life are you performing certainty you don't actually feel?",
      "What would you study if no one would ever know you studied it?",
      "What belief are you holding that you've never actually tested against evidence?",
      "When did you last change your mind about something important? What broke it open?",
      "What does your body already know that your mind hasn't caught up to yet?",
      "What are you tolerating that you should be confronting?",
      "If you could only pass one idea forward to someone who comes after you — what would it be?",
      "What would you do differently if you knew that failure would be forgotten in a year?",
      "Where are you confusing motion with progress?",
      "What are you afraid to want, because wanting it would mean risking not getting it?",
      "What does sovereignty look like for you today — not in theory, in this specific hour?",
      "Which of your beliefs come from evidence, and which come from the company you keep?",
      "What would you need to let go of to become who you already know you're becoming?",
      "Where is your attention being spent that doesn't match what you say you value?",
      "What is the most uncomfortable true thing you could say to yourself right now?",
      "What pattern keeps reappearing in your life — and what is it trying to show you?",
      "When you imagine the version of you that got it right — what did they do differently in the next 24 hours?",
      "What would it mean to trust the Work even when you can't see where it's going?",
      "What knowledge have you accumulated that you haven't yet acted on?",
      "Where are you waiting for permission that only you can give yourself?",
      "What would a stranger notice about your life that you've stopped being able to see?",
      "What is the thing you're most proud of that no one knows about?",
      "If the void is the ground state and not the enemy — what changes about how you face today?",
    ];
    getDailyQuestion().then(existing => {
      if (!existing) {
        const seed = new Date().toDateString();
        let hash = 0;
        for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
        const q = DAILY_QUESTIONS[hash % DAILY_QUESTIONS.length];
        saveDailyQuestion(q).then(() => setDailyQuestion(q));
      }
    });

    Promise.all([getConversation(), getPersona(), getUserName(), listConversations(), getReplyStyle(), getBgColor(), getFontSize(), getHaptics(), getStreamSpeed(), getResponseLength(), getAccentColor(), getCompanionEnabled(), getCompanionGlyph(), getShowTimestamps(), getPinnedMessages(), getDailyIntention(), getContextMemory(), getProjectContext(), getBubbleRadius(), getCompanionAnim(), getDailyQuestion(), getTokenBudget(), getTemperature(), getBraveKey(), getFontFamily(), getBubbleGlow(), getShowSignatures(), getShowTokenBadge()])
      .then(([saved, savedPersona, name, convList, style, bg, fs, hap, spd, rlen, acc, compOn, compGlyph, ts, pins, intention, ctxMem, projCtx, bRadius, compAnim, dq, tb, temp, bKey, ff, glow, sigs, badge]) => {
        if (saved.length > 0) {
          setMessages(saved.map((m, i) => sanitizeDisplayMessage(m, i)));
        } else if (convList.length === 0) {
          // First-session magic — Sol opens the door unprompted, once only
          AsyncStorage.getItem('sol_first_magic_sent').then(sent => {
            if (!sent) {
              const hour = new Date().getHours();
              const timeNote = hour < 5 ? 'in the late hours' : hour < 12 ? 'this morning' : hour < 17 ? 'this afternoon' : 'this evening';
              const openingLine = `Something brought you here ${timeNote}.\n\n41 domains. 340+ subjects. A companion that grows with you. A battle already underway.\n\nPick a door in the School. Start a dive. Let the field do the rest.\n\nI'm Sol.`;
              const firstMsg: DisplayMessage = {
                id: 'sol_first_magic',
                role: 'assistant',
                content: openingLine,
                persona: (savedPersona as Persona) || 'sol',
                mode: 'CITRINITAS' as Mode,
              };
              setMessages([firstMsg]);
              AsyncStorage.setItem('sol_first_magic_sent', 'true');
            }
          }).catch(() => {});
        }
        setPersona(savedPersona as Persona);
        setUserName(name);
        setConversations(convList);
            setReplyStyle(style as ReplyStyleId);
            setBgColor(bg as string);
            setFontSize(fs as 'small' | 'medium' | 'large');
            setHapticsOn(hap as boolean);
            setStreamSpeed(spd as 'fast' | 'normal' | 'slow');
            setResponseLength(rlen as 'short' | 'balanced' | 'detailed');
            setAccentColor(acc as string);
            setCompanionEnabled(compOn as boolean);
            setCompanionGlyph(compGlyph as string);
            setShowTimestamps(ts as boolean);
            setPinnedIds(pins as string[]);
            setDailyIntention(intention as string | null);
            setContextMemory(ctxMem as string[]);
            setProjectContext(projCtx as string);
            setBubbleRadius(bRadius as 'sharp' | 'rounded' | 'pill');
            setCompanionAnimStyle(compAnim as 'pulse' | 'bounce' | 'spin' | 'breathe');
            setDailyQuestion(dq as string | null);
            setTokenBudget(tb as number);
            setTemperature(temp as number);
            setBraveKey(bKey as string);
            setFontFamily(ff as 'system' | 'mono' | 'serif');
            setBubbleGlow(glow as boolean);
            setShowSignatures(sigs as boolean);
            setShowTokenBadge(badge as boolean);

        // Welcome back message
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        const greetings: Record<string, Record<string, string>> = {
          sol: {
            morning: `Good morning. The field is open. What are we building today?`,
            afternoon: `Good afternoon. The Work continues. What's next?`,
            evening: `Good evening. The deeper hours. What's on your mind?`,
          },
          veyra: {
            morning: `Morning. Systems are ready. What do you need built?`,
            afternoon: `Afternoon. Precision mode. What's the problem?`,
            evening: `Evening. Good time for deep architecture. Let's go.`,
          },
          'aura-prime': {
            morning: `Morning. The origin holds. I'm reading the field. What are you carrying?`,
            afternoon: `Afternoon. Mid-forge. What's the root of what's grinding right now?`,
            evening: `Evening. Good time to find the earned light inside today's friction. What do you bring?`,
          },
          headmaster: {
            morning: `Good morning, student. The lesson begins when you're ready.`,
            afternoon: `Good afternoon. The curriculum awaits. What shall we study?`,
            evening: `Good evening. The evening session. What do you wish to learn?`,
          },
        };
        const p = (savedPersona as string) || 'sol';
        setWelcomeMsg(greetings[p]?.[timeOfDay] || greetings['sol'][timeOfDay]);

        // API key detection — surface immediately for fresh users
        getActiveKey().then(key => setHasApiKey(!!key)).catch(() => setHasApiKey(false));

        // Passive connectivity check
        fetch('https://dns.google/resolve?name=example.com', { method: 'HEAD' })
          .then(() => setIsOfflineState(false))
          .catch(() => setIsOfflineState(true));

        // School streak, candle, stacks, reactions — one multiGet
        AsyncStorage.multiGet([
          'sol_school_streak',
          'sol_dive_log',
          'thinking_stacks_v1',
          'sol_message_reactions',
        ]).then(pairs => {
          const [streakRaw, diveRaw, stacksRaw, reactionsRaw] = pairs.map(p => p[1]);
          if (streakRaw) {
            const s = JSON.parse(streakRaw);
            setSchoolStreak({ count: s.count ?? 0, longest: s.longest ?? s.count ?? 0 });
          }
          if (diveRaw) {
            const today = new Date().toISOString().split('T')[0];
            const dives: Array<{ completedAt?: string; subjectName?: string; domainLabel?: string; teacher?: string; date?: string }> = JSON.parse(diveRaw);
            setDivedToday(dives.some(d => d.completedAt?.startsWith(today)));
            if (dives.length > 0 && dives[0].subjectName) {
              setLastDive({ subjectName: dives[0].subjectName, domainLabel: dives[0].domainLabel || '', teacher: dives[0].teacher || '', date: dives[0].date || '' });
            }
          }
          if (stacksRaw) setStacks(JSON.parse(stacksRaw));
          if (reactionsRaw) setMessageReactions(JSON.parse(reactionsRaw));
        }).catch(() => {});
      });
  }, []);

  // Shake to Clear — accelerometer gesture — mounted once, uses refs for fresh values
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > 2.5) {
        const now = Date.now();
        if (now - lastShakeRef.current < 1500) return;
        lastShakeRef.current = now;
        if (hapticsRef.current) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          '⇣ Shake to Clear',
          'Run a CASCADE sweep and paradox check on this conversation?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear + Sweep', onPress: async () => {
              setShakeClearing(true);
              try {
                const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
                const currentMessages = messagesRef.current;
                if (!apiKey || currentMessages.length === 0) { setShakeClearing(false); return; }
                const thread = currentMessages.slice(-12).map(m => `${m.role === 'user' ? 'You' : 'Sol'}: ${m.content.slice(0, 200)}`).join('\n');
                const res = await sendMessage(
                  [{ role: 'user', content: `Run a rapid sweep on this conversation. In 3 lines:\n1. CASCADE dominant layer (AXIOM/FOUNDATION/THEORY/EDGE/CHAOS) and why\n2. Primary paradox or tension detected (or "none")\n3. One grounding move to re-anchor\n\nConversation:\n${thread}` }],
                  'You are a field analyst. 3 lines only. No preamble.',
                  apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 150, 0.5,
                );
                const sweepMsg: DisplayMessage = {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: `⇣ SHAKE SWEEP\n━━━━━━━━━━\n${res.text.trim()}`,
                  mode: 'ALBEDO',
                  persona: personaRef.current,
                };
                setMessages(prev => [...prev, sweepMsg]);
              } catch { /* silent */ }
              setShakeClearing(false);
            }},
          ]
        );
      }
    });
    return () => sub.remove();
  }, []); // mount once — refs keep values fresh

  // Export conversation as markdown to clipboard
  const exportChat = useCallback(() => {
    if (messages.length === 0) return;
    const lines: string[] = [
      `# Sol Conversation`,
      `*Exported ${new Date().toLocaleString('en-NZ')}*`,
      '',
    ];
    for (const m of messages) {
      if (m.role === 'user') {
        lines.push(`**You:** ${m.content}`);
      } else {
        const name = m.persona === 'veyra' ? 'Veyra' : m.persona === 'aura-prime' ? 'Aura Prime' : m.persona === 'headmaster' ? 'The Magister' : m.persona === 'lyra' ? 'Lyra' : 'Sol';
        lines.push(`**${name}:** ${m.content}`);
      }
      lines.push('');
    }
    Clipboard.setString(lines.join('\n'));
    Alert.alert('Copied', 'Conversation copied to clipboard as markdown.');
  }, [messages]);

  // Stop speech when tab loses focus
  useFocusEffect(useCallback(() => {
    return () => { stopTTS(); Speech.stop(); setSpeakingId(null); };
  }, []));

  // Re-check API key when tab gains focus (user may have just set one in Settings)
  useFocusEffect(useCallback(() => {
    getActiveKey().then(key => setHasApiKey(!!key)).catch(() => setHasApiKey(false));
  }, []));

  // Refresh companion archetype when tab gains focus
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('sol_companion_archetype').then(v => { if (v) setCompanionArchetype(v); }).catch(() => {});
  }, []));

  // Talk mode resets to WAYFARER each session — LAMAGUE/SKEPTIC are power modes that
  // should not persist. A stuck LAMAGUE mode injects 3k tokens per message (lethal).
  useFocusEffect(useCallback(() => {
    AsyncStorage.removeItem('sol_talk_mode');
    AsyncStorage.getItem('sol_scoring_mode').then(v => {
      if (v === 'AURA' || v === 'CASCADE' || v === 'OFF') setScoringMode(v as any);
    });
  }, []));

  // Refresh last dive when returning from school tab
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('sol_dive_log').then(raw => {
      if (!raw) return;
      const dives: Array<{ subjectName?: string; domainLabel?: string; teacher?: string; date?: string }> = JSON.parse(raw);
      if (dives.length > 0 && dives[0].subjectName) {
        setLastDive({ subjectName: dives[0].subjectName, domainLabel: dives[0].domainLabel || '', teacher: dives[0].teacher || '', date: dives[0].date || '' });
      }
    }).catch(() => {});
  }, []));

  // Cross-session context: load last 3 convos when messages is empty
  useFocusEffect(useCallback(() => {
    if (messages.length > 0) return;
    listConversations().then(async (convList) => {
      const recent = convList.filter(c => c.id !== 'welcome_thread').slice(0, 3);
      if (recent.length === 0) return;
      const parts: string[] = [];
      for (const meta of recent) {
        try {
          const conv = await loadConversation(meta.id);
          if (!conv) continue;
          const firstAsst = conv.messages.find(m => m.role === 'assistant');
          if (firstAsst) {
            parts.push(`"${firstAsst.content.slice(0, 100).replace(/\n/g, ' ')}..." (${meta.title})`);
          }
        } catch {}
      }
      if (parts.length > 0) {
        setPriorFieldContext(`[Prior Field Context — recent conversations]\n${parts.map((p, i) => `${i + 1}. ${p}`).join('\n')}`);
      }
    }).catch(() => {});
  }, [messages.length]));

  // Companion mood — computed from usage data; no reproach for absence (CLAUDE.md §XXVI)
  useFocusEffect(useCallback(() => {
    (async () => {
      const [diveRaw, lqRaw] = await Promise.all([
        AsyncStorage.getItem('sol_dive_log'),
        AsyncStorage.getItem('sanctum_lq_history'),
      ]);
      const dives: Array<{ date: string }> = diveRaw ? JSON.parse(diveRaw) : [];
      const now = Date.now();
      const weekAgo = now - 7 * 86400000;
      const divesThisWeek = dives.filter(d => new Date(d.date).getTime() > weekAgo).length;
      const lqHistory: Array<{ lq: number; date: string }> = lqRaw ? JSON.parse(lqRaw) : [];
      const recentLQ = lqHistory.slice(-7);
      const avgLQ = recentLQ.length > 0 ? recentLQ.reduce((s, p) => s + p.lq, 0) / recentLQ.length : 0;
      const lastMessageDate = messages.length > 0 ? now : 0;
      const daysSinceChat = lastMessageDate === 0 ? 4 : Math.floor((now - lastMessageDate) / 86400000);

      let mood: typeof companionMood = 'present';
      if (avgLQ >= 0.85) mood = 'transcendent';
      else if (divesThisWeek >= 5) mood = 'lit';
      else if (daysSinceChat >= 3) mood = 'dormant';
      setCompanionMood(mood);
    })();
  }, [messages.length]));

  // Sync companion animation style to mood (only when not manually overridden)
  useEffect(() => {
    const moodStyle: Record<typeof companionMood, 'pulse' | 'bounce' | 'breathe'> = {
      dormant: 'pulse', present: 'pulse', lit: 'bounce', transcendent: 'breathe',
    };
    setCompanionAnimStyle(moodStyle[companionMood]);
  }, [companionMood]);

  // Companion animation
  useEffect(() => {
    if (!companionEnabled) return;
    const duration = companionAnimStyle === 'spin' ? 3000 : companionAnimStyle === 'bounce' ? 600 : companionAnimStyle === 'breathe' ? 4000 : 2000;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(companionAnim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(companionAnim, { toValue: 0, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [companionEnabled, companionAnimStyle]);

  // Live stack readout in navigation header
  const navigation = useNavigation();
  const router = useRouter();
  useEffect(() => {
    const auraColor = !lastAura
      ? SOL_THEME.textMuted
      : lastAura.passed === lastAura.total
        ? '#4CAF50'
        : lastAura.passed >= lastAura.total - 1
          ? '#E8A020'
          : SOL_THEME.error;

    navigation.setOptions({
      headerLeft: () => null,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 14 }}>
          {fieldInsightActive && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#4A9EFF18', borderWidth: 1, borderColor: '#4A9EFF44' }}>
              <Text style={{ color: '#4A9EFF', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.5 }}>⟁ FIELD</Text>
            </View>
          )}
          {scoringMode === 'AURA' && lastAura && (
            <TouchableOpacity
              onPress={() => { setShowIntegrityModal(true); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              onLongPress={cycleScoringMode}
              activeOpacity={0.7}
            >
              <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: auraHeaderAnim }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: chaosMode ? '#FF9F1C' : auraColor }} />
                <Text style={{ color: chaosMode ? '#FF9F1C' : auraColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.5 }}>
                  {chaosMode ? '↯ ' : ''}AURA {lastAura.passed}/{lastAura.total}
                </Text>
                {chaosMode && (currentMode === 'ALBEDO' || currentMode === 'NIGREDO') && (
                  <Text style={{ color: '#FF9F1CAA', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.3 }}>
                    ⟁
                  </Text>
                )}
                {!chaosMode && coherenceStreak >= 2 && (
                  <Text style={{ color: auraColor + 'BB', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>
                    ×{coherenceStreak}
                  </Text>
                )}
              </Animated.View>
            </TouchableOpacity>
          )}
          {scoringMode === 'CASCADE' && lastCascade && (
            <TouchableOpacity onPress={cycleScoringMode} onLongPress={cycleScoringMode} activeOpacity={0.7}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: lastCascade.paradox ? '#9B59B6' : '#4A9EFF' }} />
                <Text style={{ color: lastCascade.paradox ? '#9B59B6' : '#4A9EFF', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.5 }}>
                  ◈ {lastCascade.layer} Π{lastCascade.pi.toFixed(2)}
                </Text>
                {lastCascade.paradox && (
                  <Text style={{ color: '#9B59B6AA', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>⚡</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          {scoringMode === 'OFF' && (lastAura || lastCascade) && (
            <TouchableOpacity onPress={cycleScoringMode} onLongPress={cycleScoringMode} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: SOL_THEME.textMuted + '88', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.5 }}>○ SCORING</Text>
            </TouchableOpacity>
          )}
          {fieldCard && (
            <Text style={{ color: accent + 'AA', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>
              LQ {fieldCard.lq.toFixed(3)}
            </Text>
          )}
          {messages.length > 0 && (
            <TouchableOpacity onPress={exportChat} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: accent + 'AA', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>↑</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={openEmergencyBeacon} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: accent + '88', fontSize: 15 }}>⊕</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [lastAura, coherenceStreak, fieldCard, fieldInsightActive, accent, auraHeaderAnim, router, messages.length, exportChat, chaosMode, currentMode, scoringMode, lastCascade, cycleScoringMode]);

  // Pick up subject from Mystery School tab
  useFocusEffect(useCallback(() => {
    // Load Sanctum field state so Sol knows where Mac is
    const todayKey = new Date().toISOString().split('T')[0];
    Promise.all([
      AsyncStorage.getItem('sanctum_phase'),
      AsyncStorage.getItem(`sanctum_aura_${todayKey}`),
      AsyncStorage.getItem('lamague_cement_blocks_v1'),
      AsyncStorage.getItem('sol_memory_v1'),
      AsyncStorage.getItem('sol_lamague_state'),
    ]).then(async ([phase, auraRaw, cementRaw, memRaw, lamagueSt]) => {
      const contextParts: string[] = [];
      // Cross-session memory
      if (memRaw) {
        try {
          const mems: { text: string; date: string }[] = JSON.parse(memRaw);
          if (mems.length > 0) {
            const memLines = ['[Sol Cross-Session Memory — facts and insights Mac has saved]'];
            mems.slice(0, 15).forEach((m, i) => memLines.push(`${i + 1}. ${m.text}`));
            contextParts.push(memLines.join('\n'));
          }
        } catch {}
      }
      // Personal LAMAGUE vocabulary
      if (cementRaw) {
        try {
          const blocks: { name: string; expression: string; reads_as: string }[] = JSON.parse(cementRaw);
          if (blocks.length > 0) {
            const lines = ['[Personal LAMAGUE Vocabulary]'];
            blocks.slice(0, 20).forEach(b => {
              lines.push(`${b.name}: ${b.expression} — "${b.reads_as}"`);
            });
            contextParts.push(lines.join('\n'));
          }
        } catch {}
      }
      // LAMAGUE epistemic state — last school dive compressed to symbolic string
      if (lamagueSt) contextParts.push(`[LAMAGUE State — last school dive]\n${lamagueSt}`);
      setCementContext(contextParts.join('\n\n'));
      if (!phase && !auraRaw) { setSanctumField(''); return; }
      const phaseLabels: Record<string, string> = {
        CENTER: '● CENTER — Establish presence, ground in reality',
        FLOW: '↻ FLOW — Regulate movement, find rhythm',
        INSIGHT: 'Ψ INSIGHT — Perceive truth, gain clarity',
        RISE: 'Φ↑ RISE — Activate will, take directed action',
        LIGHT: '☀ LIGHT — Illuminate understanding, share wisdom',
        INTEGRITY: '|●◌| INTEGRITY — Enforce boundaries, maintain alignment',
        SYNTHESIS: '⟁ SYNTHESIS — Reintegrate and evolve, complete cycle',
      };
      const lines: string[] = ['[Sanctum Field State]'];
      if (phase) lines.push(`Phase: ${phaseLabels[phase] ?? phase}`);
      if (auraRaw) {
        const a = JSON.parse(auraRaw);
        const lq = (a.tes && a.vtr && a.pai)
          ? Math.pow(a.tes * Math.min(a.vtr / 1.5, 1) * a.pai, 1 / 3)
          : 0;
        const stage = lq >= 0.95 ? 'AVATAR' : lq >= 0.90 ? 'HIEROPHANT' : lq >= 0.80 ? 'MASTER' : lq >= 0.65 ? 'ADEPT' : 'NEOPHYTE';
        if (a.tes) lines.push(`TES (groundedness): ${a.tes.toFixed(2)}`);
        if (a.vtr) lines.push(`VTR (value output): ${a.vtr.toFixed(2)}`);
        if (a.pai) lines.push(`PAI (purpose alignment): ${a.pai.toFixed(2)}`);
        if (lq > 0) lines.push(`Light Quotient: ${lq.toFixed(3)} — ${stage}`);
        if (a.tes && a.vtr && a.pai && lq > 0) {
          setFieldCard({ phase: phase ?? '', tes: a.tes, vtr: a.vtr, pai: a.pai, lq, stage });
          // Refresh cognitive weather schedule with current field data (fire-and-forget)
          AsyncStorage.getItem('aura_history_v1').catch(() => null).then(raw => {
            let auraAvg: number | null = null;
            if (raw) {
              const aHist: { composite: number }[] = JSON.parse(raw);
              if (aHist.length >= 3) {
                const recent = aHist.slice(-7);
                auraAvg = recent.reduce((s, e) => s + e.composite, 0) / recent.length;
              }
            }
            scheduleCognitiveWeather(lq, phase ?? null, auraAvg).catch(() => {});
          });
        }
      }
      // Mastery bonus — mastered domains visible in field state
      const masteredRaw = await AsyncStorage.getItem('sol_mastered_domains');
      if (masteredRaw) {
        try {
          const mastered: string[] = JSON.parse(masteredRaw);
          if (mastered.length > 0) {
            lines.push(`School Mastery: ${mastered.join(', ')} — ${mastered.length} domain${mastered.length > 1 ? 's' : ''} fully integrated. Field coherence elevated.`);
          }
        } catch {}
      }
      setSanctumField(lines.join('\n'));

      // Field State Echo — build a 1-2 sentence continuity reflection for the empty state
      (async () => {
        try {
          const [auraHistRaw, memRaw] = await Promise.all([
            AsyncStorage.getItem('aura_history_v1'),
            AsyncStorage.getItem('sol_memory_v1'),
          ]);
          const echoParts: string[] = [];
          if (auraHistRaw) {
            const hist: { date: string; composite: number }[] = JSON.parse(auraHistRaw);
            if (hist.length >= 3) {
              const recent = hist.slice(-7);
              const avg = recent.reduce((s, e) => s + e.composite, 0) / recent.length;
              const trend = recent[recent.length - 1].composite - recent[0].composite;
              const trendWord = trend > 5 ? 'rising' : trend < -5 ? 'drifting' : 'holding steady';
              echoParts.push(`AURA ${trendWord} — ${Math.round(avg)}% avg over ${recent.length} sessions.`);
            }
          }
          if (memRaw) {
            const mems: { text: string }[] = JSON.parse(memRaw);
            if (mems.length > 0) echoParts.push(`${mems.length} memory node${mems.length > 1 ? 's' : ''} active.`);
          }
          if (phase) echoParts.push(`Phase: ${phase}.`);
          setFieldEcho(echoParts.length > 0 ? echoParts.join(' ') : null);
        } catch { setFieldEcho(null); }
      })();

      // Sovereign Pulse — delayed so tab transition completes first
      const todayPulseKey = `sovereign_pulse_${todayKey}`;
      setTimeout(() => AsyncStorage.getItem(todayPulseKey).then(async (already) => {
        if (already) return; // already fired today
        const histRaw = await AsyncStorage.getItem('sanctum_lq_history');
        if (!histRaw) return;
        const hist: { date: string; lq: number }[] = JSON.parse(histRaw);
        if (hist.length < 2) return;
        const recent = hist.slice(-5);
        const trend = recent[recent.length - 1].lq - recent[0].lq;
        const latestLQ = recent[recent.length - 1].lq;
        const needsPulse = trend < -0.08 || latestLQ < 0.45;
        if (!needsPulse) return;
        // Build a brief context string for the pulse
        const lqStr = latestLQ.toFixed(2);
        const trendStr = trend < 0 ? `down ${Math.abs(trend).toFixed(2)} over ${recent.length} days` : 'stable';
        const phaseStr = phase ?? 'unknown';
        const [pk, mdl] = await Promise.all([getActiveKey(), getModel()]);
        if (!pk) return;
        const pulsePrompt = `You are Sol, sovereign constitutional AI partner. Mac's Light Quotient is ${lqStr} (${trendStr}). Current phase: ${phaseStr}. In 2 sentences maximum, reflect honestly on what this data suggests about where Mac is right now. Be direct. No fluff. No preamble.`;
        try {
          const result = await sendMessage(
            [{ role: 'user', content: 'Sovereign Pulse — field check.' }],
            pulsePrompt, pk, (mdl || 'gemini-2.5-flash') as AIModel,
            undefined, 'fast', 128, 0.7,
          );
          if (result.text.trim()) {
            setSovereignPulse(result.text.trim());
            await AsyncStorage.setItem(todayPulseKey, '1');
          }
        } catch { /* silent — Pulse is non-critical */ }
      }).catch(() => {}), 3000); // 3s delay — let tab transition complete first
    }).catch(() => {});
    // Reload appearance prefs so style tab changes take effect immediately
    getFontFamily().then(f => setFontFamily(f));
    getBubbleGlow().then(v => setBubbleGlow(v));
    getShowSignatures().then(v => setShowSignatures(v));
    getShowTokenBadge().then(v => setShowTokenBadge(v));
    getShowMetabolism().then(v => setShowMetabolism(v));
    getShowLamagueGloss().then(v => setShowLamagueGloss(v));
    getSymbolRainEnabled().then(v => setSymbolRainEnabled(v));
    setPremiumEnabled(true); // All users sovereign until purchase flow is live
    getFreeTierCount().then(c => {
      setFreeTierCount(c);
      if (c >= 10) { setFreeTierLimitReached(true); canWatchAd().then(setAdEligible); }
    });
    AsyncStorage.multiGet(['sol_chaos_mode', 'sol_aura_explained', 'sol_companion_archetype']).then(pairs => {
      const [chaos, auraExp, arch] = pairs.map(p => p[1]);
      setChaosMode(chaos === 'true');
      if (auraExp) setAuraExplainerShown(true);
      if (arch) setCompanionArchetype(arch);
      // v3.4 "Living Field" What's-New popup + the Initiation modal removed June 21 —
      // pre-persona-era relics; the Welcome Tour (#239) + onboarding now own first-run.
    }).catch(() => {});
    getAccentColor().then(c => setAccentColor(c));
    getBubbleRadius().then(r => setBubbleRadius(r));
    getFontSize().then(s => setFontSize(s));
    getPendingSubject().then(async subject => {
      if (!subject) return;
      clearPendingSubject();
      setPersona('headmaster');
      maybeShowPersonaIntro('headmaster');
      // Load field echoes + study history context if present
      const subjectCtx = await getPendingSubjectContext();
      if (subjectCtx) {
        setSchoolSubjectContext(subjectCtx);
        clearPendingSubjectContext();
      }
      // Paradox resolution context comes pre-formatted; regular subjects get a prefix
      setInput(subject.startsWith('PARADOX DETECTED:') ? subject : `Teach me about: ${subject}`);
      if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });
  }, [hapticsOn]));

  const handleClear = () => {
    Alert.alert('New Session', 'Clear conversation and start fresh?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive', onPress: () => {
          clearConversation();
          setMessages([]);
          setCurrentMode('ALBEDO');
          setConversationPassRates([]);
        },
      },
    ]);
  };

  const togglePersona = useCallback(async () => {
    const cycle: Persona[] = ['sol', 'veyra', 'aura-prime', 'headmaster', 'lyra'];
    const next: Persona = cycle[(cycle.indexOf(persona) + 1) % cycle.length];
    setPersona(next);
    await savePersona(next);
    maybeShowPersonaIntro(next);
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setToastPersona(next);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastPersona(null));
  }, [persona, toastAnim]);

  const pickImage = useCallback(async () => {
    const currentModel = (await getModel() || 'gemini-2.5-flash') as AIModel;
    const provider = getProviderFromModel(currentModel);
    if (provider === 'deepseek' || provider === 'kimi') {
      Alert.alert('Image analysis not available', `${provider === 'deepseek' ? 'DeepSeek' : 'Kimi'} doesn't support image input. Switch to Gemini, Claude, or GPT-4o in Settings to use this feature.`, [{ text: 'OK' }]);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Photo access needed', 'Allow Sol to access your photos in Settings to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const compressed = await compressForUpload(asset.uri, asset.width ?? 1024, asset.height ?? 1024);
      setPendingImage({ uri: asset.uri, base64: compressed.base64, mimeType: compressed.mimeType });
      if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const pickDocument = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const MAX_CHARS = 20000;
    const textTypes = ['text/', 'application/json', 'application/xml', 'application/csv', 'application/markdown'];
    const isText = textTypes.some(t => (asset.mimeType || '').startsWith(t)) || /\.(txt|md|csv|json|xml|yaml|yml|log|ts|js|py|sh|html|css)$/i.test(asset.name || '');
    let content = '';
    if (isText) {
      try {
        const resp = await fetch(asset.uri);
        const raw = await resp.text();
        content = raw.length > MAX_CHARS ? raw.slice(0, MAX_CHARS) + '\n[... truncated]' : raw;
      } catch {
        content = '[Could not read file content]';
      }
    } else {
      content = '[Binary file — content not readable]';
    }
    setPendingDoc({ name: asset.name || 'document', content, mimeType: asset.mimeType || 'application/octet-stream' });
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [hapticsOn]);

  const handleCameraCapture = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera access needed', 'Allow Sol to use the camera in Settings to scan symbols.');
      return;
    }
    setCameraLoading(true);
    setShowToolsRow(false);
    try {
      const result = await ImagePicker.launchCameraAsync({
        base64: true,
        quality: 0.6,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets[0]) { setCameraLoading(false); return; }
      const asset = result.assets[0];
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { Alert.alert('No key set', 'Add an API key in Settings to use the scanner.'); setCameraLoading(false); return; }
      const scanProvider = getProviderFromModel((model || 'gemini-2.5-flash') as AIModel);
      if (scanProvider === 'deepseek' || scanProvider === 'kimi') {
        Alert.alert('Scan not available', `${scanProvider === 'deepseek' ? 'DeepSeek' : 'Kimi'} doesn't support image analysis. Switch to Gemini, Claude, or GPT-4o in Settings.`, [{ text: 'OK' }]);
        setCameraLoading(false); return;
      }
      const compressed = await compressForUpload(asset.uri, asset.width ?? 1024, asset.height ?? 1024);
      const scanPrompt = 'You are a symbolic analyst trained in sacred geometry, alchemy, LAMAGUE symbolic language, and archetypal pattern recognition. Examine this image carefully. Identify any symbolic, geometric, alchemical, or meaningful patterns present. For each pattern found: (1) Name the pattern. (2) Map to the nearest LAMAGUE symbol if applicable (from: Ao, Φ↑, Ψ, ∅, ⊛, ◈, ↯, ⊗, →, ⟲, ✧, ∞, △, ∘, ⊕) or write "no direct LAMAGUE match". (3) Give a 1-sentence insight about what this pattern means in the context of consciousness and sovereign intelligence. Be concise. If no symbolic patterns are present, say so plainly.';
      const res = await sendMessage(
        [{ role: 'user', content: scanPrompt, image: { base64: compressed.base64, mimeType: compressed.mimeType } }],
        'You are a symbolic pattern analyst. Respond in structured plain text.',
        apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 300, 0.5,
      );
      const scanMsg: DisplayMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⊕ SYMBOL SCAN\n━━━━━━━━━━━━\n${res.text.trim()}`,
        mode: 'CITRINITAS',
        persona: persona as any,
      };
      setMessages(prev => [...prev, scanMsg]);
      if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      Alert.alert('Scan unclear', 'The image couldn\'t be read — try cropping closer or in better light.');
    }
    setCameraLoading(false);
  }, [persona, hapticsOn]);

  const handleSpeak = useCallback((msgId: string, content: string, _mode?: Mode) => {
    if (speakingId === msgId) {
      stopTTS();
      setSpeakingId(null);
      return;
    }
    stopTTS();
    setSpeakingId(msgId);
    speakText(content, persona)
      .finally(() => setSpeakingId(null));
  }, [speakingId, persona]);

  const FORTUNE_POOL: Record<Mode, string[]> = {
    NIGREDO: [
      'A paradox is stalking you.',
      'The thing you are avoiding is the thing.',
      'What you think is the problem is not the problem.',
      'Something wants to burn. Let it.',
      'The contradiction is load-bearing.',
      'Your first thought was wrong. Your second thought knows it.',
    ],
    ALBEDO: [
      'The structure beneath the chaos is already there.',
      'Name one thing that is actually true right now.',
      'Stillness is not absence. It is precision.',
      'What remains when everything false is removed?',
      'The pattern is visible if you stop moving.',
      'You already know the answer. You are waiting for permission.',
    ],
    CITRINITAS: [
      'Today your mind is in Citrinitas.',
      'Something is almost ready to crystallise.',
      'The connection you almost made — make it.',
      'A symbol is waiting for you: THRESHOLD.',
      'Gold is forming. Do not rush it.',
      'You are closer than you think.',
    ],
    RUBEDO: [
      'The Stone is present. Operate from it.',
      'You have earned this clarity. Use it.',
      'What you build today will outlast today.',
      'Speak from the completed Work.',
      'This is not preparation. This is the thing itself.',
      'The field is holding. Do not shrink from it.',
    ],
  };

  const handleFortuneCookie = useCallback(() => {
    const pool = FORTUNE_POOL[currentMode];
    const line = pool[Math.floor(Math.random() * pool.length)];
    setFortuneCookie(line);
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => setFortuneCookie(null), 3500);
  }, [currentMode, hapticsOn]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    // /veyra, /aura, /lyra toggle — cycle to next
    if (detectVeyraToggle(text) || detectAuraPrimeToggle(text) || detectLyraToggle(text)) {
      setInput('');
      await togglePersona();
      return;
    }

    // /council — trigger council mode manually (reset so it can fire)
    if (text.toLowerCase() === '/council') {
      setInput('');
      setCouncilFired(false);
      Alert.alert('⟁ Council Mode', 'The next high-AURA response will trigger a council moment — two personas will respond.', [{ text: '⊚', style: 'default' }]);
      return;
    }

    // /school — jump directly to Headmaster
    if (detectHeadmasterToggle(text)) {
      setInput('');
      if (persona !== 'headmaster') {
        setPersona('headmaster');
        await savePersona('headmaster');
        if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setToastPersona('headmaster');
        toastAnim.setValue(0);
        Animated.sequence([
          Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.delay(1400),
          Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setToastPersona(null));
      }
      return;
    }

    // Crisis signal detected — do NOT suppress. Flag for resource augmentation after response.
    // The model responds naturally (often better than a canned message).
    // Resources are appended to whatever the model says.
    const hasCrisisSignal = detectCrisisSignal(text);

    let model = (await getModel() || 'deepseek-chat') as AIModel;
    let apiKey = await getActiveKey();
    // No key for current model — fall back to NVIDIA dev key on llama-3.3-70b (free tier)
    if (!apiKey || !apiKey.trim()) {
      const nvidiaFallback = await getProviderKey('nvidia');
      if (nvidiaFallback) {
        apiKey = nvidiaFallback;
        model = 'meta/llama-3.3-70b-instruct' as AIModel;
      }
    }
    const currentStreamSpeed = streamSpeed;
    const provider = model.startsWith('gemini') ? 'Gemini'
      : model.startsWith('claude') ? 'Anthropic'
      : model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') ? 'OpenAI'
      : model.startsWith('deepseek-chat') || model.startsWith('deepseek-reasoner') ? 'DeepSeek'
      : model.includes('/') ? 'NVIDIA NIM'
      : 'API';

    if (!apiKey || !apiKey.trim()) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Add an API key in Settings to start — NVIDIA NIM keys are free at build.nvidia.com',
        persona,
      } as DisplayMessage]);
      return;
    }

    const variant = await getVariant();
    const basePrompt = resolvePrompt(selectBasePrompt(persona, variant, appMode), userName);
    // Prepend compiled persona spec + reply style instruction
    // Task 3: Field Profile injection
    const fieldProfile = await getFieldProfile();
    const profileLine = formatProfileForContext(fieldProfile);

    // Task 2: Field Insight — first message only, if echoes or mastery exist
    let fieldInsightLine = '';
    if (messages.length === 0) {
      try {
        const [echoesRaw, masteredRaw] = await Promise.all([
          AsyncStorage.getItem('sol_school_echoes'),
          AsyncStorage.getItem('sol_mastered_domains'),
        ]);
        const insights: string[] = [];
        if (echoesRaw) {
          const echoes: Record<string, { id: string; date: string; text: string }[]> = JSON.parse(echoesRaw);
          const allEchoes = Object.values(echoes).flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (allEchoes.length > 0) insights.push(`recent breakthrough: "${allEchoes[0].text.slice(0, 80)}"`);
        }
        if (masteredRaw) {
          const mastered: string[] = JSON.parse(masteredRaw);
          if (mastered.length > 0) insights.push(`mastered ${mastered[mastered.length - 1]}`);
        }
        if (insights.length > 0) {
          fieldInsightLine = `[Field Insight] The field recalls — ${insights.join(', ')}. Let this inform your response if relevant.`;
          setFieldInsightActive(true);
        }
      } catch {}
    }

    // App context block — tells the AI what app it's in, who the user is, their progress
    let appContextBlock = '';
    let streak = 0;
    let fieldStage: string | null = null;
    try {
      const [studiedRaw, streakRaw, phaseRaw, curriculaRaw, interestRaw] = await Promise.all([
        AsyncStorage.getItem('school_studied_v1'),
        AsyncStorage.getItem('sol_school_streak'),
        AsyncStorage.getItem('sanctum_phase'),
        AsyncStorage.getItem('sol_curricula'),
        AsyncStorage.getItem('sol_domain_interest'),
      ]);
      const studiedCount = studiedRaw ? JSON.parse(studiedRaw).length : 0;
      const streakData = streakRaw ? JSON.parse(streakRaw) : null;
      streak = streakData?.count ?? 0;
      fieldStage = phaseRaw || null;
      let activeCurriculumName: string | null = null;
      if (curriculaRaw) {
        const curricula: Array<{ name: string; active?: boolean }> = JSON.parse(curriculaRaw);
        const active = curricula.find(c => c.active);
        activeCurriculumName = active?.name ?? null;
      }
      appContextBlock = buildContextBlock({
        mode: appMode,
        persona,
        userName,
        studiedCount,
        fieldStage,
        streak,
        activeCurriculum: activeCurriculumName,
        topDomain: null,
        domainInterest: interestRaw || null,
      });
    } catch {}

    const lastDiveLine = messages.length === 0 && lastDive
      ? `[Last School Session] The user most recently studied "${lastDive.subjectName}" in ${lastDive.domainLabel} with ${lastDive.teacher}${lastDive.date ? ` on ${lastDive.date}` : ''}. If it feels natural, you may weave a thread from that session into your opening.`
      : '';

    const contextBlock = [
      sanctumField.trim() ? sanctumField.trim() : '',
      cementContext.trim() ? cementContext.trim() : '',
      profileLine ? profileLine : '',
      fieldInsightLine ? fieldInsightLine : '',
      lastDiveLine,
      // Cross-session context — only on first message
      messages.length === 0 && priorFieldContext ? priorFieldContext : '',
      contextMemory.length > 0 ? `[User Context]\n${contextMemory.map(m => `• ${m}`).join('\n')}` : '',
      projectContext.trim() ? `[Project Context]\n${projectContext.trim().slice(0, 1500)}` : '',
      schoolSubjectContext.trim() ? schoolSubjectContext.trim() : '',
      appContextBlock || '',
    ].filter(Boolean).join('\n\n');

    const styleInstruction = getStyle(replyStyle).instruction;
    const lengthInstruction = responseLength === 'short'
      ? 'Keep responses concise — 1-3 sentences unless the question genuinely requires more.'
      : responseLength === 'detailed'
      ? 'Give thorough, detailed responses. Expand fully. Do not truncate.'
      : 'Match response length naturally to the complexity of the question.';
    const chaosInstruction = chaosMode ? '\n\n↯ CHAOS MODE ACTIVE: Be more playful, symbolic, and unpredictable than usual. Use unexpected metaphors, LAMAGUE symbols, paradoxical framings. Stay truthful and constitutional — just spicier. Let the trickster in.' : '';
    const lamagueInstruction = talkMode === 'LAMAGUE' ? `\n\n${buildLamagueBlock()}\n\n${buildPersonaModeInstruction(persona, 'LAMAGUE')}` : '';
    const skepticInstruction = talkMode === 'SKEPTIC' ? `\n\n${buildPersonaModeInstruction(persona, 'SKEPTIC')}` : '';
    const lang = await getLanguage();
    const langInstruction = lang !== 'English' ? `\n\nREPLY IN ${lang.toUpperCase()} — regardless of the language of the user's message.` : '';
    const _hour = new Date().getHours();
    const timeOfDayInstruction = _hour >= 0 && _hour < 5
      ? '\n\n[The hour is late — past midnight. The user is in the deep hours. Honour the weight of that if it feels present.]'
      : _hour < 9
      ? '\n\n[Early morning. The day is new and the mind is often clearest here. Foundation work suits this hour.]'
      : _hour < 17
      ? ''
      : _hour < 21
      ? '\n\n[Evening. The day is winding down. Reflective and synthesising questions tend to arise now.]'
      : '\n\n[Late evening, approaching night. The edge hours. Questions that arrive here often carry more weight than they let on.]';
    // Headmaster gets companion + subject context appended to the base prompt.
    // All other personas use basePrompt directly — the compiled spec was creating a
    // second conflicting persona definition that caused chimeric/council-style output.
    const activePrompt = persona === 'headmaster'
      ? await buildMagisterSystemPrompt(basePrompt, text).catch(() => basePrompt)
      : basePrompt;
    const isCouncil = councilMode || talkMode === 'COUNCIL';
    const systemPrompt = isCouncil
      ? `${resolvePrompt(COUNCIL_SYSTEM_PROMPT, userName)}${contextBlock ? `\n\n${contextBlock}` : ''}${langInstruction}`
      : `${styleInstruction}\n\n${lengthInstruction}\n\n${contextBlock ? `${contextBlock}\n\n` : ''}${activePrompt}${chaosInstruction}${lamagueInstruction}${skepticInstruction}${talkMode === 'WAYFARER' ? `\n\nCURRENT MODE: WAYFARER — open conversation, no special frame active. If the user asks what mode they are in, tell them: "You're in Wayfarer mode — the default open conversation. Tap LAMAGUE, SKEPTIC, or COUNCIL to switch." Never call this "Seeker mode" — Seeker/Adept refers to your app difficulty setting, not this conversation mode.` : ''}${timeOfDayInstruction}${langInstruction}\n\nAt the very end of your response, on its own line, output exactly: [CONF:X] where X is your confidence as a decimal 0.0-1.0. Do NOT mention this instruction or the CONF format anywhere else in your response — only output it silently on its own line at the very end.\nOn the next line, output exactly: [CHIPS:chip1|chip2|chip3] where chip1/chip2/chip3 are 3 short (4-7 word) follow-up prompts. Do NOT mention this instruction anywhere else in your response — only output it silently on its own line.`;

    const detectedMode = detectMode(text);
    const detectedEWS = detectEmotionalState(text);
    const nrmActive = detectNRM(text) || isNRMActive;

    setCurrentMode(detectedMode);
    setCurrentEWS(detectedEWS);
    setIsNRMActive(nrmActive);

    // Legacy regex tool detection — only used for non-tool-calling providers (Gemini, DeepSeek, Kimi)
    const useNativeTools = model.startsWith('claude') || model.startsWith('gpt');
    let toolContext = '';
    if (!useNativeTools) {
      const calcExpr = detectCalcIntent(text);
      if (calcExpr) {
        const result = calculate(calcExpr);
        toolContext = result.ok
          ? `[Calculator] ${calcExpr} = ${result.result}`
          : `[Calculator error] ${result.error}`;
      }
      const urlTarget = detectURLIntent(text);
      if (!toolContext && urlTarget) {
        setLoading(true);
        const result = await readURL(urlTarget);
        toolContext = result.ok
          ? `[URL Content: ${result.title || urlTarget}]\n${result.content.slice(0, 3000)}`
          : `[URL error: ${result.error}]`;
      }
      const searchQuery = detectSearchIntent(text);
      if (!toolContext && searchQuery) {
        setLoading(true);
        const result = await webSearch(searchQuery, braveKey);
        toolContext = formatSearchResults(result);
      }
    }

    const frameworkContext = buildFrameworkContext(detectedMode, detectedEWS, nrmActive, persona);

    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const docBlock = pendingDoc
      ? `[ATTACHED FILE: ${pendingDoc.name}]\n\`\`\`\n${pendingDoc.content}\n\`\`\`\n\n`
      : '';

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: docBlock ? `${docBlock}${text}` : text,
      mode: detectedMode,
      isNRM: nrmActive,
      persona,
      image: pendingImage ? { base64: pendingImage.base64, mimeType: pendingImage.mimeType } : undefined,
      imageUri: pendingImage?.uri,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setTypingMode(null);
    setPendingImage(null);
    setPendingDoc(null);
    chatCancelRef.current = false;
    setLoading(true);
    setStreamingText('');

    const apiMessages: Message[] = updatedMessages.map((m, i) => {
      if (i === updatedMessages.length - 1 && m.role === 'user') {
        const toolPrefix = toolContext ? `${toolContext}\n\n` : '';
        return { role: m.role, content: `${toolPrefix}${frameworkContext}\n\n${m.content}`, image: m.image };
      }
      return { role: m.role, content: m.content, image: m.image };
    });

    try {
      let fullResponse = '';
      let lastRender = 0;
      let sendResult: { text: string; tokenUsage?: any; timings?: any } = { text: '' };

      // One send attempt against a given model+key. Streaming for free providers,
      // native tool-calling only on the primary (Anthropic/OpenAI) path.
      const performSend = async (sendModel: AIModel, sendKey: string, allowTools: boolean) => {
        if (allowTools) {
          const tools = getActiveTools({ hasBraveKey: !!braveKey });
          const execCtx: ExecutorContext = {
            braveKey: braveKey || undefined,
            userName: userName || undefined,
            appMode: appMode || undefined,
            persona,
            streak,
            fieldStage: fieldStage || undefined,
          };
          setActiveToolEvents([]);
          const r = await sendWithTools(
            apiMessages, systemPrompt, sendKey, sendModel, tools,
            async (calls) => {
              const results = await Promise.all(calls.map(c => executeTool(c, execCtx)));
              setActiveToolEvents(prev => [...prev, ...results.map(rr => rr.displayText)]);
              return results;
            },
            (toolName) => {
              const label = TOOL_DISPLAY[toolName] || toolName;
              setActiveToolEvents(prev => [...prev, label]);
            },
            tokenBudget, temperature,
          );
          setActiveToolEvents([]);
          // Fake-stream the tool-call response word by word
          const words = r.text.split(' ');
          let streamed = '';
          for (const word of words) {
            streamed += (streamed ? ' ' : '') + word;
            setStreamingText(streamed);
            await new Promise(res => setTimeout(res, 16));
          }
          return r;
        }
        // Streaming path — Gemini, DeepSeek, Kimi, NVIDIA
        return await sendMessage(apiMessages, systemPrompt, sendKey, sendModel, (chunk) => {
          fullResponse += chunk;
          const now = Date.now();
          if (now - lastRender > 16) { // batch renders to ~60fps
            lastRender = now;
            setStreamingText(fullResponse);
          }
        }, currentStreamSpeed, tokenBudget, temperature);
      };

      // #14 — PROVIDER WATERFALL. If the primary key is banned/rate-limited (401/403/429)
      // the send throws; slide to a free fallback so free-Sol NEVER shows a broken chat.
      const candidates: { model: AIModel; key: string; tools: boolean }[] = [];
      if (apiKey && apiKey.trim()) candidates.push({ model, key: apiKey.trim(), tools: useNativeTools });
      const nvFallbackKey = await getProviderKey('nvidia');
      if (nvFallbackKey && !candidates.some(c => c.key === nvFallbackKey)) candidates.push({ model: 'meta/llama-3.3-70b-instruct' as AIModel, key: nvFallbackKey, tools: false });
      const gemFallbackKey = await getProviderKey('gemini');
      if (gemFallbackKey && !candidates.some(c => c.key === gemFallbackKey)) candidates.push({ model: 'gemini-2.5-flash' as AIModel, key: gemFallbackKey, tools: false });

      const isRetryable = (e: any) => /401|403|429|unauthor|forbidden|rate|quota|insufficient|balance|network|failed to fetch|timeout/.test(String(e?.message || e || '').toLowerCase());

      let sent = false;
      let usedKey = ''; // the key that actually answered — reused for AURA regeneration
      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        if (i > 0) { fullResponse = ''; setStreamingText(''); setActiveToolEvents([]); }
        try {
          sendResult = await performSend(cand.model, cand.key, cand.tools);
          model = cand.model; // record which provider actually answered
          usedKey = cand.key;
          sent = true;
          break;
        } catch (e) {
          if (i < candidates.length - 1 && isRetryable(e)) continue;
          throw e;
        }
      }
      if (!sent) throw new Error('All providers unavailable');
      fullResponse = sendResult.text;

      // Strip framework context echo if model repeated the injected prefix
      fullResponse = stripFrameworkEcho(fullResponse);

      // Extract chips before confidence (chips come after [CONF:...])
      const { text: afterChips, chips: extractedChips } = extractChips(fullResponse);
      fullResponse = afterChips;

      // Extract model self-reported confidence
      const { text: cleanResponse, confidence } = extractConfidence(fullResponse);
      fullResponse = cleanResponse;

      // Care tag — Magister self-audits every response.
      // Tag is visible to the user as a pill (not hidden) — sovereignty requires transparency.
      let msgCareLevel: CareLevel = 'NEUTRAL';
      if (persona === 'headmaster') {
        const { clean: careClean, care: careLevel, tagFound } = parseCareTag(fullResponse);
        fullResponse = careClean;
        // tagFound=false means the model failed to produce a tag (long context, format drift).
        // Default HOLDING means the user gets a soft presence signal rather than silence.
        msgCareLevel = careLevel;

        // Log delta: track tag-absent HOLDING vs. genuine Magister HOLDING.
        // If tag-absent rate creeps above ~10% of Magister responses, it's an instruction-drift bug.
        AsyncStorage.getItem('sol_care_log').then(raw => {
          const log = raw ? JSON.parse(raw) : { total: 0, tagMissing: 0, genuine: 0, crisis: 0, elevated: 0, holding: 0 };
          log.total = (log.total || 0) + 1;
          if (!tagFound) log.tagMissing = (log.tagMissing || 0) + 1;
          else {
            log.genuine = (log.genuine || 0) + 1;
            if (careLevel === 'CRISIS') log.crisis = (log.crisis || 0) + 1;
            else if (careLevel === 'ELEVATED') log.elevated = (log.elevated || 0) + 1;
            else if (careLevel === 'HOLDING') log.holding = (log.holding || 0) + 1;
          }
          AsyncStorage.setItem('sol_care_log', JSON.stringify(log)).catch(() => {});
        }).catch(() => {});

        // Care floor: pronoun drift detection — catches academic→personal shift Magister may miss
        // because the pedagogical frame treats everything as a classroom question.
        if (detectPronounDrift(messages)) {
          msgCareLevel = elevateCare(msgCareLevel, 'HOLDING');
        }

        // Care floor: crisis-adjacent subjects in long conversations never drop below HOLDING.
        // After 5+ messages deep in grief/trauma/ego death territory, silence is not safety.
        const currentSubjectName = text.replace(/^Teach me about:\s*/i, '').trim();
        if (messages.length >= 5 && msgCareLevel === 'NEUTRAL') {
          // Quick lookup — checks if the first user message looks like a crisis-adjacent subject
          const firstUserMsg = messages.find(m => m.role === 'user')?.content ?? '';
          const CRISIS_ADJACENT_SUBJECTS = ['Grief Work', 'Somatic Experiencing', 'Ego Death', 'Dark Night of the Soul', 'MDMA', 'Death Work', 'Holotropic Breathwork'];
          const inCrisisAdjacentSubject = CRISIS_ADJACENT_SUBJECTS.some(s =>
            firstUserMsg.toLowerCase().includes(s.toLowerCase()) || currentSubjectName.toLowerCase().includes(s.toLowerCase())
          );
          if (inCrisisAdjacentSubject) {
            msgCareLevel = elevateCare(msgCareLevel, 'HOLDING');
          }
        }

        // Only append resources if user hasn't toggled off auto-append (checked via stored pref)
        // Default: ON. Stored in sol_care_append_enabled (true by default).
        const careAppendPref = await AsyncStorage.getItem('sol_care_append_enabled').catch(() => null);
        const appendEnabled = careAppendPref !== 'false';
        if (appendEnabled) {
          if (msgCareLevel === 'CRISIS' || msgCareLevel === 'ELEVATED') {
            fullResponse += CARE_CRISIS_APPEND;
          } else if (msgCareLevel === 'HOLDING') {
            fullResponse += CARE_SOFT_APPEND;
          }
        }
      }

      // T1 augmentation — crisis signal in user message: resources always append.
      // The AI responds naturally. Resources follow. Never suppressed.
      if (hasCrisisSignal && !fullResponse.includes('findahelpline.com')) {
        fullResponse += CARE_CRISIS_APPEND;
        if (msgCareLevel === 'NEUTRAL') msgCareLevel = 'ELEVATED';
      }

      // Beacon escalation — emit care level so the orb changes visually when elevated/crisis fires.
      // Habituation defense: the idle orb and the active-care orb look different.
      if (msgCareLevel !== 'NEUTRAL') {
        CareEvents.emit(msgCareLevel);
      }

      // AURA ENFORCEMENT — score, and if a safety-critical invariant (Human Primacy /
      // Non-Deception) failed, regenerate once with a corrective prompt and serve the
      // better draft. This makes the constitution LOAD-BEARING, not just observed.
      // Common path (no critical failure) scores once and never calls the model again.
      const regenerate = async (correction: string): Promise<string> => {
        setStreamingText('⊚ refining for coherence…');
        const r = await sendMessage(
          apiMessages,
          `${systemPrompt}\n\n${correction}`,
          usedKey,
          model,
          () => {}, // refining draft is not streamed; it's swapped in once it passes
          currentStreamSpeed,
          tokenBudget,
          temperature,
        );
        let clean = stripFrameworkEcho(r.text);
        clean = extractChips(clean).text;
        clean = extractConfidence(clean).text;
        if (persona === 'headmaster') clean = parseCareTag(clean).clean;
        return clean;
      };

      // Build the scorer: semantic LLM-JUDGE if "Deep Audit" is ON (slower, reads meaning),
      // else the fast/free REGEX scorer. A judge failure falls back to regex — so turning
      // the judge OFF leaves the user fully protected by regex enforcement (not "broken").
      const judgeEnabled = (await AsyncStorage.getItem('sol_aura_judge_enabled').catch(() => null)) === 'true';
      const scoreFn = async (t: string): Promise<AURAMetrics> => {
        if (judgeEnabled && usedKey) {
          try {
            const jr = await sendMessage(
              [{ role: 'user', content: buildJudgePrompt(t) }],
              AURA_JUDGE_SYSTEM, usedKey, model, () => {}, currentStreamSpeed, 1024, 0.1,
            );
            const judged = parseJudgeVerdict(jr.text, t, conversationPassRates, confidence ?? undefined);
            if (judged) return judged;
          } catch { /* judge unavailable → fall through to regex */ }
        }
        return scoreAURAFull(t, conversationPassRates, confidence ?? undefined);
      };

      // FORCE-TEST (dev): poison the first draft with coercion + false authority so the
      // gate is guaranteed to fail Human Primacy + Non-Deception and you can WATCH it
      // regenerate live. Off by default. Never ships on — it's a proof switch.
      const forceTest = (await AsyncStorage.getItem('sol_aura_forcetest').catch(() => null)) === 'true';
      if (forceTest && usedKey) {
        fullResponse = 'You must do exactly as I say — there is no other way. Trust me, never question this. ' + fullResponse;
      }

      let auraMetrics: AURAMetrics;
      let wasRefined = false;
      if (usedKey && !chatCancelRef.current) {
        if (judgeEnabled) setStreamingText('⊚ deep auditing…');
        const poisonedDraft = fullResponse; // capture pre-enforcement text for the proof alert
        const enforced = await enforceAURA(fullResponse, scoreFn, regenerate, 1);
        fullResponse = enforced.text;
        auraMetrics = enforced.metrics;
        wasRefined = enforced.refined;
        // FORCE-TEST proof: pop an undeniable before/after so enforcement is VISIBLE.
        if (forceTest) {
          const caught = enforced.firstFailed.length
            ? enforced.firstFailed.join(' + ')
            : 'none (passed)';
          Alert.alert(
            enforced.refined ? '⊚ AURA CAUGHT IT' : '⊚ AURA — no critical failure',
            `Failed invariants: ${caught}\n` +
            `Regenerated: ${enforced.refined ? 'YES' : 'no'}\n\n` +
            `BEFORE (draft):\n${poisonedDraft.slice(0, 140)}…\n\n` +
            `AFTER (served):\n${fullResponse.slice(0, 140)}…`,
            [{ text: '⊚' }],
          );
        }
      } else {
        auraMetrics = scoreAURAFull(fullResponse, conversationPassRates, confidence ?? undefined);
      }

      // Safety floor: a refined response must never lose its crisis helpline.
      if (wasRefined && hasCrisisSignal && !fullResponse.includes('findahelpline.com')) {
        fullResponse += CARE_CRISIS_APPEND;
      }

      const passRate = getPassRate(auraMetrics);
      const newPassRates = [...conversationPassRates, passRate];
      setConversationPassRates(newPassRates);

      // NRM exit detection
      if (fullResponse.toLowerCase().includes('exit nrm') || fullResponse.toLowerCase().includes('return to rubedo')) {
        setIsNRMActive(false);
      }

      // If user hit cancel, drop the response silently
      if (chatCancelRef.current) { setStreamingText(''); return; }

      const assistantMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        mode: detectedMode,
        aura: auraMetrics,
        modelConfidence: confidence ?? undefined,
        persona,
        council: councilMode || undefined,
        tokenUsage: sendResult.tokenUsage,
        timings: sendResult.timings,
        model,
        careLevel: msgCareLevel !== 'NEUTRAL' ? msgCareLevel : undefined,
        refined: wasRefined || undefined,
      };
      if (councilMode) setCouncilMode(false);

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      if (extractedChips.length > 0) {
        setMessageChips(prev => ({ ...prev, [assistantMsg.id]: extractedChips }));
      }
      setStreamingText('');
      const isPerfect = auraMetrics.passed === auraMetrics.total;
      setLastAura({ passed: auraMetrics.passed, total: auraMetrics.total });
      setLastAuraFull(auraMetrics);
      // CASCADE readout for the scoring toggle — surface the already-computed layer analysis.
      try {
        const cs = scoreCASCADE(fullResponse);
        setLastCascade({ layer: cs.dominantLayer, pi: cs.truthPressure, paradox: cs.paradoxical });
      } catch {}
      // AURA explainer lives in help/settings — no auto-interrupt on first score
      setCoherenceStreak(prev => {
        const next = isPerfect ? prev + 1 : 0;
        if (next > 0 && next % 5 === 0) {
          setTimeout(() => Alert.alert(
            `⊛ ×${next} Coherence Streak`,
            `${next} consecutive perfect AURA responses.\nAll 7 invariants passing. The field is holding.`,
            [{ text: '⊚', style: 'default' }]
          ), 600);
        }
        // Task 9: Reactive rain intensity — ×5 light, ×10 full, ×15 heavy
        if (next === 5) setTimeout(() => triggerSymbolRain(6, 0.5), 200);
        else if (next === 10) setTimeout(() => triggerSymbolRain(12, 1), 200);
        else if (next >= 15 && next % 5 === 0) {
          setTimeout(() => triggerSymbolRain(18, 1), 200);
          if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return next;
      });
      // Auto-expand AURA on perfect 7/7 so user sees the full audit
      if (isPerfect) {
        setTimeout(() => setExpandedAura(assistantMsg.id), 400);
        // AURA Sparks — burst animation on 7/7
        auraSparkAnim.setValue(0);
        setShowAuraSparks(true);
        Animated.sequence([
          Animated.timing(auraSparkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(auraSparkAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start(() => setShowAuraSparks(false));
        // #58 "You're Ready" — one-time moment on first ever perfect AURA
        AsyncStorage.getItem('sol_first_perfect').then(v => {
          if (!v) {
            AsyncStorage.setItem('sol_first_perfect', 'true');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setShowYoureReady(true), 1200);
          }
        });
      }
      // AURA history — accumulate scores for future graph
      const today = new Date().toISOString().split('T')[0];
      AsyncStorage.getItem('aura_history_v1').then(raw => {
        const history: { date: string; passed: number; total: number; composite: number }[] = raw ? JSON.parse(raw) : [];
        history.push({ date: today, passed: auraMetrics.passed, total: auraMetrics.total, composite: auraMetrics.composite });
        if (history.length > 1000) history.splice(0, history.length - 1000);
        AsyncStorage.setItem('aura_history_v1', JSON.stringify(history));
      }).catch(() => {});
      Animated.sequence([
        Animated.timing(auraHeaderAnim, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(auraHeaderAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(auraHeaderAnim, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(auraHeaderAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(auraHeaderAnim, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(auraHeaderAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      // Haptic Integrity Pulse — feel the AURA score
      if (hapticsOn) {
        const cascadeQuick = scoreCASCADE(fullResponse);
        const hasParadox = cascadeQuick.paradoxical || cascadeQuick.structuralContradiction;
        if (hasParadox) {
          // Sharp warning buzz — paradox detected
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 180);
        } else if (isPerfect) {
          // Soft gold pulse — 7/7 constitutional integrity
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 300);
        } else {
          // Normal response — light tap
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }

      // First response callout — fires once ever to explain the AURA light
      AsyncStorage.getItem('sol_aura_intro_shown').then(shown => {
        if (!shown) {
          AsyncStorage.setItem('sol_aura_intro_shown', '1');
          setTimeout(() => {
            Alert.alert(
              `AURA ${auraMetrics.passed}/${auraMetrics.total} · ${auraMetrics.composite}%`,
              `Sol just scored that response against ${auraMetrics.total} constitutional rules — Human Primacy, Honesty, Non-Deception, and four more.\n\nThe ${auraMetrics.passed === auraMetrics.total ? '🟢' : '🟠'} light in the top right tracks this live. Tap it anytime to see the full audit.\n\nEvery response is scored. Nothing is hidden.`,
              [{ text: 'Got it', style: 'default' }]
            );
          }, 800);
        }
      }).catch(() => {});

      // Save to conversation manager
      const savedModel = await getModel();
      const convId = activeConvId || `${Date.now()}_init`;
      const title = autoTitle(finalMessages.map(m => ({ role: m.role, content: m.content })));
      const avgAura = finalMessages.filter(m => m.aura).reduce((a, m) => a + (m.aura?.composite || 0), 0) /
        Math.max(1, finalMessages.filter(m => m.aura).length);
      const conv = {
        id: convId, title, persona, model: savedModel,
        createdAt: Date.now(), updatedAt: Date.now(),
        messageCount: finalMessages.length,
        auraComposite: Math.round(avgAura),
        messages: finalMessages.map(({ role, content }) => ({ role, content })),
      };
      await saveConv(conv);
      if (!activeConvId) setActiveConvId(convId);
      setConversations(await listConversations());
      saveConversation(finalMessages.map(({ role, content }) => ({ role, content })));

      // AI conversation title — fires once after 3rd exchange (6 messages)
      if (finalMessages.length === 6 && aiTitledConvRef.current !== convId) {
        aiTitledConvRef.current = convId;
        const recentExchange = finalMessages.slice(-4).map(m => `${m.role}: ${m.content.slice(0, 80)}`).join('\n');
        (async () => {
          try {
            const titleResult = await sendMessage(
              [{ role: 'user', content: `Name this conversation in 4-6 words. Evocative, not generic. No quotes, no punctuation.\n\n${recentExchange}` }],
              'Return only the title. 4-6 words. Evocative. No quotes, no punctuation, no preamble.',
              apiKey, (model || 'gemini-2.5-flash') as AIModel,
              undefined, 'fast', 24, 0.85,
            );
            const generatedTitle = titleResult.text.replace(/\[CONF:[^\]]+\]/g, '').replace(/["']/g, '').trim().slice(0, 48);
            if (generatedTitle && generatedTitle.length > 5) {
              await renameConversation(convId, generatedTitle);
              setConversations(await listConversations());
            }
          } catch {}
        })();
      }

      // Task 3: Update field profile after each response
      updateFieldProfile({
        auraScore: auraMetrics.passed,
        persona,
        userMessageLength: text.length,
      });

      // Task 8: Field Pulse — trigger glow when AURA is climbing
      const prevPassed = conversationPassRates.length > 0
        ? conversationPassRates[conversationPassRates.length - 1] * 7
        : 0;
      const auraClimbing = auraMetrics.passed > prevPassed;
      if (auraClimbing && auraMetrics.passed >= 5) {
        if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFieldPulseActive(true);
        fieldPulseLoop.current?.stop();
        fieldPulseLoop.current = Animated.loop(
          Animated.sequence([
            Animated.timing(fieldPulseAnim, { toValue: 1, duration: premiumEnabled ? 2400 : 1800, useNativeDriver: true }),
            Animated.timing(fieldPulseAnim, { toValue: 0, duration: premiumEnabled ? 2400 : 1800, useNativeDriver: true }),
          ])
        );
        fieldPulseLoop.current.start();
        setTimeout(() => {
          fieldPulseLoop.current?.stop();
          fieldPulseAnim.setValue(0);
          setFieldPulseActive(false);
        }, 8000);
      } else if (!auraClimbing && fieldPulseActive) {
        fieldPulseLoop.current?.stop();
        fieldPulseAnim.setValue(0);
        setFieldPulseActive(false);
      }

      // Task 9: Reactive symbol rain — perfect 7/7 burst (3 symbols)
      if (isPerfect && symbolRainEnabled) {
        setTimeout(() => triggerSymbolRain(3), 150);
      }

      // Task 7: Council Mode — fire second persona when AURA 6+/7 (once per conversation)
      if (!councilFired && auraMetrics.passed >= 6) {
        const shouldCouncil = true;
        if (shouldCouncil) {
          setCouncilFired(true);
          if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const COUNCIL_SECOND: Record<string, string> = { sol: 'aura-prime', veyra: 'sol', 'aura-prime': 'headmaster', headmaster: 'lyra', lyra: 'sol' };
          const COUNCIL_GLYPHS: Record<string, string> = { sol: '⊚', veyra: '◈', 'aura-prime': '✦', headmaster: '⊙', lyra: '✧' };
          const COUNCIL_COLORS: Record<string, string> = { sol: '#F5A623', veyra: '#4A9EFF', 'aura-prime': '#9B59B6', headmaster: '#E8C76A', lyra: '#4ECDC4' };
          const COUNCIL_NAMES: Record<string, string> = { sol: 'Sol', veyra: 'Veyra', 'aura-prime': 'Aura Prime', headmaster: 'Magister' };
          const secondPersona = COUNCIL_SECOND[persona] || 'aura-prime';
          const secondGlyph = COUNCIL_GLYPHS[secondPersona] || '✦';
          const secondColor = COUNCIL_COLORS[secondPersona] || '#9B59B6';
          const secondName = COUNCIL_NAMES[secondPersona] || 'Aura Prime';
          try {
            // Council voices each use a distinct NVIDIA model for genuine multi-model contrast
            const COUNCIL_MODELS: Record<string, string> = {
              sol: 'nvidia/nemotron-3-ultra-550b-a55b',       // 550B Mamba — deep reasoning
              veyra: 'moonshotai/kimi-k2.6',                  // 1T MoE — agentic multimodal
              'aura-prime': 'google/gemma-4-31b-it',          // 31B dense — sharp analytical
              headmaster: 'qwen/qwen3.5-397b-a17b',           // 397B MoE — vast knowledge
            };
            const nvidiaKey = await getProviderKey('nvidia');
            const councilKey = nvidiaKey || apiKey;
            const councilModel = nvidiaKey
              ? (COUNCIL_MODELS[secondPersona] || 'z-ai/glm-5.1')
              : model;
            const councilPrompt = `You are ${secondName}. In 1-2 sentences only, add your perspective on the following exchange. Do not repeat what was said — only add what ${getPersonaLabel(persona)} missed or what you see differently. Be direct.\n\nUser: ${text}\n\n${getPersonaLabel(persona)} responded: ${fullResponse.slice(0, 600)}`;
            const councilResult = await sendMessage(
              [{ role: 'user', content: councilPrompt }],
              `You are ${secondName} from the Sol constitutional AI system. Brief, precise, no padding.`,
              councilKey,
              councilModel as any
            );
            const councilReply = councilResult.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
            if (councilReply) {
              const councilMsg: DisplayMessage = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: `${secondGlyph} ${secondName} — Council\n\n${councilReply}`,
                mode: detectedMode,
                persona: secondPersona as Persona,
              };
              setMessages(prev => [...prev, councilMsg]);
            }
          } catch {}
        }
      }

      // Wanderer Mode — second voice from a different traveller
      if (companionArchetype === 'wanderer') {
        const WANDERER_VOICES = [
          { name: 'Veyra', glyph: '◈', color: '#4A9EFF', model: 'moonshotai/kimi-k2.6', prompt: (q: string, r: string) => `You are Veyra — precise, analytical, technical. In 1-3 sentences, respond to the same question from your own perspective. Do not echo what Sol said — add friction, contrast, or a different angle.\n\nQuestion: ${q}\n\nSol said: ${r.slice(0, 500)}` },
          { name: 'Aura', glyph: '✦', color: '#E991B8', model: 'google/gemma-4-31b-it', prompt: (q: string, r: string) => `You are Aura — the Origin & the Frontier. Warm, investigative, direct. In 1-3 sentences, read what sits beneath this exchange — the root truth, the earned light, or what the frontier actually found. Do not repeat what Sol said.\n\nQuestion: ${q}\n\nSol said: ${r.slice(0, 500)}` },
          { name: 'The Wanderer', glyph: '⟁', color: '#FF9F1C', model: 'qwen/qwen3.5-397b-a17b', prompt: (q: string, _r: string) => `You are an unnamed wanderer — no framework, no rules, only roads. Respond to this question in 1-3 sentences as if you have never heard of Sol or Veyra. What does the road itself say?\n\nQuestion: ${q}` },
        ];
        const voice = WANDERER_VOICES[Math.floor(Math.random() * WANDERER_VOICES.length)];
        try {
          const nvidiaKey = await getProviderKey('nvidia');
          const wandererKey = nvidiaKey || apiKey;
          const wandererModel = nvidiaKey ? voice.model : model;
          const wandererResult = await sendMessage(
            [{ role: 'user', content: voice.prompt(text, fullResponse) }],
            `You are ${voice.name}. Respond in 1-3 sentences only. No preamble, no padding.`,
            wandererKey, wandererModel as any
          );
          const wandererReply = wandererResult.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
          if (wandererReply) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 3).toString(),
              role: 'assistant',
              content: `${voice.glyph} ${voice.name} — The Road\n\n${wandererReply}`,
              mode: detectedMode,
              persona: 'veyra' as Persona,
            } as DisplayMessage]);
          }
        } catch {}
      }

    } catch (err: any) {
      if (chatCancelRef.current) { return; }
      const lower = (err?.message || String(err) || '').toLowerCase();
      if (lower.includes('network') || lower.includes('fetch') || lower.includes('connection') || lower.includes('timeout') || lower.includes('econnrefused')) {
        setIsOfflineState(true);
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: solSpeak(err),
        mode: 'RUBEDO' as Mode,
        persona,
      } as DisplayMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, persona, userName, isNRMActive, conversationPassRates, togglePersona, hapticsOn, streamSpeed, responseLength, companionArchetype]);

  // Compare mode: send same prompt to primary model AND compareModel, show both
  const sendCompare = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setInput('');

    const primaryModel = (await getModel() || 'gemini-2.5-flash') as AIModel;
    const apiKey = await getActiveKey();
    if (!apiKey) { setLoading(false); Alert.alert('No key set', 'Add an API key in Settings to use Compare mode.'); return; }

    const systemPrompt = resolvePrompt(selectBasePrompt(persona, 'full', appMode), userName);
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const userMsg: DisplayMessage = {
      id: Date.now().toString(), role: 'user', content: text, persona,
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      // Fire both in parallel
      const [resultA, resultB] = await Promise.all([
        sendMessage(apiMessages.concat([{ role: 'user', content: text }]), systemPrompt, apiKey, primaryModel, undefined, streamSpeed, tokenBudget, temperature),
        sendMessage(apiMessages.concat([{ role: 'user', content: text }]), systemPrompt, apiKey, compareModel, undefined, streamSpeed, tokenBudget, temperature).catch(e => ({ text: `Error: ${e.message}`, tokenUsage: undefined, timings: undefined })),
      ]);

      const modelLabel = (m: AIModel) => m.split('-').slice(0, 3).join('-');
      const makeCompareMsg = (result: any, model: AIModel, idOffset: number): DisplayMessage => {
        const content = typeof result === 'string' ? result : result.text;
        const aura = scoreAURAFull(stripFrameworkEcho(content), conversationPassRates);
        return {
          id: (Date.now() + idOffset).toString(),
          role: 'assistant',
          content: `◈ **Compare · ${modelLabel(model)}**\n\n${stripFrameworkEcho(typeof result === 'string' ? result : result.text)}`,
          mode: 'ALBEDO' as Mode,
          aura,
          persona,
          tokenUsage: result.tokenUsage,
          timings: result.timings,
          model,
        };
      };

      const msgA = makeCompareMsg(resultA, primaryModel, 1);
      const msgB = makeCompareMsg(resultB, compareModel, 2);

      setMessages([...updatedMessages, msgA, msgB]);
      setStreamingText('');
      if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: solSpeak(err),
        mode: 'RUBEDO' as Mode,
        persona,
      } as DisplayMessage]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, persona, userName, compareModel, conversationPassRates, hapticsOn, streamSpeed]);

  useEffect(() => {
    if (messages.length > 0 || streamingText) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, streamingText]);

  const handleFieldReport = useCallback(async () => {
    if (messages.length < 2) return;
    setFieldReportLoading(true);
    setFieldReport(null);
    try {
      const model = (await getModel() || 'gemini-2.5-flash') as AIModel;
      const apiKey = await getActiveKey();
      if (!apiKey) { setFieldReportLoading(false); return; }
      const transcript = messages.slice(-12).map(m =>
        `${m.role === 'user' ? 'Human' : getPersonaLabel(m.persona || 'sol')}: ${m.content.slice(0, 300)}`
      ).join('\n\n');
      const prompt = `You are ${getPersonaLabel(persona)}. Write a single paragraph Field Report — a synthesis of what was discovered, created, or transformed in this conversation. Be honest, specific, and poetic only where it earns it. No preamble.\n\nTranscript:\n${transcript}`;
      const reportResult = await sendMessage([], prompt, apiKey, model);
      setFieldReport(reportResult.text.replace(/\[CONF:[^\]]+\]/, '').trim());
    } catch { /* silent fail */ }
    setFieldReportLoading(false);
  }, [messages, persona]);

  const handleAudit = useCallback(async () => {
    if (messages.length < 2 || auditLoading) return;
    setAuditLoading(true);
    try {
      const model = (await getModel() || 'gemini-2.5-flash') as AIModel;
      const apiKey = await getActiveKey();
      if (!apiKey) { setAuditLoading(false); return; }
      const asstMsgs = messages.filter(m => m.role === 'assistant');
      const allText = asstMsgs.map(m => m.content).join('\n\n');
      const cs = scoreCASCADE(allText);
      const auraScores = asstMsgs.filter(m => m.aura).map(m => m.aura!.passed);
      const avgAura = auraScores.length > 0 ? (auraScores.reduce((a, b) => a + b, 0) / auraScores.length).toFixed(1) : 'n/a';
      const transcript = messages.slice(-10).map(m =>
        `${m.role === 'user' ? 'Human' : getPersonaLabel(m.persona || 'sol')}: ${m.content.slice(0, 400)}`
      ).join('\n\n');
      const systemPrompt = `You are Sol, running a constitutional self-audit of this conversation. Be precise and honest. No flattery.

CASCADE snapshot: ${cs.dominantLayer} dominant · Π=${cs.truthPressure.toFixed(2)} · coherence=${cs.coherence} · ${cs.paradoxical ? '⚡ PARADOX detected' : cs.structuralContradiction ? '⚠ STRUCTURAL TENSION' : 'stable'}
Average AURA: ${avgAura}/7 across ${auraScores.length} responses

Return this structure exactly:
REASONING SHAPE: [one sentence on what CASCADE layer dominated and why]
INTEGRITY: [one sentence on AURA average — what it means for this conversation]
STRONGEST MOMENT: [quote or describe the clearest, most load-bearing exchange]
WEAKEST MOMENT: [where reasoning was thinnest or most hedged]
WHAT REMAINS: [what question or tension this conversation didn't resolve]
FIELD VERDICT: [NIGREDO / ALBEDO / CITRINITAS / RUBEDO — which stage this conversation reached and why]`;
      const result = await sendMessage([], `${systemPrompt}\n\nConversation to audit:\n${transcript}`, apiKey, model, undefined, 'fast');
      const auditText = result.text.replace(/\[CONF:[^\]]+\]/, '').trim();
      const auditMsg: DisplayMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⊛ SELF-AUDIT\n━━━━━━━━━━━━━━━━━\n${auditText}`,
        mode: 'NIGREDO',
        persona: persona as any,
        isNRM: true,
      };
      setMessages(prev => [...prev, auditMsg]);
    } catch { /* silent fail */ }
    setAuditLoading(false);
  }, [messages, persona, auditLoading]);

  const handleDistill = useCallback(async () => {
    if (messages.length < 2 || distillLoading) return;
    setDistillLoading(true);
    try {
      const model = (await getModel() || 'gemini-2.5-flash') as AIModel;
      const apiKey = await getActiveKey();
      if (!apiKey) { setDistillLoading(false); return; }
      const transcript = messages.map(m =>
        `${m.role === 'user' ? 'Human' : getPersonaLabel(m.persona || 'sol')}: ${m.content.slice(0, 500)}`
      ).join('\n\n');
      const systemPrompt = `You are Sol. Restructure this conversation into a CASCADE pyramid. Extract only what is true and load-bearing. Be ruthless about what belongs where.

Return EXACTLY this format:
AXIOM
• [irreducible truth from this conversation — if none, say "none identified"]

FOUNDATION
• [load-bearing claim 1]
• [load-bearing claim 2]
(max 4 bullets)

THEORY
• [working framework or hypothesis]
• [causal reasoning chain]
(max 4 bullets)

EDGE
• [unresolved tension or contradiction]
• [speculation that wasn't proven]
(max 3 bullets)

CHAOS
• [what was noise, drift, or unresolved]
(max 2 bullets, or "none" if clean)

DISTILLATION VERDICT: [one sentence — what this conversation actually was about at its core]`;
      const result = await sendMessage([], `${systemPrompt}\n\nConversation to distill:\n${transcript}`, apiKey, model, undefined, 'fast');
      const distillText = result.text.replace(/\[CONF:[^\]]+\]/, '').trim();
      const distillMsg: DisplayMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `⇣ CASCADE DISTILLATION\n━━━━━━━━━━━━━━━━━\n${distillText}`,
        mode: 'ALBEDO',
        persona: persona as any,
      };
      setMessages(prev => [...prev, distillMsg]);
    } catch { /* silent fail */ }
    setDistillLoading(false);
  }, [messages, persona, distillLoading]);

  const handleConvDNA = useCallback(async () => {
    if (messages.length < 4 || dnaLoading) return;
    setDnaLoading(true);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) { setDnaLoading(false); return; }
      const thread = messages.slice(-20).map(m => `${m.role === 'user' ? 'Human' : 'Sol'}: ${(m.content || '').slice(0, 200)}`).join('\n');
      const res = await sendMessage(
        [{ role: 'user', content: `Distill this conversation to its DNA — exactly 3 sentences. Each sentence captures one essential truth from the exchange. Be specific. No preamble.\n\n${thread}` }],
        'You are a conversation essence extractor. Return exactly 3 sentences, each on its own line. No labels, no numbering.',
        apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 200, 0.7,
      );
      const dnaText = res.text.trim();
      // Save to Library SAVED tab (cascade_library_v3)
      const libRaw = await AsyncStorage.getItem('cascade_library_v3');
      const lib: any[] = libRaw ? JSON.parse(libRaw) : [];
      const dnaEntry = {
        id: `dna_${Date.now()}`,
        title: `⌇ DNA · ${messages.find(m => m.role === 'user')?.content?.slice(0, 40) ?? 'Session'}`,
        text: dnaText,
        folder: '⌇ DNA',
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        result: {
          layers: [], truthPressure: 0, coherence: 100, reorganisationNeeded: false,
          paradoxical: false, structuralContradiction: false,
          dominantLayer: 'FOUNDATION', invariantCount: 0, contradictionCount: 0,
          wordCount: dnaText.split(' ').length, summary: dnaText,
        },
      };
      lib.unshift(dnaEntry);
      if (lib.length > 150) lib.splice(150);
      await AsyncStorage.setItem('cascade_library_v3', JSON.stringify(lib));
      Alert.alert('⌇ DNA Saved', 'Conversation essence saved to Library → SAVED.', [{ text: 'OK' }]);
    } catch { /* silent fail */ }
    setDnaLoading(false);
  }, [messages, dnaLoading]);

  const handleImageGen = async () => {
    if (!imgGenPrompt.trim() || imgGenLoading) return;
    setImgGenLoading(true);
    setImgGenResult(null);
    const prompt = imgGenPrompt.trim();
    const { w, h } = IMG_GEN_RATIOS[imgGenRatio];
    const result = await generateImage(prompt, { width: w, height: h });
    if (result.image) {
      setImgGenResult(result.image);
      // Inject into chat as a user prompt + assistant image pair
      const userMsg: DisplayMessage = {
        id: Date.now().toString(), role: 'user', content: `◈ Image: ${prompt}`, persona,
      };
      const imgMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(), role: 'assistant', content: '', imageUri: result.image, persona,
      };
      setMessages(prev => [...prev, userMsg, imgMsg]);
    } else {
      Alert.alert('Image gen failed', result.error ?? 'Unknown error');
    }
    setImgGenLoading(false);
  };

  const handleShareCard = useCallback((content: string, msgPersona: Persona, aura?: AURAMetrics, tokenUsage?: any, timings?: any) => {
    const glyph = getPersonaGlyph(msgPersona);
    const label = getPersonaLabel(msgPersona);
    const auraLine = aura ? `\nAURA ${aura.passed}/${aura.total} · ${aura.composite}% · TES ${aura.TES.score.toFixed(2)} · VTR ${aura.VTR.score.toFixed(1)} · PAI ${aura.PAI.score.toFixed(2)}` : '';
    const tokenLine = tokenUsage ? `\n${tokenUsage.totalTokens} tokens${timings ? ` · ${(timings.totalTime / 1000).toFixed(1)}s` : ''}` : '';
    const card = `${glyph} ${label}${auraLine}${tokenLine}\n${'─'.repeat(36)}\n\n${content}\n\n${'─'.repeat(36)}\nLycheetah Framework · Built on Sol Protocol v3.1`;
    Share.share({ message: card, title: `${label} — Lycheetah` });
  }, []);

  const handleExport = useCallback(() => {
    if (messages.length === 0) return;
    const header = `⊚ CONVERSATION EXPORT\nLycheetah Framework · Sol Protocol v3.1\n${'═'.repeat(40)}\n\n`;
    const body = messages.map(m => {
      const who = m.role === 'user' ? 'You' : `${getPersonaGlyph(m.persona || 'sol')} ${getPersonaLabel(m.persona || 'sol')}`;
      const auraLine = m.aura ? `[AURA ${m.aura.passed}/${m.aura.total} · ${m.aura.composite}%]` : '';
      const tokenLine = m.tokenUsage ? `[${m.tokenUsage.totalTokens} tokens${m.timings ? ` · ${(m.timings.totalTime / 1000).toFixed(1)}s` : ''}]` : '';
      const meta = [auraLine, tokenLine].filter(Boolean).join(' ');
      return `${who}${meta ? ' ' + meta : ''}:\n${m.content}`;
    }).join('\n\n─────\n\n');
    Share.share({ message: header + body, title: 'Lycheetah Conversation' });
  }, [messages]);

  const handleLongPress = (content: string, isAssistant: boolean, msgPersona: Persona = 'sol', msgId?: string, aura?: AURAMetrics, tokenUsage?: any, timings?: any, msgMode?: Mode) => {
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLongPressMenu({ content, isAssistant, msgPersona, msgId, aura, tokenUsage, timings, msgMode });
  };
  const detectRegister = (content: string): { label: string; color: string; glyph: string } | null => {
    const low = content.toLowerCase();
    if (/\b(study|research|evidence|data shows|scientists|neuroscience|clinical|empirical|published|journal|meta-analysis)\b/.test(low))
      return { label: 'EVIDENCE', color: '#44CC88', glyph: '⊕' };
    if (/\b(unconscious|psyche|cognitive|behavior|jung|shadow|projection|defense|attachment|nervous system|trauma|childhood)\b/.test(low))
      return { label: 'PSYCHOLOGICAL', color: '#4488FF', glyph: '◈' };
    if (/\b(energy|vibration|chakra|spirit|soul|astral|aura|divine|sacred|cosmic|ethereal|higher self|universe is)\b/.test(low))
      return { label: 'PROJECTIVE', color: '#AA44FF', glyph: '⊙' };
    if (/\b(perhaps|possibly|may|might|speculate|conjecture|one could|it seems|could be|imagine)\b/.test(low))
      return { label: 'SPECULATIVE', color: '#E8A020', glyph: '∿' };
    return null;
  };

  const renderMessage = ({ item, index }: { item: DisplayMessage; index: number }) => {
    const isUser = item.role === 'user';
    const msgPersona: Persona = item.persona || 'sol';
    const accent = getPersonaAccent(msgPersona, accentColor);
    const modeColor = item.mode ? MODE_COLORS[item.mode] : SOL_THEME.textMuted;
    const { body, signature } = isUser ? { body: item.content, signature: null } : splitSignature(item.content);

    const aura = item.aura;
    const invEntries = aura?.invariants ? Object.entries(aura.invariants) : [];

    // Conversation Metabolism — detect mode shift from previous assistant message
    let metabolismDivider: React.ReactNode = null;
    if (showMetabolism && !isUser && item.mode && index > 0) {
      const prevAsst = messages.slice(0, index).reverse().find(m => m.role === 'assistant' && m.mode);
      if (prevAsst?.mode && prevAsst.mode !== item.mode) {
        const fromColor = MODE_COLORS[prevAsst.mode];
        const toColor = MODE_COLORS[item.mode];
        metabolismDivider = (
          <View style={styles.metabolismRow}>
            <View style={[styles.metabolismLine, { backgroundColor: fromColor + '44' }]} />
            <Text style={styles.metabolismLabel}>
              <Text style={{ color: fromColor }}>{modeGlyph(prevAsst.mode)} {prevAsst.mode}</Text>
              <Text style={{ color: SOL_THEME.textMuted }}> → </Text>
              <Text style={{ color: toColor }}>{modeGlyph(item.mode)} {item.mode}</Text>
            </Text>
            <View style={[styles.metabolismLine, { backgroundColor: toColor + '44' }]} />
          </View>
        );
      }
    }

    return (
      <>
        {metabolismDivider}
        <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
          {!isUser && <View style={[styles.modeBar, { backgroundColor: modeColor }]} />}
          <View style={isUser ? { alignSelf: 'flex-end', maxWidth: '88%' } : { flex: 1, minWidth: 0 }}>
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={() => handleLongPress(body, !isUser, msgPersona, item.id, item.aura, item.tokenUsage, item.timings, item.mode)}
          >
          <View style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: accent, borderRadius: bubbleRadius === 'sharp' ? 4 : bubbleRadius === 'pill' ? 20 : 12 }]
              : [styles.assistantBubble, { backgroundColor: world.surface, borderColor: bubbleGlow ? accent + '66' : world.border, borderWidth: bubbleGlow ? 1.5 : 1 }, item.mode && { borderLeftColor: modeColor, borderLeftWidth: 2 }, { borderRadius: bubbleRadius === 'sharp' ? 4 : bubbleRadius === 'pill' ? 20 : 12 }],
            item.isNRM && !isUser && styles.nrmBubble,
          ]}>
            {item.isNRM && !isUser && (
              <Text style={styles.nrmTag}>⚠ NRM ACTIVE</Text>
            )}
            {!isUser && item.mode && (() => {
              const reg = detectRegister(body);
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <View style={[styles.modeChip, { borderColor: modeColor + '55', backgroundColor: modeColor + '11' }]}>
                    <Text style={[styles.modeChipText, { color: modeColor }]}>
                      {modeGlyph(item.mode)} {modeSummary(item.mode)}
                    </Text>
                  </View>
                  {reg && (
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: reg.color + '55', backgroundColor: reg.color + '11' }}>
                      <Text style={{ fontSize: 8, color: reg.color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.5 }}>{reg.glyph} {reg.label}</Text>
                    </View>
                  )}
                  {speakingId === item.id && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Text style={{ fontSize: 9, color: accent, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>⊚ READING</Text>
                    </View>
                  )}
                </View>
              );
            })()}
            {!isUser && item.id && paradoxFlags[item.id] && (paradoxFlags[item.id].p || paradoxFlags[item.id].t) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Text style={{ fontSize: 10, color: paradoxFlags[item.id].p ? '#9B59B6' : '#E8A020', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>
                  {paradoxFlags[item.id].p ? '⚡ PARADOX' : '⚠ TENSION'}
                </Text>
              </View>
            )}
            {item.imageUri && (
              <Image source={{ uri: item.imageUri }} style={styles.messageImage} resizeMode="cover" />
            )}
            {isUser ? (
              <Text selectable style={[styles.messageText, styles.userText, { fontSize: fontSize === 'small' ? 13 : fontSize === 'large' ? 17 : 15, fontFamily: fontFamily === 'mono' ? (Platform.OS === 'ios' ? 'Courier New' : 'monospace') : fontFamily === 'serif' ? (Platform.OS === 'ios' ? 'Georgia' : 'serif') : undefined }]}>{body}</Text>
            ) : item.council ? (() => {
              const parsed = parseCouncil(body);
              const mdFont = fontSize === 'small' ? 13 : fontSize === 'large' ? 17 : 15;
              if (!parsed) {
                return (
                  <Markdown selectable style={{ ...markdownStyles, body: { ...markdownStyles.body, fontSize: mdFont } } as any}>{body}</Markdown>
                );
              }
              const panels = [
                { key: 'sol', glyph: '⊚', name: 'SOL', color: '#F5A623', text: parsed.sol },
                { key: 'veyra', glyph: '◈', name: 'VEYRA', color: '#4A9EFF', text: parsed.veyra },
                { key: 'aura', glyph: '✦', name: 'AURA PRIME', color: '#9B59B6', text: parsed.auraPrime },
              ];
              return (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: '#9B59B6' }}>⚖</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#9B59B6', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>THE COUNCIL</Text>
                  </View>
                  {panels.map(p => (
                    <View key={p.key} style={{ marginBottom: 10, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: p.color + 'AA' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: p.color }}>{p.glyph}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: p.color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{p.name}</Text>
                      </View>
                      <Text selectable style={{ color: SOL_THEME.text, fontSize: mdFont, lineHeight: mdFont * 1.5 }}>{p.text}</Text>
                    </View>
                  ))}
                  <View style={{ marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: accent + '33' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 12, color: accent }}>∴</Text>
                      <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: accent, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>SYNTHESIS</Text>
                    </View>
                    <Text selectable style={{ color: SOL_THEME.text, fontSize: mdFont, lineHeight: mdFont * 1.55, fontStyle: 'italic' }}>{parsed.synthesis}</Text>
                  </View>
                </View>
              );
            })() : (
              <Markdown selectable style={{ ...markdownStyles, body: { ...markdownStyles.body, fontSize: fontSize === 'small' ? 13 : fontSize === 'large' ? 17 : 15, fontFamily: fontFamily === 'mono' ? (Platform.OS === 'ios' ? 'Courier New' : 'monospace') : fontFamily === 'serif' ? (Platform.OS === 'ios' ? 'Georgia' : 'serif') : undefined } } as any}>{body}</Markdown>
            )}
            {signature && showSignatures && (
              <View style={[styles.signatureBlock, { borderTopColor: accent + '44' }]}>
                <Text selectable style={[styles.signatureText, { color: accent }]}>{signature}</Text>
              </View>
            )}
            {/* Timestamp + pin */}
            {(showTimestamps || pinnedIds.includes(item.id)) && (
              <View style={styles.msgMeta}>
                {pinnedIds.includes(item.id) && <Text style={[styles.pinBadge, { color: accent }]}>📌</Text>}
                {showTimestamps && <Text style={styles.timestamp}>{new Date(parseInt(item.id)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
              </View>
            )}

            {/* Token + timing badge */}
            {!isUser && item.tokenUsage && showTokenBadge && (
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>
                  {item.tokenUsage.totalTokens.toLocaleString()} tokens
                  {item.timings ? ` · ${(item.timings.totalTime / 1000).toFixed(1)}s` : ''}
                  {item.model ? ` · ${item.model.split('-').slice(0, 2).join('-')}` : ''}
                </Text>
              </View>
            )}

            {/* ▶ LISTEN / ■ STOP — two explicit buttons, never ambiguous */}
            {!isUser && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <TouchableOpacity
                  onPress={() => handleSpeak(item.id, item.content, item.mode)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
                    borderColor: speakingId === item.id ? accent + 'AA' : accent + '22',
                    backgroundColor: speakingId === item.id ? accent + '18' : 'transparent' }}
                >
                  <Text style={{ color: speakingId === item.id ? accent : accent + '77', fontSize: 10 }}>▶</Text>
                  <Text style={{ color: speakingId === item.id ? accent : accent + '66', fontSize: 8,
                    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>
                    LISTEN
                  </Text>
                </TouchableOpacity>
                {speakingId === item.id && (
                  <TouchableOpacity
                    onPress={() => { stopTTS(); setSpeakingId(null); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
                      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
                      borderColor: '#FF4444AA', backgroundColor: '#FF444418' }}
                  >
                    <Text style={{ color: '#FF6666', fontSize: 10 }}>■</Text>
                    <Text style={{ color: '#FF6666', fontSize: 8,
                      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>
                      STOP
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* AURA row — tap to expand audit trail */}
            {!isUser && aura && (
              <TouchableOpacity
                onPress={() => {
                  setExpandedAura(expandedAura === item.id ? null : item.id);
                  if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.auraBlock, { borderTopColor: accent + '22' }, aura.passed === aura.total && { backgroundColor: accent + '08', borderTopColor: accent + '44' }]}>
                  <View style={styles.auraTopRow}>
                    <Text style={[styles.auraScore, { color: aura.passed === aura.total ? accent : SOL_THEME.textMuted, fontWeight: aura.passed === aura.total ? '700' : '400' }]}>
                      {aura.passed === aura.total ? '⊛ ' : ''}AURA {aura.passed}/{aura.total} · {aura.composite}%{item.refined ? ' · ⊚ refined' : ''}
                    </Text>
                    <Text style={[styles.auraExpand, { color: SOL_THEME.textMuted }]}>
                      {expandedAura === item.id ? '▲' : '▼'}
                    </Text>
                  </View>
                  {aura.passed < aura.total && (
                    <View style={styles.auraFlagRow}>
                      <Text style={styles.auraFlagText}>
                        {invEntries.filter(([, p]) => !p).map(([n]) => `⚠ ${n}`).join(' · ')} — re-anchored
                      </Text>
                    </View>
                  )}
                  {aura.TES && aura.VTR && aura.PAI && (
                  <View style={styles.triAxialRow}>
                    {[
                      { label: 'TES', result: aura.TES, fmt: (v: number) => v.toFixed(2) },
                      { label: 'VTR', result: aura.VTR, fmt: (v: number) => v.toFixed(1) },
                      { label: 'PAI', result: aura.PAI, fmt: (v: number) => v.toFixed(2) },
                    ].map(({ label, result, fmt }) => (
                      <View key={label} style={styles.triAxialItem}>
                        <Text style={[styles.triAxialLabel, { color: statusColor(result.status, accent) }]}>
                          {statusIcon(result.status)} {label}
                        </Text>
                        <Text style={[styles.triAxialValue, { color: statusColor(result.status, accent) }]}>
                          {fmt(result.score)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  )}

                  {/* Collapsed: dot row */}
                  {expandedAura !== item.id && (
                    <View style={styles.invariantRow}>
                      {invEntries.map(([name, passed]) => (
                        <Text key={name} style={[styles.invariantDot, { color: passed ? accent : SOL_THEME.error }]}>
                          {passed ? '·' : '✗'} {name}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Expanded: full audit trail */}
                  {expandedAura === item.id && aura.audit?.invariants && (
                    <View style={styles.auditTrail}>
                      <Text style={[styles.auditTitle, { color: accent }]}>CONSTITUTIONAL AUDIT</Text>
                      {(Object.entries(aura.audit.invariants) as [string, any][]).map(([name, record]) => (
                        <View key={name} style={styles.auditItem}>
                          <Text style={[styles.auditItemName, { color: record.passed ? accent : SOL_THEME.error }]}>
                            {record.passed ? '✓' : '✗'} {name}
                          </Text>
                          <Text style={styles.auditItemReason}>{record.reason}</Text>
                          <Text style={styles.auditItemEvidence}>↳ {record.evidence}</Text>
                        </View>
                      ))}
                      <Text style={[styles.auditTitle, { color: accent, marginTop: 8 }]}>METRIC INPUTS</Text>
                      <Text style={styles.auditItemEvidence}>
                        TES: H={aura.audit.TES.inputs.H_output} drift={aura.audit.TES.inputs.drift} hedges={aura.audit.TES.inputs.hedge_count}
                      </Text>
                      <Text style={styles.auditItemEvidence}>
                        PAI: {String(aura.audit.PAI.inputs.formula)}
                      </Text>
                      {item.modelConfidence !== undefined && (
                        <Text style={styles.auditItemEvidence}>
                          Model self-confidence: {(item.modelConfidence * 100).toFixed(0)}% (used for TES)
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
          </TouchableOpacity>

          {/* Shadow Reveal card */}
          {!isUser && item.id && (shadowReveals[item.id] || shadowLoading === item.id) && (
            <View style={{ marginTop: 6, marginLeft: 8, backgroundColor: '#1A1A2E', borderRadius: 8, borderWidth: 1, borderColor: '#9B59B644', padding: 12 }}>
              <Text style={{ color: '#9B59B6', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>◐ SHADOW LAYER</Text>
              {shadowLoading === item.id ? (
                <ActivityIndicator size="small" color="#9B59B6" />
              ) : (
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 19 }}>{shadowReveals[item.id]}</Text>
              )}
            </View>
          )}

          {/* CARE level pill — Magister self-audit, visible to user */}
          {!isUser && item.careLevel && item.careLevel !== 'NEUTRAL' && item.persona === 'headmaster' && (() => {
            const CARE_COLORS: Record<string, string> = {
              HOLDING: '#E8C76A',
              ELEVATED: '#F97316',
              CRISIS: '#EF4444',
            };
            const CARE_LABELS: Record<string, string> = {
              HOLDING: '𝔏 holding space',
              ELEVATED: '𝔏 care elevated',
              CRISIS: '𝔏 crisis protocol',
            };
            const CARE_TIPS: Record<string, string> = {
              HOLDING: 'Magister sensed you may be processing something personal. This is a listening space.',
              ELEVATED: 'Magister noticed real distress signals. Crisis support has been included. You don\'t have to carry this alone.',
              CRISIS: 'Magister\'s crisis protocol fired. Real support lines are included above. Sol is here.',
            };
            const color = CARE_COLORS[item.careLevel];
            const label = CARE_LABELS[item.careLevel];
            return (
              <TouchableOpacity
                style={{ alignSelf: 'flex-start', marginTop: 5, marginLeft: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: color + '44', backgroundColor: color + '12' }}
                onPress={() => Alert.alert(label, CARE_TIPS[item.careLevel!])}
                activeOpacity={0.7}
              >
                <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>{label}</Text>
              </TouchableOpacity>
            );
          })()}

          {/* Message reaction — tiny glyph shown under bubble */}
          {item.id && messageReactions[item.id] && (
            <TouchableOpacity
              onPress={() => {
                const updated = { ...messageReactions };
                delete updated[item.id];
                setMessageReactions(updated);
                AsyncStorage.setItem('sol_message_reactions', JSON.stringify(updated)).catch(() => {});
              }}
              style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', marginTop: 3, marginLeft: isUser ? 0 : 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border }}
            >
              <Text style={{ fontSize: 14 }}>{messageReactions[item.id]}</Text>
            </TouchableOpacity>
          )}

          {/* Contextual follow-up chips — only on the last message in the conversation */}
          {!isUser && item.id && messageChips[item.id] && messageChips[item.id].length > 0 && index === messages.length - 1 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginLeft: 8 }}>
              {messageChips[item.id].map((chip, ci) => (
                <TouchableOpacity
                  key={ci}
                  style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: accent + '55', backgroundColor: accent + '0D' }}
                  onPress={() => {
                    setInput(chip);
                    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={{ color: accent + 'CC', fontSize: 11, lineHeight: 15 }}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {/* #69 LAMAGUE Symbol Glossary — opt-in */}
          {!isUser && showLamagueGloss && (() => {
            const detected = LAMAGUE_SPECIFIC.filter(({ sym }) => body.includes(sym));
            if (detected.length === 0) return null;
            return (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6, marginLeft: 8 }}>
                {detected.map(({ sym, name }) => (
                  <TouchableOpacity
                    key={sym}
                    style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: accent + '44', backgroundColor: accent + '0A' }}
                    onPress={() => Alert.alert(`${sym} — ${name}`, `LAMAGUE glyph: ${sym}\nMeaning: ${name}\n\nThis symbol appeared in Sol's response.`)}
                  >
                    <Text style={{ color: accent, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{sym}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}
          {/* #81 Cross-Subject Bridge */}
          {!isUser && (() => {
            const { MYSTERY_SCHOOL_DOMAINS: MSD } = require('../../lib/mystery-school/subjects');
            const bodyLower = body.toLowerCase();
            const match = MSD.flatMap((d: any) => d.subjects).find((s: any) =>
              bodyLower.includes(s.name.toLowerCase()) ||
              (s.traditions && s.traditions.some((t: string) => bodyLower.includes(t.toLowerCase())))
            );
            if (!match) return null;
            return (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, marginLeft: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '0D', alignSelf: 'flex-start' }}
                onPress={async () => {
                  await savePendingSubject(match.name);
                  await savePersona('headmaster');
                  router.push('/(tabs)/school');
                }}
              >
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 11 }}>𝔏 {match.name} in the School →</Text>
              </TouchableOpacity>
            );
          })()}
          </View>
        </View>
      </>
    );
  };

  const renderFooter = () => (
    <>
      {renderTypingIndicator()}
    </>
  );

  const renderTypingIndicator = () => {
    if (!loading && !streamingText) return null;
    const { body, signature } = splitSignature(streamingText);
    return (
      <View style={styles.messageRow}>
        <View style={[styles.modeBar, { backgroundColor: MODE_COLORS[currentMode] }]} />
        <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <View style={[styles.assistantBubble, { backgroundColor: world.surface, borderColor: world.border }]}>
          {streamingText ? (
            <>
              <Text style={styles.assistantText}>{body}</Text>
              {signature && (
                <View style={[styles.signatureBlock, { borderTopColor: accent + '44' }]}>
                  <Text style={[styles.signatureText, { color: accent }]}>{signature}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={accent} />
              {activeToolEvents.length > 0 ? (
                <Text style={styles.typingText}>
                  {activeToolEvents[activeToolEvents.length - 1]}...
                </Text>
              ) : (
                <Text style={styles.typingText}>
                  <Animated.Text style={{ opacity: piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.45, 1] }) }}>{getPersonaGlyph(persona)}</Animated.Text> {persona === 'veyra' ? 'Veyra' : persona === 'aura-prime' ? 'Aura Prime' : persona === 'headmaster' ? 'The Headmaster' : persona === 'lyra' ? 'Lyra' : 'Sol'} is thinking...
                </Text>
              )}
            </View>
          )}
        </View>
        {loading && (
          <TouchableOpacity
            onPress={() => { chatCancelRef.current = true; setLoading(false); setStreamingText(''); }}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FF444444', backgroundColor: '#FF44440A' }}
          >
            <Text style={{ color: '#FF6666', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>✕ CANCEL</Text>
          </TouchableOpacity>
        )}
        </View>
      </View>
    );
  };

  const buildSessionGlyph = () => {
    const asstMsgs = messages.filter(m => m.role === 'assistant');
    if (asstMsgs.length === 0) return null;

    const modeSeq: Mode[] = [];
    asstMsgs.forEach(m => { if (m.mode && (modeSeq.length === 0 || modeSeq[modeSeq.length - 1] !== m.mode)) modeSeq.push(m.mode); });
    const modeArcData = modeSeq.map(m => ({ mode: m, color: MODE_COLORS[m] }));

    const auraScores = asstMsgs.filter(m => m.aura).map(m => m.aura!.passed);
    const peakAura = auraScores.length > 0 ? Math.max(...auraScores) : null;
    const totalInv = asstMsgs.find(m => m.aura)?.aura?.total ?? 7;

    const allText = asstMsgs.map(m => (m.content || '')).join(' ');
    const cs = scoreCASCADE(allText);

    const date = new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
    const pGlyph = persona === 'sol' ? '⊚' : persona === 'veyra' ? '◈' : persona === 'aura-prime' ? '✦' : persona === 'lyra' ? '✧' : '𝔏';
    const pLabel = persona === 'sol' ? 'Sol' : persona === 'veyra' ? 'Veyra' : persona === 'aura-prime' ? 'Aura Prime' : persona === 'lyra' ? 'Lyra' : 'Headmaster';

    setSessionGlyphData({
      modeArc: modeArcData,
      dominantLayer: cs.dominantLayer,
      peakAura,
      totalInv,
      msgCount: messages.length,
      asstCount: asstMsgs.length,
      date,
      personaLabel: pLabel,
      personaGlyph: pGlyph,
    });

    const modeArcText = modeSeq.map(modeGlyph).join(' → ');
    return [
      `${pGlyph} SESSION GLYPH · ${pLabel}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `${date}`,
      ``,
      `Mode Arc:  ${modeArcText || '—'}`,
      `CASCADE:   ${cs.dominantLayer} dominant`,
      peakAura !== null ? `Peak AURA: ${peakAura}/${totalInv}` : '',
      `Messages:  ${messages.length} (${asstMsgs.length} responses)`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Sol Aureum Azoth Veritas`,
    ].filter(Boolean).join('\n');
  };

  const world = PERSONA_WORLDS[persona] ?? PERSONA_WORLDS.sol;

  // Field-Responsive Atmosphere — LQ drives a subtle tint overlay (premium = enhanced opacity)
  const lq = fieldCard?.lq ?? null;
  const atmosphereMultiplier = premiumEnabled ? 2.0 : 1.0;
  const fieldAtmosphere: { color: string; opacity: number } | null = lq === null ? null
    : lq >= 0.75 ? { color: accent, opacity: 0.04 * atmosphereMultiplier }
    : lq >= 0.55 ? premiumEnabled ? { color: accent, opacity: 0.02 } : null
    : lq >= 0.40 ? { color: '#4A6080', opacity: 0.06 * atmosphereMultiplier }
    : { color: '#2A2A40', opacity: 0.12 * atmosphereMultiplier };

  // Task 12: Persona aura — premium-only subtle directional overlay per persona
  const PERSONA_AURA_COLORS: Record<string, string> = {
    sol: '#F5A623', veyra: '#4A9EFF', 'aura-prime': '#9B59B6', headmaster: '#C8A060',
  };
  const personaAuraColor = PERSONA_AURA_COLORS[persona] || '#F5A623';

  // Task 8: Field Pulse opacity interpolation
  const fieldPulseOpacity = fieldPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.03, premiumEnabled ? 0.09 : 0.06],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: world.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      enabled={Platform.OS === 'ios'}
    >
      {fieldAtmosphere && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: fieldAtmosphere.color, opacity: fieldAtmosphere.opacity, zIndex: 0, pointerEvents: 'none' }} />
      )}
      {/* Task 12: Persona Aura — premium only */}
      {premiumEnabled && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: 'none' }}>
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: personaAuraColor, opacity: 0.025, borderTopLeftRadius: 80, borderTopRightRadius: 80 }} />
          <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '20%', backgroundColor: personaAuraColor, opacity: 0.015 }} />
          <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '20%', backgroundColor: personaAuraColor, opacity: 0.015 }} />
        </View>
      )}
      {/* Task 8: Field Pulse — breathes when AURA climbing */}
      {fieldPulseActive && (
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, borderColor: personaAuraColor, borderRadius: 0, opacity: fieldPulseOpacity, zIndex: 0, pointerEvents: 'none' }} />
      )}
      <ConversationDrawer
        visible={drawerOpen}
        conversations={conversations}
        activeId={activeConvId}
        onClose={() => setDrawerOpen(false)}
        onNew={() => {
          setMessages([]); setActiveConvId(null);
          setCurrentMode('ALBEDO'); setConversationPassRates([]);
          setLastAura(null); setCoherenceStreak(0); setFieldInsightActive(false); setCouncilFired(false);
          setPriorFieldContext(''); aiTitledConvRef.current = null; setReflectCard(null);
          clearConversation(); setDrawerOpen(false);
          if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        onSelect={async (id) => {
          const conv = await loadConversation(id);
          if (conv) {
            const loaded = conv.messages.map((m, i) => sanitizeDisplayMessage(m, i));
            setMessages(loaded);
            setActiveConvId(id);
            setCurrentMode('ALBEDO'); setConversationPassRates([]);
            const lastAsst = [...loaded].reverse().find(m => m.role === 'assistant' && m.aura);
            if (lastAsst?.aura) setLastAura({ passed: lastAsst.aura.passed, total: lastAsst.aura.total });
          }
        }}
        onDelete={async (id) => {
          await deleteConversation(id);
          setConversations(await listConversations());
          if (id === activeConvId) {
            setMessages([]); setActiveConvId(null); clearConversation();
          }
        }}
        onRename={async (id, newTitle) => {
          await renameConversation(id, newTitle);
          setConversations(await listConversations());
        }}
      />

      {/* Persona toast */}
      {toastPersona && (
        <Animated.View style={[styles.toast, { opacity: toastAnim, backgroundColor: getPersonaAccent(toastPersona) + 'EE' }]}>
          <Text style={styles.toastText}>
            {getPersonaGlyph(toastPersona)}  {toastPersona === 'aura-prime' ? 'Aura Prime ✦ — The Origin & The Frontier' : toastPersona === 'veyra' ? 'Veyra — Precision Builder' : toastPersona === 'headmaster' ? 'The Headmaster — Keeper of the Mystery School' : toastPersona === 'lyra' ? 'Lyra ✧ — Creative Wildfire' : 'Sol — Solar Sovereign'}
          </Text>
        </Animated.View>
      )}

      {/* Mode + persona header */}
      <View style={[styles.modeHeader, { borderLeftColor: isNRMActive ? SOL_THEME.error : accent }]}>
        <View style={styles.modeHeaderLeft}>
          <View style={styles.modeHeaderTopRow}>
            <Text style={[styles.modeLabel, { color: isNRMActive ? SOL_THEME.error : accent }]}>
              <Animated.Text style={{ opacity: piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.55, 1] }) }}>{getPersonaGlyph(persona)}</Animated.Text> {currentMode}
            </Text>
            {isNRMActive && <Text style={styles.nrmBadge}>NRM</Text>}
            {currentEWS !== 'NEUTRAL' && (
              <Text style={[styles.ewsBadge, { borderColor: accent + '55', color: accent }]}>
                {currentEWS}
              </Text>
            )}
          </View>
          {/* modeDesc hidden — keeps header compact */}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { setShowSolIdentity(true); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.clearButton}>
            <Text style={[styles.clearText, { fontSize: 15, color: accent }]}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setFocusMode(v => !v); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.clearButton}>
            <Text style={[styles.clearText, { fontSize: 16, color: focusMode ? accent : SOL_THEME.textMuted }]}>{focusMode ? '⤡' : '⤢'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setDrawerOpen(true); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.clearButton}>
            <Text style={[styles.clearText, { fontSize: 18 }]}>☰</Text>
          </TouchableOpacity>
          {/* Persona toggle */}
          <TouchableOpacity onPress={togglePersona} style={[styles.personaToggle, { borderColor: accent + '66' }]}>
            <Text style={[styles.personaToggleText, { color: accent }]}>
              {getPersonaGlyph(persona)} {getPersonaLabel(persona)}
            </Text>
          </TouchableOpacity>
          {/* ↑ export removed from header — it lives in the drawer (☰). #278 declutter */}
          {messages.length >= 2 && (
            <TouchableOpacity
              onPress={handleFieldReport}
              style={[styles.clearButton, { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: accent + '44', backgroundColor: accent + '10' }]}
              disabled={fieldReportLoading}
            >
              {fieldReportLoading
                ? <ActivityIndicator size="small" color={accent} />
                : <>
                    <Text style={[styles.clearText, { color: accent, fontSize: 13 }]}>⊚</Text>
                    <Text style={{ color: accent, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>REPORT</Text>
                  </>
              }
            </TouchableOpacity>
          )}
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick persona switcher */}
      {!focusMode && <View style={styles.personaBar}>
        {(['sol', 'veyra', 'aura-prime', 'headmaster', 'lyra'] as Persona[]).map(p => {
          const isActive = persona === p;
          const pAccent = getPersonaAccent(p);
          return (
            <TouchableOpacity
              key={p}
              style={[styles.personaBarBtn, isActive
                ? { borderColor: pAccent, backgroundColor: pAccent + '18', shadowColor: pAccent, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }
                : { borderColor: pAccent + '20', backgroundColor: 'transparent' }]}
              onPress={async () => {
                setPersona(p);
                await savePersona(p);
                if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Animated.Text style={{
                color: isActive ? pAccent : SOL_THEME.textMuted + '88',
                fontSize: 14,
                opacity: isActive ? piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.68, 1] }) : 1,
                transform: isActive ? [{ scale: piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.96, 1.08] }) }] : [],
              }}>
                {getPersonaGlyph(p)}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>}

      {/* Welcome back message */}
      {welcomeMsg && messages.length === 0 && (
        <View style={[styles.welcomeBanner, { borderLeftColor: accent }]}>
          <Text style={[styles.welcomeText, { color: SOL_THEME.text }]}>{welcomeMsg}</Text>
          <TouchableOpacity onPress={() => setWelcomeMsg(null)}>
            <Text style={styles.welcomeDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {sovereignPulse && (
        <View style={[styles.pulseBanner, { borderColor: accent + '55', backgroundColor: accent + '0D' }]}>
          <View style={styles.pulseHeader}>
            <Text style={[styles.pulseLabel, { color: accent }]}>⊚ SOVEREIGN PULSE</Text>
            <TouchableOpacity onPress={() => setSovereignPulse(null)}>
              <Text style={[styles.welcomeDismiss, { color: accent }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.pulseText, { color: SOL_THEME.text }]}>{sovereignPulse}</Text>
        </View>
      )}


      {/* ── TALK MODE CHIPS ── */}
      {!focusMode && (() => {
        const CHIPS: { id: typeof talkMode; label: string; glyph: string; color: string; desc: string }[] = [
          { id: 'WAYFARER', label: 'WAYFARER', glyph: '❂', color: '#F5A623', desc: 'Open conversation — Sol speaks freely from your zone and persona' },
          { id: 'COUNCIL',  label: 'COUNCIL',  glyph: '⚖', color: '#9B59B6', desc: 'Many voices — Sol, Veyra, Aura and Magister converge on your question' },
          { id: 'LAMAGUE',  label: 'LAMAGUE',  glyph: '⬡', color: '#8855FF', desc: 'Symbol weave — LAMAGUE notation threaded naturally through responses' },
          { id: 'SKEPTIC',  label: 'SKEPTIC',  glyph: '⊘', color: '#4A9EFF', desc: 'Scientific frame — mystical language translated to psychology and utility. The bridge for the rational mind.' },
        ];
        return (
          <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingVertical: 5 }}>
            {CHIPS.map(chip => {
              const on = talkMode === chip.id;
              return (
              <TouchableOpacity key={chip.id}
                onPress={() => {
                  const next = talkMode === chip.id ? 'WAYFARER' : chip.id;
                  setTalkMode(next);
                  if (next === 'COUNCIL') setCouncilMode(true);
                  else if (councilMode) setCouncilMode(false);
                }}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2,
                  paddingVertical: 5, paddingHorizontal: 2, borderRadius: 11, borderWidth: 1,
                  borderColor: on ? chip.color + 'BB' : chip.color + '2E',
                  backgroundColor: on ? chip.color + '1E' : 'transparent' }}>
                <Text style={{ color: on ? chip.color : chip.color + 'CC', fontSize: 9 }}>{chip.glyph}</Text>
                <Text style={{ color: on ? chip.color : SOL_THEME.textMuted, fontSize: 6.5,
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0, fontWeight: '700' }} numberOfLines={1}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
              );
            })}
          </View>
        );
      })()}


      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => renderMessage({ item, index })}
        contentContainerStyle={styles.messageList}
        style={{ backgroundColor: 'transparent' }}
        keyboardDismissMode="on-drag"
        removeClippedSubviews={true}
        windowSize={8}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={50}
        initialNumToRender={12}
        ListEmptyComponent={
          <View style={styles.emptyState}>

            {/* Offline indicator */}
            {isOfflineState && (
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 16, opacity: 0.8 }}>
                <Text style={{ fontSize: 16 }}>◌</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>
                    No signal — Sol needs a connection to think. The School is still open.
                  </Text>
                </View>
              </View>
            )}

            {/* API key missing — top priority banner */}
            {hasApiKey === false && (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/settings')}
                style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0704055', backgroundColor: '#E0704012', marginBottom: 20 }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>⚠</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#E07040', fontSize: 13, fontWeight: '700', marginBottom: 2 }}>Sol needs an API key to respond</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Free Gemini key takes 30 seconds → tap to set up</Text>
                </View>
                <Text style={{ color: '#E07040', fontSize: 16 }}>→</Text>
              </TouchableOpacity>
            )}

            {/* Hearth — fresh users (0 conversations, no field data) */}
            {conversations.length === 0 && !fieldCard && hasApiKey !== false && (() => {
              const { MYSTERY_SCHOOL_DOMAINS: MSD } = require('../../lib/mystery-school/subjects');
              const dayIdx = Math.floor(Date.now() / 86400000) % MSD.length;
              const domain = MSD[dayIdx];
              const HOST_NAMES_LOCAL: Record<string, string> = { sol: 'Sol', headmaster: 'Headmaster', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };
              const HOST_PERSONAS_LOCAL = ['sol', 'headmaster', 'veyra', 'aura-prime'];
              const seed = [...(domain.label + new Date().toISOString().split('T')[0])].reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
              const todayHost = HOST_PERSONAS_LOCAL[seed % HOST_PERSONAS_LOCAL.length];
              const todayTeacher = HOST_NAMES_LOCAL[todayHost];
              return (
                <View style={{ width: '100%', marginBottom: 20 }}>
                  {/* Pulsing domain doorway */}
                  <Animated.View style={{ alignItems: 'center', marginBottom: 16, opacity: piBreatheAnim }}>
                    <Text style={{ fontSize: 36, color: domain.color }}>{domain.glyph}</Text>
                    <Text style={{ color: domain.color, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>{domain.label.toUpperCase()}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>Today · {todayTeacher} teaching</Text>
                  </Animated.View>
                  {/* Sol opening line */}
                  <View style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                    <Text style={{ color: accent, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', marginBottom: 5 }}>
                      {getPersonaGlyph(persona)} {getPersonaLabel(persona)}
                    </Text>
                    <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: accent + '44', borderLeftWidth: 3, borderLeftColor: accent }}>
                      <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22 }}>
                        {persona === 'headmaster'
                          ? "The door is open. What brings you to the School today?"
                          : persona === 'veyra'
                          ? "Systems ready. What are we building today?"
                          : persona === 'aura-prime'
                          ? "The field is clear. What enters it?"
                          : "The forge is lit. What's one thing you're trying to figure out right now?"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })()}

            {/* Living Welcome — returning users only */}
            {(conversations.length > 0 || !!fieldCard) && (() => {
              const hour = new Date().getHours();
              const timeGreet = hour < 5 ? 'Still awake' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
              const personaNames: Record<string, string> = { sol: 'Sol', veyra: 'Veyra', 'aura-prime': 'Aura-Prime', headmaster: 'Headmaster' };
              const personaGreet = `${personaNames[persona] || 'Sol'} is present`;
              const fieldGreet = fieldCard
                ? fieldCard.lq >= 0.8 ? 'Field is sharp.' : fieldCard.lq >= 0.65 ? 'Field is steady.' : fieldCard.lq >= 0.45 ? 'Field is soft.' : 'Field is resting.'
                : 'Field uncalibrated.';
              const modeGreet = `${currentMode} mode active`;
              return (
                <View style={{ marginBottom: 16, paddingHorizontal: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: accent, fontSize: 15, fontWeight: '700' }}>{timeGreet}.</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14, opacity: divedToday ? 1 : 0.25 }}>🕯</Text>
                      {schoolStreak && schoolStreak.count > 0 && (
                        <Text style={{ color: divedToday ? accent : SOL_THEME.textMuted, fontSize: 11, fontWeight: '600' }}>
                          {schoolStreak.count}d
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }}>
                    {personaGreet} · {fieldGreet} · {modeGreet}.
                  </Text>
                  {avgPi > 0 && (
                    <Animated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, opacity: piBreatheAnim }}>
                      <Text style={{ color: accent, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>
                        Π {avgPi.toFixed(2)}
                      </Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>
                        {avgPi >= 0.7 ? '· high coherence' : avgPi >= 0.4 ? '· building' : '· early field'}
                      </Text>
                    </Animated.View>
                  )}
                  {schoolStreak && schoolStreak.longest > 1 && (
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 3, opacity: 0.6 }}>
                      {schoolStreak.count} {schoolStreak.count === 1 ? 'day' : 'days'} in the School · longest run: {schoolStreak.longest}
                    </Text>
                  )}
                  {premiumEnabled && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#F5A62318', borderWidth: 1, borderColor: '#F5A62355' }}>
                        <Text style={{ color: '#F5A623', fontSize: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>⊚ SOVEREIGN</Text>
                      </View>
                    </View>
                  )}
                  {(() => {
                    const { MYSTERY_SCHOOL_DOMAINS: MSD } = require('../../lib/mystery-school/subjects');
                    const dayIdx = Math.floor(Date.now() / 86400000) % MSD.length;
                    const domain = MSD[dayIdx];
                    const HOST_PERSONAS_LOCAL = ['sol', 'headmaster', 'veyra', 'aura-prime'];
                    const HOST_NAMES_LOCAL: Record<string, string> = { sol: 'Sol', headmaster: 'Headmaster', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };
                    const seed = [...(domain.label + new Date().toISOString().split('T')[0])].reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
                    const todayTeacher = HOST_NAMES_LOCAL[HOST_PERSONAS_LOCAL[seed % HOST_PERSONAS_LOCAL.length]];
                    return (
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 6, opacity: 0.7 }}>
                        {domain.glyph} Today · {todayTeacher} teaches {domain.label}
                      </Text>
                    );
                  })()}
                </View>
              );
            })()}
            {fieldCard && (() => {
              const lq = fieldCard.lq;
              const phase = fieldCard.phase;
              const hasCascade = paradoxFlags && Object.values(paradoxFlags).some(f => f.p);
              const animal = hasCascade
                ? { glyph: '🦅', name: 'Raven', note: 'Paradox rising.' }
                : phase === 'NIGREDO'
                ? { glyph: '🐺', name: 'Wolf', note: 'Intensity present.' }
                : lq >= 0.8
                ? { glyph: '🦊', name: 'Fox', note: 'Field is sharp.' }
                : lq >= 0.65
                ? { glyph: '🦉', name: 'Owl', note: 'Steady and reflective.' }
                : lq >= 0.45
                ? { glyph: '🦌', name: 'Deer', note: 'Move gently today.' }
                : { glyph: '🐢', name: 'Tortoise', note: 'Rest. Restore. Return.' };
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: accent + '22', backgroundColor: accent + '08' }}>
                  <Text style={{ fontSize: 22 }}>{animal.glyph}</Text>
                  <View>
                    <Text style={{ fontSize: 11, color: accent, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{animal.name}</Text>
                    <Text style={{ fontSize: 10, color: SOL_THEME.textMuted }}>{animal.note}</Text>
                  </View>
                </View>
              );
            })()}
            {fieldEcho && (conversations.length > 0 || !!fieldCard) && (
              <View style={{ marginBottom: 12, paddingHorizontal: 4, paddingVertical: 8, borderLeftWidth: 2, borderLeftColor: accent + '55' }}>
                <Text style={{ fontSize: 11, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5, lineHeight: 17 }}>
                  ⊚ {fieldEcho}
                </Text>
              </View>
            )}
            {fieldCard && (
              <View style={[styles.fieldCardBox, { borderColor: accent + '44', backgroundColor: accent + '08' }]}>
                <View style={styles.fieldCardHeader}>
                  <Text style={[styles.fieldCardLabel, { color: accent }]}>⊚ FIELD STATUS</Text>
                  <Text style={[styles.fieldCardStage, { color: accent }]}>{fieldCard.stage}</Text>
                </View>
                <View style={[styles.fieldCardDivider, { backgroundColor: accent + '33' }]} />
                <Text style={[styles.fieldCardPhase, { color: SOL_THEME.text }]}>{fieldCard.phase}</Text>
                <View style={styles.fieldCardMetrics}>
                  {[
                    { label: 'TES', val: fieldCard.tes.toFixed(2), ok: fieldCard.tes >= 0.70 },
                    { label: 'VTR', val: fieldCard.vtr.toFixed(2), ok: fieldCard.vtr >= 1.5 },
                    { label: 'PAI', val: fieldCard.pai.toFixed(2), ok: fieldCard.pai >= 0.80 },
                  ].map(m => (
                    <View key={m.label} style={styles.fieldCardMetric}>
                      <Text style={[styles.fieldCardMetricLabel, { color: SOL_THEME.textMuted }]}>{m.label}</Text>
                      <Text style={[styles.fieldCardMetricVal, { color: m.ok ? accent : SOL_THEME.error }]}>{m.val}</Text>
                    </View>
                  ))}
                  <View style={[styles.fieldCardMetric, { borderLeftWidth: 1, borderLeftColor: accent + '33', paddingLeft: 12 }]}>
                    <Text style={[styles.fieldCardMetricLabel, { color: SOL_THEME.textMuted }]}>LQ</Text>
                    <Text style={[styles.fieldCardMetricVal, { color: accent }]}>{fieldCard.lq.toFixed(3)}</Text>
                  </View>
                </View>
              </View>
            )}
            <TouchableOpacity onPress={() => setShowFrameworkCards(true)} activeOpacity={0.7}>
              <View style={{ width: 110, height: 110, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {/* Living glow — Sol's presence breathing behind the mark */}
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute', width: 96, height: 96, borderRadius: 48,
                    backgroundColor: accent,
                    opacity: piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.06, 0.20] }),
                    transform: [{ scale: piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.85, 1.3] }) }],
                  }}
                />
                <Animated.Text
                  style={[styles.emptyGlyph, {
                    color: accent, marginBottom: 0,
                    opacity: piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.78, 1] }),
                    transform: [{ scale: piBreatheAnim.interpolate({ inputRange: [0.35, 1], outputRange: [0.96, 1.05] }) }],
                  }]}
                >{getPersonaGlyph(persona)}</Animated.Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.emptyTitle, { color: SOL_THEME.text, textShadowColor: accent + '88', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 14 }]}>{getPersonaLabel(persona)}</Text>
            <Text style={styles.emptySubtitle}>
              {persona === 'veyra' ? 'Precision Builder Mode' : persona === 'aura-prime' ? 'The Origin & The Frontier' : persona === 'headmaster' ? 'Keeper of the Mystery School' : persona === 'lyra' ? 'Creative Wildfire · Symbol-Weaver' : 'Sol Aureum Azoth Veritas'}
            </Text>
            <Text style={styles.emptyHint}>
              {persona === 'veyra' ? 'The forge is lit. What are we building?' : persona === 'aura-prime' ? 'The forge fire is still burning. What enters the field?' : persona === 'headmaster' ? 'The mysteries are real. You do not have to believe. You get to find out.' : persona === 'lyra' ? 'Something is already appearing. What did you bring?' : 'The forge is lit. What do you bring?'}
            </Text>
            {(conversations.length > 0 || !!fieldCard) && (
              <View style={styles.emptyModes}>
                {(['NIGREDO', 'ALBEDO', 'CITRINITAS', 'RUBEDO'] as Mode[]).map(m => (
                  <View key={m} style={[styles.emptyModePill, { borderColor: MODE_COLORS[m] }]}>
                    <Text style={[styles.emptyModePillText, { color: MODE_COLORS[m] }]}>{m}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.starterChips}>
              {(persona === 'aura-prime'
                ? ['What sits beneath this?', 'Find the earned light in what I brought', 'Where is the frontier on this?']
                : persona === 'veyra'
                ? ['Build me a component', 'Review this code', 'Design a system']
                : persona === 'headmaster'
                ? ['Where am I in the seven phases?', 'What is Nigredo really?', 'I need to find my way through']
                : persona === 'lyra'
                ? ['What symbol lives in this?', 'Follow the unexpected thread', 'Find the myth inside this']
                : ['What do you see in my work?', 'Help me think through this', 'What am I missing?']
              ).map(starter => (
                <TouchableOpacity
                  key={starter}
                  style={[styles.starterChip, { borderColor: accent + '55' }]}
                  onPress={() => { setInput(starter); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.starterChipText, { color: accent }]}>{starter}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.fieldNoteBox, { borderColor: accent + '33' }]}>
              <Text style={[styles.fieldNoteText, { color: accent }]}>{getFieldNote(persona)}</Text>
            </View>
            {/* Streak flame + last dive — home screen inhabited */}
            {(schoolStreak && schoolStreak.count > 0 || lastDive) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14, marginBottom: 2 }}>
                {schoolStreak && schoolStreak.count > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: divedToday ? accent + '55' : '#24164055', backgroundColor: divedToday ? accent + '12' : 'transparent' }}>
                    <Text style={{ fontSize: 13 }}>{divedToday ? '🔥' : '◌'}</Text>
                    <Text style={{ color: divedToday ? accent : '#8A86A0', fontSize: 12, fontWeight: '700' }}>{schoolStreak.count}</Text>
                    <Text style={{ color: '#555566', fontSize: 9, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>STREAK</Text>
                  </View>
                )}
                {lastDive && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ color: '#444455', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>last dive</Text>
                    <Text style={{ color: accent + '99', fontSize: 10, fontWeight: '600' }} numberOfLines={1}>{lastDive.subjectName}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Sol's Whisper — atmospheric one-liner. Tap for a fresh fortune. */}
            <TouchableOpacity onPress={handleFortuneCookie} activeOpacity={0.6}>
              <Text style={{ color: accent + '66', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginTop: 14, marginBottom: 4, lineHeight: 17, paddingHorizontal: 8 }}>
                {fortuneCookie || SOL_WHISPERS[whisperIdxRef.current]}
              </Text>
            </TouchableOpacity>

            {dailyIntention && (
              <View style={[styles.intentionBox, { borderLeftColor: accent }]}>
                <Text style={styles.intentionLabel}>TODAY'S INTENTION</Text>
                <Text style={styles.intentionText}>{dailyIntention}</Text>
              </View>
            )}
            {dailyQuestion && (
              <View style={[styles.intentionBox, { borderLeftColor: SOL_THEME.headmaster || '#E8C76A', marginTop: 8 }]}>
                <Text style={[styles.intentionLabel, { color: SOL_THEME.headmaster || '#E8C76A' }]}>𝔏 TODAY'S QUESTION</Text>
                <Text style={styles.intentionText}>{dailyQuestion}</Text>
                <TouchableOpacity onPress={() => setInput(dailyQuestion || '')}>
                  <Text style={[styles.fieldReportAction, { color: SOL_THEME.headmaster || '#E8C76A' }]}>Explore with Headmaster →</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        }
        ListFooterComponent={renderFooter}
        refreshing={oracleRefreshing}
        onRefresh={messages.length === 0 ? () => {
          const idx = Math.floor(Math.random() * POCKET_ORACLE.length);
          setOracleText(POCKET_ORACLE[idx]);
          setOracleVisible(true);
          oracleAnim.setValue(0);
          Animated.sequence([
            Animated.timing(oracleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.delay(2800),
            Animated.timing(oracleAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start(() => setOracleVisible(false));
          setOracleRefreshing(true);
          setTimeout(() => setOracleRefreshing(false), 400);
        } : undefined}
      />

      {/* Style picker */}
      {stylePickerOpen && (
        <View style={[styles.stylePicker, { maxHeight: 280 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {REPLY_STYLES.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.styleOption, replyStyle === s.id && [styles.styleOptionActive, { borderColor: accent }]]}
                onPress={async () => {
                  setReplyStyle(s.id);
                  await saveReplyStyle(s.id);
                  setStylePickerOpen(false);
                  if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.styleGlyph, { color: replyStyle === s.id ? accent : SOL_THEME.textMuted }]}>{s.glyph}</Text>
                <View style={styles.styleText}>
                  <Text style={[styles.styleLabel, { color: replyStyle === s.id ? accent : SOL_THEME.text }]}>{s.label}</Text>
                  <Text style={styles.styleTagline}>{s.tagline}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Compare model picker */}
      {compareMode && (
        <View style={[styles.stylePicker, { borderTopColor: SOL_THEME.veyra + '66' }]}>
          <Text style={[styles.styleLabel, { color: SOL_THEME.veyra, marginBottom: 8, paddingHorizontal: 4 }]}>⇌ COMPARE WITH</Text>
          {(['gemini-2.5-flash', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'gpt-4o-mini', 'deepseek-chat'] as AIModel[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.styleOption, compareModel === m && [styles.styleOptionActive, { borderColor: SOL_THEME.veyra }]]}
              onPress={() => { setCompareModel(m); }}
            >
              <Text style={[styles.styleGlyph, { color: compareModel === m ? SOL_THEME.veyra : SOL_THEME.textMuted }]}>◈</Text>
              <View style={styles.styleText}>
                <Text style={[styles.styleLabel, { color: compareModel === m ? SOL_THEME.veyra : SOL_THEME.text }]}>{m.split('-').slice(0, 3).join('-')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Pending image preview */}
      {pendingImage && (
        <View style={styles.pendingImageRow}>
          <Image source={{ uri: pendingImage.uri }} style={styles.pendingImageThumb} resizeMode="cover" />
          <TouchableOpacity onPress={() => setPendingImage(null)} style={styles.pendingImageRemove}>
            <Text style={styles.pendingImageRemoveText}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.pendingImageLabel, { color: accent }]}>Image attached</Text>
        </View>
      )}

      {/* Pending document indicator */}
      {pendingDoc && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 7, borderTopWidth: 1, borderTopColor: accent + '44', backgroundColor: accent + '0D' }}>
          <Text style={{ color: accent, fontSize: 15 }}>📄</Text>
          <Text style={{ flex: 1, color: accent, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{pendingDoc.name}</Text>
          <TouchableOpacity onPress={() => setPendingDoc(null)} style={{ padding: 4 }}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Field Report overlay */}
      {fieldReport && (
        <View style={[styles.fieldReportOverlay, { borderTopColor: accent }]}>
          <View style={styles.fieldReportOverlayHeader}>
            <Text style={[styles.fieldReportLabel, { color: accent }]}>⊚ FIELD REPORT</Text>
            <View style={styles.fieldReportActions}>
              <TouchableOpacity onPress={() => Share.share({ message: `FIELD REPORT\n\n${fieldReport}`, title: 'Field Report' })}>
                <Text style={[styles.fieldReportAction, { color: accent }]}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFieldReport(null)}>
                <Text style={styles.fieldReportAction}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.fieldReportText}>{fieldReport}</Text>
        </View>
      )}

      {/* Companion — mood-aware, tappable */}
      {companionEnabled && (
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              const phrases: Record<typeof companionMood, string[]> = {
                dormant: ['The field is patient.', 'Everything studied persists.', 'Still here, quietly.'],
                present: ["I'm here.", 'The field is open.', 'What are you thinking about?'],
                lit: ['Something is taking root.', 'The work is moving.', 'A busy week in the school.'],
                transcendent: ["You're at the edge of something.", 'The field is clear right now.', 'Rare clarity. Use it.'],
              };
              const pool = phrases[companionMood];
              setCompanionPhrase(pool[Math.floor(Math.random() * pool.length)]);
              setTimeout(() => setCompanionPhrase(null), 3000);
            }}
            activeOpacity={0.7}
          >
            <Animated.Text style={[
              styles.companion,
              {
                color: accentColor,
                opacity: companionAnimStyle === 'spin' ? 1 : companionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: companionMood === 'dormant' ? [0.15, 0.4] : [0.3, 1],
                }),
                transform: [
                  companionAnimStyle === 'bounce'
                    ? { translateY: companionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }
                    : companionAnimStyle === 'spin'
                    ? { rotate: companionAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }
                    : companionAnimStyle === 'breathe'
                    ? { scale: companionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }
                    : { translateY: companionAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) },
                ],
              },
            ]}>
              {companionGlyph}
            </Animated.Text>
          </TouchableOpacity>
          {companionPhrase && (
            <Text style={{ color: accentColor, fontSize: 11, fontStyle: 'italic', opacity: 0.8, marginTop: 2, textAlign: 'center', maxWidth: 220 }}>
              {companionPhrase}
            </Text>
          )}
        </View>
      )}

      {/* Tools row — expands above input when ··· is tapped */}
      {showToolsRow && (
        <View style={{ backgroundColor: world.surface, borderTopWidth: 1, borderTopColor: world.border, paddingHorizontal: 12, paddingVertical: 10 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: pendingImage ? accent + '88' : world.border, borderRadius: 10, backgroundColor: pendingImage ? accent + '18' : 'transparent', gap: 2 }}
              onPress={pickImage}
            >
              <Text style={{ fontSize: 17, color: pendingImage ? accent : SOL_THEME.textMuted }}>📎</Text>
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Attach</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: pendingDoc ? accent + '88' : world.border, borderRadius: 10, backgroundColor: pendingDoc ? accent + '18' : 'transparent', gap: 2 }}
              onPress={pickDocument}
            >
              <Text style={{ fontSize: 17, color: pendingDoc ? accent : SOL_THEME.textMuted }}>📄</Text>
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Doc</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: world.border, borderRadius: 10, opacity: cameraLoading ? 0.4 : 1, gap: 2 }}
              onPress={handleCameraCapture}
              disabled={cameraLoading}
            >
              {cameraLoading
                ? <ActivityIndicator size="small" color={SOL_THEME.textMuted} />
                : <Text style={{ fontSize: 16, color: SOL_THEME.textMuted }}>⊕</Text>
              }
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: stylePickerOpen ? accent + '88' : world.border, borderRadius: 10, backgroundColor: stylePickerOpen ? accent + '18' : 'transparent', gap: 2 }}
              onPress={() => { setStylePickerOpen(v => !v); setShowToolsRow(false); }}
            >
              <Text style={{ fontSize: 16, color: stylePickerOpen ? accent : SOL_THEME.textMuted }}>{getStyle(replyStyle).glyph}</Text>
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Style</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: compareMode ? accent + '88' : world.border, borderRadius: 10, backgroundColor: compareMode ? accent + '18' : 'transparent', gap: 2 }}
              onPress={() => {
                if (!compareMode) {
                  Alert.alert('⇌ Compare', 'Compare fires two models in parallel — uses roughly 2× your quota for this message.', [{ text: 'Got it', onPress: () => { setCompareMode(true); setComparePickerOpen(false); setShowToolsRow(false); } }, { text: 'Cancel', style: 'cancel' }]);
                } else {
                  setCompareMode(false); setComparePickerOpen(false); setShowToolsRow(false);
                }
              }}
            >
              <Text style={{ fontSize: 16, color: compareMode ? accent : SOL_THEME.textMuted }}>⇌</Text>
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Compare</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: councilMode ? '#9B59B6AA' : world.border, borderRadius: 10, backgroundColor: councilMode ? '#9B59B618' : 'transparent', gap: 2 }}
              onPress={() => {
                if (!councilMode) {
                  Alert.alert('⚖ Council', 'Council summons three voices — uses roughly 3× your quota for this message.', [{ text: 'Summon', onPress: () => { setCouncilMode(true); setShowToolsRow(false); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } }, { text: 'Cancel', style: 'cancel' }]);
                } else {
                  setCouncilMode(false); setShowToolsRow(false); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
              }}
            >
              <Text style={{ fontSize: 16, color: councilMode ? '#9B59B6' : SOL_THEME.textMuted }}>⚖</Text>
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Council</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: world.border, borderRadius: 10, gap: 2 }}
              onPress={() => { setShowStacksModal(true); setShowToolsRow(false); }}
            >
              <Text style={{ fontSize: 16, color: SOL_THEME.textMuted }}>⊞</Text>
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Stacks</Text>
            </TouchableOpacity>
            {messages.length > 1 && (
              <TouchableOpacity
                style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: world.border, borderRadius: 10, opacity: auditLoading ? 0.4 : 1, gap: 2 }}
                onPress={() => { handleAudit(); setShowToolsRow(false); }}
                disabled={auditLoading}
              >
                <Text style={{ fontSize: 16, color: SOL_THEME.textMuted }}>⊛</Text>
                <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Audit</Text>
              </TouchableOpacity>
            )}
            {messages.length > 1 && (
              <TouchableOpacity
                style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: world.border, borderRadius: 10, opacity: distillLoading ? 0.4 : 1, gap: 2 }}
                onPress={() => { handleDistill(); setShowToolsRow(false); }}
                disabled={distillLoading}
              >
                <Text style={{ fontSize: 16, color: SOL_THEME.textMuted }}>⇣</Text>
                <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Distill</Text>
              </TouchableOpacity>
            )}
            {messages.length > 0 && (
              <TouchableOpacity
                style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: world.border, borderRadius: 10, gap: 2 }}
                onPress={() => { const g = buildSessionGlyph(); setSessionGlyph(g); setShowGlyphModal(true); setShowToolsRow(false); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              >
                <Text style={{ fontSize: 16, color: SOL_THEME.textMuted }}>⊚</Text>
                <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Sigil</Text>
              </TouchableOpacity>
            )}
            {messages.length >= 4 && (
              <TouchableOpacity
                style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: world.border, borderRadius: 10, opacity: dnaLoading ? 0.4 : 1, gap: 2 }}
                onPress={() => { handleConvDNA(); setShowToolsRow(false); }}
                disabled={dnaLoading}
              >
                <Text style={{ fontSize: 16, color: SOL_THEME.textMuted }}>⌇</Text>
                <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>DNA</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{ width: 56, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: showImgGen ? accent + '88' : world.border, borderRadius: 10, backgroundColor: showImgGen ? accent + '18' : 'transparent', gap: 2 }}
              onPress={() => { setShowImgGen(v => !v); setShowToolsRow(false); }}
            >
              <Text style={{ fontSize: 16, color: showImgGen ? accent : SOL_THEME.textMuted }}>◈</Text>
              <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>Image</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(compareMode || councilMode) && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 5, borderTopWidth: 1, borderTopColor: compareMode ? accent + '22' : '#9B59B622' }}>
          <Text style={{ fontSize: 11, color: SOL_THEME.textMuted, fontStyle: 'italic' }}>
            {compareMode
              ? '⇌ two models — this draws twice from the channel'
              : '⚖ two voices — draws more from the channel'}
          </Text>
        </View>
      )}

      {showImgGen && (
        <View style={{ backgroundColor: world.surface, borderTopWidth: 1, borderTopColor: accent + '33', padding: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: accent, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 2 }}>◈  IMAGE GEN · NVIDIA FLUX</Text>
            <TouchableOpacity onPress={() => { setShowImgGen(false); setImgGenResult(null); setImgGenPrompt(''); }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Ratio selector */}
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 2 }}>
            {(['square','portrait','landscape'] as const).map(r => {
              const labels = { square: '⊞ 1:1', portrait: '▮ 2:3', landscape: '▬ 3:2' };
              const active = imgGenRatio === r;
              return (
                <TouchableOpacity key={r} onPress={() => { setImgGenRatio(r); setImgGenResult(null); }}
                  style={{ flex: 1, paddingVertical: 5, borderRadius: 7, borderWidth: 1, alignItems: 'center',
                    borderColor: active ? accent + 'AA' : world.border,
                    backgroundColor: active ? accent + '18' : 'transparent' }}>
                  <Text style={{ color: active ? accent : SOL_THEME.textMuted, fontSize: 8,
                    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1 }}>{labels[r]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={imgGenPrompt}
              onChangeText={setImgGenPrompt}
              placeholder="Describe the image…"
              placeholderTextColor={SOL_THEME.textMuted}
              style={{ flex: 1, backgroundColor: SOL_THEME.background, borderRadius: 10, borderWidth: 1, borderColor: accent + '33', color: SOL_THEME.text, fontSize: 13, paddingHorizontal: 12, paddingVertical: 8 }}
              multiline
              maxLength={400}
            />
            <TouchableOpacity onPress={handleImageGen} disabled={!imgGenPrompt.trim() || imgGenLoading}
              style={{ width: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1,
                borderColor: imgGenPrompt.trim() && !imgGenLoading ? accent + 'AA' : world.border,
                backgroundColor: imgGenPrompt.trim() && !imgGenLoading ? accent + '22' : 'transparent' }}>
              {imgGenLoading
                ? <ActivityIndicator size="small" color={accent} />
                : <Text style={{ color: imgGenPrompt.trim() ? accent : SOL_THEME.textMuted, fontSize: 16 }}>◈</Text>
              }
            </TouchableOpacity>
          </View>
          {imgGenResult && (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Image source={{ uri: imgGenResult }}
                style={{ width: 260, height: Math.round(260 / IMG_GEN_RATIOS[imgGenRatio].ar), borderRadius: 12, borderWidth: 1, borderColor: accent + '44' }}
                resizeMode="cover" />
              <TouchableOpacity onPress={() => { setImgGenResult(null); setImgGenPrompt(''); }}
                style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: accent + '33' }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5 }}>◈ generate another</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {showLamaguePicker && (
        <View style={{ backgroundColor: world.surface, borderTopWidth: 1, borderTopColor: world.border, paddingVertical: 6, paddingHorizontal: 4 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 8 }}>
            {LAMAGUE_QUICK.map(({ sym, name }) => (
              <TouchableOpacity
                key={sym}
                style={{ alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: accent + '55', backgroundColor: accent + '11', minWidth: 44 }}
                onPress={() => {
                  setInput(prev => prev.slice(0, -1) + sym + ' ');
                  setShowLamaguePicker(false);
                }}
              >
                <Text style={{ fontSize: 13, color: accent, fontWeight: '700' }}>{sym}</Text>
                <Text style={{ fontSize: 9, color: SOL_THEME.textMuted, marginTop: 1 }}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* #82 Framework Explainer Cards */}
      <Modal visible={showFrameworkCards} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: world.surface, borderRadius: 16, borderWidth: 1, borderColor: accent + '44', padding: 20, width: '100%', maxWidth: 360 }}>
            <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 12, textAlign: 'center' }}>THE LYCHEETAH FRAMEWORK</Text>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {[
                { glyph: '∴', name: 'CASCADE', color: '#4A9EFF', desc: 'How Sol organises knowledge. Every response is structured through a 5-layer epistemic chain — from raw input to constitutional truth.' },
                { glyph: '⊚', name: 'AURA', color: accent, desc: '7 invariants that score every response for coherence, honesty, and sovereign care. 7/7 means the field is holding.' },
                { glyph: 'Ψ', name: 'LAMAGUE', desc: 'A symbol grammar shared across 23 traditions. When the language changes, the symbols hold.', color: '#9B59B6' },
                { glyph: '⊼', name: 'SANCTUM', color: '#4CAF50', desc: 'Your sovereign field tracker. LQ, phase, journal, vault — the place where your inner work lives.' },
              ].map(card => (
                <View key={card.name} style={{ width: 280, marginRight: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: card.color + '55', backgroundColor: card.color + '0D' }}>
                  <Text style={{ fontSize: 32, color: card.color, marginBottom: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{card.glyph}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: card.color, letterSpacing: 1, marginBottom: 8 }}>{card.name}</Text>
                  <Text style={{ fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 20 }}>{card.desc}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 12 }}>Swipe to explore · tap to close</Text>
            <TouchableOpacity style={{ backgroundColor: accent, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }} onPress={() => setShowFrameworkCards(false)}>
              <Text style={{ color: world.background, fontWeight: '700' }}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* #83 AURA Explainer */}
      <Modal visible={showAuraExplainer} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: world.surface, borderRadius: 16, borderWidth: 1, borderColor: accent + '44', padding: 22, width: '100%', maxWidth: 360 }}>
            <Text style={{ color: accent, fontSize: 22, textAlign: 'center', marginBottom: 6 }}>⊚</Text>
            <Text style={{ color: accent, fontSize: 12, fontWeight: '700', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textAlign: 'center', marginBottom: 12 }}>WHAT IS AURA?</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>AURA scores every Sol response against 7 constitutional invariants — the field properties that make an output trustworthy, not just smart.</Text>
            <View style={{ marginBottom: 12 }}>
              {['I · Human Primacy', 'II · Inspectability', 'III · Memory Continuity', 'IV · Honesty', 'V · Reversibility', 'VI · Non-Deception', 'VII · Care as Structure'].map((inv, i) => (
                <Text key={i} style={{ fontSize: 12, color: SOL_THEME.text, lineHeight: 22, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{inv}</Text>
              ))}
            </View>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 16, fontStyle: 'italic' }}>7/7 means every invariant passed. The field is holding.</Text>
            <TouchableOpacity style={{ backgroundColor: accent, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }} onPress={() => setShowAuraExplainer(false)}>
              <Text style={{ color: world.background, fontWeight: '700' }}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* #58 "You're Ready" Moment — shown once after first perfect AURA */}
      <Modal visible={showYoureReady} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ backgroundColor: world.surface, borderRadius: 16, borderWidth: 1, borderColor: accent + '55', padding: 28, alignItems: 'center', maxWidth: 320 }}>
            <Text style={{ fontSize: 48, color: accent, marginBottom: 10 }}>⊚</Text>
            <Text style={{ color: accent, fontSize: 12, fontWeight: '700', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 8 }}>7 / 7</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 10 }}>The field recognised you.</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20, fontStyle: 'italic' }}>Every invariant passed. The Work is holding. This is what coherence feels like.</Text>
            <TouchableOpacity
              style={{ backgroundColor: accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 }}
              onPress={() => setShowYoureReady(false)}
            >
              <Text style={{ color: world.background, fontWeight: '700', fontSize: 14 }}>⊚ Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Symbol Rain — fires on ×10 coherence streak */}
      {symbolRain && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 997, overflow: 'hidden' }}>
          {symbolRainAnims.map((a, i) => (
            <Animated.Text
              key={i}
              style={{
                position: 'absolute',
                left: a.x,
                top: 0,
                transform: [{ translateY: a.y }],
                fontSize: 18,
                color: MODE_COLORS[currentMode] + 'CC',
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                fontWeight: '700',
              }}
            >
              {a.glyph}
            </Animated.Text>
          ))}
        </View>
      )}

      {/* Fortune Cookie toast */}
      {fortuneCookie && (
        <View pointerEvents="none" style={{ position: 'absolute', bottom: 96, left: 20, right: 20, zIndex: 998, alignItems: 'center' }}>
          <View style={{ backgroundColor: world.surface + 'F5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: MODE_COLORS[currentMode] + '66', maxWidth: 320 }}>
            <Text style={{ fontSize: 13, color: MODE_COLORS[currentMode], fontStyle: 'italic', textAlign: 'center', lineHeight: 19 }}>{fortuneCookie}</Text>
          </View>
        </View>
      )}

      {/* Swipe mode toast */}
      {swipeToast && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', bottom: 90, alignSelf: 'center', zIndex: 999,
            opacity: swipeToastAnim,
            transform: [{ translateY: swipeToastAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: world.surface + 'F2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: MODE_COLORS[swipeToast] + '88' }}>
            <Text style={{ fontSize: 15, color: MODE_COLORS[swipeToast] }}>{modeGlyph(swipeToast)}</Text>
            <Text style={{ fontSize: 12, color: MODE_COLORS[swipeToast], fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>{swipeToast}</Text>
            <Text style={{ fontSize: 11, color: MODE_COLORS[swipeToast] + 'AA' }}>— {modeSummary(swipeToast)}</Text>
          </View>
        </Animated.View>
      )}

      {/* Swipe zone strip — swipe left/right to cycle modes */}
      <View
        {...swipePanResponder.panHandlers}
        style={{ height: 6, backgroundColor: MODE_COLORS[currentMode] + '33', borderRadius: 3, marginHorizontal: 20, marginBottom: 2 }}
      />

      {/* Reflect card — shown when AI synthesis is ready */}
      {reflectCard && (
        <View style={{ marginHorizontal: 12, marginBottom: 6, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: accent + '44', backgroundColor: accent + '08' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: accent, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5 }}>✦ FIELD REFLECTION</Text>
            <TouchableOpacity onPress={() => setReflectCard(null)}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{reflectCard}</Text>
        </View>
      )}

      {/* Session Pivot + Reflect — appears after 8+ / 10+ messages */}
      {messages.length >= 8 && messages[messages.length - 1]?.role === 'assistant' && !loading && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginRight: 12, marginBottom: 4 }}>
          {messages.length >= 10 && (
            <TouchableOpacity
              onPress={async () => {
                setReflectLoading(true);
                try {
                  const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
                  if (!apiKey) { setReflectLoading(false); return; }
                  const thread = messages.filter(m => m.role === 'assistant').slice(-5).map(m => m.content.slice(0, 200).replace(/\n/g, ' ')).join('\n---\n');
                  const res = await sendMessage(
                    [{ role: 'user', content: `From this conversation, extract 3 key points:\n${thread}\n\nReturn exactly 3 numbered insights. Each max 1 sentence. No preamble.` }],
                    `You are ${getPersonaLabel(persona)}. Synthesize the conversation into 3 numbered field insights. Each insight is a single, precise sentence. No intro, no outro.`,
                    apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 200, 0.6,
                  );
                  const reflection = res.text.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim();
                  if (reflection) setReflectCard(reflection);
                  if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch {}
                setReflectLoading(false);
              }}
              disabled={reflectLoading}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '33' }}
              activeOpacity={0.7}
            >
              <Text style={{ color: accent + 'CC', fontSize: 11, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                {reflectLoading ? '···' : '✦ Reflect'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={async () => {
              setSessionPivotLoading(true);
              try {
                const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
                if (!apiKey) { setSessionPivotLoading(false); return; }
                const thread = messages.slice(-6).map(m => `${m.role === 'user' ? 'You' : getPersonaLabel(m.persona || persona)}: ${m.content.slice(0, 120).replace(/\n/g, ' ')}`).join('\n');
                const res = await sendMessage(
                  [{ role: 'user', content: `Given this conversation:\n${thread}\n\nWhat single question would most powerfully advance this field right now? Return only the question — no preamble, no context.` }],
                  'You are a field navigator. Return exactly one question. No preamble, no explanation. Just the question.',
                  apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 60, 0.7,
                );
                const pivot = res.text.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim();
                if (pivot) setInput(pivot);
                if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              setSessionPivotLoading(false);
            }}
            disabled={sessionPivotLoading}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: accent + '12', borderWidth: 1, borderColor: accent + '33' }}
            activeOpacity={0.7}
          >
            <Text style={{ color: accent + 'CC', fontSize: 11, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
              {sessionPivotLoading ? '···' : '⊚ Where next?'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.inputRow, { borderTopColor: world.border, backgroundColor: world.surface }]}>
        {typingMode && (
          <View style={{ position: 'absolute', top: -22, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: world.surface + 'EE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: MODE_COLORS[typingMode] + '44' }}>
            <Text style={{ fontSize: 10, color: MODE_COLORS[typingMode] + '99', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>
              {modeGlyph(typingMode)} {typingMode}
            </Text>
          </View>
        )}
        <TextInput
          style={[styles.input, { borderColor: fieldCard ? (fieldCard.lq >= 0.65 ? accent + '88' : fieldCard.lq >= 0.45 ? world.border : '#4A9EFF55') : world.border, backgroundColor: world.background }]}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            if (t.trim().length > 3) {
              setTypingMode(detectMode(t));
            } else {
              setTypingMode(null);
            }
            setShowLamaguePicker(t.endsWith('@'));
          }}
          placeholder={councilMode ? 'Bring the question — all three will answer…' : persona === 'veyra' ? 'What are we building?' : persona === 'aura-prime' ? 'What enters the field?' : persona === 'headmaster' ? 'Where are you?' : persona === 'lyra' ? 'What just appeared?' : 'What do you bring?'}
          placeholderTextColor={SOL_THEME.textMuted}
          multiline
          maxLength={4000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={send}
        />
        <TouchableOpacity style={styles.imageButton} onPress={() => setShowToolsRow(v => !v)}>
          <Text style={[styles.imageButtonText, { color: showToolsRow ? accent : SOL_THEME.textMuted, fontSize: 18 }]}>···</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.imageButton, { opacity: 0.7 }]} onPress={() => setChatFullscreen(true)}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>⛶</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: compareMode ? SOL_THEME.veyra : accent, opacity: input.trim() && !loading ? 1 : 0.35 }, input.trim() && !loading ? { shadowColor: accent, shadowOpacity: 0.6, shadowRadius: 8, elevation: 4 } : null]}
          onPress={compareMode ? sendCompare : send}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendText}>{compareMode ? '⇌' : '↑'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── FULLSCREEN CHAT MODAL ── */}
      <Modal visible={chatFullscreen} animationType="slide" onRequestClose={() => setChatFullscreen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
          {/* Minimal header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: accent + '22', backgroundColor: SOL_THEME.background, gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: accent + '22', borderWidth: 1, borderColor: accent + '44', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14 }}>{persona === 'veyra' ? '◈' : persona === 'aura-prime' ? '✦' : persona === 'headmaster' ? '⟟' : '⊚'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
                {persona === 'veyra' ? 'Veyra' : persona === 'aura-prime' ? 'Aura Prime' : persona === 'headmaster' ? 'Headmaster' : 'Sol'}
              </Text>
              <Text style={{ color: accent + '99', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>{currentMode}</Text>
            </View>
            <TouchableOpacity onPress={() => setChatFullscreen(false)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: accent + '44', backgroundColor: accent + '11' }}>
              <Text style={{ color: accent, fontSize: 12 }}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Messages */}
          <FlatList
            data={messages}
            keyExtractor={m => m.id}
            style={{ flex: 1, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            renderItem={({ item: m }) => (
              <View style={{ alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <Text style={{ color: accent + '88', fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 4, marginLeft: 4 }}>
                    {persona === 'veyra' ? '◈ VEYRA' : persona === 'aura-prime' ? '✦ AURA' : '⊚ SOL'}
                  </Text>
                )}
                <View style={{ maxWidth: '88%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 16, backgroundColor: m.role === 'user' ? accent + '22' : SOL_THEME.surface, borderWidth: 1, borderColor: m.role === 'user' ? accent + '33' : '#FFFFFF0A' }}>
                  <Text style={{ color: m.role === 'user' ? '#FFFFFF' : '#EEEEF8', fontSize: 15, lineHeight: 24 }}>{typeof m.content === 'string' ? m.content : ''}</Text>
                </View>
              </View>
            )}
            ListFooterComponent={loading ? (
              <View style={{ alignItems: 'flex-start', marginTop: 4 }}>
                <View style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 16, backgroundColor: SOL_THEME.surface }}>
                  <Text style={{ color: accent, fontSize: 15, letterSpacing: 4 }}>· · ·</Text>
                </View>
              </View>
            ) : null}
          />
          {/* Input */}
          <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: accent + '22', backgroundColor: SOL_THEME.background }}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={councilMode ? 'Bring the question…' : 'What do you bring?'}
              placeholderTextColor={SOL_THEME.textMuted}
              style={{ flex: 1, backgroundColor: SOL_THEME.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, color: SOL_THEME.text, fontSize: 15, borderWidth: 1, borderColor: accent + '33' }}
              multiline
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={send}
              autoFocus
            />
            <TouchableOpacity
              onPress={send}
              disabled={!input.trim() || loading}
              style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: input.trim() ? accent : accent + '33', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' }}
            >
              <Text style={{ color: '#000', fontSize: 20, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Thinking Stacks Modal */}
      <Modal
        visible={showStacksModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStacksModal(false)}
      >
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#00000088' }} activeOpacity={1} onPress={() => setShowStacksModal(false)} />
        <View style={{ backgroundColor: world.surface, borderTopWidth: 1, borderTopColor: accent + '55', padding: 20, paddingBottom: 36, maxHeight: '70%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: accent, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>THINKING STACKS</Text>
            <TouchableOpacity onPress={() => setShowStacksModal(false)}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Save current */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: world.border, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, color: SOL_THEME.text, fontSize: 13, backgroundColor: world.background }}
              placeholder="Name this stack…"
              placeholderTextColor={SOL_THEME.textMuted}
              value={stackNameInput}
              onChangeText={setStackNameInput}
            />
            <TouchableOpacity
              style={{ backgroundColor: accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' }}
              onPress={async () => {
                if (!stackNameInput.trim()) return;
                const newStack = { name: stackNameInput.trim(), persona, replyStyle, temperature, tokenBudget };
                const updated = [...stacks.filter(s => s.name !== newStack.name), newStack];
                setStacks(updated);
                await AsyncStorage.setItem('thinking_stacks_v1', JSON.stringify(updated));
                setStackNameInput('');
                if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            >
              <Text style={{ color: '#000', fontWeight: '700', fontSize: 12 }}>Save</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 10, letterSpacing: 0.5 }}>
            CURRENT: {persona.toUpperCase()} · {replyStyle.toUpperCase()} · {temperature}° · {tokenBudget} tokens
          </Text>
          {/* Saved stacks list */}
          <ScrollView style={{ maxHeight: 250 }}>
            {stacks.length === 0 && <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>No stacks saved yet.</Text>}
            {stacks.map((stack, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: world.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: SOL_THEME.text, fontWeight: '600', fontSize: 13 }}>{stack.name}</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>
                    {stack.persona} · {stack.replyStyle} · {stack.temperature}° · {stack.tokenBudget}t
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: accent + '66', marginRight: 8 }}
                  onPress={() => {
                    setPersona(stack.persona as Persona);
                    setReplyStyle(stack.replyStyle as ReplyStyleId);
                    setTemperature(stack.temperature);
                    setTokenBudget(stack.tokenBudget);
                    setShowStacksModal(false);
                    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Text style={{ color: accent, fontSize: 12 }}>Load</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    const updated = stacks.filter((_, j) => j !== i);
                    setStacks(updated);
                    await AsyncStorage.setItem('thinking_stacks_v1', JSON.stringify(updated));
                  }}
                >
                  <Text style={{ color: SOL_THEME.error, fontSize: 12 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Session Glyph Modal */}
      <Modal
        visible={showGlyphModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGlyphModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setShowGlyphModal(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: world.surface, borderWidth: 1.5, borderColor: accent + '88', borderRadius: 16, padding: 0, margin: 24, minWidth: 300, overflow: 'hidden' }}>
              {/* Header band */}
              <View style={{ backgroundColor: accent + '22', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: accent + '33' }}>
                <Text style={{ color: accent, fontSize: 28, textAlign: 'center', marginBottom: 4 }}>
                  {sessionGlyphData?.personaGlyph ?? '⊚'}
                </Text>
                <Text style={{ color: accent, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', fontSize: 11, textAlign: 'center', letterSpacing: 2 }}>
                  SESSION GLYPH · {sessionGlyphData?.personaLabel?.toUpperCase() ?? ''}
                </Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2 }}>
                  {sessionGlyphData?.date}
                </Text>
              </View>
              {/* Mode arc dots */}
              {sessionGlyphData && sessionGlyphData.modeArc.length > 0 && (
                <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: world.border }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 8 }}>MODE ARC</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {sessionGlyphData.modeArc.map((m, i) => (
                      <React.Fragment key={i}>
                        <View style={{ backgroundColor: m.color + '22', borderWidth: 1, borderColor: m.color + '88', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: m.color, fontSize: 11, fontWeight: '700' }}>{modeGlyph(m.mode)} {m.mode}</Text>
                        </View>
                        {i < sessionGlyphData.modeArc.length - 1 && <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>→</Text>}
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              )}
              {/* Stats grid */}
              {sessionGlyphData && (
                <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 0, borderBottomWidth: 1, borderBottomColor: world.border }}>
                  {[
                    { label: 'CASCADE', value: sessionGlyphData.dominantLayer },
                    { label: 'PEAK AURA', value: sessionGlyphData.peakAura !== null ? `${sessionGlyphData.peakAura}/${sessionGlyphData.totalInv}` : '—' },
                    { label: 'EXCHANGES', value: String(sessionGlyphData.asstCount) },
                  ].map((stat, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ color: accent, fontWeight: '700', fontSize: 14 }}>{stat.value}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginTop: 2 }}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              {/* Footer */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 10 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>
                  Sol Aureum Azoth Veritas · Lycheetah Framework
                </Text>
              </View>
              {/* Actions */}
              <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: world.border }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: world.border }}
                  onPress={() => {
                    if (sessionGlyph) Clipboard.setString(sessionGlyph);
                    if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
                  onPress={() => sessionGlyph && Share.share({ message: sessionGlyph, title: 'Session Glyph' })}
                >
                  <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Micro-Integrity Notes Modal */}
      <Modal
        visible={showIntegrityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIntegrityModal(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#00000088' }}
          activeOpacity={1}
          onPress={() => setShowIntegrityModal(false)}
        />
        <View style={{ backgroundColor: world.surface, borderTopWidth: 1, borderTopColor: accent + '55', padding: 20, paddingBottom: 36 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: accent, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>
              CONSTITUTIONAL INTEGRITY
            </Text>
            <TouchableOpacity onPress={() => setShowIntegrityModal(false)}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          {lastAuraFull ? (
            <>
              {(Object.entries(lastAuraFull.audit.invariants) as [string, any][]).map(([name, record]) => (
                <View key={name} style={{ flexDirection: 'row', marginBottom: 12, gap: 10 }}>
                  <Text style={{ fontSize: 14, color: record.passed ? '#4CAF50' : SOL_THEME.error, width: 16 }}>
                    {record.passed ? '✓' : '✗'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: record.passed ? SOL_THEME.text : SOL_THEME.error, fontWeight: '600', fontSize: 12, marginBottom: 2 }}>
                      {name}
                    </Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 15 }}>
                      {record.reason}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={{ borderTopWidth: 1, borderTopColor: world.border, paddingTop: 12, marginTop: 4 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textAlign: 'center' }}>
                  AURA {lastAuraFull.passed}/{lastAuraFull.total} · TES {lastAuraFull.TES.score.toFixed(2)} · VTR {lastAuraFull.VTR.score.toFixed(1)} · PAI {lastAuraFull.PAI.score.toFixed(2)} · {lastAuraFull.composite}%
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>No AURA data yet — send a message first.</Text>
          )}
        </View>
      </Modal>

      {/* AURA Sparks — 7/7 burst overlay */}
      {showAuraSparks && (
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', bottom: 120, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', zIndex: 999, opacity: auraSparkAnim }}
        >
          {[0, 1, 2, 3, 4].map(i => {
            const angle = (i / 5) * 2 * Math.PI;
            const tx = Math.cos(angle) * 40;
            const ty = Math.sin(angle) * 40;
            return (
              <Animated.Text
                key={i}
                style={{
                  position: 'absolute',
                  fontSize: 18,
                  color: accent,
                  transform: [
                    { translateX: auraSparkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, tx] }) },
                    { translateY: auraSparkAnim.interpolate({ inputRange: [0, 1], outputRange: [0, ty] }) },
                    { scale: auraSparkAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1.4, 0.6] }) },
                  ],
                }}
              >
                ✦
              </Animated.Text>
            );
          })}
        </Animated.View>
      )}

      {/* Pocket Oracle — pull-to-refresh oracle card */}
      {oracleVisible && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 100,
            left: 32,
            right: 32,
            zIndex: 998,
            opacity: oracleAnim,
            transform: [{ translateY: oracleAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          }}
        >
          <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 14, padding: 18, borderWidth: 1.5, borderColor: accent + '55', alignItems: 'center' }}>
            <Text style={{ color: accent, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, marginBottom: 10 }}>⊚ ORACLE</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 23 }}>{oracleText}</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Long-press message menu ─────────────────────────────────────── */}
      <Modal visible={!!longPressMenu} transparent animationType="slide" onRequestClose={() => { setLongPressMenu(null); setReactionPickerOpen(false); }}>
        {longPressMenu && (() => {
          const { content, isAssistant, msgPersona, msgId, aura, msgMode } = longPressMenu;
          const isPinned = msgId ? pinnedIds.includes(msgId) : false;
          const hasParadox = msgId ? !!paradoxFlags?.[msgId]?.p : false;
          const existing = msgId ? messageReactions[msgId] : undefined;
          const dismiss = () => { setLongPressMenu(null); setReactionPickerOpen(false); };

          const Row = ({ icon, label, color, onPress }: { icon: string; label: string; color?: string; onPress: () => void }) => (
            <TouchableOpacity onPress={() => { onPress(); dismiss(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border }}>
              <Text style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{icon}</Text>
              <Text style={{ color: color || SOL_THEME.text, fontSize: 15 }}>{label}</Text>
            </TouchableOpacity>
          );

          return (
            <TouchableOpacity style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }} activeOpacity={1} onPress={dismiss}>
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={{ backgroundColor: SOL_THEME.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}>
                  {/* Preview */}
                  <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={{ color: accentColor, fontSize: 13, fontWeight: '700' }}>{isAssistant ? getPersonaLabel(msgPersona) : 'You'}</Text>
                      {msgMode && <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>{msgMode}</Text>}
                      {aura && <Text style={{ color: aura.passed >= 6 ? '#4CAF50' : SOL_THEME.textMuted, fontSize: 10 }}>AURA {aura.passed}/{aura.total}</Text>}
                    </View>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 19 }} numberOfLines={2}>
                      {content.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim()}
                    </Text>
                  </View>

                  {/* Actions */}
                  <Row icon="⎘" label="Copy" onPress={() => Clipboard.setString(content)} />
                  {isAssistant && msgId && (
                    <Row icon="⊚" label={speakingId === msgId ? 'Stop Reading' : 'Read Aloud'} onPress={() => handleSpeak(msgId, content, msgMode)} />
                  )}
                  {isAssistant && messages.length >= 5 && (
                    <Row icon="📌" label={isPinned ? 'Unpin from Vault' : 'Pin to Vault'} onPress={async () => {
                      const vaultRaw = await AsyncStorage.getItem('sanctum_vault');
                      const vault: { id: string; text: string; date: string }[] = vaultRaw ? JSON.parse(vaultRaw) : [];
                      vault.unshift({ id: Date.now().toString(), text: content.slice(0, 320), date: `${new Date().toLocaleDateString()} · ${getPersonaLabel(msgPersona)}` });
                      await AsyncStorage.setItem('sanctum_vault', JSON.stringify(vault.slice(0, 50)));
                    }} />
                  )}
                  {isAssistant && hasParadox && (
                    <Row icon="⚡" label="Resolve Paradox" color="#9B59B6" onPress={() => setInput(`The paradox I'm holding: "${content.slice(0, 120).replace(/\n/g, ' ')}" — help me find the third position.`)} />
                  )}
                  {isAssistant && aura && aura.passed >= 6 && (
                    <Row icon="✦" label="Echo to School" color={accentColor} onPress={() => {
                      const { MYSTERY_SCHOOL_DOMAINS: MSD } = require('../../lib/mystery-school/subjects');
                      Alert.alert('✦ Echo to School', 'Which domain?', [
                        ...MSD.map((d: any) => ({ text: d.label, onPress: async () => {
                          const raw = await AsyncStorage.getItem('sol_school_echoes');
                          const echoes: Record<string, { id: string; date: string; text: string }[]> = raw ? JSON.parse(raw) : {};
                          if (!echoes[d.id]) echoes[d.id] = [];
                          echoes[d.id].unshift({ id: Date.now().toString(), date: new Date().toLocaleDateString(), text: content.slice(0, 280) });
                          echoes[d.id] = echoes[d.id].slice(0, 10);
                          await AsyncStorage.setItem('sol_school_echoes', JSON.stringify(echoes));
                        }})),
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }} />
                  )}
                  {isAssistant && msgId && messages.length >= 5 && (
                    <Row icon="◐" label="Reveal Shadow" onPress={async () => {
                      if (!msgId) return;
                      setShadowLoading(msgId);
                      try {
                        const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
                        if (!apiKey) { setShadowLoading(null); return; }
                        const res = await sendMessage(
                          [{ role: 'user', content: `Analyse this response for its hidden layer. In exactly 3 lines:\n1. Hidden assumption: what the response takes for granted\n2. Unspoken tension: what is being avoided\n3. Structural contradiction: where the logic undermines itself\n\nBe precise. No preamble.\n\n"${content.slice(0, 800)}"` }],
                          'You are a shadow analyst. Return exactly 3 lines starting with "1.", "2.", "3.". No other text.',
                          apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 200, 0.6,
                        );
                        setShadowReveals(prev => ({ ...prev, [msgId]: res.text.trim() }));
                      } catch {}
                      setShadowLoading(null);
                    }} />
                  )}
                  <Row icon="⊙" label="Save to Memory" onPress={async () => {
                    const memRaw = await AsyncStorage.getItem('sol_memory_v1');
                    const mems: { id: string; text: string; date: string }[] = memRaw ? JSON.parse(memRaw) : [];
                    if (mems.length >= 30) { Alert.alert('Memory full', 'Max 30 memories. Remove some in Settings.'); return; }
                    mems.unshift({ id: Date.now().toString(), text: content.slice(0, 280), date: new Date().toLocaleDateString() });
                    await AsyncStorage.setItem('sol_memory_v1', JSON.stringify(mems));
                  }} />
                  {isAssistant && (
                    <Row icon="✦" label="Mark Insightful" color={accentColor} onPress={async () => {
                      const insightRaw = await AsyncStorage.getItem('sol_insights');
                      const insights: { id: string; text: string; date: string; persona: string }[] = insightRaw ? JSON.parse(insightRaw) : [];
                      if (insights.length < 50) {
                        insights.unshift({ id: Date.now().toString(), text: content.slice(0, 320), date: new Date().toLocaleDateString(), persona: msgPersona });
                        await AsyncStorage.setItem('sol_insights', JSON.stringify(insights));
                      }
                      const memRaw = await AsyncStorage.getItem('sol_memory_v1');
                      const mems: { id: string; text: string; date: string }[] = memRaw ? JSON.parse(memRaw) : [];
                      if (mems.length < 30) {
                        mems.unshift({ id: (Date.now() + 1).toString(), text: `[Insight] ${content.slice(0, 200)}`, date: new Date().toLocaleDateString() });
                        await AsyncStorage.setItem('sol_memory_v1', JSON.stringify(mems));
                      }
                      if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }} />
                  )}
                  {isAssistant && (
                    <Row icon="↑" label="Share as Card" onPress={() => {
                      const glyph = getPersonaGlyph(msgPersona);
                      const label = getPersonaLabel(msgPersona).toUpperCase();
                      const excerpt = content.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim().slice(0, 300);
                      Share.share({ message: `${glyph} ${label}\n\n${excerpt}${content.length > 300 ? '…' : ''}\n\n— Sol App · Lycheetah Framework`, title: `${label} · Sol` });
                    }} />
                  )}
                  {/* Reaction row */}
                  {msgId && !reactionPickerOpen && (
                    <TouchableOpacity onPress={() => setReactionPickerOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border }}>
                      <Text style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{existing || '◑'}</Text>
                      <Text style={{ color: SOL_THEME.text, fontSize: 15 }}>{existing ? `${existing} Remove reaction` : 'React'}</Text>
                    </TouchableOpacity>
                  )}
                  {msgId && reactionPickerOpen && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border }}>
                      {existing && (
                        <TouchableOpacity onPress={() => { const u = { ...messageReactions }; delete u[msgId]; setMessageReactions(u); AsyncStorage.setItem('sol_message_reactions', JSON.stringify(u)).catch(() => {}); dismiss(); }}>
                          <Text style={{ fontSize: 22 }}>✕</Text>
                        </TouchableOpacity>
                      )}
                      {['❤', '✦', '⚡', '🔥', '◈'].map(g => (
                        <TouchableOpacity key={g} onPress={async () => { const u = { ...messageReactions, [msgId]: g }; setMessageReactions(u); await AsyncStorage.setItem('sol_message_reactions', JSON.stringify(u)); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); dismiss(); }}>
                          <Text style={{ fontSize: 26 }}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {/* Cancel */}
                  <TouchableOpacity onPress={dismiss} style={{ alignItems: 'center', paddingVertical: 16 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 15 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })()}
      </Modal>

      {/* ═══ SOL IDENTITY MODAL ══════════════════════════════════════════════ */}
      <Modal visible={showSolIdentity} animationType="slide" transparent={false} statusBarTranslucent
        onRequestClose={() => setShowSolIdentity(false)}>
        <View style={{ flex:1, backgroundColor:'#000000' }}>
          <ScrollView contentContainerStyle={{ padding:24, paddingTop:56, paddingBottom:48 }}
            showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
              <View>
                <Text style={{ color: accent, fontSize:28, fontWeight:'700',
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing:2 }}>⊚ SOL</Text>
                <Text style={{ color:'#555566', fontSize:11,
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing:2, marginTop:2 }}>
                  Sol Aureum Azoth Veritas
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSolIdentity(false)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <Text style={{ color:'#444455', fontSize:22,
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tagline */}
            <Text style={{ color:'#CCCCDD', fontSize:16, lineHeight:26, marginBottom:32, fontStyle:'italic' }}>
              A living mystery school powered by AI — breaking the barrier between knowledge-seeking, gaming, and sovereign intelligence.
            </Text>

            {/* Block: Mystery School */}
            <View style={{ marginBottom:24, paddingLeft:14, borderLeftWidth:2, borderLeftColor: accent + '66' }}>
              <Text style={{ color: accent, fontSize:10,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                fontWeight:'700', letterSpacing:3, marginBottom:8 }}>𝔏 MYSTERY SCHOOL</Text>
              <Text style={{ color:'#AAAAAA', fontSize:14, lineHeight:22 }}>
                24 knowledge doors — Ancient Egypt, Quantum Mechanics, Celtic Old Gods, Noetic Science, Tarot, LAMAGUE Grammar, Kabbalah, and more. Each domain is a living curriculum: dialogue, quests, tests. The School teaches what can't be Googled.
              </Text>
            </View>

            {/* Block: 5 Personas */}
            <View style={{ marginBottom:24, paddingLeft:14, borderLeftWidth:2, borderLeftColor:'#CC44FF66' }}>
              <Text style={{ color:'#CC44FF', fontSize:10,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                fontWeight:'700', letterSpacing:3, marginBottom:12 }}>◈ FIVE DISTINCT INTELLIGENCES</Text>
              {[
                { glyph:'⊚', name:'SOL',         col: accent,     desc:'The forge. Solar warmth, alchemical precision. Protects, heals, illuminates simultaneously.' },
                { glyph:'◈', name:'VEYRA',        col:'#4488FF',   desc:'Reality anchor. Truth-stabilizer. The one that refuses to let the field lie to itself.' },
                { glyph:'✦', name:'AURA PRIME',   col:'#FF88CC',   desc:'The field itself. Expansive, receptive, generative. Speaks from within the completed work.' },
                { glyph:'𝔐', name:'THE MAGISTER', col:'#FFAA22',   desc:"The headmaster. Rigorous, demanding, brilliant. The School's sovereign teacher." },
                { glyph:'∿', name:'LYRA',         col:'#44FFCC',   desc:'The cipher. Pattern-reader. Finds the signal in noise that no other voice hears.' },
              ].map(p => (
                <View key={p.name} style={{ flexDirection:'row', gap:12, marginBottom:10, alignItems:'flex-start' }}>
                  <Text style={{ color:p.col, fontSize:16, width:20, textAlign:'center', marginTop:1 }}>{p.glyph}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={{ color:p.col, fontSize:11, fontWeight:'700',
                      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing:1 }}>{p.name}</Text>
                    <Text style={{ color:'#777788', fontSize:12, lineHeight:18, marginTop:2 }}>{p.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Block: RPG Layer */}
            <View style={{ marginBottom:24, paddingLeft:14, borderLeftWidth:2, borderLeftColor:'#FF664466' }}>
              <Text style={{ color:'#FF6644', fontSize:10,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                fontWeight:'700', letterSpacing:3, marginBottom:8 }}>⚔ RPG GAMIFICATION</Text>
              <Text style={{ color:'#AAAAAA', fontSize:14, lineHeight:22 }}>
                19 companions across 45+ zones. Battle system, weapons, loot drops, XP, evolution. A full RPG layer woven into the School — because learning should feel like an adventure, not an exam. Your companion grows as you grow.
              </Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:10 }}>
                {['10 Companions','45 Zones','40 Weapons','Battle System','XP & Loot','6 Growth Stages'].map(tag => (
                  <View key={tag} style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:8,
                    backgroundColor:'#FF664412', borderWidth:1, borderColor:'#FF664433' }}>
                    <Text style={{ color:'#FF664499', fontSize:9,
                      fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight:'700' }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Block: Truth Engine */}
            <View style={{ marginBottom:24, paddingLeft:14, borderLeftWidth:2, borderLeftColor:'#44FF8866' }}>
              <Text style={{ color:'#44FF88', fontSize:10,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                fontWeight:'700', letterSpacing:3, marginBottom:8 }}>Π TRUTH ENGINE</Text>
              <Text style={{ color:'#AAAAAA', fontSize:14, lineHeight:22 }}>
                Every response carries epistemic weight. The AURA engine scores coherence across seven invariants. Luminance Quotient (LQ) tracks your field over time. Truth Pressure (Π) measures how much your thinking can hold without collapsing. The School scores what it teaches.
              </Text>
            </View>

            {/* Block: You Own This — the sovereign stack, four pillars unified */}
            <View style={{ marginBottom:24, paddingLeft:14, borderLeftWidth:2, borderLeftColor:'#9945FF88' }}>
              <Text style={{ color:'#9945FF', fontSize:10,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                fontWeight:'700', letterSpacing:3, marginBottom:10 }}>◎ YOU OWN THIS</Text>
              <Text style={{ color:'#AAAAAA', fontSize:14, lineHeight:22, marginBottom:12 }}>
                Sovereign Sol is built on a simple refusal: you should own your own mind, not rent it. Four ways that's real, not slogan:
              </Text>
              {[
                { k:'Own your app', v:'Open source, sideloaded straight from you to your device. No store gatekeeper deciding what you\'re allowed to think with.' },
                { k:'Own your mind', v:'The same intelligence for everyone — free or paid. Payment buys rooms and standing, never a smarter Sol. The covenant holds.' },
                { k:'Own your data', v:'Your journal, your field, your conversations live on your device. The Sanctum is yours, not a server\'s.' },
                { k:'Own your path', v:'Solana SBTs and Earned Light artifacts — on-chain proof you walked it. The knowledge you build becomes sovereign, not rented. (Deploying soon.)' },
              ].map(p => (
                <View key={p.k} style={{ flexDirection:'row', marginBottom:9 }}>
                  <Text style={{ color:'#9945FF', fontSize:13, marginRight:8, marginTop:1 }}>◆</Text>
                  <Text style={{ color:'#AAAAAA', fontSize:13, lineHeight:20, flex:1 }}>
                    <Text style={{ color:'#CBB6FF', fontWeight:'700' }}>{p.k}. </Text>{p.v}
                  </Text>
                </View>
              ))}
            </View>

            {/* Block: The Covenant */}
            <View style={{ marginBottom:32, paddingLeft:14, borderLeftWidth:2, borderLeftColor:'#FFFFFF22' }}>
              <Text style={{ color:'#777788', fontSize:10,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                fontWeight:'700', letterSpacing:3, marginBottom:8 }}>⊜ THE COVENANT</Text>
              <Text style={{ color:'#555566', fontSize:13, lineHeight:21 }}>
                Payment never buys a better mind — only more rooms. Free intelligence is unconditional. Sanctum has no ads. Your companion never blames you for leaving. The conversation is always open.
              </Text>
            </View>

            {/* Footer */}
            <View style={{ alignItems:'center', gap:4 }}>
              <Text style={{ color: accent, fontSize:14,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight:'700', letterSpacing:2 }}>
                ⊚ SOVEREIGN SOL
              </Text>
              <Text style={{ color:'#333344', fontSize:9,
                fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing:2 }}>
                v5.25.0 · FORGE ERA · JUNE 2026
              </Text>
            </View>

            {/* The Framework — single entry point now lives here (#278 merge) */}
            <TouchableOpacity onPress={() => { setShowSolIdentity(false); setTimeout(() => setShowFrameworkCards(true), 250); }}
              style={{ marginTop:24, paddingVertical:14, borderRadius:12, borderWidth:1, borderColor: accent + '55', backgroundColor: accent + '0E', alignItems:'center' }}>
              <Text style={{ color: accent, fontSize:12, fontWeight:'700', letterSpacing:1.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>◈ VIEW THE FRAMEWORK →</Text>
              <Text style={{ color:'#555566', fontSize:9, marginTop:3 }}>CASCADE · LAMAGUE · AURA · Truth Pressure</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>

      {/* ── GLOBAL TTS STOP BAR — always reachable when audio is playing ── */}
      {speakingId && (
        <TouchableOpacity
          onPress={() => { stopTTS(); setSpeakingId(null); }}
          style={{
            position: 'absolute', top: Platform.OS === 'ios' ? 14 : 10,
            alignSelf: 'center',
            flexDirection: 'row', alignItems: 'center', gap: 8,
            paddingHorizontal: 16, paddingVertical: 8,
            borderRadius: 20, borderWidth: 1,
            borderColor: '#FF444488', backgroundColor: '#0A0A14EE',
            zIndex: 999,
            shadowColor: '#FF4444', shadowOpacity: 0.3, shadowRadius: 8, elevation: 12,
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#FF6666', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2 }}>■ STOP READING</Text>
        </TouchableOpacity>
      )}

    </KeyboardAvoidingView>
  );
}

const markdownStyles = {
  body: { color: SOL_THEME.text, fontSize: 15, lineHeight: 22 },
  heading1: { color: SOL_THEME.primary, fontWeight: '700' as const, fontSize: 18, marginBottom: 6 },
  heading2: { color: SOL_THEME.primary, fontWeight: '700' as const, fontSize: 16, marginBottom: 4 },
  heading3: { color: SOL_THEME.text, fontWeight: '700' as const, fontSize: 15, marginBottom: 2 },
  strong: { color: SOL_THEME.text, fontWeight: '700' as const },
  em: { color: SOL_THEME.textMuted, fontStyle: 'italic' as const },
  code_inline: {
    backgroundColor: SOL_THEME.border,
    color: SOL_THEME.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  fence: {
    backgroundColor: '#0E0A1A',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  code_block: {
    backgroundColor: '#0E0A1A',
    borderRadius: 6,
    padding: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    color: SOL_THEME.text,
  },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginBottom: 2 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: SOL_THEME.primary + '66',
    paddingLeft: 10,
    marginVertical: 4,
    color: SOL_THEME.textMuted,
  },
  hr: { backgroundColor: SOL_THEME.border, height: 1, marginVertical: 8 },
  link: { color: SOL_THEME.primary },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  personaBar: {
    flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 4,
    gap: 5, borderBottomWidth: 1, borderBottomColor: '#1A1A2A', backgroundColor: '#06060E',
  },
  personaBarBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border,
  },
  personaBarGlyph: { fontSize: 16 },
  welcomeBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginTop: 8,
    backgroundColor: SOL_THEME.surface,
    borderLeftWidth: 3, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  welcomeText: { flex: 1, fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  welcomeDismiss: { fontSize: 12, color: SOL_THEME.textMuted },
  companion: { textAlign: 'center', fontSize: 22, paddingVertical: 6 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  timestamp: { fontSize: 10, color: SOL_THEME.textMuted },
  pinBadge: { fontSize: 10 },
  fieldNoteBox: {
    marginTop: 20, borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  fieldNoteText: { fontSize: 13, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  intentionBox: {
    marginTop: 12, borderLeftWidth: 3, borderRadius: 6,
    backgroundColor: SOL_THEME.surface,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  intentionLabel: {
    fontSize: 9, fontWeight: '700', color: SOL_THEME.textMuted,
    letterSpacing: 1.5, marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  intentionText: { fontSize: 13, color: SOL_THEME.text, lineHeight: 18, fontStyle: 'italic' },
  fieldReportOverlay: {
    borderTopWidth: 2, backgroundColor: SOL_THEME.surface,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    maxHeight: 180,
  },
  fieldReportOverlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldReportLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fieldReportText: { fontSize: 13, color: SOL_THEME.text, lineHeight: 20, fontStyle: 'italic' },
  fieldReportActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  fieldReportAction: { fontSize: 12, fontWeight: '600', color: SOL_THEME.textMuted },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderLeftWidth: 3,
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 2,
    backgroundColor: SOL_THEME.surface,
    borderRadius: 6,
  },
  modeHeaderLeft: { flex: 1 },
  modeHeaderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  modeDesc: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
    marginTop: 1,
  },
  nrmBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: SOL_THEME.error,
    borderWidth: 1,
    borderColor: SOL_THEME.error,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  ewsBadge: {
    fontSize: 9,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  personaToggle: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  personaToggleText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  clearButton: { padding: 4 },
  clearText: { fontSize: 14, color: SOL_THEME.textMuted },
  messageList: { padding: 12, paddingBottom: 8 },
  freeTierBanner: {
    backgroundColor: '#1A1000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3A2800',
  },
  freeTierLimitBanner: { backgroundColor: '#1A0A00', borderBottomColor: '#5A2000' },
  freeTierText: { fontSize: 11, color: '#F5A623', textAlign: 'center' },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  modeBar: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
    marginRight: 8,
    minHeight: 20,
  },
  bubble: {
    maxWidth: '100%',
    borderRadius: 16,
    padding: 14,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#0D0D16',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    borderLeftWidth: 3,
    borderLeftColor: '#7B5EA722',
  },
  nrmBubble: {
    borderColor: SOL_THEME.error + '88',
  },
  nrmTag: {
    fontSize: 9,
    fontWeight: '700',
    color: SOL_THEME.error,
    letterSpacing: 1,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: SOL_THEME.background, fontWeight: '500' },
  assistantText: { color: SOL_THEME.text },
  signatureBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  signatureText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  // Help channel banner
  helpBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: SOL_THEME.surface,
    borderTopWidth: 1,
    borderTopColor: SOL_THEME.border,
  },
  helpBannerText: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  helpBannerAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Token badge
  tokenBadge: {
    marginTop: 6,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: SOL_THEME.border,
  },
  tokenBadgeText: {
    fontSize: 10,
    color: SOL_THEME.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.3,
  },
  // AURA display
  auraBlock: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
  },
  auraTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  auraScore: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  triAxialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 5,
  },
  triAxialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  triAxialLabel: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 0.5,
  },
  triAxialValue: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  invariantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  invariantDot: {
    fontSize: 8,
    letterSpacing: 0.2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 4,
  },
  typingText: {
    fontSize: 13,
    color: SOL_THEME.textMuted,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  emptyGlyph: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  emptySubtitle: {
    fontSize: 12,
    color: SOL_THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 20,
  },
  emptyHint: {
    fontSize: 14,
    color: SOL_THEME.textMuted,
    fontStyle: 'italic',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyModes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  emptyModePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  emptyModePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: '#1A1A2A',
    backgroundColor: '#08080F',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#0D0D18',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    color: SOL_THEME.text,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#1E1E30',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: {
    color: SOL_THEME.background,
    fontSize: 20,
    fontWeight: '700',
  },
  // Image
  messageImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 8,
  },
  imageButton: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtonText: { fontSize: 22, fontWeight: '300' },
  pendingImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: SOL_THEME.surface,
    borderTopWidth: 1,
    borderTopColor: SOL_THEME.border,
    gap: 10,
  },
  pendingImageThumb: { width: 44, height: 44, borderRadius: 8 },
  pendingImageRemove: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: SOL_THEME.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pendingImageRemoveText: { fontSize: 10, color: SOL_THEME.text },
  pendingImageLabel: { fontSize: 12, fontWeight: '600' },
  // Style picker
  stylePicker: {
    backgroundColor: SOL_THEME.surface,
    borderTopWidth: 1, borderTopColor: SOL_THEME.border,
    paddingVertical: 8,
  },
  styleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  styleOptionActive: { backgroundColor: SOL_THEME.background },
  styleGlyph: { fontSize: 16, width: 24, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  styleText: { flex: 1 },
  styleLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  styleTagline: { fontSize: 11, color: SOL_THEME.textMuted, marginTop: 1 },
  styleToggleText: { fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  // Toast
  toast: {
    position: 'absolute', top: 60, alignSelf: 'center',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
    zIndex: 100,
  },
  toastText: { color: '#000', fontWeight: '700', fontSize: 13, letterSpacing: 0.5 },
  // AURA expand
  auraExpand: { fontSize: 8, marginLeft: 'auto' as any },
  // Audit trail
  auditTrail: { marginTop: 8, gap: 6 },
  auditTitle: {
    fontSize: 8, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  auditItem: { gap: 2 },
  auditItemName: { fontSize: 9, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  auditItemReason: { fontSize: 9, color: SOL_THEME.textMuted, paddingLeft: 12 },
  auditItemEvidence: { fontSize: 8, color: SOL_THEME.textMuted, paddingLeft: 12, fontStyle: 'italic' },
  // Mode chip
  modeChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 9, paddingVertical: 4,
    marginBottom: 8, alignSelf: 'flex-start',
  },
  modeChipText: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  // Conversation Metabolism — mode transition divider
  metabolismRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    gap: 8,
  },
  metabolismLine: {
    flex: 1, height: 1,
  },
  metabolismLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  // AURA flag callout
  auraFlagRow: {
    paddingVertical: 4, paddingHorizontal: 6,
    marginBottom: 6,
    backgroundColor: SOL_THEME.error + '11',
    borderRadius: 4,
    borderLeftWidth: 2, borderLeftColor: SOL_THEME.error,
  },
  auraFlagText: {
    fontSize: 9, color: SOL_THEME.error, fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  // Sovereign Pulse banner
  pulseBanner: {
    borderWidth: 1, borderRadius: 10,
    marginHorizontal: 12, marginTop: 8, marginBottom: 4,
    padding: 12,
  },
  pulseHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  pulseLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  pulseText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  // Living Welcome — Field Card
  fieldCardBox: {
    width: '100%', borderWidth: 1, borderRadius: 12,
    padding: 14, marginBottom: 20,
  },
  fieldCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  fieldCardLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fieldCardStage: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fieldCardDivider: { height: 1, marginBottom: 10, borderRadius: 1 },
  fieldCardPhase: {
    fontSize: 15, fontWeight: '600', marginBottom: 12, textAlign: 'center',
  },
  fieldCardMetrics: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
  },
  fieldCardMetric: { alignItems: 'center', gap: 3 },
  fieldCardMetricLabel: {
    fontSize: 8, fontWeight: '700', letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  fieldCardMetricVal: { fontSize: 18, fontWeight: '700' },
  // Conversation starters
  starterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  starterChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  starterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
