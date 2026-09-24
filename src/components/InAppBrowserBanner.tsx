import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, X, Compass } from 'lucide-react';
import { isRunningInAppBrowser, isTelegramBrowser, isWhatsAppBrowser, safeStorage } from '../utils/safeStorage';

interface Props {
  onShowToast?: (msg: string) => void;
}

export const InAppBrowserBanner: React.FC<Props> = ({ onShowToast }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if dismissed before in this session
    const dismissed = safeStorage.getItem('tamayuz_inapp_banner_dismissed');
    if (dismissed === 'true') {
      return;
    }

    if (isRunningInAppBrowser()) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const appName = isTelegramBrowser()
    ? 'تليجرام'
    : isWhatsAppBrowser()
    ? 'واتساب'
    : 'التطبيق';

  const handleDismiss = () => {
    setIsVisible(false);
    safeStorage.setItem('tamayuz_inapp_banner_dismissed', 'true');
  };

  const handleCopyLink = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (onShowToast) onShowToast('تم نسخ رابط المنصة لفتحه في متصفحك المفضل!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      if (onShowToast) onShowToast('رابط المنصة: ' + window.location.href);
    }
  };

  const handleOpenExternal = () => {
    const currentUrl = window.location.href;
    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isAndroid) {
      try {
        const cleanUrl = currentUrl.replace(/^https?:\/\//i, '');
        const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intentUrl;
        setTimeout(() => {
          handleCopyLink();
        }, 800);
      } catch {
        handleCopyLink();
      }
    } else if (isIOS) {
      handleCopyLink();
      if (onShowToast) {
        onShowToast('تم نسخ الرابط! اضغط على أيقونة (⋯) بأعلى الشاشة ثم اختر "فتح في Safari"');
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 flex items-center justify-between shadow-md relative z-40 transition-all font-['Cairo',sans-serif]">
      <div className="flex items-center gap-2 overflow-hidden flex-1 pl-2">
        <Compass className="w-4 h-4 shrink-0 text-emerald-200 animate-pulse" />
        <p className="truncate text-white font-medium">
          أنت تتصفح من داخل تطبيق <span className="font-bold underline decoration-emerald-300">{appName}</span> • المنصة تعمل بكامل سرعتها، ويمكنك فتحها في متصفح خارجي لتنزيل الملفات بحرية
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleOpenExternal}
          title="فتح في المتصفح الأساسي"
          className="hidden xs:flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>المتصفح</span>
        </button>

        <button
          onClick={handleCopyLink}
          title="نسخ الرابط"
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ' : 'نسخ الرابط'}</span>
        </button>

        <button
          onClick={handleDismiss}
          title="إغلاق التنبيه"
          className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
