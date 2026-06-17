import AsyncStorage from '@react-native-async-storage/async-storage';

type SubjectLayer = 'FOUNDATION' | 'MIDDLE' | 'EDGE' | 'OPEN' | 'VOID';
type CompanionMood = 'dormant' | 'present' | 'lit' | 'transcendent';

export interface LAMAGUEStateInput {
  lq: number;
  prevLq?: number;
  layer: SubjectLayer;
  subjectName: string;
  companionStage: number;
  companionMood: CompanionMood;
  streak: number;
  messageCount: number;
}

// Σ encodes which layer of the Mystery School was entered
const SIGMA: Record<SubjectLayer, string> = {
  FOUNDATION: 'Σ●',
  MIDDLE:     'Σ~',
  EDGE:       'Σ◈',
  OPEN:       'Σ∅',
  VOID:       'Σ◌',
};

function blockFromSubject(name: string): string {
  const s = name.toLowerCase();
  if (s.includes('math') || s.includes('logic') || s.includes('proof') || s.includes('stat')) return 'synthesis';
  if (s.includes('histor') || s.includes('philos') || s.includes('ethic')) return 'recursion';
  if (s.includes('sci') || s.includes('physic') || s.includes('chem') || s.includes('bio')) return 'analysis';
  if (s.includes('art') || s.includes('music') || s.includes('creat') || s.includes('writ')) return 'creation';
  if (s.includes('lang') || s.includes('linguis') || s.includes('grammar')) return 'translation';
  if (s.includes('code') || s.includes('program') || s.includes('software')) return 'synthesis';
  return 'integration';
}

export function generateLAMAGUEState(input: LAMAGUEStateInput): string {
  const { lq, prevLq, layer, subjectName, companionStage, companionMood, streak, messageCount } = input;

  // Ψ — consciousness delta symbol
  const delta = prevLq !== undefined ? lq - prevLq : 0;
  const psi = delta > 0.02 ? 'Ψ↑' : delta < -0.02 ? 'Ψ↓' : 'Ψ~';

  // Σ — layer field symbol
  const sigma = SIGMA[layer] ?? 'Σ~';

  // Π — truth pressure score (E·P)/(S+S₀)×100
  const E = lq;
  const P = Math.min(messageCount / 10, 1);
  const S = Math.max(0.1, 1 - lq);
  const S0 = 0.2;
  const pi = Math.round((E * P) / (S + S0) * 100);

  const block = blockFromSubject(subjectName);

  return `${psi} ${sigma} Π+${pi} | block:${block} | stage:${companionStage} | mood:${companionMood} | streak:${streak}`;
}

export async function saveLAMAGUEState(state: string): Promise<void> {
  await AsyncStorage.setItem('sol_lamague_state', state);
}

export async function loadLAMAGUEState(): Promise<string | null> {
  return AsyncStorage.getItem('sol_lamague_state');
}
