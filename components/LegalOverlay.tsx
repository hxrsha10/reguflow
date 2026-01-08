
import React from 'react';
import { LEGAL_PAGES } from '../constants/LegalContent';

interface LegalOverlayProps {
  page: 'terms' | 'privacy' | 'disclaimer';
  onClose: () => void;
}

export const LegalOverlay: React.FC<LegalOverlayProps> = ({ page, onClose }) => {
  const content = LEGAL_PAGES[page];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300">
        <div className="gradient-bg p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
          <h2 className="text-3xl font-black tracking-tight">{content.title}</h2>
          <p className="text-white/70 text-sm font-bold mt-1 uppercase tracking-widest">Last Updated: {content.updated}</p>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto bg-slate-50">
          <div className="prose prose-slate max-w-none">
            {content.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-4 text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end bg-white">
          <button 
            onClick={onClose}
            className="bg-slate-900 text-white font-bold py-3 px-8 rounded-2xl hover:bg-slate-800 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
