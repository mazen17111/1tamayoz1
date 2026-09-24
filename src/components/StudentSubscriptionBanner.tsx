import React from 'react';
import { Calendar, Clock, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { StudentUser, PlatformAccessConfig } from '../types';

interface StudentSubscriptionBannerProps {
  currentUser: StudentUser;
  accessConfig?: PlatformAccessConfig;
}

export const StudentSubscriptionBanner: React.FC<StudentSubscriptionBannerProps> = ({
  currentUser,
  accessConfig,
}) => {
  // If no subscription end date or days configured yet, do not show
  if (!currentUser.subscriptionEndDate && !currentUser.subscriptionDays) {
    return null;
  }

  const now = Date.now();
  const endDate = currentUser.subscriptionEndDate ? new Date(currentUser.subscriptionEndDate).getTime() : now;
  const startDate = currentUser.subscriptionStartDate ? new Date(currentUser.subscriptionStartDate).getTime() : (endDate - (currentUser.subscriptionDays || 30) * 86400000);
  
  const totalDays = Math.max(1, currentUser.subscriptionDays || Math.round((endDate - startDate) / 86400000) || 30);
  const diffMs = endDate - now;
  const remainingDays = Math.max(0, Math.ceil(diffMs / 86400000));
  const elapsedDays = Math.max(0, Math.min(totalDays, totalDays - remainingDays));
  
  // Progress increases day by day until it completes (100%)
  const progressPercent = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  const isExpiringSoon = remainingDays > 0 && remainingDays <= 5;
  const isLastDay = remainingDays === 1;

  // Clean WhatsApp for renewal
  const rawWhatsapp = accessConfig?.whatsappNumber?.trim() || '';
  const cleanPhone = rawWhatsapp.replace(/[^0-9]/g, '');
  const renewMsg = encodeURIComponent(
    `السلام عليكم يا أستاذ، أريد تجديد وتمديد اشتراكي في منصة التميز التعليمية.\n(الاسم: ${currentUser.name} - الإيميل: ${currentUser.email})`
  );
  const whatsappRenewUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${renewMsg}`
    : `https://wa.me/?text=${renewMsg}`;

  const formattedEndDate = new Date(endDate).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="w-full mb-5">
      <div 
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5 shadow-xs ${
          isExpiringSoon
            ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-amber-300/60'
            : 'bg-gradient-to-r from-emerald-600/10 via-teal-500/5 to-indigo-600/10 border-emerald-500/30'
        }`}
      >
        {/* Top Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div 
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isExpiringSoon 
                  ? 'bg-amber-500 text-white shadow-amber-500/20' 
                  : 'bg-emerald-700 text-white shadow-emerald-700/20'
              }`}
            >
              {isExpiringSoon ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  حالة اشتراكك في المنصة
                </span>
                <span 
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isExpiringSoon 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {isLastDay 
                    ? '⚠️ آخر يوم في الاشتراك!' 
                    : isExpiringSoon 
                    ? `⚠️ يقترب من الانتهاء (${remainingDays} أيام)` 
                    : 'اشتراك نشط ومفعل'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>تاريخ الانتهاء: <strong className="text-slate-700">{formattedEndDate}</strong></span>
                </span>
                <span>•</span>
                <span className="text-slate-400">يتجدد الحساب يومياً</span>
              </div>
            </div>
          </div>

          {/* Right Highlights: Remaining Days Counter */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-slate-400 block font-medium">الأيام المتبقية لحسابك</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl sm:text-3xl font-black ${isExpiringSoon ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {remainingDays}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {remainingDays === 1 ? 'يوم متبقي' : remainingDays === 2 ? 'يومان متبقيان' : remainingDays <= 10 ? 'أيام متبقية' : 'يوماً متبقياً'}
                </span>
              </div>
            </div>

            {/* Quick Renewal Link if close to expiration */}
            {cleanPhone && isExpiringSoon && (
              <a
                href={whatsappRenewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>تجديد الاشتراك</span>
              </a>
            )}
          </div>
        </div>

        {/* Daily Progression Bar - increases day by day until 100% */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>استهلاك مدة الاشتراك ({elapsedDays} من إجمالي {totalDays} يوماً)</span>
            <span className={isExpiringSoon ? 'text-amber-700' : 'text-emerald-700'}>
              {Math.round(progressPercent)}% مكتمل
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isExpiringSoon 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500'
              }`}
              style={{ width: `${Math.max(2, progressPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>بداية الاشتراك (اليوم 1)</span>
            <span>نهاية الاشتراك ({totalDays} يوماً)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
