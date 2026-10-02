import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Save, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Eye, 
  Edit3, 
  Link as LinkIcon, 
  Image as ImageIcon,
  MessageSquare,
  Users
} from 'lucide-react';
import { TelegramWidgetConfig, TelegramGroupItem } from '../../types';
import { TelegramPlaneIcon } from '../TelegramWidget';

interface AdminTelegramWidgetTabProps {
  initialConfig?: TelegramWidgetConfig;
  onSaveConfig: (config: TelegramWidgetConfig) => Promise<void>;
  isSaving: boolean;
}

export const AdminTelegramWidgetTab: React.FC<AdminTelegramWidgetTabProps> = ({
  initialConfig,
  onSaveConfig,
  isSaving,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(initialConfig?.isEnabled ?? false);
  const [title, setTitle] = useState<string>(initialConfig?.title || 'قنوات ومجموعات تليجرام 📢');
  const [description, setDescription] = useState<string>(
    initialConfig?.description || 'انضم إلى مجموعات وقنوات التليجرام الرسمية لمتابعة التدريبات والنقاشات والتحديثات أولاً بأول.'
  );
  const [buttonLabel, setButtonLabel] = useState<string>(initialConfig?.buttonLabel || 'تليجرام');
  const [groups, setGroups] = useState<TelegramGroupItem[]>(initialConfig?.groups || []);

  // Sync state if initialConfig updates from server/storage
  useEffect(() => {
    if (initialConfig) {
      if (initialConfig.isEnabled !== undefined) setIsEnabled(initialConfig.isEnabled);
      if (initialConfig.title) setTitle(initialConfig.title);
      if (initialConfig.description !== undefined) setDescription(initialConfig.description);
      if (initialConfig.buttonLabel) setButtonLabel(initialConfig.buttonLabel);
      if (initialConfig.groups) setGroups(initialConfig.groups);
    }
  }, [initialConfig]);

  // Form state for adding a new group
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIconUrl, setNewIconUrl] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  // Status message state
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add or update group
  const handleAddOrUpdateGroup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newLink.trim()) {
      setStatusMessage({ type: 'error', text: 'يرجى إدخال رابط التليجرام (https://t.me/...)' });
      return null;
    }

    // Auto-prefix link if student/admin wrote @username or t.me/
    let formattedLink = newLink.trim();
    if (formattedLink.startsWith('@')) {
      formattedLink = `https://t.me/${formattedLink.substring(1)}`;
    } else if (formattedLink.startsWith('t.me/')) {
      formattedLink = `https://${formattedLink}`;
    } else if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
      formattedLink = `https://t.me/${formattedLink}`;
    }

    const titleToAdd = newTitle.trim() || 'جروب تليجرام التدريب';

    let updatedGroups: TelegramGroupItem[] = [];
    if (editingGroupId) {
      updatedGroups = groups.map((g) =>
        g.id === editingGroupId
          ? {
              ...g,
              title: titleToAdd,
              link: formattedLink,
              description: newDesc.trim() || undefined,
              iconUrl: newIconUrl.trim() || undefined,
            }
          : g
      );
      setEditingGroupId(null);
      setStatusMessage({ type: 'success', text: 'تم تعديل بيانات الجروب بنجاح. اضغط "حفظ الإعدادات" لتثبيت التغيير.' });
    } else {
      const newGroup: TelegramGroupItem = {
        id: `tg-${Date.now()}`,
        title: titleToAdd,
        link: formattedLink,
        description: newDesc.trim() || undefined,
        iconUrl: newIconUrl.trim() || undefined,
      };
      updatedGroups = [...groups, newGroup];
      setStatusMessage({ type: 'success', text: 'تمت إضافة الجروب إلى القائمة. اضغط "حفظ الإعدادات" لتثبيت التغيير.' });
    }

    setGroups(updatedGroups);

    // Reset inputs
    setNewTitle('');
    setNewLink('');
    setNewDesc('');
    setNewIconUrl('');
    return updatedGroups;
  };

  // Start editing a group
  const handleStartEdit = (group: TelegramGroupItem) => {
    setEditingGroupId(group.id);
    setNewTitle(group.title);
    setNewLink(group.link);
    setNewDesc(group.description || '');
    setNewIconUrl(group.iconUrl || '');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setNewTitle('');
    setNewLink('');
    setNewDesc('');
    setNewIconUrl('');
  };

  // Delete group
  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (editingGroupId === groupId) {
      handleCancelEdit();
    }
  };

  // Save all settings (Seamlessly adds any pending group in input fields & enables the widget)
  const handleSaveAll = async () => {
    setStatusMessage(null);
    try {
      let finalGroups = [...groups];

      // If the admin typed a group link in the input form and directly clicked "حفظ", automatically add it!
      if (newLink.trim()) {
        let formattedLink = newLink.trim();
        if (formattedLink.startsWith('@')) {
          formattedLink = `https://t.me/${formattedLink.substring(1)}`;
        } else if (formattedLink.startsWith('t.me/')) {
          formattedLink = `https://${formattedLink}`;
        } else if (!formattedLink.startsWith('http://') && !formattedLink.startsWith('https://')) {
          formattedLink = `https://t.me/${formattedLink}`;
        }

        const titleToAdd = newTitle.trim() || 'جروب تليجرام التدريب';

        if (editingGroupId) {
          finalGroups = finalGroups.map((g) =>
            g.id === editingGroupId
              ? {
                  ...g,
                  title: titleToAdd,
                  link: formattedLink,
                  description: newDesc.trim() || undefined,
                  iconUrl: newIconUrl.trim() || undefined,
                }
              : g
          );
          setEditingGroupId(null);
        } else {
          finalGroups.push({
            id: `tg-${Date.now()}`,
            title: titleToAdd,
            link: formattedLink,
            description: newDesc.trim() || undefined,
            iconUrl: newIconUrl.trim() || undefined,
          });
        }
        setGroups(finalGroups);
        setNewTitle('');
        setNewLink('');
        setNewDesc('');
        setNewIconUrl('');
      }

      // If there are groups or the admin explicitly kept it enabled, enable it!
      const shouldBeEnabled = isEnabled || finalGroups.length > 0;
      setIsEnabled(shouldBeEnabled);

      const updatedConfig: TelegramWidgetConfig = {
        isEnabled: shouldBeEnabled,
        title: title.trim() || 'قنوات ومجموعات تليجرام 📢',
        description: description.trim(),
        buttonLabel: buttonLabel.trim() || 'تليجرام',
        groups: finalGroups,
        updatedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem('tamayuz_telegram_widget', JSON.stringify(updatedConfig));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tamayuz_telegram_widget_updated', { detail: updatedConfig }));
        }
      } catch {}

      await onSaveConfig(updatedConfig);
      setStatusMessage({ 
        type: 'success', 
        text: 'تم حفظ وتفعيل قنوات التليجرام بنجاح! أيقونة التليجرام ظاهرة ومفعلة الآن على الشاشة لجميع الطلاب.' 
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مجدداً.' });
    }
  };

  return (
    <div className="space-y-6 text-right max-w-5xl mx-auto" dir="rtl">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-3xl border border-sky-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0088cc] to-[#24A1DE] text-white flex items-center justify-center shadow-lg shadow-[#0088cc]/30 shrink-0">
            <TelegramPlaneIcon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">قنوات ومجموعات التليجرام للطلاب</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                isEnabled 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isEnabled ? '● الميزة مفعلة' : '○ الميزة مقفلة'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تتيح ظهور أيقونة تليجرام للطلاب تفتح نافذة تعرض مجموعات وقنوات التليجرام مع زر انضمام مباشر.
            </p>
          </div>
        </div>

        {/* Big Save Button on Top */}
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-sky-600/25 transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>حفظ الإعدادات 💾</span>
            </>
          )}
        </button>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in duration-200 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Main Controls Card: Toggle & General Settings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
        
        {/* Enable / Disable Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>تفعيل أو إيقاف قنوات ومجموعات التليجرام للطلاب</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              عند التفعيل، ستظهر أيقونة التليجرام أسفل الشاشة للطلاب في المنصة فوراً.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
              isEnabled ? 'bg-sky-500' : 'bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-250 ease-in-out ${
                isEnabled ? '-translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Text Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              عنوان النافذة للطلاب
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: قنوات ومجموعات تليجرام 📢"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              تسمية شارة التليجرام (عند التمرير بالفأرة)
            </label>
            <input
              type="text"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              placeholder="مثال: تليجرام"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              رسالة / وصف توضيحي يظهر أعلى قائمة الجروبات
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: انضم إلى مجموعات وقنوات التليجرام الرسمية لمتابعة التدريبات والنقاشات."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

      </div>

      {/* 3. Add / Edit Group Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-5">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
              {editingGroupId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h3 className="text-base font-black text-white">
              {editingGroupId ? 'تعديل بيانات الجروب' : 'إضافة جروب أو قناة تليجرام جديدة'}
            </h3>
          </div>

          {editingGroupId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <form onSubmit={handleAddOrUpdateGroup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                اسم أو عنوان الجروب / القناة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: جروب مناقشات القدرات (الكمي)"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Telegram Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                رابط التليجرام <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://t.me/your_group_link"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-left"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Optional Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                وصف مختصر للجروب (اختياري)
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="مثال: حل التجميعات اليومية ومساعدة الطلاب"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Optional Icon URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                رابط شعار مخصص (اختياري - يترك فارغاً لاستخدام شعار تليجرام)
              </label>
              <div className="relative">
                <input
                  type="url"
                  dir="ltr"
                  value={newIconUrl}
                  onChange={(e) => setNewIconUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-left"
                />
                <ImageIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {editingGroupId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingGroupId ? 'تحديث الجروب' : 'إضافة الجروب إلى القائمة'}</span>
            </button>
          </div>
        </form>

      </div>

      {/* 4. Added Groups List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400" />
            <span>الجروبات والقنوات المضافة حالياً ({groups.length})</span>
          </h3>
          <span className="text-xs text-slate-400">
            يمكنك حذف أو تعديل أي جروب في أي وقت
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="py-10 text-center space-y-2 bg-slate-950/50 rounded-2xl border border-slate-800/80">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <TelegramPlaneIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-300">لم تتم إضافة أي جروبات تليجرام حتى الآن</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              أضف رابط الجروب أعلاه واضغط "إضافة الجروب" ثم اضغط "حفظ الإعدادات" لتظهر للطلاب.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, idx) => {
              const href = group.link.startsWith('http://') || group.link.startsWith('https://')
                ? group.link
                : `https://${group.link.replace(/^@/, 't.me/')}`;

              return (
                <div
                  key={group.id}
                  className="bg-slate-950 border border-slate-800 hover:border-sky-500/40 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {group.iconUrl ? (
                      <img 
                        src={group.iconUrl} 
                        alt={group.title} 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0088cc] to-[#24A1DE] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <TelegramPlaneIcon className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white truncate">{group.title}</h4>
                      </div>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="text-xs text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1 mt-0.5 truncate text-left"
                      >
                        <span className="truncate">{href}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      {group.description && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(group)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      title="تعديل هذا الجروب"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                      title="حذف هذا الجروب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Big Bottom Save Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-sky-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري حفظ التغييرات...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات في المنصة 💾</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
