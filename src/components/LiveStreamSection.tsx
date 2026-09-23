import React, { useState } from 'react';
import { LiveStreamConfig } from '../types';
import { 
  Radio, 
  ExternalLink, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Sparkles,
  Tv,
  Volume2,
  Share2
} from 'lucide-react';

interface LiveStreamSectionProps {
  liveStream: LiveStreamConfig;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

export const LiveStreamSection: React.FC<LiveStreamSectionProps> = ({ liveStream }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!liveStream?.isEnabled || !liveStream?.streamUrl) {
    return null;
  }

  const youtubeVideoId = extractYouTubeId(liveStream.streamUrl);

  const handleCopyLink = () => {
    if (!liveStream.streamUrl) return;
    navigator.clipboard.writeText(liveStream.streamUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <section 
      id="livestream-student-stage"
      aria-label="قسم البث المباشر للطلاب"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl border-2 border-rose-500/30 transition-all duration-300"
    >
      {/* Ambient background glow accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 px-5 sm:px-8 pt-6 pb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Pulsing Live Beacon */}
          <div className="inline-flex items-center gap-2 bg-rose-600/90 text-white text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full shadow-lg shadow-rose-600/30 border border-rose-400/40">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="tracking-wide">بث مباشر قيد التشغيل الآن</span>
          </div>

          {liveStream.scheduledTime && (
            <div className="hidden sm:inline-flex items-center gap-1.5 bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-white/10">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{liveStream.scheduledTime}</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Copy Link Button */}
          <button
            type="button"
            id="btn-copy-livestream-link"
            onClick={handleCopyLink}
            title="نسخ رابط البث"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">تم نسخ الرابط</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>نسخ الرابط</span>
              </>
            )}
          </button>

          {/* Open in external window button */}
          <a
            id="btn-open-livestream-external"
            href={liveStream.streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
          >
            <span>فتح في صفحة مستقلة</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            id="btn-toggle-livestream-collapse"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'تكبير عرض البث' : 'تصغير عرض البث'}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
          >
            {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Broadcast Content Body */}
      {!isCollapsed && (
        <div className="relative z-10 p-5 sm:p-8 space-y-6">
          {/* Title and Description */}
          <div className="text-right space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>جلسة تدريبية وتفاعلية مباشرة - منصة التميز</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
              {liveStream.title || 'البث المباشر - منصة التميز التعليمية'}
            </h2>
            {liveStream.description && (
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
                {liveStream.description}
              </p>
            )}
          </div>

          {/* Player / Launch Stage */}
          {youtubeVideoId ? (
            /* YouTube Embedded Interactive Theater Player */
            <div className="space-y-3">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 ring-1 ring-white/15">
                <iframe
                  id="livestream-youtube-iframe"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={liveStream.title || 'بث مباشر منصة التميز'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 bg-white/5 p-3.5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-rose-400" />
                  <span>المشغل التفاعلي المباشر يعمل مباشرة داخل المنصة بدون الحاجة للخروج.</span>
                </div>
                <a
                  href={liveStream.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>لمشاهدة البث مباشرة على تطبيق YouTube مع المحادثة الحية</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            /* Spacious Launch Card for External Live Streams (Zoom, Google Meet, Teams, etc.) */
            <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-rose-950/60 p-6 sm:p-8 border border-white/15 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-right">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">رابط الجلسة المباشرة جاهز الآن</h3>
                    <p className="text-xs text-slate-400">يمكنك الدخول مباشرة إلى القاعة التفاعلية والاستماع للشرح الحي والمشاركة.</p>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/10 max-w-xl text-left" dir="ltr">
                  <span className="text-xs font-mono text-slate-300 truncate block">
                    {liveStream.streamUrl}
                  </span>
                </div>
              </div>

              {/* Big Join CTA Button */}
              <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
                <a
                  id="btn-big-join-livestream"
                  href={liveStream.streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto px-8 sm:px-10 py-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer text-center"
                >
                  <Radio className="w-5 h-5 animate-pulse" />
                  <span>الانضمام إلى البث المباشر الآن</span>
                  <ExternalLink className="w-5 h-5" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-1 cursor-pointer transition-colors"
                >
                  {isCopied ? '✓ تم نسخ الرابط بنجاح للحافظة' : 'أو انقر هنا لنسخ الرابط ومشاركته'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* When Collapsed: Clean Compact Bar */}
      {isCollapsed && (
        <div className="relative z-10 px-6 py-4 flex items-center justify-between text-right bg-white/5">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-white">{liveStream.title}</span>
            <span className="text-xs text-slate-400 hidden sm:inline">البث قيد التشغيل في الخلفية</span>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>عرض مشغل البث بالتفصيل</span>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
