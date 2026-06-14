import { useNavigate } from 'react-router-dom';
import { BookOpen, Briefcase, RotateCcw, AlertCircle } from 'lucide-react';
import { ExamQuestion, getQuestionsByDomain } from '../data/examContent';
import { PLAYBOOKS } from '../data/playbooks';

interface WrongAnswer {
  question: ExamQuestion;
  userAnswer: number | null;
  shuffledCorrectAnswer?: number;
}

interface RemediationPanelProps {
  wrongAnswers: WrongAnswer[];
  onPracticeSimilar?: (questions: ExamQuestion[]) => void;
  compact?: boolean;
}

function findPlaybookForDomain(domainId: number) {
  return PLAYBOOKS.find(p => p.domain === domainId);
}

export default function RemediationPanel({ wrongAnswers, onPracticeSimilar, compact }: RemediationPanelProps) {
  const navigate = useNavigate();

  if (wrongAnswers.length === 0) return null;

  const handleSimilar = (q: ExamQuestion) => {
    const pool = getQuestionsByDomain(q.domain).filter(x => x.id !== q.id);
    const similar = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    if (onPracticeSimilar && similar.length > 0) {
      onPracticeSimilar(similar);
    } else {
      navigate('/study', { state: { startQuiz: true, domainId: q.domain } });
    }
  };

  return (
    <div className={`${compact ? 'mt-4' : 'mt-6'} space-y-3`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
        <AlertCircle className="w-4 h-4" />
        Remediation — {wrongAnswers.length} missed concept{wrongAnswers.length !== 1 ? 's' : ''}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {wrongAnswers.map(({ question }, i) => {
          const playbook = findPlaybookForDomain(question.domain);
          return (
            <div
              key={question.id ?? i}
              className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10"
            >
              <p className="text-sm font-medium text-cockpit line-clamp-2">
                {question.question}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                Missed: {question.topic || `Domain ${question.domain}`}
              </p>
              <p className="text-xs text-cockpit-muted mt-2 line-clamp-2">
                {question.explanation}
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => navigate(`/knowledge?domain=${question.domain}`)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  Knowledge D{question.domain}
                </button>
                {playbook && (
                  <button
                    onClick={() => navigate('/playbooks')}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <Briefcase className="w-3 h-3" />
                    {playbook.title.split(' ').slice(0, 3).join(' ')}…
                  </button>
                )}
                <button
                  onClick={() => handleSimilar(question)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  3 similar questions
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
