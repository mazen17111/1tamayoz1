import React from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Calendar, 
  Clock, 
  Sparkles,
  Award,
  X
} from 'lucide-react';
import { Quiz } from '../types';

interface ExternalQuizConfirmModalProps {
  isOpen: boolean;
  quiz: Quiz | null;
  onConfirm: () => void;
  onClose: () => void;
}

export const ExternalQuizConfirmModal: React.FC<ExternalQuizConfirmModalProps> = ({
  isOpen,
  quiz,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !quiz) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      id="external-quiz-confirm-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative text-right">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-sm shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>تسجيل الاختبار الخارجي</span>
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              تم فتح الاختبار الخارجي
            </h3>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-4 space-y-2">
          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
            {quiz.title}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>الموعد: {dateStr}</span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>الوقت: {timeStr}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 font-medium">
          بعد انتهائك من حل نموذج الاختبار الخارجي، اضغط على زر <strong className="text-emerald-700 dark:text-emerald-400">«تمام»</strong> لتثبيت اسم الاختبار وموعد ووقت إجرائه في إحصائياتك وسجلك التعليمي بالمنصة.
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="confirm-external-quiz-btn"
            onClick={onConfirm}
            className="flex-1 py-3 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md shadow-emerald-700/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تمام - تسجيل في إحصائياتي</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
