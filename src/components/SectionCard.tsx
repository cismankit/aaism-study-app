import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export default function SectionCard({
  title,
  icon: Icon,
  iconClassName = 'text-emerald-500',
  action,
  children,
  className = '',
  compact = false,
}: SectionCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 osint-widget ${compact ? 'p-4' : 'p-4'} ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          {Icon && <Icon className={`w-4 h-4 ${iconClassName}`} />}
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}
