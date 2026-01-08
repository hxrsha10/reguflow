
import React, { useState, useEffect } from 'react';
import { getComplianceReport } from './services/geminiService';
import { ComplianceData, AppStatus, HistoryItem } from './types';
import { ComplianceReport } from './components/ComplianceReport';
import { Auth } from './components/Auth';
import { LegalOverlay } from './components/LegalOverlay';
import { Logo } from './components/Logo';
import { supabase } from './services/supabaseClient';

const LOADING_MESSAGES = ["Consulting Ministry Guidelines...", "Analyzing Tax Acts...", "Drafting Checklists..."];

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [scenario, setScenario] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [activeReport, setActiveReport] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [legalView, setLegalView] = useState<'terms' | 'privacy' | 'disclaimer' | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHistory(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHistory(session.user.id);
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario.trim()) return;
    setStatus(AppStatus.LOADING);
    try {
      const data = await getComplianceReport(scenario);
      const { data: inserted, error } = await supabase.from('roadmaps').insert([{ user_id: user.id, scenario, data }]).select().single();
      if (error) throw error;
      const newItem = { id: inserted.id, timestamp: Date.now(), scenario, data, completedTasks: [] };
      setHistory(prev => [newItem, ...prev]);
      setActiveReport(newItem);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
      setStatus(AppStatus.ERROR);
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

  if (!user) return <Auth onShowLegal={setLegalView} />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="glass sticky top-0 z-50 px-6 h-16 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setStatus(AppStatus.IDLE)}>
          <Logo className="w-8 h-8" hideText />
          <h1 className="font-black text-[#003078] tracking-tight">REGUFLOW</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowHistory(true)} className="p-2 text-slate-500 relative">
            Vault {history.length > 0 && <span className="absolute -top-1 -right-1 bg-[#1d70b8] text-white text-[8px] rounded-full px-1">{history.length}</span>}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="text-rose-500 font-bold text-sm">Logout</button>
        </div>
      </nav>

      {status === AppStatus.IDLE && (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-4xl font-black text-[#003078] mb-6">Your Regulatory Architect</h2>
          <form onSubmit={handleGenerate} className="w-full max-w-2xl bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
            <textarea 
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:outline-none"
              placeholder="e.g. Starting a SaaS startup with 10 employees in Bangalore..."
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
            />
            <button className="w-full gradient-bg text-white font-bold py-4 rounded-xl shadow-lg">Generate Roadmap</button>
          </form>
        </div>
      )}

      {status === AppStatus.LOADING && (
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1d70b8] rounded-full animate-spin"></div>
          <p className="font-bold text-slate-500">Consulting Indian Mandates...</p>
        </div>
      )}

      {status === AppStatus.SUCCESS && activeReport && (
        <ComplianceReport data={activeReport.data} completedTaskIds={activeReport.completedTasks} onToggleTask={handleToggleTask} />
      )}

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
          <aside className="relative w-80 bg-white h-full shadow-2xl p-6 overflow-y-auto">
            <h3 className="font-black mb-6 uppercase tracking-widest text-sm">Roadmap Vault</h3>
            {history.map(item => (
              <div key={item.id} onClick={() => { setActiveReport(item); setStatus(AppStatus.SUCCESS); setShowHistory(false); }} className="p-4 bg-slate-50 rounded-xl mb-3 cursor-pointer hover:border-[#1d70b8] border border-transparent transition-all">
                <p className="text-xs font-bold text-slate-700 line-clamp-2">{item.scenario}</p>
                <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </aside>
        </div>
      )}

      {legalView && <LegalOverlay page={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
};

export default App;
