
import React, { useState, useEffect } from 'react';
import { DietPlan, Recipe, MealPlan } from '../types';
import { storageService } from '../services/storageService';
import { generateCustomDietPlan, generateRecipeFromScratch, generateRecipeImage } from '../services/geminiService';

interface MealPlansPageProps {
  allRecipes: Recipe[];
  onBack: () => void;
  onOpenRecipe: (recipe: Recipe) => void;
}

export const MealPlansPage: React.FC<MealPlansPageProps> = ({ allRecipes, onBack, onOpenRecipe }) => {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterGoal, setFilterGoal] = useState('Todos');
  const [filterLevel, setFilterLevel] = useState('Todos');
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [userGoal, setUserGoal] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Dynamic Recipe Generation State
  const [loadingRecipeFor, setLoadingRecipeFor] = useState<string | null>(null);
  const [regeneratingCover, setRegeneratingCover] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const data = await storageService.getDietPlans();
        setPlans(data);
      } catch (err) {
        console.error("Failed to load plans", err);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  // Unique Filter Options
  const goals = ['Todos', ...new Set(plans.map(p => p.goal).filter(Boolean))];
  const levels = ['Todos', ...new Set(plans.map(p => p.level).filter(Boolean))];

  // Filter Logic
  const filteredPlans = plans.filter(p => {
    const matchGoal = filterGoal === 'Todos' || p.goal === filterGoal;
    const matchLevel = filterLevel === 'Todos' || p.level === filterLevel;
    return matchGoal && matchLevel;
  });

  // Helper to find a recipe matching a query (fallback logic)
  const findRecipe = (query: string): Recipe | undefined => {
    if (!query) return undefined;
    return allRecipes.find(r => 
      r.title.toLowerCase().includes(query.toLowerCase()) || 
      r.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const handleApplyPlan = () => {
    if (!selectedPlan) return;

    if (window.confirm(`Deseja aplicar o plano "${selectedPlan.title}" ao seu Planejador? Isso substituirá o planejamento da semana atual.`)) {
      const newPlan: MealPlan = {
        weekId: 'current',
        days: {}
      };

      const dayMap: Record<string, string> = {
        mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat', sun: 'sun'
      };

      Object.entries(selectedPlan.structure).forEach(([dayKey, mealsData]) => {
        const meals = mealsData as { lunchQuery: string, dinnerQuery: string };
        const fullDayKey = dayMap[dayKey];
        if (!fullDayKey) return;

        newPlan.days[fullDayKey] = { day: fullDayKey };

        // Lunch
        const lunchRecipe = findRecipe(meals.lunchQuery);
        if (lunchRecipe) {
           newPlan.days[fullDayKey].lunch = {
             recipeId: lunchRecipe.id,
             recipeTitle: lunchRecipe.title,
             recipeImage: lunchRecipe.imageUrl
           };
        } else {
           // Create a placeholder slot even if recipe doesn't exist
           newPlan.days[fullDayKey].lunch = {
             recipeId: `custom-${Date.now()}-l`,
             recipeTitle: meals.lunchQuery,
             recipeImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop'
           };
        }

        // Dinner
        const dinnerRecipe = findRecipe(meals.dinnerQuery);
        if (dinnerRecipe) {
           newPlan.days[fullDayKey].dinner = {
             recipeId: dinnerRecipe.id,
             recipeTitle: dinnerRecipe.title,
             recipeImage: dinnerRecipe.imageUrl
           };
        } else {
           newPlan.days[fullDayKey].dinner = {
             recipeId: `custom-${Date.now()}-d`,
             recipeTitle: meals.dinnerQuery,
             recipeImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=400&auto=format&fit=crop'
           };
        }
      });

      storageService.saveMealPlan(newPlan);
      alert('Plano aplicado! Seu calendário foi atualizado.');
    }
  };

  const handleGenerateAI = async () => {
    if (!userGoal.trim()) return;
    setIsGenerating(true);
    try {
      const plan = await generateCustomDietPlan(userGoal);
      setSelectedPlan(plan);
      setShowAiModal(false);
      setUserGoal('');
      
      // Update list as well
      setPlans(prev => [plan, ...prev]);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar plano. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMissingRecipe = async (dishName: string) => {
    setLoadingRecipeFor(dishName);
    try {
      // 1. Generate text
      const partialRecipe: any = await generateRecipeFromScratch(dishName);
      
      // 2. Generate Image
      const visualDesc = partialRecipe.visualDescription || `A delicious plate of ${partialRecipe.title}`;
      const imageUrl = await generateRecipeImage(visualDesc);
      
      // 3. Upload image
      let publicUrl = imageUrl;
      if (imageUrl.startsWith('data:')) {
         publicUrl = await storageService.uploadImage(imageUrl, 'recipes/generated');
      }

      const slug = partialRecipe.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");

      const fullRecipe: Recipe = {
        ...partialRecipe,
        id: Date.now().toString(),
        slug: slug,
        originalLink: `https://receitapopular.com.br/${slug}`,
        imageUrl: publicUrl,
        status: 'published',
        tags: partialRecipe.tags || []
      };

      // 4. Save
      await storageService.saveRecipe(fullRecipe);
      
      // 5. Open
      onOpenRecipe(fullRecipe);

    } catch (e) {
      console.error(e);
      alert(`Erro ao gerar receita para "${dishName}". Tente novamente.`);
    } finally {
      setLoadingRecipeFor(null);
    }
  };

  const handleFixCoverImage = async () => {
    if (!selectedPlan) return;
    if (!window.confirm("Regenerar imagem da capa usando IA (Pro)?")) return;
    
    setRegeneratingCover(true);
    try {
       const imgPrompt = `Professional food photography for a diet plan cover: ${selectedPlan.title}. ${selectedPlan.description}. Fresh ingredients, balanced meal, bright cinematic lighting, 4k resolution, magazine style.`;
       const imgBase64 = await generateRecipeImage(imgPrompt);
       
       let publicUrl = imgBase64;
       if (imgBase64.startsWith('data:')) {
          publicUrl = await storageService.uploadImage(imgBase64, 'plans');
       }

       // Force cache bust for immediate UI update
       const timestampedUrl = `${publicUrl}?t=${Date.now()}`;

       // Update DB with the CLEAN url
       await storageService.updateDietPlan({ ...selectedPlan, imageUrl: publicUrl });

       // Update local state with the TIMESTAMPED url to force re-render
       const updatedPlan = { ...selectedPlan, imageUrl: timestampedUrl };
       setSelectedPlan(updatedPlan);
       setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));

    } catch (e) {
       console.error("Fix image error:", e);
       alert("Erro ao regenerar imagem. Verifique o console.");
    } finally {
       setRegeneratingCover(false);
    }
  };

  return (
    <div className="min-h-screen bg-white animate-fade-in pb-20 relative">
      
      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAiModal(false)}>
           <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-purple-50">
                    🤖
                 </div>
                 <h3 className="text-xl font-black text-pop-dark">Nutricionista Virtual</h3>
                 <p className="text-gray-500 text-sm">Crie um plano 100% personalizado para você.</p>
              </div>
              
              <textarea 
                value={userGoal}
                onChange={e => setUserGoal(e.target.value)}
                placeholder="Ex: Sou vegano, quero gastar pouco e preciso de marmitas para a semana toda."
                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 outline-none resize-none mb-4 text-sm"
              />

              <button 
                onClick={handleGenerateAI}
                disabled={isGenerating || !userGoal.trim()}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
              >
                 {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Criando Plano...</span>
                    </>
                 ) : 'Gerar Plano'}
              </button>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 pt-24 pb-16 px-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <button 
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-2 text-gray-500 hover:text-pop-dark transition-colors text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-gray-200 bg-white hover:border-pop-dark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar
          </button>

          <h1 className="text-4xl md:text-6xl font-serif font-black text-pop-dark mb-4 tracking-tight">
            Planos de Alimentação
          </h1>
          <p className="text-xl text-gray-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            Cardápios completos para sua semana. Siga o plano ou use nossas receitas.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      {!selectedPlan && (
        <div className="border-b border-gray-100 bg-white sticky top-0 z-30 shadow-sm">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-4 items-center justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Objetivo:</span>
                 <select 
                   value={filterGoal}
                   onChange={e => setFilterGoal(e.target.value)}
                   className="bg-transparent text-sm font-bold text-pop-dark focus:outline-none cursor-pointer"
                 >
                    {goals.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nível:</span>
                 <select 
                   value={filterLevel}
                   onChange={e => setFilterLevel(e.target.value)}
                   className="bg-transparent text-sm font-bold text-pop-dark focus:outline-none cursor-pointer"
                 >
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                 </select>
              </div>
           </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {loading ? (
           <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-pop-dark rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 font-bold text-sm">Carregando Planos...</p>
           </div>
        ) : selectedPlan ? (
           // DETAIL VIEW
           <div className="animate-slide-up">
              <div className="mb-10">
                 <button onClick={() => setSelectedPlan(null)} className="text-sm font-bold text-gray-500 hover:text-pop-dark mb-6 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 w-fit">
                    &larr; Escolher outro plano
                 </button>
                 
                 <div className="flex flex-col md:flex-row gap-8 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                    <div className="w-full md:w-1/3 relative group">
                        <img src={selectedPlan.imageUrl} className="w-full h-full rounded-3xl object-cover aspect-[4/3] shadow-md" alt={selectedPlan.title} />
                        <button 
                          onClick={handleFixCoverImage}
                          disabled={regeneratingCover}
                          className="absolute top-2 right-2 bg-white/80 p-2 rounded-full shadow-sm hover:bg-white text-gray-500 hover:text-pop-dark opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Regenerar Capa (Corrigir Imagem)"
                        >
                           {regeneratingCover ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        </button>
                    </div>
                    <div className="flex-1 py-2">
                       <div className="flex gap-2 mb-4">
                          <span className="px-3 py-1 bg-pop-dark text-white rounded-full text-[10px] font-bold uppercase tracking-wide">
                             {selectedPlan.goal}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wide">
                             {selectedPlan.duration}
                          </span>
                       </div>
                       <h2 className="text-3xl md:text-4xl font-black text-pop-dark mb-4 leading-tight">{selectedPlan.title}</h2>
                       <p className="text-lg text-gray-500 mb-8 font-serif leading-relaxed max-w-2xl">{selectedPlan.description}</p>
                       
                       <button 
                         onClick={handleApplyPlan}
                         className="px-8 py-4 bg-pop-green text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-600 transition-all hover:-translate-y-1 flex items-center gap-3 w-full md:w-auto justify-center"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span>Seguir este Plano</span>
                       </button>
                       <p className="text-xs text-gray-400 mt-2 text-center md:text-left pl-1">Adiciona ao seu planejador semanal.</p>
                    </div>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {selectedPlan.structure && Object.entries(selectedPlan.structure).map(([day, mealsData]) => {
                    const meals = mealsData as { lunchQuery: string, dinnerQuery: string };
                    const lunchRecipe = findRecipe(meals.lunchQuery);
                    const dinnerRecipe = findRecipe(meals.dinnerQuery);
                    
                    return (
                       <div key={day} className="border-2 border-gray-100 rounded-[2rem] p-6 bg-white hover:border-gray-200 transition-colors">
                          <h3 className="font-black text-pop-dark text-lg mb-6 flex items-center gap-2">
                             <span className="w-2 h-6 bg-pop-dark rounded-full"></span>
                             {day === 'mon' ? 'Segunda' : day === 'tue' ? 'Terça' : day === 'wed' ? 'Quarta' : day === 'thu' ? 'Quinta' : day === 'fri' ? 'Sexta' : day === 'sat' ? 'Sábado' : 'Domingo'}
                          </h3>
                          
                          <div className="space-y-8">
                             {/* ALMOÇO */}
                             <div>
                                <div className="flex items-center gap-2 mb-2">
                                   <span className="text-[10px] font-black text-pop-yellow uppercase tracking-widest bg-yellow-50 px-2 py-0.5 rounded">Almoço</span>
                                   <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                
                                {/* NOME DA REFEIÇÃO (TEXTO PURO) */}
                                <p className="text-xl font-serif font-bold text-pop-dark leading-tight mb-2">{meals.lunchQuery}</p>
                                
                                {/* SUGESTÃO OPCIONAL */}
                                {lunchRecipe ? (
                                   <div onClick={() => onOpenRecipe(lunchRecipe)} className="mt-3 flex items-center gap-3 p-2 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-white hover:shadow-md transition-all group">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                                         <img src={lunchRecipe.imageUrl} className="w-full h-full object-cover" alt="" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Sugestão do Site</p>
                                         <p className="text-xs font-bold text-pop-red flex items-center gap-1 group-hover:underline">
                                            Ver Receita <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                         </p>
                                      </div>
                                   </div>
                                ) : (
                                   <button 
                                     onClick={() => handleGenerateMissingRecipe(meals.lunchQuery)}
                                     disabled={loadingRecipeFor === meals.lunchQuery}
                                     className="mt-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                   >
                                      {loadingRecipeFor === meals.lunchQuery ? (
                                         <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                         <span>✨</span>
                                      )}
                                      Gerar Receita Agora
                                   </button>
                                )}
                             </div>

                             {/* JANTAR */}
                             <div>
                                <div className="flex items-center gap-2 mb-2">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">Jantar</span>
                                   <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                
                                <p className="text-xl font-serif font-bold text-pop-dark leading-tight mb-2">{meals.dinnerQuery}</p>
                                
                                {dinnerRecipe ? (
                                   <div onClick={() => onOpenRecipe(dinnerRecipe)} className="mt-3 flex items-center gap-3 p-2 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-white hover:shadow-md transition-all group">
                                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative">
                                         <img src={dinnerRecipe.imageUrl} className="w-full h-full object-cover" alt="" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                         <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Sugestão do Site</p>
                                         <p className="text-xs font-bold text-pop-red flex items-center gap-1 group-hover:underline">
                                            Ver Receita <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                         </p>
                                      </div>
                                   </div>
                                ) : (
                                   <button 
                                     onClick={() => handleGenerateMissingRecipe(meals.dinnerQuery)}
                                     disabled={loadingRecipeFor === meals.dinnerQuery}
                                     className="mt-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                   >
                                      {loadingRecipeFor === meals.dinnerQuery ? (
                                         <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                      ) : (
                                         <span>✨</span>
                                      )}
                                      Gerar Receita Agora
                                   </button>
                                )}
                             </div>
                          </div>
                       </div>
                    );
                 })}
              </div>
           </div>
        ) : (
           // LIST VIEW
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* AI Creator Card */}
              <div 
                onClick={() => setShowAiModal(true)}
                className="group bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col h-full text-white relative border-4 border-white/20"
              >
                 <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
                 <div className="p-8 flex flex-col flex-1 justify-center items-center text-center relative z-10">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform border border-white/30">
                       ✨
                    </div>
                    <h3 className="text-2xl font-black mb-2">Criar com IA</h3>
                    <p className="text-purple-100 text-sm leading-relaxed mb-8">
                       Não encontrou o que queria? Peça para nossa IA criar um plano sob medida para sua rotina.
                    </p>
                    <span className="px-8 py-3 bg-white text-purple-600 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-purple-50 transition-colors shadow-lg">
                       Começar Agora
                    </span>
                 </div>
              </div>

              {filteredPlans.map(plan => (
                 <div 
                   key={plan.id}
                   onClick={() => setSelectedPlan(plan)}
                   className="group bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col h-full"
                 >
                    <div className="relative h-56 overflow-hidden">
                       <img src={plan.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={plan.title} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-pop-dark uppercase tracking-widest shadow-sm flex items-center gap-1">
                          <svg className="w-3 h-3 text-pop-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {plan.duration}
                       </div>
                       <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-2xl font-black text-white leading-tight drop-shadow-md group-hover:text-pop-yellow transition-colors">{plan.title}</h3>
                       </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                       <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{plan.description}</p>
                       <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">{plan.goal}</span>
                          <span className="w-10 h-10 rounded-full bg-pop-dark text-white flex items-center justify-center group-hover:bg-pop-green transition-colors shadow-lg">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        )}

      </div>
    </div>
  );
};
