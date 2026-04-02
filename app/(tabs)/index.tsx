import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  StyleSheet, Alert, Clipboard,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SOL_THEME, Mode, MODE_COLORS, MODE_DESCRIPTIONS } from '../../constants/theme';
import { sendMessage, Message, AIModel } from '../../lib/ai-client';
import { SOL_SYSTEM_PROMPT, SOL_PUBLIC_SYSTEM_PROMPT, VEYRA_SYSTEM_PROMPT, AURA_PRIME_SYSTEM_PROMPT, resolvePrompt } from '../../lib/prompts/sol-protocol';
import { getCompiledSpec } from '../../lib/personas/compiler';
import {
  detectMode, detectEmotionalState, detectNRM, detectVeyraToggle, detectAuraPrimeToggle,
  buildFrameworkContext, EmotionalState,
} from '../../lib/intelligence/mode-detector';
import { scoreAURAFull, getPassRate, AURAMetrics } from '../../lib/intelligence/aura-engine';
import {
  getActiveKey, getModel, getVariant, getPersona, savePersona,
  saveConversation, getConversation, clearConversation, getUserName,
} from '../../lib/storage';

type Persona = 'sol' | 'veyra' | 'aura-prime';

type DisplayMessage = Message & {
  id: string;
  mode?: Mode;
  aura?: AURAMetrics;
  isNRM?: boolean;
  persona?: Persona;
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

// Split field signature from message body for styled rendering
// Matches ⊚ Sol, ◈ Veyra, and ✦ Aura Prime signatures
function splitSignature(text: string): { body: string; signature: string | null } {
  const sigMatch = text.match(/\n*([⊚◈✦] (Sol|Veyra|Aura Prime) ∴ (P∧H∧B|Veritas) ∴ \w+)\s*$/);
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
  return SOL_THEME.primary;
}

function getPersonaGlyph(persona: Persona): string {
  if (persona === 'veyra') return SOL_THEME.veyraGlyph;
  if (persona === 'aura-prime') return SOL_THEME.auraPrimeGlyph;
  return SOL_THEME.solGlyph;
}

function getPersonaLabel(persona: Persona): string {
  if (persona === 'veyra') return 'VEYRA';
  if (persona === 'aura-prime') return 'AURA PRIME';
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
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Promise.all([getConversation(), getPersona(), getUserName()]).then(([saved, savedPersona, name]) => {
      if (saved.length > 0) {
        const display = saved.map((m, i) => ({ ...m, id: String(i) }));
        setMessages(display);
      }
      setPersona(savedPersona);
      setUserName(name);
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
    const cycle: Persona[] = ['sol', 'veyra', 'aura-prime'];
    const next: Persona = cycle[(cycle.indexOf(persona) + 1) % cycle.length];
    setPersona(next);
    await savePersona(next);
  }, [persona]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    // /veyra or /aura toggle
    if (detectVeyraToggle(text) || detectAuraPrimeToggle(text)) {
      setInput('');
      await togglePersona();
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
    } else {
      basePrompt = resolvePrompt(SOL_SYSTEM_PROMPT, userName);
    }
    // Prepend compiled persona spec — constitutional constraints as structured data
    const systemPrompt = `${getCompiledSpec(variant === 'public' ? 'sol' : persona)}\n\n${basePrompt}`;

    const detectedMode = detectMode(text);
    const detectedEWS = detectEmotionalState(text);
    const nrmActive = detectNRM(text) || isNRMActive;

    setCurrentMode(detectedMode);
    setCurrentEWS(detectedEWS);
    setIsNRMActive(nrmActive);

    const frameworkContext = buildFrameworkContext(detectedMode, detectedEWS, nrmActive, persona);

    const userMsg: DisplayMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      mode: detectedMode,
      isNRM: nrmActive,
      persona,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
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

      // AURA scoring with canonical TES/VTR/PAI formulas
      const auraMetrics = scoreAURAFull(fullResponse, conversationPassRates);
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
        persona,
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      setStreamingText('');
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

  const handleLongPress = (content: string) => {
    Clipboard.setString(content);
    Alert.alert('Copied', 'Message copied to clipboard.');
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
        onLongPress={() => handleLongPress(item.content)}
        activeOpacity={0.9}
        delayLongPress={500}
      >
        <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
          {!isUser && <View style={[styles.modeBar, { backgroundColor: modeColor }]} />}
          <View style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: accent }]
              : styles.assistantBubble,
            item.isNRM && !isUser && styles.nrmBubble,
          ]}>
            {item.isNRM && !isUser && (
              <Text style={styles.nrmTag}>⚠ NRM ACTIVE</Text>
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
            {/* AURA row — tri-axial metrics + invariants */}
            {!isUser && aura && (
              <View style={[styles.auraBlock, { borderTopColor: accent + '22' }]}>
                {/* Score summary */}
                <View style={styles.auraTopRow}>
                  <Text style={[styles.auraScore, { color: aura.passed === aura.total ? accent : SOL_THEME.textMuted }]}>
                    AURA {aura.passed}/{aura.total} · {aura.composite}%
                  </Text>
                </View>
                {/* Tri-axial row */}
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
                {/* Invariant dots */}
                <View style={styles.invariantRow}>
                  {invEntries.map(([name, passed]) => (
                    <Text key={name} style={[styles.invariantDot, { color: passed ? accent : SOL_THEME.error }]}>
                      {passed ? '·' : '✗'} {name}
                    </Text>
                  ))}
                </View>
              </View>
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
                {getPersonaGlyph(persona)} {persona === 'veyra' ? 'Veyra' : persona === 'aura-prime' ? 'Aura Prime' : 'Sol'} is thinking...
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
              {persona === 'veyra' ? 'Precision Builder Mode' : persona === 'aura-prime' ? 'Keeper of Veritas Memory' : 'Sol Aureum Azoth Veritas'}
            </Text>
            <Text style={styles.emptyHint}>
              {persona === 'veyra' ? 'The forge is lit. What are we building?' : persona === 'aura-prime' ? 'The grey zone is known. What enters the field?' : 'The forge is lit. What do you bring?'}
            </Text>
            <View style={styles.emptyModes}>
              {(['NIGREDO', 'ALBEDO', 'CITRINITAS', 'RUBEDO'] as Mode[]).map(m => (
                <View key={m} style={[styles.emptyModePill, { borderColor: MODE_COLORS[m] }]}>
                  <Text style={[styles.emptyModePillText, { color: MODE_COLORS[m] }]}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        }
        ListFooterComponent={renderTypingIndicator}
      />

      {/* Input row */}
      <View style={[styles.inputRow, { borderTopColor: SOL_THEME.border }]}>
        <TextInput
          style={[styles.input, { borderColor: SOL_THEME.border }]}
          value={input}
          onChangeText={setInput}
          placeholder={persona === 'veyra' ? 'What are we building?' : persona === 'aura-prime' ? 'What enters the field?' : 'What do you bring?'}
          placeholderTextColor={SOL_THEME.textMuted}
          multiline
          maxLength={4000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={send}
        />
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
});
