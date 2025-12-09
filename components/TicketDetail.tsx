
import React from 'react';
import { Bill, BillStatus, User } from '../types';
import { ArrowLeft, Check, Trash2, Calendar, DollarSign, Upload, File as FileIcon, ExternalLink } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface DetailProps {
  ticket: Bill; // Named ticket for compatibility
  currentUser: User;
  onBack: () => void;
  onUpdateTicket: (bill: Bill) => void;
  onDeleteTicket: (id: string) => void;
}

export const TicketDetail: React.FC<DetailProps> = ({ ticket: bill, onBack, onUpdateTicket, onDeleteTicket }) => {
  
  const markAsPaid = () => {
      const today = new Date().toISOString().split('T')[0];
      onUpdateTicket({ ...bill, status: BillStatus.PAID, paidDate: today });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      try {
          const filePath = `${bill.id}/${Date.now()}_${file.name}`;
          const { error } = await supabase.storage.from('bill-attachments').upload(filePath, file);
          if (error) throw error;
          
          const { data } = supabase.storage.from('bill-attachments').getPublicUrl(filePath);
          onUpdateTicket({ ...bill, attachmentUrl: data.publicUrl });
      } catch (err) {
          console.error(err);
          alert('Erro no upload.');
      }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
       {/* Header */}
       <div className="flex items-center gap-4 mb-6">
           <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 text-slate-500">
              <ArrowLeft className="w-6 h-6" />
           </button>
           <div className="flex-1">
               <h1 className="text-2xl font-bold text-slate-800">{bill.title}</h1>
               <span className="text-sm text-slate-500 uppercase tracking-wide font-medium">{bill.category}</span>
           </div>
           <div className="flex gap-2">
               {bill.status !== BillStatus.PAID && (
                   <button onClick={markAsPaid} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm">
                       <Check className="w-4 h-4" /> Marcar como Pago
                   </button>
               )}
               <button onClick={() => onDeleteTicket(bill.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg">
                   <Trash2 className="w-5 h-5" />
               </button>
           </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Left Column: Details */}
           <div className="md:col-span-2 space-y-6">
               {/* Main Info Card */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                   <div className="grid grid-cols-2 gap-6">
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Valor</label>
                           <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                               <DollarSign className="w-6 h-6 text-slate-300" />
                               {bill.amount.toFixed(2)}
                           </div>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Vencimento</label>
                           <div className="flex items-center gap-2 text-lg font-medium text-slate-700">
                               <Calendar className="w-5 h-5 text-slate-300" />
                               {bill.dueDate.split('-').reverse().join('/')}
                           </div>
                       </div>
                   </div>
                   
                   <div className="mt-6 pt-6 border-t border-slate-100">
                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Observações</label>
                       <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg">
                           {bill.notes || "Sem observações."}
                       </p>
                   </div>
               </div>

               {/* Attachment Card */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                   <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">Comprovantes / Boletos</h3>
                   {bill.attachmentUrl ? (
                       <a 
                         href={bill.attachmentUrl} 
                         target="_blank" 
                         rel="noreferrer"
                         className="flex items-center gap-3 p-3 border border-blue-100 bg-blue-50/50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors"
                       >
                           <div className="p-2 bg-white rounded-lg shadow-sm">
                               <FileIcon className="w-5 h-5 text-blue-500" />
                           </div>
                           <span className="font-medium">Visualizar Anexo</span>
                           <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                       </a>
                   ) : (
                       <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
                           <Upload className="w-8 h-8 mb-2" />
                           <span className="text-sm">Clique para enviar comprovante (PDF/Img)</span>
                           <input type="file" className="hidden" onChange={handleFileUpload} />
                       </label>
                   )}
               </div>
           </div>

           {/* Right Column: Status Only */}
           <div className="space-y-6">
               <div className={`p-6 rounded-2xl border ${bill.status === BillStatus.PAID ? 'bg-emerald-50 border-emerald-200' : bill.status === BillStatus.OVERDUE ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                   <label className="text-xs font-bold opacity-60 uppercase mb-1 block">Status Atual</label>
                   <p className={`text-xl font-bold ${bill.status === BillStatus.PAID ? 'text-emerald-700' : bill.status === BillStatus.OVERDUE ? 'text-red-700' : 'text-yellow-700'}`}>
                       {bill.status === BillStatus.PAID ? 'PAGO' : bill.status === BillStatus.OVERDUE ? 'VENCIDA' : 'PENDENTE'}
                   </p>
                   {bill.paidDate && <p className="text-sm mt-1 opacity-80">Pago em: {bill.paidDate.split('-').reverse().join('/')}</p>}
               </div>
           </div>
       </div>
    </div>
  );
};
