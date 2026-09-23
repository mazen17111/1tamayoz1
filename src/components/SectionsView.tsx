import React, { useState } from 'react';
import { 
  SectionItem, 
  ResourceItem, 
  VideoItem, 
  FileItem, 
  Quiz, 
  StudentUser,
  LiveStreamConfig
} from '../types';
import { DynamicIcon } from './DynamicIcon';
import { LiveStreamSection } from './LiveStreamSection';
import { 
  ArrowLeft, 
  Video, 
  FileText, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  FolderPlus,
  Compass,
  Lock,
  GraduationCap
} from 'lucide-react';

interface SectionsViewProps {
  sections: SectionItem[];
  resources: ResourceItem[];
  videos: VideoItem[];
  files: FileItem[];
  quizzes: Quiz[];
  currentUser: StudentUser | null;
  onSelectSection: (sectionId: string) => void;
  onOpenAdmin: () => void;
  liveStream?: LiveStreamConfig;
}

export const SectionsView: React.FC<SectionsViewProps> = ({
  sections,
  resources,
  videos,
  files,
  quizzes,
  currentUser,
  onSelectSection,
  onOpenAdmin,
  liveStream,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sections by search
  const filteredSections = sections.filter((s) => {
    const matchTitle = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDesc = s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTitle || matchDesc;
  });

  const totalVideos = videos.length;
  const totalQuizzes = quizzes.length;
  const totalFiles = files.length;
  const completedVideos = currentUser?.progress?.completedVideoIds?.length || 0;
  const completedTests = currentUser?.progress?.completedQuizAttempts?.length || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Grand Live Broadcast Section (Active only) */}
      {liveStream && <LiveStreamSection liveStream={liveStream} />}

      {/* Student Welcome & Overview Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-l from-slate-900 via-emerald-950 to-teal-900 text-white p-5 sm:p-10 shadow-xl border border-emerald-800/30">
        <div className="relative z-10 max-w-4xl space-y-3.5 sm:space-y-4 text-right">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs sm:text-sm px-3 sm:px-3.5 py-1.5 rounded-full border border-emerald-400/30 font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="truncate">منصة التميز التعليمية للقدرات والاختبارات التفاعلية</span>
            </div>

            {/* Platform Badge beside platform banner */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15">
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">منصة التميز التعليمية</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-4xl font-extrabold leading-snug tracking-tight">
            {currentUser ? `أهلاً بك، يا ${currentUser.name}` : 'مرحبًا بك في منصة التميز التعليمية'}
          </h1>

          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl">
            نظام تعليمي متكامل ومبني على محتوى ديناميكي محدث لحظيًا. اختر القسم المطلوب للوصول إلى الدروس المشروحة، المذكرات والملفات، والاختبارات التفاعلية ذات التصحيح الذاتي الفوري.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 sm:pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/10 text-right">
              <span className="text-[11px] sm:text-xs text-slate-300 block mb-0.5 sm:mb-1">الأقسام المتاحة</span>
              <span className="text-xl sm:text-2xl font-black text-white">{sections.length}</span>
              <span className="text-[10px] sm:text-[11px] text-emerald-300 block mt-0.5 truncate">ديناميكية التحديث</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/10 text-right">
              <span className="text-[11px] sm:text-xs text-slate-300 block mb-0.5 sm:mb-1">شروحات الفيديو</span>
              <span className="text-xl sm:text-2xl font-black text-white">{totalVideos}</span>
              <span className="text-[10px] sm:text-[11px] text-emerald-300 block mt-0.5 truncate">درس تفاعلي</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/10 text-right">
              <span className="text-[11px] sm:text-xs text-slate-300 block mb-0.5 sm:mb-1">الاختبارات الذاتية</span>
              <span className="text-xl sm:text-2xl font-black text-white">{totalQuizzes}</span>
              <span className="text-[10px] sm:text-[11px] text-emerald-300 block mt-0.5 truncate">مع الشرح والدرجة</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/10 text-right">
              <span className="text-[11px] sm:text-xs text-slate-300 block mb-0.5 sm:mb-1">الملفات والمذكرات</span>
              <span className="text-xl sm:text-2xl font-black text-white">{totalFiles}</span>
              <span className="text-[10px] sm:text-[11px] text-emerald-300 block mt-0.5 truncate">ملخصات جاهزة</span>
            </div>
          </div>
        </div>

        {/* Subtle geometric circles in background */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
      </section>

      {/* Search & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0" />
            <span>أقسام المنصة التعليمية</span>
            <span className="text-xs bg-slate-200/80 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
              {filteredSections.length} قسم
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            اختر أحد الأقسام لاستعراض المصادر والدروس والاختبارات
          </p>
        </div>

        <div className="w-full sm:w-80 relative">
          <input
            id="search-sections-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن قسم (كمي، لفظي، Step...)"
            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-2xs text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Sections Grid (Dynamic - Not hardcoded!) */}
      {filteredSections.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">لم يتم العثور على أقسام مطابقة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">جرب البحث بكلمة أخرى لعرض المواد والأقسام المطلوبة.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            عرض كافة الأقسام
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredSections.map((sec) => {
            const secResources = resources.filter((r) => r.sectionId === sec.id);
            const secVideos = videos.filter((v) => v.sectionId === sec.id);
            const secFiles = files.filter((f) => f.sectionId === sec.id);
            const secQuizzes = quizzes.filter((q) => q.sectionId === sec.id);

            // Palette setup based on section color
            const isBlue = sec.color === 'blue';
            const isEmerald = sec.color === 'emerald';
            const isIndigo = sec.color === 'indigo';
            const isAmber = sec.color === 'amber';
            const isRose = sec.color === 'rose';

            let gradientClass = 'from-blue-600 to-indigo-700';
            let iconBgClass = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50';
            let hoverBorderClass = 'hover:border-blue-400 dark:hover:border-blue-500';
            let badgeClass = 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300';

            if (isEmerald) {
              gradientClass = 'from-emerald-600 to-teal-700';
              iconBgClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50';
              hoverBorderClass = 'hover:border-emerald-400 dark:hover:border-emerald-500';
              badgeClass = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300';
            } else if (isIndigo) {
              gradientClass = 'from-indigo-600 to-violet-700';
              iconBgClass = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/50';
              hoverBorderClass = 'hover:border-indigo-400 dark:hover:border-indigo-500';
              badgeClass = 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300';
            } else if (isAmber) {
              gradientClass = 'from-amber-600 to-orange-700';
              iconBgClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900/50';
              hoverBorderClass = 'hover:border-amber-400 dark:hover:border-amber-500';
              badgeClass = 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300';
            } else if (isRose) {
              gradientClass = 'from-rose-600 to-pink-700';
              iconBgClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900/50';
              hoverBorderClass = 'hover:border-rose-400 dark:hover:border-rose-500';
              badgeClass = 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300';
            }

            return (
              <div
                key={sec.id}
                id={`section-card-${sec.id}`}
                onClick={() => onSelectSection(sec.id)}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4.5 sm:p-7 border border-slate-200 dark:border-slate-800 ${hoverBorderClass} shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  {/* Top Bar: Icon + Badge */}
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${iconBgClass} border flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-2xs shrink-0`}>
                      <DynamicIcon name={sec.iconName} className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {sec.badge && (
                        <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${badgeClass}`}>
                          {sec.badge}
                        </span>
                      )}
                      <span className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                        {secResources.length} مصادر
                      </span>
                    </div>
                  </div>

                  {/* Section Title & Description */}
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors mb-1.5 sm:mb-2 text-right">
                    {sec.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-right mb-4 sm:mb-6 line-clamp-3">
                    {sec.description || 'اضغط لاستعراض محتويات ومصادر هذا القسم التفاعلية.'}
                  </p>
                </div>

                {/* Bottom Stats & Action */}
                <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-right">
                    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2 sm:p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                        <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-[10px] sm:text-[11px] font-semibold">فيديوهات</span>
                      </div>
                      <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">{secVideos.length}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2 sm:p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                        <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[10px] sm:text-[11px] font-semibold">اختبارات</span>
                      </div>
                      <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">{secQuizzes.length}</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-2 sm:p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                        <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400" />
                        <span className="text-[10px] sm:text-[11px] font-semibold">ملفات</span>
                      </div>
                      <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">{secFiles.length}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 pt-1">
                    <span className="flex items-center gap-1">
                      <span>استعراض المحتوى والبدء</span>
                      <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1.5 transition-transform" />
                    </span>
                    {currentUser ? (
                      <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-normal">
                        متاح الآن
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>يتطلب تسجيل الدخول</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
