import { useState } from 'react';
import { Loader2, Users, Copy, Check } from 'lucide-react';
import type { PeopleMapResult } from '../data/careerIntel';
import ConfidenceBadge from './ConfidenceBadge';
import { ProvenancedBlock } from './ProvenanceFooter';
import ProvenanceFooter from './ProvenanceFooter';

interface PeopleMapPanelProps {
  onBuild: (input: { companyName: string; roleTitle: string; profileUrls?: string }) => Promise<void>;
  result: PeopleMapResult | null;
  loading: boolean;
  error: string | null;
}

function sectionMeta(result: PeopleMapResult, key: string) {
  return result.provenance?.sections[key] ?? result.provenance?.overall;
}

export default function PeopleMapPanel({ onBuild, result, loading, error }: PeopleMapPanelProps) {
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [profileUrls, setProfileUrls] = useState('');
  const [copied, setCopied] = useState(false);

  const copyDraft = async () => {
    if (!result?.outreachDraft) return;
    await navigator.clipboard.writeText(result.outreachDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-theme bg-theme-elevated p-4 space-y-3">
        <p className="text-sm font-semibold text-cockpit">People & hierarchy map</p>
        <p className="text-xs text-theme-muted">
          Provide company and role — we suggest org hypotheses and outreach. Paste public profile URLs you found manually.
        </p>
        <input
          type="text"
          placeholder="Company name"
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm text-cockpit"
        />
        <input
          type="text"
          placeholder="Role title you're targeting"
          value={roleTitle}
          onChange={e => setRoleTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm text-cockpit"
        />
        <textarea
          placeholder="Optional: public profile URLs you found (GitHub, conference pages, blog — NOT LinkedIn scraping)"
          value={profileUrls}
          onChange={e => setProfileUrls(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm text-cockpit resize-y"
        />
        <button
          onClick={() => onBuild({ companyName, roleTitle, profileUrls: profileUrls || undefined })}
          disabled={loading || !companyName.trim() || !roleTitle.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          Build people map
        </button>
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="rounded-xl border border-theme bg-theme-elevated p-4 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-cockpit">
              {result.roleTitle} @ {result.companyName}
            </p>
            {result.provenance?.overall && (
              <ConfidenceBadge confidence={result.provenance.overall.confidence} />
            )}
          </div>

          {sectionMeta(result, 'orgHypothesis') && (
            <ProvenancedBlock provenance={sectionMeta(result, 'orgHypothesis')!}>
              <div>
                <p className="text-[10px] font-semibold text-theme-muted uppercase mb-1">Org hypothesis</p>
                <ul className="text-xs text-cockpit space-y-1 list-disc list-inside">
                  {result.orgHypothesis.map(line => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </ProvenancedBlock>
          )}

          {sectionMeta(result, 'contactsToReach') && (
            <ProvenancedBlock provenance={sectionMeta(result, 'contactsToReach')!}>
              <div>
                <p className="text-[10px] font-semibold text-theme-muted uppercase mb-2">Who to talk to</p>
                <div className="space-y-2">
                  {result.contactsToReach.map(c => (
                    <div key={c.role} className="flex items-start gap-2 p-2 rounded-lg bg-cockpit-track">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        c.priority === 'high' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                        c.priority === 'medium' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                        'bg-cockpit-track text-theme-muted'
                      }`}>
                        {c.priority}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-cockpit">{c.role}</p>
                        <p className="text-[11px] text-theme-muted">{c.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ProvenancedBlock>
          )}

          {sectionMeta(result, 'outreachDraft') && (
            <ProvenancedBlock provenance={sectionMeta(result, 'outreachDraft')!}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-semibold text-theme-muted uppercase">Outreach draft</p>
                  <button onClick={copyDraft} className="text-[10px] flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-cockpit leading-relaxed p-3 rounded-lg bg-cockpit-track">{result.outreachDraft}</p>
              </div>
            </ProvenancedBlock>
          )}

          {sectionMeta(result, 'publicFootprintTips') && (
            <ProvenancedBlock provenance={sectionMeta(result, 'publicFootprintTips')!}>
              <div>
                <p className="text-[10px] font-semibold text-theme-muted uppercase mb-1">Public footprint tips</p>
                <ul className="text-xs text-theme-secondary space-y-1 list-disc list-inside">
                  {result.publicFootprintTips.map(tip => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            </ProvenancedBlock>
          )}

          {result.provenance?.overall && (
            <ProvenanceFooter provenance={result.provenance.overall} />
          )}
        </div>
      )}
    </div>
  );
}
