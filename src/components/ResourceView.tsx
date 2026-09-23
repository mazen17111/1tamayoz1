import React, { useState } from 'react';
import { 
  SectionItem, 
  ResourceItem, 
  VideoItem, 
  FileItem, 
  Quiz, 
  StudentUser 
} from '../types';
import { 
  ArrowRight, 
  Video, 
  FileText, 
  CheckCircle2, 
  Play, 
  Download, 
  ExternalLink, 
  Clock, 
  Layers, 
  Check, 
  Bookmark, 
  HelpCircle, 
  Sparkles, 
  BookOpen, 
  Eye, 
  Lock,
  ChevronUp,
  ChevronDown,
  Star
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface ResourceViewProps {
  section: SectionItem;
  resources: ResourceItem[];
  videos: VideoItem[];
  files: FileItem[];
  quizzes: Quiz[];
  currentUser: StudentUser | null;
  onBackToSections: () => void;
  onPlayVideo: (video: VideoItem) => void;
  onStartQuiz: (quiz: Quiz) => void;
  onToggleBookmark: (resourceId: string) => void;
  onToggleVideoComplete?: (videoId: string) => void;
  onOpenFileLocked?: (file: FileItem) => void;
  onOpenFile?: (file: FileItem) => void;
  onOpenAuth?: () => void;
}

export const ResourceView: React.FC<ResourceViewProps> = ({
  section,
  resources,
  videos,
  files,
  quizzes,
  currentUser,
  onBackToSections,
  onPlayVideo,
  onStartQuiz,
  onToggleBookmark,
  onToggleVideoComplete,
  onOpenFileLocked,
  onOpenFile,
  onOpenAuth,
}) => {
  // Select active resource
  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    resources.length > 0 ? resources[0].id : ''
  );

  // Active tab: 'videos' | 'files' | 'quizzes'
  const [activeTab, setActiveTab] = useState<'videos' | 'files' | 'quizzes'>('videos');

  // Collapsible Sources & Courses state (to fold and save space so lessons/quizzes move up)
  const [isResourcesCollapsed, setIsResourcesCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tamayuz_resources_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleResourcesCollapsed = () => {
    setIsResourcesCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tamayuz_resources_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const activeResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  const resourceVideos = videos.filter((v) => v.resourceId === activeResource?.id);
  const resourceFiles = files.filter((f) => f.resourceId === activeResource?.id);
  const resourceQuizzes = quizzes.filter((q) => q.resourceId === activeResource?.id);

  const isBookmarked = Boolean(currentUser?.progress?.bookmarkedResourceIds?.includes(activeResource?.id || ''));

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3.5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            id="back-to-sections-btn"
            onClick={onBackToSections}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-bold cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>العودة للأقسام</span>
          </button>

          <div className="h-5 sm:h-6 w-px bg-slate-200 dark:bg-slate-800 hidden xs:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center font-bold shrink-0">
              <DynamicIcon name={section.iconName} className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 font-medium block">القسم الحالي</span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{section.title}</h2>
            </div>
          </div>
        </div>

        <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-100 dark:border-slate-750 self-start sm:self-auto">
          يحتوي هذا القسم على <strong className="text-slate-800 dark:text-slate-200">{resources.length}</strong> مصادر تعليمية
        </div>
      </div>

      {/* Resources Selector Pills */}
      {resources.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 text-center border border-dashed border-slate-300 dark:border-slate-800">
          <Layers className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 mb-1">لا توجد مصادر مضافة في هذا القسم حاليًا</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">يمكن للمسؤول إضافة مصادر وشروحات واختبارات من لوحة التحكم.</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* 1. SOURCES AND COURSES AREA (COLLAPSIBLE TO SAVE SPACE) */}
          {isResourcesCollapsed ? (
            /* SLIM COLLAPSED BAR: Saves vertical space and brings tabs directly up */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border-2 border-emerald-600/30 dark:border-emerald-500/30 shadow-xs flex flex-wrap items-center justify-between gap-3 text-right animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-bold shrink-0">المصادر والدورات:</span>
                    <button
                      type="button"
                      id="expand-resources-arrow-btn"
                      onClick={toggleResourcesCollapsed}
                      className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer shadow-xs border border-emerald-300 dark:border-emerald-800 hover:scale-105"
                      title="فتح وتوسيع المصادر والدورات"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      {activeResource?.title}
                    </span>
                    {isBookmarked && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500 text-white font-black flex items-center gap-1 shadow-2xs shrink-0">
                        <Star className="w-3 h-3 fill-white" />
                        <span>محفوظ</span>
                      </span>
                    )}
                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                      {activeResource?.level}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 mr-auto sm:mr-0">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(activeResource.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                    isBookmarked
                      ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/40'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white text-white' : ''}`} />
                  <span>{isBookmarked ? 'محفوظ' : 'حفظ'}</span>
                </button>

                <button
                  type="button"
                  id="expand-resources-btn"
                  onClick={toggleResourcesCollapsed}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                  title="توسيع وعرض المصادر والدورات"
                >
                  <span>توسيع المصادر</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* EXPANDED SOURCES & COURSES */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Collapse Action Bar & Selector Title */}
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">
                  <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>المصادر والدورات</span>
                  <button
                    type="button"
                    id="collapse-resources-arrow-btn"
                    onClick={toggleResourcesCollapsed}
                    className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs hover:scale-105"
                    title="غلق هذا المصدر لتصعد الشروحات والاختبارات والملفات للأعلى وتوفير المساحة"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 text-xs font-normal">({resources.length}):</span>
                </div>
                <button
                  type="button"
                  id="collapse-resources-btn"
                  onClick={toggleResourcesCollapsed}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-black transition-all cursor-pointer border border-slate-200 dark:border-slate-750 shadow-2xs hover:scale-[1.02]"
                  title="طي المصادر والدورات لتوفير مساحة وصعود الشروحات والملفات والاختبارات للأعلى"
                >
                  <span>طي المصادر (توفير مساحة)</span>
                  <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </button>
              </div>

              {/* Horizontal Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
                {resources.map((res) => {
                  const isSelected = res.id === activeResource?.id;
                  const resIsBookmarked = Boolean(currentUser?.progress?.bookmarkedResourceIds?.includes(res.id) || (currentUser as any)?.bookmarks?.includes(res.id));
                  const resVidsCount = videos.filter((v) => v.sectionId === section.id && v.resourceId === res.id).length;
                  const resQuizCount = quizzes.filter((q) => q.sectionId === section.id && q.resourceId === res.id).length;

                  return (
                    <button
                      key={res.id}
                      id={`resource-pill-${res.id}`}
                      onClick={() => setSelectedResourceId(res.id)}
                      className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer border ${
                        isSelected
                          ? resIsBookmarked
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30 ring-2 ring-amber-400/50'
                            : 'bg-emerald-800 text-white border-emerald-800 shadow-md shadow-emerald-800/20'
                          : resIsBookmarked
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-100 ring-1 ring-amber-400/40'
                            : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {resIsBookmarked ? (
                        <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300 shrink-0" />
                      ) : (
                        <BookOpen className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`} />
                      )}
                      <span>{res.title}</span>
                      <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isSelected 
                          ? (resIsBookmarked ? 'bg-amber-700 text-white' : 'bg-emerald-700 text-white')
                          : (resIsBookmarked ? 'bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')
                      }`}>
                        {resVidsCount} فيديو • {resQuizCount} اختبار
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Resource Card Header */}
              {activeResource && (
                <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-7 border shadow-xs text-right space-y-4 sm:space-y-5 transition-all ${
                  isBookmarked
                    ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/30 dark:via-slate-900 dark:to-amber-950/15 border-amber-400/90 dark:border-amber-500/80 ring-2 ring-amber-400/30 shadow-amber-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[11px] sm:text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900">
                          المستوى: {activeResource.level}
                        </span>
                        {isBookmarked && (
                          <span className="text-[11px] sm:text-xs bg-amber-500 text-white font-black px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                            <Star className="w-3.5 h-3.5 fill-white" />
                            <span>تم حفظ هذا المصدر في حسابك</span>
                          </span>
                        )}
                        <span className="text-[11px] sm:text-xs text-slate-400">
                          تمت الإضافة: {new Date(activeResource.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{activeResource.title}</h1>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                        {activeResource.description || 'مصدر تعليمي شامل يتضمن شروحات مسجلة، ملخصات دراسية، واختبارات تفاعلية.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        onClick={() => onToggleBookmark(activeResource.id)}
                        className={`px-3.5 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-black cursor-pointer ${
                          isBookmarked
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40 hover:scale-[1.02]'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white text-white' : ''}`} />
                        <span>{isBookmarked ? '⭐ تم حفظ المصدر في المفضلة' : 'حفظ المصدر'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Informative alert for guests */}
                  {!currentUser && (
                    <div className="bg-gradient-to-l from-emerald-50 via-teal-50 to-amber-50 dark:from-slate-850 dark:via-slate-850 dark:to-amber-950/30 border border-emerald-200/90 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 text-right shadow-2xs">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-base font-extrabold text-slate-900 dark:text-white">
                            محتوى هذا القسم محمي ومتاح للطلاب المسجلين
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                            جميع الشروحات المرئية والملفات والمذكرات والاختبارات التفاعلية مغلقة إلى حين تسجيل دخولك أو إنشاء حسابك الجديد.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => (onOpenAuth ? onOpenAuth() : onOpenFileLocked?.({ id: 'auth-top', title: activeResource.title } as any))}
                        className="w-full sm:w-auto justify-center whitespace-nowrap px-4 sm:px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-2 hover:scale-[1.02]"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-300" />
                        <span>تسجيل الدخول الآن لفتح المحتوى</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. THE MAIN LESSONS, FILES & QUIZZES CARD ("خانة شروحات وملفات واختبارات") */}
          {activeResource && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs text-right space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto scrollbar-none flex-nowrap -mx-1 px-1 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    id="tab-videos"
                    onClick={() => setActiveTab('videos')}
                    className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors cursor-pointer border-b-2 -mb-[3px] ${
                      activeTab === 'videos'
                        ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>الفيديوهات والشروحات</span>
                    <span className="text-[10px] sm:text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 sm:gap-1">
                      {!currentUser && <Lock className="w-2.5 h-2.5 text-amber-600" />}
                      {resourceVideos.length}
                    </span>
                  </button>

                  <button
                    id="tab-files"
                    onClick={() => setActiveTab('files')}
                    className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors cursor-pointer border-b-2 -mb-[3px] ${
                      activeTab === 'files'
                        ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>الملفات والمذكرات</span>
                    <span className="text-[10px] sm:text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 sm:gap-1">
                      {!currentUser && <Lock className="w-2.5 h-2.5 text-amber-600" />}
                      {resourceFiles.length}
                    </span>
                  </button>

                  <button
                    id="tab-quizzes"
                    onClick={() => setActiveTab('quizzes')}
                    className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors cursor-pointer border-b-2 -mb-[3px] ${
                      activeTab === 'quizzes'
                        ? 'border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>الاختبارات التفاعلية</span>
                    <span className="text-[10px] sm:text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 sm:gap-1">
                      {!currentUser && <Lock className="w-2.5 h-2.5 text-amber-600" />}
                      {resourceQuizzes.length}
                    </span>
                  </button>
                </div>

                {isResourcesCollapsed && (
                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 hidden sm:inline-block">
                    المصدر: {activeResource.title}
                  </span>
                )}
              </div>

              {/* Tab Content */}
              <div className="pt-6">
                  {/* TAB 1: VIDEOS */}
                  {activeTab === 'videos' && (
                    <div className="space-y-4">
                      {/* Notice for guests requiring login to watch video lessons */}
                      {!currentUser && (
                        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">شروحات الدروس المرئية محمية ومتاحة للطلاب المسجلين</h4>
                              <p className="text-xs text-slate-600 mt-0.5">يرجى تسجيل الدخول أو إنشاء حساب طالب لمشاهدة شروحات الدروس ومتابعة تقدمك التعليمي.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onPlayVideo(resourceVideos[0] || ({ id: 'auth-video-prompt', title: 'شروحات الدروس' } as any))}
                            className="whitespace-nowrap px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>تسجيل الدخول لمشاهدة الدروس</span>
                          </button>
                        </div>
                      )}

                      {resourceVideos.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                          <Video className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-600">لا توجد فيديوهات مضافة في هذا المصدر بعد.</p>
                          <p className="text-xs text-slate-400 mt-1">يمكن للمسؤول إضافة فيديوهات عبر لوحة التحكم.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resourceVideos.map((video, idx) => {
                            const isCompleted = currentUser?.progress?.completedVideoIds?.includes(video.id);
                            // Find if this video has a linked quiz!
                            const linkedQuiz = quizzes.find((q) => q.id === video.linkedQuizId || q.linkedVideoId === video.id);

                            return (
                              <div
                                key={video.id}
                                id={`video-card-${video.id}`}
                                className="group bg-slate-50/80 dark:bg-slate-850/80 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between"
                              >
                                <div className="space-y-3">
                                  {/* Video Header info */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-extrabold text-xs">
                                        {idx + 1}
                                      </span>
                                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {video.durationMinutes} دقيقة
                                      </span>
                                    </div>

                                    {currentUser ? (
                                      isCompleted ? (
                                        <button
                                          type="button"
                                          id={`card-toggle-watched-${video.id}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleVideoComplete?.(video.id);
                                          }}
                                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-200 dark:hover:border-rose-800 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer group/btn"
                                          title="تمت المشاهدة (انقر لإلغاء التحديد)"
                                        >
                                          <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 group-hover/btn:hidden" />
                                          <span className="group-hover/btn:hidden">تمت المشاهدة ✓</span>
                                          <span className="hidden group-hover/btn:inline">إلغاء المشاهدة</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          id={`card-toggle-watched-${video.id}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleVideoComplete?.(video.id);
                                          }}
                                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors cursor-pointer"
                                          title="تحديد هذا الفيديو كـ تمت المشاهدة"
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          <span>تحديد كـ تمت المشاهدة</span>
                                        </button>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                                        <Lock className="w-3 h-3 text-amber-600" />
                                        <span>درس مغلق</span>
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                    {video.title}
                                  </h3>

                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {video.description || 'شرح الدرس وطرق الحل السريعة.'}
                                  </p>

                                  {/* Linked Quiz Callout (Specific User Requirement: "ربط اختبار بفيديو محدد") */}
                                  {linkedQuiz && (
                                    <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-3 border border-amber-200/80 dark:border-amber-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                        <div className="text-right">
                                          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">اختبار مرتبط بهذا الفيديو:</span>
                                          <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">{linkedQuiz.title}</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => onStartQuiz(linkedQuiz)}
                                        className="w-full sm:w-auto justify-center whitespace-nowrap px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                                      >
                                        {!currentUser && <Lock className="w-3 h-3 text-amber-200" />}
                                        <span>{currentUser ? 'ابدأ الاختبار' : 'تسجيل الدخول للحل'}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3.5 sm:pt-4 mt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                                  <button
                                    id={`play-video-${video.id}`}
                                    onClick={() => onPlayVideo(video)}
                                    className={`w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
                                      currentUser ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-amber-600 hover:bg-amber-700'
                                    }`}
                                  >
                                    {currentUser ? (
                                      <>
                                        <Play className="w-3.5 h-3.5 fill-white" />
                                        <span>مشاهدة الدرس الآن</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-3.5 h-3.5 text-amber-100" />
                                        <span>تسجيل الدخول للمشاهدة</span>
                                      </>
                                    )}
                                  </button>

                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {currentUser ? 'دقة عالية HD' : 'محتوى محمي'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: FILES & NOTES */}
                  {activeTab === 'files' && (
                    <div className="space-y-4">
                      {/* Notice for guests requiring login to view & download files */}
                      {!currentUser && (
                        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-right">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">الملفات والمذكرات محمية ومتاحة للطلاب المسجلين</h4>
                              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">يرجى تسجيل الدخول أو إنشاء حساب طالب للاطلاع على المذكرات والملفات التعليمية وتحميلها.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenFileLocked?.(resourceFiles[0] || ({ id: 'file-lock', title: 'الملفات' } as any))}
                            className="w-full sm:w-auto justify-center whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>تسجيل الدخول للاطلاع على الملفات</span>
                          </button>
                        </div>
                      )}

                      {resourceFiles.length === 0 ? (
                        <div className="text-center py-10 sm:py-12 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                          <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">لا توجد ملفات أو مذكرات مضافة في هذا المصدر بعد.</p>
                          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">يمكن للمسؤول رفع وتضمين الملفات من لوحة التحكم.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                          {resourceFiles.map((file) => (
                            <div
                              key={file.id}
                              id={`file-card-${file.id}`}
                              className="bg-slate-50/80 dark:bg-slate-850/80 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs uppercase">
                                      {file.fileType}
                                    </div>
                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                      الحجم: {file.fileSize}
                                    </span>
                                  </div>

                                  {currentUser ? (
                                    file.pagesCount && (
                                      <span className="text-xs text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        {file.pagesCount} صفحة
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                                      <Lock className="w-3 h-3 text-amber-600" />
                                      <span>ملف محمي</span>
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white pt-1">
                                  {file.title}
                                </h3>

                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {file.description || 'ملف دراسي بصيغة PDF يغطي كافة النقاط الرئيسية.'}
                                </p>
                              </div>

                              <div className="pt-3.5 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                                {currentUser ? (
                                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                                    <a
                                      href={file.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                                      title="فتح الملف في تبويب خارجي"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      <span>عرض في الخارج</span>
                                    </a>

                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          const res = await fetch(file.fileUrl);
                                          const blob = await res.blob();
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          const safeTitle = (file.title || 'document').replace(/[\\/:*?"<>|]/g, '_');
                                          a.download = safeTitle.toLowerCase().endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`;
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                          setTimeout(() => URL.revokeObjectURL(url), 10000);
                                        } catch (err) {
                                          window.open(file.fileUrl, '_blank');
                                        }
                                      }}
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
                                      title="تحميل مباشر للملف"
                                    >
                                      <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                                      <span className="hidden sm:inline">تحميل</span>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onOpenFileLocked ? onOpenFileLocked(file) : onOpenFile?.(file)}
                                    className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-amber-100" />
                                    <span>تسجيل الدخول للمعاينة والتحميل</span>
                                  </button>
                                )}

                                <span className="text-[11px] sm:text-xs text-slate-400 font-medium self-end sm:self-auto">
                                  {currentUser ? 'جاهز للطباعة' : 'محتوى محمي'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: QUIZZES */}
                  {activeTab === 'quizzes' && (
                    <div className="space-y-4">
                      {/* Notice for guests requiring login to take quizzes */}
                      {!currentUser && (
                        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-right">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                              <Lock className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">حل الاختبارات متاح للطلاب المسجلين</h4>
                              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">سجل دخولك لبدء الاختبارات وتصحيحها فورياً وحفظ إنجازاتك ودرجاتك في ملفك الشخصي.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onStartQuiz(resourceQuizzes[0] || ({ id: 'auth-prompt', title: 'تسجيل دخول' } as any))}
                            className="w-full sm:w-auto justify-center whitespace-nowrap px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>تسجيل الدخول لبدء الاختبار</span>
                          </button>
                        </div>
                      )}

                      {resourceQuizzes.length === 0 ? (
                        <div className="text-center py-10 sm:py-12 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                          <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">لا توجد اختبارات تفاعلية مضافة في هذا المصدر بعد.</p>
                          <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 mt-1">يمكن للمسؤول إنشاء اختبارات مع تحديد الإجابات الصحيحة وشرح الحلول.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                          {resourceQuizzes.map((quiz) => {
                            // Check if student took this quiz before
                            const pastAttempt = currentUser?.progress?.completedQuizAttempts?.find(
                              (a) => a.quizId === quiz.id
                            );

                            return (
                              <div
                                key={quiz.id}
                                id={`quiz-card-${quiz.id}`}
                                className="bg-slate-50/80 dark:bg-slate-850/80 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                              >
                                <div className="space-y-3">
                                  {/* Quiz Cover Image if present */}
                                  {quiz.imageUrl && (
                                    <div className="w-full h-32 sm:h-36 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/80 dark:border-slate-800 relative mb-1">
                                      <img
                                        src={quiz.imageUrl}
                                        alt={quiz.title}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      {quiz.isExternal && (
                                        <span className="absolute top-2.5 right-2.5 bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs">
                                          <ExternalLink className="w-3 h-3" />
                                          <span>رابط خارجي</span>
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-2">
                                      {quiz.isExternal ? (
                                        <span className="text-[11px] sm:text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 sm:py-1 rounded-md border border-blue-100 dark:border-blue-900 flex items-center gap-1">
                                          <ExternalLink className="w-3 h-3" />
                                          <span>اختبار خارجي</span>
                                        </span>
                                      ) : (
                                        <span className="text-[11px] sm:text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 sm:py-1 rounded-md border border-indigo-100 dark:border-indigo-900">
                                          {quiz.questions.length} أسئلة
                                        </span>
                                      )}
                                      {quiz.timeLimitMinutes > 0 ? (
                                        <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                                          {quiz.timeLimitMinutes} دقيقة
                                        </span>
                                      ) : (
                                        <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium">
                                          {quiz.isExternal ? 'مباشر عبر الرابط' : 'بدون وقت محدد'}
                                        </span>
                                      )}
                                    </div>

                                    {currentUser ? (
                                      pastAttempt && !quiz.isExternal && (
                                        <span className={`text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md ${
                                          pastAttempt.passed
                                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                        }`}>
                                          درجتك السابقة: {pastAttempt.score}/{pastAttempt.totalQuestions} ({pastAttempt.percentage}%)
                                        </span>
                                      )
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg">
                                        <Lock className="w-3 h-3 text-amber-600" />
                                        <span>اختبار مغلق</span>
                                      </span>
                                    )}
                                  </div>

                                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                    {quiz.title}
                                  </h3>

                                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                    {quiz.description || (quiz.isExternal ? 'اختبار إلكتروني خارجي مخصص، انقر للانتقال لصفحة الاختبار.' : 'اختبار تفاعلي ذاتي التصحيح مع إظهار النتيجة وشرح الإجابات فور الانتهاء.')}
                                  </p>

                                  <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                    <span>نسبة النجاح المطلوبة: {quiz.passingScorePercentage}%</span>
                                    <span>•</span>
                                    <span>{quiz.isExternal ? 'نموذج خارجي' : 'تصحيح فوري'}</span>
                                  </div>
                                </div>

                                <div className="pt-3.5 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                                  <button
                                    id={`start-quiz-${quiz.id}`}
                                    onClick={() => onStartQuiz(quiz)}
                                    className={`w-full sm:w-auto justify-center inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
                                      currentUser 
                                        ? (quiz.isExternal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-700 hover:bg-emerald-800')
                                        : 'bg-amber-600 hover:bg-amber-700'
                                    }`}
                                  >
                                    {currentUser ? (
                                      quiz.isExternal ? (
                                        <>
                                          <ExternalLink className="w-4 h-4" />
                                          <span>فتح الاختبار الآن</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-4 h-4" />
                                          <span>{pastAttempt ? 'إعادة الاختبار' : 'بدء الاختبار الآن'}</span>
                                        </>
                                      )
                                    ) : (
                                      <>
                                        <Lock className="w-4 h-4 text-amber-100" />
                                        <span>تسجيل الدخول لبدء الاختبار</span>
                                      </>
                                    )}
                                  </button>

                                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium self-end sm:self-auto">
                                    {currentUser ? (quiz.isExternal ? 'رابط مباشر' : 'اختيار من متعدد') : 'محتوى محمي'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};
