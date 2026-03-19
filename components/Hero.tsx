
import React, { useMemo } from 'react';
import { Recipe, SiteSettings, Language } from '../types';
import { t } from '../utils/i18n';

interface HeroProps {
  recipes?: Recipe[];
  settings?: SiteSettings;
  language: Language;
  onOpenRecipe: (recipe: Recipe) => void;
}

export const Hero: React.FC<HeroProps> = ({ recipes = [], settings, language, onOpenRecipe }) => {
  
  // Logic: Rotate recipe every 2 days (48 hours) OR show selected fixed ones
  const heroRecipe = useMemo(() => {
    if (recipes.length === 0) return null;

    let pool = recipes;

    // 1. Check if user has explicitly selected recipes in Dashboard
    if (settings?.heroRecipeIds && Array.isArray(settings.heroRecipeIds) && settings.heroRecipeIds.length > 0) {
       const selectedRecipes = recipes.filter(r => settings.heroRecipeIds!.includes(r.id));
       
       if (selectedRecipes.length > 0) {
         pool = selectedRecipes;
       }
    }

    // 2. If only one recipe is available
    if (pool.length === 1) {
      return pool[0];
    }

    // 3. If multiple, rotate every 48h
    const twoDayBlock = Math.floor(Date.now() / (1000 * 60 * 60 * 48));
    return pool[twoDayBlock % pool.length];

  }, [recipes, settings]);

  if (!heroRecipe) {
     return <div className="h-[400px] md:h-[500px] bg-pop-gray/30 animate-pulse"></div>;
  }

  return (
    <div className="relative bg-pop-gray/30 overflow-hidden content-visibility-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 md:pt-16 md:pb-20">
        
        {/* Magazine Layout */}
        <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl shadow-gray-200/50 grid md:grid-cols-12 min-h-[400px] md:min-h-[500px]">
          
          {/* Image Side (Right on Desktop) */}
          <div 
            className="md:col-span-7 relative h-56 md:h-full order-1 md:order-2 cursor-pointer group"
            onClick={() => onOpenRecipe(heroRecipe)}
          >
            <img 
              src={heroRecipe.imageUrl} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt={heroRecipe.title}
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 md:bg-gradient-to-l md:from-transparent md:to-white/10 to-transparent opacity-60"></div>
          </div>

          {/* Content Side (Left) */}
          <div className="md:col-span-5 relative z-10 p-6 md:p-12 flex flex-col justify-center order-2 md:order-1 bg-white">
             <div className="inline-flex items-center gap-2 mb-3 md:mb-4">
                <span className="px-2 py-1 md:px-3 rounded-full bg-pop-yellow text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm">
                  {heroRecipe.tags[0] || t(language, 'highlight')}
                </span>
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.42V7z"/></svg>
                  {heroRecipe.totalTime || heroRecipe.prepTime}
                </span>
             </div>

             <h1 
               className="text-3xl md:text-5xl font-black text-pop-dark leading-[1.1] mb-4 md:mb-6 font-serif line-clamp-3 cursor-pointer hover:text-pop-red transition-colors"
               onClick={() => onOpenRecipe(heroRecipe)}
             >
               {heroRecipe.title}
             </h1>

             <p className="text-gray-500 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed font-serif italic line-clamp-3">
               "{heroRecipe.description}"
             </p>

             <div className="flex items-center gap-4">
                <button 
                  onClick={() => onOpenRecipe(heroRecipe)}
                  className="px-6 py-3 md:px-8 md:py-3.5 bg-pop-dark text-white rounded-xl font-bold text-xs md:text-sm uppercase tracking-wide shadow-lg shadow-gray-300 hover:bg-pop-red transition-all transform hover:-translate-y-0.5 w-full md:w-auto text-center"
                >
                  {t(language, 'heroCta')}
                </button>
             </div>
          </div>
        </div>

        {/* Quick Stats Bar - Fixed Icons */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 hidden md:grid">
           {[
             { 
               label: t(language, 'totalRecipes'), 
               val: recipes.length.toString(), 
               svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg> 
             },
             { 
               label: t(language, 'categories'), 
               val: '08', 
               svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> 
             },
             { 
               label: t(language, 'activeChefs'), 
               val: '1.2k', 
               svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> 
             },
             { 
               label: t(language, 'comments'), 
               val: '850', 
               svg: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> 
             }
           ].map((stat, idx) => (
             <div key={idx} className="bg-white rounded-xl p-4 flex items-center gap-3 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-pop-gray flex items-center justify-center text-gray-500">
                  {stat.svg}
                </div>
                <div>
                  <div className="font-black text-pop-dark text-lg leading-none">{stat.val}</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{stat.label}</div>
                </div>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
};
