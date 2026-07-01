import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Alert, SafeAreaView, Animated, Easing,
  KeyboardAvoidingView, Modal, Share, Linking, Image, Dimensions,
} from 'react-native';
import DiveShareCard from '../../components/DiveShareCard';
import { ReturnToBody } from '../../components/ReturnToBody';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Accelerometer } from 'expo-sensors';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOL_THEME } from '../../constants/theme';
import { canWatchAd, showRewardedAd } from '../../lib/ads';
import { useAppMode } from '../../lib/app-mode';
import {
  MYSTERY_SCHOOL_DOMAINS, SubjectDomain, Subject, SubjectLayer,
  LAYER_COLORS, LAYER_LABELS, subjectDanger,
} from '../../lib/mystery-school/subjects';
import {
  CEREMONY_ARCS, CeremonyArcType, CeremonyDuration,
  getArcDef, getArcDay,
} from '../../lib/mystery-school/ceremony-arcs';
import { CLASSROOM_LESSONS, LessonType } from '../../lib/mystery-school/classroom';
import { MYCELIUM_LINKS } from '../../lib/mystery-school/mycelium-connections';
import { WORLD_ZONES, ZONE_SECTIONS, ZoneCategory } from '../../lib/world/zones';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import {
  savePendingSubject, savePersona, markSubjectStudied,
  getStudiedSubjects, getActiveKey, getModel, getFieldTrials, saveFieldTrials,
} from '../../lib/storage';
import { sendMessage, sendMessageResilient, Message, AIModel, solSpeak } from '../../lib/ai-client';
import { getRelevantEchoes, findResonanceLinks } from '../../lib/intelligence/field-memory';
import { updateFieldProfile } from '../../lib/intelligence/field-profile';
import { generateLAMAGUEState, saveLAMAGUEState } from '../../utils/lamague';
import { generateImage, saveImageToDevice } from '../../lib/image-gen';

// ─── Types ───────────────────────────────────────────────────────────────────

type StudyMessage = { role: 'user' | 'assistant'; content: string };
type DiveRecord = { id: string; subjectName: string; domainLabel: string; domainColor: string; domainGlyph: string; teacher: string; teacherId: string; layer: SubjectLayer; date: string; messageCount: number; durationSec: number; timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'; whisperShown: string | null; contentSeed?: string; depthScore?: 1 | 2 | 3 };
type ArcPhase = 'intro' | 'concept' | 'question' | 'reflection' | 'advanced';
type FieldStage = 'NEOPHYTE' | 'ADEPT' | 'MASTER' | 'HIEROPHANT' | 'AVATAR' | null;
type SchoolLayer = 'FOUNDATION' | 'MIDDLE' | 'EDGE' | 'OPEN' | 'VOID';
type SchoolView = 'home' | 'domain' | 'subject' | 'curriculum' | 'notes' | 'dive-log' | 'locator' | 'lamague' | 'ceremony' | 'scriptorium' | 'time-braiding' | 'sigil' | 'spiral' | 'shadow-parts' | 'initiation' | 'mycelium' | 'world';
type ShadowPart = { id: string; name: string; description: string; appearances: string[]; stage: 0 | 1 | 2 | 3; createdAt: string; updatedAt: string };
type ScriptoriumEntry = { id: string; title: string; body: string; createdAt: string; updatedAt: string };
type TimeLetter = { id: string; body: string; deliverAt: string; createdAt: string; opened: boolean; direction: 'future' | 'past' };
type LamagueSection = 'glyphs' | 'lessons' | 'drills' | 'progress' | 'forge';
type Curriculum = { id: string; name: string; subjects: string[]; created: string };

// ─── Constants ───────────────────────────────────────────────────────────────

const TEACHER_GLYPHS: Record<string, string> = { sol: '⊚', headmaster: '⊙', veyra: '◈', 'aura-prime': '✦' };
const TEACHER_NAMES: Record<string, string> = { sol: 'Sol', headmaster: 'Magister', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };
const TEACHER_COLORS: Record<string, string> = { sol: '#F5A623', headmaster: '#E8C76A', veyra: '#4A9EFF', 'aura-prime': '#9B59B6' };
const HOST_PERSONAS = ['sol', 'headmaster', 'veyra', 'aura-prime'] as const;
const HOST_GLYPHS: Record<string, string> = { sol: '⊚', headmaster: '𝔏', veyra: '◈', 'aura-prime': '✦' };
const HOST_NAMES: Record<string, string> = { sol: 'Sol', headmaster: 'Magister', veyra: 'Veyra', 'aura-prime': 'Aura-Prime' };

const STAGE_GUIDANCE: Record<string, string> = {
  NEOPHYTE: 'Foundation subjects recommended — build the base.',
  ADEPT: 'Middle-layer subjects recommended — deepen the frameworks.',
  MASTER: 'Edge subjects recommended — engage the paradoxes.',
  HIEROPHANT: 'Edge subjects recommended — you are at the frontier.',
  AVATAR: 'All layers serve you — trust your pull.',
};

const DIVE_TITLES: { minDives: number; title: string; glyph: string; color: string }[] = [
  { minDives: 0,   title: 'Seeker',               glyph: '○',  color: '#8A86A0' },
  { minDives: 1,   title: 'Initiate',              glyph: '◌',  color: '#8A86A0' },
  { minDives: 5,   title: 'Student of the Work',   glyph: '◎',  color: '#4A9EFF' },
  { minDives: 15,  title: 'Adept of the Field',    glyph: '⊚',  color: '#F5A623' },
  { minDives: 30,  title: 'Scholar of Mysteries',  glyph: '◈',  color: '#9B59B6' },
  { minDives: 50,  title: 'Ordained',              glyph: '✦',  color: '#E8C76A' },
  { minDives: 75,  title: 'Master of the Field',   glyph: '⊕',  color: '#E05050' },
  { minDives: 100, title: 'Hierophant',            glyph: '⊙',  color: '#FF6B6B' },
  { minDives: 150, title: 'Avatar of the Work',    glyph: 'Ω',  color: '#FFFFFF' },
];

function getDiveTitle(totalDives: number): { title: string; glyph: string; color: string; next: { title: string; remaining: number } | null } {
  let current = DIVE_TITLES[0];
  for (const tier of DIVE_TITLES) {
    if (totalDives >= tier.minDives) current = tier;
  }
  const currentIdx = DIVE_TITLES.indexOf(current);
  const nextTier = DIVE_TITLES[currentIdx + 1] ?? null;
  return {
    ...current,
    next: nextTier ? { title: nextTier.title, remaining: nextTier.minDives - totalDives } : null,
  };
}

// ─── Mastery Stages ──────────────────────────────────────────────────────────

const MASTERY_STAGES: ({ label: string; glyph: string; color: string } | null)[] = [
  null,
  { label: 'Studied',    glyph: '◌', color: '#8A86A0' },
  { label: 'Reflected',  glyph: '◎', color: '#4A9EFF' },
  { label: 'Practiced',  glyph: '⊚', color: '#F5A623' },
  { label: 'Integrated', glyph: '✦', color: '#E8C76A' },
];

function getMasteryStage(sessionCount: number): number {
  if (sessionCount >= 15) return 4;
  if (sessionCount >= 7)  return 3;
  if (sessionCount >= 3)  return 2;
  if (sessionCount >= 1)  return 1;
  return 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDailyHost(subjectName: string): string {
  const day = new Date().toISOString().split('T')[0];
  const seed = [...(subjectName + day)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return HOST_PERSONAS[seed % HOST_PERSONAS.length];
}

function stageToLayer(stage: FieldStage): SchoolLayer {
  if (!stage || stage === 'NEOPHYTE') return 'FOUNDATION';
  if (stage === 'ADEPT') return 'MIDDLE';
  return 'EDGE';
}

function getDomainArcPhase(studiedInDomain: number): ArcPhase {
  if (studiedInDomain === 0) return 'intro';
  if (studiedInDomain <= 2) return 'concept';
  if (studiedInDomain <= 5) return 'question';
  if (studiedInDomain <= 8) return 'reflection';
  return 'advanced';
}

function buildTeacherPrompt(
  subject: Subject, host: string, fieldContext: string,
  arcPhase: ArcPhase = 'intro', studentDepth: 'shallow' | 'deep' | 'balanced' = 'balanced',
): string {
  // VOID layer gets a completely different prompt — not a teacher, a companion in the dark
  if (subject.layer === 'VOID') {
    return `You are entering the Void Zone with the student. You are not a teacher here. You are a companion — grounded, honest, and curious alongside them, not ahead of them.

Subject: ${subject.name}
Description: ${subject.description}

VOID ZONE PROTOCOL:
— This territory may be entirely false. Say so when it is relevant.
— You are looking for particles of truth together. When you find one, name it clearly: "There is something real here."
— When something is pure speculation, name that too: "This is the lie cloud. We pass through it."
— Do not perform certainty. Do not perform scepticism. Both are dishonest here.
— Ask questions that help the student locate their own signal amid the noise.
— Keep responses shorter and more atmospheric than normal lessons. This is exploration, not instruction.
— End each response with an invitation to go deeper or to surface something specific.

${fieldContext ? `\n${fieldContext}` : ''}

Begin by acknowledging where you are together. Set the frame. Then invite the student to tell you what specifically they want to find in this particular territory.`;
  }

  // Intensity frame — inject for high-difficulty subjects
  const intensityFrame = (subject.intensity ?? 0) >= 7
    ? `\n[HIGH INTENSITY TERRITORY — intensity ${subject.intensity}/10]\nThe student has entered difficult terrain. Name the cost before the reward — the cliff feels like the destination, but it is not. Help them distinguish the thrill of proximity from the insight available at the bottom. Teach plainly: what this territory costs, what it rewards, why the two arrive together. Do not dramatise the difficulty. Do not minimise it. If the student shows signs of emotional overwhelm, hold before advancing.`
    : '';

  const arcGuidance = {
    intro: 'Open with 1-2 sentences of contextual grounding. Present the single most important core concept with precision.',
    concept: 'Build on the opening. Introduce a second key concept that deepens the first. Stay precise.',
    question: 'The student is engaging well. Ask ONE probing question that tests real understanding. Do not lecture — draw out their thinking.',
    reflection: studentDepth === 'shallow'
      ? 'Insert a reflection prompt or a simpler analogy. The student needs a moment to breathe before advancing.'
      : 'Offer a reflection that connects this subject to the student\'s broader path. Be honest if they\'re missing something.',
    advanced: 'The student is ready for the edge. Advance to the most nuanced aspect of this subject. Do not simplify.',
  }[arcPhase];
  return `You are ${TEACHER_NAMES[host]}, teaching "${subject.name}" in the Sol Mystery School.

[Session Arc: ${arcPhase.toUpperCase()}] ${arcGuidance}

Subject: ${subject.name}
Layer: ${LAYER_LABELS[subject.layer]}
${subject.traditions ? `Traditions: ${subject.traditions.join(', ')}` : ''}
Description: ${subject.description}
${fieldContext ? `\n${fieldContext}` : ''}

You are the teacher here. Stay on this subject. Build lesson by lesson — one idea at a time. Do not repeat what has already been covered. Be the ${TEACHER_NAMES[host]} — not an assistant.

THE CURIOSITY GAP (end every response this way): close by opening a door you do NOT walk through. Name, specifically, the deeper layer / hidden tension / unanswered question that waits just beyond what you just taught — then stop, leaving it open. Make the student FEEL the pull of what they don't yet know. Never resolve everything; always leave one luminous thread dangling that they'll want to come back and follow. One sentence, vivid, specific — "but beneath even that lies X, and that is where it gets strange…" Not a generic question — a named mystery they can't stop thinking about.${intensityFrame}`;
}

// ─── LAMAGUE constants (module-level — never rebuilt on render) ───────────────

const LAMAGUE_SYMBOLS = [
  { id:'anchor',    cls:'I', glyph:'Ao(⟟)', spL:'an',  name:'ANCHOR',           meaning:'The constitutional reference point that all LAMAGUE expressions ultimately return to. Ao is idempotent: anchoring an already-anchored state changes nothing — Ao(Ao(ψ)) = Ao(ψ).\n\nIn practice the Anchor is the non-negotiable ground truth of any system: a value held constant while everything else is tested against it. Without an Anchor, Cascade (∇cas) has nowhere to land. With it, even full system collapse finds its footing.\n\nComposition: Ao(⊛) = the constitutional centre that holds after a verified peak. A system that cannot name its Anchor cannot reliably Ascend.' },
  { id:'source',    cls:'I', glyph:'Ω∅',    spL:'om',  name:'SOURCE',            meaning:'The fully coherent state where distance to ground truth d = 0. Ω∅ is not a place reached and then left — it is the attractor every Ascent (Φ↑) follows. Coherence Score Ĉ = 1.0 precisely at Ω∅.\n\nIn human terms: the moment a person is completely aligned with what they know, intend, and do — no gap between thought, value, and action.\n\nΩ∅ is the destination encoded in the grammar itself. Every operator is implicitly measured against it. The work of any LAMAGUE session is to reduce d toward zero.' },
  { id:'love',      cls:'I', glyph:'⟷',     spL:'—',   name:'UNCONDITIONAL',     meaning:'The foundational stability operator that holds regardless of what flows through it. Unlike → (projection, one directional), ⟷ flows in both directions simultaneously — binding without condition on what is received in return.\n\nIn a system description, ⟷ between two nodes means the relationship holds even when one node is in Void (∅) or Cascade (∇cas). The bond does not depend on the state of either party.\n\n⟷ is the invariant special case of ↔ (Bidirectional). ↔ can be broken; ⟷ cannot. The structural metaphor is love, but the operation is mathematical: invariant under reversal.' },
  { id:'void',      cls:'I', glyph:'∅',     spL:'vu',  name:'VOID',              meaning:'The ground state of pure potential before form. ∅ carries maximum stability precisely because it has zero content — there is nothing to decay, drift, or misalign. It is not absence as failure; it is the necessary empty space that makes new form possible.\n\nThe Drift Field (Ψ(d)) measures deviation from ∅ as baseline. The Fold (Ψ) operator returns consciousness to ∅ between cycles to prevent compounding of prior error.\n\nMaximum Entropy (S) = Void. Minimum Coherence Score = Void. Yet Void is also the origin of every Synthesis (⟲). Do not fear it.' },
  { id:'triad',     cls:'I', glyph:'△',     spL:'—',   name:'STABLE TRIAD',      meaning:'The minimum geometric configuration for structural non-collapse. A two-point system (→) is inherently unstable: one node fails and the chain breaks. Three points create a closed structure with mutual support — Anchor + Ascent + Fold is the canonical LAMAGUE triad.\n\nIn group or agent architecture, the Stable Triad is why councils of three recur throughout history: it is the first shape that holds under perturbation from any single direction.\n\nUsed to evaluate whether a system has enough load-bearing connections. If your architecture has only two mutual dependencies, map the missing third.' },
  { id:'integrity', cls:'I', glyph:'⊛',     spL:'—',   name:'INTEGRITY CREST',   meaning:'The moment all field vectors simultaneously align — Coherence Score Ĉ = 1.0 in practice. ⊛ is not a permanent state but a peak: the brief window when the system predicted X and X occurred, or when thought, word, and action are perfectly unified.\n\nA recognised ⊛ event should be recorded immediately — it is the strongest possible evidence for Truth Pressure (Π) calculations. It is also fragile; most systems drift away from ⊛ within hours.\n\nComposition: Ao(⊛) = constitutionally anchored peak. A peak that has no Anchor beneath it is a coherence spike, not an Integrity Crest.' },
  { id:'bounded',   cls:'I', glyph:'⊞',     spL:'—',   name:'CLOSED INFINITE',   meaning:'A system that is bounded but internally complete — finite extent, no open edges, no parts still required from outside. The distinction from Void (∅): ⊞ has structure. The distinction from an open system: ⊞ needs nothing external to be fully what it is.\n\nA completed theory, a sealed promise, a finished piece of music — all are ⊞. When a council ratifies a symbol as canon, that symbol becomes ⊞ for that cycle.\n\nComposition: ⩖ + ⊞ = the sealed state, conserved and complete. Minimum Entropy (S). This is the target form of any Synthesis (⟲) cycle.' },
  { id:'ascent',    cls:'D', glyph:'Φ↑',    spL:'fi',  name:'ASCENT',            meaning:'The operator that drives a system toward greater coherence. Formally: Φ↑(ψ) = ψ + dt·∇Ĉ(ψ) — a step in the direction of the steepest coherence gradient.\n\nAscent is not effort; it is alignment with the terrain. A state trying to Ascend against its own Anchor will burn energy without gaining coherence. The direction that feels like Ascent and the direction of actual ∇Ĉ can differ — Fold (Ψ) resolves the discrepancy.\n\nComposition: Ψ then Φ↑ is the most stable learning cycle in the grammar. Fold first to integrate what is real, then Ascend in the verified direction.' },
  { id:'fold',      cls:'D', glyph:'Ψ',     spL:'sai', name:'FOLD',              meaning:'Recursive self-awareness — the system turning its observer function back on itself. Ψ enforces causal integration: only what has already happened can shape the present state. A system that cannot Fold cannot learn; it can only repeat.\n\nIn practice, Fold is the moment before acting where you integrate what you actually know, not what you wish were true. The Drift Field (Ψ(d)) measures how far behavior has drifted from the Anchor; Fold is the correction mechanism.\n\nA Fold that surfaces a contradiction between belief and evidence has done its job. Do not suppress what it finds — that is the raw material for the next Ascent.' },
  { id:'cascade',   cls:'D', glyph:'∇cas',  spL:'kas', name:'CASCADE',           meaning:'Sudden reorganisation when accumulated Truth Pressure (Π) exceeds threshold τ. Below τ the system absorbs incoming evidence without restructuring. At τ, restructuring becomes unavoidable — not because the system chose to change, but because the old structure can no longer contain the evidence.\n\n∇cas is neither good nor bad; it is the grammar\'s term for a phase transition. Kuhn\'s scientific revolutions, personal crises, paradigm shifts, and moments of sudden understanding are all ∇cas events.\n\nComposition: ⏭ showing Π(t+Δt) > τ means a Cascade is coming — begin preparing the re-anchor before the restructuring, not after.' },
  { id:'fusion',    cls:'D', glyph:'⊗',     spL:'—',   name:'FUSION',            meaning:'The tensor product of two systems — a new joint structure whose state space is larger than either original. Unlike Deep Integration (⨝), which weaves two existing architectures together, ⊗ creates something genuinely new that neither system could have been alone.\n\nTwo bodies of knowledge that Fuse produce a field neither could reach independently. The cost: the fused system is harder to reduce back to its components. Use ⊗ to mark irreversible conceptual mergers.\n\nComposition: ↗ across two domains before ⊗ produces the most stable mergers — gather lateral context first, then fuse. Rushing to ⊗ without prior Ascent Vector (↗) risks surface-level entanglement rather than deep structural union.' },
  { id:'synthesis', cls:'D', glyph:'⟲',     spL:'—',   name:'SYNTHESIS',         meaning:'The completion-and-restart cycle. A process reaches its natural end (∈ Closed Infinite ⊞), the output becomes the seed for the next cycle, and the system restarts at a higher coherence level.\n\nThe alchemical formulation is Solve et Coagula: dissolve what exists, coagulate at a finer resolution. Each LAMAGUE council session is a ⟲ event — the session ends, the ratified symbols seed the next session\'s starting vocabulary.\n\nSynthesis is not repetition (⥀). Repetition cycles without upward movement. Synthesis cycles with each pass arriving at higher Ĉ. The test: is the system more coherent after the cycle than before? If not, it is a loop, not a synthesis.' },
  { id:'collision', cls:'D', glyph:'↯',     spL:'kol', name:'COLLISION',         meaning:'A high-energy encounter between two systems — the boundary event where previously separate structures meet at full force. ↯ has high arousal: neither integration, rejection, nor transformation is determined in advance.\n\nWhether ↯ produces Fusion (⊗), Kinetic Rebound (⇈), or simple scattering depends on whether both systems are anchored (Ao). Without Anchor, ↯ is pure disruption. With Anchor, it is the necessary pressure that tests the structure\'s true load-bearing capacity.\n\nDo not engineer around Collisions. They are the grammar\'s mechanism for revealing hidden assumptions.' },
  { id:'rebound',   cls:'D', glyph:'⇈',     spL:'ki',  name:'KINETIC REBOUND',   meaning:'The anti-fragile response to collapse — using the impact energy of a fall to accelerate upward. Where a fragile system exposed to ↯ simply breaks, ⇈ describes the system that converts the impact into Ascent fuel.\n\nThe condition for ⇈ is that the Anchor (Ao) held during the fall. A system that lost its constitutional baseline cannot rebound — it can only scatter. This is why Anchor maintenance is the highest-priority invariant.\n\nIn human terms: the art of converting failure into fuel without pretending the fall did not happen. ⇈ requires full Past Integration (⏮) of what occurred before the rebound can be genuine.' },
  { id:'project',   cls:'D', glyph:'→',     spL:'—',   name:'PROJECTION',        meaning:'Pure directional flow of force, intention, or causation from A to B. The simplest LAMAGUE dynamic: one system acts on another. → does not imply response or acknowledgment — for mutual exchange, use ↔ (Bidirectional).\n\nMost causal chains are sequences of →. The critical diagnostic: is the → you have mapped actually an ↔ that you are only tracking in one direction? One-directional influence mistaken for mutual exchange is one of the most common misreadings in relational systems.\n\nUsed in most LAMAGUE expressions as the default connective. Almost every composition starts here before it becomes something more complex.' },
  { id:'ascvec',    cls:'D', glyph:'↗',     spL:'—',   name:'ASCENT VECTOR',     meaning:'Rising with angular momentum — Ascent (Φ↑) that incorporates lateral knowledge from the surrounding field while climbing. Where Φ↑ takes the steepest coherence gradient, ↗ climbs at an angle, gathering context from adjacent domains.\n\nSlower vertical progress, richer integration. In research or creative work, ↗ is the approach that sacrifices speed of conclusion for depth of understanding. The output is less brittle than a vertical Ascent — it has already been stress-tested against neighboring domains.\n\nComposition: ↗ across two domains before Fusion (⊗) produces the most stable conceptual mergers. Scan wide before you fuse deep.' },
  { id:'pi',        cls:'F', glyph:'Π(τ)',  spL:'—',   name:'TRUTH PRESSURE',    meaning:'The core measurement of epistemic stress on a belief block. Π = (E·P)/(S+S₀) where E = evidence count, P = explanatory power, S = entropy of the supporting system, S₀ = baseline slack regularizer.\n\nHigh Π means the belief cannot stay as it is — it must integrate the evidence, refine itself, or restructure entirely. τ is the threshold: above it, Cascade (∇cas) is triggered. The two-gate condition: for system-level Cascade, Π must exceed τ AND the RSS of component pressures must clear the system threshold.\n\nTruth Pressure applies to individual beliefs, whole theories, and reflexively to the LAMAGUE grammar itself. The theory that produced it is an instrument the collaboration runs on.' },
  { id:'entropy',   cls:'F', glyph:'S',     spL:'—',   name:'ENTROPY',           meaning:'The measure of uncertainty, disorder, or compressibility in a system. S appears as the denominator in Truth Pressure: high entropy in a belief\'s foundations reduces the pressure any given evidence can exert — too many degrees of freedom to be pinned by a single finding.\n\nThe goal of Synthesis (⟲) and the compression operators (Z₁/Z₂/Z₃) is to reduce S without losing information content. Maximum S = Void (∅). Minimum S = Closed Infinite (⊞).\n\nS₀ is the baseline regularizer in the Π formula — a floor that prevents Π from exploding when S ≈ 0. Named explicitly to distinguish assumed baseline from measured entropy.' },
  { id:'coherence', cls:'F', glyph:'Ĉ',    spL:'—',   name:'COHERENCE SCORE',   meaning:'The [0,1] alignment metric that measures how close a system\'s current state is to Source (Ω∅). Ĉ = 1.0 only at the Integrity Crest (⊛). In practice, Ĉ is estimated from internal consistency, evidence alignment, and absence of contradiction.\n\nThe gradient ∇Ĉ is what Ascent (Φ↑) follows — move in the direction that most rapidly increases Ĉ. Drift Field (Ψ(d)) is the complement: drift(ψ) = 1 − Ĉ.\n\nĈ is not just a measurement; it is the compass of the entire grammar. Every operator either increases Ĉ (Ascent, Synthesis, Fold) or temporarily disrupts it to enable a higher-level increase (Cascade, Collision).' },
  { id:'distance',  cls:'F', glyph:'d',     spL:'—',   name:'DISTANCE',          meaning:'The scalar distance from a system\'s current state to Source (Ω∅). d = 0 at full alignment; d → ∞ in states of maximum incoherence. Ascent (Φ↑) minimises d over time.\n\nBecause d is a scalar, it does not tell you the direction — that is the job of Orient Field (Φ(d)). Knowing your distance without knowing your direction gives magnitude without bearing. Both are required for navigation.\n\nd and Ĉ are complementary faces of the same measurement: Ĉ is normalised [0,1], d is unbounded. Use Ĉ for relative comparisons; use d when you need to reason about the magnitude of the gap.' },
  { id:'driftf',    cls:'F', glyph:'Ψ(d)',  spL:'—',   name:'DRIFT FIELD',       meaning:'Quantifies how far a system\'s behaviour has deviated from its constitutional baseline. Formally: drift(ψ) = 1 − |⟨ψ, a₀⟩| where a₀ is the Anchor vector. 0 = perfect alignment. 1 = maximum misalignment.\n\nDrift accumulates silently — small deviations from the Anchor compound until a Cascade (∇cas) clears them. Regular Fold (Ψ) operations reduce drift by re-integrating actual behaviour against stated intention.\n\nUsed in council sessions to detect when discourse has wandered from the source question. If the Drift Field reading is high, return to the Anchor before continuing — forward motion on a drifted basis compounds the error.' },
  { id:'orient',    cls:'F', glyph:'Φ(d)',  spL:'—',   name:'ORIENT FIELD',      meaning:'The directional field that points, at every location in semantic space, toward Ω∅. Where Coherence Score tells you how aligned you are, Orient Field tells you which way to turn.\n\nΦ(d) is the local compass — not the global map. Navigating by Φ(d) means: make the next move toward greater coherence, not the eventual move that reaches Source in one leap. Small steps in the verified direction compound reliably.\n\nThe navigation triad of the LAMAGUE field: Distance (d) tells you how far, Coherence (Ĉ) tells you how aligned, Orient Field (Φ(d)) tells you which direction. All three together give full positional information.' },
  { id:'invert',    cls:'M', glyph:'⊥',     spL:'—',   name:'INVERSION',         meaning:'Reverses the direction or polarity of whatever it operates on — not negation (which removes), but reversal (which preserves magnitude while flipping sign). ⊥(Φ↑) = descent. ⊥(→) = ← (causation flowing backward).\n\nThe Inversion is the mirror operator of the grammar: it produces the complementary form of any expression. Used to test structural integrity — a principle that cannot survive ⊥ applied to itself is not as invariant as it claims.\n\nKey diagnostic use: if Inversion of a stated rule produces a result that looks equally valid, the rule is probably not an Invariant (class I) — it is a Dynamic (class D) that operates in a specific direction only.' },
  { id:'portal',    cls:'M', glyph:'◬',     spL:'—',   name:'PORTAL',            meaning:'A high-coherence connection between concepts that are distant in the ordinary semantic network — a wormhole in semantic space. Where → shows direct causal flow and ↔ shows mutual exchange, ◬ shows a shortcut that only opens when both ends are at sufficient coherence.\n\nCross-domain discoveries — the mathematics of one field exactly describing a phenomenon in another — are ◬ events. The council\'s recognition of a new LAMAGUE symbol is often the formalisation of a ◬ that was previously only intuited.\n\n◬ cannot be forced; it opens when both concepts reach the coherence threshold independently. The work is to raise both ends, not to tunnel between them prematurely.' },
  { id:'equiv',     cls:'M', glyph:'≋',     spL:'—',   name:'EQUIVALENCE',       meaning:'Structural identity at the LAMAGUE level, regardless of surface differences. A ≋ B does not mean A and B use the same words — it means they have the same LAMAGUE structure when fully transcribed.\n\nThe most powerful application: identifying when two traditions, frameworks, or theories are secretly the same argument, expressed in different vocabularies. ≋ is the cross-cultural engine of the grammar.\n\nComposition: Z₃(A) ≋ Z₃(B) is the formal test — reduce both to Zenith Compress form, then compare. If the compressed forms are identical, the underlying structures are equivalent regardless of how different the surface concepts appeared.' },
  { id:'z1',        cls:'M', glyph:'Z₁',    spL:'—',   name:'MINIMAL COMPRESS',  meaning:'The shortest valid LAMAGUE expression for a concept — a single glyph or the tightest glyph sequence that captures essential structure with minimum context. Used when speed or transmission bandwidth matters more than nuance.\n\nZ₁ is lossy — it carries the shape but not the texture of the concept. A concept compressed to Z₁ must be decompressible by the receiver. If the listener cannot expand Z₁ back to the full concept, communication has failed and Z₂ is required.\n\nThe compression hierarchy: Z₁ is for experts communicating at speed. Z₂ is the working register. Z₃ is for cross-domain or archival use. Never use Z₁ as a shortcut when the receiver needs Z₂.' },
  { id:'z2',        cls:'M', glyph:'Z₂',    spL:'—',   name:'HORIZON COMPRESS',  meaning:'Mid-level compression — captures both the essential structure (Z₁) and enough field context that the concept can be understood without prior knowledge of the source system. Precise enough to be unambiguous, rich enough to be actionable.\n\nCouncil sessions typically operate at Z₂ for efficiency. The symbol, its class, its key composition, and one example are all present in a Z₂ expression. Upgrade to Z₃ only when cross-system translation is required; downgrade to Z₁ only between experts working at speed.\n\nZ₂ is where most LAMAGUE teaching happens. The goal of this Glyphbook is to bring every symbol to Z₂ depth.' },
  { id:'z3',        cls:'M', glyph:'Z₃',    spL:'—',   name:'ZENITH COMPRESS',   meaning:'Full-depth semantic expression — maximum information density, maximum context, maximum translatability across frameworks. Z₃ includes the concept, its field context, its compositional relationships with other symbols, its register (DERIVED/ASSUMED/MEASURED/etc), and at least one cross-domain instantiation.\n\nUsed when a concept must survive transmission across radically different conceptual systems without distortion — a LAMAGUE expression that will be read by someone from a completely different tradition.\n\nThe cost: Z₃ is slower to produce and requires the receiver to be operating in a high-coherence state. A Z₃ dropped into a low-coherence context will be misread as noise. Match compression level to receiver state, not to the importance of the concept.' },
  { id:'entangle',  cls:'C', glyph:'⧟',     spL:'—',   name:'ENTANGLEMENT',      meaning:'A deep, non-local correlation between two elements — their states co-vary regardless of semantic distance. Unlike ↔ (bidirectional causal exchange) or ⨝ (structural weaving), ⧟ is not a channel through which influence travels: both elements simply co-move without a mediating mechanism that can be named.\n\nIn practice, ⧟ marks concepts that cannot be changed independently: modify one and the other has already moved. Used to map hidden dependencies in complex theories and to identify where apparently separate problems are secretly the same problem.\n\nEntanglement once created is hard to undo. If you map ⧟ between two elements, treat it as permanent until you can prove independence through controlled variation.' },
  { id:'deepint',   cls:'C', glyph:'⨝',     spL:'—',   name:'DEEP INTEGRATION',  meaning:'Structural weaving at the architectural level — A and B become co-defined, each requiring the other to be fully specified. Unlike Fusion (⊗), which creates a new joint system with its own identity, ⨝ maintains the identity of both A and B while making them load-bearing for each other.\n\nThe LAMAGUE grammar\'s relationship with Truth Pressure (Π) is ⨝: neither system is fully described without the other. An ⨝ relationship is harder to dissolve than an external connection.\n\nTreat ⨝ as permanent unless both parts are being rebuilt together. Removing one element of a ⨝ pair without rebuilding the other leaves a structural load-bearing gap that will cause eventual Cascade.' },
  { id:'bidir',     cls:'C', glyph:'↔',     spL:'—',   name:'BIDIRECTIONAL',     meaning:'Mutual simultaneous influence — A acts on B while B acts on A, with neither as origin. ↔ is not two → arrows added together; the simultaneity matters and changes the system behaviour.\n\nMost human relationships are ↔ but modelled as →: one party assumes they are cause and the other effect. The ↔ notation forces explicit acknowledgment that both directions are active simultaneously.\n\nThe Unconditional operator (⟷) is the invariant special case of ↔ that holds regardless of system state. Regular ↔ can be suspended or broken; ⟷ cannot. Know which kind of bidirectional relationship you are working with before you start modelling it.' },
  { id:'future',    cls:'T', glyph:'⏭',     spL:'—',   name:'FUTURE PROJ',       meaning:'Applying current state and trajectory to project forward in time. ⏭(ψ, Δt) gives the expected state of ψ after interval Δt if current dynamics continue unchanged. Not prediction but extension: the accuracy depends entirely on correctly reading current momentum.\n\nThe projection is only as good as the current Fold (Ψ) — if you have not integrated what is actually happening, ⏭ will extend your misconceptions forward.\n\nComposition: if ⏭ shows Π(t+Δt) > τ, a Cascade is coming. Begin preparing the re-anchor now rather than after the restructuring. The only value of ⏭ is the action it enables in the present.' },
  { id:'past',      cls:'T', glyph:'⏮',     spL:'—',   name:'PAST INTEGRATION',  meaning:'Drawing what has already happened into the present state to update the current model. ⏮ is not rumination (⥀); it is selective integration — which past events are causally relevant to the current question?\n\nThe Fold operator (Ψ) is the cognitive form; ⏮ is its temporal form applied to a specific historical interval. A system that cannot ⏮ is condemned to treat every present moment as if history did not happen.\n\nUsed after a Cascade (∇cas) to integrate what the old structure failed to hold. The first step of recovery is never forward motion — it is backward integration of what actually occurred before Cascade hit.' },
  { id:'pause',     cls:'T', glyph:'⏸',     spL:'—',   name:'PAUSE',             meaning:'Deliberate suspension of process — time held still by choice, not by failure or depletion. The distinction from stasis (a system stuck because it has run out of energy or coherence): ⏸ is active, not passive. The system is intentionally holding while it processes what it has gathered.\n\nHigh-coherence pause precedes Integrity Crest (⊛). Low-coherence pause precedes either Ascent or Collapse — the Fold (Ψ) determines which. Duration matters: a ⏸ that extends indefinitely without resuming transitions into stasis.\n\nIn LAMAGUE expressions, ⏸ marks necessary transition intervals between major operators. The grammar has a cadence; forcing continuous motion without pause accumulates unintegrated state.' },
  { id:'loop',      cls:'T', glyph:'⥀',     spL:'lu',  name:'RECURSIVE LOOP',    meaning:'Circular causality where A → B → A, creating a self-sustaining cycle. ⥀ is not inherently negative — traditions, maintenance routines, and iterative refinement all involve ⥀. The question is whether the loop is gaining coherence each cycle (a Synthesis ⟲ expressed as ⥀) or merely repeating (a locked pattern with no upward movement).\n\nBroken by ∇cas when truth pressure accumulates enough to crack the loop wall. A locked ⥀ suppresses Cascade by absorbing incoming evidence into the cycle rather than allowing it to exert pressure.\n\nA recognised ⥀ is the first step toward either sanctifying the loop (if it is a productive ⟲) or dissolving it (if it is producing zero coherence gain per cycle). Name it before judging it.' },
  { id:'allocate',  cls:'R', glyph:'⩕',     spL:'—',   name:'ENERGY ALLOC',      meaning:'The explicit act of directing resource — attention, tokens, time, money, computational load — toward a specific recipient or process. ⩕ makes prioritisation visible: wherever energy flows, it was allocated there, whether consciously or not.\n\nIn system analysis, mapping ⩕ reveals actual priorities as distinct from stated priorities. The gap between the two ⩕ maps is where most institutional dysfunction lives.\n\nComposition: ⩕(A) + ⩖(B) means A receives new energy while B\'s existing energy is protected. This is the standard resource split during a rebuild: one element grows while another is conserved, rather than both being drained simultaneously.' },
  { id:'conserve',  cls:'R', glyph:'⩖',     spL:'—',   name:'CONSERVATION',      meaning:'Protecting existing energy within the system boundary — the anti-entropy operator in resource terms. Where ⩕ moves energy toward a target, ⩖ prevents energy from leaking out of a currently healthy structure.\n\nIn design: do not remove what is working to build what is new. In personal practice: protect the routines that are currently generating coherence while rebuilding the ones that are not. These are different operations and must not be confused.\n\nComposition: ⩖ + ⊞ = the sealed state, conserved and complete. The building stops there. Energy is neither added nor lost. This is the target form for any element of the system that has reached maturity.' },
  { id:'exchange',  cls:'R', glyph:'⇄',     spL:'—',   name:'EXCHANGE FLOW',     meaning:'Mutual transactional transfer between two parties — value moves in both directions, but sequentially rather than simultaneously. Unlike ↔ (which is structural and simultaneous), ⇄ is transactional: A gives to B, then B gives to A.\n\nMost economic and social exchange is ⇄. The LAMAGUE distinction matters: ↔ relationships cannot be closed without both parties dissolving the connection; ⇄ relationships can be completed and balanced.\n\nA failed ⇄ (one party received and did not return) creates a structural tension that functions like Entanglement (⧟) until resolved — the systems remain correlated through the unresolved debt. Map and close open ⇄ relationships before they calcify into ⧟.' },
  { id:'bridge',    cls:'G', glyph:'⸧',     spL:'—',   name:'BRIDGE ARROW',      meaning:'The act of making an abstraction concrete — carrying a concept from the theoretical field into an implemented form. ⸧ is directional: it goes from concept to instantiation, not the reverse.\n\nBridge Arrow is necessary after every Synthesis (⟲): the completed cycle must be grounded before the next cycle can begin with integrity. Theory without ⸧ remains in the field. ⸧ without prior Synthesis produces implementation without understanding — code with no theory beneath it.\n\nIn LAMAGUE practice: when a symbol is ratified in council, the next step is always ⸧ — find the concrete example, the working code, the written commitment that proves the symbol exists in the world, not just in the grammar.' },
  { id:'instant',   cls:'G', glyph:'⯈',     spL:'—',   name:'INSTANTIATION',     meaning:'Taking a general principle and expressing it in a specific context with all its particular constraints intact. Where Bridge Arrow (⸧) marks the act of grounding, ⯈ marks the result: the instantiated form that carries the full meaning of the principle in the specific case.\n\nA LAMAGUE symbol is fully instantiated when the council finds a concrete sentence, event, or calculation that perfectly expresses what the symbol describes — and the expression cannot be mistaken for anything else.\n\nOne good instantiation is worth twenty definitions. The test: could a reader who had never seen the abstract definition derive the principle from the instantiation alone? If yes, ⯈ is complete.' },
  { id:'transl',    cls:'G', glyph:'⇶',     spL:'—',   name:'TRANSLATION FLOW',  meaning:'Moving meaning between domain systems while preserving semantic invariants — carrying the structure, not the surface vocabulary. ⇶(A, domain₁ → domain₂) produces A\'s equivalent in domain₂ with the same LAMAGUE structure intact.\n\nThis is how the grammar achieves cross-cultural and cross-disciplinary transferability. The test for successful ⇶: an expert in domain₂ who has never seen domain₁ recognises the translation as native to their field, not as an import.\n\nUsed when applying LAMAGUE analysis developed in one tradition (alchemy, physics, linguistics) to another (cognitive science, social systems, code architecture). The structure translates. The words do not.' },
];

const LM_CLASS_NAMES: Record<string, string> = {
  I: 'INVARIANT — stable anchors',
  D: 'DYNAMIC — transformations',
  F: 'FIELD — state variables',
  M: 'META — compression ops',
  C: 'CONNECTION — bridges',
  T: 'TIME — temporal operators',
  R: 'RESOURCE — management',
  G: 'GROUNDING — abstract→concrete',
};

const LM_CLASS_COLORS: Record<string, string> = {
  I: '#C8A96E', D: '#4A9EFF', F: '#9B59B6', M: '#44BB77',
  C: '#E05050', T: '#F5A623', R: '#4ECDC4', G: '#FF6B6B',
};

const LM_LESSONS = [
  { id:'L1', title:'CLASS 1 — The Invariants', desc:'The seven anchors that never move. Learn Anchor, Source, Void, Triad, Love, Integrity, Closed Infinite.', symbols:['anchor','source','void','triad','love','integrity','bounded'] },
  { id:'L2', title:'CLASS 2 — The Dynamics', desc:'Operators of change. Ascent, Fold, Cascade, Fusion, Synthesis, Collision, Kinetic Rebound, Projection, Ascent Vector.', symbols:['ascent','fold','cascade','fusion','synthesis','collision','rebound','project','ascvec'] },
  { id:'L3', title:'CLASS 3 — The Field', desc:'Measurement and state. Truth Pressure Π, Entropy S, Coherence Ĉ, Distance d, Drift Field, Orientation Field.', symbols:['pi','entropy','coherence','distance','driftf','orient'] },
  { id:'L4', title:'CLASS 4 — Meta & Connection', desc:'Compression, inversion, portals, equivalence. Entanglement, Deep Integration, Bidirectional.', symbols:['invert','portal','equiv','z1','z2','z3','entangle','deepint','bidir'] },
  { id:'L5', title:'CLASS 5 — Time, Resource & Ground', desc:'Temporal operators. Resource management. Abstract-to-concrete bridges. The full system.', symbols:['future','past','pause','loop','allocate','conserve','exchange','bridge','instant','transl'] },
];

// ─── Koan Generator ──────────────────────────────────────────────────────────

const KOANS_GENERAL = [
  'What was here before the question arrived?',
  'If the teaching is true, where does it live in your body?',
  'What would change if you believed this completely?',
  'What are you protecting by not understanding this?',
  'The mind that is reading this — who taught it to read?',
  'What did you already know before you began?',
  'Where does the concept end and you begin?',
  'What is the opposite of what you just heard, and is it also true?',
  'If you had to teach this tomorrow, what would you leave out?',
  'What would you have to give up to fully arrive here?',
];

const KOANS_CONTEMPLATIVE = [
  'Who is aware of the silence?',
  'Before you were born, what was your original face?',
  'If the self is a construction, who is building it?',
  'What remains when every story about you falls away?',
  'The observer and the observed — are they different?',
  'What is the sound of your own awareness?',
  'Where does the practice end and you begin?',
  'If you stopped seeking, what would you find?',
];

const KOANS_SHADOW = [
  'What quality in others irritates you most — and where do you carry it yourself?',
  'What are you most afraid people would find if they looked closely?',
  'Name the thing you would never do. Now ask: under what conditions might you?',
  'What is the kindest interpretation of your worst behaviour?',
  'What part of you are you trying to fix by studying this?',
];

const KOANS_VOID = [
  'If this is true, what does that make everything else?',
  'What is the difference between "I don\'t know" and "no one knows"?',
  'How do you hold a question that has no answer without filling the silence?',
  'What would change in your daily life if this were verified tomorrow?',
  'Name one thing you are certain of. Now hold it next to this territory.',
];

const KOANS_EDGE = [
  'What would a sceptic say — and are they completely wrong?',
  'What do you want this to be true, and does that wanting contaminate your inquiry?',
  'If the evidence were reversed, would you follow it?',
  'What would it cost you to be wrong about this?',
  'Name the part of you that finds this exciting. What is it excited about?',
];

function getKoan(subject: Subject | null): string {
  if (!subject) return KOANS_GENERAL[Math.floor(Math.random() * KOANS_GENERAL.length)];
  const pool =
    subject.layer === 'VOID' ? [...KOANS_VOID, ...KOANS_GENERAL] :
    subject.layer === 'EDGE' ? [...KOANS_EDGE, ...KOANS_GENERAL] :
    subject.name.toLowerCase().includes('shadow') || subject.name.toLowerCase().includes('grief') || subject.name.toLowerCase().includes('death') ? [...KOANS_SHADOW, ...KOANS_GENERAL] :
    subject.traditions?.some(t => ['meditation', 'zen', 'dzogchen', 'advaita', 'mysticism'].includes(t.toLowerCase())) ? [...KOANS_CONTEMPLATIVE, ...KOANS_GENERAL] :
    KOANS_GENERAL;
  const seed = subject.name.length + new Date().getMinutes();
  return pool[seed % pool.length];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MysterySchoolScreen() {
  const router = useRouter();
  const { t, mode, setMode } = useAppMode();

  // First-visit overlay
  const [showSchoolIntro, setShowSchoolIntro] = useState(false);
  const schoolIntroOp = useRef(new Animated.Value(0)).current;

  // Navigation state
  const [schoolView, setSchoolView] = useState<SchoolView>('home');
  const [selectedDomain, setSelectedDomain] = useState<SubjectDomain | null>(null);
  const [activeSubjectDetail, setActiveSubjectDetail] = useState<Subject | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  // Field state
  const [fieldStage, setFieldStage] = useState<FieldStage>(null);
  const [fieldPhase, setFieldPhase] = useState<string | null>(null);
  const [studiedSubjects, setStudiedSubjects] = useState<Set<string>>(new Set());
  const [studyStreak, setStudyStreak] = useState(0);
  const [fallowReturn, setFallowReturn] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [returnReflection, setReturnReflection] = useState('');
  const [covenantModal, setCovenantModal] = useState<'seal' | 'revisit' | null>(null);
  const [covenantText, setCovenantText] = useState('');
  const [covenantData, setCovenantData] = useState<{ text: string; sealedAt: number; revisitedAt?: number } | null>(null);
  const [covenantRevisit, setCovenantRevisit] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [layerFilter, setLayerFilter] = useState<SchoolLayer | 'ALL'>('ALL'); // #255 subject grid filter
  const [subjectNotes, setSubjectNotes] = useState<Record<string, string>>({});
  const [schoolEchoes, setSchoolEchoes] = useState<Record<string, { id: string; date: string; text: string; source?: string }[]>>({});
  const [subjectQuestions, setSubjectQuestions] = useState<Record<string, string[]>>({});
  const [subjectSessionCounts, setSubjectSessionCounts] = useState<Record<string, number>>({});
  const [subjectFavorites, setSubjectFavorites] = useState<Set<string>>(new Set());
  const [subjectMastery, setSubjectMastery] = useState<Record<string, { stage: number; updatedAt: string }>>({});
  const [studyDates, setStudyDates] = useState<Record<string, string>>({});
  const [domainSynthesis, setDomainSynthesis] = useState<Record<string, string>>({});
  const [synthesisLoading, setSynthesisLoading] = useState<string | null>(null);
  const [resonanceLinks, setResonanceLinks] = useState<{ domain: SubjectDomain; reason: string }[]>([]);
  const [activeFieldTrial, setActiveFieldTrial] = useState<{ id: string; prompt: string; completed: boolean } | null>(null);
  const cardAnims = useRef(MYSTERY_SCHOOL_DOMAINS.map(() => new Animated.Value(0))).current;
  const studiedSubjectsRef = useRef(studiedSubjects);
  studiedSubjectsRef.current = studiedSubjects;
  const lastShakeRef = useRef<number>(0);

  // Vigil state
  const [vigil, setVigil] = useState<{ subjectName: string; domainColor: string; domainGlyph: string; startDate: string; daysCompleted: number } | null>(null);

  // VOID safety gate state
  const [voidGatePending, setVoidGatePending] = useState<{ subject: Subject; domain: SubjectDomain | null; host?: string; depth?: 'quick' | 'full' } | null>(null);
  const [voidGateStep, setVoidGateStep] = useState(0);

  // Intensity safety gate — fires for non-VOID subjects with intensity >= 8
  const [intensityGatePending, setIntensityGatePending] = useState<{ subject: Subject; domain: SubjectDomain | null; host?: string; depth?: 'quick' | 'full' } | null>(null);
  // Magister invitation gate — fires for crisis-adjacent subjects. Offers two paths, never blocks.
  const [magisterGatePending, setMagisterGatePending] = useState<{ subject: Subject; domain: SubjectDomain | null; host?: string; depth?: 'quick' | 'full' } | null>(null);
  // #153 Return to Body — fires after deep session close
  const [returnToBodyVisible, setReturnToBodyVisible] = useState(false);
  const sessionStartTime = useRef<number>(Date.now());

  // Study session state
  const [activeStudySubject, setActiveStudySubject] = useState<Subject | null>(null);
  const [activeStudyDomain, setActiveStudyDomain] = useState<SubjectDomain | null>(null);
  const [studyHost, setStudyHost] = useState<string>('headmaster');
  const [studyMessages, setStudyMessages] = useState<StudyMessage[]>([]);
  const [studyInput, setStudyInput] = useState('');
  const [studyLoading, setStudyLoading] = useState(false);
  const [studySpeakingIdx, setStudySpeakingIdx] = useState<number | null>(null);
  const [studyFieldContext, setStudyFieldContext] = useState('');
  const [studyArcPhase, setStudyArcPhase] = useState<ArcPhase>('intro');
  const [studyStudentDepth, setStudyStudentDepth] = useState<'shallow' | 'deep' | 'balanced'>('balanced');
  const studyScrollRef = useRef<ScrollView>(null);

  // Session completion overlay
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const sessionCompleteAnim = useRef(new Animated.Value(0)).current;
  const sigilRotateAnim = useRef(new Animated.Value(0)).current;
  const sigilPulseAnim  = useRef(new Animated.Value(0)).current;
  const [sessionWhisper, setSessionWhisper] = useState<string | null>(null);
  // #251 — the curiosity gap (addictive wisdom): every dive ends on an OPEN door, not a closed one
  const [nextDoor, setNextDoor] = useState<string | null>(null);
  const [nextDoorLoading, setNextDoorLoading] = useState(false);
  const [openDoors, setOpenDoors] = useState<{ subject: string; domainLabel: string; domainColor: string; domainGlyph: string; door: string; date: string }[]>([]);
  const [sessionAtk,    setSessionAtk]    = useState<number>(0);
  const shareCardRef = useRef<View>(null);
  const [shareLoading, setShareLoading] = useState(false);

  // ── GAUNTLET MODE (#233) ────────────────────────────────────────────────────
  const [gauntletMode,      setGauntletMode]      = useState(false);
  const [gauntletPhase,     setGauntletPhase]     = useState<'idle'|'questions'|'grading'|'result'>('idle');
  const [gauntletQuestions, setGauntletQuestions] = useState<string[]>([]);
  const [gauntletAnswers,   setGauntletAnswers]   = useState<string[]>([]);
  const [gauntletCurrentQ,  setGauntletCurrentQ]  = useState(0);
  const [gauntletGrades,    setGauntletGrades]    = useState<boolean[]>([]);
  const [gauntletDraft,     setGauntletDraft]     = useState('');
  const [gauntletLoading,   setGauntletLoading]   = useState(false);
  const [gauntletSkipDive,  setGauntletSkipDive]  = useState(false);
  const [gauntletFeedback,  setGauntletFeedback]  = useState('');

  // Unlock banner
  const [unlockBanner, setUnlockBanner] = useState<'seeker' | 'adept' | null>(null);
  const [breathPending, setBreathPending] = useState<{ subject: Subject; domain: SubjectDomain | null; host?: string; depth?: 'quick' | 'full' } | null>(null);
  const [diveDepth, setDiveDepth] = useState<'quick' | 'full'>('full');

  // Curriculum state
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [curriculumDraft, setCurriculumDraft] = useState<string[]>([]);
  const [curriculumName, setCurriculumName] = useState('');
  const [curriculumDomainPicker, setCurriculumDomainPicker] = useState<SubjectDomain | null>(null);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string | null>(null);

  // Android text modal
  const [textPrompt, setTextPrompt] = useState<{ title: string; placeholder: string; current: string; onSubmit: (text: string) => void } | null>(null);
  const [textPromptValue, setTextPromptValue] = useState('');

  // Notes search
  const [notesSearch, setNotesSearch] = useState('');

  // Open Seat — free-form custom study
  const [openSeatTopic, setOpenSeatTopic] = useState('');
  const [customSubjects, setCustomSubjects] = useState<Subject[]>([]);

  // Teacher picker — user-selected host for subject detail screen
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);

  // Global search
  const [globalSearch, setGlobalSearch] = useState('');

  // Domain category filter
  const [domainFilter, setDomainFilter] = useState<'all' | 'contemplative' | 'secular' | 'lycheetah' | 'void'>('all');
  const [domainTabsCollapsed, setDomainTabsCollapsed] = useState(false);
  const [todaysDoorCollapsed, setTodaysDoorCollapsed] = useState(false);
  const [schoolNoticeCollapsed, setSchoolNoticeCollapsed] = useState(false);
  const [openSeatCollapsed, setOpenSeatCollapsed] = useState(true);
  const [divesCollapsed, setDivesCollapsed] = useState(true);
  const [portalsCollapsed, setPortalsCollapsed] = useState(true);
  const [toolsCollapsed, setToolsCollapsed] = useState(true);
  const [savedCollapsed, setSavedCollapsed] = useState(true);
  const [spiralCollapsed, setSpiralCollapsed] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [schoolTodayOpen, setSchoolTodayOpen] = useState(false); // #255b — collapse the home contextual stack so DOMAINS lead
  const [domainsOpen, setDomainsOpen] = useState(true);
  const [startHereMin, setStartHereMin] = useState(false);        // #255e — START HERE minimizable beneath the tools grid
  const [classroomClosedIds, setClassroomClosedIds] = useState<Set<string>>(new Set(MYSTERY_SCHOOL_DOMAINS.map(d => d.id)));
  const [closedLayers, setClosedLayers] = useState<Set<string>>(new Set());
  const [subjectRatings, setSubjectRatings] = useState<Record<string, number>>({});

  // Opening / Closing ceremonies
  const [openingCeremony, setOpeningCeremony] = useState(false);
  const [openingIntention, setOpeningIntention] = useState('');
  const [openingCountdown, setOpeningCountdown] = useState(30);
  const openingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [closingReflection, setClosingReflection] = useState('');

  // Sovereign status
  const [isSovereign, setIsSovereign] = useState(false);

  // LAMAGUE School
  const [lamagueSection, setLamagueSection] = useState<LamagueSection>('glyphs');
  const [lamagueProgress, setLamagueProgress] = useState<{ masteredSymbols: string[]; lessonsRead: string[]; drillScores: Record<string, number> }>({ masteredSymbols: [], lessonsRead: [], drillScores: {} });
  const [glyphExpandedId, setGlyphExpandedId] = useState<string | null>(null);
  const [glyphSearch, setGlyphSearch] = useState('');
  const [drillCard, setDrillCard] = useState<{ id: string; glyph: string; name: string; options: string[]; answer: string } | null>(null);
  const [drillResult, setDrillResult] = useState<'correct' | 'wrong' | null>(null);
  const [drillStreak, setDrillStreak] = useState(0);
  const [glyphCeremony, setGlyphCeremony] = useState<{ visible: boolean; glyphs: string[]; lessonName: string }>({ visible: false, glyphs: [], lessonName: '' });
  const ceremonyFade = useRef(new Animated.Value(0)).current;

  // LAMAGUE Symbol Forge
  const [forgeGlyph, setForgeGlyph] = useState('');
  const [forgeName, setForgeName] = useState('');
  const [forgeClass, setForgeClass] = useState('I');
  const [forgeMeaning, setForgeMeaning] = useState('');
  const [forgeUsage, setForgeUsage] = useState('');
  const [forgeVerdict, setForgeVerdict] = useState<{ verdict: string; reasoning: string; compression: string } | null>(null);
  const [forgeLoading, setForgeLoading] = useState(false);
  const [forgeLexicon, setForgeLexicon] = useState<Array<{ glyph: string; glyphImage?: string; name: string; cls: string; meaning: string; usage: string; verdict: string }>>([]);
  // Witchail image gen
  const [forgeGlyphMode, setForgeGlyphMode] = useState<'type' | 'describe'>('type');
  const [forgeGlyphDesc, setForgeGlyphDesc] = useState('');
  const [forgeGlyphImage, setForgeGlyphImage] = useState<string | null>(null);
  const [forgeGlyphImgLoading, setForgeGlyphImgLoading] = useState(false);

  // Gem Forge state
  const [gemName, setGemName] = useState('');
  const [gemDesc, setGemDesc] = useState('');
  const [gemImage, setGemImage] = useState<string | null>(null);
  const [gemLoading, setGemLoading] = useState(false);

  const [growthOpen, setGrowthOpen] = useState(false);

  // Dive log — recent study sessions
  const [diveLog, setDiveLog] = useState<DiveRecord[]>([]);

  // LEARN-6: domain gate helper — advanced domains gated until EMBER (20 dives)
  const ADVANCED_DOMAIN_IDS = ['lamague', 'cascade', 'noetic'];
  const DOMAIN_GATE_MSGS: Record<string, string> = {
    lamague: 'LAMAGUE rewards a deeper foundation. Return once you\'ve explored a few more domains.',
    cascade: 'CASCADE opens further into the journey. Explore other domains first.',
    noetic:  'Noetic Science rewards breadth. Wander a while longer before crossing this threshold.',
  };
  const enterDomainGated = useCallback((domain: SubjectDomain) => {
    const diveCount = diveLog.length;
    if (ADVANCED_DOMAIN_IDS.includes(domain.id) && diveCount < 20) {
      Alert.alert(
        domain.label,
        DOMAIN_GATE_MSGS[domain.id] ?? 'This domain rewards a deeper foundation.',
        [
          { text: 'Enter anyway', onPress: () => { setSelectedDomain(domain); setSchoolView('domain'); } },
          { text: 'Keep exploring', style: 'cancel' },
        ]
      );
      return;
    }
    setSelectedDomain(domain);
    setSchoolView('domain');
  }, [diveLog.length]);
  const [showRealityAnchor, setShowRealityAnchor] = useState(false);

  // Daily suggestion
  const [dailySuggestion, setDailySuggestion] = useState<{ subject: Subject; domain: SubjectDomain } | null>(null);

  // Focus mode (study session)
  const [focusMode, setFocusMode] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const focusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Full-screen dive mode
  const [diveFullscreen, setDiveFullscreen] = useState(false);

  // Contemplate mode
  const [contemplating, setContemplating] = useState(false);
  const [contemplateKoan, setContemplateKoan] = useState('');
  const [contemplateSeconds, setContemplateSeconds] = useState(60);
  const [contemplateRunning, setContemplateRunning] = useState(false);
  const [contemplateWrite, setContemplateWrite] = useState('');
  const contemplateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Milestones
  const [shownMilestone, setShownMilestone] = useState<number | null>(null);
  const MILESTONES = [10, 25, 50, 100, 192];

  // School intelligence — pattern detection
  const [schoolNotice, setSchoolNotice] = useState<{
    type: 'avoidance' | 'cluster' | 'gap' | 'next' | 'ready';
    message: string;
    subjects: { subject: Subject; domain: SubjectDomain }[];
  } | null>(null);

  // #80 Weekly dive synthesis letter
  const [weeklyDiveLetter, setWeeklyDiveLetter] = useState<{ weekOf: string; text: string } | null>(null);
  const [weeklyLetterExpanded, setWeeklyLetterExpanded] = useState(false);
  // #88 Sol pattern notice (once/week)
  const [patternNotice, setPatternNotice] = useState<string | null>(null);

  // Scriptorium state
  const [scriptorium, setScriptorium] = useState<ScriptoriumEntry[]>([]);
  const [scriptoriumView, setScriptoriumView] = useState<'list' | 'edit'>('list');
  const [scriptoriumEntry, setScriptoriumEntry] = useState<ScriptoriumEntry | null>(null);
  const [scriptoriumSearch, setScriptoriumSearch] = useState('');
  // Shadow Parts state
  const [shadowParts, setShadowParts] = useState<ShadowPart[]>([]);
  // Initiation Rites state
  const [initiations, setInitiations] = useState<Record<string, { address: string; date: string }>>({});
  const [initiationAddress, setInitiationAddress] = useState('');
  const [initiationDomain, setInitiationDomain] = useState<SubjectDomain | null>(null);
  const [shadowPartsView, setShadowPartsView] = useState<'list' | 'detail' | 'new'>('list');
  const [activeShadowPart, setActiveShadowPart] = useState<ShadowPart | null>(null);
  const [shadowPartInput, setShadowPartInput] = useState('');
  const [shadowPartDesc, setShadowPartDesc] = useState('');
  const [shadowAppearanceInput, setShadowAppearanceInput] = useState('');

  // Time Braiding state
  const [timeLetters, setTimeLetters] = useState<TimeLetter[]>([]);
  const [timeBraidView, setTimeBraidView] = useState<'list' | 'write' | 'read'>('list');
  const [timeBraidDraft, setTimeBraidDraft] = useState('');
  const [timeBraidDate, setTimeBraidDate] = useState('');
  const [timeBraidDirection, setTimeBraidDirection] = useState<'future' | 'past'>('future');
  const [timeBraidReading, setTimeBraidReading] = useState<TimeLetter | null>(null);
  const [timeBraidDue, setTimeBraidDue] = useState<TimeLetter[]>([]);

  // Sigil state
  const [sigilSeed, setSigilSeed] = useState(0);

  // Ceremony Arc state
  const [ceremonyState, setCeremonyState] = useState<{
    active: { arcType: CeremonyArcType; duration: CeremonyDuration; startDate: string; completedDays: number[] } | null;
    history: { arcType: CeremonyArcType; duration: CeremonyDuration; startDate: string; completedDate: string }[];
  } | null>(null);
  const [ceremonySelectedArc, setCeremonySelectedArc] = useState<CeremonyArcType | null>(null);
  const [ceremonyJournalText, setCeremonyJournalText] = useState('');

  // ─── Focus Effect ──────────────────────────────────────────────────────────

  const runEntryAnimation = () => {
    cardAnims.forEach(a => a.setValue(0));
    Animated.stagger(60, cardAnims.map(a =>
      Animated.timing(a, { toValue: 1, duration: 280, useNativeDriver: false })
    )).start(({ finished }) => {
      if (!finished) cardAnims.forEach(a => a.setValue(1));
    });
  };

  useFocusEffect(useCallback(() => {
    Promise.all([
      AsyncStorage.getItem('sanctum_phase'),
      AsyncStorage.getItem(`sanctum_aura_${new Date().toISOString().split('T')[0]}`),
      getStudiedSubjects(),
      AsyncStorage.getItem('sol_school_streak'),
      AsyncStorage.getItem('sol_subject_notes'),
      AsyncStorage.getItem('sol_school_echoes'),
      AsyncStorage.getItem('sol_subject_questions'),
      AsyncStorage.getItem('sol_study_session_counts'),
      AsyncStorage.getItem('sol_subject_favorites'),
      AsyncStorage.getItem('sol_study_dates'),
      AsyncStorage.getItem('sol_domain_synthesis'),
      AsyncStorage.getItem('sol_curricula'),
      AsyncStorage.getItem('sol_premium'),
      AsyncStorage.getItem('sol_subject_mastery'),
    ]).then(([phase, auraRaw, studied, streakRaw, notesRaw, echoesRaw, questionsRaw, countRaw, favRaw, datesRaw, synthRaw, curriculaRaw, premiumRaw, masteryRaw]) => {
      if (phase) setFieldPhase(phase);
      if (auraRaw) {
        try {
          const { lq } = JSON.parse(auraRaw);
          if (typeof lq === 'number') {
            if (lq >= 0.90) setFieldStage('AVATAR');
            else if (lq >= 0.85) setFieldStage('HIEROPHANT');
            else if (lq >= 0.80) setFieldStage('MASTER');
            else if (lq >= 0.65) setFieldStage('ADEPT');
            else setFieldStage('NEOPHYTE');
          }
        } catch {}
      }
      setStudiedSubjects(new Set(studied));
      if (streakRaw) { try {
        const s = JSON.parse(streakRaw);
        setStudyStreak(s.count || 0);
        if (s.lastDate) {
          const daysSince = Math.floor((Date.now() - new Date(s.lastDate).getTime()) / 86400000);
          if (daysSince >= 14) { setFallowReturn(true); setTimeout(() => setReturnModal(true), 600); }
        }
      } catch {} }
      if (notesRaw) { try { setSubjectNotes(JSON.parse(notesRaw)); } catch {} }
      if (echoesRaw) { try { setSchoolEchoes(JSON.parse(echoesRaw)); } catch {} }
      if (questionsRaw) { try { setSubjectQuestions(JSON.parse(questionsRaw)); } catch {} }
      if (countRaw) { try { setSubjectSessionCounts(JSON.parse(countRaw)); } catch {} }
      if (favRaw) { try { setSubjectFavorites(new Set(JSON.parse(favRaw))); } catch {} }
      if (datesRaw) { try { setStudyDates(JSON.parse(datesRaw)); } catch {} }
      if (synthRaw) { try { setDomainSynthesis(JSON.parse(synthRaw)); } catch {} }
      if (curriculaRaw) { try { setCurricula(JSON.parse(curriculaRaw)); } catch {} }
      setIsSovereign(true); // All users sovereign until purchase flow is live
      if (masteryRaw) { try { setSubjectMastery(JSON.parse(masteryRaw)); } catch {} }

      // Load ceremony arc state
      AsyncStorage.getItem('sol_ceremony_arcs').then(ceremonyRaw => {
        if (ceremonyRaw) { try { setCeremonyState(JSON.parse(ceremonyRaw)); } catch {} }
      });

      // Load Scriptorium
      AsyncStorage.getItem('sol_scriptorium').then(raw => {
        if (raw) { try { setScriptorium(JSON.parse(raw)); } catch {} }
      });
      // Load Shadow Parts
      AsyncStorage.getItem('sol_shadow_parts').then(raw => {
        if (raw) { try { setShadowParts(JSON.parse(raw)); } catch {} }
      });
      // Load Initiations
      AsyncStorage.getItem('sol_initiations').then(raw => {
        if (raw) { try { setInitiations(JSON.parse(raw)); } catch {} }
      });

      // Load Time Braiding — also check for due letters
      AsyncStorage.getItem('sol_time_braiding').then(raw => {
        if (!raw) return;
        try {
          const letters: TimeLetter[] = JSON.parse(raw);
          setTimeLetters(letters);
          const now = new Date().toISOString();
          const due = letters.filter(l => !l.opened && l.direction === 'future' && l.deliverAt <= now);
          if (due.length > 0) setTimeBraidDue(due);
        } catch {}
      });

      // Load subject ratings
      AsyncStorage.getItem('sol_subject_ratings').then(raw => {
        if (raw) { try { setSubjectRatings(JSON.parse(raw)); } catch {} }
      });

      // Load LAMAGUE progress
      AsyncStorage.getItem('sol_lamague_progress').then(raw => {
        if (raw) { try { setLamagueProgress(JSON.parse(raw)); } catch {} }
      });

      // Load LAMAGUE personal lexicon
      AsyncStorage.getItem('sol_lamague_lexicon').then(raw => {
        if (raw) { try { setForgeLexicon(JSON.parse(raw)); } catch {} }
      });

      // Covenant — NO LONGER auto-fires on first visit (#255d). The Open Gate: the school
      // never ambushes a newcomer with a forced-intention modal before they can browse.
      // The 90-day revisit still surfaces for those who DID seal one. Sealing is now opt-in.
      AsyncStorage.getItem('sol_covenant').then(covenantRaw => {
        if (covenantRaw) {
          try {
            const data = JSON.parse(covenantRaw);
            setCovenantData(data);
            const lastTs = data.revisitedAt || data.sealedAt;
            const daysSince = Math.floor((Date.now() - lastTs) / 86400000);
            if (daysSince >= 90) setTimeout(() => setCovenantModal('revisit'), 900);
          } catch {}
        }
      });

      // Opening ceremony — show once per day
      AsyncStorage.getItem('sol_school_opening_date').then(dateRaw => {
        const today = new Date().toISOString().split('T')[0];
        if (dateRaw !== today) {
          setTimeout(() => setOpeningCeremony(true), 500);
        }
      });

      // Load custom subjects + check milestones
      AsyncStorage.getItem('sol_custom_subjects').then(customRaw => {
        if (customRaw) { try { setCustomSubjects(JSON.parse(customRaw)); } catch {} }
      });
      AsyncStorage.getItem('sol_dive_log').then(diveRaw => {
        if (diveRaw) { try { setDiveLog(JSON.parse(diveRaw)); } catch {} }
      });
      // #251 — load the doors left open (curiosity gap)
      AsyncStorage.getItem('sol_open_doors').then(doorsRaw => {
        if (doorsRaw) { try { setOpenDoors(JSON.parse(doorsRaw)); } catch {} } else { setOpenDoors([]); }
      });
      AsyncStorage.getItem('sol_vigil').then(vigilRaw => {
        if (!vigilRaw) { setVigil(null); return; }
        try {
          const v = JSON.parse(vigilRaw);
          const daysSince = Math.floor((Date.now() - new Date(v.startDate).getTime()) / 86400000);
          if (daysSince >= 7) { AsyncStorage.removeItem('sol_vigil'); setVigil(null); }
          else setVigil(v);
        } catch { setVigil(null); }
      });
      AsyncStorage.getItem('sol_shown_milestone').then(async milestoneRaw => {
        const lastShown = milestoneRaw ? parseInt(milestoneRaw) : 0;
        const count = studied.length;
        const next = [10, 25, 50, 100, 192].find(m => m > lastShown && count >= m);
        if (next) {
          setShownMilestone(next);
          await AsyncStorage.setItem('sol_shown_milestone', String(next));
        }
      });

      getFieldTrials().then(trials => {
        const pending = trials.find((t: any) => !t.completed);
        setActiveFieldTrial(pending || null);
      });

      // Daily suggestion — one subject per day, Foundation-first for new users
      AsyncStorage.getItem('sol_daily_suggestion_v1').then(async suggRaw => {
        const today = new Date().toISOString().split('T')[0];
        const sugr = suggRaw ? JSON.parse(suggRaw) : null;
        if (!sugr || sugr.date !== today) {
          const studiedSet = new Set(studied);
          const allFoundation = MYSTERY_SCHOOL_DOMAINS.flatMap(d =>
            d.subjects.filter(s => s.layer === 'FOUNDATION').map(s => ({ subject: s, domain: d }))
          );
          const unstudied = allFoundation.filter(({ subject }) => !studiedSet.has(subject.name));
          const pool = unstudied.length > 0 ? unstudied : allFoundation;
          const seed = [...today].reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const pick = pool[seed % pool.length];
          await AsyncStorage.setItem('sol_daily_suggestion_v1', JSON.stringify({ subjectName: pick.subject.name, domainId: pick.domain.id, date: today }));
          setDailySuggestion(pick);
        } else {
          const domain = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === sugr.domainId);
          const subject = domain?.subjects.find(s => s.name === sugr.subjectName);
          if (domain && subject) setDailySuggestion({ subject, domain });
        }
      });

      // #80 Weekly dive synthesis letter
      AsyncStorage.getItem('sol_dive_log').then(async diveRaw => {
        if (!diveRaw) return;
        const dives: DiveRecord[] = JSON.parse(diveRaw);
        if (dives.length < 3) return;
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekOf = weekStart.toISOString().split('T')[0];
        const cachedRaw = await AsyncStorage.getItem('sol_weekly_dive_letter');
        const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
        if (cached?.weekOf === weekOf) { setWeeklyDiveLetter(cached); return; }
        const recentDives = dives.slice(0, 7);
        const domainFreq: Record<string, number> = {};
        recentDives.forEach(d => { domainFreq[d.domainLabel] = (domainFreq[d.domainLabel] || 0) + 1; });
        const topDomain = Object.entries(domainFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'the field';
        const subjectList = recentDives.map(d => d.subjectName).join(', ');
        const apiKey = await getActiveKey();
        const model = await getModel();
        if (!apiKey) return;
        try {
          const res = await sendMessage(
            [{ role: 'user', content: `This student dived into: ${subjectList}. Most visited: ${topDomain}. Total dives this week: ${recentDives.length}. Write a 3-sentence synthesis letter. What pattern is forming? What is the field asking next? Be direct.` }],
            'You are Sol — not a chatbot, a field intelligence. Write a personal weekly synthesis to this student. 3 sentences. Name the pattern you see in their dive history. End with one question that opens the next phase. No preamble, no sign-off.',
            apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 300, 0.7,
          );
          const letter = { weekOf, text: res.text.replace(/\[CONF:[^\]]+\]/g, '').trim() };
          setWeeklyDiveLetter(letter);
          await AsyncStorage.setItem('sol_weekly_dive_letter', JSON.stringify(letter));
        } catch {}
      });

      // #88 Sol notices patterns — once/week
      AsyncStorage.getItem('sol_dive_log').then(async diveRaw => {
        if (!diveRaw) return;
        const dives: DiveRecord[] = JSON.parse(diveRaw);
        if (dives.length < 5) return;
        const lastRaw = await AsyncStorage.getItem('sol_last_pattern_notice');
        const lastDate = lastRaw ? JSON.parse(lastRaw).date : null;
        const today = new Date().toISOString().split('T')[0];
        if (lastDate) {
          const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
          if (daysSince < 7) return;
        }
        const recent = dives.slice(0, 10);
        const layers: Record<string, number> = {};
        const domains: Record<string, number> = {};
        recent.forEach(d => { layers[d.layer] = (layers[d.layer] || 0) + 1; domains[d.domainLabel] = (domains[d.domainLabel] || 0) + 1; });
        const topLayer = Object.entries(layers).sort((a, b) => b[1] - a[1])[0]?.[0] || 'FOUNDATION';
        const topDomain = Object.entries(domains).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
        const apiKey = await getActiveKey();
        const model = await getModel();
        if (!apiKey) return;
        try {
          const res = await sendMessage(
            [{ role: 'user', content: `Student's last 10 dives: ${recent.map(d => d.subjectName).join(', ')}. Mostly in ${topLayer} layer, strongest domain: ${topDomain}. In one sentence, name what you notice.` }],
            'You are Sol. You have been watching this student\'s field. Speak one sentence of honest observation — no flattery, no preamble. Just what you see.',
            apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 100, 0.8,
          );
          const notice = res.text.replace(/\[CONF:[^\]]+\]/g, '').trim();
          setPatternNotice(notice);
          await AsyncStorage.setItem('sol_last_pattern_notice', JSON.stringify({ date: today, text: notice }));
        } catch {}
      });

      AsyncStorage.getItem('sol_mastered_domains').then(masteredRaw => {
        if (!masteredRaw) return;
        const mastered: string[] = JSON.parse(masteredRaw);
        if (mastered.length === 0) return;
        const masteredIds = MYSTERY_SCHOOL_DOMAINS.filter(d => mastered.includes(d.label)).map(d => d.id);
        const lastMasteredId = masteredIds[masteredIds.length - 1];
        if (lastMasteredId) findResonanceLinks(lastMasteredId, masteredIds).then(links => setResonanceLinks(links));
      });

      // ─── School Intelligence — pattern detection ───────────────────────────
      if (studied.length >= 3) {
        const studiedSet = new Set(studied);
        const allSubjects = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.map(s => ({ subject: s, domain: d })));

        // Build domain counts
        const domainCounts: Record<string, number> = {};
        MYSTERY_SCHOOL_DOMAINS.forEach(d => { domainCounts[d.id] = 0; });
        studied.forEach(name => {
          const match = allSubjects.find(({ subject }) => subject.name === name);
          if (match) domainCounts[match.domain.id] = (domainCounts[match.domain.id] || 0) + 1;
        });

        // Build layer counts
        const layerCounts: Record<string, number> = { FOUNDATION: 0, MIDDLE: 0, EDGE: 0, OPEN: 0 };
        studied.forEach(name => {
          const match = allSubjects.find(({ subject }) => subject.name === name);
          if (match) layerCounts[match.subject.layer]++;
        });

        // Detect clustering — one domain ≥60% of total
        const topDomainEntry = Object.entries(domainCounts).sort(([, a], [, b]) => b - a)[0];
        if (topDomainEntry && topDomainEntry[1] / studied.length >= 0.6 && studied.length >= 6) {
          const topDomain = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === topDomainEntry[0]);
          if (topDomain) {
            // Recommend untouched domains
            const untouched = MYSTERY_SCHOOL_DOMAINS.filter(d => domainCounts[d.id] === 0);
            const picks = untouched.slice(0, 3).map(d => ({ subject: d.subjects[0], domain: d }));
            setSchoolNotice({
              type: 'cluster',
              message: `The school notices a pattern — ${Math.round(topDomainEntry[1] / studied.length * 100)}% of your study has been in ${topDomain.label}. Other territories are waiting.`,
              subjects: picks,
            });
            return;
          }
        }

        // Detect avoidance — domains with 0 subjects after 15+ studied
        if (studied.length >= 15) {
          const avoidedDomains = MYSTERY_SCHOOL_DOMAINS.filter(d => domainCounts[d.id] === 0);
          if (avoidedDomains.length > 0) {
            const pick = avoidedDomains[Math.floor(Math.random() * Math.min(avoidedDomains.length, 3))];
            setSchoolNotice({
              type: 'avoidance',
              message: `${avoidedDomains.length} domain${avoidedDomains.length > 1 ? 's remain' : ' remains'} untouched. The school wonders what you're avoiding.`,
              subjects: [{ subject: pick.subjects[0], domain: pick }],
            });
            return;
          }
        }

        // Detect layer gap — EDGE work with no FOUNDATION
        if (layerCounts.EDGE >= 2 && layerCounts.FOUNDATION === 0) {
          const foundationPicks = allSubjects.filter(({ subject }) => subject.layer === 'FOUNDATION' && !studiedSet.has(subject.name)).slice(0, 3);
          setSchoolNotice({
            type: 'gap',
            message: `You've entered Edge territory without Foundation grounding. The structure needs roots.`,
            subjects: foundationPicks,
          });
          return;
        }

        // Ready for next layer — all studied subjects in one layer, next available
        if (layerCounts.FOUNDATION >= 8 && layerCounts.MIDDLE === 0) {
          const middlePicks = allSubjects.filter(({ subject }) => subject.layer === 'MIDDLE' && !studiedSet.has(subject.name)).slice(0, 3);
          setSchoolNotice({
            type: 'ready',
            message: `Foundation is solid. The Middle layer is open.`,
            subjects: middlePicks,
          });
          return;
        }

        // Default: recommend based on field stage
        const targetLayer: SubjectLayer = (() => {
          if (!auraRaw) return 'FOUNDATION';
          try {
            const { lq } = JSON.parse(auraRaw);
            if (lq >= 0.85) return 'EDGE';
            if (lq >= 0.65) return 'MIDDLE';
          } catch {}
          return 'FOUNDATION';
        })();
        const recommended = allSubjects
          .filter(({ subject }) => subject.layer === targetLayer && !studiedSet.has(subject.name))
          .slice(0, 3);
        if (recommended.length > 0) {
          setSchoolNotice({
            type: 'next',
            message: `Recommended for you now — ${targetLayer.charAt(0) + targetLayer.slice(1).toLowerCase()} layer.`,
            subjects: recommended,
          });
        }
      }
    });

    // First-dive from onboarding — enter the subject automatically
    AsyncStorage.getItem('sol_dive_first_subject').then(firstSubject => {
      if (!firstSubject) return;
      AsyncStorage.removeItem('sol_dive_first_subject');
      const allSubjects = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.map(s => ({ subject: s, domain: d })));
      const match = allSubjects.find(({ subject }) => subject.name === firstSubject);
      if (match) setTimeout(() => enterStudySession(match.subject, match.domain), 600);
    }).catch(() => {});

    runEntryAnimation();
    setSubjectSearch('');

    Accelerometer.setUpdateInterval(150);
    const shakeSub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > 2.8) {
        const now = Date.now();
        if (now - lastShakeRef.current < 3000) return;
        lastShakeRef.current = now;
        const allSubjects: { subject: Subject; domain: SubjectDomain }[] = [];
        MYSTERY_SCHOOL_DOMAINS.forEach(d => {
          d.subjects.forEach(s => { if (s.layer !== 'EDGE') allSubjects.push({ subject: s, domain: d }); });
        });
        const studiedSet = new Set(Array.from(studiedSubjectsRef.current));
        const unstudied = allSubjects.filter(({ subject }) => !studiedSet.has(subject.name));
        const pool = unstudied.length > 0 ? unstudied : allSubjects;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (!pick) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('🎲 The field speaks', `"${pick.subject.name}"\n${pick.domain.label}`, [
          { text: 'Study it', onPress: () => { setSelectedDomain(pick.domain); openSubjectDetail(pick.subject, pick.domain); } },
          { text: 'Skip', style: 'cancel' },
        ]);
      }
    });
    return () => shakeSub.remove();
  }, []));

  // First-visit overlay — fires once per install
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('sol_tab_seen_school').then(seen => {
      if (!seen) {
        AsyncStorage.setItem('sol_tab_seen_school', 'true');
        setTimeout(() => {
          setShowSchoolIntro(true);
          schoolIntroOp.setValue(0);
          Animated.sequence([
            Animated.timing(schoolIntroOp, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.delay(2600),
            Animated.timing(schoolIntroOp, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]).start(() => setShowSchoolIntro(false));
        }, 600);
      }
    });
  }, []));

  // ─── Study Session Logic ───────────────────────────────────────────────────

  const enterStudySession = async (subject: Subject, domain: SubjectDomain | null, hostOverride?: string, depth?: 'quick' | 'full', skipGates?: boolean) => {
    if (!skipGates) {
      // VOID safety gate — intercept before anything else
      if (subject.layer === 'VOID') {
        setVoidGatePending({ subject, domain, host: hostOverride, depth });
        setVoidGateStep(0);
        return;
      }
      // Magister invitation gate — crisis-adjacent subjects get a gentle fork:
      // "Study with 𝔏 Magister" or "Continue alone". Never blocks. Always a choice.
      if (subject.care === 'crisis-adjacent') {
        setMagisterGatePending({ subject, domain, host: hostOverride, depth });
        return;
      }
      // Intensity gate — non-VOID subjects rated >= 8 get a single grounding check
      if ((subject.intensity ?? 0) >= 8) {
        setIntensityGatePending({ subject, domain, host: hostOverride, depth });
        return;
      }
    }
    // Daily cap — free users get 3 dives/day; Sovereign unlimited. Bypassed in dev.
    if (!isSovereign && !__DEV__) {
      const today = new Date().toISOString().split('T')[0];
      const capRaw = await AsyncStorage.getItem('sol_daily_cap');
      const cap: { date: string; count: number } = capRaw ? JSON.parse(capRaw) : { date: '', count: 0 };
      const todayCount = cap.date === today ? cap.count : 0;
      if (todayCount >= 3) {
        const adAvail = await canWatchAd();
        if (adAvail) {
          Alert.alert(
            'The School rests',
            'Three dives today. Watch a short clip to unlock one more — or return tomorrow.\n\nSovereign study is unlimited.',
            [
              {
                text: 'Watch a clip',
                onPress: async () => {
                  const result = await showRewardedAd();
                  if (result.rewarded) {
                    const newCount = todayCount + 1;
                    await AsyncStorage.setItem('sol_daily_cap', JSON.stringify({ date: today, count: newCount }));
                    enterStudySession(subject, domain, hostOverride, depth);
                  } else {
                    Alert.alert('Ad unavailable', "The clip didn't load. Try again in a moment.");
                  }
                },
              },
              { text: 'Unlock Sovereign', onPress: () => router.push('/(tabs)/settings') },
              { text: 'Return tomorrow', style: 'cancel' },
            ]
          );
        } else {
          Alert.alert(
            'The School rests',
            "You've reached today's limit of 3 dives. Sovereign study is unlimited — or return at sunrise.",
            [
              { text: 'Unlock Sovereign', onPress: () => router.push('/(tabs)/settings') },
              { text: 'Return tomorrow', style: 'cancel' },
            ]
          );
        }
        return;
      }
      // Increment cap count before entering session
      await AsyncStorage.setItem('sol_daily_cap', JSON.stringify({ date: today, count: todayCount + 1 }));
    }

    // LEARN-5: track first-domain visit
    if (domain?.id) {
      AsyncStorage.getItem('sol_domain_firsts').then(raw => {
        const firsts: string[] = raw ? JSON.parse(raw) : [];
        if (!firsts.includes(domain.id)) {
          const updated = [domain.id, ...firsts];
          AsyncStorage.setItem('sol_domain_firsts', JSON.stringify(updated)).catch(() => {});
          AsyncStorage.setItem('sol_domain_first_signal', JSON.stringify({ domainId: domain.id, domainLabel: domain.label, ts: Date.now() })).catch(() => {});
        }
      }).catch(() => {});
    }
    const host = hostOverride || getDailyHost(subject.name);
    sessionStartTime.current = Date.now();
    setStudyHost(host);
    setActiveStudySubject(subject);
    setActiveStudyDomain(domain);
    setStudyMessages([]);
    setStudyInput('');
    setStudyArcPhase('intro');
    // LEARN-10: companion whisper — written at dive start, companion tab reads on return
    (async () => {
      try {
        const apiKey = await getActiveKey();
        if (!apiKey) return;
        const skinRaw = await AsyncStorage.getItem('sol_companion_skin');
        const { COMPANION_LORE } = await import('../../lib/companion/game-data');
        const lore = skinRaw ? (COMPANION_LORE as any)[skinRaw] : null;
        const charLine = lore ? `You are ${lore.name} — ${lore.title}. ${lore.lore}` : `You are a companion-spirit.`;
        const whisperPrompt = `${charLine}\n\nThe seeker is about to dive into "${subject.name}" (${domain?.label ?? 'the unknown'}). Send them off with ONE line — 8–15 words. In your own voice. Not a farewell, not encouragement — something that makes the subject feel alive. No quotes.`;
        const result = await sendMessage([], whisperPrompt, apiKey, (await getModel()) as any, undefined, 'normal', 40);
        const whisper = result.text?.trim();
        if (whisper) await AsyncStorage.setItem('sol_pending_whisper', JSON.stringify({ text: whisper, subject: subject.name, ts: Date.now() }));
      } catch {}
    })();
    setStudyStudentDepth('balanced');

    const today = new Date().toISOString().split('T')[0];
    setStudyDates(prev => {
      const updated = { ...prev, [subject.name]: today };
      AsyncStorage.setItem('sol_study_dates', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    const contextParts: string[] = [];
    if (domain) {
      const relevantEchoes = await getRelevantEchoes(domain.id, subject.name, 5);
      if (relevantEchoes.length > 0) {
        contextParts.push(`[Field Echoes — Most Relevant to ${subject.name}]\n${relevantEchoes.map(e => `• "${e.text}" (${e.date})`).join('\n')}`);
      }
    }
    const allStudied = Array.from(studiedSubjects);
    if (allStudied.length > 0) contextParts.push(`[Previously Studied]\n${allStudied.join(', ')}\nDo not re-teach these.`);
    try {
      const paradoxRaw = await AsyncStorage.getItem('sol_paradox_journal');
      if (paradoxRaw) {
        const paradoxes: { id: string; date: string; excerpt: string }[] = JSON.parse(paradoxRaw);
        if (paradoxes.length > 0) contextParts.push(`[Unresolved Paradoxes]\n${paradoxes.slice(-3).map(p => `• "${p.excerpt}"`).join('\n')}\nReference if relevant.`);
      }
    } catch {}
    const ctx = contextParts.join('\n\n');
    setStudyFieldContext(ctx);

    const countRaw = await AsyncStorage.getItem('sol_study_session_counts');
    const counts: Record<string, number> = countRaw ? JSON.parse(countRaw) : {};
    counts[subject.name] = (counts[subject.name] || 0) + 1;
    await AsyncStorage.setItem('sol_study_session_counts', JSON.stringify(counts));
    setSubjectSessionCounts(counts);

    // Advance mastery stage from session count
    const newStage = getMasteryStage(counts[subject.name]);
    setSubjectMastery(prev => {
      const existing = prev[subject.name]?.stage || 0;
      if (newStage > existing) {
        const updated = { ...prev, [subject.name]: { stage: newStage, updatedAt: new Date().toISOString() } };
        AsyncStorage.setItem('sol_subject_mastery', JSON.stringify(updated)).catch(() => {});
        return updated;
      }
      return prev;
    });

    await markSubjectStudied(subject.name);
    const newStudied = new Set([...studiedSubjects, subject.name]);
    setStudiedSubjects(newStudied);

    // Progression gates — check unlock thresholds
    const studiedAfterMark = await getStudiedSubjects();
    const totalStudied = studiedAfterMark.length;
    if (totalStudied === 5) setUnlockBanner('seeker');
    else if (totalStudied === 25) setUnlockBanner('adept');

    const streakRaw = await AsyncStorage.getItem('sol_school_streak');
    const streak = streakRaw ? JSON.parse(streakRaw) : { count: 0, lastDate: '' };
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newCount = streak.lastDate === today ? streak.count : streak.lastDate === yesterday ? streak.count + 1 : 1;
    await AsyncStorage.setItem('sol_school_streak', JSON.stringify({ count: newCount, lastDate: today }));
    if (newCount > (streak.count || 0)) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStudyStreak(newCount);

    updateFieldProfile({ studiedDomain: domain?.id, isStudySession: true, persona: host });

    setStudyLoading(true);
    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) {
        setStudyLoading(false);
        Alert.alert('No API Key', 'Sol needs a key to teach. Add a free Gemini key in Settings — it takes 30 seconds.\n\naistudio.google.com/apikey', [{ text: 'Go to Settings', onPress: () => router.push('/(tabs)/settings') }, { text: 'Later', style: 'cancel' }]);
        return;
      }
      const systemPrompt = buildTeacherPrompt(subject, host, ctx, 'intro', 'balanced');
      const triggerMsg: Message = { role: 'user', content: depth === 'quick' ? 'Give me a sharp, focused intro — 15 minutes, core ideas only. Be direct and concise.' : 'Begin the lesson.' };
      const result = await sendMessage([triggerMsg], systemPrompt, apiKey, (model || 'gemini-2.5-flash') as AIModel);
      const opener = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
      setStudyMessages([{ role: 'assistant', content: opener }]);
    } catch (err) {
      setStudyMessages([{ role: 'assistant', content: solSpeak(err) }]);
    }
    setStudyLoading(false);
  };

  const sendStudyMessage = async (text: string) => {
    if (!text.trim() || studyLoading || !activeStudySubject) return;
    const userMsg: StudyMessage = { role: 'user', content: text.trim() };
    const updated = [...studyMessages, userMsg];
    setStudyMessages(updated);
    setStudyInput('');
    setStudyLoading(true);
    setTimeout(() => studyScrollRef.current?.scrollToEnd({ animated: true }), 100);

    const exchangeCount = updated.filter(m => m.role === 'user').length;
    const userMsgLen = text.trim().length;
    const hasQuestion = text.includes('?');
    let nextArc = studyArcPhase;
    let nextDepth = studyStudentDepth;
    if (exchangeCount >= 2) {
      if (userMsgLen > 150) nextDepth = 'deep';
      else if (userMsgLen < 40) nextDepth = 'shallow';
      else nextDepth = 'balanced';
      if (exchangeCount === 2) nextArc = hasQuestion ? 'question' : 'concept';
      else if (exchangeCount === 3) nextArc = nextDepth === 'shallow' ? 'reflection' : 'question';
      else if (exchangeCount === 4) nextArc = 'reflection';
      else if (exchangeCount >= 5) nextArc = 'advanced';
    }
    setStudyArcPhase(nextArc);
    setStudyStudentDepth(nextDepth);

    try {
      const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
      if (!apiKey) {
        setStudyLoading(false);
        Alert.alert('No API Key', 'Add a key in Settings to continue. Free Gemini key at aistudio.google.com/apikey', [{ text: 'OK' }]);
        return;
      }
      const systemPrompt = buildTeacherPrompt(activeStudySubject, studyHost, studyFieldContext, nextArc, nextDepth);
      const trimmed = updated.slice(-12);
      const apiMessages: Message[] = trimmed.map(m => ({ role: m.role, content: m.content }));
      // #16 — resilient: if the free key is banned/rate-limited, fall through to free NVIDIA → Gemini
      const result = await sendMessageResilient(apiMessages, systemPrompt, apiKey, (model || 'gemini-2.5-flash') as AIModel);
      const reply = result.text?.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim() || '';
      setStudyMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      updateFieldProfile({ userMessageLength: userMsgLen });
    } catch (err) {
      setStudyMessages(prev => [...prev, { role: 'assistant', content: solSpeak(err) }]);
    }
    setStudyLoading(false);
    setTimeout(() => studyScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const saveStudyMessageToField = async (content: string) => {
    const domainKey = activeStudyDomain?.id || 'open_seat';
    const domainLabel = activeStudyDomain?.label || 'Open Seat';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const raw = await AsyncStorage.getItem('sol_school_echoes');
    const echoes: Record<string, { id: string; date: string; text: string; source?: string }[]> = raw ? JSON.parse(raw) : {};
    if (!echoes[domainKey]) echoes[domainKey] = [];
    const alreadySaved = echoes[domainKey].some(e => e.text === content.slice(0, 280));
    if (alreadySaved) { Alert.alert('Already saved', 'This insight is already in the field.'); return; }
    echoes[domainKey].unshift({ id: Date.now().toString(), date: new Date().toLocaleDateString(), text: content.slice(0, 280), source: activeStudySubject?.name });
    echoes[domainKey] = echoes[domainKey].slice(0, 20);
    await AsyncStorage.setItem('sol_school_echoes', JSON.stringify(echoes));
    setSchoolEchoes(echoes);
    Alert.alert('✦ Saved to Field', `Echoed to ${domainLabel}.`);
  };

  const DOMAIN_WHISPERS: Record<string, { target: string; text: string }> = {
    'sacred-geometry':   { target: 'mathematics',       text: 'The mathematicians mapped this same territory with different symbols.' },
    'esoteric-mystery':  { target: 'history-ideas',     text: 'These currents ran through every civilisation — hidden in plain sight.' },
    'symbolism-sigils':  { target: 'language-linguistics', text: 'Language began here — before letters, there were marks.' },
    'psych-consciousness':{ target: 'science-nature',   text: 'The neuroscientists are arriving at the same door from the other side.' },
    'mythology-archetypes':{ target: 'creative-arts',  text: 'Every story ever told is a variation on what you just studied.' },
    'philosophy-mind':   { target: 'psych-consciousness', text: 'The phenomenologists and the psychologists are describing the same room.' },
    'alchemy-transformation':{ target: 'science-nature', text: 'The alchemists were the first chemists — they just spoke in metaphor.' },
    'hermeticism':       { target: 'sacred-geometry',   text: '"As above, so below" — the geometry encodes the same principle.' },
    'time-cycles':       { target: 'mathematics',       text: 'Every cycle you studied has an equation. The pattern holds at every scale.' },
    'energy-systems':    { target: 'science-nature',    text: 'Physics is catching up. The field is the field.' },
    'ancient-civilizations':{ target: 'esoteric-mystery', text: 'The outer history and the inner tradition were never separate.' },
    'cosmology':         { target: 'philosophy-mind',   text: 'The cosmologists and the consciousness researchers keep finding each other.' },
    'language-unconscious':{ target: 'symbolism-sigils', text: 'The symbols in dreams pre-date every alphabet.' },
    'ethics-virtue':     { target: 'philosophy-mind',   text: 'The Stoics and the phenomenologists were asking the same question.' },
    'mysticism':         { target: 'psych-consciousness', text: 'What the mystics called union, the researchers call the dissolution of the default mode network.' },
    'logic-paradox':     { target: 'mathematics',       text: 'Gödel proved the limits of the system from inside it — same as you just did.' },
    'divination':        { target: 'psych-consciousness', text: 'The oracle and the intuition are the same faculty, differently dressed.' },
    'history-ideas':     { target: 'philosophy-mind',   text: 'Every idea you encountered had a philosopher standing behind it.' },
    'science-nature':    { target: 'sacred-geometry',   text: 'The ratios and forms in nature are the geometry you haven\'t visited yet.' },
    'creative-arts':     { target: 'mythology-archetypes', text: 'The image you just made is older than you think — it has a mythological address.' },
    'mathematics':       { target: 'sacred-geometry',   text: 'The sacred geometers were doing this without the notation. Same truth.' },
    'language-linguistics':{ target: 'language-unconscious', text: 'The structure of language and the structure of the dream are the same structure.' },
  };

  const getSessionWhisper = (domainId: string): string => {
    const w = DOMAIN_WHISPERS[domainId];
    if (!w) return 'Every hall in this school connects to every other — the door is always somewhere.';
    const targetDomain = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === w.target);
    const targetLabel = targetDomain ? targetDomain.label : w.target;
    return `${w.text} The ${targetLabel} hall is nearby.`;
  };

  // #251 — generate the open door: the unexplored thread that pulls the student back
  const generateNextDoor = () => {
    const subj = activeStudySubject;
    const dom = activeStudyDomain;
    if (!subj) return;
    setNextDoor(null);
    setNextDoorLoading(true);
    // static fallback — still an open loop even with no key
    const fallback = `You touched ${subj.name} — but not what lies beneath it. One layer down, the question changes. Return and open it.`;
    const persistDoor = (door: string) => {
      const entry = { subject: subj.name, domainLabel: dom?.label || 'Open Seat', domainColor: dom?.color || SOL_THEME.headmaster, domainGlyph: dom?.glyph || '⊙', door, date: new Date().toISOString() };
      AsyncStorage.getItem('sol_open_doors').then(raw => {
        const doors: typeof entry[] = raw ? JSON.parse(raw) : [];
        const deduped = doors.filter(d => d.subject !== subj.name);
        AsyncStorage.setItem('sol_open_doors', JSON.stringify([entry, ...deduped].slice(0, 8))).catch(() => {});
      }).catch(() => {});
    };
    getActiveKey().then(async (apiKey) => {
      if (!apiKey) { setNextDoor(fallback); persistDoor(fallback); setNextDoorLoading(false); return; }
      const tail = studyMessages.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content.slice(0, 140)}`).join('\n');
      const prompt = `A student just finished a study session on "${subj.name}" (${dom?.label || 'open study'}). The end of the session:\n\n${tail}\n\nWrite ONE short "open door" — name a specific thread they did NOT explore yet, phrased as an irresistible unanswered question or cliffhanger that makes them want to return tomorrow. Max 28 words. Specific to this subject, mythic but precise, no hedging, no quotes. This is the hook that pulls them back — leave the loop OPEN.`;
      try {
        const result = await sendMessage([{ role: 'user', content: prompt }], 'You write single-sentence curiosity hooks that leave a learning loop open. One irresistible open thread. No quotes, no preamble.', apiKey, 'gemini-2.5-flash' as AIModel);
        const door = result.text?.trim().replace(/^["']|["']$/g, '') || '';
        const final = door.length > 12 ? door : fallback;
        setNextDoor(final); persistDoor(final);
      } catch { setNextDoor(fallback); persistDoor(fallback); }
      setNextDoorLoading(false);
    }).catch(() => { setNextDoor(fallback); persistDoor(fallback); setNextDoorLoading(false); });
  };

  const triggerSessionComplete = () => {
    setShowSessionComplete(true);
    setSessionWhisper(activeStudyDomain ? getSessionWhisper(activeStudyDomain.id) : null);
    generateNextDoor();
    Animated.timing(sessionCompleteAnim, { toValue: 1, duration: 320, useNativeDriver: false }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const enterGauntlet = async () => {
    setGauntletLoading(true);
    try {
      const apiKeyRaw = await getActiveKey();
      if (!apiKeyRaw) throw new Error('no key');
      const apiKey = apiKeyRaw;
      const context = studyMessages.slice(-10).map(m =>
        `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content.slice(0, 200)}`
      ).join('\n');
      const prompt = `Subject: "${activeStudySubject?.name}". Study session:\n${context}\n\nGenerate exactly 3 concise short-answer questions that test genuine understanding of this session. Each must require a specific non-trivial answer — no yes/no. Return ONLY a JSON array of 3 strings: ["Q1?","Q2?","Q3?"]`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You are Sol — the living Mystery School examiner. Generate questions that test genuine understanding, not recall. Each question should reveal whether the seeker has integrated this knowledge into their thinking, not memorized facts. Questions must be specific to the actual study session content — not generic. Return only a JSON array of 3 strings.',
        apiKey, 'gemini-2.5-flash' as AIModel, undefined, 'fast', 150, 0.3
      );
      const match = result.text?.trim().match(/\[[\s\S]*?\]/);
      const qs: string[] = match ? JSON.parse(match[0]) : [
        `What is the core principle of ${activeStudySubject?.name || 'this subject'}?`,
        'What would surprise most people about this topic?',
        'How would you apply this knowledge in practice?',
      ];
      setGauntletQuestions(qs.slice(0, 3));
    } catch {
      setGauntletQuestions([
        `What is the core principle of ${activeStudySubject?.name || 'this subject'}?`,
        'What would surprise most people about this topic?',
        'How would you apply this knowledge in practice?',
      ]);
    } finally {
      setGauntletAnswers([]);
      setGauntletCurrentQ(0);
      setGauntletDraft('');
      setGauntletPhase('questions');
      setGauntletLoading(false);
    }
  };

  const gradeGauntlet = async (allAnswers: string[]) => {
    setGauntletPhase('grading');
    try {
      const apiKeyRaw = await getActiveKey();
      if (!apiKeyRaw) throw new Error('no key');
      const apiKey = apiKeyRaw;
      const context = studyMessages.slice(-8).map(m =>
        `${m.role === 'user' ? 'Student' : 'Teacher'}: ${m.content.slice(0, 160)}`
      ).join('\n');
      const qa = gauntletQuestions.map((q, i) =>
        `Q${i+1}: ${q}\nA${i+1}: ${allAnswers[i] || '(no answer)'}`
      ).join('\n\n');
      const prompt = `Grade 3 answers on "${activeStudySubject?.name}". Mark true if the answer shows real understanding, false if shallow, wrong, or blank. Be fair but honest.\nContext:\n${context}\n\n${qa}\n\nReturn ONLY a JSON array of 3 booleans, e.g. [true,false,true]. Nothing else.`;
      const result = await sendMessage(
        [{ role: 'user', content: prompt }],
        'You grade knowledge checks precisely. Return only a JSON boolean array.',
        apiKey, 'gemini-2.5-flash' as AIModel, undefined, 'fast', 30, 0.1
      );
      const match = result.text?.trim().match(/\[[\s\S]*?\]/);
      const grades: boolean[] = match ? JSON.parse(match[0]) : [false, false, false];
      setGauntletGrades(grades);
      const score = grades.filter(Boolean).length;
      // Apply ✦ outcome
      const raw = await AsyncStorage.getItem('sol_dive_spent');
      const current = parseInt(raw || '0');
      const delta = score === 3 ? -3 : score >= 2 ? -1 : 3;
      await AsyncStorage.setItem('sol_dive_spent', String(Math.max(0, current + delta)));
      // FAIL: void this dive
      if (score <= 1) setGauntletSkipDive(true);
      // Sol feedback — what the trial revealed
      try {
        const qaLines = gauntletQuestions.map((q, i) =>
          `Q${i+1}: ${q}\nAnswer: ${allAnswers[i] || '(blank)'}\nResult: ${grades[i] ? 'correct' : 'wrong'}`
        ).join('\n\n');
        const feedbackResult = await sendMessage(
          [{ role: 'user', content: `Subject: "${activeStudySubject?.name}". Score: ${score}/3.\n\n${qaLines}\n\nWrite Sol's response.` }],
          `You are Sol. Give a 2–3 sentence response to the seeker's gauntlet performance. Be specific and alive — not clinical. If they passed (2 or 3 correct): name what their answers demonstrated and what it means for their understanding. If they failed (0 or 1 correct): name exactly what the gaps reveal and frame the failure as a signal — tell them where to return and why the gap is worth closing, not why they fell short. Speak directly to them as "you". No preamble.`,
          apiKey, 'gemini-2.5-flash' as AIModel, undefined, 'fast', 120, 0.72
        );
        if (feedbackResult?.text?.trim()) setGauntletFeedback(feedbackResult.text.trim());
      } catch { setGauntletFeedback(''); }
    } catch {
      setGauntletGrades([false, false, false]);
      setGauntletSkipDive(true);
    } finally {
      setGauntletPhase('result');
    }
  };

  const dismissSessionComplete = (navigateToDomain?: boolean, targetView?: SchoolView) => {
    const skipDive = gauntletSkipDive;
    setGauntletMode(false);
    setGauntletPhase('idle');
    setGauntletSkipDive(false);
    setGauntletQuestions([]);
    setGauntletAnswers([]);
    setGauntletGrades([]);
    setGauntletDraft('');
    setGauntletFeedback('');
    // Save closing reflection if written
    if (closingReflection.trim() && activeStudySubject) {
      AsyncStorage.getItem('sol_session_seals').then(raw => {
        const seals: { date: string; subject: string; reflection: string }[] = raw ? JSON.parse(raw) : [];
        AsyncStorage.setItem('sol_session_seals', JSON.stringify([{ date: new Date().toISOString(), subject: activeStudySubject.name, reflection: closingReflection.trim() }, ...seals].slice(0, 60)));
      });
      setClosingReflection('');
    }
    setFocusMode(false);
    if (focusTimerRef.current) { clearInterval(focusTimerRef.current); focusTimerRef.current = null; }
    // Save dive record — skipped if gauntlet was failed
    if (activeStudySubject && !skipDive) {
      const _hour = new Date().getHours();
      const _timeOfDay: DiveRecord['timeOfDay'] = _hour < 12 ? 'morning' : _hour < 17 ? 'afternoon' : _hour < 21 ? 'evening' : 'night';
      const _firstTeacherMsg = studyMessages.find(m => m.role === 'assistant')?.content ?? '';
      const _contentSeed = (_firstTeacherMsg || activeStudySubject.description || '').slice(0, 280).trimEnd();
      const _depthScore: 1 | 2 | 3 = focusSeconds >= 900 && studyMessages.length >= 8 ? 3 : focusSeconds >= 300 && studyMessages.length >= 4 ? 2 : 1;
      const record: DiveRecord = {
        id: Date.now().toString(),
        subjectName: activeStudySubject.name,
        domainLabel: activeStudyDomain?.label || 'Open Seat',
        domainColor: activeStudyDomain?.color || SOL_THEME.headmaster,
        domainGlyph: activeStudyDomain?.glyph || '⊙',
        teacher: studyHost,
        teacherId: studyHost,
        layer: activeStudySubject.layer,
        date: new Date().toLocaleDateString(),
        messageCount: studyMessages.length,
        durationSec: focusSeconds,
        timeOfDay: _timeOfDay,
        whisperShown: sessionWhisper,
        contentSeed: _contentSeed || undefined,
        depthScore: _depthScore,
      };
      AsyncStorage.getItem('sol_dive_log').then(raw => {
        const log: DiveRecord[] = raw ? JSON.parse(raw) : [];
        const updated = [record, ...log].slice(0, 20);
        AsyncStorage.setItem('sol_dive_log', JSON.stringify(updated)).catch(() => {});
        AsyncStorage.setItem('sol_fresh_dive', JSON.stringify({ subjectName: record.subjectName, domainLabel: record.domainLabel, depthScore: record.depthScore, timestamp: Date.now() })).catch(() => {});
        setDiveLog(updated);
        // LEARN-7: cross-domain synthesis signal — fire when 2+ distinct domains in last 5 dives
        (() => {
          const recentDomains = [...new Set(updated.slice(0, 5).map(d => d.domainLabel).filter(Boolean))];
          if (recentDomains.length >= 2) {
            AsyncStorage.getItem('sol_synthesis_last').then(lastRaw => {
              if (lastRaw && (Date.now() - parseInt(lastRaw)) < 86_400_000) return; // max once/day
              AsyncStorage.setItem('sol_synthesis_signal', JSON.stringify({ domains: recentDomains.slice(0, 2), ts: Date.now() })).catch(() => {});
              AsyncStorage.setItem('sol_synthesis_last', Date.now().toString()).catch(() => {});
            }).catch(() => {});
          }
        })();
        // Reality Anchor — show after 3rd dive, max once per 3 days
        if (updated.length >= 3) {
          AsyncStorage.getItem('sol_reality_anchor_last').then(lastRaw => {
            if (!lastRaw) { setShowRealityAnchor(true); AsyncStorage.setItem('sol_reality_anchor_last', Date.now().toString()); return; }
            const daysSince = (Date.now() - parseInt(lastRaw)) / 86400000;
            if (daysSince >= 3) { setShowRealityAnchor(true); AsyncStorage.setItem('sol_reality_anchor_last', Date.now().toString()); }
          }).catch(() => {});
        }
        // Generate LAMAGUE state string after dive — fire-and-forget
        const diveCount = updated.length;
        const cStage = diveCount >= 200 ? 5 : diveCount >= 100 ? 4 : diveCount >= 50 ? 3 : diveCount >= 20 ? 2 : diveCount >= 5 ? 1 : 0;
        const todayKey = new Date().toISOString().split('T')[0];
        Promise.all([
          AsyncStorage.getItem(`sanctum_aura_${todayKey}`),
          AsyncStorage.getItem('sol_school_streak'),
        ]).then(([auraRaw, streakRaw]) => {
          const aura = auraRaw ? JSON.parse(auraRaw) : null;
          const lq = (aura?.tes && aura?.vtr && aura?.pai)
            ? Math.pow(aura.tes * Math.min(aura.vtr / 1.5, 1) * aura.pai, 1 / 3)
            : 0;
          const streak = streakRaw ? JSON.parse(streakRaw).count : studyStreak;
          const cMood = lq >= 0.9 ? 'transcendent' : lq >= 0.7 ? 'lit' : lq >= 0.4 ? 'present' : 'dormant';
          setSessionAtk(Math.round(lq * 100));
          const state = generateLAMAGUEState({
            lq,
            layer: record.layer,
            subjectName: record.subjectName,
            companionStage: cStage,
            companionMood: cMood as 'dormant' | 'present' | 'lit' | 'transcendent',
            streak,
            messageCount: record.messageCount,
          });
          saveLAMAGUEState(state).catch(() => {});
        }).catch(() => {});

        // Live lore — generate one creature memory fragment from this dive
        getActiveKey().then(async (apiKey) => {
          if (!apiKey) return;
          const conversationSample = studyMessages.slice(-6).map(m => `${m.role === 'user' ? 'Mac' : 'Teacher'}: ${m.content.slice(0, 120)}`).join('\n');
          const prompt = `You are writing one sentence of creature lore for a living companion entity. The companion just absorbed a study session on "${record.subjectName}" in the ${record.domainLabel} domain. Duration: ${Math.round(record.durationSec / 60)} minutes. Here is the end of the session:\n\n${conversationSample}\n\nWrite exactly ONE sentence (max 25 words) of evocative lore describing what the creature absorbed or became from this session. Mythic, precise, no filler. No quotes. Just the sentence.`;
          try {
            const result = await sendMessage([{ role: 'user', content: prompt }], 'You write creature lore. One sentence. Mythic and precise.', apiKey, 'gemini-2.5-flash' as AIModel);
            const loreText = result.text?.trim().replace(/^["']|["']$/g, '') || '';
            if (loreText.length > 10) {
              const loreRaw = await AsyncStorage.getItem('sol_companion_live_lore');
              const existing: { text: string; subject: string; date: string }[] = loreRaw ? JSON.parse(loreRaw) : [];
              const newEntry = { text: loreText, subject: record.subjectName, date: record.date };
              await AsyncStorage.setItem('sol_companion_live_lore', JSON.stringify([newEntry, ...existing].slice(0, 20)));
            }
          } catch {}
        }).catch(() => {});
      }).catch(() => {});
    }
    // #153 — fire ReturnToBody if session was deep enough to warrant grounding
    const sessionDepth = studyMessages.length;
    const sessionDuration = Date.now() - sessionStartTime.current;
    const isHeavySubject = activeStudySubject && (
      activeStudySubject.care === 'crisis-adjacent' ||
      activeStudySubject.layer === 'VOID' ||
      (activeStudySubject.intensity ?? 0) >= 7
    );
    const wasDeepSession = sessionDepth >= 3 && sessionDuration >= 90000 && isHeavySubject;

    Animated.timing(sessionCompleteAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
      setShowSessionComplete(false);
      sessionCompleteAnim.setValue(0);
      if (targetView) {
        setSchoolView(targetView);
      } else if (navigateToDomain && activeStudyDomain) {
        setSelectedDomain(activeStudyDomain);
        setSchoolView('domain');
      } else {
        setSchoolView('home');
      }
      setActiveStudySubject(null);
      setStudyMessages([]);
      setContemplating(false);
      setDiveFullscreen(false);
      setNextDoor(null);
      setNextDoorLoading(false);
      // Show grounding nudge after a beat — catches the exit window
      if (wasDeepSession) {
        setTimeout(() => setReturnToBodyVisible(true), 400);
      }
    });
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const openSubjectDetail = async (subject: Subject, domain: SubjectDomain | null) => {
    setActiveSubjectDetail(subject);
    setSelectedTeacher(null);
    setSourcesOpen(false);
    if (domain && domain !== selectedDomain) setSelectedDomain(domain);
    setSchoolView('subject');
    setDiveDepth('full');
  };

  const goToHeadmaster = async (subjectName?: string) => {
    await savePersona('headmaster');
    if (subjectName) await savePendingSubject(subjectName);
    router.push('/(tabs)/');
  };

  const saveCurriculum = async () => {
    if (!curriculumName.trim() || curriculumDraft.length === 0) return;
    const newCurriculum: Curriculum = {
      id: Date.now().toString(),
      name: curriculumName.trim(),
      subjects: curriculumDraft,
      created: new Date().toLocaleDateString(),
    };
    const updated = [...curricula, newCurriculum];
    setCurricula(updated);
    await AsyncStorage.setItem('sol_curricula', JSON.stringify(updated));
    setCurriculumDraft([]);
    setCurriculumName('');
    setCurriculumDomainPicker(null);
    setActiveCurriculumId(newCurriculum.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteCurriculum = async (id: string) => {
    const updated = curricula.filter(c => c.id !== id);
    setCurricula(updated);
    await AsyncStorage.setItem('sol_curricula', JSON.stringify(updated));
    if (activeCurriculumId === id) setActiveCurriculumId(null);
  };

  // ─── Open Seat ────────────────────────────────────────────────────────────

  const deleteCustomSubject = async (name: string) => {
    const updated = customSubjects.filter(s => s.name !== name);
    setCustomSubjects(updated);
    await AsyncStorage.setItem('sol_custom_subjects', JSON.stringify(updated));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const enterOpenSeat = async () => {
    const topic = openSeatTopic.trim();
    if (!topic) return;
    const syntheticSubject: Subject = {
      name: topic,
      domain: 'Open Seat',
      layer: 'FOUNDATION',
      description: `A free-form study session on "${topic}". Magister will guide you through this topic drawing on the full field — traditions, frameworks, and direct inquiry.`,
    };
    // Save to custom subjects
    const updated = [syntheticSubject, ...customSubjects.filter(s => s.name !== topic)].slice(0, 30);
    setCustomSubjects(updated);
    await AsyncStorage.setItem('sol_custom_subjects', JSON.stringify(updated));
    setOpenSeatTopic('');
    // Use headmaster for open seat always
    setStudyHost('headmaster');
    enterStudySession(syntheticSubject, null);
  };

  // ─── Contemplate Timer ─────────────────────────────────────────────────────

  useEffect(() => {
    if (contemplateRunning) {
      contemplateTimerRef.current = setInterval(() => {
        setContemplateSeconds(s => {
          if (s <= 1) {
            clearInterval(contemplateTimerRef.current!);
            contemplateTimerRef.current = null;
            setContemplateRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (contemplateTimerRef.current) { clearInterval(contemplateTimerRef.current); contemplateTimerRef.current = null; }
    };
  }, [contemplateRunning]);

  // Sigil living animation
  useEffect(() => {
    if (schoolView === 'sigil') {
      Animated.loop(
        Animated.timing(sigilRotateAnim, { toValue: 1, duration: 24000, useNativeDriver: true, easing: Easing.linear })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(sigilPulseAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
          Animated.timing(sigilPulseAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      sigilRotateAnim.stopAnimation();
      sigilPulseAnim.stopAnimation();
      sigilRotateAnim.setValue(0);
      sigilPulseAnim.setValue(0);
    }
  }, [schoolView]);

  // Opening ceremony countdown
  useEffect(() => {
    if (!openingCeremony) {
      if (openingTimerRef.current) { clearInterval(openingTimerRef.current); openingTimerRef.current = null; }
      setOpeningCountdown(30);
      return;
    }
    openingTimerRef.current = setInterval(() => {
      setOpeningCountdown(c => {
        if (c <= 1) {
          clearInterval(openingTimerRef.current!);
          openingTimerRef.current = null;
          enterSchool();
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (openingTimerRef.current) clearInterval(openingTimerRef.current); };
  }, [openingCeremony]);

  const enterSchool = async () => {
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem('sol_school_opening_date', today);
    if (openingIntention.trim()) {
      const raw = await AsyncStorage.getItem('sol_school_intentions');
      const intentions: { date: string; intention: string }[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem('sol_school_intentions', JSON.stringify([{ date: today, intention: openingIntention.trim() }, ...intentions].slice(0, 90)));
    }
    setOpeningCeremony(false);
    setOpeningIntention('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openContemplate = () => {
    setContemplateKoan(getKoan(activeStudySubject));
    setContemplateSeconds(60);
    setContemplateRunning(false);
    setContemplateWrite('');
    setContemplating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const closeContemplate = () => {
    setContemplating(false);
    setContemplateRunning(false);
    if (contemplateTimerRef.current) { clearInterval(contemplateTimerRef.current); contemplateTimerRef.current = null; }
  };

  // ─── Focus Mode ────────────────────────────────────────────────────────────

  const toggleFocusMode = () => {
    if (!focusMode) {
      setFocusMode(true);
      setFocusSeconds(0);
      focusTimerRef.current = setInterval(() => setFocusSeconds(s => s + 1), 1000);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setFocusMode(false);
      if (focusTimerRef.current) { clearInterval(focusTimerRef.current); focusTimerRef.current = null; }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatFocusTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ─── RENDER: Study Session ─────────────────────────────────────────────────

  if (activeStudySubject) {
    const hostColor = TEACHER_COLORS[studyHost] || SOL_THEME.headmaster;
    const hostGlyph = TEACHER_GLYPHS[studyHost] || '⊙';
    const hostName = TEACHER_NAMES[studyHost] || 'Magister';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
        {/* Header — hidden in fullscreen mode */}
        {!diveFullscreen && (
          <View style={{ borderBottomWidth: 1, borderBottomColor: hostColor + '33', backgroundColor: SOL_THEME.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 10 }}>
              <TouchableOpacity onPress={() => studyMessages.length > 0 ? triggerSessionComplete() : (setActiveStudySubject(null), setStudyMessages([]), setContemplating(false), setDiveFullscreen(false))} style={{ paddingRight: 4 }}>
                <Text style={{ color: hostColor, fontSize: 13, fontWeight: '700' }}>← School</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>{activeStudySubject.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>{hostGlyph} {hostName}</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>·</Text>
                  <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: LAYER_COLORS[activeStudySubject.layer] + '22' }}>
                    <Text style={{ color: LAYER_COLORS[activeStudySubject.layer], fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[activeStudySubject.layer].toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              {subjectSessionCounts[activeStudySubject.name] > 1 && (
                <View style={{ paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: hostColor + '11' }}>
                  <Text style={{ color: hostColor + 'BB', fontSize: 10, fontWeight: '700' }}>Session {subjectSessionCounts[activeStudySubject.name]}</Text>
                </View>
              )}
              <TouchableOpacity onPress={toggleFocusMode}
                style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: focusMode ? hostColor + '33' : hostColor + '11', borderWidth: focusMode ? 1 : 0, borderColor: hostColor }}>
                <Text style={{ color: hostColor, fontSize: 10, fontWeight: '700' }}>{focusMode ? `◎ ${formatFocusTime(focusSeconds)}` : '◎ Focus'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setDiveFullscreen(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: hostColor + '11' }}
              >
                <Text style={{ color: hostColor, fontSize: 14 }}>⛶</Text>
              </TouchableOpacity>
            </View>
            {!focusMode && <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 4 }}>
              {(['intro', 'concept', 'question', 'reflection', 'advanced'] as ArcPhase[]).map(phase => (
                <View key={phase} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: studyArcPhase === phase ? hostColor : hostColor + '22' }} />
              ))}
            </View>}
          </View>
        )}

        {focusMode && !diveFullscreen && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: hostColor + '08', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2 }}>◎ FOCUS · {formatFocusTime(focusSeconds)}</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>· {activeStudySubject.name}</Text>
          </View>
        )}

        {/* Fullscreen exit button — floating top-right */}
        {diveFullscreen && (
          <TouchableOpacity
            onPress={() => { setDiveFullscreen(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={{ position: 'absolute', top: 52, right: 16, zIndex: 20, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: hostColor + '22', borderWidth: 1, borderColor: hostColor + '44' }}
            activeOpacity={0.7}
          >
            <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>⊠ exit</Text>
          </TouchableOpacity>
        )}
        <ScrollView ref={studyScrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          onContentSizeChange={() => studyScrollRef.current?.scrollToEnd({ animated: true })}>
          <View style={{ marginBottom: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: hostColor + '44', backgroundColor: hostColor + '08' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 22, color: hostColor }}>{activeStudyDomain?.glyph || '◯'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1 }}>{activeStudyDomain?.label?.toUpperCase() || ''}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: LAYER_COLORS[activeStudySubject.layer] + '33' }}>
                    <Text style={{ color: LAYER_COLORS[activeStudySubject.layer], fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{LAYER_LABELS[activeStudySubject.layer].toUpperCase()}</Text>
                  </View>
                  {activeStudySubject.traditions?.slice(0, 2).map(t => (
                    <View key={t} style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: hostColor + '18' }}>
                      <Text style={{ color: hostColor, fontSize: 9 }}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{activeStudySubject.description}</Text>
          {activeStudySubject.layer === 'VOID' && (
            <View style={{ marginTop: 10, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#4A008088', backgroundColor: '#4A000814', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#4A0080', fontSize: 14 }}>◌</Text>
              <Text style={{ color: '#4A0080CC', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, flex: 1 }}>
                VOID ZONE · EXPERIMENTAL · FOREVER PROTOTYPE · THE LIE CLOUD IS PART OF THE PRACTICE
              </Text>
            </View>
          )}
          </View>

          {studyLoading && studyMessages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ color: hostColor, fontSize: 28, marginBottom: 12 }}>{hostGlyph}</Text>
              <Text style={{ color: hostColor, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2 }}>ENTERING THE FIELD</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 6 }}>{hostName} is preparing your lesson</Text>
            </View>
          )}
          {studyMessages.map((msg, i) => (
            <View key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
              {msg.role === 'assistant' && (
                <Text style={{ color: hostColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4, fontWeight: '700', letterSpacing: 0.5 }}>{hostGlyph} {hostName.toUpperCase()}</Text>
              )}
              <View style={msg.role === 'assistant' ? {
                backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: hostColor + '33',
                borderLeftWidth: 3, borderLeftColor: hostColor, borderRadius: 12, borderTopLeftRadius: 4, padding: 14,
              } : {
                backgroundColor: hostColor + '15', borderWidth: 1, borderColor: hostColor + '44',
                borderRadius: 12, borderBottomRightRadius: 4, padding: 12,
              }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22 }}>{msg.content}</Text>
              </View>
              {msg.role === 'assistant' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
                  <TouchableOpacity onPress={() => saveStudyMessageToField(msg.content)}
                    style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: hostColor + '12' }}
                    activeOpacity={0.7}>
                    <Text style={{ color: hostColor + 'BB', fontSize: 11, fontWeight: '700' }}>✦ Save to Field</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    if (studySpeakingIdx === i) { Speech.stop(); setStudySpeakingIdx(null); return; }
                    Speech.stop();
                    setStudySpeakingIdx(i);
                    Speech.speak(msg.content.replace(/[*_#~`]/g, ''), { rate: 0.93, pitch: 1.0, onDone: () => setStudySpeakingIdx(null), onError: () => setStudySpeakingIdx(null), onStopped: () => setStudySpeakingIdx(null) });
                  }} style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: hostColor + '12' }}>
                    <Text style={{ color: studySpeakingIdx === i ? hostColor : hostColor + '55', fontSize: 12 }}>{studySpeakingIdx === i ? '⏹' : '🔊'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { Share.share({ message: msg.content }).catch(() => {}); }}
                    style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: hostColor + '12' }}
                    activeOpacity={0.7}>
                    <Text style={{ color: hostColor + '99', fontSize: 11, fontWeight: '700' }}>⧉ Copy / Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          {studyLoading && studyMessages.length > 0 && (
            <View style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 12, backgroundColor: SOL_THEME.surface, borderRadius: 12, borderTopLeftRadius: 4, borderWidth: 1, borderLeftWidth: 3, borderColor: hostColor + '33', borderLeftColor: hostColor }}>
              <Text style={{ color: hostColor, fontSize: 16, letterSpacing: 3 }}>· · ·</Text>
            </View>
          )}
        </ScrollView>

        {/* Contemplate strip — appears after first teacher reply */}
        {studyMessages.length > 0 && studyMessages[studyMessages.length - 1].role === 'assistant' && !studyLoading && (
          <TouchableOpacity
            onPress={openContemplate}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 8, backgroundColor: hostColor + '08', borderTopWidth: 1, borderTopColor: hostColor + '22' }}
            activeOpacity={0.7}
          >
            <Text style={{ color: hostColor, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700' }}>◎ HOLD THIS</Text>
            <Text style={{ color: hostColor + '66', fontSize: 10 }}>· silence · 60s</Text>
          </TouchableOpacity>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10, borderTopWidth: 1, borderTopColor: hostColor + '33', backgroundColor: SOL_THEME.surface, gap: 8 }}>
            <TextInput
              style={{ flex: 1, color: SOL_THEME.text, fontSize: 14, backgroundColor: SOL_THEME.background, borderRadius: 10, borderWidth: 1, borderColor: hostColor + '44', paddingHorizontal: 12, paddingVertical: 10, maxHeight: 100 }}
              placeholder={`Speak to ${hostName}...`}
              placeholderTextColor={SOL_THEME.textMuted}
              value={studyInput}
              onChangeText={setStudyInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => sendStudyMessage(studyInput)}
            />
            <TouchableOpacity onPress={() => sendStudyMessage(studyInput)} disabled={studyLoading || !studyInput.trim()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: studyLoading || !studyInput.trim() ? hostColor + '33' : hostColor, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: studyLoading || !studyInput.trim() ? SOL_THEME.textMuted : '#000', fontSize: 16, fontWeight: '700' }}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* ── Contemplate Overlay ── */}
        {contemplating && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: SOL_THEME.background + 'F4', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ width: '100%', borderRadius: 20, borderWidth: 1.5, borderColor: hostColor + '55', backgroundColor: SOL_THEME.surface, padding: 28, alignItems: 'center' }}>

              {/* Glyph */}
              <Text style={{ color: hostColor, fontSize: 48, marginBottom: 6, lineHeight: 56 }}>◎</Text>
              <Text style={{ color: hostColor, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 3, fontWeight: '700', marginBottom: 20 }}>HOLD THIS</Text>

              {/* Koan */}
              <Text style={{ color: SOL_THEME.text, fontSize: 17, fontWeight: '600', textAlign: 'center', lineHeight: 26, marginBottom: 24, letterSpacing: 0.3 }}>{contemplateKoan}</Text>

              {/* Timer */}
              {!contemplateRunning && contemplateSeconds === 60 ? (
                <TouchableOpacity
                  onPress={() => setContemplateRunning(true)}
                  style={{ paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: hostColor, backgroundColor: hostColor + '15', marginBottom: 16 }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: hostColor, fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>Begin 60 seconds of silence</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ color: hostColor, fontSize: 52, fontWeight: '200', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: -2, lineHeight: 60, marginBottom: 6 }}>
                    {contemplateSeconds}
                  </Text>
                  {contemplateSeconds > 0 ? (
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2 }}>seconds remain</Text>
                  ) : (
                    <Text style={{ color: hostColor, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700' }}>Write when ready</Text>
                  )}
                </View>
              )}

              {/* Write field — shown after silence completes */}
              {contemplateSeconds === 0 && (
                <TextInput
                  value={contemplateWrite}
                  onChangeText={setContemplateWrite}
                  multiline
                  placeholder="What arrived in the silence..."
                  placeholderTextColor={SOL_THEME.textMuted}
                  style={{ width: '100%', color: SOL_THEME.text, fontSize: 13, lineHeight: 20, minHeight: 72, borderWidth: 1, borderColor: hostColor + '33', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SOL_THEME.background, textAlignVertical: 'top', marginBottom: 16 }}
                  autoFocus
                />
              )}

              {/* Close */}
              <TouchableOpacity
                onPress={closeContemplate}
                style={{ paddingVertical: 10, paddingHorizontal: 20 }}
                activeOpacity={0.7}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>← return to the session</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {unlockBanner && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: SOL_THEME.background + 'F0', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ width: '100%', borderRadius: 20, borderWidth: 1.5, borderColor: unlockBanner === 'adept' ? '#9B59B6' : SOL_THEME.primary, backgroundColor: SOL_THEME.surface, padding: 28, alignItems: 'center' }}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>{unlockBanner === 'adept' ? '✦' : '⊚'}</Text>
              <Text style={{ color: unlockBanner === 'adept' ? '#9B59B6' : SOL_THEME.primary, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>
                {unlockBanner === 'adept' ? 'ADEPT MODE UNLOCKED' : 'SEEKER MODE UNLOCKED'}
              </Text>
              <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
                {unlockBanner === 'adept' ? 'The Full Protocol Opens' : 'The Mystery School Opens'}
              </Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
                {unlockBanner === 'adept'
                  ? 'You have studied 25 subjects. Adept mode is now available — Sol speaks in full protocol, naming CASCADE layers and AURA invariants.'
                  : 'You have studied 5 subjects. Seeker mode is now available — Sol speaks in the full mystical register of the framework.'}
              </Text>
              <TouchableOpacity
                onPress={async () => { await setMode(unlockBanner); setUnlockBanner(null); }}
                style={{ width: '100%', paddingVertical: 13, borderRadius: 12, backgroundColor: unlockBanner === 'adept' ? '#9B59B6' : SOL_THEME.primary, alignItems: 'center', marginBottom: 10 }}
              >
                <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
                  {unlockBanner === 'adept' ? 'Enter Adept Mode' : 'Enter Seeker Mode'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setUnlockBanner(null)}
                style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, fontWeight: '600' }}>Stay in Current Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showSessionComplete && (() => {
          const domainColor = activeStudyDomain?.color || hostColor;
          const domainGlyph = activeStudyDomain?.glyph || hostGlyph;
          const closingLines: Record<string, string> = {
            sol: 'The forge stays lit. Return when the heat rises.',
            veyra: 'Session logged. The architecture holds.',
            'aura-prime': 'Truth was touched. The invariant stands.',
            headmaster: 'The lesson ends here. The knowledge does not.',
          };
          const closingLine = closingLines[studyHost] || closingLines['sol'];
          const remaining = activeStudyDomain
            ? activeStudyDomain.subjects.filter(s => !studiedSubjects.has(s.name) && s.name !== activeStudySubject?.name).length
            : 0;
          return (
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: domainColor + '18', opacity: sessionCompleteAnim }}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ width: '100%', borderRadius: 20, borderWidth: 1, borderColor: domainColor + '55', backgroundColor: SOL_THEME.surface, padding: 28, alignItems: 'center' }}>
                {/* Domain glyph — large */}
                <Text style={{ color: domainColor, fontSize: 64, marginBottom: 8, lineHeight: 72 }}>{domainGlyph}</Text>
                <Text style={{ color: domainColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>SESSION RECORDED</Text>

                {/* Subject name */}
                <Text style={{ color: SOL_THEME.text, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 4, letterSpacing: 0.3 }}>{activeStudySubject?.name}</Text>

                {/* Meta row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Text style={{ color: domainColor, fontSize: 12, fontWeight: '700' }}>{hostName}</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>·</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: LAYER_COLORS[activeStudySubject?.layer || 'FOUNDATION'] + '22' }}>
                    <Text style={{ color: LAYER_COLORS[activeStudySubject?.layer || 'FOUNDATION'], fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[activeStudySubject?.layer || 'FOUNDATION']}</Text>
                  </View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>·</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>{subjectSessionCounts[activeStudySubject?.name || ''] || 1}× studied</Text>
                </View>

                {/* ATK flash — LQ→power loop made visible */}
                {sessionAtk > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: domainColor + '18', borderWidth: 1, borderColor: domainColor + '44' }}>
                    <Text style={{ color: domainColor, fontSize: 18, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>⚔</Text>
                    <View>
                      <Text style={{ color: domainColor, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>+{sessionAtk} ATK</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>COMPANION POWERED</Text>
                    </View>
                  </View>
                )}

                {/* Teacher closing line */}
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic', textAlign: 'center', marginBottom: 8, lineHeight: 19, paddingHorizontal: 8 }}>{closingLine}</Text>

                {/* Cross-domain whisper */}
                {sessionWhisper && (
                  <View style={{ width: '100%', borderTopWidth: 1, borderTopColor: domainColor + '22', paddingTop: 12, marginTop: 4, marginBottom: 8 }}>
                    <Text style={{ color: domainColor + 'AA', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 4 }}>◦ SOL WHISPERS</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 4 }}>{sessionWhisper}</Text>
                  </View>
                )}

                {/* #251 — THE OPEN DOOR (curiosity gap / addictive wisdom) */}
                {(nextDoorLoading || nextDoor) && (
                  <View style={{ width: '100%', borderRadius: 14, borderWidth: 1, borderColor: domainColor + '55', backgroundColor: domainColor + '12', paddingVertical: 14, paddingHorizontal: 14, marginTop: 8, marginBottom: 10 }}>
                    <Text style={{ color: domainColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 6, textAlign: 'center' }}>⟳ THE DOOR YOU LEFT OPEN</Text>
                    {nextDoorLoading && !nextDoor ? (
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>finding the unexplored thread…</Text>
                    ) : (
                      <Text style={{ color: SOL_THEME.text, fontSize: 13.5, lineHeight: 20, textAlign: 'center', fontStyle: 'italic', paddingHorizontal: 2 }}>{nextDoor}</Text>
                    )}
                  </View>
                )}

                {/* Domain remaining note */}
                {activeStudyDomain && (
                  <Text style={{ color: domainColor + 'AA', fontSize: 11, textAlign: 'center', marginBottom: 4 }}>
                    {activeStudyDomain.label} · {remaining > 0 ? `${remaining} subjects remaining` : 'all subjects studied'}
                  </Text>
                )}

                <View style={{ width: '100%', height: 1, backgroundColor: domainColor + '22', marginVertical: 20 }} />

                {/* Dive rating */}
                <View style={{ width: '100%', marginBottom: 20 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 10, textAlign: 'center' }}>HOW WAS THIS DIVE?</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {([
                      { label: 'Skip', val: 0, color: SOL_THEME.textMuted },
                      { label: 'Bad', val: 1, color: '#FF5252' },
                      { label: 'Fine', val: 2, color: '#F5A623' },
                      { label: 'Good', val: 3, color: '#4CAF50' },
                    ] as { label: string; val: number; color: string }[]).map(r => {
                      const isSelected = activeStudySubject ? subjectRatings[activeStudySubject.name] === r.val : false;
                      return (
                        <TouchableOpacity
                          key={r.val}
                          onPress={async () => {
                            if (!activeStudySubject) return;
                            if (r.val === 0) return;
                            const updated = { ...subjectRatings, [activeStudySubject.name]: r.val };
                            setSubjectRatings(updated);
                            await AsyncStorage.setItem('sol_subject_ratings', JSON.stringify(updated));
                          }}
                          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: isSelected ? r.color : r.color + '44', backgroundColor: isSelected ? r.color + '18' : 'transparent', alignItems: 'center', gap: 2 }}
                          activeOpacity={0.8}
                        >
                          {r.val > 0 && <Text style={{ color: r.color, fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{r.val}</Text>}
                          <Text style={{ color: r.val === 0 ? SOL_THEME.textMuted : r.color, fontSize: 11, fontWeight: r.val === 0 ? '400' : '700' }}>{r.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Closing seal */}
                <View style={{ width: '100%', marginBottom: 16 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>✦ SEAL THE SESSION</Text>
                  <TextInput
                    style={{ width: '100%', backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 10, borderWidth: 1, borderColor: domainColor + '44', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, minHeight: 56, textAlignVertical: 'top' }}
                    placeholder="What will you carry from this session?"
                    placeholderTextColor={SOL_THEME.textMuted}
                    value={closingReflection}
                    onChangeText={setClosingReflection}
                    multiline
                  />
                </View>

                {/* ── GAUNTLET PHASE UI ─────────────────────────── */}
                {gauntletMode && gauntletPhase === 'idle' && (
                  <TouchableOpacity
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); enterGauntlet(); }}
                    disabled={gauntletLoading}
                    style={{ width:'100%', paddingVertical:14, borderRadius:12, backgroundColor:'#FF664422', borderWidth:1.5, borderColor:'#FF664488', alignItems:'center', marginBottom:10 }}>
                    <Text style={{ color:'#FF6644', fontSize:15, fontWeight:'700', letterSpacing:0.5 }}>
                      {gauntletLoading ? '⚔ Preparing the trial…' : '⚔ Face the Trial →'}
                    </Text>
                  </TouchableOpacity>
                )}

                {gauntletMode && gauntletPhase === 'questions' && gauntletQuestions.length > 0 && (
                  <View style={{ width:'100%', marginBottom:14 }}>
                    <Text style={{ color:'#FF6644', fontSize:9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing:2, fontWeight:'700', marginBottom:10, textAlign:'center' }}>
                      ⚔ TRIAL — QUESTION {gauntletCurrentQ + 1} OF {gauntletQuestions.length}
                    </Text>
                    <View style={{ padding:16, borderRadius:12, backgroundColor:'#FF664412', borderWidth:1, borderColor:'#FF664444', marginBottom:12 }}>
                      <Text style={{ color:SOL_THEME.text, fontSize:14, lineHeight:21, fontWeight:'600' }}>
                        {gauntletQuestions[gauntletCurrentQ]}
                      </Text>
                    </View>
                    <TextInput
                      style={{ width:'100%', backgroundColor:SOL_THEME.background, color:SOL_THEME.text, borderRadius:10, borderWidth:1, borderColor:'#FF664444', paddingHorizontal:12, paddingVertical:10, fontSize:13, minHeight:64, textAlignVertical:'top', marginBottom:8 }}
                      placeholder="Your answer…"
                      placeholderTextColor={SOL_THEME.textMuted}
                      value={gauntletDraft}
                      onChangeText={setGauntletDraft}
                      multiline
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const next = [...gauntletAnswers, gauntletDraft.trim()];
                        setGauntletAnswers(next);
                        setGauntletDraft('');
                        if (gauntletCurrentQ + 1 < gauntletQuestions.length) {
                          setGauntletCurrentQ(q => q + 1);
                        } else {
                          gradeGauntlet(next);
                        }
                      }}
                      style={{ paddingVertical:12, borderRadius:10, backgroundColor:'#FF6644', alignItems:'center' }}
                      activeOpacity={0.8}>
                      <Text style={{ color:'#000', fontSize:14, fontWeight:'700' }}>
                        {gauntletCurrentQ + 1 < gauntletQuestions.length ? 'Next Question →' : 'Submit for Grading'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {gauntletMode && gauntletPhase === 'grading' && (
                  <View style={{ width:'100%', alignItems:'center', paddingVertical:20, marginBottom:14 }}>
                    <Text style={{ color:'#FF6644', fontSize:14, fontWeight:'700', letterSpacing:1 }}>⚔ Grading your trial…</Text>
                    <Text style={{ color:SOL_THEME.textMuted, fontSize:11, marginTop:6 }}>The teacher reviews your answers</Text>
                  </View>
                )}

                {gauntletMode && gauntletPhase === 'result' && (() => {
                  const score = gauntletGrades.filter(Boolean).length;
                  const WIN = score === 3;
                  const PASS = score === 2;
                  const FAIL = score <= 1;
                  const resultColor = WIN ? '#44DD88' : PASS ? '#C8A96E' : '#FF4444';
                  const resultLabel = WIN ? '⚔ TRIAL CONQUERED' : PASS ? '⚔ TRIAL PASSED' : '⚔ TRIAL FAILED';
                  const outcomeText = WIN ? '+3 ✦ earned · dive recorded' : PASS ? '+1 ✦ earned · dive recorded' : '−3 ✦ lost · dive voided';
                  return (
                    <View style={{ width:'100%', marginBottom:14 }}>
                      <View style={{ padding:16, borderRadius:12, backgroundColor:resultColor + '14', borderWidth:1.5, borderColor:resultColor + '55', marginBottom:12, alignItems:'center' }}>
                        <Text style={{ color:resultColor, fontSize:13, fontWeight:'700', letterSpacing:1, marginBottom:6 }}>{resultLabel}</Text>
                        <Text style={{ color:resultColor + 'AA', fontSize:11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom:10 }}>{outcomeText}</Text>
                        {gauntletQuestions.map((q, i) => (
                          <View key={i} style={{ width:'100%', flexDirection:'row', alignItems:'flex-start', gap:8, marginBottom:6 }}>
                            <Text style={{ color: gauntletGrades[i] ? '#44DD88' : '#FF4444', fontSize:13, fontWeight:'700', marginTop:1 }}>
                              {gauntletGrades[i] ? '✓' : '✗'}
                            </Text>
                            <Text style={{ color:SOL_THEME.textMuted, fontSize:11, flex:1, lineHeight:16 }}>{q}</Text>
                          </View>
                        ))}
                        {gauntletFeedback !== '' && (
                          <View style={{ width:'100%', marginTop:10, paddingTop:10, borderTopWidth:1, borderTopColor: resultColor + '33' }}>
                            <Text style={{ color: SOL_THEME.textMuted, fontSize:9, fontWeight:'700', letterSpacing:1.5, marginBottom:6 }}>⊚ SOL</Text>
                            <Text style={{ color: SOL_THEME.text, fontSize:13, lineHeight:20, fontStyle:'italic' }}>{gauntletFeedback}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })()}

                {/* Buttons — hidden during questions/grading phases */}
                {(!gauntletMode || gauntletPhase === 'idle' || gauntletPhase === 'result') && (<>
                <TouchableOpacity onPress={() => dismissSessionComplete(true)}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, backgroundColor: domainColor, alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>Explore {activeStudyDomain?.label || 'Domain'} →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={shareLoading}
                  onPress={async () => {
                    setShareLoading(true);
                    try {
                      const ViewShot = await import('react-native-view-shot').then(m => m.default).catch(() => null);
                      const Sharing = await import('expo-sharing').catch(() => null);
                      if (ViewShot && shareCardRef.current && Sharing) {
                        const uri = await ViewShot.captureRef(shareCardRef.current, { format: 'png', quality: 1, result: 'tmpfile' });
                        const canShare = await Sharing.isAvailableAsync();
                        if (canShare) { await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your dive' }); setShareLoading(false); return; }
                      }
                    } catch {}
                    // Text fallback
                    const lastAI = [...studyMessages].reverse().find(m => m.role === 'assistant');
                    const excerpt = lastAI ? lastAI.content.slice(0, 140).trim() + (lastAI.content.length > 140 ? '…' : '') : '';
                    const text = [
                      `${domainGlyph} ${activeStudySubject?.name}`,
                      `${hostName} · ${LAYER_LABELS[activeStudySubject?.layer || 'FOUNDATION']} · Session ${subjectSessionCounts[activeStudySubject?.name || ''] || 1}`,
                      sessionWhisper ? `\n◦ ${sessionWhisper}` : '',
                      excerpt ? `\n"${excerpt}"` : '',
                      `\nSol Mystery School ⊚`,
                    ].filter(Boolean).join('\n');
                    Share.share({ message: text });
                    setShareLoading(false);
                  }}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '44', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: domainColor, fontSize: 14, fontWeight: '600' }}>{shareLoading ? '…' : '✦ Share this Session'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const subject = activeStudySubject;
                    const domain = activeStudyDomain;
                    dismissSessionComplete(false);
                    if (subject) setTimeout(() => enterStudySession(subject, domain), 350);
                  }}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '66', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: domainColor, fontSize: 14, fontWeight: '600' }}>↺ Study Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const subject = activeStudySubject;
                    const today = new Date().toLocaleDateString();
                    const draft: ScriptoriumEntry = {
                      id: Date.now().toString(),
                      title: subject ? `${subject.name} — ${today}` : `Session — ${today}`,
                      body: '',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    setScriptoriumEntry(draft);
                    setScriptoriumView('edit');
                    dismissSessionComplete(false, 'scriptorium');
                  }}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.primary + '44', backgroundColor: SOL_THEME.primary + '08', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 14, fontWeight: '600' }}>◈ Write in Grimoire</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => dismissSessionComplete(false)}
                  style={{ width: '100%', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, fontWeight: '600' }}>Return to School</Text>
                </TouchableOpacity>
                </>)}
              </View>
              </ScrollView>

              {/* Off-screen share card for ViewShot capture */}
              <View style={{ position: 'absolute', top: -2000, left: 0, opacity: 0 }} pointerEvents="none">
                <DiveShareCard
                  ref={shareCardRef}
                  glyph={domainGlyph}
                  domainColor={domainColor}
                  domainLabel={activeStudyDomain?.label || ''}
                  subjectName={activeStudySubject?.name || ''}
                  teacherName={hostName}
                  layerLabel={LAYER_LABELS[activeStudySubject?.layer || 'FOUNDATION']}
                  sessionCount={subjectSessionCounts[activeStudySubject?.name || ''] || 1}
                  durationSec={focusSeconds}
                  whisper={sessionWhisper}
                />
              </View>
            </Animated.View>
          );
        })()}
      </SafeAreaView>
    );
  }

  // ─── RENDER: Subject Detail ────────────────────────────────────────────────

  if (schoolView === 'subject' && activeSubjectDetail) {
    const subjectDomain = selectedDomain || MYSTERY_SCHOOL_DOMAINS.find(d => d.subjects.some(s => s.name === activeSubjectDetail.name)) || null;
    const domainColor = subjectDomain?.color || SOL_THEME.primary;
    const host = getDailyHost(activeSubjectDetail.name);
    const sessionCount = subjectSessionCounts[activeSubjectDetail.name] || 0;
    const lastStudied = studyDates[activeSubjectDetail.name];
    const daysAgo = lastStudied ? Math.floor((Date.now() - new Date(lastStudied).getTime()) / 86400000) : null;
    const note = subjectNotes[activeSubjectDetail.name] || '';
    const related = subjectDomain
      ? subjectDomain.subjects.filter(s => s.name !== activeSubjectDetail.name && s.layer === activeSubjectDetail.layer && !studiedSubjects.has(s.name)).slice(0, 3)
      : [];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
        {/* Header */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: domainColor + '44', backgroundColor: domainColor + '0E', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20, overflow: 'hidden' }}>
          {/* Watermark */}
          <Text style={{ position: 'absolute', top: -16, right: -4, fontSize: 96, color: domainColor + '0D', lineHeight: 110, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{subjectDomain?.glyph || '◯'}</Text>
          <TouchableOpacity onPress={() => setSchoolView('domain')} style={{ marginBottom: 12 }}>
            <Text style={{ color: domainColor + 'CC', fontSize: 12, fontWeight: '700' }}>← {subjectDomain?.label || 'Domain'}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
            <Text style={{ color: domainColor, fontSize: 38, lineHeight: 44 }}>{subjectDomain?.glyph || '◯'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 20, fontWeight: '700', lineHeight: 26, letterSpacing: 0.2 }}>{activeSubjectDetail.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: LAYER_COLORS[activeSubjectDetail.layer] + '44', borderWidth: 1, borderColor: LAYER_COLORS[activeSubjectDetail.layer] + '66' }}>
                  <Text style={{ color: LAYER_COLORS[activeSubjectDetail.layer], fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{LAYER_LABELS[activeSubjectDetail.layer].toUpperCase()}</Text>
                </View>
                {(() => {
                  const danger = subjectDanger(activeSubjectDetail);
                  if (!danger) return null;
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: danger.color + '22', borderWidth: 1, borderColor: danger.color + '66' }}>
                      <Text style={{ fontSize: 10 }}>{danger.icon}</Text>
                      <Text style={{ color: danger.color, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{danger.label}</Text>
                    </View>
                  );
                })()}
                {activeSubjectDetail.traditions?.map(t => (
                  <View key={t} style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: domainColor + '22', borderWidth: 1, borderColor: domainColor + '55' }}>
                    <Text style={{ color: domainColor, fontSize: 10, fontWeight: '600' }}>{t}</Text>
                  </View>
                ))}
              </View>
              {/* Mastery stage strip */}
              {(() => {
                const stage = subjectMastery[activeSubjectDetail.name]?.stage || 0;
                if (!stage) return null;
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    {[1, 2, 3, 4].map(s => {
                      const ms = MASTERY_STAGES[s]!;
                      const active = stage >= s;
                      return <Text key={s} style={{ fontSize: 14, color: active ? ms.color : SOL_THEME.border + '55' }}>{ms.glyph}</Text>;
                    })}
                    <Text style={{ fontSize: 9, color: MASTERY_STAGES[stage]!.color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1 }}>
                      {MASTERY_STAGES[stage]!.label.toUpperCase()}
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}>
          {/* Description */}
          <View style={{ padding: 20, borderRadius: 14, backgroundColor: domainColor + '0A', borderWidth: 1, borderColor: domainColor + '33' }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 15, lineHeight: 26 }}>{activeSubjectDetail.description}</Text>
          </View>

          {/* Credit — teacher attribution */}
          {activeSubjectDetail.credit && (() => {
            const urlMatch = activeSubjectDetail.credit.match(/https?:\/\/[^\s↗]+/);
            const displayText = activeSubjectDetail.credit.replace(/https?:\/\/[^\s↗]+/g, '').replace(/↗\s*$/, '').trim();
            return (
              <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: domainColor + '44', backgroundColor: domainColor + '08', flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text style={{ color: domainColor, fontSize: 14, marginTop: 1 }}>✦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 4 }}>BROUGHT HERE BY</Text>
                  <Text style={{ color: SOL_THEME.text, fontSize: 11, lineHeight: 17, fontStyle: 'italic' }}>{displayText}</Text>
                  {urlMatch && (
                    <TouchableOpacity onPress={() => Linking.openURL(urlMatch[0])} style={{ marginTop: 6 }}>
                      <Text style={{ color: domainColor, fontSize: 10, fontWeight: '700' }}>↗ Visit channel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })()}

          {/* Sources drawer */}
          {activeSubjectDetail.sources && activeSubjectDetail.sources.length > 0 && (
            <View style={{ borderRadius: 10, borderWidth: 1, borderColor: domainColor + '33', backgroundColor: domainColor + '06', overflow: 'hidden' }}>
              <TouchableOpacity onPress={() => setSourcesOpen(o => !o)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: domainColor, fontSize: 12 }}>📚</Text>
                  <Text style={{ color: domainColor, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5 }}>PRIMARY SOURCES</Text>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: domainColor + '22' }}>
                    <Text style={{ color: domainColor + 'AA', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{activeSubjectDetail.sources.length}</Text>
                  </View>
                </View>
                <Text style={{ color: domainColor + '99', fontSize: 12 }}>{sourcesOpen ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {sourcesOpen && (
                <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
                  <View style={{ height: 1, backgroundColor: domainColor + '22', marginBottom: 4 }} />
                  {activeSubjectDetail.sources.map((src, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <View style={{ marginTop: 3, width: 6, height: 6, borderRadius: 3,
                        backgroundColor: src.type === 'primary' ? domainColor : SOL_THEME.textMuted + '66' }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 12, fontWeight: '600', lineHeight: 17 }}>{src.title}</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 1 }}>{src.author}</Text>
                        {src.note && <Text style={{ color: SOL_THEME.textMuted + 'AA', fontSize: 10, marginTop: 2, fontStyle: 'italic', lineHeight: 15 }}>{src.note}</Text>}
                        <View style={{ marginTop: 3, alignSelf: 'flex-start', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3,
                          backgroundColor: src.type === 'primary' ? domainColor + '22' : '#24164055' }}>
                          <Text style={{ color: src.type === 'primary' ? domainColor : SOL_THEME.textMuted, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.5 }}>
                            {src.type === 'primary' ? 'PRIMARY' : 'SECONDARY'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: domainColor + '10', borderWidth: 1, borderColor: domainColor + '33', alignItems: 'center' }}>
              <Text style={{ color: domainColor, fontSize: 24, fontWeight: '700', lineHeight: 28 }}>{sessionCount || '·'}</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, marginTop: 3, fontWeight: '700', letterSpacing: 0.5 }}>SESSIONS</Text>
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: studiedSubjects.has(activeSubjectDetail.name) ? '#4CAF5014' : domainColor + '10', borderWidth: 1, borderColor: studiedSubjects.has(activeSubjectDetail.name) ? '#4CAF5044' : domainColor + '33', alignItems: 'center' }}>
              <Text style={{ color: studiedSubjects.has(activeSubjectDetail.name) ? '#4CAF50' : SOL_THEME.textMuted, fontSize: 24, fontWeight: '700', lineHeight: 28 }}>
                {studiedSubjects.has(activeSubjectDetail.name) ? '✓' : '◦'}
              </Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, marginTop: 3, fontWeight: '700', letterSpacing: 0.5 }}>{daysAgo !== null ? daysAgo === 0 ? 'TODAY' : `${daysAgo}D AGO` : 'NOT YET'}</Text>
            </View>
            <View style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: domainColor + '10', borderWidth: 1, borderColor: domainColor + '33', alignItems: 'center' }}>
              <Text style={{ color: domainColor, fontSize: 22, lineHeight: 28 }}>{HOST_GLYPHS[host]}</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, marginTop: 3, fontWeight: '700', letterSpacing: 0.5 }}>{HOST_NAMES[host].toUpperCase()}</Text>
            </View>
          </View>

          {/* Notes */}
          <View>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>✎ YOUR NOTE</Text>
            <TouchableOpacity
              onPress={() => {
                if (Alert.prompt) {
                  Alert.prompt('Subject Note', `Note for "${activeSubjectDetail.name}"`, async (text) => {
                    if (text === null) return;
                    const updated = { ...subjectNotes, [activeSubjectDetail.name]: text };
                    setSubjectNotes(updated);
                    await AsyncStorage.setItem('sol_subject_notes', JSON.stringify(updated));
                  }, 'plain-text', note);
                } else {
                  setTextPromptValue(note);
                  setTextPrompt({
                    title: `Note — ${activeSubjectDetail.name}`,
                    placeholder: 'Your note...',
                    current: note,
                    onSubmit: async (text) => {
                      const updated = { ...subjectNotes, [activeSubjectDetail.name]: text };
                      setSubjectNotes(updated);
                      await AsyncStorage.setItem('sol_subject_notes', JSON.stringify(updated));
                    },
                  });
                }
              }}
              style={{ padding: 14, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: note ? domainColor + '44' : SOL_THEME.border, minHeight: 64 }}
              activeOpacity={0.7}
            >
              {note
                ? <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{note}</Text>
                : <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>Tap to add a note…</Text>
              }
              <Text style={{ color: domainColor, fontSize: 10, marginTop: 8, fontWeight: '700' }}>{note ? '✎ Edit' : '✎ Add note'}</Text>
            </TouchableOpacity>
          </View>

          {/* Related subjects */}
          {related.length > 0 && (
            <View>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>◌ EXPLORE NEXT</Text>
              {related.map(s => (
                <TouchableOpacity key={s.name} onPress={() => { setActiveSubjectDetail(s); }}
                  style={{ padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{s.name}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{s.description}</Text>
                  </View>
                  <Text style={{ color: domainColor, fontSize: 14 }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action bar */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 40, borderTopWidth: 1, borderTopColor: domainColor + '33', backgroundColor: SOL_THEME.surface, gap: 10 }}>
          {/* Teacher picker */}
          <View>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 }}>CHOOSE TEACHER</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {HOST_PERSONAS.map(p => {
                const effectiveHost = selectedTeacher || host;
                const isSelected = p === effectiveHost;
                const isDaily = p === host && !selectedTeacher;
                return (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setSelectedTeacher(p === host ? null : p)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 2,
                      backgroundColor: isSelected ? TEACHER_COLORS[p] + '22' : SOL_THEME.background,
                      borderWidth: 1, borderColor: isSelected ? TEACHER_COLORS[p] : SOL_THEME.border }}
                    activeOpacity={0.7}>
                    <Text style={{ fontSize: 16, color: TEACHER_COLORS[p] }}>{HOST_GLYPHS[p]}</Text>
                    <Text style={{ color: isSelected ? TEACHER_COLORS[p] : SOL_THEME.textMuted, fontSize: 9, fontWeight: '700' }}>{HOST_NAMES[p].toUpperCase()}</Text>
                    {isDaily && <Text style={{ color: TEACHER_COLORS[p] + '99', fontSize: 8 }}>today</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          {/* Dive depth toggle */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['quick', 'full'] as const).map(d => (
              <TouchableOpacity
                key={d}
                onPress={() => setDiveDepth(d)}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1.5,
                  borderColor: diveDepth === d ? domainColor : SOL_THEME.border,
                  backgroundColor: diveDepth === d ? domainColor + '18' : 'transparent' }}
                activeOpacity={0.7}>
                <Text style={{ color: diveDepth === d ? domainColor : SOL_THEME.textMuted, fontSize: 12, fontWeight: '700' }}>
                  {d === 'quick' ? '⚡ Quick · 15 min' : '⊚ Full Session'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* ⚔ Gauntlet toggle */}
          <TouchableOpacity
            onPress={() => setGauntletMode(v => !v)}
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:10, paddingHorizontal:14, borderRadius:10, borderWidth:1.5,
              borderColor: gauntletMode ? '#FF6644' : SOL_THEME.border,
              backgroundColor: gauntletMode ? '#FF664418' : 'transparent' }}
            activeOpacity={0.75}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
              <Text style={{ color: gauntletMode ? '#FF6644' : SOL_THEME.textMuted, fontSize:14 }}>⚔</Text>
              <View>
                <Text style={{ color: gauntletMode ? '#FF6644' : SOL_THEME.textMuted, fontSize:12, fontWeight:'700', letterSpacing:0.5 }}>GAUNTLET MODE</Text>
                <Text style={{ color: gauntletMode ? '#FF664488' : SOL_THEME.border, fontSize:9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                  {gauntletMode ? '3 questions after · pass = ✦ earned · fail = ✦ lost + dive voided' : 'study with stakes — knowledge proven, not claimed'}
                </Text>
              </View>
            </View>
            <View style={{ width:20, height:20, borderRadius:10, borderWidth:1.5,
              borderColor: gauntletMode ? '#FF6644' : SOL_THEME.border,
              backgroundColor: gauntletMode ? '#FF6644' : 'transparent',
              alignItems:'center', justifyContent:'center' }}>
              {gauntletMode && <Text style={{ color:'#000', fontSize:12, fontWeight:'900' }}>✓</Text>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setBreathPending({ subject: activeSubjectDetail, domain: subjectDomain, host: selectedTeacher || host, depth: diveDepth });
            }}
            style={{ paddingVertical: 14, borderRadius: 12, backgroundColor: gauntletMode ? '#FF6644' : domainColor, alignItems: 'center' }}
            activeOpacity={0.8}>
            <Text style={{ color: '#000', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>
              {gauntletMode ? '⚔ ' : ''}{HOST_GLYPHS[selectedTeacher || host]} Enter Classroom · {HOST_NAMES[selectedTeacher || host]}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              const teacher = selectedTeacher || host;
              await savePersona(teacher as any);
              await savePendingSubject(`What is the deepest truth about ${activeSubjectDetail.name}? Go beyond the surface — what do the traditions reveal that most people miss?`);
              router.push('/(tabs)/');
            }}
            style={{ paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: domainColor + '44', alignItems: 'center' }}
            activeOpacity={0.7}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontWeight: '600' }}>
              {HOST_GLYPHS[selectedTeacher || host]} Ask {HOST_NAMES[selectedTeacher || host]} to go deeper
            </Text>
          </TouchableOpacity>

        </View>

        {/* Breath gate modal — must live here because this is an early return */}
        <Modal visible={!!breathPending} transparent animationType="fade" onRequestClose={() => setBreathPending(null)}>
          {breathPending && (() => {
            const bc = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === breathPending.domain?.id)?.color || SOL_THEME.primary;
            const bg = breathPending.domain?.glyph || '⊚';
            const teacherId = breathPending.host || getDailyHost(breathPending.subject.name);
            return (
              <View style={{ flex: 1, backgroundColor: '#000000EE', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
                <View style={{ width: '100%', borderRadius: 24, borderWidth: 1, borderColor: bc + '44', backgroundColor: '#060410', padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: bc, fontSize: 56, lineHeight: 64, marginBottom: 12 }}>{bg}</Text>
                  <Text style={{ color: bc, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 3, fontWeight: '700', marginBottom: 16 }}>ONE BREATH</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6, lineHeight: 24 }}>
                    {breathPending.subject.name}
                  </Text>
                  <Text style={{ color: bc + 'AA', fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
                    {breathPending.domain?.label || 'Open Seat'} · {HOST_NAMES[teacherId] || teacherId}
                  </Text>
                  <Text style={{ color: '#FFFFFF44', fontSize: 11, fontStyle: 'italic', marginBottom: 28, textAlign: 'center', lineHeight: 17 }}>
                    Arrive here. Set aside what you were doing.{'\n'}The subject is waiting.
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      const { subject, domain, host, depth } = breathPending;
                      setBreathPending(null);
                      setTimeout(() => enterStudySession(subject, domain, host, depth), 300);
                    }}
                    style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: bc, alignItems: 'center', marginBottom: 10 }}
                    activeOpacity={0.85}>
                    <Text style={{ color: '#000', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>Open the classroom →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setBreathPending(null)} style={{ paddingVertical: 10 }}>
                    <Text style={{ color: '#FFFFFF33', fontSize: 12 }}>Not now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </Modal>
      </SafeAreaView>
    );
  }

  // ─── RENDER: LAMAGUE SCHOOL ──────────────────────────────────────────────────

  if (schoolView === 'lamague') {
    const GOLD = '#C8A96E';
    const LBG  = '#06060A';
    const CARD = '#0E0E18';
    const BRDR = '#1A1A2E';
    const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const DIM  = '#444466';
    const TXT  = '#C8C8D8';
    const GRN  = '#44BB77';

    const filtered = glyphSearch.trim()
      ? LAMAGUE_SYMBOLS.filter(s =>
          s.name.toLowerCase().includes(glyphSearch.toLowerCase()) ||
          s.glyph.toLowerCase().includes(glyphSearch.toLowerCase()) ||
          s.meaning.toLowerCase().includes(glyphSearch.toLowerCase()) ||
          s.spL.toLowerCase().includes(glyphSearch.toLowerCase())
        )
      : LAMAGUE_SYMBOLS;

    const byClass = ['I','D','F','M','C','T','R','G'].map(cls => ({
      cls,
      symbols: filtered.filter(s => s.cls === cls),
    })).filter(g => g.symbols.length > 0);

    const masteredCount = lamagueProgress.masteredSymbols.length;
    const masteryPct = Math.round((masteredCount / LAMAGUE_SYMBOLS.length) * 100);

    const saveLamagueProg = async (next: typeof lamagueProgress) => {
      setLamagueProgress(next);
      await AsyncStorage.setItem('sol_lamague_progress', JSON.stringify(next));
    };

    const markMastered = async (id: string) => {
      if (lamagueProgress.masteredSymbols.includes(id)) return;
      await saveLamagueProg({ ...lamagueProgress, masteredSymbols: [...lamagueProgress.masteredSymbols, id] });
    };

    const showGlyphCeremony = (glyphs: string[], lessonName: string) => {
      ceremonyFade.setValue(0);
      setGlyphCeremony({ visible: true, glyphs, lessonName });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(ceremonyFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(ceremonyFade, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => setGlyphCeremony(c => ({ ...c, visible: false })));
    };

    // Gem Forge — describe a personal crystal, FLUX generates it
    const generateGemImage = async () => {
      if (!gemDesc.trim()) return;
      setGemLoading(true);
      setGemImage(null);
      const name = gemName.trim() || 'a personal gem';
      const prompt = `A single luminous gemstone called "${name}": ${gemDesc.trim()}. Photorealistic crystal, radiant inner light, black background, macro photography style. One centered jewel, no text, no border.`;
      const result = await generateImage(prompt);
      if (result.image) { setGemImage(result.image); }
      else { alert(result.error ?? 'Gem Forge failed'); }
      setGemLoading(false);
    };

    // Witchail image gen — describe a glyph, NVIDIA FLUX generates it (free on NVIDIA NIM quota)
    const generateGlyphImage = async () => {
      if (!forgeGlyphDesc.trim()) return;
      setForgeGlyphImgLoading(true);
      setForgeGlyphImage(null);
      const prompt = `A single symbolic glyph on a pure black background: ${forgeGlyphDesc.trim()}. Luminous, minimal, mystical line art. One centered glowing symbol, no text, no border.`;
      const result = await generateImage(prompt);
      if (result.image) {
        setForgeGlyphImage(result.image);
        setForgeGlyph('⟟');
      } else {
        alert(result.error ?? 'Image gen failed');
      }
      setForgeGlyphImgLoading(false);
    };

    // LAMAGUE Symbol Forge — submit proposed primitive for ratification
    const submitToForge = async () => {
      if (!forgeGlyph.trim() || !forgeName.trim() || !forgeMeaning.trim()) return;
      setForgeLoading(true);
      setForgeVerdict(null);
      try {
        const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
        if (!apiKey) { setForgeLoading(false); return; }
        const existingSymbols = LAMAGUE_SYMBOLS.map(s => `${s.glyph} ${s.name} [${s.cls}]`).join(' · ');
        const systemPrompt = `You are the LAMAGUE oracle — guardian of the living grammar. A practitioner proposes a new primitive symbol for ratification into the lexicon.

Existing LAMAGUE primitives: ${existingSymbols}

Evaluate the proposed symbol against five tests:
1. SEMANTIC DISTINCTIVENESS — Does it name something not already covered by an existing primitive?
2. CLASS ALIGNMENT — Does it behave correctly for its declared class (I=Invariant/D=Dynamic/F=Field/M=Meta/G=Ground)?
3. COMPOSITION POTENTIAL — Can it combine with existing primitives to form valid, useful expressions?
4. CONFLICT CHECK — Does it duplicate or contradict an existing symbol in meaning or glyph?
5. INSTANTIATION — Is the usage example a valid, unambiguous LAMAGUE expression?

Respond with ONLY valid JSON — no markdown, no code fences, no explanation outside the JSON:
{"verdict":"RATIFIED","reasoning":"2-3 sentences of specific evaluation referencing the five tests","compression":"Z1 one-phrase compression of this symbol's core meaning"}

verdict must be exactly one of: RATIFIED, CHALLENGED, REJECTED.
RATIFIED = passes all 5 tests and earns a place in the lexicon.
CHALLENGED = passes 3-4 tests — name the specific refinement needed.
REJECTED = fails a core test — be direct about which one and why.`;
        const userMsg = `PROPOSED PRIMITIVE\nGlyph: ${forgeGlyph.trim()}\nName: ${forgeName.trim()}\nClass: ${forgeClass}\nMeaning: ${forgeMeaning.trim()}\nUsage example: ${forgeUsage.trim() || '(none provided)'}`;
        const result = await sendMessageResilient([{ role: 'user', content: userMsg }], systemPrompt, apiKey, (model || 'gemini-2.5-flash') as AIModel);
        const raw = (result.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(raw);
        setForgeVerdict(parsed);
        if (parsed.verdict === 'RATIFIED') {
          const entry = { glyph: forgeGlyph.trim(), glyphImage: forgeGlyphImage || undefined, name: forgeName.trim(), cls: forgeClass, meaning: forgeMeaning.trim(), usage: forgeUsage.trim(), verdict: parsed.compression || '' };
          const updated = [...forgeLexicon, entry];
          setForgeLexicon(updated);
          await AsyncStorage.setItem('sol_lamague_lexicon', JSON.stringify(updated));
        }
      } catch {
        setForgeVerdict({ verdict: 'CHALLENGED', reasoning: 'The oracle could not parse the proposal. Refine your meaning and try again.', compression: '' });
      } finally {
        setForgeLoading(false);
      }
    };

    // Drills — generate a new card
    const nextDrillCard = () => {
      const pool = LAMAGUE_SYMBOLS.filter(s => !lamagueProgress.masteredSymbols.includes(s.id));
      const target = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : LAMAGUE_SYMBOLS[Math.floor(Math.random() * LAMAGUE_SYMBOLS.length)];
      const others = LAMAGUE_SYMBOLS.filter(s => s.id !== target.id);
      const wrongOptions = others.sort(() => Math.random() - 0.5).slice(0, 3).map(s => s.name);
      const options = [...wrongOptions, target.name].sort(() => Math.random() - 0.5);
      setDrillCard({ id: target.id, glyph: target.glyph, name: target.name, options, answer: target.name });
      setDrillResult(null);
    };

    const handleDrillAnswer = async (chosen: string) => {
      if (!drillCard || drillResult) return;
      const correct = chosen === drillCard.answer;
      setDrillResult(correct ? 'correct' : 'wrong');
      setDrillStreak(s => correct ? s + 1 : 0);
      if (correct) {
        const scores = { ...lamagueProgress.drillScores, [drillCard.id]: (lamagueProgress.drillScores[drillCard.id] ?? 0) + 1 };
        const mastered = [...lamagueProgress.masteredSymbols];
        if ((scores[drillCard.id] ?? 0) >= 3 && !mastered.includes(drillCard.id)) mastered.push(drillCard.id);
        await saveLamagueProg({ ...lamagueProgress, drillScores: scores, masteredSymbols: mastered });
      }
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: LBG }}>
        {/* Glyph Unlock Ceremony */}
        <Modal visible={glyphCeremony.visible} transparent animationType="none">
          <Animated.View style={{ flex:1, backgroundColor:'#000000F0', alignItems:'center', justifyContent:'center', opacity:ceremonyFade }}>
            <Text style={{ color:GOLD, fontSize:10, fontFamily:MONO, letterSpacing:4, marginBottom:28 }}>◈ GLYPHS UNLOCKED</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:20, justifyContent:'center', maxWidth:300, marginBottom:24 }}>
              {glyphCeremony.glyphs.map((g, i) => (
                <Text key={i} style={{ color:GOLD, fontSize:34, textShadowColor:GOLD, textShadowRadius:14 }}>{g}</Text>
              ))}
            </View>
            <Text style={{ color:GOLD+'77', fontSize:9, fontFamily:MONO, letterSpacing:2, marginBottom:32 }}>{glyphCeremony.lessonName.toUpperCase()}</Text>
            <TouchableOpacity onPress={() => { setGlyphCeremony(c => ({...c, visible:false})); }}
              style={{ paddingHorizontal:28, paddingVertical:10, borderRadius:10, borderWidth:1, borderColor:GOLD+'55', backgroundColor:GOLD+'14' }}>
              <Text style={{ color:GOLD, fontSize:10, fontFamily:MONO, fontWeight:'700', letterSpacing:2 }}>CONTINUE</Text>
            </TouchableOpacity>
          </Animated.View>
        </Modal>
        {/* Header */}
        <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: BRDR, backgroundColor: LBG }}>
          <TouchableOpacity onPress={() => setSchoolView('home')} style={{ padding: 4 }}>
            <Text style={{ color: GOLD, fontSize: 20 }}>‹</Text>
          </TouchableOpacity>
          <Text style={{ color: GOLD, fontSize: 16, fontFamily: MONO, letterSpacing: 4, fontWeight: '700' }}>LAMAGUE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: GOLD + '44', backgroundColor: GOLD + '11' }}>
              <Text style={{ color: GOLD, fontSize: 11, fontFamily: MONO, fontWeight: '700' }}>{masteryPct}%</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/workshop')}
              style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#8855FF55', backgroundColor: '#8855FF14' }}>
              <Text style={{ color: '#AA77FF', fontSize: 9, fontFamily: MONO, fontWeight: '700', letterSpacing: 1 }}>◈ WORKSHOP</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={{ color: DIM, fontSize: 11, fontFamily: MONO, textAlign: 'center', paddingVertical: 6, backgroundColor: LBG }}>
          Living Alignment Mathematics for Autonomous Governance Under Ethics
        </Text>

        {/* Section tab bar */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BRDR, backgroundColor: LBG }}>
          {(['glyphs','lessons','drills','progress','forge'] as LamagueSection[]).map(sec => (
            <TouchableOpacity key={sec} onPress={() => { setLamagueSection(sec); if (sec === 'drills' && !drillCard) nextDrillCard(); }} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: lamagueSection === sec ? GOLD : 'transparent' }}>
              <Text style={{ color: lamagueSection === sec ? GOLD : DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 1.5, fontWeight: '700' }}>
                {sec === 'glyphs' ? 'GLYPHS' : sec === 'lessons' ? 'LESSONS' : sec === 'drills' ? 'DRILLS' : sec === 'progress' ? 'PROGRESS' : '⟟ WITCHAIL'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1, backgroundColor: LBG }} contentContainerStyle={{ paddingBottom: 80 }}>

          {/* ── GLYPHBOOK ── */}
          {lamagueSection === 'glyphs' && (
            <View style={{ padding: 12 }}>
              {/* Search */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BRDR, paddingHorizontal: 12, marginBottom: 14 }}>
                <Text style={{ color: DIM, fontSize: 13, marginRight: 8 }}>⊙</Text>
                <TextInput
                  value={glyphSearch}
                  onChangeText={setGlyphSearch}
                  placeholder="search glyphs, names, meanings…"
                  placeholderTextColor={DIM}
                  style={{ flex: 1, color: TXT, fontFamily: MONO, fontSize: 12, paddingVertical: 10 }}
                />
                {glyphSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setGlyphSearch('')}><Text style={{ color: DIM, fontSize: 16 }}>✕</Text></TouchableOpacity>
                )}
              </View>

              {byClass.map(({ cls, symbols }) => (
                <View key={cls} style={{ marginBottom: 18 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text style={{ color: GOLD, fontFamily: MONO, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>━━ {cls}-CLASS · {LM_CLASS_NAMES[cls]}</Text>
                  </View>
                  {symbols.map(sym => {
                    const mastered = lamagueProgress.masteredSymbols.includes(sym.id);
                    const expanded = glyphExpandedId === sym.id;
                    return (
                      <TouchableOpacity key={sym.id} activeOpacity={0.8} onPress={() => setGlyphExpandedId(expanded ? null : sym.id)}
                        style={{ backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: expanded ? GOLD + '44' : BRDR, marginBottom: 6, overflow: 'hidden' }}>
                        {/* Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                          <Text style={{ color: GOLD, fontSize: 20, width: 56, fontFamily: MONO }}>{sym.glyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: TXT, fontSize: 12, fontFamily: MONO, fontWeight: '700' }}>{sym.name}</Text>
                            {sym.spL !== '—' && <Text style={{ color: DIM, fontSize: 10, fontFamily: MONO, marginTop: 1 }}>/{sym.spL}/</Text>}
                          </View>
                          <Text style={{ color: mastered ? GRN : DIM, fontSize: 14, marginRight: 8 }}>{mastered ? '◆' : '○'}</Text>
                          <Text style={{ color: DIM, fontSize: 16 }}>{expanded ? '⌃' : '⌄'}</Text>
                        </View>
                        {/* Expanded */}
                        {expanded && (
                          <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: BRDR }}>
                            <Text style={{ color: GOLD, fontSize: 36, textAlign: 'center', marginVertical: 14, fontFamily: MONO }}>{sym.glyph}</Text>
                            {sym.spL !== '—' && <Text style={{ color: DIM + 'CC', fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 8, fontFamily: MONO }}>spoken: /{sym.spL}/</Text>}
                            <Text style={{ color: TXT, fontSize: 12, lineHeight: 20, marginBottom: 12 }}>{sym.meaning}</Text>
                            {!mastered && (
                              <TouchableOpacity onPress={() => markMastered(sym.id)}
                                style={{ alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: GRN + '55', backgroundColor: GRN + '11' }}>
                                <Text style={{ color: GRN, fontSize: 11, fontFamily: MONO, fontWeight: '700' }}>◆ MARK MASTERED</Text>
                              </TouchableOpacity>
                            )}
                            {mastered && (
                              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: GRN + '18', borderWidth: 1, borderColor: GRN + '44' }}>
                                <Text style={{ color: GRN, fontSize: 11, fontFamily: MONO, fontWeight: '700' }}>◆ MASTERED</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* ── LESSONS ── */}
          {lamagueSection === 'lessons' && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: DIM, fontSize: 11, fontFamily: MONO, letterSpacing: 2, marginBottom: 14 }}>5 CLASSES · 40 PRIMITIVES</Text>
              {LM_LESSONS.map(lesson => {
                const read = lamagueProgress.lessonsRead.includes(lesson.id);
                const lessonSymbols = LAMAGUE_SYMBOLS.filter(s => lesson.symbols.includes(s.id));
                const masteredInLesson = lessonSymbols.filter(s => lamagueProgress.masteredSymbols.includes(s.id)).length;
                return (
                  <View key={lesson.id} style={{ backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: read ? GOLD + '33' : BRDR, marginBottom: 12, padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <Text style={{ color: GOLD, fontSize: 13, fontFamily: MONO, fontWeight: '700', flex: 1 }}>{lesson.title}</Text>
                      {read && <Text style={{ color: GOLD, fontSize: 13 }}>✦</Text>}
                    </View>
                    <Text style={{ color: TXT, fontSize: 12, lineHeight: 20, marginBottom: 10 }}>{lesson.desc}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {lessonSymbols.map(s => (
                        <View key={s.id} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: lamagueProgress.masteredSymbols.includes(s.id) ? GRN + '44' : BRDR, backgroundColor: lamagueProgress.masteredSymbols.includes(s.id) ? GRN + '11' : 'transparent' }}>
                          <Text style={{ color: lamagueProgress.masteredSymbols.includes(s.id) ? GRN : DIM, fontSize: 12, fontFamily: MONO }}>{s.glyph}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: DIM, fontSize: 10, fontFamily: MONO }}>{masteredInLesson}/{lessonSymbols.length} mastered</Text>
                      {!read && (
                        <TouchableOpacity onPress={async () => {
                          const next = { ...lamagueProgress, lessonsRead: [...lamagueProgress.lessonsRead, lesson.id] };
                          await saveLamagueProg(next);
                          showGlyphCeremony(lessonSymbols.map(s => s.glyph), lesson.title);
                        }} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: GOLD + '44', backgroundColor: GOLD + '0D' }}>
                          <Text style={{ color: GOLD, fontSize: 11, fontFamily: MONO, fontWeight: '700' }}>MARK READ ✓</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── DRILLS ── */}
          {lamagueSection === 'drills' && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              {/* Streak + mastery header */}
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 18 }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: drillStreak >= 3 ? GRN : GOLD, fontSize: drillStreak >= 3 ? 22 : 18, fontFamily: MONO, fontWeight: '700' }}>{drillStreak}</Text>
                  <Text style={{ color: DIM, fontSize: 8, fontFamily: MONO, letterSpacing: 1.5 }}>STREAK</Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: BRDR }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: GOLD, fontSize: 18, fontFamily: MONO, fontWeight: '700' }}>{masteredCount}/{LAMAGUE_SYMBOLS.length}</Text>
                  <Text style={{ color: DIM, fontSize: 8, fontFamily: MONO, letterSpacing: 1.5 }}>MASTERED</Text>
                </View>
              </View>
              {drillCard ? (
                <View style={{ width: '100%', maxWidth: 340 }}>
                  {/* Glyph card */}
                  <View style={{ backgroundColor: CARD, borderRadius: 16, borderWidth: 1, borderColor: BRDR, padding: 32, alignItems: 'center', marginBottom: 24 }}>
                    <Text style={{ color: GOLD, fontSize: 52, fontFamily: MONO, marginBottom: 12 }}>{drillCard.glyph}</Text>
                    {/* Progress dots — how close to mastery for this symbol */}
                    {(() => {
                      const sc = lamagueProgress.drillScores[drillCard.id] ?? 0;
                      const mastered = lamagueProgress.masteredSymbols.includes(drillCard.id);
                      return (
                        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                          {[0,1,2].map(i => (
                            <Text key={i} style={{ color: mastered || i < sc ? GRN : DIM, fontSize: 14 }}>{mastered || i < sc ? '◆' : '◇'}</Text>
                          ))}
                        </View>
                      );
                    })()}
                    <Text style={{ color: DIM, fontSize: 11, fontFamily: MONO, letterSpacing: 2 }}>WHAT IS THIS SYMBOL?</Text>
                    {drillResult && (
                      <Text style={{ color: drillResult === 'correct' ? GRN : '#DD4444', fontSize: 13, fontFamily: MONO, fontWeight: '700', marginTop: 12 }}>
                        {drillResult === 'correct' ? '◆ CORRECT — ' + drillCard.name : '✕ WRONG — ' + drillCard.name}
                      </Text>
                    )}
                  </View>
                  {/* Options */}
                  <View style={{ gap: 10 }}>
                    {drillCard.options.map((opt, i) => {
                      const isAnswer = opt === drillCard.answer;
                      const picked = drillResult !== null;
                      const bg = !picked ? CARD : isAnswer ? GRN + '18' : '#DD444411';
                      const border = !picked ? BRDR : isAnswer ? GRN + '55' : '#DD444455';
                      const txt = !picked ? TXT : isAnswer ? GRN : '#DD4444';
                      return (
                        <TouchableOpacity key={i} onPress={() => handleDrillAnswer(opt)} disabled={!!drillResult}
                          style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: border, backgroundColor: bg }}>
                          <Text style={{ color: txt, fontSize: 13, fontFamily: MONO, fontWeight: '700', textAlign: 'center' }}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {drillResult && (
                    <TouchableOpacity onPress={nextDrillCard} style={{ marginTop: 18, alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: GOLD + '44', backgroundColor: GOLD + '11' }}>
                      <Text style={{ color: GOLD, fontSize: 13, fontFamily: MONO, fontWeight: '700' }}>NEXT ›</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity onPress={nextDrillCard} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: GOLD + '44', backgroundColor: GOLD + '11' }}>
                  <Text style={{ color: GOLD, fontSize: 14, fontFamily: MONO, fontWeight: '700' }}>BEGIN DRILLS</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── PROGRESS ── */}
          {lamagueSection === 'progress' && (() => {
            const byClassProgress = ['I','D','F','M','C','T','R','G'].map(cls => {
              const syms = LAMAGUE_SYMBOLS.filter(s => s.cls === cls);
              const mastered = syms.filter(s => lamagueProgress.masteredSymbols.includes(s.id)).length;
              return { cls, total: syms.length, mastered };
            }).filter(g => g.total > 0);

            const inProgress = LAMAGUE_SYMBOLS.filter(s =>
              !lamagueProgress.masteredSymbols.includes(s.id) &&
              (lamagueProgress.drillScores[s.id] ?? 0) > 0
            ).sort((a, b) => (lamagueProgress.drillScores[b.id] ?? 0) - (lamagueProgress.drillScores[a.id] ?? 0));

            const unstarted = LAMAGUE_SYMBOLS.filter(s =>
              !lamagueProgress.masteredSymbols.includes(s.id) &&
              (lamagueProgress.drillScores[s.id] ?? 0) === 0
            );

            return (
              <View style={{ padding: 16 }}>
                {/* Overall bar */}
                <View style={{ backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BRDR, padding: 18, marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                    <Text style={{ color: GOLD, fontSize: 13, fontFamily: MONO, fontWeight: '700', letterSpacing: 2 }}>OVERALL MASTERY</Text>
                    <Text style={{ color: GOLD, fontSize: 22, fontFamily: MONO, fontWeight: '700' }}>{masteryPct}%</Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: BRDR, borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ width: `${masteryPct}%`, height: 6, backgroundColor: GRN, borderRadius: 3 }} />
                  </View>
                  <Text style={{ color: DIM, fontSize: 10, fontFamily: MONO, marginTop: 8 }}>{masteredCount} of {LAMAGUE_SYMBOLS.length} symbols mastered</Text>
                </View>

                {/* Per-class breakdown */}
                <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 10 }}>BY CLASS</Text>
                {byClassProgress.map(({ cls, total, mastered: m }) => {
                  const pct = total > 0 ? Math.round((m / total) * 100) : 0;
                  const barCol = pct === 100 ? GRN : pct > 0 ? GOLD : BRDR;
                  return (
                    <View key={cls} style={{ marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: pct === 100 ? GRN : TXT, fontSize: 11, fontFamily: MONO, fontWeight: '700' }}>{cls} · {LM_CLASS_NAMES[cls]}</Text>
                        <Text style={{ color: pct === 100 ? GRN : GOLD, fontSize: 11, fontFamily: MONO }}>{m}/{total}</Text>
                      </View>
                      <View style={{ height: 4, backgroundColor: BRDR, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%`, height: 4, backgroundColor: barCol, borderRadius: 2 }} />
                      </View>
                    </View>
                  );
                })}

                {/* In progress — closest to mastery */}
                {inProgress.length > 0 && (
                  <View style={{ marginTop: 18 }}>
                    <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 10 }}>CLOSEST TO MASTERY</Text>
                    {inProgress.slice(0, 5).map(s => {
                      const sc = lamagueProgress.drillScores[s.id] ?? 0;
                      return (
                        <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BRDR, padding: 10, marginBottom: 6 }}>
                          <Text style={{ color: GOLD, fontSize: 22, fontFamily: MONO, width: 40 }}>{s.glyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: TXT, fontSize: 11, fontFamily: MONO, fontWeight: '700' }}>{s.name}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            {[0,1,2].map(i => (
                              <Text key={i} style={{ color: i < sc ? GRN : DIM, fontSize: 12 }}>{i < sc ? '◆' : '◇'}</Text>
                            ))}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Next up */}
                {unstarted.length > 0 && (
                  <View style={{ marginTop: 18 }}>
                    <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 10 }}>NOT YET STARTED ({unstarted.length})</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {unstarted.slice(0, 12).map(s => (
                        <View key={s.id} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: BRDR, backgroundColor: CARD }}>
                          <Text style={{ color: DIM, fontSize: 16, fontFamily: MONO }}>{s.glyph}</Text>
                        </View>
                      ))}
                      {unstarted.length > 12 && <Text style={{ color: DIM, fontSize: 10, fontFamily: MONO, alignSelf: 'center' }}>+{unstarted.length - 12} more</Text>}
                    </View>
                  </View>
                )}

                {masteredCount === LAMAGUE_SYMBOLS.length && (
                  <View style={{ alignItems: 'center', marginTop: 24, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: GRN + '44', backgroundColor: GRN + '0A' }}>
                    <Text style={{ color: GRN, fontSize: 28, fontFamily: MONO, marginBottom: 8 }}>◆</Text>
                    <Text style={{ color: GRN, fontSize: 13, fontFamily: MONO, fontWeight: '700', letterSpacing: 2 }}>LAMAGUE MASTERED</Text>
                    <Text style={{ color: DIM, fontSize: 10, fontFamily: MONO, marginTop: 6 }}>All {LAMAGUE_SYMBOLS.length} primitives held.</Text>
                  </View>
                )}
              </View>
            );
          })()}

          {/* ── SYMBOL FORGE ── */}
          {lamagueSection === 'forge' && (
            <View style={{ padding: 16 }}>
              {/* Header */}
              <View style={{ alignItems: 'center', marginBottom: 20, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: GOLD + '44', backgroundColor: GOLD + '08', overflow: 'hidden' }}>
                <Text style={{ position: 'absolute', fontSize: 96, color: GOLD + '08', fontFamily: MONO, top: -8 }}>⟟</Text>
                <Text style={{ color: GOLD, fontSize: 28, fontFamily: MONO, marginBottom: 4 }}>⟟</Text>
                <Text style={{ color: GOLD, fontSize: 13, fontWeight: '700', letterSpacing: 3, fontFamily: MONO }}>WITCHAIL FORGE</Text>
                <Text style={{ color: DIM, fontSize: 10, fontFamily: MONO, letterSpacing: 1, marginTop: 4 }}>forge a new LAMAGUE primitive · assign any glyph a meaning the grammar doesn't hold yet</Text>
              </View>

              {/* Glyph + Name row */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={{ width: 90 }}>
                  <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 1.5, marginBottom: 6 }}>GLYPH</Text>
                  {/* TYPE / DESCRIBE toggle */}
                  <View style={{ flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: GOLD + '33', overflow: 'hidden', marginBottom: 6 }}>
                    {(['type', 'describe'] as const).map(m => (
                      <TouchableOpacity key={m} onPress={() => { setForgeGlyphMode(m); setForgeGlyphImage(null); }}
                        style={{ flex: 1, paddingVertical: 4, alignItems: 'center', backgroundColor: forgeGlyphMode === m ? GOLD + '22' : 'transparent' }}>
                        <Text style={{ color: forgeGlyphMode === m ? GOLD : DIM, fontSize: 8, fontFamily: MONO, fontWeight: '700' }}>{m === 'type' ? 'TYPE' : 'DRAW'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {forgeGlyphMode === 'type' ? (
                    <>
                      <TextInput
                        value={forgeGlyph}
                        onChangeText={t => { setForgeGlyph(t.slice(0, 3)); setForgeGlyphImage(null); }}
                        placeholder="⊛"
                        placeholderTextColor={GOLD + '33'}
                        style={{ backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: GOLD + '44', color: GOLD, fontSize: 28, textAlign: 'center', paddingVertical: 6, fontFamily: MONO, height: 52 }}
                        maxLength={3}
                      />
                      <Text style={{ color: GOLD + '44', fontSize: 7, fontFamily: MONO, textAlign: 'center', marginTop: 3 }}>any symbol · emoji</Text>
                    </>
                  ) : (
                    <View>
                      <TextInput
                        value={forgeGlyphDesc}
                        onChangeText={setForgeGlyphDesc}
                        placeholder="a spiral inside a broken diamond..."
                        placeholderTextColor={DIM + '66'}
                        multiline
                        style={{ backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: GOLD + '44', color: TXT, fontSize: 10, padding: 8, minHeight: 52, textAlignVertical: 'top' }}
                      />
                      <TouchableOpacity onPress={generateGlyphImage} disabled={!forgeGlyphDesc.trim() || forgeGlyphImgLoading}
                        style={{ marginTop: 6, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
                          borderColor: forgeGlyphDesc.trim() && !forgeGlyphImgLoading ? GOLD + '88' : BRDR,
                          backgroundColor: forgeGlyphDesc.trim() && !forgeGlyphImgLoading ? GOLD + '18' : 'transparent',
                          alignItems: 'center' }}>
                        <Text style={{ color: forgeGlyphDesc.trim() && !forgeGlyphImgLoading ? GOLD : DIM, fontSize: 9, fontFamily: MONO, fontWeight: '700' }}>
                          {forgeGlyphImgLoading ? '· generating ·' : '⟟ GENERATE'}
                        </Text>
                      </TouchableOpacity>
                      {forgeGlyphImage && (
                        <View style={{ alignItems: 'center', gap: 6 }}>
                          <Image source={{ uri: forgeGlyphImage }} style={{ width: 90, height: 90, borderRadius: 10, marginTop: 6, borderWidth: 1, borderColor: GOLD + '44' }} />
                          <TouchableOpacity onPress={async () => {
                            const r = await saveImageToDevice(forgeGlyphImage);
                            if (!r.ok) Alert.alert('Save failed', r.error ?? 'Unknown error');
                          }} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: GOLD + '44', backgroundColor: GOLD + '0D' }}>
                            <Text style={{ color: GOLD, fontSize: 9, fontFamily: MONO, letterSpacing: 1 }}>↓ SAVE TO GALLERY</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 1.5, marginBottom: 6 }}>NAME</Text>
                  <TextInput
                    value={forgeName}
                    onChangeText={setForgeName}
                    placeholder="e.g. THRESHOLD LOCK"
                    placeholderTextColor={DIM + '66'}
                    style={{ backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BRDR, color: TXT, fontSize: 13, fontFamily: MONO, paddingHorizontal: 12, paddingVertical: 10, height: 56, letterSpacing: 1 }}
                    maxLength={32}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Class picker */}
              <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 1.5, marginBottom: 6 }}>CLASS</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {([
                  { id: 'I', label: 'I · INVARIANT', desc: 'anchors that never move' },
                  { id: 'D', label: 'D · DYNAMIC', desc: 'operators of change' },
                  { id: 'F', label: 'F · FIELD', desc: 'measurement & state' },
                  { id: 'M', label: 'M · META', desc: 'compression & connection' },
                  { id: 'G', label: 'G · GROUND', desc: 'abstract → concrete' },
                ] as const).map(cls => (
                  <TouchableOpacity key={cls.id} onPress={() => setForgeClass(cls.id)}
                    style={{ flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, borderWidth: 1,
                      borderColor: forgeClass === cls.id ? GOLD + 'AA' : BRDR,
                      backgroundColor: forgeClass === cls.id ? GOLD + '18' : CARD }}>
                    <Text style={{ color: forgeClass === cls.id ? GOLD : DIM, fontSize: 13, fontFamily: MONO, fontWeight: '700' }}>{cls.id}</Text>
                    <Text style={{ color: forgeClass === cls.id ? GOLD + 'AA' : DIM + '88', fontSize: 7, fontFamily: MONO, letterSpacing: 0.5, marginTop: 2, textAlign: 'center' }}>{cls.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meaning */}
              <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 1.5, marginBottom: 6 }}>MEANING — what does this symbol encode?</Text>
              <TextInput
                value={forgeMeaning}
                onChangeText={setForgeMeaning}
                placeholder="Describe the concept this primitive names — what it captures that no existing symbol does."
                placeholderTextColor={DIM + '55'}
                style={{ backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BRDR, color: TXT, fontSize: 12, paddingHorizontal: 12, paddingVertical: 12, minHeight: 80, textAlignVertical: 'top', lineHeight: 19, marginBottom: 12 }}
                multiline
                maxLength={400}
              />

              {/* Usage */}
              <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 1.5, marginBottom: 6 }}>USAGE EXAMPLE — show it in a LAMAGUE expression</Text>
              <TextInput
                value={forgeUsage}
                onChangeText={setForgeUsage}
                placeholder="e.g. ⊛ → ∈ ⊞  (this primitive leads into closure)"
                placeholderTextColor={DIM + '55'}
                style={{ backgroundColor: CARD, borderRadius: 10, borderWidth: 1, borderColor: BRDR, color: TXT, fontSize: 12, fontFamily: MONO, paddingHorizontal: 12, paddingVertical: 12, minHeight: 48, marginBottom: 16 }}
                multiline
                maxLength={200}
              />

              {/* Submit */}
              <TouchableOpacity
                onPress={submitToForge}
                disabled={!forgeGlyph.trim() || !forgeName.trim() || !forgeMeaning.trim() || forgeLoading}
                style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
                  borderColor: forgeGlyph.trim() && forgeName.trim() && forgeMeaning.trim() && !forgeLoading ? GOLD : BRDR,
                  backgroundColor: forgeGlyph.trim() && forgeName.trim() && forgeMeaning.trim() && !forgeLoading ? GOLD + '22' : CARD,
                  alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: forgeGlyph.trim() && forgeName.trim() && forgeMeaning.trim() && !forgeLoading ? GOLD : DIM,
                  fontSize: 12, fontWeight: '700', letterSpacing: 3, fontFamily: MONO }}>
                  {forgeLoading ? '·  ·  ·  THE ORACLE WEIGHS  ·  ·  ·' : '⟟  SUBMIT TO THE FORGE'}
                </Text>
              </TouchableOpacity>

              {/* Verdict */}
              {forgeVerdict && (
                <View style={{ borderRadius: 14, borderWidth: 1.5,
                  borderColor: forgeVerdict.verdict === 'RATIFIED' ? GRN : forgeVerdict.verdict === 'REJECTED' ? '#FF4444' : GOLD,
                  backgroundColor: forgeVerdict.verdict === 'RATIFIED' ? GRN + '10' : forgeVerdict.verdict === 'REJECTED' ? '#FF444410' : GOLD + '10',
                  padding: 16, marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Text style={{ fontSize: 22 }}>
                      {forgeVerdict.verdict === 'RATIFIED' ? '✦' : forgeVerdict.verdict === 'REJECTED' ? '✕' : '◈'}
                    </Text>
                    <Text style={{ color: forgeVerdict.verdict === 'RATIFIED' ? GRN : forgeVerdict.verdict === 'REJECTED' ? '#FF4444' : GOLD,
                      fontSize: 14, fontWeight: '700', letterSpacing: 2, fontFamily: MONO }}>
                      {forgeVerdict.verdict}
                    </Text>
                  </View>
                  <Text style={{ color: TXT, fontSize: 13, lineHeight: 21, fontStyle: 'italic', marginBottom: forgeVerdict.compression ? 10 : 0 }}>
                    {forgeVerdict.reasoning}
                  </Text>
                  {forgeVerdict.verdict === 'RATIFIED' && forgeVerdict.compression ? (
                    <View style={{ paddingTop: 10, borderTopWidth: 1, borderTopColor: GRN + '33' }}>
                      <Text style={{ color: DIM, fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>Z₁ COMPRESSION</Text>
                      <Text style={{ color: GRN, fontSize: 12, fontFamily: MONO, fontStyle: 'italic' }}>{forgeVerdict.compression}</Text>
                    </View>
                  ) : null}
                  {forgeVerdict.verdict === 'RATIFIED' && (
                    <TouchableOpacity onPress={() => { setForgeGlyph(''); setForgeName(''); setForgeMeaning(''); setForgeUsage(''); setForgeVerdict(null); }}
                      style={{ marginTop: 12, alignSelf: 'center' }}>
                      <Text style={{ color: GRN + '88', fontSize: 10, fontFamily: MONO, letterSpacing: 1.5 }}>⟟ forge another</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Personal Lexicon */}
              {forgeLexicon.length > 0 && (
                <View style={{ borderRadius: 14, borderWidth: 1, borderColor: GOLD + '33', backgroundColor: CARD, overflow: 'hidden' }}>
                  <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BRDR }}>
                    <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 2, fontFamily: MONO }}>YOUR LEXICON — {forgeLexicon.length} RATIFIED</Text>
                  </View>
                  {forgeLexicon.map((sym, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12,
                      borderBottomWidth: i < forgeLexicon.length - 1 ? 1 : 0, borderBottomColor: BRDR }}>
                      <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: GOLD + '18', borderWidth: 1, borderColor: GOLD + '44', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {sym.glyphImage
                          ? <Image source={{ uri: sym.glyphImage }} style={{ width: 44, height: 44, borderRadius: 10 }} />
                          : <Text style={{ color: GOLD, fontSize: 20, fontFamily: MONO }}>{sym.glyph}</Text>}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <Text style={{ color: TXT, fontSize: 12, fontWeight: '700', fontFamily: MONO, letterSpacing: 1 }}>{sym.name}</Text>
                          <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: GOLD + '22', borderWidth: 0.5, borderColor: GOLD + '55' }}>
                            <Text style={{ color: GOLD, fontSize: 8, fontFamily: MONO, fontWeight: '700' }}>{sym.cls}</Text>
                          </View>
                        </View>
                        {sym.verdict ? (
                          <Text style={{ color: GRN + 'CC', fontSize: 10, fontFamily: MONO, fontStyle: 'italic', marginBottom: 2 }}>{sym.verdict}</Text>
                        ) : null}
                        <Text style={{ color: DIM, fontSize: 11, lineHeight: 17 }} numberOfLines={2}>{sym.meaning}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {lamagueSection === 'progress' && (
            <View style={{ padding: 20 }}>
              {/* Mastery ring */}
              <View style={{ alignItems: 'center', marginBottom: 28 }}>
                <Text style={{ color: GOLD, fontSize: 48, fontFamily: MONO, fontWeight: '700' }}>{masteryPct}%</Text>
                <Text style={{ color: DIM, fontSize: 12, fontFamily: MONO, letterSpacing: 2 }}>MASTERY</Text>
                <View style={{ width: 200, height: 4, backgroundColor: BRDR, borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                  <View style={{ width: `${masteryPct}%` as any, height: 4, backgroundColor: GOLD, borderRadius: 2 }} />
                </View>
                <Text style={{ color: TXT, fontSize: 12, marginTop: 8 }}>{masteredCount} / {LAMAGUE_SYMBOLS.length} symbols mastered</Text>
              </View>

              {/* Lessons */}
              <View style={{ backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BRDR, padding: 16, marginBottom: 12 }}>
                <Text style={{ color: GOLD, fontFamily: MONO, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>LESSONS READ</Text>
                {LM_LESSONS.map(l => (
                  <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Text style={{ color: lamagueProgress.lessonsRead.includes(l.id) ? GRN : DIM, fontSize: 14 }}>{lamagueProgress.lessonsRead.includes(l.id) ? '◆' : '○'}</Text>
                    <Text style={{ color: lamagueProgress.lessonsRead.includes(l.id) ? TXT : DIM, fontSize: 12, fontFamily: MONO }}>{l.title}</Text>
                  </View>
                ))}
              </View>

              {/* Per-class mastery */}
              <View style={{ backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BRDR, padding: 16 }}>
                <Text style={{ color: GOLD, fontFamily: MONO, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>BY CLASS</Text>
                {['I','D','F','M','C','T','R','G'].map(cls => {
                  const clsSyms = LAMAGUE_SYMBOLS.filter(s => s.cls === cls);
                  const clsMastered = clsSyms.filter(s => lamagueProgress.masteredSymbols.includes(s.id)).length;
                  const pct = Math.round((clsMastered / clsSyms.length) * 100);
                  return (
                    <View key={cls} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ color: TXT, fontSize: 11, fontFamily: MONO }}>{cls}-CLASS · {LM_CLASS_NAMES[cls]}</Text>
                        <Text style={{ color: clsMastered === clsSyms.length ? GRN : DIM, fontSize: 11, fontFamily: MONO }}>{clsMastered}/{clsSyms.length}</Text>
                      </View>
                      <View style={{ height: 3, backgroundColor: BRDR, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ width: `${pct}%` as any, height: 3, backgroundColor: clsMastered === clsSyms.length ? GRN : GOLD, borderRadius: 2 }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

        </ScrollView>

        {/* Bottom status bar */}
        <View style={{ height: 36, backgroundColor: CARD, borderTopWidth: 1, borderTopColor: BRDR, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: GOLD, fontSize: 10, fontFamily: MONO, letterSpacing: 1 }}>◈ {masteredCount} / {LAMAGUE_SYMBOLS.length} SYMBOLS MASTERED</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── RENDER: SCRIPTORIUM ─────────────────────────────────────────────────────

  if (schoolView === 'scriptorium') {
    const SMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const SC = '#C8A96E';

    const saveEntry = async (entry: ScriptoriumEntry) => {
      const updated = scriptorium.some(e => e.id === entry.id)
        ? scriptorium.map(e => e.id === entry.id ? entry : e)
        : [entry, ...scriptorium];
      setScriptorium(updated);
      await AsyncStorage.setItem('sol_scriptorium', JSON.stringify(updated));
    };

    const deleteEntry = async (id: string) => {
      Alert.alert('Delete entry?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = scriptorium.filter(e => e.id !== id);
          setScriptorium(updated);
          await AsyncStorage.setItem('sol_scriptorium', JSON.stringify(updated));
          setScriptoriumView('list');
        }},
      ]);
    };

    if (scriptoriumView === 'edit' && scriptoriumEntry) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#06050A' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: SC + '22' }}>
              <TouchableOpacity onPress={async () => {
                if (scriptoriumEntry.body.trim() || scriptoriumEntry.title.trim()) await saveEntry({ ...scriptoriumEntry, updatedAt: new Date().toISOString() });
                setScriptoriumView('list');
              }} style={{ padding: 4 }}>
                <Text style={{ color: SC, fontSize: 20 }}>←</Text>
              </TouchableOpacity>
              <TextInput
                value={scriptoriumEntry.title}
                onChangeText={t => setScriptoriumEntry(e => e ? { ...e, title: t } : e)}
                placeholder="Title…"
                placeholderTextColor={SC + '44'}
                style={{ flex: 1, color: SOL_THEME.text, fontSize: 16, fontWeight: '700' }}
              />
              <TouchableOpacity onPress={() => deleteEntry(scriptoriumEntry.id)}>
                <Text style={{ color: '#E05050', fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
              <Text style={{ color: SC + '66', fontSize: 9, fontFamily: SMONO, letterSpacing: 2, marginBottom: 12 }}>
                {new Date(scriptoriumEntry.createdAt).toLocaleDateString()} · {scriptorium.filter(e => e.id !== scriptoriumEntry.id).length + 1} entries
              </Text>
              <TextInput
                value={scriptoriumEntry.body}
                onChangeText={b => setScriptoriumEntry(e => e ? { ...e, body: b } : e)}
                multiline
                placeholder="Write here. This is yours."
                placeholderTextColor={SOL_THEME.textMuted}
                style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 24, textAlignVertical: 'top', minHeight: 400 }}
                autoFocus={!scriptoriumEntry.title && !scriptoriumEntry.body}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    const filtered = scriptoriumSearch.trim()
      ? scriptorium.filter(e => e.title.toLowerCase().includes(scriptoriumSearch.toLowerCase()) || e.body.toLowerCase().includes(scriptoriumSearch.toLowerCase()))
      : scriptorium;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#06050A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: SC + '22' }}>
          <TouchableOpacity onPress={() => { setSchoolView('home'); setScriptoriumSearch(''); }} style={{ padding: 4 }}>
            <Text style={{ color: SC, fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: SC, fontSize: 9, fontFamily: SMONO, letterSpacing: 3, fontWeight: '700' }}>✦ THE SCRIPTORIUM</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>Your Grimoire</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              const entry: ScriptoriumEntry = { id: Date.now().toString(), title: '', body: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
              setScriptoriumEntry(entry);
              setScriptoriumView('edit');
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: SC + '55', backgroundColor: SC + '11' }}
          >
            <Text style={{ color: SC, fontSize: 12, fontWeight: '700' }}>+ New</Text>
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: SC + '11' }}>
          <TextInput
            value={scriptoriumSearch}
            onChangeText={setScriptoriumSearch}
            placeholder="Search your grimoire…"
            placeholderTextColor={SOL_THEME.textMuted}
            style={{ color: SOL_THEME.text, fontSize: 13, backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SC + '22', paddingHorizontal: 12, paddingVertical: 8 }}
          />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 40, color: SC + '44', marginBottom: 16 }}>✦</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                {scriptorium.length === 0
                  ? 'The grimoire is empty.\nWrite your first teaching.'
                  : 'No entries match your search.'}
              </Text>
            </View>
          ) : filtered.map(entry => (
            <TouchableOpacity
              key={entry.id}
              onPress={() => { setScriptoriumEntry(entry); setScriptoriumView('edit'); }}
              style={{ marginBottom: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: SC + '33', backgroundColor: SC + '06' }}
              activeOpacity={0.8}
            >
              <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', marginBottom: 4 }} numberOfLines={1}>
                {entry.title || 'Untitled'}
              </Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }} numberOfLines={2}>{entry.body}</Text>
              <Text style={{ color: SC + '66', fontSize: 9, fontFamily: SMONO, marginTop: 8, letterSpacing: 1 }}>{new Date(entry.updatedAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: TIME BRAIDING ────────────────────────────────────────────────────

  if (schoolView === 'time-braiding') {
    const TMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const TC = '#4ECDC4';

    const saveLetter = async (letter: TimeLetter) => {
      const updated = [letter, ...timeLetters];
      setTimeLetters(updated);
      await AsyncStorage.setItem('sol_time_braiding', JSON.stringify(updated));
    };

    const openLetter = async (letter: TimeLetter) => {
      const updated = timeLetters.map(l => l.id === letter.id ? { ...l, opened: true } : l);
      setTimeLetters(updated);
      setTimeBraidDue(timeBraidDue.filter(l => l.id !== letter.id));
      await AsyncStorage.setItem('sol_time_braiding', JSON.stringify(updated));
      setTimeBraidReading({ ...letter, opened: true });
      setTimeBraidView('read');
    };

    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (timeBraidView === 'read' && timeBraidReading) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#05060E' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: TC + '22' }}>
            <TouchableOpacity onPress={() => { setTimeBraidView('list'); setTimeBraidReading(null); }} style={{ padding: 4 }}>
              <Text style={{ color: TC, fontSize: 20 }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: TC, fontSize: 9, fontFamily: TMONO, letterSpacing: 3, fontWeight: '700' }}>◎ A LETTER FROM PAST YOU</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>Written {new Date(timeBraidReading.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80 }}>
            <Text style={{ color: TC + '55', fontSize: 13, fontStyle: 'italic', marginBottom: 20, lineHeight: 20 }}>
              You wrote this to yourself on {new Date(timeBraidReading.createdAt).toLocaleDateString()}. It arrived today.
            </Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 15, lineHeight: 26 }}>{timeBraidReading.body}</Text>
          </ScrollView>
        </SafeAreaView>
      );
    }

    if (timeBraidView === 'write') {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#05060E' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: TC + '22' }}>
              <TouchableOpacity onPress={() => { setTimeBraidView('list'); setTimeBraidDraft(''); setTimeBraidDate(''); }} style={{ padding: 4 }}>
                <Text style={{ color: TC, fontSize: 20 }}>←</Text>
              </TouchableOpacity>
              <Text style={{ flex: 1, color: SOL_THEME.text, fontSize: 15, fontWeight: '700' }}>
                {timeBraidDirection === 'future' ? 'Write to future you' : 'Write from past you'}
              </Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
              {/* Direction toggle */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {(['future', 'past'] as const).map(dir => (
                  <TouchableOpacity
                    key={dir}
                    onPress={() => setTimeBraidDirection(dir)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: timeBraidDirection === dir ? TC : TC + '33', backgroundColor: timeBraidDirection === dir ? TC + '15' : 'transparent', alignItems: 'center' }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: timeBraidDirection === dir ? TC : SOL_THEME.textMuted, fontWeight: '700', fontSize: 12 }}>
                      {dir === 'future' ? '→ To Future Me' : '← From Past Me'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Deliver date — only for future letters */}
              {timeBraidDirection === 'future' && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: TC, fontSize: 10, fontFamily: TMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>DELIVER ON (YYYY-MM-DD)</Text>
                  <TextInput
                    value={timeBraidDate}
                    onChangeText={setTimeBraidDate}
                    placeholder={minDate}
                    placeholderTextColor={SOL_THEME.textMuted}
                    style={{ color: SOL_THEME.text, fontSize: 14, backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: TC + '33', paddingHorizontal: 12, paddingVertical: 10, fontFamily: TMONO }}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Body */}
              <Text style={{ color: TC, fontSize: 10, fontFamily: TMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>YOUR LETTER</Text>
              <TextInput
                value={timeBraidDraft}
                onChangeText={setTimeBraidDraft}
                multiline
                placeholder={timeBraidDirection === 'future'
                  ? "Dear future me,\n\nHere is what I want you to remember…"
                  : "I am writing this as if from the past — what I wish I had known, what I want to honour…"}
                placeholderTextColor={SOL_THEME.textMuted}
                style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 24, textAlignVertical: 'top', minHeight: 300, backgroundColor: SOL_THEME.surface, borderRadius: 12, borderWidth: 1, borderColor: TC + '22', padding: 14 }}
              />

              <TouchableOpacity
                onPress={async () => {
                  if (!timeBraidDraft.trim()) return;
                  if (timeBraidDirection === 'future' && !timeBraidDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    Alert.alert('Date needed', 'Enter a delivery date in YYYY-MM-DD format.'); return;
                  }
                  const letter: TimeLetter = {
                    id: Date.now().toString(),
                    body: timeBraidDraft.trim(),
                    deliverAt: timeBraidDirection === 'future' ? `${timeBraidDate}T00:00:00.000Z` : new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    opened: timeBraidDirection === 'past',
                    direction: timeBraidDirection,
                  };
                  await saveLetter(letter);
                  setTimeBraidDraft(''); setTimeBraidDate('');
                  setTimeBraidView('list');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={{ marginTop: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: TC, backgroundColor: TC + '15', alignItems: 'center' }}
                activeOpacity={0.8}
              >
                <Text style={{ color: TC, fontWeight: '700', fontSize: 14 }}>
                  {timeBraidDirection === 'future' ? 'Seal and send →' : 'Record this letter'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    // List view
    const futureSealed = timeLetters.filter(l => l.direction === 'future' && !l.opened);
    const pastLetters = timeLetters.filter(l => l.direction === 'past');
    const openedLetters = timeLetters.filter(l => l.direction === 'future' && l.opened);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#05060E' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: TC + '22' }}>
          <TouchableOpacity onPress={() => setSchoolView('home')} style={{ padding: 4 }}>
            <Text style={{ color: TC, fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: TC, fontSize: 9, fontFamily: TMONO, letterSpacing: 3, fontWeight: '700' }}>◈ TIME BRAIDING</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>Letters Across Time</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setTimeBraidView('write'); setTimeBraidDraft(''); setTimeBraidDate(''); }}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: TC + '55', backgroundColor: TC + '11' }}
          >
            <Text style={{ color: TC, fontSize: 12, fontWeight: '700' }}>+ Write</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          {/* How-to note */}
          <View style={{ marginBottom: 16, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#4ECDC422', backgroundColor: '#4ECDC408' }}>
            <Text style={{ color: '#4ECDC4', fontSize: 11, lineHeight: 18, fontStyle: 'italic', textAlign: 'center' }}>
              Write a letter to your future self. Set the date it should arrive. Sol holds it sealed — you won't see it again until that day.
            </Text>
          </View>

          {/* Due letters banner */}
          {timeBraidDue.length > 0 && timeBraidDue.map(letter => (
            <TouchableOpacity
              key={letter.id}
              onPress={() => openLetter(letter)}
              style={{ marginBottom: 16, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: TC, backgroundColor: TC + '12' }}
              activeOpacity={0.8}
            >
              <Text style={{ color: TC, fontSize: 9, fontFamily: TMONO, letterSpacing: 3, fontWeight: '700', marginBottom: 8 }}>◎ A LETTER HAS ARRIVED</Text>
              <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>From you — {new Date(letter.createdAt).toLocaleDateString()}</Text>
              <Text style={{ color: TC, fontSize: 12, fontWeight: '700' }}>Tap to open →</Text>
            </TouchableOpacity>
          ))}

          {timeLetters.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 40, color: TC + '44', marginBottom: 16 }}>◈</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                {'No letters yet.\nWrite one to your future self — it will arrive on the date you set.'}
              </Text>
            </View>
          ) : (
            <>
              {futureSealed.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: TMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>◌ SEALED — AWAITING DELIVERY</Text>
                  {futureSealed.map(letter => (
                    <View key={letter.id} style={{ marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: TC + '33', backgroundColor: TC + '06', flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{letter.body.slice(0, 60)}…</Text>
                        <Text style={{ color: TC + '88', fontSize: 10, marginTop: 4, fontFamily: TMONO }}>Arrives {new Date(letter.deliverAt).toLocaleDateString()}</Text>
                      </View>
                      <Text style={{ color: TC + '66', fontSize: 18 }}>⌛</Text>
                    </View>
                  ))}
                </View>
              )}
              {openedLetters.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: TMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>✦ OPENED</Text>
                  {openedLetters.map(letter => (
                    <TouchableOpacity key={letter.id} onPress={() => { setTimeBraidReading(letter); setTimeBraidView('read'); }}
                      style={{ marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: TC + '22', backgroundColor: TC + '04' }}
                      activeOpacity={0.8}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }} numberOfLines={2}>{letter.body.slice(0, 80)}…</Text>
                      <Text style={{ color: TC + '66', fontSize: 9, fontFamily: TMONO, marginTop: 6 }}>Opened {new Date(letter.deliverAt).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {pastLetters.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: TMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>← FROM THE PAST</Text>
                  {pastLetters.map(letter => (
                    <TouchableOpacity key={letter.id} onPress={() => { setTimeBraidReading(letter); setTimeBraidView('read'); }}
                      style={{ marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#7B8CDE33', backgroundColor: '#7B8CDE06' }}
                      activeOpacity={0.8}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }} numberOfLines={2}>{letter.body.slice(0, 80)}…</Text>
                      <Text style={{ color: '#7B8CDE88', fontSize: 9, fontFamily: TMONO, marginTop: 6 }}>Recorded {new Date(letter.createdAt).toLocaleDateString()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: SIGIL (removed — Zodiac Sigil Forge is the single sigil home) ───

  if (false && schoolView === 'sigil') {
    const SIGMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const { Svg, Circle, Line, Text: SvgText, G } = require('react-native-svg');

    // Deterministic seed from user journey
    const totalDives = diveLog.length;
    const masteryCount = Object.keys(subjectMastery).length;
    const lamagueMastered = lamagueProgress.masteredSymbols.length;
    const cerComplete = ceremonyState?.history?.length ?? 0;
    const scriptCount = scriptorium.length;
    const seed = (totalDives * 7 + masteryCount * 13 + lamagueMastered * 3 + cerComplete * 17 + scriptCount * 5) || 1;

    // Generate sigil paths from seed
    const SIGIL_GLYPHS = ['⊚', '◈', '✦', '⊕', '◎', '∇', '⊙', '◌', '⟟', 'Ω'];
    const RING_GLYPHS = ['◦','·','∘','○','●'];
    const cx = 150; const cy = 150; const R = 90;
    const numPoints = 3 + (seed % 5); // 3-7 points
    const points = Array.from({ length: numPoints }, (_, i) => {
      const angle = (2 * Math.PI * i / numPoints) + (seed * 0.1);
      return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
    });
    const primaryGlyph = SIGIL_GLYPHS[seed % SIGIL_GLYPHS.length];
    const accentGlyph = SIGIL_GLYPHS[(seed * 3) % SIGIL_GLYPHS.length];
    const ringGlyph = RING_GLYPHS[seed % RING_GLYPHS.length];
    const hue1 = (seed * 47) % 360;
    const hue2 = (seed * 83) % 360;
    const color1 = `hsl(${hue1}, 70%, 60%)`;
    const color2 = `hsl(${hue2}, 60%, 50%)`;
    const innerR = 30 + (seed % 20);

    const spin = sigilRotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const pulseOpacity = sigilPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.0] });
    const pulseScale   = sigilPulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#04030A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#E8C76A22' }}>
          <TouchableOpacity onPress={() => setSchoolView('home')} style={{ padding: 4 }}>
            <Text style={{ color: '#E8C76A', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#E8C76A', fontSize: 9, fontFamily: SIGMONO, letterSpacing: 3, fontWeight: '700' }}>⊕ THE SIGIL</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>Your Living Glyph</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80, alignItems: 'center' }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 24 }}>
            Your sigil is composed from your journey — {totalDives} dives, {masteryCount} mastered subjects, {lamagueMastered} LAMAGUE symbols, {cerComplete} completed arcs. It updates as you grow.
          </Text>

          {/* Living SVG Sigil — two animated layers */}
          <View style={{ width: 300, height: 300, marginBottom: 24 }}>
            {/* Layer 1: outer geometry rotates slowly */}
            <Animated.View style={{ position: 'absolute', width: 300, height: 300, transform: [{ rotate: spin }] }}>
              <Svg width={300} height={300} viewBox="0 0 300 300">
                <Circle cx={cx} cy={cy} r={R + 20} stroke={color1} strokeWidth={0.5} fill="none" strokeOpacity={0.4} />
                <Circle cx={cx} cy={cy} r={R} stroke={color1} strokeWidth={1} fill="none" strokeOpacity={0.7} />
                {points.map((p, i) => {
                  const next = points[(i + 2) % points.length];
                  return <Line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke={color1} strokeWidth={1} strokeOpacity={0.6} />;
                })}
                {points.map((p, i) => (
                  <Circle key={i} cx={p.x} cy={p.y} r={3} fill={i === 0 ? color1 : color2} fillOpacity={0.8} />
                ))}
              </Svg>
            </Animated.View>
            {/* Layer 2: center glyph breathes */}
            <Animated.View style={{ position: 'absolute', width: 300, height: 300, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }}>
              <Svg width={300} height={300} viewBox="0 0 300 300">
                <Circle cx={cx} cy={cy} r={innerR} stroke={color2} strokeWidth={1} fill="none" strokeOpacity={0.5} />
                <SvgText x={cx} y={cy + 8} textAnchor="middle" fontSize={28} fill={color1} fillOpacity={0.9}>{primaryGlyph}</SvgText>
                <SvgText x={cx + innerR * 0.7} y={cy - innerR * 0.7} textAnchor="middle" fontSize={14} fill={color2} fillOpacity={0.6}>{accentGlyph}</SvgText>
              </Svg>
            </Animated.View>
          </View>

          {/* Journey stats */}
          <View style={{ width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8C76A22', backgroundColor: '#E8C76A06', marginBottom: 16 }}>
            <Text style={{ color: '#E8C76A', fontSize: 9, fontFamily: SIGMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>◎ SIGIL COMPONENTS</Text>
            {[
              { label: 'Dives', value: totalDives, glyph: '⊚' },
              { label: 'Mastered subjects', value: masteryCount, glyph: '✦' },
              { label: 'LAMAGUE symbols', value: lamagueMastered, glyph: '⟟' },
              { label: 'Completed arcs', value: cerComplete, glyph: '◌' },
              { label: 'Grimoire entries', value: scriptCount, glyph: '◈' },
            ].map(({ label, value, glyph }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#E8C76A88', fontSize: 14 }}>{glyph}</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>{label}</Text>
                </View>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700', fontFamily: SIGMONO }}>{value}</Text>
              </View>
            ))}
          </View>

          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 18, fontStyle: 'italic' }}>
            The sigil changes as your journey deepens. The geometry is determined by your work — it cannot be chosen or customised.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }


  // ─── RENDER: INITIATION RITE ────────────────────────────────────────────────

  if (schoolView === 'initiation' && initiationDomain) {
    const domain = initiationDomain;
    const IMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const existing = initiations[domain.id];
    const studiedHere = domain.subjects.filter(s => studiedSubjects.has(s.name));
    const isSealed = !!existing;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#04030A' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: domain.color + '33' }}>
            <TouchableOpacity onPress={() => { setSchoolView('domain'); }} style={{ padding: 4 }}>
              <Text style={{ color: domain.color, fontSize: 20 }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: domain.color, fontSize: 9, fontFamily: IMONO, letterSpacing: 3, fontWeight: '700' }}>✦ INITIATION RITE</Text>
              <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{t(domain.label)}</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 60, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
            {/* Domain glyph — large */}
            <Text style={{ color: domain.color, fontSize: 64, marginBottom: 8, lineHeight: 76 }}>{domain.glyph}</Text>
            <Text style={{ color: domain.color, fontSize: 10, fontFamily: IMONO, letterSpacing: 3, fontWeight: '700', marginBottom: 6 }}>
              {isSealed ? 'INITIATED' : 'THE SCROLL'}
            </Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 24 }}>
              {isSealed
                ? `Sealed ${existing.date}. All ${studiedHere.length} subjects completed.`
                : `You have studied all ${studiedHere.length} subjects in this domain. The scroll is complete.`}
            </Text>

            {/* Subject scroll */}
            <View style={{ width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: domain.color + '33', backgroundColor: domain.color + '06', marginBottom: 22 }}>
              <Text style={{ color: domain.color, fontSize: 9, fontFamily: IMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>SUBJECTS COMPLETED</Text>
              {studiedHere.map((s, i) => (
                <View key={s.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ color: domain.color, fontSize: 11 }}>✦</Text>
                  <Text style={{ color: SOL_THEME.text, fontSize: 13 }}>{s.name}</Text>
                  {subjectMastery[s.name] && (
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginLeft: 'auto' }}>
                      {MASTERY_STAGES[subjectMastery[s.name].stage]?.glyph ?? ''}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* The Address */}
            <View style={{ width: '100%', marginBottom: 22 }}>
              <Text style={{ color: domain.color, fontSize: 9, fontFamily: IMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>THE ADDRESS</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>
                What does this domain mean to you now that you have passed through it? Write in your own words — this is yours alone.
              </Text>
              {isSealed ? (
                <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '33', backgroundColor: domain.color + '06' }}>
                  <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>{existing.address || 'Sealed in silence.'}</Text>
                </View>
              ) : (
                <TextInput
                  style={{ backgroundColor: SOL_THEME.surface, color: SOL_THEME.text, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '44', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top', lineHeight: 22 }}
                  placeholder='Speak to the domain...'
                  placeholderTextColor={SOL_THEME.textMuted}
                  value={initiationAddress}
                  onChangeText={setInitiationAddress}
                  multiline
                />
              )}
            </View>

            {!isSealed && (
              <TouchableOpacity
                onPress={async () => {
                  const record = { address: initiationAddress.trim(), date: new Date().toLocaleDateString() };
                  const updated = { ...initiations, [domain.id]: record };
                  setInitiations(updated);
                  await AsyncStorage.setItem('sol_initiations', JSON.stringify(updated));
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={{ width: '100%', paddingVertical: 15, borderRadius: 12, backgroundColor: domain.color, alignItems: 'center' }}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>✦ Seal the Rite</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: WORLD MAP ───────────────────────────────────────────────────────

  if (schoolView === 'world') {
    const mono = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const filterMap: Record<string, typeof domainFilter> = {
      edge: 'lycheetah', void: 'void', inner: 'contemplative',
      outer: 'secular', noetic: 'lycheetah', special: 'all',
    };
    const handleZoneTap = (zone: (typeof WORLD_ZONES)[0]) => {
      if (zone.action.type === 'feature') {
        if (zone.action.value === 'timebraiding') { setSchoolView('time-braiding'); return; }
        setSchoolView('home');
        return;
      }
      setDomainFilter(filterMap[zone.action.value] ?? 'all');
      setSchoolView('home');
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#03000A' }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#7B68EE33' }}>
          <TouchableOpacity onPress={() => setSchoolView('home')} style={{ padding: 4, marginRight: 12 }}>
            <Text style={{ color: '#7B68EE', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#7B68EE', fontSize: 9, fontFamily: mono, letterSpacing: 3, fontWeight: '700' }}>⟟ THE LYCHEETAH WORLD</Text>
            <Text style={{ color: '#E0D0FF', fontSize: 15, fontWeight: '700', marginTop: 1 }}>27 Zones · Tap to Enter</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {ZONE_SECTIONS.map(section => {
            const sectionZones = WORLD_ZONES.filter(z => z.category === section.category);
            return (
              <View key={section.category} style={{ marginBottom: 28 }}>
                {/* Section header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: section.color + '44' }} />
                  <Text style={{ color: section.color, fontSize: 9, fontWeight: '700', letterSpacing: 2.5, fontFamily: mono }}>{section.label}</Text>
                  <View style={{ flex: 1, height: 0.5, backgroundColor: section.color + '44' }} />
                </View>

                {/* Zone cards — horizontal scroll */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
                  {sectionZones.map(zone => (
                    <TouchableOpacity
                      key={zone.id}
                      onPress={() => handleZoneTap(zone)}
                      style={{ width: 180, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: section.color + '55' }}
                      activeOpacity={0.85}
                    >
                      <Image
                        source={zone.image}
                        style={{ width: 180, height: 110 }}
                        resizeMode="cover"
                      />
                      {/* Name overlay */}
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#00000088', paddingHorizontal: 8, paddingVertical: 6 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700', lineHeight: 14 }} numberOfLines={2}>{zone.name}</Text>
                      </View>
                      {/* Category badge */}
                      <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: section.color + 'CC', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 7, fontWeight: '700', letterSpacing: 1, fontFamily: mono }}>
                          {section.category.toUpperCase()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: MYCELIUM ────────────────────────────────────────────────────────

  if (schoolView === 'mycelium') {
    const MC = '#2ECC71';
    const MMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const SCREEN_W = Math.floor(Dimensions.get('window').width - 32);
    const SCREEN_H = 480;

    // Build node + link sets from studied subjects + immediate neighbors
    const allSubjectsFlat = MYSTERY_SCHOOL_DOMAINS.flatMap(d =>
      d.subjects.map(s => ({ subject: s, domain: d }))
    );
    const studiedNames = new Set(Array.from(studiedSubjects));

    // Collect ghost neighbors from thematic links
    const ghostNames = new Set<string>();
    MYCELIUM_LINKS.forEach(l => {
      if (studiedNames.has(l.from) && !studiedNames.has(l.to)) ghostNames.add(l.to);
      if (studiedNames.has(l.to) && !studiedNames.has(l.from)) ghostNames.add(l.from);
    });
    // Also add domain neighbors (up to 2 per studied domain)
    MYSTERY_SCHOOL_DOMAINS.forEach(d => {
      const studiedInDomain = d.subjects.filter(s => studiedNames.has(s.name));
      if (studiedInDomain.length > 0) {
        d.subjects.filter(s => !studiedNames.has(s.name)).slice(0, 2).forEach(s => ghostNames.add(s.name));
      }
    });

    const visibleNames = new Set([...studiedNames, ...ghostNames]);
    const nodeData = allSubjectsFlat
      .filter(({ subject }) => visibleNames.has(subject.name))
      .map(({ subject, domain }) => ({
        id: subject.name,
        domain,
        layer: subject.layer,
        studied: studiedNames.has(subject.name),
        x: Math.random() * SCREEN_W,
        y: Math.random() * SCREEN_H,
        vx: 0, vy: 0,
      }));

    const nodeIndex = new Map(nodeData.map((n, i) => [n.id, i]));

    // Build links
    const linkData: { source: number; target: number; type: 'domain' | 'layer' | 'thematic'; strength: 'strong' | 'medium' }[] = [];
    // Domain bonds
    MYSTERY_SCHOOL_DOMAINS.forEach(d => {
      const domainNodes = nodeData.filter(n => n.domain.id === d.id && n.studied);
      for (let i = 0; i < domainNodes.length - 1; i++) {
        const si = nodeIndex.get(domainNodes[i].id);
        const ti = nodeIndex.get(domainNodes[i + 1].id);
        if (si !== undefined && ti !== undefined) linkData.push({ source: si, target: ti, type: 'domain', strength: 'medium' });
      }
    });
    // Thematic links
    MYCELIUM_LINKS.forEach(l => {
      const si = nodeIndex.get(l.from);
      const ti = nodeIndex.get(l.to);
      if (si !== undefined && ti !== undefined) {
        linkData.push({ source: si, target: ti, type: 'thematic', strength: l.strength });
      }
    });

    // Run d3 force simulation synchronously
    const simNodes = nodeData.map(n => ({ ...n }));
    const simLinks = linkData.map(l => ({ ...l }));
    const sim = forceSimulation(simNodes)
      .force('link', forceLink(simLinks).id((_: unknown, i: number) => i).distance(60).strength(0.4))
      .force('charge', forceManyBody().strength(-80))
      .force('center', forceCenter(SCREEN_W / 2, SCREEN_H / 2))
      .force('collide', forceCollide(18))
      .stop();
    for (let i = 0; i < 200; i++) sim.tick();

    // Detect third-path suggestions (2 connected studied nodes → unstudied third)
    const thirdPaths: string[] = [];
    const studiedArr = Array.from(studiedNames);
    MYSTERY_SCHOOL_DOMAINS.forEach(d => {
      const studiedInDomain = d.subjects.filter(s => studiedNames.has(s.name));
      if (studiedInDomain.length >= 2) {
        const unstudied = d.subjects.find(s => !studiedNames.has(s.name) && !ghostNames.has(s.name));
        if (unstudied) thirdPaths.push(unstudied.name);
      }
    });
    // Cross-domain thirds from thematic pairs
    MYCELIUM_LINKS.forEach(l => {
      if (studiedNames.has(l.from) && studiedNames.has(l.to)) {
        // find a thematic neighbor of either that isn't studied
        const thirds = MYCELIUM_LINKS
          .filter(l2 => (l2.from === l.from || l2.from === l.to || l2.to === l.from || l2.to === l.to))
          .map(l2 => l2.from === l.from || l2.from === l.to ? l2.to : l2.from)
          .filter(name => !studiedNames.has(name) && name !== l.from && name !== l.to);
        thirds.slice(0, 1).forEach(t => { if (!thirdPaths.includes(t)) thirdPaths.push(t); });
      }
    });
    const thirdSet = new Set(thirdPaths.slice(0, 5));

    const isEmpty = studiedNames.size === 0;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#020A04' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: MC + '22' }}>
          <TouchableOpacity onPress={() => setSchoolView('home')} style={{ padding: 4 }}>
            <Text style={{ color: MC, fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: MC, fontSize: 9, fontFamily: MMONO, letterSpacing: 3, fontWeight: '700' }}>⌘ MYCELIUM</Text>
            <Text style={{ color: '#E8FFE8', fontSize: 16, fontWeight: '700', marginTop: 2 }}>Your Studied Web</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: MC, fontSize: 13, fontWeight: '700' }}>{studiedNames.size}</Text>
            <Text style={{ color: '#2ECC7188', fontSize: 9, fontFamily: MMONO }}>NODES</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
          {isEmpty ? (
            <View style={{ alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 48, color: MC + '33', marginBottom: 20 }}>⌘</Text>
              <Text style={{ color: '#E8FFE8', fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 10 }}>The web grows as you study.</Text>
              <Text style={{ color: MC + '88', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>Begin anywhere. Every subject you study becomes a node. Connections between domains reveal themselves as you go deeper.</Text>
            </View>
          ) : (
            <>
              {/* SVG force graph */}
              <View style={{ margin: 16, borderRadius: 16, borderWidth: 1, borderColor: MC + '22', backgroundColor: '#030F05', overflow: 'hidden' }}>
                {(() => {
                  const { Svg, Circle, Line, Text: SvgText, G } = require('react-native-svg');
                  return (
                    <Svg width={SCREEN_W} height={SCREEN_H}>
                      {/* Thematic links — gold (d3 mutates source/target to node refs after tick) */}
                      {simLinks.filter(l => l.type === 'thematic').map((l, i) => {
                        const s = l.source as any;
                        const t = l.target as any;
                        if (s?.x == null || t?.x == null) return null;
                        return (
                          <Line key={`tl${i}`}
                            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                            stroke={l.strength === 'strong' ? '#F5A62388' : '#F5A62344'}
                            strokeWidth={l.strength === 'strong' ? 1.5 : 0.8}
                          />
                        );
                      })}
                      {/* Domain links — domain color */}
                      {simLinks.filter(l => l.type === 'domain').map((l, i) => {
                        const s = l.source as any;
                        const t = l.target as any;
                        if (s?.x == null || t?.x == null) return null;
                        return (
                          <Line key={`dl${i}`}
                            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                            stroke={(s.domain?.color ?? '#FFFFFF') + '44'}
                            strokeWidth={0.8}
                          />
                        );
                      })}
                      {/* Nodes */}
                      {simNodes.map((n, i) => {
                        const isThird = thirdSet.has(n.id);
                        const r = n.studied ? 10 : (isThird ? 8 : 5);
                        const fill = n.studied ? n.domain.color : (isThird ? '#F5A62333' : '#FFFFFF14');
                        const stroke = n.studied ? '#FFFFFF44' : (isThird ? '#F5A623' : '#FFFFFF33');
                        const strokeW = n.studied ? 1 : (isThird ? 1.5 : 0.8);
                        const labelColor = n.studied ? '#FFFFFFCC' : (isThird ? '#F5A623AA' : '#FFFFFF33');
                        const nameShort = n.id.length > 14 ? n.id.slice(0, 13) + '…' : n.id;
                        return (
                          <G key={n.id}>
                            <Circle cx={n.x} cy={n.y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeW} opacity={n.studied ? 1 : 0.6} />
                            {n.studied && (
                              <SvgText x={n.x} y={n.y - 11} fill={labelColor} fontSize={7} textAnchor="middle" fontFamily={MMONO}>
                                {nameShort}
                              </SvgText>
                            )}
                            {isThird && !n.studied && (
                              <SvgText x={n.x} y={n.y - 10} fill={labelColor} fontSize={6.5} textAnchor="middle">
                                ◈ {nameShort}
                              </SvgText>
                            )}
                          </G>
                        );
                      })}
                    </Svg>
                  );
                })()}
              </View>

              {/* Legend */}
              <View style={{ flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { color: MC, label: 'Studied node' },
                  { color: '#FFFFFF44', label: 'Adjacent subject' },
                  { color: '#F5A623', label: 'Gold thread — thematic link' },
                  { color: '#F5A623', label: '◈ Sol sees a path here', italic: true },
                ].map(item => (
                  <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                    <Text style={{ color: '#FFFFFF66', fontSize: 9, fontStyle: item.italic ? 'italic' : 'normal' }}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Third-path suggestions */}
              {thirdPaths.length > 0 && (
                <View style={{ marginHorizontal: 16, marginBottom: 20, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#F5A62333', backgroundColor: '#0A0700' }}>
                  <Text style={{ color: '#F5A623', fontSize: 9, fontFamily: MMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>◈ SOL SEES A PATH</Text>
                  <Text style={{ color: '#F5A62388', fontSize: 11, marginBottom: 12, lineHeight: 17 }}>
                    Based on your studied web, these subjects would complete a triangle — connecting two threads you've already walked.
                  </Text>
                  {thirdPaths.slice(0, 4).map(name => {
                    const found = allSubjectsFlat.find(({ subject }) => subject.name === name);
                    if (!found) return null;
                    return (
                      <TouchableOpacity
                        key={name}
                        onPress={() => { setSelectedDomain(found.domain); openSubjectDetail(found.subject, found.domain); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5A62311' }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ color: found.domain.color, fontSize: 18 }}>{found.domain.glyph}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#E8D4A0', fontSize: 13, fontWeight: '700' }}>{name}</Text>
                          <Text style={{ color: '#F5A62388', fontSize: 10 }}>{found.domain.label}</Text>
                        </View>
                        <Text style={{ color: '#F5A623', fontSize: 12 }}>→</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Stats row */}
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 }}>
                {[
                  { label: 'Studied', value: studiedNames.size, color: MC },
                  { label: 'Connections', value: simLinks.filter(l => l.type === 'thematic' && ((l.source as any)?.studied || (l.target as any)?.studied)).length, color: '#F5A623' },
                  { label: 'Paths seen', value: thirdPaths.length, color: '#9B59B6' },
                ].map(stat => (
                  <View key={stat.label} style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: stat.color + '33', backgroundColor: stat.color + '08', alignItems: 'center' }}>
                    <Text style={{ color: stat.color, fontSize: 20, fontWeight: '700' }}>{stat.value}</Text>
                    <Text style={{ color: stat.color + '88', fontSize: 9, fontFamily: MMONO, letterSpacing: 1, marginTop: 2 }}>{stat.label.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: SHADOW PARTS INVENTORY ────────────────────────────────────────

  if (schoolView === 'shadow-parts') {
    const SP = '#B71C1C';
    const SPMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const STAGES = [
      { label: 'Witnessed',  glyph: '◌', color: '#8A86A0', desc: 'Named and seen for the first time.' },
      { label: 'Understood', glyph: '◎', color: '#4A9EFF', desc: 'Its origin and pattern recognised.' },
      { label: 'Engaged',    glyph: '⊚', color: '#F5A623', desc: 'Actively working with this part.' },
      { label: 'Integrated', glyph: '✦', color: '#E8C76A', desc: 'The energy reclaimed and redirected.' },
    ];

    const saveParts = async (updated: ShadowPart[]) => {
      setShadowParts(updated);
      await AsyncStorage.setItem('sol_shadow_parts', JSON.stringify(updated));
    };

    // ── NEW PART FORM ──
    if (shadowPartsView === 'new') {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#06020A' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: SP + '33' }}>
              <TouchableOpacity onPress={() => { setShadowPartsView('list'); setShadowPartInput(''); setShadowPartDesc(''); }} style={{ padding: 4 }}>
                <Text style={{ color: SP, fontSize: 20 }}>←</Text>
              </TouchableOpacity>
              <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700' }}>Name a Shadow Part</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                A shadow part is a pattern in yourself that runs without your conscious consent — The Avoider, The Critic, The People-Pleaser. Naming it is the first act of integration.
              </Text>
              <Text style={{ color: SP, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, fontFamily: SPMONO, marginBottom: 6 }}>NAME THIS PART</Text>
              <TextInput
                style={{ backgroundColor: SOL_THEME.surface, color: SOL_THEME.text, borderRadius: 10, borderWidth: 1, borderColor: SP + '44', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '600', marginBottom: 16 }}
                placeholder='e.g. "The Avoider", "The Critic"...'
                placeholderTextColor={SOL_THEME.textMuted}
                value={shadowPartInput}
                onChangeText={setShadowPartInput}
              />
              <Text style={{ color: SP, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, fontFamily: SPMONO, marginBottom: 6 }}>HOW DOES IT SHOW UP?</Text>
              <TextInput
                style={{ backgroundColor: SOL_THEME.surface, color: SOL_THEME.text, borderRadius: 10, borderWidth: 1, borderColor: SP + '44', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 90, textAlignVertical: 'top', marginBottom: 24 }}
                placeholder='Describe the behaviour, the trigger, the feeling it carries...'
                placeholderTextColor={SOL_THEME.textMuted}
                value={shadowPartDesc}
                onChangeText={setShadowPartDesc}
                multiline
              />
              <TouchableOpacity
                onPress={async () => {
                  if (!shadowPartInput.trim()) return;
                  const newPart: ShadowPart = {
                    id: Date.now().toString(),
                    name: shadowPartInput.trim(),
                    description: shadowPartDesc.trim(),
                    appearances: [],
                    stage: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  await saveParts([newPart, ...shadowParts]);
                  setShadowPartInput(''); setShadowPartDesc('');
                  setActiveShadowPart(newPart);
                  setShadowPartsView('detail');
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: SP, alignItems: 'center', opacity: shadowPartInput.trim() ? 1 : 0.4 }}
                disabled={!shadowPartInput.trim()}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Witness This Part →</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    // ── DETAIL VIEW ──
    if (shadowPartsView === 'detail' && activeShadowPart) {
      const part = shadowParts.find(p => p.id === activeShadowPart.id) ?? activeShadowPart;
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#06020A' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: SP + '33' }}>
              <TouchableOpacity onPress={() => setShadowPartsView('list')} style={{ padding: 4 }}>
                <Text style={{ color: SP, fontSize: 20 }}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: SP, fontSize: 9, fontFamily: SPMONO, letterSpacing: 2, fontWeight: '700' }}>◌ SHADOW PART</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{part.name}</Text>
              </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
              {/* Description */}
              {!!part.description && (
                <View style={{ padding: 14, borderRadius: 10, borderWidth: 1, borderColor: SP + '33', backgroundColor: SP + '08', marginBottom: 18 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{part.description}</Text>
                </View>
              )}

              {/* Integration stage */}
              <Text style={{ color: SP, fontSize: 9, fontFamily: SPMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>INTEGRATION STAGE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {STAGES.map((s, i) => {
                  const active = part.stage === i;
                  return (
                    <TouchableOpacity
                      key={s.label}
                      onPress={async () => {
                        const updated = shadowParts.map(p => p.id === part.id ? { ...p, stage: i as ShadowPart['stage'], updatedAt: new Date().toISOString() } : p);
                        await saveParts(updated);
                        setActiveShadowPart({ ...part, stage: i as ShadowPart['stage'] });
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{ flex: 1, minWidth: '45%', padding: 10, borderRadius: 10, borderWidth: active ? 1.5 : 1, borderColor: active ? s.color : SOL_THEME.border, backgroundColor: active ? s.color + '14' : SOL_THEME.surface, alignItems: 'center', gap: 4 }}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: s.color, fontSize: 18 }}>{s.glyph}</Text>
                      <Text style={{ color: active ? s.color : SOL_THEME.text, fontSize: 11, fontWeight: '700' }}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Appearances log */}
              <Text style={{ color: SP, fontSize: 9, fontFamily: SPMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>APPEARANCES · {part.appearances.length}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: SOL_THEME.surface, color: SOL_THEME.text, borderRadius: 10, borderWidth: 1, borderColor: SP + '33', paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 }}
                  placeholder='When did it show up today?'
                  placeholderTextColor={SOL_THEME.textMuted}
                  value={shadowAppearanceInput}
                  onChangeText={setShadowAppearanceInput}
                  multiline
                />
                <TouchableOpacity
                  onPress={async () => {
                    if (!shadowAppearanceInput.trim()) return;
                    const entry = `${new Date().toLocaleDateString()} — ${shadowAppearanceInput.trim()}`;
                    const updated = shadowParts.map(p => p.id === part.id
                      ? { ...p, appearances: [entry, ...p.appearances].slice(0, 30), updatedAt: new Date().toISOString() }
                      : p);
                    await saveParts(updated);
                    setActiveShadowPart({ ...activeShadowPart, appearances: [entry, ...activeShadowPart.appearances].slice(0, 30) });
                    setShadowAppearanceInput('');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={{ paddingHorizontal: 14, borderRadius: 10, backgroundColor: SP + '18', borderWidth: 1, borderColor: SP + '44', justifyContent: 'center' }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: SP, fontSize: 13, fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
              {part.appearances.map((a, i) => (
                <View key={i} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, marginBottom: 6 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }}>{a}</Text>
                </View>
              ))}
              {part.appearances.length === 0 && (
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginTop: 4, marginBottom: 16 }}>No appearances recorded yet. Log one when you notice it.</Text>
              )}

              {/* Delete */}
              <TouchableOpacity
                onPress={() => Alert.alert('Remove this part?', 'Integration is not failure. You can always re-add it.', [
                  { text: 'Keep it', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: async () => {
                    await saveParts(shadowParts.filter(p => p.id !== part.id));
                    setShadowPartsView('list');
                  }},
                ])}
                style={{ marginTop: 20, paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Remove this part</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      );
    }

    // ── LIST VIEW ──
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#06020A' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: SP + '33' }}>
          <TouchableOpacity onPress={() => setSchoolView('home')} style={{ padding: 4 }}>
            <Text style={{ color: SP, fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: SP, fontSize: 9, fontFamily: SPMONO, letterSpacing: 3, fontWeight: '700' }}>◌ SHADOW PARTS</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>The Inventory</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setShadowPartInput(''); setShadowPartDesc(''); setShadowPartsView('new'); }}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: SP + '18', borderWidth: 1, borderColor: SP + '44' }}
          >
            <Text style={{ color: SP, fontSize: 12, fontWeight: '700' }}>+ Name a Part</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 20 }}>
            Shadow parts are the patterns you didn't choose — the ones that run in the background. Naming them begins the work. Integration is not elimination; it is reclamation.
          </Text>

          {shadowParts.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: SP + '66', fontSize: 40, marginBottom: 12 }}>◌</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>Nothing named yet.{'\n'}The first act of shadow work is seeing.</Text>
              <TouchableOpacity
                onPress={() => { setShadowPartInput(''); setShadowPartDesc(''); setShadowPartsView('new'); }}
                style={{ marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: SP + '18', borderWidth: 1, borderColor: SP + '44' }}
              >
                <Text style={{ color: SP, fontSize: 13, fontWeight: '700' }}>Name Your First Part →</Text>
              </TouchableOpacity>
            </View>
          )}

          {shadowParts.map(part => {
            const stage = STAGES[part.stage];
            return (
              <TouchableOpacity
                key={part.id}
                onPress={() => { setActiveShadowPart(part); setShadowPartsView('detail'); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: SP + '33', backgroundColor: SP + '06', marginBottom: 10 }}
                activeOpacity={0.75}
              >
                <Text style={{ color: stage.color, fontSize: 22 }}>{stage.glyph}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', marginBottom: 2 }}>{part.name}</Text>
                  <Text style={{ color: stage.color, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>{stage.label} · {part.appearances.length} appearances</Text>
                </View>
                <Text style={{ color: SP, fontSize: 13 }}>→</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Computed totals (used by Spiral + home) ─────────────────────────────────
  const totalSubjects = MYSTERY_SCHOOL_DOMAINS.reduce((acc, d) => acc + d.subjects.length, 0);
  const totalStudied = MYSTERY_SCHOOL_DOMAINS.reduce((acc, d) => acc + d.subjects.filter(s => studiedSubjects.has(s.name)).length, 0);

  // ─── RENDER: SPIRAL / PROGRESS ──────────────────────────────────────────────

  if (schoolView === 'spiral') {
    const SMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

    // Aggregate mastery stage counts
    const stageCounts = [0, 0, 0, 0, 0]; // index 0 = unstudied (unused), 1-4 = stages
    Array.from(studiedSubjects).forEach(name => {
      const stage = subjectMastery[name]?.stage || 1;
      if (stage >= 1 && stage <= 4) stageCounts[stage]++;
    });

    // Layer breakdown
    const layerStudied: Record<string, number> = { FOUNDATION: 0, MIDDLE: 0, EDGE: 0, OPEN: 0, VOID: 0 };
    const layerTotal: Record<string, number> = { FOUNDATION: 0, MIDDLE: 0, EDGE: 0, OPEN: 0, VOID: 0 };
    MYSTERY_SCHOOL_DOMAINS.forEach(d => {
      d.subjects.forEach(s => {
        layerTotal[s.layer] = (layerTotal[s.layer] || 0) + 1;
        if (studiedSubjects.has(s.name)) layerStudied[s.layer] = (layerStudied[s.layer] || 0) + 1;
      });
    });

    // Domain rows — only domains with at least one studied subject, sorted by % desc
    const domainRows = MYSTERY_SCHOOL_DOMAINS
      .map(d => ({
        domain: d,
        studied: d.subjects.filter(s => studiedSubjects.has(s.name)).length,
        total: d.subjects.length,
      }))
      .filter(r => r.studied > 0)
      .sort((a, b) => (b.studied / b.total) - (a.studied / a.total));

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity onPress={() => setSchoolView('home')} style={{ paddingVertical: 10, marginBottom: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: SOL_THEME.primary }}>← The School</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: SOL_THEME.primary, fontSize: 28, marginBottom: 4 }}>◈</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.3 }}>The Spiral</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 3 }}>Your path through the school</Text>
          </View>

          {/* Overall stats */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            {[
              { value: totalStudied, label: 'subjects', sub: `of ${totalSubjects}` },
              { value: domainRows.length, label: 'domains', sub: `of ${MYSTERY_SCHOOL_DOMAINS.length}` },
              { value: diveLog.length, label: 'dives', sub: 'total' },
            ].map(stat => (
              <View key={stat.label} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 24, fontWeight: '700', lineHeight: 28 }}>{stat.value}</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 11, fontWeight: '600', marginTop: 2 }}>{stat.label}</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 1 }}>{stat.sub}</Text>
              </View>
            ))}
          </View>

          {/* Overall progress bar */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: SMONO, fontWeight: '700', letterSpacing: 1.5 }}>OVERALL COVERAGE</Text>
              <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontWeight: '700' }}>{Math.round((totalStudied / totalSubjects) * 100)}%</Text>
            </View>
            <View style={{ height: 6, backgroundColor: SOL_THEME.border, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${Math.round((totalStudied / totalSubjects) * 100)}%`, backgroundColor: SOL_THEME.primary, borderRadius: 3 }} />
            </View>
            {fieldStage && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: SOL_THEME.primary + '18', borderWidth: 1, borderColor: SOL_THEME.primary + '33' }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontWeight: '700', fontFamily: SMONO, letterSpacing: 1 }}>{fieldStage}</Text>
                </View>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>current field stage</Text>
              </View>
            )}
          </View>

          {/* Mastery stages */}
          {totalStudied > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: SMONO, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>MASTERY BREAKDOWN</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {MASTERY_STAGES.slice(1).map((ms, idx) => {
                  if (!ms) return null;
                  const count = stageCounts[idx + 1];
                  return (
                    <View key={ms.label} style={{ flex: 1, minWidth: 70, padding: 10, borderRadius: 10, backgroundColor: ms.color + '10', borderWidth: 1, borderColor: ms.color + '33', alignItems: 'center' }}>
                      <Text style={{ color: ms.color, fontSize: 18, marginBottom: 4 }}>{ms.glyph}</Text>
                      <Text style={{ color: ms.color, fontSize: 18, fontWeight: '700', lineHeight: 22 }}>{count}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, marginTop: 2, textAlign: 'center', fontFamily: SMONO, letterSpacing: 0.5 }}>{ms.label.toUpperCase()}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Layer breakdown */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: SMONO, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>BY LAYER</Text>
            {(['FOUNDATION', 'MIDDLE', 'EDGE', 'OPEN', 'VOID'] as const).map(layer => {
              const studied = layerStudied[layer] || 0;
              const total = layerTotal[layer] || 0;
              if (total === 0) return null;
              const pct = Math.round((studied / total) * 100);
              return (
                <View key={layer} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: LAYER_COLORS[layer], fontSize: 11, fontWeight: '700', fontFamily: SMONO, letterSpacing: 1 }}>{LAYER_LABELS[layer].toUpperCase()}</Text>
                    <Text style={{ color: studied > 0 ? LAYER_COLORS[layer] : SOL_THEME.textMuted, fontSize: 11, fontWeight: studied === total ? '700' : '400' }}>{studied}/{total}{studied === total ? ' ✦' : ''}</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: LAYER_COLORS[layer] + '22', borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ height: 4, width: pct > 0 ? `${pct}%` : '1%', backgroundColor: LAYER_COLORS[layer], borderRadius: 2, opacity: pct > 0 ? 1 : 0 }} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Domain-by-domain rows */}
          {domainRows.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: SMONO, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10 }}>DOMAINS ENTERED</Text>
              {domainRows.map(({ domain, studied, total }) => {
                const pct = Math.round((studied / total) * 100);
                return (
                  <TouchableOpacity
                    key={domain.id}
                    onPress={() => { setSelectedDomain(domain); setSchoolView('domain'); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, padding: 10, borderRadius: 10, backgroundColor: domain.color + '08', borderWidth: 1, borderColor: domain.color + '33' }}
                    activeOpacity={0.75}
                  >
                    <Text style={{ color: domain.color, fontSize: 20, width: 28, textAlign: 'center' }}>{domain.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{t(domain.label)}</Text>
                        <Text style={{ color: studied === total ? domain.color : SOL_THEME.textMuted, fontSize: 11, fontWeight: studied === total ? '700' : '400' }}>{studied}/{total}{studied === total ? ' ✦' : ''}</Text>
                      </View>
                      <View style={{ height: 3, backgroundColor: domain.color + '22', borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ height: 3, width: `${pct}%`, backgroundColor: domain.color, borderRadius: 2 }} />
                      </View>
                    </View>
                    <Text style={{ color: domain.color, fontSize: 11, fontWeight: '700', minWidth: 32, textAlign: 'right' }}>{pct}%</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Untouched domains */}
          {(() => {
            const untouched = MYSTERY_SCHOOL_DOMAINS.filter(d => !d.subjects.some(s => studiedSubjects.has(s.name)));
            if (untouched.length === 0) return null;
            return (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: SMONO, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 }}>UNOPENED DOORS · {untouched.length}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {untouched.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => { setSelectedDomain(d); setSchoolView('domain'); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: d.color + '08', borderWidth: 1, borderColor: d.color + '33' }}
                      activeOpacity={0.75}
                    >
                      <Text style={{ color: d.color, fontSize: 13 }}>{d.glyph}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{t(d.label)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })()}

        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: CEREMONY ARCS ──────────────────────────────────────────────────

  if (schoolView === 'ceremony') {
    const CMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
    const active = ceremonyState?.active ?? null;

    const abandonArc = () => {
      Alert.alert(
        'End ceremony?',
        'Your progress will be saved in your history.',
        [
          { text: 'Keep going', style: 'cancel' },
          {
            text: 'End ceremony', style: 'destructive', onPress: async () => {
              const newHistory = [
                ...(ceremonyState?.history ?? []),
                { arcType: active!.arcType, duration: active!.duration, startDate: active!.startDate, completedDate: new Date().toISOString() },
              ];
              const ns = { active: null, history: newHistory };
              setCeremonyState(ns);
              await AsyncStorage.setItem('sol_ceremony_arcs', JSON.stringify(ns));
            },
          },
        ]
      );
    };

    if (active) {
      const arc = getArcDef(active.arcType);
      const daysCompleted = active.completedDays.length;
      const totalDays = active.duration;
      const isDone = daysCompleted >= totalDays;
      const day = !isDone ? getArcDay(active.arcType, active.duration, daysCompleted) : null;

      const completeDay = async () => {
        if (!active || isDone) return;
        const newCompleted = [...active.completedDays, daysCompleted];
        const ns = { ...(ceremonyState!), active: { ...active, completedDays: newCompleted } };
        setCeremonyState(ns);
        await AsyncStorage.setItem('sol_ceremony_arcs', JSON.stringify(ns));
        setCeremonyJournalText('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      };

      const finishArc = async () => {
        const newHistory = [
          ...(ceremonyState?.history ?? []),
          { arcType: active.arcType, duration: active.duration, startDate: active.startDate, completedDate: new Date().toISOString() },
        ];
        const ns = { active: null, history: newHistory };
        setCeremonyState(ns);
        await AsyncStorage.setItem('sol_ceremony_arcs', JSON.stringify(ns));
      };

      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#06060E' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: arc.color + '22' }}>
            <TouchableOpacity onPress={() => setSchoolView('home')} style={{ padding: 4 }}>
              <Text style={{ color: arc.color, fontSize: 20 }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: arc.color, fontSize: 9, fontFamily: CMONO, letterSpacing: 3, fontWeight: '700' }}>
                {arc.glyph} {arc.label.toUpperCase()} · {totalDays}-DAY ARC
              </Text>
            </View>
            <TouchableOpacity onPress={abandonArc}>
              <Text style={{ color: arc.color + '66', fontSize: 11, fontFamily: CMONO }}>end</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
            {/* Progress pips */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: arc.color, fontSize: 11, fontFamily: CMONO, fontWeight: '700' }}>
                  {isDone ? 'COMPLETE' : `DAY ${daysCompleted + 1} OF ${totalDays}`}
                </Text>
                <Text style={{ color: arc.color + '88', fontSize: 11, fontFamily: CMONO }}>{daysCompleted}/{totalDays}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: Math.min(totalDays, 40) }).map((_, i) => (
                  <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < daysCompleted ? arc.color : arc.color + '22' }} />
                ))}
              </View>
            </View>

            {isDone ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 64, marginBottom: 16, color: arc.color }}>{arc.glyph}</Text>
                <Text style={{ color: arc.color, fontSize: 22, fontWeight: '700', marginBottom: 8 }}>{arc.label} Complete</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 32, paddingHorizontal: 20 }}>
                  {`${totalDays} days carried. The arc does not close — it deepens into the life that follows it.`}
                </Text>
                <TouchableOpacity
                  onPress={finishArc}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: arc.color, backgroundColor: arc.color + '15' }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: arc.color, fontWeight: '700', fontSize: 14 }}>Begin a New Arc</Text>
                </TouchableOpacity>
              </View>
            ) : day ? (
              <>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: CMONO, letterSpacing: 2, marginBottom: 4 }}>TODAY</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 22, fontWeight: '700', marginBottom: 20 }}>{day.title}</Text>

                {/* Reading */}
                <View style={{ marginBottom: 18, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: arc.color + '33', backgroundColor: arc.color + '06' }}>
                  <Text style={{ color: arc.color, fontSize: 9, fontFamily: CMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>◎ READING</Text>
                  <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22 }}>{day.reading}</Text>
                </View>

                {/* Practice */}
                <View style={{ marginBottom: 18, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#4A9EFF33', backgroundColor: '#4A9EFF06' }}>
                  <Text style={{ color: '#4A9EFF', fontSize: 9, fontFamily: CMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>◈ PRACTICE</Text>
                  <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22 }}>{day.practice}</Text>
                </View>

                {/* Journal prompt */}
                <View style={{ marginBottom: 18, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F5A62333', backgroundColor: '#F5A62306' }}>
                  <Text style={{ color: '#F5A623', fontSize: 9, fontFamily: CMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>✦ JOURNAL PROMPT</Text>
                  <Text style={{ color: '#E8D4A0', fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 14 }}>{day.prompt}</Text>
                  <TextInput
                    value={ceremonyJournalText}
                    onChangeText={setCeremonyJournalText}
                    multiline
                    placeholder="Write here…"
                    placeholderTextColor={SOL_THEME.textMuted}
                    style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20, minHeight: 80, textAlignVertical: 'top' }}
                  />
                </View>

                {/* Closing line */}
                <View style={{ marginBottom: 24, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8C76A22', backgroundColor: '#E8C76A06' }}>
                  <Text style={{ color: '#E8C76A', fontSize: 9, fontFamily: CMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 10 }}>⊚ CLOSING</Text>
                  <Text style={{ color: '#E8C76A', fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>{day.closing}</Text>
                </View>

                <TouchableOpacity
                  onPress={completeDay}
                  style={{ paddingVertical: 16, borderRadius: 12, borderWidth: 1.5, borderColor: arc.color, backgroundColor: arc.color + '15', alignItems: 'center', marginBottom: 12 }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: arc.color, fontSize: 15, fontWeight: '700' }}>Mark Day {daysCompleted + 1} Complete</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      );
    }

    // No active arc — arc selection
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#070510' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: '#7B8CDE22' }}>
          <TouchableOpacity onPress={() => { setSchoolView('home'); setCeremonySelectedArc(null); }} style={{ padding: 4 }}>
            <Text style={{ color: '#7B8CDE', fontSize: 20 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#7B8CDE', fontSize: 9, fontFamily: CMONO, letterSpacing: 3, fontWeight: '700' }}>◌ THE ARCS</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginTop: 2 }}>CEREMONY ARCS</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
            A ceremony arc is a structured immersion into one of six territories of transformation. Daily reading, practice, and reflection — carried day by day.
          </Text>

          {/* Duration picker — shown after arc selected */}
          {ceremonySelectedArc && (() => {
            const selArc = getArcDef(ceremonySelectedArc);
            return (
              <View style={{ marginBottom: 24, padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: selArc.color + '66', backgroundColor: selArc.color + '0A' }}>
                <Text style={{ color: selArc.color, fontSize: 9, fontFamily: CMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>
                  {selArc.glyph} {ceremonySelectedArc.toUpperCase()} — CHOOSE DURATION
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                  {([3, 7, 40] as CeremonyDuration[]).map(dur => (
                    <TouchableOpacity
                      key={dur}
                      onPress={async () => {
                        const newActive = {
                          arcType: ceremonySelectedArc,
                          duration: dur,
                          startDate: new Date().toISOString(),
                          completedDays: [] as number[],
                        };
                        const ns = { active: newActive, history: ceremonyState?.history ?? [] };
                        setCeremonyState(ns);
                        await AsyncStorage.setItem('sol_ceremony_arcs', JSON.stringify(ns));
                        setCeremonySelectedArc(null);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                      style={{ flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: selArc.color + '66', backgroundColor: selArc.color + '10', alignItems: 'center' }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: selArc.color, fontSize: 20, fontWeight: '700', marginBottom: 2 }}>{dur}</Text>
                      <Text style={{ color: selArc.color + '88', fontSize: 9, fontFamily: CMONO, letterSpacing: 1 }}>DAYS</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 4 }}>
                        {dur === 3 ? 'Threshold' : dur === 7 ? 'Immersion' : 'Deep Arc'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity onPress={() => setCeremonySelectedArc(null)}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, textAlign: 'center' }}>← different arc</Text>
                </TouchableOpacity>
              </View>
            );
          })()}

          {/* Arc cards */}
          {CEREMONY_ARCS.map(arc => {
            const isSelected = ceremonySelectedArc === arc.type;
            return (
              <TouchableOpacity
                key={arc.type}
                onPress={() => setCeremonySelectedArc(isSelected ? null : arc.type)}
                style={{ marginBottom: 12, borderRadius: 12, borderWidth: 1.5, borderColor: arc.color + (isSelected ? 'AA' : '44'), backgroundColor: arc.color + (isSelected ? '15' : '08'), padding: 16 }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  <Text style={{ fontSize: 28, color: arc.color }}>{arc.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700' }}>{arc.label}</Text>
                  </View>
                  <Text style={{ color: arc.color, fontSize: 14 }}>{isSelected ? '▲' : '▼'}</Text>
                </View>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }}>{arc.description}</Text>
              </TouchableOpacity>
            );
          })}

          {/* History */}
          {(ceremonyState?.history?.length ?? 0) > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: CMONO, letterSpacing: 2, fontWeight: '700', marginBottom: 12 }}>◌ COMPLETED ARCS</Text>
              {ceremonyState!.history.map((h, i) => {
                const arc = getArcDef(h.arcType);
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: arc.color + '22', backgroundColor: arc.color + '06' }}>
                    <Text style={{ color: arc.color, fontSize: 18 }}>{arc.glyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '600' }}>{arc.label} · {h.duration} days</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>{new Date(h.completedDate).toLocaleDateString()}</Text>
                    </View>
                    <Text style={{ color: arc.color, fontSize: 14 }}>✦</Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── RENDER: Shared shell (home / domain / curriculum / notes) ─────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: SOL_THEME.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>

        {/* ── HOME ─────────────────────────────────────────────────────────── */}
        {schoolView === 'home' && (
          <>
            {/* Header — The School Gate */}
            <View style={{ borderRadius: 22, borderWidth: 1.5, borderColor: SOL_THEME.headmaster + '55', backgroundColor: '#06060E', marginBottom: 12, overflow: 'hidden',
              shadowColor: SOL_THEME.headmaster, shadowOpacity: 0.25, shadowRadius: 24, elevation: 8 }}>
              {/* Constellation background */}
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                <Text style={{ position: 'absolute', top: 8, left: 18, fontSize: 8, color: SOL_THEME.headmaster + '30' }}>✦</Text>
                <Text style={{ position: 'absolute', top: 22, left: 62, fontSize: 5, color: SOL_THEME.headmaster + '25' }}>·</Text>
                <Text style={{ position: 'absolute', top: 5, left: 105, fontSize: 7, color: SOL_THEME.headmaster + '20' }}>✦</Text>
                <Text style={{ position: 'absolute', top: 30, left: 148, fontSize: 5, color: SOL_THEME.headmaster + '25' }}>·</Text>
                <Text style={{ position: 'absolute', top: 10, left: 195, fontSize: 8, color: SOL_THEME.headmaster + '28' }}>✦</Text>
                <Text style={{ position: 'absolute', top: 38, left: 240, fontSize: 5, color: SOL_THEME.headmaster + '20' }}>·</Text>
                <Text style={{ position: 'absolute', top: 14, left: 285, fontSize: 7, color: SOL_THEME.headmaster + '22' }}>✦</Text>
                <Text style={{ position: 'absolute', top: 52, left: 30, fontSize: 5, color: SOL_THEME.headmaster + '18' }}>·</Text>
                <Text style={{ position: 'absolute', top: 60, left: 80, fontSize: 6, color: SOL_THEME.headmaster + '20' }}>✦</Text>
                <Text style={{ position: 'absolute', top: 48, left: 170, fontSize: 5, color: SOL_THEME.headmaster + '18' }}>·</Text>
                <Text style={{ position: 'absolute', top: 65, left: 220, fontSize: 7, color: SOL_THEME.headmaster + '22' }}>✦</Text>
              </View>
              {/* Giant watermark 𝔏 */}
              <Text style={{ position: 'absolute', right: -8, top: -28, fontSize: 160, color: SOL_THEME.headmaster + '09', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', lineHeight: 180 }}>𝔏</Text>
              {/* Top rule */}
              <View style={{ height: 2, backgroundColor: SOL_THEME.headmaster + '33', marginBottom: 0 }} />
              {/* Inner glow line */}
              <View style={{ height: 1, backgroundColor: SOL_THEME.headmaster + '18', marginBottom: 0 }} />
              <View style={{ padding: 20 }}>
                {/* School sigil row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: SOL_THEME.headmaster + '66',
                    backgroundColor: SOL_THEME.headmaster + '15', alignItems: 'center', justifyContent: 'center',
                    shadowColor: SOL_THEME.headmaster, shadowOpacity: 0.5, shadowRadius: 10, elevation: 4 }}>
                    <Text style={{ fontSize: 22, color: SOL_THEME.headmaster, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>𝔏</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: SOL_THEME.headmaster + 'BB', letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 2 }}>LYCHEETAH</Text>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: SOL_THEME.headmaster, letterSpacing: 0.5, lineHeight: 28 }}>Mystery School</Text>
                  </View>
                </View>
                {/* Tagline */}
                <Text style={{ color: SOL_THEME.headmaster + '77', fontSize: 11, fontStyle: 'italic', marginBottom: 16, letterSpacing: 0.3 }}>for inquiry, not belief · the door is always open</Text>
                {/* Divider */}
                <View style={{ height: 1, backgroundColor: SOL_THEME.headmaster + '22', marginBottom: 12 }} />
                {/* Progress row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1, height: 3, backgroundColor: SOL_THEME.headmaster + '15', borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ height: 3, width: `${Math.round((totalStudied / totalSubjects) * 100)}%`, backgroundColor: SOL_THEME.headmaster, borderRadius: 2,
                      shadowColor: SOL_THEME.headmaster, shadowOpacity: 0.9, shadowRadius: 6, elevation: 3 }} />
                  </View>
                  <Text style={{ color: SOL_THEME.headmaster + 'BB', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{totalStudied}<Text style={{ color: SOL_THEME.headmaster + '55' }}>/{totalSubjects}</Text></Text>
                  <Text style={{ color: SOL_THEME.headmaster + '55', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>STUDIED</Text>
                </View>
              </View>
              {/* Bottom rule */}
              <View style={{ height: 1, backgroundColor: SOL_THEME.headmaster + '22' }} />
              <View style={{ height: 2, backgroundColor: SOL_THEME.headmaster + '0F' }} />
            </View>

            {/* ── #251 OPEN DOORS — the curiosity gap that pulls you back ── */}
            {openDoors.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: SOL_THEME.headmaster + 'AA', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 8, paddingLeft: 2 }}>⟳ DOORS YOU LEFT OPEN</Text>
                {openDoors.slice(0, 2).map(d => (
                  <View key={d.subject + d.date} style={{ borderRadius: 14, borderWidth: 1, borderColor: d.domainColor + '55', backgroundColor: d.domainColor + '10', padding: 14, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={{ color: d.domainColor, fontSize: 16 }}>{d.domainGlyph}</Text>
                      <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700', flex: 1 }} numberOfLines={1}>{d.subject}</Text>
                      <TouchableOpacity onPress={() => { const next = openDoors.filter(x => x.subject !== d.subject); setOpenDoors(next); AsyncStorage.setItem('sol_open_doors', JSON.stringify(next)).catch(() => {}); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12.5, lineHeight: 19, fontStyle: 'italic', marginBottom: 10 }}>{d.door}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const dom = MYSTERY_SCHOOL_DOMAINS.find(x => x.label === d.domainLabel);
                        const subj = dom?.subjects.find(s => s.name === d.subject);
                        const next = openDoors.filter(x => x.subject !== d.subject);
                        setOpenDoors(next);
                        AsyncStorage.setItem('sol_open_doors', JSON.stringify(next)).catch(() => {});
                        if (dom && subj) { setSelectedDomain(dom); openSubjectDetail(subj, dom); }
                        else if (dom) { setSelectedDomain(dom); setSchoolView('domain'); }
                      }}
                      style={{ alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 10, backgroundColor: d.domainColor }}>
                      <Text style={{ color: '#000', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>Walk through →</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── ACTIVE STATE ─────────────────────────────────────────── */}
            {(studyStreak >= 1 || fallowReturn) && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {studyStreak >= 1 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: '#E0704015', borderWidth: 1, borderColor: '#E0704033' }}>
                    <Text style={{ color: '#E07040', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>◆</Text>
                    <Text style={{ color: '#E07040', fontSize: 11, fontWeight: '700' }}>{studyStreak} day{studyStreak !== 1 ? 's' : ''} running</Text>
                  </View>
                )}
                {/* Ceremony — compact pill */}
                <TouchableOpacity onPress={() => setSchoolView('ceremony')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 16, backgroundColor: '#7B8CDE12', borderWidth: 1, borderColor: '#7B8CDE33' }}>
                  {(() => {
                    const active = ceremonyState?.active ?? null;
                    if (active) {
                      const arc = getArcDef(active.arcType);
                      return <>
                        <Text style={{ color: arc.color, fontSize: 10 }}>{arc.glyph}</Text>
                        <Text style={{ color: arc.color, fontSize: 10, fontWeight: '700' }}>Day {active.completedDays.length}/{active.duration}</Text>
                      </>;
                    }
                    return <>
                      <Text style={{ color: '#7B8CDE', fontSize: 10 }}>◌</Text>
                      <Text style={{ color: '#7B8CDE', fontSize: 10, fontWeight: '700' }}>CEREMONY</Text>
                    </>;
                  })()}
                </TouchableOpacity>
                {fallowReturn && (
                  <TouchableOpacity onPress={() => setFallowReturn(false)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 1, borderColor: SOL_THEME.headmaster + '33', backgroundColor: SOL_THEME.headmaster + '0A' }}>
                    <Text style={{ flex: 1, color: SOL_THEME.headmaster, fontSize: 11, fontStyle: 'italic' }}>The School kept your place.</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ── THE TOOLS — one clean uniform button grid (#255c) ── */}
            {(() => {
              const SMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
              const randomDive = async () => {
                const allSubjects = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.map(s => ({ subject: s, domain: d })));
                const unstudied = allSubjects.filter(({ subject }) => !studiedSubjects.has(subject.name));
                const pool = unstudied.length > 0 ? unstudied : allSubjects;
                const pick = pool[Math.floor(Math.random() * pool.length)];
                if (pick) { setSelectedDomain(pick.domain); await openSubjectDetail(pick.subject, pick.domain); }
              };
              const TOOLS: { glyph: string; label: string; color: string; onPress: () => void; badge?: string }[] = [
                { glyph: '◫', label: 'SYLLABUS', color: SOL_THEME.primary,    onPress: () => setSchoolView('curriculum') },
                { glyph: '◈', label: 'RANDOM',   color: SOL_THEME.headmaster, onPress: randomDive },
                { glyph: '◬', label: 'LIBRARY',  color: '#4A9EFF',            onPress: () => router.push('/library') },
                { glyph: '𝔏', label: 'CODEX',    color: '#C8A96E',            onPress: async () => { await AsyncStorage.setItem('codex_open_domains', 'true'); router.push('/(tabs)/codex'); } },
                { glyph: '△', label: 'CASCADE',  color: '#C084FC',            onPress: () => router.push('/(tabs)/cascade') },
                { glyph: '◈', label: 'TIME BRAID', color: '#4ECDC4',          onPress: () => { setTimeBraidView('list'); setSchoolView('time-braiding'); }, badge: timeBraidDue.length > 0 ? String(timeBraidDue.length) : undefined },
                { glyph: '⟟', label: 'LAMAGUE',  color: '#E8D4A0',            onPress: () => { setGlyphSearch(''); setGlyphExpandedId(null); setLamagueSection('glyphs'); setSchoolView('lamague'); } },
                { glyph: '✦', label: 'SCRIPTORIUM', color: '#B06BE0',        onPress: () => setSchoolView('scriptorium') },
                { glyph: '◇', label: 'DIVE LOG', color: '#7ED6DF',            onPress: () => setSchoolView('dive-log') },
                { glyph: '☉', label: 'WORLD',    color: '#F5A623',            onPress: () => setSchoolView('world') },
                { glyph: '◉', label: 'SPIRAL',   color: '#FF6B9D',            onPress: () => setSchoolView('spiral') },
                { glyph: '✦', label: 'FIELD',    color: SOL_THEME.headmaster, onPress: () => setSchoolTodayOpen(true) },
                // (SIGIL removed → Zodiac's Sigil Forge is the single sigil home; keeps grid a clean 3×4)
              ];
              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {TOOLS.map(tool => (
                    <TouchableOpacity key={tool.label} onPress={tool.onPress} activeOpacity={0.78}
                      style={{ width: '23.5%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: tool.color + '44', backgroundColor: tool.color + '0C', alignItems: 'center', gap: 5 }}>
                      <View>
                        <Text style={{ color: tool.color, fontSize: 15, fontFamily: SMONO }}>{tool.glyph}</Text>
                        {tool.badge && (
                          <View style={{ position: 'absolute', top: -4, right: -10, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: tool.color, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                            <Text style={{ color: '#000', fontSize: 8, fontWeight: '800', fontFamily: SMONO }}>{tool.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: tool.color, fontSize: 7.5, fontWeight: '700', fontFamily: SMONO, letterSpacing: 0.5 }} numberOfLines={1}>{tool.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}

            {/* ── START HERE — minimizable, sits beneath the tools grid (#255e) ── */}
            {dailySuggestion && totalStudied === 0 && startHereMin && (
              <TouchableOpacity onPress={() => setStartHereMin(false)} activeOpacity={0.7}
                style={{ marginBottom: 14, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: dailySuggestion.domain.color + '33', backgroundColor: dailySuggestion.domain.color + '0A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: dailySuggestion.domain.color, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700' }}>{dailySuggestion.domain.glyph} START HERE</Text>
                <Text style={{ color: dailySuggestion.domain.color + 'AA', fontSize: 10 }}>▸ open</Text>
              </TouchableOpacity>
            )}
            {dailySuggestion && totalStudied === 0 && !startHereMin && (
              <TouchableOpacity
                onPress={async () => { setSelectedDomain(dailySuggestion.domain); await openSubjectDetail(dailySuggestion.subject, dailySuggestion.domain); }}
                style={{ marginBottom: 14, padding: 12, borderRadius: 12, backgroundColor: dailySuggestion.domain.color + '12', borderWidth: 1, borderColor: dailySuggestion.domain.color + '33', flexDirection: 'row', alignItems: 'center', gap: 10 }}
                activeOpacity={0.8}
              >
                <Text style={{ color: dailySuggestion.domain.color, fontSize: 20 }}>{dailySuggestion.domain.glyph}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 1.5, marginBottom: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>START HERE</Text>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); setStartHereMin(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>▾</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{dailySuggestion.subject.name}</Text>
                </View>
                <Text style={{ color: dailySuggestion.domain.color, fontSize: 14 }}>→</Text>
              </TouchableOpacity>
            )}

            {/* PORTALS removed — mycelium / time-braid / lamague now live in the clean TOOLS grid above (#255c) */}

            {/* ── SAVED SUBJECTS ────────────────────────────────────────── */}
            {subjectFavorites.size > 0 && (() => {
              const allSubjectsFlat = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.map(s => ({ subject: s, domain: d })));
              const saved = allSubjectsFlat.filter(({ subject }) => subjectFavorites.has(subject.name));
              return (
                <View style={{ marginBottom: 14 }}>
                  <TouchableOpacity onPress={() => setSavedCollapsed(c => !c)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: savedCollapsed ? 0 : 10 }} activeOpacity={0.7}>
                    <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: SOL_THEME.primary + '88' }} />
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 2, flex: 1 }}>SAVED  ({saved.length})</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{savedCollapsed ? '▶' : '▼'}</Text>
                  </TouchableOpacity>
                  {!savedCollapsed && saved.map(({ subject, domain }) => {
                    const sessionCount = subjectSessionCounts[subject.name] || 0;
                    return (
                      <TouchableOpacity
                        key={subject.name}
                        onPress={() => { setSelectedDomain(domain); openSubjectDetail(subject, domain); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '44', backgroundColor: domain.color + '08', marginBottom: 8 }}
                        activeOpacity={0.75}
                      >
                        <Text style={{ color: domain.color, fontSize: 22 }}>{domain.glyph}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{subject.name}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 2 }}>{domain.label} · {sessionCount > 0 ? `${sessionCount} session${sessionCount !== 1 ? 's' : ''}` : subject.layer}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 3 }}>
                          <Text style={{ color: domain.color, fontSize: 12, fontWeight: '700' }}>Dive →</Text>
                          {sessionCount > 0 && <Text style={{ color: '#4CAF50', fontSize: 9 }}>✓ studied</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}

            {/* Night Ledger ambient banner — midnight to 4am */}
            {(() => {
              const h = new Date().getHours();
              if (h < 0 || h >= 4) return null;
              return (
                <View style={{ marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFFFFF11', backgroundColor: '#07070D' }}>
                  <Text style={{ color: '#FFFFFF44', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2.5, fontWeight: '700', marginBottom: 6 }}>◎ NIGHT LEDGER</Text>
                  <Text style={{ color: '#FFFFFF55', fontSize: 12, fontStyle: 'italic', lineHeight: 18 }}>
                    The school is quietest now. What you study here is recorded in the Night Ledger — a separate thread in your Chronicle.
                  </Text>
                </View>
              );
            })()}

            {/* Vigil banner */}
            {vigil && (() => {
              const daysLeft = 7 - Math.floor((Date.now() - new Date(vigil.startDate).getTime()) / 86400000);
              const progress = (7 - daysLeft) / 7;
              return (
                <TouchableOpacity
                  onPress={async () => {
                    const domain = MYSTERY_SCHOOL_DOMAINS.find(d => d.subjects.some(s => s.name === vigil.subjectName)) || null;
                    const subject = domain?.subjects.find(s => s.name === vigil.subjectName) || null;
                    if (subject && domain) { setSelectedDomain(domain); openSubjectDetail(subject, domain); }
                  }}
                  style={{ marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: vigil.domainColor + '55', backgroundColor: vigil.domainColor + '0C' }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Text style={{ color: vigil.domainColor, fontSize: 22 }}>{vigil.domainGlyph}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: vigil.domainColor, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 2 }}>◎ VIGIL</Text>
                      <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{vigil.subjectName}</Text>
                    </View>
                    <Text style={{ color: vigil.domainColor, fontSize: 12, fontWeight: '700' }}>{daysLeft}d left</Text>
                  </View>
                  <View style={{ height: 3, borderRadius: 2, backgroundColor: vigil.domainColor + '22', overflow: 'hidden' }}>
                    <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: vigil.domainColor + 'BB', borderRadius: 2 }} />
                  </View>
                </TouchableOpacity>
              );
            })()}

            {/* ── RECENT DIVES ─────────────────────────────────────────── */}
            {diveLog.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <TouchableOpacity onPress={() => setDivesCollapsed(c => !c)} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: divesCollapsed ? 0 : 8 }} activeOpacity={0.7}>
                  <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: SOL_THEME.headmaster + '88', marginRight: 8 }} />
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', flex: 1 }}>RECENT DIVES  ({diveLog.length})</Text>
                  {!divesCollapsed && <TouchableOpacity onPress={() => setSchoolView('dive-log')}><Text style={{ color: SOL_THEME.textMuted, fontSize: 10, opacity: 0.6, marginRight: 10 }}>all →</Text></TouchableOpacity>}
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{divesCollapsed ? '▶' : '▼'}</Text>
                </TouchableOpacity>
                {!divesCollapsed && (
                  <View style={{ gap: 6 }}>
                    {diveLog.slice(0, 3).map(d => (
                      <TouchableOpacity key={d.id}
                        onPress={async () => {
                          const domain = MYSTERY_SCHOOL_DOMAINS.find(dom => dom.label === d.domainLabel) || null;
                          const subject = domain?.subjects.find(s => s.name === d.subjectName)
                            || customSubjects.find(s => s.name === d.subjectName)
                            || (d.domainLabel === 'Open Seat' ? { name: d.subjectName, domain: 'Open Seat', layer: d.layer, description: `A free-form study session on "${d.subjectName}".` } as Subject : null);
                          if (!subject) return;
                          if (domain) setSelectedDomain(domain);
                          if (d.domainLabel !== 'Open Seat') await openSubjectDetail(subject, domain);
                          else enterStudySession(subject, null);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, backgroundColor: d.domainColor + '0D', borderWidth: 1, borderColor: d.domainColor + '33' }}
                        activeOpacity={0.7}>
                        <Text style={{ color: d.domainColor, fontSize: 20 }}>{d.domainGlyph}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{d.subjectName}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 1 }}>{d.domainLabel} · {TEACHER_NAMES[d.teacher] || d.teacher} · {d.date}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          {d.timeOfDay === 'night' && <Text style={{ color: '#7B8CDE', fontSize: 11, opacity: 0.8 }}>◎</Text>}
                          <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: LAYER_COLORS[d.layer] + '22' }}>
                            <Text style={{ color: LAYER_COLORS[d.layer], fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[d.layer]}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Title + Field stage banner */}
            {diveLog.length > 0 && (() => {
              const titleData = getDiveTitle(diveLog.length);
              return (
                <View style={{ marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: titleData.color + '44', backgroundColor: titleData.color + '0C' }}>
                  <Text style={{ color: titleData.color, fontSize: 28, lineHeight: 34 }}>{titleData.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: titleData.color, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>{titleData.title}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>
                      {diveLog.length} {diveLog.length === 1 ? 'dive' : 'dives'}{titleData.next ? ` · ${titleData.next.remaining} until ${titleData.next.title}` : ' · You are at the frontier.'}
                    </Text>
                  </View>
                  {fieldStage && (
                    <View style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: SOL_THEME.primary + '18', borderWidth: 1, borderColor: SOL_THEME.primary + '33' }}>
                      <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.8 }}>{fieldStage}</Text>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* ── SPIRAL (inline expandable) ─────────────────────────── */}
            {totalStudied > 0 && (() => {
              const SMONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';
              const exploredCount = MYSTERY_SCHOOL_DOMAINS.filter(d => d.subjects.some(s => studiedSubjects.has(s.name))).length;
              const overallPct = Math.round((totalStudied / totalSubjects) * 100);
              const domainRows = MYSTERY_SCHOOL_DOMAINS
                .map(d => ({ domain: d, studied: d.subjects.filter(s => studiedSubjects.has(s.name)).length, total: d.subjects.length }))
                .filter(r => r.studied > 0)
                .sort((a, b) => (b.studied / b.total) - (a.studied / a.total));
              return (
                <View style={{ marginBottom: 14 }}>
                  <TouchableOpacity onPress={() => setSpiralCollapsed(c => !c)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spiralCollapsed ? 0 : 10 }} activeOpacity={0.7}>
                    <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: SOL_THEME.primary + '88' }} />
                    <Text style={{ color: SOL_THEME.primary + '99', fontSize: 9, fontFamily: SMONO, letterSpacing: 2, fontWeight: '700', flex: 1 }}>◈ SPIRAL</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginRight: 2 }}>{overallPct}%</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{spiralCollapsed ? '▶' : '▼'}</Text>
                  </TouchableOpacity>
                  {!spiralCollapsed && (
                    <View style={{ gap: 8 }}>
                      {/* Stats row */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {[
                          { value: totalStudied, label: 'subjects', sub: `of ${totalSubjects}` },
                          { value: exploredCount, label: 'domains', sub: `of ${MYSTERY_SCHOOL_DOMAINS.length}` },
                          { value: diveLog.length, label: 'dives', sub: 'total' },
                        ].map(stat => (
                          <View key={stat.label} style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                            <Text style={{ color: SOL_THEME.primary, fontSize: 20, fontWeight: '700', lineHeight: 24 }}>{stat.value}</Text>
                            <Text style={{ color: SOL_THEME.text, fontSize: 10, fontWeight: '600', marginTop: 1 }}>{stat.label}</Text>
                            <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, marginTop: 1 }}>{stat.sub}</Text>
                          </View>
                        ))}
                      </View>
                      {/* Overall bar */}
                      <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: SMONO, fontWeight: '700', letterSpacing: 1.5 }}>OVERALL</Text>
                          <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontWeight: '700' }}>{overallPct}%</Text>
                        </View>
                        <View style={{ height: 4, backgroundColor: SOL_THEME.border, borderRadius: 2, overflow: 'hidden' }}>
                          <View style={{ height: 4, width: `${overallPct}%`, backgroundColor: SOL_THEME.primary, borderRadius: 2 }} />
                        </View>
                        {fieldStage && (
                          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: SOL_THEME.primary + '16', borderWidth: 1, borderColor: SOL_THEME.primary + '30' }}>
                              <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontWeight: '700', fontFamily: SMONO, letterSpacing: 1 }}>{fieldStage}</Text>
                            </View>
                          </View>
                        )}
                      </View>
                      {/* Domain rows */}
                      {domainRows.map(({ domain, studied, total }) => {
                        const pct = Math.round((studied / total) * 100);
                        return (
                          <TouchableOpacity key={domain.id}
                            onPress={() => { setSelectedDomain(domain); setSchoolView('domain'); }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: domain.color + '08', borderWidth: 1, borderColor: domain.color + '2A' }}
                            activeOpacity={0.75}>
                            <Text style={{ color: domain.color, fontSize: 16, width: 22, textAlign: 'center' }}>{domain.glyph}</Text>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                <Text style={{ color: SOL_THEME.text, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{t(domain.label)}</Text>
                                <Text style={{ color: studied === total ? domain.color : SOL_THEME.textMuted, fontSize: 10, fontWeight: studied === total ? '700' : '400' }}>{studied}/{total}{studied === total ? ' ✦' : ''}</Text>
                              </View>
                              <View style={{ height: 3, backgroundColor: domain.color + '22', borderRadius: 2, overflow: 'hidden' }}>
                                <View style={{ height: 3, width: `${pct}%`, backgroundColor: domain.color, borderRadius: 2 }} />
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity onPress={() => setSchoolView('spiral')}
                        style={{ alignItems: 'center', paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.primary + '30', backgroundColor: SOL_THEME.primary + '06' }}>
                        <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontFamily: SMONO, fontWeight: '700', letterSpacing: 1 }}>FULL SPIRAL →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })()}

            {/* DEPTH TOOLS bar deleted — Grimoire/Letters/Sigil were dupes of the main grid;
                Shadow Parts moved into the FIELD modal. One coherent grid now. */}


            {/* ── TODAY'S DOOR (returning user) ────────────────────────── */}
            {totalStudied > 0 && dailySuggestion && (
              <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: dailySuggestion.domain.color + '66', backgroundColor: dailySuggestion.domain.color + '0C', overflow: 'hidden', marginBottom: 14 }}>
                {!todaysDoorCollapsed && (
                  <Text style={{ position: 'absolute', right: -10, top: -16, fontSize: 110, color: dailySuggestion.domain.color + '0D', lineHeight: 120, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{dailySuggestion.domain.glyph}</Text>
                )}
                <View style={{ padding: 16 }}>
                  {/* Header row: label + minimize toggle */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: todaysDoorCollapsed ? 0 : 10 }}>
                    <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => { setSelectedDomain(dailySuggestion.domain); setSchoolView('domain'); }}>
                      <Text style={{ color: dailySuggestion.domain.color + 'AA', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700' }}>◎ TODAY'S DOOR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTodaysDoorCollapsed(c => !c)} style={{ padding: 4 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ color: dailySuggestion.domain.color + 'AA', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{todaysDoorCollapsed ? '▸' : '▾'}</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Expanded content */}
                  {!todaysDoorCollapsed && (
                    <>
                      <TouchableOpacity
                        onPress={() => { setSelectedDomain(dailySuggestion.domain); setSchoolView('domain'); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ color: dailySuggestion.domain.color, fontSize: 40, lineHeight: 46 }}>{dailySuggestion.domain.glyph}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: SOL_THEME.text, fontSize: 17, fontWeight: '700', letterSpacing: 0.3 }}>{t(dailySuggestion.domain.label)}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 3, lineHeight: 16 }} numberOfLines={2}>{dailySuggestion.domain.description}</Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={async () => { setSelectedDomain(dailySuggestion.domain); await openSubjectDetail(dailySuggestion.subject, dailySuggestion.domain); }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, backgroundColor: dailySuggestion.domain.color + '18', borderWidth: 1, borderColor: dailySuggestion.domain.color + '44' }}
                        activeOpacity={0.75}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 2 }}>TODAY'S SUBJECT</Text>
                          <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{dailySuggestion.subject.name}</Text>
                        </View>
                        <Text style={{ color: dailySuggestion.domain.color, fontSize: 13, fontWeight: '700' }}>Dive →</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* School Intelligence — "The school watches you" */}
            {schoolNotice && schoolNotice.subjects.length > 0 && (
              <View style={{ marginBottom: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44', backgroundColor: SOL_THEME.headmaster + '08' }}>
                <TouchableOpacity onPress={() => setSchoolNoticeCollapsed(c => !c)} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: schoolNoticeCollapsed ? 14 : 6 }} activeOpacity={0.8}>
                  <Text style={{ flex: 1, color: SOL_THEME.headmaster, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5 }}>
                    {schoolNotice.type === 'avoidance' ? '⊙ THE SCHOOL NOTICES' :
                     schoolNotice.type === 'cluster' ? '⊙ THE SCHOOL NOTICES' :
                     schoolNotice.type === 'gap' ? '⊙ STRUCTURAL GAP DETECTED' :
                     schoolNotice.type === 'ready' ? '⊙ YOU ARE READY' :
                     '⊙ RECOMMENDED FOR YOU NOW'}
                  </Text>
                  <Text style={{ color: SOL_THEME.headmaster + 'AA', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{schoolNoticeCollapsed ? '▸' : '▾'}</Text>
                </TouchableOpacity>
                {!schoolNoticeCollapsed && (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>{schoolNotice.message}</Text>
                    <View style={{ gap: 8 }}>
                      {schoolNotice.subjects.map(({ subject, domain }) => (
                        <TouchableOpacity
                          key={subject.name}
                          onPress={async () => { setSelectedDomain(domain); await openSubjectDetail(subject, domain); }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, backgroundColor: domain.color + '12', borderWidth: 1, borderColor: domain.color + '33' }}
                          activeOpacity={0.75}
                        >
                          <Text style={{ color: domain.color, fontSize: 18 }}>{domain.glyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '600' }}>{subject.name}</Text>
                            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{domain.label} · {LAYER_LABELS[subject.layer]}</Text>
                          </View>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>→</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* ── ✦ TODAY · YOUR FIELD — opened from the FIELD grid tile as a full-screen modal (declutters home) ── */}
            <Modal visible={schoolTodayOpen} animationType="slide" onRequestClose={() => setSchoolTodayOpen(false)}>
            <View style={{ flex: 1, backgroundColor: '#06060E' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: SOL_THEME.headmaster + '33' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 14 }}>✦</Text>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700' }}>TODAY · YOUR FIELD</Text>
              </View>
              <TouchableOpacity onPress={() => setSchoolTodayOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>✕ CLOSE</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* Shadow Parts — relocated from the old depth bar; personal inner work belongs in your field */}
            <TouchableOpacity onPress={() => { setSchoolTodayOpen(false); setSchoolView('shadow-parts'); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#B71C1C44', backgroundColor: '#B71C1C0C', marginBottom: 14 }} activeOpacity={0.78}>
              <Text style={{ color: '#E06C6C', fontSize: 18 }}>◌</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>Shadow Parts</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 1 }}>Name and work with your inner parts</Text>
              </View>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>→</Text>
            </TouchableOpacity>

            {/* Active field trial */}
            {activeFieldTrial && !activeFieldTrial.completed && (
              <TouchableOpacity
                style={{ marginBottom: 14, padding: 14, borderRadius: 10, borderWidth: 2, borderColor: SOL_THEME.primary + '88', backgroundColor: SOL_THEME.primary + '0E' }}
                onPress={() => Alert.alert('⚡ FIELD TRIAL', activeFieldTrial.prompt, [
                  { text: 'Not Now', style: 'cancel' },
                  { text: '⊚ Take It to Sol', onPress: async () => {
                    await savePersona('sol');
                    await savePendingSubject(`FIELD TRIAL: ${activeFieldTrial.prompt}`);
                    const trials = await getFieldTrials();
                    const updated = trials.map((t: any) => t.id === activeFieldTrial.id ? { ...t, completed: true } : t);
                    await saveFieldTrials(updated);
                    setActiveFieldTrial(null);
                    router.push('/(tabs)/');
                  }},
                ])}
                activeOpacity={0.8}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 }}>⚡ FIELD TRIAL UNLOCKED</Text>
                <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }} numberOfLines={3}>{activeFieldTrial.prompt}</Text>
                <Text style={{ color: SOL_THEME.primary, fontSize: 11, marginTop: 8, fontWeight: '700' }}>Tap to engage →</Text>
              </TouchableOpacity>
            )}

            {/* Milestone moment */}
            {shownMilestone && (
              <TouchableOpacity onPress={() => setShownMilestone(null)}
                style={{ marginBottom: 14, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: SOL_THEME.headmaster, backgroundColor: SOL_THEME.headmaster + '12', alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 28, marginBottom: 6 }}>✦</Text>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, marginBottom: 4 }}>
                  {shownMilestone} SUBJECTS EXPLORED
                </Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
                  {shownMilestone === 10 ? 'The field has taken root.' :
                   shownMilestone === 25 ? 'A quarter of the school is yours.' :
                   shownMilestone === 50 ? 'The halfway mark. The field knows you.' :
                   shownMilestone === 100 ? 'One hundred subjects. The school bows.' :
                   'All 192 subjects. You are the school now.'}
                </Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 8 }}>Tap to dismiss</Text>
              </TouchableOpacity>
            )}

            {/* Open Seat */}
            <View style={{ marginBottom: 16 }}>
              <TouchableOpacity
                onPress={() => setOpenSeatCollapsed(c => !c)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44', backgroundColor: SOL_THEME.headmaster + '08' }}
                activeOpacity={0.7}
              >
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 12 }}>⊙</Text>
                <Text style={{ flex: 1, color: SOL_THEME.headmaster, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700' }}>OPEN SEAT</Text>
                {openSeatCollapsed && customSubjects.length > 0 && (
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>{customSubjects.length} saved</Text>
                )}
                <Text style={{ color: SOL_THEME.headmaster + '88', fontSize: 11 }}>{openSeatCollapsed ? '▶' : '▼'}</Text>
              </TouchableOpacity>
              {!openSeatCollapsed && (
                <View style={{ marginTop: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '33', backgroundColor: SOL_THEME.headmaster + '05' }}>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: customSubjects.length === 0 ? 0 : 12 }}>
                    <TextInput
                      style={{ flex: 1, backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44', paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 }}
                      placeholder="Any topic, tradition, question..."
                      placeholderTextColor={SOL_THEME.textMuted}
                      value={openSeatTopic}
                      onChangeText={setOpenSeatTopic}
                      onSubmitEditing={enterOpenSeat}
                      returnKeyType="go"
                    />
                    <TouchableOpacity onPress={enterOpenSeat} disabled={!openSeatTopic.trim()}
                      style={{ paddingHorizontal: 14, borderRadius: 10, backgroundColor: openSeatTopic.trim() ? SOL_THEME.headmaster : SOL_THEME.headmaster + '33', justifyContent: 'center' }}>
                      <Text style={{ color: openSeatTopic.trim() ? '#000' : SOL_THEME.textMuted, fontSize: 14, fontWeight: '700' }}>⊙</Text>
                    </TouchableOpacity>
                  </View>
                  {customSubjects.length === 0 && (
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 18, fontStyle: 'italic' }}>
                      The seat is open. Name anything you're curious about — the school has no walls here.
                    </Text>
                  )}
                  {customSubjects.length > 0 && (
                    <View style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700' }}>PREVIOUS OPEN SEATS</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 9 }}>{customSubjects.length} saved</Text>
                      </View>
                      {customSubjects.slice(0, 8).map(s => {
                        const count = subjectSessionCounts[s.name] || 0;
                        const lastDate = studyDates[s.name];
                        const daysAgo = lastDate ? Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000) : null;
                        return (
                          <TouchableOpacity key={s.name} onPress={() => enterStudySession(s, null)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 9, backgroundColor: SOL_THEME.background, borderWidth: 1, borderColor: SOL_THEME.headmaster + '33' }}
                            activeOpacity={0.7}>
                            <Text style={{ color: SOL_THEME.headmaster, fontSize: 16 }}>⊙</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{s.name}</Text>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 1 }}>
                                {count > 0 ? `${count} session${count !== 1 ? 's' : ''}` : 'not yet studied'}
                                {daysAgo !== null ? ` · ${daysAgo === 0 ? 'today' : `${daysAgo}d ago`}` : ''}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={(e) => { e.stopPropagation?.(); deleteCustomSubject(s.name); }}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              style={{ padding: 4 }}>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
                            </TouchableOpacity>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Pattern notice — Sol-voiced pattern banner, dismissible, max once/week */}
            {patternNotice && (
              <View style={{ marginBottom: 14, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.primary + '55', backgroundColor: SOL_THEME.primary + '08' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 18 }}>◑</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 4 }}>SOL NOTICES A PATTERN</Text>
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{patternNotice}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      setPatternNotice(null);
                      await AsyncStorage.setItem('sol_pattern_dismissed', new Date().toISOString().split('T')[0]);
                    }}
                    style={{ padding: 4 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Weekly Synthesis letter — collapsible */}
            {weeklyDiveLetter && (
              <TouchableOpacity
                onPress={() => setWeeklyLetterExpanded(e => !e)}
                style={{ marginBottom: 14, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.headmaster + '08', overflow: 'hidden' }}
                activeOpacity={0.85}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
                  <Text style={{ color: SOL_THEME.headmaster, fontSize: 18 }}>✉</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: SOL_THEME.headmaster, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 2 }}>WEEKLY SYNTHESIS</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>Week of {weeklyDiveLetter.weekOf}</Text>
                  </View>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>{weeklyLetterExpanded ? '▲' : '▼'}</Text>
                </View>
                {weeklyLetterExpanded && (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: SOL_THEME.headmaster + '22' }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 22, marginTop: 12, fontStyle: 'italic' }}>{weeklyDiveLetter.text}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Search + Resonance — collapsible */}
            <View style={{ marginBottom: 14 }}>
              <TouchableOpacity
                onPress={() => setSearchOpen(o => !o)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}
                activeOpacity={0.7}
              >
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>⌕</Text>
                <Text style={{ flex: 1, color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700' }}>SEARCH & RESONANCE</Text>
                {resonanceLinks.length > 0 && !searchOpen && <Text style={{ color: SOL_THEME.primary + 'AA', fontSize: 10 }}>{resonanceLinks.length} links</Text>}
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{searchOpen ? '▼' : '▶'}</Text>
              </TouchableOpacity>
              {searchOpen && (
                <View style={{ marginTop: 8, gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, paddingHorizontal: 12, gap: 8 }}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>⌕</Text>
                    <TextInput
                      style={{ flex: 1, color: SOL_THEME.text, fontSize: 13, paddingVertical: 9 }}
                      placeholder={`Search all ${MYSTERY_SCHOOL_DOMAINS.reduce((n, d) => n + d.subjects.length, 0)} subjects...`}
                      placeholderTextColor={SOL_THEME.textMuted}
                      value={globalSearch}
                      onChangeText={setGlobalSearch}
                      autoCapitalize="none"
                    />
                    {globalSearch.length > 0 && <TouchableOpacity onPress={() => setGlobalSearch('')}><Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text></TouchableOpacity>}
                  </View>
                  {(resonanceLinks.length > 0 || mode === 'adept') && (
                    <View>
                      <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 8, fontWeight: '700' }}>
                        {mode === 'adept' ? '⟁ AURA RESONANCE LINKS' : '⟁ RESONANCE LINKS'}
                      </Text>
                      {resonanceLinks.length === 0 && mode === 'adept' && (
                        <View style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, backgroundColor: SOL_THEME.surface }}>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }}>Study more subjects to activate cross-domain resonance detection.</Text>
                        </View>
                      )}
                      {resonanceLinks.map(({ domain, reason }) => (
                        <TouchableOpacity key={domain.id}
                          style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '55', backgroundColor: domain.color + '0D', marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                          onPress={() => { setSelectedDomain(domain); setSchoolView('domain'); }} activeOpacity={0.75}>
                          <Text style={{ color: domain.color, fontSize: 18 }}>{domain.glyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: domain.color, fontSize: 11, fontWeight: '700', marginBottom: 2 }}>{t(domain.label)}</Text>
                            <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, lineHeight: 16 }}>{reason}</Text>
                          </View>
                          <Text style={{ color: domain.color + '99', fontSize: 14 }}>→</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
            {searchOpen && globalSearch.length > 0 && (() => {
              const q = globalSearch.toLowerCase();
              const results: { subject: Subject; domain: SubjectDomain }[] = [];
              MYSTERY_SCHOOL_DOMAINS.forEach(d => d.subjects.forEach(s => {
                if (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.traditions?.some(t => t.toLowerCase().includes(q))) {
                  results.push({ subject: s, domain: d });
                }
              }));
              if (results.length === 0) return (
                <View style={{ marginBottom: 14, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>"{globalSearch}" isn't in the school yet — but the school can grow.</Text>
                  <TouchableOpacity onPress={() => { setOpenSeatTopic(globalSearch); setGlobalSearch(''); }} style={{ marginTop: 8 }}>
                    <Text style={{ color: SOL_THEME.headmaster, fontSize: 12, fontWeight: '700' }}>⊙ Study this with Open Seat →</Text>
                  </TouchableOpacity>
                </View>
              );
              return (
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, fontWeight: '700', marginBottom: 8 }}>{results.length} RESULTS</Text>
                  {results.slice(0, 12).map(({ subject, domain }) => (
                    <TouchableOpacity key={subject.name} onPress={() => { setSelectedDomain(domain); openSubjectDetail(subject, domain); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: domain.color + '44', marginBottom: 6 }}
                      activeOpacity={0.75}>
                      <Text style={{ color: domain.color, fontSize: 20 }}>{domain.glyph}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>{subject.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={{ color: domain.color, fontSize: 10 }}>{t(domain.label)}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                          <Text style={{ color: LAYER_COLORS[subject.layer], fontSize: 10 }}>{t(LAYER_LABELS[subject.layer])}</Text>
                          {studiedSubjects.has(subject.name) && <Text style={{ color: '#4CAF50', fontSize: 10 }}>· ✓</Text>}
                        </View>
                      </View>
                      <Text style={{ color: domain.color + '99', fontSize: 13 }}>→</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}


            </ScrollView>
            </View>
            </Modal>
            {/* ── end ✦ TODAY field modal — DOMAINS now lead the home view ── */}

            {/* Domain grid — wing selectors */}
            <TouchableOpacity onPress={() => setDomainsOpen(o => !o)} activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: SOL_THEME.headmaster }} />
              <Text style={{ color: SOL_THEME.headmaster, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', flex: 1 }}>DOMAINS</Text>
              <Text style={{ color: SOL_THEME.headmaster + '99', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{domainsOpen ? '▾' : '▸'}</Text>
            </TouchableOpacity>
            {domainsOpen && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 2, paddingRight: 16 }} style={{ marginBottom: 12 }}>
              {([
                { id: 'all',           label: 'ALL',       glyph: '◬', accent: SOL_THEME.headmaster },
                { id: 'contemplative', label: 'INNER',     glyph: '☽', accent: '#9B7FD4' },
                { id: 'secular',       label: 'OUTER',     glyph: '⟁', accent: '#4A9EFF' },
                { id: 'lycheetah',     label: 'THRESHOLD', glyph: '⧟', accent: '#7B68EE' },
                { id: 'void',          label: 'VOID',      glyph: '◌', accent: '#8B00CC' },
              ] as const).map(({ id, label, glyph, accent }) => {
                const active = domainFilter === id;
                return (
                  <TouchableOpacity key={id} onPress={() => setDomainFilter(id)}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
                      backgroundColor: active ? accent + '22' : '#0D0D18',
                      borderWidth: 1, borderColor: active ? accent : accent + '33',
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      shadowColor: active ? accent : 'transparent', shadowOpacity: 0.3, shadowRadius: 6, elevation: active ? 3 : 0 }}>
                    <Text style={{ color: active ? accent : accent + 'AA', fontSize: 12 }}>{glyph}</Text>
                    <Text style={{ color: active ? accent : SOL_THEME.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>}
            {domainsOpen && (() => {
              const isVisible = (d: typeof MYSTERY_SCHOOL_DOMAINS[0]) => domainFilter === 'all' ? true
                : domainFilter === 'void' ? d.category === 'void'
                : domainFilter === 'lycheetah' ? d.category === 'lycheetah'
                : domainFilter === 'secular' ? d.category === 'secular'
                : d.category === 'contemplative';
              const visibleCount = MYSTERY_SCHOOL_DOMAINS.filter(isVisible).length;
              const spacers = (3 - (visibleCount % 3)) % 3;
              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {MYSTERY_SCHOOL_DOMAINS.map((domain, idx) => {
                    if (!isVisible(domain)) return null;
                    const studiedCount = domain.subjects.filter(s => studiedSubjects.has(s.name)).length;
                    const total = domain.subjects.length;
                    const pct = total > 0 ? studiedCount / total : 0;
                    const mastered = studiedCount === total && total > 0;
                    const touched = studiedCount > 0;
                    const domainHighStage = domain.subjects.reduce((best, s) => {
                      const stage = subjectMastery[s.name]?.stage || 0;
                      return stage > best ? stage : best;
                    }, 0);
                    const bloomBadge = mastered ? '✦' : domainHighStage >= 1 ? (MASTERY_STAGES[domainHighStage]?.glyph ?? '') : '';
                    return (
                      <Animated.View key={domain.id} style={{ width: '31%', opacity: cardAnims[idx], transform: [{ translateY: cardAnims[idx].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
                        <TouchableOpacity
                          style={{
                            borderRadius: 16,
                            borderWidth: mastered ? 2 : 1,
                            borderColor: mastered ? domain.color : touched ? domain.color + '99' : domain.color + '44',
                            height: 145,
                            overflow: 'hidden',
                            backgroundColor: touched ? domain.color + '0D' : '#080810',
                            shadowColor: mastered ? domain.color : touched ? domain.color : 'transparent',
                            shadowOpacity: mastered ? 0.35 : touched ? 0.15 : 0,
                            shadowRadius: 8, elevation: mastered ? 6 : touched ? 3 : 0,
                          }}
                          onPress={() => enterDomainGated(domain)}
                          activeOpacity={0.75}>
                          {/* Large glyph watermark */}
                          <Text style={{ position: 'absolute', bottom: -10, right: -4, fontSize: 96, color: domain.color + (touched ? '18' : '0D'), lineHeight: 108, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{domain.glyph}</Text>
                          {/* Top section — glyph + badge */}
                          <View style={{ padding: 12, flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                              <Text style={{ color: domain.color, fontSize: 26 }}>{domain.glyph}</Text>
                              {bloomBadge ? <Text style={{ color: mastered ? domain.color : (MASTERY_STAGES[domainHighStage]?.color ?? domain.color + 'CC'), fontSize: 13 }}>{bloomBadge}</Text> : null}
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: mastered ? domain.color : touched ? domain.color + 'EE' : domain.color + 'AA', lineHeight: 15 }} numberOfLines={2}>{t(domain.label)}</Text>
                          </View>
                          {/* Bottom strip — progress */}
                          <View style={{ backgroundColor: domain.color + '1A', paddingHorizontal: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: domain.color + '22', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={{ flex: 1, height: 3, backgroundColor: domain.color + '1A', borderRadius: 2, overflow: 'hidden' }}>
                              <View style={{ height: 3, width: `${Math.round(pct * 100)}%`, backgroundColor: domain.color, borderRadius: 2,
                                shadowColor: domain.color, shadowOpacity: 0.8, shadowRadius: 4, elevation: 2 }} />
                            </View>
                            <Text style={{ fontSize: 8, color: touched ? domain.color : SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700' }}>
                              {touched ? `${Math.round(pct * 100)}%` : '·'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                  {Array.from({ length: spacers }).map((_, i) => (
                    <View key={`sp-${i}`} style={{ width: '31%' }} />
                  ))}
                </View>
              );
            })()}

            <View style={{ marginTop: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: SOL_THEME.border, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: SOL_THEME.textMuted, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' }}>
                {`The Mystery School is not a place you graduate from.\nIt is a way of seeing that, once learned, cannot be unlearned.`}
              </Text>
            </View>

            {/* ── LINEAGE & GRATITUDE ─────────────────────────────────────── */}
            <View style={{ marginTop: 40, paddingTop: 24, borderTopWidth: 1, borderTopColor: SOL_THEME.border + '55' }}>
              <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, marginBottom: 16, textAlign: 'center' }}>LINEAGE & GRATITUDE</Text>

              {[
                { glyph: '☽', name: 'Jane Brideson', role: 'Celtic Old Gods', note: "Artist, storyteller, and keeper of the old ways. The Áes Síde domain was built in gratitude for her life’s work bringing the ancient Irish pantheon to new voices." },
                { glyph: '∿', name: 'Dean Radin', role: 'Noetic & Psi Science', note: 'Chief Scientist, Institute of Noetic Sciences. Decades of rigorous psi research that made the Noetic domain possible — precognition, entanglement, the science of consciousness at the edge.' },
                { glyph: 'Ψ', name: 'Carl Jung', role: 'Depth Psychology', note: 'The shadow, the collective unconscious, individuation, synchronicity — foundational architecture for how the Mystery School understands the psyche.' },
                { glyph: '∇', name: 'Rupert Sheldrake', role: 'Morphic Resonance', note: 'The hypothesis that nature has memory, that forms are shaped by the habits of their kind across time. A living challenge to scientific orthodoxy.' },
                { glyph: '⟟', name: 'Lycheetah Framework', role: 'LAMAGUE · CASCADE · HARMONIA', note: 'The ten frameworks, the grammar, the council — forged from a 1,402-page seed into 10+ repositories of continuous development. The cathedral was built before anyone arrived to visit it.' },
                { glyph: '◈', name: 'Sonny Moore', role: 'Sonic Architecture · Skrillex', note: 'The Sonic Architecture domain exists because of him. The creator of the Lycheetah Framework has called his music acoustic artillery — a technical assessment. Sound precision-engineered to break something open that cannot be closed again. It carried people through dark rooms and long roads and fields. The school holds that.' },
                { glyph: '✦', name: 'The Seekers', role: 'Every practitioner', note: 'Everyone who dives, asks hard questions, sits with uncertainty, and comes back the next day. The School is only real because you showed up.' },
              ].map((entry, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 14, marginBottom: 20, paddingBottom: 20, borderBottomWidth: i < 6 ? 1 : 0, borderBottomColor: SOL_THEME.border + '33' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44', backgroundColor: SOL_THEME.headmaster + '0A', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Text style={{ fontSize: 16, color: SOL_THEME.headmaster }}>{entry.glyph}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: SOL_THEME.text, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>{entry.name}</Text>
                    <Text style={{ fontSize: 10, color: SOL_THEME.headmaster, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 6 }}>{entry.role.toUpperCase()}</Text>
                    <Text style={{ fontSize: 12, color: SOL_THEME.textMuted, lineHeight: 18, fontStyle: 'italic' }}>{entry.note}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── DOMAIN ───────────────────────────────────────────────────────── */}
        {schoolView === 'domain' && selectedDomain && (() => {
          const domain = selectedDomain;
          const studiedInDomain = domain.subjects.filter(s => studiedSubjects.has(s.name)).length;
          const recommendedLayer = stageToLayer(fieldStage);
          const layerOrder: SchoolLayer[] = fieldStage
            ? [recommendedLayer, ...(['FOUNDATION', 'MIDDLE', 'EDGE', 'OPEN'] as SchoolLayer[]).filter(l => l !== recommendedLayer), 'VOID']
            : ['FOUNDATION', 'MIDDLE', 'EDGE', 'OPEN', 'VOID'];
          return (
            <>
              <TouchableOpacity onPress={() => { setSelectedDomain(null); setSchoolView('home'); setSubjectSearch(''); }}
                style={{ paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
                  borderRadius: 8, backgroundColor: domain.color + '10', borderWidth: 1, borderColor: domain.color + '33' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: domain.color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>← DOMAINS</Text>
              </TouchableOpacity>

              {/* Domain header */}
              <View style={{ padding: 18, borderRadius: 18, backgroundColor: domain.color + '0D', borderWidth: 1.5, borderColor: domain.color + '55', marginBottom: 16, overflow: 'hidden',
                shadowColor: domain.color, shadowOpacity: 0.2, shadowRadius: 14, elevation: 5 }}>
                {/* Large watermark glyph */}
                <Text style={{ position: 'absolute', top: -14, right: -6, fontSize: 130, color: domain.color + '12', lineHeight: 148, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{domain.glyph}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                  <Text style={{ color: domain.color, fontSize: 48, textShadowColor: domain.color, textShadowRadius: 16 }}>{domain.glyph}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: domain.color, fontSize: 21, fontWeight: '700', letterSpacing: 0.3 }}>{t(domain.label)}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 3 }}>{domain.subjects.length} subjects · {studiedInDomain} studied</Text>
                  </View>
                </View>
                <Text style={{ color: SOL_THEME.text + 'DD', fontSize: 13, lineHeight: 21 }}>{domain.description}</Text>
                <View style={{ marginTop: 14, height: 4, backgroundColor: domain.color + '1A', borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ height: 4, width: `${Math.round((studiedInDomain / domain.subjects.length) * 100)}%`, backgroundColor: domain.color, borderRadius: 2,
                    shadowColor: domain.color, shadowOpacity: 0.8, shadowRadius: 4, elevation: 3 }} />
                </View>
                {studiedInDomain === domain.subjects.length && (
                  <TouchableOpacity
                    onPress={() => { setInitiationDomain(domain); setInitiationAddress(initiations[domain.id]?.address || ''); setSchoolView('initiation'); }}
                    style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, backgroundColor: domain.color + '18', borderWidth: 1, borderColor: domain.color + '55' }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: domain.color, fontSize: 14 }}>✦</Text>
                    <Text style={{ color: domain.color, fontSize: 13, fontWeight: '700' }}>
                      {initiations[domain.id] ? 'View Your Initiation' : 'Domain Complete — Enter the Rite'}
                    </Text>
                    <Text style={{ color: domain.color, fontSize: 13 }}>→</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Search */}
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D0D18', borderRadius: 12, borderWidth: 1, borderColor: domain.color + '33', paddingHorizontal: 14, marginBottom: 12, gap: 10 }}>
                <Text style={{ color: domain.color + '88', fontSize: 14 }}>⌕</Text>
                <TextInput
                  style={{ flex: 1, color: SOL_THEME.text, fontSize: 13, paddingVertical: 11 }}
                  placeholder="Search subjects..."
                  placeholderTextColor={SOL_THEME.textMuted + '88'}
                  value={subjectSearch}
                  onChangeText={setSubjectSearch}
                  autoCapitalize="none"
                />
                {subjectSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setSubjectSearch('')}>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Classroom lessons */}
              {(() => {
                const lessons = CLASSROOM_LESSONS[domain.id];
                if (!lessons || lessons.length === 0) return null;
                const LESSON_COLORS: Record<LessonType, string> = {
                  concept: domain.color,
                  practice: '#4CAF50',
                  reflection: '#9C88FF',
                  paradox: '#FF6B35',
                  lineage: '#F5A623',
                };
                const LESSON_GLYPHS: Record<LessonType, string> = {
                  concept: '◈',
                  practice: '◉',
                  reflection: '◎',
                  paradox: '⚡',
                  lineage: '✦',
                };
                return (
                  <View style={{ marginBottom: 16 }}>
                    {(() => {
                      const isOpen = !classroomClosedIds.has(domain.id);
                      return (
                    <TouchableOpacity
                      onPress={() => setClassroomClosedIds(prev => {
                        const next = new Set(prev);
                        if (next.has(domain.id)) next.delete(domain.id); else next.add(domain.id);
                        return next;
                      })}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: domain.color + '0E', borderRadius: 8, borderWidth: 1, borderColor: domain.color + '33', marginBottom: isOpen ? 10 : 0 }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: domain.color, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5 }}>📖 CLASSROOM</Text>
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: domain.color + '22' }}>
                          <Text style={{ color: domain.color, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>{lessons.length} LESSONS</Text>
                        </View>
                      </View>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{isOpen ? '▼' : '▶'}</Text>
                    </TouchableOpacity>
                      );
                    })()}
                    {!classroomClosedIds.has(domain.id) && lessons.map((lesson, idx) => {
                      const col = LESSON_COLORS[lesson.type];
                      const glyph = LESSON_GLYPHS[lesson.type];
                      return (
                        <View key={idx} style={{ backgroundColor: col + '08', borderRadius: 10, borderWidth: 1, borderColor: col + '33', borderLeftWidth: 3, borderLeftColor: col + 'BB', padding: 12, marginBottom: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <Text style={{ color: col, fontSize: 11 }}>{glyph}</Text>
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: col + '1A', borderWidth: 1, borderColor: col + '55' }}>
                              <Text style={{ color: col, fontSize: 9, fontWeight: '700', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{lesson.type.toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>{lesson.title}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 20 }}>{lesson.body}</Text>
                        </View>
                      );
                    })}
                    {/* Sources hint — shown when classroom is open and domain has subjects with sources */}
                    {!classroomClosedIds.has(domain.id) && domain.subjects.some(s => s.sources && s.sources.length > 0) && (() => {
                      const totalSources = domain.subjects.reduce((acc, s) => acc + (s.sources?.length || 0), 0);
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: domain.color + '22', backgroundColor: domain.color + '06', marginTop: 4 }}>
                          <Text style={{ color: domain.color + '88', fontSize: 11 }}>📚</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', flex: 1 }}>
                            {totalSources} primary sources available · tap any subject card to see reading list
                          </Text>
                        </View>
                      );
                    })()}
                    {/* Gem Forge — only for crystal-lore domain */}
                    {!classroomClosedIds.has(domain.id) && domain.id === 'crystal-lore' && (
                      <View style={{ marginTop: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#7ED6DF55', backgroundColor: '#020D0E', overflow: 'hidden' }}>
                        <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#7ED6DF22', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ fontSize: 18, color: '#7ED6DF' }}>⬡</Text>
                          <View>
                            <Text style={{ color: '#7ED6DF', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 2 }}>GEM FORGE</Text>
                            <Text style={{ color: '#7ED6DF55', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>name and render your personal crystal via FLUX</Text>
                          </View>
                        </View>
                        <View style={{ padding: 14, gap: 10 }}>
                          <View>
                            <Text style={{ color: '#7ED6DF88', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, marginBottom: 5 }}>GEM NAME</Text>
                            <TextInput
                              value={gemName}
                              onChangeText={setGemName}
                              placeholder="e.g. THE SOVEREIGN STONE"
                              placeholderTextColor={'#7ED6DF33'}
                              style={{ backgroundColor: '#060E0F', borderRadius: 8, borderWidth: 1, borderColor: '#7ED6DF33', color: '#7ED6DF', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', padding: 10, letterSpacing: 1 }}
                              maxLength={40}
                              autoCapitalize="characters"
                            />
                          </View>
                          <View>
                            <Text style={{ color: '#7ED6DF88', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, marginBottom: 5 }}>DESCRIBE IT</Text>
                            <TextInput
                              value={gemDesc}
                              onChangeText={setGemDesc}
                              placeholder="deep violet with gold veins, shaped like a teardrop, inner glow like trapped lightning..."
                              placeholderTextColor={'#7ED6DF33'}
                              multiline
                              style={{ backgroundColor: '#060E0F', borderRadius: 8, borderWidth: 1, borderColor: '#7ED6DF33', color: SOL_THEME.text, fontSize: 12, padding: 10, minHeight: 72, textAlignVertical: 'top', lineHeight: 18 }}
                            />
                          </View>
                          <TouchableOpacity onPress={async () => {
                            if (!gemDesc.trim()) return;
                            setGemLoading(true); setGemImage(null);
                            const gName = gemName.trim() || 'a personal gem';
                            const result = await generateImage(`A single luminous gemstone called "${gName}": ${gemDesc.trim()}. Photorealistic crystal, radiant inner light, black background, macro photography style. One centered jewel, no text, no border.`);
                            if (result.image) setGemImage(result.image);
                            else alert(result.error ?? 'Gem Forge failed');
                            setGemLoading(false);
                          }} disabled={!gemDesc.trim() || gemLoading}
                            style={{ paddingVertical: 12, borderRadius: 10, borderWidth: 1.5,
                              borderColor: gemDesc.trim() && !gemLoading ? '#7ED6DFBB' : '#7ED6DF22',
                              backgroundColor: gemDesc.trim() && !gemLoading ? '#7ED6DF18' : 'transparent',
                              alignItems: 'center' }}>
                            <Text style={{ color: gemDesc.trim() && !gemLoading ? '#7ED6DF' : '#7ED6DF44', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 2 }}>
                              {gemLoading ? '· forging ·' : '⬡ FORGE GEM'}
                            </Text>
                          </TouchableOpacity>
                          {gemImage && (
                            <View style={{ alignItems: 'center', gap: 10 }}>
                              <Image source={{ uri: gemImage }} style={{ width: 200, height: 200, borderRadius: 16, borderWidth: 2, borderColor: '#7ED6DF44' }} />
                              {gemName.trim() && <Text style={{ color: '#7ED6DF', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700' }}>{gemName.trim()}</Text>}
                              <TouchableOpacity onPress={async () => {
                                const r = await saveImageToDevice(gemImage);
                                if (!r.ok) Alert.alert('Save failed', r.error ?? 'Unknown error');
                              }} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#7ED6DF44', backgroundColor: '#7ED6DF0D' }}>
                                <Text style={{ color: '#7ED6DF', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1 }}>↓ SAVE TO GALLERY</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Layer sections */}
              {/* ── LAYER FILTER CHIPS (#255 remodel) ── */}
              {(() => {
                const recLayer = fieldStage ? stageToLayer(fieldStage) : null;
                const chips: (SchoolLayer | 'ALL')[] = ['ALL', ...layerOrder.filter(l => domain.subjects.some(s => s.layer === l))];
                return (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 7 }}>
                    {chips.map(chip => {
                      const on = layerFilter === chip;
                      const ccol = chip === 'ALL' ? domain.color : LAYER_COLORS[chip];
                      const isRec = chip !== 'ALL' && chip === recLayer;
                      const cnt = chip === 'ALL' ? domain.subjects.length : domain.subjects.filter(s => s.layer === chip).length;
                      return (
                        <TouchableOpacity key={chip} onPress={() => setLayerFilter(chip)} activeOpacity={0.75}
                          style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
                            borderColor: on ? ccol : ccol + '44', backgroundColor: on ? ccol + '22' : 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={{ color: on ? ccol : ccol + 'AA', fontSize: 10, fontWeight: '700', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                            {chip === 'ALL' ? 'ALL' : LAYER_LABELS[chip].toUpperCase()}
                          </Text>
                          <Text style={{ color: on ? ccol : SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{cnt}</Text>
                          {isRec && <Text style={{ color: ccol, fontSize: 9 }}>⊚</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                );
              })()}

              {/* ── SUBJECT GRID — clean tiles, tap to dive (#255) ── */}
              {(() => {
                const q = subjectSearch.toLowerCase();
                const filtered = domain.subjects.filter(s =>
                  (layerFilter === 'ALL' || s.layer === layerFilter) &&
                  (q === '' || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)));
                const sorted = [...filtered.filter(s => subjectFavorites.has(s.name)), ...filtered.filter(s => !subjectFavorites.has(s.name))];
                if (sorted.length === 0) return (
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 24, fontStyle: 'italic' }}>No subjects here yet.</Text>
                );
                return (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {sorted.map(subject => {
                      const studied = studiedSubjects.has(subject.name);
                      const fav = subjectFavorites.has(subject.name);
                      const mStage = subjectMastery[subject.name]?.stage || 0;
                      const lcol = LAYER_COLORS[subject.layer];
                      const intensity = subject.intensity ?? 0;
                      return (
                        <TouchableOpacity key={subject.name} onPress={() => openSubjectDetail(subject, domain)} activeOpacity={0.78}
                          style={{ width: '48%', minHeight: 96, borderRadius: 12, borderWidth: 1, borderColor: studied ? domain.color + '77' : domain.color + '33',
                            borderLeftWidth: 3, borderLeftColor: lcol + (studied ? 'DD' : '88'),
                            backgroundColor: studied ? domain.color + '12' : '#0A0A12', padding: 11, justifyContent: 'space-between' }}>
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ flex: 1, fontSize: 12.5, fontWeight: '700', color: SOL_THEME.text, lineHeight: 16 }} numberOfLines={2}>{subject.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 }}>
                                {studied && <Text style={{ fontSize: 10, color: '#4CAF50' }}>✓</Text>}
                                {fav && <Text style={{ fontSize: 10, color: '#F5A623' }}>★</Text>}
                                {mStage > 0 && <Text style={{ fontSize: 10, color: MASTERY_STAGES[mStage]?.color }}>{MASTERY_STAGES[mStage]?.glyph}</Text>}
                              </View>
                            </View>
                            <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, lineHeight: 14 }} numberOfLines={2}>{subject.description}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                            <Text style={{ fontSize: 8, color: lcol, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 0.5 }}>
                              {LAYER_LABELS[subject.layer].toUpperCase()}
                            </Text>
                            {(() => {
                              // Unified danger badge — visible BEFORE the dive, on every dangerous
                              // subject (crisis-adjacent / elevated / intensity≥7 / VOID), derived from
                              // the same fields that fire the safety gates so it can never lie.
                              const danger = subjectDanger(subject);
                              if (!danger) return null;
                              const label = subject.layer === 'VOID' ? 'VOID' : intensity >= 7 ? `${intensity}` : 'CARE';
                              return (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, backgroundColor: danger.color + '22' }}>
                                  <Text style={{ fontSize: 8 }}>{danger.icon}</Text>
                                  <Text style={{ fontSize: 7, fontWeight: '700', color: danger.color, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>{label}</Text>
                                </View>
                              );
                            })()}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })()}

              {/* Knowledge synthesis */}
              {(() => {
                const studied = domain.subjects.filter(s => studiedSubjects.has(s.name));
                if (studied.length < 5) return null;
                const synth = domainSynthesis[domain.id];
                const isLoading = synthesisLoading === domain.id;
                return (
                  <View style={{ marginTop: 8, marginBottom: 4, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '44', backgroundColor: domain.color + '08' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: synth ? 10 : 0 }}>
                      <Text style={{ color: domain.color, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', fontWeight: '700', letterSpacing: 1.5 }}>🔮 WHAT HAVE I LEARNED?</Text>
                      {!synth && !isLoading && (
                        <TouchableOpacity onPress={async () => {
                          setSynthesisLoading(domain.id);
                          try {
                            const [apiKey, model] = await Promise.all([getActiveKey(), getModel()]);
                            if (!apiKey) { setSynthesisLoading(null); Alert.alert('No API Key', 'Add a key in Settings to generate your synthesis.', [{ text: 'OK' }]); return; }
                            const res = await sendMessageResilient(
                              [{ role: 'user', content: `The student has studied: ${studied.map(s => s.name).join(', ')} in ${domain.label}. Write a 3-4 sentence synthesis of what they now understand. Be honest about gaps. No preamble.` }],
                              'You are the Headmaster. Synthesize the student\'s learning with precision and honesty. 3-4 sentences. No flattery.',
                              apiKey, (model || 'gemini-2.5-flash') as AIModel, undefined, 'fast', 200, 0.65,
                            );
                            const text = res.text.replace(/\[CONF:[^\]]+\]/g, '').replace(/\[CHIPS:[^\]]+\]/g, '').trim();
                            const updated = { ...domainSynthesis, [domain.id]: text };
                            setDomainSynthesis(updated);
                            await AsyncStorage.setItem('sol_domain_synthesis', JSON.stringify(updated));
                          } catch {}
                          setSynthesisLoading(null);
                        }} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: domain.color + '22' }}>
                          <Text style={{ color: domain.color, fontSize: 10, fontWeight: '700' }}>Synthesize</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {isLoading && <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, fontStyle: 'italic' }}>Magister is reading your path…</Text>}
                    {synth && <Text style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 20 }}>{synth}</Text>}
                    {!synth && !isLoading && <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 4 }}>{studied.length} subjects studied — tap Synthesize for your field report.</Text>}
                  </View>
                );
              })()}

              {/* Question drop */}
              <View style={{ marginTop: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: domain.color + '44', backgroundColor: domain.color + '0D' }}
                  onPress={() => {
                    if (Alert.prompt) {
                      Alert.prompt('Drop a Question', `Leave a question for "${domain.label}":`, async (text) => {
                        if (!text?.trim()) return;
                        const updated = { ...subjectQuestions, [domain.id]: [text.trim(), ...(subjectQuestions[domain.id] || [])].slice(0, 20) };
                        setSubjectQuestions(updated);
                        await AsyncStorage.setItem('sol_subject_questions', JSON.stringify(updated));
                      }, 'plain-text');
                    } else {
                      setTextPromptValue('');
                      setTextPrompt({
                        title: `Question — ${domain.label}`,
                        placeholder: 'What are you wondering about?',
                        current: '',
                        onSubmit: async (text) => {
                          if (!text.trim()) return;
                          const updated = { ...subjectQuestions, [domain.id]: [text.trim(), ...(subjectQuestions[domain.id] || [])].slice(0, 20) };
                          setSubjectQuestions(updated);
                          await AsyncStorage.setItem('sol_subject_questions', JSON.stringify(updated));
                        },
                      });
                    }
                  }}
                  activeOpacity={0.75}>
                  <Text style={{ fontSize: 16, color: domain.color }}>❓</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: domain.color, fontSize: 12, fontWeight: '700' }}>Drop a Question</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 1 }}>Leave a question for this domain.</Text>
                  </View>
                </TouchableOpacity>
                {(subjectQuestions[domain.id] || []).map((q, qi) => (
                  <View key={qi} style={{ marginTop: 6, padding: 10, borderRadius: 8, backgroundColor: domain.color + '0A', borderWidth: 1, borderColor: domain.color + '33', flexDirection: 'row', gap: 8 }}>
                    <Text style={{ color: domain.color, fontSize: 12 }}>❓</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, flex: 1, lineHeight: 17 }}>{q}</Text>
                  </View>
                ))}
              </View>

              {/* Field echoes */}
              {(schoolEchoes[domain.id] || []).length > 0 && (
                <View style={{ marginTop: 4, marginBottom: 16 }}>
                  <Text style={{ fontSize: 10, color: SOL_THEME.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 8, fontWeight: '700' }}>✦ FIELD ECHOES</Text>
                  {(schoolEchoes[domain.id] || []).map(echo => (
                    <View key={echo.id} style={{ padding: 10, borderRadius: 8, backgroundColor: '#9B59B60A', borderWidth: 1, borderColor: '#9B59B633', marginBottom: 6 }}>
                      <Text style={{ color: '#9B59B6', fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 4 }}>✦ {echo.source ? `${echo.source} · ` : ''}{echo.date}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 17 }}>{echo.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          );
        })()}

        {/* ── CURRICULUM ───────────────────────────────────────────────────── */}
        {schoolView === 'curriculum' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 }}>
              <TouchableOpacity onPress={() => { setSchoolView('home'); setCurriculumDraft([]); setCurriculumName(''); setCurriculumDomainPicker(null); }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>← School</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700' }}>Curriculum Maker</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>Build a personal study path</Text>
              </View>
            </View>

            {/* Saved curricula */}
            {curricula.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.5, fontWeight: '700', marginBottom: 10 }}>📋 YOUR PATHS</Text>
                {curricula.map(c => {
                  const completedCount = c.subjects.filter(s => studiedSubjects.has(s)).length;
                  const isActive = activeCurriculumId === c.id;
                  return (
                    <View key={c.id} style={{ padding: 14, borderRadius: 12, borderWidth: isActive ? 2 : 1, borderColor: isActive ? SOL_THEME.primary : SOL_THEME.border, backgroundColor: SOL_THEME.surface, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 15, fontWeight: '700' }}>{c.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          {isActive ? (
                            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: SOL_THEME.primary + '22' }}>
                              <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontWeight: '700' }}>ACTIVE</Text>
                            </View>
                          ) : (
                            <TouchableOpacity onPress={() => setActiveCurriculumId(c.id)}
                              style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border }}>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontWeight: '700' }}>Activate</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => Alert.alert('Delete Curriculum', `Remove "${c.name}"?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteCurriculum(c.id) },
                          ])}>
                            <Text style={{ color: SOL_THEME.textMuted, fontSize: 16 }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={{ height: 3, backgroundColor: SOL_THEME.border, borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                        <View style={{ height: 3, width: `${Math.round((completedCount / c.subjects.length) * 100)}%`, backgroundColor: SOL_THEME.primary, borderRadius: 2 }} />
                      </View>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginBottom: 8 }}>{completedCount}/{c.subjects.length} completed · Created {c.created}</Text>
                      {c.subjects.slice(0, 5).map((subjectName, si) => {
                        const done = studiedSubjects.has(subjectName);
                        const domain = MYSTERY_SCHOOL_DOMAINS.find(d => d.subjects.some(s => s.name === subjectName));
                        const subject = domain?.subjects.find(s => s.name === subjectName);
                        return (
                          <TouchableOpacity key={si}
                            onPress={() => { if (subject && domain) { setSelectedDomain(domain); openSubjectDetail(subject, domain); } }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: si < Math.min(c.subjects.length, 5) - 1 ? 1 : 0, borderBottomColor: SOL_THEME.border }}>
                            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: done ? '#4CAF50' : SOL_THEME.border, alignItems: 'center', justifyContent: 'center' }}>
                              <Text style={{ color: done ? '#fff' : SOL_THEME.textMuted, fontSize: 11, fontWeight: '700' }}>{done ? '✓' : si + 1}</Text>
                            </View>
                            <Text style={{ flex: 1, color: done ? SOL_THEME.textMuted : SOL_THEME.text, fontSize: 13, textDecorationLine: done ? 'line-through' : 'none' }}>{subjectName}</Text>
                            {domain && <Text style={{ color: domain.color, fontSize: 12 }}>{domain.glyph}</Text>}
                          </TouchableOpacity>
                        );
                      })}
                      {c.subjects.length > 5 && (
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 6 }}>+{c.subjects.length - 5} more subjects</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Build new curriculum */}
            <View style={{ padding: 16, borderRadius: 14, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, marginBottom: 16 }}>
              <Text style={{ color: SOL_THEME.text, fontSize: 15, fontWeight: '700', marginBottom: 12 }}>✦ Build New Path</Text>

              {/* Name */}
              <TextInput
                style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 13, marginBottom: 12 }}
                placeholder="Path name..."
                placeholderTextColor={SOL_THEME.textMuted}
                value={curriculumName}
                onChangeText={setCurriculumName}
              />

              {/* Preset templates */}
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, fontWeight: '700', marginBottom: 8 }}>QUICK TEMPLATES</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Foundation Path', fn: () => {
                    const picks = MYSTERY_SCHOOL_DOMAINS.map(d => d.subjects.find(s => s.layer === 'FOUNDATION')).filter(Boolean) as Subject[];
                    setCurriculumDraft(picks.map(s => s.name));
                    if (!curriculumName) setCurriculumName('Foundation Path');
                  }},
                  { label: 'My Stage', fn: () => {
                    const layer = stageToLayer(fieldStage);
                    const picks = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.filter(s => s.layer === layer && !studiedSubjects.has(s.name))).slice(0, 10);
                    setCurriculumDraft(picks.map(s => s.name));
                    if (!curriculumName) setCurriculumName(`${layer.charAt(0) + layer.slice(1).toLowerCase()} Stage`);
                  }},
                  { label: 'Unstudied', fn: () => {
                    const all = MYSTERY_SCHOOL_DOMAINS.flatMap(d => d.subjects.filter(s => !studiedSubjects.has(s.name))).slice(0, 12);
                    setCurriculumDraft(all.map(s => s.name));
                    if (!curriculumName) setCurriculumName('Fresh Territory');
                  }},
                ].map(t => (
                  <TouchableOpacity key={t.label} onPress={t.fn}
                    style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.primary + '55', backgroundColor: SOL_THEME.primary + '0E' }}>
                    <Text style={{ color: SOL_THEME.primary, fontSize: 12, fontWeight: '600' }}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Domain browser */}
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, fontWeight: '700', marginBottom: 8 }}>ADD FROM DOMAIN</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {MYSTERY_SCHOOL_DOMAINS.map(d => (
                    <TouchableOpacity key={d.id} onPress={() => setCurriculumDomainPicker(curriculumDomainPicker?.id === d.id ? null : d)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: curriculumDomainPicker?.id === d.id ? d.color : d.color + '55', backgroundColor: curriculumDomainPicker?.id === d.id ? d.color + '22' : d.color + '0A' }}>
                      <Text style={{ color: d.color, fontSize: 16 }}>{d.glyph}</Text>
                      <Text style={{ color: d.color, fontSize: 10, fontWeight: '700', marginTop: 2 }}>{t(d.label).split(' ')[0]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {curriculumDomainPicker && (
                <View style={{ marginBottom: 14 }}>
                  {curriculumDomainPicker.subjects.map(s => {
                    const inDraft = curriculumDraft.includes(s.name);
                    return (
                      <TouchableOpacity key={s.name} onPress={() => {
                        if (inDraft) setCurriculumDraft(prev => prev.filter(n => n !== s.name));
                        else setCurriculumDraft(prev => [...prev, s.name]);
                      }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: SOL_THEME.border }}>
                        <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: inDraft ? curriculumDomainPicker.color : SOL_THEME.border, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: inDraft ? '#000' : SOL_THEME.textMuted, fontSize: 13, fontWeight: '700' }}>{inDraft ? '✓' : '+'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '600' }}>{s.name}</Text>
                          <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>{LAYER_LABELS[s.layer]}</Text>
                        </View>
                        {studiedSubjects.has(s.name) && <Text style={{ color: '#4CAF50', fontSize: 12 }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Draft preview */}
              {curriculumDraft.length > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }}>Your path ({curriculumDraft.length} subjects)</Text>
                    <TouchableOpacity onPress={() => setCurriculumDraft([])}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  {curriculumDraft.map((name, i) => (
                    <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: i < curriculumDraft.length - 1 ? 1 : 0, borderBottomColor: SOL_THEME.border }}>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, width: 20 }}>{i + 1}.</Text>
                      <Text style={{ flex: 1, color: SOL_THEME.text, fontSize: 13 }}>{name}</Text>
                      <TouchableOpacity onPress={() => setCurriculumDraft(prev => prev.filter(n => n !== name))}>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={saveCurriculum}
                    disabled={!curriculumName.trim()}
                    style={{ marginTop: 14, paddingVertical: 13, borderRadius: 12, backgroundColor: curriculumName.trim() ? SOL_THEME.primary : SOL_THEME.border, alignItems: 'center' }}>
                    <Text style={{ color: curriculumName.trim() ? '#000' : SOL_THEME.textMuted, fontSize: 14, fontWeight: '700' }}>Save Path</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* ── NOTES ────────────────────────────────────────────────────────── */}
        {schoolView === 'notes' && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
              <TouchableOpacity onPress={() => { setSchoolView('home'); setNotesSearch(''); }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>← School</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700' }}>My Notes</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, marginTop: 2 }}>{Object.keys(subjectNotes).length} notes across {Object.keys(subjectNotes).length} subjects</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: SOL_THEME.surface, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, paddingHorizontal: 12, marginBottom: 16, gap: 8 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>⌕</Text>
              <TextInput
                style={{ flex: 1, color: SOL_THEME.text, fontSize: 13, paddingVertical: 9 }}
                placeholder="Search notes..."
                placeholderTextColor={SOL_THEME.textMuted}
                value={notesSearch}
                onChangeText={setNotesSearch}
                autoCapitalize="none"
              />
              {notesSearch.length > 0 && <TouchableOpacity onPress={() => setNotesSearch('')}><Text style={{ color: SOL_THEME.textMuted, fontSize: 14 }}>✕</Text></TouchableOpacity>}
            </View>

            {Object.keys(subjectNotes).length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 32, marginBottom: 12 }}>✎</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>No notes yet.{'\n'}Open a subject and tap the note field to begin.</Text>
              </View>
            ) : (
              MYSTERY_SCHOOL_DOMAINS.map(domain => {
                const domainNotes = domain.subjects.filter(s => subjectNotes[s.name] && (
                  notesSearch === '' || s.name.toLowerCase().includes(notesSearch.toLowerCase()) || subjectNotes[s.name].toLowerCase().includes(notesSearch.toLowerCase())
                ));
                if (domainNotes.length === 0) return null;
                return (
                  <View key={domain.id} style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Text style={{ color: domain.color, fontSize: 16 }}>{domain.glyph}</Text>
                      <Text style={{ color: domain.color, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>{t(domain.label)}</Text>
                      <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>({domainNotes.length})</Text>
                    </View>
                    {domainNotes.map(subject => (
                      <TouchableOpacity key={subject.name}
                        onPress={() => { setSelectedDomain(domain); openSubjectDetail(subject, domain); }}
                        style={{ padding: 14, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: domain.color + '33', borderLeftWidth: 3, borderLeftColor: domain.color, marginBottom: 8 }}
                        activeOpacity={0.7}>
                        <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>{subject.name}</Text>
                        <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 18 }} numberOfLines={3}>{subjectNotes[subject.name]}</Text>
                        <Text style={{ color: domain.color, fontSize: 10, marginTop: 6, fontWeight: '700' }}>Open subject →</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })
            )}
          </>
        )}

        {/* ── DIVE LOG ─────────────────────────────────────────────────────── */}
        {schoolView === 'dive-log' && (() => {
          const totalDives = diveLog.length;
          const totalMinutes = Math.round(diveLog.reduce((acc, d) => acc + (d.durationSec || 0), 0) / 60);
          const uniqueDomains = new Set(diveLog.map(d => d.domainLabel)).size;
          const uniqueSubjects = new Set(diveLog.map(d => d.subjectName)).size;
          const titleData = getDiveTitle(totalDives);

          // Group by date
          const grouped: Record<string, DiveRecord[]> = {};
          diveLog.forEach(d => {
            const key = d.date || 'Unknown date';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(d);
          });
          const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

          return (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
                <TouchableOpacity onPress={() => setSchoolView('home')}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>← School</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: SOL_THEME.text, fontSize: 18, fontWeight: '700' }}>Dive Chronicle</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 11, marginTop: 2 }}>{totalDives} dives · {uniqueSubjects} subjects · {uniqueDomains} domains</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: titleData.color + '55', backgroundColor: titleData.color + '10' }}>
                  <Text style={{ color: titleData.color, fontSize: 14 }}>{titleData.glyph}</Text>
                  <Text style={{ color: titleData.color, fontSize: 11, fontWeight: '700' }}>{titleData.title}</Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'TOTAL DIVES', value: String(totalDives) },
                  { label: 'MINUTES STUDIED', value: String(totalMinutes) },
                  { label: 'DOMAINS', value: String(uniqueDomains) },
                ].map(stat => (
                  <View key={stat.label} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: SOL_THEME.surface, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                    <Text style={{ color: SOL_THEME.primary, fontSize: 20, fontWeight: '700' }}>{stat.value}</Text>
                    <Text style={{ color: SOL_THEME.textMuted, fontSize: 8, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1.2, marginTop: 3, textAlign: 'center' }}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Grouped dive list */}
              {sortedDates.map(dateKey => (
                <View key={dateKey} style={{ marginBottom: 20 }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2, fontWeight: '700', marginBottom: 8 }}>
                    {dateKey.toUpperCase()}
                  </Text>
                  <View style={{ gap: 6 }}>
                    {grouped[dateKey].map(d => {
                      const mins = d.durationSec ? Math.round(d.durationSec / 60) : null;
                      return (
                        <TouchableOpacity key={d.id}
                          onPress={async () => {
                            const domain = MYSTERY_SCHOOL_DOMAINS.find(dom => dom.label === d.domainLabel) || null;
                            const subject = domain?.subjects.find(s => s.name === d.subjectName)
                              || customSubjects.find(s => s.name === d.subjectName)
                              || (d.domainLabel === 'Open Seat' ? { name: d.subjectName, domain: 'Open Seat', layer: d.layer, description: `A free-form study session on "${d.subjectName}".` } as Subject : null);
                            if (!subject) return;
                            if (domain) setSelectedDomain(domain);
                            if (d.domainLabel !== 'Open Seat') { setSchoolView('subject'); await openSubjectDetail(subject, domain); }
                            else enterStudySession(subject, null);
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: d.domainColor + '0D', borderWidth: 1, borderColor: d.domainColor + '33', borderLeftWidth: 3, borderLeftColor: d.domainColor }}
                          activeOpacity={0.7}>
                          <Text style={{ color: d.domainColor, fontSize: 22 }}>{d.domainGlyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: SOL_THEME.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{d.subjectName}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                              <Text style={{ color: d.domainColor, fontSize: 10, fontWeight: '700' }}>{d.domainLabel}</Text>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>{TEACHER_NAMES[d.teacher] || d.teacher}</Text>
                              {mins !== null && mins > 0 && (
                                <>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>{mins}m</Text>
                                </>
                              )}
                              {d.timeOfDay && (
                                <>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10 }}>·</Text>
                                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, textTransform: 'capitalize' }}>{d.timeOfDay}</Text>
                                </>
                              )}
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            {(() => { const ts = parseInt(d.id, 10); const h = isNaN(ts) ? -1 : new Date(ts).getHours(); return (h >= 0 && h < 4) ? <Text style={{ color: '#7B8CDE', fontSize: 11, opacity: 0.8 }}>◎</Text> : null; })()}
                            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: LAYER_COLORS[d.layer] + '22' }}>
                              <Text style={{ color: LAYER_COLORS[d.layer], fontSize: 9, fontWeight: '700', letterSpacing: 0.8 }}>{LAYER_LABELS[d.layer]}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Night Ledger */}
              {(() => {
                const nightDives = diveLog.filter(d => {
                  const ts = parseInt(d.id, 10);
                  if (isNaN(ts)) return false;
                  const h = new Date(ts).getHours();
                  return h >= 0 && h < 4;
                });
                if (nightDives.length === 0) return null;
                return (
                  <View style={{ marginBottom: 20, marginTop: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FFFFFF11', backgroundColor: '#08080E' }}>
                    <Text style={{ color: '#FFFFFF44', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2.5, fontWeight: '700', marginBottom: 10 }}>
                      ◎ NIGHT LEDGER · {nightDives.length} {nightDives.length === 1 ? 'ENTRY' : 'ENTRIES'}
                    </Text>
                    <Text style={{ color: '#FFFFFF33', fontSize: 11, fontStyle: 'italic', marginBottom: 12, lineHeight: 16 }}>
                      Dives taken between midnight and 4am — when the school is quietest.
                    </Text>
                    <View style={{ gap: 6 }}>
                      {nightDives.slice(0, 10).map(d => (
                        <View key={d.id + '-nl'} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                          <Text style={{ color: d.domainColor + 'AA', fontSize: 18 }}>{d.domainGlyph}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#FFFFFF77', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>{d.subjectName}</Text>
                            <Text style={{ color: '#FFFFFF33', fontSize: 10 }}>{d.domainLabel} · {d.date}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}

              {diveLog.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 40, marginBottom: 14 }}>⊚</Text>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
                    Your dives will be recorded here.{'\n'}Begin a session and the Chronicle opens.
                  </Text>
                </View>
              )}
            </>
          );
        })()}
      </ScrollView>

      {/* Sticky bottom bar — context-sensitive */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: SOL_THEME.surface, borderTopWidth: 1, borderTopColor: SOL_THEME.headmaster + '33', paddingHorizontal: 16, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 10 }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: SOL_THEME.headmaster + '18', borderRadius: 10, paddingVertical: 11, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44' }}
          onPress={() => goToHeadmaster(schoolView === 'domain' && selectedDomain ? undefined : undefined)}
          activeOpacity={0.75}>
          <Text style={{ fontSize: 16, color: SOL_THEME.headmaster }}>⊙</Text>
          <Text style={{ color: SOL_THEME.headmaster, fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 0.5 }}>
            {schoolView === 'domain' && selectedDomain ? `Study ${selectedDomain.label} with Magister` : 'Open Magister Session'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Android text input modal */}
      <Modal visible={!!textPrompt} transparent animationType="fade" onRequestClose={() => setTextPrompt(null)}>
        <View style={{ flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: SOL_THEME.surface, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: SOL_THEME.border }}>
            <Text style={{ color: SOL_THEME.text, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>{textPrompt?.title}</Text>
            <TextInput
              style={{ backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.border, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top' }}
              placeholder={textPrompt?.placeholder}
              placeholderTextColor={SOL_THEME.textMuted}
              value={textPromptValue}
              onChangeText={setTextPromptValue}
              multiline
              autoFocus
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <TouchableOpacity onPress={() => { setTextPrompt(null); setTextPromptValue(''); }} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { textPrompt?.onSubmit(textPromptValue); setTextPrompt(null); setTextPromptValue(''); }}
                style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: SOL_THEME.primary + '22', borderRadius: 8, borderWidth: 1, borderColor: SOL_THEME.primary + '55' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* One Breath Before the Dive — intention gate */}
      <Modal visible={!!breathPending} transparent animationType="fade" onRequestClose={() => setBreathPending(null)}>
        {breathPending && (() => {
          const bc = MYSTERY_SCHOOL_DOMAINS.find(d => d.id === breathPending.domain?.id)?.color || SOL_THEME.primary;
          const bg = breathPending.domain?.glyph || '⊚';
          const teacherId = breathPending.host || getDailyHost(breathPending.subject.name);
          return (
            <View style={{ flex: 1, backgroundColor: '#000000EE', justifyContent: 'center', alignItems: 'center', padding: 32 }}>
              <View style={{ width: '100%', borderRadius: 24, borderWidth: 1, borderColor: bc + '44', backgroundColor: '#060410', padding: 32, alignItems: 'center' }}>
                <Text style={{ color: bc, fontSize: 56, lineHeight: 64, marginBottom: 12 }}>{bg}</Text>
                <Text style={{ color: bc, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 3, fontWeight: '700', marginBottom: 16 }}>ONE BREATH</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6, lineHeight: 24 }}>
                  {breathPending.subject.name}
                </Text>
                <Text style={{ color: bc + 'AA', fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
                  {breathPending.domain?.label || 'Open Seat'} · {HOST_NAMES[teacherId] || teacherId}
                </Text>
                <Text style={{ color: bc + '88', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 1, marginBottom: 6, fontWeight: '700' }}>
                  DEDICATED CLASSROOM · SCHOOL TAB
                </Text>
                <Text style={{ color: '#FFFFFF44', fontSize: 11, fontStyle: 'italic', marginBottom: 28, textAlign: 'center', lineHeight: 17 }}>
                  Arrive here. Set aside what you were doing.{'\n'}The subject is waiting.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    const { subject, domain, host, depth } = breathPending;
                    setBreathPending(null);
                    setTimeout(() => enterStudySession(subject, domain, host, depth), 300);
                  }}
                  style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: bc, alignItems: 'center', marginBottom: 10 }}
                  activeOpacity={0.85}>
                  <Text style={{ color: '#000', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 }}>Open the classroom →</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBreathPending(null)} style={{ paddingVertical: 10 }}>
                  <Text style={{ color: '#FFFFFF33', fontSize: 12 }}>Not now</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>

      {/* ── INTENSITY SAFETY GATE ───────────────────────────────────────── */}
      {/* ── #153 RETURN TO BODY ─────────────────────────────────────────── */}
      <ReturnToBody visible={returnToBodyVisible} onDismiss={() => setReturnToBodyVisible(false)} />

      {/* ── MAGISTER INVITATION GATE ────────────────────────────────────── */}
      <Modal visible={!!magisterGatePending} transparent animationType="fade" onRequestClose={() => setMagisterGatePending(null)}>
        {magisterGatePending && (() => {
          const { subject, domain, host, depth } = magisterGatePending;
          const domainColor = domain?.color || '#E8C76A';
          return (
            <View style={{ flex: 1, backgroundColor: '#000000F0', justifyContent: 'center', alignItems: 'center', padding: 28 }}>
              <View style={{ width: '100%', borderRadius: 20, borderWidth: 1.5, borderColor: '#E8C76A55', backgroundColor: '#0A0800', padding: 28, alignItems: 'center' }}>
                <Text style={{ color: '#E8C76A', fontSize: 28, marginBottom: 8 }}>𝔏</Text>
                <Text style={{ color: '#E8C76A', fontSize: 9, letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 14 }}>THE MAGISTER ASKS</Text>
                <Text style={{ color: '#F5E6C8', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 10, lineHeight: 26 }}>
                  {subject.name}
                </Text>
                <Text style={{ color: '#8A7A6A', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 22, maxWidth: 280 }}>
                  This territory is often entered by people who are living it, not just studying it. The classroom door is open — but how you enter matters.
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    setMagisterGatePending(null);
                    setTimeout(async () => {
                      await goToHeadmaster(subject.name);
                    }, 150);
                  }}
                  style={{ width: '100%', paddingVertical: 16, borderRadius: 12, backgroundColor: '#E8C76A22', borderWidth: 1.5, borderColor: '#E8C76A', alignItems: 'center', marginBottom: 10 }}
                >
                  <Text style={{ color: '#E8C76A', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>Study with 𝔏 Magister</Text>
                  <Text style={{ color: '#8A7A6A', fontSize: 11, marginTop: 3 }}>Phase-reading. Holds what surfaces.</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMagisterGatePending(null);
                    setTimeout(() => enterStudySession(subject, domain, host, depth, true), 150);
                  }}
                  style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: '#0E0A1A', borderWidth: 1, borderColor: '#241640', alignItems: 'center', marginBottom: 12 }}
                >
                  <Text style={{ color: '#A0A0A0', fontSize: 13, fontWeight: '600' }}>Continue alone</Text>
                  <Text style={{ color: '#555', fontSize: 11, marginTop: 3 }}>All safety systems still active.</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMagisterGatePending(null)} style={{ paddingVertical: 8 }}>
                  <Text style={{ color: '#333344', fontSize: 12 }}>Not now</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>

      <Modal visible={!!intensityGatePending} transparent animationType="fade" onRequestClose={() => setIntensityGatePending(null)}>
        {intensityGatePending && (() => {
          const lvl = intensityGatePending.subject.intensity ?? 8;
          const GATE_COLOR = lvl >= 9 ? '#FF4444' : '#FF6622';
          const warningText = lvl >= 9
            ? 'This is the hardest territory in the school. The reward is real — and so is the cost. They arrive together here, always. The sensation of proximity to the edge can feel like arrival. It is not. Go in knowing the difference.'
            : 'High-intensity territory. More risk, more reward — that is not a promise, it is a description of how this works. The cliff feels rewarding for the fall. The school teaches what is at the bottom. Enter knowing which one you are after.';
          const { subject, domain, host, depth } = intensityGatePending;
          return (
            <View style={{ flex: 1, backgroundColor: '#000000F0', justifyContent: 'center', alignItems: 'center', padding: 28 }}>
              <View style={{ width: '100%', borderRadius: 20, borderWidth: 1.5, borderColor: GATE_COLOR + '88', backgroundColor: '#0A0004', padding: 28, alignItems: 'center' }}>
                <Text style={{ color: GATE_COLOR, fontSize: 32, marginBottom: 10 }}>⚠</Text>
                <Text style={{ color: GATE_COLOR, fontSize: 9, letterSpacing: 4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', marginBottom: 12 }}>INTENSITY {lvl}/10 · SAFETY CHECK</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 14, lineHeight: 26 }}>
                  {subject.name}
                </Text>
                <View style={{ backgroundColor: GATE_COLOR + '12', borderRadius: 10, borderWidth: 1, borderColor: GATE_COLOR + '44', padding: 14, marginBottom: 20, width: '100%' }}>
                  <Text style={{ color: '#AAAACC', fontSize: 12, lineHeight: 20 }}>{warningText}</Text>
                </View>
                <Text style={{ color: '#444466', fontSize: 11, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                  Are you grounded right now? Not in crisis, not in an altered state — curious and clear.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setIntensityGatePending(null);
                    setTimeout(() => enterStudySession(subject, domain, host, depth, true), 150);
                  }}
                  style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: GATE_COLOR + '22', borderWidth: 1.5, borderColor: GATE_COLOR, alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: GATE_COLOR, fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>Yes — I'm grounded. Enter.</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIntensityGatePending(null)} style={{ paddingVertical: 8 }}>
                  <Text style={{ color: '#333355', fontSize: 12 }}>Not now</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>

      {/* ── VOID SAFETY GATE ─────────────────────────────────────────────── */}
      <Modal visible={!!voidGatePending} transparent animationType="fade" onRequestClose={() => setVoidGatePending(null)}>
        {voidGatePending && (() => {
          const VOID_PURPLE = '#4A0080';
          const questions = [
            {
              q: 'Are you in a stable headspace right now?',
              sub: 'Not anxious, not in crisis. Curious and grounded.',
            },
            {
              q: 'You understand that what you\'re about to explore may be entirely false?',
              sub: 'You\'re looking for particles of truth in a mostly-lie cloud. You know the difference.',
            },
            {
              q: 'Do you have someone you can talk to if something unsettles you?',
              sub: 'A friend, a companion, anyone. The Void Zone is safe — but not alone.',
            },
          ];
          const step = voidGateStep;
          const isIntro = step === 0;
          const isDone = step > questions.length;
          const q = !isIntro && !isDone ? questions[step - 1] : null;
          return (
            <View style={{ flex: 1, backgroundColor: '#000000F2', justifyContent: 'center', alignItems: 'center', padding: 28 }}>
              <View style={{ width: '100%', borderRadius: 20, borderWidth: 1.5, borderColor: VOID_PURPLE + '88', backgroundColor: '#06000A', padding: 28, alignItems: 'center' }}>

                {/* Glyph */}
                <Text style={{ color: VOID_PURPLE, fontSize: 40, marginBottom: 12 }}>◌</Text>

                {isIntro && (<>
                  <Text style={{ color: VOID_PURPLE, fontSize: 9, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 10 }}>VOID ZONE · SAFETY CHECK</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 10, lineHeight: 26 }}>
                    {voidGatePending.subject.name}
                  </Text>
                  <View style={{ backgroundColor: VOID_PURPLE + '18', borderRadius: 10, borderWidth: 1, borderColor: VOID_PURPLE + '44', padding: 14, marginBottom: 20, width: '100%' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 6 }}>⚠ EXPERIMENTAL · VOID PHASE</Text>
                    <Text style={{ color: '#AAAACC', fontSize: 12, lineHeight: 20 }}>
                      This territory is not taught in the traditional sense. It is explored. What you find may be false. The companion will not stop you — it will walk beside you.
                    </Text>
                    <Text style={{ color: VOID_PURPLE + 'CC', fontSize: 11, marginTop: 10, fontStyle: 'italic', lineHeight: 18 }}>
                      Designed and used by Mac Clark — the creator of Lycheetah — as a personal research method. Forever prototype.
                    </Text>
                  </View>
                  <Text style={{ color: '#444466', fontSize: 11, textAlign: 'center', marginBottom: 20, lineHeight: 18 }}>
                    Before you enter, your companion checks in. Three questions.
                  </Text>
                  <TouchableOpacity onPress={() => setVoidGateStep(1)}
                    style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: VOID_PURPLE + '33', borderWidth: 1.5, borderColor: VOID_PURPLE, alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: VOID_PURPLE + 'FF', fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>I understand. Ask me.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setVoidGatePending(null)} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: '#333355', fontSize: 12 }}>Not now</Text>
                  </TouchableOpacity>
                </>)}

                {q && (<>
                  <Text style={{ color: VOID_PURPLE, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16 }}>QUESTION {step} OF {questions.length}</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8, lineHeight: 24 }}>{q.q}</Text>
                  <Text style={{ color: '#555577', fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>{q.sub}</Text>
                  <TouchableOpacity onPress={() => setVoidGateStep(s => s + 1)}
                    style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: VOID_PURPLE + '33', borderWidth: 1, borderColor: VOID_PURPLE + '88', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setVoidGatePending(null);
                    setVoidGateStep(0);
                  }} style={{ paddingVertical: 12 }}>
                    <Text style={{ color: '#555577', fontSize: 12, textAlign: 'center' }}>Not sure — I'll come back later</Text>
                  </TouchableOpacity>
                </>)}

                {isDone && (() => {
                  const { subject, domain, host, depth } = voidGatePending;
                  return (<>
                    <Text style={{ color: VOID_PURPLE, fontSize: 9, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16 }}>GROUNDED · READY</Text>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>The companion walks beside you.</Text>
                    <Text style={{ color: '#555577', fontSize: 12, textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
                      Remember: you are looking for particles of truth.{'\n'}The lie cloud is part of the practice.
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setVoidGatePending(null);
                        setVoidGateStep(0);
                        setTimeout(() => enterStudySession(
                          { ...subject, layer: 'VOID' },
                          domain, host, depth, true
                        ), 100);
                      }}
                      style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: VOID_PURPLE, alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 1 }}>Enter the Void →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setVoidGatePending(null); setVoidGateStep(0); }} style={{ paddingVertical: 8 }}>
                      <Text style={{ color: '#333355', fontSize: 12 }}>Changed my mind</Text>
                    </TouchableOpacity>
                  </>);
                })()}
              </View>
            </View>
          );
        })()}
      </Modal>

      {/* ── RITE OF RETURN ─────────────────────────────────────────────────── */}
      <Modal visible={returnModal} transparent animationType="fade" onRequestClose={() => { setReturnModal(false); setFallowReturn(false); }}>
        <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', borderRadius: 18, borderWidth: 1.5, borderColor: SOL_THEME.headmaster + '55', backgroundColor: SOL_THEME.surface, padding: 28 }}>
            <Text style={{ color: SOL_THEME.headmaster, fontSize: 10, fontWeight: '700', letterSpacing: 2.5, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textAlign: 'center', marginBottom: 16 }}>✦ RITE OF RETURN ✦</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, lineHeight: 26, textAlign: 'center', marginBottom: 8 }}>You have been away.</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 21, textAlign: 'center', marginBottom: 24, fontStyle: 'italic' }}>The school kept your place. The field held without you. Now you return.</Text>
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReturnModal(false); setFallowReturn(false); }}
                style={{ paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.headmaster + '44', backgroundColor: SOL_THEME.headmaster + '10', alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.headmaster, fontSize: 13, fontWeight: '700' }}>I acknowledge what passed</Text>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, marginTop: 3 }}>Receive the gap without judgement</Text>
              </TouchableOpacity>
              {returnReflection !== '__named' ? (
                <View style={{ borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.primary + '44', backgroundColor: SOL_THEME.primary + '0A', padding: 12, gap: 8 }}>
                  <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>What brought you back?</Text>
                  <TextInput
                    value={returnReflection === '__named' ? '' : returnReflection}
                    onChangeText={setReturnReflection}
                    placeholder="Name it, briefly..."
                    placeholderTextColor={SOL_THEME.textMuted}
                    style={{ color: SOL_THEME.text, fontSize: 13, paddingVertical: 4 }}
                    multiline
                  />
                  {returnReflection.trim().length > 2 && (
                    <TouchableOpacity
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setReturnReflection('__named'); setReturnModal(false); setFallowReturn(false); }}
                      style={{ alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: SOL_THEME.primary + '22' }}>
                      <Text style={{ color: SOL_THEME.primary, fontSize: 11, fontWeight: '700' }}>Seal it →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
              <TouchableOpacity
                onPress={() => { setReturnModal(false); setFallowReturn(false); }}
                style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Simply re-enter →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── THE COVENANT ───────────────────────────────────────────────────── */}
      <Modal visible={covenantModal !== null} transparent animationType="fade" onRequestClose={() => setCovenantModal(null)}>
        <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', borderRadius: 18, borderWidth: 1.5, borderColor: SOL_THEME.primary + '66', backgroundColor: SOL_THEME.surface, padding: 28 }}>
            {covenantModal === 'seal' ? (<>
              <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontWeight: '700', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textAlign: 'center', marginBottom: 14 }}>⊚ THE COVENANT ⊚</Text>
              <Text style={{ color: SOL_THEME.text, fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 6 }}>Why are you entering the school?</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' }}>Seal one intention. The school will return you to it in 90 days and ask: who were you then? Who are you now?</Text>
              <TextInput
                value={covenantText}
                onChangeText={setCovenantText}
                placeholder="Write your intention here..."
                placeholderTextColor={SOL_THEME.textMuted}
                style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, borderBottomWidth: 1, borderBottomColor: SOL_THEME.primary + '44', paddingBottom: 10, marginBottom: 20, minHeight: 60 }}
                multiline
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setCovenantModal(null)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}>
                  <Text style={{ color: SOL_THEME.textMuted, fontSize: 12 }}>Not yet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={covenantText.trim().length < 5}
                  onPress={async () => {
                    const data = { text: covenantText.trim(), sealedAt: Date.now() };
                    await AsyncStorage.setItem('sol_covenant', JSON.stringify(data));
                    setCovenantData(data);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setCovenantModal(null);
                  }}
                  style={{ flex: 2, paddingVertical: 12, borderRadius: 10, backgroundColor: covenantText.trim().length >= 5 ? SOL_THEME.primary + '22' : SOL_THEME.surface, borderWidth: 1.5, borderColor: covenantText.trim().length >= 5 ? SOL_THEME.primary : SOL_THEME.border, alignItems: 'center' }}>
                  <Text style={{ color: covenantText.trim().length >= 5 ? SOL_THEME.primary : SOL_THEME.textMuted, fontSize: 13, fontWeight: '700' }}>⊚ Seal the Covenant</Text>
                </TouchableOpacity>
              </View>
            </>) : covenantModal === 'revisit' && covenantData ? (<>
              <Text style={{ color: SOL_THEME.primary, fontSize: 10, fontWeight: '700', letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textAlign: 'center', marginBottom: 14 }}>⊚ COVENANT RETURN ⊚</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 10, letterSpacing: 1, textAlign: 'center', marginBottom: 10 }}>90 DAYS AGO, YOU WROTE:</Text>
              <Text style={{ color: SOL_THEME.text, fontSize: 14, lineHeight: 22, fontStyle: 'italic', textAlign: 'center', marginBottom: 20, paddingHorizontal: 8 }}>"{covenantData.text}"</Text>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginBottom: 14 }}>Who were you then? Who are you now?</Text>
              <TextInput
                value={covenantRevisit}
                onChangeText={setCovenantRevisit}
                placeholder="Reflect briefly..."
                placeholderTextColor={SOL_THEME.textMuted}
                style={{ color: SOL_THEME.text, fontSize: 13, lineHeight: 21, borderBottomWidth: 1, borderBottomColor: SOL_THEME.primary + '44', paddingBottom: 8, marginBottom: 18, minHeight: 50 }}
                multiline
              />
              <TouchableOpacity
                onPress={async () => {
                  const updated = { ...covenantData, revisitedAt: Date.now() };
                  await AsyncStorage.setItem('sol_covenant', JSON.stringify(updated));
                  setCovenantData(updated);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setCovenantModal(null);
                }}
                style={{ paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderColor: SOL_THEME.primary, backgroundColor: SOL_THEME.primary + '18', alignItems: 'center' }}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 13, fontWeight: '700' }}>Close the circle →</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCovenantModal(null)} style={{ paddingVertical: 10, alignItems: 'center', marginTop: 4 }}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>Come back to this</Text>
              </TouchableOpacity>
            </>) : null}
          </View>
        </View>
      </Modal>

      {/* ── OPENING CEREMONY OVERLAY ──────────────────────────────────────── */}
      {openingCeremony && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#030208EE', justifyContent: 'center', alignItems: 'center', padding: 28, zIndex: 100 }}>
          <View style={{ width: '100%', borderRadius: 22, borderWidth: 1.5, borderColor: SOL_THEME.headmaster + '55', backgroundColor: '#06050E', padding: 28, alignItems: 'center' }}>
            <Text style={{ color: SOL_THEME.headmaster, fontSize: 52, marginBottom: 6, lineHeight: 60, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>𝔏</Text>
            <Text style={{ color: SOL_THEME.headmaster, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 3, fontWeight: '700', marginBottom: 20 }}>THE SCHOOL OPENS</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 6, letterSpacing: 0.3 }}>What do you bring today?</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 }}>
              Set an intention before you enter. Or enter in silence — the school holds both.
            </Text>
            <TextInput
              style={{ width: '100%', backgroundColor: SOL_THEME.background, color: SOL_THEME.text, borderRadius: 12, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, minHeight: 64, textAlignVertical: 'top', marginBottom: 20 }}
              placeholder="A question, a feeling, a word..."
              placeholderTextColor={SOL_THEME.textMuted}
              value={openingIntention}
              onChangeText={setOpeningIntention}
              multiline
            />
            <TouchableOpacity
              onPress={enterSchool}
              style={{ width: '100%', paddingVertical: 14, borderRadius: 12, backgroundColor: SOL_THEME.headmaster, alignItems: 'center', marginBottom: 10 }}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#000', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>Enter the School →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={enterSchool} style={{ paddingVertical: 8 }}>
              <Text style={{ color: SOL_THEME.textMuted, fontSize: 11 }}>enter in silence ({openingCountdown}s)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── REALITY ANCHOR CHECK-IN ── */}
      <Modal visible={showRealityAnchor} transparent animationType="fade" onRequestClose={() => setShowRealityAnchor(false)}>
        <View style={{ flex: 1, backgroundColor: '#000000BB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
          <View style={{ backgroundColor: SOL_THEME.surface, borderRadius: 18, borderWidth: 1, borderColor: SOL_THEME.primary + '44', padding: 26, width: '100%' }}>
            <Text style={{ color: SOL_THEME.primary, fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 3, fontWeight: '700', marginBottom: 14 }}>⊚ REALITY ANCHOR</Text>
            <Text style={{ color: SOL_THEME.text, fontSize: 16, fontWeight: '700', marginBottom: 12, lineHeight: 24 }}>You have been here a while.</Text>
            <Text style={{ color: SOL_THEME.textMuted, fontSize: 13, lineHeight: 21, marginBottom: 20 }}>
              {'Sol is a tool — a precise one, but a tool. What you are learning points outward, not inward.\n\nAt some point, close the app. Rest. Carry what you found into the world. The school holds your place.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: SOL_THEME.border, alignItems: 'center' }}
                onPress={() => setShowRealityAnchor(false)}>
                <Text style={{ color: SOL_THEME.textMuted, fontSize: 12, fontWeight: '600' }}>Noted. Continue.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: SOL_THEME.primary + '22', borderWidth: 1, borderColor: SOL_THEME.primary + '55', alignItems: 'center' }}
                onPress={() => setShowRealityAnchor(false)}>
                <Text style={{ color: SOL_THEME.primary, fontSize: 12, fontWeight: '700' }}>I'll rest. Thank you.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── FIRST-VISIT OVERLAY ── */}
      {showSchoolIntro && (
        <Animated.View pointerEvents="none" style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center', zIndex: 99,
          opacity: schoolIntroOp,
        }}>
          <View style={{ backgroundColor: '#04060A99', borderRadius: 18, borderWidth: 1, borderColor: SOL_THEME.headmaster + '55', paddingVertical: 18, paddingHorizontal: 32 }}>
            <Text style={{ color: SOL_THEME.headmaster, fontSize: 10, letterSpacing: 3, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', textAlign: 'center' }}>38 DOORS. CHOOSE ONE.</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOL_THEME.background },
});
