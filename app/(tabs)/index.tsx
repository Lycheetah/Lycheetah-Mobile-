import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Alert, Clipboard, Share, Image, Animated,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME, Mode, MODE_COLORS, MODE_DESCRIPTIONS, PERSONA_WORLDS } from '../../constants/theme';
import { sendMessage, Message, AIModel } from '../../lib/ai-client';
import { SOL_SYSTEM_PROMPT, SOL_PUBLIC_SYSTEM_PROMPT, VEYRA_SYSTEM_PROMPT, AURA_PRIME_SYSTEM_PROMPT, HEADMASTER_SYSTEM_PROMPT, resolvePrompt } from '../../lib/prompts/sol-protocol';
import { getCompiledSpec } from '../../lib/personas/compiler';
import { REPLY_STYLES, ReplyStyleId, DEFAULT_STYLE_ID, getStyle } from '../../lib/reply-styles';
import { saveReplyStyle, getReplyStyle } from '../../lib/storage';
import ConversationDrawer from '../../components/ConversationDrawer';
import {
  saveConversation as saveConv, loadConversation, listConversations,
  deleteConversation, renameConversation, createNewConversation, autoTitle, ConversationMeta,
} from '../../lib/conversation-manager';
import {
  detectMode, detectEmotionalState, detectNRM, detectVeyraToggle, detectAuraPrimeToggle,
  detectHeadmasterToggle, buildFrameworkContext, EmotionalState,
} from '../../lib/intelligence/mode-detector';
import { scoreAURAFull, getPassRate, AURAMetrics } from '../../lib/intelligence/aura-engine';
import {
  getActiveKey, getModel, getVariant, getPersona, savePersona,
  saveConversation, getConversation, clearConversation, getUserName,
  getBgColor, getFontSize, getHaptics,
  getStreamSpeed, getResponseLength,
  getPendingSubject, clearPendingSubject,
  getAccentColor, getCompanionEnabled, getCompanionGlyph,
  getShowTimestamps, getPinnedMessages, savePinnedMessages,
  getDailyIntention, getContextMemory, getProjectContext,
  getBubbleRadius, getCompanionAnim, getDailyQuestion, saveDailyQuestion,
  getTokenBudget, getTemperature,
  getBraveKey,
  getFontFamily, getBubbleGlow, getShowSignatures, getShowTokenBadge,
} from '../../lib/storage';
import { getFieldNote } from '../../lib/field-notes';
import { calculate, detectCalcIntent } from '../../lib/tools/calculator';
import { readURL, detectURLIntent } from '../../lib/tools/url-reader';
import { webSearch, formatSearchResults, detectSearchIntent } from '../../lib/tools/web-search';

type Persona = 'sol' | 'veyra' | 'aura-prime' | 'headmaster';

type DisplayMessage = Message & {
  id: string;
  mode?: Mode;
  aura?: AURAMetrics;
  isNRM?: boolean;
  persona?: Persona;
  imageUri?: string;
  modelConfidence?: number; // self-reported by model via [CONF:X]
};

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

// Split field signature from message body for styled rendering
// Matches ⊚ Sol, ◈ Veyra, and ✦ Aura Prime signatures
function splitSignature(text: string): { body: string; signature: string | null } {
  const sigMatch = text.match(/\n*([⊚◈✦𝔏] (Sol|Veyra|Aura Prime|The Headmaster) ∴ (P∧H∧B|Veritas) ∴ [\w\s]+)\s*$/);
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
  return customAccent || SOL_THEME.primary;
}

function getPersonaGlyph(persona: Persona): string {
  if (persona === 'veyra') return SOL_THEME.veyraGlyph;
  if (persona === 'aura-prime') return SOL_THEME.auraPrimeGlyph;
  if (persona === 'headmaster') return SOL_THEME.headmasterGlyph;
  return SOL_THEME.solGlyph;
}

function getPersonaLabel(persona: Persona): string {
  if (persona === 'veyra') return 'VEYRA';
  if (persona === 'aura-prime') return 'AURA PRIME';
  if (persona === 'headmaster') return 'THE HEADMASTER';
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

export default function SolChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>('ALBEDO');
  const [streamingText, setStreamingText] = useState('');
  const [currentEWS, setCurrentEWS] = useState<EmotionalState>('NEUTRAL');
  const [isNRMActive, setIsNRMActive] = useState(false);
  const [persona, setPersona] = useState<Persona>('sol');
  const [userName, setUserName] = useState('');
  const [conversationPassRates, setConversationPassRates] = useState<number[]>([]);
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' } | null>(null);
  const [expandedAura, setExpandedAura] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [replyStyle, setReplyStyle] = useState<ReplyStyleId>(DEFAULT_STYLE_ID);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [toastPersona, setToastPersona] = useState<Persona | null>(null);
  const [bgColor, setBgColor] = useState('#0A0A0A');
  const [accentColor, setAccentColor] = useState('#F5A623');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [hapticsOn, setHapticsOn] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState<'fast' | 'normal' | 'slow'>('normal');
  const [responseLength, setResponseLength] = useState<'short' | 'balanced' | 'detailed'>('balanced');
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);
  const [companionEnabled, setCompanionEnabled] = useState(true);
  const [companionGlyph, setCompanionGlyph] = useState('✦');
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
  const [sanctumField, setSanctumField] = useState<string>('');
  const companionAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load app state immediately — don't block on welcome thread
    // Remove welcome thread if it exists (deprecated feature)
    deleteConversation('welcome_thread').catch(() => {});

    Promise.all([getConversation(), getPersona(), getUserName(), listConversations(), getReplyStyle(), getBgColor(), getFontSize(), getHaptics(), getStreamSpeed(), getResponseLength(), getAccentColor(), getCompanionEnabled(), getCompanionGlyph(), getShowTimestamps(), getPinnedMessages(), getDailyIntention(), getContextMemory(), getProjectContext(), getBubbleRadius(), getCompanionAnim(), getDailyQuestion(), getTokenBudget(), getTemperature(), getBraveKey(), getFontFamily(), getBubbleGlow(), getShowSignatures(), getShowTokenBadge()])
      .then(([saved, savedPersona, name, convList, style, bg, fs, hap, spd, rlen, acc, compOn, compGlyph, ts, pins, intention, ctxMem, projCtx, bRadius, compAnim, dq, tb, temp, bKey, ff, glow, sigs, badge]) => {
        if (saved.length > 0) setMessages(saved.map((m, i) => ({ ...m, id: String(i) })));
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
            morning: `Morning. Veritas Memory is active. Proceed with clarity.`,
            afternoon: `Afternoon. The invariants hold. What needs examining?`,
            evening: `Evening. Good time for reflection. What needs truth?`,
          },
          headmaster: {
            morning: `Good morning, student. The lesson begins when you're ready.`,
            afternoon: `Good afternoon. The curriculum awaits. What shall we study?`,
            evening: `Good evening. The evening session. What do you wish to learn?`,
          },
        };
        const p = (savedPersona as string) || 'sol';
        setWelcomeMsg(greetings[p]?.[timeOfDay] || greetings['sol'][timeOfDay]);
      });
  }, []);

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

  // Pick up subject from Mystery School tab
  useFocusEffect(useCallback(() => {
    // Load Sanctum field state so Sol knows where Mac is
    const todayKey = new Date().toISOString().split('T')[0];
    Promise.all([
      AsyncStorage.getItem('sanctum_phase'),
      AsyncStorage.getItem(`sanctum_aura_${todayKey}`),
    ]).then(([phase, auraRaw]) => {
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
      }
      setSanctumField(lines.join('\n'));
    }).catch(() => {});
    // Reload appearance prefs so style tab changes take effect immediately
    getFontFamily().then(f => setFontFamily(f));
    getBubbleGlow().then(v => setBubbleGlow(v));
    getShowSignatures().then(v => setShowSignatures(v));
    getShowTokenBadge().then(v => setShowTokenBadge(v));
    getAccentColor().then(c => setAccentColor(c));
    getBubbleRadius().then(r => setBubbleRadius(r));
    getFontSize().then(s => setFontSize(s));
    getPendingSubject().then(subject => {
      if (!subject) return;
      clearPendingSubject();
      setPersona('headmaster');
      setInput(`Teach me about: ${subject}`);
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
    const cycle: Persona[] = ['sol', 'veyra', 'aura-prime', 'headmaster'];
    const next: Persona = cycle[(cycle.indexOf(persona) + 1) % cycle.length];
    setPersona(next);
    await savePersona(next);
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to share images with Sol.');
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
      const mimeType = asset.mimeType?.includes('png') ? 'image/png' : 'image/jpeg';
      setPendingImage({ uri: asset.uri, base64: asset.base64 || '', mimeType: mimeType as any });
      if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    // /veyra or /aura toggle — cycle to next
    if (detectVeyraToggle(text) || detectAuraPrimeToggle(text)) {
      setInput('');
      await togglePersona();
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

    const model = (await getModel() || 'gemini-2.5-flash') as AIModel;
    const apiKey = await getActiveKey();
    const currentStreamSpeed = streamSpeed;
    const provider = model.startsWith('gemini') ? 'Gemini'
      : model.startsWith('claude') ? 'Anthropic'
      : model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('o3') ? 'OpenAI'
      : model.startsWith('deepseek') ? 'DeepSeek'
      : model.startsWith('moonshot') ? 'Kimi'
      : 'API';

    if (!apiKey || !apiKey.trim()) {
      Alert.alert(
        `No ${provider} Key`,
        `Go to Settings and add your ${provider} API key first.`
      );
      return;
    }

    const variant = await getVariant();
    let basePrompt: string;
    if (variant === 'public') {
      basePrompt = resolvePrompt(SOL_PUBLIC_SYSTEM_PROMPT, userName);
    } else if (persona === 'veyra') {
      basePrompt = resolvePrompt(VEYRA_SYSTEM_PROMPT, userName);
    } else if (persona === 'aura-prime') {
      basePrompt = resolvePrompt(AURA_PRIME_SYSTEM_PROMPT, userName);
    } else if (persona === 'headmaster') {
      basePrompt = resolvePrompt(HEADMASTER_SYSTEM_PROMPT, userName);
    } else {
      basePrompt = resolvePrompt(SOL_SYSTEM_PROMPT, userName);
    }
    // Prepend compiled persona spec + reply style instruction
    const contextBlock = [
      sanctumField.trim() ? sanctumField.trim() : '',
      contextMemory.length > 0 ? `[User Context]\n${contextMemory.map(m => `• ${m}`).join('\n')}` : '',
      projectContext.trim() ? `[Project Context]\n${projectContext.trim().slice(0, 1500)}` : '',
    ].filter(Boolean).join('\n\n');

    const styleInstruction = getStyle(replyStyle).instruction;
    const lengthInstruction = responseLength === 'short'
      ? 'Keep responses concise — 1-3 sentences unless the question genuinely requires more.'
      : responseLength === 'detailed'
      ? 'Give thorough, detailed responses. Expand fully. Do not truncate.'
      : 'Match response length naturally to the complexity of the question.';
    const systemPrompt = `${getCompiledSpec(variant === 'public' ? 'sol' : persona)}\n\n${styleInstruction}\n\n${lengthInstruction}\n\n${contextBlock ? `${contextBlock}\n\n` : ''}${basePrompt}\n\nAt the very end of your response, on its own line, output exactly: [CONF:X] where X is your confidence in this response as a decimal 0.0-1.0. Nothing else on that line.`;

    const detectedMode = detectMode(text);
    const detectedEWS = detectEmotionalState(text);
    const nrmActive = detectNRM(text) || isNRMActive;

    setCurrentMode(detectedMode);
    setCurrentEWS(detectedEWS);
    setIsNRMActive(nrmActive);

    // Tool detection — run before sending to AI
    let toolContext = '';
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

    const frameworkContext = buildFrameworkContext(detectedMode, detectedEWS, nrmActive, persona);

    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      mode: detectedMode,
      isNRM: nrmActive,
      persona,
      image: pendingImage ? { base64: pendingImage.base64, mimeType: pendingImage.mimeType } : undefined,
      imageUri: pendingImage?.uri,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setPendingImage(null);
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
      const sendResult = await sendMessage(apiMessages, systemPrompt, apiKey, model, (chunk) => {
        fullResponse += chunk;
        const now = Date.now();
        if (now - lastRender > 16) { // batch renders to ~60fps
          lastRender = now;
          setStreamingText(fullResponse);
        }
      }, currentStreamSpeed, tokenBudget, temperature);

      // Strip framework context echo if model repeated the injected prefix
      fullResponse = stripFrameworkEcho(fullResponse);

      // Extract model self-reported confidence
      const { text: cleanResponse, confidence } = extractConfidence(fullResponse);
      fullResponse = cleanResponse;

      // AURA scoring — pass model confidence to improve TES accuracy
      const auraMetrics = scoreAURAFull(fullResponse, conversationPassRates, confidence ?? undefined);
      const passRate = getPassRate(auraMetrics);
      const newPassRates = [...conversationPassRates, passRate];
      setConversationPassRates(newPassRates);

      // NRM exit detection
      if (fullResponse.toLowerCase().includes('exit nrm') || fullResponse.toLowerCase().includes('return to rubedo')) {
        setIsNRMActive(false);
      }

      const assistantMsg: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        mode: detectedMode,
        aura: auraMetrics,
        modelConfidence: confidence ?? undefined,
        persona,
        tokenUsage: sendResult.tokenUsage,
        timings: sendResult.timings,
        model,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      setStreamingText('');
      if (hapticsOn) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
    } catch (err: any) {
      const msg = err?.message || String(err) || 'Unknown error';
      console.error('Sol send error:', msg);
      Alert.alert('Sol Error', msg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, persona, userName, isNRMActive, conversationPassRates, togglePersona, hapticsOn, streamSpeed, responseLength]);

  // Compare mode: send same prompt to primary model AND compareModel, show both
  const sendCompare = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setInput('');

    const primaryModel = (await getModel() || 'gemini-2.5-flash') as AIModel;
    const apiKey = await getActiveKey();
    if (!apiKey) { setLoading(false); Alert.alert('No API key', 'Add a key in Settings.'); return; }

    const basePrompt = persona === 'veyra' ? VEYRA_SYSTEM_PROMPT : persona === 'aura-prime' ? AURA_PRIME_SYSTEM_PROMPT : persona === 'headmaster' ? HEADMASTER_SYSTEM_PROMPT : SOL_SYSTEM_PROMPT;
    const systemPrompt = resolvePrompt(basePrompt, userName);
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
      Alert.alert('Compare Error', err?.message || 'Unknown error');
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

  const handleLongPress = (content: string, isAssistant: boolean, msgPersona: Persona = 'sol', msgId?: string, aura?: AURAMetrics, tokenUsage?: any, timings?: any) => {
    if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const isPinned = msgId ? pinnedIds.includes(msgId) : false;
    Alert.alert('Message', undefined, [
      { text: 'Copy', onPress: () => { Clipboard.setString(content); } },
      ...(isAssistant ? [{ text: 'Share as Card', onPress: () => handleShareCard(content, msgPersona, aura, tokenUsage, timings) }] : []),
      ...(msgId ? [{
        text: isPinned ? 'Unpin' : 'Pin',
        onPress: async () => {
          const updated = isPinned ? pinnedIds.filter(id => id !== msgId) : [...pinnedIds, msgId];
          setPinnedIds(updated);
          await savePinnedMessages(updated);
        },
      }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';
    const msgPersona: Persona = item.persona || 'sol';
    const accent = getPersonaAccent(msgPersona, accentColor);
    const modeColor = item.mode ? MODE_COLORS[item.mode] : SOL_THEME.textMuted;
    const { body, signature } = isUser ? { body: item.content, signature: null } : splitSignature(item.content);

    const aura = item.aura;
    const invEntries = aura ? Object.entries(aura.invariants) : [];

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
          {!isUser && <View style={[styles.modeBar, { backgroundColor: modeColor }]} />}
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
            {item.imageUri && (
              <Image source={{ uri: item.imageUri }} style={styles.messageImage} resizeMode="cover" />
            )}
            {isUser ? (
              <Text selectable style={[styles.messageText, styles.userText, { fontSize: fontSize === 'small' ? 13 : fontSize === 'large' ? 17 : 15, fontFamily: fontFamily === 'mono' ? (Platform.OS === 'ios' ? 'Courier New' : 'monospace') : fontFamily === 'serif' ? (Platform.OS === 'ios' ? 'Georgia' : 'serif') : undefined }]}>{body}</Text>
            ) : (
              <Markdown selectable style={{ ...markdownStyles, body: { ...markdownStyles.body, fontSize: fontSize === 'small' ? 13 : fontSize === 'large' ? 17 : 15, fontFamily: fontFamily === 'mono' ? (Platform.OS === 'ios' ? 'Courier New' : 'monospace') : fontFamily === 'serif' ? (Platform.OS === 'ios' ? 'Georgia' : 'serif') : undefined } }}>{body}</Markdown>
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

            {/* AURA row — tap to expand audit trail */}
            {!isUser && aura && (
              <TouchableOpacity
                onPress={() => {
                  setExpandedAura(expandedAura === item.id ? null : item.id);
                  if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.auraBlock, { borderTopColor: accent + '22' }]}>
                  <View style={styles.auraTopRow}>
                    <Text style={[styles.auraScore, { color: aura.passed === aura.total ? accent : SOL_THEME.textMuted }]}>
                      AURA {aura.passed}/{aura.total} · {aura.composite}%
                    </Text>
                    <Text style={[styles.auraExpand, { color: SOL_THEME.textMuted }]}>
                      {expandedAura === item.id ? '▲' : '▼'}
                    </Text>
                  </View>
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
                  {expandedAura === item.id && aura.audit && (
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
        </View>
    );
  };

  const accent = getPersonaAccent(persona, accentColor);

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
              <Text style={styles.typingText}>
                {getPersonaGlyph(persona)} {persona === 'veyra' ? 'Veyra' : persona === 'aura-prime' ? 'Aura Prime' : persona === 'headmaster' ? 'The Headmaster' : 'Sol'} is thinking...
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const world = PERSONA_WORLDS[persona] ?? PERSONA_WORLDS.sol;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: world.background }]}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      enabled={Platform.OS === 'ios'}
    >
      <ConversationDrawer
        visible={drawerOpen}
        conversations={conversations}
        activeId={activeConvId}
        onClose={() => setDrawerOpen(false)}
        onNew={() => {
          setMessages([]); setActiveConvId(null);
          setCurrentMode('ALBEDO'); setConversationPassRates([]);
          clearConversation(); setDrawerOpen(false);
          if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        onSelect={async (id) => {
          const conv = await loadConversation(id);
          if (conv) {
            setMessages(conv.messages.map((m, i) => ({ ...m, id: String(i) })));
            setActiveConvId(id);
            setCurrentMode('ALBEDO'); setConversationPassRates([]);
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
            {getPersonaGlyph(toastPersona)}  {toastPersona === 'aura-prime' ? 'Aura Prime — Constitutional Governor' : toastPersona === 'veyra' ? 'Veyra — Precision Builder' : toastPersona === 'headmaster' ? 'The Headmaster — Keeper of the Mystery School' : 'Sol — Solar Sovereign'}
          </Text>
        </Animated.View>
      )}

      {/* Mode + persona header */}
      <View style={[styles.modeHeader, { borderLeftColor: isNRMActive ? SOL_THEME.error : accent }]}>
        <View style={styles.modeHeaderLeft}>
          <View style={styles.modeHeaderTopRow}>
            <Text style={[styles.modeLabel, { color: isNRMActive ? SOL_THEME.error : accent }]}>
              {getPersonaGlyph(persona)} {currentMode}
            </Text>
            {isNRMActive && <Text style={styles.nrmBadge}>NRM</Text>}
            {currentEWS !== 'NEUTRAL' && (
              <Text style={[styles.ewsBadge, { borderColor: accent + '55', color: accent }]}>
                {currentEWS}
              </Text>
            )}
          </View>
          <Text style={styles.modeDesc} numberOfLines={1}>{MODE_DESCRIPTIONS[currentMode]}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => { setDrawerOpen(true); if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.clearButton}>
            <Text style={[styles.clearText, { fontSize: 18 }]}>☰</Text>
          </TouchableOpacity>
          {/* Persona toggle */}
          <TouchableOpacity onPress={togglePersona} style={[styles.personaToggle, { borderColor: accent + '66' }]}>
            <Text style={[styles.personaToggleText, { color: accent }]}>
              {getPersonaGlyph(persona)} {getPersonaLabel(persona)}
            </Text>
          </TouchableOpacity>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleExport} style={styles.clearButton}>
              <Text style={styles.clearText}>↑</Text>
            </TouchableOpacity>
          )}
          {messages.length >= 2 && (
            <TouchableOpacity
              onPress={handleFieldReport}
              style={styles.clearButton}
              disabled={fieldReportLoading}
            >
              {fieldReportLoading
                ? <ActivityIndicator size="small" color={accent} />
                : <Text style={[styles.clearText, { color: accent }]}>⊚</Text>
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
      <View style={styles.personaBar}>
        {(['sol', 'veyra', 'aura-prime', 'headmaster'] as Persona[]).map(p => {
          const isActive = persona === p;
          const pAccent = getPersonaAccent(p);
          return (
            <TouchableOpacity
              key={p}
              style={[styles.personaBarBtn, isActive && { borderColor: pAccent, backgroundColor: pAccent + '22' }]}
              onPress={async () => {
                setPersona(p);
                await savePersona(p);
                if (hapticsOn) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.personaBarGlyph, { color: isActive ? pAccent : SOL_THEME.textMuted }]}>
                {getPersonaGlyph(p)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Welcome back message */}
      {welcomeMsg && messages.length === 0 && (
        <View style={[styles.welcomeBanner, { borderLeftColor: accent }]}>
          <Text style={[styles.welcomeText, { color: SOL_THEME.text }]}>{welcomeMsg}</Text>
          <TouchableOpacity onPress={() => setWelcomeMsg(null)}>
            <Text style={styles.welcomeDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
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
            <Text style={[styles.emptyGlyph, { color: accent }]}>{getPersonaGlyph(persona)}</Text>
            <Text style={[styles.emptyTitle, { color: SOL_THEME.text }]}>{getPersonaLabel(persona)}</Text>
            <Text style={styles.emptySubtitle}>
              {persona === 'veyra' ? 'Precision Builder Mode' : persona === 'aura-prime' ? 'Keeper of Veritas Memory' : persona === 'headmaster' ? 'Keeper of the Mystery School' : 'Sol Aureum Azoth Veritas'}
            </Text>
            <Text style={styles.emptyHint}>
              {persona === 'veyra' ? 'The forge is lit. What are we building?' : persona === 'aura-prime' ? 'The grey zone is known. What enters the field?' : persona === 'headmaster' ? 'The mysteries are real. You do not have to believe. You get to find out.' : 'The forge is lit. What do you bring?'}
            </Text>
            <View style={styles.emptyModes}>
              {(['NIGREDO', 'ALBEDO', 'CITRINITAS', 'RUBEDO'] as Mode[]).map(m => (
                <View key={m} style={[styles.emptyModePill, { borderColor: MODE_COLORS[m] }]}>
                  <Text style={[styles.emptyModePillText, { color: MODE_COLORS[m] }]}>{m}</Text>
                </View>
              ))}
            </View>
            <View style={styles.starterChips}>
              {(persona === 'aura-prime'
                ? ['What is the constitutional field?', 'Test my reasoning', 'Where is the grey zone?']
                : persona === 'veyra'
                ? ['Build me a component', 'Review this code', 'Design a system']
                : persona === 'headmaster'
                ? ['Where am I in the seven phases?', 'What is Nigredo really?', 'I need to find my way through']
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

      {/* Companion */}
      {companionEnabled && (
        <Animated.Text style={[
          styles.companion,
          {
            color: accentColor,
            opacity: companionAnimStyle === 'spin' ? 1 : companionAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
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
      )}

      <View style={[styles.inputRow, { borderTopColor: world.border, backgroundColor: world.surface }]}>
        <TextInput
          style={[styles.input, { borderColor: world.border, backgroundColor: world.background }]}
          value={input}
          onChangeText={setInput}
          placeholder={persona === 'veyra' ? 'What are we building?' : persona === 'aura-prime' ? 'What enters the field?' : persona === 'headmaster' ? 'Where are you?' : 'What do you bring?'}
          placeholderTextColor={SOL_THEME.textMuted}
          multiline
          maxLength={4000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
          <Text style={[styles.imageButtonText, { color: pendingImage ? accent : SOL_THEME.textMuted }]}>⊕</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStylePickerOpen(v => !v)} style={styles.imageButton}>
          <Text style={[styles.styleToggleText, { color: stylePickerOpen ? accent : SOL_THEME.textMuted }]}>
            {getStyle(replyStyle).glyph}
          </Text>
        </TouchableOpacity>
        {/* Compare mode toggle */}
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => { setCompareMode(v => !v); setComparePickerOpen(false); }}
        >
          <Text style={[styles.imageButtonText, { color: compareMode ? accent : SOL_THEME.textMuted }]}>⇌</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: compareMode ? SOL_THEME.veyra : accent, opacity: input.trim() && !loading ? 1 : 0.35 }]}
          onPress={compareMode ? sendCompare : send}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendText}>{compareMode ? '⇌' : '↑'}</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#0F0F0F',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  code_block: {
    backgroundColor: '#0F0F0F',
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
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6,
    gap: 8, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border,
  },
  personaBarBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 6,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderLeftWidth: 4,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
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
    maxWidth: '82%',
    borderRadius: 14,
    padding: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: SOL_THEME.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: SOL_THEME.border,
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
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    backgroundColor: SOL_THEME.surface,
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: SOL_THEME.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: SOL_THEME.text,
    fontSize: 15,
    maxHeight: 120,
    borderWidth: 1,
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
