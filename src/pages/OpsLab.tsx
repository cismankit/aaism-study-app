import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Terminal, CheckCircle, Target, GitBranch, FileText,
  ChevronRight, Theater, Filter,
} from 'lucide-react';
import { useCert } from '../context/CertContext';
import PageHeader from '../components/PageHeader';
import LabRunner from '../components/LabRunner';
import {
  getLabsForCert,
  getLabById,
  getLabCompletionPct,
  isLabCompleted,
  getLabStatsForCert,
} from '../services/labService';
import type { LabDefinition, LabType } from '../data/labs/types';

const TYPE_META: Record<LabType, { icon: typeof Terminal; label: string; color: string }> = {
  command: { icon: Terminal, label: 'Command', color: 'text-cyan-600 dark:text-cyan-400' },
  analysis: { icon: FileText, label: 'Analysis', color: 'text-violet-600 dark:text-violet-400' },
  decision: { icon: GitBranch, label: 'Decision', color: 'text-indigo-600 dark:text-indigo-400' },
};

export default function OpsLab() {
  const { activeCert } = useCert();
  const [searchParams, setSearchParams] = useSearchParams();
  const [domainFilter, setDomainFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<LabType | 'all'>('all');

  const labIdParam = searchParams.get('lab');
  const domainParam = searchParams.get('domain');
  const activeLab = labIdParam ? getLabById(labIdParam) : null;

  const labs = useMemo(() => {
    let list = getLabsForCert(activeCert.id);
    const domainFromUrl = domainParam ? Number(domainParam) : null;
    const effectiveDomain = domainFromUrl ?? (domainFilter !== 'all' ? domainFilter : null);
    if (effectiveDomain) list = list.filter(l => l.domainId === effectiveDomain);
    if (typeFilter !== 'all') list = list.filter(l => l.type === typeFilter);
    return list;
  }, [activeCert.id, domainFilter, typeFilter, domainParam]);

  const stats = getLabStatsForCert(activeCert.id);

  const startLab = (lab: LabDefinition) => {
    setSearchParams({ lab: lab.id });
  };

  const backToList = () => {
    setSearchParams({});
  };

  if (activeLab && activeLab.certId === activeCert.id) {
    return (
      <LabRunner
        lab={activeLab}
        onBack={backToList}
        onComplete={backToList}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Ops Lab"
        subtitle="Hands-on command, analysis, and decision drills — cert-aware practice beyond MCQs"
        icon={Terminal}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-theme-muted">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {stats.completed}/{stats.total} labs completed for {activeCert.shortName}
        </div>
        <Link
          to="/scenarios"
          className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
        >
          <Theater className="w-3.5 h-3.5" />
          AI Scenario Lab →
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs text-theme-muted">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>
        <select
          value={domainFilter === 'all' ? '' : domainFilter}
          onChange={e => setDomainFilter(e.target.value ? Number(e.target.value) : 'all')}
          className="text-xs px-2 py-1.5 border border-theme rounded-lg bg-theme-elevated"
        >
          <option value="">All domains</option>
          {activeCert.domains.map(d => (
            <option key={d.id} value={d.id}>D{d.id}: {d.shortName}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as LabType | 'all')}
          className="text-xs px-2 py-1.5 border border-theme rounded-lg bg-theme-elevated"
        >
          <option value="all">All types</option>
          <option value="command">Command drills</option>
          <option value="analysis">Analysis drills</option>
          <option value="decision">Decision drills</option>
        </select>
      </div>

      {labs.length === 0 ? (
        <div className="text-center py-16 text-theme-muted">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No labs for this filter yet. Try another domain or cert.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map(lab => {
            const meta = TYPE_META[lab.type];
            const Icon = meta.icon;
            const done = isLabCompleted(lab.id);
            const pct = getLabCompletionPct(lab);
            const domain = activeCert.domains.find(d => d.id === lab.domainId);

            return (
              <button
                key={lab.id}
                onClick={() => startLab(lab)}
                className="text-left p-4 rounded-xl border border-theme bg-theme-elevated hover:border-emerald-400 dark:hover:border-emerald-600 transition-all group osint-widget"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                  <div className="flex items-center gap-1.5">
                    {done && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      lab.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      lab.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>{lab.difficulty}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-cockpit group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{lab.title}</h3>
                <p className="text-xs text-theme-muted mt-1 line-clamp-2">{lab.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-theme-faint">
                    D{lab.domainId}{domain ? `: ${domain.shortName}` : ''} · {meta.label} · ~{lab.estimatedMinutes}m
                  </span>
                  <ChevronRight className="w-4 h-4 text-theme-faint group-hover:text-emerald-500" />
                </div>
                {pct > 0 && pct < 100 && (
                  <div className="mt-2 h-1 bg-cockpit-track rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-theme">
        {(['command', 'analysis', 'decision'] as LabType[]).map(type => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          const count = getLabsForCert(activeCert.id).filter(l => l.type === type).length;
          return (
            <div key={type} className="p-4 rounded-xl bg-theme-muted border border-theme">
              <Icon className={`w-6 h-6 mb-2 ${meta.color}`} />
              <h4 className="font-semibold text-sm text-cockpit">{meta.label} Drills</h4>
              <p className="text-xs text-theme-muted mt-1">
                {type === 'command' && 'Copy-paste terminal commands with output validation'}
                {type === 'analysis' && 'Analyze logs, JSON, and sample data with structured questions'}
                {type === 'decision' && 'Incident response choose-your-path scenarios'}
              </p>
              <p className="text-[10px] text-theme-faint mt-2">{count} available</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
