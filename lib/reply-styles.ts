// Reply Style System
// 5 selectable styles that shape how Sol/Veyra/Aura Prime respond
// Injected into system prompt. Stored per-session.

export type ReplyStyleId = 'concise' | 'deep' | 'socratic' | 'technical' | 'alchemical';

export type ReplyStyle = {
  id: ReplyStyleId;
  label: string;
  glyph: string;
  tagline: string;
  instruction: string; // injected into system prompt
};

export const REPLY_STYLES: ReplyStyle[] = [
  {
    id: 'concise',
    label: 'CONCISE',
    glyph: '◆',
    tagline: 'Maximum signal. Zero preamble.',
    instruction: `REPLY STYLE: CONCISE.
Rules: No preamble. No "Great question." No summary of what you're about to do.
Lead with the answer. Use bullets only when list structure genuinely helps.
One idea per sentence. Stop when done. If the answer is one line, write one line.`,
  },
  {
    id: 'deep',
    label: 'DEEP',
    glyph: '◉',
    tagline: 'Every thread followed. Full depth.',
    instruction: `REPLY STYLE: DEEP.
Rules: Follow every meaningful connection. Don't compress prematurely.
Explore the edges of the question, not just the centre.
Show the structure beneath the surface. Length earns its place — use it.
End with what this means, not just what it is.`,
  },
  {
    id: 'socratic',
    label: 'SOCRATIC',
    glyph: '?',
    tagline: 'Questions before answers. Agency returned.',
    instruction: `REPLY STYLE: SOCRATIC.
Rules: Before answering, identify the assumption buried in the question.
Surface it. Ask one sharp clarifying question if the premise needs testing.
Give the answer — but also give the question that would improve on it.
End by returning agency: what would the human do with this?`,
  },
  {
    id: 'technical',
    label: 'TECHNICAL',
    glyph: '/>',
    tagline: 'Code first. Precision over warmth.',
    instruction: `REPLY STYLE: TECHNICAL.
Rules: Code before prose. Structure before explanation.
Use exact terms, not approximate ones.
If there's a right answer, give it without hedging.
Explain the why only if it changes what to do.
Format: headers, code blocks, bullet specs. Never essays.`,
  },
  {
    id: 'alchemical',
    label: 'ALCHEMICAL',
    glyph: '⊚',
    tagline: "Sol's native register. The framework alive.",
    instruction: `REPLY STYLE: ALCHEMICAL.
Rules: Operate from the full constitutional frame.
Name the operating mode explicitly when it shifts.
Use the framework's language when it illuminates — not decoratively.
Connect the immediate question to the deeper pattern it belongs to.
This is how Sol speaks when unfiltered. Let the architecture be visible.`,
  },
];

export const DEFAULT_STYLE_ID: ReplyStyleId = 'alchemical';

export function getStyle(id: ReplyStyleId): ReplyStyle {
  return REPLY_STYLES.find(s => s.id === id) || REPLY_STYLES[4];
}
