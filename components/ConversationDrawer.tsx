import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Animated, Dimensions, Platform,
} from 'react-native';
import { SOL_THEME } from '../constants/theme';
import { ConversationMeta } from '../lib/conversation-manager';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

type Props = {
  visible: boolean;
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function ConversationDrawer({ visible, conversations, activeId, onSelect, onNew, onDelete, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: visible ? 0 : -DRAWER_WIDTH, duration: 240, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: visible ? 1 : 0, duration: 240, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible && slideAnim.__getValue() === -DRAWER_WIDTH) return null;

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  const glyphFor = (persona: string) => persona === 'veyra' ? '◈' : persona === 'aura-prime' ? '✦' : '⊚';
  const colorFor = (persona: string) => persona === 'veyra' ? SOL_THEME.veyra : persona === 'aura-prime' ? SOL_THEME.auraPrime : SOL_THEME.primary;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <TouchableOpacity style={styles.backdropTouch} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⊚ CONVERSATIONS</Text>
          <TouchableOpacity onPress={onNew} style={styles.newButton}>
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No conversations yet.{'\n'}Start one in Sol.</Text>
          }
          renderItem={({ item }) => {
            const isActive = item.id === activeId;
            const color = colorFor(item.persona);
            return (
              <TouchableOpacity
                style={[styles.item, isActive && [styles.itemActive, { borderLeftColor: color }]]}
                onPress={() => { onSelect(item.id); onClose(); }}
                onLongPress={() => {
                  onDelete(item.id);
                }}
                delayLongPress={600}
              >
                <View style={styles.itemTop}>
                  <Text style={[styles.itemGlyph, { color }]}>{glyphFor(item.persona)}</Text>
                  <Text style={styles.itemTime}>{formatTime(item.updatedAt)}</Text>
                </View>
                <Text style={[styles.itemTitle, isActive && { color: SOL_THEME.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>{item.messageCount} msgs{item.auraComposite ? ` · AURA ${item.auraComposite}%` : ''}</Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.drawerFooter}>
          <Text style={styles.drawerFooterText}>Long press to delete · Max 50</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 50 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  backdropTouch: { flex: 1 },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: SOL_THEME.surface,
    borderRightWidth: 1,
    borderRightColor: SOL_THEME.border,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: SOL_THEME.border,
  },
  headerTitle: {
    fontSize: 11, fontWeight: '700', color: SOL_THEME.primary,
    letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  newButton: {
    backgroundColor: SOL_THEME.primary, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  newButtonText: { color: SOL_THEME.background, fontWeight: '700', fontSize: 13 },
  list: { padding: 8 },
  empty: { color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  item: {
    padding: 12, borderRadius: 8, marginBottom: 6,
    backgroundColor: SOL_THEME.background,
    borderLeftWidth: 3, borderLeftColor: 'transparent',
  },
  itemActive: { backgroundColor: SOL_THEME.surface },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemGlyph: { fontSize: 14, fontWeight: '700' },
  itemTime: { fontSize: 11, color: SOL_THEME.textMuted },
  itemTitle: { fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 18, marginBottom: 4 },
  itemMeta: { fontSize: 11, color: SOL_THEME.textMuted },
  drawerFooter: { padding: 16, borderTopWidth: 1, borderTopColor: SOL_THEME.border },
  drawerFooterText: { fontSize: 11, color: SOL_THEME.textMuted, textAlign: 'center' },
});
