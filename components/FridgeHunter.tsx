
import React, { useState } from 'react';
import { generateRecipeFromIngredients, generateRecipeImage } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Recipe } from '../types';

interface FridgeHunterProps {
  onRecipeGenerated: (recipe: Recipe) => void;
  onClose: () => void;
}

export const FridgeHunter: React.FC<FridgeHunterProps> = ({ onRecipeGenerated, onClose }) => {
  const [ingredients, setIngredients] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleGenerate = async () => {
    if (!ingredients.trim()) return;
    setIsGenerating(true);
    setStatusText('Chef pensando na receita...');

    try {
      const items = ingredients.split(',').map(i => i.trim()).filter(i => i);
      
      // 1. Generate Recipe Text
      const partialRecipe = await generateRecipeFromIngredients(items);
      
      // 2. Generate Image
      setStatusText('Preparando a foto do prato...');
      const visualDesc = partialRecipe.visualDescription || `Prato delicioso feito com ${items.join(', ')}`;
      const imageBase64 = await generateRecipeImage(visualDesc);
      
      // 3. Upload & Optimize Image
      setStatusText('Salvando receita...');
      let publicUrl = imageBase64;
      if (imageBase64.startsWith('data:')) {
         // This triggers resizing and optimization in storageService
         publicUrl = await storageService.uploadImage(imageBase64, 'recipes/fridge');
      }
      
      const fullRecipe: Recipe = {
        ...partialRecipe as any,
        id: `fridge-${Date.now()}`,
        imageUrl: publicUrl,
        slug: `fridge-${Date.now()}`,
        tags: ['Geladeira', 'Criação Mágica', ...items.slice(0, 3)]
      };

      // 4. Save to DB immediately so it's persistent
      await storageService.saveRecipe(fullRecipe);

      onRecipeGenerated(fullRecipe);
    } catch (e) {
      console.error(e);
      alert("A IA não conseguiu criar uma receita com esses ingredientes. Tente novamente.");
    } finally {
      setIsGenerating(false);
      setStatusText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
       <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative">
          
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-black/10 p-2 rounded-full transition-colors">
             <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-8 text-white text-center relative overflow-hidden">
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
             <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur shadow-lg">
                <span className="text-3xl">🧊</span>
             </div>
             <h2 className="text-3xl font-black mb-2">Caçador de Receitas</h2>
             <p className="text-blue-50 text-sm font-medium">O que tem na sua geladeira hoje?</p>
          </div>

          <div className="p-8">
             <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Seus Ingredientes</label>
                <textarea 
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder="Ex: 3 ovos, meio limão, frango desfiado, cenoura..."
                  className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all font-medium text-gray-700"
                />
                <p className="text-xs text-gray-400 mt-2 text-right">Separe por vírgulas.</p>
             </div>

             <button 
               onClick={handleGenerate}
               disabled={isGenerating || !ingredients.trim()}
               className="w-full py-4 bg-pop-dark text-white rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-3 group"
             >
                {isGenerating ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     <span className="animate-pulse">{statusText || 'Criando Mágica...'}</span>
                   </>
                ) : (
                   <>
                     <span>Criar Receita</span>
                     <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   </>
                )}
             </button>
          </div>
       </div>
    </div>
  );
};
