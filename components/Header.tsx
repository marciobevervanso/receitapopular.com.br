
import React, { useState, useEffect, useRef } from 'react';
import { Language, t } from '../utils/i18n';

interface HeaderProps {
  setView: (view: 'home' | 'dashboard' | 'web-stories' | 'favorites') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenScanner: () => void;
  onRandomRecipe: () => void;
  onToggleTimer: () => void; // New Prop
  isLoggedIn: boolean;
  onLoginClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  setView, 
  language, 
  setLanguage, 
  onOpenScanner, 
  onRandomRecipe,
  onToggleTimer, // Usage
  isLoggedIn,
  onLoginClick
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [secretClickCount, setSecretClickCount] = useState(0);
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

  // Reset secret click counter if inactive for 2 seconds
  useEffect(() => {
    if (secretClickCount > 0) {
      const timer = setTimeout(() => setSecretClickCount(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [secretClickCount]);

  const handleLogoClick = () => {
    setView('home');
    
    // Easter Egg Logic: 5 clicks triggers login
    const nextCount = secretClickCount + 1;
    setSecretClickCount(nextCount);
    
    if (nextCount >= 5) {
      onLoginClick();
      setSecretClickCount(0);
    }
  };

  const scrollToCategories = () => {
    setView('home');
    setTimeout(() => {
       const section = document.getElementById('categories-section');
       if (section) section.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <>
      {/* Main Header - No Top Bar */}
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur shadow-sm border-gray-100 py-2' 
            : 'bg-white border-gray-100 py-4'
        } no-print`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            {/* Logo Brand */}
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-3 cursor-pointer group select-none"
              title="Clique 5 vezes para acesso Admin"
            >
              <div className="relative w-10 h-10 bg-pop-dark rounded-lg flex items-center justify-center text-white shadow-md transform group-hover:rotate-3 transition-transform">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C8.6 5.4 7.3 6.6 6.6 8.2C6.1 8.1 5.6 8 5 8C3.3 8 2 9.3 2 11C2 12.7 3.3 14 5 14V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V14C20.7 14 22 12.7 22 11C22 9.3 20.7 8 19 8C18.4 8 17.9 8.1 17.4 8.2C16.7 6.6 15.4 5.4 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2ZM7 20V15H17V20H7Z" />
                 </svg>
              </div>
              
              <div className="flex flex-col justify-center">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-pop-dark leading-none font-sans">
                  Receita<span className="text-pop-red">Popular</span>
                </h1>
              </div>
            </div>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
              <button 
                onClick={() => setView('home')}
                className="text-sm font-bold text-gray-500 hover:text-pop-red transition-colors"
              >
                {t(language, 'home')}
              </button>
              <button 
                onClick={scrollToCategories}
                className="text-sm font-bold text-gray-500 hover:text-pop-red transition-colors"
              >
                {t(language, 'categories')}
              </button>
              <button 
                onClick={() => setView('web-stories')}
                className="text-sm font-bold text-gray-500 hover:text-pop-red transition-colors flex items-center gap-1"
              >
                 <span className="w-1.5 h-1.5 rounded-full bg-pop-red"></span>
                 {t(language, 'webStories')}
              </button>
            </nav>

            {/* Right Tools - Clean Icons + Flags */}
            <div className="flex items-center gap-1 md:gap-2">
              
              {/* Language Dropdown */}
              <div className="relative" ref={langMenuRef}>
                 <button 
                   onClick={() => setShowLangMenu(!showLangMenu)}
                   className="w-10 h-10 flex items-center justify-center text-lg bg-gray-50 hover:bg-gray-100 rounded-full transition-all border border-transparent hover:border-gray-200"
                   title="Mudar Idioma"
                 >
                    {flags[language]}
                 </button>
                 {showLangMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 min-w-[120px] flex flex-col gap-1 animate-fade-in">
                       <button onClick={() => { setLanguage('pt'); setShowLangMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-600 hover:text-pop-dark w-full text-left">
                          <span>🇧🇷</span> PT
                       </button>
                       <button onClick={() => { setLanguage('en'); setShowLangMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-600 hover:text-pop-dark w-full text-left">
                          <span>🇺🇸</span> EN
                       </button>
                       <button onClick={() => { setLanguage('es'); setShowLangMenu(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-bold text-gray-600 hover:text-pop-dark w-full text-left">
                          <span>🇪🇸</span> ES
                       </button>
                    </div>
                 )}
              </div>

              <div className="h-6 w-px bg-gray-200 mx-1"></div>

              {/* Random Recipe (Dice) */}
              <button 
                onClick={onRandomRecipe}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-pop-dark hover:bg-gray-50 rounded-full transition-all"
                title="Receita Aleatória"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
              </button>

              {/* Timer Button (NEW) */}
              <button 
                onClick={onToggleTimer}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-pop-dark hover:bg-gray-50 rounded-full transition-all"
                title="Cronômetro"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              {/* Favorites */}
              <button 
                onClick={() => setView('favorites')}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-pop-red hover:bg-gray-50 rounded-full transition-all"
                title="Favoritos"
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>

              {/* NutriScanner */}
              <button 
                onClick={onOpenScanner}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-pop-green hover:bg-gray-50 rounded-full transition-all"
                title={t(language, 'nutriScanner')}
              >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>

              {/* Mobile Menu Icon (Placeholder for future mobile nav) */}
              <button className="md:hidden p-2 text-pop-dark ml-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>
    </>
  );
};
