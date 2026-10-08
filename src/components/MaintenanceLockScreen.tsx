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
  ExternalLink,
  Mail,
  User,
  UserPlus,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowLeft,
  ShieldCheck,
  BookOpen,
  Film,
  FileText,
  Award
} from 'lucide-react';
import { StudentUser, PlatformAccessConfig } from '../types';
import { apiService } from '../services/api';
import { safeStorage } from '../utils/safeStorage';
import { RaedAuthCard } from './RaedAuthCard';

interface MaintenanceLockScreenProps {
  accessConfig?: PlatformAccessConfig;
  currentUser: StudentUser | null;
  onRefresh: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenAuth?: (initialMode?: 'login' | 'register') => void;
  onLoginSuccess?: (user: StudentUser) => void;
  isIndividuallyBlocked?: boolean;
  isGuestLocked?: boolean;
  isSubscriptionExpired?: boolean;
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
  onLoginSuccess,
  isIndividuallyBlocked,
  isGuestLocked,
  isSubscriptionExpired,
  lockMessage,
  onOpenAdminAuth,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const handleAdmin = onOpenAdmin || onOpenAdminAuth;

  // Direct guest portal login / register / reset state
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState(() => {
    try {
      return safeStorage.getItem('tamayuz_remembered_student_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubscriptionMode = accessConfig?.lockReason === 'subscription';
  const isSubscriptionExpiredMode = Boolean(
    isSubscriptionExpired ||
    (currentUser &&
      currentUser.role !== 'admin' &&
      currentUser.subscriptionExpiresAt &&
      new Date(currentUser.subscriptionExpiresAt).getTime() <= Date.now())
  );

  const defaultLockMessage = isGuestLocked
    ? 'مرحباً بك في منصة أقسام رعد. يرجى تسجيل الدخول أو إنشاء حساب طالب جديد للوصول المباشر إلى الشروحات المرئية والاختبارات التفاعلية وحقائب المذكرات.'
    : isSubscriptionExpiredMode
    ? `عزيزي الطالب (${currentUser?.name || ''})، لقد انتهى اشتراكك في المنصة. يرجى التواصل مع المشرف لتجديد وتفعيل الاشتراك لمتابعة كافة الشروحات والاختبارات.`
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

  // Direct form submission for guest portal
  const handleInstantReset = async () => {
    if (!email.trim() || !password.trim()) return;
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const user = await apiService.resetPassword(email.trim(), password.trim());
      try {
        if (rememberMe) {
          safeStorage.setItem('tamayuz_remembered_student_email', email.trim());
        }
      } catch {}
      if (onLoginSuccess) {
        onLoginSuccess(user);
      } else {
        await onRefresh();
      }
    } catch (err: any) {
      setAuthError(err.message || 'حدث خطأ أثناء اعتماد كلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (authTab === 'login') {
        if (!email.trim() || !password) {
          setAuthError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
          setIsSubmitting(false);
          return;
        }

        const user = await apiService.login(email.trim(), password);

        try {
          if (rememberMe) {
            safeStorage.setItem('tamayuz_remembered_student_email', email.trim());
          } else {
            safeStorage.removeItem('tamayuz_remembered_student_email');
          }
        } catch {}

        if (onLoginSuccess) {
          onLoginSuccess(user);
        } else {
          await onRefresh();
        }
      } else if (authTab === 'register') {
        if (!name.trim()) {
          setAuthError('يرجى إدخال اسم الطالب');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim()) {
          setAuthError('يرجى إدخال البريد الإلكتروني');
          setIsSubmitting(false);
          return;
        }
        if (!password) {
          setAuthError('يرجى كتابة كلمة المرور');
          setIsSubmitting(false);
          return;
        }

        const user = await apiService.register(name.trim(), email.trim(), password);

        try {
          if (rememberMe) {
            safeStorage.setItem('tamayuz_remembered_student_email', email.trim());
          }
        } catch {}

        if (onLoginSuccess) {
          onLoginSuccess(user);
        } else {
          await onRefresh();
        }
      } else if (authTab === 'reset') {
        if (!email.trim() || !password) {
          setAuthError('يرجى كتابة البريد الإلكتروني وكلمة المرور الجديدة');
          setIsSubmitting(false);
          return;
        }

        const user = await apiService.resetPassword(email.trim(), password);

        try {
          if (rememberMe) {
            safeStorage.setItem('tamayuz_remembered_student_email', email.trim());
          }
        } catch {}

        if (onLoginSuccess) {
          onLoginSuccess(user);
        } else {
          await onRefresh();
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'حدث خطأ أثناء المحاولة، يرجى التحقق من صحة البيانات والمحاولة مجدداً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build clean WhatsApp link
  const rawWhatsapp = accessConfig?.whatsappNumber?.trim() || '';
  const cleanPhone = rawWhatsapp.replace(/[^0-9]/g, '');
  const rawMsg = isSubscriptionExpiredMode
    ? 'السلام عليكم يا أستاذ، لقد انتهى اشتراكي في منصة أقسام رعد وأرغب في تجديد وتفعيل الاشتراك'
    : (accessConfig?.whatsappMessage?.trim() || 'السلام عليكم يا أستاذ، أريد تفعيل اشتراكي في منصة أقسام رعد');
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

  // ==========================================================================
  // 1. DEDICATED STUDENT LOGIN & AUTHENTICATION PORTAL (GUESTS)
  // ==========================================================================
  if (isGuestLocked && !currentUser) {
    return (
      <div 
        id="platform-guest-login-portal"
        className="min-h-screen w-full flex items-center justify-center p-3.5 sm:p-6 lg:p-8 relative overflow-hidden transition-colors"
        dir="rtl"
      >
        <div className="w-full max-w-2xl relative z-10">
          <RaedAuthCard
            onSuccess={(user) => {
              if (onLoginSuccess) {
                onLoginSuccess(user);
              }
            }}
            onOpenAdmin={handleAdmin}
          />
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. SUBSCRIPTION EXPIRED / INDIVIDUALLY BLOCKED / MAINTENANCE LOCK VIEW
  // ==========================================================================
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

        {/* Platform Brand */}
        <div className="flex flex-col items-center justify-center gap-2 mb-4">
          <img
            src="/raed-logo.png"
            alt="شعار منصة أقسام رعد"
            className="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-700 p-1 shadow-lg"
          />
          <h2 className="text-xl sm:text-2xl font-black text-white">
            منصة <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">أقسام رعد</span>
          </h2>
        </div>

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border mb-5 shadow-xs bg-slate-800/80 border-slate-700">
          {isSubscriptionExpiredMode ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 font-bold">تنبيه: انتهى اشتراكك في المنصة ⏳</span>
            </>
          ) : isSubscriptionMode ? (
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
          {isSubscriptionExpiredMode || isSubscriptionMode ? (
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
              isSubscriptionExpiredMode || isSubscriptionMode ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 ${
              isSubscriptionExpiredMode || isSubscriptionMode ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
          {isSubscriptionExpiredMode 
            ? 'انتهى اشتراكك في المنصة' 
            : isSubscriptionMode 
            ? 'انتهى اشتراكك أو الحساب بانتظار التفعيل' 
            : 'المنصة قيد الصيانة المؤقتة'}
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
                onClick={() => onOpenAuth('login')}
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
          {cleanPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <WhatsAppIcon className="w-5 h-5" />
              <span>{buttonText}</span>
            </a>
          )}

          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-6 rounded-2xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-bold text-sm shadow-md shadow-[#229ED9]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <TelegramIcon className="w-4 h-4" />
              <span>قناة المنصة على تليجرام</span>
            </a>
          )}
        </div>

        {/* Bottom Actions: Check again, logout, admin */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleCheckAgain}
            disabled={isChecking}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'جاري التحقق...' : 'إعادة التحقق من التفعيل'}</span>
          </button>

          {currentUser && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold border border-rose-800/50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج من الحساب</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
