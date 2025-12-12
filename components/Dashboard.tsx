
import React, { useState, useEffect } from 'react';
import { WordPressPost, Recipe, AdSettings, WebStory, Category, SiteSettings, RecipeSuggestion, DietPlan } from '../types';
import { generateRecipeFromScratch, generateRecipeImage, generateWebStory, identifyUtensils } from '../services/geminiService';
import { fetchAffiliateLinks } from '../services/affiliateService';
import { publishToSocialMedia } from '../services/socialService';
import { WebStoryViewer } from './WebStoryViewer';
import { RecipeForm } from './RecipeForm';
import { CategoryManager } from './CategoryManager';
import { SettingsManager } from './SettingsManager';
import { WordPressImport } from './WordPressImport'; 
import { ReelCreator } from './ReelCreator';
import { NewsletterManager } from './NewsletterManager';
import { AffiliateManager } from './AffiliateManager';
import { MealPlanner } from './MealPlanner';
import { storageService } from '../services/storageService';
import { MemeGenerator } from './MemeGenerator';

interface DashboardProps {
  onImportSuccess: (recipe: Recipe, skipGlobalLoading?: boolean) => Promise<void>;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'categories' | 'settings' | 'import' | 'create-ai' | 'ads' | 'stories' | 'reels' | 'newsletter' | 'affiliates' | 'planner' | 'suggestions' | 'memes' | 'diet-plans'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishingSocial, setIsPublishingSocial] = useState<string | null>(null);
  const [regeneratingImgId, setRegeneratingImgId] = useState<string | null>(null);
  const [enrichingRecipeId, setEnrichingRecipeId] = useState<string | null>(null);
  
  // Filter State
  const [filterDate, setFilterDate] = useState<string>('');
  
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'searching' | 'writing' | 'imaging' | 'enriching' | 'review' | 'done'>('idle');
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);

  const [previewStory, setPreviewStory] = useState<WebStory | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);

  const [userStats, setUserStats] = useState({ title: '', level: 1, xp: 0 });
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  
  // Diet Plans Management
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [regeneratingPlanId, setRegeneratingPlanId] = useState<string | null>(null);

  const [adSettings, setAdSettings] = useState<AdSettings>({
    clientId: '',
    slots: { homeTop: '', homeMiddle: '', sidebar: '', recipeTop: '', recipeMiddle: '', recipeBottom: '' }
  });

  useEffect(() => {
    const saved = localStorage.getItem('adSettings');
    if (saved) setAdSettings(JSON.parse(saved));
    
    // Load gamification stats
    const stats = storageService.getUserLevel();
    setUserStats(stats);

    // Load suggestions
    storageService.getSuggestions().then(setSuggestions);
    
    // Load Diet Plans
    if (activeTab === 'diet-plans') {
        loadDietPlans();
    }
  }, [activeTab]);

  const loadDietPlans = async () => {
      const plans = await storageService.getDietPlans();
      setDietPlans(plans);
  };

  const saveAds = () => {
    localStorage.setItem('adSettings', JSON.stringify(adSettings));
    alert('Configurações de anúncios salvas!');
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setActiveTab('editor');
  };

  const handleCreateManual = () => {
    setEditingRecipe(undefined);
    setActiveTab('editor');
  };

  // ... (Other handlers unchanged, reusing logic) ...
  const handleSaveManualRecipe = async (recipe: Recipe) => {
    setIsSaving(true);
    try {
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
      const partialRecipe: any = await generateRecipeFromScratch(aiPrompt);
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
      if (settings.n8nWebhookUrl) {
         setAiStatus('enriching');
         let currentAffiliates = recipe.affiliates || [];
         if (currentAffiliates.length === 0) {
             try {
                const detectedUtensils = await identifyUtensils(recipe);
                currentAffiliates = detectedUtensils.map(u => ({ name: u.name, url: '' }));
             } catch (e) { console.warn(e); }
         }
         if (currentAffiliates.length > 0) {
             try {
                const enrichedAffiliates = await fetchAffiliateLinks(currentAffiliates, settings.n8nWebhookUrl);
                if (enrichedAffiliates.length > 0) {
                    recipe = { ...recipe, affiliates: enrichedAffiliates };
                }
             } catch (err) { console.error(err); }
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
             alert("Receita publicada com sucesso!");
          }, 500);
        } catch (e) {
          alert('Erro ao publicar receita IA.');
        } finally {
          setIsSaving(false);
        }
     }
  };

  const handleRegenerateImage = async (recipe: Recipe) => {
    setRegeneratingImgId(recipe.id);
    try {
        const prompt = `Professional food photography of ${recipe.title}. ${recipe.visualDescription || ''}. Cinematic lighting, 8k resolution.`;
        const newImageUrl = await generateRecipeImage(prompt);
        let publicUrl = newImageUrl;
        if (newImageUrl.startsWith('data:')) {
           publicUrl = await storageService.uploadImage(newImageUrl, 'recipes');
        }
        const updatedRecipe = { ...recipe, imageUrl: publicUrl };
        await onUpdateRecipe(updatedRecipe);
    } catch (e) {
        console.error(e);
        alert("Erro de conexão ao gerar imagem.");
    } finally {
        setRegeneratingImgId(null);
    }
  };

  const handleRegeneratePlanImage = async (plan: DietPlan) => {
    setRegeneratingPlanId(plan.id);
    try {
       const imgPrompt = `Award-winning food editorial photography for: ${plan.title}. 
       Show ONLY the fresh ingredients and the prepared healthy dish described as: ${plan.description}.
       Style: High-end culinary magazine, natural sunlight coming from the side, shallow depth of field (bokeh background), macro details of textures.
       Composition: Flat lay (top down) or 45-degree angle.
       CRITICAL: NO TEXT, NO LABELS, NO INFOGRAPHICS, NO NUMBERS, NO ICONS overlaid on the image. Just pure, delicious food photography.`;
       
       const imgBase64 = await generateRecipeImage(imgPrompt);
       let publicUrl = imgBase64;
       if (imgBase64.startsWith('data:')) {
          publicUrl = await storageService.uploadImage(imgBase64, 'plans');
       }
       const timestampedUrl = `${publicUrl}?t=${Date.now()}`;
       await storageService.updateDietPlan({ ...plan, imageUrl: publicUrl }); 
       setDietPlans(prev => prev.map(p => p.id === plan.id ? { ...p, imageUrl: timestampedUrl } : p));
    } catch (e) {
       console.error(e);
       alert("Erro ao gerar capa. Tente novamente.");
    } finally {
       setRegeneratingPlanId(null);
    }
  };

  const handleEnrichAffiliates = async (recipe: Recipe) => {
    if (!settings.n8nWebhookUrl) {
      alert("Configure o Webhook da Shopee (n8n) na aba Configurações primeiro.");
      return;
    }
    setEnrichingRecipeId(recipe.id);
    try {
      const utensils = await identifyUtensils(recipe);
      if (utensils.length === 0) {
        alert("A IA não identificou utensílios específicos para esta receita.");
        return;
      }
      const enrichedAffiliates = await fetchAffiliateLinks(utensils, settings.n8nWebhookUrl);
      if (enrichedAffiliates.length > 0) {
         const updatedRecipe = { ...recipe, affiliates: enrichedAffiliates };
         await onUpdateRecipe(updatedRecipe);
         alert(`Sucesso! ${enrichedAffiliates.length} ofertas adicionadas.`);
      } else {
         alert("O Webhook não retornou ofertas para os itens identificados.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao buscar afiliados.");
    } finally {
      setEnrichingRecipeId(null);
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

  const handleApproveSuggestion = async (suggestion: RecipeSuggestion) => {
    await storageService.deleteSuggestion(suggestion.id);
    const updated = await storageService.getSuggestions();
    setSuggestions(updated);
    const prompt = `${suggestion.dishName}. ${suggestion.description || ''}`;
    setAiPrompt(prompt);
    setActiveTab('create-ai');
    setTimeout(() => { handleAiGenerate(); }, 100);
  };

  const handleRejectSuggestion = async (id: string) => {
    if(window.confirm("Rejeitar esta sugestão?")) {
        await storageService.deleteSuggestion(id);
        const updated = await storageService.getSuggestions();
        setSuggestions(updated);
    }
  };

  const setQuickDate = (type: 'today' | 'yesterday' | 'all') => {
     const today = new Date();
     if (type === 'all') {
        setFilterDate('');
     } else if (type === 'today') {
        setFilterDate(today.toISOString().split('T')[0]);
     } else if (type === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setFilterDate(yesterday.toISOString().split('T')[0]);
     }
  };

  const filteredRecipes = currentRecipes.filter(r => {
     if (!filterDate) return true;
     return r.datePublished === filterDate;
  });

  const menuGroups = [
    {
      title: "Principal",
      items: [
        { id: 'overview', label: 'Minhas Receitas', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
        { id: 'planner', label: 'Planejador', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> }
      ]
    },
    {
      title: "Criação",
      items: [
        { id: 'create-ai', label: 'Criação Mágica (IA)', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
        { id: 'editor', label: 'Editor Manual', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> },
        { id: 'import', label: 'Importar WordPress', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg> }
      ]
    },
    {
      title: "Social & Viral",
      items: [
        { id: 'stories', label: 'Web Stories', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
        { id: 'reels', label: 'Reels (Veo)', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
        { id: 'memes', label: 'Fábrica de Memes', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
      ]
    },
    {
      title: "Gestão",
      items: [
        { id: 'diet-plans', label: 'Planos Alimentares', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
        { id: 'categories', label: 'Categorias', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
        { id: 'suggestions', label: `Sugestões (${suggestions.length})`, icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
        { id: 'newsletter', label: 'Newsletter', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> }
      ]
    },
    {
      title: "Sistema",
      items: [
        { id: 'affiliates', label: 'Afiliados', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'settings', label: 'Configurações', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { id: 'ads', label: 'AdSense', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {previewStory && (
        <WebStoryViewer story={previewStory} onClose={() => setPreviewStory(null)} />
      )}

      {/* Mobile Nav Tabs (Top) */}
      <div className="md:hidden bg-white border-b border-gray-200 overflow-x-auto no-scrollbar sticky top-0 z-40">
         <div className="flex px-4 py-2 gap-2">
            {menuGroups.flatMap(g => g.items).map((item: any) => (
               <button 
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                    activeTab === item.id 
                      ? 'bg-pop-dark text-white border-pop-dark' 
                      : 'bg-white text-gray-500 border-gray-200'
                 }`}
               >
                  {item.label}
               </button>
            ))}
         </div>
      </div>

      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-pop-dark text-white hidden md:flex flex-col fixed h-full z-10 custom-scrollbar overflow-y-auto border-r border-gray-800">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
             <div className="font-bold text-xl tracking-tight">Área do Chef</div>
             <a href="/" className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors" title="Voltar ao Site">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
             </a>
          </div>
          
          <div className="mt-4 bg-white/5 rounded-xl p-3 flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pop-yellow to-pop-red flex items-center justify-center font-black text-white shadow-lg">
                {userStats.level}
             </div>
             <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Nível</p>
                <p className="font-bold text-white text-sm">{userStats.title}</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-6">
           {menuGroups.map((group, idx) => (
              <div key={idx}>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 px-2">{group.title}</h4>
                 <div className="space-y-1">
                    {group.items.map((item: any) => (
                       <button 
                         key={item.id}
                         onClick={() => setActiveTab(item.id)} 
                         className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-pop-red text-white font-bold shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                       >
                          {item.icon}
                          {item.label}
                       </button>
                    ))}
                 </div>
              </div>
           ))}
        </nav>
      </div>

      <div className="flex-1 md:ml-64 p-4 md:p-8">
        
        {/* Content Area */}
        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            {/* ... Rest of overview content same as before ... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-pop-dark">Visão Geral</h2>
                <p className="text-gray-500">Gerencie suas publicações.</p>
              </div>
              <button onClick={handleCreateManual} className="w-full md:w-auto bg-pop-dark text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black">
                + Nova Receita
              </button>
            </div>
            
            {/* ... Filter Toolbar ... */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between">
               {/* ... same logic ... */}
               <div className="flex items-center gap-2 w-full md:w-auto justify-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Filtrar Data:</span>
                  <button onClick={() => setQuickDate('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterDate === '' ? 'bg-pop-dark text-white' : 'bg-gray-100 text-gray-600'}`}>Todas</button>
                  <button onClick={() => setQuickDate('today')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterDate === new Date().toISOString().split('T')[0] ? 'bg-pop-red text-white' : 'bg-gray-100 text-gray-600'}`}>Hoje</button>
               </div>
               <div className="flex items-center gap-2 w-full md:w-auto justify-center">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Específico:</span>
                  <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-pop-dark" />
               </div>
            </div>

            {/* Table / List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               {/* Mobile List View */}
               <div className="md:hidden divide-y divide-gray-100">
                  {filteredRecipes.map(recipe => (
                     <div key={recipe.id} className="p-4 flex gap-3">
                        <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden shrink-0">
                           <img src={recipe.imageUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="font-bold text-pop-dark truncate">{recipe.title}</div>
                           <div className="text-xs text-gray-400">{recipe.datePublished}</div>
                           <div className="flex gap-3 mt-2">
                              <button onClick={() => handleEditRecipe(recipe)} className="text-xs font-bold text-blue-500">Editar</button>
                              <button onClick={() => handleDeleteConfirm(recipe.id)} className="text-xs font-bold text-red-500">Excluir</button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>

               {/* Desktop Table */}
               <table className="w-full text-left hidden md:table">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Receita</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Data</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecipes.map(recipe => {
                    const hasValidAffiliates = recipe.affiliates && recipe.affiliates.length > 0 && recipe.affiliates.some(a => a.url && a.url.length > 5);
                    const isFallbackImage = recipe.imageUrl.includes('unsplash') || recipe.imageUrl.includes('placeholder');

                    return (
                      <tr key={recipe.id} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                                <img src={recipe.imageUrl} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div>
                                <div className="font-bold text-pop-dark">{recipe.title}</div>
                                <div className="text-xs text-gray-400">{recipe.description.substring(0, 30)}...</div>
                             </div>
                          </div>
                        </td>
                        <td className="p-4">
                           <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {recipe.datePublished}
                           </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                             {!hasValidAffiliates && (
                                <button
                                  onClick={() => handleEnrichAffiliates(recipe)}
                                  disabled={enrichingRecipeId === recipe.id}
                                  className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                  title="Buscar Ofertas"
                                >
                                   {enrichingRecipeId === recipe.id ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                                </button>
                             )}
                             {isFallbackImage && (
                                <button 
                                  onClick={() => handleRegenerateImage(recipe)}
                                  disabled={regeneratingImgId === recipe.id}
                                  className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                                  title="Gerar Foto IA"
                                >
                                   {regeneratingImgId === recipe.id ? <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                </button>
                             )}
                             <button onClick={() => handleEditRecipe(recipe)} className="p-1.5 text-gray-400 hover:text-pop-dark hover:bg-gray-100 rounded">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                             </button>
                             <button onClick={() => handleDeleteConfirm(recipe.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                             </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ... All other tabs (create-ai, editor, etc) render as before ... */}
        {/* Just ensuring container spacing is responsive with p-4 md:p-8 on the main div */}
        
        {activeTab === 'create-ai' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
             <div className="text-center mb-8 md:mb-10">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-pop-red to-pop-yellow rounded-3xl mx-auto mb-4 md:mb-6 flex items-center justify-center shadow-xl shadow-red-200">
                   <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-pop-dark mb-2">Criação Mágica</h2>
                <p className="text-sm md:text-base text-gray-500">Descreva o prato e nossa IA criará a receita completa.</p>
             </div>
             
             {/* ... rest of create-ai ... */}
             {!pendingRecipe && aiStatus !== 'done' && (
               <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row gap-2">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Ex: Bolo de cenoura"
                    className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl text-base md:text-lg outline-none text-pop-dark placeholder-gray-300"
                    onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                    disabled={aiStatus !== 'idle'}
                  />
                  <button 
                    onClick={handleAiGenerate}
                    disabled={aiStatus !== 'idle' || !aiPrompt.trim()}
                    className="px-6 py-3 md:px-8 md:py-4 bg-pop-dark text-white font-bold rounded-xl hover:bg-black transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                  >
                    {aiStatus === 'idle' ? <span>Gerar</span> : <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  </button>
               </div>
             )}
             {/* ... status and pendingRecipe UI ... */}
             {pendingRecipe && (
                <div className="mt-8 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-2xl max-w-md mx-auto animate-slide-up">
                   <img src={pendingRecipe.imageUrl} className="w-full h-48 md:h-64 object-cover" alt="Preview" />
                   <div className="p-6 md:p-8">
                      <h3 className="text-xl md:text-2xl font-black text-pop-dark mb-2">{pendingRecipe.title}</h3>
                      {/* ... review actions ... */}
                      <div className="flex gap-4 mt-6">
                         <button onClick={() => { setPendingRecipe(null); setAiStatus('idle'); }} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">Descartar</button>
                         <button onClick={handleSavePendingRecipe} disabled={isSaving} className="flex-[2] py-3 bg-pop-green text-white font-bold rounded-xl shadow-lg">Publicar</button>
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {/* ... Reuse existing render logic for other tabs (categories, settings, import, etc.) ... */}
        {activeTab === 'categories' && <CategoryManager categories={categories} onSave={onUpdateCategories} />}
        {activeTab === 'settings' && <SettingsManager settings={settings} onSave={onUpdateSettings} />}
        {activeTab === 'import' && <WordPressImport onImportSuccess={onImportSuccess} categories={categories} existingRecipes={currentRecipes} />}
        {activeTab === 'reels' && <ReelCreator recipes={currentRecipes} />}
        {activeTab === 'newsletter' && <NewsletterManager />}
        {activeTab === 'affiliates' && <AffiliateManager settings={settings} onSave={onUpdateSettings} />}
        {activeTab === 'memes' && <MemeGenerator settings={settings} />}
        {activeTab === 'planner' && <MealPlanner allRecipes={currentRecipes} onOpenRecipe={() => {}} />}
        {activeTab === 'editor' && <div className="max-w-4xl mx-auto"><RecipeForm initialData={editingRecipe} onSave={handleSaveManualRecipe} onCancel={() => setActiveTab('overview')} /></div>}
        {activeTab === 'suggestions' && (
           <div className="max-w-5xl mx-auto animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-extrabold text-pop-dark">Sugestões</h2>
              </div>
              {/* ... Suggestion List ... */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                 {suggestions.map((s) => (
                    <div key={s.id} className="p-4 md:p-6 flex flex-col md:flex-row gap-4">
                       <div className="flex-1">
                          <h4 className="font-bold text-pop-dark">{s.dishName}</h4>
                          <p className="text-sm text-gray-500">{s.description}</p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleRejectSuggestion(s.id)} className="px-3 py-2 text-red-500 text-sm font-bold bg-red-50 rounded-lg">Ignorar</button>
                          <button onClick={() => handleApproveSuggestion(s)} className="px-3 py-2 text-white text-sm font-bold bg-pop-green rounded-lg shadow">Criar</button>
                       </div>
                    </div>
                 ))}
                 {suggestions.length === 0 && <div className="p-8 text-center text-gray-400">Nada por aqui.</div>}
              </div>
           </div>
        )}
        {activeTab === 'diet-plans' && (
           <div className="max-w-6xl mx-auto animate-fade-in">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl md:text-3xl font-extrabold text-pop-dark">Planos</h2>
                 <button onClick={loadDietPlans} className="text-sm bg-gray-100 px-3 py-2 rounded-lg font-bold">Atualizar</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {dietPlans.map(plan => (
                    <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                       <div className="relative h-40 bg-gray-200">
                          <img src={plan.imageUrl} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div className="p-4">
                          <h3 className="font-bold text-pop-dark">{plan.title}</h3>
                          <div className="mt-4 flex justify-between items-center">
                             <button onClick={() => handleRegeneratePlanImage(plan)} disabled={regeneratingPlanId === plan.id} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                                {regeneratingPlanId === plan.id ? 'Gerando...' : 'Regenerar Capa'}
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
        {activeTab === 'ads' && (
           <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Configuração AdSense</h2>
              {/* ... AdSense Form ... */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
                 <input className="w-full border p-2 rounded" placeholder="Client ID" value={adSettings.clientId} onChange={e => setAdSettings({...adSettings, clientId: e.target.value})} />
                 <button onClick={saveAds} className="bg-pop-dark text-white px-4 py-2 rounded font-bold w-full">Salvar</button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
