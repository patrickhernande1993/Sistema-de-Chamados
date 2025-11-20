
import React from 'react';
import { Notification, Ticket } from '../types';
import { Bell, Check, Clock, Ticket as TicketIcon, Trash2 } from 'lucide-react';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onSelectTicket: (ticketId: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onDeleteNotification,
  onSelectTicket 
}) => {

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center h-full animate-fade-in">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Tudo limpo por aqui!</h3>
        <p className="text-slate-500 mt-1">Você não tem novas notificações.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full animate-fade-in">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Suas Notificações
        </h3>
        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
          {notifications.length} pendentes
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-3">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`relative p-4 rounded-xl border transition-all duration-200 group ${
              notification.read 
                ? 'bg-white border-slate-100 text-slate-400' 
                : 'bg-blue-50/50 border-blue-100 text-slate-800 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 p-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-slate-100' : 'bg-white text-blue-600'}`}>
                <TicketIcon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectTicket(notification.ticketId)}>
                <p className={`text-sm leading-relaxed ${notification.read ? 'text-slate-500' : 'font-medium text-slate-800'}`}>
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                   <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">#{notification.ticketId}</span>
                   <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {new Date(notification.createdAt).toLocaleString('pt-BR')}
                   </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!notification.read && (
                  <button 
                    onClick={() => onMarkAsRead(notification.id)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                    title="Marcar como lida"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => onDeleteNotification(notification.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
