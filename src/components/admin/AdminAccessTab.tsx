import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Wrench, 
  Sparkles, 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Save,
  Clock,
  Mail,
  UserCheck,
  Send,
  MessageCircle,
  ExternalLink,
  Eye,
  Check,
  ShieldCheck,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { PlatformAccessConfig, AdminStats } from '../../types';

interface AdminAccessTabProps {
  accessConfig?: PlatformAccessConfig;
  adminStats: AdminStats | null;
  onUpdateLock: (
    isLocked: boolean, 
    options?: {
      lockReason?: 'maintenance' | 'subscription';
      lockMessage?: string;
      subscriptionMessage?: string;
      whatsappNumber?: string;
      whatsappMessage?: string;
      telegramUsername?: string;
      subscriptionButtonText?: string;
    } | string
  ) => Promise<void>;
  onToggleStudentApproval: (email: string, isApproved: boolean) => Promise<void>;
  onToggleStudentBlock?: (email: string, isBlocked: boolean) => Promise<void>;
  onDeleteStudent?: (email: string) => Promise<void>;
  onRefreshStats: () => Promise<void>;
  isSaving: boolean;
}

// Crisp official WhatsApp vector icon
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-5.805 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  );
}

// Crisp official Telegram vector icon
function TelegramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
    </svg>
  );
}

export const AdminAccessTab: React.FC<AdminAccessTabProps> = ({
  accessConfig,
  adminStats,
  onUpdateLock,
  onToggleStudentApproval,
  onToggleStudentBlock,
  onDeleteStudent,
  onRefreshStats,
  isSaving,
}) => {
  const isLocked = Boolean(accessConfig?.isLocked);
  const allowedList = accessConfig?.allowedStudentEmails || [];
  const blockedList = accessConfig?.blockedStudentEmails || [];

  // Mode: maintenance vs subscription
  const [lockReason, setLockReason] = useState<'maintenance' | 'subscription'>(
    accessConfig?.lockReason === 'subscription' ? 'subscription' : 'maintenance'
  );

  // Messages
  const [lockMessage, setLockMessage] = useState(
    accessConfig?.lockMessage ||
      'نحن حالياً في فترة صيانة وتحديثات للمنصة لتجهيز أفضل تجربة تعليمية لكم. سنعود للعمل قريباً!'
  );
  const [subscriptionMessage, setSubscriptionMessage] = useState(
    accessConfig?.subscriptionMessage ||
      'انتهى اشتراكك أو تواصل مع المشرف لتفعيل الاشتراك أو اشترك الآن للوصول لكافة المحتويات والدروس والاختبارات.'
  );

  // WhatsApp & Telegram Settings
  const [whatsappNumber, setWhatsappNumber] = useState(accessConfig?.whatsappNumber || '');
  const [whatsappMessage, setWhatsappMessage] = useState(
    accessConfig?.whatsappMessage || 'السلام عليكم يا أستاذ، أريد تفعيل اشتراكي في منصة التميز التعليمية'
  );
  const [telegramUsername, setTelegramUsername] = useState(accessConfig?.telegramUsername || '');
  const [subscriptionButtonText, setSubscriptionButtonText] = useState(
    accessConfig?.subscriptionButtonText || 'اشترك الآن أو فعّل اشتراكك عبر واتساب'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'blocked'>('all');
  const [updatingStudentEmail, setUpdatingStudentEmail] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ email: string; name: string } | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  // Toggle platform lock with current selected options
  const handleToggleLock = async () => {
    await onUpdateLock(!isLocked, {
      lockReason,
      lockMessage,
      subscriptionMessage,
      whatsappNumber,
      whatsappMessage,
      telegramUsername,
      subscriptionButtonText,
    });
  };

  // Save changes to lock options while keeping current locked/unlocked state
  const handleSaveOptions = async () => {
    await onUpdateLock(isLocked, {
      lockReason,
      lockMessage,
      subscriptionMessage,
      whatsappNumber,
      whatsappMessage,
      telegramUsername,
      subscriptionButtonText,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Delete student confirmation
  const handleConfirmDelete = async () => {
    if (!studentToDelete || !onDeleteStudent) return;
    setIsDeletingStudent(true);
    try {
      await onDeleteStudent(studentToDelete.email);
      setStudentToDelete(null);
      await onRefreshStats();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeletingStudent(false);
    }
  };

  // Toggle individual student approval
  const handleStudentToggle = async (email: string, currentApproved: boolean) => {
    setUpdatingStudentEmail(email);
    try {
      await onToggleStudentApproval(email, !currentApproved);
    } finally {
      setUpdatingStudentEmail(null);
    }
  };

  // Toggle individual student lockdown (قفل المنصة على طالب معين لوحده)
  const handleStudentBlockToggle = async (email: string, currentlyBlocked: boolean) => {
    if (!onToggleStudentBlock) return;
    setUpdatingStudentEmail(email);
    try {
      await onToggleStudentBlock(email, !currentlyBlocked);
    } finally {
      setUpdatingStudentEmail(null);
    }
  };

  // Filter students
  const students = adminStats?.students || [];
  const filteredStudents = students.filter((s) => {
    const isApproved = s.isApproved ?? allowedList.some((e) => e.toLowerCase() === s.email.toLowerCase());
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'approved') return isApproved;
    if (statusFilter === 'blocked') return !isApproved;
    return true;
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Master Lockdown Hero Card */}
      <div className={`p-6 sm:p-7 rounded-3xl border transition-all shadow-sm ${
        isLocked
          ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60'
          : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isLocked
                ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-emerald-600 text-white shadow-emerald-600/30'
            }`}>
              {isLocked ? <Lock className="w-7 h-7" /> : <Unlock className="w-7 h-7" />}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {isLocked ? 'المنصة مقفلة حالياً على الطلاب' : 'المنصة مفتوحة ومتاحة لجميع الطلاب'}
                </h2>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                  isLocked
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                }`}>
                  {isLocked 
                    ? (lockReason === 'subscription' ? 'وضع الاشتراك نَشِط' : 'وضع الصيانة نَشِط') 
                    : 'الوضع الطبيعي'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
                {isLocked
                  ? (lockReason === 'subscription' 
                      ? 'المنصة مقفلة الآن بنظام الاشتراكات؛ يظهر للطالب تنبيه انتهاء الاشتراك مع زر الواتساب والتليجرام للتفعيل الفوري، ولا يدخل سوى الطلاب المفعلين.' 
                      : 'المنصة مقفلة الآن بنظام الصيانة والتحديث الدوري؛ يظهر للطالب تنبيه الصيانة الكلاسيكي.')
                  : 'المنصة متاحة الآن لكل الطلاب. عند تفعيل زر القفل، سيتم حجب المحتوى عن الطلاب غير المفعلين وعرض شاشة القفل المختارة أدناه.'}
              </p>
            </div>
          </div>

          {/* Huge Action Toggle Button */}
          <button
            id="master-lockdown-toggle-btn"
            onClick={handleToggleLock}
            disabled={isSaving}
            className={`w-full md:w-auto px-7 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
              isLocked
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/30'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
            }`}
          >
            {isLocked ? (
              <>
                <Unlock className="w-5 h-5" />
                <span>إلغاء القفل وإعادة فتح المنصة للجميع</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>قفل المنصة على الطلاب بالوضع المحدد</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Mode Selection Cards: Maintenance vs Subscription */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>نوع وشكل شاشة القفل للطلاب:</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اختر ماذا يظهر للطالب عند قفل المنصة، سواء لأعمال الصيانة أو لتفعيل وتجديد الاشتراك عبر واتساب
          </p>
        </div>

        {/* 2 Big Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Choice 1: Maintenance */}
          <div 
            onClick={() => setLockReason('maintenance')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              lockReason === 'maintenance'
                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500 shadow-md ring-2 ring-amber-500/20'
                : 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-750 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  lockReason === 'maintenance' 
                    ? 'bg-amber-500 text-white shadow-amber-500/20' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    الخيار الأول: شاشة الصيانة والتحديث
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    رسالة الصيانة الكلاسيكية وتنبيه العودة قريباً
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                lockReason === 'maintenance' 
                  ? 'border-amber-500 bg-amber-500 text-white' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {lockReason === 'maintenance' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              تُستخدم عند تحديث محتوى المنصة أو الاختبارات، وتعرض رسالة توضح أن المنصة في فترة صيانة.
            </p>
          </div>

          {/* Choice 2: Subscription & WhatsApp */}
          <div 
            onClick={() => setLockReason('subscription')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              lockReason === 'subscription'
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                : 'bg-slate-50/50 dark:bg-slate-850/40 border-slate-200 dark:border-slate-750 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  lockReason === 'subscription' 
                    ? 'bg-[#25D366] text-white shadow-emerald-500/20' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  <WhatsAppIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>الخيار الثاني: شاشة انتهاء الاشتراك والتفعيل</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">موصى به</span>
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    تنبيه الاشتراك مع زر الواتساب والتليجرام المباشر
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                lockReason === 'subscription' 
                  ? 'border-emerald-500 bg-emerald-500 text-white' 
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {lockReason === 'subscription' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              تُخبر الطالب بانتهاء اشتراكه أو حاجته لتفعيل حسابه، مع زر واتساب مباشر يفتح محادثة خاصة معك للاشتراك الفوري.
            </p>
          </div>
        </div>

        {/* Configuration for Subscription Mode */}
        {lockReason === 'subscription' && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4" />
                <span>إعدادات الاشتراك ورابط الواتساب والتليجرام:</span>
              </h4>
              <span className="text-[11px] text-slate-400">ستظهر هذه البيانات مباشرة للطالب في شاشة القفل</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  رقم الواتساب للتواصل والاشتراك:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="مثال: 966501234567 أو 0501234567"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all text-left"
                    dir="ltr"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                    <WhatsAppIcon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  أدخل رقمك مع مفتاح الدولة (مثل 966 أو 20) أو بدونه ليتمكن الطالب من فتح المحادثة مباشرة.
                </p>
              </div>

              {/* Telegram Username / URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  يوزر أو رابط التليجرام (اختياري):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="مثال: @username أو رابط القناة/المشرف"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-all text-left"
                    dir="ltr"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500">
                    <TelegramIcon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  إذا أردت ظهور زر إضافي للتحويل للتليجرام بجانب زر الواتساب.
                </p>
              </div>

              {/* Subscription Button Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  نص زر الاشتراك في الشاشة:
                </label>
                <input
                  type="text"
                  value={subscriptionButtonText}
                  onChange={(e) => setSubscriptionButtonText(e.target.value)}
                  placeholder="مثال: اشترك الآن عبر واتساب"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                />
              </div>

              {/* WhatsApp Message Template */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                  نص الرسالة التلقائية في واتساب:
                </label>
                <input
                  type="text"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  placeholder="مثال: السلام عليكم، أريد تفعيل اشتراكي في منصة التميز"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Subscription Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                الرسالة التوضيحية التي تظهر للطالب (تنبيه انتهاء الاشتراك):
              </label>
              <textarea
                value={subscriptionMessage}
                onChange={(e) => setSubscriptionMessage(e.target.value)}
                rows={2}
                className="w-full p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none transition-all"
                placeholder="مثال: انتهى اشتراكك أو تواصل مع المشرف لتفعيل الاشتراك أو اشترك الآن..."
              />
            </div>
          </div>
        )}

        {/* Configuration for Maintenance Mode */}
        {lockReason === 'maintenance' && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-3 transition-all">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                رسالة الصيانة التي تظهر للطالب:
              </h4>
            </div>
            <textarea
              value={lockMessage}
              onChange={(e) => setLockMessage(e.target.value)}
              rows={2}
              className="w-full p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-hidden resize-none transition-all"
              placeholder="اكتب هنا تفاصيل الصيانة وموعد العودة..."
            />
          </div>
        )}

        {/* Save Options Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            اضغط زر الحفظ أدناه لتحديث نصوص وروابط القفل في أي وقت.
          </p>
          <button
            id="save-lock-options-btn"
            onClick={handleSaveOptions}
            disabled={isSaving}
            className="px-5 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccess ? 'تم حفظ التعديلات بنجاح!' : 'حفظ وتحديث الإعدادات'}</span>
          </button>
        </div>
      </div>

      {/* Student Approval Management List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تفعيل واستثناء الطلاب الفرديين أثناء القفل
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              الطلاب المفعلون هنا يستطيعون فتح كافة الدروس والاختبارات حتى أثناء قفل المنصة.
            </p>
          </div>

          <button
            onClick={() => onRefreshStats()}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تحديث القائمة</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-850/40 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن طالب بالاسم أو البريد الإلكتروني..."
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-750 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-800 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              الكل ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              المفعلين ({students.filter(s => s.isApproved ?? allowedList.some(e => e.toLowerCase() === s.email.toLowerCase())).length})
            </button>
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'blocked'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              غير المفعلين ({students.filter(s => !(s.isApproved ?? allowedList.some(e => e.toLowerCase() === s.email.toLowerCase()))).length})
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-4 sm:px-6">الطالب</th>
                <th className="py-3.5 px-4 sm:px-6 hidden sm:table-cell">البريد الإلكتروني</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">حالة الاشتراك والتفعيل</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">إجراء التفعيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>لا يوجد طلاب يطابقون معايير البحث الحالية.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isApproved = student.isApproved ?? allowedList.some(e => e.toLowerCase() === student.email.toLowerCase());
                  const isIndividuallyBlocked = Boolean(
                    student.isIndividuallyBlocked ||
                    blockedList.some(e => e.toLowerCase() === student.email.toLowerCase())
                  );
                  const isUpdating = updatingStudentEmail === student.email;

                  return (
                    <tr 
                      key={student.id || student.email}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-850/50 transition-colors ${
                        isIndividuallyBlocked ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isIndividuallyBlocked 
                              ? 'bg-rose-600 text-white shadow-xs' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {student.name}
                              </span>
                              {isIndividuallyBlocked && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-2xs">
                                  محظور فردياً 🔒
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 sm:hidden block font-mono">
                              {student.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 hidden sm:table-cell font-mono text-xs text-slate-500 dark:text-slate-400">
                        {student.email}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isIndividuallyBlocked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>مقفول عليه فردياً</span>
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>مفعّل (دخول كامل)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              <XCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>غير مفعّل (محجوب أثناء القفل العام)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {/* Individual Lockdown Button */}
                          {onToggleStudentBlock && (
                            <button
                              onClick={() => handleStudentBlockToggle(student.email, isIndividuallyBlocked)}
                              disabled={isUpdating || isSaving}
                              title={isIndividuallyBlocked ? 'فك القفل الفردي عن الطالب وإعادة فتحه' : 'قفل المنصة على هذا الطالب فقط حتى لو المنصة مفتوحة للجميع'}
                              className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
                                isIndividuallyBlocked
                                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                              }`}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>{isIndividuallyBlocked ? '🔓 فك القفل الفردي' : '🔒 قفل فردي على الطالب'}</span>
                            </button>
                          )}

                          {/* Approval Toggle */}
                          <button
                            onClick={() => handleStudentToggle(student.email, isApproved)}
                            disabled={isUpdating || isSaving}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                              isApproved
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isUpdating ? 'جاري...' : isApproved ? 'تعطيل بالوضع العام' : 'تفعيل بالوضع العام'}
                          </button>

                          {onDeleteStudent && (
                            <button
                              onClick={() => setStudentToDelete({ email: student.email, name: student.name })}
                              disabled={isSaving || isDeletingStudent}
                              title="حذف الطالب نهائياً من المنصة"
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Delete Student Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full text-right shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white text-center">
              تأكيد حذف حساب الطالب
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-center">
              هل أنت متأكد من رغبتك في حذف حساب الطالب <span className="font-bold text-slate-900 dark:text-white">{studentToDelete.name}</span> ({studentToDelete.email})؟ 
              سيتم مسح بيانات الطالب وسجلاته نهائياً من المنصة.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeletingStudent}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeletingStudent ? 'جاري الحذف...' : 'نعم، احذف الحساب'}
              </button>
              <button
                onClick={() => setStudentToDelete(null)}
                disabled={isDeletingStudent}
                className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
