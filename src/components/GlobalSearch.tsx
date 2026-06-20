import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, BookOpen, Globe, Briefcase, Command } from 'lucide-react';
import { topics } from '../data/knowledgeBase';
import { OSINT_SOURCES } from '../data/osintSources';
import { PLAYBOOKS } from '../data/playbooks';
import { isRouteGated } from '../services/productTierService';

interface SearchItem {
  id: string;
  type: 'page' | 'topic' | 'osint' | 'playbook';
  title: string;
  subtitle?: string;
  route: string;
  keywords: string;
}

const PAGE_ITEMS: SearchItem[] = [
  { id: 'p-home', type: 'page', title: 'Command Center', subtitle: 'Learn · Work · Earn overview', route: '/command', keywords: 'command center home dashboard readiness learn work earn' },
  { id: 'p-mission', type: 'page', title: 'Mission', subtitle: 'Learn · daily 25-min loop', route: '/', keywords: 'mission learn daily loop study' },
  { id: 'p-study-mission', type: 'page', title: 'Study Mission', subtitle: 'Unified study loop', route: '/', keywords: 'mission study loop quiz lab intel agents' },
  { id: 'p-career', type: 'page', title: 'Career Intel', subtitle: 'Job seeker OSINT', route: '/career', keywords: 'career job company profile hiring osint' },
  { id: 'p-study', type: 'page', title: 'Study Ops', subtitle: 'Quiz, flashcards, tutor', route: '/study', keywords: 'study quiz flashcards tutor notes' },
  { id: 'p-exam', type: 'page', title: 'Timed Exam', subtitle: '90Q / 150min simulation', route: '/exam', keywords: 'exam timed simulation test' },
  { id: 'p-intel', type: 'page', title: 'Intel Hub', subtitle: 'Threat intel & patterns', route: '/intel', keywords: 'intel threat patterns community' },
  { id: 'p-osint', type: 'page', title: 'OSINT Arsenal', subtitle: 'Curated sources', route: '/osint', keywords: 'osint sources mitre owasp nist' },
  { id: 'p-agent', type: 'page', title: 'Agent Discovery', subtitle: 'AI question discovery', route: '/agent', keywords: 'agent discovery ai questions' },
  { id: 'p-studio', type: 'page', title: 'Content Studio', subtitle: 'Generate study content', route: '/studio', keywords: 'content studio generate posts' },
  { id: 'p-knowledge', type: 'page', title: 'Knowledge Base', subtitle: 'Domains, topics, glossary', route: '/knowledge', keywords: 'knowledge base domains glossary' },
  { id: 'p-playbooks', type: 'page', title: 'Playbooks', subtitle: 'Implementation guides', route: '/playbooks', keywords: 'playbooks implementation guides' },
  { id: 'p-ops', type: 'page', title: 'Ops Lab', subtitle: 'Hands-on drills', route: '/ops', keywords: 'ops lab hands-on command analysis' },
  { id: 'p-scenarios', type: 'page', title: 'Scenario Lab', subtitle: 'AI pattern drills', route: '/scenarios', keywords: 'scenario lab drills patterns' },
  { id: 'p-cram', type: 'page', title: '24h Cram Mode', subtitle: 'High-yield review', route: '/cram', keywords: 'cram mode rapid review' },
  { id: 'p-packs', type: 'page', title: 'Team Packs', subtitle: 'Agent mission workflows', route: '/packs', keywords: 'team packs agent missions content studio playbooks osint cram support' },
  { id: 'p-cheatsheet', type: 'page', title: 'Quick Ref', subtitle: 'Cert-aware cheat sheet', route: '/cheatsheet', keywords: 'cheat sheet quick reference cert' },
  { id: 'p-settings', type: 'page', title: 'Settings', subtitle: 'AI config & progress', route: '/settings', keywords: 'settings dashboard progress ai' },
  { id: 'p-help', type: 'page', title: 'Help & Support', subtitle: 'Documentation', route: '/help', keywords: 'help support documentation' },
];

function buildIndex(): SearchItem[] {
  const topicItems: SearchItem[] = topics.map(t => ({
    id: `topic-${t.id}`,
    type: 'topic',
    title: t.title,
    subtitle: `Domain ${t.domain} · Knowledge`,
    route: `/knowledge?domain=${t.domain}`,
    keywords: `${t.title} ${t.description} ${t.relatedTerms.join(' ')} ${t.keyPoints.join(' ')}`.toLowerCase(),
  }));

  const visiblePages = PAGE_ITEMS.filter(p => !isRouteGated(p.route));
  const osintItems: SearchItem[] = isRouteGated('/osint')
    ? []
    : OSINT_SOURCES.slice(0, 200).map(s => ({
    id: `osint-${s.id}`,
    type: 'osint',
    title: s.name,
    subtitle: s.description.slice(0, 60),
    route: '/osint',
    keywords: `${s.name} ${s.description} ${s.tags.join(' ')}`.toLowerCase(),
  }));

  const playbookItems: SearchItem[] = PLAYBOOKS.map(p => ({
    id: `pb-${p.id}`,
    type: 'playbook',
    title: p.title,
    subtitle: `Domain ${p.domain} · ${p.difficulty}`,
    route: '/playbooks',
    keywords: `${p.title} ${p.overview} ${p.category}`.toLowerCase(),
  }));

  return [...visiblePages, ...topicItems, ...osintItems, ...playbookItems];
}

const TYPE_ICONS = {
  page: FileText,
  topic: BookOpen,
  osint: Globe,
  playbook: Briefcase,
};

const TYPE_LABELS = {
  page: 'Page',
  topic: 'Topic',
  osint: 'OSINT',
  playbook: 'Playbook',
};

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const index = useMemo(() => buildIndex(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.filter(i => i.type === 'page').slice(0, 8);
    return index
      .filter(i => i.title.toLowerCase().includes(q) || i.keywords.includes(q) || i.subtitle?.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, index]);

  const goTo = useCallback((item: SearchItem) => {
    navigate(item.route);
    onClose();
    setQuery('');
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelected(0);
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); return; }
      if (e.key === 'Enter' && results[selected]) { e.preventDefault(); goTo(results[selected]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected, goTo, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] px-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-theme overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-theme">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            autoFocus
            type="text"
            placeholder="Search pages, topics, OSINT, playbooks…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-cockpit placeholder-gray-400 focus:outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">No results for &ldquo;{query}&rdquo;</p>
          ) : (
            results.map((item, i) => {
              const Icon = TYPE_ICONS[item.type];
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selected
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-cockpit truncate">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>
                    )}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 flex-shrink-0">
                    {TYPE_LABELS[item.type]}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-theme flex items-center gap-4 text-[10px] text-gray-400">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

/** Register Cmd+K / Ctrl+K listener */
export function useGlobalSearchShortcut(onOpen: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpen]);
}
