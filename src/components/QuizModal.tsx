import React, { useState, useEffect, useCallback } from 'react';
import { Quiz, QuizAttempt, Question, StudentUser } from '../types';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  HelpCircle,
  Check,
  ZoomIn,
  PenTool,
  Maximize2,
  Minimize2,
  AlertTriangle,
  BookOpen,
  Eye,
  FileQuestion,
  Layers,
  FolderPlus,
  Folder
} from 'lucide-react';
import { QuizWhiteboard } from './QuizWhiteboard';
import { AddToFolderModal } from './AddToFolderModal';
import { apiService } from '../services/api';

interface QuizModalProps {
  quiz: Quiz;
  sectionTitle: string;
  resourceTitle: string;
  currentUser?: StudentUser | null;
  onUpdateUser?: (user: StudentUser) => void;
  onShowToast?: (msg: string) => void;
  onClose: () => void;
  onComplete: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quiz,
  sectionTitle,
  resourceTitle,
  currentUser,
  onUpdateUser,
  onShowToast,
  onClose,
  onComplete,
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [folderTargetQuestion, setFolderTargetQuestion] = useState<Question | null>(null);
  const [hasChosenMode, setHasChosenMode] = useState<boolean>(false);
  const [isTimedMode, setIsTimedMode] = useState<boolean>(() => quiz.timeLimitMinutes > 0);
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [finishedTimeSpent, setFinishedTimeSpent] = useState<{ seconds: number; formatted: string }>({
    seconds: 0,
    formatted: '',
  });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    return quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 15 * 60;
  });
  const [imageZoomUrl, setImageZoomUrl] = useState<string | null>(null);

  // Whiteboard scratchpad state per question
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'question' | 'whiteboard'>('question');
  const [drawingsPerQuestion, setDrawingsPerQuestion] = useState<Record<string, string>>({});

  // Fullscreen state
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  const formatArabicDuration = (totalSeconds: number): string => {
    const secs = Math.max(1, Math.round(totalSeconds));
    if (secs < 60) {
      return `${secs} ثانية`;
    }
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    if (rem === 0) {
      if (mins === 1) return 'دقيقة واحدة';
      if (mins === 2) return 'دقيقتان';
      if (mins >= 3 && mins <= 10) return `${mins} دقائق`;
      return `${mins} دقيقة`;
    }
    const minsText = mins === 1 ? 'دقيقة' : mins === 2 ? 'دقيقتين' : mins <= 10 ? `${mins} دقائق` : `${mins} دقيقة`;
    return `${minsText} و ${rem} ثانية`;
  };

  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIdx];

  // Fullscreen toggle handler
  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsNativeFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsNativeFullscreen(false);
      }
    } catch {
      // Browser permissions or in-app webview restriction
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!hasChosenMode || isFinished || !isTimedMode) return;

    if (timeLeftSeconds <= 0) {
      handleFinishQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [hasChosenMode, timeLeftSeconds, isFinished, isTimedMode]);

  const handleSelectOption = (optionIndex: number) => {
    if (isFinished) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setMobileTab('question');
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
      setMobileTab('question');
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    if (idx >= 0 && idx < totalQuestions) {
      setCurrentQuestionIdx(idx);
      setMobileTab('question');
    }
  };

  const handleSaveDrawing = useCallback((qId: string, dataUrl: string) => {
    setDrawingsPerQuestion((prev) => ({
      ...prev,
      [qId]: dataUrl,
    }));
  }, []);

  // Calculate score and submit
  const handleFinishQuiz = () => {
    let score = 0;
    const answersArray: number[] = [];

    questions.forEach((q, idx) => {
      const selected = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      answersArray.push(selected);
      if (selected === q.correctOptionIndex) {
        score++;
      }
    });

    const percentage = Math.round((score / (totalQuestions || 1)) * 100);
    const passed = percentage >= quiz.passingScorePercentage;

    const totalSpent = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const formattedSpent = formatArabicDuration(totalSpent);
    setFinishedTimeSpent({ seconds: totalSpent, formatted: formattedSpent });

    const questionsDetails = questions.map((q, idx) => {
      const selected = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
      return {
        questionId: q.id,
        questionText: q.questionText,
        options: Array.isArray(q.options) ? q.options : [],
        userAnswerIndex: selected,
        correctAnswerIndex: q.correctOptionIndex,
        isCorrect: selected === q.correctOptionIndex,
        explanation: q.explanation || undefined,
        imageUrl: q.imageUrl || (q as any).imageData,
      };
    });

    setIsFinished(true);

    // Automatically transfer all mistaken questions directly to student's "مجلد أخطائي"
    const wrongQuestions = questions
      .filter((q, idx) => {
        const selected = selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1;
        return selected !== q.correctOptionIndex;
      })
      .map((q, idx) => ({
        ...q,
        sourceQuizId: quiz.id,
        sourceQuizTitle: quiz.title,
        sourceSectionTitle: sectionTitle,
        userAnswerIndex: selectedAnswers[questions.indexOf(q)] !== undefined ? selectedAnswers[questions.indexOf(q)] : -1,
      }));

    if (wrongQuestions.length > 0 && currentUser) {
      apiService.addMistakenQuestions(wrongQuestions).then((updatedUser) => {
        if (updatedUser && onUpdateUser) {
          onUpdateUser(updatedUser);
        }
      }).catch((e) => console.warn('Could not auto-transfer wrong questions:', e));
    }

    onComplete({
      quizId: quiz.id,
      quizTitle: quiz.title,
      sectionTitle,
      resourceTitle,
      score,
      totalQuestions,
      percentage,
      passed,
      userAnswers: answersArray,
      timeSpentSeconds: totalSpent,
      timeSpentFormatted: formattedSpent,
      questionsDetails,
    });
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setIsFinished(false);
    setHasChosenMode(false);
    setStartTime(Date.now());
    setFinishedTimeSpent({ seconds: 0, formatted: '' });
    setTimeLeftSeconds(quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 15 * 60);
    setDrawingsPerQuestion({});
    setMobileTab('question');
  };

  // Safe exit check
  const handleRequestClose = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    if (!isFinished && answeredCount > 0) {
      setShowExitConfirm(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      onClose();
    }
  };

  // Format timer
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Results calculation for review
  const score = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctOptionIndex ? 1 : 0);
  }, 0);
  const percentage = Math.round((score / (totalQuestions || 1)) * 100);
  const isPassed = percentage >= quiz.passingScorePercentage;

  // Helper to reliably resolve question image (supports base64, dataUrl, imageData, or localStorage cache)
  const getQuestionImageUrl = (q?: any): string | undefined => {
    if (!q) return undefined;
    const direct = q.imageUrl?.trim() || q.imageData?.trim();
    if (direct) return direct;
    try {
      if (q.id) {
        const stored = localStorage.getItem(`img_perm_${q.id}`);
        if (stored) return stored;
      }
    } catch {}
    return undefined;
  };

  if (totalQuestions === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 text-right">
        <div className="bg-slate-900 rounded-3xl p-8 max-w-md w-full text-center space-y-4 border border-slate-800 shadow-2xl text-white">
          <HelpCircle className="w-14 h-14 text-amber-400 mx-auto" />
          <h3 className="text-xl font-black">لا توجد أسئلة في هذا الاختبار بعد</h3>
          <p className="text-xs text-slate-400">يمكن للمسؤول إضافة أسئلة وصور وتوضيحات للاختبار من لوحة التحكم.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  const currentImg = getQuestionImageUrl(currentQuestion);

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-['Cairo',sans-serif] text-right select-none">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER - FULLSCREEN EXAM BAR                      */}
      {/* ======================================================== */}
      <header className="shrink-0 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md z-20">
        
        {/* Right side: Quiz title, section info & Close */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            id="close-quiz-btn"
            onClick={handleRequestClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="خروج من الاختبار"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-400">
              <span className="font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">
                {sectionTitle}
              </span>
              <span className="truncate max-w-[120px] sm:max-w-xs">• {resourceTitle}</span>
            </div>
            <h1 className="text-sm sm:text-lg font-black text-white truncate mt-0.5">
              {quiz.title}
            </h1>
          </div>
        </div>

        {/* Center / Left side: Tools (Whiteboard toggle, Timer, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {!hasChosenMode && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold">
              <span>🎯</span>
              <span>تحديد نمط الاختبار</span>
            </span>
          )}

          {/* Whiteboard toggle button (during active quiz) */}
          {hasChosenMode && !isFinished && (
            <button
              type="button"
              onClick={() => {
                setIsWhiteboardOpen((prev) => !prev);
                if (mobileTab === 'whiteboard') setMobileTab('question');
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border ${
                isWhiteboardOpen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
              }`}
              title="فتح أو إخفاء السبورة الإلكترونية"
            >
              <PenTool className="w-4 h-4 text-current" />
              <span className="hidden sm:inline">
                {isWhiteboardOpen ? 'إخفاء السبورة' : 'السبورة الذكية (مسودة)'}
              </span>
              <span className="sm:hidden">السبورة</span>
              {currentQuestion && drawingsPerQuestion[currentQuestion.id] && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              )}
            </button>
          )}

          {/* Timer Display or Free Practice Mode */}
          {hasChosenMode && !isFinished && (
            isTimedMode ? (
              <div className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-mono text-xs sm:text-sm font-bold border ${
                timeLeftSeconds < 120 
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800 animate-pulse' 
                  : 'bg-slate-850 text-slate-200 border-slate-700'
              }`}>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span>{timerFormatted}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                <span>♾️</span>
                <span className="hidden sm:inline">تدريب حر (بدون وقت)</span>
                <span className="sm:hidden">بدون وقت</span>
              </div>
            )
          )}

          {/* Fullscreen API Toggle */}
          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
            title={isNativeFullscreen ? 'إنهاء ملء الشاشة' : 'ملء الشاشة بالكامل'}
          >
            {isNativeFullscreen ? (
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            ) : (
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. QUESTION NAVIGATOR STRIP (DURING ACTIVE QUIZ)         */}
      {/* ======================================================== */}
      {hasChosenMode && !isFinished && (
        <div className="shrink-0 bg-slate-900 border-b border-slate-800/80 px-3 sm:px-6 py-2 flex items-center justify-between gap-3 overflow-x-auto select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-thin">
            {questions.map((q, idx) => {
              const isSelected = selectedAnswers[idx] !== undefined;
              const isCurrent = currentQuestionIdx === idx;
              const hasDrawing = Boolean(drawingsPerQuestion[q.id]);

              let pillStyle = 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white';
              if (isCurrent) {
                pillStyle = 'bg-emerald-600 text-white font-black ring-2 ring-emerald-400 border-emerald-500 scale-105';
              } else if (isSelected) {
                pillStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-bold';
              }

              return (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs flex items-center justify-center border transition-all cursor-pointer shrink-0 ${pillStyle}`}
                  title={`السؤال رقم ${idx + 1}`}
                >
                  <span>{idx + 1}</span>
                  {hasDrawing && !isCurrent && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] sm:text-xs text-slate-400 shrink-0 font-bold flex items-center gap-2">
            <span>تم الإجابة: <strong className="text-emerald-400">{Object.keys(selectedAnswers).length}</strong> / {totalQuestions}</span>
          </div>
        </div>
      )}

      {/* Mobile view switcher tab (shown on small screens if whiteboard is open) */}
      {hasChosenMode && !isFinished && isWhiteboardOpen && (
        <div className="lg:hidden shrink-0 flex items-center bg-slate-900 border-b border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMobileTab('question')}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'question' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            <span>السؤال والخيارات</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('whiteboard')}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'whiteboard' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>السبورة والمسودة ✍️</span>
            {drawingsPerQuestion[currentQuestion.id] && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN WORKSPACE AREA                                    */}
      {/* ======================================================== */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-6 w-full">
        {!hasChosenMode ? (
          /* ======================================================== */
          /* PRE-QUIZ MODE SELECTION (اختيار الاختبار بوقت أم بدون وقت) */
          /* ======================================================== */
          <div className="min-h-full flex items-center justify-center py-6 px-3">
            <div className="max-w-2xl w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-9 shadow-2xl text-center space-y-7 relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-black">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>منصة أقسام رعد • نظام الاختبارات</span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white">
                  {quiz.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  {quiz.description || 'اختر النمط المناسب لك للبدء في حل الأسئلة وقياس مستواك واستيعابك.'}
                </p>

                {/* Badges Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    <FileQuestion className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{totalQuestions} أسئلة</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>نسبة الاجتياز {quiz.passingScorePercentage || 60}%</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>الوقت القياسي: {quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} دقيقة` : '15 دقيقة'}</span>
                  </span>
                </div>
              </div>

              {/* Mode Selection Cards */}
              <div className="relative z-10 space-y-3.5">
                <h3 className="text-sm font-extrabold text-slate-200">
                  هل تريد أداء الاختبار بوقت محدد أم بدون وقت؟ 👇
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                  {/* Option 1: Timed Mode */}
                  <button
                    type="button"
                    id="choose-timed-mode-btn"
                    onClick={() => {
                      const limit = quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 15 * 60;
                      setTimeLeftSeconds(limit);
                      setIsTimedMode(true);
                      setStartTime(Date.now());
                      setHasChosenMode(true);
                    }}
                    className="group relative p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 hover:from-amber-950/40 hover:to-slate-900 border-2 border-slate-700 hover:border-amber-400/80 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between text-right"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                          <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                          موصى به
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-white group-hover:text-amber-300 transition-colors">
                          اختبار بوقت محدد ⏱️
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          محاكاة لاختبار قياس الحقيقي مع عداد تنازلي ({quiz.timeLimitMinutes > 0 ? `${quiz.timeLimitMinutes} دقيقة` : '15 دقيقة'}) لقياس سرعتك في الحل وإدارتك للوقت.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 group-hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm text-center transition-all shadow-md">
                      بدء الاختبار بوقت ⏱️
                    </div>
                  </button>

                  {/* Option 2: Untimed Mode */}
                  <button
                    type="button"
                    id="choose-untimed-mode-btn"
                    onClick={() => {
                      setIsTimedMode(false);
                      setStartTime(Date.now());
                      setHasChosenMode(true);
                    }}
                    className="group relative p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 hover:from-emerald-950/40 hover:to-slate-900 border-2 border-slate-700 hover:border-emerald-400/80 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between text-right"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl">
                          ♾️
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full">
                          تدريب حر
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                          تدريب بدون وقت ♾️
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          حل الأسئلة بأريحية كاملة وبدون أي استعجال أو عداد زمني، مع إمكانية استخدام السبورة الذكية والتفكير المتأني في كل سؤال.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 w-full py-2.5 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white font-black text-xs sm:text-sm text-center transition-all shadow-md">
                      بدء التدريب بدون وقت ♾️
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !isFinished ? (
          /* ACTIVE QUIZ QUESTION VIEW */
          <div className="h-full flex flex-col justify-between max-w-7xl mx-auto w-full">
            
            {/* Split layout: Question on one side, Whiteboard on the other */}
            <div className={`grid gap-4 sm:gap-6 items-stretch h-full ${
              isWhiteboardOpen ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1 max-w-3xl mx-auto w-full'
            }`}>
              
              {/* Question Column */}
              <div className={`space-y-4 flex flex-col justify-start overflow-y-auto ${
                isWhiteboardOpen ? (mobileTab === 'question' ? 'lg:col-span-6 block' : 'hidden lg:col-span-6 lg:block') : 'w-full'
              }`}>
                
                {/* Question Box */}
                <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-xs sm:text-sm font-black text-emerald-400 flex items-center gap-1.5">
                      <FileQuestion className="w-4 h-4" />
                      <span>السؤال {currentQuestionIdx + 1} من {totalQuestions}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {/* Save to my folders button */}
                      {currentUser && (
                        <button
                          type="button"
                          onClick={() => setFolderTargetQuestion(currentQuestion)}
                          className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/50 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          title="حفظ السؤال في مجلداتي للمراجعة والتدرب عليه لاحقاً"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">حفظ في مجلداتي</span>
                        </button>
                      )}

                      {selectedAnswers[currentQuestionIdx] !== undefined && (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span className="hidden sm:inline">تم تحديد إجابة</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  {currentQuestion.questionText?.trim() && (
                    <h2 className="text-base sm:text-xl font-black text-white leading-relaxed">
                      {currentQuestion.questionText}
                    </h2>
                  )}

                  {/* Question Image (geometry, equations, graphics - 100% permanent with zoom) */}
                  {currentImg && (
                    <div className="relative group mt-3">
                      <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 flex items-center justify-center p-2 sm:p-3 shadow-inner max-h-[360px]">
                        <img
                          src={currentImg}
                          alt="صورة السؤال"
                          className="max-h-[330px] w-auto object-contain rounded-xl transition-transform duration-200"
                          onError={(e) => {
                            // Fallback if URL had an issue, try permanent imageData
                            if ((currentQuestion as any).imageData && e.currentTarget.src !== (currentQuestion as any).imageData) {
                              e.currentTarget.src = (currentQuestion as any).imageData;
                            }
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageZoomUrl(currentImg)}
                        className="absolute bottom-3 left-3 bg-slate-900/90 hover:bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 backdrop-blur-md cursor-pointer border border-slate-700 shadow-lg"
                      >
                        <ZoomIn className="w-4 h-4 text-emerald-400" />
                        <span>تكبير الصورة</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  <span className="text-xs font-black text-slate-400 block px-1">
                    اختر الإجابة الصحيحة:
                  </span>

                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIdx] === optIdx;
                    const choiceLetters = ['أ', 'ب', 'ج', 'د', 'هـ'];
                    const choiceLettersEn = ['A', 'B', 'C', 'D', 'E'];

                    return (
                      <button
                        key={optIdx}
                        id={`option-choice-${optIdx}`}
                        type="button"
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-right p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-100 font-bold shadow-lg shadow-emerald-950/50'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm border shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            <span className="flex items-center gap-1">
                              <span>{choiceLetters[optIdx]}</span>
                              <span className="text-[10px] opacity-60">({choiceLettersEn[optIdx]})</span>
                            </span>
                          </span>
                          <span className="text-sm sm:text-base leading-relaxed">
                            {option || choiceLetters[optIdx]}
                          </span>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-600 bg-slate-800'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Whiteboard Column (Scratchpad for solving formulas & steps) */}
              {isWhiteboardOpen && (
                <div className={`h-[420px] sm:h-[520px] lg:h-full min-h-[380px] ${
                  mobileTab === 'whiteboard' ? 'lg:col-span-6 block' : 'hidden lg:col-span-6 lg:block'
                }`}>
                  <QuizWhiteboard
                    questionId={currentQuestion.id}
                    questionNumber={currentQuestionIdx + 1}
                    initialDrawingDataUrl={drawingsPerQuestion[currentQuestion.id]}
                    onSaveDrawing={handleSaveDrawing}
                    className="h-full"
                  />
                </div>
              )}

            </div>
          </div>
        ) : (
          /* COMPLETED / RESULTS & REVIEW VIEW */
          <div className="max-w-4xl mx-auto w-full space-y-6 py-4">
            
            {/* Score Card */}
            <div className={`rounded-3xl p-6 sm:p-8 text-center space-y-4 border shadow-2xl ${
              isPassed 
                ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-100' 
                : 'bg-rose-950/50 border-rose-800/80 text-rose-100'
            }`}>
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg ${
                isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {isPassed ? <Award className="w-10 h-10 sm:w-12 sm:h-12" /> : <XCircle className="w-10 h-10 sm:w-12 sm:h-12" />}
              </div>

              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {isPassed ? 'تهانينا! لقد اجتزت الاختبار بنجاح' : 'حظ أوفر، ننصحك بمراجعة الدرس وإعادة المحاولة'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  درجة النجاح المطلوبة: {quiz.passingScorePercentage}%
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto pt-2">
                <div className="bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-800 text-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 block mb-0.5">الدرجة النهائية</span>
                  <span className="text-lg sm:text-2xl font-black text-white">{score} / {totalQuestions}</span>
                </div>

                <div className="bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-800 text-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 block mb-0.5">النسبة المئوية</span>
                  <span className={`text-lg sm:text-2xl font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {percentage}%
                  </span>
                </div>

                <div className="bg-slate-900/90 rounded-2xl p-3 sm:p-4 border border-slate-800 text-center">
                  <span className="text-[10px] sm:text-xs text-slate-400 block mb-0.5">الوقت المستغرق</span>
                  <span className="text-sm sm:text-lg font-black text-indigo-400 truncate block">
                    {finishedTimeSpent.formatted || 'سريع'}
                  </span>
                </div>
              </div>

              {score < totalQuestions && (
                <div className="p-3 bg-rose-950/70 border border-rose-700/80 rounded-2xl text-xs text-rose-200 flex items-center justify-center gap-2 font-bold shadow-inner animate-in fade-in duration-200">
                  <span>📁 تم حفظ الأسئلة الخاطئة ({totalQuestions - score} أسئلة) تلقائياً في «مجلد أخطائي» بحسابك لتتمكن من إعادة التدرب عليها واختبار نفسك حتى تتقنها بالكامل!</span>
                </div>
              )}
            </div>

            {/* Detailed Questions Review */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>مراجعة الإجابات والحل النموذجي بالتفصيل:</span>
              </h3>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const studentChoice = selectedAnswers[idx];
                  const isCorrect = studentChoice === q.correctOptionIndex;
                  const choiceLetters = ['أ', 'ب', 'ج', 'د', 'هـ'];
                  const qImg = getQuestionImageUrl(q);

                  return (
                    <div
                      key={q.id || idx}
                      className={`p-4 sm:p-6 rounded-2xl border space-y-3.5 bg-slate-900/90 ${
                        isCorrect ? 'border-emerald-800/60 shadow-emerald-950/20' : 'border-rose-800/60 shadow-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            السؤال رقم {idx + 1}
                          </span>
                          {!isCorrect && (
                            <span className="text-[10px] bg-rose-950/90 text-rose-300 border border-rose-700/70 px-2 py-0.5 rounded-lg font-bold">
                              📁 نُقل تلقائياً إلى «مجلد أخطائي»
                            </span>
                          )}
                          {currentUser && (
                            <button
                              type="button"
                              onClick={() => setFolderTargetQuestion(q)}
                              className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/50 px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              title="حفظ السؤال في مجلداتي"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                              <span>حفظ في مجلداتي</span>
                            </button>
                          )}
                        </div>

                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                          isCorrect ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{isCorrect ? 'إجابة صحيحة (+1)' : 'إجابة خاطئة'}</span>
                        </span>
                      </div>

                      {q.questionText?.trim() && (
                        <p className="text-sm sm:text-base font-black text-white leading-relaxed">
                          {q.questionText}
                        </p>
                      )}

                      {/* Question image in review view */}
                      {qImg && (
                        <div className="space-y-1 max-w-md">
                          <div className="rounded-xl border border-slate-700 bg-slate-950 p-2 flex items-center justify-center">
                            <img src={qImg} alt="صورة السؤال" className="max-h-56 object-contain mx-auto rounded-lg" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setImageZoomUrl(qImg)}
                            className="text-[11px] text-slate-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تكبير الصورة</span>
                          </button>
                        </div>
                      )}

                      {/* Choices breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isThisCorrect = optIdx === q.correctOptionIndex;
                          const isStudentPick = optIdx === studentChoice;

                          let optStyle = 'bg-slate-800/70 border-slate-700 text-slate-300';
                          if (isThisCorrect) {
                            optStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-100 font-bold';
                          } else if (isStudentPick && !isThisCorrect) {
                            optStyle = 'bg-rose-950/90 border-rose-500 text-rose-200 line-through';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`text-xs p-3 rounded-xl border flex items-center justify-between gap-2 ${optStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
                                  {choiceLetters[optIdx]}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isThisCorrect && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">
                                  الصحيحة ✓
                                </span>
                              )}
                              {isStudentPick && !isThisCorrect && (
                                <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-black">
                                  إجابتك ✕
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Box */}
                      {q.explanation && (
                        <div className="bg-slate-850 rounded-xl p-3.5 border border-slate-700 text-xs text-slate-300 space-y-1">
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            طريقة الحل والشرح النموذجي:
                          </span>
                          <p className="leading-relaxed text-slate-200">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 4. BOTTOM NAVIGATION FOOTER                              */}
      {/* ======================================================== */}
      <footer className="shrink-0 p-3 sm:px-6 sm:py-3.5 border-t border-slate-800 bg-slate-900/95 backdrop-blur-md z-20 flex items-center justify-between gap-2.5">
        {!isFinished ? (
          <>
            {/* Previous Button */}
            <button
              id="prev-question-btn"
              onClick={handlePrev}
              disabled={currentQuestionIdx === 0}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black border transition-colors cursor-pointer shrink-0 ${
                currentQuestionIdx === 0
                  ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-800'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-white border-slate-700'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            {/* Center: Whiteboard button shortcut on footer */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsWhiteboardOpen((prev) => !prev);
                  if (mobileTab === 'whiteboard') setMobileTab('question');
                }}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isWhiteboardOpen ? 'bg-blue-950/80 text-blue-300 border-blue-700' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>مسودة الحل للـسؤال ({currentQuestionIdx + 1})</span>
              </button>
            </div>

            {/* Next / Finish Button */}
            <div className="flex items-center gap-2">
              {currentQuestionIdx < totalQuestions - 1 ? (
                <button
                  id="next-question-btn"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/25 transition-all cursor-pointer"
                >
                  <span>التالي</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="finish-quiz-btn"
                  onClick={handleFinishQuiz}
                  className="flex items-center gap-1.5 px-5 sm:px-7 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إنهاء وتصحيح الاختبار</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between gap-3">
            <button
              id="retake-quiz-btn"
              onClick={handleRestart}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة الاختبار</span>
            </button>

            <button
              id="finish-review-btn"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                onClose();
              }}
              className="flex items-center gap-1.5 px-6 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-700/25 transition-all cursor-pointer"
            >
              <span>العودة للمنصة والمصدر</span>
            </button>
          </div>
        )}
      </footer>

      {/* ======================================================== */}
      {/* 5. IMAGE ZOOM OVERLAY                                    */}
      {/* ======================================================== */}
      {imageZoomUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
          onClick={() => setImageZoomUrl(null)}
        >
          <div className="relative max-w-5xl w-full flex flex-col items-center">
            <button
              onClick={() => setImageZoomUrl(null)}
              className="self-start mb-3 text-white text-xs sm:text-sm bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
            >
              <X className="w-4 h-4" />
              <span>إغلاق صورة السؤال</span>
            </button>
            <div className="bg-slate-900 rounded-2xl p-2 border border-slate-700 max-h-[85vh] overflow-hidden flex items-center justify-center">
              <img 
                src={imageZoomUrl} 
                alt="صورة السؤال بدقة كاملة" 
                className="w-full max-h-[80vh] object-contain rounded-xl" 
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. EXIT CONFIRMATION DIALOG                              */}
      {/* ======================================================== */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">هل تريد الخروج من الاختبار؟</h3>
            <p className="text-xs text-slate-300">
              لديك إجابات قيد الحل حالياً، الخروج الآن سيؤدي لعدم احتساب النتيجة.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                متابعة الاختبار
              </button>
              <button
                onClick={() => {
                  setShowExitConfirm(false);
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                تأكيد الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add To Folder Modal */}
      {folderTargetQuestion && currentUser && (
        <AddToFolderModal
          question={folderTargetQuestion}
          meta={{
            quizId: quiz.id,
            quizTitle: quiz.title,
            sectionTitle,
          }}
          currentUser={currentUser}
          onUpdateUser={(updated) => {
            if (onUpdateUser) onUpdateUser(updated);
          }}
          onClose={() => setFolderTargetQuestion(null)}
          onShowToast={onShowToast}
        />
      )}

    </div>
  );
};
