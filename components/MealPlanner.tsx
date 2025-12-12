import React, { useState, useEffect } from 'react';
import { Recipe, MealPlan, MealSlot, DayPlan } from '../types';
import { storageService } from '../services/storageService';

interface MealPlannerProps {
  allRecipes: Recipe[];
  onOpenRecipe: (recipe: Recipe) => void;
}

export const MealPlanner: React.FC<MealPlannerProps> = ({ allRecipes, onOpenRecipe }) => {
  const [plan, setPlan] = useState<MealPlan>(storageService.getMealPlan());
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [isSelecting, setIsSelecting] = useState<{day: string, type: 'lunch'|'dinner'} | null>(null);

  useEffect(() => {
    const favIds = storageService.getFavoriteIds();
    const favs = allRecipes.filter(r => favIds.includes(r.id));
    setFavoriteRecipes(favs);
  }, [allRecipes]);

  const days = [
    { id: 'mon', label: 'Segunda' },
    { id: 'tue', label: 'Terça' },
    { id: 'wed', label: 'Quarta' },
    { id: 'thu', label: 'Quinta' },
    { id: 'fri', label: 'Sexta' },
    { id: 'sat', label: 'Sábado' },
    { id: 'sun', label: 'Domingo' },
  ];

  const handleSelectRecipe = (recipe: Recipe) => {
    if (!isSelecting) return;

    const slot: MealSlot = {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      recipeImage: recipe.imageUrl
    };

    const newPlan = { ...plan };
    const dayPlan = newPlan.days[isSelecting.day] || { day: isSelecting.day };
    
    if (isSelecting.type === 'lunch') dayPlan.lunch = slot;
    else dayPlan.dinner = slot;

    newPlan.days[isSelecting.day] = dayPlan;
    
    setPlan(newPlan);
    storageService.saveMealPlan(newPlan);
    setIsSelecting(null);
  };

  const clearSlot = (day: string, type: 'lunch'|'dinner') => {
    const newPlan = { ...plan };
    if (newPlan.days[day]) {
      if (type === 'lunch') delete newPlan.days[day].lunch;
      else delete newPlan.days[day].dinner;
      setPlan(newPlan);
      storageService.saveMealPlan(newPlan);
    }
  };

  const generateShoppingList = () => {
    // Collect all recipe IDs from the plan
    const ids = new Set<string>();
    (Object.values(plan.days) as DayPlan[]).forEach(day => {
      if (day.lunch) ids.add(day.lunch.recipeId);
      if (day.dinner) ids.add(day.dinner.recipeId);
    });

    const recipesInPlan = allRecipes.filter(r => ids.has(r.id));
    const allIngredients = recipesInPlan.flatMap(r => r.ingredients.map(i => `${i.amount} ${i.item}`));
    
    // Copy to clipboard
    navigator.clipboard.writeText(`Lista de Compras da Semana:\n\n${allIngredients.join('\n')}`);
    alert('Lista de compras copiada para a área de transferência!');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
       
       <div className="flex justify-between items-end mb-8">
         <div>
           <h2 className="text-3xl font-extrabold text-pop-dark font-serif">Planejador Semanal</h2>
           <p className="text-gray-500">Organize suas refeições e facilite sua rotina.</p>
         </div>
         <button onClick={generateShoppingList} className="bg-pop-green text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 shadow-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            Gerar Lista de Compras
         </button>
       </div>

       <div className="grid md:grid-cols-7 gap-4 mb-12">
          {days.map(day => {
             const dayData: Partial<DayPlan> = plan.days[day.id] || {};
             return (
               <div key={day.id} className="flex flex-col gap-4">
                  <div className="text-center font-bold text-gray-400 uppercase text-xs tracking-widest bg-gray-50 py-2 rounded-lg">
                     {day.label}
                  </div>
                  
                  {/* Almoço */}
                  <div className="flex-1 bg-white border border-gray-100 rounded-xl p-2 shadow-sm min-h-[140px] flex flex-col relative group">
                     <span className="text-[10px] font-bold text-pop-yellow uppercase mb-2 block">Almoço</span>
                     {dayData.lunch ? (
                        <>
                           <img src={dayData.lunch.recipeImage} className="w-full h-20 object-cover rounded-lg mb-2" alt="" />
                           <p className="text-xs font-bold text-pop-dark line-clamp-2 leading-tight">{dayData.lunch.recipeTitle}</p>
                           <button onClick={() => clearSlot(day.id, 'lunch')} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </>
                     ) : (
                        <button onClick={() => setIsSelecting({day: day.id, type: 'lunch'})} className="flex-1 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-300 hover:border-pop-yellow hover:text-pop-yellow transition-colors">
                           +
                        </button>
                     )}
                  </div>

                  {/* Jantar */}
                  <div className="flex-1 bg-white border border-gray-100 rounded-xl p-2 shadow-sm min-h-[140px] flex flex-col relative group">
                     <span className="text-[10px] font-bold text-pop-dark/50 uppercase mb-2 block">Jantar</span>
                     {dayData.dinner ? (
                        <>
                           <img src={dayData.dinner.recipeImage} className="w-full h-20 object-cover rounded-lg mb-2" alt="" />
                           <p className="text-xs font-bold text-pop-dark line-clamp-2 leading-tight">{dayData.dinner.recipeTitle}</p>
                           <button onClick={() => clearSlot(day.id, 'dinner')} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </>
                     ) : (
                        <button onClick={() => setIsSelecting({day: day.id, type: 'dinner'})} className="flex-1 border-2 border-dashed border-gray-100 rounded-lg flex items-center justify-center text-gray-300 hover:border-pop-dark hover:text-pop-dark transition-colors">
                           +
                        </button>
                     )}
                  </div>
               </div>
             )
          })}
       </div>

       {/* Selection Modal */}
       {isSelecting && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsSelecting(null)}>
             <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-pop-dark">Escolha uma Receita (Favoritos)</h3>
                   <button onClick={() => setIsSelecting(null)} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
                </div>
                
                {favoriteRecipes.length === 0 ? (
                   <div className="text-center py-10 text-gray-400">
                      <p>Você não tem favoritos ainda.</p>
                      <p className="text-sm">Salve receitas para adicioná-las ao planejador.</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar p-1">
                      {favoriteRecipes.map(recipe => (
                         <div key={recipe.id} onClick={() => handleSelectRecipe(recipe)} className="cursor-pointer group">
                            <div className="aspect-square rounded-xl overflow-hidden mb-2 relative">
                               <img src={recipe.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                               <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                            </div>
                            <p className="text-xs font-bold text-gray-700 leading-tight group-hover:text-pop-red">{recipe.title}</p>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </div>
       )}
    </div>
  );
};