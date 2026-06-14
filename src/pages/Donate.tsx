import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee, Copy, Check, Bitcoin, Coins, CreditCard, ExternalLink,
  AlertTriangle, Code2, Smartphone, Building2, Globe,
  Wallet, ArrowRightLeft, Heart, Users, Zap, BookOpen,
} from 'lucide-react';
import {
  donationRegions,
  getPaymentMethodsForRegion,
  hasPlaceholderPayments,
  donationDisclaimer,
  GITHUB_REPO,
  DONATE_ENV_KEYS,
  type DonationRegionId,
  type RegionalPaymentMethod,
} from '../data/donations';
import PageHeader from '../components/PageHeader';

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

const paymentIcons: Record<RegionalPaymentMethod['icon'], typeof CreditCard> = {
  upi: Smartphone,
  bank: Building2,
  card: CreditCard,
  wallet: Wallet,
  crypto: Bitcoin,
  globe: Globe,
  transfer: ArrowRightLeft,
};

function PaymentMethodCard({ method }: { method: RegionalPaymentMethod }) {
  const Icon = paymentIcons[method.icon] || CreditCard;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200/50 dark:border-amber-800/30 p-4 osint-widget">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{method.name}</h3>
              {method.isPlaceholder && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                  PLACEHOLDER
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{method.description}</p>
          </div>
        </div>
        {method.type === 'copy' && <CopyButton value={method.value} />}
        {method.type === 'link' && (
          <a
            href={method.value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors flex-shrink-0"
          >
            Pay
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {(method.type === 'copy' || method.type === 'info') && (
        <code className="block text-xs sm:text-sm font-mono bg-amber-50 dark:bg-gray-900 px-3 py-2 rounded-lg border border-amber-200/50 dark:border-amber-800/30 break-all text-gray-700 dark:text-gray-300 mb-2">
          {method.value}
        </code>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
        <ArrowRightLeft className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
        <span><strong className="text-gray-600 dark:text-gray-300">How to pay:</strong> {method.howToPay}</span>
      </p>
    </div>
  );
}

const impactBullets = [
  { icon: BookOpen, title: 'Fresh questions', body: 'New scenarios, trap patterns, and domain refreshes aligned with exam trends.' },
  { icon: Zap, title: 'Faster features', body: 'Study modes, export tools, and UX polish — shipped over-the-air to requesters.' },
  { icon: Users, title: 'Free for everyone', body: 'Your coffee keeps AAISM free — no paywalls, no premium tiers, ever.' },
];

const socialProof = [
  'Built by volunteers who sat the exam themselves',
  'Used by candidates across 40+ countries',
  'Open source on GitHub — transparent and community-driven',
];

export default function Donate() {
  const [region, setRegion] = useState<DonationRegionId>('global');
  const methods = getPaymentMethodsForRegion(region);
  const selectedRegion = donationRegions.find(r => r.id === region)!;
  const hasPlaceholders = hasPlaceholderPayments(region);

  const cryptoMethods = methods.filter(m => m.icon === 'crypto');
  const fiatMethods = methods.filter(m => m.icon !== 'crypto');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        icon={Coffee}
        iconClassName="text-amber-500"
        title="Donate"
        subtitle="Keep AAISM free for everyone — your support funds content and features."
      />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-yellow-500/10 border border-amber-500/30 p-6 sm:p-8">
        <Coffee className="absolute top-6 right-6 w-16 h-16 text-amber-500/20 animate-float" />
        <div className="relative z-10">
          <p className="text-amber-900/70 dark:text-amber-100/80 text-sm sm:text-base max-w-xl leading-relaxed">
            Choose a payment method below, or{' '}
            <Link to="/feature-request" className="text-amber-700 dark:text-amber-300 font-medium hover:underline">
              request a feature with tiered support
            </Link>
            .
          </p>
          <a
            href="#payment-methods"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors mt-4"
          >
            <Heart className="w-4 h-4" />
            Choose payment method
          </a>
        </div>
      </div>

      {/* Social proof */}
      <div className="flex flex-wrap gap-2">
        {socialProof.map(line => (
          <span
            key={line}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200"
          >
            {line}
          </span>
        ))}
      </div>

      {/* Impact bullets */}
      <section className="grid gap-3 sm:grid-cols-3">
        {impactBullets.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-amber-200/40 dark:border-amber-800/20 osint-widget"
            >
              <Icon className="w-5 h-5 text-amber-500 mb-2" />
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
            </div>
          );
        })}
      </section>

      {hasPlaceholders && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-700 dark:text-yellow-300">Placeholder payment details</p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Addresses and links below are placeholders until configured. Edit{' '}
              <code className="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">src/data/donations.ts</code>{' '}
              or set <code className="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">VITE_DONATE_*</code>{' '}
              environment variables before accepting real donations.
            </p>
          </div>
        </div>
      )}

      {/* Region Selector */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-500" />
          Choose Your Region
        </h2>
        <div className="flex flex-wrap gap-2">
          {donationRegions.map(r => (
            <button
              key={r.id}
              onClick={() => setRegion(r.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                region === r.id
                  ? 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-amber-400'
              }`}
            >
              <span className="mr-1.5">{r.flag}</span>
              {r.label}
            </button>
          ))}
        </div>
        {selectedRegion.note && (
          <p className="text-sm text-gray-500 dark:text-gray-400 bg-amber-50 dark:bg-gray-800/50 rounded-lg px-4 py-3 border border-amber-200/40 dark:border-amber-800/20">
            {selectedRegion.note}
          </p>
        )}
      </section>

      {/* Regional payment methods */}
      {fiatMethods.length > 0 && (
        <section id="payment-methods" className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">
              Payment Methods — {selectedRegion.label}
            </h2>
          </div>
          <div className="space-y-3">
            {fiatMethods.map(method => (
              <PaymentMethodCard key={method.id} method={method} />
            ))}
          </div>
        </section>
      )}

      {/* Crypto */}
      {cryptoMethods.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Cryptocurrency</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send only the listed asset on the correct network. Double-check addresses before sending.
          </p>
          <div className="space-y-3">
            {cryptoMethods.map(method => {
              const Icon = method.id.includes('btc') ? Bitcoin : Coins;
              return (
                <div
                  key={method.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{method.name}</h3>
                          {method.isPlaceholder && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                              PLACEHOLDER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{method.description}</p>
                      </div>
                    </div>
                    <CopyButton value={method.value} />
                  </div>
                  <code className="block text-xs sm:text-sm font-mono bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 break-all text-gray-700 dark:text-gray-300 mb-2">
                    {method.value}
                  </code>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong className="text-gray-600 dark:text-gray-300">How to pay:</strong> {method.howToPay}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}


      {/* Config hint for maintainers */}
      <section className="flex items-start gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <Code2 className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300">For maintainers</p>
          <p className="mt-1">
            Update payment details in <code className="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">src/data/donations.ts</code>.
            Optional env overrides:{' '}
            {DONATE_ENV_KEYS.map((key, i) => (
              <span key={key}>
                <code className="text-xs">{key}</code>
                {i < DONATE_ENV_KEYS.length - 1 ? ', ' : '.'}
              </span>
            ))}
          </p>
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-amber-600 dark:text-amber-400 hover:underline text-xs font-medium"
          >
            View source on GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-4">
        {donationDisclaimer}
      </p>
    </div>
  );
}
