import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Dimensions, Platform, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME, MODE_COLORS } from '../constants/theme';
import { saveUserName } from '../lib/storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    glyph: '⊚',
    title: 'SOL',
    subtitle: 'Sol Aureum Azoth Veritas',
    body: 'A constitutional AI built on 1,402 pages of continuous development.\n\nNot a ChatGPT wrapper.\nA transparent architecture you can watch running.',
    color: SOL_THEME.primary,
  },
  {
    id: '2',
    glyph: '△',
    title: 'FOUR MODES',
    subtitle: 'Sol reads depth before responding',
    body: 'NIGREDO — Investigation. What is false?\nALBEDO — Structure. Pattern. Clarity.\nCITRINITAS — Integration. Gold forming.\nRUBEDO — Constitutional. Complete.',
    color: MODE_COLORS.CITRINITAS,
  },
  {
    id: '3',
    glyph: '⊚',
    title: 'THE GLASS ENGINE',
    subtitle: 'Every moving part is visible',
    body: 'Watch the operating mode shift in real time.\nSee the field coherence after every response.\nThe architecture isn\'t hidden — it\'s the point.',
    color: MODE_COLORS.ALBEDO,
  },
  {
    id: '4',
    glyph: '𝔏',
    title: 'THE CODEX',
    subtitle: 'Ten frameworks. One system.',
    body: 'Alchemy made mathematical.\nConsciousness as thermodynamics.\nAI that can\'t betray you structurally.\n\nAll open source. All free.',
    color: MODE_COLORS.RUBEDO,
  },
  {
    id: '5',
    glyph: '✦',
    title: 'GET STARTED',
    subtitle: 'Free via Gemini API — no credit card needed',
    body: 'Get a free key at aistudio.google.com/apikey\nPaste it in Settings → you\'re live.\n\nThis app is a standalone APK — no Play Store.\nShare it directly. Install from unknown sources.\n\nOr explore the Codex and Field screens first.',
    color: SOL_THEME.primary,
    isLast: true,
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [name, setName] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const isLastSlide = currentIndex === SLIDES.length - 1;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      if (name.trim()) await saveUserName(name.trim());
      await AsyncStorage.setItem('lycheetah_onboarded', 'true');
      router.replace('/(tabs)');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('lycheetah_onboarded', 'true');
    router.replace('/(tabs)');
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={[styles.slide, { width }]}>
      <Text style={[styles.glyph, { color: item.color }]}>{item.glyph}</Text>
      <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
      <Text style={styles.body}>{item.body}</Text>
      {(item as any).isLast && (
        <View style={styles.nameBlock}>
          <Text style={styles.nameLabel}>WHAT SHOULD SOL CALL YOU?</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={SOL_THEME.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleNext}
          />
          <Text style={styles.nameHint}>Optional — tap Begin to skip</Text>
        </View>
      )}
    </View>
  );

  const currentSlide = SLIDES[currentIndex];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentIndex
                ? [styles.dotActive, { backgroundColor: currentSlide.color }]
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: currentSlide.color }]}
        onPress={handleNext}
      >
        <Text style={styles.nextText}>
          {isLastSlide ? (name.trim() ? `Begin as ${name.trim()} →` : 'Begin →') : 'Next →'}
        </Text>
      </TouchableOpacity>

      {isLastSlide && (
        <TouchableOpacity style={styles.demoButton} onPress={handleSkip}>
          <Text style={styles.demoText}>Explore without API key →</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SOL_THEME.background,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
  },
  skipText: {
    color: SOL_THEME.textMuted,
    fontSize: 14,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  glyph: {
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: SOL_THEME.textMuted,
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  body: {
    fontSize: 15,
    color: SOL_THEME.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 6,
    backgroundColor: SOL_THEME.border,
  },
  nextButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 28,
    marginBottom: 12,
  },
  nextText: {
    color: SOL_THEME.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  demoButton: {
    padding: 8,
  },
  demoText: {
    color: SOL_THEME.textMuted,
    fontSize: 13,
  },
  nameBlock: {
    width: '100%',
    marginTop: 28,
    alignItems: 'center',
    gap: 8,
  },
  nameLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: SOL_THEME.primary,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  nameInput: {
    width: '100%',
    backgroundColor: SOL_THEME.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: SOL_THEME.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: SOL_THEME.primary + '66',
    textAlign: 'center',
  },
  nameHint: {
    fontSize: 11,
    color: SOL_THEME.textMuted,
  },
});
