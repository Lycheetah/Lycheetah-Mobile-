// SOL v4.0.0 — Rewarded Ad Prompt
// Shown ONLY when a free-tier user has hit the cap and taps "continue today".
// Never auto-shows. Never banners. Fully opt-in.

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AD_BONUS, getStatus, recordAdWatched, type FreeTierStatus } from '@/lib/ads/rate-limit';
import { isRewardedAdAvailable, showRewardedAd } from '@/lib/ads/rewarded';
import { useSkin } from '@/lib/premium/SkinContext';
import { SPACE, TYPE } from '@/constants/theme';

export type RewardedAdPromptProps = {
  visible: boolean;
  onClose: () => void;
  onRewarded?: (status: FreeTierStatus) => void;
};

export function RewardedAdPrompt({ visible, onClose, onRewarded }: RewardedAdPromptProps) {
  const { skin } = useSkin();
  const [status, setStatus] = useState<FreeTierStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    void getStatus().then(setStatus);
  }, [visible]);

  const handleWatch = async () => {
    setBusy(true);
    try {
      const result = await showRewardedAd();
      if (result.success) {
        const newStatus = await recordAdWatched();
        setStatus(newStatus);
        onRewarded?.(newStatus);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const available = isRewardedAdAvailable();
  const adsLeft = status?.adsAvailable ?? 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: skin.surface, borderColor: skin.border }]}>
          <Text style={[TYPE.title, { color: skin.gold, textAlign: 'center' }]}>
            Continue today
          </Text>
          <Text
            style={[
              TYPE.body,
              { color: skin.text, textAlign: 'center', marginTop: SPACE.md, lineHeight: 22 },
            ]}
          >
            Watch a short ad to unlock {AD_BONUS} more messages for today.
          </Text>
          <Text
            style={[
              TYPE.small,
              { color: skin.textMuted, textAlign: 'center', marginTop: SPACE.sm },
            ]}
          >
            {adsLeft > 0
              ? `${adsLeft} ad${adsLeft === 1 ? '' : 's'} remaining today.`
              : 'No more ads today. Resets at midnight.'}
          </Text>

          <Text
            style={[
              TYPE.small,
              { color: skin.textDim, textAlign: 'center', marginTop: SPACE.lg, lineHeight: 18 },
            ]}
          >
            Or add your own API key in Settings for unlimited use. The framework is yours; the ads
            just keep the free tier running.
          </Text>

          <Pressable
            accessibilityRole="button"
            disabled={busy || adsLeft === 0 || !available}
            onPress={handleWatch}
            style={[
              styles.primaryButton,
              {
                backgroundColor: adsLeft === 0 || !available ? skin.goldDim : skin.gold,
                marginTop: SPACE.xl,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={skin.background} />
            ) : (
              <Text style={[TYPE.bodyBold, { color: skin.background }]}>
                {adsLeft === 0 ? 'No ads available' : 'Watch ad'}
              </Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{ marginTop: SPACE.md, padding: SPACE.md, alignSelf: 'center' }}
          >
            <Text style={[TYPE.small, { color: skin.textDim }]}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACE.xl,
  },
  primaryButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
