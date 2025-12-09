
import React, { useState } from 'react';
import { Bill, BillStatus, BillCategory } from '../types';
import { Search, Filter, AlertCircle, CheckCircle, Clock, Trash2, Calendar, ArrowRight } from 'lucide-react';

interface BillListProps {
  tickets: Bill[]; // Prop name kept as tickets for compatibility with App.tsx, but represents Bills
  onSelectTicket: (bill: Bill) => void;
  onDeleteTicket: (id: string) => void;
}

const STATUS_MAP: Record<string, string> = {
  [BillStatus.PENDING]: 'Pendente',
  [BillStatus.PAID]: 'Pago',
  [BillStatus.OVERDUE]: 'Vencida'
};

const CATEGORY_MAP: Record<string, string> = {
  [BillCategory.HOUSING]: 'Moradia',
  [BillCategory.UTILITIES]: 'Contas (Luz/Água)',
  [BillCategory.FOOD]: 'Alimentação',
  [BillCategory.TRANSPORT]: 'Transporte',
  [BillCategory.LEISURE]: 'Lazer',
  [BillCategory.HEALTH]: 'Saúde',
  [BillCategory.OTHER]: 'Outros'
};

export const TicketList: React.FC<BillListProps> = ({ tickets: bills, onSelectTicket, onDeleteTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || bill.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case BillStatus.PENDING: 
        return <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3" /> Pendente</span>;
      case BillStatus.PAID: 
        return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" /> Pago</span>;
      case BillStatus.OVERDUE: 
        return <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-bold"><AlertCircle className="w-3 h-3" /> Vencida</span>;
    }
  };

  const formatDate = (dateStr: string) => {
      if(!dateStr) return '-';
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`; // Simple string split is safer for YYYY-MM-DD than Date object due to timezones
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      onDeleteTicket(id);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar contas (ex: Luz, Mercado)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL">Todas</option>
          <option value={BillStatus.PENDING}>Pendentes</option>
          <option value={BillStatus.PAID}>Pagas</option>
          <option value={BillStatus.OVERDUE}>Vencidas</option>
        </select>
      </div>

      {/* Grid for Cards (More mobile friendly for finances) */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredBills.map(bill => (
                 <div 
                    key={bill.id} 
                    onClick={() => onSelectTicket(bill)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
                 >
                     <div className="flex justify-between items-start mb-3">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                             <Calendar className="w-5 h-5" />
                         </div>
                         {getStatusBadge(bill.status)}
                     </div>
                     
                     <h4 className="font-bold text-slate-800 text-lg mb-1">{bill.title}</h4>
                     <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-4">{CATEGORY_MAP[bill.category] || bill.category}</p>
                     
                     <div className="flex items-end justify-between border-t border-slate-100 pt-3">
                         <div>
                             <p className="text-xs text-slate-400 mb-0.5">Valor</p>
                             <p className="font-bold text-xl text-slate-900">R$ {bill.amount.toFixed(2)}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-xs text-slate-400 mb-0.5">Vencimento</p>
                             <p className={`font-medium text-sm ${bill.status === BillStatus.OVERDUE ? 'text-red-600' : 'text-slate-700'}`}>
                                 {formatDate(bill.dueDate)}
                             </p>
                         </div>
                     </div>

                     {/* Delete Action */}
                     <button 
                        onMouseDown={(e) => handleDelete(e, bill.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                     >
                         <Trash2 className="w-4 h-4" />
                     </button>
                 </div>
             ))}
         </div>
         
         {filteredBills.length === 0 && (
             <div className="text-center py-12 text-slate-400">
                 <p>Nenhuma conta encontrada.</p>
             </div>
         )}
      </div>
    </div>
  );
};
