import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Alert, Clipboard, Share, Image, Animated,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { SOL_THEME, Mode, MODE_COLORS, MODE_DESCRIPTIONS } from '../../constants/theme';
import { sendMessage, Message, AIModel } from '../../lib/ai-client';
import { SOL_SYSTEM_PROMPT, SOL_PUBLIC_SYSTEM_PROMPT, VEYRA_SYSTEM_PROMPT, AURA_PRIME_SYSTEM_PROMPT, HEADMASTER_SYSTEM_PROMPT, resolvePrompt } from '../../lib/prompts/sol-protocol';
import { getCompiledSpec } from '../../lib/personas/compiler';
import { REPLY_STYLES, ReplyStyleId, DEFAULT_STYLE_ID, getStyle } from '../../lib/reply-styles';
import { saveReplyStyle, getReplyStyle } from '../../lib/storage';
import ConversationDrawer from '../../components/ConversationDrawer';
import {
  saveConversation as saveConv, loadConversation, listConversations,
  deleteConversation, createNewConversation, autoTitle, ConversationMeta,
} from '../../lib/conversation-manager';
import {
  detectMode, detectEmotionalState, detectNRM, detectVeyraToggle, detectAuraPrimeToggle,
  detectHeadmasterToggle, buildFrameworkContext, EmotionalState,
} from '../../lib/intelligence/mode-detector';
import { scoreAURAFull, getPassRate, AURAMetrics } from '../../lib/intelligence/aura-engine';
import {
  getActiveKey, getModel, getVariant, getPersona, savePersona,
  saveConversation, getConversation, clearConversation, getUserName,
} from '../../lib/storage';

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

function getPersonaAccent(persona: Persona): string {
  if (persona === 'veyra') return SOL_THEME.veyra;
  if (persona === 'aura-prime') return SOL_THEME.auraPrime;
  if (persona === 'headmaster') return SOL_THEME.headmaster;
  return SOL_THEME.primary;
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
  const toastAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Promise.all([getConversation(), getPersona(), getUserName(), listConversations(), getReplyStyle()])
      .then(([saved, savedPersona, name, convList, style]) => {
        if (saved.length > 0) setMessages(saved.map((m, i) => ({ ...m, id: String(i) })));
        setPersona(savedPersona as Persona);
        setUserName(name);
        setConversations(convList);
        setReplyStyle(style as ReplyStyleId);
      });
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

    const model = await getModel() as AIModel;
    const apiKey = await getActiveKey();
    const provider = model.startsWith('gemini') ? 'Gemini' : 'Anthropic';

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
    const styleInstruction = getStyle(replyStyle).instruction;
    const systemPrompt = `${getCompiledSpec(variant === 'public' ? 'sol' : persona)}\n\n${styleInstruction}\n\n${basePrompt}\n\nAt the very end of your response, on its own line, output exactly: [CONF:X] where X is your confidence in this response as a decimal 0.0-1.0. Nothing else on that line.`;

    const detectedMode = detectMode(text);
    const detectedEWS = detectEmotionalState(text);
    const nrmActive = detectNRM(text) || isNRMActive;

    setCurrentMode(detectedMode);
    setCurrentEWS(detectedEWS);
    setIsNRMActive(nrmActive);

    const frameworkContext = buildFrameworkContext(detectedMode, detectedEWS, nrmActive, persona);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
        return { role: m.role, content: `${frameworkContext}\n\n${m.content}` };
      }
      return { role: m.role, content: m.content };
    });

    try {
      let fullResponse = '';
      await sendMessage(apiMessages, systemPrompt, apiKey, model, (chunk) => {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      });

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
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      setStreamingText('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Save to conversation manager
      const model = await getModel();
      const convId = activeConvId || `${Date.now()}_init`;
      const title = autoTitle(finalMessages.map(m => ({ role: m.role, content: m.content })));
      const avgAura = finalMessages.filter(m => m.aura).reduce((a, m) => a + (m.aura?.composite || 0), 0) /
        Math.max(1, finalMessages.filter(m => m.aura).length);
      const conv = {
        id: convId, title, persona, model,
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
  }, [input, loading, messages, persona, userName, isNRMActive, conversationPassRates, togglePersona]);

  useEffect(() => {
    if (messages.length > 0 || streamingText) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, streamingText]);

  const handleLongPress = (content: string, isAssistant: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const options = ['Copy', isAssistant ? 'Share Response' : null, 'Cancel'].filter(Boolean) as string[];
    Alert.alert('Message', undefined, [
      { text: 'Copy', onPress: () => { Clipboard.setString(content); } },
      ...(isAssistant ? [{ text: 'Share', onPress: () => Share.share({ message: content, title: 'Sol Response' }) }] : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === 'user';
    const msgPersona: Persona = item.persona || 'sol';
    const accent = getPersonaAccent(msgPersona);
    const modeColor = item.mode ? MODE_COLORS[item.mode] : SOL_THEME.textMuted;
    const { body, signature } = isUser ? { body: item.content, signature: null } : splitSignature(item.content);

    const aura = item.aura;
    const invEntries = aura ? Object.entries(aura.invariants) : [];

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item.content, !isUser)}
        activeOpacity={0.9}
        delayLongPress={500}
      >
        <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
          {!isUser && <View style={[styles.modeBar, { backgroundColor: modeColor }]} />}
          <View style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: accent }]
              : [styles.assistantBubble, item.mode && { borderLeftColor: modeColor, borderLeftWidth: 2 }],
            item.isNRM && !isUser && styles.nrmBubble,
          ]}>
            {item.isNRM && !isUser && (
              <Text style={styles.nrmTag}>⚠ NRM ACTIVE</Text>
            )}
            {item.imageUri && (
              <Image source={{ uri: item.imageUri }} style={styles.messageImage} resizeMode="cover" />
            )}
            {isUser ? (
              <Text selectable style={[styles.messageText, styles.userText]}>{body}</Text>
            ) : (
              <Markdown style={markdownStyles}>{body}</Markdown>
            )}
            {signature && (
              <View style={[styles.signatureBlock, { borderTopColor: accent + '44' }]}>
                <Text style={[styles.signatureText, { color: accent }]}>{signature}</Text>
              </View>
            )}
            {/* AURA row — tap to expand audit trail */}
            {!isUser && aura && (
              <TouchableOpacity
                onPress={() => {
                  setExpandedAura(expandedAura === item.id ? null : item.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      </TouchableOpacity>
    );
  };

  const accent = getPersonaAccent(persona);

  const renderTypingIndicator = () => {
    if (!loading && !streamingText) return null;
    const { body, signature } = splitSignature(streamingText);
    return (
      <View style={styles.messageRow}>
        <View style={[styles.modeBar, { backgroundColor: MODE_COLORS[currentMode] }]} />
        <View style={styles.assistantBubble}>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          <TouchableOpacity onPress={() => { setDrawerOpen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.clearButton}>
            <Text style={[styles.clearText, { fontSize: 18 }]}>☰</Text>
          </TouchableOpacity>
          {/* Persona toggle */}
          <TouchableOpacity onPress={togglePersona} style={[styles.personaToggle, { borderColor: accent + '66' }]}>
            <Text style={[styles.personaToggleText, { color: accent }]}>
              {getPersonaGlyph(persona)} {getPersonaLabel(persona)}
            </Text>
          </TouchableOpacity>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
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
                  onPress={() => { setInput(starter); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                >
                  <Text style={[styles.starterChipText, { color: accent }]}>{starter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Style picker */}
      {stylePickerOpen && (
        <View style={styles.stylePicker}>
          {REPLY_STYLES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.styleOption, replyStyle === s.id && [styles.styleOptionActive, { borderColor: accent }]]}
              onPress={async () => {
                setReplyStyle(s.id);
                await saveReplyStyle(s.id);
                setStylePickerOpen(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[styles.styleGlyph, { color: replyStyle === s.id ? accent : SOL_THEME.textMuted }]}>{s.glyph}</Text>
              <View style={styles.styleText}>
                <Text style={[styles.styleLabel, { color: replyStyle === s.id ? accent : SOL_THEME.text }]}>{s.label}</Text>
                <Text style={styles.styleTagline}>{s.tagline}</Text>
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

      {/* Input row */}
      <View style={[styles.inputRow, { borderTopColor: SOL_THEME.border }]}>
        <TextInput
          style={[styles.input, { borderColor: SOL_THEME.border }]}
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
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: accent, opacity: input.trim() && !loading ? 1 : 0.35 }]}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendText}>↑</Text>
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
