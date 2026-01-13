
import React, { useState } from 'react';
import { Recipe } from '../types';
import { storageService } from '../services/storageService';

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

  const handleOptimize = async (e: React.MouseEvent, recipe: Recipe) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (optimizingId) return;

    setOptimizingId(recipe.id);
    console.log("⚡ [UI] Iniciando otimização para:", recipe.title);

    try {
        const updatedRecipe = await storageService.smartOptimize(recipe);
        console.log("⚡ [Sucesso] Receita otimizada:", updatedRecipe.title);
        // Garante que a atualização no componente pai seja refletida
        await onUpdate(updatedRecipe);
    } catch (err: any) {
        console.error("⚡ [Erro]", err);
        alert(`Não foi possível otimizar:\n${err.message}`);
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

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Filtrar:</span>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
              <button onClick={() => setFilterDate('')} className="text-xs text-blue-500 font-bold hover:underline">Limpar</button>
           </div>
           <div className="text-xs text-gray-400 font-bold">Total: {filteredRecipes.length}</div>
        </div>

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
                // LÓGICA DE DETECÇÃO DE OTIMIZAÇÃO MELHORADA
                // 1. Verifica se a flag isOptimized existe e é true
                // 2. Verifica se a URL contém o parâmetro 'opt=' que injetamos após o n8n
                const isProcessed = recipe.isOptimized === true || recipe.imageUrl.includes('opt=');
                
                const isPlaceholder = recipe.imageUrl.includes('placeholder') || recipe.imageUrl.includes('unsplash');
                const isOptimizing = optimizingId === recipe.id;
                
                return (
                  <tr key={recipe.id} className="hover:bg-gray-50/50 transition-colors group relative">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0 relative border border-gray-200">
                            <img src={recipe.imageUrl} className="w-full h-full object-cover" alt="" />
                            {!isProcessed && !isPlaceholder && (
                               <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full animate-pulse" title="Pendente de Otimização"></div>
                            )}
                            {isProcessed && (
                               <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" title="Otimizada"></div>
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
                         
                         {!isPlaceholder && (
                            <button
                              type="button"
                              onClick={(e) => handleOptimize(e, recipe)}
                              disabled={isOptimizing}
                              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer relative z-30 shadow-sm
                                ${isProcessed 
                                    ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300' 
                                    : 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100 hover:border-orange-300'
                                }
                                ${isOptimizing ? 'opacity-100 bg-gray-100 ring-2 ring-pop-yellow' : ''}
                              `}
                              title={isProcessed ? "Otimizada. Clique para reenviar." : "Otimizar via N8N"}
                            >
                               {isOptimizing ? (
                                  <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${isProcessed ? 'border-green-600' : 'border-orange-600'}`}></div>
                               ) : (
                                  <span className="font-bold text-lg leading-none">⚡</span>
                                )}
                            </button>
                         )}
                         
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
