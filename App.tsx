
import React, { useState, useEffect, useRef } from 'react';
import { getComplianceReport, Attachment } from './services/geminiService';
import { ComplianceData, AppStatus, HistoryItem, UserTier } from './types';
import { ComplianceReport } from './components/ComplianceReport';
import { AuthModal } from './components/AuthModal';
import { LegalOverlay } from './components/LegalOverlay';
import { Logo } from './components/Logo';
import { SubscriptionModal } from './components/SubscriptionModal';
import { CameraCapture } from './components/CameraCapture';
import { PaymentGateway } from './components/PaymentGateway';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userTier, setUserTier] = useState<UserTier>(UserTier.FREE);
  const [scenario, setScenario] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [activeReport, setActiveReport] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [legalView, setLegalView] = useState<'terms' | 'privacy' | 'disclaimer' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showPayment, setShowPayment] = useState<{plan: UserTier, amount: string} | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchHistory(currentUser.id);
        const tier = currentUser.user_metadata?.tier as UserTier || UserTier.FREE;
        setUserTier(tier);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchHistory(currentUser.id);
        const tier = currentUser.user_metadata?.tier as UserTier || UserTier.FREE;
        setUserTier(tier);
        setShowAuthModal(false);
      } else {
        setHistory([]);
        setUserTier(UserTier.FREE);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchHistory = async (userId: string) => {
    const { data, error } = await supabase.from('roadmaps').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error) {
      setHistory(data.map(item => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
        scenario: item.scenario,
        data: item.data as ComplianceData,
        completedTasks: item.completed_tasks || []
      })));
    }
  };

  const requireAuth = (): boolean => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim() && attachments.length === 0) return;

    if (userTier !== UserTier.FREE) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
    }

    setStatus(AppStatus.LOADING);
    setError(null);
    try {
      // Memory: Pass last 5 interaction themes to maintain continuity
      const contextHistory = history.slice(0, 5).map(h => h.scenario);
      const data = await getComplianceReport(scenario || "Universal analysis requested.", userTier, attachments, contextHistory);
      
      let finalItem: HistoryItem;
      if (user) {
        const { data: inserted, error: dbError } = await supabase
          .from('roadmaps')
          .insert([{ user_id: user.id, scenario: scenario || "Market Strategy", data }])
          .select()
          .single();
        if (dbError) throw dbError;
        finalItem = { id: inserted.id, timestamp: Date.now(), scenario: scenario || "Market Strategy", data, completedTasks: [] };
        setHistory(prev => [finalItem, ...prev]);
      } else {
        // Guest mode - generation is unlimited
        finalItem = { id: 'guest-' + Date.now(), timestamp: Date.now(), scenario: scenario || "Guest Analysis", data, completedTasks: [] };
      }
      setActiveReport(finalItem);
      setStatus(AppStatus.SUCCESS);
      setAttachments([]); 
      setScenario('');
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("AI Protocol key invalid. Please reset via selector.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setStatus(AppStatus.IDLE);
        return;
      }
      setError(err.message || "Intelligence engine timeout. Please try again.");
      setStatus(AppStatus.ERROR);
    }
  };

  const startUpgrade = (tier: UserTier) => {
    if (!requireAuth()) return;
    const amount = tier === UserTier.PRO ? '₹499' : '₹999';
    setShowPricing(false);
    setShowPayment({ plan: tier, amount });
  };

  const finalizeUpgrade = async () => {
    if (!showPayment) return;
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      const { data, error } = await supabase.auth.updateUser({
        data: { tier: showPayment.plan }
      });
      if (error) throw error;
      setUserTier(showPayment.plan);
      setShowPayment(null);
    } catch (err: any) {
      alert("Upgrade aborted: Transaction not finalized.");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!activeReport) return;
    const newTasks = activeReport.completedTasks.includes(taskId) 
      ? activeReport.completedTasks.filter(id => id !== taskId) 
      : [...activeReport.completedTasks, taskId];
    const updated = { ...activeReport, completedTasks: newTasks };
    setActiveReport(updated);
    if (user && !activeReport.id.startsWith('guest-')) {
      setHistory(prev => prev.map(i => i.id === updated.id ? updated : i));
      await supabase.from('roadmaps').update({ completed_tasks: newTasks }).eq('id', activeReport.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="glass sticky top-0 z-50 px-6 h-16 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStatus(AppStatus.IDLE)}>
          <Logo className="w-8 h-8" hideText />
          <h1 className="font-black text-[#003078] tracking-tight">REGUFLOW</h1>
          {userTier !== UserTier.FREE && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ml-2 animate-in fade-in zoom-in ${userTier === UserTier.PREMIUM ? 'bg-slate-900 text-white border-slate-700' : 'bg-[#1d70b8] text-white border-blue-400'}`}>
              {userTier}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowPricing(true)}
            className="text-[#1d70b8] font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100 hover:bg-blue-50 transition-colors"
          >
            Pricing
          </button>
          {user ? (
            <>
              <button onClick={() => setShowHistory(true)} className="p-2 text-slate-500 relative hover:text-[#1d70b8] transition-colors">
                The Vault {history.length > 0 && <span className="absolute -top-1 -right-1 bg-[#1d70b8] text-white text-[8px] rounded-full px-1.5 py-0.5">{history.length}</span>}
              </button>
              <button onClick={() => supabase.auth.signOut()} className="text-rose-500 font-bold text-sm hover:text-rose-600">Logout</button>
            </>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="bg-[#1d70b8] text-white px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#003078] transition-all shadow-md">Sign In</button>
          )}
        </div>
      </nav>

      {status === AppStatus.IDLE && (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto">
          <div className="mb-10 animate-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1d70b8] text-[10px] font-black uppercase tracking-widest mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Universal Business Intelligence
            </div>
            <h2 className="text-5xl font-black text-[#003078] mb-4 tracking-tight leading-tight">Every Business Question, Answered.</h2>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">Instant roadmaps for minor retail to billion-dollar unicorns. Zero limits. Full precision.</p>
          </div>
          
          <div className="w-full max-w-2xl bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 relative group transition-all hover:shadow-3xl">
            {history.length > 0 && (
              <div className="absolute -top-3 left-8 bg-white border border-[#1d70b8] text-[#1d70b8] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#1d70b8] rounded-full"></span>
                Memory Active: Building on your past context
              </div>
            )}
            <form onSubmit={handleGenerate}>
              <textarea 
                className="w-full h-44 p-6 bg-slate-50 border border-slate-200 rounded-t-2xl focus:outline-none text-slate-700 font-medium placeholder:text-slate-300 resize-none transition-all text-lg"
                placeholder="Ex: 'Starting a small snack shop in Chennai' or 'Regulatory risks for my AI startup expanding to Singapore'..."
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              />
              <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => {if(requireAuth()) fileInputRef.current?.click()}} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1d70b8] transition-all shadow-sm">📎</button>
                  <button type="button" onClick={() => {if(requireAuth()) setShowCamera(true)}} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1d70b8] transition-all shadow-sm">📷</button>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {
                    if (e.target.files) {
                      for (let i = 0; i < e.target.files.length; i++) {
                        const file = e.target.files[i];
                        const reader = new FileReader();
                        reader.onloadend = () => setAttachments(prev => [...prev, { data: (reader.result as string).split(',')[1], mimeType: file.type }]);
                        reader.readAsDataURL(file);
                      }
                    }
                  }} />
                </div>
                <button className="gradient-bg text-white font-black px-10 py-4 rounded-xl shadow-lg hover:opacity-95 transition-all text-sm flex items-center justify-center gap-2 group/btn">
                  Generate Protocol
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 animate-in fade-in">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group/att w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                      {att.mimeType.startsWith('image/') ? <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">DOC</div>}
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[6px] opacity-0 group-hover/att:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
          
          <div className="mt-12 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-4">
             <span>No Generation Limits</span>
             <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
             <span>State-Specific Awareness</span>
             <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
             <span>Universal Intelligence</span>
          </div>
        </div>
      )}

      {status === AppStatus.LOADING && (
        <div className="flex-grow flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-[#1d70b8] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">🧠</div>
          </div>
          <div className="text-center">
            <p className="font-black text-[#003078] text-2xl animate-pulse tracking-tight">Synthesizing Regulatory History...</p>
            <p className="text-slate-400 font-medium text-sm mt-2">Constructing State & Central Operational Maps</p>
          </div>
        </div>
      )}

      {status === AppStatus.SUCCESS && activeReport && (
        <div className="flex-grow relative">
          {!user && (
            <div className="bg-[#003078] text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-4 shadow-lg sticky top-16 z-40">
              <span className="opacity-80">Guest Session: Results will disappear when you leave.</span>
              <button onClick={() => setShowAuthModal(true)} className="bg-white text-[#003078] px-5 py-1.5 rounded-full uppercase tracking-widest font-black text-[10px] shadow-sm hover:bg-slate-50 transition-colors">Save to Vault Permanently</button>
            </div>
          )}
          <ComplianceReport data={activeReport.data} completedTaskIds={activeReport.completedTasks} onToggleTask={handleToggleTask} isPro={userTier !== UserTier.FREE} />
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <aside className="relative w-96 bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black uppercase tracking-widest text-sm text-slate-400">Protocol Vault</h3>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">✕</button>
            </div>
            <div className="space-y-4 overflow-y-auto flex-grow pr-2">
              {history.map(item => (
                <div key={item.id} onClick={() => { setActiveReport(item); setStatus(AppStatus.SUCCESS); setShowHistory(false); }} className={`p-6 bg-slate-50 rounded-[1.8rem] cursor-pointer hover:border-[#1d70b8] border transition-all ${activeReport?.id === item.id ? 'border-[#1d70b8] bg-blue-50/50' : 'border-transparent'}`}>
                  <p className="text-sm font-bold text-slate-700 line-clamp-2 mb-2 leading-tight">{item.scenario}</p>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onShowLegal={setLegalView} />}
      {showPricing && <SubscriptionModal onClose={() => setShowPricing(false)} onUpgrade={startUpgrade} />}
      {showPayment && <PaymentGateway planName={showPayment.plan} amount={showPayment.amount} onSuccess={finalizeUpgrade} onCancel={() => setShowPayment(null)} />}
      {showCamera && <CameraCapture onCapture={(b64) => setAttachments(prev => [...prev, { data: b64, mimeType: 'image/jpeg' }])} onClose={() => setShowCamera(false)} />}
      {legalView && <LegalOverlay page={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;
