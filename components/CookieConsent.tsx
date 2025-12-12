
import React, { useState, useEffect } from 'react';
import { t } from '../utils/i18n';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Pequeno delay para não aparecer instantaneamente junto com outros elementos
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 md:p-6 animate-slide-up no-print">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-4">
           <div className="w-10 h-10 bg-pop-yellow/10 rounded-full flex items-center justify-center text-xl shrink-0">
              🍪
           </div>
           <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              <span className="font-bold text-pop-dark">Nós usamos cookies</span> para melhorar sua experiência, analisar o tráfego e personalizar conteúdo. Ao continuar navegando, você concorda com nossa política de privacidade.
           </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={handleAccept}
             className="flex-1 md:flex-none px-6 py-3 bg-pop-dark text-white text-sm font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-gray-200"
           >
             Aceitar e Fechar
           </button>
        </div>
      </div>
    </div>
  );
};
