import { useState, useCallback } from 'react';
import {
  ArrowLeft, CheckCircle, Circle, Copy, Terminal, FileText,
  GitBranch, ChevronRight, Trophy, AlertTriangle, Shield,
} from 'lucide-react';
import type { LabDefinition } from '../data/labs/types';
import {
  markStepComplete,
  getCompletedStepIds,
  completeLab,
} from '../services/labService';
import { useGamification } from '../context/GamificationContext';
import { chat, loadAIConfig } from '../services/aiService';

interface LabRunnerProps {
  lab: LabDefinition;
  onBack: () => void;
  onComplete?: () => void;
}

type Phase = 'steps' | 'complete';

export default function LabRunner({ lab, onBack, onComplete }: LabRunnerProps) {
  const { addXP } = useGamification();
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => getCompletedStepIds(lab.id));
  const [phase, setPhase] = useState<Phase>('steps');
  const [analysisAnswers, setAnalysisAnswers] = useState<Record<string, string>>({});
  const [decisionIndex, setDecisionIndex] = useState(0);
  const [decisionResults, setDecisionResults] = useState<Array<{ correct: boolean }>>([]);
  const [showDecisionExplanation, setShowDecisionExplanation] = useState(false);
  const [outputChecks, setOutputChecks] = useState<Record<string, string>>({});
  const [aiChecking, setAiChecking] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const toggleStep = useCallback((stepId: string) => {
    markStepComplete(lab.id, stepId);
    setCompletedSteps(prev => prev.includes(stepId) ? prev : [...prev, stepId]);
  }, [lab.id]);

  const copyCommand = (cmd: string) => {
    void navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const checkOutputWithAI = async (stepId: string, output: string, hint?: string) => {
    if (!output.trim()) return;
    setAiChecking(stepId);
    try {
      const config = loadAIConfig();
      const res = await chat(config, [
        {
          role: 'system',
          content: 'You are a cybersecurity lab validator. Respond with JSON: {"valid": boolean, "feedback": string}. Be lenient for learning exercises.',
        },
        {
          role: 'user',
          content: `Lab step validation.\nExpected hint: ${hint ?? 'general correctness'}\nUser output:\n${output}\n\nIs this a reasonable attempt?`,
        },
      ], { jsonMode: true, temperature: 0.2 });
      if (res.content) {
        try {
          const parsed = JSON.parse(res.content) as { valid?: boolean; feedback?: string };
          if (parsed.valid) toggleStep(stepId);
        } catch { /* user can still mark manually */ }
      }
    } finally {
      setAiChecking(null);
    }
  };

  const finishLab = (score: number) => {
    completeLab(lab.id, score, completedSteps);
    const xp = Math.round(30 + score * 0.4);
    addXP(xp, `Ops Lab: ${lab.title}`);
    setPhase('complete');
    onComplete?.();
  };

  const handleCommandLabFinish = () => {
    const total = lab.steps?.length ?? 1;
    const done = completedSteps.length;
    const score = Math.round((done / total) * 100);
    finishLab(score);
  };

  const handleAnalysisFinish = () => {
    const questions = lab.analysisQuestions ?? [];
    let correct = 0;
    questions.forEach(q => {
      const ans = (analysisAnswers[q.id] ?? '').toLowerCase();
      const keywords = q.expectedKeywords ?? [];
      if (keywords.some(kw => ans.includes(kw.toLowerCase()))) correct++;
    });
    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 80;
    questions.forEach(q => markStepComplete(lab.id, q.id));
    finishLab(score);
  };

  const handleDecisionAnswer = (selectedIndex: number) => {
    const node = lab.decisions![decisionIndex];
    const correct = selectedIndex === node.correctIndex;
    setDecisionResults(prev => [...prev, { correct }]);
    setShowDecisionExplanation(true);
  };

  const handleDecisionNext = () => {
    const total = lab.decisions!.length;
    const isLast = decisionIndex + 1 >= total;

    if (isLast) {
      lab.decisions!.forEach(d => markStepComplete(lab.id, d.id));
      const correctCount = decisionResults.filter(r => r.correct).length;
      const score = Math.round((correctCount / total) * 100);
      finishLab(score);
      return;
    }

    setShowDecisionExplanation(false);
    setDecisionIndex(i => i + 1);
  };

  if (phase === 'complete') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-theme-muted hover:text-theme-secondary text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Ops Lab
        </button>
        <div className="bg-theme-elevated rounded-xl border border-theme p-6 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
          <h2 className="text-2xl font-bold mb-2">Lab Complete!</h2>
          <p className="text-theme-muted mb-4">{lab.title}</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-400">+XP awarded · Domain {lab.domainId} progress updated</p>
          {lab.mitreTechniques && lab.mitreTechniques.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {lab.mitreTechniques.map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">{t}</span>
              ))}
            </div>
          )}
          <button onClick={onBack} className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            Back to Ops Lab
          </button>
        </div>
      </div>
    );
  }

  const typeIcon = lab.type === 'command' ? Terminal : lab.type === 'analysis' ? FileText : GitBranch;
  const TypeIcon = typeIcon;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-theme-muted hover:text-theme-secondary text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Ops Lab
      </button>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
        <Shield className="w-4 h-4 shrink-0" />
        Authorized testing / lab environments only. No automated exploitation against live systems.
      </div>

      <div className="bg-theme-elevated rounded-xl border border-theme p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <TypeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-cockpit">{lab.title}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cockpit-track text-theme-muted">D{lab.domainId}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded ${
                lab.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                lab.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              }`}>{lab.difficulty}</span>
            </div>
            <p className="text-sm text-theme-muted mt-1">{lab.description}</p>
            <p className="text-xs text-theme-faint mt-1">~{lab.estimatedMinutes} min · {lab.type} drill</p>
          </div>
        </div>
      </div>

      {lab.sampleData && (
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto max-h-48 overflow-y-auto">
          <div className="text-emerald-400 mb-2 text-[10px] uppercase tracking-wide">Sample Data</div>
          <pre className="whitespace-pre-wrap">{lab.sampleData}</pre>
        </div>
      )}

      {/* Command drill steps */}
      {lab.type === 'command' && lab.steps && (
        <div className="space-y-3">
          {lab.steps.map((step, i) => {
            const done = completedSteps.includes(step.id);
            return (
              <div key={step.id} className={`p-4 rounded-xl border ${done ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-theme bg-theme-elevated'}`}>
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleStep(step.id)} className="mt-0.5 shrink-0">
                    {done ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-theme-faint" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-theme-faint mb-1">Step {i + 1}</div>
                    <h4 className="font-semibold text-sm text-cockpit">{step.title}</h4>
                    <p className="text-sm text-theme-muted mt-1">{step.instruction}</p>
                    {step.command && (
                      <div className="mt-3 flex items-start gap-2">
                        <code className="flex-1 block p-2 rounded bg-gray-900 text-emerald-400 text-xs font-mono overflow-x-auto">{step.command}</code>
                        <button
                          onClick={() => copyCommand(step.command!)}
                          className="p-2 rounded-lg bg-cockpit-track hover:bg-cockpit-track/80 text-theme-muted"
                          title="Copy command"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {copiedCmd === step.command && <p className="text-xs text-emerald-500 mt-1">Copied!</p>}
                    {step.expectedOutcome && (
                      <p className="text-xs text-cockpit-muted mt-2"><strong>Expected:</strong> {step.expectedOutcome}</p>
                    )}
                    <div className="mt-3">
                      <textarea
                        placeholder="Paste your output here for AI check (optional)..."
                        value={outputChecks[step.id] ?? ''}
                        onChange={e => setOutputChecks(prev => ({ ...prev, [step.id]: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-theme rounded-lg bg-theme-muted dark:bg-gray-800 font-mono"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => void checkOutputWithAI(step.id, outputChecks[step.id] ?? '', step.validationHint)}
                          disabled={aiChecking === step.id || !outputChecks[step.id]?.trim()}
                          className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 disabled:opacity-50"
                        >
                          {aiChecking === step.id ? 'Checking…' : 'AI validate output'}
                        </button>
                        <button
                          onClick={() => toggleStep(step.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        >
                          Mark done
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={handleCommandLabFinish}
            disabled={completedSteps.length === 0}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <Trophy className="w-4 h-4" /> Complete Lab ({completedSteps.length}/{lab.steps.length} steps)
          </button>
        </div>
      )}

      {/* Analysis drill */}
      {lab.type === 'analysis' && lab.analysisQuestions && (
        <div className="space-y-4">
          {lab.analysisQuestions.map((q, i) => (
            <div key={q.id} className="p-4 rounded-xl border border-theme bg-theme-elevated">
              <div className="text-xs text-theme-faint mb-1">Question {i + 1}</div>
              <p className="text-sm font-medium text-cockpit mb-2">{q.question}</p>
              <textarea
                value={analysisAnswers[q.id] ?? ''}
                onChange={e => setAnalysisAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-theme rounded-lg bg-theme-muted dark:bg-gray-800"
                rows={2}
                placeholder="Your analysis..."
              />
            </div>
          ))}
          <button
            onClick={handleAnalysisFinish}
            disabled={Object.keys(analysisAnswers).length < lab.analysisQuestions.length}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            <Trophy className="w-4 h-4" /> Submit Analysis
          </button>
        </div>
      )}

      {/* Decision drill */}
      {lab.type === 'decision' && lab.decisions && (
        <div className="space-y-4">
          {decisionIndex < lab.decisions.length && !showDecisionExplanation && (
            <>
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">
                  Decision {decisionIndex + 1} of {lab.decisions.length}
                </div>
                <p className="text-sm text-cockpit-muted mb-3">{lab.decisions[decisionIndex].situation}</p>
                <h4 className="font-semibold text-cockpit">{lab.decisions[decisionIndex].question}</h4>
              </div>
              <div className="space-y-2">
                {lab.decisions[decisionIndex].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleDecisionAnswer(i)}
                    className="w-full text-left p-3 rounded-lg border border-theme hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm transition-all"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
          {showDecisionExplanation && lab.decisions[decisionIndex] && (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border ${
                decisionResults[decisionIndex]?.correct
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {decisionResults[decisionIndex]?.correct ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold text-sm">
                    {decisionResults[decisionIndex]?.correct ? 'Correct path' : 'Suboptimal choice'}
                  </span>
                </div>
                <p className="text-sm text-theme-muted">{lab.decisions[decisionIndex].explanation}</p>
              </div>
              <button
                onClick={handleDecisionNext}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 font-medium"
              >
                {decisionIndex + 1 >= lab.decisions.length ? (
                  <><Trophy className="w-4 h-4" /> Finish Lab</>
                ) : (
                  <><ChevronRight className="w-4 h-4" /> Next Decision</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
