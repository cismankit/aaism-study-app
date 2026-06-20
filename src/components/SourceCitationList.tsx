import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Link2 } from 'lucide-react';
import type { SourceRef } from '../types/provenance';

const TYPE_LABELS: Record<SourceRef['type'], string> = {
  user_pasted: 'User pasted',
  rss: 'Feed / fetch',
  registry: 'Registry',
  llm_inferred: 'AI inferred',
  official_doc: 'Official doc',
  community: 'Community',
  computed: 'Computed',
};

interface SourceCitationListProps {
  sources: SourceRef[];
  defaultExpanded?: boolean;
  maxCollapsed?: number;
  className?: string;
}

export default function SourceCitationList({
  sources,
  defaultExpanded = false,
  maxCollapsed = 2,
  className = '',
}: SourceCitationListProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (sources.length === 0) return null;

  const visible = expanded ? sources : sources.slice(0, maxCollapsed);
  const hiddenCount = sources.length - visible.length;

  return (
    <div className={`text-[10px] ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1 text-theme-muted hover:text-cockpit transition-colors mb-1"
        aria-expanded={expanded}
      >
        <Link2 className="w-3 h-3" />
        <span className="font-medium">
          {sources.length} source{sources.length !== 1 ? 's' : ''}
        </span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <ul className="space-y-1">
        {visible.map(s => (
          <li key={s.id} className="flex items-start gap-2 pl-1">
            <span className="shrink-0 px-1 py-0.5 rounded bg-cockpit-track text-[9px] text-theme-muted">
              {TYPE_LABELS[s.type]}
            </span>
            {s.url ? (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5 min-w-0"
              >
                <span className="truncate">{s.label}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            ) : (
              <span className="text-theme-secondary truncate">{s.label}</span>
            )}
          </li>
        ))}
        {!expanded && hiddenCount > 0 && (
          <li className="pl-1 text-theme-muted">+{hiddenCount} more — expand to view</li>
        )}
      </ul>
    </div>
  );
}
