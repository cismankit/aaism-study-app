import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Coffee, Copy, Check, ExternalLink, ChevronRight,
  Rocket, Star, Heart, Github, Smartphone,
} from 'lucide-react';
import {
  donationRegions,
  type DonationRegionId,
} from '../data/donations';
import {
  featureTiers,
  getFeaturePaymentLink,
  getUpiPaymentDetails,
  formatTierPrice,
  type FeatureTierId,
} from '../data/featureTiers';
import {
  createFeatureRequest,
  buildGitHubIssueUrl,
  markPaymentSent,
  type FeatureRequestPriority,
  type FeatureRequest,
} from '../services/featureRequestStore';

const priorityOptions: { id: FeatureRequestPriority; label: string; color: string }[] = [
  { id: 'nice', label: 'Nice to have', color: 'border-gray-300 dark:border-gray-600' },
  { id: 'important', label: 'Important', color: 'border-blue-400' },
  { id: 'exam_blocker', label: 'Exam blocker', color: 'border-red-400' },
];

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function PaymentPanel({
  request,
  onPaymentSent,
}: {
  request: FeatureRequest;
  onPaymentSent: () => void;
}) {
  const payment = getFeaturePaymentLink(request.tierId, request.region, request.id);
  const upi = request.region === 'india' ? getUpiPaymentDetails(request.id, request.tierId) : null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-5 space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold">One click to complete payment</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Include this reference in your payment note so we can match your request:
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        <code className="text-sm font-mono bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-amber-300/50 dark:border-amber-700/50">
          {request.paymentNote}
        </code>
        <CopyButton value={request.paymentNote} />
      </div>

      {upi && (
        <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Smartphone className="w-4 h-4 text-amber-500" />
            UPI option (India)
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            UPI ID: <code className="font-mono">{upi.upiId}</code> · Amount: ₹{upi.amount} · Note: {upi.note}
          </p>
          <CopyButton value={`${upi.upiId} · ₹${upi.amount} · ${upi.note}`} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={payment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors animate-pulse-glow-amber"
        >
          {payment.label}
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={onPaymentSent}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-amber-400/50 text-sm font-medium hover:bg-amber-500/10 transition-colors"
        >
          I've sent payment
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SuccessView({ request }: { request: FeatureRequest }) {
  const issueUrl = buildGitHubIssueUrl(request);

  return (
    <div className="text-center space-y-6 py-8 animate-bounce-in">
      <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
        <Heart className="w-10 h-10 text-amber-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold">Thank you! 🎉</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
          Your feature request is saved. Complete payment to boost priority, or track progress on My Updates.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/my-updates"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
        >
          Track on My Updates
          <ChevronRight className="w-4 h-4" />
        </Link>
        <a
          href={issueUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Github className="w-4 h-4" />
          Backup on GitHub
        </a>
      </div>
    </div>
  );
}

export default function FeatureRequest() {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<FeatureRequestPriority>('nice');
  const [email, setEmail] = useState('');
  const [tierId, setTierId] = useState<FeatureTierId>('boost');
  const [region, setRegion] = useState<DonationRegionId>('global');
  const [submitted, setSubmitted] = useState(false);
  const [savedRequest, setSavedRequest] = useState<FeatureRequest | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    const request = createFeatureRequest({
      description,
      priority,
      email: email || undefined,
      tierId,
      region,
    });
    setSavedRequest(request);
    setSubmitted(true);
  }

  const tierIcons: Record<FeatureTierId, typeof Coffee> = {
    coffee: Coffee,
    boost: Rocket,
    custom: Star,
  };

  if (submitted && savedRequest) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <SuccessView request={savedRequest} />
        <PaymentPanel
          request={savedRequest}
          onPaymentSent={() => {
            markPaymentSent(savedRequest.id);
            setSavedRequest({ ...savedRequest, status: 'in_progress' });
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Sparkles className="w-7 h-7 text-amber-500" />
          Request a Feature
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Two lines. Pick a tier. We ship over-the-air when it's ready.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-yellow-500/10 border border-amber-500/25 p-5">
        <Coffee className="absolute top-4 right-4 w-10 h-10 text-amber-500/25 animate-float" />
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <strong>Fuel the next question.</strong> Tell us what would make your study flow better —
          dark mode tweaks, new quiz modes, export tools, anything. No complex forms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* What do you want? */}
        <div className="space-y-2">
          <label className="text-sm font-medium">What do you want?</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            required
            placeholder="e.g. Add a timed mock exam mode with 150 questions… · Export my weak areas as PDF… · Dark mode for cheat sheet…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none resize-none"
          />
        </div>

        {/* Priority chips */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <div className="flex flex-wrap gap-2">
            {priorityOptions.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPriority(opt.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                  priority === opt.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-200'
                    : `${opt.color} bg-white dark:bg-gray-800 hover:border-amber-400`
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email (optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Email for updates <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none"
          />
        </div>

        {/* Region */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your region (for payment)</label>
          <div className="flex flex-wrap gap-2">
            {donationRegions.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegion(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  region === r.id
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-400'
                }`}
              >
                {r.flag} {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tier selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Support tier</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {featureTiers.map(tier => {
              const Icon = tierIcons[tier.id];
              const selected = tierId === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setTierId(tier.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all osint-widget ${
                    selected
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-sm">{tier.emoji} {tier.name}</span>
                  </div>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {formatTierPrice(tier, region)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {tier.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={!description.trim()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors animate-pulse-glow-amber"
        >
          <Sparkles className="w-4 h-4" />
          Submit &amp; Pay
        </button>
      </form>

      <p className="text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-4">
        Requests are saved locally and optionally backed up to GitHub Issues. Payment opens your regional
        provider — include the AAISM-REQ reference in the note.
      </p>
    </div>
  );
}
