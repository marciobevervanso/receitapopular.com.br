
import React, { useState, useEffect } from 'react';
import { Recipe } from '../types';

interface CookModeViewerProps {
  recipe: Recipe;
  onClose: () => void;
}

export const CookModeViewer: React.FC<CookModeViewerProps> = ({ recipe, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  
  // Timer State (Cooking Timer)
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Auto Play State (Hands Free)
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);

  // Prevent screen sleep (Wake Lock API)
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          // @ts-ignore
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock not supported');
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  // Cooking Timer Logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Auto Play Logic (Hands Free)
  useEffect(() => {
    let stepInterval: any;
    let progressInterval: any;

    if (isAutoPlay && currentStep < recipe.steps.length - 1) {
      // Calculate duration based on text length (approx 2.5 words per second + 5s buffer)
      const wordCount = recipe.steps[currentStep].split(' ').length;
      const durationMs = Math.max(5000, (wordCount * 400) + 5000); 
      const tickRate = 100; // update progress every 100ms
      const totalTicks = durationMs / tickRate;
      let currentTick = 0;

      // Reset progress visual
      setAutoPlayProgress(0);

      progressInterval = setInterval(() => {
        currentTick++;
        const percent = (currentTick / totalTicks) * 100;
        setAutoPlayProgress(Math.min(100, percent));
      }, tickRate);

      stepInterval = setTimeout(() => {
        setCurrentStep(c => c + 1);
        // Reset progress for next slide handled by dependency change
      }, durationMs);
    } else if (currentStep === recipe.steps.length - 1) {
      setIsAutoPlay(false); // Stop at end
      setAutoPlayProgress(100);
    }

    return () => {
      clearTimeout(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isAutoPlay, currentStep, recipe.steps]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentStep < recipe.steps.length - 1) setCurrentStep(c => c + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimer(0);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#FAF9F6] text-pop-dark flex flex-col font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-gray-100 shadow-sm relative z-20">
        <div className="flex items-center gap-4">
           <button 
             onClick={onClose}
             className="text-gray-400 hover:text-pop-red transition-colors flex items-center gap-1 text-sm font-bold uppercase tracking-wider"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
             <span className="hidden md:inline">Sair</span>
           </button>
           <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
           <h2 className="text-lg font-serif font-bold truncate max-w-[100px] md:max-w-md hidden md:block">{recipe.title}</h2>
        </div>

        {/* Center Timer (Cooking Stopwatch) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 md:px-4 md:py-2">
           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           <span className="font-mono font-bold text-lg md:text-xl w-14 md:w-16 text-center">{formatTime(timer)}</span>
           <button onClick={toggleTimer} className={`p-1 rounded-full ${isTimerRunning ? 'text-red-500 bg-red-100' : 'text-green-600 bg-green-100'}`} title="Iniciar/Pausar Cronômetro">
              {isTimerRunning ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
           </button>
           <button onClick={resetTimer} className="text-gray-400 hover:text-gray-600" title="Zerar Cronômetro">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
           </button>
        </div>

        <div className="flex items-center gap-2">
           {/* Auto Play Button */}
           <button 
             onClick={() => setIsAutoPlay(!isAutoPlay)}
             className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs md:text-sm transition-all border ${isAutoPlay ? 'bg-pop-green text-white border-pop-green shadow-green-200 shadow-md' : 'bg-white text-gray-600 border-gray-200'}`}
           >
             {isAutoPlay ? (
               <>
                 <span className="relative flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                 </span>
                 <span className="hidden md:inline">Mãos Livres ON</span>
               </>
             ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="hidden md:inline">Mãos Livres</span>
                </>
             )}
           </button>

           {/* Ingredients Toggle */}
           <button 
             onClick={() => setShowIngredients(!showIngredients)}
             className={`p-2 md:px-4 md:py-2 rounded-lg font-bold text-sm transition-all border ${showIngredients ? 'bg-pop-yellow text-pop-dark border-pop-yellow' : 'bg-white text-gray-600 border-gray-200'}`}
             title="Ingredientes"
           >
             <span className="hidden md:inline">{showIngredients ? 'Ocultar' : 'Ingredientes'}</span>
             <svg className="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showIngredients ? 'md:mr-80' : ''}`}>
           
           {/* Visual Anchor (Image) */}
           <div className="h-1/3 md:h-2/5 w-full bg-gray-200 relative overflow-hidden">
              <img 
                src={recipe.imageUrl} 
                alt="Passo atual" 
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] to-transparent"></div>
           </div>

           {/* Text Step */}
           <div className="flex-1 flex items-center justify-center p-6 md:p-16 -mt-10 md:-mt-20 z-10 overflow-y-auto">
              <div className="max-w-4xl w-full text-center animate-fade-in">
                <span className="inline-block px-4 py-1 bg-white border border-gray-200 shadow-sm rounded-full text-sm font-bold text-pop-red uppercase tracking-widest mb-6 md:mb-8">
                  Passo {currentStep + 1} de {recipe.steps.length}
                </span>
                <p className="text-xl md:text-5xl font-serif font-medium leading-relaxed md:leading-snug text-pop-dark">
                  {recipe.steps[currentStep]}
                </p>
                {isAutoPlay && (
                   <div className="mt-8 max-w-xs mx-auto h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-pop-green transition-all duration-100 ease-linear" style={{ width: `${autoPlayProgress}%` }}></div>
                   </div>
                )}
              </div>
           </div>
        </div>

        {/* Ingredients Sidebar (Drawer) */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 z-30 overflow-y-auto ${showIngredients ? 'translate-x-0' : 'translate-x-full'}`}
        >
           <div className="p-6">
              <h3 className="font-black text-lg text-pop-dark uppercase tracking-wide mb-6 border-b border-gray-100 pb-2">Ingredientes</h3>
              <ul className="space-y-4">
                {recipe.ingredients.map((ing, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-pop-yellow mt-1.5 shrink-0"></div>
                    <div>
                      <span className="font-bold">{ing.amount}</span> {ing.item}
                      {ing.note && <span className="block text-xs text-gray-400 italic">{ing.note}</span>}
                    </div>
                  </li>
                ))}
              </ul>
           </div>
        </div>

      </div>

      {/* Progress Bar (Global Step Progress) */}
      <div className="h-2 bg-gray-200 w-full relative z-20">
        <div 
          className="h-full bg-pop-red transition-all duration-300 ease-out"
          style={{ width: `${((currentStep + 1) / recipe.steps.length) * 100}%` }}
        ></div>
      </div>

      {/* Footer Controls */}
      <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex justify-between items-center gap-4 md:gap-6 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="flex-1 py-4 md:py-5 rounded-2xl bg-gray-50 text-gray-600 font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors border border-gray-200"
        >
          Anterior
        </button>
        <button 
          onClick={handleNext}
          disabled={currentStep === recipe.steps.length - 1}
          className="flex-[2] py-4 md:py-5 rounded-2xl bg-pop-dark text-white font-bold text-xl hover:bg-black transition-colors shadow-lg disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          {currentStep === recipe.steps.length - 1 ? (
             <>
               <span>Finalizar Receita</span>
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </>
          ) : 'Próximo Passo'}
        </button>
      </div>
    </div>
  );
};
