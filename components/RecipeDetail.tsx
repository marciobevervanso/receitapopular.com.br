
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, Language, AdSettings, SiteSettings } from '../types';
import { generateRecipeSchema } from '../utils/seo';
import { t } from '../utils/i18n';
import { CookModeViewer } from './CookModeViewer';
import { RecipeReviews } from './RecipeReviews';
import { MeasurementModal } from './MeasurementModal';
import { RelatedRecipes } from './RelatedRecipes';
import { RecipeFAQ } from './RecipeFAQ'; 
import { storageService } from '../services/storageService';
import { AdUnit } from './AdUnit';
import { PdfPreviewModal } from './PdfPreviewModal';
import { remixRecipe } from '../services/geminiService';
import { FoodSnapPromo } from './FoodSnapPromo'; // NEW IMPORT

interface RecipeDetailProps {
  recipe: Recipe;
  allRecipes?: Recipe[]; 
  onBack: () => void;
  language: Language;
  onOpenRecipe?: (recipe: Recipe) => void;
  adSettings?: AdSettings | null;
  settings?: SiteSettings;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ 
  recipe, 
  allRecipes = [], 
  onBack, 
  language,
  onOpenRecipe,
  adSettings,
  settings
}) => {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>(recipe);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1); 
  const [isCookMode, setIsCookMode] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false); 
  const [showPdfModal, setShowPdfModal] = useState(false);
  
  // Remix State
  const [isRemixing, setIsRemixing] = useState(false);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState('');

  useEffect(() => {
    setCurrentRecipe(recipe);
  }, [recipe]);

  useEffect(() => {
    setIsFavorite(storageService.isFavorite(currentRecipe.id));
  }, [currentRecipe.id]);

  const toggleFavorite = () => {
    const newVal = storageService.toggleFavorite(currentRecipe.id);
    setIsFavorite(newVal);
  };

  const handleShare = async () => {
    const shareData = {
      title: currentRecipe.title,
      text: currentRecipe.description,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (err) { console.log('Error sharing:', err); }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) { console.error('Failed to copy:', err); }
    }
  };

  const handleRemix = async () => {
    if (!remixPrompt.trim()) return;
    setIsRemixing(true);
    try {
      const remixed = await remixRecipe(currentRecipe, remixPrompt);
      setCurrentRecipe(remixed);
      setShowRemixModal(false);
      setRemixPrompt('');
      alert("Receita remixada com sucesso! Você pode salvá-la nos seus favoritos.");
    } catch (e) {
      alert("Não foi possível remixar a receita. Tente novamente.");
    } finally {
      setIsRemixing(false);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100; // Header height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const schemaData = generateRecipeSchema(currentRecipe);

  return (
    <div className="bg-white min-h-screen animate-fade-in pb-20 relative">
      
      {/* Remix Modal */}
      {showRemixModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowRemixModal(false)}>
           <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4 text-purple-600">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 <h3 className="font-bold text-lg">Remix AI</h3>
              </div>
              <p className="text-gray-500 text-sm mb-4">Como você quer adaptar esta receita? A IA irá reescrever os ingredientes e passos.</p>
              
              <div className="space-y-2 mb-6">
                 {['Versão Vegana', 'Sem Glúten', 'Low Carb', 'Mais Picante', 'Para 50 Pessoas'].map(opt => (
                    <button key={opt} onClick={() => setRemixPrompt(opt)} className="px-3 py-1 bg-gray-50 hover:bg-purple-50 text-xs rounded-full border border-gray-200 mr-2 mb-2 transition-colors">
                       {opt}
                    </button>
                 ))}
              </div>

              <input 
                value={remixPrompt}
                onChange={e => setRemixPrompt(e.target.value)}
                placeholder="Ex: Fazer versão vegana, adicionar bacon..."
                className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:border-purple-500 outline-none"
              />
              
              <button 
                onClick={handleRemix}
                disabled={isRemixing || !remixPrompt}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                 {isRemixing ? 'Criando Variação...' : 'Remixar Receita'}
              </button>
           </div>
        </div>
      )}

      {showPdfModal && (
        <PdfPreviewModal 
          recipe={currentRecipe} 
          onClose={() => setShowPdfModal(false)} 
        />
      )}

      {isCookMode && (
        <CookModeViewer 
          recipe={currentRecipe} 
          onClose={() => setIsCookMode(false)} 
        />
      )}

      {showConverter && (
        <MeasurementModal onClose={() => setShowConverter(false)} />
      )}
      
      {/* JSON-LD Schema for SEO */}
      <script 
        key={currentRecipe.id}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between no-print shadow-sm h-16">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-pop-red transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="hidden sm:inline">{t(language, 'back')}</span>
        </button>
        
        <div className="flex items-center gap-2 md:gap-3">
           {/* Remix Button */}
           <button 
             onClick={() => setShowRemixModal(true)}
             className="flex items-center gap-2 px-3 py-2 rounded-full bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100 transition-colors text-xs font-bold uppercase tracking-wider"
             title="Criar variação com IA"
           >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span className="hidden sm:inline">Remix AI</span>
           </button>

           <button 
             onClick={toggleFavorite}
             className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${
               isFavorite
                 ? 'bg-pop-yellow text-white border-pop-yellow' 
                 : 'border-gray-200 hover:border-pop-yellow hover:text-pop-yellow text-gray-600'
             }`}
           >
              <svg className={`w-4 h-4 ${isFavorite ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              <span className="hidden sm:inline">{isFavorite ? 'Salvo' : 'Salvar'}</span>
           </button>

           <button 
             onClick={handleShare}
             className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border border-gray-200 hover:border-pop-dark text-gray-600 text-xs font-bold uppercase tracking-wider"
           >
             {isCopied ? t(language, 'linkCopied') : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>}
           </button>

           <button 
             onClick={() => setShowPdfModal(true)} 
             className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-full border border-gray-200 hover:border-pop-red hover:text-pop-red text-gray-600 text-xs font-bold uppercase tracking-wider transition-all"
           >
             PDF
           </button>
        </div>
      </div>

      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 pb-8 text-center">
          <AdUnit 
            slotId={adSettings?.slots?.recipeTop} 
            className="mb-8 no-print" 
            label="Publicidade Topo" 
            banners={settings?.banners}
            position="recipe_top"
          />

          <span className="inline-block px-3 py-1 mb-4 md:mb-6 text-[10px] font-black tracking-widest text-pop-red uppercase bg-red-50 rounded-full border border-red-100">
            {currentRecipe.tags[0] || 'Receita'}
          </span>
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-pop-dark mb-4 md:mb-6 leading-tight font-serif">
            {currentRecipe.title}
          </h1>
          <p className="text-base md:text-xl text-gray-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            {currentRecipe.description}
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-12 mt-8 md:mt-10 pt-8 md:pt-10 border-t border-gray-100">
            {/* Meta Stats */}
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-pop-dark shadow-sm border border-gray-100">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div className="text-left">
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t(language, 'prepTime')}</div>
                  <div className="text-pop-dark font-bold font-serif text-sm md:text-lg leading-none mt-0.5">{currentRecipe.prepTime}</div>
               </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-pop-dark shadow-sm border border-gray-100">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
               </div>
               <div className="text-left">
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t(language, 'cookTime')}</div>
                  <div className="text-pop-dark font-bold font-serif text-sm md:text-lg leading-none mt-0.5">{currentRecipe.cookTime}</div>
               </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center text-pop-dark shadow-sm border border-gray-100">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               </div>
               <div className="text-left">
                  <div className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t(language, 'servings')}</div>
                  <div className="text-pop-dark font-bold font-serif text-sm md:text-lg leading-none mt-0.5">
                     {Math.round(currentRecipe.servings * portionMultiplier)}
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mb-12 md:mb-16 relative">
          <div className="rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200 aspect-[4/3] md:aspect-[21/10] relative bg-gray-100 mx-auto">
             <img 
               src={currentRecipe.imageUrl} 
               alt={currentRecipe.title} 
               className="absolute inset-0 w-full h-full object-cover object-center" 
             />
          </div>
          <button 
            onClick={() => setIsCookMode(true)}
            className="absolute -bottom-6 right-8 px-6 py-3 md:px-8 md:py-4 bg-pop-green text-white rounded-full font-black uppercase tracking-widest shadow-xl shadow-green-200 hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-2 md:gap-3 animate-fade-in no-print"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs md:text-base">Modo Cozinha</span>
          </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-12 gap-12 pb-20 items-start">
           
           {/* Left Content Column */}
           <div className="md:col-span-8 space-y-12">
              
              {/* Collapsible Story Section */}
              <div className="relative">
                <div className={`prose prose-lg text-gray-600 font-serif italic border-l-4 border-pop-yellow pl-6 transition-all duration-500 overflow-hidden ${isStoryExpanded ? 'max-h-none' : 'max-h-[140px]'}`}>
                   {currentRecipe.story}
                </div>
                {!isStoryExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent flex items-end justify-center">
                     <button 
                       onClick={() => setIsStoryExpanded(true)}
                       className="text-xs font-bold uppercase tracking-widest text-pop-red hover:underline bg-white/80 px-4 py-1 rounded-full mb-2"
                     >
                       Ler história completa
                     </button>
                  </div>
                )}
              </div>
              
              <AdUnit 
                slotId={adSettings?.slots?.recipeMiddle} 
                className="my-8 no-print" 
                label="Publicidade Meio"
                banners={settings?.banners}
                position="recipe_middle" 
              />

              <div id="ingredients">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-pop-dark uppercase tracking-wide">{t(language, 'ingredients')}</h3>
                    <div className="flex items-center gap-2 text-sm font-bold bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                       <span className="text-gray-400 uppercase text-[10px]">Porções:</span>
                       <button onClick={() => setPortionMultiplier(Math.max(0.5, portionMultiplier - 0.5))} className="hover:text-pop-red disabled:opacity-30 px-2 text-lg">-</button>
                       <span className="w-4 text-center">{portionMultiplier}x</span>
                       <button onClick={() => setPortionMultiplier(portionMultiplier + 0.5)} className="hover:text-pop-red px-2 text-lg">+</button>
                    </div>
                 </div>
                 <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {currentRecipe.ingredients.map((ing, idx) => (
                       <label key={idx} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0 group select-none">
                          <div className="relative flex items-center justify-center mt-1">
                             <input 
                               type="checkbox" 
                               checked={checkedIngredients.has(idx)}
                               onChange={() => {
                                  const next = new Set(checkedIngredients);
                                  if(next.has(idx)) next.delete(idx); else next.add(idx);
                                  setCheckedIngredients(next);
                               }}
                               className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-full checked:bg-pop-green checked:border-pop-green transition-all"
                             />
                             <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                          <div className={`flex-1 transition-opacity ${checkedIngredients.has(idx) ? 'opacity-40 line-through grayscale' : ''}`}>
                             <span className="font-bold text-pop-dark text-lg mr-2 font-serif">{ing.amount}</span>
                             <span className="text-gray-600 font-medium">{ing.item}</span>
                             {ing.note && <span className="block text-xs text-gray-400 italic mt-0.5">{ing.note}</span>}
                          </div>
                       </label>
                    ))}
                 </div>
                 <div className="mt-4 text-right">
                    <button onClick={() => setShowConverter(true)} className="text-xs font-bold text-pop-dark underline decoration-pop-yellow decoration-2 underline-offset-4 hover:text-pop-red">Tabela de Medidas</button>
                 </div>
              </div>

              <div id="steps">
                 <h3 className="text-2xl font-black text-pop-dark uppercase tracking-wide mb-6">{t(language, 'instructions')}</h3>
                 <div className="space-y-8 relative">
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100"></div>
                    {currentRecipe.steps.map((step, idx) => (
                       <div key={idx} className="relative pl-12 group">
                          <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border-2 border-pop-dark text-pop-dark font-black flex items-center justify-center z-10 shadow-sm group-hover:bg-pop-dark group-hover:text-white transition-colors">
                             {idx + 1}
                          </div>
                          <div className="bg-gray-50 p-6 rounded-2xl rounded-tl-none border border-gray-100 hover:shadow-md transition-shadow">
                             <p className="text-gray-700 leading-relaxed font-serif text-lg" dangerouslySetInnerHTML={{ __html: step }}></p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <AdUnit 
                slotId={adSettings?.slots?.recipeBottom} 
                className="no-print" 
                label="Publicidade Fim"
                banners={settings?.banners}
                position="recipe_bottom" 
              />
              
              {/* FAQ */}
              {currentRecipe.faq && <RecipeFAQ faqs={currentRecipe.faq} />}

              <RecipeReviews recipeId={currentRecipe.id} initialReviews={currentRecipe.reviews} />
           </div>

           {/* Right Sticky Sidebar */}
           <div className="md:col-span-4 space-y-8 md:sticky md:top-24 h-fit">
              
              {/* FOODSNAP PROMO - VERTICAL */}
              <FoodSnapPromo variant="sidebar" />

              <div className="bg-pop-dark text-white p-8 rounded-3xl relative overflow-hidden shadow-xl">
                 <div className="relative z-10">
                    <h4 className="font-black uppercase tracking-widest text-sm text-pop-yellow mb-6">Nutrição (por porção)</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-gray-400">Calorias</span>
                          <span className="text-2xl font-black">{Math.round(currentRecipe.nutrition.calories)}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-gray-400">Proteína</span>
                          <span className="font-bold">{currentRecipe.nutrition.protein}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/10 pb-2">
                          <span className="text-gray-400">Carboidratos</span>
                          <span className="font-bold">{currentRecipe.nutrition.carbs}</span>
                       </div>
                       <div className="flex justify-between items-center pb-2">
                          <span className="text-gray-400">Gorduras</span>
                          <span className="font-bold">{currentRecipe.nutrition.fat}</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* AFFILIATES IN SIDEBAR BELOW NUTRITION */}
              {currentRecipe.affiliates && currentRecipe.affiliates.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm no-print animate-fade-in">
                   <h3 className="text-sm font-black text-pop-dark uppercase tracking-wide mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                      <svg className="w-5 h-5 text-pop-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                      {t(language, 'kitchenEssentials')}
                   </h3>
                   <div className="space-y-4">
                      {currentRecipe.affiliates.map((product, idx) => (
                         <a 
                           key={idx} 
                           href={product.url} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 hover:border-pop-yellow hover:bg-gray-50 transition-all group bg-white"
                         >
                            <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-xl group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                               {product.imageUrl ? (
                                  <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                               ) : (
                                  <span>🎁</span>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="font-bold text-pop-dark text-xs leading-tight group-hover:text-pop-red transition-colors line-clamp-2">{product.name}</div>
                               <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                 <span className="uppercase font-bold tracking-wider">Ver oferta</span>
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                               </div>
                            </div>
                         </a>
                      ))}
                   </div>
                </div>
              )}

              <AdUnit 
                slotId={adSettings?.slots?.sidebar} 
                className="no-print" 
                label="Publicidade Lateral"
                banners={settings?.banners}
                position="sidebar" 
              />
           </div>
        </div>

        <RelatedRecipes 
          currentRecipeId={currentRecipe.id} 
          currentTags={currentRecipe.tags} 
          allRecipes={allRecipes} 
          onOpenRecipe={onOpenRecipe || (() => {})} 
        />

      </div>

      {/* Mobile Floating Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex justify-between gap-2 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50">
         <button 
           onClick={() => scrollToSection('ingredients')}
           className="flex-1 py-3 bg-gray-50 rounded-xl text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-100"
         >
           Ingredientes
         </button>
         <button 
           onClick={() => scrollToSection('steps')}
           className="flex-1 py-3 bg-gray-50 rounded-xl text-xs font-bold uppercase tracking-wide text-gray-600 hover:bg-gray-100"
         >
           Preparo
         </button>
         <button 
           onClick={() => setIsCookMode(true)}
           className="flex-1 py-3 bg-pop-green text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-green-100"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           Play
         </button>
      </div>

    </div>
  );
};
