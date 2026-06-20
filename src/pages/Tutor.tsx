import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  BookOpen,
  Settings,
  Loader2,
  ExternalLink,
  Upload,
  Paperclip,
  BookmarkPlus,
  HelpCircle,
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  MessageSquarePlus,
  X,
  FileText,
  Trash2,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Square,
} from 'lucide-react';
import {
  AIConfig,
  loadAIConfig,
  saveAIConfig,
  chat,
  defaultConfigs,
  AIProvider,
} from '../services/aiService';
import { searchKnowledgeBase } from '../data/knowledgeBase';
import {
  loadDocuments,
  addDocument,
  parseFileContent,
  getDocumentContext,
  deleteDocument,
} from '../services/documentStore';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useCert } from '../context/CertContext';
import { UploadedDocument } from '../types';
import {
  buildCertTutorContext,
  generateCertFollowUpQuestions,
  getCertQuickActions,
  getCertDefaultFollowUps,
  inferDomainFromText,
  tutorChatStorageKey,
  migrateTutorChatStorage,
  type TutorFollowUp,
} from '../services/tutorService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  timestamp: Date;
  saved?: boolean;
}

interface TutorProps {
  embedded?: boolean;
  onSwitchTab?: (tab: 'notes' | 'quiz') => void;
  onToast?: (message: string) => void;
  onQuizBootstrap?: (bootstrap: { domainId: number; questionCount?: number }) => void;
}

const TUTOR_TIMEOUT_MS = 180_000;
const TUTOR_NUM_PREDICT = 8192;

export default function Tutor({
  embedded = false,
  onSwitchTab,
  onToast,
  onQuizBootstrap,
}: TutorProps) {
  const navigate = useNavigate();
  const { addNote } = useApp();
  const { activeCert, activeCertId } = useCert();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<TutorFollowUp[]>([]);
  const [savedToNotes, setSavedToNotes] = useState<Set<string>>(new Set());
  const [visualMode, setVisualMode] = useState(false);
  const [streamingThinking, setStreamingThinking] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingThinkingRef = useRef('');
  const streamingContentRef = useRef('');

  const certContext = useMemo(() => buildCertTutorContext(activeCert), [activeCert]);
  const quickActions = useMemo(() => getCertQuickActions(activeCert), [activeCert]);
  const defaultFollowUps = useMemo(() => getCertDefaultFollowUps(activeCert), [activeCert]);
  const chatStorageKey = tutorChatStorageKey(activeCertId);

  const clearLoadingGuard = useCallback(() => {
    if (loadingGuardRef.current) {
      clearTimeout(loadingGuardRef.current);
      loadingGuardRef.current = null;
    }
  }, []);

  // Load persisted chat per cert
  useEffect(() => {
    migrateTutorChatStorage(activeCertId);
    const savedChat = localStorage.getItem(chatStorageKey);
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        const restored = parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(restored);
      } catch (e) {
        console.error('Failed to restore chat:', e);
      }
    } else {
      setMessages([]);
    }
    setFollowUpQuestions([]);
    setSavedToNotes(new Set());
    setLoadError(null);
  }, [chatStorageKey, activeCertId]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(chatStorageKey, JSON.stringify(messages));
    } else {
      localStorage.removeItem(chatStorageKey);
    }
  }, [messages, chatStorageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streamingThinking, streamingContent]);

  useEffect(() => {
    setDocuments(loadDocuments());
  }, []);

  useEffect(() => () => {
    clearLoadingGuard();
    abortRef.current?.abort();
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
  }, [clearLoadingGuard]);

  const startElapsedTimer = useCallback(() => {
    setElapsedSec(0);
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSec(s => s + 1);
    }, 1000);
  }, []);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    clearLoadingGuard();
    stopElapsedTimer();
    setLoading(false);
    setStreamingThinking('');
    setStreamingContent('');
    setLoadError('Request cancelled');
  }, [clearLoadingGuard, stopElapsedTimer]);

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setFollowUpQuestions([]);
    setLoadError(null);

    const enhancedMessage = visualMode ? getVisualExplanationPrompt(userMessage) : userMessage;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setStreamingThinking('');
    setStreamingContent('');
    streamingThinkingRef.current = '';
    streamingContentRef.current = '';
    setReasoningExpanded(true);
    startElapsedTimer();

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    clearLoadingGuard();
    loadingGuardRef.current = setTimeout(() => {
      abortController.abort();
      stopElapsedTimer();
      setLoading(false);
      setLoadError('Request timed out — try a faster model or check your AI provider settings.');
      setMessages(prev => [
        ...prev,
        {
          id: `timeout-${Date.now()}`,
          role: 'assistant',
          content:
            '⚠️ Request timed out after 3 minutes. Try Groq for faster responses, or increase timeout in Settings if using a local thinking model.',
          timestamp: new Date(),
        },
      ]);
    }, TUTOR_TIMEOUT_MS + 5_000);

    try {
      const kbResults = searchKnowledgeBase(userMessage, activeCertId);
      const topicContext = kbResults.topics
        .slice(0, 2)
        .map(t => `- ${t.title}: ${t.description}`)
        .join('\n');
      const termContext = kbResults.terms
        .slice(0, 3)
        .map(t => `- ${t.term}: ${t.definition}`)
        .join('\n');
      const guideContext = kbResults.guides
        .slice(0, 2)
        .map(g => `- ${g.name}: ${g.overview.slice(0, 200)}`)
        .join('\n');
      const kbContext =
        topicContext || termContext || guideContext
          ? `\n\nRelevant ${activeCert.shortName} knowledge base context:\n${topicContext}\n${termContext}\n${guideContext}`
          : '';

      const docContext = getDocumentContext(userMessage);

      const useOllamaStream = config.provider === 'ollama';

      const response = await chat(
        config,
        [
          { role: 'system', content: certContext },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user', content: enhancedMessage + kbContext + docContext },
        ],
        {
          numPredict: config.provider === 'ollama' ? TUTOR_NUM_PREDICT : undefined,
          timeoutMs: TUTOR_TIMEOUT_MS,
          signal: abortController.signal,
          allowThinking: true,
          stream: useOllamaStream,
          streamCallbacks: useOllamaStream
            ? {
                onThinking: (_delta, full) => {
                  streamingThinkingRef.current = full;
                  setStreamingThinking(full);
                },
                onContent: (_delta, full) => {
                  streamingContentRef.current = full;
                  setStreamingContent(full);
                },
              }
            : undefined,
        },
      );

      clearLoadingGuard();
      stopElapsedTimer();

      const finalContent = response.content || streamingContentRef.current;
      const capturedThinking = streamingThinkingRef.current;

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.error
          ? `⚠️ ${response.error}\n\nPlease check your AI settings and make sure you have configured a valid API key.`
          : finalContent,
        thinking: capturedThinking || undefined,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setStreamingThinking('');
      setStreamingContent('');

      if (response.error) {
        setLoadError(response.error);
      } else {
        setFollowUpQuestions(
          generateCertFollowUpQuestions(activeCert, userMessage + ' ' + finalContent),
        );
      }
    } catch (err) {
      clearLoadingGuard();
      stopElapsedTimer();
      if (abortController.signal.aborted) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setLoadError(msg);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${msg}. Please try again or check AI provider settings.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      clearLoadingGuard();
      stopElapsedTimer();
      abortRef.current = null;
      setLoading(false);
      setStreamingThinking('');
      setStreamingContent('');
    }
  };

  const handleSaveToNotes = (message: Message) => {
    const domainId = inferDomainFromText(activeCert, message.content);
    const title =
      message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
    addNote(domainId, {
      title: `AI Tutor: ${title}`,
      content: message.content,
    });
    setSavedToNotes(prev => new Set(prev).add(message.id));
    onToast?.(`Saved to Notes (Domain ${domainId})`);
    onSwitchTab?.('notes');
  };

  const handleCreateQuiz = (content: string) => {
    const domainId = inferDomainFromText(activeCert, content);
    localStorage.setItem('generateQuizFrom', content);
    localStorage.setItem('generateQuizDomain', String(domainId));

    if (embedded && onSwitchTab) {
      onQuizBootstrap?.({ domainId, questionCount: 10 });
      onSwitchTab('quiz');
      onToast?.(`Opening Quiz for ${activeCert.shortName} Domain ${domainId}`);
      return;
    }

    navigate(`/study?tab=quiz&domain=${domainId}`);
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setFollowUpQuestions([]);
    setLoadError(null);
    localStorage.removeItem(chatStorageKey);
  };

  const handleDeleteDocument = (docId: string) => {
    deleteDocument(docId);
    setDocuments(loadDocuments());
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const getVisualExplanationPrompt = (question: string) => {
    return `${question}

Please provide a visual, step-by-step explanation using:
1. 📊 Diagrams described in ASCII or emoji flowcharts
2. 🎯 Numbered steps with clear progression
3. 💡 Key concepts highlighted with icons
4. 🔗 Relationships shown with arrows (→, ↔, ⇒)
5. 📋 Summary tables where applicable

Make it educational and easy to visualize mentally.`;
  };

  const bgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBgClass = isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';

  const containerClass = embedded
    ? 'w-full h-[min(680px,calc(100vh-260px))] flex flex-col'
    : 'max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col';

  return (
    <div className={containerClass}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.pdf,.png,.jpg,.jpeg"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="text-white" size={20} />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${textClass}`}>AI Study Tutor</h1>
            <p className={`text-sm ${subtextClass}`}>
              Ask anything about {activeCert.shortName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {documents.length > 0 && (
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                showDocuments
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : `${subtextClass} hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
              title="Manage documents"
            >
              <FileText size={18} />
              <span className="text-xs font-medium">{documents.length}</span>
            </button>
          )}
          <button
            onClick={() => setVisualMode(!visualMode)}
            className={`p-2 rounded-lg transition-colors ${
              visualMode
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : `${subtextClass} hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`
            }`}
            title={visualMode ? 'Visual mode ON' : 'Visual mode OFF - Click for visual explanations'}
          >
            {visualMode ? <Play size={18} /> : <Pause size={18} />}
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className={`p-2 rounded-lg transition-colors ${subtextClass} hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`}
              title="Clear chat"
            >
              <RotateCcw size={18} />
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : `${subtextClass} hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`
            }`}
            title="AI Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {showDocuments && documents.length > 0 && (
        <div className={`${bgClass} rounded-xl border ${borderClass} p-4 mb-4 shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${textClass} flex items-center gap-2`}>
              <FileText size={18} className="text-blue-500" />
              Uploaded Documents ({documents.length})
            </h3>
            <button
              onClick={() => setShowDocuments(false)}
              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${subtextClass}`}
            >
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {documents.map(doc => (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg">
                    {doc.type === 'pdf' ? '📄' : doc.type === 'image' ? '🖼️' : '📝'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${textClass}`}>{doc.name}</div>
                    <div className={`text-xs ${subtextClass}`}>
                      {(doc.content.length / 1024).toFixed(1)}KB •{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSettings && (
        <div className={`${bgClass} rounded-xl border ${borderClass} p-4 mb-4 shrink-0`}>
          <h3 className={`font-medium ${textClass} mb-3`}>AI Provider Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm ${subtextClass} mb-1`}>Provider</label>
              <select
                value={config.provider}
                onChange={e => {
                  const provider = e.target.value as AIProvider;
                  const newConfig = { ...config, provider, ...defaultConfigs[provider] };
                  setConfig(newConfig);
                  saveAIConfig(newConfig);
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass} ${textClass}`}
              >
                <option value="groq">Groq (Free) ⭐</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="claude">Claude</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            {config.provider !== 'ollama' && (
              <div>
                <label className={`block text-sm ${subtextClass} mb-1`}>API Key</label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={e => {
                    const newConfig = { ...config, apiKey: e.target.value };
                    setConfig(newConfig);
                    saveAIConfig(newConfig);
                  }}
                  placeholder={config.provider === 'groq' ? 'gsk_...' : 'sk-...'}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass} ${textClass}`}
                />
              </div>
            )}
          </div>
          {config.provider === 'groq' && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <p className={isDark ? 'text-green-300' : 'text-green-800'}>
                🎉 <strong>Groq is FREE!</strong> Get your API key at{' '}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  console.groq.com <ExternalLink size={12} />
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      <div
        className={`flex-1 min-h-0 ${bgClass} rounded-xl border ${borderClass} flex flex-col overflow-hidden`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-purple-900/30' : 'bg-gradient-to-br from-purple-100 to-indigo-100'}`}
              >
                <BookOpen className={isDark ? 'text-purple-400' : 'text-purple-500'} size={28} />
              </div>
              <h3 className={`text-lg font-semibold ${textClass} mb-2`}>Ready to Help You Study!</h3>
              <p className={`${subtextClass} text-sm mb-6 max-w-md`}>
                Ask me anything about {activeCert.shortName} — {activeCert.domains.length} exam
                domains from {activeCert.vendor}.
              </p>

              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.prompt)}
                    className={`flex items-center gap-2 p-3 rounded-lg text-left transition-colors ${
                      isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4 w-full max-w-md">
                <p className={`text-xs ${subtextClass} mb-2`}>Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {defaultFollowUps.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                        isDark
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <span>{q.icon}</span>
                      <span>{q.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`mt-6 p-4 rounded-xl border-2 border-dashed ${borderClass}`}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-2 ${subtextClass} hover:text-primary-500 transition-colors`}
                >
                  <Upload size={18} />
                  <span className="text-sm">Upload study materials for context-aware answers</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'space-y-2'}`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : `${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${textClass} rounded-bl-md`
                      }`}
                    >
                      {msg.role === 'assistant' && msg.thinking && (
                        <details className="mb-3 group">
                          <summary className={`text-xs cursor-pointer flex items-center gap-1 ${subtextClass} hover:text-gray-500`}>
                            <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                            Reasoning
                          </summary>
                          <p className={`mt-2 text-xs italic ${subtextClass} whitespace-pre-wrap border-l-2 pl-3 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}>
                            {msg.thinking}
                          </p>
                        </details>
                      )}
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>

                    {msg.role === 'assistant' && !msg.content.startsWith('⚠️') && (
                      <div className="flex items-center gap-1 pl-2 flex-wrap">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className={`p-1.5 rounded-lg transition-colors ${subtextClass} hover:bg-gray-200 dark:hover:bg-gray-600`}
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleSaveToNotes(msg)}
                          disabled={savedToNotes.has(msg.id)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                            savedToNotes.has(msg.id)
                              ? 'text-green-500'
                              : `${subtextClass} hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-primary-500`
                          }`}
                          title="Save to Notes"
                        >
                          <BookmarkPlus size={14} />
                          {savedToNotes.has(msg.id) ? 'Saved!' : 'Save to Notes'}
                        </button>
                        <button
                          onClick={() => handleCreateQuiz(msg.content)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${subtextClass} hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-purple-500`}
                          title="Start quiz on this topic"
                        >
                          <HelpCircle size={14} />
                          Create Quiz
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl rounded-bl-md space-y-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin text-gray-400" size={20} />
                        <span className={`text-sm ${subtextClass}`}>
                          {streamingContent ? 'Answering…' : streamingThinking ? 'Reasoning…' : 'Thinking…'}
                          {' '}({elapsedSec}s)
                        </span>
                      </div>
                      <button
                        onClick={handleCancel}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${subtextClass} hover:bg-gray-200 dark:hover:bg-gray-600`}
                        title="Cancel request"
                      >
                        <Square size={12} />
                        Cancel
                      </button>
                    </div>

                    {streamingThinking && (
                      <div className={`rounded-lg border ${borderClass} overflow-hidden`}>
                        <button
                          type="button"
                          onClick={() => setReasoningExpanded(v => !v)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium ${subtextClass} ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                        >
                          <span className="italic">Reasoning…</span>
                          {reasoningExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {reasoningExpanded && (
                          <p className={`px-3 py-2 text-xs italic ${subtextClass} whitespace-pre-wrap max-h-48 overflow-y-auto border-t ${borderClass}`}>
                            {streamingThinking}
                          </p>
                        )}
                      </div>
                    )}

                    {streamingContent && (
                      <div className={`prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap ${textClass}`}>
                        {streamingContent}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {loadError && !loading && (
                <p className="text-xs text-red-500 dark:text-red-400 px-1">{loadError}</p>
              )}

              {followUpQuestions.length > 0 && !loading && (
                <div className="pt-2">
                  <p className={`text-xs ${subtextClass} mb-2 flex items-center gap-1`}>
                    <MessageSquarePlus size={12} />
                    Suggested follow-ups for {activeCert.shortName}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {followUpQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q.text)}
                        className={`px-3 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors ${
                          isDark
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{q.icon}</span>
                        <span>{q.text}</span>
                        <ChevronRight size={14} className="opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div
          className={`shrink-0 sticky bottom-0 z-10 p-4 border-t ${borderClass} ${bgClass} shadow-[0_-4px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.25)]`}
        >
          {documents.length > 0 && (
            <div className={`text-xs ${subtextClass} mb-2 flex items-center gap-1`}>
              <Paperclip size={12} />
              {documents.length} document{documents.length !== 1 ? 's' : ''} loaded for context
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-3 rounded-xl transition-colors relative ${subtextClass} hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700`}
              title={
                documents.length > 0
                  ? `${documents.length} docs loaded - Add more`
                  : 'Upload study materials'
              }
            >
              <Paperclip size={20} />
              {documents.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {documents.length}
                </span>
              )}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Ask about ${activeCert.shortName} topics…`}
              aria-label={`Ask the ${activeCert.shortName} AI tutor`}
              className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${inputBgClass} ${textClass}`}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      try {
        const { content, type } = await parseFileContent(file);
        const doc = addDocument({
          name: file.name,
          type,
          content,
          size: file.size,
        });
        setDocuments(prev => [...prev, doc]);
      } catch (err) {
        console.error('Failed to upload file:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
}
