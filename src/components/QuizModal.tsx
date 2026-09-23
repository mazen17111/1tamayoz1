import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt } from '../types';
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
  ZoomIn
} from 'lucide-react';

interface QuizModalProps {
  quiz: Quiz;
  sectionTitle: string;
  resourceTitle: string;
  onClose: () => void;
  onComplete: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  quiz,
  sectionTitle,
  resourceTitle,
  onClose,
  onComplete,
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [finishedTimeSpent, setFinishedTimeSpent] = useState<{ seconds: number; formatted: string }>({
    seconds: 0,
    formatted: '',
  });
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(
    quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 0
  );
  const [imageZoomUrl, setImageZoomUrl] = useState<string | null>(null);

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

  // Timer countdown
  useEffect(() => {
    if (isFinished || quiz.timeLimitMinutes <= 0) return;

    if (timeLeftSeconds <= 0) {
      // Auto submit when time expires
      handleFinishQuiz();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, isFinished, quiz.timeLimitMinutes]);

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
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

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
      };
    });

    setIsFinished(true);

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
    setStartTime(Date.now());
    setFinishedTimeSpent({ seconds: 0, formatted: '' });
    setTimeLeftSeconds(quiz.timeLimitMinutes > 0 ? quiz.timeLimitMinutes * 60 : 0);
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

  if (totalQuestions === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full text-center space-y-4 border border-slate-200 dark:border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد أسئلة في هذا الاختبار بعد</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">يمكن للمسؤول إضافة أسئلة وخيارات من لوحة التحكم.</p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              id="close-quiz-btn"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 rounded">
                  {sectionTitle}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400">• {resourceTitle}</span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {quiz.title}
              </h2>
            </div>
          </div>

          {/* Time & Progress Info */}
          {!isFinished && quiz.timeLimitMinutes > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border shrink-0 ${
              timeLeftSeconds < 120 
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900 animate-pulse' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              <span>{timerFormatted}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-8 overflow-y-auto flex-1 space-y-5 sm:space-y-6">
          {!isFinished ? (
            /* ACTIVE QUIZ QUESTIONS VIEW */
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>السؤال {currentQuestionIdx + 1} من {totalQuestions}</span>
                  <span>تمت الإجابة على {Object.keys(selectedAnswers).length} من {totalQuestions}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIdx + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Box */}
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800">
                  {currentQuestion.questionText?.trim() && (
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed mb-3">
                      {currentQuestion.questionText}
                    </h3>
                  )}

                  {/* Question Image (Displays geometry, equations, exponents, graphics with full clarity) */}
                  {currentQuestion.imageUrl && (
                    <div className="relative group">
                      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 max-h-96 flex items-center justify-center p-2 sm:p-4 shadow-xs">
                        <img
                          src={currentQuestion.imageUrl}
                          alt="صورة السؤال"
                          className="max-h-88 object-contain rounded-lg transition-transform duration-200"
                        />
                      </div>
                      <button
                        onClick={() => setImageZoomUrl(currentQuestion.imageUrl!)}
                        className="absolute bottom-3 left-3 bg-slate-900/85 hover:bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 backdrop-blur-xs cursor-pointer shadow-md"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>تكبير الصورة</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">
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
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-right p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 ring-2 ring-emerald-600/20 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                          }`}>
                            <span className="flex items-center gap-1 text-xs">
                              <span>{choiceLetters[optIdx]}</span>
                              <span className="text-[10px] opacity-70">({choiceLettersEn[optIdx]})</span>
                            </span>
                          </span>
                          <span className="text-sm sm:text-base">{option || choiceLetters[optIdx]}</span>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* COMPLETED / RESULTS & REVIEW VIEW */
            <div className="space-y-8">
              {/* Score Card */}
              <div className={`rounded-3xl p-6 sm:p-8 text-center space-y-3 border ${
                isPassed 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-md ${
                  isPassed ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white'
                }`}>
                  {isPassed ? <Award className="w-9 h-9" /> : <XCircle className="w-9 h-9" />}
                </div>

                <h3 className="text-2xl font-black">
                  {isPassed ? 'تهانينا! لقد اجتزت الاختبار بنجاح' : 'حظ أوفر، ننصحك بمراجعة الدرس وإعادة الاختبار'}
                </h3>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
                  <div className="bg-white/90 backdrop-blur-xs rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 border border-slate-200 text-slate-800 flex-1 min-w-[95px] sm:min-w-[120px]">
                    <span className="text-[11px] sm:text-xs text-slate-500 block mb-0.5">الدرجة النهائية</span>
                    <span className="text-xl sm:text-3xl font-black text-slate-900">{score} / {totalQuestions}</span>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xs rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 border border-slate-200 text-slate-800 flex-1 min-w-[95px] sm:min-w-[120px]">
                    <span className="text-[11px] sm:text-xs text-slate-500 block mb-0.5">النسبة المئوية</span>
                    <span className={`text-xl sm:text-3xl font-black ${isPassed ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {percentage}%
                    </span>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xs rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 border border-slate-200 text-slate-800 w-full sm:w-auto min-w-[130px]">
                    <span className="text-[11px] sm:text-xs text-slate-500 flex items-center justify-center gap-1 mb-0.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>الوقت المستغرق</span>
                    </span>
                    <span className="text-base sm:text-xl font-black text-indigo-700">
                      {finishedTimeSpent.formatted || formatArabicDuration(Math.max(1, Math.round((Date.now() - startTime) / 1000)))}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 pt-1">
                  تم حفظ هذه النتيجة والدرجة والوقت المستغرق بنجاح في إحصائياتك وسجلك التعليمي. راجع أدناه حلول وشروحات الأسئلة بالتفصيل.
                </p>
              </div>

              {/* Detailed Questions Review */}
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>مراجعة الإجابات وشرح الحلول:</span>
                </h4>

                <div className="space-y-5">
                  {questions.map((q, idx) => {
                    const studentChoice = selectedAnswers[idx];
                    const isCorrect = studentChoice === q.correctOptionIndex;
                    const choiceLetters = ['أ', 'ب', 'ج', 'د', 'هـ'];

                    return (
                      <div
                        key={q.id}
                        className={`p-4 sm:p-5 rounded-2xl border ${
                          isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                        } space-y-3`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500">
                            السؤال رقم {idx + 1}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{isCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}</span>
                          </span>
                        </div>

                        {q.questionText?.trim() && (
                          <p className="text-sm sm:text-base font-bold text-slate-800">
                            {q.questionText}
                          </p>
                        )}

                        {q.imageUrl && (
                          <div className="space-y-1 max-w-md">
                            <div className="rounded-xl border border-slate-200 bg-white p-2.5 flex items-center justify-center">
                              <img src={q.imageUrl} alt="صورة السؤال" className="max-h-56 object-contain mx-auto rounded" />
                            </div>
                            <button
                              type="button"
                              onClick={() => setImageZoomUrl(q.imageUrl!)}
                              className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>تكبير صورة السؤال</span>
                            </button>
                          </div>
                        )}

                        {/* Options breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isThisCorrect = optIdx === q.correctOptionIndex;
                            const isStudentPick = optIdx === studentChoice;

                            let optStyle = 'bg-white border-slate-200 text-slate-700';
                            if (isThisCorrect) {
                              optStyle = 'bg-emerald-100/80 border-emerald-400 text-emerald-950 font-bold';
                            } else if (isStudentPick && !isThisCorrect) {
                              optStyle = 'bg-rose-100/80 border-rose-400 text-rose-950 line-through';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`text-xs p-3 rounded-xl border flex items-center justify-between gap-2 ${optStyle}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                                    {choiceLetters[optIdx]}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                                {isThisCorrect && (
                                  <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded">
                                    الصحيحة
                                  </span>
                                )}
                                {isStudentPick && !isThisCorrect && (
                                  <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                    إجابتك
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {q.explanation && (
                          <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1">
                            <span className="font-bold text-emerald-800 block flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              طريقة الحل والشرح:
                            </span>
                            <p className="leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-3.5 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-2.5 sm:gap-3">
          {!isFinished ? (
            <>
              <button
                id="prev-question-btn"
                onClick={handlePrev}
                disabled={currentQuestionIdx === 0}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer shrink-0 ${
                  currentQuestionIdx === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>

              <div className="flex items-center gap-2">
                {currentQuestionIdx < totalQuestions - 1 ? (
                  <button
                    id="next-question-btn"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <span>التالي</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="finish-quiz-btn"
                    onClick={handleFinishQuiz}
                    className="flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إنهاء وتصحيح الاختبار</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2.5 sm:gap-3">
              <button
                id="retake-quiz-btn"
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة الاختبار</span>
              </button>

              <button
                id="finish-review-btn"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>العودة للمصدر التعليمي</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Image zoom popup */}
      {imageZoomUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageZoomUrl(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setImageZoomUrl(null)}
              className="absolute -top-12 left-0 text-white text-sm bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>إغلاق الصورة</span>
            </button>
            <img src={imageZoomUrl} alt="صورة مكبرة" className="w-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};
