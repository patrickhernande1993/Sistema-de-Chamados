
import React, { useState } from 'react';
import { TicketPriority, TicketCategory, TicketStatus, User, Attachment } from '../types';
import { X, Loader2, Sparkles, Paperclip, File as FileIcon, Trash2 } from 'lucide-react';
import { analyzeTicketWithGemini } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

interface NewTicketModalProps {
  currentUser: User;
  onClose: () => void;
  onCreate: (ticketData: any) => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({ currentUser, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Fields for manual entry if needed, or AI suggested
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.MEDIUM);
  const [category, setCategory] = useState<TicketCategory>(TicketCategory.OTHER);

  // Attachment State
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const newFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async (ticketId: string): Promise<Attachment[]> => {
      if (files.length === 0) return [];
      setIsUploading(true);
      const uploadedAttachments: Attachment[] = [];

      try {
          for (const file of files) {
              const filePath = `${ticketId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
              
              const { data, error } = await supabase.storage
                .from('ticket-attachments')
                .upload(filePath, file);

              if (error) {
                  console.error("Error uploading file:", file.name, error);
                  continue;
              }

              const { data: publicUrlData } = supabase.storage
                .from('ticket-attachments')
                .getPublicUrl(filePath);

              uploadedAttachments.push({
                  name: file.name,
                  url: publicUrlData.publicUrl,
                  type: file.type,
                  size: file.size
              });
          }
      } catch (err) {
          console.error("Upload failed", err);
      } finally {
          setIsUploading(false);
      }
      return uploadedAttachments;
  };

  const handleSmartCreate = async () => {
    if (!title || !description) return;
    
    setIsAnalyzing(true);
    let aiData = null;
    let finalPriority = priority;
    let finalCategory = category;
    
    // Pre-analyze using Gemini
    if (process.env.API_KEY) {
        const analysis = await analyzeTicketWithGemini(title, description);
        if (analysis) {
            aiData = analysis;
            finalPriority = analysis.suggestedPriority;
            finalCategory = analysis.suggestedCategory;
        }
    }

    // Generate ID
    const ticketId = `T-${Math.floor(Math.random() * 10000)}`;

    // Upload Files
    const attachments = await uploadAttachments(ticketId);

    const newTicket = {
        id: ticketId,
        title,
        description,
        requester: currentUser.name,
        ownerEmail: currentUser.email,
        status: TicketStatus.OPEN,
        priority: finalPriority,
        category: finalCategory,
        aiAnalysis: aiData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        attachments: attachments
    };

    onCreate(newTicket);
    setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Novo Chamado</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between text-sm text-blue-800">
             <span>Solicitante:</span>
             <span className="font-semibold">{currentUser.name}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título do Problema</label>
            <input 
                type="text" 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Breve resumo do problema"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none"
                >
                    <option value="BUG">Erro / Bug</option>
                    <option value="FEATURE_REQUEST">Nova Funcionalidade</option>
                    <option value="BILLING">Faturamento</option>
                    <option value="SUPPORT">Suporte</option>
                    <option value="OTHER">Outro</option>
                </select>
             </div>
             
             {/* Priority - Only visible for DEV */}
             {currentUser.role === 'DEV' && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                    <select 
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none"
                    >
                        <option value="LOW">Baixa</option>
                        <option value="MEDIUM">Média</option>
                        <option value="HIGH">Alta</option>
                        <option value="CRITICAL">Crítica</option>
                    </select>
                 </div>
             )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea 
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
                placeholder="Explicação detalhada..."
                value={description}
                onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Attachment Section */}
          <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Anexos</label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-center cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Paperclip className="w-6 h-6" />
                      <span className="text-xs font-medium">Clique ou arraste arquivos aqui</span>
                  </div>
              </div>

              {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded-lg text-sm">
                              <div className="flex items-center gap-2 truncate">
                                  <FileIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                  <span className="truncate max-w-[200px] text-slate-600">{file.name}</span>
                                  <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                              </div>
                              <button onClick={() => removeFile(index)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                  </div>
              )}
          </div>
          
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3 bg-white">
             <button 
                onClick={onClose}
                disabled={isAnalyzing || isUploading}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
             >
                Cancelar
             </button>
             <button 
                onClick={handleSmartCreate}
                disabled={!title || !description || isAnalyzing || isUploading}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
             >
                {isAnalyzing || isUploading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isUploading ? 'Enviando Arquivos...' : 'Criando...'}
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4" />
                        Criar Chamado
                    </>
                )}
             </button>
        </div>
      </div>
    </div>
  );
};
