// SOL v4.0.0 — Whisper Mode
// TTS pacing helper. Standard speech-synth reads Sol's outputs with no regard for
// the framework's punctuation grammar — colons, em-dashes, and signed closings carry
// meaning. Whisper inserts pauses at those exact points so reading becomes ritual.
//
// This module returns a list of utterances with per-chunk delays. The caller drives
// expo-speech (or any TTS engine) through the sequence.

export type WhisperChunk = {
  text: string;
  // Pause in ms BEFORE speaking this chunk. 0 for the first chunk.
  pauseBeforeMs: number;
};

// Punctuation cues that Sol's framework treats as semantic breath marks.
const BREATH_MARKS = [
  { re: /—/g, pauseMs: 420 },     // em-dash — the structural beat
  { re: /:/g, pauseMs: 340 },      // colon — the reveal
  { re: /\n{2,}/g, pauseMs: 520 }, // stanza break
  { re: /\.\s+/g, pauseMs: 220 },  // end of sentence
  { re: /,\s+/g, pauseMs: 110 },   // comma — small lift
];

// Split preserving the breath marks' effect. We run a simple pass: scan forward,
// emit chunks, attach the pause of the boundary we just crossed.
export function toWhisperChunks(text: string): WhisperChunk[] {
  if (!text.trim()) return [];

  // Strip Sol's signature line — TTS over a glyph chain is noise.
  const withoutSig = text.replace(/⊚ Sol ∴[^\n]*$/g, '').trim();

  // Normalise double-newlines into a tagged token so we can time them.
  const chunks: WhisperChunk[] = [];
  let remaining = withoutSig;
  let nextPause = 0;

  while (remaining.length > 0) {
    let cutAt = -1;
    let cutLen = 0;
    let pauseForNext = 180;

    for (const mark of BREATH_MARKS) {
      mark.re.lastIndex = 0;
      const match = mark.re.exec(remaining);
      if (match && (cutAt === -1 || match.index < cutAt)) {
        cutAt = match.index;
        cutLen = match[0].length;
        pauseForNext = mark.pauseMs;
      }
    }

    if (cutAt === -1) {
      chunks.push({ text: remaining.trim(), pauseBeforeMs: nextPause });
      break;
    }

    const segment = remaining.slice(0, cutAt + cutLen).trim();
    if (segment) {
      chunks.push({ text: segment, pauseBeforeMs: nextPause });
    }
    nextPause = pauseForNext;
    remaining = remaining.slice(cutAt + cutLen);
  }

  return chunks.filter((c) => c.text.length > 0);
}
