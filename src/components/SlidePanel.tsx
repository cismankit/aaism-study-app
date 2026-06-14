import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const widthMap = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function SlidePanel({ open, onClose, title, subtitle, width = 'lg', children }: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`absolute right-0 top-0 h-full ${widthMap[width]} w-full bg-theme-elevated shadow-2xl border-l border-theme flex flex-col animate-slide-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">{title}</h2>
            {subtitle && <p className="text-sm text-theme-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
