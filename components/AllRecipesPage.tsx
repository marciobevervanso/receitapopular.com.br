
import React, { useState } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

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
  const [visibleCount, setVisibleCount] = useState(12);

  const visibleRecipes = recipes.slice(0, visibleCount);
  const hasMore = visibleCount < recipes.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
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
             <span>Mostrando {visibleRecipes.length} de {recipes.length} Receitas</span>
             <span>•</span>
             <span>Atualizado Hoje</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
          {visibleRecipes.map((recipe) => (
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
              className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-full hover:border-pop-dark hover:text-pop-dark hover:bg-gray-50 transition-all shadow-sm active:scale-95 uppercase tracking-widest text-xs"
            >
              Carregar Mais
            </button>
          </div>
        )}

        {recipes.length === 0 && (
           <div className="text-center py-20">
              <p className="text-gray-400 font-serif italic">Nenhuma receita encontrada no catálogo.</p>
           </div>
        )}
      </div>
    </div>
  );
};
