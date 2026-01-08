
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
      // Extract interaction history for memory
      const recentQueries = history.slice(0, 3).map(h => h.scenario);
      const data = await getComplianceReport(scenario || "Business Strategy analysis.", userTier, attachments, recentQueries);
      
      let finalItem: HistoryItem;
      if (user) {
        const { data: inserted, error: dbError } = await supabase
          .from('roadmaps')
          .insert([{ user_id: user.id, scenario: scenario || "Strategy Analysis", data }])
          .select()
          .single();
        if (dbError) throw dbError;
        finalItem = { id: inserted.id, timestamp: Date.now(), scenario: scenario || "Strategy Analysis", data, completedTasks: [] };
        setHistory(prev => [finalItem, ...prev]);
      } else {
        finalItem = { id: 'temp-' + Date.now(), timestamp: Date.now(), scenario: scenario || "Guest Analysis", data, completedTasks: [] };
      }
      setActiveReport(finalItem);
      setStatus(AppStatus.SUCCESS);
      setAttachments([]); 
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("API key refresh required.");
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setStatus(AppStatus.IDLE);
        return;
      }
      setError(err.message || "Failed to generate roadmap.");
      setStatus(AppStatus.ERROR);
    }
  };

  const startUpgrade = (tier: UserTier) => {
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
      alert("Upgrade process interrupted.");
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!activeReport) return;
    const newTasks = activeReport.completedTasks.includes(taskId) 
      ? activeReport.completedTasks.filter(id => id !== taskId) 
      : [...activeReport.completedTasks, taskId];
    const updated = { ...activeReport, completedTasks: newTasks };
    setActiveReport(updated);
    if (user && !activeReport.id.startsWith('temp-')) {
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
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ml-2 animate-in fade-in zoom-in ${userTier === UserTier.PREMIUM ? 'bg-slate-900 text-white border-slate-700' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
              {userTier}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user && userTier !== UserTier.PREMIUM && (
            <button 
              onClick={() => setShowPricing(true)}
              className="text-[#1d70b8] font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Upgrade
            </button>
          )}
          {user ? (
            <>
              <button onClick={() => setShowHistory(true)} className="p-2 text-slate-500 relative hover:text-[#1d70b8] transition-colors">
                Vault {history.length > 0 && <span className="absolute -top-1 -right-1 bg-[#1d70b8] text-white text-[8px] rounded-full px-1.5 py-0.5">{history.length}</span>}
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
            <h2 className="text-5xl font-black text-[#003078] mb-4 tracking-tight leading-tight">Universal Strategy Engine</h2>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">Instant roadmaps powered by contextual intelligence. For every shop, startup, and conglomerate.</p>
          </div>
          
          <div className="w-full max-w-2xl bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 relative group transition-all hover:shadow-3xl">
            <form onSubmit={handleGenerate}>
              <textarea 
                className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-t-2xl focus:outline-none text-slate-700 font-medium placeholder:text-slate-300 resize-none transition-all"
                placeholder="Ask anything... (e.g. 'Opening a chai stall in Bangalore' or 'Starting an NFT exchange in Mumbai')"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              />
              <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => {if(requireAuth()) fileInputRef.current?.click()}} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1d70b8] transition-all">📎</button>
                  <button type="button" onClick={() => {if(requireAuth()) setShowCamera(true)}} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1d70b8] transition-all">📷</button>
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
                <button className="gradient-bg text-white font-black px-8 py-3 rounded-xl shadow-lg hover:opacity-95 transition-all text-sm flex items-center justify-center gap-2 group/btn">
                  Analyze Query
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 animate-in fade-in">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group/att w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                      {att.mimeType.startsWith('image/') ? <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] font-black">DOC</div>}
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[6px] opacity-0 group-hover/att:opacity-100 transition-opacity">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {status === AppStatus.LOADING && (
        <div className="flex-grow flex flex-col items-center justify-center space-y-8">
          <div className="w-20 h-20 border-4 border-slate-100 border-t-[#1d70b8] rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="font-black text-[#003078] text-2xl animate-pulse">Consulting Context History...</p>
            <p className="text-slate-400 font-medium text-sm mt-2">Retrieving Regulatory Precision</p>
          </div>
        </div>
      )}

      {status === AppStatus.SUCCESS && activeReport && (
        <div className="flex-grow relative">
          {!user && (
            <div className="bg-[#003078] text-white p-3 text-center text-xs font-bold flex items-center justify-center gap-4">
              <span>Sign in to save this permanently.</span>
              <button onClick={() => setShowAuthModal(true)} className="bg-white text-[#003078] px-4 py-1 rounded-full uppercase tracking-widest font-black">Secure Vault</button>
            </div>
          )}
          <ComplianceReport data={activeReport.data} completedTaskIds={activeReport.completedTasks} onToggleTask={handleToggleTask} isPro={userTier !== UserTier.FREE} />
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <aside className="relative w-96 bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black uppercase tracking-widest text-sm text-slate-400">Roadmap Vault</h3>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400">✕</button>
            </div>
            <div className="space-y-4">
              {history.map(item => (
                <div key={item.id} onClick={() => { setActiveReport(item); setStatus(AppStatus.SUCCESS); setShowHistory(false); }} className={`p-6 bg-slate-50 rounded-[1.8rem] cursor-pointer hover:border-[#1d70b8] border transition-all ${activeReport?.id === item.id ? 'border-[#1d70b8]' : 'border-transparent'}`}>
                  <p className="text-sm font-bold text-slate-700 line-clamp-2">{item.scenario}</p>
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
