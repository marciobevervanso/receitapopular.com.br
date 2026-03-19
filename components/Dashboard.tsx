
import React, { useState, useEffect } from 'react';
import { Recipe, AdSettings, WebStory, Category, SiteSettings, RecipeSuggestion, DietPlan } from '../types';
import { fetchAffiliateLinks } from '../services/affiliateService';
import { storageService } from '../services/storageService';

// Sub Components
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardOverview } from './DashboardOverview'; // NEW
import { DashboardRecipeList } from './DashboardRecipeList';
import { WebStoryViewer } from './WebStoryViewer';
import { RecipeForm } from './RecipeForm';
import { CategoryManager } from './CategoryManager';
import { SettingsManager } from './SettingsManager';
import { WordPressImport } from './WordPressImport'; 
import { AffiliateManager } from './AffiliateManager';
import { SystemMaintenance } from './SystemMaintenance'; // RESTORED
import { AiRecipeCreator } from './AiRecipeCreator'; // NEW
import { SocialPublisher } from './SocialPublisher'; // NEW
import { AdsenseManager } from './AdsenseManager'; // NEW
import { StoryManager } from './StoryManager'; // NEW

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
  
  const [isSaving, setIsSaving] = useState(false);

  // Extras
  const [userStats, setUserStats] = useState({ title: '', level: 1, xp: 0 });
  const [adSettings, setAdSettings] = useState<AdSettings>({ clientId: '', slots: { homeTop: '', homeMiddle: '', sidebar: '' } });

  useEffect(() => {
    const saved = localStorage.getItem('adSettings');
    if (saved) setAdSettings(JSON.parse(saved));
    setUserStats(storageService.getUserLevel());
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

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} userStats={userStats} />

      <div className="flex-1 md:ml-64 p-4 md:p-8">
        
        {activeTab === 'overview' && (
           <DashboardOverview 
             recipes={currentRecipes}
             categories={categories}
             onNavigate={setActiveTab}
           />
        )}

        {activeTab === 'recipes' && (
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
           <AiRecipeCreator onImportSuccess={async (r) => { await onImportSuccess(r); setActiveTab('overview'); }} onCancel={() => setActiveTab('overview')} />
        )}

        {activeTab === 'categories' && <CategoryManager categories={categories} onSave={onUpdateCategories} />}
        {activeTab === 'settings' && <SettingsManager settings={settings} onSave={onUpdateSettings} />}
        {activeTab === 'import' && <WordPressImport onImportSuccess={onImportSuccess} categories={categories} existingRecipes={currentRecipes} />}
        {activeTab === 'affiliates' && <AffiliateManager settings={settings} onSave={onUpdateSettings} />}
        {activeTab === 'system' && <SystemMaintenance recipes={currentRecipes} onUpdateRecipe={onUpdateRecipe} />}
        
        {/* Webhook and External Integration Hubs */}
        {activeTab === 'social' && <SocialPublisher recipes={currentRecipes} settings={settings} />}
        {activeTab === 'stories' && <StoryManager />}
        {activeTab === 'ads' && <AdsenseManager />}

      </div>
    </div>
  );
};
