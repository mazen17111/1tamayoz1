import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  Save, 
  Check, 
  Layout, 
  Maximize2, 
  Layers, 
  Eye, 
  Sliders, 
  CheckCircle2,
  Columns3,
  List,
  Grid,
  Laptop,
  Smartphone,
  MoveUp,
  MoveDown,
  GripVertical,
  RotateCcw,
  Monitor,
  Video,
  BookOpen,
  Megaphone,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { 
  PlatformThemeConfig, 
  PlatformThemeId, 
  PlatformLayoutPreset 
} from '../../types';

interface AdminAppearanceTabProps {
  currentTheme?: PlatformThemeConfig;
  onSaveTheme: (theme: PlatformThemeConfig) => Promise<void>;
  isSaving: boolean;
}

interface ThemePresetOption {
  id: PlatformThemeId;
  name: string;
  description: string;
  gradient: string;
  primaryColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
}

interface LayoutPresetOption {
  id: PlatformLayoutPreset;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  // Visual wireframe diagram representation
  diagram: {
    sidebar?: 'right' | 'left';
    hasHeader: boolean;
    mainStyle: 'center' | 'split-left' | 'split-right' | 'cinema' | 'bento' | 'cards' | 'stacked';
  };
}

const THEME_PRESETS: ThemePresetOption[] = [
  {
    id: 'emerald',
    name: 'الأخضر الزمردي الملكي',
    description: 'المظهر الكلاسيكي الأصلي لمنصة التميز باللون الزمردي الراقي',
    gradient: 'from-emerald-700 via-emerald-600 to-teal-700',
    primaryColor: '#047857',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-800 dark:text-emerald-300'
  },
  {
    id: 'royal-blue',
    name: 'الأزرق الملكي الأكاديمي',
    description: 'طابع الجامعات العالمية والمنصات التعليمية المرموقة',
    gradient: 'from-blue-700 via-blue-600 to-indigo-700',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/70',
    badgeText: 'text-blue-800 dark:text-blue-300'
  },
  {
    id: 'violet',
    name: 'البنفسجي الإبداعي العصري',
    description: 'طابع رقمي متألق ومبتكر يعزز الشغف والتركيز',
    gradient: 'from-purple-700 via-violet-600 to-indigo-800',
    primaryColor: '#7c3aed',
    accentColor: '#8b5cf6',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
    badgeText: 'text-purple-800 dark:text-purple-300'
  },
  {
    id: 'amber-gold',
    name: 'الذهبي العنبري الفاخر',
    description: 'طابع الفخامة والتفوق والأوسمة الشرفية',
    gradient: 'from-amber-600 via-amber-500 to-yellow-600',
    primaryColor: '#d97706',
    accentColor: '#f59e0b',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/70',
    badgeText: 'text-amber-800 dark:text-amber-300'
  },
  {
    id: 'cyan-ocean',
    name: 'المحيطي الفيروزي المريح',
    description: 'ألوان سماوية هادئة ومريحة جداً لعين الطالب للمذاكرة الطويلة',
    gradient: 'from-cyan-700 via-teal-600 to-sky-700',
    primaryColor: '#0891b2',
    accentColor: '#06b6d4',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/70',
    badgeText: 'text-cyan-800 dark:text-cyan-300'
  },
  {
    id: 'rose-crimson',
    name: 'القرمزي الناري المحفّز',
    description: 'ألوان نابضة بالحماس والطاقة الإيجابية لإنجاز الاختبارات',
    gradient: 'from-rose-700 via-rose-600 to-red-700',
    primaryColor: '#e11d48',
    accentColor: '#f43f5e',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/70',
    badgeText: 'text-rose-800 dark:text-rose-300'
  },
  {
    id: 'slate-modern',
    name: 'الحجري التكنولوجي الهادئ',
    description: 'مظهر متزن وهادئ مع تباين فائق وسهولة قراءة عالية',
    gradient: 'from-slate-800 via-slate-700 to-zinc-800',
    primaryColor: '#334155',
    accentColor: '#64748b',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-300'
  },
  {
    id: 'midnight-dark',
    name: 'الداكن المخملي الليلي',
    description: 'مظهر فخم بدرجات الليل العميقة وتوهج أزرق سماوي ناعم',
    gradient: 'from-slate-950 via-slate-900 to-indigo-950',
    primaryColor: '#0f172a',
    accentColor: '#38bdf8',
    badgeBg: 'bg-slate-800 text-sky-400',
    badgeText: 'text-sky-300'
  }
];

// Layout Presets with miniature visual wireframe diagrams
const LAYOUT_PRESETS: LayoutPresetOption[] = [
  {
    id: 'classic',
    title: 'الافتراضي الكلاسيكي',
    subtitle: 'تدفق مركزي قياسي',
    description: 'الأقسام والمصادر بالمنتصف متتالية، وتشغيل الفيديو في نافذة منبثقة تفاعلية.',
    diagram: {
      hasHeader: true,
      mainStyle: 'center'
    }
  },
  {
    id: 'sidebar-split-right',
    title: 'استوديو الشاشة المقسمة',
    subtitle: 'أقسام ومصادر يمين + مشغل الفيديو يسار',
    description: 'قائمة الأقسام والمصادر والدروس في الجانب الأيمن، ومشغل الفيديو المباشر في الجانب الأيسر.',
    badge: 'الأكثر طلباً',
    diagram: {
      sidebar: 'right',
      hasHeader: true,
      mainStyle: 'split-right'
    }
  },
  {
    id: 'cinema-wide',
    title: 'مسرح السينما العريض',
    subtitle: 'شاشة عرض علوية فسيحة',
    description: 'مشغل الفيديو في الأعلى بعرض كامل كقاعة سينما، والأقسام والمصادر ممتدة تحته.',
    diagram: {
      hasHeader: true,
      mainStyle: 'cinema'
    }
  },
  {
    id: 'bento-dashboard',
    title: 'لوحة بينتو التفاعلية',
    subtitle: 'شبكة بطاقات ذكية متجاورة',
    description: 'توزيعة بطاقات بأسلوب Bento Grid تجمع الأقسام والمصادر والفيديو في تناسق عصري.',
    diagram: {
      hasHeader: true,
      mainStyle: 'bento'
    }
  },
  {
    id: 'sidebar-split-left',
    title: 'الاستوديو المعكوس',
    subtitle: 'قوائم يسار + مشغل الفيديو يمين',
    description: 'القوائم والمصادر في الجانب الأيسر، ومسرح الفيديو والمحتوى في الجانب الأيمن.',
    diagram: {
      sidebar: 'left',
      hasHeader: true,
      mainStyle: 'split-left'
    }
  },
  {
    id: 'cards-compact',
    title: 'البطاقات الذكية المصغرة',
    subtitle: 'مربعات مدمجة وسريعة',
    description: 'توزيع الدروس والمصادر كبطاقات مربعة مدمجة تسهل الوصول السريع لكل درس.',
    badge: 'جديد',
    diagram: {
      hasHeader: true,
      mainStyle: 'cards'
    }
  },
  {
    id: 'stacked-focus',
    title: 'مسار التركيز المتسلسل',
    subtitle: 'تدفق تعليمي عمودي مخصص',
    description: 'تركيز فوري على مشغل الفيديو والدرس الحالي مع خطوات إنجاز واضحة أسفل الشاشة.',
    badge: 'جديد',
    diagram: {
      hasHeader: true,
      mainStyle: 'stacked'
    }
  }
];

// Reorderable blocks
interface LayoutBlockItem {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
}

const DEFAULT_BLOCKS: LayoutBlockItem[] = [
  { 
    id: 'announcements', 
    title: 'شريط الإعلانات والتنبيهات', 
    icon: Megaphone, 
    color: 'bg-rose-500 text-white', 
    description: 'شريط التنبيهات والأخبار السريعة بالأعلى' 
  },
  { 
    id: 'sections', 
    title: 'شريط وقائمة الأقسام التعليمية', 
    icon: Layers, 
    color: 'bg-emerald-600 text-white', 
    description: 'الأقسام الأساسية (كمي، لفظي، مواد دراسية)' 
  },
  { 
    id: 'resources', 
    title: 'قائمة المصادر والمذكرات', 
    icon: BookOpen, 
    color: 'bg-blue-600 text-white', 
    description: 'المذكرات والمصادر التعليمية والاختبارات التفاعلية' 
  },
  { 
    id: 'video_stage', 
    title: 'مشغل الفيديو ومسرح الشروحات', 
    icon: Video, 
    color: 'bg-amber-600 text-white', 
    description: 'شاشة تشغيل شروحات الدروس ومتابعة المشاهدة' 
  }
];

export const AdminAppearanceTab: React.FC<AdminAppearanceTabProps> = ({
  currentTheme,
  onSaveTheme,
  isSaving,
}) => {
  const [themeState, setThemeState] = useState<PlatformThemeConfig>(() => ({
    preset: currentTheme?.preset || 'emerald',
    layoutPreset: currentTheme?.layoutPreset && currentTheme?.layoutPreset !== 'classic' ? currentTheme.layoutPreset : 'sidebar-split-right',
    customLayoutOrder: currentTheme?.customLayoutOrder || {
      desktop: ['announcements', 'sections', 'resources', 'video_stage'],
      mobile: ['announcements', 'sections', 'resources', 'video_stage'],
    },
    borderRadius: currentTheme?.borderRadius || 'standard',
    density: currentTheme?.density || 'comfortable',
    fontScale: currentTheme?.fontScale || 'normal',
    headerStyle: currentTheme?.headerStyle || 'glassmorphism',
    sectionsLayout: currentTheme?.sectionsLayout || 'grid',
  }));

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isControlModalOpen, setIsControlModalOpen] = useState(false);
  const [perspective, setPerspective] = useState<'laptop' | 'mobile'>('laptop');

  // Keep themeState updated when currentTheme prop changes
  React.useEffect(() => {
    if (currentTheme) {
      setThemeState((prev) => ({
        ...prev,
        ...currentTheme,
        layoutPreset: currentTheme.layoutPreset && currentTheme.layoutPreset !== 'classic' ? currentTheme.layoutPreset : prev.layoutPreset || 'sidebar-split-right',
        preset: currentTheme.preset || prev.preset || 'emerald',
      }));
    }
  }, [currentTheme]);

  // Working state for drag and drop reordering inside modal
  const [currentOrder, setCurrentOrder] = useState<string[]>(() => {
    return themeState.customLayoutOrder?.[perspective] || [
      'announcements',
      'sections',
      'resources',
      'video_stage'
    ];
  });

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Sync current order when perspective changes
  const handlePerspectiveChange = (newPersp: 'laptop' | 'mobile') => {
    setPerspective(newPersp);
    const orderForPersp = themeState.customLayoutOrder?.[newPersp] || [
      'announcements',
      'sections',
      'resources',
      'video_stage'
    ];
    setCurrentOrder(orderForPersp);
  };

  // Reordering helpers (buttons)
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setCurrentOrder(newOrder);
  };

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedItemId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId) return;
    const fromIndex = currentOrder.indexOf(draggedItemId);
    const toIndex = currentOrder.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setCurrentOrder(newOrder);
    setDraggedItemId(null);
  };

  // Save from control modal
  const handleSaveControlOrder = async () => {
    const updatedTheme: PlatformThemeConfig = {
      ...themeState,
      customLayoutOrder: {
        ...themeState.customLayoutOrder,
        [perspective]: currentOrder,
      }
    };
    setThemeState(updatedTheme);
    await onSaveTheme(updatedTheme);
    setIsControlModalOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // One-click Reset to baseline/default
  const handleResetToDefault = async () => {
    const defaultTheme: PlatformThemeConfig = {
      id: 'emerald',
      name: 'الزمردي الأكاديمي الكلاسيكي',
      primaryColor: 'emerald',
      preset: 'emerald',
      layoutPreset: 'sidebar-split-right',
      customLayoutOrder: {
        desktop: ['announcements', 'sections', 'resources', 'video_stage'],
        mobile: ['announcements', 'sections', 'resources', 'video_stage'],
      },
      borderRadius: 'standard',
      density: 'comfortable',
      fontScale: 'normal',
      headerStyle: 'glassmorphism',
      sectionsLayout: 'grid',
      cardStyle: 'bordered',
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('tamayuz_platform_theme', JSON.stringify(defaultTheme));
      localStorage.setItem('tamayuz_layout_preset', 'sidebar-split-right');
      window.dispatchEvent(new CustomEvent('tamayuz_theme_updated', { detail: defaultTheme }));
      const bc = new BroadcastChannel('tamayuz_theme');
      bc.postMessage({ type: 'THEME_UPDATED', theme: defaultTheme });
      bc.close();
    } catch {}
    setThemeState(defaultTheme);
    setCurrentOrder(['announcements', 'sections', 'resources', 'video_stage']);
    await onSaveTheme(defaultTheme);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Apply full theme state
  const handleApply = async () => {
    const chosenPreset = themeState.layoutPreset && themeState.layoutPreset !== 'classic'
      ? themeState.layoutPreset
      : 'sidebar-split-right';
    const updatedTheme: PlatformThemeConfig = {
      ...themeState,
      id: themeState.preset || 'emerald',
      name: themeState.name || 'المظهر المخصص للمنصة',
      primaryColor: themeState.preset || 'emerald',
      layoutPreset: chosenPreset,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('tamayuz_platform_theme', JSON.stringify(updatedTheme));
      localStorage.setItem('tamayuz_layout_preset', chosenPreset);
      window.dispatchEvent(new CustomEvent('tamayuz_theme_updated', { detail: updatedTheme }));
      const bc = new BroadcastChannel('tamayuz_theme');
      bc.postMessage({ type: 'THEME_UPDATED', theme: updatedTheme });
      bc.close();
    } catch {}
    setThemeState(updatedTheme);
    await onSaveTheme(updatedTheme);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const selectedPreset = THEME_PRESETS.find((p) => p.id === themeState.preset) || THEME_PRESETS[0];

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* ================================================================ */}
      {/* 1. PLATFORM LAYOUT PRESETS (أشكال مصغرة جديدة للمنصة) */}
      {/* ================================================================ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
        
        {/* Header with Control & Default Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تخطيطات وأشكال المنصة المصغرة (Layouts)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              اختر شكل التخطيط المفضل لديك، أو استخدم زر التحكم لإعادة ترتيب العناصر بالسحب والإفلات
            </p>
          </div>

          {/* Action Buttons: تحكم + الافتراضي + حفظ */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Button 1: تحكم (Control Mode) */}
            <button
              id="admin-layout-control-btn"
              type="button"
              onClick={() => {
                handlePerspectiveChange(perspective);
                setIsControlModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:scale-[1.02]"
              title="تغيير أماكن العناصر بالسحب والإفلات لمنظور الجوال أو اللابتوب"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>🎛️ تحكم (سحب وإفلات)</span>
            </button>

            {/* Button 2: الافتراضي (Reset Default) */}
            <button
              id="admin-layout-default-btn"
              type="button"
              onClick={handleResetToDefault}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-black transition-all cursor-pointer flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:scale-[1.02]"
              title="إعادة المنصة للشكل القديم الأساسي المعتمد"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>الافتراضي</span>
            </button>

            {/* Button 3: حفظ وتطبيق */}
            <button
              id="admin-save-layout-preset-btn"
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-700/20"
            >
              <Save className="w-4 h-4" />
              <span>{savedSuccess ? 'تم الحفظ بنجاح!' : 'حفظ وتطبيق الشكل'}</span>
            </button>
          </div>
        </div>

        {/* 7 Miniature Layout Square Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3.5">
          {LAYOUT_PRESETS.map((preset) => {
            const currentActivePreset = (themeState.layoutPreset && themeState.layoutPreset !== 'classic')
              ? themeState.layoutPreset
              : 'sidebar-split-right';
            const isSelected = currentActivePreset === preset.id;

            return (
              <div
                key={preset.id}
                id={`layout-preset-card-${preset.id}`}
                onClick={() => setThemeState((prev) => ({ ...prev, layoutPreset: preset.id }))}
                className={`relative p-3.5 rounded-2xl border text-right cursor-pointer transition-all flex flex-col justify-between space-y-2.5 ${
                  isSelected
                    ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/25 dark:bg-emerald-950/25 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Mini Visual Diagram Wireframe */}
                <div className="w-full h-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 p-1.5 flex flex-col justify-between border border-slate-300/60 dark:border-slate-700/60 overflow-hidden shadow-inner">
                  {/* Miniature Top Bar */}
                  <div className="h-2.5 w-full rounded bg-emerald-700/80 flex items-center justify-between px-1.5 shrink-0">
                    <div className="w-2 h-1 rounded-xs bg-white/70" />
                    <div className="w-6 h-1 rounded-xs bg-white/50" />
                  </div>

                  {/* Wireframe Body according to layout */}
                  {preset.id === 'classic' && (
                    <div className="flex-1 flex flex-col justify-center items-center gap-1 my-1">
                      <div className="w-4/5 h-3.5 rounded bg-emerald-600/60 flex items-center justify-center text-[6px] text-white font-bold">
                        الأقسام
                      </div>
                      <div className="w-4/5 h-5 rounded bg-blue-500/60 flex items-center justify-center text-[6px] text-white font-bold">
                        المصادر
                      </div>
                      <div className="w-3/5 h-2.5 rounded bg-amber-500/50 flex items-center justify-center text-[5px] text-white">
                        نافذة الفيديو
                      </div>
                    </div>
                  )}

                  {preset.id === 'sidebar-split-right' && (
                    <div className="flex-1 flex gap-1 my-1">
                      {/* Left: Video Stage */}
                      <div className="flex-1 rounded bg-amber-500/80 flex flex-col items-center justify-center text-[6px] text-white font-bold shadow-xs">
                        <span>مشغل الفيديو</span>
                        <span className="text-[5px] opacity-80">(يسار)</span>
                      </div>
                      {/* Right: Sections & Resources Sidebar */}
                      <div className="w-2/5 flex flex-col gap-1">
                        <div className="flex-1 rounded bg-emerald-600/80 flex items-center justify-center text-[5px] text-white font-bold">
                          الأقسام
                        </div>
                        <div className="flex-1 rounded bg-blue-600/80 flex items-center justify-center text-[5px] text-white font-bold">
                          المصادر
                        </div>
                      </div>
                    </div>
                  )}

                  {preset.id === 'cinema-wide' && (
                    <div className="flex-1 flex flex-col gap-1 my-1">
                      {/* Top Wide Video Screen */}
                      <div className="w-full h-7 rounded bg-amber-500/90 flex items-center justify-center text-[6px] text-white font-bold shadow-xs">
                        مشغل الفيديو العريض (مسرح السينما)
                      </div>
                      {/* Bottom Row */}
                      <div className="flex-1 flex gap-1">
                        <div className="flex-1 rounded bg-emerald-600/70 flex items-center justify-center text-[5px] text-white font-bold">
                          الأقسام
                        </div>
                        <div className="flex-1 rounded bg-blue-600/70 flex items-center justify-center text-[5px] text-white font-bold">
                          المصادر
                        </div>
                      </div>
                    </div>
                  )}

                  {preset.id === 'bento-dashboard' && (
                    <div className="flex-1 grid grid-cols-2 gap-1 my-1">
                      <div className="rounded bg-emerald-600/80 flex items-center justify-center text-[5px] text-white font-bold">
                        الأقسام
                      </div>
                      <div className="rounded bg-amber-500/80 flex items-center justify-center text-[5px] text-white font-bold">
                        الفيديو
                      </div>
                      <div className="col-span-2 rounded bg-blue-600/80 flex items-center justify-center text-[5px] text-white font-bold">
                        لوحة المصادر والتمارين
                      </div>
                    </div>
                  )}

                  {preset.id === 'sidebar-split-left' && (
                    <div className="flex-1 flex gap-1 my-1">
                      {/* Left: Sections & Resources Sidebar */}
                      <div className="w-2/5 flex flex-col gap-1">
                        <div className="flex-1 rounded bg-emerald-600/80 flex items-center justify-center text-[5px] text-white font-bold">
                          الأقسام
                        </div>
                        <div className="flex-1 rounded bg-blue-600/80 flex items-center justify-center text-[5px] text-white font-bold">
                          المصادر
                        </div>
                      </div>
                      {/* Right: Video Stage */}
                      <div className="flex-1 rounded bg-amber-500/80 flex flex-col items-center justify-center text-[6px] text-white font-bold shadow-xs">
                        <span>مشغل الفيديو</span>
                        <span className="text-[5px] opacity-80">(يمين)</span>
                      </div>
                    </div>
                  )}

                  {preset.id === 'cards-compact' && (
                    <div className="flex-1 grid grid-cols-2 gap-1 my-1">
                      <div className="rounded bg-emerald-600/70 flex items-center justify-center text-[5px] text-white font-bold">
                        بطاقة 1
                      </div>
                      <div className="rounded bg-teal-600/70 flex items-center justify-center text-[5px] text-white font-bold">
                        بطاقة 2
                      </div>
                      <div className="rounded bg-blue-600/70 flex items-center justify-center text-[5px] text-white font-bold">
                        بطاقة 3
                      </div>
                      <div className="rounded bg-amber-500/70 flex items-center justify-center text-[5px] text-white font-bold">
                        مشغل مدمج
                      </div>
                    </div>
                  )}

                  {preset.id === 'stacked-focus' && (
                    <div className="flex-1 flex flex-col justify-between gap-1 my-1">
                      <div className="w-full h-7 rounded bg-amber-500/90 flex items-center justify-center text-[6px] text-white font-bold">
                        شاشة التركيز المباشرة
                      </div>
                      <div className="flex items-center justify-around gap-1">
                        <div className="w-1/3 h-3 rounded bg-emerald-600/70 flex items-center justify-center text-[5px] text-white">
                          خطوة 1
                        </div>
                        <div className="w-1/3 h-3 rounded bg-blue-600/70 flex items-center justify-center text-[5px] text-white">
                          خطوة 2
                        </div>
                        <div className="w-1/3 h-3 rounded bg-purple-600/70 flex items-center justify-center text-[5px] text-white">
                          خطوة 3
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Miniature Footer */}
                  <div className="h-1.5 w-full rounded bg-slate-400/40 shrink-0" />
                </div>

                {/* Card Info */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-slate-900 dark:text-white">
                      {preset.title}
                    </h4>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {preset.subtitle}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                    {preset.description}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ================================================================ */}
      {/* 2. THEME COLOR PRESETS */}
      {/* ================================================================ */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              هوية وألوان المنصة المعتمدة:
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            اختر لوحة الألوان المناسبة التي ستنعكس على كافة الأزرار والبطاقات والأوسمة
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {THEME_PRESETS.map((preset) => {
            const isSelected = themeState.preset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => setThemeState((prev) => ({ ...prev, preset: preset.id }))}
                className={`relative p-4 rounded-2xl border text-right cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Color Swatch Bar */}
                <div className={`h-12 w-full rounded-xl bg-gradient-to-r ${preset.gradient} mb-3 flex items-center justify-between px-3 shadow-2xs`}>
                  <span className="text-[11px] font-bold text-white drop-shadow-xs">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    {preset.name}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. SIZES, RADII & DENSITY */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Border Radii Customization */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              حواف وزوايا البطاقات والأزرار:
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'compact', label: 'حادة مدمجة (6px)' },
              { id: 'standard', label: 'كلاسيكية (12px)' },
              { id: 'rounded', label: 'مستديرة عصرية (20px)' },
              { id: 'full', label: 'كبسولية ناعمة (28px)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setThemeState((p) => ({ ...p, borderRadius: item.id as any }))}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  themeState.borderRadius === item.id
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spacing Density Customization */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              كثافة المسافات والأحجام:
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'compact', label: 'مضغوط' },
              { id: 'comfortable', label: 'متوازن ومريح' },
              { id: 'spacious', label: 'واسع ورحب' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setThemeState((p) => ({ ...p, density: item.id as any }))}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  themeState.density === item.id
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Scale Customization */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              مقياس حجم الخطوط:
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'طبيعي (100%)' },
              { id: 'large', label: 'كبير (110%)' },
              { id: 'huge', label: 'ضخم (120%)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setThemeState((p) => ({ ...p, fontScale: item.id as any }))}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  themeState.fontScale === item.id
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ================================================================ */}
      {/* 4. MODAL: DRAG & DROP LAYOUT CUSTOMIZER («🎛️ تحكم») */}
      {/* ================================================================ */}
      {isControlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80">
              <button
                onClick={() => setIsControlModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-right">
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block">
                  لوحة التحكم الذكية بالسحب والإفلات
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  تغيير ترتيب وأماكن عناصر المنصة
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Perspective Selector: Mobile vs Laptop */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  اختر المنظور المطلوب تخصيصه:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handlePerspectiveChange('laptop')}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all cursor-pointer font-black text-xs sm:text-sm ${
                      perspective === 'laptop'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>💻 منظور اللابتوب والكمبيوتر</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePerspectiveChange('mobile')}
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all cursor-pointer font-black text-xs sm:text-sm ${
                      perspective === 'mobile'
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>📱 منظور الجوال والأجهزة الذكية</span>
                  </button>
                </div>
              </div>

              {/* Drag & Drop Reorderable List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    اسحب العناصر لتغيير ترتيبها، أو استخدم أزرار الأسهم (🔼 / 🔽):
                  </span>
                  <span className="text-[11px] text-slate-400">
                    الترتيب من الأعلى إلى الأسفل
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentOrder.map((blockId, index) => {
                    const block = DEFAULT_BLOCKS.find((b) => b.id === blockId) || {
                      id: blockId,
                      title: blockId,
                      icon: Layers,
                      color: 'bg-slate-600 text-white',
                      description: ''
                    };
                    const IconComponent = block.icon;

                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={() => handleDragStart(block.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(block.id)}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 select-none ${
                          draggedItemId === block.id
                            ? 'opacity-40 border-blue-500 bg-blue-50/40'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:border-blue-400 shadow-xs'
                        }`}
                      >
                        {/* Drag Handle & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing p-1">
                            <GripVertical className="w-5 h-5" />
                          </div>

                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${block.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-400">#{index + 1}</span>
                              <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {block.title}
                              </h5>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {block.description}
                            </p>
                          </div>
                        </div>

                        {/* Order Control Buttons (🔼 / 🔽) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            title="تحريك لأعلى"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <MoveUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === currentOrder.length - 1}
                            title="تحريك لأسفل"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <MoveDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wireframe Mockup Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
                  محاكاة مباشرة لترتيب العناصر على {perspective === 'laptop' ? 'شاشة اللابتوب' : 'شاشة الجوال'}:
                </span>
                <div className="p-3 bg-slate-950 rounded-xl space-y-1.5 font-mono text-[11px]">
                  {currentOrder.map((id, idx) => {
                    const blk = DEFAULT_BLOCKS.find((b) => b.id === id);
                    return (
                      <div 
                        key={id} 
                        className="py-1.5 px-3 rounded-lg bg-slate-800 text-white flex items-center justify-between border border-slate-700"
                      >
                        <span>{idx + 1}. {blk?.title || id}</span>
                        <span className="text-[10px] text-emerald-400">نَشِط</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCurrentOrder(['announcements', 'sections', 'resources', 'video_stage']);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة الترتيب التلقائي</span>
              </button>

              <button
                type="button"
                id="save-control-reorder-btn"
                onClick={handleSaveControlOrder}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-blue-600/20 hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الترتيب والتصميم الآن</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
