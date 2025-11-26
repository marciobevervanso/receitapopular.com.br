
import React, { useState, useEffect, useRef } from 'react';
import { Recipe, Language, AdSettings } from '../types';
import { generateRecipeSchema } from '../utils/seo';
import { t } from '../utils/i18n';
import { CookModeViewer } from './CookModeViewer';
import { RecipeReviews } from './RecipeReviews';
import { MeasurementModal } from './MeasurementModal';
import { RelatedRecipes } from './RelatedRecipes';
import { RecipeFAQ } from './RecipeFAQ'; 
import { storageService } from '../services/storageService';
import { AdUnit } from './AdUnit';

interface RecipeDetailProps {
  recipe: Recipe;
  allRecipes?: Recipe[]; 
  onBack: () => void;
  language: Language;
  onOpenRecipe?: (recipe: Recipe) => void;
  adSettings?: AdSettings | null;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ 
  recipe, 
  allRecipes = [], 
  onBack, 
  language,
  onOpenRecipe,
  adSettings
}) => {
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [isCopied, setIsCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [portionMultiplier, setPortionMultiplier] = useState(1); 
  const [isCookMode, setIsCookMode] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Ref for the template we want to clone
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsFavorite(storageService.isFavorite(recipe.id));
  }, [recipe.id]);

  const toggleFavorite = () => {
    const newVal = storageService.toggleFavorite(recipe.id);
    setIsFavorite(newVal);
  };

  const toggleIngredient = (index: number) => {
    const next = new Set(checkedIngredients);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setCheckedIngredients(next);
  };

  const handlePrintPdf = async () => {
    setIsGeneratingPdf(true);
    
    // @ts-ignore
    if (typeof window.html2pdf === 'undefined') {
        alert('Biblioteca PDF carregando... Tente em instantes.');
        setIsGeneratingPdf(false);
        return;
    }

    if (!pdfTemplateRef.current) {
        setIsGeneratingPdf(false);
        return;
    }

    // 1. CLONE STRATEGY: Create a copy of the template to render visibly on top of the viewport
    // This solves the "Blank Page" issue caused by hidden elements.
    const original = pdfTemplateRef.current;
    const clone = original.cloneNode(true) as HTMLElement;
    
    // 2. Style the clone to overlay the entire screen with a white background
    clone.style.display = 'block';
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.width = '210mm'; // A4 width
    clone.style.zIndex = '10000';
    clone.style.backgroundColor = '#ffffff';
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    
    // Append to body
    document.body.appendChild(clone);

    // 3. Wait for images in the clone to load (Crucial for preventing blank images)
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    }));

    // Small extra delay to ensure DOM paint
    await new Promise(r => setTimeout(r, 500));

    const opt = {
      margin:       5,
      filename:     `${recipe.slug || 'receita'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.body.scrollWidth },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
        // @ts-ignore
        await window.html2pdf().set(opt).from(clone).save();
    } catch (err) {
        console.error(err);
        alert('Erro ao gerar PDF.');
    } finally {
        // 4. Cleanup: Remove the clone
        if (document.body.contains(clone)) {
            document.body.removeChild(clone);
        }
        setIsGeneratingPdf(false);
    }
  };

  const handleNativePrint = () => {
     window.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: recipe.title,
      text: recipe.description,
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

  const getScaledAmount = (amountStr: string, multiplier: number) => {
    if (multiplier === 1) return amountStr;
    return amountStr.replace(/(\d+([.,]\d+)?)/g, (match) => {
       const num = parseFloat(match.replace(',', '.'));
       const scaled = num * multiplier;
       return Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1).replace('.', ',');
    });
  };

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const schemaData = generateRecipeSchema(recipe);

  return (
    <div className="bg-white min-h-screen animate-fade-in pb-20 relative">
      
      {/* --- PDF / PRINT TEMPLATE --- */}
      <div 
        id="pdf-template" 
        ref={pdfTemplateRef}
        className="bg-white text-pop-dark hidden print:block"
        style={{ width: '210mm', margin: '0 auto', padding: '10mm' }}
      >
         {/* ... PDF Header & Content ... */}
         <div className="flex items-center justify-between border-b-2 border-pop-red pb-4 mb-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-pop-dark text-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" /></svg>
               </div>
               <div>
                  <h1 className="text-lg font-black text-pop-dark uppercase tracking-tighter leading-none">Receita<span className="text-pop-red">Popular</span></h1>
                  <p className="text-[10px] text-gray-500 font-serif italic">receitapopular.com.br</p>
               </div>
            </div>
            <div className="text-right text-[10px] text-gray-400 uppercase font-bold tracking-widest">
               Ficha Técnica
            </div>
         </div>

         {/* Recipe Title & Meta */}
         <div className="mb-6">
            <h2 className="text-3xl font-black font-serif text-pop-dark mb-2 leading-tight">{recipe.title}</h2>
            <p className="text-sm text-gray-500 italic font-serif mb-4">{recipe.description}</p>
            
            <div className="flex gap-6 py-2 border-y border-gray-100">
               <div className="text-xs"><span className="font-bold text-gray-400 uppercase">Tempo:</span> <span className="font-bold">{recipe.totalTime || recipe.prepTime}</span></div>
               <div className="text-xs"><span className="font-bold text-gray-400 uppercase">Rendimento:</span> <span className="font-bold">{recipe.servings} porções</span></div>
               <div className="text-xs"><span className="font-bold text-gray-400 uppercase">Calorias:</span> <span className="font-bold">{recipe.nutrition.calories}</span></div>
            </div>
         </div>

         {/* Compact Image */}
         <div className="w-full h-40 overflow-hidden rounded-lg mb-6 bg-gray-100">
            <img src={recipe.imageUrl} className="w-full h-full object-cover" alt={recipe.title} crossOrigin="anonymous" />
         </div>

         {/* 2-Column Layout */}
         <div className="flex gap-8 items-start">
            
            {/* Left Column: Ingredients */}
            <div className="w-[35%]">
               <h3 className="font-bold text-sm uppercase tracking-widest text-pop-red mb-3 border-b border-gray-200 pb-1">Ingredientes</h3>
               <ul className="space-y-2 text-xs text-gray-800">
                  {recipe.ingredients.map((ing, idx) => (
                     <li key={idx} className="leading-snug">
                        <span className="font-bold">{ing.amount}</span> {ing.item}
                        {ing.note && <span className="text-gray-500 italic block text-[10px]">{ing.note}</span>}
                     </li>
                  ))}
               </ul>
               
               <div className="mt-8 p-3 bg-gray-50 rounded border border-gray-100">
                  <h4 className="font-bold text-[10px] uppercase text-gray-400 mb-1">Dica do Chef</h4>
                  <p className="text-[10px] text-gray-600 italic leading-tight">
                     {recipe.tips && recipe.tips[0] ? recipe.tips[0] : "Cozinhe com amor e paciência!"}
                  </p>
               </div>
            </div>

            {/* Right Column: Steps */}
            <div className="w-[65%]">
               <h3 className="font-bold text-sm uppercase tracking-widest text-pop-red mb-3 border-b border-gray-200 pb-1">Modo de Preparo</h3>
               <div className="space-y-3 text-xs text-gray-800">
                  {recipe.steps.map((step, idx) => (
                     <div key={idx} className="flex gap-3">
                        <span className="font-black text-gray-300 text-lg leading-none">{idx + 1}</span>
                        {/* Handle potential HTML in steps if any */}
                        <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: step }} />
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Footer */}
         <div className="mt-auto pt-8 text-center">
            <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500">
               Encontre mais receitas em receitapopular.com.br
            </div>
         </div>
      </div>
      {/* --- END PDF TEMPLATE --- */}

      {isCookMode && (
        <CookModeViewer 
          recipe={recipe} 
          onClose={() => setIsCookMode(false)} 
        />
      )}

      {showConverter && (
        <MeasurementModal onClose={() => setShowConverter(false)} />
      )}
      
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Minimal Navbar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center justify-between no-print shadow-sm h-16">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-pop-red transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          {t(language, 'back')}
        </button>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={toggleFavorite}
             className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${
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
             className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-pop-dark text-gray-600 text-xs font-bold uppercase tracking-wider"
           >
             {isCopied ? t(language, 'linkCopied') : t(language, 'share')}
           </button>

           <button 
             onClick={handlePrintPdf}
             disabled={isGeneratingPdf}
             className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-pop-red hover:text-pop-red text-gray-600 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
           >
             {isGeneratingPdf ? 'Gerando...' : 'Baixar PDF'}
           </button>
           
           <button 
             onClick={handleNativePrint}
             className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-pop-dark hover:text-pop-dark text-gray-600 text-xs font-bold uppercase tracking-wider"
             title="Imprimir"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
           </button>
        </div>
      </div>

      {/* Main Content (Screen Only) */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
          {/* AD: Top */}
          <AdUnit slotId={adSettings?.slots?.recipeTop} className="mb-8 no-print" label="Publicidade Topo" />

          <span className="inline-block px-3 py-1 mb-6 text-[10px] font-black tracking-widest text-pop-red uppercase bg-red-50 rounded-full border border-red-100">
            {recipe.tags[0] || 'Receita'}
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-pop-dark mb-6 leading-tight font-serif">
            {recipe.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-serif italic max-w-2xl mx-auto leading-relaxed">
            {recipe.description}
          </p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12 mt-10 pt-10 border-t border-gray-100">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-pop-dark shadow-sm border border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <div className="text-left">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t(language, 'prepTime')}</div>
                  <div className="text-pop-dark font-bold font-serif text-lg leading-none mt-0.5">{recipe.prepTime}</div>
               </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-pop-dark shadow-sm border border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
               </div>
               <div className="text-left">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t(language, 'cookTime')}</div>
                  <div className="text-pop-dark font-bold font-serif text-lg leading-none mt-0.5">{recipe.cookTime}</div>
               </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-gray-200"></div>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-pop-dark shadow-sm border border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
               </div>
               <div className="text-left">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t(language, 'servings')}</div>
                  <div className="text-pop-dark font-bold font-serif text-lg leading-none mt-0.5">
                     {Math.round(recipe.servings * portionMultiplier)} Pessoas
                  </div>
               </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 mb-16 relative">
          <div className="rounded-[2rem] overflow-hidden shadow-2xl shadow-gray-200 aspect-video md:aspect-[21/10] relative bg-gray-100">
             <img src={recipe.imageUrl} alt={recipe.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <button 
            onClick={() => setIsCookMode(true)}
            className="absolute -bottom-6 right-8 px-8 py-4 bg-pop-green text-white rounded-full font-black uppercase tracking-widest shadow-xl shadow-green-200 hover:bg-green-600 hover:scale-105 transition-all flex items-center gap-3 animate-fade-in no-print"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Modo Cozinha
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-[1fr_300px] gap-16">
          {/* Left Column Content */}
          <div>
            <div className="mb-16">
               <h3 className="text-xl font-black text-pop-dark mb-4 flex items-center gap-2">
                 <span className="w-8 h-1 bg-pop-yellow rounded-full"></span>
                 {t(language, 'story')}
               </h3>
               <div className="prose prose-lg prose-stone font-serif text-gray-600 leading-loose text-justify">
                  <div dangerouslySetInnerHTML={{ __html: recipe.story }} />
               </div>
            </div>

            {recipe.videoUrl && getYoutubeId(recipe.videoUrl) && (
               <div className="mb-16 no-print">
                 <h3 className="text-xl font-black text-pop-dark mb-4 flex items-center gap-2">
                    <span className="w-8 h-1 bg-pop-red rounded-full"></span>
                    Vídeo Aula
                 </h3>
                 <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-black">
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYoutubeId(recipe.videoUrl)}`} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                 </div>
               </div>
            )}

            {/* AD: Middle */}
            <AdUnit slotId={adSettings?.slots?.recipeMiddle} className="my-8 no-print" label="Publicidade Conteúdo" />

            <div className="bg-white mb-16">
              <h3 className="text-2xl font-black text-pop-dark mb-8">{t(language, 'instructions')}</h3>
              <div className="space-y-10 relative border-l-2 border-gray-100 ml-4 pl-8 py-2">
                {recipe.steps.map((step, idx) => (
                  <div key={idx} className="relative">
                     <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-2 border-pop-yellow flex items-center justify-center">
                       <div className="w-2 h-2 rounded-full bg-pop-yellow"></div>
                     </div>
                     <h4 className="font-bold text-gray-900 text-lg mb-2">Passo {idx + 1}</h4>
                     {/* Render Steps HTML if present */}
                     <div className="text-gray-600 text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: step }} />
                  </div>
                ))}
              </div>
            </div>
            
            {(recipe.tips || recipe.pairing) && (
              <div className="bg-pop-yellow/10 border-l-4 border-pop-yellow p-8 rounded-r-xl mb-16">
                 <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 rounded-full bg-pop-yellow text-pop-dark flex items-center justify-center">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                   </div>
                   <h3 className="text-xl font-black text-pop-dark">Dicas do Chef</h3>
                 </div>
                 {recipe.tips && <ul className="space-y-2 mb-6">{recipe.tips.map((tip, i) => <li key={i} className="flex gap-2 items-start text-gray-700 italic"><span className="text-pop-yellow font-bold">•</span><span>{tip}</span></li>)}</ul>}
                 {recipe.pairing && <div><h4 className="font-bold text-xs uppercase tracking-wide text-gray-400">Harmonização</h4><p className="font-serif font-bold text-pop-dark text-lg">{recipe.pairing}</p></div>}
              </div>
            )}
            
            {recipe.faq && <RecipeFAQ faqs={recipe.faq} />}
          </div>

          {/* Right Column: Ingredients & Tools */}
          <div className="space-y-10">
            {/* ... Ingredients Box ... */}
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 relative">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-pop-dark uppercase tracking-wider">{t(language, 'ingredients')}</h3>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                     <button onClick={() => setPortionMultiplier(Math.max(0.5, portionMultiplier - 0.5))} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded">-</button>
                     <span className="text-xs font-bold w-8 text-center">{portionMultiplier}x</span>
                     <button onClick={() => setPortionMultiplier(portionMultiplier + 0.5)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded">+</button>
                  </div>
               </div>
               <button onClick={() => setShowConverter(true)} className="w-full mb-6 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-white flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                  Tabela de Medidas
               </button>
               <div className="space-y-4">
                 {recipe.ingredients.map((ing, idx) => (
                   <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                     <div className="relative flex items-center pt-1">
                        <input type="checkbox" className="peer sr-only" checked={checkedIngredients.has(idx)} onChange={() => toggleIngredient(idx)} />
                        <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white peer-checked:bg-pop-green peer-checked:border-pop-green transition-colors"></div>
                        <svg className="absolute w-3 h-3 text-pop-dark left-0.5 top-1.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     </div>
                     <div className={`${checkedIngredients.has(idx) ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        <span className="font-bold text-pop-dark">{getScaledAmount(ing.amount, portionMultiplier)}</span> <span className="font-medium">{ing.item}</span>
                        {ing.note && <span className="block text-xs text-gray-400 mt-0.5 font-serif italic">{ing.note}</span>}
                     </div>
                   </label>
                 ))}
               </div>
            </div>
            
            <div className="bg-white border border-gray-100 p-6 rounded-2xl">
               <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">{t(language, 'nutrition')}</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-2xl font-black text-pop-dark">{recipe.nutrition.calories}</div><div className="text-[10px] text-gray-400 font-bold uppercase">Calorias</div></div>
                  <div><div className="text-2xl font-black text-pop-dark">{parseInt(recipe.nutrition.protein)}g</div><div className="text-[10px] text-gray-400 font-bold uppercase">Proteína</div></div>
               </div>
            </div>

            {recipe.affiliates && recipe.affiliates.length > 0 && (
               <div className="pt-6 border-t border-gray-100">
                 <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-4">{t(language, 'kitchenEssentials')}</h4>
                 <ul className="space-y-2">
                   {recipe.affiliates.map((aff, idx) => (
                      <li key={idx}>
                        <a href={aff.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 group transition-colors border border-transparent hover:border-gray-100">
                           <span className="text-sm font-bold text-gray-700 group-hover:text-pop-red transition-colors">{aff.name}</span>
                           <svg className="w-4 h-4 text-gray-300 group-hover:text-pop-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </li>
                   ))}
                 </ul>
               </div>
            )}
          </div>
        </div>

        {/* AD: Bottom */}
        <div className="max-w-4xl mx-auto px-4">
           <AdUnit slotId={adSettings?.slots?.recipeBottom} className="my-8 no-print" label="Publicidade Rodapé" />
        </div>

        <div className="max-w-4xl mx-auto px-4 mt-20">
           <RecipeReviews recipeId={recipe.id} initialReviews={recipe.reviews} />
        </div>

        {onOpenRecipe && (
          <RelatedRecipes currentRecipeId={recipe.id} currentTags={recipe.tags} allRecipes={allRecipes} onOpenRecipe={onOpenRecipe} />
        )}
      </div>
    </div>
  );
};
