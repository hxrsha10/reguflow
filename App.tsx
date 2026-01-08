
import React, { useState, useEffect, useRef } from 'react';
import { getComplianceReport, Attachment } from './services/geminiService';
import { ComplianceData, AppStatus, HistoryItem, UserTier } from './types';
import { ComplianceReport } from './components/ComplianceReport';
import { AuthModal } from './components/AuthModal';
import { LegalOverlay } from './components/LegalOverlay';
import { Logo } from './components/Logo';
import { SubscriptionModal } from './components/SubscriptionModal';
import { CameraCapture } from './components/CameraCapture';
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
        setShowAuthModal(false); // Close auth popup on successful login/signup
      } else {
        setHistory([]);
        setUserTier(UserTier.FREE);
        setStatus(AppStatus.IDLE);
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

    // Gated feature: require login before generating
    if (!requireAuth()) return;

    if (userTier === UserTier.FREE && history.length >= 2) {
      setShowPricing(true);
      return;
    }

    if (userTier === UserTier.PRO) {
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
      const data = await getComplianceReport(scenario || "Multimodal analysis requested.", userTier === UserTier.PRO, attachments);
      
      const { data: inserted, error: dbError } = await supabase
        .from('roadmaps')
        .insert([{ 
          user_id: user.id, 
          scenario: scenario || "Multimodal Analysis", 
          data 
        }])
        .select()
        .single();
      
      if (dbError) throw dbError;

      const newItem = { 
        id: inserted.id, 
        timestamp: Date.now(), 
        scenario: scenario || "Multimodal Analysis", 
        data, 
        completedTasks: [] 
      };
      
      setHistory(prev => [newItem, ...prev]);
      setActiveReport(newItem);
      setStatus(AppStatus.SUCCESS);
      setAttachments([]); 
    } catch (err: any) {
      console.error("Generation Error:", err);
      if (err.message?.includes("Requested entity was not found")) {
        setError("Your API key configuration needs reset. Opening selection...");
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setStatus(AppStatus.IDLE);
        return;
      }
      setError(err.message || "Failed to generate roadmap. Please try again.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireAuth()) return;
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setAttachments(prev => [...prev, { data: base64, mimeType: file.type }]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCapture = (base64: string) => {
    setAttachments(prev => [...prev, { data: base64, mimeType: 'image/jpeg' }]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpgrade = async () => {
    if (!requireAuth()) return;
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      const { data, error } = await supabase.auth.updateUser({
        data: { tier: UserTier.PRO }
      });
      if (error) throw error;
      setUserTier(UserTier.PRO);
      setShowPricing(false);
    } catch (err: any) {
      alert("Upgrade process interrupted: " + err.message);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!activeReport) return;
    const newTasks = activeReport.completedTasks.includes(taskId) 
      ? activeReport.completedTasks.filter(id => id !== taskId) 
      : [...activeReport.completedTasks, taskId];
    
    const updated = { ...activeReport, completedTasks: newTasks };
    setActiveReport(updated);
    setHistory(prev => prev.map(i => i.id === updated.id ? updated : i));
    await supabase.from('roadmaps').update({ completed_tasks: newTasks }).eq('id', activeReport.id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="glass sticky top-0 z-50 px-6 h-16 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStatus(AppStatus.IDLE)}>
          <Logo className="w-8 h-8" hideText />
          <h1 className="font-black text-[#003078] tracking-tight">REGUFLOW</h1>
          {userTier === UserTier.PRO && (
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border border-amber-200 ml-2 animate-in fade-in zoom-in">PRO</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user && userTier === UserTier.FREE && (
            <button 
              onClick={() => setShowPricing(true)}
              className="text-amber-600 font-bold text-xs uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
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
            <h2 className="text-5xl font-black text-[#003078] mb-4 tracking-tight leading-tight">Regulatory Intelligence for India</h2>
            <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">Instant roadmaps for startups, financial services, and complex business models.</p>
          </div>
          
          <div className="w-full max-w-2xl bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 relative group transition-all hover:shadow-3xl">
            <form onSubmit={handleGenerate}>
              <textarea 
                className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-t-2xl focus:outline-none text-slate-700 font-medium placeholder:text-slate-300 resize-none transition-all"
                placeholder="Describe your project (e.g. Starting an NBFC in Bengaluru)..."
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              />
              
              <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      if (requireAuth()) fileInputRef.current?.click();
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1d70b8] hover:border-[#1d70b8] transition-all"
                    title="Upload Files"
                  >
                    📎
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (requireAuth()) setShowCamera(true);
                    }}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#1d70b8] hover:border-[#1d70b8] transition-all"
                    title="Capture Photo"
                  >
                    📷
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={handleFileUpload}
                  />
                </div>
                
                <button className="gradient-bg text-white font-black px-8 py-3 rounded-xl shadow-lg hover:opacity-95 transition-all text-sm flex items-center justify-center gap-2 group/btn">
                  Generate Roadmap
                  <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group/att w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      {att.mimeType.startsWith('image/') ? (
                        <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-black uppercase text-slate-400">DOC</div>
                      )}
                      <button 
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] opacity-0 group-hover/att:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
            <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
              Powered by Gemini 3 {userTier === UserTier.PRO ? "Pro" : "Flash"}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-4xl animate-in fade-in duration-1000 delay-300">
             {[
               { icon: "📄", title: "Smart Analysis", desc: "Upload licenses or registrations for instant breakdown." },
               { icon: "🛡️", title: "Risk Mitigation", desc: "Identify liability points and required filings automatically." },
               { icon: "☁️", title: "The Vault", desc: "Sign in to save and track your compliance journey." }
             ].map((f, i) => (
               <div key={i} className="p-6 rounded-2xl border border-slate-100 bg-white/50 hover:bg-white hover:shadow-md transition-all">
                 <span className="text-2xl mb-2 block">{f.icon}</span>
                 <h4 className="font-bold text-slate-800 text-sm mb-1">{f.title}</h4>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
               </div>
             ))}
          </div>
        </div>
      )}

      {status === AppStatus.LOADING && (
        <div className="flex-grow flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-slate-100 border-t-[#1d70b8] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Logo className="w-10 h-10 opacity-50" hideText />
            </div>
          </div>
          <div className="text-center">
            <p className="font-black text-[#003078] text-2xl animate-pulse tracking-tight">Constructing Intelligence...</p>
            <p className="text-slate-400 font-medium text-sm mt-2">Merging Multi-modal Inputs with Regulatory Grids</p>
          </div>
        </div>
      )}

      {status === AppStatus.ERROR && (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-rose-100 max-w-md animate-in zoom-in duration-300">
            <span className="text-5xl mb-6 block">⚠️</span>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Protocol Disruption</h3>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
            <button 
              onClick={() => setStatus(AppStatus.IDLE)}
              className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-slate-800 transition-all"
            >
              Retry Protocol
            </button>
          </div>
        </div>
      )}

      {status === AppStatus.SUCCESS && activeReport && (
        <ComplianceReport 
          data={activeReport.data} 
          completedTaskIds={activeReport.completedTasks} 
          onToggleTask={handleToggleTask}
          isPro={userTier === UserTier.PRO}
        />
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <aside className="relative w-96 bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black uppercase tracking-widest text-sm text-slate-400">Roadmap Vault</h3>
              <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">✕</button>
            </div>
            {history.length === 0 ? (
              <div className="text-center py-20">
                <span className="text-4xl mb-4 block">📭</span>
                <p className="text-slate-400 font-medium text-sm">Vault currently offline. Generate a roadmap to initiate storage.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => { setActiveReport(item); setStatus(AppStatus.SUCCESS); setShowHistory(false); }} 
                    className={`p-6 bg-slate-50 rounded-[1.8rem] cursor-pointer hover:border-[#1d70b8] border transition-all group ${activeReport?.id === item.id ? 'border-[#1d70b8] bg-blue-50/30' : 'border-transparent'}`}
                  >
                    <p className="text-sm font-bold text-slate-700 line-clamp-2 mb-3 group-hover:text-[#1d70b8] transition-colors">{item.scenario}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                      {item.data.isGrounded && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">Search Grounded</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onShowLegal={setLegalView} />}
      {showPricing && <SubscriptionModal onClose={() => setShowPricing(false)} onUpgrade={handleUpgrade} />}
      {showCamera && <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />}
      {legalView && <LegalOverlay page={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;
