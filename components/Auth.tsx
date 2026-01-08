
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
    <div className="min-h-screen w-full flex items-center justify-center p-6 grid-bg">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <Logo className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-[#003078] tracking-tight mb-2 uppercase">
            REGUFLOW
          </h1>
          <p className="text-slate-500 font-medium">Simplify your Indian Compliance Journey</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-5 text-sm font-bold tracking-widest uppercase transition-all ${isLogin ? 'bg-slate-50 text-[#003078] border-b-2 border-[#1d70b8]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-5 text-sm font-bold tracking-widest uppercase transition-all ${!isLogin ? 'bg-slate-50 text-[#003078] border-b-2 border-[#1d70b8]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold leading-relaxed animate-in fade-in zoom-in duration-200">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-black focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Rahul Sharma"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-black focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="rahul@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-black focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                placeholder="••••••••"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full gradient-bg hover:opacity-90 active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4 flex items-center justify-center gap-3 text-lg disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Login' : 'Create Account'
              )}
            </button>
          </form>

          <div className="px-8 pb-8 text-center">
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              By continuing, you agree to our{' '}
              <button onClick={() => onShowLegal('terms')} className="text-[#1d70b8] hover:underline font-bold">Terms</button>
              {' '}and{' '}
              <button onClick={() => onShowLegal('privacy')} className="text-[#1d70b8] hover:underline font-bold">Privacy Policy</button>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
