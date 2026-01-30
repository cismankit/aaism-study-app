import { useGamification } from '../context/GamificationContext';
import { X, Zap } from 'lucide-react';

export default function AchievementToast() {
  const { notifications, dismissNotification } = useGamification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {notifications.slice(-3).map(notification => (
        <div
          key={notification.id}
          className={`
            animate-slide-in-right
            flex items-center gap-4 p-4 rounded-xl shadow-lg border
            ${notification.type === 'level_up' 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-yellow-400' 
              : notification.type === 'badge'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-purple-400'
                : notification.type === 'streak'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400'
                  : 'bg-white text-gray-900 border-gray-200'
            }
          `}
        >
          <div className="text-3xl">{notification.icon}</div>
          
          <div className="flex-1">
            <div className="font-bold">{notification.title}</div>
            <div className={`text-sm ${
              notification.type === 'xp_gain' ? 'text-gray-600' : 'opacity-90'
            }`}>
              {notification.description}
            </div>
          </div>

          {notification.xpAmount && notification.type !== 'xp_gain' && (
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <Zap size={14} />
              <span className="font-bold">+{notification.xpAmount} XP</span>
            </div>
          )}

          <button
            onClick={() => dismissNotification(notification.id)}
            className="p-1 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
