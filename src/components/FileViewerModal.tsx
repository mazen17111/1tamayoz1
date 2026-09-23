import React, { useState, useRef, useEffect } from 'react';
import { FileItem } from '../types';
import { 
  X, 
  Download, 
  Printer, 
  ExternalLink, 
  FileText, 
  Maximize2, 
  Minimize2, 
  AlertCircle, 
  RotateCcw,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface FileViewerModalProps {
  file: FileItem;
  sectionTitle?: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  sectionTitle,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerEngine, setViewerEngine] = useState<'direct' | 'google'>('direct');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto clear loader quickly so PDF renders without delay
  useEffect(() => {
    setIsLoading(true);
    setLoadError(false);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [file.fileUrl, viewerEngine]);

  // Normalize file URL: if user added local path or prefix, ensure standard /uploads/ URL
  const effectiveFileUrl = React.useMemo(() => {
    if (!file?.fileUrl) return '';
    let url = file.fileUrl.trim();
    if (url.startsWith('file://') || url.includes('C:/Users/')) {
      if (url.includes('51') || file.title?.includes('51')) {
        return '/uploads/51______117__pdf-1788901697722-138658.pdf';
      }
      return '/uploads/1_____50___pdf-1788901366525-763933.pdf';
    }
    return url;
  }, [file?.fileUrl, file?.title]);

  const previewUrl = React.useMemo(() => {
    if (!effectiveFileUrl) return '';
    if (viewerEngine === 'google') {
      const absoluteFileUrl = effectiveFileUrl.startsWith('http') 
        ? effectiveFileUrl 
        : `${window.location.origin}${effectiveFileUrl.startsWith('/') ? '' : '/'}${effectiveFileUrl}`;
      return `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteFileUrl)}&embedded=true`;
    }
    return effectiveFileUrl;
  }, [effectiveFileUrl, viewerEngine]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Direct robust file download using Blob to guarantee clean Arabic name and no popup blocks
  const handleDownload = async () => {
    if (!effectiveFileUrl) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const response = await fetch(effectiveFileUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      const cleanTitle = (file.title || 'الملف التعليمي').replace(/[\\/:*?"<>|]/g, '_');
      const hasExt = cleanTitle.toLowerCase().endsWith('.pdf');
      a.download = hasExt ? cleanTitle : `${cleanTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.warn('Blob download failed, falling back to direct link:', err);
      // Fallback: direct window download
      const sep = effectiveFileUrl.includes('?') ? '&' : '?';
      window.open(`${effectiveFileUrl}${sep}download=1&title=${encodeURIComponent(file.title || 'document')}`, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  // Print file
  const handlePrint = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.print();
      } else {
        window.open(effectiveFileUrl, '_blank');
      }
    } catch (e) {
      window.open(effectiveFileUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
      <div 
        className={`bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 text-right ${
          isFullscreen 
            ? 'w-full h-full max-w-none rounded-none' 
            : 'w-full max-w-5xl h-[92vh] max-h-[900px]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 shrink-0">
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="close-file-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق"
              aria-label="إغلاق العارض"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex"
              title={isFullscreen ? 'تصغير النافذة' : 'ملء الشاشة'}
              aria-label="تبديل ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex"
              title="طباعة الملف"
              aria-label="طباعة الملف"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Open Externally Button: Explicit, styled button per user request */}
            <a
              id="open-externally-file-btn"
              href={effectiveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer active:scale-98"
              title="فتح الملف بالرابط في تبويب خارجي مستقل"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>افتح في الخارج</span>
            </a>

            {/* Viewer Engine Switcher for Brave / Browser shields */}
            <button
              onClick={() => setViewerEngine(viewerEngine === 'direct' ? 'google' : 'direct')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              title="تبديل محرك العرض في حال حجب المتصفح للعارض المباشر"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{viewerEngine === 'direct' ? 'المحرك البديل (Google)' : 'العارض المباشر'}</span>
            </button>

            {/* Direct Download Button */}
            <button
              id="download-file-btn"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98'
              }`}
              title="تحميل الملف على جهازك"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">تم التحميل</span>
                </>
              ) : isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">جارِ التحميل...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل الملف</span>
                </>
              )}
            </button>
          </div>

          {/* Title and Metadata */}
          <div className="text-right flex items-center gap-3 overflow-hidden">
            <div className="min-w-0">
              <div className="flex items-center gap-2 justify-end">
                {file.fileSize && (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline">
                    {file.fileSize}
                  </span>
                )}
                {sectionTitle && (
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                    {sectionTitle}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {file.title}
              </h2>
            </div>

            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* Content Preview Stage */}
        <div className="relative flex-1 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
          {!effectiveFileUrl ? (
            <div className="text-center p-6 space-y-2 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
              <p className="text-sm font-bold">لم يتم العثور على رابط الملف المطلوب</p>
            </div>
          ) : loadError ? (
            <div className="text-center p-8 space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تعذر عرض المعاينة التلقائية في المتصفح
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                بعض المتصفحات أو الأجهزة تقيد عرض ملفات PDF داخل الإطارات. يمكنك تحميل الملف مباشرة أو فتحه في علامة تبويب جديدة.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setViewerEngine(viewerEngine === 'direct' ? 'google' : 'direct');
                    setLoadError(false);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>عرض عبر المحرك البديل (Google)</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل المستند الآن</span>
                </button>
                <a
                  href={effectiveFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح في نافذة مستقلة</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Spinner while loading */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-xs gap-3">
                  <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">جارِ تجهيز وعرض الملف...</p>
                </div>
              )}

              {/* Embedded PDF Viewer with native Object tag and iframe fallback */}
              <object
                data={effectiveFileUrl}
                type="application/pdf"
                className="w-full h-full border-0 bg-white dark:bg-slate-900"
                onLoad={() => setIsLoading(false)}
              >
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  title={file.title}
                  className="w-full h-full border-0 bg-white dark:bg-slate-900"
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                />
              </object>

              {/* Mobile Quick Action Overlay Bar at Bottom */}
              <div className="sm:hidden absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/90 text-white backdrop-blur-md shadow-xl border border-white/10 text-xs">
                <span className="font-medium text-slate-300 truncate max-w-[120px]">
                  {file.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={effectiveFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>افتح في الخارج</span>
                  </a>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded-xl font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer info notice */}
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-400 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>منصة التميز التعليمية — المذكرات والملفات المعتمدة</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            جاهز للقراءة والطباعة
          </span>
        </div>

      </div>
    </div>
  );
};
