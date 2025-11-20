import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, TicketPriority, AIAnalysis, TicketCategory, User, Attachment } from '../types';
import { ArrowLeft, Send, Sparkles, AlertTriangle, User as UserIcon, Bot, Check, Trash2, Pencil, X, Save, Paperclip, File as FileIcon, Download, Upload } from 'lucide-react';
import { analyzeTicketWithGemini } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface TicketDetailProps {
  ticket: Ticket;
  currentUser: User;
  onBack: () => void;
  onUpdateTicket: (updatedTicket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
}

// Translation Maps
const STATUS_MAP: Record<string, string> = {
  [TicketStatus.OPEN]: 'Aberto',
  [TicketStatus.IN_PROGRESS]: 'Em Andamento',
  [TicketStatus.RESOLVED]: 'Resolvido',
  [TicketStatus.CLOSED]: 'Fechado'
};

const PRIORITY_MAP: Record<string, string> = {
  [TicketPriority.LOW]: 'Baixa',
  [TicketPriority.MEDIUM]: 'Média',
  [TicketPriority.HIGH]: 'Alta',
  [TicketPriority.CRITICAL]: 'Crítica'
};

const CATEGORY_MAP: Record<string, string> = {
  [TicketCategory.BUG]: 'Erro / Bug',
  [TicketCategory.FEATURE_REQUEST]: 'Nova Funcionalidade',
  [TicketCategory.BILLING]: 'Faturamento',
  [TicketCategory.SUPPORT]: 'Suporte',
  [TicketCategory.OTHER]: 'Outro'
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, currentUser, onBack, onUpdateTicket, onDeleteTicket }) => {
  const [replyText, setReplyText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | undefined>(ticket.aiAnalysis);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ticket.title);
  const [editDescription, setEditDescription] = useState(ticket.description);

  // Attachment State
  const [isUploading, setIsUploading] = useState(false);

  const isDev = currentUser.role === 'DEV';
  const canEdit = isDev || currentUser.email === ticket.ownerEmail;

  // Update local state when ticket prop changes
  useEffect(() => {
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setAnalysis(ticket.aiAnalysis);
  }, [ticket]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeTicketWithGemini(ticket.title, ticket.description);
    if (result) {
      setAnalysis(result);
      // Auto-save the analysis to the ticket
      onUpdateTicket({ ...ticket, aiAnalysis: result });
    }
    setIsAnalyzing(false);
  };

  const handleApplySuggestion = () => {
    if (analysis?.suggestedReply) {
      setReplyText(analysis.suggestedReply);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      sender: isDev ? 'AGENT' : 'USER', // Dynamically set sender
      content: replyText,
      timestamp: new Date().toISOString(),
    } as const;
    
    const updatedTicket = {
      ...ticket,
      messages: [...ticket.messages, newMessage],
      updatedAt: new Date().toISOString(),
    };
    onUpdateTicket(updatedTicket);
    setReplyText('');
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este comentário?")) return;
    
    const updatedMessages = ticket.messages.filter(m => m.id !== messageId);
    const updatedTicket = {
      ...ticket,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    };
    onUpdateTicket(updatedTicket);
  };

  const handleDelete = () => {
     // Confirmation is handled in App.tsx
     onDeleteTicket(ticket.id);
  }

  const handleSaveEdit = () => {
     onUpdateTicket({
         ...ticket,
         title: editTitle,
         description: editDescription,
         updatedAt: new Date().toISOString()
     });
     setIsEditing(false);
  }

  const handleCancelEdit = () => {
      setEditTitle(ticket.title);
      setEditDescription(ticket.description);
      setIsEditing(false);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      setIsUploading(true);
      const newFiles: File[] = Array.from(e.target.files);
      const uploadedAttachments: Attachment[] = [];

      try {
          for (const file of newFiles) {
              const filePath = `${ticket.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
              const { error } = await supabase.storage.from('ticket-attachments').upload(filePath, file);
              
              if (error) throw error;
              
              const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
              
              uploadedAttachments.push({
                  name: file.name,
                  url: data.publicUrl,
                  type: file.type,
                  size: file.size
              });
          }
          
          // Update Ticket
          onUpdateTicket({
              ...ticket,
              attachments: [...(ticket.attachments || []), ...uploadedAttachments]
          });

      } catch (err) {
          console.error("Upload error", err);
          alert("Erro ao enviar arquivo.");
      } finally {
          setIsUploading(false);
          // Reset input
          e.target.value = '';
      }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column: Ticket Conversation */}
      <div className="lg:col-span-2 flex flex-col h-full space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">#{ticket.id}</span>
                {isEditing ? (
                    <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 p-1 px-2 border border-blue-300 rounded text-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                ) : (
                    <h2 className="text-lg font-bold text-slate-800 truncate">{ticket.title}</h2>
                )}
              </div>
              {!isEditing && (
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {ticket.requester}</span>
                    <span>•</span>
                    <span>{new Date(ticket.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
               <span className={`px-2 py-0.5 text-xs font-bold rounded border ${ticket.status === TicketStatus.OPEN ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                 {STATUS_MAP[ticket.status]}
               </span>
               
               {/* Edit Actions */}
               {canEdit && (
                   <>
                       {isEditing ? (
                           <div className="flex items-center bg-white rounded-full border border-slate-200 shadow-sm">
                               <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-full" title="Salvar">
                                   <Check className="w-4 h-4" />
                               </button>
                               <div className="w-px h-4 bg-slate-200"></div>
                               <button onClick={handleCancelEdit} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full" title="Cancelar">
                                   <X className="w-4 h-4" />
                               </button>
                           </div>
                       ) : (
                           <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar Ticket">
                               <Pencil className="w-4 h-4" />
                           </button>
                       )}
                       
                       <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                       </button>
                   </>
               )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
            {/* Initial Description as a message */}
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                 <UserIcon className="w-4 h-4" />
               </div>
               <div className="flex-1">
                 <div className={`bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-sm leading-relaxed ${isEditing ? 'ring-2 ring-blue-200' : ''}`}>
                   {isEditing ? (
                       <textarea 
                           value={editDescription}
                           onChange={(e) => setEditDescription(e.target.value)}
                           className="w-full min-h-[100px] p-1 border-none focus:ring-0 resize-none text-slate-700 bg-transparent"
                       />
                   ) : (
                       ticket.description
                   )}
                 </div>
                 <span className="text-xs text-slate-400 ml-2 mt-1 block">Solicitação Original</span>
               </div>
            </div>

            {/* Loop through messages */}
            {ticket.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.sender === 'AGENT' ? 'flex-row-reverse' : ''} group`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'AGENT' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                  {msg.sender === 'AGENT' ? <Sparkles className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] relative`}>
                   <div className={`p-4 rounded-2xl shadow-sm border text-sm leading-relaxed ${msg.sender === 'AGENT' ? 'bg-blue-600 text-white rounded-tr-none border-blue-700' : 'bg-white text-slate-700 rounded-tl-none border-slate-100'}`}>
                     {msg.content}
                   </div>
                   <span className={`text-xs text-slate-400 mt-1 block ${msg.sender === 'AGENT' ? 'text-right mr-2' : 'ml-2'}`}>{new Date(msg.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                   
                   {/* Delete Message Button (Only for DEV deleting AGENT messages) */}
                   {isDev && msg.sender === 'AGENT' && (
                       <button 
                           onClick={() => handleDeleteMessage(msg.id)}
                           className="absolute top-2 -left-8 p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                           title="Excluir comentário"
                       >
                           <Trash2 className="w-4 h-4" />
                       </button>
                   )}
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          <div className="p-4 bg-white border-t border-slate-200">
             <div className="relative">
               <textarea
                 className="w-full p-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                 rows={3}
                 placeholder="Digite sua resposta..."
                 value={replyText}
                 onChange={(e) => setReplyText(e.target.value)}
               />
               <button 
                 onClick={handleSendReply}
                 disabled={!replyText.trim()}
                 className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                 <Send className="w-4 h-4" />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* Right Column: Ticket Info & AI Insights */}
      <div className="space-y-6">
        
        {/* Properties Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-4">Detalhes do Chamado</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select 
                disabled={!isDev}
                value={ticket.status}
                onChange={(e) => onUpdateTicket({...ticket, status: e.target.value as TicketStatus})}
                className={`w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 ${!isDev ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
              >
                {Object.values(TicketStatus).map(s => <option key={s} value={s}>{STATUS_MAP[s]}</option>)}
              </select>
              {!isDev && <p className="text-[10px] text-slate-400 mt-1">Apenas administradores podem alterar o status.</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Prioridade</label>
              <select 
                value={ticket.priority}
                onChange={(e) => onUpdateTicket({...ticket, priority: e.target.value as TicketPriority})}
                className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
              >
                {Object.values(TicketPriority).map(p => <option key={p} value={p}>{PRIORITY_MAP[p]}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
              <select 
                value={ticket.category}
                onChange={(e) => onUpdateTicket({...ticket, category: e.target.value as TicketCategory})}
                className="w-full bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
              >
                {Object.values(TicketCategory).map(c => <option key={c} value={c}>{CATEGORY_MAP[c]}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Attachments Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    Anexos
                </h3>
                <label className="cursor-pointer p-1 hover:bg-white rounded-lg text-blue-600 transition-colors border border-transparent hover:border-slate-200">
                    {isUploading ? <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div> : <Upload className="w-4 h-4" />}
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" disabled={isUploading} />
                </label>
            </div>
            <div className="p-2">
                {ticket.attachments && ticket.attachments.length > 0 ? (
                    <div className="space-y-1">
                        {ticket.attachments.map((file, i) => (
                            <a 
                                key={i} 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group transition-colors"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                    <span className="text-sm text-slate-600 truncate">{file.name}</span>
                                </div>
                                <Download className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 text-center text-xs text-slate-400">Nenhum anexo.</div>
                )}
            </div>
        </div>

        {/* AI Card */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
            <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Insights Gemini
            </h3>
            {!analysis && isDev && (
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="text-xs bg-white text-indigo-600 px-3 py-1 rounded-full border border-indigo-200 hover:bg-indigo-50 transition-colors disabled:opacity-70"
              >
                {isAnalyzing ? 'Pensando...' : 'Analisar'}
              </button>
            )}
          </div>
          
          {analysis ? (
            <div className="p-4 space-y-4">
              {/* Summary */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Resumo</label>
                <p className="text-sm text-slate-700 leading-snug">{analysis.summary}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase">Sentimento</label>
                  <div className={`text-sm font-bold flex items-center gap-1 ${analysis.sentimentLabel === 'Negative' ? 'text-red-600' : analysis.sentimentLabel === 'Positive' ? 'text-green-600' : 'text-slate-600'}`}>
                    {analysis.sentimentLabel === 'Positive' ? 'Positivo' : analysis.sentimentLabel === 'Negative' ? 'Negativo' : 'Neutro'}
                    <span className="text-xs font-normal text-slate-400">({analysis.sentimentScore}/100)</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <label className="text-xs font-bold text-slate-400 uppercase">Urgência</label>
                   <div className="text-sm font-bold text-slate-700">{PRIORITY_MAP[analysis.suggestedPriority]}</div>
                </div>
              </div>

              {/* Suggested Reply - Only helpful for DEV/Agent */}
              {isDev && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-between">
                  Sugestão de Resposta
                  <button onClick={handleApplySuggestion} className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[10px] normal-case bg-indigo-50 px-2 py-1 rounded">
                    <Check className="w-3 h-3" /> Usar esta
                  </button>
                </label>
                <div className="p-3 bg-indigo-50/50 rounded-lg text-xs text-slate-600 italic border border-indigo-50 leading-relaxed">
                  "{analysis.suggestedReply}"
                </div>
              </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{isDev ? 'Execute a análise para categorizar.' : 'Nenhuma análise disponível ainda.'}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};