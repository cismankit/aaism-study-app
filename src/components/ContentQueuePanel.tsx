import { useState, useEffect, useCallback } from 'react';
import {
  ListOrdered, ChevronRight, CheckCircle2, FileOutput, Trash2,
  Clock, X,
} from 'lucide-react';
import {
  type ContentQueueItem,
  type ContentQueueStatus,
  getContentQueue,
  updateQueueItemStatus,
  removeFromContentQueue,
  getQueueCounts,
} from '../services/contentQueueService';
import { downloadMarkdown } from '../services/contentStudioService';

const STATUS_LABEL: Record<ContentQueueStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  exported: 'Exported',
};

const STATUS_COLOR: Record<ContentQueueStatus, string> = {
  draft: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  approved: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  exported: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
};

const NEXT_STATUS: Partial<Record<ContentQueueStatus, ContentQueueStatus>> = {
  draft: 'approved',
  approved: 'exported',
};

interface ContentQueuePanelProps {
  onClose?: () => void;
}

export default function ContentQueuePanel({ onClose }: ContentQueuePanelProps) {
  const [items, setItems] = useState<ContentQueueItem[]>([]);
  const [filter, setFilter] = useState<ContentQueueStatus | 'all'>('all');

  const refresh = useCallback(() => setItems(getContentQueue()), []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'aaism-content-queue') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const counts = getQueueCounts();
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  function advanceStatus(item: ContentQueueItem) {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    updateQueueItemStatus(item.id, next);
    if (next === 'exported') {
      const slug = item.formatId;
      downloadMarkdown(`${slug}-${item.id.slice(-6)}.md`, item.content);
    }
    refresh();
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Content Queue</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close queue">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
        {(['all', 'draft', 'approved', 'exported'] as const).map(key => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap ${
              filter === key
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {key === 'all' ? 'All' : STATUS_LABEL[key]}
            {key !== 'all' && counts[key] > 0 && ` (${counts[key]})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            No items yet. Add generated content from the output step.
          </p>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                    {item.formatLabel}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                {item.content.slice(0, 120)}…
              </p>
              <div className="flex gap-1">
                {NEXT_STATUS[item.status] && (
                  <button
                    onClick={() => advanceStatus(item)}
                    className="flex-1 text-[10px] px-2 py-1 rounded-md bg-violet-600 text-white hover:bg-violet-700 flex items-center justify-center gap-1"
                  >
                    {item.status === 'draft' ? (
                      <><CheckCircle2 className="w-3 h-3" /> Approve</>
                    ) : (
                      <><FileOutput className="w-3 h-3" /> Export</>
                    )}
                  </button>
                )}
                <button
                  onClick={() => { removeFromContentQueue(item.id); refresh(); }}
                  className="p-1 rounded-md text-red-500 hover:bg-red-500/10"
                  aria-label="Remove from queue"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-400">
        draft → approved → exported
        <ChevronRight className="w-3 h-3 inline mx-0.5" />
        localStorage
      </div>
    </div>
  );
}

/** Hook for other components to refresh queue after mutations */
export function useContentQueueRefresh(): () => void {
  return useCallback(() => {
    window.dispatchEvent(new Event('aaism-queue-updated'));
  }, []);
}
