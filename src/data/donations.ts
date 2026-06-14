export interface CryptoDonation {
  id: string;
  name: string;
  symbol: string;
  network: string;
  address: string;
  isPlaceholder: boolean;
}

export interface TraditionalDonation {
  id: string;
  name: string;
  url: string;
  description: string;
  isPlaceholder: boolean;
}

export type DonationRegionId = 'india' | 'us' | 'europe' | 'global';

export type PaymentMethodType = 'link' | 'copy' | 'info';

export interface RegionalPaymentMethod {
  id: string;
  name: string;
  description: string;
  type: PaymentMethodType;
  value: string;
  howToPay: string;
  icon: 'upi' | 'bank' | 'card' | 'wallet' | 'crypto' | 'globe' | 'transfer';
  isPlaceholder: boolean;
  regions: DonationRegionId[];
}

export interface DonationRegion {
  id: DonationRegionId;
  label: string;
  flag: string;
  note?: string;
}

import {
  getEffectiveRazorpayUrl,
  getEffectiveStripeUrl,
} from '../services/integrationsConfigService';

function envOrDefault(key: string, fallback: string): string {
  const val = import.meta.env[key];
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function resolveStripeUrl(): string {
  return getEffectiveStripeUrl() ?? envOrDefault('VITE_DONATE_STRIPE', 'https://buy.stripe.com/placeholder-aaism');
}

function resolveRazorpayUrl(): string {
  return getEffectiveRazorpayUrl() ?? envOrDefault('VITE_DONATE_RAZORPAY', 'https://razorpay.me/placeholder-aaism');
}

function isStripePlaceholder(): boolean {
  return !getEffectiveStripeUrl() && isPlaceholderValue(envOrDefault('VITE_DONATE_STRIPE', 'placeholder'));
}

function isRazorpayPlaceholder(): boolean {
  return !getEffectiveRazorpayUrl() && isPlaceholderValue(envOrDefault('VITE_DONATE_RAZORPAY', 'placeholder'));
}

function isPlaceholderValue(value: string): boolean {
  return (
    value.includes('PLACEHOLDER') ||
    value.includes('placeholder') ||
    value.includes('yourname@upi') ||
    value.includes('XXXX')
  );
}

/** Append success/cancel return URLs for hosted checkout (GitHub Pages base-aware) */
export function withCheckoutReturnUrls(checkoutUrl: string): string {
  if (isPlaceholderValue(checkoutUrl) || checkoutUrl.includes('placeholder')) {
    return checkoutUrl;
  }
  try {
    const base = import.meta.env.BASE_URL ?? '/';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const success = `${origin}${base}donate/success`.replace(/([^:]\/)\/+/g, '$1');
    const cancel = `${origin}${base}donate/cancel`.replace(/([^:]\/)\/+/g, '$1');
    const url = new URL(checkoutUrl);
    if (!url.searchParams.has('success_url') && !url.searchParams.has('redirect_url')) {
      url.searchParams.set('success_url', success);
    }
    if (!url.searchParams.has('cancel_url')) {
      url.searchParams.set('cancel_url', cancel);
    }
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

const BTC_ADDRESS = envOrDefault('VITE_DONATE_BTC', 'bc1qPLACEHOLDER_AAISM_DEV_FUND');
const ETH_ADDRESS = envOrDefault('VITE_DONATE_ETH', '0xPLACEHOLDER000000000000000000000000AAISM');
const USDC_ADDRESS = envOrDefault('VITE_DONATE_USDC', '0xPLACEHOLDER000000000000000000000000AAISM');

export const cryptoDonations: CryptoDonation[] = [
  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin',
    address: BTC_ADDRESS,
    isPlaceholder: isPlaceholderValue(BTC_ADDRESS),
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: ETH_ADDRESS,
    isPlaceholder: isPlaceholderValue(ETH_ADDRESS),
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Ethereum (ERC-20)',
    address: USDC_ADDRESS,
    isPlaceholder: isPlaceholderValue(USDC_ADDRESS),
  },
];

export const traditionalDonations: TraditionalDonation[] = [
  {
    id: 'kofi',
    name: 'Ko-fi',
    url: envOrDefault('VITE_DONATE_KOFI', 'https://ko-fi.com/placeholder-aaism'),
    description: 'One-time or recurring support via Ko-fi',
    isPlaceholder: !import.meta.env.VITE_DONATE_KOFI,
  },
  {
    id: 'bmc',
    name: 'Buy Me a Coffee',
    url: envOrDefault('VITE_DONATE_BMC', 'https://buymeacoffee.com/placeholder-aaism'),
    description: 'Quick tips to fuel late-night study feature builds',
    isPlaceholder: !import.meta.env.VITE_DONATE_BMC,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    url: envOrDefault('VITE_DONATE_PAYPAL', 'https://paypal.me/placeholder-aaism'),
    description: 'Send a contribution via PayPal',
    isPlaceholder: !import.meta.env.VITE_DONATE_PAYPAL,
  },
];

export const donationRegions: DonationRegion[] = [
  {
    id: 'india',
    label: 'India',
    flag: '🇮🇳',
    note: 'UPI is the fastest option for Indian supporters. Bank transfer works for larger contributions.',
  },
  {
    id: 'us',
    label: 'United States',
    flag: '🇺🇸',
    note: 'PayPal, Stripe, and crypto are common. Card payments via Stripe link when configured.',
  },
  {
    id: 'europe',
    label: 'Europe',
    flag: '🇪🇺',
    note: 'SEPA bank transfers via Wise are low-fee. Stripe supports EUR when configured.',
  },
  {
    id: 'global',
    label: 'Global / Other',
    flag: '🌍',
    note: 'Crypto and international platforms work worldwide. Pick what is easiest in your country.',
  },
];

const UPI_ID = envOrDefault('VITE_DONATE_UPI', 'yourname@upi');
const RAZORPAY_URL = resolveRazorpayUrl();
const BANK_INDIA = envOrDefault(
  'VITE_DONATE_BANK_INDIA',
  'Account: XXXX0000 · IFSC: HDFC0000XXX · Name: AAISM Study Fund (PLACEHOLDER)'
);
const STRIPE_URL = resolveStripeUrl();
const WISE_URL = envOrDefault('VITE_DONATE_WISE', 'https://wise.com/pay/me/placeholder-aaism');

export const regionalPaymentMethods: RegionalPaymentMethod[] = [
  // India
  {
    id: 'upi',
    name: 'UPI (PhonePe / Google Pay / Paytm)',
    description: 'Instant transfer via any UPI app. Scan QR or enter UPI ID manually.',
    type: 'copy',
    value: UPI_ID,
    howToPay: 'Open your UPI app → Pay → Enter UPI ID → Add note "AAISM support"',
    icon: 'upi',
    isPlaceholder: isPlaceholderValue(UPI_ID),
    regions: ['india'],
  },
  {
    id: 'razorpay',
    name: 'Razorpay Payment Link',
    description: 'Card, UPI, netbanking, and wallets via a hosted Razorpay page.',
    type: 'link',
    value: RAZORPAY_URL,
    howToPay: 'Open link → choose UPI/card/netbanking → complete payment',
    icon: 'card',
    isPlaceholder: isRazorpayPlaceholder(),
    regions: ['india'],
  },
  {
    id: 'bank-india',
    name: 'Bank Transfer (NEFT / IMPS / RTGS)',
    description: 'Direct transfer to Indian bank account. IMPS works 24×7 for smaller amounts.',
    type: 'copy',
    value: BANK_INDIA,
    howToPay: 'Use netbanking or mobile app → Fund transfer → paste account details',
    icon: 'bank',
    isPlaceholder: isPlaceholderValue(BANK_INDIA),
    regions: ['india'],
  },
  // United States
  {
    id: 'paypal-us',
    name: 'PayPal',
    description: 'Send USD via PayPal.me — familiar and fast for US supporters.',
    type: 'link',
    value: envOrDefault('VITE_DONATE_PAYPAL', 'https://paypal.me/placeholder-aaism'),
    howToPay: 'Open link → enter amount → send as Friends & Family if available',
    icon: 'wallet',
    isPlaceholder: !import.meta.env.VITE_DONATE_PAYPAL,
    regions: ['us'],
  },
  {
    id: 'stripe-us',
    name: 'Stripe Payment Link',
    description: 'Secure card checkout via Stripe — no account needed.',
    type: 'link',
    value: STRIPE_URL,
    howToPay: 'Open link → enter card details → confirm one-time payment',
    icon: 'card',
    isPlaceholder: isStripePlaceholder(),
    regions: ['us'],
  },
  {
    id: 'kofi-us',
    name: 'Ko-fi',
    description: 'One-time or monthly support with optional message to the maintainer.',
    type: 'link',
    value: envOrDefault('VITE_DONATE_KOFI', 'https://ko-fi.com/placeholder-aaism'),
    howToPay: 'Open Ko-fi → choose amount → pay with card or PayPal',
    icon: 'wallet',
    isPlaceholder: !import.meta.env.VITE_DONATE_KOFI,
    regions: ['us'],
  },
  // Europe
  {
    id: 'wise-eu',
    name: 'Wise (SEPA / International)',
    description: 'Low-fee EUR transfers via SEPA or multi-currency Wise account.',
    type: 'link',
    value: WISE_URL,
    howToPay: 'Open Wise link → pay in EUR via SEPA bank transfer or card',
    icon: 'transfer',
    isPlaceholder: isPlaceholderValue(WISE_URL),
    regions: ['europe'],
  },
  {
    id: 'stripe-eu',
    name: 'Stripe (EUR)',
    description: 'Card payments in EUR when Stripe link is configured for European checkout.',
    type: 'link',
    value: STRIPE_URL,
    howToPay: 'Open link → pay in EUR with debit/credit card',
    icon: 'card',
    isPlaceholder: isStripePlaceholder(),
    regions: ['europe'],
  },
  {
    id: 'sepa-info',
    name: 'SEPA Bank Transfer',
    description: 'Euro-zone supporters can send SEPA transfers once IBAN is configured by maintainers.',
    type: 'info',
    value: envOrDefault(
      'VITE_DONATE_SEPA',
      'IBAN: DE00 XXXX XXXX XXXX XXXX XX · BIC: PLACEHOLDER · Reference: AAISM-SUPPORT'
    ),
    howToPay: 'Use your bank app → SEPA transfer → paste IBAN and reference',
    icon: 'bank',
    isPlaceholder: isPlaceholderValue(envOrDefault('VITE_DONATE_SEPA', 'PLACEHOLDER')),
    regions: ['europe'],
  },
  // Global
  {
    id: 'paypal-global',
    name: 'PayPal',
    description: 'Works in 200+ countries. Currency converted automatically.',
    type: 'link',
    value: envOrDefault('VITE_DONATE_PAYPAL', 'https://paypal.me/placeholder-aaism'),
    howToPay: 'Open PayPal.me link → enter amount in your local currency',
    icon: 'wallet',
    isPlaceholder: !import.meta.env.VITE_DONATE_PAYPAL,
    regions: ['global'],
  },
  {
    id: 'kofi-global',
    name: 'Ko-fi',
    description: 'Global platform for one-time tips and recurring monthly support.',
    type: 'link',
    value: envOrDefault('VITE_DONATE_KOFI', 'https://ko-fi.com/placeholder-aaism'),
    howToPay: 'Open Ko-fi → pick amount → pay with card or PayPal',
    icon: 'wallet',
    isPlaceholder: !import.meta.env.VITE_DONATE_KOFI,
    regions: ['global'],
  },
  {
    id: 'bmc-global',
    name: 'Buy Me a Coffee',
    description: 'Quick global tips — popular with open-source maintainers.',
    type: 'link',
    value: envOrDefault('VITE_DONATE_BMC', 'https://buymeacoffee.com/placeholder-aaism'),
    howToPay: 'Open link → buy a coffee (any amount) → pay with card',
    icon: 'wallet',
    isPlaceholder: !import.meta.env.VITE_DONATE_BMC,
    regions: ['global'],
  },
  {
    id: 'stripe-global',
    name: 'Stripe Payment Link',
    description: 'Universal card checkout — configure for USD, EUR, or multi-currency.',
    type: 'link',
    value: STRIPE_URL,
    howToPay: 'Open link → enter card → confirm payment',
    icon: 'card',
    isPlaceholder: isStripePlaceholder(),
    regions: ['global', 'us', 'europe'],
  },
  {
    id: 'wise-global',
    name: 'Wise',
    description: 'International transfers with transparent fees — good for non-US/EU supporters.',
    type: 'link',
    value: WISE_URL,
    howToPay: 'Open Wise link → send from your local currency account',
    icon: 'transfer',
    isPlaceholder: isPlaceholderValue(WISE_URL),
    regions: ['global'],
  },
  {
    id: 'btc-global',
    name: 'Bitcoin (BTC)',
    description: 'Borderless — copy address and send from any Bitcoin wallet.',
    type: 'copy',
    value: BTC_ADDRESS,
    howToPay: 'Copy address → paste in wallet → verify network is Bitcoin → send',
    icon: 'crypto',
    isPlaceholder: isPlaceholderValue(BTC_ADDRESS),
    regions: ['global', 'us', 'europe', 'india'],
  },
  {
    id: 'eth-global',
    name: 'Ethereum (ETH)',
    description: 'ERC-20 compatible wallets. Double-check you send ETH, not a token.',
    type: 'copy',
    value: ETH_ADDRESS,
    howToPay: 'Copy address → send ETH on Ethereum mainnet only',
    icon: 'crypto',
    isPlaceholder: isPlaceholderValue(ETH_ADDRESS),
    regions: ['global', 'us', 'europe', 'india'],
  },
  {
    id: 'usdc-global',
    name: 'USD Coin (USDC)',
    description: 'Stablecoin on Ethereum — $1 peg, useful for predictable amounts.',
    type: 'copy',
    value: USDC_ADDRESS,
    howToPay: 'Copy address → send USDC on Ethereum (ERC-20) network',
    icon: 'crypto',
    isPlaceholder: isPlaceholderValue(USDC_ADDRESS),
    regions: ['global', 'us', 'europe', 'india'],
  },
];

// Fix duplicate howToPay in wise-eu entry - I made an error. Let me fix when writing.

export function getAllRegionalPaymentMethods(): RegionalPaymentMethod[] {
  const stripeUrl = resolveStripeUrl();
  const razorpayUrl = resolveRazorpayUrl();
  return regionalPaymentMethods.map(method => {
    if (method.id.includes('stripe')) {
      return { ...method, value: stripeUrl, isPlaceholder: isStripePlaceholder() };
    }
    if (method.id === 'razorpay') {
      return { ...method, value: razorpayUrl, isPlaceholder: isRazorpayPlaceholder() };
    }
    return method;
  });
}

export function getPaymentMethodsForRegion(regionId: DonationRegionId): RegionalPaymentMethod[] {
  const seen = new Set<string>();
  return getAllRegionalPaymentMethods().filter(method => {
    if (!method.regions.includes(regionId)) return false;
    if (seen.has(method.id)) return false;
    seen.add(method.id);
    return true;
  });
}

export function hasPlaceholderPayments(regionId?: DonationRegionId): boolean {
  const methods = regionId ? getPaymentMethodsForRegion(regionId) : getAllRegionalPaymentMethods();
  return (
    methods.some(m => m.isPlaceholder) ||
    cryptoDonations.some(c => c.isPlaceholder) ||
    traditionalDonations.some(t => t.isPlaceholder)
  );
}

export const GITHUB_REPO = 'cismankit/aaism-study-app';
export const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues`;
export const GITHUB_NEW_ISSUE_URL = `https://github.com/${GITHUB_REPO}/issues/new`;

export const donationDisclaimer =
  'Donations are entirely voluntary and not required to use AAISM. Contributions support ongoing development, content updates, and hosting — not exam registration or certification fees.';

export const DONATE_ENV_KEYS = [
  'VITE_DONATE_BTC',
  'VITE_DONATE_ETH',
  'VITE_DONATE_USDC',
  'VITE_DONATE_UPI',
  'VITE_DONATE_RAZORPAY',
  'VITE_DONATE_BANK_INDIA',
  'VITE_DONATE_STRIPE',
  'VITE_DONATE_WISE',
  'VITE_DONATE_SEPA',
  'VITE_DONATE_KOFI',
  'VITE_DONATE_BMC',
  'VITE_DONATE_PAYPAL',
] as const;
