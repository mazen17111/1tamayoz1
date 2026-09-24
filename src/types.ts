export interface Question {
  id: string;
  questionText: string;
  imageUrl?: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  resourceId: string;
  sectionId: string;
  linkedVideoId?: string; // ربط اختبار بفيديو محدد
  title: string;
  description: string;
  timeLimitMinutes: number; // 0 for unlimited
  passingScorePercentage: number;
  questions: Question[];
  createdAt: string;
  imageUrl?: string; // صورة للاختبار (غلاف أو توضيحية)
  isExternal?: boolean; // هل الاختبار خارجي عبر رابط
  externalUrl?: string; // رابط الاختبار الخارجي (مثل Google Forms، نماذج مايكروسوفت)
}

export interface VideoItem {
  id: string;
  resourceId: string;
  sectionId: string;
  title: string;
  description: string;
  videoUrl: string; // YouTube embed URL, standard URL, or MP4
  durationMinutes: number;
  linkedQuizId?: string;
  order: number;
  createdAt: string;
}

export interface FileItem {
  id: string;
  resourceId: string;
  sectionId: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'summary' | 'sheet';
  fileSize: string;
  pagesCount?: number;
  order?: number;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  iconName?: string;
  level?: 'مبتدئ' | 'متوسط' | 'متقدم' | 'شامل';
  badge?: string;
  color?: string;
  type?: string;
  order: number;
  createdAt: string;
}

export interface SectionItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  badge?: string;
  color?: 'emerald' | 'blue' | 'indigo' | 'amber' | 'rose' | 'teal' | string;
  order: number;
  createdAt: string;
}

export interface QuizAttemptQuestionDetail {
  questionText: string;
  imageUrl?: string;
  options: string[];
  correctOptionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  sectionTitle: string;
  resourceTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  userAnswers: number[];
  timestamp: string;
  timeSpentSeconds?: number;
  timeSpentFormatted?: string;
  studentName?: string;
  studentEmail?: string;
  isExternal?: boolean;
  questionsDetails?: QuizAttemptQuestionDetail[];
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatarSeed?: string;
  createdAt: string;
  isApproved?: boolean; // When platform is locked, only approved students can enter
  isIndividuallyBlocked?: boolean; // When individually locked, this student cannot access even if platform is open
  progress: {
    completedVideoIds: string[];
    completedQuizAttempts: QuizAttempt[];
    bookmarkedResourceIds: string[];
  };
}

export interface LiveStreamConfig {
  isEnabled: boolean;
  title: string;
  streamUrl: string;
  description?: string;
  scheduledTime?: string;
  updatedAt?: string;
}

export type PlatformThemeId = 
  | 'emerald'      // الزمردي الأكاديمي (الافتراضي)
  | 'royal-blue'   // الأزرق الملكي
  | 'violet'       // البنفسجي العصري
  | 'amber-gold'   // الذهبي الفاخر
  | 'cyan-ocean'   // السماوي المحيطي
  | 'rose-crimson' // الياقوتي الإبداعي
  | 'slate-modern' // الرمادي الغرافيتي الحديث
  | 'midnight-dark'; // الليلي الفاخر

export type PlatformLayoutPreset = 
  | 'classic'            // 1. الافتراضي الكلاسيكي (أقسام ومصادر مركزية)
  | 'sidebar-split-right' // 2. الاستوديو الجانبي: أقسام ومصادر يمين ومشغل المحتوى/الفيديو يسار
  | 'sidebar-split-left'  // 3. استوديو جانبي يساري: القوائم باليسار والمحتوى باليمين
  | 'cinema-wide'        // 4. قاعة السينما العريضة: شاشة العرض بالأعلى وقائمة الدروس بالأسفل
  | 'bento-dashboard'    // 5. لوحة بينتو التفاعلية: شبكة متوازية من الأقسام والمصادر
  | 'cards-compact'      // 6. نمط البطاقات الذكية المصغرة: بطاقات مرنة سريعة التصفح
  | 'stacked-focus';     // 7. مسار التركيز المتسلسل: تدفق عمودي يركز على الدرس الحالي

export interface PlatformThemeConfig {
  id: PlatformThemeId;
  preset?: PlatformThemeId;
  name: string;
  primaryColor: string; // Tailwind primary color name e.g. 'emerald', 'blue', 'violet', etc.
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'standard' | 'compact' | 'rounded'; // حجم استدارة الحواف
  density: 'compact' | 'normal' | 'spacious' | 'comfortable'; // المسافات والأحجام
  headerStyle: 'standard' | 'floating' | 'minimal' | 'glassmorphism' | 'gradient'; // نمط شريط التنقل
  fontScale: 'sm' | 'base' | 'lg' | 'normal' | 'large' | 'huge'; // حجم الخطوط
  cardStyle: 'bordered' | 'glass' | 'solid' | 'elevated'; // نمط البطاقات
  sectionsLayout: 'grid-3' | 'grid-2' | 'list' | 'grid'; // شكل توزيع الأقسام
  layoutPreset?: PlatformLayoutPreset; // الشكل الهيكلي الكامل للمنصة
  updatedAt?: string;
  customLayoutOrder?: {
    desktop: string[];
    mobile: string[];
  };
}

export interface PlatformAnnouncement {
  isEnabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  linkText?: string;
  linkUrl?: string;
  isDismissible?: boolean;
  updatedAt?: string;
}

export interface PlatformAccessConfig {
  isLocked: boolean; // قفل المنصة على الطلاب
  lockReason?: 'maintenance' | 'subscription'; // نوع القفل: صيانة أو تفعيل اشتراك
  lockMessage: string; // رسالة الصيانة
  subscriptionMessage?: string; // رسالة انتهاء/تفعيل الاشتراك
  whatsappNumber?: string; // رقم واتساب المشرف للتفعيل الفوري
  whatsappMessage?: string; // نص رسالة الواتساب الجاهزة
  telegramUsername?: string; // يوزر أو رابط التليجرام
  subscriptionButtonText?: string; // نص الزر الرئيسي (مثلاً: اشترك الآن عبر واتساب)
  allowedStudentEmails: string[]; // الطلاب المصرح لهم بالدخول في وضع القفل
  blockedStudentEmails?: string[]; // الطلاب المحظورين/المقفل عليهم بشكل فردي خاص حتى لو المنصة مفتوحة للجميع
  updatedAt?: string;
}

export interface PlatformSettings {
  theme: PlatformThemeConfig;
  announcement: PlatformAnnouncement;
  access: PlatformAccessConfig;
}

export interface PlatformData {
  sections: SectionItem[];
  resources: ResourceItem[];
  videos: VideoItem[];
  files: FileItem[];
  quizzes: Quiz[];
  liveStream?: LiveStreamConfig;
  settings?: PlatformSettings;
  deletedIds?: string[];
  updatedAt?: string;
}

export interface RegisteredStudent {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  completedVideosCount: number;
  completedQuizzesCount: number;
  isApproved?: boolean;
  isIndividuallyBlocked?: boolean;
}

export interface AdminStats {
  sectionsCount: number;
  resourcesCount: number;
  videosCount: number;
  filesCount: number;
  quizzesCount: number;
  studentsCount: number;
  students?: RegisteredStudent[];
  totalAttemptsCount: number;
  recentAttempts: QuizAttempt[];
}

