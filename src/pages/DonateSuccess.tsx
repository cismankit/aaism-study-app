import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Heart, ArrowLeft, Info } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const PAYMENT_CONFIRM_PARAMS = [
  'session_id',
  'payment_intent',
  'checkout_session_id',
  'payment_id',
  'razorpay_payment_id',
] as const;

export default function DonateSuccess() {
  const [searchParams] = useSearchParams();
  const paymentConfirmed = PAYMENT_CONFIRM_PARAMS.some(key => searchParams.has(key));

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Thank You!"
        subtitle="Your support helps keep Aegis free and improving"
        icon={Heart}
      />

      <div className="bg-theme-elevated rounded-xl border border-emerald-200 dark:border-emerald-800/40 p-8 text-center osint-widget">
        {paymentConfirmed ? (
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        ) : (
          <Info className="w-16 h-16 text-cyan-500 mx-auto mb-4" />
        )}
        <h2 className="text-xl font-bold text-cockpit mb-2">
          {paymentConfirmed ? 'Payment received' : 'Returned from checkout'}
        </h2>
        <p className="text-sm text-cockpit-muted mb-6">
          {paymentConfirmed
            ? 'Thank you for supporting Aegis. Contributions fund hosting, content updates, and study features for the community.'
            : 'You landed on the success page after a donate link. We cannot confirm payment in-app until checkout webhooks are configured — check your email for a receipt from Stripe, Razorpay, or PayPal if you completed checkout.'}
        </p>
        {!paymentConfirmed && (
          <p className="text-xs text-cockpit-subtle mb-6">
            Webhook confirmation is handled server-side when configured — see PAYMENTS.md in the repo for setup.
          </p>
        )}
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
