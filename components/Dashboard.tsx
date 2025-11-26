
import React, { useState } from 'react';
import { WordPressPost, Recipe, AdSettings, WebStory, Category, SiteSettings } from '../types';
import { fetchLatestPosts, stripHtml } from '../services/wordpressService';
import { convertWordPressToRecipe, generateRecipeFromScratch, generateRecipeImage, generateWebStory } from '../services/geminiService';
import { fetchAffiliateLinks } from '../services/affiliateService';
import { publishToSocialMedia } from '../services/socialService'; // NEW
import { WebStoryViewer } from './WebStoryViewer';
import { RecipeForm } from './RecipeForm';
import { CategoryManager } from './CategoryManager';
import { SettingsManager } from './SettingsManager';
import { WordPressImport } from './WordPressImport'; 
import { ReelCreator } from './ReelCreator'; // NEW

interface DashboardProps {
  onImportSuccess: (recipe: Recipe) => Promise<void>;
  onUpdateRecipe: (recipe: Recipe) => Promise<void>;
  onDeleteRecipe: (recipeId: string) => Promise<void>;
  onStoryCreated: (story: WebStory) => Promise<void>;
  currentRecipes: Recipe[];
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => Promise<void>;
  settings: SiteSettings;
  onUpdateSettings: (settings: SiteSettings) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onImportSuccess, 
  onUpdateRecipe,
  onDeleteRecipe, 
  onStoryCreated, 
  currentRecipes,
  categories,
  onUpdateCategories,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'categories' | 'settings' | 'import' | 'create-ai' | 'ads' | 'stories' | 'reels'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishingSocial, setIsPublishingSocial] = useState<string | null>(null); // ID of recipe being posted
  
  // Recipe Editor State
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'searching' | 'writing' | 'imaging' | 'enriching' | 'review' | 'done'>('idle');
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);

  // Stories State
  const [previewStory, setPreviewStory] = useState<WebStory | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  // Ad Settings State
  const [adSettings, setAdSettings] = useState<AdSettings>({
    clientId: '',
    slots: { homeTop: '', homeMiddle: '', sidebar: '', recipeTop: '', recipeMiddle: '', recipeBottom: '' }
  });

  // Load Ads on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('adSettings');
    if (saved) setAdSettings(JSON.parse(saved));
  }, []);

  const saveAds = () => {
    localStorage.setItem('adSettings', JSON.stringify(adSettings));
    alert('Configurações de anúncios salvas!');
  };

  // --- Handlers ---

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setActiveTab('editor');
  };

  const handleCreateManual = () => {
    setEditingRecipe(undefined);
    setActiveTab('editor');
  };

  const handleSaveManualRecipe = async (recipe: Recipe) => {
    setIsSaving(true);
    try {
      // Check if updating or creating
      const exists = currentRecipes.find(r => r.id === recipe.id);
      if (exists) {
        await onUpdateRecipe(recipe);
      } else {
        await onImportSuccess(recipe);
      }
      setActiveTab('overview');
      alert('Receita salva com sucesso!');
    } catch (e) {
      alert('Erro ao salvar receita.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiStatus('searching');
    setPendingRecipe(null);
    
    try {
      // 1. Generate Text
      const partialRecipe: any = await generateRecipeFromScratch(aiPrompt);
      
      // 2. Generate Image
      setAiStatus('imaging');
      const visualDesc = partialRecipe.visualDescription || `A delicious plate of ${partialRecipe.title}`;
      const imageUrl = await generateRecipeImage(visualDesc);

      const slug = partialRecipe.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");

      let recipe: Recipe = {
        ...partialRecipe,
        id: Date.now().toString(),
        slug: slug,
        originalLink: `https://receitapopular.com.br/${slug}`,
        imageUrl: imageUrl,
        status: 'published',
        tags: partialRecipe.tags || []
      };

      // 3. Enrich with Affiliate Links (n8n)
      if (settings.n8nWebhookUrl && recipe.affiliates && recipe.affiliates.length > 0) {
         setAiStatus('enriching');
         const enrichedAffiliates = await fetchAffiliateLinks(recipe.affiliates, settings.n8nWebhookUrl);
         if (enrichedAffiliates.length > 0) {
            recipe = { ...recipe, affiliates: enrichedAffiliates };
         }
      }

      setPendingRecipe(recipe);
      setAiStatus('review');

    } catch (err) {
      console.error(err);
      alert("Erro ao gerar receita. Tente novamente.");
      setAiStatus('idle');
    }
  };

  const handleSavePendingRecipe = async () => {
     if (pendingRecipe) {
        setIsSaving(true);
        try {
          await onImportSuccess(pendingRecipe);
          setAiStatus('done');
          setAiPrompt('');
          setPendingRecipe(null);
          setTimeout(() => {
             setAiStatus('idle');
             setActiveTab('overview');
             alert("Receita publicada com sucesso no Banco de Dados!");
          }, 500);
        } catch (e) {
          alert('Erro ao publicar receita IA.');
        } finally {
          setIsSaving(false);
        }
     }
  };

  const toggleCategoryInReview = (catName: string) => {
     if (!pendingRecipe) return;
     const currentTags = new Set(pendingRecipe.tags);
     if (currentTags.has(catName)) {
        currentTags.delete(catName);
     } else {
        currentTags.add(catName);
     }
     setPendingRecipe({ ...pendingRecipe, tags: Array.from(currentTags) });
  };

  const handleDeleteConfirm = async (id: string) => {
     if(window.confirm("Tem certeza que deseja excluir esta receita? Essa ação não pode ser desfeita.")) {
        await onDeleteRecipe(id);
     }
  };

  const handleCreateStory = async (recipe: Recipe) => {
    setIsGeneratingStory(true);
    setPreviewStory(null);
    try {
      const storyData = await generateWebStory(recipe);
      const newStory: WebStory = { ...storyData, id: Date.now().toString() };
      setPreviewStory(newStory);
      await onStoryCreated(newStory);
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar story. Verifique o console para detalhes.");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleSocialPublish = async (recipe: Recipe) => {
    if (!settings.n8nSocialWebhookUrl) {
      alert("Configure a URL do Webhook Social nas Configurações antes de publicar.");
      setActiveTab('settings');
      return;
    }

    if (confirm(`Deseja publicar "${recipe.title}" no Instagram e Facebook agora?`)) {
      setIsPublishingSocial(recipe.id);
      try {
        await publishToSocialMedia(recipe, settings.n8nSocialWebhookUrl);
        alert("Publicação enviada com sucesso para as redes sociais!");
      } catch (e) {
        alert("Erro ao publicar. Verifique a URL do Webhook e o console.");
      } finally {
        setIsPublishingSocial(null);
      }
    }
  };

  if (isSaving) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
         <div className="bg-white p-8 rounded-2xl text-center">
            <div className="w-12 h-12 border-4 border-pop-gray border-t-pop-red rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold text-pop-dark">Salvando na Nuvem...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {previewStory && (
        <WebStoryViewer story={previewStory} onClose={() => setPreviewStory(null)} />
      )}

      {/* Sidebar */}
      <div className="w-64 bg-pop-dark text-white hidden md:flex flex-col fixed h-full z-10 custom-scrollbar overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
             <div className="font-bold text-xl tracking-tight">Área do Chef</div>
             <a href="/" className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors" title="Voltar ao Site">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </a>
          </div>
          <div className="text-xs text-gray-400 mt-1">Painel Administrativo v2.0</div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'overview' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            Minhas Receitas
          </button>
          
          <button onClick={() => setActiveTab('editor')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'editor' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
             Editor Manual
          </button>

          <button onClick={() => setActiveTab('create-ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'create-ai' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            Criação Mágica (IA)
          </button>

          <button onClick={() => setActiveTab('stories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'stories' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Web Stories
          </button>

          <button onClick={() => setActiveTab('reels')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'reels' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Reels & TikTok (Veo)
          </button>

          <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'categories' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            Categorias
          </button>

          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'settings' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Configurações
          </button>
          
           <button onClick={() => setActiveTab('import')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'import' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            Importar WordPress
          </button>
          
          <button onClick={() => setActiveTab('ads')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${activeTab === 'ads' ? 'bg-pop-red text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             Monetização (Ads)
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-8">
        
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-extrabold text-pop-dark">Visão Geral</h2>
                <p className="text-gray-500">Gerencie suas publicações.</p>
              </div>
              <button onClick={handleCreateManual} className="bg-pop-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black">
                + Nova Receita
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Receita</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Slug (SEO)</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Categorias</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentRecipes.map(recipe => (
                    <tr key={recipe.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-bold text-pop-dark">{recipe.title}</div>
                        <div className="text-xs text-gray-400">{recipe.description.substring(0, 40)}...</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-mono">/{recipe.slug}</span>
                      </td>
                       <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                           {recipe.tags.slice(0,3).map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold">{t}</span>
                           ))}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                           {/* Social Publish Button */}
                           <button 
                              onClick={() => handleSocialPublish(recipe)}
                              disabled={isPublishingSocial === recipe.id}
                              className={`transition-colors ${isPublishingSocial === recipe.id ? 'text-gray-300' : 'text-pink-500 hover:text-pink-600'}`}
                              title="Publicar nas Redes (Instagram/Facebook)"
                           >
                              {isPublishingSocial === recipe.id ? (
                                 <div className="w-5 h-5 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin"></div>
                              ) : (
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                              )}
                           </button>

                           <button onClick={() => handleEditRecipe(recipe)} className="text-gray-400 hover:text-pop-dark font-bold text-xs uppercase">Editar</button>
                           <button 
                              onClick={() => handleDeleteConfirm(recipe.id)}
                              className="text-gray-300 hover:text-red-600 transition-colors" 
                              title="Excluir Receita"
                           >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
           <RecipeForm 
              initialData={editingRecipe} 
              onSave={handleSaveManualRecipe} 
              onCancel={() => setActiveTab('overview')} 
           />
        )}

        {activeTab === 'categories' && (
           <CategoryManager 
              categories={categories} 
              onSave={onUpdateCategories} 
           />
        )}

        {activeTab === 'settings' && (
           <SettingsManager 
              settings={settings}
              onSave={onUpdateSettings}
           />
        )}

        {activeTab === 'reels' && (
           <ReelCreator recipes={currentRecipes} />
        )}

        {activeTab === 'create-ai' && (
           <div className="max-w-3xl mx-auto animate-fade-in">
              {/* ... AI Component Logic ... */}
              {aiStatus === 'review' && pendingRecipe ? (
                 <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <div className="mb-6 border-b border-gray-100 pb-6">
                       <span className="text-xs font-bold text-pop-green uppercase tracking-widest mb-2 block">Passo Final</span>
                       <h2 className="text-3xl font-black text-pop-dark">Revisão e Categorização</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                       <div>
                          <img src={pendingRecipe.imageUrl} className="w-full h-48 object-cover rounded-xl mb-4 shadow-sm" alt="Preview" />
                          <h3 className="font-bold text-lg text-pop-dark">{pendingRecipe.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">{pendingRecipe.description}</p>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Categorias</label>
                          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                             {categories.map(cat => {
                                const isSelected = pendingRecipe.tags.includes(cat.name);
                                return (
                                   <div key={cat.name} onClick={() => toggleCategoryInReview(cat.name)} className={`flex items-center p-3 rounded-lg cursor-pointer border transition-all ${isSelected ? 'bg-pop-yellow/10 border-pop-yellow' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                                      <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center ${isSelected ? 'bg-pop-yellow border-pop-yellow' : 'bg-white border-gray-300'}`}>
                                         {isSelected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                      </div>
                                      <span className={`text-sm font-bold ${isSelected ? 'text-pop-dark' : 'text-gray-500'}`}>{cat.name}</span>
                                   </div>
                                );
                             })}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={() => setAiStatus('idle')} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">Cancelar</button>
                       <button onClick={handleSavePendingRecipe} className="flex-[2] py-4 bg-pop-green text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-200">Confirmar e Publicar</button>
                    </div>
                 </div>
              ) : (
                 <>
                   <div className="mb-8 text-center">
                     <h2 className="text-3xl font-extrabold text-pop-dark">Cozinha Experimental IA</h2>
                     <p className="text-gray-500 mt-2">Crie receitas autênticas com inteligência artificial.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
                     <div className="flex flex-col gap-4">
                        <label className="text-sm font-bold text-pop-dark uppercase tracking-wide">O que vamos cozinhar?</label>
                        <div className="relative">
                           <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} disabled={aiStatus !== 'idle'} className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-pop-red focus:bg-white transition-all outline-none font-serif text-xl placeholder-gray-300" placeholder="Ex: Lasanha Bolonhesa Clássica..." onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()} />
                           <button onClick={handleAiGenerate} disabled={aiStatus !== 'idle' || !aiPrompt.trim()} className="absolute right-3 top-3 bottom-3 px-6 bg-pop-dark text-white rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                             {aiStatus === 'idle' ? 'Criar' : aiStatus === 'enriching' ? 'Gerando Links...' : '...'}
                           </button>
                        </div>
                        {aiStatus !== 'idle' && aiStatus !== 'review' && (
                           <div className="mt-8 space-y-4">
                              <p className="text-center text-gray-400 font-bold animate-pulse">
                                {aiStatus === 'searching' && 'Pesquisando Receita...'}
                                {aiStatus === 'imaging' && 'Gerando Fotografia...'}
                                {aiStatus === 'enriching' && 'Buscando Ofertas na Shopee...'}
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
                 </>
              )}
           </div>
        )}

        {activeTab === 'stories' && (
            <div className="max-w-3xl mx-auto animate-fade-in">
               <div className="mb-8">
                 <h2 className="text-3xl font-extrabold text-pop-dark">Gerador de Stories</h2>
                 <p className="text-sm text-gray-500 mt-1">Transforme suas receitas em experiências visuais imersivas. A IA criará 5 cenas únicas para cada story.</p>
               </div>
               <div className="grid gap-4">
                  {currentRecipes.map(recipe => (
                    <div key={recipe.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <img src={recipe.imageUrl} className="w-16 h-16 rounded-lg object-cover" alt="" />
                          <div><h3 className="font-bold text-pop-dark">{recipe.title}</h3><div className="text-xs text-gray-400">{recipe.steps.length} passos</div></div>
                       </div>
                       <button onClick={() => handleCreateStory(recipe)} disabled={isGeneratingStory} className="px-6 py-2 bg-gradient-to-r from-pop-red to-orange-500 text-white font-bold text-sm rounded-full shadow-lg disabled:opacity-50 min-w-[160px]">
                         {isGeneratingStory ? 'Gerando Cenas...' : 'Criar Story'}
                       </button>
                    </div>
                  ))}
               </div>
            </div>
        )}

         {activeTab === 'import' && (
            <WordPressImport 
               onImportSuccess={onImportSuccess} 
               categories={categories}
               existingRecipes={currentRecipes}
            />
        )}

        {activeTab === 'ads' && (
           <div className="max-w-2xl mx-auto animate-fade-in">
              <div className="mb-8"><h2 className="text-3xl font-extrabold text-pop-dark">Monetização</h2></div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                 <div><label className="block text-sm font-bold text-pop-dark mb-2">Publisher ID</label><input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={adSettings.clientId} onChange={e => setAdSettings({...adSettings, clientId: e.target.value})} placeholder="ca-pub-..." /></div>
                 
                 <div className="border-t border-gray-100 pt-6 mt-6">
                    <h4 className="font-bold text-pop-dark mb-4">Página Inicial</h4>
                    <div className="space-y-4">
                       <div><label className="block text-xs text-gray-500 uppercase font-bold mb-1">Slot: Topo</label><input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={adSettings.slots.homeTop} onChange={e => setAdSettings({...adSettings, slots: {...adSettings.slots, homeTop: e.target.value}})} placeholder="ID do bloco" /></div>
                       <div><label className="block text-xs text-gray-500 uppercase font-bold mb-1">Slot: Banner Meio</label><input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={adSettings.slots.homeMiddle} onChange={e => setAdSettings({...adSettings, slots: {...adSettings.slots, homeMiddle: e.target.value}})} placeholder="ID do bloco" /></div>
                    </div>
                 </div>

                 <div className="border-t border-gray-100 pt-6 mt-6">
                    <h4 className="font-bold text-pop-dark mb-4">Página da Receita</h4>
                    <div className="space-y-4">
                       <div><label className="block text-xs text-gray-500 uppercase font-bold mb-1">Slot: Topo (Antes do Título)</label><input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={adSettings.slots.recipeTop || ''} onChange={e => setAdSettings({...adSettings, slots: {...adSettings.slots, recipeTop: e.target.value}})} placeholder="ID do bloco" /></div>
                       <div><label className="block text-xs text-gray-500 uppercase font-bold mb-1">Slot: Meio (Antes do Preparo)</label><input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={adSettings.slots.recipeMiddle || ''} onChange={e => setAdSettings({...adSettings, slots: {...adSettings.slots, recipeMiddle: e.target.value}})} placeholder="ID do bloco" /></div>
                       <div><label className="block text-xs text-gray-500 uppercase font-bold mb-1">Slot: Fim (Antes das Avaliações)</label><input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={adSettings.slots.recipeBottom || ''} onChange={e => setAdSettings({...adSettings, slots: {...adSettings.slots, recipeBottom: e.target.value}})} placeholder="ID do bloco" /></div>
                    </div>
                 </div>

                 <button onClick={saveAds} className="w-full py-4 bg-pop-green text-white rounded-xl font-bold hover:bg-green-600 shadow-lg shadow-green-100">Salvar Configurações</button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
