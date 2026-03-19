import React, { useState, useEffect } from 'react';
import { Recipe, Category } from '../types';
import { storageService } from '../services/storageService';

interface DashboardOverviewProps {
  recipes: Recipe[];
  categories: Category[];
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ recipes, categories, onNavigate }) => {
  const [storyCount, setStoryCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExtraStats = async () => {
      try {
        const stories = await storageService.getStories();
        setStoryCount(stories.length);
      } catch (error) {
         console.error(error);
      } finally {
         setLoading(false);
      }
    };
    fetchExtraStats();
  }, []);

  const totalViews = recipes.reduce((acc, recipe) => {
    // Estimativa de visualizações baseada no ID (mesma lógica determinística do RecipeDetail)
    const idSum = recipe.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return acc + (1000 + (idSum % 4000));
  }, 0);

  const totalFavorites = recipes.filter(r => r.tags?.includes('favorito')).length; // Simulação simples

  return (
    <div className="max-w-6xl mx-auto animate-fade-in p-2 md:p-6">
      <div className="mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-pop-dark tracking-tight">
          Bem-vindo de volta, Chef! 👨‍🍳
        </h2>
        <p className="text-gray-500 mt-2 text-lg">Aqui está o resumo da sua cozinha digital hoje.</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
           <div className="absolute -right-6 -top-6 bg-red-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
           <div className="relative z-10 flex justify-between items-start">
             <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Receitas</p>
                <h3 className="text-4xl font-black text-pop-dark">{recipes.length}</h3>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-pop-red text-white flex items-center justify-center shadow-md shadow-red-200">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
             </div>
           </div>
           <button onClick={() => onNavigate('recipes')} className="relative z-10 text-pop-red text-xs font-bold mt-4 hover:underline flex items-center gap-1">
             Gerenciar Receitas <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
           <div className="absolute -right-6 -top-6 bg-yellow-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
           <div className="relative z-10 flex justify-between items-start">
             <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Categorias</p>
                <h3 className="text-4xl font-black text-pop-dark">{categories.length}</h3>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-pop-yellow text-white flex items-center justify-center shadow-md shadow-yellow-200">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
             </div>
           </div>
           <button onClick={() => onNavigate('categories')} className="relative z-10 text-pop-yellow text-xs font-bold mt-4 hover:underline flex items-center gap-1">
             Editar Categorias <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
           <div className="absolute -right-6 -top-6 bg-purple-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
           <div className="relative z-10 flex justify-between items-start">
             <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Web Stories</p>
                <h3 className="text-4xl font-black text-pop-dark">{loading ? '...' : storyCount}</h3>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-200">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
             </div>
           </div>
           <button onClick={() => onNavigate('stories')} className="relative z-10 text-purple-500 text-xs font-bold mt-4 hover:underline flex items-center gap-1">
             Ver Web Stories <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
           <div className="absolute -right-6 -top-6 bg-green-50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
           <div className="relative z-10 flex justify-between items-start">
             <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Acessos Est.</p>
                <h3 className="text-4xl font-black text-pop-dark">{(totalViews / 1000).toFixed(1)}k</h3>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-md shadow-green-200">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             </div>
           </div>
           <button onClick={() => onNavigate('settings')} className="relative z-10 text-green-500 text-xs font-bold mt-4 hover:underline flex items-center gap-1">
             Configurar Analytics <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
           </button>
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="mb-8">
         <h3 className="text-xl font-bold text-pop-dark mb-4 filter drop-shadow-sm">Ações Rápidas</h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => onNavigate('create-ai')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-pop-red transition-all group">
               <div className="w-14 h-14 rounded-full bg-red-50 text-pop-red flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <span className="font-bold text-gray-700 text-sm">Criar com IA</span>
            </button>
            <button onClick={() => onNavigate('import')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all group">
               <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
               </div>
               <span className="font-bold text-gray-700 text-sm">Importar WP</span>
            </button>
            <button onClick={() => onNavigate('social')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-purple-500 transition-all group">
               <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
               </div>
               <span className="font-bold text-gray-700 text-sm">Postar Social</span>
            </button>
            <button onClick={() => onNavigate('ads')} className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-green-500 transition-all group">
               <div className="w-14 h-14 rounded-full bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <span className="font-bold text-gray-700 text-sm">Anúncios</span>
            </button>
         </div>
      </div>
      
    </div>
  );
};
