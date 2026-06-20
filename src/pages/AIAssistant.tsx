import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, HelpCircle, Target } from 'lucide-react';
import { 
  chat, 
  explainConcept, 
  generateQuestions, 
  analyzeWeakAreas,
  createStudyGuide,
  loadAIConfig, 
  Message,
} from '../services/aiService';
import { buildCertTutorContext } from '../services/tutorService';
import { useApp } from '../context/AppContext';
import { useCert } from '../context/CertContext';

type Mode = 'chat' | 'explain' | 'generate' | 'analyze' | 'guide';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const { state } = useApp();
  const { activeCert } = useCert();
  const certContext = buildCertTutorContext(activeCert);
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const config = loadAIConfig();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
    }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      let response;

      switch (mode) {
        case 'explain':
          response = await explainConcept(config, userMessage, undefined, certContext, activeCert.shortName);
          break;
        case 'generate':
          const domainMatch = userMessage.match(/domain\s*(\d)/i);
          const domain = domainMatch ? parseInt(domainMatch[1]) : 1;
          response = await generateQuestions(config, domain, 3, 'medium', certContext, activeCert.shortName);
          break;
        case 'analyze':
          const quizHistory = state.quizAttempts.map(a => ({
            domain: typeof a.domain === 'number' ? a.domain : 0,
            score: a.score,
          }));
          response = await analyzeWeakAreas(config, quizHistory, certContext);
          break;
        case 'guide':
          const guideDomainMatch = userMessage.match(/domain\s*(\d)/i);
          const guideDomain = guideDomainMatch ? parseInt(guideDomainMatch[1]) : 1;
          response = await createStudyGuide(config, guideDomain, userMessage, certContext, activeCert.shortName);
          break;
        default:
          // Regular chat
          const chatMessages: Message[] = [
            { role: 'system', content: certContext },
            ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
            { role: 'user', content: userMessage },
          ];
          response = await chat(config, chatMessages, {
            timeoutMs: 180_000,
            numPredict: config.provider === 'ollama' ? 8192 : undefined,
          });
      }

      if (response.error) {
        setError(response.error);
        addMessage('assistant', `⚠️ Error: ${response.error}`);
      } else {
        addMessage('assistant', response.content);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      addMessage('assistant', `⚠️ Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Explain prompt injection', mode: 'explain' as Mode, prompt: 'prompt injection attacks in LLMs' },
    { label: 'Generate Domain 2 questions', mode: 'generate' as Mode, prompt: 'Generate questions for Domain 2' },
    { label: 'Analyze my progress', mode: 'analyze' as Mode, prompt: 'Analyze my quiz performance' },
    { label: 'Study guide for Domain 1', mode: 'guide' as Mode, prompt: 'Create a study guide for Domain 1' },
  ];

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setMode(action.mode);
    setInput(action.prompt);
  };

  const modeButtons = [
    { mode: 'chat' as Mode, icon: Bot, label: 'Chat', desc: 'General Q&A' },
    { mode: 'explain' as Mode, icon: BookOpen, label: 'Explain', desc: 'Deep dive concepts' },
    { mode: 'generate' as Mode, icon: HelpCircle, label: 'Generate', desc: 'Practice questions' },
    { mode: 'analyze' as Mode, icon: Target, label: 'Analyze', desc: 'Study recommendations' },
    { mode: 'guide' as Mode, icon: Sparkles, label: 'Guide', desc: 'Study guides' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="text-primary-500" />
          AI Study Assistant
        </h1>
        <p className="text-gray-600 mt-1">
          Powered by {config.provider === 'ollama' ? 'Ollama (Local)' : config.provider === 'claude' ? 'Claude' : 'OpenAI'} 
          {' '}• Model: {config.model}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {modeButtons.map(({ mode: m, icon: Icon, label, desc }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              mode === m
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon size={18} />
            <div className="text-left">
              <div className="font-medium">{label}</div>
              <div className={`text-xs ${mode === m ? 'text-primary-200' : 'text-gray-500'}`}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action)}
                className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Bot size={48} className="mx-auto mb-4 opacity-50" />
              <p>Ask me anything about the {activeCert.shortName} exam!</p>
              <p className="text-sm mt-2">I can explain concepts, generate questions, and analyze your progress.</p>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-primary-600" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-gray-600" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Loader2 size={18} className="text-primary-600 animate-spin" />
            </div>
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={
            mode === 'explain' ? 'Enter a concept to explain...' :
            mode === 'generate' ? 'e.g., "Domain 2 questions" or "prompt injection"' :
            mode === 'analyze' ? 'Type "analyze" to review your progress' :
            mode === 'guide' ? 'e.g., "Domain 1" or "AI governance framework"' :
            `Ask me anything about ${activeCert.shortName}...`
          }
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
