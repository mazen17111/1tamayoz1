import React, { useState, useRef, useMemo, useEffect } from 'react';
import { VideoItem, Quiz } from '../types';
import { 
  X, 
  CheckCircle, 
  Clock, 
  Sparkles,
  AlertCircle,
  Film,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  PictureInPicture2
} from 'lucide-react';

interface VideoPlayerModalProps {
  video: VideoItem;
  linkedQuiz?: Quiz;
  isCompleted: boolean;
  onClose: () => void;
  onToggleComplete: (videoId: string) => void;
  onStartQuiz: (quiz: Quiz) => void;
}

type VideoType = 'html5' | 'youtube' | 'vimeo' | 'drive' | 'iframe';

function getVideoMimeType(url: string): string {
  if (!url) return 'video/mp4';
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.mp4') || clean.endsWith('.m4v') || clean.endsWith('.mov')) return 'video/mp4';
  if (clean.endsWith('.webm') || clean.endsWith('.mkv')) return 'video/webm';
  if (clean.endsWith('.ogg')) return 'video/ogg';
  if (clean.endsWith('.3gp')) return 'video/3gpp';
  return 'video/mp4';
}

interface NormalizedVideo {
  type: VideoType;
  embedUrl: string;
  directUrl: string;
  sourceLabel: string;
}

function normalizeVideoUrl(inputUrl: string): NormalizedVideo {
  if (!inputUrl) {
    return { type: 'html5', embedUrl: '', directUrl: '', sourceLabel: 'غير محدد' };
  }

  let trimmed = inputUrl.trim();

  // If user pasted <iframe ... src="..." ...>
  const iframeSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    trimmed = iframeSrcMatch[1].trim();
  }

  // Remove surrounding quotes if any
  trimmed = trimmed.replace(/^["']|["']$/g, '');

  const cleanUrl = trimmed.split('?')[0].toLowerCase();

  // 1. Direct file upload or direct video files (Always HTML5, never iframe to avoid browser download prompt)
  if (
    trimmed.startsWith('/uploads/') ||
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.endsWith('.mkv') ||
    cleanUrl.endsWith('.avi') ||
    cleanUrl.endsWith('.3gp')
  ) {
    return {
      type: 'html5',
      embedUrl: trimmed,
      directUrl: trimmed,
      sourceLabel: 'فيديو مباشر / خادم المنصة',
    };
  }

  // 2. YouTube (standard, youtu.be, shorts, live, embed, mobile)
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    let timeParam = '';
    const timeMatch = trimmed.match(/[?&](?:t|start)=([0-9smh]+)/i);
    if (timeMatch && timeMatch[1]) {
      const seconds = parseInt(timeMatch[1], 10);
      if (!isNaN(seconds)) {
        timeParam = `&start=${seconds}`;
      }
    }
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1&modestbranding=1&autoplay=1${timeParam}`,
      directUrl: `https://www.youtube.com/watch?v=${videoId}`,
      sourceLabel: 'يوتيوب (YouTube)',
    };
  }

  // 3. Google Drive (file/d/ID, open?id=ID, uc?id=ID, docs.google.com)
  const driveRegex = /(?:drive|docs)\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]{20,})/i;
  const driveMatch = trimmed.match(driveRegex);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directUrl: `https://drive.google.com/file/d/${fileId}/view`,
      sourceLabel: 'جوجل درايف (Google Drive)',
    };
  }

  // 4. Vimeo
  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
      directUrl: `https://vimeo.com/${vimeoId}`,
      sourceLabel: 'فيميو (Vimeo)',
    };
  }

  // 5. Loom
  const loomRegex = /loom\.com\/share\/([a-zA-Z0-9_-]+)/i;
  const loomMatch = trimmed.match(loomRegex);
  if (loomMatch && loomMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`,
      directUrl: trimmed,
      sourceLabel: 'لوم (Loom)',
    };
  }

  // 6. Streamable
  const streamableRegex = /streamable\.com\/([a-zA-Z0-9_-]+)/i;
  const streamableMatch = trimmed.match(streamableRegex);
  if (streamableMatch && streamableMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://streamable.com/e/${streamableMatch[1]}?autoplay=1`,
      directUrl: trimmed,
      sourceLabel: 'ستريَمبل (Streamable)',
    };
  }

  // 7. Dropbox direct streaming (convert dl=0 to raw=1)
  if (trimmed.includes('dropbox.com')) {
    let directDropbox = trimmed.replace(/[?&]dl=0/g, '').replace(/[?&]raw=1/g, '');
    directDropbox += directDropbox.includes('?') ? '&raw=1' : '?raw=1';
    return {
      type: 'html5',
      embedUrl: directDropbox,
      directUrl: directDropbox,
      sourceLabel: 'دروب بوكس (Dropbox)',
    };
  }

  // Default fallback
  return {
    type: 'html5',
    embedUrl: trimmed,
    directUrl: trimmed,
    sourceLabel: 'مشغل الفيديو',
  };
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  linkedQuiz,
  isCompleted,
  onClose,
  onToggleComplete,
  onStartQuiz,
}) => {
  const normalized = useMemo(() => normalizeVideoUrl(video.videoUrl), [video.videoUrl]);
  const isEmbedPlayer = normalized.type === 'youtube' || normalized.type === 'drive' || normalized.type === 'vimeo' || normalized.type === 'iframe';

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>(normalized.directUrl || video.videoUrl);
  const [isPiP, setIsPiP] = useState(false);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if browser supports Picture-in-Picture
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsPiPSupported(
        'pictureInPictureEnabled' in document &&
        (document as any).pictureInPictureEnabled !== false
      );
    }
  }, []);

  // Listen for entering / exiting PiP mode
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onEnterPiP = () => setIsPiP(true);
    const onLeavePiP = () => setIsPiP(false);

    vid.addEventListener('enterpictureinpicture', onEnterPiP);
    vid.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      vid.removeEventListener('enterpictureinpicture', onEnterPiP);
      vid.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [currentVideoSrc, reloadKey]);

  const handleTogglePiP = async () => {
    const vid = videoRef.current;
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

  // Sync state when video changes
  useEffect(() => {
    setCurrentVideoSrc(normalized.directUrl || video.videoUrl);
    setIsPlaying(false);
    setHasStarted(false);
    setIsMuted(false);
    setLoadError(false);
  }, [video.videoUrl, video.id, normalized.directUrl]);

  // Robust Autoplay execution on mount or source change
  useEffect(() => {
    if (isEmbedPlayer) {
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }

    const vid = videoRef.current;
    if (!vid) return;

    let isSubscribed = true;

    const executeAutoplay = async () => {
      try {
        // Try unmuted autoplay first (succeeds if triggered by user click gesture)
        await vid.play();
        if (isSubscribed) {
          setIsPlaying(true);
          setHasStarted(true);
          setLoadError(false);
        }
      } catch (unmutedErr) {
        console.log('Unmuted autoplay prevented by browser policy, trying muted autoplay...', unmutedErr);
        // Fallback to muted autoplay to ensure immediate playback without error
        try {
          vid.muted = true;
          if (isSubscribed) setIsMuted(true);
          await vid.play();
          if (isSubscribed) {
            setIsPlaying(true);
            setHasStarted(true);
            setLoadError(false);
          }
        } catch (mutedErr) {
          console.warn('Autoplay prevented by browser, waiting for user click:', mutedErr);
          if (isSubscribed) {
            setIsPlaying(false);
            setHasStarted(false);
          }
        }
      }
    };

    const timer = setTimeout(() => {
      executeAutoplay();
    }, 120);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [reloadKey, currentVideoSrc, isEmbedPlayer]);

  // Unmute audio handler
  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
    }
    setIsMuted(false);
  };

  // One-click Play Handler
  const handlePlayClick = () => {
    setHasStarted(true);
    setLoadError(false);
    if (!isEmbedPlayer && videoRef.current) {
      const vid = videoRef.current;
      vid.muted = false;
      setIsMuted(false);
      const p = vid.play();
      if (p !== undefined) {
        p.then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Playback gesture required:', err);
          setIsPlaying(false);
        });
      }
    } else {
      setIsPlaying(true);
    }
  };

  const handleTogglePlay = () => {
    if (!isEmbedPlayer && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleReloadPlayer = () => {
    setLoadError(false);
    setIsPlaying(false);
    setHasStarted(false);
    setIsMuted(false);
    setCurrentVideoSrc(normalized.directUrl || video.videoUrl);
    setReloadKey((prev) => prev + 1);
  };

  // Video error handler
  const handleVideoError = (e: any) => {
    const videoEl = videoRef.current;
    if (videoEl) {
      // If the video has already begun playing or currentTime > 0, do not abruptly kick student to error screen
      if (videoEl.currentTime > 0.3 || hasStarted) {
        console.warn('Minor playback error during playback; ignoring to keep playback continuous');
        return;
      }
      if (videoEl.error) {
        if (videoEl.error.code === 1) {
          // MEDIA_ERR_ABORTED: not a playback failure
          return;
        }
        console.warn('Video element playback error code:', videoEl.error.code, videoEl.error.message);
      }
    }
    // Only show error screen if playback never started
    if (!hasStarted) {
      setLoadError(true);
      setIsPlaying(false);
    }
  };

  // Build active embed URL with autoplay parameters
  const effectiveEmbedUrl = useMemo(() => {
    if (!isEmbedPlayer) return '';
    const raw = normalized.embedUrl;
    if (!raw) return '';
    if (!raw.includes('autoplay=1')) {
      const sep = raw.includes('?') ? '&' : '?';
      return `${raw}${sep}autoplay=1&playsinline=1`;
    }
    return raw;
  }, [isEmbedPlayer, normalized.embedUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl sm:max-w-3xl w-full overflow-hidden text-right transition-all my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <button
              id="close-video-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="إغلاق المشغل"
            >
              <X className="w-5 h-5" />
            </button>

            {!isEmbedPlayer && isPiPSupported && (
              <button
                id="modal-header-pip-btn"
                type="button"
                onClick={handleTogglePiP}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  isPiP
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                title={isPiP ? 'الخروج من وضع صورة داخل صورة (PiP)' : 'تشغيل بنمط صورة داخل صورة (PiP)'}
                aria-label="صورة داخل صورة PiP"
              >
                <PictureInPicture2 className={`w-3.5 h-3.5 ${isPiP ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                <span className="hidden sm:inline">{isPiP ? 'إغلاق PiP' : 'صورة داخل صورة (PiP)'}</span>
                <span className="sm:hidden">{isPiP ? 'إغلاق' : 'PiP'}</span>
              </button>
            )}
          </div>

          <div className="text-right flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
              {video.title}
            </h2>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Video Player Stage - Seamless Playback, Autoplay with Mute Fallback & Instant Recovery */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden group">
          {!video.videoUrl ? (
            <div className="text-center p-6 space-y-2 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
              <p className="text-sm font-bold">لم يتم تعيين رابط لهذا الفيديو بعد</p>
            </div>
          ) : loadError ? (
            <div className="text-center p-6 space-y-3 text-slate-300">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-400" />
              <p className="text-sm font-bold">تعذر تحميل الفيديو مباشرة في المتصفح</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReloadPlayer}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة المحاولة</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {isEmbedPlayer ? (
                <iframe
                  key={`player-iframe-${reloadKey}-${video.id}`}
                  src={effectiveEmbedUrl}
                  title={video.title}
                  className="w-full h-full border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  allowFullScreen
                />
              ) : (
                <video
                  key={`player-html5-${reloadKey}-${video.id}-${currentVideoSrc}`}
                  ref={videoRef}
                  src={currentVideoSrc}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={handleTogglePlay}
                  onPlay={() => {
                    setIsPlaying(true);
                    setHasStarted(true);
                    setLoadError(false);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    if (!isCompleted) {
                      onToggleComplete(video.id);
                    }
                  }}
                  onError={handleVideoError}
                  className="w-full h-full object-contain bg-black cursor-pointer"
                >
                  <source src={currentVideoSrc} type={getVideoMimeType(currentVideoSrc)} />
                  <source src={currentVideoSrc} type="video/mp4" />
                  <source src={currentVideoSrc} />
                  متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.
                </video>
              )}

              {/* Floating Quick PiP Button */}
              {!isEmbedPlayer && isPiPSupported && isPlaying && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePiP();
                  }}
                  className={`absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg cursor-pointer ${
                    isPiP
                      ? 'bg-emerald-600 text-white border border-emerald-400'
                      : 'bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 hover:scale-105'
                  }`}
                  title={isPiP ? 'الخروج من وضع PiP' : 'تشغيل بنمط صورة داخل صورة (PiP)'}
                >
                  <PictureInPicture2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isPiP ? 'إغلاق PiP' : 'PiP'}</span>
                </button>
              )}

              {/* Muted Autoplay Notice & Quick Unmute Button */}
              {isMuted && isPlaying && !isEmbedPlayer && (
                <button
                  type="button"
                  onClick={handleUnmute}
                  className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-white/20 text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg cursor-pointer"
                  title="انقر لتشغيل الصوت"
                >
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span>انقر هنا لتفعيل الصوت 🔊</span>
                </button>
              )}

              {/* Central Play Button Overlay: Centered play icon that appears if video is paused */}
              {!isPlaying && !loadError && !isEmbedPlayer && (
                <div 
                  onClick={handlePlayClick}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 hover:bg-black/25 transition-colors cursor-pointer"
                >
                  <button
                    id="center-play-button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayClick();
                    }}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all duration-200 border-4 border-white/95 cursor-pointer transform hover:scale-105"
                    title="تشغيل الفيديو الآن"
                    aria-label="تشغيل الفيديو الآن"
                  >
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white text-white translate-x-[-2px]" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls & Description */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-white dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {video.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {video.durationMinutes} دقيقة
                </span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {normalized.sourceLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Picture in Picture Button */}
              {!isEmbedPlayer && isPiPSupported && (
                <button
                  id="toggle-pip-btn"
                  type="button"
                  onClick={handleTogglePiP}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                    isPiP
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={isPiP ? 'الخروج من وضع صورة داخل صورة (PiP)' : 'تشغيل بنمط صورة داخل صورة (PiP)'}
                >
                  <PictureInPicture2 className={`w-4 h-4 ${isPiP ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  <span>{isPiP ? 'إغلاق PiP' : 'صورة داخل صورة (PiP)'}</span>
                </button>
              )}

              {/* Mark as watched button */}
              <button
                id="toggle-video-watched-btn"
                type="button"
                onClick={() => onToggleComplete(video.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 ${
                  isCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700'
                }`}
                title={isCompleted ? 'تمت المشاهدة بنجاح (انقر للإلغاء)' : 'تحديد هذا الفيديو كـ تمت المشاهدة'}
              >
                <CheckCircle className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-slate-400'}`} />
                <span>{isCompleted ? 'تمت المشاهدة ✓' : 'تحديد كـ "تمت المشاهدة"'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {video.description || 'شرح تفصيلي للمفاهيم الأساسية والأمثلة المتكررة مع نصائح للحل السريع.'}
          </p>

          {/* Linked Quiz Highlight */}
          {linkedQuiz && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-right w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">اختبار تفاعلي مرتبط بهذا الشرح:</span>
                  <span className="text-sm text-amber-950 dark:text-amber-100 font-black">{linkedQuiz.title}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onStartQuiz(linkedQuiz);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap text-center"
              >
                بدء الاختبار المرتبط الآن
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
