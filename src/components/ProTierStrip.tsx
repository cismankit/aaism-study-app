import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  PRO_TIER_HEADLINE,
  PRO_TIER_CTA,
  PRO_FEATURES_LIST,
  FREE_FEATURES_LIST,
} from '../data/proTier';

interface ProTierStripProps {
  compact?: boolean;
  showFreeCompare?: boolean;
}

export default function ProTierStrip({ compact, showFreeCompare }: ProTierStripProps) {
  return (
    <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/5 to-emerald-500/5 p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-cockpit">{PRO_TIER_HEADLINE}</p>
          {!compact && (
            <ul className="mt-2 space-y-1">
              {PRO_FEATURES_LIST.map(item => (
                <li key={item} className="text-xs text-cockpit-muted flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {compact && (
            <p className="text-xs text-cockpit-muted mt-1">
              {PRO_FEATURES_LIST.slice(0, 3).join(' · ')} · + more
            </p>
          )}
          {showFreeCompare && (
            <div className="mt-3 pt-3 border-t border-theme/60">
              <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wide mb-1.5">Free includes</p>
              <ul className="space-y-0.5">
                {FREE_FEATURES_LIST.map(item => (
                  <li key={item} className="text-[11px] text-theme-muted">· {item}</li>
                ))}
              </ul>
            </div>
          )}
          <Link
            to="/settings"
            className="inline-flex mt-3 text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline"
          >
            {PRO_TIER_CTA} → Integrations
          </Link>
        </div>
      </div>
    </div>
  );
}
