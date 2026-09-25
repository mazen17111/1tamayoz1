import React, { useState, useEffect } from 'react';
import { StudentUser, PlatformAccessConfig } from '../types';
import { Clock, Hourglass, Calendar, AlertTriangle, MessageCircle } from 'lucide-react';

interface StudentSubscriptionBannerProps {
  currentUser: StudentUser;
  accessConfig?: PlatformAccessConfig;
}

export const StudentSubscriptionBanner: React.FC<StudentSubscriptionBannerProps> = ({
  currentUser,
  accessConfig,
}) => {
  // If user is admin or has no active subscription set, don't show
  if (!currentUser || currentUser.role === 'admin' || !currentUser.subscriptionExpiresAt) {
    return null;
  }

  // Force re-render periodically to update days remaining daily
  const [, setTick] = useState(0);

  useEffect(() => {
    // Check every 60 seconds to keep countdown fresh
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const now = Date.now();
  const expiresTime = new Date(currentUser.subscriptionExpiresAt).getTime();
  
  // If already expired, platform lock screen will handle it
  if (expiresTime <= now) {
    return null;
  }

  const totalDays = currentUser.subscriptionDays || 30;
  const startedTime = currentUser.subscriptionStartedAt
    ? new Date(currentUser.subscriptionStartedAt).getTime()
    : expiresTime - totalDays * 24 * 60 * 60 * 1000;

  const totalMs = Math.max(1000, expiresTime - startedTime);
  const elapsedMs = Math.max(0, now - startedTime);
  const remainingMs = Math.max(0, expiresTime - now);

  // Exact remaining calendar days (at least 1 day while expiresTime > now)
  const remainingDays = Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  // Progress percentage advances towards 100% as end of time approaches
  // (شريط يتقدم كلما اقترب نهاية الوقت)
  const rawProgress = (elapsedMs / totalMs) * 100;
  const progressPercent = Math.min(100, Math.max(1, Math.round(rawProgress)));

  // Formatted expiration date in Arabic
  const formattedExpiry = new Date(expiresTime).toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // State styling based on remaining urgency
  const isUrgent = remainingDays <= 3;
  const isWarning = remainingDays > 3 && remainingDays <= 7;

  // Contact support URL if available
  const whatsappNumber = accessConfig?.whatsappNumber || '966500000000';
  const whatsappMsg = encodeURIComponent(
    `السلام عليكم، أنا الطالب ${currentUser.name} (${currentUser.email})، أود تجديد وتمديد اشتراكي في منصة التميز التعليمية.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-3 pb-1">
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-md ${
          isUrgent
            ? 'bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-rose-500/50 text-white ring-2 ring-rose-500/30'
            : isWarning
            ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-amber-500/50 text-white ring-1 ring-amber-500/30'
            : 'bg-gradient-to-r from-blue-950/90 via-slate-900 to-slate-950 border-blue-500/40 text-white'
        }`}
      >
        {/* Ambient Top Glow Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            isUrgent
              ? 'from-rose-500 via-red-400 to-rose-600'
              : isWarning
              ? 'from-amber-400 via-orange-400 to-amber-500'
              : 'from-blue-500 via-indigo-400 to-cyan-400'
          }`}
        />

        <div className="p-3.5 sm:p-4 sm:px-5">
          {/* Main Top Header: Days Remaining Text */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                  isUrgent
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}
              >
                {isUrgent ? (
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Hourglass className="w-5 h-5 sm:w-6 sm:h-6 animate-spin [animation-duration:12s]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    {remainingDays === 1 ? (
                      <span className="text-rose-300 font-extrabold flex items-center gap-1">
                        ⚠️ اليوم الأخير! باقي أقل من 24 ساعة على نهاية الوقت المحدد للاشتراك
                      </span>
                    ) : remainingDays === 2 ? (
                      <span>
                        ⏳ باقي <strong className="text-amber-300 font-black text-lg">يومان</strong> على نهاية الوقت المحدد للاشتراك
                      </span>
                    ) : (
                      <span>
                        ⏳ باقي <strong className={`font-black text-lg ${isUrgent ? 'text-rose-300' : isWarning ? 'text-amber-300' : 'text-blue-300'}`}>{remainingDays}</strong> {remainingDays <= 10 ? 'أيام' : 'يوماً'} على نهاية الوقت المحدد للاشتراك
                      </span>
                    )}
                  </span>

                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border ${
                      isUrgent
                        ? 'bg-rose-500/30 text-rose-200 border-rose-400/50'
                        : isWarning
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                        : 'bg-blue-500/30 text-blue-200 border-blue-400/50'
                    }`}
                  >
                    يتحدث يومياً تلقائياً
                  </span>
                </div>

                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>تاريخ انتهاء الصلاحية والإغلاق: <strong className="text-white font-medium">{formattedExpiry}</strong></span>
                  <span className="hidden sm:inline text-slate-500">•</span>
                  <span className="hidden sm:inline text-slate-400">المدة المحددة: {totalDays} يوماً</span>
                </p>
              </div>
            </div>

            {/* Quick Supervisor Action */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  isUrgent
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15'
                }`}
                title="تواصل مع المشرف لتجديد أو تمديد اشتراكك"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>تجديد الاشتراك</span>
              </a>
            </div>
          </div>

          {/* Progress Bar Container: يتقدم كلما اقترب نهاية الوقت */}
          <div className="space-y-1.5 mt-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>شريط تقدم الوقت نحو نهاية الاشتراك:</span>
                <span className={`font-black ${isUrgent ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-blue-300'}`}>
                  انقضى {progressPercent}%
                </span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                متبقي {remainingDays} {remainingDays === 1 ? 'يوم' : remainingDays <= 10 ? 'أيام' : 'يوماً'}
              </span>
            </div>

            {/* The Animated Progress Track */}
            <div className="relative w-full h-3 sm:h-3.5 bg-slate-800/90 rounded-full overflow-hidden border border-white/10 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm relative ${
                  isUrgent
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 shadow-rose-500/50'
                    : isWarning
                    ? 'bg-gradient-to-r from-blue-500 via-amber-500 to-orange-500 shadow-amber-500/50'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 shadow-blue-500/50'
                }`}
                style={{ width: `${progressPercent}%` }}
              >
                {/* Visual marker at the leading edge of the progress bar */}
                <span className="absolute top-0 right-0 bottom-0 w-2 bg-white/70 rounded-full blur-[1px] animate-pulse" />
              </div>
            </div>

            {/* Milestone labels */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5 px-0.5">
              <span>بداية الاشتراك (اليوم الأول)</span>
              <span className="hidden sm:inline text-slate-500">
                يتقدم الشريط تلقائياً كل يوم مع اقتراب موعد النهاية
              </span>
              <span>نهاية الاشتراك (الإغلاق)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
