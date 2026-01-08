
import React from 'react';

interface SubscriptionModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">
            💎
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Upgrade to Pro</h2>
          <p className="text-slate-500 font-medium mb-10">
            The Free tier is unlimited, but Pro offers verified intelligence.
          </p>

          <div className="space-y-4 mb-8 text-left">
            {[
              { title: "Google Search Grounding", desc: "Verifies latest laws with live web search", icon: "🌐" },
              { title: "Advanced Reasoning", desc: "Powered by Gemini 3 Pro engine", icon: "🧠" },
              { title: "Vault Backup", desc: "Priority storage for high-volume roadmaps", icon: "📦" },
              { title: "Expert Lead Matching", desc: "Connect directly with verified Indian CAs", icon: "🤝" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xl">{feature.icon}</span>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{feature.title}</h4>
                  <p className="text-xs text-slate-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#003078] p-1 rounded-2xl mb-8">
            <div className="bg-white rounded-xl p-4 flex justify-between items-center">
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase text-slate-400">Professional Tier</span>
                <span className="text-2xl font-black text-[#003078]">₹499 <span className="text-sm font-medium text-slate-400">/ month</span></span>
              </div>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">Best Value</span>
            </div>
          </div>

          <button 
            onClick={onUpgrade}
            className="w-full gradient-bg text-white font-black py-4 rounded-2xl shadow-xl hover:opacity-95 transition-all mb-4 text-lg"
          >
            Upgrade & Activate Pro
          </button>
          
          <button 
            onClick={onClose}
            className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
          >
            Stay on Free (Unlimited)
          </button>
        </div>
      </div>
    </div>
  );
};
