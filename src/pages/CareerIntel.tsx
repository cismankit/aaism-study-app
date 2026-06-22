import { useState } from 'react';
import { Briefcase, Shield, Loader2, Building2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import CompanyProfileCard from '../components/CompanyProfileCard';
import JobAnalyzerPanel from '../components/JobAnalyzerPanel';
import PeopleMapPanel from '../components/PeopleMapPanel';
import { CAREER_ETHICS_BANNER } from '../data/careerIntel';
import {
  buildCompanyProfile,
  analyzeJobPosting,
  buildPeopleMap,
  getSavedCompanyProfiles,
  saveCompanyProfile,
  deleteCompanyProfile,
} from '../services/careerIntelService';
import type { CompanyProfile, JobAnalysis, PeopleMapResult } from '../data/careerIntel';
import { useCert } from '../context/CertContext';

type Tab = 'company' | 'job' | 'people' | 'saved';

export default function CareerIntel() {
  const { activeCert } = useCert();
  const [tab, setTab] = useState<Tab>('company');
  const [profiles, setProfiles] = useState<CompanyProfile[]>(() => getSavedCompanyProfiles());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobResult, setJobResult] = useState<JobAnalysis | null>(null);
  const [peopleResult, setPeopleResult] = useState<PeopleMapResult | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [careersUrl, setCareersUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'company', label: 'Company Profile' },
    { id: 'job', label: 'Job Analyzer' },
    { id: 'people', label: 'People Map' },
    { id: 'saved', label: 'Saved Profiles' },
  ];

  const handleBuildProfile = async () => {
    if (!companyName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const profile = await buildCompanyProfile({
        companyName: companyName.trim(),
        careersUrl: careersUrl.trim() || undefined,
        jobPostingText: jobText.trim() || undefined,
        jobPostingUrl: jobUrl.trim() || undefined,
      });
      saveCompanyProfile(profile);
      setProfiles(getSavedCompanyProfiles());
      setTab('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Profile build failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeJob = async (input: { title?: string; jobText?: string; jobUrl?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeJobPosting(input);
      setJobResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePeopleMap = async (input: { companyName: string; roleTitle: string; profileUrls?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await buildPeopleMap(input);
      setPeopleResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'People map failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteCompanyProfile(id);
    setProfiles(getSavedCompanyProfiles());
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <PageHeader
        title="Career Intel"
        subtitle={`Simulated career OSINT — BYOK AI on pasted public data. Aligned with ${activeCert.shortName}; not live scraping.`}
        icon={Briefcase}
      />

      <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Ethics & limits</p>
          <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-1">{CAREER_ETHICS_BANNER}</p>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 mt-2">
            No live job board scraping. No LinkedIn automation. Job URLs may fail to fetch — paste text for best results.
          </p>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-cockpit-track border border-theme overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-theme-elevated text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-cockpit-muted hover:text-cockpit'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <div className="rounded-xl border border-theme bg-theme-elevated p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-semibold text-cockpit">Company Profile Builder</p>
          </div>
          <input
            type="text"
            placeholder="Company name *"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm"
          />
          <input
            type="url"
            placeholder="Careers page URL (optional)"
            value={careersUrl}
            onChange={e => setCareersUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm"
          />
          <textarea
            placeholder="Paste job posting text (optional but improves analysis)"
            value={jobText}
            onChange={e => setJobText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm resize-y"
          />
          <input
            type="url"
            placeholder="Job posting URL (optional — paste text if fetch fails)"
            value={jobUrl}
            onChange={e => setJobUrl(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-theme bg-theme-muted text-sm"
          />
          <button
            onClick={handleBuildProfile}
            disabled={loading || !companyName.trim()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            Build company profile
          </button>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}

      {tab === 'job' && (
        <JobAnalyzerPanel
          onAnalyze={handleAnalyzeJob}
          result={jobResult}
          loading={loading}
          error={error}
        />
      )}

      {tab === 'people' && (
        <PeopleMapPanel
          onBuild={handlePeopleMap}
          result={peopleResult}
          loading={loading}
          error={error}
        />
      )}

      {tab === 'saved' && (
        <div className="space-y-3">
          {profiles.length === 0 ? (
            <p className="text-sm text-theme-muted text-center py-8">No saved profiles yet — build one in Company Profile tab.</p>
          ) : (
            profiles.map(p => (
              <CompanyProfileCard key={p.id} profile={p} onDelete={handleDelete} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
