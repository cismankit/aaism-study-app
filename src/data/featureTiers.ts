import type { DonationRegionId } from './donations';

export type FeatureTierId = 'coffee' | 'boost' | 'custom';

export interface FeatureTier {
  id: FeatureTierId;
  emoji: string;
  name: string;
  description: string;
  perks: string[];
  priceUsd: number;
  priceInr: number;
  requiresPayment: boolean;
}

export const featureTiers: FeatureTier[] = [
  {
    id: 'coffee',
    emoji: '☕',
    name: 'Coffee',
    description: 'A warm thank-you — your name in supporters and fuel for the next question.',
    perks: ['Thank you message', 'Name in supporters list', 'Keeps AAISM free'],
    priceUsd: 5,
    priceInr: 99,
    requiresPayment: true,
  },
  {
    id: 'boost',
    emoji: '🚀',
    name: 'Feature Boost',
    description: 'Priority queue for your feature request — we build it sooner.',
    perks: ['Priority feature queue', 'Status updates on My Updates', 'Shipped over-the-air'],
    priceUsd: 25,
    priceInr: 499,
    requiresPayment: true,
  },
  {
    id: 'custom',
    emoji: '⭐',
    name: 'Custom Build',
    description: 'Dedicated custom feature scoped to your request — full build cycle.',
    perks: ['Dedicated scoping', 'Direct OTA release to you', 'Custom feature tag for tracking'],
    priceUsd: 99,
    priceInr: 4999,
    requiresPayment: true,
  },
];

export function getFeatureTier(id: FeatureTierId): FeatureTier {
  return featureTiers.find(t => t.id === id) ?? featureTiers[0];
}

export function formatTierPrice(tier: FeatureTier, region: DonationRegionId): string {
  if (region === 'india') return `₹${tier.priceInr}`;
  return `$${tier.priceUsd}`;
}

export function buildPaymentNote(requestId: string): string {
  return `AAISM-REQ-${requestId}`;
}

function envOrDefault(key: string, fallback: string): string {
  const val = import.meta.env[key];
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

/** Regional payment deep-link with amount hint for feature requests */
export function getFeaturePaymentLink(
  tierId: FeatureTierId,
  region: DonationRegionId,
  requestId: string,
): { url: string; note: string; label: string } {
  const tier = getFeatureTier(tierId);
  const note = buildPaymentNote(requestId);
  const amount = region === 'india' ? tier.priceInr : tier.priceUsd;
  const currency = region === 'india' ? 'INR' : 'USD';

  const paypal = envOrDefault('VITE_DONATE_PAYPAL', 'https://paypal.me/placeholder-aaism');
  const razorpay = envOrDefault('VITE_DONATE_RAZORPAY', 'https://razorpay.me/placeholder-aaism');
  const stripe = envOrDefault('VITE_DONATE_STRIPE', 'https://buy.stripe.com/placeholder-aaism');
  const bmc = envOrDefault('VITE_DONATE_BMC', 'https://buymeacoffee.com/placeholder-aaism');

  if (region === 'india') {
    return {
      url: `${razorpay}/${tier.priceInr}`,
      note,
      label: `Pay ₹${tier.priceInr} via Razorpay`,
    };
  }

  if (region === 'us') {
    return {
      url: `${paypal}/${tier.priceUsd}USD`,
      note,
      label: `Pay $${tier.priceUsd} via PayPal`,
    };
  }

  if (region === 'europe') {
    return {
      url: stripe,
      note: `${note} · ${currency} ${amount}`,
      label: `Pay via Stripe (€${tier.priceUsd})`,
    };
  }

  // global
  return {
    url: bmc,
    note: `${note} · $${tier.priceUsd}`,
    label: `Pay $${tier.priceUsd} via Buy Me a Coffee`,
  };
}

export function getUpiPaymentDetails(requestId: string, tierId: FeatureTierId): {
  upiId: string;
  amount: number;
  note: string;
} {
  const tier = getFeatureTier(tierId);
  const upi = envOrDefault('VITE_DONATE_UPI', 'yourname@upi');
  return {
    upiId: upi,
    amount: tier.priceInr,
    note: buildPaymentNote(requestId),
  };
}
