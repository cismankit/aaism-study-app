import { Link } from 'react-router-dom';
import {
  LifeBuoy, Bug, Github, Users, BookOpen,
  ExternalLink, ChevronRight, AlertCircle, Sparkles, Lightbulb,
} from 'lucide-react';
import { GITHUB_ISSUES_URL, GITHUB_NEW_ISSUE_URL, GITHUB_REPO } from '../data/donations';

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
    description: 'Something broken? Include steps to reproduce, browser/OS, and screenshots if possible.',
    action: 'Open bug report',
    href: `${GITHUB_NEW_ISSUE_URL}?labels=bug&title=${encodeURIComponent('[Bug] ')}`,
    external: true,
  },
  {
    icon: Sparkles,
    title: 'Feature Requests',
    description: 'Two-line form, pick a tier, pay from the platform. Shipped over-the-air to My Updates.',
    action: 'Request a feature',
    href: '/feature-request',
    external: false,
  },
  {
    icon: Github,
    title: 'GitHub Issues',
    description: 'Browse existing reports, workarounds, and community discussions on open issues.',
    action: 'View all issues',
    href: GITHUB_ISSUES_URL,
    external: true,
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with other AAISM candidates. Share study tips and content corrections via GitHub.',
    action: 'Join the conversation',
    href: GITHUB_ISSUES_URL,
    external: true,
  },
];

const examTips = [
  'Use domain-filtered quizzes to attack weak areas identified in your Dashboard analytics.',
  'Scenario Lab builds judgment — exam questions often test “what would you do first?” not definitions alone.',
  'Review trap patterns in Intel Hub before exam day; they mirror common wrong-answer bait.',
  'Run timed sessions in Study Ops to build pacing — the clock matters as much as accuracy.',
];

export default function Support() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <LifeBuoy className="w-7 h-7 text-cyan-500" />
          Support
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Get help, report issues, and connect with the AAISM study community
        </p>
      </div>

      {/* Status banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-emerald-700 dark:text-emerald-300">Community-supported project</p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AAISM is maintained by volunteers. GitHub Issues on{' '}
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {GITHUB_REPO}
            </a>{' '}
            is the fastest way to get a response. There is no dedicated support email — use issues for tracking.
          </p>
        </div>
      </div>

      {/* Support channels */}
      <section className="grid gap-4 sm:grid-cols-2">
        {channels.map(channel => {
          const Icon = channel.icon;
          const inner = (
            <>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cyan-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{channel.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{channel.description}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {channel.action}
                    {channel.external ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>
              </div>
            </>
          );

          if (channel.external) {
            return (
              <a
                key={channel.title}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md transition-all osint-widget"
              >
                {inner}
              </a>
            );
          }

          return (
            <Link
              key={channel.title}
              to={channel.href}
              className="block p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-cyan-400 dark:hover:border-cyan-500 hover:shadow-md transition-all osint-widget"
            >
              {inner}
            </Link>
          );
        })}
      </section>

      {/* Help Center link */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 osint-widget">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">Help Center &amp; Exam Prep Tips</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                FAQs, getting started guide, AI setup, exam day checklist, and feature request form.
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

      {/* Quick exam tips */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Quick Exam Prep Tips</h2>
        </div>
        <ul className="space-y-2">
          {examTips.map(tip => (
            <li
              key={tip}
              className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 osint-widget"
            >
              <span className="text-yellow-500 flex-shrink-0">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* Feature request + donate CTA */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/25">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">☕ Support + Request a Feature</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Fuel the next question. Request what you need in-app, pay by tier, and track when it ships on My Updates.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <Link
            to="/feature-request"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
          >
            Request a feature
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-400/50 text-sm font-medium hover:bg-amber-500/10 transition-colors"
          >
            Donate
          </Link>
        </div>
      </section>
    </div>
  );
}
