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

function envOrDefault(key: string, fallback: string): string {
  const val = import.meta.env[key];
  return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function isPlaceholderAddress(address: string): boolean {
  return address.includes('PLACEHOLDER');
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
    isPlaceholder: isPlaceholderAddress(BTC_ADDRESS),
  },
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: ETH_ADDRESS,
    isPlaceholder: isPlaceholderAddress(ETH_ADDRESS),
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    network: 'Ethereum (ERC-20)',
    address: USDC_ADDRESS,
    isPlaceholder: isPlaceholderAddress(USDC_ADDRESS),
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

export const GITHUB_REPO = 'cismankit/aaism-study-app';
export const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues`;
export const GITHUB_NEW_ISSUE_URL = `https://github.com/${GITHUB_REPO}/issues/new`;

export const donationDisclaimer =
  'Donations are entirely voluntary and not required to use AAISM. Contributions support ongoing development, content updates, and hosting — not exam registration or certification fees.';
