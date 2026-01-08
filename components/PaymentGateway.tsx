
import React, { useState } from 'react';

interface PaymentGatewayProps {
  planName: string;
  amount: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ planName, amount, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"></div>
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest opacity-60">Payment Gateway</h2>
            <p className="text-xl font-bold">{planName} Subscription</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{amount}</span>
            <span className="block text-[10px] opacity-40">SECURE TRANSACTION</span>
          </div>
        </div>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-8 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-2xl">🔒</span>
            <p className="text-xs text-slate-500 font-medium">Your payment details are encrypted. We never store your full card number.</p>
          </div>

          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
              <div className="relative">
                <input 
                  type="text" 
                  required
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  maxLength={19}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1d70b8] transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-40">💳</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry</label>
                <input 
                  type="text" 
                  required
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1d70b8] transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                <input 
                  type="password" 
                  required
                  placeholder="•••"
                  maxLength={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1d70b8] transition-all"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing Securely...</span>
                  </>
                ) : (
                  `Pay ${amount}`
                )}
              </button>
              <button 
                type="button"
                onClick={onCancel}
                className="w-full mt-3 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors"
              >
                Cancel & Go Back
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 flex items-center justify-center gap-6 opacity-40 grayscale">
          <span className="font-black text-[8px] uppercase tracking-widest">PCI DSS COMPLIANT</span>
          <span className="font-black text-[8px] uppercase tracking-widest">AES-256 ENCRYPTION</span>
        </div>
      </div>
    </div>
  );
};
