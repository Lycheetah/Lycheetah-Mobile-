// Shared image generation — NVIDIA FLUX.1-schnell (free tier, fast 4-step).
// One implementation for every surface: WITCHAIL FORGE, zodiac SIGIL FORGE, main chat.
import { getProviderKey } from './storage';

export type ImageResult = { image: string | null; error: string | null };

/**
 * Generate an image from a text prompt via NVIDIA FLUX.1-schnell.
 * Returns a data URI (data:image/png;base64,...) or an error string.
 */
export async function generateImage(
  prompt: string,
  opts?: { width?: number; height?: number },
): Promise<ImageResult> {
  try {
    const nvKey = await getProviderKey('nvidia');
    if (!nvKey) return { image: null, error: 'Add your NVIDIA key in Settings to generate images.' };
    const res = await fetch('https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nvKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        mode: 'base',
        cfg_scale: 0,          // FLUX schnell is guidance-distilled — must be 0
        width: opts?.width ?? 1024,
        height: opts?.height ?? 1024,
        seed: Math.floor(Math.random() * 1000000),
        steps: 4,
      }),
    });
    const data = await res.json();
    const b64 = data?.artifacts?.[0]?.base64 || data?.image || data?.b64_json;
    if (b64) return { image: `data:image/png;base64,${b64}`, error: null };
    const detail = data?.detail?.[0]?.msg || data?.detail || data?.message || JSON.stringify(data);
    return { image: null, error: `NVIDIA [${res.status}]: ${String(detail).slice(0, 220)}` };
  } catch (e: any) {
    return { image: null, error: 'Image gen failed — check NVIDIA key + connection.' };
  }
}

/**
 * Save a base64 data URI to the device gallery.
 * Needs expo-media-library — gracefully reports if not installed.
 */
export async function saveImageToDevice(dataUri: string): Promise<{ ok: boolean; error: string | null }> {
  try {
    let FileSystem: any;
    try { FileSystem = require('expo-file-system/legacy'); }
    catch { FileSystem = require('expo-file-system'); }
    let MediaLibrary: any;
    try { MediaLibrary = require('expo-media-library'); }
    catch { return { ok: false, error: 'Saving needs expo-media-library — run: npx expo install expo-media-library' }; }

    const base64 = dataUri.replace(/^data:image\/\w+;base64,/, '');
    const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${dir}sol-image-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) return { ok: false, error: 'Gallery permission denied.' };
    await MediaLibrary.saveToLibraryAsync(fileUri);
    return { ok: true, error: null };
  } catch (e: any) {
    return { ok: false, error: 'Save failed: ' + (e?.message || 'unknown') };
  }
}
