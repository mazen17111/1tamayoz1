import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  LogIn, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  CheckCircle2, 
  KeyRound, 
  ArrowLeft 
} from 'lucide-react';
import { StudentUser } from '../types';
import { apiService } from '../services/api';
import { safeStorage } from '../utils/safeStorage';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: StudentUser) => void;
  promptMessage?: string | null;
  initialMode?: 'login' | 'register';
  onOpenAdmin?: () => void;
}

// Crisp official WhatsApp vector icon
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
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

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  promptMessage,
  initialMode = 'login',
  onOpenAdmin,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load remembered student email if available
  useEffect(() => {
    try {
      const savedEmail = safeStorage.getItem('tamayuz_remembered_student_email');
      if (savedEmail && !email) {
        setEmail(savedEmail);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (tab === 'login') {
        if (!cleanEmail || !cleanPassword) {
          setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
          setIsLoading(false);
          return;
        }

        const user = await apiService.login(cleanEmail, cleanPassword);

        // Save or clear remember me preference
        try {
          if (rememberMe) {
            safeStorage.setItem('tamayuz_remembered_student_email', cleanEmail);
          } else {
            safeStorage.removeItem('tamayuz_remembered_student_email');
          }
        } catch {}

        onSuccess(user);
        onClose();
      } else {
        if (!name.trim()) {
          setError('يرجى إدخال اسم الطالب الكامل (ثنائي أو ثلاثي)');
          setIsLoading(false);
          return;
        }
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setError('يرجى إدخال بريد إلكتروني صحيح');
          setIsLoading(false);
          return;
        }
        if (cleanPassword.length < 6) {
          setError('كلمة المرور يجب أن لا تقل عن 6 خانات أو أحرف');
          setIsLoading(false);
          return;
        }

        const user = await apiService.register(name.trim(), cleanEmail, cleanPassword);
        
        try {
          if (rememberMe) {
            safeStorage.setItem('tamayuz_remembered_student_email', cleanEmail);
          }
        } catch {}

        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      const errMsg = err.message || 'حدث خطأ أثناء المحاولة، يرجى التحقق من صحة البيانات والمحاولة مجدداً.';
      setError(errMsg);
      if (errMsg.includes('مسجل بالفعل') || errMsg.includes('تسجيل الدخول')) {
        setTimeout(() => {
          setTab('login');
        }, 1200);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const whatsappSupportUrl = `https://wa.me/?text=${encodeURIComponent(
    tab === 'login'
      ? 'السلام عليكم، أحتاج مساعدة في استعادة بيانات تسجيل الدخول إلى منصة أقسام رعد.'
      : 'السلام عليكم، أود تفعيل حسابي في منصة أقسام رعد.'
  )}`;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950 text-white p-3.5 sm:p-6 overflow-y-auto"
      dir="rtl"
    >
      {/* Outer ambient glow */}
      <div className="relative w-full max-w-lg my-auto">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Card */}
        <div className="relative bg-slate-900 border border-emerald-500/30 text-white rounded-3xl shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9),0_0_50px_rgba(5,150,105,0.2)] overflow-hidden text-right transition-all">
          
          {/* Top Decorative Header Sheen */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          {/* Top Brand Banner */}
          <div className="p-6 sm:p-7 pb-2 text-center space-y-3 relative">
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute left-4 top-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            </button>

            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="p-1 rounded-2xl bg-white border border-slate-700 shadow-xl shrink-0">
                <img
                  src="/raed-logo.png"
                  alt="شعار منصة أقسام رعد الجديد"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  منصة <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-200 bg-clip-text text-transparent">أقسام رعد</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {tab === 'login' 
                    ? 'تسجيل الدخول إلى حساب الطالب للوصول للشروحات والاختبارات' 
                    : 'إنشاء حساب طالب جديد والبدء في حل الاختبارات والمذاكرة'}
                </p>
              </div>
            </div>

            {/* Instruction Callout */}
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] sm:text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>
                {tab === 'login'
                  ? 'تنبيه: يلزم كتابة نفس البريد الإلكتروني وكلمة المرور المسجلين أثناء إنشاء الحساب'
                  : 'احفظ نفس الإيميل وكلمة المرور لتسجيل الدخول بهما دائماً دون أخطاء'}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-7 pt-2 space-y-5">

            {/* Luxury Segmented Tabs */}
            <div className="relative p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 grid grid-cols-2 shadow-inner">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); }}
                className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-700/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null); }}
                className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-700/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>حساب طالب جديد</span>
              </button>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (Registration only) */}
              {tab === 'register' && (
                <div className="space-y-1.5 text-right animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>اسم الطالب الكامل</span>
                    <span className="text-[10px] text-slate-400 font-normal">سيظهر في نتائجك وشهاداتك</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: عبد الله أحمد الشمري"
                      className="w-full pr-11 pl-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-right transition-all shadow-inner"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Email Address */}
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
                    className="w-full pr-11 pl-4 py-3 bg-slate-950/70 border border-slate-700/70 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    كلمة المرور
                  </label>
                  {tab === 'login' && (
                    <a
                      href={whatsappSupportUrl}
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
                    className="w-full pr-11 pl-11 py-3 bg-slate-950/70 border border-slate-700/70 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-left transition-all shadow-inner"
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
                {tab === 'register' && (
                  <p className="text-[11px] text-slate-400">
                    يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-700 bg-slate-900 text-emerald-600 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300">تذكر بياناتي على هذا الجهاز</span>
                </label>
              </div>

              {/* Luxury Submit CTA Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق وتأمين تسجيل الدخول...</span>
                  </div>
                ) : (
                  <>
                    <span>{tab === 'login' ? 'دخول المنصة التعليمية' : 'إنشاء الحساب وبدء التعلم الآن'}</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* VIP Trust Badges */}
            <div className="pt-4 border-t border-slate-800/70 grid grid-cols-3 gap-2 text-center text-[10px] text-slate-400">
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>حماية وتشفير 256-bit</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>حفظ تقدمك التلقائي</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>اختبارات وفيديوهات حصرية</span>
              </div>
            </div>

            {/* Quick WhatsApp Support */}
            <div className="flex items-center justify-center pt-1 text-xs text-slate-400">
              <a
                href={whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                <span>مساعدة الدعم الأكاديمي عبر واتساب</span>
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
