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

  // Direct guest portal login / register state
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
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
    ? 'مرحباً بك في منصة التميز التعليمية. يرجى تسجيل الدخول أو إنشاء حساب طالب جديد للوصول المباشر إلى الشروحات المرئية والاختبارات التفاعلية وحقائب المذكرات.'
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
      } else {
        if (!name.trim()) {
          setAuthError('يرجى إدخال اسم الطالب الكامل (ثنائي أو ثلاثي)');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim() || !email.includes('@')) {
          setAuthError('يرجى إدخال بريد إلكتروني صحيح');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setAuthError('كلمة المرور يجب أن لا تقل عن 6 خانات أو أحرف');
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
    ? 'السلام عليكم يا أستاذ، لقد انتهى اشتراكي في منصة التميز وأرغب في تجديد وتفعيل الاشتراك'
    : (accessConfig?.whatsappMessage?.trim() || 'السلام عليكم يا أستاذ، أريد تفعيل اشتراكي في منصة التميز التعليمية');
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
  // 1. DEDICATED ULTRA-LUXURIOUS STUDENT LOGIN & AUTHENTICATION PORTAL (GUESTS)
  // ==========================================================================
  if (isGuestLocked && !currentUser) {
    return (
      <div 
        id="platform-guest-login-portal"
        className="min-h-[88vh] bg-slate-950 text-white flex items-center justify-center p-3.5 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-white relative overflow-hidden"
        dir="rtl"
      >
        {/* Multi-point Ambient Luxury Lights */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-5xl relative z-10 space-y-6">

          {/* Top Brand Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-lg shadow-emerald-950/50 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>بوابة الطلاب المعتمدة • بيئة تدريبية ذكية</span>
              <span className="text-emerald-500/70">|</span>
              <span className="text-[11px] font-mono text-emerald-400">الإصدار 2026</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                  <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                منصة <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">التميز</span> التعليمية
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
              البيئة الأكاديمية الشاملة للتدريب على اختبارات القدرات العامة (الكمي واللفظي) بالشروحات المصورة والاختبارات التفاعلية.
            </p>
          </div>

          {/* Grand Central Split Card */}
          <div className="bg-slate-900/90 border border-emerald-500/25 rounded-3xl sm:rounded-[32px] shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.12)] backdrop-blur-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
            
            {/* RIGHT SIDE: Interactive Direct Login / Register Form (7 Cols on desktop) */}
            <div className="lg:col-span-7 p-6 sm:p-9 space-y-6 text-right border-b lg:border-b-0 lg:border-l border-slate-800/80">
              
              {/* Tab Switcher */}
              <div className="relative p-1 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-2 shadow-inner">
                <button
                  type="button"
                  onClick={() => { setAuthTab('login'); setAuthError(null); }}
                  className={`flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                    authTab === 'login'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-700/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(null); }}
                  className={`flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
                    authTab === 'register'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-700/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>إنشاء حساب طالب جديد</span>
                </button>
              </div>

              {/* Form Title & Subtitle */}
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {authTab === 'login' ? 'الدخول إلى حساب الطالب' : 'إنشاء حساب طالب جديد'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {authTab === 'login' 
                    ? 'أدخل بريدك الإلكتروني وكلمة المرور للوصول الفوري لكافة أقسام المنصة' 
                    : 'سجل بياناتك الآن للبدء في حل الاختبارات ومشاهدة الشروحات المسجلة'}
                </p>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5 animate-pulse" />
                  <span className="leading-relaxed">{authError}</span>
                </div>
              )}

              {/* The Form */}
              <form onSubmit={handleDirectAuthSubmit} className="space-y-4">
                
                {/* Name Field (Register Mode) */}
                {authTab === 'register' && (
                  <div className="space-y-1.5 text-right animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>اسم الطالب الكامل</span>
                      <span className="text-[10px] text-slate-400 font-normal">سيظهر في الشهادات والتقارير</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: عبد الله بن أحمد الشمري"
                        className="w-full pr-11 pl-4 py-3 bg-slate-950/80 border border-slate-750 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-right transition-all shadow-inner"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-bold text-slate-300 block">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      dir="ltr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full pr-11 pl-4 py-3 bg-slate-950/80 border border-slate-750 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">
                      كلمة المرور
                    </label>
                    {authTab === 'login' && cleanPhone && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        نسيت كلمة المرور؟
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-11 pl-11 py-3 bg-slate-950/80 border border-slate-750 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                    
                    {/* Toggle Show/Hide Password */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {authTab === 'register' && (
                    <p className="text-[11px] text-slate-400">
                      يجب أن تتكون كلمة المرور من 6 خانات أو أحرف على الأقل.
                    </p>
                  )}
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300">تذكر بيانات تسجيل دخولي في هذا المتصفح</span>
                  </label>
                </div>

                {/* Submit Primary CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>جاري التحقق وتأمين تسجيل الدخول...</span>
                    </div>
                  ) : (
                    <>
                      <span>{authTab === 'login' ? 'دخول المنصة التعليمية' : 'إنشاء الحساب وبدء التعلم الآن'}</span>
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Quick Links */}
              <div className="flex items-center justify-center pt-3 border-t border-slate-800 text-xs text-slate-400">
                {cleanPhone && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                    <span>مساعدة الدعم الأكاديمي عبر واتساب</span>
                  </a>
                )}
              </div>

            </div>

            {/* LEFT SIDE: Platform Capabilities & Academic Features Showcase (5 Cols on desktop) */}
            <div className="lg:col-span-5 p-6 sm:p-9 bg-slate-950/60 flex flex-col justify-between space-y-6 text-right">
              
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>مميزات حسابك في منصة التميز</span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  كل ما تحتاجه لتحقيق الدرجة المستهدفة في مكان واحد
                </h3>

                {/* 4 Feature Items */}
                <div className="space-y-3 pt-1">
                  
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">شروحات مرئية تفاعلية</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        فيديوهات مسجلة للكمي واللفظي تشرح التكتيكات السريعة وأحدث الأسئلة.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">اختبارات محاكية وتصحيح ذكي</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        محاكاة حقيقية لبيئة قياس مع توقيت واستخراج فوري للدرجة وتوضيح الإجابات.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">مذكرات وتجميعات PDF شاملة</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        حقائب منظمة وقابلة للمعاينة المباشرة والمذاكرة بمرونة على أي جهاز.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">سجل الإنجاز والتقدم الشخصي</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        حفظ مستمر للفيديوهات المشاهدة ونتائج الاختبارات ومجلدات الأسئلة المفضلة.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Trust Footnote */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>أمان وسرية تامة لبيانات الطالب</span>
                </div>
                <span>مزامنة سحابية مستمرة</span>
              </div>

            </div>

          </div>

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
