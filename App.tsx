
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, List, Plus, Wallet, LogOut, Loader2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { NewTicketModal } from './components/NewTicketModal';
import { Login } from './components/Login';
import { Bill, ViewState, User, BillStatus } from './types';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Renamed internal state to bills, but kept types clean
  const [bills, setBills] = useState<Bill[]>([]);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchBills = async () => {
    if (!currentUser) return;
    if (bills.length === 0) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', currentUser.id) // Filter by user
        .order('due_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedBills: Bill[] = data.map((b: any) => ({
          id: b.id,
          userId: b.user_id,
          title: b.title,
          amount: b.amount,
          category: b.category,
          status: b.status,
          dueDate: b.due_date,
          paidDate: b.paid_date,
          notes: b.notes,
          attachmentUrl: b.attachment_url,
          aiAnalysis: b.ai_analysis,
          createdAt: b.created_at
        }));
        setBills(formattedBills);
      }
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchBills();
    }
  }, [currentUser]);

  const handleLogin = async (email: string, pass: string) => {
    setLoginError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', pass)
        .single();

      if (error || !data) {
        setLoginError('Credenciais inválidas.');
      } else {
        if (data.status === 'INACTIVE') {
            setLoginError('Usuário inativo.');
            setIsLoading(false);
            return;
        }

        setCurrentUser({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role as any,
          status: data.status as any,
          avatar: data.avatar
        });
      }
    } catch (err) {
      setLoginError('Erro ao conectar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('DASHBOARD');
    setSelectedBill(null);
    setBills([]);
  };

  const handleCreateBill = async (newBillData: any) => {
    try {
        const { data, error } = await supabase.from('bills').insert(newBillData).select();
        if (error) throw error;
        
        setIsCreateModalOpen(false);
        fetchBills();
        setView('LIST');
    } catch (err) {
        alert("Erro ao criar conta.");
        console.error(err);
    }
  };

  const handleUpdateBill = async (updatedBill: Bill) => {
    // Optimistic
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    if (selectedBill?.id === updatedBill.id) setSelectedBill(updatedBill);

    try {
        const { error } = await supabase.from('bills').update({
            status: updatedBill.status,
            paid_date: updatedBill.paidDate,
            ai_analysis: updatedBill.aiAnalysis,
            attachment_url: updatedBill.attachmentUrl
        }).eq('id', updatedBill.id);
        
        if (error) throw error;
    } catch (err) {
        console.error(err);
        fetchBills(); // Revert
    }
  };

  const handleDeleteBill = async (id: string) => {
      if(!window.confirm("Apagar esta conta?")) return;
      try {
          const { error } = await supabase.from('bills').delete().eq('id', id);
          if (error) throw error;
          
          setBills(prev => prev.filter(b => b.id !== id));
          if (selectedBill?.id === id) {
              setSelectedBill(null);
              setView('LIST');
          }
      } catch (err) {
          alert("Erro ao apagar.");
      }
  }

  const navigateToDetail = (bill: Bill) => {
    setSelectedBill(bill);
    setView('DETAIL');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} isLoading={isLoading} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans animate-fade-in">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-10">
        <div className="p-6 flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">Gestão de Apê</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavButton 
            active={view === 'DASHBOARD'} 
            onClick={() => { setView('DASHBOARD'); setSelectedBill(null); }}
            icon={<LayoutGrid className="w-5 h-5" />} 
            label="Visão Geral" 
          />
          
          <NavButton 
            active={view === 'LIST' || view === 'DETAIL'} 
            onClick={() => { setView('LIST'); setSelectedBill(null); }}
            icon={<List className="w-5 h-5" />} 
            label="Minhas Contas" 
          />
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-3 mb-3">
             <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                 {currentUser.name.charAt(0)}
             </div>
             <div>
                 <p className="text-sm font-semibold text-slate-700">{currentUser.name}</p>
                 <p className="text-[10px] text-slate-400">Morador</p>
             </div>
           </div>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors font-medium"
           >
              <LogOut className="w-3.5 h-3.5" /> Sair
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="md:hidden font-bold text-slate-800">Gestão de Apê</div>
          <h2 className="text-lg font-semibold text-slate-800 hidden md:block">
            {view === 'DASHBOARD' ? 'Resumo Financeiro' : view === 'LIST' ? 'Contas & Despesas' : 'Detalhes da Conta'}
          </h2>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6 bg-slate-50 relative">
          {isLoading && !bills.length ? (
             <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" /> Carregando contas...
             </div>
          ) : (
            <>
              {view === 'DASHBOARD' && <Dashboard bills={bills} currentUser={currentUser} />}
              {view === 'LIST' && (
                <TicketList 
                    tickets={bills} 
                    onSelectTicket={navigateToDetail} 
                    onDeleteTicket={handleDeleteBill}
                />
              )}
              {view === 'DETAIL' && selectedBill && (
                <TicketDetail 
                  ticket={selectedBill} 
                  currentUser={currentUser}
                  onBack={() => setView('LIST')} 
                  onUpdateTicket={handleUpdateBill}
                  onDeleteTicket={handleDeleteBill}
                />
              )}
            </>
          )}
        </div>
      </main>

      {isCreateModalOpen && (
        <NewTicketModal 
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)} 
          onCreate={handleCreateBill} 
        />
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;
