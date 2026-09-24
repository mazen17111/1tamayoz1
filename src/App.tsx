import React, { useState, useEffect, Suspense, lazy } from 'react';
import { PlatformData, StudentUser, Quiz, VideoItem, QuizAttempt, FileItem, PlatformLayoutPreset } from './types';
import { initialPlatformData } from './defaultData';
import { apiService } from './services/api';
import { Navbar } from './components/Navbar';
import { SectionsView } from './components/SectionsView';
import { ResourceView } from './components/ResourceView';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { MaintenanceLockScreen } from './components/MaintenanceLockScreen';
import { SplitStudioLayout } from './components/SplitStudioLayout';

// Lazy load heavy admin tools and interactive modals for ultra-fast initial page loading
const QuizModal = lazy(() => import('./components/QuizModal').then(m => ({ default: m.QuizModal })));
const VideoPlayerModal = lazy(() => import('./components/VideoPlayerModal').then(m => ({ default: m.VideoPlayerModal })));
const FileViewerModal = lazy(() => import('./components/FileViewerModal').then(m => ({ default: m.FileViewerModal })));
const StudentProfileModal = lazy(() => import('./components/StudentProfileModal').then(m => ({ default: m.StudentProfileModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ExternalQuizConfirmModal = lazy(() => import('./components/ExternalQuizConfirmModal').then(m => ({ default: m.ExternalQuizConfirmModal })));
import { 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [platformData, setPlatformData] = useState<PlatformData>(() => {
    try {
      const cached = apiService.getCachedPlatformData();
      const savedThemeRaw = typeof window !== 'undefined' ? localStorage.getItem('tamayuz_platform_theme') : null;
      const savedPresetRaw = typeof window !== 'undefined' ? localStorage.getItem('tamayuz_layout_preset') : null;
      let effectiveTheme = initialPlatformData.settings?.theme;
      if (savedThemeRaw) {
        try {
          effectiveTheme = { ...effectiveTheme, ...JSON.parse(savedThemeRaw) };
        } catch {}
      }
      if (savedPresetRaw && effectiveTheme) {
        effectiveTheme = { ...effectiveTheme, layoutPreset: savedPresetRaw as any };
      }
      if (!effectiveTheme?.layoutPreset || (effectiveTheme.layoutPreset as string) === 'classic') {
        effectiveTheme = { ...(effectiveTheme || {}), layoutPreset: 'sidebar-split-right' } as any;
      }
      if (cached && Array.isArray(cached.sections) && cached.sections.length > 0) {
        return {
          ...cached,
          settings: {
            ...cached.settings,
            theme: effectiveTheme || cached.settings?.theme || initialPlatformData.settings?.theme,
          },
        };
      }
      return {
        ...initialPlatformData,
        settings: {
          ...initialPlatformData.settings,
          theme: effectiveTheme || initialPlatformData.settings?.theme,
        },
      };
    } catch {
      return initialPlatformData;
    }
  });
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Navigation State
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [adminKey, setAdminKey] = useState<number>(0);

  const handleOpenAdmin = () => {
    sessionStorage.removeItem('tamayuz_admin_token');
    localStorage.removeItem('tamayuz_admin_token');
    setAdminKey((prev) => prev + 1);
    setIsAdminOpen(true);
    setSelectedSectionId(null);
  };

  // Theme state: dark / light
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('tamayuz_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('tamayuz_theme', theme);
  }, [theme]);

  // Real-time custom theme and layout sync across components and tabs
  useEffect(() => {
    const handleThemeUpdate = (e: any) => {
      const updatedTheme = e.detail;
      if (updatedTheme) {
        if (updatedTheme.layoutPreset) {
          try {
            localStorage.setItem('tamayuz_layout_preset', updatedTheme.layoutPreset);
          } catch {}
        }
        setPlatformData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            theme: updatedTheme,
          } as any,
        }));
      }
    };
    window.addEventListener('tamayuz_theme_updated', handleThemeUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('tamayuz_theme');
      bc.onmessage = (event) => {
        if (event.data?.theme) {
          const incomingTheme = event.data.theme;
          if (incomingTheme.layoutPreset) {
            try {
              localStorage.setItem('tamayuz_layout_preset', incomingTheme.layoutPreset);
            } catch {}
          }
          setPlatformData((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              theme: incomingTheme,
            } as any,
          }));
        }
      };
    } catch {}
    return () => {
      window.removeEventListener('tamayuz_theme_updated', handleThemeUpdate);
      bc?.close();
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'login' | 'register'>('login');
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);

  // External quiz confirmation state
  const [externalQuizToConfirm, setExternalQuizToConfirm] = useState<Quiz | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load initial data with zero-latency multi-tier acceleration
  const loadData = async () => {
    // 1. Stage 0: 0ms Instant display from cache (LocalStorage / In-Memory)
    const cached = apiService.getCachedPlatformData();
    if (cached && Array.isArray(cached.sections) && cached.sections.length > 0) {
      setPlatformData(cached);
      setIsLoading(false);
    }

    // 2. Stage 1: Ultra-fast local server response (< 30ms) for fresh content
    try {
      const fastServer = await apiService.fetchServerDataFast();
      if (fastServer && Array.isArray(fastServer.sections) && fastServer.sections.length > 0) {
        setPlatformData((prev) => ({
          ...fastServer,
          settings: {
            ...fastServer.settings,
            theme: prev.settings?.theme || fastServer.settings?.theme,
          },
        }));
        setIsLoading(false);
      }
    } catch {}

    // 3. Stage 2: Background consolidation across Firebase Firestore and Server
    try {
      const data = await apiService.fetchPlatformData();
      if (data && Array.isArray(data.sections) && data.sections.length > 0) {
        setPlatformData(data);
      }
    } catch (err) {
      console.warn('Error loading platform data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const student = apiService.getCurrentStudent();
    if (student) {
      setCurrentUser(student);
    }

    // Auto refresh when student returns to tab (debounced by 15s to keep device fast)
    let lastVisibilitySync = Date.now();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastVisibilitySync > 15000) {
          lastVisibilitySync = now;
          loadData();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Real-time synchronization for Live Stream (active only when tab is visible)
    const checkLiveStreamState = async () => {
      if (document.hidden) return;
      try {
        const stream = await apiService.fetchLiveStream();
        setPlatformData((prev) => {
          if (!prev) return prev;
          if (
            prev.liveStream?.isEnabled !== stream.isEnabled ||
            prev.liveStream?.streamUrl !== stream.streamUrl ||
            prev.liveStream?.title !== stream.title ||
            prev.liveStream?.description !== stream.description ||
            prev.liveStream?.scheduledTime !== stream.scheduledTime
          ) {
            return { ...prev, liveStream: stream };
          }
          return prev;
        });
      } catch {
        // silent fail
      }
    };

    const streamPollingInterval = setInterval(checkLiveStreamState, 12000);

    // Cross-tab broadcast listener
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('tamayuz_livestream');
      bc.onmessage = (event) => {
        if (event.data) {
          setPlatformData((prev) => (prev ? { ...prev, liveStream: event.data } : prev));
        }
      };
    } catch {
      // Fallback
    }

    // In-window custom event listener
    const handleStreamEvent = (e: any) => {
      if (e.detail) {
        setPlatformData((prev) => (prev ? { ...prev, liveStream: e.detail } : prev));
      }
    };
    window.addEventListener('tamayuz_livestream_updated', handleStreamEvent);

    // Cross-tab broadcast listener for announcement
    let announcementBc: BroadcastChannel | null = null;
    try {
      announcementBc = new BroadcastChannel('tamayuz_announcement');
      announcementBc.onmessage = (event) => {
        if (event.data) {
          setPlatformData((prev) => (prev ? { ...prev, settings: { ...prev.settings, announcement: event.data } } : prev));
        }
      };
    } catch {
      // Fallback
    }

    // In-window announcement listener
    const handleAnnouncementEvent = (e: any) => {
      if (e.detail) {
        setPlatformData((prev) => (prev ? { ...prev, settings: { ...prev.settings, announcement: e.detail } } : prev));
      }
    };
    window.addEventListener('tamayuz_announcement_updated', handleAnnouncementEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(streamPollingInterval);
      if (bc) bc.close();
      if (announcementBc) announcementBc.close();
      window.removeEventListener('tamayuz_livestream_updated', handleStreamEvent);
      window.removeEventListener('tamayuz_announcement_updated', handleAnnouncementEvent);
    };
  }, []);

  // Handlers
  const handleSelectSection = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setIsAdminOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToSections = () => {
    setSelectedSectionId(null);
  };

  const handleToggleBookmark = async (resourceId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const updated = await apiService.recordProgress({
      userId: currentUser.id,
      bookmarkedResourceId: resourceId,
    });
    if (updated) {
      setCurrentUser(updated);
    }
  };

  const handlePlayVideo = (video: VideoItem) => {
    if (!currentUser) {
      setAuthPromptMessage('يرجى تسجيل الدخول أو إنشاء حساب طالب جديد لمشاهدة شروحات الدروس التعليمية والفيديوهات.');
      setIsAuthModalOpen(true);
      return;
    }
    setActiveVideo(video);
  };

  const handleOpenFile = (file: FileItem) => {
    if (!currentUser) {
      setAuthPromptMessage('يرجى تسجيل الدخول أو إنشاء حساب طالب للاطلاع على المذكرات والملفات التعليمية وتحميلها.');
      setIsAuthModalOpen(true);
      return;
    }
    const fileUrl = file.fileUrl?.trim() || '';
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleVideoComplete = async (videoId: string, explicitAction?: 'add' | 'remove') => {
    if (!currentUser) {
      setAuthPromptMessage('يرجى تسجيل الدخول أو إنشاء حساب طالب لمتابعة وتحديد الدروس المكتملة.');
      setIsAuthModalOpen(true);
      return;
    }
    const student = currentUser;

    const currentCompleted = student.progress?.completedVideoIds || [];
    const isAlreadyCompleted = currentCompleted.includes(videoId);
    const action: 'add' | 'remove' = explicitAction || (isAlreadyCompleted ? 'remove' : 'add');

    const newCompleted = action === 'remove'
      ? currentCompleted.filter((id) => id !== videoId)
      : Array.from(new Set([...currentCompleted, videoId]));

    // Optimistic local update for instant UI feedback
    const optimisticUser: StudentUser = {
      ...student,
      progress: {
        ...student.progress,
        completedVideoIds: newCompleted,
      },
    };
    setCurrentUser(optimisticUser);
    apiService.saveCurrentStudent(optimisticUser);

    try {
      const updated = await apiService.recordProgress({
        userId: student.id,
        videoId: videoId,
        action: action,
        completedVideoIds: newCompleted,
      });
      if (updated && updated.progress?.completedVideoIds) {
        setCurrentUser(updated);
      }
    } catch (e) {
      console.warn('Could not sync video progress:', e);
    }
  };

  const handleOpenStats = () => {
    if (!currentUser) {
      setAuthPromptMessage('يرجى تسجيل الدخول أو إنشاء حساب لعرض صفحة "إحصائياتي" ومتابعة درجاتك في الاختبارات والفيديوهات التي شاهدتها.');
      setIsAuthModalOpen(true);
      return;
    }
    setIsProfileModalOpen(true);
  };

  const handleStartQuiz = (quiz: Quiz) => {
    if (!currentUser) {
      setAuthPromptMessage('يرجى تسجيل الدخول أو إنشاء حساب طالب جديد لبدء وحل الاختبارات وحفظ درجاتك.');
      setIsAuthModalOpen(true);
      return;
    }
    if (quiz.isExternal && quiz.externalUrl) {
      let targetUrl = quiz.externalUrl.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
      }
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      // Set external quiz for confirmation modal when student returns
      setExternalQuizToConfirm(quiz);
      return;
    }
    setActiveQuiz(quiz);
  };

  const handleConfirmExternalQuiz = async (quiz: Quiz) => {
    if (!currentUser) return;
    try {
      const updatedUser = await apiService.recordExternalQuizAttempt(
        currentUser,
        quiz
      );
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
      showToast(`تم تسجيل إتمام اختبار "${quiz.title}" وإضافته لإحصائياتك بنجاح!`);
    } catch (e) {
      console.warn('Could not record external quiz attempt:', e);
    } finally {
      setExternalQuizToConfirm(null);
    }
  };

  const handleQuizComplete = async (attemptData: Omit<QuizAttempt, 'id' | 'timestamp'>) => {
    const fullAttempt: QuizAttempt = {
      ...attemptData,
      id: `att-${Date.now()}`,
      timestamp: new Date().toISOString(),
      studentName: currentUser?.name || 'طالب متميز',
      studentEmail: currentUser?.email || '',
    };

    if (!currentUser) {
      // Auto create guest session for quick progress persistence
      const guest = await apiService.register(
        'طالب متميز',
        `guest-${Date.now()}@tamayuz.edu`,
        '123456'
      );
      setCurrentUser(guest);
      const updated = await apiService.recordProgress({
        userId: guest.id,
        quizAttempt: fullAttempt,
      });
      if (updated) setCurrentUser(updated);
      return;
    }

    const updated = await apiService.recordProgress({
      userId: currentUser.id,
      quizAttempt: fullAttempt,
    });
    if (updated) {
      setCurrentUser(updated);
    }
  };

  const handleLogout = () => {
    apiService.saveCurrentStudent(null);
    setCurrentUser(null);
    setActiveQuiz(null);
    setActiveVideo(null);
    setActiveFile(null);
    setIsProfileModalOpen(false);
    setIsAdminOpen(false);
  };

  const handleAuthSuccess = (user: StudentUser) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setIsAdminOpen(true);
    }
  };

  // Find active section
  const activeSection = selectedSectionId
    ? platformData.sections.find((s) => s.id === selectedSectionId)
    : null;

  // Platform Lockdown / Maintenance Calculation
  const isPlatformLocked = Boolean(platformData.settings?.access?.isLocked);
  const allowedStudentEmails = platformData.settings?.access?.allowedStudentEmails || [];
  const blockedStudentEmails = (platformData.settings?.access?.blockedStudentEmails || []).map((e) => e.trim().toLowerCase());
  const currentUserEmail = (currentUser?.email || '').trim().toLowerCase();

  const isCurrentUserApproved =
    currentUser?.role === 'admin' ||
    (currentUserEmail &&
      allowedStudentEmails.some((e) => e.toLowerCase() === currentUserEmail));

  // Individual lockdown check: if admin blocked this student specifically even while platform is open
  const isIndividuallyBlocked = Boolean(
    currentUser &&
    currentUser.role !== 'admin' &&
    (currentUser.isIndividuallyBlocked || (currentUserEmail && blockedStudentEmails.includes(currentUserEmail)))
  );

  // Guest lockdown: completely lock all videos, files, quizzes and content for non-logged in users as explicitly requested!
  const isGuestLocked = !currentUser;

  // If guest OR individually blocked OR (locked and not admin/approved) and not in admin dashboard, show lock screen
  const showLockScreen = !isAdminOpen && (isGuestLocked || isIndividuallyBlocked || (isPlatformLocked && !isCurrentUserApproved));

  // Theme and layout configuration: instant resolution so saved layout appears immediately with 0 delay or flash
  const savedLayoutPreset = typeof window !== 'undefined' ? localStorage.getItem('tamayuz_layout_preset') : null;
  const savedThemeRaw = typeof window !== 'undefined' ? localStorage.getItem('tamayuz_platform_theme') : null;
  const savedThemeConfig = savedThemeRaw ? (() => { try { return JSON.parse(savedThemeRaw); } catch { return null; } })() : null;

  const rawLayoutPreset =
    platformData.settings?.theme?.layoutPreset ||
    savedLayoutPreset ||
    savedThemeConfig?.layoutPreset;

  const layoutPreset: PlatformLayoutPreset = (rawLayoutPreset && rawLayoutPreset !== 'classic')
    ? (rawLayoutPreset as PlatformLayoutPreset)
    : 'sidebar-split-right';

  const themePreset = savedThemeConfig?.preset || platformData.settings?.theme?.preset || 'emerald';
  const borderRadius = savedThemeConfig?.borderRadius || platformData.settings?.theme?.borderRadius || 'standard';
  const density = savedThemeConfig?.density || platformData.settings?.theme?.density || 'comfortable';
  const fontScale = savedThemeConfig?.fontScale || platformData.settings?.theme?.fontScale || 'normal';

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-emerald-100 selection:text-emerald-900 font-['Cairo',sans-serif] transition-colors duration-200 overflow-x-hidden w-full max-w-full theme-${themePreset} radius-${borderRadius} density-${density} font-scale-${fontScale}`}>
      
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        isAdminOpen={isAdminOpen}
        activeSectionTitle={activeSection?.title}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => {
          setAuthModalInitialMode('login');
          setIsAuthModalOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenStats={handleOpenStats}
        onOpenAdmin={handleOpenAdmin}
        onGoHome={() => {
          setIsAdminOpen(false);
          setSelectedSectionId(null);
        }}
        onLogout={handleLogout}
        liveStream={platformData.liveStream}
      />

      {/* Global Announcement Alert Bar */}
      <AnnouncementBanner announcement={platformData.settings?.announcement} />

      {/* Platform Content or Lockdown Screen */}
      {showLockScreen ? (
        <MaintenanceLockScreen
          accessConfig={platformData.settings?.access}
          lockMessage={platformData.settings?.access?.lockMessage}
          currentUser={currentUser}
          isIndividuallyBlocked={isIndividuallyBlocked}
          isGuestLocked={isGuestLocked}
          onOpenAdmin={handleOpenAdmin}
          onOpenAuth={(mode?: 'login' | 'register') => {
            setAuthModalInitialMode(mode || 'login');
            setIsAuthModalOpen(true);
          }}
          onLogout={handleLogout}
          onRefresh={loadData}
        />
      ) : (
        /* Main Content Area */
        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-8 sm:pb-12">
          
          {isAdminOpen ? (
            /* ADMIN DASHBOARD VIEW - Remounts with fresh state every time */
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center p-16 gap-3">
                <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-bold">جاري فتح لوحة التحكم...</p>
              </div>
            }>
              <AdminDashboard
                key={adminKey}
                platformData={platformData}
                currentUser={currentUser}
                onRefreshData={loadData}
                onClose={() => setIsAdminOpen(false)}
              />
            </Suspense>
          ) : layoutPreset !== 'classic' ? (
            /* CUSTOM / STUDIO LAYOUT PRESET (Sidebar Split / Cinema Wide / Bento) */
            <SplitStudioLayout
              layoutPreset={layoutPreset}
              sections={platformData.sections}
              resources={platformData.resources}
              videos={platformData.videos}
              files={platformData.files}
              quizzes={platformData.quizzes}
              currentUser={currentUser}
              activeSectionId={selectedSectionId || platformData.sections[0]?.id || ''}
              activeVideo={activeVideo}
              onSelectSection={(secId) => setSelectedSectionId(secId)}
              onSelectVideo={(_video) => {
                // In-place playback inside right-side stage handled directly by SplitStudioLayout
              }}
              onCloseInlineVideo={() => setActiveVideo(null)}
              onStartQuiz={handleStartQuiz}
              onOpenFile={handleOpenFile}
              onOpenFileLocked={(_file) => {
                setAuthPromptMessage('يرجى تسجيل الدخول أو إنشاء حساب طالب للاطلاع على المذكرات والملفات التعليمية وتحميلها.');
                setIsAuthModalOpen(true);
              }}
              onToggleBookmark={handleToggleBookmark}
              onToggleVideoComplete={handleToggleVideoComplete}
              onOpenFullscreenVideo={(video) => handlePlayVideo(video)}
              onBackToSections={handleBackToSections}
            />
          ) : activeSection ? (
            /* SECTION RESOURCES VIEW (Default Classic) */
            <ResourceView
              section={activeSection}
              resources={platformData.resources.filter((r) => r.sectionId === activeSection.id)}
              videos={platformData.videos.filter((v) => v.sectionId === activeSection.id)}
              files={platformData.files.filter((f) => f.sectionId === activeSection.id)}
              quizzes={platformData.quizzes.filter((q) => q.sectionId === activeSection.id)}
              currentUser={currentUser}
              onBackToSections={handleBackToSections}
              onPlayVideo={handlePlayVideo}
              onStartQuiz={handleStartQuiz}
              onToggleBookmark={handleToggleBookmark}
              onToggleVideoComplete={handleToggleVideoComplete}
              onOpenFile={handleOpenFile}
              onOpenFileLocked={(_file) => {
                setAuthPromptMessage('يرجى تسجيل الدخول أو إنشاء حساب طالب للاطلاع على المذكرات والملفات التعليمية وتحميلها.');
                setIsAuthModalOpen(true);
              }}
            />
          ) : (
            /* ALL SECTIONS VIEW (Default Classic Landing & Selection) */
            <SectionsView
              sections={platformData.sections}
              resources={platformData.resources}
              videos={platformData.videos}
              files={platformData.files}
              quizzes={platformData.quizzes}
              currentUser={currentUser}
              onSelectSection={handleSelectSection}
              onOpenAdmin={handleOpenAdmin}
              liveStream={platformData.liveStream}
            />
          )}

        </main>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 sm:py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">منصة التميز التعليمية</span>
            <span className="text-slate-400 dark:text-slate-500">© {new Date().getFullYear()}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span>نظام تعليمي ديناميكي متطور</span>
            <span>•</span>
            <span>حفظ ومزامنة فورية للبيانات</span>
            <span>•</span>
            <span>تصحيح ذاتي فوري للاختبارات</span>
          </div>

          <button
            onClick={handleOpenAdmin}
            title="الإدارة"
            aria-label="لوحة تحكم المسؤول"
            className="w-5 h-5 rounded flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer opacity-30 hover:opacity-100"
          >
            <ShieldCheck className="w-3 h-3" />
          </button>
        </div>
      </footer>

      {/* Ultra-Discreet Side Admin Button (Tiny, circular, elegant icon on the side of the page, completely unobtrusive) */}
      {!isAdminOpen && (
        <button
          id="side-admin-button"
          onClick={handleOpenAdmin}
          title="الإدارة"
          aria-label="لوحة تحكم المسؤول"
          className="fixed bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-30 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-xs border border-slate-200/60 dark:border-slate-700/60 text-slate-400/80 hover:text-slate-700 dark:text-slate-500/80 dark:hover:text-slate-200 flex items-center justify-center opacity-25 hover:opacity-90 transition-all shadow-xs cursor-pointer"
        >
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      )}

      {/* MODALS (Lazy Loaded with Suspense) */}
      <Suspense fallback={null}>
        {/* 1. Interactive Quiz Modal */}
        {activeQuiz && currentUser && (
          <QuizModal
            quiz={activeQuiz}
            sectionTitle={
              platformData.sections.find((s) => s.id === activeQuiz.sectionId)?.title || 'القسم'
            }
            resourceTitle={
              platformData.resources.find((r) => r.id === activeQuiz.resourceId)?.title || 'المصدر'
            }
            onClose={() => setActiveQuiz(null)}
            onComplete={handleQuizComplete}
          />
        )}

        {/* 2. Video Player Modal */}
        {activeVideo && currentUser && (
          <VideoPlayerModal
            video={activeVideo}
            linkedQuiz={platformData.quizzes.find(
              (q) => q.id === activeVideo.linkedQuizId || q.linkedVideoId === activeVideo.id
            )}
            isCompleted={currentUser?.progress?.completedVideoIds?.includes(activeVideo.id) || false}
            onClose={() => setActiveVideo(null)}
            onToggleComplete={handleToggleVideoComplete}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {/* 3. Student Profile Modal */}
        {isProfileModalOpen && currentUser && (
          <StudentProfileModal
            user={currentUser}
            resources={platformData.resources}
            sections={platformData.sections}
            videos={platformData.videos}
            onClose={() => setIsProfileModalOpen(false)}
            onLogout={handleLogout}
            onNavigateToResource={(secId) => {
              setSelectedSectionId(secId);
            }}
            onPlayVideo={handlePlayVideo}
          />
        )}

        {/* 4. Auth (Login / Register) Modal */}
        {isAuthModalOpen && (
          <AuthModal
            initialMode={authModalInitialMode}
            promptMessage={authPromptMessage}
            onClose={() => {
              setIsAuthModalOpen(false);
              setAuthPromptMessage(null);
            }}
            onSuccess={(user) => {
              handleAuthSuccess(user);
              setAuthPromptMessage(null);
            }}
          />
        )}

        {/* 5. Interactive In-App File Viewer Modal */}
        {activeFile && currentUser && (
          <FileViewerModal
            file={activeFile}
            sectionTitle={
              platformData.sections.find((s) => s.id === activeFile.sectionId)?.title || 'المذكرات والملفات التعليمية'
            }
            onClose={() => setActiveFile(null)}
          />
        )}

        {/* 6. External Quiz Confirmation Modal */}
        {externalQuizToConfirm && (
          <ExternalQuizConfirmModal
            quiz={externalQuizToConfirm}
            onConfirm={handleConfirmExternalQuiz}
            onCancel={() => setExternalQuizToConfirm(null)}
          />
        )}
      </Suspense>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-xl border border-slate-700 dark:border-slate-200 text-xs sm:text-sm font-black flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
