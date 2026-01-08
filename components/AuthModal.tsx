
import React from 'react';
import { Auth } from './Auth';

interface AuthModalProps {
  onClose: () => void;
  onShowLegal: (page: 'terms' | 'privacy' | 'disclaimer') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onShowLegal }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm animate-in zoom-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-slate-400 hover:text-slate-900 z-[310] border border-slate-100 transition-all hover:scale-110"
        >
          ✕
        </button>
        <Auth onShowLegal={onShowLegal} />
      </div>
    </div>
  );
};
