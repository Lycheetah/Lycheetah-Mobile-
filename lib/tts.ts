import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { getProviderKey } from './storage';

function getFS(): any {
  try { return require('expo-file-system/legacy'); } catch { return require('expo-file-system'); }
}

// Best voice per persona
// OpenAI tts-1: onyx(deep), nova(warm), shimmer(precise), fable(expressive), echo(auth), alloy(measured)
// Gemini preview-tts: Charon(deep), Aoede(warm), Kore(clear), Puck(light), Fenrir(authority), Orus(measured)
const PERSONA_VOICE: Record<string, string> = {
  sol: 'onyx', 'aura-prime': 'nova', veyra: 'shimmer',
  lyra: 'fable', magister: 'echo', headmaster: 'alloy',
};
const PERSONA_GEMINI_VOICE: Record<string, string> = {
  sol: 'Charon', 'aura-prime': 'Aoede', veyra: 'Kore',
  lyra: 'Puck', magister: 'Fenrir', headmaster: 'Orus',
};

let currentSound: Audio.Sound | null = null;

// Safe base64 — spread on large Uint8Array stack-overflows on mobile
function bufToBase64(buf: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < buf.length; i += chunkSize) {
    binary += String.fromCharCode(...buf.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function stopTTS() {
  if (currentSound) {
    try { await currentSound.stopAsync(); await currentSound.unloadAsync(); } catch {}
    currentSound = null;
  }
  Speech.stop();
}

function cleanForTTS(text: string, maxChars = 600): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    .replace(/`[^`]+`/g, '').replace(/#{1,6}\s/g, '')
    .replace(/\n{2,}/g, '. ').replace(/\n/g, ' ').replace(/\s{2,}/g, ' ')
    .trim().slice(0, maxChars);
}

async function playMp3Base64(base64: string): Promise<void> {
  await stopTTS();
  const FS = getFS();
  const uri = (FS.cacheDirectory || FS.documentDirectory) + `sol_tts_${Date.now()}.mp3`;
  await FS.writeAsStringAsync(uri, base64, { encoding: 'base64' });
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  currentSound = sound;
  return new Promise(resolve => {
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        currentSound = null;
        resolve();
      }
    });
  });
}

// OpenAI tts-1 — best quality, 6 distinct voices, ~0.015$/1k chars
async function openAITTS(text: string, persona: string): Promise<boolean> {
  const key = await getProviderKey('openai');
  if (!key) { console.log('[TTS] OpenAI: no key'); return false; }
  const voice = PERSONA_VOICE[persona] || 'onyx';
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', input: text, voice, response_format: 'mp3', speed: 0.95 }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) { console.log('[TTS] OpenAI failed:', res.status, await res.text()); return false; }
    const buf = await res.arrayBuffer();
    await playMp3Base64(bufToBase64(new Uint8Array(buf)));
    console.log('[TTS] OpenAI OK, voice:', voice);
    return true;
  } catch (e) { console.log('[TTS] OpenAI error:', e); return false; }
}

// Gemini 2.5 Flash preview-tts — free with Gemini key, 30 voices
// NOTE: requires the TTS preview to be enabled on your key (not all keys have it yet)
async function geminiTTS(text: string, persona: string): Promise<boolean> {
  const key = await getProviderKey('gemini');
  if (!key) { console.log('[TTS] Gemini: no key'); return false; }
  const voice = PERSONA_GEMINI_VOICE[persona] || 'Charon';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
        signal: AbortSignal.timeout(14000),
      }
    );
    if (!res.ok) { console.log('[TTS] Gemini failed:', res.status, await res.text()); return false; }
    const json = await res.json();
    const audioData = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) { console.log('[TTS] Gemini: no audio data in response'); return false; }
    await playPcmBase64(audioData);
    console.log('[TTS] Gemini OK, voice:', voice);
    return true;
  } catch (e) { console.log('[TTS] Gemini error:', e); return false; }
}

// Gemini returns raw L16 PCM at 24kHz — build RIFF WAV header before playback
async function playPcmBase64(base64: string): Promise<void> {
  await stopTTS();
  const pcm = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const sr = 24000, ch = 1, bps = 16;
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true);
  ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * ch * bps / 8, true); v.setUint16(32, ch * bps / 8, true);
  v.setUint16(34, bps, true); ws(36, 'data'); v.setUint32(40, pcm.length, true);
  const wav = new Uint8Array(44 + pcm.length);
  wav.set(new Uint8Array(header)); wav.set(pcm, 44);
  const FS = getFS();
  const uri = (FS.cacheDirectory || FS.documentDirectory) + `sol_tts_${Date.now()}.wav`;
  await FS.writeAsStringAsync(uri, bufToBase64(wav), { encoding: 'base64' });
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
  currentSound = sound;
  return new Promise(resolve => {
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        currentSound = null;
        resolve();
      }
    });
  });
}

// expo-speech fallback — device voice, always works, generic quality
function speechFallback(text: string, persona: string): Promise<void> {
  console.log('[TTS] falling back to expo-speech');
  const rate = persona === 'veyra' ? 0.85 : persona === 'lyra' ? 1.05 : 0.9;
  const pitch = persona === 'aura-prime' ? 1.1 : persona === 'veyra' ? 0.95 : 1.0;
  return new Promise(resolve => {
    Speech.speak(text, {
      rate, pitch, language: 'en-US',
      onDone: resolve,
      onStopped: resolve,
      onError: () => resolve(),
    });
  });
}

// Waterfall: OpenAI (best) → Gemini (free) → device fallback
export async function speakText(text: string, persona = 'sol'): Promise<void> {
  const clean = cleanForTTS(text);
  if (!clean) return;
  console.log('[TTS] speaking', clean.length, 'chars as', persona);
  if (await openAITTS(clean, persona)) return;
  if (await geminiTTS(clean, persona)) return;
  await speechFallback(clean, persona);
}

export function isSpeaking(): boolean { return currentSound !== null; }
