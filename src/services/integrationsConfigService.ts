/** In-app integration config — stored in localStorage only, never committed to git */

export const INTEGRATIONS_CONFIG_KEY = 'aaism-integrations-config';

export interface IntegrationsConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  stripeCheckoutUrl?: string;
  razorpayPaymentLink?: string;
  /** Razorpay publishable key_id only — never key_secret */
  razorpayKeyId?: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key}:`, e);
  }
}

export function loadIntegrationsConfig(): IntegrationsConfig {
  return readJson<IntegrationsConfig>(INTEGRATIONS_CONFIG_KEY) ?? {};
}

export function saveIntegrationsConfig(config: IntegrationsConfig): void {
  writeJson(INTEGRATIONS_CONFIG_KEY, config);
}

function trimOrEmpty(v?: string): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** Reject secret-looking values before save */
export function sanitizeIntegrationsConfig(raw: IntegrationsConfig): {
  config: IntegrationsConfig;
  rejected: string[];
} {
  const rejected: string[] = [];
  const config: IntegrationsConfig = {};

  const url = trimOrEmpty(raw.supabaseUrl);
  if (url) config.supabaseUrl = url;

  const anon = trimOrEmpty(raw.supabaseAnonKey);
  if (anon) {
    if (anon.startsWith('sb_secret_') || anon.includes('service_role')) {
      rejected.push('Supabase service role keys are not allowed — use the anon (public) key only.');
    } else {
      config.supabaseAnonKey = anon;
    }
  }

  const stripe = trimOrEmpty(raw.stripeCheckoutUrl);
  if (stripe) {
    if (stripe.startsWith('sk_') || stripe.startsWith('rk_')) {
      rejected.push('Stripe secret keys are not allowed — use a hosted checkout URL (buy.stripe.com/…).');
    } else {
      config.stripeCheckoutUrl = stripe;
    }
  }

  const razorpay = trimOrEmpty(raw.razorpayPaymentLink);
  if (razorpay) {
    if (razorpay.includes('key_secret') || razorpay.startsWith('rzp_live_') && razorpay.length > 40) {
      rejected.push('Razorpay secrets are not allowed — use a payment link URL (razorpay.me/…).');
    } else {
      config.razorpayPaymentLink = razorpay;
    }
  }

  const keyId = trimOrEmpty(raw.razorpayKeyId);
  if (keyId) {
    if (keyId.startsWith('rzp_live_') && keyId.includes('_secret')) {
      rejected.push('Razorpay key_secret is not allowed — use publishable key_id only.');
    } else {
      config.razorpayKeyId = keyId;
    }
  }

  return { config, rejected };
}

export function getEffectiveSupabaseConfig(): { url: string; anonKey: string } | null {
  const stored = loadIntegrationsConfig();
  const url = trimOrEmpty(stored.supabaseUrl) || trimOrEmpty(import.meta.env.VITE_SUPABASE_URL as string);
  const anonKey =
    trimOrEmpty(stored.supabaseAnonKey) || trimOrEmpty(import.meta.env.VITE_SUPABASE_ANON_KEY as string);

  if (!url || !anonKey || url.includes('placeholder') || anonKey.includes('placeholder')) {
    return null;
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getEffectiveSupabaseConfig() !== null;
}

export function getEffectiveStripeUrl(): string | null {
  const stored = trimOrEmpty(loadIntegrationsConfig().stripeCheckoutUrl);
  const env = trimOrEmpty(import.meta.env.VITE_DONATE_STRIPE as string);
  const url = stored || env;
  if (!url || isPlaceholderPaymentUrl(url)) return null;
  return url;
}

export function getEffectiveRazorpayUrl(): string | null {
  const stored = trimOrEmpty(loadIntegrationsConfig().razorpayPaymentLink);
  const env = trimOrEmpty(import.meta.env.VITE_DONATE_RAZORPAY as string);
  const url = stored || env;
  if (!url || isPlaceholderPaymentUrl(url)) return null;
  return url;
}

export function isPlaceholderPaymentUrl(url: string): boolean {
  return (
    url.includes('PLACEHOLDER') ||
    url.includes('placeholder') ||
    url.includes('yourname') ||
    url.includes('XXXX')
  );
}

export function validateCheckoutUrl(
  url: string,
  provider: 'stripe' | 'razorpay',
): { valid: boolean; message: string } {
  const trimmed = url.trim();
  if (!trimmed) return { valid: false, message: 'URL is empty.' };

  if (trimmed.startsWith('sk_') || trimmed.startsWith('rk_')) {
    return { valid: false, message: 'This looks like a secret key — use a hosted checkout URL instead.' };
  }

  try {
    const parsed = new URL(trimmed);
    if (provider === 'stripe') {
      const ok =
        parsed.hostname === 'buy.stripe.com' ||
        parsed.hostname.endsWith('.stripe.com') ||
        parsed.hostname === 'checkout.stripe.com';
      return ok
        ? { valid: true, message: 'Valid Stripe hosted checkout URL.' }
        : { valid: false, message: 'Expected buy.stripe.com or checkout.stripe.com URL.' };
    }
    const ok =
      parsed.hostname === 'razorpay.me' ||
      parsed.hostname.endsWith('.razorpay.com') ||
      parsed.hostname === 'pages.razorpay.com';
    return ok
      ? { valid: true, message: 'Valid Razorpay payment link URL.' }
      : { valid: false, message: 'Expected razorpay.me or pages.razorpay.com URL.' };
  } catch {
    return { valid: false, message: 'Invalid URL format — include https://' };
  }
}

export async function testSupabaseConnection(
  url?: string,
  anonKey?: string,
): Promise<{ ok: boolean; message: string }> {
  const cfg = url && anonKey ? { url: url.trim(), anonKey: anonKey.trim() } : getEffectiveSupabaseConfig();
  if (!cfg) {
    return { ok: false, message: 'Supabase URL and anon key required.' };
  }

  try {
    const res = await fetch(`${cfg.url.replace(/\/$/, '')}/rest/v1/`, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok || res.status === 404 || res.status === 401) {
      return { ok: true, message: 'Supabase reachable — REST endpoint responded.' };
    }
    return { ok: false, message: `Supabase returned ${res.status} ${res.statusText}` };
  } catch (e) {
    return {
      ok: false,
      message: `Cannot reach Supabase: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

export function hasAnyPaymentConfigured(): boolean {
  return Boolean(getEffectiveStripeUrl() || getEffectiveRazorpayUrl());
}
