
import React, { useState, useEffect } from 'react';
import { WordPressPost, Recipe, Category } from '../types';
import { fetchLatestPosts, stripHtml } from '../services/wordpressService';
import { convertWordPressToRecipe, generateRecipeImage, identifyUtensils } from '../services/geminiService';
import { fetchAffiliateLinks } from '../services/affiliateService';
import { storageService } from '../services/storageService';

interface ImportProps {
  onImportSuccess: (recipe: Recipe, skipGlobalLoading?: boolean) => Promise<void>;
  categories: Category[];
  existingRecipes?: Recipe[];
}

export const WordPressImport: React.FC<ImportProps> = ({ onImportSuccess, categories, existingRecipes = [] }) => {
  const [url, setUrl] = useState('receitapopular.com.br');
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Batch Progress State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [currentRecipeName, setCurrentRecipeName] = useState('');

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setSelectedIds(new Set()); // Reset selection on new fetch
    try {
      const data = await fetchLatestPosts(url);
      setPosts(data);
    } catch (err) {
      setError("Não foi possível conectar a este endereço. Verifique a URL e CORS.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === posts.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = posts.map(p => p.id);
      setSelectedIds(new Set(allIds));
    }
  };

  // Core logic to process a SINGLE post
  const processSinglePost = async (post: WordPressPost) => {
    try {
      setCurrentRecipeName(stripHtml(post.title.rendered));
      setProgressStatus('Lendo e analisando com IA...');
      
      const fullContent = `${post.title.rendered} \n ${post.content.rendered}`;
      const categoryNames = categories.map(c => c.name);
      
      // 1. Convert Text
      let partialRecipe: any = await convertWordPressToRecipe(fullContent, post.title.rendered, categoryNames);
      
      // 2. Enrich Affiliates (Explicit Logic)
      setProgressStatus('Buscando ofertas (Shopee)...');
      try {
        const settings = await storageService.getSettings();
        if (settings.n8nWebhookUrl) {
           let utensils = partialRecipe.affiliates || [];
           
           // Se a IA não retornou afiliados na primeira passada, tenta identificar explicitamente
           if (utensils.length === 0) {
              // Simula um objeto recipe parcial para a função identifyUtensils
              utensils = await identifyUtensils(partialRecipe as Recipe);
           }

           if (utensils.length > 0) {
              const enrichedAffiliates = await fetchAffiliateLinks(utensils, settings.n8nWebhookUrl);
              if (enrichedAffiliates.length > 0) {
                 partialRecipe.affiliates = enrichedAffiliates;
              }
           }
        }
      } catch (affErr) {
        console.warn("Affiliate enrichment failed", affErr);
      }

      // 3. Generate Image
      setProgressStatus('Gerando fotografia culinária...');
      let imageUrl = "https://images.unsplash.com/photo-1495521821378-860fa0171913?q=80&w=1000&auto=format&fit=crop";
      
      if (partialRecipe.visualDescription) {
         try {
            imageUrl = await generateRecipeImage(partialRecipe.visualDescription);
         } catch (imgErr) {
            console.warn("Image generation failed", imgErr);
         }
      }

      // 4. Save
      setProgressStatus('Salvando receita...');
      const fullRecipe: Recipe = {
        ...partialRecipe,
        id: post.id.toString(),
        slug: post.slug, 
        imageUrl: imageUrl,
        originalLink: post.link,
        status: 'published'
      };

      // PASS TRUE TO SKIP GLOBAL LOADING AND PREVENT UNMOUNT/RELOAD
      await onImportSuccess(fullRecipe, true);
      return true;

    } catch (err) {
      console.error(`Failed to import post ${post.id}`, err);
      return false;
    }
  };

  const handleBatchImport = async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    setProgressTotal(selectedIds.size);
    setProgressCurrent(0);

    const idsToProcess = Array.from(selectedIds);
    let successCount = 0;

    for (let i = 0; i < idsToProcess.length; i++) {
      const id = idsToProcess[i];
      const post = posts.find(p => p.id === id);
      
      if (post) {
        // Update UI
        setProgressCurrent(i + 1);
        
        // Process
        const success = await processSinglePost(post);
        if (success) successCount++;
        
        // Small delay to let UI breathe
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsProcessing(false);
    alert(`Importação concluída! ${successCount} de ${idsToProcess.length} receitas foram importadas com sucesso.`);
    setSelectedIds(new Set()); // Clear selection
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in relative pb-20">
      
      {/* Batch Progress Modal */}
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
              <div className="w-16 h-16 border-4 border-pop-gray border-t-pop-green rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-2xl font-black text-pop-dark mb-2">Importando Receitas...</h3>
              <p className="text-gray-500 mb-6 font-medium line-clamp-1">{currentRecipeName}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
                 <div 
                   className="bg-pop-green h-full transition-all duration-500 ease-out" 
                   style={{ width: `${(progressCurrent / progressTotal) * 100}%` }}
                 ></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mt-3">
                 <span>{progressStatus}</span>
                 <span>{progressCurrent} / {progressTotal}</span>
              </div>
           </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-pop-dark">Importar do WordPress</h2>
        <p className="text-gray-500">Migre receitas automaticamente usando IA para reescrever e estruturar.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
         <div className="flex gap-4">
            <input 
              type="text" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="ex: meusite.com.br"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-pop-dark"
            />
            <button 
              onClick={handleFetch} 
              disabled={loading || isProcessing}
              className="px-6 py-3 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar Posts'}
            </button>
         </div>
         {error && <p className="text-red-500 text-sm mt-3 font-medium">{error}</p>}
      </div>

      {posts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           {/* Actions Header */}
           <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-4">
                 <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600 hover:text-pop-dark">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === posts.length && posts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-gray-300 text-pop-dark focus:ring-pop-dark"
                    />
                    Selecionar Tudo
                 </label>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l border-gray-300 pl-4">
                    {selectedIds.size} selecionados
                 </span>
              </div>
              
              <button 
                onClick={handleBatchImport}
                disabled={selectedIds.size === 0 || isProcessing}
                className="px-6 py-2 bg-pop-green text-white rounded-lg font-bold text-sm hover:bg-green-600 shadow-md shadow-green-100 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
              >
                 {isProcessing ? 'Processando...' : 'Importar Selecionados'}
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
           </div>

           <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
              {posts.map(post => {
                 const isImported = existingRecipes.some(r => r.slug === post.slug);
                 const isSelected = selectedIds.has(post.id);

                 return (
                   <div key={post.id} className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex items-center justify-center shrink-0">
                         {isImported ? (
                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center" title="Já importado">
                               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                         ) : (
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(post.id)}
                              className="w-5 h-5 rounded border-gray-300 text-pop-dark focus:ring-pop-dark cursor-pointer"
                            />
                         )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <h4 className={`font-bold text-sm truncate ${isImported ? 'text-gray-400' : 'text-pop-dark'}`}>
                            {stripHtml(post.title.rendered)}
                         </h4>
                         <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {stripHtml(post.excerpt.rendered).substring(0, 80)}...
                         </p>
                      </div>

                      <div className="text-xs font-mono text-gray-400 whitespace-nowrap">
                         {new Date(post.date).toLocaleDateString('pt-BR')}
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>
      )}
    </div>
  );
};
