import React, { useState } from 'react';
import { StudentUser, ResourceItem, SectionItem, VideoItem } from '../types';
import { 
  X, 
  Award, 
  Video, 
  CheckCircle2, 
  Calendar, 
  Bookmark, 
  TrendingUp, 
  Clock, 
  LogOut,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Play,
  BarChart3,
  BookOpen,
  Check,
  XCircle,
  HelpCircle,
  ListChecks
} from 'lucide-react';

interface StudentProfileModalProps {
  user: StudentUser;
  resources: ResourceItem[];
  sections: SectionItem[];
  videos?: VideoItem[];
  onClose: () => void;
  onLogout: () => void;
  onNavigateToResource: (sectionId: string, resourceId: string) => void;
  onPlayVideo?: (video: VideoItem) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  user,
  resources,
  sections,
  videos = [],
  onClose,
  onLogout,
  onNavigateToResource,
  onPlayVideo,
}) => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'videos' | 'bookmarks'>('quizzes');
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  const toggleExpandAttempt = (id: string) => {
    setExpandedAttemptId((prev) => (prev === id ? null : id));
  };

  const attempts = user.progress?.completedQuizAttempts || [];
  const completedVideoIds = user.progress?.completedVideoIds || [];
  const bookmarkedIds = user.progress?.bookmarkedResourceIds || [];

  // Find watched videos objects
  const watchedVideosList = completedVideoIds
    .map((vId) => videos.find((v) => v.id === vId))
    .filter(Boolean) as VideoItem[];

  // Metrics
  const totalTests = attempts.length;
  const passedTests = attempts.filter((a) => a.passed).length;
  const averagePercentage = totalTests > 0 
    ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / totalTests)
    : 0;

  const totalTimeSpentSeconds = attempts.reduce((acc, a) => acc + (a.timeSpentSeconds || 0), 0);
  const formatTotalTime = (secs: number) => {
    if (secs <= 0) return '0 ثانية';
    if (secs < 60) return `${secs} ثانية`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} دقيقة${s > 0 ? ` و ${s} ث` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>إحصائياتي وتقدمي التعليمي</span>
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{user.name}</h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Profile Card */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-right shadow-md">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center font-black text-2xl border border-white/20 shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-black">{user.name}</h3>
                  <span className="text-[11px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded font-bold">
                    طالب مسجل
                  </span>
                </div>
                <p className="text-xs text-slate-200">{user.email}</p>
                <p className="text-[11px] text-emerald-200/80 flex items-center justify-center sm:justify-start gap-1 pt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>تاريخ التسجيل: {new Date(user.createdAt).toLocaleDateString('ar-SA')}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer self-center sm:self-start shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer text-center ${
                activeTab === 'videos'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الفيديوهات المشاهدة</span>
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{completedVideoIds.length}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">فيديو مكتمل</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer text-center ${
                activeTab === 'quizzes'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">الاختبارات المجتازة</span>
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{passedTests}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">من {totalTests} اختبار</span>
            </button>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">المعدل التراكمي</span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{averagePercentage}%</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">متوسط درجاتي</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer text-center ${
                activeTab === 'bookmarks'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
              }`}
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">المصادر المحفوظة</span>
              <span className="text-2xl font-black text-teal-700 dark:text-teal-400">{bookmarkedIds.length}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">في المفضلة</span>
            </button>
          </div>

          {/* Student Subscription Progress & Expiration Card */}
          {user.subscriptionExpiresAt && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>مدة اشتراكك في المنصة:</span>
                  <strong className="text-blue-700 dark:text-blue-300">
                    {new Date(user.subscriptionExpiresAt).getTime() > Date.now()
                      ? `باقي ${Math.max(1, Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} يوم`
                      : 'انتهى الاشتراك'}
                  </strong>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  ينتهي: {new Date(user.subscriptionExpiresAt).toLocaleDateString('ar-SA')}
                </span>
              </div>

              {/* Progress Bar advancing towards end of time */}
              <div className="w-full h-2.5 bg-blue-200 dark:bg-blue-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        1,
                        Math.round(
                          ((Date.now() -
                            (user.subscriptionStartedAt
                              ? new Date(user.subscriptionStartedAt).getTime()
                              : new Date(user.subscriptionExpiresAt).getTime() -
                                (user.subscriptionDays || 30) * 86400000)) /
                            Math.max(
                              1000,
                              new Date(user.subscriptionExpiresAt).getTime() -
                                (user.subscriptionStartedAt
                                  ? new Date(user.subscriptionStartedAt).getTime()
                                  : new Date(user.subscriptionExpiresAt).getTime() -
                                    (user.subscriptionDays || 30) * 86400000)
                            )) *
                            100
                        )
                      )
                    )}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <span>تاريخ التفعيل: {user.subscriptionStartedAt ? new Date(user.subscriptionStartedAt).toLocaleDateString('ar-SA') : 'البداية'}</span>
                <span>المدة الإجمالية: {user.subscriptionDays || 30} يوماً</span>
              </div>
            </div>
          )}

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'quizzes'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>درجاتي في الاختبارات ({attempts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('videos')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>الفيديوهات المشاهدة ({completedVideoIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bookmarks')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'bookmarks'
                  ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">المفضلة</span>
              <span>({bookmarkedIds.length})</span>
            </button>
          </div>

          {/* 1. QUIZZES SCORES TAB */}
          {activeTab === 'quizzes' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  سجل جميع الاختبارات التي تم تقديمها مع درجاتها وتاريخها والوقت المستغرق:
                </span>
                <div className="flex items-center gap-2">
                  {totalTimeSpentSeconds > 0 && (
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <Clock className="w-3 h-3" />
                      <span>إجمالي وقت الحل: {formatTotalTime(totalTimeSpentSeconds)}</span>
                    </span>
                  )}
                  {attempts.length > 0 && (
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                      معدل النجاح: {Math.round((passedTests / totalTests) * 100)}%
                    </span>
                  )}
                </div>
              </div>

              {attempts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
                  <Award className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">لم تقدم أي اختبارات بعد</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    اختر أي درس من الأقسام التعليمية وابدأ حل الاختبار التفاعلي لتظهر درجاتك ومستواك هنا.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {attempts.map((attempt) => {
                    const isExpanded = expandedAttemptId === attempt.id;
                    const hasDetails = Array.isArray(attempt.questionsDetails) && attempt.questionsDetails.length > 0;

                    return (
                      <div
                        key={attempt.id}
                        className="rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 overflow-hidden text-right shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                {attempt.quizTitle}
                              </span>
                              {attempt.isExternal && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                                  اختبار خارجي مكتمل
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                attempt.passed 
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' 
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              }`}>
                                {attempt.passed ? 'ناجح ومجتاز' : 'يحتاج مراجعة'}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                              {attempt.sectionTitle && <span>{attempt.sectionTitle}</span>}
                              {attempt.sectionTitle && <span>•</span>}
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                الموعد: {new Date(attempt.timestamp).toLocaleDateString('ar-SA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                الوقت: {new Date(attempt.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {(attempt.timeSpentFormatted && !attempt.isExternal) && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800/60">
                                    <Clock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                    <span>الوقت المستغرق: {attempt.timeSpentFormatted}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-left bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700/60">
                              <div className="text-sm font-black text-slate-900 dark:text-white">
                                <span className="text-xs text-slate-400 font-normal ml-1">الدرجة:</span>
                                {attempt.score} <span className="text-xs text-slate-400 font-normal">/ {attempt.totalQuestions}</span>
                              </div>
                              <div className={`text-xs font-black text-left ${attempt.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {attempt.percentage}%
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleExpandAttempt(attempt.id)}
                              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                isExpanded
                                  ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                              title="عرض تفاصيل الأسئلة والإجابات"
                            >
                              <ListChecks className="w-4 h-4" />
                              <span className="hidden sm:inline text-xs">{isExpanded ? 'إخفاء التفاصيل' : 'تفاصيل الاختبار'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Question Details */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                                <span>تفاصيل إجابات الطالب في هذا الاختبار ({attempt.score} إجابة صحيحة من {attempt.totalQuestions}):</span>
                              </h4>
                              {attempt.timeSpentFormatted && (
                                <span className="text-[11px] text-slate-400">الوقت: {attempt.timeSpentFormatted}</span>
                              )}
                            </div>

                            {hasDetails ? (
                              <div className="space-y-2.5">
                                {attempt.questionsDetails!.map((qDetail, qIdx) => (
                                  <div
                                    key={qDetail.questionId || qIdx}
                                    className={`p-3 rounded-xl border text-right space-y-2 ${
                                      qDetail.isCorrect
                                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                          qDetail.isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-rose-600 text-white'
                                        }`}>
                                          {qIdx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                                          {qDetail.questionText}
                                        </span>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                                        qDetail.isCorrect
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                                      }`}>
                                        {qDetail.isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                                      </span>
                                    </div>

                                    {/* Options & Answers */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-400 text-[10px] block mb-0.5">إجابتك المختارة:</span>
                                        <span className={`font-bold ${
                                          qDetail.isCorrect
                                            ? 'text-emerald-700 dark:text-emerald-400'
                                            : 'text-rose-700 dark:text-rose-400'
                                        }`}>
                                          {qDetail.userAnswerIndex >= 0 && qDetail.options[qDetail.userAnswerIndex]
                                            ? qDetail.options[qDetail.userAnswerIndex]
                                            : 'لم يتم الاختيار'}
                                        </span>
                                      </div>

                                      {!qDetail.isCorrect && (
                                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block mb-0.5">الإجابة الصحيحة:</span>
                                          <span className="font-bold text-emerald-800 dark:text-emerald-300">
                                            {qDetail.options[qDetail.correctAnswerIndex] || 'الخيار الصحيح'}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {qDetail.explanation && (
                                      <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                        <span className="font-bold text-indigo-700 dark:text-indigo-400 ml-1">توضيح الحل:</span>
                                        {qDetail.explanation}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                تم تسجيل هذا الاختبار بنسبة نجاح <strong>{attempt.percentage}%</strong> ({attempt.score} من {attempt.totalQuestions}). تفاصيل الأسئلة التفصيلية تظهر للاختبارات المسلمة حديثاً.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. WATCHED VIDEOS TAB */}
          {activeTab === 'videos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  قائمة بجميع الشروحات والفيديوهات التي أتممت مشاهدتها:
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                  {completedVideoIds.length} فيديو
                </span>
              </div>

              {completedVideoIds.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
                  <Video className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">لم تقم بتحديد أي فيديوهات كمشاهدة بعد</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    عند مشاهدة أي فيديو تعليمي، اضغط على زر "تحديد كـ تمت المشاهدة" ليتم حفظه وإدراجه هنا تلقائياً في سجل إنجازاتك.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {completedVideoIds.map((vId) => {
                    const vid = videos.find((v) => v.id === vId);
                    const sec = vid ? sections.find((s) => s.id === vid.sectionId) : null;
                    return (
                      <div
                        key={vId}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-right shadow-2xs hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                {vid?.title || `فيديو تعليمي (${vId})`}
                              </span>
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                                تمت المشاهدة
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              {sec && <span>{sec.title}</span>}
                              {sec && vid?.durationMinutes && <span>•</span>}
                              {vid?.durationMinutes ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {vid.durationMinutes} دقيقة
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {vid && onPlayVideo && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onPlayVideo(vid);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-700 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Play className="w-3 h-3" />
                            <span>مشاهدة مجدداً</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. BOOKMARKS TAB */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                المصادر والدروس المحفوظة للمراجعة السريعة:
              </span>

              {bookmarkedIds.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
                  <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">لا توجد مصادر محفوظة حالياً</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    يمكنك حفظ أي مصدر بالضغط على أيقونة النجمة أو الإشارة المرجعية لتسهيل العودة إليه في أي وقت.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {bookmarkedIds.map((bId) => {
                    const res = resources.find((r) => r.id === bId);
                    if (!res) return null;
                    return (
                      <button
                        key={bId}
                        onClick={() => {
                          onClose();
                          onNavigateToResource(res.sectionId, res.id);
                        }}
                        className="p-3.5 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 text-right flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                            {res.title}
                          </span>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
