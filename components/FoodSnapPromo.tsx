
import React from 'react';

interface FoodSnapPromoProps {
  variant?: 'sidebar' | 'banner';
  className?: string;
}

export const FoodSnapPromo: React.FC<FoodSnapPromoProps> = ({ variant = 'sidebar', className = '' }) => {
  return (
    <a 
      href="https://foodsnap.com.br" 
      target="_blank" 
      rel="noopener noreferrer"
      className={`group block relative overflow-hidden rounded-3xl transition-all duration-500 hover:shadow-2xl no-print ${className} ${
        variant === 'sidebar' 
          ? 'bg-[#0F172A] p-6 text-center' 
          : 'bg-[#0F172A] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-12'
      }`}
    >
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-green-500/30 transition-colors"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10 group-hover:bg-blue-500/30 transition-colors"></div>

      {/* Visual Content */}
      <div className={`relative z-10 flex-shrink-0 ${variant === 'sidebar' ? 'mb-4' : ''}`}>
         <div className={`mx-auto bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500 ${
            variant === 'sidebar' ? 'w-20 h-20 rotate-3' : 'w-20 h-20 md:w-24 md:h-24 md:-rotate-3'
         }`}>
            <span className="text-4xl md:text-5xl">📸</span>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-[#0F172A] animate-bounce">
               IA
            </div>
         </div>
      </div>

      {/* Text Content */}
      <div className={`relative z-10 flex-1 ${variant === 'sidebar' ? '' : 'text-center md:text-left'}`}>
         <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Nutricionista de Bolso</span>
         </div>
         
         <h3 className={`font-serif font-bold text-white leading-tight mb-2 ${variant === 'sidebar' ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
            Transforme seu corpo com <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">apenas uma foto.</span>
         </h3>
         
         <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6">
            O FoodSnap.ai elimina a necessidade de pesar comida. Tire uma foto e nossa IA calcula calorias e macros em tempo real.
         </p>

         <div className={`inline-flex items-center gap-2 font-bold text-white bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl transition-all shadow-lg shadow-green-900/50 group-hover:translate-y-[-2px] ${variant === 'sidebar' ? 'w-full justify-center text-sm' : ''}`}>
            <span>Testar IA Agora</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
         </div>
      </div>
    </a>
  );
};
