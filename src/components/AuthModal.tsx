import React, { useEffect } from 'react';
import { StudentUser } from '../types';
import { RaedAuthCard } from './RaedAuthCard';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: StudentUser) => void;
  promptMessage?: string | null;
  initialMode?: 'login' | 'register';
  onOpenAdmin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  promptMessage,
  initialMode = 'login',
  onOpenAdmin,
}) => {
  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تسجيل الدخول - منصة أقسام رعد"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative z-10 w-full max-w-2xl my-auto">
        <RaedAuthCard
          onSuccess={onSuccess}
          onClose={onClose}
          initialMode={initialMode}
          promptMessage={promptMessage}
          onOpenAdmin={onOpenAdmin}
        />
      </div>
    </div>
  );
};
