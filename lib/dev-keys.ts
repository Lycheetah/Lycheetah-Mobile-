// COMMITTED FALLBACK — keep BLANK. Never put real keys here (this file is public).
// Real keys live ONLY in lib/dev-keys.local.ts (gitignored). storage.ts loads
// .local first and falls back to this. The real fix is the #22 Cloudflare proxy
// so a key never ships at all (preserves free-Sol covenant without exposure).
export const DEV_KEYS: Record<string, string> = {
  nvidia: '',
  deepseek: '',
};
