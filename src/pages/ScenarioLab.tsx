import { useState, useEffect, useCallback } from 'react';
import {
  Theater, Play, ChevronRight, CheckCircle, XCircle,
  RefreshCw, BookOpen, Target, Zap, ArrowLeft,
  Star, AlertTriangle, Lightbulb, BarChart3, Shield,
  Brain, Trophy,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  SCENARIO_TEMPLATES,
  QUESTION_PATTERNS,
  type ScenarioTemplate,
  type QuestionPattern,
} from '../data/communityIntelligence';
import {
  buildScenarioContext,
  generatePatternDrillQuestions,
  type ResearchCallbacks,
} from '../services/intelligenceAgent';
import { loadAIConfig } from '../services/aiService';
import { type ExamQuestion } from '../data/examContent';

type LabMode = 'menu' | 'scenario' | 'drill';

interface DrillState {
  pattern: QuestionPattern;
  questions: ExamQuestion[];
  currentIndex: number;
  answers: Array<{ selected: number; correct: boolean }>;
  showExplanation: boolean;
  loading: boolean;
}

interface ScenarioState {
  scenario: ScenarioTemplate;
  currentAct: number;
  answers: Array<{ selected: number; correct: boolean }>;
  showExplanation: boolean;
  completed: boolean;
}

export default function ScenarioLab() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<LabMode>('menu');
  const [scenarioState, setScenarioState] = useState<ScenarioState | null>(null);
  const [drillState, setDrillState] = useState<DrillState | null>(null);
  const [genLogs, setGenLogs] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [drillDomain, setDrillDomain] = useState<number | undefined>(undefined);

  const callbacks: ResearchCallbacks = {
    onLog: (message, type) => {
      const prefix = type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'thinking' ? '◌' : '→';
      setGenLogs(prev => [...prev, `${prefix} ${message}`]);
    },
    onProgress: (_phase, message) => {
      setGenLogs(prev => [...prev, `▸ ${message}`]);
    },
  };

  const startScenarioFromParams = useCallback(() => {
    const paramMode = searchParams.get('mode');
    const patternId = searchParams.get('pattern');

    if (paramMode === 'drill' && patternId) {
      const pattern = QUESTION_PATTERNS.find(p => p.id === patternId);
      if (pattern) {
        startDrill(pattern);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    startScenarioFromParams();
  }, [startScenarioFromParams]);

  function startScenario(scenario: ScenarioTemplate) {
    setScenarioState({
      scenario,
      currentAct: 0,
      answers: [],
      showExplanation: false,
      completed: false,
    });
    setMode('scenario');
  }

  async function startDrill(pattern: QuestionPattern, domain?: number) {
    setMode('drill');
    setDrillState({
      pattern,
      questions: [],
      currentIndex: 0,
      answers: [],
      showExplanation: false,
      loading: true,
    });
    setGenLogs([]);
    setGenerating(true);

    try {
      const questions = await generatePatternDrillQuestions(callbacks, pattern, 5, domain);
      setDrillState(prev => prev ? { ...prev, questions, loading: false } : null);
    } catch (e) {
      setGenLogs(prev => [...prev, `✗ Error: ${e instanceof Error ? e.message : String(e)}`]);
      setDrillState(prev => prev ? { ...prev, loading: false } : null);
    } finally {
      setGenerating(false);
    }
  }

  async function generateNewScenario(topic: string, domain: number) {
    setGenLogs([]);
    setGenerating(true);
    try {
      const scenario = await buildScenarioContext(callbacks, topic, domain);
      startScenario(scenario);
    } catch (e) {
      setGenLogs(prev => [...prev, `✗ Error: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setGenerating(false);
    }
  }

  function handleScenarioAnswer(selected: number) {
    if (!scenarioState || scenarioState.showExplanation) return;
    const act = scenarioState.scenario.acts[scenarioState.currentAct];
    const correct = selected === act.correctAnswer;
    setScenarioState({
      ...scenarioState,
      answers: [...scenarioState.answers, { selected, correct }],
      showExplanation: true,
    });
  }

  function nextAct() {
    if (!scenarioState) return;
    const nextIndex = scenarioState.currentAct + 1;
    if (nextIndex >= scenarioState.scenario.acts.length) {
      setScenarioState({ ...scenarioState, completed: true });
    } else {
      setScenarioState({
        ...scenarioState,
        currentAct: nextIndex,
        showExplanation: false,
      });
    }
  }

  function handleDrillAnswer(selected: number) {
    if (!drillState || drillState.showExplanation) return;
    const q = drillState.questions[drillState.currentIndex];
    const correct = selected === q.correctAnswer;
    setDrillState({
      ...drillState,
      answers: [...drillState.answers, { selected, correct }],
      showExplanation: true,
    });
  }

  function nextDrillQuestion() {
    if (!drillState) return;
    const nextIndex = drillState.currentIndex + 1;
    if (nextIndex >= drillState.questions.length) {
      setDrillState({ ...drillState, currentIndex: nextIndex });
    } else {
      setDrillState({
        ...drillState,
        currentIndex: nextIndex,
        showExplanation: false,
      });
    }
  }

  function backToMenu() {
    setMode('menu');
    setScenarioState(null);
    setDrillState(null);
    setGenLogs([]);
  }

  if (mode === 'scenario' && scenarioState) {
    return <ScenarioView state={scenarioState} onAnswer={handleScenarioAnswer} onNext={nextAct} onBack={backToMenu} />;
  }

  if (mode === 'drill' && drillState) {
    return (
      <DrillView
        state={drillState}
        onAnswer={handleDrillAnswer}
        onNext={nextDrillQuestion}
        onBack={backToMenu}
        logs={genLogs}
        generating={generating}
      />
    );
  }

  return (
    <MenuView
      onStartScenario={startScenario}
      onStartDrill={startDrill}
      onGenerateScenario={generateNewScenario}
      generating={generating}
      genLogs={genLogs}
      drillDomain={drillDomain}
      setDrillDomain={setDrillDomain}
    />
  );
}

// ============ MENU VIEW ============

function MenuView({
  onStartScenario,
  onStartDrill,
  onGenerateScenario,
  generating,
  genLogs,
  drillDomain,
  setDrillDomain,
}: {
  onStartScenario: (s: ScenarioTemplate) => void;
  onStartDrill: (p: QuestionPattern, d?: number) => void;
  onGenerateScenario: (topic: string, domain: number) => void;
  generating: boolean;
  genLogs: string[];
  drillDomain: number | undefined;
  setDrillDomain: (d: number | undefined) => void;
}) {
  const [customTopic, setCustomTopic] = useState('');
  const [customDomain, setCustomDomain] = useState(1);
  const aiConfig = loadAIConfig();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Theater className="w-8 h-8 text-indigo-500" />
          Scenario Learning Lab
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Learn through real-world scenarios and targeted pattern drills
        </p>
      </div>

      {/* Two mode cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Scenarios */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Interactive Scenarios</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Real-world case studies with multi-act decisions</p>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {SCENARIO_TEMPLATES.map(scenario => (
              <button
                key={scenario.id}
                onClick={() => onStartScenario(scenario)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{scenario.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      scenario.difficulty === 'hard'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : scenario.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {scenario.difficulty}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      D{scenario.domain}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{scenario.context}</p>
                <div className="flex items-center gap-1 mt-1">
                  {scenario.topics.slice(0, 3).map((t, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded">
                      {t}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-400">{scenario.acts.length} acts</span>
                </div>
              </button>
            ))}
          </div>

          {/* Generate custom scenario */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              Generate Custom Scenario ({aiConfig.provider})
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Topic (e.g., Shadow AI, Supply Chain)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
              <select
                value={customDomain}
                onChange={(e) => setCustomDomain(Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value={1}>D1</option>
                <option value={2}>D2</option>
                <option value={3}>D3</option>
                <option value={4}>D4</option>
              </select>
              <button
                onClick={() => customTopic.trim() && onGenerateScenario(customTopic.trim(), customDomain)}
                disabled={generating || !customTopic.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm flex items-center gap-1"
              >
                {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Pattern Drills */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pattern Drills</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Targeted practice on specific question patterns</p>
            </div>
          </div>

          <div className="mb-3">
            <select
              value={drillDomain ?? ''}
              onChange={(e) => setDrillDomain(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All Domains</option>
              <option value="1">Domain 1: AI Governance</option>
              <option value="2">Domain 2: AI Risk</option>
              <option value="3">Domain 3: AI Development</option>
              <option value="4">Domain 4: AI Operations</option>
            </select>
          </div>

          <div className="space-y-2">
            {QUESTION_PATTERNS.filter(p => ['best', 'most', 'first', 'primary', 'not'].includes(p.id)).map(pattern => {
              const freqColors: Record<string, string> = {
                very_high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              };

              return (
                <button
                  key={pattern.id}
                  onClick={() => onStartDrill(pattern, drillDomain)}
                  disabled={generating}
                  className="w-full text-left p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <span className="text-orange-700 dark:text-orange-400 font-bold text-xs">{pattern.keyword}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400">{pattern.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{pattern.strategy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${freqColors[pattern.examFrequency]}`}>
                        {pattern.examFrequency.replace('_', ' ')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Questions generated on-demand by {aiConfig.provider} ({aiConfig.model})
          </p>
        </div>
      </div>

      {/* Generation logs */}
      {genLogs.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Zap className="w-4 h-4" />
            Generation Console
          </div>
          {genLogs.map((log, i) => (
            <div key={i} className={`text-xs py-0.5 ${
              log.startsWith('✓') ? 'text-green-400' :
              log.startsWith('⚠') || log.startsWith('✗') ? 'text-yellow-400' :
              log.startsWith('◌') ? 'text-blue-300' :
              'text-gray-300'
            }`}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ SCENARIO VIEW ============

function ScenarioView({
  state,
  onAnswer,
  onNext,
  onBack,
}: {
  state: ScenarioState;
  onAnswer: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const { scenario, currentAct, answers, showExplanation, completed } = state;

  if (completed) {
    const correct = answers.filter(a => a.correct).length;
    const total = answers.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Lab
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${pct >= 80 ? 'text-yellow-500' : pct >= 50 ? 'text-blue-500' : 'text-gray-400'}`} />
          <h2 className="text-2xl font-bold mb-2">Scenario Complete!</h2>
          <h3 className="text-lg text-gray-500 dark:text-gray-400 mb-4">{scenario.title}</h3>

          <div className="text-4xl font-bold mb-2" style={{
            color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#ef4444',
          }}>
            {correct}/{total} ({pct}%)
          </div>

          <div className="mt-6 space-y-3">
            {scenario.acts.map((act, i) => (
              <div key={i} className={`p-3 rounded-lg text-left ${
                answers[i]?.correct
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {answers[i]?.correct ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">Act {i + 1}: {act.question}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">{act.examConnection}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onBack}
            className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Lab
          </button>
        </div>
      </div>
    );
  }

  const act = scenario.acts[currentAct];
  const currentAnswer = answers[currentAct];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Lab
      </button>

      {/* Scenario header */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
            <Theater className="w-5 h-5" />
            {scenario.title}
          </h2>
          <div className="flex items-center gap-2">
            {scenario.acts.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${
                i < currentAct ? 'bg-green-500' :
                i === currentAct ? 'bg-indigo-500 animate-pulse' :
                'bg-gray-300 dark:bg-gray-600'
              }`} />
            ))}
          </div>
        </div>
        <p className="text-sm text-indigo-600 dark:text-indigo-300">{scenario.context}</p>
      </div>

      {/* Current act */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Act {currentAct + 1} of {scenario.acts.length}</div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
          <p className="text-sm leading-relaxed">{act.situation}</p>
        </div>

        <h3 className="font-semibold text-lg mb-4">{act.question}</h3>

        <div className="space-y-2">
          {act.options.map((option, i) => {
            let optionClass = 'border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer';

            if (showExplanation) {
              if (i === act.correctAnswer) {
                optionClass = 'border-green-500 bg-green-50 dark:bg-green-900/20';
              } else if (i === currentAnswer?.selected && !currentAnswer.correct) {
                optionClass = 'border-red-500 bg-red-50 dark:bg-red-900/20';
              } else {
                optionClass = 'border-gray-200 dark:border-gray-600 opacity-50';
              }
            }

            return (
              <button
                key={i}
                onClick={() => onAnswer(i)}
                disabled={showExplanation}
                className={`w-full text-left p-3 rounded-lg border ${optionClass} transition-all text-sm`}
              >
                <div className="flex items-center gap-3">
                  {showExplanation && i === act.correctAnswer && (
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  )}
                  {showExplanation && i === currentAnswer?.selected && !currentAnswer.correct && (
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 border ${
            currentAnswer?.correct
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {currentAnswer?.correct ? (
                <><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-semibold text-green-700 dark:text-green-400">Correct!</span></>
              ) : (
                <><XCircle className="w-5 h-5 text-red-600" /><span className="font-semibold text-red-700 dark:text-red-400">Not quite</span></>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4" />
              Concept Explanation
            </h4>
            <p className="text-sm">{act.conceptExplanation}</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" />
              Exam Connection
            </h4>
            <p className="text-sm">{act.examConnection}</p>
          </div>

          <button
            onClick={onNext}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {currentAct + 1 >= scenario.acts.length ? (
              <><Trophy className="w-4 h-4" /> View Results</>
            ) : (
              <><ChevronRight className="w-4 h-4" /> Next Act</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ============ DRILL VIEW ============

function DrillView({
  state,
  onAnswer,
  onNext,
  onBack,
  logs,
  generating,
}: {
  state: DrillState;
  onAnswer: (index: number) => void;
  onNext: () => void;
  onBack: () => void;
  logs: string[];
  generating: boolean;
}) {
  const { pattern, questions, currentIndex, answers, showExplanation, loading } = state;

  if (loading || generating) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Lab
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-orange-500 animate-spin" />
          <h3 className="text-lg font-bold mb-2">Generating {pattern.keyword} Pattern Questions...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Using AI to create targeted practice questions</p>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm max-h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs py-0.5 ${
                log.startsWith('✓') ? 'text-green-400' :
                log.startsWith('⚠') || log.startsWith('✗') ? 'text-yellow-400' :
                'text-gray-300'
              }`}>{log}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Lab
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-bold mb-2">Could not generate questions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Try again or switch to a different AI provider</p>
          <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Back to Lab</button>
        </div>
        {logs.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm max-h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-xs py-0.5 text-yellow-400">{log}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Drill complete
  if (currentIndex >= questions.length) {
    const correct = answers.filter(a => a.correct).length;
    const total = answers.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Lab
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${pct >= 80 ? 'text-green-500' : pct >= 50 ? 'text-blue-500' : 'text-red-500'}`} />
          <h2 className="text-2xl font-bold mb-1">{pattern.name} Drill Complete</h2>
          <div className="text-4xl font-bold my-3" style={{
            color: pct >= 80 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#ef4444',
          }}>
            {correct}/{total} ({pct}%)
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-left mt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Pattern Tip
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{pattern.strategy}</p>
          </div>

          <button onClick={onBack} className="mt-6 px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Back to Lab
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const currentAnswer = answers[currentIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Lab
      </button>

      {/* Pattern header */}
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">
            <Target className="w-5 h-5" />
            {pattern.name} Drill
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-600 dark:text-orange-300">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${
                  i < currentIndex
                    ? answers[i]?.correct ? 'bg-green-500' : 'bg-red-500'
                    : i === currentIndex ? 'bg-orange-500 animate-pulse'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">D{q.domain}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            q.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>{q.difficulty}</span>
          <span className="text-xs text-gray-400">{q.topic}</span>
        </div>

        <h3 className="font-semibold text-lg mb-4">{q.question}</h3>

        <div className="space-y-2">
          {q.options.map((option, i) => {
            let cls = 'border-gray-200 dark:border-gray-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer';

            if (showExplanation) {
              if (i === q.correctAnswer) {
                cls = 'border-green-500 bg-green-50 dark:bg-green-900/20';
              } else if (i === currentAnswer?.selected && !currentAnswer.correct) {
                cls = 'border-red-500 bg-red-50 dark:bg-red-900/20';
              } else {
                cls = 'border-gray-200 dark:border-gray-600 opacity-50';
              }
            }

            return (
              <button
                key={i}
                onClick={() => onAnswer(i)}
                disabled={showExplanation}
                className={`w-full text-left p-3 rounded-lg border ${cls} transition-all text-sm`}
              >
                <div className="flex items-center gap-3">
                  {showExplanation && i === q.correctAnswer && <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  {showExplanation && i === currentAnswer?.selected && !currentAnswer.correct && <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="space-y-3">
          <div className={`rounded-xl p-4 border ${
            currentAnswer?.correct
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {currentAnswer?.correct ? (
                <><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-semibold text-green-700 dark:text-green-400">Correct!</span></>
              ) : (
                <><XCircle className="w-5 h-5 text-red-600" /><span className="font-semibold text-red-700 dark:text-red-400">Incorrect</span></>
              )}
            </div>
            <p className="text-sm">{q.explanation}</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
            <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4" />
              {pattern.keyword} Pattern Logic
            </h4>
            <p className="text-xs text-orange-600 dark:text-orange-300">{pattern.strategy}</p>
          </div>

          <button
            onClick={onNext}
            className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {currentIndex + 1 >= questions.length ? (
              <><BarChart3 className="w-4 h-4" /> View Results</>
            ) : (
              <><ChevronRight className="w-4 h-4" /> Next Question</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
