import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldCheck, 
  User, 
  LogOut, 
  BookOpen, 
  Menu, 
  X,
  Award,
  Sparkles,
  BarChart3,
  Radio,
  Clock
} from 'lucide-react';
import { StudentUser, LiveStreamConfig } from '../types';

interface NavbarProps {
  currentUser: StudentUser | null;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  onLogout: () => void;
  isAdminOpen: boolean;
  activeSectionTitle?: string;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenStats?: () => void;
  liveStream?: LiveStreamConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenAdmin,
  onGoHome,
  onLogout,
  isAdminOpen,
  activeSectionTitle,
  theme = 'light',
  onToggleTheme,
  onOpenStats,
  liveStream,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const completedTestsCount = currentUser?.progress?.completedQuizAttempts?.length || 0;
  const completedVideosCount = currentUser?.progress?.completedVideoIds?.length || 0;

  // Student subscription countdown timer calculation
  const subscriptionExpiresTime = currentUser?.subscriptionExpiresAt
    ? new Date(currentUser.subscriptionExpiresAt).getTime()
    : null;
  const isSubscriptionActive = Boolean(
    currentUser &&
    currentUser.role !== 'admin' &&
    subscriptionExpiresTime &&
    subscriptionExpiresTime > Date.now()
  );
  const remainingDays = isSubscriptionActive && subscriptionExpiresTime
    ? Math.max(1, Math.ceil((subscriptionExpiresTime - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Right side: Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              id="navbar-logo-btn"
              onClick={onGoHome}
              className="flex items-center gap-2.5 sm:gap-3 group text-right cursor-pointer min-w-0"
            >
              <div className="platform-logo-icon w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-lg sm:text-2xl text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                    منصة التميز
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-emerald-200 dark:border-emerald-800">
                    التعليمية
                  </span>
                </div>
                <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-300 font-medium truncate">
                  بيئة تعلم تفاعلية متكاملة للقدرات والاختبارات
                </p>
              </div>
            </button>

            {/* Breadcrumb if inside section */}
            {activeSectionTitle && !isAdminOpen && (
              <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 mr-4 border-r border-slate-200 dark:border-slate-700 pr-4">
                <button 
                  onClick={onGoHome}
                  className="hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors cursor-pointer"
                >
                  الرئيسية
                </button>
                <span>/</span>
                <span className="text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                  {activeSectionTitle}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              id="navbar-home-btn"
              onClick={onGoHome}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                !isAdminOpen 
                  ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60' 
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              الأقسام والمواد
            </button>

            {/* زر إحصائياتي */}
            <button
              id="navbar-stats-btn"
              onClick={onOpenStats || onOpenProfile}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50/70 dark:hover:bg-slate-800 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all cursor-pointer"
              title="عرض درجاتي في الاختبارات والفيديوهات التي تمت مشاهدتها"
            >
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>إحصائياتي</span>
            </button>

            {/* زر البث المباشر (يظهر فقط عند التفعيل) */}
            {liveStream?.isEnabled && liveStream?.streamUrl && (
              <a
                id="navbar-livestream-btn"
                href={liveStream.streamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap"
                title="البث المباشر متاح الآن - اضغط للانضمام"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <Radio className="w-4 h-4" />
                <span>البث المباشر</span>
              </a>
            )}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* User Profile / Auth */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* عداد اشتراك الطالب التنازلي المباشر */}
                {isSubscriptionActive && remainingDays !== null && remainingDays > 0 && (
                  <button
                    type="button"
                    onClick={onOpenProfile}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer border hover:scale-105 active:scale-95 ${
                      remainingDays <= 3
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/50 animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-blue-600/20'
                    }`}
                    title={`متبقي على اشتراكك في المنصة ${remainingDays} يوم (تاريخ الانتهاء: ${new Date(subscriptionExpiresTime!).toLocaleDateString('ar-SA')})`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {remainingDays === 1 ? '⏳ اليوم الأخير من اشتراكك!' : `⏳ متبقي على اشتراكك: ${remainingDays} يوم`}
                    </span>
                  </button>
                )}

                <button
                  id="navbar-profile-btn"
                  onClick={onOpenProfile}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/40 dark:hover:bg-slate-750 transition-all text-right cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-1">
                      <span>{currentUser.name}</span>
                      {currentUser.role === 'admin' && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1 rounded">مسؤول</span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5">
                        <Award className="w-3 h-3 text-amber-500" />
                        {completedTestsCount} اختبارات
                      </span>
                      <span>•</span>
                      <span>{completedVideosCount} درس</span>
                    </div>
                  </div>
                </button>

                {/* Dark/Light Mode toggle button next to account name */}
                {onToggleTheme && (
                  <button
                    id="navbar-theme-toggle-btn"
                    onClick={onToggleTheme}
                    title={theme === 'light' ? 'التبديل إلى الوضع الليلي' : 'التبديل إلى الوضع النهاري'}
                    aria-label={theme === 'light' ? 'التبديل إلى الوضع الليلي' : 'التبديل إلى الوضع النهاري'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs text-sm cursor-pointer"
                  >
                    {theme === 'light' ? '🌙' : '☀️'}
                  </button>
                )}

                <button
                  id="navbar-logout-btn"
                  onClick={onLogout}
                  title="تسجيل الخروج"
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="navbar-login-btn"
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  تسجيل الدخول / حساب طالب
                </button>

                {/* Dark/Light Mode toggle button */}
                {onToggleTheme && (
                  <button
                    id="navbar-theme-toggle-btn"
                    onClick={onToggleTheme}
                    title={theme === 'light' ? 'التبديل إلى الوضع الليلي' : 'التبديل إلى الوضع النهاري'}
                    aria-label={theme === 'light' ? 'التبديل إلى الوضع الليلي' : 'التبديل إلى الوضع النهاري'}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs text-sm cursor-pointer"
                  >
                    {theme === 'light' ? '🌙' : '☀️'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger & theme toggle */}
          <div className="flex items-center gap-2 md:hidden">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'light' ? 'الوضع الليلي' : 'الوضع النهاري'}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm cursor-pointer"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            )}

            <button
              id="navbar-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-4 pt-3 pb-5 space-y-3">
          {/* Live stream alert in mobile menu */}
          {liveStream?.isEnabled && liveStream?.streamUrl && (
            <a
              id="mobile-livestream-btn"
              href={liveStream.streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-900/20 animate-pulse"
            >
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4" />
                <span>البث المباشر قيد التشغيل الآن</span>
              </span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">انضمام ↗</span>
            </a>
          )}

          <button
            onClick={() => {
              onGoHome();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg text-sm font-semibold bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white border border-transparent dark:border-zinc-800"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              الأقسام والمواد التعليمية
            </span>
          </button>

          <button
            onClick={() => {
              if (onOpenStats) onOpenStats();
              else onOpenProfile();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-between p-3 rounded-lg text-sm font-semibold bg-slate-50 dark:bg-zinc-900 text-slate-800 dark:text-white border border-transparent dark:border-zinc-800"
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              إحصائياتي (الدرجات والفيديوهات)
            </span>
          </button>

          {currentUser ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              {/* عداد اشتراك الطالب التنازلي في الهاتف */}
              {isSubscriptionActive && remainingDays !== null && remainingDays > 0 && (
                <div
                  className={`w-full p-2.5 rounded-xl text-xs font-black flex items-center justify-between text-white border ${
                    remainingDays <= 3
                      ? 'bg-amber-500 border-amber-600 ring-2 ring-amber-400/50 animate-pulse'
                      : 'bg-blue-600 border-blue-700 shadow-sm shadow-blue-600/20'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-white" />
                    <span>
                      {remainingDays === 1 ? 'اليوم الأخير من اشتراكك!' : `متبقي على اشتراكك: ${remainingDays} يوم`}
                    </span>
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                    ينقص كل يوم
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  onOpenProfile();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-sm font-bold text-right"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div>{currentUser.name}</div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-normal">
                    {completedTestsCount} اختبارات منجزة • {completedVideosCount} دروس
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-emerald-700 text-white text-sm font-bold shadow-sm"
            >
              <User className="w-4 h-4" />
              تسجيل الدخول / حساب طالب
            </button>
          )}
        </div>
      )}
    </header>
  );
};
