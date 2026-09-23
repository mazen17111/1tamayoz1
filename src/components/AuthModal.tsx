import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { StudentUser } from '../types';
import { apiService } from '../services/api';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: StudentUser) => void;
  promptMessage?: string | null;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  promptMessage,
  initialMode = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        const user = await apiService.login(email, password);
        onSuccess(user);
        onClose();
      } else {
        if (!name.trim()) {
          setError('يرجى إدخال اسم الطالب');
          setIsLoading(false);
          return;
        }
        const user = await apiService.register(name, email, password);
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المحاولة، يرجى التحقق من البيانات.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden text-right transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/80">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-right">
            <span className="text-xs text-slate-400 dark:text-slate-500 block">بوابة الطلاب</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {tab === 'login' ? 'تسجيل الدخول للمنصة' : 'إنشاء حساب طالب جديد'}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Prompt banner when gated by video or quiz */}
          {promptMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5 leading-relaxed">
              <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">تسجيل الدخول مطلوب:</span>
                <span>{promptMessage}</span>
              </div>
            </div>
          )}

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'login' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'register' 
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              حساب طالب جديد
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم الطالب الكامل</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: عبد الله الشمري"
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'جاري التحقق...' : tab === 'login' ? 'دخول للمنصة' : 'إنشاء حساب وبدء التعلم'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
