import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, Animated, Dimensions, Platform,
  Alert, TextInput, Modal,
} from 'react-native';
import { SOL_THEME } from '../constants/theme';
import { ConversationMeta, WELCOME_THREAD_ID } from '../lib/conversation-manager';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.82, 320);

type Props = {
  visible: boolean;
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onClose: () => void;
};

export default function ConversationDrawer({
  visible, conversations, activeId,
  onSelect, onNew, onDelete, onRename, onClose,
}: Props) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [renameTarget, setRenameTarget] = useState<ConversationMeta | null>(null);
  const [renameText, setRenameText] = useState('');

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

  const glyphFor = (persona: string) =>
    persona === 'veyra' ? '◈' :
    persona === 'aura-prime' ? '✦' :
    persona === 'headmaster' ? '𝔏' : '⊚';

  const colorFor = (persona: string) =>
    persona === 'veyra' ? SOL_THEME.veyra :
    persona === 'aura-prime' ? SOL_THEME.auraPrime :
    persona === 'headmaster' ? SOL_THEME.headmaster :
    SOL_THEME.primary;

  function handleLongPress(item: ConversationMeta) {
    if (item.locked || item.id === WELCOME_THREAD_ID) return;
    Alert.alert(
      'Delete conversation?',
      `"${item.title}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
      ],
      { cancelable: true }
    );
  }

  function handleTitlePress(item: ConversationMeta) {
    if (item.locked || item.id === WELCOME_THREAD_ID) return;
    setRenameText(item.title);
    setRenameTarget(item);
  }

  function confirmRename() {
    if (renameTarget && renameText.trim()) {
      onRename(renameTarget.id, renameText.trim());
    }
    setRenameTarget(null);
  }

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
            const isWelcome = item.id === WELCOME_THREAD_ID;
            const isLocked = item.locked || isWelcome;

            return (
              <TouchableOpacity
                style={[
                  styles.item,
                  isActive && [styles.itemActive, { borderLeftColor: color }],
                  isWelcome && styles.itemWelcome,
                ]}
                onPress={() => { onSelect(item.id); onClose(); }}
                onLongPress={() => handleLongPress(item)}
                delayLongPress={600}
              >
                <View style={styles.itemTop}>
                  <View style={styles.itemTopLeft}>
                    <Text style={[styles.itemGlyph, { color }]}>{glyphFor(item.persona)}</Text>
                    {isLocked && <Text style={styles.lockIcon}>⊛</Text>}
                  </View>
                  <Text style={styles.itemTime}>{formatTime(item.updatedAt)}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleTitlePress(item)}
                  disabled={isLocked}
                  activeOpacity={isLocked ? 1 : 0.6}
                >
                  <Text style={[styles.itemTitle, isActive && { color: SOL_THEME.text }, isWelcome && styles.welcomeTitle]} numberOfLines={2}>
                    {item.title}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.itemMeta}>
                  {item.messageCount} msgs{item.auraComposite ? ` · AURA ${item.auraComposite}%` : ''}
                  {isLocked ? ' · pinned' : ''}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.drawerFooter}>
          <Text style={styles.drawerFooterText}>Long press to delete · Tap title to rename</Text>
        </View>
      </Animated.View>

      {/* Rename Modal */}
      <Modal
        visible={!!renameTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rename conversation</Text>
            <TextInput
              style={styles.modalInput}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              selectTextOnFocus
              maxLength={80}
              placeholderTextColor={SOL_THEME.textMuted}
              onSubmitEditing={confirmRename}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRenameTarget(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={confirmRename}>
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  itemWelcome: {
    borderLeftColor: SOL_THEME.primary,
    borderBottomWidth: 1, borderBottomColor: SOL_THEME.border,
    marginBottom: 10,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' },
  itemTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemGlyph: { fontSize: 14, fontWeight: '700' },
  lockIcon: { fontSize: 10, color: SOL_THEME.textMuted },
  itemTime: { fontSize: 11, color: SOL_THEME.textMuted },
  itemTitle: { fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 18, marginBottom: 4 },
  welcomeTitle: { color: SOL_THEME.primary, fontWeight: '600' },
  itemMeta: { fontSize: 11, color: SOL_THEME.textMuted },
  drawerFooter: { padding: 16, borderTopWidth: 1, borderTopColor: SOL_THEME.border },
  drawerFooterText: { fontSize: 11, color: SOL_THEME.textMuted, textAlign: 'center' },
  // Rename modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: SOL_THEME.surface, borderRadius: 12,
    padding: 20, width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: SOL_THEME.border,
  },
  modalTitle: { color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  modalInput: {
    backgroundColor: SOL_THEME.background, borderRadius: 8,
    borderWidth: 1, borderColor: SOL_THEME.border,
    color: SOL_THEME.text, fontSize: 15, padding: 12, marginBottom: 16,
  },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1, padding: 12, borderRadius: 8,
    backgroundColor: SOL_THEME.background, alignItems: 'center',
    borderWidth: 1, borderColor: SOL_THEME.border,
  },
  modalCancelText: { color: SOL_THEME.textMuted, fontWeight: '600' },
  modalConfirm: {
    flex: 1, padding: 12, borderRadius: 8,
    backgroundColor: SOL_THEME.primary, alignItems: 'center',
  },
  modalConfirmText: { color: SOL_THEME.background, fontWeight: '700' },
});
