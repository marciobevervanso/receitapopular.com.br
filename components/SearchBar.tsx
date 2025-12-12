
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, Language } from '../types';
import { t } from '../utils/i18n';

interface SearchBarProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  language?: Language;
  onOpenFridgeHunter?: () => void;
}

const getFilterCategories = (lang: Language) => ({
  dietary: {
    label: t(lang, 'dietary'),
    options: ['Vegano', 'Vegetariano', 'Sem Glúten', 'Sem Lactose', 'Fit', 'Low Carb']
  },
  cuisine: {
    label: t(lang, 'cuisine'),
    options: ['Italiana', 'Brasileira', 'Americana', 'Asiática', 'Francesa', 'Mediterrânea']
  },
  method: {
    label: t(lang, 'method'),
    options: ['Forno', 'Grelhado', 'Fogão', 'Sem Cozimento', 'Airfryer', 'Panela de Pressão']
  },
  difficulty: {
    label: t(lang, 'difficulty'),
    options: ['Fácil', 'Médio', 'Difícil']
  }
});

export const SearchBar: React.FC<SearchBarProps> = ({ recipes, onSelectRecipe, language = 'pt' as Language, onOpenFridgeHunter }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // State for advanced filters
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    dietary: [],
    cuisine: [],
    method: [],
    difficulty: []
  });

  const FILTER_CATEGORIES = getFilterCategories(language);
  const TRENDING_TAGS = ['Airfryer', 'Low Carb', 'Bolo', 'Vegano', 'Jantar Rápido'];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const toggleFilter = (category: string, item: string) => {
    setSelectedFilters(prev => {
      const list = prev[category];
      const newList = list.includes(item) 
        ? list.filter(i => i !== item) 
        : [...list, item];
      return { ...prev, [category]: newList };
    });
    // Ensure results open to show filtered list
    if (!isOpen) setIsOpen(true);
  };

  const clearFilters = () => {
    setSelectedFilters({ dietary: [], cuisine: [], method: [], difficulty: [] });
    setQuery('');
  };

  const handleChipClick = (tag: string) => {
    setQuery(tag);
    setIsOpen(true);
  };

  const hasActiveFilters = (Object.values(selectedFilters) as string[][]).some(list => list.length > 0);
  const activeFilterCount = (Object.values(selectedFilters) as string[][]).reduce((acc, list) => acc + list.length, 0);

  // Search & Filter Logic
  useEffect(() => {
    const hasQuery = query.trim().length > 0;

    // If nothing to search or filter, show nothing
    if (!hasQuery && !hasActiveFilters) {
      setResults([]);
      if (!showFilters) setIsOpen(false); // Only close if filters panel is also closed
      return;
    }

    const lowerQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filtered = recipes.filter(recipe => {
      // 1. Text Search (if query exists)
      let matchesText = true;
      if (hasQuery) {
        const titleMatch = recipe.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(lowerQuery);
        // Check tags for text query
        const tagMatch = recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        // Check ingredients for text query
        const ingredientMatch = recipe.ingredients.some(ing => ing.item.toLowerCase().includes(lowerQuery));
        
        matchesText = titleMatch || tagMatch || ingredientMatch;
      }

      // 2. Advanced Filters
      const matchesFilters = Object.entries(selectedFilters).every(([category, selectedOptions]) => {
        const options = selectedOptions as string[];
        if (options.length === 0) return true;
        
        return options.some(opt => 
          recipe.tags.some(t => t.toLowerCase() === opt.toLowerCase())
        );
      });

      return matchesText && matchesFilters;
    });

    setResults(filtered);
    // Open results if we have query OR active filters
    if (hasQuery || hasActiveFilters) setIsOpen(true);

  }, [query, selectedFilters, recipes, hasActiveFilters, showFilters]);

  const handleSelect = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    setQuery('');
    setIsOpen(false);
    setShowFilters(false);
  };

  return (
    <div ref={wrapperRef} className="relative max-w-4xl mx-auto px-4 -mt-8 mb-12 z-20">
      
      {/* Search Input Bar */}
      <div className="relative shadow-xl shadow-gray-200/50 rounded-2xl bg-white transition-all duration-300 focus-within:shadow-2xl z-30">
        <div className="flex items-center px-4 md:px-6 py-4 gap-2 md:gap-4">
          
          <div className="flex-grow flex items-center min-w-0">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mr-2 md:mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="w-full bg-transparent border-none outline-none text-pop-dark placeholder-gray-400 font-medium text-base md:text-lg h-full truncate"
              placeholder={t(language, 'searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                  if (query.length > 0 || hasActiveFilters) setIsOpen(true);
              }}
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          {/* Fridge Hunter Button - Visible on all devices now */}
          {onOpenFridgeHunter && (
             <button 
               onClick={onOpenFridgeHunter}
               className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
               title="O que tem na geladeira?"
             >
                <span className="text-lg">🧊</span>
                <span className="hidden md:inline">Geladeira</span>
             </button>
          )}

          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          {/* Filter Toggle Button */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'bg-pop-dark text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            <span className="hidden md:inline">{t(language, 'filters')}</span>
            {activeFilterCount > 0 && (
              <span className="bg-pop-red text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-100 p-6 bg-white rounded-b-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-serif font-bold text-pop-dark text-lg">{t(language, 'filterResults')}</h3>
               {hasActiveFilters && (
                 <button onClick={clearFilters} className="text-xs font-bold text-pop-red hover:underline">
                   {t(language, 'clearFilters')}
                 </button>
               )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(FILTER_CATEGORIES).map(([key, category]) => (
                <div key={key}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{category.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.options.map((option) => {
                      const isActive = selectedFilters[key].includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => toggleFilter(key, option)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                            isActive
                              ? 'bg-pop-yellow text-pop-dark border-pop-yellow shadow-sm font-bold'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trending Chips */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center animate-fade-in">
         <span className="text-xs font-bold text-gray-400 uppercase self-center mr-2">Em alta:</span>
         {TRENDING_TAGS.map(tag => (
            <button 
              key={tag} 
              onClick={() => handleChipClick(tag)}
              className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs font-bold text-gray-600 hover:text-pop-red hover:border-pop-red transition-all shadow-sm active:scale-95"
            >
               {tag}
            </button>
         ))}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden animate-fade-in max-h-[60vh] overflow-y-auto z-20">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-50">
                <div className="px-6 py-3 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0 flex justify-between items-center">
                    <span>{results.length} {t(language, 'recipesFound')}</span>
                    {hasActiveFilters && <span className="text-pop-dark">{t(language, 'activeFilters')}</span>}
                </div>
                {results.map((recipe) => (
                    <div 
                        key={recipe.id} 
                        onClick={() => handleSelect(recipe)}
                        className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <img src={recipe.imageUrl} className="w-full h-full object-cover" alt={recipe.title} />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-serif font-bold text-pop-dark group-hover:text-pop-red transition-colors text-lg truncate">{recipe.title}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                                {recipe.tags.slice(0, 3).map(tag => (
                                   <span key={tag} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{tag}</span>
                                ))}
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1">
                                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                   {recipe.prepTime}
                                </span>
                            </div>
                        </div>
                        <div className="text-gray-300 group-hover:text-pop-red transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">🥘</div>
                <p className="font-serif italic mb-2 font-medium text-gray-600">{t(language, 'noResults')}</p>
                <p className="text-xs">{t(language, 'tryAdjusting')}</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-pop-dark rounded-lg text-xs font-bold transition-colors">
                    {t(language, 'clearFilters')}
                  </button>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
