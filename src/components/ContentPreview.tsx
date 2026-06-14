import type { ContentFormatId } from '../data/contentTemplates';

interface PreviewProps {
  formatId: ContentFormatId;
  content: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdownBasic(text: string): string {
  return escapeHtml(text)
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-3 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-lg font-bold mt-3 mb-1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1 rounded text-emerald-400 text-xs">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n/g, '<br/>');
}

export default function ContentPreview({ formatId, content }: PreviewProps) {
  const safeContent = content.trim() || 'Preview will appear here after generation…';

  if (formatId === 'linkedin') {
    return (
      <div className="bg-white dark:bg-[#1b1f23] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
            AA
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">AAISM Candidate</div>
            <div className="text-xs text-gray-500">AI Security Manager · Studying for ISACA AAISM</div>
            <div className="text-[10px] text-gray-400">Just now · 🌐</div>
          </div>
        </div>
        <div className="p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
          {safeContent}
        </div>
        <div className="px-4 pb-3 flex gap-4 text-xs text-gray-500">
          <span>👍 Like</span><span>💬 Comment</span><span>↗ Repost</span><span>📤 Send</span>
        </div>
      </div>
    );
  }

  if (formatId === 'youtube-outline' || formatId === 'blog-intro') {
    const lines = safeContent.split('\n');
    const title = lines.find(l => l.startsWith('#'))?.replace(/^#+\s*/, '') ?? lines[0] ?? 'Video Title';
    const body = lines.filter(l => !l.startsWith('#')).join('\n').trim() || safeContent;
    return (
      <div className="bg-[#0f0f0f] rounded-lg border border-gray-700 overflow-hidden">
        <div className="aspect-video bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-2xl ml-1">▶</span>
            </div>
            <span className="text-xs text-gray-500">Thumbnail preview</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-base font-bold text-white mb-2">{title}</h3>
          <div className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {body}
          </div>
        </div>
      </div>
    );
  }

  if (formatId === 'youtube-shorts') {
    return (
      <div className="flex justify-center">
        <div className="w-[220px] h-[390px] bg-black rounded-[2rem] border-4 border-gray-800 overflow-hidden relative shadow-xl">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full" />
          <div className="h-full flex flex-col justify-end p-4 bg-gradient-to-t from-black via-transparent to-transparent">
            <div className="text-white text-xs font-bold mb-2">@aaism_study</div>
            <div className="text-white text-[11px] whitespace-pre-wrap leading-snug max-h-48 overflow-y-auto">
              {safeContent}
            </div>
            <div className="flex justify-end gap-3 mt-3 text-white text-lg">
              <span>❤️</span><span>💬</span><span>↗️</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (formatId === 'twitter-thread') {
    const tweets = safeContent.split(/\n(?=\d+\/\d+)/).filter(Boolean);
    return (
      <div className="space-y-3">
        {(tweets.length > 0 ? tweets : [safeContent]).map((tweet, i) => (
          <div key={i} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">AAISM Study @aaism_ops</div>
                <div className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{tweet.trim()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (formatId === 'github-readme') {
    return (
      <div className="bg-[#0d1117] rounded-lg border border-gray-700 p-4 overflow-y-auto max-h-[480px]">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700">
          <span className="text-gray-400 text-sm">📦</span>
          <span className="text-sm font-semibold text-gray-200">aaism-study-notes</span>
          <span className="text-xs text-gray-500 ml-auto">README.md</span>
        </div>
        <div
          className="text-sm text-gray-300 prose-invert leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdownBasic(safeContent) }}
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
      {safeContent}
    </div>
  );
}
