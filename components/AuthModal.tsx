
import React from 'react';
import { Auth } from './Auth';

interface AuthModalProps {
  onClose: () => void;
  onShowLegal: (page: 'terms' | 'privacy' | 'disclaimer') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onShowLegal }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6 animate-in zoom-in fade-in duration-300">
      <div className="relative w-full max-w-md">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-400 hover:text-slate-900 z-10"
        >
          ✕
        </button>
        <Auth onShowLegal={onShowLegal} />
      </div>
    </div>
  );
};
