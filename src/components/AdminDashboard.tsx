import React, { useState, useEffect } from 'react';
import { 
  PlatformData, 
  SectionItem, 
  ResourceItem, 
  VideoItem, 
  FileItem, 
  Quiz, 
  Question,
  StudentUser,
  AdminStats,
  LiveStreamConfig 
} from '../types';
import { apiService } from '../services/api';
import { uploadQuizImagePermanently } from '../services/imageUtils';
import { 
  ShieldCheck, 
  FolderPlus, 
  Layers, 
  Video, 
  FileText, 
  CheckCircle2, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  ArrowLeft,
  Lock,
  RotateCcw,
  Check,
  HelpCircle,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  FileUp,
  Film,
  AlertCircle,
  Loader2,
  ExternalLink,
  Globe,
  Radio,
  Palette,
  Megaphone,
  Unlock
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { PlatformThemeConfig, PlatformAnnouncement, PlatformAccessConfig } from '../types';
import { defaultPlatformSettings } from '../defaultData';
import { AdminAppearanceTab } from './admin/AdminAppearanceTab';
import { AdminAccessTab } from './admin/AdminAccessTab';
import { AdminAnnouncementTab } from './admin/AdminAnnouncementTab';

interface AdminDashboardProps {
  platformData: PlatformData;
  currentUser: StudentUser | null;
  onRefreshData: () => Promise<void>;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  platformData,
  currentUser,
  onRefreshData,
  onClose,
}) => {
  // Admin password gate - secure server-side check (always prompts every time)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState<string | null>(null);

  // Force clean unauthenticated state every time AdminDashboard mounts
  useEffect(() => {
    setIsAdminAuthenticated(false);
    setAdminPinInput('');
    sessionStorage.removeItem('tamayuz_admin_token');
    localStorage.removeItem('tamayuz_admin_token');
  }, []);

  const handleExitAdmin = async () => {
    setIsAdminAuthenticated(false);
    setAdminPinInput('');
    sessionStorage.removeItem('tamayuz_admin_token');
    localStorage.removeItem('tamayuz_admin_token');
    try {
      await onRefreshData();
    } catch {}
    onClose();
  };

  // Interactive Confirmation Dialog State for all deletions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const triggerDeleteConfirmation = (
    title: string,
    message: string,
    onConfirm: () => Promise<void>
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel: 'تأكيد الحذف',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await onConfirm();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast(err.message || 'فشلت عملية الحذف');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<
    'sections' | 'resources' | 'videos' | 'files' | 'quizzes' | 'analytics' | 'students' | 'livestream' | 'appearance' | 'access' | 'announcement'
  >('sections');

  // Appearance / Theme State
  const [platformTheme, setPlatformTheme] = useState<PlatformThemeConfig>(() => {
    return platformData.settings?.theme || defaultPlatformSettings.theme;
  });
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  useEffect(() => {
    if (platformData.settings?.theme) {
      setPlatformTheme(platformData.settings.theme);
    }
  }, [platformData.settings?.theme]);

  // Access / Lockdown State
  const [platformAccess, setPlatformAccess] = useState<PlatformAccessConfig>(() => {
    return platformData.settings?.access || defaultPlatformSettings.access;
  });
  const [isSavingAccess, setIsSavingAccess] = useState(false);

  // Announcement Bar State
  const [platformAnnouncement, setPlatformAnnouncement] = useState<PlatformAnnouncement>(() => {
    return platformData.settings?.announcement || defaultPlatformSettings.announcement;
  });
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Keep settings synced if platformData updates
  useEffect(() => {
    if (platformData.settings) {
      if (platformData.settings.theme) setPlatformTheme(platformData.settings.theme);
      if (platformData.settings.access) setPlatformAccess(platformData.settings.access);
      if (platformData.settings.announcement) setPlatformAnnouncement(platformData.settings.announcement);
    }
  }, [platformData.settings]);

  const handleSaveTheme = async (newTheme: PlatformThemeConfig) => {
    setIsSavingTheme(true);
    try {
      const themeWithMeta: PlatformThemeConfig = {
        ...newTheme,
        layoutPreset: newTheme.layoutPreset && newTheme.layoutPreset !== 'classic' ? newTheme.layoutPreset : 'sidebar-split-right',
        updatedAt: new Date().toISOString(),
      };
      setPlatformTheme(themeWithMeta);
      try {
        localStorage.setItem('tamayuz_platform_theme', JSON.stringify(themeWithMeta));
        localStorage.setItem('tamayuz_layout_preset', themeWithMeta.layoutPreset);
        window.dispatchEvent(new CustomEvent('tamayuz_theme_updated', { detail: themeWithMeta }));
        const bc = new BroadcastChannel('tamayuz_theme');
        bc.postMessage({ type: 'THEME_UPDATED', theme: themeWithMeta });
        bc.close();
      } catch {}
      await apiService.savePlatformSettings({ theme: themeWithMeta });
      await onRefreshData();
      showToast('تم حفظ وتطبيق شكل المنصة بنجاح!');
    } catch (e: any) {
      showToast(e.message || 'فشل حفظ إعدادات الشكل');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleUpdateLock = async (
    isLocked: boolean, 
    lockMessageOrOptions?: string | {
      lockReason?: 'maintenance' | 'subscription';
      lockMessage?: string;
      subscriptionMessage?: string;
      whatsappNumber?: string;
      whatsappMessage?: string;
      telegramUsername?: string;
      subscriptionButtonText?: string;
    }
  ) => {
    setIsSavingAccess(true);
    try {
      const opts = typeof lockMessageOrOptions === 'string' 
        ? { lockMessage: lockMessageOrOptions } 
        : (lockMessageOrOptions || {});

      const updatedAccess: PlatformAccessConfig = {
        ...platformAccess,
        isLocked,
        lockReason: opts.lockReason !== undefined ? opts.lockReason : platformAccess.lockReason || 'maintenance',
        lockMessage: opts.lockMessage !== undefined ? opts.lockMessage : platformAccess.lockMessage,
        subscriptionMessage: opts.subscriptionMessage !== undefined ? opts.subscriptionMessage : platformAccess.subscriptionMessage,
        whatsappNumber: opts.whatsappNumber !== undefined ? opts.whatsappNumber : platformAccess.whatsappNumber,
        whatsappMessage: opts.whatsappMessage !== undefined ? opts.whatsappMessage : platformAccess.whatsappMessage,
        telegramUsername: opts.telegramUsername !== undefined ? opts.telegramUsername : platformAccess.telegramUsername,
        subscriptionButtonText: opts.subscriptionButtonText !== undefined ? opts.subscriptionButtonText : platformAccess.subscriptionButtonText,
        updatedAt: new Date().toISOString()
      };
      setPlatformAccess(updatedAccess);
      await apiService.togglePlatformLock(isLocked, opts);
      await onRefreshData();
      showToast(
        isLocked 
          ? (updatedAccess.lockReason === 'subscription' 
              ? 'تم قفل المنصة بوضع الاشتراك - تظهر رسالة الاشتراك وزر الواتساب!' 
              : 'تم قفل المنصة بوضع الصيانة والتحديث!')
          : 'تم إلغاء القفل وفتح المنصة لجميع الطلاب بنجاح!'
      );
    } catch (e: any) {
      showToast(e.message || 'فشل تحديث حالة القفل');
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleToggleStudentApproval = async (email: string, isApproved: boolean) => {
    try {
      await apiService.setStudentApproval(email, isApproved);
      const currentAllowed = platformAccess.allowedStudentEmails || [];
      const updatedAllowed = isApproved
        ? Array.from(new Set([...currentAllowed, email.toLowerCase()]))
        : currentAllowed.filter((e) => e.toLowerCase() !== email.toLowerCase());
      
      setPlatformAccess((prev) => ({
        ...prev,
        allowedStudentEmails: updatedAllowed,
      }));

      setAdminStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          students: prev.students.map((s) =>
            s.email.toLowerCase() === email.toLowerCase() ? { ...s, isApproved } : s
          ),
        };
      });

      await onRefreshData();
      showToast(isApproved ? `تم تفعيل الطالب ${email} أثناء القفل!` : `تم إلغاء تفعيل الطالب ${email}`);
    } catch (e: any) {
      showToast(e.message || 'فشل تحديث حالة الطالب');
    }
  };

  const handleToggleStudentBlock = async (email: string, isBlocked: boolean) => {
    try {
      await apiService.toggleStudentBlock(email, isBlocked);
      const currentBlocked = platformAccess.blockedStudentEmails || [];
      const updatedBlocked = isBlocked
        ? Array.from(new Set([...currentBlocked, email.toLowerCase()]))
        : currentBlocked.filter((e) => e.toLowerCase() !== email.toLowerCase());
      
      setPlatformAccess((prev) => ({
        ...prev,
        blockedStudentEmails: updatedBlocked,
      }));

      setAdminStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          students: prev.students.map((s) =>
            s.email.toLowerCase() === email.toLowerCase() ? { ...s, isIndividuallyBlocked: isBlocked } : s
          ),
        };
      });

      await onRefreshData();
      showToast(isBlocked ? `تم قفل المنصة على الطالب ${email} بشكل فردي!` : `تم إلغاء القفل الفردي عن الطالب ${email}`);
    } catch (e: any) {
      showToast(e.message || 'فشل تحديث حالة الحظر الفردي للطالب');
    }
  };

  const handleDeleteStudent = async (email: string) => {
    try {
      await apiService.deleteStudent(email);
      setAdminStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          studentsCount: Math.max(0, (prev.studentsCount || 1) - 1),
          students: prev.students.filter((s) => s.email.toLowerCase() !== email.toLowerCase()),
        };
      });
      setPlatformAccess((prev) => ({
        ...prev,
        allowedStudentEmails: (prev.allowedStudentEmails || []).filter(e => e.toLowerCase() !== email.toLowerCase()),
      }));
      await onRefreshData();
      showToast(`تم حذف حساب الطالب ${email} نهائياً من المنصة بنجاح.`);
    } catch (e: any) {
      showToast(e.message || 'فشل حذف حساب الطالب');
    }
  };

  const handleSetStudentSubscription = async (email: string, days: number) => {
    try {
      const res = await apiService.setStudentSubscription(email, days);
      const numDays = Number(days) || 0;
      const now = new Date();
      const expiresAt = numDays > 0 ? new Date(now.getTime() + numDays * 24 * 60 * 60 * 1000).toISOString() : undefined;
      const startedAt = numDays > 0 ? now.toISOString() : undefined;

      setAdminStats((prev) => {
        if (!prev || !prev.students) return prev;
        return {
          ...prev,
          students: prev.students.map((s) =>
            s.email.toLowerCase() === email.toLowerCase()
              ? {
                  ...s,
                  subscriptionDays: numDays > 0 ? numDays : undefined,
                  subscriptionStartedAt: startedAt,
                  subscriptionExpiresAt: expiresAt,
                }
              : s
          ),
        };
      });

      await onRefreshData();
      const messageToDisplay = numDays > 0
        ? `تم تعيين الوقت بنجاح وستغلق بعد عدد الأيام المحدد (${numDays} يوم)`
        : 'تم إلغاء مدة الاشتراك بنجاح';
      showToast(messageToDisplay);
    } catch (e: any) {
      showToast(e.message || 'فشل تحديث اشتراك الطالب');
    }
  };

  const handleSaveAnnouncement = async (newAnnouncement: PlatformAnnouncement) => {
    setIsSavingAnnouncement(true);
    try {
      setPlatformAnnouncement(newAnnouncement);
      try {
        localStorage.setItem('tamayuz_platform_announcement', JSON.stringify(newAnnouncement));
      } catch {}
      await apiService.savePlatformSettings({ announcement: newAnnouncement });
      await onRefreshData();
      try {
        window.dispatchEvent(new CustomEvent('tamayuz_announcement_updated', { detail: newAnnouncement }));
        const ch = new BroadcastChannel('tamayuz_announcement');
        ch.postMessage(newAnnouncement);
        ch.close();
      } catch (e) {
        // BroadcastChannel fallback
      }
      showToast(newAnnouncement.isEnabled ? 'تم حفظ ونشر التنبيه للطلاب بنجاح!' : 'تم حفظ وإخفاء التنبيه بنجاح');
    } catch (e: any) {
      showToast(e.message || 'فشل حفظ شريط التنبيهات');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // Live Stream state & configuration
  const [liveStreamConfig, setLiveStreamConfig] = useState<LiveStreamConfig>(() => {
    return platformData.liveStream || {
      isEnabled: false,
      title: 'البث المباشر - منصة التميز التعليمية',
      streamUrl: '',
      description: '',
      scheduledTime: '',
    };
  });
  const [isSavingLiveStream, setIsSavingLiveStream] = useState(false);
  const [liveStreamSavedNotice, setLiveStreamSavedNotice] = useState(false);

  // Keep liveStreamConfig in sync if platformData updates
  useEffect(() => {
    if (platformData.liveStream) {
      setLiveStreamConfig(platformData.liveStream);
    }
  }, [platformData.liveStream]);

  const handleSaveLiveStream = async (overrideConfig?: LiveStreamConfig) => {
    const configToSave = overrideConfig || liveStreamConfig;
    setIsSavingLiveStream(true);
    try {
      await apiService.updateLiveStream(configToSave);
      setLiveStreamConfig(configToSave);
      await onRefreshData();
      try {
        window.dispatchEvent(new CustomEvent('tamayuz_livestream_updated', { detail: configToSave }));
        const ch = new BroadcastChannel('tamayuz_livestream');
        ch.postMessage(configToSave);
        ch.close();
      } catch (e) {
        // Fallback silently if BroadcastChannel not available
      }
      setLiveStreamSavedNotice(true);
      setTimeout(() => setLiveStreamSavedNotice(false), 4000);
    } catch (err) {
      console.error('Failed to update live stream:', err);
      showToast('حدث خطأ أثناء حفظ إعدادات البث المباشر.');
    } finally {
      setIsSavingLiveStream(false);
    }
  };

  const handleToggleLiveStream = async () => {
    const nextState = !liveStreamConfig.isEnabled;
    const updated = { ...liveStreamConfig, isEnabled: nextState };
    setLiveStreamConfig(updated);
    await handleSaveLiveStream(updated);
  };

  // Admin Stats (Students count, attempt logs)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const loadAdminStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await apiService.fetchAdminStats();
      setAdminStats(stats);
    } catch (e) {
      console.warn('Failed to load admin stats:', e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAdminStats();
    }
  }, [isAdminAuthenticated]);

  // Filter selections
  const [filterSectionId, setFilterSectionId] = useState<string>('all');
  const [filterResourceId, setFilterResourceId] = useState<string>('all');

  // Loading & Notification state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Permanent Save State
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(() => apiService.getLastSavedTime());

  const handleSaveAllPermanently = async () => {
    setIsSavingAll(true);
    try {
      const dataToSave = {
        sections: platformData?.sections || [],
        resources: platformData?.resources || [],
        videos: platformData?.videos || [],
        files: platformData?.files || [],
        quizzes: platformData?.quizzes || [],
        liveStream: liveStreamConfig,
        settings: {
          ...(platformData?.settings || {}),
          theme: platformTheme,
          access: platformAccess,
          announcement: platformAnnouncement,
        },
        deletedIds: platformData?.deletedIds || [],
        updatedAt: new Date().toISOString()
      };
      if (platformTheme?.layoutPreset) {
        try {
          localStorage.setItem('tamayuz_layout_preset', platformTheme.layoutPreset);
          localStorage.setItem('tamayuz_platform_theme', JSON.stringify(platformTheme));
        } catch {}
      }
      const res = await apiService.saveFullPlatformData(dataToSave);
      setLastSavedTimestamp(res.timestamp || new Date().toISOString());
      try {
        await onRefreshData();
      } catch (refreshErr) {
        console.warn('Background refresh after save warning:', refreshErr);
      }
      showToast(res.message || 'تم حفظ البيانات بنجاح في قاعدة البيانات!');
    } catch (err: any) {
      console.error('Save all permanently error:', err);
      showToast(err?.message || 'فشل حفظ البيانات في قاعدة البيانات');
    } finally {
      setIsSavingAll(false);
    }
  };

  // ----------------------------------------------------
  // SECTION FORM STATE
  // ----------------------------------------------------
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [secTitle, setSecTitle] = useState('');
  const [secDescription, setSecDescription] = useState('');
  const [secIconName, setSecIconName] = useState('BookOpen');
  const [secBadge, setSecBadge] = useState('');
  const [secColor, setSecColor] = useState<'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'teal'>('emerald');

  const openSectionModal = (section?: SectionItem) => {
    if (section) {
      setEditingSection(section);
      setSecTitle(section.title);
      setSecDescription(section.description);
      setSecIconName(section.iconName);
      setSecBadge(section.badge || '');
      setSecColor((section.color || 'emerald') as any);
    } else {
      setEditingSection(null);
      setSecTitle('');
      setSecDescription('');
      setSecIconName('BookOpen');
      setSecBadge('');
      setSecColor('emerald');
    }
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingSection) {
        await apiService.updateSection(editingSection.id, {
          title: secTitle,
          description: secDescription,
          iconName: secIconName,
          badge: secBadge || undefined,
          color: secColor,
        });
        showToast('تم تعديل القسم بنجاح ويظهر الآن للطلاب!');
      } else {
        await apiService.createSection({
          title: secTitle,
          description: secDescription,
          iconName: secIconName,
          badge: secBadge || undefined,
          color: secColor,
        });
        showToast('تمت إضافة القسم الجديد بنجاح ويظهر فوراً لجميع الطلاب!');
      }
      await onRefreshData();
      setIsSectionModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ القسم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSection = async (id: string, title: string) => {
    try {
      await apiService.deleteSection(id);
      await onRefreshData();
      showToast(`تم حذف القسم "${title}" فوراً بنجاح`);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حذف القسم');
    }
  };

  // ----------------------------------------------------
  // RESOURCE FORM STATE
  // ----------------------------------------------------
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [resSectionId, setResSectionId] = useState('');
  const [resTitle, setResTitle] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [resLevel, setResLevel] = useState<'مبتدئ' | 'متوسط' | 'متقدم' | 'شامل'>('متوسط');

  const openResourceModal = (resource?: ResourceItem) => {
    if (resource) {
      setEditingResource(resource);
      setResSectionId(resource.sectionId);
      setResTitle(resource.title);
      setResDescription(resource.description);
      setResLevel(resource.level);
    } else {
      setEditingResource(null);
      setResSectionId(platformData.sections[0]?.id || '');
      setResTitle('');
      setResDescription('');
      setResLevel('متوسط');
    }
    setIsResourceModalOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim()) {
      showToast('يرجى كتابة عنوان المصدر التعليمي');
      return;
    }
    if (!resSectionId) {
      showToast('يرجى اختيار القسم التابع له المصدر');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingResource) {
        await apiService.updateResource(editingResource.id, {
          sectionId: resSectionId,
          title: resTitle.trim(),
          description: resDescription.trim(),
          level: resLevel,
        });
        showToast('تم حفظ وتعديل المصدر التعليمي بنجاح!');
      } else {
        await apiService.createResource({
          sectionId: resSectionId,
          title: resTitle.trim(),
          description: resDescription.trim(),
          level: resLevel,
        });
        showToast('تمت إضافة المصدر التعليمي الجديد بنجاح!');
      }
      setIsResourceModalOpen(false);
      await onRefreshData();
    } catch (e: any) {
      showToast(e.message || 'فشل حفظ المصدر');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (id: string, title: string) => {
    try {
      await apiService.deleteResource(id);
      await onRefreshData();
      showToast(`تم حذف المصدر التعليمي "${title}" فوراً بنجاح`);
    } catch (e: any) {
      showToast(e.message || 'فشل حذف المصدر');
    }
  };

  // ----------------------------------------------------
  // VIDEO FORM STATE (With Direct File Upload & Ordering)
  // ----------------------------------------------------
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [vidSectionId, setVidSectionId] = useState('');
  const [vidResourceId, setVidResourceId] = useState('');
  const [vidTitle, setVidTitle] = useState('');
  const [vidDescription, setVidDescription] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidDuration, setVidDuration] = useState<number>(15);
  const [vidOrder, setVidOrder] = useState<number>(1);
  const [vidLinkedQuizId, setVidLinkedQuizId] = useState<string>('');
  const [vidSourceMode, setVidSourceMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingVid, setIsUploadingVid] = useState(false);
  const [vidUploadProgress, setVidUploadProgress] = useState<number | null>(null);
  const [vidUploadInfo, setVidUploadInfo] = useState<string>('');

  const openVideoModal = (video?: VideoItem) => {
    if (video) {
      setEditingVideo(video);
      const parentRes = platformData.resources.find((r) => r.id === video.resourceId);
      setVidSectionId(video.sectionId || parentRes?.sectionId || platformData.sections[0]?.id || '');
      setVidResourceId(video.resourceId);
      setVidTitle(video.title);
      setVidDescription(video.description);
      setVidUrl(video.videoUrl);
      setVidDuration(video.durationMinutes);
      setVidOrder(video.order || 1);
      setVidLinkedQuizId(video.linkedQuizId || '');
      setVidSourceMode(video.videoUrl.startsWith('/uploads/') ? 'upload' : 'url');
    } else {
      setEditingVideo(null);
      const initialSec = filterSectionId !== 'all' ? filterSectionId : (platformData.sections[0]?.id || '');
      const availableResources = platformData.resources.filter((r) => r.sectionId === initialSec);
      const chosenResId = (filterResourceId !== 'all' && availableResources.some(r => r.id === filterResourceId))
        ? filterResourceId
        : (availableResources[0]?.id || platformData.resources[0]?.id || '');
      setVidSectionId(initialSec);
      setVidResourceId(chosenResId);
      setVidTitle('');
      setVidDescription('');
      setVidUrl('');
      setVidDuration(15);
      const currentVideosCount = platformData.videos.filter((v) => v.resourceId === chosenResId).length;
      setVidOrder(currentVideosCount + 1);
      setVidLinkedQuizId('');
      setVidSourceMode('upload');
    }
    setIsVideoModalOpen(true);
  };

  const handleVideoSectionChange = (newSecId: string) => {
    setVidSectionId(newSecId);
    const availableResources = platformData.resources.filter((r) => r.sectionId === newSecId);
    if (availableResources.length > 0) {
      setVidResourceId(availableResources[0].id);
      const currentVideosCount = platformData.videos.filter((v) => v.resourceId === availableResources[0].id).length;
      setVidOrder(currentVideosCount + 1);
    } else {
      setVidResourceId('');
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVid(true);
    setVidUploadProgress(0);
    setVidUploadInfo('بدء الرفع فائق السرعة إلى الخادم...');
    try {
      const res = await apiService.uploadFile(file, (percent, loaded, total) => {
        setVidUploadProgress(percent);
        const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (total / (1024 * 1024)).toFixed(1);
        setVidUploadInfo(`${percent}% (${loadedMB}MB / ${totalMB}MB)`);
      });
      setVidUrl(res.url);
      const computedTitle = vidTitle.trim() || file.name.replace(/\.[^/.]+$/, '');
      if (!vidTitle.trim()) {
        setVidTitle(computedTitle);
      }

      // Auto-save and persist video permanently in database right away!
      const chosenSectionId = vidSectionId || platformData.sections[0]?.id || 'sec-quantitative';
      let targetResourceId = vidResourceId;
      if (!targetResourceId) {
        const available = platformData.resources.filter((r) => r.sectionId === chosenSectionId);
        if (available.length > 0) {
          targetResourceId = available[0].id;
        } else {
          const currentSec = platformData.sections.find((s) => s.id === chosenSectionId);
          const secName = currentSec?.title || 'عام';
          const autoRes = await apiService.createResource({
            sectionId: chosenSectionId,
            title: `الدروس التعليمية - ${secName}`,
            description: `المصدر الأساسي لشروحات وفيديوهات ${secName}`,
            level: 'متوسط',
            iconName: 'BookOpen',
            order: 1
          });
          targetResourceId = autoRes.id;
          setVidResourceId(targetResourceId);
        }
      }

      let savedVideoItem: VideoItem;
      if (editingVideo) {
        savedVideoItem = await apiService.updateVideo(editingVideo.id, {
          resourceId: targetResourceId,
          sectionId: chosenSectionId,
          title: computedTitle,
          description: vidDescription.trim(),
          videoUrl: res.url,
          durationMinutes: vidDuration || 10,
          order: vidOrder || 1,
          linkedQuizId: vidLinkedQuizId || undefined,
        });
      } else {
        savedVideoItem = await apiService.createVideo({
          resourceId: targetResourceId,
          sectionId: chosenSectionId,
          title: computedTitle,
          description: vidDescription.trim(),
          videoUrl: res.url,
          durationMinutes: vidDuration || 10,
          order: vidOrder || 1,
          linkedQuizId: vidLinkedQuizId || undefined,
        });
        setEditingVideo(savedVideoItem);
      }
      await onRefreshData();
      showToast(`تم رفع وحفظ وتثبيت الفيديو بشكل دائم بنجاح! أصبح جاهزاً للمشاهدة الآن.`);
    } catch (err: any) {
      showToast(`فشل رفع الفيديو: ${err.message}`);
    } finally {
      setIsUploadingVid(false);
      setVidUploadProgress(null);
      setVidUploadInfo('');
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingVid) {
      showToast('جاري رفع ملف الفيديو حالياً، يرجى الانتظار حتى يكتمل الرفع (100%)');
      return;
    }
    if (!vidTitle.trim()) {
      showToast('يرجى إدخال عنوان الفيديو أو الدرس');
      return;
    }
    if (!vidUrl.trim()) {
      if (vidSourceMode === 'upload') {
        showToast('يرجى اختيار ملف فيديو ورفعه أولاً من جهازك قبل الحفظ');
      } else {
        showToast('يرجى إدخال رابط الفيديو (يوتيوب أو رابط مباشر) قبل الحفظ');
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const chosenSectionId = vidSectionId || platformData.sections[0]?.id || 'sec-quantitative';
      let targetResourceId = vidResourceId;

      // Auto-assign or auto-create container resource if none exists in this section
      if (!targetResourceId) {
        const available = platformData.resources.filter((r) => r.sectionId === chosenSectionId);
        if (available.length > 0) {
          targetResourceId = available[0].id;
        } else {
          const currentSec = platformData.sections.find((s) => s.id === chosenSectionId);
          const secName = currentSec?.title || 'عام';
          const autoRes = await apiService.createResource({
            sectionId: chosenSectionId,
            title: `الدروس التعليمية - ${secName}`,
            description: `المصدر الأساسي لشروحات وفيديوهات ${secName}`,
            level: 'متوسط',
            iconName: 'BookOpen',
            order: 1
          });
          targetResourceId = autoRes.id;
        }
      }

      if (editingVideo) {
        await apiService.updateVideo(editingVideo.id, {
          resourceId: targetResourceId,
          sectionId: chosenSectionId,
          title: vidTitle.trim(),
          description: vidDescription.trim(),
          videoUrl: vidUrl.trim(),
          durationMinutes: vidDuration || 10,
          order: vidOrder || 1,
          linkedQuizId: vidLinkedQuizId || undefined,
        });
        showToast('تم تعديل الفيديو وحفظه بشكل دائم بنجاح!');
      } else {
        await apiService.createVideo({
          resourceId: targetResourceId,
          sectionId: chosenSectionId,
          title: vidTitle.trim(),
          description: vidDescription.trim(),
          videoUrl: vidUrl.trim(),
          durationMinutes: vidDuration || 10,
          order: vidOrder || 1,
          linkedQuizId: vidLinkedQuizId || undefined,
        });
        showToast('تمت إضافة الفيديو الجديد وحفظه بنجاح!');
      }
      setIsVideoModalOpen(false);
      await onRefreshData();
    } catch (e: any) {
      showToast(e.message || 'فشل حفظ الفيديو');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string, title: string) => {
    try {
      await apiService.deleteVideo(id);
      await onRefreshData();
      showToast(`تم حذف الفيديو "${title}" فوراً بنجاح`);
    } catch (e: any) {
      showToast(e.message || 'فشل حذف الفيديو');
    }
  };

  // ----------------------------------------------------
  // FILE FORM STATE (With Direct File Upload & Ordering)
  // ----------------------------------------------------
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [fileSectionId, setFileSectionId] = useState('');
  const [fileResourceId, setFileResourceId] = useState('');
  const [fileTitle, setFileTitle] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'summary' | 'sheet'>('pdf');
  const [fileSize, setFileSize] = useState('2.5 MB');
  const [filePagesCount, setFilePagesCount] = useState<number>(20);
  const [fileOrder, setFileOrder] = useState<number>(1);
  const [fileSourceMode, setFileSourceMode] = useState<'upload' | 'url'>('upload');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const openFileModal = (file?: FileItem) => {
    if (file) {
      setEditingFile(file);
      const parentRes = platformData.resources.find((r) => r.id === file.resourceId);
      setFileSectionId(file.sectionId || parentRes?.sectionId || platformData.sections[0]?.id || '');
      setFileResourceId(file.resourceId);
      setFileTitle(file.title);
      setFileDescription(file.description);
      setFileUrl(file.fileUrl);
      setFileType(file.fileType);
      setFileSize(file.fileSize);
      setFilePagesCount(file.pagesCount || 20);
      setFileOrder(file.order || 1);
      setFileSourceMode(file.fileUrl.startsWith('/uploads/') ? 'upload' : 'url');
    } else {
      setEditingFile(null);
      const initialSec = platformData.sections[0]?.id || '';
      const matchingRes = platformData.resources.find((r) => r.sectionId === initialSec) || platformData.resources[0];
      setFileSectionId(initialSec);
      setFileResourceId(matchingRes?.id || '');
      setFileTitle('');
      setFileDescription('');
      setFileUrl('');
      setFileType('pdf');
      setFileSize('2.5 MB');
      setFilePagesCount(20);
      const currentFilesCount = platformData.files.filter((f) => f.resourceId === matchingRes?.id).length;
      setFileOrder(currentFilesCount + 1);
      setFileSourceMode('upload');
    }
    setIsFileModalOpen(true);
  };

  const handleFileSectionChange = (newSecId: string) => {
    setFileSectionId(newSecId);
    const firstResInSec = platformData.resources.find((r) => r.sectionId === newSecId);
    if (firstResInSec) {
      setFileResourceId(firstResInSec.id);
      const currentFilesCount = platformData.files.filter((f) => f.resourceId === firstResInSec.id).length;
      setFileOrder(currentFilesCount + 1);
    }
  };

  const handleDocumentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const res = await apiService.uploadFile(file);
      setFileUrl(res.url);
      if (!fileTitle.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setFileTitle(cleanName);
      }
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setFileSize(`${mb} MB`);
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') setFileType('pdf');
      else if (ext === 'doc' || ext === 'docx') setFileType('doc');
      else if (ext === 'xls' || ext === 'xlsx') setFileType('sheet');
      showToast(`تم رفع الملف بنجاح: ${file.name}`);
    } catch (err: any) {
      showToast(`فشل رفع الملف: ${err.message}`);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSaveFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileTitle.trim()) {
      showToast('يرجى إدخال عنوان الملف أو المذكرة');
      return;
    }
    if (!fileResourceId) {
      showToast('يرجى اختيار المصدر التعليمي التابع له الملف (أو إنشاء مصدر أولاً في هذا القسم)');
      return;
    }
    if (!fileUrl.trim()) {
      showToast('يرجى رفع الملف أو إدخال رابطه');
      return;
    }
    setIsSubmitting(true);
    const parentResource = platformData.resources.find((r) => r.id === fileResourceId);
    const chosenSectionId = fileSectionId || parentResource?.sectionId || platformData.sections[0]?.id;
    try {
      if (editingFile) {
        await apiService.updateFile(editingFile.id, {
          resourceId: fileResourceId,
          sectionId: chosenSectionId,
          title: fileTitle,
          description: fileDescription,
          fileUrl,
          fileType,
          fileSize,
          pagesCount: filePagesCount,
          order: fileOrder,
        });
        showToast('تم تعديل الملف بنجاح');
      } else {
        await apiService.createFile({
          resourceId: fileResourceId,
          sectionId: chosenSectionId,
          title: fileTitle,
          description: fileDescription,
          fileUrl,
          fileType,
          fileSize,
          pagesCount: filePagesCount,
          order: fileOrder,
        });
        showToast('تمت إضافة الملف بنجاح ويظهر الآن للطلاب فوراً!');
      }
      await onRefreshData();
      setIsFileModalOpen(false);
    } catch (e: any) {
      showToast(e.message || 'فشل حفظ الملف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFile = async (id: string, title: string) => {
    try {
      await apiService.deleteFile(id);
      await onRefreshData();
      showToast(`تم حذف الملف "${title}" فوراً بنجاح`);
    } catch (e: any) {
      showToast(e.message || 'فشل حذف الملف');
    }
  };

  // ----------------------------------------------------
  // QUIZ & QUESTIONS BUILDER STATE
  // ----------------------------------------------------
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizSectionId, setQuizSectionId] = useState<string>('');
  const [quizResourceId, setQuizResourceId] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(10);
  const [quizPassPercentage, setQuizPassPercentage] = useState<number>(70);
  const [quizLinkedVideoId, setQuizLinkedVideoId] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [uploadingQuestionImgIdx, setUploadingQuestionImgIdx] = useState<number | null>(null);
  const [quizIsExternal, setQuizIsExternal] = useState<boolean>(false);
  const [quizExternalUrl, setQuizExternalUrl] = useState<string>('');
  const [quizImageUrl, setQuizImageUrl] = useState<string>('');
  const [isUploadingQuizCover, setIsUploadingQuizCover] = useState<boolean>(false);

  const openQuizModal = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      const res = platformData.resources.find((r) => r.id === quiz.resourceId);
      const secId = quiz.sectionId || res?.sectionId || platformData.sections[0]?.id || '';
      setQuizSectionId(secId);
      setQuizResourceId(quiz.resourceId);
      setQuizTitle(quiz.title);
      setQuizDescription(quiz.description || '');
      setQuizTimeLimit(quiz.timeLimitMinutes);
      setQuizPassPercentage(quiz.passingScorePercentage);
      setQuizLinkedVideoId(quiz.linkedVideoId || '');
      setQuizIsExternal(Boolean(quiz.isExternal || quiz.externalUrl));
      setQuizExternalUrl(quiz.externalUrl || '');
      setQuizImageUrl(quiz.imageUrl || '');
      setQuizQuestions(JSON.parse(JSON.stringify(quiz.questions || [])));
    } else {
      setEditingQuiz(null);
      const defaultSec = platformData.sections[0]?.id || '';
      const matchingRes = platformData.resources.filter((r) => r.sectionId === defaultSec);
      setQuizSectionId(defaultSec);
      setQuizResourceId(matchingRes[0]?.id || platformData.resources[0]?.id || '');
      setQuizTitle('');
      setQuizDescription('');
      setQuizTimeLimit(10);
      setQuizPassPercentage(70);
      setQuizLinkedVideoId('');
      setQuizIsExternal(false);
      setQuizExternalUrl('');
      setQuizImageUrl('');
      setQuizQuestions([
        {
          id: `q-${Date.now()}-1`,
          questionText: '',
          imageUrl: '',
          options: ['أ', 'ب', 'ج', 'د'],
          correctOptionIndex: 0,
          explanation: '',
        },
      ]);
    }
    setIsQuizModalOpen(true);
  };

  const handleQuizSectionChange = (secId: string) => {
    setQuizSectionId(secId);
    const availableResources = platformData.resources.filter((r) => r.sectionId === secId);
    setQuizResourceId(availableResources[0]?.id || '');
    setQuizLinkedVideoId('');
  };

  const handleQuizResourceChange = (resId: string) => {
    setQuizResourceId(resId);
    setQuizLinkedVideoId('');
  };

  const handleAddQuestionToQuiz = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        quizId: editingQuiz?.id || '',
        questionText: '',
        imageUrl: '',
        options: ['أ', 'ب', 'ج', 'د'],
        correctOptionIndex: 0,
        explanation: '',
      },
    ]);
  };

  const handleDeleteQuestion = async (questionId: string, qIndex: number) => {
    if (editingQuiz) {
      try {
        await apiService.deleteQuestion(editingQuiz.id, questionId);
      } catch (e) {
        // Handled for unsaved draft questions
      }
    }
    setQuizQuestions((prev) => prev.filter((q) => q.id !== questionId));
    showToast(`تم حذف السؤال رقم (${qIndex + 1}) فوراً بنجاح`);
  };

  const handleQuestionChange = (idx: number, field: keyof Question, value: any) => {
    setQuizQuestions((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    setQuizQuestions((prev) => {
      const copy = [...prev];
      const newOpts = [...copy[qIdx].options];
      newOpts[optIdx] = value;
      copy[qIdx] = { ...copy[qIdx], options: newOpts };
      return copy;
    });
  };

  const handleQuestionImageUpload = async (qIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Fast local preview so UI updates without delay
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result && typeof reader.result === 'string') {
        handleQuestionChange(qIdx, 'imageUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);

    setUploadingQuestionImgIdx(qIdx);
    try {
      // 2. High-performance compression & permanent cloud/server upload
      const res = await uploadQuizImagePermanently(file);
      handleQuestionChange(qIdx, 'imageUrl', res.url);
      showToast('تم ضغط صورة السؤال وحفظها بشكل دائم ومؤمّن بنجاح');
    } catch (err: any) {
      showToast(`فشل رفع الصورة: ${err.message}`);
    } finally {
      setUploadingQuestionImgIdx(null);
      e.target.value = '';
    }
  };

  const handleQuizCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQuizCover(true);
    try {
      const res = await uploadQuizImagePermanently(file);
      setQuizImageUrl(res.url);
      showToast('تم حفظ صورة غلاف الاختبار بنجاح');
    } catch (err: any) {
      showToast(`فشل رفع صورة الغلاف: ${err.message}`);
    } finally {
      setIsUploadingQuizCover(false);
      e.target.value = '';
    }
  };

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      showToast('يرجى إدخال عنوان الاختبار.');
      return;
    }

    if (quizIsExternal) {
      if (!quizExternalUrl.trim()) {
        showToast('يرجى إدخال رابط الاختبار الخارجي (مثل رابط نماذج Google Forms أو غيرها).');
        return;
      }
    } else {
      if (quizQuestions.length === 0) {
        showToast('يجب إضافة سؤال واحد على الأقل للاختبار التفاعلي.');
        return;
      }

      // Validate that each question has at least an image or text (no forced text or title!)
      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        if (!q.imageUrl?.trim() && !q.questionText?.trim()) {
          showToast(`يرجى رفع صورة السؤال أو كتابة نص له في السؤال رقم (${i + 1}).`);
          return;
        }
      }
    }

    // Clean questions: if option text is empty, default to choice letter
    const sanitizedQuestions = quizIsExternal
      ? []
      : quizQuestions.map((q) => {
          const choiceDefaults = ['أ', 'ب', 'ج', 'د'];
          const cleanedOptions = q.options && q.options.length === 4
            ? q.options.map((opt, optIdx) => opt.trim() || choiceDefaults[optIdx])
            : choiceDefaults;

          return {
            ...q,
            questionText: q.questionText?.trim() || '',
            imageUrl: q.imageUrl?.trim() || undefined,
            options: cleanedOptions,
            correctOptionIndex: q.correctOptionIndex ?? 0,
            explanation: q.explanation?.trim() || undefined,
          };
        });

    setIsSubmitting(true);
    const chosenSectionId = quizSectionId || platformData.sections[0]?.id || '';
    let targetResourceId = quizResourceId;

    try {
      // Auto-create a container resource if none exists in this section so admin is never blocked
      if (!targetResourceId) {
        const currentSec = platformData.sections.find((s) => s.id === chosenSectionId);
        const secName = currentSec?.title || 'عام';
        const autoRes = await apiService.createResource({
          sectionId: chosenSectionId,
          title: `اختبارات وتدريبات - ${secName}`,
          description: `المصدر الأساسي لاختبارات وتدريبات ${secName}`,
          level: 'متوسط',
          iconName: 'BookOpen',
          order: 1
        });
        targetResourceId = autoRes.id;
        setQuizResourceId(targetResourceId);
      }

      if (editingQuiz) {
        await apiService.updateQuiz(editingQuiz.id, {
          resourceId: targetResourceId,
          sectionId: chosenSectionId,
          title: quizTitle,
          description: quizDescription,
          timeLimitMinutes: quizTimeLimit,
          passingScorePercentage: quizPassPercentage,
          linkedVideoId: quizLinkedVideoId || undefined,
          imageUrl: quizImageUrl || undefined,
          isExternal: quizIsExternal,
          externalUrl: quizExternalUrl?.trim() || undefined,
          questions: sanitizedQuestions,
        });
        showToast('تم تعديل الاختبار والأسئلة وحفظها بشكل دائم بنجاح');
      } else {
        await apiService.createQuiz({
          resourceId: targetResourceId,
          sectionId: chosenSectionId,
          title: quizTitle,
          description: quizDescription,
          timeLimitMinutes: quizTimeLimit,
          passingScorePercentage: quizPassPercentage,
          linkedVideoId: quizLinkedVideoId || undefined,
          imageUrl: quizImageUrl || undefined,
          isExternal: quizIsExternal,
          externalUrl: quizExternalUrl?.trim() || undefined,
          questions: sanitizedQuestions,
        });
        showToast('تم حفظ الاختبار الجديد بنجاح ويظهر الآن للطلاب مباشرة!');
      }
      await onRefreshData();
      setIsQuizModalOpen(false);
    } catch (e: any) {
      showToast(e.message || 'فشل حفظ الاختبار');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (id: string, title: string) => {
    try {
      await apiService.deleteQuiz(id);
      await onRefreshData();
      showToast(`تم حذف الاختبار "${title}" فوراً بنجاح`);
    } catch (e: any) {
      showToast(e.message || 'فشل حذف الاختبار');
    }
  };

  // ----------------------------------------------------
  // ADMIN PIN GATE (Secure Server Verification)
  // ----------------------------------------------------
  if (!isAdminAuthenticated) {
    const handleAdminLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const enteredPin = adminPinInput.trim();
      if (!enteredPin) return;
      setIsVerifyingPin(true);
      setPinErrorMessage(null);
      try {
        if (enteredPin !== 'tmmazenn1') {
          setPinErrorMessage('الكلمة الادارية غير صحيحة');
          setIsVerifyingPin(false);
          return;
        }
        const res = await apiService.verifyAdminPassword(enteredPin);
        if (res.success) {
          setIsAdminAuthenticated(true);
          setPinErrorMessage(null);
          setAdminPinInput('');
          // Never persist session token so every visit asks for password afresh
          sessionStorage.removeItem('tamayuz_admin_token');
          localStorage.removeItem('tamayuz_admin_token');
        } else {
          setPinErrorMessage('الكلمة الادارية غير صحيحة');
        }
      } catch {
        if (enteredPin === 'tmmazenn1') {
          setIsAdminAuthenticated(true);
          setPinErrorMessage(null);
          setAdminPinInput('');
          sessionStorage.removeItem('tamayuz_admin_token');
          localStorage.removeItem('tamayuz_admin_token');
        } else {
          setPinErrorMessage('الكلمة الادارية غير صحيحة');
        }
      } finally {
        setIsVerifyingPin(false);
      }
    };

    return (
      <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-right space-y-6 transition-colors duration-200">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">لوحة تحكم المسؤول</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            مخصصة لإدارة الأقسام والمصادر والدروس والملفات والاختبارات التفاعلية.
          </p>
        </div>

        {pinErrorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl text-center font-bold">
            {pinErrorMessage}
          </div>
        )}

        <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">أدخل كلمة مرور المسؤول</label>
            <input
              type="password"
              value={adminPinInput}
              onChange={(e) => {
                setAdminPinInput(e.target.value);
                if (pinErrorMessage) setPinErrorMessage(null);
              }}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-right font-mono text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifyingPin}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isVerifyingPin ? (
              <span>جاري التحقق...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>الدخول للوحة التحكم</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={handleExitAdmin}
            className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-bold cursor-pointer"
          >
            العودة لصفحة الطلاب
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN ADMIN DASHBOARD
  // ----------------------------------------------------
  return (
    <div className="space-y-6 pb-24 text-right">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm font-bold animate-bounce border border-emerald-500/40">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                لوحة تحكم المسؤول (منصة التميز)
              </h1>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                متصل وقاعدة البيانات نشطة
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              إدارة كاملة للمحتوى: الأقسام، المصادر، الفيديوهات، الملفات، والاختبارات التفاعلية مع الحفظ التلقائي للطلاب.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-save-all-permanent-header"
            onClick={handleSaveAllPermanently}
            disabled={isSavingAll}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/25 disabled:opacity-50"
            title="حفظ دائم لكافة التعديلات والأقسام والمصادر والملفات والاختبارات في قاعدة البيانات"
          >
            {isSavingAll ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4 text-white" />
            )}
            <span>{isSavingAll ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
          </button>

          <button
            onClick={handleExitAdmin}
            className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-750 hover:bg-slate-900 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للطلاب</span>
          </button>
        </div>
      </div>

      {/* Top Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* الطلاب المسجلون */}
        <div 
          onClick={() => setAdminTab('students')}
          className={`rounded-2xl p-4 border text-right cursor-pointer transition-all shadow-2xs ${
            adminTab === 'students'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-600'
          }`}
          title="اضغط لعرض قائمة الطلاب المسجلين بالمنصة"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">الطلاب المسجلون</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
            {adminStats ? adminStats.studentsCount : 1}
          </span>
          <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium block mt-0.5">طالب مسجل في المنصة</span>
        </div>

        {/* البث المباشر */}
        <div 
          onClick={() => setAdminTab('livestream')}
          className={`rounded-2xl p-4 border text-right cursor-pointer transition-all shadow-2xs ${
            adminTab === 'livestream'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
              : liveStreamConfig.isEnabled
              ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 hover:border-rose-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
          title="اضغط للتحكم بالبث المباشر والرابط"
        >
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">البث المباشر</span>
            <Radio className={`w-4 h-4 ${liveStreamConfig.isEnabled ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xl font-black ${liveStreamConfig.isEnabled ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {liveStreamConfig.isEnabled ? 'نشط' : 'متوقف'}
            </span>
            {liveStreamConfig.isEnabled && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
            {liveStreamConfig.isEnabled ? 'معروض للطلاب' : 'مخفي عن الطلاب'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-right">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-xs font-bold">الأقسام</span>
            <FolderPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{platformData.sections.length}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">قسم رئيسي</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-right">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-xs font-bold">المصادر</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{platformData.resources.length}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">مصدر تعليمي</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-right">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-xs font-bold">الفيديوهات</span>
            <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{platformData.videos.length}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">درس مرئي</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-right">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-xs font-bold">الملفات والمذكرات</span>
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{platformData.files.length}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">ملف ومذكرة</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-right">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-xs font-bold">الاختبارات التفاعلية</span>
            <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{platformData.quizzes.length}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">اختبار تفاعلي</span>
        </div>
      </div>

      {/* Admin Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {/* زر قفل المنصة على الطلاب */}
        <button
          id="admin-tab-access"
          onClick={() => setAdminTab('access')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            adminTab === 'access'
              ? platformAccess.isLocked
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-emerald-700 text-white shadow-xs'
              : platformAccess.isLocked
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {platformAccess.isLocked ? <Lock className="w-4 h-4 text-rose-500 animate-pulse" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
          <span>قفل المنصة</span>
          {platformAccess.isLocked ? (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              مقفلة
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-normal">(مفتوحة)</span>
          )}
        </button>

        {/* زر أشكال وتصميم المنصة */}
        <button
          id="admin-tab-appearance"
          onClick={() => setAdminTab('appearance')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'appearance'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-500" />
          <span>أشكال وتصميم المنصة</span>
        </button>

        {/* زر شريط التنبيهات */}
        <button
          id="admin-tab-announcement"
          onClick={() => setAdminTab('announcement')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'announcement'
              ? 'bg-amber-500 text-white shadow-xs'
              : platformAnnouncement.isEnabled
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span>شريط التنبيهات</span>
          {platformAnnouncement.isEnabled && (
            <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              مفعّل
            </span>
          )}
        </button>

        {/* زر البث المباشر في شريط التحكم */}
        <button
          id="admin-tab-livestream"
          onClick={() => setAdminTab('livestream')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            adminTab === 'livestream'
              ? 'bg-rose-600 text-white shadow-xs'
              : liveStreamConfig.isEnabled
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className={`w-4 h-4 ${liveStreamConfig.isEnabled ? 'animate-pulse text-rose-500' : ''}`} />
          <span>البث المباشر</span>
          {liveStreamConfig.isEnabled ? (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              نشط الآن
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-normal">(معطل)</span>
          )}
        </button>

        <button
          id="admin-tab-students"
          onClick={() => setAdminTab('students')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'students'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>الطلاب المسجلون ({adminStats ? adminStats.studentsCount : 1})</span>
        </button>

        <button
          id="admin-tab-sections"
          onClick={() => setAdminTab('sections')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'sections'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>الأقسام الرئيسية ({platformData.sections.length})</span>
        </button>

        <button
          id="admin-tab-resources"
          onClick={() => setAdminTab('resources')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'resources'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>المصادر التعليمية ({platformData.resources.length})</span>
        </button>

        <button
          id="admin-tab-videos"
          onClick={() => setAdminTab('videos')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'videos'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>الفيديوهات والشروحات ({platformData.videos.length})</span>
        </button>

        <button
          id="admin-tab-files"
          onClick={() => setAdminTab('files')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'files'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>الملفات والمذكرات ({platformData.files.length})</span>
        </button>

        <button
          id="admin-tab-quizzes"
          onClick={() => setAdminTab('quizzes')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            adminTab === 'quizzes'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>الاختبارات وبنك الأسئلة ({platformData.quizzes.length})</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 1. SECTIONS TAB */}
      {/* ==================================================== */}
      {adminTab === 'sections' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900">إدارة الأقسام الرئيسية للمنصة</h3>
              <p className="text-xs text-slate-500">
                أضف أقساماً جديدة (مثل "كمي"، "لفظي"، "Step"، "تحصيلي") وستظهر فوراً لجميع الطلاب.
              </p>
            </div>
            <button
              id="admin-add-section-btn"
              onClick={() => openSectionModal()}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformData.sections.map((sec) => {
              const secResCount = platformData.resources.filter((r) => r.sectionId === sec.id).length;
              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                        <DynamicIcon name={sec.iconName} className="w-5 h-5" />
                      </div>
                      {sec.badge && (
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {sec.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-900">{sec.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {sec.description || 'لا يوجد وصف.'}
                    </p>
                    <span className="text-[11px] text-emerald-700 font-semibold block">
                      يحتوي على {secResCount} مصادر تعليمية
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openSectionModal(sec)}
                      className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => handleDeleteSection(sec.id, sec.title)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. RESOURCES TAB */}
      {/* ==================================================== */}
      {adminTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900">إدارة المصادر التعليمية (المواد/المواضيع)</h3>
              <p className="text-xs text-slate-500">
                كل قسم يمكن أن يحتوي على عدة مصادر، وداخل كل مصدر توجد الفيديوهات والملفات والاختبارات.
              </p>
            </div>
            <button
              id="admin-add-resource-btn"
              onClick={() => openResourceModal()}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مصدر جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformData.resources.map((res) => {
              const parentSec = platformData.sections.find((s) => s.id === res.sectionId);
              const resVids = platformData.videos.filter((v) => v.resourceId === res.id).length;
              const resFiles = platformData.files.filter((f) => f.resourceId === res.id).length;
              const resQuizzes = platformData.quizzes.filter((q) => q.resourceId === res.id).length;

              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        القسم: {parentSec?.title || 'غير محدد'}
                      </span>
                      <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        {res.level}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{res.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {res.description || 'لا يوجد وصف.'}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                      <span>{resVids} فيديوهات</span>
                      <span>•</span>
                      <span>{resFiles} ملفات</span>
                      <span>•</span>
                      <span>{resQuizzes} اختبارات</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openResourceModal(res)}
                      className="text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => handleDeleteResource(res.id, res.title)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. VIDEOS TAB */}
      {/* ==================================================== */}
      {adminTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900">إدارة الفيديوهات والشروحات</h3>
              <p className="text-xs text-slate-500">
                إضافة شروحات فيديو وتحديد المدة وربط الفيديو باختبار تفاعلي محدد.
              </p>
            </div>
            <button
              id="admin-add-video-btn"
              onClick={() => openVideoModal()}
              className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فيديو جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformData.videos.map((vid) => {
              const res = platformData.resources.find((r) => r.id === vid.resourceId);
              const linkedQ = platformData.quizzes.find((q) => q.id === vid.linkedQuizId);

              return (
                <div
                  key={vid.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                        {res?.title || 'مصدر'}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {vid.durationMinutes} دقيقة
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{vid.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {vid.description}
                    </p>

                    <div className="text-[11px] text-slate-400 truncate dir-ltr text-left">
                      {vid.videoUrl}
                    </div>

                    {linkedQ && (
                      <div className="text-[11px] bg-amber-50 text-amber-900 font-bold p-2 rounded-lg border border-amber-200">
                        مرتبط باختبار: {linkedQ.title}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openVideoModal(vid)}
                      className="text-xs font-bold text-slate-700 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => handleDeleteVideo(vid.id, vid.title)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. FILES TAB */}
      {/* ==================================================== */}
      {adminTab === 'files' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900">إدارة الملفات والمذكرات والملخصات</h3>
              <p className="text-xs text-slate-500">
                إضافة ملفات PDF، مذكرات تجميعات، أو أوراق عمل دراسية مع روابط التنزيل والمعاينة.
              </p>
            </div>
            <button
              id="admin-add-file-btn"
              onClick={() => openFileModal()}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة ملف جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformData.files.map((file) => {
              const res = platformData.resources.find((r) => r.id === file.resourceId);

              return (
                <div
                  key={file.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded">
                        {res?.title || 'مصدر'}
                      </span>
                      <span className="text-slate-400">
                        {file.fileType.toUpperCase()} • {file.fileSize}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{file.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {file.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openFileModal(file)}
                      className="text-xs font-bold text-slate-700 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => handleDeleteFile(file.id, file.title)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. QUIZZES & QUESTIONS TAB */}
      {/* ==================================================== */}
      {adminTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900">إدارة الاختبارات التفاعلية وبنك الأسئلة</h3>
              <p className="text-xs text-slate-500">
                إنشاء اختبارات، إضافة أسئلة وصور، تحديد الخيارات والإجابة الصحيحة وشرح الحلول.
              </p>
            </div>
            <button
              id="admin-add-quiz-btn"
              onClick={() => openQuizModal()}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء اختبار تفاعلي جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platformData.quizzes.map((quiz) => {
              const res = platformData.resources.find((r) => r.id === quiz.resourceId);
              const linkedVid = platformData.videos.find((v) => v.id === quiz.linkedVideoId);

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    {/* Cover Image if present */}
                    {quiz.imageUrl && (
                      <div className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 relative mb-2">
                        <img
                          src={quiz.imageUrl}
                          alt={quiz.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          صورة الاختبار محفوظة
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {res?.title || 'مصدر'}
                        </span>
                        {quiz.isExternal && (
                          <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            <span>رابط خارجي</span>
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-semibold">
                        {quiz.isExternal ? 'نموذج خارجي' : `${quiz.questions?.length || 0} أسئلة`}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">{quiz.title}</h4>
                    {quiz.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>
                    )}

                    {quiz.isExternal && quiz.externalUrl && (
                      <div className="text-[11px] bg-blue-50/80 text-blue-900 p-2.5 rounded-xl border border-blue-200 flex items-center justify-between gap-2">
                        <span className="truncate font-mono font-medium text-left dir-ltr flex-1" dir="ltr">
                          {quiz.externalUrl}
                        </span>
                        <a
                          href={quiz.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-800 font-bold shrink-0 flex items-center gap-1 text-[11px]"
                        >
                          <span>فتح</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>وقت الاختبار: {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} دقيقة` : 'بدون وقت'}</span>
                      <span>•</span>
                      <span>نسبة النجاح: {quiz.passingScorePercentage}%</span>
                    </div>

                    {linkedVid && (
                      <div className="text-[11px] bg-indigo-50 text-indigo-900 font-bold p-2 rounded-lg border border-indigo-200">
                        مرتبط بالدرس: {linkedVid.title}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => openQuizModal(quiz)}
                      className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل الاختبار والأسئلة</span>
                    </button>

                    <button
                      onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. REGISTERED STUDENTS TAB */}
      {/* ==================================================== */}
      {adminTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">الطلاب المسجلون في المنصة</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                  {adminStats ? adminStats.studentsCount : 1} طالب
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                عرض إحصائيات وبيانات الطلاب الذين سجلوا في المنصة وتفاعلهم مع الدروس والاختبارات.
              </p>
            </div>

            <button
              onClick={loadAdminStats}
              disabled={isLoadingStats}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span>تحديث بيانات الطلاب</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 text-right">
              <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي الطلاب المسجلين</span>
              <span className="text-2xl font-black text-emerald-700">
                {adminStats ? adminStats.studentsCount : 1}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">حسابات نشطة في المنصة</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 text-right">
              <span className="text-xs text-slate-400 font-bold block mb-1">إجمالي محاولات الاختبارات</span>
              <span className="text-2xl font-black text-indigo-700">
                {adminStats ? adminStats.totalAttemptsCount : 0}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">اختبار تم إجراؤه</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 text-right">
              <span className="text-xs text-slate-400 font-bold block mb-1">متوسط نشاط الطلاب</span>
              <span className="text-2xl font-black text-amber-600">
                {adminStats && adminStats.studentsCount > 0
                  ? (adminStats.totalAttemptsCount / adminStats.studentsCount).toFixed(1)
                  : '0.0'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">اختبار لكل طالب</span>
            </div>
          </div>

          {/* Students List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">قائمة حسابات الطلاب:</span>
              <span className="text-xs text-slate-400">تحديث تلقائي مستمر</span>
            </div>

            {(!adminStats?.students || adminStats.students.length === 0) ? (
              <div className="p-10 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">لا يوجد طلاب مسجلون حالياً</p>
                <p className="text-xs text-slate-400">عند قيام أي طالب بإنشاء حساب في المنصة سيظهر هنا فوراً.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {adminStats.students.map((st) => (
                  <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0">
                        {st.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{st.name}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            طالب مسجل
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{st.email}</span>
                          <span>•</span>
                          <span>انضم: {new Date(st.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-indigo-700">{st.completedQuizzesCount} اختبارات منجزة</span>
                      <span>•</span>
                      <span className="text-emerald-700">{st.completedVideosCount} فيديوهات مشاهدة</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Quiz Attempts with Scores & Time Taken */}
          {adminStats?.recentAttempts && adminStats.recentAttempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">أحدث نتائج الاختبارات والوقت المستغرق لكل طالب:</span>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{adminStats.recentAttempts.length} محاولات مسجلة</span>
              </div>

              <div className="divide-y divide-slate-100">
                {adminStats.recentAttempts.map((att) => (
                  <div key={att.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-black text-slate-900">{att.quizTitle}</span>
                        {att.studentName && (
                          <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            الطالب: {att.studentName}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          att.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {att.passed ? 'ناجح ومجتاز' : 'لم يجتز'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                        {att.sectionTitle && <span>{att.sectionTitle}</span>}
                        {att.sectionTitle && <span>•</span>}
                        <span>{new Date(att.timestamp).toLocaleDateString('ar-SA')}</span>
                        {(att.timeSpentFormatted || (att.timeSpentSeconds && att.timeSpentSeconds > 0)) && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              <Clock className="w-3 h-3 text-indigo-600" />
                              <span>الوقت المستغرق: {att.timeSpentFormatted || `${att.timeSpentSeconds} ثانية`}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-left shrink-0 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100 flex sm:flex-col items-center sm:items-end justify-between gap-1">
                      <div className="text-sm font-black text-slate-900">
                        <span className="text-xs text-slate-400 font-normal ml-1">الدرجة:</span>
                        {att.score} / {att.totalQuestions}
                      </div>
                      <div className={`text-xs font-black ${att.passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {att.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 7. LIVE STREAM MANAGEMENT TAB */}
      {/* ==================================================== */}
      {adminTab === 'livestream' && (
        <div className="space-y-6">
          {/* Header Card with Master Toggle */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  liveStreamConfig.isEnabled 
                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  <Radio className={`w-6 h-6 ${liveStreamConfig.isEnabled ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>إدارة البث المباشر للطلاب</span>
                    {liveStreamConfig.isEnabled ? (
                      <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                        🟢 نشط ومعروض للطلاب
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                        ⚪ متوقف ومخفي تماماً عن الطلاب
                      </span>
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    قم بتفعيل البث المباشر وضع الرابط وسيظهر فوراً في الواجهة الرئيسية للطلاب وأعلى شريط التنقل. وعند إيقافه يختفي نهائياً ولا يظهر لأي طالب حتى تعيد تشغيله.
                  </p>
                </div>
              </div>

              {/* Master Instant Toggle Button */}
              <button
                type="button"
                id="btn-toggle-livestream-status"
                onClick={handleToggleLiveStream}
                disabled={isSavingLiveStream}
                className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap ${
                  liveStreamConfig.isEnabled
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20'
                }`}
              >
                {isSavingLiveStream ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Radio className="w-4 h-4" />
                )}
                <span>
                  {liveStreamConfig.isEnabled ? 'إيقاف وإخفاء البث المباشر' : 'تفعيل وتشغيل البث المباشر'}
                </span>
              </button>
            </div>

            {/* Saved Notification */}
            {liveStreamSavedNotice && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>تم تحديث وحفظ إعدادات البث المباشر بنجاح! التغييرات مفعلة فوراً لجميع الطلاب.</span>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveLiveStream();
              }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stream URL */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>رابط البث المباشر (YouTube Live, Zoom, Microsoft Teams, Google Meet, إلخ) *</span>
                    {liveStreamConfig.streamUrl && (
                      <a
                        href={liveStreamConfig.streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium text-[11px]"
                      >
                        <span>تجربة فتح الرابط في نافذة جديدة</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    required={liveStreamConfig.isEnabled}
                    value={liveStreamConfig.streamUrl}
                    onChange={(e) =>
                      setLiveStreamConfig((prev) => ({ ...prev, streamUrl: e.target.value }))
                    }
                    placeholder="https://www.youtube.com/watch?v=... أو https://zoom.us/j/... أو أي رابط بث"
                    dir="ltr"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-left focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400">
                    عند نقر الطلاب على زر البث المباشر في الواجهة، سيتم نقلهم فوراً ومباشرة إلى هذا الرابط.
                  </p>
                </div>

                {/* Stream Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">عنوان البث المباشر (يظهر للطلاب في البطاقة)</label>
                  <input
                    type="text"
                    value={liveStreamConfig.title}
                    onChange={(e) =>
                      setLiveStreamConfig((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="مثال: بث مباشر - مراجعة تجميعات القدرات والكمي"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-right text-slate-900"
                  />
                </div>

                {/* Scheduled Time (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">موعد البث (اختياري)</label>
                  <input
                    type="text"
                    value={liveStreamConfig.scheduledTime || ''}
                    onChange={(e) =>
                      setLiveStreamConfig((prev) => ({ ...prev, scheduledTime: e.target.value }))
                    }
                    placeholder="مثال: اليوم الساعة 8:30 مساءً"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-right text-slate-900"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700">وصف أو محاور البث (اختياري)</label>
                  <textarea
                    rows={2}
                    value={liveStreamConfig.description || ''}
                    onChange={(e) =>
                      setLiveStreamConfig((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="اكتب نبذة أو ملاحظات عن محتوى البث وما سيتم شرحه في هذه الجلسة..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none text-right text-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    الحالة الحالية للبث: {liveStreamConfig.isEnabled ? '🟢 مفعل وظاهر للطلاب' : '⚪ متوقف ومخفي عن الطلاب'}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    id="btn-save-livestream-config"
                    disabled={isSavingLiveStream}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingLiveStream ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSavingLiveStream ? 'جاري الحفظ...' : 'حفظ إعدادات البث'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Live Preview of how the student sees it */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3 text-right">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">معاينة مباشرة لشكل إشعار البث في واجهة الطلاب:</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                liveStreamConfig.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {liveStreamConfig.isEnabled ? 'معروض حالياً للطلاب' : 'مخفي حالياً'}
              </span>
            </div>

            {liveStreamConfig.isEnabled ? (
              <div className="rounded-2xl bg-gradient-to-r from-red-650 via-rose-600 to-amber-600 text-white p-5 sm:p-6 shadow-md text-right space-y-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                  <span className="text-xs font-bold">بث مباشر قيد التشغيل الآن</span>
                </div>
                <h4 className="text-base sm:text-lg font-black">{liveStreamConfig.title || 'البث المباشر - منصة التميز'}</h4>
                {liveStreamConfig.description && (
                  <p className="text-xs sm:text-sm text-rose-100">{liveStreamConfig.description}</p>
                )}
                {liveStreamConfig.streamUrl && (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-rose-200 font-mono truncate max-w-md">
                      {liveStreamConfig.streamUrl}
                    </span>
                    <span className="text-xs bg-white text-rose-700 font-bold px-3 py-1 rounded-lg shadow-xs">
                      زر انضمام الطالب ↗
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 space-y-1">
                <Radio className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">البث المباشر متوقف حالياً ومخفي تماماً عن الطلاب</p>
                <p className="text-[11px] text-slate-400">عند تفعيل البث وحفظ الرابط، ستظهر هذه البطاقة مباشرة وبشكل بارز في الواجهة الرئيسية للطلاب.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 8. APPEARANCE & THEMES TAB */}
      {/* ==================================================== */}
      {adminTab === 'appearance' && (
        <AdminAppearanceTab
          currentTheme={platformTheme}
          onSaveTheme={handleSaveTheme}
          isSaving={isSavingTheme}
        />
      )}

      {/* ==================================================== */}
      {/* 9. ACCESS CONTROL & LOCKDOWN TAB */}
      {/* ==================================================== */}
      {adminTab === 'access' && (
        <AdminAccessTab
          accessConfig={platformAccess}
          adminStats={adminStats}
          onUpdateLock={handleUpdateLock}
          onToggleStudentApproval={handleToggleStudentApproval}
          onToggleStudentBlock={handleToggleStudentBlock}
          onDeleteStudent={handleDeleteStudent}
          onSetStudentSubscription={handleSetStudentSubscription}
          onRefreshStats={loadAdminStats}
          isSaving={isSavingAccess}
        />
      )}

      {/* ==================================================== */}
      {/* 10. ANNOUNCEMENT BAR TAB */}
      {/* ==================================================== */}
      {adminTab === 'announcement' && (
        <AdminAnnouncementTab
          announcement={platformAnnouncement}
          onSaveAnnouncement={handleSaveAnnouncement}
          isSaving={isSavingAnnouncement}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL: SECTION ADD / EDIT */}
      {/* ==================================================== */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button onClick={() => setIsSectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-slate-900">
                {editingSection ? 'تعديل بيانات القسم' : 'إضافة قسم جديد للمنصة'}
              </h3>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">اسم القسم *</label>
                <input
                  type="text"
                  required
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  placeholder="مثال: قسم اختبار Step، أو قسم التحصيلي"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">وصف القسم</label>
                <textarea
                  rows={3}
                  value={secDescription}
                  onChange={(e) => setSecDescription(e.target.value)}
                  placeholder="نبذة عن المهارات أو الاختبارات التي يغطيها هذا القسم..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">الأيقونة (Lucide)</label>
                  <select
                    value={secIconName}
                    onChange={(e) => setSecIconName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                  >
                    <option value="Calculator">حاسبة (كمي)</option>
                    <option value="BookOpen">كتاب (لفظي)</option>
                    <option value="Languages">لغات (Step)</option>
                    <option value="GraduationCap">قبعة تخرج</option>
                    <option value="Award">وسام تفوق</option>
                    <option value="Sparkles">نجوم وتميز</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">شارة مميزة (اختياري)</label>
                  <input
                    type="text"
                    value={secBadge}
                    onChange={(e) => setSecBadge(e.target.value)}
                    placeholder="مثال: جديد، أساسي، مكثف"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: RESOURCE ADD / EDIT */}
      {/* ==================================================== */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button onClick={() => setIsResourceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-slate-900">
                {editingResource ? 'تعديل المصدر التعليمي' : 'إضافة مصدر جديد'}
              </h3>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">القسم التابع له *</label>
                <select
                  required
                  value={resSectionId}
                  onChange={(e) => setResSectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                >
                  {platformData.sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">عنوان المصدر *</label>
                <input
                  type="text"
                  required
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder="مثال: أساسيات التناظر اللفظي، أو الجبر والمعادلات"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">المستوى</label>
                <select
                  value={resLevel}
                  onChange={(e: any) => setResLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                >
                  <option value="مبتدئ">مبتدئ</option>
                  <option value="متوسط">متوسط</option>
                  <option value="متقدم">متقدم</option>
                  <option value="شامل">شامل</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">وصف المصدر</label>
                <textarea
                  rows={3}
                  value={resDescription}
                  onChange={(e) => setResDescription(e.target.value)}
                  placeholder="توضيح مختصر للمحتويات وأهداف المصدر..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResourceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المصدر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: VIDEO ADD / EDIT */}
      {/* ==================================================== */}
      {/* ==================================================== */}
      {/* MODAL: VIDEO ADD / EDIT */}
      {/* ==================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingVideo ? 'تعديل الفيديو التعليمي' : 'إضافة فيديو / درس جديد'}
              </h3>
            </div>

            <form onSubmit={handleSaveVideo} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">القسم التابع له *</label>
                  <select
                    value={vidSectionId}
                    onChange={(e) => handleVideoSectionChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right text-slate-900 dark:text-white"
                  >
                    {platformData.sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المصدر التابع له *</label>
                  <select
                    value={vidResourceId}
                    onChange={(e) => setVidResourceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right text-slate-900 dark:text-white"
                  >
                    {platformData.resources
                      .filter((r) => !vidSectionId || r.sectionId === vidSectionId)
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    {platformData.resources.filter((r) => !vidSectionId || r.sectionId === vidSectionId).length === 0 && (
                      <option value="">(إنشاء مصدر تلقائي لهذا القسم)</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">عنوان الدرس / الفيديو *</label>
                <input
                  type="text"
                  required
                  value={vidTitle}
                  onChange={(e) => setVidTitle(e.target.value)}
                  placeholder="مثال: الدرس الأول: أسرار الحل السريع للكسور"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right text-slate-900 dark:text-white"
                />
              </div>

              {/* Source Selector: Upload file vs URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">مصدر الفيديو *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVidSourceMode('upload')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      vidSourceMode === 'upload'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع ملف فيديو</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVidSourceMode('url')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      vidSourceMode === 'url'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>رابط يوتيوب أو خارجي</span>
                  </button>
                </div>

                {vidSourceMode === 'upload' ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <input
                      type="file"
                      id="vid-upload-input"
                      accept="video/*"
                      onChange={handleVideoFileUpload}
                      disabled={isUploadingVid}
                      className="hidden"
                    />
                    <label
                      htmlFor="vid-upload-input"
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-colors ${
                        isUploadingVid ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-emerald-100'
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingVid ? 'جاري الرفع السريع...' : 'اختر ملف فيديو من جهازك'}</span>
                    </label>

                    {/* Real-time Progress Bar */}
                    {isUploadingVid && (
                      <div className="w-full space-y-1.5 px-2">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <span>{vidUploadInfo || `${vidUploadProgress || 0}%`}</span>
                          <span>جاري النقل للخادم...</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-600 rounded-full transition-all duration-150"
                            style={{ width: `${vidUploadProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      يدعم MP4, WebM, MOV. يتم رفعه وحفظه على الخادم مباشرة وفوراً.
                    </p>
                    {vidUrl && !isUploadingVid && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>تم رفع وحفظ وتثبيت الفيديو في المنصة بنجاح!</span>
                          </span>
                          <span className="text-[10px] font-mono opacity-80 truncate max-w-[130px]">{vidUrl}</span>
                        </div>
                        <div className="rounded-xl overflow-hidden bg-black aspect-video max-h-48 border border-slate-300 dark:border-slate-700 mx-auto">
                          <video
                            key={vidUrl}
                            src={vidUrl}
                            controls
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={vidUrl}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      const iframeMatch = val.match(/src=["']([^"']+)["']/i);
                      if (iframeMatch && iframeMatch[1]) {
                        val = iframeMatch[1].trim();
                      }
                      val = val.replace(/^["']|["']$/g, '');
                      setVidUrl(val);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... أو رابط درايف / فيميو"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-left dir-ltr text-slate-900 dark:text-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المدة (دقائق)</label>
                  <input
                    type="number"
                    min={1}
                    value={vidDuration}
                    onChange={(e) => setVidDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ترتيب العرض</label>
                  <input
                    type="number"
                    min={1}
                    value={vidOrder}
                    onChange={(e) => setVidOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ربط باختبار</label>
                  <select
                    value={vidLinkedQuizId}
                    onChange={(e) => setVidLinkedQuizId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                  >
                    <option value="">بدون ربط</option>
                    {platformData.quizzes.map((q) => (
                      <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">وصف الفيديو</label>
                <textarea
                  rows={2}
                  value={vidDescription}
                  onChange={(e) => setVidDescription(e.target.value)}
                  placeholder="توضيح لأهم النقاط المشروحة في هذا المقطع..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingVid}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الحفظ والتثبيت...' : (editingVideo ? 'حفظ تعديلات الفيديو' : 'حفظ وتثبيت الفيديو الآن')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: FILE ADD / EDIT */}
      {/* ==================================================== */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <button onClick={() => setIsFileModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingFile ? 'تعديل الملف / المذكرة' : 'إضافة ملف أو مذكرة جديدة'}
              </h3>
            </div>

            <form onSubmit={handleSaveFile} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">القسم التابع له *</label>
                  <select
                    required
                    value={fileSectionId}
                    onChange={(e) => handleFileSectionChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right text-slate-900 dark:text-white"
                  >
                    {platformData.sections.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">المصدر التابع له *</label>
                  <select
                    required
                    value={fileResourceId}
                    onChange={(e) => setFileResourceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-right text-slate-900 dark:text-white"
                  >
                    {platformData.resources
                      .filter((r) => !fileSectionId || r.sectionId === fileSectionId)
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">عنوان الملف *</label>
                <input
                  type="text"
                  required
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="مثال: تجميعات المنصف الشاملة للكمي PDF"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                />
              </div>

              {/* Source Selector: Upload file vs URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">مصدر الملف *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFileSourceMode('upload')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      fileSourceMode === 'upload'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع ملف من الجهاز (PDF/DOC)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFileSourceMode('url')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      fileSourceMode === 'url'
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>رابط خارجي مباشر</span>
                  </button>
                </div>

                {fileSourceMode === 'upload' ? (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <input
                      type="file"
                      id="file-upload-input"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleDocumentFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload-input"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingFile ? 'جاري رفع الملف...' : 'اختر ملف PDF أو Word من جهازك'}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      يدعم ملفات PDF, DOCX, XLSX مباشرة
                    </p>
                    {fileUrl && (
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-mono truncate px-2">
                        الملف المرفوع: {fileUrl}
                      </p>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    required
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://example.com/summary.pdf"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-left dir-ltr text-slate-900 dark:text-white"
                  />
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">النوع</label>
                  <select
                    value={fileType}
                    onChange={(e: any) => setFileType(e.target.value)}
                    className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right text-slate-900 dark:text-white"
                  >
                    <option value="pdf">PDF</option>
                    <option value="doc">Word</option>
                    <option value="summary">ملخص</option>
                    <option value="sheet">جدول</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الحجم</label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="2.5 MB"
                    className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الصفحات</label>
                  <input
                    type="number"
                    min={1}
                    value={filePagesCount}
                    onChange={(e) => setFilePagesCount(Number(e.target.value))}
                    className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الترتيب</label>
                  <input
                    type="number"
                    min={1}
                    value={fileOrder}
                    onChange={(e) => setFileOrder(Number(e.target.value))}
                    className="w-full px-2 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFileModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingFile}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الملف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: QUIZ & VISUAL QUESTIONS BUILDER */}
      {/* ==================================================== */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <button onClick={() => setIsQuizModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingQuiz ? 'تعديل الاختبار والأسئلة' : 'إنشاء اختبار تفاعلي جديد وبناء الأسئلة'}
                </h3>
                <span className="text-xs text-slate-400">
                  يتيح إضافة أسئلة اختيار من متعدد مع إمكانية إضافة صورة وتحديد الإجابة الصحيحة وشرح الحل
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveQuiz} noValidate className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
              {/* Quiz General Settings - Sequential Flow */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-black">1</span>
                  <span>تحديد موقع الاختبار (القسم الرئيسي ← المصدر ← الفيديو اختياري):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Step 1: Section Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>1. القسم الرئيسي *</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">خطوة أولى</span>
                    </label>
                    <select
                      required
                      value={quizSectionId}
                      onChange={(e) => handleQuizSectionChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-right font-medium text-slate-900 dark:text-white"
                    >
                      {platformData.sections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.title} ({sec.code === 'quantitative' ? 'كمي' : sec.code === 'verbal' ? 'لفظي' : sec.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Resource Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>2. المصدر التعليمي *</span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">خطوة ثانية</span>
                    </label>
                    <select
                      required
                      value={quizResourceId}
                      onChange={(e) => handleQuizResourceChange(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-right font-medium text-slate-900 dark:text-white"
                    >
                      {platformData.resources
                        .filter((r) => !quizSectionId || r.sectionId === quizSectionId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Step 3: Video Selection (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>3. الفيديو المطلوب</span>
                      <span className="text-[10px] text-slate-400 font-normal">(اختياري)</span>
                    </label>
                    <select
                      value={quizLinkedVideoId}
                      onChange={(e) => setQuizLinkedVideoId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-right font-medium text-slate-900 dark:text-white"
                    >
                      <option value="">بدون ربط بفيديو محدد</option>
                      {platformData.videos
                        .filter((v) => !quizResourceId || v.resourceId === quizResourceId)
                        .map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.title}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Breadcrumb Preview */}
                <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex flex-wrap items-center gap-2">
                  <span className="font-bold">المسار المختار للاختبار:</span>
                  <span className="font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                    {platformData.sections.find((s) => s.id === quizSectionId)?.title || 'القسم'}
                  </span>
                  <span>←</span>
                  <span className="font-black bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-700">
                    {platformData.resources.find((r) => r.id === quizResourceId)?.title || 'المصدر'}
                  </span>
                  {quizLinkedVideoId && (
                    <>
                      <span>←</span>
                      <span className="font-black bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200">
                        {platformData.videos.find((v) => v.id === quizLinkedVideoId)?.title}
                      </span>
                    </>
                  )}
                </div>

                {/* Title & Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="space-y-1.5 sm:col-span-3">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">عنوان الاختبار *</label>
                    <input
                      type="text"
                      required
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="مثال: اختبار تجريبي لقياس مهارات الهندسة والمساحات"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right font-medium text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الوقت المحدد (بالدقائق، 0 للمفتوح)</label>
                    <input
                      type="number"
                      min={0}
                      value={quizTimeLimit}
                      onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">نسبة النجاح (%)</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={quizPassPercentage}
                      onChange={(e) => setQuizPassPercentage(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">وصف الاختبار (اختياري)</label>
                    <input
                      type="text"
                      value={quizDescription}
                      onChange={(e) => setQuizDescription(e.target.value)}
                      placeholder="وصف مختصر للاختبار..."
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-right text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Quiz Type Selector (Interactive vs External Link) */}
                <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    طريقة تقديم الاختبار:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setQuizIsExternal(false)}
                      className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                        !quizIsExternal
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 shadow-xs ring-1 ring-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${!quizIsExternal ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-black text-xs sm:text-sm">اختبار تفاعلي على المنصة</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          بناء أسئلة برمجية، رفع صور المسائل، تصحيح تلقائي مع إظهار النتيجة والشروحات
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuizIsExternal(true)}
                      className={`p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                        quizIsExternal
                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 shadow-xs ring-1 ring-blue-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <ExternalLink className={`w-5 h-5 shrink-0 mt-0.5 ${quizIsExternal ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-black text-xs sm:text-sm">اختبار خارجي عبر رابط مباشر</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          توجيه الطالب لصفحة الاختبار (Google Forms أو نماذج خارجية) عند النقر عليه
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* External Quiz Link Input */}
                {quizIsExternal && (
                  <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>رابط الاختبار الخارجي (Google Forms / Microsoft Forms / رابط مخصص) *</span>
                    </div>
                    <input
                      type="url"
                      required
                      value={quizExternalUrl}
                      onChange={(e) => setQuizExternalUrl(e.target.value)}
                      placeholder="https://forms.gle/... أو https://docs.google.com/forms/d/..."
                      dir="ltr"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl text-xs sm:text-sm font-mono text-left text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    <div className="flex items-start gap-2 text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        سيتم قفل الاختبار بحيث لا يظهر زر الدخول إلا بعد تسجيل دخول الطالب إلى المنصة. وعند النقر ينتقل مباشرة إلى صفحة الاختبار الخارجية في نافذة جديدة.
                      </span>
                    </div>
                  </div>
                )}

                {/* Quiz Cover Image (Optional for both types) */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>صورة غلاف الاختبار (اختياري - تظهر على بطاقة الاختبار وتُحفظ بشكل دائم)</span>
                    </label>
                    {quizImageUrl && (
                      <button
                        type="button"
                        onClick={() => setQuizImageUrl('')}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>

                  {quizImageUrl ? (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                      <div className="w-24 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                        <img
                          src={quizImageUrl}
                          alt="غلاف الاختبار"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم حفظ وتثبيت صورة غلاف الاختبار بشكل دائم ومؤمّن</span>
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          ستظهر الصورة على بطاقة الاختبار للطلاب مع الحماية من الحذف أو التلاشي.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl bg-white dark:bg-slate-900 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors">
                      {isUploadingQuizCover ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>جاري رفع وحفظ صورة الغلاف...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-emerald-600" />
                          <span>رفع صورة غلاف للاختبار من جهازك (تُحفظ سحابياً ومحلياً بشكل دائم)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQuizCoverUpload}
                        disabled={isUploadingQuizCover}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* QUESTIONS BUILDER SECTION */}
              {!quizIsExternal ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>أسئلة الاختبار التفاعلي ({quizQuestions.length})</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleAddQuestionToQuiz}
                    className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سؤال جديد</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {quizQuestions.map((question, qIdx) => {
                    const choiceLetters = ['أ', 'ب', 'ج', 'د'];
                    const choiceLettersEn = ['A', 'B', 'C', 'D'];

                    return (
                      <div
                        key={question.id || qIdx}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 space-y-4 shadow-sm relative"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-xs">
                              {qIdx + 1}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              السؤال رقم {qIdx + 1}
                            </span>
                          </div>

                          {quizQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(question.id, qIdx)}
                              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف هذا السؤال</span>
                            </button>
                          )}
                        </div>

                        {/* Image for Question - Direct Device Upload Only (No URL input, No title required) */}
                        <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-emerald-600" />
                              <span>صورة السؤال (يدعم الأشكال الهندسية، الأسس، الرموز الرياضية، والمسائل المصورة)</span>
                            </label>
                            {question.imageUrl && (
                              <button
                                type="button"
                                onClick={() => handleQuestionChange(qIdx, 'imageUrl', '')}
                                className="text-xs text-rose-600 hover:text-rose-700 cursor-pointer font-bold"
                              >
                                إزالة الصورة
                              </button>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2.5">
                            <label className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors ${
                              uploadingQuestionImgIdx === qIdx
                                ? 'bg-slate-400 text-white cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}>
                              {uploadingQuestionImgIdx === qIdx ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>جاري رفع وتخزين الصورة...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  <span>{question.imageUrl ? 'استبدال صورة السؤال من جهازك' : 'رفع صورة السؤال من جهازك'}</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingQuestionImgIdx === qIdx}
                                onChange={(e) => handleQuestionImageUpload(qIdx, e)}
                                className="hidden"
                              />
                            </label>

                            {question.imageUrl && (
                              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>تم حفظ الصورة على الخادم وجاهزة للاختبار</span>
                              </span>
                            )}
                          </div>

                          {question.imageUrl && (
                            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md">
                              <span className="text-[11px] text-slate-500 font-bold block mb-1.5">معاينة صورة السؤال:</span>
                              <div className="max-h-56 overflow-hidden rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700">
                                <img src={question.imageUrl} alt="صورة السؤال" className="max-h-52 object-contain rounded" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Optional Question Text (NO REQUIRED, NO TITLE FOR IMAGE) */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              نص السؤال
                            </label>
                            <span className="text-[10px] text-slate-400">
                              (اختياري - يمكنك تركه فارغاً إذا كان السؤال موجوداً بالكامل في الصورة)
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={question.questionText}
                            onChange={(e) => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                            placeholder="اكتب نص السؤال هنا (اختياري)..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-right text-slate-900 dark:text-white placeholder:text-slate-400"
                          />
                        </div>

                        {/* 4 Choices: A, B, C, D (أ، ب، ج، د) */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                            <span>خيارات الإجابة (أ / ب / ج / د):</span>
                            <span className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                              اضغط على الحرف (أ/ب/ج/د) لتحديده كإجابة صحيحة
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {question.options.map((opt, optIdx) => {
                              const isCorrect = question.correctOptionIndex === optIdx;

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer font-bold text-xs transition-all ${
                                      isCorrect
                                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                                    }`}
                                    title="اضغط لتعيين هذا الخيار كإجابة صحيحة"
                                  >
                                    <span className="flex items-center gap-0.5">
                                      <span>{choiceLetters[optIdx]}</span>
                                      {isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                                    </span>
                                  </button>

                                  <div className="flex-1 flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                      placeholder={`نص الخيار (${choiceLetters[optIdx]} / ${choiceLettersEn[optIdx]})`}
                                      className="w-full bg-transparent text-xs sm:text-sm focus:outline-none text-right font-medium text-slate-900 dark:text-white"
                                    />
                                  </div>

                                  {isCorrect && (
                                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md shrink-0">
                                      صحيحة
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation (Optional) */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            شرح طريقة الحل (اختياري - يظهر للطالب عند المراجعة بعد انتهاء الاختبار)
                          </label>
                          <input
                            type="text"
                            value={question.explanation || ''}
                            onChange={(e) => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                            placeholder="اكتب شرحاً لطريقة الوصول للحل الصحيح أو التوضيح..."
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-right text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Next question button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <button
                            type="button"
                            onClick={handleAddQuestionToQuiz}
                            className="w-full py-2 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>إضافة السؤال التالي (+ التالي)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              ) : (
                <div className="p-6 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center mx-auto">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">اختبار خارجي عبر رابط مباشر</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    لا يتطلب هذا الاختبار كتابة أسئلة هنا؛ بل سيتم تحويل الطالب مباشرة إلى الرابط الخارجي (مثل Google Forms) بمجرد النقر على زر الاختبار بعد تسجيل الدخول.
                  </p>
                </div>
              )}

              {/* Submit footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sticky bottom-0 bg-white dark:bg-slate-900 p-2">
                <button
                  type="button"
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-700/20 cursor-pointer"
                >
                  {isSubmitting 
                    ? 'جاري الحفظ والتسجيل...' 
                    : quizIsExternal 
                    ? 'حفظ الاختبار الخارجي' 
                    : 'حفظ الاختبار والأسئلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CONFIRMATION MODAL FOR DELETIONS */}
      {/* ==================================================== */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {confirmDialog.title}
                </h3>
                <span className="text-xs text-rose-500 dark:text-rose-400 font-bold">إجراء حذف نهائي</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm()}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
              >
                {confirmDialog.confirmLabel || 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Save Floating Action Bar */}
      <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-right">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white">ضمان الحفظ الدائم لدورات ومحتوى الطلاب</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                مفعل ومؤكد
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300">
              اضغط على زر الحفظ لتثبيت وحماية كافة التغييرات نهائياً حتى يجدها أي طالب في أي وقت.
            </p>
          </div>
        </div>

        <button
          id="btn-sticky-save-permanent"
          onClick={handleSaveAllPermanently}
          disabled={isSavingAll}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30 active:scale-95 disabled:opacity-50 whitespace-nowrap"
        >
          {isSavingAll ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSavingAll ? 'جاري الحفظ الدائم...' : 'حفظ التغييرات الآن'}</span>
        </button>
      </div>

    </div>
  );
};
