// Build-time keys injected via EAS Secrets as EXPO_PUBLIC_ env vars.
// Set via: eas secret:create --scope project --name EXPO_PUBLIC_GEMINI_KEY --value "..."
// Local override: lib/dev-keys.local.ts (gitignored).
export const DEV_KEYS: Record<string, string> = {
  gemini:   process.env.EXPO_PUBLIC_GEMINI_KEY   || '',
  nvidia:   process.env.EXPO_PUBLIC_NVIDIA_KEY   || '',
  deepseek: process.env.EXPO_PUBLIC_DEEPSEEK_KEY || '',
};
