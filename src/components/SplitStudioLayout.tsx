import React, { useState, useEffect, useRef } from 'react';
import { 
  SectionItem, 
  ResourceItem, 
  VideoItem, 
  FileItem, 
  Quiz, 
  StudentUser,
  PlatformLayoutPreset 
} from '../types';
import { DynamicIcon } from './DynamicIcon';
import { 
  Play, 
  Check, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Maximize2, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  Bookmark,
  ExternalLink,
  HelpCircle,
  Film,
  PictureInPicture2
} from 'lucide-react';

interface SplitStudioLayoutProps {
  layoutPreset: PlatformLayoutPreset;
  sections: SectionItem[];
  resources: ResourceItem[];
  videos: VideoItem[];
  files: FileItem[];
  quizzes: Quiz[];
  currentUser: StudentUser | null;
  activeSectionId: string;
  activeVideo: VideoItem | null;
  onSelectSection: (sectionId: string) => void;
  onSelectVideo: (video: VideoItem) => void;
  onCloseInlineVideo?: () => void;
  onStartQuiz: (quiz: Quiz) => void;
  onOpenFile: (file: FileItem) => void;
  onOpenFileLocked: (file: FileItem) => void;
  onToggleBookmark: (resourceId: string) => void;
  onToggleVideoComplete: (videoId: string) => void;
  onOpenFullscreenVideo: (video: VideoItem) => void;
  onBackToSections?: () => void;
}

export const SplitStudioLayout: React.FC<SplitStudioLayoutProps> = ({
  layoutPreset,
  sections,
  resources,
  videos,
  files,
  quizzes,
  currentUser,
  activeSectionId,
  onSelectSection,
  onStartQuiz,
  onOpenFileLocked,
  onToggleBookmark,
  onToggleVideoComplete,
  onOpenFullscreenVideo,
  onBackToSections,
}) => {
  const currentSection = sections.find((s) => s.id === activeSectionId) || sections[0];
  const sectionResources = resources.filter((r) => r.sectionId === currentSection?.id);

  const [selectedResourceId, setSelectedResourceId] = useState<string>(
    sectionResources[0]?.id || ''
  );

  const activeResource = 
    sectionResources.find((r) => r.id === selectedResourceId) || sectionResources[0];

  const resourceVideos = videos.filter((v) => v.resourceId === activeResource?.id);
  const resourceFiles = files.filter((f) => f.resourceId === activeResource?.id);
  const resourceQuizzes = quizzes.filter((q) => q.resourceId === activeResource?.id);

  const [contentTab, setContentTab] = useState<'videos' | 'files' | 'quizzes'>('videos');

  // Collapsible state for resources section to save vertical space
  const [isResourcesCollapsed, setIsResourcesCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tamayuz_studio_resources_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleResourcesCollapsed = () => {
    setIsResourcesCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('tamayuz_studio_resources_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Currently playing video ID inside the right-hand studio player
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // When resource changes or first renders, automatically select the first video
  useEffect(() => {
    if (resourceVideos.length > 0) {
      const exists = resourceVideos.some((v) => v.id === selectedVideoId);
      if (!exists) {
        setSelectedVideoId(resourceVideos[0].id);
      }
    } else {
      setSelectedVideoId(null);
    }
  }, [selectedResourceId, resourceVideos]);

  const displayedVideo = 
    (selectedVideoId && resourceVideos.find((v) => v.id === selectedVideoId)) ||
    (resourceVideos.length > 0 ? resourceVideos[0] : null);

  const isVideoCompleted = displayedVideo
    ? currentUser?.progress?.completedVideoIds?.includes(displayedVideo.id)
    : false;

  const linkedQuiz = displayedVideo
    ? quizzes.find((q) => q.id === displayedVideo.linkedQuizId || q.linkedVideoId === displayedVideo.id)
    : null;

  const studioVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isStudioPiP, setIsStudioPiP] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsPiPSupported(
        'pictureInPictureEnabled' in document &&
        (document as any).pictureInPictureEnabled !== false
      );
    }
  }, []);

  useEffect(() => {
    const vid = studioVideoRef.current;
    if (!vid) return;

    const onEnterPiP = () => setIsStudioPiP(true);
    const onLeavePiP = () => setIsStudioPiP(false);

    vid.addEventListener('enterpictureinpicture', onEnterPiP);
    vid.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      vid.removeEventListener('enterpictureinpicture', onEnterPiP);
      vid.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [displayedVideo?.id, displayedVideo?.videoUrl]);

  const handleToggleStudioPiP = async () => {
    const vid = studioVideoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (vid.requestPictureInPicture) {
        await vid.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Format embed URL for smooth playback
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const vid = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const vid = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0`;
    }
    return url;
  };

  // Video switch handler: switches the video in place inside the player on the right
  const handleSelectVideo = (vid: VideoItem) => {
    setSelectedVideoId(vid.id);
  };

  // --------------------------------------------------------------------------
  // SIDEBAR (LEFT SIDE): Sections on top, Resources list, and Lessons beneath
  // --------------------------------------------------------------------------
  const renderSidebar = () => (
    <div className="w-full space-y-4">
      
      {/* 1. Quick Section Switcher on top */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>الأقسام الدراسية</span>
          </span>
          {onBackToSections && (
            <button
              onClick={onBackToSections}
              className="text-[11px] font-bold text-slate-600 hover:text-emerald-800 dark:text-slate-400 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>الرئيسية</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Section Pill Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {sections.map((sec) => {
            const isActive = sec.id === currentSection?.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  onSelectSection(sec.id);
                  const firstRes = resources.find((r) => r.sectionId === sec.id);
                  if (firstRes) {
                    setSelectedResourceId(firstRes.id);
                  }
                }}
                className={`px-3 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between gap-1.5 cursor-pointer text-right ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                    : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <DynamicIcon name={sec.icon} className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{sec.title}</span>
                </div>
                {isActive && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Resources Selector for the Current Section */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs transition-all">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">
              المصادر والدورات
            </span>
            {/* Small Arrow Button right beside 'المصادر والدورات' */}
            <button
              type="button"
              id="studio-toggle-resources-arrow-btn"
              onClick={toggleResourcesCollapsed}
              className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs hover:scale-105 shrink-0"
              title={isResourcesCollapsed ? "توسيع وعرض المصادر والدورات" : "غلق المصادر وصعود الشروحات والملفات والاختبارات للأعلى لتوفير مساحة"}
            >
              {isResourcesCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
            <span className="text-[11px] text-slate-400 shrink-0">({sectionResources.length})</span>
          </div>

          {isResourcesCollapsed && activeResource && (
            <button
              type="button"
              onClick={toggleResourcesCollapsed}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[140px]"
              title="انقر لتوسيع المصادر"
            >
              <span className="truncate">{activeResource.title}</span>
            </button>
          )}
        </div>

        {!isResourcesCollapsed && (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 animate-in fade-in duration-150">
            {sectionResources.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">لا توجد مصادر في هذا القسم</p>
            ) : (
              sectionResources.map((res) => {
                const isSelected = res.id === activeResource?.id;
                const resVids = videos.filter((v) => v.resourceId === res.id);
                const isBookmarked = Boolean(currentUser?.progress?.bookmarkedResourceIds?.includes(res.id) || (currentUser as any)?.bookmarks?.includes(res.id));

                return (
                  <div
                    key={res.id}
                    onClick={() => setSelectedResourceId(res.id)}
                    className={`p-2.5 rounded-2xl border text-right cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isBookmarked
                        ? isSelected
                          ? 'border-2 border-amber-500 bg-amber-500/20 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/40 shadow-xs'
                          : 'border-2 border-amber-300 dark:border-amber-700/80 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 hover:bg-amber-100/80'
                        : isSelected
                        ? 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <DynamicIcon 
                        name={res.icon} 
                        className={`w-4 h-4 shrink-0 ${isBookmarked ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`} 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs block truncate">{res.title}</span>
                          {isBookmarked && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white shrink-0 shadow-2xs">
                              محفوظ ⭐
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>{resVids.length} شروحات</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {currentUser && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleBookmark(res.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isBookmarked 
                              ? 'text-amber-500 bg-amber-100/80 dark:bg-amber-900/50 hover:bg-amber-200' 
                              : 'text-slate-400 hover:text-emerald-800 hover:bg-slate-100'
                          }`}
                          title={isBookmarked ? 'إلغاء حفظ المصدر' : 'حفظ وتلوين المصدر'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      )}
                      {isSelected && <span className={`w-2 h-2 rounded-full ${isBookmarked ? 'bg-amber-500' : 'bg-emerald-600'}`}></span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 3. Lessons & Media Tabs for the Selected Resource */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-3">
          <button
            type="button"
            onClick={() => setContentTab('videos')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              contentTab === 'videos'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>شروحات ({resourceVideos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setContentTab('quizzes')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              contentTab === 'quizzes'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>اختبارات ({resourceQuizzes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setContentTab('files')}
            className={`py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              contentTab === 'files'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>ملفات ({resourceFiles.length})</span>
          </button>
        </div>

        {/* Tab Item List */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {contentTab === 'videos' && (
            resourceVideos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد شروحات مضافة لهذا المصدر</p>
            ) : (
              resourceVideos.map((vid, idx) => {
                const isSelected = displayedVideo?.id === vid.id;
                const isCompleted = currentUser?.progress?.completedVideoIds?.includes(vid.id);

                return (
                  <div
                    key={vid.id}
                    onClick={() => handleSelectVideo(vid)}
                    className={`p-3 rounded-2xl border text-right cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                        isSelected 
                          ? 'bg-emerald-700 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                          {vid.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {vid.durationMinutes} دقيقة
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSelected && (
                        <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          قيد التشغيل
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFullscreenVideo(vid);
                        }}
                        title="تكبير لنافذة كاملة"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {contentTab === 'quizzes' && (
            resourceQuizzes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد اختبارات تفاعلية لهذا المصدر</p>
            ) : (
              resourceQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  onClick={() => onStartQuiz(quiz)}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-emerald-500 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {quiz.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {quiz.questions?.length || 0} أسئلة • نجاح {quiz.passingScore}%
                    </span>
                  </div>

                  <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg">
                    بدء الاختبار
                  </span>
                </div>
              ))
            )
          )}

          {contentTab === 'files' && (
            resourceFiles.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد مذكرات أو ملفات لهذا المصدر</p>
            ) : (
              resourceFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => {
                    if (currentUser) {
                      window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      onOpenFileLocked(file);
                    }
                  }}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-blue-500 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                        {file.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{file.fileType || 'PDF'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) {
                          e.preventDefault();
                          onOpenFileLocked(file);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      title="فتح الملف في تبويب خارجي"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>عرض في الخارج</span>
                    </a>
                  </div>
                </div>
              ))
            )
          )}
        </div>

      </div>

    </div>
  );

  // --------------------------------------------------------------------------
  // VIDEO STAGE (RIGHT SIDE): Persistent Studio Player Screen & Video Details
  // --------------------------------------------------------------------------
  const renderVideoStage = () => (
    <div className="w-full space-y-4">
      
      {/* Video Screen Container */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Video Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {activeResource?.title || currentSection?.title}
              </span>
              {displayedVideo && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {displayedVideo.durationMinutes} دقيقة
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
              {displayedVideo ? displayedVideo.title : 'حدد درساً من القائمة لبدء التشغيل'}
            </h2>
          </div>

          {displayedVideo && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Picture in Picture Button */}
              {isPiPSupported &&
                !displayedVideo.videoUrl.includes('youtube') &&
                !displayedVideo.videoUrl.includes('youtu.be') && (
                  <button
                    type="button"
                    onClick={handleToggleStudioPiP}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isStudioPiP
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isStudioPiP ? 'الخروج من وضع صورة داخل صورة (PiP)' : 'تشغيل بنمط صورة داخل صورة (PiP)'}
                  >
                    <PictureInPicture2 className={`w-3.5 h-3.5 ${isStudioPiP ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span>{isStudioPiP ? 'إغلاق PiP' : 'صورة داخل صورة (PiP)'}</span>
                  </button>
                )}

              <button
                type="button"
                onClick={() => onOpenFullscreenVideo(displayedVideo)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>الشاشة الكاملة</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => onToggleVideoComplete(displayedVideo.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isVideoCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isVideoCompleted ? 'تمت المشاهدة ✓' : 'تحديد كمكتمل'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Video Player Display Screen: loads and switches in place */}
        <div 
          key={displayedVideo ? displayedVideo.id : 'empty-stage'}
          className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-md transition-all duration-200"
        >
          {displayedVideo ? (
            displayedVideo.videoUrl.includes('youtube') || displayedVideo.videoUrl.includes('youtu.be') ? (
              <iframe
                src={getEmbedUrl(displayedVideo.videoUrl)}
                title={displayedVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                ref={studioVideoRef}
                src={displayedVideo.videoUrl}
                controls
                preload="metadata"
                autoPlay
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-contain"
              >
                متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.
              </video>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
              <Film className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-semibold">لم يتم تحديد فيديو في هذا القسم حتى الآن</p>
            </div>
          )}
        </div>

        {/* Video Description & Linked Quick Quiz */}
        {displayedVideo && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {displayedVideo.description || 'شرح تفصيلي ومبسط لأهم الأفكار والنماذج التدريبية.'}
            </p>

            {linkedQuiz && (
              <button
                type="button"
                onClick={() => onStartQuiz(linkedQuiz)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>اختبار الدرس التدريبي</span>
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );

  // --------------------------------------------------------------------------
  // LAYOUT DISPATCHER BASED ON layoutPreset
  // --------------------------------------------------------------------------
  if (layoutPreset === 'cinema-wide') {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        {/* Full-width Cinema Stage on Top */}
        <div className="w-full">
          {renderVideoStage()}
        </div>
        {/* Sections, Resources & Lessons beneath */}
        <div className="w-full">
          {renderSidebar()}
        </div>
      </div>
    );
  }

  if (layoutPreset === 'sidebar-split-right') {
    // استوديو الشاشة المقسمة: أقسام ومصادر على اليمين + مشغل الفيديو على اليسار (في RTL)
    return (
      <div className="space-y-6 text-right" dir="rtl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right side in RTL: Sidebar (Sections & Resources) */}
          <div className="lg:col-span-5 xl:col-span-4 w-full">
            {renderSidebar()}
          </div>
          {/* Left side in RTL: Video Player Stage */}
          <div className="lg:col-span-7 xl:col-span-8 w-full">
            {renderVideoStage()}
          </div>
        </div>
      </div>
    );
  }

  if (layoutPreset === 'bento-dashboard') {
    return (
      <div className="space-y-6 text-right" dir="rtl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 w-full">
            {renderVideoStage()}
          </div>
          <div className="lg:col-span-4 w-full">
            {renderSidebar()}
          </div>
        </div>
      </div>
    );
  }

  if (layoutPreset === 'stacked-focus') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 text-right" dir="rtl">
        <div className="w-full">
          {renderVideoStage()}
        </div>
        <div className="w-full">
          {renderSidebar()}
        </div>
      </div>
    );
  }

  // Default: sidebar-split-left (الاستوديو المعكوس) or fallback
  // Video on the RIGHT, Sidebar on the LEFT (in RTL)
  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right side in RTL: Video Player Stage */}
        <div className="lg:col-span-7 xl:col-span-8 w-full">
          {renderVideoStage()}
        </div>
        {/* Left side in RTL: Sidebar (Sections & Resources) */}
        <div className="lg:col-span-5 xl:col-span-4 w-full">
          {renderSidebar()}
        </div>
      </div>
    </div>
  );
};
