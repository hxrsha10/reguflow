
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Logo } from './Logo';

interface AuthProps {
  onShowLegal: (page: 'terms' | 'privacy' | 'disclaimer') => void;
}

export const Auth: React.FC<AuthProps> = ({ onShowLegal }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        alert('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="p-8 pb-4 text-center border-b border-slate-50">
        <Logo className="w-12 h-12 mx-auto mb-2" hideText />
        <h2 className="text-xl font-black text-[#003078] tracking-tight uppercase">ReguFlow</h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gated Regulatory Access</p>
      </div>

      <div className="flex border-b border-slate-100 bg-slate-50/50">
        <button 
          onClick={() => setIsLogin(true)}
          className={`flex-1 py-4 text-[10px] font-black tracking-widest uppercase transition-all ${isLogin ? 'bg-white text-[#003078] border-b-2 border-[#1d70b8]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sign In
        </button>
        <button 
          onClick={() => setIsLogin(false)}
          className={`flex-1 py-4 text-[10px] font-black tracking-widest uppercase transition-all ${!isLogin ? 'bg-white text-[#003078] border-b-2 border-[#1d70b8]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold leading-tight animate-in shake duration-300">
            {error}
          </div>
        )}

        {!isLogin && (
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-300"
              placeholder="Rahul Sharma"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-300"
            placeholder="rahul@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all placeholder:text-slate-300"
            placeholder="••••••••"
          />
        </div>

        <button 
          disabled={loading}
          className="w-full gradient-bg hover:opacity-90 active:scale-[0.98] text-white font-black py-3.5 rounded-xl shadow-lg transition-all mt-4 flex items-center justify-center gap-3 text-sm disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </button>
      </form>

      <div className="px-8 pb-8 text-center">
        <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-tighter">
          By continuing, you agree to our{' '}
          <button onClick={() => onShowLegal('terms')} className="text-[#1d70b8] hover:underline">Terms</button>
          {' '}and{' '}
          <button onClick={() => onShowLegal('privacy')} className="text-[#1d70b8] hover:underline">Privacy</button>
        </p>
      </div>
    </div>
  );
};
