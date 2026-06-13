import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useGamification } from '../context/GamificationContext';
import { sampleQuestions } from '../data/initialData';
import { ChevronRight, CheckCircle, XCircle, RotateCcw, Zap } from 'lucide-react';

type QuizState = 'setup' | 'active' | 'review';

export default function Quiz() {
  const { state, addQuizAttempt } = useApp();
  const { completeQuiz } = useGamification();
  const [quizState, setQuizState] = useState<QuizState>('setup');
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>('all');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const filteredQuestions = selectedDomain === 'all'
    ? sampleQuestions
    : sampleQuestions.filter(q => q.domain === selectedDomain);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const startQuiz = () => {
    setAnswers(new Array(filteredQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setEarnedXP(0);
    setQuizState('active');
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const correctCount = answers.reduce((count: number, answer, index) => {
      return count + (answer === filteredQuestions[index].correctAnswer ? 1 : 0);
    }, 0);

    const score = Math.round((correctCount / filteredQuestions.length) * 100);

    addQuizAttempt({
      date: new Date().toISOString(),
      domain: selectedDomain,
      totalQuestions: filteredQuestions.length,
      correctAnswers: correctCount,
      score: score,
    });

    // Award XP through gamification system
    const xp = completeQuiz(score, filteredQuestions.length, correctCount, selectedDomain);
    setEarnedXP(xp);

    setQuizState('review');
  };

  const resetQuiz = () => {
    setQuizState('setup');
    setSelectedDomain('all');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowExplanation(false);
  };

  if (quizState === 'setup') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Practice Quiz</h1>
          <p className="text-gray-600 mt-2">Test your knowledge with practice questions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8 max-w-2xl">
          <h2 className="text-xl font-semibold mb-6">Select Domain</h2>
          
          <div className="space-y-3 mb-8">
            <button
              onClick={() => setSelectedDomain('all')}
              className={`w-full p-4 rounded-lg border text-left transition-colors ${
                selectedDomain === 'all'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-medium">All Domains</span>
              <span className="text-sm text-gray-500 ml-2">({sampleQuestions.length} questions)</span>
            </button>
            
            {state.domains.map(domain => {
              const questionCount = sampleQuestions.filter(q => q.domain === domain.id).length;
              return (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedDomain === domain.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl mr-2">{domain.icon}</span>
                  <span className="font-medium">Domain {domain.id}: {domain.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({questionCount} questions)</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={startQuiz}
            disabled={filteredQuestions.length === 0}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Start Quiz
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Recent Attempts */}
        {state.quizAttempts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Attempts</h2>
            <div className="space-y-3">
              {state.quizAttempts.slice(-5).reverse().map(attempt => (
                <div key={attempt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {attempt.domain === 'all' ? 'All Domains' : `Domain ${attempt.domain}`}
                    </p>
                    <p className="text-sm text-gray-500">{new Date(attempt.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      attempt.score >= 80 ? 'text-green-600' : attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {attempt.score}%
                    </p>
                    <p className="text-sm text-gray-500">{attempt.correctAnswers}/{attempt.totalQuestions} correct</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (quizState === 'active') {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {filteredQuestions.length}
          </span>
          <div className="flex-1 mx-4">
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-primary-600">
            Domain {currentQuestion.domain}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <h2 className="text-xl font-medium text-gray-900 mb-6">{currentQuestion.question}</h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showResult = showExplanation;

              let buttonClass = 'border-gray-200 hover:border-gray-300';
              if (showResult) {
                if (isCorrect) {
                  buttonClass = 'border-green-500 bg-green-50';
                } else if (isSelected && !isCorrect) {
                  buttonClass = 'border-red-500 bg-red-50';
                }
              } else if (isSelected) {
                buttonClass = 'border-primary-500 bg-primary-50';
              }

              return (
                <button
                  key={index}
                  onClick={() => !showExplanation && setSelectedAnswer(index)}
                  disabled={showExplanation}
                  className={`w-full p-4 rounded-lg border text-left transition-colors flex items-center gap-3 ${buttonClass}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    showResult && isCorrect
                      ? 'bg-green-500 text-white'
                      : showResult && isSelected && !isCorrect
                      ? 'bg-red-500 text-white'
                      : isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showResult && isCorrect && <CheckCircle className="text-green-500" size={20} />}
                  {showResult && isSelected && !isCorrect && <XCircle className="text-red-500" size={20} />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-800 mb-2">Explanation:</p>
              <p className="text-blue-700">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            {!showExplanation ? (
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                {currentQuestionIndex < filteredQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Review state
  const correctCount = answers.reduce((count: number, answer, index) => {
    return count + (answer === filteredQuestions[index].correctAnswer ? 1 : 0);
  }, 0);
  const score = Math.round((correctCount / filteredQuestions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h1>
        
        <div className={`text-6xl font-bold mb-2 ${
          score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {score}%
        </div>
        <p className="text-gray-600 mb-4">
          You got {correctCount} out of {filteredQuestions.length} questions correct
        </p>

        {/* XP Earned Display */}
        {earnedXP > 0 && (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-lg mb-6 animate-bounce-in">
            <Zap size={24} />
            +{earnedXP} XP Earned!
          </div>
        )}

        {score === 100 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
            <span className="text-2xl">🏆</span>
            <p className="text-purple-700 font-semibold">Perfect Score!</p>
            <p className="text-sm text-purple-600">You earned a bonus +100 XP!</p>
          </div>
        )}

        <button
          onClick={resetQuiz}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
        >
          <RotateCcw size={20} />
          Try Again
        </button>
      </div>

      {/* Question Review */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6">Review Answers</h2>
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;

            return (
              <div key={question.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start gap-3">
                  {isCorrect ? (
                    <CheckCircle className="text-green-500 mt-1" size={20} />
                  ) : (
                    <XCircle className="text-red-500 mt-1" size={20} />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{question.question}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Your answer: {userAnswer !== null ? question.options[userAnswer] : 'No answer'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-700 mt-1">
                        Correct answer: {question.options[question.correctAnswer]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
