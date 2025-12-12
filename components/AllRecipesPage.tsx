
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';
import { storageService } from '../services/storageService';

interface AllRecipesPageProps {
  recipes: Recipe[];
  onOpenRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

export const AllRecipesPage: React.FC<AllRecipesPageProps> = ({ 
  recipes, 
  onOpenRecipe, 
  onBack 
}) => {
  const [list, setList] = useState<Recipe[]>(recipes);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleLoadMore = async () => {
    setIsLoading(true);
    try {
      const more = await storageService.getRecipesPaginated(page, 12);
      if (more.length > 0) {
        setList(prev => {
           // De-duplicate in case of overlap
           const ids = new Set(prev.map(p => p.id));
           const newItems = more.filter(m => !ids.has(m.id));
           return [...prev, ...newItems];
        });
        setPage(p => p + 1);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in pb-20">
      
      {/* Header Minimalista Editorial */}
      <div className="bg-pop-gray/30 pt-24 pb-16 px-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button 
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-gray-500 hover:text-pop-red transition-colors text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-pop-red"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar ao Início
          </button>

          <h1 className="text-4xl md:text-6xl font-serif font-black text-pop-dark mb-4 tracking-tight">
            Livro de Receitas
          </h1>
          <p className="text-xl text-gray-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Explore nossa coleção completa de sabores, do café da manhã ao jantar especial.
          </p>
          
          <div className="mt-8 flex justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
             <span>Mostrando {list.length} Receitas</span>
             <span>•</span>
             <span>Atualizado Hoje</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
          {list.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onClick={() => onOpenRecipe(recipe)} 
            />
          ))}
        </div>

        {hasMore && (
          <div className="mt-16 text-center">
            <button 
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-full hover:border-pop-dark hover:text-pop-dark hover:bg-gray-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest text-xs flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>}
              {isLoading ? 'Carregando...' : 'Carregar Mais'}
            </button>
          </div>
        )}

        {list.length === 0 && (
           <div className="text-center py-20">
              <p className="text-gray-400 font-serif italic">Nenhuma receita encontrada no catálogo.</p>
           </div>
        )}
      </div>
    </div>
  );
};
