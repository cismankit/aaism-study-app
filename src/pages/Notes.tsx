import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Plus, Edit2, Trash2, Save, X, Search, 
  Grid, List, Pin, PinOff
} from 'lucide-react';

interface NoteTag {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_TAGS: NoteTag[] = [
  { id: 'important', name: 'Important', color: 'bg-red-500' },
  { id: 'review', name: 'Review', color: 'bg-yellow-500' },
  { id: 'exam-tip', name: 'Exam Tip', color: 'bg-green-500' },
  { id: 'framework', name: 'Framework', color: 'bg-blue-500' },
  { id: 'definition', name: 'Definition', color: 'bg-purple-500' },
  { id: 'example', name: 'Example', color: 'bg-pink-500' },
];

type SortOption = 'newest' | 'oldest' | 'title-az' | 'title-za' | 'updated';
type ViewMode = 'list' | 'grid';

export default function Notes() {
  const { state, addNote, updateNote, deleteNote } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // UI State
  const [selectedDomain, setSelectedDomain] = useState<number | 'all'>(1);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // Custom tags
  const [customTags, setCustomTags] = useState<NoteTag[]>([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('bg-gray-500');

  const allTags = [...DEFAULT_TAGS, ...customTags];

  // Get all notes from all domains or selected domain
  const allNotes = useMemo(() => {
    const notes: Array<{ domainId: number; domainName: string; note: typeof state.domains[0]['notes'][0] }> = [];
    
    state.domains.forEach(domain => {
      if (selectedDomain === 'all' || selectedDomain === domain.id) {
        domain.notes.forEach(note => {
          notes.push({
            domainId: domain.id,
            domainName: domain.name,
            note
          });
        });
      }
    });
    
    return notes;
  }, [state.domains, selectedDomain]);

  // Parse note metadata (tags, pinned status stored in content)
  const parseNoteMetadata = (content: string) => {
    try {
      if (content.startsWith('<!--META:')) {
        const endIdx = content.indexOf('-->');
        if (endIdx > 0) {
          const metaStr = content.substring(9, endIdx);
          const meta = JSON.parse(metaStr);
          const actualContent = content.substring(endIdx + 3).trim();
          return { meta, content: actualContent };
        }
      }
    } catch {
      // Ignore parse errors
    }
    return { meta: { tags: [], pinned: false }, content };
  };

  const createNoteWithMetadata = (content: string, tags: string[], pinned: boolean) => {
    const meta = JSON.stringify({ tags, pinned });
    return `<!--META:${meta}-->\n${content}`;
  };

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = allNotes.map(item => {
      const { meta, content } = parseNoteMetadata(item.note.content);
      return {
        ...item,
        parsedContent: content,
        tags: meta.tags || [],
        pinned: meta.pinned || false
      };
    });

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.note.title.toLowerCase().includes(query) ||
        item.parsedContent.toLowerCase().includes(query) ||
        item.domainName.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (filterTag) {
      filtered = filtered.filter(item => item.tags.includes(filterTag));
    }

    // Pinned filter
    if (showPinnedOnly) {
      filtered = filtered.filter(item => item.pinned);
    }

    // Sort
    filtered.sort((a, b) => {
      // Pinned notes always first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (sortBy) {
        case 'newest':
          return new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime();
        case 'oldest':
          return new Date(a.note.createdAt).getTime() - new Date(b.note.createdAt).getTime();
        case 'title-az':
          return a.note.title.localeCompare(b.note.title);
        case 'title-za':
          return b.note.title.localeCompare(a.note.title);
        case 'updated':
          return new Date(b.note.updatedAt).getTime() - new Date(a.note.updatedAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [allNotes, searchQuery, filterTag, showPinnedOnly, sortBy]);

  const handleAddNote = () => {
    if (!noteTitle.trim()) return;
    const contentWithMeta = createNoteWithMetadata(noteContent, noteTags, isPinned);
    const targetDomain = selectedDomain === 'all' ? 1 : selectedDomain;
    addNote(targetDomain, { title: noteTitle, content: contentWithMeta });
    resetForm();
  };

  const handleUpdateNote = (domainId: number, noteId: string) => {
    if (!noteTitle.trim()) return;
    const contentWithMeta = createNoteWithMetadata(noteContent, noteTags, isPinned);
    updateNote(domainId, noteId, { title: noteTitle, content: contentWithMeta });
    resetForm();
  };

  const toggleNotePin = (domainId: number, noteId: string, currentContent: string, currentTitle: string) => {
    const { meta, content } = parseNoteMetadata(currentContent);
    const newContent = createNoteWithMetadata(content, meta.tags || [], !meta.pinned);
    updateNote(domainId, noteId, { title: currentTitle, content: newContent });
  };

  const startEditing = (domainId: number, noteId: string, title: string, content: string) => {
    const { meta, content: actualContent } = parseNoteMetadata(content);
    setIsEditing(`${domainId}-${noteId}`);
    setNoteTitle(title);
    setNoteContent(actualContent);
    setNoteTags(meta.tags || []);
    setIsPinned(meta.pinned || false);
    setIsAdding(false);
  };

  const resetForm = () => {
    setIsEditing(null);
    setIsAdding(false);
    setNoteTitle('');
    setNoteContent('');
    setNoteTags([]);
    setIsPinned(false);
  };

  const toggleTag = (tagId: string) => {
    setNoteTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const addCustomTag = () => {
    if (!newTagName.trim()) return;
    const newTag: NoteTag = {
      id: `custom-${Date.now()}`,
      name: newTagName,
      color: newTagColor
    };
    setCustomTags(prev => [...prev, newTag]);
    setNewTagName('');
  };

  const bgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-gray-100' : 'text-gray-900';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const inputBgClass = isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const renderNoteCard = (item: typeof filteredNotes[0]) => {
    const isCurrentlyEditing = isEditing === `${item.domainId}-${item.note.id}`;

    if (isCurrentlyEditing) {
      return (
        <div key={item.note.id} className={`p-4 rounded-lg border-2 border-primary-500 ${bgClass}`}>
          <input
            type="text"
            value={noteTitle}
            onChange={e => setNoteTitle(e.target.value)}
            placeholder="Note title..."
            className={`w-full px-3 py-2 rounded-lg mb-3 border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
          />
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            placeholder="Note content... (Markdown supported)"
            rows={6}
            className={`w-full px-3 py-2 rounded-lg mb-3 border focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm ${inputBgClass}`}
          />
          
          {/* Tags Selection */}
          <div className="mb-3">
            <p className={`text-sm font-medium mb-2 ${subtextClass}`}>Tags:</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-1 text-xs rounded-full transition-all ${
                    noteTags.includes(tag.id)
                      ? `${tag.color} text-white`
                      : isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Pin Toggle */}
          <label className={`flex items-center gap-2 mb-3 cursor-pointer ${subtextClass}`}>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
              className="rounded"
            />
            <Pin size={14} />
            Pin to top
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateNote(item.domainId, item.note.id)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={resetForm}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isDark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div 
        key={item.note.id} 
        className={`p-4 rounded-lg border transition-shadow hover:shadow-md ${borderClass} ${bgClass} ${
          viewMode === 'grid' ? 'h-full flex flex-col' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {item.pinned && <Pin size={14} className="text-primary-500 flex-shrink-0" />}
            <h3 className={`font-medium truncate ${textClass}`}>{item.note.title}</h3>
          </div>
          <div className="flex gap-1 flex-shrink-0 ml-2">
            <button
              onClick={() => toggleNotePin(item.domainId, item.note.id, item.note.content, item.note.title)}
              className={`p-1.5 rounded transition-colors ${
                item.pinned 
                  ? 'text-primary-500 hover:bg-primary-100' 
                  : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={item.pinned ? 'Unpin' : 'Pin to top'}
            >
              {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              onClick={() => startEditing(item.domainId, item.note.id, item.note.title, item.note.content)}
              className={`p-1.5 rounded transition-colors ${
                isDark ? 'text-gray-500 hover:text-primary-400' : 'text-gray-400 hover:text-primary-600'
              }`}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => deleteNote(item.domainId, item.note.id)}
              className={`p-1.5 rounded transition-colors ${
                isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-600'
              }`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.map((tagId: string) => {
              const tag = allTags.find(t => t.id === tagId);
              return tag ? (
                <span key={tagId} className={`px-2 py-0.5 text-xs rounded-full ${tag.color} text-white`}>
                  {tag.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* Content Preview */}
        <p className={`text-sm whitespace-pre-wrap ${subtextClass} ${
          viewMode === 'grid' ? 'line-clamp-4 flex-1' : ''
        }`}>
          {item.parsedContent}
        </p>

        {/* Footer */}
        <div className={`flex items-center justify-between mt-3 pt-2 border-t ${borderClass}`}>
          <span className={`text-xs px-2 py-0.5 rounded ${
            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
          }`}>
            Domain {item.domainId}
          </span>
          <span className={`text-xs ${subtextClass}`}>
            {new Date(item.note.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textClass}`}>Study Notes</h1>
          <p className={subtextClass}>
            {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} 
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setIsEditing(null);
            resetForm();
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Note
        </button>
      </div>

      {/* Toolbar */}
      <div className={`rounded-xl border ${borderClass} ${bgClass} p-4`}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtextClass}`} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Domain Filter */}
            <select
              value={selectedDomain}
              onChange={e => setSelectedDomain(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
            >
              <option value="all">All Domains</option>
              {state.domains.map(d => (
                <option key={d.id} value={d.id}>Domain {d.id}: {d.name}</option>
              ))}
            </select>

            {/* Tag Filter */}
            <select
              value={filterTag || ''}
              onChange={e => setFilterTag(e.target.value || null)}
              className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className={`px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="updated">Recently Updated</option>
              <option value="title-az">Title A-Z</option>
              <option value="title-za">Title Z-A</option>
            </select>

            {/* View Toggle */}
            <div className={`flex rounded-lg border overflow-hidden ${borderClass}`}>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : isDark ? 'bg-gray-700 text-gray-400 hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid size={18} />
              </button>
            </div>

            {/* Pinned Only Toggle */}
            <button
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              className={`p-2 rounded-lg border transition-colors ${
                showPinnedOnly
                  ? 'bg-primary-600 text-white border-primary-600'
                  : `${borderClass} ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-white text-gray-500'}`
              }`}
              title="Show pinned only"
            >
              <Pin size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <div className={`rounded-xl border-2 border-primary-500 ${bgClass} p-6`}>
          <h3 className={`font-semibold mb-4 ${textClass}`}>New Note</h3>
          
          {selectedDomain === 'all' && (
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${subtextClass}`}>Domain</label>
              <select
                value={1}
                onChange={e => setSelectedDomain(parseInt(e.target.value))}
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
              >
                {state.domains.map(d => (
                  <option key={d.id} value={d.id}>Domain {d.id}: {d.name}</option>
                ))}
              </select>
            </div>
          )}
          
          <input
            type="text"
            placeholder="Note title..."
            value={noteTitle}
            onChange={e => setNoteTitle(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg mb-3 border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
          />
          <textarea
            placeholder="Note content... (Markdown supported)"
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            rows={6}
            className={`w-full px-3 py-2 rounded-lg mb-3 border focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm ${inputBgClass}`}
          />
          
          {/* Tags Selection */}
          <div className="mb-4">
            <p className={`text-sm font-medium mb-2 ${subtextClass}`}>Tags:</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    noteTags.includes(tag.id)
                      ? `${tag.color} text-white`
                      : isDark ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
              <button
                onClick={() => setShowTagManager(!showTagManager)}
                className={`px-3 py-1 text-sm rounded-full border-2 border-dashed ${
                  isDark ? 'border-gray-600 text-gray-400 hover:border-gray-500' : 'border-gray-300 text-gray-500 hover:border-gray-400'
                }`}
              >
                + Custom Tag
              </button>
            </div>
          </div>

          {/* Custom Tag Creator */}
          {showTagManager && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tag name..."
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  className={`flex-1 px-3 py-1 rounded text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
                />
                <select
                  value={newTagColor}
                  onChange={e => setNewTagColor(e.target.value)}
                  className={`px-3 py-1 rounded text-sm border focus:outline-none focus:ring-2 focus:ring-primary-500 ${inputBgClass}`}
                >
                  <option value="bg-gray-500">Gray</option>
                  <option value="bg-red-500">Red</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-yellow-500">Yellow</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-pink-500">Pink</option>
                </select>
                <button
                  onClick={addCustomTag}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Pin Toggle */}
          <label className={`flex items-center gap-2 mb-4 cursor-pointer ${subtextClass}`}>
            <input
              type="checkbox"
              checked={isPinned}
              onChange={e => setIsPinned(e.target.checked)}
              className="rounded"
            />
            <Pin size={14} />
            Pin to top
          </label>

          <div className="flex gap-2">
            <button
              onClick={handleAddNote}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save Note
            </button>
            <button
              onClick={resetForm}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isDark ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notes Display */}
      {filteredNotes.length === 0 ? (
        <div className={`text-center py-16 rounded-xl border ${borderClass} ${bgClass}`}>
          <div className={`text-5xl mb-4`}>📝</div>
          <p className={subtextClass}>
            {searchQuery || filterTag 
              ? 'No notes match your filters' 
              : 'No notes yet. Click "Add Note" to create one.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(renderNoteCard)}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map(renderNoteCard)}
        </div>
      )}
    </div>
  );
}
