import { useState } from 'react';
import { Search, BookOpen, ChevronRight, ExternalLink } from 'lucide-react';
import { domains, topics, glossary, owaspLLM, searchKnowledgeBase, Topic, Term } from '../data/knowledgeBase';

type Tab = 'topics' | 'glossary' | 'owasp' | 'search';

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<Tab>('topics');
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ topics: Topic[]; terms: Term[] } | null>(null);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const results = searchKnowledgeBase(searchQuery);
    setSearchResults(results);
    setActiveTab('search');
  };

  const filteredTopics = selectedDomain
    ? topics.filter(t => t.domain === selectedDomain)
    : topics;

  const filteredGlossary = selectedDomain
    ? glossary.filter(t => t.domain === selectedDomain)
    : glossary;

  const tabs = [
    { id: 'topics' as Tab, label: 'Topics' },
    { id: 'glossary' as Tab, label: 'Glossary' },
    { id: 'owasp' as Tab, label: 'OWASP Top 10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-primary-500" />
            Knowledge Base
          </h1>
          <p className="text-gray-600 mt-1">AAISM exam topics, terms, and reference materials</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search topics, terms, concepts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Domain Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedDomain(null)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedDomain === null
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Domains
        </button>
        {domains.map(domain => (
          <button
            key={domain.id}
            onClick={() => setSelectedDomain(domain.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedDomain === domain.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Domain {domain.id}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
          ))}
          {searchResults && (
            <button
              onClick={() => setActiveTab('search')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'search'
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Search Results ({searchResults.topics.length + searchResults.terms.length})
              {activeTab === 'search' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Topics Tab */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              {filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  className={`bg-white rounded-xl shadow-sm border p-6 cursor-pointer transition-all ${
                    selectedTopic?.id === topic.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedTopic(selectedTopic?.id === topic.id ? null : topic)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        Domain {topic.domain}
                      </span>
                      <h3 className="text-lg font-semibold mt-2">{topic.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{topic.description}</p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        selectedTopic?.id === topic.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {selectedTopic?.id === topic.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Points</h4>
                        <ul className="space-y-1">
                          {topic.keyPoints.map((point, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-primary-500 mt-1">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Related Terms</h4>
                        <div className="flex flex-wrap gap-2">
                          {topic.relatedTerms.map((term, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Exam Tips</h4>
                        <ul className="space-y-1">
                          {topic.examTips.map((tip, i) => (
                            <li key={i} className="text-sm text-amber-700 bg-amber-50 p-2 rounded flex items-start gap-2">
                              <span>💡</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Glossary Tab */}
          {activeTab === 'glossary' && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Term</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Definition</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Domain</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGlossary.map((term, i) => (
                    <tr key={i} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{term.term}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{term.definition}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          D{term.domain}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* OWASP Tab */}
          {activeTab === 'owasp' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-2">OWASP Top 10 for LLM Applications</h2>
                <p className="text-gray-600 text-sm mb-4">
                  Critical security risks for Large Language Model applications. Essential knowledge for Domain 2.
                </p>
                <a
                  href="https://owasp.org/www-project-top-10-for-large-language-model-applications/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 text-sm flex items-center gap-1 hover:underline"
                >
                  Official OWASP Page <ExternalLink size={14} />
                </a>
              </div>

              {owaspLLM.map((item, i) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.id}: {item.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">Mitigation:</span> {item.mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Results Tab */}
          {activeTab === 'search' && searchResults && (
            <div className="space-y-6">
              {searchResults.topics.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Topics ({searchResults.topics.length})</h3>
                  <div className="space-y-3">
                    {searchResults.topics.map(topic => (
                      <div key={topic.id} className="bg-white rounded-lg border p-4">
                        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          Domain {topic.domain}
                        </span>
                        <h4 className="font-medium mt-2">{topic.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.terms.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Terms ({searchResults.terms.length})</h3>
                  <div className="space-y-2">
                    {searchResults.terms.map((term, i) => (
                      <div key={i} className="bg-white rounded-lg border p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{term.term}</span>
                          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                            D{term.domain}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{term.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.topics.length === 0 && searchResults.terms.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Domain Overview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Exam Domains</h3>
            {domains.map(domain => (
              <div
                key={domain.id}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  selectedDomain === domain.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDomain(selectedDomain === domain.id ? null : domain.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Domain {domain.id}</span>
                  <span className="text-xs text-gray-500">{domain.weight}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{domain.name}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Key Frameworks</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                NIST AI RMF
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                EU AI Act
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                ISO/IEC 42001
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                OWASP Top 10 for LLMs
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                MITRE ATLAS
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
