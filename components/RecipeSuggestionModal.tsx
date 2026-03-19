
import React, { useState } from 'react';
import { RecipeSuggestion } from '../types';
import { storageService } from '../services/storageService';

interface RecipeSuggestionModalProps {
  onClose: () => void;
}

export const RecipeSuggestionModal: React.FC<RecipeSuggestionModalProps> = ({ onClose }) => {
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [userName, setUserName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    setSubmitting(true);
    try {
      const suggestion: RecipeSuggestion = {
        id: Date.now().toString(),
        dishName,
        description,
        suggestedBy: userName || 'Anônimo',
        date: new Date().toISOString(),
        status: 'pending'
      };

      await storageService.submitSuggestion(suggestion);
      alert('Sugestão enviada! Obrigado por colaborar com nossa comunidade.');
      onClose();
    } catch (e) {
      alert('Erro ao enviar sugestão. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        
        <div className="bg-pop-yellow/20 p-6 text-center border-b border-pop-yellow/10">
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-3xl">
              💡
           </div>
           <h3 className="text-2xl font-black text-pop-dark mb-1">Sugira uma Receita</h3>
           <p className="text-sm text-gray-600">O que você gostaria de ver aqui?</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
           <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome do Prato</label>
              <input 
                value={dishName}
                onChange={e => setDishName(e.target.value)}
                placeholder="Ex: Strogonoff de Camarão"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-pop-yellow outline-none font-bold"
                required
              />
           </div>

           <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Detalhes (Opcional)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Gostaria de uma versão sem lactose e bem cremosa..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-pop-yellow outline-none h-24 resize-none"
              />
           </div>

           <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Seu Nome (Opcional)</label>
              <input 
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Como devemos te chamar?"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-pop-yellow outline-none"
              />
           </div>

           <div className="pt-2 flex gap-3">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={submitting || !dishName.trim()}
                className="flex-[2] py-3 bg-pop-dark text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar Sugestão'}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};
