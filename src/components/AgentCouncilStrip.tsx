import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, ChevronRight } from 'lucide-react';
import {
  MISSION_HANDOFF_ORDER,
  getLearnWorkEarnAgent,
  type LearnWorkEarnPillar,
} from '../data/learnWorkEarnAgents';
import type { AgentHandoff } from '../services/missionOrchestrator';

interface AgentCouncilStripProps {
  handoffs?: AgentHandoff[];
  activePillar?: LearnWorkEarnPillar | null;
  variant?: 'orchestration' | 'active' | 'compact';
  className?: string;
}

function handoffForPillar(handoffs: AgentHandoff[] | undefined, pillar: LearnWorkEarnPillar) {
  return handoffs?.find(h => h.pillar === pillar);
}

export default function AgentCouncilStrip({
  handoffs,
  activePillar,
  variant = 'active',
  className = '',
}: AgentCouncilStripProps) {
  const orderedAgents = MISSION_HANDOFF_ORDER.map(id => getLearnWorkEarnAgent(id));

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {orderedAgents.map((agent, i) => {
          const handoff = handoffForPillar(handoffs, agent.id);
          const isActive = activePillar === agent.id || handoff?.status === 'running';
          const isDone = handoff?.status === 'done';
          return (
            <div key={agent.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-theme-faint shrink-0" aria-hidden />}
              <span
                title={`${agent.pillarLabel}: ${agent.produces}`}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  isDone
                    ? `${agent.borderAccent} ${agent.bgAccent} ${agent.accent}`
                    : isActive
                      ? 'border-cyan-500/50 bg-cyan-50/60 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 animate-pulse'
                      : 'border-theme bg-cockpit-track text-theme-muted'
                }`}
              >
                {isDone && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                {isActive && !isDone && <Loader2 className="w-3 h-3 shrink-0 animate-spin" />}
                {agent.pillarLabel}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-theme bg-theme-elevated p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[10px] font-semibold text-theme-muted tracking-widest uppercase">
          Agent council · Learn · Work · Earn · Invest · Connect
        </p>
        {activePillar && variant === 'active' && (
          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
            Active: {getLearnWorkEarnAgent(activePillar).name}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {orderedAgents.map(agent => {
          const handoff = handoffForPillar(handoffs, agent.id);
          const isActive = activePillar === agent.id || handoff?.status === 'running';
          const isDone = handoff?.status === 'done';
          const isPending = handoff?.status === 'pending';

          return (
            <div
              key={agent.id}
              className={`rounded-lg border p-2.5 transition-all ${
                isDone
                  ? `${agent.borderAccent} ${agent.bgAccent}`
                  : isActive
                    ? 'border-cyan-500/50 bg-cyan-50/40 dark:bg-cyan-500/10 ring-1 ring-cyan-500/25'
                    : isPending && variant === 'orchestration'
                      ? 'border-theme bg-cockpit-track opacity-70'
                      : 'border-theme bg-theme-elevated'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wide ${agent.accent}`}>
                  {agent.pillarLabel}
                </span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                {isActive && !isDone && <Loader2 className="w-3.5 h-3.5 text-cyan-500 animate-spin shrink-0" />}
              </div>
              <p className="text-xs font-semibold text-cockpit truncate">{agent.name}</p>
              <p className="text-[10px] text-theme-muted mt-0.5 line-clamp-2">{agent.produces}</p>
              {isDone && handoff?.message && (
                <p className="text-[10px] text-theme-secondary mt-1.5 line-clamp-2 border-t border-theme pt-1.5">
                  {handoff.message.slice(0, 100)}{handoff.message.length > 100 ? '…' : ''}
                </p>
              )}
              {variant === 'active' && isActive && agent.routes[0] && (
                <Link
                  to={agent.routes[0].to}
                  className={`inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-medium hover:underline ${agent.accent}`}
                >
                  {agent.routes[0].label}
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {handoffs && handoffs.some(h => h.status === 'done' && h.message) && variant === 'orchestration' && (
        <div className="mt-3 space-y-1 border-t border-theme pt-3">
          {handoffs
            .filter(h => h.status === 'done')
            .map(h => {
              const agent = getLearnWorkEarnAgent(h.pillar);
              return (
                <p key={`${h.pillar}-${h.phase}`} className="text-[11px] text-theme-muted">
                  <span className={`font-medium ${agent.accent}`}>{agent.name}:</span>{' '}
                  {h.message.slice(0, 140)}{h.message.length > 140 ? '…' : ''}
                </p>
              );
            })}
        </div>
      )}
    </div>
  );
}
