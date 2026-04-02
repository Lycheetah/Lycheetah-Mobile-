import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import {
  MYSTERY_SCHOOL_DOMAINS, SubjectDomain, Subject,
  LAYER_COLORS, LAYER_LABELS,
} from '../../lib/mystery-school/subjects';
import { savePendingSubject, savePersona } from '../../lib/storage';

export default function MysterySchoolScreen() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | null>(null);

  const handleSubjectPress = async (subject: Subject) => {
    Alert.alert(
      subject.name,
      `${subject.description}\n\nLayer: ${LAYER_LABELS[subject.layer]}${subject.traditions ? `\n\nTraditions: ${subject.traditions.join(', ')}` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Study with Headmaster',
          onPress: async () => {
            await savePersona('headmaster');
            await savePendingSubject(subject.name);
            router.push('/(tabs)/');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerGlyph}>𝔏</Text>
        <Text style={styles.headerTitle}>MYSTERY SCHOOL</Text>
        <Text style={styles.headerSub}>
          {selectedDomain ? selectedDomain.label : 'Select a domain to begin'}
        </Text>
      </View>

      {!selectedDomain ? (
        // Domain grid
        <View style={styles.domainGrid}>
          {MYSTERY_SCHOOL_DOMAINS.map(domain => (
            <TouchableOpacity
              key={domain.id}
              style={[styles.domainCard, { borderColor: domain.color + '66' }]}
              onPress={() => setSelectedDomain(domain)}
              activeOpacity={0.7}
            >
              <Text style={[styles.domainGlyph, { color: domain.color }]}>{domain.glyph}</Text>
              <Text style={[styles.domainLabel, { color: domain.color }]}>{domain.label}</Text>
              <Text style={styles.domainDesc} numberOfLines={2}>{domain.description}</Text>
              <Text style={styles.domainCount}>{domain.subjects.length} subjects</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        // Subject list for selected domain
        <View>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedDomain(null)}>
            <Text style={[styles.backText, { color: selectedDomain.color }]}>← All Domains</Text>
          </TouchableOpacity>

          <Text style={styles.domainBanner}>{selectedDomain.glyph} {selectedDomain.label}</Text>
          <Text style={styles.domainBannerDesc}>{selectedDomain.description}</Text>

          {(['FOUNDATION', 'MIDDLE', 'EDGE'] as const).map(layer => {
            const layerSubjects = selectedDomain.subjects.filter(s => s.layer === layer);
            if (layerSubjects.length === 0) return null;
            return (
              <View key={layer} style={styles.layerSection}>
                <View style={[styles.layerBadge, { backgroundColor: LAYER_COLORS[layer] + '22', borderColor: LAYER_COLORS[layer] + '66' }]}>
                  <Text style={[styles.layerLabel, { color: LAYER_COLORS[layer] }]}>
                    {LAYER_LABELS[layer].toUpperCase()}
                  </Text>
                </View>
                {layerSubjects.map(subject => (
                  <TouchableOpacity
                    key={subject.name}
                    style={[styles.subjectCard, { borderLeftColor: selectedDomain.color }]}
                    onPress={() => handleSubjectPress(subject)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.subjectTop}>
                      <Text style={styles.subjectName}>{subject.name}</Text>
                      <Text style={[styles.subjectLayerDot, { color: LAYER_COLORS[subject.layer] }]}>●</Text>
                    </View>
                    <Text style={styles.subjectDesc} numberOfLines={2}>{subject.description}</Text>
                    {subject.traditions && (
                      <View style={styles.traditionsRow}>
                        {subject.traditions.map(t => (
                          <View key={t} style={[styles.traditionChip, { borderColor: selectedDomain.color + '55' }]}>
                            <Text style={[styles.traditionText, { color: selectedDomain.color }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <Text style={[styles.studyBtn, { color: selectedDomain.color }]}>
                      Study with Headmaster →
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          The Mystery School is not a place you graduate from.{'\n'}
          It is a way of seeing that, once learned, cannot be unlearned.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
  content: { padding: 16, paddingBottom: 48 },
  header: { alignItems: 'center', paddingVertical: 24, marginBottom: 8 },
  headerGlyph: { fontSize: 36, color: SOL_THEME.headmaster || '#C0A060', marginBottom: 8 },
  headerTitle: {
    fontSize: 13, fontWeight: '700', color: SOL_THEME.headmaster || '#C0A060',
    letterSpacing: 3, marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  headerSub: { fontSize: 13, color: SOL_THEME.textMuted, textAlign: 'center' },
  domainGrid: { gap: 10 },
  domainCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 10,
    borderWidth: 1, padding: 14, gap: 4,
  },
  domainGlyph: { fontSize: 22, marginBottom: 2 },
  domainLabel: { fontSize: 14, fontWeight: '700' },
  domainDesc: { fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18 },
  domainCount: { fontSize: 11, color: SOL_THEME.textMuted, marginTop: 4 },
  backBtn: { paddingVertical: 10, marginBottom: 4 },
  backText: { fontSize: 14, fontWeight: '600' },
  domainBanner: { fontSize: 18, fontWeight: '700', color: SOL_THEME.text, marginBottom: 4 },
  domainBannerDesc: { fontSize: 13, color: SOL_THEME.textMuted, lineHeight: 20, marginBottom: 16 },
  layerSection: { marginBottom: 16 },
  layerBadge: {
    alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  layerLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  subjectCard: {
    backgroundColor: SOL_THEME.surface, borderRadius: 8,
    borderWidth: 1, borderColor: SOL_THEME.border,
    borderLeftWidth: 3, padding: 12, marginBottom: 8, gap: 4,
  },
  subjectTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  subjectName: { flex: 1, fontSize: 14, fontWeight: '700', color: SOL_THEME.text },
  subjectLayerDot: { fontSize: 10, marginTop: 3 },
  subjectDesc: { fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18 },
  traditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  traditionChip: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  traditionText: { fontSize: 10, fontWeight: '600' },
  studyBtn: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  footer: {
    marginTop: 32, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: SOL_THEME.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12, color: SOL_THEME.textMuted,
    textAlign: 'center', lineHeight: 20, fontStyle: 'italic',
  },
});
