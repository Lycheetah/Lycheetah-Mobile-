// SOL v4.0.0 — Premium Sheet
// One screen. One button. Total honesty about what premium is and is not.
// The sovereignty line is loaded from entitlements.ts so the copy cannot drift.

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PREMIUM_PRICE_USD,
  PREMIUM_PRODUCT_ID,
  PREMIUM_UNLOCKS,
  PREMIUM_DOES_NOT_UNLOCK,
  getEntitlement,
  setDevUnlock,
  setPremium,
} from '@/lib/premium/entitlements';
import { useSkin } from '@/lib/premium/SkinContext';
import { SPACE, TYPE } from '@/constants/theme';

export type PremiumSheetProps = {
  visible: boolean;
  onClose: () => void;
  // Optional IAP hook — if present, called when user taps "Unlock".
  // If absent, falls back to a dev stub (local unlock in __DEV__ only).
  onPurchase?: () => Promise<{ success: boolean; error?: string }>;
  onRestore?: () => Promise<{ success: boolean; error?: string }>;
};

export function PremiumSheet({ visible, onClose, onPurchase, onRestore }: PremiumSheetProps) {
  const { skin, unlocked, refresh } = useSkin();
  const [busy, setBusy] = useState(false);

  const handleUnlock = async () => {
    setBusy(true);
    try {
      if (onPurchase) {
        const res = await onPurchase();
        if (res.success) {
          await setPremium(true);
          await refresh();
          Alert.alert('Unlocked', 'Thank you for keeping the framework free.');
          onClose();
        } else if (res.error) {
          Alert.alert('Could not complete', res.error);
        }
      } else if (__DEV__) {
        // Dev fallback — never ships. IAP wiring lands with native config.
        await setDevUnlock(true);
        await refresh();
        Alert.alert('Dev unlock active', 'Cosmetics unlocked locally for testing.');
        onClose();
      } else {
        Alert.alert('Coming soon', 'In-app purchase wiring arrives in the next build.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    try {
      if (onRestore) {
        const res = await onRestore();
        if (res.success) {
          await setPremium(true);
          await refresh();
          Alert.alert('Restored', 'Welcome back.');
          onClose();
        } else if (res.error) {
          Alert.alert('Nothing to restore', res.error);
        }
      } else {
        Alert.alert('Restore', 'Available once IAP is live in the next build.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop]}>
        <View style={[styles.sheet, { backgroundColor: skin.surface, borderColor: skin.border }]}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={{ paddingBottom: SPACE.xl }}>
            <Text style={[TYPE.display, { color: skin.gold, textAlign: 'center' }]}>Patron</Text>
            <Text
              style={[
                TYPE.small,
                { color: skin.textMuted, textAlign: 'center', marginTop: SPACE.xs, letterSpacing: 1.2 },
              ]}
            >
              THE FRAMEWORK STAYS FREE
            </Text>

            <Text style={[TYPE.body, { color: skin.text, marginTop: SPACE.xl }]}>
              Sol is open-source and free forever. Personas, modes, providers, tools, the Mystery
              School, AURA, the Sanctum — all free. This unlock is cosmetic. It exists so
              people who love the work can support it, not because we gate the work.
            </Text>

            <Text style={[TYPE.bodyBold, { color: skin.gold, marginTop: SPACE.xl }]}>
              What you unlock
            </Text>
            <View style={{ marginTop: SPACE.sm }}>
              {PREMIUM_UNLOCKS.map((item) => (
                <View key={item.title} style={styles.row}>
                  <Text style={[TYPE.body, { color: skin.gold }]}>◆</Text>
                  <View style={{ flex: 1, marginLeft: SPACE.md }}>
                    <Text style={[TYPE.bodyBold, { color: skin.text }]}>{item.title}</Text>
                    <Text style={[TYPE.small, { color: skin.textMuted, marginTop: 2 }]}>
                      {item.detail}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={[TYPE.bodyBold, { color: skin.textMuted, marginTop: SPACE.xl }]}>
              What you do NOT unlock
            </Text>
            <View style={{ marginTop: SPACE.sm }}>
              {PREMIUM_DOES_NOT_UNLOCK.map((line) => (
                <Text
                  key={line}
                  style={[TYPE.small, { color: skin.textDim, marginTop: SPACE.xs }]}
                >
                  — {line}
                </Text>
              ))}
            </View>

            <Text
              style={[
                TYPE.small,
                { color: skin.textMuted, marginTop: SPACE.xl, lineHeight: 20 },
              ]}
            >
              One-time purchase. No subscription. Your keys, journal, and data stay on your
              device. Uninstall removes everything.
            </Text>

            {unlocked ? (
              <View style={[styles.button, { backgroundColor: skin.goldDim, marginTop: SPACE.xl }]}>
                <Text style={[TYPE.bodyBold, { color: skin.text }]}>Patron — thank you</Text>
              </View>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={handleUnlock}
                  style={[styles.button, { backgroundColor: skin.gold, marginTop: SPACE.xl }]}
                >
                  {busy ? (
                    <ActivityIndicator color={skin.background} />
                  ) : (
                    <Text style={[TYPE.bodyBold, { color: skin.background }]}>
                      Unlock — ${PREMIUM_PRICE_USD.toFixed(2)}
                    </Text>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={handleRestore}
                  style={[styles.buttonGhost, { borderColor: skin.border, marginTop: SPACE.sm }]}
                >
                  <Text style={[TYPE.small, { color: skin.textMuted }]}>Restore purchase</Text>
                </Pressable>
              </>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={{ marginTop: SPACE.lg, alignSelf: 'center', padding: SPACE.md }}
            >
              <Text style={[TYPE.small, { color: skin.textDim }]}>Not now</Text>
            </Pressable>

            <Text style={[TYPE.micro, { color: skin.textDim, textAlign: 'center', marginTop: SPACE.lg }]}>
              PRODUCT ID · {PREMIUM_PRODUCT_ID}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.md,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A42',
    alignSelf: 'center',
    marginBottom: SPACE.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACE.md,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGhost: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
