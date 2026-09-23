import React, { useState } from 'react';
import { 
  Megaphone, 
  Save, 
  Check, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  Sparkles,
  X
} from 'lucide-react';
import { PlatformAnnouncement } from '../../types';

interface AdminAnnouncementTabProps {
  announcement?: PlatformAnnouncement;
  onSaveAnnouncement: (announcement: PlatformAnnouncement) => Promise<void>;
  isSaving: boolean;
}

export const AdminAnnouncementTab: React.FC<AdminAnnouncementTabProps> = ({
  announcement,
  onSaveAnnouncement,
  isSaving,
}) => {
  const [config, setConfig] = useState<PlatformAnnouncement>(() => ({
    isEnabled: Boolean(announcement?.isEnabled),
    message: announcement?.message || (announcement as any)?.text || 'مرحباً بكم في منصة التميز التعليمية! تمنياتنا لكم بعام دراسي مليء بالنجاح والتفوق.',
    type: announcement?.type || 'info',
    isDismissible: announcement?.isDismissible !== false,
  }));

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Save and immediately publish/show to students
  const handleSaveAndShow = async () => {
    const updated: PlatformAnnouncement = {
      ...config,
      isEnabled: true,
      message: config.message.trim(),
      updatedAt: new Date().toISOString(),
    };
    setConfig(updated);
    try {
      localStorage.setItem('tamayuz_platform_announcement', JSON.stringify(updated));
    } catch {}
    await onSaveAnnouncement(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleSaveOnly = async () => {
    const updated: PlatformAnnouncement = {
      ...config,
      message: config.message.trim(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('tamayuz_platform_announcement', JSON.stringify(updated));
    } catch {}
    await onSaveAnnouncement(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Stop and disable announcement completely until explicitly re-enabled
  const handleStopAnnouncement = async () => {
    const updated: PlatformAnnouncement = {
      ...config,
      isEnabled: false,
      updatedAt: new Date().toISOString(),
    };
    setConfig(updated);
    try {
      localStorage.setItem('tamayuz_platform_announcement', JSON.stringify(updated));
    } catch {}
    await onSaveAnnouncement(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleToggle = async () => {
    const updated = { 
      ...config, 
      isEnabled: !config.isEnabled,
      updatedAt: new Date().toISOString()
    };
    setConfig(updated);
    try {
      localStorage.setItem('tamayuz_platform_announcement', JSON.stringify(updated));
    } catch {}
    await onSaveAnnouncement(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Hero Control Card */}
      <div className={`p-6 rounded-3xl border transition-all shadow-sm ${
        config.isEnabled
          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              config.isEnabled
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  شريط التنبيهات والإعلانات العامة
                </h2>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  config.isEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {config.isEnabled ? 'مفعّل وظاهر للطلاب الآن' : 'مخفي حالياً'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                اكتب التنبيه واضغط «حفظ وإظهار للطلاب» ليظهر شريط التنبيه فوراً فوق المحتوى لجميع الطلاب.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {config.isEnabled ? (
              <button
                type="button"
                id="admin-stop-announcement-btn"
                onClick={handleStopAnnouncement}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-2xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/20 hover:scale-[1.02] disabled:opacity-50"
                title="إيقاف شريط التنبيه فوراً ولن يظهر للطلاب حتى تعيد تفعيله"
              >
                <EyeOff className="w-4 h-4" />
                <span>إيقاف التنبيه نهائياً (مخفي)</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSaveAndShow}
              disabled={isSaving || !config.message.trim()}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02] disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم التنفيذ بنجاح!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{config.isEnabled ? 'تحديث ونشر التنبيه' : 'تفعيل وإظهار التنبيه للطلاب'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Options */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        
        {/* Message Input */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 dark:text-white block">
            نص التنبيه أو الإعلان الذي سيظهر للطلاب:
          </label>
          <textarea
            value={config.message}
            onChange={(e) => setConfig((p) => ({ ...p, message: e.target.value }))}
            rows={3}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-slate-900 dark:text-white text-xs sm:text-sm font-medium outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            placeholder="مثال: تنبيه مهم: غداً الساعة 8 مساءً موعد البث المباشر لمراجعة القسم الكمي..."
          />
          
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs font-semibold text-slate-500">
              {config.isEnabled ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">🟢 التنبيه مفعّل وظاهر للطلاب مباشرة فوق المحتوى</span>
              ) : (
                <span className="text-slate-500 font-medium">⚪ التنبيه متوقف ومخفي تماماً ولن يظهر للطلاب حتى تضغط زر التفعيل</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {config.isEnabled && (
                <button
                  type="button"
                  onClick={handleStopAnnouncement}
                  disabled={isSaving}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="إيقاف التنبيه فوراً"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>إيقاف التنبيه</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveAndShow}
                disabled={isSaving || !config.message.trim()}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{config.isEnabled ? 'حفظ وتحديث' : 'تفعيل وإظهار للطلاب'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 dark:text-white block">
            نوع ومظهر شريط التنبيه:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'info', label: 'تنويه وإرشاد (أزرق)', icon: Info },
              { id: 'warning', label: 'تنبيه مهم (برتقالي)', icon: AlertTriangle },
              { id: 'success', label: 'خبر سار / إنجاز (أخضر)', icon: Sparkles },
              { id: 'urgent', label: 'عاجل وحاسم (أحمر)', icon: AlertCircle },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setConfig((p) => ({ ...p, type: t.id as any }))}
                className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  config.type === t.id
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dismissible Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-white block">
              السماح للطالب بإغلاق التنبيه مؤقتاً
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              إذا تم التفعيل، سيظهر زر (X) للطالب ليتمكن من إخفاء التنبيه لجلسة التصفح الحالية.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setConfig((p) => ({ ...p, isDismissible: !p.isDismissible }))}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
              config.isDismissible ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                config.isDismissible ? 'translate-x-0' : '-translate-x-5'
              }`}
            />
          </button>
        </div>

      </div>

      {/* Live Preview Box */}
      <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              معاينة حية لشريط التنبيه كما سيظهر لطلاب المنصة:
            </h4>
          </div>
          <span className="text-xs text-slate-400">مباشر</span>
        </div>

        {/* Simulated Top of App */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-3 bg-slate-900 text-slate-400 text-[11px] font-mono border-b border-slate-800 flex items-center justify-between">
            <span>[أعلى نافذة المنصة فوق المحتوى - شريط التنبيهات]</span>
            <span>{config.isEnabled ? '🟢 مفعّل وظاهر' : '⚪ معطل ومخفي'}</span>
          </div>

          {config.isEnabled ? (
            <div className={`p-3.5 text-right font-medium text-xs sm:text-sm flex items-center justify-between gap-3 ${
              config.type === 'warning'
                ? 'bg-amber-600 text-white font-bold'
                : config.type === 'urgent'
                ? 'bg-rose-600 text-white font-bold'
                : config.type === 'success'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-blue-600 text-white font-bold'
            }`}>
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 shrink-0" />
                <span>{config.message || 'اكتب نص التنبيه أعلاه...'}</span>
              </div>
              {config.isDismissible && (
                <span className="p-1 rounded-md opacity-75 hover:opacity-100 cursor-pointer">
                  <X className="w-4 h-4" />
                </span>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-900">
              الشريط مخفي حالياً ولن يظهر للطلاب حتى تضغط على زر «حفظ وإظهار للطلاب».
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
