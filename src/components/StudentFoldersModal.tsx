import React, { useState } from 'react';
import { QuestionFolder, SavedQuestionItem, StudentUser, Quiz } from '../types';
import { apiService } from '../services/api';
import { 
  X, 
  Folder, 
  FolderPlus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  Plus, 
  ChevronLeft, 
  ArrowRight,
  ZoomIn,
  BookOpen,
  Award,
  Layers,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface StudentFoldersModalProps {
  currentUser: StudentUser;
  onUpdateUser: (user: StudentUser) => void;
  onClose: () => void;
  onStartQuiz: (quiz: Quiz) => void;
  onShowToast?: (msg: string) => void;
}

export const StudentFoldersModal: React.FC<StudentFoldersModalProps> = ({
  currentUser,
  onUpdateUser,
  onClose,
  onStartQuiz,
  onShowToast,
}) => {
  const folders: QuestionFolder[] = currentUser.progress?.questionFolders || [];

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('emerald');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmFolderId, setDeleteConfirmFolderId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const activeFolder = activeFolderId ? folders.find((f) => f.id === activeFolderId) : null;

  const colorVariants: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', badge: 'bg-blue-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', badge: 'bg-purple-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', badge: 'bg-rose-500' },
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    try {
      const { user: updatedUser } = await apiService.createQuestionFolder(trimmed, selectedColor);
      if (updatedUser) {
        onUpdateUser(updatedUser);
      }
      setNewFolderName('');
      setShowCreateDialog(false);
      if (onShowToast) onShowToast(`📁 تم إنشاء مجلد "${trimmed}" بنجاح!`);
    } catch (err) {
      console.warn('Folder creation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    setIsProcessing(true);
    try {
      const updatedUser = await apiService.deleteQuestionFolder(folderId);
      if (updatedUser) {
        onUpdateUser(updatedUser);
      }
      if (activeFolderId === folderId) {
        setActiveFolderId(null);
      }
      setDeleteConfirmFolderId(null);
      if (onShowToast) onShowToast('تم حذف المجلد بنجاح');
    } catch (err) {
      console.warn('Folder deletion error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveQuestion = async (folderId: string, questionId: string) => {
    try {
      const updatedUser = await apiService.removeQuestionFromFolder(folderId, questionId);
      if (updatedUser) {
        onUpdateUser(updatedUser);
      }
      if (onShowToast) onShowToast('تم حذف السؤال من المجلد');
    } catch (err) {
      console.warn('Remove question error:', err);
    }
  };

  const handleStartFolderQuiz = (folder: QuestionFolder) => {
    const questions = folder.questions || [];
    if (questions.length === 0) {
      if (onShowToast) onShowToast('المجلد لا يحتوي على أي أسئلة للاختبار');
      return;
    }

    // Synthesize a full Quiz object from the questions in the folder
    const customQuiz: Quiz = {
      id: `folder-quiz-${folder.id}`,
      title: `اختبار تدريبي: ${folder.name}`,
      description: `اختبار مخصص مبني على الأسئلة المحفوظة في مجلد (${folder.name}) - عدد الأسئلة: ${questions.length}`,
      resourceId: 'folder-custom-resource',
      sectionId: 'folder-custom-section',
      timeLimitMinutes: Math.max(5, Math.ceil(questions.length * 1.5)), // 1.5 minutes per question
      passingScorePercentage: 60,
      questions: questions.map((q, idx) => ({
        id: q.id || `fq-${idx}`,
        questionText: q.questionText,
        imageUrl: q.imageUrl,
        imageData: q.imageData,
        options: q.options && q.options.length > 0 ? q.options : ['أ', 'ب', 'ج', 'د'],
        correctOptionIndex: q.correctOptionIndex ?? 0,
        explanation: q.explanation,
      })),
      createdAt: new Date().toISOString(),
    };

    onClose();
    onStartQuiz(customQuiz);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-3 sm:p-6 text-right overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-850/95">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>بنك الأسئلة المخصص</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">مجلداتي (مستودع الأسئلة)</h2>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <Folder className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Subheader / Action Bar if inside folder */}
          {activeFolder ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setActiveFolderId(null)}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white bg-slate-700/80 hover:bg-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لجميع المجلدات</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Delete folder */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmFolderId(activeFolder.id)}
                    className="p-2 rounded-xl text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 border border-rose-900/40 transition-colors cursor-pointer"
                    title="حذف هذا المجلد بالكامل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Start Quiz on Folder Button */}
                  <button
                    type="button"
                    onClick={() => handleStartFolderQuiz(activeFolder)}
                    disabled={(activeFolder.questions || []).length === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>🎯 بدء اختبار على هذا المجلد ({activeFolder.questions?.length || 0} أسئلة)</span>
                  </button>
                </div>
              </div>

              {/* Folder Title & Stats */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    <span>{activeFolder.name}</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    تم الإنشاء: {new Date(activeFolder.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="bg-slate-800 px-3 py-1 rounded-xl text-xs font-bold text-emerald-400 border border-slate-700">
                  {activeFolder.questions?.length || 0} سؤال محفوظ
                </div>
              </div>

              {/* Questions inside active folder */}
              {(activeFolder.questions || []).length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-slate-700 rounded-3xl bg-slate-800/30 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-200">لا توجد أسئلة في هذا المجلد بعد</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    أثناء خوض أي اختبار في المنصة أو عند مراجعة نتائجك، اضغط على زر «📁 حفظ في مجلداتي» لإضافة أي سؤال ترغب بتكرار التدرب عليه هنا!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeFolder.questions.map((q, idx) => (
                    <div 
                      key={q.id || idx}
                      className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md transition-all hover:border-slate-650"
                    >
                      <div className="flex items-center justify-between border-b border-slate-700/70 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          {q.sourceQuizTitle && (
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                              {q.sourceQuizTitle}
                            </span>
                          )}
                        </div>

                        {/* Remove question from folder */}
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(activeFolder.id, q.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف من المجلد</span>
                        </button>
                      </div>

                      {/* Question Text */}
                      <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Image if available */}
                      {(q.imageUrl || q.imageData) && (
                        <div className="relative group max-w-md">
                          <img
                            src={q.imageUrl || q.imageData}
                            alt="صورة السؤال"
                            className="max-h-48 rounded-xl border border-slate-700 object-contain bg-slate-950 p-1"
                          />
                          <button
                            type="button"
                            onClick={() => setZoomedImage(q.imageUrl || q.imageData || null)}
                            className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 border border-slate-700 cursor-pointer"
                          >
                            <ZoomIn className="w-3 h-3 text-emerald-400" />
                            <span>تكبير</span>
                          </button>
                        </div>
                      )}

                      {/* Multiple choice options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === q.correctOptionIndex;
                          const letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-950/70 border-emerald-500/70 text-emerald-200 font-bold'
                                  : 'bg-slate-900/60 border-slate-700/60 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {letters[optIdx]}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-bold">
                                  الإجابة الصحيحة
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Model explanation if present */}
                      {q.explanation && (
                        <div className="p-3 bg-slate-900/80 border border-slate-700/70 rounded-xl text-xs space-y-1">
                          <span className="font-bold text-amber-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>الحل النموذجي والشرح:</span>
                          </span>
                          <p className="text-slate-300 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ALL FOLDERS VIEW */
            <div className="space-y-6">
              
              {/* Top Banner & Quick Creator */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/40">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">مستودع مجلداتك التعليمية</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    أنشئ مجلدات مخصصة بأسماء ترغب بها (مثل: تجميعات الكمي، مسائل التناظر الصعبة، الهندسة)، واحفظ أي سؤال فيها لاختبار نفسك عليه لاحقاً.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ إنشاء مجلد جديد</span>
                </button>
              </div>

              {/* Create Folder Inline Form / Dialog */}
              {showCreateDialog && (
                <form 
                  onSubmit={handleCreateFolder}
                  className="p-4 sm:p-5 bg-slate-800/90 border border-emerald-500/60 rounded-3xl space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>إنشاء مجلد أسئلة جديد</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateDialog(false)}
                      className="text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      اسم المجلد:
                    </label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="مثال: أسئلة الكسور المعقدة، تجميعات 1445، أخطائي المتكررة..."
                      autoFocus
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden focus:border-emerald-500 text-right"
                    />
                  </div>

                  {/* Color Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      اختر لون تمييز المجلد:
                    </label>
                    <div className="flex items-center gap-2">
                      {Object.keys(colorVariants).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`w-7 h-7 rounded-xl ${colorVariants[col].badge} transition-transform cursor-pointer ${
                            selectedColor === col ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateDialog(false)}
                      className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={!newFolderName.trim() || isProcessing}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isProcessing ? 'جاري الإنشاء...' : 'إنشاء المجلد'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Folders Grid */}
              {folders.length === 0 ? (
                <div className="text-center py-16 px-4 border border-dashed border-slate-700 rounded-3xl bg-slate-800/30 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <Folder className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base sm:text-lg font-bold text-white">لا توجد مجلدات حالياً</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      ابدأ بإنشاء مجلدك الأول الآن لتقوم بتجميع الأسئلة التي ترغب بإعادة حلها واختبار مهاراتك فيها.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء أول مجلد الآن</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {folders.map((folder) => {
                    const count = (folder.questions || []).length;
                    const variant = colorVariants[folder.color || 'emerald'] || colorVariants.emerald;

                    return (
                      <div
                        key={folder.id}
                        className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4 transition-all hover:border-slate-600 hover:shadow-xl group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(folder.createdAt).toLocaleDateString('ar-SA')}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmFolderId(folder.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors cursor-pointer"
                                title="حذف المجلد"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className={`w-8 h-8 rounded-xl ${variant.bg} ${variant.text} flex items-center justify-center shrink-0`}>
                                <Folder className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                              {folder.name}
                            </h4>
                            <span className="text-xs text-slate-400 font-bold block mt-1">
                              {count} {count === 1 ? 'سؤال محفوظ' : count === 2 ? 'سؤالان' : count <= 10 ? 'أسئلة محفوظة' : 'سؤالاً محفوظاً'}
                            </span>
                          </div>
                        </div>

                        {/* Folder Action Buttons */}
                        <div className="pt-2 border-t border-slate-700/60 flex items-center gap-2">
                          {/* Open Questions View */}
                          <button
                            type="button"
                            onClick={() => setActiveFolderId(folder.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>عرض الأسئلة</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Quiz on Folder */}
                          <button
                            type="button"
                            onClick={() => handleStartFolderQuiz(folder)}
                            disabled={count === 0}
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="اختبار على هذا المجلد"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>اختبار</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            إجمالي المجلدات: <strong className="text-white">{folders.length}</strong> • إجمالي الأسئلة: <strong className="text-emerald-400">{folders.reduce((acc, f) => acc + (f.questions?.length || 0), 0)}</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>

      {/* Delete Folder Confirmation Dialog */}
      {deleteConfirmFolderId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-3xl p-5 max-w-sm w-full text-right space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-white">هل أنت متأكد من حذف المجلد؟</h4>
              <p className="text-xs text-slate-300">
                سيتم حذف المجلد وكافة الأسئلة المرتبطة به نهائياً. لن يتأثر محتوى الاختبارات الأصلية في المنصة.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmFolderId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder(deleteConfirmFolderId)}
                disabled={isProcessing}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                {isProcessing ? 'جاري الحذف...' : 'نعم، احذف المجلد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="صورة السؤال مكبرة"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute top-2 left-2 bg-slate-900/90 text-white p-2 rounded-xl border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
