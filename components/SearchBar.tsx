
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, Language } from '../types';
import { t } from '../utils/i18n';
import { storageService } from '../services/storageService';

interface SearchBarProps {
  recipes: Recipe[];
  onSelectRecipe: (recipe: Recipe) => void;
  language?: Language;
  onOpenFridgeHunter?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectRecipe, language = 'pt' as Language, onOpenFridgeHunter }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Recipe[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

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

  const handleSearch = async (val: string) => {
    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);
    
    try {
      const data = await storageService.searchRecipes(val);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      handleSearch(val);
    }, 500);
  };

  const handleSelect = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative max-w-4xl mx-auto px-4 -mt-8 mb-12 z-20">
      
      {/* Search Input Bar */}
      <div className="relative shadow-xl shadow-gray-200/50 rounded-2xl bg-white transition-all duration-300 focus-within:shadow-2xl z-30">
        <div className="flex items-center px-4 md:px-6 py-4 gap-2 md:gap-4">
          
          <div className="flex-grow flex items-center min-w-0">
            {isSearching ? (
               <div className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-4 border-2 border-pop-red border-t-transparent rounded-full animate-spin shrink-0"></div>
            ) : (
               <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mr-2 md:mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
            )}
            <input
              type="text"
              className="w-full bg-transparent border-none outline-none text-pop-dark placeholder-gray-400 font-medium text-base md:text-lg h-full truncate"
              placeholder={t(language, 'searchPlaceholder')}
              value={query}
              onChange={handleInputChange}
              onFocus={() => { if(query) setIsOpen(true); }}
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

          {/* Fridge Hunter Button */}
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
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden animate-fade-in max-h-[60vh] overflow-y-auto z-20">
          {results.length > 0 ? (
            <div className="divide-y divide-gray-50">
                <div className="px-6 py-3 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0 flex justify-between items-center">
                    <span>{results.length} {t(language, 'recipesFound')}</span>
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
          ) : !isSearching && query.length > 0 ? (
            <div className="p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">🥘</div>
                <p className="font-serif italic mb-2 font-medium text-gray-600">{t(language, 'noResults')}</p>
                <p className="text-xs">{t(language, 'tryAdjusting')}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
