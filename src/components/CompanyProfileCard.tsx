import { Building2, ExternalLink } from 'lucide-react';
import type { CompanyProfile } from '../data/careerIntel';
import ConfidenceBadge from './ConfidenceBadge';
import { ProvenancedBlock } from './ProvenanceFooter';
import ProvenanceFooter from './ProvenanceFooter';

interface CompanyProfileCardProps {
  profile: CompanyProfile;
  onDelete?: (id: string) => void;
}

function sectionMeta(profile: CompanyProfile, key: string) {
  return profile.provenance?.sections[key] ?? profile.provenance?.overall;
}

export default function CompanyProfileCard({ profile, onDelete }: CompanyProfileCardProps) {
  return (
    <div className="rounded-xl border border-theme bg-theme-elevated p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h3 className="font-semibold text-cockpit">{profile.companyName}</h3>
            <p className="text-[10px] text-theme-muted">
              Updated {new Date(profile.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {profile.provenance?.overall && (
            <ConfidenceBadge confidence={profile.provenance.overall.confidence} compact />
          )}
          {profile.careersUrl && (
            <a
              href={profile.careersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
            >
              Careers <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {sectionMeta(profile, 'openRolesSummary') ? (
        <ProvenancedBlock provenance={sectionMeta(profile, 'openRolesSummary')!}>
          <p className="text-xs text-theme-secondary">{profile.openRolesSummary}</p>
        </ProvenancedBlock>
      ) : (
        <p className="text-xs text-theme-secondary">{profile.openRolesSummary}</p>
      )}

      {profile.techStack.length > 0 && (
        sectionMeta(profile, 'techStack') ? (
          <ProvenancedBlock provenance={sectionMeta(profile, 'techStack')!}>
            <div>
              <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Tech stack</p>
              <div className="flex flex-wrap gap-1">
                {profile.techStack.slice(0, 12).map(t => (
                  <span key={`${t.category}-${t.label}`} className="text-[10px] px-2 py-0.5 rounded-full bg-cockpit-track text-theme-secondary">
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          </ProvenancedBlock>
        ) : (
          <div>
            <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Tech stack</p>
            <div className="flex flex-wrap gap-1">
              {profile.techStack.slice(0, 12).map(t => (
                <span key={`${t.category}-${t.label}`} className="text-[10px] px-2 py-0.5 rounded-full bg-cockpit-track text-theme-secondary">
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        )
      )}

      {profile.hiringThemes.length > 0 && (
        sectionMeta(profile, 'hiringThemes') ? (
          <ProvenancedBlock provenance={sectionMeta(profile, 'hiringThemes')!}>
            <div>
              <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Hiring themes</p>
              <ul className="text-xs text-theme-secondary list-disc list-inside">
                {profile.hiringThemes.slice(0, 4).map(h => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </ProvenancedBlock>
        ) : (
          <div>
            <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Hiring themes</p>
            <ul className="text-xs text-theme-secondary list-disc list-inside">
              {profile.hiringThemes.slice(0, 4).map(h => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )
      )}

      {profile.certAlignment.length > 0 && (
        sectionMeta(profile, 'certAlignment') ? (
          <ProvenancedBlock provenance={sectionMeta(profile, 'certAlignment')!}>
            <div>
              <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Cert alignment</p>
              <div className="space-y-1">
                {profile.certAlignment.slice(0, 3).map(c => (
                  <div key={c.cert} className="flex items-center justify-between text-xs">
                    <span className="text-cockpit font-medium">{c.cert}</span>
                    <span className="text-theme-muted">{c.matchScore}% · {c.relevance}</span>
                  </div>
                ))}
              </div>
            </div>
          </ProvenancedBlock>
        ) : (
          <div>
            <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Cert alignment</p>
            <div className="space-y-1">
              {profile.certAlignment.slice(0, 3).map(c => (
                <div key={c.cert} className="flex items-center justify-between text-xs">
                  <span className="text-cockpit font-medium">{c.cert}</span>
                  <span className="text-theme-muted">{c.matchScore}% · {c.relevance}</span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {profile.cultureSignals.length > 0 && (
        sectionMeta(profile, 'cultureSignals') ? (
          <ProvenancedBlock provenance={sectionMeta(profile, 'cultureSignals')!}>
            <div>
              <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Culture signals</p>
              <p className="text-xs text-theme-muted">{profile.cultureSignals.join(' · ')}</p>
            </div>
          </ProvenancedBlock>
        ) : (
          <div>
            <p className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider mb-1">Culture signals</p>
            <p className="text-xs text-theme-muted">{profile.cultureSignals.join(' · ')}</p>
          </div>
        )
      )}

      {profile.provenance?.overall && (
        <ProvenanceFooter provenance={profile.provenance.overall} compact />
      )}

      {onDelete && (
        <button
          onClick={() => onDelete(profile.id)}
          className="text-[10px] text-red-600 dark:text-red-400 hover:underline"
        >
          Remove profile
        </button>
      )}
    </div>
  );
}
