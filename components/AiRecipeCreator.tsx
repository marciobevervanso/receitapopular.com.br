import React, { useState } from 'react';
import { Recipe } from '../types';
import { generateRecipeFromScratch, generateRecipeImage } from '../services/geminiService';
import { storageService } from '../services/storageService';
interface AiRecipeCreatorProps {
  onImportSuccess: (recipe: Recipe) => Promise<void>;
  onCancel: () => void;
}

export const AiRecipeCreator: React.FC<AiRecipeCreatorProps> = ({ onImportSuccess, onCancel }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'searching' | 'writing' | 'imaging' | 'enriching' | 'review' | 'done'>('idle');
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiStatus('searching');
    try {
      const partialRecipe: any = await generateRecipeFromScratch(aiPrompt);
      setAiStatus('imaging');
      
      const visualDesc = partialRecipe.visualDescription || `Plate of ${partialRecipe.title}`;
      let imageUrl = await generateRecipeImage(visualDesc);
      
      const slug = partialRecipe.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
      
      if (imageUrl.startsWith('data:')) {
          try {
              imageUrl = await storageService.uploadImage(imageUrl, `recipes/${slug}`);
          } catch (e) {
              console.error("Failed to upload AI image to storage", e);
          }
      }
      
      const recipe: Recipe = {
        ...partialRecipe,
        id: Date.now().toString(),
        slug,
        imageUrl,
        originalLink: `https://receitapopular.com.br/${slug}`,
        status: 'published',
        tags: partialRecipe.tags || []
      };
      
      setPendingRecipe(recipe);
      setAiStatus('review');
    } catch (err) {
      console.error(err);
      alert("Erro na IA. Tente novamente ou verifique sua chave de integração.");
      setAiStatus('idle');
    }
  };

  const handleSaveAiRecipe = async () => {
     if (pendingRecipe) {
        await onImportSuccess(pendingRecipe);
        setPendingRecipe(null);
        setAiStatus('idle');
        setAiPrompt('');
        alert("Receita mágica criada e publicada com sucesso!");
     }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
         <h2 className="text-3xl font-black text-pop-dark mb-2">Chef Virtual</h2>
         <p className="text-gray-500 font-medium">Descreva um prato, ingredientes ou uma ideia e deixe a Inteligência Artificial criar a receita completa com foto em poucos segundos.</p>
      </div>

      {!pendingRecipe ? (
         <div className="bg-white p-4 rounded-3xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
            <input 
               className="flex-1 w-full bg-gray-50 border border-gray-200 p-4 rounded-xl outline-none focus:border-pop-dark transition-colors font-medium text-gray-700 placeholder-gray-400" 
               placeholder="Ex: Um bolo de chocolate vegano bem fofinho" 
               value={aiPrompt} 
               onChange={e => setAiPrompt(e.target.value)} 
               onKeyDown={(e) => e.key === 'Enter' && aiStatus === 'idle' ? handleAiGenerate() : null}
            />
            <button 
               onClick={handleAiGenerate} 
               disabled={aiStatus !== 'idle'} 
               className="w-full md:w-auto bg-pop-dark text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
               {aiStatus === 'idle' ? (
                  <><span>✨</span> Criar Magia</>
               ) : (
                  <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     {aiStatus === 'searching' ? 'Pensando...' : 'Gerando Foto...'}
                  </>
               )}
            </button>
         </div>
      ) : (
         <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-6 border border-gray-100 animate-[slideUp_0.3s_ease-out]">
            <div className="relative h-72">
               <img src={pendingRecipe.imageUrl} className="w-full h-full object-cover" alt={pendingRecipe.title} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <div className="absolute bottom-4 left-6 right-6">
                  <span className="px-3 py-1 bg-pop-red text-white text-[10px] uppercase font-black tracking-widest rounded mb-2 inline-block">Receita Gerada</span>
                  <h3 className="text-3xl font-black text-white leading-tight drop-shadow-md">{pendingRecipe.title}</h3>
               </div>
            </div>
            <div className="p-6 md:p-8">
               <div className="flex flex-wrap gap-2 mb-6">
                  {pendingRecipe.tags.slice(0, 5).map(tag => (
                     <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase tracking-wider">{tag}</span>
                  ))}
               </div>
               
               <p className="text-gray-600 mb-8 leading-relaxed font-serif italic border-l-4 border-gray-200 pl-4">{pendingRecipe.description}</p>
               
               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setPendingRecipe(null)} className="flex-1 py-4 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-bold rounded-xl flex items-center justify-center gap-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     Descartar
                  </button>
                  <button onClick={handleSaveAiRecipe} className="flex-[2] py-4 bg-pop-green hover:bg-green-600 transition-colors text-white font-bold rounded-xl shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                     Aprovar e Publicar
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
