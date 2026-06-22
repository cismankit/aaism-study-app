import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Lock, Target, Settings } from 'lucide-react';
import { getFeatureIdForRoute, getUnlockProgress, isRouteGated } from '../services/productTierService';

export default function FeatureGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (!isRouteGated(location.pathname)) {
    return <>{children}</>;
  }

  const featureId = getFeatureIdForRoute(location.pathname);
  const progress = getUnlockProgress();
  const label = featureId?.replace(/-/g, ' ') ?? 'This tool';

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
      <div className="w-12 h-12 rounded-xl bg-cockpit-track flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6 text-theme-muted" />
      </div>
      <h2 className="text-lg font-bold text-cockpit">Explorer tier — unlocks with momentum</h2>
      <p className="text-sm text-cockpit-muted">
        <span className="capitalize">{label}</span> is part of the Explorer catalog. It unlocks after{' '}
        <strong>{progress.missionsNeeded} missions</strong> or{' '}
        <strong>{progress.daysNeeded} days</strong> — focus on your daily mission first.
      </p>
      <p className="text-xs text-theme-faint">
        {progress.missions}/{progress.missionsNeeded} missions · day {progress.days + 1}/{progress.daysNeeded}
      </p>
      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium"
        >
          <Target className="w-4 h-4" /> Today&apos;s mission
        </Link>
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-theme text-sm"
        >
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>
    </div>
  );
}
