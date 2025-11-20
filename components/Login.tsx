import React, { useState } from 'react';
import { Ticket as TicketIcon, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string) => void;
  error: string | null;
  isLoading?: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin, error, isLoading = false }) => {
  const [email, setEmail] = useState('admin@nexticket.ai');
  const [password, setPassword] = useState('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 mx-auto mb-4">
            <TicketIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NexTicket AI</h1>
          <p className="text-slate-400 mt-2 text-sm">Sistema Inteligente de Chamados</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    Entrar no Sistema
                    <ArrowRight className="w-4 h-4" />
                  </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100">
               <p className="text-xs text-center text-slate-400 mb-2">Credenciais (Banco de Dados):</p>
               <div className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-bold block text-blue-600">DEV (Admin)</span>
                    admin@nexticket.ai<br/>admin
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-bold block text-green-600">USUÁRIO</span>
                    usuario@empresa.com<br/>123456
                  </div>
               </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};