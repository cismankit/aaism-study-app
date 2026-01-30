import { useState, useRef, useEffect } from 'react';
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
  Pause
} from 'lucide-react';
import { 
  AIConfig, 
  loadAIConfig, 
  saveAIConfig,
  chat,
  defaultConfigs,
  AIProvider
} from '../services/aiService';
import { searchKnowledgeBase } from '../data/knowledgeBase';
import { 
  loadDocuments, 
  addDocument, 
  parseFileContent,
  getDocumentContext,
  deleteDocument
} from '../services/documentStore';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { UploadedDocument } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  saved?: boolean;
}

interface FollowUpQuestion {
  text: string;
  icon: string;
}

interface TutorProps {
  embedded?: boolean;
}

export default function Tutor({ embedded = false }: TutorProps) {
  const navigate = useNavigate();
  const { addNote } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [config, setConfig] = useState<AIConfig>(loadAIConfig);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [savedToNotes, setSavedToNotes] = useState<Set<string>>(new Set());
  const [visualMode, setVisualMode] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted chat on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('aaism-tutor-chat');
    if (savedChat) {
      try {
        const parsed = JSON.parse(savedChat);
        // Convert timestamp strings back to Date objects
        const restored = parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(restored);
      } catch (e) {
        console.error('Failed to restore chat:', e);
      }
    }
  }, []);

  // Save chat to localStorage on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aaism-tutor-chat', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setDocuments(loadDocuments());
  }, []);

  // Generate follow-up questions based on the last response
  const generateFollowUpQuestions = (topic: string): FollowUpQuestion[] => {
    const questions: FollowUpQuestion[] = [];
    
    if (topic.toLowerCase().includes('governance') || topic.toLowerCase().includes('domain 1')) {
      questions.push(
        { text: 'What are the key AI governance frameworks?', icon: '🏛️' },
        { text: 'Explain the EU AI Act risk levels', icon: '⚖️' },
        { text: 'How to establish AI policies?', icon: '📋' }
      );
    } else if (topic.toLowerCase().includes('risk') || topic.toLowerCase().includes('domain 2')) {
      questions.push(
        { text: 'What are common AI attack vectors?', icon: '🎯' },
        { text: 'Explain data poisoning attacks', icon: '☠️' },
        { text: 'How to assess AI model risk?', icon: '📊' }
      );
    } else if (topic.toLowerCase().includes('development') || topic.toLowerCase().includes('domain 3')) {
      questions.push(
        { text: 'What is MLOps?', icon: '🔧' },
        { text: 'Explain secure AI development lifecycle', icon: '🔒' },
        { text: 'Best practices for model testing', icon: '✅' }
      );
    } else if (topic.toLowerCase().includes('operation') || topic.toLowerCase().includes('domain 4')) {
      questions.push(
        { text: 'What is model drift?', icon: '📉' },
        { text: 'How to monitor AI in production?', icon: '👁️' },
        { text: 'AI incident response best practices', icon: '🚨' }
      );
    } else {
      questions.push(
        { text: 'Give me a practice question on this topic', icon: '❓' },
        { text: 'What are the key exam tips for this?', icon: '💡' },
        { text: 'How does this relate to other domains?', icon: '🔗' }
      );
    }
    
    return questions.slice(0, 3);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setFollowUpQuestions([]);
    
    // Apply visual mode enhancement if enabled
    const enhancedMessage = visualMode ? getVisualExplanationPrompt(userMessage) : userMessage;
    
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage, // Show original message to user
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Search knowledge base for context
      const kbResults = searchKnowledgeBase(userMessage);
      const topicContext = kbResults.topics.slice(0, 2).map(t => `- ${t.title}: ${t.description}`).join('\n');
      const termContext = kbResults.terms.slice(0, 3).map(t => `- ${t.term}: ${t.definition}`).join('\n');
      const kbContext = (topicContext || termContext) 
        ? `\n\nRelevant AAISM context:\n${topicContext}\n${termContext}`
        : '';

      // Search uploaded documents for context
      const docContext = getDocumentContext(userMessage);

      const response = await chat(config, [
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user', content: enhancedMessage + kbContext + docContext }
      ]);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.error 
          ? `⚠️ ${response.error}\n\nPlease check your AI settings and make sure you have configured a valid API key.`
          : response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
      
      // Generate follow-up questions
      if (!response.error) {
        setFollowUpQuestions(generateFollowUpQuestions(userMessage + ' ' + response.content));
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.',
        timestamp: new Date()
      }]);
    }

    setLoading(false);
  };

  const handleSaveToNotes = (message: Message, domain: number = 1) => {
    const title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
    addNote(domain, {
      title: `AI Tutor: ${title}`,
      content: message.content
    });
    setSavedToNotes(prev => new Set(prev).add(message.id));
  };

  const handleCreateQuiz = (content: string) => {
    // Store content and show quiz prompt
    localStorage.setItem('generateQuizFrom', content);
    if (embedded) {
      // When embedded, show a message that quiz can be created from Notes
      const quizMsg: Message = {
        id: `quiz-${Date.now()}`,
        role: 'assistant',
        content: `📝 **Quiz content saved!** 

I've saved this content for quiz generation. Here's how to use it:

1. **Go to the Quiz tab** (click "Quiz" above)
2. **Start a practice quiz** - it will include questions related to this topic
3. **Or go to Notes** → Click on any note → Use "Convert to Flashcard" for spaced repetition

💡 **Quick Quiz Options:**
- Practice Quiz (10 questions, with explanations)
- Exam Simulation (100 questions, 150 min timer)

All quizzes use **real AAISM exam-style questions** from the official question bank!`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, quizMsg]);
    } else {
      navigate('/study?tab=quiz&generate=true');
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setFollowUpQuestions([]);
    localStorage.removeItem('aaism-tutor-chat');
  };

  const handleDeleteDocument = (docId: string) => {
    deleteDocument(docId);
    setDocuments(loadDocuments());
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  // Visual explanation prompt modifier
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

  const quickActions = [
    { icon: '📚', label: 'Explain a concept', prompt: 'Explain the concept of ' },
    { icon: '❓', label: 'Practice question', prompt: 'Generate a practice question about ' },
    { icon: '🎯', label: 'Study tips', prompt: 'What are the key study tips for ' },
    { icon: '📋', label: 'Domain overview', prompt: 'Give me an overview of AAISM Domain ' },
  ];

  const bgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBgClass = isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200';

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.pdf,.png,.jpg,.jpeg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <BookOpen className="text-white" size={20} />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${textClass}`}>AI Study Tutor</h1>
            <p className={`text-sm ${subtextClass}`}>
              Ask anything about AAISM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Documents toggle */}
          {documents.length > 0 && (
            <button
              onClick={() => setShowDocuments(!showDocuments)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                showDocuments ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : `${subtextClass} hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
              title="Manage documents"
            >
              <FileText size={18} />
              <span className="text-xs font-medium">{documents.length}</span>
            </button>
          )}
          {/* Visual mode toggle */}
          <button
            onClick={() => setVisualMode(!visualMode)}
            className={`p-2 rounded-lg transition-colors ${
              visualMode ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : `${subtextClass} hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`
            }`}
            title={visualMode ? "Visual mode ON" : "Visual mode OFF - Click for visual explanations"}
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
          {/* Settings button - AI provider settings here */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : `${subtextClass} hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`
            }`}
            title="AI Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Documents Panel */}
      {showDocuments && documents.length > 0 && (
        <div className={`${bgClass} rounded-xl border ${borderClass} p-4 mb-4`}>
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
                      {(doc.content.length / 1024).toFixed(1)}KB • {new Date(doc.uploadedAt).toLocaleDateString()}
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
          <p className={`text-xs ${subtextClass} mt-2`}>
            💡 These documents provide context for AI responses. Click 🗑️ to remove.
          </p>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className={`${bgClass} rounded-xl border ${borderClass} p-4 mb-4`}>
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
                <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                  console.groq.com <ExternalLink size={12} />
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className={`flex-1 ${bgClass} rounded-xl border ${borderClass} flex flex-col overflow-hidden`}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-purple-900/30' : 'bg-gradient-to-br from-purple-100 to-indigo-100'}`}>
                <BookOpen className={isDark ? 'text-purple-400' : 'text-purple-500'} size={28} />
              </div>
              <h3 className={`text-lg font-semibold ${textClass} mb-2`}>Ready to Help You Study!</h3>
              <p className={`${subtextClass} text-sm mb-6 max-w-md`}>
                Ask me anything about AI governance, risk management, development, or operations for your AAISM exam.
              </p>
              
              {/* Quick Actions */}
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
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Upload hint */}
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
              {messages.map((msg) => (
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
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                    
                    {/* Action buttons for assistant messages */}
                    {msg.role === 'assistant' && !msg.content.startsWith('⚠️') && (
                      <div className="flex items-center gap-1 pl-2">
                        {/* Copy button */}
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className={`p-1.5 rounded-lg transition-colors ${subtextClass} hover:bg-gray-200 dark:hover:bg-gray-600`}
                          title="Copy to clipboard"
                        >
                          {copiedId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                        
                        {/* Save to Notes */}
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
                        
                        {/* Create Quiz */}
                        <button
                          onClick={() => handleCreateQuiz(msg.content)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${subtextClass} hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-purple-500`}
                          title="Generate quiz from this"
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
                  <div className={`p-4 rounded-2xl rounded-bl-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  </div>
                </div>
              )}
              
              {/* Follow-up Questions */}
              {followUpQuestions.length > 0 && !loading && (
                <div className="pt-2">
                  <p className={`text-xs ${subtextClass} mb-2 flex items-center gap-1`}>
                    <MessageSquarePlus size={12} />
                    Suggested follow-ups:
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

        {/* Input */}
        <div className={`p-4 border-t ${borderClass}`}>
          {/* Document indicator */}
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
              title={documents.length > 0 ? `${documents.length} docs loaded - Add more` : 'Upload study materials'}
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
              placeholder="Ask about AAISM topics..."
              className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${inputBgClass} ${textClass}`}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
