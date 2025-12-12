
import React from 'react';
import { Category } from '../types';

interface AllCategoriesPageProps {
  categories: Category[];
  onOpenCategory: (category: Category) => void;
  onBack: () => void;
}

export const AllCategoriesPage: React.FC<AllCategoriesPageProps> = ({ 
  categories, 
  onOpenCategory, 
  onBack 
}) => {
  return (
    <div className="min-h-screen bg-white animate-fade-in pb-20">
      
      {/* Header */}
      <div className="bg-pop-gray/30 pt-24 pb-16 px-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button 
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-gray-500 hover:text-pop-red transition-colors text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-pop-red"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar
          </button>

          <h1 className="text-4xl md:text-6xl font-serif font-black text-pop-dark mb-4 tracking-tight">
            Explore por Categorias
          </h1>
          <p className="text-xl text-gray-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Navegue pelos sabores e encontre exatamente o que você deseja cozinhar hoje.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => onOpenCategory(cat)}
              className="group relative overflow-hidden rounded-3xl aspect-square shadow-sm hover:shadow-xl transition-all duration-500 text-left"
            >
              <img 
                src={cat.img} 
                alt={cat.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              
              <div className="absolute bottom-0 left-0 p-6 w-full">
                 <h3 className="text-xl md:text-2xl font-serif font-bold text-white mb-1 group-hover:text-pop-yellow transition-colors">
                   {cat.name}
                 </h3>
                 <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <span>Ver Receitas</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                 </div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
