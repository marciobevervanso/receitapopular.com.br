import React, { useState, useEffect } from 'react';
import { WebStory, Recipe } from '../types';
import { storageService } from '../services/storageService';
import { generateWebStory } from '../services/geminiService';

export const StoryManager: React.FC = () => {
  const [stories, setStories] = useState<WebStory[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sendingId, setSendingId] = useState('');
  const [progressText, setProgressText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [storiesData, recipesData] = await Promise.all([
        storageService.getStories(),
        storageService.getRecipes() // Load all recipes for the dropdown
      ]);
      setStories(storiesData);
      setRecipes(recipesData);
    } catch (e) {
      console.error("Erro ao carregar os dados", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateStory = async () => {
    if (!selectedRecipeId) return;
    const recipe = recipes.find(r => r.id === selectedRecipeId);
    if (!recipe) return;

    setGenerating(true);
    setProgressText('Gerando roteiro e imagens... (isso levará em média 1 minuto dependendo do tamanho da receita)');
    try {
      const generated = await generateWebStory(recipe);
      const newStory: WebStory = {
        ...generated,
        id: `story-${Date.now()}`
      };
      await storageService.saveStory(newStory);
      setStories([newStory, ...stories]);
      setSelectedRecipeId('');
      alert('Web Story gerado e salvo com sucesso!');
    } catch (error) {
       alert("Falha ao gerar o Web Story. Tente novamente.");
    } finally {
      setGenerating(false);
      setProgressText('');
    }
  };

  const handleSendToN8n = async (story: WebStory) => {
    setSendingId(story.id);
    try {
      const settings = await storageService.getSettings();
      const webhookUrl = settings.n8nSocialWebhookUrl || 'https://n8n.seureview.com.br/webhook/carrosel';
      
      const images = (story.slides || []).map(s => s.imageUrl).filter(Boolean);
      const texts = (story.slides || []).map(s => s.text).filter(Boolean);

      const payload = {
        type: 'story_reel',
        recipeId: story.recipeId,
        title: story.title,
        link: `https://receitapopular.com.br/web-stories/${story.id}`,
        // Envia as imagens e textos estruturados para o n8n montar o vídeo
        slides: story.slides,
        images,
        texts,
        // Compatibilidade para o n8n
        imageUrl: images[0] || '',
        facebookPost: `Confira o passo a passo de ${story.title} no nosso novo Story! 📖✨\n\n🔗 Acesse para ver completo: https://receitapopular.com.br/web-stories/${story.id}`,
        instagramPost: `Confira o passo a passo de ${story.title} no nosso novo Story!\n\nPara ver o story com a receita completa, acesse o link na bio ou comente "EU QUERO" 👇`,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Web Story enviado com sucesso para o n8n! Você já pode montar o Reel no seu fluxo.");
      } else {
        alert("A requisição para o n8n falhou. Verifique se a URL do Webhook está correta nas Configurações.");
      }
    } catch (e) {
      alert("Falha de rede ao tentar conectar com o webhook n8n.");
    } finally {
      setSendingId('');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o Story "${title}" permanentemente?`)) {
      try {
        await storageService.deleteStory(id);
        setStories(stories.filter(s => s.id !== id));
      } catch (e) {
        alert("Erro ao excluir o story.");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-extrabold text-pop-dark flex items-center gap-3">
              Web Stories <span className="text-gray-400 text-lg font-medium tracking-normal">({stories.length})</span>
           </h2>
           <p className="text-gray-500 mt-2">Os Web Stories publicados ficam acessíveis via /web-stories/id e são excelentes para gerar tráfego orgânico do Google Discover.</p>
        </div>
        <button 
           onClick={loadData} 
           disabled={loading || generating}
           className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-bold text-sm bg-white shadow-sm flex items-center gap-2"
        >
           {loading ? 'Atualizando...' : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Atualizar</>}
        </button>
      </div>

      {/* Gerador de Web Story */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
         <h3 className="font-bold text-lg text-pop-dark mb-4 drop-shadow-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-pop-red" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            Gerar Novo Web Story
         </h3>
         <div className="flex flex-col md:flex-row gap-4">
            <select 
               className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-pop-dark font-medium"
               value={selectedRecipeId}
               onChange={(e) => setSelectedRecipeId(e.target.value)}
               disabled={generating}
            >
               <option value="">Selecione uma receita para gerar o Story...</option>
               {recipes.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
               ))}
            </select>
            <button 
               onClick={handleGenerateStory}
               disabled={!selectedRecipeId || generating}
               className="px-8 py-3 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
               {generating ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Gerando...</>
               ) : (
                  'Gerar com IA'
               )}
            </button>
         </div>
         {generating && (
            <p className="mt-4 text-sm font-bold text-pop-red animate-pulse flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {progressText}
            </p>
         )}
      </div>

      {loading && stories.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {[...Array(5)].map((_, i) => (
             <div key={i} className="rounded-2xl bg-gray-100 animate-pulse aspect-[9/16]"></div>
           ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <h3 className="font-bold text-xl text-gray-800 mb-2">Nenhum Story Encontrado</h3>
            <p className="text-gray-500">Selecione uma receita acima e clique em Gerar com IA para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
           {stories.map(story => {
              const coverImage = story.slides?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop';
              return (
                 <div key={story.id} className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
                    <div className="relative aspect-[9/16] overflow-hidden bg-gray-100">
                       <img src={coverImage} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                       
                       <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDelete(story.id, story.title)}
                            className="w-8 h-8 bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-pop-red transition-colors"
                            title="Excluir Web Story"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                       
                       <div className="absolute bottom-4 left-4 right-4 text-white">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 backdrop-blur-md px-2 py-0.5 rounded mb-2 inline-block">ID: {(story.id).substring(0, 5)}...</span>
                          <h3 className="font-bold text-sm leading-tight drop-shadow-md line-clamp-2">{story.title}</h3>
                       </div>
                    </div>
                    
                    <div className="p-3 bg-white flex flex-col gap-2">
                       <a 
                         href={`/web-stories/${story.id}`} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="w-full flex items-center justify-center gap-1 py-1.5 bg-gray-50 hover:bg-pop-dark hover:text-white text-gray-600 text-[11px] font-bold rounded-lg transition-colors border border-gray-100 shadow-sm"
                       >
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                         Ver Web Story
                       </a>
                       
                       <button
                         onClick={() => handleSendToN8n(story)}
                         disabled={sendingId === story.id}
                         className="w-full flex items-center justify-center gap-1 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                       >
                         {sendingId === story.id ? (
                           <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         ) : (
                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                         )}
                         Enviar p/ Reel (n8n)
                       </button>
                    </div>
                 </div>
              );
           })}
        </div>
      )}
    </div>
  );
};

