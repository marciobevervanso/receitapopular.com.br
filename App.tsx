
import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { RecipeDetail } from './components/RecipeDetail';
import { Dashboard } from './components/Dashboard';
import { CategoryPage } from './components/CategoryPage';
import { AllRecipesPage } from './components/AllRecipesPage';
import { AllCategoriesPage } from './components/AllCategoriesPage';
import { FavoritesPage } from './components/FavoritesPage';
import { MealPlansPage } from './components/MealPlansPage'; // IMPORT
import { RecipeCard } from './components/RecipeCard';
import { SearchBar } from './components/SearchBar';
import { AdUnit } from './components/AdUnit';
import { WebStoriesGallery } from './components/WebStoriesGallery';
import { WebStoryViewer } from './components/WebStoryViewer';
import { NutriScanner } from './components/NutriScanner';
import { LoginScreen } from './components/LoginScreen';
import { GlobalTimer } from './components/GlobalTimer'; 
import { ChefBot } from './components/ChefBot'; 
import { RecipeRow } from './components/RecipeRow'; 
import { WelcomeModal } from './components/WelcomeModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { CookieConsent } from './components/CookieConsent';
import { LazySection } from './components/LazySection';
import { FridgeHunter } from './components/FridgeHunter';
import { RecipeSuggestionModal } from './components/RecipeSuggestionModal';
import { Recipe, AdSettings, WebStory, Language, Category, SiteSettings } from './types';
import { t } from './utils/i18n';
import { storageService } from './services/storageService';

const StoriesBar: React.FC<{ stories: WebStory[]; onOpenStory: (s: WebStory) => void }> = ({ stories, onOpenStory }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 overflow-x-auto no-scrollbar" style={{ contentVisibility: 'auto' }}>
      <div className="flex gap-3 md:gap-4">
        {stories.map(story => (
          <button key={story.id} onClick={() => onOpenStory(story)} className="flex flex-col items-center gap-2 group min-w-[72px] shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] bg-gradient-to-tr from-pop-yellow to-pop-red">
               <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                 <img src={story.slides[0].imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
               </div>
            </div>
            <span className="text-[10px] md:text-xs font-bold text-gray-600 truncate max-w-[70px] md:max-w-[80px] group-hover:text-pop-red transition-colors">{story.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'dashboard' | 'detail' | 'category' | 'all-recipes' | 'web-stories' | 'favorites' | 'all-categories' | 'meal-plans'>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    siteName: 'Receita Popular', 
    siteDescription: '', 
    heroRecipeIds: [], 
    socialLinks: {},
    banners: []
  });
  const [stories, setStories] = useState<WebStory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('pt');
  const [activeStory, setActiveStory] = useState<WebStory | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFridgeHunterOpen, setIsFridgeHunterOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false); 

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

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

    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/admin') || search.includes('admin')) {
       setShowLogin(true);
    }
  }, []);

  const timeContext = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Bom dia', icon: '☀️', tag: 'Café da Manhã' };
    if (hour < 18) return { greeting: 'Boa tarde', icon: '🌤️', tag: 'Almoço' };
    return { greeting: 'Boa noite', icon: '🌙', tag: 'Jantar' };
  }, []);

  const quickRecipes = useMemo(() => {
    return recipes.filter(r => {
      const timeStr = r.totalTime || r.prepTime || "";
      const match = timeStr.match(/(\d+)/);
      if (match) {
        const minutes = parseInt(match[1]);
        return minutes <= 30 && timeStr.includes('min');
      }
      return false;
    });
  }, [recipes]);

  // Dynamic Special Collection Logic
  const specialCollection = useMemo(() => {
    if (categories.length === 0) return null;

    let targetCategory: Category | undefined;

    if (settings.specialCollectionCategoryId) {
      targetCategory = categories.find(c => c.id === settings.specialCollectionCategoryId);
    }
    
    if (!targetCategory) {
       const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
       const index = dayOfYear % categories.length;
       targetCategory = categories[index];
    }

    if (!targetCategory) return null;

    const categoryRecipes = recipes
       .filter(r => r.tags.some(t => t.toLowerCase().includes(targetCategory!.name.toLowerCase()) || targetCategory!.name.toLowerCase().includes(t.toLowerCase())))
       .slice(0, 3);

    return {
       category: targetCategory,
       recipes: categoryRecipes
    };

  }, [categories, recipes, settings.specialCollectionCategoryId]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    setView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('home');
  };

  const handleImportSuccess = async (newRecipe: Recipe, skipGlobalLoading = false) => {
    if (!skipGlobalLoading) setIsLoading(true);
    try {
      await storageService.saveRecipe(newRecipe);
      const updated = await storageService.getRecipes();
      setRecipes(updated);
      if (!skipGlobalLoading) setSelectedRecipe(newRecipe);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar receita no banco de dados.');
    } finally {
      if (!skipGlobalLoading) setIsLoading(false);
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

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    
    setNewsletterStatus('submitting');
    try {
      await storageService.subscribeNewsletter(newsletterEmail);
      setNewsletterStatus('success');
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus('idle'), 3000);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('já está cadastrado')) {
         alert('Este e-mail já está inscrito!');
      } else {
         alert('Erro ao inscrever. Tente novamente.');
      }
      setNewsletterStatus('error');
    }
  };

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

  const openAllCategories = () => {
    setView('all-categories');
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

  const handleFridgeRecipe = (recipe: Recipe) => {
    setIsFridgeHunterOpen(false);
    openRecipe(recipe);
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
    <div className="min-h-screen bg-white flex flex-col font-sans text-pop-dark selection:bg-pop-red selection:text-white overflow-x-hidden">
      
      {/* GLOBAL MODALS & BANNERS */}
      <WelcomeModal />
      <CookieConsent />
      <PwaInstallPrompt />
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

      {isFridgeHunterOpen && (
        <FridgeHunter onClose={() => setIsFridgeHunterOpen(false)} onRecipeGenerated={handleFridgeRecipe} />
      )}

      {isSuggestionOpen && (
        <RecipeSuggestionModal onClose={() => setIsSuggestionOpen(false)} />
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
          categories={categories}
          stories={stories}
          onOpenCategory={openCategory}
          onOpenStory={setActiveStory}
          onOpenSuggestion={() => setIsSuggestionOpen(true)}
        />
      )}
      
      {isDashboard && (
         <header className="bg-white border-b border-gray-100 py-3 px-4 flex justify-between items-center md:hidden sticky top-0 z-50 shadow-sm">
            <div className="font-black text-lg text-pop-dark">Área do Chef</div>
            <button onClick={handleLogout} className="text-xs font-bold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg">Sair</button>
         </header>
      )}
      
      <main className="flex-grow">
        {view === 'home' && (
          <>
            {/* MOBILE QUICK ACTION BAR - STICKY UNDER HEADER */}
            <div className="md:hidden overflow-x-auto no-scrollbar py-3 px-4 bg-white/95 backdrop-blur-sm sticky top-[56px] z-40 border-b border-gray-50 shadow-sm">
               <div className="flex gap-4">
                  <button onClick={() => setView('home')} className="flex flex-col items-center gap-1 min-w-[60px] group">
                     <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 group-active:scale-95 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                     </div>
                     <span className="text-[10px] font-bold text-gray-500">Início</span>
                  </button>
                  
                  <button onClick={() => setView('meal-plans')} className="flex flex-col items-center gap-1 min-w-[60px] group">
                     <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 group-active:scale-95 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                     </div>
                     <span className="text-[10px] font-bold text-gray-500">Planos</span>
                  </button>

                  <button onClick={() => setIsScannerOpen(true)} className="flex flex-col items-center gap-1 min-w-[60px] group">
                     <div className="w-11 h-11 rounded-full bg-pop-dark flex items-center justify-center text-white shadow-md group-active:scale-95 transition-transform ring-2 ring-offset-2 ring-pop-dark/20">
                        <svg className="w-5 h-5 text-pop-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     </div>
                     <span className="text-[10px] font-bold text-pop-dark">Scanner</span>
                  </button>

                  <button onClick={() => setView('favorites')} className="flex flex-col items-center gap-1 min-w-[60px] group">
                     <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 group-active:scale-95 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                     </div>
                     <span className="text-[10px] font-bold text-gray-500">Salvos</span>
                  </button>

                  <button onClick={handleRandomRecipe} className="flex flex-col items-center gap-1 min-w-[60px] group">
                     <div className="w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100 group-active:scale-95 transition-transform">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                     </div>
                     <span className="text-[10px] font-bold text-gray-500">Sorte</span>
                  </button>
               </div>
            </div>

            <Hero 
              recipes={recipes} 
              settings={settings} 
              language={language} 
              onOpenRecipe={openRecipe} 
            />
            
            <div className="relative -mt-8 z-20">
               <SearchBar 
                 recipes={recipes} 
                 onSelectRecipe={openRecipe} 
                 language={language} 
                 onOpenFridgeHunter={() => setIsFridgeHunterOpen(true)}
               />
            </div>
            
            <button 
              onClick={() => setIsFridgeHunterOpen(true)}
              className="fixed bottom-6 left-6 z-40 bg-gradient-to-br from-blue-500 to-cyan-400 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center animate-bounce-slow hover:scale-110 transition-transform md:hidden"
              title="O que tem na geladeira?"
            >
               <span className="text-2xl">🧊</span>
            </button>
            
            <div className="max-w-7xl mx-auto px-4">
              <AdUnit 
                slotId={adSettings?.slots.homeTop} 
                className="mb-8" 
                label="Publicidade Topo"
                banners={settings.banners}
                position="home_top"
              />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-fade-in">
               <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{timeContext.icon}</span>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-pop-dark">
                    {timeContext.greeting}, Chef!
                  </h2>
               </div>
               <p className="text-gray-500 text-sm md:text-base">
                  Separamos algumas ideias perfeitas para o seu <strong>{timeContext.tag}</strong>.
               </p>
            </div>

            <LazySection minHeight="200px">
              <section id="categories-section" className="py-6 md:py-10 border-b border-gray-100/50 bg-white">
                 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                   <div className="flex justify-between items-baseline mb-4 md:mb-8">
                      <h3 className="text-lg md:text-2xl font-serif font-bold text-pop-dark tracking-tight">{t(language, 'categories')}</h3>
                      <button onClick={openAllCategories} className="text-xs font-bold text-pop-red uppercase tracking-widest hover:underline transition-all">{t(language, 'seeAll')}</button>
                   </div>
                   
                   <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar snap-x snap-mandatory" style={{ contentVisibility: 'auto' }}>
                      {categories.slice(0, 10).map((cat, idx) => {
                        const optimizedImg = cat.img.includes('unsplash') && !cat.img.includes('&w=') 
                           ? `${cat.img}&w=400` 
                           : cat.img.replace('w=800', 'w=400');

                        return (
                          <button 
                            key={cat.id || idx} 
                            onClick={() => openCategory(cat)}
                            className="relative flex-none w-28 md:w-48 aspect-square md:aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer snap-start shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                          >
                             <img 
                                src={optimizedImg} 
                                alt={cat.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                loading="lazy"
                             />
                             {/* Mobile Gradient (Stronger at bottom for text readability) */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 md:opacity-60"></div>
                             
                             <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 text-center md:text-left">
                                <span className="block text-[10px] md:text-base font-bold text-white leading-tight drop-shadow-md">
                                  {cat.name}
                                </span>
                             </div>
                          </button>
                        )
                      })}
                   </div>
                 </div>
              </section>
            </LazySection>

            {quickRecipes.length > 0 && (
               <LazySection minHeight="350px">
                 <RecipeRow 
                    title="Pronto em 30 Minutos" 
                    subtitle="Sem tempo a perder"
                    recipes={quickRecipes.slice(0, 12)}
                    onOpenRecipe={openRecipe}
                 />
               </LazySection>
            )}

            <LazySection minHeight="600px">
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
                <div className="flex items-end justify-between mb-8 md:mb-12">
                  <div>
                    <span className="text-pop-red font-black text-xs uppercase tracking-widest mb-2 block">{t(language, 'news')}</span>
                    <h2 className="text-2xl md:text-4xl font-serif font-bold text-pop-dark">
                      {t(language, 'latestRecipes')}
                    </h2>
                  </div>
                  <button onClick={openAllRecipes} className="hidden md:flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-pop-dark transition-colors">
                     {t(language, 'seeAll')}
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  {recipes.slice(0, 6).map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} onClick={() => openRecipe(recipe)} />
                  ))}
                </div>
                
                <div className="mt-8 text-center md:hidden">
                   <button onClick={openAllRecipes} className="px-6 py-3 border border-gray-200 rounded-full text-sm font-bold text-gray-600 w-full">Ver todas as receitas</button>
                </div>
              </section>
            </LazySection>

            <div className="max-w-7xl mx-auto px-4">
              <AdUnit 
                slotId={adSettings?.slots.homeMiddle} 
                className="my-8 md:my-12" 
                label="Publicidade Banner"
                banners={settings.banners}
                position="home_middle"
              />
            </div>

            {specialCollection && (
              <LazySection minHeight="400px">
                <section className="py-16 md:py-20 bg-white overflow-hidden relative mb-12">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                        <div>
                          <span className="text-pop-yellow font-black text-xs uppercase tracking-widest mb-4 block">{t(language, 'specialCollection')}</span>
                          <h2 className="text-3xl md:text-5xl font-serif font-bold text-pop-dark mb-4 md:mb-6 leading-tight">
                            Especial: <br/> {specialCollection.category.name}
                          </h2>
                          <p className="text-base md:text-lg text-gray-500 font-serif italic mb-8 leading-relaxed border-l-4 border-pop-yellow pl-6">
                            "Uma seleção exclusiva das nossas melhores receitas de {specialCollection.category.name.toLowerCase()}. Sabores autênticos para momentos inesquecíveis."
                          </p>
                          
                          <div className="space-y-4">
                              {specialCollection.recipes.length > 0 ? specialCollection.recipes.map((item, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => openRecipe(item)}
                                  className="flex items-center gap-4 p-3 md:p-4 bg-white rounded-xl shadow-soft border border-gray-100 group cursor-pointer hover:border-pop-yellow transition-all"
                                >
                                    <div className="w-12 h-12 rounded-full bg-pop-gray overflow-hidden shrink-0">
                                      <img src={item.imageUrl} className="w-full h-full object-cover" alt="" loading="lazy" />
                                    </div>
                                    <span className="font-bold text-pop-dark group-hover:text-pop-red transition-colors text-sm md:text-base">{item.title}</span>
                                </div>
                              )) : (
                                <p className="text-sm text-gray-400 italic">Em breve novas receitas nesta coleção...</p>
                              )}
                          </div>
                          
                          <button 
                            onClick={() => openCategory(specialCollection.category)}
                            className="mt-8 text-sm font-bold text-pop-dark underline decoration-pop-yellow decoration-2 underline-offset-4 hover:text-pop-red"
                          >
                            Ver toda a coleção &rarr;
                          </button>
                        </div>

                        <div className="relative h-[350px] md:h-[500px] group cursor-pointer" onClick={() => openCategory(specialCollection.category)}>
                          <img 
                            src={specialCollection.category.img} 
                            className="absolute inset-0 w-full h-full object-cover rounded-[2rem] shadow-2xl shadow-gray-300 transition-transform duration-700 group-hover:scale-105"
                            alt={specialCollection.category.name}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-[2rem]"></div>
                          <div className="absolute -bottom-6 -left-6 bg-white p-4 md:p-6 rounded-2xl shadow-xl animate-[bounce_3s_infinite]">
                              <div className="text-center">
                                <span className="block text-2xl md:text-3xl font-black text-pop-red">Top 3</span>
                                <span className="text-xs font-bold text-gray-400 uppercase">Da Semana</span>
                              </div>
                          </div>
                        </div>
                    </div>
                  </div>
                </section>
              </LazySection>
            )}

            {stories.length > 0 && (
              <LazySection minHeight="120px">
                <StoriesBar stories={stories} onOpenStory={setActiveStory} />
              </LazySection>
            )}

            <LazySection minHeight="300px">
              <section className="bg-pop-dark py-12 md:py-20 text-white text-center overflow-hidden w-full">
                 <div className="max-w-4xl mx-auto px-4 overflow-hidden">
                    <h2 className="text-2xl md:text-4xl font-serif font-black mb-4">{t(language, 'newsletterTitle')}</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto text-sm md:text-base">{t(language, 'newsletterDesc')}</p>
                    <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
                       <form onSubmit={handleNewsletterSubmit} className="flex flex-col md:flex-row gap-4 w-full">
                         <input 
                           type="email" 
                           placeholder="Seu melhor e-mail" 
                           value={newsletterEmail}
                           onChange={e => setNewsletterEmail(e.target.value)}
                           disabled={newsletterStatus === 'submitting' || newsletterStatus === 'success'}
                           className="w-full px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-pop-red disabled:opacity-50" 
                           required
                         />
                         <button 
                           type="submit"
                           disabled={newsletterStatus === 'submitting' || newsletterStatus === 'success'}
                           className={`w-full md:w-auto px-8 py-4 rounded-full font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg shadow-red-900/50 disabled:opacity-50 whitespace-nowrap ${newsletterStatus === 'success' ? 'bg-green-500' : 'bg-pop-red'}`}
                         >
                           {newsletterStatus === 'submitting' ? '...' : newsletterStatus === 'success' ? 'Inscrito!' : t(language, 'subscribe')}
                         </button>
                       </form>
                    </div>
                 </div>
              </section>
            </LazySection>
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
            adSettings={adSettings}
            settings={settings}
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

        {view === 'all-categories' && (
           <AllCategoriesPage 
              categories={categories}
              onOpenCategory={openCategory}
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

        {view === 'meal-plans' && (
           <MealPlansPage 
             allRecipes={recipes}
             onBack={() => setView('home')}
             onOpenRecipe={openRecipe}
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
