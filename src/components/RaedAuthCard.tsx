import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Calculator,
  BookOpen,
  Award,
  HelpCircle,
  X
} from 'lucide-react';
import { StudentUser } from '../types';
import { apiService } from '../services/api';
import { safeStorage } from '../utils/safeStorage';

interface RaedAuthCardProps {
  onSuccess: (user: StudentUser) => void;
  onClose?: () => void;
  initialMode?: 'login' | 'register' | 'reset';
  promptMessage?: string | null;
  onOpenAdmin?: () => void;
}

export const RaedAuthCard: React.FC<RaedAuthCardProps> = ({
  onSuccess,
  onClose,
  initialMode = 'login',
  promptMessage,
  onOpenAdmin,
}) => {
  // Theme state: dark mode (black with white text) vs light mode (white with black text)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') return false;
      if (savedTheme === 'dark') return true;
      return document.documentElement.classList.contains('dark') || true;
    }
    return true;
  });

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load remembered student email
  useEffect(() => {
    try {
      const savedEmail = safeStorage.getItem('tamayuz_remembered_student_email');
      if (savedEmail && !email) {
        setEmail(savedEmail);
      }
    } catch {}
  }, []);

  const toggleThemeMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('theme', next ? 'dark' : 'light');
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {}
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      if (mode === 'login') {
        if (!cleanEmail || !cleanPassword) {
          setError('يرجى كتابة البريد الإلكتروني وكلمة المرور');
          setIsLoading(false);
          return;
        }

        const user = await apiService.login(cleanEmail, cleanPassword);
        try {
          safeStorage.setItem('tamayuz_remembered_student_email', cleanEmail);
        } catch {}
        onSuccess(user);
      } else if (mode === 'register') {
        if (!cleanEmail || !cleanPassword) {
          setError('يرجى كتابة البريد الإلكتروني وكلمة المرور');
          setIsLoading(false);
          return;
        }

        const studentName = name.trim() || cleanEmail.split('@')[0] || 'طالب متميز';
        const user = await apiService.register(studentName, cleanEmail, cleanPassword);
        try {
          safeStorage.setItem('tamayuz_remembered_student_email', cleanEmail);
        } catch {}
        onSuccess(user);
      } else {
        // Reset mode
        if (!cleanEmail || !cleanPassword) {
          setError('يرجى كتابة البريد الإلكتروني وكلمة المرور الجديدة');
          setIsLoading(false);
          return;
        }

        await apiService.resetPassword(cleanEmail, cleanPassword);
        try {
          safeStorage.setItem('tamayuz_remembered_student_email', cleanEmail);
        } catch {}

        // Return student to login screen as requested
        setMode('login');
        setPassword('');
        setError(null);
        setSuccessMessage('تم تعيين وحفظ كلمة المرور الجديدة بنجاح! يمكنك الآن كتابة كلمة المرور وتسجيل الدخول.');
      }
    } catch (err: any) {
      console.warn('Auth action error:', err);
      const msg = err.message || 'حدث خطأ أثناء المعالجة، يرجى التحقق من البيانات والمحاولة مجدداً';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className={`w-full max-w-2xl mx-auto rounded-3xl p-6 sm:p-10 transition-colors duration-300 relative shadow-2xl border ${
        isDarkMode
          ? 'bg-black text-white border-zinc-800 selection:bg-zinc-800 selection:text-white'
          : 'bg-white text-black border-zinc-200 selection:bg-zinc-200 selection:text-black'
      }`}
    >
      {/* Top Controls: Close button (if modal) + Dark/Light Mode Switcher */}
      <div className="flex items-center justify-between gap-3 mb-6">
        {/* Dark / Light Mode Switcher Button */}
        <button
          type="button"
          onClick={toggleThemeMode}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs border ${
            isDarkMode
              ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700'
              : 'bg-zinc-100 hover:bg-zinc-200 text-black border-zinc-300'
          }`}
          title={isDarkMode ? 'التبديل إلى الوضع النهاري (الفاتح)' : 'التبديل إلى الوضع الليلي (الداكن)'}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>الوضع النهاري</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span>الوضع الداكن</span>
            </>
          )}
        </button>

        {/* Brand Logo & Close Action */}
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className={`p-2 rounded-2xl border transition-all cursor-pointer ${
                isDarkMode
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-black border-zinc-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. العنوان بخط كبير: منصة اقسام رعد */}
      <div className="text-center space-y-2 mb-6">
        <div 
          onDoubleClick={onOpenAdmin}
          title="منصة أقسام رعد"
          className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-zinc-200 dark:border-zinc-800 shadow-md mb-2 cursor-pointer select-none"
        >
          <img
            src="/raed-logo.png"
            alt="شعار منصة أقسام رعد"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
          منصة أقسام رعد
        </h1>

        {/* 2. تحتها: ان هذه المنصة هي طريقك للمئوية في القدرات */}
        <p className="text-base sm:text-lg md:text-xl font-bold opacity-90 leading-relaxed">
          إن هذه المنصة هي طريقك للمئوية في القدرات
        </p>
      </div>

      {/* 3. شرح لاختبار القدرات وما هو اختبار القدرات */}
      <div
        className={`rounded-2xl p-4 sm:p-5 mb-8 border transition-colors ${
          isDarkMode
            ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
            : 'bg-zinc-50 border-zinc-200 text-zinc-800'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className={`w-5 h-5 shrink-0 ${isDarkMode ? 'text-white' : 'text-black'}`} />
          <h2 className="text-sm sm:text-base font-black">
            ما هو اختبار القدرات العامة؟
          </h2>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed mb-3 opacity-90 font-medium text-justify">
          اختبار القدرات العامة هو اختبار قياس وطني معتمد يهدف إلى قياس القدرة التحليلية والاستدلالية لدى الطلاب ومعرفة قابليتهم للتعلّم، ويعد الركيزة الأساسية للقبول في الجامعات والكليات لتحقيق طموحك الدراسي.
        </p>

        {/* أقسام الاختبار الرئيسية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-black'}`}>
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black block mb-0.5">القسم الكمي</span>
              <p className="text-[11px] leading-relaxed opacity-80">
                يشمل العمليات الحسابية، المفاهيم الهندسية، الجبر، الإحصاء، المقارنات، والمسائل التحليلية الذكية.
              </p>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${isDarkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-black'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black block mb-0.5">القسم اللفظي</span>
              <p className="text-[11px] leading-relaxed opacity-80">
                يشمل استيعاب المقروء، التناظر اللفظي، إكمال الجمل، والخطأ السياقي لاكتساب الدقة اللغوية.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-zinc-200/40 dark:border-zinc-800/60 flex items-center gap-2 text-[11px] font-bold">
          <Award className={`w-3.5 h-3.5 shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} />
          <span>منصة أقسام رعد تمنحك استراتيجيات الحل السريع والتأسيس المكتمل للوصول إلى 100% بعون الله.</span>
        </div>
      </div>

      {/* 4. مستطيلين: واحد مكتوب عليه تسجيل دخول والثاني مكتوب عليه انشاء حساب */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* مستطيل تسجيل دخول */}
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setSuccessMessage(null);
          }}
          className={`py-3.5 px-4 rounded-2xl text-sm sm:text-base font-black transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-sm ${
            mode === 'login'
              ? isDarkMode
                ? 'bg-white text-black border-white ring-2 ring-white/20'
                : 'bg-black text-white border-black ring-2 ring-black/20'
              : isDarkMode
              ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800'
              : 'bg-zinc-100 hover:bg-zinc-200 text-black border-zinc-200'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>تسجيل دخول</span>
        </button>

        {/* مستطيل انشاء حساب */}
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
            setSuccessMessage(null);
          }}
          className={`py-3.5 px-4 rounded-2xl text-sm sm:text-base font-black transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-sm ${
            mode === 'register'
              ? isDarkMode
                ? 'bg-white text-black border-white ring-2 ring-white/20'
                : 'bg-black text-white border-black ring-2 ring-black/20'
              : isDarkMode
              ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800'
              : 'bg-zinc-100 hover:bg-zinc-200 text-black border-zinc-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>انشاء حساب</span>
        </button>
      </div>

      {/* Success Callout */}
      {successMessage && (
        <div className="mb-4 p-3.5 rounded-2xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="block leading-relaxed">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Prompt message callout if opened from protected resource */}
      {promptMessage && (
        <div
          className={`mb-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
            isDarkMode
              ? 'bg-zinc-900 text-zinc-200 border-zinc-800'
              : 'bg-zinc-100 text-zinc-900 border-zinc-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{promptMessage}</span>
        </div>
      )}

      {/* Error Callout */}
      {error && (
        <div className="mb-4 p-3.5 rounded-2xl text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1.5">
            <span className="block">{error}</span>
            {error.includes('كلمة المرور') && mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                }}
                className={`text-[11px] underline block font-black cursor-pointer ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-700'
                }`}
              >
                اضغط هنا لإعادة تعيين كلمة المرور وتعيين كلمة مرور جديدة فوراً
              </button>
            )}
          </div>
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-1.5 text-right">
            <label className="text-xs font-black block opacity-90">
              اسم الطالب
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسم الطالب هنا"
                className={`w-full pr-10 pl-4 py-3 rounded-2xl text-sm font-semibold border transition-all focus:outline-none ${
                  isDarkMode
                    ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-white'
                    : 'bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black'
                }`}
              />
              <User className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 opacity-60" />
            </div>
          </div>
        )}

        <div className="space-y-1.5 text-right">
          <label className="text-xs font-black block opacity-90">
            {mode === 'reset' ? 'البريد الإلكتروني المسجل' : 'البريد الإلكتروني'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={`w-full pr-10 pl-4 py-3 rounded-2xl text-sm font-semibold text-left border transition-all focus:outline-none ${
                isDarkMode
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-white'
                  : 'bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black'
              }`}
            />
            <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 opacity-60" />
          </div>
        </div>

        <div className="space-y-1.5 text-right">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black block opacity-90">
              {mode === 'reset' ? 'كلمة المرور الجديدة' : 'كلمة المرور'}
            </label>
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError(null);
                }}
                className="text-[11px] font-bold opacity-75 hover:opacity-100 underline cursor-pointer"
              >
                نسيت كلمة المرور؟
              </button>
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
              className={`w-full pr-10 pl-11 py-3 rounded-2xl text-sm font-semibold text-left border transition-all focus:outline-none ${
                isDarkMode
                  ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-white'
                  : 'bg-zinc-50 border-zinc-300 text-black placeholder-zinc-400 focus:border-black'
              }`}
            />
            <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 opacity-60" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3.5 px-4 rounded-2xl text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2 ${
            isDarkMode
              ? 'bg-white text-black hover:bg-zinc-200'
              : 'bg-black text-white hover:bg-zinc-800'
          }`}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : mode === 'login' ? (
            <>
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول إلى حسابي</span>
            </>
          ) : mode === 'register' ? (
            <>
              <UserPlus className="w-4 h-4" />
              <span>إنشاء الحساب وبدء التعلم فوراً</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>حفظ كلمة المرور والدخول</span>
            </>
          )}
        </button>

        {mode === 'reset' && (
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className="w-full py-2 text-xs font-bold opacity-75 hover:opacity-100 text-center block cursor-pointer transition-opacity"
          >
            العودة لصفحة تسجيل الدخول
          </button>
        )}
      </form>
    </div>
  );
};
