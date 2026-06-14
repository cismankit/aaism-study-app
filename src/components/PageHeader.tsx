import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  action?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'text-emerald-500',
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-cockpit">
          {Icon && <Icon className={`w-7 h-7 flex-shrink-0 ${iconClassName}`} />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-theme-muted mt-1 text-sm max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
