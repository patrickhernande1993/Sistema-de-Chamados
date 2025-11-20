
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, List, Plus, Settings, Bell, Ticket as TicketIcon, LogOut, Loader2, Users as UsersIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TicketList } from './components/TicketList';
import { TicketDetail } from './components/TicketDetail';
import { NewTicketModal } from './components/NewTicketModal';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { Notifications } from './components/Notifications';
import { Ticket, ViewState, User, Notification } from './types';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [view, setView] = useState<ViewState>('DASHBOARD');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- DATA FETCHING ---

  const fetchTickets = async () => {
    if (!currentUser) return;
    if (tickets.length === 0) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id, title, description, requester, status, priority, category,
          owner_email, created_at, updated_at, ai_analysis, messages, attachments
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedTickets: Ticket[] = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          requester: t.requester,
          ownerEmail: t.owner_email,
          status: t.status,
          priority: t.priority,
          category: t.category,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          aiAnalysis: t.ai_analysis,
          messages: t.messages || [],
          attachments: t.attachments || []
        }));
        setTickets(formattedTickets);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_email', currentUser.email)
            .eq('read', false) // Only fetch unread by default for badge, or all? Let's fetch all for list
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        if (data) {
            const formatted: Notification[] = data.map((n: any) => ({
                id: n.id,
                recipientEmail: n.recipient_email,
                ticketId: n.ticket_id,
                message: n.message,
                read: n.read,
                createdAt: n.created_at
            }));
            setNotifications(formatted);
        }
    } catch (err) {
        console.error("Error fetching notifications", err);
    }
  }

  // Re-fetch tickets when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchTickets();
      fetchNotifications();
    }
  }, [currentUser]);

  // --- HELPER: NOTIFICATIONS ---

  const sendNotification = async (recipientEmail: string, ticketId: string, message: string) => {
     try {
        await supabase.from('notifications').insert({
            recipient_email: recipientEmail,
            ticket_id: ticketId,
            message: message,
            read: false
        });
     } catch (err) {
         console.error("Failed to send notification", err);
     }
  };

  const sendNotificationToRole = async (role: 'DEV', ticketId: string, message: string) => {
      try {
          // 1. Find users with role
          const { data: devs } = await supabase
            .from('users')
            .select('email')
            .eq('role', role)
            .eq('status', 'ACTIVE');
          
          if (devs && devs.length > 0) {
              const notifications = devs.map(d => ({
                  recipient_email: d.email,
                  ticket_id: ticketId,
                  message: message,
                  read: false
              }));
              
              await supabase.from('notifications').insert(notifications);
          }
      } catch (err) {
          console.error("Failed to send group notification", err);
      }
  }

  // --- AUTH HANDLERS ---

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
            setLoginError('Usuário inativo. Contate o administrador.');
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
      setLoginError('Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('DASHBOARD');
    setSelectedTicket(null);
    setTickets([]);
    setNotifications([]);
  };

  // --- DATA FILTERING ---

  const visibleTickets = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'DEV') return tickets;
    return tickets.filter(t => t.ownerEmail === currentUser.email);
  }, [tickets, currentUser]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  // --- ACTION HANDLERS ---

  const handleCreateTicket = async (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
    setIsCreateModalOpen(false);
    setView('LIST');

    try {
      const dbTicket = {
        id: newTicket.id,
        title: newTicket.title,
        description: newTicket.description,
        requester: newTicket.requester,
        owner_email: newTicket.ownerEmail,
        status: newTicket.status,
        priority: newTicket.priority,
        category: newTicket.category,
        ai_analysis: newTicket.aiAnalysis,
        messages: newTicket.messages,
        attachments: newTicket.attachments, // Added attachments
        created_at: newTicket.createdAt,
        updated_at: newTicket.updatedAt
      };

      const { error } = await supabase.from('tickets').insert(dbTicket);
      if (error) throw error;
      
      // ALERT: Notify DEVs when a new ticket is created
      await sendNotificationToRole('DEV', newTicket.id, `Novo chamado criado por ${newTicket.requester}: "${newTicket.title}"`);
      
      fetchTickets();

    } catch (err) {
      console.error("Error creating ticket", err);
      alert("Erro ao salvar ticket no banco de dados.");
      fetchTickets();
    }
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    // Find previous state to compare
    const oldTicket = tickets.find(t => t.id === updatedTicket.id);

    // Optimistic update
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    if (selectedTicket?.id === updatedTicket.id) {
        setSelectedTicket(updatedTicket);
    }

    try {
       const { error } = await supabase
        .from('tickets')
        .update({
          title: updatedTicket.title,
          description: updatedTicket.description,
          status: updatedTicket.status,
          priority: updatedTicket.priority,
          category: updatedTicket.category,
          ai_analysis: updatedTicket.aiAnalysis,
          messages: updatedTicket.messages,
          attachments: updatedTicket.attachments, // Added attachments
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedTicket.id);

      if (error) throw error;

      // --- NOTIFICATION LOGIC ---
      if (oldTicket) {
          // 1. Check Status Change (User Notification)
          if (oldTicket.status !== updatedTicket.status) {
               // Notify the ticket owner (User)
               if (updatedTicket.ownerEmail !== currentUser?.email) { // Don't notify self
                   const statusPT = { 'OPEN': 'Aberto', 'IN_PROGRESS': 'Em Andamento', 'RESOLVED': 'Resolvido', 'CLOSED': 'Fechado' }[updatedTicket.status];
                   await sendNotification(updatedTicket.ownerEmail, updatedTicket.id, `O status do seu chamado foi alterado para: ${statusPT}`);
               }
          }

          // 2. Check New Messages
          if (updatedTicket.messages.length > oldTicket.messages.length) {
              const lastMsg = updatedTicket.messages[updatedTicket.messages.length - 1];
              
              // Case A: User commented -> Notify DEVs
              if (lastMsg.sender === 'USER' && currentUser?.role === 'USER') {
                  await sendNotificationToRole('DEV', updatedTicket.id, `Nova interação de ${updatedTicket.requester} no chamado #${updatedTicket.id}`);
              }

              // Case B: Agent commented -> Notify User
              if (lastMsg.sender === 'AGENT' && currentUser?.role === 'DEV') {
                   await sendNotification(updatedTicket.ownerEmail, updatedTicket.id, `O suporte respondeu seu chamado: "${updatedTicket.title}"`);
              }
          }
      }

    } catch (err: any) {
      console.error("Error updating ticket:", err);
      alert(`Erro ao atualizar ticket: ${err.message || 'Erro desconhecido'}`);
      fetchTickets();
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este chamado permanentemente?")) return;

    // 1. Pessimistic update: First delete from DB
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      // 2. If successful, update UI
      setTickets(currentTickets => currentTickets.filter(t => t.id !== ticketId));
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
        setView('LIST');
      }

      // 3. Ensure list is fresh
      fetchTickets();

    } catch (err: any) {
      console.error("Error deleting ticket:", err);
      alert(`Erro ao excluir: ${err.message}. Verifique se você tem permissão.`);
    }
  }

  // --- NOTIFICATION ACTIONS ---
  const handleMarkNotificationRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n)); // Optimistic
      await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const handleDeleteNotification = async (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await supabase.from('notifications').delete().eq('id', id);
  };

  const handleSelectTicketFromNotification = (ticketId: string) => {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
          setSelectedTicket(ticket);
          setView('DETAIL');
          // Mark associated notification as read
          const notif = notifications.find(n => n.ticketId === ticketId);
          if (notif && !notif.read) handleMarkNotificationRead(notif.id);
      } else {
          alert("Este chamado não existe mais ou você não tem acesso.");
      }
  };

  const navigateToDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setView('DETAIL');
  };

  // --- RENDER ---

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} isLoading={isLoading} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans animate-fade-in">
      {/* Sidebar - CLEAN STYLE */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-10">
        <div className="p-6 flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <TicketIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">NexTicket</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
           <NavButton 
            active={view === 'NOTIFICATIONS'} 
            onClick={() => { setView('NOTIFICATIONS'); fetchNotifications(); }} 
            icon={<Bell className="w-5 h-5" />} 
            label="Notificações"
            badgeCount={unreadCount}
          />

          <NavButton 
            active={view === 'DASHBOARD'} 
            onClick={() => { setView('DASHBOARD'); setSelectedTicket(null); }}
            icon={<LayoutGrid className="w-5 h-5" />} 
            label="Visão Geral" 
          />
          
          <NavButton 
            active={view === 'LIST' || view === 'DETAIL'} 
            onClick={() => { setView('LIST'); setSelectedTicket(null); }}
            icon={<List className="w-5 h-5" />} 
            label="Meus Chamados" 
          />
          
          {currentUser.role === 'DEV' && (
            <>
              <div className="my-4 border-t border-slate-100 mx-2"></div>
              <div className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Administração</div>
              <NavButton 
                  active={view === 'USERS'} 
                  onClick={() => { setView('USERS'); setSelectedTicket(null); }} 
                  icon={<UsersIcon className="w-5 h-5" />} 
                  label="Usuários" 
              />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm text-white ${currentUser.role === 'DEV' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                    {currentUser.avatar}
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-slate-700 truncate w-28">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{currentUser.role === 'DEV' ? 'Admin' : 'Usuário'}</p>
                </div>
              </div>
           </div>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors font-medium"
           >
              <LogOut className="w-3.5 h-3.5" /> Encerrar Sessão
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center md:hidden gap-2">
             <div className="bg-blue-600 p-1.5 rounded-lg">
                <TicketIcon className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-slate-800">NexTicket</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 hidden md:block">
            {view === 'DASHBOARD' ? 'Visão Geral' : 
             view === 'LIST' ? 'Central de Chamados' : 
             view === 'USERS' ? 'Equipe e Usuários' : 
             view === 'NOTIFICATIONS' ? 'Alertas' :
             'Detalhes do Chamado'}
          </h2>
          <div className="flex items-center gap-4">
            {view !== 'USERS' && view !== 'NOTIFICATIONS' && (
                <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                <Plus className="w-4 h-4" />
                <span>Novo Chamado</span>
                </button>
            )}
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50/50 relative">
          {isLoading && !tickets.length && view !== 'DASHBOARD' && view !== 'USERS' ? (
             <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" /> Carregando dados...
             </div>
          ) : (
            <>
              {view === 'DASHBOARD' && <Dashboard tickets={visibleTickets} currentUser={currentUser} />}
              {view === 'LIST' && (
                <TicketList 
                    tickets={visibleTickets} 
                    currentUser={currentUser}
                    onSelectTicket={navigateToDetail} 
                    onDeleteTicket={handleDeleteTicket}
                />
              )}
              {view === 'DETAIL' && selectedTicket && (
                <TicketDetail 
                  ticket={selectedTicket} 
                  currentUser={currentUser}
                  onBack={() => setView('LIST')} 
                  onUpdateTicket={handleUpdateTicket}
                  onDeleteTicket={handleDeleteTicket}
                />
              )}
              {view === 'USERS' && currentUser.role === 'DEV' && (
                  <UserManagement currentUser={currentUser} />
              )}
              {view === 'NOTIFICATIONS' && (
                  <Notifications 
                      notifications={notifications}
                      onMarkAsRead={handleMarkNotificationRead}
                      onDeleteNotification={handleDeleteNotification}
                      onSelectTicket={handleSelectTicketFromNotification}
                  />
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal */}
      {isCreateModalOpen && (
        <NewTicketModal 
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)} 
          onCreate={handleCreateTicket} 
        />
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badgeCount?: number }> = ({ active, onClick, icon, label, badgeCount }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
      active 
        ? 'bg-blue-50 text-blue-600' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center gap-3">
        <span className={`${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
            {icon}
        </span>
        {label}
    </div>
    {badgeCount !== undefined && badgeCount > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {badgeCount}
        </span>
    )}
  </button>
);

export default App;
