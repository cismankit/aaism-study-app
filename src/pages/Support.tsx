import { Link } from 'react-router-dom';
import {
  LifeBuoy, Bug, Github, BookOpen,
  ExternalLink, ChevronRight, AlertCircle, Sparkles,
} from 'lucide-react';
import { GITHUB_ISSUES_URL, GITHUB_NEW_ISSUE_URL, GITHUB_REPO } from '../data/donations';
import PageHeader from '../components/PageHeader';

interface SupportChannel {
  icon: typeof Github;
  title: string;
  description: string;
  action: string;
  href: string;
  external?: boolean;
}

const channels: SupportChannel[] = [
  {
    icon: Bug,
    title: 'Report a Bug',
    description: 'Include steps to reproduce, browser/OS, and screenshots if possible.',
    action: 'Open bug report',
    href: `${GITHUB_NEW_ISSUE_URL}?labels=bug&title=${encodeURIComponent('[Bug] ')}`,
    external: true,
  },
  {
    icon: Sparkles,
    title: 'Request a Feature',
    description: 'In-app form with tiered support — track delivery on My Updates.',
    action: 'Feature request form',
    href: '/feature-request',
    external: false,
  },
  {
    icon: Github,
    title: 'GitHub Issues & Community',
    description: 'Browse reports, workarounds, and study tips with other candidates.',
    action: 'View on GitHub',
    href: GITHUB_ISSUES_URL,
    external: true,
  },
];

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        icon={LifeBuoy}
        iconClassName="text-cyan-500"
        title="Support"
        subtitle="Report issues or request features — FAQs and exam prep live in Help Center."
      />

      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-emerald-700 dark:text-emerald-300">Community-supported project</p>
          <p className="text-theme-faint mt-1">
            GitHub Issues on{' '}
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {GITHUB_REPO}
            </a>{' '}
            is the fastest path to a response.
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {channels.map(channel => {
          const Icon = channel.icon;
          const inner = (
            <div className="flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-cockpit-track flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-cyan-500" />
              </div>
              <h3 className="font-semibold text-sm">{channel.title}</h3>
              <p className="text-sm text-theme-faint mt-1 flex-1">{channel.description}</p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {channel.action}
                {channel.external ? (
                  <ExternalLink className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
          );

          if (channel.external) {
            return (
              <a
                key={channel.title}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 rounded-xl bg-theme-elevated border border-theme hover:border-cyan-400 dark:hover:border-cyan-500 transition-all osint-widget"
              >
                {inner}
              </a>
            );
          }

          return (
            <Link
              key={channel.title}
              to={channel.href}
              className="block p-5 rounded-xl bg-theme-elevated border border-theme hover:border-cyan-400 dark:hover:border-cyan-500 transition-all osint-widget"
            >
              {inner}
            </Link>
          );
        })}
      </section>

      <section className="bg-theme-elevated rounded-xl border border-theme p-5 osint-widget">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Help Center</h3>
              <p className="text-sm text-theme-faint mt-1">
                Getting started, FAQs, AI setup, and exam day checklist.
              </p>
            </div>
          </div>
          <Link
            to="/help"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors flex-shrink-0"
          >
            Open Help Center
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
