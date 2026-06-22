/** Aegis Pro — waitlist only until Stripe checkout ships */

export const PRO_WAITLIST_HEADLINE = 'Aegis Pro — join the waitlist';
export const PRO_TIER_CTA = 'Join waitlist';

/** Mirrors Explorer-tier gates in productTierService — not billed yet */
export const PRO_FEATURES_LIST = [
  'Team Packs & Content Studio',
  'OSINT Arsenal & Scenario Lab',
  'Donate & feature-request flows',
  'My Updates & support hub',
] as const;

export const FREE_FEATURES_LIST = [
  'All cert tracks (beta preview)',
  'AAISM full depth; others deepening',
  'Daily mission loop',
  'Practice + timed exam',
  'Intel Hub feeds',
  'Local progress · Groq / Ollama (BYOK)',
] as const;
