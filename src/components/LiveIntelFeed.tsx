import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Flame, AlertTriangle, TrendingUp, Radar, Bot,
  ChevronRight, Zap, Shield, Target,
} from 'lucide-react';
import { TOPIC_HEAT_MAP, TRAP_PATTERNS, COMMUNITY_INSIGHTS } from '../data/communityIntelligence';
import { getPipelineStats } from '../services/agentService';
import { loadInsights, type IntelligenceInsight } from '../services/intelligenceAgent';

interface FeedItem {
  id: string;
  type: 'hot_topic' | 'trap_alert' | 'agent_update' | 'insight' | 'community';
  icon: typeof Activity;
  iconColor: string;
  title: string;
  description: string;
  timestamp: string;
  link?: string;
  priority: 'high' | 'medium' | 'low';
}

export default function LiveIntelFeed() {
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const items: FeedItem[] = [];

    const risingTopics = TOPIC_HEAT_MAP.filter(t => t.trend === 'rising' && t.heat >= 85);
    risingTopics.forEach(topic => {
      items.push({
        id: `hot-${topic.topic}`,
        type: 'hot_topic',
        icon: Flame,
        iconColor: 'text-orange-500',
        title: topic.topic,
        description: `Heat ${topic.heat}/100 — ${topic.communityNotes.slice(0, 80)}...`,
        timestamp: 'Trending',
        link: '/intel',
        priority: topic.heat >= 90 ? 'high' : 'medium',
      });
    });

    const topTraps = TRAP_PATTERNS.filter(t => t.frequency === 'very_common').slice(0, 3);
    topTraps.forEach(trap => {
      items.push({
        id: `trap-${trap.id}`,
        type: 'trap_alert',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        title: trap.name,
        description: trap.description.slice(0, 80) + '...',
        timestamp: 'Active',
        link: '/intel',
        priority: 'high',
      });
    });

    const stats = getPipelineStats();
    if (stats.totalLeads > 0) {
      items.push({
        id: 'agent-leads',
        type: 'agent_update',
        icon: Bot,
        iconColor: 'text-cyan-500',
        title: `${stats.pendingCount} leads pending review`,
        description: `${stats.approvedCount} approved, ${stats.totalQuestions} total questions in bank`,
        timestamp: stats.lastRunAt ? timeAgo(stats.lastRunAt) : 'Never',
        link: '/agent',
        priority: stats.pendingCount > 5 ? 'high' : 'medium',
      });
    }

    const savedInsights = loadInsights().slice(0, 3);
    savedInsights.forEach((insight: IntelligenceInsight) => {
      items.push({
        id: insight.id,
        type: 'insight',
        icon: Radar,
        iconColor: 'text-purple-500',
        title: insight.title,
        description: insight.content.slice(0, 80) + '...',
        timestamp: timeAgo(insight.createdAt),
        link: '/intel',
        priority: 'low',
      });
    });

    const topInsights = COMMUNITY_INSIGHTS.filter(i => i.upvotes >= 200).slice(0, 3);
    topInsights.forEach(ci => {
      items.push({
        id: ci.id,
        type: 'community',
        icon: ci.category === 'trap_alert' ? Shield : ci.category === 'topic_trend' ? TrendingUp : Target,
        iconColor: ci.category === 'trap_alert' ? 'text-red-400' : ci.category === 'topic_trend' ? 'text-green-400' : 'text-blue-400',
        title: ci.title,
        description: ci.content.slice(0, 80) + '...',
        timestamp: `${ci.upvotes} upvotes`,
        link: '/intel',
        priority: ci.upvotes >= 300 ? 'high' : 'medium',
      });
    });

    items.sort((a, b) => {
      const prio = { high: 0, medium: 1, low: 2 };
      return prio[a.priority] - prio[b.priority];
    });

    setFeedItems(items);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold">Live Intel Feed</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-[10px] text-emerald-500">LIVE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {feedItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.link && navigate(item.link)}
              className="w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${item.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold truncate">{item.title}</span>
                    {item.priority === 'high' && (
                      <Zap className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{item.timestamp}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 mt-1 flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
