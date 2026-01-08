
import React from 'react';
import { UserTier } from '../types';

interface SubscriptionModalProps {
  onClose: () => void;
  onUpgrade: (tier: UserTier) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 p-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 h-full">
          
          {/* FREE TIER */}
          <div className="p-8 flex flex-col h-full bg-slate-50/50">
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Basic</span>
              <h3 className="text-2xl font-black text-slate-900">Free</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Foundational business logic.</p>
            </div>
            <div className="flex-grow space-y-4 mb-10">
              {['Unlimited Generations', 'Indian Regulatory Grid', 'Multi-modal Camera Input', 'Standard Response Speed'].map((f, i) => (
                <div key={i} className="flex items-start gap-3 text-xs font-bold text-slate-600">
                  <span className="text-emerald-500">✓</span> {f}
                </div>
              ))}
            </div>
            <button 
              onClick={onClose}
              className="w-full py-4 border-2 border-slate-200 text-slate-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Current Plan
            </button>
          </div>

          {/* PRO TIER */}
          <div className="p-8 flex flex-col h-full bg-white relative shadow-xl z-10 scale-105 border border-slate-100 rounded-3xl">
            <div className="absolute top-4 right-4 bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Popular</div>
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1d70b8]">Scaling</span>
              <h3 className="text-2xl font-black text-slate-900">Pro</h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black">₹499</span>
                <span className="text-xs text-slate-400">/mo</span>
              </div>
            </div>
            <div className="flex-grow space-y-4 mb-10">
              {['Everything in Free', 'Google Search Grounding', 'Permanent Vault Storage', 'Priority AI Reasoning', 'Verified CA Network Access'].map((f, i) => (
                <div key={i} className="flex items-start gap-3 text-xs font-bold text-slate-700">
                  <span className="text-[#1d70b8]">✓</span> {f}
                </div>
              ))}
            </div>
            <button 
              onClick={() => onUpgrade(UserTier.PRO)}
              className="w-full py-4 gradient-bg text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Get Started
            </button>
          </div>

          {/* PREMIUM TIER */}
          <div className="p-8 flex flex-col h-full bg-slate-900 text-white">
            <div className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Enterprise</span>
              <h3 className="text-2xl font-black">Premium</h3>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black">₹999</span>
                <span className="text-xs opacity-40">/mo</span>
              </div>
            </div>
            <div className="flex-grow space-y-4 mb-10">
              {['Everything in Pro', 'Multi-State Law Comparison', 'Section-wise Audit Details', 'Direct Compliance Channel', '24/7 Priority Shield'].map((f, i) => (
                <div key={i} className="flex items-start gap-3 text-xs font-bold opacity-80">
                  <span className="text-[#1d70b8]">✓</span> {f}
                </div>
              ))}
            </div>
            <button 
              onClick={() => onUpgrade(UserTier.PREMIUM)}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Go Premium
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
