
import React, { useState, useEffect, useRef } from 'react';
import { Language, t } from '../utils/i18n';
import { Category, WebStory } from '../types';

interface HeaderProps {
  setView: (view: 'home' | 'dashboard' | 'web-stories' | 'favorites' | 'all-categories' | 'meal-plans') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenScanner: () => void;
  onRandomRecipe: () => void;
  onToggleTimer: () => void;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  categories?: Category[];
  stories?: WebStory[];
  onOpenCategory?: (cat: Category) => void;
  onOpenStory?: (story: WebStory) => void;
  onOpenSuggestion?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  setView, 
  language, 
  setLanguage, 
  onOpenScanner, 
  onRandomRecipe,
  onToggleTimer,
  onLoginClick,
  categories = [],
  stories = [],
  onOpenCategory,
  onOpenStory,
  onOpenSuggestion
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);
  
  const [hoveredMenu, setHoveredMenu] = useState<'none' | 'categories' | 'stories'>('none');
  const navLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const langMenuRef = useRef<HTMLDivElement>(null);

  const flags: Record<Language, string> = {
     pt: '🇧🇷',
     en: '🇺🇸',
     es: '🇪🇸'
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    
    const handleClickOutside = (event: MouseEvent) => {
       if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
          setShowLangMenu(false);
       }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
       window.removeEventListener('scroll', handleScroll);
       document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (secretClickCount > 0) {
      const timer = setTimeout(() => setSecretClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [secretClickCount]);

  const handleLogoClick = () => {
    setView('home');
    const nextCount = secretClickCount + 1;
    setSecretClickCount(nextCount);
    if (nextCount >= 5) {
      onLoginClick();
      setSecretClickCount(0);
    }
  };

  const handleMouseEnterNav = (menu: 'categories' | 'stories') => {
    if (navLeaveTimerRef.current) clearTimeout(navLeaveTimerRef.current);
    setHoveredMenu(menu);
  };

  const handleMouseLeaveNav = () => {
    navLeaveTimerRef.current = setTimeout(() => {
      setHoveredMenu('none');
    }, 200);
  };

  const scrollToSection = (id: string) => {
    setView('home');
    setShowMobileMenu(false);
    setTimeout(() => {
       const section = document.getElementById(id);
       if (section) section.scrollIntoView({ behavior: 'smooth' });
       if (id === 'footer') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-500 border-b ${
          isScrolled 
            ? 'bg-gradient-to-r from-pop-red/5 via-white/95 to-pop-yellow/5 backdrop-blur-lg shadow-lg shadow-pop-red/10 border-gray-200 py-2' 
            : 'bg-gradient-to-r from-pop-red/5 via-white/90 to-pop-yellow/5 backdrop-blur-md shadow-sm border-transparent py-3'
        } no-print`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-14 md:h-16">
            
            {/* Logo */}
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            >
              <div className="relative w-10 h-10 md:w-11 md:h-11 bg-pop-dark rounded-xl flex items-center justify-center text-white shadow-xl shadow-gray-400/50 transform group-hover:rotate-6 transition-transform border-2 border-transparent group-hover:border-pop-red">
                 <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" /></svg>
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-xl md:text-2xl font-black tracking-tighter text-pop-dark leading-none font-sans drop-shadow-sm">
                  Receita<span className="text-pop-red">Popular</span>
                </h1>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 h-full">
              <button onClick={() => setView('home')} className="text-sm font-bold text-gray-500 hover:text-pop-dark transition-colors">
                {t(language, 'home')}
              </button>

              <button onClick={() => setView('meal-plans')} className="text-sm font-bold text-gray-500 hover:text-pop-green transition-colors flex items-center gap-1">
                <span>Planos</span>
                <span className="bg-pop-green/10 text-pop-green text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">Novo</span>
              </button>

              {/* Categorias Mega Menu */}
              <div 
                className="h-full flex items-center group cursor-pointer"
                onMouseEnter={() => handleMouseEnterNav('categories')}
                onMouseLeave={handleMouseLeaveNav}
              >
                <button 
                  onClick={() => setView('all-categories')}
                  className={`text-sm font-bold transition-colors flex items-center gap-1 py-2 ${hoveredMenu === 'categories' ? 'text-pop-red' : 'text-gray-500 hover:text-pop-dark'}`}
                >
                  {t(language, 'categories')}
                  <svg className={`w-3 h-3 transition-transform duration-300 ${hoveredMenu === 'categories' ? 'rotate-180 text-pop-red' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {hoveredMenu === 'categories' && (
                  <div className="absolute top-[80%] left-0 w-full pt-4 animate-fade-in z-50">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8 grid grid-cols-12 gap-8">
                       <div className="col-span-3 bg-gray-50 rounded-xl p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="font-serif font-bold text-2xl text-pop-dark mb-2">Explore Sabores</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">Navegue por nossa seleção completa de pratos organizados.</p>
                          </div>
                          <button onClick={() => { setView('all-categories'); setHoveredMenu('none'); }} className="mt-6 px-4 py-3 bg-pop-dark text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-colors w-full text-center">
                             Ver Todas as Categorias
                          </button>
                       </div>
                       <div className="col-span-9">
                          <div className="grid grid-cols-4 gap-6">
                              {categories.slice(0, 8).map(cat => (
                                 <button key={cat.id} onClick={() => { if(onOpenCategory) onOpenCategory(cat); setHoveredMenu('none'); }} className="flex flex-col items-center gap-3 group/cat p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="w-16 h-16 rounded-full p-1 border-2 border-transparent group-hover/cat:border-pop-red transition-all">
                                       <img src={cat.img} alt={cat.name} className="w-full h-full object-cover rounded-full group-hover/cat:scale-105 transition-transform" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600 group-hover/cat:text-pop-dark">{cat.name}</span>
                                 </button>
                              ))}
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Web Stories Mega Menu */}
              <div 
                className="h-full flex items-center group cursor-pointer"
                onMouseEnter={() => handleMouseEnterNav('stories')}
                onMouseLeave={handleMouseLeaveNav}
              >
                 <button 
                  onClick={() => setView('web-stories')}
                  className={`text-sm font-bold transition-colors relative flex items-center gap-1 py-2 ${hoveredMenu === 'stories' ? 'text-pop-red' : 'text-gray-500 hover:text-pop-dark'}`}
                >
                  {t(language, 'webStories')}
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-pop-red animate-pulse"></span>
                  <svg className={`w-3 h-3 transition-transform duration-300 ${hoveredMenu === 'stories' ? 'rotate-180 text-pop-red' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {hoveredMenu === 'stories' && (
                   <div className="absolute top-[80%] left-0 w-full pt-4 animate-fade-in z-50">
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-8">
                         <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                             <div><h3 className="text-xl font-black text-pop-dark flex items-center gap-2">Stories Recentes <span className="text-[10px] bg-pop-red text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Novo</span></h3></div>
                             <button onClick={() => { setView('web-stories'); setHoveredMenu('none'); }} className="text-sm font-bold text-pop-red hover:underline flex items-center gap-1">Ver Galeria Completa &rarr;</button>
                         </div>
                         
                         {stories.length > 0 ? (
                            <div className="grid grid-cols-5 gap-6">
                               {stories.slice(0, 5).map(story => (
                                  <button key={story.id} onClick={() => { if(onOpenStory) onOpenStory(story); setHoveredMenu('none'); }} className="group/story text-left relative aspect-[9/16] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                                     <img src={story.slides[0].imageUrl} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/story:scale-110" />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"></div>
                                     <div className="absolute bottom-3 left-3 right-3"><p className="text-xs text-white font-bold leading-tight line-clamp-2 drop-shadow-md">{story.title}</p></div>
                                     <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"><svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                                  </button>
                               ))}
                            </div>
                         ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p className="text-gray-400 font-bold italic">Nenhum story publicado no momento.</p></div>
                         )}
                      </div>
                   </div>
                )}
              </div>

              <button onClick={() => scrollToSection('footer')} className="text-sm font-bold text-gray-500 hover:text-pop-dark transition-colors">Sobre</button>
            </nav>

            {/* Right Tools - Hidden on Mobile */}
            <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
              
              {/* Fun Tools Group */}
              <div className="hidden md:flex items-center bg-gray-50 rounded-full p-1 border border-gray-200 shadow-inner">
                <button onClick={onOpenSuggestion} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-pop-yellow hover:bg-white rounded-full transition-all" title="Sugerir Receita">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button onClick={onToggleTimer} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-pop-dark hover:bg-white rounded-full transition-all" title="Cronômetro">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button onClick={onRandomRecipe} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-pop-dark hover:bg-white rounded-full transition-all" title="Aleatório">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                </button>
              </div>

              {/* Favorites - Standalone */}
              <button 
                onClick={() => setView('favorites')} 
                className="hidden md:flex w-10 h-10 items-center justify-center text-gray-400 hover:text-pop-red bg-white hover:bg-red-50 border border-gray-200 hover:border-red-100 rounded-full transition-all shadow-sm group" 
                title="Favoritos"
              >
                 <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>

              {/* Desktop Scanner Button */}
              <button onClick={onOpenScanner} className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-pop-dark text-white rounded-full text-xs font-bold uppercase tracking-wide hover:bg-black transition-all shadow-lg shadow-gray-300 hover:shadow-xl hover:-translate-y-0.5">
                 <svg className="w-4 h-4 text-pop-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 <span className="hidden lg:inline">{t(language, 'nutriScanner')}</span>
              </button>

              {/* Language Menu - HIDDEN TEMPORARILY */}
              <div className="relative hidden" ref={langMenuRef}>
                 <button onClick={() => setShowLangMenu(!showLangMenu)} className="w-10 h-10 flex items-center justify-center text-lg bg-white border border-gray-200 hover:bg-gray-50 rounded-full transition-all shadow-sm">
                    {flags[language]}
                 </button>
                 {showLangMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 min-w-[140px] flex flex-col gap-1 animate-fade-in z-50">
                       {(['pt', 'en', 'es'] as Language[]).map(l => (
                          <button key={l} onClick={() => { setLanguage(l); setShowLangMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-600 hover:text-pop-dark w-full text-left">
                             <span className="text-xl">{flags[l]}</span> {l.toUpperCase()}
                          </button>
                       ))}
                    </div>
                 )}
              </div>

              {/* Hamburger Menu - Visible on Mobile */}
              <button className="md:hidden p-2 text-pop-dark ml-1" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                {showMobileMenu ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {showMobileMenu && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-2xl animate-fade-in px-6 py-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto z-50">
             <div className="space-y-2">
                <button onClick={() => { setView('home'); setShowMobileMenu(false); }} className="w-full text-left text-lg font-bold text-pop-dark py-4 border-b border-gray-50 active:bg-gray-50">{t(language, 'home')}</button>
                <button onClick={() => { setView('meal-plans'); setShowMobileMenu(false); }} className="w-full text-left text-lg font-bold text-pop-dark py-4 border-b border-gray-50 active:bg-gray-50">Planos de Alimentação</button>
                <button onClick={() => { setView('all-categories'); setShowMobileMenu(false); }} className="w-full text-left text-lg font-bold text-pop-dark py-4 border-b border-gray-50 active:bg-gray-50">{t(language, 'categories')}</button>
                <button onClick={() => { setView('web-stories'); setShowMobileMenu(false); }} className="w-full text-left text-lg font-bold text-pop-dark py-4 border-b border-gray-50 flex justify-between items-center active:bg-gray-50">
                   {t(language, 'webStories')} <span className="text-[10px] bg-pop-red text-white px-2 py-0.5 rounded-full uppercase font-bold">Novo</span>
                </button>
                <button onClick={() => { if(onOpenSuggestion) onOpenSuggestion(); setShowMobileMenu(false); }} className="w-full text-left text-lg font-bold text-pop-dark py-4 border-b border-gray-50 flex justify-between items-center active:bg-gray-50">
                   Sugerir Receita <span className="text-xl">💡</span>
                </button>
                <button onClick={() => scrollToSection('footer')} className="w-full text-left text-lg font-bold text-pop-dark py-4 border-b border-gray-50 active:bg-gray-50">Sobre</button>
             </div>
             
             {/* Hide Lang Menu on Mobile too as requested */}
             {/* 
             <div className="bg-gray-50 p-6 rounded-2xl flex justify-around items-center mt-2">
                 {(['pt', 'en', 'es'] as Language[]).map(l => (
                    <button key={l} onClick={() => setLanguage(l)} className={`text-3xl p-3 rounded-xl transition-all ${language === l ? 'bg-white shadow-md scale-110 ring-2 ring-pop-red/20' : 'opacity-50 grayscale hover:grayscale-0'}`}>
                        {flags[l]}
                    </button>
                 ))}
             </div> 
             */}
          </div>
        )}
      </header>
    </>
  );
};
