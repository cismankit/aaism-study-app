import { Link } from 'react-router-dom';
import { CheckCircle, Heart, ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function DonateSuccess() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Thank You!"
        subtitle="Your support helps keep AAISM free and improving"
        icon={Heart}
      />

      <div className="bg-theme-elevated rounded-xl border border-emerald-200 dark:border-emerald-800/40 p-8 text-center osint-widget">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-cockpit mb-2">Payment received</h2>
        <p className="text-sm text-cockpit-muted mb-6">
          Thank you for supporting the AAISM Intelligence Platform. Contributions fund hosting,
          content updates, and new study features for the community.
        </p>
        <p className="text-xs text-cockpit-subtle mb-6">
          If you completed checkout via Stripe, Razorpay, or PayPal, you should receive a receipt from the payment provider.
          Webhook confirmation is handled server-side when configured — see PAYMENTS.md in the repo for setup.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/command"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Center
          </Link>
          <Link
            to="/donate"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-theme text-cockpit-muted rounded-lg text-sm font-medium hover:bg-cockpit-track transition-colors"
          >
            Donate again
          </Link>
        </div>
      </div>
    </div>
  );
}
