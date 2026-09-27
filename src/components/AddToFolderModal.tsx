import React, { useState } from 'react';
import { Question, QuestionFolder, StudentUser } from '../types';
import { apiService } from '../services/api';
import { 
  X, 
  FolderPlus, 
  Folder, 
  Check, 
  Plus, 
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';

interface AddToFolderModalProps {
  question: Question;
  meta?: {
    quizId?: string;
    quizTitle?: string;
    sectionTitle?: string;
  };
  currentUser: StudentUser | null;
  onUpdateUser: (updatedUser: StudentUser) => void;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const AddToFolderModal: React.FC<AddToFolderModalProps> = ({
  question,
  meta,
  currentUser,
  onUpdateUser,
  onClose,
  onShowToast,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('emerald');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  if (!currentUser) return null;

  const folders: QuestionFolder[] = currentUser.progress?.questionFolders || [];

  const colorOptions = [
    { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-500' },
    { id: 'purple', bg: 'bg-purple-500', border: 'border-purple-500' },
    { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-500' },
    { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-500' },
  ];

  const handleToggleQuestionInFolder = async (folder: QuestionFolder) => {
    setActionLoadingId(folder.id);
    const hasQuestion = (folder.questions || []).some((q) => q.id === question.id);

    try {
      let updatedUser: StudentUser | null = null;
      if (hasQuestion) {
        // Remove from folder
        updatedUser = await apiService.removeQuestionFromFolder(folder.id, question.id);
        if (onShowToast) onShowToast(`تمت إزالة السؤال من مجلد "${folder.name}"`);
      } else {
        // Add to folder
        updatedUser = await apiService.addQuestionToFolder(folder.id, question, meta);
        if (onShowToast) onShowToast(`⭐ تمت إضافة السؤال إلى مجلد "${folder.name}" بنجاح!`);
      }
      if (updatedUser) {
        onUpdateUser(updatedUser);
      }
    } catch (err) {
      console.warn('Folder toggle error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      // 1. Create folder
      const { folder, user: userAfterCreate } = await apiService.createQuestionFolder(trimmed, selectedColor);
      let activeUser = userAfterCreate || currentUser;
      if (userAfterCreate) {
        onUpdateUser(userAfterCreate);
      }

      // 2. Add question to newly created folder
      const finalUser = await apiService.addQuestionToFolder(folder.id, question, meta);
      if (finalUser) {
        onUpdateUser(finalUser);
      }

      setNewFolderName('');
      setShowCreateInput(false);
      if (onShowToast) onShowToast(`📁 تم إنشاء مجلد "${trimmed}" وإضافة السؤال إليه!`);
    } catch (err) {
      console.warn('Create and add error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 text-right">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-850/90">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-base font-black text-white">إضافة السؤال إلى مجلداتي</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Question Snippet Preview */}
        <div className="p-3 sm:p-4 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300">
          <span className="text-[11px] font-bold text-emerald-400 block mb-1">السؤال المحدد:</span>
          <p className="line-clamp-2 font-medium text-slate-200 leading-relaxed">
            {question.questionText || 'سؤال يتضمن معادلة أو شكلاً بيانياً'}
          </p>
          {meta?.quizTitle && (
            <span className="text-[10px] text-slate-400 mt-1 block">
              من: {meta.quizTitle}
            </span>
          )}
        </div>

        {/* Folders List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-slate-300">اختر المجلد المطلوب:</span>
            {!showCreateInput && (
              <button
                type="button"
                onClick={() => setShowCreateInput(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إنشاء مجلد جديد</span>
              </button>
            )}
          </div>

          {/* New Folder Inline Form */}
          {showCreateInput && (
            <form onSubmit={handleCreateAndAdd} className="p-3 bg-slate-800/90 border border-emerald-500/50 rounded-2xl space-y-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مجلد جديد</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateInput(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="اسم المجلد (مثال: أخطائي في الهندسة، تجميعات مهمة)..."
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:border-emerald-500 text-right"
              />

              {/* Color picker */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {colorOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-5 h-5 rounded-full ${c.bg} transition-transform cursor-pointer ${
                        selectedColor === c.id ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newFolderName.trim() || isCreating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'جاري الإنشاء...' : 'إنشاء وحفظ'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Existing Folders */}
          {folders.length === 0 && !showCreateInput ? (
            <div className="text-center py-6 px-4 border border-dashed border-slate-700/80 rounded-2xl bg-slate-800/30 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Folder className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-300">ليس لديك أي مجلدات بعد</p>
                <p className="text-xs text-slate-400 mt-0.5">أنشئ مجلدك الأول لحفظ أسئلتك المفضلة والتدرب عليها في أي وقت</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateInput(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء أول مجلد الآن</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map((folder) => {
                const isInside = (folder.questions || []).some((q) => q.id === question.id);
                const isLoading = actionLoadingId === folder.id;

                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleToggleQuestionInFolder(folder)}
                    disabled={isLoading}
                    className={`w-full text-right p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isInside
                        ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'
                        : 'bg-slate-800/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isInside ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        <Folder className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{folder.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          {folder.questions?.length || 0} أسئلة محفوظة
                        </span>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      isInside
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : 'border-slate-600 bg-slate-900/60 text-transparent'
                    }`}>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-850/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            يمكنك دائماً مراجعة مجلداتك والاختبار عليها من حسابك أو من القائمة
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
