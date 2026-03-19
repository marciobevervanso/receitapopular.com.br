
import React, { useRef } from 'react';
import { Recipe } from '../types';
import { RecipeCard } from './RecipeCard';

interface RecipeRowProps {
  title: string;
  subtitle?: string;
  recipes: Recipe[];
  onOpenRecipe: (recipe: Recipe) => void;
}

export const RecipeRow: React.FC<RecipeRowProps> = ({ title, subtitle, recipes, onOpenRecipe }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (recipes.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 320; 
      if (direction === 'left') {
        current.scrollLeft -= scrollAmount;
      } else {
        current.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <section className="py-12 border-b border-gray-100/50 overflow-hidden relative group/section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
           <div>
             {subtitle && <span className="text-pop-red font-black text-xs uppercase tracking-widest mb-2 block">{subtitle}</span>}
             <h2 className="text-2xl md:text-3xl font-serif font-bold text-pop-dark">{title}</h2>
           </div>
           
           <div className="hidden md:flex gap-2">
              <button 
                onClick={() => scroll('left')}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-pop-dark hover:text-white hover:border-pop-dark transition-all shadow-sm active:scale-95 z-10 bg-white"
                title="Anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={() => scroll('right')}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-pop-dark hover:text-white hover:border-pop-dark transition-all shadow-sm active:scale-95 z-10 bg-white"
                title="Próximo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
           </div>
        </div>

        {/* Added contain-content for performance */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar snap-x snap-mandatory scroll-smooth"
          style={{ contentVisibility: 'auto', contain: 'layout paint style' }}
        >
          {recipes.map((recipe) => (
            <div key={recipe.id} className="min-w-[280px] md:min-w-[320px] snap-center">
              <RecipeCard recipe={recipe} onClick={() => onOpenRecipe(recipe)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
