/** Aegis Pro — UI framing only until Stripe checkout ships */

export const PRO_PRICE_USD = 19.99;
export const PRO_TRIAL_DAYS = 7;

export const PRO_FEATURES_LIST = [
  'All cert tracks',
  'Cloud memory sync',
  'Unlimited agent runs',
  'Career intel',
  'Ops copilot',
  'Daily missions',
  'Mac app + offline PWA',
] as const;

export const FREE_FEATURES_LIST = [
  'One cert track (AAISM)',
  'Daily mission loop',
  'Practice + timed exam',
  'Intel Hub feeds',
  'Local progress storage',
  'Groq / Ollama (bring your key)',
] as const;

export const PRO_TIER_HEADLINE = `Aegis Pro $${PRO_PRICE_USD.toFixed(2)}/mo`;

export const PRO_TIER_CTA = 'Start 7-day trial — coming soon';
