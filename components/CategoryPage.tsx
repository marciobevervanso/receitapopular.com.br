
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface CategoryPageProps {
  categoryName: string;
  categoryImage: string;
  recipes: Recipe[];
  onOpenRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ 
  categoryName, 
  categoryImage, 
  recipes, 
  onOpenRecipe, 
  onBack 
}) => {
  const [visibleCount, setVisibleCount] = useState(12);

  // Reset pagination when category changes
  useEffect(() => {
    setVisibleCount(12);
  }, [categoryName]);

  // Filter logic: Match category name with tags (case insensitive partial match)
  const filteredRecipes = recipes.filter(r => 
    r.tags.some(tag => categoryName.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(categoryName.toLowerCase()))
  );

  const visibleRecipes = filteredRecipes.slice(0, visibleCount);
  const hasMore = visibleCount < filteredRecipes.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in pb-20">
      
      {/* Immersive Category Header */}
      <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden">
        <img 
          src={categoryImage} 
          alt={categoryName} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gray-900/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16">
          <button 
            onClick={onBack}
            className="absolute top-8 left-4 md:left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full border border-white/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar
          </button>

          <span className="text-pop-yellow font-black text-sm uppercase tracking-[0.2em] mb-4 animate-fade-in">
            Coleção Editorial
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight shadow-black drop-shadow-lg">
            {categoryName}
          </h1>
          <p className="text-xl text-gray-200 font-serif italic max-w-2xl leading-relaxed">
            Explorando os sabores, texturas e aromas que fazem de {categoryName.toLowerCase()} uma experiência inesquecível na cozinha.
          </p>
        </div>
      </div>

      {/* Breadcrumb / Filter Bar */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
           <div className="text-sm font-medium text-gray-500">
             Mostrando <span className="font-bold text-pop-dark">{visibleRecipes.length}</span> de <span className="font-bold text-pop-dark">{filteredRecipes.length}</span> receitas em <span className="font-bold text-pop-dark">{categoryName}</span>
           </div>
           <div className="hidden md:flex gap-4">
              <select className="bg-transparent text-sm font-bold text-gray-600 focus:outline-none cursor-pointer">
                <option>Mais recentes</option>
                <option>Mais populares</option>
                <option>Tempo de preparo</option>
              </select>
           </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {filteredRecipes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
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
                  Carregar Mais Receitas
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
             <div className="text-6xl mb-6">👨‍🍳</div>
             <h3 className="text-2xl font-bold text-pop-dark mb-2">O forno ainda está aquecendo!</h3>
             <p className="text-gray-500 font-serif italic max-w-md mx-auto">
               Ainda não temos receitas publicadas nesta categoria. Nossos chefs estão trabalhando nisso.
             </p>
             <button 
               onClick={onBack}
               className="mt-8 px-8 py-3 bg-pop-dark text-white rounded-full font-bold hover:bg-black transition-colors"
             >
               Voltar ao Início
             </button>
          </div>
        )}
      </div>

    </div>
  );
};
