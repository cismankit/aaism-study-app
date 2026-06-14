import { Link } from 'react-router-dom';
import { Shield, Database, Cloud, Radio, ExternalLink } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AI_CONFIG_STORAGE_KEY } from '../services/aiService';
import { LEAD_VOTES_STORAGE_KEY } from '../services/leadVotesService';

const STORAGE_KEYS = [
  { key: 'aaism-app-state', desc: 'Quiz scores, streaks, XP, exam date' },
  { key: AI_CONFIG_STORAGE_KEY, desc: 'AI provider, model, API keys (browser only)' },
  { key: 'aaism_agent_pipeline', desc: 'Agent Discovery leads and run history' },
  { key: LEAD_VOTES_STORAGE_KEY, desc: 'Community upvote/downvote scores on leads' },
  { key: 'aaism_rss_cache', desc: 'Cached RSS intel feed (30 min TTL)' },
  { key: 'aaism-weekly-digest-cache', desc: 'Last generated weekly intel digest' },
  { key: 'aaism-ensemble-config', desc: 'Multi-model ensemble toggle and Groq key' },
];

export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        icon={Shield}
        iconClassName="text-emerald-500"
        title="Data & Privacy Policy"
        subtitle="What AAISM stores locally, what leaves your browser, and how RSS intel is fetched."
      />

      <section className="bg-theme-elevated rounded-xl border border-theme p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          Browser localStorage
        </h2>
        <p className="text-sm text-cockpit-muted">
          AAISM is a client-side study app. Progress, settings, agent leads, and votes are stored in your browser — not on AAISM servers. Clearing site data resets everything.
        </p>
        <ul className="text-xs space-y-1.5 font-mono text-theme-muted">
          {STORAGE_KEYS.map(({ key, desc }) => (
            <li key={key} className="flex gap-2">
              <span className="text-violet-600 dark:text-violet-400 shrink-0">{key}</span>
              <span className="text-theme-faint">— {desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-theme-elevated rounded-xl border border-theme p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Cloud className="w-4 h-4 text-orange-500" />
          Groq &amp; other LLM providers
        </h2>
        <p className="text-sm text-cockpit-muted">
          When you enable AI features, prompts (study questions, agent discovery, RSS → exam Q generation, Content Studio) are sent directly from your browser to the provider you configure — typically{' '}
          <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline inline-flex items-center gap-0.5">
            Groq <ExternalLink className="w-3 h-3" />
          </a>{' '}
          or local Ollama. API keys live in <code className="text-xs bg-cockpit-track px-1 rounded">{AI_CONFIG_STORAGE_KEY}</code> and are never transmitted to AAISM infrastructure.
        </p>
        <p className="text-sm text-cockpit-muted">
          Do not use AAISM on shared computers with API keys saved. Use Ollama for fully offline, private inference.
        </p>
      </section>

      <section className="bg-theme-elevated rounded-xl border border-theme p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-500" />
          RSS &amp; intel proxies
        </h2>
        <p className="text-sm text-cockpit-muted">
          Live Intel Feed fetches curated security RSS sources via public read-only proxies (e.g. rss2json.com) from your browser. Headlines and summaries are cached locally under <code className="text-xs bg-cockpit-track px-1 rounded">aaism_rss_cache</code> for up to 30 minutes. No account or tracking is required.
        </p>
        <p className="text-sm text-cockpit-muted">
          &quot;Generate 3 exam Qs&quot; sends the selected headline + summary to your configured LLM — not to AAISM servers.
        </p>
      </section>

      <div className="text-center text-sm text-theme-muted">
        <Link to="/help" className="text-emerald-600 hover:underline">← Back to Help Center</Link>
      </div>
    </div>
  );
}
