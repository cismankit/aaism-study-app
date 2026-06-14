import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Radio, Sparkles, ChevronRight, Package, Clock, CheckCircle2,
  AlertCircle, Coffee,
} from 'lucide-react';
import {
  loadFeatureRequests,
  statusLabels,
  statusColors,
  priorityLabels,
  type FeatureRequest,
} from '../services/featureRequestStore';
import { releaseFeed, getReleasesForRequest } from '../data/releaseFeed';
import { getFeatureTier } from '../data/featureTiers';

function StatusIcon({ status }: { status: FeatureRequest['status'] }) {
  switch (status) {
    case 'shipped':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 text-blue-500" />;
    case 'payment_pending':
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    default:
      return <Package className="w-4 h-4 text-gray-400" />;
  }
}

function RequestCard({ request }: { request: FeatureRequest }) {
  const tier = getFeatureTier(request.tierId);
  const matchingReleases = getReleasesForRequest(request.id, request.tags);
  const hasShippedRelease = matchingReleases.length > 0;

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 osint-widget space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-relaxed">{request.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[request.status]}`}>
              {statusLabels[request.status]}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {priorityLabels[request.priority]}
            </span>
            <span className="text-[10px] text-gray-400">
              {tier.emoji} {tier.name} · {request.paymentNote}
            </span>
          </div>
        </div>
        <StatusIcon status={request.status} />
      </div>

      {hasShippedRelease && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              ✨ Your requested feature shipped!
            </p>
            {matchingReleases.map(rel => (
              <p key={rel.id} className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <strong>{rel.version}</strong> — {rel.title}
              </p>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400">
        Submitted {new Date(request.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function MyUpdates() {
  const requests = useMemo(() => loadFeatureRequests(), []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Radio className="w-7 h-7 text-cyan-500" />
          My Updates
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Track your feature requests and see when they ship over-the-air
        </p>
      </div>

      {/* Release feed */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Platform Release Feed
        </h2>
        <div className="space-y-3">
          {releaseFeed
            .slice()
            .reverse()
            .map(entry => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 osint-widget"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    v{entry.version}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.shippedAt).toLocaleDateString()}
                  </span>
                  {entry.tags?.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-semibold text-sm">{entry.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {entry.description}
                </p>
              </div>
            ))}
        </div>
      </section>

      {/* User requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-500" />
            Your Feature Requests
          </h2>
          <Link
            to="/feature-request"
            className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            New request
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
            <Coffee className="w-10 h-10 text-amber-500/50 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No requests yet</p>
            <Link
              to="/feature-request"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              Request a feature
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
