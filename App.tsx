
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { RecipeDetail } from './components/RecipeDetail';
import { Dashboard } from './components/Dashboard';
import { CategoryPage } from './components/CategoryPage';
import { AllRecipesPage } from './components/AllRecipesPage';
import { FavoritesPage } from './components/FavoritesPage';
import { RecipeCard } from './components/RecipeCard';
import { SearchBar } from './components/SearchBar';
import { AdUnit } from './components/AdUnit';
import { WebStoriesGallery } from './components/WebStoriesGallery';
import { WebStoryViewer } from './components/WebStoryViewer';
import { NutriScanner } from './components/NutriScanner';
import { LoginScreen } from './components/LoginScreen';
import { GlobalTimer } from './components/GlobalTimer'; 
import { ChefBot } from './components/ChefBot'; // NEW
import { Recipe, AdSettings, WebStory, Language, Category, SiteSettings } from './types';
import { t } from './utils/i18n';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'dashboard' | 'detail' | 'category' | 'all-recipes' | 'web-stories' | 'favorites'>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Dynamic Data from Storage
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Receita Popular', 
    siteDescription: '', 
    heroRecipeIds: [], 
    socialLinks: {}
  });
  const [stories, setStories] = useState<WebStory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [activeStory, setActiveStory] = useState<WebStory | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false); // New State for Timer

  // Load Data on Mount (Async for Supabase)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [loadedRecipes, loadedCats, loadedStories, loadedSettings] = await Promise.all([
          storageService.getRecipes(),
          storageService.getCategories(),
          storageService.getStories(),
          storageService.getSettings()
        ]);

        setRecipes(loadedRecipes);
        setCategories(loadedCats);
        setStories(loadedStories);
        setSettings(loadedSettings);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    
    const savedAds = localStorage.getItem('adSettings');
    if (savedAds) setAdSettings(JSON.parse(savedAds));

    // Check for Secret Admin Route
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/admin') || search.includes('admin')) {
       setShowLogin(true);
    }
  }, []);

  // --- Login Logic ---
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    setView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('home');
  };

  // --- CRUD Operations (Async Wrappers) ---
  
  const handleImportSuccess = async (newRecipe: Recipe) => {
    setIsLoading(true); // Show loading while saving to DB
    try {
      await storageService.saveRecipe(newRecipe);
      const updated = await storageService.getRecipes();
      setRecipes(updated);
      setSelectedRecipe(newRecipe);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar receita no banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRecipe = async (updatedRecipe: Recipe) => {
    setIsLoading(true);
    try {
      await storageService.saveRecipe(updatedRecipe);
      const reloaded = await storageService.getRecipes();
      setRecipes(reloaded);
    } catch (e) {
      alert('Erro ao atualizar receita.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    setIsLoading(true);
    try {
      await storageService.deleteRecipe(recipeId);
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
    } catch (e) {
      alert('Erro ao excluir receita.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryCreated = async (newStory: WebStory) => {
    setIsLoading(true);
    try {
      await storageService.saveStory(newStory);
      setStories(prev => [newStory, ...prev]);
    } catch (e) {
      alert('Erro ao salvar story.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategories = async (newCats: Category[]) => {
    setIsLoading(true);
    try {
      await storageService.saveCategories(newCats);
      setCategories(newCats);
    } catch (e) {
      alert('Erro ao salvar categorias.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings: SiteSettings) => {
    setIsLoading(true);
    try {
      await storageService.saveSettings(newSettings);
      setSettings(newSettings);
    } catch (e) {
      alert('Erro ao salvar configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Navigation Helpers ---

  const openRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setView('detail');
    window.scrollTo(0,0);
  };

  const openCategory = (category: Category) => {
    setSelectedCategory(category);
    setView('category');
    window.scrollTo(0,0);
  };

  const openAllRecipes = () => {
    setView('all-recipes');
    window.scrollTo(0,0);
  };
  
  const handleRandomRecipe = () => {
     if (recipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * recipes.length);
        openRecipe(recipes[randomIndex]);
     }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
           <div className="w-16 h-16 border-4 border-pop-gray border-t-pop-red rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Sincronizando com a Nuvem...</p>
        </div>
      </div>
    );
  }

  const isDashboard = view === 'dashboard';

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-pop-dark selection:bg-pop-red selection:text-white">
      
      <GlobalTimer isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />
      <ChefBot recipes={recipes} onOpenRecipe={openRecipe} />
      
      {showLogin && (
        <LoginScreen 
          onLogin={handleLoginSuccess} 
          onCancel={() => setShowLogin(false)} 
        />
      )}

      {activeStory && (
        <WebStoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
      )}

      {isScannerOpen && (
        <NutriScanner onClose={() => setIsScannerOpen(false)} language={language} />
      )}

      {!isDashboard && (
        <Header 
          setView={setView} 
          language={language} 
          setLanguage={setLanguage} 
          onOpenScanner={() => setIsScannerOpen(true)}
          onRandomRecipe={handleRandomRecipe}
          onToggleTimer={() => setIsTimerOpen(!isTimerOpen)}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => setShowLogin(true)}
        />
      )}
      
      {isDashboard && (
         <header className="bg-white border-b border-gray-100 py-4 px-8 flex justify-between items-center md:hidden">
            <div className="font-black text-lg">Área do Chef</div>
            <button onClick={handleLogout} className="text-sm font-bold text-gray-500">Sair</button>
         </header>
      )}
      
      <main className="flex-grow">
        {view === 'home' && (
          <>
            <Hero 
              recipes={recipes} 
              settings={settings} 
              language={language} 
              onOpenRecipe={openRecipe} 
            />
            
            <SearchBar recipes={recipes} onSelectRecipe={openRecipe} language={language} />
            
            <div className="max-w-7xl mx-auto px-4">
              <AdUnit slotId={adSettings?.slots.homeTop} className="mb-8" label="Publicidade Topo" />
            </div>

            <section id="categories-section" className="py-12 border-b border-gray-100/50">
               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="flex justify-between items-baseline mb-8">
                    <h3 className="text-lg font-serif font-bold text-pop-dark italic">{t(language, 'categories')}</h3>
                    <button onClick={openAllRecipes} className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-pop-dark transition-colors">{t(language, 'seeAll')}</button>
                 </div>
                 
                 <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-8 justify-items-center">
                    {categories.map((cat, idx) => (
                      <button 
                        key={cat.id || idx} 
                        onClick={() => openCategory(cat)}
                        className="flex flex-col items-center gap-4 w-full group cursor-pointer"
                      >
                         <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full p-1 border border-gray-100 group-hover:border-pop-red transition-all duration-300">
                           <img 
                              src={cat.img} 
                              alt={cat.name}
                              className="w-full h-full rounded-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                           />
                         </div>
                         <span className="text-xs md:text-sm font-serif font-medium text-gray-600 group-hover:text-pop-red transition-colors text-center">{cat.name}</span>
                      </button>
                    ))}
                 </div>
               </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="text-pop-red font-black text-sm uppercase tracking-widest mb-2 block">{t(language, 'news')}</span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-pop-dark">
                    {t(language, 'latestRecipes')}
                  </h2>
                </div>
                <button onClick={openAllRecipes} className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-pop-dark transition-colors">
                   {t(language, 'seeAll')}
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {recipes.slice(0, 6).map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} onClick={() => openRecipe(recipe)} />
                ))}
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-4">
              <AdUnit slotId={adSettings?.slots.homeMiddle} className="my-12" label="Publicidade Banner" />
            </div>

            <section className="py-20 bg-white overflow-hidden relative mb-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                       <span className="text-pop-yellow font-black text-xs uppercase tracking-widest mb-4 block">{t(language, 'specialCollection')}</span>
                       <h2 className="text-4xl md:text-5xl font-serif font-bold text-pop-dark mb-6 leading-tight">
                         Jantar Italiano <br/> em Casa
                       </h2>
                       <p className="text-lg text-gray-500 font-serif italic mb-8 leading-relaxed border-l-4 border-pop-yellow pl-6">
                         "Viaje para a Toscana sem sair da sua cozinha. Selecionamos as receitas mais autênticas, do antepasto à sobremesa, para você criar uma noite inesquecível."
                       </p>
                       
                       <div className="space-y-4">
                          {[
                            { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>, title: "Risoto de Cogumelos Selvagens" },
                            { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, title: "Bruschetta de Tomate e Manjericão" },
                            { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, title: "Tiramisù Clássico" }
                          ].map((item, idx) => (
                             <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-soft border border-gray-100 group cursor-pointer hover:border-pop-yellow transition-all">
                                <div className="w-10 h-10 rounded-full bg-pop-gray text-gray-500 flex items-center justify-center group-hover:bg-pop-yellow group-hover:text-white transition-colors">
                                   {item.icon}
                                </div>
                                <span className="font-bold text-pop-dark">{item.title}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="relative h-[500px]">
                       <img 
                         src="https://images.unsplash.com/photo-1595295333158-4742f28fbd85?q=80&w=1000&auto=format&fit=crop" 
                         className="absolute inset-0 w-full h-full object-cover rounded-[2rem] shadow-2xl shadow-gray-300"
                         alt="Italian Food"
                       />
                       <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl">
                          <div className="text-center">
                             <span className="block text-3xl font-black text-pop-red">30%</span>
                             <span className="text-xs font-bold text-gray-400 uppercase">Menos Tempo</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </section>

            {stories.length > 0 && <StoriesBar stories={stories} onOpenStory={setActiveStory} />}

            <section className="bg-pop-dark py-20 text-white text-center">
               <div className="max-w-4xl mx-auto px-4">
                  <h2 className="text-3xl md:text-4xl font-serif font-black mb-4">{t(language, 'newsletterTitle')}</h2>
                  <p className="text-gray-400 mb-8 max-w-2xl mx-auto">{t(language, 'newsletterDesc')}</p>
                  <div className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                     <input type="email" placeholder="Seu melhor e-mail" className="flex-1 px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-pop-red" />
                     <button className="px-8 py-4 bg-pop-red rounded-full font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg shadow-red-900/50">{t(language, 'subscribe')}</button>
                  </div>
               </div>
            </section>
          </>
        )}

        {view === 'dashboard' && (
          <Dashboard 
            onImportSuccess={handleImportSuccess}
            onUpdateRecipe={handleUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onStoryCreated={handleStoryCreated}
            currentRecipes={recipes}
            categories={categories}
            onUpdateCategories={handleUpdateCategories}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {view === 'detail' && selectedRecipe && (
          <RecipeDetail 
            recipe={selectedRecipe} 
            allRecipes={recipes}
            onBack={() => { setView('home'); window.scrollTo(0,0); }} 
            language={language}
            onOpenRecipe={openRecipe}
            adSettings={adSettings} // Passing Ad Settings
          />
        )}

        {view === 'category' && selectedCategory && (
          <CategoryPage 
            categoryName={selectedCategory.name}
            categoryImage={selectedCategory.img}
            recipes={recipes}
            onOpenRecipe={openRecipe}
            onBack={() => setView('home')}
          />
        )}

        {view === 'all-recipes' && (
          <AllRecipesPage 
            recipes={recipes}
            onOpenRecipe={openRecipe}
            onBack={() => setView('home')}
          />
        )}

        {view === 'web-stories' && (
          <WebStoriesGallery 
            stories={stories}
            onOpenStory={setActiveStory}
            onBack={() => setView('home')}
          />
        )}

        {view === 'favorites' && (
          <FavoritesPage 
            recipes={recipes.filter(r => storageService.isFavorite(r.id))}
            onOpenRecipe={openRecipe}
            onBack={() => setView('home')}
          />
        )}
      </main>

      {!isDashboard && (
        <Footer 
          categories={categories} 
          settings={settings}
          onOpenAllRecipes={openAllRecipes} 
          onOpenCategory={openCategory}
          language={language}
        />
      )}
    </div>
  );
};

const StoriesBar: React.FC<{stories: WebStory[], onOpenStory: (s: WebStory) => void}> = ({ stories, onOpenStory }) => {
  if (stories.length === 0) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 overflow-x-auto no-scrollbar pb-4">
       <div className="flex gap-6">
          {stories.map(story => (
             <div key={story.id} onClick={() => onOpenStory(story)} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0">
                <div className="w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-pop-yellow to-pop-red group-hover:scale-105 transition-transform">
                   <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                      <img src={story.slides[0].imageUrl} className="w-full h-full object-cover" alt="" />
                   </div>
                </div>
                <span className="text-xs font-bold text-gray-600 truncate w-20 text-center">{story.title}</span>
             </div>
          ))}
       </div>
    </div>
  )
}

export default App;
