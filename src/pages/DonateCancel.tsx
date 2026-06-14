import { Link } from 'react-router-dom';
import { XCircle, Heart, ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function DonateCancel() {
  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Checkout Cancelled"
        subtitle="No charge was made"
        icon={Heart}
      />

      <div className="bg-theme-elevated rounded-xl border border-theme p-8 text-center osint-widget">
        <XCircle className="w-16 h-16 text-theme-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-cockpit mb-2">Payment not completed</h2>
        <p className="text-sm text-cockpit-muted mb-6">
          You cancelled or closed the checkout window. No payment was processed.
          AAISM remains free to use — donations are always optional.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/donate"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Try again
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-theme text-cockpit-muted rounded-lg text-sm font-medium hover:bg-cockpit-track transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
