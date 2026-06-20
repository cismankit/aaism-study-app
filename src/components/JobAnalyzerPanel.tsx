import { useState } from 'react';
import { Loader2, FileSearch } from 'lucide-react';
import type { JobAnalysis } from '../data/careerIntel';

interface JobAnalyzerPanelProps {
  onAnalyze: (input: { title?: string; jobText?: string; jobUrl?: string }) => Promise<void>;
  result: JobAnalysis | null;
  loading: boolean;
  error: string | null;
}

export default function JobAnalyzerPanel({ onAnalyze, result, loading, error }: JobAnalyzerPanelProps) {
  const [title, setTitle] = useState('');
  const [jobText, setJobText] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-theme bg-theme-elevated p-4 space-y-3">
        <p className="text-sm font-semibold text-cockpit">Paste job posting</p>
        <input
          type="text"
          placeholder="Job title (optional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm text-cockpit"
        />
        <textarea
          placeholder="Paste full job description here (recommended)…"
          value={jobText}
          onChange={e => setJobText(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm text-cockpit resize-y"
        />
        <input
          type="url"
          placeholder="Or job posting URL (we'll try to fetch — paste text if it fails)"
          value={jobUrl}
          onChange={e => setJobUrl(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm text-cockpit"
        />
        <button
          onClick={() => onAnalyze({ title, jobText, jobUrl })}
          disabled={loading || (!jobText.trim() && !jobUrl.trim())}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
          Reverse engineer posting
        </button>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5 p-4 space-y-4">
          <h3 className="font-semibold text-cockpit">{result.title}</h3>
          <p className="text-xs text-theme-muted">Seniority: {result.seniorityLevel}</p>

          <SkillSection title="Required skills" items={result.requiredSkills} accent />
          <SkillSection title="Nice-to-have" items={result.niceToHaveSkills} />

          {result.techStack.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-theme-muted uppercase mb-1">Tech stack tags</p>
              <div className="flex flex-wrap gap-1">
                {result.techStack.map(t => (
                  <span key={`${t.category}-${t.label}`} className="text-[10px] px-2 py-0.5 rounded-full bg-cockpit-track">
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <SkillSection title="Team / department hints" items={result.teamHints} />
          <SkillSection title="Interview prep (cert-aligned)" items={result.interviewPrep} />
          <SkillSection title="Cert tie-ins" items={result.certTieIns} />

          <div>
            <p className="text-[10px] font-semibold text-theme-muted uppercase mb-1">Questions to ask a real human</p>
            <ul className="text-xs text-cockpit space-y-1 list-disc list-inside">
              {result.questionsForHumans.map(q => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillSection({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-theme-muted uppercase mb-1">{title}</p>
      <ul className={`text-xs space-y-0.5 ${accent ? 'text-cockpit font-medium' : 'text-theme-secondary'} list-disc list-inside`}>
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
