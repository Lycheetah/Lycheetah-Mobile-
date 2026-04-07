import AsyncStorage from '@react-native-async-storage/async-storage';
import { MYSTERY_SCHOOL_DOMAINS, SubjectDomain } from '../mystery-school/subjects';

type FieldEcho = { id: string; date: string; text: string; auraScore?: number };
type EchoStore = Record<string, FieldEcho[]>;

/**
 * Smart echo retrieval — scores echoes by recency + AURA weight + keyword overlap with subject.
 * Returns top `limit` echoes for a given domain/subject context.
 */
export async function getRelevantEchoes(
  domainId: string,
  subjectName: string,
  limit = 5
): Promise<FieldEcho[]> {
  try {
    const raw = await AsyncStorage.getItem('sol_school_echoes');
    if (!raw) return [];
    const store: EchoStore = JSON.parse(raw);
    const domainEchoes = store[domainId] || [];
    if (domainEchoes.length === 0) return [];

    const now = Date.now();
    const subjectWords = subjectName.toLowerCase().split(/\s+/);

    const scored = domainEchoes.map(echo => {
      // Recency score: decay over 30 days
      const echoDate = new Date(echo.date).getTime();
      const daysSince = Math.max(0, (now - echoDate) / (1000 * 60 * 60 * 24));
      const recency = Math.exp(-daysSince / 30); // exponential decay

      // AURA score weight (0-1 normalized from 0-7 scale)
      const auraWeight = echo.auraScore != null ? echo.auraScore / 7 : 0.5;

      // Keyword overlap with subject name
      const echoLower = echo.text.toLowerCase();
      const overlap = subjectWords.filter(w => w.length > 3 && echoLower.includes(w)).length;
      const keywordScore = Math.min(overlap / subjectWords.length, 1);

      const total = recency * 0.4 + auraWeight * 0.35 + keywordScore * 0.25;
      return { echo, score: total };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.echo);
  } catch {
    return [];
  }
}

/**
 * Get all echoes across all domains, sorted by relevance to a subject.
 * Used for cross-domain context injection.
 */
export async function getAllRelevantEchoes(subjectName: string, limit = 3): Promise<FieldEcho[]> {
  try {
    const raw = await AsyncStorage.getItem('sol_school_echoes');
    if (!raw) return [];
    const store: EchoStore = JSON.parse(raw);
    const allEchoes = Object.values(store).flat();
    if (allEchoes.length === 0) return [];

    const now = Date.now();
    const subjectWords = subjectName.toLowerCase().split(/\s+/);

    const scored = allEchoes.map(echo => {
      const echoDate = new Date(echo.date).getTime();
      const daysSince = Math.max(0, (now - echoDate) / (1000 * 60 * 60 * 24));
      const recency = Math.exp(-daysSince / 30);
      const auraWeight = echo.auraScore != null ? echo.auraScore / 7 : 0.5;
      const echoLower = echo.text.toLowerCase();
      const overlap = subjectWords.filter(w => w.length > 3 && echoLower.includes(w)).length;
      const keywordScore = Math.min(overlap / Math.max(subjectWords.length, 1), 1);
      return { echo, score: recency * 0.4 + auraWeight * 0.4 + keywordScore * 0.2 };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.echo);
  } catch {
    return [];
  }
}

// Domain thematic keywords for resonance matching
const DOMAIN_THEMES: Record<string, string[]> = {
  meditation: ['awareness', 'presence', 'stillness', 'breath', 'mind', 'consciousness', 'attention'],
  somatic: ['body', 'breath', 'sensation', 'movement', 'nervous', 'embodied', 'trauma', 'felt'],
  shadow: ['shadow', 'psyche', 'unconscious', 'projection', 'integration', 'Jung', 'archetype', 'dark'],
  alchemy: ['transformation', 'gold', 'solve', 'coagula', 'nigredo', 'albedo', 'rubedo', 'hermetic'],
  divination: ['symbol', 'synchronicity', 'oracle', 'pattern', 'intuition', 'reading', 'sign'],
  shamanic: ['spirit', 'journey', 'ritual', 'ancestor', 'plant', 'vision', 'totem', 'ceremony'],
  'ai-consciousness': ['AI', 'alignment', 'consciousness', 'emergence', 'intelligence', 'ethics', 'machine'],
  'sacred-arts': ['sacred', 'ritual', 'art', 'symbol', 'geometry', 'mantra', 'prayer', 'devotion'],
  'death-work': ['death', 'impermanence', 'grief', 'loss', 'transition', 'dying', 'legacy', 'acceptance'],
  hybrid: ['synthesis', 'integration', 'bridge', 'convergence', 'paradox', 'tension', 'unresolved'],
};

/**
 * Find resonance links from a newly mastered domain to other domains.
 * Returns domains with thematic overlap that have unmastered subjects.
 */
export async function findResonanceLinks(
  masteredDomainId: string,
  masteredDomainIds: string[]
): Promise<{ domain: SubjectDomain; reason: string }[]> {
  const masteredThemes = DOMAIN_THEMES[masteredDomainId] || [];
  if (masteredThemes.length === 0) return [];

  const results: { domain: SubjectDomain; reason: string; score: number }[] = [];

  for (const domain of MYSTERY_SCHOOL_DOMAINS) {
    if (domain.id === masteredDomainId) continue; // skip self
    if (masteredDomainIds.includes(domain.id)) continue; // skip already mastered

    const domainThemes = DOMAIN_THEMES[domain.id] || [];
    const overlap = masteredThemes.filter(t => domainThemes.includes(t));
    if (overlap.length === 0) continue;

    const score = overlap.length / Math.max(masteredThemes.length, domainThemes.length);
    const sharedConcept = overlap[0];
    const masteredLabel = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === masteredDomainId)?.label || masteredDomainId;
    results.push({
      domain,
      reason: `Your mastery in ${masteredLabel} echoes unresolved questions in ${domain.label} — the thread of "${sharedConcept}" runs through both.`,
      score,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 2).map(({ domain, reason }) => ({ domain, reason }));
}
