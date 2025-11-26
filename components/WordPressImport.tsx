
import React, { useState, useEffect } from 'react';
import { WordPressPost, Recipe, Category } from '../types';
import { fetchLatestPosts, stripHtml } from '../services/wordpressService';
import { convertWordPressToRecipe, generateRecipeImage } from '../services/geminiService';
import { fetchAffiliateLinks } from '../services/affiliateService';
import { storageService } from '../services/storageService';

interface ImportProps {
  onImportSuccess: (recipe: Recipe) => void;
  categories: Category[];
  existingRecipes?: Recipe[]; // New Prop
}

export const WordPressImport: React.FC<ImportProps> = ({ onImportSuccess, categories, existingRecipes = [] }) => {
  const [url, setUrl] = useState('receitapopular.com.br');
  const [posts, setPosts] = useState<WordPressPost[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Progress State
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if(url) handleFetch();
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLatestPosts(url);
      setPosts(data);
    } catch (err) {
      setError("Não foi possível conectar a este endereço. Verifique a URL e CORS.");
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (post: WordPressPost) => {
    // 1. Immediate Visual Feedback
    setConvertingId(post.id);
    setProgressPercent(5);
    setProgressStage('Iniciando importação...');
    
    try {
      // Small delay to allow UI to update
      await new Promise(r => setTimeout(r, 100));

      // 2. Generate Text Structure
      setProgressStage('Lendo conteúdo e analisando com IA...');
      setProgressPercent(20);
      
      const fullContent = `${post.title.rendered} \n ${post.content.rendered}`;
      const categoryNames = categories.map(c => c.name);
      
      // Call IA with existing categories to classify correctly
      const partialRecipe: any = await convertWordPressToRecipe(fullContent, post.title.rendered, categoryNames);
      
      // 2.1 Enrich with Affiliate Links (NEW STEP)
      setProgressStage('Buscando ofertas e gerando links (Shopee)...');
      setProgressPercent(40);
      
      try {
        const settings = await storageService.getSettings();
        if (settings.n8nWebhookUrl && partialRecipe.affiliates && partialRecipe.affiliates.length > 0) {
           const enrichedAffiliates = await fetchAffiliateLinks(partialRecipe.affiliates, settings.n8nWebhookUrl);
           
           // Update affiliates if we got results
           if (enrichedAffiliates.length > 0) {
              partialRecipe.affiliates = enrichedAffiliates;
           }
        }
      } catch (affErr) {
        console.warn("Affiliate enrichment failed, skipping...", affErr);
        // Continue without failing the whole import
      }

      setProgressStage('Escrevendo receita e categorizando...');
      setProgressPercent(50);
      
      // 3. Generate Image
      setProgressStage('Gerando fotografia culinária profissional (IA)...');
      
      let imageUrl = "https://images.unsplash.com/photo-1495521821378-860fa0171913?q=80&w=1000&auto=format&fit=crop";
      
      if (partialRecipe.visualDescription) {
         try {
            imageUrl = await generateRecipeImage(partialRecipe.visualDescription);
         } catch (imgErr) {
            console.warn("Image generation failed, using placeholder", imgErr);
         }
      }
      
      setProgressPercent(80);

      // 4. Save
      setProgressStage('Salvando no banco de dados...');
      const fullRecipe: Recipe = {
        ...partialRecipe,
        id: post.id.toString(),
        // CRITICAL: Preserve the exact slug from WordPress for SEO continuity
        slug: post.slug, 
        imageUrl: imageUrl,
        originalLink: post.link,
        status: 'published'
      };

      await onImportSuccess(fullRecipe);
      
      setProgressPercent(100);
      setProgressStage('Concluído com Sucesso!');
      
      // Delay to show completion before closing
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.error(err);
      alert("Erro ao converter. Tente novamente.");
    } finally {
      setConvertingId(null);
      setProgressStage('');
      setProgressPercent(0);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in relative">
      
      {/* Progress Overlay Modal - Fixed Z-Index and Position */}
      {convertingId !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border border-gray-100 transform scale-100 animate-fade-in">
              
              <div className="w-20 h-20 mx-auto mb-8 relative">
                 <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                 <div 
                    className="absolute inset-0 border-4 border-pop-green rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '1s' }}
                 ></div>
                 <div className="absolute inset-0 flex items-center justify-center font-black text-lg text-pop-dark">
                    {progressPercent}%
                 </div>
              </div>

              <h3 className="text-2xl font-black text-pop-dark mb-2">Importando Receita</h3>
              <p className="text-pop-red font-bold text-sm uppercase tracking-widest mb-8 animate-pulse">
                 {progressStage}
              </p>

              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-2">
                 <div 
                   className="h-full bg-gradient-to-r from-pop-yellow to-pop-green transition-all duration-500 ease-out"
                   style={{ width: `${progressPercent}%` }}
                 ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Por favor, aguarde. Estamos criando o conteúdo.</p>
           </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
        <div className="bg-pop-dark p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pop-dark to-gray-900 z-0"></div>
           <div className="relative z-10">
              <div className="w-12 h-12 bg-pop-red rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-900/50 rotate-3">
                 <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1">Migrador de Conteúdo</h2>
              <p className="text-gray-400 text-sm">Importação massiva do WordPress com preservação de SEO.</p>
           </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col gap-4 mb-8">
             <label className="font-bold text-xs text-gray-500 uppercase tracking-wide">Endereço do Site (WordPress)</label>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-pop-dark focus:bg-white transition-all outline-none font-bold text-pop-dark"
                  placeholder="receitapopular.com.br"
                />
                <button 
                  onClick={handleFetch}
                  disabled={loading}
                  className="px-6 py-3 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 shadow-lg text-sm"
                >
                  {loading ? 'Buscando...' : 'Buscar Tudo'}
                </button>
             </div>
          </div>

          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold mb-6 border border-red-100">{error}</div>}

          {posts.length > 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-4">
                 <h3 className="font-bold text-lg text-pop-dark">Postagens Encontradas ({posts.length})</h3>
                 <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Status</span>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                {posts.map((post) => {
                  const isProcessing = convertingId === post.id;
                  // CHECK FOR EXISTING RECIPE
                  const isImported = existingRecipes.some(r => r.slug === post.slug || r.id === post.id.toString());

                  return (
                    <div key={post.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all bg-white group ${isProcessing ? 'border-pop-yellow bg-yellow-50' : 'border-gray-100 hover:border-pop-red/30'}`}>
                      <div className="flex-1 min-w-0 mr-4">
                        <h4 className="font-bold text-pop-dark text-sm group-hover:text-pop-red transition-colors truncate">{stripHtml(post.title.rendered)}</h4>
                        <div className="flex gap-2 mt-1">
                           <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded font-mono">ID: {post.id}</span>
                           <span className="text-[10px] font-bold text-blue-400 bg-blue-50 px-2 py-0.5 rounded font-mono truncate max-w-[200px]">/{post.slug}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                         {isImported ? (
                            <span className="px-4 py-2 rounded-lg font-bold text-xs bg-green-100 text-green-600 flex items-center gap-1 border border-green-200">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                               Importado
                            </span>
                         ) : (
                            <button
                              onClick={() => handleConvert(post)}
                              disabled={convertingId !== null}
                              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap shadow-md flex items-center gap-2 ${
                                isProcessing
                                ? 'bg-pop-yellow text-white cursor-wait' 
                                : convertingId !== null 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-pop-dark text-white hover:bg-black'
                              }`}
                            >
                              {isProcessing ? 'Processando...' : 'Importar'}
                            </button>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
