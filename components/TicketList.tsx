import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, User } from '../types';
import { Search, Filter, ArrowUpDown, AlertCircle, Clock, CheckCircle, Trash2 } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  currentUser: User;
  onSelectTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
}

// Translation Maps
const STATUS_MAP: Record<string, string> = {
  [TicketStatus.OPEN]: 'Aberto',
  [TicketStatus.IN_PROGRESS]: 'Em Andamento',
  [TicketStatus.RESOLVED]: 'Resolvido',
  [TicketStatus.CLOSED]: 'Fechado'
};

const CATEGORY_MAP: Record<string, string> = {
  [TicketCategory.BUG]: 'Erro / Bug',
  [TicketCategory.FEATURE_REQUEST]: 'Nova Funcionalidade',
  [TicketCategory.BILLING]: 'Faturamento',
  [TicketCategory.SUPPORT]: 'Suporte',
  [TicketCategory.OTHER]: 'Outro'
};

export const TicketList: React.FC<TicketListProps> = ({ tickets, currentUser, onSelectTicket, onDeleteTicket }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ticket.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || ticket.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case TicketStatus.IN_PROGRESS: return <Clock className="w-4 h-4 text-yellow-500" />;
      case TicketStatus.RESOLVED: return <CheckCircle className="w-4 h-4 text-green-500" />;
      case TicketStatus.CLOSED: return <CheckCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleRowClick = (ticket: Ticket) => {
    onSelectTicket(ticket);
  };

  const handleDeleteInteraction = (e: React.MouseEvent, id: string) => {
    // Use native event stop propagation to be absolutely sure
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    e.preventDefault();
    onDeleteTicket(id);
  };

  const getResolutionDate = (ticket: Ticket) => {
    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
        return new Date(ticket.updatedAt).toLocaleDateString('pt-BR');
    }
    return '-';
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar chamados..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value={TicketStatus.OPEN}>Aberto</option>
            <option value={TicketStatus.IN_PROGRESS}>Em Andamento</option>
            <option value={TicketStatus.RESOLVED}>Resolvido</option>
            <option value={TicketStatus.CLOSED}>Fechado</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
            <tr>
              <th className="px-6 py-4">ID / Solicitante</th>
              <th className="px-6 py-4">Título</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Data Abertura</th>
              <th className="px-6 py-4">Data de Resolução</th>
              <th className="px-6 py-4">Última Atualização</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredTickets.map((ticket) => (
              <tr 
                key={ticket.id} 
                onClick={() => handleRowClick(ticket)}
                className="hover:bg-blue-50/30 cursor-pointer transition-colors group relative"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{ticket.id}</div>
                  <div className="text-slate-500 text-xs">{ticket.requester}</div>
                </td>
                <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-800">
                  {ticket.title}
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200 whitespace-nowrap">
                     {CATEGORY_MAP[ticket.category] || ticket.category}
                   </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                   {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-slate-500">
                   {getResolutionDate(ticket)}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <span className="text-slate-700 font-medium capitalize">{STATUS_MAP[ticket.status]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Delete Button */}
                    <div 
                        className="relative z-20 inline-block"
                        onMouseDown={(e) => handleDeleteInteraction(e, ticket.id)}
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <button 
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors p-2 rounded-full"
                            title="Excluir Ticket"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p>Nenhum chamado encontrado com estes critérios.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};