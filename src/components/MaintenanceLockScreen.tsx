import React, { useState } from 'react';
import { 
  Lock, 
  Wrench, 
  RotateCcw, 
  LogOut, 
  Sparkles, 
  KeyRound,
  CheckCircle2,
  LogIn,
  Send,
  MessageCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { StudentUser, PlatformAccessConfig } from '../types';

interface MaintenanceLockScreenProps {
  accessConfig?: PlatformAccessConfig;
  currentUser: StudentUser | null;
  onRefresh: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenAuth?: (initialMode?: 'login' | 'register') => void;
  isIndividuallyBlocked?: boolean;
  isGuestLocked?: boolean;
  isSubscriptionExpired?: boolean;
  // Backward compatibility alias
  lockMessage?: string;
  onOpenAdminAuth?: () => void;
}

// Crisp official WhatsApp vector icon
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

// Crisp official Telegram vector icon
function TelegramIcon({ className = "w-5 h-5" }: { className?: string }) {
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

export const MaintenanceLockScreen: React.FC<MaintenanceLockScreenProps> = ({
  accessConfig,
  currentUser,
  onRefresh,
  onLogout,
  onOpenAdmin,
  onOpenAuth,
  isIndividuallyBlocked,
  isGuestLocked,
  lockMessage,
  onOpenAdminAuth,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const handleAdmin = onOpenAdmin || onOpenAdminAuth;

  const isSubscriptionMode = accessConfig?.lockReason === 'subscription';

  const defaultLockMessage = isGuestLocked
    ? 'مرحباً بك في منصة التميز التعليمية. جميع الشروحات المرئية، المذكرات، والملفات، والاختبارات التفاعلية محجوبة ومقفلة لغير المسجلين. يرجى تسجيل الدخول إلى حسابك أو إنشاء حساب جديد لفتح كافة أقسام ومصادر المنصة فوراً.'
    : isIndividuallyBlocked
    ? `عزيزي الطالب (${currentUser?.name || currentUser?.email || ''})، تم إيقاف وقفل وصول حسابك إلى المنصة بشكل خاص من قِبل إدارة المنصة. يرجى التواصل مع المشرف للاستفسار وتفعيل حسابك.`
    : isSubscriptionMode
    ? (accessConfig?.subscriptionMessage || 'انتهى اشتراكك أو تواصل مع المشرف لتفعيل الاشتراك أو اشترك الآن للوصول لكافة المحتويات.')
    : (accessConfig?.lockMessage || lockMessage || 'المنصة مغلقة مؤقتاً لأعمال الصيانة والتطوير. سيتم إعادة فتحها قريباً.');

  const handleCheckAgain = async () => {
    setIsChecking(true);
    await onRefresh();
    setTimeout(() => setIsChecking(false), 600);
  };

  // Build clean WhatsApp link
  const rawWhatsapp = accessConfig?.whatsappNumber?.trim() || '';
  const cleanPhone = rawWhatsapp.replace(/[^0-9]/g, '');
  const rawMsg = accessConfig?.whatsappMessage?.trim() || 'السلام عليكم يا أستاذ، أريد تفعيل اشتراكي في منصة التميز التعليمية';
  const encodedMsg = encodeURIComponent(
    currentUser 
      ? `${rawMsg}\n(الاسم: ${currentUser.name} - الإيميل: ${currentUser.email})`
      : rawMsg
  );
  const whatsappUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;

  // Build clean Telegram link
  const rawTelegram = accessConfig?.telegramUsername?.trim() || '';
  const cleanTelegram = rawTelegram.replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
  const telegramUrl = cleanTelegram ? `https://t.me/${cleanTelegram}` : '';

  const buttonText = accessConfig?.subscriptionButtonText?.trim() || 'اشترك الآن أو فعّل اشتراكك عبر واتساب';

  // Dedicated guest lockdown view
  if (isGuestLocked && !currentUser) {
    return (
      <div 
        id="platform-guest-lockdown-screen"
        className="min-h-[85vh] bg-slate-950 text-white flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white"
      >
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          {/* Ambient Top Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none bg-emerald-600/20" />

          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border mb-5 shadow-xs bg-slate-800/80 border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400">محتوى خاص بالطلاب المسجلين 🔒</span>
          </div>

          {/* Lock Icon */}
          <div className="relative mx-auto mb-5 w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl">
            <div className="w-full h-full rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-emerald-500/10">
              <Lock className="w-10 h-10 text-emerald-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            المحتوى التعليمي مقفل لغير المسجلين
          </h1>

          {/* Notice Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6 text-sm sm:text-base text-slate-200 leading-relaxed font-medium text-right shadow-inner">
            <p className="whitespace-pre-line">{defaultLockMessage}</p>
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-slate-300 text-right">
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
              <span className="text-emerald-400">🎬</span>
              <span>شروحات مسجلة للكمي واللفظي</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
              <span className="text-emerald-400">📝</span>
              <span>اختبارات تفاعلية محاكية</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
              <span className="text-emerald-400">📂</span>
              <span>تجميعات وملخصات PDF</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2">
              <span className="text-emerald-400">⭐</span>
              <span>حفظ المصادر ومتابعة التقدم</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => onOpenAuth?.('login')}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <LogIn className="w-5 h-5" />
              <span>تسجيل الدخول إلى حسابك لفتح المحتوى</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAuth?.('register')}
              className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 text-emerald-300 font-bold text-sm border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>إنشاء حساب طالب جديد مجاناً</span>
            </button>
          </div>

          {/* Supervisor Contact if enabled */}
          {cleanPhone && (
            <div className="mb-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                <span>تواجه صعوبة أو استفسار؟ تواصل مع المشرف عبر واتساب</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      id="platform-lockdown-screen"
      className="min-h-[85vh] bg-slate-950 text-white flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
        
        {/* Ambient Top Glow */}
        <div 
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isSubscriptionMode ? 'bg-emerald-600/20' : 'bg-amber-600/20'
          }`} 
        />

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border mb-5 shadow-xs bg-slate-800/80 border-slate-700">
          {isSubscriptionMode ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">تنبيه الاشتراك والوصول للمنصة</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400">أعمال الصيانة والتحديث الدوري</span>
            </>
          )}
        </div>

        {/* Dynamic Icon */}
        <div className="relative mx-auto mb-5 w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl">
          {isSubscriptionMode ? (
            <div className="w-full h-full rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-emerald-500/10">
              <WhatsAppIcon className="w-11 h-11 text-emerald-400" />
            </div>
          ) : (
            <div className="w-full h-full rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-amber-500/10">
              <Wrench className="w-10 h-10 text-amber-400 animate-pulse" />
            </div>
          )}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isSubscriptionMode ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 ${
              isSubscriptionMode ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
          {isSubscriptionMode ? 'انتهى اشتراكك أو الحساب بانتظار التفعيل' : 'المنصة قيد الصيانة المؤقتة'}
        </h1>

        {/* Notice Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 mb-6 text-sm sm:text-base text-slate-200 leading-relaxed font-medium text-right shadow-inner">
          <p className="whitespace-pre-line">{defaultLockMessage}</p>
        </div>

        {/* Student Status info if already logged in */}
        {currentUser ? (
          <div className="mb-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs sm:text-sm text-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div>
              <span className="text-slate-400 block text-xs">الحساب الحالي المسجل:</span>
              <span className="font-bold text-white text-sm">{currentUser.name}</span>
              <span className="text-slate-400 mr-2 text-xs font-mono">({currentUser.email})</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <span>غير مفعّل حالياً</span>
            </div>
          </div>
        ) : (
          /* Student is not logged in yet - provide quick login button */
          onOpenAuth && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div>
                <span className="text-white font-bold text-sm block">لديك حساب مسجل بالفعل؟</span>
                <span className="text-xs text-slate-400">سجل دخولك لتتمكن من التحقق من تفعيلك أو التواصل مع المشرف.</span>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-600 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span>تسجيل الدخول / حساب جديد</span>
              </button>
            </div>
          )
        )}

        {/* Main CTA Section: WhatsApp & Telegram */}
        <div className="space-y-3 mb-6">
          {/* Subscription / Contact Channels */}
          <div className="space-y-2.5">
            {/* WhatsApp Contact Channel */}
            <a
              id="lock-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#25D366]/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <span className="block font-black text-sm sm:text-base">{buttonText || 'اشترك الآن عبر واتساب'}</span>
                  <span className="text-[11px] text-emerald-100 font-normal">
                    {accessConfig?.whatsappNumber ? `الرقم: ${accessConfig.whatsappNumber}` : 'تواصل مباشر مع المشرف لتفعيل حسابك فورياً'}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-80 shrink-0" />
            </a>

            {/* Telegram Contact Channel */}
            {telegramUrl ? (
              <a
                id="lock-telegram-btn"
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-[#229ED9] hover:bg-[#1e8cc1] active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#229ED9]/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <TelegramIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-right">
                    <span className="block font-black text-sm sm:text-base">تواصل واشترك عبر تليجرام</span>
                    <span className="text-[11px] text-sky-100 font-normal">
                      {accessConfig?.telegramUsername ? `@${cleanTelegram}` : 'محادثة فورية مع المشرف عبر تطبيق تليجرام'}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 opacity-80 shrink-0" />
              </a>
            ) : null}
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <button
              id="lock-refresh-btn"
              onClick={handleCheckAgain}
              disabled={isChecking}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer disabled:opacity-50 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700"
            >
              <RotateCcw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'جاري الفحص...' : 'إعادة الفحص والتحديث'}</span>
            </button>

            {currentUser && onLogout && (
              <button
                id="lock-logout-btn"
                onClick={onLogout}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
