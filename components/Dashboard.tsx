
import React, { useState, useEffect } from 'react';
import { Recipe, AdSettings, WebStory, Category, SiteSettings, RecipeSuggestion, DietPlan } from '../types';
import { generateRecipeFromScratch, generateRecipeImage, identifyUtensils } from '../services/geminiService';
import { fetchAffiliateLinks } from '../services/affiliateService';
import { storageService } from '../services/storageService';

// Sub Components
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardRecipeList } from './DashboardRecipeList';
import { WebStoryViewer } from './WebStoryViewer';
import { RecipeForm } from './RecipeForm';
import { CategoryManager } from './CategoryManager';
import { SettingsManager } from './SettingsManager';
import { WordPressImport } from './WordPressImport'; 
import { ReelCreator } from './ReelCreator';
import { NewsletterManager } from './NewsletterManager';
import { AffiliateManager } from './AffiliateManager';
import { MealPlanner } from './MealPlanner';
import { MemeGenerator } from './MemeGenerator';
import { SystemMaintenance } from './SystemMaintenance';

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
  onImportSuccess, onUpdateRecipe, onDeleteRecipe, onStoryCreated, currentRecipes, categories, onUpdateCategories, settings, onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>(undefined);
  const [filterDate, setFilterDate] = useState('');
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStatus, setAiStatus] = useState<'idle' | 'searching' | 'writing' | 'imaging' | 'enriching' | 'review' | 'done'>('idle');
  const [pendingRecipe, setPendingRecipe] = useState<Recipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Extras
  const [userStats, setUserStats] = useState({ title: '', level: 1, xp: 0 });
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [adSettings, setAdSettings] = useState<AdSettings>({ clientId: '', slots: { homeTop: '', homeMiddle: '', sidebar: '' } });

  useEffect(() => {
    const saved = localStorage.getItem('adSettings');
    if (saved) setAdSettings(JSON.parse(saved));
    setUserStats(storageService.getUserLevel());
    storageService.getSuggestions().then(setSuggestions);
    
    if (activeTab === 'diet-plans') storageService.getDietPlans().then(setDietPlans);
  }, [activeTab]);

  // --- Handlers ---

  const handleCreateManual = () => { setEditingRecipe(undefined); setActiveTab('editor'); };
  const handleEditRecipe = (recipe: Recipe) => { setEditingRecipe(recipe); setActiveTab('editor'); };
  
  const handleSaveManualRecipe = async (recipe: Recipe) => {
    setIsSaving(true);
    try {
      const exists = currentRecipes.find(r => r.id === recipe.id);
      if (exists) await onUpdateRecipe(recipe); else await onImportSuccess(recipe);
      setActiveTab('overview');
      alert('Receita salva!');
    } catch (e) { alert('Erro ao salvar.'); } 
    finally { setIsSaving(false); }
  };

  const handleDeleteConfirm = async (id: string) => {
     if(window.confirm("Excluir receita permanentemente?")) await onDeleteRecipe(id);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiStatus('searching');
    try {
      const partialRecipe: any = await generateRecipeFromScratch(aiPrompt);
      setAiStatus('imaging');
      const visualDesc = partialRecipe.visualDescription || `Plate of ${partialRecipe.title}`;
      const imageUrl = await generateRecipeImage(visualDesc);
      
      const slug = partialRecipe.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
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
      alert("Erro na IA.");
      setAiStatus('idle');
    }
  };

  const handleSaveAiRecipe = async () => {
     if (pendingRecipe) {
        await onImportSuccess(pendingRecipe);
        setPendingRecipe(null);
        setAiStatus('idle');
        setAiPrompt('');
        setActiveTab('overview');
        alert("Receita criada com sucesso!");
     }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} userStats={userStats} />

      <div className="flex-1 md:ml-64 p-4 md:p-8">
        
        {activeTab === 'overview' && (
           <DashboardRecipeList 
             recipes={currentRecipes}
             onEdit={handleEditRecipe}
             onDelete={handleDeleteConfirm}
             onUpdate={onUpdateRecipe}
             onCreateManual={handleCreateManual}
             filterDate={filterDate}
             setFilterDate={setFilterDate}
           />
        )}

        {activeTab === 'editor' && (
           <div className="max-w-4xl mx-auto">
              <RecipeForm initialData={editingRecipe} onSave={handleSaveManualRecipe} onCancel={() => setActiveTab('overview')} />
           </div>
        )}

        {activeTab === 'create-ai' && (
           <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-black text-pop-dark mb-6 text-center">Chef Virtual</h2>
              {!pendingRecipe ? (
                 <div className="bg-white p-4 rounded-2xl shadow-lg flex gap-2">
                    <input className="flex-1 p-3 outline-none" placeholder="O que vamos cozinhar?" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                    <button onClick={handleAiGenerate} disabled={aiStatus !== 'idle'} className="bg-pop-dark text-white px-6 rounded-xl font-bold">
                       {aiStatus === 'idle' ? 'Criar' : '...'}
                    </button>
                 </div>
              ) : (
                 <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-6">
                    <img src={pendingRecipe.imageUrl} className="w-full h-64 object-cover" alt="" />
                    <div className="p-6">
                       <h3 className="text-2xl font-bold mb-4">{pendingRecipe.title}</h3>
                       <div className="flex gap-4">
                          <button onClick={() => setPendingRecipe(null)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl">Descartar</button>
                          <button onClick={handleSaveAiRecipe} className="flex-[2] py-3 bg-green-500 text-white font-bold rounded-xl">Publicar</button>
                       </div>
                    </div>
                 </div>
              )}
           </div>
        )}

        {activeTab === 'categories' && <CategoryManager categories={categories} onSave={onUpdateCategories} />}
        {activeTab === 'settings' && <SettingsManager settings={settings} onSave={onUpdateSettings} />}
        {activeTab === 'import' && <WordPressImport onImportSuccess={onImportSuccess} categories={categories} existingRecipes={currentRecipes} />}
        {activeTab === 'reels' && <ReelCreator recipes={currentRecipes} />}
        {activeTab === 'newsletter' && <NewsletterManager />}
        {activeTab === 'affiliates' && <AffiliateManager settings={settings} onSave={onUpdateSettings} />}
        {activeTab === 'memes' && <MemeGenerator settings={settings} />}
        {activeTab === 'planner' && <MealPlanner allRecipes={currentRecipes} onOpenRecipe={() => {}} />}
        {activeTab === 'system' && <SystemMaintenance recipes={currentRecipes} onUpdateRecipe={onUpdateRecipe} />}
        
        {/* Simple Placeholders for others to keep file small */}
        {activeTab === 'suggestions' && <div className="text-center p-10">Gerencie sugestões aqui.</div>}
        {activeTab === 'diet-plans' && <div className="text-center p-10">Gerencie planos alimentares aqui.</div>}
        {activeTab === 'ads' && <div className="text-center p-10">Configuração de Adsense aqui.</div>}

      </div>
    </div>
  );
};
