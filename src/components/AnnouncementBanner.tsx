import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
} from 'lucide-react';
import { PlatformAnnouncement } from '../types';

interface AnnouncementBannerProps {
  announcement?: PlatformAnnouncement;
  onDismissPermanent?: () => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement,
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Sync dismissed state with localStorage whenever the announcement changes
  useEffect(() => {
    try {
      const bannerKey = announcement?.updatedAt || announcement?.message || (announcement as any)?.text || 'general';
      const isSavedDismissed = localStorage.getItem('tamayuz_dismissed_announcement_' + bannerKey);
      if (isSavedDismissed === 'true') {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, [announcement?.message, (announcement as any)?.text, announcement?.isEnabled, announcement?.updatedAt]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      const bannerKey = announcement?.updatedAt || announcement?.message || (announcement as any)?.text || 'general';
      localStorage.setItem('tamayuz_dismissed_announcement_' + bannerKey, 'true');
    } catch {}
  };

  const message = (announcement?.message || (announcement as any)?.text || '').trim();

  if (!announcement?.isEnabled || !message || dismissed) {
    return null;
  }

  const type = announcement.type || 'info';

  const typeStyles = {
    info: {
      bg: 'bg-blue-600 text-white',
      border: 'border-blue-400/40',
      badge: 'bg-white/20 text-white',
      badgeText: 'تنويه',
      icon: Info,
    },
    warning: {
      bg: 'bg-amber-600 text-white',
      border: 'border-amber-400/40',
      badge: 'bg-black/20 text-white',
      badgeText: 'تنبيه مهم',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-emerald-600 text-white',
      border: 'border-emerald-400/40',
      badge: 'bg-white/20 text-white',
      badgeText: 'خبر سار',
      icon: CheckCircle2,
    },
    urgent: {
      bg: 'bg-rose-600 text-white',
      border: 'border-rose-400/40',
      badge: 'bg-white/25 text-white animate-pulse',
      badgeText: 'عاجل وهام',
      icon: Bell,
    },
  }[type] || {
    bg: 'bg-blue-600 text-white',
    border: 'border-blue-400/40',
    badge: 'bg-white/20 text-white',
    badgeText: 'تنويه',
    icon: Info,
  };

  const IconComponent = typeStyles.icon;

  return (
    <div 
      id="platform-announcement-banner"
      role="alert"
      className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 pb-1 transition-all"
    >
      <div className={`w-full py-2.5 sm:py-3 px-4 sm:px-5 rounded-2xl ${typeStyles.bg} shadow-md border ${typeStyles.border} transition-all duration-300 relative flex items-center justify-between gap-3 text-xs sm:text-sm font-medium`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-black tracking-wide shrink-0 flex items-center gap-1.5 shadow-xs ${typeStyles.badge}`}>
            <IconComponent className="w-3.5 h-3.5" />
            <span>{typeStyles.badgeText}</span>
          </span>
          <p className="leading-relaxed font-bold break-words flex-1 text-white text-xs sm:text-sm">
            {message}
          </p>
        </div>

        {announcement.isDismissible && (
          <button
            id="dismiss-announcement-btn"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            title="إخفاء التنبيه"
            aria-label="إغلاق التنبيه"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
