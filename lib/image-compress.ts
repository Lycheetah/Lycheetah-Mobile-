const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.72;

export async function compressForUpload(
  uri: string,
  width: number,
  height: number,
): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const actions: any[] =
      scale < 1 ? [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }] : [];
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    return { base64: result.base64 ?? '', mimeType: 'image/jpeg' };
  } catch {
    // expo-image-manipulator not installed — fall back to full-size image
    const { FileSystem } = await import('expo-file-system').catch(() => ({ FileSystem: null })) as any;
    if (FileSystem) {
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return { base64: b64, mimeType: 'image/jpeg' };
    }
    return { base64: '', mimeType: 'image/jpeg' };
  }
}
