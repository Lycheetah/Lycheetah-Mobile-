import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { SOL_THEME } from '../../constants/theme';
import { getActiveKey, getModel } from '../../lib/storage';
import { sendMessage } from '../../lib/ai-client';
import { getAllSubjects } from '../../lib/mystery-school/subjects';
import { COMPANION_LORE, STAGES, EvolutionStage } from '../../lib/companion/game-data';
import { SkinId } from '../../lib/companion/zones';

const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
const BG = SOL_THEME.background ?? '#060410';

// Navigate to companion and trigger a campfire mode
async function triggerCampfire(mode: 'recall' | 'auto' | 'learn', router: ReturnType<typeof useRouter>) {
  await AsyncStorage.setItem('sol_pending_campfire', mode).catch(() => {});
  router.push('/(tabs)/companion');
}

export default function LearnTab() {
  const router = useRouter();

  // ── data state
  const [recentDives, setRecentDives] = useState<Array<{ subjectName: string; domainLabel: string; contentSeed?: string; date: string }>>([]);
  const [recallDue, setRecallDue] = useState<{ diveId: string; subjectName: string; domainLabel: string; daysAgo: number } | null>(null);
  const [synthesisPending, setSynthesisPending] = useState<{ domains: string[] } | null>(null);
  const [warmDecaySubject, setWarmDecaySubject] = useState<{ subjectName: string; domainLabel: string } | null>(null);
  const [protegeLog, setProtegeLog] = useState<Array<{ date: string; subject: string; lesson: string }>>([]);
  const [weeklySynth, setWeeklySynth] = useState<string | null>(null);
  const [weeklySynthLoading, setWeeklySynthLoading] = useState(false);
  const [whatNextRec, setWhatNextRec] = useState<{ subjectName: string; reason: string } | null>(null);
  const [whatNextLoading, setWhatNextLoading] = useState(false);
  const [stage, setStage] = useState<EvolutionStage>(0);
  const [skinId, setSkinId] = useState<string>('sol');

  // ── collapsed state
  const [protegeCollapsed, setProtegeCollapsed] = useState(true);
  const [growthCollapsed, setGrowthCollapsed] = useState(true);
  const [constCollapsed, setConstCollapsed] = useState(true);

  useFocusEffect(useCallback(() => {
    (async () => {
      const keys = [
        'sol_dive_log', 'sol_space_log', 'sol_protege_log',
        'sol_synthesis_signal', 'sol_weekly_synth', 'sol_weekly_synth_ts',
        'sol_companion_skin', 'sol_companion_archetype',
      ];
      const vals = await AsyncStorage.multiGet(keys);
      const get = (k: string) => vals.find(([key]) => key === k)?.[1] ?? null;

      const dives: Array<{ date: string; subjectName?: string; domainLabel?: string; contentSeed?: string }> =
        get('sol_dive_log') ? JSON.parse(get('sol_dive_log')!) : [];

      const now = Date.now();
      const msPerDay = 86_400_000;

      setRecentDives(dives.slice(0, 10).filter(d => d.subjectName).map(d => ({
        subjectName: d.subjectName!, domainLabel: d.domainLabel || 'the unknown',
        contentSeed: d.contentSeed, date: d.date,
      })));

      // Stage
      const total = dives.length;
      const stageNow: EvolutionStage = total >= 200 ? 5 : total >= 100 ? 4 : total >= 50 ? 3 : total >= 20 ? 2 : total >= 5 ? 1 : 0;
      setStage(stageNow);

      // Skin
      const skinRaw = get('sol_companion_skin') as SkinId | null;
      if (skinRaw) setSkinId(skinRaw);

      // Spaced recall
      try {
        const SPACE_INTERVALS = [1, 3, 7, 16];
        const spaceLog: Record<string, { recalls: number; nextDue: number }> =
          get('sol_space_log') ? JSON.parse(get('sol_space_log')!) : {};
        let dueEntry: typeof dives[0] | undefined;
        let dueKey = '';
        for (const d of dives) {
          if (!d.subjectName) continue;
          const key = `${d.subjectName}__${d.domainLabel ?? ''}`;
          const diveTime = new Date(d.date).getTime();
          if (isNaN(diveTime)) continue;
          const entry = spaceLog[key];
          if (!entry) {
            if ((now - diveTime) / msPerDay >= SPACE_INTERVALS[0]) { dueEntry = d; dueKey = key; break; }
          } else if (entry.recalls < SPACE_INTERVALS.length && now >= entry.nextDue) {
            dueEntry = d; dueKey = key; break;
          }
        }
        if (dueEntry?.subjectName) {
          const daysAgo = Math.round((now - new Date(dueEntry.date).getTime()) / msPerDay);
          setRecallDue({ diveId: dueKey, subjectName: dueEntry.subjectName, domainLabel: dueEntry.domainLabel || 'the unknown', daysAgo });
        } else { setRecallDue(null); }
      } catch { setRecallDue(null); }

      // Synthesis signal
      try {
        const ssRaw = get('sol_synthesis_signal');
        if (ssRaw) {
          const ss = JSON.parse(ssRaw);
          if (ss?.domains && ss?.ts && (now - ss.ts) < 86_400_000) {
            setSynthesisPending({ domains: ss.domains });
          }
        }
      } catch {}

      // Warm decay
      try {
        const spaceLog2: Record<string, { recalls: number; nextDue: number }> =
          get('sol_space_log') ? JSON.parse(get('sol_space_log')!) : {};
        let decayCandidate: { subjectName: string; domainLabel: string } | null = null;
        for (const d of dives.slice(0, 30)) {
          if (!d.subjectName) continue;
          const key2 = `${d.subjectName}__${d.domainLabel ?? ''}`;
          const entry2 = spaceLog2[key2];
          const diveTime2 = new Date(d.date).getTime();
          if (isNaN(diveTime2)) continue;
          const overdueDays = entry2 ? (now - entry2.nextDue) / msPerDay : (now - diveTime2) / msPerDay;
          if (overdueDays > 30) { decayCandidate = { subjectName: d.subjectName, domainLabel: d.domainLabel || 'the unknown' }; break; }
        }
        setWarmDecaySubject(decayCandidate);
      } catch {}

      // Protégé log
      try {
        const plRaw = get('sol_protege_log');
        setProtegeLog(plRaw ? JSON.parse(plRaw) : []);
      } catch {}

      // Weekly synth
      try {
        const weekDives = dives.filter(d => new Date(d.date).getTime() > now - 7 * msPerDay);
        if (weekDives.length >= 2) {
          const lastSynthRaw = await AsyncStorage.getItem('sol_weekly_synth_ts').catch(() => null);
          const lastSynth = lastSynthRaw ? parseInt(lastSynthRaw) : 0;
          const synthRaw = get('sol_weekly_synth');
          if (synthRaw && (now - lastSynth) < 7 * msPerDay) {
            setWeeklySynth(JSON.parse(synthRaw));
          } else if ((now - lastSynth) >= 7 * msPerDay) {
            (async () => {
              setWeeklySynthLoading(true);
              try {
                const [key, model] = await Promise.all([getActiveKey(), getModel()]);
                if (!key) return;
                const subjects = weekDives.map(d => d.subjectName).filter(Boolean).slice(0, 8).join(', ');
                const charLore = (COMPANION_LORE as any)[skinId];
                const charLine = charLore ? `You are ${charLore.name} — ${charLore.title}. ${charLore.lore}` : 'You are Sol.';
                const result = await sendMessage([],
                  `${charLine}\n\nThe seeker studied: ${subjects} this week.\n\nWrite ONE paragraph (3-4 sentences) in your own voice connecting what they studied — a synthesis, not a summary. Warm, surprising, earned.`,
                  key, model as any, undefined, 'normal', 120);
                const synthText = result.text?.trim();
                if (synthText) {
                  await AsyncStorage.setItem('sol_weekly_synth', JSON.stringify(synthText)).catch(() => {});
                  await AsyncStorage.setItem('sol_weekly_synth_ts', String(now)).catch(() => {});
                  setWeeklySynth(synthText);
                }
              } catch {}
              finally { setWeeklySynthLoading(false); }
            })();
          }
        }
      } catch {}
    })();
  }, []));

  const getWhatNext = async () => {
    if (whatNextLoading) return;
    setWhatNextLoading(true);
    setWhatNextRec(null);
    try {
      const [key, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!key) return;
      const studied = recentDives.map(d => d.subjectName);
      const allSubjs = getAllSubjects().map(s => s.name);
      const unstudied = allSubjs.filter(n => !studied.includes(n)).slice(0, 30);
      const stageName = STAGES[stage]?.name ?? 'SEED';
      const charLore = (COMPANION_LORE as any)[skinId];
      const charLine = charLore ? `You are ${charLore.name} — ${charLore.title}. ${charLore.lore}` : 'You are Sol.';
      const result = await sendMessage([],
        `${charLine}\n\nThe seeker has studied: ${studied.join(', ') || 'nothing yet'}. Stage: ${stageName}.\nAvailable next subjects: ${unstudied.join(', ')}.\n\nRespond in this exact format:\nSUBJECT: [subject name exactly as listed]\nREASON: [one sentence in your own voice]\n\nNo other text.`,
        key, model as any, undefined, 'normal', 80);
      const text = result.text?.trim() ?? '';
      const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
      const reasonMatch = text.match(/REASON:\s*(.+)/i);
      if (subjectMatch && reasonMatch) {
        setWhatNextRec({ subjectName: subjectMatch[1].trim(), reason: reasonMatch[1].trim() });
      }
    } catch {}
    finally { setWhatNextLoading(false); }
  };

  const color = '#C084FC';
  const hasContent = recentDives.length > 0 || protegeLog.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 56, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── HEADER */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color, fontSize: 11, fontFamily: mono, letterSpacing: 3, fontWeight: '700' }}>◈ LEARN</Text>
          <Text style={{ color: '#666677', fontSize: 10, fontFamily: mono, marginTop: 3 }}>
            {recentDives.length} dives · {protegeLog.length} lessons taught
          </Text>
        </View>

        {/* ── NO CONTENT STATE */}
        {!hasContent && (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Text style={{ color: color, fontSize: 24 }}>◈</Text>
            <Text style={{ color: '#555566', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              Dive in the School to start the loop.{'\n'}Your companion learns when you do.
            </Text>
          </View>
        )}

        {/* ── RECALL DUE */}
        {recallDue && (
          <TouchableOpacity onPress={() => triggerCampfire('recall', router)} activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#8866CC44', backgroundColor: '#8866CC0A', marginBottom: 14 }}>
            <Text style={{ fontSize: 18 }}>⟁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#9977DD', fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 2 }}>RECALL DUE</Text>
              <Text style={{ color: '#CCBBEE', fontSize: 13, marginTop: 3, fontWeight: '600' }}>{recallDue.subjectName}</Text>
              <Text style={{ color: '#776688', fontSize: 10, fontFamily: mono, marginTop: 2 }}>{recallDue.daysAgo}d ago · tap to test recall</Text>
            </View>
            <Text style={{ color: '#8866CC', fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        )}

        {/* ── SYNTHESIS TRIGGER */}
        {synthesisPending && (
          <TouchableOpacity onPress={() => { setSynthesisPending(null); AsyncStorage.removeItem('sol_synthesis_signal').catch(() => {}); triggerCampfire('auto', router); }}
            activeOpacity={0.85}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#44AABB44', backgroundColor: '#44AABB0A', marginBottom: 14 }}>
            <Text style={{ fontSize: 18 }}>⊗</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#55BBCC', fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 2 }}>A THREAD BETWEEN WORLDS</Text>
              <Text style={{ color: '#AADDEE', fontSize: 12, marginTop: 3, lineHeight: 17 }}>
                You've been in {synthesisPending.domains[0]} and {synthesisPending.domains[1]}. There's a connection.
              </Text>
            </View>
            <Text style={{ color: '#44AABB', fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        )}

        {/* ── WARM DECAY */}
        {warmDecaySubject && !recallDue && (
          <View style={{ marginBottom: 14, borderRadius: 12, borderWidth: 1, borderColor: '#88667744', backgroundColor: '#88667708', padding: 14 }}>
            <Text style={{ color: '#AA88BB', fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>◌ GONE QUIET</Text>
            <Text style={{ color: '#CCCCDD', fontSize: 13, marginBottom: 4, fontWeight: '600' }}>{warmDecaySubject.subjectName}</Text>
            <Text style={{ color: '#AAAACC', fontSize: 11, fontStyle: 'italic', marginBottom: 10 }}>Want to wake it?</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => { setRecallDue({ diveId: `${warmDecaySubject.subjectName}__${warmDecaySubject.domainLabel}`, subjectName: warmDecaySubject.subjectName, domainLabel: warmDecaySubject.domainLabel, daysAgo: 30 }); setWarmDecaySubject(null); }}>
                <Text style={{ color: '#AA88BB', fontSize: 11, fontFamily: mono, fontWeight: '700' }}>REVISIT →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWarmDecaySubject(null)}>
                <Text style={{ color: '#444455', fontSize: 11, fontFamily: mono }}>not now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── WEEKLY SYNTHESIS */}
        {(weeklySynth || weeklySynthLoading) && (
          <View style={{ marginBottom: 14, borderRadius: 12, borderWidth: 1, borderColor: '#4488CC44', backgroundColor: '#4488CC08', padding: 14 }}>
            <Text style={{ color: '#4488CC', fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>⊕ THIS WEEK</Text>
            {weeklySynthLoading && !weeklySynth ? (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#4488CC" />
                <Text style={{ color: '#4488CC88', fontSize: 11, fontFamily: mono }}>weaving synthesis…</Text>
              </View>
            ) : (
              <>
                <Text style={{ color: '#CCCCDD', fontSize: 13, lineHeight: 19, fontStyle: 'italic' }}>{weeklySynth}</Text>
                <TouchableOpacity onPress={() => setWeeklySynth(null)} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
                  <Text style={{ color: '#333355', fontSize: 10, fontFamily: mono }}>dismiss</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── WHAT NEXT */}
        {recentDives.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            {!whatNextRec ? (
              <TouchableOpacity onPress={getWhatNext} disabled={whatNextLoading} activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: color + '44', backgroundColor: color + '08' }}>
                <Text style={{ color, fontSize: 16 }}>↗</Text>
                <Text style={{ color: color + 'BB', fontSize: 12, fontFamily: mono, letterSpacing: 1 }}>{whatNextLoading ? 'THINKING...' : 'WHAT NEXT?'}</Text>
                {whatNextLoading && <ActivityIndicator size="small" color={color} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            ) : (
              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: color + '44', backgroundColor: color + '08', padding: 14 }}>
                <Text style={{ color, fontSize: 9, fontFamily: mono, fontWeight: '700', letterSpacing: 2, marginBottom: 6 }}>↗ NEXT DIVE</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 6 }}>{whatNextRec.subjectName}</Text>
                <Text style={{ color: '#AAAACC', fontSize: 12, fontStyle: 'italic', lineHeight: 18 }}>{whatNextRec.reason}</Text>
                <TouchableOpacity onPress={() => setWhatNextRec(null)} style={{ marginTop: 10, alignSelf: 'flex-end' }}>
                  <Text style={{ color: color + '55', fontSize: 10, fontFamily: mono }}>dismiss</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── WHAT YOU'VE TAUGHT ME */}
        {protegeLog.length > 0 && (
          <View style={{ marginBottom: 14 }}>
            <TouchableOpacity onPress={() => setProtegeCollapsed(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: '#9977DD' }} />
                <Text style={{ color: '#CCBBEE', fontSize: 11, letterSpacing: 2, fontFamily: mono, fontWeight: '700' }}>WHAT YOU'VE TAUGHT ME</Text>
                <Text style={{ color: '#9977DD88', fontSize: 9, fontFamily: mono }}>{protegeLog.length}</Text>
              </View>
              <Text style={{ color: '#333344', fontSize: 10 }}>{protegeCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!protegeCollapsed && (
              <View style={{ borderRadius: 10, borderWidth: 1, borderColor: '#8866CC22', backgroundColor: '#8866CC06', padding: 12, gap: 8 }}>
                {protegeLog.slice(0, 8).map((entry, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                    <Text style={{ color: '#9977DD', fontSize: 10, fontFamily: mono, marginTop: 1 }}>·</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#CCBBEE', fontSize: 12, lineHeight: 17 }}>{entry.lesson}</Text>
                      <Text style={{ color: '#554466', fontSize: 9, fontFamily: mono, marginTop: 2 }}>{entry.subject} · {entry.date}</Text>
                    </View>
                  </View>
                ))}
                {protegeLog.length > 8 && (
                  <Text style={{ color: '#554466', fontSize: 9, fontFamily: mono, textAlign: 'center' }}>+{protegeLog.length - 8} more lessons</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── WHAT SHAPED ME */}
        {(protegeLog.length > 0 || recentDives.length > 0) && (
          <View style={{ marginBottom: 14 }}>
            <TouchableOpacity onPress={() => setGrowthCollapsed(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: color }} />
                <Text style={{ color: '#CCCCDD', fontSize: 11, letterSpacing: 2, fontFamily: mono, fontWeight: '700' }}>WHAT SHAPED ME</Text>
              </View>
              <Text style={{ color: '#333344', fontSize: 10 }}>{growthCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!growthCollapsed && (() => {
              const events: Array<{ icon: string; text: string; date: string }> = [];
              if (protegeLog.length > 0) events.push({ icon: '⟁', text: `Learned: ${protegeLog[0].lesson}`, date: protegeLog[0].date });
              recentDives.slice(0, 3).forEach(d => events.push({ icon: '◉', text: `Dived into ${d.subjectName}`, date: '' }));
              if (protegeLog.length > 1) events.push({ icon: '⟁', text: `Learned: ${protegeLog[1].lesson}`, date: protegeLog[1].date });
              const stageName = STAGES[stage]?.name;
              if (stageName) events.push({ icon: '✦', text: `Stage: ${stageName}`, date: '' });
              return (
                <View style={{ borderRadius: 10, borderWidth: 1, borderColor: color + '22', backgroundColor: color + '06', padding: 12, gap: 10 }}>
                  {events.slice(0, 5).map((e, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Text style={{ color: color + '88', fontSize: 11, marginTop: 1 }}>{e.icon}</Text>
                      <Text style={{ color: '#CCCCDD', fontSize: 12, flex: 1, lineHeight: 17 }}>{e.text}</Text>
                      {!!e.date && <Text style={{ color: '#444455', fontSize: 9, fontFamily: mono }}>{e.date}</Text>}
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        )}

        {/* ── CONSTELLATION */}
        {recentDives.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity onPress={() => setConstCollapsed(v => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: '#8866FF' }} />
                <Text style={{ color: '#CCCCDD', fontSize: 11, letterSpacing: 2, fontFamily: mono, fontWeight: '700' }}>CONSTELLATION</Text>
                <Text style={{ color: '#555566', fontSize: 9, fontFamily: mono }}>{recentDives.length} subjects</Text>
              </View>
              <Text style={{ color: '#333344', fontSize: 10 }}>{constCollapsed ? '▶' : '▼'}</Text>
            </TouchableOpacity>
            {!constCollapsed && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#8866FF22', backgroundColor: '#8866FF06' }}>
                {recentDives.map((d, i) => (
                  <View key={i} style={{ borderRadius: 6, borderWidth: 1, borderColor: '#8866FF', paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#8866FF0A' }}>
                    <Text style={{ color: '#CCCCDD', fontSize: 10, fontFamily: mono, opacity: i === 0 ? 1 : i < 3 ? 0.75 : i < 6 ? 0.5 : 0.3 }}>{d.subjectName}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}
