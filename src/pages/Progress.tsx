import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Check, Circle, ChevronDown, ChevronUp } from 'lucide-react';

export default function Progress() {
  const { state, updateChapterProgress } = useApp();
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  const calculateResourceProgress = (resourceId: string) => {
    const resource = state.resources.find(r => r.id === resourceId);
    if (!resource) return 0;
    
    const totalItems = resource.chapters.length * resource.totalPasses;
    const completedItems = resource.chapters.reduce(
      (sum, ch) => sum + ch.completed.filter(Boolean).length,
      0
    );
    return Math.round((completedItems / totalItems) * 100);
  };

  const toggleExpand = (resourceId: string) => {
    setExpandedResource(prev => prev === resourceId ? null : resourceId);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
        <p className="text-gray-600 mt-2">Track your progress across all study materials</p>
      </div>

      <div className="space-y-4">
        {state.resources.map(resource => {
          const progress = calculateResourceProgress(resource.id);
          const isExpanded = expandedResource === resource.id;

          return (
            <div key={resource.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Resource Header */}
              <button
                onClick={() => toggleExpand(resource.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                      {resource.totalPasses} {resource.totalPasses === 1 ? 'pass' : 'passes'}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
                <div className="ml-4 text-gray-400">
                  {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t p-6 bg-gray-50">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-600">
                          <th className="pb-3 font-medium">Chapter/Section</th>
                          {Array.from({ length: resource.totalPasses }, (_, i) => (
                            <th key={i} className="pb-3 font-medium text-center">
                              Pass {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resource.chapters.map(chapter => (
                          <tr key={chapter.id} className="border-t border-gray-200">
                            <td className="py-3 text-sm font-medium text-gray-900">
                              {chapter.name}
                            </td>
                            {chapter.completed.map((isCompleted, passIndex) => (
                              <td key={passIndex} className="py-3 text-center">
                                <button
                                  onClick={() =>
                                    updateChapterProgress(
                                      resource.id,
                                      chapter.id,
                                      passIndex,
                                      !isCompleted
                                    )
                                  }
                                  className={`p-2 rounded-lg transition-colors ${
                                    isCompleted
                                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  {isCompleted ? <Check size={20} /> : <Circle size={20} />}
                                </button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
