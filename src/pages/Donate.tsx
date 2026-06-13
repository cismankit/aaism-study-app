import { useState } from 'react';
import {
  Heart, Copy, Check, Bitcoin, Coins, CreditCard, ExternalLink,
  AlertTriangle, Sparkles, Code2,
} from 'lucide-react';
import {
  cryptoDonations,
  traditionalDonations,
  donationDisclaimer,
  GITHUB_REPO,
} from '../data/donations';

function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = address;
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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
      title="Copy address"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

const cryptoIcons: Record<string, typeof Bitcoin> = {
  btc: Bitcoin,
  eth: Coins,
  usdc: Coins,
};

export default function Donate() {
  const hasPlaceholders =
    cryptoDonations.some(c => c.isPlaceholder) ||
    traditionalDonations.some(t => t.isPlaceholder);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Heart className="w-7 h-7 text-pink-500" />
          Support AAISM
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Voluntary contributions help fund development, content, and hosting
        </p>
      </div>

      {/* Thank you hero */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/15 via-cyan-500/10 to-purple-500/15 border border-emerald-500/20 p-6">
        <Sparkles className="absolute top-4 right-4 w-8 h-8 text-emerald-500/30" />
        <h2 className="text-lg font-semibold mb-2">Thank you for considering a donation</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
          AAISM is a free, open study tool for the AI security community. Donations are optional and
          never required to access any feature. Your support helps maintain question banks, build new
          study modes, and keep GitHub Pages hosting online for everyone.
        </p>
      </div>

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

      {/* Why support matters */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Why your support matters</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Content updates', body: 'New questions, scenarios, and playbook refreshes aligned with exam trends.' },
            { title: 'Infrastructure', body: 'GitHub Pages hosting, CI builds, and tooling to ship updates reliably.' },
            { title: 'Community features', body: 'Agent discovery, intel feeds, and gamification that take time to curate.' },
          ].map(item => (
            <div
              key={item.title}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 osint-widget"
            >
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Crypto */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bitcoin className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Cryptocurrency</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Send only the listed asset on the correct network. Double-check addresses before sending.
        </p>
        <div className="space-y-3">
          {cryptoDonations.map(crypto => {
            const Icon = cryptoIcons[crypto.id] || Coins;
            return (
              <div
                key={crypto.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 osint-widget"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{crypto.name}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">
                          {crypto.symbol}
                        </span>
                        {crypto.isPlaceholder && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                            PLACEHOLDER
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{crypto.network}</p>
                    </div>
                  </div>
                  <CopyAddressButton address={crypto.address} />
                </div>
                <code className="block text-xs sm:text-sm font-mono bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 break-all text-gray-700 dark:text-gray-300">
                  {crypto.address}
                </code>
              </div>
            );
          })}
        </div>
      </section>

      {/* Traditional */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Traditional Payments</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {traditionalDonations.map(option => (
            <a
              key={option.id}
              href={option.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all osint-widget group"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {option.name}
                </h3>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">{option.description}</p>
              {option.isPlaceholder && (
                <span className="mt-2 text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 self-start">
                  PLACEHOLDER LINK
                </span>
              )}
            </a>
          ))}
        </div>
      </section>

      {/* Config hint */}
      <section className="flex items-start gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <Code2 className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-300">For maintainers</p>
          <p className="mt-1">
            Update addresses in <code className="text-xs px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">src/data/donations.ts</code>.
            Optional env overrides: <code className="text-xs">VITE_DONATE_BTC</code>,{' '}
            <code className="text-xs">VITE_DONATE_ETH</code>, <code className="text-xs">VITE_DONATE_USDC</code>,{' '}
            <code className="text-xs">VITE_DONATE_KOFI</code>, <code className="text-xs">VITE_DONATE_BMC</code>,{' '}
            <code className="text-xs">VITE_DONATE_PAYPAL</code>.
          </p>
          <a
            href={`https://github.com/${GITHUB_REPO}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-emerald-600 dark:text-emerald-400 hover:underline text-xs font-medium"
          >
            View source on GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed border-t border-gray-200 dark:border-gray-700 pt-4">
        {donationDisclaimer}
      </p>
    </div>
  );
}
