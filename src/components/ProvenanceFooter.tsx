import ConfidenceBadge from './ConfidenceBadge';
import SourceCitationList from './SourceCitationList';
import type { ProvenanceMeta } from '../types/provenance';

interface ProvenanceFooterProps {
  provenance: ProvenanceMeta;
  showSources?: boolean;
  compact?: boolean;
  className?: string;
}

/** Reusable footer for any AI output panel — badge + optional expandable sources. */
export default function ProvenanceFooter({
  provenance,
  showSources = true,
  compact = false,
  className = '',
}: ProvenanceFooterProps) {
  const { confidence, generatedAt, label } = provenance;

  return (
    <div
      className={`flex flex-col gap-1.5 pt-2 mt-2 border-t border-theme/60 ${className}`}
      aria-label={label ? `Provenance for ${label}` : 'Provenance'}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <ConfidenceBadge confidence={confidence} compact={compact} />
          {label && (
            <span className="text-[9px] text-theme-muted truncate">{label}</span>
          )}
        </div>
        {generatedAt && (
          <time
            dateTime={generatedAt}
            className="text-[9px] text-theme-muted shrink-0"
          >
            {new Date(generatedAt).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        )}
      </div>
      {showSources && confidence.sources.length > 0 && (
        <SourceCitationList sources={confidence.sources} maxCollapsed={2} />
      )}
    </div>
  );
}

/** Wraps a content block with provenance footer — use for each AI output section. */
export function ProvenancedBlock({
  provenance,
  children,
  className = '',
}: {
  provenance: ProvenanceMeta;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
      <ProvenanceFooter provenance={provenance} compact />
    </div>
  );
}
