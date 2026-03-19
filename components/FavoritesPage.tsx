
import React, { useState } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface FavoritesPageProps {
  recipes: Recipe[];
  onOpenRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({ 
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
      
      {/* Header */}
      <div className="bg-pop-yellow/10 pt-24 pb-16 px-4 border-b border-pop-yellow/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button 
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-gray-500 hover:text-pop-dark transition-colors text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-pop-dark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar ao Início
          </button>

          <h1 className="text-4xl md:text-6xl font-serif font-black text-pop-dark mb-4 tracking-tight">
            Meu Livro de Receitas
          </h1>
          <p className="text-xl text-gray-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Seus pratos favoritos, salvos e prontos para cozinhar.
          </p>
          
          <div className="mt-8 flex justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400">
             <span>{visibleRecipes.length} de {recipes.length} Receitas Salvas</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {recipes.length > 0 ? (
          <>
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
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
             <div className="text-6xl mb-6">❤️</div>
             <h3 className="text-2xl font-bold text-pop-dark mb-2">Seu livro está vazio!</h3>
             <p className="text-gray-500 font-serif italic max-w-md mx-auto">
               Clique no ícone de salvar nas receitas que você ama para encontrá-las facilmente aqui depois.
             </p>
             <button 
               onClick={onBack}
               className="mt-8 px-8 py-3 bg-pop-dark text-white rounded-full font-bold hover:bg-black transition-colors"
             >
               Explorar Receitas
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
