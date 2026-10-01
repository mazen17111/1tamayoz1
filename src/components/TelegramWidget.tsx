import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Users, 
  RotateCcw, 
  Check, 
  MessageCircle, 
  ChevronUp 
} from 'lucide-react';
import { TelegramWidgetConfig, TelegramGroupItem } from '../types';

interface TelegramWidgetProps {
  widgetConfig?: TelegramWidgetConfig;
}

// Crisp official Telegram Paper Plane SVG icon
export function TelegramPlaneIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
    </svg>
  );
}

export const TelegramWidget: React.FC<TelegramWidgetProps> = ({ widgetConfig: initialConfig }) => {
  // Live configuration state synced with props and real-time events
  const [config, setConfig] = useState<TelegramWidgetConfig | undefined>(() => {
    if (initialConfig && initialConfig.isEnabled !== undefined) return initialConfig;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tamayuz_telegram_widget');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return initialConfig;
  });

  // Keep synced if prop updates
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Real-time listener for instant appearance when admin clicks Save
  useEffect(() => {
    const handleWidgetUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener('tamayuz_telegram_widget_updated', handleWidgetUpdate);
    return () => window.removeEventListener('tamayuz_telegram_widget_updated', handleWidgetUpdate);
  }, []);

  // If the feature is disabled by admin, do not render anything
  if (!config || !config.isEnabled) {
    return null;
  }

  const allGroups = config.groups || [];

  // Session-only dismissed groups: when student leaves the platform and enters again,
  // sessionStorage is cleared and all groups reappear automatically!
  const [dismissedGroupIds, setDismissedGroupIds] = useState<string[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('tamayuz_dismissed_tg_groups');
        return stored ? JSON.parse(stored) : [];
      }
    } catch {}
    return [];
  });

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Handle student dismissing an individual group for the current session
  const handleDismissGroup = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    const updated = [...dismissedGroupIds, groupId];
    setDismissedGroupIds(updated);
    try {
      sessionStorage.setItem('tamayuz_dismissed_tg_groups', JSON.stringify(updated));
    } catch {}
  };

  // Restore all dismissed groups for the current session
  const handleRestoreAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedGroupIds([]);
    try {
      sessionStorage.removeItem('tamayuz_dismissed_tg_groups');
    } catch {}
  };

  // Filter groups visible in the current session
  const activeGroups = allGroups.filter((g) => !dismissedGroupIds.includes(g.id));

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-5 left-5 sm:bottom-7 sm:left-7 z-50 select-none font-sans"
      dir="rtl"
    >
      {/* 1. Small Popover Card ("المستطيل الصغير") */}
      {isOpen && (
        <div 
          className="absolute bottom-16 left-0 w-[320px] sm:w-[360px] bg-slate-900/95 dark:bg-slate-900/95 border border-sky-500/40 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(34,158,217,0.25)] backdrop-blur-2xl p-4 sm:p-5 text-right space-y-3.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#229ED9]/20 border border-[#229ED9]/40 flex items-center justify-center text-[#229ED9] shadow-xs">
                <TelegramPlaneIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>{config.title || 'قنوات ومجموعات تليجرام'}</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  مجموعات التدريب والمناقشات الرسمية
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          {config.description && (
            <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              {config.description}
            </p>
          )}

          {/* Groups List */}
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-0.5">
            {allGroups.length === 0 ? (
              <div className="py-6 px-3 text-center space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                <div className="w-10 h-10 rounded-full bg-sky-500/20 mx-auto flex items-center justify-center text-sky-400">
                  <TelegramPlaneIcon className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-200 font-bold">
                  مجموعات وقنوات تليجرام
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  سيتم إدراج روابط الجروبات الرسمية والتدريبات قريباً من قبل إدارة المنصة.
                </p>
              </div>
            ) : activeGroups.length === 0 ? (
              <div className="py-6 px-3 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/60">
                <div className="w-10 h-10 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-300 font-semibold">
                  تم إخفاء المجموعات لهذه الجلسة
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  ستظهر جميع المجموعات مجدداً تلقائياً عند خروجك ودخولك القادم للمنصة.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold transition-colors cursor-pointer border border-sky-500/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إظهار المجموعات الآن</span>
                </button>
              </div>
            ) : (
              activeGroups.map((group) => {
                // Ensure link is formatted with https://
                const href = group.link.startsWith('http://') || group.link.startsWith('https://')
                  ? group.link
                  : `https://${group.link.replace(/^@/, 't.me/')}`;

                return (
                  <div
                    key={group.id}
                    className="group/item relative bg-slate-950/70 hover:bg-slate-950/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-3 transition-all flex items-center justify-between gap-2.5 shadow-sm"
                  >
                    {/* Icon & Title */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {group.iconUrl ? (
                        <img 
                          src={group.iconUrl} 
                          alt={group.title} 
                          className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700 shadow-xs"
                          onError={(e) => {
                            // Fallback to Telegram icon if image fails
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0088cc] to-[#24A1DE] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <TelegramPlaneIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate group-hover/item:text-sky-300 transition-colors">
                          {group.title}
                        </h4>
                        {group.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Join & Dismiss */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0088cc] to-[#24A1DE] hover:from-[#0077b3] hover:to-[#1e8ec3] text-white text-xs font-black shadow-md shadow-[#0088cc]/20 transition-all flex items-center gap-1 cursor-pointer"
                        title="انضمام للمجموعة"
                      >
                        <span>انضمام</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => handleDismissGroup(e, group.id)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer"
                        title="إخفاء هذه المجموعة لهذه الجلسة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-sky-400 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>مجموعات رسمية معتمدة</span>
            </span>
            {dismissedGroupIds.length > 0 && activeGroups.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreAll}
                className="text-slate-400 hover:text-sky-300 underline cursor-pointer"
              >
                استعادة المخفية ({dismissedGroupIds.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Floating Circular Telegram Button ("دائرة خانة تليجرام") */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="قنوات ومجموعات تليجرام"
        className="relative group w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-tr from-[#0088cc] via-[#229ED9] to-[#2cb5f6] text-white shadow-[0_10px_25px_-5px_rgba(34,158,217,0.5),0_0_15px_rgba(34,158,217,0.3)] hover:shadow-[0_12px_30px_-5px_rgba(34,158,217,0.7),0_0_25px_rgba(34,158,217,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 border-white/20 animate-float-subtle"
      >
        {/* Soft Animated Radar Wave */}
        <span className="absolute -inset-1 rounded-full bg-[#229ED9]/30 animate-ping pointer-events-none opacity-75" />

        {/* Telegram Plane Icon */}
        <div className="relative z-10 transition-transform duration-300 group-hover:rotate-12">
          <TelegramPlaneIcon className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-md" />
        </div>

        {/* Counter Badge if there are active groups */}
        {activeGroups.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-slate-900">
            {activeGroups.length}
          </span>
        )}

        {/* Tooltip on Hover */}
        <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900/95 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-sky-500/30 hidden sm:block">
          {config.buttonLabel || 'مجموعات تليجرام 📢'}
        </div>
      </button>
    </div>
  );
};
