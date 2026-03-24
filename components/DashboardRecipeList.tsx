
import React, { useState } from 'react';
import { Recipe } from '../types';
import { storageService } from '../services/storageService';
import { generateSocialPost } from '../services/geminiService';

interface DashboardRecipeListProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onUpdate: (recipe: Recipe) => Promise<void>;
  onCreateManual: () => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
}

export const DashboardRecipeList: React.FC<DashboardRecipeListProps> = ({ 
  recipes, onEdit, onDelete, onUpdate, onCreateManual, filterDate, setFilterDate 
}) => {
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const handleShare = async (e: React.MouseEvent, recipe: Recipe) => {
    e.preventDefault();
    e.stopPropagation();
    if (sharingId) return;

    try {
      const settings = await storageService.getSettings();
      const webhookUrl = settings.n8nSocialWebhookUrl;
      
      if (!webhookUrl) {
        alert("Erro: O webhook de redes sociais do n8n não está configurado na aba 'Configurações'.");
        return;
      }

      setSharingId(recipe.id);
      
      // 1. Generate text
      const script = await generateSocialPost(recipe);

      // 2. Publish
      const payload = {
        type: 'photo',
        recipeId: recipe.id,
        title: recipe.title,
        url: `https://receitapopular.com.br/${recipe.slug}`,
        caption: `${script.hook}\n\n${script.body}\n\n${script.cta}\n\n${script.hashtags}`,
        mediaUrl: recipe.imageUrl
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`Sucesso! "${recipe.title}" enviado para o Insta/Face com texto gerado pela IA!`);
      } else {
        alert("A requisição para o n8n falhou. Verifique se o workflow está ativo.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Falha ao gerar/publicar postagem. Tente novamente.");
    } finally {
      setSharingId(null);
    }
  };

  // LOGICA DO BOTÃO RAIO (SIMPLIFICADA - DISPARO DIRETO)
  const handleOptimize = async (e: React.MouseEvent, recipe: Recipe) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Evita duplo clique
    if (optimizingId) return;

    // 1. Feedback Visual Imediato
    setOptimizingId(recipe.id);
    console.log("⚡ [UI] Botão clicado. Iniciando envio para:", recipe.title);

    try {
        // 2. Chamada Direta ao Serviço (Sem checks de tamanho, sem HEAD request, sem confirmação)
        // Isso garante que o webhook seja chamado se estiver configurado.
        const updatedRecipe = await storageService.smartOptimize(recipe);
        
        console.log("⚡ [Sucesso] Receita atualizada:", updatedRecipe);
        
        // 3. Atualiza a lista na tela
        await onUpdate(updatedRecipe);

    } catch (err: any) {
        console.error("⚡ [Erro Critical]", err);
        // Mostra o erro exato para saber o que aconteceu (ex: URL faltando, Erro 500 do N8N, etc)
        alert(`FALHA AO DISPARAR WEBHOOK:\n${err.message}\n\nVerifique:\n1. Se a URL está correta em Configurações > Integrações.\n2. Se o workflow do n8n está ativo.`);
    } finally {
        setOptimizingId(null);
    }
  };

  const filteredRecipes = recipes.filter(r => {
     if (!filterDate) return true;
     return r.datePublished === filterDate;
  });

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-pop-dark">Minhas Receitas</h2>
            <p className="text-gray-500">Gerencie seu conteúdo.</p>
          </div>
          <button onClick={onCreateManual} className="w-full md:w-auto bg-pop-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors">
            + Nova Receita
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Filtrar:</span>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              <button onClick={() => setFilterDate('')} className="text-xs text-blue-500 font-bold hover:underline">Limpar</button>
           </div>
           <div className="text-xs text-gray-400 font-bold">Total: {filteredRecipes.length}</div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative z-0">
           <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Receita</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase hidden md:table-cell">Data</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecipes.map(recipe => {
                const isWebP = recipe.imageUrl.toLowerCase().includes('.webp');
                const isPlaceholder = recipe.imageUrl.includes('placeholder') || recipe.imageUrl.includes('unsplash');
                const isOptimizing = optimizingId === recipe.id;
                
                return (
                  <tr key={recipe.id} className="hover:bg-gray-50/50 transition-colors group relative">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0 relative border border-gray-200">
                            <img src={recipe.imageUrl} className="w-full h-full object-cover" alt="" />
                            {/* Bolinha Laranja se NÃO for WebP ainda */}
                            {!isWebP && !isPlaceholder && (
                               <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full animate-pulse" title="Precisa Otimizar"></div>
                            )}
                         </div>
                         <div>
                            <div className="font-bold text-pop-dark line-clamp-1">{recipe.title}</div>
                            <div className="text-xs text-gray-400 line-clamp-1">{recipe.slug}</div>
                         </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                       <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {recipe.datePublished}
                       </span>
                    </td>
                    <td className="p-4 text-right relative z-10">
                      <div className="flex justify-end items-center gap-2 relative z-20">
                         
                         {/* BOTÃO DE OTIMIZAR INTELIGENTE (Raio) */}
                         {!isPlaceholder && (
                            <button
                              type="button"
                              onClick={(e) => handleOptimize(e, recipe)}
                              disabled={isOptimizing}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer relative z-30 shadow-sm
                                ${isWebP 
                                    ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300' // Estilo Verde (Já Otimizado/WebP)
                                    : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300' // Estilo Laranja (Falta Otimizar)
                                }
                                ${isOptimizing ? 'opacity-100 bg-gray-100' : ''}
                              `}
                              title={isWebP ? "Já é WebP. Clique para re-processar no N8N." : "Enviar para N8N (Converter)"}
                            >
                               {isOptimizing ? (
                                  <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isWebP ? 'border-green-600' : 'border-orange-600'}`}></div>
                               ) : (
                                  <span className="font-bold text-lg leading-none">⚡</span>
                               )}
                            </button>
                         )}
                         
                         {/* BOTÃO COMPARTILHAR (Mídias Sociais) */}
                         <button 
                           type="button"
                           onClick={(e) => handleShare(e, recipe)} 
                           disabled={sharingId === recipe.id}
                           className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer relative z-30 shadow-sm
                             bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100 hover:border-pink-300
                             ${sharingId === recipe.id ? 'opacity-100 bg-gray-100 border-gray-200 text-gray-400' : ''}
                           `}
                           title="Compartilhar no Insta/Face (Gera a Copy com IA e posta via N8N)"
                         >
                            {sharingId === recipe.id ? (
                               <div className="w-4 h-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin"></div>
                            ) : (
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            )}
                         </button>
                         
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); onEdit(recipe); }} 
                           className="w-9 h-9 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition-colors relative z-30"
                           title="Editar"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); onDelete(recipe.id); }} 
                           className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors relative z-30"
                           title="Excluir"
                         >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
    </div>
  );
};
