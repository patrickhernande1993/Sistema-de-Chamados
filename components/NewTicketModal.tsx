
import React, { useState } from 'react';
import { BillCategory, BillStatus, User } from '../types';
import { X, Loader2, Sparkles, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface NewModalProps {
  currentUser: User;
  onClose: () => void;
  onCreate: (bill: any) => void;
}

export const NewTicketModal: React.FC<NewModalProps> = ({ currentUser, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<BillCategory>(BillCategory.OTHER);
  const [notes, setNotes] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!title || !amount || !dueDate) return;
    
    setIsSaving(true);
    
    // Auto-detect status based on date
    const today = new Date().toISOString().split('T')[0];
    let status = BillStatus.PENDING;
    if (dueDate < today) status = BillStatus.OVERDUE;

    const newBill = {
        user_id: currentUser.id, // Assuming Supabase Auth
        title,
        amount: parseFloat(amount),
        category,
        status,
        due_date: dueDate,
        notes,
        created_at: new Date().toISOString()
    };

    onCreate(newBill); // Pass to parent to handle API call for cleaner pattern
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Nova Despesa / Conta</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
            <input 
                type="text" 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ex: Aluguel Fevereiro"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                <div className="relative">
                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="number" 
                        step="0.01"
                        className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                <input 
                    type="date"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
             <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as BillCategory)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none"
             >
                <option value="HOUSING">Moradia</option>
                <option value="UTILITIES">Contas (Luz/Água)</option>
                <option value="FOOD">Alimentação</option>
                <option value="TRANSPORT">Transporte</option>
                <option value="LEISURE">Lazer</option>
                <option value="HEALTH">Saúde</option>
                <option value="OTHER">Outros</option>
             </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
            <textarea 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] resize-none"
                placeholder="Detalhes adicionais..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3 bg-white">
             <button onClick={onClose} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                Cancelar
             </button>
             <button 
                onClick={handleCreate}
                disabled={!title || !amount || !dueDate || isSaving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
             >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Despesa'}
             </button>
        </div>
      </div>
    </div>
  );
};
