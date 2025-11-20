import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { supabase } from '../services/supabaseClient';
import { Plus, Search, User as UserIcon, ShieldAlert, X, Loader2, Save, Power, Pencil, CheckCircle, Ban } from 'lucide-react';

interface UserManagementProps {
  currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null); // Track if editing
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [newStatus, setNewStatus] = useState<UserStatus>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
      setEditingId(null);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('USER');
      setNewStatus('ACTIVE');
      setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
      setEditingId(user.id);
      setNewName(user.name);
      setNewEmail(user.email);
      setNewPassword(''); // Don't fill password for security/UX
      setNewRole(user.role);
      setNewStatus(user.status);
      setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!newName || !newEmail) return;
    // If creating, password is required. If editing, it's optional.
    if (!editingId && !newPassword) return;

    setIsSaving(true);

    try {
      if (editingId) {
          // --- UPDATE MODE ---
          const updates: any = {
              name: newName,
              email: newEmail,
              role: newRole,
              status: newStatus,
              // Regenerate avatar char if name changed
              avatar: newName.charAt(0).toUpperCase()
          };

          // Only update password if a new one was typed
          if (newPassword.trim()) {
              updates.password = newPassword;
          }

          const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', editingId);

          if (error) throw error;

          alert('Usuário atualizado com sucesso!');
      } else {
          // --- CREATE MODE ---
          const avatar = newName.charAt(0).toUpperCase();
          const { error } = await supabase.from('users').insert({
            name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
            status: newStatus,
            avatar: avatar
          });

          if (error) throw error;
          alert('Usuário criado com sucesso!');
      }

      // Reset form and refresh list
      setIsModalOpen(false);
      fetchUsers();

    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
     const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
     const confirmMsg = newStatus === 'ACTIVE' ? 'Ativar usuário?' : 'Desativar usuário? Ele perderá o acesso ao sistema.';
     
     if (!window.confirm(confirmMsg)) return;

     try {
        // Optimistic Update
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));

        const { error } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', user.id);

        if (error) throw error;

     } catch (err: any) {
         console.error("Erro ao alterar status", err);
         alert("Erro ao alterar status.");
         fetchUsers(); // Revert
     }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar usuários por nome ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar Usuário
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1 p-4">
        {isLoading ? (
           <div className="flex justify-center items-center h-32 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className={`bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all flex items-center gap-4 group relative ${user.status === 'INACTIVE' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${user.role === 'DEV' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {user.avatar || user.name.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0 pr-16">
                    <h4 className="font-semibold text-slate-800 truncate">{user.name}</h4>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.role === 'DEV' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {user.role === 'DEV' ? 'ADMINISTRADOR' : 'USUÁRIO'}
                       </span>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {user.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                       </span>
                    </div>
                 </div>
                 
                 <div className="absolute top-4 right-4 flex flex-col gap-2">
                     {/* Edit Button */}
                     <button 
                        onClick={() => openEditModal(user)}
                        className="p-1.5 rounded-full transition-colors text-slate-300 hover:bg-blue-50 hover:text-blue-600"
                        title="Editar Usuário"
                     >
                         <Pencil className="w-4 h-4" />
                     </button>

                     {/* Status Toggle Button */}
                     <button 
                        onClick={() => toggleUserStatus(user)}
                        className={`p-1.5 rounded-full transition-colors ${user.status === 'ACTIVE' ? 'text-slate-300 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                        title={user.status === 'ACTIVE' ? 'Desativar Usuário' : 'Ativar Usuário'}
                     >
                         <Power className="w-4 h-4" />
                     </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-800">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ex: João Silva"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="usuario@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {editingId ? 'Nova Senha (Opcional)' : 'Senha Provisória'}
                </label>
                <input 
                    type="text" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={editingId ? 'Deixe em branco para manter' : 'Defina uma senha'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Perfil</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setNewRole('USER')}
                            className={`flex-1 p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${newRole === 'USER' ? 'bg-slate-600 text-white border-slate-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <UserIcon className="w-4 h-4" />
                            Usuário
                        </button>
                        <button 
                            onClick={() => setNewRole('DEV')}
                            className={`flex-1 p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${newRole === 'DEV' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <ShieldAlert className="w-4 h-4" />
                            Admin
                        </button>
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setNewStatus('ACTIVE')}
                            className={`flex-1 p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${newStatus === 'ACTIVE' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Ativo
                        </button>
                        <button 
                            onClick={() => setNewStatus('INACTIVE')}
                            className={`flex-1 p-2 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1 ${newStatus === 'INACTIVE' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                        >
                            <Ban className="w-4 h-4" />
                            Inativo
                        </button>
                    </div>
                  </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSaveUser}
                    disabled={isSaving || !newName || !newEmail || (!editingId && !newPassword)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {editingId ? 'Salvar' : 'Cadastrar'}</>}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};